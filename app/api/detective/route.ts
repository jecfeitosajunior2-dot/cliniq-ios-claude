import Anthropic from '@anthropic-ai/sdk';
import type {
  CaseData,
  CaseIntelligence,
  TranscriptionResult,
  TranscriptSegment,
} from '@/lib/types';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getPrivilegedSupabase } from '@/lib/supabase/privileged';
import { loadOwnedCase } from '@/lib/case-access';
import { beginCaseOperation, finishCaseOperation } from '@/lib/case-operations';
import { PILOT_LIMITS } from '@/lib/limits';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Preços Claude Opus 4.8 (USD por 1M tokens) — base do custo do item 4.
const OPUS_INPUT_USD_PER_MTOK = 5;
const OPUS_OUTPUT_USD_PER_MTOK = 25;
const MODEL = 'claude-opus-4-8';

// Schema da saída estruturada (structured outputs). Todo objeto exige
// additionalProperties:false e required com todas as chaves.
const CASE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: {
      type: 'string',
      description: 'Resumo clínico do caso para leitura em ~30 segundos.',
    },
    detectiveFindings: {
      type: 'array',
      description:
        'Achados do Clinical Detective: padrões, inconsistências, correlações e lacunas.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['pattern', 'inconsistency', 'correlation', 'gap'] },
          title: { type: 'string' },
          conclusion: { type: 'string' },
          whyItMatters: { type: 'string' },
          confidence: { type: 'string', enum: ['alta', 'media-alta', 'media', 'baixa'] },
          nextAction: { type: 'string' },
          evidence: {
            type: 'array',
            description:
              'Evidências rastreáveis. Cada uma cita o timestamp do áudio (mm:ss) e o trecho literal que sustenta a conclusão.',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                source: { type: 'string' },
                timestamp: {
                  type: 'string',
                  description:
                    'Timestamp no áudio no formato mm:ss. String vazia se a evidência não vier do áudio.',
                },
                quote: { type: 'string' },
              },
              required: ['source', 'timestamp', 'quote'],
            },
          },
        },
        required: ['id', 'type', 'title', 'conclusion', 'whyItMatters', 'confidence', 'nextAction', 'evidence'],
      },
    },
    problems: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          priority: { type: 'string', enum: ['critical', 'high', 'moderate', 'low'] },
          status: { type: 'string' },
          summary: { type: 'string' },
        },
        required: ['title', 'priority', 'status', 'summary'],
      },
    },
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          question: { type: 'string' },
          impact: { type: 'string' },
          priority: { type: 'string', enum: ['critical', 'high', 'moderate', 'low'] },
        },
        required: ['question', 'impact', 'priority'],
      },
    },
    nextSteps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action: { type: 'string' },
          urgency: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['action', 'urgency', 'reason'],
      },
    },
    timeline: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          date: { type: 'string' },
          event: { type: 'string' },
          type: { type: 'string', enum: ['symptom', 'worsening', 'exam', 'consultation', 'other'] },
        },
        required: ['date', 'event', 'type'],
      },
    },
  },
  required: ['summary', 'detectiveFindings', 'problems', 'gaps', 'nextSteps', 'timeline'],
} as const;

const SYSTEM_PROMPT = `Você é o Clinical Detective do ClinIQ, um assistente de SUPORTE À DECISÃO clínica — nunca um diagnóstico. Você analisa a transcrição de uma consulta médica em português e produz um dossiê estruturado.

Princípios obrigatórios:
- Baseie CADA conclusão em evidências presentes na transcrição. Não invente fatos, medicações, exames ou números que não foram ditos.
- Toda evidência deve citar o timestamp do áudio (formato mm:ss) do trecho que a sustenta e um trecho literal curto. Use o timestamp do segmento correspondente.
- Se a informação não existir na transcrição, registre como lacuna (gap) em vez de supor.
- Calibre a confiança honestamente. Prefira "media" ou "baixa" quando a evidência for fraca.
- Escreva em português do Brasil, conciso e clínico. Não use jargão desnecessário.
- Você apoia o raciocínio do médico; a decisão e o diagnóstico são sempre dele.`;

