#!/usr/bin/env node
/** Zoé Anglais: a level-up during play adds the new words to the questions, and one mistake does not undo it. */
import { setup, wait } from "./smoke-harness.mjs";
const { browser, base, done } = await setup();
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => { speechSynthesis.speak = (u) => setTimeout(() => u.onend && u.onend(), 5); });
await page.goto(`${base}/zoe/app.html#english`, { waitUntil: "networkidle2" });
await wait(1500);
const lvl1 = await page.evaluate(() => ENGLISH_WORDS.filter(w => w.level === 1).map(w => w.en));
const lvl2 = await page.evaluate(() => ENGLISH_WORDS.filter(w => w.level === 2).map(w => w.en));
// Master 7 level-1 words (2 correct each): not enough to unlock (needs 8 of 25)
for (const w of lvl1.slice(0, 7)) for (let i = 0; i < 2; i++) await page.evaluate(w => recordAttempt("english", w, true), w);
const t7 = await page.evaluate(() => _gameProgress.english.currentTier);
for (let i = 0; i < 2; i++) await page.evaluate(w => recordAttempt("english", w, true), lvl1[7]);
const t8 = await page.evaluate(() => _gameProgress.english.currentTier);
// One mistake just after the level-up must not move her back down
await page.evaluate(w => recordAttempt("english", w, false), lvl1[8]);
const tWrong = await page.evaluate(() => _gameProgress.english.currentTier);
const targets = [], choiceCounts = new Set();
for (let i = 0; i < 40; i++) {
  targets.push(await page.evaluate(() => englishCurrentWord.en));
  choiceCounts.add(await page.$$eval(".english-choice-btn", b => b.length));
  await page.evaluate(() => nextEnglishRound()); await wait(100);
}
const asked2 = targets.filter(t => lvl2.includes(t));
console.log("tier after 7:", t7, "after 8:", t8, "after mistake:", tWrong);
console.log("level-2 questions in 40 rounds:", asked2.length, "| choices:", [...choiceCounts]);
console.log(t7 === 1 && t8 === 2 && tWrong === 2 && asked2.length >= 5 ? "PASS" : "FAIL");
await page.close(); await done();
