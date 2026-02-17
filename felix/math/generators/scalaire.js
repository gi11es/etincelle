/**
 * Produit scalaire (1ere) + Fonction exponentielle (1ere) +
 * Trigonometrie (1ere) + Probabilites conditionnelles (1ere).
 */
import { randInt, randNonZero, randChoice, mcq, mcqStrings, distractors, frac, simplify, round, coeff, signedStr } from './helpers.js';
import { register } from './registry.js';

// ========== PRODUIT SCALAIRE ==========

// ---------------------------------------------------------------------------
// scal-mcq-compute : u·v avec coordonnées
// ---------------------------------------------------------------------------
register('scal-mcq-compute', (item) => {
  const ux = randInt(-5, 5), uy = randInt(-5, 5);
  const vx = randInt(-5, 5), vy = randInt(-5, 5);
  const correct = ux * vx + uy * vy;
  const wrongs = distractors(correct, 3);
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Calculer u⃗ · v⃗ avec u⃗(${ux} ; ${uy}) et v⃗(${vx} ; ${vy}).`,
    answer,
    choices,
    hint: 'u⃗ · v⃗ = x₁x₂ + y₁y₂.',
    explanation:
      `u⃗ · v⃗ = ${ux} × ${vx >= 0 ? vx : `(${vx})`} + ${uy} × ${vy >= 0 ? vy : `(${vy})`}\n` +
      `= ${ux * vx} + ${uy * vy} = ${correct}.`
  };
});

// ---------------------------------------------------------------------------
// scal-solve-perpendicular : trouver k pour perpendiculaire
// ---------------------------------------------------------------------------
register('scal-solve-perpendicular', (item) => {
  const ux = randNonZero(4), uy = randNonZero(4);
  const vx = randNonZero(4);
  // u·v = ux*vx + uy*k = 0 => k = -ux*vx/uy
  // Pour k entier, on choisit uy | ux*vx
  const uyVal = randChoice([1, -1, 2, -2, 3, -3]);
  const uxVal = uyVal * randNonZero(3); // ux est multiple de uy
  const vxVal = randNonZero(3);
  const k = -(uxVal * vxVal) / uyVal;
  return {
    question: `Trouver k pour que u⃗(${uxVal} ; ${uyVal}) et v⃗(${vxVal} ; k) soient perpendiculaires.`,
    answer: String(k),
    hint: 'u⃗ ⊥ v⃗ ⟺ u⃗ · v⃗ = 0.',
    explanation:
      `u⃗ · v⃗ = ${uxVal} × ${vxVal} + ${uyVal} × k = 0.\n` +
      `${uxVal * vxVal} + ${uyVal}k = 0.\n` +
      `k = ${-(uxVal * vxVal)}/${uyVal} = ${k}.`
  };
});

// ---------------------------------------------------------------------------
// scal-mcq-90 : si θ = 90°, u·v = ?
// ---------------------------------------------------------------------------
register('scal-mcq-90', (item) => {
  const correct = '0';
  const wrongs = ['1', '−1', '||u⃗|| × ||v⃗||'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Si l\'angle entre u⃗ et v⃗ est 90°, que vaut u⃗ · v⃗ ?',
    answer,
    choices,
    hint: 'u⃗ · v⃗ = ||u⃗|| × ||v⃗|| × cos(θ).',
    explanation:
      'u⃗ · v⃗ = ||u⃗|| × ||v⃗|| × cos(90°) = ||u⃗|| × ||v⃗|| × 0 = 0.'
  };
});

// ---------------------------------------------------------------------------
// scal-solve-norme : norme d'un vecteur
// ---------------------------------------------------------------------------
register('scal-solve-norme', (item) => {
  const a = randInt(-6, 6), b = randInt(-6, 6);
  const n2 = a * a + b * b;
  const n = Math.sqrt(n2);
  const isClean = Number.isInteger(n);
  const ans = isClean ? String(n) : `√${n2}`;
  return {
    question: `Calculer la norme de u⃗(${a} ; ${b}).`,
    answer: ans,
    hint: '||u⃗|| = √(x² + y²).',
    explanation:
      `||u⃗|| = √(${a}² + ${b}²) = √(${a * a} + ${b * b}) = √${n2}${isClean ? ` = ${n}` : ''}.`
  };
});

// ---------------------------------------------------------------------------
// scal-mcq-angle : cos(θ) à partir de u·v et normes
// ---------------------------------------------------------------------------
register('scal-mcq-angle', (item) => {
  // Choisir des vecteurs simples
  const ux = randInt(1, 4), uy = 0;
  const vx = randInt(1, 3), vy = randInt(1, 3);
  const dot = ux * vx + uy * vy;
  const nu = ux; // sqrt(ux²) = ux car uy=0, ux>0
  const nv2 = vx * vx + vy * vy;
  const nv = Math.sqrt(nv2);
  // cos(θ) = dot / (nu * nv)
  const cosVal = round(dot / (nu * nv), 2);
  const correct = String(cosVal);
  const wrongs = [
    String(round(cosVal + 0.15, 2)),
    String(round(cosVal - 0.15, 2)),
    String(round(-cosVal, 2))
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `u⃗(${ux} ; ${uy}), v⃗(${vx} ; ${vy}). Que vaut cos(θ) entre ces vecteurs ? (arrondir à 0.01)`,
    answer,
    choices,
    hint: 'cos(θ) = (u⃗ · v⃗) / (||u⃗|| × ||v⃗||).',
    explanation:
      `u⃗ · v⃗ = ${dot}.\n` +
      `||u⃗|| = ${nu}, ||v⃗|| = √${nv2} ≈ ${round(nv, 2)}.\n` +
      `cos(θ) = ${dot} / (${nu} × ${round(nv, 2)}) ≈ ${cosVal}.`
  };
});

// ========== FONCTION EXPONENTIELLE ==========

// ---------------------------------------------------------------------------
// exp-mcq-property : e^a × e^b = ?
// ---------------------------------------------------------------------------
register('exp-mcq-property', (item) => {
  const a = randInt(1, 5), b = randInt(1, 5);
  const correct = `e${supPow(a + b)}`;
  const wrongs = [
    `e${supPow(a * b)}`,
    `e${supPow(a)} + e${supPow(b)}`,
    `${a + b}e`
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Simplifier : e${supPow(a)} × e${supPow(b)}.`,
    answer,
    choices,
    hint: 'eᵃ × eᵇ = eᵃ⁺ᵇ.',
    explanation:
      `e${supPow(a)} × e${supPow(b)} = e${supPow(a)}⁺${supPow(b)} = e${supPow(a + b)}.`
  };
});