function formatSegments(segments: TranscriptSegment[]): string {
  return segments
    .map((s) => {
      const m = Math.floor(s.start / 60);
      const sec = Math.floor(s.start % 60);
      const ts = `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
      return `[${ts}] ${s.text}`;
    })
    .join('\n');
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return Response.json(
      {
        error:
          'Clinical Detective indisponível: defina ANTHROPIC_API_KEY (ou ANTHROPIC_AUTH_TOKEN) no ambiente.',
      },
      { status: 503 },
    );
  }

  // Validação de sessão ANTES de qualquer leitura de corpo ou chamada externa.
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return Response.json({ error: 'Backend não configurado.' }, { status: 503 });
  }
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) {
    return Response.json(
      { error: 'Sessão inválida ou expirada. Faça login novamente.' },
      { status: 401 },
    );
  }

  // Camada privilegiada (Fase 1R2, item 1) — só ela pode gravar campos
  // server-controlled de `cases` a partir daqui.
  const privileged = getPrivilegedSupabase();
  if (!privileged) {
    return Response.json(
      { error: 'Backend privilegiado não configurado neste ambiente.' },
      { status: 503 },
    );
  }

  // Única entrada aceita: o id do caso. Transcrição e dados do caso vêm da
  // linha persistida — nunca de transcrição enviada solta pelo client (item 3).
  let body: { caseId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Requisição inválida (JSON esperado).' }, { status: 400 });
  }
  const caseId = body.caseId;
  if (!caseId) {
    return Response.json({ error: 'caseId ausente.' }, { status: 400 });
  }

  const loaded = await loadOwnedCase(supabase, userId, caseId);
  if (!loaded.ok) {
    return Response.json({ error: loaded.error }, { status: loaded.status });
  }
  const caseRow = loaded.row;

  if (caseRow.status !== 'transcribed') {
    return Response.json(
      {
        error:
          caseRow.status === 'ready'
            ? 'Este caso já tem um dossiê gerado.'
            : 'Este caso ainda não foi transcrito.',
      },
      { status: 422 },
    );
  }

  const transcription = caseRow.transcription as TranscriptionResult | null;
  const fullText = (transcription?.text ?? '').trim();
  const segments = transcription?.segments ?? [];
  if (!transcription || (!fullText && segments.length === 0)) {
    return Response.json({ error: 'Transcrição ausente para este caso.' }, { status: 422 });
  }
  if (fullText.length > PILOT_LIMITS.maxTranscriptChars) {
    return Response.json(
      { error: 'Transcrição maior que o limite permitido no piloto.' },
      { status: 413 },
    );
  }

  const beginResult = await beginCaseOperation(userId, caseId, 'detective');
  if (!beginResult.ok) {
    return Response.json({ error: beginResult.error }, { status: beginResult.status });
  }
  const { processingJobId } = beginResult;

  let finishedAs: 'done' | 'failed' = 'failed';
  try {
    const c = caseRow.case_data as CaseData | null;
    const caseHeader = c
      ? `Paciente: ${c.patientName || 'não informado'}; Idade: ${c.age || 'não informada'}; Sexo: ${
          c.gender === 'F' ? 'feminino' : c.gender === 'M' ? 'masculino' : 'não informado'
        }; Especialidade: ${c.specialty || 'não informada'}; Queixa principal: ${
          c.chiefComplaint || 'não informada'
        }; Objetivo: ${c.objective || 'não informado'}.`
      : 'Dados do caso não informados.';

    const userContent = `Contexto do caso:
${caseHeader}

Transcrição da consulta (cada linha começa com o timestamp [mm:ss] do trecho no áudio):
${segments.length > 0 ? formatSegments(segments) : fullText}

Gere o dossiê clínico estruturado conforme o schema. Garanta que cada evidência aponte para o timestamp [mm:ss] do trecho correspondente.`;

    const client = new Anthropic();

    let message: Anthropic.Message;
    try {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        system: SYSTEM_PROMPT,
        output_config: { format: { type: 'json_schema', schema: CASE_SCHEMA } },
        messages: [{ role: 'user', content: userContent }],
      });
      message = await stream.finalMessage();
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'erro desconhecido';
      return Response.json(
        { error: 'Falha ao gerar o Clinical Detective.', detail: detail.slice(0, 500) },
        { status: 502 },
      );
    }

    if (message.stop_reason === 'refusal') {
      return Response.json(
        { error: 'A análise foi recusada por políticas de segurança.' },
        { status: 422 },
      );
    }

    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return Response.json({ error: 'Resposta vazia do modelo.' }, { status: 502 });
    }

    let parsed: Omit<CaseIntelligence, 'cost'>;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return Response.json({ error: 'Saída do modelo não pôde ser interpretada.' }, { status: 502 });
    }

    const usage = message.usage;
    const inputTokens = usage.input_tokens ?? 0;
    const outputTokens = usage.output_tokens ?? 0;
    const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
    const usd = Number(
      (
        (inputTokens / 1_000_000) * OPUS_INPUT_USD_PER_MTOK +
        (outputTokens / 1_000_000) * OPUS_OUTPUT_USD_PER_MTOK
      ).toFixed(4),
    );

    const result: CaseIntelligence = {
      summary: parsed.summary ?? '',
      detectiveFindings: parsed.detectiveFindings ?? [],
      problems: parsed.problems ?? [],
      gaps: parsed.gaps ?? [],
      nextSteps: parsed.nextSteps ?? [],
      timeline: parsed.timeline ?? [],
      cost: {
        provider: 'anthropic',
        model: MODEL,
        inputTokens,
        outputTokens,
        cacheReadTokens,
        usd,
      },
    };

    // status/intelligence/cost_usd são server-controlled (item 4) — só a
    // camada privilegiada tem GRANT para gravá-los. Passa pelo trigger de
    // máquina de estados (transcribed -> ready), que exige transcription e
    // intelligence presentes.
    const { error: updateError } = await privileged
      .from('cases')
      .update({
        intelligence: result,
        summary: result.summary,
        findings_count: result.detectiveFindings.length,
        status: 'ready',
        cost_usd: Number((caseRow.cost_usd + usd).toFixed(4)),
      })
      .eq('id', caseId)
      .eq('user_id', userId);
    if (updateError) {
      console.error('detective: falha ao persistir dossiê', updateError.message);
      return Response.json(
        { error: 'Dossiê gerado, mas não foi possível salvar no caso. Tente novamente.' },
        { status: 502 },
      );
    }

    finishedAs = 'done';
    return Response.json(result);
  } finally {
    await finishCaseOperation(userId, caseId, 'detective', processingJobId, finishedAs);
  }
}
