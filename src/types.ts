export interface QuizAnswers {
  q1_onset: string;
  q2_progression: string;
  q3_locations: string[];
  q4_shedding: number; // 0 to 4
  q5_family: string[];
  q6_events: string[];
  q6_timing?: string;
  q7_symptoms: string[];
  q8_treatments: string[];
  q8_duration?: string;
}

export interface PhotoData {
  front: string | null;
  mid: string | null;
  crown: string | null;
}

export interface PhotoValidationItem {
  is_valid: boolean;
  angle_correct: boolean;
  quality_pass: boolean;
  rejection_reason?: string;
}

export interface PhotoValidationResult {
  all_valid: boolean;
  front: PhotoValidationItem;
  mid: PhotoValidationItem;
  crown: PhotoValidationItem;
}

export interface TreatmentLikelihood {
  probability_pct: number;
  trigger: string;
  description: string;
}

export interface DoctorTreatments {
  prp: TreatmentLikelihood;
  gfc: TreatmentLikelihood;
  medical_therapy: TreatmentLikelihood;
  hair_transplant: TreatmentLikelihood;
  topical_care: TreatmentLikelihood;
}

export interface HairLossReason {
  reason: string;
  percentage: number;
  explanation: string;
}

export interface ScalpFinding {
  condition: string;
  severity_pct: number;
  observation: string;
}

export type ConsultationUrgency = 'low' | 'medium' | 'high';

export interface ConsultationAdvice {
  urgency: ConsultationUrgency;
  confidence_pct: number;
  reason: string;
  recommended_timeframe: string;
}

export interface NextStep {
  title: string;
  description: string;
}

/** Shape returned by POST /api/analyze (analysis branch), in camelCase for the UI. */
export interface AnalysisResult {
  norwoodStage: number;
  stageName: string;
  stageDescription: string;
  overallScore: number;
  frontDensity: number;
  midDensity: number;
  crownDensity: number;
  follicularHealth: number;
  dandruffLevel: number;
  oilinessLevel: number;
  flakingLevel: number;
  rednessLevel: number;
  irritationLevel: number;
  hairLossReasons: HairLossReason[];
  scalpFindings: ScalpFinding[];
  clinicalObservations: string[];
  consultation: ConsultationAdvice;
  recommendations: NextStep[];
  confidencePct: number;
  limitations?: string;
  doctorTreatments?: DoctorTreatments;
  doctorClinicalBrief?: string;
  assessmentId?: string;
}

/** Raw JSON payload returned by the analysis API. */
export interface AnalyzeApiResponse {
  image_validation: PhotoValidationResult;
  analysis?: {
    norwood_stage: number;
    stage_name: string;
    stage_description: string;
    front_density: number;
    mid_density: number;
    crown_density: number;
    overall_health_score: number;
    follicular_health_pct: number;
    dandruff_index: number;
    sebum_oiliness_index: number;
    flaking_level: number;
    redness_index: number;
    scalp_irritation_index: number;
    hair_loss_reasons: HairLossReason[];
    scalp_findings: ScalpFinding[];
    clinical_observations: string[];
    consultation: ConsultationAdvice;
    next_steps: NextStep[];
    doctor_treatments?: DoctorTreatments;
    doctor_clinical_brief?: string;
    overall_confidence_pct: number;
    limitations?: string;
  };
  error?: string;
}

export interface UserInfo {
  name: string;
  phone: string;
  gender: string;
  address: string;
  age?: string;
}

export type PatientStatus =
  | 'Pending Review'
  | 'Reviewed'
  | 'Contacted'
  | 'Treatment Started'
  | 'Completed';

export interface PatientAssessmentRecord {
  id?: string;
  patient_id: string;
  name: string;
  phone: string;
  gender: string;
  address: string;
  age?: string;
  quiz_answers: QuizAnswers;
  photo_urls: {
    front: string;
    mid: string;
    crown: string;
  };
  analysis: AnalysisResult;
  status: PatientStatus;
  created_at: string;
}

export interface AppointmentRecord {
  id: string;
  appointment_id: string;
  patient_name: string;
  patient_phone: string;
  specialist: string;
  date: string;
  time_slot: string;
  type: string;
  notes?: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  created_at: string;
}
