import { NextResponse } from 'next/server';
import type { TranscriptionResult, TranscriptSegment } from '@/lib/types';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getPrivilegedSupabase } from '@/lib/supabase/privileged';
import { loadOwnedCase } from '@/lib/case-access';
import { beginCaseOperation, finishCaseOperation } from '@/lib/case-operations';
import { PILOT_LIMITS } from '@/lib/limits';

export const runtime = 'nodejs';
// Consultas longas levam tempo; eleve conforme o plano da Vercel.
export const maxDuration = 300;

// whisper-1: US$ 0,006 por minuto de áudio (base para o item 4).
const WHISPER_USD_PER_MINUTE = 0.006;

interface WhisperVerboseResponse {
  text?: string;
  language?: string;
  duration?: number;
  segments?: Array<{ id: number; start: number; end: number; text: string }>;
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'Transcrição indisponível: defina OPENAI_API_KEY no ambiente para ativar o motor de STT.',
      },
      { status: 503 },
    );
  }

  // Validação de sessão ANTES de qualquer leitura de corpo ou chamada externa.
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Backend não configurado.' },
      { status: 503 },
    );
  }
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: 'Sessão inválida ou expirada. Faça login novamente.' },
      { status: 401 },
    );
  }

  // Camada privilegiada (Fase 1R2, item 1) — só ela pode ler/gravar áudio
  // no Storage e gravar campos server-controlled de `cases` a partir daqui.
  const privileged = getPrivilegedSupabase();
  if (!privileged) {
    return NextResponse.json(
      { error: 'Backend privilegiado não configurado neste ambiente.' },
      { status: 503 },
    );
  }

  // Única entrada aceita: o id do caso. O servidor resolve dono, consentimento,
  // estado e o path do áudio a partir do banco — nunca de dados soltos no corpo.
  let body: { caseId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requisição inválida (JSON esperado).' }, { status: 400 });
  }
  const caseId = body.caseId;
  if (!caseId) {
    return NextResponse.json({ error: 'caseId ausente.' }, { status: 400 });
  }

  const loaded = await loadOwnedCase(supabase, userId, caseId);
  if (!loaded.ok) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }
  const caseRow = loaded.row;

  if (caseRow.status !== 'recorded') {
    return NextResponse.json(
      {
        error:
          caseRow.status === 'transcribed' || caseRow.status === 'ready'
            ? 'Este caso já foi transcrito.'
            : 'Este caso ainda não tem áudio gravado.',
      },
      { status: 422 },
    );
  }
  if (!caseRow.audio_path) {
    return NextResponse.json({ error: 'Áudio do caso não encontrado.' }, { status: 422 });
  }

  const beginResult = await beginCaseOperation(userId, caseId, 'transcribe');
  if (!beginResult.ok) {
    return NextResponse.json({ error: beginResult.error }, { status: beginResult.status });
  }
  const { processingJobId } = beginResult;

  let finishedAs: 'done' | 'failed' = 'failed';
  try {
    // Baixa o áudio do Storage server-side via signed URL emitida pelo
    // client privilegiado — o navegador não tem mais policy de leitura
    // direta do bucket (item 6). O path veio da linha do caso (já validada
    // como própria), nunca de um campo solto.
    const { data: signed, error: signError } = await privileged.storage
      .from('consultations')
      .createSignedUrl(caseRow.audio_path, 120);
    if (signError || !signed?.signedUrl) {
      return NextResponse.json(
        { error: 'Não foi possível acessar o áudio do caso.' },
        { status: 502 },
      );
    }

    let audioBlob: Blob;
    try {
      const audioResp = await fetch(signed.signedUrl);
      if (!audioResp.ok) {
        return NextResponse.json(
          { error: `Não consegui baixar o áudio do storage (${audioResp.status}).` },
          { status: 502 },
        );
      }
      audioBlob = await audioResp.blob();
    } catch {
      return NextResponse.json(
        { error: 'Falha de rede ao baixar o áudio do storage.' },
        { status: 502 },
      );
    }

    if (audioBlob.size === 0) {
      return NextResponse.json({ error: 'Áudio vazio.' }, { status: 400 });
    }
    if (audioBlob.size > PILOT_LIMITS.maxAudioBytes) {
      return NextResponse.json(
        { error: 'Áudio maior que o limite permitido no piloto.' },
        { status: 413 },
      );
    }

    const filename = `consulta.${caseRow.audio_path.split('.').pop() || 'webm'}`;
    const upstream = new FormData();
    upstream.append('file', audioBlob, filename);
    upstream.append('model', 'whisper-1');
    upstream.append('language', 'pt');
    upstream.append('response_format', 'verbose_json');
    upstream.append('temperature', '0');

    let resp: Response;
    try {
      resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: upstream,
      });
    } catch {
      return NextResponse.json(
        { error: 'Falha de rede ao contatar o serviço de transcrição.' },
        { status: 502 },
      );
    }

    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      return NextResponse.json(
        { error: `Transcrição falhou (${resp.status}).`, detail: detail.slice(0, 500) },
        { status: 502 },
      );
    }

    const data = (await resp.json()) as WhisperVerboseResponse;

    const segments: TranscriptSegment[] = (data.segments ?? []).map((s) => ({
      id: s.id,
      start: s.start,
      end: s.end,
      text: (s.text ?? '').trim(),
    }));

    const durationSec = Math.round(data.duration ?? 0);
    const audioMinutes = durationSec / 60;
    const usd = Number((audioMinutes * WHISPER_USD_PER_MINUTE).toFixed(4));

    const result: TranscriptionResult = {
      text: (data.text ?? '').trim(),
      language: data.language ?? 'portuguese',
      durationSec,
      segments,
      cost: {
        provider: 'openai',
        model: 'whisper-1',
        audioSeconds: durationSec,
        audioMinutes: Number(audioMinutes.toFixed(2)),
        usd,
      },
    };

    // status/transcription/cost_usd são server-controlled (item 4) — só a
    // camada privilegiada tem GRANT para gravá-los. Passa pelo trigger de
    // máquina de estados (recorded -> transcribed), que exige audio_path e
    // transcription presentes.
    const { error: updateError } = await privileged
      .from('cases')
      .update({
        transcription: result,
        status: 'transcribed',
        cost_usd: Number((caseRow.cost_usd + usd).toFixed(4)),
      })
      .eq('id', caseId)
      .eq('user_id', userId);
    if (updateError) {
      console.error('transcribe: falha ao persistir transcrição', updateError.message);
      return NextResponse.json(
        { error: 'Transcrição concluída, mas não foi possível salvar no caso. Tente novamente.' },
        { status: 502 },
      );
    }

    finishedAs = 'done';
    return NextResponse.json(result);
  } finally {
    await finishCaseOperation(userId, caseId, 'transcribe', processingJobId, finishedAs);
  }
}
