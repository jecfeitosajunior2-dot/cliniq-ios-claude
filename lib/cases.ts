'use client';

import { getSupabase } from './supabase/client';
import { aggregateCost } from './cost';
import type { CaseData, CaseIntelligence, TranscriptionResult } from './types';

/** Resumo de um caso para a lista (Home / Ver todos). */
export interface CaseSummary {
  id: string;
  patientName: string;
  patientInitials: string;
  age: string;
  specialty: string;
  summary: string;
  findingsCount: number;
  costUsd: number;
  createdAt: string;
}

/** Caso completo, com transcrição e dossiê, para reabrir o relatório. */
export interface FullCase extends CaseSummary {
  caseData: CaseData | null;
  transcription: TranscriptionResult | null;
  intelligence: CaseIntelligence | null;
}

/** Iniciais a partir do nome do paciente ("Maria Silva" -> "M.S."). */
export function initialsFrom(name: string | undefined | null): string {
  if (!name) return 'P';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'P';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return [first, last].filter(Boolean).map((c) => `${c.toUpperCase()}.`).join('');
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToSummary(row: any): CaseSummary {
  return {
    id: row.id,
    patientName: row.patient_name ?? '',
    patientInitials: row.patient_initials ?? initialsFrom(row.patient_name),
    age: row.age ?? '',
    specialty: row.specialty ?? '',
    summary: row.summary ?? '',
    findingsCount: row.findings_count ?? 0,
    costUsd: Number(row.cost_usd ?? 0),
    createdAt: row.created_at,
  };
}

function rowToFull(row: any): FullCase {
  return {
    ...rowToSummary(row),
    caseData: row.case_data ?? null,
    transcription: row.transcription ?? null,
    intelligence: row.intelligence ?? null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Persiste um caso analisado. Retorna o id, ou null se o Supabase não está
 * configurado (modo local) ou se não há sessão.
 */
export async function saveCase(
  caseData: CaseData | null,
  transcription: TranscriptionResult | null,
  intelligence: CaseIntelligence | null,
  audioPath: string | null,
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const cost = aggregateCost(transcription, intelligence);
  const patientName = caseData?.patientName ?? '';

  const { data, error } = await supabase
    .from('cases')
    .insert({
      user_id: userId,
      patient_name: patientName,
      patient_initials: initialsFrom(patientName),
      age: caseData?.age ?? '',
      gender: caseData?.gender ?? '',
      specialty: caseData?.specialty ?? '',
      chief_complaint: caseData?.chiefComplaint ?? '',
      summary: intelligence?.summary ?? '',
      findings_count: intelligence?.detectiveFindings.length ?? 0,
      cost_usd: cost.totalUsd,
      case_data: caseData,
      transcription,
      intelligence,
      audio_path: audioPath,
    })
    .select('id')
    .single();

  if (error) {
    console.error('saveCase:', error.message);
    return null;
  }
  return data?.id ?? null;
}

/** Lista os casos do médico logado (mais recentes primeiro). */
export async function listCases(limit = 50): Promise<CaseSummary[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('cases')
    .select('id, patient_name, patient_initials, age, specialty, summary, findings_count, cost_usd, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('listCases:', error.message);
    return [];
  }
  return (data ?? []).map(rowToSummary);
}

/** Carrega um caso completo (para reabrir o relatório). */
export async function getCase(id: string): Promise<FullCase | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('getCase:', error.message);
    return null;
  }
  return data ? rowToFull(data) : null;
}

/** Tempo relativo curto em PT-BR ("2h", "Ontem", "3d"). */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMin = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return 'Ontem';
  if (diffD < 7) return `${diffD}d`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
