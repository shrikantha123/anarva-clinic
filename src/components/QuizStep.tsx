import React, { useState, useEffect } from 'react';
import {
  Clock,
  Activity,
  MapPin,
  Droplets,
  Users,
  Calendar,
  HeartPulse,
  Pill,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Check,
  Zap,
  Flame,
} from 'lucide-react';
import { QuizAnswers } from '../types';
import { sound } from '../utils/audio';

// Images for Q3 matching user's uploaded images
import q3FrontalsImg from '../assets/images/q3_frontals_hairline_1790578848301.jpg';
import q3TempleImg from '../assets/images/q3_temple_recession_1790578857963.jpg';
import q3MidsImg from '../assets/images/q3_mid_scalp_1790578883640.jpg';
import q3CrownImg from '../assets/images/q3_crown_thinning_1790578871838.jpg';
import q3DiffuseImg from '../assets/images/q3_diffuse_thinning_1790578928292.jpg';
import q3PatchyImg from '../assets/images/patchy_hair_loss_1790577865155.jpg';
import healthyScalpImg from '../assets/images/healthy_scalp_normal_1790577886948.jpg';

// Distinct Unique Clinical Images for Q7
import q7DandruffImg from '../assets/images/scalp_dandruff_flaking_1790577831902.jpg';
import q7ItchingImg from '../assets/images/q7_itching_irritation_1790579784356.jpg';
import q7RednessImg from '../assets/images/q7_redness_erythema_1790579794827.jpg';
import q7BurningImg from '../assets/images/q7_burning_scalp_1790579810907.jpg';
import q7PainImg from '../assets/images/q7_pain_tenderness_1790579821092.jpg';
import q7OilinessImg from '../assets/images/scalp_oily_greasy_1790577875798.jpg';

interface QuizStepProps {
  initialAnswers?: QuizAnswers;
  onComplete: (answers: QuizAnswers) => void;
}

