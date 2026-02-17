#!/usr/bin/env node

/**
 * Gamification test: verifies that endSessionFlow writes correct IndexedDB
 * entries (profile XP, sessions, daily activity, badges) and that the stats
 * page reads them back — for all users, including after cross-portal visits.
 */

import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
};

function startServer() {
  return new Promise((res) => {
    const server = createServer((req, resp) => {
      let url = req.url.split('?')[0];
      if (url.endsWith('/')) url += 'index.html';
      const filePath = join(ROOT, url);
      if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
        resp.writeHead(404); resp.end('Not found'); return;
      }
      try {
        const content = readFileSync(filePath);
        resp.writeHead(200, { 'Content-Type': MIME_TYPES[extname(filePath)] || 'application/octet-stream' });
        resp.end(content);
      } catch { resp.writeHead(500); resp.end('Error'); }
    });
    server.listen(0, '127.0.0.1', () => res(server));
  });
}

let passed = 0, failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; console.log(`  PASS: ${msg}`); }
  else { failed++; console.log(`  FAIL: ${msg}`); }
}

function instrumentPage(page) {
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.startsWith('Failed to load resource')) {
        console.log(`    [console.error] ${text}`);
        pageErrors.push(text);
      }
    }
  });
  page.on('pageerror', (err) => {
    console.log(`    [pageerror] ${err.message}`);
    pageErrors.push(err.message);
  });
  return pageErrors;
}

// ============================================================================
// Reusable test: endSessionFlow + stats for any user/app
// ============================================================================

