'use client';

import { useState } from 'react';
import TabBar from '@/components/TabBar';
import Home from '@/components/screens/Home';
import NewCase from '@/components/screens/NewCase';
import AnalysisInProgress from '@/components/screens/AnalysisInProgress';
import CaseIntelligenceReport from '@/components/screens/CaseIntelligenceReport';

type Screen = 'home' | 'cases' | 'new' | 'patients' | 'reports' | 'newCase' | 'analysis' | 'report';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <Home onNavigate={setCurrentScreen} onToggleTheme={toggleTheme} isDark={isDark} />;
      case 'newCase':
        return <NewCase onNavigate={setCurrentScreen} onBack={() => setCurrentScreen('home')} />;
      case 'analysis':
        return <AnalysisInProgress onComplete={() => setCurrentScreen('report')} />;
      case 'report':
        return <CaseIntelligenceReport onBack={() => setCurrentScreen('home')} />;
      case 'new':
        return <NewCase onNavigate={setCurrentScreen} onBack={() => setCurrentScreen('home')} />;
      case 'cases':
      case 'patients':
      case 'reports':
        return (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Tela em desenvolvimento
              </p>
              <button
                onClick={() => setCurrentScreen('home')}
                className="mt-4 text-primary-600 dark:text-primary-400 text-sm font-medium"
              >
                Voltar para Home
              </button>
            </div>
          </div>
        );
      default:
        return <Home onNavigate={setCurrentScreen} onToggleTheme={toggleTheme} isDark={isDark} />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 relative pb-20">
      {renderScreen()}
      <TabBar 
        currentTab={currentScreen === 'home' || currentScreen === 'newCase' || currentScreen === 'analysis' || currentScreen === 'report' ? 'home' : currentScreen} 
        onTabChange={(tab) => setCurrentScreen(tab as Screen)} 
      />
    </div>
  );
}
