/**
 * Draws right triangles — used for Pythagore, Cosinus, Trigonométrie, Triangles.
 */
import { createGeoContext, computeBounds } from '../geo-renderer.js';

export function drawRightTriangle(container, diagram) {
  const { vertices, rightAngle, labels, highlightAngle, angleLabel } = diagram;

  const pts = Object.entries(vertices);
  const coords = pts.map(([, v]) => v);
  const bounds = computeBounds(coords, 1.5);
  const ctx = createGeoContext(container, bounds, { width: 280, height: 220 });

  // Centroid for label offset direction
  const centroid = [
    coords.reduce((s, c) => s + c[0], 0) / coords.length,
    coords.reduce((s, c) => s + c[1], 0) / coords.length,
  ];

  // Draw filled triangle
  ctx.polygon(coords, { class: 'geo-polygon-fill' });

  // Draw edges
  for (let i = 0; i < pts.length; i++) {
    const [n1, p1] = pts[i];
    const [n2, p2] = pts[(i + 1) % pts.length];
    const edgeName = n1 + n2;
    const edgeNameRev = n2 + n1;
    ctx.segment(p1[0], p1[1], p2[0], p2[1]);

    // Side label
    const labelText = labels?.[edgeName] || labels?.[edgeNameRev];
    if (labelText) {
      ctx.sideLabel(p1[0], p1[1], p2[0], p2[1], labelText, centroid);
    }
  }

  // Right angle mark
  if (rightAngle && vertices[rightAngle]) {
    const vNames = Object.keys(vertices);
    const others = vNames.filter(n => n !== rightAngle);
    const rv = vertices[rightAngle];
    const p1 = vertices[others[0]];
    const p2 = vertices[others[1]];
    ctx.rightAngleMark(rv[0], rv[1], p1[0], p1[1], p2[0], p2[1]);
  }

  // Highlight angle
  if (highlightAngle && vertices[highlightAngle]) {
    const vNames = Object.keys(vertices);
    const others = vNames.filter(n => n !== highlightAngle);
    const hv = vertices[highlightAngle];
    const p1 = vertices[others[0]];
    const p2 = vertices[others[1]];
    ctx.angleMark(hv[0], hv[1], p1[0], p1[1], p2[0], p2[1], {
      highlight: true,
      label: angleLabel || '',
      radius: 26,
    });
  }

  // Vertex labels
  for (const [name, [x, y]] of pts) {
    // Offset label away from centroid
    const dx = x - centroid[0];
    const dy = y - centroid[1];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    ctx.point(x, y, name, {
      labelDx: (dx / len) * 16,
      labelDy: (dy / len) * -16,
    });
  }

  // Interactive hit targets for geo-click questions
  if (diagram.targets) {
    for (const t of diagram.targets) {
      if (t.type === 'side') {
        // Target on a side midpoint
        const p1 = vertices[t.side[0]];
        const p2 = vertices[t.side[1]];
        if (p1 && p2) {
          ctx.hitTarget((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, t.name, { r: 24 });
        }
      } else if (t.type === 'vertex') {
        const v = vertices[t.vertex];
        if (v) ctx.hitTarget(v[0], v[1], t.name, { r: 24 });
      } else if (t.type === 'angle') {
        const v = vertices[t.vertex];
        if (v) ctx.hitTarget(v[0], v[1], t.name, { r: 24 });
      }
    }
  }

  return ctx;
}
