/**
 * Geometrie reperee (2nde) + Vecteurs (2nde).
 */
import { randInt, randNonZero, randChoice, mcq, mcqStrings, distractors, simplify, frac, round, coeff, signedStr } from './helpers.js';
import { register } from './registry.js';

// ---------------------------------------------------------------------------
// vec-mcq-coords : coordonnées du vecteur AB
// ---------------------------------------------------------------------------
register('vec-mcq-coords', (item) => {
  const xA = randInt(-5, 5), yA = randInt(-5, 5);
  const xB = randInt(-5, 5), yB = randInt(-5, 5);
  const dx = xB - xA, dy = yB - yA;
  const correct = `(${dx} ; ${dy})`;
  const wrongs = [
    `(${xA - xB} ; ${yA - yB})`,
    `(${dx + 1} ; ${dy})`,
    `(${dx} ; ${dy - 1})`
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `A(${xA} ; ${yA}) et B(${xB} ; ${yB}). Quelles sont les coordonnées du vecteur AB⃗ ?`,
    answer,
    choices,
    hint: 'AB⃗ = (x_B − x_A ; y_B − y_A).',
    explanation:
      `AB⃗ = (${xB} − ${xA >= 0 ? xA : `(${xA})`} ; ${yB} − ${yA >= 0 ? yA : `(${yA})`}) = (${dx} ; ${dy}).`
  };
});

// ---------------------------------------------------------------------------
// vec-solve-add : u + v
// ---------------------------------------------------------------------------
register('vec-solve-add', (item) => {
  const ux = randInt(-5, 5), uy = randInt(-5, 5);
  const vx = randInt(-5, 5), vy = randInt(-5, 5);
  const sx = ux + vx, sy = uy + vy;
  return {
    question: `Calculer u⃗ + v⃗ avec u⃗(${ux} ; ${uy}) et v⃗(${vx} ; ${vy}).`,
    answer: `(${sx} ; ${sy})`,
    hint: 'On additionne les coordonnées composante par composante.',
    explanation:
      `u⃗ + v⃗ = (${ux} + ${vx >= 0 ? vx : `(${vx})`} ; ${uy} + ${vy >= 0 ? vy : `(${vy})`}) = (${sx} ; ${sy}).`
  };
});

// ---------------------------------------------------------------------------
// vec-mcq-chasles : AB⃗ + BC⃗ = ? (relation de Chasles)
// ---------------------------------------------------------------------------
register('vec-mcq-chasles', (item) => {
  const pts = ['A', 'B', 'C', 'D'];
  const i = randInt(0, 2);
  const P = pts[i], Q = pts[i + 1];
  const R = randChoice(pts.filter((_, idx) => idx !== i && idx !== i + 1));
  const correct = `${P}${R}⃗`;
  // On demande PQ⃗ + QR⃗
  const wrongs = [`${R}${P}⃗`, `${Q}${R}⃗`, `${P}${Q}⃗`];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `D'après la relation de Chasles, ${P}${Q}⃗ + ${Q}${R}⃗ = ?`,
    answer,
    choices,
    hint: 'Dans la relation de Chasles, le point intermédiaire s\'élimine.',
    explanation:
      `${P}${Q}⃗ + ${Q}${R}⃗ = ${P}${R}⃗ (relation de Chasles : le point ${Q} s'élimine).`
  };
});

// ---------------------------------------------------------------------------
// vec-solve-colineaire : trouver k pour que u et v soient colinéaires
// ---------------------------------------------------------------------------
register('vec-solve-colineaire', (item) => {
  const a = randNonZero(4), b = randNonZero(4);
  const c = randNonZero(4);
  // v = (c, k), colinéaire si a*k - b*c = 0, donc k = b*c/a
  // Pour avoir k entier, on choisit a | b*c
  const aVal = randChoice([1, -1, 2, -2, 3, -3]);
  const bVal = randNonZero(4);
  const cVal = aVal * randInt(1, 3); // s'assure que cVal/aVal est entier pour un k simple
  const k = (bVal * cVal) / aVal;
  return {
    question: `Trouver k pour que u⃗(${aVal} ; ${bVal}) et v⃗(${cVal} ; k) soient colinéaires.`,
    answer: String(k),
    hint: 'Deux vecteurs sont colinéaires si le déterminant est nul : x₁y₂ − y₁x₂ = 0.',
    explanation:
      `Déterminant : ${aVal} × k − ${bVal} × ${cVal} = 0.\n` +
      `${aVal}k = ${bVal * cVal}.\n` +
      `k = ${bVal * cVal} / ${aVal} = ${k}.`
  };
});

