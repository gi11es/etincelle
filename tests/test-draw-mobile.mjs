import puppeteer from 'puppeteer';
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
  '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.webp': 'image/webp', '.onnx': 'application/octet-stream',
};

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
console.log(`Server on ${base}`);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
});

const page = await browser.newPage();

await page.emulate({
  name: 'iPhone',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_2_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/145.0.7632.55 Mobile/15E148 Safari/604.1',
  viewport: { width: 440, height: 956, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
});

page.on('console', (msg) => {
  console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', (err) => {
  console.log(`[PAGE ERROR] ${err.message}`);
});
page.on('requestfailed', (req) => {
  console.log(`[REQUEST FAILED] ${req.url()} - ${req.failure()?.errorText}`);
});

console.log('Navigating to draw page...');
try {
  await page.goto(`${base}/zoe/app.html#draw`, { waitUntil: 'networkidle2', timeout: 45000 });
  console.log('Page loaded.');
} catch (e) {
  console.log(`Navigation error: ${e.message}`);
}

await new Promise(r => setTimeout(r, 5000));

const modelState = await page.evaluate(() => {
  return {
    emnistSession: !!window.emnistSession,
    emnistLoadFailed: !!window.emnistLoadFailed,
    ort: !!window.ort,
  };
});
console.log('Model state:', JSON.stringify(modelState));

const drawState = await page.evaluate(() => {
  const drawScreen = document.getElementById('screen-draw');
  const drawResult = document.getElementById('draw-result');
  return {
    drawScreenVisible: drawScreen ? drawScreen.style.display !== 'none' : false,
    drawResultText: drawResult ? drawResult.textContent : null,
    currentScreen: document.querySelector('.screen:not([style*="display: none"])')?.id || 'unknown',
  };
});
console.log('Draw state:', JSON.stringify(drawState));

await page.close();
await browser.close();
server.close();
console.log('Done.');
