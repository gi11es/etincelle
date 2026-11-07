/**
 * Visual workshops rendered with WebGL (one fragment shader each):
 *  - graphe  : judge whether points show proportionality, then fit y = k × x with a slider
 *  - melange : mix two paints in the same ratio, the colour shows whether the ratio is kept
 *  - course  : compare speeds given in different units, then watch the race
 *
 * Each workshop is started with run(container, api) and returns a cleanup function.
 * api = { progress(i, n), score(correct), done(correct, total) }
 */
import { ShaderCanvas } from './shader-canvas.js';
import { pick, shuffle, fmt } from './questions.js';

const FALLBACK = '<div class="gl-fallback">L\'animation WebGL n\'est pas disponible sur cet appareil. Tu peux quand même répondre.</div>';

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function feedback(container, ok, html) {
  const box = container.querySelector('.atelier-feedback');
  box.className = `atelier-feedback ${ok ? 'ok' : 'ko'}`;
  box.innerHTML = `<strong>${ok ? '✓ Bravo !' : '✗ Pas tout à fait.'}</strong> ${html}`;
}

function nextButton(container, label, onClick) {
  const zone = container.querySelector('.atelier-actions');
  zone.innerHTML = '';
  const b = el(`<button class="btn-next">${label}</button>`);
  b.addEventListener('click', onClick);
  zone.appendChild(b);
}

// ─── 1. Graphe ─────────────────────────────────────────────────────────────

const GRAPH_FRAG = `
uniform vec2 u_res; uniform float u_time; uniform float u_dpr;
uniform vec4 u_plot; uniform vec2 u_dom; uniform vec2 u_step;
uniform vec2 u_pts[8]; uniform float u_n; uniform float u_appear;
uniform vec4 u_line; uniform vec3 u_lineColor; uniform float u_origin;

vec2 toPx(vec2 d) { return u_plot.xy + d / u_dom * (u_plot.zw - u_plot.xy); }
float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 uv = p / u_res;
  vec3 col = vec3(0.07, 0.07, 0.16) + 0.05 * vec3(0.42, 0.39, 1.0) * (1.0 - length(uv - 0.5));
  float inside = step(u_plot.x, p.x) * step(p.x, u_plot.z) * step(u_plot.y, p.y) * step(p.y, u_plot.w);
  vec2 pxPer = (u_plot.zw - u_plot.xy) / u_dom;
  vec2 d = (p - u_plot.xy) / pxPer;
  vec2 g = abs(fract(d / u_step + 0.5) - 0.5) * u_step * pxPer;
  col = mix(col, vec3(1.0), 0.08 * inside * (1.0 - smoothstep(0.0, u_dpr, min(g.x, g.y))));
  float ax = min(
    abs(p.x - u_plot.x) + max(0.0, max(u_plot.y - p.y, p.y - u_plot.w)),
    abs(p.y - u_plot.y) + max(0.0, max(u_plot.x - p.x, p.x - u_plot.z)));
  col = mix(col, vec3(0.75, 0.75, 0.88), 1.0 - smoothstep(0.6 * u_dpr, 1.6 * u_dpr, ax));
  if (u_line.z > 0.0) {
    float xEnd = u_dom.x * u_line.w;
    vec2 a = toPx(vec2(0.0, u_line.y));
    vec2 b = toPx(vec2(xEnd, u_line.x * xEnd + u_line.y));
    float dl = segDist(p, a, b);
    float m = 1.0 - smoothstep(1.2 * u_dpr, 2.6 * u_dpr, dl);
    float glow = exp(-dl / (7.0 * u_dpr)) * 0.4;
    col = mix(col, u_lineColor, clamp(m + glow, 0.0, 1.0) * u_line.z * inside);
  }
  float od = length(p - u_plot.xy);
  vec3 oc = u_origin > 0.0 ? vec3(0.2, 1.0, 0.6) : vec3(1.0, 0.35, 0.35);
  col += oc * exp(-od / (9.0 * u_dpr)) * 0.8 * abs(u_origin) * (0.7 + 0.3 * sin(u_time * 5.0));
  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_n) break;
    float t = clamp((u_appear - float(i) * 0.12) * 4.0, 0.0, 1.0);
    float s = t * (1.0 + 0.35 * sin(t * 3.14159));
    vec2 c = toPx(u_pts[i]);
    float dd = length(p - c);
    float r = 6.0 * u_dpr * s;
    float pulse = 0.5 + 0.5 * sin(u_time * 3.0 + float(i));
    col += vec3(1.0, 0.6, 0.2) * exp(-dd / (9.0 * u_dpr)) * 0.45 * t * (0.6 + 0.4 * pulse);
    col = mix(col, vec3(1.0, 0.8, 0.35), 1.0 - smoothstep(r - u_dpr, r, dd));
  }
  gl_FragColor = vec4(col, 1.0);
}`;

