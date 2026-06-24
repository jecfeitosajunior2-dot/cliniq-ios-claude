'use client';

import { getSupabase } from './supabase/client';

export type UploadAudioResult = { ok: true } | { ok: false; error: string };

/**
 * Sobe o áudio via signed upload URL (Fase 1R2, item 6) — o navegador não
 * tem mais nenhuma policy de Storage própria (INSERT/UPDATE/upsert) para o
 * bucket `consultations`; o token assinado, emitido pela rota
 * `/api/cases/[id]/audio-url` usando o client privilegiado, é a única
 * autorização para este upload específico.
 *
 * Em três passos:
 * 1. pede um token de upload assinado para o path canônico deste caso;
 * 2. faz o upload em si direto pro Storage com esse token (bytes não
 *    passam pelo servidor Next.js);
 * 3. confirma a conclusão numa segunda rota, que revalida posse/estado,
 *    recalcula o path (nunca confia no que o client ecoaria) e só então
 *    marca o caso como `recorded` via client privilegiado — o navegador
 *    não tem mais grant para escrever `audio_path`/`status` diretamente.
 */
export async function uploadAudio(
  caseId: string,
  blob: Blob,
  mimeType: string,
): Promise<UploadAudioResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Backend não configurado.' };

  let urlResp: Response;
  try {
    urlResp = await fetch(`/api/cases/${caseId}/audio-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mimeType }),
    });
  } catch {
    return { ok: false, error: 'Falha de rede ao preparar o envio do áudio. Tente novamente.' };
  }
  if (!urlResp.ok) {
    const body = await urlResp.json().catch(() => ({}) as { error?: string });
    return { ok: false, error: body.error ?? 'Não foi possível preparar o envio do áudio.' };
  }
  const { path, token } = (await urlResp.json()) as { path: string; token: string };

  const { error: uploadError } = await supabase.storage
    .from('consultations')
    .uploadToSignedUrl(path, token, blob, { contentType: mimeType });
  if (uploadError) {
    console.error('uploadAudio:', uploadError.message);
    return { ok: false, error: 'Não foi possível enviar o áudio. Verifique sua conexão e tente novamente.' };
  }

  let confirmResp: Response;
  try {
    confirmResp = await fetch(`/api/cases/${caseId}/audio-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mimeType }),
    });
  } catch {
    return { ok: false, error: 'Áudio enviado, mas falha de rede ao confirmar. Tente novamente.' };
  }
  if (!confirmResp.ok) {
    const body = await confirmResp.json().catch(() => ({}) as { error?: string });
    return { ok: false, error: body.error ?? 'Áudio enviado, mas não foi possível confirmar. Tente novamente.' };
  }

  return { ok: true };
}
