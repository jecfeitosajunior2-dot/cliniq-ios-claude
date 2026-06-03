'use client';

import { ChevronLeft, Mic, FileText, Image, FlaskConical, Check, Sparkles, Brain, Upload, X, FileAudio, FileImage, TestTube } from 'lucide-react';
import { useState, useCallback } from 'react';

interface NewCaseProps {
  onNavigate: (screen: string) => void;
  onBack: () => void;
}

interface DetectedFile {
  id: string;
  type: 'audio' | 'pdf' | 'exam' | 'image';
  name: string;
  detections: string[];
  status: 'analyzing' | 'ready';
  meta?: string;
}

export default function NewCase({ onNavigate, onBack }: NewCaseProps) {
  const [files, setFiles] = useState<DetectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const detectFileType = (fileName: string): DetectedFile['type'] => {
    const ext = fileName.toLowerCase().split('.').pop();
    if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext || '')) return 'audio';
    if (['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext || '')) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'exam';
  };

  const generateDetections = (type: DetectedFile['type']): { detections: string[]; meta: string } => {
    const detectionMaps = {
      audio: {
        detections: [
          'Consulta clínica identificada',
          'Múltiplos interlocutores detectados',
          'Qualidade de áudio excelente',
          'Pronto para transcrição inteligente',
        ],
        meta: 'Duração estimada: 18min',
      },
      pdf: {
        detections: [
          'Laudo de imagem detectado',
          'Ressonância magnética de crânio',
          '3 páginas analisáveis',
          'Achados estruturados identificados',
        ],
        meta: 'Documento médico',
      },
      exam: {
        detections: [
          'Hemograma completo detectado',
          'Bioquímica identificada',
          'Valores fora da referência: 2',
          'Tendências temporais disponíveis',
        ],
        meta: 'Exame laboratorial',
      },
      image: {
        detections: [
          'Documento médico detectado',
          'Texto legível identificado',
          'Pronto para extração de dados',
          'Formato compatível',
        ],
        meta: 'Imagem clínica',
      },
    };
    return detectionMaps[type];
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const processFiles = (newFiles: File[]) => {
    newFiles.forEach((file, index) => {
      const type = detectFileType(file.name);
      const { detections, meta } = generateDetections(type);
      
      const newFile: DetectedFile = {
        id: `${Date.now()}-${index}`,
        type,
        name: file.name,
        detections: [],
        status: 'analyzing',
        meta,
      };

      setFiles(prev => [...prev, newFile]);

      // Simulate intelligent detection with staggered reveals
      detections.forEach((detection, i) => {
        setTimeout(() => {
          setFiles(prev => prev.map(f => 
            f.id === newFile.id 
              ? { ...f, detections: [...f.detections, detection] }
              : f
          ));
        }, 400 * (i + 1));
      });

      // Mark as ready after all detections
      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, status: 'ready' } : f
        ));
      }, 400 * (detections.length + 1));
    });
  };

  const simulateUpload = (type: DetectedFile['type']) => {
    const mockNames = {
      audio: 'consulta_paciente.m4a',
      pdf: 'rm_cranio_laudo.pdf',
      exam: 'hemograma_completo.pdf',
      image: 'encaminhamento_foto.jpg',
    };
    
    const mockFile = new File([''], mockNames[type], { type: 'application/octet-stream' });
    processFiles([mockFile]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (type: DetectedFile['type']) => {
    const icons = {
      audio: FileAudio,
      pdf: FileText,
      exam: TestTube,
      image: FileImage,
    };
    return icons[type];
  };

  const getFileColor = (type: DetectedFile['type']) => {
    const colors = {
      audio: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
      pdf: 'text-red-500 bg-red-50 dark:bg-red-900/20',
      exam: 'text-[--color-clinical-teal] bg-[--color-clinical-teal]/10',
      image: 'text-[--color-clinical-green] bg-[--color-clinical-green]/10',
    };
    return colors[type];
  };

  const canGenerate = files.length > 0 && files.every(f => f.status === 'ready');

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
            >
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Alimentar Segundo Cérebro
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Envie materiais para análise inteligente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-6 mt-6">
        {/* Premium Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
            isDragging
              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 scale-[1.02]'
              : 'border-gray-300 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950'
          }`}
        >
          {/* Ambient glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-[--color-clinical-teal]/5 pointer-events-none" />
          
          <div className="relative p-8 flex flex-col items-center text-center">
            {/* Brain Icon with pulse */}
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-900/20 flex items-center justify-center">
                <Brain size={36} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[--color-clinical-green] flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Arraste arquivos aqui
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
              O ClinIQ identifica automaticamente o tipo de documento e extrai informações relevantes
            </p>

            {/* Quick upload buttons */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { type: 'audio' as const, icon: Mic, label: 'Áudio' },
                { type: 'pdf' as const, icon: FileText, label: 'PDF' },
                { type: 'exam' as const, icon: FlaskConical, label: 'Exame' },
                { type: 'image' as const, icon: Image, label: 'Imagem' },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => simulateUpload(type)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:border-primary-300 dark:hover:border-primary-600 active:scale-95"
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detected Files with Intelligence Feedback */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Materiais Compreendidos
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {files.filter(f => f.status === 'ready').length} de {files.length} prontos
              </span>
            </div>

            {files.map((file) => {
              const FileIcon = getFileIcon(file.type);
              const colorClass = getFileColor(file.type);
              
              return (
                <div
                  key={file.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-ios overflow-hidden"
                >
                  {/* File Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center`}>
                          <FileIcon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {file.meta}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                      >
                        <X size={16} className="text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Intelligence Detections */}
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-950/50">
                    <div className="space-y-2">
                      {file.detections.map((detection, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300"
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <div className="w-5 h-5 rounded-full bg-[--color-clinical-green]/10 dark:bg-[--color-clinical-green]/20 flex items-center justify-center flex-shrink-0">
                            <Check size={12} className="text-[--color-clinical-green]" />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {detection}
                          </span>
                        </div>
                      ))}
                      
                      {file.status === 'analyzing' && file.detections.length < 4 && (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Analisando...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Intelligence Callout */}
        {files.length > 0 && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Brain size={20} className="text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  O que acontece a seguir
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  O ClinIQ vai transcrever consultas, extrair achados de laudos, 
                  identificar medicações, construir a timeline clínica e 
                  correlacionar todos os dados em um dossiê completo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={() => onNavigate('analysis')}
          disabled={!canGenerate}
          className={`w-full py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
            canGenerate
              ? 'bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-500 dark:to-primary-400 text-white shadow-lg shadow-primary-500/25 active:scale-[0.98]'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          {canGenerate && <Sparkles size={18} />}
          Iniciar Análise Inteligente
        </button>
      </div>
    </div>
  );
}
