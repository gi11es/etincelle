/**
 * Bug Reporter Widget
 * Floating chat widget for reporting bugs via in-browser LLM + GitHub Issues.
 * Self-contained: injects its own CSS, creates its own DOM.
 */

// Resolve base path for sibling imports (works regardless of which HTML page loads us)
const BASE = new URL('.', import.meta.url).href;

// ── State ──────────────────────────────────────────────────────────────
let panelOpen = false;
let worker = null;
let workerReady = false;
let workerFailed = false;
let modelLoading = false;
let chatMessages = []; // {role, content} for LLM context
let exchangeCount = 0;
let screenshotDataUrl = null;
let submitMode = false;
let streaming = false;

// ── CSS ────────────────────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('brw-styles')) return;
  const style = document.createElement('style');
  style.id = 'brw-styles';
  style.textContent = `
    .brw-fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      color: white;
      font-size: 22px;
      cursor: pointer;
      z-index: 1003;
      box-shadow: 0 4px 12px rgba(99,102,241,0.4);
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .brw-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(99,102,241,0.5);
    }
    .brw-fab svg { width: 24px; height: 24px; }

    .brw-panel {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 360px;
      max-height: 500px;
      background: #1a1a2e;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      z-index: 1003;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.25s ease, opacity 0.25s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .brw-panel.brw-open {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .brw-header {
      padding: 14px 16px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brw-close {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0 4px;
      opacity: 0.8;
    }
    .brw-close:hover { opacity: 1; }

    .brw-chat {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 200px;
      max-height: 340px;
    }

    .brw-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.5;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    .brw-msg-assistant {
      align-self: flex-start;
      background: #2a2a40;
      color: #e0e0e0;
    }
    .brw-msg-user {
      align-self: flex-end;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
    }
    .brw-msg-system {
      align-self: center;
      background: #2a2a40;
      color: #a0a0b0;
      font-size: 12px;
      text-align: center;
      border-radius: 8px;
    }

    .brw-screenshot-thumb {
      width: 100%;
      max-height: 120px;
      object-fit: cover;
      border-radius: 8px;
      margin-top: 6px;
      opacity: 0.8;
    }

    .brw-input-row {
      display: flex;
      gap: 8px;
      padding: 10px 12px;
      border-top: 1px solid #2a2a40;
      background: #1a1a2e;
    }
    .brw-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #3a3a50;
      border-radius: 20px;
      background: #2a2a40;
      color: #e0e0e0;
      font-size: 13px;
      outline: none;
      font-family: inherit;
    }
    .brw-input::placeholder { color: #6a6a80; }
    .brw-input:focus { border-color: #6366f1; }
    .brw-send {
      padding: 8px 16px;
      border-radius: 20px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .brw-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .brw-progress {
      padding: 8px 12px;
      background: #2a2a40;
      border-radius: 8px;
      margin: 4px 12px;
    }
    .brw-progress-bar {
      height: 4px;
      background: #3a3a50;
      border-radius: 2px;
      overflow: hidden;
    }
    .brw-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      width: 0%;
      transition: width 0.3s;
    }
    .brw-progress-text {
      font-size: 11px;
      color: #8a8aa0;
      margin-top: 4px;
    }

    .brw-submit-area {
      padding: 10px 12px;
      border-top: 1px solid #2a2a40;
      display: flex;
      gap: 8px;
    }
    .brw-submit-btn {
      flex: 1;
      padding: 10px;
      border-radius: 10px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .brw-submit-gh {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
    }
    .brw-submit-clip {
      background: #3a3a50;
      color: #e0e0e0;
    }
    .brw-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Fallback form mode */
    .brw-fallback { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .brw-fallback input, .brw-fallback textarea {
      padding: 10px 12px;
      border: 1px solid #3a3a50;
      border-radius: 10px;
      background: #2a2a40;
      color: #e0e0e0;
      font-size: 13px;
      font-family: inherit;
      outline: none;
    }
    .brw-fallback textarea { resize: vertical; min-height: 80px; }
    .brw-fallback input:focus, .brw-fallback textarea:focus { border-color: #6366f1; }

    @media (max-width: 480px) {
      .brw-panel {
        right: 8px;
        left: 8px;
        bottom: 72px;
        width: auto;
      }
    }
  `;
  document.head.appendChild(style);
}

