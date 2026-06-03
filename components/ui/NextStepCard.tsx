import { Search, CheckCircle2, MessageSquare, Calendar, LucideIcon } from 'lucide-react';

interface NextStepCardProps {
  category: string;
  steps: string[];
}

export default function NextStepCard({ category, steps }: NextStepCardProps) {
  const categoryConfig: { [key: string]: { icon: LucideIcon; color: string; bg: string } } = {
    'Investigar': {
      icon: Search,
      color: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
    },
    'Confirmar': {
      icon: CheckCircle2,
      color: 'text-[--color-clinical-teal]',
      bg: 'bg-[--color-clinical-teal]/10 dark:bg-[--color-clinical-teal]/20',
    },
    'Orientar': {
      icon: MessageSquare,
      color: 'text-[--color-clinical-amber]',
      bg: 'bg-[--color-clinical-amber]/10 dark:bg-[--color-clinical-amber]/20',
    },
    'Acompanhar': {
      icon: Calendar,
      color: 'text-[--color-clinical-green]',
      bg: 'bg-[--color-clinical-green]/10 dark:bg-[--color-clinical-green]/20',
    },
  };

  const config = categoryConfig[category] || categoryConfig['Investigar'];
  const Icon = config.icon;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-ios">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}>
          <Icon size={20} className={config.color} />
        </div>
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          {category}
        </h4>
      </div>

      <ul className="space-y-2">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 mt-2 flex-shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
              {step}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
