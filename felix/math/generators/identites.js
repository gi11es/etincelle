/**
 * Identites remarquables (3eme) - Notable identities generators.
 */
import { randInt, randChoice, randNonZero, mcq, mcqStrings, distractors, coeff, signedStr } from './helpers.js';
import { register } from './registry.js';

// ---------------------------------------------------------------------------
// Helper: format polynomial term
// ---------------------------------------------------------------------------
function formatPoly(a2, a1, a0, variable = 'x') {
  // Format ax² + bx + c
  const parts = [];
  if (a2 !== 0) {
    if (a2 === 1) parts.push(`${variable}²`);
    else if (a2 === -1) parts.push(`−${variable}²`);
    else parts.push(`${a2}${variable}²`);
  }
  if (a1 !== 0) {
    if (parts.length === 0) {
      if (a1 === 1) parts.push(`${variable}`);
      else if (a1 === -1) parts.push(`−${variable}`);
      else parts.push(`${a1}${variable}`);
    } else {
      if (a1 === 1) parts.push(`+ ${variable}`);
      else if (a1 === -1) parts.push(`− ${variable}`);
      else if (a1 > 0) parts.push(`+ ${a1}${variable}`);
      else parts.push(`− ${Math.abs(a1)}${variable}`);
    }
  }
  if (a0 !== 0) {
    if (parts.length === 0) {
      parts.push(String(a0));
    } else {
      if (a0 > 0) parts.push(`+ ${a0}`);
      else parts.push(`− ${Math.abs(a0)}`);
    }
  }
  if (parts.length === 0) return '0';
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// id-solve-plus-sq : Develop (x + a)²
// ---------------------------------------------------------------------------
register('id-solve-plus-sq', (item) => {
  const a = randInt(1, 12);
  const a2 = 1;
  const a1 = 2 * a;
  const a0 = a * a;
  const result = `x²+${a1}x+${a0}`;
  return {
    question: `Developpe : (x + ${a})²`,
    answer: result,
    hint: '(a + b)² = a² + 2ab + b². N\'oublie pas le double produit !',
    explanation:
      `(x + ${a})² = x² + 2 × x × ${a} + ${a}²\n` +
      `= x² + ${a1}x + ${a0}.\n` +
      `Identite : (a + b)² = a² + 2ab + b².`
  };
});

// ---------------------------------------------------------------------------
// id-mcq-minus-sq : Develop (ax − b)² MCQ
// ---------------------------------------------------------------------------
register('id-mcq-minus-sq', (item) => {
  const a = randChoice([2, 3, 4, 5]);
  const b = randInt(1, 7);
  const c2 = a * a;
  const c1 = 2 * a * b;
  const c0 = b * b;
  const correct = `${c2}x² − ${c1}x + ${c0}`;
  const wrongs = [
    `${c2}x² + ${c1}x + ${c0}`,  // wrong sign on middle term
    `${c2}x² − ${c0}`,           // forgot double product
    `${a}x² − ${c1}x + ${c0}`    // forgot to square coefficient
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Quel est le developpement de (${a}x − ${b})² ?`,
    answer,
    choices,
    hint: '(a − b)² = a² − 2ab + b². Le double produit est negatif !',
    explanation:
      `(${a}x − ${b})² = (${a}x)² − 2 × ${a}x × ${b} + ${b}²\n` +
      `= ${c2}x² − ${c1}x + ${c0}.\n` +
      `Attention : le terme du milieu est negatif, mais le dernier terme est toujours positif.`
  };
});

// ---------------------------------------------------------------------------
// id-solve-diff-sq : Factorize x² − a²
// ---------------------------------------------------------------------------
register('id-solve-diff-sq', (item) => {
  const a = randInt(2, 12);
  return {
    question: `Factorise : x² − ${a * a}`,
    answer: `(x-${a})(x+${a})`,
    hint: 'a² − b² = (a − b)(a + b).',
    explanation:
      `x² − ${a * a} = x² − ${a}².\n` +
      `C'est une difference de deux carres : a² − b² = (a − b)(a + b).\n` +
      `Donc x² − ${a * a} = (x − ${a})(x + ${a}).`
  };
});

// ---------------------------------------------------------------------------
// id-mcq-diff-sq-coeff : Factorize ax² − b² MCQ
// ---------------------------------------------------------------------------
register('id-mcq-diff-sq-coeff', (item) => {
  const k = randChoice([2, 3, 4, 5]);
  const b = randInt(2, 7);
  const kSq = k * k;
  const bSq = b * b;
  const correct = `(${k}x − ${b})(${k}x + ${b})`;
  const wrongs = [
    `(${k}x − ${b})²`,
    `(${kSq}x − ${bSq})(x + 1)`,
    `(${k}x − ${bSq})(${k}x + 1)`
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Factorise : ${kSq}x² − ${bSq}`,
    answer,
    choices,
    hint: `Ecris ${kSq}x² comme (${k}x)² et ${bSq} comme ${b}².`,
    explanation:
      `${kSq}x² − ${bSq} = (${k}x)² − ${b}².\n` +
      `Difference de deux carres : (${k}x − ${b})(${k}x + ${b}).`
  };
});

// ---------------------------------------------------------------------------
// id-solve-product : Develop (ax + b)(ax − b)
// ---------------------------------------------------------------------------
register('id-solve-product', (item) => {
  const a = randChoice([1, 2, 3, 4, 5]);
  const b = randInt(1, 9);
  const aSq = a * a;
  const bSq = b * b;
  const aStr = a === 1 ? 'x' : `${a}x`;
  const result = a === 1 ? `x²-${bSq}` : `${aSq}x²-${bSq}`;
  return {
    question: `Developpe : (${aStr} + ${b})(${aStr} − ${b})`,
    answer: result,
    hint: '(a + b)(a − b) = a² − b².',
    explanation:
      `(${aStr} + ${b})(${aStr} − ${b}) = (${aStr})² − ${b}².\n` +
      `= ${a === 1 ? '' : aSq}x² − ${bSq}.\n` +
      `Les termes en x s'annulent : c'est la beaute de cette identite !`
  };
});

// ---------------------------------------------------------------------------
// id-mcq-recognize-sq : Recognize x² + 2ax + a² = (x + a)² MCQ
// ---------------------------------------------------------------------------
register('id-mcq-recognize-sq', (item) => {
  const a = randInt(1, 9);
  const c1 = 2 * a;
  const c0 = a * a;
  const correct = `(x + ${a})²`;
  const wrongs = [
    `(x + ${c0})²`,
    `(x − ${a})²`,
    `(x + ${a})(x − ${a})`
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Factorise : x² + ${c1}x + ${c0}`,
    answer,
    choices,
    hint: 'Cherche si c\'est de la forme a² + 2ab + b² = (a + b)².',
    explanation:
      `x² + ${c1}x + ${c0} = x² + 2 × x × ${a} + ${a}².\n` +
      `C'est la forme a² + 2ab + b² avec a = x et b = ${a}.\n` +
      `Donc : (x + ${a})².`
  };
});

// ---------------------------------------------------------------------------
// id-solve-mental-calc : Calculate N² using identity (N close to 100)
// ---------------------------------------------------------------------------
register('id-solve-mental-calc', (item) => {
  const small = randInt(1, 9);
  const sign = randChoice([1, -1]);
  const N = 100 + sign * small;
  const result = N * N;
  const base = 100;
  if (sign === 1) {
    // (100 + a)² = 10000 + 200a + a²
    return {
      question: `Calcule ${N}² mentalement en utilisant une identite remarquable.`,
      answer: String(result),
      hint: `Ecris ${N} comme 100 + ${small}, puis utilise (a + b)².`,
      explanation:
        `${N}² = (100 + ${small})² = 100² + 2 × 100 × ${small} + ${small}²\n` +
        `= 10000 + ${200 * small} + ${small * small}\n` +
        `= ${result}.`
    };
  } else {
    // (100 - a)² = 10000 - 200a + a²
    return {
      question: `Calcule ${N}² mentalement en utilisant une identite remarquable.`,
      answer: String(result),
      hint: `Ecris ${N} comme 100 − ${small}, puis utilise (a − b)².`,
      explanation:
        `${N}² = (100 − ${small})² = 100² − 2 × 100 × ${small} + ${small}²\n` +
        `= 10000 − ${200 * small} + ${small * small}\n` +
        `= ${result}.`
    };
  }
});

// ---------------------------------------------------------------------------
// id-mcq-diff-two-sq : Develop (x+a)² − (x+b)² MCQ
// ---------------------------------------------------------------------------
register('id-mcq-diff-two-sq', (item) => {
  const a = randInt(1, 6);
  let b = randInt(1, 6);
  while (b === a) b = randInt(1, 6);
  // (x+a)² − (x+b)² = [(x+a)-(x+b)][(x+a)+(x+b)] = (a-b)(2x+a+b)
  const diff = a - b;
  const sum = a + b;
  // Expand: diff * (2x + sum) = 2*diff*x + diff*sum
  const c1 = 2 * diff;
  const c0 = diff * sum;
  // Format the result
  const resultStr = formatPoly(0, c1, c0);
  const correct = resultStr;
  // Wrong answers: common mistakes
  const wrongs = [
    formatPoly(0, 2 * (a - b), a * a - b * b + 2), // off by constant
    formatPoly(0, a - b, a * a - b * b),             // forgot factor 2
    formatPoly(0, 2 * (a + b), c0)                   // wrong sign
  ];
  // Deduplicate
  const uniqueWrongs = [...new Set(wrongs)].filter(w => w !== correct).slice(0, 3);
  while (uniqueWrongs.length < 3) {
    uniqueWrongs.push(formatPoly(0, c1 + uniqueWrongs.length + 1, c0 + 1));
  }
  const { choices, answer } = mcqStrings(correct, uniqueWrongs);
  return {
    question: `Developpez et simplifiez : (x + ${a})² − (x + ${b})²`,
    answer,
    choices,
    hint: 'Utilisez la difference de deux carres : A² − B² = (A − B)(A + B).',
    explanation:
      `(x + ${a})² − (x + ${b})² = [(x + ${a}) − (x + ${b})][(x + ${a}) + (x + ${b})]\n` +
      `= (${a} − ${b})(2x + ${a} + ${b})\n` +
      `= ${diff} × (2x + ${sum})\n` +
      `= ${resultStr}.`
  };
});

// ---------------------------------------------------------------------------
// id-solve-factor-perfect : Factorize ax² − bx + c as perfect square
// ---------------------------------------------------------------------------
register('id-solve-factor-perfect', (item) => {
  const k = randChoice([2, 3, 4, 5]);
  const m = randInt(1, 6);
  // (kx - m)² = k²x² - 2kmx + m²
  const a2 = k * k;
  const a1 = 2 * k * m;
  const a0 = m * m;
  return {
    question: `Factorise : ${a2}x² − ${a1}x + ${a0}`,
    answer: `(${k}x-${m})²`,
    hint: 'Verifiez si c\'est de la forme (ax − b)² = a²x² − 2abx + b².',
    explanation:
      `${a2}x² − ${a1}x + ${a0} = (${k}x)² − 2 × ${k}x × ${m} + ${m}².\n` +
      `C'est de la forme a² − 2ab + b² = (a − b)².\n` +
      `Donc : (${k}x − ${m})².`
  };
});

// ---------------------------------------------------------------------------
// id-mcq-nested-diff : Factorize (A)² − (B)² where A,B are expressions MCQ
// ---------------------------------------------------------------------------
register('id-mcq-nested-diff', (item) => {
  const a = randInt(1, 5);
  const b = randInt(1, 5);
  // (2x + a)² − (x + b)²
  // = [(2x+a) - (x+b)][(2x+a) + (x+b)]
  // = (x + (a-b))(3x + (a+b))
  const d = a - b;
  const s = a + b;
  const factor1 = d === 0 ? 'x' : (d > 0 ? `(x + ${d})` : `(x − ${Math.abs(d)})`);
  const factor2 = `(3x + ${s})`;
  const correct = `${factor1}${factor2}`;
  const wrongs = [
    `(x + ${a})(3x + ${b})`,
    `(2x + ${a - b})(x + ${a + b})`,
    `(x − ${b})(3x − ${a})`
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Factorisez : (2x + ${a})² − (x + ${b})²`,
    answer,
    choices,
    hint: 'A² − B² = (A − B)(A + B) avec A = 2x + ' + a + ' et B = x + ' + b + '.',
    explanation:
      `(2x + ${a})² − (x + ${b})² = [(2x + ${a}) − (x + ${b})][(2x + ${a}) + (x + ${b})]\n` +
      `= (2x + ${a} − x − ${b})(2x + ${a} + x + ${b})\n` +
      `= ${factor1}${factor2}.`
  };
});
