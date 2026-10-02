import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  const [currentStage, setCurrentStage] = useState<StepStage>('front');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
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

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsCameraLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (confirmationTimerRef.current) clearTimeout(confirmationTimerRef.current);
    };
  }, [stopCamera]);

  // Connect stream immediately upon mounting to prevent null ref bug
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current && node.srcObject !== streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch((err) => console.warn('Video play interrupted:', err));
    }
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraLoading(true);
    stopCamera();

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera API is not supported in this browser.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setIsCameraOpen(true);
      setIsCameraLoading(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setIsCameraLoading(false);
      setIsCameraOpen(false);
      setCameraError(
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please allow permissions in browser settings or upload photos directly.'
          : 'Unable to access camera. Please check permissions or use the upload button.'
      );
    }
  };

  const toggleFacing = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    stopCamera();
    setTimeout(() => startCamera(), 120);
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
      if (!photos.mid) setTimeout(() => setCurrentStage('mid'), 800);
    } else if (currentStage === 'mid') {
      setPhotos((prev) => ({ ...prev, mid: dataUrl }));
      showConfirmation('mid');
      stopCamera();
      if (!photos.crown) setTimeout(() => setCurrentStage('crown'), 800);
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
        if (!photos.mid) setTimeout(() => setCurrentStage('mid'), 800);
      } else if (currentStage === 'mid') {
        setPhotos((prev) => ({ ...prev, mid: dataUrl }));
        showConfirmation('mid');
        if (!photos.crown) setTimeout(() => setCurrentStage('crown'), 800);
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
      if (!photos.mid) setTimeout(() => setCurrentStage('mid'), 800);
    } else if (currentStage === 'mid') {
      setPhotos((prev) => ({ ...prev, mid: sampleMid }));
      showConfirmation('mid');
      if (!photos.crown) setTimeout(() => setCurrentStage('crown'), 800);
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
      guide: 'Align forehead & anterior hairline within mask',
      photo: photos.front,
      rejection: validationResult?.front?.is_valid === false ? validationResult.front.rejection_reason : null,
    },
    mid: {
      num: '2 of 3',
      title: 'Mid / Top Scalp Photo',
      subtitle: 'Tilt your chin down slightly so the top of your head faces the camera.',
      guide: 'Frame mid-scalp and parting line within oval',
      photo: photos.mid,
      rejection: validationResult?.mid?.is_valid === false ? validationResult.mid.rejection_reason : null,
    },
    crown: {
      num: '3 of 3',
      title: 'Crown / Vertex Photo',
      subtitle: 'Position camera to view the crown swirl at the back-top of your head.',
      guide: 'Align crown vertex swirl in the circular target',
      photo: photos.crown,
      rejection: validationResult?.crown?.is_valid === false ? validationResult.crown.rejection_reason : null,
    },
  };

  const currentMeta = stageMeta[currentStage];
  const all3Ready = Boolean(photos.front && photos.mid && photos.crown);

  return (
    <div className="photo-step min-h-[calc(100dvh-54px)] flex flex-col justify-between bg-[#F6F9FA] font-['Outfit'] antialiased select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="photo-step-shell w-full max-w-xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex flex-col flex-1 justify-between min-h-0">
        <div className="photo-step-content-group flex flex-col flex-1 min-h-0">
        
        {/* Top Progress Tracker */}
        <div className="photo-step-tracker grid grid-cols-3 gap-1.5 sm:gap-2 shrink-0 mb-2">
          {[
            { id: 'front' as StepStage, label: '1. Front Hairline', shortLabel: '1. Front', isReady: Boolean(photos.front), isInvalid: validationResult?.front?.is_valid === false },
            { id: 'mid' as StepStage, label: '2. Mid Scalp', shortLabel: '2. Mid', isReady: Boolean(photos.mid), isInvalid: validationResult?.mid?.is_valid === false },
            { id: 'crown' as StepStage, label: '3. Crown Vertex', shortLabel: '3. Crown', isReady: Boolean(photos.crown), isInvalid: validationResult?.crown?.is_valid === false },
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
                className={`py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer border ${
                  item.isInvalid
                    ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] ring-2 ring-[#DC2626]/20'
                    : isCurrent
                    ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs'
                    : item.isReady
                    ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                    : 'bg-white text-[#94A3B8] border-[#E2E8F0]'
                }`}
              >
                <span className="hidden sm:inline truncate">{item.label}</span>
                <span className="inline sm:hidden truncate">{item.shortLabel}</span>
                {item.isInvalid ? (
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-[#DC2626]">✕</span>
                ) : item.isReady ? (
                  <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 stroke-[2.5] shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Focused Work Card */}
        <div className="photo-step-card bg-white border border-[#DDE5E8] rounded-2xl p-3 sm:p-5 shadow-[0_1px_4px_rgba(11,18,21,0.04)] flex flex-col justify-between flex-1 min-h-0">
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

          {currentMeta.rejection && (
            <div className="p-2.5 mb-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] font-semibold flex items-start gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong>Photo Verification Notice:</strong> {currentMeta.rejection}
              </div>
            </div>
          )}

          {cameraError && (
            <div className="p-2 mb-2 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626] font-medium flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] leading-tight">{cameraError}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
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

          {/* Media Frame */}
          <div className="photo-step-media relative w-full aspect-[4/3] sm:aspect-[16/10] min-h-[220px] max-h-[290px] sm:max-h-[350px] bg-[#0F172A] rounded-xl overflow-hidden flex items-center justify-center my-auto border border-[#CBD5E1]">
            {isCameraOpen ? (
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                <video
                  ref={setVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {/* CLINICAL HUMAN FACE MASK & ANGLE ALIGNMENT GUIDES */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 400 300"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <mask id="faceMaskHole">
                        <rect x="0" y="0" width="400" height="300" fill="white" />
                        {currentStage === 'front' && (
                          <ellipse cx="200" cy="155" rx="88" ry="118" fill="black" />
                        )}
                        {currentStage === 'mid' && (
                          <ellipse cx="200" cy="150" rx="100" ry="100" fill="black" />
                        )}
                        {currentStage === 'crown' && (
                          <circle cx="200" cy="150" r="95" fill="black" />
                        )}
                      </mask>
                    </defs>

                    <rect
                      x="0"
                      y="0"
                      width="400"
                      height="300"
                      fill="rgba(15, 23, 42, 0.52)"
                      mask="url(#faceMaskHole)"
                    />

                    {/* Corner Target Brackets */}
                    <g stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
                      <path d="M 25,45 L 25,25 L 45,25" />
                      <path d="M 375,45 L 375,25 L 355,25" />
                      <path d="M 25,255 L 25,275 L 45,275" />
                      <path d="M 375,255 L 375,275 L 355,275" />
                    </g>

                    {/* Stage 1: Front Hairline Face Mask */}
                    {currentStage === 'front' && (
                      <g>
                        <ellipse
                          cx="200"
                          cy="155"
                          rx="88"
                          ry="118"
                          fill="none"
                          stroke="#22C55E"
                          strokeWidth="2"
                          strokeDasharray="6 4"
                          opacity="0.9"
                        />
                        <path
                          d="M 125,108 C 160,78 240,78 275,108"
                          fill="none"
                          stroke="#16A34A"
                          strokeWidth="3.5"
                          strokeDasharray="5 3"
                        />
                        <line
                          x1="140"
                          y1="145"
                          x2="260"
                          y2="145"
                          stroke="#BBF7D0"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          opacity="0.7"
                        />
                        <path
                          d="M 200,158 L 196,182 L 204,182"
                          fill="none"
                          stroke="#BBF7D0"
                          strokeWidth="1.5"
                          opacity="0.6"
                        />
                        <path
                          d="M 172,250 C 185,268 215,268 228,250"
                          fill="none"
                          stroke="#BBF7D0"
                          strokeWidth="2"
                          opacity="0.7"
                        />
                      </g>
                    )}

                    {/* Stage 2: Mid Scalp Oval & Parting Guide */}
                    {currentStage === 'mid' && (
                      <g>
                        <ellipse
                          cx="200"
                          cy="150"
                          rx="100"
                          ry="100"
                          fill="none"
                          stroke="#22C55E"
                          strokeWidth="2"
                          strokeDasharray="6 4"
                          opacity="0.9"
                        />
                        <line
                          x1="200"
                          y1="60"
                          x2="200"
                          y2="240"
                          stroke="#16A34A"
                          strokeWidth="3"
                          strokeDasharray="6 4"
                        />
                        <line
                          x1="120"
                          y1="150"
                          x2="280"
                          y2="150"
                          stroke="#BBF7D0"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          opacity="0.6"
                        />
                      </g>
                    )}

                    {/* Stage 3: Crown Vertex Whorl Guide */}
                    {currentStage === 'crown' && (
                      <g>
                        <circle
                          cx="200"
                          cy="150"
                          r="95"
                          fill="none"
                          stroke="#22C55E"
                          strokeWidth="2"
                          strokeDasharray="6 4"
                          opacity="0.9"
                        />
                        <circle
                          cx="200"
                          cy="150"
                          r="55"
                          fill="none"
                          stroke="#16A34A"
                          strokeWidth="2.5"
                          strokeDasharray="5 3"
                        />
                        <circle
                          cx="200"
                          cy="150"
                          r="18"
                          fill="rgba(34, 197, 94, 0.2)"
                          stroke="#4ADE80"
                          strokeWidth="2"
                        />
                        <line x1="200" y1="35" x2="200" y2="265" stroke="#BBF7D0" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                        <line x1="85" y1="150" x2="315" y2="150" stroke="#BBF7D0" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                      </g>
                    )}
                  </svg>

                  <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none px-3">
                    <span className="text-[10px] sm:text-xs text-white font-bold bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-center shadow-lg">
                      {currentMeta.guide}
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 z-30 px-3">
                  <button
                    type="button"
                    onClick={toggleFacing}
                    className="p-2.5 rounded-full bg-white/25 text-white backdrop-blur-md cursor-pointer hover:bg-white/40 active:scale-95 transition-all shadow-md"
                    title="Flip camera"
                    aria-label="Flip camera"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="px-6 py-2.5 rounded-full bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-xl cursor-pointer ring-4 ring-white/40 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-2.5 rounded-full bg-white/25 text-white backdrop-blur-md cursor-pointer hover:bg-white/40 active:scale-95 transition-all shadow-md"
                    title="Close camera"
                    aria-label="Close camera"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : currentMeta.photo ? (
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
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Photo saved</span>
                  </div>
                )}

                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStage === 'front') setPhotos((p) => ({ ...p, front: null }));
                      if (currentStage === 'mid') setPhotos((p) => ({ ...p, mid: null }));
                      if (currentStage === 'crown') setPhotos((p) => ({ ...p, crown: null }));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1 cursor-pointer border border-white/20 active:scale-95 transition-all"
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
                      className="px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-sm"
                    >
                      <span>Next Angle</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-3 sm:p-4 text-center text-white gap-2 sm:gap-3 w-full">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center text-[#22C55E] shrink-0">
                  <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-tight">{currentMeta.title}</h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 max-w-xs mt-0.5 leading-snug">
                    Take a live guided photo or upload from your device:
                  </p>
                </div>

                <div className="flex flex-row items-center justify-center gap-2 sm:gap-2.5 w-full max-w-xs mt-1">
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={isCameraLoading}
                    className="flex-1 py-2.5 sm:py-3 px-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>{isCameraLoading ? 'Opening...' : 'Camera'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 sm:py-3 px-3 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs sm:text-sm font-bold border border-white/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>Upload</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={useSample}
                  className="text-[11px] text-[#86EFAC] hover:underline cursor-pointer pt-0.5"
                >
                  Or use sample calibrated photo
                </button>
              </div>
            )}
          </div>

        </div>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="sticky bottom-0 z-40 bg-white border-t border-[#DDE5E8] px-3 sm:px-6 py-2 shadow-xs shrink-0">
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
              className="inline-flex items-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer animate-pulse"
            >
              <span>Submit All 3 Photos</span>
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
              className={`inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
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
