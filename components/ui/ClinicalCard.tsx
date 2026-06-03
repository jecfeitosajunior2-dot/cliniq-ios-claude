import { ReactNode } from 'react';

interface ClinicalCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function ClinicalCard({ children, onClick, className = '' }: ClinicalCardProps) {
  const baseClasses = 'bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-ios transition-all';
  const clickableClasses = onClick ? 'cursor-pointer active:scale-[0.98]' : '';

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${clickableClasses} ${className}`}
    >
      {children}
    </div>
  );
}
