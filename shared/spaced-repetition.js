import * as DB from './db.js';
import { todayStr, shuffle } from './helpers.js';

// SM-2 variant for vocabulary/math learning
// Status progression: new → learning → mastered
// mastered = 5+ consecutive correct, interval >= 7 days
// Regression: mastered → learning if answered wrong

export async function getOrCreateMastery(itemId, app, level) {
  let m = await DB.getMastery(itemId);
  if (!m) {
    m = {
      itemId,
      app,
      level,
      status: 'new',
      consecutiveCorrect: 0,
      totalCorrect: 0,
      totalAttempts: 0,
      easeFactor: 2.5,
      interval: 0,
      nextReview: todayStr(),
      lastReview: null,
    };
    await DB.saveMastery(m);
  }
  return m;
}

export async function recordAnswer(itemId, correct, app, level) {
  let m = await getOrCreateMastery(itemId, app, level);
  const today = todayStr();

  m.totalAttempts++;
  m.lastReview = today;

  if (correct) {
    m.totalCorrect++;
    m.consecutiveCorrect++;

    if (m.status === 'new') {
      m.status = 'learning';
      m.interval = 1;
      m.easeFactor = 2.5;
    } else if (m.status === 'learning') {
      if (m.consecutiveCorrect >= 5 && m.interval >= 7) {
        m.status = 'mastered';
      }
      m.interval = Math.round(m.interval * m.easeFactor);
      m.easeFactor = Math.min(3.0, m.easeFactor + 0.1);
    } else {
      // mastered: extend interval
      m.interval = Math.round(m.interval * m.easeFactor);
      m.easeFactor = Math.min(3.0, m.easeFactor + 0.05);
    }
  } else {
    m.consecutiveCorrect = 0;

    if (m.status === 'mastered') {
      m.status = 'learning';
    } else if (m.status === 'new') {
      m.status = 'learning';
    }

    m.interval = 1;
    m.easeFactor = Math.max(1.3, m.easeFactor - 0.2);
  }

  // Calculate next review date
  const next = new Date();
  next.setDate(next.getDate() + m.interval);
  m.nextReview = next.toISOString().slice(0, 10);

  await DB.saveMastery(m);
  return m;
}

// Build a session queue using smart practice
// ~40% due review + ~20% mastered refresh + ~30% new + ~10% reinforcement
export async function buildSessionQueue(app, levelItems, sessionSize = 15) {
  const today = todayStr();
  const allMastery = await DB.getAllMastery(app);
  const masteryMap = {};
  for (const m of allMastery) masteryMap[m.itemId] = m;

  const dueReview = [];
  const masteredRefresh = [];
  const newItems = [];

  for (const item of levelItems) {
    const m = masteryMap[item.id];
    if (!m || m.status === 'new') {
      newItems.push(item);
    } else if (m.status === 'learning' && m.nextReview <= today) {
      dueReview.push(item);
    } else if (m.status === 'mastered') {
      if (m.nextReview <= today) {
        dueReview.push(item);
      } else {
        masteredRefresh.push(item);
      }
    } else if (m.status === 'learning') {
      // Not yet due but still learning
      masteredRefresh.push(item);
    }
  }

  const queue = [];
  const targetDue = Math.ceil(sessionSize * 0.4);
  const targetMastered = Math.ceil(sessionSize * 0.2);
  const targetNew = Math.ceil(sessionSize * 0.3);

  // Fill due reviews first
  const shuffledDue = shuffle(dueReview);
  queue.push(...shuffledDue.slice(0, targetDue));

  // Mastered refresh
  const shuffledMastered = shuffle(masteredRefresh);
  queue.push(...shuffledMastered.slice(0, targetMastered));

  // New items
  const shuffledNew = shuffle(newItems);
  queue.push(...shuffledNew.slice(0, targetNew));

  // Fill remaining with whatever's available
  const remaining = sessionSize - queue.length;
  if (remaining > 0) {
    const usedIds = new Set(queue.map(q => q.id));
    const extra = shuffle([...dueReview, ...masteredRefresh, ...newItems])
      .filter(i => !usedIds.has(i.id));
    queue.push(...extra.slice(0, remaining));
  }

  return shuffle(queue).slice(0, sessionSize);
}

// Get game type based on mastery status
export function getGameTypeForMastery(masteryStatus, availableGames) {
  if (!masteryStatus || masteryStatus === 'new') {
    // New items: recognition-based games
    const easy = availableGames.filter(g => ['flashcard', 'fill-blank', 'mcq'].includes(g));
    return easy.length > 0 ? easy[Math.floor(Math.random() * easy.length)] : availableGames[0];
  } else if (masteryStatus === 'learning') {
    // Learning: active recall
    const mid = availableGames.filter(g => ['translate', 'fill-blank', 'match-pairs', 'mcq', 'solve', 'speak-word'].includes(g));
    return mid.length > 0 ? mid[Math.floor(Math.random() * mid.length)] : availableGames[0];
  } else {
    // Mastered: harder games
    const hard = availableGames.filter(g => ['translate', 'listen-type', 'sentence-builder', 'solve', 'proof', 'speak-translate'].includes(g));
    return hard.length > 0 ? hard[Math.floor(Math.random() * hard.length)] : availableGames[0];
  }
}

// Re-queue wrong answers 3-5 items later
export function requeueWrong(queue, currentIdx, item) {
  const offset = 3 + Math.floor(Math.random() * 3);
  const insertAt = Math.min(currentIdx + offset, queue.length);
  queue.splice(insertAt, 0, { ...item, isRetry: true });
}
