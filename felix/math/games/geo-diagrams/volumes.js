/**
 * Draws 3D shape wireframes using simple isometric projection.
 * Shapes: cylinder, cone, sphere, prism, pyramid.
 */
import { createGeoContext } from '../geo-renderer.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined) e.setAttribute(k, v);
  }
  return e;
}

export function drawVolume(container, diagram) {
  const { shape, dimensions, labels } = diagram;

  const width = 260, height = 220, cx = width / 2, cy = height / 2;
  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    width: '100%',
    preserveAspectRatio: 'xMidYMid meet',
    class: 'geo-svg',
  });

  const builders = { cylinder, cone, sphere, prism, pyramid };
  const build = builders[shape] || cylinder;
  build(svg, cx, cy, dimensions, labels);

  container.appendChild(svg);
}

function cylinder(svg, cx, cy, dim, labels) {
  const rr = 50, hh = 90;
  const ry = 16; // ellipse vertical radius for perspective
  const top = cy - hh / 2;
  const bot = cy + hh / 2;

  // Body
  svg.appendChild(el('line', { x1: cx - rr, y1: top, x2: cx - rr, y2: bot, class: 'geo-segment' }));
  svg.appendChild(el('line', { x1: cx + rr, y1: top, x2: cx + rr, y2: bot, class: 'geo-segment' }));

  // Bottom ellipse
  svg.appendChild(el('ellipse', { cx, cy: bot, rx: rr, ry, class: 'geo-segment', fill: 'none' }));

  // Top ellipse
  svg.appendChild(el('ellipse', { cx, cy: top, rx: rr, ry, class: 'geo-segment', fill: 'none' }));

  // Hidden back of bottom (dashed)
  svg.appendChild(el('ellipse', {
    cx, cy: bot, rx: rr, ry,
    class: 'geo-segment geo-hidden-edge', fill: 'none',
    'clip-path': 'none',
  }));

  addDimensionLabels(svg, cx, cy, rr, hh, labels, 'cylinder');
}

function cone(svg, cx, cy, dim, labels) {
  const rr = 50, hh = 100;
  const ry = 16;
  const top = cy - hh / 2;
  const bot = cy + hh / 2;

  // Sides
  svg.appendChild(el('line', { x1: cx, y1: top, x2: cx - rr, y2: bot, class: 'geo-segment' }));
  svg.appendChild(el('line', { x1: cx, y1: top, x2: cx + rr, y2: bot, class: 'geo-segment' }));

  // Base ellipse
  svg.appendChild(el('ellipse', { cx, cy: bot, rx: rr, ry, class: 'geo-segment', fill: 'none' }));

  // Height (dashed)
  svg.appendChild(el('line', { x1: cx, y1: top, x2: cx, y2: bot, class: 'geo-segment geo-segment-dashed' }));

  // Apex point
  svg.appendChild(el('circle', { cx, cy: top, r: 3, class: 'geo-point' }));

  addDimensionLabels(svg, cx, cy, rr, hh, labels, 'cone');
}

function sphere(svg, cx, cy, dim, labels) {
  const rr = 60;

  // Main circle
  svg.appendChild(el('circle', { cx, cy, r: rr, class: 'geo-segment', fill: 'none' }));

  // Equator ellipse
  svg.appendChild(el('ellipse', { cx, cy, rx: rr, ry: 14, class: 'geo-segment geo-segment-dashed', fill: 'none' }));

  // Radius line
  svg.appendChild(el('line', { x1: cx, y1: cy, x2: cx + rr, y2: cy, class: 'geo-segment geo-segment-highlight' }));
  svg.appendChild(el('circle', { cx, cy, r: 3, class: 'geo-point' }));

  if (labels?.r) {
    const t = el('text', { x: cx + rr / 2, y: cy - 10, class: 'geo-side-label', 'text-anchor': 'middle' });
    t.textContent = labels.r;
    svg.appendChild(t);
  }
}

function pyramid(svg, cx, cy, dim, labels) {
  const bw = 70, bd = 30, hh = 90;
  const top = cy - hh / 2 + 10;
  const bot = cy + hh / 2;

  // Base (parallelogram for perspective)
  const bl = [cx - bw / 2, bot];
  const br = [cx + bw / 2, bot];
  const tr = [cx + bw / 2 - bd, bot - bd];
  const tl = [cx - bw / 2 - bd, bot - bd];
  const apex = [cx - bd / 2, top];

  // Base edges
  svg.appendChild(el('line', { x1: bl[0], y1: bl[1], x2: br[0], y2: br[1], class: 'geo-segment' }));
  svg.appendChild(el('line', { x1: br[0], y1: br[1], x2: tr[0], y2: tr[1], class: 'geo-segment' }));
  svg.appendChild(el('line', { x1: tl[0], y1: tl[1], x2: bl[0], y2: bl[1], class: 'geo-segment geo-segment-dashed' }));
  svg.appendChild(el('line', { x1: tl[0], y1: tl[1], x2: tr[0], y2: tr[1], class: 'geo-segment geo-segment-dashed' }));

  // Lateral edges
  svg.appendChild(el('line', { x1: apex[0], y1: apex[1], x2: bl[0], y2: bl[1], class: 'geo-segment' }));
  svg.appendChild(el('line', { x1: apex[0], y1: apex[1], x2: br[0], y2: br[1], class: 'geo-segment' }));
  svg.appendChild(el('line', { x1: apex[0], y1: apex[1], x2: tr[0], y2: tr[1], class: 'geo-segment' }));
  svg.appendChild(el('line', { x1: apex[0], y1: apex[1], x2: tl[0], y2: tl[1], class: 'geo-segment geo-segment-dashed' }));

  // Height (dashed)
  const baseCx = (bl[0] + br[0] + tr[0] + tl[0]) / 4;
  const baseCy = (bl[1] + br[1] + tr[1] + tl[1]) / 4;
  svg.appendChild(el('line', { x1: apex[0], y1: apex[1], x2: baseCx, y2: baseCy, class: 'geo-segment geo-segment-dashed' }));
  svg.appendChild(el('circle', { cx: apex[0], cy: apex[1], r: 3, class: 'geo-point' }));

  addDimensionLabels(svg, cx, cy, bw / 2, hh, labels, 'pyramid');
}

