'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Square, CheckCircle2, User, Stethoscope, Pill, AlertCircle } from 'lucide-react';
import AnimatedSphere from '@/components/ui/AnimatedSphere';

interface RecordingInProgressProps {
  onEnd: () => void;
  recordingTime: number;
  setRecordingTime: (time: number) => void;
}

export default function RecordingInProgress({ onEnd, recordingTime, setRecordingTime }: RecordingInProgressProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [intelligenceSignals, setIntelligenceSignals] = useState<any[]>([]);

  const signals = [
    { id: 1, icon: User, label: 'Voz do médico detectada', delay: 2000, color: 'text-blue-400' },
    { id: 2, icon: User, label: 'Voz do paciente detectada', delay: 4000, color: 'text-purple-400' },
    { id: 3, icon: Stethoscope, label: 'Queixa principal emergindo', delay: 7000, color: 'text-green-400' },
    { id: 4, icon: AlertCircle, label: 'Sintomas detectados', delay: 11000, color: 'text-amber-400' },
    { id: 5, icon: Pill, label: 'Medicações mencionadas', delay: 15000, color: 'text-pink-400' },
    { id: 6, icon: AlertCircle, label: 'Possível lacuna identificada', delay: 20000, color: 'text-red-400' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isPaused) {
      interval = setInterval(() => {
        setRecordingTime(recordingTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, recordingTime, setRecordingTime]);

  useEffect(() => {
    signals.forEach((signal) => {
      setTimeout(() => {
        if (recordingTime * 1000 >= signal.delay) {
          setIntelligenceSignals((prev) => {
            if (!prev.find((s) => s.id === signal.id)) {
              return [...prev, signal];
            }
            return prev;
          });
        }
      }, signal.delay);
    });
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 right-0 w-96 h-96 bg-red-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6 py-12 min-h-screen flex flex-col">
        {/* Time and status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 glass-effect px-6 py-3 rounded-full mb-4">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.6, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              className="w-3 h-3 bg-red-500 rounded-full"
            />
            <span className="text-xl font-mono font-semibold">{formatTime(recordingTime)}</span>
          </div>

          <p className="text-slate-400 text-sm">
            {isPaused ? 'Gravação pausada' : 'Capturando consulta'}
          </p>
        </motion.div>

        {/* Sphere */}
        <div className="flex items-center justify-center mb-12">
          <AnimatedSphere onClick={() => {}} isRecording={!isPaused} />
        </div>

        {/* Intelligence Signals */}
        <div className="flex-1 space-y-3 mb-8 max-h-80 overflow-y-auto">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Compreensão em tempo real</h3>
          <AnimatePresence>
            {intelligenceSignals.map((signal, index) => {
              const Icon = signal.icon;
              return (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="glass-effect rounded-xl p-4 flex items-center gap-3"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${signal.color}`}
                  >
                    <Icon size={20} />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{signal.label}</p>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <CheckCircle2 size={18} className="text-green-400" />
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="flex gap-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex-1 glass-effect hover:bg-white/10 py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Pause size={20} />
              <span className="font-medium">{isPaused ? 'Retomar' : 'Pausar'}</span>
            </button>
            <button
              onClick={onEnd}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-4 rounded-xl flex items-center justify-center gap-2 transition-colors font-semibold"
            >
              <Square size={20} />
              <span>Encerrar</span>
            </button>
          </div>

          <p className="text-center text-xs text-slate-500">
            O ClinIQ está compreendendo a consulta sem interromper o atendimento
          </p>
        </motion.div>
      </div>
    </div>
  );
}
