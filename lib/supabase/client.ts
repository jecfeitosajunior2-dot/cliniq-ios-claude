'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * O backend (auth + persistência + storage) só liga quando as duas variáveis
 * existem. Sem elas, o app degrada para o modo local/demo de antes — nada
 * quebra, apenas não persiste.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

let cached: SupabaseClient | null = null;

/** Retorna o client do navegador, ou null se o Supabase não está configurado. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cached) {
    cached = createBrowserClient(url as string, anonKey as string);
  }
  return cached;
}