const PLOT = { left: 46, right: 18, top: 16, bottom: 34 };

function niceMax(v) {
  return [5, 10, 20, 25, 40, 50, 60, 80, 100].find(s => s >= v) || Math.ceil(v / 50) * 50;
}

function graphRound(kind) {
  const xs = shuffle([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 5).sort((a, b) => a - b);
  if (kind === 'fit') {
    const k = pick([0.5, 1.5, 2, 2.5, 3, 4]);
    return { kind, k, b: 0, pts: xs.map(x => [x, k * x]), ymax: niceMax(k * 10) };
  }
  const type = pick(['prop', 'affine', 'courbe']);
  if (type === 'prop') {
    const k = pick([1.5, 2, 3, 4]);
    return { kind, type, k, b: 0, pts: xs.map(x => [x, k * x]), ymax: niceMax(k * 10) };
  }
  if (type === 'affine') {
    const k = pick([1.5, 2, 3]);
    const b = pick([4, 6, 8, 10]);
    return { kind, type, k, b, pts: xs.map(x => [x, k * x + b]), ymax: niceMax(k * 10 + b) };
  }
  return { kind, type, pts: xs.map(x => [x, 0.5 * x * x]), ymax: niceMax(32) };
}

function runGraphe(container, api) {
  const ROUNDS = 8;
  let i = 0;
  let correct = 0;
  container.innerHTML = `
    <p class="atelier-prompt"></p>
    <div class="gl-wrap"><canvas class="gl-canvas"></canvas><div class="gl-labels"></div></div>
    <div class="atelier-controls"></div>
    <div class="atelier-feedback"></div>
    <div class="atelier-actions"></div>`;
  const canvas = container.querySelector('canvas');
  const labels = container.querySelector('.gl-labels');
  const sc = new ShaderCanvas(canvas, GRAPH_FRAG);
  if (!sc.ok) container.querySelector('.gl-wrap').insertAdjacentHTML('beforeend', FALLBACK);
  let round = null;
  let appearStart = 0;
  let lineAnim = null; // { from, start }
  let line = [0, 0, 0, 0]; // k, b, alpha, progress

  sc.onFrame = (t) => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const dpr = sc.dpr;
    sc.set('u_plot', '4f', [PLOT.left * dpr, PLOT.bottom * dpr, (w - PLOT.right) * dpr, (h - PLOT.top) * dpr]);
    if (!appearStart) appearStart = t;
    sc.set('u_appear', '1f', t - appearStart);
    if (lineAnim) {
      if (!lineAnim.start) lineAnim.start = t;
      line[3] = Math.min(1, (t - lineAnim.start) / 1.2);
    }
    sc.set('u_line', '4f', line);
  };

  function layoutLabels() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const pw = w - PLOT.left - PLOT.right;
    const ph = h - PLOT.top - PLOT.bottom;
    let html = '';
    for (let x = 0; x <= 10; x += 2) html += `<span style="left:${PLOT.left + (x / 10) * pw}px;top:${h - PLOT.bottom + 6}px;transform:translateX(-50%)">${x}</span>`;
    for (let k = 0; k <= 5; k++) {
      const v = (round.ymax / 5) * k;
      html += `<span style="left:${PLOT.left - 6}px;top:${h - PLOT.bottom - (k / 5) * ph}px;transform:translate(-100%,-50%)">${fmt(v)}</span>`;
    }
    labels.innerHTML = html;
  }

  function show() {
    round = graphRound(i % 2 === 0 ? 'judge' : 'fit');
    api.progress(i, ROUNDS);
    appearStart = 0;
    lineAnim = null;
    line = [0, 0, 0, 0];
    const pts = new Float32Array(16);
    round.pts.forEach(([x, y], j) => { pts[2 * j] = x; pts[2 * j + 1] = y; });
    sc.set('u_pts[0]', '2fv', pts);
    sc.set('u_n', '1f', round.pts.length);
    sc.set('u_dom', '2f', [10, round.ymax]);
    sc.set('u_step', '2f', [1, round.ymax / 5]);
    sc.set('u_origin', '1f', 0);
    sc.set('u_lineColor', '3f', [0.42, 0.39, 1.0]);
    layoutLabels();
    const fb = container.querySelector('.atelier-feedback');
    fb.className = 'atelier-feedback';
    fb.innerHTML = '';
    container.querySelector('.atelier-actions').innerHTML = '';
    const prompt = container.querySelector('.atelier-prompt');
    const controls = container.querySelector('.atelier-controls');
    if (round.kind === 'judge') {
      prompt.innerHTML = 'Ces points représentent-ils une situation de <strong>proportionnalité</strong> ?';
      controls.innerHTML = `
        <button class="atelier-choice" data-v="1">Oui, proportionnel</button>
        <button class="atelier-choice" data-v="0">Non, pas proportionnel</button>`;
      controls.querySelectorAll('button').forEach(b => b.addEventListener('click', () => answerJudge(b.dataset.v === '1')));
    } else {
      prompt.innerHTML = 'Ces points sont proportionnels. Règle le coefficient k pour que la droite <strong>y = k × x</strong> passe par tous les points.';
      controls.innerHTML = `
        <div class="k-slider">
          <label>k = <strong class="k-value">1</strong></label>
          <input type="range" min="0" max="5" step="0.1" value="1">
        </div>
        <button class="btn-submit">Valider</button>`;
      const input = controls.querySelector('input');
      const out = controls.querySelector('.k-value');
      const update = () => {
        const k = parseFloat(input.value);
        out.textContent = fmt(k, 1);
        line = [k, 0, 1, 1];
      };
      input.addEventListener('input', update);
      update();
      controls.querySelector('.btn-submit').addEventListener('click', () => answerFit(parseFloat(input.value)));
    }
  }

  function answerJudge(saidYes) {
    const isProp = round.type === 'prop';
    const ok = saidYes === isProp;
    container.querySelectorAll('.atelier-choice').forEach(b => { b.disabled = true; });
    if (round.type !== 'courbe') {
      line = [round.k, round.b, 1, 0];
      lineAnim = { start: 0 };
      sc.set('u_lineColor', '3f', isProp ? [0.2, 0.95, 0.6] : [1.0, 0.45, 0.45]);
    }
    sc.set('u_origin', '1f', isProp ? 1 : -1);
    const why = round.type === 'prop'
      ? `Les points sont alignés avec l'origine : y = ${fmt(round.k)} × x.`
      : round.type === 'affine'
        ? `Les points sont alignés, mais la droite coupe l'axe vertical en ${round.b}, pas en 0 : y = ${fmt(round.k)} × x + ${round.b}.`
        : 'Les points forment une courbe : ils ne sont pas alignés.';
    finish(ok, why);
  }

  function answerFit(k) {
    const ok = Math.abs(k - round.k) < 0.051;
    container.querySelector('.atelier-controls').querySelectorAll('input,button').forEach(b => { b.disabled = true; });
    line = [round.k, 0, 1, 1];
    sc.set('u_lineColor', '3f', ok ? [0.2, 0.95, 0.6] : [1.0, 0.75, 0.3]);
    const [x, y] = round.pts[0];
    finish(ok, `Le coefficient est k = y ÷ x = ${fmt(y)} ÷ ${x} = ${fmt(round.k)}. ${ok ? '' : `Tu avais choisi ${fmt(k, 1)}.`}`);
  }

  function finish(ok, html) {
    if (ok) correct++;
    api.score(ok);
    feedback(container, ok, html);
    i++;
    nextButton(container, i < ROUNDS ? 'Suivant' : 'Terminer', () => (i < ROUNDS ? show() : api.done(correct, ROUNDS)));
  }

  show();
  sc.start();
  const onResize = () => round && layoutLabels();
  window.addEventListener('resize', onResize);
  return () => { sc.stop(); window.removeEventListener('resize', onResize); };
}

