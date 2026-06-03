'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle2, Loader2, Sparkles, AlertTriangle, TrendingUp } from 'lucide-react';

interface IntelligentAnalysisProps {
  onComplete: () => void;
}

export default function IntelligentAnalysis({ onComplete }: IntelligentAnalysisProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [discoveries, setDiscoveries] = useState<any[]>([]);

  const steps = [
    { label: 'Reconstruindo a conversa clínica', icon: Brain },
    { label: 'Separando médico e paciente', icon: Brain },
    { label: 'Identificando sintomas, medicações e antecedentes', icon: Brain },
    { label: 'Lendo PDFs, laudos e exames', icon: Brain },
    { label: 'Cruzando achados entre fontes', icon: Brain },
    { label: 'Detectando inconsistências e lacunas', icon: Brain },
    { label: 'Montando a história clínica', icon: Brain },
    { label: 'Preparando dossiê premium', icon: Brain },
  ];

  const discoveryEvents = [
    {
      step: 3,
      type: 'finding',
      title: 'Achado relevante encontrado',
      description: 'Possível anemia progressiva identificada',
      source: 'Hemograma anterior',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      step: 5,
      type: 'inconsistency',
      title: 'Inconsistência encontrada',
      description: 'Paciente nega uso de medicação contínua',
      source: 'Histórico sugere tratamento prévio',
      icon: AlertTriangle,
      color: 'amber'
    },
    {
      step: 6,
      type: 'pattern',
      title: 'Padrão temporal detectado',
      description: 'Cefaleia evoluiu de episódica para progressiva',
      source: 'Análise de timeline',
      icon: Sparkles,
      color: 'purple'
    },
  ];

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);

        // Check for discoveries at this step
        const discovery = discoveryEvents.find(d => d.step === currentStep + 1);
        if (discovery) {
          setTimeout(() => {
            setDiscoveries(prev => [...prev, discovery]);
          }, 500);
        }
      }, 1800);

      return () => clearTimeout(timer);
    } else {
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  }, [currentStep, onComplete]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6 py-12 min-h-screen flex flex-col items-center justify-center">
        {/* Main brain icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-8"
        >
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 -m-8 rounded-full bg-purple-500/30 blur-2xl"
            />
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center"
            >
              <Brain size={48} className="text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-bold mb-2">Analisando caso clínico</h2>
          <p className="text-slate-400 text-sm">
            A inteligência está reconstruindo o dossiê
          </p>
        </motion.div>

        {/* Analysis steps */}
        <div className="w-full space-y-3 mb-8">
          {steps.map((step, index) => {
            const isComplete = index < currentStep;
            const isCurrent = index === currentStep;
            const Icon = step.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`glass-effect rounded-xl p-4 flex items-center gap-3 transition-all ${
                  isCurrent ? 'ring-2 ring-purple-500 bg-purple-500/10' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isComplete ? 'bg-green-500/20' :
                  isCurrent ? 'bg-purple-500/20' :
                  'bg-white/5'
                }`}>
                  {isComplete ? (
                    <CheckCircle2 size={18} className="text-green-400" />
                  ) : isCurrent ? (
                    <Loader2 size={18} className="text-purple-400 animate-spin" />
                  ) : (
                    <Icon size={18} className="text-slate-600" />
                  )}
                </div>
                <p className={`text-sm font-medium ${
                  isCurrent ? 'text-white' :
                  isComplete ? 'text-slate-300' :
                  'text-slate-600'
                }`}>
                  {step.label}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Real-time discoveries */}
        <AnimatePresence>
          {discoveries.map((discovery, index) => {
            const Icon = discovery.icon;
            const colorClasses = {
              blue: 'from-blue-500 to-cyan-500 text-blue-400 bg-blue-500/10',
              amber: 'from-amber-500 to-orange-500 text-amber-400 bg-amber-500/10',
              purple: 'from-purple-500 to-pink-500 text-purple-400 bg-purple-500/10',
            };

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="w-full glass-effect rounded-2xl p-5 mb-4 border-2 border-purple-500/30"
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[discovery.color as keyof typeof colorClasses]} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon size={24} className="text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{discovery.title}</h4>
                    <p className="text-sm text-slate-300 mb-2">{discovery.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Fonte:</span>
                      <span className={`text-xs px-2 py-0.5 rounded-md ${colorClasses[discovery.color as keyof typeof colorClasses]}`}>
                        {discovery.source}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-auto text-center"
        >
          <p className="text-sm text-slate-400 mb-2">
            {currentStep} de {steps.length} etapas concluídas
          </p>
          <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
