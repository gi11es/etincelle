/**
 * Priorites operatoires (5eme) - Order of operations generators.
 */
import { randInt, randChoice, mcq, mcqStrings, distractors, shuffle } from './helpers.js';
import { register } from './registry.js';

// ---------------------------------------------------------------------------
// prio-solve-basic : a + b * c - d
// ---------------------------------------------------------------------------
register('prio-solve-basic', (item) => {
  const a = randInt(1, 9);
  const b = randInt(2, 9);
  const c = randInt(2, 9);
  const d = randInt(1, 9);
  const result = a + b * c - d;
  return {
    question: `Calcule : ${a} + ${b} × ${c} − ${d}`,
    answer: String(result),
    hint: 'La multiplication est prioritaire sur l\'addition et la soustraction.',
    explanation:
      `On effectue d'abord la multiplication : ${b} × ${c} = ${b * c}.\n` +
      `Puis de gauche à droite : ${a} + ${b * c} − ${d} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// prio-solve-parens : a * (b + c) - d * e
// ---------------------------------------------------------------------------
register('prio-solve-parens', (item) => {
  const a = randInt(2, 6);
  const b = randInt(1, 9);
  const c = randInt(1, 9);
  const d = randInt(2, 6);
  const e = randInt(1, 9);
  const inner = b + c;
  const result = a * inner - d * e;
  return {
    question: `Calcule : ${a} × (${b} + ${c}) − ${d} × ${e}`,
    answer: String(result),
    hint: 'Commence par les parentheses, puis les multiplications.',
    explanation:
      `Parentheses d'abord : ${b} + ${c} = ${inner}.\n` +
      `Multiplications : ${a} × ${inner} = ${a * inner} et ${d} × ${e} = ${d * e}.\n` +
      `Enfin : ${a * inner} − ${d * e} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// prio-mcq-value : N / (a + b) * c  -> MCQ
// ---------------------------------------------------------------------------
register('prio-mcq-value', (item) => {
  const a = randInt(1, 6);
  const b = randInt(1, 6);
  const sum = a + b;
  // pick N as a multiple of sum for clean division
  const multiplier = randInt(2, 6);
  const N = sum * multiplier;
  const c = randInt(2, 5);
  const correct = (N / sum) * c;
  // distractors: common mistakes
  const wrong1 = N / a + b * c;           // ignoring parentheses
  const wrong2 = N / sum + c;             // adding instead of multiplying
  const wrong3 = (N / sum) * c + 1;       // off-by-one
  const wrongs = distractors(correct, 3);
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Calcule : ${N} ÷ (${a} + ${b}) × ${c}`,
    answer,
    choices,
    hint: 'Commence par la parenthese, puis effectue de gauche a droite.',
    explanation:
      `Parenthese : ${a} + ${b} = ${sum}.\n` +
      `De gauche a droite : ${N} ÷ ${sum} = ${multiplier}, puis ${multiplier} × ${c} = ${correct}.`
  };
});

