import { $ } from '../../shared/helpers.js';
import * as DB from '../../shared/db.js';
import { BADGE_DEFS, getLevel } from '../../shared/gamification.js';
import { drawLineChart, drawDonutChart, drawBarChart, drawHeatmap } from '../../shared/mini-chart.js';

// Only show Dasha-relevant badges
const DASHA_BADGE_IDS = [
  'first_session', 'streak_3', 'streak_7', 'streak_30',
  'speed_demon', 'xp_1000', 'xp_5000', 'xp_10000',
  'perfect_10', 'night_owl', 'early_bird', 'weekend_warrior',
  'fr_level_1', 'fr_level_2', 'fr_level_3', 'fr_level_4',
  'cit_valeurs', 'cit_institutions', 'cit_droits', 'cit_histoire', 'cit_vivre',
  'cit_mock_pass', 'cit_mock_perfect',
];

async function init() {
  const renders = [
    renderSummary, renderXPChart, renderMasteryDonut,
    renderAccuracyChart, renderHeatmap, renderTimeChart, renderBadges,
  ];
  await Promise.all(renders.map(fn => fn().catch(e => console.error(`${fn.name}:`, e))));
}

async function renderSummary() {
  const [profile, sessionCount, allMastery] = await Promise.all([
    DB.getProfile().catch(() => null),
    DB.countSessions().catch(() => null),
    DB.getAllMastery().catch(() => null),
  ]);

  if (profile) {
    $('#sum-xp').textContent = (profile.xp || 0).toLocaleString('fr-FR');
    $('#sum-streak').textContent = profile.streak || 0;
  }
  if (sessionCount != null) $('#sum-sessions').textContent = sessionCount;
  if (allMastery) {
    $('#sum-mastered').textContent = allMastery.filter(m => m.status === 'mastered').length;
  }
}

async function renderXPChart() {
  const dailyData = await DB.getAllDailyActivity();
  const { labels, data } = getLast30Days(dailyData, 'xpEarned');

  drawLineChart($('#chart-xp'), {
    labels,
    datasets: [{ data, color: '#eab308' }],
  });
}

async function renderMasteryDonut() {
  const allMastery = await DB.getAllMastery();
  const newCount = allMastery.filter(m => m.status === 'new').length;
  const learningCount = allMastery.filter(m => m.status === 'learning').length;
  const masteredCount = allMastery.filter(m => m.status === 'mastered').length;
  const total = newCount + learningCount + masteredCount;

  drawDonutChart($('#chart-mastery'), {
    segments: [
      { value: masteredCount, color: '#00d68f' },
      { value: learningCount, color: '#8b5cf6' },
      { value: newCount, color: 'rgba(255,255,255,0.08)' },
    ],
    centerText: total > 0 ? masteredCount.toString() : '0',
    centerSub: 'maîtrisées',
  });

  const legend = $('#donut-legend');
  legend.innerHTML = `
    <div class="legend-item">
      <div class="legend-dot" style="background:#00d68f"></div>
      <span class="legend-label">Maîtrisées</span>
      <span class="legend-value">${masteredCount}</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background:#8b5cf6"></div>
      <span class="legend-label">En cours</span>
      <span class="legend-value">${learningCount}</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background:rgba(255,255,255,0.15)"></div>
      <span class="legend-label">Nouvelles</span>
      <span class="legend-value">${newCount}</span>
    </div>
  `;
}

async function renderAccuracyChart() {
  const dailyData = await DB.getAllDailyActivity();
  const days = [];
  const labels = [];

  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const day = dailyData.find(dd => dd.date === dateStr);
    const total = day?.totalAnswers || 0;
    const correct = day?.correctAnswers || 0;
    days.push(total > 0 ? Math.round((correct / total) * 100) : null);
    labels.push(d.getDate().toString());
  }

  const filledData = days.map(v => v ?? 0);

  drawLineChart($('#chart-accuracy'), {
    labels,
    datasets: [{ data: filledData, color: '#00d68f' }],
  });
}

async function renderHeatmap() {
  const dailyData = await DB.getAllDailyActivity();
  const heatmapData = {};

  for (const day of dailyData) {
    const sessions = day.sessionsPlayed || 0;
    let level = 0;
    if (sessions >= 5) level = 4;
    else if (sessions >= 3) level = 3;
    else if (sessions >= 2) level = 2;
    else if (sessions >= 1) level = 1;
    heatmapData[day.date] = level;
  }

  drawHeatmap($('#chart-heatmap'), {
    data: heatmapData,
    weeks: 4,
  });
}

async function renderTimeChart() {
  const dailyData = await DB.getAllDailyActivity();
  const data = [];
  const labels = [];

  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const day = dailyData.find(dd => dd.date === dateStr);
    data.push(day?.timeSpent || 0);
    labels.push(d.getDate().toString());
  }

  drawBarChart($('#chart-time'), {
    labels,
    data,
    color: '#8b5cf6',
  });
}

async function renderBadges() {
  const earned = await DB.getBadges();
  const earnedMap = {};
  for (const b of earned) {
    earnedMap[b.badgeId] = b;
  }

  const grid = $('#badge-grid');
  grid.innerHTML = '';

  const dashaBadges = BADGE_DEFS.filter(d => DASHA_BADGE_IDS.includes(d.id));

  for (const def of dashaBadges) {
    const isEarned = !!earnedMap[def.id];
    const badge = earnedMap[def.id];

    const item = document.createElement('div');
    item.className = `badge-item ${isEarned ? 'earned' : 'locked'}`;
    item.title = def.desc;

    let dateStr = '';
    if (isEarned && badge.date) {
      const parts = badge.date.split('-');
      dateStr = `${parts[2]}/${parts[1]}`;
    }

    item.innerHTML = `
      <span class="badge-emoji">${def.icon}</span>
      <span class="badge-name">${def.name}</span>
      ${isEarned ? `<span class="badge-date">${dateStr}</span>` : ''}
      <span class="badge-tooltip">${def.desc}</span>
    `;

    grid.appendChild(item);
  }
}

function getLast30Days(dailyData, field) {
  const data = [];
  const labels = [];

  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const day = dailyData.find(dd => dd.date === dateStr);
    data.push(day ? (day[field] || 0) : 0);
    labels.push(d.getDate().toString());
  }

  return { labels, data };
}

document.addEventListener('DOMContentLoaded', init);
