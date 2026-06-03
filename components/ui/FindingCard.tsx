import { CheckCircle2, AlertCircle, Search } from 'lucide-react';

interface FindingCardProps {
  category: string;
  finding: string;
  source: string;
  status: 'OK' | 'Revisar' | 'Investigar' | 'Atenção';
}

export default function FindingCard({ category, finding, source, status }: FindingCardProps) {
  const statusConfig = {
    'OK': {
      icon: CheckCircle2,
      color: 'text-[--color-clinical-green]',
      bg: 'bg-[--color-clinical-green]/10 dark:bg-[--color-clinical-green]/20',
    },
    'Revisar': {
      icon: Search,
      color: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
    },
    'Investigar': {
      icon: Search,
      color: 'text-[--color-clinical-amber]',
      bg: 'bg-[--color-clinical-amber]/10 dark:bg-[--color-clinical-amber]/20',
    },
    'Atenção': {
      icon: AlertCircle,
      color: 'text-[--color-clinical-red]',
      bg: 'bg-[--color-clinical-red]/10 dark:bg-[--color-clinical-red]/20',
    },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-ios">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${statusConfig[status].bg}`}>
          <StatusIcon size={16} className={statusConfig[status].color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {category}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusConfig[status].bg} ${statusConfig[status].color}`}>
              {status}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {finding}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Fonte: {source}
          </p>
        </div>
      </div>
    </div>
  );
}