// ─── 2. Mélange de couleurs ────────────────────────────────────────────────

const MIX_FRAG = `
uniform vec2 u_res; uniform float u_time; uniform float u_dpr;
uniform vec3 u_colA; uniform float u_fillA;
uniform vec3 u_colB; uniform float u_fillB;
uniform float u_glow;

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
vec3 beaker(vec2 p, vec2 c, vec2 hs, vec3 liquid, float fill, vec3 col, float glow) {
  vec2 q = p - c;
  float d = sdRoundBox(q, hs, 14.0 * u_dpr);
  float bottom = c.y - hs.y;
  float level = bottom + fill * 2.0 * hs.y * 0.92
    + sin(q.x * 0.045 / u_dpr + u_time * 2.2) * 2.5 * u_dpr * step(0.001, fill);
  float inLiquid = step(d, -3.0 * u_dpr) * step(p.y, level) * step(0.001, fill);
  vec3 lc = liquid * (0.85 + 0.15 * smoothstep(-hs.x, hs.x, q.x));
  float bub = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 bp = vec2(c.x + (fract(sin(fi * 12.9) * 43758.5) - 0.5) * hs.x * 1.4,
                   bottom + mod(u_time * (20.0 + fi * 6.0) * u_dpr + fi * 40.0 * u_dpr, max(level - bottom, 1.0)));
    bub += 1.0 - smoothstep(2.0 * u_dpr, 3.2 * u_dpr, length(p - bp));
  }
  lc += 0.25 * bub;
  col = mix(col, lc, inLiquid);
  float rim = 1.0 - smoothstep(1.0 * u_dpr, 2.5 * u_dpr, abs(d));
  col = mix(col, vec3(0.85, 0.9, 1.0), rim * 0.8);
  float shine = step(d, 0.0) * smoothstep(8.0 * u_dpr, 0.0, abs(q.x + hs.x * 0.6)) * 0.12;
  col += shine;
  col += vec3(0.3, 1.0, 0.6) * exp(-max(d, 0.0) / (10.0 * u_dpr)) * 0.35 * glow * step(0.0, d);
  return col;
}
void main() {
  vec2 p = gl_FragCoord.xy;
  vec3 col = vec3(0.07, 0.07, 0.16) + 0.04 * (1.0 - length(p / u_res - 0.5));
  vec2 hs = vec2(u_res.x * 0.16, u_res.y * 0.33);
  col = beaker(p, vec2(u_res.x * 0.27, u_res.y * 0.4), hs, u_colA, u_fillA, col, u_glow);
  col = beaker(p, vec2(u_res.x * 0.73, u_res.y * 0.4), hs, u_colB, u_fillB, col, u_glow);
  gl_FragColor = vec4(col, 1.0);
}`;

