import type { CaseIntelligence } from './types';

/**
 * Pede o dossiê do Clinical Detective para um caso já transcrito. Manda só
 * o `caseId` — o servidor relê a transcrição e os dados do caso da linha
 * persistida, nunca aceita transcrição arbitrária enviada pelo client como
 * fonte de verdade (item 3).
 */
export async function runDetective(caseId: string): Promise<CaseIntelligence> {
  const resp = await fetch('/api/detective', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseId }),
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