// ---------------------------------------------------------------------------
// vec-mcq-parallelogramme : condition ABCD parallélogramme
// ---------------------------------------------------------------------------
register('vec-mcq-parallelogramme', (item) => {
  const correct = 'AB⃗ = DC⃗';
  const wrongs = ['AB⃗ = BC⃗', 'AB⃗ = CD⃗', 'AC⃗ = BD⃗'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Quelle condition sur les vecteurs caractérise un parallélogramme ABCD ?',
    answer,
    choices,
    hint: 'Les côtés opposés sont parallèles et de même longueur.',
    explanation:
      'ABCD est un parallélogramme si et seulement si AB⃗ = DC⃗ (côtés opposés égaux).'
  };
});

// ---------------------------------------------------------------------------
// vec-solve-milieu : milieu d'un segment
// ---------------------------------------------------------------------------
register('vec-solve-milieu', (item) => {
  // Choisir des coordonnées dont la somme est paire pour avoir un milieu entier
  const xA = randInt(-5, 5);
  const yA = randInt(-5, 5);
  const xB = xA + 2 * randInt(-3, 3);
  const yB = yA + 2 * randInt(-3, 3);
  const mx = (xA + xB) / 2, my = (yA + yB) / 2;
  return {
    question: `Calculer les coordonnées du milieu M de [AB] avec A(${xA} ; ${yA}) et B(${xB} ; ${yB}).`,
    answer: `(${mx} ; ${my})`,
    hint: 'M = ((x_A + x_B)/2 ; (y_A + y_B)/2).',
    explanation:
      `M = ((${xA} + ${xB})/2 ; (${yA} + ${yB})/2) = (${xA + xB}/2 ; ${yA + yB}/2) = (${mx} ; ${my}).`
  };
});

