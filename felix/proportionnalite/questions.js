/**
 * Proportionnalité (4ème) — chapters, revision sheets and question generators.
 *
 * Scope follows the cycle 4 programme (4ème part) and classic textbooks
 * (Sésamath, Dimathème): recognise proportionality, fourth proportional,
 * graphs, percentages, multiplying coefficients, quotient quantities
 * (speed, flow, density), scales, ratios and proportional sharing.
 *
 * Every generator returns a fresh question:
 *   { kind: 'num' | 'mcq', text, table?, graph?, choices?, answer, unit?, tol?, correction }
 * For 'num', `answer` is a number. For 'mcq', `answer` is the index of the right choice.
 * This module has no DOM dependency so tests can run it in Node.
 */

// ─── Helpers ───────────────────────────────────────────────────────────────

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

function round(n, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/** French number formatting: 1 224,5 */
export function fmt(n, d = 2) {
  return round(n, d).toLocaleString('fr-FR', { maximumFractionDigits: d });
}

/** Euro amount: always two decimals when not an integer (2,40 €) */
function eur(n) {
  const r = round(n, 2);
  return Number.isInteger(r) ? `${fmt(r)} €` : `${r.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/** Duration in minutes → "1 h 15 min" */
export function fmtDuree(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, '0')} min`;
}

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Build an MCQ from the right choice and wrong choices (duplicates removed). */
function mcq(correct, wrongs) {
  const uniq = [...new Set(wrongs.filter(w => w !== correct))].slice(0, 3);
  const all = shuffle([correct, ...uniq]);
  return { choices: all, answer: all.indexOf(correct) };
}

function niceCeil(v) {
  const steps = [5, 10, 20, 25, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500, 1000];
  return steps.find(s => s >= v) || Math.ceil(v / 100) * 100;
}

// ─── 1. Reconnaître la proportionnalité ───────────────────────────────────

const TABLE_CONTEXTS = [
  ['Masse de pommes (kg)', 'Prix (€)'],
  ['Nombre de stylos', 'Prix (€)'],
  ['Durée (h)', 'Distance (km)'],
  ['Volume de lait (L)', 'Masse (kg)'],
];

function recoTableau() {
  const [l1, l2] = pick(TABLE_CONTEXTS);
  const k = pick([1.25, 1.5, 2.5, 0.8, 1.2, 3.5, 0.6, 2.4]);
  const xs = sample([2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20], 4).sort((a, b) => a - b);
  const ys = xs.map(x => round(x * k));
  const prop = Math.random() < 0.5;
  if (!prop) {
    const bad = randInt(1, 3);
    ys[bad] = round(ys[bad] + pick([0.5, 1, 1.5, 2]));
  }
  const quotients = xs.map((x, i) => {
    const q = ys[i] / x;
    return `${fmt(ys[i])} ÷ ${fmt(x)} ${round(q, 3) === q ? '=' : '≈'} ${fmt(q, 3)}`;
  });
  const yes = `Oui, le coefficient est ${fmt(k)}`;
  const no = 'Non, les quotients ne sont pas tous égaux';
  const { choices, answer } = mcq(prop ? yes : no, [
    prop ? no : yes,
    `Oui, le coefficient est ${fmt(1 / k, 2)}`,
    'On ne peut pas savoir sans graphique',
    'Oui, car les deux lignes augmentent',
  ]);
  return {
    kind: 'mcq',
    text: 'Ce tableau est-il un tableau de proportionnalité ?',
    table: { rows: [[l1, ...xs.map(x => fmt(x))], [l2, ...ys.map(y => fmt(y))]] },
    choices, answer,
    correction:
      `On calcule le quotient de chaque colonne (2e ligne ÷ 1re ligne) :\n${quotients.join('\n')}\n` +
      (prop
        ? `Tous les quotients sont égaux à ${fmt(k)} : c'est un tableau de proportionnalité, de coefficient ${fmt(k)}.`
        : `Les quotients ne sont pas tous égaux : ce n'est pas un tableau de proportionnalité. Il suffit de deux quotients différents pour conclure.`),
  };
}

const SITU_PROP = [
  'Le prix payé et la masse de tomates achetées (même prix au kilo)',
  'Le périmètre d\'un carré et la longueur de son côté',
  'La distance parcourue et la durée, à vitesse constante',
  'La quantité de farine et le nombre de crêpes, pour une même recette',
  'Le prix payé et le nombre de litres d\'essence achetés',
];
const SITU_NON = [
  'La taille d\'un enfant et son âge',
  'L\'aire d\'un carré et la longueur de son côté',
  'Le prix d\'une course de taxi (avec une prise en charge fixe) et la distance parcourue',
  'La pointure d\'une personne et son âge',
  'Le prix de photos à 0,15 € l\'unité avec 3 € de frais de port, et le nombre de photos',
  'La température extérieure et l\'heure de la journée',
];

function recoSituation() {
  const good = pick(SITU_PROP);
  const { choices, answer } = mcq(good, sample(SITU_NON, 3));
  return {
    kind: 'mcq',
    text: 'Laquelle de ces situations est une situation de <strong>proportionnalité</strong> ?',
    choices, answer,
    correction:
      `Bonne réponse : « ${good} ».\n` +
      'Deux grandeurs sont proportionnelles quand on passe de l\'une à l\'autre en multipliant toujours par le même nombre. ' +
      'Une partie fixe (prise en charge, frais de port) ou un carré (aire = côté × côté) casse la proportionnalité.',
  };
}

function recoCoefficient() {
  const [l1, l2] = pick(TABLE_CONTEXTS);
  const k = pick([1.5, 2.5, 0.5, 1.25, 4, 0.75, 1.2, 3.2]);
  const xs = sample([2, 4, 5, 6, 8, 10, 12, 16, 20], 3).sort((a, b) => a - b);
  return {
    kind: 'num',
    text: 'Ce tableau est un tableau de proportionnalité. Par quel nombre multiplie-t-on la 1re ligne pour obtenir la 2e ligne ?',
    table: { rows: [[l1, ...xs.map(x => fmt(x))], [l2, ...xs.map(x => fmt(x * k))]] },
    answer: k,
    correction: `Le coefficient de proportionnalité est le quotient ${fmt(xs[0] * k)} ÷ ${fmt(xs[0])} = ${fmt(k)}.\nOn vérifie : ${fmt(xs[1])} × ${fmt(k)} = ${fmt(xs[1] * k)}.`,
  };
}

// ─── 2. Quatrième proportionnelle ──────────────────────────────────────────

const UNIT_ITEMS = [
  { one: 'cahier', many: 'cahiers', price: [1.6, 2.2, 2.4, 1.8, 3.5] },
  { one: 'kg de pommes', many: 'kg de pommes', price: [1.8, 2.4, 2.6, 3.2] },
  { one: 'place de cinéma', many: 'places de cinéma', price: [7.5, 8.5, 9.2, 6.8] },
  { one: 'mètre de tissu', many: 'mètres de tissu', price: [4.5, 6.2, 3.8, 12.5] },
];

function q4Unite() {
  const it = pick(UNIT_ITEMS);
  const u = pick(it.price);
  const n1 = pick([3, 4, 5, 6, 8]);
  let n2 = pick([7, 9, 12, 15, 24, 36]);
  if (n2 === n1) n2 += 1;
  const p1 = round(n1 * u);
  return {
    kind: 'num',
    text: `${n1} ${it.many} coûtent ${eur(p1)}. Le prix est proportionnel à la quantité. Combien coûtent ${n2} ${it.many} ?`,
    unit: '€',
    answer: round(n2 * u),
    correction:
      `Passage à l'unité : 1 ${it.one} coûte ${eur(p1)} ÷ ${n1} = ${eur(u)}.\n` +
      `Donc ${n2} ${it.many} coûtent ${n2} × ${fmt(u)} = ${eur(n2 * u)}.\n` +
      `Avec le produit en croix : ${fmt(p1)} × ${n2} ÷ ${n1} = ${eur(n2 * u)}.`,
  };
}

function q4ProduitCroix() {
  // a → b, c → x with x = b × c ÷ a, chosen so that x has at most one decimal
  for (;;) {
    const a = pick([150, 200, 250, 300, 400, 500]);
    const b = pick([90, 120, 130, 160, 180, 240]);
    const c = pick([350, 400, 600, 750, 1000, 1200]);
    if (c === a) continue;
    const x = (b * c) / a;
    if (round(x, 1) !== x) continue;
    const ctx = pick([
      { t: `Pour faire ${a} g de confiture, il faut ${b} g de fruits. Combien faut-il de fruits pour faire ${c} g de confiture ?`, unit: 'g' },
      { t: `Un robot peint ${b} m² de mur avec ${a} mL de peinture. Quelle surface peint-il avec ${c} mL ?`, unit: 'm²' },
    ]);
    return {
      kind: 'num', text: ctx.t, unit: ctx.unit, answer: x,
      table: { rows: [['Grandeur 1', fmt(a), fmt(c)], ['Grandeur 2', fmt(b), 'x']] },
      correction:
        `Les grandeurs sont proportionnelles, on utilise l'égalité des produits en croix :\n` +
        `${fmt(a)} × x = ${fmt(b)} × ${fmt(c)}\n` +
        `x = ${fmt(b)} × ${fmt(c)} ÷ ${fmt(a)} = ${fmt(x)} ${ctx.unit}.`,
    };
  }
}

function q4Recette() {
  const p1 = pick([4, 6, 8]);
  let p2 = pick([2, 3, 5, 10, 12, 14]);
  if (p2 === p1) p2 = p1 + 2;
  const perPers = pick([40, 50, 60, 75, 80]);
  const ing = pick([['farine', 'g'], ['lait', 'mL'], ['sucre', 'g']]);
  const q1 = perPers * p1;
  return {
    kind: 'num',
    text: `Une recette pour ${p1} personnes demande ${fmt(q1)} ${ing[1]} de ${ing[0]}. Quelle quantité de ${ing[0]} faut-il pour ${p2} personnes ?`,
    unit: ing[1],
    answer: perPers * p2,
    correction:
      `Pour 1 personne : ${fmt(q1)} ÷ ${p1} = ${fmt(perPers)} ${ing[1]}.\n` +
      `Pour ${p2} personnes : ${p2} × ${fmt(perPers)} = ${fmt(perPers * p2)} ${ing[1]}.`,
  };
}

function q4Linearite() {
  const u = pick([1.8, 2.5, 1.2, 3.5, 0.9]);
  const a = pick([2, 3, 4]);
  const b = pick([5, 6, 7]);
  const it = pick(['kg de pommes', 'kg de carottes', 'litres de jus']);
  const add = Math.random() < 0.5;
  const target = add ? a + b : 3 * a;
  return {
    kind: 'num',
    text: `${a} ${it} coûtent ${eur(a * u)} et ${b} ${it} coûtent ${eur(b * u)}. Le prix est proportionnel à la quantité. Combien coûtent ${target} ${it} ?`,
    unit: '€',
    answer: round(target * u),
    correction: add
      ? `Propriété additive de linéarité : ${target} = ${a} + ${b}, donc le prix est ${fmt(a * u)} + ${fmt(b * u)} = ${eur(target * u)}.`
      : `Propriété multiplicative de linéarité : ${target} = 3 × ${a}, donc le prix est 3 × ${fmt(a * u)} = ${eur(target * u)}.`,
  };
}

function q4Duree() {
  const v = pick([48, 60, 72, 84, 90, 96, 120]);
  const t1 = pick([15, 20, 30, 45, 75, 90]);
  let t2 = pick([25, 40, 50, 100, 120, 150]);
  const d1 = (v * t1) / 60;
  const d2 = (v * t2) / 60;
  return {
    kind: 'num',
    text: `Une voiture roule à vitesse constante. Elle parcourt ${fmt(d1)} km en ${fmtDuree(t1)}. Combien de minutes lui faut-il pour parcourir ${fmt(d2)} km ?`,
    unit: 'min',
    answer: t2,
    correction:
      `On travaille en minutes : ${fmtDuree(t1)} = ${t1} min.\n` +
      `Produit en croix : t = ${fmt(d2)} × ${t1} ÷ ${fmt(d1)} = ${t2} min` + (t2 >= 60 ? `, soit ${fmtDuree(t2)}.` : '.'),
  };
}

function q4Tableau() {
  const k = pick([1.5, 2.5, 0.4, 1.2, 3, 0.8]);
  const xs = sample([2, 3, 5, 6, 10, 15, 20, 25], 4).sort((a, b) => a - b);
  const hole = randInt(1, 3);
  const [l1, l2] = pick(TABLE_CONTEXTS);
  const row2 = xs.map((x, i) => (i === hole ? '?' : fmt(x * k)));
  return {
    kind: 'num',
    text: 'Ce tableau est un tableau de proportionnalité. Quel nombre faut-il écrire à la place du « ? » ?',
    table: { rows: [[l1, ...xs.map(x => fmt(x))], [l2, ...row2]] },
    answer: round(xs[hole] * k),
    correction:
      `Coefficient : ${fmt(xs[0] * k)} ÷ ${fmt(xs[0])} = ${fmt(k)}.\n` +
      `Nombre manquant : ${fmt(xs[hole])} × ${fmt(k)} = ${fmt(xs[hole] * k)}.`,
  };
}

// ─── 3. Représentation graphique ───────────────────────────────────────────

const GRAPH_CONTEXTS = [
  { x: 'Masse (kg)', y: 'Prix (€)' },
  { x: 'Durée (h)', y: 'Distance (km)' },
  { x: 'Volume (L)', y: 'Masse (kg)' },
];

/** Build a graph with integer x values from 1 to 8 for the points. */
function graphFor(points, ctx, line) {
  const maxY = Math.max(...points.map(p => p[1]), line ? line.k * 10 + (line.b || 0) : 0);
  const ymax = niceCeil(maxY);
  return { xmax: 10, ymax, xstep: 1, ystep: ymax / 5, xLabel: ctx.x, yLabel: ctx.y, points, line };
}

function graphNature() {
  const ctx = pick(GRAPH_CONTEXTS);
  const type = pick(['prop', 'affine', 'courbe']);
  const xs = sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 5).sort((a, b) => a - b);
  let pts;
  if (type === 'prop') {
    const k = pick([2, 3, 4, 5]);
    pts = xs.map(x => [x, k * x]);
  } else if (type === 'affine') {
    const k = pick([2, 3, 4]);
    const b = pick([5, 8, 10]);
    pts = xs.map(x => [x, k * x + b]);
  } else {
    pts = xs.map(x => [x, round(0.5 * x * x, 1)]);
  }
  const answers = {
    prop: 'Oui : les points sont alignés avec l\'origine du repère',
    affine: 'Non : les points sont alignés, mais pas avec l\'origine',
    courbe: 'Non : les points ne sont pas alignés',
  };
  const { choices, answer } = mcq(answers[type], [
    ...Object.values(answers),
    'Oui : les points montent régulièrement',
  ]);
  return {
    kind: 'mcq',
    text: 'Ce graphique représente-t-il une situation de proportionnalité ?',
    graph: graphFor(pts, ctx),
    choices, answer,
    correction:
      'Propriété : deux grandeurs sont proportionnelles si et seulement si les points qui les représentent sont alignés avec l\'origine du repère.\n' +
      (type === 'prop' ? 'Ici, les points sont sur une droite qui passe par l\'origine : c\'est une situation de proportionnalité.'
        : type === 'affine' ? 'Ici, les points sont alignés, mais la droite coupe l\'axe vertical au-dessus de 0 : ce n\'est pas une situation de proportionnalité.'
          : 'Ici, les points forment une courbe : ce n\'est pas une situation de proportionnalité.'),
  };
}

