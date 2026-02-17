/**
 * Thales (3eme) - Thales' theorem generators.
 */
import { randInt, randChoice, mcq, mcqStrings, distractors, frac, simplify, round } from './helpers.js';
import { register } from './registry.js';

// ---------------------------------------------------------------------------
// Helper: generate proportional lengths for Thales configurations
// ---------------------------------------------------------------------------
function thalesConfig() {
  // AM/AB = AN/AC = MN/BC
  const k = randChoice([2, 3, 4, 5]); // ratio denominator
  const n = randInt(1, k - 1);         // ratio numerator (n < k)
  const bc = randInt(3, 12);
  const ab = k * randInt(1, 4);
  const ac = k * randInt(1, 4);
  const am = (n * ab) / k;
  const an = (n * ac) / k;
  const mn = (n * bc) / k;
  return { ab, ac, bc, am, an, mn, k, n };
}

// ---------------------------------------------------------------------------
// thales-mcq-triangle : AM/AB = MN/BC, find MN MCQ
// ---------------------------------------------------------------------------
register('thales-mcq-triangle', (item) => {
  const { ab, bc, am, mn } = thalesConfig();
  const correct = mn;
  const wrongs = distractors(correct, 3, { positive: true });
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Dans un triangle ABC, M est sur [AB] avec AM = ${am} et AB = ${ab}. La droite (MN) est parallele a (BC) avec BC = ${bc}. Calcule MN.`,
    answer,
    choices,
    hint: 'Theoreme de Thales : AM/AB = MN/BC.',
    explanation:
      `D'apres le theoreme de Thales, puisque (MN) // (BC) :\n` +
      `AM/AB = MN/BC\n` +
      `${am}/${ab} = MN/${bc}\n` +
      `MN = ${am} × ${bc} / ${ab} = ${mn}.`
  };
});

// ---------------------------------------------------------------------------
// thales-solve-butterfly : Butterfly configuration, find missing length
// ---------------------------------------------------------------------------
register('thales-solve-butterfly', (item) => {
  // Butterfly: two triangles sharing vertex O
  // OA/OC = OB/OD = AB/CD
  const k = randChoice([2, 3, 4, 5]);
  const oa = randInt(2, 6);
  const ob = randInt(2, 6);
  const oc = oa * k;
  const od = ob * k;
  const ab = randInt(2, 8);
  const cd = ab * k;
  return {
    question: `Configuration papillon : O est le point d'intersection des droites (AC) et (BD). OA = ${oa}, OC = ${oc}, OB = ${ob}, AB = ${ab}. Les droites (AB) et (CD) sont paralleles. Calcule CD.`,
    answer: String(cd),
    hint: 'Dans une configuration papillon, OA/OC = AB/CD.',
    explanation:
      `D'apres Thales (configuration papillon) :\n` +
      `OA/OC = AB/CD\n` +
      `${oa}/${oc} = ${ab}/CD\n` +
      `CD = ${ab} × ${oc} / ${oa} = ${cd}.`
  };
});

// ---------------------------------------------------------------------------
// thales-mcq-shadow : Shadow/tree problem MCQ
// ---------------------------------------------------------------------------
register('thales-mcq-shadow', (item) => {
  // Person height / person shadow = tree height / tree shadow
  const personH = randChoice([1.5, 1.6, 1.7, 1.8]);
  const personS = randChoice([2, 2.5, 3]);
  const treeS = randChoice([8, 10, 12, 15, 20]);
  const treeH = round(personH * treeS / personS, 1);
  const correct = treeH;
  const wrongs = [
    round(treeH + 1.5, 1),
    round(treeH - 1.2, 1),
    round(personH * treeS, 1)
  ].filter(w => w > 0 && w !== correct);
  while (wrongs.length < 3) wrongs.push(round(treeH + wrongs.length + 2, 1));
  const { choices, answer } = mcq(correct, wrongs.slice(0, 3));
  return {
    question: `Une personne de ${personH} m projette une ombre de ${personS} m. Au meme moment, un arbre projette une ombre de ${treeS} m. Quelle est la hauteur de l'arbre ?`,
    answer,
    choices,
    hint: 'Les rayons du soleil sont paralleles : utilisez Thales.',
    explanation:
      `Par Thales (rayons paralleles) :\n` +
      `personne / ombre personne = arbre / ombre arbre\n` +
      `${personH} / ${personS} = arbre / ${treeS}\n` +
      `arbre = ${personH} × ${treeS} / ${personS} = ${treeH} m.`
  };
});

