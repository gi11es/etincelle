import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { shuffle, escapeAttr } from '../../../shared/helpers.js';

export function renderFillBlank({ item, container, allItems, onAnswer, speak }) {
  let answered = false;

  // Build sentence with blank
  const sentence = item.example_fr.replace(
    new RegExp(escapeRegex(item.fr), 'i'),
    '<span class="fill-blank-gap" id="fb-gap">______</span>'
  );

  const hasBlanked = sentence.includes('fb-gap');
  const displaySentence = hasBlanked
    ? sentence
    : `${item.example_fr.split(item.fr)[0] || ''}<span class="fill-blank-gap" id="fb-gap">______</span>${item.example_fr.split(item.fr)[1] || ''}`;

  // Generate wrong choices
  const wrongItems = shuffle(allItems.filter(i => i.id !== item.id && i.category === item.category))
    .slice(0, 3)
    .map(i => i.fr);

  // If not enough from same category, pick from others
  while (wrongItems.length < 3) {
    const extra = shuffle(allItems.filter(i => i.id !== item.id && !wrongItems.includes(i.fr)));
    if (extra.length === 0) break;
    wrongItems.push(extra[0].fr);
  }

  const choices = shuffle([item.fr, ...wrongItems.slice(0, 3)]);

  container.innerHTML = `
    <div class="question-text">Complète la phrase :</div>
    <div class="fill-blank-sentence">${displaySentence}</div>
    <p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:12px;font-style:italic">${item.example_en || item.en}</p>
    <div class="fill-choices">
      ${choices.map(c => `<button class="fill-choice" data-val="${escapeAttr(c)}">${c}</button>`).join('')}
    </div>
    <div id="fb-feedback"></div>
  `;

  container.querySelectorAll('.fill-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      SFX.play('tap');

      const chosen = btn.dataset.val;
      const correct = chosen.toLowerCase() === item.fr.toLowerCase();

      container.querySelectorAll('.fill-choice').forEach(b => {
        b.classList.add('disabled');
        if (b.dataset.val.toLowerCase() === item.fr.toLowerCase()) b.classList.add('correct');
      });

      const gap = container.querySelector('#fb-gap');

      if (correct) {
        btn.classList.add('correct');
        gap.textContent = item.fr;
        gap.style.color = 'var(--success)';
        gap.style.borderColor = 'var(--success)';
        SFX.play('correct');
        LottieOverlay.show('correct', 800);
      } else {
        btn.classList.add('wrong');
        gap.textContent = item.fr;
        gap.style.color = 'var(--danger)';
        gap.style.borderColor = 'var(--danger)';
        SFX.play('wrong');
      }

      setTimeout(() => speak(item.example_fr, 'fr-FR'), 400);

      onAnswer(correct);
    });
  });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
