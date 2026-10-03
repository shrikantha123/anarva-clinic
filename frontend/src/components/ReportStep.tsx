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
  RotateCcw,
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
  const [selectedDate, setSelectedDate] = useState(localDate());
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
        {/* ════════════════════════════════════════════════════════════════════════
            SIDEBAR — DESKTOP
            ════════════════════════════════════════════════════════════════════════ */}
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
          {/* ════════════════════════════════════════════════════════════════════════
              1. REPORT ACTION BAR (Header already displays top Anarva logo)
              ════════════════════════════════════════════════════════════════════════ */}
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
            <div className="max-w-4xl mx-auto p-4 sm:p-8 flex flex-col gap-8">
              {/* ════════════════════════════════════════════════════════════════════════
                  2. PATIENT DETAILS CARD
                  ════════════════════════════════════════════════════════════════════════ */}
              <section id="patient" className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EDF2F7] shadow-sm">
                <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold text-sm">
                    01
                  </div>
                  Patient Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-[#64748B]">Name</span>
                    <p className="text-sm font-bold text-[#0F172A] mt-1">{userInfo.name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#64748B]">Phone</span>
                    <p className="text-sm font-bold text-[#0F172A] mt-1">{userInfo.phone}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#64748B]">Age</span>
                    <p className="text-sm font-bold text-[#0F172A] mt-1">{userInfo.age || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#64748B]">Gender</span>
                    <p className="text-sm font-bold text-[#0F172A] mt-1">{userInfo.gender || '—'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs font-semibold text-[#64748B]">Address / City</span>
                    <p className="text-sm font-bold text-[#0F172A] mt-1">{userInfo.address}</p>
                  </div>
                </div>
              </section>

              {/* ════════════════════════════════════════════════════════════════════════
                  3. NORWOOD STAGE & OVERALL HAIR HEALTH SCORE
                  ════════════════════════════════════════════════════════════════════════ */}
              <section id="hair-loss" className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EDF2F7] shadow-sm">
                <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold text-sm">
                    02
                  </div>
                  Hair Loss Stage (Norwood Classification)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-2">
                      <span className="text-sm font-semibold text-[#64748B]">Norwood Stage</span>
                      <div className="text-4xl font-extrabold text-[#15803D] tracking-tight mt-2">
                        {analysis.norwoodStage}
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A]">{analysis.stageName}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed mt-2">{analysis.stageDescription}</p>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="relative w-full h-48 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center overflow-hidden">
                      <img
                        src={photos.front || q3FrontalsImg}
                        alt="Frontal hairline assessment"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* ════════════════════════════════════════════════════════════════════════
                  4. SCALP IMAGE ANALYSIS & PHOTOGRAPHIC TRICHOSCOPY
                  ════════════════════════════════════════════════════════════════════════ */}
              <section id="scalp-analysis" className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EDF2F7] shadow-sm">
                <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold text-sm">
                    03
                  </div>
                  Scalp Image Analysis (Photographic Trichoscopy)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Frontal', img: photos.front || q3FrontalsImg },
                    { label: 'Mid-Scalp', img: photos.mid || q3MidsImg },
                    { label: 'Crown', img: photos.crown || q3CrownImg },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-2">
                      <div className="relative w-full h-40 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden">
                        <img
                          src={item.img}
                          alt={`${item.label} scalp region`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs font-semibold text-center text-[#64748B]">{item.label}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ════════════════════════════════════════════════════════════════════════
                  5. DENSITY SUMMARY & OVERALL HEALTH SCORE
                  ═══════════════════════════════════════════════════════════════���════════ */}
              <section id="density-summary" className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EDF2F7] shadow-sm">
                <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold text-sm">
                    04
                  </div>
                  Follicular Density & Scalp Health Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Frontal Density', value: analysis.frontDensity },
                    { label: 'Mid-Scalp Density', value: analysis.midDensity },
                    { label: 'Crown Density', value: analysis.crownDensity },
                    { label: 'Follicular Health', value: analysis.follicularHealth },
                    { label: 'Dandruff Level', value: analysis.dandruffLevel },
                    { label: 'Oiliness Level', value: analysis.oilinessLevel },
                    { label: 'Flaking Level', value: analysis.flakingLevel },
                    { label: 'Redness Level', value: analysis.rednessLevel },
                    { label: 'Irritation Level', value: analysis.irritationLevel },
                  ].map((item) => {
                    const percentage = Math.round(item.value);
                    return (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-xs sm:text-sm font-semibold text-[#475569]">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                            <div
                              className="h-full bg-[#15803D] transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#0F172A] w-8 text-right">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ════════════════════════════════════════════════════════════════════════
                  6. AI DIAGNOSIS & HAIR LOSS REASONS
                  ════════════════════════════════════════════════════════════════════════ */}
              <section id="ai-diagnosis" className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EDF2F7] shadow-sm">
                <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold text-sm">
                    05
                  </div>
                  AI-Assisted Diagnosis & Hair Loss Attribution
                </h2>

                <div className="mb-6 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed">
                    {analysis.clinicalObservations?.join(' ') || 'Scalp assessment in progress.'}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold text-[#0F172A] mb-3">Attributed Hair Loss Reasons</h3>
                  <div className="flex flex-col gap-2">
                    {analysis.hairLossReasons?.map((reason, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
                      >
                        <span className="text-xs sm:text-sm font-semibold text-[#475569]">{reason.reason}</span>
                        <span className="text-xs font-bold text-[#15803D]">{reason.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-3">Scalp Findings</h3>
                  <div className="flex flex-col gap-2">
                    {analysis.scalpFindings?.map((finding, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
                      >
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-[#0F172A]">{finding.condition}</p>
                          <p className="text-[11px] text-[#64748B] mt-1">{finding.observation}</p>
                        </div>
                        <span className="text-xs font-bold text-[#15803D] ml-2 shrink-0">{finding.severity_pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ════════════════════════════════════════════════════════════════════════
                  7. DOCTOR'S CLINICAL BRIEF & TREATMENT OPTIONS
                  ════════════════════════════════════════════════════════════════════════ */}
              {analysis.doctorClinicalBrief && (
                <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EDF2F7] shadow-sm">
                  <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold text-sm">
                      06
                    </div>
                    Doctor's Clinical Brief & Treatment Directions
                  </h2>
                  <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed mb-6">
                    {analysis.doctorClinicalBrief}
                  </p>

                  {analysis.doctorTreatments && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        {
                          label: 'Minoxidil Topical',
                          key: 'minoxidil_topical',
                        },
                        { label: 'Oral Finasteride', key: 'oral_finasteride' },
                        { label: 'Mesotherapy Sessions', key: 'mesotherapy' },
                        { label: 'Hair Transplant', key: 'hair_transplant' },
                        { label: 'Topical Care Routine', key: 'topical_care' },
                      ].map((treatment) => {
                        const likelihood =
                          analysis.doctorTreatments?.[treatment.key as keyof typeof analysis.doctorTreatments];
                        return (
                          <div
                            key={treatment.label}
                            className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between"
                          >
                            <span className="text-xs sm:text-sm font-semibold text-[#0F172A]">{treatment.label}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                likelihood === 'high'
                                  ? 'bg-[#FEE2E2] text-[#991B1B]'
                                  : likelihood === 'medium'
                                  ? 'bg-[#FEF3C7] text-[#92400E]'
                                  : 'bg-[#DCFCE7] text-[#166534]'
                              }`}
                            >
                              {likelihood?.toUpperCase() || 'N/A'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {/* ════════════════════════════════════════════════════════════════════════
                  8. RECOMMENDATIONS / NEXT STEPS
                  ════════════════════════════════════════════════════════════════════════ */}
              <section id="recommendations" className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EDF2F7] shadow-sm">
                <h2 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center font-bold text-sm">
                    07
                  </div>
                  Recommended Next Steps
                </h2>
                <div className="flex flex-col gap-3">
                  {analysis.recommendations?.map((step, idx) => {
                    return (
                      <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                        <div className="text-2xl font-extrabold text-[#15803D] tracking-tight font-mono">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#0F172A] leading-tight">
                            {step.title}
                          </h4>
                          <p className="text-xs text-[#475569] leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ════════════════════════════════════════════════════════════════════════
                  9 & 10. CONSULTATION RECOMMENDATION & BOOK APPOINTMENT CTA
                  ════════════════════════════════════════════════════════════════════════ */}
              <div id="consultation" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Consultation Recommendation Card: Low / Medium / High with Percentage & Simple Words */}
                {(() => {
                  const level =
                    analysis.consultation.urgency === 'high'
                      ? 'High'
                      : analysis.consultation.urgency === 'medium'
                      ? 'Medium'
                      : 'Low';
                  const simpleDesc =
                    level === 'High'
                      ? 'Consultation Strongly Recommended'
                      : level === 'Medium'
                      ? 'Consultation Recommended Soon'
                      : 'Routine Consultation Advised';
                  const bgColor =
                    level === 'High'
                      ? 'bg-[#FEE2E2] border-[#FECACA]'
                      : level === 'Medium'
                      ? 'bg-[#FEF3C7] border-[#FDE68A]'
                      : 'bg-[#DCFCE7] border-[#BBF7D0]';
                  const textColor =
                    level === 'High'
                      ? 'text-[#991B1B]'
                      : level === 'Medium'
                      ? 'text-[#92400E]'
                      : 'text-[#15803D]';

                  return (
                    <div className={`lg:col-span-8 p-6 sm:p-8 rounded-2xl border ${bgColor} flex flex-col gap-4`}>
                      <div>
                        <h3 className={`text-lg font-bold ${textColor} mb-2`}>
                          {level === 'High' ? 'Consultation Strongly Recommended' : level === 'Medium' ? 'Consultation Recommended Soon' : 'Routine Consultation Advised'}
                        </h3>
                        <p className="text-[11px] text-[#64748B]">{analysis.consultation.recommended_timeframe}</p>
                      </div>

                      <p className="text-xs text-[#475569] leading-relaxed">
                        {simpleDesc}
                      </p>
                    </div>
                  );
                })()}

                {/* Book Appointment CTA Banner */}
                <div className="lg:col-span-4 p-6 sm:p-8 rounded-2xl bg-[#15803D] text-white flex flex-col gap-3 justify-center">
                  <h3 className="text-base font-bold">Schedule Your Consultation</h3>
                  <p className="text-xs opacity-90">
                    Review your assessment with our trichologist & discuss treatment options.
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="w-full px-4 py-3 rounded-xl bg-white hover:bg-[#F1F5F9] text-[#15803D] text-xs font-bold shadow-md transition-all cursor-pointer font-semibold"
                  >
                    Book Appointment Now →
                  </button>
                </div>
              </div>

              {/* Medical Disclaimer */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EDF2F7] shadow-sm">
                <strong className="text-xs sm:text-sm text-[#0F172A]">Medical Disclaimer:</strong>
                <p className="text-[11px] sm:text-xs text-[#64748B] leading-relaxed mt-2">
                  This AI-assisted trichology assessment provides preliminary educational evaluation based on user photographs and self-reported clinical history. It is not a substitute for in-person dermoscopy, biopsy, or diagnosis by a licensed dermatologist. Results should be reviewed by a qualified healthcare professional before starting any treatment. Anarva Clinic bears no liability for any outcomes resulting from the use or misuse of this assessment tool.
                </p>
              </div>

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

      {/* ══════════════════════════════════════════════════════════════════════════════
          APPOINTMENT BOOKING MODAL
          ══════════════════════════════════════════════════════════════════════════════ */}
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
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#475569] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bookingError && (
              <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-lg text-xs text-[#991B1B] font-semibold">
                {bookingError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[#475569] block mb-1.5">
                  Select Date & Time
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
        <div className="fixed bottom-4 right-4 px-4 py-3 rounded-lg bg-[#0F172A] text-white text-xs font-semibold shadow-lg z-50 animate-in slide-in-from-bottom duration-300">
          ✓ {toastMessage}
        </div>
      )}
    </div>
  );
};
