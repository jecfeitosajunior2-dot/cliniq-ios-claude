'use client';

import { useCallback, useEffect, useState } from 'react';
import Home from '@/components/screens/Home';
import ConsentGate from '@/components/screens/ConsentGate';
import Recording from '@/components/screens/Recording';
import CompleteCase from '@/components/screens/CompleteCase';
import AnalysisInProgress from '@/components/screens/AnalysisInProgress';
import CaseIntelligenceReport from '@/components/screens/CaseIntelligenceReport';
import Login from '@/components/screens/Login';
import AllCases from '@/components/screens/AllCases';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  listCases,
  getCase,
  createDraftCase,
  updateCaseData,
  relativeTime,
  initialsFrom,
  type CaseSummary,
} from '@/lib/cases';
import type { RecordingResult } from '@/lib/useAudioRecorder';
import type { CaseData, CaseIntelligence, TranscriptionResult } from '@/lib/types';

type Screen =
  | 'home'
  | 'consent'
  | 'recording'
  | 'complete'
  | 'analysis'
  | 'report'
  | 'allcases';

type AuthStatus = 'loading' | 'authed' | 'anon';

export default function App() {
  const supabaseOn = isSupabaseConfigured();

  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isDark, setIsDark] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recording, setRecording] = useState<RecordingResult | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [intelligence, setIntelligence] = useState<CaseIntelligence | null>(null);

  const [authStatus, setAuthStatus] = useState<AuthStatus>(supabaseOn ? 'loading' : 'anon');
  const [doctorName, setDoctorName] = useState('');
  const [recentCases, setRecentCases] = useState<CaseSummary[]>([]);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  // --- Sessão (só quando há backend) ---
  useEffect(() => {
    if (!supabaseOn) return;
    const supabase = getSupabase();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      setAuthStatus(user ? 'authed' : 'anon');
      setDoctorName((user?.user_metadata?.full_name as string) ?? '');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setAuthStatus(user ? 'authed' : 'anon');
      setDoctorName((user?.user_metadata?.full_name as string) ?? '');
    });
    return () => sub.subscription.unsubscribe();
  }, [supabaseOn]);

  // --- Carrega casos reais quando autenticado ---
  const reloadCases = useCallback(async () => {
    if (!supabaseOn) {
      setRecentCases([]);
      return;
    }
    const data = await listCases(20);
    setRecentCases(data);
  }, [supabaseOn]);

  useEffect(() => {
    if (authStatus === 'authed') reloadCases();
  }, [authStatus, reloadCases]);

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

  const handleCaseSubmit = async (data: CaseData) => {
    setCaseData(data);
    if (caseId) {
      await updateCaseData(caseId, data);
    }
    setCurrentScreen('analysis');
  };

  const handleAnalysisComplete = (result: TranscriptionResult, intel: CaseIntelligence) => {
    setTranscription(result);
    setIntelligence(intel);
    setCurrentScreen('report');
    reloadCases();
  };

  const handleConsent = async () => {
    setConsentBusy(true);
    setConsentError(null);
    const result = await createDraftCase();
    setConsentBusy(false);
    if ('error' in result) {
      setConsentError(result.error);
      return;
    }
    setCaseId(result.id);
    setCurrentScreen('recording');
  };

  const openCase = async (id: string) => {
    if (!supabaseOn) return;
    const full = await getCase(id);
    if (full) {
      setCaseData(full.caseData);
      setTranscription(full.transcription);
      setIntelligence(full.intelligence);
      setCurrentScreen('report');
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    await supabase?.auth.signOut();
    setCurrentScreen('home');
  };

  // --- Gate de autenticação ---
  if (supabaseOn && authStatus === 'loading') {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (supabaseOn && authStatus === 'anon') {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-950 relative">
        <Login onAuthenticated={() => setAuthStatus('authed')} />
      </div>
    );
  }

  const homeCases = recentCases.slice(0, 3).map((c) => ({
    id: c.id,
    initials: c.patientInitials || initialsFrom(c.patientName),
    age: c.age,
    specialty: c.specialty || 'Consulta',
    date: relativeTime(c.createdAt),
    status: c.findingsCount > 0 ? 'ready' : 'pending',
  }));

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <Home
            onNavigate={(screen) => setCurrentScreen(screen as Screen)}
            onToggleTheme={toggleTheme}
            isDark={isDark}
            doctorName={doctorName}
            recentCases={homeCases}
            onOpenCase={openCase}
            onViewAll={() => setCurrentScreen('allcases')}
            onSignOut={supabaseOn ? signOut : undefined}
          />
        );
      case 'consent':
        return (
          <ConsentGate
            onConsent={handleConsent}
            onCancel={() => setCurrentScreen('home')}
            busy={consentBusy}
            error={consentError}
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
        return caseId ? (
          <AnalysisInProgress
            caseId={caseId}
            recording={recording}
            onComplete={handleAnalysisComplete}
            onCancel={() => setCurrentScreen('complete')}
          />
        ) : null;
      case 'report':
        return (
          <CaseIntelligenceReport
            onBack={() => setCurrentScreen('home')}
            caseData={caseData}
            transcription={transcription}
            intelligence={intelligence}
          />
        );
      case 'allcases':
        return (
          <AllCases onBack={() => setCurrentScreen('home')} onOpenCase={openCase} />
        );
      default:
        return (
          <Home
            onNavigate={(screen) => setCurrentScreen(screen as Screen)}
            onToggleTheme={toggleTheme}
            isDark={isDark}
            doctorName={doctorName}
            recentCases={homeCases}
            onOpenCase={openCase}
            onViewAll={() => setCurrentScreen('allcases')}
            onSignOut={supabaseOn ? signOut : undefined}
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
