/**
 * Probabilites (3eme + 2nde) + Volumes (3eme) - Probability and volume generators.
 */
import { randInt, randChoice, mcq, mcqStrings, distractors, frac, simplify, round } from './helpers.js';
import { register } from './registry.js';

// ---------------------------------------------------------------------------
// proba-solve-die : Probability of an event with a die
// ---------------------------------------------------------------------------
register('proba-solve-die', (item) => {
  const events = [
    { desc: 'obtenir un nombre pair', favorable: [2, 4, 6], count: 3 },
    { desc: 'obtenir un nombre impair', favorable: [1, 3, 5], count: 3 },
    { desc: 'obtenir un nombre superieur ou egal a 4', favorable: [4, 5, 6], count: 3 },
    { desc: 'obtenir un nombre strictement inferieur a 3', favorable: [1, 2], count: 2 },
    { desc: 'obtenir un multiple de 3', favorable: [3, 6], count: 2 },
    { desc: 'obtenir le nombre 6', favorable: [6], count: 1 },
    { desc: 'obtenir un nombre premier', favorable: [2, 3, 5], count: 3 },
    { desc: 'obtenir un nombre superieur a 4', favorable: [5, 6], count: 2 },
  ];
  const ev = randChoice(events);
  const result = frac(ev.count, 6);
  return {
    question: `On lance un de equilibre a 6 faces. Quelle est la probabilite d'${ev.desc} ? (fraction irreductible)`,
    answer: result,
    hint: 'P = nombre de cas favorables / nombre de cas possibles.',
    explanation:
      `Les cas favorables sont : {${ev.favorable.join(', ')}} → ${ev.count} cas.\n` +
      `Nombre total de cas : 6.\n` +
      `P = ${ev.count}/6 = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// proba-mcq-cards : Probability of drawing a specific card MCQ
// ---------------------------------------------------------------------------
register('proba-mcq-cards', (item) => {
  const events = [
    { desc: 'un as', count: 4, explanation: 'Il y a 4 as dans un jeu de 52 cartes.' },
    { desc: 'un coeur', count: 13, explanation: 'Il y a 13 coeurs dans un jeu de 52 cartes.' },
    { desc: 'une figure (roi, dame, valet)', count: 12, explanation: 'Il y a 12 figures : 4 rois + 4 dames + 4 valets.' },
    { desc: 'une carte rouge', count: 26, explanation: 'Il y a 26 cartes rouges (13 coeurs + 13 carreaux).' },
    { desc: 'le roi de pique', count: 1, explanation: 'Il n\'y a qu\'un seul roi de pique.' },
    { desc: 'un 7 ou un 8', count: 8, explanation: 'Il y a 4 sept et 4 huit, soit 8 cartes.' },
  ];
  const ev = randChoice(events);
  const [sn, sd] = simplify(ev.count, 52);
  const correct = `${sn}/${sd}`;
  // Build wrong answers
  const wrongFracs = [];
  const tryWrongs = [
    simplify(ev.count + 1, 52),
    simplify(ev.count, 32),
    simplify(ev.count - 1 > 0 ? ev.count - 1 : ev.count + 2, 52)
  ];
  for (const [wn, wd] of tryWrongs) {
    const ws = wd === 1 ? String(wn) : `${wn}/${wd}`;
    if (ws !== correct) wrongFracs.push(ws);
  }
  while (wrongFracs.length < 3) wrongFracs.push(`${sn + wrongFracs.length + 1}/${sd}`);
  const { choices, answer } = mcqStrings(correct, wrongFracs.slice(0, 3));
  return {
    question: `On tire une carte au hasard dans un jeu de 52 cartes. Quelle est la probabilite de tirer ${ev.desc} ?`,
    answer,
    choices,
    hint: 'P = nombre de cartes favorables / 52.',
    explanation:
      `${ev.explanation}\n` +
      `P = ${ev.count}/52 = ${correct}.`
  };
});

// ---------------------------------------------------------------------------
// proba-solve-incompatible : P(A ∪ B) for incompatible events
// ---------------------------------------------------------------------------
register('proba-solve-incompatible', (item) => {
  // Two incompatible events: P(A ∪ B) = P(A) + P(B)
  const denom = randChoice([6, 8, 10, 12]);
  const na = randInt(1, Math.floor(denom / 2));
  let nb = randInt(1, denom - na);
  const pa = frac(na, denom);
  const pb = frac(nb, denom);
  const result = frac(na + nb, denom);
  return {
    question: `A et B sont deux evenements incompatibles avec P(A) = ${pa} et P(B) = ${pb}. Calcule P(A ∪ B). (fraction irreductible)`,
    answer: result,
    hint: 'Pour des evenements incompatibles, P(A ∪ B) = P(A) + P(B).',
    explanation:
      `A et B sont incompatibles (ils ne peuvent pas se produire en meme temps).\n` +
      `Donc P(A ∪ B) = P(A) + P(B) = ${pa} + ${pb} = ${frac(na + nb, denom)} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// vol-mcq-pyramid : Volume formula of pyramid MCQ
// ---------------------------------------------------------------------------
register('vol-mcq-pyramid', (item) => {
  const correct = 'V = (1/3) × aire de la base × hauteur';
  const wrongs = [
    'V = aire de la base × hauteur',
    'V = (1/2) × aire de la base × hauteur',
    'V = (4/3) × aire de la base × hauteur'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Quelle est la formule du volume d\'une pyramide ?',
    answer,
    choices,
    hint: 'Le volume d\'une pyramide est un tiers de celui du prisme correspondant.',
    explanation:
      'V = (1/3) × B × h, ou B est l\'aire de la base et h la hauteur.\n' +
      'C\'est un tiers du volume du prisme de meme base et meme hauteur.\n' +
      'Cette formule s\'applique a toute pyramide, quelle que soit la forme de la base.'
  };
});

// ---------------------------------------------------------------------------
// vol-solve-cone : Volume of cone in terms of π
// ---------------------------------------------------------------------------
register('vol-solve-cone', (item) => {
  const r = randInt(2, 8);
  const h = randInt(3, 12);
  const rSq = r * r;
  // V = (1/3)πr²h
  const num = rSq * h;
  const [sn, sd] = simplify(num, 3);
  const result = sd === 1 ? `${sn}π` : `${sn}π/${sd}`;
  return {
    question: `Calcule le volume d'un cone de rayon ${r} cm et de hauteur ${h} cm. (reponse en termes de π, ex : 12π ou 5π/3)`,
    answer: result,
    hint: 'V = (1/3) × π × r² × h.',
    explanation:
      `V = (1/3) × π × r² × h\n` +
      `V = (1/3) × π × ${r}² × ${h}\n` +
      `V = (1/3) × π × ${rSq} × ${h}\n` +
      `V = (1/3) × ${rSq * h}π\n` +
      `V = ${result} cm³.`
  };
});

// ---------------------------------------------------------------------------
// vol-mcq-sphere-formula : Volume formula of sphere MCQ
// ---------------------------------------------------------------------------
register('vol-mcq-sphere-formula', (item) => {
  const correct = 'V = (4/3)πr³';
  const wrongs = [
    'V = (4/3)πr²',
    'V = 4πr³',
    'V = (2/3)πr³'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Quelle est la formule du volume d\'une sphere de rayon r ?',
    answer,
    choices,
    hint: 'Le coefficient est 4/3 et le rayon est au cube.',
    explanation:
      'V = (4/3)πr³.\n' +
      'Attention aux erreurs frequentes : le rayon est bien au CUBE (pas au carre),\n' +
      'et le coefficient est 4/3 (pas 4 ni 2/3).'
  };
});

// ---------------------------------------------------------------------------
// vol-solve-sphere : Volume of sphere in terms of π
// ---------------------------------------------------------------------------
register('vol-solve-sphere', (item) => {
  const r = randInt(2, 9);
  const rCube = r * r * r;
  const num = 4 * rCube;
  const [sn, sd] = simplify(num, 3);
  const result = sd === 1 ? `${sn}π` : `${sn}π/${sd}`;
  return {
    question: `Calcule le volume d'une sphere de rayon ${r} cm. (reponse en termes de π)`,
    answer: result,
    hint: 'V = (4/3)πr³.',
    explanation:
      `V = (4/3) × π × r³\n` +
      `V = (4/3) × π × ${r}³\n` +
      `V = (4/3) × ${rCube} × π\n` +
      `V = ${result} cm³.`
  };
});

// ---------------------------------------------------------------------------
// vol-mcq-double-sphere : Double the radius, how does volume change? MCQ
// ---------------------------------------------------------------------------
register('vol-mcq-double-sphere', (item) => {
  const correct = 'Le volume est multiplie par 8';
  const wrongs = [
    'Le volume est multiplie par 2',
    'Le volume est multiplie par 4',
    'Le volume est multiplie par 6'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  const r = randInt(2, 5);
  const v1 = `(4/3)π × ${r}³`;
  const v2 = `(4/3)π × ${2 * r}³`;
  return {
    question: `Si on double le rayon d'une sphere (de ${r} cm a ${2 * r} cm), comment change le volume ?`,
    answer,
    choices,
    hint: 'V = (4/3)πr³. Que se passe-t-il quand r devient 2r ?',
    explanation:
      `V(r) = (4/3)πr³.\n` +
      `V(2r) = (4/3)π(2r)³ = (4/3)π × 8r³ = 8 × (4/3)πr³ = 8 × V(r).\n` +
      `Le volume est multiplie par 2³ = 8. En general, quand on multiplie le rayon par k,\n` +
      `le volume est multiplie par k³.`
  };
});
