# SUPER-PROMPT — Clone 100% fiel do ClinIQ v9 ("Clinical Detective")

> **Para a IA que vai construir:** este documento é a especificação completa para recriar o ClinIQ do zero, fiel ao original em arquitetura, segurança, UI e comportamento. Siga-o à risca. Onde houver contrato de status HTTP, nome de coluna, ordem de operação ou texto de UI, reproduza **exatamente** — não "melhore". No fim há a seção **"O QUE FALTA CONCLUIR"** com o estado real de deploy.

---

## 0. O QUE É O PRODUTO

**ClinIQ** é um web app mobile-first ("Shazam da consulta médica") para médicos. O fluxo central:

1. Médico toca numa esfera → dá consentimento LGPD → grava o áudio da consulta.
2. O áudio é transcrito em PT-BR (Whisper).
3. Um "Clinical Detective" (Claude Opus 4.8) analisa a transcrição e produz um **dossiê estruturado** com achados, evidências rastreáveis (timestamp do áudio → trecho citado), problemas, lacunas, próximos passos e timeline.
4. O médico revisa. **Posicionamento jurídico obrigatório:** o ClinIQ é **suporte à decisão, nunca diagnóstico**. A decisão é sempre do médico. Esse enquadramento aparece na UI (consentimento, cabeçalhos) e no system prompt do modelo.

**Princípios inegociáveis (aparecem no código original como comentários):**
- **Nenhum dado clínico fabricado.** Sem análise real → lista vazia / placeholder honesto, nunca exemplo fictício apresentado como real.
- **Consentimento antes do microfone.** O caso (`draft`) é criado no servidor com `consent_confirmed_at` persistido *antes* de o microfone ligar.
- **Fail-closed.** Se a camada privilegiada não estiver configurada, as rotas respondem 503 — nunca degradam para o privilégio do navegador.
- **Exclusão recuperável e honesta.** Falha parcial nunca é reportada como sucesso; a exclusão só some da lista quando o servidor confirma `deleted`.

---

## 1. STACK EXATA

```jsonc
// package.json — dependencies
"@anthropic-ai/sdk": "^0.105.0",   // Clinical Detective (structured outputs + thinking adaptive)
"@base-ui/react": "^1.5.0",
"@supabase/ssr": "^0.12.0",        // createBrowserClient / createServerClient
"@supabase/supabase-js": "^2.108.2",
"@vercel/analytics": "1.6.1",
"class-variance-authority": "^0.7.1",
"clsx": "^2.1.1",
"lucide-react": "^1.16.0",         // ÚNICA fonte de ícones
"next": "16.2.6",                  // App Router, runtime nodejs
"react": "^19", "react-dom": "^19",
"shadcn": "^4.8.0",
"tailwind-merge": "^3.3.1",
"tw-animate-css": "^1.4.0"
// devDependencies: tailwindcss ^4.2.0 (@tailwindcss/postcss), typescript 5.7.3,
// eslint ^9 + eslint-config-next ^16, vitest ^4.1.9
```

- **Next.js 16 App Router**, todas as rotas de API com `export const runtime = 'nodejs'`. Rotas de IA: `export const maxDuration = 300`.
- **Tailwind CSS v4** (import via `@import 'tailwindcss'` no CSS, sem `tailwind.config.js` clássico — o tema vive em `@theme inline` no `globals.css`).
- **TypeScript estrito.** Path alias `@/*` → raiz do projeto.
- Scripts: `dev`, `build`, `start`, `lint` (`eslint .`), `test` (`vitest run`).
- Gerenciador: `pnpm`.

---

## 2. ESTRUTURA DE ARQUIVOS

```
app/
  layout.tsx                         # metadata PT-BR, favicons, Analytics só em prod, lang="pt-BR"
  globals.css                        # design system (Tailwind v4 @theme + oklch tokens)
  page.tsx                           # SPA: máquina de estados de telas + auth gate
  api/
    transcribe/route.ts              # Whisper PT-BR
    detective/route.ts               # Claude Opus 4.8 structured output
    cases/[id]/route.ts              # DELETE recuperável
    cases/[id]/audio-url/route.ts    # emite signed upload URL
    cases/[id]/audio-confirm/route.ts# confirma upload, marca 'recorded'
components/
  TabBar.tsx
  screens/  Home, ConsentGate, Recording, CompleteCase, AnalysisInProgress,
            CaseIntelligenceReport, Login, AllCases, NewCase
  ui/       ClinicalCard, EvidenceChip, FindingCard, ProblemCard,
            NextStepCard, PatientCaseCard, button
lib/
  supabase/ client.ts, server.ts, privileged.ts, schema.sql
  types.ts, cases.ts, case-access.ts, case-operations.ts, audio-upload.ts,
  transcribe.ts, detective.ts, limits.ts, consent.ts, cost.ts,
  useAudioRecorder.ts, utils.ts
supabase/
  migrations/0001_phase1_hardening.up.sql   # hardening (aplicar após schema.sql)
  migrations/0001_phase1_hardening.down.sql # rollback
  staging-verification.sql, staging-e2e-checklist.md
public/  icon.svg, icon-light/dark-32x32.png, apple-icon.png
```

