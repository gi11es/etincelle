/**
 * Developper et factoriser (4eme).
 */
import { randInt, randNonZero, randChoice, mcq, mcqStrings, gcd, signedStr, coeff } from './helpers.js';
import { register } from './registry.js';

/** Format a polynomial term: coefficient * x^power */
function term(c, varName = 'x', power = 1) {
  if (c === 0) return '';
  if (power === 0) return String(c);
  const absC = Math.abs(c);
  const sign = c < 0 ? '−' : '';
  const coeffStr = absC === 1 ? '' : String(absC);
  const varPart = power === 1 ? varName : `${varName}²`;
  return `${sign}${coeffStr}${varPart}`;
}

/** Format ax + b as a string */
function formatLinear(a, b) {
  let s = '';
  // ax part
  if (a === 1) s = 'x';
  else if (a === -1) s = '−x';
  else s = `${a}x`;
  // + b part
  if (b > 0) s += ` + ${b}`;
  else if (b < 0) s += ` − ${Math.abs(b)}`;
  return s;
}

/** Format ax² + bx + c as a string */
function formatQuadratic(a, b, c) {
  let parts = [];
  // ax² part
  if (a !== 0) {
    if (a === 1) parts.push('x²');
    else if (a === -1) parts.push('−x²');
    else parts.push(`${a}x²`);
  }
  // bx part
  if (b !== 0) {
    if (parts.length > 0) {
      if (b > 0) parts.push(`+ ${b === 1 ? '' : b}x`);
      else parts.push(`− ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`);
    } else {
      if (b === 1) parts.push('x');
      else if (b === -1) parts.push('−x');
      else parts.push(`${b}x`);
    }
  }
  // c part
  if (c !== 0) {
    if (parts.length > 0) {
      if (c > 0) parts.push(`+ ${c}`);
      else parts.push(`− ${Math.abs(c)}`);
    } else {
      parts.push(String(c));
    }
  }
  return parts.join(' ') || '0';
}

// ---------------------------------------------------------------------------
// dev-solve-simple : a(bx + c)  develop
// ---------------------------------------------------------------------------
register('dev-solve-simple', (item) => {
  const a = randNonZero(6);
  const b = randNonZero(6);
  const c = randNonZero(9);
  const resB = a * b;
  const resC = a * c;
  const result = formatLinear(resB, resC);
  return {
    question: `Developpe : ${a}(${formatLinear(b, c)})`,
    answer: result,
    hint: 'Multiplie chaque terme dans la parenthese par le facteur.',
    explanation:
      `${a} × ${b === 1 ? '' : b === -1 ? '(−1)' : b}x = ${resB}x.\n` +
      `${a} × ${c > 0 ? c : `(${c})`} = ${resC}.\n` +
      `Resultat : ${result}.`
  };
});

// ---------------------------------------------------------------------------
// dev-mcq-double : (x + a)(x + b) develop MCQ
// ---------------------------------------------------------------------------
register('dev-mcq-double', (item) => {
  const a = randNonZero(7);
  const b = randNonZero(7);
  const coeffX2 = 1;
  const coeffX = a + b;
  const constant = a * b;
  const correctStr = formatQuadratic(coeffX2, coeffX, constant);

  // Common mistakes
  const wrong1 = formatQuadratic(1, a + b, 0);        // forgot constant
  const wrong2 = formatQuadratic(1, 0, a * b);         // forgot middle term
  const wrong3 = formatQuadratic(1, a * b, a + b);     // swapped middle and constant

  const wrongs = [wrong1, wrong2, wrong3].filter(w => w !== correctStr);
  while (wrongs.length < 3) wrongs.push(formatQuadratic(1, coeffX + 1, constant));
  const { choices, answer } = mcqStrings(correctStr, wrongs.slice(0, 3));

  const aStr = a > 0 ? `+ ${a}` : `− ${Math.abs(a)}`;
  const bStr = b > 0 ? `+ ${b}` : `− ${Math.abs(b)}`;
  return {
    question: `Developpe : (x ${aStr})(x ${bStr})`,
    answer,
    choices,
    hint: 'Utilise la double distributivite : chaque terme du premier facteur multiplie chaque terme du second.',
    explanation:
      `(x ${aStr})(x ${bStr}) = x² ${signedStr(b)}x ${signedStr(a)}x ${signedStr(a * b)}\n` +
      `= x² ${signedStr(a + b)}x ${signedStr(a * b)}\n` +
      `= ${correctStr}.`
  };
});

