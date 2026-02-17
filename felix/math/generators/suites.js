/**
 * Suites (1ere).
 */
import { randInt, randNonZero, randChoice, mcq, mcqStrings, distractors, frac, simplify, signedStr } from './helpers.js';
import { register } from './registry.js';

// ---------------------------------------------------------------------------
// suite-mcq-nature : u_n = an + b, est-ce arithmétique ?
// ---------------------------------------------------------------------------
register('suite-mcq-nature', (item) => {
  const a = randNonZero(5);
  const b = randInt(-5, 5);
  const correct = 'Arithmétique de raison ' + a;
  const wrongs = [
    'Géométrique de raison ' + a,
    'Ni arithmétique ni géométrique',
    'Arithmétique de raison ' + b
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `La suite (uₙ) définie par uₙ = ${a}n ${b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`} est :`,
    answer,
    choices,
    hint: 'Calculer uₙ₊₁ − uₙ.',
    explanation:
      `uₙ₊₁ − uₙ = ${a}(n+1) ${b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`} − (${a}n ${b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`}) = ${a}.\n` +
      `La différence est constante : c'est une suite arithmétique de raison ${a}.`
  };
});

// ---------------------------------------------------------------------------
// suite-solve-term : terme d'une suite arithmétique
// ---------------------------------------------------------------------------
register('suite-solve-term', (item) => {
  const u0 = randInt(-10, 10);
  const r = randNonZero(5);
  const n = randInt(5, 15);
  const un = u0 + n * r;
  return {
    question: `Suite arithmétique : u₀ = ${u0}, raison r = ${r}. Calculer u${n < 10 ? '₀' : ''}${String(n).replace(/0/g, '₀').replace(/1/g, '₁').replace(/2/g, '₂').replace(/3/g, '₃').replace(/4/g, '₄').replace(/5/g, '₅').replace(/6/g, '₆').replace(/7/g, '₇').replace(/8/g, '₈').replace(/9/g, '₉')}.`,
    answer: String(un),
    hint: 'uₙ = u₀ + n × r.',
    explanation:
      `uₙ = u₀ + n × r = ${u0} + ${n} × ${r} = ${u0} + ${n * r} = ${un}.`
  };
});

// ---------------------------------------------------------------------------
// suite-mcq-geo : v_n = a × q^n, est-ce géométrique ?
// ---------------------------------------------------------------------------
register('suite-mcq-geo', (item) => {
  const a = randNonZero(3);
  const q = randChoice([2, 3, -2, -1]);
  const correct = `Géométrique de raison ${q}`;
  const wrongs = [
    `Arithmétique de raison ${q}`,
    `Géométrique de raison ${a}`,
    'Ni arithmétique ni géométrique'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `La suite (vₙ) définie par vₙ = ${a} × (${q})ⁿ est :`,
    answer,
    choices,
    hint: 'Calculer vₙ₊₁ / vₙ.',
    explanation:
      `vₙ₊₁ / vₙ = [${a} × (${q})ⁿ⁺¹] / [${a} × (${q})ⁿ] = ${q}.\n` +
      `Le rapport est constant : c'est une suite géométrique de raison ${q}.`
  };
});

// ---------------------------------------------------------------------------
// suite-solve-geo-term : calculer un terme d'une suite géométrique
// ---------------------------------------------------------------------------
register('suite-solve-geo-term', (item) => {
  const v0 = randChoice([1, 2, 3, -1, -2]);
  const q = randChoice([2, 3, -2]);
  const n = randInt(2, 5);
  const vn = v0 * Math.pow(q, n);
  return {
    question: `Suite géométrique : v₀ = ${v0}, raison q = ${q}. Calculer v${String(n).replace(/2/g, '₂').replace(/3/g, '₃').replace(/4/g, '₄').replace(/5/g, '₅')}.`,
    answer: String(vn),
    hint: 'vₙ = v₀ × qⁿ.',
    explanation:
      `vₙ = v₀ × qⁿ = ${v0} × (${q})${String(n).replace(/2/g, '²').replace(/3/g, '³').replace(/4/g, '⁴').replace(/5/g, '⁵')} = ${v0} × ${Math.pow(q, n)} = ${vn}.`
  };
});

