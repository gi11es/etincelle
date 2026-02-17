import { $, $$, shuffle, normalize, escapeAttr, showScreen } from '../../shared/helpers.js';
import SFX from '../../shared/sfx.js';
import Confetti from '../../shared/confetti.js';
import LottieOverlay from '../../shared/lottie-overlay.js';
import * as DB from '../../shared/db.js';
import { getLevel, endSessionFlow, checkLevelBadges } from '../../shared/gamification.js';
import { buildSessionQueue, getOrCreateMastery, recordAnswer, requeueWrong } from '../../shared/spaced-repetition.js';

const LEVELS = [
  { file: 'data/level-1-5eme.json', key: '5eme' },
  { file: 'data/level-2-4eme.json', key: '4eme' },
  { file: 'data/level-3-3eme.json', key: '3eme' },
  { file: 'data/level-4-seconde.json', key: 'seconde' },
  { file: 'data/level-5-premiere.json', key: 'premiere' },
];

let levelData = {};
let currentLevel = null;
let currentCategory = null;
let sessionQueue = [];
let sessionIndex = 0;
let sessionScore = 0;
let sessionStreak = 0;
let sessionStartTime = 0;

async function init() {
  Confetti.init();
  await loadLevels();
  await renderLevelGrid();
  bindNav();
}

async function loadLevels() {
  for (const level of LEVELS) {
    try {
      const resp = await fetch(level.file);
      const data = await resp.json();
      levelData[level.key] = data;
    } catch (e) {
      console.error('Failed to load math level:', level.file, e);
    }
  }
}

async function renderLevelGrid() {
  const grid = $('#math-level-grid');
  const allMastery = await DB.getAllMastery('math');

  const mastered = allMastery.filter(m => m.status === 'mastered').length;
  const learning = allMastery.filter(m => m.status === 'learning').length;
  const totalAttempts = allMastery.reduce((s, m) => s + m.totalAttempts, 0);
  const totalCorrect = allMastery.reduce((s, m) => s + m.totalCorrect, 0);
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) + '%' : '-';

  $('#mstat-mastered').textContent = mastered;
  $('#mstat-learning').textContent = learning;
  $('#mstat-accuracy').textContent = accuracy;

  grid.innerHTML = '';

  const levelLabels = {
    '5eme': '5ème',
    '4eme': '4ème',
    '3eme': '3ème',
    'seconde': '2nde',
    'premiere': '1ère Spé'
  };

  for (const level of LEVELS) {
    const data = levelData[level.key];
    if (!data) continue;

    const levelItems = data.items || [];

    // Grade section header
    const header = document.createElement('div');
    header.className = 'grade-section-header';
    header.innerHTML = `<span class="grade-badge">${levelLabels[level.key] || level.key}</span> ${data.title}`;
    grid.appendChild(header);

    // Group items by category (preserve order of first appearance)
    const categoryMap = new Map();
    for (const item of levelItems) {
      const cat = item.category || 'Divers';
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat).push(item);
    }

    // Render one chapter card per category
    const chaptersWrap = document.createElement('div');
    chaptersWrap.className = 'chapter-grid';

    for (const [cat, items] of categoryMap) {
      const catLearned = allMastery.filter(m => (m.status === 'learning' || m.status === 'mastered') && items.some(i => i.id === m.itemId));
      const progressPct = items.length > 0 ? (catLearned.length / items.length) * 100 : 0;

      const card = document.createElement('div');
      card.className = 'chapter-card';
      card.innerHTML = `
        <div class="chapter-name">${cat}</div>
        <div class="chapter-meta">${items.length} exercices</div>
        <div class="chapter-progress-bar"><div class="chapter-progress-fill" style="width:${progressPct}%"></div></div>
        <div class="chapter-mastery">${catLearned.length}/${items.length}</div>
      `;

      card.addEventListener('click', () => {
        SFX.play('tap');
        startSession(level.key, cat);
      });

      chaptersWrap.appendChild(card);
    }

    grid.appendChild(chaptersWrap);
  }
}

