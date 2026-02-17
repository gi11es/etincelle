/**
 * Interactive geometry layer — handles geo-click and geo-place question types.
 * Returns Promises that resolve with { correct, selected/placed }.
 */
import { renderDiagram } from './geo-diagram.js';

/**
 * Render a geo-click question: student clicks on the correct target in a diagram.
 * @param {HTMLElement} container - game container
 * @param {object} item - question item with diagram.targets
 * @returns {Promise<{correct: boolean, selected: string}>}
 */
export function renderGeoClick(container, item) {
  return new Promise(resolve => {
    const diagramDiv = document.createElement('div');
    diagramDiv.className = 'math-diagram';
    container.appendChild(diagramDiv);

    const ctx = renderDiagram(diagramDiv, item.diagram);
    if (!ctx) {
      resolve({ correct: false, selected: '' });
      return;
    }

    const targets = ctx.svg.querySelectorAll('.geo-hit-target');
    if (targets.length === 0) {
      resolve({ correct: false, selected: '' });
      return;
    }

    function handleClick(e) {
      const target = e.currentTarget;
      const name = target.dataset.name;

      // Disable all targets
      targets.forEach(t => {
        t.removeEventListener('click', handleClick);
        t.classList.add('geo-target-disabled');
      });

      const correct = name === item.answer;

      if (correct) {
        target.classList.add('geo-target-correct');
      } else {
        target.classList.add('geo-target-wrong');
        // Highlight the correct one
        targets.forEach(t => {
          if (t.dataset.name === item.answer) {
            t.classList.add('geo-target-correct');
          }
        });
      }

      resolve({ correct, selected: name });
    }

    targets.forEach(t => t.addEventListener('click', handleClick));
  });
}

/**
 * Render a geo-place question: student places a point on a grid.
 * @param {HTMLElement} container - game container
 * @param {object} item - question item with diagram type "grid-place"
 * @returns {Promise<{correct: boolean, placed: string}>}
 */
export function renderGeoPlace(container, item) {
  return new Promise(resolve => {
    const diagramDiv = document.createElement('div');
    diagramDiv.className = 'math-diagram';
    container.appendChild(diagramDiv);

    const ctx = renderDiagram(diagramDiv, item.diagram);
    if (!ctx) {
      resolve({ correct: false, placed: '' });
      return;
    }

    const instruction = document.createElement('div');
    instruction.className = 'geo-place-instruction';
    instruction.textContent = 'Clique sur la grille pour placer le point';
    container.appendChild(instruction);

    let placedDot = null;
    let placedCoords = null;

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'geo-place-confirm';
    confirmBtn.textContent = 'Valider';
    confirmBtn.disabled = true;
    container.appendChild(confirmBtn);

    const SVG_NS = 'http://www.w3.org/2000/svg';

    function onSvgClick(e) {
      const svg = ctx.svg;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());

      let [mx, my] = ctx.fromSVG(svgPt.x, svgPt.y);

      // Snap to grid if configured
      if (item.diagram.snapToGrid !== false) {
        mx = Math.round(mx);
        my = Math.round(my);
      }

      // Clamp to bounds
      const b = item.diagram.bounds;
      mx = Math.max(b.xMin, Math.min(b.xMax, mx));
      my = Math.max(b.yMin, Math.min(b.yMax, my));

      placedCoords = [mx, my];

      // Remove previous placed dot
      if (placedDot) placedDot.remove();

      // Draw placed dot
      const [sx, sy] = ctx.toSVG(mx, my);
      placedDot = document.createElementNS(SVG_NS, 'circle');
      placedDot.setAttribute('cx', sx);
      placedDot.setAttribute('cy', sy);
      placedDot.setAttribute('r', 6);
      placedDot.setAttribute('class', 'geo-point-placed');
      svg.appendChild(placedDot);

      confirmBtn.disabled = false;
    }

    ctx.svg.addEventListener('click', onSvgClick);

    confirmBtn.addEventListener('click', () => {
      if (!placedCoords) return;

      // Disable further interaction
      ctx.svg.removeEventListener('click', onSvgClick);
      confirmBtn.disabled = true;
      confirmBtn.style.display = 'none';
      instruction.style.display = 'none';

      const placedStr = `${placedCoords[0]},${placedCoords[1]}`;
      const [ax, ay] = item.answer.split(',').map(Number);
      const correct = placedCoords[0] === ax && placedCoords[1] === ay;

      if (correct) {
        placedDot.classList.add('geo-placed-correct');
      } else {
        placedDot.classList.add('geo-placed-wrong');
        // Show correct position
        const [cx, cy] = ctx.toSVG(ax, ay);
        const correctDot = document.createElementNS(SVG_NS, 'circle');
        correctDot.setAttribute('cx', cx);
        correctDot.setAttribute('cy', cy);
        correctDot.setAttribute('r', 6);
        correctDot.setAttribute('class', 'geo-point-placed geo-placed-correct');
        ctx.svg.appendChild(correctDot);
      }

      resolve({ correct, placed: placedStr });
    });
  });
}
