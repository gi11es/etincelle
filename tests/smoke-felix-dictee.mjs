import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { setup, collectErrors, ROOT } from './smoke-harness.mjs';

const { browser, base, errors, done } = await setup();
const page = await browser.newPage();
const collector = collectErrors(page, 'Dictée Sur l’eau', errors);
const data = JSON.parse(readFileSync(`${ROOT}/felix/dictee/texte.json`, 'utf8'));
try {
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${base}/felix/`);
  await page.click('a[href="dictee/index.html"]');
  await page.waitForSelector('.reading');
  assert.equal(await page.$$eval('#section option', items => items.length), 13);
  const manifest = JSON.parse(readFileSync(`${ROOT}/felix/dictee/audio-manifest.json`, 'utf8'));
  assert.equal(manifest.model_id, 'eleven_v4');
  for (const [name, entry] of Object.entries(manifest.tracks)) {
    const audio = readFileSync(`${ROOT}/felix/dictee/audio/${name}.mp3`);
    assert.equal(entry.audio_sha256, createHash('sha256').update(audio).digest('hex'));
    assert.equal(entry.model_id, 'eleven_v4');
  }
  for (const section of data.sections) {
    assert.ok(existsSync(`${ROOT}/felix/dictee/audio/${section.id}-passage.mp3`));
    section.chunks.forEach((_, i) => assert.ok(existsSync(`${ROOT}/felix/dictee/audio/${section.id}-${i}.mp3`)));
    section.words.forEach((_, i) => assert.ok(existsSync(`${ROOT}/felix/dictee/audio/${section.id}-word-${i}.mp3`)));
  }
  // Exercise real bundled audio decoding/playback, speed, stopping and phrase controls.
  await page.click('#listen');
  await page.waitForFunction(() => document.querySelector('#audio-status').textContent.includes('Lecture') || document.querySelector('#audio-status').textContent.includes('Écoute en cours'));
  await page.waitForFunction(() => performance.getEntriesByType('resource').some(r => new URL(r.name).pathname.endsWith('/1-passage.mp3')));
  const audioWorks = await page.evaluate(async () => {
    const audio = new Audio('audio/1-0.mp3');
    await new Promise((resolve, reject) => { audio.onloadedmetadata = resolve; audio.onerror = reject; });
    return audio.duration > 1;
  });
  assert.ok(audioWorks);
  await page.select('#speed', '0.8');
  await page.click('#stop');
  await page.click('#next-phrase');
  assert.equal(await page.$eval('#phrase-position', el => el.textContent), '2 / 2');
  await page.click('#phrase');
  await page.waitForFunction(() => performance.getEntriesByType('resource').some(r => new URL(r.name).pathname.endsWith('/1-1.mp3')));
  // A new source must retain the selected speed, including its actual playback clock.
  for (const mode of ['dictation', 'gaps']) {
    await page.select('#speed', '0.5');
    await page.click(`[data-mode="${mode}"]`);
    await page.select('#section', '3');
    await page.waitForFunction(() => !document.querySelector('#seek').disabled);
    assert.deepEqual(await page.$eval('#audio-player', el => [el.defaultPlaybackRate, el.playbackRate]), [0.5, 0.5]);
    await page.click('#listen');
    await page.waitForFunction(() => document.querySelector('#audio-player').currentTime > 0.1);
    const measure = () => page.$eval('#audio-player', async audio => {
      const at = audio.currentTime, start = performance.now();
      await new Promise(resolve => setTimeout(resolve, 1200));
      return (audio.currentTime - at) / ((performance.now() - start) / 1000);
    });
    const slow = await measure();
    assert.ok(slow > 0.35 && slow < 0.65, `Half-speed clock: ${slow}`);
    await page.select('#speed', '1');
    const normal = await measure();
    assert.ok(normal > 0.8 && normal < 1.2, `Normal-speed clock: ${normal}`);
    await page.click('#pause');
    await page.select('#speed', '0.65');
    await page.click('#pause');
    assert.equal(await page.$eval('#audio-player', el => el.playbackRate), 0.65);
    await page.click('#next-phrase');
    assert.equal(await page.$eval('#phrase-position', el => el.textContent), '2 / 2');
    await page.waitForFunction(() => !document.querySelector('#seek').disabled);
    assert.deepEqual(await page.$eval('#audio-player', el => [el.defaultPlaybackRate, el.playbackRate]), [0.65, 0.65]);
    await page.click('#phrase');
    await page.waitForFunction(() => !document.querySelector('#audio-player').paused);
    assert.equal(await page.$eval('#audio-player', el => el.playbackRate), 0.65);
    await page.click('#stop');
    await page.select('#section', '0');
    await page.waitForFunction(() => !document.querySelector('#seek').disabled);
  }
  // Both dictation modes share a seekable passage track, with pause/resume at the same position.
  for (const mode of ['dictation', 'gaps']) {
    await page.click(`[data-mode="${mode}"]`);
    await page.waitForFunction(() => !document.querySelector('#seek').disabled);
    assert.match(await page.$eval('#audio-player', el => el.dataset.track), /1-passage\.mp3/);
    if (mode === 'dictation') await page.type('#answer', 'Mon brouillon');
    else await page.type('[data-word="0"]', 'quelque');
    await page.click('#listen');
    await page.waitForFunction(() => document.querySelector('#audio-player').currentTime > 0.2);
    await page.click('#pause');
    const frozen = await page.$eval('#audio-player', el => ({ paused: el.paused, at: el.currentTime }));
    assert.ok(frozen.paused);
    await new Promise(resolve => setTimeout(resolve, 250));
    assert.ok(Math.abs((await page.$eval('#audio-player', el => el.currentTime)) - frozen.at) < 0.02);
    // Seek beyond the first phrase, while remaining paused.
    await page.$eval('#seek', el => { el.value = Number(el.max) * 0.75; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForFunction(() => Math.abs(document.querySelector('#audio-player').currentTime - Number(document.querySelector('#seek').value)) < 0.15);
    const sought = await page.$eval('#audio-player', el => ({ at: el.currentTime, duration: el.duration, paused: el.paused }));
    assert.ok(sought.paused);
    assert.ok(sought.at > sought.duration * 0.7);
    assert.equal(await page.$eval(mode === 'dictation' ? '#answer' : '[data-word="0"]', el => el.value), mode === 'dictation' ? 'Mon brouillon' : 'quelque');
    await page.click('#pause');
    await page.waitForFunction(at => document.querySelector('#audio-player').currentTime > at + 0.15, {}, sought.at);
    await page.click('#pause');
    await page.focus('#seek'); await page.keyboard.press('Home');
    assert.equal(await page.$eval('#audio-player', el => el.currentTime), 0);
    await page.keyboard.press('ArrowRight');
    assert.ok(await page.$eval('#audio-player', el => el.currentTime > 0));
    await page.click('#stop');
    assert.equal(await page.$eval('#audio-player', el => el.currentTime), 0);
  }
  await page.click('[data-mode="dictation"]');
  assert.equal(await page.$eval('#audio-status', el => el.textContent), '');
  assert.equal(await page.$eval('#full-text', el => el.hidden), true);
  await page.click('#check');
  assert.match(await page.$eval('#feedback', el => el.textContent), /Écris ta réponse/);

  // All text passages must work in both spelling exercises; targets must actually occur.
  for (let i = 0; i < data.sections.length; i++) {
    const section = data.sections[i];
    const text = section.chunks.join(' ');
    for (const item of section.words) assert.ok(text.includes(item.word), item.word);
    await page.select('#section', String(i));
    await page.click('[data-mode="gaps"]');
    await page.evaluate(words => {
      document.querySelectorAll('[data-word]').forEach(input => { input.value = words[Number(input.dataset.word)].word; });
    }, section.words);
    await page.click('#check');
    assert.match(await page.$eval('#feedback', el => el.textContent), /100 %/);
    await page.click('[data-mode="dictation"]');
    await page.$eval('#answer', (el, value) => { el.value = value; }, text.replaceAll('’', "'"));
    await page.click('#check');
    assert.match(await page.$eval('#feedback', el => el.textContent), /100 %/);
    await page.click('#check'); // Already corrected: no duplicate result.
  }
  await page.waitForFunction(() => document.querySelector('#progress').textContent.startsWith('13 / 13'));
  await page.reload();
  await page.waitForSelector('.reading');
  assert.match(await page.$eval('#progress', el => el.textContent), /13 \/ 13/);
  await page.click('[data-mode="words"]');
  await page.$eval('#answer', el => { el.value = 'quelques'; });
  await page.click('#check');
  assert.match(await page.$eval('#feedback', el => el.textContent), /0 %/);
  assert.match(await page.$eval('#feedback', el => el.textContent), /singulier/);
  await page.click('#retry');
  await page.$eval('#answer', el => { el.value = 'quelque'; });
  await page.click('#check');
  assert.match(await page.$eval('#feedback', el => el.textContent), /100 %/);
  await page.click('#next');
  assert.match(await page.$eval('.word-prompt', el => el.textContent), /2 \/ 3/);
  await page.click('[data-mode="gaps"]');
  await page.evaluate(() => document.querySelectorAll('[data-word]').forEach(el => { el.value = 'erreur'; }));
  await page.click('#check');
  assert.equal(await page.$$eval('[aria-invalid="true"]', els => els.length), 3);
  const scores = await page.evaluate(async () => {
    const { compare } = await import('/felix/dictee/correction.js');
    return {
      accent: compare('épais', 'epais').percent,
      omission: compare('Je me rassis épuisé.', 'Je rassis épuisé.').mistakes,
      extra: compare('Je me rassis épuisé.', 'Je me me rassis épuisé.').mistakes,
      typography: compare('mon cœur m’inquiète.', "mon coeur m'inquiète").percent,
      caps: compare('Je saisis', 'je saisis').mistakes,
      wrong: compare('Je me rassis', 'Je me rassit').mistakes,
    };
  });
  assert.equal(Object.keys(manifest.tracks).length, 76);
  assert.deepEqual(scores, { accent: 0, omission: 1, extra: 1, typography: 100, caps: 1, wrong: 1 });
  // The scores tab lists the saved history outside any exercise and opens a passage.
  await page.click('[data-mode="scores"]');
  await page.waitForSelector('#scores .score-summary');
  assert.equal(await page.$eval('.audio-tools', el => el.hidden), true);
  assert.equal(await page.$eval('.actions', el => el.hidden), true);
  assert.match(await page.$eval('.score-summary', el => el.textContent), /13 \/ 13/);
  assert.equal(await page.$$eval('#scores tbody tr button[data-passage]', els => els.length), 13);
  const latest = await page.$$eval('#scores table', tables => tables.at(-1).querySelector('tbody tr').textContent);
  assert.match(latest, /Dictée à trous/);
  assert.match(latest, /0 %/);
  assert.match(await page.$eval('#scores tbody tr', el => el.textContent), /1 \/ 3/);
  await page.screenshot({ path: '/tmp/felix-dictee-scores-mobile.png', fullPage: true });
  await page.click('button[data-passage="4"]');
  assert.equal(await page.$eval('[data-mode="dictation"]', el => el.getAttribute('aria-pressed')), 'true');
  assert.equal(await page.$eval('#section', el => el.value), '4');
  assert.equal(await page.$eval('.actions', el => el.hidden), false);
  await page.click('[data-mode="read"]');
  await page.click('#full-text summary');
  assert.equal(await page.$eval('#full-text', el => el.open), true);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow on phone');
  await page.screenshot({ path: '/tmp/felix-dictee-mobile.png', fullPage: true });
  console.log('All 13 passages, bundled audio, corrections, word practice, progress after reload and mobile layout verified.');
} catch (error) {
  errors.push({ page: 'Dictée Sur l’eau', error: error.stack });
}
collector.check();
await done();
