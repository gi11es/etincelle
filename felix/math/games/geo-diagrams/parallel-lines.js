/**
 * Draws parallel lines cut by a transversal — for Angles et parallélisme.
 */
import { createGeoContext } from '../geo-renderer.js';

export function drawParallelLines(container, diagram) {
  const { lines, transversal, angles, showParallelMarks } = diagram;

  const bounds = { xMin: -1, xMax: 9, yMin: -0.5, yMax: 8.5 };
  const ctx = createGeoContext(container, bounds, { width: 280, height: 220 });

  const y1 = lines[0].y;
  const y2 = lines[1].y;
  const slope = transversal?.slope || 0.8;

  // Draw parallel lines (extending beyond view)
  ctx.segment(0, y1, 8, y1);
  ctx.segment(0, y2, 8, y2);

  // Line labels
  if (lines[0].label) ctx.label(8.5, y1, lines[0].label, { anchor: 'start', class: 'geo-side-label' });
  if (lines[1].label) ctx.label(8.5, y2, lines[1].label, { anchor: 'start', class: 'geo-side-label' });

  // Transversal: passes through midpoint of both lines
  const midX = 4;
  const tX1 = midX - (y2 + 1) / slope;
  const tX2 = midX + (y2 + 1) / slope;
  const tY1 = -0.5;
  const tY2 = y2 + 1;
  ctx.segment(tX1, tY1, tX2, tY2, { class: 'geo-segment' });

  // Intersection points
  const ix1 = midX - (y2 - y1) / (2 * slope); // intersection with line 1
  const ix2 = midX + (y2 - y1) / (2 * slope); // intersection with line 2

  ctx.point(ix1, y1, '', { r: 3 });
  ctx.point(ix2, y2, '', { r: 3 });

  // Parallel marks (>> arrows)
  if (showParallelMarks) {
    ctx.parallelMarks(1.5, y1, 3.5, y1);
    ctx.parallelMarks(1.5, y2, 3.5, y2);
  }

  // Angle arcs
  if (angles) {
    for (const a of angles) {
      const isTop = a.at === 'top';
      const ix = isTop ? ix1 : ix2;
      const iy = isTop ? y1 : y2;

      // Reference points for the arc: along the line and along the transversal
      const lineEnd = a.side === 'right' ? [8, iy] : [0, iy];
      const transEnd = a.side === 'right'
        ? [ix + 1, iy + slope]
        : [ix - 1, iy - slope];

      ctx.angleMark(ix, iy, lineEnd[0], lineEnd[1], transEnd[0], transEnd[1], {
        highlight: a.highlight,
        label: a.value,
        radius: 20,
      });
    }
  }

  // Interactive hit targets for geo-click questions
  if (diagram.targets) {
    for (const t of diagram.targets) {
      const isTop = t.at === 'top';
      const ix = isTop ? ix1 : ix2;
      const iy = isTop ? y1 : y2;
      // Offset target slightly into the angle region
      const lineDir = t.side === 'right' ? 1 : -1;
      const transDir = t.side === 'right' ? 1 : -1;
      const tx = ix + lineDir * 0.6 + transDir * 0.3 / slope;
      const ty = iy + transDir * 0.3 * slope + 0.3;
      ctx.hitTarget(tx, ty, t.name, { r: 24 });
    }
  }

  return ctx;
}
