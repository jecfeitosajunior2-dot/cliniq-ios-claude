-- =============================================================================
-- ClinIQ — migration 0001 (Fase 1R2: arquitetura de privilégio, quota,
-- estado e exclusão corrigida após reprovação da Fase 1R)
-- =============================================================================
-- NÃO EXECUTADA. Entregue para revisão humana e execução manual futura no
-- SQL Editor do Supabase (ou via `supabase db push`), depois de aprovação.
-- Idempotente onde tecnicamente possível.
--
-- Reescreve por completo o desenho da Fase 1R original (RPC security
-- invoker sem GRANT/REVOKE, p_max_per_day como parâmetro de RPC, sem lease,
-- sem máquina de estados real, sem proteção de coluna, exclusão com
-- contrato HTTP inconsistente, Storage com policy de update direta do
-- navegador). Nenhuma das duas versões deste arquivo foi executada em
-- produção — esta substitui a anterior integralmente, não convive em
-- paralelo com ela.
--
-- Pré-requisito de ambiente: SUPABASE_SERVICE_ROLE_KEY definida no servidor
-- (nunca no navegador). Ver lib/supabase/privileged.ts e .env.local.example.
-- Sem essa chave, as rotas que dependem da camada privilegiada respondem
-- 503 — não há fallback silencioso para o privilégio do navegador.
--
-- Ordem de execução: rodar este arquivo inteiro, uma vez, depois de
-- aprovação humana. Rollback correspondente em 0001_phase1_hardening.down.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Consentimento — persistido por caso, sem conteúdo clínico no valor.
-- -----------------------------------------------------------------------------
alter table public.cases
  add column if not exists consent_confirmed_at timestamptz,
  add column if not exists consent_text_version text;

-- -----------------------------------------------------------------------------
-- 2) Estado do caso — enum válido (a máquina de transições real vem na
--    seção 8, via trigger; um CHECK sozinho não impede transições ilegais
--    entre valores válidos, só valida o domínio).
--    draft       -> rascunho criado no consentimento, antes da gravação.
--    recorded    -> áudio já está no Storage, pronto para transcrição.
--    transcribed -> transcrição persistida, pronto para o Clinical Detective.
--    ready       -> dossiê (intelligence) persistido.
--    failed      -> uma etapa do pipeline falhou; estado terminal (sem
--                   transição de saída definida nesta fase — ver relatório,
--                   seção 13, sobre a implicação de produto disso).
-- -----------------------------------------------------------------------------
alter table public.cases
  add column if not exists status text not null default 'draft';

alter table public.cases
  drop constraint if exists cases_status_check;
alter table public.cases
  add constraint cases_status_check
  check (status in ('draft', 'recorded', 'transcribed', 'ready', 'failed'));

-- -----------------------------------------------------------------------------
-- 3) Honestidade sobre consentimento — nunca fabricar consentimento para
--    linhas antigas. `legacy_pre_consent` marca explicitamente que uma linha
--    foi criada antes desta migration e não tem consentimento persistido
--    (não inventa conformidade legal; apenas documenta o fato). A partir da
--    Fase 1R2, também significa "somente leitura para transcrever/analisar"
--    (seção 8 e 9) — não é mais tratado como consentimento equivalente para
--    fins de processamento, só para fins de não bloquear a LEITURA do caso.
-- -----------------------------------------------------------------------------
alter table public.cases
  add column if not exists legacy_pre_consent boolean not null default false;

update public.cases
  set legacy_pre_consent = true
  where consent_confirmed_at is null
    and legacy_pre_consent = false;

-- A partir daqui, nenhuma linha nova pode existir sem consentimento
-- persistido OU a marca explícita de legado. Bloqueia no banco, não só na UI.
alter table public.cases
  drop constraint if exists cases_consent_required_check;
alter table public.cases
  add constraint cases_consent_required_check
  check (consent_confirmed_at is not null or legacy_pre_consent = true);

-- -----------------------------------------------------------------------------
-- 4) Exclusão recuperável e honesta.
-- -----------------------------------------------------------------------------
alter table public.cases
  add column if not exists delete_status text not null default 'active';

alter table public.cases
  drop constraint if exists cases_delete_status_check;
alter table public.cases
  add constraint cases_delete_status_check
  check (delete_status in ('active', 'delete_requested', 'deleting', 'delete_failed', 'deleted'));

alter table public.cases
  add column if not exists audio_removed boolean not null default false;

create index if not exists cases_delete_status_idx
  on public.cases (delete_status)
  where delete_status <> 'active';

