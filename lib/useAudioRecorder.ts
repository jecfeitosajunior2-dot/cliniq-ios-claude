'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'error';

export type RecorderErrorCode =
  | 'permission-denied'
  | 'no-device'
  | 'insecure-context'
  | 'unsupported'
  | 'unknown';

export interface RecorderError {
  code: RecorderErrorCode;
  message: string;
}

export interface RecordingResult {
  /** Áudio bruto capturado, pronto para enviar à transcrição (item 2). */
  blob: Blob;
  /** Object URL para reprodução local (revogar quando não for mais usado). */
  url: string;
  /** MIME real usado pelo MediaRecorder (ex.: audio/webm;codecs=opus). */
  mimeType: string;
  /** Duração real em segundos, descontando pausas. */
  durationSec: number;
}

const ERROR_MESSAGES: Record<RecorderErrorCode, string> = {
  'permission-denied':
    'Permissão de microfone negada. Autorize o acesso nas configurações do navegador para gravar a consulta.',
  'no-device':
    'Nenhum microfone encontrado. Conecte um microfone e tente novamente.',
  'insecure-context':
    'A captura de áudio exige conexão segura (HTTPS). Acesse o app por HTTPS para gravar.',
  'unsupported':
    'Seu navegador não suporta captura de áudio (MediaRecorder).',
  'unknown':
    'Não foi possível iniciar a gravação. Tente novamente.',
};

/** Escolhe o melhor container/codec suportado. Safari/iOS costuma só aceitar mp4/aac. */
function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      /* ignore */
    }
  }
  return '';
}

export interface UseAudioRecorder {
  status: RecorderStatus;
  error: RecorderError | null;
  /** Segundos decorridos (descontando pausas). */
  elapsedSec: number;
  /** Nível de entrada do microfone, 0..1, derivado do AnalyserNode real. */
  level: number;
  /** MIME efetivamente em uso. */
  mimeType: string;
  isRecording: boolean;
  isPaused: boolean;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  /** Finaliza e resolve com o áudio capturado (ou null se nada gravado). */
  stop: () => Promise<RecordingResult | null>;
}

export function useAudioRecorder(): UseAudioRecorder {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<RecorderError | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [level, setLevel] = useState(0);
  const [mimeType, setMimeType] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const mimeTypeRef = useRef('');

  // Cronômetro robusto a pausas: tempo acumulado + início do segmento atual.
  const accumulatedMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);

  const teardownMedia = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    dataArrayRef.current = null;
  }, []);

  const tick = useCallback(() => {
    // Tempo decorrido real
    const now = performance.now();
    const elapsedMs =
      accumulatedMsRef.current +
      (segmentStartRef.current ? now - segmentStartRef.current : 0);
    const secs = Math.floor(elapsedMs / 1000);
    setElapsedSec((prev) => (prev !== secs ? secs : prev));

    // Nível de áudio real (RMS do domínio do tempo)
    const analyser = analyserRef.current;
    const buf = dataArrayRef.current;
    if (analyser && buf) {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      setLevel(Math.min(1, rms * 3.2));
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setElapsedSec(0);
    setLevel(0);
    chunksRef.current = [];
    accumulatedMsRef.current = 0;
    segmentStartRef.current = null;
    setStatus('requesting');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const insecure =
        typeof window !== 'undefined' && !window.isSecureContext;
      const code: RecorderErrorCode = insecure ? 'insecure-context' : 'unsupported';
      setError({ code, message: ERROR_MESSAGES[code] });
      setStatus('error');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      const e = err as DOMException;
      let code: RecorderErrorCode = 'unknown';
      if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
        code = 'permission-denied';
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        code = 'no-device';
      }
      setError({ code, message: ERROR_MESSAGES[code] });
      setStatus('error');
      return;
    }

    streamRef.current = stream;

    const chosen = pickMimeType();
    mimeTypeRef.current = chosen;
    let recorder: MediaRecorder;
    try {
      recorder = chosen
        ? new MediaRecorder(stream, { mimeType: chosen })
        : new MediaRecorder(stream);
    } catch {
      recorder = new MediaRecorder(stream);
    }
    recorderRef.current = recorder;
    setMimeType(recorder.mimeType || chosen);
    mimeTypeRef.current = recorder.mimeType || chosen;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    // AnalyserNode para o nível de áudio real
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.fftSize);
    } catch {
      /* nível de áudio é opcional; gravação continua */
    }

    // timeslice de 1s aumenta a robustez (especialmente no iOS)
    recorder.start(1000);
    segmentStartRef.current = performance.now();
    setStatus('recording');
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    const r = recorderRef.current;
    if (!r || r.state !== 'recording') return;
    r.pause();
    if (segmentStartRef.current) {
      accumulatedMsRef.current += performance.now() - segmentStartRef.current;
      segmentStartRef.current = null;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setLevel(0);
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    const r = recorderRef.current;
    if (!r || r.state !== 'paused') return;
    r.resume();
    segmentStartRef.current = performance.now();
    setStatus('recording');
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    return new Promise<RecordingResult | null>((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        teardownMedia();
        setStatus('stopped');
        resolve(null);
        return;
      }

      const now = performance.now();
      const totalMs =
        accumulatedMsRef.current +
        (segmentStartRef.current ? now - segmentStartRef.current : 0);

      recorder.onstop = () => {
        const type = mimeTypeRef.current || recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        const url = URL.createObjectURL(blob);
        teardownMedia();
        setLevel(0);
        setStatus('stopped');
        resolve({
          blob,
          url,
          mimeType: type,
          durationSec: Math.max(0, Math.round(totalMs / 1000)),
        });
      };

      try {
        recorder.stop();
      } catch {
        teardownMedia();
        setStatus('stopped');
        resolve(null);
      }
    });
  }, [teardownMedia]);

  // Cleanup garantido ao desmontar (libera o microfone)
  useEffect(() => {
    return () => {
      const r = recorderRef.current;
      if (r && r.state !== 'inactive') {
        try {
          r.stop();
        } catch {
          /* ignore */
        }
      }
      teardownMedia();
    };
  }, [teardownMedia]);

  return {
    status,
    error,
    elapsedSec,
    level,
    mimeType,
    isRecording: status === 'recording',
    isPaused: status === 'paused',
    start,
    pause,
    resume,
    stop,
  };
}
