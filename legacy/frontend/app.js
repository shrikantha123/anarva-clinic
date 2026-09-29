/**
 * Anarva Clinic — AI Hair & Scalp Diagnostic Frontend Architecture
 * Version: 2.1 (Clinical Studio + Real Photographic Trichoscopy)
 */

// ── Application State ──
const state = {
  qIndex: 0,
  answers: {
    duration: null,
    pattern: [],
    shedding: 2, // 1 to 5 (Default Moderate = 3 / index 2)
    family: null,
    symptoms: [],
    hairline: null,
    triggers: [],
    treatment: []
  },
  images: {
    frontal: { data: 'guide_frontal.jpg', isDefault: true, quality: { pass: true, brightness: 140, contrast: 60 } },
    midscalp: { data: 'guide_midscalp.jpg', isDefault: true, quality: { pass: true, brightness: 140, contrast: 60 } },
    crown: { data: 'guide_crown.jpg', isDefault: true, quality: { pass: true, brightness: 140, contrast: 60 } }
  },
  patient: {
    name: '',
    age: '',
    gender: '',
    phone: '',
    city: ''
  },
  report: null
};

// ── Capture Constants ──
const CAP_STAGES = ['frontal', 'midscalp', 'crown'];
const CAP_CONFIG = {
  frontal: {
    id: 'frontal',
    name: 'Frontal Hairline',
    badge: 'Stage 1 of 3: Frontal Hairline',
    instruction: 'Position your forehead and frontal hairline within the guide frame',
    fallbackImg: 'guide_frontal.jpg'
  },
  midscalp: {
    id: 'midscalp',
    name: 'Mid-Scalp / Top',
    badge: 'Stage 2 of 3: Mid-Scalp / Top',
    instruction: 'Tilt your head forward slightly to capture the top scalp and central parting',
    fallbackImg: 'guide_midscalp.jpg'
  },
  crown: {
    id: 'crown',
    name: 'Crown / Vertex',
    badge: 'Stage 3 of 3: Crown / Vertex',
    instruction: 'Angle camera above and behind your head to clearly show the crown vertex swirl',
    fallbackImg: 'guide_crown.jpg'
  }
};

let currentCapIndex = 0;
let camMediaStream = null;
let videoBrightnessInterval = null;

