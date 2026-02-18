import { $, shuffle, showScreen, ASSET_V } from '../../shared/helpers.js';
import SFX from '../../shared/sfx.js';
import Confetti from '../../shared/confetti.js';
import LottieOverlay from '../../shared/lottie-overlay.js';
import * as DB from '../../shared/db.js';
import { endSessionFlow, checkLevelBadges } from '../../shared/gamification.js';
import { buildSessionQueue, getOrCreateMastery, recordAnswer, requeueWrong } from '../../shared/spaced-repetition.js';

import { renderFlagQuiz, renderFlagReverse } from './games/flag-quiz.js';
import { renderCapitalMatch } from './games/capital-match.js';
import { renderTriviaQuiz } from './games/trivia-quiz.js';

const SECTIONS = [
  { file: 'data/flags.json', key: 'flags', icon: '\uD83C\uDFF3\uFE0F', games: ['flag-quiz', 'flag-reverse', 'capital-match'] },
  { file: 'data/trivia.json', key: 'trivia', icon: '\uD83C\uDF0D', games: ['trivia-quiz'] },
  { file: 'data/level-1-5eme.json', key: 'level-1-5eme', icon: '\uD83D\uDCCA', games: ['trivia-quiz'] },
  { file: 'data/level-2-4eme.json', key: 'level-2-4eme', icon: '\u2708\uFE0F', games: ['trivia-quiz'] },
];

let sectionData = {};
let currentSection = null;
let sessionQueue = [];
let sessionIndex = 0;
let sessionScore = 0;
let sessionStreak = 0;
let maxStreak = 0;
let sessionStartTime = 0;

async function init() {
  Confetti.init();
  await loadSections();
  await renderSectionGrid();
  bindNav();
}

async function loadSections() {
  for (const sec of SECTIONS) {
    try {
      const resp = await fetch(sec.file + ASSET_V);
      const data = await resp.json();
      sectionData[sec.key] = data;
    } catch (e) {
      console.error('Failed to load geo section:', sec.file, e);
    }
  }
}

async function renderSectionGrid() {
  const grid = $('#geo-section-grid');
  const allMastery = await DB.getAllMastery('geo');

  const mastered = allMastery.filter(m => m.status === 'mastered').length;
  const learning = allMastery.filter(m => m.status === 'learning').length;
  const totalAttempts = allMastery.reduce((s, m) => s + m.totalAttempts, 0);
  const totalCorrect = allMastery.reduce((s, m) => s + m.totalCorrect, 0);
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) + '%' : '-';

  $('#gstat-mastered').textContent = mastered;
  $('#gstat-learning').textContent = learning;
  $('#gstat-accuracy').textContent = accuracy;

  grid.innerHTML = '';

  const cardGrid = document.createElement('div');
  cardGrid.className = 'geo-card-grid';

  for (const sec of SECTIONS) {
    const data = sectionData[sec.key];
    if (!data) continue;

    const items = data.items || [];
    const secMastery = allMastery.filter(m => items.some(i => i.id === m.itemId));
    const learned = secMastery.filter(m => m.status === 'learning' || m.status === 'mastered').length;
    const progressPct = items.length > 0 ? (learned / items.length) * 100 : 0;

    const card = document.createElement('div');
    card.className = 'geo-card';
    card.innerHTML = `
      <div class="geo-card-icon">${sec.icon}</div>
      <div class="geo-card-name">${data.title}</div>
      <div class="geo-card-meta">${items.length} questions</div>
      <div class="geo-card-progress-bar"><div class="geo-card-progress-fill" style="width:${progressPct}%"></div></div>
      <div class="geo-card-mastery">${learned}/${items.length}</div>
    `;

    card.addEventListener('click', () => {
      SFX.play('tap');
      startSession(sec.key);
    });

    cardGrid.appendChild(card);
  }

  grid.appendChild(cardGrid);
}

async function startSession(sectionKey) {
  currentSection = sectionKey;
  const data = sectionData[sectionKey];
  if (!data || !data.items) return;

  sessionScore = 0;
  sessionIndex = 0;
  sessionStreak = 0;
  maxStreak = 0;
  sessionStartTime = Date.now();

  sessionQueue = await buildSessionQueue('geo', data.items, 15);
  if (sessionQueue.length === 0) {
    sessionQueue = shuffle(data.items).slice(0, 15);
  }

  $('#geo-total').textContent = sessionQueue.length;
  $('#geo-streak-count').textContent = '0';
  updateProgress();
  showScreen('session');
  SFX.play('whoosh');
  setTimeout(() => renderGeoItem(), 250);
}

function updateProgress() {
  const pct = sessionQueue.length > 0 ? (sessionIndex / sessionQueue.length) * 100 : 0;
  $('#geo-progress-fill').style.width = pct + '%';
  $('#geo-current').textContent = Math.min(sessionIndex + 1, sessionQueue.length);
}

