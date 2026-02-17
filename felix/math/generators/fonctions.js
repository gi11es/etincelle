/**
 * Fonctions lineaires/affines (3eme) + Fonctions de reference (2nde).
 */
import { randInt, randNonZero, randChoice, mcq, mcqStrings, distractors, simplify, frac, coeff, signedStr, round } from './helpers.js';
import { register } from './registry.js';

// ---- helpers locaux ----
function formatAffine(a, b) {
  const ax = `${coeff(a)}x`;
  if (b === 0) return ax;
  return `${ax} ${signedStr(b)}`;
}

// ---------------------------------------------------------------------------
// fonc-mcq-lineaire : f(x)=ax, est-ce lineaire ou affine ? MCQ
// ---------------------------------------------------------------------------
register('fonc-mcq-lineaire', (item) => {
  const a = randNonZero(5);
  const b = randChoice([0, randNonZero(5)]);
  const expr = b === 0 ? `f(x) = ${coeff(a)}x` : `f(x) = ${formatAffine(a, b)}`;
  const isLinear = b === 0;
  const correct = isLinear ? 'Linéaire' : 'Affine (non linéaire)';
  const wrongs = isLinear
    ? ['Affine (non linéaire)', 'Constante', 'Ni linéaire ni affine']
    : ['Linéaire', 'Constante', 'Ni linéaire ni affine'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `La fonction ${expr} est :`,
    answer,
    choices,
    hint: 'Une fonction linéaire est de la forme f(x) = ax (passe par l\'origine).',
    explanation: isLinear
      ? `f(x) = ${coeff(a)}x est de la forme ax, c'est une fonction linéaire.`
      : `f(x) = ${formatAffine(a, b)} a une ordonnée à l'origine b = ${b} ≠ 0, c'est affine mais pas linéaire.`
  };
});

// ---------------------------------------------------------------------------
// fonc-solve-affine : déterminer f(x)=ax+b à partir de f(0) et f(k)
// ---------------------------------------------------------------------------
register('fonc-solve-affine', (item) => {
  const a = randNonZero(5);
  const b = randInt(-5, 5);
  const k = randInt(1, 5);
  const fk = a * k + b;
  return {
    question: `On sait que f(0) = ${b} et f(${k}) = ${fk}. Déterminer f(x) sous la forme ax + b.`,
    answer: `f(x) = ${formatAffine(a, b)}`,
    hint: 'f(0) donne directement b, puis a = (f(k) − b) / k.',
    explanation:
      `f(0) = b = ${b}.\n` +
      `f(${k}) = ${k}a + ${b} = ${fk}, donc ${k}a = ${fk - b}, a = ${frac(fk - b, k)}.\n` +
      `Ainsi f(x) = ${formatAffine(a, b)}.`
  };
});

// ---------------------------------------------------------------------------
// fonc-mcq-intersection : intersection de deux droites
// ---------------------------------------------------------------------------
register('fonc-mcq-intersection', (item) => {
  const a1 = randNonZero(4);
  let a2;
  do { a2 = randNonZero(4); } while (a2 === a1);
  const x0 = randInt(-3, 3);
  const b1 = randInt(-5, 5);
  const b2 = a1 * x0 + b1 - a2 * x0; // ensure intersection at x0
  const y0 = a1 * x0 + b1;
  const correct = `(${x0} ; ${y0})`;
  const wrongs = [
    `(${x0 + 1} ; ${y0})`,
    `(${x0} ; ${y0 + 1})`,
    `(${x0 - 1} ; ${y0 - 1})`
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Quel est le point d'intersection de y = ${formatAffine(a1, b1)} et y = ${formatAffine(a2, b2)} ?`,
    answer,
    choices,
    hint: 'Résoudre a₁x + b₁ = a₂x + b₂.',
    explanation:
      `${coeff(a1)}x ${signedStr(b1)} = ${coeff(a2)}x ${signedStr(b2)}.\n` +
      `${a1 - a2}x = ${b2 - b1}, x = ${x0}.\n` +
      `y = ${a1} × ${x0} ${signedStr(b1)} = ${y0}.\nIntersection : (${x0} ; ${y0}).`
  };
});

// ---------------------------------------------------------------------------
// fonc-solve-pente : pente à partir de deux points
// ---------------------------------------------------------------------------
register('fonc-solve-pente', (item) => {
  const x1 = randInt(-3, 3);
  let x2;
  do { x2 = randInt(-3, 3); } while (x2 === x1);
  const y1 = randInt(-5, 5);
  const y2 = randInt(-5, 5);
  const [num, den] = simplify(y2 - y1, x2 - x1);
  const ans = frac(y2 - y1, x2 - x1);
  return {
    question: `Calculer la pente de la droite passant par A(${x1} ; ${y1}) et B(${x2} ; ${y2}).`,
    answer: ans,
    hint: 'Pente = (y₂ − y₁) / (x₂ − x₁).',
    explanation:
      `m = (${y2} − ${y1 >= 0 ? y1 : `(${y1})`}) / (${x2} − ${x1 >= 0 ? x1 : `(${x1})`}) = ${y2 - y1} / ${x2 - x1} = ${ans}.`
  };
});

