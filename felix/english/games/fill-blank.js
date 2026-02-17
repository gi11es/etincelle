import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { shuffle, escapeAttr } from '../../../shared/helpers.js';

export function renderFillBlank({ item, container, allItems, onAnswer, speak }) {
  let answered = false;

  // Determine the display answer and search term
  let displayAnswer = item.en;
  let searchTerm = item.en;

  // For irregular verbs like "went (go)", extract just the inflected form
  const parenMatch = searchTerm.match(/^(.+?)\s*\(.*\)$/);
  if (parenMatch) {
    searchTerm = parenMatch[1].trim();
    displayAnswer = searchTerm;
  }

  // Strip trailing punctuation: the answer is inserted into a larger sentence,
  // so trailing periods/marks would create e.g. "word., next word"
  displayAnswer = displayAnswer.replace(/[.!?]+$/, '');
  const searchBase = searchTerm.replace(/[.!?]+$/, '');

  // Build regex: match the phrase (trailing punctuation already stripped)
  const regex = new RegExp(escapeRegex(searchBase), 'i');

  const sentence = item.example_en.replace(
    regex,
    '<span class="fill-blank-gap" id="fb-gap">______</span>'
  );

  // If no match found, show blank at end (fallback)
  const hasBlanked = sentence.includes('fb-gap');
  const displaySentence = hasBlanked
    ? sentence
    : `${item.example_en} <span class="fill-blank-gap" id="fb-gap">______</span>`;

  // Generate wrong choices from same type, stripping parentheticals
  const wrongItems = shuffle(allItems.filter(i => i.id !== item.id && i.type === item.type))
    .slice(0, 3)
    .map(i => {
      const m = i.en.match(/^(.+?)\s*\(.*\)$/);
      return (m ? m[1].trim() : i.en).replace(/[.!?]+$/, '');
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

      // Speak the full sentence
      setTimeout(() => speak(item.example_en), 400);

      onAnswer(correct);
    });
  });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