function graphLecture() {
  const ctx = pick(GRAPH_CONTEXTS);
  const k = pick([1.5, 2, 2.5, 3, 4]);
  const x0 = pick([2, 4]);
  const x2 = pick([12, 15, 20, 30]);
  return {
    kind: 'num',
    text: `Le graphique représente une situation de proportionnalité. Le point marqué a pour abscisse ${x0}. Quelle valeur correspond à ${x2} sur l'axe horizontal (hors du graphique) ?`,
    graph: graphFor([[x0, k * x0]], ctx, { k, b: 0 }),
    answer: k * x2,
    correction:
      `On lit le point (${x0} ; ${fmt(k * x0)}). Le coefficient est ${fmt(k * x0)} ÷ ${x0} = ${fmt(k)}.\n` +
      `Pour ${x2} : ${x2} × ${fmt(k)} = ${fmt(k * x2)}.`,
  };
}

function graphCarre() {
  const askAire = Math.random() < 0.5;
  const good = askAire
    ? 'Les points de l\'aire forment une courbe : l\'aire n\'est pas proportionnelle au côté'
    : 'Les points du périmètre sont alignés avec l\'origine : le périmètre est proportionnel au côté';
  const { choices, answer } = mcq(good, [
    askAire
      ? 'Les points de l\'aire sont alignés avec l\'origine : l\'aire est proportionnelle au côté'
      : 'Les points du périmètre forment une courbe : le périmètre n\'est pas proportionnel au côté',
    'Les deux grandeurs sont proportionnelles au côté',
    'Aucune des deux grandeurs ne dépend du côté',
  ]);
  return {
    kind: 'mcq',
    text: `On représente ${askAire ? 'l\'aire' : 'le périmètre'} d'un carré en fonction de la longueur de son côté (côtés 1, 2, 3, 4 et 5 cm). Que voit-on ?`,
    choices, answer,
    correction:
      'Périmètre = 4 × côté : on multiplie toujours par 4, les points (1 ; 4), (2 ; 8), (3 ; 12)… sont alignés avec l\'origine.\n' +
      'Aire = côté × côté : (1 ; 1), (2 ; 4), (3 ; 9)… ne sont pas alignés. L\'aire n\'est pas proportionnelle au côté.',
  };
}

// ─── 4. Pourcentages ───────────────────────────────────────────────────────