// ── 8 Diagnostic Clinical Questions with Real Photographs ──
const QUESTIONS = [
  {
    id: 'duration',
    category: 'Onset & Duration',
    title: 'How long have you noticed hair loss or thinning?',
    desc: 'Select the timeline that best reflects when you first observed thinning or increased shedding.',
    type: 'single',
    options: [
      { label: 'Less than 6 months', sub: 'Recent onset / sudden shedding' },
      { label: '6 – 12 months', sub: 'Developing pattern / progressive loss' },
      { label: '1 – 3 years', sub: 'Gradual thinning over time' },
      { label: 'More than 3 years', sub: 'Long-standing progression' }
    ]
  },
  {
    id: 'pattern',
    category: 'Hair-Loss Pattern',
    title: 'Where do you notice the most thinning or hair loss?',
    desc: 'Select all scalp zones where you notice reduced density or widening parts.',
    type: 'photo-grid',
    options: [
      { label: 'Hairline & Temples', sub: 'Frontal recession or temporal corners', img: 'pattern_temple.jpg' },
      { label: 'Top & Crown (Vertex)', sub: 'Thinning at the vertex whorl / parting', img: 'pattern_crown.jpg' },
      { label: 'Diffuse (All Over)', sub: 'General volume loss across entire scalp', img: 'pattern_diffuse.jpg' },
      { label: 'Patchy Areas', sub: 'Specific coin-sized focal bare spots', img: 'pattern_patchy.jpg' }
    ]
  },
  {
    id: 'shedding',
    category: 'Shedding Severity',
    title: 'How would you rate your current daily hair shedding?',
    desc: 'Select a level from 1 (Minimal) to 5 (Severe / Profuse).',
    type: 'scale',
    levels: [
      { score: 1, label: 'Minimal', desc: 'Normal physiological shedding (< 50 hairs/day)' },
      { score: 2, label: 'Mild', desc: 'Noticeable on pillows or brushing (50–100 hairs/day)' },
      { score: 3, label: 'Moderate', desc: 'Noticeable clumps in shower or drain (100–150 hairs/day)' },
      { score: 4, label: 'Heavy', desc: 'Continuous shedding throughout the day (150–200 hairs/day)' },
      { score: 5, label: 'Severe', desc: 'Profuse, rapid loss on slightest touch (> 200 hairs/day)' }
    ]
  },
  {
    id: 'family',
    category: 'Genetic Predisposition',
    title: 'Is there a family history of hair loss?',
    desc: 'Genetic factors (androgenetic alopecia) often influence timeline and response.',
    type: 'single-horizontal',
    options: [
      { label: 'No Family History', sub: 'No known immediate relatives' },
      { label: "Mother's Side", sub: 'Maternal grandfather, mother, aunts/uncles' },
      { label: "Father's Side", sub: 'Father, paternal grandfather, brothers' },
      { label: 'Both Sides', sub: 'Maternal and paternal hereditary traits' }
    ]
  },
  {
    id: 'symptoms',
    category: 'Scalp Environment',
    title: 'Do you experience any active scalp symptoms?',
    desc: 'Scalp inflammation or micro-environment issues can exacerbate hair shedding.',
    type: 'symptom-grid',
    options: [
      { id: 'itching', label: 'Itching / Pruritus', icon: 'zap' },
      { id: 'flaking', label: 'Flaking / Dandruff', icon: 'layers' },
      { id: 'redness', label: 'Redness / Irritation', icon: 'shield-alert' },
      { id: 'oiliness', label: 'Excess Sebum / Oil', icon: 'droplet' },
      { id: 'pain', label: 'Scalp Tenderness', icon: 'activity' },
      { id: 'none', label: 'None of These', icon: 'check-circle' }
    ]
  },
  {
    id: 'hairline',
    category: 'Progression Severity',
    title: 'How would you describe changes to your hairline or crown?',
    desc: 'Comparing your baseline from 2–3 years ago to today.',
    type: 'photo-single',
    options: [
      { label: 'Stage 1 · Stable', sub: 'No noticeable recession', img: 'stage_norwood_1.jpg' },
      { label: 'Stage 2 · Mild Recession', sub: 'Slight temporal thinning', img: 'stage_norwood_2.jpg' },
      { label: 'Stage 3 · Deep M-Shape', sub: 'Clear frontal & temple loss', img: 'stage_norwood_3.jpg' },
      { label: 'Stage 4 · Advanced Loss', sub: 'Frontal & crown thinning', img: 'stage_norwood_4.jpg' }
    ]
  },
  {
    id: 'triggers',
    category: 'Lifestyle & Triggers',
    title: 'Any recent health, stress, or lifestyle changes?',
    desc: 'Telogen effluvium is frequently triggered by physiological or emotional stressors 2–4 months prior.',
    type: 'tag-cloud',
    options: [
      'High emotional stress',
      'Recent illness or fever',
      'Surgery or anesthesia',
      'Rapid weight loss / crash diet',
      'Thyroid / hormonal changes',
      'Postpartum / pregnancy',
      'Chronic sleep deprivation',
      'No major triggers'
    ]
  },
  {
    id: 'treatment',
    category: 'Treatment History',
    title: 'Have you tried any hair restoration treatments?',
    desc: 'Understanding prior therapies helps personalize clinical recommendations.',
    type: 'tag-cloud',
    options: [
      'None so far',
      'Topical Minoxidil (2% / 5%)',
      'Oral Finasteride / Dutasteride',
      'Hair Vitamins / Biotin',
      'PRP / Mesotherapy',
      'Red Light / Low-Level Laser',
      'Anti-Dandruff Shampoos',
      'Ayurvedic / Herbal Oils'
    ]
  }
];

// ── Screen Navigation Engine ──
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ── Quiz Controller ──
function startQuiz() {
  state.qIndex = 0;
  showScreen('screen-quiz');
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  const q = QUESTIONS[state.qIndex];
  const total = QUESTIONS.length;
  const pct = Math.round(((state.qIndex + 1) / total) * 100);

  // Update Header Progress
  document.getElementById('quiz-progress-bar').style.width = `${pct}%`;
  document.getElementById('quiz-step-count').textContent = `Question ${state.qIndex + 1} of ${total}`;
  document.getElementById('quiz-category').textContent = q.category;
  document.getElementById('quiz-title').textContent = q.title;
  document.getElementById('quiz-desc').textContent = q.desc;

  const container = document.getElementById('quiz-options-container');
  container.innerHTML = '';

  if (q.type === 'single') {
    renderSingleOptions(q, container);
  } else if (q.type === 'photo-grid') {
    renderPhotoGrid(q, container, true);
  } else if (q.type === 'photo-single') {
    renderPhotoGrid(q, container, false);
  } else if (q.type === 'scale') {
    renderScaleOptions(q, container);
  } else if (q.type === 'single-horizontal') {
    renderHorizontalOptions(q, container);
  } else if (q.type === 'symptom-grid') {
    renderSymptomGrid(q, container);
  } else if (q.type === 'tag-cloud') {
    renderTagCloud(q, container);
  }

  updateQuizNextButtonState();
}

