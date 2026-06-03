'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Download, Share2, Search, AlertTriangle, TrendingUp, FileText, Clock, CheckCircle2, Brain } from 'lucide-react';
import { useState } from 'react';

interface CaseIntelligenceReportProps {
  onViewPDF: () => void;
  onBack: () => void;
}

export default function CaseIntelligenceReport({ onViewPDF, onBack }: CaseIntelligenceReportProps) {
  const [activeTab, setActiveTab] = useState('detective');

  const tabs = [
    { id: 'detective', label: 'Clinical Detective' },
    { id: 'resumo', label: 'Resumo' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'perguntas', label: 'Perguntas' },
  ];

  const detectiveFindings = [
    {
      title: 'Padrão temporal detectado',
      conclusion: 'A cefaleia evoluiu de episódica para progressiva em aproximadamente seis semanas.',
      importance: 'Mudança de padrão pode indicar sinal de alerta neurológico e justificar investigação prioritária.',
      confidence: 'Alta',
      evidence: ['Áudio 02:14', 'RM página 2', 'Relato de tontura'],
      action: 'Considerar avaliação neurológica prioritária e RM com contraste',
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Inconsistência medicamentosa',
      conclusion: 'O paciente informou não usar medicação contínua, mas documento anterior menciona losartana.',
      importance: 'Essa divergência pode alterar interpretação de pressão arterial, adesão terapêutica e risco cardiovascular.',
      confidence: 'Média-Alta',
      evidence: ['Áudio 04:32', 'Histórico p.1', 'PA elevada na triagem'],
      action: 'Confirmar lista real de medicamentos, dose, adesão e interrupções recentes',
      icon: AlertTriangle,
      color: 'amber'
    },
    {
      title: 'Correlação laboratorial relevante',
      conclusion: 'A hemoglobina caiu em exames sucessivos e pode se relacionar com queixa de cansaço.',
      importance: 'Anemia progressiva pode explicar sintomas e exigir investigação etiológica.',
      confidence: 'Alta',
      evidence: ['Hb 13,1 g/dL anterior', 'Hb 10,4 g/dL atual', 'Áudio 05:18'],
      action: 'Investigar sangramentos, dieta, anti-inflamatórios e histórico gastrointestinal',
      icon: Search,
      color: 'blue'
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden pb-6">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" />

      <div className="relative z-10 max-w-md mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 glass-effect border-b border-white/10">
          <div className="px-6 pt-12 pb-4">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <Share2 size={18} />
                </button>
                <button className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center justify-center transition-colors">
                  <Download size={18} />
                </button>
              </div>
            </div>

            {/* Patient info */}
            <div className="mb-4">
              <h1 className="text-xl font-bold mb-1">M.S., 62 anos</h1>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Neurologia</span>
                <span>•</span>
                <span>Segunda opinião</span>
              </div>
            </div>

            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 mb-4">
              <CheckCircle2 size={14} className="text-green-400" />
              <span className="text-xs font-medium text-green-400">Pronto para revisão médica</span>
            </div>

            {/* Impact statement */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl p-5 border border-purple-500/30"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <Brain size={20} className="text-purple-300" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-white">Caso reconstruído</h3>
                  <p className="text-sm text-slate-200">
                    <span className="font-semibold">4 problemas ativos</span>, <span className="font-semibold">11 achados relevantes</span>, <span className="font-semibold">3 inconsistências</span> e <span className="font-semibold">7 próximos passos</span> identificados
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="overflow-x-auto scrollbar-hide px-6 pb-3">
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-6 space-y-4">
          {/* Clinical Detective Section */}
          {activeTab === 'detective' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain size={20} className="text-purple-400" />
                <h2 className="text-lg font-semibold">Clinical Detective</h2>
              </div>

              <p className="text-sm text-slate-400 mb-6">
                Achados cruzados que merecem atenção clínica especial
              </p>

              {detectiveFindings.map((finding, index) => {
                const Icon = finding.icon;
                const colorClasses = {
                  purple: 'from-purple-500 to-pink-500 bg-purple-500/10 text-purple-400 border-purple-500/30',
                  amber: 'from-amber-500 to-orange-500 bg-amber-500/10 text-amber-400 border-amber-500/30',
                  blue: 'from-blue-500 to-cyan-500 bg-blue-500/10 text-blue-400 border-blue-500/30',
                };

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`glass-effect rounded-2xl p-6 border-2 ${colorClasses[finding.color as keyof typeof colorClasses]}`}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[finding.color as keyof typeof colorClasses]} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{finding.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                            Confiança: {finding.confidence}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Conclusion */}
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-slate-400 mb-2">CONCLUSÃO</h4>
                      <p className="text-sm text-white">{finding.conclusion}</p>
                    </div>

                    {/* Importance */}
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-slate-400 mb-2">POR QUE IMPORTA</h4>
                      <p className="text-sm text-slate-300">{finding.importance}</p>
                    </div>

                    {/* Evidence */}
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-slate-400 mb-2">EVIDÊNCIAS</h4>
                      <div className="flex flex-wrap gap-2">
                        {finding.evidence.map((ev, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-md bg-white/5 text-slate-300">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Next action */}
                    <div className="pt-4 border-t border-white/10">
                      <h4 className="text-xs font-semibold text-slate-400 mb-2">PRÓXIMA AÇÃO</h4>
                      <p className="text-sm text-slate-200">{finding.action}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* PDF Preview Card */}
          <motion.button
            onClick={onViewPDF}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full glass-effect hover:bg-white/10 rounded-2xl p-6 text-left transition-colors border-2 border-blue-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <FileText size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Dossiê Clínico Premium</h3>
                  <p className="text-xs text-slate-400">Pronto para revisão</p>
                </div>
              </div>
              <div className="text-blue-400">
                <Download size={20} />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>12 páginas</span>
              <span>•</span>
              <span>8 seções</span>
              <span>•</span>
              <span>27 evidências rastreáveis</span>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
