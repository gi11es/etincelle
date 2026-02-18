import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { shuffle } from '../../../shared/helpers.js';

export function renderSentenceBuilder({ item, container, onAnswer, speak }) {
  let answered = false;

  const words = item.es.split(/\s+/);
  const shuffledWords = shuffle([...words]);
  const selectedWords = [];

  container.innerHTML = `
    <div class="question-text">Remets les mots dans l'ordre</div>
    <div class="sentence-target">${item.fr}</div>
    <div class="sentence-slots" id="sb-slots">
      <span style="color:var(--text-muted);font-size:0.85rem">Clique sur les mots ci-dessous...</span>
    </div>
    <div class="sentence-word-bank" id="sb-bank">
      ${shuffledWords.map((w, i) => `<button class="word-chip" data-idx="${i}" data-word="${w}">${w}</button>`).join('')}
    </div>
    <button class="btn-submit" id="sb-submit" style="display:none;margin:16px auto 0;">Valider</button>
    <div id="sb-feedback"></div>
  `;

  const slots = container.querySelector('#sb-slots');
  const bank = container.querySelector('#sb-bank');
  const submitBtn = container.querySelector('#sb-submit');

  function updateSlots() {
    if (selectedWords.length === 0) {
      slots.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem">Clique sur les mots ci-dessous...</span>';
    } else {
      slots.innerHTML = selectedWords.map((w, i) =>
        `<button class="word-chip in-slot" data-slot-idx="${i}">${w}</button>`
      ).join('');

      slots.querySelectorAll('.word-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          if (answered) return;
          const idx = parseInt(chip.dataset.slotIdx);
          const word = selectedWords[idx];
          selectedWords.splice(idx, 1);

          bank.querySelectorAll('.word-chip').forEach(b => {
            if (b.classList.contains('used') && b.dataset.word === word) {
              b.classList.remove('used');
              return;
            }
          });

          SFX.play('tap');
          updateSlots();
          submitBtn.style.display = selectedWords.length === words.length ? 'block' : 'none';
        });
      });
    }
    slots.classList.toggle('active', selectedWords.length > 0);
  }

  bank.querySelectorAll('.word-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (answered || chip.classList.contains('used')) return;
      SFX.play('tap');
      chip.classList.add('used');
      selectedWords.push(chip.dataset.word);
      updateSlots();
      submitBtn.style.display = selectedWords.length === words.length ? 'block' : 'none';
    });
  });

  submitBtn.addEventListener('click', () => {
    if (answered) return;
    answered = true;

    const userSentence = selectedWords.join(' ');
    const correct = userSentence.toLowerCase() === item.es.toLowerCase();

    const feedback = container.querySelector('#sb-feedback');
    submitBtn.disabled = true;

    if (correct) {
      SFX.play('correct');
      LottieOverlay.show('correct', 800);
      slots.style.borderColor = 'var(--success)';
      slots.style.background = 'var(--success-light)';
      feedback.innerHTML = `<div class="translate-correct-answer" style="color:var(--success);margin-top:12px">✓ Parfait !</div>`;
    } else {
      SFX.play('wrong');
      slots.style.borderColor = 'var(--danger)';
      slots.style.background = 'var(--danger-light)';
      feedback.innerHTML = `
        <div class="translate-correct-answer" style="color:var(--danger);margin-top:12px">✗ ${userSentence}</div>
        <div class="translate-correct-answer" style="color:var(--success)">Réponse : ${item.es}</div>
      `;
    }

    setTimeout(() => speak(item.es), 400);

    onAnswer(correct);
  });
}
