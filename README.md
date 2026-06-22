# ClinIQ v9 — Clinical Detective

Versão v9 do ClinIQ, focada na experiência **“Shazam da consulta médica”**, com captura de áudio real (`getUserMedia`/`MediaRecorder`), transcrição PT-BR, Clinical Detective com evidências rastreáveis e instrumentação de custo/margem por análise.

## Publicação

Este projeto está preparado para publicação no Vercel com Next.js. A experiência principal fica preservada em `public/cliniq-v9.html` e é renderizada na rota raiz por `app/page.tsx`.

## Configuração local

1. Copie `.env.local.example` para `.env.local` e preencha as chaves:

   ```
   OPENAI_API_KEY=sk-...           # transcrição PT-BR (Whisper)
   ANTHROPIC_API_KEY=sk-ant-...    # Clinical Detective (claude-opus-4-8)
   ```

2. Instale as dependências e suba o servidor de desenvolvimento:

   ```bash
   pnpm install
   pnpm dev
   ```

3. Acesse `http://localhost:3000`. O fluxo de gravação (Home → Consentimento → Gravação) funciona sem nenhuma chave, pois `localhost` é um contexto seguro para `getUserMedia`. Transcrição e Clinical Detective exigem as chaves acima; sem elas, a tela de análise mostra um erro com opção de tentar novamente, em vez de falhar silenciosamente.

## Backend (Supabase) — auth, persistência e storage

Sem o Supabase, o app roda em **modo local/demo**: tudo funciona, mas nada é salvo
e a Home mostra casos de exemplo. Com o Supabase configurado, o app exige login,
salva cada consulta do médico e sobe o áudio para um bucket privado (contornando o
limite de ~4,5 MB de corpo de requisição da Vercel em consultas longas).

Para ativar:

1. Crie um projeto em [supabase.com](https://supabase.com) e copie, em
   **Project Settings → API**, a `Project URL` e a `anon public key`.
2. Defina as variáveis (local em `.env.local`, ou em Vercel → Environment Variables):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

3. No **SQL Editor** do Supabase, rode o conteúdo de
   [`lib/supabase/schema.sql`](lib/supabase/schema.sql) uma vez. Ele cria a tabela
   `cases`, a tabela `profiles`, o bucket `consultations` e todas as políticas de
   RLS (cada médico só enxerga os próprios pacientes — exigência da LGPD).

## Comandos

```bash
pnpm install
pnpm dev      # desenvolvimento, http://localhost:3000
pnpm build
pnpm start
```
