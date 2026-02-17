/**
 * Draws a coordinate grid for geo-place questions.
 * Renders grid, axes, and pre-drawn labeled points.
 * Click handling is done by geo-interactive.js.
 */
import { createGeoContext } from '../geo-renderer.js';

export function drawGridPlace(container, diagram) {
  const b = diagram.bounds;
  const bounds = {
    xMin: b.xMin,
    xMax: b.xMax,
    yMin: b.yMin,
    yMax: b.yMax,
  };

  const ctx = createGeoContext(container, bounds, { width: 280, height: 280, padding: 35 });
  ctx.grid(1);

  // Draw pre-placed points
  if (diagram.points) {
    for (const [name, [x, y]] of Object.entries(diagram.points)) {
      const pointClass = diagram.pointStyles?.[name] || 'geo-point';
      ctx.point(x, y, name, {
        class: pointClass,
        labelDy: -14,
        labelClass: 'geo-point-label',
      });
    }
  }

  // Draw segments between points if specified
  if (diagram.segments) {
    for (const seg of diagram.segments) {
      const p1 = diagram.points[seg.from];
      const p2 = diagram.points[seg.to];
      if (p1 && p2) {
        if (seg.dashed) {
          ctx.dashedLine(p1[0], p1[1], p2[0], p2[1]);
        } else {
          ctx.segment(p1[0], p1[1], p2[0], p2[1]);
        }
      }
    }
  }

  // Draw vectors if specified
  if (diagram.vectors) {
    for (const vec of diagram.vectors) {
      const from = diagram.points[vec.from];
      const to = diagram.points[vec.to];
      if (from && to) {
        ctx.arrow(from[0], from[1], to[0], to[1]);
        if (vec.label) {
          const mx = (from[0] + to[0]) / 2;
          const my = (from[1] + to[1]) / 2;
          ctx.label(mx, my, vec.label, { dx: 12, class: 'geo-side-label' });
        }
      }
    }
  }

  return ctx;
}