// ── DOM ────────────────────────────────────────────────────────────────
let fab, panel, chatEl, inputRow, inputEl, sendBtn, submitArea;

function createDOM() {
  // FAB
  fab = document.createElement('button');
  fab.className = 'brw-fab';
  fab.title = 'Signaler un bug';
  fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  fab.addEventListener('click', togglePanel);

  // Panel
  panel = document.createElement('div');
  panel.className = 'brw-panel';
  panel.innerHTML = `
    <div class="brw-header">
      <span>Signaler un bug</span>
      <button class="brw-close">&times;</button>
    </div>
    <div class="brw-chat"></div>
    <div class="brw-input-row">
      <input class="brw-input" placeholder="Décrivez le problème..." autocomplete="off">
      <button class="brw-send">Envoyer</button>
    </div>
    <div class="brw-submit-area" style="display:none"></div>
  `;

  chatEl = panel.querySelector('.brw-chat');
  inputRow = panel.querySelector('.brw-input-row');
  inputEl = panel.querySelector('.brw-input');
  sendBtn = panel.querySelector('.brw-send');
  submitArea = panel.querySelector('.brw-submit-area');

  panel.querySelector('.brw-close').addEventListener('click', togglePanel);
  sendBtn.addEventListener('click', handleSend);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  document.body.appendChild(fab);
  document.body.appendChild(panel);
}

// ── Screenshot ─────────────────────────────────────────────────────────
function loadHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) { resolve(window.html2canvas); return; }
    const script = document.createElement('script');
    script.src = BASE + 'html2canvas.min.js';
    script.onload = () => resolve(window.html2canvas);
    script.onerror = () => reject(new Error('Failed to load html2canvas'));
    document.head.appendChild(script);
  });
}

async function captureScreenshot() {
  try {
    // Hide FAB and panel during capture
    fab.style.display = 'none';
    panel.style.display = 'none';

    const html2canvas = await loadHtml2Canvas();

    const canvas = await html2canvas(document.body, {
      scale: 1,
      useCORS: true,
      logging: false,
      width: Math.min(document.body.scrollWidth, 1200),
    });

    // Resize if needed
    const maxW = 1200;
    if (canvas.width > maxW) {
      const ratio = maxW / canvas.width;
      const resized = document.createElement('canvas');
      resized.width = maxW;
      resized.height = Math.round(canvas.height * ratio);
      resized.getContext('2d').drawImage(canvas, 0, 0, resized.width, resized.height);
      screenshotDataUrl = resized.toDataURL('image/png');
    } else {
      screenshotDataUrl = canvas.toDataURL('image/png');
    }
  } catch (err) {
    console.warn('Bug widget: screenshot failed', err);
    screenshotDataUrl = null;
  } finally {
    fab.style.display = '';
    panel.style.display = '';
  }
}

// ── LLM Worker ─────────────────────────────────────────────────────────
function initWorker() {
  if (worker || workerFailed) return;
  modelLoading = true;

  try {
    worker = new Worker(BASE + 'llm-worker.js', { type: 'module' });
  } catch (err) {
    console.warn('Bug widget: worker creation failed', err);
    workerFailed = true;
    modelLoading = false;
    showFallbackForm();
    return;
  }

  let progressEl = null;

  worker.onmessage = (e) => {
    const { type, data, text, message } = e.data;

    if (type === 'progress') {
      if (data?.status === 'progress' && data.progress != null) {
        if (!progressEl) {
          progressEl = document.createElement('div');
          progressEl.className = 'brw-progress';
          progressEl.innerHTML = `
            <div class="brw-progress-bar"><div class="brw-progress-fill"></div></div>
            <div class="brw-progress-text">Chargement du modèle...</div>
          `;
          chatEl.appendChild(progressEl);
          chatEl.scrollTop = chatEl.scrollHeight;
        }
        const pct = Math.round(data.progress);
        progressEl.querySelector('.brw-progress-fill').style.width = pct + '%';
        progressEl.querySelector('.brw-progress-text').textContent =
          `${data.file ? data.file.split('/').pop() : 'Modèle'} — ${pct}%`;
      }
    }

    if (type === 'ready') {
      workerReady = true;
      modelLoading = false;
      if (progressEl) { progressEl.remove(); progressEl = null; }
      addMessage('system', 'Modèle chargé. Décrivez votre bug !');
    }

    if (type === 'token') {
      appendToLastAssistant(text);
    }

    if (type === 'done') {
      streaming = false;
      sendBtn.disabled = false;
      inputEl.disabled = false;
      exchangeCount++;
      chatMessages.push({ role: 'assistant', content: text });

      // Check if we should switch to submit mode
      if (exchangeCount >= 3 || text.includes('**Titre:**')) {
        enterSubmitMode();
      }
    }

    if (type === 'error') {
      console.warn('Bug widget: LLM error', message);
      workerFailed = true;
      modelLoading = false;
      if (progressEl) { progressEl.remove(); progressEl = null; }
      addMessage('system', 'Le modèle n\'a pas pu charger. Mode formulaire activé.');
      showFallbackForm();
    }
  };

  worker.onerror = () => {
    workerFailed = true;
    modelLoading = false;
    addMessage('system', 'Le modèle n\'a pas pu charger. Mode formulaire activé.');
    showFallbackForm();
  };

  worker.postMessage({ type: 'load' });
  addMessage('system', 'Chargement du modèle IA (~300 Mo la 1re fois)...');
}

