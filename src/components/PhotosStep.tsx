import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  X,
  FlipHorizontal,
  AlertCircle
} from 'lucide-react';
import { PhotoData, PhotoValidationResult } from '../types';
import { sound } from '../utils/audio';

// Default calibrated sample fallbacks
import sampleFront from '../assets/images/q3_frontals_hairline_1790578848301.jpg';
import sampleMid from '../assets/images/q3_mid_scalp_1790578883640.jpg';
import sampleCrown from '../assets/images/q3_crown_thinning_1790578871838.jpg';

interface PhotosStepProps {
  initialPhotos?: PhotoData;
  validationResult?: PhotoValidationResult | null;
  onComplete: (photos: PhotoData) => void;
  onBack: () => void;
}

type StepStage = 'front' | 'mid' | 'crown';

export const PhotosStep: React.FC<PhotosStepProps> = ({
  initialPhotos,
  validationResult,
  onComplete,
  onBack,
}) => {
  const [photos, setPhotos] = useState<PhotoData>(
    initialPhotos || {
      front: null,
      mid: null,
      crown: null,
    }
  );

  // Sequential progression: Front -> Mid -> Crown
  const [currentStage, setCurrentStage] = useState<StepStage>('front');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [confirmationStage, setConfirmationStage] = useState<StepStage | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const confirmationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showConfirmation = (stage: StepStage) => {
    if (confirmationTimerRef.current) clearTimeout(confirmationTimerRef.current);
    setConfirmationStage(stage);
    confirmationTimerRef.current = setTimeout(() => setConfirmationStage(null), 1000);
  };

  // If there was a validation rejection from AI, highlight the first invalid stage
  useEffect(() => {
    if (validationResult && !validationResult.all_valid) {
      if (!validationResult.front?.is_valid) {
        setCurrentStage('front');
      } else if (!validationResult.mid?.is_valid) {
        setCurrentStage('mid');
      } else if (!validationResult.crown?.is_valid) {
        setCurrentStage('crown');
      }
    }
  }, [validationResult]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (confirmationTimerRef.current) clearTimeout(confirmationTimerRef.current);
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      // ONLY show red warning when user explicitly tried to open camera and failed
      setCameraError('Camera not accessible. Please check browser permissions or upload a photo directly.');
      setIsCameraOpen(false);
    }
  };

  const toggleFacing = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 150);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    sound.playShutter();

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    if (currentStage === 'front') {
      setPhotos((prev) => ({ ...prev, front: dataUrl }));
      showConfirmation('front');
      stopCamera();
      if (!photos.mid) setTimeout(() => setCurrentStage('mid'), 1000);
    } else if (currentStage === 'mid') {
      setPhotos((prev) => ({ ...prev, mid: dataUrl }));
      showConfirmation('mid');
      stopCamera();
      if (!photos.crown) setTimeout(() => setCurrentStage('crown'), 1000);
    } else if (currentStage === 'crown') {
      setPhotos((prev) => ({ ...prev, crown: dataUrl }));
      showConfirmation('crown');
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playSelect();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (currentStage === 'front') {
        setPhotos((prev) => ({ ...prev, front: dataUrl }));
        showConfirmation('front');
        if (!photos.mid) setTimeout(() => setCurrentStage('mid'), 1000);
      } else if (currentStage === 'mid') {
        setPhotos((prev) => ({ ...prev, mid: dataUrl }));
        showConfirmation('mid');
        if (!photos.crown) setTimeout(() => setCurrentStage('crown'), 1000);
      } else if (currentStage === 'crown') {
        setPhotos((prev) => ({ ...prev, crown: dataUrl }));
        showConfirmation('crown');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const useSample = () => {
    sound.playSelect();
    if (currentStage === 'front') {
      setPhotos((prev) => ({ ...prev, front: sampleFront }));
      showConfirmation('front');
      if (!photos.mid) setTimeout(() => setCurrentStage('mid'), 1000);
    } else if (currentStage === 'mid') {
      setPhotos((prev) => ({ ...prev, mid: sampleMid }));
      showConfirmation('mid');
      if (!photos.crown) setTimeout(() => setCurrentStage('crown'), 1000);
    } else if (currentStage === 'crown') {
      setPhotos((prev) => ({ ...prev, crown: sampleCrown }));
      showConfirmation('crown');
    }
  };

  const stageMeta = {
    front: {
      num: '1 of 3',
      title: 'Front Hairline Photo',
      subtitle: 'Look straight at camera with forehead clear and anterior hairline visible.',
      guide: 'Frame forehead & hairline within oval',
      photo: photos.front,
      rejection: validationResult?.front?.is_valid === false ? validationResult.front.rejection_reason : null,
    },
    mid: {
      num: '2 of 3',
      title: 'Mid / Top Scalp Photo',
      subtitle: 'Tilt your chin down slightly so the top of your head faces the camera.',
      guide: 'Frame mid-scalp and parting line',
      photo: photos.mid,
      rejection: validationResult?.mid?.is_valid === false ? validationResult.mid.rejection_reason : null,
    },
    crown: {
      num: '3 of 3',
      title: 'Crown / Vertex Photo',
      subtitle: 'Position camera to view the crown swirl at the back-top of your head.',
      guide: 'Frame the vertex / crown whorl',
      photo: photos.crown,
      rejection: validationResult?.crown?.is_valid === false ? validationResult.crown.rejection_reason : null,
    },
  };

  const currentMeta = stageMeta[currentStage];
  const all3Ready = Boolean(photos.front && photos.mid && photos.crown);

  return (
    <div className="h-[calc(100dvh-54px)] flex flex-col justify-between bg-[#F6F9FA] font-['Outfit'] antialiased overflow-hidden select-none">
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Main Container */}
      <div className="w-full max-w-xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex flex-col flex-1 justify-between min-h-0 overflow-y-auto sm:overflow-hidden">
        
        {/* ONE Top Tracker: Highlights invalid angle in red if AI rejected */}
        <div className="grid grid-cols-3 gap-2 shrink-0 mb-1">
          {[
            {
              id: 'front' as StepStage,
              label: '1. Front Hairline',
              isReady: Boolean(photos.front),
              isInvalid: validationResult?.front?.is_valid === false,
            },
            {
              id: 'mid' as StepStage,
              label: '2. Mid Scalp',
              isReady: Boolean(photos.mid),
              isInvalid: validationResult?.mid?.is_valid === false,
            },
            {
              id: 'crown' as StepStage,
              label: '3. Crown Vertex',
              isReady: Boolean(photos.crown),
              isInvalid: validationResult?.crown?.is_valid === false,
            },
          ].map((item) => {
            const isCurrent = currentStage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  stopCamera();
                  setCurrentStage(item.id);
                  setCameraError(null);
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  item.isInvalid
                    ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] ring-2 ring-[#DC2626]/20'
                    : isCurrent
                    ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs'
                    : item.isReady
                    ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                    : 'bg-white text-[#94A3B8] border-[#E2E8F0]'
                }`}
              >
                <span className="truncate">{item.label}</span>
                {item.isInvalid ? (
                  <span className="text-[10px] font-extrabold text-[#DC2626]">✕ Retake</span>
                ) : item.isReady ? (
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Focused Work Card */}
        <div className="photo-step-card bg-white border border-[#DDE5E8] rounded-2xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(11,18,21,0.04)] flex flex-col justify-between flex-1 min-h-0">
          
          {/* Header Title */}
          <div className="text-center sm:text-left shrink-0 mb-1.5">
            <div className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">
              Photo {currentMeta.num}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#0B1215] leading-tight">
              {currentMeta.title}
            </h2>
            <p className="text-xs text-[#5A6B72] mt-0.5">
              {currentMeta.subtitle}
            </p>
          </div>

          {/* AI Rejection Banner for THIS specific angle (Patient only retakes invalid photo) */}
          {currentMeta.rejection && (
            <div className="p-2.5 mb-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] font-semibold flex items-start gap-2 shrink-0 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong>Photo Verification Notice:</strong> {currentMeta.rejection}
              </div>
            </div>
          )}

          {/* Camera Error Warning */}
          {cameraError && (
            <div className="p-2 mb-2 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626] font-medium flex items-center justify-between gap-2 shrink-0 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{cameraError}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={useSample}
                  className="text-[#16A34A] font-bold hover:underline text-[11px] cursor-pointer"
                >
                  Use Sample
                </button>
                <button
                  type="button"
                  onClick={() => setCameraError(null)}
                  className="text-[#DC2626] hover:opacity-80 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Main Media Capture Frame */}
          <div className="photo-step-media relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[340px] bg-[#0F172A] rounded-xl overflow-hidden flex items-center justify-center my-auto border border-[#CBD5E1]">
            
            {/* 1. Live Camera Mode */}
            {isCameraOpen ? (
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {/* Framing Guide */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-3">
                  <div className="w-[72%] sm:w-[55%] h-[82%] rounded-[45%] border-2 border-dashed border-[#22C55E] flex items-center justify-center shadow-[0_0_0_9999px_rgba(15,23,42,0.45)] relative">
                    <span className="absolute bottom-2.5 text-[10px] sm:text-xs text-[#BBF7D0] bg-black/60 px-2 py-0.5 rounded-full text-center">
                      {currentMeta.guide}
                    </span>
                  </div>
                </div>

                {/* Camera Action Buttons */}
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 z-20 px-3">
                  <button
                    type="button"
                    onClick={toggleFacing}
                    className="p-2.5 rounded-full bg-white/20 text-white backdrop-blur-md cursor-pointer hover:bg-white/30"
                    title="Flip camera"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="px-6 py-2.5 rounded-full bg-[#16A34A] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer ring-4 ring-white/30 hover:bg-[#15803D]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-2.5 rounded-full bg-white/20 text-white backdrop-blur-md cursor-pointer hover:bg-white/30"
                    title="Close camera"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : currentMeta.photo ? (
              /* 2. Photo Preview Mode */
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <img
                  src={currentMeta.photo}
                  alt={currentMeta.title}
                  className="w-full h-full object-contain"
                />

                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>{currentMeta.title} Ready</span>
                </div>
                {confirmationStage === currentStage && (
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-white/95 text-[#0B1215] text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#B91C1C]" />
                    <span>Photo uploaded</span>
                  </div>
                )}

                {/* Retake and Next Angle Buttons */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStage === 'front') setPhotos((p) => ({ ...p, front: null }));
                      if (currentStage === 'mid') setPhotos((p) => ({ ...p, mid: null }));
                      if (currentStage === 'crown') setPhotos((p) => ({ ...p, crown: null }));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1 cursor-pointer border border-white/20"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retake</span>
                  </button>
                  {currentStage !== 'crown' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentStage === 'front') setCurrentStage('mid');
                        else if (currentStage === 'mid') setCurrentStage('crown');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Next Angle</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* 3. Empty Slot */
              <div className="flex flex-col items-center justify-center p-4 text-center text-white gap-3.5">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#22C55E]">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">{currentMeta.title}</h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 max-w-xs mt-0.5">
                    Select an option below to provide your photo:
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full py-3 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs sm:text-sm font-bold border border-white/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={useSample}
                  className="text-[11px] text-[#86EFAC] hover:underline cursor-pointer"
                >
                  Or use sample calibrated photo
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="bg-white border-t border-[#DDE5E8] px-3 sm:px-6 py-2 shadow-xs shrink-0">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              sound.playStep();
              if (currentStage === 'crown') setCurrentStage('mid');
              else if (currentStage === 'mid') setCurrentStage('front');
              else onBack();
            }}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-[#5A6B72] hover:text-[#0B1215] hover:bg-[#F6F9FA] transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {all3Ready ? (
            <button
              type="button"
              onClick={() => {
                stopCamera();
                sound.playSuccess();
                onComplete(photos);
              }}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer animate-pulse"
            >
              <span>Submit All 3 Photos for AI Analysis</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (currentStage === 'front' && photos.front) setCurrentStage('mid');
                else if (currentStage === 'mid' && photos.mid) setCurrentStage('crown');
              }}
              disabled={
                (currentStage === 'front' && !photos.front) ||
                (currentStage === 'mid' && !photos.mid)
              }
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                ((currentStage === 'front' && photos.front) ||
                (currentStage === 'mid' && photos.mid))
                  ? 'bg-[#16A34A] text-white hover:bg-[#15803D]'
                  : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              <span>Next Angle</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
