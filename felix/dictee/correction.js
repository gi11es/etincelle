// Keep accents and case; accept typographic variants and ignore punctuation.
export function tokens(text) {
  return (text.normalize('NFC').replace(/œ/g, 'oe').replace(/Œ/g, 'Oe').replace(/[’‘]/g, "'")
    .match(/[\p{L}\p{M}]+(?:'[\p{L}\p{M}]+)*/gu) || []);
}

export function compare(expected, actual) {
  const a = tokens(expected), b = tokens(actual);
  const costs = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = 0; i <= a.length; i++) costs[i][0] = i;
  for (let j = 0; j <= b.length; j++) costs[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      costs[i][j] = Math.min(costs[i - 1][j] + 1, costs[i][j - 1] + 1,
        costs[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  const changes = [];
  let i = a.length, j = b.length;
  while (i || j) {
    if (i && j && costs[i][j] === costs[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      changes.push({ expected: a[--i], actual: b[--j], correct: a[i] === b[j] });
    } else if (i && costs[i][j] === costs[i - 1][j] + 1) {
      changes.push({ expected: a[--i], actual: '', correct: false });
    } else {
      changes.push({ expected: '', actual: b[--j], correct: false });
    }
  }
  const mistakes = costs[a.length][b.length];
  return { changes: changes.reverse(), total: a.length, mistakes,
    correct: Math.max(0, a.length - mistakes), percent: Math.round(100 * Math.max(0, a.length - mistakes) / Math.max(1, a.length)) };
}
