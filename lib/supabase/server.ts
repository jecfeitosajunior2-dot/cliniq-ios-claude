import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Mesma checagem do client de navegador — mantém os dois em sincronia. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/**
 * Client Supabase para uso em Route Handlers (server-side), lendo a sessão a
 * partir dos cookies que o client de navegador já gravou no login.
 *
 * Só lê cookies (não grava): suficiente para validar `auth.getUser()` e para
 * que o PostgREST/Storage apliquem RLS com o usuário autenticado. Não faz
 * refresh de token aqui — se o access token expirar, a chamada falha como
 * não autenticado e o usuário precisa logar de novo no client.
 */
export async function getSupabaseServer(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(url as string, anonKey as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        /* no-op: este client é somente leitura de sessão */
      },
    },
  });
}
