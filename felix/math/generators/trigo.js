/**
 * Cosinus (4eme) + Trigonometrie (3eme) - Trig generators.
 */
import { randInt, randChoice, randPythTriple, mcq, mcqStrings, distractors, round, frac, simplify, gcd } from './helpers.js';
import { register } from './registry.js';

// ---------------------------------------------------------------------------
// cos-mcq-def : What is cos(alpha) in a right triangle?
// ---------------------------------------------------------------------------
register('cos-mcq-def', (item) => {
  const correct = 'cote adjacent / hypotenuse';
  const wrongs = [
    'cote oppose / hypotenuse',
    'cote oppose / cote adjacent',
    'hypotenuse / cote adjacent'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Dans un triangle rectangle, comment definit-on cos(α) ?',
    answer,
    choices,
    hint: 'CAH : Cosinus = Adjacent / Hypotenuse.',
    explanation:
      'Dans un triangle rectangle, cos(α) = cote adjacent / hypotenuse.\n' +
      'Moyen mnemotechnique : CAH-SOH-TOA.\n' +
      'C = A / H, S = O / H, T = O / A.'
  };
});

// ---------------------------------------------------------------------------
// cos-solve-value : cos(alpha) = adj/hyp, compute decimal
// ---------------------------------------------------------------------------
register('cos-solve-value', (item) => {
  const { a, b, c } = randPythTriple();
  // angle at vertex opposite to side b, adjacent = a, hyp = c
  const val = round(a / c, 2);
  return {
    question: `Dans un triangle rectangle, le cote adjacent a l'angle α mesure ${a} cm et l'hypotenuse ${c} cm. Calcule cos(α) (arrondi au centieme).`,
    answer: String(val),
    hint: 'cos(α) = adjacent / hypotenuse.',
    explanation:
      `cos(α) = adjacent / hypotenuse = ${a} / ${c} = ${val}.\n` +
      `On divise simplement la longueur du cote adjacent par celle de l'hypotenuse.`
  };
});

// ---------------------------------------------------------------------------
// cos-mcq-remarkable : cos(60°) or cos(45°) value
// ---------------------------------------------------------------------------
register('cos-mcq-remarkable', (item) => {
  const angle = randChoice([30, 45, 60]);
  const values = { 30: '√3/2', 45: '√2/2', 60: '1/2' };
  const correct = values[angle];
  const allVals = ['√3/2', '√2/2', '1/2', '1', '√3/3'];
  const wrongs = allVals.filter(v => v !== correct).slice(0, 3);
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Quelle est la valeur exacte de cos(${angle}°) ?`,
    answer,
    choices,
    hint: 'Rappelle-toi les valeurs remarquables : 30°, 45°, 60°.',
    explanation:
      `Les valeurs remarquables du cosinus sont :\n` +
      `cos(30°) = √3/2, cos(45°) = √2/2, cos(60°) = 1/2.\n` +
      `Donc cos(${angle}°) = ${values[angle]}.`
  };
});

// ---------------------------------------------------------------------------
// cos-solve-adjacent : Given cos(alpha) and hypotenuse, find adjacent
// ---------------------------------------------------------------------------
register('cos-solve-adjacent', (item) => {
  const { a, b, c } = randPythTriple();
  // cos(alpha) = a/c, hyp = c, adjacent = a
  const cosVal = frac(a, c);
  return {
    question: `Dans un triangle rectangle, cos(α) = ${cosVal} et l'hypotenuse mesure ${c} cm. Calcule le cote adjacent.`,
    answer: String(a),
    hint: 'adjacent = cos(α) × hypotenuse.',
    explanation:
      `cos(α) = adjacent / hypotenuse, donc adjacent = cos(α) × hypotenuse.\n` +
      `adjacent = ${cosVal} × ${c} = ${a} cm.`
  };
});

