'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Check, 
  Loader2, 
  Brain, 
  Mic, 
  FileText, 
  Search, 
  GitBranch, 
  AlertTriangle, 
  Lightbulb, 
  FileStack,
  Stethoscope,
  Pill,
  Activity,
  Clock
} from 'lucide-react';

interface AnalysisInProgressProps {
  onComplete: () => void;
}

interface ReasoningStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  duration: number;
}

interface Discovery {
  id: string;
  type: 'finding' | 'pattern' | 'alert' | 'insight';
  title: string;
  detail: string;
  source: string;
  timestamp: string;
}

export default function AnalysisInProgress({ onComplete }: AnalysisInProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [showDiscoveryPanel, setShowDiscoveryPanel] = useState(false);

  const steps: ReasoningStep[] = [
    { 
      id: 'transcribe',
      label: 'Transcrevendo consulta', 
      description: 'Convertendo áudio em texto clínico estruturado',
      icon: Mic, 
      duration: 2000 
    },
    { 
      id: 'structure',
      label: 'Compreendendo narrativa clínica', 
      description: 'Identificando queixas, histórico e contexto',
      icon: Stethoscope, 
      duration: 1800 
    },
    { 
      id: 'documents',
      label: 'Analisando documentos', 
      description: 'Extraindo dados de laudos e relatórios',
      icon: FileText, 
      duration: 2200 
    },
    { 
      id: 'medications',
      label: 'Mapeando medicações', 
      description: 'Identificando tratamentos ativos e histórico',
      icon: Pill, 
      duration: 1500 
    },
    { 
      id: 'timeline',
      label: 'Construindo linha do tempo', 
      description: 'Organizando eventos cronologicamente',
      icon: GitBranch, 
      duration: 1800 
    },
    { 
      id: 'patterns',
      label: 'Detectando padrões clínicos', 
      description: 'Correlacionando achados e identificando tendências',
      icon: Search, 
      duration: 2500 
    },
    { 
      id: 'gaps',
      label: 'Identificando lacunas', 
      description: 'Buscando informações faltantes ou inconsistentes',
      icon: AlertTriangle, 
      duration: 1600 
    },
    { 
      id: 'synthesis',
      label: 'Sintetizando dossiê clínico', 
      description: 'Preparando relatório premium para revisão',
      icon: FileStack, 
      duration: 2000 
    },
  ];

  const potentialDiscoveries: Discovery[] = [
    {
      id: 'd1',
      type: 'finding',
      title: 'Cefaleia progressiva há 3 meses',
      detail: 'Paciente relata piora matinal, intensidade crescente',
      source: 'Consulta 03:42',
      timestamp: '03:42',
    },
    {
      id: 'd2',
      type: 'pattern',
      title: 'Tendência de queda da hemoglobina',
      detail: 'Hb 12.8 → 11.8 g/dL em 6 meses',
      source: 'Hemograma 14/03',
      timestamp: '',
    },
    {
      id: 'd3',
      type: 'alert',
      title: 'Lesão em RM sem caracterização',
      detail: 'Achado frontoparietal 1.2cm necessita contraste',
      source: 'RM crânio p.2',
      timestamp: '',
    },
    {
      id: 'd4',
      type: 'finding',
      title: 'Histórico familiar de AVC',
      detail: 'Mãe com AVC aos 68 anos',
      source: 'Consulta 15:20',
      timestamp: '15:20',
    },
    {
      id: 'd5',
      type: 'insight',
      title: 'Sintomas podem estar correlacionados',
      detail: 'Cefaleia + tontura + achado de imagem sugere investigação neurológica prioritária',
      source: 'Correlação ClinIQ',
      timestamp: '',
    },
    {
      id: 'd6',
      type: 'pattern',
      title: 'HAS em tratamento há 8 anos',
      detail: 'Losartana 50mg/dia - adesão a confirmar',
      source: 'Consulta 08:42',
      timestamp: '08:42',
    },
  ];

  const memoizedOnComplete = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCompletedSteps(prev => [...prev, steps[currentStep].id]);
        setCurrentStep(prev => prev + 1);
        
        // Add discoveries at specific steps
        if (currentStep === 1 && discoveries.length === 0) {
          setShowDiscoveryPanel(true);
          setDiscoveries([potentialDiscoveries[0]]);
        }
        if (currentStep === 2) {
          setDiscoveries(prev => [...prev, potentialDiscoveries[1], potentialDiscoveries[2]]);
        }
        if (currentStep === 4) {
          setDiscoveries(prev => [...prev, potentialDiscoveries[3], potentialDiscoveries[5]]);
        }
        if (currentStep === 5) {
          setDiscoveries(prev => [...prev, potentialDiscoveries[4]]);
        }
      }, steps[currentStep]?.duration || 1500);

      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        memoizedOnComplete();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [currentStep, memoizedOnComplete, steps, discoveries.length, potentialDiscoveries]);

  const getDiscoveryIcon = (type: Discovery['type']) => {
    const icons = {
      finding: Activity,
      pattern: Search,
      alert: AlertTriangle,
      insight: Lightbulb,
    };
    return icons[type];
  };

  const getDiscoveryColor = (type: Discovery['type']) => {
    const colors = {
      finding: 'text-primary-500 bg-primary-50 dark:bg-primary-900/20',
      pattern: 'text-[--color-clinical-teal] bg-[--color-clinical-teal]/10',
      alert: 'text-[--color-clinical-amber] bg-[--color-clinical-amber]/10',
      insight: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
    };
    return colors[type];
  };

  const progress = Math.round((completedSteps.length / steps.length) * 100);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 pt-14 pb-6">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-900/20 flex items-center justify-center">
              <Brain size={36} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="absolute inset-0 rounded-3xl animate-pulse bg-primary-500/10" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-1">
          Compreendendo o caso
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
          Inteligência clínica em ação
        </p>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-[--color-clinical-teal] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pb-8">
        <div className="grid gap-4">
          {/* Reasoning Steps */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-ios overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Raciocínio Clínico
              </h3>
            </div>
            <div className="p-3 space-y-1">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isComplete = completedSteps.includes(step.id);
                const isCurrent = index === currentStep && currentStep < steps.length;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                      isCurrent
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : isComplete
                        ? 'bg-gray-50 dark:bg-gray-950'
                        : 'opacity-40'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        isComplete
                          ? 'bg-[--color-clinical-green]/10 dark:bg-[--color-clinical-green]/20'
                          : isCurrent
                          ? 'bg-primary-500'
                          : 'bg-gray-200 dark:bg-gray-800'
                      }`}
                    >
                      {isComplete ? (
                        <Check size={16} className="text-[--color-clinical-green]" />
                      ) : isCurrent ? (
                        <Loader2 size={16} className="text-white animate-spin" />
                      ) : (
                        <StepIcon size={16} className="text-gray-400 dark:text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm font-medium block ${
                          isCurrent || isComplete
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400 dark:text-gray-600'
                        }`}
                      >
                        {step.label}
                      </span>
                      {isCurrent && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {step.description}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Discovery Panel */}
          {showDiscoveryPanel && (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-[--color-clinical-amber]" />
                  <h3 className="text-sm font-semibold text-white">
                    Descobertas em Tempo Real
                  </h3>
                  <span className="ml-auto text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
                    {discoveries.length} encontradas
                  </span>
                </div>
              </div>
              
              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {discoveries.map((discovery, index) => {
                  const DiscoveryIcon = getDiscoveryIcon(discovery.type);
                  const colorClass = getDiscoveryColor(discovery.type);
                  
                  return (
                    <div
                      key={discovery.id}
                      className="bg-white/5 rounded-xl p-3 animate-in fade-in slide-in-from-left-2 duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                          <DiscoveryIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">
                            {discovery.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {discovery.detail}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <FileText size={10} />
                              {discovery.source}
                            </span>
                            {discovery.timestamp && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Clock size={10} />
                                {discovery.timestamp}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completion Message */}
          {completedSteps.length === steps.length && (
            <div className="bg-[--color-clinical-green]/10 dark:bg-[--color-clinical-green]/20 rounded-2xl p-5 animate-in fade-in zoom-in duration-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[--color-clinical-green]/20 flex items-center justify-center">
                  <Check size={24} className="text-[--color-clinical-green]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Análise concluída
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Preparando seu dossiê clínico...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
