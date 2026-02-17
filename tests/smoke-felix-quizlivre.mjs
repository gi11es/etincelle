#!/usr/bin/env node
/** Smoke test: click every quiz-livre book card and verify no JS errors. */
import { setup, testClickEach } from './smoke-harness.mjs';

const { browser, base, errors, done } = await setup();

await testClickEach(browser, base, '/felix/quiz-livre/', 'Quiz-Livre', errors, {
  cardSelector: '.book-card',
  cardNameSelector: '.book-title, h3',
  contentSelector: '.mode-card, #quiz-container .question-text',
  backSelector: '.btn-back',
  gridSelector: '#book-grid',
});

await done();