// ---------------------------------------------------------------------------
// cos-mcq-45 : 45° triangle with hypotenuse, find adjacent
// ---------------------------------------------------------------------------
register('cos-mcq-45', (item) => {
  const hyp = randChoice([4, 6, 8, 10, 12]);
  const adj = round(hyp * Math.SQRT2 / 2, 2);
  const correct = String(adj);
  const wrongs = [
    String(round(hyp / 2, 2)),
    String(round(hyp * Math.sqrt(3) / 2, 2)),
    String(hyp)
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Dans un triangle rectangle avec un angle de 45° et une hypotenuse de ${hyp} cm, quelle est la longueur du cote adjacent ? (arrondi au centieme)`,
    answer,
    choices,
    hint: 'cos(45°) = √2/2 ≈ 0,71.',
    explanation:
      `cos(45°) = √2/2 ≈ 0,707.\n` +
      `adjacent = cos(45°) × hypotenuse = √2/2 × ${hyp} = ${adj} cm.`
  };
});

// ---------------------------------------------------------------------------
// cos-solve-opposite-pyth : Given adjacent and hypotenuse, find opposite via Pythagore
// ---------------------------------------------------------------------------
register('cos-solve-opposite-pyth', (item) => {
  const { a, b, c } = randPythTriple();
  // adjacent = a, hyp = c, opposite = b
  return {
    question: `Dans un triangle rectangle, le cote adjacent mesure ${a} cm et l'hypotenuse ${c} cm. Calcule le cote oppose en utilisant le theoreme de Pythagore.`,
    answer: String(b),
    hint: 'oppose² = hypotenuse² − adjacent².',
    explanation:
      `Par Pythagore : oppose² = hypotenuse² − adjacent².\n` +
      `oppose² = ${c}² − ${a}² = ${c * c} − ${a * a} = ${c * c - a * a}.\n` +
      `oppose = √${b * b} = ${b} cm.`
  };
});

// ---------------------------------------------------------------------------
// trig-mcq-sin-def : sin(alpha) definition
// ---------------------------------------------------------------------------
register('trig-mcq-sin-def', (item) => {
  const correct = 'cote oppose / hypotenuse';
  const wrongs = [
    'cote adjacent / hypotenuse',
    'cote oppose / cote adjacent',
    'hypotenuse / cote oppose'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Dans un triangle rectangle, comment definit-on sin(α) ?',
    answer,
    choices,
    hint: 'SOH : Sinus = Oppose / Hypotenuse.',
    explanation:
      'sin(α) = cote oppose / hypotenuse.\n' +
      'Moyen mnemotechnique : SOH-CAH-TOA.\n' +
      'S = O / H.'
  };
});

// ---------------------------------------------------------------------------
// trig-solve-sin : sin(alpha) = opp/hyp, compute fractional value
// ---------------------------------------------------------------------------
register('trig-solve-sin', (item) => {
  const { a, b, c } = randPythTriple();
  // sin(alpha) = b/c (opposite = b)
  const val = frac(b, c);
  return {
    question: `Dans un triangle rectangle, le cote oppose a l'angle α mesure ${b} cm et l'hypotenuse ${c} cm. Donne sin(α) sous forme de fraction irreductible.`,
    answer: val,
    hint: 'sin(α) = oppose / hypotenuse.',
    explanation:
      `sin(α) = oppose / hypotenuse = ${b}/${c}.\n` +
      `Forme irreductible : ${val}.`
  };
});

// ---------------------------------------------------------------------------
// trig-mcq-tan45 : tan(45°) value
// ---------------------------------------------------------------------------
register('trig-mcq-tan45', (item) => {
  const correct = '1';
  const wrongs = ['0', '√2/2', '√3'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Quelle est la valeur de tan(45°) ?',
    answer,
    choices,
    hint: 'tan(45°) = sin(45°) / cos(45°).',
    explanation:
      'tan(45°) = sin(45°) / cos(45°) = (√2/2) / (√2/2) = 1.\n' +
      'Un angle de 45° correspond a un triangle rectangle isocele : les deux cathetes sont egales,\n' +
      'donc tan(45°) = oppose / adjacent = 1.'
  };
});

