/**
 * Nombres relatifs (5eme) + Multiplication de relatifs (4eme).
 */
import { randInt, randChoice, mcq, mcqStrings, distractors, shuffle } from './helpers.js';
import { register } from './registry.js';

// ---------------------------------------------------------------------------
// rel-add-diff : (-a) + (+b) with different signs
// ---------------------------------------------------------------------------
register('rel-add-diff', (item) => {
  const a = randInt(2, 15);
  let b = randInt(2, 15);
  while (b === a) b = randInt(2, 15); // ensure different for non-zero answer
  const result = -a + b;
  return {
    question: `Calcule : (−${a}) + (+${b})`,
    answer: String(result),
    hint: 'On soustrait les valeurs absolues et on garde le signe du plus grand.',
    explanation:
      `On a deux nombres de signes differents : |−${a}| = ${a} et |+${b}| = ${b}.\n` +
      `Difference des valeurs absolues : ${Math.abs(a - b)}.\n` +
      `Le signe est celui du nombre ayant la plus grande valeur absolue : ${a > b ? 'negatif' : 'positif'}.\n` +
      `Resultat : ${result}.`
  };
});

// ---------------------------------------------------------------------------
// rel-sub-neg : (-a) - (-b)
// ---------------------------------------------------------------------------
register('rel-sub-neg', (item) => {
  const a = randInt(2, 15);
  const b = randInt(2, 15);
  const result = -a - (-b); // = -a + b = b - a
  return {
    question: `Calcule : (−${a}) − (−${b})`,
    answer: String(result),
    hint: 'Soustraire un negatif revient a additionner un positif.',
    explanation:
      `Soustraire (−${b}) revient a ajouter (+${b}).\n` +
      `Donc (−${a}) − (−${b}) = (−${a}) + (+${b}) = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// rel-mcq-add-same : (-a) + (-b) same sign MCQ
// ---------------------------------------------------------------------------
register('rel-mcq-add-same', (item) => {
  const a = randInt(2, 12);
  const b = randInt(2, 12);
  const correct = -(a + b);
  const wrongs = distractors(correct, 3);
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Calcule : (−${a}) + (−${b})`,
    answer,
    choices,
    hint: 'Deux negatifs additionnes donnent un negatif.',
    explanation:
      `Meme signe : on additionne les valeurs absolues ${a} + ${b} = ${a + b},\n` +
      `et on garde le signe commun (negatif).\n` +
      `Resultat : −${a + b}.`
  };
});

// ---------------------------------------------------------------------------
// rel-solve-chain : (-a) + (+b) + (-c) + (+d) chain of 4
// ---------------------------------------------------------------------------
register('rel-solve-chain', (item) => {
  const a = randInt(2, 10);
  const b = randInt(2, 10);
  const c = randInt(2, 10);
  const d = randInt(2, 10);
  const result = -a + b + (-c) + d;
  const step1 = -a + b;
  const step2 = step1 + (-c);
  return {
    question: `Calcule : (−${a}) + (+${b}) + (−${c}) + (+${d})`,
    answer: String(result),
    hint: 'Additionne les positifs ensemble et les negatifs ensemble.',
    explanation:
      `Positifs : ${b} + ${d} = ${b + d}.\n` +
      `Negatifs : (−${a}) + (−${c}) = −${a + c}.\n` +
      `Total : ${b + d} + (−${a + c}) = ${b + d} − ${a + c} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// rel-mcq-temp : Temperature word problem MCQ
// ---------------------------------------------------------------------------
register('rel-mcq-temp', (item) => {
  const morning = randInt(-15, -1);
  const rise = randInt(5, 20);
  const afternoon = morning + rise;
  const drop = randInt(5, 15);
  const evening = afternoon - drop;
  const correct = evening;
  const wrongs = distractors(correct, 3);
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question:
      `Le matin, il fait ${morning}°C. La temperature monte de ${rise}°C dans l'apres-midi, ` +
      `puis baisse de ${drop}°C le soir. Quelle est la temperature le soir ?`,
    answer,
    choices,
    hint: 'Fais les operations etape par etape : matin + hausse − baisse.',
    explanation:
      `Matin : ${morning}°C.\n` +
      `Apres-midi : ${morning} + ${rise} = ${afternoon}°C.\n` +
      `Soir : ${afternoon} − ${drop} = ${evening}°C.`
  };
});

