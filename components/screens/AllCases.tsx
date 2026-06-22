'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, FileText, Loader2 } from 'lucide-react';
import { listCases, relativeTime, type CaseSummary } from '@/lib/cases';

interface AllCasesProps {
  onBack: () => void;
  onOpenCase: (id: string) => void;
}

export default function AllCases({ onBack, onOpenCase }: AllCasesProps) {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);

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
              <button
                key={c.id}
                onClick={() => onOpenCase(c.id)}
                className="w-full bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 flex items-center justify-between transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 min-w-0">
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
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    {relativeTime(c.createdAt)}
                  </div>
                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
