import { matches } from './answers.js';
import { createOralCoach } from './oral-coach.js?v=oral-3';
import * as DB from '../../shared/db.js';
const $ = selector => document.querySelector(selector);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle = values => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
};
const storageKey = 'felix-healthy-lifestyle-v1';
let data, mode, queue = [], index = 0, responses = [], answered = false, selected = '', built = [];
let saved = { items: {}, drafts: {} }, sessionStart = 0, audio = new Audio(), currentTrack = null, playbackId = 0;
let oralCoach;
const titles = { learn: 'La boîte à outils', vocab: 'Vocabulaire & dictée', sort: 'Les familles d’aliments', phrases: 'Construire ses phrases', listen: 'Comprendre à l’écoute', oral: 'Préparer son oral' };

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(saved)); }
  catch { $('#status').textContent = 'L’enregistrement sur cet appareil est indisponible. Tu peux continuer à travailler.'; }
}
function stop() {
  playbackId++;
  audio.pause(); audio.removeAttribute('src'); audio.load();
  $('#audio-status').textContent = '';
}
function play(id) {
  stop();
  const token = playbackId;
  const player = new Audio(`audio/${id}.mp3?v=eleven-v4-1`);
  audio = player;
  player.playbackRate = Number($('#speed').value);
  $('#audio-status').textContent = 'Écoute en cours…';
  player.onended = () => { if (token === playbackId) $('#audio-status').textContent = 'Écoute terminée. Tu peux réécouter autant que tu veux.'; };
  player.onerror = () => { if (token === playbackId) $('#audio-status').textContent = 'Impossible de charger le son. Appuie sur Écouter pour réessayer.'; };
  player.play().catch(() => { if (token === playbackId) $('#audio-status').textContent = 'Lecture interrompue. Appuie sur Écouter pour relancer.'; });
}
function screen(name) {
  stop();
  ['home', 'workspace', 'results'].forEach(id => { $(`#${id}`).hidden = id !== name; });
}
function home() {
  oralCoach?.leave();
  screen('home');
  for (const name of ['vocab', 'sort', 'phrases', 'listen']) {
    const entries = Object.entries(saved.items).filter(([key]) => key.startsWith(`${name}:`));
    if (entries.length) $(`#${name}-progress`).textContent = `${entries.filter(([, v]) => v).length} / ${entries.length} exercices réussis au dernier essai`;
  }
}
function controls(track = null) {
  currentTrack = track;
  $('#play').disabled = !track;
  $('#check').hidden = true; $('#next').hidden = true;
  $('#feedback').replaceChildren();
}
function start(name, retry) {
  oralCoach?.leave();
  mode = name;
  screen('workspace');
  $('#activity-title').textContent = titles[mode];
  $('#activity-title').focus();
  if (mode === 'learn') return learn();
  if (mode === 'oral') { controls(); return oralCoach.open(0); }
  queue = retry || createQueue(mode);
  index = 0; responses = []; sessionStart = Date.now();
  renderQuestion();
}
function createQueue(name) {
  if (name === 'vocab') return shuffle(data.vocabulary).slice(0, 10).map((item, i) => ({ id: `${item.id}-${i % 3}`, type: ['translate', 'meaning', 'dictation'][i % 3], item }));
  if (name === 'sort') return shuffle(data.vocabulary.filter(v => v.group !== 'other')).map(item => ({ id: item.id, type: 'sort', item }));
  if (name === 'phrases') return data.phrases.map((item, i) => ({ id: item.id, type: i % 2 ? 'build' : 'gap', item }));
  return data.listening.flatMap(item => item.questions.map((question, i) => ({ id: `${item.id}-${i}`, type: 'listen', item, question })));
}
function choices(options) {
  return `<div class="choices">${options.map(option => `<button class="choice" data-value="${esc(option.value)}" aria-pressed="false">${esc(option.label)}</button>`).join('')}</div>`;
}
function bindChoices() {
  $('#content').querySelectorAll('.choice').forEach(button => {
    button.onclick = () => {
      if (answered) return;
      selected = button.dataset.value;
      $('#content').querySelectorAll('.choice').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    };
  });
}
function renderQuestion() {
  stop();
  const task = queue[index], item = task.item;
  answered = false; selected = ''; built = [];
  controls(task.type === 'listen' ? item.id : task.type === 'build' || task.type === 'gap' ? null : item.id);
  $('#position').textContent = `${index + 1} / ${queue.length}`;
  $('#activity-title').textContent = titles[mode];
  $('#check').hidden = false; $('#check').disabled = false;
  $('#instructions').textContent = {
    translate: 'Écris le mot ou l’expression en anglais. Le bouton audio peut t’aider.',
    meaning: 'Choisis le sens en français. Tu peux aussi écouter la prononciation.',
    dictation: 'Écoute, puis écris le mot ou l’expression en anglais.',
    sort: 'À quelle famille appartient cet aliment ? Choisis une catégorie en anglais.',
    gap: 'Complète la phrase du cours. Respecte la forme grammaticale.',
    build: 'Clique sur les mots pour construire la phrase. Clique sur un mot de ta réponse pour le remettre dans la réserve.',
    listen: 'Écoute le texte, puis réponds à la question. La transcription sera disponible après ta réponse.'
  }[task.type];
  const input = label => `<label for="answer">${label}</label><input id="answer" autocomplete="off" autocapitalize="off" spellcheck="false">`;
  if (task.type === 'translate') $('#content').innerHTML = `<p class="prompt">${esc(item.fr)}</p>${input('En anglais')}`;
  if (task.type === 'dictation') $('#content').innerHTML = `<p class="prompt">🎧 À toi d’écouter !</p>${input('Ce que tu as entendu')}`;
  if (task.type === 'meaning') {
    const distractors = shuffle(data.vocabulary.filter(v => v.id !== item.id)).slice(0, 3);
    $('#content').innerHTML = `<p class="prompt" lang="en">${esc(item.en)}</p>` + choices(shuffle([item, ...distractors]).map(v => ({ value: v.id, label: v.fr })));
  }
  if (task.type === 'sort') {
    $('#content').innerHTML = `<p class="prompt" lang="en">${esc(item.en)}</p>` + choices(Object.entries(data.groups).filter(([key]) => key !== 'other').map(([key, label]) => ({ value: key, label })));
  }
  if (task.type === 'gap') $('#content').innerHTML = `<p class="prompt" lang="en">${esc(item.gap)}</p><p>${esc(item.fr)}</p>${input('Le mot manquant')}`;
  if (task.type === 'build') {
    $('#content').innerHTML = `<p class="prompt">${esc(item.fr)}</p><p>Ta phrase (touche un mot pour le retirer) :</p><div id="built" class="answer-tiles" lang="en" aria-label="Ta phrase"></div><p>Réserve de mots :</p><div id="bank" class="tiles" lang="en"></div>`;
    const words = item.en.split(' ');
    const order = shuffle(words.map((word, id) => ({ word, id })));
    function tiles() {
      $('#built').innerHTML = built.map(id => `<button class="tile" data-remove="${id}">${esc(words[id])}</button>`).join('');
      $('#bank').innerHTML = order.filter(token => !built.includes(token.id)).map(token => `<button class="tile" data-add="${token.id}">${esc(token.word)}</button>`).join('');
      $('#content').querySelectorAll('[data-add]').forEach(b => { b.onclick = () => { if (!answered) { built.push(Number(b.dataset.add)); tiles(); } }; });
      $('#content').querySelectorAll('[data-remove]').forEach(b => { b.onclick = () => { if (!answered) { built = built.filter(id => id !== Number(b.dataset.remove)); tiles(); } }; });
    }
    tiles();
  }
  if (task.type === 'listen') $('#content').innerHTML = `<p>${esc(item.title)} · document d’entraînement</p><p class="prompt" lang="en">${esc(task.question.prompt)}</p>` + choices(task.question.options.map((label, i) => ({ value: String(i), label })));
  bindChoices();
}
function check() {
  if (answered) return;
  const task = queue[index], item = task.item;
  const value = ['meaning', 'sort', 'listen'].includes(task.type) ? selected : task.type === 'build' ? built.map(id => item.en.split(' ')[id]).join(' ') : $('#answer').value.trim();
  if (!value) { $('#feedback').textContent = 'Donne une réponse avant de vérifier.'; return; }
  let correct = false, model = '', tip = '';
  if (['translate', 'dictation'].includes(task.type)) {
    correct = matches(value, [item.en, ...(item.accepted || [])], true); model = `${item.en} = ${item.fr}`;
    tip = 'Vérifie toutes les lettres. Le singulier, le pluriel et la terminaison des mots comptent.';
  } else if (task.type === 'meaning') {
    correct = value === item.id; model = `${item.en} = ${item.fr}`;
  } else if (task.type === 'sort') {
    const groups = item.groups || [item.group]; correct = groups.includes(value);
    model = `${item.en} → ${groups.map(key => data.groups[key]).join(' / ')}`;
    tip = item.en === 'pulses' ? 'Les légumineuses apportent des protéines et des glucides : les deux réponses sont acceptées. Ta fiche les range avec les glucides.' : `Dans cet exercice de vocabulaire : ${item.en} = ${item.fr}.`;
  } else if (task.type === 'gap' || task.type === 'build') {
    correct = matches(value, task.type === 'gap' ? item.answers : [item.en]); model = item.en; tip = item.tip;
  } else {
    correct = Number(value) === task.question.answer; model = task.question.options[task.question.answer]; tip = task.question.tip;
  }
  answered = true;
  responses.push({ task, correct });
  saved.items[`${mode}:${task.id}`] = correct; save();
  $('#check').disabled = true; $('#next').hidden = false;
  $('#content').querySelectorAll('input').forEach(input => { input.readOnly = true; });
  $('#content').querySelectorAll('button').forEach(button => { button.disabled = true; });
  $('#feedback').innerHTML = `<p class="${correct ? 'good' : 'wrong'}"><strong>${correct ? '✓ Bien joué !' : 'À revoir'}</strong></p><p class="explanation" lang="en">${esc(model)}</p><p>${esc(tip)}</p>`;
  if (task.type === 'listen') $('#feedback').innerHTML += `<details><summary>Lire la transcription</summary><p class="explanation" lang="en">${esc(item.text)}</p></details>`;
  currentTrack = item.id; $('#play').disabled = false;
  $('#next').textContent = index + 1 === queue.length ? 'Voir mon bilan →' : 'Continuer →';
}
async function finish() {
  screen('results');
  const correct = responses.filter(r => r.correct).length;
  const total = responses.length;
  const failed = responses.filter(r => !r.correct);
  $('#score').textContent = `${correct} / ${total} · ${Math.round(correct / total * 100)} %`;
  $('#result-message').textContent = failed.length ? 'Reprends les questions à revoir, puis essaie une nouvelle série.' : 'Bravo ! Tu peux passer à un autre atelier ou tenter une nouvelle série.';
  $('#recap').innerHTML = failed.map(({ task }) => `<p class="explanation">${esc(task.type === 'listen' ? task.question.prompt : task.item.en)}</p>`).join('');
  $('#review').hidden = !failed.length;
  $('#review').onclick = () => start(mode, failed.map(r => r.task));
  $('#restart').onclick = () => start(mode);
  $('#result-title').focus();
  try { await DB.addSession({ app: 'healthy-lifestyle', mode, correct, total, date: new Date().toLocaleDateString('en-CA'), timestamp: Date.now(), timeSec: Math.round((Date.now() - sessionStart) / 1000), xpEarned: 0 }); }
  catch { $('#status').textContent = 'La session n’a pas pu être ajoutée aux statistiques générales.'; }
}
function learn() {
  controls(); $('#position').textContent = 'Lexique & grammaire';
  $('#instructions').textContent = 'Retrouve les mots des fiches et écoute leur prononciation. Puis passe aux exercices pour les mémoriser.';
  $('#content').innerHTML = `<label for="filter">Chercher un mot en anglais ou en français</label><input id="filter" class="filter" type="search"><div id="vocabulary" class="vocab-list"></div>
    <h3>Les outils pour décrire</h3><div class="rules">
    <p><strong lang="en">I can see…</strong> = Je vois…<br><strong lang="en">There is / There are…</strong> = Il y a… (singulier / pluriel).</p>
    <p><strong lang="en">They are eating / trying…</strong> : be + verbe en -ing pour une action en cours.</p>
    <p><strong lang="en">It looks colourful. I think… Maybe…</strong> : décrire une impression, donner son avis, faire une hypothèse.</p>
    <p><strong lang="en">People feel relaxed.</strong> « Relaxed » est un adjectif ; « relax » est un verbe.</p>
    <p><strong lang="en">A healthy lifestyle means eating healthy, varied food, drinking water, doing physical activities and sharing meals with family or friends.</strong></p>
    <p><strong lang="en">I think the video is about babies addicted to fast food.</strong> Après « I think », le sujet « the video » n’est pas suivi d’un deuxième sujet « it ».</p>
    <p><strong lang="en">A baby</strong> = un bébé ; <strong lang="en">a toddler</strong> = un enfant en bas âge qui commence à marcher. <strong lang="en">Babies</strong> est le pluriel de baby.</p>
    <p><strong lang="en">Junk food</strong> : dans la fiche, nourriture riche en matières grasses, en sucre ou en sel. <strong lang="en">Addicted</strong> = dépendant ; <strong lang="en">obsessed</strong> = obsédé.</p>
    </div>`;
  function filter() {
    const query = $('#filter').value.toLocaleLowerCase();
    const items = data.vocabulary.filter(v => `${v.en} ${v.fr}`.toLocaleLowerCase().includes(query));
    $('#vocabulary').innerHTML = items.length ? items.map(v => `<article class="word-card"><strong lang="en">${esc(v.en)}</strong><p>${esc(v.fr)}</p><button class="btn btn-secondary word-audio" data-audio="${v.id}" aria-label="Écouter ${esc(v.en)}">🔊 Écouter</button></article>`).join('') : '<p>Aucun mot trouvé.</p>';
    $('#vocabulary').querySelectorAll('[data-audio]').forEach(b => { b.onclick = () => play(b.dataset.audio); });
  }
  $('#filter').oninput = filter; filter();
}
async function init() {
  const response = await fetch('content.json');
  if (!response.ok) throw new Error('Contenu indisponible');
  data = await response.json();
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (value && typeof value.items === 'object' && value.items && typeof value.drafts === 'object' && value.drafts) saved = value;
  } catch { $('#status').textContent = 'La progression précédente est indisponible. Tu peux commencer une nouvelle série.'; }
  oralCoach = createOralCoach({ root: $('#content'), scenes: data.oral, getSaved: () => saved, save, play, stop });
  document.querySelectorAll('[data-mode]').forEach(button => { button.onclick = () => start(button.dataset.mode); });
  $('#back').onclick = home; $('#home-button').onclick = home;
  $('#play').onclick = () => { if (currentTrack) play(currentTrack); };
  $('#stop').onclick = stop; $('#speed').onchange = () => { audio.playbackRate = Number($('#speed').value); };
  $('#check').onclick = check;
  $('#next').onclick = () => { if (!answered) return; if (++index === queue.length) finish(); else renderQuestion(); };
  $('#content').onkeydown = event => { if (event.key === 'Enter' && event.target.id === 'answer') { event.preventDefault(); check(); } };
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); oralCoach?.suspend(); } });
  window.addEventListener('pagehide', () => { stop(); oralCoach?.leave(); });
  home();
}
init().catch(() => { $('#status').textContent = 'Impossible de charger l’atelier. Recharge la page pour réessayer.'; });
