#!/usr/bin/env node
/** Zoé Dessine: rounds alternate capital and cursive letters, and the cursive recogniser accepts the right letter. */
import { setup, wait } from "./smoke-harness.mjs";
const { browser, base, done } = await setup();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));
await page.evaluateOnNewDocument(() => { speechSynthesis.speak = (u) => setTimeout(() => u.onend && u.onend(), 5); });
await page.goto(`${base}/zoe/app.html#draw`, { waitUntil: "networkidle2" });
for (let i = 0; i < 60 && !(await page.evaluate(() => !!window.emnistSession)); i++) await wait(500);
await wait(1000);

// Draw a letter on the canvas the way a child traces the guide
const drawLetter = (letter) => page.evaluate((letter) => {
  const c = document.getElementById("draw-canvas"), ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  const cursive = letter !== letter.toUpperCase();
  ctx.font = cursive ? "bold 200px \"Dancing Script\"" : "bold 200px Arial";
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#8b00ff";
  ctx.fillText(letter, 140, 140);
}, letter);

// A tap (no finger movement) must leave a dot: the dot of i and j is often a tap
await page.evaluate(() => clearDrawing());
const box = await (await page.$("#draw-canvas")).boundingBox();
await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
await wait(200);
const tapInk = await page.evaluate(() => {
  const d = document.getElementById("draw-canvas").getContext("2d").getImageData(0, 0, 280, 280).data;
  let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 50) n++;
  return n;
});
console.log("tap ink pixels:", tapInk);
if (tapInk < 50) { console.log("FAIL: a tap leaves no dot"); }

const modes = [], results = [];
let failures = 0;
for (let round = 0; round < 6; round++) {
  const { mode, letter } = await page.evaluate(() => ({ mode: drawMode, letter: drawCurrentLetter }));
  modes.push(mode + ":" + letter);
  // First a wrong letter: it must be rejected
  const wrong = letter.toLowerCase() === "x" ? (mode === "cursive" ? "o" : "O") : (mode === "cursive" ? "x" : "X");
  await drawLetter(wrong);
  await page.evaluate(() => checkDrawing()); await wait(300);
  const rejected = await page.$eval("#draw-next-btn", b => b.classList.contains("hidden"));
  // Then the right letter: it must be accepted
  await drawLetter(letter);
  await page.evaluate(() => checkDrawing()); await wait(300);
  const accepted = !(await page.$eval("#draw-next-btn", b => b.classList.contains("hidden")));
  results.push(`${mode}:${letter} wrong-rejected=${rejected} right-accepted=${accepted}`);
  if (!rejected || !accepted) failures++;
  await page.evaluate(() => nextDrawRound()); await wait(300);
}
const keys = await page.evaluate(async () => [
  ...Object.keys(await dbReadAllByIndex("mastery", "game", "draw")),
  ...Object.keys(await dbReadAllByIndex("mastery", "game", "drawcursive"))]);
const alternates = modes.every((m, i) => m.startsWith(i % 2 === 0 ? "upper" : "cursive"));
console.log(results.join("\n"));
console.log("alternates:", alternates, "| mastery keys:", keys.join(" "));
console.log("page errors:", errors.length ? errors : "none");
const pass = tapInk >= 50 && failures === 0 && alternates && keys.some(k => k.startsWith("drawcursive:")) && errors.length === 0;
console.log(pass ? "PASS" : "FAIL");
await page.close(); await done();
process.exit(pass ? 0 : 1);
