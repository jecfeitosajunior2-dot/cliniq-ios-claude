-- =====================================================================
-- STAGING VERIFICATION — FASE 1R2
-- =====================================================================
-- Como usar:
--   1. Crie um branch Supabase (ou use um projeto de staging descartável).
--   2. Aplique a migration: supabase/migrations/0001_phase1_hardening.up.sql
--   3. Cole este arquivo no SQL editor e rode bloco a bloco.
--   4. Cada bloco tem o RESULTADO ESPERADO comentado. Se divergir, anote.
--
-- IMPORTANTE: NÃO rode isto em produção. NÃO use dados clínicos reais.
-- Os INSERTs usam dados sintéticos (iniciais "XX", notas fictícias).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. PRÉ-CHECK: a migration foi aplicada?
-- ---------------------------------------------------------------------
-- Esperado: as colunas novas existem em `cases`, e a tabela
-- `case_operations` existe.

select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'cases'
  and column_name in (
    'consent_confirmed_at','consent_text_version','legacy_pre_consent',
    'delete_status','audio_removed'
  )
order by column_name;
-- ESPERADO: 5 linhas (audio_removed, consent_confirmed_at,
--           consent_text_version, delete_status, legacy_pre_consent)

select to_regclass('public.case_operations') as case_operations_exists;
-- ESPERADO: public.case_operations (não NULL)


-- ---------------------------------------------------------------------
-- 1. RPCs: SECURITY DEFINER + search_path fixo + GRANT só p/ service_role
-- ---------------------------------------------------------------------
select
  p.proname,
  p.prosecdef            as security_definer,
  p.proconfig            as config_search_path
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('begin_case_operation','finish_case_operation');
-- ESPERADO: 2 linhas; security_definer = true;
--           config_search_path contém search_path=public, pg_temp

-- Quem pode EXECUTAR os RPCs?
select
  r.routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges rp
join information_schema.routines r
  on r.specific_name = rp.specific_name
where r.routine_schema = 'public'
  and r.routine_name in ('begin_case_operation','finish_case_operation')
order by r.routine_name, grantee;
-- ESPERADO: NENHUMA linha com grantee = 'authenticated', 'anon' ou 'PUBLIC'.
--           Apenas service_role (e o owner) devem aparecer.


-- ---------------------------------------------------------------------
-- 2. GRANTS de coluna em `cases` para o role `authenticated`
-- ---------------------------------------------------------------------
select privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'cases'
  and grantee = 'authenticated'
order by privilege_type, column_name;
-- ESPERADO:
--   INSERT em: user_id, consent_confirmed_at, consent_text_version,
--              patient_name, patient_initials, age, gender, specialty,
--              chief_complaint, case_data  (apenas estas)
--   UPDATE em: patient_name, patient_initials, age, gender, specialty,
--              chief_complaint, case_data  (apenas estas)
--   NENHUM grant em: status, audio_path, transcription, intelligence,
--                    cost_usd, consent_confirmed_at (UPDATE),
--                    legacy_pre_consent, delete_status, audio_removed

-- Sanidade: authenticated NÃO deve ter privilégio de tabela inteira
select privilege_type
from information_schema.role_table_grants
where table_schema='public' and table_name='cases'
  and grantee='authenticated';
-- ESPERADO: no máximo SELECT (escrita só por coluna, verificada acima).


-- ---------------------------------------------------------------------
-- 3. case_operations: índice único parcial + REVOKE de escrita
-- ---------------------------------------------------------------------
select indexname, indexdef
from pg_indexes
where schemaname='public' and tablename='case_operations';
-- ESPERADO: ver case_operations_active_idx com
--           WHERE (status = 'in_progress') e SEM now() no predicate.

select privilege_type, grantee
from information_schema.role_table_grants
where table_schema='public' and table_name='case_operations'
  and grantee in ('authenticated','anon')
order by grantee, privilege_type;
-- ESPERADO: no máximo SELECT para authenticated; nada de INSERT/UPDATE/DELETE.


-- ---------------------------------------------------------------------
-- 4. Triggers existem em `cases`
-- ---------------------------------------------------------------------
select tgname
from pg_trigger
where tgrelid = 'public.cases'::regclass
  and not tgisinternal
order by tgname;
-- ESPERADO: cases_legacy_pre_consent_immutable_trg, cases_status_transition_trg
--           (nomes dos TRIGGERS; as funções chamadas são
--            enforce_case_status_transition / enforce_legacy_pre_consent_immutable)