const PAINTS = [
  { a: 'bleu', b: 'jaune', res: 'vert', ca: [0.12, 0.38, 0.98], cb: [1.0, 0.88, 0.12] },
  { a: 'rouge', b: 'blanc', res: 'rose', ca: [0.9, 0.08, 0.2], cb: [1.0, 1.0, 1.0] },
  { a: 'rouge', b: 'jaune', res: 'orange', ca: [0.92, 0.1, 0.12], cb: [1.0, 0.9, 0.1] },
];

/** Subtractive-looking mix: weighted geometric mean of the two pigments. */
function mixColor(ca, cb, x, y) {
  if (x + y === 0) return [0, 0, 0];
  const w = x / (x + y);
  return ca.map((c, k) => Math.pow(Math.max(c, 0.02), w) * Math.pow(Math.max(cb[k], 0.02), 1 - w));
}

function runMelange(container, api) {
  const ROUNDS = 6;
  const MAXL = 32;
  let i = 0;
  let correct = 0;
  container.innerHTML = `
    <p class="atelier-prompt"></p>
    <div class="gl-wrap gl-wrap--mix"><canvas class="gl-canvas"></canvas>
      <div class="mix-label mix-label--a"></div><div class="mix-label mix-label--b"></div></div>
    <div class="atelier-controls"></div>
    <div class="atelier-feedback"></div>
    <div class="atelier-actions"></div>`;
  const canvas = container.querySelector('canvas');
  const sc = new ShaderCanvas(canvas, MIX_FRAG);
  if (!sc.ok) container.querySelector('.gl-wrap').insertAdjacentHTML('beforeend', FALLBACK);
  let r = null;
  let user = [0, 0];

  function render() {
    const { paint, a, b } = r;
    sc.set('u_colA', '3f', mixColor(paint.ca, paint.cb, a, b));
    sc.set('u_fillA', '1f', (a + b) / 10);
    sc.set('u_colB', '3f', mixColor(paint.ca, paint.cb, user[0], user[1]));
    sc.set('u_fillB', '1f', Math.min(1, (user[0] + user[1]) / MAXL));
    container.querySelector('.mix-label--a').innerHTML = `Recette<br><strong>${a} L ${paint.a} + ${b} L ${paint.b}</strong>`;
    container.querySelector('.mix-label--b').innerHTML = `Ton mélange<br><strong>${user[0]} L ${paint.a} + ${user[1]} L ${paint.b}</strong>`;
    container.querySelectorAll('.stepper-value').forEach((s, k) => { s.textContent = user[k]; });
  }

  function stepper(k, label, locked) {
    return `<div class="stepper ${locked ? 'locked' : ''}">
      <span class="stepper-label">${label}</span>
      <button class="stepper-btn" data-k="${k}" data-d="-1" ${locked ? 'disabled' : ''}>−</button>
      <span class="stepper-value">0</span>
      <button class="stepper-btn" data-k="${k}" data-d="1" ${locked ? 'disabled' : ''}>+</button>
      <span class="stepper-unit">L</span></div>`;
  }

  function show() {
    api.progress(i, ROUNDS);
    const paint = pick(PAINTS);
    const [a, b] = pick([[2, 3], [1, 2], [3, 2], [1, 3], [3, 4], [2, 5], [3, 1]]);
    const m = pick([2, 3, 4]);
    const mode = i % 2 === 0 ? 'fixed' : 'total';
    r = { paint, a, b, m, mode };
    user = mode === 'fixed' ? [a * m, 0] : [0, 0];
    sc.set('u_glow', '1f', 0);
    container.querySelector('.atelier-prompt').innerHTML = mode === 'fixed'
      ? `Pour ce ${paint.res}, la recette est ${a} L de ${paint.a} pour ${b} L de ${paint.b}. Tu as versé <strong>${a * m} L de ${paint.a}</strong>. Ajoute du ${paint.b} pour obtenir <strong>exactement le même ${paint.res}</strong>.`
      : `Prépare <strong>${(a + b) * m} L</strong> de ce ${paint.res}, exactement de la même couleur que la recette.`;
    const controls = container.querySelector('.atelier-controls');
    controls.innerHTML = stepper(0, paint.a, mode === 'fixed') + stepper(1, paint.b, false) + '<button class="btn-submit">Valider</button>';
    controls.querySelectorAll('.stepper-btn').forEach(btn => btn.addEventListener('click', () => {
      const k = +btn.dataset.k;
      user[k] = Math.max(0, Math.min(30, user[k] + +btn.dataset.d));
      render();
    }));
    controls.querySelector('.btn-submit').addEventListener('click', answer);
    const fb = container.querySelector('.atelier-feedback');
    fb.className = 'atelier-feedback';
    fb.innerHTML = '';
    container.querySelector('.atelier-actions').innerHTML = '';
    render();
  }

  function answer() {
    const { a, b, m, mode, paint } = r;
    const sameRatio = user[0] * b === user[1] * a && user[0] > 0;
    const ok = sameRatio && (mode === 'fixed' || user[0] + user[1] === (a + b) * m);
    container.querySelectorAll('.atelier-controls button').forEach(x => { x.disabled = true; });
    sc.set('u_glow', '1f', ok ? 1 : 0);
    const expl = mode === 'fixed'
      ? `${a * m} = ${a} × ${m}, donc il faut ${b} × ${m} = <strong>${b * m} L de ${paint.b}</strong>. Le ratio ${a * m} : ${b * m} est égal au ratio ${a} : ${b}.`
      : `${(a + b) * m} L = ${a + b} parts de ${m} L. Il faut ${a} × ${m} = <strong>${a * m} L de ${paint.a}</strong> et ${b} × ${m} = <strong>${b * m} L de ${paint.b}</strong>.`;
    const extra = !ok && sameRatio ? ' Ta couleur est bonne, mais pas la quantité totale.' : '';
    if (ok) correct++;
    api.score(ok);
    feedback(container, ok, expl + extra);
    i++;
    nextButton(container, i < ROUNDS ? 'Suivant' : 'Terminer', () => (i < ROUNDS ? show() : api.done(correct, ROUNDS)));
  }

  show();
  sc.start();
  return () => sc.stop();
}

