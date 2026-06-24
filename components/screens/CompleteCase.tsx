'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Sparkles, Clock, Mic } from 'lucide-react';
import type { CaseData } from '@/lib/types';

interface CompleteCaseProps {
  onSubmit: (data: CaseData) => void;
  onBack: () => void;
  recordingDuration?: number;
  audioUrl?: string;
}

export default function CompleteCase({ onSubmit, onBack, recordingDuration = 0, audioUrl }: CompleteCaseProps) {
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | ''>('');
  const [specialty, setSpecialty] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [objective, setObjective] = useState('');

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

        {/* Anexos clinicos */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs flex items-center justify-center font-medium">2</span>
            Anexos clinicos
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-8">
            Anexos clínicos estarão disponíveis em uma próxima etapa.
          </p>
        </div>
      </div>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 max-w-md mx-auto">
        <button
          onClick={() =>
            onSubmit({ patientName, age, gender, specialty, chiefComplaint, objective })
          }
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
