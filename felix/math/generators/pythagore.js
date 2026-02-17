/**
 * Pythagore (4eme) - Pythagorean theorem generators.
 */
import { randInt, randChoice, randPythTriple, PYTH_TRIPLES, mcq, mcqStrings, distractors, round, shuffle } from './helpers.js';
import { register } from './registry.js';

// ---------------------------------------------------------------------------
// pyth-solve-hyp : Given two cathetes, find the hypotenuse
// ---------------------------------------------------------------------------
register('pyth-solve-hyp', (item) => {
  const { a, b, c } = randPythTriple();
  return {
    question: `Un triangle rectangle a pour cathetes ${a} cm et ${b} cm. Calcule l'hypotenuse.`,
    answer: String(c),
    hint: 'Theoreme de Pythagore : hypotenuse² = cathete1² + cathete2².',
    explanation:
      `D'apres le theoreme de Pythagore :\n` +
      `hypotenuse² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}.\n` +
      `hypotenuse = sqrt(${c * c}) = ${c} cm.`
  };
});

// ---------------------------------------------------------------------------
// pyth-mcq-reciprocal : Is this a right triangle? (reciprocal of Pythagoras)
// ---------------------------------------------------------------------------
register('pyth-mcq-reciprocal', (item) => {
  const { a, b, c } = randPythTriple();
  const correct = 'Oui, car le plus grand cote au carre egale la somme des carres des deux autres';
  const wrongs = [
    'Non, ce n\'est pas un triangle rectangle',
    'Oui, car la somme des trois cotes est paire',
    'On ne peut pas savoir sans mesurer les angles'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Un triangle a des cotes de ${a} cm, ${b} cm et ${c} cm. Est-ce un triangle rectangle ?`,
    answer,
    choices,
    hint: 'Verifie si le carre du plus grand cote egale la somme des carres des deux autres.',
    explanation:
      `Reciproque de Pythagore : on verifie si ${c}² = ${a}² + ${b}².\n` +
      `${c}² = ${c * c} et ${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}.\n` +
      `${c * c} = ${a * a + b * b} : oui ! Le triangle est rectangle.`
  };
});

// ---------------------------------------------------------------------------
// pyth-solve-cathete : Given hypotenuse and one cathete, find the other
// ---------------------------------------------------------------------------
register('pyth-solve-cathete', (item) => {
  const { a, b, c } = randPythTriple();
  // randomly pick which cathete is known
  const known = randChoice([a, b]);
  const unknown = known === a ? b : a;
  return {
    question: `Un triangle rectangle a une hypotenuse de ${c} cm et une cathete de ${known} cm. Trouve l'autre cathete.`,
    answer: String(unknown),
    hint: 'cathete² = hypotenuse² - autre cathete².',
    explanation:
      `D'apres Pythagore : cathete² = hypotenuse² - cathete connue².\n` +
      `cathete² = ${c}² - ${known}² = ${c * c} - ${known * known} = ${c * c - known * known}.\n` +
      `cathete = sqrt(${unknown * unknown}) = ${unknown} cm.`
  };
});

// ---------------------------------------------------------------------------
// pyth-mcq-not-rect : 3 sides that do NOT form a right triangle
// ---------------------------------------------------------------------------
register('pyth-mcq-not-rect', (item) => {
  // Build a non-right triangle
  const a = randInt(3, 8);
  const b = randInt(a, a + 5);
  let c = randInt(b + 1, b + 4);
  // Make sure it's NOT a right triangle
  while (c * c === a * a + b * b) {
    c++;
  }
  const correct = `Non, car ${c}² = ${c * c} et ${a}² + ${b}² = ${a * a + b * b} : ils ne sont pas egaux`;
  const wrongs = [
    `Oui, car ${c} est le plus grand cote`,
    `Oui, car ${a} + ${b} > ${c}`,
    `On ne peut pas savoir sans connaitre les angles`
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Un triangle a des cotes de ${a} cm, ${b} cm et ${c} cm. Est-ce un triangle rectangle ?`,
    answer,
    choices,
    hint: 'Calcule le carre du plus grand cote et compare-le a la somme des carres des deux autres.',
    explanation:
      `On compare ${c}² avec ${a}² + ${b}².\n` +
      `${c}² = ${c * c} et ${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}.\n` +
      `${c * c} ≠ ${a * a + b * b}, donc ce n'est PAS un triangle rectangle.`
  };
});

