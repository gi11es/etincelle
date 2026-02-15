import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { shuffle, escapeAttr } from '../../../shared/helpers.js';

/**
 * Reverse QCM — Definition/context → pick the right word.
 * Adapts to item type: word, expression, register, false_friend, nuance.
 */
export function renderTranslate({ item, container, allItems, onAnswer, speak }) {
  switch (item.type) {
    case 'register':    return renderRegisterContext(item, container, allItems, onAnswer, speak);
    case 'false_friend': return renderFauxAmiQCM(item, container, allItems, onAnswer, speak);
    case 'nuance':      return renderNuanceContext(item, container, allItems, onAnswer, speak);
    default:            return renderReverseQCM(item, container, allItems, onAnswer, speak);
  }
}

/* ── Shared choice handler ── */
function bindChoices(container, correctVal, onDone) {
  let answered = false;
  container.querySelectorAll('.fill-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      SFX.play('tap');

      const chosen = btn.dataset.val;
      const correct = chosen === correctVal;

      container.querySelectorAll('.fill-choice').forEach(b => {
        b.classList.add('disabled');
        if (b.dataset.val === correctVal) b.classList.add('correct');
      });

      if (correct) {
        btn.classList.add('correct');
        SFX.play('correct');
        LottieOverlay.show('correct', 800);
      } else {
        btn.classList.add('wrong');
        SFX.play('wrong');
      }

      onDone(correct);
    });
  });
}

/* ────────── Level 1 & 2: Definition → pick the word ────────── */
function renderReverseQCM(item, container, allItems, onAnswer, speak) {
  const correctWord = item.fr;
  const definition = item.definition_fr;
  const wrongWords = pickWrong(item, allItems, 'fr', 3);
  const choices = shuffle([correctWord, ...wrongWords]);

  container.innerHTML = `
    <div class="question-text" style="margin-bottom:14px">Quel mot correspond à cette définition ?</div>
    <div class="trap-box">
      <div class="trap-meaning">${definition}</div>
    </div>
    <div class="fill-choices" style="margin-top:16px">
      ${choices.map(c => `<button class="fill-choice" data-val="${escapeAttr(c)}">${c}</button>`).join('')}
    </div>
    <div id="tr-feedback"></div>
  `;

  bindChoices(container, correctWord, (correct) => {
    showExample(container, '#tr-feedback', item, speak);
    setTimeout(() => speak(correctWord, 'fr-FR'), 400);
    onAnswer(correct);
  });
}

/* ────────── Level 3: Situation → pick the right register word ────────── */
function renderRegisterContext(item, container, allItems, onAnswer, speak) {
  // Pick a target register and show a social situation that calls for it
  const situations = [
    { key: 'fr_soutenu', label: 'soutenu', context: 'Vous écrivez une lettre officielle. Quel mot utiliser ?' },
    { key: 'fr_soutenu', label: 'soutenu', context: 'Vous vous adressez à un juge au tribunal. Quel mot utiliser ?' },
    { key: 'fr_familier', label: 'familier', context: 'Vous discutez avec vos amis proches. Quel mot utiliser ?' },
    { key: 'fr_familier', label: 'familier', context: 'Vous envoyez un SMS à un bon copain. Quel mot utiliser ?' },
    { key: 'fr_courant', label: 'courant', context: 'Vous parlez avec un collègue au bureau. Quel mot utiliser ?' },
    { key: 'fr_courant', label: 'courant', context: 'Vous expliquez quelque chose à votre médecin. Quel mot utiliser ?' },
  ];

  const available = situations.filter(s => item[s.key]);
  if (available.length === 0) { onAnswer(null); return; }

  const picked = available[Math.floor(Math.random() * available.length)];
  const correctAnswer = item[picked.key];
  const concept = item.definition_fr;

  // Wrong answers: words from other registers of other items
  const allRegKeys = ['fr_soutenu', 'fr_courant', 'fr_familier'];
  const wrongAnswers = shuffle(
    allItems.filter(i => i.id !== item.id && i.type === 'register')
      .flatMap(i => allRegKeys.filter(k => k !== picked.key && i[k]).map(k => i[k]))
  ).slice(0, 3);

  const choices = shuffle([correctAnswer, ...wrongAnswers]);

  container.innerHTML = `
    <div class="context-concept">${concept}</div>
    <div class="context-situation">${picked.context}</div>
    <div class="fill-choices" style="margin-top:16px">
      ${choices.map(c => `<button class="fill-choice" data-val="${escapeAttr(c)}">${c}</button>`).join('')}
    </div>
    <div id="tr-feedback"></div>
  `;

  bindChoices(container, correctAnswer, (correct) => {
    const fb = container.querySelector('#tr-feedback');
    fb.innerHTML = `
      <div class="register-grid">
        <div class="register-tag soutenu">Soutenu</div><div>${item.fr_soutenu || '—'}</div>
        <div class="register-tag courant">Courant</div><div>${item.fr_courant || '—'}</div>
        <div class="register-tag familier">Familier</div><div>${item.fr_familier || '—'}</div>
      </div>
    `;
    setTimeout(() => speak(correctAnswer, 'fr-FR'), 400);
    onAnswer(correct);
  });
}

