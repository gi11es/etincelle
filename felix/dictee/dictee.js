import { compare, tokens } from './correction.js';
import * as DB from '../../shared/db.js';

const $ = selector => document.querySelector(selector);
const key = 'felix-dictee-sur-leau-v1';
let data, sectionIndex = 0, mode = 'read', wordIndex = 0, phraseIndex = 0;
let answered = false, startedAt = Date.now(), results = {}, storageAvailable = true;
const audio = $('#audio-player');
let playbackId = 0, sourceId = 0, objectUrl = null, pendingAudio = Promise.resolve(false);
const section = () => data.sections[sectionIndex];
const text = () => section().chunks.join(' ');
const track = (suffix) => `audio/${section().id}-${suffix}.mp3?v=eleven-v4-1`;
const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function applySpeed() {
  const speed = Number($('#speed').value);
  // load() restores playbackRate from defaultPlaybackRate when a source changes.
  audio.defaultPlaybackRate = speed;
  audio.playbackRate = speed;
}

function formatTime(seconds) {
  const value = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

function updatePlayback() {
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  $('#seek').max = duration;
  $('#seek').value = audio.currentTime;
  $('#seek').disabled = duration === 0;
  $('#seek').setAttribute('aria-valuetext', `${formatTime(audio.currentTime)} sur ${formatTime(duration)}`);
  $('#elapsed').textContent = formatTime(audio.currentTime);
  $('#duration').textContent = formatTime(duration);
  $('#pause').textContent = audio.paused ? '▶ Reprendre' : '⏸ Pause';
}

function stop() {
  playbackId++;
  audio.pause();
  if (audio.readyState > 0) audio.currentTime = 0;
  $('#pause').disabled = true;
  $('#audio-status').textContent = '';
  updatePlayback();
}

function selectTrack(path, label) {
  $('#audio-caption').textContent = label;
  if (audio.dataset.track === path) return pendingAudio;
  stop();
  const id = ++sourceId;
  audio.removeAttribute('src');
  audio.load();
  if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
  audio.dataset.track = path;
  $('#audio-status').textContent = 'Chargement de l’audio…';
  // Load the whole small clip so seeking also works on static servers without HTTP Range.
  pendingAudio = fetch(path).then(async response => {
    if (!response.ok) throw new Error('Audio indisponible');
    const blob = await response.blob();
    if (id !== sourceId) return false;
    objectUrl = URL.createObjectURL(blob);
    audio.src = objectUrl;
    audio.load();
    applySpeed();
    $('#audio-status').textContent = '';
    return true;
  }).catch(() => {
    if (id === sourceId) {
      audio.dataset.track = '';
      $('#audio-status').textContent = 'Le son n’a pas pu être chargé. Réessaie avec le bouton Écouter.';
    }
    return false;
  });
  return pendingAudio;
}

async function play(path, label) {
  const loading = path ? selectTrack(path, label) : pendingAudio;
  const id = ++playbackId;
  if (!await loading || id !== playbackId) return;
  if (audio.ended) audio.currentTime = 0;
  applySpeed();
  audio.play().catch(() => {
    if (id === playbackId) $('#audio-status').textContent = 'Lecture interrompue. Appuie sur Écouter pour relancer le son.';
  });
}

function updatePhrase() {
  $('#phrase-position').textContent = `${phraseIndex + 1} / ${section().chunks.length}`;
  $('#previous-phrase').disabled = phraseIndex === 0;
  $('#next-phrase').disabled = phraseIndex === section().chunks.length - 1;
}

function progress() {
  const completed = data.sections.filter(s => results[`${s.id}-dictation`]).length;
  const saved = results[`${section().id}-${mode}${mode === 'words' ? `-${wordIndex}` : ''}`];
  $('#progress').textContent = `${completed} / ${data.sections.length} passages travaillés en dictée` +
    (saved ? ` · Dernier résultat ici : ${saved.percent} %` : '') +
    (storageAvailable ? '' : ' · Enregistrement indisponible sur cet appareil.');
}

function gapExercise() {
  let source = text();
  const positions = section().words.map((item, i) => ({ ...item, i, at: source.indexOf(item.word) })).sort((a, b) => a.at - b.at);
  let html = '', cursor = 0;
  for (const item of positions) {
    html += escape(source.slice(cursor, item.at));
    html += `<input data-word="${item.i}" aria-label="Mot manquant ${item.i + 1}" autocomplete="off" autocapitalize="off" spellcheck="false">`;
    cursor = item.at + item.word.length;
  }
  return `<p class="gap-text">${html}${escape(source.slice(cursor))}</p>`;
}

function render() {
  stop();
  answered = false;
  startedAt = Date.now();
  phraseIndex = 0;
  $('#feedback').replaceChildren();
  $('#check').hidden = mode === 'read';
  $('#check').disabled = false;
  $('#retry').hidden = true;
  $('#full-text').hidden = mode !== 'read';
  $('#full-text').open = false;
  $('#phrase-tools').hidden = mode === 'words';
  const titles = { read: 'Lire et écouter', words: 'Mots difficiles', gaps: 'Dictée à trous', dictation: 'Dictée du passage' };
  $('#activity-title').textContent = `${titles[mode]} · ${section().title}`;
  $('#instruction').textContent = {
    read: 'Lis en écoutant. Repère les verbes, les accords et les mots dont l’orthographe te surprend.',
    words: 'Écoute le mot, puis écris-le avec ses accents. La correction t’expliquera la difficulté.',
    gaps: 'Écoute le passage et complète les mots manquants. Les accents et les accords comptent.',
    dictation: 'Écoute le passage entier, puis chaque phrase avec les flèches. Prends ton temps pour écrire et te relire avant de corriger.'
  }[mode];
  $('#listen').textContent = mode === 'words' ? '▶ Écouter le mot' : '▶ Écouter le passage';
  $('#next').textContent = mode === 'words' && wordIndex < section().words.length - 1 ? 'Mot suivant →' : 'Passage suivant →';
  if (mode === 'read') {
    $('#exercise').innerHTML = `<p class="reading">${escape(text())}</p><h3>À surveiller</h3>` +
      section().words.map(item => `<p class="tip"><strong>${escape(item.word)}</strong> — ${escape(item.tip)}</p>`).join('');
  } else if (mode === 'words') {
    $('#exercise').innerHTML = `<p class="word-prompt">Mot ${wordIndex + 1} / ${section().words.length}</p><label for="answer">Le mot entendu</label><br><input id="answer" autocomplete="off" autocapitalize="off" spellcheck="false">`;
  } else if (mode === 'gaps') {
    $('#exercise').innerHTML = gapExercise();
  } else {
    $('#exercise').innerHTML = '<label for="answer">Écris tout le passage ici</label><textarea id="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Écoute, écris, puis relis-toi…"></textarea>';
  }
  selectTrack(track(mode === 'words' ? `word-${wordIndex}` : 'passage'), mode === 'words' ? 'Mot à écouter' : 'Passage entier');
  updatePhrase();
  progress();
}

async function check() {
  if (answered) return;
  let correct, total, percent;
  if (mode === 'gaps') {
    const inputs = [...$('#exercise').querySelectorAll('input')];
    if (inputs.some(input => !input.value.trim())) { $('#feedback').textContent = 'Complète tous les trous avant de corriger.'; return; }
    correct = 0; total = inputs.length;
    $('#feedback').innerHTML = inputs.map(input => {
      const item = section().words[Number(input.dataset.word)];
      const good = tokens(input.value).join(' ') === tokens(item.word).join(' ');
      correct += Number(good);
      input.setAttribute('aria-invalid', String(!good));
      input.readOnly = true;
      return `<p class="correction"><span class="${good ? 'good' : 'missing'}">${good ? '✓' : 'À revoir :'} ${escape(item.word)}</span> — ${escape(item.tip)}</p>`;
    }).join('');
    percent = Math.round(100 * correct / total);
  } else {
    const actual = $('#answer').value.trim();
    if (!actual) { $('#feedback').textContent = 'Écris ta réponse avant de corriger.'; return; }
    // Keep the alignment matrix bounded even for accidentally pasted long input.
    if (tokens(actual).length > 1000) { $('#feedback').textContent = 'Ta réponse est trop longue pour ce passage. Vérifie ce que tu as saisi.'; return; }
    const expected = mode === 'words' ? section().words[wordIndex].word : text();
    const result = compare(expected, actual);
    ({ correct, total, percent } = result);
    $('#answer').readOnly = true;
    $('#feedback').innerHTML = '<p>Ta copie comparée au modèle (rouge : à revoir ; vert : correction) :</p><p class="correction">' +
      result.changes.map(change => change.correct ? escape(change.expected) :
        `${change.actual ? `<del>${escape(change.actual)}</del> ` : ''}${change.expected ? `<ins>${escape(change.expected)}</ins>` : ''}`).join(' ') + '</p>' +
      `<p class="model"><strong>Modèle avec la ponctuation :</strong><br>${escape(expected)}</p>` +
      (mode === 'words' ? `<p class="tip">${escape(section().words[wordIndex].tip)}</p>` : '<p>Relis aussi les virgules, les points et les points-virgules : ils ne sont pas comptés dans le score.</p>');
  }
  answered = true;
  $('#check').disabled = true;
  $('#retry').hidden = false;
  const summary = document.createElement('p');
  summary.className = percent === 100 ? 'good' : '';
  summary.textContent = `${percent} % · ${correct} / ${total} ${mode === 'gaps' || mode === 'words' ? 'mots' : 'points d’orthographe'} — ${percent === 100 ? 'Bravo !' : 'Repère les corrections, puis réessaie.'}`;
  $('#feedback').prepend(summary);
  const resultKey = `${section().id}-${mode}${mode === 'words' ? `-${wordIndex}` : ''}`;
  results[resultKey] = { percent, date: new Date().toISOString() };
  try { localStorage.setItem(key, JSON.stringify(results)); }
  catch { storageAvailable = false; }
  progress();
  try {
    await DB.addSession({ app: 'dictee', mode, passage: section().id, date: new Date().toLocaleDateString('en-CA'), timestamp: Date.now(), correct, total, timeSec: Math.round((Date.now() - startedAt) / 1000), xpEarned: 0 });
  } catch {
    const warning = document.createElement('p');
    warning.textContent = 'La session n’a pas pu être ajoutée aux statistiques générales.';
    $('#feedback').append(warning);
  }
}

async function init() {
  const response = await fetch('texte.json');
  if (!response.ok) throw new Error('Texte indisponible');
  data = await response.json();
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '{}');
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) results = stored;
  } catch { storageAvailable = false; }
  $('#section').innerHTML = data.sections.map((s, i) => `<option value="${i}">${s.id}. ${escape(s.title)}</option>`).join('');
  $('#source').innerHTML = `<p>${escape(data.source)}</p><p>${escape(data.context)}</p><p>[…] ` + data.sections.map((s, i) =>
    escape(s.chunks.join(' ')) + (s.omissionAfter ? ' […]' : '') +
    (data.sections[i + 1]?.paragraph !== s.paragraph ? '</p><p>' : ' ')).join('') + '</p>';
  $('#section').onchange = () => { sectionIndex = Number($('#section').value); wordIndex = 0; render(); };
  $('#random').onclick = () => { sectionIndex = (sectionIndex + 1 + Math.floor(Math.random() * (data.sections.length - 1))) % data.sections.length; $('#section').value = sectionIndex; wordIndex = 0; render(); };
  document.querySelectorAll('[data-mode]').forEach(button => {
    button.onclick = () => {
      mode = button.dataset.mode; wordIndex = 0;
      document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      render();
    };
  });
  $('#listen').onclick = () => play(track(mode === 'words' ? `word-${wordIndex}` : 'passage'), mode === 'words' ? 'Mot à écouter' : 'Passage entier');
  $('#phrase').onclick = () => play(track(phraseIndex), `Phrase ${phraseIndex + 1} / ${section().chunks.length}`);
  $('#previous-phrase').onclick = () => { phraseIndex--; selectTrack(track(phraseIndex), `Phrase ${phraseIndex + 1} / ${section().chunks.length}`); updatePhrase(); };
  $('#next-phrase').onclick = () => { phraseIndex++; selectTrack(track(phraseIndex), `Phrase ${phraseIndex + 1} / ${section().chunks.length}`); updatePhrase(); };
  $('#stop').onclick = stop;
  $('#pause').onclick = () => {
    if (audio.paused) play();
    else { audio.pause(); $('#audio-status').textContent = 'En pause. Reprends quand tu es prêt.'; }
  };
  $('#seek').oninput = () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = Number($('#seek').value);
    updatePlayback();
  };
  ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked', 'pause'].forEach(event => audio.addEventListener(event, updatePlayback));
  audio.addEventListener('play', () => {
    $('#pause').disabled = false;
    $('#audio-status').textContent = 'Écoute en cours…';
    updatePlayback();
  });
  audio.addEventListener('ended', () => {
    $('#audio-status').textContent = 'Écoute terminée. Tu peux réécouter ou revenir en arrière.';
    updatePlayback();
  });
  audio.addEventListener('error', () => { $('#audio-status').textContent = 'Le son n’a pas pu être chargé. Réessaie avec le bouton Écouter.'; });
  audio.addEventListener('loadedmetadata', applySpeed);
  $('#speed').onchange = applySpeed;
  $('#check').onclick = check;
  $('#retry').onclick = render;
  $('#next').onclick = () => {
    if (mode === 'words' && wordIndex < section().words.length - 1) wordIndex++;
    else { sectionIndex = (sectionIndex + 1) % data.sections.length; wordIndex = 0; $('#section').value = sectionIndex; }
    render();
  };
  $('#exercise').onkeydown = event => {
    if (event.key === 'Enter' && event.target.tagName === 'INPUT') { event.preventDefault(); check(); }
  };
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  render();
}
init().catch(() => { $('#load-status').textContent = 'Impossible de charger l’atelier. Recharge la page pour réessayer.'; });
