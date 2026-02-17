/**
 * Nombres premiers et divisibilite (5eme).
 */
import { randInt, randChoice, gcd, mcq, mcqStrings, isPrime, factorize, formatFactors, shuffle, distractors } from './helpers.js';
import { register } from './registry.js';

/** Small primes list */
const SMALL_PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

// ---------------------------------------------------------------------------
// div-mcq-prime : "Which is prime?" MCQ
// ---------------------------------------------------------------------------
register('div-mcq-prime', (item) => {
  // Pick one prime
  const prime = randChoice(SMALL_PRIMES.filter(p => p >= 7)); // avoid trivial 2,3,5
  // Pick 3 composites in similar range
  const composites = [];
  let attempts = 0;
  while (composites.length < 3 && attempts < 100) {
    const n = randInt(prime - 10, prime + 15);
    if (n > 1 && !isPrime(n) && !composites.includes(n) && n !== prime) {
      composites.push(n);
    }
    attempts++;
  }
  while (composites.length < 3) composites.push(prime + composites.length + 1);

  const { choices, answer } = mcq(prime, composites);
  return {
    question: `Lequel de ces nombres est premier ?`,
    answer,
    choices,
    hint: 'Un nombre premier n\'a que deux diviseurs : 1 et lui-meme.',
    explanation:
      `${prime} est premier : il n'est divisible que par 1 et ${prime}.\n` +
      composites.map(c => {
        const d = factorize(c);
        return `${c} = ${formatFactors(d)} (pas premier)`;
      }).join('.\n') + '.'
  };
});

// ---------------------------------------------------------------------------
// div-fill-factor : Decompose N, one factor missing
// ---------------------------------------------------------------------------
register('div-fill-factor', (item) => {
  // Build N from small primes
  const primes = [2, 3, 5, 7, 11];
  const numFactors = randInt(2, 4);
  let N = 1;
  const chosen = [];
  for (let i = 0; i < numFactors; i++) {
    const p = randChoice(primes);
    N *= p;
    chosen.push(p);
  }
  if (N < 12) { N *= randChoice([2, 3]); chosen.push(N === N ? chosen[chosen.length - 1] : 2); }
  // Recalculate properly
  N = 1;
  chosen.sort((a, b) => a - b);
  chosen.forEach(p => N *= p);

  const factors = factorize(N);
  const formatted = formatFactors(factors);

  // Pick a factor to hide
  const hiddenIdx = randInt(0, factors.length - 1);
  const hiddenPrime = factors[hiddenIdx][0];
  const hiddenExp = factors[hiddenIdx][1];
  const hiddenValue = Math.pow(hiddenPrime, hiddenExp);

  // Show decomposition with a blank
  const parts = factors.map(([p, e], idx) => {
    if (idx === hiddenIdx) return '?';
    if (e === 1) return String(p);
    const superscripts = { '2': '\u00B2', '3': '\u00B3', '4': '\u2074', '5': '\u2075' };
    return `${p}${superscripts[String(e)] || `^${e}`}`;
  });
  const decomp = parts.join(' × ');

  return {
    question: `On a ${N} = ${decomp}. Quel est le facteur manquant ?`,
    answer: String(hiddenValue),
    hint: `Divise ${N} par les facteurs visibles.`,
    explanation:
      `La decomposition complete de ${N} est ${formatted}.\n` +
      `Le facteur manquant est ${hiddenValue}.`
  };
});