create index if not exists cases_status_idx
  on public.cases (status);

-- -----------------------------------------------------------------------------
-- 5) Bloqueio de coluna em `cases` (item 4 da Fase 1R2): RLS é só row-level
--    — não impede que o navegador, com uma linha sua, grave campos
--    server-controlled (status, audio_path, transcription, intelligence,
--    cost_usd, consent_confirmed_at, consent_text_version,
--    legacy_pre_consent, delete_status, audio_removed). O mecanismo certo
--    para isso no Postgres é GRANT/REVOKE por coluna, não RLS nem trigger:
--    revoga o INSERT/UPDATE/DELETE genérico concedido por padrão pelo
--    provisionamento do Supabase ao papel `authenticated` e devolve apenas
--    as colunas que o médico de fato preenche pela UI.
--
--    Campos nunca incluídos nas listas abaixo (logo, não graváveis pelo
--    navegador de forma nenhuma): id, user_id, created_at, status,
--    audio_path, transcription, intelligence, cost_usd, findings_count,
--    summary, legacy_pre_consent, delete_status, audio_removed. Esses só
--    são graváveis pelo papel `service_role` (lib/supabase/privileged.ts),
--    chamado só depois de validar a sessão do usuário na rota Next.js.
-- -----------------------------------------------------------------------------
revoke insert, update, delete on public.cases from authenticated;

grant insert (
  user_id,
  consent_confirmed_at,
  consent_text_version,
  patient_name,
  patient_initials,
  age,
  gender,
  specialty,
  chief_complaint,
  case_data
) on public.cases to authenticated;

grant update (
  patient_name,
  patient_initials,
  age,
  gender,
  specialty,
  chief_complaint,
  case_data
) on public.cases to authenticated;

-- DELETE direto do navegador removido (cases_delete_own ficaria inalcançável
-- sem privilégio de tabela e seria um artefato enganoso) — toda exclusão
-- passa pela rota server-side, que usa o client privilegiado (seção 9).
drop policy if exists "cases_delete_own" on public.cases;

grant insert, update, delete on public.cases to service_role;

-- -----------------------------------------------------------------------------
-- 6) Quota e idempotência com lease — substitui `api_usage` (hash de
--    conteúdo) E o desenho anterior desta migration (RPC sem GRANT/REVOKE,
--    sem lease, `p_max_per_day` como parâmetro do cliente). A chave de
--    deduplicação continua sendo (case_id, operation) — nunca conteúdo
--    clínico.
--
--    `operation_started_at`/`lease_expires_at` substituem a dependência
--    pura de `finally`: uma reserva 'in_progress' cujo lease expirou pode
--    ser reivindicada por uma nova tentativa legítima sem ficar presa para
--    sempre, e sem nenhum predicate de índice usar `now()` (Postgres exige
--    predicados de índice imutáveis — `now()` é stable, não immutable, e
--    seria rejeitado pelo CREATE INDEX). A reivindicação de lease expirado
--    é feita dentro de begin_case_operation, lendo a linha com
--    `for update` sob o advisory lock por usuário — não em um índice.
-- -----------------------------------------------------------------------------
create table if not exists public.case_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  operation text not null check (operation in ('transcribe', 'detective')),
  -- Identificador gerado pelo servidor a cada tentativa (server-generated,
  -- não derivado de transcrição ou de qualquer dado clínico). Usado por
  -- finish_case_operation para garantir que só quem abriu ESTA reserva
  -- específica pode fechá-la — um worker antigo, referenciando um
  -- processing_job_id já substituído por uma reivindicação de lease
  -- expirado, não consegue mais fechar nem sobrescrever a reserva atual.
  processing_job_id text not null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'done', 'failed', 'expired')),
  operation_started_at timestamptz not null default now(),
  lease_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

-- Garante, de forma atômica, no máximo UMA operação *genuinamente ativa*
-- por caso+operação. Predicate imutável (literal 'in_progress', sem
-- now()) — é isso que torna o índice válido e estável.
create unique index if not exists case_operations_active_idx
  on public.case_operations (case_id, operation)
  where status = 'in_progress';

create index if not exists case_operations_user_created_idx
  on public.case_operations (user_id, created_at desc);

alter table public.case_operations enable row level security;

drop policy if exists "case_operations_select_own" on public.case_operations;
create policy "case_operations_select_own" on public.case_operations
  for select using (auth.uid() = user_id);

