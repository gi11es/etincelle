import { $ } from './helpers.js';

const Confetti = (() => {
  let canvas, ctx, particles = [], animFrame = null;

  function init() {
    canvas = $('#confetti-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function launch(count = 80) {
    if (!canvas) return;
    particles = [];
    const colors = ['#6c63ff', '#a855f7', '#ec4899', '#00d68f', '#4facfe', '#eab308', '#f97316'];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.12 + Math.random() * 0.08,
        drag: 0.98 + Math.random() * 0.015,
        opacity: 1
      });
    }
    if (!animFrame) animate();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      if (p.opacity <= 0) continue;
      alive = true;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      if (p.y > canvas.height + 20) { p.opacity = 0; continue; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive) {
      animFrame = requestAnimationFrame(animate);
    } else {
      animFrame = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return { init, launch };
})();

export default Confetti;
