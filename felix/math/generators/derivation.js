/**
 * Derivation (1ere).
 */
import { randInt, randNonZero, randChoice, mcq, mcqStrings, distractors, coeff, signedStr, frac, simplify } from './helpers.js';
import { register } from './registry.js';

// ---- helpers locaux ----
function formatPoly(terms) {
  // terms: [{coeff, power}] sorted desc by power
  let s = '';
  for (let i = 0; i < terms.length; i++) {
    const { coeff: c, power: p } = terms[i];
    if (c === 0) continue;
    if (i === 0) {
      if (p === 0) { s += String(c); }
      else if (p === 1) { s += `${coeff(c)}x`; }
      else { s += `${coeff(c)}x${supPow(p)}`; }
    } else {
      if (p === 0) { s += ` ${signedStr(c)}`; }
      else if (p === 1) { s += ` ${signedStr(c)}x`; }
      else { s += ` ${signedStr(c)}x${supPow(p)}`; }
    }
  }
  return s || '0';
}

function supPow(n) {
  const sup = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return String(n).split('').map(c => sup[c] || c).join('');
}

// ---------------------------------------------------------------------------
// deriv-mcq-xn : dérivée de x^n
// ---------------------------------------------------------------------------
register('deriv-mcq-xn', (item) => {
  const n = randInt(2, 7);
  const correct = `${n}x${supPow(n - 1)}`;
  const wrongs = [
    `${n - 1}x${supPow(n)}`,
    `x${supPow(n - 1)}`,
    `${n}x${supPow(n)}`
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Quelle est la dérivée de f(x) = x${supPow(n)} ?`,
    answer,
    choices,
    hint: 'La dérivée de xⁿ est nxⁿ⁻¹.',
    explanation:
      `f(x) = x${supPow(n)} ⟹ f\'(x) = ${n}x${supPow(n - 1)}.`
  };
});

// ---------------------------------------------------------------------------
// deriv-solve-poly : dériver un polynôme ax³+bx²+cx+d
// ---------------------------------------------------------------------------
register('deriv-solve-poly', (item) => {
  const a = randNonZero(3);
  const b = randNonZero(4);
  const c = randNonZero(5);
  const d = randInt(-5, 5);
  const fStr = formatPoly([
    { coeff: a, power: 3 }, { coeff: b, power: 2 },
    { coeff: c, power: 1 }, { coeff: d, power: 0 }
  ]);
  const da = 3 * a, db = 2 * b, dc = c;
  const fpStr = formatPoly([
    { coeff: da, power: 2 }, { coeff: db, power: 1 }, { coeff: dc, power: 0 }
  ]);
  return {
    question: `Calculer f\'(x) pour f(x) = ${fStr}.`,
    answer: `f'(x) = ${fpStr}`,
    hint: 'Dériver terme par terme : (axⁿ)\' = naxⁿ⁻¹.',
    explanation:
      `f\'(x) = 3 × ${a}x² + 2 × ${b}x + ${c}\n` +
      `= ${fpStr}.`
  };
});

// ---------------------------------------------------------------------------
// deriv-mcq-inverse : dérivée de 1/x
// ---------------------------------------------------------------------------
register('deriv-mcq-inverse', (item) => {
  const correct = '−1/x²';
  const wrongs = ['1/x²', '−1/(2x)', 'ln(x)'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Quelle est la dérivée de f(x) = 1/x ?',
    answer,
    choices,
    hint: '1/x = x⁻¹, appliquer la formule (xⁿ)\' = nxⁿ⁻¹.',
    explanation:
      'f(x) = x⁻¹ ⟹ f\'(x) = −1 × x⁻² = −1/x².'
  };
});

