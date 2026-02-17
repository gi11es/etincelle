#!/usr/bin/env node
/** Smoke test: click every Dasha French level card and verify no JS errors. */
import { setup, testClickEach } from './smoke-harness.mjs';

const { browser, base, errors, done } = await setup();

await testClickEach(browser, base, '/dasha/french/', 'French', errors, {
  cardSelector: '.level-card',
  cardNameSelector: '.level-title, .card-title, h3',
  contentSelector: '#game-container .question-text, #game-container .choices',
  backSelector: '.btn-back',
  gridSelector: '#level-grid',
});

await done();
