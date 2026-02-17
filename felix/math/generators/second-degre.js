/**
 * Polynome du second degre (1ere).
 */
import { randInt, randNonZero, randChoice, mcq, mcqStrings, distractors, simplify, frac, coeff, signedStr, gcd } from './helpers.js';
import { register } from './registry.js';

// ---- helpers locaux ----
function formatTrinomial(a, b, c) {
  let s = `${coeff(a)}x²`;
  if (b !== 0) s += ` ${signedStr(b)}x`;
  if (c !== 0) s += ` ${signedStr(c)}`;
  return s;
}

// ---------------------------------------------------------------------------
// poly-solve-discriminant : calculer le discriminant
// ---------------------------------------------------------------------------
register('poly-solve-discriminant', (item) => {
  const a = randNonZero(4);
  const b = randInt(-6, 6);
  const c = randInt(-6, 6);
  const delta = b * b - 4 * a * c;
  return {
    question: `Calculer le discriminant de ${formatTrinomial(a, b, c)} = 0.`,
    answer: String(delta),
    hint: 'Δ = b² − 4ac.',
    explanation:
      `Δ = (${b})² − 4 × ${a >= 0 ? a : `(${a})`} × ${c >= 0 ? c : `(${c})`}\n` +
      `Δ = ${b * b} − ${4 * a * c >= 0 ? 4 * a * c : `(${4 * a * c})`} = ${delta}.`
  };
});

// ---------------------------------------------------------------------------
// poly-mcq-solutions : nombre de solutions selon Δ
// ---------------------------------------------------------------------------
register('poly-mcq-solutions', (item) => {
  const scenario = randChoice(['pos', 'zero', 'neg']);
  let a, b, c, delta;
  if (scenario === 'pos') {
    // Δ > 0 : choisir deux racines entières
    const r1 = randInt(-5, 5), r2 = randInt(-5, 5);
    if (r1 === r2) { /* on force différence */ }
    a = 1; b = -(r1 + r2); c = r1 * r2;
    delta = b * b - 4 * a * c;
    if (delta <= 0) { a = 1; b = 3; c = -4; delta = 9 + 16; }
  } else if (scenario === 'zero') {
    const r = randInt(-4, 4);
    a = 1; b = -2 * r; c = r * r;
    delta = 0;
  } else {
    a = 1; b = randInt(-3, 3); c = b * b + randInt(1, 5);
    delta = b * b - 4 * c;
  }
  const nbSol = delta > 0 ? 2 : delta === 0 ? 1 : 0;
  const correct = `${nbSol} solution${nbSol > 1 ? 's' : nbSol === 0 ? '' : ''}`;
  const options = ['2 solutions', '1 solution', '0 solution'];
  const wrongs = options.filter(o => o !== correct);
  wrongs.push('Impossible à déterminer');
  const { choices, answer } = mcqStrings(correct, wrongs.slice(0, 3));
  return {
    question: `Combien de solutions réelles a l'équation ${formatTrinomial(a, b, c)} = 0 ?`,
    answer,
    choices,
    hint: 'Calculer Δ = b² − 4ac et regarder son signe.',
    explanation:
      `Δ = ${b}² − 4 × ${a} × ${c} = ${delta}.\n` +
      (delta > 0 ? 'Δ > 0 : deux solutions réelles distinctes.'
        : delta === 0 ? 'Δ = 0 : une solution réelle double.'
        : 'Δ < 0 : aucune solution réelle.')
  };
});

