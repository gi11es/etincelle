import { $ } from './helpers.js';

const LottieOverlay = (() => {
  const ANIMS = {
    correct: 'https://lottie.host/b8893b89-8e78-4c3a-8e36-57fd89e3a06d/dn3cVNoBtl.json',
    wrong: 'https://lottie.host/39fca0c4-27a3-4e72-9550-43e8fee20888/QbMkJyNNUf.json',
    trophy: 'https://lottie.host/2e308341-31e2-4d38-a0f1-4c234548dd88/ISLNEHJTmv.json',
    star: 'https://lottie.host/3ba4a4b7-3f49-466a-82c1-0bf4bd11b93c/4W0Njm9JjI.json'
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
