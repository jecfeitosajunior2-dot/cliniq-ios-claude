'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, FileText, Clock, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { transcribeAudio } from '@/lib/transcribe';
import { runDetective } from '@/lib/detective';
import type { RecordingResult } from '@/lib/useAudioRecorder';
import type { CaseData, CaseIntelligence, TranscriptionResult } from '@/lib/types';

interface AnalysisInProgressProps {
  recording: RecordingResult | null;
  caseData: CaseData | null;
  onComplete: (transcription: TranscriptionResult, intelligence: CaseIntelligence) => void;
  onCancel: () => void;
}

type Phase = 'transcribe' | 'detective';

const TRANSCRIBE_MESSAGES = [
  'Enviando áudio com segurança',
  'Transcrevendo em português',
  'Sincronizando timestamps',
];

const DETECTIVE_MESSAGES = [
  'Investigando padrões clínicos',
  'Cruzando evidências do áudio',
  'Detectando inconsistências',
  'Montando o dossiê',
];

// Chips reveladas conforme o progresso (estágios reais do pipeline)
const STAGE_LABELS = [
  'Áudio transcrito (PT-BR)',
  'Timestamps sincronizados',
  'Padrões clínicos investigados',
  'Evidências cruzadas',
  'Dossiê montado',
];
const STAGE_THRESHOLDS = [30, 48, 70, 88, 100];
const stagePositions = [
  { x: -120, y: -170 },
  { x: 125, y: -150 },
  { x: -140, y: -20 },
  { x: 135, y: 10 },
  { x: 0, y: 175 },
];

interface Stage {
  id: string;
  label: string;
  position: { x: number; y: number };
}

