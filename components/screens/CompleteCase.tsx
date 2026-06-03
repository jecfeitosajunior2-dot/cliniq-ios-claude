'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, FlaskConical, Image as ImageIcon, Upload, CheckCircle2, ChevronLeft } from 'lucide-react';

interface CompleteCaseProps {
  onSubmit: () => void;
}

export default function CompleteCase({ onSubmit }: CompleteCaseProps) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const uploadCategories = [
    { id: 'pdf', icon: FileText, label: 'PDFs', desc: 'Laudos, cartas, prontuários', color: 'from-red-500 to-orange-500' },
    { id: 'exam', icon: FlaskConical, label: 'Exames', desc: 'Laboratório, imagem', color: 'from-blue-500 to-cyan-500' },
    { id: 'image', icon: ImageIcon, label: 'Imagens', desc: 'Fotos de exames, prints', color: 'from-purple-500 to-pink-500' },
  ];

  const handleUpload = (id: string) => {
    if (!uploadedFiles.includes(id)) {
      setUploadedFiles([...uploadedFiles, id]);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" />

      <div className="relative z-10 max-w-md mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold mb-2">Completar Caso</h1>
          <p className="text-slate-400 text-sm">Adicione contexto clínico mínimo</p>
        </motion.div>

        {/* Minimal form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-2xl p-6 mb-6"
        >
          <h3 className="text-sm font-medium text-slate-300 mb-4">Dados do Paciente</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Paciente ou iniciais</label>
              <input
                type="text"
                placeholder="Ex: M.S. ou Maria Silva"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Idade</label>
                <input
                  type="number"
                  placeholder="62"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Sexo</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="F">Feminino</option>
                  <option value="M">Masculino</option>
                  <option value="O">Outro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-2 block">Especialidade</label>
              <input
                type="text"
                placeholder="Ex: Neurologia"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-2 block">Objetivo clínico</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Relatório Premium Completo</option>
                <option>Segunda Opinião</option>
                <option>Revisão de Exames</option>
                <option>Carta para Especialista</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Upload section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="text-sm font-medium text-slate-300 mb-4">Adicionar Contexto Clínico</h3>
          <div className="grid grid-cols-3 gap-3">
            {uploadCategories.map((category) => {
              const Icon = category.icon;
              const isUploaded = uploadedFiles.includes(category.id);

              return (
                <motion.button
                  key={category.id}
                  onClick={() => handleUpload(category.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`glass-effect rounded-xl p-4 text-center transition-all ${
                    isUploaded ? 'ring-2 ring-green-400' : ''
                  }`}
                >
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                    {isUploaded ? (
                      <CheckCircle2 size={24} className="text-white" />
                    ) : (
                      <Icon size={24} className="text-white" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-white mb-1">{category.label}</p>
                  <p className="text-[10px] text-slate-400">{category.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Uploaded files status */}
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 space-y-2"
          >
            {uploadedFiles.map((fileId) => {
              const category = uploadCategories.find((c) => c.id === fileId);
              const fileNames: Record<string, string> = {
                pdf: 'RM crânio.pdf — 3 páginas — laudo de imagem detectado',
                exam: 'Hemograma.jpg — valores laboratoriais identificados',
                image: 'Encaminhamento.jpg — documento médico detectado',
              };

              return (
                <motion.div
                  key={fileId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-effect rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 size={16} className="text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white mb-1">{fileNames[fileId]}</p>
                      <span className="inline-block px-2 py-0.5 rounded-md text-xs bg-green-500/20 text-green-400">
                        Leitura pronta
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Submit button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={onSubmit}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          Gerar Case Intelligence
        </motion.button>

        <p className="text-center text-xs text-slate-500 mt-4">
          A análise completa leva aproximadamente 2-3 minutos
        </p>
      </div>
    </div>
  );
}
