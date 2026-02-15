const SFX = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function play(type) {
    try {
      const c = getCtx();
      if (c.state === 'suspended') c.resume();
      switch (type) {
        case 'tap': playTap(c); break;
        case 'correct': playCorrect(c); break;
        case 'wrong': playWrong(c); break;
        case 'match': playMatch(c); break;
        case 'reveal': playReveal(c); break;
        case 'complete': playComplete(c); break;
        case 'perfect': playPerfect(c); break;
        case 'whoosh': playWhoosh(c); break;
        case 'levelUp': playLevelUp(c); break;
        case 'badgeEarned': playBadgeEarned(c); break;
        case 'flip': playFlip(c); break;
        case 'speak': playSpeak(c); break;
      }
    } catch (e) { /* audio not supported */ }
  }

  function playTap(c) {
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(800, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.08);
    g.gain.setValueAtTime(0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    o.start(c.currentTime); o.stop(c.currentTime + 0.08);
  }

  function playCorrect(c) {
    [523, 659, 784].forEach((freq, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = freq;
      const t = c.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.2);
    });
  }

  function playWrong(c) {
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(200, c.currentTime);
    o.frequency.linearRampToValueAtTime(150, c.currentTime + 0.3);
    g.gain.setValueAtTime(0.1, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
    o.start(c.currentTime); o.stop(c.currentTime + 0.3);
  }

  function playMatch(c) {
    [440, 554].forEach((freq, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = freq;
      const t = c.currentTime + i * 0.06;
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.start(t); o.stop(t + 0.15);
    });
  }

  function playReveal(c) {
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(400, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(700, c.currentTime + 0.15);
    g.gain.setValueAtTime(0.1, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    o.start(c.currentTime); o.stop(c.currentTime + 0.15);
  }

  function playComplete(c) {
    [523, 587, 659, 784].forEach((freq, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = freq;
      const t = c.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.13, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t); o.stop(t + 0.3);
    });
  }

  function playPerfect(c) {
    [523, 659, 784, 1047, 784, 1047].forEach((freq, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = freq;
      const t = c.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.start(t); o.stop(t + 0.25);
    });
  }

  function playWhoosh(c) {
    const bufferSize = c.sampleRate * 0.15;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = c.createBufferSource(), g = c.createGain(), filter = c.createBiquadFilter();
    src.buffer = buffer;
    filter.type = 'bandpass'; filter.frequency.value = 1000; filter.Q.value = 0.5;
    src.connect(filter); filter.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    src.start(c.currentTime);
  }

  function playLevelUp(c) {
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = freq;
      const t = c.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.start(t); o.stop(t + 0.35);
    });
  }

  function playBadgeEarned(c) {
    [784, 988, 784, 1175, 1319].forEach((freq, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'triangle'; o.frequency.value = freq;
      const t = c.currentTime + i * 0.08;
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.2);
    });
  }

  function playFlip(c) {
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(600, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(900, c.currentTime + 0.1);
    g.gain.setValueAtTime(0.1, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
    o.start(c.currentTime); o.stop(c.currentTime + 0.1);
  }

  function playSpeak(c) {
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(500, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.06);
    o.frequency.exponentialRampToValueAtTime(500, c.currentTime + 0.12);
    g.gain.setValueAtTime(0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
    o.start(c.currentTime); o.stop(c.currentTime + 0.12);
  }

  return { play };
})();

export default SFX;