// ---------------------------------------------------------------------------
// dev-solve-factor : ax + ab  factorize (find GCD factor)
// ---------------------------------------------------------------------------
register('dev-solve-factor', (item) => {
  const k = randInt(2, 8);
  let a = randInt(2, 9);
  let b = randInt(2, 9);
  // Ensure a and b are coprime so k is the actual GCD
  while (gcd(a, b) !== 1) b = randInt(2, 9);
  // Expression: k*a*x + k*b = k(ax + b)
  const termX = k * a;
  const termC = k * b;
  const result = `${k}(${formatLinear(a, b)})`;
  return {
    question: `Factorise : ${termX}x + ${termC}`,
    answer: result,
    hint: `Cherche le plus grand facteur commun de ${termX} et ${termC}.`,
    explanation:
      `PGCD(${termX}, ${termC}) = ${k}.\n` +
      `${termX}x + ${termC} = ${k} × ${a}x + ${k} × ${b} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// dev-mcq-double-coeff : (ax + b)(cx + d) develop MCQ
// ---------------------------------------------------------------------------
register('dev-mcq-double-coeff', (item) => {
  const a = randInt(2, 4);
  const b = randNonZero(5);
  const c = randInt(2, 4);
  const d = randNonZero(5);
  const coeffX2 = a * c;
  const coeffX = a * d + b * c;
  const constant = b * d;
  const correctStr = formatQuadratic(coeffX2, coeffX, constant);

  const wrong1 = formatQuadratic(a * c, a * d, b * d);     // forgot b*c term
  const wrong2 = formatQuadratic(a + c, b + d, 0);         // added instead of multiplied
  const wrong3 = formatQuadratic(a * c, coeffX + 1, constant);
  const wrongs = [wrong1, wrong2, wrong3].filter(w => w !== correctStr);
  while (wrongs.length < 3) wrongs.push(formatQuadratic(coeffX2, coeffX - 1, constant));
  const { choices, answer } = mcqStrings(correctStr, wrongs.slice(0, 3));

  return {
    question: `Developpe : (${formatLinear(a, b)})(${formatLinear(c, d)})`,
    answer,
    choices,
    hint: 'Double distributivite : chaque terme du premier facteur multiplie chaque terme du second.',
    explanation:
      `${a}x × ${c}x = ${a * c}x².\n` +
      `${a}x × ${d > 0 ? d : `(${d})`} = ${a * d}x.\n` +
      `${b > 0 ? b : `(${b})`} × ${c}x = ${b * c}x.\n` +
      `${b > 0 ? b : `(${b})`} × ${d > 0 ? d : `(${d})`} = ${b * d}.\n` +
      `Total : ${correctStr}.`
  };
});

// ---------------------------------------------------------------------------
// dev-solve-factor-x : ax² + bx  factorize
// ---------------------------------------------------------------------------
register('dev-solve-factor-x', (item) => {
  const a = randInt(2, 8);
  const b = randInt(2, 8);
  const g = gcd(a, b);
  const result = `${g}x(${formatLinear(a / g, b / g)})`;
  // simplify if a/g = 1 -> just x
  const innerA = a / g;
  const innerB = b / g;
  let resultStr;
  if (g === 1) {
    resultStr = `x(${formatLinear(a, b)})`;
  } else {
    resultStr = `${g}x(${formatLinear(innerA, innerB)})`;
  }
  return {
    question: `Factorise : ${a}x² + ${b}x`,
    answer: resultStr,
    hint: 'x est un facteur commun. Cherche aussi le PGCD des coefficients.',
    explanation:
      `Facteur commun : x (present dans les deux termes).\n` +
      `PGCD(${a}, ${b}) = ${g}.\n` +
      `${a}x² + ${b}x = ${resultStr}.`
  };
});

// ---------------------------------------------------------------------------
// dev-mcq-diff-squares : (x+a)² - (x+b)²  develop and reduce MCQ
// ---------------------------------------------------------------------------
register('dev-mcq-diff-squares', (item) => {
  const a = randInt(1, 6);
  let b = randInt(1, 6);
  while (b === a) b = randInt(1, 6);
  const aVal = a;
  const bVal = b;
  // (x+a)² = x² + 2ax + a²
  // (x+b)² = x² + 2bx + b²
  // Difference = 2(a-b)x + (a²-b²) = 2(a-b)x + (a-b)(a+b) = (a-b)(2x + a + b)
  const coeffX = 2 * (aVal - bVal);
  const constant = aVal * aVal - bVal * bVal;
  const correctStr = formatLinear(coeffX, constant);

  const wrong1 = formatQuadratic(0, 2 * aVal - 2 * bVal, 0);  // forgot constants
  const wrong2 = formatLinear(coeffX, -constant);                // sign error
  const wrong3 = formatLinear(2 * aVal + 2 * bVal, constant);  // added instead of subtracted
  const wrongs = [wrong1, wrong2, wrong3].filter(w => w !== correctStr);
  while (wrongs.length < 3) wrongs.push(formatLinear(coeffX + 1, constant));
  const { choices, answer } = mcqStrings(correctStr, wrongs.slice(0, 3));
  return {
    question: `Developpe et reduis : (x + ${aVal})² − (x + ${bVal})²`,
    answer,
    choices,
    hint: 'Developpe chaque carre, puis soustrait.',
    explanation:
      `(x + ${aVal})² = x² + ${2 * aVal}x + ${aVal * aVal}.\n` +
      `(x + ${bVal})² = x² + ${2 * bVal}x + ${bVal * bVal}.\n` +
      `Difference : ${2 * aVal}x + ${aVal * aVal} − ${2 * bVal}x − ${bVal * bVal}\n` +
      `= ${coeffX}x ${constant >= 0 ? '+ ' + constant : '− ' + Math.abs(constant)}\n` +
      `= ${correctStr}.`
  };
});

// ---------------------------------------------------------------------------
// dev-solve-factor-two-var : ax²y + bxy²  factorize
// ---------------------------------------------------------------------------
register('dev-solve-factor-two-var', (item) => {
  const a = randInt(2, 8);
  const b = randInt(2, 8);
  const g = gcd(a, b);
  const innerA = a / g;
  const innerB = b / g;
  // ax²y + bxy² = gxy(inner_a * x + inner_b * y)
  let innerStr;
  if (innerA === 1) innerStr = 'x';
  else innerStr = `${innerA}x`;
  if (innerB === 1) innerStr += ' + y';
  else innerStr += ` + ${innerB}y`;

  const factorStr = g === 1 ? 'xy' : `${g}xy`;
  const result = `${factorStr}(${innerStr})`;
  return {
    question: `Factorise : ${a}x²y + ${b}xy²`,
    answer: result,
    hint: 'Cherche les facteurs communs en x, y et dans les coefficients.',
    explanation:
      `Facteurs communs : xy (present dans les deux termes) et ${g} (PGCD des coefficients).\n` +
      `${a}x²y + ${b}xy² = ${factorStr} × ${innerA}x + ${factorStr} × ${innerB}y = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// dev-mcq-distribute : a(bx + c) + d(ex + f) develop and reduce MCQ
// ---------------------------------------------------------------------------
register('dev-mcq-distribute', (item) => {
  const a = randInt(2, 5);
  const b = randNonZero(4);
  const c = randNonZero(6);
  const d = randInt(2, 5);
  const e = randNonZero(4);
  const f = randNonZero(6);
  const coeffX = a * b + d * e;
  const constant = a * c + d * f;
  const correctStr = formatLinear(coeffX, constant);

  const wrong1 = formatLinear(a * b + d * e + 1, constant);       // off by one in x
  const wrong2 = formatLinear(a + b + d + e, a * c + d * f);      // added coefficients
  const wrong3 = formatLinear(coeffX, a * c - d * f);             // subtracted instead of added
  const wrongs = [wrong1, wrong2, wrong3].filter(w => w !== correctStr);
  while (wrongs.length < 3) wrongs.push(formatLinear(coeffX - 1, constant));

  const expr1 = `${a}(${formatLinear(b, c)})`;
  const expr2 = `${d}(${formatLinear(e, f)})`;
  const { choices, answer } = mcqStrings(correctStr, wrongs.slice(0, 3));
  return {
    question: `Developpe et reduis : ${expr1} + ${expr2}`,
    answer,
    choices,
    hint: 'Developpe chaque produit separement, puis regroupe les termes semblables.',
    explanation:
      `${expr1} = ${a * b}x ${signedStr(a * c)}.\n` +
      `${expr2} = ${d * e}x ${signedStr(d * f)}.\n` +
      `Total : ${a * b}x ${signedStr(d * e)}x ${signedStr(a * c)} ${signedStr(d * f)}\n` +
      `= ${coeffX}x ${signedStr(constant)} = ${correctStr}.`
  };
});