// ---------------------------------------------------------------------------
// fonc-mcq-decroissante : croissante ou décroissante ?
// ---------------------------------------------------------------------------
register('fonc-mcq-decroissante', (item) => {
  const a = randNonZero(5);
  const b = randInt(-5, 5);
  const growing = a > 0;
  const correct = growing ? 'Croissante' : 'Décroissante';
  const wrongs = growing
    ? ['Décroissante', 'Constante', 'On ne peut pas savoir']
    : ['Croissante', 'Constante', 'On ne peut pas savoir'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `La fonction f(x) = ${formatAffine(a, b)} est :`,
    answer,
    choices,
    hint: 'Le signe du coefficient directeur détermine le sens de variation.',
    explanation:
      `Le coefficient directeur est a = ${a}.\n` +
      (growing
        ? `a > 0 donc f est croissante.`
        : `a < 0 donc f est décroissante.`)
  };
});

// ---------------------------------------------------------------------------
// fonc-solve-taxi : problème du taxi
// ---------------------------------------------------------------------------
register('fonc-solve-taxi', (item) => {
  const prixKm = randChoice([1, 2, 3]);
  const prixFixe = randChoice([2, 3, 5, 7]);
  return {
    question: `Un taxi facture ${prixFixe} € de prise en charge plus ${prixKm} € par km. Écrire f(x) le prix en fonction du nombre de km x.`,
    answer: `f(x) = ${coeff(prixKm)}x + ${prixFixe}`,
    hint: 'Le prix fixe est l\'ordonnée à l\'origine, le prix/km est le coefficient directeur.',
    explanation:
      `Prix fixe = ${prixFixe} € (ordonnée à l'origine).\n` +
      `Prix par km = ${prixKm} € (coefficient directeur).\n` +
      `Donc f(x) = ${coeff(prixKm)}x + ${prixFixe}.`
  };
});

// ---------------------------------------------------------------------------
// fonc-mcq-point-on-line : le point appartient-il à la droite ?
// ---------------------------------------------------------------------------
register('fonc-mcq-point-on-line', (item) => {
  const a = randNonZero(4);
  const b = randInt(-5, 5);
  const onLine = randChoice([true, false]);
  const x0 = randInt(-3, 3);
  const yTrue = a * x0 + b;
  const y0 = onLine ? yTrue : yTrue + randChoice([-1, 1, 2, -2]);
  const correct = onLine ? 'Oui' : 'Non';
  const wrongs = onLine
    ? ['Non', 'Seulement si a > 0', 'On ne peut pas savoir']
    : ['Oui', 'Seulement si b = 0', 'On ne peut pas savoir'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Le point (${x0} ; ${y0}) appartient-il à la droite y = ${formatAffine(a, b)} ?`,
    answer,
    choices,
    hint: 'Remplacer x par la valeur et vérifier si on obtient y.',
    explanation:
      `f(${x0}) = ${a} × ${x0 >= 0 ? x0 : `(${x0})`} ${signedStr(b)} = ${yTrue}.\n` +
      (onLine
        ? `${yTrue} = ${y0}, donc oui, le point est sur la droite.`
        : `${yTrue} ≠ ${y0}, donc non, le point n'est pas sur la droite.`)
  };
});

// ---------------------------------------------------------------------------
// fonc-solve-find-a : trouver a sachant que la droite passe par un point
// ---------------------------------------------------------------------------
register('fonc-solve-find-a', (item) => {
  const a = randNonZero(5);
  const b = randInt(-5, 5);
  const x0 = randNonZero(4);
  const y0 = a * x0 + b;
  return {
    question: `La droite y = ax ${signedStr(b)} passe par le point (${x0} ; ${y0}). Trouver a.`,
    answer: String(a),
    hint: 'Remplacer x et y par les coordonnées du point, puis isoler a.',
    explanation:
      `${y0} = a × ${x0} ${signedStr(b)}.\n` +
      `a × ${x0} = ${y0 - b}.\n` +
      `a = ${y0 - b} / ${x0} = ${a}.`
  };
});

