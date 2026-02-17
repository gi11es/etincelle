/**
 * Draws Thalès configurations — triangle cut by a parallel, or butterfly (papillon).
 */
import { createGeoContext, computeBounds } from '../geo-renderer.js';

export function drawThales(container, diagram) {
  if (diagram.config === 'butterfly') {
    return drawButterfly(container, diagram);
  }
  return drawTriangleCut(container, diagram);
}

function drawTriangleCut(container, diagram) {
  const { vertices, cuts, labels, showParallel } = diagram;
  const A = vertices.A, B = vertices.B, C = vertices.C;

  // Compute cut points
  const cutPoints = {};
  for (const [name, spec] of Object.entries(cuts || {})) {
    const from = vertices[spec.on[0]];
    const to = vertices[spec.on[1]];
    cutPoints[name] = [
      from[0] + (to[0] - from[0]) * spec.ratio,
      from[1] + (to[1] - from[1]) * spec.ratio,
    ];
  }

  const allPts = [...Object.values(vertices), ...Object.values(cutPoints)];
  const bounds = computeBounds(allPts, 1.5);
  const ctx = createGeoContext(container, bounds, { width: 280, height: 240 });

  const centroid = [
    (A[0] + B[0] + C[0]) / 3,
    (A[1] + B[1] + C[1]) / 3,
  ];

  // Draw main triangle
  ctx.polygon([A, B, C], { class: 'geo-polygon-fill' });
  ctx.segment(A[0], A[1], B[0], B[1]);
  ctx.segment(B[0], B[1], C[0], C[1]);
  ctx.segment(A[0], A[1], C[0], C[1]);

  // Draw cut line (MN) dashed if parallel indication
  const cutNames = Object.keys(cutPoints);
  if (cutNames.length >= 2) {
    const p1 = cutPoints[cutNames[0]];
    const p2 = cutPoints[cutNames[1]];
    ctx.dashedLine(p1[0], p1[1], p2[0], p2[1]);
  }

  // Parallel marks
  if (showParallel && showParallel.length >= 2) {
    const par1Pts = showParallel[0].split('').map(n => cutPoints[n] || vertices[n]);
    const par2Pts = showParallel[1].split('').map(n => cutPoints[n] || vertices[n]);
    if (par1Pts.length === 2 && par2Pts.length === 2) {
      ctx.parallelMarks(par1Pts[0][0], par1Pts[0][1], par1Pts[1][0], par1Pts[1][1]);
      ctx.parallelMarks(par2Pts[0][0], par2Pts[0][1], par2Pts[1][0], par2Pts[1][1]);
    }
  }

  // Labels on sides
  if (labels) {
    const allVerts = { ...vertices, ...cutPoints };
    for (const [side, text] of Object.entries(labels)) {
      const p1 = allVerts[side[0]];
      const p2 = allVerts[side[1]];
      if (p1 && p2) {
        ctx.sideLabel(p1[0], p1[1], p2[0], p2[1], text, centroid);
      }
    }
  }

  // Vertex labels
  for (const [name, [x, y]] of Object.entries(vertices)) {
    const dx = x - centroid[0];
    const dy = y - centroid[1];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    ctx.point(x, y, name, { labelDx: (dx / len) * 16, labelDy: (dy / len) * -16 });
  }

  // Cut point labels
  for (const [name, [x, y]] of Object.entries(cutPoints)) {
    ctx.point(x, y, name, { r: 3, labelDx: -14, labelDy: 0 });
  }

  // Interactive hit targets for geo-click questions
  if (diagram.targets) {
    const allVerts = { ...vertices, ...cutPoints };
    for (const t of diagram.targets) {
      const p1 = allVerts[t.side[0]];
      const p2 = allVerts[t.side[1]];
      if (p1 && p2) {
        ctx.hitTarget((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, t.name, { r: 24 });
      }
    }
  }

  return ctx;
}

function drawButterfly(container, diagram) {
  const { center, points, labels, showParallel } = diagram;
  const O = center;

  const allPts = [O, ...Object.values(points)];
  const bounds = computeBounds(allPts, 1.5);
  const ctx = createGeoContext(container, bounds, { width: 280, height: 240 });

  // Draw the two lines through O
  const ptNames = Object.keys(points);
  // Assume points are A, B, C, D where AB || CD
  const A = points[ptNames[0]], B = points[ptNames[1]];
  const C = points[ptNames[2]], D = points[ptNames[3]];

  ctx.segment(A[0], A[1], D[0], D[1], { class: 'geo-segment' });
  ctx.segment(B[0], B[1], C[0], C[1], { class: 'geo-segment' });
  ctx.segment(A[0], A[1], B[0], B[1], { class: 'geo-segment' });
  ctx.dashedLine(C[0], C[1], D[0], D[1]);

  // Parallel marks
  if (showParallel && showParallel.length >= 2) {
    for (const side of showParallel) {
      const p1 = points[side[0]];
      const p2 = points[side[1]];
      if (p1 && p2) ctx.parallelMarks(p1[0], p1[1], p2[0], p2[1]);
    }
  }

  // Labels
  if (labels) {
    const allVerts = { O, ...points };
    for (const [side, text] of Object.entries(labels)) {
      const p1 = allVerts[side[0]];
      const p2 = allVerts[side[1]];
      if (p1 && p2) {
        ctx.sideLabel(p1[0], p1[1], p2[0], p2[1], text, O);
      }
    }
  }

  // Point labels
  ctx.point(O[0], O[1], 'O', { labelDy: -14 });
  for (const [name, [x, y]] of Object.entries(points)) {
    const dx = x - O[0];
    const dy = y - O[1];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    ctx.point(x, y, name, { labelDx: (dx / len) * 16, labelDy: (dy / len) * -14 });
  }

  // Interactive hit targets for geo-click questions
  if (diagram.targets) {
    const allVerts = { O, ...points };
    for (const t of diagram.targets) {
      const p1 = allVerts[t.side[0]];
      const p2 = allVerts[t.side[1]];
      if (p1 && p2) {
        ctx.hitTarget((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, t.name, { r: 24 });
      }
    }
  }

  return ctx;
}
