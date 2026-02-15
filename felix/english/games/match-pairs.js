import SFX from '../../../shared/sfx.js';
import { shuffle, escapeAttr } from '../../../shared/helpers.js';

export function renderMatchPairs({ container, pairItems, onAnswer }) {
  if (!pairItems || pairItems.length < 2) {
    onAnswer(true);
    return;
  }

  const pairs = pairItems.slice(0, 6);
  const enItems = shuffle(pairs.map(p => ({ text: p.en, id: p.id })));
  const frItems = shuffle(pairs.map(p => ({ text: p.fr, id: p.id })));

  let selectedEn = null;
  let selectedFr = null;
  let matchedCount = 0;
  let errors = 0;
  const totalPairs = pairs.length;

  container.innerHTML = `
    <div class="question-text">Relie les paires anglais-français</div>
    <div class="match-container">
      <div class="match-column">
        <h4>English</h4>
        ${enItems.map(e => `<div class="match-item match-en" data-id="${e.id}" data-val="${escapeAttr(e.text)}">${e.text}</div>`).join('')}
      </div>
      <div class="match-column">
        <h4>Français</h4>
        ${frItems.map(f => `<div class="match-item match-fr" data-id="${f.id}" data-val="${escapeAttr(f.text)}">${f.text}</div>`).join('')}
      </div>
    </div>
  `;

  const enEls = container.querySelectorAll('.match-en');
  const frEls = container.querySelectorAll('.match-fr');

  function tryMatch() {
    if (!selectedEn || !selectedFr) return;

    const enEl = container.querySelector(`.match-en.selected`);
    const frEl = container.querySelector(`.match-fr.selected`);

    if (selectedEn === selectedFr) {
      // Correct match
      enEl.classList.add('matched');
      enEl.classList.remove('selected');
      frEl.classList.add('matched');
      frEl.classList.remove('selected');
      matchedCount++;
      SFX.play('match');

      if (matchedCount === totalPairs) {
        SFX.play('correct');
        onAnswer(errors <= 1);
      }
    } else {
      // Wrong match
      enEl.classList.add('wrong-match');
      frEl.classList.add('wrong-match');
      errors++;
      SFX.play('wrong');
      setTimeout(() => {
        enEl.classList.remove('wrong-match', 'selected');
        frEl.classList.remove('wrong-match', 'selected');
      }, 500);
    }

    selectedEn = null;
    selectedFr = null;
  }

  enEls.forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('matched')) return;
      SFX.play('tap');
      enEls.forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      selectedEn = el.dataset.id;
      tryMatch();
    });
  });

  frEls.forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('matched')) return;
      SFX.play('tap');
      frEls.forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      selectedFr = el.dataset.id;
      tryMatch();
    });
  });
}
