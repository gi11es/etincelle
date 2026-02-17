/**
 * Symmetry Painter — 5ème: Symétrie centrale
 * Grid with center O. A polygon is shown, student places symmetric vertices one by one.
 */
import { randInt, shuffle } from '../../generators/helpers.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function render(container, item) {
  return new Promise(resolve => {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'interactive-container';
    container.appendChild(wrapper);

    // Grid params
    const GRID = 10;
    const CELL = 36;
    const PAD = 20;
    const W = GRID * CELL + 2 * PAD;
    const H = GRID * CELL + 2 * PAD;

    // Random center O
    const cx = randInt(3, 7);
    const cy = randInt(3, 7);

    // Random polygon (3-4 vertices) on one side of center
    const numVerts = randInt(3, 4);
    const originalVerts = [];
    const used = new Set();
    used.add(`${cx},${cy}`);

    while (originalVerts.length < numVerts) {
      const vx = randInt(0, cx - 1);
      const vy = randInt(Math.max(0, cy - 3), Math.min(GRID, cy + 3));
      const key = `${vx},${vy}`;
      // Check symmetric is in bounds
      const sx = 2 * cx - vx;
      const sy = 2 * cy - vy;
      if (sx >= 0 && sx <= GRID && sy >= 0 && sy <= GRID && !used.has(key)) {
        originalVerts.push([vx, vy]);
        used.add(key);
      }
    }

    // Compute expected symmetric vertices
    const symmetricVerts = originalVerts.map(([x, y]) => [2 * cx - x, 2 * cy - y]);

    // Question
    const q = document.createElement('div');
    q.className = 'math-question';
    q.textContent = `Place les ${numVerts} sommets symétriques par rapport au centre O(${cx}, ${cy})`;
    wrapper.appendChild(q);

    // SVG
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('class', 'geo-svg');
    svg.style.width = '100%';
    svg.style.maxWidth = '420px';
    svg.style.touchAction = 'none';
    wrapper.appendChild(svg);

    function toSVG(gx, gy) {
      return [PAD + gx * CELL, PAD + (GRID - gy) * CELL];
    }

    // Draw grid
    for (let i = 0; i <= GRID; i++) {
      const x = PAD + i * CELL;
      const yTop = PAD, yBot = PAD + GRID * CELL;
      const gl = document.createElementNS(SVG_NS, 'line');
      gl.setAttribute('x1', x); gl.setAttribute('y1', yTop);
      gl.setAttribute('x2', x); gl.setAttribute('y2', yBot);
      gl.setAttribute('class', 'geo-grid-line');
      svg.appendChild(gl);

      const y = PAD + i * CELL;
      const xL = PAD, xR = PAD + GRID * CELL;
      const gl2 = document.createElementNS(SVG_NS, 'line');
      gl2.setAttribute('x1', xL); gl2.setAttribute('y1', y);
      gl2.setAttribute('x2', xR); gl2.setAttribute('y2', y);
      gl2.setAttribute('class', 'geo-grid-line');
      svg.appendChild(gl2);
    }

    // Draw original polygon
    const polyPoints = originalVerts.map(([x, y]) => toSVG(x, y).join(',')).join(' ');
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', polyPoints);
    poly.setAttribute('fill', 'rgba(108, 99, 255, 0.15)');
    poly.setAttribute('stroke', '#a78bfa');
    poly.setAttribute('stroke-width', '2');
    svg.appendChild(poly);

    // Draw original vertices
    originalVerts.forEach(([x, y], i) => {
      const [sx, sy] = toSVG(x, y);
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', sx); c.setAttribute('cy', sy);
      c.setAttribute('r', '5');
      c.setAttribute('fill', '#a78bfa');
      svg.appendChild(c);
      const lbl = document.createElementNS(SVG_NS, 'text');
      lbl.setAttribute('x', sx - 12); lbl.setAttribute('y', sy - 8);
      lbl.setAttribute('class', 'geo-point-label');
      lbl.textContent = String.fromCharCode(65 + i);
      svg.appendChild(lbl);
    });

    // Draw center O
    const [ocx, ocy] = toSVG(cx, cy);
    const centerDot = document.createElementNS(SVG_NS, 'circle');
    centerDot.setAttribute('cx', ocx); centerDot.setAttribute('cy', ocy);
    centerDot.setAttribute('r', '6');
    centerDot.setAttribute('fill', '#00d68f');
    svg.appendChild(centerDot);
    const oLabel = document.createElementNS(SVG_NS, 'text');
    oLabel.setAttribute('x', ocx + 10); oLabel.setAttribute('y', ocy - 8);
    oLabel.setAttribute('class', 'geo-point-label');
    oLabel.setAttribute('fill', '#00d68f');
    oLabel.textContent = 'O';
    svg.appendChild(oLabel);

    // Ghost point for next expected vertex
    let currentIdx = 0;
    const placedDots = [];

    const ghost = document.createElementNS(SVG_NS, 'circle');
    ghost.setAttribute('r', '5');
    ghost.setAttribute('class', 'sym-ghost-point');
    ghost.style.display = 'none';
    svg.appendChild(ghost);

    // Instruction
    const instruction = document.createElement('div');
    instruction.className = 'geo-place-instruction';
    instruction.textContent = `Place le symétrique de ${String.fromCharCode(65)} (${currentIdx + 1}/${numVerts})`;
    wrapper.appendChild(instruction);

    // Click handler
    function onSvgClick(e) {
      if (currentIdx >= numVerts) return;

      const rect = svg.getBoundingClientRect();
      const svgX = (e.clientX - rect.left) / rect.width * W;
      const svgY = (e.clientY - rect.top) / rect.height * H;

      // Snap to grid
      const gx = Math.round((svgX - PAD) / CELL);
      const gy = Math.round((PAD + GRID * CELL - svgY) / CELL);

      if (gx < 0 || gx > GRID || gy < 0 || gy > GRID) return;

      const [sx, sy] = toSVG(gx, gy);
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', sx); dot.setAttribute('cy', sy);
      dot.setAttribute('r', '6');
      dot.setAttribute('fill', '#60a5fa');
      dot.setAttribute('stroke', 'white');
      dot.setAttribute('stroke-width', '1.5');
      svg.appendChild(dot);

      placedDots.push({ gx, gy, dot, expected: symmetricVerts[currentIdx] });

      currentIdx++;

      if (currentIdx < numVerts) {
        instruction.textContent = `Place le symétrique de ${String.fromCharCode(65 + currentIdx)} (${currentIdx + 1}/${numVerts})`;
      } else {
        instruction.textContent = 'Tous les points placés !';
        // Show validate
        validateBtn.disabled = false;
      }
    }

    svg.addEventListener('click', onSvgClick);

    // Validate button
    const validateBtn = document.createElement('button');
    validateBtn.className = 'btn-submit';
    validateBtn.textContent = 'Valider';
    validateBtn.disabled = true;
    validateBtn.style.display = 'block';
    validateBtn.style.margin = '12px auto';
    wrapper.appendChild(validateBtn);

    validateBtn.addEventListener('click', () => {
      svg.removeEventListener('click', onSvgClick);
      validateBtn.disabled = true;

      let allCorrect = true;

      placedDots.forEach(({ gx, gy, dot, expected }) => {
        const [ex, ey] = expected;
        const isCorrect = gx === ex && gy === ey;
        if (!isCorrect) allCorrect = false;

        if (isCorrect) {
          dot.setAttribute('fill', '#00d68f');
          dot.setAttribute('stroke', '#00d68f');
        } else {
          dot.setAttribute('fill', '#ff4757');
          dot.setAttribute('stroke', '#ff4757');
          // Show correct position
          const [cx2, cy2] = toSVG(ex, ey);
          const correctDot = document.createElementNS(SVG_NS, 'circle');
          correctDot.setAttribute('cx', cx2); correctDot.setAttribute('cy', cy2);
          correctDot.setAttribute('r', '6');
          correctDot.setAttribute('fill', '#00d68f');
          correctDot.setAttribute('stroke', 'white');
          correctDot.setAttribute('stroke-width', '2');
          svg.appendChild(correctDot);
        }
      });

      // Draw symmetric polygon
      const symPolyPoints = symmetricVerts.map(([x, y]) => toSVG(x, y).join(',')).join(' ');
      const symPoly = document.createElementNS(SVG_NS, 'polygon');
      symPoly.setAttribute('points', symPolyPoints);
      symPoly.setAttribute('fill', 'rgba(0, 214, 143, 0.1)');
      symPoly.setAttribute('stroke', '#00d68f');
      symPoly.setAttribute('stroke-width', '2');
      symPoly.setAttribute('stroke-dasharray', '4 3');
      svg.appendChild(symPoly);

      const vertexLabels = originalVerts.map((v, i) => {
        const [ex, ey] = symmetricVerts[i];
        return `${String.fromCharCode(65 + i)}'(${ex}, ${ey})`;
      }).join(', ');

      const explanation = allCorrect
        ? `Parfait ! Les symétriques sont bien placés : ${vertexLabels}. En symétrie centrale de centre O, chaque point A a pour image A' tel que O est le milieu de [AA'].`
        : `Les positions correctes étaient : ${vertexLabels}. Pour chaque point A(x,y), son symétrique par rapport à O(${cx},${cy}) est A'(${2 * cx}−x, ${2 * cy}−y).`;

      resolve({ correct: allCorrect, explanation });
    });
  });
}
