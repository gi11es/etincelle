import { $, $$, shuffle, showScreen, ASSET_V } from '../../shared/helpers.js';
import SFX from '../../shared/sfx.js';
import Confetti from '../../shared/confetti.js';
import LottieOverlay from '../../shared/lottie-overlay.js';
import * as DB from '../../shared/db.js';
import { endSessionFlow, checkLevelBadges } from '../../shared/gamification.js';
import { buildSessionQueue, getOrCreateMastery, recordAnswer, requeueWrong } from '../../shared/spaced-repetition.js';

import { renderQCM } from './games/qcm.js';
import { renderVraiFaux } from './games/vrai-faux.js';

const CATEGORIES = [
  { file: 'data/valeurs-principes.json', key: 'valeurs-principes', icon: '🏛️', badge: 'cit_valeurs' },
  { file: 'data/institutions.json', key: 'institutions', icon: '⚖️', badge: 'cit_institutions' },
  { file: 'data/droits-devoirs.json', key: 'droits-devoirs', icon: '📜', badge: 'cit_droits' },
  { file: 'data/histoire-geo.json', key: 'histoire-geo', icon: '📅', badge: 'cit_histoire' },
  { file: 'data/vivre-en-france.json', key: 'vivre-en-france', icon: '🗼', badge: 'cit_vivre' },
];

let categoryData = {};
let currentCategory = null;
let sessionQueue = [];
let sessionIndex = 0;
let sessionScore = 0;
let sessionStreak = 0;
let sessionStartTime = 0;

// Mock exam state
let examQuestions = [];
let examIndex = 0;
let examScore = 0;
let examStartTime = 0;
let examTimerInterval = null;
let examCategoryScores = {};

const GAME_TYPES = ['qcm', 'vrai-faux'];

async function init() {
  Confetti.init();
  await loadCategories();
  await renderHome();
  bindNav();
}

async function loadCategories() {
  for (const cat of CATEGORIES) {
    try {
      const resp = await fetch(cat.file + ASSET_V);
      const data = await resp.json();
      categoryData[cat.key] = data;
    } catch (e) {
      console.error('Failed to load category:', cat.file, e);
    }
  }
}

