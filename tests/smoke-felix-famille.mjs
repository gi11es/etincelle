#!/usr/bin/env node
/** Smoke test: open the Spanish family vocabulary activity and verify no JS errors. */
import { setup, testClickEach } from './smoke-harness.mjs';

const { browser, base, errors, done } = await setup();

await testClickEach(browser, base, '/felix/famille-espagnol/', 'La famille (Espagnol)', errors, {
  cardSelector: '.level-card',
  cardNameSelector: '.level-title, h3',
  contentSelector: '#game-container .flashcard, #game-container .fill-blank-sentence',
  backSelector: '.btn-back',
  gridSelector: '#level-grid',
});

await done();
