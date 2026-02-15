import { $, $$, shuffle, normalize, escapeAttr, showScreen } from '../../shared/helpers.js';
import SFX from '../../shared/sfx.js';
import Confetti from '../../shared/confetti.js';
import LottieOverlay from '../../shared/lottie-overlay.js';
import { endSessionFlow } from '../../shared/gamification.js';

const BOOKS = [
  { id: 'verne-2889', file: 'books/verne-2889.json' },
  { id: 'robida-omnibus', file: 'books/robida-omnibus.json' }
];

let currentBook = null;
let currentMode = null;
let questions = [];
let questionIndex = 0;
let score = 0;
let answered = false;
let sessionStartTime = 0;

const MODE_NAMES = {
  qcm: 'QCM',
  vraiOuFaux: 'Vrai ou Faux',
  quiSuisJe: 'Qui suis-je ?',
  ordre: 'Dans l\'ordre',
  associations: 'Associations',
  texteATrous: 'Texte à trous'
};

async function init() {
  Confetti.init();
  await renderBookGrid();
  bindNavigation();
}

async function renderBookGrid() {
  const grid = $('#book-grid');
  grid.innerHTML = '';
  for (const entry of BOOKS) {
    try {
      const resp = await fetch(entry.file);
      const book = await resp.json();
      const card = document.createElement('button');
      card.className = 'book-card';
      card.innerHTML = `
        <span class="book-emoji">${book.emoji || ''}</span>
        <div class="book-info">
          <div class="book-title">${book.shortTitle || book.title}</div>
          <div class="book-author">${book.author}</div>
        </div>
      `;
      card.addEventListener('click', () => { SFX.play('tap'); openBook(book); });
      grid.appendChild(card);
    } catch (e) {
      console.error('Failed to load book:', entry.file, e);
    }
  }
}

function openBook(book) {
  currentBook = book;
  const header = $('#book-header');
  header.innerHTML = `
    <h2>${book.emoji || ''} ${book.shortTitle || book.title}</h2>
    <p>${book.author} (${book.year})</p>
  `;
  renderBestScores();
  showScreen('book');
  SFX.play('whoosh');
}

// Best scores (still using localStorage for backward compat)
function getScoreKey(bookId, mode) { return `quiz-livre-${bookId}-${mode}`; }

function getBestScore(bookId, mode) {
  const val = localStorage.getItem(getScoreKey(bookId, mode));
  return val ? JSON.parse(val) : null;
}

function saveBestScore(bookId, mode, newScore, total) {
  const key = getScoreKey(bookId, mode);
  const prev = getBestScore(bookId, mode);
  if (!prev || newScore > prev.score || (newScore === prev.score && total < prev.total)) {
    localStorage.setItem(key, JSON.stringify({ score: newScore, total }));
  }
}

function renderBestScores() {
  const container = $('#best-scores');
  const modes = Object.keys(MODE_NAMES);
  let html = '<h3>Meilleurs scores</h3>';
  let hasAny = false;
  for (const mode of modes) {
    const best = getBestScore(currentBook.id, mode);
    if (best) {
      hasAny = true;
      html += `<div class="score-row"><span>${MODE_NAMES[mode]}</span><span class="score-value">${best.score}/${best.total}</span></div>`;
    }
  }
  if (!hasAny) {
    html += '<p class="no-scores">Aucun score pour le moment. Lance-toi !</p>';
  }
  container.innerHTML = html;
}

function bindNavigation() {
  $('#btn-back-home').addEventListener('click', () => { SFX.play('tap'); showScreen('home'); });
  $('#btn-back-book').addEventListener('click', () => { SFX.play('tap'); renderBestScores(); showScreen('book'); });
  $('#btn-retry').addEventListener('click', () => { SFX.play('tap'); startQuiz(currentMode); });
  $('#btn-other-mode').addEventListener('click', () => { SFX.play('tap'); renderBestScores(); showScreen('book'); });
  $('#btn-home').addEventListener('click', () => { SFX.play('tap'); showScreen('home'); });

  $$('.mode-card').forEach(btn => {
    btn.addEventListener('click', () => {
      SFX.play('tap');
      startQuiz(btn.dataset.mode);
    });
  });
}

