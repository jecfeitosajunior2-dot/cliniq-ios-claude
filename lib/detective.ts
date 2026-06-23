import type { CaseData, CaseIntelligence, TranscriptionResult } from './types';

/** Envia a transcrição + dados do caso para a rota do Clinical Detective. */
export async function runDetective(
  transcription: TranscriptionResult,
  caseData: CaseData | null,
): Promise<CaseIntelligence> {
  const resp = await fetch('/api/detective', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript: transcription.text,
      segments: transcription.segments,
      caseData,
    }),
  });

  if (!resp.ok) {
    let message = 'Falha ao gerar o Clinical Detective.';
    try {
      const body = await resp.json();
      if (body?.error) message = body.error;
    } catch {
      /* mantém mensagem padrão */
    }
    throw new Error(message);
  }

  return (await resp.json()) as CaseIntelligence;
}
