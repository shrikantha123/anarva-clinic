import React, { useState, useEffect } from 'react';
import {
  Lock,
  UserCheck,
  AlertCircle,
  Eye,
  LogOut,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Stethoscope,
  RefreshCw,
  Search,
  X,
  Phone,
  MapPin,
  FileText,
  Clock,
  Check,
  XCircle
} from 'lucide-react';
import {
  PatientAssessmentRecord,
  PatientStatus,
  AppointmentRecord,
  UserInfo,
  PhotoData,
  AnalysisResult,
} from '../types';
import { AnarvaLogo } from './AnarvaLogo';
import { ReportStep } from './ReportStep';
import { sound } from '../utils/audio';

interface DoctorPortalProps {
  onBackToApp: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ onBackToApp }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('doctor@anarvaclinic.com');
  const [password, setPassword] = useState('anarva2026');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Tab: 'patients' or 'appointments'
  const [activeTab, setActiveTab] = useState<'patients' | 'appointments'>('patients');

  // Assessments & Appointments Data
  const [assessments, setAssessments] = useState<PatientAssessmentRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  
  // Patient whose exact report is currently opened
  const [viewingPatient, setViewingPatient] = useState<PatientAssessmentRecord | null>(null);
  
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/doctor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Invalid credentials');
        sound.playStep();
      } else {
        setIsAuthenticated(true);
        sound.playSuccess();
        loadAssessments();
        loadAppointments();
      }
    } catch {
      setLoginError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAssessments = async () => {
    try {
      const res = await fetch('/api/doctor/assessments');
      const data = await res.json();
      if (data.assessments) {
        setAssessments(data.assessments);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
    }
  };

  const loadAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAssessments();
      loadAppointments();
    }
  }, [isAuthenticated]);

  const handleStatusChange = async (patientId: string, newStatus: PatientStatus) => {
    setStatusUpdating(true);
    sound.playSelect();

    try {
      const res = await fetch(`/api/doctor/assessments/${patientId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        if (viewingPatient && viewingPatient.patient_id === patientId) {
          setViewingPatient({ ...viewingPatient, status: newStatus });
        }
        setAssessments((prev) =>
          prev.map((a) =>
            a.patient_id === patientId ? { ...a, status: newStatus } : a
          )
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAppointmentStatusChange = async (aptId: string, newStatus: any) => {
    sound.playSelect();
    try {
      const res = await fetch(`/api/appointments/${aptId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === aptId || a.appointment_id === aptId ? { ...a, status: newStatus } : a
          )
        );
      }
    } catch (err) {
      console.error('Failed to update appointment status:', err);
    }
  };

  const openPatientExactReport = (patient: PatientAssessmentRecord) => {
    sound.playSelect();
    setViewingPatient(patient);
  };

  // Filtered patients
  const filteredPatients = assessments.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Filtered appointments
  const filteredAppointments = appointments.filter((a) => {
    return (
      a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.patient_phone.includes(searchTerm) ||
      a.appointment_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // =========================================================================
  // VIEW EXACT REPORT OVERLAY (Doctor sees the EXACT ReportStep the patient got)
  // =========================================================================
  if (viewingPatient) {
    const patientUserInfo: UserInfo = {
      name: viewingPatient.name,
      phone: viewingPatient.phone,
      gender: viewingPatient.gender,
      address: viewingPatient.address,
      age: viewingPatient.age,
    };

    const patientPhotos: PhotoData = {
      front: viewingPatient.photo_urls?.front || null,
      mid: viewingPatient.photo_urls?.mid || null,
      crown: viewingPatient.photo_urls?.crown || null,
    };

    const patientAnalysis: AnalysisResult = {
      ...viewingPatient.analysis,
      assessmentId: viewingPatient.patient_id,
    };

    return (
      <div className="min-h-screen bg-[#090D0F] text-white flex flex-col font-['Outfit'] antialiased">
        {/* Doctor Action Bar atop the Exact Report */}
        <div className="bg-[#0B1215] border-b border-[#22C55E]/30 px-4 sm:px-8 py-3 sticky top-0 z-50 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewingPatient(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/10"
            >
              <X className="w-4 h-4" />
              <span>Back to Admin Panel</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-[#22C55E]/15 border border-[#22C55E]/40 px-3 py-1 rounded-full text-xs font-bold text-[#86EFAC]">
              <Eye className="w-3.5 h-3.5" />
              <span>Viewing Exact Patient Report: {viewingPatient.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/80 font-bold hidden xs:inline">Status:</span>
            <select
              value={viewingPatient.status}
              disabled={statusUpdating}
              onChange={(e) => handleStatusChange(viewingPatient.patient_id, e.target.value as PatientStatus)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[#22C55E]/50 bg-[#121B1E] text-white outline-none cursor-pointer focus:border-[#22C55E]"
            >
              <option value="Pending Review">Pending Review</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Contacted">Contacted</option>
              <option value="Treatment Started">Treatment Started</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Exact Patient Report (Unchanged, identical to what patient sees) */}
        <div className="flex-1 bg-[#F6F9FA] text-[#0B1215]">
          <ReportStep
            userInfo={patientUserInfo}
            photos={patientPhotos}
            analysis={patientAnalysis}
            onRestart={() => setViewingPatient(null)}
          />
        </div>
      </div>
    );
  }

  // =========================================================================
  // LOGIN SCREEN (Black, Green & White Modern Aesthetics)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#090D0F] flex flex-col items-center justify-center p-4 font-['Outfit'] antialiased text-white">
        <div className="w-full max-w-md bg-[#121B1E] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#22C55E]/30 flex flex-col gap-6">
          <div className="flex flex-col items-center text-center">
            <AnarvaLogo size="lg" />
            <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#4ADE80] text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Doctor & Clinic Admin Portal</span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1.5">
              Secure clinical access for trichology patient triage and diagnosis
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white">Doctor Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="doctor@anarvaclinic.com"
                className="w-full p-3 rounded-xl border border-white/15 bg-[#090D0F] text-xs sm:text-sm text-white placeholder:text-white/40 outline-none focus:border-[#22C55E] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-xl border border-white/15 bg-[#090D0F] text-xs sm:text-sm text-white placeholder:text-white/40 outline-none focus:border-[#22C55E] transition-all"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.99] text-[#090D0F] font-extrabold text-sm shadow-lg shadow-[#22C55E]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Sign In to Admin Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={onBackToApp}
              className="text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              ← Return to Patient Assessment App
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DOCTOR ADMIN PANEL (Black & Green Modern Dark Theme, Clean Cards with Gender)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#090D0F] text-white font-['Outfit'] flex flex-col antialiased">
      {/* Top Header */}
      <header className="bg-[#0F171A] border-b border-[#22C55E]/25 px-4 sm:px-8 py-3 sticky top-0 z-40 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <AnarvaLogo size="sm" />
          <div className="hidden xs:flex items-center gap-1.5 bg-[#22C55E]/15 border border-[#22C55E]/30 px-3 py-1 rounded-full text-xs font-bold text-[#4ADE80]">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              loadAssessments();
              loadAppointments();
            }}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onBackToApp}
            className="px-3 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-bold text-white/90 transition-all cursor-pointer whitespace-nowrap"
          >
            Patient App
          </button>

          <button
            type="button"
            onClick={() => setIsAuthenticated(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 text-red-300 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full p-3 sm:p-6 flex flex-col gap-4 flex-1">
        
        {/* Navigation Tabs: Patients Assessments vs Appointments Database */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-[#121B1E] p-1.5 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                sound.playSelect();
                setActiveTab('patients');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'patients'
                  ? 'bg-[#22C55E] text-[#090D0F] shadow-md shadow-[#22C55E]/20'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Patient Assessments ({assessments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playSelect();
                setActiveTab('appointments');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'appointments'
                  ? 'bg-[#22C55E] text-[#090D0F] shadow-md shadow-[#22C55E]/20'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Appointments Database ({appointments.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-white/15 bg-[#121B1E] text-white placeholder:text-white/40 outline-none focus:border-[#22C55E]"
            />
          </div>
        </div>

        {/* TAB 1: PATIENTS ASSESSMENTS LIST */}
        {activeTab === 'patients' && (
          <div className="flex flex-col gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['all', 'Pending Review', 'Reviewed', 'Contacted', 'Treatment Started', 'Completed'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                    filterStatus === st
                      ? 'bg-[#22C55E] text-[#090D0F]'
                      : 'bg-[#121B1E] text-white/70 hover:text-white border border-white/10'
                  }`}
                >
                  {st === 'all' ? 'All Records' : st}
                </button>
              ))}
            </div>

            {/* Clean Modern Cards: Black & Green Background, Neat Alignment */}
            {filteredPatients.length === 0 ? (
              <div className="p-12 text-center text-xs text-white/50 bg-[#121B1E] rounded-2xl border border-white/10">
                No patient assessments found matching your filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredPatients.map((pt) => (
                  <div
                    key={pt.patient_id}
                    className="bg-[#121B1E] border border-white/10 hover:border-[#22C55E]/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 transition-all shadow-md group"
                  >
                    {/* Top Row: Name, ID, Gender Pill */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#4ADE80] font-extrabold text-sm flex items-center justify-center shrink-0">
                          {pt.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#4ADE80] transition-colors leading-tight">
                            {pt.name}
                          </h3>
                          <span className="text-[11px] font-mono text-white/50">{pt.patient_id}</span>
                        </div>
                      </div>

                      {/* GENDER BADGE (Replaced hair loss stage per prompt) */}
                      <span className="inline-flex items-center gap-1 font-bold text-xs bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/40 px-3 py-1 rounded-full shrink-0">
                        {pt.gender || 'Male'}
                      </span>
                    </div>

                    {/* Middle Row: Phone & Location in Neat Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#090D0F] p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                        <span className="text-white/90 truncate font-medium">{pt.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                        <span className="text-white/90 truncate font-medium">{pt.address}</span>
                      </div>
                    </div>

                    {/* Bottom Row: Status Dropdown & "View Report" Action */}
                    <div className="flex items-center justify-between gap-2.5 pt-1 border-t border-white/10">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[11px] font-bold text-white/60">Status:</span>
                        <select
                          value={pt.status}
                          disabled={statusUpdating}
                          onChange={(e) => handleStatusChange(pt.patient_id, e.target.value as PatientStatus)}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-white/20 bg-[#090D0F] text-white outline-none cursor-pointer focus:border-[#22C55E] transition-all flex-1"
                        >
                          <option value="Pending Review">Pending Review</option>
                          <option value="Reviewed">Reviewed</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Treatment Started">Treatment Started</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      {/* View Report Button (Opens Exact Patient Report) */}
                      <button
                        type="button"
                        onClick={() => openPatientExactReport(pt)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#090D0F] font-extrabold text-xs shadow-md shadow-[#22C55E]/20 transition-all cursor-pointer shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>View Report</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPOINTMENTS DATABASE (Simple, Clean, Doctor Reviewable) */}
        {activeTab === 'appointments' && (
          <div className="flex flex-col gap-3">
            {filteredAppointments.length === 0 ? (
              <div className="p-12 text-center text-xs text-white/50 bg-[#121B1E] rounded-2xl border border-white/10">
                No appointment bookings found. When patients click "Book an Appointment", records appear here.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredAppointments.map((apt) => (
                  <div
                    key={apt.id || apt.appointment_id}
                    className="bg-[#121B1E] border border-white/10 hover:border-[#22C55E]/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-md"
                  >
                    {/* Header: Patient Name & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white">{apt.patient_name}</h3>
                        <span className="text-[11px] font-mono text-[#4ADE80] font-bold">
                          {apt.appointment_id}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          apt.status === 'Confirmed'
                            ? 'bg-[#22C55E]/15 text-[#4ADE80] border-[#22C55E]/40'
                            : apt.status === 'Completed'
                            ? 'bg-blue-950/60 text-blue-300 border-blue-500/30'
                            : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>

                    {/* Booking Details */}
                    <div className="flex flex-col gap-1.5 text-xs bg-[#090D0F] p-3 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between text-white/90">
                        <span className="text-white/60">Phone:</span>
                        <span className="font-semibold">{apt.patient_phone}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/90">
                        <span className="text-white/60">Date & Slot:</span>
                        <span className="font-semibold text-[#4ADE80]">{apt.date} • {apt.time_slot}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/90">
                        <span className="text-white/60">Specialist:</span>
                        <span className="font-semibold truncate max-w-[200px]">{apt.specialist}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/90">
                        <span className="text-white/60">Mode:</span>
                        <span className="font-semibold">{apt.type}</span>
                      </div>
                    </div>

                    {/* Quick Status Update */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
                      <span className="text-white/60 font-semibold">Change Status:</span>
                      <div className="flex items-center gap-1.5">
                        {['Confirmed', 'Completed', 'Cancelled'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleAppointmentStatusChange(apt.id || apt.appointment_id, st)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                              apt.status === st
                                ? 'bg-[#22C55E] text-[#090D0F]'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};
