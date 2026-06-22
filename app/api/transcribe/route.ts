import { NextResponse } from 'next/server';
import type { TranscriptionResult, TranscriptSegment } from '@/lib/types';

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

  let audio: Blob;
  let clientDuration = 0;
  let filename = 'consulta.webm';

  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    // Caminho do Storage: o áudio já foi para o Supabase (sem passar pela
    // Vercel), então recebemos só uma URL assinada e buscamos server-side.
    // Isso evita o limite de ~4,5MB de corpo de requisição da Vercel.
    let body: { audioUrl?: string; durationSec?: number; filename?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
    }
    if (!body.audioUrl) {
      return NextResponse.json({ error: 'audioUrl ausente.' }, { status: 400 });
    }
    clientDuration = Number(body.durationSec) || 0;
    if (body.filename) filename = body.filename;
    try {
      const audioResp = await fetch(body.audioUrl);
      if (!audioResp.ok) {
        return NextResponse.json(
          { error: `Não consegui baixar o áudio do storage (${audioResp.status}).` },
          { status: 502 },
        );
      }
      audio = await audioResp.blob();
    } catch {
      return NextResponse.json(
        { error: 'Falha de rede ao baixar o áudio do storage.' },
        { status: 502 },
      );
    }
  } else {
    // Caminho direto (multipart): áudios curtos, modo local sem Storage.
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json(
        { error: 'Requisição inválida (esperado multipart/form-data ou JSON).' },
        { status: 400 },
      );
    }
    const field = form.get('audio');
    if (!(field instanceof Blob) || field.size === 0) {
      return NextResponse.json({ error: 'Áudio ausente ou vazio.' }, { status: 400 });
    }
    audio = field;
    clientDuration = Number(form.get('durationSec')) || 0;
    const filenameField = form.get('filename');
    if (typeof filenameField === 'string' && filenameField) filename = filenameField;
  }

  if (audio.size === 0) {
    return NextResponse.json({ error: 'Áudio vazio.' }, { status: 400 });
  }

  // Encaminha ao provedor de transcrição (OpenAI Whisper).
  const upstream = new FormData();
  upstream.append('file', audio, filename);
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

  const durationSec = Math.round(data.duration ?? clientDuration);
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

  return NextResponse.json(result);
}
