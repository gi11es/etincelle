/**
 * Draws central symmetry — point, center, image point.
 */
import { createGeoContext, computeBounds } from '../geo-renderer.js';

export function drawSymmetry(container, diagram) {
  const { center, points, showImage, showSegment, showMidpoint } = diagram;

  // Compute image points (symmetric through center)
  const images = {};
  for (const [name, [x, y]] of Object.entries(points)) {
    images[name + "'"] = [2 * center[0] - x, 2 * center[1] - y];
  }

  const allPts = [center, ...Object.values(points), ...Object.values(images)];
  const bounds = computeBounds(allPts, 2);
  const ctx = createGeoContext(container, bounds, { width: 280, height: 220 });

  // Draw segment from point to image through center
  for (const [name, [x, y]] of Object.entries(points)) {
    const img = images[name + "'"];
    if (showSegment) {
      ctx.dashedLine(x, y, img[0], img[1]);
    }

    // Original point
    ctx.point(x, y, name, { class: 'geo-point', labelDy: -14 });

    // Image point
    if (showImage) {
      ctx.point(img[0], img[1], name + "'", {
        class: 'geo-point geo-point-image',
        labelDy: -14,
      });
    }
  }

  // Center point (drawn last to be on top)
  ctx.point(center[0], center[1], 'O', {
    class: 'geo-point geo-point-center',
    r: 5,
    labelDy: 14,
  });

  // Midpoint tick marks on the segment
  if (showMidpoint) {
    for (const [name, [x, y]] of Object.entries(points)) {
      const img = images[name + "'"];
      const mx = (x + img[0]) / 2;
      const my = (y + img[1]) / 2;
      // Small cross at midpoint (which is the center)
      const dx = img[0] - x;
      const dy = img[1] - y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const px = -dy / len * 0.3;
      const py = dx / len * 0.3;
      ctx.segment(mx - px, my - py, mx + px, my + py, { class: 'geo-parallel-mark' });
    }
  }

  return ctx;
}