// ---------------------------------------------------------------------------
// pyth-solve-diagonal : Square with side a, find diagonal (answer as a*sqrt(2))
// ---------------------------------------------------------------------------
register('pyth-solve-diagonal', (item) => {
  const a = randInt(2, 12);
  return {
    question: `Un carre a un cote de ${a} cm. Quelle est la longueur de sa diagonale ? (reponse sous la forme a√2)`,
    answer: `${a}√2`,
    hint: 'La diagonale d\'un carre decoupe deux triangles rectangles isoceles.',
    explanation:
      `Dans un carre de cote ${a}, la diagonale est l'hypotenuse d'un triangle rectangle de cathetes ${a} et ${a}.\n` +
      `d² = ${a}² + ${a}² = ${a * a} + ${a * a} = ${2 * a * a}.\n` +
      `d = √(${2 * a * a}) = √(${a * a} × 2) = ${a}√2 cm.`
  };
});

// ---------------------------------------------------------------------------
// pyth-mcq-ladder : Ladder leaning against a wall MCQ
// ---------------------------------------------------------------------------
register('pyth-mcq-ladder', (item) => {
  const { a, b, c } = randPythTriple();
  // ladder = hypotenuse c, height = b, distance = a
  const correct = a;
  const wrongs = distractors(correct, 3, { positive: true });
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Une echelle de ${c} m est appuyee contre un mur. Le pied de l'echelle touche le mur a ${b} m de hauteur. A quelle distance du mur se trouve le pied de l'echelle ?`,
    answer,
    choices,
    hint: 'L\'echelle, le mur et le sol forment un triangle rectangle.',
    explanation:
      `Le triangle rectangle a pour hypotenuse l'echelle (${c} m) et pour cathete verticale la hauteur (${b} m).\n` +
      `distance² = ${c}² − ${b}² = ${c * c} − ${b * b} = ${c * c - b * b}.\n` +
      `distance = √${a * a} = ${a} m.`
  };
});

// ---------------------------------------------------------------------------
// pyth-solve-distance : Distance between two points in coordinate plane
// ---------------------------------------------------------------------------
register('pyth-solve-distance', (item) => {
  // Use a Pythagorean triple for clean distance
  const { a, b, c } = randPythTriple();
  const x1 = randInt(-5, 5);
  const y1 = randInt(-5, 5);
  // randomly assign a and b to dx and dy
  const swap = randChoice([true, false]);
  const dx = swap ? a : b;
  const dy = swap ? b : a;
  const x2 = x1 + dx;
  const y2 = y1 + dy;
  return {
    question: `Calcule la distance entre les points A(${x1} ; ${y1}) et B(${x2} ; ${y2}).`,
    answer: String(c),
    hint: 'd = √[(x2 − x1)² + (y2 − y1)²]',
    explanation:
      `dx = ${x2} − ${x1 < 0 ? '(' + x1 + ')' : x1} = ${dx}, dy = ${y2} − ${y1 < 0 ? '(' + y1 + ')' : y1} = ${dy}.\n` +
      `d² = ${dx}² + ${dy}² = ${dx * dx} + ${dy * dy} = ${dx * dx + dy * dy}.\n` +
      `d = √${c * c} = ${c}.`
  };
});

// ---------------------------------------------------------------------------
// pyth-mcq-losange : Rhombus diagonals, find side MCQ
// ---------------------------------------------------------------------------
register('pyth-mcq-losange', (item) => {
  // Diagonals of a rhombus bisect each other at right angles
  // half-diagonals form cathetes, side is hypotenuse
  const { a, b, c } = randPythTriple();
  const d1 = 2 * a; // full diagonal 1
  const d2 = 2 * b; // full diagonal 2
  const correct = c;
  const wrongs = distractors(correct, 3, { positive: true });
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Un losange a des diagonales de ${d1} cm et ${d2} cm. Quelle est la longueur d'un cote ?`,
    answer,
    choices,
    hint: 'Les diagonales d\'un losange se coupent en leur milieu a angle droit.',
    explanation:
      `Les demi-diagonales mesurent ${a} cm et ${b} cm et forment un triangle rectangle.\n` +
      `cote² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}.\n` +
      `cote = √${c * c} = ${c} cm.`
  };
});
