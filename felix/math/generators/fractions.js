/**
 * Fractions (5eme) + Division de fractions (4eme).
 */
import { randInt, randChoice, gcd, lcm, simplify, frac, mcq, mcqStrings, distractors, shuffle } from './helpers.js';
import { register } from './registry.js';

/** Generate a non-trivial fraction [num, den] with den in range */
function randFrac(maxNum = 9, maxDen = 9) {
  const den = randInt(2, maxDen);
  let num = randInt(1, maxNum);
  // avoid num being a multiple of den (to avoid whole numbers)
  while (num % den === 0) num = randInt(1, maxNum);
  return [num, den];
}

// ---------------------------------------------------------------------------
// frac-add : a/b + c/d
// ---------------------------------------------------------------------------
register('frac-add', (item) => {
  const [a, b] = randFrac(7, 8);
  const [c, d] = randFrac(7, 8);
  const commonDen = lcm(b, d);
  const numResult = a * (commonDen / b) + c * (commonDen / d);
  const result = frac(numResult, commonDen);
  return {
    question: `Calcule : ${a}/${b} + ${c}/${d}`,
    answer: result,
    hint: 'Trouve le denominateur commun, puis additionne les numerateurs.',
    explanation:
      `Denominateur commun : PPCM(${b}, ${d}) = ${commonDen}.\n` +
      `${a}/${b} = ${a * (commonDen / b)}/${commonDen} et ${c}/${d} = ${c * (commonDen / d)}/${commonDen}.\n` +
      `Somme : ${a * (commonDen / b) + c * (commonDen / d)}/${commonDen} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// frac-mcq-sub : a/b - c/d MCQ
// ---------------------------------------------------------------------------
register('frac-mcq-sub', (item) => {
  const [a, b] = randFrac(8, 8);
  let [c, d] = randFrac(8, 8);
  const commonDen = lcm(b, d);
  const numResult = a * (commonDen / b) - c * (commonDen / d);
  const correctStr = frac(numResult, commonDen);
  // Generate plausible wrong answers
  const [sn, sd] = simplify(numResult, commonDen);
  const wrongs = [
    frac(Math.abs(numResult) + 1, commonDen),
    frac(numResult + commonDen, commonDen),
    frac(a - c, b + d)  // common mistake: subtract nums and add dens
  ].filter(w => w !== correctStr);
  // ensure 3 wrongs
  while (wrongs.length < 3) wrongs.push(frac(sn + wrongs.length + 1, sd));
  const { choices, answer } = mcqStrings(correctStr, wrongs.slice(0, 3));
  return {
    question: `Calcule : ${a}/${b} − ${c}/${d}`,
    answer,
    choices,
    hint: 'Meme methode que l\'addition, mais on soustrait les numerateurs.',
    explanation:
      `Denominateur commun : ${commonDen}.\n` +
      `${a * (commonDen / b)}/${commonDen} − ${c * (commonDen / d)}/${commonDen} = ${numResult}/${commonDen} = ${correctStr}.`
  };
});

// ---------------------------------------------------------------------------
// frac-mul : a/b * c/d
// ---------------------------------------------------------------------------
register('frac-mul', (item) => {
  const [a, b] = randFrac(7, 9);
  const [c, d] = randFrac(7, 9);
  const result = frac(a * c, b * d);
  return {
    question: `Calcule : ${a}/${b} × ${c}/${d}`,
    answer: result,
    hint: 'Multiplie les numerateurs entre eux et les denominateurs entre eux.',
    explanation:
      `Numerateurs : ${a} × ${c} = ${a * c}.\n` +
      `Denominateurs : ${b} × ${d} = ${b * d}.\n` +
      `Resultat : ${a * c}/${b * d} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// frac-mcq-add-mixed : a/b + c/d where result needs simplification MCQ
// ---------------------------------------------------------------------------
register('frac-mcq-add-mixed', (item) => {
  // Force a result that needs simplification
  const b = randChoice([4, 6, 8, 9, 10]);
  const d = b; // same denominator makes it clearer
  const a = randInt(1, b - 1);
  let c = randInt(1, b - 1);
  const numSum = a + c;
  const g = gcd(numSum, b);
  // Ensure it needs simplification
  while (gcd(a + c, b) === 1) c = randInt(1, b - 1);
  const finalC = c;
  const finalNum = a + finalC;
  const correctStr = frac(finalNum, b);
  const wrongs = [
    `${finalNum}/${b}`, // unsimplified
    frac(finalNum + 1, b),
    frac(finalNum - 1, b)
  ].filter(w => w !== correctStr);
  while (wrongs.length < 3) wrongs.push(frac(finalNum + wrongs.length + 2, b));
  const { choices, answer } = mcqStrings(correctStr, wrongs.slice(0, 3));
  return {
    question: `Calcule et simplifie : ${a}/${b} + ${finalC}/${b}`,
    answer,
    choices,
    hint: 'Additionne les numerateurs, puis simplifie la fraction.',
    explanation:
      `${a}/${b} + ${finalC}/${b} = ${finalNum}/${b}.\n` +
      `PGCD(${finalNum}, ${b}) = ${gcd(finalNum, b)}.\n` +
      `Forme simplifiee : ${correctStr}.`
  };
});

// ---------------------------------------------------------------------------
// frac-mul-simplify : a/b * c/d with cross-simplification
// ---------------------------------------------------------------------------
register('frac-mul-simplify', (item) => {
  // Build fractions where cross-simplification is possible
  const k1 = randInt(2, 5);
  const k2 = randInt(2, 5);
  const p = randInt(2, 6);
  const q = randInt(2, 6);
  const a = k1 * p;
  const b = k2 * q;
  const c = k2;   // b and c share k2
  const d = k1;   // a and d share k1
  const result = frac(a * c, b * d);
  return {
    question: `Calcule : ${a}/${b} × ${c}/${d}`,
    answer: result,
    hint: 'Simplifie en croix avant de multiplier.',
    explanation:
      `Simplification en croix : ${a} et ${d} ont le facteur commun ${k1}, ` +
      `${b} et ${c} ont le facteur commun ${k2}.\n` +
      `Apres simplification : ${p}/${q} × 1/1 = ${frac(p, q)}.\n` +
      `Ou directement : ${a * c}/${b * d} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// frac-mcq-three : a/b + c/d - e/f MCQ
// ---------------------------------------------------------------------------
register('frac-mcq-three', (item) => {
  const b = randChoice([2, 3, 4, 6]);
  const d = randChoice([2, 3, 4, 6]);
  const f = randChoice([2, 3, 4, 6]);
  const a = randInt(1, b);
  const c = randInt(1, d);
  const e = randInt(1, f);
  const commonDen = lcm(lcm(b, d), f);
  const numResult = a * (commonDen / b) + c * (commonDen / d) - e * (commonDen / f);
  const correctStr = frac(numResult, commonDen);
  const [sn, sd] = simplify(numResult, commonDen);
  const wrongs = [
    frac(numResult + 1, commonDen),
    frac(numResult - 1, commonDen),
    frac(a + c - e, b)
  ].filter(w => w !== correctStr);
  while (wrongs.length < 3) wrongs.push(frac(sn + wrongs.length + 1, sd || 1));
  const { choices, answer } = mcqStrings(correctStr, wrongs.slice(0, 3));
  return {
    question: `Calcule : ${a}/${b} + ${c}/${d} − ${e}/${f}`,
    answer,
    choices,
    hint: 'Trouve le denominateur commun aux trois fractions.',
    explanation:
      `Denominateur commun : ${commonDen}.\n` +
      `= ${a * (commonDen / b)}/${commonDen} + ${c * (commonDen / d)}/${commonDen} − ${e * (commonDen / f)}/${commonDen}\n` +
      `= ${numResult}/${commonDen} = ${correctStr}.`
  };
});

// ---------------------------------------------------------------------------
// frac-of-number : a/b of N
// ---------------------------------------------------------------------------
register('frac-of-number', (item) => {
  const b = randChoice([2, 3, 4, 5, 6, 8, 10]);
  const a = randInt(1, b - 1);
  const k = randInt(2, 10);
  const N = b * k; // ensure divisible
  const result = (a * N) / b;
  return {
    question: `Calcule ${a}/${b} de ${N}.`,
    answer: String(result),
    hint: 'Divise par le denominateur, puis multiplie par le numerateur.',
    explanation:
      `${a}/${b} de ${N} = ${a}/${b} × ${N} = (${N} ÷ ${b}) × ${a} = ${N / b} × ${a} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// frac-mcq-irreducible : Which fraction is irreducible MCQ
// ---------------------------------------------------------------------------
register('frac-mcq-irreducible', (item) => {
  // Generate one irreducible and 3 reducible fractions
  let num, den;
  do {
    num = randInt(2, 15);
    den = randInt(2, 15);
  } while (gcd(num, den) !== 1 || num === den);
  const correctStr = `${num}/${den}`;

  const wrongs = [];
  for (let i = 0; i < 3; i++) {
    const factor = randInt(2, 4);
    const wNum = randInt(2, 8) * factor;
    const wDen = randInt(2, 8) * factor;
    wrongs.push(`${wNum}/${wDen}`);
  }

  const { choices, answer } = mcqStrings(correctStr, wrongs);
  return {
    question: `Quelle fraction est irreductible ?`,
    answer,
    choices,
    hint: 'Une fraction est irreductible si son numerateur et denominateur n\'ont aucun facteur commun.',
    explanation:
      `${num}/${den} est irreductible car PGCD(${num}, ${den}) = 1.\n` +
      `Les autres fractions peuvent etre simplifiees.`
  };
});

// ---------------------------------------------------------------------------
// frac-solve-three : a/b - c/d + e/f
// ---------------------------------------------------------------------------
register('frac-solve-three', (item) => {
  const b = randChoice([2, 3, 4, 5, 6]);
  const d = randChoice([2, 3, 4, 5, 6]);
  const f = randChoice([2, 3, 4, 5, 6]);
  const a = randInt(1, 2 * b);
  const c = randInt(1, d);
  const e = randInt(1, f);
  const commonDen = lcm(lcm(b, d), f);
  const numResult = a * (commonDen / b) - c * (commonDen / d) + e * (commonDen / f);
  const result = frac(numResult, commonDen);
  return {
    question: `Calcule : ${a}/${b} − ${c}/${d} + ${e}/${f}`,
    answer: result,
    hint: 'Mets tout au meme denominateur.',
    explanation:
      `Denominateur commun : ${commonDen}.\n` +
      `= ${a * (commonDen / b)}/${commonDen} − ${c * (commonDen / d)}/${commonDen} + ${e * (commonDen / f)}/${commonDen}\n` +
      `= ${numResult}/${commonDen} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// frac-mcq-square : (a/b)^2 MCQ
// ---------------------------------------------------------------------------
register('frac-mcq-square', (item) => {
  const [a, b] = randFrac(6, 6);
  const numSq = a * a;
  const denSq = b * b;
  const correctStr = frac(numSq, denSq);
  const wrongs = [
    frac(2 * a, 2 * b),        // doubled instead of squared
    frac(a * a, b),             // forgot to square denominator
    frac(a, b * b)              // forgot to square numerator
  ].filter(w => w !== correctStr);
  while (wrongs.length < 3) wrongs.push(frac(numSq + wrongs.length, denSq));
  const { choices, answer } = mcqStrings(correctStr, wrongs.slice(0, 3));
  return {
    question: `Calcule : (${a}/${b})²`,
    answer,
    choices,
    hint: 'Eleve le numerateur ET le denominateur au carre.',
    explanation:
      `(${a}/${b})² = ${a}²/${b}² = ${numSq}/${denSq} = ${correctStr}.`
  };
});

// ---------------------------------------------------------------------------
// frac-div : a/b / c/d
// ---------------------------------------------------------------------------
register('frac-div', (item) => {
  const [a, b] = randFrac(8, 8);
  const [c, d] = randFrac(8, 8);
  const result = frac(a * d, b * c);
  return {
    question: `Calcule : ${a}/${b} ÷ ${c}/${d}`,
    answer: result,
    hint: 'Diviser par une fraction = multiplier par son inverse.',
    explanation:
      `${a}/${b} ÷ ${c}/${d} = ${a}/${b} × ${d}/${c} = ${a * d}/${b * c} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// frac-mcq-div : Division MCQ with cross simplification
// ---------------------------------------------------------------------------
register('frac-mcq-div', (item) => {
  const k = randInt(2, 5);
  const p = randInt(2, 6);
  const q = randInt(2, 6);
  // a/b / c/d where a=k*p, d=k*q so a*d has factor k^2
  const a = k * p;
  const b = randInt(2, 8);
  const c = randInt(2, 8);
  const d = k * q;
  const correctStr = frac(a * d, b * c);
  const wrongs = [
    frac(a * c, b * d),           // multiplied instead of dividing
    frac(a * d + 1, b * c),       // off by one
    frac(a * d, b * c + 1)
  ].filter(w => w !== correctStr);
  while (wrongs.length < 3) wrongs.push(frac(a * d + wrongs.length + 1, b * c));
  const { choices, answer } = mcqStrings(correctStr, wrongs.slice(0, 3));
  return {
    question: `Calcule : ${a}/${b} ÷ ${c}/${d}`,
    answer,
    choices,
    hint: 'Inverse la deuxieme fraction et multiplie. Simplifie en croix !',
    explanation:
      `${a}/${b} ÷ ${c}/${d} = ${a}/${b} × ${d}/${c} = ${a * d}/${b * c} = ${correctStr}.`
  };
});

// ---------------------------------------------------------------------------
// frac-solve-compound : (a/b + c/d) * e/f
// ---------------------------------------------------------------------------
register('frac-solve-compound', (item) => {
  const b = randChoice([2, 3, 4, 6]);
  const d = b; // same denominator for simplicity
  const a = randInt(1, b - 1);
  const c = randInt(1, d - 1);
  const f = randChoice([2, 3, 5]);
  const e = randInt(1, f);
  const sumNum = a + c;
  const productNum = sumNum * e;
  const productDen = b * f;
  const result = frac(productNum, productDen);
  return {
    question: `Calcule : (${a}/${b} + ${c}/${d}) × ${e}/${f}`,
    answer: result,
    hint: 'Calcule d\'abord la parenthese, puis multiplie.',
    explanation:
      `Parenthese : ${a}/${b} + ${c}/${d} = ${sumNum}/${b}.\n` +
      `Multiplication : ${sumNum}/${b} × ${e}/${f} = ${productNum}/${productDen} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// frac-mcq-compound-div : (a/b - c/d) / (e/f) MCQ
// ---------------------------------------------------------------------------
register('frac-mcq-compound-div', (item) => {
  const b = randChoice([3, 4, 6]);
  const d = b;
  const a = randInt(2, b);
  const c = randInt(1, a - 1); // ensure positive result
  const f = randChoice([2, 3, 5]);
  const e = randInt(1, f);
  const diffNum = a - c;
  const resultNum = diffNum * f;
  const resultDen = b * e;
  const correctStr = frac(resultNum, resultDen);
  const wrongs = [
    frac(diffNum * e, b * f),       // multiplied instead of dividing
    frac(diffNum, b * e),           // forgot to multiply by f
    frac(resultNum + 1, resultDen)
  ].filter(w => w !== correctStr);
  while (wrongs.length < 3) wrongs.push(frac(resultNum + wrongs.length + 1, resultDen));
  const { choices, answer } = mcqStrings(correctStr, wrongs.slice(0, 3));
  return {
    question: `Calcule : (${a}/${b} − ${c}/${d}) ÷ (${e}/${f})`,
    answer,
    choices,
    hint: 'Parenthese d\'abord, puis diviser = multiplier par l\'inverse.',
    explanation:
      `Parenthese : ${a}/${b} − ${c}/${d} = ${diffNum}/${b}.\n` +
      `Division : ${diffNum}/${b} ÷ ${e}/${f} = ${diffNum}/${b} × ${f}/${e} = ${resultNum}/${resultDen} = ${correctStr}.`
  };
});

// ---------------------------------------------------------------------------
// frac-solve-neg : (-a/b) * (c/d) with negatives
// ---------------------------------------------------------------------------
register('frac-solve-neg', (item) => {
  const [a, b] = randFrac(7, 8);
  const [c, d] = randFrac(7, 8);
  const numResult = -(a * c);
  const denResult = b * d;
  const result = frac(numResult, denResult);
  return {
    question: `Calcule : (−${a}/${b}) × (${c}/${d})`,
    answer: result,
    hint: 'Negatif fois positif donne negatif. Multiplie les fractions normalement.',
    explanation:
      `Signe : negatif × positif = negatif.\n` +
      `Valeur : ${a}/${b} × ${c}/${d} = ${a * c}/${b * d}.\n` +
      `Resultat : −${a * c}/${b * d} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// frac-mcq-priority : a/b + c/d / e/f with priority MCQ
// ---------------------------------------------------------------------------
register('frac-mcq-priority', (item) => {
  const b = randChoice([2, 3, 4, 5]);
  const a = randInt(1, b);
  const d = randChoice([2, 3, 4, 5]);
  const c = randInt(1, d);
  const f = randChoice([2, 3, 4, 5]);
  const e = randInt(1, f);
  // Priority: division first, then addition
  // c/d / e/f = c*f / (d*e)
  const divNum = c * f;
  const divDen = d * e;
  // a/b + divNum/divDen
  const commonDen = lcm(b, divDen);
  const totalNum = a * (commonDen / b) + divNum * (commonDen / divDen);
  const correctStr = frac(totalNum, commonDen);
  // Wrong: doing addition first
  const wrongAddNum = a * d + c * b;
  const wrongAddDen = b * d;
  const wrongStr = frac(wrongAddNum * f, wrongAddDen * e);
  // actually let's just do the common-mistake version: (a/b + c/d) / e/f
  const addFirstNum = (a * d + c * b);
  const addFirstDen = b * d;
  const wrongAddFirst = frac(addFirstNum * f, addFirstDen * e);
  const wrongs = [
    wrongAddFirst,
    frac(totalNum + 1, commonDen),
    frac(totalNum - 1, commonDen)
  ].filter(w => w !== correctStr);
  while (wrongs.length < 3) wrongs.push(frac(totalNum + wrongs.length + 2, commonDen));
  const { choices, answer } = mcqStrings(correctStr, wrongs.slice(0, 3));
  return {
    question: `Calcule : ${a}/${b} + ${c}/${d} ÷ ${e}/${f}`,
    answer,
    choices,
    hint: 'Attention aux priorites : la division est prioritaire sur l\'addition !',
    explanation:
      `La division est prioritaire !\n` +
      `D'abord : ${c}/${d} ÷ ${e}/${f} = ${c}/${d} × ${f}/${e} = ${frac(divNum, divDen)}.\n` +
      `Puis : ${a}/${b} + ${frac(divNum, divDen)} = ${correctStr}.`
  };
});
