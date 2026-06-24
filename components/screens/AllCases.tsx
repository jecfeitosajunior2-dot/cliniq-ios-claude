'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, FileText, Loader2, Trash2, X } from 'lucide-react';
import { listCases, deleteCase, relativeTime, type CaseSummary } from '@/lib/cases';

interface AllCasesProps {
  onBack: () => void;
  onOpenCase: (id: string) => void;
}

export default function AllCases({ onBack, onOpenCase }: AllCasesProps) {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<CaseSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await listCases(200);
      if (active) {
        setCases(data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const result = await deleteCase(pendingDelete.id);
    setDeleting(false);
    setPendingDelete(null);
    if (result.status === 'deleted') {
      // Só some da lista quando o servidor confirma exclusão completa —
      // nunca remove visualmente um caso que ainda aguarda exclusão (item 5).
      setCases((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      setFeedback({ kind: 'success', text: 'Caso apagado.' });
    } else {
      setFeedback({
        kind: 'error',
        text:
          result.error ??
          'Não foi possível apagar o caso. Você pode tentar novamente — nada foi perdido.',
      });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Meus casos</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {loading ? 'Carregando…' : `${cases.length} consulta${cases.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      {/* Feedback de sucesso/erro (nunca exclusão silenciosa) */}
      {feedback && (
        <div
          className={`mx-5 mb-3 px-4 py-2.5 rounded-xl text-xs font-medium ${
            feedback.kind === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="flex-1 px-5 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center mb-4">
              <FileText size={24} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
              Nenhum caso ainda. Capture sua primeira consulta para vê-la aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {cases.map((c) => (
              <div
                key={c.id}
                className="w-full bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 flex items-center justify-between transition-all"
              >
                <button
                  onClick={() => onOpenCase(c.id)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {c.patientInitials}
                    </span>
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {c.patientInitials}
                      {c.age ? `, ${c.age} anos` : ''}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {c.specialty || 'Consulta'} · {c.findingsCount} achado
                      {c.findingsCount === 1 ? '' : 's'}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    {relativeTime(c.createdAt)}
                  </div>
                  <button
                    onClick={() => setPendingDelete(c)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    aria-label="Apagar caso"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button onClick={() => onOpenCase(c.id)} aria-label="Abrir caso">
                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      {pendingDelete && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-5 mb-6 sm:mb-0">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Apagar este caso?
              </h2>
              <button
                onClick={() => setPendingDelete(null)}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0"
              >
                <X size={14} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
              O caso de {pendingDelete.patientInitials}
              {pendingDelete.age ? `, ${pendingDelete.age} anos` : ''} e o áudio associado
              serão apagados permanentemente. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-red-500 text-white flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