async function startSession(levelKey, category) {
  currentLevel = levelKey;
  currentCategory = category || null;
  const data = levelData[levelKey];
  if (!data || !data.items) return;

  const pool = category ? data.items.filter(i => i.category === category) : data.items;

  sessionScore = 0;
  sessionIndex = 0;
  sessionStreak = 0;
  sessionStartTime = Date.now();

  sessionQueue = await buildSessionQueue('math', pool, 12);
  if (sessionQueue.length === 0) {
    sessionQueue = shuffle(pool).slice(0, 12);
  }

  $('#math-total').textContent = sessionQueue.length;
  $('#math-streak-count').textContent = '0';
  updateProgress();
  showScreen('session');
  SFX.play('whoosh');
  setTimeout(() => renderMathItem(), 250);
}

function updateProgress() {
  const pct = sessionQueue.length > 0 ? (sessionIndex / sessionQueue.length) * 100 : 0;
  $('#math-progress-fill').style.width = pct + '%';
  $('#math-current').textContent = Math.min(sessionIndex + 1, sessionQueue.length);
}

async function renderMathItem() {
  if (sessionIndex >= sessionQueue.length) {
    showResults();
    return;
  }

  updateProgress();
  const item = sessionQueue[sessionIndex];
  const container = $('#math-game-container');
  container.style.animation = 'none';
  container.offsetHeight;
  container.style.animation = '';

  switch (item.type) {
    case 'mcq': renderMCQ(item, container); break;
    case 'solve': renderSolve(item, container); break;
    case 'fill-blank': renderFillBlank(item, container); break;
    default: renderMCQ(item, container);
  }

  // Render math notation with KaTeX after DOM is populated
  typeset(container);
}

function renderMCQ(item, container) {
  let answered = false;

  container.innerHTML = `
    <div class="math-question">${texify(item.question)}</div>
    <div class="math-choices">
      ${item.choices.map((c, i) => `<button class="math-choice" data-idx="${i}">${texify(c)}</button>`).join('')}
    </div>
  `;

  container.querySelectorAll('.math-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      SFX.play('tap');

      const idx = parseInt(btn.dataset.idx);
      const correct = idx === item.answer;

      container.querySelectorAll('.math-choice').forEach(b => {
        b.classList.add('disabled');
        if (parseInt(b.dataset.idx) === item.answer) b.classList.add('correct');
      });

      if (correct) {
        btn.classList.add('correct');
        SFX.play('correct');
        LottieOverlay.show('correct', 800);
      } else {
        btn.classList.add('wrong');
        SFX.play('wrong');
      }

      showMathExplanation(container, item.explanation);
      handleMathAnswer(item, correct);
      showMathNext(container);
    });
  });
}

function renderSolve(item, container) {
  let answered = false;

  container.innerHTML = `
    <div class="math-question">${texify(item.question)}</div>
    <div class="math-solve-row">
      <input class="math-solve-input" type="text" placeholder="Ta réponse..." autocomplete="off" autocapitalize="off">
      ${item.hint ? `<button class="math-hint-btn" id="math-hint">Indice</button>` : ''}
      <button class="btn-submit" id="math-submit">Valider</button>
    </div>
    <div id="math-solve-feedback"></div>
  `;

  const input = container.querySelector('.math-solve-input');
  const submitBtn = container.querySelector('#math-submit');
  const hintBtn = container.querySelector('#math-hint');

  if (hintBtn) {
    hintBtn.addEventListener('click', () => {
      SFX.play('reveal');
      hintBtn.textContent = item.hint;
      hintBtn.disabled = true;
      typeset(hintBtn);
    });
  }

  function check() {
    if (answered) return;
    answered = true;

    const userVal = input.value.trim();
    const correct = checkMathAnswer(userVal, item.answer);

    input.disabled = true;
    submitBtn.disabled = true;
    if (hintBtn) hintBtn.disabled = true;

    const feedback = container.querySelector('#math-solve-feedback');

    if (correct) {
      SFX.play('correct');
      LottieOverlay.show('correct', 800);
      input.classList.add('answer-correct-input');
      feedback.innerHTML = `<div style="color:var(--success);font-weight:700;margin-top:10px">✓ Correct !</div>`;
    } else {
      SFX.play('wrong');
      input.classList.add('answer-wrong-input');
      feedback.innerHTML = `
        <div style="color:var(--danger);font-weight:700;margin-top:10px">✗ Ta réponse : ${userVal || '(vide)'}</div>
        <div style="color:var(--success);font-weight:700">Réponse : ${texify(String(item.answer))}</div>
      `;
      typeset(feedback);
    }

    showMathExplanation(container, item.explanation);
    handleMathAnswer(item, correct);
    showMathNext(container);
  }

  submitBtn.addEventListener('click', check);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  input.focus();
}

