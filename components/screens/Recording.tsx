'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  Pause,
  Square,
  Bookmark,
  Mic,
  Activity,
  AudioLines,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useAudioRecorder, type RecordingResult } from '@/lib/useAudioRecorder';

interface RecordingProps {
  onComplete: (result: RecordingResult) => void;
  onCancel: () => void;
}

const MIN_SECONDS = 3;

function friendlyCodec(mime: string): string {
  if (!mime) return 'Áudio';
  if (mime.includes('opus')) return 'WebM · Opus';
  if (mime.includes('mp4') || mime.includes('aac')) return 'MP4 · AAC';
  if (mime.includes('ogg')) return 'Ogg';
  if (mime.includes('webm')) return 'WebM';
  return mime;
}

export default function Recording({ onComplete, onCancel }: RecordingProps) {
  const {
    status,
    error,
    elapsedSec,
    level,
    mimeType,
    isPaused,
    start,
    pause,
    resume,
    stop,
  } = useAudioRecorder();

  const startedRef = useRef(false);

  // Inicia a captura ao montar (consentimento já foi dado na tela anterior)
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      start();
    }
  }, [start]);

  const formatTime = useCallback((s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleFinish = async () => {
    if (elapsedSec < MIN_SECONDS) return;
    const result = await stop();
    if (result) onComplete(result);
  };

  // Pulso da esfera derivado do nível de áudio REAL (mantém vivo no silêncio)
  const pulse = isPaused ? 0.15 : 0.15 + level * 0.85;
  const voiceActive = !isPaused && level > 0.08;

  // ---- Estado de erro ----
  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-950 text-white">
        <div className="px-5 pt-14 pb-4">
          <button
            onClick={onCancel}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 flex items-center justify-center mb-5">
            <AlertTriangle size={30} className="text-rose-400" />
          </div>
          <h2 className="text-lg font-semibold mb-2">
            Não foi possível gravar
          </h2>
          <p className="text-sm text-gray-400 mb-8 max-w-xs leading-relaxed">
            {error?.message}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => start()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-gray-900 text-sm font-medium active:scale-95 transition-transform"
            >
              <RefreshCw size={16} />
              Tentar novamente
            </button>
            <button
              onClick={onCancel}
              className="px-5 py-3 rounded-xl bg-gray-800 text-gray-300 text-sm font-medium active:scale-95 transition-transform"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const requesting = status === 'requesting' || status === 'idle';

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onCancel}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isPaused ? 'bg-amber-400' : 'bg-red-500 animate-pulse'
              }`}
            />
            <span className="text-sm font-medium text-white">
              {requesting ? 'Solicitando microfone' : isPaused ? 'Pausado' : 'Gravando'}
            </span>
          </div>
          <button
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
            aria-label="Marcador"
          >
            <Bookmark size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Área central - Esfera ativa */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Timer */}
        <div className="text-5xl font-light text-white mb-8 tabular-nums tracking-tight">
          {formatTime(elapsedSec)}
        </div>

        {/* Esfera pulsante */}
        <div className="relative mb-8">
          {/* Ondas de expansão */}
          {[1, 2, 3].map((ring) => (
            <div
              key={ring}
              className="absolute inset-0 rounded-full border border-sky-400/30"
              style={{
                transform: `scale(${1 + ring * 0.2 + pulse * 0.1})`,
                opacity: 0.6 - ring * 0.15,
                transition: 'transform 0.12s ease-out',
              }}
            />
          ))}

          {/* Glow */}
          <div
            className="absolute inset-0 rounded-full bg-sky-500/40 blur-3xl"
            style={{
              transform: `scale(${1.3 + pulse * 0.2})`,
              transition: 'transform 0.12s ease-out',
            }}
          />

          {/* Esfera principal */}
          <div
            className="relative w-44 h-44 rounded-full bg-gradient-to-br from-sky-400 via-cyan-500 to-teal-500 flex items-center justify-center overflow-hidden"
            style={{
              transform: `scale(${0.95 + pulse * 0.08})`,
              transition: 'transform 0.12s ease-out',
            }}
          >
            {/* Reflexo */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-10 bg-white/25 rounded-full blur-lg" />

            {/* Barras de áudio (alimentadas pelo nível real) */}
            <div className="relative flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-white/90 rounded-full transition-all duration-100"
                  style={{
                    height: `${12 + Math.abs(Math.sin(Date.now() / 200 + i)) * pulse * 30}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Status honesto */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-400 mb-1">
            {requesting
              ? 'Aguardando permissão do microfone...'
              : isPaused
                ? 'Gravação pausada'
                : 'Capturando áudio da consulta'}
          </p>
          <p className="text-xs text-gray-500">
            Transcrição e análise clínica acontecem após a captura
          </p>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => (isPaused ? resume() : pause())}
            disabled={requesting}
            className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center transition-transform active:scale-95 disabled:opacity-40"
          >
            {isPaused ? (
              <Mic size={24} className="text-white" />
            ) : (
              <Pause size={24} className="text-white" />
            )}
          </button>
          <button
            onClick={handleFinish}
            disabled={elapsedSec < MIN_SECONDS}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              elapsedSec >= MIN_SECONDS ? 'bg-white' : 'bg-gray-800 opacity-50'
            }`}
          >
            <Square
              size={24}
              className={elapsedSec >= MIN_SECONDS ? 'text-gray-900' : 'text-gray-500'}
              fill="currentColor"
            />
          </button>
        </div>
      </div>

      {/* Sinais em tempo real (honestos — sem achados clínicos fabricados) */}
      <div className="px-5 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-sky-400" />
          <span className="text-xs font-medium text-gray-400">
            Sinais em tempo real
          </span>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-3">
          {/* Microfone */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isPaused ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
                }`}
              >
                <Mic size={16} />
              </div>
              <span className="text-sm text-white">Microfone</span>
            </div>
            <span
              className={`text-xs font-medium ${
                isPaused ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {requesting ? 'Conectando...' : isPaused ? 'Pausado' : 'Ativo'}
            </span>
          </div>

          {/* Nível de entrada (barra real) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
                  <AudioLines size={16} />
                </div>
                <span className="text-sm text-white">Nível de entrada</span>
              </div>
              <span
                className={`text-xs font-medium ${
                  voiceActive ? 'text-sky-400' : 'text-gray-500'
                }`}
              >
                {voiceActive ? 'Captando voz' : isPaused ? '—' : 'Silêncio'}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-[width] duration-100"
                style={{ width: `${Math.round(level * 100)}%` }}
              />
            </div>
          </div>

          {/* Formato capturado (transparência técnica) */}
          {mimeType && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-800">
              <span className="text-xs text-gray-500">Formato de captura</span>
              <span className="text-xs text-gray-400 tabular-nums">
                {friendlyCodec(mimeType)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