function pctAppliquer() {
  for (;;) {
    const total = pick([20, 24, 25, 30, 40, 50, 120, 250, 360]);
    const t = pick([5, 10, 15, 20, 25, 30, 40, 60, 75]);
    const x = (t * total) / 100;
    if (!Number.isInteger(x)) continue;
    const ctx = pick([
      [`Dans ${total > 40 ? 'un collège' : 'une classe'} de ${total} élèves, ${t} % sont des filles. Combien y a-t-il de filles ?`, 'filles'],
      [`Dans une entreprise de ${total} salariés, ${t} % travaillent à temps partiel. Combien de salariés cela représente-t-il ?`, 'salariés'],
    ]);
    return {
      kind: 'num', text: ctx[0], unit: ctx[1], answer: x,
      correction: `Prendre ${t} % d'une quantité, c'est la multiplier par ${t}/100 :\n${t}/100 × ${total} = ${fmt(x)}.`,
    };
  }
}

function pctCalculer() {
  for (;;) {
    const total = pick([20, 24, 25, 40, 50, 80, 200, 250]);
    const part = randInt(1, total - 1);
    const t = (part * 100) / total;
    if (round(t, 1) !== t) continue;
    return {
      kind: 'num',
      text: `Dans ${total > 40 ? 'un collège' : 'une classe'} de ${total} élèves, ${part} étudient l'espagnol. Quel pourcentage des élèves étudient l'espagnol ?`,
      unit: '%', answer: t,
      correction:
        `On cherche t tel que t/100 × ${total} = ${part}.\n` +
        `Produit en croix : t = ${part} × 100 ÷ ${total} = ${fmt(t)} %.`,
    };
  }
}

function pctTotal() {
  for (;;) {
    const t = pick([2, 4, 5, 8, 10, 12, 15, 20, 25]);
    const total = pick([50, 80, 120, 150, 200, 250, 300, 400]);
    const part = (t * total) / 100;
    if (!Number.isInteger(part)) continue;
    return {
      kind: 'num',
      text: `Dans une entreprise, les ${part} salariés à temps partiel représentent ${t} % de l'effectif total. Quel est l'effectif total ?`,
      unit: 'salariés', answer: total,
      correction:
        `On cherche N tel que ${t}/100 × N = ${part}.\n` +
        `N = ${part} × 100 ÷ ${t} = ${total} salariés.`,
    };
  }
}

function pctAutomatisme() {
  const t = pick([50, 25, 10, 1, 20, 75]);
  const base = { 50: [84, 130, 7], 25: [84, 120, 36], 10: [340, 45, 8.5], 1: [700, 250, 3200], 20: [120, 45, 350], 75: [40, 120, 200] }[t];
  const c = pick(base);
  const tips = {
    50: '50 %, c\'est la moitié.',
    25: '25 %, c\'est le quart : on divise par 4.',
    10: '10 %, c\'est diviser par 10.',
    1: '1 %, c\'est diviser par 100.',
    20: '20 %, c\'est 2 fois 10 %.',
    75: '75 %, c\'est 3 fois 25 % (les trois quarts).',
  };
  return {
    kind: 'num',
    text: `Calcule de tête : ${t} % de ${fmt(c)}.`,
    answer: round((t * c) / 100),
    correction: `${tips[t]}\n${t} % de ${fmt(c)} = ${fmt((t * c) / 100)}.`,
  };
}

// ─── 5. Évolutions et coefficient multiplicateur ──────────────────────────

function evoCM() {
  const t = pick([5, 12, 15, 20, 30, 35, 40]);
  const up = Math.random() < 0.5;
  const cm = up ? 1 + t / 100 : 1 - t / 100;
  const { choices, answer } = mcq(fmt(cm), [
    fmt(t / 100), fmt(up ? 1 - t / 100 : 1 + t / 100), fmt(t), fmt(1 + t / 10),
  ]);
  return {
    kind: 'mcq',
    text: `${up ? 'Augmenter' : 'Diminuer'} une quantité de ${t} %, c'est la multiplier par :`,
    choices, answer,
    correction:
      `${up ? 'Augmenter' : 'Diminuer'} de t %, c'est multiplier par (1 ${up ? '+' : '−'} t/100).\n` +
      `Ici : 1 ${up ? '+' : '−'} ${t}/100 = 1 ${up ? '+' : '−'} ${fmt(t / 100)} = ${fmt(cm)}. C'est le coefficient multiplicateur.`,
  };
}

function evoCMInverse() {
  const cm = pick([0.7, 0.85, 0.9, 1.05, 1.3, 1.25, 0.6]);
  const t = round(Math.abs(cm - 1) * 100);
  const good = cm > 1 ? `Augmenter de ${t} %` : `Diminuer de ${t} %`;
  const { choices, answer } = mcq(good, [
    cm > 1 ? `Diminuer de ${t} %` : `Augmenter de ${t} %`,
    cm > 1 ? `Augmenter de ${fmt(cm * 100)} %` : `Diminuer de ${fmt(cm * 100)} %`,
    `Augmenter de ${fmt(cm)} %`,
  ]);
  return {
    kind: 'mcq',
    text: `Multiplier un prix par ${fmt(cm)}, c'est :`,
    choices, answer,
    correction: cm > 1
      ? `${fmt(cm)} = 1 + ${fmt(cm - 1)} = 1 + ${t}/100 : c'est une augmentation de ${t} %.`
      : `${fmt(cm)} = 1 − ${fmt(1 - cm)} = 1 − ${t}/100 : c'est une diminution de ${t} %.`,
  };
}

function evoAppliquer() {
  const up = Math.random() < 0.5;
  const p = pick([40, 60, 75, 80, 120, 150, 180, 240]);
  const t = pick([5, 10, 15, 20, 25, 30, 40]);
  const cm = up ? 1 + t / 100 : 1 - t / 100;
  const item = pick(['un vélo', 'une paire de baskets', 'un smartphone', 'un jeu vidéo']);
  return {
    kind: 'num',
    text: up
      ? `Le prix d'${item} est de ${eur(p)}. Il augmente de ${t} %. Quel est le nouveau prix ?`
      : `Pendant les soldes, le prix d'${item} (${eur(p)}) baisse de ${t} %. Quel est le prix soldé ?`,
    unit: '€', answer: round(p * cm),
    correction:
      `Coefficient multiplicateur : 1 ${up ? '+' : '−'} ${t}/100 = ${fmt(cm)}.\n` +
      `Nouveau prix : ${fmt(p)} × ${fmt(cm)} = ${eur(p * cm)}.`,
  };
}

function evoTaux() {
  for (;;) {
    const a = pick([40, 50, 80, 120, 150, 200, 250]);
    const t = pick([-40, -30, -25, -20, -10, -5, 5, 10, 15, 20, 25, 30, 50]);
    const b = (a * (100 + t)) / 100;
    if (round(b, 2) !== b) continue;
    return {
      kind: 'num',
      text: `Le prix d'un article passe de ${eur(a)} à ${eur(b)}. De quel pourcentage a-t-il ${t > 0 ? 'augmenté' : 'baissé'} ?`,
      unit: '%', answer: Math.abs(t),
      correction:
        `Variation : ${fmt(b)} − ${fmt(a)} = ${fmt(b - a)} €.\n` +
        `Taux : ${fmt(Math.abs(b - a))} ÷ ${fmt(a)} = ${fmt(Math.abs(t) / 100)}, soit ${Math.abs(t)} %.\n` +
        `On peut aussi calculer ${fmt(b)} ÷ ${fmt(a)} = ${fmt(b / a)} (coefficient multiplicateur).`,
    };
  }
}

function evoAncien() {
  for (;;) {
    const t = pick([5, 10, 20, 25, 50, -10, -20, -25]);
    const old = pick([60, 80, 100, 120, 160, 200, 240]);
    const cm = 1 + t / 100;
    const now = old * cm;
    if (round(now, 2) !== now) continue;
    return {
      kind: 'num',
      text: `Après ${t > 0 ? 'une augmentation' : 'une baisse'} de ${Math.abs(t)} %, un article coûte ${eur(now)}. Quel était son prix avant ?`,
      unit: '€', answer: old,
      correction:
        `Ancien prix × ${fmt(cm)} = ${fmt(now)}.\n` +
        `Ancien prix = ${fmt(now)} ÷ ${fmt(cm)} = ${eur(old)}.\n` +
        `Attention : on ne retire pas ${Math.abs(t)} % du nouveau prix !`,
    };
  }
}

function evoPiege() {
  const t = pick([10, 20, 30, 50]);
  const loss = (t * t) / 100;
  const good = `Il a baissé de ${fmt(loss)} %`;
  const { choices, answer } = mcq(good, [
    'Il est revenu au prix de départ',
    `Il a augmenté de ${fmt(loss)} %`,
    `Il a baissé de ${2 * t} %`,
  ]);
  return {
    kind: 'mcq',
    text: `Un prix augmente de ${t} %, puis baisse de ${t} %. Que s'est-il passé au total ?`,
    choices, answer,
    correction:
      `On multiplie les coefficients : ${fmt(1 + t / 100)} × ${fmt(1 - t / 100)} = ${fmt((1 + t / 100) * (1 - t / 100), 4)}.\n` +
      `Multiplier par ${fmt(1 - loss / 100, 4)}, c'est baisser de ${fmt(loss)} %. Les pourcentages ne s'additionnent pas !`,
  };
}