---

## 3. MODELO DE DADOS (POSTGRES / SUPABASE)

Aplicar em duas etapas: **(A) `lib/supabase/schema.sql`** (baseline), depois **(B) `0001_phase1_hardening.up.sql`** (hardening).

### 3A. Baseline (`schema.sql`)

**`profiles`** — `id uuid PK → auth.users`, `full_name text`, `created_at`. RLS: select/insert/update só do próprio (`auth.uid() = id`). Trigger `on_auth_user_created` (AFTER INSERT em `auth.users`, `security definer`) cria o profile puxando `full_name` de `raw_user_meta_data`.

**`cases`** — colunas base:
```
id uuid PK default gen_random_uuid()
user_id uuid NOT NULL → auth.users (on delete cascade)
patient_name, patient_initials, age, gender, specialty, chief_complaint, summary  (text)
findings_count int NOT NULL default 0
cost_usd numeric NOT NULL default 0
case_data jsonb, transcription jsonb, intelligence jsonb
audio_path text
created_at timestamptz NOT NULL default now()
```
Index `cases_user_created_idx (user_id, created_at desc)`. RLS habilitado, policies select/insert/update/delete "own" (`auth.uid() = user_id`).

**Storage:** bucket privado `consultations` (`public=false`). Policies iniciais `consultations_read_own` / `insert_own` / `delete_own` (pasta = `auth.uid()::text`). *(Estas 4 serão removidas na migration — ver 3B.)*

### 3B. Hardening (`0001_phase1_hardening.up.sql`) — o núcleo de segurança

Este arquivo transforma o modelo "confia no navegador" em "servidor controla tudo". **Reproduza cada seção:**

**(1) Consentimento persistido:** `add column consent_confirmed_at timestamptz`, `consent_text_version text`.

**(2) Estado do caso:** `add column status text NOT NULL default 'draft'` + CHECK `status in ('draft','recorded','transcribed','ready','failed')`. Semântica:
`draft` (criado no consentimento) → `recorded` (áudio no Storage) → `transcribed` (transcrição persistida) → `ready` (dossiê persistido). `failed` = terminal.

**(3) Honestidade de consentimento legado:** `add column legacy_pre_consent boolean NOT NULL default false`. Backfill: `set legacy_pre_consent = true where consent_confirmed_at is null`. CHECK `cases_consent_required_check`: `consent_confirmed_at is not null OR legacy_pre_consent = true`.

**(4) Exclusão recuperável:** `add column delete_status text NOT NULL default 'active'` + CHECK `in ('active','delete_requested','deleting','delete_failed','deleted')`. `add column audio_removed boolean NOT NULL default false`. Indexes parciais em `delete_status <> 'active'` e em `status`.

**(5) Bloqueio de coluna (o item mais importante):** RLS é *row-level* — não impede o navegador (dono da linha) de gravar campos server-controlled. A defesa é **GRANT/REVOKE por coluna**:
```sql
revoke insert, update, delete on public.cases from authenticated;
grant insert (user_id, consent_confirmed_at, consent_text_version, patient_name,
              patient_initials, age, gender, specialty, chief_complaint, case_data)
  on public.cases to authenticated;
grant update (patient_name, patient_initials, age, gender, specialty,
              chief_complaint, case_data) on public.cases to authenticated;
drop policy if exists "cases_delete_own" on public.cases;   -- delete só via rota server
grant insert, update, delete on public.cases to service_role;
```
Campos que o navegador **nunca** pode escrever: `status, audio_path, transcription, intelligence, cost_usd, findings_count, summary, legacy_pre_consent, delete_status, audio_removed` (+ `consent_*` no UPDATE).

**(6) Quota + idempotência com lease** — tabela `case_operations`:
```
id uuid PK, user_id → auth.users, case_id → cases (ambos on delete cascade),
operation text CHECK in ('transcribe','detective'),
processing_job_id text NOT NULL,          -- gerado pelo servidor por tentativa
status text default 'in_progress' CHECK in ('in_progress','done','failed','expired'),
operation_started_at timestamptz default now(),
lease_expires_at timestamptz NOT NULL,
created_at timestamptz default now(), finished_at timestamptz
```
- **Index único parcial** `case_operations_active_idx (case_id, operation) WHERE status = 'in_progress'` — predicate **imutável** (literal, sem `now()`; Postgres rejeita `now()` em predicate de índice).
- Index `(user_id, created_at desc)`. RLS on; policy select_own; `revoke insert,update,delete from authenticated, anon` (escrita só pelas RPCs).

**(7) RPCs internas — `security definer`, `EXECUTE` só para `service_role`:**

