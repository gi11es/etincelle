import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { checkTranslation } from '../../english/games/check-answer.js';

/* Conjugation drill: given the base form + French meaning, type the
   preterit (prétérit) and the past participle (participe passé).
   Both must be correct. Accepts slash-separated alternates (was/were). */
export function renderConjugation({ item, container, onAnswer, speak }) {
  let answered = false;

  container.innerHTML = `
    <div class="verb-card">
      <button class="btn-speak" id="cj-speak" title="Écouter">🔊</button>
      <div class="verb-base">${item.base}</div>
      <div class="verb-meaning">${item.fr}</div>
      <div class="verb-field">
        <label for="cj-pret">Prétérit</label>
        <input class="translate-input" id="cj-pret" type="text" placeholder="prétérit..." autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
      </div>
      <div class="verb-field">
        <label for="cj-part">Participe passé</label>
        <input class="translate-input" id="cj-part" type="text" placeholder="participe passé..." autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
      </div>
      <button class="btn-submit" id="cj-submit">Valider</button>
      <div id="cj-feedback"></div>
    </div>
  `;

  const pret = container.querySelector('#cj-pret');
  const part = container.querySelector('#cj-part');
  const submitBtn = container.querySelector('#cj-submit');

  container.querySelector('#cj-speak').addEventListener('click', () => {
    SFX.play('speak');
    speak(`${item.base}, ${item.preterit.replace('/', ' or ')}, ${item.participle.replace('/', ' or ')}`);
  });
  setTimeout(() => speak(item.base), 300);

  function check() {
    if (answered) return;
    answered = true;

    const pretOk = checkTranslation(pret.value.trim(), item.preterit);
    const partOk = checkTranslation(part.value.trim(), item.participle);
    const correct = pretOk && partOk;

    pret.disabled = true;
    part.disabled = true;
    submitBtn.disabled = true;

    pret.classList.add(pretOk ? 'answer-correct-input' : 'answer-wrong-input');
    part.classList.add(partOk ? 'answer-correct-input' : 'answer-wrong-input');

    const feedback = container.querySelector('#cj-feedback');
    if (correct) {
      SFX.play('correct');
      LottieOverlay.show('correct', 800);
      feedback.innerHTML = `<div class="translate-correct-answer" style="color:var(--success)">✓ ${item.base} → ${item.preterit} → ${item.participle}</div>`;
    } else {
      SFX.play('wrong');
      feedback.innerHTML = `<div class="translate-correct-answer" style="color:var(--success)">Réponse : ${item.base} → ${item.preterit} → ${item.participle}</div>`;
    }
    feedback.innerHTML += `<div class="flashcard-example" style="margin-top:12px">${item.example_en}<br><em>${item.example_fr}</em></div>`;

    onAnswer(correct);
  }

  submitBtn.addEventListener('click', check);
  part.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  pret.addEventListener('keydown', (e) => { if (e.key === 'Enter') part.focus(); });
  pret.focus();
}
