-- =============================================================================
-- ClinIQ — rollback da migration 0001 (Fase 1R2: arquitetura de privilégio,
-- quota, estado e exclusão)
-- =============================================================================
-- NÃO EXECUTADA. Reverte exatamente o que 0001_phase1_hardening.up.sql (versão
-- Fase 1R2) cria. Execute apenas depois de revisão humana, e só se a
-- migration forward precisar ser desfeita (ex.: problema encontrado em
-- staging).
--
-- AVISO DE DESTRUTIVIDADE (mantido da Fase 1R):
-- As instruções "drop column" abaixo destroem dados se o sistema já estiver
-- em uso real com casos em estados diferentes de 'draft', com consentimento
-- persistido, ou com exclusões em andamento. Isso é aceitável apenas porque,
-- no momento em que esta migration forward é proposta, o piloto ainda não
-- tem dados clínicos reais persistidos nessas colunas (nenhuma migration foi
-- executada ainda, nem a versão Fase 1R nem esta). Se este rollback for
-- necessário DEPOIS de uso real em produção, faça backup das colunas
-- (status, delete_status, audio_removed, legacy_pre_consent,
-- consent_confirmed_at, consent_text_version) e da tabela case_operations
-- (inclusive lease/processing_job_id, para investigar operações em curso)
-- antes de rodar este arquivo. Não rode às cegas.
--
-- AVISO ADICIONAL (específico da Fase 1R2): este rollback também devolve ao
-- papel `authenticated` o privilégio de gravar QUALQUER coluna de `cases`
-- (inclusive status/audio_path/transcription/intelligence/cost_usd) e
-- restaura as policies de Storage que permitiam ao navegador ler/gravar
-- objetos do bucket `consultations` diretamente. Isso reabre exatamente as
-- falhas de integridade que a Fase 1R2 corrigiu (itens 1, 4 e 6 do
-- hardening) — só rode este arquivo se a intenção for voltar ao
-- comportamento pré-Fase-1R2 por completo, não como correção parcial. Se o
-- objetivo é só desfazer UM item específico, edite uma cópia deste arquivo
-- em vez de rodá-lo inteiro.
-- =============================================================================

-- 1) RPCs — sempre seguro remover primeiro (sem perda de dados de caso).
--    Assinaturas com 5/4 argumentos: versão Fase 1R2 (p_user_id explícito +
--    p_processing_job_id em finish_case_operation).
drop function if exists public.finish_case_operation(uuid, uuid, text, text, text);
drop function if exists public.begin_case_operation(uuid, uuid, text, text);

-- 2) Triggers de máquina de estados e imutabilidade de legacy_pre_consent,
--    e as funções que os implementam.
drop trigger if exists cases_status_transition_trg on public.cases;
drop function if exists public.enforce_case_status_transition();

drop trigger if exists cases_legacy_pre_consent_immutable_trg on public.cases;
drop function if exists public.enforce_legacy_pre_consent_immutable();

-- 3) Storage — restaura as 3 policies originais de schema.sql (leitura,
--    insert e delete da própria pasta). NÃO restaura
--    "consultations_update_own": era exclusiva do desenho upsert:true da
--    Fase 1R, substituído por signed upload na Fase 1R2 — recriá-la aqui
--    reabriria a necessidade de UPDATE direto do navegador sem nenhum
--    fluxo do código atual depender dela.
drop policy if exists "consultations_read_own" on storage.objects;
create policy "consultations_read_own" on storage.objects
  for select using (
    bucket_id = 'consultations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "consultations_insert_own" on storage.objects;
create policy "consultations_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'consultations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "consultations_delete_own" on storage.objects;
create policy "consultations_delete_own" on storage.objects
  for delete using (
    bucket_id = 'consultations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) Tabela de operações — perde apenas histórico de uso/idempotência/lease,
--    nunca conteúdo clínico (a tabela nunca armazenou transcrição ou texto).
drop table if exists public.case_operations;

-- 5) Índices criados em `cases` por esta migration.
drop index if exists public.cases_status_idx;
drop index if exists public.cases_delete_status_idx;

-- 6) Privilégios de coluna em `cases` — devolve o acesso amplo original ao
--    papel authenticated (ver AVISO ADICIONAL acima) e remove os grants do
--    service_role concedidos por esta migration.
revoke insert, update, delete on public.cases from service_role;
revoke insert, update on public.cases from authenticated;
grant insert, update, delete on public.cases to authenticated;

drop policy if exists "cases_delete_own" on public.cases;
create policy "cases_delete_own" on public.cases
  for delete using (auth.uid() = user_id);

-- 7) Constraints criadas em `cases` por esta migration.
alter table public.cases drop constraint if exists cases_consent_required_check;
alter table public.cases drop constraint if exists cases_delete_status_check;
alter table public.cases drop constraint if exists cases_status_check;

-- 8) Colunas — DESTRUTIVO. Remove status de exclusão, estado do pipeline e
--    consentimento persistido. Ver aviso no topo do arquivo.
alter table public.cases
  drop column if exists audio_removed,
  drop column if exists delete_status,
  drop column if exists legacy_pre_consent,
  drop column if exists status,
  drop column if exists consent_confirmed_at,
  drop column if exists consent_text_version;