`begin_case_operation(p_user_id uuid, p_case_id uuid, p_operation text, p_processing_job_id text) returns case_operations`:
- `set search_path = public, pg_temp` (anti search-path hijack).
- Constantes no corpo: `v_max_per_day = 30`, `v_lease_duration = interval '15 minutes'`.
- `pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0))` — serializa o mesmo usuário.
- Revalida posse: `select ... from cases where id = p_case_id and user_id = p_user_id`; se não achar → `raise 'case not found or not owned'` (errcode 42501). Se `delete_status <> 'active'` → `'case not active'`. Se `legacy_pre_consent` → `'legacy case not processable'`.
- **Reivindica lease expirado:** lê a linha `in_progress` `for update`; se `lease_expires_at >= now()` → `raise 'duplicate operation in progress'` (23505); senão marca a antiga como `expired`.
- **Quota:** `count(*) from case_operations where user_id = p_user_id and created_at >= now() - interval '24 hours'` — **conta TODO status** (failed/expired incluídos; custo de API já pode ter sido incorrido). Se `>= v_max_per_day` → `raise 'daily limit exceeded'` (P0001).
- Insere `in_progress` com `lease_expires_at = now() + 15min`; em `unique_violation` → `'duplicate operation in progress'`. Retorna a linha.

`finish_case_operation(p_user_id, p_case_id, p_operation, p_processing_job_id, p_status) returns void`:
- `p_status in ('done','failed')`. UPDATE `set status = p_status, finished_at = now() where case_id/operation/user_id/processing_job_id batem AND status = 'in_progress'`. Se `not found` → `raise 'no matching in-progress operation'` (P0002). O match por `processing_job_id` impede um worker velho (lease expirado, reivindicado por tentativa nova) de fechar/sobrescrever a reserva nova.

```sql
revoke all on function public.begin_case_operation(uuid,uuid,text,text) from public, anon, authenticated;
revoke all on function public.finish_case_operation(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute ... to service_role;   -- só service_role
```

**(8) Máquina de estados via trigger** `enforce_case_status_transition` (BEFORE UPDATE, `when new.status is distinct from old.status`). Valida transição **e** pré-condições de dados, para **qualquer** escritor (inclusive service_role — é integridade, não autorização):
- Permitidas: `draft→{recorded,failed}`, `recorded→{transcribed,failed}`, `transcribed→{ready,failed}`. Resto → exception.
- `recorded` exige `consent_confirmed_at` (ou legacy) **e** `audio_path`. `transcribed` exige `audio_path` **e** `transcription`. `ready` exige `transcription` **e** `intelligence`.

**(9) Imutabilidade** `enforce_legacy_pre_consent_immutable` (BEFORE UPDATE): qualquer mudança em `legacy_pre_consent` → exception. Settable só pelo backfill da seção 3.

**(10) Storage write-only:** `drop policy` das 4 (`consultations_read_own/insert_own/update_own/delete_own`). A partir daí, todo acesso ao bucket é só via `service_role` (rotas server). Navegador não tem policy direta.

O **`.down.sql`** reverte tudo na ordem inversa (dropa RPCs, triggers, colunas, tabela; restaura grants e policies antigas). É destrutivo — documentar avisos.

---

## 4. ARQUITETURA DE SEGURANÇA (DOIS CLIENTES) — reproduza com exatidão

Três acessos ao Supabase, três papéis:

| Arquivo | Client | Chave | Papel PG | Uso |
|---|---|---|---|---|
| `lib/supabase/client.ts` | `createBrowserClient` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `authenticated` | UI: auth, listar/ler casos, INSERT/UPDATE das colunas permitidas |
| `lib/supabase/server.ts` | `createServerClient` (cookies read-only) | anon key + cookies | `authenticated` | **Só** `auth.getUser()` nas rotas |
| `lib/supabase/privileged.ts` | `createClient` (no session/refresh) | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` | Tudo pós-auth: RPCs, escrita de campos server-controlled, Storage |

**Regra de ouro:** `auth.uid()` **não resolve** sob `service_role`. Toda rota (a) valida sessão com `getSupabaseServer().auth.getUser()` → obtém `userId`; (b) só então usa `getPrivilegedSupabase()`, passando `userId` **explicitamente** como parâmetro. Nunca lê identidade de volta de `auth.uid()` no client privilegiado, nunca confia em `userId` vindo do corpo.

`isSupabaseConfigured()` = `url && anonKey`. `isPrivilegedSupabaseConfigured()` = `url && serviceRoleKey`. Sem anon → app roda em **modo local/demo** (nada persiste). Sem service role → rotas privilegiadas respondem **503**.

---

## 5. CONTRATOS DAS ROTAS DE API (status HTTP exatos)

Todas: `runtime = 'nodejs'`. Padrão de validação: sessão → privilégio → corpo → posse/estado → operação.

### `POST /api/cases/[id]/audio-url` → emite signed upload URL
Valida: `caseId` presente (400); sessão (401); privilégio (503); body `{mimeType}` válido via `isAllowedAudioMime` (400); carrega caso do dono via **session client** (`select id,status,delete_status,legacy_pre_consent`) — erro→503, não encontrado→403, `legacy_pre_consent`→403, `delete_status≠'active'`→409, `status≠'draft'`→422. Path canônico `${userId}/${caseId}/audio.${extForMime(mimeType)}`. `privileged.storage.from('consultations').createSignedUploadUrl(path)` — erro→502. Retorna `{path, token}`.

### `POST /api/cases/[id]/audio-confirm` → confirma upload, marca `recorded`
Mesmas validações. **Recalcula o path canônico** (nunca aceita path do corpo). Verifica existência via `privileged.storage.createSignedUrl(path, 60)` — erro→422 ("Áudio não encontrado"). `privileged.from('cases').update({audio_path: path, status:'recorded'}).eq('id',caseId).eq('user_id',userId)` — erro→502. Retorna `{ok:true}`. (O trigger da seção 8 valida `draft→recorded`.)

### `POST /api/transcribe` → Whisper
`{caseId}` como única entrada. Exige `OPENAI_API_KEY` (503), sessão (401), privilégio (503). `loadOwnedCase()` (ver §6). `status≠'recorded'`→422; sem `audio_path`→422. `beginCaseOperation(userId,caseId,'transcribe')` (mapeia erros→status, ver §6). Em `try/finally`:
- `privileged.storage.createSignedUrl(audio_path, 120)`→502 se falhar; `fetch` o áudio (não-ok→502, rede→502); `blob.size===0`→400, `> maxAudioBytes`→413.
- POST multipart a `https://api.openai.com/v1/audio/transcriptions`: `model=whisper-1`, `language=pt`, `response_format=verbose_json`, `temperature=0`. Rede→502, não-ok→502.
- Monta `TranscriptionResult` (segments com `{id,start,end,text}`, `durationSec`, `cost` = `audioMinutes × 0.006 USD`).
- `privileged.from('cases').update({transcription, status:'transcribed', cost_usd: caseRow.cost_usd + usd}).eq('id').eq('user_id')`→502.
- `finally`: `finishCaseOperation(userId,caseId,'transcribe',processingJobId, done|failed)`.