// ── Chat Helpers ───────────────────────────────────────────────────────
function addMessage(role, content) {
  const div = document.createElement('div');
  div.className = `brw-msg brw-msg-${role}`;
  div.textContent = content;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
  return div;
}

function appendToLastAssistant(text) {
  let last = chatEl.querySelector('.brw-msg-assistant:last-of-type');
  // If the last assistant message was before the user's latest, create new
  const allMsgs = chatEl.querySelectorAll('.brw-msg');
  const lastMsg = allMsgs[allMsgs.length - 1];
  if (!last || (lastMsg && !lastMsg.classList.contains('brw-msg-assistant'))) {
    last = document.createElement('div');
    last.className = 'brw-msg brw-msg-assistant';
    chatEl.appendChild(last);
  }
  last.textContent += text;
  chatEl.scrollTop = chatEl.scrollHeight;
}

function getPageContext() {
  return `[Contexte auto-collecté] Page: ${location.pathname} | Navigateur: ${navigator.userAgent} | Écran: ${screen.width}x${screen.height} | Date: ${new Date().toLocaleString('fr-FR')}`;
}

function handleSend() {
  const text = inputEl.value.trim();
  if (!text || streaming) return;

  addMessage('user', text);

  // Inject page context as a hidden system message before the first user message
  if (chatMessages.length === 0) {
    chatMessages.push({ role: 'user', content: `${getPageContext()}\n\nMon problème : ${text}` });
  } else {
    chatMessages.push({ role: 'user', content: text });
  }
  inputEl.value = '';

  if (workerReady) {
    streaming = true;
    sendBtn.disabled = true;
    inputEl.disabled = true;
    worker.postMessage({ type: 'chat', messages: chatMessages });
  } else if (workerFailed) {
    // Fallback handled separately
  } else {
    // Still loading, queue will be handled when ready
    addMessage('system', 'Modèle en cours de chargement, veuillez patienter...');
  }
}

// ── Submit Mode ────────────────────────────────────────────────────────
function enterSubmitMode() {
  submitMode = true;
  inputRow.style.display = 'none';
  submitArea.style.display = 'flex';
  submitArea.innerHTML = '';

  // GitHub submit button
  const ghBtn = document.createElement('button');
  ghBtn.className = 'brw-submit-btn brw-submit-gh';
  ghBtn.textContent = 'Soumettre sur GitHub';
  ghBtn.addEventListener('click', submitToGitHub);

  // Clipboard fallback button
  const clipBtn = document.createElement('button');
  clipBtn.className = 'brw-submit-btn brw-submit-clip';
  clipBtn.textContent = 'Copier';
  clipBtn.addEventListener('click', copyToClipboard);

  submitArea.appendChild(ghBtn);
  submitArea.appendChild(clipBtn);
}