// ---------------------------------------------------------------------------
// vec-mcq-colineaire-check : u et v sont-ils colinéaires ?
// ---------------------------------------------------------------------------
register('vec-mcq-colineaire-check', (item) => {
  const isCol = randChoice([true, false]);
  const a = randNonZero(4), b = randNonZero(4);
  let c, d;
  if (isCol) {
    const k = randChoice([2, -2, 3, -3]);
    c = a * k;
    d = b * k;
  } else {
    c = randNonZero(4);
    d = randNonZero(4);
    while (a * d - b * c === 0) { d = randNonZero(4); }
  }
  const det = a * d - b * c;
  const correct = isCol ? 'Oui' : 'Non';
  const wrongs = isCol
    ? ['Non', 'Seulement si a = 0', 'On ne peut pas savoir']
    : ['Oui', 'Seulement si c = 0', 'On ne peut pas savoir'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Les vecteurs u⃗(${a} ; ${b}) et v⃗(${c} ; ${d}) sont-ils colinéaires ?`,
    answer,
    choices,
    hint: 'Calculer le déterminant : x₁y₂ − y₁x₂.',
    explanation:
      `Déterminant : ${a} × ${d} − ${b} × ${c} = ${a * d} − ${b * c} = ${det}.\n` +
      (isCol ? 'Le déterminant est nul, ils sont colinéaires.' : 'Le déterminant est non nul, ils ne sont pas colinéaires.')
  };
});

// ---------------------------------------------------------------------------
// vec-solve-4th-point : trouver D pour ABCD parallélogramme
// ---------------------------------------------------------------------------
register('vec-solve-4th-point', (item) => {
  const xA = randInt(-4, 4), yA = randInt(-4, 4);
  const xB = randInt(-4, 4), yB = randInt(-4, 4);
  const xC = randInt(-4, 4), yC = randInt(-4, 4);
  // ABCD parallélogramme : AB = DC => D = C - B + A
  const xD = xC - xB + xA;
  const yD = yC - yB + yA;
  return {
    question: `A(${xA} ; ${yA}), B(${xB} ; ${yB}), C(${xC} ; ${yC}). Trouver D tel que ABCD soit un parallélogramme.`,
    answer: `(${xD} ; ${yD})`,
    hint: 'AB⃗ = DC⃗, donc D = C − B + A.',
    explanation:
      `AB⃗ = (${xB - xA} ; ${yB - yA}).\n` +
      `DC⃗ = AB⃗ ⟹ C − D = B − A ⟹ D = C − B + A.\n` +
      `D = (${xC} − ${xB} + ${xA} ; ${yC} − ${yB} + ${yA}) = (${xD} ; ${yD}).`
  };
});

// ---------------------------------------------------------------------------
// geo-solve-distance : distance entre deux points
// ---------------------------------------------------------------------------
register('geo-solve-distance', (item) => {
  // Choisir pour avoir une distance "propre"
  const dx = randInt(1, 6), dy = randInt(0, 6);
  const xA = randInt(-5, 5), yA = randInt(-5, 5);
  const xB = xA + dx, yB = yA + dy;
  const d2 = dx * dx + dy * dy;
  const d = Math.sqrt(d2);
  const isClean = Number.isInteger(d);
  const ans = isClean ? String(d) : `√${d2}`;
  return {
    question: `Calculer la distance AB avec A(${xA} ; ${yA}) et B(${xB} ; ${yB}).`,
    answer: ans,
    hint: 'AB = √((x_B − x_A)² + (y_B − y_A)²).',
    explanation:
      `AB = √((${xB} − ${xA})² + (${yB} − ${yA})²) = √(${dx}² + ${dy}²) = √(${dx * dx} + ${dy * dy}) = √${d2}${isClean ? ` = ${d}` : ''}.`
  };
});

// ---------------------------------------------------------------------------
// geo-mcq-equation-line : équation de droite passant par deux points
// ---------------------------------------------------------------------------
register('geo-mcq-equation-line', (item) => {
  const x1 = randInt(-3, 3);
  let x2;
  do { x2 = randInt(-3, 3); } while (x2 === x1);
  const a = randNonZero(3);
  const b = randInt(-5, 5);
  const y1 = a * x1 + b;
  const y2 = a * x2 + b;
  const correctStr = `y = ${coeff(a)}x ${signedStr(b)}`.replace(/\s+/g, ' ').trim();
  const wrongs = [
    `y = ${coeff(-a)}x ${signedStr(b)}`,
    `y = ${coeff(a)}x ${signedStr(-b)}`,
    `y = ${coeff(a + 1)}x ${signedStr(b)}`
  ];
  const { choices, answer } = mcqStrings(correctStr, wrongs);
  return {
    question: `Quelle est l'équation de la droite passant par (${x1} ; ${y1}) et (${x2} ; ${y2}) ?`,
    answer,
    choices,
    hint: 'Calculer la pente m = (y₂−y₁)/(x₂−x₁), puis b = y₁ − mx₁.',
    explanation:
      `m = (${y2} − ${y1}) / (${x2} − ${x1}) = ${y2 - y1} / ${x2 - x1} = ${a}.\n` +
      `b = ${y1} − ${a} × ${x1} = ${b}.\n` +
      `Équation : ${correctStr}.`
  };
});

// ---------------------------------------------------------------------------
// geo-solve-line-from-point : équation de droite passant par un point avec pente donnée
// ---------------------------------------------------------------------------
register('geo-solve-line-from-point', (item) => {
  const a = randNonZero(4);
  const x0 = randInt(-3, 3);
  const y0 = randInt(-5, 5);
  const b = y0 - a * x0;
  const expr = `y = ${coeff(a)}x ${signedStr(b)}`.replace(/\s+/g, ' ').trim();
  return {
    question: `Écrire l'équation de la droite de pente ${a} passant par (${x0} ; ${y0}).`,
    answer: expr,
    hint: 'y = ax + b avec b = y₀ − a·x₀.',
    explanation:
      `b = ${y0} − ${a} × ${x0 >= 0 ? x0 : `(${x0})`} = ${y0} − ${a * x0} = ${b}.\n` +
      `Équation : ${expr}.`
  };
});