### `POST /api/detective` → Claude Opus 4.8
`{caseId}`. Exige `ANTHROPIC_API_KEY` (ou `ANTHROPIC_AUTH_TOKEN`) (503), sessão (401), privilégio (503). `loadOwnedCase()`. `status≠'transcribed'`→422. Extrai `transcription` da linha; vazia→422; `text.length > maxTranscriptChars`→413. `beginCaseOperation(...,'detective')`. Em `try/finally`:
- Monta cabeçalho do caso a partir de `case_data` + transcrição formatada (cada linha `[mm:ss] texto`).
- `new Anthropic()`, `client.messages.stream({ model:'claude-opus-4-8', max_tokens:16000, thinking:{type:'adaptive'}, system: SYSTEM_PROMPT, output_config:{format:{type:'json_schema', schema: CASE_SCHEMA}}, messages:[{role:'user',content}] })`. Erro→502. `stop_reason==='refusal'`→422. Sem bloco de texto→502. `JSON.parse` falha→502.
- Custo: `input_tokens/1e6 × 5 + output_tokens/1e6 × 25` USD.
- Monta `CaseIntelligence` (com `cost` em tokens). `privileged.update({intelligence, summary, findings_count: detectiveFindings.length, status:'ready', cost_usd: caseRow.cost_usd + usd})`→502.
- `finally`: `finishCaseOperation(...,'detective', done|failed)`.

### `DELETE /api/cases/[id]` → exclusão recuperável
Sessão (401), privilégio (503). **Claim atômico:** `privileged.update({delete_status:'deleting'}).eq('id').eq('user_id',userId).in('delete_status',['active','delete_requested','delete_failed']).select('id,audio_path,audio_removed,delete_status').maybeSingle()`.
- Sem linha → checar existência: se caso existe e já `deleted`→**200 idempotente**; se de outro dono/inexistente→**403**; se em `deleting` concorrente→**409**.
- Se `audio_path && !audio_removed`: `privileged.storage.from('consultations').remove([audio_path])`. Exceção lançada→ marca `delete_failed`, **503**. Erro retornado pelo Storage→ marca `delete_failed`, **502**.
- Marca `audio_removed:true`; falha→`delete_failed`, **503**.
- DELETE final da linha: `privileged.from('cases').delete().eq('id',caseId).eq('user_id',userId)` (dois `eq` — bypassa RLS mas mantém escopo do dono). Falha→`delete_failed`, **503**. Sucesso→**200** `{status:'deleted'}`.

**Design dos status:** 503 = exceção do Storage OU falha nossa de DB; 502 = Storage respondeu com erro; 409 = exclusão concorrente; 403 = não é dono; 200 = sucesso ou já-excluído.

---

## 6. CAMADA lib/ (helpers)

