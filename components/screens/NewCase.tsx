'use client';

import { ChevronLeft, Mic, FileText, Image, FlaskConical, Check } from 'lucide-react';
import { useState } from 'react';

interface NewCaseProps {
  onNavigate: (screen: string) => void;
  onBack: () => void;
}

export default function NewCase({ onNavigate, onBack }: NewCaseProps) {
  const [selectedObjective, setSelectedObjective] = useState('relatorio-completo');
  const [uploadedFiles, setUploadedFiles] = useState<{ type: string; name: string; status: string }[]>([]);

  const objectives = [
    { id: 'relatorio-completo', label: 'Relatório Premium Completo', description: 'Dossiê completo com todas as seções' },
    { id: 'revisao-exames', label: 'Revisão de Exames', description: 'Análise focada em laudos e resultados' },
    { id: 'segunda-opiniao', label: 'Segunda Opinião', description: 'Visão complementar do caso' },
    { id: 'carta-especialista', label: 'Carta para Especialista', description: 'Encaminhamento estruturado' },
    { id: 'resumo-tecnico', label: 'Resumo Técnico', description: 'Síntese executiva do caso' },
  ];

  const uploadCategories = [
    {
      id: 'audio',
      icon: Mic,
      label: 'Áudio',
      description: 'Gravar consulta ou enviar arquivo',
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    },
    {
      id: 'pdfs',
      icon: FileText,
      label: 'PDFs',
      description: 'Laudos, cartas, prontuários',
      color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    },
    {
      id: 'exams',
      icon: FlaskConical,
      label: 'Exames',
      description: 'Laboratório, imagem, relatórios',
      color: 'bg-[--color-clinical-teal]/10 dark:bg-[--color-clinical-teal]/20 text-[--color-clinical-teal]',
    },
    {
      id: 'images',
      icon: Image,
      label: 'Imagens',
      description: 'Fotos de exames, prints',
      color: 'bg-[--color-clinical-green]/10 dark:bg-[--color-clinical-green]/20 text-[--color-clinical-green]',
    },
  ];

  const handleUpload = (type: string) => {
    const mockFiles: { [key: string]: { name: string; status: string } } = {
      audio: { name: 'Áudio recebido — 18min32s — qualidade boa', status: 'compreendido' },
      pdfs: { name: 'RM crânio.pdf — 3 páginas — laudo de imagem detectado', status: 'analisável' },
      exams: { name: 'Hemograma.jpg — valores laboratoriais identificados', status: 'pronto' },
      images: { name: 'Encaminhamento.jpg — documento médico detectado', status: 'compreendido' },
    };

    setUploadedFiles([...uploadedFiles, { type, ...mockFiles[type] }]);
  };

  const canGenerate = uploadedFiles.length > 0;

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
            >
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Novo Caso
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-6 mt-6">
        {/* Patient Info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-ios">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Informações do Paciente
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">
                Paciente ou iniciais
              </label>
              <input
                type="text"
                placeholder="Ex: M.S. ou Maria Silva"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Idade
                </label>
                <input
                  type="number"
                  placeholder="62"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Sexo
                </label>
                <select className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>Feminino</option>
                  <option>Masculino</option>
                  <option>Outro</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">
                Especialidade
              </label>
              <input
                type="text"
                placeholder="Ex: Neurologia"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Objective */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Objetivo do Caso
          </h3>
          <div className="space-y-2">
            {objectives.map((objective) => (
              <button
                key={objective.id}
                onClick={() => setSelectedObjective(objective.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedObjective === objective.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {objective.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {objective.description}
                    </div>
                  </div>
                  {selectedObjective === objective.id && (
                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center ml-3">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Upload Categories */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Documentos e Materiais
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {uploadCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleUpload(category.id)}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-left transition-all active:scale-95"
                >
                  <div className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center mb-3`}>
                    <Icon size={24} />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {category.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Uploaded Files Status */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-ios"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[--color-clinical-green]/10 dark:bg-[--color-clinical-green]/20 flex items-center justify-center">
                    <Check size={16} className="text-[--color-clinical-green]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {file.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[--color-clinical-green]/10 dark:bg-[--color-clinical-green]/20 text-[--color-clinical-green]">
                        {file.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={() => onNavigate('analysis')}
          disabled={!canGenerate}
          className={`w-full py-4 rounded-xl font-semibold transition-all ${
            canGenerate
              ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-ios-lg active:scale-[0.98]'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          Gerar Case Intelligence
        </button>
      </div>
    </div>
  );
}
