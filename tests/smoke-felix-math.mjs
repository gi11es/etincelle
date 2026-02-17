#!/usr/bin/env node
/** Smoke test: click every math chapter card and verify no JS errors. */
import { setup, testClickEach } from './smoke-harness.mjs';

const { browser, base, errors, done } = await setup();

await testClickEach(browser, base, '/felix/math/', 'Math', errors, {
  cardSelector: '.chapter-card',
  cardNameSelector: '.chapter-name',
  contentSelector: '.math-question, .interactive-container',
  backSelector: '#btn-back-levels',
  gridSelector: '.chapter-card',
});

await done();
