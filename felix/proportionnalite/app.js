import { $, showScreen } from '../../shared/helpers.js';
import SFX from '../../shared/sfx.js';
import Confetti from '../../shared/confetti.js';
import LottieOverlay from '../../shared/lottie-overlay.js';
import * as DB from '../../shared/db.js';
import { endSessionFlow } from '../../shared/gamification.js';
import { recordAnswer } from '../../shared/spaced-repetition.js';
import { THEMES, THEME_BY_ID, makeExam, makePractice, isCorrect, answerText, fmt } from './questions.js';
import { ATELIERS } from './ateliers.js';

const APP = 'proportionnalite';
const HISTORY_KEY = 'felix-prop4-controles';
const EXAM_MINUTES = 50;

let mode = null; // 'practice' | 'exam'
let themeId = null;
let questions = [];
let index = 0;
let responses = []; // exam: index (mcq) or string (num); practice: boolean correct
let score = 0;
let startTime = 0;
let timerId = 0;
let atelierCleanup = null;
let currentAtelier = null;

// ─── Home ──────────────────────────────────────────────────────────────────

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

async function renderHome() {
  const hist = loadHistory();
  if (hist.length) {
    const best = Math.max(...hist.map(h => h.note));
    const last = hist[hist.length - 1];
    $('#exam-history').textContent = `Dernière note : ${fmt(last.note, 1)}/20 · Meilleure : ${fmt(best, 1)}/20 · ${hist.length} contrôle${hist.length > 1 ? 's' : ''}`;
  }

  const mastery = await DB.getAllMastery(APP);
  const grid = $('#theme-grid');
  grid.innerHTML = '';
  for (const theme of THEMES) {
    const m = mastery.find(r => r.itemId === `prop4-${theme.id}`);
    const acc = m && m.totalAttempts ? Math.round((m.totalCorrect / m.totalAttempts) * 100) : null;
    const card = document.createElement('button');
    card.className = 'theme-card';
    card.innerHTML = `
      <span class="theme-icon">${theme.icon}</span>
      <span class="theme-name">${theme.title}</span>
      <span class="theme-meta">${acc === null ? 'Pas encore travaillé' : `${acc} % de réussite`}</span>
      <span class="theme-bar"><span style="width:${acc || 0}%"></span></span>`;
    card.addEventListener('click', () => { SFX.play('tap'); openFiche(theme.id); });
    grid.appendChild(card);
  }

  const ag = $('#atelier-grid');
  ag.innerHTML = '';
  for (const at of ATELIERS) {
    const card = document.createElement('button');
    card.className = 'atelier-card';
    card.innerHTML = `<span class="atelier-icon">${at.icon}</span><span class="atelier-info"><strong>${at.title}</strong><span>${at.desc}</span></span>`;
    card.addEventListener('click', () => { SFX.play('tap'); startAtelier(at); });
    ag.appendChild(card);
  }
}

function goHome() {
  stopTimer();
  if (atelierCleanup) { atelierCleanup(); atelierCleanup = null; }
  renderHome();
  showScreen('home');
}

// ─── Revision sheet ────────────────────────────────────────────────────────

function openFiche(id) {
  themeId = id;
  const theme = THEME_BY_ID[id];
  $('#fiche-title').textContent = `${theme.icon} ${theme.title}`;
  $('#fiche-body').innerHTML = theme.fiche;
  showScreen('fiche');
}

// ─── Rendering helpers ─────────────────────────────────────────────────────

