'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';

interface LoginProps {
  onAuthenticated: () => void;
}

type Mode = 'signin' | 'signup';

/** Traduz erros técnicos do Supabase Auth em mensagens compreensíveis ao médico. */
function humanizeAuthError(e: unknown): string {
  const raw = e instanceof Error ? e.message : '';
  const msg = raw.toLowerCase();
  if (msg.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'Já existe uma conta com este e-mail. Tente entrar.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }
  if (msg.includes('password') && (msg.includes('least') || msg.includes('short') || msg.includes('6'))) {
    return 'A senha precisa ter pelo menos 6 caracteres.';
  }
  if (msg.includes('load failed') || msg.includes('failed to fetch') || msg.includes('network')) {
    return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
  }
  return 'Não foi possível concluir. Tente novamente em instantes.';
}

export default function Login({ onAuthenticated }: LoginProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError('Backend não configurado.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw error;
        // Se a confirmação de e-mail estiver ligada, não há sessão imediata.
        if (!data.session) {
          setInfo('Conta criada. Confirme o e-mail (se solicitado) e entre.');
          setMode('signin');
          return;
        }
        onAuthenticated();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthenticated();
      }
    } catch (e: unknown) {
      setError(humanizeAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-sky-50 to-white dark:from-gray-950 dark:to-gray-950">
      {/* Marca */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-500 to-teal-500 shadow-lg flex items-center justify-center mb-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 bg-white/90 rounded-full"
                style={{ height: `${12 + Math.sin(i) * 8}px` }}
              />
            ))}
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">ClinIQ</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
          <Sparkles size={13} className="text-sky-500" />
          Inteligência clínica por consulta
        </p>
      </div>

      <form onSubmit={submit} className="w-full max-w-sm space-y-3">
        {mode === 'signup' && (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Nome</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. Maria Almeida"
              required
              className="mt-1 w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:border-sky-400"
            />
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@clinica.com"
            required
            autoComplete="email"
            className="mt-1 w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:border-sky-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="mt-1 w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:border-sky-400"
          />
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}
        {info && <p className="text-sm text-emerald-600">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {mode === 'signup' ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <button
        onClick={() => {
          setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
          setError(null);
          setInfo(null);
        }}
        className="mt-5 text-sm text-sky-600 dark:text-sky-400"
      >
        {mode === 'signin' ? 'Não tem conta? Criar agora' : 'Já tenho conta — entrar'}
      </button>

      <p className="mt-8 text-xs text-gray-400 text-center max-w-xs leading-relaxed">
        Dados de saúde são sensíveis. O ClinIQ trata cada consulta sob a LGPD, com
        acesso restrito ao médico responsável.
      </p>
    </div>
  );
}
