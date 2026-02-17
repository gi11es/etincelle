/**
 * Pythagoras Explorer — 4ème: Théorème de Pythagore
 * Right triangle with squares on each side. Student types c² given a and b.
 * The visual shows the area proof: a² + b² = c².
 */
import { randInt, randChoice, PYTH_TRIPLES } from '../../generators/helpers.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function render(container, item) {
  return new Promise(resolve => {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'interactive-container';
    container.appendChild(wrapper);

    // Pick random Pythagorean triple or near-integer sides
    const triples = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]];
    const [a, b, c] = randChoice(triples);

    // Question
    const q = document.createElement('div');
    q.className = 'math-question';
    q.innerHTML = `Le triangle rectangle a des cathètes de <strong>${a}</strong> et <strong>${b}</strong>. Quelle est l'aire du carré construit sur l'hypoténuse (c²) ?`;
    wrapper.appendChild(q);

    // SVG — draw triangle and three squares
    const scale = 18;
    const ox = 60, oy = 250; // origin (right angle vertex)
    const W = Math.max(400, (a + c) * scale + 120);
    const H = Math.max(350, (b + a) * scale + 80);

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('class', 'geo-svg');
    svg.style.width = '100%';
    svg.style.maxWidth = '500px';
    wrapper.appendChild(svg);

    // Triangle vertices: A at origin (right angle), B at (a*scale, 0), C at (0, -b*scale)
    const Ax = ox, Ay = oy;
    const Bx = ox + a * scale, By = oy;
    const Cx = ox, Cy = oy - b * scale;

    // Draw triangle
    const tri = document.createElementNS(SVG_NS, 'polygon');
    tri.setAttribute('points', `${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}`);
    tri.setAttribute('fill', 'rgba(108, 99, 255, 0.08)');
    tri.setAttribute('stroke', 'var(--text)');
    tri.setAttribute('stroke-width', '2');
    svg.appendChild(tri);

    // Right angle mark
    const markSize = 10;
    const mark = document.createElementNS(SVG_NS, 'polyline');
    mark.setAttribute('points', `${Ax + markSize},${Ay} ${Ax + markSize},${Ay - markSize} ${Ax},${Ay - markSize}`);
    mark.setAttribute('fill', 'none');
    mark.setAttribute('stroke', 'var(--text-dim)');
    mark.setAttribute('stroke-width', '1.5');
    svg.appendChild(mark);

    // Square on side a (bottom, from A to B, going down)
    function drawSquare(x1, y1, x2, y2, color, areaLabel) {
      const dx = x2 - x1, dy = y2 - y1;
      // Perpendicular direction (outward)
      const px = -dy, py = dx;
      const points = [
        `${x1},${y1}`,
        `${x2},${y2}`,
        `${x2 + px},${y2 + py}`,
        `${x1 + px},${y1 + py}`
      ].join(' ');

      const rect = document.createElementNS(SVG_NS, 'polygon');
      rect.setAttribute('points', points);
      rect.setAttribute('fill', color);
      rect.setAttribute('stroke', 'var(--text-dim)');
      rect.setAttribute('stroke-width', '1');
      svg.appendChild(rect);

      // Area label in center
      const cx = (x1 + x2 + x2 + px + x1 + px) / 4;
      const cy2 = (y1 + y2 + y2 + py + y1 + py) / 4;
      const lbl = document.createElementNS(SVG_NS, 'text');
      lbl.setAttribute('x', cx);
      lbl.setAttribute('y', cy2 + 5);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('class', 'area-label');
      lbl.setAttribute('fill', 'var(--text)');
      lbl.setAttribute('font-weight', '700');
      lbl.setAttribute('font-size', '14');
      lbl.textContent = areaLabel;
      svg.appendChild(lbl);
    }

    // Square on cathete a (AB, extends downward)
    drawSquare(Ax, Ay, Bx, By, 'rgba(96, 165, 250, 0.15)', `${a}² = ${a * a}`);

    // Square on cathete b (AC, extends leftward)
    drawSquare(Cx, Cy, Ax, Ay, 'rgba(167, 139, 250, 0.15)', `${b}² = ${b * b}`);

    // Square on hypotenuse (BC, extends outward)
    drawSquare(Bx, By, Cx, Cy, 'rgba(0, 214, 143, 0.1)', '?');

    // Side labels
    function sideLabel(x1, y1, x2, y2, text, offset = 15) {
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len * offset, ny = dx / len * offset;
      const lbl = document.createElementNS(SVG_NS, 'text');
      lbl.setAttribute('x', mx + nx);
      lbl.setAttribute('y', my + ny + 4);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('class', 'geo-side-label');
      lbl.setAttribute('font-size', '13');
      lbl.setAttribute('font-weight', '700');
      lbl.textContent = text;
      svg.appendChild(lbl);
    }

    sideLabel(Ax, Ay, Bx, By, `a = ${a}`, -15);
    sideLabel(Cx, Cy, Ax, Ay, `b = ${b}`, 15);
    sideLabel(Bx, By, Cx, Cy, 'c = ?', -15);

    // Formula display
    const formula = document.createElement('div');
    formula.className = 'ratio-display';
    formula.style.textAlign = 'center';
    formula.style.margin = '12px 0';
    formula.style.fontSize = '1.1rem';
    formula.innerHTML = `<span style="color:#60a5fa">${a}² = ${a * a}</span> + <span style="color:#a78bfa">${b}² = ${b * b}</span> = <span style="color:var(--success)">c² = ?</span>`;
    wrapper.appendChild(formula);

    // Input
    const inputRow = document.createElement('div');
    inputRow.className = 'math-solve-row';
    inputRow.innerHTML = `
      <span style="font-weight:700">c² =</span>
      <input class="math-solve-input" type="number" placeholder="..." autocomplete="off" style="max-width:100px">
      <button class="btn-submit">Valider</button>
    `;
    wrapper.appendChild(inputRow);

    const input = inputRow.querySelector('input');
    const btn = inputRow.querySelector('button');
    input.focus();

    function check() {
      const val = parseInt(input.value);
      const expected = c * c;
      const correct = val === expected;

      input.disabled = true;
      btn.disabled = true;

      if (correct) {
        input.classList.add('answer-correct-input');
        formula.innerHTML = `<span style="color:#60a5fa">${a * a}</span> + <span style="color:#a78bfa">${b * b}</span> = <span style="color:var(--success);font-weight:800">${expected}</span> ✓`;
      } else {
        input.classList.add('answer-wrong-input');
      }

      const explanation = correct
        ? `Bravo ! ${a}² + ${b}² = ${a * a} + ${b * b} = ${expected} = ${c}². L'hypoténuse mesure ${c}. L'aire du grand carré (${expected}) est bien la somme des aires des deux petits carrés (${a * a} + ${b * b}).`
        : `c² = a² + b² = ${a * a} + ${b * b} = ${expected}. L'hypoténuse mesure c = √${expected} = ${c}. Ta réponse était ${val || '(vide)'}.`;

      resolve({ correct, explanation });
    }

    btn.addEventListener('click', check);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  });
}
