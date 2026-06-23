'use client';

import { getSupabase } from './supabase/client';

/** Extensão coerente com o MIME do MediaRecorder. */
export function extForMime(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('aac')) return 'm4a';
  if (mime.includes('mpeg')) return 'mp3';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  return 'webm';
}

export interface UploadedAudio {
  /** Caminho no bucket (guardado no caso). */
  path: string;
  /** URL assinada de curta duração, para a rota de transcrição baixar. */
  signedUrl: string;
}

/**
 * Sobe o áudio direto para o Supabase Storage (não passa pela Vercel, então
 * não esbarra no limite de corpo de requisição). Retorna null se o Supabase
 * não está configurado ou não há sessão — aí o fluxo usa o upload direto.
 */
export async function uploadAudio(
  blob: Blob,
  mimeType: string,
): Promise<UploadedAudio | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const path = `${userId}/${Date.now()}.${extForMime(mimeType)}`;

  const { error: uploadError } = await supabase.storage
    .from('consultations')
    .upload(path, blob, { contentType: mimeType, upsert: false });
  if (uploadError) {
    console.error('uploadAudio:', uploadError.message);
    return null;
  }

  // URL assinada válida por 10 min — tempo de sobra para a transcrição.
  const { data: signed, error: signError } = await supabase.storage
    .from('consultations')
    .createSignedUrl(path, 600);
  if (signError || !signed?.signedUrl) {
    console.error('uploadAudio sign:', signError?.message);
    return null;
  }

  return { path, signedUrl: signed.signedUrl };
}