function startQuiz(mode) {
  currentMode = mode;
  score = 0;
  questionIndex = 0;
  answered = false;
  sessionStartTime = Date.now();
  $('#quiz-score').textContent = '0';

  if (mode === 'surprise') {
    questions = buildSurpriseQuestions();
  } else {
    questions = buildQuestions(mode);
  }

  $('#quiz-total').textContent = questions.length;
  updateProgressBar();
  showScreen('quiz');
  SFX.play('whoosh');
  setTimeout(() => renderQuestion(), 250);
}

function updateProgressBar() {
  const total = questions.length;
  const pct = total > 0 ? (questionIndex / total) * 100 : 0;
  $('#quiz-progress-fill').style.width = pct + '%';
}

function buildQuestions(mode) {
  const data = currentBook[mode];
  if (!data) return [];
  const shuffled = shuffle(data);
  const count = Math.min(10, shuffled.length);
  return shuffled.slice(0, count).map(q => ({ ...q, type: mode }));
}

function buildSurpriseQuestions() {
  const modes = ['qcm', 'vraiOuFaux', 'quiSuisJe', 'texteATrous'];
  let pool = [];
  for (const mode of modes) {
    const data = currentBook[mode];
    if (data) pool.push(...data.map(q => ({ ...q, type: mode })));
  }
  return shuffle(pool).slice(0, 10);
}

function renderQuestion() {
  if (questionIndex >= questions.length) {
    showResults();
    return;
  }
  answered = false;
  const q = questions[questionIndex];
  $('#quiz-current').textContent = questionIndex + 1;
  updateProgressBar();

  const container = $('#quiz-container');
  container.style.animation = 'none';
  container.offsetHeight;
  container.style.animation = '';

  switch (q.type) {
    case 'qcm': renderQCM(q); break;
    case 'vraiOuFaux': renderVraiFaux(q); break;
    case 'quiSuisJe': renderQuiSuisJe(q); break;
    case 'ordre': renderOrdre(q); break;
    case 'associations': renderAssociations(q); break;
    case 'texteATrous': renderTexteATrous(q); break;
  }
}

function renderQCM(q) {
  const container = $('#quiz-container');
  container.innerHTML = `
    <div class="question-text">${q.question}</div>
    <div class="choices">
      ${q.choices.map((c, i) => `<button class="choice-btn" data-idx="${i}">${c}</button>`).join('')}
    </div>
  `;

  container.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const idx = parseInt(btn.dataset.idx);
      const correct = idx === q.answer;

      container.querySelectorAll('.choice-btn').forEach(b => {
        b.classList.add('disabled');
        if (parseInt(b.dataset.idx) === q.answer) b.classList.add('correct');
      });

      if (correct) {
        btn.classList.add('correct');
        score++;
        $('#quiz-score').textContent = score;
        SFX.play('correct');
        LottieOverlay.show('correct', 900);
      } else {
        btn.classList.add('wrong');
        SFX.play('wrong');
      }

      showExplanation(container, q.explanation);
      showNextButton(container);
    });
  });
}

function renderVraiFaux(q) {
  const container = $('#quiz-container');
  container.innerHTML = `
    <div class="question-text">${q.statement}</div>
    <div class="vf-buttons">
      <button class="vf-btn vf-btn--vrai" data-val="true">VRAI</button>
      <button class="vf-btn vf-btn--faux" data-val="false">FAUX</button>
    </div>
  `;

  container.querySelectorAll('.vf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const chosen = btn.dataset.val === 'true';
      const correct = chosen === q.answer;
      const correctVal = q.answer ? 'true' : 'false';

      container.querySelectorAll('.vf-btn').forEach(b => {
        b.classList.add('disabled');
        if (b.dataset.val === correctVal) b.classList.add('correct');
      });

      if (correct) {
        score++;
        $('#quiz-score').textContent = score;
        SFX.play('correct');
        LottieOverlay.show('correct', 900);
      } else {
        btn.classList.add('wrong');
        SFX.play('wrong');
      }

      showExplanation(container, q.explanation);
      showNextButton(container);
    });
  });
}

