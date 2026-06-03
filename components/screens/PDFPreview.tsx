'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Download, Share2, FileText } from 'lucide-react';

interface PDFPreviewProps {
  onBack: () => void;
}

export default function PDFPreview({ onBack }: PDFPreviewProps) {
  const sections = [
    'Capa',
    'Sumário Executivo',
    'Problemas Ativos',
    'Clinical Detective',
    'Timeline Clínica',
    'Achados por Fonte',
    'Inconsistências',
    'Lacunas',
    'Perguntas Inteligentes',
    'Próximos Passos',
    'Evidências',
    'Aviso Legal',
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" />

      <div className="relative z-10 max-w-md mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <h1 className="text-lg font-semibold">PDF Premium</h1>

          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <Share2 size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center justify-center transition-colors">
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* PDF Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-6 mb-6"
        >
          {/* Simulated PDF cover */}
          <div className="aspect-[8.5/11] bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 mb-4 border border-white/10 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
                <FileText size={32} className="text-white" />
              </div>

              <h2 className="text-2xl font-bold mb-2">Dossiê Clínico Premium</h2>
              <p className="text-slate-400 text-sm mb-8">Case Intelligence Report</p>

              <div className="space-y-2 text-left w-full max-w-xs">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Paciente:</span>
                  <span className="text-white">M.S., 62 anos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Especialidade:</span>
                  <span className="text-white">Neurologia</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Data:</span>
                  <span className="text-white">03 de Junho de 2026</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-green-400">Pronto para revisão</span>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 pt-4 border-t border-white/5">
              Gerado por ClinIQ — Segundo Cérebro Clínico
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mb-4">
            Página 1 de 12
          </p>

          {/* Page thumbnails */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((page) => (
              <motion.button
                key={page}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-shrink-0 w-12 h-16 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                  page === 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {page}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Document info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-2xl p-6 mb-6"
        >
          <h3 className="text-sm font-semibold mb-4">Estrutura do Documento</h3>
          <div className="space-y-2">
            {sections.map((section, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0"
              >
                <span className="text-slate-300">{section}</span>
                <span className="text-slate-500 text-xs">p.{index + 1}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="glass-effect rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400 mb-1">12</p>
            <p className="text-xs text-slate-400">Páginas</p>
          </div>
          <div className="glass-effect rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-400 mb-1">8</p>
            <p className="text-xs text-slate-400">Seções</p>
          </div>
          <div className="glass-effect rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400 mb-1">27</p>
            <p className="text-xs text-slate-400">Evidências</p>
          </div>
        </motion.div>

        {/* Export options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-3"
        >
          <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
            <Download size={20} />
            <span>Baixar PDF Completo</span>
          </button>

          <button className="w-full glass-effect hover:bg-white/10 py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
            <Share2 size={20} />
            <span>Compartilhar Relatório</span>
          </button>
        </motion.div>

        {/* Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 glass-effect rounded-xl p-4 border border-amber-500/30"
        >
          <p className="text-xs text-slate-300 text-center">
            <span className="font-semibold text-amber-400">Aviso:</span> Este relatório deve ser revisado por médico. O ClinIQ é uma ferramenta de suporte clínico, não substitui julgamento médico.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