export default function AnalysisInProgress({
  recording,
  caseData,
  onComplete,
  onCancel,
}: AnalysisInProgressProps) {
  const [phase, setPhase] = useState<Phase>('transcribe');
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [stages, setStages] = useState<Stage[]>([]);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [showRings, setShowRings] = useState(false);
  const [particleCount, setParticleCount] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [findingsCount, setFindingsCount] = useState<number | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Pipeline real: transcrição -> Clinical Detective
  useEffect(() => {
    if (!recording) {
      setError('Nenhum áudio para analisar. Volte e grave a consulta.');
      return;
    }
    let cancelled = false;
    setError(null);
    setProgress(0);
    setPhase('transcribe');

    (async () => {
      try {
        const transcription = await transcribeAudio(
          recording.blob,
          recording.mimeType,
          recording.durationSec,
        );
        if (cancelled) return;

        setPhase('detective');
        setProgress((p) => Math.max(p, 52));

        const intelligence = await runDetective(transcription, caseData);
        if (cancelled) return;

        setFindingsCount(intelligence.detectiveFindings.length);
        setProgress(100);
        setShowRings(true);
        setParticleCount(16);
        setTimeout(() => {
          if (!cancelled) onCompleteRef.current(transcription, intelligence);
        }, 1300);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Falha na análise.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [recording, caseData, retryKey]);

  // Progresso "respira" até o teto da fase; 100% só ao concluir o dossiê.
  useEffect(() => {
    if (error) return;
    const ceiling = phase === 'transcribe' ? 48 : 95;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        if (p >= ceiling) return p;
        return p + Math.max(0.35, (ceiling - p) * 0.03);
      });
    }, 120);
    return () => clearInterval(id);
  }, [error, phase]);

  // Mensagens da fase atual
  const phaseMessages = phase === 'transcribe' ? TRANSCRIBE_MESSAGES : DETECTIVE_MESSAGES;
  useEffect(() => {
    setCurrentMessage(0);
  }, [phase]);
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentMessage((p) => (p + 1) % phaseMessages.length);
    }, 2600);
    return () => clearInterval(id);
  }, [phaseMessages.length]);

  // Revela chips conforme o progresso
  useEffect(() => {
    const reached = STAGE_THRESHOLDS.filter((t) => progress >= t).length;
    if (reached > stages.length && reached <= STAGE_LABELS.length) {
      const idx = reached - 1;
      setStages((prev) => [
        ...prev,
        { id: `s${idx}`, label: STAGE_LABELS[idx], position: stagePositions[idx] },
      ]);
      setPulseIntensity(1.7);
      setTimeout(() => setPulseIntensity(1), 600);
    }
  }, [progress, stages.length]);

  // ---- Estado de erro ----
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 flex items-center justify-center mb-5">
          <AlertTriangle size={30} className="text-rose-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Não foi possível analisar</h2>
        <p className="text-sm text-slate-400 mb-8 max-w-xs leading-relaxed">{error}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setError(null);
              setStages([]);
              setProgress(0);
              setPhase('transcribe');
              setRetryKey((k) => k + 1);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 text-sm font-medium active:scale-95 transition-transform"
          >
            <RefreshCw size={16} />
            Tentar novamente
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium active:scale-95 transition-transform"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const done = progress >= 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-16 pb-4">
        <p className="text-cyan-400 text-xs font-medium tracking-widest uppercase text-center mb-2">
          {phase === 'transcribe' ? 'ClinIQ Transcrição' : 'ClinIQ Clinical Detective'}
        </p>
        <h1 className="text-2xl font-semibold text-white text-center mb-1">
          {done ? 'Dossiê pronto' : phaseMessages[currentMessage]}
        </h1>
        <p className="text-slate-400 text-sm text-center">
          {done
            ? 'Abrindo o Case Intelligence...'
            : phase === 'transcribe'
              ? 'Convertendo o áudio da consulta em texto PT-BR'
              : 'Analisando com claude-opus-4-8 e evidências rastreáveis'}
        </p>
      </div>

      {/* Central Orb Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Floating stage chips */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className="absolute bg-cyan-500/20 border-cyan-500/30 border backdrop-blur-md rounded-xl p-3 max-w-[160px] animate-in fade-in zoom-in duration-700"
              style={{
                transform: `translate(${stage.position.x}px, ${stage.position.y}px)`,
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/30 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-cyan-400" />
                </div>
                <p className="text-xs font-medium text-cyan-300 leading-snug">{stage.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* The Orb */}
        <div className="relative">
          {showRings && (
            <>
              <div className="absolute inset-0 -m-16 rounded-full border border-cyan-500/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 -m-12 rounded-full border border-purple-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-0 -m-8 rounded-full border border-cyan-500/30 animate-ping" style={{ animationDuration: '1s' }} />
            </>
          )}

          {/* Orbital rings */}
          <div className="absolute inset-0 -m-10 rounded-full border border-dashed border-cyan-500/10" style={{ animation: 'spin 20s linear infinite' }} />
          <div className="absolute inset-0 -m-16 rounded-full border border-dashed border-purple-500/10" style={{ animation: 'spin 30s linear infinite reverse' }} />
          <div className="absolute inset-0 -m-24 rounded-full border border-dashed border-cyan-500/5" style={{ animation: 'spin 40s linear infinite' }} />

          {/* Particles */}
          {[...Array(particleCount)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/60"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${(360 / particleCount) * i}deg) translateY(-${80 + Math.random() * 40}px)`,
                animation: `pulse ${2 + Math.random()}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}

          {/* Glow layers */}
          <div className="absolute inset-0 -m-8 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-2xl transition-transform duration-500" style={{ transform: `scale(${pulseIntensity})` }} />
          <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 blur-xl transition-transform duration-500" style={{ transform: `scale(${pulseIntensity * 0.9})` }} />

          {/* Main orb */}
          <div className="relative w-40 h-40 rounded-full transition-transform duration-500" style={{ transform: `scale(${0.95 + pulseIntensity * 0.05})` }}>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-white/10" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />

            {/* Waveform animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full"
                    style={{
                      height: `${20 + Math.sin((Date.now() / 200) + i) * 15}px`,
                      animation: `waveform ${0.5 + i * 0.1}s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-sm" />

            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="80" cy="80" r="76" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="2" />
              <circle
                cx="80"
                cy="80"
                r="76"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 76}`}
                strokeDashoffset={`${2 * Math.PI * 76 * (1 - progress / 100)}`}
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Progress text */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="text-3xl font-light text-white tabular-nums">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="relative z-10 px-6 pb-10 pt-4">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-xs text-slate-400">
              {stages.length} de {STAGE_LABELS.length} etapas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-purple-400" />
            <span className="text-xs text-slate-400">PT-BR</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-slate-500" />
            <span className="text-xs text-slate-400">
              {phase === 'transcribe' ? 'Whisper' : 'Opus 4.8'}
            </span>
          </div>
        </div>

        {/* Completion Message */}
        {done && (
          <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <FileText size={20} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Case Intelligence pronto</h4>
                <p className="text-xs text-slate-400">
                  {findingsCount !== null
                    ? `${findingsCount} achados com evidências rastreáveis`
                    : 'Abrindo o dossiê...'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes waveform {
          0% { height: 15px; }
          100% { height: 35px; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: rotate(var(--rotation)) translateY(var(--distance)) scale(1); }
          50% { opacity: 1; transform: rotate(var(--rotation)) translateY(var(--distance)) scale(1.5); }
        }
      `}</style>
    </div>
  );
}