// ---------------------------------------------------------------------------
// thales-solve-find-nc : Given AM, MB, AN, find NC
// ---------------------------------------------------------------------------
register('thales-solve-find-nc', (item) => {
  // M on [AB], N on [AC], (MN) // (BC)
  // AM/MB = AN/NC
  const am = randInt(2, 8);
  const mb = randInt(2, 8);
  const an = randInt(2, 8);
  const nc = round(an * mb / am, 2);
  // Ensure clean answer
  const cleanAM = randInt(2, 6);
  const cleanMB = randInt(2, 6);
  const cleanAN = cleanAM * randInt(1, 4);
  const cleanNC = cleanAN * cleanMB / cleanAM;
  return {
    question: `Dans un triangle ABC, (MN) // (BC). AM = ${cleanAM}, MB = ${cleanMB}, AN = ${cleanAN}. Calcule NC.`,
    answer: String(cleanNC),
    hint: 'Thales : AM/MB = AN/NC.',
    explanation:
      `D'apres le theoreme de Thales :\n` +
      `AM/MB = AN/NC\n` +
      `${cleanAM}/${cleanMB} = ${cleanAN}/NC\n` +
      `NC = ${cleanAN} × ${cleanMB} / ${cleanAM} = ${cleanNC}.`
  };
});

// ---------------------------------------------------------------------------
// thales-mcq-reciprocal : Does proportionality imply parallelism? MCQ
// ---------------------------------------------------------------------------
register('thales-mcq-reciprocal', (item) => {
  const am = randInt(2, 5);
  const ab = am * randChoice([2, 3, 4]);
  const an = randInt(2, 5);
  const ac = an * (ab / am); // same ratio => parallel
  const correct = `Oui, car AM/AB = AN/AC = ${frac(am, ab)}`;
  const wrongs = [
    'Non, les rapports ne sont pas egaux',
    'On ne peut pas conclure sans connaitre MN et BC',
    'Oui, mais seulement si le triangle est rectangle'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `M est sur [AB] et N sur [AC]. AM = ${am}, AB = ${ab}, AN = ${an}, AC = ${ac}. Les droites (MN) et (BC) sont-elles paralleles ?`,
    answer,
    choices,
    hint: 'Reciproque de Thales : si AM/AB = AN/AC avec les points dans le bon ordre, alors (MN) // (BC).',
    explanation:
      `AM/AB = ${am}/${ab} = ${frac(am, ab)}.\n` +
      `AN/AC = ${an}/${ac} = ${frac(an, ac)}.\n` +
      `Les rapports sont egaux, et les points sont dans le meme ordre sur chaque droite.\n` +
      `Par la reciproque de Thales, (MN) // (BC).`
  };
});

// ---------------------------------------------------------------------------
// thales-solve-butterfly-full : Full butterfly problem
// ---------------------------------------------------------------------------
register('thales-solve-butterfly-full', (item) => {
  // O intersection of (AC) and (BD), (AB) // (CD)
  // OA/OC = OB/OD
  const ratio = randChoice([2, 3, 4]);
  const oa = randInt(2, 5);
  const ob = randInt(2, 5);
  const oc = oa * ratio;
  const od = ob * ratio;
  return {
    question: `Les droites (AC) et (BD) se coupent en O. (AB) // (CD). OA = ${oa} cm, OB = ${ob} cm, OC = ${oc} cm. Calcule OD.`,
    answer: String(od),
    hint: 'Configuration papillon : OA/OC = OB/OD.',
    explanation:
      `Par Thales (configuration papillon) :\n` +
      `OA/OC = OB/OD\n` +
      `${oa}/${oc} = ${ob}/OD\n` +
      `OD = ${ob} × ${oc} / ${oa} = ${od} cm.`
  };
});