export const QuizStep: React.FC<QuizStepProps> = ({ initialAnswers, onComplete }) => {
  const [currentQ, setCurrentQ] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [answers, setAnswers] = useState<QuizAnswers>(
    initialAnswers || {
      q1_onset: '',
      q2_progression: '',
      q3_locations: [],
      q4_shedding: 2,
      q5_family: [],
      q6_events: [],
      q6_timing: '',
      q7_symptoms: [],
      q8_treatments: [],
      q8_duration: '',
    }
  );

  const [q4Interacted, setQ4Interacted] = useState(false);

  useEffect(() => {
    setErrorMsg(null);
  }, [currentQ]);

  // Validation
  const validateCurrent = (): boolean => {
    switch (currentQ) {
      case 1:
        if (!answers.q1_onset) {
          setErrorMsg('Please select an option to continue.');
          return false;
        }
        break;
      case 2:
        if (!answers.q2_progression) {
          setErrorMsg('Please select an option to continue.');
          return false;
        }
        break;
      case 3:
        if (!answers.q3_locations || answers.q3_locations.length === 0) {
          setErrorMsg('Please select at least one area to continue.');
          return false;
        }
        break;
      case 4:
        if (!q4Interacted && answers.q4_shedding === undefined) {
          setErrorMsg('Please select an option to continue.');
          return false;
        }
        break;
      case 5:
        if (!answers.q5_family || answers.q5_family.length === 0) {
          setErrorMsg('Please select at least one option to continue.');
          return false;
        }
        break;
      case 6:
        if (!answers.q6_events || answers.q6_events.length === 0) {
          setErrorMsg('Please select at least one option to continue.');
          return false;
        }
        break;
      case 7:
        if (!answers.q7_symptoms || answers.q7_symptoms.length === 0) {
          setErrorMsg('Please select at least one option to continue.');
          return false;
        }
        break;
      case 8:
        if (!answers.q8_treatments || answers.q8_treatments.length === 0) {
          setErrorMsg('Please select at least one option to continue.');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrent()) return;
    sound.playStep();
    if (currentQ < 8) {
      setCurrentQ((prev) => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentQ > 1) {
      sound.playStep();
      setCurrentQ((prev) => prev - 1);
    }
  };

  // Toggle helpers
  const toggleQ3Location = (loc: string) => {
    sound.playSelect();
    setAnswers((prev) => {
      let list = [...prev.q3_locations];
      if (loc === 'overall' || loc === 'patchy') {
        list = list.includes(loc) ? list.filter((l) => l !== loc) : [loc];
      } else {
        list = list.filter((l) => l !== 'overall' && l !== 'patchy');
        if (list.includes(loc)) {
          list = list.filter((l) => l !== loc);
        } else {
          list.push(loc);
        }
      }
      return { ...prev, q3_locations: list };
    });
    setErrorMsg(null);
  };

  const toggleQ5Family = (member: string) => {
    sound.playSelect();
    setAnswers((prev) => {
      let list = [...prev.q5_family];
      if (member === 'none' || member === 'unsure') {
        list = list.includes(member) ? [] : [member];
      } else {
        list = list.filter((m) => m !== 'none' && m !== 'unsure');
        if (list.includes(member)) {
          list = list.filter((m) => m !== member);
        } else {
          list.push(member);
        }
      }
      return { ...prev, q5_family: list };
    });
    setErrorMsg(null);
  };

  const toggleQ6Event = (evt: string) => {
    sound.playSelect();
    setAnswers((prev) => {
      let list = [...prev.q6_events];
      if (evt === 'none6' || evt === 'unsure6') {
        list = list.includes(evt) ? [] : [evt];
      } else {
        list = list.filter((e) => e !== 'none6' && e !== 'unsure6');
        if (list.includes(evt)) {
          list = list.filter((e) => e !== evt);
        } else {
          list.push(evt);
        }
      }
      return { ...prev, q6_events: list };
    });
    setErrorMsg(null);
  };

  const toggleQ7Symptom = (sym: string) => {
    sound.playSelect();
    setAnswers((prev) => {
      let list = [...prev.q7_symptoms];
      if (sym === 'none7') {
        list = list.includes('none7') ? [] : ['none7'];
      } else {
        list = list.filter((s) => s !== 'none7');
        if (list.includes(sym)) {
          list = list.filter((s) => s !== sym);
        } else {
          list.push(sym);
        }
      }
      return { ...prev, q7_symptoms: list };
    });
    setErrorMsg(null);
  };

  const toggleQ8Treatment = (treat: string) => {
    sound.playSelect();
    setAnswers((prev) => {
      let list = [...prev.q8_treatments];
      if (treat === 'none8') {
        list = list.includes('none8') ? [] : ['none8'];
      } else {
        list = list.filter((t) => t !== 'none8');
        if (list.includes(treat)) {
          list = list.filter((t) => t !== treat);
        } else {
          list.push(treat);
        }
      }
      return { ...prev, q8_treatments: list };
    });
    setErrorMsg(null);
  };

  const hasQ6Triggers = answers.q6_events.some((e) =>
    ['stress', 'illness', 'weightloss', 'diet', 'surgery', 'medication'].includes(e)
  );

  const hasQ8Treatments = answers.q8_treatments.some((t) => t !== 'none8');

  const progressPercent = Math.round((currentQ / 8) * 100);

  return (
    <div className="quiz-step h-[calc(100dvh-54px)] flex flex-col justify-between bg-[#F6F9FA] font-['Outfit'] antialiased overflow-hidden select-none">
      
      {/* Quiz Progress & Question Main Wrapper (Fills space nicely, zero scrolling) */}
      <div className="quiz-step-shell w-full max-w-4xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex flex-col flex-1 justify-between min-h-0 overflow-y-auto sm:overflow-hidden">
        
        {/* Top Progress Track */}
        <div className="flex flex-col gap-1 shrink-0 mb-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#5A6B72]">
            <span className="uppercase tracking-wider">Question {currentQ} of 8</span>
            <span className="text-[#16A34A]">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Card Container */}
        <div className="quiz-step-card bg-white border border-[#DDE5E8] rounded-2xl p-4 sm:p-6 shadow-[0_1px_4px_rgba(11,18,21,0.04)] flex flex-col justify-between flex-1 min-h-0 overflow-y-auto sm:overflow-hidden">
          
          {/* =========================================================
              QUESTION 1 — ONSET (UNIFORM HEIGHT & WIDTH TILES)
              ========================================================= */}
          {currentQ === 1 && (
            <div className="flex flex-col justify-between h-full gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Onset</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  When did you first notice your hair loss?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72] mt-0.5">
                  This helps us understand how long the hair-loss pattern has been present.
                </p>
              </div>

              {/* Uniform Equal Width & Height Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-auto">
                {[
                  { id: '<3mo', label: 'Less than 3 months', badge: 'Recent onset' },
                  { id: '3-6mo', label: '3 – 6 months', badge: 'Developing' },
                  { id: '6-12mo', label: '6 – 12 months', badge: 'Sub-acute' },
                  { id: '1-2yr', label: '1 – 2 years', badge: 'Chronic' },
                  { id: '>2yr', label: 'More than 2 years', badge: 'Established' },
                  { id: 'unsure', label: 'Not sure', badge: 'Uncertain' },
                ].map((item) => {
                  const isSelected = answers.q1_onset === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        sound.playSelect();
                        setAnswers((prev) => ({ ...prev, q1_onset: item.id }));
                        setErrorMsg(null);
                      }}
                      className={`h-22 sm:h-28 p-3 sm:p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10 shadow-xs'
                          : 'bg-white border-[#DDE5E8] hover:border-[#16A34A] hover:bg-[#F6F9FA]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-bold text-[#8FA3AB] uppercase tracking-wider">
                          {item.badge}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#16A34A] text-white' : 'border border-[#CBD5E1] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <span className={`text-xs sm:text-sm font-bold leading-tight ${isSelected ? 'text-[#0B1215]' : 'text-[#2D3A40]'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              QUESTION 2 — PROGRESSION (UNIFORM EQUAL CARDS WITH TRENDS)
              ========================================================= */}
          {currentQ === 2 && (
            <div className="flex flex-col justify-between h-full gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Pattern</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  How has your hair loss changed over time?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72] mt-0.5">
                  Choose the pattern that most closely describes your experience.
                </p>
              </div>

              {/* Uniform Equal Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 my-auto">
                {[
                  {
                    id: 'gradual',
                    name: 'Gradual and progressive',
                    curve: 'M 5,8 L 35,12 L 65,18 L 105,24',
                    dot: { cx: 105, cy: 24 },
                  },
                  {
                    id: 'sudden',
                    name: 'Sudden',
                    curve: 'M 5,8 L 50,8 L 55,24 L 105,24',
                    dot: { cx: 105, cy: 24 },
                  },
                  {
                    id: 'fluctuating',
                    name: 'Comes and goes',
                    curve: 'M 5,14 L 25,6 L 45,22 L 65,8 L 85,22 L 105,14',
                    dot: { cx: 105, cy: 14 },
                  },
                  {
                    id: 'stable',
                    name: 'Stable / little change',
                    curve: 'M 5,14 L 105,14',
                    dot: { cx: 105, cy: 14 },
                  },
                  {
                    id: 'unsure',
                    name: 'Not sure',
                    curve: '',
                    isDashed: true,
                  },
                ].map((item) => {
                  const isSelected = answers.q2_progression === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        sound.playSelect();
                        setAnswers((prev) => ({ ...prev, q2_progression: item.id }));
                        setErrorMsg(null);
                      }}
                      className={`h-20 sm:h-24 p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10 shadow-xs'
                          : 'bg-white border-[#DDE5E8] hover:border-[#16A34A] hover:bg-[#F6F9FA]'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className={`text-xs sm:text-sm font-bold leading-tight ${isSelected ? 'text-[#0B1215]' : 'text-[#2D3A40]'}`}>
                          {item.name}
                        </span>
                      </div>
                      
                      <div className="w-20 h-9 shrink-0 flex items-center justify-center bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] px-1.5">
                        <svg className="w-full h-full" viewBox="0 0 110 28" fill="none">
                          {item.isDashed ? (
                            <line x1="10" y1="14" x2="100" y2="14" stroke="#94A3B8" strokeWidth="2.5" strokeDasharray="4,4" />
                          ) : (
                            <>
                              <path d={item.curve} stroke={isSelected ? '#16A34A' : '#94A3B8'} strokeWidth="2.5" strokeLinecap="round" />
                              {item.dot && <circle cx={item.dot.cx} cy={item.dot.cy} r="3" fill={isSelected ? '#16A34A' : '#94A3B8'} />}
                            </>
                          )}
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              QUESTION 3 — LOCATION (USING USER'S EXACT UPLOADED IMAGES)
              ========================================================= */}
          {currentQ === 3 && (
            <div className="flex flex-col justify-between h-full gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Location</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  Where are you experiencing the most hair loss?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72]">
                  Select all that apply. Tap the matching scalp regions.
                </p>
              </div>

              {/* Exact user-provided realistic scalp images with UNIFORM HEIGHT & WIDTH */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-auto">
                {[
                  { id: 'front', label: 'Front / Hairline', img: q3FrontalsImg },
                  { id: 'temples', label: 'Temples', img: q3TempleImg },
                  { id: 'mid', label: 'Mid-scalp', img: q3MidsImg },
                  { id: 'crown', label: 'Crown', img: q3CrownImg },
                  { id: 'overall', label: 'Overall thinning', img: q3DiffuseImg },
                  { id: 'patchy', label: 'Patchy areas', img: q3PatchyImg },
                ].map((item) => {
                  const isSelected = answers.q3_locations.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleQ3Location(item.id)}
                      className={`group overflow-hidden rounded-xl border p-1.5 sm:p-2 text-left transition-all flex flex-col justify-between h-28 sm:h-32 cursor-pointer ${
                        isSelected
                          ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10 shadow-xs'
                          : 'bg-white border-[#DDE5E8] hover:border-[#16A34A] hover:bg-[#F6F9FA]'
                      }`}
                    >
                      {/* Scalp Image Box (Consistent Equal Height) */}
                      <div className="w-full h-18 sm:h-22 rounded-lg overflow-hidden relative bg-[#0F172A]">
                        <img
                          src={item.img}
                          alt={item.label}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center shadow-sm">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between px-1 mt-1">
                        <span className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-[#16A34A]' : 'text-[#2D3A40]'}`}>
                          {item.label}
                        </span>
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#16A34A] border-[#16A34A] text-white' : 'border-[#CBD5E1] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              QUESTION 4 — SHEDDING (LARGE PROPORTIONAL GAUGE SLIDER)
              ========================================================= */}
          {currentQ === 4 && (
            <div className="flex flex-col justify-between h-full gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Shedding</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  Have you noticed increased hair shedding?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72] mt-0.5">
                  Choose the level that best describes your day-to-day experience.
                </p>
              </div>

              {/* Severity Gauge Slider UI */}
              <div className="bg-[#F8FAFC] border border-[#DDE5E8] rounded-xl p-4 sm:p-6 my-auto flex flex-col gap-5">
                <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                  <span className="text-[#5A6B72]">Shedding Level:</span>
                  <span className="text-[#16A34A] font-bold text-sm sm:text-base bg-white px-3 py-1 rounded-full border border-[#BBF7D0]">
                    {['No noticeable increase', 'Mild shedding', 'Moderate shedding', 'Heavy shedding', 'Sudden / excessive'][answers.q4_shedding]}
                  </span>
                </div>

                {/* Track with 5 clickable stops */}
                <div className="relative flex items-center justify-between px-3 py-3">
                  <div className="absolute left-6 right-6 h-2.5 bg-[#E2E8F0] rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-[#22C55E] via-[#EAB308] to-[#EF4444] rounded-full transition-all duration-300"
                      style={{ width: `${(answers.q4_shedding / 4) * 100}%` }}
                    />
                  </div>

                  {[0, 1, 2, 3, 4].map((step) => {
                    const isSelected = answers.q4_shedding === step;
                    return (
                      <button
                        key={step}
                        type="button"
                        onClick={() => {
                          sound.playSelect();
                          setQ4Interacted(true);
                          setAnswers((prev) => ({ ...prev, q4_shedding: step }));
                          setErrorMsg(null);
                        }}
                        className={`relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#16A34A] text-white ring-4 ring-[#DCFCE7] shadow-sm scale-110'
                            : 'bg-white border-2 border-[#CBD5E1] text-[#64748B] hover:border-[#16A34A]'
                        }`}
                      >
                        {step + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Segmented Buttons of equal sizes */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 0, label: 'No noticeable' },
                    { id: 1, label: 'Mild' },
                    { id: 2, label: 'Moderate' },
                    { id: 3, label: 'Heavy' },
                    { id: 4, label: 'Sudden / excessive' },
                  ].map((lvl) => {
                    const isSelected = answers.q4_shedding === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => {
                          sound.playSelect();
                          setQ4Interacted(true);
                          setAnswers((prev) => ({ ...prev, q4_shedding: lvl.id }));
                          setErrorMsg(null);
                        }}
                        className={`h-11 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#16A34A] text-white shadow-xs'
                            : 'bg-white border border-[#DDE5E8] text-[#5A6B72] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              QUESTION 5 — FAMILY HISTORY (UNIFORM PEDIGREE CARDS)
              ========================================================= */}
          {currentQ === 5 && (
            <div className="flex flex-col justify-between h-full gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5" />
                  <span>Family History</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  Does hair loss run in your family?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72] mt-0.5">Select all that apply.</p>
              </div>

              {/* Uniform Equal Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-auto">
                {[
                  { id: 'father', label: 'Father', role: 'Immediate paternal', img: q3FrontalsImg },
                  { id: 'maternal-gf', label: 'Maternal grandfather', role: 'X-chromosome linked', img: q3CrownImg },
                  { id: 'other-relatives', label: 'Other relatives', role: 'Extended family', img: q3DiffuseImg },
                  { id: 'multiple', label: 'Multiple family members', role: 'Strong genetic marker', img: q3PatchyImg },
                  { id: 'none', label: 'No known family history', role: 'No hereditary signs', img: healthyScalpImg },
                  { id: 'unsure', label: 'Not sure', role: 'Unknown history', img: q3MidsImg },
                ].map((item) => {
                  const isSelected = answers.q5_family.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleQ5Family(item.id)}
                      className={`h-16 sm:h-20 p-3 sm:p-4 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10 shadow-xs'
                          : 'bg-white border-[#DDE5E8] hover:border-[#16A34A] hover:bg-[#F6F9FA]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0 bg-[#0F172A]">
                          <img src={item.img} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-[#0B1215]' : 'text-[#2D3A40]'}`}>
                            {item.label}
                          </span>
                          <span className="text-[11px] text-[#8FA3AB] truncate">{item.role}</span>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#16A34A] border-[#16A34A] text-white' : 'border-[#CBD5E1] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              QUESTION 6 — RECENT EVENTS & TIMING
              ========================================================= */}
          {currentQ === 6 && (
            <div className="flex flex-col justify-between h-full gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Recent Events</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  Have you recently experienced any of these?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72] mt-0.5">Select all that apply.</p>
              </div>

              {/* Uniform Equal Grid of 8 options */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-auto">
                {[
                  { id: 'stress', label: 'Significant stress' },
                  { id: 'illness', label: 'Fever or major illness' },
                  { id: 'weightloss', label: 'Major weight loss' },
                  { id: 'diet', label: 'Dietary changes' },
                  { id: 'surgery', label: 'Surgery' },
                  { id: 'medication', label: 'New medication' },
                  { id: 'none6', label: 'None of these' },
                  { id: 'unsure6', label: 'Not sure' },
                ].map((item) => {
                  const isSelected = answers.q6_events.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleQ6Event(item.id)}
                      className={`h-16 sm:h-20 p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10 shadow-xs'
                          : 'bg-white border-[#DDE5E8] hover:border-[#16A34A] hover:bg-[#F6F9FA]'
                      }`}
                    >
                      <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-[#0B1215]' : 'text-[#475569]'}`}>
                        {item.label}
                      </span>
                      {isSelected && <span className="text-[10px] text-[#16A34A] font-bold">✓ Selected</span>}
                    </button>
                  );
                })}
              </div>

              {/* Inline Timing Selector */}
              {hasQ6Triggers && (
                <div className="p-2.5 bg-[#F8FAFC] border border-[#BBF7D0] rounded-xl flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-[#0B1215]">When did this happen?</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: '<3mo', label: 'Within last 3 mo' },
                      { id: '3-6mo', label: '3 – 6 mo ago' },
                      { id: '>6mo', label: 'More than 6 mo' },
                      { id: 'unsure', label: 'Not sure' },
                    ].map((time) => {
                      const isTimeSel = answers.q6_timing === time.id;
                      return (
                        <button
                          key={time.id}
                          type="button"
                          onClick={() => {
                            sound.playSelect();
                            setAnswers((prev) => ({ ...prev, q6_timing: time.id }));
                          }}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isTimeSel ? 'bg-[#16A34A] text-white' : 'bg-white border border-[#DDE5E8] text-[#5A6B72]'
                          }`}
                        >
                          {time.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              QUESTION 7 — SCALP SYMPTOMS (EVERY OPTION HAS UNIQUE IMAGE, NO SYMPTOMS IS TEXT-ONLY)
              ========================================================= */}
          {currentQ === 7 && (
            <div className="flex flex-col justify-between h-full gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>Scalp Symptoms</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  Do you have any scalp symptoms?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72]">
                  Select all that apply.
                </p>
              </div>

              {/* 6 Unique Clinical Photo Cards + 1 Full Width Text-Only "No symptoms" card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-auto">
                {/* 1. Dandruff (Unique Macro Flaking Photo) */}
                <button
                  type="button"
                  onClick={() => toggleQ7Symptom('dandruff')}
                  className={`overflow-hidden rounded-xl border p-1.5 text-left transition-all flex flex-col justify-between h-24 sm:h-28 cursor-pointer ${
                    answers.q7_symptoms.includes('dandruff')
                      ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10'
                      : 'bg-white border-[#DDE5E8] hover:border-[#16A34A]'
                  }`}
                >
                  <div className="w-full h-15 sm:h-18 rounded-lg overflow-hidden bg-slate-900 relative">
                    <img src={q7DandruffImg} alt="Dandruff / flaking" className="w-full h-full object-cover" />
                    {answers.q7_symptoms.includes('dandruff') && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-[#0B1215] px-1 truncate">
                    Dandruff / flaking
                  </span>
                </button>

                {/* 2. Itching (Unique Irritated Scratch Macro Photo) */}
                <button
                  type="button"
                  onClick={() => toggleQ7Symptom('itching')}
                  className={`overflow-hidden rounded-xl border p-1.5 text-left transition-all flex flex-col justify-between h-24 sm:h-28 cursor-pointer ${
                    answers.q7_symptoms.includes('itching')
                      ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10'
                      : 'bg-white border-[#DDE5E8] hover:border-[#16A34A]'
                  }`}
                >
                  <div className="w-full h-15 sm:h-18 rounded-lg overflow-hidden bg-slate-900 relative">
                    <img src={q7ItchingImg} alt="Itching" className="w-full h-full object-cover" />
                    {answers.q7_symptoms.includes('itching') && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-[#0B1215] px-1 truncate">
                    Itching
                  </span>
                </button>

                {/* 3. Redness (Unique Erythematous Skin Photo) */}
                <button
                  type="button"
                  onClick={() => toggleQ7Symptom('redness')}
                  className={`overflow-hidden rounded-xl border p-1.5 text-left transition-all flex flex-col justify-between h-24 sm:h-28 cursor-pointer ${
                    answers.q7_symptoms.includes('redness')
                      ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10'
                      : 'bg-white border-[#DDE5E8] hover:border-[#16A34A]'
                  }`}
                >
                  <div className="w-full h-15 sm:h-18 rounded-lg overflow-hidden bg-slate-900 relative">
                    <img src={q7RednessImg} alt="Redness" className="w-full h-full object-cover" />
                    {answers.q7_symptoms.includes('redness') && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-[#0B1215] px-1 truncate">
                    Redness
                  </span>
                </button>

                {/* 4. Burning (Unique Inflamed Burning Scalp Photo) */}
                <button
                  type="button"
                  onClick={() => toggleQ7Symptom('burning')}
                  className={`overflow-hidden rounded-xl border p-1.5 text-left transition-all flex flex-col justify-between h-24 sm:h-28 cursor-pointer ${
                    answers.q7_symptoms.includes('burning')
                      ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10'
                      : 'bg-white border-[#DDE5E8] hover:border-[#16A34A]'
                  }`}
                >
                  <div className="w-full h-15 sm:h-18 rounded-lg overflow-hidden bg-slate-900 relative">
                    <img src={q7BurningImg} alt="Burning" className="w-full h-full object-cover" />
                    {answers.q7_symptoms.includes('burning') && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-[#0B1215] px-1 truncate">
                    Burning
                  </span>
                </button>

                {/* 5. Scalp Pain / Tenderness (Unique Tender Follicular Photo) */}
                <button
                  type="button"
                  onClick={() => toggleQ7Symptom('pain')}
                  className={`overflow-hidden rounded-xl border p-1.5 text-left transition-all flex flex-col justify-between h-24 sm:h-28 cursor-pointer ${
                    answers.q7_symptoms.includes('pain')
                      ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10'
                      : 'bg-white border-[#DDE5E8] hover:border-[#16A34A]'
                  }`}
                >
                  <div className="w-full h-15 sm:h-18 rounded-lg overflow-hidden bg-slate-900 relative">
                    <img src={q7PainImg} alt="Scalp pain / tenderness" className="w-full h-full object-cover" />
                    {answers.q7_symptoms.includes('pain') && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-[#0B1215] px-1 truncate">
                    Scalp pain / tenderness
                  </span>
                </button>

                {/* 6. Excess Oiliness (Unique Sebum Shiny Photo) */}
                <button
                  type="button"
                  onClick={() => toggleQ7Symptom('oiliness')}
                  className={`overflow-hidden rounded-xl border p-1.5 text-left transition-all flex flex-col justify-between h-24 sm:h-28 cursor-pointer ${
                    answers.q7_symptoms.includes('oiliness')
                      ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10'
                      : 'bg-white border-[#DDE5E8] hover:border-[#16A34A]'
                  }`}
                >
                  <div className="w-full h-15 sm:h-18 rounded-lg overflow-hidden bg-slate-900 relative">
                    <img src={q7OilinessImg} alt="Excess oiliness" className="w-full h-full object-cover" />
                    {answers.q7_symptoms.includes('oiliness') && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-[#0B1215] px-1 truncate">
                    Excess oiliness
                  </span>
                </button>
              </div>

              {/* 7. No Symptoms (TEXT ONLY as strictly requested) */}
              <button
                type="button"
                onClick={() => toggleQ7Symptom('none7')}
                className={`w-full py-2.5 px-4 rounded-xl border text-center transition-all flex items-center justify-center gap-2 cursor-pointer font-bold text-xs sm:text-sm mt-1 shrink-0 ${
                  answers.q7_symptoms.includes('none7')
                    ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs'
                    : 'bg-[#F8FAFC] text-[#475569] border-[#DDE5E8] hover:bg-[#F1F5F9]'
                }`}
              >
                <span>No symptoms</span>
                {answers.q7_symptoms.includes('none7') && <Check className="w-4 h-4 stroke-[3]" />}
              </button>
            </div>
          )}

          {/* =========================================================
              QUESTION 8 — TREATMENTS & DURATION
              ========================================================= */}
          {currentQ === 8 && (
            <div className="flex flex-col justify-between h-full gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  <Pill className="w-3.5 h-3.5" />
                  <span>Previous Treatments</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  Have you used any treatments for your hair loss?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72]">Select all that apply.</p>
              </div>

              {/* Uniform Equal Grid of 8 options */}
              <div className="treatment-options grid grid-cols-2 sm:grid-cols-4 gap-2 my-auto">
                {[
                  { id: 'minoxidil', label: 'Minoxidil' },
                  { id: 'finasteride', label: 'Finasteride' },
                  { id: 'other-med', label: 'Other medication' },
                  { id: 'supplements', label: 'Hair supplements' },
                  { id: 'prp', label: 'PRP' },
                  { id: 'transplant', label: 'Hair transplant' },
                  { id: 'other-treat', label: 'Other treatment' },
                  { id: 'none8', label: 'No previous treatment' },
                ].map((item) => {
                  const isSelected = answers.q8_treatments.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleQ8Treatment(item.id)}
                      className={`h-16 sm:h-20 p-3 rounded-full text-center transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#B91C1C] text-white shadow-xs'
                          : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      <span className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-[#0B1215]' : 'text-[#475569]'}`}>
                        {item.label}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-white text-[#94A3B8]'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Inline Treatment Duration Selector */}
              {hasQ8Treatments && (
                <div className="p-2.5 bg-[#F8FAFC] border border-[#BBF7D0] rounded-xl flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-[#0B1215]">How long have you used this treatment?</span>
                  <div className="treatment-duration-options grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { id: '<3mo', label: 'Less than 3 mo' },
                      { id: '3-6mo', label: '3 – 6 mo' },
                      { id: '6-12mo', label: '6 – 12 mo' },
                      { id: '>1yr', label: 'More than 1 yr' },
                      { id: 'stopped', label: 'Currently not using' },
                      { id: 'unsure', label: 'Not sure' },
                    ].map((dur) => {
                      const isDurSel = answers.q8_duration === dur.id;
                      return (
                        <button
                          key={dur.id}
                          type="button"
                          onClick={() => {
                            sound.playSelect();
                            setAnswers((prev) => ({ ...prev, q8_duration: dur.id }));
                          }}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isDurSel ? 'bg-[#16A34A] text-white' : 'bg-white border border-[#DDE5E8] text-[#5A6B72]'
                          }`}
                        >
                          {dur.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inline Error Toast */}
          {errorMsg && (
            <div className="mt-1 p-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold flex items-center gap-1.5 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Actions Bar (Compact Height: 52px) */}
      <div className="bg-white border-t border-[#DDE5E8] px-3 sm:px-6 py-2 shadow-xs shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentQ === 1}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              currentQ === 1 ? 'opacity-0 pointer-events-none' : 'text-[#5A6B72] hover:text-[#0B1215] hover:bg-[#F6F9FA]'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <span>{currentQ === 8 ? 'Proceed to Hair Photos' : 'Continue'}</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
