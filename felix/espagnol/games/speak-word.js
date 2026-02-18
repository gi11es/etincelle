import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import STT from '../../../shared/stt-service.js';
import { checkSpeech } from './check-speech.js';

export function renderSpeakWord({ item, container, onAnswer, speak }) {
  let answered = false;
  let recording = false;

  container.innerHTML = `
    <div class="speak-container">
      <div class="question-text">Lis ce mot à voix haute :</div>
      <button class="btn-speak" id="sw-listen" title="Écouter la prononciation">🔊</button>
      <div class="speak-word-display">${item.es}</div>
      <div class="speak-hint">${item.fr}</div>
      <button class="speak-mic-btn" id="sw-mic">🎙️</button>
      <div class="speak-status" id="sw-status"></div>
      <div id="sw-feedback"></div>
      <button class="btn-skip" id="sw-skip">Passer</button>
    </div>
  `;

  const listenBtn = container.querySelector('#sw-listen');
  const micBtn = container.querySelector('#sw-mic');
  const statusEl = container.querySelector('#sw-status');
  const feedbackEl = container.querySelector('#sw-feedback');
  const skipBtn = container.querySelector('#sw-skip');

  if (!STT.isReady && !STT.isLoading) {
    STT.init('spanish', (progress) => {
      if (answered || STT.isReady) return;
      if (progress.status === 'progress' && progress.total) {
        const pct = Math.round((progress.loaded / progress.total) * 100);
        statusEl.textContent = `Préparation de l'IA... ${pct}%`;
      }
    });
  }

  if (STT.isReady) {
    statusEl.textContent = 'Écoute puis appuie sur le micro !';
  } else if (STT.isLoading) {
    statusEl.textContent = "L'IA se prépare... Tu peux déjà écouter !";
  } else {
    statusEl.textContent = 'Écoute puis appuie sur le micro !';
  }

  setTimeout(() => {
    SFX.play('speak');
    speak(item.es, 'es-ES');
  }, 400);

  listenBtn.addEventListener('click', () => {
    SFX.play('speak');
    speak(item.es, 'es-ES');
  });

  micBtn.addEventListener('click', async () => {
    if (answered || recording) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      statusEl.textContent = 'Le micro nécessite HTTPS.';
      return;
    }

    recording = true;
    micBtn.classList.add('recording');
    micBtn.textContent = '⏹️';

    try {
      const text = await STT.listen(
        4000,
        () => { statusEl.textContent = "🎙️ Je t'écoute... Dis le mot !"; },
        () => { statusEl.textContent = "🤖 L'IA réfléchit..."; }
      );

      recording = false;
      micBtn.classList.remove('recording');
      micBtn.textContent = '🎙️';

      if (!text || !text.trim()) {
        statusEl.textContent = "Je n'ai pas entendu. Réessaie !";
        return;
      }

      processResult(text.trim());
    } catch (e) {
      recording = false;
      micBtn.classList.remove('recording');
      micBtn.textContent = '🎙️';

      if (e.name === 'NotAllowedError') {
        statusEl.textContent = "Micro bloqué ! Clique sur le cadenas dans la barre d'adresse.";
      } else {
        statusEl.textContent = 'Micro non disponible. Réessaie !';
      }
    }
  });

  skipBtn.addEventListener('click', () => {
    if (answered) return;
    answered = true;
    SFX.play('wrong');
    feedbackEl.innerHTML = `
      <div class="translate-correct-answer" style="color:var(--danger)">Passé</div>
      <div class="translate-correct-answer" style="color:var(--success)">Réponse : ${item.es}</div>
    `;
    micBtn.disabled = true;
    skipBtn.style.display = 'none';
    onAnswer(false);
  });

  function processResult(said) {
    if (answered) return;

    const correct = checkSpeech(said, item.es);

    if (correct) {
      answered = true;
      SFX.play('correct');
      LottieOverlay.show('correct', 800);
      statusEl.textContent = '';
      feedbackEl.innerHTML = `
        <div class="translate-correct-answer" style="color:var(--success)">✓ Bravo !</div>
        <div class="speak-transcription">Tu as dit : « ${said} »</div>
      `;
      micBtn.disabled = true;
      skipBtn.style.display = 'none';
      onAnswer(true);
    } else {
      statusEl.textContent = 'Presque ! Réécoute et réessaie.';
      feedbackEl.innerHTML = `
        <div class="speak-transcription">Tu as dit : « ${said} »</div>
      `;
      speak(item.es, 'es-ES');
    }
  }
}
