'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, ChevronRight, Clock, Sparkles, LogOut } from 'lucide-react';

interface RecentCase {
  id: string;
  initials: string;
  age: string;
  specialty: string;
  date: string;
  status: string;
}

interface HomeProps {
  onNavigate: (screen: string) => void;
  onToggleTheme: () => void;
  isDark: boolean;
  doctorName?: string;
  recentCases?: RecentCase[];
  onOpenCase?: (id: string) => void;
  onViewAll?: () => void;
  onSignOut?: () => void;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Home({
  onNavigate,
  onToggleTheme,
  isDark,
  doctorName,
  recentCases = [],
  onOpenCase,
  onViewAll,
  onSignOut,
}: HomeProps) {
  const [pulseScale, setPulseScale] = useState(1);
  const [glowOpacity, setGlowOpacity] = useState(0.4);

  // Animacao da esfera
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseScale(prev => prev === 1 ? 1.02 : 1);
      setGlowOpacity(prev => prev === 0.4 ? 0.6 : 0.4);
    }, 2000);
    return () => clearInterval(pulseInterval);
  }, []);

  const hello = doctorName ? `${greeting()}, ${doctorName}` : greeting();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header minimalista */}
      <div className="px-5 pt-14 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hello}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onSignOut && (
              <button
                onClick={onSignOut}
                aria-label="Sair"
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
              >
                <LogOut size={17} className="text-gray-500 dark:text-gray-400" />
              </button>
            )}
            <button
              onClick={onToggleTheme}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
            >
              {isDark ? <Sun size={18} className="text-gray-400" /> : <Moon size={18} className="text-gray-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Area central - Esfera de captura */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-8">
        {/* Esfera principal */}
        <button
          onClick={() => onNavigate('consent')}
          className="relative group mb-8"
          style={{ transform: `scale(${pulseScale})`, transition: 'transform 2s ease-in-out' }}
        >
          {/* Glow externo */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 blur-3xl"
            style={{
              opacity: glowOpacity,
              transform: 'scale(1.4)',
              transition: 'opacity 2s ease-in-out'
            }}
          />

          {/* Anel externo */}
          <div className="absolute inset-0 rounded-full border-2 border-sky-300/30 dark:border-sky-400/20" style={{ transform: 'scale(1.15)' }} />

          {/* Esfera principal */}
          <div className="relative w-52 h-52 rounded-full bg-gradient-to-br from-sky-400 via-cyan-500 to-teal-500 shadow-2xl flex items-center justify-center overflow-hidden">
            {/* Reflexo superior */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-12 bg-white/30 rounded-full blur-xl" />

            {/* Brilho interno */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

            {/* Icone de onda sonora animado */}
            <div className="relative flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-1.5 bg-white/90 rounded-full animate-pulse"
                  style={{
                    height: `${20 + Math.sin(i * 0.8) * 16}px`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '1.2s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Label inferior */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 px-4 py-1.5 rounded-full shadow-lg border border-gray-100 dark:border-gray-800">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
              <Sparkles size={12} className="text-sky-500" />
              Pronto para capturar
            </span>
          </div>
        </button>

        {/* Texto principal */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Toque para capturar a consulta
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
            Transforme a conversa da consulta em um rascunho clinico estruturado
          </p>
        </div>

        {/* Indicador de promessa */}
        <div className="flex items-center gap-6 mt-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Transcreve automatico</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Voce revisa e decide</span>
          </div>
        </div>
      </div>

      {/* Casos recentes - discreto na parte inferior */}
      {recentCases.length > 0 && (
        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Casos recentes
            </h2>
            <button
              onClick={onViewAll}
              className="text-xs text-sky-600 dark:text-sky-400 font-medium"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-2">
            {recentCases.map((c) => (
              <button
                key={c.id}
                onClick={() => onOpenCase?.(c.id)}
                className="w-full bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 flex items-center justify-between transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{c.initials}</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {c.initials}{c.age ? `, ${c.age} anos` : ''}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {c.specialty}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    {c.date}
                  </div>
                  {c.status === 'ready' && (
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
