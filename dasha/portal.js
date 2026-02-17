import { $ } from '../shared/helpers.js';
import * as DB from '../shared/db.js';
import { getLevel, getLevelProgress, LEVEL_THRESHOLDS, BADGE_DEFS } from '../shared/gamification.js';
import Confetti from '../shared/confetti.js';

// Set active user
localStorage.setItem('family-active-user', 'dasha');

async function init() {
  Confetti.init();
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

  const frMastered = allMastery.filter(m => m.app === 'french' && m.status === 'mastered').length;
  const frLearning = allMastery.filter(m => m.app === 'french' && m.status === 'learning').length;

  const citMastered = allMastery.filter(m => m.app === 'citizenship' && m.status === 'mastered').length;
  const citSessions = sessions.filter(s => s.app === 'citizenship').length;

  const frSub = document.querySelector('.portal-card--french .portal-card-info p');
  if (frSub && (frMastered > 0 || frLearning > 0)) {
    frSub.textContent = `${frMastered} maîtrisés · ${frLearning} en cours`;
  }

  const citSub = document.querySelector('.portal-card--citizenship .portal-card-info p');
  if (citSub && (citMastered > 0 || citSessions > 0)) {
    citSub.textContent = `${citMastered} questions maîtrisées · ${citSessions} sessions`;
  }
}

async function renderBadges() {
  const earned = await DB.getBadges();
  const container = $('#portal-badges');
  // Filter to show only Dasha-relevant badges
  const dashaBadges = BADGE_DEFS.filter(b =>
    b.category === 'milestone' || b.category === 'streak' || b.category === 'xp' ||
    b.category === 'fun' || b.id.startsWith('fr_') || b.id.startsWith('cit_') ||
    b.id.startsWith('words_')
  );
  const total = dashaBadges.length;

  const earnedDasha = earned.filter(e => dashaBadges.some(d => d.id === e.badgeId));

  if (earnedDasha.length === 0) {
    container.innerHTML = `
      <h3>Badges · 0 / ${total}</h3>
      <p class="portal-badges-empty">Termine ta première session pour gagner un badge !</p>
    `;
    return;
  }

  const recentBadges = earnedDasha
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 8);

  let html = `<h3>Badges · ${earnedDasha.length} / ${total}</h3><div class="portal-badges-grid">`;
  for (const badge of recentBadges) {
    const def = BADGE_DEFS.find(b => b.id === badge.badgeId);
    if (def) {
      html += `
        <div class="portal-badge-item" title="${def.desc}">
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

document.addEventListener('DOMContentLoaded', init);

// Refresh profile when returning to this page (e.g. after a game session)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    renderProfile();
    renderAppStats();
    renderBadges();
  }
});
