import { $, $$, shuffle, showScreen, ASSET_V } from '../../shared/helpers.js';
import SFX from '../../shared/sfx.js';
import Confetti from '../../shared/confetti.js';
import LottieOverlay from '../../shared/lottie-overlay.js';
import * as DB from '../../shared/db.js';
import { getLevel, endSessionFlow, checkLevelBadges } from '../../shared/gamification.js';
import { buildSessionQueue, getOrCreateMastery, recordAnswer, getGameTypeForMastery, requeueWrong } from '../../shared/spaced-repetition.js';

// Import game modules
import { renderFlashcard } from './games/flashcard.js';
import { renderTranslate } from './games/translate.js';
import { renderFillBlank } from './games/fill-blank.js';
import { renderMatchPairs } from './games/match-pairs.js';
import { renderListenType } from './games/listen-type.js';

const LEVELS = [
  { file: 'data/level-1-vocabulaire-courant.json', key: 1 },
  { file: 'data/level-2-expressions.json', key: 2 },
  { file: 'data/level-3-registres.json', key: 3 },
  { file: 'data/level-4-nuances.json', key: 4 },
];

let levelData = {};
let currentLevel = null;
let sessionQueue = [];
let sessionIndex = 0;
let sessionScore = 0;
let sessionStreak = 0;
let maxStreak = 0;
let sessionStartTime = 0;
let newWordsLearned = 0;
let reviewedWords = 0;

const AVAILABLE_GAMES = ['flashcard', 'translate', 'fill-blank', 'match-pairs', 'listen-type'];

async function init() {
  Confetti.init();
  initFrenchVoice();
  await loadLevels();
  await renderLevelGrid();
  bindNav();
}

async function loadLevels() {
  for (const level of LEVELS) {
    try {
      const resp = await fetch(level.file + ASSET_V);
      const data = await resp.json();
      // Normalize items so all game modules get standard fr/en fields
      if (data.items) {
        for (const item of data.items) {
          // Level 3 registres: use fr_courant as the standard fr field
          if (item.fr_courant && !item.fr) {
            item.fr = item.fr_courant;
          }
          // Level 4 false friends: use en_actual as the standard en field
          if (item.en_actual && !item.en) {
            item.en = item.en_actual;
          }
        }
      }
      levelData[level.key] = data;
    } catch (e) {
      console.error('Failed to load level:', level.file, e);
    }
  }
}

async function renderLevelGrid() {
  const grid = $('#level-grid');
  const allMastery = await DB.getAllMastery('french');

  const mastered = allMastery.filter(m => m.status === 'mastered').length;
  const learning = allMastery.filter(m => m.status === 'learning').length;
  const totalItems = Object.values(levelData).reduce((s, d) => s + (d.items ? d.items.length : 0), 0);

  $('#stat-mastered').textContent = mastered;
  $('#stat-learning').textContent = learning;
  $('#stat-total').textContent = totalItems;

  grid.innerHTML = '';

  for (const level of LEVELS) {
    const data = levelData[level.key];
    if (!data) continue;

    const levelItems = data.items || [];
    const levelMastery = allMastery.filter(m => levelItems.some(i => i.id === m.itemId));
    const levelLearned = levelMastery.filter(m => m.status === 'learning' || m.status === 'mastered').length;
    const progressPct = levelItems.length > 0 ? (levelLearned / levelItems.length) * 100 : 0;

    const card = document.createElement('div');
    card.className = 'level-card';
    card.innerHTML = `
      <div class="level-number">${level.key}</div>
      <div class="level-info">
        <div class="level-title">${data.title}</div>
        <div class="level-desc">${data.description}</div>
        <div class="level-progress-bar"><div class="level-progress-fill" style="width:${progressPct}%"></div></div>
        <div class="level-mastery-badge">${levelLearned}/${levelItems.length} en cours</div>
      </div>
    `;

    card.addEventListener('click', () => {
      SFX.play('tap');
      startSession(level.key);
    });

    grid.appendChild(card);
  }
}

