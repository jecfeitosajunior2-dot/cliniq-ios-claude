import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Client privilegiado (service_role), server-only. NUNCA importar de um
 * arquivo 'use client' nem de código que roda no navegador — a service role
 * key ignora RLS inteiramente. Só existe para chamar as RPCs internas
 * (begin_case_operation/finish_case_operation) e para gravar campos
 * server-controlled de `cases` (status, audio_path, transcription,
 * intelligence, cost_usd, delete_status, audio_removed) e para operações de
 * Storage que o navegador não tem mais policy direta para fazer (item 1 e 6
 * do hardening Fase 1R2).
 *
 * Toda rota que usa este client DEVE primeiro validar a sessão do usuário
 * com o client comum (getSupabaseServer/auth.getUser()) e só então chamar
 * este client, passando o userId já validado como parâmetro explícito —
 * nunca lido de volta de auth.uid() aqui, porque a service role key não
 * carrega identidade de usuário nenhuma.
 */
export function isPrivilegedSupabaseConfigured(): boolean {
  return Boolean(url && serviceRoleKey);
}

let cached: SupabaseClient | null = null;

export function getPrivilegedSupabase(): SupabaseClient | null {
  if (!isPrivilegedSupabaseConfigured()) return null;
  if (!cached) {
    cached = createClient(url as string, serviceRoleKey as string, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return cached;
}
