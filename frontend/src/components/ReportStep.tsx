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

  const consultData = analysis?.consultation || {
    urgency: 'medium',
    confidence_pct: 75,
    reason: 'Doctor consultation recommended to evaluate hair restoration options.',
    recommended_timeframe: 'Within 2-4 weeks',
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
    <div className="bg-[#F8FAFC] text-[#0F172A] font-['Plus_Jakarta_Sans',sans-serif] min-h-screen flex flex-col antialiased">
      <div className="flex flex-1 relative">
        {/* ========================================================================
             SIDEBAR — DESKTOP
             ======================================================================== */}
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
              title="Clinic Support: 1800-ANARVA"
              onClick={() => showToast('Anarva Clinical Support Hotline: 1800-ANARVA-CARE')}
            >
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col w-full" id="overview">
          {/* ======================================================================
               1. REPORT ACTION BAR (Header already displays top Anarva logo)
               ====================================================================== */}
          <div className="bg-white border-b border-[#EDF2F7] px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md w-full">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-[#F8FAFC] border border-[#EDF2F7] px-3.5 py-1 rounded-full text-xs font-semibold text-[#0F172A]">
                <div className="w-5 h-5 rounded-full bg-[#15803D] text-white flex items-center justify-center text-[10px] font-bold">
                  {(userInfo?.name || 'P').charAt(0).toUpperCase()}
                </div>
                <span>
                  Patient: <strong>{userInfo?.name || 'Patient'}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] px-2.5 py-1 rounded-full text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>AI-Powered Analysis</span>
              </span>

              <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-[#475569] bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#EDF2F7]">
                <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>{currentDate}</span>
              </span>

              <button
                type="button"
                className="hidden sm:inline-flex items-center gap-1.5 bg-white text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0] hover:border-[#CBD5E1] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                onClick={handlePrint}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#4F46E5] hover:to-[#7C3AED] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-[0_4px_14px_rgba(99,102,241,0.25)] transition-all cursor-pointer whitespace-nowrap"
                onClick={handlePrint}
              >
                <CloudDownload className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                onClick={onRestart}
                title="Restart assessment with new answers"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Test</span>
              </button>
            </div>
          </div>

          {/* Report Main Container */}
          <main className="p-4 sm:p-7 md:p-9 max-w-7xl mx-auto w-full flex flex-col gap-6 sm:gap-7">
            {saveError && (
              <div role="alert" className="flex items-start sm:items-center justify-between gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
                <span>{saveError}</span>
                {onRetrySave && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={onRetrySave}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#FECACA] bg-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
                  >
                    <RotateCcw className={`h-3.5 w-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                    {isSaving ? 'Retrying' : 'Retry save'}
                  </button>
                )}
              </div>
            )}
            
            {/* ====================================================================
                 2. PATIENT DETAILS CARD
                 ==================================================================== */}
            <section id="patient" className="bg-gradient-to-b from-white to-[#FAFCFB] border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 items-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Patient Name</span>
                  <span className="text-sm sm:text-base font-bold text-[#0F172A] truncate">
                    {userInfo?.name || '—'}
                  </span>
                  <span className="text-xs text-[#475569]">
                    ID: {analysis?.assessmentId || '—'}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Phone Number</span>
                  <span className="text-sm sm:text-base font-bold text-[#0F172A] truncate">
                    {userInfo?.phone || '—'}
                  </span>
                  <span className="text-xs text-[#475569]">Verified Contact</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Gender</span>
                  <span className="text-sm sm:text-base font-bold text-[#0F172A]">
                    {userInfo?.gender || '—'}
                  </span>
                  <span className="text-xs text-[#475569]">Biological sex</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Location</span>
                  <span className="text-sm sm:text-base font-bold text-[#0F172A] truncate">
                    {userInfo?.address || '—'}
                  </span>
                  <span className="text-xs text-[#475569]">Anarva Clinic Network</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Report created</span>
                  <span className="text-xs sm:text-sm font-bold text-[#0F172A]">
                    {reportCreatedAt
                      ? new Date(reportCreatedAt).toLocaleString()
                      : isSaving ? 'Saving report...' : currentDate}
                  </span>
                  <span className="text-xs text-[#475569]">Saved clinic record time</span>
                </div>

                <div className="col-span-2 sm:col-span-1 lg:justify-self-end">
                  <span className="inline-flex items-center gap-1.5 bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-1.5 rounded-lg text-xs font-bold text-[#15803D]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified AI Intake</span>
                  </span>
                </div>
              </div>
            </section>

            {/* ====================================================================
                 3. HAIR LOSS OVERVIEW CARD
                 ==================================================================== */}
            <section id="hair-loss" className="bg-white border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
                    Hair Loss Overview
                  </h2>
                  <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                    Clinical classification based on the Norwood-Hamilton Scale
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#F59E0B] border border-[#FDE68A]">
                  <Info className="w-3.5 h-3.5" />
                  <span>Active Progression</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pb-6 border-b border-[#F1F5F9] mb-5">
                <div className="bg-[#F0FDF4] border-2 border-[#BBF7D0] text-[#15803D] px-6 py-2.5 rounded-full text-xl sm:text-2xl font-extrabold shadow-sm shrink-0 self-start sm:self-auto">
                  Stage {analysis?.norwoodStage || 2}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
                    {analysis?.stageName || 'Norwood Hair Loss Assessment'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] mt-1 max-w-3xl leading-relaxed">
                    {analysis?.stageDescription || 'Clinical pattern consistent with androgenetic hair loss.'}
                  </p>
                </div>
              </div>

              {/* Norwood Staging Scale Nodes (1 to 7) */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 overflow-x-auto pb-1">
                  {[
                    { stage: 1, label: 'Stage 1', sub: 'Minimal' },
                    { stage: 2, label: 'Stage 2', sub: 'Mild Temporal' },
                    { stage: 3, label: 'Stage 3', sub: 'Moderate' },
                    { stage: 4, label: 'Stage 4', sub: 'Vertex Spread' },
                    { stage: 5, label: 'Stage 5', sub: 'Significant' },
                    { stage: 6, label: 'Stage 6', sub: 'Severe' },
                    { stage: 7, label: 'Stage 7', sub: 'Extensive' },
                  ].map((item) => {
                    const isCurrent = (analysis?.norwoodStage || 2) === item.stage;
                    return (
                      <div
                        key={item.stage}
                        className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-[#F0FDF4] border-[#15803D] ring-2 ring-[#15803D]/10 shadow-xs -translate-y-0.5'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-80'
                        }`}
                      >
                        <div
                          className={`text-xs font-bold ${
                            isCurrent ? 'text-[#15803D]' : 'text-[#475569]'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            isCurrent ? 'text-[#15803D] font-semibold' : 'text-[#94A3B8]'
                          }`}
                        >
                          {item.sub}
                        </div>
                        {isCurrent && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#15803D] mx-auto mt-1.5 shadow-[0_0_6px_#15803D]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ====================================================================
                 4. SCALP IMAGE ANALYSIS (FRONT, MID, CROWN)
                 ==================================================================== */}
            <section id="scalp-analysis">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
                    Scalp Analysis
                  </h2>
                  <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                    AI-assisted density assessment across key scalp regions
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs text-[#475569] bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-lg hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  onClick={() => showToast('Trichoscopy Sensor: 50x calibrated magnification enabled')}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>High-Res Trichoscopy</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. FRONT */}
                <div className="bg-white border border-[#EDF2F7] rounded-2xl overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-all group">
                  <div className="relative h-52 bg-[#0F172A] overflow-hidden flex items-center justify-center">
                    <img
                      src={photos?.front || q3FrontalsImg}
                      alt="Front scalp"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border border-white/20">
                      Front Scalp
                    </div>
                    <div
                      className="absolute bottom-3 right-3 bg-black/65 text-white rounded-md px-2 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                      onClick={() => showToast('Inspecting Front Scalp Trichoscopy Field')}
                    >
                      <ZoomIn className="w-3 h-3" />
                      <span>50x Zoom</span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-3.5 flex-1 justify-between">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-[#475569]">Front Density</h4>
                        <div className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                          {analysis?.frontDensity ?? 5} <span className="text-xs text-[#94A3B8] font-normal">/ 10</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 relative shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#F1F5F9"
                            strokeWidth="3.5"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#14B8A6"
                            strokeWidth="3.5"
                            strokeDasharray={`${Math.round((analysis?.frontDensity ?? 5) * 10)}, 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#0F172A]">
                          {Math.round((analysis?.frontDensity ?? 5) * 10)}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F0FDFA] text-[#14B8A6] border border-[#99F6E4]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Moderate density</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. MID / TOP */}
                <div className="bg-white border border-[#EDF2F7] rounded-2xl overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-all group">
                  <div className="relative h-52 bg-[#0F172A] overflow-hidden flex items-center justify-center">
                    <img
                      src={photos?.mid || q3MidsImg}
                      alt="Mid scalp"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border border-white/20">
                      Mid / Top Scalp
                    </div>
                    <div
                      className="absolute bottom-3 right-3 bg-black/65 text-white rounded-md px-2 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                      onClick={() => showToast('Inspecting Mid Scalp Trichoscopy Field')}
                    >
                      <ZoomIn className="w-3 h-3" />
                      <span>50x Zoom</span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-3.5 flex-1 justify-between">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-[#475569]">Mid Density</h4>
                        <div className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                          {analysis?.midDensity ?? 6} <span className="text-xs text-[#94A3B8] font-normal">/ 10</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 relative shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#F1F5F9"
                            strokeWidth="3.5"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#22C55E"
                            strokeWidth="3.5"
                            strokeDasharray={`${Math.round((analysis?.midDensity ?? 6) * 10)}, 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#0F172A]">
                          {Math.round((analysis?.midDensity ?? 6) * 10)}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Good density</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. CROWN */}
                <div className="bg-white border border-[#EDF2F7] rounded-2xl overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-all group">
                  <div className="relative h-52 bg-[#0F172A] overflow-hidden flex items-center justify-center">
                    <img
                      src={photos?.crown || q3CrownImg}
                      alt="Crown scalp"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border border-white/20">
                      Crown Scalp
                    </div>
                    <div
                      className="absolute bottom-3 right-3 bg-black/65 text-white rounded-md px-2 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                      onClick={() => showToast('Inspecting Crown Scalp Trichoscopy Field')}
                    >
                      <ZoomIn className="w-3 h-3" />
                      <span>50x Zoom</span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-3.5 flex-1 justify-between">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-[#475569]">Crown Density</h4>
                        <div className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                          {analysis?.crownDensity ?? 5} <span className="text-xs text-[#94A3B8] font-normal">/ 10</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 relative shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#F1F5F9"
                            strokeWidth="3.5"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#EC4899"
                            strokeWidth="3.5"
                            strokeDasharray={`${Math.round((analysis?.crownDensity ?? 5) * 10)}, 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#0F172A]">
                          {Math.round((analysis?.crownDensity ?? 5) * 10)}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF1F2] text-[#F43F5E] border border-[#FECDD3]">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Reduced density</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ====================================================================
                 5. OVERALL HAIR DENSITY (Exact 5-Ring Group from Reference Image)
                 ==================================================================== */}
            <section id="density-summary" className="bg-white border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
                    Overall Hair Density
                  </h2>
                  <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                    Comprehensive hair follicle & scalp density index
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                    {((((analysis?.frontDensity ?? 5) + (analysis?.midDensity ?? 6) + (analysis?.crownDensity ?? 5))) / 3).toFixed(1)}{' '}
                    <span className="text-xs text-[#94A3B8] font-normal">/ 10</span>
                  </div>
                  <div className="text-xs font-bold text-[#22C55E]">+3.2% vs previous assessment</div>
                </div>
              </div>

              {/* 5 Distinct Color Rings matching Reference Image */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                {/* Ring 1: Sky Blue / Cyan (Overall Score) */}
                <div className="p-4 rounded-xl border border-[#EDF2F7] bg-white flex flex-col items-center text-center hover:border-[#CBD5E1] transition-all">
                  <div className="w-18 h-18 relative mb-2">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3.2" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#0EA5E9" strokeWidth="3.2" strokeDasharray={`${analysis?.overallScore ?? 75}, 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-extrabold text-base text-[#0F172A]">
                      {analysis?.overallScore ?? 75}%
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0F172A]">Overall Score</span>
                  <span className="text-[11px] text-[#94A3B8]">Density Index</span>
                </div>

                {/* Ring 2: Mint / Teal (Front Scalp) */}
                <div className="p-4 rounded-xl border border-[#EDF2F7] bg-white flex flex-col items-center text-center hover:border-[#CBD5E1] transition-all">
                  <div className="w-18 h-18 relative mb-2">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3.2" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#14B8A6" strokeWidth="3.2" strokeDasharray={`${Math.round((analysis?.frontDensity ?? 5) * 10)}, 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-extrabold text-base text-[#0F172A]">
                      {Math.round((analysis?.frontDensity ?? 5) * 10)}%
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0F172A]">Front Scalp</span>
                  <span className="text-[11px] text-[#94A3B8]">{analysis?.frontDensity ?? 5} / 10 Density</span>
                </div>

                {/* Ring 3: Magenta / Pink (Crown Scalp) */}
                <div className="p-4 rounded-xl border border-[#EDF2F7] bg-white flex flex-col items-center text-center hover:border-[#CBD5E1] transition-all">
                  <div className="w-18 h-18 relative mb-2">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3.2" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#EC4899" strokeWidth="3.2" strokeDasharray={`${Math.round((analysis?.crownDensity ?? 5) * 10)}, 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-extrabold text-base text-[#0F172A]">
                      {Math.round((analysis?.crownDensity ?? 5) * 10)}%
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0F172A]">Crown Scalp</span>
                  <span className="text-[11px] text-[#94A3B8]">{analysis?.crownDensity ?? 5} / 10 Density</span>
                </div>

                {/* Ring 4: Lime / Green (Mid Scalp) */}
                <div className="p-4 rounded-xl border border-[#EDF2F7] bg-white flex flex-col items-center text-center hover:border-[#CBD5E1] transition-all">
                  <div className="w-18 h-18 relative mb-2">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3.2" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22C55E" strokeWidth="3.2" strokeDasharray={`${Math.round((analysis?.midDensity ?? 6) * 10)}, 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-extrabold text-base text-[#0F172A]">
                      {Math.round((analysis?.midDensity ?? 6) * 10)}%
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0F172A]">Mid Scalp</span>
                  <span className="text-[11px] text-[#94A3B8]">{analysis?.midDensity ?? 6} / 10 Density</span>
                </div>

                {/* Ring 5: Purple / Indigo (Follicular Health) */}
                <div className="p-4 rounded-xl border border-[#EDF2F7] bg-white flex flex-col items-center text-center hover:border-[#CBD5E1] transition-all col-span-2 sm:col-span-1">
                  <div className="w-18 h-18 relative mb-2">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3.2" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#8B5CF6" strokeWidth="3.2" strokeDasharray={`${analysis?.follicularHealth ?? 70}, 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-extrabold text-base text-[#0F172A]">
                      {analysis?.follicularHealth ?? 70}%
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0F172A]">Follicular Health</span>
                  <span className="text-[11px] text-[#94A3B8]">Anagen Ratio</span>
                </div>
              </div>
            </section>

            {/* ====================================================================
                 6 & 11. SCALP HEALTH & ANATOMICAL VISUALIZATION
                 ==================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Scalp Health Bars with Multi-Stop Gradients */}
              <section className="lg:col-span-7 bg-white border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs flex flex-col justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
                    Scalp Health
                  </h2>
                  <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                    Clinical assessment of conditions affecting follicular retention
                  </p>

                  {/* Summary Metric Counters */}
                  <div className="flex gap-6 sm:gap-8 my-5 pb-4 border-b border-[#F1F5F9] flex-wrap">
                    <div>
                      <div className="text-xl sm:text-2xl font-extrabold text-[#EC4899]">
                        {analysis?.dandruffLevel ?? 20}%
                      </div>
                      <div className="text-[11px] text-[#94A3B8] font-medium">Dandruff Index</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-extrabold text-[#0EA5E9]">
                        {analysis?.oilinessLevel ?? 30}%
                      </div>
                      <div className="text-[11px] text-[#94A3B8] font-medium">Sebum / Oiliness</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-extrabold text-[#F59E0B]">
                        {analysis?.flakingLevel ?? 15}%
                      </div>
                      <div className="text-[11px] text-[#94A3B8] font-medium">Flaking Level</div>
                    </div>
                  </div>

                  {/* Horizontal Concern Bars */}
                  <div className="flex flex-col gap-4">
                    {/* Dandruff */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold text-[#0F172A]">
                        <span>Dandruff</span>
                        <span className="text-[#475569]">
                          {(analysis?.dandruffLevel ?? 20) > 40 ? 'Moderate' : 'Mild'} <strong>{analysis?.dandruffLevel ?? 20}%</strong>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#F43F5E] via-[#EC4899] to-[#D946EF]"
                          style={{ width: `${analysis?.dandruffLevel ?? 20}%` }}
                        />
                      </div>
                    </div>

                    {/* Redness */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold text-[#0F172A]">
                        <span>Redness</span>
                        <span className="text-[#475569]">
                          {(analysis?.rednessLevel ?? 15) > 35 ? 'Elevated' : 'Low'} <strong>{analysis?.rednessLevel ?? 15}%</strong>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#6366F1] via-[#818CF8] to-[#38BDF8]"
                          style={{ width: `${analysis?.rednessLevel ?? 15}%` }}
                        />
                      </div>
                    </div>

                    {/* Oiliness */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold text-[#0F172A]">
                        <span>Oiliness</span>
                        <span className="text-[#475569]">
                          {(analysis?.oilinessLevel ?? 30) > 40 ? 'Moderate' : 'Balanced'} <strong>{analysis?.oilinessLevel ?? 30}%</strong>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#06B6D4]"
                          style={{ width: `${analysis?.oilinessLevel ?? 30}%` }}
                        />
                      </div>
                    </div>

                    {/* Scalp Irritation */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold text-[#0F172A]">
                        <span>Scalp Irritation</span>
                        <span className="text-[#475569]">
                          {(analysis?.irritationLevel ?? 10) > 30 ? 'Active' : 'Low'} <strong>{analysis?.irritationLevel ?? 10}%</strong>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA]"
                          style={{ width: `${analysis?.irritationLevel ?? 10}%` }}
                        />
                      </div>
                    </div>

                    {/* Flaking */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold text-[#0F172A]">
                        <span>Flaking</span>
                        <span className="text-[#475569]">
                          {(analysis?.flakingLevel ?? 15) > 30 ? 'Moderate' : 'Low'} <strong>{analysis?.flakingLevel ?? 15}%</strong>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F43F5E]"
                          style={{ width: `${analysis?.flakingLevel ?? 15}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Anatomical Scalp / Cranial Condition Visualization */}
              <section className="lg:col-span-5 bg-white border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">
                      Scalp Condition Mapping
                    </h2>
                    <p className="text-xs text-[#475569]">Topological follicular concern localization</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-2 py-0.5 rounded-full">
                    Top-Down Cranial Scan
                  </span>
                </div>

                <div className="bg-[#FAFCFE] border border-[#EDF2F7] rounded-xl p-4 flex flex-col items-center justify-center">
                  <svg viewBox="0 0 280 290" className="w-full max-w-[240px] h-auto">
                    {/* Medical Cranial Outline */}
                    <ellipse cx="140" cy="145" rx="88" ry="110" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
                    {/* Auricular Landmarks */}
                    <path d="M 50 130 C 42 140, 42 160, 52 170" fill="none" stroke="#94A3B8" strokeWidth="1.2" />
                    <path d="M 230 130 C 238 140, 238 160, 228 170" fill="none" stroke="#94A3B8" strokeWidth="1.2" />

                    {/* Orientation Labels */}
                    <text x="140" y="22" fill="#94A3B8" fontSize="8" textAnchor="middle" fontWeight="700" letterSpacing="1">
                      ANTERIOR (FRONT)
                    </text>
                    <text x="140" y="278" fill="#94A3B8" fontSize="8" textAnchor="middle" fontWeight="700" letterSpacing="1">
                      POSTERIOR (OCCIPITAL)
                    </text>

                    {/* Hairline Curve */}
                    <path d="M 72 70 Q 140 50 208 70" fill="none" stroke="#CBD5E1" strokeWidth="1.2" strokeDasharray="3,3" />
                    <path d="M 70 85 Q 105 105 140 88 Q 175 105 210 85" fill="none" stroke="#F59E0B" strokeWidth="1.8" />

                    {/* 1. Temporal Recession Peaks */}
                    <path d="M 70 85 Q 90 68 115 82 Q 105 105 70 85 Z" fill="rgba(245, 158, 11, 0.25)" stroke="#F59E0B" strokeWidth="1.2" />
                    <path d="M 210 85 Q 190 68 165 82 Q 175 105 210 85 Z" fill="rgba(245, 158, 11, 0.25)" stroke="#F59E0B" strokeWidth="1.2" />

                    {/* 2. Mid Scalp Stability */}
                    <ellipse cx="140" cy="135" rx="52" ry="28" fill="rgba(20, 184, 166, 0.12)" stroke="#14B8A6" strokeWidth="1.2" strokeDasharray="3,3" />
                    <text x="140" y="139" fill="#0D9488" fontSize="8" textAnchor="middle" fontWeight="700">
                      Mid Scalp ({analysis?.midDensity ?? 6}/10)
                    </text>

                    {/* 3. Crown / Vertex Thinning */}
                    <ellipse cx="140" cy="188" rx="40" ry="28" fill="rgba(236, 72, 153, 0.2)" stroke="#EC4899" strokeWidth="1.4" />
                    <text x="140" y="191" fill="#BE185D" fontSize="8" textAnchor="middle" fontWeight="700">
                      Vertex ({analysis?.crownDensity ?? 5}/10)
                    </text>

                    {/* 4. Occipital Donor Band */}
                    <path d="M 68 215 Q 140 240 212 215 Q 200 250 140 254 Q 80 250 68 215 Z" fill="rgba(34, 197, 94, 0.12)" stroke="#22C55E" strokeWidth="1.2" />
                    <text x="140" y="240" fill="#15803D" fontSize="7" textAnchor="middle" fontWeight="600">
                      Donor Fringe (Dense)
                    </text>
                  </svg>

                  <div className="flex flex-wrap justify-center gap-3 pt-3 border-t border-[#EEF2F6] w-full text-[11px] text-[#475569]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#EC4899]" />
                      <span>Vertex Thinning</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                      <span>Frontal Recession</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                      <span>Mid Stability</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* ====================================================================
                 7 & 8. AI-ASSISTED DIAGNOSIS & EXPLANATION
                 ==================================================================== */}
            <section id="ai-diagnosis" className="bg-white border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
                    AI-Assisted Diagnosis
                  </h2>
                  <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                    Assessment generated from questionnaire responses and scalp image analysis.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-1 rounded-full whitespace-nowrap">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>AI confidence {analysis?.confidencePct ?? 90}%</span>
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Dynamically generated hair-loss reasons (always total 100%) */}
                <div className="lg:col-span-6 flex flex-col gap-3.5">
                  {(analysis?.hairLossReasons || []).map((item, idx) => (
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
                      {item.explanation && (
                        <p className="text-xs text-[#475569] leading-relaxed">{item.explanation}</p>
                      )}
                    </div>
                  ))}

                  <div className="flex items-start gap-1.5 text-xs text-[#94A3B8] mt-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#15803D] shrink-0 mt-0.5" />
                    <span>AI likelihood scores represent automated screening indicators, not a definitive medical diagnosis.</span>
                  </div>
                </div>

                {/* Visible findings and observations */}
                <div className="lg:col-span-6 flex flex-col gap-4">
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                      <Microscope className="w-4 h-4 text-[#15803D]" />
                      <span>Scalp findings from your photos</span>
                    </h4>

                    {(analysis?.scalpFindings || []).length === 0 ? (
                      <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                        No specific scalp condition was clearly visible in your photos.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {(analysis?.scalpFindings || []).map((finding) => (
                          <div key={finding.condition} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-md bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0 mt-0.5">
                              <Layers className="w-3 h-3" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-[#0F172A] break-words">
                                {finding.condition}{' '}
                                <span className="font-mono text-[#15803D]">{finding.severity_pct}%</span>
                              </p>
                              <p className="text-xs text-[#475569] leading-relaxed">{finding.observation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {(analysis?.clinicalObservations || []).length > 0 && (
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col gap-3">
                      <h4 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#15803D]" />
                        <span>Why this assessment?</span>
                      </h4>
                      <div className="flex flex-col gap-2.5">
                        {(analysis?.clinicalObservations || []).map((observation) => (
                          <p key={observation} className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                            {observation}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis?.limitations && (
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{analysis.limitations}</p>
                  )}
                </div>
              </div>
            </section>

            {/* ====================================================================
                 8. WHAT TO DO NEXT
                 ==================================================================== */}
            <section id="recommendations" className="bg-white border border-[#EDF2F7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
                  What To Do Next
                </h2>
                <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                  Recommended clinical action roadmap based on your AI diagnostic profile
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                {(analysis?.recommendations || []).map((step, idx) => {
                  const isThird = idx === 2;
                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                        isThird
                          ? 'border-[#BBF7D0] bg-[#F0FDF4]'
                          : 'border-[#EDF2F7] bg-white hover:border-[#BBF7D0] hover:shadow-xs'
                      }`}
                    >
                      <div className="text-2xl font-extrabold text-[#15803D] tracking-tight font-mono">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <h4 className="text-sm font-bold text-[#0F172A] leading-tight">
                        {step.title}
                      </h4>
                      <p className="text-xs text-[#475569] leading-relaxed">
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
              {/* Consultation Recommendation Card: Low / Medium / High with Percentage & Simple Words */}
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

              {/* Book Appointment CTA Banner */}
              <div className="lg:col-span-7 bg-gradient-to-br from-[#15803D] to-[#166534] text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-5 shadow-[0_10px_30px_-5px_rgba(21,128,61,0.3)] relative overflow-hidden">
                <div className="absolute top-[-50px] right-[-50px] w-44 h-44 rounded-full bg-white/10 pointer-events-none" />

                <div className="relative z-10">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Ready to discuss your results?
                  </h3>
                  <p className="text-xs sm:text-sm text-white/90 mt-1.5 max-w-lg leading-relaxed">
                    Talk through your hair report with an Anarva Clinic doctor and find the simplest, most effective steps for your hair.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 relative z-10">
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-[#F0FDF4] text-[#15803D] font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book an Appointment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm border border-white/30 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Analysis Again</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ====================================================================
                 11. DISCLAIMER
                 ==================================================================== */}
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
                <p className="text-xs text-[#475569]">Anarva Clinic Hair Restoration Center</p>
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
