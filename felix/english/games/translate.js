import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { checkTranslation } from './check-answer.js';

export function renderTranslate({ item, container, onAnswer, speak }) {
  // Randomly choose direction: EN→FR or FR→EN
  const enToFr = Math.random() > 0.5;
  const prompt = enToFr ? 'Traduis en français :' : 'Translate to English:';
  const word = enToFr ? item.en : item.fr;
  const answer = enToFr ? item.fr : item.en;
  let answered = false;

  container.innerHTML = `
    <div class="translate-prompt">${prompt}</div>
    ${!enToFr ? '' : `<button class="btn-speak" id="tr-speak" title="Écouter" style="margin-bottom:8px">🔊</button>`}
    <div class="translate-word">${word}</div>
    <div class="translate-input-row">
      <input class="translate-input" type="text" placeholder="Ta réponse..." autocomplete="off" autocapitalize="off">
      <button class="btn-submit" id="tr-submit">Valider</button>
    </div>
    <div id="tr-feedback"></div>
  `;

  if (enToFr) {
    container.querySelector('#tr-speak').addEventListener('click', () => {
      SFX.play('speak');
      speak(item.en);
    });
    setTimeout(() => speak(item.en), 300);
  }

  const input = container.querySelector('.translate-input');
  const submitBtn = container.querySelector('#tr-submit');

  function check() {
    if (answered) return;
    answered = true;

    const userVal = input.value.trim();
    const correct = checkTranslation(userVal, answer);

    input.disabled = true;
    submitBtn.disabled = true;

    const feedback = container.querySelector('#tr-feedback');

    if (correct) {
      SFX.play('correct');
      LottieOverlay.show('correct', 800);
      input.classList.add('answer-correct-input');
      feedback.innerHTML = `<div class="translate-correct-answer" style="color:var(--success)">✓ ${answer}</div>`;
    } else {
      SFX.play('wrong');
      input.classList.add('answer-wrong-input');
      feedback.innerHTML = `
        <div class="translate-correct-answer" style="color:var(--danger)">✗ Ta réponse : ${userVal || '(vide)'}</div>
        <div class="translate-correct-answer" style="color:var(--success)">Réponse : ${answer}</div>
      `;
    }

    // Show example
    feedback.innerHTML += `<div class="flashcard-example" style="margin-top:12px">${item.example_en}<br><em>${item.example_fr}</em></div>`;

    onAnswer(correct);
  }

  submitBtn.addEventListener('click', check);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  input.focus();
}
