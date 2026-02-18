/**
 * Debug test: emulate iPhone with WebKit to test bug-widget screenshot capture.
 * Usage: node tests/debug-iphone-screenshot.mjs
 */

import { chromium, webkit, devices } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

// Start local static server
const server = await new Promise((resolve) => {
  const s = createServer((req, res) => {
    let url = req.url.split('?')[0];
    if (url.endsWith('/')) url += 'index.html';

    // Serve a fake secrets.js so the widget initializes
    if (url === '/shared/secrets.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end(`
        export const GITHUB_TOKEN = 'fake-token-for-testing';
        export const GITHUB_OWNER = 'test';
        export const GITHUB_REPO = 'test';
      `);
      return;
    }

    const filePath = join(ROOT, url);
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      res.writeHead(404); res.end('Not found'); return;
    }
    try {
      const content = readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[extname(filePath)] || 'application/octet-stream',
      });
      res.end(content);
    } catch { res.writeHead(500); res.end('Server error'); }
  });
  s.listen(0, '127.0.0.1', () => resolve(s));
});

const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

// Test with both iPhone (WebKit) and iPad (WebKit)
for (const [deviceName, browserType] of [
  ['iPhone 13', webkit],
  ['iPad (gen 7)', webkit],
  ['Desktop Chrome 1280x800', chromium],
]) {
  console.log(`\n=== Testing: ${deviceName} ===`);
  const device = devices[deviceName];

  const browser = await browserType.launch({ headless: true });
  const context = device
    ? await browser.newContext({ ...device })
    : await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Collect all console messages
  const logs = [];
  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    logs.push(`[PAGE ERROR] ${err.message}`);
  });

  try {
    // Navigate to Felix portal (has the bug widget)
    await page.goto(`${base}/felix/index.html`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    // Check if FAB button exists
    const fabExists = await page.$('.brw-fab');
    console.log(`  FAB button exists: ${!!fabExists}`);

    if (fabExists) {
      // Click the FAB to open panel and trigger screenshot
      console.log('  Clicking FAB...');
      await page.click('.brw-fab');

      // Wait for screenshot to complete (dom-to-image can be slow)
      await page.waitForTimeout(5000);

      // Check if panel is open
      const panelOpen = await page.$('.brw-panel.brw-open');
      console.log(`  Panel open: ${!!panelOpen}`);

      // Check if screenshot thumbnail was created
      const thumb = await page.$('.brw-screenshot-thumb');
      console.log(`  Screenshot thumbnail exists: ${!!thumb}`);

      if (thumb) {
        const src = await thumb.getAttribute('src');
        console.log(`  Thumbnail src starts with: ${src?.substring(0, 30)}...`);
        console.log(`  Thumbnail src length: ${src?.length || 0}`);
      }

      // Check the screenshotDataUrl variable
      const dataUrlInfo = await page.evaluate(() => {
        // Access the module's internal state via the DOM
        const thumb = document.querySelector('.brw-screenshot-thumb');
        return {
          thumbSrc: thumb?.src?.substring(0, 50) || null,
          thumbSrcLength: thumb?.src?.length || 0,
        };
      });
      console.log(`  Data URL info:`, dataUrlInfo);
    }
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
  }

  // Print relevant console messages
  const relevant = logs.filter(l =>
    l.includes('Bug widget') || l.includes('screenshot') ||
    l.includes('dom-to-image') || l.includes('PAGE ERROR') ||
    l.includes('error') || l.includes('Error')
  );
  if (relevant.length > 0) {
    console.log('  Relevant console output:');
    for (const l of relevant) console.log(`    ${l}`);
  }
  if (logs.length > 0 && relevant.length === 0) {
    console.log(`  (${logs.length} console messages, none related to screenshots)`);
  }

  await browser.close();
}

server.close();
console.log('\nDone.');