function prism(svg, cx, cy, dim, labels) {
  const bw = 60, bd = 25, hh = 80;
  const top = cy - hh / 2;
  const bot = cy + hh / 2;

  // Front face
  const fbl = [cx - bw / 2, bot];
  const fbr = [cx + bw / 2, bot];
  const ftl = [cx - bw / 2, top];
  const ftr = [cx + bw / 2, top];

  // Back face (offset for depth)
  const bbl = [fbl[0] - bd, fbl[1] - bd];
  const bbr = [fbr[0] - bd, fbr[1] - bd];
  const btl = [ftl[0] - bd, ftl[1] - bd];
  const btr = [ftr[0] - bd, ftr[1] - bd];

  // Front
  svg.appendChild(el('line', { x1: fbl[0], y1: fbl[1], x2: fbr[0], y2: fbr[1], class: 'geo-segment' }));
  svg.appendChild(el('line', { x1: fbr[0], y1: fbr[1], x2: ftr[0], y2: ftr[1], class: 'geo-segment' }));
  svg.appendChild(el('line', { x1: ftr[0], y1: ftr[1], x2: ftl[0], y2: ftl[1], class: 'geo-segment' }));
  svg.appendChild(el('line', { x1: ftl[0], y1: ftl[1], x2: fbl[0], y2: fbl[1], class: 'geo-segment' }));

  // Connecting edges
  svg.appendChild(el('line', { x1: ftl[0], y1: ftl[1], x2: btl[0], y2: btl[1], class: 'geo-segment' }));
  svg.appendChild(el('line', { x1: ftr[0], y1: ftr[1], x2: btr[0], y2: btr[1], class: 'geo-segment' }));
  svg.appendChild(el('line', { x1: fbl[0], y1: fbl[1], x2: bbl[0], y2: bbl[1], class: 'geo-segment geo-segment-dashed' }));
  svg.appendChild(el('line', { x1: fbr[0], y1: fbr[1], x2: bbr[0], y2: bbr[1], class: 'geo-segment geo-segment-dashed' }));

  // Back
  svg.appendChild(el('line', { x1: btl[0], y1: btl[1], x2: btr[0], y2: btr[1], class: 'geo-segment' }));
  svg.appendChild(el('line', { x1: bbl[0], y1: bbl[1], x2: bbr[0], y2: bbr[1], class: 'geo-segment geo-segment-dashed' }));
  svg.appendChild(el('line', { x1: bbl[0], y1: bbl[1], x2: btl[0], y2: btl[1], class: 'geo-segment geo-segment-dashed' }));
  svg.appendChild(el('line', { x1: bbr[0], y1: bbr[1], x2: btr[0], y2: btr[1], class: 'geo-segment' }));

  addDimensionLabels(svg, cx, cy, bw / 2, hh, labels, 'prism');
}

function addDimensionLabels(svg, cx, cy, rr, hh, labels, shape) {
  if (!labels) return;

  if (labels.h) {
    const t = el('text', {
      x: cx + rr + 16, y: cy,
      class: 'geo-side-label', 'text-anchor': 'start', 'dominant-baseline': 'central',
    });
    t.textContent = labels.h;
    svg.appendChild(t);
  }

  if (labels.r) {
    const bot = cy + hh / 2;
    const t = el('text', {
      x: cx + rr / 2, y: bot + 24,
      class: 'geo-side-label', 'text-anchor': 'middle',
    });
    t.textContent = labels.r;
    svg.appendChild(t);

    // Radius line
    svg.appendChild(el('line', {
      x1: cx, y1: bot, x2: cx + rr, y2: bot,
      class: 'geo-segment geo-segment-highlight',
    }));
  }

  if (labels.a) {
    const bot = cy + hh / 2;
    const t = el('text', {
      x: cx, y: bot + 24,
      class: 'geo-side-label', 'text-anchor': 'middle',
    });
    t.textContent = labels.a;
    svg.appendChild(t);
  }
}