function renderQuiSuisJe(q) {
  const container = $('#quiz-container');
  let revealedClues = 1;
  const maxClues = q.clues.length;

  container.innerHTML = `
    <div class="question-text">Qui suis-je ?</div>
    <div class="clues-list">
      ${q.clues.map((c, i) => `<div class="clue-item${i === 0 ? ' visible' : ''}">${i + 1}. ${c}</div>`).join('')}
    </div>
    <div class="clue-input-row">
      <input class="clue-input" type="text" placeholder="Tape le nom du personnage..." autocomplete="off">
      <button class="btn-reveal-clue">Indice</button>
      <button class="btn-submit">Valider</button>
    </div>
  `;

  const input = container.querySelector('.clue-input');
  const revealBtn = container.querySelector('.btn-reveal-clue');
  const submitBtn = container.querySelector('.btn-submit');
  const clueItems = container.querySelectorAll('.clue-item');

  if (revealedClues >= maxClues) revealBtn.disabled = true;

  revealBtn.addEventListener('click', () => {
    if (revealedClues < maxClues) {
      SFX.play('reveal');
      clueItems[revealedClues].classList.add('visible');
      revealedClues++;
      if (revealedClues >= maxClues) revealBtn.disabled = true;
    }
  });

  function checkAnswer() {
    if (answered) return;
    answered = true;
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = q.answer.toLowerCase();
    const correct = userAnswer === correctAnswer
      || (correctAnswer.includes(userAnswer) && userAnswer.length >= 3)
      || userAnswer.includes(correctAnswer);

    clueItems.forEach(c => c.classList.add('visible'));
    input.disabled = true;
    revealBtn.disabled = true;
    submitBtn.disabled = true;

    if (correct) {
      score++;
      $('#quiz-score').textContent = score;
      input.classList.add('answer-correct-input');
      SFX.play('correct');
      LottieOverlay.show('correct', 900);
    } else {
      input.classList.add('answer-wrong-input');
      SFX.play('wrong');
    }

    const answerLine = document.createElement('div');
    answerLine.className = 'explanation';
    answerLine.innerHTML = `<strong>Réponse : ${q.answer}</strong><br>${q.explanation}`;
    container.appendChild(answerLine);
    showNextButton(container);
  }

  submitBtn.addEventListener('click', checkAnswer);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkAnswer(); });
  input.focus();
}

function renderOrdre(q) {
  const container = $('#quiz-container');
  const correctOrder = [...q.events];
  const shuffled = shuffle(q.events);
  let userOrder = [];

  container.innerHTML = `
    <div class="question-text">${q.title}</div>
    <p style="color:var(--text-dim);margin-bottom:14px;font-size:0.85rem;">Clique sur les événements dans l'ordre chronologique.</p>
    <div class="order-list">
      ${shuffled.map((ev, i) => `<div class="order-item" data-idx="${i}" data-text="${escapeAttr(ev)}"><span class="order-num">&nbsp;</span><span>${ev}</span></div>`).join('')}
    </div>
    <button class="btn-submit" style="display:none;margin:10px auto 0;">Valider</button>
  `;

  const items = container.querySelectorAll('.order-item');
  const submitBtn = container.querySelector('.btn-submit');

  items.forEach(item => {
    item.addEventListener('click', () => {
      if (answered) return;
      SFX.play('tap');
      const text = item.dataset.text;
      if (item.classList.contains('selected')) {
        item.classList.remove('selected');
        userOrder = userOrder.filter(t => t !== text);
      } else {
        item.classList.add('selected');
        userOrder.push(text);
      }
      items.forEach(it => {
        const t = it.dataset.text;
        const pos = userOrder.indexOf(t);
        it.querySelector('.order-num').textContent = pos >= 0 ? pos + 1 : ' ';
      });
      submitBtn.style.display = userOrder.length === shuffled.length ? 'block' : 'none';
    });
  });

  submitBtn.addEventListener('click', () => {
    if (answered) return;
    answered = true;
    let correctCount = 0;
    items.forEach(item => {
      const text = item.dataset.text;
      const userPos = userOrder.indexOf(text);
      const correctPos = correctOrder.indexOf(text);
      if (userPos === correctPos) {
        item.classList.add('correct-pos');
        correctCount++;
      } else {
        item.classList.add('wrong-pos');
      }
      item.querySelector('.order-num').textContent = correctPos + 1;
    });

    if (correctCount === correctOrder.length) {
      score++;
      $('#quiz-score').textContent = score;
      SFX.play('correct');
      LottieOverlay.show('correct', 900);
    } else {
      SFX.play('wrong');
    }

    submitBtn.disabled = true;
    showExplanation(container, q.explanation);
    showNextButton(container);
  });
}