- **`limits.ts`** — `PILOT_LIMITS = { maxRequestsPerUserPerDay: 30, maxAudioDurationSec: 1200, maxAudioBytes: 25*1024*1024, maxTranscriptChars: 200000 }`. `isAllowedAudioMime(mime)`: começa com `audio/`|`video/` e contém um de `webm,mp4,aac,mpeg,mp3,ogg,wav,m4a`. `extForMime(mime)`: webm→webm, mp4→mp4, aac→m4a, mpeg→mp3, ogg→ogg, wav→wav, default webm. **A constante 30 tem que casar com `v_max_per_day` na RPC.**
- **`consent.ts`** — `CONSENT_TEXT_VERSION = '2026-06-pilot-1'`.
- **`case-access.ts`** — `loadOwnedCase(supabase, userId, caseId)`: select das colunas de posse; erro→503; não encontrado→**403** (mesma resposta de "não autorizado" — não vaza existência); `legacy_pre_consent`→403; sem `consent_confirmed_at`→422. Retorna `{ok,row}`.
- **`case-operations.ts`** — `beginCaseOperation`: gera `processingJobId = crypto.randomUUID()`, chama a RPC via privileged. Mapa de mensagem→status: `unauthenticated`→401, `not found or not owned`→403, `legacy case not processable`→403, `case not active`→409, `daily limit exceeded`→429, `duplicate operation in progress`→409, inesperado→503, sem client→503, `!data`→503, exceção→503. `finishCaseOperation`: nunca lança; só loga.
- **`cases.ts`** (client) — `createDraftCase()`: INSERT só `{user_id, consent_confirmed_at, consent_text_version}` (status vem do default). `updateCaseData()`: UPDATE das colunas permitidas + `case_data`. `deleteCase(id)`: `fetch DELETE /api/cases/${id}`, interpreta `{status,error}`, `ok` só se `status==='deleted'`. `listCases()`: select `neq('delete_status','deleted')` ordenado por `created_at desc`. `getCase()`, `initialsFrom()` ("Maria Silva"→"M.S."), `relativeTime()` (PT-BR: "agora","5min","2h","Ontem","3d", senão data).
- **`audio-upload.ts`** (client) — `uploadAudio(caseId, blob, mimeType)`: (1) `POST /audio-url`; (2) `supabase.storage.from('consultations').uploadToSignedUrl(path, token, blob, {contentType})`; (3) `POST /audio-confirm`. Cada passo com tratamento de rede/erro.
- **`transcribe.ts`/`detective.ts`** (client) — `POST` só `{caseId}`, throw com `body.error` em não-ok.
- **`cost.ts`** — `USD_TO_BRL=5.4`, `DEFAULT_PLAN_PRICE_BRL=199`, `DEFAULT_ANALYSES_PER_MONTH=60`. `aggregateCost()`, `computeMargin()` (margem unitária = preço/análises − custo).
- **`useAudioRecorder.ts`** — hook de gravação real. `getUserMedia({audio:{echoCancellation,noiseSuppression,autoGainControl}})`. `pickMimeType()` tenta `audio/webm;codecs=opus` → webm → mp4/aac → ogg (Safari/iOS costuma só aceitar mp4/aac). `MediaRecorder.start(1000)` (timeslice 1s, robustez iOS). Nível de áudio via `AnalyserNode` (RMS do time-domain, `level = min(1, rms*3.2)`). Cronômetro robusto a pausas (`accumulatedMs` + `segmentStart`). Retorna `{status,error,elapsedSec,level,mimeType,isRecording,isPaused,start,pause,resume,stop}`. `stop()` resolve `RecordingResult{blob,url,mimeType,durationSec}`. Cleanup ao desmontar (libera microfone). Erros: `permission-denied,no-device,insecure-context,unsupported,unknown` com mensagens PT-BR.

---

## 7. PIPELINE DE IA — PROMPTS E SCHEMA (copie literalmente)

### Transcrição (Whisper)
Multipart para `/v1/audio/transcriptions`: `model=whisper-1`, `language=pt`, `response_format=verbose_json`, `temperature=0`. Cada `segment` vira `{id,start,end,text.trim()}`. Custo = `duration/60 × 0.006` USD.

### Clinical Detective (Claude Opus 4.8)
`model='claude-opus-4-8'`, `max_tokens=16000`, `thinking:{type:'adaptive'}`, structured output via `output_config.format = {type:'json_schema', schema: CASE_SCHEMA}`.

**SYSTEM_PROMPT (verbatim):**
```
Você é o Clinical Detective do ClinIQ, um assistente de SUPORTE À DECISÃO clínica — nunca um diagnóstico. Você analisa a transcrição de uma consulta médica em português e produz um dossiê estruturado.

Princípios obrigatórios:
- Baseie CADA conclusão em evidências presentes na transcrição. Não invente fatos, medicações, exames ou números que não foram ditos.
- Toda evidência deve citar o timestamp do áudio (formato mm:ss) do trecho que a sustenta e um trecho literal curto. Use o timestamp do segmento correspondente.
- Se a informação não existir na transcrição, registre como lacuna (gap) em vez de supor.
- Calibre a confiança honestamente. Prefira "media" ou "baixa" quando a evidência for fraca.
- Escreva em português do Brasil, conciso e clínico. Não use jargão desnecessário.
- Você apoia o raciocínio do médico; a decisão e o diagnóstico são sempre dele.
```

**Mensagem do usuário:** cabeçalho `Paciente: …; Idade: …; Sexo: …; Especialidade: …; Queixa principal: …; Objetivo: …` + transcrição formatada (`[mm:ss] texto` por linha) + instrução de gerar o dossiê conforme o schema com evidências apontando timestamps.

