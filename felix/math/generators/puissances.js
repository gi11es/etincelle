/**
 * Puissances (4eme).
 */
import { randInt, randChoice, mcq, mcqStrings, distractors } from './helpers.js';
import { register } from './registry.js';

/** Superscript digits */
const SUP = { '0': '\u2070', '1': '\u00B9', '2': '\u00B2', '3': '\u00B3', '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079' };
function sup(n) {
  const s = String(n);
  if (n < 0) return '\u207B' + s.slice(1).split('').map(c => SUP[c] || c).join('');
  return s.split('').map(c => SUP[c] || c).join('');
}

// ---------------------------------------------------------------------------
// puis-solve-mul : a^m * a^n  -> a^(m+n)
// ---------------------------------------------------------------------------
register('puis-solve-mul', (item) => {
  const a = randInt(2, 5);
  const m = randInt(2, 4);
  const n = randInt(2, 4);
  const sum = m + n;
  const result = Math.pow(a, sum);
  return {
    question: `Calcule : ${a}${sup(m)} × ${a}${sup(n)}`,
    answer: String(result),
    hint: `Quand on multiplie des puissances de meme base, on additionne les exposants.`,
    explanation:
      `${a}${sup(m)} × ${a}${sup(n)} = ${a}${sup(sum)} (on additionne les exposants : ${m} + ${n} = ${sum}).\n` +
      `${a}${sup(sum)} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// puis-mcq-div : a^m / a^n  MCQ
// ---------------------------------------------------------------------------
register('puis-mcq-div', (item) => {
  const a = randInt(2, 5);
  const m = randInt(4, 7);
  const n = randInt(1, m - 1);
  const diff = m - n;
  const result = Math.pow(a, diff);
  const wrongs = distractors(result, 3, { positive: true });
  const { choices, answer } = mcq(result, wrongs);
  return {
    question: `Calcule : ${a}${sup(m)} ÷ ${a}${sup(n)}`,
    answer,
    choices,
    hint: `Quand on divise des puissances de meme base, on soustrait les exposants.`,
    explanation:
      `${a}${sup(m)} ÷ ${a}${sup(n)} = ${a}${sup(diff)} (exposants : ${m} − ${n} = ${diff}).\n` +
      `${a}${sup(diff)} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// puis-solve-notation-sci : Write number in scientific notation
// ---------------------------------------------------------------------------
register('puis-solve-notation-sci', (item) => {
  const mantissa = randInt(1, 9);
  const extra = randInt(1, 9);  // one decimal digit
  const exp = randInt(2, 8);
  // Build the number: mantissa.extra * 10^exp
  const value = (mantissa + extra / 10) * Math.pow(10, exp);
  const valueStr = value.toLocaleString('fr-FR', { useGrouping: false, maximumFractionDigits: 0 });
  const answer = `${mantissa},${extra} × 10${sup(exp)}`;
  return {
    question: `Ecris ${valueStr} en notation scientifique.`,
    answer,
    hint: 'La notation scientifique s\'ecrit a × 10^n avec 1 ≤ a < 10.',
    explanation:
      `On deplace la virgule pour obtenir un nombre entre 1 et 10 : ${mantissa},${extra}.\n` +
      `On a deplace la virgule de ${exp} positions vers la gauche.\n` +
      `Donc ${valueStr} = ${mantissa},${extra} × 10${sup(exp)}.`
  };
});

// ---------------------------------------------------------------------------
// puis-mcq-notation-sci : Which is the scientific notation of N? MCQ
// ---------------------------------------------------------------------------
register('puis-mcq-notation-sci', (item) => {
  const mantissa = randInt(1, 9);
  const extra = randInt(1, 9);
  const exp = randInt(3, 7);
  const value = (mantissa + extra / 10) * Math.pow(10, exp);
  const valueStr = value.toLocaleString('fr-FR', { useGrouping: false, maximumFractionDigits: 0 });

  const correct = `${mantissa},${extra} × 10${sup(exp)}`;
  const wrongs = [
    `${mantissa}${extra} × 10${sup(exp - 1)}`,     // forgot decimal
    `${mantissa},${extra} × 10${sup(exp + 1)}`,     // wrong exponent
    `${mantissa},${extra} × 10${sup(exp - 1)}`      // wrong exponent
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: `Quelle est la notation scientifique de ${valueStr} ?`,
    answer,
    choices,
    hint: 'Le coefficient doit etre compris entre 1 (inclus) et 10 (exclus).',
    explanation:
      `${valueStr} = ${mantissa},${extra} × 10${sup(exp)}.\n` +
      `Le coefficient ${mantissa},${extra} est bien entre 1 et 10.`
  };
});

// ---------------------------------------------------------------------------
// puis-solve-power-power : (a^m)^n  -> a^(m*n)
// ---------------------------------------------------------------------------
register('puis-solve-power-power', (item) => {
  const a = randInt(2, 4);
  const m = randInt(2, 3);
  const n = randInt(2, 3);
  const product = m * n;
  const result = Math.pow(a, product);
  return {
    question: `Calcule : (${a}${sup(m)})${sup(n)}`,
    answer: String(result),
    hint: 'Puissance de puissance : on multiplie les exposants.',
    explanation:
      `(${a}${sup(m)})${sup(n)} = ${a}${sup(product)} (exposants : ${m} × ${n} = ${product}).\n` +
      `${a}${sup(product)} = ${result}.`
  };
});

// ---------------------------------------------------------------------------
// puis-mcq-zero : a^0 MCQ
// ---------------------------------------------------------------------------
register('puis-mcq-zero', (item) => {
  const a = randInt(2, 100);
  const correct = 1;
  const wrongs = [0, a, -1];
  const { choices, answer } = mcq(correct, wrongs);
  return {
    question: `Que vaut ${a}${sup(0)} ?`,
    answer,
    choices,
    hint: 'Tout nombre non nul eleve a la puissance 0 vaut...',
    explanation:
      `Par definition, pour tout a ≠ 0 : a${sup(0)} = 1.\n` +
      `Donc ${a}${sup(0)} = 1.\n` +
      `Justification : a${sup(2)} ÷ a${sup(2)} = a${sup(0)} = 1.`
  };
});

// ---------------------------------------------------------------------------
// puis-solve-negative : a^(-n)  compute
// ---------------------------------------------------------------------------
register('puis-solve-negative', (item) => {
  const a = randInt(2, 5);
  const n = randInt(1, 3);
  const denom = Math.pow(a, n);
  const answer = `1/${denom}`;
  return {
    question: `Calcule : ${a}${sup(-n)}  (donne le resultat sous forme de fraction)`,
    answer,
    hint: 'Un exposant negatif signifie l\'inverse.',
    explanation:
      `${a}${sup(-n)} = 1/${a}${sup(n)} = 1/${denom}.\n` +
      `Un exposant negatif transforme la puissance en fraction : a⁻ⁿ = 1/aⁿ.`
  };
});

// ---------------------------------------------------------------------------
// puis-mcq-product : (a * b)^n MCQ
// ---------------------------------------------------------------------------
register('puis-mcq-product', (item) => {
  const a = randInt(2, 5);
  const b = randInt(2, 5);
  const n = randInt(2, 3);
  const correct = Math.pow(a * b, n);
  const wrongs = [
    Math.pow(a, n) + Math.pow(b, n),   // common mistake: distribute exponent over +
    a * b * n,                           // multiply by n instead
    Math.pow(a, n) * b                   // forgot to raise b
  ].filter(w => w !== correct);
  while (wrongs.length < 3) wrongs.push(correct + wrongs.length + 1);
  const { choices, answer } = mcq(correct, wrongs.slice(0, 3));
  return {
    question: `Calcule : (${a} × ${b})${sup(n)}`,
    answer,
    choices,
    hint: `(a × b)ⁿ = aⁿ × bⁿ`,
    explanation:
      `(${a} × ${b})${sup(n)} = ${a}${sup(n)} × ${b}${sup(n)} = ${Math.pow(a, n)} × ${Math.pow(b, n)} = ${correct}.\n` +
      `Ou directement : (${a * b})${sup(n)} = ${correct}.`
  };
});
