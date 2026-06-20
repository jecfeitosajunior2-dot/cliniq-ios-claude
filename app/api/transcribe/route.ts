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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'Requisição inválida (esperado multipart/form-data).' },
      { status: 400 },
    );
  }

  const audio = form.get('audio');
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: 'Áudio ausente ou vazio.' }, { status: 400 });
  }

  const clientDuration = Number(form.get('durationSec')) || 0;
  const filenameField = form.get('filename');
  const filename =
    typeof filenameField === 'string' && filenameField ? filenameField : 'consulta.webm';

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
