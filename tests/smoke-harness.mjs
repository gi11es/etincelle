/**
 * Shared smoke test harness: local static server, browser launch, error collection.
 * Import this in each test file.
 */

import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
export const ROOT = resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.webp': 'image/webp',
};

function isExternalError(text) {
  if (text.includes('cdn.jsdelivr') || text.includes('unpkg.com')) return true;
  if (text.includes('favicon')) return true;
  if (text.includes('lottie-player')) return true;
  if (text.includes('net::ERR') && !text.includes('127.0.0.1')) return true;
  return false;
}

/** Start a local static file server. Returns { server, base, browser, errors, done }. */
export async function setup() {
  const server = await new Promise((resolve) => {
    const s = createServer((req, res) => {
      let url = req.url.split('?')[0];
      if (url.endsWith('/')) url += 'index.html';
      const filePath = join(ROOT, url);
      if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
        res.writeHead(404); res.end('Not found'); return;
      }
      try {
        const content = readFileSync(filePath);
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[extname(filePath)] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(content);
      } catch { res.writeHead(500); res.end('Server error'); }
    });
    s.listen(0, '127.0.0.1', () => resolve(s));
  });

  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });
  const errors = [];

  return {
    server, base, browser, errors,
    async done() {
      await browser.close();
      server.close();
      if (errors.length > 0) {
        console.log(`\nFAILED: ${errors.length} error(s)\n`);
        for (const e of errors) console.log(`  [${e.page}] ${e.error}`);
        process.exit(1);
      } else {
        console.log('\nPASSED');
        process.exit(0);
      }
    },
  };
}

/** Attach error listeners to a page. Returns { check(), errors[] }. */
export function collectErrors(page, label, globalErrors) {
  const pageErrors = [];

  const onPageError = (err) => {
    if (!isExternalError(err.message)) {
      const stack = err.stack || '';
      const loc = stack.split('\n').find(l => l.includes('127.0.0.1')) || '';
      const locClean = loc.replace(/.*127\.0\.0\.1:\d+/, '').trim();
      pageErrors.push(locClean ? `${err.message} ${locClean}` : err.message);
    }
  };
  const onConsole = (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (isExternalError(text)) return;
    if (text.startsWith('Failed to load resource')) return;
    pageErrors.push(text);
  };
  const onRequestFailed = (req) => {
    const url = req.url();
    if (!url.includes('127.0.0.1')) return;
    const path = url.replace(/.*127\.0\.0\.1:\d+/, '');
    if (path.endsWith('.js') || path.endsWith('.mjs') || path.endsWith('.json')) {
      if (path.includes('/ai/')) return;
      pageErrors.push(`Failed to load: ${path}`);
    }
  };
  const onResponse = (res) => {
    if (res.status() !== 404) return;
    const url = res.url();
    if (!url.includes('127.0.0.1')) return;
    const path = url.replace(/.*127\.0\.0\.1:\d+/, '');
    if (path.endsWith('.js') || path.endsWith('.mjs') || path.endsWith('.json')) {
      if (path.includes('/ai/')) return;
      pageErrors.push(`404: ${path}`);
    }
  };

  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  page.on('requestfailed', onRequestFailed);
  page.on('response', onResponse);

  return {
    errors: pageErrors,
    check() {
      page.off('pageerror', onPageError);
      page.off('console', onConsole);
      page.off('requestfailed', onRequestFailed);
      page.off('response', onResponse);
      if (pageErrors.length > 0) {
        console.log(`  FAIL: ${label}`);
        for (const err of pageErrors) {
          console.log(`        ${err}`);
          globalErrors.push({ page: label, error: err });
        }
      } else {
        console.log(`  ok: ${label}`);
      }
      return pageErrors.length;
    },
  };
}

export function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Visit a URL, wait for network idle, report errors. */
export async function testPageLoad(browser, base, path, name, errors) {
  const page = await browser.newPage();
  const col = collectErrors(page, name, errors);
  try {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle2', timeout: 20000 });
    await wait(1000);
  } catch (e) { col.errors.push(`Navigation error: ${e.message}`); }
  col.check();
  await page.close();
}

/** Click every card/button in a section and check for errors. */
export async function testClickEach(browser, base, path, label, errors, {
  cardSelector, cardNameSelector, contentSelector, backSelector, gridSelector, setupFn,
} = {}) {
  const page = await browser.newPage();
  const col = collectErrors(page, `${label} (load)`, errors);

  try {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle2', timeout: 20000 });
    await wait(800);
  } catch (e) {
    col.errors.push(`Navigation error: ${e.message}`);
    col.check(); await page.close(); return;
  }
  col.check();

  if (setupFn) { try { await setupFn(page); } catch {} }

  try { await page.waitForSelector(cardSelector, { timeout: 5000 }); }
  catch { console.log(`  skip: ${label} — no ${cardSelector} found`); await page.close(); return; }

  const cardCount = await page.$$eval(cardSelector, (els) => els.length);
  console.log(`  ${label}: found ${cardCount} sections`);

  for (let i = 0; i < cardCount; i++) {
    const cards = await page.$$(cardSelector);
    if (!cards[i]) break;

    let cardName;
    try {
      cardName = cardNameSelector
        ? await cards[i].$eval(cardNameSelector, (el) => el.textContent.trim())
        : `#${i + 1}`;
    } catch { cardName = `#${i + 1}`; }

    const col2 = collectErrors(page, `${label} → ${cardName}`, errors);
    try {
      await cards[i].click();
      if (contentSelector) await page.waitForSelector(contentSelector, { timeout: 5000 });
      await wait(500);
    } catch {}
    col2.check();

    if (backSelector) {
      try {
        await page.click(backSelector);
        await page.waitForSelector(gridSelector || cardSelector, { timeout: 5000 });
        await wait(200);
      } catch {
        try {
          await page.goto(`${base}${path}`, { waitUntil: 'networkidle2', timeout: 15000 });
          await wait(500);
          if (setupFn) await setupFn(page).catch(() => {});
          await page.waitForSelector(cardSelector, { timeout: 5000 });
        } catch { break; }
      }
    }
  }

  await page.close();
}
