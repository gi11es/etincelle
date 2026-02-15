import SFX from '../../../shared/sfx.js';
import { shuffle, escapeAttr } from '../../../shared/helpers.js';

/**
 * Match Pairs — connect French items to their definitions/equivalents.
 * For registers: match soutenu ↔ familier.
 * For others: match word ↔ definition.
 */
export function renderMatchPairs({ container, pairItems, onAnswer }) {
  if (!pairItems || pairItems.length < 2) { onAnswer(true); return; }

  const pairs = pairItems.slice(0, 6);
  const isRegister = pairs[0]?.type === 'register';

  let leftItems, rightItems, leftLabel, rightLabel;

  if (isRegister) {
    // Match soutenu ↔ familier
    leftLabel = 'Soutenu';
    rightLabel = 'Familier';
    leftItems = shuffle(pairs.filter(p => p.fr_soutenu && p.fr_familier).map(p => ({ text: p.fr_soutenu, id: p.id })));
    rightItems = shuffle(pairs.filter(p => p.fr_soutenu && p.fr_familier).map(p => ({ text: p.fr_familier, id: p.id })));
  } else {
    // Match word ↔ short definition
    leftLabel = 'Mot';
    rightLabel = 'Définition';
    leftItems = shuffle(pairs.map(p => ({ text: p.fr, id: p.id })));
    rightItems = shuffle(pairs.map(p => ({
      text: truncate(p.definition_fr || p.en, 50),
      id: p.id
    })));
  }

  let selectedLeft = null;
  let selectedRight = null;
  let matchedCount = 0;
  let errors = 0;
  const totalPairs = Math.min(leftItems.length, rightItems.length);

  container.innerHTML = `
    <div class="question-text" style="margin-bottom:12px">${isRegister ? 'Relie les registres' : 'Relie les paires'}</div>
    <div class="match-container">
      <div class="match-column">
        <h4>${leftLabel}</h4>
        ${leftItems.map(f => `<div class="match-item match-fr" data-id="${f.id}" data-val="${escapeAttr(f.text)}">${f.text}</div>`).join('')}
      </div>
      <div class="match-column">
        <h4>${rightLabel}</h4>
        ${rightItems.map(e => `<div class="match-item match-en" data-id="${e.id}" data-val="${escapeAttr(e.text)}">${e.text}</div>`).join('')}
      </div>
    </div>
  `;

  const leftEls = container.querySelectorAll('.match-fr');
  const rightEls = container.querySelectorAll('.match-en');

  function tryMatch() {
    if (!selectedLeft || !selectedRight) return;

    const leftEl = container.querySelector('.match-fr.selected');
    const rightEl = container.querySelector('.match-en.selected');

    if (selectedLeft === selectedRight) {
      leftEl.classList.add('matched');
      leftEl.classList.remove('selected');
      rightEl.classList.add('matched');
      rightEl.classList.remove('selected');
      matchedCount++;
      SFX.play('match');

      if (matchedCount === totalPairs) {
        SFX.play('correct');
        onAnswer(errors <= 1);
      }
    } else {
      leftEl.classList.add('wrong-match');
      rightEl.classList.add('wrong-match');
      errors++;
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
      if (el.classList.contains('matched')) return;
      SFX.play('tap');
      leftEls.forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      selectedLeft = el.dataset.id;
      tryMatch();
    });
  });

  rightEls.forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('matched')) return;
      SFX.play('tap');
      rightEls.forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      selectedRight = el.dataset.id;
      tryMatch();
    });
  });
}

function truncate(text, max) {
  if (!text || text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}
