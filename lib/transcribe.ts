import type { TranscriptionResult } from './types';

/**
 * Pede a transcrição do áudio já associado ao caso. Manda só o `caseId` — o
 * servidor resolve dono, consentimento, estado e o path do áudio a partir da
 * linha do caso, nunca de um path/URL enviado nesta requisição (item 3).
 */
export async function transcribeAudio(caseId: string): Promise<TranscriptionResult> {
  const resp = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseId }),
  });

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