// ---------------------------------------------------------------------------
// deriv-solve-product : dériver (ax+b)(cx+d) avec la formule du produit
// ---------------------------------------------------------------------------
register('deriv-solve-product', (item) => {
  const a = randNonZero(4);
  const b = randInt(-5, 5);
  const c = randNonZero(4);
  const d = randInt(-5, 5);
  // (ax+b)(cx+d) = acx² + (ad+bc)x + bd
  // Dérivée de u*v = u'v + uv'
  // u = ax+b, u' = a, v = cx+d, v' = c
  // f'(x) = a(cx+d) + c(ax+b) = 2acx + (ad+bc)
  const coeff2 = 2 * a * c;
  const coeff0 = a * d + b * c;
  const fpStr = formatPoly([
    { coeff: coeff2, power: 1 }, { coeff: coeff0, power: 0 }
  ]);
  const uStr = `(${coeff(a)}x ${signedStr(b)})`;
  const vStr = `(${coeff(c)}x ${signedStr(d)})`;
  return {
    question: `Dériver f(x) = ${uStr}${vStr} en utilisant la formule (uv)\' = u\'v + uv\'.`,
    answer: `f'(x) = ${fpStr}`,
    hint: 'u = ax+b, u\' = a, v = cx+d, v\' = c.',
    explanation:
      `u = ${coeff(a)}x ${signedStr(b)}, u' = ${a}.\n` +
      `v = ${coeff(c)}x ${signedStr(d)}, v' = ${c}.\n` +
      `f'(x) = ${a}(${coeff(c)}x ${signedStr(d)}) + ${c}(${coeff(a)}x ${signedStr(b)})\n` +
      `= ${a * c}x ${signedStr(a * d)} + ${a * c}x ${signedStr(b * c)}\n` +
      `= ${fpStr}.`
  };
});

// ---------------------------------------------------------------------------
// deriv-mcq-zero : f'(x)=0 pour f(x)=ax²+bx+c
// ---------------------------------------------------------------------------
register('deriv-mcq-zero', (item) => {
  const a = randNonZero(3);
  const xCrit = randInt(-4, 4);
  const b = -2 * a * xCrit;
  const c = randInt(-5, 5);
  const correct = xCrit;
  const wrongs = distractors(correct, 3);
  const { choices, answer } = mcq(correct, wrongs);
  const fStr = formatPoly([
    { coeff: a, power: 2 }, { coeff: b, power: 1 }, { coeff: c, power: 0 }
  ]);
  return {
    question: `Pour f(x) = ${fStr}, trouver x tel que f\'(x) = 0.`,
    answer,
    choices,
    hint: 'f\'(x) = 2ax + b = 0.',
    explanation:
      `f'(x) = ${2 * a}x ${signedStr(b)} = 0.\n` +
      `x = ${-b}/${2 * a} = ${xCrit}.`
  };
});

// ---------------------------------------------------------------------------
// deriv-solve-critical : points critiques de x³ − ax
// ---------------------------------------------------------------------------
register('deriv-solve-critical', (item) => {
  // f(x) = x³ - a²x, pour avoir des racines propres de f' = 3x² - a²
  // f'(x) = 3x² - a² = 0 => x = ±a/√3. Pour avoir propre, utilisons f(x) = x³ - 3k²x
  // f'(x) = 3x² - 3k² = 0 => x² = k² => x = ±k
  const k = randInt(1, 4);
  const coef = 3 * k * k;
  return {
    question: `Trouver les points critiques de f(x) = x³ − ${coef}x.`,
    answer: `x = −${k} et x = ${k}`,
    hint: 'Calculer f\'(x) et résoudre f\'(x) = 0.',
    explanation:
      `f'(x) = 3x² − ${coef} = 0.\n` +
      `3x² = ${coef}, x² = ${k * k}.\n` +
      `x = −${k} ou x = ${k}.`
  };
});