function renderAssociations(q) {
  const container = $('#quiz-container');
  const pairs = q.pairs;
  const leftItems = shuffle(pairs.map(p => p.left));
  const rightItems = shuffle(pairs.map(p => p.right));
  let selectedLeft = null;
  let selectedRight = null;
  let matchedCount = 0;
  const totalPairs = pairs.length;

  container.innerHTML = `
    <div class="question-text">${q.title}</div>
    <p style="color:var(--text-dim);margin-bottom:14px;font-size:0.85rem;">Clique sur un élément à gauche, puis son correspondant à droite.</p>
    <div class="assoc-container">
      <div class="assoc-column">
        <h4>Élément</h4>
        ${leftItems.map(l => `<div class="assoc-item assoc-left" data-val="${escapeAttr(l)}">${l}</div>`).join('')}
      </div>
      <div class="assoc-column">
        <h4>Correspond à</h4>
        ${rightItems.map(r => `<div class="assoc-item assoc-right" data-val="${escapeAttr(r)}">${r}</div>`).join('')}
      </div>
    </div>
  `;

  const leftEls = container.querySelectorAll('.assoc-left');
  const rightEls = container.querySelectorAll('.assoc-right');

  function tryMatch() {
    if (!selectedLeft || !selectedRight) return;
    const pair = pairs.find(p => p.left === selectedLeft);
    const leftEl = container.querySelector(`.assoc-left[data-val="${escapeAttr(selectedLeft)}"]`);
    const rightEl = container.querySelector(`.assoc-right[data-val="${escapeAttr(selectedRight)}"]`);

    if (pair && pair.right === selectedRight) {
      leftEl.classList.add('matched');
      leftEl.classList.remove('selected');
      rightEl.classList.add('matched');
      rightEl.classList.remove('selected');
      matchedCount++;
      SFX.play('match');
      if (matchedCount === totalPairs) {
        score++;
        $('#quiz-score').textContent = score;
        answered = true;
        SFX.play('correct');
        showNextButton(container);
      }
    } else {
      leftEl.classList.add('wrong-match');
      rightEl.classList.add('wrong-match');
      SFX.play('wrong');
      setTimeout(() => {
        leftEl.classList.remove('wrong-match', 'selected');
        rightEl.classList.remove('wrong-match', 'selected');
      }, 500);
    }
    selectedLeft = null;
    selectedRight = null;
  }

  leftEls.forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('matched') || answered) return;
      SFX.play('tap');
      leftEls.forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      selectedLeft = el.dataset.val;
      tryMatch();
    });
  });

  rightEls.forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('matched') || answered) return;
      SFX.play('tap');
      rightEls.forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      selectedRight = el.dataset.val;
      tryMatch();
    });
  });
}