// ---------------------------------------------------------------------------
// trig-solve-tan : Given tan(alpha) and adjacent, find opposite
// ---------------------------------------------------------------------------
register('trig-solve-tan', (item) => {
  const adj = randInt(3, 12);
  const tanNum = randInt(1, 5);
  const tanDen = randInt(1, 5);
  const opp = round(adj * tanNum / tanDen, 2);
  // Ensure clean answer
  const cleanAdj = tanDen * randInt(1, 3);
  const cleanOpp = tanNum * (cleanAdj / tanDen);
  return {
    question: `Dans un triangle rectangle, tan(α) = ${frac(tanNum, tanDen)} et le cote adjacent mesure ${cleanAdj} cm. Calcule le cote oppose.`,
    answer: String(cleanOpp),
    hint: 'oppose = tan(α) × adjacent.',
    explanation:
      `tan(α) = oppose / adjacent, donc oppose = tan(α) × adjacent.\n` +
      `oppose = ${frac(tanNum, tanDen)} × ${cleanAdj} = ${cleanOpp} cm.`
  };
});

// ---------------------------------------------------------------------------
// trig-mcq-identity : sin² + cos² = 1
// ---------------------------------------------------------------------------
register('trig-mcq-identity', (item) => {
  const correct = 'sin²(α) + cos²(α) = 1';
  const wrongs = [
    'sin²(α) − cos²(α) = 1',
    'sin(α) + cos(α) = 1',
    'sin²(α) × cos²(α) = 1'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Quelle est la relation fondamentale de la trigonometrie ?',
    answer,
    choices,
    hint: 'C\'est une consequence directe du theoreme de Pythagore.',
    explanation:
      'La relation fondamentale est sin²(α) + cos²(α) = 1.\n' +
      'Elle decoule directement de Pythagore : (opp/hyp)² + (adj/hyp)² = (opp² + adj²)/hyp² = hyp²/hyp² = 1.'
  };
});

// ---------------------------------------------------------------------------
// trig-solve-cos-from-sin : Given sin(alpha), find cos(alpha) using identity
// ---------------------------------------------------------------------------
register('trig-solve-cos-from-sin', (item) => {
  // Use Pythagorean triples for clean values
  const { a, b, c } = randPythTriple();
  // sin = b/c, cos = a/c
  const sinVal = frac(b, c);
  const cosVal = frac(a, c);
  return {
    question: `Sachant que sin(α) = ${sinVal} et que α est un angle aigu, calcule cos(α) sous forme de fraction irreductible.`,
    answer: cosVal,
    hint: 'Utilise sin²(α) + cos²(α) = 1.',
    explanation:
      `sin²(α) + cos²(α) = 1, donc cos²(α) = 1 − sin²(α).\n` +
      `sin²(α) = (${sinVal})² = ${frac(b * b, c * c)}.\n` +
      `cos²(α) = 1 − ${frac(b * b, c * c)} = ${frac(c * c - b * b, c * c)} = ${frac(a * a, c * c)}.\n` +
      `cos(α) = ${cosVal} (α aigu donc cos(α) > 0).`
  };
});

// ---------------------------------------------------------------------------
// trig-mcq-ramp : Ramp problem with sin(30°)
// ---------------------------------------------------------------------------
register('trig-mcq-ramp', (item) => {
  // sin(30°) = 1/2, so height = ramp_length / 2
  const rampLen = randChoice([4, 6, 8, 10, 12]);
  const height = rampLen / 2;
  const correct = height;
  const wrongs = distractors(correct, 3, { positive: true });
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Une rampe de ${rampLen} m fait un angle de 30° avec le sol. A quelle hauteur monte-t-elle ?`,
    answer,
    choices,
    hint: 'sin(30°) = 1/2 = oppose / hypotenuse.',
    explanation:
      `sin(30°) = hauteur / longueur de la rampe = 1/2.\n` +
      `hauteur = ${rampLen} × sin(30°) = ${rampLen} × 1/2 = ${height} m.`
  };
});

// ---------------------------------------------------------------------------
// trig-solve-angle-tan : Given equal opposite and adjacent, find angle
// ---------------------------------------------------------------------------
register('trig-solve-angle-tan', (item) => {
  const side = randInt(3, 15);
  return {
    question: `Dans un triangle rectangle, le cote oppose et le cote adjacent a l'angle α mesurent tous les deux ${side} cm. Quelle est la valeur de α en degres ?`,
    answer: '45',
    hint: 'Si oppose = adjacent, alors tan(α) = ?',
    explanation:
      `tan(α) = oppose / adjacent = ${side} / ${side} = 1.\n` +
      `Or tan(45°) = 1, donc α = 45°.`
  };
});
