/**
 * Triangles, Aires et volumes (5eme).
 */
import { randInt, randChoice, mcq, mcqStrings, distractors, round } from './helpers.js';
import { register } from './registry.js';

// ---------------------------------------------------------------------------
// tri-solve-angle : Two angles given, find third
// ---------------------------------------------------------------------------
register('tri-solve-angle', (item) => {
  const a = randInt(20, 80);
  const b = randInt(20, 160 - a - 10); // ensure c > 0 and reasonable
  const c = 180 - a - b;
  return {
    question: `Un triangle a deux angles de ${a}° et ${b}°. Quelle est la mesure du troisieme angle ?`,
    answer: `${c}°`,
    hint: 'La somme des angles d\'un triangle vaut toujours 180°.',
    explanation:
      `Somme des angles = 180°.\n` +
      `Troisieme angle = 180° − ${a}° − ${b}° = ${c}°.`
  };
});

// ---------------------------------------------------------------------------
// tri-mcq-inequality : Can a triangle be formed? MCQ
// ---------------------------------------------------------------------------
register('tri-mcq-inequality', (item) => {
  const canForm = randChoice([true, false]);
  let a, b, c;
  if (canForm) {
    // Valid triangle: each side < sum of two others
    a = randInt(3, 10);
    b = randInt(3, 10);
    c = randInt(Math.abs(a - b) + 1, a + b - 1);
  } else {
    // Invalid triangle
    a = randInt(2, 5);
    b = randInt(2, 5);
    c = a + b + randInt(1, 5); // c >= a + b
  }
  const correct = canForm ? 'Oui' : 'Non';
  const { choices, answer } = mcqStrings(correct, [
    canForm ? 'Non' : 'Oui',
    'Seulement si c\'est un triangle rectangle',
    'On ne peut pas savoir'
  ]);
  const h = Math.round(a * 0.8);
  return {
    question: `Peut-on construire un triangle avec des cotes de ${a} cm, ${b} cm et ${c} cm ?`,
    answer,
    choices,
    hint: 'Inegalite triangulaire : chaque cote doit etre strictement inferieur a la somme des deux autres.',
    explanation: canForm
      ? `Oui ! ${a} < ${b} + ${c} = ${b + c}, ${b} < ${a} + ${c} = ${a + c}, ${c} < ${a} + ${b} = ${a + b}. L'inegalite triangulaire est verifiee.`
      : `Non ! ${c} ≥ ${a} + ${b} = ${a + b}. L'inegalite triangulaire n'est pas verifiee.`,
    diagram: {
      type: 'right-triangle',
      vertices: { A: [0, 0], B: [c, 0], C: [a * 0.4, h] },
      labels: { AB: `${c} cm`, AC: `${a} cm`, BC: `${b} cm` }
    }
  };
});

// ---------------------------------------------------------------------------
// tri-mcq-nature : Triangle with specific angles, what's its nature? MCQ
// ---------------------------------------------------------------------------
register('tri-mcq-nature', (item) => {
  const type = randChoice(['rectangle', 'isocele', 'equilateral', 'quelconque']);
  let a, b, c, nature;
  switch (type) {
    case 'rectangle':
      a = 90;
      b = randInt(10, 70);
      c = 90 - b;
      nature = 'Rectangle';
      break;
    case 'isocele':
      a = randChoice([40, 50, 70, 80]);
      b = a;
      c = 180 - 2 * a;
      nature = 'Isocele';
      break;
    case 'equilateral':
      a = 60; b = 60; c = 60;
      nature = 'Equilateral';
      break;
    default:
      a = randInt(30, 60);
      b = randInt(30, 70);
      c = 180 - a - b;
      while (a === b || b === c || a === c || a === 90 || b === 90 || c === 90) {
        a = randInt(30, 60);
        b = randInt(30, 70);
        c = 180 - a - b;
      }
      nature = 'Quelconque';
  }
  const wrongs = ['Rectangle', 'Isocele', 'Equilateral', 'Quelconque'].filter(n => n !== nature);
  const { choices, answer } = mcqStrings(nature, wrongs.slice(0, 3));
  return {
    question: `Un triangle a des angles de ${a}°, ${b}° et ${c}°. Quelle est sa nature ?`,
    answer,
    choices,
    hint: 'Rectangle = un angle de 90°. Isocele = deux angles egaux. Equilateral = trois angles de 60°.',
    explanation:
      type === 'rectangle' ? `Il a un angle droit (90°), c'est un triangle rectangle.` :
      type === 'isocele' ? `Deux angles sont egaux (${a}°), c'est un triangle isocele.` :
      type === 'equilateral' ? `Les trois angles valent 60°, c'est un triangle equilateral.` :
      `Aucun angle droit, aucun angle egal : c'est un triangle quelconque.`
  };
});