function renderTexteATrous(q) {
  const container = $('#quiz-container');
  const displayText = q.text.replace('___', '<span class="trou-blank" id="trou-blank">???</span>');

  container.innerHTML = `
    <div class="question-text">Complète la phrase :</div>
    <div class="trou-text">${displayText}</div>
    <div class="trou-input-row">
      <input class="trou-input" type="text" placeholder="Ta réponse..." autocomplete="off">
      <button class="btn-hint">Indice</button>
      <button class="btn-submit">Valider</button>
    </div>
  `;

  const input = container.querySelector('.trou-input');
  const hintBtn = container.querySelector('.btn-hint');
  const submitBtn = container.querySelector('.btn-submit');
  const blank = container.querySelector('#trou-blank');

  hintBtn.addEventListener('click', () => {
    SFX.play('reveal');
    hintBtn.textContent = q.hint;
    hintBtn.disabled = true;
    hintBtn.style.cursor = 'default';
  });

  function checkAnswer() {
    if (answered) return;
    answered = true;
    const userAnswer = input.value.trim().toLowerCase().replace(/\s+/g, ' ');
    const correctAnswer = q.answer.toLowerCase().replace(/\s+/g, ' ');
    const correct = userAnswer === correctAnswer || normalize(userAnswer) === normalize(correctAnswer);

    blank.textContent = q.answer;
    input.disabled = true;
    hintBtn.disabled = true;
    submitBtn.disabled = true;

    if (correct) {
      score++;
      $('#quiz-score').textContent = score;
      blank.style.color = 'var(--success)';
      blank.style.borderColor = 'var(--success)';
      input.classList.add('answer-correct-input');
      SFX.play('correct');
      LottieOverlay.show('correct', 900);
    } else {
      blank.style.color = 'var(--danger)';
      blank.style.borderColor = 'var(--danger)';
      input.classList.add('answer-wrong-input');
      SFX.play('wrong');
    }

    showExplanation(container, q.hint);
    showNextButton(container);
  }

  submitBtn.addEventListener('click', checkAnswer);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkAnswer(); });
  input.focus();
}

function showExplanation(container, text) {
  const div = document.createElement('div');
  div.className = 'explanation';
  div.textContent = text;
  container.appendChild(div);
}

function showNextButton(container) {
  const btn = document.createElement('button');
  btn.className = 'btn-next';
  const isLast = questionIndex >= questions.length - 1;
  btn.textContent = isLast ? 'Voir les résultats' : 'Question suivante';
  btn.addEventListener('click', () => {
    SFX.play('tap');
    questionIndex++;
    renderQuestion();
  });
  container.appendChild(btn);
}

async function showResults() {
  const total = questions.length;
  const pct = total > 0 ? score / total : 0;
  const starCount = Math.round(pct * 5);
  const timeSec = Math.round((Date.now() - sessionStartTime) / 1000);

  let title, message;
  if (pct === 1) {
    title = 'Parfait !'; message = 'Tu as tout bon, bravo !';
    SFX.play('perfect');
    setTimeout(() => Confetti.launch(120), 300);
  } else if (pct >= 0.8) {
    title = 'Excellent !'; message = 'Tu connais très bien cette histoire !';
    SFX.play('complete');
    setTimeout(() => Confetti.launch(60), 300);
  } else if (pct >= 0.6) {
    title = 'Bien joué !'; message = 'Encore un petit effort !';
    SFX.play('complete');
  } else if (pct >= 0.4) {
    title = 'Pas mal !'; message = 'Relis quelques passages et réessaie !';
    SFX.play('complete');
  } else {
    title = 'Continue !'; message = 'Relis le livre et retente ta chance !';
    SFX.play('complete');
  }

  const lottieContainer = $('#results-lottie');
  if (pct >= 0.8) {
    lottieContainer.innerHTML = `<lottie-player src="${LottieOverlay.ANIMS.trophy}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`;
  } else if (pct >= 0.4) {
    lottieContainer.innerHTML = `<lottie-player src="${LottieOverlay.ANIMS.star}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`;
  } else {
    lottieContainer.innerHTML = `<div style="font-size:4rem;">📖</div>`;
  }

  $('#results-title').textContent = title;
  $('#results-score-num').textContent = score;
  $('#results-score-total').textContent = total;
  $('#results-message').textContent = message;

  const starsHtml = Array.from({ length: 5 }, (_, i) =>
    `<span class="results-star">${i < starCount ? '⭐' : '☆'}</span>`
  ).join('');
  $('#results-stars').innerHTML = starsHtml;

  $('#quiz-progress-fill').style.width = '100%';

  const modeForSave = currentMode === 'surprise' ? 'surprise' : currentMode;
  saveBestScore(currentBook.id, modeForSave, score, total);

  // Gamification: log session and earn XP
  try {
    const result = await endSessionFlow({
      app: 'quiz-livre',
      correct: score,
      total,
      timeSec
    });
    $('#results-xp').textContent = `+${result.xp} XP gagnés !`;
  } catch (e) {
    console.error('Gamification error:', e);
  }

  showScreen('results');
}

document.addEventListener('DOMContentLoaded', init);
