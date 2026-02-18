import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { shuffle } from '../../../shared/helpers.js';

export function renderFlagQuiz({ item, container, allItems, onAnswer }) {
  let answered = false;

  const wrong = shuffle(allItems.filter(f => f.id !== item.id)).slice(0, 3);
  const choices = shuffle([item, ...wrong]);

  container.innerHTML = `
    <div class="flag-quiz">
      <div class="flag-quiz-prompt">Quel est ce pays ?</div>
      <div class="flag-quiz-emoji">${item.emoji}</div>
      <div class="flag-quiz-choices">
        ${choices.map((c, i) => `<button class="flag-choice" data-idx="${i}">${c.country}</button>`).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.flag-choice').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      SFX.play('tap');

      const correct = choices[i].id === item.id;

      container.querySelectorAll('.flag-choice').forEach((b, j) => {
        b.classList.add('disabled');
        if (choices[j].id === item.id) b.classList.add('correct');
      });

      if (correct) {
        btn.classList.add('correct');
        SFX.play('correct');
        LottieOverlay.show('correct', 800);
      } else {
        btn.classList.add('wrong');
        SFX.play('wrong');
      }

      const info = document.createElement('div');
      info.className = 'flag-info';
      info.innerHTML = `${item.emoji} <strong>${item.country}</strong> — Capitale : ${item.capital} — ${item.continent}`;
      container.querySelector('.flag-quiz').appendChild(info);

      onAnswer(correct);
    });
  });
}

export function renderFlagReverse({ item, container, allItems, onAnswer }) {
  let answered = false;

  const wrong = shuffle(allItems.filter(f => f.id !== item.id)).slice(0, 3);
  const choices = shuffle([item, ...wrong]);

  container.innerHTML = `
    <div class="flag-quiz">
      <div class="flag-quiz-prompt">Quel est le drapeau de <strong>${item.country}</strong> ?</div>
      <div class="flag-quiz-choices flag-emoji-choices">
        ${choices.map((c, i) => `<button class="flag-choice flag-emoji-btn" data-idx="${i}">${c.emoji}</button>`).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.flag-choice').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      SFX.play('tap');

      const correct = choices[i].id === item.id;

      container.querySelectorAll('.flag-choice').forEach((b, j) => {
        b.classList.add('disabled');
        if (choices[j].id === item.id) b.classList.add('correct');
      });

      if (correct) {
        btn.classList.add('correct');
        SFX.play('correct');
        LottieOverlay.show('correct', 800);
      } else {
        btn.classList.add('wrong');
        SFX.play('wrong');
      }

      onAnswer(correct);
    });
  });
}