// ---------------------------------------------------------------------------
// poly-solve-two-roots : résoudre ax²+bx+c=0 (Δ>0)
// ---------------------------------------------------------------------------
register('poly-solve-two-roots', (item) => {
  const r1 = randInt(-5, 5);
  let r2;
  do { r2 = randInt(-5, 5); } while (r2 === r1);
  const a = 1;
  const b = -(r1 + r2);
  const c = r1 * r2;
  const delta = b * b - 4 * a * c;
  const sR1 = Math.min(r1, r2), sR2 = Math.max(r1, r2);
  return {
    question: `Résoudre : ${formatTrinomial(a, b, c)} = 0.`,
    answer: `x = ${sR1} ou x = ${sR2}`,
    hint: 'Calculer Δ, puis x = (−b ± √Δ) / (2a).',
    explanation:
      `Δ = (${b})² − 4 × 1 × ${c >= 0 ? c : `(${c})`} = ${delta}.\n` +
      `√Δ = ${Math.sqrt(delta)}.\n` +
      `x₁ = (${-b} − ${Math.sqrt(delta)}) / 2 = ${sR1}.\n` +
      `x₂ = (${-b} + ${Math.sqrt(delta)}) / 2 = ${sR2}.`
  };
});

// ---------------------------------------------------------------------------
// poly-mcq-no-solution : Δ < 0, combien de solutions ?
// ---------------------------------------------------------------------------
register('poly-mcq-no-solution', (item) => {
  const a = randChoice([1, 2]);
  const b = randInt(-3, 3);
  const minC = Math.ceil((b * b) / (4 * a)) + 1;
  const c = minC + randInt(0, 3);
  const delta = b * b - 4 * a * c;
  const correct = '0';
  const wrongs = ['1', '2', '−1'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Combien de solutions réelles a l'équation ${formatTrinomial(a, b, c)} = 0 ?`,
    answer,
    choices,
    hint: 'Calculer le discriminant.',
    explanation:
      `Δ = (${b})² − 4 × ${a} × ${c} = ${delta} < 0.\n` +
      `Le discriminant est négatif : aucune solution réelle.`
  };
});

// ---------------------------------------------------------------------------
// poly-solve-sommet : sommet de la parabole
// ---------------------------------------------------------------------------
register('poly-solve-sommet', (item) => {
  const a = randNonZero(3);
  // Choisir b tel que -b/(2a) soit un entier ou une fraction simple
  const xS = randInt(-4, 4);
  const b = -2 * a * xS;
  const c = randInt(-5, 5);
  const yS = a * xS * xS + b * xS + c;
  return {
    question: `Trouver les coordonnées du sommet de la parabole f(x) = ${formatTrinomial(a, b, c)}.`,
    answer: `(${xS} ; ${yS})`,
    hint: 'x_S = −b/(2a), puis y_S = f(x_S).',
    explanation:
      `x_S = −(${b}) / (2 × ${a}) = ${-b} / ${2 * a} = ${xS}.\n` +
      `y_S = f(${xS}) = ${a} × (${xS})² ${signedStr(b)} × ${xS >= 0 ? xS : `(${xS})`} ${signedStr(c)} = ${yS}.\n` +
      `Sommet : (${xS} ; ${yS}).`
  };
});

// ---------------------------------------------------------------------------
// poly-mcq-signe : signe du trinôme
// ---------------------------------------------------------------------------
register('poly-mcq-signe', (item) => {
  const a = randChoice([1, -1, 2, -2]);
  const r1 = randInt(-4, 0);
  const r2 = randInt(1, 5);
  const b = -a * (r1 + r2);
  const c = a * r1 * r2;
  const signA = a > 0 ? 'positif' : 'négatif';
  const correct = a > 0
    ? `Positif sur ]−∞ ; ${r1}[ ∪ ]${r2} ; +∞[, négatif sur ]${r1} ; ${r2}[`
    : `Négatif sur ]−∞ ; ${r1}[ ∪ ]${r2} ; +∞[, positif sur ]${r1} ; ${r2}[`;
  const wrongs = [
    a > 0
      ? `Négatif sur ]−∞ ; ${r1}[ ∪ ]${r2} ; +∞[, positif sur ]${r1} ; ${r2}[`
      : `Positif sur ]−∞ ; ${r1}[ ∪ ]${r2} ; +∞[, négatif sur ]${r1} ; ${r2}[`,
    'Toujours positif',
    'Toujours négatif'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Quel est le signe de f(x) = ${formatTrinomial(a, b, c)} ?`,
    answer,
    choices,
    hint: 'Trouver les racines, puis utiliser le signe de a.',
    explanation:
      `Racines : x₁ = ${r1}, x₂ = ${r2}.\n` +
      `a = ${a} ${a > 0 ? '> 0' : '< 0'}.\n` +
      `Le trinôme est du signe de a à l'extérieur des racines et du signe opposé entre les racines.`
  };
});

