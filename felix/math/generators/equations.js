/**
 * Equations (3eme + 4eme) + Inequations (2nde) - Equation generators.
 */
import { randInt, randChoice, randNonZero, mcq, mcqStrings, distractors, frac, simplify, gcd, lcm } from './helpers.js';
import { register } from './registry.js';

// ---------------------------------------------------------------------------
// eq-solve-basic : ax + b = c, solve for x
// ---------------------------------------------------------------------------
register('eq-solve-basic', (item) => {
  const a = randNonZero(8);
  const x = randInt(-10, 10);
  const b = randInt(-15, 15);
  const c = a * x + b;
  const result = frac(c - b, a);
  return {
    question: `Resous : ${a}x ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)} = ${c}`,
    answer: result,
    hint: 'Isole x : soustrais b des deux cotes, puis divise par a.',
    explanation:
      `${a}x ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)} = ${c}\n` +
      `${a}x = ${c} ${b >= 0 ? '− ' + b : '+ ' + Math.abs(b)} = ${c - b}\n` +
      `x = ${c - b} / ${a} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// eq-mcq-both-sides : ax + b = cx + d MCQ
// ---------------------------------------------------------------------------
register('eq-mcq-both-sides', (item) => {
  const x = randInt(-5, 5);
  const a = randInt(2, 8);
  let c = randInt(1, 7);
  while (c === a) c = randInt(1, 7);
  const b = randInt(-10, 10);
  const d = a * x + b - c * x;
  const correct = x;
  const wrongs = distractors(correct, 3);
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Resous : ${a}x ${b >= 0 ? '+ ' + b : '− ' + Math.abs(b)} = ${c}x ${d >= 0 ? '+ ' + d : '− ' + Math.abs(d)}`,
    answer,
    choices,
    hint: 'Regroupe les termes en x d\'un cote et les constantes de l\'autre.',
    explanation:
      `${a}x − ${c}x = ${d} ${b >= 0 ? '− ' + b : '+ ' + Math.abs(b)}\n` +
      `${a - c}x = ${d - b}\n` +
      `x = ${d - b} / ${a - c} = ${correct}.`
  };
});

// ---------------------------------------------------------------------------
// eq-solve-parens : a(x − b) = c(x + d) − e, solve
// ---------------------------------------------------------------------------
register('eq-solve-parens', (item) => {
  const x = randInt(-5, 5);
  const a = randInt(2, 6);
  const b = randInt(1, 8);
  const cCoef = randInt(2, 6);
  const d = randInt(1, 8);
  const e = a * (x - b) - cCoef * (x + d) + a * (x - b); // will recompute
  // Actually: a(x - b) = c(x + d) - e => ax - ab = cx + cd - e => (a-c)x = cd - e + ab
  // Let's set e so it works cleanly
  const left = a * (x - b);
  const eVal = cCoef * (x + d) - left;
  return {
    question: `Resous : ${a}(x − ${b}) = ${cCoef}(x + ${d}) − ${eVal}`,
    answer: String(x),
    hint: 'Developpe les deux membres, puis regroupe.',
    explanation:
      `Developpement : ${a}x − ${a * b} = ${cCoef}x + ${cCoef * d} − ${eVal}.\n` +
      `${a}x − ${cCoef}x = ${cCoef * d} − ${eVal} + ${a * b}.\n` +
      `${a - cCoef}x = ${cCoef * d - eVal + a * b}.\n` +
      `x = ${x}.`
  };
});

// ---------------------------------------------------------------------------
// eq-mcq-word : Age/rectangle word problem MCQ
// ---------------------------------------------------------------------------
register('eq-mcq-word', (item) => {
  // "In N years, Paul will be twice as old as he is today. He is X years old."
  const age = randInt(5, 20);
  const years = age; // In "age" years he'll be 2*age
  const correct = age;
  const wrongs = distractors(correct, 3, { positive: true });
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Dans ${years} ans, Paul aura le double de son age actuel. Quel est son age ?`,
    answer,
    choices,
    hint: 'Si x est l\'age actuel : x + N = 2x.',
    explanation:
      `Soit x l'age actuel de Paul.\n` +
      `x + ${years} = 2x\n` +
      `${years} = 2x − x = x\n` +
      `Paul a ${age} ans.`
  };
});