function renderFillBlank(item, container) {
  renderMCQ(item, container);
}

function checkMathAnswer(userVal, answer) {
  if (!userVal) return false;
  const u = userVal.replace(/\s+/g, '').toLowerCase();
  const a = String(answer).replace(/\s+/g, '').toLowerCase();

  if (u === a) return true;

  // Handle common equivalences
  const norm = s => s.replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.').replace(/\s/g, '');
  if (norm(u) === norm(a)) return true;

  // Try numeric comparison
  try {
    const numU = parseFloat(u.replace(',', '.'));
    const numA = parseFloat(a.replace(',', '.'));
    if (!isNaN(numU) && !isNaN(numA) && Math.abs(numU - numA) < 0.01) return true;
  } catch (e) {}

  return false;
}

function showMathExplanation(container, text) {
  if (!text) return;
  const div = document.createElement('div');
  div.className = 'math-explanation';
  div.innerHTML = texify(text);
  container.appendChild(div);
  typeset(div);
}

async function handleMathAnswer(item, correct) {
  await recordAnswer(item.id, correct, 'math', currentLevel);

  if (correct) {
    sessionScore++;
    sessionStreak++;
    $('#math-streak-count').textContent = sessionStreak;
  } else {
    sessionStreak = 0;
    $('#math-streak-count').textContent = '0';
    requeueWrong(sessionQueue, sessionIndex, item);
  }

  sessionIndex++;
}

function showMathNext(container) {
  const btn = document.createElement('button');
  btn.className = 'btn-next';
  const isLast = sessionIndex >= sessionQueue.length;
  btn.textContent = isLast ? 'Voir les résultats' : 'Question suivante';

  function advance() {
    document.removeEventListener('keydown', onKey);
    SFX.play('tap');
    renderMathItem();
  }

  function onKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); advance(); }
  }

  btn.addEventListener('click', advance);
  document.addEventListener('keydown', onKey);
  container.appendChild(btn);
}

async function showResults() {
  const total = sessionQueue.length;
  const pct = total > 0 ? sessionScore / total : 0;
  const timeSec = Math.round((Date.now() - sessionStartTime) / 1000);

  let title, message;
  if (pct >= 0.9) {
    title = 'Brillant !';
    message = 'Tu maîtrises vraiment ces concepts !';
    SFX.play('perfect');
    setTimeout(() => Confetti.launch(100), 300);
  } else if (pct >= 0.7) {
    title = 'Bien joué !';
    message = 'Tu progresses bien en maths !';
    SFX.play('complete');
    setTimeout(() => Confetti.launch(50), 300);
  } else if (pct >= 0.5) {
    title = 'Pas mal !';
    message = 'Relis les explications et réessaie !';
    SFX.play('complete');
  } else {
    title = 'Continue !';
    message = 'Chaque exercice te rend plus fort !';
    SFX.play('complete');
  }

  const lottieContainer = $('#math-results-lottie');
  if (pct >= 0.8) {
    lottieContainer.innerHTML = `<lottie-player src="${LottieOverlay.ANIMS.trophy}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`;
  } else if (pct >= 0.4) {
    lottieContainer.innerHTML = `<lottie-player src="${LottieOverlay.ANIMS.star}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`;
  } else {
    lottieContainer.innerHTML = `<div style="font-size:4rem;">🧮</div>`;
  }

  $('#math-results-title').textContent = title;
  $('#math-results-score-num').textContent = sessionScore;
  $('#math-results-score-total').textContent = total;
  $('#math-results-message').textContent = message;

  try {
    const result = await endSessionFlow({
      app: 'math',
      correct: sessionScore,
      total,
      timeSec
    });
    $('#math-results-xp').textContent = `+${result.xp} XP gagnés !`;
    // Check if this entire grade level is now "complete" (80%+ mastered)
    const allLevelItems = levelData[currentLevel]?.items || [];
    await checkLevelBadges('math', currentLevel, allLevelItems);
  } catch (e) {
    console.error('Gamification error:', e);
  }

  $('#math-progress-fill').style.width = '100%';
  showScreen('results');
}

