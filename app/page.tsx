'use client';

import { useState } from 'react';
import Home from '@/components/screens/Home';
import ConsentGate from '@/components/screens/ConsentGate';
import Recording from '@/components/screens/Recording';
import CompleteCase from '@/components/screens/CompleteCase';
import AnalysisInProgress from '@/components/screens/AnalysisInProgress';
import CaseIntelligenceReport from '@/components/screens/CaseIntelligenceReport';
import type { RecordingResult } from '@/lib/useAudioRecorder';
import type { CaseData, TranscriptionResult } from '@/lib/types';

type Screen = 'home' | 'consent' | 'recording' | 'complete' | 'analysis' | 'report';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isDark, setIsDark] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recording, setRecording] = useState<RecordingResult | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleRecordingComplete = (result: RecordingResult) => {
    setRecording((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return result;
    });
    setRecordingDuration(result.durationSec);
    setCurrentScreen('complete');
  };

  const handleCaseSubmit = (data: CaseData) => {
    setCaseData(data);
    setCurrentScreen('analysis');
  };

  const handleAnalysisComplete = (result: TranscriptionResult) => {
    setTranscription(result);
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
      case 'consent':
        return (
          <ConsentGate
            onConsent={() => setCurrentScreen('recording')}
            onCancel={() => setCurrentScreen('home')}
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
            audioUrl={recording?.url}
          />
        );
      case 'analysis':
        return (
          <AnalysisInProgress
            recording={recording}
            onComplete={handleAnalysisComplete}
            onCancel={() => setCurrentScreen('complete')}
          />
        );
      case 'report':
        return (
          <CaseIntelligenceReport
            onBack={() => setCurrentScreen('home')}
            caseData={caseData}
            transcription={transcription}
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
