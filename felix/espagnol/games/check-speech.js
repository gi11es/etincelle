const FILLER_WORDS = ['uh', 'um', 'oh', 'bueno', 'pues', 'vale', 'entonces', 'como', 'digo'];
const ARTICLES = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'];

export function checkSpeech(transcription, expected) {
  if (!transcription || !expected) return false;

  const said = norm(transcription);
  const target = norm(expected);

  if (!said) return false;

  if (said === target) return true;

  if (said.includes(target) || target.includes(said)) return true;

  const saidClean = stripWords(said);
  const targetClean = stripWords(target);
  if (saidClean && targetClean) {
    if (saidClean === targetClean) return true;
    if (saidClean.includes(targetClean) || targetClean.includes(saidClean)) return true;
  }

  const alts = expected.split(/[/,;]/).map(s => norm(s.trim()));
  for (const alt of alts) {
    if (!alt) continue;
    if (said === alt || said.includes(alt) || alt.includes(said)) return true;
    const altClean = stripWords(alt);
    if (altClean && (saidClean === altClean || saidClean.includes(altClean) || altClean.includes(saidClean))) return true;
  }

  const saidWords = (saidClean || said).split(' ').filter(Boolean);
  const targetWords = (targetClean || target).split(' ').filter(Boolean);
  if (targetWords.length > 1) {
    const matches = targetWords.filter(tw =>
      saidWords.some(sw => sw === tw || levenshtein(sw, tw) <= 1)
    );
    if (matches.length / targetWords.length >= 0.6) return true;
  }

  const s = saidClean || said;
  const t = targetClean || target;
  const maxDist = Math.max(2, Math.floor(t.length * 0.4));
  if (s.length >= 2 && levenshtein(s, t) <= maxDist) return true;

  if (t.length <= 5 && s.length >= 2 && s.slice(0, 2) === t.slice(0, 2)) return true;

  return false;
}

function norm(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripWords(s) {
  const words = s.split(' ');
  const filtered = words.filter(w => !FILLER_WORDS.includes(w) && !ARTICLES.includes(w));
  return filtered.join(' ').trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
