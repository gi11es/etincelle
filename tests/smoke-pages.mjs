#!/usr/bin/env node
/** Smoke test: verify all pages load without JS errors. */
import { setup, testPageLoad } from './smoke-harness.mjs';

const { browser, base, errors, done } = await setup();

const pages = [
  ['/', 'Home'],
  ['/felix/', 'Felix Portal'],
  ['/felix/healthy-lifestyle/', 'Felix Eat well, live well'],
  ['/felix/dictee/', 'Felix Dictée Sur l’eau'],
  ['/felix/stats/', 'Felix Stats'],
  ['/felix/proportionnalite/', 'Felix Proportionnalité 4ème'],
  ['/felix/verbes-anglais/', 'Felix Verbes irréguliers'],
  ['/felix/famille-espagnol/', 'Felix La famille (Espagnol)'],
  ['/dasha/', 'Dasha Portal'],
  ['/dasha/stats/', 'Dasha Stats'],
  ['/zoe/app.html', 'Zoe'],
];

for (const [path, name] of pages) {
  await testPageLoad(browser, base, path, name, errors);
}

await done();