-- Sem policy de insert/update/delete para authenticated/anon — e sem GRANT
-- de tabela nenhum para esses papéis (só SELECT, via grant padrão do
-- Supabase + a policy acima). Toda escrita é feita pelas RPCs abaixo,
-- chamadas exclusivamente pela camada privilegiada (seção 7).
revoke insert, update, delete on public.case_operations from authenticated, anon;

-- -----------------------------------------------------------------------------
-- 7) RPCs internas — security definer, chamáveis SÓ por service_role.
--
--    Por que não dá para resolver isso só com RLS/security invoker: a rota
--    Next.js (getSupabaseServer) autentica com a MESMA anon key + os MESMOS
--    cookies de sessão do usuário que o navegador usaria se chamasse a RPC
--    diretamente via supabase-js. Não existe, nessa combinação, nenhuma
--    diferença de papel Postgres entre "Next.js retransmitindo a sessão do
--    usuário" e "navegador chamando direto" — os dois batem em PostgREST
--    como `authenticated`. Por isso o auth.uid() não é mais usado aqui como
--    fonte de identidade: o `p_user_id` chega como parâmetro explícito,
--    fornecido pela rota Next.js SOMENTE depois de validar a sessão do
--    usuário com o client comum (auth.getUser(), nunca de um campo do
--    corpo da requisição) — e a função revalida posse do caso com esse
--    p_user_id antes de qualquer leitura/escrita. A fronteira de segurança
--    real é o REVOKE/GRANT abaixo: só quem possui a service role key (um
--    segredo server-only, nunca lido pelo navegador) consegue sequer
--    invocar `begin_case_operation`/`finish_case_operation` — um usuário
--    autenticado chamando supabase.rpc(...) direto do navegador recebe
--    "permission denied for function", porque authenticated/anon/PUBLIC
--    perdem EXECUTE explicitamente.
--
--    search_path fixo (public, pg_temp) em todas: previne um ataque de
--    search-path hijacking onde um objeto malicioso em outro schema seria
--    resolvido antes do schema `public` pretendido.
--
--    Limite diário embutido como constante na função (server-controlled,
--    não é parâmetro do cliente) — mantenha v_max_per_day em sincronia
--    manual com PILOT_LIMITS.maxRequestsPerUserPerDay (lib/limits.ts); o
--    valor desta função é o que de fato é aplicado, o da TS é só para a
--    mensagem de erro/UX não divergir muito antes de bater no banco.
-- -----------------------------------------------------------------------------

create or replace function public.begin_case_operation(
  p_user_id uuid,
  p_case_id uuid,
  p_operation text,
  p_processing_job_id text
) returns public.case_operations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_max_per_day constant int := 30; -- sincronizar com PILOT_LIMITS.maxRequestsPerUserPerDay
  v_lease_duration constant interval := interval '15 minutes';
  v_case record;
  v_existing public.case_operations;
  v_count int;
  v_row public.case_operations;
begin
  if p_user_id is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;
  if p_operation not in ('transcribe', 'detective') then
    raise exception 'invalid operation' using errcode = '22023';
  end if;
  if p_processing_job_id is null or length(btrim(p_processing_job_id)) = 0 then
    raise exception 'invalid processing_job_id' using errcode = '22023';
  end if;

  -- Serializa concorrência do MESMO usuário até o fim da transação — tanto
  -- a reivindicação de lease expirado quanto a contagem de quota e o
  -- insert final precisam ser efetivamente atômicos entre tentativas
  -- concorrentes do mesmo médico.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  -- Posse + estado do caso. RLS não se aplica dentro de security definer
  -- (a função roda com o papel dono), então a posse é revalidada aqui
  -- explicitamente com p_user_id — nunca confiar em RLS para isso nesta
  -- função.
  select id, legacy_pre_consent, delete_status
    into v_case
    from public.cases
    where id = p_case_id and user_id = p_user_id;

  if not found then
    raise exception 'case not found or not owned' using errcode = '42501';
  end if;
  if v_case.delete_status <> 'active' then
    raise exception 'case not active' using errcode = '22023';
  end if;
  if v_case.legacy_pre_consent then
    raise exception 'legacy case not processable' using errcode = '22023';
  end if;

  -- Reivindica lease expirado antes de checar duplicidade/quota: uma
  -- reserva 'in_progress' cujo lease já passou vira 'expired' aqui, sob o
  -- mesmo advisory lock, e libera o índice único parcial para a nova
  -- tentativa.
  select *
    into v_existing
    from public.case_operations
    where case_id = p_case_id and operation = p_operation and status = 'in_progress'
    for update;

  if found then
    if v_existing.lease_expires_at >= now() then
      raise exception 'duplicate operation in progress' using errcode = '23505';
    end if;
    update public.case_operations
      set status = 'expired', finished_at = now()
      where id = v_existing.id;
  end if;

  -- Quota: conta TODA reserva feita na janela de 24h, qualquer status —
  -- inclusive 'failed'/'expired'. O custo de uma chamada à OpenAI/Anthropic
  -- pode já ter sido incorrido mesmo quando a operação termina em falha ou
  -- expira sem confirmação; contar só 'in_progress'/'done' (desenho
  -- anterior) permitia estourar o orçamento real do piloto reabrindo
  -- tentativas que falham de propósito.
  select count(*)
    into v_count
    from public.case_operations
    where user_id = p_user_id
      and created_at >= now() - interval '24 hours';

  if v_count >= v_max_per_day then
    raise exception 'daily limit exceeded' using errcode = 'P0001', hint = 'rate_limit';
  end if;

  begin
    insert into public.case_operations (
      user_id, case_id, operation, processing_job_id, status,
      operation_started_at, lease_expires_at
    ) values (
      p_user_id, p_case_id, p_operation, p_processing_job_id, 'in_progress',
      now(), now() + v_lease_duration
    )
    returning * into v_row;
  exception
    when unique_violation then
      raise exception 'duplicate operation in progress' using errcode = '23505';
  end;

  return v_row;
