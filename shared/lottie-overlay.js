import { $, ASSET_V } from './helpers.js';

const LottieOverlay = (() => {
  const ANIMS = {
    correct: '/shared/vendor/animations/correct.json' + ASSET_V,
    wrong: '/shared/vendor/animations/wrong.json' + ASSET_V,
    trophy: '/shared/vendor/animations/trophy.json' + ASSET_V,
    star: '/shared/vendor/animations/star.json' + ASSET_V
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