-- ---------------------------------------------------------------------
-- 5. Storage: as 4 políticas antigas do bucket consultations sumiram?
-- ---------------------------------------------------------------------
select policyname
from pg_policies
where schemaname='storage' and tablename='objects'
  and policyname in (
    'consultations_read_own','consultations_insert_own',
    'consultations_update_own','consultations_delete_own'
  );
-- ESPERADO: NENHUMA linha — as 4 políticas antigas de upload/acesso/update/
--           delete direto pelo browser foram removidas. (Acesso ao bucket
--           passa a ser só service_role.)


-- =====================================================================
-- TESTES FUNCIONAIS (rodar como service_role no SQL editor; depois
-- simular o role authenticated com SET ROLE para provar o bloqueio).
-- =====================================================================

-- Limpeza preventiva de qualquer resíduo destes testes
delete from public.case_operations where case_id in (
  select id from public.cases where patient_initials = 'XX'
);
delete from public.cases where patient_initials = 'XX';


-- ---------------------------------------------------------------------
-- 6. Máquina de estados: transição ilegal é bloqueada pelo trigger
-- ---------------------------------------------------------------------
-- Cria um caso draft sintético (service_role)
insert into public.cases (id, user_id, patient_initials, chief_complaint,
                          consent_confirmed_at, consent_text_version, status)
values (gen_random_uuid(),
        (select id from auth.users limit 1),  -- qualquer user real de staging
        'XX', 'queixa fictícia',
        now(), 'v1', 'draft')
returning id;
-- Guarde o id retornado; substitua <CASE_ID> abaixo.

-- 6a. draft -> ready (PULA etapas): deve FALHAR
--     update public.cases set status='ready' where id='<CASE_ID>';
--     ESPERADO: ERROR (transição ilegal bloqueada pelo trigger)

-- 6b. draft -> recorded SEM audio_path: deve FALHAR
--     update public.cases set status='recorded' where id='<CASE_ID>';
--     ESPERADO: ERROR (recorded exige audio_path + consent)


-- ---------------------------------------------------------------------
-- 7. legacy_pre_consent é imutável
-- ---------------------------------------------------------------------
-- 7a. Tenta alterar legacy_pre_consent num caso existente: deve FALHAR
--     update public.cases set legacy_pre_consent=true where id='<CASE_ID>';
--     ESPERADO: ERROR (immutability trigger)


-- ---------------------------------------------------------------------
-- 8. authenticated NÃO consegue escrever campos server-controlled
-- ---------------------------------------------------------------------
-- Simula o role do browser:
--     set role authenticated;
--     update public.cases set status='ready' where id='<CASE_ID>';
--     ESPERADO: ERROR: permission denied for column status
--     reset role;


-- ---------------------------------------------------------------------
-- 9. authenticated NÃO consegue invocar os RPCs internos
-- ---------------------------------------------------------------------
--     set role authenticated;
--     select begin_case_operation(
--       (select id from auth.users limit 1), '<CASE_ID>', 'transcribe',
--       gen_random_uuid());
--     ESPERADO: ERROR: permission denied for function begin_case_operation
--     reset role;


-- ---------------------------------------------------------------------
-- 10. Limite diário conta TODA operação na janela móvel de 24h
-- ---------------------------------------------------------------------
-- A contagem real é: count(*) where user_id = ? and created_at >=
-- now() - interval '24 hours' — SEM filtro de status, então 'failed' e
-- 'expired' contam igual a 'done'. Limite = 30 (v_max_per_day).
--
-- Para provar: insira 30 linhas sintéticas com status='failed' para um
-- user e então tente begin_case_operation com esse user.
--
--   insert into public.case_operations
--     (user_id, case_id, operation, processing_job_id, status,
--      operation_started_at, lease_expires_at, created_at)
--   select '<USER_ID>', '<CASE_ID>', 'transcribe', gen_random_uuid(),
--          'failed', now(), now(), now()
--   from generate_series(1, 30);
--
--   select begin_case_operation('<USER_ID>', '<CASE_ID>', 'transcribe',
--                               gen_random_uuid());
--   ESPERADO: ERROR 'daily limit exceeded' (failed contou para o limite)


-- ---------------------------------------------------------------------
-- LIMPEZA FINAL
-- ---------------------------------------------------------------------
delete from public.case_operations where case_id in (
  select id from public.cases where patient_initials = 'XX'
);
delete from public.cases where patient_initials = 'XX';
-- Depois de tudo verde, descarte o branch Supabase para parar a cobrança.