function evoSuccessives() {
  const [a, b] = pick([[10, 20], [20, 10], [10, 10], [20, 50], [50, 20], [20, 20], [10, 50]]);
  const tot = round(((1 + a / 100) * (1 + b / 100) - 1) * 100, 2);
  return {
    kind: 'num',
    text: `Un prix augmente de ${a} %, puis de ${b} %. De quel pourcentage a-t-il augmenté au total ?`,
    unit: '%', answer: tot,
    correction:
      `Coefficient total : ${fmt(1 + a / 100)} × ${fmt(1 + b / 100)} = ${fmt(1 + tot / 100, 4)}.\n` +
      `C'est une augmentation de ${fmt(tot)} % (et pas de ${a + b} %).`,
  };
}

// ─── 6. Grandeurs quotients : vitesse, débit, masse volumique ─────────────

function vitV() {
  const v = pick([4, 5, 6, 8.4, 12, 15, 18, 45, 60, 72, 80, 90]);
  const t = pick(v < 20 ? [30, 45, 90, 120, 150] : [30, 45, 90, 135, 150, 210]);
  const d = (v * t) / 60;
  if (round(d, 2) !== d) return vitV();
  const who = v < 20 ? pick(['Un randonneur', 'Un cycliste']) : pick(['Une voiture', 'Un bus']);
  return {
    kind: 'num',
    text: `${who} parcourt ${fmt(d)} km en ${fmtDuree(t)}. Quelle est sa vitesse moyenne en km/h ?`,
    unit: 'km/h', answer: v,
    correction:
      `On convertit la durée en heures : ${fmtDuree(t)} = ${t} ÷ 60 h = ${fmt(t / 60, 4)} h.\n` +
      `v = d ÷ t = ${fmt(d)} ÷ ${fmt(t / 60, 4)} = ${fmt(v)} km/h.`,
  };
}

function vitD() {
  const v = pick([60, 72, 80, 90, 110, 120, 130]);
  const t = pick([45, 90, 100, 135, 150, 165]);
  return {
    kind: 'num',
    text: `Un train roule à la vitesse moyenne de ${v} km/h pendant ${fmtDuree(t)}. Quelle distance parcourt-il ?`,
    unit: 'km', answer: round((v * t) / 60),
    correction:
      `${fmtDuree(t)} = ${fmt(t / 60, 4)} h.\n` +
      `d = v × t = ${v} × ${fmt(t / 60, 4)} = ${fmt((v * t) / 60)} km.`,
  };
}

function vitT() {
  const v = pick([60, 80, 90, 120, 820, 900]);
  const t = pick([45, 75, 90, 150, 200, 300]);
  const d = (v * t) / 60;
  if (round(d, 1) !== d) return vitT();
  const who = v > 500 ? 'Un avion' : 'Une voiture';
  return {
    kind: 'num',
    text: `${who} parcourt ${fmt(d)} km à la vitesse moyenne de ${v} km/h. Combien de minutes dure le trajet ?`,
    unit: 'min', answer: t,
    correction:
      `t = d ÷ v = ${fmt(d)} ÷ ${v} = ${fmt(t / 60, 4)} h.\n` +
      `${fmt(t / 60, 4)} h × 60 = ${t} min` + (t >= 60 ? `, soit ${fmtDuree(t)}.` : '.'),
  };
}

function vitConversion() {
  const toMs = Math.random() < 0.5;
  const ms = pick([5, 10, 15, 20, 25, 30, 340]);
  const kmh = ms * 3.6;
  return toMs
    ? {
      kind: 'num', text: `Convertis ${fmt(kmh)} km/h en m/s.`, unit: 'm/s', answer: ms,
      correction: `En 1 h = 3 600 s, on parcourt ${fmt(kmh)} km = ${fmt(kmh * 1000)} m.\nEn 1 s : ${fmt(kmh * 1000)} ÷ 3 600 = ${fmt(ms)} m/s.\nAstuce : on divise par 3,6.`,
    }
    : {
      kind: 'num', text: `${ms === 340 ? 'Le son se déplace dans l\'air à' : 'Un véhicule roule à'} ${ms} m/s. Convertis cette vitesse en km/h.`, unit: 'km/h', answer: kmh,
      correction: `En 1 s : ${ms} m. En 1 h = 3 600 s : ${ms} × 3 600 = ${fmt(ms * 3600)} m = ${fmt(kmh)} km.\nDonc ${fmt(kmh)} km/h. Astuce : on multiplie par 3,6.`,
    };
}

function vitDuree() {
  const toDec = Math.random() < 0.5;
  const min = pick([15, 24, 30, 36, 45, 48, 75, 90, 105, 135, 150]);
  return toDec
    ? {
      kind: 'num', text: `Écris ${fmtDuree(min)} en heures, sous forme décimale.`, unit: 'h', answer: round(min / 60, 2),
      correction: `${fmtDuree(min)} = ${min} min = ${min} ÷ 60 h = ${fmt(min / 60)} h.\nAttention : ${fmtDuree(min)} n'est pas ${Math.floor(min / 60)},${String(min % 60).padStart(2, '0')} h !`,
    }
    : {
      kind: 'num', text: `Combien de minutes y a-t-il dans ${fmt(min / 60)} h ?`, unit: 'min', answer: min,
      correction: `${fmt(min / 60)} h × 60 = ${min} min` + (min >= 60 ? `, soit ${fmtDuree(min)}.` : '.'),
    };
}

function grandeurAutre() {
  const type = pick(['debit', 'masse', 'conso', 'prixL']);
  if (type === 'debit') {
    const deb = pick([12, 15, 18, 25, 30]);
    const t = pick([4, 6, 8, 12]);
    return {
      kind: 'num', text: `Un robinet remplit une cuve de ${deb * t} L en ${t} min. Quel est son débit en L/min ?`, unit: 'L/min', answer: deb,
      correction: `Le débit est une grandeur quotient : volume ÷ durée = ${deb * t} ÷ ${t} = ${deb} L/min.`,
    };
  }
  if (type === 'masse') {
    const rho = pick([700, 800, 2700, 7800, 1000]);
    const v = pick([0.5, 2, 0.2, 1.5]);
    const mat = { 700: 'chêne', 800: 'pin', 2700: 'aluminium', 7800: 'acier', 1000: 'eau' }[rho];
    return {
      kind: 'num', text: `Un bloc de ${mat} de ${fmt(v)} m³ a une masse de ${fmt(rho * v)} kg. Quelle est la masse volumique du ${mat} en kg/m³ ?`, unit: 'kg/m³', answer: rho,
      correction: `Masse volumique = masse ÷ volume = ${fmt(rho * v)} ÷ ${fmt(v)} = ${fmt(rho)} kg/m³.`,
    };
  }
  if (type === 'conso') {
    const c = pick([5, 6, 6.5, 7, 8]);
    const d = pick([250, 350, 400, 450, 600]);
    return {
      kind: 'num', text: `Une voiture consomme ${fmt(c)} L d'essence aux 100 km. Combien consomme-t-elle pour un trajet de ${d} km ?`, unit: 'L', answer: round((c * d) / 100),
      correction: `La consommation est proportionnelle à la distance : ${fmt(c)} × ${d} ÷ 100 = ${fmt((c * d) / 100)} L.`,
    };
  }
  const p = pick([1.8, 1.9, 2.1]);
  const l = pick([25, 30, 40, 45]);
  return {
    kind: 'num', text: `Un plein de ${l} L d'essence coûte ${eur(p * l)}. Quel est le prix d'un litre ?`, unit: '€/L', answer: p,
    correction: `Prix au litre = prix ÷ volume = ${fmt(p * l)} ÷ ${l} = ${fmt(p)} €/L.`,
  };
}

function vitPiege() {
  const [v1, v2] = pick([[60, 40], [30, 60], [90, 60], [120, 80], [40, 60], [60, 90]]);
  const vm = (2 * v1 * v2) / (v1 + v2);
  const { choices, answer } = mcq(`${fmt(vm)} km/h`, [`${fmt((v1 + v2) / 2)} km/h`, `${v1 + v2} km/h`, `${fmt(Math.abs(v1 - v2))} km/h`]);
  const d = 120;
  return {
    kind: 'mcq',
    text: `Un cycliste fait l'aller (${d} km) à ${v1} km/h et le retour (${d} km) à ${v2} km/h. Quelle est sa vitesse moyenne sur l'aller-retour ?`,
    choices, answer,
    correction:
      `Durées : aller ${d} ÷ ${v1} = ${fmt(d / v1)} h, retour ${d} ÷ ${v2} = ${fmt(d / v2)} h, total ${fmt(d / v1 + d / v2)} h.\n` +
      `v = ${2 * d} ÷ ${fmt(d / v1 + d / v2)} = ${fmt(vm)} km/h.\n` +
      'La vitesse moyenne n\'est (presque) jamais la moyenne des vitesses !',
  };
}

