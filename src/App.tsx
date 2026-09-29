import React, { useState } from 'react';
import { Header } from './components/Header';
import { QuizStep } from './components/QuizStep';
import { PhotosStep } from './components/PhotosStep';
import { AnalysisStep } from './components/AnalysisStep';
import { UserInfoStep } from './components/UserInfoStep';
import { ReportStep } from './components/ReportStep';
import { DoctorPortal } from './components/DoctorPortal';
import {
  QuizAnswers,
  PhotoData,
  UserInfo,
  AnalysisResult,
  PhotoValidationResult,
} from './types';

type AppStep = 'quiz' | 'photos' | 'analysis' | 'info' | 'report' | 'doctor';

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(() =>
    new URLSearchParams(window.location.search).has('doctor') ? 'doctor' : 'quiz'
  );

  // Quiz state
  const [answers, setAnswers] = useState<QuizAnswers>({
    q1_onset: '',
    q2_progression: '',
    q3_locations: [],
    q4_shedding: 0,
    q5_family: [],
    q6_events: [],
    q6_timing: '',
    q7_symptoms: [],
    q8_treatments: [],
    q8_duration: '',
  });

  // Photos state
  const [photos, setPhotos] = useState<PhotoData>({
    front: null,
    mid: null,
    crown: null,
  });

  // Photo validation result from Gemini (if any image failed)
  const [validationResult, setValidationResult] = useState<PhotoValidationResult | null>(null);

  // User Info state
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    phone: '',
    gender: '',
    address: '',
    age: '',
  });

  // AI analysis result — only ever set from the backend response
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Assessment unique ID
  const [assessmentId, setAssessmentId] = useState<string>(
    () => `ANR-${Math.floor(1000 + Math.random() * 9000)}-26`
  );

  // Transitions
  const handleQuizComplete = (completedAnswers: QuizAnswers) => {
    setAnswers(completedAnswers);
    setCurrentStep('photos');
  };

  const handlePhotosComplete = (capturedPhotos: PhotoData) => {
    setPhotos(capturedPhotos);
    setValidationResult(null); // Clear previous rejection
    setCurrentStep('analysis');
  };

  const handleAnalysisSuccess = (aiAnalysis: AnalysisResult) => {
    setAnalysis(aiAnalysis);
    setCurrentStep('info');
  };

  const handleValidationFailure = (validation: PhotoValidationResult) => {
    setValidationResult(validation);
    // Clear only the rejected photo slot(s) so patient only retakes invalid ones
    setPhotos((prev) => ({
      front: validation.front?.is_valid === false ? null : prev.front,
      mid: validation.mid?.is_valid === false ? null : prev.mid,
      crown: validation.crown?.is_valid === false ? null : prev.crown,
    }));
    // Return to photos step immediately with failure highlighted
    setCurrentStep('photos');
  };

  const handleUserInfoComplete = (info: UserInfo) => {
    setUserInfo(info);
    setAnalysis((prev) => (prev ? { ...prev, assessmentId } : prev));
    // 1. Immediately display patient report
    setCurrentStep('report');

    // 2. Save assessment to Supabase in background (does not block patient view)
    fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: assessmentId,
        name: info.name,
        phone: info.phone,
        gender: info.gender,
        address: info.address,
        quiz_answers: answers,
        photo_urls: {
          front: photos.front,
          mid: photos.mid,
          crown: photos.crown,
        },
        analysis,
      }),
    }).catch((err) => {
      console.warn('Background assessment save notice:', err);
    });
  };

  const handleRestart = () => {
    setAssessmentId(`ANR-${Math.floor(1000 + Math.random() * 9000)}-26`);
    setValidationResult(null);
    setPhotos({ front: null, mid: null, crown: null });
    setAnalysis(null);
    setCurrentStep('quiz');
  };

  if (currentStep === 'doctor') {
    return <DoctorPortal onBackToApp={() => setCurrentStep(analysis ? 'report' : 'quiz')} />;
  }

  const renderActiveStep = () => {
    switch (currentStep) {
      case 'quiz':
        return <QuizStep initialAnswers={answers} onComplete={handleQuizComplete} />;
      case 'photos':
        return (
          <PhotosStep
            initialPhotos={photos}
            validationResult={validationResult}
            onComplete={handlePhotosComplete}
            onBack={() => setCurrentStep('quiz')}
          />
        );
      case 'analysis':
        return (
          <AnalysisStep
            photos={photos}
            answers={answers}
            onAnalysisSuccess={handleAnalysisSuccess}
            onValidationFailure={handleValidationFailure}
            onBackToPhotos={() => setCurrentStep('photos')}
          />
        );
      case 'info':
        return (
          <UserInfoStep
            initialInfo={userInfo}
            onComplete={handleUserInfoComplete}
          />
        );
      case 'report':
        return analysis ? (
          <ReportStep
            userInfo={userInfo}
            photos={photos}
            analysis={analysis}
            onRestart={handleRestart}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9]">
      {/* Persistent Anarva Clinic Header */}
      <Header />

      <main className="flex-1 flex flex-col bg-[#F6F9FA]">
        {renderActiveStep()}
      </main>

    </div>
  );
}
