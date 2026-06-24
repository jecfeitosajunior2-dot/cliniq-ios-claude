# Roteiro de Testes End-to-End — FASE 1R2

**Branch:** `hardening/cliniq-phase1-trust`  
**Ambiente:** preview / staging (NUNCA produção, NUNCA dados clínicos reais)  
**Pré-requisito:** migration `0001_phase1_hardening.up.sql` aplicada e verificada com `staging-verification.sql`

---

## Preparação

### Ferramentas necessárias
- Browser (Chrome/Safari) com DevTools aberto na aba **Network**
- [Bruno](https://usebruno.com) ou **curl** para testes de API direta
- **SQL Editor do Supabase** (projeto de staging) para consultas de verificação

### Variáveis que você vai precisar
Após criar um usuário de teste e um caso, anote:

| Variável         | Como obter                                          |
|------------------|-----------------------------------------------------|
| `PREVIEW_URL`    | URL do preview do branch no Vercel/Lovable          |
| `USER_ID`        | SQL: `select id from auth.users where email='...'` |
| `CASE_ID`        | Retornado pelo app ao criar o caso, ou via SQL      |
| `ANON_KEY`       | Supabase → Project Settings → API → anon public key |
| `PROJECT_REF`    | Supabase → Project Settings → Reference ID          |

### Query de inspeção rápida
Use no SQL Editor durante todos os fluxos para checar o estado do caso:

```sql
select id, status, audio_path, delete_status, audio_removed,
       legacy_pre_consent, consent_confirmed_at, cost_usd,
       created_at, updated_at
from public.cases
where patient_initials = 'TE'  -- iniciais do paciente fictício
order by created_at desc;
```

---

## Fluxo 1 — Upload via URL assinada (happy path)

**Objetivo:** confirmar que o upload de áudio ocorre exclusivamente via token assinado pelo servidor, sem nenhuma escrita direta do browser no bucket.

### Passos

**1.1 — Criar um caso draft**

No app: faça login → crie um novo caso com iniciais `TE`, `chief_complaint` fictícia, confirme o consentimento.

No SQL Editor, verifique:
```sql
select status, consent_confirmed_at, consent_text_version, audio_path, delete_status
from public.cases
where patient_initials = 'TE' order by created_at desc limit 1;
```
**Esperado:** `status = 'draft'`, `consent_confirmed_at IS NOT NULL`, `audio_path IS NULL`, `delete_status = 'active'`

---

**1.2 — Solicitar URL assinada**

No DevTools (Network), filtre por `/audio-url`. Inicie a gravação de áudio no app.

Quando aparecer a chamada `POST /api/cases/{CASE_ID}/audio-url`:

- **Status esperado:** `200`
- **Body esperado:**
  ```json
  { "path": "{USER_ID}/{CASE_ID}/audio.webm", "token": "..." }
  ```

Verifique que:
- O path tem formato `{USER_ID}/{CASE_ID}/audio.{ext}` — gerado pelo servidor, nunca aceito do cliente
- O token é opaco (JWT assinado pelo Supabase Storage)

---

**1.3 — Upload para o Storage**

O app faz `PUT` direto ao endpoint do Supabase Storage com o token no header.

No DevTools, localize a chamada `PUT` para `*.supabase.co/storage/v1/upload/sign/...`:

- **Status esperado:** `200`
- Confirme que o `Authorization` header contém o token assinado, **não** a anon key nem uma chave de sessão

---

**1.4 — Confirmar upload**

Após o upload, o app faz `POST /api/cases/{CASE_ID}/audio-confirm` com body `{ "mimeType": "audio/webm" }`.

- **Status esperado:** `200`
- **Body esperado:** `{ "ok": true }`

No SQL Editor, verifique:
```sql
select status, audio_path
from public.cases where id = '{CASE_ID}';
```
**Esperado:** `status = 'recorded'`, `audio_path = '{USER_ID}/{CASE_ID}/audio.webm'`

---

**1.5 — Rejeição de path adulterado (ataque de path traversal)**

Via curl, simule um cliente mal-intencionado que tenta confirmar um path diferente:

```bash
# Obtenha o cookie de sessão do browser (DevTools → Application → Cookies)
curl -s -X POST "$PREVIEW_URL/api/cases/$CASE_ID/audio-confirm" \
  -H "Content-Type: application/json" \
  -H "Cookie: <session_cookie>" \
  -d '{"mimeType":"audio/webm","path":"outro-user/outro-caso/audio.webm"}'
```

**Esperado:** `200 { "ok": true }` se o arquivo estava no path canônico OU `422` se o path canônico não existia — em ambos os casos, o campo `path` enviado pelo cliente é **ignorado**. O servidor sempre recalcula `{userId}/{caseId}/audio.{ext}`.

Verifique no SQL que `audio_path` contém o path canônico, jamais o path enviado pelo cliente.

---

## Fluxo 2 — Rejeição de caso legado

**Objetivo:** confirmar que casos com `legacy_pre_consent = true` são bloqueados antes de qualquer operação de áudio.

### Pré-requisito

No SQL Editor, crie um caso legado sintético (exige `service_role`):

```sql
insert into public.cases (
  id, user_id, patient_initials, chief_complaint,
  consent_confirmed_at, consent_text_version,
  status, legacy_pre_consent
)
values (
  gen_random_uuid(),
  '{USER_ID}',
  'TE', 'caso legado fictício',
  null, null,
  'draft', true
)
returning id;
-- Anote o id retornado como LEGACY_CASE_ID
```

### Passos

**2.1 — Tentativa de solicitar URL assinada para caso legado**

```bash
curl -s -X POST "$PREVIEW_URL/api/cases/$LEGACY_CASE_ID/audio-url" \
  -H "Content-Type: application/json" \
  -H "Cookie: <session_cookie>" \
  -d '{"mimeType":"audio/webm"}'
```

**Esperado:** `403`
```json
{ "error": "Este caso é anterior à exigência de consentimento e não pode ser processado." }
```

**2.2 — Tentativa de confirmar upload para caso legado**

```bash
curl -s -X POST "$PREVIEW_URL/api/cases/$LEGACY_CASE_ID/audio-confirm" \
  -H "Content-Type: application/json" \
  -H "Cookie: <session_cookie>" \
  -d '{"mimeType":"audio/webm"}'
```

**Esperado:** `403` (mesma mensagem)

**2.3 — Tentativa de transcrição de caso legado**

```bash
curl -s -X POST "$PREVIEW_URL/api/transcribe" \
  -H "Content-Type: application/json" \
  -H "Cookie: <session_cookie>" \
  -d '{"caseId":"$LEGACY_CASE_ID"}'
```

**Esperado:** `403`
```json
{ "error": "Este caso é legado (anterior ao consentimento) e não pode ser processado." }
```

---

## Fluxo 3 — Transcrição com lease e contagem de quota

**Objetivo:** verificar que `begin_case_operation` / `finish_case_operation` funcionam e que operações falhas são contadas no limite diário.

**Pré-requisito:** ter completado o Fluxo 1 (caso com `status = 'recorded'`).

### Passos

**3.1 — Transcrição normal**

No app, inicie a transcrição do caso gravado no Fluxo 1.

Durante o processamento, no SQL Editor:
```sql
select operation, status, processing_job_id,
       operation_started_at, lease_expires_at
from public.case_operations
where case_id = '{CASE_ID}'
order by created_at desc limit 1;
```
**Esperado durante processamento:** `status = 'in_progress'`, `lease_expires_at` ~10 minutos à frente.

Após conclusão:
```sql
select status, transcription is not null as has_transcription, cost_usd
from public.cases where id = '{CASE_ID}';

select operation, status
from public.case_operations where case_id = '{CASE_ID}';
```
**Esperado:** `status = 'transcribed'`, `has_transcription = true`; operação com `status = 'done'`

---

**3.2 — Contagem de quota inclui falhas**

No SQL Editor, insira 30 operações com `status = 'failed'` para o usuário de teste:

```sql
insert into public.case_operations
  (user_id, case_id, operation, processing_job_id, status,
   operation_started_at, lease_expires_at, created_at)
select
  '{USER_ID}', '{CASE_ID}', 'transcribe',
  gen_random_uuid(), 'failed',
  now(), now(), now()
from generate_series(1, 30);
```

Agora tente iniciar uma nova transcrição via app (ou via curl se `/api/transcribe` estiver acessível):

**Esperado:** `429`
```json
{ "error": "Limite diário de operações atingido. Tente novamente amanhã." }
```

No SQL, confirme a contagem:
```sql
select count(*)
from public.case_operations
where user_id = '{USER_ID}'
  and created_at >= now() - interval '24 hours';
-- Esperado: 31 (30 failed + 1 done da etapa 3.1)
```

**Limpeza após o teste:**
```sql
delete from public.case_operations
where user_id = '{USER_ID}' and status = 'failed';
```

---

**3.3 — Lease impede worker duplicado**

Insira manualmente uma operação `in_progress` com lease ativo para o mesmo caso:

```sql
insert into public.case_operations
  (user_id, case_id, operation, processing_job_id, status,
   operation_started_at, lease_expires_at)
values (
  '{USER_ID}', '{CASE_ID}', 'transcribe',
  gen_random_uuid(), 'in_progress',
  now(), now() + interval '10 minutes'
);
```

Tente iniciar outra transcrição:

**Esperado:** `409`
```json
{ "error": "Já existe uma operação em andamento para este caso. Aguarde." }
```

**Limpeza:**
```sql
update public.case_operations
set status = 'expired'
where case_id = '{CASE_ID}' and status = 'in_progress';
```

---

## Fluxo 4 — Exclusão recuperável

**Objetivo:** verificar os estados `deleting → deleted` e a retentativa após `delete_failed`.

**Pré-requisito:** ter um caso com `status = 'recorded'` e `audio_path` preenchido (do Fluxo 1).

### Passos

**4.1 — Exclusão bem-sucedida**

No app, exclua o caso. No SQL Editor, verifique após exclusão:

```sql
select delete_status, audio_removed, audio_path
from public.cases where id = '{CASE_ID}';
```
**Esperado:** `delete_status = 'deleted'`, `audio_removed = true`

Verifique também que o objeto sumiu do Storage:
```sql
-- No SQL Editor com service_role (não há policy de SELECT para authenticated)
select name from storage.objects
where bucket_id = 'consultations'
  and name = '{USER_ID}/{CASE_ID}/audio.webm';
-- Esperado: nenhuma linha
```

**4.2 — Idempotência (segunda requisição de exclusão)**

```bash
curl -s -X DELETE "$PREVIEW_URL/api/cases/$CASE_ID" \
  -H "Cookie: <session_cookie>"
```
**Esperado:** `200` (não 404, não 500 — caso já excluído retorna sucesso idempotente)

**4.3 — Exclusão de outro usuário (autorização)**

```bash
# Faça login com um segundo usuário de teste e use o cookie dele
curl -s -X DELETE "$PREVIEW_URL/api/cases/$CASE_ID" \
  -H "Cookie: <session_cookie_user2>"
```
**Esperado:** `403`

**4.4 — Simulação de delete_failed e retentativa**

No SQL Editor, force o estado de falha em um caso novo (crie um caso `recorded` com `audio_path` válido antes):

```sql
update public.cases
set delete_status = 'delete_failed'
where id = '{CASE_ID_2}';
```

Agora tente excluir via app (ou curl):

```bash
curl -s -X DELETE "$PREVIEW_URL/api/cases/$CASE_ID_2" \
  -H "Cookie: <session_cookie>"
```

**Esperado:** a rota aceita o caso em `delete_failed` (está no `IN ('active', 'delete_requested', 'delete_failed')`) e procede normalmente até `deleted`.

---

## Fluxo 5 — Bloqueios de segurança diretos

**Objetivo:** confirmar que o browser não consegue escrever no Storage nem em campos server-controlled diretamente.

### 5.1 — Upload direto ao bucket sem token assinado

```bash
# Tenta fazer PUT sem token assinado — usa apenas a anon key
curl -s -X PUT \
  "https://{PROJECT_REF}.supabase.co/storage/v1/object/consultations/{USER_ID}/teste/audio.webm" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: audio/webm" \
  --data-binary @qualquer_arquivo.webm
```
**Esperado:** `403` ou `400` (Storage nega — não existe policy de INSERT para `anon`/`authenticated`)

### 5.2 — Escrita de campo `status` via REST do Supabase com role authenticated

```bash
# Obtém JWT de sessão do usuário autenticado (não service_role)
SESSION_JWT="<jwt_do_cookie_de_sessão>"

curl -s -X PATCH \
  "https://{PROJECT_REF}.supabase.co/rest/v1/cases?id=eq.{CASE_ID}" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SESSION_JWT" \
  -H "Content-Type: application/json" \
  -d '{"status": "ready"}'
```
**Esperado:** `403` — `permission denied for column status` (REVOKE de coluna em vigor)

### 5.3 — Escrita de `audio_path` via REST authenticated

```bash
curl -s -X PATCH \
  "https://{PROJECT_REF}.supabase.co/rest/v1/cases?id=eq.{CASE_ID}" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SESSION_JWT" \
  -H "Content-Type: application/json" \
  -d '{"audio_path": "injetado/caminho/malicioso.webm"}'
```
**Esperado:** `403` — `permission denied for column audio_path`

### 5.4 — Invocação direta de RPC via REST (authenticated)

```bash
curl -s -X POST \
  "https://{PROJECT_REF}.supabase.co/rest/v1/rpc/begin_case_operation" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SESSION_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"p_user_id\":\"{USER_ID}\",\"p_case_id\":\"{CASE_ID}\",\"p_operation\":\"transcribe\",\"p_processing_job_id\":\"$(cat /proc/sys/kernel/random/uuid)\"}"
```
**Esperado:** `403` — `permission denied for function begin_case_operation`

### 5.5 — Alteração de legacy_pre_consent (campo imutável)

```bash
# Mesmo com service_role (via SQL Editor), tentar alterar
-- No SQL Editor:
update public.cases
set legacy_pre_consent = true
where id = '{CASE_ID}';
-- ESPERADO: ERROR — trigger enforce_legacy_pre_consent_immutable bloqueia
```

### 5.6 — Transição de estado ilegal (trigger de máquina de estados)

```sql
-- No SQL Editor (service_role):
update public.cases
set status = 'ready'
where id = '{CASE_ID}';  -- caso em status 'draft'
-- ESPERADO: ERROR — draft → ready não está na whitelist de transições
```

---

## Fluxo 6 — Limpeza e rollback

### 6.1 — Limpeza dos dados sintéticos

```sql
delete from public.case_operations
where case_id in (select id from public.cases where patient_initials = 'TE');

delete from public.cases where patient_initials = 'TE';
```

Verifique que não sobrou nada no Storage:
```sql
select count(*) from storage.objects
where bucket_id = 'consultations'
  and (owner_id = '{USER_ID}' or name like '{USER_ID}/%');
-- Esperado: 0 (todos os áudios dos casos de teste foram deletados)
```

### 6.2 — Rollback da migration (verificação do down.sql)

Numa branch Supabase descartável separada, aplique a migration e depois o rollback:

```bash
# Aplicar
supabase db push --db-url <staging_db_url> < supabase/migrations/0001_phase1_hardening.up.sql

# Reverter
supabase db push --db-url <staging_db_url> < supabase/migrations/0001_phase1_hardening.down.sql
```

Após o down.sql, verifique que:
- Colunas novas (`consent_confirmed_at`, `delete_status`, etc.) não existem mais em `cases`
- Tabela `case_operations` não existe
- Triggers foram removidos
- As 4 policies antigas do Storage **voltaram** (`consultations_read_own`, etc.)

```sql
select column_name from information_schema.columns
where table_schema='public' and table_name='cases'
  and column_name in ('consent_confirmed_at','delete_status','audio_removed','legacy_pre_consent');
-- Esperado: 0 linhas

select to_regclass('public.case_operations');
-- Esperado: NULL

select policyname from pg_policies
where schemaname='storage' and tablename='objects'
  and policyname like 'consultations_%_own';
-- Esperado: 4 linhas (as políticas antigas restauradas)
```

---

## Checklist final

| # | Fluxo                                      | Resultado esperado     | OK? |
|---|--------------------------------------------|------------------------|-----|
| 1 | Draft criado com consent                   | status=draft, consent≠null | ☐ |
| 2 | /audio-url retorna path+token              | 200, path canônico     | ☐   |
| 3 | PUT ao Storage com token                   | 200                    | ☐   |
| 4 | /audio-confirm marca recorded              | 200, status=recorded   | ☐   |
| 5 | Path adulterado ignorado pelo servidor     | path canônico no DB    | ☐   |
| 6 | /audio-url para caso legado                | 403                    | ☐   |
| 7 | /audio-confirm para caso legado            | 403                    | ☐   |
| 8 | /transcribe para caso legado               | 403                    | ☐   |
| 9 | Transcrição normal                         | status=transcribed     | ☐   |
| 10| Operação registrada em case_operations     | status=done            | ☐   |
| 11| 30 falhas bloqueiam nova operação          | 429                    | ☐   |
| 12| Lease ativo bloqueia operação paralela     | 409                    | ☐   |
| 13| Exclusão remove áudio e linha              | delete_status=deleted  | ☐   |
| 14| Segunda exclusão (idempotência)            | 200                    | ☐   |
| 15| Exclusão por outro usuário                 | 403                    | ☐   |
| 16| Retentativa após delete_failed             | 200, deleted           | ☐   |
| 17| PUT direto ao bucket sem token             | 403                    | ☐   |
| 18| PATCH status via REST authenticated        | 403                    | ☐   |
| 19| PATCH audio_path via REST authenticated    | 403                    | ☐   |
| 20| RPC begin_case_operation via REST authed   | 403                    | ☐   |
| 21| Alterar legacy_pre_consent (trigger)       | ERROR                  | ☐   |
| 22| Transição de estado ilegal (trigger)       | ERROR                  | ☐   |
| 23| Limpeza de dados sintéticos                | 0 linhas restantes     | ☐   |
| 24| Rollback down.sql funciona                 | schema restaurado      | ☐   |

**Todos os 24 itens verdes = migration apta para produção.**
