import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { setup, collectErrors, ROOT } from './smoke-harness.mjs';
const { browser, base, errors, done } = await setup();
const page = await browser.newPage();
const collector = collectErrors(page, 'Eat well, live well', errors);
const data = JSON.parse(readFileSync(`${ROOT}/felix/healthy-lifestyle/content.json`, 'utf8'));
try {
  await page.evaluateOnNewDocument(() => {
    const NativeAudio = window.Audio;
    window.Audio = function (src) {
      const player = new NativeAudio(src);
      if (src) { window.lastAudioPath = src; window.lastPlayer = player; }
      return player;
    };
  });
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${base}/felix/`);
  await page.click('a[href="healthy-lifestyle/index.html"]');
  await page.waitForSelector('[data-mode="learn"]');
  const tracks = [...data.vocabulary, ...data.phrases, ...data.listening, ...data.oral];
  const manifest = JSON.parse(readFileSync(`${ROOT}/felix/healthy-lifestyle/audio-manifest.json`, 'utf8'));
  assert.equal(Object.keys(manifest.tracks).length, 71);
  for (const item of tracks) {
    const entry = manifest.tracks[item.id];
    assert.equal(entry.model_id, 'eleven_v4');
    assert.equal(entry.audio_sha256, createHash('sha256').update(readFileSync(`${ROOT}/felix/healthy-lifestyle/audio/${item.id}.mp3`)).digest('hex'));
  }
  for (const item of tracks) assert.ok(statSync(`${ROOT}/felix/healthy-lifestyle/audio/${item.id}.mp3`).size > 1000);
  await page.click('[data-mode="learn"]');
  assert.equal(await page.$$('.word-card').then(v => v.length), 48);
  await page.type('#filter', 'toddler');
  assert.equal(await page.$$('.word-card').then(v => v.length), 1);
  await page.click('.word-audio');
  await page.waitForFunction(() => window.lastPlayer && window.lastPlayer.currentTime > 0);
  await page.select('#speed', '0.8');
  assert.equal(await page.evaluate(() => window.lastPlayer.playbackRate), 0.8);
  await page.click('#stop');
  assert.equal(await page.evaluate(() => window.lastPlayer.paused), true);
  await page.click('#back');
  await page.click('[data-mode="vocab"]');
  await page.click('#check');
  assert.match(await page.$eval('#feedback', el => el.textContent), /Donne une réponse/);
  for (let i = 0; i < 10; i++) {
    // The real audio object identifies the target even when the exercise hides the spelling.
    await page.click('#play');
    const id = await page.evaluate(() => window.lastAudioPath.match(/([^/]+)\.mp3(?:\?.*)?$/)[1]);
    const item = data.vocabulary.find(v => v.id === id);
    if (await page.$('#answer')) await page.type('#answer', i === 0 ? 'wrong answer' : item.en);
    else await page.click(`[data-value="${id}"]`);
    await page.click('#check');
    await page.click('#next');
  }
  await page.waitForSelector('#results:not([hidden])');
  assert.match(await page.$eval('#score', el => el.textContent), /9 \/ 10/);
  await page.click('#review');
  assert.equal(await page.$eval('#position', el => el.textContent), '1 / 1');
  await page.click('#play');
  const retryId = await page.evaluate(() => window.lastAudioPath.match(/([^/]+)\.mp3(?:\?.*)?$/)[1]);
  await page.type('#answer', data.vocabulary.find(v => v.id === retryId).en);
  await page.click('#check'); await page.click('#next');
  assert.match(await page.$eval('#score', el => el.textContent), /1 \/ 1/);
  await page.click('#home-button'); await page.click('[data-mode="sort"]');
  const food = data.vocabulary.filter(v => v.group !== 'other');
  for (let i = 0; i < food.length; i++) {
    const en = await page.$eval('.prompt', el => el.textContent);
    const item = food.find(v => v.en === en);
    await page.click(`[data-value="${item.en === 'pulses' ? 'carbs' : item.group}"]`);
    await page.click('#check');
    assert.match(await page.$eval('#feedback', el => el.textContent), /Bien joué/);
    await page.click('#next');
  }
  assert.match(await page.$eval('#score', el => el.textContent), /100 %/);
  await page.click('#home-button'); await page.click('[data-mode="phrases"]');
  for (const [i, item] of data.phrases.entries()) {
    if (i % 2 === 0) await page.type('#answer', item.answers[0]);
    else {
      for (const word of item.en.split(' ')) {
        await page.evaluate(word => {
          const button = [...document.querySelectorAll('#bank button')].find(el => el.textContent === word);
          if (!button) throw new Error(`Missing tile: ${word}`);
          button.click();
        }, word);
      }
      // Removing and adding a word must preserve repeated words in the phrase.
      const last = item.en.split(' ').at(-1);
      await page.click('#built button:last-child');
      await page.evaluate(word => [...document.querySelectorAll('#bank button')].find(el => el.textContent === word).click(), last);
    }
    await page.click('#check');
    assert.match(await page.$eval('#feedback', el => el.textContent), /Bien joué/);
    await page.click('#next');
  }
  assert.match(await page.$eval('#score', el => el.textContent), /18 \/ 18/);
  await page.click('#home-button'); await page.click('[data-mode="listen"]');
  for (const item of data.listening) {
    for (const [i, question] of item.questions.entries()) {
      assert.equal(await page.$('#feedback details'), null);
      if (i === 0) {
        await page.click('#play');
        await page.waitForFunction(() => window.lastPlayer.currentTime > 0);
        await page.click('#stop');
      }
      await page.click(`[data-value="${question.answer}"]`);
      await page.click('#check');
      assert.match(await page.$eval('#feedback', el => el.textContent), /Bien joué/);
      assert.equal(await page.$eval('#feedback details p', el => el.textContent), item.text);
      await page.click('#next');
    }
  }
  assert.match(await page.$eval('#score', el => el.textContent), /12 \/ 12/);
  await page.click('#home-button'); await page.click('[data-mode="oral"]');
  await page.type('#draft', 'I can see a family. There are vegetables.');
  await page.select('#scene-choice', '1');
  assert.equal(await page.$eval('#draft', el => el.value), '');
  await page.select('#scene-choice', '0');
  assert.match(await page.$eval('#draft', el => el.value), /I can see a family/);
  await page.click('.checklist input');
  await page.click('#content details summary');
  await page.click('#play'); await page.waitForFunction(() => window.lastPlayer.currentTime > 0);
  await page.reload(); await page.waitForSelector('[data-mode="oral"]');
  assert.match(await page.$eval('#listen-progress', el => el.textContent), /12 \/ 12/);
  await page.click('[data-mode="oral"]');
  assert.match(await page.$eval('#draft', el => el.value), /There are vegetables/);
  const checks = await page.evaluate(async () => {
    const { matches } = await import('/felix/healthy-lifestyle/answers.js');
    return [matches('healthy', ['unhealthy'], true), matches('relax', ['relaxed'], true), matches('There is vegetables', ['There are vegetables']), matches('YOGHURT', ['yogurt','yoghurt'], true), matches('  A MEAL! ', ['a meal'], true), matches('vegetable', ['vegetables'], true), matches('fish', ['fish'], true)];
  });
  assert.deepEqual(checks, [false, false, false, true, true, false, true]);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile overflow');
  await page.screenshot({ path: '/tmp/felix-healthy-oral-mobile.png', fullPage: true });
  await page.click('#back');
  await page.screenshot({ path: '/tmp/felix-healthy-home-mobile.png', fullPage: true });
  await page.setViewport({ width: 1280, height: 900 });
  await page.screenshot({ path: '/tmp/felix-healthy-desktop.png', fullPage: true });
  const sessions = await page.evaluate(async () => { const DB = await import('/shared/db.js'); return DB.getSessions('healthy-lifestyle'); });
  assert.equal(sessions.length, 5, 'Each completed series is saved once, including error review');
  console.log('Verified vocabulary/dictation, all food groups, all 18 phrases, 12 listening questions, real audio, oral drafts after reload, error review, session history and mobile layout.');
} catch (error) { errors.push({ page: 'Eat well, live well', error: error.stack }); }
collector.check();
await done();