async function startSession(levelKey) {
  currentLevel = levelKey;
  const data = levelData[levelKey];
  if (!data || !data.items) return;

  sessionScore = 0;
  sessionIndex = 0;
  sessionStreak = 0;
  maxStreak = 0;
  newWordsLearned = 0;
  reviewedWords = 0;
  sessionStartTime = Date.now();

  sessionQueue = await buildSessionQueue('french', data.items, 15);

  if (sessionQueue.length === 0) {
    sessionQueue = shuffle(data.items).slice(0, 15);
  }

  $('#session-total').textContent = sessionQueue.length;
  $('#session-streak-count').textContent = '0';
  updateSessionProgress();
  showScreen('session');
  SFX.play('whoosh');
  setTimeout(() => renderGameItem(), 250);
}

function updateSessionProgress() {
  const pct = sessionQueue.length > 0 ? (sessionIndex / sessionQueue.length) * 100 : 0;
  $('#session-progress-fill').style.width = pct + '%';
  $('#session-current').textContent = Math.min(sessionIndex + 1, sessionQueue.length);
}

async function renderGameItem() {
  if (sessionIndex >= sessionQueue.length) {
    showSessionResults();
    return;
  }

  updateSessionProgress();
  const item = sessionQueue[sessionIndex];
  const mastery = await getOrCreateMastery(item.id, 'french', currentLevel);

  const gameType = getGameTypeForMastery(mastery.status, AVAILABLE_GAMES);

  const container = $('#game-container');
  container.style.animation = 'none';
  container.offsetHeight;
  container.style.animation = '';

  const ctx = {
    item,
    mastery,
    container,
    allItems: levelData[currentLevel]?.items || [],
    onAnswer: (correct) => {
      // null means the game couldn't render this item — fall back to flashcard
      if (correct === null) { renderFlashcard({ ...ctx, onAnswer: (c) => handleAnswer(item, c, container) }); return; }
      handleAnswer(item, correct, container);
    },
    speak: (text, lang) => speak(text, lang),
  };

  if (gameType === 'match-pairs') {
    const otherItems = shuffle((levelData[currentLevel]?.items || []).filter(i => i.id !== item.id));
    ctx.pairItems = [item, ...otherItems.slice(0, 5)];
  }

  switch (gameType) {
    case 'flashcard': renderFlashcard(ctx); break;
    case 'translate': renderTranslate(ctx); break;
    case 'fill-blank': renderFillBlank(ctx); break;
    case 'match-pairs': renderMatchPairs(ctx); break;
    case 'listen-type': renderListenType(ctx); break;
    default: renderFlashcard(ctx);
  }
}

async function handleAnswer(item, correct, container) {
  const mastery = await recordAnswer(item.id, correct, 'french', currentLevel);

  if (correct) {
    sessionScore++;
    sessionStreak++;
    if (sessionStreak > maxStreak) maxStreak = sessionStreak;
    $('#session-streak-count').textContent = sessionStreak;

    if (mastery.totalAttempts === 1) newWordsLearned++;
    else reviewedWords++;
  } else {
    sessionStreak = 0;
    $('#session-streak-count').textContent = '0';
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
    speechSynthesis.cancel();
    renderGameItem();
  }

  function onKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); advance(); }
  }

  btn.addEventListener('click', advance);
  document.addEventListener('keydown', onKey);
  container.appendChild(btn);
}

