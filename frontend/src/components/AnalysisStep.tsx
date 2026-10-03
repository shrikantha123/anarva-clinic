import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Aperture,
  Crosshair,
  Microscope,
  Activity,
  Dna,
  Stethoscope,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import {
  PhotoData,
  QuizAnswers,
  AnalysisResult,
  AnalyzeApiResponse,
  PhotoValidationResult,
} from '../types';
import { apiFetch } from '../lib/api';
import { sound } from '../utils/audio';

interface AnalysisStepProps {
  photos: PhotoData;
  answers: QuizAnswers;
  onAnalysisSuccess: (analysis: AnalysisResult) => void;
  onValidationFailure: (validation: PhotoValidationResult) => void;
  onBackToPhotos: () => void;
}

/** Maps the API payload onto the camelCase shape used by the report UI. */
function toAnalysisResult(payload: NonNullable<AnalyzeApiResponse['analysis']>): AnalysisResult {
  return {
    norwoodStage: payload.norwood_stage,
    stageName: payload.stage_name,
    stageDescription: payload.stage_description,
    overallScore: payload.overall_health_score,
    frontDensity: payload.front_density,
    midDensity: payload.mid_density,
    crownDensity: payload.crown_density,
    follicularHealth: payload.follicular_health_pct,
    dandruffLevel: payload.dandruff_index,
    oilinessLevel: payload.sebum_oiliness_index,
    flakingLevel: payload.flaking_level,
    rednessLevel: payload.redness_index,
    irritationLevel: payload.scalp_irritation_index,
    hairLossReasons: payload.hair_loss_reasons,
    scalpFindings: payload.scalp_findings,
    clinicalObservations: payload.clinical_observations,
    consultation: payload.consultation,
    recommendations: payload.next_steps,
    confidencePct: payload.overall_confidence_pct,
    limitations: payload.limitations,
    doctorTreatments: payload.doctor_treatments,
    doctorClinicalBrief: payload.doctor_clinical_brief,
  };
}