// ---------------------------------------------------------------------------
// deriv-mcq-tangent : formule de la tangente
// ---------------------------------------------------------------------------
register('deriv-mcq-tangent', (item) => {
  const correct = 'y = f\'(a)(x − a) + f(a)';
  const wrongs = [
    'y = f(a)(x − a) + f\'(a)',
    'y = f\'(x)(x − a) + f(a)',
    'y = f\'(a)x + f(a)'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Quelle est la formule de la tangente à la courbe de f au point d\'abscisse a ?',
    answer,
    choices,
    hint: 'La tangente a pour pente f\'(a) et passe par (a, f(a)).',
    explanation:
      'La tangente au point d\'abscisse a est :\ny = f\'(a)(x − a) + f(a).\nLa pente est f\'(a), et elle passe par (a, f(a)).'
  };
});

// ---------------------------------------------------------------------------
// deriv-solve-tangent : tangente à x²+c en x=a
// ---------------------------------------------------------------------------
register('deriv-solve-tangent', (item) => {
  const a = randInt(-4, 4);
  const c = randInt(-5, 5);
  // f(x) = x² + c, f'(x) = 2x
  const fa = a * a + c;
  const fpa = 2 * a;
  // y = f'(a)(x-a) + f(a) = 2a(x-a) + a²+c = 2ax - 2a² + a² + c = 2ax - a² + c
  const b = -a * a + c;
  const tangent = `y = ${coeff(fpa)}x ${signedStr(b)}`.replace(/\s+/g, ' ').trim();
  return {
    question: `Calculer l'équation de la tangente à f(x) = x² ${signedStr(c)} au point x = ${a}.`,
    answer: tangent,
    hint: 'y = f\'(a)(x − a) + f(a) avec f\'(x) = 2x.',
    explanation:
      `f(${a}) = ${a}² ${signedStr(c)} = ${fa}.\n` +
      `f'(${a}) = 2 × ${a} = ${fpa}.\n` +
      `T : y = ${fpa}(x − ${a >= 0 ? a : `(${a})`}) + ${fa}\n` +
      `= ${coeff(fpa)}x ${signedStr(-fpa * a)} + ${fa}\n` +
      `= ${tangent}.`
  };
});

// ---------------------------------------------------------------------------
// deriv-mcq-sqrt : dérivée de √x
// ---------------------------------------------------------------------------
register('deriv-mcq-sqrt', (item) => {
  const correct = '1/(2√x)';
  const wrongs = ['2√x', '1/√x', '√x/2'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Quelle est la dérivée de f(x) = √x ?',
    answer,
    choices,
    hint: '√x = x^(1/2), appliquer la formule (xⁿ)\' = nxⁿ⁻¹.',
    explanation:
      'f(x) = x^(1/2) ⟹ f\'(x) = (1/2)x^(−1/2) = 1/(2√x).'
  };
});

// ---------------------------------------------------------------------------
// deriv-solve-chain : dériver (ax+b)² avec la règle de la chaîne
// ---------------------------------------------------------------------------
register('deriv-solve-chain', (item) => {
  const a = randNonZero(4);
  const b = randInt(-5, 5);
  // f(x) = (ax+b)², f'(x) = 2a(ax+b)
  const coeff2a = 2 * a;
  // Développé : f'(x) = 2a(ax+b) = 2a²x + 2ab
  const devA = 2 * a * a;
  const devB = 2 * a * b;
  const fpStr = formatPoly([
    { coeff: devA, power: 1 }, { coeff: devB, power: 0 }
  ]);
  const inner = `${coeff(a)}x ${signedStr(b)}`.replace(/\s+/g, ' ').trim();
  return {
    question: `Dériver f(x) = (${inner})² en utilisant la règle de la chaîne.`,
    answer: `f'(x) = ${coeff2a}(${inner})`,
    hint: '(u²)\' = 2u\'u.',
    explanation:
      `u = ${inner}, u' = ${a}.\n` +
      `f'(x) = 2 × ${a} × (${inner}) = ${coeff2a}(${inner}).\n` +
      `Sous forme développée : ${fpStr}.`
  };
});