// ---------------------------------------------------------------------------
// eq-solve-frac : x/a + x/b = c, solve
// ---------------------------------------------------------------------------
register('eq-solve-frac', (item) => {
  const a = randInt(2, 8);
  let b = randInt(2, 8);
  while (b === a) b = randInt(2, 8);
  const l = lcm(a, b);
  // x(1/a + 1/b) = c => x(b + a)/(ab) = c => x = c*ab/(a+b)
  // Choose c so x is integer
  const sum = a + b;
  const x = randInt(1, 10) * sum / gcd(sum, a * b);
  // Recompute: pick x that is a multiple of sum for clean division
  const cleanX = randInt(1, 5) * sum;
  const cVal = cleanX * (a + b) / (a * b);
  // Actually simpler: x/a + x/b = x(a+b)/(ab), set result = integer
  const xVal = randInt(2, 10);
  const [sn, sd] = simplify(xVal * (a + b), a * b);
  const result = sd === 1 ? String(sn) : `${sn}/${sd}`;
  // The equation: x/a + x/b = sn/sd
  const cStr = sd === 1 ? String(sn) : `${sn}/${sd}`;
  return {
    question: `Resous : x/${a} + x/${b} = ${cStr}`,
    answer: String(xVal),
    hint: `Mets au meme denominateur (${a} × ${b} = ${a * b}) ou factorise x.`,
    explanation:
      `x/${a} + x/${b} = x × (1/${a} + 1/${b}) = x × (${b} + ${a}) / (${a} × ${b}) = x × ${a + b}/${a * b}.\n` +
      `Donc x × ${a + b}/${a * b} = ${cStr}.\n` +
      `x = ${cStr} × ${a * b}/${a + b} = ${xVal}.`
  };
});

