import type { TranscriptionResult } from './types';

/** Extensão de arquivo coerente com o MIME (Whisper exige nome com extensão). */
function extForMime(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('aac')) return 'm4a';
  if (mime.includes('mpeg')) return 'mp3';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  return 'webm';
}

/**
 * Envia o áudio para a rota de transcrição e devolve o resultado real.
 *
 * Se `audioUrl` é fornecida (áudio já no Storage), manda só a URL em JSON — o
 * servidor baixa o arquivo, contornando o limite de corpo da Vercel. Caso
 * contrário, faz upload direto via multipart (modo local / áudios curtos).
 */
export async function transcribeAudio(
  blob: Blob,
  mimeType: string,
  durationSec: number,
  audioUrl?: string | null,
): Promise<TranscriptionResult> {
  const filename = `consulta.${extForMime(mimeType)}`;

  let resp: Response;
  if (audioUrl) {
    resp = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioUrl, durationSec, filename }),
    });
  } else {
    const form = new FormData();
    form.append('audio', blob, filename);
    form.append('filename', filename);
    form.append('durationSec', String(durationSec));
    resp = await fetch('/api/transcribe', { method: 'POST', body: form });
  }

  if (!resp.ok) {
    let message = 'Falha na transcrição.';
    try {
      const body = await resp.json();
      if (body?.error) message = body.error;
    } catch {
      /* mantém mensagem padrão */
    }
    throw new Error(message);
  }

  return (await resp.json()) as TranscriptionResult;
}
