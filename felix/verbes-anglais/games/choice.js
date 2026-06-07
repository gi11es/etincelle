import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { shuffle } from '../../../shared/helpers.js';

/* Multiple choice: pick the preterit OR the past participle of the verb.
   Distractors are drawn from the same form of other verbs. */
export function renderVerbChoice({ item, container, onAnswer, speak, allItems = [] }) {
  let answered = false;

  // Randomly drill the preterit or the past participle
  const askPart = Math.random() > 0.5 && item.participle !== item.preterit;
  const formKey = askPart ? 'participle' : 'preterit';
  const formLabel = askPart ? 'participe passé' : 'prétérit';
  const answer = item[formKey];

  // Build distractors from other verbs' same form
  const pool = shuffle(
    allItems
      .filter(v => v.id !== item.id && v[formKey] && v[formKey] !== answer)
      .map(v => v[formKey])
  );
  const distractors = [];
  for (const d of pool) {
    if (distractors.length >= 3) break;
    if (!distractors.includes(d)) distractors.push(d);
  }
  const options = shuffle([answer, ...distractors]);

  container.innerHTML = `
    <div class="verb-card">
      <button class="btn-speak" id="ch-speak" title="Écouter">🔊</button>
      <div class="verb-meaning">Quel est le <strong>${formLabel}</strong> de</div>
      <div class="verb-base">${item.base}</div>
      <div class="verb-meaning" style="opacity:0.7">(${item.fr})</div>
      <div class="verb-options" id="ch-options">
        ${options.map(o => `<button class="verb-option" data-val="${o.replace(/"/g, '&quot;')}">${o}</button>`).join('')}
      </div>
      <div id="ch-feedback"></div>
    </div>
  `;

  container.querySelector('#ch-speak').addEventListener('click', () => {
    SFX.play('speak');
    speak(item.base);
  });
  setTimeout(() => speak(item.base), 300);

  const feedback = container.querySelector('#ch-feedback');

  container.querySelectorAll('.verb-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const correct = btn.dataset.val === answer;

      container.querySelectorAll('.verb-option').forEach(b => {
        b.disabled = true;
        if (b.dataset.val === answer) b.classList.add('verb-option-correct');
        else if (b === btn) b.classList.add('verb-option-wrong');
      });

      if (correct) {
        SFX.play('correct');
        LottieOverlay.show('correct', 800);
      } else {
        SFX.play('wrong');
        feedback.innerHTML = `<div class="translate-correct-answer" style="color:var(--success)">Réponse : ${answer}</div>`;
      }
      feedback.innerHTML += `<div class="flashcard-example" style="margin-top:12px">${item.base} → ${item.preterit} → ${item.participle}<br>${item.example_en}<br><em>${item.example_fr}</em></div>`;

      onAnswer(correct);
    });
  });
}
