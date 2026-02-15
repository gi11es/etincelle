import * as DB from './db.js';
import SFX from './sfx.js';
import { todayStr } from './helpers.js';

// ===== XP Thresholds per level =====
export const LEVEL_THRESHOLDS = [
  0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200,
  6600, 8200, 10000, 12000, 14500, 17500, 21000, 25000, 30000, 36000
];

export function getLevel(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getLevelProgress(xp) {
  const level = getLevel(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  if (level >= LEVEL_THRESHOLDS.length) return 1;
  return (xp - currentThreshold) / (nextThreshold - currentThreshold);
}

// ===== XP Calculation =====
export function calcXP({ correct, timeSec, streak, totalCorrect, totalQuestions }) {
  let xp = 0;
  if (correct) {
    xp += 10;
    if (timeSec < 5) xp += 5;
    if (streak >= 10) xp += 20;
    else if (streak >= 5) xp += 10;
    else if (streak >= 3) xp += 5;
  }
  return xp;
}

export function calcSessionBonusXP({ correctCount, totalCount }) {
  let bonus = 0;
  if (correctCount === totalCount && totalCount >= 5) bonus += 50;
  return bonus;
}

// ===== Streak Management =====
export async function updateStreak() {
  const profile = await DB.getProfile();
  const today = todayStr();

  if (profile.lastActiveDate === today) {
    return profile;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (profile.lastActiveDate === yesterdayStr) {
    profile.streak = (profile.streak || 0) + 1;
  } else if (profile.lastActiveDate !== today) {
    profile.streak = 1;
  }

  profile.lastActiveDate = today;
  await DB.saveProfile(profile);
  return profile;
}

export function streakBonusXP(streak) {
  return Math.min(streak * 10, 100);
}

// ===== Add XP =====
export async function addXP(amount) {
  const profile = await DB.getProfile();
  const oldLevel = getLevel(profile.xp);
  profile.xp = (profile.xp || 0) + amount;
  const newLevel = getLevel(profile.xp);
  await DB.saveProfile(profile);

  if (newLevel > oldLevel) {
    showLevelUp(newLevel);
  }

  return { profile, leveledUp: newLevel > oldLevel, newLevel };
}

// ===== Show XP Toast =====
export function showXPToast(amount) {
  if (amount <= 0) return;
  const toast = document.createElement('div');
  toast.className = 'xp-toast';
  toast.textContent = `+${amount} XP`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

// ===== Level Up Celebration =====
function showLevelUp(level) {
  SFX.play('levelUp');
  const overlay = document.createElement('div');
  overlay.className = 'levelup-overlay';
  overlay.innerHTML = `
    <div class="levelup-card">
      <div class="level-num">${level}</div>
      <h2>Niveau ${level} !</h2>
      <p>Continue comme ça, tu progresses super bien !</p>
      <button class="btn btn-primary" style="margin:0 auto;">Super !</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.btn').addEventListener('click', () => overlay.remove());
  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 5000);
}

// ===== Badge Definitions =====
export const BADGE_DEFS = [
  // Milestones
  { id: 'first_session', icon: '🎯', name: 'Premier pas', desc: 'Termine ta première session', category: 'milestone' },
  { id: 'sessions_10', icon: '🔟', name: 'Habitué', desc: '10 sessions terminées', category: 'milestone' },
  { id: 'sessions_50', icon: '🏅', name: 'Assidu', desc: '50 sessions terminées', category: 'milestone' },
  { id: 'sessions_100', icon: '💯', name: 'Centurion', desc: '100 sessions terminées', category: 'milestone' },
  // Streaks
  { id: 'streak_3', icon: '🔥', name: 'En feu', desc: '3 jours de suite', category: 'streak' },
  { id: 'streak_7', icon: '⚡', name: 'Semaine parfaite', desc: '7 jours de suite', category: 'streak' },
  { id: 'streak_14', icon: '💪', name: 'Deux semaines', desc: '14 jours de suite', category: 'streak' },
  { id: 'streak_30', icon: '👑', name: 'Mois complet', desc: '30 jours de suite', category: 'streak' },
  // Vocabulary mastery
  { id: 'words_10', icon: '📝', name: 'Premiers mots', desc: '10 mots maîtrisés', category: 'vocab' },
  { id: 'words_25', icon: '📖', name: 'Apprenti', desc: '25 mots maîtrisés', category: 'vocab' },
  { id: 'words_50', icon: '📚', name: 'Lecteur', desc: '50 mots maîtrisés', category: 'vocab' },
  { id: 'words_100', icon: '🎓', name: 'Érudit', desc: '100 mots maîtrisés', category: 'vocab' },
  { id: 'words_200', icon: '🧠', name: 'Polyglotte', desc: '200 mots maîtrisés', category: 'vocab' },
  // English levels
  { id: 'en_level_1', icon: '🇬🇧', name: 'Level 1 Complete', desc: 'Maîtrise le niveau 1 anglais', category: 'level' },
  { id: 'en_level_2', icon: '🇬🇧', name: 'Level 2 Complete', desc: 'Maîtrise le niveau 2 anglais', category: 'level' },
  { id: 'en_level_3', icon: '🇬🇧', name: 'Level 3 Complete', desc: 'Maîtrise le niveau 3 anglais', category: 'level' },
  { id: 'en_level_4', icon: '🇬🇧', name: 'Level 4 Complete', desc: 'Maîtrise le niveau 4 anglais', category: 'level' },
  { id: 'en_level_5', icon: '🇬🇧', name: 'Level 5 Complete', desc: 'Maîtrise le niveau 5 anglais', category: 'level' },
  // Math levels
  { id: 'math_5eme', icon: '🔢', name: 'Matheux 5e', desc: 'Maîtrise les maths 5ème', category: 'level' },
  { id: 'math_4eme', icon: '📐', name: 'Matheux 4e', desc: 'Maîtrise les maths 4ème', category: 'level' },
  { id: 'math_3eme', icon: '🧮', name: 'Matheux 3e', desc: 'Maîtrise les maths 3ème', category: 'level' },
  // Dasha: French levels
  { id: 'fr_level_1', icon: '🇫🇷', name: 'Vocabulaire courant', desc: 'Maîtrise le vocabulaire courant avancé', category: 'level' },
  { id: 'fr_level_2', icon: '🇫🇷', name: 'Expressions', desc: 'Maîtrise les expressions idiomatiques', category: 'level' },
  { id: 'fr_level_3', icon: '🇫🇷', name: 'Registres', desc: 'Maîtrise les registres de langue', category: 'level' },
  { id: 'fr_level_4', icon: '🇫🇷', name: 'Nuances', desc: 'Maîtrise les nuances et faux amis', category: 'level' },
  // Dasha: Citizenship
  { id: 'cit_valeurs', icon: '🏛️', name: 'Valeurs', desc: 'Maîtrise les valeurs de la République', category: 'level' },
  { id: 'cit_institutions', icon: '⚖️', name: 'Institutions', desc: 'Maîtrise les institutions françaises', category: 'level' },
  { id: 'cit_droits', icon: '📜', name: 'Droits & Devoirs', desc: 'Maîtrise les droits et devoirs', category: 'level' },
  { id: 'cit_histoire', icon: '📅', name: 'Histoire-Géo', desc: 'Maîtrise l\'histoire et la géographie', category: 'level' },
  { id: 'cit_vivre', icon: '🗼', name: 'Vivre en France', desc: 'Maîtrise la vie en France', category: 'level' },
  { id: 'cit_mock_pass', icon: '🎓', name: 'Citoyenne !', desc: 'Réussis un examen blanc (32/40)', category: 'citizenship' },
  { id: 'cit_mock_perfect', icon: '🏆', name: 'Score parfait', desc: 'Obtiens 40/40 à l\'examen blanc', category: 'citizenship' },
  // XP milestones
  { id: 'xp_500', icon: '⭐', name: '500 XP', desc: 'Atteins 500 XP', category: 'xp' },
  { id: 'xp_2000', icon: '🌟', name: '2 000 XP', desc: 'Atteins 2 000 XP', category: 'xp' },
  { id: 'xp_5000', icon: '✨', name: '5 000 XP', desc: 'Atteins 5 000 XP', category: 'xp' },
  { id: 'xp_10000', icon: '💎', name: '10 000 XP', desc: 'Atteins 10 000 XP', category: 'xp' },
  // Fun
  { id: 'night_owl', icon: '🦉', name: 'Oiseau de nuit', desc: 'Joue après 22h', category: 'fun' },
  { id: 'early_bird', icon: '🐦', name: 'Lève-tôt', desc: 'Joue avant 8h', category: 'fun' },
  { id: 'speed_demon', icon: '⚡', name: 'Éclair', desc: 'Réponds correctement en moins de 2s', category: 'fun' },
  { id: 'perfect_quiz', icon: '🏆', name: 'Sans faute', desc: 'Quiz parfait (10/10)', category: 'fun' },
];

// ===== Check & Award Badges =====
export async function checkBadges() {
  const profile = await DB.getProfile();
  const sessionCount = await DB.countSessions();
  const allMastery = await DB.getAllMastery();
  const masteredCount = allMastery.filter(m => m.status === 'mastered').length;
  const hour = new Date().getHours();
  const newBadges = [];

  const checks = [
    { id: 'first_session', cond: sessionCount >= 1 },
    { id: 'sessions_10', cond: sessionCount >= 10 },
    { id: 'sessions_50', cond: sessionCount >= 50 },
    { id: 'sessions_100', cond: sessionCount >= 100 },
    { id: 'streak_3', cond: profile.streak >= 3 },
    { id: 'streak_7', cond: profile.streak >= 7 },
    { id: 'streak_14', cond: profile.streak >= 14 },
    { id: 'streak_30', cond: profile.streak >= 30 },
    { id: 'words_10', cond: masteredCount >= 10 },
    { id: 'words_25', cond: masteredCount >= 25 },
    { id: 'words_50', cond: masteredCount >= 50 },
    { id: 'words_100', cond: masteredCount >= 100 },
    { id: 'words_200', cond: masteredCount >= 200 },
    { id: 'xp_500', cond: profile.xp >= 500 },
    { id: 'xp_2000', cond: profile.xp >= 2000 },
    { id: 'xp_5000', cond: profile.xp >= 5000 },
    { id: 'xp_10000', cond: profile.xp >= 10000 },
    { id: 'night_owl', cond: hour >= 22 || hour < 4 },
    { id: 'early_bird', cond: hour >= 5 && hour < 8 },
  ];

  for (const check of checks) {
    if (check.cond) {
      const awarded = await DB.awardBadge({
        badgeId: check.id,
        date: todayStr(),
        timestamp: Date.now()
      });
      if (awarded) {
        const def = BADGE_DEFS.find(b => b.id === check.id);
        if (def) newBadges.push(def);
      }
    }
  }

  return newBadges;
}

// ===== Check Level Completion Badges =====
export async function checkLevelBadges(app, levelKey, items) {
  if (!items || items.length === 0) return;
  const allMastery = await DB.getAllMastery(app);
  const levelMastered = allMastery.filter(
    m => m.status === 'mastered' && items.some(i => i.id === m.itemId)
  ).length;

  if (levelMastered < Math.ceil(items.length * 0.8)) return;

  const badgeMap = {
    english: { 1: 'en_level_1', 2: 'en_level_2', 3: 'en_level_3', 4: 'en_level_4', 5: 'en_level_5' },
    math: { '5eme': 'math_5eme', '4eme': 'math_4eme', '3eme': 'math_3eme' },
    french: { 1: 'fr_level_1', 2: 'fr_level_2', 3: 'fr_level_3', 4: 'fr_level_4' },
    citizenship: {
      'valeurs-principes': 'cit_valeurs',
      'institutions': 'cit_institutions',
      'droits-devoirs': 'cit_droits',
      'histoire-geo': 'cit_histoire',
      'vivre-en-france': 'cit_vivre'
    }
  };

  const badgeId = badgeMap[app]?.[levelKey];
  if (badgeId) await checkSpecialBadge(badgeId);
}

export async function checkSpecialBadge(badgeId) {
  const awarded = await DB.awardBadge({
    badgeId,
    date: todayStr(),
    timestamp: Date.now()
  });
  if (awarded) {
    const def = BADGE_DEFS.find(b => b.id === badgeId);
    if (def) showBadgeToast(def);
    return true;
  }
  return false;
}

export function showBadgeToast(badge) {
  SFX.play('badgeEarned');
  const toast = document.createElement('div');
  toast.className = 'badge-toast';
  toast.innerHTML = `
    <div class="badge-icon">${badge.icon}</div>
    <div class="badge-info">
      <h4>${badge.name}</h4>
      <p>${badge.desc}</p>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

export async function celebrateNewBadges(badges) {
  for (let i = 0; i < badges.length; i++) {
    setTimeout(() => showBadgeToast(badges[i]), i * 1500);
  }
}

// ===== End-of-session flow =====
export async function endSessionFlow({ app, correct, total, timeSec }) {
  const today = todayStr();

  const profile = await updateStreak();

  let sessionXP = 0;
  sessionXP += correct * 10;
  sessionXP += calcSessionBonusXP({ correctCount: correct, totalCount: total });
  if (profile.streak >= 1) {
    sessionXP += streakBonusXP(profile.streak);
  }

  const result = await addXP(sessionXP);
  showXPToast(sessionXP);

  const sessionId = await DB.addSession({
    app,
    date: today,
    timestamp: Date.now(),
    correct,
    total,
    timeSec,
    xpEarned: sessionXP
  });

  await DB.updateDailyActivity(today, {
    addXP: sessionXP,
    addSession: true,
    addCorrect: correct,
    addTotal: total,
    addTime: timeSec || 0
  });

  const newBadges = await checkBadges();

  if (correct === total && total >= 5) {
    await checkSpecialBadge('perfect_quiz');
  }

  await celebrateNewBadges(newBadges);

  return { xp: sessionXP, profile: result.profile, newBadges, leveledUp: result.leveledUp };
}

// ===== Level Unlocks =====
export const ENGLISH_LEVEL_UNLOCKS = { 1: 0, 2: 500, 3: 1500, 4: 3500, 5: 6500 };
export const MATH_LEVEL_UNLOCKS = { '5eme': 0, '4eme': 1000, '3eme': 3000, 'seconde': 6000, 'premiere': 10000 };
export const FRENCH_LEVEL_UNLOCKS = { 1: 0, 2: 500, 3: 1500, 4: 3500 };

export function isLevelUnlocked(unlocks, levelKey, xp) {
  return xp >= (unlocks[levelKey] || 0);
}