async function renderHome() {
  const grid = $('#category-grid');
  const allMastery = await DB.getAllMastery('citizenship');

  const allItems = Object.values(categoryData).flatMap(d => d.items || []);
  const mastered = allMastery.filter(m => m.status === 'mastered').length;
  const learning = allMastery.filter(m => m.status === 'learning').length;

  $('#stat-mastered').textContent = mastered;
  $('#stat-learning').textContent = learning;
  $('#stat-total').textContent = allItems.length;

  grid.innerHTML = '';

  for (const cat of CATEGORIES) {
    const data = categoryData[cat.key];
    if (!data) continue;

    const items = data.items || [];
    const catMastery = allMastery.filter(m => items.some(i => i.id === m.itemId));
    const catLearned = catMastery.filter(m => m.status === 'learning' || m.status === 'mastered').length;
    const progressPct = items.length > 0 ? (catLearned / items.length) * 100 : 0;

    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
      <div class="category-icon">${cat.icon}</div>
      <div class="category-info">
        <div class="category-title">${data.title}</div>
        <div class="category-desc">${data.description || ''}</div>
        <div class="category-progress-bar"><div class="category-progress-fill" style="width:${progressPct}%"></div></div>
      </div>
      <div class="category-count">${catLearned}/${items.length}</div>
    `;

    card.addEventListener('click', () => {
      SFX.play('tap');
      startPractice(cat.key);
    });

    grid.appendChild(card);
  }
}

/* ═══════ Practice Mode ═══════ */

async function startPractice(categoryKey) {
  currentCategory = categoryKey;
  const data = categoryData[categoryKey];
  if (!data || !data.items) return;

  sessionScore = 0;
  sessionIndex = 0;
  sessionStreak = 0;
  sessionStartTime = Date.now();

  sessionQueue = await buildSessionQueue('citizenship', data.items, 12);

  if (sessionQueue.length === 0) {
    sessionQueue = shuffle(data.items).slice(0, 12);
  }

  $('#session-total').textContent = sessionQueue.length;
  $('#session-total-display').textContent = sessionQueue.length;
  $('#session-streak-count').textContent = '0';
  updateSessionProgress();
  showScreen('session');
  SFX.play('whoosh');
  setTimeout(() => renderPracticeItem(), 250);
}

function updateSessionProgress() {
  const pct = sessionQueue.length > 0 ? (sessionIndex / sessionQueue.length) * 100 : 0;
  $('#session-progress-fill').style.width = pct + '%';
  $('#session-current').textContent = Math.min(sessionIndex + 1, sessionQueue.length);
}

async function renderPracticeItem() {
  if (sessionIndex >= sessionQueue.length) {
    showPracticeResults();
    return;
  }

  updateSessionProgress();
  const item = sessionQueue[sessionIndex];
  const mastery = await getOrCreateMastery(item.id, 'citizenship', currentCategory);

  // Pick game type based on mastery
  const gameType = pickGameType(mastery.status);

  const container = $('#game-container');
  container.style.animation = 'none';
  container.offsetHeight;
  container.style.animation = '';

  const ctx = {
    item,
    container,
    onAnswer: (correct) => handlePracticeAnswer(item, correct, container),
  };

  switch (gameType) {
    case 'vrai-faux': renderVraiFaux(ctx); break;
    case 'qcm':
    default: renderQCM(ctx); break;
  }
}

function pickGameType(masteryStatus) {
  if (masteryStatus === 'new') {
    // New items: mostly QCM to learn actively
    return Math.random() < 0.7 ? 'qcm' : 'vrai-faux';
  } else if (masteryStatus === 'learning') {
    // Learning: balanced mix
    return Math.random() < 0.5 ? 'qcm' : 'vrai-faux';
  } else {
    // Mastered: balanced to test retention
    return Math.random() < 0.5 ? 'qcm' : 'vrai-faux';
  }
}

async function handlePracticeAnswer(item, correct, container) {
  await recordAnswer(item.id, correct, 'citizenship', currentCategory);

  if (correct) {
    sessionScore++;
    sessionStreak++;
    $('#session-streak-count').textContent = sessionStreak;
    const streakBadge = $('#session-streak');
    streakBadge.style.display = sessionStreak >= 2 ? 'inline' : 'none';
  } else {
    sessionStreak = 0;
    $('#session-streak-count').textContent = '0';
    $('#session-streak').style.display = 'none';
    requeueWrong(sessionQueue, sessionIndex, item);
  }

  sessionIndex++;
  $('#session-score').textContent = sessionScore;
  showNextButton(container, () => renderPracticeItem());
}

async function showPracticeResults() {
  const total = sessionQueue.length;
  const pct = total > 0 ? sessionScore / total : 0;
  const timeSec = Math.round((Date.now() - sessionStartTime) / 1000);

  let title, message;
  if (pct >= 0.9) {
    title = 'Excellent !';
    message = 'Tu maîtrises cette catégorie !';
    SFX.play('perfect');
    setTimeout(() => Confetti.launch(100), 300);
  } else if (pct >= 0.7) {
    title = 'Bien joué !';
    message = 'Tu progresses vite, continue !';
    SFX.play('complete');
    setTimeout(() => Confetti.launch(50), 300);
  } else if (pct >= 0.5) {
    title = 'Pas mal !';
    message = 'Encore un peu de révision !';
    SFX.play('complete');
  } else {
    title = 'Continue !';
    message = 'La répétition est la clé de la réussite !';
    SFX.play('complete');
  }

  const lottie = $('#cit-results-lottie');
  if (pct >= 0.8) {
    lottie.innerHTML = `<lottie-player src="${LottieOverlay.ANIMS.trophy}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`;
  } else if (pct >= 0.4) {
    lottie.innerHTML = `<lottie-player src="${LottieOverlay.ANIMS.star}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`;
  } else {
    lottie.innerHTML = `<div style="font-size:4rem;">📝</div>`;
  }

  $('#cit-results-title').textContent = title;
  $('#cit-results-score-num').textContent = sessionScore;
  $('#cit-results-score-total').textContent = total;
  $('#cit-results-message').textContent = message;

  try {
    const result = await endSessionFlow({
      app: 'citizenship',
      correct: sessionScore,
      total,
      timeSec
    });
    $('#cit-results-xp').textContent = `+${result.xp} XP gagnés !`;
    const catItems = categoryData[currentCategory]?.items || [];
    await checkLevelBadges('citizenship', currentCategory, catItems);
  } catch (e) {
    console.error('Gamification error:', e);
  }

  $('#session-progress-fill').style.width = '100%';
  showScreen('results');
}

