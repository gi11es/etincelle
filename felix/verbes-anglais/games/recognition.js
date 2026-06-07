import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { checkTranslation } from '../../english/games/check-answer.js';

/* Recognition: the three forms are shown; type the French meaning.
   Easiest mode — used to introduce new verbs. */
export function renderVerbRecognition({ item, container, onAnswer, speak }) {
  let answered = false;

  container.innerHTML = `
    <div class="verb-card">
      <button class="btn-speak" id="rc-speak" title="Écouter">🔊</button>
      <div class="verb-forms">
        <span class="verb-form">${item.base}</span>
        <span class="verb-arrow">→</span>
        <span class="verb-form">${item.preterit}</span>
        <span class="verb-arrow">→</span>
        <span class="verb-form">${item.participle}</span>
      </div>
      <div class="verb-meaning">Que veut dire ce verbe en français ?</div>
      <div class="translate-input-row">
        <input class="translate-input" id="rc-input" type="text" placeholder="Traduction en français..." autocomplete="off" autocapitalize="off">
        <button class="btn-submit" id="rc-submit">Valider</button>
      </div>
      <div id="rc-feedback"></div>
    </div>
  `;

  container.querySelector('#rc-speak').addEventListener('click', () => {
    SFX.play('speak');
    speak(`${item.base}, ${item.preterit.replace('/', ' or ')}, ${item.participle.replace('/', ' or ')}`);
  });
  setTimeout(() => speak(item.base), 300);

  const input = container.querySelector('#rc-input');
  const submitBtn = container.querySelector('#rc-submit');

  function check() {
    if (answered) return;
    answered = true;

    const correct = checkTranslation(input.value.trim(), item.fr);
    input.disabled = true;
    submitBtn.disabled = true;
    input.classList.add(correct ? 'answer-correct-input' : 'answer-wrong-input');

    const feedback = container.querySelector('#rc-feedback');
    if (correct) {
      SFX.play('correct');
      LottieOverlay.show('correct', 800);
      feedback.innerHTML = `<div class="translate-correct-answer" style="color:var(--success)">✓ ${item.fr}</div>`;
    } else {
      SFX.play('wrong');
      feedback.innerHTML = `<div class="translate-correct-answer" style="color:var(--success)">Réponse : ${item.fr}</div>`;
    }
    feedback.innerHTML += `<div class="flashcard-example" style="margin-top:12px">${item.example_en}<br><em>${item.example_fr}</em></div>`;

    onAnswer(correct);
  }

  submitBtn.addEventListener('click', check);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  input.focus();
}