// ---------------------------------------------------------------------------
// fonc-mcq-perpendicular : deux pentes perpendiculaires ?
// ---------------------------------------------------------------------------
register('fonc-mcq-perpendicular', (item) => {
  const a = randNonZero(4);
  const isPerp = randChoice([true, false]);
  let b;
  if (isPerp) {
    // on veut a*b = -1, donc b = -1/a. On prend a parmi ±1,±2,±3 pour avoir des fractions simples
    const aVal = randChoice([1, -1, 2, -2, 3, -3]);
    const bNum = aVal > 0 ? -1 : 1;
    const bDen = Math.abs(aVal);
    const correct = 'Oui';
    const wrongs = ['Non', 'Seulement si a = 1', 'On ne peut pas savoir'];
    const { choices, answer } = mcqStrings(correct, wrongs);
    return {
      question: `Les droites de pentes ${aVal} et ${frac(bNum, bDen)} sont-elles perpendiculaires ?`,
      answer,
      choices,
      hint: 'Deux droites sont perpendiculaires si le produit de leurs pentes vaut −1.',
      explanation:
        `${aVal} × (${frac(bNum, bDen)}) = −1.\nLe produit des pentes vaut −1, elles sont perpendiculaires.`
    };
  } else {
    b = randNonZero(4);
    while (a * b === -1) { b = randNonZero(4); }
    const correct = 'Non';
    const wrongs = ['Oui', 'Seulement si a = b', 'On ne peut pas savoir'];
    const { choices, answer } = mcqStrings(correct, wrongs);
    return {
      question: `Les droites de pentes ${a} et ${b} sont-elles perpendiculaires ?`,
      answer,
      choices,
      hint: 'Deux droites sont perpendiculaires si le produit de leurs pentes vaut −1.',
      explanation:
        `${a} × ${b >= 0 ? b : `(${b})`} = ${a * b} ≠ −1.\nElles ne sont pas perpendiculaires.`
    };
  }
});

// ---------------------------------------------------------------------------
// fonc-solve-antecedent : antécédent de 0
// ---------------------------------------------------------------------------
register('fonc-solve-antecedent', (item) => {
  const a = randNonZero(5);
  const b = randInt(-10, 10);
  // f(x)=ax+b=0 => x=-b/a
  const [num, den] = simplify(-b, a);
  const ans = frac(-b, a);
  return {
    question: `Trouver l'antécédent de 0 par la fonction f(x) = ${formatAffine(a, b)}.`,
    answer: ans,
    hint: 'Résoudre f(x) = 0.',
    explanation:
      `f(x) = 0 ⟺ ${coeff(a)}x ${signedStr(b)} = 0 ⟺ x = ${b === 0 ? '0' : `${-b}/${a} = ${ans}`}.`
  };
});

// ---------------------------------------------------------------------------
// fref-mcq-carre : image de −a par la fonction carré
// ---------------------------------------------------------------------------
register('fref-mcq-carre', (item) => {
  const a = randInt(2, 9);
  const correct = a * a;
  const wrongs = distractors(correct, 3, { positive: true });
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Quelle est l'image de −${a} par la fonction carré ?`,
    answer,
    choices,
    hint: 'Le carré d\'un nombre négatif est positif.',
    explanation:
      `f(−${a}) = (−${a})² = ${a * a}.\nLe carré d'un nombre négatif est toujours positif.`
  };
});

// ---------------------------------------------------------------------------
// fref-solve-inverse : f(−1/a) pour f(x)=1/x
// ---------------------------------------------------------------------------
register('fref-solve-inverse', (item) => {
  const a = randChoice([2, 3, 4, 5]);
  const ans = String(-a);
  return {
    question: `Calculer f(−1/${a}) pour la fonction inverse f(x) = 1/x.`,
    answer: ans,
    hint: 'f(x) = 1/x, donc f(−1/a) = 1/(−1/a).',
    explanation:
      `f(−1/${a}) = 1/(−1/${a}) = −${a}.\nL'inverse de −1/${a} est −${a}.`
  };
});

// ---------------------------------------------------------------------------
// fref-mcq-racine-domain : domaine de définition de √x
// ---------------------------------------------------------------------------
register('fref-mcq-racine-domain', (item) => {
  const correct = '[0 ; +∞[';
  const wrongs = ['ℝ', ']−∞ ; 0]', ']0 ; +∞['];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Quel est le domaine de définition de la fonction racine carrée f(x) = √x ?',
    answer,
    choices,
    hint: 'On ne peut pas calculer la racine carrée d\'un nombre négatif (dans ℝ).',
    explanation:
      'La fonction racine carrée est définie pour x ≥ 0.\nSon domaine est [0 ; +∞[.'
  };
});

// ---------------------------------------------------------------------------
// fref-solve-x-sq : résoudre x² = N
// ---------------------------------------------------------------------------
register('fref-solve-x-sq', (item) => {
  const a = randInt(2, 12);
  const N = a * a;
  return {
    question: `Résoudre dans ℝ : x² = ${N}.`,
    answer: `x = ${a} ou x = −${a}`,
    hint: 'x² = N a deux solutions : x = √N et x = −√N.',
    explanation:
      `x² = ${N} ⟺ x = √${N} ou x = −√${N}.\n` +
      `√${N} = ${a}, donc x = ${a} ou x = −${a}.`
  };
});

