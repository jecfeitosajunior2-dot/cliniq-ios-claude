'use client';

import { useState } from 'react';
import HomeCapture from '@/components/screens/HomeCapture';
import RecordingInProgress from '@/components/screens/RecordingInProgress';
import CompleteCase from '@/components/screens/CompleteCase';
import IntelligentAnalysis from '@/components/screens/IntelligentAnalysis';
import CaseIntelligenceReport from '@/components/screens/CaseIntelligenceReport';
import PDFPreview from '@/components/screens/PDFPreview';

type Screen = 'home' | 'recording' | 'complete' | 'analysis' | 'report' | 'pdf';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [recordingTime, setRecordingTime] = useState(0);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeCapture onStartRecording={() => setCurrentScreen('recording')} />;
      case 'recording':
        return <RecordingInProgress
          onEnd={() => setCurrentScreen('complete')}
          recordingTime={recordingTime}
          setRecordingTime={setRecordingTime}
        />;
      case 'complete':
        return <CompleteCase onSubmit={() => setCurrentScreen('analysis')} />;
      case 'analysis':
        return <IntelligentAnalysis onComplete={() => setCurrentScreen('report')} />;
      case 'report':
        return <CaseIntelligenceReport onViewPDF={() => setCurrentScreen('pdf')} onBack={() => setCurrentScreen('home')} />;
      case 'pdf':
        return <PDFPreview onBack={() => setCurrentScreen('report')} />;
      default:
        return <HomeCapture onStartRecording={() => setCurrentScreen('recording')} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderScreen()}
    </div>
  );
}
