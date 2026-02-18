import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { shuffle, escapeAttr } from '../../../shared/helpers.js';

export function renderFillBlank({ item, container, allItems, onAnswer, speak }) {
  let answered = false;

  let displayAnswer = item.es;
  let searchTerm = item.es;

  const parenMatch = searchTerm.match(/^(.+?)\s*\(.*\)$/);
  if (parenMatch) {
    searchTerm = parenMatch[1].trim();
    displayAnswer = searchTerm;
  }

  displayAnswer = displayAnswer.replace(/[.!?¡¿]+$/, '');
  const searchBase = searchTerm.replace(/[.!?¡¿]+$/, '');

  const regex = new RegExp(escapeRegex(searchBase), 'i');

  const sentence = item.example_es.replace(
    regex,
    '<span class="fill-blank-gap" id="fb-gap">______</span>'
  );

  const hasBlanked = sentence.includes('fb-gap');
  const displaySentence = hasBlanked
    ? sentence
    : `${item.example_es} <span class="fill-blank-gap" id="fb-gap">______</span>`;

  const wrongItems = shuffle(allItems.filter(i => i.id !== item.id && i.type === item.type))
    .slice(0, 3)
    .map(i => {
      const m = i.es.match(/^(.+?)\s*\(.*\)$/);
      return (m ? m[1].trim() : i.es).replace(/[.!?¡¿]+$/, '');
    });

  const choices = shuffle([displayAnswer, ...wrongItems]);

  container.innerHTML = `
    <div class="question-text">Complète la phrase :</div>
    <div class="fill-blank-sentence">${displaySentence}</div>
    <p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:12px;font-style:italic">${item.example_fr}</p>
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
      const correct = chosen.toLowerCase() === displayAnswer.toLowerCase();

      container.querySelectorAll('.fill-choice').forEach(b => {
        b.classList.add('disabled');
        if (b.dataset.val.toLowerCase() === displayAnswer.toLowerCase()) b.classList.add('correct');
      });

      const gap = container.querySelector('#fb-gap');

      if (correct) {
        btn.classList.add('correct');
        gap.textContent = displayAnswer;
        gap.style.color = 'var(--success)';
        gap.style.borderColor = 'var(--success)';
        SFX.play('correct');
        LottieOverlay.show('correct', 800);
      } else {
        btn.classList.add('wrong');
        gap.textContent = displayAnswer;
        gap.style.color = 'var(--danger)';
        gap.style.borderColor = 'var(--danger)';
        SFX.play('wrong');
      }

      setTimeout(() => speak(item.example_es), 400);

      onAnswer(correct);
    });
  });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
