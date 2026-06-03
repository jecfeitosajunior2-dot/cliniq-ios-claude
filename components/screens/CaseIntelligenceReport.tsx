'use client';

import { ChevronLeft, Download, Edit, Copy, AlertCircle, FileText, CheckCircle2, Clock, Brain } from 'lucide-react';
import { useState } from 'react';
import EvidenceChip from '@/components/ui/EvidenceChip';
import ProblemCard from '@/components/ui/ProblemCard';
import FindingCard from '@/components/ui/FindingCard';
import NextStepCard from '@/components/ui/NextStepCard';

interface CaseIntelligenceReportProps {
  onBack: () => void;
}

export default function CaseIntelligenceReport({ onBack }: CaseIntelligenceReportProps) {
  const [activeSection, setActiveSection] = useState('resumo');

  const sections = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'problemas', label: 'Problemas' },
    { id: 'achados', label: 'Achados' },
    { id: 'perguntas', label: 'Perguntas' },
    { id: 'proximos', label: 'Próximos Passos' },
  ];

  const problems = [
    {
      title: 'Cefaleia progressiva',
      priority: 'alta' as const,
      status: 'Em investigação',
      description: 'Cefaleia de intensidade crescente nos últimos 3 meses, com piora matinal.',
      evidence: [
        { type: 'audio' as const, label: 'Áudio 3:15' },
        { type: 'pdf' as const, label: 'RM p.1' },
      ],
    },
    {
      title: 'Hipertensão arterial',
      priority: 'media' as const,
      status: 'Acompanhamento',
      description: 'HAS conhecida há 8 anos, em uso de losartana 50mg/dia.',
      evidence: [
        { type: 'audio' as const, label: 'Áudio 8:42' },
      ],
    },
    {
      title: 'Alteração em RM de crânio',
      priority: 'alta' as const,
      status: 'Correlacionar clinicamente',
      description: 'Lesão hipointensa em região frontoparietal esquerda, a esclarecer.',
      evidence: [
        { type: 'pdf' as const, label: 'RM p.2' },
        { type: 'image' as const, label: 'Laudo' },
      ],
    },
    {
      title: 'Tontura recorrente',
      priority: 'media' as const,
      status: 'Esclarecer padrão',
      description: 'Episódios de tontura rotatória, sem perda de consciência.',
      evidence: [
        { type: 'audio' as const, label: 'Áudio 12:33' },
      ],
    },
  ];

  const findings = [
    { category: 'Imagem', finding: 'Lesão hipointensa FP esquerda 1,2cm', source: 'RM p.2', status: 'Revisar' as const },
    { category: 'Laboratório', finding: 'Hemoglobina 11,8 g/dL (↓)', source: 'Exame lab', status: 'Investigar' as const },
    { category: 'Medicação', finding: 'Losartana 50mg 1x/dia', source: 'Áudio 8:42', status: 'OK' as const },
    { category: 'História', finding: 'Mãe com histórico de AVC', source: 'Áudio 15:20', status: 'Atenção' as const },
    { category: 'Imagem', finding: 'Sem outras alterações estruturais', source: 'RM p.3', status: 'OK' as const },
  ];

  const questions = [
    {
      question: 'Quando exatamente os sintomas começaram?',
      reason: 'Timeline incompleta para correlação clínica',
      priority: 'alta',
    },
    {
      question: 'Há história de trauma craniano recente?',
      reason: 'Achado de imagem necessita contexto',
      priority: 'alta',
    },
    {
      question: 'Padrão da tontura: rotatória ou desequilíbrio?',
      reason: 'Esclarecer diagnóstico diferencial',
      priority: 'media',
    },
    {
      question: 'Medicações além da losartana?',
      reason: 'Lista terapêutica pode estar incompleta',
      priority: 'media',
    },
  ];

  const nextSteps = [
    {
      category: 'Investigar',
      steps: [
        'Ressonância com contraste para caracterizar lesão',
        'Investigar anemia (hemograma anterior, ferritina, B12)',
        'Considerar doppler de carótidas',
      ],
    },
    {
      category: 'Confirmar',
      steps: [
        'Revisar histórico familiar detalhado',
        'Confirmar adesão ao tratamento anti-hipertensivo',
        'Verificar medições de PA domiciliar',
      ],
    },
    {
      category: 'Orientar',
      steps: [
        'Explicar achado de imagem e próximos passos',
        'Reforçar sinais de alerta neurológico',
      ],
    },
    {
      category: 'Acompanhar',
      steps: [
        'Retorno em 2 semanas com novos exames',
        'Manter diário de sintomas',
      ],
    },
  ];

  const timelineEvents = [
    { date: '3 meses atrás', event: 'Início dos sintomas de cefaleia', source: 'Áudio 3:15' },
    { date: '1 mês atrás', event: 'Piora progressiva, início da tontura', source: 'Áudio 12:33' },
    { date: '2 semanas atrás', event: 'RM de crânio realizada', source: 'PDF RM' },
    { date: 'Hoje', event: 'Consulta atual - Segunda opinião', source: 'Áudio' },
    { date: 'Pendente', event: 'RM com contraste agendada', source: 'Plano' },
  ];

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
              >
                <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  M.S., 62 anos
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Neurologia</span>
                  <span className="text-xs text-gray-400 dark:text-gray-600">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Segunda opinião</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <Copy size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
              <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <Edit size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
              <button className="w-9 h-9 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center">
                <Download size={18} className="text-white" />
              </button>
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[--color-clinical-green]/10 dark:bg-[--color-clinical-green]/20 mb-4">
            <CheckCircle2 size={14} className="text-[--color-clinical-green]" />
            <span className="text-xs font-medium text-[--color-clinical-green]">
              Pronto para revisão médica
            </span>
          </div>

          {/* Impact Statement */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 rounded-2xl p-5 shadow-ios-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Brain size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Caso reconstruído</h3>
                <p className="text-sm text-primary-100">
                  <span className="font-semibold text-white">4 problemas ativos</span>,{' '}
                  <span className="font-semibold text-white">11 achados relevantes</span>,{' '}
                  <span className="font-semibold text-white">3 inconsistências</span> e{' '}
                  <span className="font-semibold text-white">7 próximos passos</span> identificados
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="overflow-x-auto scrollbar-hide px-4 pb-3">
          <div className="flex gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-6 space-y-6">
        {/* Resumo Executivo */}
        {activeSection === 'resumo' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-ios">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText size={16} className="text-primary-600 dark:text-primary-400" />
                Resumo Executivo
              </h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
                <p>
                  Paciente feminina, 62 anos, com quadro de cefaleia progressiva há 3 meses, 
                  associada a tontura recorrente no último mês. Portadora de HAS em tratamento 
                  com losartana 50mg/dia.
                </p>
                <p>
                  RM de crânio realizada há 2 semanas evidencia lesão hipointensa em região 
                  frontoparietal esquerda medindo 1,2cm, necessitando caracterização com contraste. 
                  Hemograma com anemia leve (Hb 11,8 g/dL).
                </p>
                <p>
                  História familiar positiva para AVC materno. Caso requer investigação 
                  complementar urgente para caracterização da lesão e definição diagnóstica.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        {activeSection === 'timeline' && (
          <div className="space-y-3">
            {timelineEvents.map((event, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-ios">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Clock size={16} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                        {event.date}
                      </span>
                      <EvidenceChip type={event.source.includes('Áudio') ? 'audio' : event.source.includes('PDF') ? 'pdf' : 'exam'} label={event.source} />
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {event.event}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Problemas Ativos */}
        {activeSection === 'problemas' && (
          <div className="space-y-3">
            {problems.map((problem, index) => (
              <ProblemCard key={index} {...problem} />
            ))}
          </div>
        )}

        {/* Achados Relevantes */}
        {activeSection === 'achados' && (
          <div className="space-y-2">
            {findings.map((finding, index) => (
              <FindingCard key={index} {...finding} />
            ))}
          </div>
        )}

        {/* Perguntas Inteligentes */}
        {activeSection === 'perguntas' && (
          <div className="space-y-3">
            {questions.map((q, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-ios">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    q.priority === 'alta'
                      ? 'bg-[--color-clinical-amber]/10 dark:bg-[--color-clinical-amber]/20'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <AlertCircle size={16} className={q.priority === 'alta' ? 'text-[--color-clinical-amber]' : 'text-gray-500 dark:text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {q.question}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Motivo: {q.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Próximos Passos */}
        {activeSection === 'proximos' && (
          <div className="space-y-4">
            {nextSteps.map((category, index) => (
              <NextStepCard key={index} category={category.category} steps={category.steps} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
