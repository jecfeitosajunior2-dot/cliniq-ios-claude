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

/** Estado do caso no pipeline server-side (espelha o CHECK em `cases.status`). */
export type CaseStatus = 'draft' | 'recorded' | 'transcribed' | 'ready' | 'failed';

/** Estado de exclusão recuperável (espelha o CHECK em `cases.delete_status`). */
export type DeleteStatus = 'active' | 'delete_requested' | 'deleting' | 'delete_failed' | 'deleted';

/** Dados do caso preenchidos pelo médico em CompleteCase. */
export interface CaseData {
  patientName: string;
  age: string;
  gender: 'M' | 'F' | '';
  specialty: string;
  chiefComplaint: string;
  objective: string;
}

// ---- Item 3: Clinical Detective real (saída estruturada do claude-opus-4-8) ----

export type FindingType = 'pattern' | 'inconsistency' | 'correlation' | 'gap';
export type Confidence = 'alta' | 'media-alta' | 'media' | 'baixa';
export type Priority = 'critical' | 'high' | 'moderate' | 'low';

/** Evidência rastreável: timestamp do áudio (ou fonte) → trecho citado. */
export interface DetectiveEvidence {
  /** Fonte da evidência (ex.: "Consulta", "Exame"). */
  source: string;
  /** Timestamp no áudio no formato mm:ss; vazio se a evidência não vem do áudio. */
  timestamp: string;
  /** Trecho literal que sustenta a conclusão. */
  quote: string;
}

export interface DetectiveFinding {
  id: string;
  type: FindingType;
  title: string;
  conclusion: string;
  whyItMatters: string;
  confidence: Confidence;
  nextAction: string;
  evidence: DetectiveEvidence[];
}

export interface CaseProblem {
  title: string;
  priority: Priority;
  status: string;
  summary: string;
}

export interface CaseGap {
  question: string;
  impact: string;
  priority: Priority;
}

export interface NextStep {
  action: string;
  urgency: string;
  reason: string;
}

export interface TimelineEvent {
  date: string;
  event: string;
  type: 'symptom' | 'worsening' | 'exam' | 'consultation' | 'other';
}

/** Custo de uma chamada de LLM em tokens (alimenta a margem — item 4). */
export interface TokenCostBreakdown {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  usd: number;
}

/** Dossiê clínico estruturado, gerado pelo claude-opus-4-8. */
export interface CaseIntelligence {
  summary: string;
  detectiveFindings: DetectiveFinding[];
  problems: CaseProblem[];
  gaps: CaseGap[];
  nextSteps: NextStep[];
  timeline: TimelineEvent[];
  cost: TokenCostBreakdown;
}
