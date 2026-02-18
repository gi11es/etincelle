import { $ } from './helpers.js';

const LottieOverlay = (() => {
  const ANIMS = {
    correct: '/shared/vendor/animations/correct.json',
    wrong: '/shared/vendor/animations/wrong.json',
    trophy: '/shared/vendor/animations/trophy.json',
    star: '/shared/vendor/animations/star.json'
  };

  function show(type, duration = 1200) {
    const overlay = $('#lottie-overlay');
    const player = $('#lottie-player');
    if (!player || !overlay) return;
    player.setAttribute('src', ANIMS[type] || ANIMS.correct);
    player.setAttribute('autoplay', '');
    overlay.classList.remove('hidden');
    setTimeout(() => {
      overlay.classList.add('hidden');
    }, duration);
  }

  return { show, ANIMS };
})();

export default LottieOverlay;
