import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { normalize } from '../../../shared/helpers.js';

export function renderListenType({ item, container, onAnswer, speak }) {
  let answered = false;
  let playCount = 0;

  container.innerHTML = `
    <div class="listen-container">
      <div class="question-text">Écoute et écris ce que tu entends</div>
      <button class="listen-play-btn" id="lt-play">🔊</button>
      <div class="listen-hint" id="lt-hint">${item.type === 'sentence' ? 'Une phrase en anglais' : 'Un mot en anglais'}</div>
      <div class="translate-input-row">
        <input class="translate-input" id="lt-input" type="text" placeholder="Écris ce que tu entends..." autocomplete="off" autocapitalize="off">
        <button class="btn-submit" id="lt-submit">Valider</button>
      </div>
      <div id="lt-feedback"></div>
    </div>
  `;

  const playBtn = container.querySelector('#lt-play');
  const input = container.querySelector('#lt-input');
  const submitBtn = container.querySelector('#lt-submit');

  function playAudio() {
    playBtn.classList.add('playing');
    speak(item.en, 'en-GB');
    playCount++;

    // Show hint after 2 plays
    if (playCount >= 2) {
      const hint = container.querySelector('#lt-hint');
      hint.textContent = `Indice : ${item.fr}`;
    }

    setTimeout(() => playBtn.classList.remove('playing'), 1500);
  }

  playBtn.addEventListener('click', () => {
    SFX.play('speak');
    playAudio();
  });

  // Auto-play on load
  setTimeout(playAudio, 500);

  function check() {
    if (answered) return;
    answered = true;

    const userVal = input.value.trim();
    const correct = checkListening(userVal, item.en);

    input.disabled = true;
    submitBtn.disabled = true;

    const feedback = container.querySelector('#lt-feedback');

    if (correct) {
      SFX.play('correct');
      LottieOverlay.show('correct', 800);
      input.classList.add('answer-correct-input');
      feedback.innerHTML = `<div class="translate-correct-answer" style="color:var(--success)">✓ ${item.en}</div>`;
    } else {
      SFX.play('wrong');
      input.classList.add('answer-wrong-input');
      feedback.innerHTML = `
        <div class="translate-correct-answer" style="color:var(--danger)">✗ ${userVal || '(vide)'}</div>
        <div class="translate-correct-answer" style="color:var(--success)">Réponse : ${item.en}</div>
      `;
    }

    feedback.innerHTML += `<div class="flashcard-example" style="margin-top:12px">${item.fr}</div>`;

    onAnswer(correct);
  }

  submitBtn.addEventListener('click', check);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  input.focus();
}

function checkListening(userVal, answer) {
  if (!userVal) return false;
  const u = normalize(userVal);
  const a = normalize(answer);
  if (u === a) return true;

  // Allow small typos
  if (u.length >= 3 && levenshtein(u, a) <= Math.max(2, Math.floor(a.length * 0.2))) return true;

  return false;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
