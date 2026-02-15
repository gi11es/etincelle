import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { shuffle, escapeAttr } from '../../../shared/helpers.js';

/**
 * Flashcard game — QCM "Que signifie ce mot ?"
 * Adapts to item type: word, expression, register, false_friend, nuance.
 */
export function renderFlashcard({ item, container, allItems, onAnswer, speak }) {
  switch (item.type) {
    case 'register':    return renderRegister(item, container, allItems, onAnswer, speak);
    case 'false_friend': return renderTrap(item, container, onAnswer, speak);
    case 'nuance':      return renderNuance(item, container, onAnswer, speak);
    default:            return renderDefinitionQCM(item, container, allItems, onAnswer, speak);
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

/* ────────── Level 1 & 2: Word/Expression → pick definition ────────── */
function renderDefinitionQCM(item, container, allItems, onAnswer, speak) {
  const word = item.fr;
  const correctDef = item.definition_fr;
  const wrongDefs = pickWrong(item, allItems, 'definition_fr', 3);
  const choices = shuffle([correctDef, ...wrongDefs]);

  container.innerHTML = `
    <button class="btn-speak" id="fc-speak" title="Écouter">🔊</button>
    <div class="flashcard-word">${word}</div>
    <div class="question-text" style="margin:14px 0">Que signifie ce mot ?</div>
    <div class="fill-choices fc-stacked">
      ${choices.map(c => `<button class="fill-choice" data-val="${escapeAttr(c)}">${c}</button>`).join('')}
    </div>
    <div id="fc-feedback"></div>
  `;

  container.querySelector('#fc-speak').addEventListener('click', () => { SFX.play('speak'); speak(word, 'fr-FR'); });
  setTimeout(() => speak(word, 'fr-FR'), 300);

  bindChoices(container, correctDef, (correct) => {
    showFeedback(container, item);
    setTimeout(() => speak(item.example_fr, 'fr-FR'), 400);
    onAnswer(correct);
  });
}

/* ────────── Level 3: Registers — "Quel registre ?" or "Register swap" ────────── */
function renderRegister(item, container, allItems, onAnswer, speak) {
  if (Math.random() < 0.5) {
    return renderIdentifyRegister(item, container, onAnswer, speak);
  }
  return renderRegisterSwap(item, container, allItems, onAnswer, speak);
}

function renderIdentifyRegister(item, container, onAnswer, speak) {
  const regs = [
    { key: 'fr_soutenu', label: 'Soutenu', desc: 'formel, littéraire' },
    { key: 'fr_courant', label: 'Courant', desc: 'standard, neutre' },
    { key: 'fr_familier', label: 'Familier', desc: 'informel, oral' },
  ];
  const available = regs.filter(r => item[r.key]);
  const picked = available[Math.floor(Math.random() * available.length)];
  const word = item[picked.key];

  container.innerHTML = `
    <button class="btn-speak" id="fc-speak" title="Écouter">🔊</button>
    <div class="flashcard-word">${word}</div>
    <div class="question-text" style="margin:14px 0">Quel est le registre de ce mot ?</div>
    <div class="fill-choices">
      ${regs.map(r => `<button class="fill-choice" data-val="${r.label}"><strong>${r.label}</strong><br><span style="font-size:0.8rem;color:var(--text-dim)">${r.desc}</span></button>`).join('')}
    </div>
    <div id="fc-feedback"></div>
  `;

  container.querySelector('#fc-speak').addEventListener('click', () => { SFX.play('speak'); speak(word, 'fr-FR'); });
  setTimeout(() => speak(word, 'fr-FR'), 300);

  bindChoices(container, picked.label, (correct) => {
    showRegisterExplanation(container, item);
    onAnswer(correct);
  });
}

function renderRegisterSwap(item, container, allItems, onAnswer, speak) {
  const regs = [
    { key: 'fr_soutenu', label: 'soutenu' },
    { key: 'fr_courant', label: 'courant' },
    { key: 'fr_familier', label: 'familier' },
  ];
  const available = regs.filter(r => item[r.key]);
  if (available.length < 2) { onAnswer(null); return; }

  const source = available[Math.floor(Math.random() * available.length)];
  const targets = available.filter(r => r.key !== source.key);
  const target = targets[Math.floor(Math.random() * targets.length)];

  const questionWord = item[source.key];
  const correctAnswer = item[target.key];
  const wrongAnswers = shuffle(allItems.filter(i => i.id !== item.id && i.type === 'register' && i[target.key]))
    .slice(0, 3).map(i => i[target.key]);
  const choices = shuffle([correctAnswer, ...wrongAnswers]);

  container.innerHTML = `
    <button class="btn-speak" id="fc-speak" title="Écouter">🔊</button>
    <div class="flashcard-word">${questionWord}</div>
    <div class="question-text" style="margin:14px 0">En registre <strong>${target.label}</strong>, comment dit-on ?</div>
    <div class="fill-choices">
      ${choices.map(c => `<button class="fill-choice" data-val="${escapeAttr(c)}">${c}</button>`).join('')}
    </div>
    <div id="fc-feedback"></div>
  `;

  container.querySelector('#fc-speak').addEventListener('click', () => { SFX.play('speak'); speak(questionWord, 'fr-FR'); });
  setTimeout(() => speak(questionWord, 'fr-FR'), 300);

  bindChoices(container, correctAnswer, (correct) => {
    showRegisterExplanation(container, item);
    setTimeout(() => speak(correctAnswer, 'fr-FR'), 400);
    onAnswer(correct);
  });
}

/* ────────── Level 4 faux amis: "Piège ou pas ?" ────────── */
function renderTrap(item, container, onAnswer, speak) {
  const word = item.fr;
  const isTrap = Math.random() < 0.5;

  // Trap: show the English false-friend meaning (translated to look like a French definition)
  // Correct: show the real French definition
  const proposedMeaning = isTrap ? item.en_trap : item.definition_fr;
  const correctAnswer = isTrap ? 'piege' : 'correct';

  container.innerHTML = `
    <button class="btn-speak" id="fc-speak" title="Écouter">🔊</button>
    <div class="flashcard-word">${word}</div>
    <div class="trap-box">
      <div class="trap-label">Signification proposée :</div>
      <div class="trap-meaning">${proposedMeaning}</div>
    </div>
    <div class="question-text" style="margin:12px 0">Cette signification est-elle correcte ?</div>
    <div class="fill-choices">
      <button class="fill-choice trap-btn-correct" data-val="correct">Correct !</button>
      <button class="fill-choice trap-btn-piege" data-val="piege">Piège !</button>
    </div>
    <div id="fc-feedback"></div>
  `;

  container.querySelector('#fc-speak').addEventListener('click', () => { SFX.play('speak'); speak(word, 'fr-FR'); });
  setTimeout(() => speak(word, 'fr-FR'), 300);

  bindChoices(container, correctAnswer, (correct) => {
    const fb = container.querySelector('#fc-feedback');
    fb.innerHTML = `
      <div class="trap-explanation">
        <div style="margin-bottom:8px">${item.definition_fr}</div>
        ${item.en_trap ? `<div class="trap-warning">Attention : « ${item.en_trap} » est un faux ami !</div>` : ''}
      </div>
    `;
    showFeedback(fb, item, true);
    onAnswer(correct);
  });
}

/* ────────── Level 4 nuances: "Quel mot ?" ────────── */
function renderNuance(item, container, onAnswer, speak) {
  const parts = item.fr.split(/\s+vs\s+/i).map(s => s.trim());
  if (parts.length < 2) { onAnswer(null); return; }

  // Extract individual word definitions from the combined definition_fr
  // Format: "'Word1' = desc1. 'Word2' = desc2."
  const wordDefs = parseNuanceDefs(item.definition_fr, parts);

  if (wordDefs.length < 2) { onAnswer(null); return; }

  // Pick one word's definition and ask which word it describes
  const picked = wordDefs[Math.floor(Math.random() * wordDefs.length)];
  const correctWord = picked.word;

  container.innerHTML = `
    <div class="nuance-header">${item.fr}</div>
    <div class="question-text" style="margin:14px 0">Quel mot correspond à cette description ?</div>
    <div class="trap-box">
      <div class="trap-meaning">${picked.description}</div>
    </div>
    <div class="fill-choices" style="margin-top:16px">
      ${shuffle(parts).map(p => `<button class="fill-choice" data-val="${escapeAttr(p)}">${p}</button>`).join('')}
    </div>
    <div id="fc-feedback"></div>
  `;

  bindChoices(container, correctWord, (correct) => {
    showFeedback(container, item);
    onAnswer(correct);
  });
}

/* ── Helpers ── */
function pickWrong(item, allItems, field, count) {
  // Prefer same category for more believable distractors
  const sameCategory = shuffle(allItems.filter(i => i.id !== item.id && i[field] && i.category === item.category));
  const others = shuffle(allItems.filter(i => i.id !== item.id && i[field] && i.category !== item.category));
  const pool = [...sameCategory, ...others];
  return pool.slice(0, count).map(i => i[field]);
}

function parseNuanceDefs(definition, parts) {
  // Try to split the definition into per-word descriptions
  // Pattern: 'Word' = description. 'Word2' = description.
  const results = [];
  for (const word of parts) {
    // Find the word in the definition (quoted)
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp("[''']" + escaped + "[''']\\s*[=:+]\\s*([^.]+\\.?)", 'i');
    const m = definition.match(re);
    if (m) {
      results.push({ word, description: m[1].trim() });
    }
  }
  return results;
}

function showFeedback(container, item, append = false) {
  const target = append ? container : container.querySelector('#fc-feedback');
  if (!target) return;
  if (item.example_fr) {
    target.innerHTML += `<div class="flashcard-example" style="margin-top:12px">${item.example_fr}${item.example_en ? '<br><em>' + item.example_en + '</em>' : ''}</div>`;
  }
}

function showRegisterExplanation(container, item) {
  const fb = container.querySelector('#fc-feedback');
  if (!fb) return;
  fb.innerHTML = `
    <div class="register-grid">
      <div class="register-tag soutenu">Soutenu</div><div>${item.fr_soutenu || '—'}</div>
      <div class="register-tag courant">Courant</div><div>${item.fr_courant || '—'}</div>
      <div class="register-tag familier">Familier</div><div>${item.fr_familier || '—'}</div>
    </div>
  `;
}
