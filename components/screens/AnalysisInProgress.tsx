'use client';

import { useEffect, useState, useCallback } from 'react';
import { Check, FileText, Clock, Sparkles } from 'lucide-react';

interface AnalysisInProgressProps {
  onComplete: () => void;
}

interface Discovery {
  id: string;
  type: 'finding' | 'correlation' | 'alert' | 'gap' | 'insight';
  title: string;
  detail: string;
  source: string;
  position: { x: number; y: number };
}

const clinicalMessages = [
  'Reconstruindo a conversa clínica',
  'Identificando padrões relevantes',
  'Comparando informações entre fontes',
  'Correlacionando achados clínicos',
  'Construindo timeline clínica',
  'Detectando inconsistências',
  'Mapeando medicações ativas',
  'Preparando dossiê inteligente',
];

export default function AnalysisInProgress({ onComplete }: AnalysisInProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [showRings, setShowRings] = useState(false);
  const [particleCount, setParticleCount] = useState(8);

  const allDiscoveries: Omit<Discovery, 'position'>[] = [
    {
      id: 'd1',
      type: 'finding',
      title: 'Queixa principal identificada',
      detail: 'Cefaleia progressiva há 3 meses com piora matinal',
      source: 'Consulta 03:42',
    },
    {
      id: 'd2',
      type: 'finding',
      title: 'Histórico medicamentoso detectado',
      detail: 'Losartana 50mg/dia há 8 anos',
      source: 'Consulta 08:42',
    },
    {
      id: 'd3',
      type: 'finding',
      title: 'Exames laboratoriais reconhecidos',
      detail: 'Hemograma com tendência de queda da Hb',
      source: 'Hemograma 14/03',
    },
    {
      id: 'd4',
      type: 'correlation',
      title: 'Correlação encontrada',
      detail: 'Sintoma + achado de imagem sugerem investigação neurológica',
      source: 'Correlação ClinIQ',
    },
    {
      id: 'd5',
      type: 'gap',
      title: 'Lacuna clínica detectada',
      detail: 'RM sem contraste - caracterização incompleta',
      source: 'RM crânio p.2',
    },
    {
      id: 'd6',
      type: 'alert',
      title: 'Inconsistência encontrada',
      detail: 'Paciente nega medicação contínua, mas histórico menciona losartana',
      source: 'Consulta vs Histórico',
    },
    {
      id: 'd7',
      type: 'insight',
      title: 'Dossiê sendo estruturado',
      detail: '4 problemas, 11 achados, 5 perguntas identificadas',
      source: 'Síntese ClinIQ',
    },
  ];

  const getDiscoveryPosition = (index: number): { x: number; y: number } => {
    const positions = [
      { x: -120, y: -180 },
      { x: 120, y: -160 },
      { x: -140, y: -40 },
      { x: 140, y: -20 },
      { x: -110, y: 100 },
      { x: 120, y: 120 },
      { x: 0, y: 180 },
    ];
    return positions[index % positions.length];
  };

  const getDiscoveryStyle = (type: Discovery['type']) => {
    const styles = {
      finding: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', icon: 'bg-cyan-500/30' },
      correlation: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', icon: 'bg-purple-500/30' },
      alert: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'bg-amber-500/30' },
      gap: { bg: 'bg-rose-500/20', border: 'border-rose-500/30', text: 'text-rose-400', icon: 'bg-rose-500/30' },
      insight: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'bg-emerald-500/30' },
    };
    return styles[type];
  };

  const memoizedOnComplete = useCallback(onComplete, [onComplete]);

  // Progress and discoveries
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => memoizedOnComplete(), 1500);
          return 100;
        }
        return prev + 0.8;
      });
    }, 120);

    return () => clearInterval(progressInterval);
  }, [memoizedOnComplete]);

  // Message rotation
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % clinicalMessages.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, []);

  // Discovery appearances
  useEffect(() => {
    const thresholds = [10, 25, 40, 55, 70, 82, 95];
    const currentIndex = thresholds.filter(t => progress >= t).length;
    
    if (currentIndex > discoveries.length && currentIndex <= allDiscoveries.length) {
      const newDiscovery = {
        ...allDiscoveries[currentIndex - 1],
        position: getDiscoveryPosition(currentIndex - 1),
      };
      setDiscoveries(prev => [...prev, newDiscovery]);
      
      // Pulse effect on discovery
      setPulseIntensity(1.8);
      setTimeout(() => setPulseIntensity(1), 600);
      
      // Show rings on important discoveries
      if (newDiscovery.type === 'correlation' || newDiscovery.type === 'alert') {
        setShowRings(true);
        setParticleCount(16);
        setTimeout(() => {
          setShowRings(false);
          setParticleCount(8);
        }, 1200);
      }
    }
  }, [progress, discoveries.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-16 pb-4">
        <p className="text-cyan-400 text-xs font-medium tracking-widest uppercase text-center mb-2">
          ClinIQ Intelligence
        </p>
        <h1 className="text-2xl font-semibold text-white text-center mb-1">
          {clinicalMessages[currentMessage]}
        </h1>
        <p className="text-slate-400 text-sm text-center">
          {progress < 100 ? 'O ClinIQ está reconstruindo o caso clínico' : 'Dossiê pronto para revisão'}
        </p>
      </div>

      {/* Central Orb Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Floating Discoveries */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {discoveries.map((discovery, index) => {
            const style = getDiscoveryStyle(discovery.type);
            return (
              <div
                key={discovery.id}
                className={`absolute ${style.bg} ${style.border} border backdrop-blur-md rounded-xl p-3 max-w-[160px] animate-in fade-in zoom-in duration-700`}
                style={{
                  transform: `translate(${discovery.position.x}px, ${discovery.position.y}px)`,
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-6 h-6 rounded-lg ${style.icon} flex items-center justify-center flex-shrink-0`}>
                    <Check size={12} className={style.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${style.text}`}>
                      {discovery.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                      {discovery.detail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
                  <FileText size={8} className="text-slate-500" />
                  <span className="text-[9px] text-slate-500">{discovery.source}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* The Orb */}
        <div className="relative">
          {/* Outer rings - appear on important discoveries */}
          {showRings && (
            <>
              <div className="absolute inset-0 -m-16 rounded-full border border-cyan-500/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 -m-12 rounded-full border border-purple-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-0 -m-8 rounded-full border border-cyan-500/30 animate-ping" style={{ animationDuration: '1s' }} />
            </>
          )}

          {/* Orbital rings */}
          <div 
            className="absolute inset-0 -m-10 rounded-full border border-dashed border-cyan-500/10"
            style={{ animation: 'spin 20s linear infinite' }}
          />
          <div 
            className="absolute inset-0 -m-16 rounded-full border border-dashed border-purple-500/10"
            style={{ animation: 'spin 30s linear infinite reverse' }}
          />
          <div 
            className="absolute inset-0 -m-24 rounded-full border border-dashed border-cyan-500/5"
            style={{ animation: 'spin 40s linear infinite' }}
          />

          {/* Particles */}
          {[...Array(particleCount)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/60"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${(360 / particleCount) * i}deg) translateY(-${80 + Math.random() * 40}px)`,
                animation: `pulse ${2 + Math.random()}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}

          {/* Glow layers */}
          <div 
            className="absolute inset-0 -m-8 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-2xl transition-transform duration-500"
            style={{ transform: `scale(${pulseIntensity})` }}
          />
          <div 
            className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 blur-xl transition-transform duration-500"
            style={{ transform: `scale(${pulseIntensity * 0.9})` }}
          />

          {/* Main orb */}
          <div 
            className="relative w-40 h-40 rounded-full transition-transform duration-500"
            style={{ transform: `scale(${0.95 + pulseIntensity * 0.05})` }}
          >
            {/* Gradient background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-white/10" />
            
            {/* Inner glow */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
            
            {/* Waveform animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full"
                    style={{
                      height: `${20 + Math.sin((Date.now() / 200) + i) * 15}px`,
                      animation: `waveform ${0.5 + i * 0.1}s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Surface highlight */}
            <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-sm" />
            
            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="76"
                fill="none"
                stroke="rgba(6, 182, 212, 0.1)"
                strokeWidth="2"
              />
              <circle
                cx="80"
                cy="80"
                r="76"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 76}`}
                strokeDashoffset={`${2 * Math.PI * 76 * (1 - progress / 100)}`}
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Progress text */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="text-3xl font-light text-white tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="relative z-10 px-6 pb-10 pt-4">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-xs text-slate-400">
              {discoveries.length} descobertas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-purple-400" />
            <span className="text-xs text-slate-400">
              Inteligência ativa
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-slate-500" />
            <span className="text-xs text-slate-400">
              ~{Math.max(1, Math.round((100 - progress) / 10))}min
            </span>
          </div>
        </div>

        {/* Completion Message */}
        {progress >= 100 && (
          <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Check size={20} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Caso reconstruído
                </h4>
                <p className="text-xs text-slate-400">
                  Abrindo dossiê clínico...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes waveform {
          0% { height: 15px; }
          100% { height: 35px; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: rotate(var(--rotation)) translateY(var(--distance)) scale(1); }
          50% { opacity: 1; transform: rotate(var(--rotation)) translateY(var(--distance)) scale(1.5); }
        }
      `}</style>
    </div>
  );
}
