/**
 * Core SVG geometry rendering engine.
 * Provides primitives for drawing geometric figures: points, segments, arcs,
 * labels, grids, arrows, angle marks, etc.
 * All coordinates are in "math space" (y-up) and mapped to SVG (y-down).
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) e.setAttribute(k, v);
  }
  return e;
}

/**
 * Create an SVG context for drawing geometry.
 * @param {HTMLElement} container - DOM element to append SVG to
 * @param {object} bounds - { xMin, xMax, yMin, yMax } in math coordinates
 * @param {object} opts - { width, height, padding }
 */
export function createGeoContext(container, bounds, opts = {}) {
  const width = opts.width || 300;
  const height = opts.height || 250;
  const padding = opts.padding || 30;

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    width: '100%',
    preserveAspectRatio: 'xMidYMid meet',
    class: 'geo-svg',
  });

  const { xMin, xMax, yMin, yMax } = bounds;
  const innerW = width - 2 * padding;
  const innerH = height - 2 * padding;

  // Uniform scaling to avoid distortion
  const scaleX = innerW / (xMax - xMin);
  const scaleY = innerH / (yMax - yMin);
  const scale = Math.min(scaleX, scaleY);
  const offsetX = padding + (innerW - scale * (xMax - xMin)) / 2;
  const offsetY = padding + (innerH - scale * (yMax - yMin)) / 2;

  function toSVG(mx, my) {
    return [
      offsetX + (mx - xMin) * scale,
      offsetY + (yMax - my) * scale, // flip Y
    ];
  }

  function fromSVG(sx, sy) {
    return [
      (sx - offsetX) / scale + xMin,
      yMax - (sy - offsetY) / scale,
    ];
  }

  const ctx = {
    svg,
    width,
    height,
    bounds,
    scale,
    toSVG,
    fromSVG,

    point(x, y, label, opts = {}) {
      const [sx, sy] = toSVG(x, y);
      const r = opts.r || 4;
      const dot = el('circle', {
        cx: sx, cy: sy, r,
        class: opts.class || 'geo-point',
      });
      svg.appendChild(dot);

      if (label) {
        // Auto-offset label away from center of figure
        const lx = opts.labelDx || 0;
        const ly = opts.labelDy || -12;
        const txt = el('text', {
          x: sx + lx, y: sy + ly,
          class: opts.labelClass || 'geo-point-label',
          'text-anchor': 'middle',
          'dominant-baseline': 'auto',
        });
        txt.textContent = label;
        svg.appendChild(txt);
      }
      return dot;
    },

    segment(x1, y1, x2, y2, opts = {}) {
      const [sx1, sy1] = toSVG(x1, y1);
      const [sx2, sy2] = toSVG(x2, y2);
      const line = el('line', {
        x1: sx1, y1: sy1, x2: sx2, y2: sy2,
        class: opts.class || 'geo-segment',
      });
      svg.appendChild(line);
      return line;
    },

    polygon(points, opts = {}) {
      const svgPts = points.map(([x, y]) => toSVG(x, y).join(',')).join(' ');
      const poly = el('polygon', {
        points: svgPts,
        class: opts.class || 'geo-polygon-fill',
      });
      svg.appendChild(poly);
      return poly;
    },

    sideLabel(x1, y1, x2, y2, text, centroid, opts = {}) {
      const [sx1, sy1] = toSVG(x1, y1);
      const [sx2, sy2] = toSVG(x2, y2);
      const midX = (sx1 + sx2) / 2;
      const midY = (sy1 + sy2) / 2;

      // Perpendicular offset away from centroid
      const dx = sx2 - sx1;
      const dy = sy2 - sy1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      let nx = -dy / len;
      let ny = dx / len;

      if (centroid) {
        const [cx, cy] = toSVG(centroid[0], centroid[1]);
        const toC = [cx - midX, cy - midY];
        if (nx * toC[0] + ny * toC[1] > 0) { nx = -nx; ny = -ny; }
      }

      const offset = opts.offset || 16;
      const txt = el('text', {
        x: midX + nx * offset,
        y: midY + ny * offset,
        class: text.includes('?') ? 'geo-side-label geo-side-label-unknown' : (opts.class || 'geo-side-label'),
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
      });
      txt.textContent = text;
      svg.appendChild(txt);
      return txt;
    },

    label(x, y, text, opts = {}) {
      const [sx, sy] = toSVG(x, y);
      const txt = el('text', {
        x: sx + (opts.dx || 0),
        y: sy + (opts.dy || 0),
        class: opts.class || 'geo-label',
        'text-anchor': opts.anchor || 'middle',
        'dominant-baseline': opts.baseline || 'central',
      });
      txt.textContent = text;
      svg.appendChild(txt);
      return txt;
    },

    rightAngleMark(vx, vy, p1x, p1y, p2x, p2y, size) {
      const s = size || 10;
      const [svx, svy] = toSVG(vx, vy);
      const [sp1x, sp1y] = toSVG(p1x, p1y);
      const [sp2x, sp2y] = toSVG(p2x, p2y);

      // Unit vectors along each edge from vertex
      const d1x = sp1x - svx, d1y = sp1y - svy;
      const len1 = Math.sqrt(d1x * d1x + d1y * d1y) || 1;
      const u1x = d1x / len1 * s, u1y = d1y / len1 * s;

      const d2x = sp2x - svx, d2y = sp2y - svy;
      const len2 = Math.sqrt(d2x * d2x + d2y * d2y) || 1;
      const u2x = d2x / len2 * s, u2y = d2y / len2 * s;

      const path = el('path', {
        d: `M${svx + u1x},${svy + u1y} L${svx + u1x + u2x},${svy + u1y + u2y} L${svx + u2x},${svy + u2y}`,
        class: 'geo-right-angle',
      });
      svg.appendChild(path);
      return path;
    },

    angleMark(vx, vy, p1x, p1y, p2x, p2y, opts = {}) {
      const [svx, svy] = toSVG(vx, vy);
      const [sp1x, sp1y] = toSVG(p1x, p1y);
      const [sp2x, sp2y] = toSVG(p2x, p2y);

      const a1 = Math.atan2(sp1y - svy, sp1x - svx);
      const a2 = Math.atan2(sp2y - svy, sp2x - svx);
      const r = opts.radius || 22;

      // Ensure we sweep the smaller arc
      let startAngle = a1, endAngle = a2;
      let diff = endAngle - startAngle;
      if (diff < -Math.PI) diff += 2 * Math.PI;
      if (diff > Math.PI) diff -= 2 * Math.PI;
      const sweep = diff > 0 ? 1 : 0;

      const sx = svx + r * Math.cos(startAngle);
      const sy = svy + r * Math.sin(startAngle);
      const ex = svx + r * Math.cos(endAngle);
      const ey = svy + r * Math.sin(endAngle);

      const arc = el('path', {
        d: `M${sx},${sy} A${r},${r} 0 0,${sweep} ${ex},${ey}`,
        class: opts.highlight ? 'geo-angle-arc geo-angle-arc-highlight' : 'geo-angle-arc',
      });
      svg.appendChild(arc);

      if (opts.label) {
        const midAngle = startAngle + diff / 2;
        const lr = r + 14;
        const lx = svx + lr * Math.cos(midAngle);
        const ly = svy + lr * Math.sin(midAngle);
        const txt = el('text', {
          x: lx, y: ly,
          class: 'geo-angle-label',
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
        });
        txt.textContent = opts.label;
        svg.appendChild(txt);
      }

      return arc;
    },

    arrow(x1, y1, x2, y2, opts = {}) {
      const [sx1, sy1] = toSVG(x1, y1);
      const [sx2, sy2] = toSVG(x2, y2);

      // Define arrowhead marker if not yet present
      let defs = svg.querySelector('defs');
      if (!defs) { defs = el('defs'); svg.insertBefore(defs, svg.firstChild); }

      const markerId = 'arrowhead';
      if (!defs.querySelector(`#${markerId}`)) {
        const marker = el('marker', {
          id: markerId, markerWidth: 10, markerHeight: 7,
          refX: 9, refY: 3.5, orient: 'auto',
        });
        const arrowPath = el('polygon', { points: '0 0, 10 3.5, 0 7', class: 'geo-arrow-fill' });
        marker.appendChild(arrowPath);
        defs.appendChild(marker);
      }

      const line = el('line', {
        x1: sx1, y1: sy1, x2: sx2, y2: sy2,
        class: opts.class || 'geo-vector-arrow',
        'marker-end': `url(#${markerId})`,
      });
      svg.appendChild(line);
      return line;
    },

    dashedLine(x1, y1, x2, y2, opts = {}) {
      const line = ctx.segment(x1, y1, x2, y2, { class: 'geo-segment geo-segment-dashed', ...opts });
      return line;
    },

    grid(step = 1) {
      const { xMin: x0, xMax: x1, yMin: y0, yMax: y1 } = bounds;

      // Vertical grid lines
      for (let x = Math.ceil(x0); x <= Math.floor(x1); x += step) {
        ctx.segment(x, y0, x, y1, { class: x === 0 ? 'geo-axis' : 'geo-grid-line' });
        if (x !== 0) {
          const [sx, sy] = toSVG(x, 0);
          const t = el('text', { x: sx, y: sy + 14, class: 'geo-axis-label', 'text-anchor': 'middle' });
          t.textContent = x;
          svg.appendChild(t);
        }
      }

      // Horizontal grid lines
      for (let y = Math.ceil(y0); y <= Math.floor(y1); y += step) {
        ctx.segment(x0, y, x1, y, { class: y === 0 ? 'geo-axis' : 'geo-grid-line' });
        if (y !== 0) {
          const [sx, sy] = toSVG(0, y);
          const t = el('text', { x: sx - 10, y: sy, class: 'geo-axis-label', 'text-anchor': 'end', 'dominant-baseline': 'central' });
          t.textContent = y;
          svg.appendChild(t);
        }
      }

      // Origin label
      const [ox, oy] = toSVG(0, 0);
      const o = el('text', { x: ox - 10, y: oy + 14, class: 'geo-axis-label', 'text-anchor': 'end' });
      o.textContent = 'O';
      svg.appendChild(o);
    },

    parallelMarks(x1, y1, x2, y2, count = 2) {
      const [sx1, sy1] = toSVG(x1, y1);
      const [sx2, sy2] = toSVG(x2, y2);
      const mx = (sx1 + sx2) / 2;
      const my = (sy1 + sy2) / 2;
      const dx = sx2 - sx1;
      const dy = sy2 - sy1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len, uy = dy / len;
      const px = -uy, py = ux; // perpendicular

      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * 5;
        const cx = mx + ux * offset;
        const cy = my + uy * offset;
        const mark = el('line', {
          x1: cx + px * 5, y1: cy + py * 5,
          x2: cx - px * 5, y2: cy - py * 5,
          class: 'geo-parallel-mark',
        });
        svg.appendChild(mark);
      }
    },

    // Invisible hit target for interactive exercises
    hitTarget(x, y, name, opts = {}) {
      const [sx, sy] = toSVG(x, y);
      const r = opts.r || 22;
      const target = el('circle', {
        cx: sx, cy: sy, r,
        class: 'geo-hit-target',
        'data-name': name,
      });
      svg.appendChild(target);
      return target;
    },
  };

  container.appendChild(svg);
  return ctx;
}

/**
 * Compute bounding box from a set of points with margin.
 */
export function computeBounds(points, margin = 1) {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  return {
    xMin: Math.min(...xs) - margin,
    xMax: Math.max(...xs) + margin,
    yMin: Math.min(...ys) - margin,
    yMax: Math.max(...ys) + margin,
  };
}
