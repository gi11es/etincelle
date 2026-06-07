#!/usr/bin/env node
/** Smoke test: open the English irregular verbs activity and verify no JS errors. */
import { setup, testClickEach } from './smoke-harness.mjs';

const { browser, base, errors, done } = await setup();

await testClickEach(browser, base, '/felix/verbes-anglais/', 'Verbes irréguliers', errors, {
  cardSelector: '.level-card',
  cardNameSelector: '.level-title, h3',
  contentSelector: '#game-container .verb-card',
  backSelector: '.btn-back',
  gridSelector: '#level-grid',
});

await done();
