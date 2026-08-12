// Wayname — Street View name quiz
// No backend. All state is in memory for the duration of the session.

const NUM_QUESTIONS = 10;
const NUM_OPTIONS   = 4;

// ── i18n strings ──────────────────────────────────────────────────────────────
const STRINGS = {
  es: {
    subtitle:          'Identifica la calle a partir de una foto de Street View.',
    hint:              '10 preguntas · 4 opciones · nueva selección cada partida',
    question_prompt:   '¿Cómo se llama esta calle?',
    loading:           'Cargando…',
    img_unavailable:   '(imagen no disponible)',
    correct:           '¡Correcto!',
    wrong_prefix:      'Era:',
    next_btn:          'Siguiente →',
    results_btn:       'Ver resultado',
    share_label:       'Comparte tu resultado:',
    save_image:        '📸 Guardar imagen (para IG Story)',
    copy_text:         'Copiar texto',
    share_native:      'Compartir…',
    copied:            '¡Copiado!',
    img_saved:         'Imagen guardada — ábrela en Instagram → Historia ✓',
    play_again:        'Jugar de nuevo',
    change_city:       'Cambiar ciudad',
    see_answers:       'Ver respuestas',
    said:              'Dijiste:',
    city_region:       c => c.region,
    city_count:        n => `${n} calles`,
    play_cta:          url => `Juega: ${url}`,
    challenge_text:    (s, city) => `🎯 ¡Te han retado! Alguien consiguió ${s}/10 en ${city}. ¿Puedes superarlo?`,
    share_prefix:      (city, score) => `🗺️ Wayname — ${city}\n${score}/10`,
    results: [
      [10, '🏆', '¡Perfecto!',     '¡Conoces la ciudad mejor que nadie!'],
      [8,  '🌟', '¡Excelente!',    'Casi perfecto. Conoces muy bien la ciudad.'],
      [6,  '👍', '¡Bien!',         'Buen resultado. Sigue explorando.'],
      [4,  '🗺️', 'Mejorable',      'Hay calles por descubrir todavía.'],
      [0,  '🧭', '¡A practicar!',  'El callejero tiene muchos secretos.'],
    ],
  },
  en: {
    subtitle:          'Identify the street from a Street View photo.',
    hint:              '10 questions · 4 options · new selection every game',
    question_prompt:   'What is the name of this street?',
    loading:           'Loading…',
    img_unavailable:   '(image unavailable)',
    correct:           'Correct!',
    wrong_prefix:      'It was:',
    next_btn:          'Next →',
    results_btn:       'See results',
    share_label:       'Share your result:',
    save_image:        '📸 Save image (for IG Story)',
    copy_text:         'Copy text',
    share_native:      'Share…',
    copied:            'Copied!',
    img_saved:         'Image saved — open Instagram → Story → pick it from gallery ✓',
    play_again:        'Play again',
    change_city:       'Change city',
    see_answers:       'See answers',
    said:              'You picked:',
    city_region:       c => c.region_en || c.region,
    city_count:        n => `${n} streets`,
    play_cta:          url => `Play: ${url}`,
    challenge_text:    (s, city) => `🎯 You've been challenged! Someone scored ${s}/10 in ${city}. Can you beat it?`,
    share_prefix:      (city, score) => `🗺️ Wayname — ${city}\n${score}/10`,
    results: [
      [10, '🏆', 'Perfect!',          'You know every street in town!'],
      [8,  '🌟', 'Excellent!',        'Almost perfect. You really know this city.'],
      [6,  '👍', 'Good job!',         'Solid result. Keep exploring.'],
      [4,  '🗺️', 'Not bad',           'A few streets still to discover.'],
      [0,  '🧭', 'Keep practising!',  'This city still has secrets to reveal.'],
    ],
  },
};

// ── Language state ────────────────────────────────────────────────────────────
let lang = localStorage.getItem('wn-lang') || 'es';

function t(key) { return STRINGS[lang][key]; }

