import { $ } from '../shared/helpers.js';
import * as DB from '../shared/db.js';
import { getLevel, getLevelProgress, LEVEL_THRESHOLDS, BADGE_DEFS } from '../shared/gamification.js';
import Confetti from '../shared/confetti.js';

// Set active user
localStorage.setItem('family-active-user', 'felix');

async function init() {
  Confetti.init();
  await DB.migrateLocalStorage();
  await renderProfile();
  await renderAppStats();
  await renderBadges();
}

async function renderProfile() {
  const profile = await DB.getProfile();
  const xp = profile.xp || 0;
  const level = getLevel(xp);
  const progress = getLevelProgress(xp);

  $('#xp-level').textContent = `Niveau ${level}`;
  $('#xp-bar-fill').style.width = `${Math.round(progress * 100)}%`;

  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  if (level < LEVEL_THRESHOLDS.length) {
    $('#xp-amount').textContent = `${xp} / ${nextThreshold} XP`;
  } else {
    $('#xp-amount').textContent = `${xp} XP (Max !)`;
  }

  const streakBadge = $('#streak-badge');
  if (profile.streak && profile.streak > 0) {
    streakBadge.classList.remove('hidden');
    $('#streak-count').textContent = profile.streak;
  } else {
    streakBadge.classList.add('hidden');
  }
}

async function renderAppStats() {
  const allMastery = await DB.getAllMastery();
  const sessions = await DB.getSessions();

  const enMastered = allMastery.filter(m => m.app === 'english' && m.status === 'mastered').length;
  const enLearning = allMastery.filter(m => m.app === 'english' && m.status === 'learning').length;
  const enTotal = enMastered + enLearning;

  const mathMastered = allMastery.filter(m => m.app === 'math' && m.status === 'mastered').length;
  const mathSessions = sessions.filter(s => s.app === 'math').length;

  const quizSessions = sessions.filter(s => s.app === 'quiz-livre').length;

  const enSub = document.querySelector('.portal-card--english .portal-card-info p');
  if (enSub && enTotal > 0) {
    enSub.textContent = `${enMastered} mots maîtrisés · ${enLearning} en cours`;
  }

  const mathSub = document.querySelector('.portal-card--math .portal-card-info p');
  if (mathSub && (mathMastered > 0 || mathSessions > 0)) {
    mathSub.textContent = `${mathMastered} exercices maîtrisés · ${mathSessions} sessions`;
  }

  const quizSub = document.querySelector('.portal-card--quiz .portal-card-info p');
  if (quizSub && quizSessions > 0) {
    quizSub.textContent = `${quizSessions} quiz terminés`;
  }
}

async function renderBadges() {
  const earned = await DB.getBadges();
  const container = $('#portal-badges');
  const total = BADGE_DEFS.length;

  if (earned.length === 0) {
    container.innerHTML = `
      <h3>Badges · 0 / ${total}</h3>
      <p class="portal-badges-empty">Termine ta première session pour gagner un badge !</p>
    `;
    return;
  }

  const recentBadges = earned
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 8);

  let html = `<h3>Badges · ${earned.length} / ${total}</h3><div class="portal-badges-grid">`;
  for (const badge of recentBadges) {
    const def = BADGE_DEFS.find(b => b.id === badge.badgeId);
    if (def) {
      const dateStr = badge.date || '';
      const formattedDate = dateStr ? formatDate(dateStr) : '';
      html += `
        <div class="portal-badge-item" title="${def.desc}${formattedDate ? ' — ' + formattedDate : ''}">
          <span class="badge-emoji">${def.icon}</span>
          <div class="badge-text">
            <span class="badge-name">${def.name}</span>
            <span class="badge-desc">${def.desc}</span>
          </div>
        </div>
      `;
    }
  }
  html += '</div>';
  container.innerHTML = html;
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

document.addEventListener('DOMContentLoaded', init);

// Refresh profile when returning to this page (e.g. after a game session)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    renderProfile();
    renderAppStats();
    renderBadges();
  }
});
