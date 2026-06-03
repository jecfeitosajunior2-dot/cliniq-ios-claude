'use client';

import { 
  ChevronLeft, 
  Download, 
  Share2, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Brain,
  Sparkles,
  MessageCircleQuestion,
  ArrowRight,
  Target,
  AlertCircle,
  Lightbulb,
  Activity,
  ChevronRight,
  Search,
  GitBranch,
  Zap,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';

interface CaseIntelligenceReportProps {
  onBack: () => void;
}

export default function CaseIntelligenceReport({ onBack }: CaseIntelligenceReportProps) {
  const [activeSection, setActiveSection] = useState('detective');

  const sections = [
    { id: 'detective', label: 'Detective', icon: Search },
    { id: 'resumo', label: 'Resumo', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: GitBranch },
    { id: 'problemas', label: 'Problemas', icon: Target },
    { id: 'lacunas', label: 'Lacunas', icon: AlertCircle },
    { id: 'proximos', label: 'Acoes', icon: ArrowRight },
  ];

  // Clinical Detective - achados cruzados
  const detectiveFindings = [
    {
      id: 'pattern-temporal',
      type: 'pattern',
      title: 'Padrao temporal detectado',
      conclusion: 'A cefaleia evoluiu de episodica para progressiva em aproximadamente 6 semanas.',
      whyItMatters: 'Mudanca de padrao pode indicar sinal de alerta neurologico e justificar investigacao prioritaria.',
      evidence: [
        { source: 'Consulta', timestamp: '02:14', label: 'Relato de evolucao' },
        { source: 'RM cranio', page: '2', label: 'Achado compativel' },
        { source: 'Consulta', timestamp: '15:32', label: 'Tontura recente' },
      ],
      confidence: 'alta',
      nextAction: 'Considerar avaliacao neurologica prioritaria e RM com contraste',
    },
    {
      id: 'inconsistency-med',
      type: 'inconsistency',
      title: 'Inconsistencia medicamentosa',
      conclusion: 'Paciente informou nao usar medicacao continua, mas documento anterior menciona losartana.',
      whyItMatters: 'Divergencia pode alterar interpretacao de PA, adesao terapeutica e risco cardiovascular.',
      evidence: [
        { source: 'Consulta', timestamp: '04:32', label: 'Nega medicacao' },
        { source: 'Historico clinico', page: '1', label: 'Losartana 50mg' },
        { source: 'Triagem atual', label: 'PA 148/92 mmHg' },
      ],
      confidence: 'media-alta',
      nextAction: 'Confirmar lista real de medicamentos, dose, adesao e interrupcoes',
    },
    {
      id: 'correlation-lab',
      type: 'correlation',
      title: 'Correlacao laboratorial relevante',
      conclusion: 'Hemoglobina caiu em exames sucessivos e pode se relacionar com queixa de cansaco.',
      whyItMatters: 'Anemia progressiva pode explicar sintomas e exigir investigacao etiologica.',
      evidence: [
        { source: 'Hemograma anterior', label: 'Hb 13.1 g/dL' },
        { source: 'Hemograma atual', label: 'Hb 10.4 g/dL' },
        { source: 'Consulta', timestamp: '05:18', label: 'Relata fadiga' },
      ],
      confidence: 'alta',
      nextAction: 'Investigar sangramentos, dieta, anti-inflamatorios e exames complementares',
    },
    {
      id: 'gap-critical',
      type: 'gap',
      title: 'Lacuna clinica critica',
      conclusion: 'Nao ha documentacao clara sobre inicio subito, deficit focal ou sinais neurologicos de alarme.',
      whyItMatters: 'Essas respostas podem mudar prioridade de encaminhamento e conduta.',
      evidence: [
        { source: 'Consulta', label: 'Sem resposta clara' },
        { source: 'RM', label: 'Achado nao caracterizado' },
        { source: 'Exame neurologico', label: 'Nao documentado' },
      ],
      confidence: 'alta',
      nextAction: 'Perguntar sobre fraqueza, alteracao visual, fala, marcha e vomitos',
    },
  ];

  const problems = [
    {
      title: 'Cefaleia progressiva de padrao preocupante',
      priority: 'critical',
      status: 'Investigacao urgente',
      summary: 'Evolucao de 3 meses com piora matinal e intensidade crescente.',
    },
    {
      title: 'Lesao encefalica nao caracterizada',
      priority: 'critical',
      status: 'Requer contraste',
      summary: 'Achado frontoparietal E 1.2cm em T2/FLAIR.',
    },
    {
      title: 'Anemia em investigacao',
      priority: 'moderate',
      status: 'Acompanhar tendencia',
      summary: 'Hb 10.4 g/dL com queda progressiva.',
    },
    {
      title: 'HAS em tratamento',
      priority: 'moderate',
      status: 'Avaliar controle',
      summary: 'Losartana 50mg - adesao a confirmar.',
    },
  ];

  const gaps = [
    { question: 'Houve inicio subito ou piora abrupta da cefaleia?', impact: 'Muda urgencia', priority: 'critical' },
    { question: 'Presenca de deficit motor, sensitivo ou visual?', impact: 'Indica focal', priority: 'critical' },
    { question: 'Historia de vomitos em jato ou alteracao de consciencia?', impact: 'Sinal de alarme', priority: 'high' },
    { question: 'Uso recente de anti-inflamatorios ou anticoagulantes?', impact: 'Explica anemia', priority: 'moderate' },
    { question: 'Adesao real ao tratamento anti-hipertensivo?', impact: 'Risco CV', priority: 'moderate' },
  ];

  const nextSteps = [
    { action: 'RM cranio com contraste gadolinio', urgency: 'Urgente', reason: 'Caracterizar lesao' },
    { action: 'Avaliacao neurologica completa', urgency: 'Urgente', reason: 'Sinais focais' },
    { action: 'Hemograma de controle + ferritina + reticulocitos', urgency: 'Breve', reason: 'Investigar anemia' },
    { action: 'Revisao medicamentosa detalhada', urgency: 'Proxima consulta', reason: 'Adesao e interacoes' },
    { action: 'MAPA 24h', urgency: 'Eletivo', reason: 'Avaliar controle PA' },
  ];

  const timelineEvents = [
    { date: '3 meses atras', event: 'Inicio da cefaleia episodica', type: 'symptom' },
    { date: '6 semanas atras', event: 'Cefaleia torna-se progressiva', type: 'worsening' },
    { date: '2 semanas atras', event: 'Inicio de tontura intermitente', type: 'symptom' },
    { date: '1 semana atras', event: 'RM cranio realizada', type: 'exam' },
    { date: 'Hoje', event: 'Consulta atual', type: 'consultation' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <GitBranch size={18} />;
      case 'inconsistency': return <AlertTriangle size={18} />;
      case 'correlation': return <Zap size={18} />;
      case 'gap': return <Eye size={18} />;
      default: return <Search size={18} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pattern': return 'from-violet-500 to-purple-600';
      case 'inconsistency': return 'from-amber-500 to-orange-600';
      case 'correlation': return 'from-emerald-500 to-teal-600';
      case 'gap': return 'from-rose-500 to-red-600';
      default: return 'from-sky-500 to-cyan-600';
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'pattern': return 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800';
      case 'inconsistency': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'correlation': return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'gap': return 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800';
      default: return 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 pt-12 pb-3">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <Share2 size={16} className="text-gray-600 dark:text-gray-400" />
              </button>
              <button className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center">
                <Download size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* Paciente */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center">
              <span className="text-base font-semibold text-white">MS</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                M.S., 62 anos
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Feminino • Neurologia • Segunda opiniao
              </p>
            </div>
          </div>

          {/* Navegacao */}
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {sections.map(section => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
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

      {/* Conteudo */}
      <div className="px-4 pt-4">
        {/* CLINICAL DETECTIVE - Secao principal */}
        {activeSection === 'detective' && (
          <div className="space-y-4">
            {/* Header da secao */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Search size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Clinical Detective</h2>
                  <p className="text-xs text-gray-400">Inteligencia clinica cruzada</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                O ClinIQ analisou audio, documentos e exames para encontrar padroes, inconsistencias e lacunas que merecem atencao.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-violet-400" />
                  <span className="text-xs text-gray-400">1 padrao</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs text-gray-400">1 inconsistencia</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-gray-400">1 correlacao</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-xs text-gray-400">1 lacuna</span>
                </div>
              </div>
            </div>

            {/* Achados do Detective */}
            {detectiveFindings.map((finding) => (
              <div
                key={finding.id}
                className={`rounded-2xl border p-4 ${getTypeBg(finding.type)}`}
              >
                {/* Header do achado */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getTypeColor(finding.type)} flex items-center justify-center text-white flex-shrink-0`}>
                    {getTypeIcon(finding.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {finding.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-300">
                        Confianca: {finding.confidence}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Conclusao */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {finding.conclusion}
                  </p>
                </div>

                {/* Por que importa */}
                <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 mb-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Lightbulb size={12} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Por que importa</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    {finding.whyItMatters}
                  </p>
                </div>

                {/* Evidencias */}
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Evidencias</span>
                  <div className="flex flex-wrap gap-1.5">
                    {finding.evidence.map((ev, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <FileText size={10} />
                        {ev.source} {ev.timestamp && `${ev.timestamp}`} {ev.page && `p.${ev.page}`}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Proxima acao */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                  <ArrowRight size={14} className="text-sky-600 dark:text-sky-400" />
                  <span className="text-xs font-medium text-sky-700 dark:text-sky-300">
                    {finding.nextAction}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RESUMO */}
        {activeSection === 'resumo' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">Leitura em 30 segundos</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Paciente feminina, 62 anos, apresenta quadro de <strong>cefaleia progressiva ha 3 meses</strong>, com caracteristica de piora matinal e intensidade crescente. RM de cranio evidencia <strong>lesao frontoparietal esquerda de 1.2cm</strong> nao caracterizada, necessitando estudo com contraste.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                Concomitantemente, apresenta <strong>anemia em investigacao</strong> (Hb 10.4 g/dL) com queda progressiva e <strong>HAS em tratamento</strong> com possivel baixa adesao. O conjunto de achados sugere investigacao neurologica prioritaria.
              </p>
            </div>

            {/* Card do PDF */}
            <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Dossie Clinico Premium</h3>
                    <p className="text-xs text-white/70">12 paginas • Revisao medica recomendada</p>
                  </div>
                </div>
                <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <Download size={18} className="text-sky-600" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE */}
        {activeSection === 'timeline' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Historia Clinica Temporal
            </h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />
              <div className="space-y-4">
                {timelineEvents.map((event, i) => (
                  <div key={i} className="relative flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      event.type === 'worsening' 
                        ? 'bg-amber-100 dark:bg-amber-900/30' 
                        : event.type === 'exam'
                          ? 'bg-sky-100 dark:bg-sky-900/30'
                          : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {event.type === 'worsening' ? (
                        <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                      ) : event.type === 'exam' ? (
                        <Activity size={14} className="text-sky-600 dark:text-sky-400" />
                      ) : (
                        <Clock size={14} className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{event.date}</p>
                      <p className="text-sm text-gray-900 dark:text-white">{event.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PROBLEMAS */}
        {activeSection === 'problemas' && (
          <div className="space-y-3">
            {problems.map((problem, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    problem.priority === 'critical'
                      ? 'bg-rose-100 dark:bg-rose-900/30'
                      : 'bg-amber-100 dark:bg-amber-900/30'
                  }`}>
                    <Target size={16} className={
                      problem.priority === 'critical'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                    } />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {problem.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {problem.summary}
                    </p>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-2 ${
                      problem.priority === 'critical'
                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    }`}>
                      {problem.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LACUNAS */}
        {activeSection === 'lacunas' && (
          <div className="space-y-3">
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-4 border border-rose-200 dark:border-rose-800 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircleQuestion size={16} className="text-rose-600 dark:text-rose-400" />
                <span className="text-sm font-medium text-rose-800 dark:text-rose-200">
                  {gaps.length} perguntas pendentes
                </span>
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-400">
                Informacoes que podem mudar a conduta clinica
              </p>
            </div>
            {gaps.map((gap, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"
              >
                <p className="text-sm text-gray-900 dark:text-white mb-2">
                  {gap.question}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    gap.priority === 'critical'
                      ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                      : gap.priority === 'high'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {gap.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PROXIMOS PASSOS */}
        {activeSection === 'proximos' && (
          <div className="space-y-3">
            {nextSteps.map((step, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-xs font-semibold text-sky-600 dark:text-sky-400">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {step.action}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {step.reason}
                    </p>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-2 ${
                      step.urgency === 'Urgente'
                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                        : step.urgency === 'Breve'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {step.urgency}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
