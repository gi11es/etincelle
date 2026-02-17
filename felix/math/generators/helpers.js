/**
 * Shared utilities for math question generators.
 */

/** Random integer in [min, max] inclusive */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick a random element from an array */
export function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick n unique random elements from an array */
export function randSample(arr, n) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

/** Greatest common divisor */
export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

/** Least common multiple */
export function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

/** Simplify a fraction, returns [num, den] with den > 0 */
export function simplify(num, den) {
  if (den === 0) return [num, den];
  const sign = den < 0 ? -1 : 1;
  num *= sign; den *= sign;
  const g = gcd(Math.abs(num), den);
  return [num / g, den / g];
}

/** Format a fraction as string: "a/b" or "a" if den=1 */
export function frac(num, den) {
  const [n, d] = simplify(num, den);
  return d === 1 ? String(n) : `${n}/${d}`;
}

/** Shuffle array in place (Fisher-Yates) and return it */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Generate n distractors near the correct value, no duplicates */
export function distractors(correct, n, { spread = 4, positive = false } = {}) {
  const set = new Set([correct]);
  let attempts = 0;
  while (set.size < n + 1 && attempts < 100) {
    let d = correct + randInt(-spread, spread);
    if (d === correct) { attempts++; continue; }
    if (positive && d <= 0) { attempts++; continue; }
    set.add(d);
    attempts++;
  }
  // If we couldn't get enough, fill sequentially
  let fill = correct + spread + 1;
  while (set.size < n + 1) {
    if (!set.has(fill)) set.add(fill);
    fill++;
  }
  set.delete(correct);
  return [...set].slice(0, n);
}

/** Build MCQ choices: correct value + distractors, shuffled. Returns { choices, answer } */
export function mcq(correct, wrong) {
  const all = [correct, ...wrong];
  // Shuffle but track correct index
  const indices = all.map((_, i) => i);
  shuffle(indices);
  return {
    choices: indices.map(i => String(all[i])),
    answer: indices.indexOf(0)
  };
}

/** Build MCQ from a correct string and array of wrong strings */
export function mcqStrings(correct, wrongs) {
  const all = [correct, ...wrongs];
  const indices = all.map((_, i) => i);
  shuffle(indices);
  return {
    choices: indices.map(i => all[i]),
    answer: indices.indexOf(0)
  };
}

/** Common Pythagorean triples */
export const PYTH_TRIPLES = [
  [3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25],
  [6, 8, 10], [9, 12, 15], [12, 16, 20], [15, 20, 25],
];

/** Pick a Pythagorean triple, optionally scaled */
export function randPythTriple() {
  const [a, b, c] = randChoice(PYTH_TRIPLES);
  return { a, b, c };
}

/** Check if n is prime */
export function isPrime(n) {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

/** Prime factorization as [[prime, exp], ...] */
export function factorize(n) {
  const factors = [];
  let d = 2;
  while (d * d <= n) {
    let count = 0;
    while (n % d === 0) { n /= d; count++; }
    if (count > 0) factors.push([d, count]);
    d++;
  }
  if (n > 1) factors.push([n, 1]);
  return factors;
}

/** Format factorization as string: "2³×3×5" */
export function formatFactors(factors) {
  const superscripts = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return factors.map(([p, e]) => {
    if (e === 1) return String(p);
    const sup = String(e).split('').map(c => superscripts[c]).join('');
    return `${p}${sup}`;
  }).join('×');
}

/** Round to n decimal places */
export function round(val, n = 2) {
  const f = Math.pow(10, n);
  return Math.round(val * f) / f;
}

/** Generate a random non-zero integer in [-max, max] */
export function randNonZero(max) {
  let v;
  do { v = randInt(-max, max); } while (v === 0);
  return v;
}

/** Sign string: "+3" or "−3" or "" for 0 */
export function signedStr(n) {
  if (n > 0) return `+ ${n}`;
  if (n < 0) return `− ${Math.abs(n)}`;
  return '';
}

/** Format coefficient: "" for 1, "−" for -1, else the number */
export function coeff(n, showPlus = false) {
  if (n === 1) return showPlus ? '+ ' : '';
  if (n === -1) return '− ';
  if (n > 0 && showPlus) return `+ ${n}`;
  if (n < 0) return `− ${Math.abs(n)}`;
  return String(n);
}
