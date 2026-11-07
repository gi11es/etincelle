#!/usr/bin/env node
/**
 * Smoke test: Proportionnalité 4ème.
 * Plays one practice set per chapter, a full 20-question test, and every WebGL workshop,
 * and fails on any JS error. Set SHOTS=dir to save screenshots.
 */
import { setup, collectErrors, wait } from './smoke-harness.mjs';
import { mkdirSync } from 'fs';

const { browser, base, errors, done } = await setup();
const shots = process.env.SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
/** Close the level-up overlay that the shared gamification may show after a session. */
async function dismissOverlays() {
  await wait(400);
  for (const b of await page.$$('.levelup-overlay .btn')) await b.click().catch(() => {});
}
const shot = async (page, name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true }); };

const page = await browser.newPage();
await page.setViewport({ width: 420, height: 860, deviceScaleFactor: 2 });
page.on('dialog', d => d.accept());

const load = collectErrors(page, 'Proportionnalité (load)', errors);
await page.goto(`${base}/felix/proportionnalite/`, { waitUntil: 'networkidle2', timeout: 20000 });
await page.waitForSelector('.theme-card');
await shot(page, '01-home');
load.check();

/** Answer the current practice question (first choice, or a typed number), then go next. */
async function answerPractice(right) {
  await page.waitForSelector('#question-container .q-text', { visible: true });
  await wait(150);
  const hasChoices = await page.$('#question-container .q-choice');
  if (hasChoices) {
    await page.click('#question-container .q-choice');
  } else {
    await page.type('#question-container .q-input', right ? '' : '0');
    await page.click('#question-container .q-submit');
  }
  await page.waitForSelector('#question-container .btn-next');
}

const themeCount = await page.$$eval('.theme-card', els => els.length);
for (let t = 0; t < themeCount; t++) {
  const col = collectErrors(page, `Chapitre #${t + 1}`, errors);
  const cards = await page.$$('.theme-card');
  await cards[t].click();
  await page.waitForSelector('#screen-fiche.active');
  await wait(500);
  if (t === 0) await shot(page, '02-fiche');
  await page.click('#btn-start-practice');
  await wait(600);
  for (let q = 0; q < 8; q++) {
    await answerPractice(false);
    if (t === 2 && q === 7) await shot(page, '03-practice-problem');
    await page.click('#question-container .btn-next');
  }
  await page.waitForSelector('#screen-results.active');
  await wait(300);
  await dismissOverlays();
  await page.click('#screen-results [data-go-home]');
  await page.waitForSelector('#screen-home.active');
  await wait(500);
  col.check();
}

// Full test: answer every question with the first choice or "1", then submit.
{
  const col = collectErrors(page, 'Contrôle blanc', errors);
  await page.click('#btn-start-exam');
  await wait(600);
  for (let q = 0; q < 20; q++) {
    await page.waitForSelector('#question-container .q-text', { visible: true });
    if (q === 6) await shot(page, '04-exam-graph');
    if (await page.$('#question-container .q-choice')) await page.click('#question-container .q-choice');
    else await page.type('#question-container .q-input', '1');
    if (q < 19) await page.click('#exam-next');
  }
  const done = await page.$$eval('.exam-bubble.done', els => els.length);
  if (done !== 20) col.errors.push(`expected 20 answered bubbles, got ${done}`);
  await page.click('#exam-submit');
  await page.waitForSelector('#screen-copie.active');
  const cards = await page.$$eval('.corr-card', els => els.length);
  if (cards !== 20) col.errors.push(`expected 20 corrections, got ${cards}`);
  await wait(500);
  await shot(page, '05-copie');
  await dismissOverlays();
  await page.click('#screen-copie [data-go-home]');
  await wait(600);
  const hist = await page.$eval('#exam-history', el => el.textContent);
  if (!hist.includes('/20')) col.errors.push(`history not shown: ${hist}`);
  col.check();
}

// WebGL workshops: play every round.
const atelierCount = await page.$$eval('.atelier-card', els => els.length);
for (let a = 0; a < atelierCount; a++) {
  const col = collectErrors(page, `Atelier #${a + 1}`, errors);
  const cards = await page.$$('.atelier-card');
  await cards[a].click();
  await page.waitForSelector('#screen-atelier.active');
  await wait(600);
  for (let r = 0; r < 10; r++) {
    if (await page.$('.atelier-done')) break;
    await page.waitForSelector('.atelier-controls button:not(:disabled)');
    await wait(700);
    if (r === 1) await shot(page, `06-atelier-${a + 1}`);
    const stepper = await page.$('.stepper-btn[data-k="1"][data-d="1"]:not(:disabled)');
    if (stepper) {
      for (let s = 0; s < 3; s++) await stepper.click();
      await page.click('.atelier-controls .btn-submit');
    } else if (await page.$('.k-slider')) {
      await page.click('.atelier-controls .btn-submit');
    } else {
      await page.click('.atelier-choice');
    }
    await page.waitForSelector('.atelier-actions .btn-next', { timeout: 5000 });
    await wait(r === 0 ? 1400 : 200);
    if (r === 0) await shot(page, `07-atelier-${a + 1}-answer`);
    await page.click('.atelier-actions .btn-next');
  }
  await page.waitForSelector('.atelier-done');
  await dismissOverlays();
  await page.click('.atelier-done [data-go-home]');
  await page.waitForSelector('#screen-home.active');
  await wait(500);
  col.check();
}

await page.close();
await done();