function applyLang() {
  // Toggle button label shows the OTHER language (the one you'd switch to)
  el.btnLang.textContent = lang === 'es' ? 'EN' : 'ES';
  document.documentElement.lang = lang;

  // Update all static data-i18n nodes
  document.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.dataset.i18n;
    if (STRINGS[lang][key] !== undefined) node.textContent = STRINGS[lang][key];
  });

  // Refresh city list labels (region and count may change)
  buildCityList();
}

function toggleLang() {
  lang = lang === 'es' ? 'en' : 'es';
  localStorage.setItem('wn-lang', lang);
  applyLang();
}

// ── DOM refs ──────────────────────────────────────────────────────────────────
const screens = {
  home:    document.getElementById('screen-home'),
  quiz:    document.getElementById('screen-quiz'),
  results: document.getElementById('screen-results'),
};
const el = {
  btnLang:          document.getElementById('btn-lang'),
  cityList:         document.getElementById('city-list'),
  progressLabel:    document.getElementById('progress-label'),
  progressFill:     document.getElementById('progress-fill'),
  scoreLabel:       document.getElementById('score-label'),
  streetImage:      document.getElementById('street-image'),
  imageLoading:     document.getElementById('image-loading'),
  options:          document.getElementById('options'),
  feedback:         document.getElementById('feedback'),
  feedbackIcon:     document.getElementById('feedback-icon'),
  feedbackText:     document.getElementById('feedback-text'),
  btnNext:          document.getElementById('btn-next'),
  resultsEmoji:     document.getElementById('results-emoji'),
  resultsTitle:     document.getElementById('results-title'),
  finalScore:       document.getElementById('final-score'),
  resultsMessage:   document.getElementById('results-message'),
  emojiGrid:        document.getElementById('emoji-grid'),
  btnShareX:        document.getElementById('btn-share-x'),
  btnShareFb:       document.getElementById('btn-share-fb'),
  btnShareWa:       document.getElementById('btn-share-wa'),
  btnShareThreads:  document.getElementById('btn-share-threads'),
  btnShareImage:    document.getElementById('btn-share-image'),
  btnShareCopy:     document.getElementById('btn-share-copy'),
  btnShareNative:   document.getElementById('btn-share-native'),
  copyConfirm:      document.getElementById('copy-confirm'),
  btnRestart:       document.getElementById('btn-restart'),
  btnHome:          document.getElementById('btn-home'),
  reviewList:       document.getElementById('review-list'),
  challengeBanner:  document.getElementById('challenge-banner'),
  challengeText:    document.getElementById('challenge-text'),
  shareCanvas:      document.getElementById('share-canvas'),
};

el.btnLang.addEventListener('click', toggleLang);

// ── Game state ────────────────────────────────────────────────────────────────
let currentCity   = null;
let questions     = [];
let questionIndex = 0;
let score         = 0;
let answered      = false;
let results       = [];  // { correct, chosen, isCorrect }

// ── Utilities ─────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo(0, 0);
}

// ── Home screen ───────────────────────────────────────────────────────────────
function buildCityList() {
  el.cityList.innerHTML = '';
  CITIES.forEach(city => {
    const btn = document.createElement('button');
    btn.className = 'city-btn';
    btn.innerHTML = `
      <span class="city-flag">${city.flag}</span>
      <span class="city-info">
        <strong>${city.name}</strong>
        <small>${t('city_region')(city)} · ${t('city_count')(city.questions.length)}</small>
      </span>
      <span class="city-arrow">→</span>
    `;
    btn.addEventListener('click', () => startGame(city));
    el.cityList.appendChild(btn);
  });
}

// ── Game logic ────────────────────────────────────────────────────────────────
function startGame(city) {
  currentCity   = city;
  questions     = shuffle(city.questions).slice(0, NUM_QUESTIONS);
  questionIndex = 0;
  score         = 0;
  answered      = false;
  results       = [];
  el.scoreLabel.textContent = 0;
  showScreen('quiz');
  loadQuestion();
}