// ---------------------------------------------------------------------------
// poly-solve-factorize : factoriser avec Δ = 0
// ---------------------------------------------------------------------------
register('poly-solve-factorize', (item) => {
  const a = randChoice([1, 2, -1]);
  const r = randInt(-5, 5);
  const b = -2 * a * r;
  const c = a * r * r;
  const factored = a === 1
    ? `(x ${signedStr(-r)})²`
    : a === -1
      ? `−(x ${signedStr(-r)})²`
      : `${a}(x ${signedStr(-r)})²`;
  return {
    question: `Factoriser : ${formatTrinomial(a, b, c)}.`,
    answer: factored,
    hint: 'Δ = 0 signifie une racine double : a(x − r)².',
    explanation:
      `Δ = (${b})² − 4 × ${a} × ${c} = ${b * b - 4 * a * c} = 0.\n` +
      `Racine double : r = ${r}.\n` +
      `Factorisation : ${factored}.`
  };
});

// ---------------------------------------------------------------------------
// poly-mcq-viete : produit des racines par Viète
// ---------------------------------------------------------------------------
register('poly-mcq-viete', (item) => {
  const a = randChoice([1, 2, 3]);
  const r1 = randInt(-5, 5), r2 = randInt(-5, 5);
  const b = -a * (r1 + r2);
  const c = a * r1 * r2;
  const product = r1 * r2;
  const ratio = frac(c, a);
  const correct = ratio;
  const wrongs = distractors(product, 3);
  const { choices, answer } = mcq(product, wrongs);
  return {
    question: `Par les relations de Viète, quel est le produit des racines de ${formatTrinomial(a, b, c)} = 0 ?`,
    answer,
    choices,
    hint: 'Produit des racines = c/a.',
    explanation:
      `Par Viète, x₁ × x₂ = c/a = ${c}/${a} = ${ratio}.`
  };
});

// ---------------------------------------------------------------------------
// poly-solve-square-eq : résoudre (x−a)² = b²
// ---------------------------------------------------------------------------
register('poly-solve-square-eq', (item) => {
  const a = randInt(-5, 5);
  const b = randInt(1, 6);
  const s1 = a + b, s2 = a - b;
  const mn = Math.min(s1, s2), mx = Math.max(s1, s2);
  return {
    question: `Résoudre : (x − ${a >= 0 ? a : `(${a})`})² = ${b * b}.`,
    answer: `x = ${mn} ou x = ${mx}`,
    hint: 'A² = B² ⟺ A = B ou A = −B.',
    explanation:
      `(x − ${a})² = ${b}² ⟺ x − ${a} = ${b} ou x − ${a} = −${b}.\n` +
      `x = ${a} + ${b} = ${s1} ou x = ${a} − ${b} = ${s2}.\n` +
      `Solutions : x = ${mn} ou x = ${mx}.`
  };
});

// ---------------------------------------------------------------------------
// poly-mcq-k-double : trouver k pour une racine double
// ---------------------------------------------------------------------------
register('poly-mcq-k-double', (item) => {
  // x² + kx + c = 0 a racine double si Δ = k² - 4c = 0, donc k = ±2√c
  const r = randInt(-4, 4);
  const c = r * r;
  const k = -2 * r;
  // Trinôme : x² + kx + c
  const correct = k;
  const wrongs = distractors(correct, 3);
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Pour quelle valeur de k l'équation x² ${signedStr(k)}·x + ${c} = 0 admet une racine double ?`,
    answer,
    choices,
    hint: 'Racine double ⟺ Δ = 0 ⟺ k² − 4c = 0.',
    explanation:
      `Δ = k² − 4 × ${c} = 0.\n` +
      `k² = ${4 * c}, k = ±${Math.abs(k)}.\n` +
      `La valeur proposée est k = ${k}.`
  };
});
