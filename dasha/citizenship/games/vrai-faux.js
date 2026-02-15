import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';

export function renderVraiFaux({ item, container, onAnswer }) {
  let answered = false;

  container.innerHTML = `
    <div class="question-text">${item.statement}</div>
    <div class="vf-buttons">
      <button class="vf-btn vf-btn--vrai" data-val="true">VRAI</button>
      <button class="vf-btn vf-btn--faux" data-val="false">FAUX</button>
    </div>
  `;

  container.querySelectorAll('.vf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      SFX.play('tap');

      const chosen = btn.dataset.val === 'true';
      const correct = chosen === item.isTrue;
      const correctVal = item.isTrue ? 'true' : 'false';

      container.querySelectorAll('.vf-btn').forEach(b => {
        b.classList.add('disabled');
        if (b.dataset.val === correctVal) b.classList.add('correct');
      });

      if (correct) {
        SFX.play('correct');
        LottieOverlay.show('correct', 800);
      } else {
        btn.classList.add('wrong');
        SFX.play('wrong');
      }

      showExplanation(container, item.explanation);
      onAnswer(correct);
    });
  });
}

function showExplanation(container, text) {
  if (!text) return;
  const div = document.createElement('div');
  div.className = 'explanation';
  div.textContent = text;
  container.appendChild(div);
}
