import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { checkTranslation } from './check-answer.js';

export function renderTranslate({ item, container, onAnswer, speak }) {
  // Randomly choose direction: FR→EN or EN→FR
  const frToEn = Math.random() > 0.5;
  const prompt = frToEn ? 'Translate to English:' : 'Traduis en français :';
  const word = frToEn ? item.fr : item.en;
  const answer = frToEn ? item.en : item.fr;
  let answered = false;

  container.innerHTML = `
    <div class="translate-prompt">${prompt}</div>
    ${frToEn ? `<button class="btn-speak" id="tr-speak" title="Écouter" style="margin-bottom:8px">🔊</button>` : ''}
    <div class="translate-word">${word}</div>
    ${item.definition_fr && frToEn ? `<div class="flashcard-definition" style="margin-bottom:16px">${item.definition_fr}</div>` : ''}
    <div class="translate-input-row">
      <input class="translate-input" type="text" placeholder="Ta réponse..." autocomplete="off" autocapitalize="off">
      <button class="btn-submit" id="tr-submit">Valider</button>
    </div>
    <div id="tr-feedback"></div>
  `;

  if (frToEn) {
    container.querySelector('#tr-speak').addEventListener('click', () => {
      SFX.play('speak');
      speak(item.fr, 'fr-FR');
    });
    setTimeout(() => speak(item.fr, 'fr-FR'), 300);
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

    if (item.example_fr) {
      feedback.innerHTML += `<div class="flashcard-example" style="margin-top:12px">${item.example_fr}<br><em>${item.example_en || ''}</em></div>`;
    }

    onAnswer(correct);
  }

  submitBtn.addEventListener('click', check);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  input.focus();
}