// ─── 7. Échelles ───────────────────────────────────────────────────────────

function echPlanReel() {
  const e = pick([25000, 50000, 100000, 200000]);
  const cm = pick([3, 4, 5, 6, 8, 12]);
  const km = (cm * e) / 100000;
  return {
    kind: 'num',
    text: `Sur une carte à l'échelle 1/${fmt(e)}, deux villages sont à ${cm} cm l'un de l'autre. Quelle est la distance réelle en km ?`,
    unit: 'km', answer: km,
    correction:
      `1 cm sur la carte représente ${fmt(e)} cm en réalité.\n` +
      `${cm} × ${fmt(e)} = ${fmt(cm * e)} cm = ${fmt(km)} km (1 km = 100 000 cm).`,
  };
}

function echReelPlan() {
  const e = pick([50, 100, 200]);
  const m = pick([4, 5, 6, 8, 10, 12]);
  const cm = (m * 100) / e;
  return {
    kind: 'num',
    text: `Une pièce mesure ${m} m de long. On la dessine sur un plan à l'échelle 1/${e}. Quelle est sa longueur sur le plan, en cm ?`,
    unit: 'cm', answer: cm,
    correction: `${m} m = ${m * 100} cm.\nSur le plan : ${m * 100} ÷ ${e} = ${fmt(cm)} cm.`,
  };
}

function echTrouver() {
  const e = pick([200, 250, 500, 1000, 2000]);
  const cm = pick([2, 4, 5, 8, 10]);
  const reelM = (cm * e) / 100;
  return {
    kind: 'num',
    text: `Sur un plan, ${cm} cm représentent ${fmt(reelM)} m en réalité. L'échelle s'écrit 1/n. Quelle est la valeur de n ?`,
    answer: e,
    correction:
      'L\'échelle est le quotient distance sur le plan ÷ distance réelle, dans la même unité.\n' +
      `${fmt(reelM)} m = ${fmt(reelM * 100)} cm. Échelle : ${cm}/${fmt(reelM * 100)} = 1/${fmt(e)}.`,
  };
}

function echAgrandissement() {
  const e = pick([100, 1000, 10000]);
  const mm = pick([12, 15, 24, 30, 45]);
  const um = (mm * 1000) / e;
  return {
    kind: 'num',
    text: `Dans un livre, une cellule est dessinée à l'échelle ${fmt(e)}/1 (agrandie ${fmt(e)} fois). Son dessin mesure ${mm} mm. Quelle est sa taille réelle en micromètres (µm) ? (1 mm = 1 000 µm)`,
    unit: 'µm', answer: um,
    correction:
      `Taille réelle : ${mm} ÷ ${fmt(e)} = ${fmt(mm / e, 4)} mm.\n` +
      `${fmt(mm / e, 4)} mm × 1 000 = ${fmt(um)} µm.`,
  };
}

// ─── 8. Ratios et partage proportionnel ───────────────────────────────────

const NAMES = [['Léa', 'Tom'], ['Inès', 'Hugo'], ['Sami', 'Jade'], ['Noé', 'Lina']];

function ratioPartage2() {
  const [a, b] = pick([[2, 3], [1, 4], [3, 5], [2, 5], [3, 4], [1, 2]]);
  const unit = pick([6, 8, 10, 12, 15, 20]);
  const total = (a + b) * unit;
  const [n1, n2] = pick(NAMES);
  const askSecond = Math.random() < 0.5;
  return {
    kind: 'num',
    text: `${n1} et ${n2} se partagent ${total} bonbons dans le ratio ${a} : ${b} (${n1} : ${n2}). Combien de bonbons reçoit ${askSecond ? n2 : n1} ?`,
    unit: 'bonbons', answer: (askSecond ? b : a) * unit,
    correction:
      `Le ratio ${a} : ${b} fait ${a} + ${b} = ${a + b} parts égales.\n` +
      `Une part : ${total} ÷ ${a + b} = ${unit} bonbons.\n` +
      `${n1} : ${a} × ${unit} = ${a * unit}. ${n2} : ${b} × ${unit} = ${b * unit}.`,
  };
}

function ratioPartage3() {
  const r = pick([[2, 3, 4], [1, 2, 3], [1, 3, 4], [2, 3, 5]]);
  const s = r[0] + r[1] + r[2];
  const unit = pick([50, 100, 25, 40]);
  const total = s * unit;
  return {
    kind: 'num',
    text: `On partage une masse de ${fmt(total)} g de pâte en trois parts selon le ratio ${r.join(' : ')}. Quelle est la masse de la plus grande part ?`,
    unit: 'g', answer: r[2] * unit,
    correction: `${r.join(' + ')} = ${s} parts. Une part : ${fmt(total)} ÷ ${s} = ${unit} g.\nPlus grande part : ${r[2]} × ${unit} = ${fmt(r[2] * unit)} g.`,
  };
}

function ratioMelange() {
  const [a, b] = pick([[3, 5], [2, 3], [1, 4], [4, 3], [2, 5]]);
  const m = pick([2, 3, 4, 5]);
  const [c1, c2, res] = pick([['bleu', 'jaune', 'vert'], ['rouge', 'blanc', 'rose'], ['rouge', 'jaune', 'orange']]);
  return {
    kind: 'num',
    text: `Pour obtenir un ${res}, on mélange du ${c1} et du ${c2} dans le ratio ${a} : ${b}. Avec ${a * m} L de ${c1}, combien de litres de ${c2} faut-il ?`,
    unit: 'L', answer: b * m,
    correction: `${a * m} = ${a} × ${m} : on multiplie les deux nombres du ratio par ${m}.\n${b} × ${m} = ${b * m} L de ${c2}. Le ratio ${a * m} : ${b * m} est égal au ratio ${a} : ${b}.`,
  };
}

function ratioEgalite() {
  const [a, b] = pick([[2, 3], [3, 4], [1, 3], [3, 5], [2, 5]]);
  const m = pick([2, 3, 4]);
  const good = `${a * m} L de rouge et ${b * m} L de blanc`;
  const { choices, answer } = mcq(good, [
    `${a + m} L de rouge et ${b + m} L de blanc`,
    `${a * m} L de rouge et ${b * m + 1} L de blanc`,
    `${b * m} L de rouge et ${a * m} L de blanc`,
  ]);
  return {
    kind: 'mcq',
    text: `Un rose est obtenu avec ${a} L de rouge pour ${b} L de blanc. Quel mélange donne <strong>exactement le même rose</strong> ?`,
    choices, answer,
    correction:
      `Même couleur = même ratio. On multiplie les deux quantités par le même nombre (${m}) : ${a * m} : ${b * m}.\n` +
      `Ajouter la même quantité aux deux (${a}+${m} et ${b}+${m}) ne garde pas le ratio.`,
  };
}

function ratioAges() {
  const [a1, a2] = pick([[20, 30], [8, 12], [10, 15], [6, 9], [12, 18]]);
  const unit = pick([3, 5, 10, 2]);
  const total = (a1 + a2) * unit;
  return {
    kind: 'num',
    text: `On partage ${total} € entre deux enfants de ${a1} ans et ${a2} ans, proportionnellement à leur âge. Combien reçoit le plus âgé ?`,
    unit: '€', answer: a2 * unit,
    correction:
      `Le partage se fait dans le ratio ${a1} : ${a2}. ${a1} + ${a2} = ${a1 + a2}.\n` +
      `Le plus âgé reçoit ${a2}/${a1 + a2} de la somme : ${total} × ${a2} ÷ ${a1 + a2} = ${a2 * unit} €.`,
  };
}

function ratioSimplifier() {
  const [f, g] = pick([[12, 18], [15, 10], [14, 21], [16, 12], [20, 8]]);
  const d = gcd(f, g);
  const good = `${f / d} : ${g / d}`;
  const { choices, answer } = mcq(good, [`${g / d} : ${f / d}`, `${f} : ${f + g}`, `${f - d} : ${g - d}`, `1 : ${fmt(g / f)}`]);
  return {
    kind: 'mcq',
    text: `Une classe compte ${f} filles et ${g} garçons. Quel est le ratio filles : garçons, sous forme simplifiée ?`,
    choices, answer,
    correction: `On divise les deux nombres par leur plus grand diviseur commun, ${d} : ${f} ÷ ${d} = ${f / d} et ${g} ÷ ${d} = ${g / d}. Ratio ${good}.`,
  };
}

// ─── Problèmes (niveau contrôle / brevet) ──────────────────────────────────
// Multi-step problems: each test contains one per chapter.

