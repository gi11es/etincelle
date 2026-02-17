/**
 * Statistiques (2nde).
 */
import { randInt, randChoice, mcq, mcqStrings, distractors, round } from './helpers.js';
import { register } from './registry.js';

// ---------------------------------------------------------------------------
// stat-mcq-dispersion : quelle mesure utilise TOUTES les valeurs ?
// ---------------------------------------------------------------------------
register('stat-mcq-dispersion', (item) => {
  const correct = 'L\'écart type';
  const wrongs = ['La médiane', 'L\'étendue', 'Le premier quartile'];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Quelle mesure de dispersion utilise toutes les valeurs de la série ?',
    answer,
    choices,
    hint: 'La médiane et les quartiles ne dépendent que de la position, pas de toutes les valeurs.',
    explanation:
      'L\'écart type utilise toutes les valeurs de la série (via la variance).\n' +
      'La médiane et les quartiles ne dépendent que du rang des valeurs.\n' +
      'L\'étendue n\'utilise que la plus grande et la plus petite valeur.'
  };
});

// ---------------------------------------------------------------------------
// stat-solve-moyenne : calculer la moyenne de 5 valeurs
// ---------------------------------------------------------------------------
register('stat-solve-moyenne', (item) => {
  // Générer 5 valeurs dont la somme est divisible par 5
  const base = [randInt(5, 15), randInt(5, 15), randInt(5, 15), randInt(5, 15)];
  const partialSum = base.reduce((s, v) => s + v, 0);
  // Ajuster la 5e valeur pour que la somme soit multiple de 5
  const remainder = partialSum % 5;
  const last = randInt(5, 15);
  const adjusted = last + (5 - (partialSum + last) % 5) % 5;
  const vals = [...base, adjusted];
  const sum = vals.reduce((s, v) => s + v, 0);
  const mean = sum / 5;
  return {
    question: `Calculer la moyenne de la série : ${vals.join(' ; ')}.`,
    answer: String(mean),
    hint: 'Moyenne = somme des valeurs / nombre de valeurs.',
    explanation:
      `Somme = ${vals.join(' + ')} = ${sum}.\n` +
      `Moyenne = ${sum} / 5 = ${mean}.`
  };
});

// ---------------------------------------------------------------------------
// stat-mcq-boite : que représente la boîte dans un diagramme en boîte ?
// ---------------------------------------------------------------------------
register('stat-mcq-boite', (item) => {
  const correct = 'Les 50 % centraux des données (de Q₁ à Q₃)';
  const wrongs = [
    'Les 25 % les plus fréquents',
    'L\'intervalle entre le minimum et le maximum',
    'Les valeurs supérieures à la médiane'
  ];
  const { choices, answer } = mcqStrings(correct, wrongs);
  return {
    question: 'Que représente la boîte dans un diagramme en boîte (box plot) ?',
    answer,
    choices,
    hint: 'Les bords de la boîte sont Q₁ et Q₃.',
    explanation:
      'La boîte s\'étend du premier quartile Q₁ au troisième quartile Q₃.\n' +
      'Elle contient donc 50 % des données (l\'intervalle interquartile).\n' +
      'Le trait à l\'intérieur représente la médiane.'
  };
});

// ---------------------------------------------------------------------------
// stat-solve-ecart-type : variance = N, trouver l'écart type
// ---------------------------------------------------------------------------
register('stat-solve-ecart-type', (item) => {
  const perfect = randChoice([4, 9, 16, 25, 36, 49, 64]);
  const sigma = Math.sqrt(perfect);
  return {
    question: `La variance d'une série statistique vaut ${perfect}. Quel est son écart type ?`,
    answer: String(sigma),
    hint: 'L\'écart type est la racine carrée de la variance.',
    explanation:
      `σ = √V = √${perfect} = ${sigma}.\n` +
      `L'écart type est la racine carrée de la variance.`
  };
});