**CASE_SCHEMA** (JSON Schema; todo objeto com `additionalProperties:false` e `required` com todas as chaves):
- `summary: string`
- `detectiveFindings: [{ id, type ∈ {pattern,inconsistency,correlation,gap}, title, conclusion, whyItMatters, confidence ∈ {alta,media-alta,media,baixa}, nextAction, evidence: [{source, timestamp("mm:ss" ou ""), quote}] }]`
- `problems: [{ title, priority ∈ {critical,high,moderate,low}, status, summary }]`
- `gaps: [{ question, impact, priority }]`
- `nextSteps: [{ action, urgency, reason }]`
- `timeline: [{ date, event, type ∈ {symptom,worsening,exam,consultation,other} }]`

Tipos TS completos em `lib/types.ts` (§ replicar): `TranscriptSegment, CostBreakdown, TranscriptionResult, CaseStatus, DeleteStatus, CaseData, FindingType, Confidence, Priority, DetectiveEvidence, DetectiveFinding, CaseProblem, CaseGap, NextStep, TimelineEvent, TokenCostBreakdown, CaseIntelligence`.

---

## 8. UI — MÁQUINA DE TELAS (`app/page.tsx`)

SPA client-side. Container global: `max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 relative` (mobile-first, largura de celular centralizada).

**Estado:** `currentScreen: 'home'|'consent'|'recording'|'complete'|'analysis'|'report'|'allcases'`; `authStatus: 'loading'|'authed'|'anon'`; `isDark`; `recording`, `caseData`, `transcription`, `intelligence`, `caseId`, `recentCases`, `doctorName`, `consentBusy`, `consentError`.

**Auth gate:** se Supabase configurado e `loading`→spinner; se `anon`→`<Login>`. `onAuthStateChange` mantém `doctorName` de `user_metadata.full_name`. Sem Supabase → `authStatus='anon'` só se configurado; se não configurado, entra direto (demo).

**Fluxo:**
`home` → (toca esfera) `consent` → (`handleConsent`: `createDraftCase()` → guarda `caseId`) `recording` → (`onComplete(RecordingResult)`) `complete` → (`handleCaseSubmit`: `updateCaseData(caseId,data)`) `analysis` → (`onComplete(transcription,intelligence)`) `report`. Home também → `allcases`. `openCase(id)` → `getCase` → `report`. `signOut` → home.

`homeCases` = 3 mais recentes mapeados para `{id, initials, age, specialty, date: relativeTime, status: findingsCount>0?'ready':'pending'}`.

---

## 9. TELAS — ESPECIFICAÇÃO VISUAL (reproduzir fielmente)

**Paleta/assinatura visual:** esferas com gradiente `from-sky-400 via-cyan-500 to-teal-500`; telas "ativas" (Recording, Analysis) em fundo escuro `bg-gray-950`/gradiente slate; telas de conteúdo em `bg-gray-50 dark:bg-gray-950`. Cantos `rounded-xl/2xl`. Ícones **lucide-react**. Fonte system (`-apple-system, SF Pro Text…`). Sempre PT-BR. Dark mode via classe `.dark` no `<html>`.

**Login** — marca ClinIQ (quadrado gradiente com barras de áudio), tagline "Inteligência clínica por consulta". Form signin/signup (nome só no signup), inputs `rounded-xl`. `humanizeAuthError()` traduz erros do Supabase (credenciais inválidas, já registrado, e-mail não confirmado, senha curta, rede). Signup sem sessão → info "confirme o e-mail" e volta a signin. Rodapé sobre LGPD.

**Home** — saudação por horário ("Bom dia/tarde/noite, {nome}"). Botões sair (se logado) + tema. **Esfera central** `w-52 h-52` gradiente sky→teal, glow pulsante (`setInterval` 2s alterna scale 1↔1.02, glow 0.4↔0.6), anel externo, reflexo, 5 barras de onda animadas, label "Pronto para capturar". Título "Toque para capturar a consulta". Dois selos: "Transcreve automático" (verde) / "Você revisa e decide" (sky). Rodapé: "Casos recentes" (até 3) + "Ver todos".

**ConsentGate** — fundo `bg-gray-950`. Ícone `ShieldCheck`. Título "Consentimento para gravar a consulta". 3 cards: microfone só liga após concordar / áudio sensível LGPD / suporte à decisão não diagnóstico. Aviso âmbar LGPD. Checkbox custom (texto de consentimento completo — verbatim). Botão gradiente "Concordo e iniciar gravação" (disabled até marcar; spinner quando `busy`). Mostra `error` se houver.

**Recording** — fundo `bg-gray-950`. Inicia captura ao montar (consentimento já dado). Header: Cancelar / indicador (ponto vermelho pulsante "Gravando" | âmbar "Pausado" | "Solicitando microfone") / Bookmark (placeholder). Timer `text-5xl` mm:ss. **Esfera pulsante alimentada pelo nível de áudio REAL** (`pulse = isPaused?0.15:0.15+level*0.85`), 3 ondas de expansão, glow, 7 barras. Controles: Pausar/Retomar (Mic/Pause) + Parar (quadrado, disabled se `<3s`, `MIN_SECONDS=3`). Painel "Sinais em tempo real": microfone ativo/pausado, barra de nível real (`width: level*100%`), "Captando voz" se `level>0.08`, formato de captura (codec amigável). Estado de erro com "Tentar novamente"/"Voltar".