// ---------------------------------------------------------------------------
// exp-solve-simplify : simplifier e^(ax) × e^(bx)
// ---------------------------------------------------------------------------
register('exp-solve-simplify', (item) => {
  const a = randNonZero(4), b = randNonZero(4);
  const s = a + b;
  const ans = s === 0 ? '1' : s === 1 ? 'eˣ' : `e${supPow(s)}ˣ`;
  return {
    question: `Simplifier : e${supPow(a)}ˣ × e${supPow(b)}ˣ.`,
    answer: `e${supPow(s)}ˣ`,
    hint: 'Additionner les exposants.',
    explanation:
      `e${supPow(a)}ˣ × e${supPow(b)}ˣ = e⁽${a}ˣ⁺${b}ˣ⁾ = e${supPow(s)}ˣ.`
  };
});

// ---------------------------------------------------------------------------
// exp-mcq-derivative : dérivée de eˣ
// ---------------------------------------------------------------------------
register('exp-mcq-derivative', (item) => {
  const correct = 'eˣ';
  const wrongs = ['xeˣ⁻¹', 'x × eˣ', '1/eˣ'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Quelle est la dérivée de f(x) = eˣ ?',
    answer,
    choices,
    hint: 'L\'exponentielle est sa propre dérivée.',
    explanation:
      'La fonction exponentielle est la seule fonction égale à sa propre dérivée (avec f(0) = 1).\n(eˣ)\' = eˣ.'
  };
});

