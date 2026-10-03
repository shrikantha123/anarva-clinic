import React, { useState, useEffect } from 'react';
import {
  Lock,
  UserCheck,
  AlertCircle,
  Eye,
  LogOut,
  Calendar,
  Stethoscope,
  RefreshCw,
  Search,
  X,
  Phone,
  MapPin,
  FileText,
  Clock,
  Check,
  XCircle,
  AlertTriangle,
  Zap,
  Database,
  Mail,
} from 'lucide-react';
import {
  PatientAssessmentRecord,
  PatientStatus,
  AppointmentRecord,
  UserInfo,
  PhotoData,
  AnalysisResult,
} from '../types';
import { apiFetch } from '../lib/api';
import { AnarvaLogo } from './AnarvaLogo';
import { ReportStep } from './ReportStep';
import { sound } from '../utils/audio';

export const DoctorPortal: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Tab: 'patients', 'appointments', or 'logs'
  const [activeTab, setActiveTab] = useState<'patients' | 'appointments' | 'logs'>(() =>
    new URLSearchParams(window.location.search).get('tab') === 'appointments'
      ? 'appointments'
      : 'patients'
  );

  // Assessments & Appointments Data
  const [assessments, setAssessments] = useState<PatientAssessmentRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);

  // Patient whose exact report is currently opened
  const [viewingPatient, setViewingPatient] = useState<PatientAssessmentRecord | null>(null);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() =>
    new URLSearchParams(window.location.search).get('appointment_id') || ''
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const res = await apiFetch('/api/doctor/login', {
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
      }
    } catch {
      setLoginError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAssessments = async () => {
    try {
      const res = await apiFetch('/api/doctor/assessments');
      const data = await res.json();
      if (data.assessments) {
        setAssessments(data.assessments);
        const patientId = new URLSearchParams(window.location.search).get('patient_id');
        const requestedPatient = data.assessments.find(
          (patient: PatientAssessmentRecord) => patient.patient_id === patientId
        );
        if (requestedPatient) setViewingPatient(requestedPatient);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
    }
  };

  const loadAppointments = async () => {
    try {
      const res = await apiFetch('/api/appointments');
      const data = await res.json();
      if (data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const loadSystemLogs = async () => {
    try {
      const res = await apiFetch('/api/doctor/logs');
      const data = await res.json();
      if (Array.isArray(data.logs)) {
        setSystemLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching system logs:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAssessments();
      loadAppointments();
      loadSystemLogs();
    }
  }, [isAuthenticated]);

  const handleStatusChange = async (patientId: string, newStatus: PatientStatus) => {
    setStatusUpdating(true);
    sound.playSelect();

    try {
      const res = await apiFetch(`/api/doctor/assessments/${patientId}/status`, {
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
      const res = await apiFetch(`/api/appointments/${aptId}/status`, {
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

  const getLogBadge = (status: string) => {
    const value = status || 'unknown';
    const isSuccess = value === 'success';
    return {
      textClass: isSuccess ? 'text-emerald-300' : 'text-red-300',
      bgClass: isSuccess ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-red-500/15 border border-red-500/30',
      icon: isSuccess ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />,
    };
  };

  const getComponentIcon = (operation: string) => {
    if (!operation) return <Clock className="w-3.5 h-3.5 text-white/50" />;
    if (operation.toLowerCase().includes('llm')) return <Zap className="w-3.5 h-3.5 text-orange-400" />;
    if (operation.toLowerCase().includes('db')) return <Database className="w-3.5 h-3.5 text-blue-400" />;
    if (operation.toLowerCase().includes('email')) return <Mail className="w-3.5 h-3.5 text-purple-400" />;
    return <AlertTriangle className="w-3.5 h-3.5 text-white/60" />;
  };

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
        <div className="bg-[#0B1215] border-b border-[#B91C1C]/40 px-4 sm:px-8 py-3 sticky top-0 z-50 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewingPatient(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/10"
            >
              <X className="w-4 h-4" />
              <span>Back to Admin Panel</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-[#B91C1C]/15 border border-[#B91C1C]/40 px-3 py-1 rounded-full text-xs font-bold text-[#FCA5A5]">
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
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[#B91C1C]/50 bg-[#121B1E] text-white outline-none cursor-pointer focus:border-[#B91C1C]"
            >
              <option value="Pending Review">Pending Review</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Contacted">Contacted</option>
              <option value="Treatment Started">Treatment Started</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="flex-1 bg-[#F6F9FA] text-[#0B1215]">
          <ReportStep
            userInfo={patientUserInfo}
            photos={patientPhotos}
            analysis={patientAnalysis}
            reportCreatedAt={viewingPatient.created_at}
            onRestart={() => setViewingPatient(null)}
          />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#090D0F] flex flex-col items-center justify-center p-4 font-['Outfit'] antialiased text-white">
        <div className="w-full max-w-md bg-[#121B1E] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#B91C1C]/30 flex flex-col gap-6">
          <div className="flex flex-col items-center text-center">
            <AnarvaLogo size="lg" />
            <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#B91C1C]/15 border border-[#B91C1C]/40 text-[#FCA5A5] text-xs font-bold">
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
                className="w-full p-3 rounded-xl border border-white/15 bg-[#090D0F] text-xs sm:text-sm text-white placeholder:text-white/40 outline-none focus:border-[#B91C1C] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-xl border border-white/15 bg-[#090D0F] text-xs sm:text-sm text-white placeholder:text-white/40 outline-none focus:border-[#B91C1C] transition-all"
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
              className="w-full py-3.5 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-[#B91C1C]/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D0F] text-white font-['Outfit'] flex flex-col antialiased">
      <header className="bg-[#0F171A] border-b border-[#B91C1C]/30 px-4 sm:px-8 py-3 sticky top-0 z-40 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <AnarvaLogo size="sm" />
          <div className="hidden xs:flex items-center gap-1.5 bg-[#B91C1C]/15 border border-[#B91C1C]/30 px-3 py-1 rounded-full text-xs font-bold text-[#FCA5A5]">
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
              loadSystemLogs();
            }}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsAuthenticated(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 text-red-300 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full p-3 sm:p-6 flex flex-col gap-4 flex-1">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-[#121B1E] p-1.5 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('patients')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'patients'
                  ? 'bg-[#B91C1C] text-white shadow-md shadow-[#B91C1C]/20'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Patient Assessments ({assessments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'appointments'
                  ? 'bg-[#B91C1C] text-white shadow-md shadow-[#B91C1C]/20'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Appointments Database ({appointments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'logs'
                  ? 'bg-[#B91C1C] text-white shadow-md shadow-[#B91C1C]/20'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>System Logs</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-white/15 bg-[#121B1E] text-white placeholder:text-white/40 outline-none focus:border-[#B91C1C]"
            />
          </div>
        </div>

        {activeTab === 'patients' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['all', 'Pending Review', 'Reviewed', 'Contacted', 'Treatment Started', 'Completed'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                    filterStatus === st
                      ? 'bg-[#B91C1C] text-white'
                      : 'bg-[#121B1E] text-white/70 hover:text-white border border-white/10'
                  }`}
                >
                  {st === 'all' ? 'All Records' : st}
                </button>
              ))}
            </div>

            {filteredPatients.length === 0 ? (
              <div className="p-12 text-center text-xs text-white/50 bg-[#121B1E] rounded-2xl border border-white/10">
                No patient assessments found matching your filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredPatients.map((pt) => (
                  <div
                    key={pt.patient_id}
                    className="bg-[#121B1E] border border-white/10 hover:border-[#B91C1C]/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 transition-all shadow-md group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#B91C1C]/15 border border-[#B91C1C]/30 text-[#FCA5A5] font-extrabold text-sm flex items-center justify-center shrink-0">
                          {pt.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#4ADE80] transition-colors leading-tight">
                            {pt.name}
                          </h3>
                          <span className="text-[11px] font-mono text-white/50">{pt.patient_id}</span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 font-bold text-xs bg-[#B91C1C]/15 text-[#FCA5A5] border border-[#B91C1C]/40 px-3 py-1 rounded-full shrink-0">
                        {pt.gender || 'Male'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#090D0F] p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />
                        <span className="text-white/90 truncate font-medium">{pt.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />
                        <span className="text-white/90 truncate font-medium">{pt.address}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2.5 pt-1 border-t border-white/10">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-[11px] font-bold text-white/60">Status:</span>
                        <select
                          value={pt.status}
                          disabled={statusUpdating}
                          onChange={(e) => handleStatusChange(pt.patient_id, e.target.value as PatientStatus)}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-white/20 bg-[#090D0F] text-white outline-none cursor-pointer focus:border-[#B91C1C] transition-all flex-1"
                        >
                          <option value="Pending Review">Pending Review</option>
                          <option value="Reviewed">Reviewed</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Treatment Started">Treatment Started</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => openPatientExactReport(pt)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-extrabold text-xs shadow-md shadow-[#B91C1C]/20 transition-all cursor-pointer"
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

                    <div className="flex flex-col gap-1.5 text-xs bg-[#090D0F] p-3 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between text-white/90">
                        <span className="text-white/60">Phone:</span>
                        <span className="font-semibold">{apt.patient_phone}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/90">
                        <span className="text-white/60">Appointment:</span>
                        <span className="font-semibold text-[#4ADE80]">{apt.date} • {apt.time_slot}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/90">
                        <span className="text-white/60">Booked at:</span>
                        <span className="font-semibold">{new Date(apt.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/90">
                        <span className="text-white/60">Care team:</span>
                        <span className="font-semibold truncate max-w-[200px]">{apt.specialist}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/90">
                        <span className="text-white/60">Mode:</span>
                        <span className="font-semibold">{apt.type}</span>
                      </div>
                    </div>

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

        {activeTab === 'logs' && (
          <div className="bg-[#121B1E] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white">Operational Log Monitor</h3>
                <p className="text-[11px] text-white/60">System events: startup, LLM, DB, email, and detailed failures</p>
              </div>
              <button
                type="button"
                onClick={loadSystemLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-bold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-white/80">
                <thead className="bg-[#090D0F] text-white/70 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-bold">Date & Time</th>
                    <th className="px-3 py-2 font-bold">Operation</th>
                    <th className="px-3 py-2 font-bold">Status</th>
                    <th className="px-3 py-2 font-bold">Latency</th>
                    <th className="px-3 py-2 font-bold">LLM</th>
                    <th className="px-3 py-2 font-bold">DB</th>
                    <th className="px-3 py-2 font-bold">Email</th>
                    <th className="px-3 py-2 font-bold">Cost</th>
                    <th className="px-3 py-2 font-bold">Error Details</th>
                  </tr>
                </thead>
                <tbody>
                  {systemLogs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-white/50">No system events recorded yet.</td>
                    </tr>
                  ) : (
                    systemLogs.map((log) => {
                      const createdAt = log.created_at ? new Date(log.created_at) : new Date();
                      const badge = getLogBadge(log.status);
                      const hasError = log.status === 'failed';

                      return (
                        <tr key={log.id} className={`border-t border-white/10 align-top ${hasError ? 'bg-red-950/20' : ''}`}>
                          <td className="px-3 py-2 whitespace-nowrap text-white/80 font-medium">
                            {createdAt.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getComponentIcon(log.operation)}
                              <span className="font-semibold text-white">{log.operation || '—'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.bgClass} ${badge.textClass}`}>
                              {badge.icon}
                              {log.status || 'unknown'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono">{log.latency_ms ?? '—'} ms</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.llm_status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : log.llm_status === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-white/50'}`}>
                              {log.llm_status || '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.db_status === 'success' ? 'bg-blue-500/20 text-blue-300' : log.db_status === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-white/50'}`}>
                              {log.db_status || '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.email_status === 'success' ? 'bg-purple-500/20 text-purple-300' : log.email_status === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-white/50'}`}>
                              {log.email_status || '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono text-white/70">${Number(log.estimated_cost_usd ?? 0).toFixed(6)}</td>
                          <td className="px-3 py-2 max-w-xs break-words">
                            {log.error_details ? (
                              <div className="bg-red-950/40 border border-red-500/30 rounded px-2 py-1 text-red-200 text-[10px]">
                                <strong>Error:</strong> {log.error_details}
                              </div>
                            ) : (
                              <span className="text-white/50">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