// ---------------------------------------------------------------------------
// rel-solve-mixed : a - (-b) + (-c) - (+d)
// ---------------------------------------------------------------------------
register('rel-solve-mixed', (item) => {
  const a = randInt(5, 15);
  const b = randInt(2, 10);
  const c = randInt(2, 10);
  const d = randInt(2, 10);
  const result = a - (-b) + (-c) - d; // = a + b - c - d
  return {
    question: `Calcule : ${a} − (−${b}) + (−${c}) − (+${d})`,
    answer: String(result),
    hint: 'Transforme d\'abord : soustraire un negatif = ajouter, ajouter un negatif = soustraire.',
    explanation:
      `Transformons : ${a} + ${b} − ${c} − ${d}.\n` +
      `= ${a + b} − ${c} − ${d}\n` +
      `= ${a + b - c} − ${d} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// rel-mcq-order : Order 5 numbers increasingly MCQ
// ---------------------------------------------------------------------------
register('rel-mcq-order', (item) => {
  // Generate 5 distinct integers including negatives
  const nums = new Set();
  while (nums.size < 5) {
    nums.add(randInt(-20, 20));
  }
  const arr = [...nums];
  const sorted = [...arr].sort((a, b) => a - b);
  const correctStr = sorted.join(' < ');

  // Generate wrong orderings
  const wrong1 = [...sorted].reverse().join(' < ');
  const wrong2Arr = [...sorted];
  // swap two adjacent
  const idx = randInt(0, 3);
  [wrong2Arr[idx], wrong2Arr[idx + 1]] = [wrong2Arr[idx + 1], wrong2Arr[idx]];
  const wrong2 = wrong2Arr.join(' < ');
  // swap first and last
  const wrong3Arr = [...sorted];
  [wrong3Arr[0], wrong3Arr[4]] = [wrong3Arr[4], wrong3Arr[0]];
  const wrong3 = wrong3Arr.join(' < ');

  const wrongs = [wrong1, wrong2, wrong3].filter(w => w !== correctStr);
  while (wrongs.length < 3) wrongs.push([...sorted].sort(() => Math.random() - 0.5).join(' < '));

  const { choices, answer } = mcqStrings(correctStr, wrongs.slice(0, 3));
  return {
    question: `Range dans l'ordre croissant : ${arr.join(' ; ')}`,
    answer,
    choices,
    hint: 'Les nombres negatifs sont toujours plus petits que les positifs.',
    explanation:
      `Sur la droite graduee, plus on va a gauche, plus le nombre est petit.\n` +
      `Ordre croissant : ${correctStr}.`
  };
});

