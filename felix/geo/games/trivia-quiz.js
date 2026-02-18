import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';

export function renderTriviaQuiz({ item, container, onAnswer }) {
  let answered = false;

  container.innerHTML = `
    <div class="trivia-quiz">
      <div class="trivia-category-badge">${item.category || 'Trivial Géo'}</div>
      <div class="trivia-question">${item.question}</div>
      <div class="trivia-choices">
        ${item.choices.map((c, i) => `<button class="trivia-choice" data-idx="${i}">${c}</button>`).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.trivia-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      SFX.play('tap');

      const idx = parseInt(btn.dataset.idx);
      const correct = idx === item.answer;

      container.querySelectorAll('.trivia-choice').forEach(b => {
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

      if (item.explanation) {
        const expl = document.createElement('div');
        expl.className = 'trivia-explanation';
        expl.textContent = item.explanation;
        container.querySelector('.trivia-quiz').appendChild(expl);
      }

      onAnswer(correct);
    });
  });
}