function hardOffres() {
  for (;;) {
    const pa = pick([0.15, 0.2, 0.25, 0.3]);
    const pb = pick([0.08, 0.1, 0.12]);
    const fb = pick([3, 4, 5, 6]);
    const n = pick([20, 40, 50, 80, 100, 150]);
    const ca = round(pa * n);
    const cb = round(pb * n + fb);
    if (ca === cb) continue;
    const good = ca < cb ? `Offre A, qui coûte ${eur(ca)}` : `Offre B, qui coûte ${eur(cb)}`;
    const { choices, answer } = mcq(good, [
      ca < cb ? `Offre B, qui coûte ${eur(cb)}` : `Offre A, qui coûte ${eur(ca)}`,
      'Les deux offres coûtent le même prix',
      ca < cb ? `Offre B, qui coûte ${eur(round(pb * n))}` : `Offre A, qui coûte ${eur(round(pa * n + fb))}`,
    ]);
    return {
      kind: 'mcq',
      text: `Tirage de photos. Offre A : ${eur(pa)} la photo. Offre B : ${eur(pb)} la photo, plus ${eur(fb)} de frais d'envoi. Seule l'offre A est proportionnelle au nombre de photos. Quelle offre est la moins chère pour ${n} photos ?`,
      choices, answer,
      correction:
        `Offre A : ${n} × ${fmt(pa)} = ${eur(ca)}.\n` +
        `Offre B : ${n} × ${fmt(pb)} + ${fmt(fb)} = ${eur(cb)} (les frais fixes empêchent la proportionnalité).\n` +
        `La moins chère est l'offre ${ca < cb ? 'A' : 'B'}.`,
    };
  }
}

function hardPrixKg() {
  for (;;) {
    const ua = pick([2.4, 2.6, 2.7, 2.8, 3.2]);
    const ub = pick([2.5, 2.6, 2.9, 3.1]);
    if (ua === ub) continue;
    const ma = pick([1.5, 2.5, 3]);
    const mb = pick([4, 5]);
    const pa = round(ua * ma);
    const pb = round(ub * mb);
    if (round(pa / ma, 2) !== ua || round(pb / mb, 2) !== ub) continue;
    return {
      kind: 'num',
      text: `Au marché, un sac de ${fmt(ma)} kg de pommes coûte ${eur(pa)}, et un sac de ${fmt(mb)} kg coûte ${eur(pb)}. Quel est le prix d'un kilogramme pour le sac le plus avantageux ?`,
      unit: '€/kg', answer: Math.min(ua, ub),
      correction:
        `On compare les prix au kilogramme (passage à l'unité) :\n` +
        `Sac de ${fmt(ma)} kg : ${fmt(pa)} ÷ ${fmt(ma)} = ${eur(ua)} le kg.\n` +
        `Sac de ${fmt(mb)} kg : ${fmt(pb)} ÷ ${fmt(mb)} = ${eur(ub)} le kg.\n` +
        `Le plus avantageux coûte ${eur(Math.min(ua, ub))} le kg. Le sac le moins cher n'est pas forcément le plus avantageux !`,
    };
  }
}

function hardImprimante() {
  const ppm = pick([12, 16, 18, 20, 24]); // pages per minute
  const t1s = pick([90, 150, 210]); // seconds
  const p1 = (ppm * t1s) / 60;
  const t2 = pick([8, 12, 15, 25]);
  return {
    kind: 'num',
    text: `Une imprimante imprime ${fmt(p1)} pages en ${Math.floor(t1s / 60)} min ${t1s % 60} s. À ce rythme, combien de pages imprime-t-elle en ${t2} min ?`,
    unit: 'pages', answer: ppm * t2,
    correction:
      `On convertit en secondes : ${Math.floor(t1s / 60)} min ${t1s % 60} s = ${t1s} s et ${t2} min = ${t2 * 60} s.\n` +
      `Produit en croix : ${fmt(p1)} × ${t2 * 60} ÷ ${t1s} = ${ppm * t2} pages.`,
  };
}

function hardTarifs() {
  for (;;) {
    const a = pick([6, 7, 8, 9, 10]);
    const b = pick([3, 4, 5]);
    const n = pick([4, 5, 6, 8, 10]);
    const c = (a - b) * n;
    if (a <= b) continue;
    return {
      kind: 'num',
      text: `Piscine. Tarif A : ${a} € l'entrée. Tarif B : abonnement de ${c} €, puis ${b} € l'entrée. Le graphique montre les deux tarifs. Pour combien d'entrées les deux tarifs coûtent-ils le même prix ?`,
      graph: {
        xmax: Math.max(10, n + 2), ymax: niceCeil(a * Math.max(10, n + 2)), xstep: Math.max(10, n + 2) > 10 ? 2 : 1,
        ystep: niceCeil(a * Math.max(10, n + 2)) / 5, xLabel: 'Entrées', yLabel: 'Prix (€)', points: [],
        lines: [{ k: a, b: 0, label: 'A' }, { k: b, b: c, label: 'B' }],
      },
      unit: 'entrées', answer: n,
      correction:
        `Tarif A : ${a} × x (droite par l'origine, proportionnel). Tarif B : ${c} + ${b} × x (pas proportionnel).\n` +
        `Égalité : ${a}x = ${c} + ${b}x ⇔ ${a - b}x = ${c} ⇔ x = ${n}.\n` +
        `Les droites se coupent au point (${n} ; ${a * n}). Au-delà de ${n} entrées, le tarif B est plus avantageux.`,
    };
  }
}

function hardPctDouble() {
  for (;;) {
    const total = pick([480, 560, 600, 640, 720, 800]);
    const t1 = pick([40, 45, 55, 60]);
    const t2 = pick([15, 20, 25, 30]);
    const g = (total * t1) / 100;
    const f = (g * t2) / 100;
    if (!Number.isInteger(g) || !Number.isInteger(f)) continue;
    const askPct = Math.random() < 0.4;
    return {
      kind: 'num',
      text: `Un collège compte ${total} élèves. ${t1} % des élèves sont des garçons, et ${t2} % des garçons jouent au football. ` +
        (askPct ? 'Quel pourcentage des élèves du collège sont des garçons qui jouent au football ?' : 'Combien de garçons jouent au football ?'),
      unit: askPct ? '%' : 'garçons', answer: askPct ? (t1 * t2) / 100 : f,
      correction:
        `Garçons : ${t1}/100 × ${total} = ${g}.\n` +
        `Footballeurs : ${t2}/100 × ${g} = ${f}.\n` +
        (askPct ? `Pourcentage du collège : ${f} ÷ ${total} × 100 = ${fmt((t1 * t2) / 100)} % (c'est aussi ${fmt(t1 / 100)} × ${fmt(t2 / 100)} = ${fmt((t1 * t2) / 10000, 4)}).` : `Le référent du 2e pourcentage est le nombre de garçons, pas le nombre d'élèves.`),
    };
  }
}

function hardTVA() {
  for (;;) {
    const ht = pick([25, 35, 45, 60, 75, 120, 150]);
    const ttc = ht * 1.2;
    const askHT = Math.random() < 0.6;
    return askHT
      ? {
        kind: 'num',
        text: `Le prix TTC d'un article est égal au prix hors taxes (HT) augmenté de 20 % de TVA. Un casque coûte ${eur(ttc)} TTC. Quel est son prix HT ?`,
        unit: '€', answer: ht,
        correction: `Prix TTC = prix HT × 1,2.\nPrix HT = ${fmt(ttc)} ÷ 1,2 = ${eur(ht)}.\nAttention : ${fmt(ttc)} − 20 % de ${fmt(ttc)} = ${fmt(ttc * 0.8)} n'est pas le bon résultat.`,
      }
      : {
        kind: 'num',
        text: `Une ville compte ${fmt(ht * 1000)} habitants. Sa population augmente de 10 % la première année, puis de 20 % la deuxième année. Combien d'habitants compte-t-elle après deux ans ?`,
        unit: 'habitants', answer: round(ht * 1000 * 1.1 * 1.2),
        correction: `On applique les coefficients l'un après l'autre : ${fmt(ht * 1000)} × 1,1 × 1,2 = ${fmt(ht * 1000)} × 1,32 = ${fmt(ht * 1000 * 1.32)} habitants.`,
      };
  }
}

function hardHoraires() {
  for (;;) {
    const v = pick([80, 90, 100, 120, 150]);
    const tMin = pick([84, 96, 108, 138, 150, 162]);
    const d = (v * tMin) / 60;
    if (!Number.isInteger(d)) continue;
    const depH = randInt(7, 15);
    const depM = pick([5, 12, 17, 25, 38, 47]);
    const arr = depH * 60 + depM + tMin;
    const hm = (m) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
    return {
      kind: 'num',
      text: `Un train part à ${hm(depH * 60 + depM)} et arrive à ${hm(arr)}. Il a parcouru ${d} km. Quelle est sa vitesse moyenne en km/h ?`,
      unit: 'km/h', answer: v,
      correction:
        `Durée : de ${hm(depH * 60 + depM)} à ${hm(arr)}, il s'écoule ${fmtDuree(tMin)} = ${tMin} min = ${tMin} ÷ 60 = ${fmt(tMin / 60)} h.\n` +
        `v = ${d} ÷ ${fmt(tMin / 60)} = ${v} km/h.`,
    };
  }
}

function hardBaignoire() {
  const vol = pick([150, 180, 200, 240]);
  const robinet = pick([12, 15, 18]);
  const fuite = pick([2, 3, 5]);
  const net = robinet - fuite;
  if (vol % net !== 0) return hardBaignoire();
  return {
    kind: 'num',
    text: `Une baignoire de ${vol} L se remplit avec un robinet de débit ${robinet} L/min. Mais la bonde est mal fermée : ${fuite} L s'écoulent chaque minute. Combien de minutes faut-il pour la remplir ?`,
    unit: 'min', answer: vol / net,
    correction: `Chaque minute, la baignoire gagne ${robinet} − ${fuite} = ${net} L.\nDurée : ${vol} ÷ ${net} = ${vol / net} min.`,
  };
}

