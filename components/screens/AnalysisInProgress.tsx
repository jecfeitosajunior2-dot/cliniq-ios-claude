'use client';

import { useEffect, useState, useCallback } from 'react';
import { Check, Loader2, Activity, FileText, Search, Brain, ListChecks, FileStack, LucideIcon } from 'lucide-react';

interface AnalysisInProgressProps {
  onComplete: () => void;
}

interface Step {
  label: string;
  icon: LucideIcon;
  duration: number;
}

export default function AnalysisInProgress({ onComplete }: AnalysisInProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [insights, setInsights] = useState({
    problems: 0,
    findings: 0,
    gaps: 0,
  });

  const steps: Step[] = [
    { label: 'Transcrevendo consulta', icon: Activity, duration: 1500 },
    { label: 'Separando queixas, histórico e plano', icon: ListChecks, duration: 1200 },
    { label: 'Lendo PDFs e laudos', icon: FileText, duration: 1800 },
    { label: 'Extraindo exames e valores relevantes', icon: Search, duration: 1400 },
    { label: 'Construindo timeline clínica', icon: FileStack, duration: 1600 },
    { label: 'Detectando padrões e inconsistências', icon: Brain, duration: 2000 },
    { label: 'Organizando problemas ativos', icon: ListChecks, duration: 1300 },
    { label: 'Preparando relatório premium', icon: FileText, duration: 1500 },
  ];

  const memoizedOnComplete = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
        
        // Update insights progressively
        if (currentStep === 3) setInsights({ problems: 2, findings: 5, gaps: 1 });
        if (currentStep === 5) setInsights({ problems: 4, findings: 9, gaps: 2 });
        if (currentStep === 6) setInsights({ problems: 4, findings: 11, gaps: 3 });
      }, steps[currentStep]?.duration || 1500);

      return () => clearTimeout(timer);
    } else {
      // Complete analysis
      const timer = setTimeout(() => {
        memoizedOnComplete();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep, memoizedOnComplete, steps]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Main Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Brain size={40} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-500/30 animate-ping" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-2">
          Analisando caso clínico
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
          A inteligência clínica está trabalhando no dossiê
        </p>

        {/* Steps */}
        <div className="space-y-3 mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isComplete = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500'
                    : isComplete
                    ? 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800'
                    : 'bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-900'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isComplete
                      ? 'bg-[--color-clinical-green]/10 dark:bg-[--color-clinical-green]/20'
                      : isCurrent
                      ? 'bg-primary-500'
                      : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                >
                  {isComplete ? (
                    <Check size={18} className="text-[--color-clinical-green]" />
                  ) : isCurrent ? (
                    <Loader2 size={18} className="text-white animate-spin" />
                  ) : (
                    <Icon size={18} className="text-gray-400 dark:text-gray-600" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isCurrent
                      ? 'text-gray-900 dark:text-white'
                      : isComplete
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Partial Insights */}
        {insights.problems > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-ios">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <Brain size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Insights parciais
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Até agora, o ClinIQ encontrou{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {insights.problems} problemas clínicos
                  </span>
                  ,{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {insights.findings} achados relevantes
                  </span>{' '}
                  e{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {insights.gaps} lacunas
                  </span>{' '}
                  para revisão médica.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
