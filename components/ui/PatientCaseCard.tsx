import { ChevronRight, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PatientCaseCardProps {
  initials: string;
  age: number;
  gender: string;
  specialty: string;
  type: string;
  activeProblems: number;
  status: 'pending' | 'ready' | 'completed';
  date: string;
  onClick?: () => void;
}

export default function PatientCaseCard({
  initials,
  age,
  gender,
  specialty,
  type,
  activeProblems,
  status,
  date,
  onClick
}: PatientCaseCardProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-[--color-clinical-amber]',
      bg: 'bg-[--color-clinical-amber]/10 dark:bg-[--color-clinical-amber]/20',
      label: 'Pendente'
    },
    ready: {
      icon: CheckCircle2,
      color: 'text-[--color-clinical-green]',
      bg: 'bg-[--color-clinical-green]/10 dark:bg-[--color-clinical-green]/20',
      label: 'PDF pronto'
    },
    completed: {
      icon: CheckCircle2,
      color: 'text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-800',
      label: 'Concluído'
    }
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-ios cursor-pointer transition-all active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Patient Info */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {age} anos
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-600">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {gender === 'F' ? 'Feminino' : 'Masculino'}
                </span>
              </div>
            </div>
          </div>

          {/* Case Details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300">
                {specialty}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {type}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <AlertCircle size={14} className="text-[--color-clinical-amber]" />
              <span>{activeProblems} problemas ativos</span>
            </div>

            <div className="flex items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md ${statusConfig[status].bg}`}>
                <StatusIcon size={12} className={statusConfig[status].color} />
                <span className={`text-xs font-medium ${statusConfig[status].color}`}>
                  {statusConfig[status].label}
                </span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-600">•</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{date}</span>
            </div>
          </div>
        </div>

        <ChevronRight size={20} className="text-gray-400 dark:text-gray-600 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}
