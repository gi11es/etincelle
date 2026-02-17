/**
 * PGCD et algorithme d'Euclide (3eme) - GCD generators.
 */
import { randInt, randChoice, mcq, mcqStrings, distractors, gcd, frac, simplify, isPrime, factorize, formatFactors } from './helpers.js';
import { register } from './registry.js';

// ---------------------------------------------------------------------------
// Helper: show Euclidean algorithm steps
// ---------------------------------------------------------------------------
function euclideSteps(a, b) {
  const steps = [];
  let x = Math.max(a, b);
  let y = Math.min(a, b);
  while (y > 0) {
    const q = Math.floor(x / y);
    const r = x % y;
    steps.push(`${x} = ${y} × ${q} + ${r}`);
    x = y;
    y = r;
  }
  return { steps, result: x };
}

// ---------------------------------------------------------------------------
// pgcd-solve-euclide : Compute PGCD using Euclidean algorithm
// ---------------------------------------------------------------------------
register('pgcd-solve-euclide', (item) => {
  // Generate two numbers with a non-trivial GCD
  const g = randInt(2, 15);
  const m1 = randInt(3, 20);
  let m2 = randInt(3, 20);
  while (m2 === m1) m2 = randInt(3, 20);
  const a = g * m1;
  const b = g * m2;
  const pgcd = gcd(a, b);
  const { steps } = euclideSteps(a, b);
  return {
    question: `Calcule le PGCD de ${a} et ${b} en utilisant l'algorithme d'Euclide.`,
    answer: String(pgcd),
    hint: 'Divise le plus grand par le plus petit, puis continue avec le diviseur et le reste.',
    explanation:
      `Algorithme d'Euclide :\n` +
      steps.join('\n') + `\n` +
      `Le dernier reste non nul est ${pgcd}. Donc PGCD(${a}, ${b}) = ${pgcd}.`
  };
});

// ---------------------------------------------------------------------------
// pgcd-mcq : PGCD of two numbers MCQ
// ---------------------------------------------------------------------------
register('pgcd-mcq', (item) => {
  const g = randInt(3, 18);
  const m1 = randInt(2, 12);
  let m2 = randInt(2, 12);
  while (m2 === m1 || gcd(m1, m2) !== 1) {
    m2 = randInt(2, 12);
  }
  const a = g * m1;
  const b = g * m2;
  const pgcd = g; // since gcd(m1,m2) = 1
  const wrongs = distractors(pgcd, 3, { positive: true, spread: 6 });
  const { choices, answer } = mcq(pgcd, wrongs);
  const { steps } = euclideSteps(a, b);
  return {
    question: `Quel est le PGCD de ${a} et ${b} ?`,
    answer,
    choices,
    hint: 'Utilise l\'algorithme d\'Euclide : divisions successives.',
    explanation:
      `Algorithme d'Euclide :\n` +
      steps.join('\n') + `\n` +
      `PGCD(${a}, ${b}) = ${pgcd}.`
  };
});

// ---------------------------------------------------------------------------
// pgcd-solve-irreductible : Simplify fraction to irreducible form
// ---------------------------------------------------------------------------
register('pgcd-solve-irreductible', (item) => {
  const g = randInt(2, 15);
  let n = randInt(2, 12);
  let d = randInt(2, 12);
  while (n === d) d = randInt(2, 12);
  // Ensure n/d is already irreducible
  while (gcd(n, d) !== 1) {
    d = randInt(2, 12);
  }
  const num = g * n;
  const den = g * d;
  const result = frac(num, den);
  return {
    question: `Rends irreductible la fraction ${num}/${den}.`,
    answer: result,
    hint: 'Trouve le PGCD du numerateur et du denominateur, puis divise les deux par ce PGCD.',
    explanation:
      `PGCD(${num}, ${den}) = ${g}.\n` +
      `${num}/${den} = (${num} ÷ ${g}) / (${den} ÷ ${g}) = ${n}/${d}.\n` +
      `La fraction irreductible est ${result}.`
  };
});

// ---------------------------------------------------------------------------
// pgcd-mcq-partage : Sharing problem (max equal packets) MCQ
// ---------------------------------------------------------------------------
register('pgcd-mcq-partage', (item) => {
  const g = randInt(4, 18);
  const m1 = randInt(2, 8);
  let m2 = randInt(2, 8);
  while (m2 === m1 || gcd(m1, m2) !== 1) {
    m2 = randInt(2, 8);
  }
  const a = g * m1;
  const b = g * m2;
  const correct = g;
  const wrongs = distractors(correct, 3, { positive: true, spread: 5 });
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `On veut partager ${a} bonbons rouges et ${b} bonbons bleus en paquets identiques contenant les deux couleurs, sans reste. Quel est le nombre maximum de paquets ?`,
    answer,
    choices,
    hint: 'Le nombre de paquets doit diviser a la fois les deux quantites.',
    explanation:
      `Le nombre maximum de paquets est le PGCD de ${a} et ${b}.\n` +
      `PGCD(${a}, ${b}) = ${g}.\n` +
      `On peut faire ${g} paquets de ${m1} bonbons rouges et ${m2} bonbons bleus.`
  };
});

// ---------------------------------------------------------------------------
// pgcd-solve-coprime : Are two numbers coprime? (oui/non)
// ---------------------------------------------------------------------------
register('pgcd-solve-coprime', (item) => {
  const isCoprime = randChoice([true, false]);
  let a, b;
  if (isCoprime) {
    // Generate coprime numbers
    a = randInt(5, 50);
    b = randInt(5, 50);
    while (gcd(a, b) !== 1 || a === b) {
      b = randInt(5, 50);
    }
  } else {
    // Generate non-coprime numbers
    const g = randInt(2, 10);
    const m1 = randInt(2, 15);
    let m2 = randInt(2, 15);
    while (m2 === m1) m2 = randInt(2, 15);
    a = g * m1;
    b = g * m2;
  }
  const pgcd = gcd(a, b);
  const ans = pgcd === 1 ? 'oui' : 'non';
  const factA = formatFactors(factorize(a));
  const factB = formatFactors(factorize(b));
  return {
    question: `Les nombres ${a} et ${b} sont-ils premiers entre eux ? (oui/non)`,
    answer: ans,
    hint: 'Deux nombres sont premiers entre eux si leur PGCD vaut 1.',
    explanation:
      `${a} = ${factA} et ${b} = ${factB}.\n` +
      `PGCD(${a}, ${b}) = ${pgcd}.\n` +
      (pgcd === 1
        ? `Le PGCD vaut 1, donc ${a} et ${b} sont premiers entre eux.`
        : `Le PGCD vaut ${pgcd} ≠ 1, donc ${a} et ${b} ne sont PAS premiers entre eux.`)
  };
});