// ---------------------------------------------------------------------------
// eq-mcq-perimetre : Rectangle perimeter word problem MCQ
// ---------------------------------------------------------------------------
register('eq-mcq-perimetre', (item) => {
  const w = randInt(3, 12);
  const l = w + randInt(2, 8);
  const p = 2 * (l + w);
  const diff = l - w;
  const correct = w;
  const wrongs = distractors(correct, 3, { positive: true });
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Un rectangle a un perimetre de ${p} cm. Sa longueur depasse sa largeur de ${diff} cm. Quelle est la largeur ?`,
    answer,
    choices,
    hint: 'Perimetre = 2(L + l). Si L = l + ' + diff + ', remplace.',
    explanation:
      `Soit l la largeur. Longueur = l + ${diff}.\n` +
      `Perimetre = 2(l + l + ${diff}) = 2(2l + ${diff}) = ${p}.\n` +
      `2l + ${diff} = ${p / 2}, donc 2l = ${p / 2 - diff}, l = ${w} cm.`
  };
});

// ---------------------------------------------------------------------------
// eq-solve-two-sides : ax − b = cx + d, solve
// ---------------------------------------------------------------------------
register('eq-solve-two-sides', (item) => {
  const x = randInt(-8, 8);
  const a = randInt(2, 9);
  let c = randInt(1, 8);
  while (c === a) c = randInt(1, 8);
  const b = randInt(1, 15);
  const d = a * x - b - c * x;
  const result = frac(d + b, a - c);
  return {
    question: `Resous : ${a}x − ${b} = ${c}x ${d >= 0 ? '+ ' + d : '− ' + Math.abs(d)}`,
    answer: result,
    hint: 'Regroupe les x a gauche et les nombres a droite.',
    explanation:
      `${a}x − ${c}x = ${d} + ${b}\n` +
      `${a - c}x = ${d + b}\n` +
      `x = ${d + b}/${a - c} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// eq-prod-solve : (x − a)(x + b) = 0, product null
// ---------------------------------------------------------------------------
register('eq-prod-solve', (item) => {
  const a = randInt(1, 12);
  let b = randInt(1, 12);
  while (b === a) b = randInt(1, 12);
  return {
    question: `Resous : (x − ${a})(x + ${b}) = 0`,
    answer: `${a} ou ${-b}`,
    hint: 'Un produit est nul si et seulement si l\'un des facteurs est nul.',
    explanation:
      `Un produit est nul ssi l'un des facteurs est nul.\n` +
      `x − ${a} = 0 => x = ${a}\n` +
      `x + ${b} = 0 => x = −${b}\n` +
      `Solutions : x = ${a} ou x = −${b}.`
  };
});

// ---------------------------------------------------------------------------
// eq-prod-mcq : (ax + b)(cx + d) = 0, MCQ
// ---------------------------------------------------------------------------
register('eq-prod-mcq', (item) => {
  const a = randChoice([2, 3, 5]);
  const b = randInt(1, 9);
  const c = randChoice([1, 2, 3]);
  const d = randInt(1, 9);
  const x1 = frac(-b, a);
  const x2 = frac(-d, c);
  const correct = `x = ${x1} ou x = ${x2}`;
  const wrongs = [
    `x = ${frac(b, a)} ou x = ${frac(d, c)}`,
    `x = ${x1}`,
    `x = ${frac(-b, c)} ou x = ${frac(-d, a)}`
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Resous : (${a}x + ${b})(${c}x + ${d}) = 0`,
    answer,
    choices,
    hint: 'Produit nul : chaque facteur peut etre egal a zero.',
    explanation:
      `${a}x + ${b} = 0 => x = −${b}/${a} = ${x1}\n` +
      `${c}x + ${d} = 0 => x = −${d}/${c} = ${x2}\n` +
      `Solutions : x = ${x1} ou x = ${x2}.`
  };
});

// ---------------------------------------------------------------------------
// eq-prod-solve-sq : x² − a² = 0, factorize and solve
// ---------------------------------------------------------------------------
register('eq-prod-solve-sq', (item) => {
  const a = randInt(2, 12);
  return {
    question: `Resous : x² − ${a * a} = 0`,
    answer: `${a} ou ${-a}`,
    hint: 'Factorise avec la difference de deux carres : a² − b² = (a − b)(a + b).',
    explanation:
      `x² − ${a * a} = (x − ${a})(x + ${a}) = 0.\n` +
      `x − ${a} = 0 => x = ${a}\n` +
      `x + ${a} = 0 => x = −${a}\n` +
      `Solutions : x = ${a} ou x = −${a}.`
  };
});

// ---------------------------------------------------------------------------
// eq-prod-mcq-double : x² + 2ax + a² = 0, double root MCQ
// ---------------------------------------------------------------------------
register('eq-prod-mcq-double', (item) => {
  const a = randInt(1, 9);
  const c1 = 2 * a;
  const c0 = a * a;
  const correct = `x = −${a} (racine double)`;
  const wrongs = [
    `x = ${a} ou x = −${a}`,
    `x = ${a} (racine double)`,
    `Pas de solution reelle`
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Resous : x² + ${c1}x + ${c0} = 0`,
    answer,
    choices,
    hint: 'Reconnais un carre parfait : (x + a)² = 0.',
    explanation:
      `x² + ${c1}x + ${c0} = (x + ${a})² = 0.\n` +
      `Un carre est nul ssi la base est nulle : x + ${a} = 0, soit x = −${a}.\n` +
      `C'est une racine double.`
  };
});

// ---------------------------------------------------------------------------
// eq-prod-solve-perfect : ax² − bx + c = 0 as perfect square, solve
// ---------------------------------------------------------------------------
register('eq-prod-solve-perfect', (item) => {
  const k = randChoice([2, 3, 4, 5]);
  const m = randInt(1, 6);
  // (kx - m)² = k²x² - 2kmx + m² = 0
  const a2 = k * k;
  const a1 = 2 * k * m;
  const a0 = m * m;
  const sol = frac(m, k);
  return {
    question: `Resous : ${a2}x² − ${a1}x + ${a0} = 0`,
    answer: sol,
    hint: 'Reconnais un carre parfait (ax − b)² = 0.',
    explanation:
      `${a2}x² − ${a1}x + ${a0} = (${k}x − ${m})² = 0.\n` +
      `${k}x − ${m} = 0 => x = ${m}/${k} = ${sol}.\n` +
      `Racine double : x = ${sol}.`
  };
});

// ---------------------------------------------------------------------------
// eq-prod-mcq-factor : x(ax − b) = 0, MCQ
// ---------------------------------------------------------------------------
register('eq-prod-mcq-factor', (item) => {
  const a = randChoice([2, 3, 4, 5]);
  const b = randInt(1, 10);
  const x2 = frac(b, a);
  const correct = `x = 0 ou x = ${x2}`;
  const wrongs = [
    `x = ${x2}`,
    `x = 0 ou x = ${frac(-b, a)}`,
    `x = 0`
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Resous : x(${a}x − ${b}) = 0`,
    answer,
    choices,
    hint: 'Produit nul : x = 0 ou le second facteur = 0.',
    explanation:
      `Produit nul :\n` +
      `x = 0\n` +
      `ou ${a}x − ${b} = 0 => x = ${b}/${a} = ${x2}.\n` +
      `Solutions : x = 0 ou x = ${x2}.`
  };
});

// ---------------------------------------------------------------------------
// ineq-solve-basic : ax − b < c, answer as interval
// ---------------------------------------------------------------------------
register('ineq-solve-basic', (item) => {
  const a = randInt(2, 8);
  const b = randInt(1, 15);
  const c = randInt(1, 20);
  const [sn, sd] = simplify(c + b, a);
  const bound = sd === 1 ? String(sn) : `${sn}/${sd}`;
  return {
    question: `Resous : ${a}x − ${b} < ${c}. Ecris la solution sous forme d'intervalle.`,
    answer: `]-∞,${bound}[`,
    hint: 'Isole x. Le sens de l\'inegalite ne change pas quand on divise par un positif.',
    explanation:
      `${a}x − ${b} < ${c}\n` +
      `${a}x < ${c + b}\n` +
      `x < ${bound}\n` +
      `Solution : ]−∞ ; ${bound}[.`
  };
});

// ---------------------------------------------------------------------------
// ineq-solve-neg : −ax + b ≥ 0, solve (sign flip)
// ---------------------------------------------------------------------------
register('ineq-solve-neg', (item) => {
  const a = randInt(2, 8);
  const b = randInt(1, 20);
  const [sn, sd] = simplify(b, a);
  const bound = sd === 1 ? String(sn) : `${sn}/${sd}`;
  return {
    question: `Resous : −${a}x + ${b} ≥ 0. Ecris la solution sous forme d'intervalle.`,
    answer: `]-∞,${bound}]`,
    hint: 'Attention : quand on divise par un nombre negatif, le sens de l\'inegalite s\'inverse !',
    explanation:
      `−${a}x + ${b} ≥ 0\n` +
      `−${a}x ≥ −${b}\n` +
      `On divise par −${a} et on INVERSE le sens : x ≤ ${bound}.\n` +
      `Solution : ]−∞ ; ${bound}].`
  };
});