async function testEndSessionFlow(browser, BASE, { user, exercisePath, app, statsPath }) {
  const page = await browser.newPage();
  const errs = instrumentPage(page);

  await page.goto(`${BASE}${exercisePath}`, { waitUntil: 'networkidle2', timeout: 15000 });

  const result = await page.evaluate(async (appName) => {
    try {
      const DB = await import('/shared/db.js');
      const GAM = await import('/shared/gamification.js');

      const flowResult = await GAM.endSessionFlow({
        app: appName, correct: 8, total: 10, timeSec: 120,
      });

      const profile = await DB.getProfile();
      const sessionCount = await DB.countSessions();
      const daily = await DB.getAllDailyActivity();
      const badges = await DB.getBadges();
      const dbs = await indexedDB.databases();
      const dbNames = dbs.map(d => d.name).filter(n => n?.startsWith('FamilyLearning'));

      return { flowResult, profile, sessionCount, daily, badges, dbNames, error: null };
    } catch (e) { return { error: e.message, stack: e.stack }; }
  }, app);

  if (result.error) {
    console.log(`  ERROR: ${result.error}\n  ${result.stack}`);
    failed++;
  } else {
    assert(result.dbNames.includes(`FamilyLearning-${user}`),
      `Uses FamilyLearning-${user} (DBs: ${result.dbNames})`);
    assert(result.profile.xp > 0, `Profile XP > 0 (got ${result.profile.xp})`);
    assert(result.profile.streak >= 1, `Streak >= 1 (got ${result.profile.streak})`);
    assert(result.sessionCount >= 1, `Sessions >= 1 (got ${result.sessionCount})`);
    assert(result.daily.length >= 1, `Daily activity entries >= 1 (got ${result.daily.length})`);
    assert(result.badges.length >= 1, `Badges >= 1 (got ${result.badges.length})`);
    assert(result.flowResult.xp > 0, `Returned XP > 0 (got ${result.flowResult.xp})`);
  }
  assert(errs.length === 0, `No JS errors (got ${errs.length})`);

  await page.close();

  // Now verify stats page reads back the data
  if (statsPath) {
    const statsPage = await browser.newPage();
    instrumentPage(statsPage);

    await statsPage.goto(`${BASE}${statsPath}`, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    const stats = await statsPage.evaluate(() => ({
      xp: document.querySelector('#sum-xp')?.textContent,
      streak: document.querySelector('#sum-streak')?.textContent,
      sessions: document.querySelector('#sum-sessions')?.textContent,
    }));

    console.log(`  Stats page: XP=${stats.xp} streak=${stats.streak} sessions=${stats.sessions}`);
    assert(stats.xp !== '0', `Stats XP not "0" (got "${stats.xp}")`);
    assert(stats.streak !== '0', `Stats streak not "0" (got "${stats.streak}")`);
    assert(stats.sessions !== '0', `Stats sessions not "0" (got "${stats.sessions}")`);

    await statsPage.close();
  }
}

async function main() {
  const server = await startServer();
  const port = server.address().port;
  const BASE = `http://127.0.0.1:${port}`;
  console.log(`Server on ${BASE}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // ==========================================================================
  // Test 1: Felix English
  // ==========================================================================
  console.log('=== Test 1: Felix English ===\n');
  await testEndSessionFlow(browser, BASE, {
    user: 'felix', exercisePath: '/felix/english/', app: 'english',
    statsPath: '/felix/stats/',
  });

  // ==========================================================================
  // Test 2: Felix Math
  // ==========================================================================
  console.log('\n=== Test 2: Felix Math ===\n');
  await testEndSessionFlow(browser, BASE, {
    user: 'felix', exercisePath: '/felix/math/', app: 'math',
    statsPath: '/felix/stats/',
  });

  // ==========================================================================
  // Test 3: Dasha French
  // ==========================================================================
  console.log('\n=== Test 3: Dasha French ===\n');
  await testEndSessionFlow(browser, BASE, {
    user: 'dasha', exercisePath: '/dasha/french/', app: 'french',
    statsPath: '/dasha/stats/',
  });

  // ==========================================================================
  // Test 4: Dasha Citizenship
  // ==========================================================================
  console.log('\n=== Test 4: Dasha Citizenship ===\n');
  await testEndSessionFlow(browser, BASE, {
    user: 'dasha', exercisePath: '/dasha/citizenship/', app: 'citizenship',
    statsPath: '/dasha/stats/',
  });

  // ==========================================================================
  // Test 5: User isolation — Felix data not in Dasha, and vice versa
  // ==========================================================================
  console.log('\n=== Test 5: User isolation ===\n');
  {
    // Check Dasha has her own data (from tests 3-4) but not Felix's
    const page = await browser.newPage();
    instrumentPage(page);

    await page.goto(`${BASE}/dasha/french/`, { waitUntil: 'networkidle2', timeout: 15000 });
    const dashaProfile = await page.evaluate(async () => {
      const DB = await import('/shared/db.js');
      const profile = await DB.getProfile();
      const sessions = await DB.getSessions();
      const apps = [...new Set(sessions.map(s => s.app))];
      return { xp: profile.xp, apps };
    });

    assert(!dashaProfile.apps.includes('english'), `Dasha has no english sessions (apps: ${dashaProfile.apps})`);
    assert(!dashaProfile.apps.includes('math'), `Dasha has no math sessions (apps: ${dashaProfile.apps})`);

    // Check Felix has his own data but not Dasha's
    await page.goto(`${BASE}/felix/english/`, { waitUntil: 'networkidle2', timeout: 15000 });
    const felixProfile = await page.evaluate(async () => {
      const DB = await import('/shared/db.js');
      const sessions = await DB.getSessions();
      const apps = [...new Set(sessions.map(s => s.app))];
      return { apps };
    });

    assert(!felixProfile.apps.includes('french'), `Felix has no french sessions (apps: ${felixProfile.apps})`);
    assert(!felixProfile.apps.includes('citizenship'), `Felix has no citizenship sessions (apps: ${felixProfile.apps})`);

    await page.close();
  }

  // ==========================================================================
  // Test 6: Cross-portal — visit Dasha, then complete Felix exercise
  // ==========================================================================
  console.log('\n=== Test 6: Cross-portal (Dasha portal → Felix exercise) ===\n');
  {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    const errs = instrumentPage(page);

    // Visit Dasha portal first (sets localStorage to 'dasha')
    await page.goto(`${BASE}/dasha/`, { waitUntil: 'networkidle2', timeout: 15000 });
    const lsBefore = await page.evaluate(() => localStorage.getItem('family-active-user'));
    console.log(`  After Dasha portal: localStorage="${lsBefore}"`);
    assert(lsBefore === 'dasha', `localStorage = "dasha" (got "${lsBefore}")`);

    // Navigate to Felix English (without going through Felix portal)
    await page.goto(`${BASE}/felix/english/`, { waitUntil: 'networkidle2', timeout: 15000 });

    const result = await page.evaluate(async () => {
      try {
        const DB = await import('/shared/db.js');
        const GAM = await import('/shared/gamification.js');

        const flowResult = await GAM.endSessionFlow({
          app: 'english', correct: 10, total: 10, timeSec: 90,
        });

        const profile = await DB.getProfile();
        const ls = localStorage.getItem('family-active-user');
        const dbs = await indexedDB.databases();
        const dbNames = dbs.map(d => d.name).filter(n => n?.startsWith('FamilyLearning'));

        return { profile, ls, dbNames, xp: flowResult.xp, error: null };
      } catch (e) { return { error: e.message, stack: e.stack }; }
    });

    if (result.error) { console.log(`  ERROR: ${result.error}`); failed++; }
    else {
      assert(result.ls === 'felix', `localStorage corrected to "felix" (got "${result.ls}")`);
      assert(result.profile.xp > 0, `Felix XP > 0 (got ${result.profile.xp})`);
    }

    // Verify Felix stats page works
    await page.goto(`${BASE}/felix/stats/`, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    const stats = await page.evaluate(() => ({
      xp: document.querySelector('#sum-xp')?.textContent,
      sessions: document.querySelector('#sum-sessions')?.textContent,
    }));

    console.log(`  Felix stats: XP=${stats.xp} sessions=${stats.sessions}`);
    assert(stats.xp !== '0', `Stats XP not "0" (got "${stats.xp}")`);
    assert(stats.sessions !== '0', `Stats sessions not "0" (got "${stats.sessions}")`);

    // Verify Dasha not polluted
    await page.goto(`${BASE}/dasha/stats/`, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    const dashaStats = await page.evaluate(() => ({
      xp: document.querySelector('#sum-xp')?.textContent,
    }));

    assert(dashaStats.xp === '0', `Dasha XP still "0" (got "${dashaStats.xp}")`);
    assert(errs.length === 0, `No JS errors (got ${errs.length})`);

    await page.close();
    await ctx.close();
  }

  // ==========================================================================
  // Test 7: Cross-portal — visit Felix, then complete Dasha exercise
  // ==========================================================================
  console.log('\n=== Test 7: Cross-portal (Felix portal → Dasha exercise) ===\n');
  {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    const errs = instrumentPage(page);

    // Visit Felix portal first
    await page.goto(`${BASE}/felix/`, { waitUntil: 'networkidle2', timeout: 15000 });
    const lsBefore = await page.evaluate(() => localStorage.getItem('family-active-user'));
    assert(lsBefore === 'felix', `localStorage = "felix" (got "${lsBefore}")`);

    // Navigate directly to Dasha French
    await page.goto(`${BASE}/dasha/french/`, { waitUntil: 'networkidle2', timeout: 15000 });

    const result = await page.evaluate(async () => {
      try {
        const DB = await import('/shared/db.js');
        const GAM = await import('/shared/gamification.js');

        const flowResult = await GAM.endSessionFlow({
          app: 'french', correct: 7, total: 10, timeSec: 180,
        });

        const profile = await DB.getProfile();
        const ls = localStorage.getItem('family-active-user');

        return { profile, ls, xp: flowResult.xp, error: null };
      } catch (e) { return { error: e.message, stack: e.stack }; }
    });

    if (result.error) { console.log(`  ERROR: ${result.error}`); failed++; }
    else {
      assert(result.ls === 'dasha', `localStorage corrected to "dasha" (got "${result.ls}")`);
      assert(result.profile.xp > 0, `Dasha XP > 0 (got ${result.profile.xp})`);
    }

    // Verify Dasha stats page
    await page.goto(`${BASE}/dasha/stats/`, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    const stats = await page.evaluate(() => ({
      xp: document.querySelector('#sum-xp')?.textContent,
    }));

    assert(stats.xp !== '0', `Dasha stats XP not "0" (got "${stats.xp}")`);
    assert(errs.length === 0, `No JS errors (got ${errs.length})`);

    await page.close();
    await ctx.close();
  }

  // ==========================================================================
  // Test 8: Multiple sessions accumulate for same user
  // ==========================================================================
  console.log('\n=== Test 8: Sessions accumulate ===\n');
  {
    const page = await browser.newPage();
    instrumentPage(page);

    await page.goto(`${BASE}/felix/english/`, { waitUntil: 'networkidle2', timeout: 15000 });

    const result = await page.evaluate(async () => {
      try {
        const DB = await import('/shared/db.js');
        const GAM = await import('/shared/gamification.js');

        const before = await DB.getProfile();
        const beforeXP = before.xp || 0;
        const beforeSessions = await DB.countSessions();

        await GAM.endSessionFlow({ app: 'english', correct: 3, total: 5, timeSec: 45 });

        const after = await DB.getProfile();
        const afterSessions = await DB.countSessions();

        return { beforeXP, afterXP: after.xp, beforeSessions, afterSessions, error: null };
      } catch (e) { return { error: e.message }; }
    });

    if (result.error) { console.log(`  ERROR: ${result.error}`); failed++; }
    else {
      assert(result.afterXP > result.beforeXP, `XP increased (${result.beforeXP} → ${result.afterXP})`);
      assert(result.afterSessions === result.beforeSessions + 1,
        `Session count +1 (${result.beforeSessions} → ${result.afterSessions})`);
    }

    await page.close();
  }

  // ==========================================================================
  // Test 9: Portal page displays XP after session
  // ==========================================================================
  console.log('\n=== Test 9: Portal displays XP after session ===\n');
  {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    const errs = instrumentPage(page);

    // Complete a session on the game page
    await page.goto(`${BASE}/felix/english/`, { waitUntil: 'networkidle2', timeout: 15000 });

    const sessionResult = await page.evaluate(async () => {
      try {
        const GAM = await import('/shared/gamification.js');
        const result = await GAM.endSessionFlow({
          app: 'english', correct: 7, total: 10, timeSec: 90,
        });
        return { xp: result.xp, error: null };
      } catch (e) { return { error: e.message }; }
    });

    if (sessionResult.error) { console.log(`  ERROR: ${sessionResult.error}`); failed++; }
    else { assert(sessionResult.xp > 0, `Session earned XP (got ${sessionResult.xp})`); }

    // Navigate to portal (full page load, like a real user clicking back)
    await page.goto(`${BASE}/felix/`, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));

    const portal = await page.evaluate(() => ({
      xpLevel: document.querySelector('#xp-level')?.textContent,
      xpAmount: document.querySelector('#xp-amount')?.textContent,
      barWidth: document.querySelector('#xp-bar-fill')?.style.width,
    }));

    console.log(`  Portal: level="${portal.xpLevel}" xp="${portal.xpAmount}" bar="${portal.barWidth}"`);
    assert(portal.xpAmount && !portal.xpAmount.startsWith('0 /'), `Portal XP not "0" (got "${portal.xpAmount}")`);
    assert(portal.xpLevel !== null, `Portal level rendered (got "${portal.xpLevel}")`);
    assert(portal.barWidth && portal.barWidth !== '0%', `XP bar has progress (got "${portal.barWidth}")`);
    assert(errs.length === 0, `No JS errors (got ${errs.length})`);

    await page.close();
    await ctx.close();
  }

  // ==========================================================================
  // Test 10: Portal XP updates on visibilitychange (tab switch)
  // ==========================================================================
  console.log('\n=== Test 10: Portal XP updates on visibility change ===\n');
  {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    const errs = instrumentPage(page);

    // Load portal first (XP should be 0)
    await page.goto(`${BASE}/felix/`, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 500));

    const before = await page.evaluate(() =>
      document.querySelector('#xp-amount')?.textContent
    );
    console.log(`  Portal before session: "${before}"`);

    // Simulate earning XP directly in IndexedDB (as if a game in another tab did it)
    await page.evaluate(async () => {
      const DB = await import('/shared/db.js');
      const profile = await DB.getProfile();
      profile.xp = (profile.xp || 0) + 200;
      await DB.saveProfile(profile);
    });

    // Simulate tab becoming visible again (triggers visibilitychange)
    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await new Promise((r) => setTimeout(r, 1000));

    const after = await page.evaluate(() =>
      document.querySelector('#xp-amount')?.textContent
    );
    console.log(`  Portal after visibility change: "${after}"`);
    assert(after !== before, `Portal XP updated after visibilitychange ("${before}" → "${after}")`);
    assert(errs.length === 0, `No JS errors (got ${errs.length})`);

    await page.close();
    await ctx.close();
  }

  // ==========================================================================
  // Summary
  // ==========================================================================
  await browser.close();
  server.close();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  console.log('All gamification tests passed!');
}

main().catch((e) => {
  console.error('Test crashed:', e);
  process.exit(2);
});
