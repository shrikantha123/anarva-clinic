import React, { useState } from 'react';
import {
  LayoutDashboard,
  User,
  Activity,
  Scan,
  PieChart,
  Sparkles,
  ClipboardCheck,
  Calendar,
  HelpCircle,
  Printer,
  CloudDownload,
  ShieldCheck,
  Info,
  Maximize2,
  ZoomIn,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  Cpu,
  Dna,
  Wind,
  Layers,
  ShieldAlert,
  Microscope,
  Check,
  Stethoscope,
  Eye,
  AlertTriangle,
  X,
  RotateCcw
} from 'lucide-react';
import { UserInfo, PhotoData, AnalysisResult } from '../types';
import { apiFetch } from '../lib/api';
import { AnarvaLogo } from './AnarvaLogo';
import q3FrontalsImg from '../assets/images/q3_frontals_hairline_1790578848301.jpg';
import q3MidsImg from '../assets/images/q3_mid_scalp_1790578883640.jpg';
import q3CrownImg from '../assets/images/q3_crown_thinning_1790578871838.jpg';

interface ReportStepProps {
  userInfo: UserInfo;
  photos: PhotoData;
  analysis: AnalysisResult;
  saveError?: string | null;
  isSaving?: boolean;
  reportCreatedAt: string | null;
  onRetrySave?: () => void;
  onRestart: () => void;
}

