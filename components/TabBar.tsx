import { Home, FolderOpen, Plus, Users, FileText } from 'lucide-react';

interface TabBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabBar({ currentTab, onTabChange }: TabBarProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'cases', label: 'Casos', icon: FolderOpen },
    { id: 'new', label: 'Novo', icon: Plus },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'reports', label: 'Relatórios', icon: FileText },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const isNew = tab.id === 'new';

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-all ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              } ${isNew ? 'relative' : ''}`}
            >
              <div className={`relative ${isNew ? 'scale-110' : ''}`}>
                <Icon
                  size={isNew ? 26 : 24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isNew ? 'text-primary-600 dark:text-primary-400' : ''}
                />
                {isNew && (
                  <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 rounded-full -z-10 scale-150" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium ${
                  isActive ? 'opacity-100' : 'opacity-70'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
