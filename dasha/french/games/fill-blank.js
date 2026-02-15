import SFX from '../../../shared/sfx.js';
import LottieOverlay from '../../../shared/lottie-overlay.js';
import { shuffle, escapeAttr } from '../../../shared/helpers.js';

export function renderFillBlank({ item, container, allItems, onAnswer, speak }) {
  let answered = false;

  // Build sentence with blank — try multiple strategies to find the word
  const gapHtml = '<span class="fill-blank-gap" id="fb-gap">______</span>';
  const result = blankOutWord(item.example_fr, item.fr, gapHtml);

  // If we couldn't blank out the word, signal the caller to pick another game type
  if (!result) { onAnswer(null); return; }

  const { sentence: displaySentence, displayAnswer } = result;

  // Generate wrong choices — strip articles to match the display form
  const wrongItems = shuffle(allItems.filter(i => i.id !== item.id && i.category === item.category))
    .slice(0, 3)
    .map(i => stripArticle(i.fr));

  // If not enough from same category, pick from others
  while (wrongItems.length < 3) {
    const extra = shuffle(allItems.filter(i => i.id !== item.id && !wrongItems.map(w => w.toLowerCase()).includes(stripArticle(i.fr).toLowerCase())));
    if (extra.length === 0) break;
    wrongItems.push(stripArticle(extra[0].fr));
  }

  // Deduplicate (stripping articles may create duplicates)
  const uniqueWrong = [...new Set(wrongItems.slice(0, 3).map(w => w.toLowerCase()))]
    .map(lw => wrongItems.find(w => w.toLowerCase() === lw))
    .filter(w => w.toLowerCase() !== displayAnswer.toLowerCase())
    .slice(0, 3);

  const choices = shuffle([displayAnswer, ...uniqueWrong]);

  container.innerHTML = `
    <div class="question-text">Complète la phrase :</div>
    <div class="fill-blank-sentence">${displaySentence}</div>
    <p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:12px;font-style:italic">${item.example_en || item.en}</p>
    <div class="fill-choices">
      ${choices.map(c => `<button class="fill-choice" data-val="${escapeAttr(c)}">${c}</button>`).join('')}
    </div>
    <div id="fb-feedback"></div>
  `;

  container.querySelectorAll('.fill-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      SFX.play('tap');

      const chosen = btn.dataset.val;
      const correct = chosen.toLowerCase() === displayAnswer.toLowerCase();

      container.querySelectorAll('.fill-choice').forEach(b => {
        b.classList.add('disabled');
        if (b.dataset.val.toLowerCase() === displayAnswer.toLowerCase()) b.classList.add('correct');
      });

      const gap = container.querySelector('#fb-gap');

      if (correct) {
        btn.classList.add('correct');
        gap.textContent = displayAnswer;
        gap.style.color = 'var(--success)';
        gap.style.borderColor = 'var(--success)';
        SFX.play('correct');
        LottieOverlay.show('correct', 800);
      } else {
        btn.classList.add('wrong');
        gap.textContent = displayAnswer;
        gap.style.color = 'var(--danger)';
        gap.style.borderColor = 'var(--danger)';
        SFX.play('wrong');
      }

      setTimeout(() => speak(item.example_fr, 'fr-FR'), 400);

      onAnswer(correct);
    });
  });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ARTICLES = /^(un|une|le|la|les|l'|du|de la|des|d')\s*/i;

function stripArticle(word) {
  return word.replace(ARTICLES, '');
}

function blankOutWord(sentence, word, gap) {
  // 1) Try exact match first
  const exact = new RegExp(escapeRegex(word), 'i');
  if (exact.test(sentence)) {
    return { sentence: sentence.replace(exact, gap), displayAnswer: word };
  }

  // 2) Strip article from word and try the core word (e.g. "un constat" → "constat")
  const core = stripArticle(word);
  if (core !== word && core.length > 0) {
    const coreRe = new RegExp('\\b' + escapeRegex(core) + '\\b', 'i');
    if (coreRe.test(sentence)) {
      return { sentence: sentence.replace(coreRe, gap), displayAnswer: core };
    }
    // Also try without word boundary (for words with apostrophe like "l'embauche")
    const corePlain = new RegExp(escapeRegex(core), 'i');
    if (corePlain.test(sentence)) {
      return { sentence: sentence.replace(corePlain, gap), displayAnswer: core };
    }
  }

  // 3) For verb phrases like "mettre en oeuvre" → "mis en oeuvre" try matching last 2+ words
  const words = (core || word).split(/\s+/);
  if (words.length >= 2) {
    const tail = words.slice(-2).join('\\s+');
    const tailRe = new RegExp(escapeRegex(tail), 'i');
    if (tailRe.test(sentence)) {
      return { sentence: sentence.replace(tailRe, gap), displayAnswer: words.slice(-2).join(' ') };
    }
  }

  // 4) Couldn't find the word — return null so caller picks another game type
  return null;
}