// ---------------------------------------------------------------------------
// tri-solve-isocele : Isosceles triangle, apex angle given, find base angle
// ---------------------------------------------------------------------------
register('tri-solve-isocele', (item) => {
  // apex angle must leave room for two equal base angles
  const apex = randChoice([20, 30, 40, 50, 60, 70, 80, 100, 110, 120]);
  const base = (180 - apex) / 2;
  return {
    question: `Un triangle isocele a un angle au sommet de ${apex}°. Quelle est la mesure de chaque angle a la base ?`,
    answer: `${base}°`,
    hint: 'Dans un triangle isocele, les deux angles a la base sont egaux.',
    explanation:
      `Somme des angles = 180°.\n` +
      `Les deux angles a la base sont egaux : (180° − ${apex}°) ÷ 2 = ${base}°.`
  };
});

// ---------------------------------------------------------------------------
// vol-solve-prism : Volume of prism with triangular base
// ---------------------------------------------------------------------------
register('vol-solve-prism', (item) => {
  let base = randInt(3, 12);
  let height = randInt(3, 12);
  // ensure base*height is even for clean area
  if (base % 2 !== 0 && height % 2 !== 0) {
    base += 1;
  }
  const triArea = (base * height) / 2;
  const length = randInt(3, 15);
  const volume = triArea * length;
  return {
    question:
      `Un prisme droit a une base triangulaire de base ${base} cm et de hauteur ${height} cm. ` +
      `Sa longueur est ${length} cm. Quel est son volume ?`,
    answer: `${volume} cm³`,
    hint: 'Volume = Aire de la base × longueur. Aire du triangle = base × hauteur ÷ 2.',
    explanation:
      `Aire de la base triangulaire : ${base} × ${height} ÷ 2 = ${triArea} cm².\n` +
      `Volume : ${triArea} × ${length} = ${volume} cm³.`
  };
});

// ---------------------------------------------------------------------------
// vol-mcq-cylinder-formula : Which formula for cylinder volume? MCQ
// ---------------------------------------------------------------------------
register('vol-mcq-cylinder-formula', (item) => {
  const correct = 'V = π × r² × h';
  const { choices, answer } = mcqStrings(correct, [
    'V = π × r × h',
    'V = 2π × r × h',
    'V = π × r² × h²'
  ]);
  return {
    question: `Quelle est la formule du volume d'un cylindre de rayon r et de hauteur h ?`,
    answer,
    choices,
    hint: 'Le volume d\'un cylindre est l\'aire du disque de base multipliee par la hauteur.',
    explanation:
      `L'aire du disque de base est π × r².\n` +
      `Le volume est donc π × r² × h.`
  };
});

// ---------------------------------------------------------------------------
// vol-solve-cylinder : Volume of cylinder (answer in terms of pi)
// ---------------------------------------------------------------------------
register('vol-solve-cylinder', (item) => {
  const r = randInt(2, 10);
  const h = randInt(3, 15);
  const coeff = r * r * h;
  return {
    question: `Un cylindre a un rayon de ${r} cm et une hauteur de ${h} cm. Donne son volume (en fonction de π).`,
    answer: `${coeff}π cm³`,
    hint: 'V = π × r² × h.',
    explanation:
      `V = π × r² × h = π × ${r}² × ${h} = π × ${r * r} × ${h} = ${coeff}π cm³.`
  };
});

// ---------------------------------------------------------------------------
// vol-mcq-double-radius : Double the radius, how does volume change? MCQ
// ---------------------------------------------------------------------------
register('vol-mcq-double-radius', (item) => {
  const correct = 'Il est multiplie par 4';
  const { choices, answer } = mcqStrings(correct, [
    'Il est multiplie par 2',
    'Il est multiplie par 8',
    'Il est multiplie par 6'
  ]);
  return {
    question: `On double le rayon d'un cylindre sans changer sa hauteur. Comment varie son volume ?`,
    answer,
    choices,
    hint: 'Le rayon apparait au carre dans la formule du volume.',
    explanation:
      `V = π × r² × h.\n` +
      `Si r est double : V' = π × (2r)² × h = π × 4r² × h = 4V.\n` +
      `Le volume est multiplie par 4 (car 2² = 4).`
  };
});