function hardSprint() {
  const [d, t] = pick([[100, 9.58], [100, 12.5], [200, 19.19], [400, 50], [100, 16]]);
  const kmh = (d / t) * 3.6;
  return {
    kind: 'num',
    text: `Un coureur parcourt ${d} m en ${fmt(t)} s. Quelle est sa vitesse moyenne en km/h ? Arrondis au dixième.`,
    unit: 'km/h', answer: round(kmh, 1), tol: 0.06,
    correction: `v = ${d} ÷ ${fmt(t)} ≈ ${fmt(d / t, 3)} m/s.\nEn km/h : ${fmt(d / t, 3)} × 3,6 ≈ ${fmt(kmh, 1)} km/h.`,
  };
}

function hardAirePlan() {
  const e = pick([100, 200, 250]);
  const [a, b] = pick([[2, 3], [2.5, 4], [3, 4], [2, 5], [4, 6]]);
  const ra = (a * e) / 100;
  const rb = (b * e) / 100;
  return {
    kind: 'num',
    text: `Sur un plan à l'échelle 1/${e}, une pièce rectangulaire mesure ${fmt(a)} cm sur ${fmt(b)} cm. Quelle est l'aire réelle de la pièce en m² ?`,
    unit: 'm²', answer: round(ra * rb),
    correction:
      `Longueurs réelles : ${fmt(a)} × ${e} = ${fmt(a * e)} cm = ${fmt(ra)} m et ${fmt(b)} × ${e} = ${fmt(b * e)} cm = ${fmt(rb)} m.\n` +
      `Aire : ${fmt(ra)} × ${fmt(rb)} = ${fmt(ra * rb)} m².\n` +
      `Piège : les aires ne sont pas multipliées par ${e}, mais par ${e} × ${e}.`,
  };
}

function hardMaquette() {
  const m = pick([
    { de: 'd\'une locomotive', le: 'La locomotive', e: 87, cms: [20, 22, 24] },
    { de: 'd\'une voiture', le: 'La voiture', e: 43, cms: [9, 10, 11] },
    { de: 'd\'un wagon', le: 'Le wagon', e: 160, cms: [15, 16, 18] },
    { de: 'd\'une moto', le: 'La moto', e: 24, cms: [8, 9] },
  ]);
  const cm = pick(m.cms);
  const realM = (cm * m.e) / 100;
  return {
    kind: 'num',
    text: `Une maquette ${m.de} est à l'échelle 1/${m.e}. ${m.le} mesure ${fmt(realM)} m en réalité. Quelle est la longueur de la maquette en cm ?`,
    unit: 'cm', answer: cm,
    correction: `${fmt(realM)} m = ${fmt(realM * 100)} cm.\nMaquette : ${fmt(realM * 100)} ÷ ${m.e} = ${cm} cm.`,
  };
}

function hardRatioDiff() {
  const [a, b] = pick([[3, 5], [2, 7], [4, 7], [1, 3], [5, 8]]);
  const unit = pick([4, 6, 8, 12, 15]);
  const [n1, n2] = pick(NAMES);
  return {
    kind: 'num',
    text: `${n1} et ${n2} se partagent une somme dans le ratio ${a} : ${b}. ${n2} reçoit ${(b - a) * unit} € de plus que ${n1}. Quelle somme se sont-ils partagée ?`,
    unit: '€', answer: (a + b) * unit,
    correction:
      `${n2} a ${b} − ${a} = ${b - a} part${b - a > 1 ? 's' : ''} de plus que ${n1}, qui valent ${(b - a) * unit} €.\n` +
      `Une part : ${(b - a) * unit} ÷ ${b - a} = ${unit} €. Somme : ${a + b} parts × ${unit} = ${(a + b) * unit} €.`,
  };
}

function hardBeton() {
  const r = pick([[1, 2, 3], [1, 2, 4], [1, 3, 5]]);
  const unit = pick([25, 40, 50, 75]);
  const sable = r[1] * unit;
  const s = r[0] + r[1] + r[2];
  return {
    kind: 'num',
    text: `Pour faire du béton, on mélange ciment, sable et gravier dans le ratio ${r.join(' : ')}. On utilise ${sable} kg de sable. Quelle masse totale de béton obtient-on ?`,
    unit: 'kg', answer: s * unit,
    correction: `Le sable correspond à ${r[1]} parts : une part = ${sable} ÷ ${r[1]} = ${unit} kg.\nTotal : ${r.join(' + ')} = ${s} parts, soit ${s} × ${unit} = ${s * unit} kg.`,
  };
}

// ─── Chapters ──────────────────────────────────────────────────────────────

