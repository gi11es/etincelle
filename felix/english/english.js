import { $, $$, shuffle, showScreen } from '../../shared/helpers.js';
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
import { renderSentenceBuilder } from './games/sentence-builder.js';
import { renderSpeakWord } from './games/speak-word.js';
import { renderSpeakTranslate } from './games/speak-translate.js';

const LEVELS = [
  { file: 'data/level-1-basics.json', key: 1 },
  { file: 'data/level-2-daily-life.json', key: 2 },
  { file: 'data/level-3-school.json', key: 3 },
  { file: 'data/level-4-world.json', key: 4 },
  { file: 'data/level-5-expressions.json', key: 5 },
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

const AVAILABLE_GAMES = ['flashcard', 'translate', 'fill-blank', 'match-pairs', 'listen-type', 'sentence-builder', 'speak-word', 'speak-translate'];

async function init() {
  Confetti.init();
  initEnglishVoice();
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
      console.error('Failed to load level:', level.file, e);
    }
  }
}

async function renderLevelGrid() {
  const grid = $('#level-grid');
  const allMastery = await DB.getAllMastery('english');

  // Stats
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

    // Calculate level progress
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

  // Build smart practice queue
  sessionQueue = await buildSessionQueue('english', data.items, 15);

  if (sessionQueue.length === 0) {
    // Fallback: just use some items
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
  const mastery = await getOrCreateMastery(item.id, 'english', currentLevel);

  // Pick game type based on mastery
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
    onAnswer: (correct) => handleAnswer(item, correct, container),
    speak: (text, lang) => speak(text, lang),
  };

  // For match-pairs, we need multiple items
  if (gameType === 'match-pairs') {
    const otherItems = shuffle((levelData[currentLevel]?.items || []).filter(i => i.id !== item.id));
    ctx.pairItems = [item, ...otherItems.slice(0, 5)];
  }

  // For sentence-builder, only use sentence items
  if (gameType === 'sentence-builder' && item.type !== 'sentence') {
    // Fall back to translate for non-sentences
    renderTranslate(ctx);
    return;
  }

  switch (gameType) {
    case 'flashcard': renderFlashcard(ctx); break;
    case 'translate': renderTranslate(ctx); break;
    case 'fill-blank': renderFillBlank(ctx); break;
    case 'match-pairs': renderMatchPairs(ctx); break;
    case 'listen-type': renderListenType(ctx); break;
    case 'sentence-builder': renderSentenceBuilder(ctx); break;
    case 'speak-word': renderSpeakWord(ctx); break;
    case 'speak-translate': renderSpeakTranslate(ctx); break;
    default: renderFlashcard(ctx);
  }
}

async function handleAnswer(item, correct, container) {
  const mastery = await recordAnswer(item.id, correct, 'english', currentLevel);

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

    // Re-queue wrong answer
    requeueWrong(sessionQueue, sessionIndex, item);
  }

  sessionIndex++;

  // Add "Next" button instead of auto-advancing
  showNextButton(container);
}

function showNextButton(container) {
  // Remove any existing next button first
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
    message = 'Encore un peu de pratique et ce sera parfait !';
    SFX.play('complete');
  } else {
    title = 'Continue !';
    message = 'Chaque erreur te rapproche de la maîtrise !';
    SFX.play('complete');
  }

  const lottieContainer = $('#en-results-lottie');
  if (pct >= 0.8) {
    lottieContainer.innerHTML = `<lottie-player src="${LottieOverlay.ANIMS.trophy}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`;
  } else if (pct >= 0.4) {
    lottieContainer.innerHTML = `<lottie-player src="${LottieOverlay.ANIMS.star}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`;
  } else {
    lottieContainer.innerHTML = `<div style="font-size:4rem;">📝</div>`;
  }

  $('#en-results-title').textContent = title;
  $('#en-results-score-num').textContent = sessionScore;
  $('#en-results-score-total').textContent = total;
  $('#en-results-message').textContent = message;

  $('#en-results-details').innerHTML = `
    <div class="en-result-detail"><span class="detail-num new-words">${newWordsLearned}</span><span class="detail-label">nouveaux mots</span></div>
    <div class="en-result-detail"><span class="detail-num reviewed">${reviewedWords}</span><span class="detail-label">révisés</span></div>
    <div class="en-result-detail"><span class="detail-num streak-num">${maxStreak}</span><span class="detail-label">meilleure série</span></div>
  `;

  try {
    const result = await endSessionFlow({
      app: 'english',
      correct: sessionScore,
      total,
      timeSec
    });
    $('#en-results-xp').textContent = `+${result.xp} XP gagnés !`;
    // Check if this level is now "complete" (80%+ mastered)
    const levelItems = levelData[currentLevel]?.items || [];
    await checkLevelBadges('english', currentLevel, levelItems);
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

  $('#en-btn-retry').addEventListener('click', () => {
    SFX.play('tap');
    startSession(currentLevel);
  });

  $('#en-btn-levels').addEventListener('click', () => {
    SFX.play('tap');
    renderLevelGrid();
    showScreen('levels');
  });
}

/* ────────── TTS (Web Speech API — English voice, high quality) ────────── */
let englishVoice = null;

function initEnglishVoice() {
  const voices = speechSynthesis.getVoices();
  pickEnglishVoice(voices);
}

function pickEnglishVoice(voices) {
  if (!voices || voices.length === 0) return;

  const enVoices = voices.filter(v => v.lang.startsWith('en'));

  // Prefer high-quality local British English voices, then American
  englishVoice =
    enVoices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('kate') && v.localService) ||
    enVoices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('daniel') && v.localService) ||
    enVoices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('serena') && v.localService) ||
    enVoices.find(v => v.lang === 'en-GB' && v.localService) ||
    enVoices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('samantha') && v.localService) ||
    enVoices.find(v => v.lang === 'en-US' && v.localService) ||
    enVoices.find(v => v.name.toLowerCase().includes('enhanced')) ||
    enVoices.find(v => v.localService) ||
    enVoices[0] ||
    null;

  if (englishVoice) console.log('English voice:', englishVoice.name, englishVoice.lang);
}

speechSynthesis.onvoiceschanged = () => {
  pickEnglishVoice(speechSynthesis.getVoices());
};

/* speak() returns a Promise that resolves when the utterance finishes.
   Uses a short delay after cancel() to work around a Chrome/Safari bug
   where speechSynthesis.speak() right after .cancel() silently drops the utterance. */
function speak(text, lang = 'en-GB') {
  if (!('speechSynthesis' in window)) return Promise.resolve();

  speechSynthesis.cancel();
  if (!englishVoice) initEnglishVoice();

  clearTimeout(speak._timer);

  return new Promise(resolve => {
    speak._timer = setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.85;
      u.pitch = 1.05;
      if (englishVoice && lang.startsWith('en')) u.voice = englishVoice;
      u.onend = resolve;
      u.onerror = resolve;
      speechSynthesis.speak(u);
    }, 60);
  });
}

document.addEventListener('DOMContentLoaded', init);

export { speak };