function bindNav() {
  $('#btn-back-levels').addEventListener('click', () => {
    SFX.play('tap');
    renderLevelGrid();
    showScreen('levels');
  });

  $('#math-btn-retry').addEventListener('click', () => {
    SFX.play('tap');
    startSession(currentLevel, currentCategory);
  });

  $('#math-btn-levels').addEventListener('click', () => {
    SFX.play('tap');
    renderLevelGrid();
    showScreen('levels');
  });
}

/* ────────── Math notation: texify() + KaTeX rendering ────────── */

/**
 * Convert plain math text to LaTeX-delimited form.
 * Handles fractions (a/b), powers (²³), symbols (×÷±√π), etc.
 * Text that's already in $...$ delimiters is left alone.
 */
function texify(text) {
  if (!text) return '';

  // If already contains $...$ delimiters, leave as-is
  if (/\$.*\$/.test(text)) return text;

  // Split text into segments: "Calcule : expression" → keep the label, convert the math
  // Process inline math-like content
  return text
    // Wrap fraction patterns like 2/3 or (a+b)/(c-d)  in $\frac{}{}$
    .replace(/\(([^)]+)\)\/\(([^)]+)\)/g, (_, n, d) => `$\\frac{${texLiteral(n)}}{${texLiteral(d)}}$`)
    .replace(/(\d+)\/(\d+)/g, (_, n, d) => `$\\frac{${n}}{${d}}$`)
    // Powers: ² ³
    .replace(/(\w|\))\u00B2/g, '$1$^2$')
    .replace(/(\w|\))\u00B3/g, '$1$^3$')
    // Explicit power notation like x^2
    .replace(/(\w)\^(\d+)/g, '$1$^{$2}$')
    // Symbols
    .replace(/×/g, '$\\times$')
    .replace(/÷/g, '$\\div$')
    .replace(/±/g, '$\\pm$')
    .replace(/√(\d+)/g, '$\\sqrt{$1}$')
    .replace(/√\(([^)]+)\)/g, '$\\sqrt{$1}$')
    .replace(/π/g, '$\\pi$')
    .replace(/≤/g, '$\\leq$')
    .replace(/≥/g, '$\\geq$')
    .replace(/≠/g, '$\\neq$')
    .replace(/∈/g, '$\\in$')
    // Merge adjacent $ delimiters: $...$$ ..$ → $... ...$
    .replace(/\$\$/g, ' ');
}

/** Convert inner expression chars to LaTeX-safe form */
function texLiteral(s) {
  return s.replace(/×/g, '\\times ').replace(/÷/g, '\\div ').replace(/−/g, '-');
}

/**
 * Run KaTeX auto-render on an element.
 * Falls back gracefully if KaTeX hasn't loaded yet.
 */
function typeset(el) {
  if (!el) return;
  try {
    if (window.renderMathInElement) {
      window.renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
      });
    }
  } catch (e) {
    console.warn('KaTeX render error:', e);
  }
}

document.addEventListener('DOMContentLoaded', init);
