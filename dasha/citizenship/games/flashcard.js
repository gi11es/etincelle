import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';

export function renderFlashcard({ item, container, onAnswer }) {
  let revealed = false;

  container.innerHTML = `
    <div class="flashcard-container">
      <div class="flashcard-front">${item.flashcard_front}</div>
      <button class="flashcard-reveal-btn" id="fc-reveal">Voir la réponse</button>
      <div id="fc-answer" style="display:none">
        <div class="flashcard-answer">${item.flashcard_back}</div>
        <div class="flashcard-self-grade">
          <button class="self-grade-btn self-grade-btn--wrong" data-correct="false">Je ne savais pas</button>
          <button class="self-grade-btn self-grade-btn--correct" data-correct="true">Je savais !</button>
        </div>
      </div>
    </div>
  `;

  const revealBtn = container.querySelector('#fc-reveal');
  const answerDiv = container.querySelector('#fc-answer');

  revealBtn.addEventListener('click', () => {
    if (revealed) return;
    revealed = true;
    SFX.play('reveal');
    revealBtn.style.display = 'none';
    answerDiv.style.display = 'block';
  });

  container.querySelectorAll('.self-grade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const correct = btn.dataset.correct === 'true';
      SFX.play('tap');

      container.querySelectorAll('.self-grade-btn').forEach(b => b.disabled = true);

      if (correct) {
        SFX.play('correct');
        LottieOverlay.show('correct', 800);
      } else {
        SFX.play('wrong');
      }

      if (item.explanation) {
        const exp = document.createElement('div');
        exp.className = 'explanation';
        exp.textContent = item.explanation;
        container.querySelector('.flashcard-container').appendChild(exp);
      }

      onAnswer(correct);
    });
  });
}
