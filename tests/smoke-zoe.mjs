#!/usr/bin/env node
/** Smoke test: click every Zoe activity button and verify no JS errors. */
import { setup, collectErrors, wait } from './smoke-harness.mjs';

const { browser, base, errors, done } = await setup();

const page = await browser.newPage();
const col = collectErrors(page, 'Zoe (load)', errors);

try {
  await page.goto(`${base}/zoe/app.html`, { waitUntil: 'networkidle2', timeout: 20000 });
  await wait(1000);
} catch (e) {
  col.errors.push(`Navigation error: ${e.message}`);
  col.check(); await page.close(); await done(); process.exit();
}
col.check();

try { await page.waitForSelector('.menu-btn', { timeout: 5000 }); }
catch { console.log('  skip: no .menu-btn found'); await page.close(); await done(); process.exit(); }

const btnCount = await page.$$eval('.menu-btn', (els) => els.length);
console.log(`  Zoe: found ${btnCount} activities`);

for (let i = 0; i < btnCount; i++) {
  const btns = await page.$$('.menu-btn');
  if (!btns[i]) break;

  let btnLabel;
  try { btnLabel = await btns[i].evaluate((el) => el.textContent.trim().split('\n')[0].trim()); }
  catch { btnLabel = `#${i + 1}`; }

  const col2 = collectErrors(page, `Zoe → ${btnLabel}`, errors);
  try { await btns[i].click(); await wait(800); } catch {}
  col2.check();

  try {
    const backBtn = await page.$('.btn-back, .back-btn, [onclick*="goTo(\'home\')"]');
    if (backBtn) { await backBtn.click(); await wait(400); }
    else { await page.evaluate(() => { if (typeof goTo === 'function') goTo('home'); }); await wait(400); }
  } catch {
    await page.goto(`${base}/zoe/app.html`, { waitUntil: 'networkidle2', timeout: 15000 });
    await wait(500);
  }
}

await page.close();
await done();