// ---------------------------------------------------------------------------
// exp-solve-derive-chain : dériver e^(ax+b)
// ---------------------------------------------------------------------------
register('exp-solve-derive-chain', (item) => {
  const a = randNonZero(4);
  const b = randInt(-5, 5);
  const inner = `${coeff(a)}x ${signedStr(b)}`.replace(/\s+/g, ' ').trim();
  return {
    question: `Dériver f(x) = e^(${inner}).`,
    answer: `f'(x) = ${a === 1 ? '' : a === -1 ? '−' : a}e^(${inner})`,
    hint: '(e^u)\' = u\' × e^u.',
    explanation:
      `u = ${inner}, u' = ${a}.\n` +
      `f'(x) = ${a} × e^(${inner})${a === 1 ? ' = e^(' + inner + ')' : ''}.`
  };
});

// ---------------------------------------------------------------------------
// exp-mcq-solve-1 : résoudre eˣ = 1
// ---------------------------------------------------------------------------
register('exp-mcq-solve-1', (item) => {
  const correct = 'x = 0';
  const wrongs = ['x = 1', 'x = e', 'Pas de solution'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Résoudre : eˣ = 1.',
    answer,
    choices,
    hint: 'Pour quelle valeur de x a-t-on e⁰ ?',
    explanation:
      'eˣ = 1 ⟺ eˣ = e⁰ ⟺ x = 0.\nEn effet, e⁰ = 1.'
  };
});

// ---------------------------------------------------------------------------
// exp-solve-equal : résoudre e^(ax+b) = e^c
// ---------------------------------------------------------------------------
register('exp-solve-equal', (item) => {
  const a = randNonZero(3);
  const x0 = randInt(-4, 4);
  const b = randInt(-5, 5);
  const c = a * x0 + b;
  const inner = `${coeff(a)}x ${signedStr(b)}`.replace(/\s+/g, ' ').trim();
  return {
    question: `Résoudre : e^(${inner}) = e^(${c}).`,
    answer: `x = ${x0}`,
    hint: 'eᵃ = eᵇ ⟺ a = b.',
    explanation:
      `e^(${inner}) = e^(${c}) ⟹ ${inner} = ${c}.\n` +
      `${coeff(a)}x = ${c - b}.\n` +
      `x = ${c - b}/${a} = ${x0}.`
  };
});

// ========== TRIGONOMETRIE (1ere) ==========

// ---------------------------------------------------------------------------
// trig1-mcq-radian : conversion degrés/radians
// ---------------------------------------------------------------------------
register('trig1-mcq-radian', (item) => {
  const conversions = [
    { rad: 'π/6', deg: '30°' },
    { rad: 'π/4', deg: '45°' },
    { rad: 'π/3', deg: '60°' },
    { rad: 'π/2', deg: '90°' },
    { rad: 'π', deg: '180°' },
    { rad: '2π', deg: '360°' },
    { rad: '2π/3', deg: '120°' },
    { rad: '3π/4', deg: '135°' },
  ];
  const chosen = randChoice(conversions);
  const allDegs = conversions.map(c => c.deg);
  const wrongs = allDegs.filter(d => d !== chosen.deg).slice(0, 3);
  const { choices, answer } = mcqStrings(chosen.deg, wrongs);
  return {
    question: `Convertir ${chosen.rad} en degrés.`,
    answer,
    choices,
    hint: 'π radians = 180°.',
    explanation:
      `${chosen.rad} = ${chosen.deg}.\n` +
      `On utilise la correspondance π rad = 180°.`
  };
});

// ---------------------------------------------------------------------------
// trig1-solve-cos : valeur de cos d'un angle remarquable
// ---------------------------------------------------------------------------
register('trig1-solve-cos', (item) => {
  const angles = [
    { name: '0', val: '1' },
    { name: 'π/6', val: '√3/2' },
    { name: 'π/4', val: '√2/2' },
    { name: 'π/3', val: '1/2' },
    { name: 'π/2', val: '0' },
    { name: 'π', val: '−1' },
  ];
  const chosen = randChoice(angles);
  return {
    question: `Donner la valeur exacte de cos(${chosen.name}).`,
    answer: chosen.val,
    hint: 'Utiliser le cercle trigonométrique ou le tableau des valeurs remarquables.',
    explanation:
      `cos(${chosen.name}) = ${chosen.val}.\nCette valeur fait partie des angles remarquables à connaître.`
  };
});