// ---------------------------------------------------------------------------
// div-mcq-divisible : "By which is N divisible?" MCQ
// ---------------------------------------------------------------------------
register('div-mcq-divisible', (item) => {
  const N = randInt(20, 200);
  // Find actual divisors among small numbers
  const candidates = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const divisors = candidates.filter(d => N % d === 0);
  const nonDivisors = candidates.filter(d => N % d !== 0);

  if (divisors.length === 0 || nonDivisors.length < 3) {
    // fallback: use a number guaranteed to have divisors
    const safeN = 60;
    const safeDivisors = candidates.filter(d => safeN % d === 0);
    const safeNonDivisors = candidates.filter(d => safeN % d !== 0);
    const correct = randChoice(safeDivisors);
    const wrongs = shuffle([...safeNonDivisors]).slice(0, 3);
    const { choices, answer } = mcq(correct, wrongs);
    return {
      question: `Par lequel de ces nombres ${safeN} est-il divisible ?`,
      answer,
      choices,
      hint: `Teste la divisibilite de ${safeN} par chaque nombre propose.`,
      explanation: `${safeN} ÷ ${correct} = ${safeN / correct} (division exacte).`
    };
  }

  const correct = randChoice(divisors);
  const wrongs = shuffle([...nonDivisors]).slice(0, 3);
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Par lequel de ces nombres ${N} est-il divisible ?`,
    answer,
    choices,
    hint: `Teste la divisibilite de ${N} par chaque nombre propose.`,
    explanation:
      `${N} ÷ ${correct} = ${N / correct} (division exacte).\n` +
      wrongs.map(w => `${N} ÷ ${w} = ${(N / w).toFixed(2)}... (pas entier)`).join('.\n') + '.'
  };
});

// ---------------------------------------------------------------------------
// div-solve-decompose : Decompose N in prime factors (compact form)
// ---------------------------------------------------------------------------
register('div-solve-decompose', (item) => {
  // Build a number with interesting factorization
  const primes = [2, 3, 5, 7, 11, 13];
  let N = 1;
  const numPrimes = randInt(2, 3);
  const usedPrimes = [];
  for (let i = 0; i < numPrimes; i++) {
    const p = primes[i];
    const exp = randInt(1, i === 0 ? 3 : 2);
    N *= Math.pow(p, exp);
    usedPrimes.push([p, exp]);
  }
  // Sometimes add another prime factor
  if (Math.random() > 0.5 && numPrimes < 4) {
    const p = primes[numPrimes];
    N *= p;
    usedPrimes.push([p, 1]);
  }

  const factors = factorize(N);
  const formatted = formatFactors(factors);

  // Build step-by-step explanation
  const steps = [];
  let remaining = N;
  for (const [p, e] of factors) {
    for (let i = 0; i < e; i++) {
      steps.push(`${remaining} ÷ ${p} = ${remaining / p}`);
      remaining /= p;
    }
  }

  return {
    question: `Decompose ${N} en produit de facteurs premiers.`,
    answer: formatted,
    hint: 'Divise successivement par les plus petits nombres premiers : 2, 3, 5, 7...',
    explanation:
      `Division successive :\n` +
      steps.join('\n') + '\n' +
      `Donc ${N} = ${formatted}.`
  };
});

// ---------------------------------------------------------------------------
// div-mcq-pgcd : PGCD of two numbers MCQ
// ---------------------------------------------------------------------------
register('div-mcq-pgcd', (item) => {
  const g = randInt(2, 12);  // the actual GCD
  const a = g * randInt(2, 8);
  let b = g * randInt(2, 8);
  while (b === a) b = g * randInt(2, 8);
  const actualGcd = gcd(a, b);

  const correct = actualGcd;
  const wrongs = distractors(correct, 3, { positive: true, spread: 6 });
  const { choices, answer } = mcq(correct, wrongs);

  const factorsA = factorize(a);
  const factorsB = factorize(b);

  return {
    question: `Quel est le PGCD de ${a} et ${b} ?`,
    answer,
    choices,
    hint: 'Decompose les deux nombres en facteurs premiers et prends les facteurs communs.',
    explanation:
      `${a} = ${formatFactors(factorsA)}.\n` +
      `${b} = ${formatFactors(factorsB)}.\n` +
      `PGCD(${a}, ${b}) = ${correct}.`
  };
});

// ---------------------------------------------------------------------------
// div-solve-count-primes : Count primes in [1, N]
// ---------------------------------------------------------------------------
register('div-solve-count-primes', (item) => {
  const N = randChoice([20, 25, 30, 40, 50]);
  const primesList = [];
  for (let i = 2; i <= N; i++) {
    if (isPrime(i)) primesList.push(i);
  }
  const count = primesList.length;
  return {
    question: `Combien y a-t-il de nombres premiers entre 1 et ${N} ?`,
    answer: String(count),
    hint: `Teste chaque nombre : est-il divisible uniquement par 1 et lui-meme ?`,
    explanation:
      `Les nombres premiers entre 1 et ${N} sont :\n` +
      `${primesList.join(', ')}.\n` +
      `Il y en a ${count}.`
  };
});