// ---------------------------------------------------------------------------
// geo-mcq-parallel : deux droites parallèles ?
// ---------------------------------------------------------------------------
register('geo-mcq-parallel', (item) => {
  const a = randNonZero(4);
  const b1 = randInt(-5, 5);
  const isPar = randChoice([true, false]);
  let a2, b2;
  if (isPar) {
    a2 = a;
    do { b2 = randInt(-5, 5); } while (b2 === b1);
  } else {
    do { a2 = randNonZero(4); } while (a2 === a);
    b2 = randInt(-5, 5);
  }
  const correct = isPar ? 'Oui' : 'Non';
  const wrongs = isPar
    ? ['Non', 'Seulement si b₁ = b₂', 'Elles sont confondues']
    : ['Oui', 'Elles sont perpendiculaires', 'On ne peut pas savoir'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  const d1 = `y = ${coeff(a)}x ${signedStr(b1)}`.replace(/\s+/g, ' ').trim();
  const d2 = `y = ${coeff(a2)}x ${signedStr(b2)}`.replace(/\s+/g, ' ').trim();
  return {
    question: `Les droites ${d1} et ${d2} sont-elles parallèles ?`,
    answer,
    choices,
    hint: 'Deux droites sont parallèles si elles ont la même pente.',
    explanation: isPar
      ? `Même pente a = ${a}, ordonnées à l'origine différentes (${b1} ≠ ${b2}). Elles sont parallèles.`
      : `Pentes différentes : ${a} ≠ ${a2}. Elles ne sont pas parallèles.`
  };
});

// ---------------------------------------------------------------------------
// geo-solve-x-intercept : intersection avec l'axe des abscisses
// ---------------------------------------------------------------------------
register('geo-solve-x-intercept', (item) => {
  const a = randNonZero(5);
  const b = randInt(-10, 10);
  const [num, den] = simplify(-b, a);
  const ans = frac(-b, a);
  return {
    question: `Où la droite y = ${coeff(a)}x ${signedStr(b)} coupe-t-elle l'axe des abscisses ?`,
    answer: `x = ${ans}`,
    hint: 'L\'axe des abscisses correspond à y = 0.',
    explanation:
      `y = 0 ⟹ ${coeff(a)}x ${signedStr(b)} = 0 ⟹ x = ${-b}/${a} = ${ans}.\n` +
      `La droite coupe l'axe des abscisses en x = ${ans}.`
  };
});

// ---------------------------------------------------------------------------
// geo-solve-slope : pente entre deux points
// ---------------------------------------------------------------------------
register('geo-solve-slope', (item) => {
  const x1 = randInt(-4, 4);
  let x2;
  do { x2 = randInt(-4, 4); } while (x2 === x1);
  const y1 = randInt(-5, 5), y2 = randInt(-5, 5);
  const ans = frac(y2 - y1, x2 - x1);
  return {
    question: `Calculer la pente de la droite passant par (${x1} ; ${y1}) et (${x2} ; ${y2}).`,
    answer: ans,
    hint: 'Pente = (y₂ − y₁) / (x₂ − x₁).',
    explanation:
      `m = (${y2} − ${y1 >= 0 ? y1 : `(${y1})`}) / (${x2} − ${x1 >= 0 ? x1 : `(${x1})`}) = ${y2 - y1}/${x2 - x1} = ${ans}.`
  };
});

// ---------------------------------------------------------------------------
// geo-mcq-symmetry : symétrique d'un point par rapport à un autre
// ---------------------------------------------------------------------------
register('geo-mcq-symmetry', (item) => {
  const xA = randInt(-4, 4), yA = randInt(-4, 4);
  const xB = randInt(-4, 4), yB = randInt(-4, 4);
  // Symétrique de A par rapport à B : A' = 2B - A
  const xS = 2 * xB - xA, yS = 2 * yB - yA;
  const correct = `(${xS} ; ${yS})`;
  const wrongs = [
    `(${xA + xB} ; ${yA + yB})`,
    `(${xS + 1} ; ${yS})`,
    `(${xB - xA} ; ${yB - yA})`
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Quel est le symétrique de A(${xA} ; ${yA}) par rapport à B(${xB} ; ${yB}) ?`,
    answer,
    choices,
    hint: 'A\' = 2B − A (B est le milieu de [AA\']).',
    explanation:
      `A' = (2 × ${xB} − ${xA} ; 2 × ${yB} − ${yA}) = (${xS} ; ${yS}).`
  };
});
