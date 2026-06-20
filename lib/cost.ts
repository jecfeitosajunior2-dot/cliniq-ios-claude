import type { CaseIntelligence, TranscriptionResult } from './types';

// Premissas ajustáveis da margem unitária (item 4).
export const USD_TO_BRL = 5.4;
export const DEFAULT_PLAN_PRICE_BRL = 199; // plano Solo mensal
export const DEFAULT_ANALYSES_PER_MONTH = 60; // ~3 consultas/dia × 20 dias

export interface CostAggregate {
  audioMinutes: number;
  transcriptionUsd: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  detectiveUsd: number;
  totalUsd: number;
  totalBrl: number;
  /** Há custo real de pelo menos uma etapa (transcrição ou detective). */
  hasData: boolean;
}

/** Soma o custo das etapas de uma análise (transcrição + Clinical Detective). */
export function aggregateCost(
  transcription: TranscriptionResult | null,
  intelligence: CaseIntelligence | null,
  usdToBrl = USD_TO_BRL,
): CostAggregate {
  const transcriptionUsd = transcription?.cost.usd ?? 0;
  const detectiveUsd = intelligence?.cost.usd ?? 0;
  const totalUsd = Number((transcriptionUsd + detectiveUsd).toFixed(4));
  return {
    audioMinutes: transcription?.cost.audioMinutes ?? 0,
    transcriptionUsd,
    inputTokens: intelligence?.cost.inputTokens ?? 0,
    outputTokens: intelligence?.cost.outputTokens ?? 0,
    cacheReadTokens: intelligence?.cost.cacheReadTokens ?? 0,
    detectiveUsd,
    totalUsd,
    totalBrl: Number((totalUsd * usdToBrl).toFixed(2)),
    hasData: Boolean(transcription || intelligence),
  };
}

export interface MarginResult {
  /** Receita atribuída a uma análise = preço do plano / análises por mês. */
  revenuePerAnalysisBrl: number;
  costBrl: number;
  marginBrl: number;
  marginPct: number;
}

/** Margem unitária: receita por análise menos o custo de inferência. */
export function computeMargin(
  totalBrl: number,
  planPriceBrl: number,
  analysesPerMonth: number,
): MarginResult {
  const revenue = analysesPerMonth > 0 ? planPriceBrl / analysesPerMonth : 0;
  const margin = revenue - totalBrl;
  const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;
  return {
    revenuePerAnalysisBrl: Number(revenue.toFixed(2)),
    costBrl: Number(totalBrl.toFixed(2)),
    marginBrl: Number(margin.toFixed(2)),
    marginPct: Number(marginPct.toFixed(1)),
  };
}
