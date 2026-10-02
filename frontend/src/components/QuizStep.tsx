{/* =========================================================
              QUESTION 1 — ONSET (GENEROUS PADDING & RESPONSIVE LAYOUT)
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

              {/* Generous Padding Responsive Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 my-auto">
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
                      className={`min-h-[58px] sm:min-h-[72px] h-auto p-3.5 sm:p-4 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#F0FDF4] border-[#16A34A] ring-2 ring-[#16A34A]/10 shadow-xs'
                          : 'bg-white border-[#DDE5E8] hover:border-[#16A34A] hover:bg-[#F6F9FA]'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className={`text-xs sm:text-sm font-bold leading-snug break-words ${isSelected ? 'text-[#0B1215]' : 'text-[#2D3A40]'}`}>
                          {item.label}
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-[#8FA3AB] mt-0.5">
                          {item.badge}
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
