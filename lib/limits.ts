/**
 * Limites do piloto fechado. Únicos valores de configuração de uso — não
 * espalhar números mágicos pelas rotas. Ajuste aqui conforme o piloto evoluir.
 */
export const PILOT_LIMITS = {
  /** Máximo de chamadas (transcrição + análise somadas) por médico, por 24h. */
  maxRequestsPerUserPerDay: 30,
  /** Duração máxima de áudio aceita por consulta, em segundos (20 min). */
  maxAudioDurationSec: 20 * 60,
  /** Tamanho máximo de áudio aceito, em bytes (25 MB — teto também usado pela Whisper API). */
  maxAudioBytes: 25 * 1024 * 1024,
  /** Tamanho máximo de transcrição aceito pela análise, em caracteres. */
  maxTranscriptChars: 200_000,
} as const;

const ALLOWED_AUDIO_MIME_FRAGMENTS = ['webm', 'mp4', 'aac', 'mpeg', 'mp3', 'ogg', 'wav', 'm4a'];

/** Validação superficial de MIME — não confia em extensão, mas barra tipos claramente errados. */
export function isAllowedAudioMime(mime: string): boolean {
  const m = (mime || '').toLowerCase();
  if (!m.startsWith('audio/') && !m.startsWith('video/')) return false;
  return ALLOWED_AUDIO_MIME_FRAGMENTS.some((f) => m.includes(f));
}

/**
 * Extensão coerente com o MIME do MediaRecorder. Compartilhada entre client
 * (lib/audio-upload.ts) e as rotas server-side de upload assinado
 * (app/api/cases/[id]/audio-url, audio-confirm) — as duas pontas PRECISAM
 * calcular o mesmo path a partir do mesmo mimeType para o upload assinado
 * funcionar e para a confirmação recalcular (não confiar em) o path.
 */
export function extForMime(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('aac')) return 'm4a';
  if (mime.includes('mpeg')) return 'mp3';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  return 'webm';
}