export const ReportStep: React.FC<ReportStepProps> = ({
  userInfo,
  photos,
  analysis,
  saveError,
  isSaving = false,
  reportCreatedAt,
  onRetrySave,
  onRestart,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [zoomModal, setZoomModal] = useState<{ open: boolean; title: string; image: string | null }>({
    open: false,
    title: '',
    image: null,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState('overview');

  const localDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(localDate);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:30 AM - Morning');
  const [consultationMode, setConsultationMode] = useState('In-Clinic Visit (Kota Anarva Clinic)');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const handleConfirmAppointment = async () => {
    setIsBooking(true);
    setBookingError(null);
    try {
      const response = await apiFetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: userInfo.name,
          patient_phone: userInfo.phone,
          date: selectedDate,
          time_slot: selectedTimeSlot,
          type: consultationMode,
        }),
      });

      if (!response.ok) throw new Error('appointment_booking_failed');

      setModalOpen(false);
      showToast(`Appointment confirmed! Slot reserved for ${selectedDate}`);
    } catch {
      setBookingError('We could not confirm this appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handlePrint = () => {
    showToast('Preparing clinical PDF print view...');
    setTimeout(() => {
      window.print();
    }, 600);
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] font-['Plus_Jakarta_Sans',sans-serif] min-h-screen flex flex-col antialiased">
      <div className="flex flex-1 relative">
        {/* =========================================================================
            SIDEBAR — DESKTOP
            ========================================================================= */}
        <aside className="w-20 bg-white border-r border-[#EDF2F7] flex flex-col items-center py-6 sticky top-0 h-screen z-40 shrink-0 hidden lg:flex">
          <button
            type="button"
            className="mb-8 cursor-pointer"
            title="Anarva Clinic — start a new assessment"
            onClick={onRestart}
          >
            <AnarvaLogo size="sm" />
          </button>

          <nav className="flex flex-col gap-3 w-full items-center flex-1">
            {[
              { id: 'overview', icon: <LayoutDashboard className="w-5 h-5" />, title: 'Overview' },
              { id: 'patient', icon: <User className="w-5 h-5" />, title: 'Patient Details' },
              { id: 'hair-loss', icon: <Activity className="w-5 h-5" />, title: 'Hair Loss Stage' },
              { id: 'scalp-analysis', icon: <Scan className="w-5 h-5" />, title: 'Scalp Image Analysis' },
              { id: 'density-summary', icon: <PieChart className="w-5 h-5" />, title: 'Overall Density' },
              { id: 'ai-diagnosis', icon: <Sparkles className="w-5 h-5" />, title: 'AI Diagnosis' },
              { id: 'recommendations', icon: <ClipboardCheck className="w-5 h-5" />, title: 'What To Do Next' },
              { id: 'consultation', icon: <Calendar className="w-5 h-5" />, title: 'Consultation' },
            ].map((nav) => (
              <a
                key={nav.id}
                href={`#${nav.id}`}
                onClick={() => setActiveNav(nav.id)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${
                  activeNav === nav.id
                    ? 'bg-[#DCFCE7] text-[#15803D]'
                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                }`}
                title={nav.title}
              >
                {nav.icon}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-3 items-center">
            <button
              type="button"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
              title="Start New Assessment"
              onClick={onRestart}
            >
              <RotateCcw className="w-4 h-4 text-[#15803D]" />
            </button>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
              title="Clinic Support: 1800-ANARVA-CARE"
              onClick={() => showToast('Anarva Clinical Support Hotline: 1800-ANARVA-CARE')}
            >
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col w-full" id="overview">
          {/* =========================================================================
              1. REPORT ACTION BAR
              ========================================================================= */}
          <div className="bg-white border-b border-[#EDF2F7] px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md w-full">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-[#DCFCE7] border border-[#BBF7D0] px-3.5 py-1 rounded-full text-xs font-bold text-[#15803D]">
                <div className="w-5 h-5 rounded-full bg-[#15803D] text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
                <span>Assessment Complete</span>
              </div>
              <div className="hidden xs:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0]">
                {currentDate}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EDF2F7] text-[#475569] text-xs font-bold transition-all cursor-pointer border border-[#E2E8F0]"
                title="Download PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-[#15803D]/20 transition-all cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Appointment</span>
              </button>
            </div>
          </div>

          {/* Main Scrollable Content */}
          <main className="flex-1 overflow-y-auto w-full">
            <div className="max-w-5xl mx-auto p-4 sm:p-8 flex flex-col gap-8">
              {/* =========================================================================
                  2. CLINICAL SUMMARY BANNER
                  ========================================================================= */}
              <div className="bg-white border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#15803D] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                        Clinical AI Report
                      </span>
                      <span className="text-xs text-[#94A3B8]">
                        ID: {analysis.assessmentId || 'ANR-8821-26'}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                      Comprehensive Trichology & Scalp Analysis
                    </h1>
                    <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed max-w-2xl">
                      Automated photographic assessment validated by Anarva Clinic’s AI trichoscopy engine.
                      Follow-up clinical consultation is recommended for diagnostic confirmation.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-[#EDF2F7] pt-4 lg:pt-0 lg:pl-8 shrink-0">
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-extrabold text-[#15803D] font-mono">
                        {analysis.overallScore}
                        <span className="text-base text-[#94A3B8] font-normal">/100</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mt-0.5">
                        Scalp Health Score
                      </span>
                    </div>

                    <div className="h-10 w-px bg-[#EDF2F7]" />

                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-mono">
                        {analysis.confidencePct}%
                      </div>
                      <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block mt-0.5">
                        AI Confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* =========================================================================
                  3. PATIENT DETAILS CARD
                  ========================================================================= */}
              <section id="patient" className="bg-white border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#15803D]">
                      <User className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-bold text-[#0F172A]">Patient Profile</h2>
                  </div>
                  <span className="text-xs text-[#94A3B8]">Confidential Medical Record</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EDF2F7]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">Full Name</span>
                    <span className="text-xs sm:text-sm font-bold text-[#0F172A] mt-0.5 block truncate">
                      {userInfo.name || 'Anonymous Patient'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EDF2F7]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">Phone</span>
                    <span className="text-xs sm:text-sm font-bold text-[#0F172A] mt-0.5 block truncate">
                      {userInfo.phone || 'Not Provided'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EDF2F7]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">Gender</span>
                    <span className="text-xs sm:text-sm font-bold text-[#0F172A] mt-0.5 block">
                      {userInfo.gender || 'Not Specified'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EDF2F7]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">Location</span>
                    <span className="text-xs sm:text-sm font-bold text-[#0F172A] mt-0.5 block truncate">
                      {userInfo.address || 'India'}
                    </span>
                  </div>
                </div>
              </section>

              {/* =========================================================================
                  4. NORWOOD STAGE CARD & SCALE
                  ========================================================================= */}
              <section id="hair-loss" className="bg-white border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#15803D]">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#0F172A]">Norwood-Hamilton Classification</h2>
                      <p className="text-xs text-[#64748B]">Clinical standard scale for androgenetic alopecia</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] px-3 py-1 rounded-full text-xs font-bold text-[#DC2626] self-start sm:self-auto">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Stage {analysis.norwoodStage}: {analysis.stageName}</span>
                  </div>
                </div>

                {/* Norwood Visual Bar (Stages 1 through 7) */}
                <div className="mb-6">
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((stageNum) => {
                      const isCurrent = stageNum === analysis.norwoodStage;
                      const isPast = stageNum < analysis.norwoodStage;
                      return (
                        <div
                          key={stageNum}
                          className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                            isCurrent
                              ? 'border-[#15803D] bg-[#F0FDF4] shadow-xs'
                              : isPast
                              ? 'border-[#CBD5E1] bg-[#F8FAFC]'
                              : 'border-[#EDF2F7] bg-white opacity-60'
                          }`}
                        >
                          <span
                            className={`text-xs sm:text-sm font-extrabold font-mono ${
                              isCurrent ? 'text-[#15803D]' : isPast ? 'text-[#475569]' : 'text-[#94A3B8]'
                            }`}
                          >
                            {stageNum}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-[#64748B] mt-0.5 hidden sm:block">
                            Stage {stageNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#EDF2F7]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#15803D] mb-1">
                    Clinical Finding
                  </h3>
                  <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                    {analysis.stageDescription}
                  </p>
                </div>
              </section>

              {/* =========================================================================
                  5. SCALP IMAGE ANALYSIS (PHOTOGRAPHIC TRICHOSCOPY)
                  ========================================================================= */}
              <section id="scalp-analysis" className="bg-white border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#15803D]">
                      <Scan className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#0F172A]">Scalp Photographic Trichoscopy</h2>
                      <p className="text-xs text-[#64748B]">Macro examination across 3 standard clinical angles</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#15803D] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                    3 Images Evaluated
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      label: 'Frontal Hairline',
                      sub: 'Temporal recession & miniaturisation',
                      img: photos.front || q3FrontalsImg,
                      density: analysis.frontDensity,
                    },
                    {
                      label: 'Mid-Scalp Region',
                      sub: 'Part-width & diffuse thinning',
                      img: photos.mid || q3MidsImg,
                      density: analysis.midDensity,
                    },
                    {
                      label: 'Vertex / Crown',
                      sub: 'Whorl density & circular thinning',
                      img: photos.crown || q3CrownImg,
                      density: analysis.crownDensity,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="border border-[#EDF2F7] rounded-2xl overflow-hidden bg-white flex flex-col group hover:shadow-md transition-all"
                    >
                      <div className="relative aspect-[4/3] bg-[#0F172A] overflow-hidden">
                        <img
                          src={item.img}
                          alt={item.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => setZoomModal({ open: true, title: item.label, image: item.img })}
                          className="absolute bottom-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg backdrop-blur-xs transition-colors cursor-pointer"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-4 flex flex-col gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-[#0F172A]">{item.label}</h3>
                          <p className="text-[11px] text-[#64748B]">{item.sub}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-[#F1F5F9]">
                          <span className="text-[#64748B]">Estimated Density:</span>
                          <span className="font-extrabold font-mono text-[#15803D]">
                            {item.density} <span className="text-[10px] text-[#94A3B8]">/ 10</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* =========================================================================
                  6. DENSITY SUMMARY & OVERALL HEALTH SCORE
                  ========================================================================= */}
              <section id="density-summary" className="bg-white border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#15803D]">
                      <PieChart className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#0F172A]">Follicular Density & Scalp Health</h2>
                      <p className="text-xs text-[#64748B]">Multi-metric analysis across physiological indices</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Frontal Density', val: analysis.frontDensity, max: 10, unit: '/10' },
                    { label: 'Mid-Scalp Density', val: analysis.midDensity, max: 10, unit: '/10' },
                    { label: 'Crown Density', val: analysis.crownDensity, max: 10, unit: '/10' },
                    { label: 'Follicular Health', val: analysis.follicularHealth, max: 100, unit: '%' },
                    { label: 'Dandruff Level', val: analysis.dandruffLevel, max: 100, unit: '%' },
                    { label: 'Oiliness Level', val: analysis.oilinessLevel, max: 100, unit: '%' },
                    { label: 'Flaking Level', val: analysis.flakingLevel, max: 100, unit: '%' },
                    { label: 'Redness Level', val: analysis.rednessLevel, max: 100, unit: '%' },
                    { label: 'Irritation Level', val: analysis.irritationLevel, max: 100, unit: '%' },
                  ].map((metric) => {
                    const pct = metric.max === 10 ? (Number(metric.val) || 0) * 10 : (Number(metric.val) || 0);
                    const isFavorable = ['Frontal Density', 'Mid-Scalp Density', 'Crown Density', 'Follicular Health'].includes(metric.label);
                    const barColor = isFavorable
                      ? pct >= 70
                        ? 'bg-[#15803D]'
                        : pct >= 40
                        ? 'bg-[#D97706]'
                        : 'bg-[#DC2626]'
                      : pct <= 30
                      ? 'bg-[#15803D]'
                      : pct <= 60
                      ? 'bg-[#D97706]'
                      : 'bg-[#DC2626]';

                    return (
                      <div
                        key={metric.label}
                        className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#EDF2F7] flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-[#0F172A]">{metric.label}</span>
                          <span className="font-mono font-bold text-[#334155]">
                            {metric.val}
                            <span className="text-[10px] text-[#94A3B8] ml-0.5">{metric.unit}</span>
                          </span>
                        </div>
                        <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* =========================================================================
                  7. AI DIAGNOSIS & ATTRIBUTED REASONS (PIE/BREAKDOWN)
                  ========================================================================= */}
              <section id="ai-diagnosis" className="bg-white border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#15803D]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#0F172A]">AI Diagnosis & Causative Factors</h2>
                      <p className="text-xs text-[#64748B]">Etiological distribution modeled on your photo signs and quiz history</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Dynamically generated hair-loss reasons (always total 100%) */}
                  <div className="lg:col-span-6 flex flex-col gap-3.5">
                    {(analysis.hairLossReasons || []).map((item, idx) => (
                      <div
                        key={item.reason}
                        className={`p-4 rounded-xl border flex flex-col gap-2 ${
                          idx === 0 ? 'border-[#FECDD3] bg-[#FFF1F2] shadow-xs' : 'border-[#EDF2F7] bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3 text-sm font-bold text-[#0F172A]">
                          <div className={`flex items-start gap-2 min-w-0 ${idx === 0 ? 'text-[#E11D48]' : 'text-[#475569]'}`}>
                            <Dna className="w-4 h-4 shrink-0 mt-0.5" />
                            <span className="break-words">{item.reason}</span>
                          </div>
                          <span
                            className={`text-base font-extrabold font-mono shrink-0 ${
                              idx === 0 ? 'text-[#E11D48]' : 'text-[#475569]'
                            }`}
                          >
                            {item.percentage}%
                          </span>
                        </div>

                        <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              idx === 0 ? 'bg-gradient-to-r from-[#F43F5E] to-[#E11D48]' : 'bg-[#94A3B8]'
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>

                        <p className="text-xs text-[#64748B] leading-relaxed mt-1">
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Scalp findings & clinical observations */}
                  <div className="lg:col-span-6 flex flex-col gap-4">
                    <div className="p-4 bg-[#F8FAFC] border border-[#EDF2F7] rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Microscope className="w-4 h-4 text-[#15803D]" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                          Scalp Findings
                        </h3>
                      </div>

                      <div className="flex flex-col gap-2">
                        {(analysis.scalpFindings || []).length === 0 ? (
                          <p className="text-xs text-[#64748B] italic">
                            No active inflammatory scalp lesions detected in provided photos.
                          </p>
                        ) : (
                          (analysis.scalpFindings || []).map((finding) => (
                            <div
                              key={finding.condition}
                              className="p-3 bg-white rounded-xl border border-[#EDF2F7] flex flex-col gap-1"
                            >
                              <div className="flex justify-between items-center text-xs font-bold text-[#0F172A]">
                                <span className="capitalize">{finding.condition}</span>
                                <span className="text-[#DC2626] font-mono">{finding.severity_pct}% severity</span>
                              </div>
                              <p className="text-[11px] text-[#64748B] leading-relaxed">
                                {finding.observation}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {(analysis.clinicalObservations || []).length > 0 && (
                      <div className="p-4 bg-[#F8FAFC] border border-[#EDF2F7] rounded-2xl flex flex-col gap-2.5">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-[#15803D]" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                            Clinical Observations
                          </h3>
                        </div>
                        <ul className="flex flex-col gap-1.5">
                          {(analysis.clinicalObservations || []).map((observation) => (
                            <li key={observation} className="text-xs text-[#475569] flex items-start gap-2">
                              <span className="text-[#15803D] mt-1 font-bold">•</span>
                              <span className="leading-relaxed">{observation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* =========================================================================
                  8. WHAT TO DO NEXT (RECOMMENDATIONS)
                  ========================================================================= */}
              <section id="recommendations" className="bg-white border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#15803D]">
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#0F172A]">Recommended Next Steps</h2>
                      <p className="text-xs text-[#64748B]">Personalized action plan to stabilize and revitalize hair growth</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(analysis.recommendations || []).map((step, idx) => {
                    return (
                      <div
                        key={step.title}
                        className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#EDF2F7] flex flex-col gap-2 hover:border-[#BBF7D0] transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-[#15803D] text-white flex items-center justify-center text-xs font-extrabold shrink-0">
                            {idx + 1}
                          </div>
                          <h3 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-xs text-[#475569] leading-relaxed pl-8">
                          {step.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ====================================================================
                  9 & 10. CONSULTATION RECOMMENDATION & BOOK APPOINTMENT CTA
                  ==================================================================== */}
              <div id="consultation" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Consultation Recommendation Card: Low / Medium / High */}
                {(() => {
                  const consultData = analysis?.consultation || {
                    urgency: 'medium',
                    confidence_pct: 75,
                    reason: 'A medical trichology consultation is recommended to evaluate root causes and treatment plans.',
                    recommended_timeframe: 'Within 2-4 weeks'
                  };
                  const { urgency, confidence_pct: urgencyPct, reason: simpleDesc, recommended_timeframe } = consultData;
                  const level = urgency === 'high' ? 'High' : urgency === 'low' ? 'Low' : 'Medium';
                  const badgeClass =
                    urgency === 'high'
                      ? 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]'
                      : urgency === 'low'
                      ? 'text-[#15803D] bg-[#F0FDF4] border-[#BBF7D0]'
                      : 'text-[#D97706] bg-[#FEF3C7] border-[#FDE68A]';

                  return (
                    <div className="lg:col-span-5 bg-white border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex justify-between items-center gap-2 mb-3">
                          <h3 className="text-base font-bold text-[#0F172A]">
                            Doctor Consultation Recommendation
                          </h3>
                          <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-full ${badgeClass}`}>
                            {level} Urgency ({urgencyPct}%)
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mb-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#EDF2F7]">
                          <div className="w-12 h-12 rounded-xl bg-white border border-[#CBD5E1] flex flex-col items-center justify-center shrink-0">
                            <span className="text-sm font-extrabold text-[#0F172A]">{urgencyPct}%</span>
                            <span className="text-[9px] text-[#64748B] font-bold uppercase">Need</span>
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                              {level === 'High' ? 'Consultation Strongly Recommended' : level === 'Medium' ? 'Consultation Recommended Soon' : 'Routine Consultation Advised'}
                            </h4>
                            <p className="text-[11px] text-[#64748B]">{recommended_timeframe}</p>
                          </div>
                        </div>

                        <p className="text-xs text-[#475569] leading-relaxed">
                          {simpleDesc}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#94A3B8] pt-2 border-t border-[#F1F5F9]">
                        <Stethoscope className="w-4 h-4 text-[#15803D]" />
                        <span>Anarva Clinic doctors available in clinic & online</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Book Appointment CTA Banner */}
                <div className="lg:col-span-7 bg-gradient-to-br from-[#15803D] to-[#166534] text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-5 shadow-[0_10px_30px_-5px_rgba(21,128,61,0.3)] relative overflow-hidden">
                  <div className="absolute top-[-50px] right-[-50px] w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
                  <div className="relative z-10">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      Ready to discuss your results?
                    </h3>
                    <p className="text-xs sm:text-sm text-white/80 mt-1 leading-relaxed max-w-md">
                      Book a prioritized slot with Anarva Clinic’s hair restoration specialists to plan your personalized regimen.
                    </p>
                  </div>

                  <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="px-6 py-3.5 rounded-xl bg-white text-[#15803D] font-bold text-xs sm:text-sm shadow-lg hover:bg-[#F8FAFC] active:scale-[0.99] transition-all cursor-pointer text-center"
                    >
                      Book Doctor Consultation Now
                    </button>
                    <span className="text-[11px] text-white/70 text-center sm:text-left">
                      Slots allocated on first-come basis
                    </span>
                  </div>
                </div>
              </div>

              {/* =========================================================================
                  11. MEDICAL DISCLAIMER
                  ========================================================================= */}
              <footer className="bg-[#FFF1F2] border-2 border-[#F43F5E] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
                <AlertTriangle className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#BE123C] mb-1">
                    Medical Disclaimer
                  </h5>
                  <p className="text-xs text-[#9F1239] leading-relaxed font-medium">
                    This AI-generated analysis is intended for informational and screening purposes only. It does not replace professional medical diagnosis, examination, or treatment. Final diagnosis and treatment decisions should be made by a qualified healthcare professional.
                  </p>
                </div>
              </footer>

              {/* Save Confirmation Message */}
              {saveError && (
                <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-2xl p-4 sm:p-6 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#991B1B] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-bold text-[#991B1B]">{saveError}</p>
                    {onRetrySave && (
                      <button
                        type="button"
                        onClick={onRetrySave}
                        className="text-xs font-bold text-[#DC2626] hover:underline mt-2 cursor-pointer"
                      >
                        Retry Save
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Spacer for bottom padding */}
              <div className="h-8" />
            </div>
          </main>
        </div>
      </div>

      {/* ==========================================================================
           INTERACTIVE CONSULTATION MODAL
           ========================================================================== */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EDF2F7] flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Book Doctor Consultation</h3>
                <p className="text-xs text-[#64748B]">Anarva Clinic Hair Restoration Center</p>
              </div>
              <button
                type="button"
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg"
                onClick={() => setModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {bookingError && (
                <div role="alert" className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs font-medium text-[#991B1B]">
                  {bookingError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[#475569] block mb-1.5">
                  Preferred Date & Time Slot
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    min={localDate()}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-2.5 border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] bg-white outline-none focus:border-[#15803D]"
                  />
                  <select
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="p-2.5 border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] bg-white outline-none focus:border-[#15803D]"
                  >
                    <option value="10:30 AM - Morning">10:30 AM - Morning</option>
                    <option value="02:15 PM - Afternoon">02:15 PM - Afternoon</option>
                    <option value="05:00 PM - Evening">05:00 PM - Evening</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#475569] block mb-1.5">
                  Consultation Mode
                </label>
                <div className="flex flex-col gap-2">
                  <label
                    onClick={() => setConsultationMode('In-Clinic Visit (Kota Anarva Clinic)')}
                    className={`text-xs flex items-center gap-2 p-2.5 rounded-xl border font-semibold cursor-pointer ${
                      consultationMode.startsWith('In-Clinic')
                        ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#0F172A]'
                        : 'border-[#E2E8F0] text-[#475569]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      checked={consultationMode.startsWith('In-Clinic')}
                      onChange={() => setConsultationMode('In-Clinic Visit (Kota Anarva Clinic)')}
                      className="accent-[#15803D]"
                    />
                    <span>In-Clinic Visit (Kota Anarva Clinic)</span>
                  </label>
                  <label
                    onClick={() => setConsultationMode('Online Consultation')}
                    className={`text-xs flex items-center gap-2 p-2.5 rounded-xl border font-semibold cursor-pointer ${
                      consultationMode.startsWith('Online')
                        ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#0F172A]'
                        : 'border-[#E2E8F0] text-[#475569]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      checked={consultationMode.startsWith('Online')}
                      onChange={() => setConsultationMode('Online Consultation')}
                      className="accent-[#15803D]"
                    />
                    <span>Online Consultation</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBooking}
                className="px-5 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
                onClick={handleConfirmAppointment}
              >
                <span>{isBooking ? 'Saving Slot...' : 'Confirm Appointment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ZOOM MODAL FOR SCALP PHOTOS */}
      {zoomModal.open && (
        <div
          className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setZoomModal({ open: false, title: '', image: null })}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#EDF2F7]">
              <h4 className="text-sm font-bold text-[#0F172A]">{zoomModal.title}</h4>
              <button
                type="button"
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg"
                onClick={() => setZoomModal({ open: false, title: '', image: null })}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {zoomModal.image && (
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black">
                <img src={zoomModal.image} alt={zoomModal.title} className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
