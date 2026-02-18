import SFX from '../../../shared/sfx.js';
import { shuffle, escapeAttr } from '../../../shared/helpers.js';

export function renderCapitalMatch({ container, pairItems, onAnswer }) {
  if (!pairItems || pairItems.length < 2) {
    onAnswer(true);
    return;
  }

  const pairs = pairItems.slice(0, 6);
  const countryItems = shuffle(pairs.map(p => ({ text: p.emoji + ' ' + p.country, id: p.id })));
  const capitalItems = shuffle(pairs.map(p => ({ text: p.capital, id: p.id })));

  let selectedCountry = null;
  let selectedCapital = null;
  let matchedCount = 0;
  let errors = 0;
  const totalPairs = pairs.length;

  container.innerHTML = `
    <div class="question-text">Relie chaque pays à sa capitale</div>
    <div class="match-container">
      <div class="match-column">
        <h4>Pays</h4>
        ${countryItems.map(c => `<div class="match-item match-en" data-id="${c.id}" data-val="${escapeAttr(c.text)}">${c.text}</div>`).join('')}
      </div>
      <div class="match-column">
        <h4>Capitales</h4>
        ${capitalItems.map(c => `<div class="match-item match-fr" data-id="${c.id}" data-val="${escapeAttr(c.text)}">${c.text}</div>`).join('')}
      </div>
    </div>
  `;

  const countryEls = container.querySelectorAll('.match-en');
  const capitalEls = container.querySelectorAll('.match-fr');

  function tryMatch() {
    if (!selectedCountry || !selectedCapital) return;

    const cEl = container.querySelector('.match-en.selected');
    const capEl = container.querySelector('.match-fr.selected');

    if (selectedCountry === selectedCapital) {
      cEl.classList.add('matched');
      cEl.classList.remove('selected');
      capEl.classList.add('matched');
      capEl.classList.remove('selected');
      matchedCount++;
      SFX.play('match');

      if (matchedCount === totalPairs) {
        SFX.play('correct');
        onAnswer(errors <= 1);
      }
    } else {
      cEl.classList.add('wrong-match');
      capEl.classList.add('wrong-match');
      errors++;
      SFX.play('wrong');
      setTimeout(() => {
        cEl.classList.remove('wrong-match', 'selected');
        capEl.classList.remove('wrong-match', 'selected');
      }, 500);
    }

    selectedCountry = null;
    selectedCapital = null;
  }

  countryEls.forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('matched')) return;
      SFX.play('tap');
      countryEls.forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      selectedCountry = el.dataset.id;
      tryMatch();
    });
  });

  capitalEls.forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('matched')) return;
      SFX.play('tap');
      capitalEls.forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      selectedCapital = el.dataset.id;
      tryMatch();
    });
  });
}