function loadQuestion() {
  const q = questions[questionIndex];

  el.progressLabel.textContent = `${questionIndex + 1} / ${NUM_QUESTIONS}`;
  el.progressFill.style.width  = `${(questionIndex / NUM_QUESTIONS) * 100}%`;

  // Image
  el.streetImage.classList.add('hidden');
  el.imageLoading.textContent = t('loading');
  const img = new Image();
  img.onload = () => {
    el.streetImage.src = img.src;
    el.streetImage.classList.remove('hidden');
    el.imageLoading.textContent = '';
  };
  img.onerror = () => { el.imageLoading.textContent = t('img_unavailable'); };
  img.src = `images/${q.slug}.png`;

  // Options: correct + 3 random wrongs
  const allNames = currentCity.questions.map(x => x.name);
  const wrongs   = shuffle(allNames.filter(n => n !== q.name)).slice(0, NUM_OPTIONS - 1);
  const opts     = shuffle([q.name, ...wrongs]);

  el.options.innerHTML = '';
  opts.forEach(name => {
    const btn = document.createElement('button');
    btn.className   = 'option-btn';
    btn.textContent = name;
    btn.addEventListener('click', () => handleAnswer(btn, name, q.name));
    el.options.appendChild(btn);
  });

  el.feedback.className = 'feedback hidden';
  el.btnNext.classList.add('hidden');
  answered = false;
}

function handleAnswer(btn, chosen, correct) {
  if (answered) return;
  answered = true;

  const isCorrect = chosen === correct;
  if (isCorrect) score++;
  results.push({ correct, chosen, isCorrect });
  el.scoreLabel.textContent = score;

  document.querySelectorAll('.option-btn').forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add('correct');
    else if (b === btn && !isCorrect) b.classList.add('wrong');
  });

  el.feedback.className       = `feedback ${isCorrect ? 'correct-fb' : 'wrong-fb'}`;
  el.feedbackIcon.textContent = isCorrect ? '✓' : '✗';
  el.feedbackText.textContent = isCorrect
    ? t('correct')
    : `${t('wrong_prefix')} ${correct}`;

  el.btnNext.classList.remove('hidden');
  el.btnNext.textContent = questionIndex + 1 < NUM_QUESTIONS
    ? t('next_btn')
    : t('results_btn');
}

el.btnNext.addEventListener('click', () => {
  questionIndex++;
  if (questionIndex < NUM_QUESTIONS) loadQuestion();
  else showResults();
});

// ── Results ───────────────────────────────────────────────────────────────────
function showResults() {
  const pct     = score / NUM_QUESTIONS;
  const tiers   = t('results');
  const [, emoji, title, msg] = tiers.find(([min]) => score >= min);

  el.resultsEmoji.textContent   = emoji;
  el.resultsTitle.textContent   = title;
  el.finalScore.textContent     = `${score} / ${NUM_QUESTIONS}`;
  el.resultsMessage.textContent = msg;
  el.emojiGrid.innerHTML        = results.map(r => r.isCorrect ? '🟩' : '🟥').join('');

  el.reviewList.innerHTML = results.map(r => `
    <li class="review-item ${r.isCorrect ? 'r-correct' : 'r-wrong'}">
      <span class="r-icon">${r.isCorrect ? '✓' : '✗'}</span>
      <span class="r-ans">${r.correct}</span>
      ${!r.isCorrect ? `<span class="r-you">${t('said')} ${r.chosen}</span>` : ''}
    </li>
  `).join('');

  el.progressFill.style.width = '100%';
  wireShareButtons();
  showScreen('results');
}

// ── Share ─────────────────────────────────────────────────────────────────────
function buildShareUrl() {
  return `${location.origin}${location.pathname}?s=${score}&c=${currentCity.id}`;
}

function buildShareText(withUrl) {
  const grid   = results.map(r => r.isCorrect ? '🟩' : '🟥').join('');
  const url    = buildShareUrl();
  let   text   = `${t('share_prefix')(currentCity.name, score)}\n\n${grid}`;
  if (withUrl) text += `\n\n${t('play_cta')(url)}`;
  return text;
}

