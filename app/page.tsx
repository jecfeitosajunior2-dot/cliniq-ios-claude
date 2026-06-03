'use client';

import { useState } from 'react';
import Home from '@/components/screens/Home';
import Recording from '@/components/screens/Recording';
import CompleteCase from '@/components/screens/CompleteCase';
import AnalysisInProgress from '@/components/screens/AnalysisInProgress';
import CaseIntelligenceReport from '@/components/screens/CaseIntelligenceReport';

type Screen = 'home' | 'recording' | 'complete' | 'analysis' | 'report';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isDark, setIsDark] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleRecordingComplete = () => {
    setCurrentScreen('complete');
  };

  const handleCaseSubmit = () => {
    setCurrentScreen('analysis');
  };

  const handleAnalysisComplete = () => {
    setCurrentScreen('report');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <Home 
            onNavigate={(screen) => setCurrentScreen(screen as Screen)} 
            onToggleTheme={toggleTheme} 
            isDark={isDark} 
          />
        );
      case 'recording':
        return (
          <Recording 
            onComplete={handleRecordingComplete}
            onCancel={() => setCurrentScreen('home')}
          />
        );
      case 'complete':
        return (
          <CompleteCase 
            onSubmit={handleCaseSubmit}
            onBack={() => setCurrentScreen('home')}
            recordingDuration={recordingDuration}
          />
        );
      case 'analysis':
        return (
          <AnalysisInProgress 
            onComplete={handleAnalysisComplete}
          />
        );
      case 'report':
        return (
          <CaseIntelligenceReport 
            onBack={() => setCurrentScreen('home')}
          />
        );
      default:
        return (
          <Home 
            onNavigate={(screen) => setCurrentScreen(screen as Screen)} 
            onToggleTheme={toggleTheme} 
            isDark={isDark} 
          />
        );
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 relative">
      {renderScreen()}
    </div>
  );
}
