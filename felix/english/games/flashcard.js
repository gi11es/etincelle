import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { checkTranslation } from './check-answer.js';

export function renderFlashcard({ item, container, onAnswer, speak }) {
  let answered = false;

  container.innerHTML = `
    <div class="flashcard">
      <button class="btn-speak" id="fc-speak" title="Écouter">🔊</button>
      <div class="flashcard-word">${item.en}</div>
      <div class="flashcard-phonetic">${item.type === 'sentence' ? 'Traduis cette phrase' : 'Traduis ce mot'}</div>
      <div class="translate-input-row">
        <input class="translate-input" id="fc-input" type="text" placeholder="Traduction en français..." autocomplete="off" autocapitalize="off">
        <button class="btn-submit" id="fc-submit">Valider</button>
      </div>
      <div id="fc-feedback"></div>
    </div>
  `;

  const input = container.querySelector('#fc-input');
  const submitBtn = container.querySelector('#fc-submit');

  // Speak the word
  container.querySelector('#fc-speak').addEventListener('click', () => {
    SFX.play('speak');
    speak(item.en);
  });

  // Auto-speak
  setTimeout(() => speak(item.en), 300);

  function check() {
    if (answered) return;
    answered = true;

    const userVal = input.value.trim();
    const correct = checkTranslation(userVal, item.fr);

    input.disabled = true;
    submitBtn.disabled = true;

    const feedback = container.querySelector('#fc-feedback');

    if (correct) {
      SFX.play('correct');
      LottieOverlay.show('correct', 800);
      input.classList.add('answer-correct-input');
      feedback.innerHTML = `
        <div class="translate-correct-answer" style="color:var(--success);margin-top:12px">✓ ${item.fr}</div>
      `;
    } else {
      SFX.play('wrong');
      input.classList.add('answer-wrong-input');
      feedback.innerHTML = `
        <div class="translate-correct-answer" style="color:var(--danger);margin-top:12px">✗ ${userVal || '(vide)'}</div>
        <div class="translate-correct-answer" style="color:var(--success)">Réponse : ${item.fr}</div>
      `;
    }

    if (item.example_en) {
      feedback.innerHTML += `<div class="flashcard-example" style="margin-top:12px">${item.example_en}<br><em>${item.example_fr}</em></div>`;
    }

    onAnswer(correct);
  }

  submitBtn.addEventListener('click', check);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  input.focus();
}
