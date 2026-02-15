export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => document.querySelectorAll(sel);

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function normalize(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function showScreen(id) {
  const current = document.querySelector('.screen.active');
  const next = document.querySelector(`#screen-${id}`);
  if (current === next) return;

  if (current) {
    current.classList.add('screen-exit');
    setTimeout(() => {
      current.classList.remove('active', 'screen-exit');
      next.classList.add('active');
      window.scrollTo(0, 0);
    }, 200);
  } else {
    next.classList.add('active');
    window.scrollTo(0, 0);
  }
}
