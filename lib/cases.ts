'use client';

import { getSupabase } from './supabase/client';
import { CONSENT_TEXT_VERSION } from './consent';
import type { CaseData, CaseIntelligence, CaseStatus, DeleteStatus, TranscriptionResult } from './types';

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
  audioPath: string | null;
  status: CaseStatus;
  deleteStatus: DeleteStatus;
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
    audioPath: row.audio_path ?? null,
    status: (row.status ?? 'draft') as CaseStatus,
    deleteStatus: (row.delete_status ?? 'active') as DeleteStatus,
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

export type CreateDraftResult = { id: string } | { error: string };

/**
 * Cria o rascunho do caso NO MOMENTO do consentimento — antes de o
 * microfone ligar. Persiste `consent_confirmed_at`/`consent_text_version`
 * junto com a criação, não como um campo solto preenchido depois (item 4).
 * A gravação só deve começar se esta função retornar um id.
 */
export async function createDraftCase(): Promise<CreateDraftResult> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Backend não configurado.' };

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { error: 'Sessão inválida ou expirada. Faça login novamente.' };

  const consentConfirmedAt = new Date().toISOString();

  // `status` não é mais gravável pelo navegador (Fase 1R2, item 4) — o
  // default da coluna ('draft') cobre a criação; só a camada privilegiada
  // avança o status depois disso.
  const { data, error } = await supabase
    .from('cases')
    .insert({
      user_id: userId,
      consent_confirmed_at: consentConfirmedAt,
      consent_text_version: CONSENT_TEXT_VERSION,
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    console.error('createDraftCase:', error?.message);
    return { error: 'Não foi possível iniciar o caso. Verifique sua conexão e tente novamente.' };
  }
  return { id: data.id };
}

/** Persiste os dados de identificação do caso (formulário de CompleteCase). */
export async function updateCaseData(caseId: string, data: CaseData): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from('cases')
    .update({
      patient_name: data.patientName,
      patient_initials: initialsFrom(data.patientName),
      age: data.age,
      gender: data.gender,
      specialty: data.specialty,
      chief_complaint: data.chiefComplaint,
      case_data: data,
    })
    .eq('id', caseId);

  if (error) {
    console.error('updateCaseData:', error.message);
    return false;
  }
  return true;
}

export type DeleteCaseResult = { ok: boolean; status: DeleteStatus; error?: string };

/**
 * Apaga um caso via rota server-side autenticada (item 5) — o client não
 * apaga mais Storage/linha diretamente. O servidor mantém um estado de
 * exclusão explícito e recuperável; uma falha parcial nunca é relatada como
 * sucesso, e a chamada pode ser repetida com segurança (idempotente).
 */
export async function deleteCase(id: string): Promise<DeleteCaseResult> {
  let resp: Response;
  try {
    resp = await fetch(`/api/cases/${id}`, { method: 'DELETE' });
  } catch {
    return { ok: false, status: 'delete_failed', error: 'Falha de rede ao apagar o caso. Tente novamente.' };
  }

  let body: { status?: DeleteStatus; error?: string } = {};
  try {
    body = await resp.json();
  } catch {
    /* corpo vazio em alguns erros — segue com mensagem padrão */
  }

  if (!resp.ok) {
    return {
      ok: false,
      status: body.status ?? 'delete_failed',
      error: body.error ?? 'Não foi possível apagar o caso. Tente novamente.',
    };
  }

  const status = body.status ?? 'deleted';
  return { ok: status === 'deleted', status };
}

/** Lista os casos do médico logado (mais recentes primeiro). Inclui casos com exclusão pendente/falha — nunca some um caso sem confirmação de exclusão completa. */
export async function listCases(limit = 50): Promise<CaseSummary[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('cases')
    .select(
      'id, patient_name, patient_initials, age, specialty, summary, findings_count, cost_usd, created_at, audio_path, status, delete_status',
    )
    .neq('delete_status', 'deleted')
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
