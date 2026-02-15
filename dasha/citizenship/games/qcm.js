import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';

export function renderQCM({ item, container, onAnswer }) {
  let answered = false;

  container.innerHTML = `
    <div class="question-text">${item.question}</div>
    <div class="choices">
      ${item.choices.map((c, i) => `<button class="choice-btn" data-idx="${i}">${c}</button>`).join('')}
    </div>
  `;

  container.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      SFX.play('tap');

      const idx = parseInt(btn.dataset.idx);
      const correct = idx === item.answer;

      container.querySelectorAll('.choice-btn').forEach(b => {
        b.classList.add('disabled');
        if (parseInt(b.dataset.idx) === item.answer) b.classList.add('correct');
      });

      if (correct) {
        btn.classList.add('correct');
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