// ---------------------------------------------------------------------------
// prio-solve-nested : a * [b + (c - d) * e]
// ---------------------------------------------------------------------------
register('prio-solve-nested', (item) => {
  const c = randInt(3, 9);
  const d = randInt(1, c - 1);  // ensure c - d > 0
  const e = randInt(2, 5);
  const b = randInt(1, 9);
  const a = randInt(2, 6);
  const inner = c - d;
  const bracket = b + inner * e;
  const result = a * bracket;
  return {
    question: `Calcule : ${a} × [${b} + (${c} − ${d}) × ${e}]`,
    answer: String(result),
    hint: 'Commence par les parentheses les plus interieures.',
    explanation:
      `Parentheses interieures : ${c} − ${d} = ${inner}.\n` +
      `Dans les crochets : ${inner} × ${e} = ${inner * e}, puis ${b} + ${inner * e} = ${bracket}.\n` +
      `Enfin : ${a} × ${bracket} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// prio-mcq-which : "Quelle expression donne N ?"
// ---------------------------------------------------------------------------
register('prio-mcq-which', (item) => {
  // Build an expression that equals N, and 3 that don't
  const a = randInt(2, 5);
  const b = randInt(1, 6);
  const c = randInt(2, 5);
  const N = (a + b) * c;

  const correctExpr = `(${a} + ${b}) × ${c}`;
  // Wrong expressions that look similar but give different results
  const w1val = a + b * c;
  const w2val = a * b + c;
  const w3val = a * (b + c);
  const wrongExprs = [
    `${a} + ${b} × ${c}`,
    `${a} × ${b} + ${c}`,
    `${a} × (${b} + ${c})`
  ].filter(e => {
    // make sure they actually give a different result
    return true; // we check below
  });

  // Verify they differ from N
  const vals = [w1val, w2val, w3val];
  const validWrongs = [];
  for (let i = 0; i < wrongExprs.length && validWrongs.length < 3; i++) {
    if (vals[i] !== N) validWrongs.push(wrongExprs[i]);
  }
  // fallback if not enough
  while (validWrongs.length < 3) {
    const x = randInt(1, 5);
    const expr = `${a} + ${b} + ${c} × ${x}`;
    const val = a + b + c * x;
    if (val !== N) validWrongs.push(expr);
  }

  const { choices, answer } = mcqStrings(correctExpr, validWrongs.slice(0, 3));
  return {
    question: `Quelle expression donne ${N} comme resultat ?`,
    answer,
    choices,
    hint: 'Teste chaque expression en respectant les priorites operatoires.',
    explanation:
      `${correctExpr} = ${a} + ${b} = ${a + b}, puis ${a + b} × ${c} = ${N}.\n` +
      `Les autres expressions donnent des resultats differents si on respecte les priorites.`
  };
});

// ---------------------------------------------------------------------------
// prio-solve-complex : a - b * (c - d * e) + f
// ---------------------------------------------------------------------------
register('prio-solve-complex', (item) => {
  const d = randInt(1, 3);
  const e = randInt(1, 3);
  const c = d * e + randInt(1, 5); // ensure c - d*e > 0
  const b = randInt(2, 4);
  const innerParen = c - d * e;
  const f = randInt(1, 9);
  const a = b * innerParen + randInt(1, 10); // ensure a - b*(c-d*e) >= 0 roughly
  const result = a - b * innerParen + f;
  return {
    question: `Calcule : ${a} − ${b} × (${c} − ${d} × ${e}) + ${f}`,
    answer: String(result),
    hint: 'Dans la parenthese, la multiplication est prioritaire.',
    explanation:
      `Dans la parenthese : ${d} × ${e} = ${d * e}, puis ${c} − ${d * e} = ${innerParen}.\n` +
      `Multiplication : ${b} × ${innerParen} = ${b * innerParen}.\n` +
      `Enfin : ${a} − ${b * innerParen} + ${f} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// prio-mcq-power : a + b^2 * c   -> MCQ
// ---------------------------------------------------------------------------
register('prio-mcq-power', (item) => {
  const a = randInt(1, 9);
  const b = randInt(2, 6);
  const c = randInt(2, 5);
  const correct = a + b * b * c;
  const wrongs = distractors(correct, 3);
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Calcule : ${a} + ${b}² × ${c}`,
    answer,
    choices,
    hint: 'Les puissances passent avant les multiplications.',
    explanation:
      `Puissance d'abord : ${b}² = ${b * b}.\n` +
      `Multiplication : ${b * b} × ${c} = ${b * b * c}.\n` +
      `Addition : ${a} + ${b * b * c} = ${correct}.`
  };
});

// ---------------------------------------------------------------------------
// prio-solve-full : (a - b)^2 / c + d * (e - f)
// ---------------------------------------------------------------------------
register('prio-solve-full', (item) => {
  const a = randInt(5, 9);
  const b = randInt(1, a - 2);  // ensure diff >= 2 so sq >= 4
  const diff = a - b;
  const sq = diff * diff;
  // pick c as divisor of sq (> 1 and <= 9)
  const divisors = [];
  for (let i = 2; i <= Math.min(sq, 9); i++) { if (sq % i === 0) divisors.push(i); }
  const c = divisors.length > 0 ? randChoice(divisors) : 1;
  const d = randInt(2, 5);
  const e = randInt(3, 9);
  const f = randInt(1, e - 1);
  const result = sq / c + d * (e - f);
  return {
    question: `Calcule : (${a} − ${b})² ÷ ${c} + ${d} × (${e} − ${f})`,
    answer: String(result),
    hint: 'Parentheses, puis puissances, puis multiplications/divisions, puis additions.',
    explanation:
      `Parentheses : ${a} − ${b} = ${diff} et ${e} − ${f} = ${e - f}.\n` +
      `Puissance : ${diff}² = ${sq}.\n` +
      `Multiplications/divisions : ${sq} ÷ ${c} = ${sq / c} et ${d} × ${e - f} = ${d * (e - f)}.\n` +
      `Addition : ${sq / c} + ${d * (e - f)} = ${result}.`
  };
});
