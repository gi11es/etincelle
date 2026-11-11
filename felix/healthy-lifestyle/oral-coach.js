import { SpeechCoach } from './oral-speech.js';
import { checkOralAnswer } from './oral-check.js';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function createOralCoach({ root, scenes, getSaved, save, play, stop }) {
  const speech = new SpeechCoach();
  const $ = selector => root.querySelector(selector);
  let active = false, sceneIndex = 0, step = 0, busy = false, generation = 0, recordingUrl = null, manual = false;
  const scene = () => scenes[sceneIndex];
  function state() {
    const saved = getSaved();
    saved.oral ||= {};
    return saved.oral[scene().id] ||= { step: 0, answers: {} };
  }
  function releaseRecording() { $('#oral-replay')?.pause(); if (recordingUrl) URL.revokeObjectURL(recordingUrl); recordingUrl = null; }
  function leave() {
    active = false; generation++; busy = false; speech.cancel(); releaseRecording(); stop();
    document.querySelector('.audio-tools').hidden = false;
    document.querySelector('#audio-status').hidden = false;
  }
  function move(target) {
    speech.cancel(); stop(); releaseRecording(); generation++; busy = false;
    step = target; state().step = step; save(); render();
    $('#oral-title').focus();
  }
  function render() {
    const item = scene(), current = state();
    const question = item.questions[step - 1];
    const summary = step === 6;
    const entry = current.answers[summary ? 'summary' : question?.id];
    document.querySelector('#position').textContent = `Étape ${step + 1} / 7`;
    document.querySelector('#instructions').textContent = step === 0 ? 'Tu vas répondre à cinq petites questions, puis faire une description complète.' : 'Lis la consigne, réponds à voix haute, puis regarde le retour.';
    root.innerHTML = `<div class="oral-scene-picker"><label for="scene-choice">Ta scène</label><select id="scene-choice">${scenes.map((s, i) => `<option value="${i}">${esc(s.title)}</option>`).join('')}</select></div>
      <progress class="oral-progress" value="${step + 1}" max="7" aria-label="Étape ${step + 1} sur 7"></progress>
      <p class="eyebrow">${step === 0 ? 'ON COMMENCE' : summary ? 'À TOI DE TOUT RACONTER' : `QUESTION ${step} SUR 5`}</p>
      <h3 id="oral-title" tabindex="-1">${step === 0 ? 'Regarde la scène' : summary ? 'Fais ton oral' : esc(question.title)}</h3>
      <div class="scene" role="img" aria-label="${esc(item.description)}"><strong lang="en">${esc(item.place)}</strong><div class="scene-people" aria-hidden="true">${item.people}</div><div class="scene-table" aria-hidden="true">${item.food}</div></div>
      ${step === 0 ? introduction(item) : answerScreen(item, question, summary, entry)}
      <div class="oral-navigation"><button id="oral-previous" class="btn btn-secondary" ${step === 0 ? 'hidden' : ''}>← Étape précédente</button>${step === 0 ? '<button id="oral-begin" class="btn btn-primary">Commencer : qui et où ? →</button>' : `<button id="oral-next" class="btn btn-primary" ${entry?.passed ? '' : 'hidden'}>${summary ? 'Terminer cet entraînement ✓' : step === 5 ? 'Faire la description complète →' : 'Question suivante →'}</button>`}</div>`;
    $('#scene-choice').value = sceneIndex;
    $('#scene-choice').onchange = () => open(Number($('#scene-choice').value));
    $('#oral-previous').onclick = () => move(Math.max(0, step - 1));
    if (step === 0) { $('#oral-begin').onclick = () => move(1); return; }
    const key = summary ? 'summary' : question.id;
    const kind = summary ? 'summary' : question.kind;
    const example = summary ? item.model : question.example;
    $('#oral-question-audio')?.addEventListener('click', () => { stop(); play(`${question.id}-prompt`); });
    $('#oral-example-audio').onclick = () => { $('#oral-example').open = true; play(summary ? item.id : question.id); };
    $('#oral-next').onclick = () => {
      if (!state().answers[key]?.passed) return;
      if (summary) complete(); else move(step + 1);
    };
    $('#oral-skip').onclick = () => {
      state().answers[key] = { ...state().answers[key], passed: false, skipped: true }; save();
      if (summary) complete(); else move(step + 1);
    };
    $('#oral-record').onclick = async () => {
      if (busy) return;
      manual = false;
      stop(); releaseRecording();
      const token = ++generation;
      busy = true; setBusy(true);
      let clock;
      try {
        const result = await speech.record({ maxMs: summary ? 60000 : 25000,
          onProgress: percent => { if (active && token === generation) $('#oral-status').textContent = `Préparation de la reconnaissance vocale${percent === null ? '…' : ` : ${percent} %`}. Le premier chargement peut prendre une minute.`; },
          onState: status => {
            if (!active || token !== generation) return;
            if (status === 'loading') $('#oral-status').textContent = 'Préparation du micro et de la reconnaissance…';
            if (status === 'recording') {
              $('#oral-finish').disabled = false;
              const start = Date.now();
              $('#oral-status').textContent = '🎙️ Je t’écoute. Parle, puis appuie sur « J’ai terminé ». ';
              clock = setInterval(() => { if (active && token === generation) $('#oral-status').textContent = `🎙️ Je t’écoute… ${Math.floor((Date.now() - start) / 1000)} s. Appuie sur « J’ai terminé » à la fin.`; }, 1000);
            }
            if (status === 'processing') { clearInterval(clock); $('#oral-finish').disabled = true; $('#oral-status').textContent = 'J’écoute ta réponse…'; }
          },
        });
        if (!active || token !== generation) return;
        $('#oral-status').textContent = '';
        recordingUrl = URL.createObjectURL(result.blob);
        $('#oral-replay').src = recordingUrl; $('#oral-recording').hidden = false;
        assess(result.text, true);
      } catch (error) {
        if (!active || token !== generation || error.name === 'AbortError') return;
        $('#oral-status').textContent = error.name === 'NotAllowedError' ? 'Le micro est bloqué. Autorise-le dans les réglages du site, puis réessaie.' : error.name === 'NotFoundError' ? 'Aucun micro n’a été trouvé. Branche ou active le micro, puis réessaie.' : 'La reconnaissance vocale n’a pas pu terminer. Vérifie la connexion et le micro, puis réessaie.';
        $('#oral-fallback').open = true;
      } finally {
        clearInterval(clock);
        if (active && token === generation) { busy = false; setBusy(false); }
      }
    };
    $('#oral-finish').onclick = () => speech.finish();
    $('#oral-manual').onclick = () => {
      manual = true; $('#oral-edit-box').hidden = false; $('#oral-edit').focus();
      $('#oral-status').textContent = 'Mode écrit : les idées seront vérifiées, pas ta réponse orale.';
    };
    $('#oral-correct-transcript').onclick = () => { $('#oral-edit-box').hidden = false; $('#oral-edit').value = state().answers[key]?.text || ''; $('#oral-edit').focus(); };
    $('#oral-recheck').onclick = () => assess($('#oral-edit').value, !manual && !!state().answers[key]?.spoken, true);
    if (entry && !entry.skipped) showFeedback(entry);
    if (!speech.supported) { $('#oral-status').textContent = 'Le micro local nécessite la page HTTPS et un navigateur récent. Tu peux aussi faire cet exercice par écrit.'; $('#oral-fallback').open = true; }

    function assess(text, spoken, adjusted = false) {
      const result = checkOralAnswer(text, kind, item);
      if (result.empty) { $('#oral-status').textContent = 'Je n’ai pas entendu de phrase. Rapproche-toi du micro et réessaie.'; return; }
      const answer = { text, spoken, adjusted, passed: result.passed, skipped: false };
      state().answers[key] = answer; save(); showFeedback(answer);
    }
    function showFeedback(answer) {
      const result = checkOralAnswer(answer.text, kind, item);
      $('#oral-transcript').textContent = answer.text;
      $('#oral-feedback').hidden = false;
      $('#oral-result').textContent = result.passed ? (answer.spoken ? '✓ Ta réponse contient les idées attendues !' : '✓ Ton texte contient les idées attendues.') : 'Il manque encore un élément. Regarde l’aide, puis réessaie.';
      $('#oral-result').className = result.passed ? 'good' : '';
      $('#oral-checks').innerHTML = result.checks.map(check => `<li class="${check.ok ? 'good' : ''}">${check.ok ? '✓' : 'À ajouter :'} ${esc(check.label)}${check.ok ? '' : `<p>${esc(check.hint)}</p>`}</li>`).join('');
      $('#oral-transcript-label').textContent = answer.adjusted ? 'Texte ajusté par toi' : answer.spoken ? 'Ce que j’ai entendu' : 'Ta réponse écrite';
      $('#oral-correct-transcript').hidden = !answer.spoken;
      $('#oral-next').hidden = !result.passed;
      $('#oral-checks').after($('#oral-next'));
      $('#oral-record').textContent = '🎙️ Réessayer à voix haute';
    }
  }
  function introduction(item) {
    return `<p>Tu vas décrire <strong>${esc(item.title)}</strong> en anglais. Pas besoin de tout préparer d’un coup.</p><ol class="oral-instructions"><li>Regarde les personnes, le lieu et les aliments.</li><li>Réponds à une question à la fois avec le micro.</li><li>À la fin, raconte toute la scène avec tes propres mots.</li></ol><p class="oral-note">La première fois, la reconnaissance vocale se télécharge. Ensuite, tes enregistrements sont analysés sur ton appareil.</p>`;
  }
  function answerScreen(item, question, summary, entry) {
    const notes = item.questions.map(q => state().answers[q.id]).filter(answer => answer?.text && !answer.skipped);
    return `${summary ? '<p>Décris toute la scène en anglais. Vise environ 30 à 45 secondes. Tu peux faire une pause entre tes phrases.</p><div class="oral-cues">Qui et où ? · Aliments et boisson · Action · Émotions · Ton avis</div>' : `<p class="prompt" lang="en">${esc(question.question)}</p><p class="oral-task">${esc(question.instruction)}</p><p class="oral-starter">Pour commencer : <strong lang="en">${esc(question.starter)}</strong></p>`}
      <div class="oral-record-actions">${summary ? '' : '<button id="oral-question-audio" class="btn btn-secondary">🔊 Écouter la question</button>'}<button id="oral-record" class="btn btn-primary">🎙️ À moi de parler</button><button id="oral-finish" class="btn btn-secondary" disabled>J’ai terminé ⏹</button></div>
      <p id="oral-status" class="oral-status" role="status" aria-live="polite"></p>
      <div id="oral-recording" hidden><label for="oral-replay">Réécouter ma réponse</label><audio id="oral-replay" controls></audio></div>
      <section id="oral-feedback" hidden aria-label="Retour sur ta réponse"><h4 id="oral-transcript-label">Ce que j’ai entendu</h4><p id="oral-transcript" class="explanation" lang="en"></p><p id="oral-result" role="status"></p><ul id="oral-checks"></ul><button id="oral-correct-transcript" class="btn btn-secondary">Ce n’est pas ce que j’ai dit</button><p class="oral-note">Le retour vérifie les idées et les constructions du cours. Il ne note pas ton accent.</p></section>
      <details id="oral-example"><summary>Besoin d’aide ? Voir une réponse possible</summary>${summary ? '' : `<p>${esc(question.help)}</p>`}<p class="explanation" lang="en">${esc(summary ? item.model : question.example)}</p></details><button id="oral-example-audio" class="btn btn-secondary">🔊 Écouter ${summary ? 'le modèle complet' : 'un exemple'}</button>
      ${summary && notes.length ? `<details><summary>Revoir mes réponses pour m’aider</summary>${notes.map(note => `<p class="explanation" lang="en">${esc(note.text)}</p>`).join('')}</details>` : ''}
      ${summary && getSaved().drafts[item.id] ? `<details><summary>Mon ancien brouillon</summary><p class="explanation">${esc(getSaved().drafts[item.id])}</p></details>` : ''}
      <details id="oral-fallback"><summary>Si le micro ne fonctionne pas</summary><p>Réessaie après avoir autorisé le micro. Tu peux aussi continuer par écrit ; cette réponse ne sera pas comptée comme un oral.</p><button id="oral-manual" class="btn btn-secondary">Répondre par écrit</button></details>
      <div id="oral-edit-box" hidden><label for="oral-edit">Ta phrase en anglais</label><textarea id="oral-edit" spellcheck="false"></textarea><button id="oral-recheck" class="btn btn-secondary">Vérifier ce texte</button></div>
      <button id="oral-skip" class="btn btn-ghost">${summary ? 'Terminer sans valider l’oral' : 'Passer cette question pour le moment'}</button>`;
  }
  function setBusy(value) {
    root.querySelectorAll('button, select').forEach(button => { button.disabled = value; });
    $('#oral-finish').disabled = !value || !speech.recorder || speech.recorder.state !== 'recording';
  }
  function complete() {
    stop();
    const answers = state().answers;
    const spoken = scene().questions.filter(q => answers[q.id]?.spoken && answers[q.id]?.passed).length;
    const final = answers.summary;
    const done = !!final?.spoken && final.passed;
    state().completed = done; save();
    root.innerHTML = `<h3 id="oral-title" tabindex="-1">${done ? 'Bravo, tu as fait ton oral !' : 'Ton entraînement est terminé'}</h3><p>${spoken} / 5 questions réussies à voix haute.</p><p>${done ? 'Ta description complète contient les idées attendues.' : 'Tu peux revenir aux questions et refaire la description complète quand tu veux.'}</p><div class="oral-navigation"><button id="oral-again" class="btn btn-secondary">Reprendre les questions</button><button id="oral-other" class="btn btn-primary">Essayer l’autre scène →</button></div>`;
    $('#oral-again').onclick = () => move(1); $('#oral-other').onclick = () => open((sceneIndex + 1) % scenes.length); $('#oral-title').focus();
  }
  function open(index = 0) {
    leave(); active = true; sceneIndex = index; manual = false;
    step = Math.max(0, Math.min(6, Number(state().step) || 0));
    document.querySelector('.audio-tools').hidden = true;
    document.querySelector('#audio-status').hidden = true;
    render();
  }
  return { open, leave, suspend() { if (active && busy) { speech.cancel(); $('#oral-status').textContent = 'Enregistrement arrêté. Appuie sur le micro pour réessayer.'; } } };
}