// ---------------------------------------------------------------------------
// fref-mcq-carre-decroissante : sur quel intervalle x² est décroissante ?
// ---------------------------------------------------------------------------
register('fref-mcq-carre-decroissante', (item) => {
  const correct = ']−∞ ; 0]';
  const wrongs = ['[0 ; +∞[', 'ℝ', ']−∞ ; +∞['];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Sur quel intervalle la fonction carré f(x) = x² est-elle décroissante ?',
    answer,
    choices,
    hint: 'La parabole x² a son minimum en 0.',
    explanation:
      'La fonction carré est décroissante sur ]−∞ ; 0] et croissante sur [0 ; +∞[.'
  };
});

// ---------------------------------------------------------------------------
// fref-solve-inverse-eq : résoudre 1/x = k
// ---------------------------------------------------------------------------
register('fref-solve-inverse-eq', (item) => {
  const k = randNonZero(5);
  const [num, den] = simplify(1, k);
  const ans = frac(1, k);
  return {
    question: `Résoudre : 1/x = ${k} (x ≠ 0).`,
    answer: `x = ${ans}`,
    hint: 'Multiplier des deux côtés par x, puis diviser par k.',
    explanation:
      `1/x = ${k} ⟺ 1 = ${k}x ⟺ x = 1/${k} = ${ans}.`
  };
});

// ---------------------------------------------------------------------------
// fref-mcq-compare : comparer √a et b sans calculatrice
// ---------------------------------------------------------------------------
register('fref-mcq-compare', (item) => {
  const b = randInt(2, 6);
  const offset = randChoice([-1, 1]);
  const N = b * b + offset; // N is close to b²
  const sqrtN = Math.sqrt(N);
  const cmp = sqrtN > b ? `√${N} > ${b}` : `√${N} < ${b}`;
  const wrongs = [
    sqrtN > b ? `√${N} < ${b}` : `√${N} > ${b}`,
    `√${N} = ${b}`,
    'On ne peut pas comparer'
  ];
  const { choices, answer } = mcqStrings(cmp, wrongs);
  return {
    question: `Sans calculatrice, comparer √${N} et ${b}.`,
    answer,
    choices,
    hint: `Comparer ${N} et ${b}² = ${b * b}.`,
    explanation:
      `${b}² = ${b * b}.\n${N} ${offset > 0 ? '>' : '<'} ${b * b}, donc √${N} ${offset > 0 ? '>' : '<'} ${b}.\nRéponse : ${cmp}.`
  };
});

// ---------------------------------------------------------------------------
// fref-solve-simplify-sqrt : simplifier √N en a√b
// ---------------------------------------------------------------------------
register('fref-solve-simplify-sqrt', (item) => {
  const a = randInt(2, 6);
  const primes = [2, 3, 5, 7];
  const b = randChoice(primes);
  const N = a * a * b;
  return {
    question: `Simplifier √${N}.`,
    answer: `${a}√${b}`,
    hint: 'Chercher le plus grand carré parfait qui divise le nombre.',
    explanation:
      `√${N} = √(${a}² × ${b}) = ${a}√${b}.\n` +
      `En effet, ${a}² = ${a * a} et ${a * a} × ${b} = ${N}.`
  };
});

// ---------------------------------------------------------------------------
// fref-mcq-solve-sqrt : résoudre √x = a
// ---------------------------------------------------------------------------
register('fref-mcq-solve-sqrt', (item) => {
  const a = randInt(2, 9);
  const correct = a * a;
  const wrongs = distractors(correct, 3, { positive: true });
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Résoudre : √x = ${a}. Quelle est la valeur de x ?`,
    answer,
    choices,
    hint: 'Élever les deux membres au carré.',
    explanation:
      `√x = ${a} ⟺ x = ${a}² = ${correct}.`
  };
});

// ---------------------------------------------------------------------------
// fref-solve-ineq-sq : résoudre x² ≤ N
// ---------------------------------------------------------------------------
register('fref-solve-ineq-sq', (item) => {
  const a = randInt(2, 9);
  const N = a * a;
  return {
    question: `Résoudre dans ℝ : x² ≤ ${N}.`,
    answer: `[−${a} ; ${a}]`,
    hint: 'x² ≤ N ⟺ −√N ≤ x ≤ √N.',
    explanation:
      `x² ≤ ${N} ⟺ |x| ≤ √${N} = ${a}.\n` +
      `Donc x ∈ [−${a} ; ${a}].`
  };
});
