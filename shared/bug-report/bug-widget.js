/**
 * Bug Reporter Widget
 * Floating button that sends bug reports as GitHub Issues.
 * Captures: user description, screenshot, page URL, user-agent.
 * Includes speech-to-text via Web Speech API (French).
 * Self-contained: injects its own CSS, creates its own DOM.
 */

const BASE = new URL('.', import.meta.url).href;

// ── State ──────────────────────────────────────────────────────────────
let panelOpen = false;
let screenshotDataUrl = null;
let sending = false;
let listening = false;

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
      cursor: pointer;
      z-index: 1003;
      box-shadow: 0 4px 12px rgba(99,102,241,0.4);
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
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

    .brw-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; }

    .brw-screenshot-thumb {
      width: 100%;
      max-height: 120px;
      object-fit: cover;
      border-radius: 8px;
    }

    .brw-desc {
      width: 100%;
      min-height: 80px;
      padding: 10px 12px;
      border: 1px solid #3a3a50;
      border-radius: 10px;
      background: #2a2a40;
      color: #e0e0e0;
      font-size: 13px;
      font-family: inherit;
      outline: none;
      resize: vertical;
      box-sizing: border-box;
    }
    .brw-desc::placeholder { color: #6a6a80; }
    .brw-desc:focus { border-color: #6366f1; }

    .brw-actions {
      display: flex;
      gap: 8px;
    }

    .brw-send {
      flex: 1;
      padding: 10px;
      border-radius: 10px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
    }
    .brw-send:disabled { opacity: 0.5; cursor: not-allowed; }

    .brw-mic {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      background: #2a2a40;
      color: #a0a0b0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, color 0.2s;
    }
    .brw-mic:hover { background: #3a3a50; color: #e0e0e0; }
    .brw-mic svg { width: 20px; height: 20px; }
    .brw-mic.brw-mic-on {
      background: #ef4444;
      color: white;
      animation: brw-pulse 1s ease-in-out infinite;
    }

    @keyframes brw-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
      50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
    }

    .brw-status {
      font-size: 12px;
      color: #a0a0b0;
      text-align: center;
      padding: 4px;
    }
    .brw-status a { color: #8b5cf6; }

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
let fab, panel, bodyEl, descEl, sendBtn, micBtn, statusEl;

const hasMic = !!(navigator.mediaDevices?.getUserMedia || window.SpeechRecognition || window.webkitSpeechRecognition);

function createDOM() {
  fab = document.createElement('button');
  fab.className = 'brw-fab';
  fab.title = 'Demander une modification';
  fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  fab.addEventListener('click', togglePanel);

  panel = document.createElement('div');
  panel.className = 'brw-panel';
  panel.innerHTML = `
    <div class="brw-header">
      <span>Demander une modification</span>
      <button class="brw-close">&times;</button>
    </div>
    <div class="brw-body">
      <textarea class="brw-desc" placeholder="Décrivez le problème..."></textarea>
      <div class="brw-actions">
        ${hasMic ? `<button class="brw-mic" title="Dicter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></button>` : ''}
        <button class="brw-send">Envoyer</button>
      </div>
      <div class="brw-status"></div>
    </div>
  `;

  bodyEl = panel.querySelector('.brw-body');
  descEl = panel.querySelector('.brw-desc');
  sendBtn = panel.querySelector('.brw-send');
  micBtn = panel.querySelector('.brw-mic');
  statusEl = panel.querySelector('.brw-status');

  panel.querySelector('.brw-close').addEventListener('click', togglePanel);
  sendBtn.addEventListener('click', handleSend);
  if (micBtn) micBtn.addEventListener('click', toggleMic);

  document.body.appendChild(fab);
  document.body.appendChild(panel);
}

// ── Speech-to-Text ─────────────────────────────────────────────────────
let stt = null;
let preVoiceText = '';

async function toggleMic() {
  // Lazy-import shared STT service
  if (!stt) {
    const mod = await import(BASE + '../stt-service.js');
    stt = mod.default;
    stt.init('french');
  }

  // Toggle off
  if (listening) {
    stt.stopContinuous();
    listening = false;
    micBtn.classList.remove('brw-mic-on');
    statusEl.textContent = '';
    return;
  }

  // Toggle on — continuous mode, keeps listening across pauses
  preVoiceText = descEl.value;
  listening = true;

  const started = stt.startContinuous(
    (final, interim) => {
      const prefix = preVoiceText ? preVoiceText + ' ' : '';
      descEl.value = prefix + final + interim;
    },
    () => {
      micBtn.classList.add('brw-mic-on');
      statusEl.textContent = 'Parlez... (cliquez pour arrêter)';
    },
  );

  if (!started) {
    listening = false;
    statusEl.textContent = 'Reconnaissance vocale non disponible.';
  }
}

// ── Screenshot ─────────────────────────────────────────────────────────
function loadDomToImage() {
  return new Promise((resolve, reject) => {
    if (window.domtoimage) { resolve(window.domtoimage); return; }
    const script = document.createElement('script');
    script.src = BASE + 'dom-to-image-more.min.js';
    script.onload = () => resolve(window.domtoimage);
    script.onerror = () => reject(new Error('Failed to load dom-to-image'));
    document.head.appendChild(script);
  });
}

async function captureScreenshot() {
  // Hide widget + any overlays during capture
  const hidden = [fab, panel];
  document.querySelectorAll('#confetti-canvas, .levelup-overlay, .lottie-overlay').forEach(el => hidden.push(el));
  const savedDisplay = hidden.map(el => el.style.display);
  hidden.forEach(el => { el.style.display = 'none'; });

  try {
    const domtoimage = await loadDomToImage();
    screenshotDataUrl = await domtoimage.toJpeg(document.body, {
      quality: 0.85,
      bgcolor: getComputedStyle(document.body).backgroundColor || '#0f0f23',
      width: Math.min(document.body.scrollWidth, 1200),
    });
  } catch (err) {
    console.warn('Bug widget: screenshot failed', err);
    screenshotDataUrl = null;
  } finally {
    hidden.forEach((el, i) => { el.style.display = savedDisplay[i]; });
  }
}

// ── Submit ─────────────────────────────────────────────────────────────
async function handleSend() {
  const desc = descEl.value.trim();
  if (!desc || sending) return;

  // Stop mic if still recording
  if (listening && stt) {
    stt.stopContinuous();
    listening = false;
    micBtn?.classList.remove('brw-mic-on');
  }

  sending = true;
  sendBtn.disabled = true;
  sendBtn.textContent = 'Envoi...';
  statusEl.textContent = '';

  const title = desc.length > 80 ? desc.slice(0, 77) + '...' : desc;

  try {
    const { createIssue, isConfigured, uploadScreenshot } = await import(BASE + 'github-api.js');
    if (!(await isConfigured())) {
      await navigator.clipboard.writeText(`# ${title}\n\n${desc}\n\nPage: ${location.href}`);
      statusEl.textContent = 'Token GitHub absent. Rapport copié dans le presse-papier.';
      return;
    }

    // Upload screenshot to Imgur
    let screenshotUrl = null;
    if (screenshotDataUrl) {
      statusEl.textContent = 'Upload capture d\'écran...';
      screenshotUrl = await uploadScreenshot(screenshotDataUrl);
    }

    const bodyParts = [
      `### Description`,
      desc,
      ``,
      `### Contexte`,
      `| | |`,
      `|---|---|`,
      `| **Page** | \`${location.href}\` |`,
      `| **User-Agent** | \`${navigator.userAgent}\` |`,
      `| **Écran** | ${screen.width}x${screen.height} |`,
      `| **Date** | ${new Date().toLocaleString('fr-FR')} |`,
    ];
    if (screenshotUrl) {
      bodyParts.push('', `### Capture d'écran`, `![Screenshot](${screenshotUrl})`);
    }
    const body = bodyParts.join('\n');

    statusEl.textContent = 'Envoi du rapport...';
    const { url } = await createIssue(title, body);
    statusEl.innerHTML = `<a href="${url}" target="_blank">Bug soumis !</a>`;
    descEl.value = '';
  } catch (err) {
    console.error('Bug widget: submit failed', err);
    statusEl.textContent = `Erreur : ${err.message}`;
  } finally {
    sending = false;
    sendBtn.disabled = false;
    sendBtn.textContent = 'Envoyer';
  }
}

// ── Toggle ─────────────────────────────────────────────────────────────
async function togglePanel() {
  panelOpen = !panelOpen;
  panel.classList.toggle('brw-open', panelOpen);

  if (panelOpen) {
    if (!screenshotDataUrl) {
      await captureScreenshot();
      if (screenshotDataUrl) {
        const img = document.createElement('img');
        img.className = 'brw-screenshot-thumb';
        img.src = screenshotDataUrl;
        img.alt = 'Capture d\'écran';
        bodyEl.insertBefore(img, descEl);
      }
    }
    descEl.focus();
  } else if (listening && stt) {
    stt.stopContinuous();
    listening = false;
    micBtn?.classList.remove('brw-mic-on');
    statusEl.textContent = '';
  }
}

// ── Init ───────────────────────────────────────────────────────────────
async function init() {
  // Don't show widget if secrets aren't configured
  try {
    const { isConfigured } = await import(BASE + 'github-api.js');
    if (!(await isConfigured())) return;
  } catch {
    return;
  }

  const scriptTag = document.querySelector('script[src*="bug-widget"]');
  const startHidden = scriptTag?.hasAttribute('data-hidden');

  injectStyles();
  createDOM();

  if (startHidden) {
    fab.style.display = 'none';
    window.__showBugWidget = () => { fab.style.display = ''; };
  }
}
init();
