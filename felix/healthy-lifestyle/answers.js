export function normalize(value) {
  return value.normalize('NFC').toLowerCase().replace(/[’‘]/g, "'")
    .replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();
}
export function matches(value, answers, vocabulary = false) {
  const clean = text => vocabulary ? normalize(text).replace(/^(a |an |to )/, '') : normalize(text);
  return answers.some(answer => clean(value) === clean(answer));
}
