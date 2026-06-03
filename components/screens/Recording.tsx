'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pause, Square, Bookmark, Mic, User, Stethoscope, Pill, AlertTriangle, Brain, ChevronRight } from 'lucide-react';

interface RecordingProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface InsightItem {
  id: number;
  icon: React.ElementType;
  label: string;
  detail: string;
  color: string;
  timestamp: string;
}

export default function Recording({ onComplete, onCancel }: RecordingProps) {
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [currentPhase, setCurrentPhase] = useState(0);

  // Simulacao de insights em tempo real
  const possibleInsights: Omit<InsightItem, 'id' | 'timestamp'>[] = [
    { icon: User, label: 'Voz do paciente detectada', detail: 'Interlocutor identificado', color: 'text-sky-500' },
    { icon: Stethoscope, label: 'Queixa principal emergindo', detail: 'Cefaleia progressiva', color: 'text-emerald-500' },
    { icon: Pill, label: 'Medicacao mencionada', detail: 'Losartana 50mg', color: 'text-violet-500' },
    { icon: AlertTriangle, label: 'Sintoma de alerta', detail: 'Piora matinal relatada', color: 'text-amber-500' },
    { icon: Brain, label: 'Correlacao detectada', detail: 'Padrao sugere investigacao', color: 'text-rose-500' },
  ];

  const phases = [
    'Escutando...',
    'Separando vozes...',
    'Compreendendo contexto...',
    'Detectando padroes clinicos...'
  ];

  // Timer
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Animacao de pulso baseada em "audio"
  useEffect(() => {
    if (isPaused) return;
    const pulseTimer = setInterval(() => {
      setPulseIntensity(Math.random() * 0.4 + 0.6);
    }, 150);
    return () => clearInterval(pulseTimer);
  }, [isPaused]);

  // Simular insights emergentes
  useEffect(() => {
    if (isPaused) return;
    
    const insightTimings = [8, 18, 32, 48, 65];
    const currentTiming = insightTimings.find(t => t === seconds);
    
    if (currentTiming && insights.length < possibleInsights.length) {
      const newInsight = possibleInsights[insights.length];
      setInsights(prev => [...prev, {
        ...newInsight,
        id: Date.now(),
        timestamp: formatTime(seconds)
      }]);
    }
  }, [seconds, isPaused, insights.length]);

  // Mudar fase
  useEffect(() => {
    if (seconds > 0 && seconds % 20 === 0) {
      setCurrentPhase(prev => Math.min(prev + 1, phases.length - 1));
    }
  }, [seconds, phases.length]);

  const formatTime = useCallback((s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleFinish = () => {
    if (seconds >= 5) {
      onComplete();
    }
  };

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
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-white">Gravando</span>
          </div>
          <button
            onClick={() => {/* add bookmark */}}
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
          >
            <Bookmark size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Area central - Esfera ativa */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Timer */}
        <div className="text-5xl font-light text-white mb-8 tabular-nums tracking-tight">
          {formatTime(seconds)}
        </div>

        {/* Esfera pulsante */}
        <div className="relative mb-8">
          {/* Ondas de expansao */}
          {[1, 2, 3].map((ring) => (
            <div
              key={ring}
              className="absolute inset-0 rounded-full border border-sky-400/30"
              style={{
                transform: `scale(${1 + ring * 0.2 + pulseIntensity * 0.1})`,
                opacity: 0.6 - ring * 0.15,
                transition: 'transform 0.15s ease-out'
              }}
            />
          ))}

          {/* Glow */}
          <div 
            className="absolute inset-0 rounded-full bg-sky-500/40 blur-3xl"
            style={{ 
              transform: `scale(${1.3 + pulseIntensity * 0.2})`,
              transition: 'transform 0.15s ease-out'
            }}
          />

          {/* Esfera principal */}
          <div 
            className="relative w-44 h-44 rounded-full bg-gradient-to-br from-sky-400 via-cyan-500 to-teal-500 flex items-center justify-center overflow-hidden"
            style={{
              transform: `scale(${0.95 + pulseIntensity * 0.08})`,
              transition: 'transform 0.15s ease-out'
            }}
          >
            {/* Reflexo */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-10 bg-white/25 rounded-full blur-lg" />
            
            {/* Barras de audio */}
            <div className="relative flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-white/90 rounded-full transition-all duration-150"
                  style={{
                    height: `${12 + Math.sin(Date.now() / 200 + i) * pulseIntensity * 25}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Status de compreensao */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-400 mb-1">{phases[currentPhase]}</p>
          <p className="text-xs text-gray-500">O ClinIQ esta compreendendo a consulta</p>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center transition-transform active:scale-95"
          >
            {isPaused ? (
              <Mic size={24} className="text-white" />
            ) : (
              <Pause size={24} className="text-white" />
            )}
          </button>
          <button
            onClick={handleFinish}
            disabled={seconds < 5}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              seconds >= 5 
                ? 'bg-white' 
                : 'bg-gray-800 opacity-50'
            }`}
          >
            <Square size={24} className={seconds >= 5 ? 'text-gray-900' : 'text-gray-500'} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* Insights emergentes */}
      {insights.length > 0 && (
        <div className="px-5 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} className="text-sky-400" />
            <span className="text-xs font-medium text-gray-400">Inteligencia detectando</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {insights.slice().reverse().map((insight) => {
              const Icon = insight.icon;
              return (
                <div
                  key={insight.id}
                  className="bg-gray-900 rounded-xl p-3 border border-gray-800 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center ${insight.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{insight.label}</p>
                    <p className="text-xs text-gray-500">{insight.detail}</p>
                  </div>
                  <span className="text-xs text-gray-600 tabular-nums">{insight.timestamp}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