end;
$$;

create or replace function public.finish_case_operation(
  p_user_id uuid,
  p_case_id uuid,
  p_operation text,
  p_processing_job_id text,
  p_status text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;
  if p_status not in ('done', 'failed') then
    raise exception 'invalid status' using errcode = '22023';
  end if;

  -- processing_job_id precisa bater com o da reserva atual: impede que um
  -- worker desatualizado (cujo lease já expirou e foi reivindicado por uma
  -- tentativa mais nova, com um processing_job_id diferente) feche ou
  -- sobrescreva a reserva da tentativa nova quando ele finalmente responde.
  update public.case_operations
    set status = p_status, finished_at = now()
    where case_id = p_case_id
      and operation = p_operation
      and user_id = p_user_id
      and processing_job_id = p_processing_job_id
      and status = 'in_progress';

  if not found then
    raise exception 'no matching in-progress operation to finish' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.begin_case_operation(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.finish_case_operation(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.begin_case_operation(uuid, uuid, text, text) to service_role;
grant execute on function public.finish_case_operation(uuid, uuid, text, text, text) to service_role;

-- -----------------------------------------------------------------------------
-- 8) Máquina de estados real de `cases.status`, via trigger — o CHECK da
--    seção 2 só valida o domínio (os 5 valores possíveis), não a
--    transição. Este trigger valida a transição E pré-condições de dados
--    (consentimento, áudio vinculado, transcrição/dossiê presentes) antes
--    de aceitar cada mudança de estado, independente de quem está
--    escrevendo (inclusive service_role — não é uma checagem de
--    autorização, é uma checagem de integridade de dados).
--
--    Transições permitidas: draft->recorded, recorded->transcribed,
--    transcribed->ready, {draft|recorded|transcribed}->failed. `ready`,
--    `failed` e `deleted` (linha já em delete_status='deleted', tratado à
--    parte) são terminais nesta fase — não há transição de saída definida
--    para 'failed' neste esquema (ver relatório, riscos remanescentes).
-- -----------------------------------------------------------------------------
create or replace function public.enforce_case_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'draft' and new.status in ('recorded', 'failed')) or
    (old.status = 'recorded' and new.status in ('transcribed', 'failed')) or
    (old.status = 'transcribed' and new.status in ('ready', 'failed'))
  ) then
    raise exception 'transição de status inválida: % -> %', old.status, new.status
      using errcode = '22023';
  end if;

  if new.status = 'recorded' then
    if new.consent_confirmed_at is null and not new.legacy_pre_consent then
      raise exception 'não é possível marcar como gravado sem consentimento persistido'
        using errcode = '22023';
    end if;
    if new.audio_path is null then
      raise exception 'não é possível marcar como gravado sem audio_path'
        using errcode = '22023';
    end if;
  end if;

  if new.status = 'transcribed' then
    if new.audio_path is null then
      raise exception 'não é possível marcar como transcrito sem áudio vinculado'
        using errcode = '22023';
    end if;
    if new.transcription is null then
      raise exception 'não é possível marcar como transcrito sem transcrição persistida'
        using errcode = '22023';
    end if;
  end if;

  if new.status = 'ready' then
    if new.transcription is null or new.intelligence is null then
      raise exception 'não é possível marcar como pronto sem transcrição e dossiê'
        using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists cases_status_transition_trg on public.cases;
