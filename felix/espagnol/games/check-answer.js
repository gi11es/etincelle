const FR_ARTICLES = ['le', 'la', 'les', "l'", 'un', 'une', 'des', 'du', 'de', 'au', 'aux'];
const ES_ARTICLES = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'del', 'al'];
const FR_MODIFIERS = ['tout', 'toute', 'tous', 'toutes', 'tres', 'bien', 'assez', 'plutot', 'vraiment', 'un peu', 'trop', "c'est", 'il y a', 'ne', 'pas'];
const ES_MODIFIERS = ['muy', 'mucho', 'mucha', 'bastante', 'poco', 'demasiado', 'hay', 'no'];

export function checkTranslation(userVal, answer) {
  if (!userVal) return false;

  const u = norm(userVal);
  const a = norm(answer);

  if (u === a) return true;

  const uNoArt = stripWords(u, [...FR_ARTICLES, ...ES_ARTICLES]);
  const aNoArt = stripWords(a, [...FR_ARTICLES, ...ES_ARTICLES]);
  if (uNoArt && uNoArt === aNoArt) return true;

  const uCore = stripWords(u, [...FR_ARTICLES, ...ES_ARTICLES, ...FR_MODIFIERS, ...ES_MODIFIERS]);
  const aCore = stripWords(a, [...FR_ARTICLES, ...ES_ARTICLES, ...FR_MODIFIERS, ...ES_MODIFIERS]);
  if (uCore && uCore === aCore) return true;

  const uWords = uCore.split(' ').filter(Boolean);
  const aWords = aCore.split(' ').filter(Boolean);
  if (uWords.length > 0 && aWords.length > 0) {
    const uInA = uWords.every(w => aWords.some(aw => aw === w || levenshtein(w, aw) <= 1));
    const aInU = aWords.every(w => uWords.some(uw => uw === w || levenshtein(w, uw) <= 1));
    if (uInA || aInU) return true;
  }

  const maxDist = Math.max(2, Math.floor(a.length * 0.25));
  if (u.length >= 3 && levenshtein(u, a) <= maxDist) return true;
  if (uNoArt.length >= 3 && levenshtein(uNoArt, aNoArt) <= maxDist) return true;

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
