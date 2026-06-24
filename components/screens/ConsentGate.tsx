'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  Mic,
  Lock,
  FileCheck2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface ConsentGateProps {
  /**
   * Disparado somente após consentimento explícito. O caso é criado no
   * servidor (com `consent_confirmed_at` persistido) antes da navegação
   * para a tela de gravação — por isso é assíncrono (item 4).
   */
  onConsent: () => void | Promise<void>;
  onCancel: () => void;
  busy?: boolean;
  error?: string | null;
}

export default function ConsentGate({ onConsent, onCancel, busy = false, error = null }: ConsentGateProps) {
  const [agreed, setAgreed] = useState(false);

  const points = [
    {
      icon: Mic,
      color: 'text-sky-400',
      bg: 'bg-sky-500/15',
      title: 'O microfone só liga após você concordar',
      detail: 'Nada é capturado antes do seu consentimento explícito nesta tela.',
    },
    {
      icon: Lock,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
      title: 'Áudio sensível de saúde',
      detail:
        'A gravação contém dados pessoais sensíveis (LGPD). Use apenas com o consentimento do paciente.',
    },
    {
      icon: FileCheck2,
      color: 'text-violet-400',
      bg: 'bg-violet-500/15',
      title: 'Suporte à decisão, não diagnóstico',
      detail:
        'O ClinIQ organiza e correlaciona informações. A decisão clínica é sempre do médico.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
          Voltar
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 px-6 flex flex-col">
        <div className="mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-500 to-teal-500 flex items-center justify-center mb-5">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold mb-2 leading-tight">
            Consentimento para gravar a consulta
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Antes de capturar o áudio, confirme que você tem autorização para
            gravar. O microfone permanece desligado até você concordar.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {points.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-2xl p-4"
              >
                <div
                  className={`w-9 h-9 rounded-xl ${p.bg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon size={18} className={p.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{p.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {p.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Aviso */}
        <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/90 leading-relaxed">
            Obtenha o consentimento do paciente conforme a LGPD antes de iniciar.
            Você é responsável pelo uso da gravação.
          </p>
        </div>

        {/* Checkbox de consentimento */}
        <button
          onClick={() => setAgreed((v) => !v)}
          className="flex items-start gap-3 text-left mb-6"
        >
          <span
            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
              agreed
                ? 'bg-sky-500 border-sky-500'
                : 'border-gray-600 bg-transparent'
            }`}
          >
            {agreed && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span className="text-sm text-gray-300 leading-relaxed">
            Confirmo que tenho o consentimento do paciente para gravar esta
            consulta e concordo com o uso do áudio para gerar o dossiê clínico.
            O médico confirma que informou o paciente sobre o uso do ClinIQ
            para registrar e organizar esta consulta.
          </span>
        </button>
      </div>

      {/* Footer fixo */}
      <div className="px-6 pb-10 pt-2 bg-gray-950">
        {error && (
          <p className="text-xs text-red-400 mb-3 text-center leading-relaxed">{error}</p>
        )}
        <button
          onClick={() => onConsent()}
          disabled={!agreed || busy}
          className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all ${
            agreed && !busy
              ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg active:scale-[0.98]'
              : 'bg-gray-800 text-gray-500'
          }`}
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Mic size={18} />
              Concordo e iniciar gravação
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
