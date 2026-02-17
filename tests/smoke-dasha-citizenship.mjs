#!/usr/bin/env node
/** Smoke test: click every Dasha Citizenship card and verify no JS errors. */
import { setup, testClickEach } from './smoke-harness.mjs';

const { browser, base, errors, done } = await setup();

await testClickEach(browser, base, '/dasha/citizenship/', 'Citizenship', errors, {
  cardSelector: '.category-card',
  cardNameSelector: '.category-name, h3',
  contentSelector: '#game-container .question-text, #game-container .choices',
  backSelector: '.btn-back',
  gridSelector: '#category-grid',
});

await done();
