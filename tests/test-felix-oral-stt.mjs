import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setup, collectErrors, ROOT } from './smoke-harness.mjs';
const fixtureDir = mkdtempSync(join(tmpdir(), 'etincelle-oral-mic-'));
const fixture = join(fixtureDir, 'family.wav');
execFileSync('ffmpeg', ['-v', 'error', '-i', `${ROOT}/felix/healthy-lifestyle/audio/o1-q1.mp3`, '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', fixture]);
const { browser, base, errors, done } = await setup({ launchArgs: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${fixture}`] });
const page = await browser.newPage();
page.setDefaultTimeout(240000);
const sentAudio = [];
page.on('request', request => { if (request.method() !== 'GET') sentAudio.push(request.url()); });
const collector = collectErrors(page, 'Moonshine oral recognition (real WASM model)', errors);
page.on('console', message => { if (message.text().startsWith('STT test:')) console.log(message.text()); });
try {
  await page.goto(`${base}/felix/healthy-lifestyle/`, { waitUntil: 'networkidle0' });
  assert.ok(await page.evaluate(() => crossOriginIsolated), 'Threaded speech runtime needs isolation');
  const results = await page.evaluate(async () => {
    const { SpeechCoach } = await import('/felix/healthy-lifestyle/oral-speech.js');
    const { checkOralAnswer } = await import('/felix/healthy-lifestyle/oral-check.js');
    const content = await (await fetch('content.json')).json();
    const coach = new SpeechCoach();
    let progress = -1;
    await coach.prepare(percent => {
      const group = Math.floor(percent / 25);
      if (group !== progress) { progress = group; console.log(`STT test: model download ${percent}%`); }
    });
    console.log('STT test: model ready');
    const results = [];
    try {
      for (const scene of content.oral) {
        for (const question of scene.questions) {
          const blob = await (await fetch(`audio/${question.id}.mp3`)).blob();
          const heard = await coach.transcribe(blob);
          const result = checkOralAnswer(heard, question.kind, scene);
          results.push({ id: question.id, heard, passed: result.passed, missing: result.checks.filter(c => !c.ok).map(c => c.label) });
          console.log(`STT test: ${question.id} ${result.passed ? 'passed' : 'needs review'}`);
        }
      }
      const recorded = await coach.record({ maxMs: 5000, onState: state => console.log(`STT test: microphone ${state}`), onProgress: () => {} });
      results.push({ id: 'real-recorder-path', heard: recorded.text, passed: checkOralAnswer(recorded.text, 'people', content.oral[0]).passed && !coach.media && !coach.recorder });
      const wrong = await coach.transcribe(await (await fetch('audio/v19.mp3')).blob());
      results.push({ id: 'unrelated-word-rejected', heard: wrong, passed: !checkOralAnswer(wrong, 'people', content.oral[0]).passed });
    } finally { coach.close(); }
    return results;
  });
  assert.deepEqual(sentAudio, [], 'No audio or transcript is uploaded');
  for (const result of results) { console.log(JSON.stringify(result)); assert.ok(result.passed, JSON.stringify(result)); }
} catch (error) { errors.push({ page: 'Moonshine oral recognition', error: error.stack }); }
rmSync(fixtureDir, { recursive: true, force: true });
collector.check();
await done();