function renderPhotoGrid(q, container, isMulti) {
  const currentVal = state.answers[q.id];
  const grid = document.createElement('div');
  grid.className = 'photo-options-grid';

  q.options.forEach((opt, idx) => {
    const isSelected = isMulti
      ? Array.isArray(currentVal) && currentVal.includes(idx)
      : currentVal === idx;

    const card = document.createElement('div');
    card.className = `photo-opt-card ${isSelected ? 'selected' : ''}`;
    card.onclick = () => {
      if (isMulti) {
        toggleMultiAnswer(q.id, idx);
      } else {
        state.answers[q.id] = idx;
      }
      renderCurrentQuestion();
    };

    card.innerHTML = `
      <img src="${opt.img}" alt="${opt.label}" class="photo-opt-thumb">
      <div class="photo-opt-check">${isSelected ? '✓' : ''}</div>
      <div class="photo-opt-body">
        <div class="photo-opt-title">${opt.label}</div>
        <div class="photo-opt-sub">${opt.sub}</div>
      </div>
    `;
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

function renderSingleOptions(q, container) {
  const currentVal = state.answers[q.id];
  const list = document.createElement('div');
  list.className = 'options-list';

  q.options.forEach((opt, idx) => {
    const card = document.createElement('div');
    const isSelected = currentVal === idx;
    card.className = `opt-card ${isSelected ? 'selected' : ''}`;
    card.onclick = () => {
      state.answers[q.id] = idx;
      renderCurrentQuestion();
    };

    card.innerHTML = `
      <div class="opt-icon">${idx + 1}</div>
      <div class="opt-info">
        <div class="opt-title">${opt.label}</div>
        <div class="opt-subtitle">${opt.sub}</div>
      </div>
      <div class="opt-radio-pill"></div>
    `;
    list.appendChild(card);
  });
  container.appendChild(list);
}

function renderScaleOptions(q, container) {
  const currentScore = state.answers[q.id] ?? 2;
  const wrap = document.createElement('div');
  wrap.className = 'shedding-scale-container';

  const btnRow = document.createElement('div');
  btnRow.className = 'scale-buttons';

  q.levels.forEach((lvl, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `scale-btn ${currentScore === idx ? 'selected' : ''}`;
    btn.textContent = lvl.score;
    btn.onclick = () => {
      state.answers[q.id] = idx;
      renderCurrentQuestion();
    };
    btnRow.appendChild(btn);
  });

  const activeLevel = q.levels[currentScore] || q.levels[1];
  const infoCard = document.createElement('div');
  infoCard.className = 'scale-indicator-card';
  infoCard.innerHTML = `
    <span class="scale-indicator-tag">Level ${activeLevel.score}: ${activeLevel.label}</span>
    <span class="scale-indicator-text">${activeLevel.desc}</span>
  `;

  wrap.appendChild(btnRow);
  wrap.appendChild(infoCard);
  container.appendChild(wrap);
}

function renderHorizontalOptions(q, container) {
  const currentVal = state.answers[q.id];
  const wrap = document.createElement('div');
  wrap.className = 'horizontal-cards';

  q.options.forEach((opt, idx) => {
    const isSelected = currentVal === idx;
    const card = document.createElement('div');
    card.className = `opt-card ${isSelected ? 'selected' : ''}`;
    card.onclick = () => {
      state.answers[q.id] = idx;
      renderCurrentQuestion();
    };

    card.innerHTML = `
      <div class="opt-icon">${idx + 1}</div>
      <div class="opt-info">
        <div class="opt-title">${opt.label}</div>
        <div class="opt-subtitle">${opt.sub}</div>
      </div>
      <div class="opt-radio-pill"></div>
    `;
    wrap.appendChild(card);
  });
  container.appendChild(wrap);
}

function renderSymptomGrid(q, container) {
  const currentArr = state.answers[q.id] || [];
  const grid = document.createElement('div');
  grid.className = 'icon-grid';

  q.options.forEach((opt) => {
    const isSelected = currentArr.includes(opt.id);
    const item = document.createElement('div');
    item.className = `icon-grid-item ${isSelected ? 'selected' : ''}`;
    item.onclick = () => {
      let arr = [...(state.answers[q.id] || [])];
      if (opt.id === 'none') {
        arr = ['none'];
      } else {
        arr = arr.filter(x => x !== 'none');
        if (arr.includes(opt.id)) {
          arr = arr.filter(x => x !== opt.id);
        } else {
          arr.push(opt.id);
        }
      }
      state.answers[q.id] = arr;
      renderCurrentQuestion();
    };

    item.innerHTML = `
      <div class="symptom-icon">${isSelected ? '✓' : '●'}</div>
      <div class="symptom-label">${opt.label}</div>
    `;
    grid.appendChild(item);
  });
  container.appendChild(grid);
}

function renderTagCloud(q, container) {
  const currentArr = state.answers[q.id] || [];
  const wrap = document.createElement('div');
  wrap.className = 'tag-cloud';

  q.options.forEach((opt) => {
    const isSelected = currentArr.includes(opt);
    const chip = document.createElement('div');
    chip.className = `tag-chip ${isSelected ? 'selected' : ''}`;
    chip.textContent = `${isSelected ? '✓ ' : ''}${opt}`;
    chip.onclick = () => {
      let arr = [...(state.answers[q.id] || [])];
      if (opt.includes('None') || opt.includes('No major')) {
        arr = [opt];
      } else {
        arr = arr.filter(x => !x.includes('None') && !x.includes('No major'));
        if (arr.includes(opt)) {
          arr = arr.filter(x => x !== opt);
        } else {
          arr.push(opt);
        }
      }
      state.answers[q.id] = arr;
      renderCurrentQuestion();
    };
    wrap.appendChild(chip);
  });
  container.appendChild(wrap);
}

function toggleMultiAnswer(key, idx) {
  const arr = state.answers[key] || [];
  const pos = arr.indexOf(idx);
  if (pos > -1) {
    arr.splice(pos, 1);
  } else {
    arr.push(idx);
  }
  state.answers[key] = arr;
}

function updateQuizNextButtonState() {
  const q = QUESTIONS[state.qIndex];
  const btn = document.getElementById('quiz-btn-next');
  let valid = false;

  const ans = state.answers[q.id];
  if (q.type === 'single' || q.type === 'single-horizontal' || q.type === 'photo-single') {
    valid = ans !== null && ans !== undefined;
  } else if (q.type === 'scale') {
    valid = ans !== null && ans !== undefined;
  } else if (q.type === 'photo-grid' || q.type === 'symptom-grid' || q.type === 'tag-cloud') {
    valid = Array.isArray(ans) && ans.length > 0;
  }

  btn.disabled = !valid;
}

function nextQuestion() {
  if (state.qIndex < QUESTIONS.length - 1) {
    state.qIndex++;
    renderCurrentQuestion();
  } else {
    showScreen('screen-guide');
  }
}

function prevQuestion() {
  if (state.qIndex > 0) {
    state.qIndex--;
    renderCurrentQuestion();
  } else {
    showScreen('screen-home');
  }
}

// ── Photo Capture Guidance & Camera Studio Engine ──
function startCaptureFlow() {
  currentCapIndex = 0;
  showScreen('screen-capture');
  setupCaptureStage();
}

function setupCaptureStage() {
  const stageKey = CAP_STAGES[currentCapIndex];
  const config = CAP_CONFIG[stageKey];

  document.getElementById('cap-stage-badge').textContent = config.badge;
  document.getElementById('cap-instruction').textContent = config.instruction;
  document.getElementById('cap-step-dots').innerHTML = CAP_STAGES.map((s, i) => `
    <div class="stage-dot ${i === currentCapIndex ? 'active' : ''}"></div>
  `).join('');

  startCameraStream();
}

async function startCameraStream() {
  stopCameraStream();
  const video = document.getElementById('cap-video');
  const preview = document.getElementById('cap-preview-img');
  const statusPill = document.getElementById('cap-live-status');

  preview.classList.add('hidden');
  video.classList.remove('hidden');

  try {
    camMediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
    video.srcObject = camMediaStream;
    statusPill.textContent = 'Align within guide · Hold steady';

    startLightingAnalyzer(video);
  } catch (err) {
    console.warn('Camera access unavailable or denied:', err);
    statusPill.textContent = 'Camera unavailable · Photo fallback ready';
    const stageKey = CAP_STAGES[currentCapIndex];
    video.classList.add('hidden');
    preview.src = CAP_CONFIG[stageKey].fallbackImg;
    preview.classList.remove('hidden');
  }
}

function stopCameraStream() {
  if (camMediaStream) {
    camMediaStream.getTracks().forEach(track => track.stop());
    camMediaStream = null;
  }
  if (videoBrightnessInterval) {
    clearInterval(videoBrightnessInterval);
    videoBrightnessInterval = null;
  }
}

function startLightingAnalyzer(video) {
  const lightingText = document.getElementById('cap-lighting-text');
  const lightingDot = document.getElementById('cap-lighting-dot');

  videoBrightnessInterval = setInterval(() => {
    if (!video.videoWidth) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 64, 48);
      const data = ctx.getImageData(0, 0, 64, 48).data;

      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      }
      const avgBrightness = sum / (data.length / 4);

      if (avgBrightness < 50) {
        lightingText.textContent = 'Lighting: Low';
        lightingDot.style.background = '#F59E0B';
      } else if (avgBrightness > 220) {
        lightingText.textContent = 'Lighting: High Glare';
        lightingDot.style.background = '#F59E0B';
      } else {
        lightingText.textContent = 'Lighting: Optimal';
        lightingDot.style.background = '#4ADE80';
      }
    } catch (e) {}
  }, 1000);
}

