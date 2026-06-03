import { AlertCircle, TrendingUp, Activity } from 'lucide-react';
import EvidenceChip from './EvidenceChip';

interface ProblemCardProps {
  title: string;
  priority: 'alta' | 'media' | 'baixa';
  status: string;
  description: string;
  evidence: Array<{ type: 'audio' | 'pdf' | 'exam' | 'image'; label: string }>;
}

export default function ProblemCard({ title, priority, status, description, evidence }: ProblemCardProps) {
  const priorityConfig = {
    alta: {
      icon: AlertCircle,
      color: 'text-[--color-clinical-red]',
      bg: 'bg-[--color-clinical-red]/10 dark:bg-[--color-clinical-red]/20',
      label: 'Prioridade alta',
    },
    media: {
      icon: Activity,
      color: 'text-[--color-clinical-amber]',
      bg: 'bg-[--color-clinical-amber]/10 dark:bg-[--color-clinical-amber]/20',
      label: 'Prioridade média',
    },
    baixa: {
      icon: TrendingUp,
      color: 'text-gray-500',
      bg: 'bg-gray-100 dark:bg-gray-800',
      label: 'Prioridade baixa',
    },
  };

  const PriorityIcon = priorityConfig[priority].icon;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-ios">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${priorityConfig[priority].bg}`}>
          <PriorityIcon size={20} className={priorityConfig[priority].color} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            {title}
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${priorityConfig[priority].bg} ${priorityConfig[priority].color}`}>
              {priorityConfig[priority].label}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {status}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
        {description}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 dark:text-gray-400">Evidências:</span>
        {evidence.map((ev, index) => (
          <EvidenceChip key={index} type={ev.type} label={ev.label} />
        ))}
      </div>
    </div>
  );
}