function flashCopyConfirm(msg) {
  el.copyConfirm.textContent = msg || t('copied');
  el.copyConfirm.classList.remove('hidden');
  setTimeout(() => {
    el.copyConfirm.classList.add('hidden');
    el.copyConfirm.textContent = '';
  }, 3500);
}

function wireShareButtons() {
  const shareUrl  = buildShareUrl();
  const plainText = buildShareText(false);
  const fullText  = buildShareText(true);

  el.btnShareX.onclick = () =>
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(plainText)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener');

  el.btnShareFb.onclick = () =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(plainText)}`, '_blank', 'noopener');

  el.btnShareWa.onclick = () =>
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`, '_blank', 'noopener');

  el.btnShareThreads.onclick = () =>
    window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(plainText)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener');

  el.btnShareImage.onclick = () => shareOrDownloadImage(fullText, shareUrl);

  el.btnShareCopy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      flashCopyConfirm();
    } catch {
      const ta = document.createElement('textarea');
      ta.value = fullText; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      flashCopyConfirm();
    }
  };

  if (navigator.share) {
    el.btnShareNative.classList.remove('hidden');
    el.btnShareNative.onclick = () =>
      navigator.share({ text: fullText, url: shareUrl }).catch(() => {});
  }
}

// ── Score-card image (for Instagram Story / native share) ─────────────────────
function drawShareCard() {
  const c   = el.shareCanvas;
  const ctx = c.getContext('2d');
  const W   = c.width, H = c.height;

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#131b34');
  grad.addColorStop(1, '#0b1021');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  ctx.font = '160px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🗺️', W / 2, 320);

  ctx.font = '700 96px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Wayname', W / 2, 460);

  ctx.font = '400 44px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#8891a8';
  ctx.fillText(currentCity.name, W / 2, 550);

  ctx.font = '800 220px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#6c63ff';
  ctx.fillText(`${score}/10`, W / 2, 900);

  const gridText = results.map(r => r.isCorrect ? '🟩' : '🟥').join(' ');
  ctx.font = '80px system-ui, -apple-system, sans-serif';
  const cardW = Math.min(W - 100, ctx.measureText(gridText).width + 120);
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, W / 2 - cardW / 2, 1000, cardW, 220, 32);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.fillText(gridText, W / 2, 1140);

  ctx.font = '500 40px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#8891a8';
  const cta = lang === 'es' ? '¿Puedes superarlo?' : 'Can you beat it?';
  ctx.fillText(cta, W / 2, 1380);

  ctx.font = '700 42px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  wrapText(ctx, location.origin + location.pathname, W / 2, 1460, W - 140, 54);

  return c;
}

function shareOrDownloadImage(text, url) {
  const canvas = drawShareCard();
  canvas.toBlob(async blob => {
    const file = new File([blob], 'wayname-score.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text, url }); return; }
      catch { /* user cancelled */ }
    }

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wayname-score.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    flashCopyConfirm(t('img_saved'));
  }, 'image/png');
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '', lines = [];
  words.forEach(word => {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  });
  lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ── Restart / Home ────────────────────────────────────────────────────────────
el.btnRestart.addEventListener('click', () => startGame(currentCity));
el.btnHome.addEventListener('click',    () => showScreen('home'));

// ── Challenge incoming link ───────────────────────────────────────────────────
function checkChallenge() {
  const params = new URLSearchParams(location.search);
  const s = parseInt(params.get('s'), 10);
  const c = params.get('c');
  if (!Number.isNaN(s) && c) {
    const city = CITIES.find(x => x.id === c);
    if (city) {
      el.challengeText.textContent = t('challenge_text')(s, city.name);
      el.challengeBanner.classList.remove('hidden');
    }
  }
  if (params.has('s') || params.has('c')) history.replaceState(null, '', location.pathname);
}

// ── Init ──────────────────────────────────────────────────────────────────────
applyLang();
checkChallenge();
