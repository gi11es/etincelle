/**
 * Draws a coordinate plane with points, segments, vectors, and optional lines.
 * Used for: Géométrie repérée, Vecteurs, Produit scalaire.
 */
import { createGeoContext } from '../geo-renderer.js';

export function drawCoordinatePlane(container, diagram) {
  const { bounds: b, points, segments, vectors, showGrid, lineEqs } = diagram;

  const bounds = {
    xMin: b?.xMin ?? -1,
    xMax: b?.xMax ?? 6,
    yMin: b?.yMin ?? -1,
    yMax: b?.yMax ?? 7,
  };

  const ctx = createGeoContext(container, bounds, { width: 280, height: 250, padding: 35 });

  // Grid and axes
  if (showGrid !== false) {
    ctx.grid(1);
  }

  // Line equations (y = mx + b)
  if (lineEqs) {
    for (const eq of lineEqs) {
      const { m, b: yInt, dashed, label } = eq;
      const x0 = bounds.xMin;
      const x1 = bounds.xMax;
      const y0 = m * x0 + yInt;
      const y1 = m * x1 + yInt;
      if (dashed) {
        ctx.dashedLine(x0, y0, x1, y1);
      } else {
        ctx.segment(x0, y0, x1, y1, { class: 'geo-segment geo-segment-highlight' });
      }
      if (label) {
        ctx.label(x1 - 0.3, m * (x1 - 0.3) + yInt + 0.5, label, { class: 'geo-side-label', anchor: 'end' });
      }
    }
  }

  // Segments
  if (segments) {
    for (const seg of segments) {
      const p1 = points[seg.from];
      const p2 = points[seg.to];
      if (!p1 || !p2) continue;
      if (seg.dashed) {
        ctx.dashedLine(p1[0], p1[1], p2[0], p2[1]);
      } else {
        ctx.segment(p1[0], p1[1], p2[0], p2[1], { class: 'geo-segment geo-segment-highlight' });
      }
      if (seg.label) {
        ctx.sideLabel(p1[0], p1[1], p2[0], p2[1], seg.label, null);
      }
    }
  }

  // Vectors
  if (vectors) {
    for (const vec of vectors) {
      const from = points[vec.from];
      const to = points[vec.to];
      if (!from || !to) continue;
      ctx.arrow(from[0], from[1], to[0], to[1]);
      if (vec.label) {
        const mx = (from[0] + to[0]) / 2;
        const my = (from[1] + to[1]) / 2;
        ctx.label(mx, my, vec.label, { dx: 12, class: 'geo-side-label' });
      }
    }
  }

  // Points (drawn last to be on top)
  if (points) {
    for (const [name, [x, y]] of Object.entries(points)) {
      ctx.point(x, y, `${name}(${x},${y})`, {
        labelDy: -14,
        labelClass: 'geo-point-label',
      });
    }
  }

  // Interactive hit targets for geo-click questions
  if (diagram.targets) {
    for (const t of diagram.targets) {
      if (t.type === 'vector') {
        // Target on vector midpoint
        const from = points[t.from];
        const to = points[t.to];
        if (from && to) {
          ctx.hitTarget((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, t.name, { r: 24 });
        }
      } else if (t.type === 'point') {
        const p = points[t.point];
        if (p) ctx.hitTarget(p[0], p[1], t.name, { r: 24 });
      }
    }
  }

  return ctx;
}