function buildReport() {
  // Extract structured info from last assistant message, or use full conversation
  const lastAssistant = chatMessages.filter(m => m.role === 'assistant').pop();
  const fullConversation = chatMessages
    .filter(m => m.role !== 'system')
    .map(m => `**${m.role === 'user' ? 'Utilisateur' : 'Assistant'}:** ${m.content}`)
    .join('\n\n');

  let title = 'Bug report';
  let body = '';

  if (lastAssistant?.content.includes('**Titre:**')) {
    // Parse structured summary
    const match = lastAssistant.content.match(/\*\*Titre:\*\*\s*(.+)/);
    if (match) title = match[1].trim();
    body = lastAssistant.content + '\n\n---\n\n### Conversation complète\n\n' + fullConversation;
  } else {
    // Use first user message as title
    const firstUser = chatMessages.find(m => m.role === 'user');
    if (firstUser) title = firstUser.content.slice(0, 80);
    body = '### Conversation\n\n' + fullConversation;
  }

  body += `\n\n---\n*Page:* \`${location.pathname}\`\n*User-Agent:* \`${navigator.userAgent}\`\n*Date:* ${new Date().toISOString()}`;

  return { title, body };
}

async function submitToGitHub() {
  const btns = submitArea.querySelectorAll('button');
  btns.forEach(b => b.disabled = true);
  submitArea.querySelector('.brw-submit-gh').textContent = 'Envoi...';

  try {
    const { createIssue, isConfigured } = await import(BASE + 'github-api.js');
    if (!(await isConfigured())) {
      addMessage('system', 'Token GitHub non configuré. Rapport copié dans le presse-papier.');
      await copyToClipboard();
      return;
    }

    const { title, body } = buildReport();
    const { url } = await createIssue(title, body);
    addMessage('system', `Bug soumis ! ${url}`);
    submitArea.querySelector('.brw-submit-gh').textContent = 'Soumis !';
  } catch (err) {
    console.error('Bug widget: GitHub submit failed', err);
    addMessage('system', `Erreur GitHub: ${err.message}. Essayez "Copier".`);
    btns.forEach(b => b.disabled = false);
    submitArea.querySelector('.brw-submit-gh').textContent = 'Soumettre sur GitHub';
  }
}

async function copyToClipboard() {
  const { title, body } = buildReport();
  try {
    await navigator.clipboard.writeText(`# ${title}\n\n${body}`);
    addMessage('system', 'Rapport copié dans le presse-papier !');
    submitArea.querySelector('.brw-submit-clip').textContent = 'Copié !';
  } catch {
    addMessage('system', 'Impossible de copier. Sélectionnez le texte manuellement.');
  }
}

// ── Fallback Form (no LLM) ────────────────────────────────────────────
function showFallbackForm() {
  inputRow.style.display = 'none';
  const form = document.createElement('div');
  form.className = 'brw-fallback';
  form.innerHTML = `
    <input class="brw-fallback-title" placeholder="Titre du bug" autocomplete="off">
    <textarea class="brw-fallback-desc" placeholder="Décrivez le problème en détail..."></textarea>
    <div style="display:flex;gap:8px">
      <button class="brw-submit-btn brw-submit-gh" style="flex:1">Soumettre</button>
      <button class="brw-submit-btn brw-submit-clip" style="flex:1">Copier</button>
    </div>
  `;

  form.querySelector('.brw-submit-gh').addEventListener('click', async () => {
    const title = form.querySelector('.brw-fallback-title').value.trim() || 'Bug report';
    const desc = form.querySelector('.brw-fallback-desc').value.trim() || 'No description';
    chatMessages = [{ role: 'user', content: `${getPageContext()}\n\n${title}: ${desc}` }];
    await submitToGitHub();
  });

  form.querySelector('.brw-submit-clip').addEventListener('click', () => {
    const title = form.querySelector('.brw-fallback-title').value.trim() || 'Bug report';
    const desc = form.querySelector('.brw-fallback-desc').value.trim() || 'No description';
    chatMessages = [{ role: 'user', content: `${getPageContext()}\n\n${title}: ${desc}` }];
    copyToClipboard();
  });

  // Insert before submit area
  panel.insertBefore(form, submitArea);
}

// ── Toggle ─────────────────────────────────────────────────────────────
async function togglePanel() {
  panelOpen = !panelOpen;
  panel.classList.toggle('brw-open', panelOpen);

  if (panelOpen) {
    // Capture screenshot on first open
    if (!screenshotDataUrl) {
      await captureScreenshot();
      if (screenshotDataUrl) {
        const img = document.createElement('img');
        img.className = 'brw-screenshot-thumb';
        img.src = screenshotDataUrl;
        img.alt = 'Capture d\'écran';
        chatEl.appendChild(img);
      }
    }
    // Lazy-load LLM
    initWorker();
    inputEl.focus();
  }
}

// ── Init ───────────────────────────────────────────────────────────────
injectStyles();
createDOM();