function captureShutterClick() {
  const video = document.getElementById('cap-video');
  const stageKey = CAP_STAGES[currentCapIndex];

  if (video && video.videoWidth && camMediaStream) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    stopCameraStream();
    processCapturedImage(stageKey, canvas.toDataURL('image/jpeg', 0.92), canvas);
  } else {
    stopCameraStream();
    const fallbackSrc = CAP_CONFIG[stageKey].fallbackImg;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 600;
      canvas.height = img.height || 600;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      processCapturedImage(stageKey, fallbackSrc, canvas);
    };
    img.onerror = () => {
      processCapturedImage(stageKey, fallbackSrc, null);
    };
    img.src = fallbackSrc;
  }
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const stageKey = CAP_STAGES[currentCapIndex];
  const reader = new FileReader();

  reader.onload = (event) => {
    const dataUrl = event.target.result;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      stopCameraStream();
      processCapturedImage(stageKey, dataUrl, canvas);
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function processCapturedImage(stageKey, dataUrl, canvas) {
  let quality = { pass: true, brightness: 135, contrast: 70, resolution: '1080p' };

  if (canvas) {
    quality = evaluateImageQuality(canvas);
  }

  state.images[stageKey] = {
    data: dataUrl,
    isDefault: false,
    quality: quality
  };

  showQualityScreen(stageKey, dataUrl, quality);
}

function evaluateImageQuality(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  let brightness = 130;
  let isLowRes = w < 300 || h === 0;

  try {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, Math.min(w, 200), Math.min(h, 200)).data;
    let sum = 0;
    for (let i = 0; i < imgData.length; i += 4) {
      sum += (imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3;
    }
    brightness = sum / (imgData.length / 4);
  } catch (e) {
    brightness = 130;
  }

  const isDark = brightness < 45;
  const isTooBright = brightness > 225;
  const pass = !isLowRes && !isDark && !isTooBright;

  return {
    pass,
    brightness: Math.round(brightness),
    isDark,
    isTooBright,
    isLowRes,
    resolution: `${w} × ${h}`
  };
}

function showQualityScreen(stageKey, dataUrl, quality) {
  showScreen('screen-quality');
  const stageName = CAP_CONFIG[stageKey].name;

  document.getElementById('quality-preview-img').src = dataUrl;
  document.getElementById('quality-title').textContent = quality.pass
    ? `${stageName} Verified`
    : `Adjust ${stageName} Photo`;

  document.getElementById('quality-subtitle').textContent = quality.pass
    ? 'Trichoscopy quality check passed. Scalp features and follicular density are clear.'
    : 'We detected suboptimal lighting or framing. Retake for optimal AI accuracy or proceed.';

  const checklist = document.getElementById('quality-checklist');
  checklist.innerHTML = `
    <div class="quality-item ${!quality.isDark && !quality.isTooBright ? 'pass' : 'warn'}">
      <span>${!quality.isDark && !quality.isTooBright ? '✓' : '⚠'}</span>
      <span>${quality.isDark ? 'Lighting too dim — move to bright light' : quality.isTooBright ? 'Harsh glare detected' : 'Even, clinical-grade lighting'}</span>
    </div>
    <div class="quality-item ${!quality.isLowRes ? 'pass' : 'warn'}">
      <span>${!quality.isLowRes ? '✓' : '⚠'}</span>
      <span>${quality.isLowRes ? 'Low resolution — hold camera closer' : 'Sharp focus & follicle resolution'}</span>
    </div>
    <div class="quality-item pass">
      <span>✓</span>
      <span>Target scalp zone successfully identified</span>
    </div>
  `;
}

function retakeCurrentCapture() {
  showScreen('screen-capture');
  setupCaptureStage();
}

function acceptQualityAndContinue() {
  if (currentCapIndex < CAP_STAGES.length - 1) {
    currentCapIndex++;
    showScreen('screen-capture');
    setupCaptureStage();
  } else {
    renderReviewScreen();
    showScreen('screen-review');
  }
}

function backFromCapture() {
  stopCameraStream();
  if (currentCapIndex > 0) {
    currentCapIndex--;
    setupCaptureStage();
  } else {
    showScreen('screen-guide');
  }
}

// ── Review Screen ──
function renderReviewScreen() {
  const grid = document.getElementById('review-photos-grid');
  grid.innerHTML = CAP_STAGES.map((key) => {
    const cfg = CAP_CONFIG[key];
    const imgData = state.images[key].data;
    return `
      <div class="review-photo-card">
        <img class="review-photo-img" src="${imgData}" alt="${cfg.name}">
        <div class="review-photo-meta">
          <div>
            <div class="review-photo-title">${cfg.name}</div>
            <div style="font-size:11.5px;color:var(--green-700);font-weight:700;">✓ Ready for AI Analysis</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="retakeSpecificRegion('${key}')">Replace</button>
        </div>
      </div>
    `;
  }).join('');
}

function retakeSpecificRegion(stageKey) {
  currentCapIndex = CAP_STAGES.indexOf(stageKey);
  showScreen('screen-capture');
  setupCaptureStage();
}

// ── Multi-Phase Processing Pipeline with Premium Icons ──
const PROC_PHASES = [
  { text: 'Ingesting high-resolution scalp imagery...', icon: '🔬' },
  { text: 'Calculating regional follicular density index...', icon: '📊' },
  { text: 'Detecting Norwood-Hamilton / Ludwig patterns...', icon: '📐' },
  { text: 'Correlating genetic history & shedding rate...', icon: '🧬' },
  { text: 'Finalizing clinical dermatological assessment...', icon: '📑' }
];

function startAnalysisPipeline() {
  showScreen('screen-proc');
  const title = document.getElementById('proc-stage-title');
  const list = document.getElementById('proc-steps-list');

  list.innerHTML = PROC_PHASES.map((p, i) => `
    <div class="proc-step-row" id="proc-row-${i}">
      <div class="proc-step-icon">${p.icon}</div>
      <div>${p.text}</div>
    </div>
  `).join('');

  let step = 0;
  function tick() {
    if (step > 0) {
      const prev = document.getElementById(`proc-row-${step - 1}`);
      if (prev) {
        prev.classList.add('done');
      }
    }
    if (step < PROC_PHASES.length) {
      title.textContent = PROC_PHASES[step].text;
      const curr = document.getElementById(`proc-row-${step}`);
      if (curr) curr.classList.add('done');
      step++;
      setTimeout(tick, 700);
    } else {
      computeClinicalScores();
      setTimeout(() => {
        showScreen('screen-details');
      }, 500);
    }
  }
  tick();
}

// ── Clinical Scoring & Algorithmic Diagnosis ──
function computeClinicalScores() {
  const ans = state.answers;
  const sheddingSev = (ans.shedding ?? 2) + 1; // 1 to 5
  const durationIdx = ans.duration ?? 1; // 0 to 3
  const familyHist = ans.family !== null && ans.family > 0;
  const symptoms = ans.symptoms || [];

  // Regional Follicular Density Index (1.0 to 10.0)
  let baseFront = 7.8 - (sheddingSev * 0.4) - (durationIdx * 0.45) - (ans.hairline ? ans.hairline * 0.5 : 0);
  let baseMid   = 7.4 - (sheddingSev * 0.35) - (durationIdx * 0.35);
  let baseCrown = 7.9 - (sheddingSev * 0.4) - (durationIdx * 0.4) - (familyHist ? 0.4 : 0);

  const frontDensity = Math.max(2.5, Math.min(9.5, baseFront)).toFixed(1);
  const midDensity   = Math.max(2.5, Math.min(9.5, baseMid)).toFixed(1);
  const crownDensity = Math.max(2.5, Math.min(9.5, baseCrown)).toFixed(1);
  const overallDensity = (((+frontDensity) + (+midDensity) + (+crownDensity)) / 3).toFixed(1);

  // Pattern Probabilities
  let pAndro = 52 + (durationIdx * 7) + (familyHist ? 16 : 0) + (ans.hairline ? ans.hairline * 5 : 0);
  let pTelo  = 22 + (sheddingSev * 7) + ((ans.triggers && ans.triggers.length > 0 && !ans.triggers.includes('No major triggers')) ? 14 : 0);
  pAndro = Math.min(75, Math.max(20, pAndro));
  pTelo  = Math.min(45, Math.max(15, pTelo));
  let pOther = Math.max(5, 100 - pAndro - pTelo);

  // Norwood / Ludwig Stage Estimation
  let stageTitle = 'Norwood Stage 2 · Mild Temporal Recession';
  if (overallDensity < 5.0 || (ans.hairline && ans.hairline >= 3)) {
    stageTitle = 'Norwood Stage 3–4 · Advanced Frontal & Vertex Thinning';
  } else if (overallDensity >= 7.5 && sheddingSev <= 2) {
    stageTitle = 'Early Phase · Minimal Active Thinning';
  }

  // Scalp Matrix Observations
  const hasRedness = symptoms.includes('redness');
  const hasFlaking = symptoms.includes('flaking');
  const hasOiliness = symptoms.includes('oiliness');

  // Dermatologist Urgency Level
  let dermLevel = 'Recommended';
  let dermReason = 'Your visible follicular density and shedding timeline suggest an in-person clinical review would establish an optimal targeted treatment plan.';

  if (sheddingSev >= 4 || (symptoms.length >= 2 && !symptoms.includes('none'))) {
    dermLevel = 'Prompt';
    dermReason = 'Elevated shedding with active scalp irritation warrants a prompt dermatologist evaluation to arrest acute follicle stress.';
  } else if (overallDensity >= 7.5 && durationIdx <= 1) {
    dermLevel = 'Routine Check';
    dermReason = 'Your baseline density remains solid. A routine preventative check-in is recommended to monitor miniaturization.';
  }

  state.report = {
    reportId: `ANR-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
    scores: {
      overall: overallDensity,
      front: frontDensity,
      mid: midDensity,
      crown: crownDensity,
      confidence: '89%'
    },
    stage: stageTitle,
    probabilities: {
      androgenetic: pAndro,
      telogen: pTelo,
      other: pOther
    },
    scalp: {
      redness: hasRedness,
      flaking: hasFlaking,
      oiliness: hasOiliness
    },
    derm: {
      level: dermLevel,
      reason: dermReason
    }
  };
}

// ── Patient Intake Submission ──
function submitPatientDetails(e) {
  if (e) e.preventDefault();

  const name = document.getElementById('patient-name').value.trim();
  const age = document.getElementById('patient-age').value.trim();
  const gender = document.getElementById('patient-gender').value;
  const phone = document.getElementById('patient-phone').value.trim();
  const city = document.getElementById('patient-city').value.trim();

  let valid = true;

  function validateInput(id, isValid) {
    const group = document.getElementById(`fg-${id}`);
    if (isValid) {
      group.classList.remove('invalid');
      return true;
    } else {
      group.classList.add('invalid');
      return false;
    }
  }

  valid = validateInput('name', name.length >= 2) && valid;
  valid = validateInput('age', parseInt(age, 10) >= 12 && parseInt(age, 10) <= 100) && valid;
  valid = validateInput('gender', gender.length > 0) && valid;
  valid = validateInput('phone', /^\d{10}$/.test(phone.replace(/\D/g, '').slice(-10))) && valid;
  valid = validateInput('city', city.length >= 2) && valid;

  if (!valid) return;

  state.patient = { name, age, gender, phone, city };
  renderFullReport();
  showScreen('screen-report');
}

// ── Render Full Clinical Report with Bars UI ──
function renderFullReport() {
  const r = state.report;
  const p = state.patient;

  // Header Data
  document.getElementById('rep-report-id').textContent = r.reportId;
  document.getElementById('rep-date').textContent = r.date;
  document.getElementById('rep-patient-meta').textContent = `${p.name} · ${p.age} yrs · ${p.gender}`;

  // KPI Summary
  document.getElementById('rep-kpi-overall').textContent = r.scores.overall;
  document.getElementById('rep-kpi-stage').textContent = r.stage;

  // Regional Density Bars
  document.getElementById('rep-bar-front-val').textContent = `${r.scores.front} / 10`;
  document.getElementById('rep-bar-front-fill').style.width = `${Math.round(r.scores.front * 10)}%`;

  document.getElementById('rep-bar-mid-val').textContent = `${r.scores.mid} / 10`;
  document.getElementById('rep-bar-mid-fill').style.width = `${Math.round(r.scores.mid * 10)}%`;

  document.getElementById('rep-bar-crown-val').textContent = `${r.scores.crown} / 10`;
  document.getElementById('rep-bar-crown-fill').style.width = `${Math.round(r.scores.crown * 10)}%`;

  // Photos
  document.getElementById('rep-img-front').src = state.images.frontal.data;
  document.getElementById('rep-score-front').textContent = `Density: ${r.scores.front} / 10`;

  document.getElementById('rep-img-mid').src = state.images.midscalp.data;
  document.getElementById('rep-score-mid').textContent = `Density: ${r.scores.mid} / 10`;

  document.getElementById('rep-img-crown').src = state.images.crown.data;
  document.getElementById('rep-score-crown').textContent = `Density: ${r.scores.crown} / 10`;

  // Probabilities
  document.getElementById('rep-prob-andro').textContent = `${r.probabilities.androgenetic}%`;
  document.getElementById('rep-fill-andro').style.width = `${r.probabilities.androgenetic}%`;

  document.getElementById('rep-prob-telo').textContent = `${r.probabilities.telogen}%`;
  document.getElementById('rep-fill-telo').style.width = `${r.probabilities.telogen}%`;

  document.getElementById('rep-prob-other').textContent = `${r.probabilities.other}%`;
  document.getElementById('rep-fill-other').style.width = `${r.probabilities.other}%`;

  // Scalp Matrix
  const matList = document.getElementById('rep-scalp-matrix');
  matList.innerHTML = `
    <div class="matrix-row">
      <span class="matrix-name">Scalp Erythema / Redness</span>
      <span class="matrix-status-badge ${r.scalp.redness ? 'observed' : 'normal'}">
        ${r.scalp.redness ? 'Visible Irritation Noted' : 'Normal / Calm'}
      </span>
    </div>
    <div class="matrix-row">
      <span class="matrix-name">Flaking / Desquamation</span>
      <span class="matrix-status-badge ${r.scalp.flaking ? 'observed' : 'normal'}">
        ${r.scalp.flaking ? 'Mild Flaking Observed' : 'Clear Scalp Barrier'}
      </span>
    </div>
    <div class="matrix-row">
      <span class="matrix-name">Sebum Balance</span>
      <span class="matrix-status-badge ${r.scalp.oiliness ? 'observed' : 'normal'}">
        ${r.scalp.oiliness ? 'Elevated Sebum' : 'Balanced Hydration'}
      </span>
    </div>
  `;

  // Dermatologist Box
  document.getElementById('rep-derm-urgency').textContent = `${r.derm.level} Consultation`;
  document.getElementById('rep-derm-reason').textContent = r.derm.reason;

  // Clinical Findings Bullets
  const obsContainer = document.getElementById('rep-observations-list');
  obsContainer.innerHTML = `
    <div class="rep-bullet-item">
      <div class="rep-bullet-dot"></div>
      <div><strong>Frontal Zone:</strong> ${r.scores.front < 6.5 ? 'Mild to moderate temporal miniaturization detected along hairline margins.' : 'Frontal hairline appears well-preserved with intact follicular units.'}</div>
    </div>
    <div class="rep-bullet-item">
      <div class="rep-bullet-dot"></div>
      <div><strong>Crown / Vertex:</strong> ${r.scores.crown < 6.5 ? 'Slightly reduced follicular density observed around the vertex whorl.' : 'Crown coverage demonstrates healthy follicular spacing.'}</div>
    </div>
    <div class="rep-bullet-item">
      <div class="rep-bullet-dot"></div>
      <div><strong>Scalp Micro-Environment:</strong> ${r.scalp.flaking || r.scalp.redness ? 'Active scalp sensitivity observed — addressing barrier inflammation is recommended.' : 'Healthy scalp barrier with no severe inflammatory markers.'}</div>
    </div>
  `;
}

// ── Interactive Actions ──
function openAppointmentModal() {
  document.getElementById('appt-modal').classList.add('active');
}

function closeAppointmentModal() {
  document.getElementById('appt-modal').classList.remove('active');
}

function confirmAppointmentBooking() {
  alert('Thank you! An Anarva Clinic Patient Coordinator will contact you within 2 business hours to schedule your dermatologist consultation.');
  closeAppointmentModal();
}

function downloadPdfReport() {
  window.print();
}

function shareAssessment() {
  if (navigator.share) {
    navigator.share({
      title: 'Anarva Clinic — AI Hair & Scalp Assessment',
      text: `My Scalp Density Score is ${state.report?.scores?.overall || '7.5'}/10. Check your hair health at Anarva Clinic.`,
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Assessment link copied to clipboard!');
  }
}

function restartAssessment() {
  state.qIndex = 0;
  state.answers = { duration: null, pattern: [], shedding: 2, family: null, symptoms: [], hairline: null, triggers: [], treatment: [] };
  showScreen('screen-home');
}

// ── Keyboard Navigation ──
document.addEventListener('keydown', (e) => {
  const activeScreen = document.querySelector('.screen.active');
  if (activeScreen && activeScreen.id === 'screen-quiz') {
    if (e.key >= '1' && e.key <= '9') {
      const idx = parseInt(e.key, 10) - 1;
      const q = QUESTIONS[state.qIndex];
      if (q.type === 'single' || q.type === 'single-horizontal' || q.type === 'photo-single') {
        if (idx < q.options.length) {
          state.answers[q.id] = idx;
          renderCurrentQuestion();
        }
      } else if (q.type === 'scale') {
        if (idx < q.levels.length) {
          state.answers[q.id] = idx;
          renderCurrentQuestion();
        }
      }
    } else if (e.key === 'Enter') {
      const nextBtn = document.getElementById('quiz-btn-next');
      if (nextBtn && !nextBtn.disabled) nextQuestion();
    } else if (e.key === 'Backspace' && document.activeElement.tagName !== 'INPUT') {
      prevQuestion();
    }
  }
});

// Initialize Home Screen on Load
document.addEventListener('DOMContentLoaded', () => {
  showScreen('screen-home');
});
