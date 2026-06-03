'use client';

import { Search, Moon, Sun, Plus, FileText, Activity, AlertCircle, ChevronRight } from 'lucide-react';
import PatientCaseCard from '@/components/ui/PatientCaseCard';

interface HomeProps {
  onNavigate: (screen: string) => void;
  onToggleTheme: () => void;
  isDark: boolean;
}

export default function Home({ onNavigate, onToggleTheme, isDark }: HomeProps) {
  const recentCases = [
    {
      initials: 'M.S.',
      age: 62,
      gender: 'F',
      specialty: 'Neurologia',
      type: 'Segunda opinião',
      activeProblems: 4,
      status: 'pending' as const,
      date: '2 horas atrás'
    },
    {
      initials: 'R.C.',
      age: 48,
      gender: 'M',
      specialty: 'Cardiologia',
      type: 'Revisão de exames',
      activeProblems: 2,
      status: 'ready' as const,
      date: 'Ontem'
    },
    {
      initials: 'A.L.',
      age: 35,
      gender: 'F',
      specialty: 'Endocrinologia',
      type: 'Retorno',
      activeProblems: 2,
      status: 'pending' as const,
      date: '3 dias atrás'
    },
  ];

  const recentPDFs = [
    { name: 'RM Crânio - M.S.', pages: 3, type: 'Laudo de imagem', date: '2h' },
    { name: 'Hemograma Completo', pages: 2, type: 'Exame laboratorial', date: 'Ontem' },
    { name: 'Encaminhamento - A.L.', pages: 1, type: 'Carta médica', date: '3d' },
  ];

  const todayMetrics = [
    { label: 'Casos analisados', value: '3', icon: Activity, color: 'text-[--color-clinical-teal]' },
    { label: 'Relatórios gerados', value: '2', icon: FileText, color: 'text-[--color-clinical-green]' },
    { label: 'Pendências clínicas', value: '1', icon: AlertCircle, color: 'text-[--color-clinical-amber]' },
  ];

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Boa tarde, Dr. Almeida
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Terça-feira, 3 de junho
              </p>
            </div>
            <button
              onClick={onToggleTheme}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center transition-colors"
            >
              {isDark ? <Sun size={20} className="text-gray-600 dark:text-gray-400" /> : <Moon size={20} className="text-gray-600" />}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar casos, pacientes, documentos..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-6 mt-6">
        {/* Today Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {todayMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-ios"
              >
                <Icon size={20} className={`${metric.color} mb-2`} />
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {metric.value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metric.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* New Case Card - Primary Action */}
        <button
          onClick={() => onNavigate('newCase')}
          className="w-full bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 rounded-2xl p-6 shadow-ios-lg text-left transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Plus size={24} className="text-white" />
                <h3 className="text-lg font-semibold text-white">
                  Novo Caso Clínico
                </h3>
              </div>
              <p className="text-sm text-primary-100">
                Criar dossiê completo com áudio, PDFs e exames
              </p>
            </div>
            <ChevronRight size={24} className="text-white/70 ml-2" />
          </div>
        </button>

        {/* Recent Cases */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Casos Recentes
            </h2>
            <button className="text-sm text-primary-600 dark:text-primary-400 font-medium">
              Ver todos
            </button>
          </div>
          <div className="space-y-3">
            {recentCases.map((caseData, index) => (
              <PatientCaseCard
                key={index}
                {...caseData}
                onClick={() => onNavigate('report')}
              />
            ))}
          </div>
        </div>

        {/* Recent PDFs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              PDFs Recentes
            </h2>
            <button className="text-sm text-primary-600 dark:text-primary-400 font-medium">
              Ver todos
            </button>
          </div>
          <div className="space-y-2">
            {recentPDFs.map((pdf, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-ios"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                      <FileText size={20} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {pdf.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {pdf.pages} página{pdf.pages > 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {pdf.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                    {pdf.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