function renderTable(table) {
  return `<div class="prop-table-wrap"><table class="prop-table">${table.rows.map(row =>
    `<tr><th>${row[0]}</th>${row.slice(1).map(c => `<td${c === '?' || c === 'x' ? ' class="missing"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
}

/** Static SVG graph for the questions: grid, axes, points and optional lines. */
function renderGraph(g) {
  const W = 320, H = 240, L = 44, R = 14, T = 26, B = 40;
  const pw = W - L - R, ph = H - T - B;
  const X = x => L + (x / g.xmax) * pw;
  const Y = y => T + ph - (y / g.ymax) * ph;
  let s = `<svg class="prop-graph" viewBox="0 0 ${W} ${H}" role="img">`;
  for (let x = 0; x <= g.xmax + 1e-9; x += g.xstep) {
    s += `<line class="g-grid" x1="${X(x)}" y1="${T}" x2="${X(x)}" y2="${T + ph}"/>`;
    s += `<text class="g-tick" x="${X(x)}" y="${T + ph + 14}" text-anchor="middle">${fmt(x)}</text>`;
  }
  for (let y = 0; y <= g.ymax + 1e-9; y += g.ystep) {
    s += `<line class="g-grid" x1="${L}" y1="${Y(y)}" x2="${L + pw}" y2="${Y(y)}"/>`;
    s += `<text class="g-tick" x="${L - 5}" y="${Y(y) + 4}" text-anchor="end">${fmt(y)}</text>`;
  }
  s += `<line class="g-axis" x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}"/><line class="g-axis" x1="${L}" y1="${T}" x2="${L}" y2="${T + ph}"/>`;
  const lines = g.lines || (g.line ? [g.line] : []);
  lines.forEach((ln, i) => {
    const xEnd = Math.min(g.xmax, (g.ymax - ln.b) / ln.k);
    s += `<line class="g-line g-line-${i}" x1="${X(0)}" y1="${Y(ln.b)}" x2="${X(xEnd)}" y2="${Y(ln.k * xEnd + ln.b)}"/>`;
    if (ln.label) s += `<text class="g-line-label g-line-${i}" x="${X(xEnd) - 4}" y="${Y(ln.k * xEnd + ln.b) + 14}" text-anchor="end">${ln.label}</text>`;
  });
  for (const [x, y] of g.points) {
    s += `<circle class="g-point" cx="${X(x)}" cy="${Y(y)}" r="4.5"/>`;
  }
  s += `<text class="g-label" x="${L + pw}" y="${H - 4}" text-anchor="end">${g.xLabel}</text>`;
  s += `<text class="g-label" x="${L - 36}" y="${T - 12}" text-anchor="start">${g.yLabel}</text>`;
  return s + '</svg>';
}

function nl2br(text) {
  return text.replace(/\n/g, '<br>');
}

function questionHTML(q, number) {
  return `
    ${q.hard ? '<div class="q-badge">Problème</div>' : ''}
    <div class="q-text">${number ? `<span class="q-num">${number}.</span> ` : ''}${q.text}</div>
    ${q.table ? renderTable(q.table) : ''}
    ${q.graph ? renderGraph(q.graph) : ''}`;
}

function answerZoneHTML(q, response) {
  if (q.kind === 'mcq') {
    return `<div class="q-choices">${q.choices.map((c, i) =>
      `<button class="q-choice${response === i ? ' selected' : ''}" data-idx="${i}">${c}</button>`).join('')}</div>`;
  }
  return `<div class="q-input-row">
    <input class="q-input" type="text" inputmode="decimal" autocomplete="off" placeholder="Ta réponse" value="${response ?? ''}">
    ${q.unit ? `<span class="q-unit">${q.unit}</span>` : ''}
  </div>`;
}

// ─── Practice ──────────────────────────────────────────────────────────────

function startPractice() {
  mode = 'practice';
  questions = makePractice(themeId);
  index = 0;
  score = 0;
  responses = [];
  startTime = Date.now();
  $('#exam-nav').classList.add('hidden');
  $('#session-pill').innerHTML = '<span>⭐</span><span id="practice-score">0</span>';
  showScreen('session');
  SFX.play('whoosh');
  renderPractice();
}

function renderPractice() {
  const q = questions[index];
  $('#session-progress').style.width = `${(index / questions.length) * 100}%`;
  $('#session-count').textContent = `${THEME_BY_ID[themeId].title} · ${index + 1} / ${questions.length}`;
  const box = $('#question-container');
  box.innerHTML = questionHTML(q) + answerZoneHTML(q) +
    (q.kind === 'num' ? '<button class="btn-submit q-submit">Valider</button>' : '') +
    '<div class="q-feedback"></div>';
  let answered = false;
  const validate = (response) => {
    if (answered) return;
    answered = true;
    const ok = isCorrect(q, response);
    responses.push(ok);
    if (ok) {
      score++;
      $('#practice-score').textContent = score;
      SFX.play('correct');
      LottieOverlay.show('correct', 700);
    } else {
      SFX.play('wrong');
    }
    recordAnswer(`prop4-${q.theme}`, ok, APP, '4eme');
    box.querySelectorAll('.q-choice').forEach(b => {
      b.disabled = true;
      if (+b.dataset.idx === q.answer) b.classList.add('correct');
      else if (+b.dataset.idx === response) b.classList.add('wrong');
    });
    const input = box.querySelector('.q-input');
    if (input) {
      input.disabled = true;
      input.classList.add(ok ? 'answer-correct-input' : 'answer-wrong-input');
      box.querySelector('.q-submit').disabled = true;
    }
    box.querySelector('.q-feedback').innerHTML = `
      <div class="q-verdict ${ok ? 'ok' : 'ko'}">${ok ? '✓ Juste !' : `✗ La bonne réponse : <strong>${answerText(q)}</strong>`}</div>
      <div class="q-correction">${nl2br(q.correction)}</div>`;
    const next = document.createElement('button');
    next.className = 'btn-next';
    next.textContent = index + 1 < questions.length ? 'Question suivante' : 'Voir le résultat';
    next.addEventListener('click', () => {
      SFX.play('tap');
      index++;
      if (index < questions.length) renderPractice();
      else showPracticeResults();
    });
    box.appendChild(next);
    next.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  box.querySelectorAll('.q-choice').forEach(b => b.addEventListener('click', () => validate(+b.dataset.idx)));
  const input = box.querySelector('.q-input');
  if (input) {
    box.querySelector('.q-submit').addEventListener('click', () => validate(input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') validate(input.value); });
    input.focus();
  }
}

async function showPracticeResults() {
  const total = questions.length;
  const pct = score / total;
  $('#results-title').textContent = pct >= 0.9 ? 'Excellent !' : pct >= 0.7 ? 'Bien joué !' : pct >= 0.5 ? 'Pas mal !' : 'Relis la fiche !';
  $('#results-message').textContent = pct >= 0.7 ? 'Ce chapitre est presque prêt pour le contrôle.' : 'Relis la fiche de cours, puis recommence.';
  $('#results-score').textContent = score;
  $('#results-total').textContent = total;
  $('#results-lottie').innerHTML = pct >= 0.8
    ? `<lottie-player src="${LottieOverlay.ANIMS.trophy}" background="transparent" speed="1" style="width:120px;height:120px;" autoplay></lottie-player>`
    : '<div style="font-size:4rem;">📐</div>';
  if (pct >= 0.7) setTimeout(() => Confetti.launch(60), 300);
  SFX.play(pct === 1 ? 'perfect' : 'complete');
  $('#session-progress').style.width = '100%';
  showScreen('results');
  await awardXP(score, total);
}

async function awardXP(correct, total, target = '#results-xp') {
  try {
    const res = await endSessionFlow({ app: APP, correct, total, timeSec: Math.round((Date.now() - startTime) / 1000) });
    $(target).textContent = `+${res.xp} XP gagnés !`;
  } catch (e) {
    console.warn('Gamification error:', e);
  }
}

// ─── Exam ──────────────────────────────────────────────────────────────────

function startExam() {
  mode = 'exam';
  questions = makeExam();
  responses = new Array(questions.length).fill(null);
  index = 0;
  startTime = Date.now();
  $('#session-pill').innerHTML = '<span>⏱</span><span id="exam-timer">0:00</span>';
  $('#exam-nav').classList.remove('hidden');
  showScreen('session');
  SFX.play('whoosh');
  startTimer();
  renderExam();
}

function startTimer() {
  stopTimer();
  const tick = () => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    const node = $('#exam-timer');
    if (!node) return;
    node.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    node.parentElement.classList.toggle('overtime', s > EXAM_MINUTES * 60);
  };
  tick();
  timerId = setInterval(tick, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = 0;
}

function saveCurrentInput() {
  const input = $('#question-container .q-input');
  if (input) responses[index] = input.value.trim() === '' ? null : input.value.trim();
}

function renderExam() {
  const q = questions[index];
  const answered = responses.filter(r => r !== null).length;
  $('#session-progress').style.width = `${(answered / questions.length) * 100}%`;
  $('#session-count').textContent = `Question ${index + 1} / ${questions.length} · ${THEME_BY_ID[q.theme].title}`;
  const box = $('#question-container');
  box.innerHTML = questionHTML(q, index + 1) + answerZoneHTML(q, responses[index]) +
    '<p class="exam-hint">Pas de correction pendant le contrôle. Tu peux revenir sur une question avant de rendre ta copie.</p>';
  box.querySelectorAll('.q-choice').forEach(b => b.addEventListener('click', () => {
    SFX.play('tap');
    responses[index] = +b.dataset.idx;
    box.querySelectorAll('.q-choice').forEach(x => x.classList.toggle('selected', x === b));
    renderExamNav();
  }));
  const input = box.querySelector('.q-input');
  if (input) {
    input.addEventListener('input', () => { saveCurrentInput(); renderExamNav(); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') goExam(index + 1); });
  }
  renderExamNav();
}

function goExam(i) {
  saveCurrentInput();
  if (i < 0 || i >= questions.length) return;
  index = i;
  SFX.play('tap');
  renderExam();
  window.scrollTo(0, 0);
}

function renderExamNav() {
  const nav = $('#exam-nav');
  const last = index === questions.length - 1;
  nav.innerHTML = `
    <div class="exam-nav-buttons">
      <button class="btn btn-secondary" id="exam-prev" ${index === 0 ? 'disabled' : ''}>‹ Précédente</button>
      ${last ? '' : '<button class="btn btn-secondary" id="exam-next">Suivante ›</button>'}
    </div>
    <div class="exam-bubbles">${questions.map((_, i) =>
      `<button class="exam-bubble${responses[i] !== null ? ' done' : ''}${i === index ? ' current' : ''}" data-i="${i}">${i + 1}</button>`).join('')}</div>
    <button class="btn btn-primary exam-submit" id="exam-submit">Rendre ma copie</button>`;
  nav.querySelector('#exam-prev').addEventListener('click', () => goExam(index - 1));
  nav.querySelector('#exam-next')?.addEventListener('click', () => goExam(index + 1));
  nav.querySelectorAll('.exam-bubble').forEach(b => b.addEventListener('click', () => goExam(+b.dataset.i)));
  nav.querySelector('#exam-submit').addEventListener('click', submitExam);
}

function submitExam() {
  saveCurrentInput();
  const empty = responses.filter(r => r === null).length;
  if (empty && !confirm(`Il reste ${empty} question${empty > 1 ? 's' : ''} sans réponse. Rendre ta copie quand même ?`)) return;
  stopTimer();
  showCopie();
}

function appreciation(note) {
  if (note >= 18) return 'Excellent travail, tu maîtrises la proportionnalité !';
  if (note >= 15) return 'Très bien ! Quelques détails à revoir.';
  if (note >= 12) return 'Assez bien. Revois les chapitres en orange.';
  if (note >= 10) return 'Moyen : les bases sont là, entraîne-toi sur les problèmes.';
  return 'Insuffisant : relis les fiches et refais les exercices par chapitre.';
}

async function showCopie() {
  const timeSec = Math.round((Date.now() - startTime) / 1000);
  const results = questions.map((q, i) => isCorrect(q, responses[i]));
  const note = results.filter(Boolean).length; // 1 point per question, 20 questions
  questions.forEach((q, i) => recordAnswer(`prop4-${q.theme}`, results[i], APP, '4eme'));

  const hist = loadHistory();
  hist.push({ date: new Date().toISOString(), note, timeSec });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(-20)));

  $('#copie-note').textContent = fmt(note, 1);
  $('#copie-note').className = note >= 15 ? 'good' : note >= 10 ? 'mid' : 'bad';
  $('#copie-appreciation').textContent = appreciation(note);
  $('#copie-meta').textContent = `Temps : ${Math.floor(timeSec / 60)} min ${String(timeSec % 60).padStart(2, '0')} s`;
  $('#copie-xp').textContent = '';

  $('#copie-bilan').innerHTML = THEMES.map(t => {
    const idx = questions.map((q, i) => (q.theme === t.id ? i : -1)).filter(i => i >= 0);
    const pts = idx.filter(i => results[i]).length;
    const ratio = pts / idx.length;
    const cls = ratio === 1 ? 'good' : ratio >= 0.5 ? 'mid' : 'bad';
    return `<button class="bilan-row ${cls}" data-theme="${t.id}">
      <span>${t.icon} ${t.title}</span><span class="bilan-pts">${pts}/${idx.length}</span></button>`;
  }).join('');
  $('#copie-bilan').querySelectorAll('.bilan-row').forEach(b => b.addEventListener('click', () => openFiche(b.dataset.theme)));

  $('#copie-corrections').innerHTML = questions.map((q, i) => {
    const r = responses[i];
    const given = r === null ? '(pas de réponse)' : q.kind === 'mcq' ? q.choices[r] : `${r}${q.unit ? ' ' + q.unit : ''}`;
    return `<div class="corr-card ${results[i] ? 'ok' : 'ko'}">
      ${questionHTML(q, i + 1)}
      <div class="corr-answers">
        <div>Ta réponse : <strong>${given}</strong> ${results[i] ? '✓' : '✗'}</div>
        ${results[i] ? '' : `<div>Bonne réponse : <strong>${answerText(q)}</strong></div>`}
      </div>
      <div class="q-correction">${nl2br(q.correction)}</div>
    </div>`;
  }).join('');

  showScreen('copie');
  window.scrollTo(0, 0);
  SFX.play(note >= 16 ? 'perfect' : 'complete');
  if (note >= 15) setTimeout(() => Confetti.launch(note === 20 ? 140 : 80), 300);
  await awardXP(note, questions.length, '#copie-xp');
}

// ─── Workshops ─────────────────────────────────────────────────────────────

function startAtelier(at) {
  currentAtelier = at;
  if (atelierCleanup) atelierCleanup();
  startTime = Date.now();
  let stars = 0;
  $('#atelier-title').textContent = `${at.icon} ${at.title}`;
  $('#atelier-score').textContent = '0';
  $('#atelier-progress').style.width = '0%';
  showScreen('atelier');
  atelierCleanup = at.run($('#atelier-container'), {
    progress(i, n) { $('#atelier-progress').style.width = `${(i / n) * 100}%`; },
    score(ok) {
      if (ok) {
        stars++;
        $('#atelier-score').textContent = stars;
        SFX.play('correct');
      } else {
        SFX.play('wrong');
      }
    },
    async done(correct, total) {
      atelierCleanup();
      atelierCleanup = null;
      $('#atelier-progress').style.width = '100%';
      const box = $('#atelier-container');
      box.innerHTML = `<div class="results-card atelier-done">
        <div style="font-size:3.5rem">${correct === total ? '🏆' : '⭐'}</div>
        <h2>${correct} / ${total}</h2>
        <p>${correct === total ? 'Parfait !' : 'Recommence pour tout réussir.'}</p>
        <div class="results-xp" id="atelier-xp"></div>
        <div class="results-actions">
          <button class="btn btn-primary" id="atelier-retry">Rejouer</button>
          <button class="btn btn-secondary" data-go-home>Retour aux chapitres</button>
        </div></div>`;
      box.querySelector('#atelier-retry').addEventListener('click', () => startAtelier(currentAtelier));
      box.querySelector('[data-go-home]').addEventListener('click', goHome);
      if (correct === total) setTimeout(() => Confetti.launch(80), 200);
      SFX.play('complete');
      await awardXP(correct, total, '#atelier-xp');
    },
  });
}

// ─── Navigation ────────────────────────────────────────────────────────────

function bindNav() {
  document.querySelectorAll('[data-go-home]').forEach(b => b.addEventListener('click', () => { SFX.play('tap'); goHome(); }));
  $('#btn-start-exam').addEventListener('click', () => {
    SFX.play('tap');
    startExam();
  });
  $('#btn-start-practice').addEventListener('click', () => { SFX.play('tap'); startPractice(); });
  $('#btn-results-retry').addEventListener('click', () => { SFX.play('tap'); startPractice(); });
  $('#btn-copie-retry').addEventListener('click', () => { SFX.play('tap'); startExam(); });
  $('#btn-session-quit').addEventListener('click', () => {
    if (mode === 'exam' && !confirm('Abandonner le contrôle ? Tes réponses seront perdues.')) return;
    SFX.play('tap');
    if (mode === 'practice') openFiche(themeId);
    else goHome();
  });
  $('#btn-atelier-quit').addEventListener('click', () => { SFX.play('tap'); goHome(); });
}

async function init() {
  Confetti.init();
  bindNav();
  await renderHome();
}

document.addEventListener('DOMContentLoaded', init);
