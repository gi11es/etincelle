/**
 * Bug Reporter Widget
 * Floating button that sends bug reports as GitHub Issues.
 * Captures: user description, screenshot, page URL, user-agent.
 * Self-contained: injects its own CSS, creates its own DOM.
 */

const BASE = new URL('.', import.meta.url).href;

// ── State ──────────────────────────────────────────────────────────────
let panelOpen = false;
let screenshotDataUrl = null;
let sending = false;

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
      opacity: 0.8;
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

    .brw-send {
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
let fab, panel, bodyEl, descEl, sendBtn, statusEl;

function createDOM() {
  fab = document.createElement('button');
  fab.className = 'brw-fab';
  fab.title = 'Signaler un bug';
  fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  fab.addEventListener('click', togglePanel);

  panel = document.createElement('div');
  panel.className = 'brw-panel';
  panel.innerHTML = `
    <div class="brw-header">
      <span>Signaler un bug</span>
      <button class="brw-close">&times;</button>
    </div>
    <div class="brw-body">
      <textarea class="brw-desc" placeholder="Décrivez le problème..."></textarea>
      <button class="brw-send">Envoyer</button>
      <div class="brw-status"></div>
    </div>
  `;

  bodyEl = panel.querySelector('.brw-body');
  descEl = panel.querySelector('.brw-desc');
  sendBtn = panel.querySelector('.brw-send');
  statusEl = panel.querySelector('.brw-status');

  panel.querySelector('.brw-close').addEventListener('click', togglePanel);
  sendBtn.addEventListener('click', handleSend);

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
    fab.style.display = 'none';
    panel.style.display = 'none';

    const html2canvas = await loadHtml2Canvas();
    const canvas = await html2canvas(document.body, {
      scale: 1,
      useCORS: true,
      logging: false,
      width: Math.min(document.body.scrollWidth, 1200),
    });

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

// ── Submit ─────────────────────────────────────────────────────────────
async function handleSend() {
  const desc = descEl.value.trim();
  if (!desc || sending) return;

  sending = true;
  sendBtn.disabled = true;
  sendBtn.textContent = 'Envoi...';
  statusEl.textContent = '';

  const title = desc.length > 80 ? desc.slice(0, 77) + '...' : desc;
  const body = [
    `### Description`,
    desc,
    ``,
    `### Capture d'écran`,
    screenshotDataUrl ? `![screenshot](${screenshotDataUrl})` : '_Capture non disponible_',
    ``,
    `### Contexte`,
    `| | |`,
    `|---|---|`,
    `| **Page** | \`${location.href}\` |`,
    `| **User-Agent** | \`${navigator.userAgent}\` |`,
    `| **Écran** | ${screen.width}x${screen.height} |`,
    `| **Date** | ${new Date().toLocaleString('fr-FR')} |`,
  ].join('\n');

  try {
    const { createIssue, isConfigured } = await import(BASE + 'github-api.js');
    if (!(await isConfigured())) {
      await navigator.clipboard.writeText(`# ${title}\n\n${body}`);
      statusEl.textContent = 'Token GitHub absent. Rapport copié dans le presse-papier.';
      return;
    }

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
  }
}

// ── Init ───────────────────────────────────────────────────────────────
injectStyles();
createDOM();
