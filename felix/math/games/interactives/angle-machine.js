/**
 * Angle Machine — 5ème: Angles et parallélisme
 * Two parallel lines with a draggable transversal.
 * All 8 angles update in real-time. Student must position to match a target angle.
 */
import { randInt, randChoice } from '../../generators/helpers.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const W = 400, H = 300;
const LINE_Y1 = 90, LINE_Y2 = 210;
const MARGIN = 30;

const ANGLE_TYPES = [
  { key: 'alterne-interne', label: 'alterne-interne', color: '#60a5fa' },
  { key: 'correspondant', label: 'correspondant', color: '#00d68f' },
  { key: 'co-intérieur', label: 'co-intérieur', color: '#f59e0b' },
];

export function render(container, item) {
  return new Promise(resolve => {
    // Pick random target
    const targetAngle = item._targetAngle || randInt(30, 70);
    const angleType = item._angleType || randChoice(ANGLE_TYPES);

    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'interactive-container';
    container.appendChild(wrapper);

    // Question
    const q = document.createElement('div');
    q.className = 'math-question';
    q.textContent = `Fais glisser la sécante pour que l'angle ${angleType.label} mesure ${targetAngle}°`;
    wrapper.appendChild(q);

    // SVG
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('class', 'geo-svg');
    svg.style.width = '100%';
    svg.style.maxWidth = '420px';
    svg.style.touchAction = 'none';
    wrapper.appendChild(svg);

    // Parallel lines
    for (const y of [LINE_Y1, LINE_Y2]) {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', MARGIN);
      line.setAttribute('y1', y);
      line.setAttribute('x2', W - MARGIN);
      line.setAttribute('y2', y);
      line.setAttribute('class', 'geo-segment');
      svg.appendChild(line);

      // Parallel marks
      const mx = W / 2;
      for (const dx of [-4, 4]) {
        const mark = document.createElementNS(SVG_NS, 'line');
        mark.setAttribute('x1', mx + dx);
        mark.setAttribute('y1', y - 6);
        mark.setAttribute('x2', mx + dx);
        mark.setAttribute('y2', y + 6);
        mark.setAttribute('class', 'geo-parallel-mark');
        svg.appendChild(mark);
      }
    }

    // Transversal (draggable)
    const transversal = document.createElementNS(SVG_NS, 'line');
    transversal.setAttribute('class', 'geo-segment');
    transversal.setAttribute('stroke-width', '2.5');
    svg.appendChild(transversal);

    // Drag handle (circle at top intersection)
    const handle = document.createElementNS(SVG_NS, 'circle');
    handle.setAttribute('r', '12');
    handle.setAttribute('class', 'interactive-drag-handle');
    handle.style.cursor = 'grab';
    svg.appendChild(handle);

    // Angle arcs and labels
    const arcElements = [];
    const labelElements = [];
    for (let i = 0; i < 4; i++) {
      const arc = document.createElementNS(SVG_NS, 'path');
      arc.setAttribute('class', 'angle-arc-live');
      arc.setAttribute('fill', 'none');
      arc.setAttribute('stroke-width', '2');
      svg.appendChild(arc);
      arcElements.push(arc);

      const lbl = document.createElementNS(SVG_NS, 'text');
      lbl.setAttribute('class', 'geo-angle-label');
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('font-size', '11');
      svg.appendChild(lbl);
      labelElements.push(lbl);
    }

    // Live angle display
    const angleDisplay = document.createElement('div');
    angleDisplay.className = 'ratio-display';
    angleDisplay.style.textAlign = 'center';
    angleDisplay.style.fontSize = '1.1rem';
    angleDisplay.style.fontWeight = '700';
    angleDisplay.style.margin = '8px 0';
    wrapper.appendChild(angleDisplay);

    // State
    let currentAngle = 55; // degrees from horizontal
    const fixedX = W / 2; // intersection x on both lines

    function getIntersections(angleDeg) {
      const rad = angleDeg * Math.PI / 180;
      const dx = Math.cos(rad);
      const dy = -Math.sin(rad); // SVG y is flipped

      // Extend transversal through both intersection points
      const ix1 = fixedX, iy1 = LINE_Y1;
      const ix2 = fixedX, iy2 = LINE_Y2;

      // Direction from bottom intersection upward
      const len = (LINE_Y2 - LINE_Y1) / Math.sin(rad);
      const topX = ix2 - len * Math.cos(rad);

      return { ix1: topX, iy1: LINE_Y1, ix2: fixedX, iy2: LINE_Y2, angleDeg };
    }

    function drawArc(cx, cy, startAngle, endAngle, radius) {
      const s = startAngle * Math.PI / 180;
      const e = endAngle * Math.PI / 180;
      const x1 = cx + radius * Math.cos(s);
      const y1 = cy - radius * Math.sin(s);
      const x2 = cx + radius * Math.cos(e);
      const y2 = cy - radius * Math.sin(e);
      const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
      return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`;
    }

    function updateVisuals() {
      const { ix1, iy1, ix2, iy2, angleDeg } = getIntersections(currentAngle);

      // Extend line beyond intersections
      const dx = ix2 - ix1, dy = iy2 - iy1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len, uy = dy / len;

      transversal.setAttribute('x1', ix1 - ux * 40);
      transversal.setAttribute('y1', iy1 - uy * 40);
      transversal.setAttribute('x2', ix2 + ux * 40);
      transversal.setAttribute('y2', iy2 + uy * 40);

      handle.setAttribute('cx', ix1);
      handle.setAttribute('cy', iy1);

      // Compute angles
      const alpha = angleDeg; // angle at top-right (between transversal going down-right and parallel going right)
      const supplement = 180 - alpha;

      // Color based on type
      const altIntColor = '#60a5fa';
      const corrColor = '#00d68f';
      const coIntColor = '#f59e0b';
      const dimColor = 'rgba(255,255,255,0.2)';

      // Arcs: show 4 key angles (top-right, top-left, bottom-left, bottom-right)
      const R = 25;
      // Top intersection: right angle = alpha, left angle = supplement
      arcElements[0].setAttribute('d', drawArc(ix1, iy1, 0, alpha, R));
      arcElements[0].setAttribute('stroke', angleType.key === 'correspondant' ? corrColor : dimColor);
      labelElements[0].setAttribute('x', ix1 + R * 1.4 * Math.cos(alpha / 2 * Math.PI / 180));
      labelElements[0].setAttribute('y', iy1 - R * 1.4 * Math.sin(alpha / 2 * Math.PI / 180) + 4);
      labelElements[0].textContent = `${Math.round(alpha)}°`;

      arcElements[1].setAttribute('d', drawArc(ix1, iy1, alpha, 180, R));
      arcElements[1].setAttribute('stroke', dimColor);
      labelElements[1].textContent = '';

      // Bottom intersection: left angle (alternate-internal to top-right) = alpha
      arcElements[2].setAttribute('d', drawArc(ix2, iy2, 180, 180 + alpha, R));
      arcElements[2].setAttribute('stroke', angleType.key === 'alterne-interne' ? altIntColor : dimColor);
      labelElements[2].setAttribute('x', ix2 - R * 1.4 * Math.cos(alpha / 2 * Math.PI / 180));
      labelElements[2].setAttribute('y', iy2 + R * 1.4 * Math.sin(alpha / 2 * Math.PI / 180) + 4);
      labelElements[2].textContent = `${Math.round(alpha)}°`;

      // Bottom intersection: right angle (co-interior to top-right) = supplement
      arcElements[3].setAttribute('d', drawArc(ix2, iy2, 0, alpha, R));
      arcElements[3].setAttribute('stroke', angleType.key === 'co-intérieur' ? coIntColor :
        (angleType.key === 'correspondant' ? corrColor : dimColor));
      labelElements[3].setAttribute('x', ix2 + R * 1.4 * Math.cos(alpha / 2 * Math.PI / 180));
      labelElements[3].setAttribute('y', iy2 - R * 1.4 * Math.sin(alpha / 2 * Math.PI / 180) + 4);
      labelElements[3].textContent = angleType.key === 'co-intérieur' ?
        `${Math.round(supplement)}°` : `${Math.round(alpha)}°`;

      // Display relevant angle
      let displayAngle;
      if (angleType.key === 'co-intérieur') {
        displayAngle = supplement;
      } else {
        displayAngle = alpha;
      }

      const diff = Math.abs(displayAngle - targetAngle);
      const closeEnough = diff <= 2;
      angleDisplay.textContent = `Angle ${angleType.label} : ${Math.round(displayAngle)}°`;
      angleDisplay.style.color = closeEnough ? 'var(--success)' : 'var(--text)';
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
      const svgX = (e.clientX - rect.left) / rect.width * W;
      const svgY = (e.clientY - rect.top) / rect.height * H;

      // Calculate angle from bottom intersection to pointer
      const dx = svgX - fixedX;
      const dy = LINE_Y2 - svgY; // flip because SVG y is down
      let angle = Math.atan2(dy, dx) * 180 / Math.PI;

      // Clamp to reasonable range
      angle = Math.max(15, Math.min(165, angle));
      currentAngle = angle;
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
      // Cleanup
      handle.removeEventListener('pointerdown', onPointerDown);
      svg.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      handle.style.display = 'none';
      validateBtn.disabled = true;

      let displayAngle;
      if (angleType.key === 'co-intérieur') {
        displayAngle = 180 - currentAngle;
      } else {
        displayAngle = currentAngle;
      }

      const diff = Math.abs(displayAngle - targetAngle);
      const correct = diff <= 2;

      const explanation = correct
        ? `Bravo ! L'angle ${angleType.label} mesure bien ${targetAngle}°. Les angles ${angleType.label}s sont ${angleType.key === 'co-intérieur' ? 'supplémentaires (somme = 180°)' : 'égaux'} quand les droites sont parallèles.`
        : `L'angle ${angleType.label} mesurait ${Math.round(displayAngle)}° au lieu de ${targetAngle}°. ${angleType.key === 'co-intérieur' ? 'Les angles co-intérieurs sont supplémentaires.' : 'Les angles ' + angleType.label + 's sont égaux entre parallèles.'}`;

      resolve({ correct, explanation });
    });
  });
}
