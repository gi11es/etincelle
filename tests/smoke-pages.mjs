#!/usr/bin/env node
/** Smoke test: verify all pages load without JS errors. */
import { setup, testPageLoad } from './smoke-harness.mjs';

const { browser, base, errors, done } = await setup();

const pages = [
  ['/', 'Home'],
  ['/felix/', 'Felix Portal'],
  ['/felix/stats/', 'Felix Stats'],
  ['/dasha/', 'Dasha Portal'],
  ['/dasha/stats/', 'Dasha Stats'],
  ['/zoe/app.html', 'Zoe'],
];

for (const [path, name] of pages) {
  await testPageLoad(browser, base, path, name, errors);
}

await done();
