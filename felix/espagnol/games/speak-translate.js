import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import STT from '../../../shared/stt-service.js';
import { checkSpeech } from './check-speech.js';

export function renderSpeakTranslate({ item, container, onAnswer, speak }) {
  let answered = false;
  let recording = false;

  container.innerHTML = `
    <div class="speak-container">
      <div class="question-text">Comment dit-on en espagnol :</div>
      <div class="speak-word-display">${item.fr}</div>
      <button class="speak-mic-btn" id="st-mic">🎙️</button>
      <div class="speak-status" id="st-status"></div>
      <div id="st-feedback"></div>
      <button class="btn-skip" id="st-skip">Passer</button>
    </div>
  `;

  const micBtn = container.querySelector('#st-mic');
  const statusEl = container.querySelector('#st-status');
  const feedbackEl = container.querySelector('#st-feedback');
  const skipBtn = container.querySelector('#st-skip');

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
    statusEl.textContent = 'Appuie sur le micro et dis la traduction !';
  } else if (STT.isLoading) {
    statusEl.textContent = "L'IA se prépare... Patiente un instant !";
  } else {
    statusEl.textContent = 'Appuie sur le micro et dis la traduction !';
  }

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
        5000,
        () => { statusEl.textContent = "🎙️ Je t'écoute..."; },
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
    feedbackEl.innerHTML += `<div class="flashcard-example" style="margin-top:12px">${item.example_es || ''}</div>`;
    micBtn.disabled = true;
    skipBtn.style.display = 'none';
    speak(item.es, 'es-ES');
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
        <div class="translate-correct-answer" style="color:var(--success)">✓ ${item.es}</div>
        <div class="speak-transcription">Tu as dit : « ${said} »</div>
      `;
      if (item.example_es) {
        feedbackEl.innerHTML += `<div class="flashcard-example" style="margin-top:12px">${item.example_es}</div>`;
      }
      micBtn.disabled = true;
      skipBtn.style.display = 'none';
      speak(item.es, 'es-ES');
      onAnswer(true);
    } else {
      statusEl.textContent = 'Pas tout à fait... Réessaie !';
      feedbackEl.innerHTML = `
        <div class="speak-transcription">Tu as dit : « ${said} »</div>
      `;
    }
  }
}
