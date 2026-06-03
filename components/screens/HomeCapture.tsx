'use client';

import { motion } from 'framer-motion';
import { Mic, FileText, Activity, Clock } from 'lucide-react';
import AnimatedSphere from '@/components/ui/AnimatedSphere';

interface HomeCaptureProps {
  onStartRecording: () => void;
}

export default function HomeCapture({ onStartRecording }: HomeCaptureProps) {
  const recentCases = [
    { initials: 'M.S.', specialty: 'Neurologia', time: '2h atrás' },
    { initials: 'R.C.', specialty: 'Cardiologia', time: '1d atrás' },
    { initials: 'A.L.', specialty: 'Endocrinologia', time: '3d atrás' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6 py-12 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ClinIQ
          </h1>
          <p className="text-slate-400 text-sm">
            O Shazam da consulta médica
          </p>
        </motion.div>

        {/* Main Sphere Area */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center mb-12"
          >
            <AnimatedSphere onClick={onStartRecording} />

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-2xl font-semibold mb-3 mt-12"
            >
              Toque para capturar a consulta
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-slate-400 text-sm max-w-xs mx-auto"
            >
              Áudio, raciocínio clínico e dossiê em minutos
            </motion.p>
          </motion.div>
        </div>

        {/* Recent Cases - Discrete */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Casos Recentes</h3>
            <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Ver todos
            </button>
          </div>

          <div className="space-y-2">
            {recentCases.map((case_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.4 }}
                className="glass-effect rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-semibold">
                    {case_.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{case_.specialty}</p>
                    <p className="text-xs text-slate-400">{case_.time}</p>
                  </div>
                </div>
                <FileText size={18} className="text-slate-500" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats - Very discrete */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-6 grid grid-cols-3 gap-3"
        >
          <div className="glass-effect rounded-lg p-3 text-center">
            <Activity size={16} className="mx-auto mb-1 text-blue-400" />
            <p className="text-xs text-slate-400">3 hoje</p>
          </div>
          <div className="glass-effect rounded-lg p-3 text-center">
            <FileText size={16} className="mx-auto mb-1 text-green-400" />
            <p className="text-xs text-slate-400">2 PDFs</p>
          </div>
          <div className="glass-effect rounded-lg p-3 text-center">
            <Clock size={16} className="mx-auto mb-1 text-amber-400" />
            <p className="text-xs text-slate-400">1 pendente</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