async function showSessionResults() {
  const total = sessionQueue.length;
  const pct = total > 0 ? sessionScore / total : 0;
  const timeSec = Math.round((Date.now() - sessionStartTime) / 1000);

  let title, message;
  if (pct >= 0.9) {
    title = 'Excellent !';
    message = 'Tu maîtrises vraiment bien !';
    SFX.play('perfect');
    setTimeout(() => Confetti.launch(100), 300);
  } else if (pct >= 0.7) {
    title = 'Bien joué !';
    message = 'Tu progresses vite, continue !';
    SFX.play('complete');
    setTimeout(() => Confetti.launch(50), 300);
  } else if (pct >= 0.5) {
    title = 'Pas mal !';
    message = 'Encore un peu de pratique !';
    SFX.play('complete');
  } else {
    title = 'Continue !';
    message = 'Chaque erreur te rapproche de la maîtrise !';
    SFX.play('complete');
  }

  const lottieContainer = $('#fr-results-lottie');
  if (pct >= 0.8) {
    lottieContainer.innerHTML = `<lottie-player src="${LottieOverlay.ANIMS.trophy}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`;
  } else if (pct >= 0.4) {
    lottieContainer.innerHTML = `<lottie-player src="${LottieOverlay.ANIMS.star}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`;
  } else {
    lottieContainer.innerHTML = `<div style="font-size:4rem;">📝</div>`;
  }

  $('#fr-results-title').textContent = title;
  $('#fr-results-score-num').textContent = sessionScore;
  $('#fr-results-score-total').textContent = total;
  $('#fr-results-message').textContent = message;

  $('#fr-results-details').innerHTML = `
    <div class="fr-result-detail"><span class="detail-num new-words">${newWordsLearned}</span><span class="detail-label">nouveaux mots</span></div>
    <div class="fr-result-detail"><span class="detail-num reviewed">${reviewedWords}</span><span class="detail-label">révisés</span></div>
    <div class="fr-result-detail"><span class="detail-num streak-num">${maxStreak}</span><span class="detail-label">meilleure série</span></div>
  `;

  try {
    const result = await endSessionFlow({
      app: 'french',
      correct: sessionScore,
      total,
      timeSec
    });
    $('#fr-results-xp').textContent = `+${result.xp} XP gagnés !`;
    const levelItems = levelData[currentLevel]?.items || [];
    await checkLevelBadges('french', currentLevel, levelItems);
  } catch (e) {
    console.error('Gamification error:', e);
  }

  $('#session-progress-fill').style.width = '100%';
  showScreen('results');
}

function bindNav() {
  $('#btn-back-levels').addEventListener('click', () => {
    SFX.play('tap');
    speechSynthesis.cancel();
    renderLevelGrid();
    showScreen('levels');
  });

  $('#fr-btn-retry').addEventListener('click', () => {
    SFX.play('tap');
    startSession(currentLevel);
  });

  $('#fr-btn-levels').addEventListener('click', () => {
    SFX.play('tap');
    renderLevelGrid();
    showScreen('levels');
  });
}

/* ────────── TTS (Web Speech API — French female voice, high quality) ────────── */
let frenchVoice = null;
const MALE_NAMES = ['thomas','eddy','reed','jacques','daniel','grandpa','grandpère','luca','nicolas'];

function initFrenchVoice() {
  const voices = speechSynthesis.getVoices();
  pickFrenchVoice(voices);
}

function pickFrenchVoice(voices) {
  if (!voices || voices.length === 0) return;

  const frVoices = voices.filter(v => v.lang.startsWith('fr'));
  const femaleFr = frVoices.filter(v => !MALE_NAMES.some(m => v.name.toLowerCase().includes(m)));

  frenchVoice =
    femaleFr.find(v => v.name.toLowerCase().includes('audrey') && v.localService) ||
    femaleFr.find(v => v.name.toLowerCase().includes('audrey')) ||
    femaleFr.find(v => v.name.toLowerCase().includes('amelie')) ||
    femaleFr.find(v => v.name.toLowerCase().includes('marie')) ||
    femaleFr.find(v => v.localService) ||
    femaleFr[0] ||
    frVoices[0] ||
    null;

  if (frenchVoice) console.log('French voice:', frenchVoice.name, frenchVoice.lang);
}

speechSynthesis.onvoiceschanged = () => {
  pickFrenchVoice(speechSynthesis.getVoices());
};

function speak(text, lang = 'fr-FR') {
  if (!('speechSynthesis' in window)) return Promise.resolve();

  speechSynthesis.cancel();
  if (!frenchVoice) initFrenchVoice();

  clearTimeout(speak._timer);

  return new Promise(resolve => {
    speak._timer = setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.85;
      u.pitch = 1.1;
      if (frenchVoice && lang.startsWith('fr')) u.voice = frenchVoice;
      u.onend = resolve;
      u.onerror = resolve;
      speechSynthesis.speak(u);
    }, 60);
  });
}

document.addEventListener('DOMContentLoaded', init);

export { speak };
