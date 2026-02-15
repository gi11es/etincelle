import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { checkTranslation } from './check-answer.js';

export function renderFlashcard({ item, container, onAnswer, speak }) {
  let answered = false;

  const word = item.fr;
  const definition = item.definition_fr || '';

  container.innerHTML = `
    <div class="flashcard">
      <button class="btn-speak" id="fc-speak" title="Écouter">🔊</button>
      <div class="flashcard-word">${word}</div>
      ${definition ? `<div class="flashcard-definition">${definition}</div>` : ''}
      <div class="flashcard-phonetic">Traduis en anglais</div>
      <div class="translate-input-row">
        <input class="translate-input" id="fc-input" type="text" placeholder="English translation..." autocomplete="off" autocapitalize="off">
        <button class="btn-submit" id="fc-submit">Valider</button>
      </div>
      <div id="fc-feedback"></div>
    </div>
  `;

  const input = container.querySelector('#fc-input');
  const submitBtn = container.querySelector('#fc-submit');

  container.querySelector('#fc-speak').addEventListener('click', () => {
    SFX.play('speak');
    speak(word, 'fr-FR');
  });

  setTimeout(() => speak(word, 'fr-FR'), 300);

  function check() {
    if (answered) return;
    answered = true;

    const userVal = input.value.trim();
    const correct = checkTranslation(userVal, item.en);

    input.disabled = true;
    submitBtn.disabled = true;

    const feedback = container.querySelector('#fc-feedback');

    if (correct) {
      SFX.play('correct');
      LottieOverlay.show('correct', 800);
      input.classList.add('answer-correct-input');
      feedback.innerHTML = `
        <div class="translate-correct-answer" style="color:var(--success);margin-top:12px">✓ ${item.en}</div>
      `;
    } else {
      SFX.play('wrong');
      input.classList.add('answer-wrong-input');
      feedback.innerHTML = `
        <div class="translate-correct-answer" style="color:var(--danger);margin-top:12px">✗ ${userVal || '(vide)'}</div>
        <div class="translate-correct-answer" style="color:var(--success)">Réponse : ${item.en}</div>
      `;
    }

    if (item.example_fr) {
      feedback.innerHTML += `<div class="flashcard-example" style="margin-top:12px">${item.example_fr}<br><em>${item.example_en || ''}</em></div>`;
    }

    onAnswer(correct);
  }

  submitBtn.addEventListener('click', check);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  input.focus();
}
