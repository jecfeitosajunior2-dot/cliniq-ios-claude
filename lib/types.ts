// Tipos compartilhados do pipeline clínico (itens 2-4).

export interface TranscriptSegment {
  id: number;
  /** Início do trecho no áudio, em segundos. */
  start: number;
  /** Fim do trecho no áudio, em segundos. */
  end: number;
  text: string;
}

/** Custo unitário de uma etapa (alimenta a instrumentação de margem — item 4). */
export interface CostBreakdown {
  provider: string;
  model: string;
  audioSeconds: number;
  audioMinutes: number;
  usd: number;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  durationSec: number;
  segments: TranscriptSegment[];
  cost: CostBreakdown;
}

/** Dados do caso preenchidos pelo médico em CompleteCase. */
export interface CaseData {
  patientName: string;
  age: string;
  gender: 'M' | 'F' | '';
  specialty: string;
  chiefComplaint: string;
  objective: string;
}