export const THEMES = [
  {
    id: 'reconnaitre', icon: '🔍', title: 'Reconnaître la proportionnalité', exam: 2,
    variants: [recoTableau, recoSituation, recoCoefficient],
    hard: [hardOffres],
    fiche: `
      <h3>À retenir</h3>
      <p>Deux grandeurs sont <strong>proportionnelles</strong> quand on obtient les valeurs de l'une en multipliant les valeurs de l'autre par un <strong>même nombre k</strong>, le <strong>coefficient de proportionnalité</strong>.</p>
      <h3>Méthode : tester un tableau</h3>
      <p>On calcule le quotient de chaque colonne (2e ligne ÷ 1re ligne). Si tous les quotients sont égaux, le tableau est un tableau de proportionnalité.</p>
      <table class="prop-table"><tr><th>Stylos</th><td>3</td><td>5</td><td>12</td></tr><tr><th>Prix (€)</th><td>3,75</td><td>6,25</td><td>15</td></tr></table>
      <p>3,75 ÷ 3 = 6,25 ÷ 5 = 15 ÷ 12 = 1,25 → proportionnel, k = 1,25.</p>
      <p class="prop-warn">Deux quotients différents suffisent pour dire « non ». Pour dire « oui », il faut vérifier toutes les colonnes.</p>
      <h3>Pièges classiques</h3>
      <ul><li>Une partie fixe (prise en charge d'un taxi, frais de port) : pas proportionnel.</li><li>L'aire d'un carré et son côté : pas proportionnel (côté × côté).</li><li>L'âge et la taille : pas proportionnel.</li></ul>`,
  },
  {
    id: 'quatrieme', icon: '✖️', title: 'Quatrième proportionnelle', exam: 3,
    variants: [q4Unite, q4ProduitCroix, q4Recette, q4Linearite, q4Duree, q4Tableau],
    hard: [hardPrixKg, hardImprimante],
    fiche: `
      <h3>Trois méthodes</h3>
      <p><strong>1. Linéarité.</strong> 12 m de tissu coûtent 4 €. 36 m = 3 × 12 m, donc 36 m coûtent 3 × 4 = 12 €. On peut aussi additionner deux colonnes.</p>
      <p><strong>2. Passage à l'unité.</strong> 5 cahiers coûtent 11 €. 1 cahier : 11 ÷ 5 = 2,20 €. 36 cahiers : 36 × 2,20 = 79,20 €.</p>
      <p><strong>3. Produit en croix.</strong></p>
      <table class="prop-table"><tr><th>Confiture (g)</th><td>250</td><td>400</td></tr><tr><th>Fruits (g)</th><td>130</td><td>x</td></tr></table>
      <p>250 × x = 130 × 400, donc x = 130 × 400 ÷ 250 = 208 g.</p>
      <p class="prop-tip">Règle : dans un tableau de proportionnalité, a/b = c/d ⇔ a × d = b × c.</p>
      <h3>Avec des durées</h3>
      <p>Convertis d'abord dans la même unité : 1 h 15 min = 75 min.</p>`,
  },
  {
    id: 'graphique', icon: '📈', title: 'Représentation graphique', exam: 2,
    variants: [graphNature, graphLecture, graphCarre],
    hard: [hardTarifs],
    fiche: `
      <h3>Propriété</h3>
      <p>Si deux grandeurs sont proportionnelles, les points qui les représentent sont <strong>alignés avec l'origine</strong> du repère.</p>
      <h3>Réciproque</h3>
      <p>Si les points sont alignés sur une droite qui <strong>passe par l'origine</strong>, alors les grandeurs sont proportionnelles.</p>
      <h3>Exemple du carré</h3>
      <table class="prop-table"><tr><th>Côté (cm)</th><td>1</td><td>2</td><td>3</td><td>4</td></tr><tr><th>Périmètre</th><td>4</td><td>8</td><td>12</td><td>16</td></tr><tr><th>Aire</th><td>1</td><td>4</td><td>9</td><td>16</td></tr></table>
      <p>Le périmètre donne une droite par l'origine (P = 4 × c) ; l'aire donne une courbe : elle n'est pas proportionnelle au côté.</p>
      <p class="prop-warn">Des points alignés sur une droite qui ne passe pas par l'origine : ce n'est PAS de la proportionnalité.</p>`,
  },
  {
    id: 'pourcentages', icon: '％', title: 'Pourcentages', exam: 3,
    variants: [pctAppliquer, pctCalculer, pctTotal, pctAutomatisme],
    hard: [hardPctDouble],
    fiche: `
      <h3>Appliquer un pourcentage</h3>
      <p>Prendre t % d'une quantité, c'est la multiplier par t/100. 40 % de 30 élèves : 40/100 × 30 = 12.</p>
      <h3>Calculer un pourcentage</h3>
      <p>15 élèves sur 24 : t = 15 × 100 ÷ 24 = 62,5 %.</p>
      <h3>Retrouver le total</h3>
      <p>8 salariés représentent 4 % : N = 8 × 100 ÷ 4 = 200 salariés.</p>
      <h3>Calcul mental</h3>
      <ul><li>50 % = la moitié ; 25 % = le quart ; 75 % = les trois quarts.</li><li>10 % = ÷ 10 ; 1 % = ÷ 100 ; 20 % = 2 × 10 %.</li></ul>
      <p class="prop-tip">Repère toujours le <strong>référent</strong> : la quantité dont on prend le pourcentage.</p>`,
  },
  {
    id: 'evolutions', icon: '📊', title: 'Augmentations, réductions', exam: 3,
    variants: [evoCM, evoCMInverse, evoAppliquer, evoTaux, evoAncien, evoPiege, evoSuccessives],
    hard: [hardTVA],
    fiche: `
      <h3>Coefficient multiplicateur</h3>
      <ul><li>Augmenter de t % ⇔ multiplier par <strong>1 + t/100</strong>. +20 % → × 1,2.</li><li>Diminuer de t % ⇔ multiplier par <strong>1 − t/100</strong>. −25 % → × 0,75.</li></ul>
      <p>Un pantalon à 12,50 € augmente de 20 % : 12,50 × 1,2 = 15 €.</p>
      <h3>Taux d'évolution</h3>
      <p>Les éclairs passent de 3 € à 2,40 € : baisse de 0,60 €. 0,60 ÷ 3 = 0,2 → baisse de 20 %.</p>
      <h3>Retrouver l'ancien prix</h3>
      <p>Après +5 %, un prix vaut 126 € : ancien × 1,05 = 126, donc ancien = 126 ÷ 1,05 = 120 €.</p>
      <p class="prop-warn">Les pourcentages ne s'additionnent pas : +20 % puis −20 %, c'est × 1,2 × 0,8 = × 0,96, soit −4 %.</p>`,
  },
  {
    id: 'grandeurs', icon: '🚗', title: 'Vitesse et grandeurs quotients', exam: 3,
    variants: [vitV, vitD, vitT, vitConversion, vitDuree, grandeurAutre, vitPiege],
    hard: [hardHoraires, hardBaignoire, hardSprint],
    fiche: `
      <h3>Vitesse moyenne</h3>
      <p><strong>v = d ÷ t</strong>, donc <strong>d = v × t</strong> et <strong>t = d ÷ v</strong>.</p>
      <p>Un piéton parcourt 6,3 km en 45 min. 45 min = 0,75 h. v = 6,3 ÷ 0,75 = 8,4 km/h.</p>
      <h3>Durées</h3>
      <p>1 h = 60 min. 1 h 15 min = 1,25 h ; 0,1 h = 6 min. <span class="prop-warn-inline">1 h 30 ≠ 1,30 h !</span></p>
      <h3>Changer d'unité</h3>
      <p>90 km/h = 90 000 m en 3 600 s = 25 m/s. Raccourci : <strong>m/s × 3,6 = km/h</strong>.</p>
      <h3>Autres grandeurs quotients</h3>
      <ul><li>Débit : L/min, m³/s (volume ÷ durée).</li><li>Masse volumique : kg/m³ (masse ÷ volume).</li><li>Prix au litre : €/L ; consommation : L/100 km.</li></ul>
      <p class="prop-warn">La vitesse moyenne n'est (presque) jamais la moyenne des vitesses.</p>`,
  },
  {
    id: 'echelles', icon: '🗺️', title: 'Échelles', exam: 2,
    variants: [echPlanReel, echReelPlan, echTrouver, echAgrandissement],
    hard: [hardAirePlan, hardMaquette],
    fiche: `
      <h3>Définition</h3>
      <p>Sur un plan, les distances sont proportionnelles aux distances réelles. L'<strong>échelle</strong> est le coefficient : <strong>distance sur le plan ÷ distance réelle</strong>, dans la <strong>même unité</strong>.</p>
      <h3>Exemples</h3>
      <ul><li>Carte au 1/25 000 : 1 cm représente 25 000 cm = 250 m. 8 cm → 2 km.</li><li>Plan au 1/50 : un mur de 6 m = 600 cm mesure 600 ÷ 50 = 12 cm.</li><li>Échelle 1000/1 : agrandissement. Un dessin de 15 mm → 15 ÷ 1 000 = 0,015 mm réel.</li></ul>
      <p class="prop-tip">Conversions : 1 km = 1 000 m = 100 000 cm.</p>`,
  },
  {
    id: 'ratios', icon: '🎨', title: 'Ratios et partages', exam: 2,
    variants: [ratioPartage2, ratioPartage3, ratioMelange, ratioEgalite, ratioAges, ratioSimplifier],
    hard: [hardRatioDiff, hardBeton],
    fiche: `
      <h3>Ratio</h3>
      <p>Deux quantités x et y sont dans le <strong>ratio a : b</strong> si x/a = y/b : elles sont proportionnelles à a et b. Ex. 2 L de bleu pour 3 L de jaune : ratio 2 : 3. Le ratio 4 : 6 est égal au ratio 2 : 3.</p>
      <h3>Partage proportionnel</h3>
      <p>Partager 60 bonbons dans le ratio 2 : 3 : 2 + 3 = 5 parts ; 1 part = 60 ÷ 5 = 12. Léa : 2 × 12 = 24 ; Tom : 3 × 12 = 36.</p>
      <p>Partager 150 € entre deux personnes de 20 et 30 ans proportionnellement à leur âge : ratio 20 : 30, 50 parts, 1 part = 3 €. 60 € et 90 €.</p>
      <p class="prop-warn">Garder la même couleur = multiplier les deux quantités par le même nombre, pas ajouter la même quantité.</p>`,
  },
];

export const THEME_BY_ID = Object.fromEntries(THEMES.map(t => [t.id, t]));

/** All generators of a chapter: the basic ones first, then the problems. */
function allVariants(theme) {
  return [...theme.variants, ...theme.hard];
}

/** Generate one question of a chapter. `variant` indexes allVariants(); random if omitted. */
export function makeQuestion(themeId, variant) {
  const theme = THEME_BY_ID[themeId];
  const all = allVariants(theme);
  const idx = variant ?? randInt(0, all.length - 1);
  const q = all[idx]();
  return { ...q, theme: themeId, variant: idx, hard: idx >= theme.variants.length };
}

/** Practice set: `n` questions of one chapter, basics first, the last ones are problems. */
export function makePractice(themeId, n = 8) {
  const theme = THEME_BY_ID[themeId];
  const basics = shuffle(theme.variants.map((_, i) => i));
  const hards = shuffle(theme.hard.map((_, i) => theme.variants.length + i));
  const nHard = Math.min(2, n - 1);
  const qs = [];
  for (let i = 0; i < n - nHard; i++) qs.push(makeQuestion(themeId, basics[i % basics.length]));
  for (let i = 0; i < nHard; i++) qs.push(makeQuestion(themeId, hards[i % hards.length]));
  return qs;
}

/**
 * Full test (20 questions): per chapter, `exam` questions with distinct variants.
 * One of them is always a multi-step problem, as in a real 4ème test.
 */
export function makeExam() {
  const qs = [];
  for (const theme of THEMES) {
    const basics = shuffle(theme.variants.map((_, i) => i));
    for (let i = 0; i < theme.exam - 1; i++) qs.push(makeQuestion(theme.id, basics[i % basics.length]));
    qs.push(makeQuestion(theme.id, theme.variants.length + randInt(0, theme.hard.length - 1)));
  }
  return qs;
}

/** Parse a typed number: accepts "12,5", "12.5", "1 224", "36 €". */
export function parseAnswer(str) {
  if (str == null) return NaN;
  const s = String(str).replace(/[\s  ]/g, '').replace(',', '.');
  const m = s.match(/^[-+]?\d*\.?\d+/);
  return m ? parseFloat(m[0]) : NaN;
}

/** Check a question against the user's response (index for MCQ, string for num). */
export function isCorrect(q, response) {
  if (q.kind === 'mcq') return response === q.answer;
  const v = parseAnswer(response);
  if (Number.isNaN(v)) return false;
  const tol = q.tol ?? 0.011;
  return Math.abs(v - q.answer) <= tol;
}

/** Display string of the right answer. */
export function answerText(q) {
  if (q.kind === 'mcq') return q.choices[q.answer];
  return `${fmt(q.answer, 3)}${q.unit ? ' ' + q.unit : ''}`;
}