// ─── 3. Course de vitesse ──────────────────────────────────────────────────

const RACE_FRAG = `
uniform vec2 u_res; uniform float u_time; uniform float u_dpr;
uniform vec3 u_pos; uniform float u_run;
uniform vec3 u_c0; uniform vec3 u_c1; uniform vec3 u_c2;

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 uv = p / u_res;
  vec3 col = vec3(0.06, 0.06, 0.14);
  float laneH = 1.0 / 3.0;
  float lane = floor(uv.y / laneH);
  float ly = fract(uv.y / laneH);
  col = mix(col, vec3(0.13, 0.12, 0.25), step(0.12, ly) * step(ly, 0.88));
  float sep = 1.0 - smoothstep(0.0, 1.5 * u_dpr, abs(fract(uv.y / laneH + 0.5) - 0.5) * laneH * u_res.y);
  col = mix(col, vec3(0.9), sep * 0.25 * step(0.5, mod(p.x / (14.0 * u_dpr) + u_time * u_run * 6.0, 2.0)));
  float x0 = 0.08, x1 = 0.92;
  col = mix(col, vec3(0.5, 0.9, 0.6), (1.0 - smoothstep(0.0, 2.0 * u_dpr, abs(p.x - x0 * u_res.x))) * 0.6);
  vec2 chk = floor(p / (6.0 * u_dpr));
  float checker = mod(chk.x + chk.y, 2.0);
  float fin = step(abs(p.x - x1 * u_res.x), 6.0 * u_dpr);
  col = mix(col, vec3(checker), fin * 0.85);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float pos = i == 0 ? u_pos.x : (i == 1 ? u_pos.y : u_pos.z);
    vec3 c = i == 0 ? u_c0 : (i == 1 ? u_c1 : u_c2);
    float cx = (x0 + (x1 - x0) * pos) * u_res.x;
    float cy = (2.5 - fi) * laneH * u_res.y; // racer A in the top lane
    float dy = abs(p.y - cy);
    float trail = step(x0 * u_res.x, p.x) * step(p.x, cx) * exp(-(cx - p.x) / (60.0 * u_dpr)) * (1.0 - smoothstep(2.0 * u_dpr, 7.0 * u_dpr, dy));
    col += c * trail * 0.7;
    float dd = length(p - vec2(cx, cy));
    col += c * exp(-dd / (10.0 * u_dpr)) * 0.6;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

const RACERS = [
  { name: 'A', emoji: '🚗', color: [0.3, 0.7, 1.0] },
  { name: 'B', emoji: '🏍️', color: [1.0, 0.45, 0.6] },
  { name: 'C', emoji: '🚲', color: [0.4, 1.0, 0.55] },
];

/** Describe a speed given in km/h in one of four forms. */
function speedForm(v, form) {
  const ms = v / 3.6;
  if (form === 'kmh') return { text: `${v} km/h`, how: `${v} km/h` };
  if (form === 'ms') return { text: `${fmt(ms)} m/s`, how: `${fmt(ms)} m/s × 3,6 = ${v} km/h` };
  if (form === 'kmmin') {
    const t = [2, 5, 10, 20].find(t => Number.isInteger((v * t) / 60));
    const d = (v * t) / 60;
    return { text: `${d} km en ${t} min`, how: `${d} km en ${t} min → ${d} × 60 ÷ ${t} = ${v} km/h` };
  }
  const s = [2, 4, 5, 10].find(s => Number.isInteger(ms * s));
  return { text: `${fmt(ms * s)} m en ${s} s`, how: `${fmt(ms * s)} m en ${s} s → ${fmt(ms)} m/s → × 3,6 = ${v} km/h` };
}

function runCourse(container, api) {
  const ROUNDS = 6;
  let i = 0;
  let correct = 0;
  container.innerHTML = `
    <p class="atelier-prompt"></p>
    <div class="gl-wrap gl-wrap--race"><canvas class="gl-canvas"></canvas><div class="race-layer"></div></div>
    <div class="atelier-controls"></div>
    <div class="atelier-feedback"></div>
    <div class="atelier-actions"></div>`;
  const canvas = container.querySelector('canvas');
  const layer = container.querySelector('.race-layer');
  const sc = new ShaderCanvas(canvas, RACE_FRAG);
  if (!sc.ok) container.querySelector('.gl-wrap').insertAdjacentHTML('beforeend', FALLBACK);
  RACERS.forEach((rc, k) => sc.set(`u_c${k}`, '3f', rc.color));
  let r = null;
  let pos = [0, 0, 0];
  let race = null; // { start }

  sc.onFrame = (t) => {
    if (race) {
      if (!race.start) race.start = t;
      const el = t - race.start;
      const vmax = Math.max(...r.speeds);
      pos = r.speeds.map(v => Math.min(1, (el / 3) * (v / vmax)));
    }
    sc.set('u_pos', '3f', pos);
    sc.set('u_run', '1f', race ? 1 : 0);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    layer.querySelectorAll('.racer').forEach((node, k) => {
      const x = (0.08 + 0.84 * pos[k]) * w;
      const y = ((k + 0.5) / 3) * h;
      node.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scaleX(-1)`;
    });
  };

  function show() {
    api.progress(i, ROUNDS);
    const speeds = shuffle([36, 54, 72, 90, 108]).slice(0, 3);
    const forms = shuffle(['kmh', 'ms', 'kmmin', 'mtime']).slice(0, 3);
    const askFirst = i % 3 !== 2;
    r = { speeds, forms: speeds.map((v, k) => speedForm(v, forms[k])), askFirst };
    pos = [0, 0, 0];
    race = null;
    layer.innerHTML = RACERS.map(rc => `<span class="racer">${rc.emoji}</span>`).join('');
    container.querySelector('.atelier-prompt').innerHTML =
      `Trois véhicules roulent à vitesse constante. Lequel arrivera <strong>${askFirst ? 'en premier' : 'en dernier'}</strong> ?`;
    const controls = container.querySelector('.atelier-controls');
    controls.innerHTML = RACERS.map((rc, k) => `
      <button class="atelier-choice race-choice" data-k="${k}">
        <span class="race-dot" style="background:rgb(${rc.color.map(c => Math.round(c * 255)).join(',')})"></span>
        ${rc.emoji} ${rc.name} : ${r.forms[k].text}
      </button>`).join('');
    controls.querySelectorAll('button').forEach(b => b.addEventListener('click', () => answer(+b.dataset.k)));
    const fb = container.querySelector('.atelier-feedback');
    fb.className = 'atelier-feedback';
    fb.innerHTML = '';
    container.querySelector('.atelier-actions').innerHTML = '';
  }

  function answer(k) {
    const target = r.askFirst ? Math.max(...r.speeds) : Math.min(...r.speeds);
    const good = r.speeds.indexOf(target);
    const ok = k === good;
    container.querySelectorAll('.race-choice').forEach((b, j) => {
      b.disabled = true;
      if (j === good) b.classList.add('correct');
      else if (j === k) b.classList.add('wrong');
    });
    race = { start: 0 };
    if (ok) correct++;
    api.score(ok);
    const lines = RACERS.map((rc, j) => `${rc.emoji} ${r.forms[j].how}`).join('<br>');
    feedback(container, ok, `On convertit tout en km/h :<br>${lines}`);
    i++;
    setTimeout(() => nextButton(container, i < ROUNDS ? 'Suivant' : 'Terminer', () => (i < ROUNDS ? show() : api.done(correct, ROUNDS))), 600);
  }

  show();
  sc.start();
  return () => sc.stop();
}

export const ATELIERS = [
  { id: 'graphe', icon: '📈', title: 'Proportionnel ou pas ?', desc: 'Graphiques : points alignés avec l\'origine, coefficient k', run: runGraphe },
  { id: 'melange', icon: '🎨', title: 'Le labo des couleurs', desc: 'Ratios : même couleur = même ratio', run: runMelange },
  { id: 'course', icon: '🏁', title: 'La course des vitesses', desc: 'km/h, m/s, km en min : qui gagne ?', run: runCourse },
];
