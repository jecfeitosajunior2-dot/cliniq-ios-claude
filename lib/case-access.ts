import type { SupabaseClient } from '@supabase/supabase-js';

export interface OwnedCaseRow {
  id: string;
  user_id: string;
  status: string;
  consent_confirmed_at: string | null;
  legacy_pre_consent: boolean;
  audio_path: string | null;
  case_data: unknown;
  transcription: unknown;
  intelligence: unknown;
  cost_usd: number;
}

export type LoadCaseResult =
  | { ok: true; row: OwnedCaseRow }
  | { ok: false; status: number; error: string };

/**
 * Carrega um caso garantindo posse e consentimento persistido — usado por
 * toda rota que processa um caso (transcribe, detective). Nunca aceita
 * `audioPath`/transcrição enviados pelo client nesta requisição como fonte
 * de verdade (item 3); a única entrada confiável é o `caseId`.
 *
 * Distingue deliberadamente "não encontrado" de "não autorizado" com a
 * MESMA resposta (403) para os dois casos — não vazamos se um caso existe
 * para outro usuário.
 */
export async function loadOwnedCase(
  supabase: SupabaseClient,
  userId: string,
  caseId: string,
): Promise<LoadCaseResult> {
  const { data, error } = await supabase
    .from('cases')
    .select(
      'id, user_id, status, consent_confirmed_at, legacy_pre_consent, audio_path, case_data, transcription, intelligence, cost_usd',
    )
    .eq('id', caseId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('loadOwnedCase:', error.message);
    return { ok: false, status: 503, error: 'Não foi possível carregar o caso agora. Tente novamente.' };
  }
  if (!data) {
    return { ok: false, status: 403, error: 'Você não tem acesso a este caso.' };
  }
  // legacy_pre_consent (Fase 1R2, item 5): NÃO é tratado como consentimento
  // equivalente para processamento — bloqueia transcribe/detective de forma
  // permanente (403), mesmo que consent_confirmed_at esteja preenchido por
  // algum motivo. Só evita quebrar leitura/listagem do caso. Redundante de
  // propósito com a checagem em begin_case_operation (defesa em profundidade:
  // esta rota nunca deve sequer chegar a reservar quota para um caso legado).
  if (data.legacy_pre_consent) {
    return {
      ok: false,
      status: 403,
      error: 'Este caso é anterior à exigência de consentimento e não pode ser processado.',
    };
  }
  if (!data.consent_confirmed_at) {
    return {
      ok: false,
      status: 422,
      error: 'Este caso não tem consentimento registrado. Reinicie o fluxo a partir da tela de consentimento.',
    };
  }
  return { ok: true, row: data as OwnedCaseRow };
}