// ---------------------------------------------------------------------------
// trig1-mcq-cos-zero : résoudre cos(x) = 0 sur [0 ; 2π[
// ---------------------------------------------------------------------------
register('trig1-mcq-cos-zero', (item) => {
  const correct = 'x = π/2 ou x = 3π/2';
  const wrongs = [
    'x = 0 ou x = π',
    'x = π/4 ou x = 3π/4',
    'x = π/3 ou x = 5π/3'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Résoudre cos(x) = 0 sur [0 ; 2π[.',
    answer,
    choices,
    hint: 'cos(x) = 0 quand x est sur l\'axe vertical du cercle trigo.',
    explanation:
      'cos(x) = 0 ⟺ x = π/2 + kπ.\nSur [0 ; 2π[ : x = π/2 ou x = 3π/2.'
  };
});

// ---------------------------------------------------------------------------
// trig1-solve-sin : valeur de sin d'un angle remarquable
// ---------------------------------------------------------------------------
register('trig1-solve-sin', (item) => {
  const angles = [
    { name: '0', val: '0' },
    { name: 'π/6', val: '1/2' },
    { name: 'π/4', val: '√2/2' },
    { name: 'π/3', val: '√3/2' },
    { name: 'π/2', val: '1' },
    { name: 'π', val: '0' },
  ];
  const chosen = randChoice(angles);
  return {
    question: `Donner la valeur exacte de sin(${chosen.name}).`,
    answer: chosen.val,
    hint: 'Utiliser le cercle trigonométrique ou le tableau des valeurs remarquables.',
    explanation:
      `sin(${chosen.name}) = ${chosen.val}.\nCette valeur fait partie des angles remarquables à connaître.`
  };
});

// ---------------------------------------------------------------------------
// trig1-mcq-supplementary : sin(π − x) = ?
// ---------------------------------------------------------------------------
register('trig1-mcq-supplementary', (item) => {
  const correct = 'sin(x)';
  const wrongs = ['−sin(x)', 'cos(x)', '−cos(x)'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Que vaut sin(π − x) ?',
    answer,
    choices,
    hint: 'Angles supplémentaires : même sinus.',
    explanation:
      'sin(π − x) = sin(x).\nDeux angles supplémentaires ont le même sinus.'
  };
});

// ---------------------------------------------------------------------------
// trig1-solve-sin-eq : résoudre sin(x) = 1/2 sur [0 ; 2π[
// ---------------------------------------------------------------------------
register('trig1-solve-sin-eq', (item) => {
  const eqs = [
    { val: '1/2', sols: 'x = π/6 ou x = 5π/6' },
    { val: '√2/2', sols: 'x = π/4 ou x = 3π/4' },
    { val: '√3/2', sols: 'x = π/3 ou x = 2π/3' },
  ];
  const chosen = randChoice(eqs);
  return {
    question: `Résoudre sin(x) = ${chosen.val} sur [0 ; 2π[.`,
    answer: chosen.sols,
    hint: 'Trouver l\'angle de référence, puis utiliser la symétrie du cercle trigo.',
    explanation:
      `sin(x) = ${chosen.val} sur [0 ; 2π[ donne ${chosen.sols}.\n` +
      `On utilise la symétrie par rapport à l'axe vertical : si sin(α) = ${chosen.val}, alors sin(π − α) = ${chosen.val}.`
  };
});

// ========== PROBABILITES CONDITIONNELLES ==========

// ---------------------------------------------------------------------------
// proba1-mcq-conditional : formule P(A∩B) = P(A) × P_A(B)
// ---------------------------------------------------------------------------
register('proba1-mcq-conditional', (item) => {
  const correct = 'P(A) × P_A(B)';
  const wrongs = [
    'P(A) + P(B)',
    'P(A) × P(B)',
    'P(A) + P(B) − P(A ∪ B)'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Quelle formule donne P(A ∩ B) en utilisant la probabilité conditionnelle ?',
    answer,
    choices,
    hint: 'P(A ∩ B) = P(A) × P_A(B) ou P(B) × P_B(A).',
    explanation:
      'P(A ∩ B) = P(A) × P_A(B).\nC\'est la formule des probabilités composées.\nP_A(B) est la probabilité de B sachant A.'
  };
});

// ---------------------------------------------------------------------------
// proba1-solve-without-replacement : tirage sans remise
// ---------------------------------------------------------------------------
register('proba1-solve-without-replacement', (item) => {
  const total = randChoice([8, 10, 12]);
  const red = randInt(3, total - 3);
  // P(2 rouges) = red/total × (red-1)/(total-1)
  const num = red * (red - 1);
  const den = total * (total - 1);
  const ans = frac(num, den);
  return {
    question: `Une urne contient ${red} boules rouges et ${total - red} boules bleues. On tire 2 boules sans remise. Quelle est la probabilité d'obtenir 2 rouges ?`,
    answer: ans,
    hint: 'P = (rouges/total) × (rouges−1)/(total−1).',
    explanation:
      `P(1re rouge) = ${red}/${total}.\n` +
      `P(2e rouge | 1re rouge) = ${red - 1}/${total - 1}.\n` +
      `P(2 rouges) = ${red}/${total} × ${red - 1}/${total - 1} = ${num}/${den} = ${ans}.`
  };
});

// ---------------------------------------------------------------------------
// proba1-mcq-independent : définition de l'indépendance
// ---------------------------------------------------------------------------
register('proba1-mcq-independent', (item) => {
  const correct = 'P(A ∩ B) = P(A) × P(B)';
  const wrongs = [
    'P(A ∩ B) = 0',
    'P(A | B) = P(B | A)',
    'P(A ∪ B) = P(A) + P(B)'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Quelle condition caractérise l\'indépendance de deux événements A et B ?',
    answer,
    choices,
    hint: 'Indépendance signifie que la connaissance de l\'un ne change pas la probabilité de l\'autre.',
    explanation:
      'A et B sont indépendants si et seulement si P(A ∩ B) = P(A) × P(B).\nCela équivaut à P_A(B) = P(B) et P_B(A) = P(A).'
  };
});

// ---------------------------------------------------------------------------
// proba1-solve-binomial : P(X = k) pour loi binomiale
// ---------------------------------------------------------------------------
register('proba1-solve-binomial', (item) => {
  const n = randChoice([3, 4, 5]);
  const k = randInt(1, n - 1);
  const p = randChoice([0.5, 0.25]);
  const q = 1 - p;
  // C(n,k)
  function comb(n, k) {
    if (k === 0 || k === n) return 1;
    let r = 1;
    for (let i = 0; i < k; i++) { r = r * (n - i) / (i + 1); }
    return r;
  }
  const cnk = comb(n, k);
  const prob = cnk * Math.pow(p, k) * Math.pow(q, n - k);
  const ans = round(prob, 4);
  return {
    question: `X suit une loi binomiale B(${n} ; ${p}). Calculer P(X = ${k}).`,
    answer: String(ans),
    hint: 'P(X = k) = C(n,k) × pᵏ × (1−p)ⁿ⁻ᵏ.',
    explanation:
      `C(${n},${k}) = ${cnk}.\n` +
      `P(X = ${k}) = ${cnk} × ${p}${supPow(k)} × ${q}${supPow(n - k)}\n` +
      `= ${cnk} × ${round(Math.pow(p, k), 4)} × ${round(Math.pow(q, n - k), 4)} = ${ans}.`
  };
});

// ---------------------------------------------------------------------------
// proba1-mcq-esperance : E(X) pour une loi binomiale
// ---------------------------------------------------------------------------
register('proba1-mcq-esperance', (item) => {
  const n = randChoice([5, 10, 20]);
  const p = randChoice([0.2, 0.25, 0.5, 0.3]);
  const correct = n * p;
  const wrongs = distractors(correct, 3, { spread: 3 });
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `X suit B(${n} ; ${p}). Que vaut E(X) ?`,
    answer,
    choices,
    hint: 'E(X) = n × p pour une loi binomiale.',
    explanation:
      `E(X) = n × p = ${n} × ${p} = ${correct}.`
  };
});

// ---- helper local pour superscripts ----
function supPow(n) {
  const sup = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return String(n).split('').map(c => sup[c] || c).join('');
}