create trigger cases_status_transition_trg
  before update on public.cases
  for each row
  when (new.status is distinct from old.status)
  execute function public.enforce_case_status_transition();

-- -----------------------------------------------------------------------------
-- 9) Imutabilidade de `legacy_pre_consent` — settable só pelo backfill
--    desta migration (que roda na seção 3, antes deste trigger existir).
--    Depois de criado, nenhuma UPDATE consegue mudar o valor — nem o
--    navegador, nem uma rota usando o client comum, nem a camada
--    privilegiada. Não é um bypass de autorização: é uma trava de
--    integridade sobre um marcador histórico que nunca deve ser reescrito.
--    Uma correção legítima futura (ex.: erro de backfill) exige um SQL
--    manual avulso fora do código de aplicação, não um novo caminho aqui.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_legacy_pre_consent_immutable()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.legacy_pre_consent is distinct from old.legacy_pre_consent then
    raise exception 'legacy_pre_consent é imutável fora do backfill da migration'
      using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists cases_legacy_pre_consent_immutable_trg on public.cases;
create trigger cases_legacy_pre_consent_immutable_trg
  before update on public.cases
  for each row
  execute function public.enforce_legacy_pre_consent_immutable();

-- -----------------------------------------------------------------------------
-- 10) Storage: remove TODAS as policies que permitiam ao navegador
--     ler/gravar/apagar objetos do bucket `consultations` diretamente.
--     A partir desta migration, todo acesso ao áudio é mediado por uma
--     rota Next.js usando o client privilegiado:
--       - upload: a rota emite uma signed upload URL (criada com o client
--         privilegiado) vinculada ao path canônico do caso; o navegador
--         faz PUT só nessa URL assinada, de uso único — não precisa mais
--         de policy de INSERT nem de UPDATE/upsert direta (item 6: a
--         dependência de upsert:true do desenho anterior some).
--       - leitura (transcrição): a rota gera a signed URL de leitura com o
--         client privilegiado, não mais com o client de sessão do usuário.
--       - exclusão: a rota remove o objeto com o client privilegiado,
--         dentro do fluxo de exclusão recuperável — o navegador não pode
--         mais apagar o áudio por fora desse fluxo e corromper o
--         bookkeeping de delete_status/audio_removed.
-- -----------------------------------------------------------------------------
drop policy if exists "consultations_read_own" on storage.objects;
drop policy if exists "consultations_insert_own" on storage.objects;
drop policy if exists "consultations_update_own" on storage.objects;
drop policy if exists "consultations_delete_own" on storage.objects;

-- -----------------------------------------------------------------------------
-- Comentários de segurança.
-- -----------------------------------------------------------------------------
comment on function public.begin_case_operation is
  'Reserva atômica de quota+idempotência (lease) para uma operação paga (transcribe/detective). security definer, EXECUTE só para service_role — nunca chamável por anon/authenticated. p_user_id vem validado pela rota Next.js via auth.getUser(), nunca de auth.uid() (que não resolve sob service_role) nem de payload do cliente. Nunca recebe nem grava conteúdo clínico.';
comment on function public.finish_case_operation is
  'Fecha a operação reservada por begin_case_operation, validando processing_job_id para impedir que um worker desatualizado feche/sobrescreva uma reserva mais nova. security definer, EXECUTE só para service_role.';
comment on function public.enforce_case_status_transition is
  'Máquina de estados de cases.status: valida transição + pré-condições de dados (consentimento, áudio, transcrição, dossiê). Roda para qualquer escritor, inclusive service_role — é integridade de dados, não autorização.';
comment on function public.enforce_legacy_pre_consent_immutable is
  'Bloqueia qualquer UPDATE que altere legacy_pre_consent após a criação da linha. Settable só pelo backfill desta migration.';
comment on table public.case_operations is
  'Lock + contador de uso por (usuário, caso, operação), com lease (operation_started_at/lease_expires_at) para recuperação de operações travadas sem depender de finally. Chave de deduplicação é estrutural (case_id+operation), nunca hash de conteúdo clínico. INSERT/UPDATE/DELETE só via as RPCs acima, chamadas só pela camada privilegiada.';
comment on column public.cases.legacy_pre_consent is
  'true = linha criada antes da exigência de consentimento persistido; imutável após criação (trigger). A partir da Fase 1R2, também bloqueia (re)processamento — não é tratado como consentimento equivalente para transcribe/detective, só evita quebrar a leitura/listagem do caso.';
