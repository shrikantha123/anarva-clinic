return (
    <div className="quiz-step min-h-[calc(100dvh-54px)] flex flex-col justify-between bg-[#F6F9FA] font-['Outfit'] antialiased select-none">
      
      {/* Quiz Progress & Question Main Wrapper */}
      <div className="quiz-step-shell w-full max-w-4xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex flex-col flex-1 justify-between min-h-0">
        <div className="quiz-step-content-group flex flex-col flex-1 min-h-0">
        {/* Top Progress Track */}
        <div className="quiz-progress flex flex-col gap-1 shrink-0 mb-1.5">
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
        <div className="quiz-step-card bg-white border border-[#DDE5E8] rounded-2xl p-3.5 sm:p-6 shadow-[0_1px_4px_rgba(11,18,21,0.04)] flex flex-col justify-between flex-1 min-h-0">
          
          {/* =========================================================
              QUESTION 1 — ONSET
              ========================================================= */}
          {currentQ === 1 && (
            <div className="flex flex-col justify-between h-full gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Onset</span>
                </div>
                <h2 className="text-base sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  When did you first notice your hair loss?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72] mt-0.5">
                  This helps us understand how long the hair-loss pattern has been present.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 my-auto">
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
                      className={`min-h-[76px] sm:min-h-[90px] h-auto p-2.5 sm:p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10 shadow-xs'
                          : 'bg-white border-[#DDE5E8] hover:border-[#16A34A] hover:bg-[#F6F9FA]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full gap-1">
                        <span className="text-[9px] sm:text-[10px] font-bold text-[#8FA3AB] uppercase tracking-wider truncate">
                          {item.badge}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-[#16A34A] text-white' : 'border border-[#CBD5E1] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <span className={`text-xs sm:text-sm font-bold leading-snug break-words mt-1 ${isSelected ? 'text-[#0B1215]' : 'text-[#2D3A40]'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              QUESTION 2 — PROGRESSION
              ========================================================= */}
          {currentQ === 2 && (
            <div className="flex flex-col justify-between h-full gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Progression</span>
                </div>
                <h2 className="text-base sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  How would you describe the progression?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72] mt-0.5">
                  Select the option that best matches your pattern over time.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 my-auto">
                {[
                  { id: 'gradual', title: 'Gradual', desc: 'Slow thinning over months or years', badge: 'Standard' },
                  { id: 'rapid', title: 'Rapid', desc: 'Noticeable loss over weeks', badge: 'Active' },
                  { id: 'sudden', title: 'Sudden', desc: 'Woke up with sudden clumps or patches', badge: 'Acute' },
                  { id: 'fluctuating', title: 'Fluctuating', desc: 'Periods of loss followed by recovery', badge: 'Episodic' },
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
                      className={`min-h-[72px] sm:min-h-[84px] h-auto p-3 sm:p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10 shadow-xs'
                          : 'bg-white border-[#DDE5E8] hover:border-[#16A34A] hover:bg-[#F6F9FA]'
                      }`}
                    >
                      <div className="flex flex-col flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-[#0B1215]' : 'text-[#2D3A40]'}`}>
                            {item.title}
                          </span>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">
                            {item.badge}
                          </span>
                        </div>
                        <span className="text-[11px] sm:text-xs text-[#5A6B72] mt-0.5 leading-snug break-words">
                          {item.desc}
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-[#16A34A] text-white' : 'border border-[#CBD5E1] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              QUESTION 3 — AFFECTED REGIONS
              ========================================================= */}
          {currentQ === 3 && (
            <div className="flex flex-col justify-between h-full gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Affected Areas</span>
                </div>
                <h2 className="text-base sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  Which parts of your scalp are affected by hair loss?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72]">
                  Select all that apply. Tap the matching scalp regions.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 my-auto">
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
                      className={`group overflow-hidden rounded-xl border p-1.5 sm:p-2 text-left transition-all flex flex-col justify-between min-h-[116px] sm:min-h-[130px] h-auto cursor-pointer ${
                        isSelected
                          ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10 shadow-xs'
                          : 'bg-white border-[#DDE5E8] hover:border-[#16A34A] hover:bg-[#F6F9FA]'
                      }`}
                    >
                      <div className="w-full h-16 sm:h-20 rounded-lg overflow-hidden relative bg-[#0F172A]">
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

                      <div className="flex items-center justify-between px-0.5 mt-1">
                        <span className={`text-xs font-bold leading-tight break-words truncate ${isSelected ? 'text-[#16A34A]' : 'text-[#2D3A40]'}`}>
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
              QUESTION 4 — SHEDDING
              ========================================================= */}
          {currentQ === 4 && (
            <div className="flex flex-col justify-between h-full gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Shedding</span>
                </div>
                <h2 className="text-base sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  Have you noticed increased hair shedding?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72] mt-0.5">
                  Choose the level that best describes your day-to-day experience.
                </p>
              </div>

              <div className="my-auto space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
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
                        className={`min-h-[42px] sm:min-h-[44px] h-auto py-2 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center cursor-pointer text-center leading-snug break-words ${
                          lvl.id === 4 ? 'col-span-2 sm:col-span-1' : ''
                        } ${
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
              QUESTION 5 — FAMILY HISTORY
              ========================================================= */}
          {currentQ === 5 && (
            <div className="flex flex-col justify-between h-full gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5" />
                  <span>Family History</span>
                </div>
                <h2 className="text-base sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  Does hair loss run in your family?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72] mt-0.5">Select all that apply.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 my-auto">
                {[
                  { id: 'father', label: 'Father', role: 'Immediate paternal', img: fatherImg },
                  { id: 'mother', label: 'Mother', role: 'Immediate maternal', img: motherImg },
                  { id: 'multiple', label: 'Multiple family members', role: 'Strong genetic marker', img: familyImg },
                  { id: 'uncle', label: 'Uncle', role: 'Extended family', img: uncleImg },
                  { id: 'none', label: 'No family history', role: 'No hereditary signs', img: healthyScalpImg },
                ].map((item) => {
                  const isSelected = answers.q5_family.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleQ5Family(item.id)}
                      className={`min-h-[64px] sm:min-h-[72px] h-auto p-2.5 sm:p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10 shadow-xs'
                          : 'bg-white border-[#DDE5E8] hover:border-[#16A34A] hover:bg-[#F6F9FA]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-11 h-9 sm:w-12 sm:h-10 rounded-lg overflow-hidden shrink-0 bg-[#0F172A]">
                          <img src={item.img} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs sm:text-sm font-bold break-words leading-tight ${isSelected ? 'text-[#0B1215]' : 'text-[#2D3A40]'}`}>
                            {item.label}
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-[#8FA3AB] break-words mt-0.5">{item.role}</span>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#16A34A] border-[#16A34A] text-white' : 'border-[#CBD5E1] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
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
                <h2 className="text-base sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  Have you recently experienced any of these?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72] mt-0.5">Select all that apply.</p>
              </div>

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
                      className={`min-h-[60px] sm:min-h-[70px] h-auto p-2 sm:p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10 shadow-xs'
                          : 'bg-white border-[#DDE5E8] hover:border-[#16A34A] hover:bg-[#F6F9FA]'
                      }`}
                    >
                      <span className={`text-[11px] sm:text-xs font-bold leading-tight break-words text-center ${isSelected ? 'text-[#0B1215]' : 'text-[#475569]'}`}>
                        {item.label}
                      </span>
                      {isSelected && <span className="text-[9px] text-[#16A34A] font-extrabold mt-0.5">✓ Selected</span>}
                    </button>
                  );
                })}
              </div>

              {hasQ6Triggers && (
                <div className="p-2.5 bg-[#F8FAFC] border border-[#BBF7D0] rounded-xl flex flex-col gap-1.5 mt-1">
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
                          className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer text-center leading-tight ${
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
              QUESTION 7 — SCALP SYMPTOMS
              ========================================================= */}
          {currentQ === 7 && (
            <div className="flex flex-col justify-between h-full gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>Scalp Symptoms</span>
                </div>
                <h2 className="text-base sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  Do you have any scalp symptoms?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72]">
                  Select all that apply.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 my-auto">
                {[
                  { id: 'dandruff', label: 'Dandruff / flaking', img: q7DandruffImg },
                  { id: 'itching', label: 'Itching', img: q7ItchingImg },
                  { id: 'redness', label: 'Redness', img: q7RednessImg },
                  { id: 'burning', label: 'Burning', img: q7BurningImg },
                  { id: 'pain', label: 'Pain / tenderness', img: q7PainImg },
                  { id: 'oiliness', label: 'Excess oiliness', img: q7OilinessImg },
                ].map((symptom) => {
                  const isSelected = answers.q7_symptoms.includes(symptom.id);
                  return (
                    <button
                      key={symptom.id}
                      type="button"
                      onClick={() => toggleQ7Symptom(symptom.id)}
                      className={`overflow-hidden rounded-xl border p-1.5 pb-2 text-left transition-all flex flex-col justify-between min-h-[105px] sm:min-h-[120px] h-auto cursor-pointer ${
                        isSelected
                          ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10'
                          : 'bg-white border-[#DDE5E8] hover:border-[#16A34A]'
                      }`}
                    >
                      <div className="w-full h-15 sm:h-18 rounded-lg overflow-hidden bg-slate-900 relative">
                        <img src={symptom.img} alt={symptom.label} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-[#0B1215] px-0.5 line-clamp-1 break-words mt-1">
                        {symptom.label}
                      </span>
                    </button>
                  );
                })}
              </div>

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
                <h2 className="text-base sm:text-2xl font-bold text-[#0B1215] tracking-tight leading-snug">
                  Have you used any treatments for your hair loss?
                </h2>
                <p className="text-xs sm:text-sm text-[#5A6B72]">Select all that apply.</p>
              </div>

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
                      className={`min-h-[52px] sm:min-h-[60px] h-auto p-2.5 sm:p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10 shadow-xs'
                          : 'bg-white border-[#DDE5E8] hover:border-[#16A34A] hover:bg-[#F6F9FA]'
                      }`}
                    >
                      <span className={`text-[11px] sm:text-xs font-bold break-words leading-tight flex-1 ${isSelected ? 'text-[#0B1215]' : 'text-[#475569]'}`}>
                        {item.label}
                      </span>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#16A34A] border-[#16A34A] text-white' : 'border-[#CBD5E1] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {hasQ8Treatments && (
                <div className="p-2.5 bg-[#F8FAFC] border border-[#BBF7D0] rounded-xl flex flex-col gap-1.5 mt-1">
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
                          className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer text-center leading-tight ${
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
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="sticky bottom-0 z-40 bg-white border-t border-[#DDE5E8] px-3 sm:px-6 py-2 shadow-xs shrink-0">
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
