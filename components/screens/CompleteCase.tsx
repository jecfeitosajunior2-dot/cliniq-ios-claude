'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, FlaskConical, Image, Upload, Check, Sparkles, X, Clock, Mic } from 'lucide-react';

interface CompleteCaseProps {
  onSubmit: () => void;
  onBack: () => void;
  recordingDuration?: number;
  audioUrl?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'pdf' | 'lab' | 'image' | 'audio';
  size: string;
  status: 'ready' | 'processing';
}

export default function CompleteCase({ onSubmit, onBack, recordingDuration = 0, audioUrl }: CompleteCaseProps) {
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | ''>('');
  const [specialty, setSpecialty] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [objective, setObjective] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const specialties = [
    'Clinica Geral', 'Cardiologia', 'Neurologia', 'Endocrinologia', 
    'Pneumologia', 'Gastroenterologia', 'Oncologia', 'Psiquiatria',
    'Geriatria', 'Reumatologia', 'Nefrologia', 'Outra'
  ];

  const objectives = [
    { id: 'consultation', label: 'Consulta padrao' },
    { id: 'second-opinion', label: 'Segunda opiniao' },
    { id: 'followup', label: 'Retorno / Acompanhamento' },
    { id: 'referral', label: 'Encaminhamento' },
  ];

  const handleFileUpload = (type: 'pdf' | 'lab' | 'image') => {
    const mockFiles: Record<string, { name: string; size: string }> = {
      pdf: { name: 'Laudo_RM_Cranio.pdf', size: '2.4 MB' },
      lab: { name: 'Hemograma_Completo.pdf', size: '156 KB' },
      image: { name: 'Radiografia_Torax.jpg', size: '1.8 MB' },
    };
    
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: mockFiles[type].name,
      type,
      size: mockFiles[type].size,
      status: 'processing'
    };
    
    setFiles(prev => [...prev, newFile]);
    
    setTimeout(() => {
      setFiles(prev => prev.map(f => 
        f.id === newFile.id ? { ...f, status: 'ready' } : f
      ));
    }, 1500);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const isFormValid = patientName && age && gender && specialty && chiefComplaint && objective;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sky-600 dark:text-sky-400"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">
              Completar Caso
            </h1>
            <div className="w-16" />
          </div>
        </div>
      </div>

      {/* Audio capturado */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
              <Mic size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Audio capturado com sucesso
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-emerald-600/70 dark:text-emerald-400/70">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatDuration(recordingDuration)}
                </span>
                <span>Pronto para transcricao</span>
              </div>
            </div>
          </div>

          {/* Player do audio real capturado */}
          {audioUrl && (
            <audio
              controls
              src={audioUrl}
              className="w-full mt-3 h-9"
            >
              Seu navegador nao suporta a reproducao de audio.
            </audio>
          )}
        </div>
      </div>

      {/* Formulario */}
      <div className="px-4 pt-6 space-y-6">
        {/* Dados do paciente */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 text-xs flex items-center justify-center font-medium">1</span>
            Identificacao do caso
          </h2>
          
          <div className="space-y-4">
            {/* Nome/Iniciais */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Paciente (nome ou iniciais)
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ex: M.S. ou Maria Silva"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Idade e Sexo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Idade
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ex: 62"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Sexo
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGender('M')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      gender === 'M'
                        ? 'bg-sky-500 text-white'
                        : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Masculino
                  </button>
                  <button
                    onClick={() => setGender('F')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      gender === 'F'
                        ? 'bg-sky-500 text-white'
                        : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Feminino
                  </button>
                </div>
              </div>
            </div>

            {/* Especialidade */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Especialidade
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
              >
                <option value="">Selecione a especialidade</option>
                {specialties.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Queixa principal */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Queixa principal
              </label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Ex: Cefaleia progressiva ha 3 meses"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Objetivo */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Objetivo do relatorio
              </label>
              <div className="grid grid-cols-2 gap-2">
                {objectives.map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => setObjective(obj.id)}
                    className={`px-4 py-3 rounded-xl text-sm transition-all ${
                      objective === obj.id
                        ? 'bg-sky-500 text-white font-medium'
                        : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {obj.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Documentos complementares */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs flex items-center justify-center font-medium">2</span>
            Adicionar contexto clinico
            <span className="text-xs font-normal text-gray-400">(opcional)</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 ml-8">
            PDFs, exames e imagens enriquecem a analise
          </p>

          {/* Botoes de upload */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleFileUpload('pdf')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all active:scale-[0.98]"
            >
              <FileText size={18} className="text-red-500" />
              PDF
            </button>
            <button
              onClick={() => handleFileUpload('lab')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all active:scale-[0.98]"
            >
              <FlaskConical size={18} className="text-emerald-500" />
              Exame
            </button>
            <button
              onClick={() => handleFileUpload('image')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all active:scale-[0.98]"
            >
              <Image size={18} className="text-sky-500" />
              Imagem
            </button>
          </div>

          {/* Lista de arquivos */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map(file => (
                <div
                  key={file.id}
                  className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    file.type === 'pdf' ? 'bg-red-50 dark:bg-red-900/20' :
                    file.type === 'lab' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                    'bg-sky-50 dark:bg-sky-900/20'
                  }`}>
                    {file.type === 'pdf' ? <FileText size={18} className="text-red-500" /> :
                     file.type === 'lab' ? <FlaskConical size={18} className="text-emerald-500" /> :
                     <Image size={18} className="text-sky-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{file.size}</p>
                  </div>
                  {file.status === 'processing' ? (
                    <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={16} className="text-emerald-500" />
                      <button onClick={() => removeFile(file.id)}>
                        <X size={16} className="text-gray-400" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 max-w-md mx-auto">
        <button
          onClick={onSubmit}
          disabled={!isFormValid}
          className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all ${
            isFormValid
              ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg active:scale-[0.98]'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
          }`}
        >
          <Sparkles size={18} />
          Gerar Case Intelligence
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