/* ═══════ Mock Exam Mode ═══════ */

function startMockExam() {
  const allItems = Object.values(categoryData).flatMap(d => d.items || []);
  if (allItems.length < 40) {
    examQuestions = shuffle(allItems);
  } else {
    examQuestions = shuffle(allItems).slice(0, 40);
  }

  examIndex = 0;
  examScore = 0;
  examStartTime = Date.now();
  examCategoryScores = {};

  // Init category score tracking
  for (const cat of CATEGORIES) {
    examCategoryScores[cat.key] = { correct: 0, total: 0 };
  }

  $('#exam-score').textContent = '0';
  updateExamProgress();
  startExamTimer();
  showScreen('exam');
  SFX.play('whoosh');
  setTimeout(() => renderExamItem(), 250);
}

function startExamTimer() {
  const EXAM_DURATION = 45 * 60; // 45 minutes in seconds
  let remaining = EXAM_DURATION;

  updateTimerDisplay(remaining);

  examTimerInterval = setInterval(() => {
    remaining--;
    updateTimerDisplay(remaining);

    if (remaining <= 300) {
      $('#exam-timer').classList.add('warning');
    }

    if (remaining <= 0) {
      clearInterval(examTimerInterval);
      showExamResults();
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  $('#exam-timer').textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

function updateExamProgress() {
  const pct = examQuestions.length > 0 ? (examIndex / examQuestions.length) * 100 : 0;
  $('#exam-progress-fill').style.width = pct + '%';
  $('#exam-current').textContent = Math.min(examIndex + 1, examQuestions.length);
}

function renderExamItem() {
  if (examIndex >= examQuestions.length) {
    clearInterval(examTimerInterval);
    showExamResults();
    return;
  }

  updateExamProgress();
  const item = examQuestions[examIndex];

  const container = $('#exam-container');
  container.style.animation = 'none';
  container.offsetHeight;
  container.style.animation = '';

  // Mock exam is always QCM
  renderQCM({
    item,
    container,
    onAnswer: (correct) => handleExamAnswer(item, correct, container),
  });
}

async function handleExamAnswer(item, correct, container) {
  // Find which category this item belongs to
  let itemCategory = null;
  for (const cat of CATEGORIES) {
    const data = categoryData[cat.key];
    if (data && data.items.some(i => i.id === item.id)) {
      examCategoryScores[cat.key].total++;
      if (correct) examCategoryScores[cat.key].correct++;
      itemCategory = cat.key;
      break;
    }
  }

  await recordAnswer(item.id, correct, 'citizenship', itemCategory);

  if (correct) {
    examScore++;
    $('#exam-score').textContent = examScore;
  }

  examIndex++;
  showNextButton(container, () => renderExamItem());
}

async function showExamResults() {
  clearInterval(examTimerInterval);

  const total = examQuestions.length;
  const pct = total > 0 ? examScore / total : 0;
  const timeSec = Math.round((Date.now() - examStartTime) / 1000);
  const passed = examScore >= 32;

  let title, message;
  if (passed && pct >= 0.95) {
    title = 'Parfait !';
    message = 'Tu es prête pour le vrai test !';
    SFX.play('perfect');
    setTimeout(() => Confetti.launch(120), 300);
  } else if (passed) {
    title = 'Réussi !';
    message = `${examScore}/40 — Tu passes le test de citoyenneté !`;
    SFX.play('complete');
    setTimeout(() => Confetti.launch(80), 300);
  } else if (pct >= 0.6) {
    title = 'Presque !';
    message = `${examScore}/40 — Il faut 32/40 pour réussir, encore un peu d'effort !`;
    SFX.play('complete');
  } else {
    title = 'Continue de réviser !';
    message = `${examScore}/40 — Travaille les catégories faibles et réessaie.`;
    SFX.play('complete');
  }

  const lottie = $('#exam-results-lottie');
  if (passed) {
    lottie.innerHTML = `<lottie-player src="${LottieOverlay.ANIMS.trophy}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`;
  } else if (pct >= 0.5) {
    lottie.innerHTML = `<lottie-player src="${LottieOverlay.ANIMS.star}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`;
  } else {
    lottie.innerHTML = `<div style="font-size:4rem;">📝</div>`;
  }

  $('#exam-results-title').textContent = title;
  $('#exam-results-score-num').textContent = examScore;
  $('#exam-results-message').textContent = message;

  const minutes = Math.floor(timeSec / 60);
  const seconds = timeSec % 60;
  $('#exam-results-time').textContent = `Temps : ${minutes}min ${seconds}s`;

  const verdict = $('#exam-results-verdict');
  if (passed) {
    verdict.textContent = '✓ ADMISE';
    verdict.className = 'exam-results-verdict pass';
  } else {
    verdict.textContent = '✗ NON ADMISE';
    verdict.className = 'exam-results-verdict fail';
  }

  // Category breakdown
  const breakdown = $('#exam-results-breakdown');
  let breakdownHtml = '';
  for (const cat of CATEGORIES) {
    const data = categoryData[cat.key];
    const scores = examCategoryScores[cat.key];
    if (scores.total > 0) {
      breakdownHtml += `<div class="breakdown-row"><span>${cat.icon} ${data?.title || cat.key}</span><span class="breakdown-score">${scores.correct}/${scores.total}</span></div>`;
    }
  }
  breakdown.innerHTML = breakdownHtml;

  try {
    const result = await endSessionFlow({
      app: 'citizenship',
      correct: examScore,
      total,
      timeSec
    });
    $('#exam-results-xp').textContent = `+${result.xp} XP gagnés !`;
  } catch (e) {
    console.error('Gamification error:', e);
  }

  $('#exam-progress-fill').style.width = '100%';
  showScreen('exam-results');
}

/* ═══════ Shared UI ═══════ */

function showNextButton(container, callback) {
  const existing = container.querySelector('.btn-next');
  if (existing) existing.remove();

  const btn = document.createElement('button');
  btn.className = 'btn-next';
  btn.textContent = 'Suivant';

  function advance() {
    document.removeEventListener('keydown', onKey);
    SFX.play('tap');
    callback();
  }

  function onKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); advance(); }
  }

  btn.addEventListener('click', advance);
  document.addEventListener('keydown', onKey);
  container.appendChild(btn);
}

/* ═══════ Navigation ═══════ */

function bindNav() {
  $('#btn-mock-exam').addEventListener('click', () => {
    SFX.play('tap');
    startMockExam();
  });

  $('#btn-back-home').addEventListener('click', () => {
    SFX.play('tap');
    renderHome();
    showScreen('home');
  });

  $('#btn-back-home-exam').addEventListener('click', () => {
    SFX.play('tap');
    clearInterval(examTimerInterval);
    renderHome();
    showScreen('home');
  });

  $('#cit-btn-retry').addEventListener('click', () => {
    SFX.play('tap');
    startPractice(currentCategory);
  });

  $('#cit-btn-home').addEventListener('click', () => {
    SFX.play('tap');
    renderHome();
    showScreen('home');
  });

  $('#exam-btn-retry').addEventListener('click', () => {
    SFX.play('tap');
    startMockExam();
  });

  $('#exam-btn-home').addEventListener('click', () => {
    SFX.play('tap');
    renderHome();
    showScreen('home');
  });
}

document.addEventListener('DOMContentLoaded', init);
