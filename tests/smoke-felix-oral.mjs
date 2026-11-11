import assert from 'node:assert/strict';
import { setup, collectErrors } from './smoke-harness.mjs';
const { browser, base, errors, done } = await setup();
const page = await browser.newPage();
const collector = collectErrors(page, 'Guided oral UI (controlled recognition)', errors);
// UI lifecycle tests use a controlled recognizer. The separate STT test runs real WASM and microphone capture.
await page.setRequestInterception(true);
page.on('request', request => {
  if (new URL(request.url()).pathname.endsWith('/oral-speech.js')) {
    request.respond({ contentType: 'text/javascript', body: `
      export class SpeechCoach {
        supported = true;
        recorder = null;
        cancelPending = null;
        async prepare() {}
        async record({onState}) {
          if (window.testMicError) throw new DOMException('Micro bloqué', window.testMicError);
          window.testMicActive = true; this.recorder = {state:'recording'};
          onState('recording');
          return new Promise((resolve,reject) => {
            this.cancelPending = () => reject(new DOMException('cancelled','AbortError'));
            this.resolve = async () => {
              window.testMicActive = false; this.recorder = null; onState('processing');
              const blob = await (await fetch('audio/o1-q1.mp3')).blob();
              resolve({text:window.testUtterance || '',blob});
            };
          });
        }
        finish() { this.cancelPending = null; this.resolve?.(); }
        cancel() { window.testMicActive = false; this.recorder = null; this.cancelPending?.(); this.cancelPending = null; }
      }
    ` });
  } else request.continue();
});
async function say(text) {
  await page.evaluate(text => { window.testUtterance = text; }, text);
  await page.click('#oral-record');
  await page.waitForFunction(() => !document.querySelector('#oral-finish').disabled);
  assert.ok(await page.evaluate(() => window.testMicActive));
  await page.click('#oral-finish');
  await page.waitForFunction(() => !document.querySelector('#oral-record').disabled);
}
try {
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${base}/felix/healthy-lifestyle/`);
  await page.click('[data-mode="oral"]');
  assert.equal(await page.$('#oral-record'), null, 'Start with observation, not an unexplained microphone');
  await page.click('#oral-begin');
  assert.ok(await page.$eval('#check', el => el.hidden), 'The unrelated written-quiz button stays hidden');
  assert.match(await page.$eval('#oral-title', el => el.textContent), /Qui et où/);
  assert.ok(await page.$eval('#oral-next', el => el.hidden));
  await say('');
  assert.match(await page.$eval('#oral-status', el => el.textContent), /pas entendu/);
  assert.ok(await page.$eval('#oral-next', el => el.hidden));
  await say('I can see a burger.');
  assert.match(await page.$eval('#oral-result', el => el.textContent), /manque/);
  assert.ok(await page.$eval('#oral-next', el => el.hidden));
  assert.match(await page.$eval('#oral-checks', el => el.textContent), /in the kitchen/);
  await page.evaluate(() => { window.testMicError = 'NotAllowedError'; });
  await page.click('#oral-record');
  await page.waitForFunction(() => document.querySelector('#oral-status').textContent.includes('bloqué'));
  assert.ok(await page.$eval('#oral-fallback', el => el.open));
  await page.evaluate(() => { window.testMicError = null; });
  await say('I can see a family in the kitchen.');
  assert.match(await page.$eval('#oral-result', el => el.textContent), /Ta réponse contient/);
  assert.ok(await page.$('#oral-feedback #oral-next'), 'Continue sits directly below the answer feedback');
  await page.click('#oral-next');
  await page.reload(); await page.waitForSelector('[data-mode="oral"]');
  await page.click('[data-mode="oral"]');
  assert.match(await page.$eval('#oral-title', el => el.textContent), /La nourriture/);
  await say('There are vegetables and rice.');
  assert.ok(await page.$eval('#oral-next', el => el.hidden));
  assert.match(await page.$eval('#oral-checks', el => el.textContent), /boisson/);
  await say('There are vegetables, rice and fish. There is water.');
  await page.click('#oral-next');
  await say('They is eat a meal.');
  assert.ok(await page.$eval('#oral-next', el => el.hidden));
  await say('They are sharing a meal.');
  await page.click('#oral-next');
  await say('I think they feel relax.');
  assert.ok(await page.$eval('#oral-next', el => el.hidden));
  await say('I think they feel relaxed.');
  await page.click('#oral-next');
  await say('Maybe the food is homemade.');
  await page.click('#oral-next');
  assert.match(await page.$eval('#oral-title', el => el.textContent), /Fais ton oral/);
  assert.equal(await page.$$eval('#oral-feedback:not([hidden])', els => els.length), 0);
  await say('I can see a family in the kitchen. There are vegetables, rice and fish. There is water. They are sharing a meal. I think they feel relaxed. Maybe the food is homemade.');
  await page.click('#oral-next');
  assert.match(await page.$eval('#oral-title', el => el.textContent), /Bravo/);
  assert.match(await page.$eval('#content', el => el.textContent), /5 \/ 5/);
  await page.click('#oral-other');
  await page.click('#oral-begin');
  await say('I can see a family in the kitchen.');
  assert.ok(await page.$eval('#oral-next', el => el.hidden), 'Other scene requires its own people/place');
  await say('I can see three friends in a park.');
  await page.click('#oral-next');
  // Leaving while recording cancels capture and must not write a late answer to another screen.
  await page.click('#oral-record');
  await page.waitForFunction(() => window.testMicActive);
  await page.click('#back');
  assert.equal(await page.evaluate(() => window.testMicActive), false);
  await page.click('[data-mode="oral"]');
  await page.select('#scene-choice', '1');
  assert.match(await page.$eval('#oral-title', el => el.textContent), /La nourriture/);
  await page.screenshot({ path: '/tmp/felix-oral-guided-mobile.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  // Explicit writing mode is never labelled as a successful spoken answer.
  await page.click('#oral-fallback summary'); await page.click('#oral-manual');
  await page.type('#oral-edit', 'There are apples, bananas, cheese and bread. There is water.');
  await page.click('#oral-recheck');
  assert.match(await page.$eval('#oral-result', el => el.textContent), /Ton texte/);
  const answers = await page.evaluate(() => JSON.parse(localStorage.getItem('felix-healthy-lifestyle-v1')).oral.o2.answers);
  assert.equal(answers['o2-q2'].spoken, false);
  console.log('Guided steps, real spoken/typed distinction, silence, retry, grammar feedback, blocked mic, both scenes, resume after reload and mic cancellation verified.');
} catch (error) { errors.push({ page: 'Guided oral UI', error: error.stack }); }
collector.check();
await done();