/* ────────── Level 4 faux amis: Word → pick correct definition (with traps) ────────── */
function renderFauxAmiQCM(item, container, allItems, onAnswer, speak) {
  const word = item.fr;
  const correctDef = item.definition_fr;

  // Use other faux-ami definitions as wrong answers (they sound similarly tricky)
  const wrongDefs = shuffle(
    allItems.filter(i => i.id !== item.id && i.type === 'false_friend' && i.definition_fr)
  ).slice(0, 3).map(i => i.definition_fr);

  const choices = shuffle([correctDef, ...wrongDefs]);

  container.innerHTML = `
    <button class="btn-speak" id="tr-speak" title="Écouter">🔊</button>
    <div class="flashcard-word">${word}</div>
    <div class="question-text" style="margin:14px 0">Quelle est la bonne définition ?</div>
    <div class="fill-choices fc-stacked">
      ${choices.map(c => `<button class="fill-choice" data-val="${escapeAttr(c)}">${c}</button>`).join('')}
    </div>
    <div id="tr-feedback"></div>
  `;

  container.querySelector('#tr-speak').addEventListener('click', () => { SFX.play('speak'); speak(word, 'fr-FR'); });
  setTimeout(() => speak(word, 'fr-FR'), 300);

  bindChoices(container, correctDef, (correct) => {
    const fb = container.querySelector('#tr-feedback');
    if (item.en_trap) {
      fb.innerHTML = `<div class="trap-warning" style="margin-top:12px">Attention : « ${item.en_trap} » est un faux ami !</div>`;
    }
    showExample(fb, null, item, speak, true);
    onAnswer(correct);
  });
}

/* ────────── Level 4 nuances: Example sentence → pick the rule ────────── */
function renderNuanceContext(item, container, allItems, onAnswer, speak) {
  const parts = item.fr.split(/\s+vs\s+/i).map(s => s.trim());
  if (parts.length < 2) { onAnswer(null); return; }

  // Show an example sentence (which contains one of the two words)
  // Ask: which rule applies here?
  const sentences = (item.example_fr || '').split(/\s*[/]\s*/);
  if (sentences.length < 2) { onAnswer(null); return; }

  // Pick a random sentence
  const idx = Math.floor(Math.random() * Math.min(sentences.length, parts.length));
  const sentence = sentences[idx];
  const correctWord = parts[idx];
  const wrongWord = parts.find(p => p !== correctWord) || parts[0];

  // Parse per-word definitions
  const wordDefs = parseNuanceDefs(item.definition_fr, parts);
  const correctDef = wordDefs.find(d => d.word === correctWord);
  const wrongDef = wordDefs.find(d => d.word === wrongWord);

  if (!correctDef || !wrongDef) { onAnswer(null); return; }

  // Show the sentence + ask which rule explains the usage
  const correctRule = `« ${correctDef.word} » = ${correctDef.description}`;
  const wrongRule = `« ${wrongDef.word} » = ${wrongDef.description}`;
  const choices = shuffle([
    { val: 'correct', text: correctRule },
    { val: 'wrong', text: wrongRule },
  ]);

  container.innerHTML = `
    <div class="question-text" style="margin-bottom:14px">Quelle règle explique l'usage dans cette phrase ?</div>
    <div class="context-situation" style="margin-bottom:16px;font-style:italic">${sentence}</div>
    <div class="fill-choices fc-stacked">
      ${choices.map(c => `<button class="fill-choice" data-val="${c.val}">${c.text}</button>`).join('')}
    </div>
    <div id="tr-feedback"></div>
  `;

  bindChoices(container, 'correct', (correct) => {
    showExample(container, '#tr-feedback', item, speak);
    onAnswer(correct);
  });
}

/* ── Helpers ── */
function pickWrong(item, allItems, field, count) {
  const sameCategory = shuffle(allItems.filter(i => i.id !== item.id && i[field] && i.category === item.category));
  const others = shuffle(allItems.filter(i => i.id !== item.id && i[field] && i.category !== item.category));
  return [...sameCategory, ...others].slice(0, count).map(i => i[field]);
}

function parseNuanceDefs(definition, parts) {
  const results = [];
  for (const word of parts) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp("[''']" + escaped + "[''']\\s*[=:+]\\s*([^.]+\\.?)", 'i');
    const m = definition.match(re);
    if (m) {
      results.push({ word, description: m[1].trim() });
    }
  }
  return results;
}

function showExample(container, selector, item, speak, append = false) {
  const target = selector ? container.querySelector(selector) : container;
  if (!target) return;
  if (item.example_fr) {
    target.innerHTML += `<div class="flashcard-example" style="margin-top:12px">${item.example_fr}</div>`;
  }
}