**CompleteCase** — player `<audio controls>` do áudio capturado real + "Áudio capturado com sucesso" + duração. Form: paciente (nome/iniciais), idade (number), sexo (M/F toggle), especialidade (select — lista de 12), queixa principal, objetivo (4 opções: consultation/second-opinion/followup/referral). Seção "Anexos clínicos" = placeholder "disponível em próxima etapa". Botão fixo "Gerar Case Intelligence" (disabled até form válido — todos os campos obrigatórios).

**AnalysisInProgress** — a tela "money". Fundo gradiente slate escuro. **Pipeline real no `useEffect`:** `uploadAudio(caseId, blob, mimeType)` → `transcribeAudio(caseId)` → (`phase='detective'`) `runDetective(caseId)` → `onComplete` após 1300ms. Órb central animada com: rings de `animate-ping` ao concluir, anéis orbitais girando, partículas, camadas de glow, waveform de 7 barras, **anel de progresso SVG** (circle `r=76`, `strokeDashoffset` por `progress`). Progresso "respira" até teto da fase (48% transcribe / 95% detective), 100% só ao terminar. Chips flutuantes reveladas por thresholds `[30,48,70,88,100]` com labels dos estágios reais. Mensagens rotativas por fase. Header muda entre "ClinIQ Transcrição"/"ClinIQ Clinical Detective". Rodapé: contagem de etapas, "PT-BR", "Whisper"/"Opus 4.8". Card de conclusão verde "{N} achados com evidências rastreáveis". Estado de erro com Tentar novamente/Voltar + `retryKey` para re-executar.

**CaseIntelligenceReport** — o dossiê. Header sticky com paciente (iniciais gradiente, nome/idade, sexo•especialidade•objetivo) + botões Share/Download (placeholders). **Navegação por chips** (7 seções): Detective, Transcrição, Resumo, Timeline, Problemas, Lacunas, Ações. Renderiza **só dados reais** de `intelligence` (sem análise → listas vazias). 
- **Detective:** card escuro de cabeçalho + contagem por tipo (padrão/inconsistência/correlação/lacuna, só os >0). Cada achado: card colorido por tipo (`pattern`=violet, `inconsistency`=amber, `correlation`=emerald, `gap`=rose), ícone, confiança, conclusão, "Por que importa", **evidências** (chip `[mm:ss] "trecho"`), próxima ação.
- **Transcrição:** metadados (N trechos, duração, PT-BR) + lista de segmentos com timestamp clicável-ready.
- **Resumo:** texto de `intelligence.summary` + card "Dossiê Clínico Premium" (Download placeholder).
- **Timeline:** eventos com ícone por tipo (worsening=âmbar, exam=sky).
- **Problemas / Lacunas / Ações:** cards com prioridade/impacto/urgência coloridos.

**AllCases** — lista completa (`listCases(200)`). Cada card: iniciais, "{iniciais}, {idade} anos", "{especialidade} · {N} achados", tempo relativo, botão apagar (lixeira), abrir. **Modal de exclusão:** confirma → `deleteCase` → **só remove da lista se `status==='deleted'`**; senão feedback de erro "nada foi perdido, tente de novo". Feedback verde/vermelho por 4s. Nunca exclusão silenciosa.

**NewCase.tsx** existe no repo (354 linhas) mas **não é usado** por `page.tsx` — é uma variante órfã. Pode replicar ou omitir; não faz parte do fluxo ativo.

---

## 10. DESIGN SYSTEM (`app/globals.css`)

Tailwind v4. `@import 'tailwindcss'; @import 'tw-animate-css'; @import 'shadcn/tailwind.css';`. `@custom-variant dark (&:is(.dark *))`. Bloco `@theme inline` define tokens: fontes system, cores clínicas (`--color-clinical-teal:#0a7ea4, green:#10b981, amber:#f59e0b, red:#ef4444`), escala primary sky (50→900), sombras iOS (`--shadow-ios`, `-lg`), tokens shadcn (`--color-*` → vars), raios (`--radius:0.625rem` + escala sm→4xl). `:root` e `.dark` em **oklch**. Utilities: `.shadow-ios`, `.safe-area-inset-bottom`, `.scrollbar-hide`. `-webkit-tap-highlight-color:transparent`. `layout.tsx`: `lang="pt-BR"`, metadata "ClinIQ - Registro clínico estruturado", favicons light/dark/svg, `viewport` sem zoom (`maximumScale:1, userScalable:false`), `themeColor` por scheme, `<Analytics>` só em produção.

---

