/**
 * Thales Slider — 3ème: Théorème de Thalès
 * Triangle ABC with a draggable horizontal line cutting sides AB and AC.
 * Ratios AM/AB, AN/AC, MN/BC update live. Student positions to match a target ratio.
 */
import { randInt, randChoice } from '../../generators/helpers.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function render(container, item) {
  return new Promise(resolve => {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'interactive-container';
    container.appendChild(wrapper);

    // Random triangle and target ratio
    const targetFractions = [[1,3],[1,4],[2,5],[3,5],[2,3],[3,4],[1,2],[3,7],[4,7]];
    const [tNum, tDen] = randChoice(targetFractions);
    const targetRatio = tNum / tDen;

    // SVG dimensions
    const W = 420, H = 340;
    const PAD = 30;

    // Triangle vertices — A at top, B at bottom-left, C at bottom-right
    const Ax = W / 2 + randInt(-30, 30);
    const Ay = PAD + 10;
    const By = H - PAD;
    const Bx = PAD + randInt(10, 40);
    const Cx = W - PAD - randInt(10, 40);
    const Cy = By;

    // Question
    const q = document.createElement('div');
    q.className = 'math-question';
    q.innerHTML = `Positionne la parallèle à (BC) pour que <strong>AM/AB = ${tNum}/${tDen}</strong>`;
    wrapper.appendChild(q);

    // SVG
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('class', 'geo-svg');
    svg.style.width = '100%';
    svg.style.maxWidth = '440px';
    svg.style.touchAction = 'none';
    wrapper.appendChild(svg);

    // Draw triangle
    const tri = document.createElementNS(SVG_NS, 'polygon');
    tri.setAttribute('points', `${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}`);
    tri.setAttribute('fill', 'rgba(108, 99, 255, 0.06)');
    tri.setAttribute('stroke', 'var(--text)');
    tri.setAttribute('stroke-width', '2');
    svg.appendChild(tri);

    // Vertex labels
    function addLabel(x, y, text, dx = 0, dy = 0) {
      const lbl = document.createElementNS(SVG_NS, 'text');
      lbl.setAttribute('x', x + dx);
      lbl.setAttribute('y', y + dy);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('class', 'geo-point-label');
      lbl.setAttribute('font-size', '14');
      lbl.setAttribute('font-weight', '700');
      lbl.textContent = text;
      svg.appendChild(lbl);
    }

    addLabel(Ax, Ay, 'A', 0, -10);
    addLabel(Bx, By, 'B', -12, 16);
    addLabel(Cx, Cy, 'C', 12, 16);

    // Cutting line (MN) — M on AB, N on AC
    const cutLine = document.createElementNS(SVG_NS, 'line');
    cutLine.setAttribute('class', 'geo-segment');
    cutLine.setAttribute('stroke', '#00d68f');
    cutLine.setAttribute('stroke-width', '2.5');
    cutLine.setAttribute('stroke-dasharray', '6 4');
    svg.appendChild(cutLine);

    // Point M on AB
    const dotM = document.createElementNS(SVG_NS, 'circle');
    dotM.setAttribute('r', '5');
    dotM.setAttribute('fill', '#60a5fa');
    svg.appendChild(dotM);

    // Point N on AC
    const dotN = document.createElementNS(SVG_NS, 'circle');
    dotN.setAttribute('r', '5');
    dotN.setAttribute('fill', '#60a5fa');
    svg.appendChild(dotN);

    // Labels M and N
    const lblM = document.createElementNS(SVG_NS, 'text');
    lblM.setAttribute('class', 'geo-point-label');
    lblM.setAttribute('font-size', '13');
    lblM.setAttribute('font-weight', '700');
    lblM.setAttribute('fill', '#60a5fa');
    lblM.textContent = 'M';
    svg.appendChild(lblM);

    const lblN = document.createElementNS(SVG_NS, 'text');
    lblN.setAttribute('class', 'geo-point-label');
    lblN.setAttribute('font-size', '13');
    lblN.setAttribute('font-weight', '700');
    lblN.setAttribute('fill', '#60a5fa');
    lblN.textContent = 'N';
    svg.appendChild(lblN);

    // Drag handle (on the cut line midpoint)
    const handle = document.createElementNS(SVG_NS, 'circle');
    handle.setAttribute('r', '10');
    handle.setAttribute('class', 'interactive-drag-handle');
    handle.style.cursor = 'grab';
    svg.appendChild(handle);

    // Ratio display
    const ratioDisplay = document.createElement('div');
    ratioDisplay.className = 'ratio-display';
    ratioDisplay.style.textAlign = 'center';
    ratioDisplay.style.margin = '10px 0';
    ratioDisplay.style.fontSize = '1.05rem';
    ratioDisplay.style.fontWeight = '600';
    wrapper.appendChild(ratioDisplay);

    // State: t = parameter along AB/AC (0 = at A, 1 = at B/C)
    let currentT = 0.5;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function dist(x1, y1, x2, y2) {
      return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    function updateVisuals() {
      const t = currentT;

      // M on AB at parameter t
      const Mx = lerp(Ax, Bx, t);
      const My = lerp(Ay, By, t);
      // N on AC at parameter t
      const Nx = lerp(Ax, Cx, t);
      const Ny = lerp(Ay, Cy, t);

      cutLine.setAttribute('x1', Mx - 15);
      cutLine.setAttribute('y1', My);
      cutLine.setAttribute('x2', Nx + 15);
      cutLine.setAttribute('y2', Ny);

      dotM.setAttribute('cx', Mx);
      dotM.setAttribute('cy', My);
      dotN.setAttribute('cx', Nx);
      dotN.setAttribute('cy', Ny);

      lblM.setAttribute('x', Mx - 14);
      lblM.setAttribute('y', My - 8);
      lblN.setAttribute('x', Nx + 14);
      lblN.setAttribute('y', Ny - 8);

      const midX = (Mx + Nx) / 2;
      const midY = (My + Ny) / 2;
      handle.setAttribute('cx', midX);
      handle.setAttribute('cy', midY);

      // Compute ratios
      const ratioAM_AB = t;
      const ratioMN_BC = t; // By Thales, MN/BC = AM/AB

      const rStr = t.toFixed(2);
      const diff = Math.abs(t - targetRatio);
      const close = diff <= 0.05;

      const clr = close ? 'var(--success)' : 'var(--text)';
      ratioDisplay.innerHTML = [
        `<span style="color:${clr}">AM/AB = ${rStr}</span>`,
        `<span style="color:${clr}">AN/AC = ${rStr}</span>`,
        `<span style="color:${clr}">MN/BC = ${rStr}</span>`,
      ].join(' &nbsp;│&nbsp; ');
    }

    // Drag handling
    let dragging = false;

    function onPointerDown(e) {
      dragging = true;
      handle.style.cursor = 'grabbing';
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!dragging) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const svgY = (e.clientY - rect.top) / rect.height * H;

      // Map svgY to parameter t (Ay → 0, By → 1)
      let t = (svgY - Ay) / (By - Ay);
      t = Math.max(0.05, Math.min(0.95, t));
      currentT = t;
      updateVisuals();
    }

    function onPointerUp() {
      dragging = false;
      handle.style.cursor = 'grab';
    }

    handle.addEventListener('pointerdown', onPointerDown);
    svg.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    // Validate button
    const validateBtn = document.createElement('button');
    validateBtn.className = 'btn-submit';
    validateBtn.textContent = 'Valider';
    validateBtn.style.display = 'block';
    validateBtn.style.margin = '12px auto';
    wrapper.appendChild(validateBtn);

    updateVisuals();

    validateBtn.addEventListener('click', () => {
      // Cleanup drag
      handle.removeEventListener('pointerdown', onPointerDown);
      svg.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      handle.style.display = 'none';
      validateBtn.disabled = true;

      const diff = Math.abs(currentT - targetRatio);
      const correct = diff <= 0.05;

      // Show target line
      const tMx = lerp(Ax, Bx, targetRatio);
      const tMy = lerp(Ay, By, targetRatio);
      const tNx = lerp(Ax, Cx, targetRatio);
      const tNy = lerp(Ay, Cy, targetRatio);

      if (!correct) {
        const targetLine = document.createElementNS(SVG_NS, 'line');
        targetLine.setAttribute('x1', tMx - 15);
        targetLine.setAttribute('y1', tMy);
        targetLine.setAttribute('x2', tNx + 15);
        targetLine.setAttribute('y2', tNy);
        targetLine.setAttribute('stroke', '#00d68f');
        targetLine.setAttribute('stroke-width', '2');
        svg.appendChild(targetLine);
      }

      const explanation = correct
        ? `Bravo ! AM/AB = ${tNum}/${tDen} ≈ ${targetRatio.toFixed(2)}. Par le théorème de Thalès, si (MN) ∥ (BC), alors AM/AB = AN/AC = MN/BC.`
        : `La position correcte donnait AM/AB = ${tNum}/${tDen} ≈ ${targetRatio.toFixed(2)}. Ta position donnait ${currentT.toFixed(2)}. Le théorème de Thalès affirme que si (MN) ∥ (BC), alors AM/AB = AN/AC = MN/BC.`;

      resolve({ correct, explanation });
    });
  });
}
