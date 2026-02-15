import SFX from '../../../shared/sfx.js';
import { shuffle, escapeAttr } from '../../../shared/helpers.js';

export function renderMatchPairs({ container, pairItems, onAnswer }) {
  if (!pairItems || pairItems.length < 2) {
    onAnswer(true);
    return;
  }

  const pairs = pairItems.slice(0, 6);
  const frItems = shuffle(pairs.map(p => ({ text: p.fr, id: p.id })));
  const enItems = shuffle(pairs.map(p => ({ text: p.en, id: p.id })));

  let selectedFr = null;
  let selectedEn = null;
  let matchedCount = 0;
  let errors = 0;
  const totalPairs = pairs.length;

  container.innerHTML = `
    <div class="question-text">Relie les paires français-anglais</div>
    <div class="match-container">
      <div class="match-column">
        <h4>Français</h4>
        ${frItems.map(f => `<div class="match-item match-fr" data-id="${f.id}" data-val="${escapeAttr(f.text)}">${f.text}</div>`).join('')}
      </div>
      <div class="match-column">
        <h4>English</h4>
        ${enItems.map(e => `<div class="match-item match-en" data-id="${e.id}" data-val="${escapeAttr(e.text)}">${e.text}</div>`).join('')}
      </div>
    </div>
  `;

  const frEls = container.querySelectorAll('.match-fr');
  const enEls = container.querySelectorAll('.match-en');

  function tryMatch() {
    if (!selectedFr || !selectedEn) return;

    const frEl = container.querySelector(`.match-fr.selected`);
    const enEl = container.querySelector(`.match-en.selected`);

    if (selectedFr === selectedEn) {
      frEl.classList.add('matched');
      frEl.classList.remove('selected');
      enEl.classList.add('matched');
      enEl.classList.remove('selected');
      matchedCount++;
      SFX.play('match');

      if (matchedCount === totalPairs) {
        SFX.play('correct');
        onAnswer(errors <= 1);
      }
    } else {
      frEl.classList.add('wrong-match');
      enEl.classList.add('wrong-match');
      errors++;
      SFX.play('wrong');
      setTimeout(() => {
        frEl.classList.remove('wrong-match', 'selected');
        enEl.classList.remove('wrong-match', 'selected');
      }, 500);
    }

    selectedFr = null;
    selectedEn = null;
  }

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
}