## 11. VARIÁVEIS DE AMBIENTE

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co   # público
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... | sb_publishable_...  # público
SUPABASE_SERVICE_ROLE_KEY=eyJ... | sb_secret_...    # SERVER-ONLY, nunca NEXT_PUBLIC_, nunca logar
OPENAI_API_KEY=sk-...                               # Whisper
ANTHROPIC_API_KEY=sk-ant-...                        # (ou ANTHROPIC_AUTH_TOKEN)
```
Sem as duas primeiras → modo demo. Sem a service role → rotas privilegiadas 503. Sem OpenAI/Anthropic → transcrição/detective 503 (com erro honesto na UI, não falha silenciosa).

---

## 12. TESTES (Vitest)

Suíte original: 76 testes. Padrão: `vi.doMock(path, factory)` por teste + `await import(...)` dinâmico + `vi.resetModules()/vi.doUnmock()` no `afterEach`. Cobrir: mapeamento erro→status de `beginCaseOperation` (todos os 6 casos + 503/429/409), threading de `processingJobId`, `finishCaseOperation` nunca lança, cadeia exata da exclusão (`update().eq().eq().in().select().maybeSingle()` no claim; `delete().eq().eq()` com **dois** eq), fluxo de upload em 3 passos, path adulterado ignorado no confirm, regressão: o mock do **session client deliberadamente não tem `.rpc`** (qualquer chamada de RPC pelo client de sessão explode). Arquivos: `tests/api-auth`, `case-operations`, `case-deletion`, `audio-upload`, `cases`, `no-fake-content`.

---

## 13. ORDEM DE CONSTRUÇÃO SUGERIDA

1. Scaffold Next 16 + Tailwind v4 + TS + estrutura de pastas.
2. `globals.css` (design system) + `layout.tsx`.
3. `lib/types.ts`, `limits.ts`, `consent.ts`, `cost.ts`, `utils.ts`.
4. Supabase: aplicar `schema.sql` → depois `0001_phase1_hardening.up.sql`.
5. `lib/supabase/{client,server,privileged}.ts`.
6. `lib/{cases,case-access,case-operations,audio-upload,transcribe,detective}.ts` + `useAudioRecorder.ts`.
7. Rotas de API (audio-url, audio-confirm, transcribe, detective, delete).
8. Componentes `ui/` → `screens/` → `app/page.tsx` (máquina de telas).
9. Testes Vitest.
10. Deploy (ver abaixo).

---

## 14. ✅ O QUE FALTA CONCLUIR (estado real do original)

O **código está 100% pronto** (implementado, testado — 76 testes verdes, lint/build limpos, commitado no branch `hardening/cliniq-phase1-trust`). O que falta é **operacional/deploy**:

| # | Pendência | Estado | Ação |
|---|-----------|--------|------|
| 1 | **Migration não aplicada** | Banco Supabase `cliniq-v9` está "Sem migrações". `schema.sql` + `0001_up.sql` **não rodaram** em nenhum banco. | Rodar `schema.sql` e depois `0001_phase1_hardening.up.sql` no SQL Editor do projeto `cliniq-v9`. Sem isso, `/audio-url`, `/audio-confirm`, `/transcribe`, `/detective` respondem 503. |
| 2 | **Env vars não configuradas no deploy** | Nenhuma das 5 chaves está no Vercel. | Setar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` no projeto Vercel. |
| 3 | **Deploy roda código antigo** | O projeto Vercel `v0-cliniq-ios-app` serve o código **v0 original**, não este repo com a segurança. | Conectar o repo GitHub (branch correto) ao Vercel e fazer deploy do código real. |
| 4 | **Branch não mergeado** | Todo o hardening vive em `hardening/cliniq-phase1-trust`; `master` está desatualizado. | Merge → `master` após validação. |
| 5 | **Staging não validado** | `staging-verification.sql` (10 checagens) e `staging-e2e-checklist.md` (24 cenários) escritos mas **não executados**. | Rodar ambos num branch Supabase descartável antes de produção. |
| 6 | **Storage bucket** | Bucket `consultations` é criado pelo `schema.sql` — depende do item 1. | Confirmar bucket privado após aplicar schema. |

**Lacunas de produto (features placeholder, não bugs — decidir se entram no MVP):**
- **Export de PDF** — botões "Download"/"Dossiê Premium" no relatório são placeholders sem handler. Precisa de geração de PDF real.
- **Compartilhar** — botão Share sem ação.
- **Anexos clínicos** — seção declarada "próxima etapa" em CompleteCase.
- **Bookmark** durante gravação — botão decorativo.
- **Estado `failed`** — existe na máquina de estados mas **nenhuma rota seta `status='failed'`** (as rotas só marcam a *operação* como failed via `finishCaseOperation`; o status do caso permanece no último estado bom, o que permite retry natural). Se quiser um estado de caso "falhou" visível na UI, é preciso fio adicional.
- **Refresh de token server-side** — `getSupabaseServer` só lê cookies (não faz refresh). Access token expirado → 401 e re-login. Aceitável para piloto.

**Depois de 1–5 verdes: aplicar a migration em produção após revisão humana e o SaaS está no ar.**

---

*Fim da especificação. Um agente competente com este documento + acesso às chaves reproduz o ClinIQ integralmente, incluindo a arquitetura de segurança de dois clientes que é o diferencial do produto.*