// ---------------------------------------------------------------------------
// rel-solve-complex : (-a) + (-b) - (-c) - (+d) + (+e)   5 terms
// ---------------------------------------------------------------------------
register('rel-solve-complex', (item) => {
  const a = randInt(2, 10);
  const b = randInt(2, 10);
  const c = randInt(2, 10);
  const d = randInt(2, 10);
  const e = randInt(2, 10);
  const result = (-a) + (-b) - (-c) - d + e; // = -a - b + c - d + e
  return {
    question: `Calcule : (−${a}) + (−${b}) − (−${c}) − (+${d}) + (+${e})`,
    answer: String(result),
    hint: 'Simplifie d\'abord les signes, puis regroupe positifs et negatifs.',
    explanation:
      `Simplifions : −${a} − ${b} + ${c} − ${d} + ${e}.\n` +
      `Positifs : ${c} + ${e} = ${c + e}.\n` +
      `Negatifs : −${a} − ${b} − ${d} = −${a + b + d}.\n` +
      `Total : ${c + e} − ${a + b + d} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// rel-mul-basic : (-a) * (-b) basic multiplication
// ---------------------------------------------------------------------------
register('rel-mul-basic', (item) => {
  const a = randInt(2, 12);
  const b = randInt(2, 12);
  const sign = randChoice([1, -1]);
  const sign2 = randChoice([1, -1]);
  const result = (sign * a) * (sign2 * b);
  const formatNum = (s, n) => s < 0 ? `(−${n})` : `(+${n})`;
  return {
    question: `Calcule : ${formatNum(sign, a)} × ${formatNum(sign2, b)}`,
    answer: String(result),
    hint: 'Meme signe → positif, signes differents → negatif.',
    explanation:
      `Regle des signes : ${sign < 0 ? '−' : '+'} × ${sign2 < 0 ? '−' : '+'} = ${sign * sign2 > 0 ? '+' : '−'}.\n` +
      `Valeur : ${a} × ${b} = ${a * b}.\n` +
      `Resultat : ${result}.`
  };
});

// ---------------------------------------------------------------------------
// rel-mcq-sign : Product of 3-4 factors, determine sign MCQ
// ---------------------------------------------------------------------------
register('rel-mcq-sign', (item) => {
  const count = randInt(3, 4);
  const factors = [];
  let negCount = 0;
  for (let i = 0; i < count; i++) {
    const val = randInt(1, 9);
    const sign = randChoice([1, -1]);
    factors.push(sign * val);
    if (sign < 0) negCount++;
  }
  // ensure at least one negative
  if (negCount === 0) {
    factors[0] = -Math.abs(factors[0]);
    negCount = 1;
  }
  const product = factors.reduce((a, b) => a * b, 1);
  const isPositive = product > 0;
  const correctAnswer = isPositive ? 'Positif' : 'Negatif';
  const formatFactor = (n) => n < 0 ? `(−${Math.abs(n)})` : `(+${Math.abs(n)})`;
  const expr = factors.map(formatFactor).join(' × ');
  const { choices, answer } = mcqStrings(correctAnswer, [
    isPositive ? 'Negatif' : 'Positif',
    'Nul',
    'On ne peut pas savoir'
  ]);
  return {
    question: `Quel est le signe de ${expr} ?`,
    answer,
    choices,
    hint: `Compte le nombre de facteurs negatifs : pair → positif, impair → negatif.`,
    explanation:
      `Il y a ${negCount} facteur${negCount > 1 ? 's' : ''} negatif${negCount > 1 ? 's' : ''}.\n` +
      `${negCount} est ${negCount % 2 === 0 ? 'pair' : 'impair'}, donc le produit est ${correctAnswer.toLowerCase()}.\n` +
      `Valeur : ${Math.abs(product)}, resultat : ${product}.`
  };
});

// ---------------------------------------------------------------------------
// rel-solve-divmul : (-a) * b / (-c) mixed operations
// ---------------------------------------------------------------------------
register('rel-solve-divmul', (item) => {
  const a = randChoice([2, 3, 4, 5, 6]);
  const c = randChoice([2, 3, 4, 5, 6]);
  const multiplier = randInt(1, 4);
  const b = c * multiplier;  // ensures a*b divisible by c
  const numerator = a * b;
  const result = numerator / c;  // sign: (-) * (+) / (-) = (+)
  return {
    question: `Calcule : (−${a}) × ${b} ÷ (−${c})`,
    answer: String(result),
    hint: 'Compte les signes negatifs, puis calcule la valeur absolue.',
    explanation:
      `Signes : 2 negatifs (pair) → resultat positif.\n` +
      `Valeur : ${a} × ${b} ÷ ${c} = ${numerator} ÷ ${c} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// rel-mcq-power : (-a)^n power of negative MCQ
// ---------------------------------------------------------------------------
register('rel-mcq-power', (item) => {
  const a = randInt(2, 5);
  const n = randInt(2, 5);
  const result = Math.pow(-a, n);
  const correct = result;
  const wrongs = distractors(correct, 3);
  const { choices, answer } = mcq(correct, wrongs);
  const superscripts = { '2': '\u00B2', '3': '\u00B3', '4': '\u2074', '5': '\u2075' };
  const sup = superscripts[String(n)] || `^${n}`;
  return {
    question: `Calcule : (−${a})${sup}`,
    answer,
    choices,
    hint: `Exposant ${n % 2 === 0 ? 'pair' : 'impair'} → resultat ${n % 2 === 0 ? 'positif' : 'negatif'}.`,
    explanation:
      `(−${a})${sup} = ${n % 2 === 0 ? '+' : '−'}${Math.pow(a, n)}.\n` +
      `Exposant ${n} est ${n % 2 === 0 ? 'pair → positif' : 'impair → negatif'}.\n` +
      `Valeur absolue : ${a}${sup} = ${Math.pow(a, n)}.`
  };
});

// ---------------------------------------------------------------------------
// rel-solve-power-combo : (-1)^n * (-a)^2 * (-b)
// ---------------------------------------------------------------------------
register('rel-solve-power-combo', (item) => {
  const n = randInt(2, 8);
  const a = randInt(2, 5);
  const b = randInt(2, 5);
  const part1 = Math.pow(-1, n);    // +1 or -1
  const part2 = a * a;               // (-a)^2 is always positive
  const part3 = -b;
  const result = part1 * part2 * part3;
  const superscripts = { '2': '\u00B2', '3': '\u00B3', '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078' };
  const supN = superscripts[String(n)] || `^${n}`;
  return {
    question: `Calcule : (−1)${supN} × (−${a})² × (−${b})`,
    answer: String(result),
    hint: 'Calcule chaque facteur separement, puis multiplie.',
    explanation:
      `(−1)${supN} = ${part1} (exposant ${n} est ${n % 2 === 0 ? 'pair' : 'impair'}).\n` +
      `(−${a})² = ${part2} (carre toujours positif).\n` +
      `(−${b}) = −${b}.\n` +
      `Produit : ${part1} × ${part2} × (−${b}) = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// rel-solve-div-chain : a / (-b) / (-c)
// ---------------------------------------------------------------------------
register('rel-solve-div-chain', (item) => {
  const b = randInt(2, 6);
  const c = randInt(2, 6);
  const multiplier = randInt(1, 5);
  const a = b * c * multiplier; // ensure clean division
  const result = a / (-b) / (-c); // = a / (b*c) = multiplier (positive)
  return {
    question: `Calcule : ${a} ÷ (−${b}) ÷ (−${c})`,
    answer: String(result),
    hint: 'Applique la division de gauche a droite avec la regle des signes.',
    explanation:
      `Etape 1 : ${a} ÷ (−${b}) = −${a / b} (positif ÷ negatif = negatif).\n` +
      `Etape 2 : (−${a / b}) ÷ (−${c}) = ${result} (negatif ÷ negatif = positif).\n` +
      `Ou : 2 signes negatifs (pair) → resultat positif, ${a} ÷ ${b} ÷ ${c} = ${result}.`
  };
});