async function renderGeoItem() {
  if (sessionIndex >= sessionQueue.length) {
    showResults();
    return;
  }

  updateProgress();
  const item = sessionQueue[sessionIndex];
  const container = $('#geo-game-container');
  container.style.animation = 'none';
  container.offsetHeight;
  container.style.animation = '';

  const sec = SECTIONS.find(s => s.key === currentSection);
  const allItems = sectionData[currentSection]?.items || [];

  const ctx = {
    item,
    container,
    allItems,
    onAnswer: (correct) => handleAnswer(item, correct, container),
  };

  if (item.type === 'mcq') {
    renderTriviaQuiz(ctx);
  } else if (sec && sec.games.includes('flag-quiz')) {
    const gameType = pickFlagGame();
    if (gameType === 'capital-match') {
      ctx.pairItems = [item, ...shuffle(allItems.filter(i => i.id !== item.id)).slice(0, 5)];
      renderCapitalMatch(ctx);
    } else if (gameType === 'flag-reverse') {
      renderFlagReverse(ctx);
    } else {
      renderFlagQuiz(ctx);
    }
  } else {
    renderTriviaQuiz(ctx);
  }
}

function pickFlagGame() {
  const r = Math.random();
  if (r < 0.15) return 'capital-match';
  if (r < 0.5) return 'flag-reverse';
  return 'flag-quiz';
}

async function handleAnswer(item, correct, container) {
  await recordAnswer(item.id, correct, 'geo', currentSection);

  if (correct) {
    sessionScore++;
    sessionStreak++;
    if (sessionStreak > maxStreak) maxStreak = sessionStreak;
    $('#geo-streak-count').textContent = sessionStreak;
  } else {
    sessionStreak = 0;
    $('#geo-streak-count').textContent = '0';
    requeueWrong(sessionQueue, sessionIndex, item);
  }

  sessionIndex++;
  showNextButton(container);
}

function showNextButton(container) {
  const existing = container.querySelector('.btn-next');
  if (existing) existing.remove();

  const btn = document.createElement('button');
  btn.className = 'btn-next';
  const isLast = sessionIndex >= sessionQueue.length;
  btn.textContent = isLast ? 'Voir les résultats' : 'Question suivante';

  function advance() {
    document.removeEventListener('keydown', onKey);
    SFX.play('tap');
    renderGeoItem();
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
    title = 'Excellent !';
    message = 'Tu es un vrai globe-trotter !';
    SFX.play('perfect');
    setTimeout(() => Confetti.launch(100), 300);
  } else if (pct >= 0.7) {
    title = 'Bien joué !';
    message = 'Tu connais bien ta géographie !';
    SFX.play('complete');
    setTimeout(() => Confetti.launch(50), 300);
  } else if (pct >= 0.5) {
    title = 'Pas mal !';
    message = 'Continue à explorer le monde !';
    SFX.play('complete');
  } else {
    title = 'Continue !';
    message = 'Chaque question te fait découvrir le monde !';
    SFX.play('complete');
  }

  const lottieContainer = $('#geo-results-lottie');
  if (pct >= 0.8) {
    lottieContainer.innerHTML = `<lottie-player src="${LottieOverlay.ANIMS.trophy}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`;
  } else if (pct >= 0.4) {
    lottieContainer.innerHTML = `<lottie-player src="${LottieOverlay.ANIMS.star}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`;
  } else {
    lottieContainer.innerHTML = `<div style="font-size:4rem;">\uD83C\uDF0D</div>`;
  }

  $('#geo-results-title').textContent = title;
  $('#geo-results-score-num').textContent = sessionScore;
  $('#geo-results-score-total').textContent = total;
  $('#geo-results-message').textContent = message;

  try {
    const result = await endSessionFlow({
      app: 'geo',
      correct: sessionScore,
      total,
      timeSec
    });
    $('#geo-results-xp').textContent = `+${result.xp} XP gagnés !`;
    const sectionItems = sectionData[currentSection]?.items || [];
    await checkLevelBadges('geo', currentSection, sectionItems);
  } catch (e) {
    console.error('Gamification error:', e);
  }

  $('#geo-progress-fill').style.width = '100%';
  showScreen('results');
}

function bindNav() {
  $('#btn-back-levels').addEventListener('click', () => {
    SFX.play('tap');
    renderSectionGrid();
    showScreen('levels');
  });

  $('#geo-btn-retry').addEventListener('click', () => {
    SFX.play('tap');
    startSession(currentSection);
  });

  $('#geo-btn-levels').addEventListener('click', () => {
    SFX.play('tap');
    renderSectionGrid();
    showScreen('levels');
  });
}

document.addEventListener('DOMContentLoaded', init);
