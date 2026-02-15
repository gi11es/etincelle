/**
 * Shared lenient answer-checking for French ↔ English translations.
 * Accepts: exact, stripped articles/modifiers, core-word subset, typos.
 */

const FR_ARTICLES = ['le', 'la', 'les', "l'", 'un', 'une', 'des', 'du', 'de', 'au', 'aux'];
const EN_ARTICLES = ['the', 'a', 'an', 'to', 'some'];
const FR_MODIFIERS = ['tout', 'toute', 'tous', 'toutes', 'tres', 'bien', 'assez', 'plutot', 'vraiment', 'un peu', 'trop', "c'est", 'il y a', 'ne', 'pas'];
const EN_MODIFIERS = ['very', 'really', 'quite', 'rather', 'so', 'too', 'pretty', 'just'];

export function checkTranslation(userVal, answer) {
  if (!userVal) return false;

  const u = norm(userVal);
  const a = norm(answer);

  // 1. Exact match
  if (u === a) return true;

  // 2. Match after stripping articles
  const uNoArt = stripWords(u, [...FR_ARTICLES, ...EN_ARTICLES]);
  const aNoArt = stripWords(a, [...FR_ARTICLES, ...EN_ARTICLES]);
  if (uNoArt && uNoArt === aNoArt) return true;

  // 3. Match after stripping articles + modifiers
  const uCore = stripWords(u, [...FR_ARTICLES, ...EN_ARTICLES, ...FR_MODIFIERS, ...EN_MODIFIERS]);
  const aCore = stripWords(a, [...FR_ARTICLES, ...EN_ARTICLES, ...FR_MODIFIERS, ...EN_MODIFIERS]);
  if (uCore && uCore === aCore) return true;

  // 4. Core-word subset: user's core words ⊆ answer's core words (or vice versa)
  const uWords = uCore.split(' ').filter(Boolean);
  const aWords = aCore.split(' ').filter(Boolean);
  if (uWords.length > 0 && aWords.length > 0) {
    const uInA = uWords.every(w => aWords.some(aw => aw === w || levenshtein(w, aw) <= 1));
    const aInU = aWords.every(w => uWords.some(uw => uw === w || levenshtein(w, uw) <= 1));
    if (uInA || aInU) return true;
  }

  // 5. Levenshtein tolerance for typos (scaled to answer length)
  const maxDist = Math.max(2, Math.floor(a.length * 0.25));
  if (u.length >= 3 && levenshtein(u, a) <= maxDist) return true;
  if (uNoArt.length >= 3 && levenshtein(uNoArt, aNoArt) <= maxDist) return true;

  // 6. Handle slash/comma-separated alternatives in answer (e.g., "chaud/chaude")
  const alts = answer.split(/[\/,;]/).map(s => norm(s.trim()));
  for (const alt of alts) {
    if (alt && (u === alt || uNoArt === stripWords(alt, FR_ARTICLES))) return true;
    if (alt && u.length >= 3 && levenshtein(u, alt) <= maxDist) return true;
  }

  return false;
}

function norm(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[''ʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function stripWords(s, wordList) {
  const words = s.split(' ');
  const filtered = words.filter(w => !wordList.includes(w));
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
