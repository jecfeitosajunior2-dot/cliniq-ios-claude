'use client';

import { 
  ChevronLeft, 
  Download, 
  Share2, 
  Copy, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Brain,
  Sparkles,
  MessageCircleQuestion,
  ArrowRight,
  Target,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Activity,
  Calendar,
  ChevronRight,
  Stethoscope,
  BookOpen
} from 'lucide-react';
import { useState } from 'react';

interface CaseIntelligenceReportProps {
  onBack: () => void;
}

export default function CaseIntelligenceReport({ onBack }: CaseIntelligenceReportProps) {
  const [activeSection, setActiveSection] = useState('resumo');

  const sections = [
    { id: 'resumo', label: 'Resumo', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'problemas', label: 'Problemas', icon: Target },
    { id: 'achados', label: 'Achados', icon: Activity },
    { id: 'perguntas', label: 'Perguntas', icon: MessageCircleQuestion },
    { id: 'evidencias', label: 'Evidências', icon: BookOpen },
    { id: 'proximos', label: 'Próximos Passos', icon: ArrowRight },
  ];

  const problems = [
    {
      title: 'Cefaleia progressiva de padrão preocupante',
      priority: 'critical',
      status: 'Investigação urgente',
      summary: 'Evolução de 3 meses com piora matinal e intensidade crescente. Padrão sugere possível hipertensão intracraniana.',
      evidence: [
        { source: 'Consulta 03:42', type: 'audio' },
        { source: 'RM crânio p.1-2', type: 'pdf' },
      ],
      relatedFindings: ['Lesão em RM', 'Histórico HAS'],
    },
    {
      title: 'Lesão encefálica não caracterizada',
      priority: 'critical',
      status: 'Requer contraste',
      summary: 'Achado frontoparietal esquerdo de 1.2cm em T2/FLAIR. Natureza indeterminada sem estudo contrastado.',
      evidence: [
        { source: 'RM crânio p.2', type: 'pdf' },
        { source: 'Laudo radiológico', type: 'pdf' },
      ],
      relatedFindings: ['Cefaleia progressiva'],
    },
    {
      title: 'Anemia em investigação',
      priority: 'moderate',
      status: 'Acompanhar tendência',
      summary: 'Hemoglobina 11.8 g/dL com queda progressiva nos últimos 6 meses. Origem a esclarecer.',
      evidence: [
        { source: 'Hemograma 14/03', type: 'exam' },
        { source: 'Hemograma anterior', type: 'exam' },
      ],
      relatedFindings: ['Possível sangramento oculto'],
    },
    {
      title: 'Hipertensão arterial sistêmica',
      priority: 'moderate',
      status: 'Controle em avaliação',
      summary: 'HAS conhecida há 8 anos. Tratamento atual com losartana 50mg. Adesão e controle a confirmar.',
      evidence: [
        { source: 'Consulta 08:42', type: 'audio' },
      ],
      relatedFindings: ['Risco cardiovascular'],
    },
  ];

  const findings = [
    {
      category: 'Imagem',
      items: [
        { finding: 'Lesão hipointensa frontoparietal E 1.2cm', status: 'critical', source: 'RM p.2' },
        { finding: 'Sem desvio de linha média', status: 'ok', source: 'RM p.2' },
        { finding: 'Sistema ventricular preservado', status: 'ok', source: 'RM p.3' },
      ]
    },
    {
      category: 'Laboratório',
      items: [
        { finding: 'Hemoglobina 11.8 g/dL (ref: 12-16)', status: 'warning', source: 'Hemograma' },
        { finding: 'VCM 82 fL - normocítica', status: 'ok', source: 'Hemograma' },
        { finding: 'Plaquetas normais', status: 'ok', source: 'Hemograma' },
      ]
    },
    {
      category: 'História Clínica',
      items: [
        { finding: 'Cefaleia progressiva há 3 meses', status: 'critical', source: 'Consulta 03:42' },
        { finding: 'Piora matinal dos sintomas', status: 'warning', source: 'Consulta 04:15' },
        { finding: 'Tontura rotatória episódica', status: 'warning', source: 'Consulta 12:33' },
        { finding: 'HAS há 8 anos, losartana 50mg', status: 'info', source: 'Consulta 08:42' },
      ]
    },
    {
      category: 'Antecedentes',
      items: [
        { finding: 'Mãe com AVC aos 68 anos', status: 'warning', source: 'Consulta 15:20' },
        { finding: 'Sem cirurgias prévias', status: 'ok', source: 'Consulta' },
        { finding: 'Nega alergias medicamentosas', status: 'ok', source: 'Consulta' },
      ]
    },
  ];

  const questions = [
    {
      question: 'Quando exatamente começaram os sintomas de cefaleia?',
      reason: 'Timeline precisa é essencial para correlação com achado de imagem',
      priority: 'critical',
      suggestedAction: 'Confirmar com paciente na próxima consulta',
    },
    {
      question: 'Houve trauma craniano nos últimos 6 meses?',
      reason: 'Pode alterar significativamente a interpretação do achado em RM',
      priority: 'critical',
      suggestedAction: 'Investigar história detalhada',
    },
    {
      question: 'Caracterizar melhor o padrão da tontura',
      reason: 'Diferenciar vertigem central vs periférica',
      priority: 'high',
      suggestedAction: 'Aplicar questionário específico',
    },
    {
      question: 'Lista completa de medicações em uso?',
      reason: 'Apenas losartana foi mencionada - pode haver outras',
      priority: 'moderate',
      suggestedAction: 'Solicitar receitas atuais',
    },
    {
      question: 'Medições recentes de pressão arterial?',
      reason: 'Avaliar controle pressórico atual',
      priority: 'moderate',
      suggestedAction: 'MAPA ou registro domiciliar',
    },
  ];

  const timelineEvents = [
    { 
      period: '3 meses atrás',
      events: [
        { description: 'Início dos sintomas de cefaleia', type: 'symptom', source: 'Consulta 03:42' },
      ]
    },
    { 
      period: '6 semanas atrás',
      events: [
        { description: 'Piora progressiva da cefaleia', type: 'symptom', source: 'Consulta 04:15' },
        { description: 'Início dos episódios de tontura', type: 'symptom', source: 'Consulta 12:33' },
      ]
    },
    { 
      period: '2 semanas atrás',
      events: [
        { description: 'RM de crânio realizada', type: 'exam', source: 'RM' },
        { description: 'Lesão frontoparietal identificada', type: 'finding', source: 'Laudo RM' },
      ]
    },
    { 
      period: 'Hoje',
      events: [
        { description: 'Consulta para segunda opinião', type: 'visit', source: 'Consulta atual' },
        { description: 'Solicitação de RM com contraste', type: 'plan', source: 'Conduta' },
      ]
    },
  ];

  const nextSteps = [
    {
      category: 'Urgente',
      icon: AlertTriangle,
      color: 'text-[--color-clinical-red] bg-[--color-clinical-red]/10',
      steps: [
        { action: 'RM de crânio com gadolínio', rationale: 'Caracterizar natureza da lesão' },
        { action: 'Avaliação neurológica completa', rationale: 'Buscar sinais focais' },
      ]
    },
    {
      category: 'Esta Semana',
      icon: Calendar,
      color: 'text-[--color-clinical-amber] bg-[--color-clinical-amber]/10',
      steps: [
        { action: 'Investigar anemia (ferritina, B12, folato)', rationale: 'Esclarecer etiologia' },
        { action: 'Doppler de carótidas', rationale: 'Avaliar risco cerebrovascular' },
        { action: 'MAPA 24h', rationale: 'Verificar controle pressórico' },
      ]
    },
    {
      category: 'Próxima Consulta',
      icon: Stethoscope,
      color: 'text-primary-500 bg-primary-50 dark:bg-primary-900/20',
      steps: [
        { action: 'Confirmar cronologia dos sintomas', rationale: 'Completar timeline' },
        { action: 'Revisar histórico familiar detalhado', rationale: 'Estratificar risco' },
        { action: 'Verificar adesão ao anti-hipertensivo', rationale: 'Otimizar tratamento' },
      ]
    },
    {
      category: 'Orientações ao Paciente',
      icon: Lightbulb,
      color: 'text-[--color-clinical-green] bg-[--color-clinical-green]/10',
      steps: [
        { action: 'Explicar achado de imagem e próximos passos', rationale: 'Transparência' },
        { action: 'Sinais de alerta neurológico', rationale: 'Quando procurar emergência' },
        { action: 'Manter diário de sintomas', rationale: 'Acompanhamento objetivo' },
      ]
    },
  ];

  const evidenceMap = [
    {
      conclusion: 'Cefaleia progressiva com padrão preocupante',
      sources: [
        { type: 'audio', label: 'Consulta 03:42-04:30', description: 'Paciente descreve piora matinal' },
        { type: 'audio', label: 'Consulta 10:15', description: 'Relata intensidade crescente' },
      ]
    },
    {
      conclusion: 'Lesão encefálica requer investigação',
      sources: [
        { type: 'pdf', label: 'RM crânio p.2', description: 'Imagem hipointensa em T1' },
        { type: 'pdf', label: 'Laudo oficial', description: 'Lesão de 1.2cm em região FP esquerda' },
      ]
    },
    {
      conclusion: 'Anemia com tendência de queda',
      sources: [
        { type: 'exam', label: 'Hemograma 14/03/26', description: 'Hb 11.8 g/dL' },
        { type: 'exam', label: 'Hemograma 09/09/25', description: 'Hb 12.8 g/dL (comparativo)' },
      ]
    },
    {
      conclusion: 'Risco cardiovascular familiar',
      sources: [
        { type: 'audio', label: 'Consulta 15:20', description: 'Mãe com AVC aos 68 anos' },
      ]
    },
  ];

  const getPriorityStyle = (priority: string) => {
    const styles = {
      critical: 'bg-[--color-clinical-red]/10 text-[--color-clinical-red] border-[--color-clinical-red]/20',
      high: 'bg-[--color-clinical-amber]/10 text-[--color-clinical-amber] border-[--color-clinical-amber]/20',
      moderate: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800',
      low: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    };
    return styles[priority as keyof typeof styles] || styles.moderate;
  };

  const getStatusStyle = (status: string) => {
    const styles = {
      critical: 'bg-[--color-clinical-red]/10 text-[--color-clinical-red]',
      warning: 'bg-[--color-clinical-amber]/10 text-[--color-clinical-amber]',
      ok: 'bg-[--color-clinical-green]/10 text-[--color-clinical-green]',
      info: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    };
    return styles[status as keyof typeof styles] || styles.info;
  };

  const getSourceIcon = (type: string) => {
    const icons = { audio: '🎙️', pdf: '📄', exam: '🧪', image: '🖼️' };
    return icons[type as keyof typeof icons] || '📎';
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Premium Header */}
      <div className="sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-xl">
        <div className="px-4 pt-12 pb-4">
          {/* Navigation Row */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
            >
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <Copy size={16} className="text-gray-600 dark:text-gray-400" />
              </button>
              <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <Share2 size={16} className="text-gray-600 dark:text-gray-400" />
              </button>
              <button className="h-9 px-4 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center gap-2">
                <Download size={14} className="text-white dark:text-gray-900" />
                <span className="text-sm font-medium text-white dark:text-gray-900">Exportar</span>
              </button>
            </div>
          </div>

          {/* Patient Info */}
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              M.S., 62 anos
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span>Feminino</span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span>Neurologia</span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span>Segunda opinião</span>
            </div>
          </div>

          {/* Status & Impact Card */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-[--color-clinical-teal] flex items-center justify-center flex-shrink-0">
                <Brain size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={14} className="text-[--color-clinical-green]" />
                  <span className="text-xs font-medium text-[--color-clinical-green]">
                    Dossiê pronto para revisão
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  <span className="text-white font-semibold">4 problemas ativos</span> identificados,{' '}
                  <span className="text-white font-semibold">11 achados</span> correlacionados,{' '}
                  <span className="text-white font-semibold">5 perguntas</span> para esclarecer e{' '}
                  <span className="text-white font-semibold">11 próximos passos</span> sugeridos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="overflow-x-auto scrollbar-hide px-4 pb-3">
          <div className="flex gap-1.5">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeSection === section.id
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon size={14} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-4">
        {/* RESUMO EXECUTIVO */}
        {activeSection === 'resumo' && (
          <div className="space-y-4">
            {/* Executive Summary Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-ios overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-primary-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Resumo Executivo
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Leitura em 30 segundos
                </p>
              </div>
              <div className="p-5">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong className="text-gray-900 dark:text-white">Paciente feminina, 62 anos</strong>, apresenta quadro de 
                    <strong className="text-gray-900 dark:text-white"> cefaleia progressiva há 3 meses</strong>, com característica de 
                    piora matinal e intensidade crescente, associada a episódios de tontura rotatória no último mês.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                    Portadora de <strong className="text-gray-900 dark:text-white">hipertensão arterial sistêmica</strong> há 8 anos, 
                    em uso de losartana 50mg/dia. RM de crânio recente revela 
                    <strong className="text-[--color-clinical-red]"> lesão hipointensa frontoparietal esquerda de 1,2cm</strong>, 
                    de natureza indeterminada sem estudo contrastado. Hemograma com anemia leve (Hb 11,8 g/dL) em queda progressiva.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                    <strong className="text-gray-900 dark:text-white">História familiar relevante</strong>: mãe com AVC aos 68 anos.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Findings Alert */}
            <div className="bg-[--color-clinical-amber]/5 dark:bg-[--color-clinical-amber]/10 rounded-2xl p-5 border border-[--color-clinical-amber]/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[--color-clinical-amber]/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-[--color-clinical-amber]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Pontos de Atenção Prioritária
                  </h4>
                  <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-[--color-clinical-amber] mt-1">•</span>
                      Lesão em RM sem caracterização - RM com contraste urgente
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[--color-clinical-amber] mt-1">•</span>
                      Padrão de cefaleia sugere possível hipertensão intracraniana
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[--color-clinical-amber] mt-1">•</span>
                      Anemia progressiva necessita investigação etiológica
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE CLÍNICA */}
        {activeSection === 'timeline' && (
          <div className="space-y-1">
            {timelineEvents.map((period, periodIndex) => (
              <div key={periodIndex} className="relative">
                {/* Period Header */}
                <div className="sticky top-[280px] z-10 bg-gray-50 dark:bg-gray-950 py-2">
                  <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                    {period.period}
                  </span>
                </div>
                
                {/* Events */}
                <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-800 ml-2 space-y-3 pb-4">
                  {period.events.map((event, eventIndex) => (
                    <div key={eventIndex} className="relative">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 border-white dark:border-gray-950 ${
                        event.type === 'finding' || event.type === 'symptom' 
                          ? 'bg-[--color-clinical-amber]' 
                          : event.type === 'exam' 
                          ? 'bg-primary-500'
                          : 'bg-[--color-clinical-green]'
                      }`} />
                      
                      {/* Event Card */}
                      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-ios ml-2">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            <FileText size={10} />
                            {event.source}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PROBLEMAS ATIVOS */}
        {activeSection === 'problemas' && (
          <div className="space-y-4">
            {problems.map((problem, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-ios overflow-hidden"
              >
                {/* Problem Header */}
                <div className={`p-4 border-b ${
                  problem.priority === 'critical' 
                    ? 'bg-[--color-clinical-red]/5 border-[--color-clinical-red]/10' 
                    : 'border-gray-100 dark:border-gray-800'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {problem.priority === 'critical' && (
                          <span className="w-2 h-2 rounded-full bg-[--color-clinical-red] animate-pulse" />
                        )}
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {problem.title}
                        </h4>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getPriorityStyle(problem.priority)}`}>
                        {problem.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Problem Content */}
                <div className="p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    {problem.summary}
                  </p>

                  {/* Evidence Links */}
                  <div className="flex flex-wrap gap-2">
                    {problem.evidence.map((ev, evIndex) => (
                      <span
                        key={evIndex}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400"
                      >
                        {getSourceIcon(ev.type)}
                        {ev.source}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACHADOS RELEVANTES */}
        {activeSection === 'achados' && (
          <div className="space-y-4">
            {findings.map((category, catIndex) => (
              <div key={catIndex}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  {category.category}
                </h3>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-ios overflow-hidden">
                  {category.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`flex items-center gap-3 p-4 ${
                        itemIndex !== category.items.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.status === 'critical' ? 'bg-[--color-clinical-red]' :
                        item.status === 'warning' ? 'bg-[--color-clinical-amber]' :
                        item.status === 'ok' ? 'bg-[--color-clinical-green]' :
                        'bg-primary-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {item.finding}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {item.source}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PERGUNTAS INTELIGENTES */}
        {activeSection === 'perguntas' && (
          <div className="space-y-3">
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <MessageCircleQuestion size={20} className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Lacunas Identificadas
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Perguntas que podem enriquecer o diagnóstico e conduta
                  </p>
                </div>
              </div>
            </div>

            {questions.map((q, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-ios p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    q.priority === 'critical' ? 'bg-[--color-clinical-red]/10' :
                    q.priority === 'high' ? 'bg-[--color-clinical-amber]/10' :
                    'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <AlertCircle size={16} className={
                      q.priority === 'critical' ? 'text-[--color-clinical-red]' :
                      q.priority === 'high' ? 'text-[--color-clinical-amber]' :
                      'text-gray-500'
                    } />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {q.question}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {q.reason}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400">
                      <ArrowRight size={12} />
                      {q.suggestedAction}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EVIDÊNCIAS */}
        {activeSection === 'evidencias' && (
          <div className="space-y-4">
            <div className="bg-gray-900 dark:bg-gray-800 rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <BookOpen size={20} className="text-white flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Rastreabilidade Completa
                  </h4>
                  <p className="text-xs text-gray-400">
                    Toda conclusão com sua origem documentada
                  </p>
                </div>
              </div>
            </div>

            {evidenceMap.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-ios overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.conclusion}
                  </h4>
                </div>
                <div className="p-3 space-y-2">
                  {item.sources.map((source, sIndex) => (
                    <div
                      key={sIndex}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-950"
                    >
                      <span className="text-lg">{getSourceIcon(source.type)}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {source.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {source.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PRÓXIMOS PASSOS */}
        {activeSection === 'proximos' && (
          <div className="space-y-4">
            {nextSteps.map((category, catIndex) => {
              const Icon = category.icon;
              return (
                <div
                  key={catIndex}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-ios overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center`}>
                        <Icon size={16} />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {category.category}
                      </h4>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    {category.steps.map((step, stepIndex) => (
                      <div
                        key={stepIndex}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors"
                      >
                        <ChevronRight size={16} className="text-gray-400 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {step.action}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {step.rationale}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
