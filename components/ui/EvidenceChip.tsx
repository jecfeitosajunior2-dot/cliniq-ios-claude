import { Mic, FileText, FlaskConical, Image } from 'lucide-react';

interface EvidenceChipProps {
  type: 'audio' | 'pdf' | 'exam' | 'image';
  label: string;
}

export default function EvidenceChip({ type, label }: EvidenceChipProps) {
  const config = {
    audio: {
      icon: Mic,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    pdf: {
      icon: FileText,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    exam: {
      icon: FlaskConical,
      color: 'text-[--color-clinical-teal]',
      bg: 'bg-[--color-clinical-teal]/10 dark:bg-[--color-clinical-teal]/20',
    },
    image: {
      icon: Image,
      color: 'text-[--color-clinical-green]',
      bg: 'bg-[--color-clinical-green]/10 dark:bg-[--color-clinical-green]/20',
    },
  };

  const Icon = config[type].icon;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${config[type].bg}`}>
      <Icon size={12} className={config[type].color} />
      <span className={`text-xs font-medium ${config[type].color}`}>
        {label}
      </span>
    </div>
  );
}