export const AnalysisStep: React.FC<AnalysisStepProps> = ({
  photos,
  answers,
  onAnalysisSuccess,
  onValidationFailure,
  onBackToPhotos,
}) => {
  const [progress, setProgress] = useState(5);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const stages = [
    {
      title: 'Photo Quality Check',
      detail: 'Verifying clear lighting and hair visibility...',
      icon: <Aperture className="w-4 h-4 text-[#0EA5E9]" />,
      tag: 'CHECKED',
    },
    {
      title: 'Front Hairline Analysis',
      detail: 'Checking temple corners and forehead hairline...',
      icon: <Crosshair className="w-4 h-4 text-[#F59E0B]" />,
      tag: 'CHECKED',
    },
    {
      title: 'Mid Scalp Density Scan',
      detail: 'Measuring hair thickness and coverage on top...',
      icon: <Microscope className="w-4 h-4 text-[#14B8A6]" />,
      tag: 'CHECKED',
    },
    {
      title: 'Crown Whorl Check',
      detail: 'Inspecting hair fullness at the back crown...',
      icon: <Activity className="w-4 h-4 text-[#EC4899]" />,
      tag: 'CHECKED',
    },
    {
      title: 'Hair Pattern Assessment',
      detail: 'Combining your quiz answers with photo scans...',
      icon: <Dna className="w-4 h-4 text-[#8B5CF6]" />,
      tag: 'CHECKED',
    },
    {
      title: 'Preparing Your Report',
      detail: 'Putting together your personalized hair summary...',
      icon: <Stethoscope className="w-4 h-4 text-[#16A34A]" />,
      tag: 'READY',
    },
  ];

  const retry = useCallback(() => {
    setErrorMessage(null);
    setProgress(5);
    setActiveStageIndex(0);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let apiCompleted = false;
    let pendingResult: AnalysisResult | null = null;

    // Measured, smooth progress matching realistic API latency
    // Advances ~1% every 120ms (total ~11 seconds to 92%), so user sees a steady, satisfying scan
    const interval = setInterval(() => {
      setProgress((prev) => {
        // If API finished, advance smoothly to 100%
        if (apiCompleted) {
          if (prev < 100) return prev + 5;
          return 100;
        }

        // Before API returns, advance steadily without rushing
        if (prev >= 92) return 92; // Gently wait at 92%
        const nextVal = prev + 1;
        const stageIdx = Math.min(
          Math.floor((nextVal / 100) * stages.length),
          stages.length - 1
        );
        setActiveStageIndex(stageIdx);
        return nextVal;
      });
    }, 120);

    // Call server Gemini API
    const runAnalysis = async () => {
      try {
        const response = await apiFetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photos,
            quizAnswers: answers,
          }),
        });

        const data: AnalyzeApiResponse = await response.json();
        if (!isMounted) return;

        if (!response.ok || !data.image_validation) {
          throw new Error(data.error || 'Analysis service error');
        }

        // The AI decides validity — the client never overrides it.
        if (!data.image_validation.all_valid) {
          apiCompleted = true;
          clearInterval(interval);
          sound.playStep();
          onValidationFailure(data.image_validation);
          return;
        }

        if (!data.analysis) {
          throw new Error('Analysis payload missing');
        }

        pendingResult = toAnalysisResult(data.analysis);
        apiCompleted = true;

        // Give a quick moment for progress bar to finish at 100%
        setTimeout(() => {
          if (isMounted && pendingResult) {
            setProgress(100);
            setActiveStageIndex(stages.length - 1);
            sound.playSuccess();
            setTimeout(() => {
              if (isMounted) onAnalysisSuccess(pendingResult!);
            }, 350);
          }
        }, 500);

      } catch {
        if (!isMounted) return;
        // On initial transient high-demand / 503 error, auto-retry once after 2.5s smoothly
        if (attempt === 0) {
          setTimeout(() => {
            if (isMounted) {
              retry();
            }
          }, 2500);
          return;
        }
        clearInterval(interval);
        setErrorMessage(
          'The AI model is experiencing high demand right now. Please click Retry below — your photos and answers are safely saved.'
        );
      }
    };

    runAnalysis();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [attempt]);

  return (
    <div className="h-[calc(100dvh-54px)] flex flex-col justify-center items-center bg-[#F8FAFC] font-['Outfit'] antialiased px-3 py-3 select-none overflow-hidden">
      <div className="w-full max-w-xl bg-white border border-[#DDE5E8] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(11,18,21,0.05)] flex flex-col justify-between my-auto gap-3.5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2.5">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#0B1215] tracking-tight flex items-center gap-1.5">
              <span>AI Hair & Scalp Analysis</span>
              <Sparkles className="w-4 h-4 text-[#16A34A]" />
            </h1>
            <p className="text-xs text-[#5A6B72]">
              Reviewing your 3 photos and quiz answers
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
            <span>Scanning Active</span>
          </div>
        </div>

        {/* Error Notification if any */}
        {errorMessage && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] font-semibold flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-start gap-2 flex-1">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DC2626] text-white font-bold cursor-pointer hover:bg-[#B91C1C] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={onBackToPhotos}
                className="px-3 py-1.5 rounded-lg border border-[#FECACA] bg-white text-[#DC2626] font-bold cursor-pointer hover:bg-[#FEF2F2] transition-colors"
              >
                Back to Photos
              </button>
            </div>
          </div>
        )}

        {/* 3 Photos with Real Laser Scanning HUD Animation */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Front Hairline', img: photos.front },
            { label: 'Mid Scalp', img: photos.mid },
            { label: 'Crown Vertex', img: photos.crown },
          ].map((item, idx) => (
            <div
              key={idx}
              className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#0F172A] border border-[#CBD5E1] shadow-xs flex items-center justify-center group"
            >
              {item.img && (
                <img src={item.img} alt={item.label} className="w-full h-full object-cover opacity-85" />
              )}

              {/* Glowing Laser Scan Beam */}
              {progress < 100 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#22C55E] to-transparent shadow-[0_0_12px_#22C55E] animate-[bounce_2s_infinite]" />
                  <div className="absolute inset-0 border border-[#22C55E]/30 m-2 rounded-lg pointer-events-none" />
                </div>
              )}

              {/* Photo Caption Tag */}
              <div className="absolute bottom-1 inset-x-1 py-0.5 px-1 bg-black/70 backdrop-blur-xs rounded text-[9px] sm:text-[10px] text-white flex items-center justify-between font-semibold">
                <span className="truncate">{item.label}</span>
                <span className="text-[#86EFAC] font-mono text-[8px] sm:text-[9px]">
                  {progress < 100 ? `${Math.min(100, progress)}%` : '✓ Ready'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar & Status (Smooth and steady) */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-bold text-[#0B1215]">
            <span className="text-[#5A6B72] truncate max-w-[280px]">
              {stages[activeStageIndex].detail}
            </span>
            <span className="text-[#16A34A] font-mono text-sm">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-[#EEF3F5] rounded-full overflow-hidden p-0.5 border border-[#E2E8F0]">
            <div
              className="h-full bg-gradient-to-r from-[#16A34A] via-[#22C55E] to-[#14B8A6] rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Clinical Stages Checklist with Simplified Clear Labels */}
        <div className="flex flex-col gap-1.5">
          {stages.map((stg, i) => {
            const isPast = activeStageIndex > i || progress === 100;
            const isCurrent = activeStageIndex === i && progress < 100;

            return (
              <div
                key={i}
                className={`py-1.5 px-3 rounded-lg border text-xs transition-all flex items-center justify-between gap-2 ${
                  isCurrent
                    ? 'bg-[#F0FDF4] border-[#86EFAC]'
                    : isPast
                    ? 'bg-white border-[#E2E8F0] text-[#0B1215]'
                    : 'bg-[#F8FAFC] border-transparent text-[#94A3B8]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="shrink-0">{stg.icon}</div>
                  <span className={`truncate text-xs ${isCurrent ? 'font-bold text-[#16A34A]' : 'font-medium'}`}>
                    {stg.title}
                  </span>
                </div>

                <div className="text-[10px] font-mono shrink-0">
                  {isPast && <span className="text-[#16A34A] font-bold">✓ {stg.tag}</span>}
                  {isCurrent && <span className="text-[#22C55E] font-semibold animate-pulse">CHECKING...</span>}
                  {!isPast && !isCurrent && <span className="text-[#CBD5E1]">QUEUED</span>}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