// ---------------------------------------------------------------------------
// suite-mcq-sum-arith : somme des n premiers termes d'une suite arithmétique
// ---------------------------------------------------------------------------
register('suite-mcq-sum-arith', (item) => {
  const u0 = randInt(1, 5);
  const r = randInt(1, 4);
  const n = randChoice([10, 20, 50]);
  const un = u0 + n * r;
  const S = (n + 1) * (u0 + un) / 2;
  const correct = S;
  const wrongs = distractors(correct, 3, { spread: Math.max(10, Math.floor(S / 5)) });
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Suite arithmétique : u₀ = ${u0}, r = ${r}. Quelle est la somme S = u₀ + u₁ + … + u${String(n).replace(/1/g, '₁').replace(/2/g, '₂').replace(/0/g, '₀').replace(/5/g, '₅')} ?`,
    answer,
    choices,
    hint: 'S = (nombre de termes) × (premier + dernier) / 2.',
    explanation:
      `Il y a ${n + 1} termes (de u₀ à u${n < 10 ? '₀' : ''}${String(n).replace(/0/g, '₀').replace(/1/g, '₁').replace(/2/g, '₂').replace(/5/g, '₅')}).\n` +
      `u${String(n).replace(/0/g, '₀').replace(/1/g, '₁').replace(/2/g, '₂').replace(/5/g, '₅')} = ${u0} + ${n} × ${r} = ${un}.\n` +
      `S = ${n + 1} × (${u0} + ${un}) / 2 = ${n + 1} × ${u0 + un} / 2 = ${S}.`
  };
});

// ---------------------------------------------------------------------------
// suite-solve-sum-geo : somme d'une suite géométrique
// ---------------------------------------------------------------------------
register('suite-solve-sum-geo', (item) => {
  const v0 = randChoice([1, 2, 3]);
  const q = randChoice([2, 3]);
  const n = randInt(3, 5);
  // S = v0 × (q^(n+1) - 1) / (q - 1)
  const qn1 = Math.pow(q, n + 1);
  const S = v0 * (qn1 - 1) / (q - 1);
  return {
    question: `Suite géométrique : v₀ = ${v0}, q = ${q}. Calculer S = v₀ + v₁ + … + v${String(n).replace(/2/g, '₂').replace(/3/g, '₃').replace(/4/g, '₄').replace(/5/g, '₅')}.`,
    answer: String(S),
    hint: 'S = v₀ × (qⁿ⁺¹ − 1) / (q − 1).',
    explanation:
      `S = ${v0} × (${q}${String(n + 1).replace(/2/g, '²').replace(/3/g, '³').replace(/4/g, '⁴').replace(/5/g, '⁵').replace(/6/g, '⁶')} − 1) / (${q} − 1)\n` +
      `= ${v0} × (${qn1} − 1) / ${q - 1}\n` +
      `= ${v0} × ${qn1 - 1} / ${q - 1} = ${S}.`
  };
});

// ---------------------------------------------------------------------------
// suite-mcq-variation : u_{n+1} = u_n + r, croissante ou décroissante ?
// ---------------------------------------------------------------------------
register('suite-mcq-variation', (item) => {
  const r = randNonZero(6);
  const u0 = randInt(-5, 10);
  const growing = r > 0;
  const correct = growing ? 'Croissante' : 'Décroissante';
  const wrongs = growing
    ? ['Décroissante', 'Constante', 'On ne peut pas savoir']
    : ['Croissante', 'Constante', 'On ne peut pas savoir'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `La suite définie par u₀ = ${u0} et uₙ₊₁ = uₙ ${signedStr(r)} est :`,
    answer,
    choices,
    hint: 'Le signe de la raison détermine le sens de variation.',
    explanation:
      `uₙ₊₁ − uₙ = ${r}.\n` +
      (growing
        ? `La raison ${r} > 0, la suite est croissante.`
        : `La raison ${r} < 0, la suite est décroissante.`)
  };
});

// ---------------------------------------------------------------------------
// suite-solve-find-q : trouver la raison q
// ---------------------------------------------------------------------------
register('suite-solve-find-q', (item) => {
  const q = randChoice([2, 3, -2, -3]);
  const m = randInt(0, 2);
  const n = m + randInt(1, 3);
  const v0 = randChoice([1, 2, -1]);
  const vm = v0 * Math.pow(q, m);
  const vn = v0 * Math.pow(q, n);
  // vn / vm = q^(n-m)
  const diff = n - m;
  const ratio = vn / vm; // = q^diff
  const ans = q; // since q^diff, but we want q itself
  return {
    question: `Suite géométrique : v${String(m).replace(/0/g, '₀').replace(/1/g, '₁').replace(/2/g, '₂')} = ${vm} et v${String(n).replace(/0/g, '₀').replace(/1/g, '₁').replace(/2/g, '₂').replace(/3/g, '₃').replace(/4/g, '₄').replace(/5/g, '₅')} = ${vn}. Trouver la raison q.`,
    answer: String(ans),
    hint: 'vₙ / vₘ = q^(n−m), donc q = (vₙ/vₘ)^(1/(n−m)).',
    explanation:
      `v${String(n).replace(/0/g, '₀').replace(/1/g, '₁').replace(/2/g, '₂').replace(/3/g, '₃').replace(/4/g, '₄').replace(/5/g, '₅')} / v${String(m).replace(/0/g, '₀').replace(/1/g, '₁').replace(/2/g, '₂')} = q${String(diff).replace(/1/g, '¹').replace(/2/g, '²').replace(/3/g, '³')} = ${vn} / ${vm} = ${ratio}.\n` +
      (diff === 1
        ? `q = ${ratio} = ${ans}.`
        : `q${String(diff).replace(/2/g, '²').replace(/3/g, '³')} = ${ratio}, donc q = ${ans}.`)
  };
});
