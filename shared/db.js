const DB_VERSION = 2;

let dbCache = {};

function detectUser() {
  // Infer user from URL path: /felix/..., /dasha/..., /zoe/...
  const match = window.location.pathname.match(/\/(felix|dasha|zoe)\//);
  return match ? match[1] : null;
}

function getDBName(user) {
  if (user) return `FamilyLearning-${user}`;
  // Always prefer URL-based detection over localStorage (which can be stale
  // from visiting a different portal).
  const detected = detectUser();
  if (detected) {
    localStorage.setItem('family-active-user', detected);
    return `FamilyLearning-${detected}`;
  }
  const active = localStorage.getItem('family-active-user');
  return active ? `FamilyLearning-${active}` : 'FamilyLearning-default';
}

function openDB(user) {
  const name = getDBName(user);
  if (dbCache[name]) return dbCache[name];
  dbCache[name] = new Promise((resolve, reject) => {
    const req = indexedDB.open(name, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains('attempts')) {
        const store = db.createObjectStore('attempts', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-app', 'app');
        store.createIndex('by-item', 'itemId');
        store.createIndex('by-date', 'date');
        store.createIndex('by-session', 'sessionId');
      }

      if (!db.objectStoreNames.contains('mastery')) {
        const store = db.createObjectStore('mastery', { keyPath: 'itemId' });
        store.createIndex('by-app', 'app');
        store.createIndex('by-level', 'level');
        store.createIndex('by-nextReview', 'nextReview');
        store.createIndex('by-status', 'status');
      }

      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('badges')) {
        const store = db.createObjectStore('badges', { keyPath: 'badgeId' });
        store.createIndex('by-date', 'date');
      }

      if (!db.objectStoreNames.contains('sessions')) {
        const store = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-app', 'app');
        store.createIndex('by-date', 'date');
      }

      if (!db.objectStoreNames.contains('dailyActivity')) {
        db.createObjectStore('dailyActivity', { keyPath: 'date' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbCache[name];
}

async function tx(storeName, mode = 'readonly') {
  const db = await openDB();
  return db.transaction(storeName, mode).objectStore(storeName);
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txComplete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ===== Profile =====
export async function getProfile() {
  const store = await tx('profile');
  const profile = await reqToPromise(store.get(1));
  const user = localStorage.getItem('family-active-user') || 'default';
  const names = { felix: 'Félix', zoe: 'Zoé', dasha: 'Dasha' };
  return profile || { id: 1, xp: 0, streak: 0, lastActiveDate: null, name: names[user] || user };
}

export async function saveProfile(profile) {
  profile.id = 1;
  const store = await tx('profile', 'readwrite');
  await reqToPromise(store.put(profile));
}

// ===== Sessions =====
export async function addSession(session) {
  const store = await tx('sessions', 'readwrite');
  return reqToPromise(store.add(session));
}

export async function getSessions(app) {
  const store = await tx('sessions');
  if (app) {
    const idx = store.index('by-app');
    return reqToPromise(idx.getAll(app));
  }
  return reqToPromise(store.getAll());
}

export async function countSessions(app) {
  const store = await tx('sessions');
  if (app) {
    const idx = store.index('by-app');
    return reqToPromise(idx.count(app));
  }
  return reqToPromise(store.count());
}

// ===== Attempts =====
export async function addAttempt(attempt) {
  const store = await tx('attempts', 'readwrite');
  return reqToPromise(store.add(attempt));
}

export async function getAttempts(filters = {}) {
  const store = await tx('attempts');
  if (filters.app) {
    const idx = store.index('by-app');
    return reqToPromise(idx.getAll(filters.app));
  }
  if (filters.sessionId) {
    const idx = store.index('by-session');
    return reqToPromise(idx.getAll(filters.sessionId));
  }
  return reqToPromise(store.getAll());
}

// ===== Mastery =====
export async function getMastery(itemId) {
  const store = await tx('mastery');
  return reqToPromise(store.get(itemId));
}

export async function saveMastery(record) {
  const store = await tx('mastery', 'readwrite');
  return reqToPromise(store.put(record));
}

export async function getAllMastery(app) {
  const store = await tx('mastery');
  if (app) {
    const idx = store.index('by-app');
    return reqToPromise(idx.getAll(app));
  }
  return reqToPromise(store.getAll());
}

export async function getMasteryByStatus(status) {
  const store = await tx('mastery');
  const idx = store.index('by-status');
  return reqToPromise(idx.getAll(status));
}

export async function getDueItems(app, beforeDate) {
  const all = await getAllMastery(app);
  return all.filter(m => m.nextReview && m.nextReview <= beforeDate);
}

// ===== Badges =====
export async function getBadges() {
  const store = await tx('badges');
  return reqToPromise(store.getAll());
}

export async function hasBadge(badgeId) {
  const store = await tx('badges');
  const b = await reqToPromise(store.get(badgeId));
  return !!b;
}

export async function awardBadge(badge) {
  const exists = await hasBadge(badge.badgeId);
  if (exists) return false;
  const store = await tx('badges', 'readwrite');
  await reqToPromise(store.put(badge));
  return true;
}

// ===== Daily Activity =====
export async function getDailyActivity(date) {
  const store = await tx('dailyActivity');
  return reqToPromise(store.get(date));
}

export async function saveDailyActivity(record) {
  const store = await tx('dailyActivity', 'readwrite');
  return reqToPromise(store.put(record));
}

export async function getAllDailyActivity() {
  const store = await tx('dailyActivity');
  return reqToPromise(store.getAll());
}

export async function updateDailyActivity(date, updates) {
  let record = await getDailyActivity(date);
  if (!record) {
    record = { date, xpEarned: 0, sessionsPlayed: 0, correctAnswers: 0, totalAnswers: 0, timeSpent: 0 };
  }
  if (updates.addXP) record.xpEarned += updates.addXP;
  if (updates.addSession) record.sessionsPlayed += 1;
  if (updates.addCorrect) record.correctAnswers += updates.addCorrect;
  if (updates.addTotal) record.totalAnswers += updates.addTotal;
  if (updates.addTime) record.timeSpent += updates.addTime;
  await saveDailyActivity(record);
  return record;
}

// ===== Migration =====
export async function migrateLocalStorage() {
  const profile = await getProfile();
  if (profile.migrated) return;
  profile.migrated = true;
  await saveProfile(profile);
}
