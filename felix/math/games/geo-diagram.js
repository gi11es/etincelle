/**
 * Diagram dispatcher — routes diagram specs to the appropriate builder.
 */
import { drawRightTriangle } from './geo-diagrams/right-triangle.js';
import { drawParallelLines } from './geo-diagrams/parallel-lines.js';
import { drawThales } from './geo-diagrams/thales.js';
import { drawSymmetry } from './geo-diagrams/symmetry.js';
import { drawCoordinatePlane } from './geo-diagrams/coordinate-plane.js';
import { drawVolume } from './geo-diagrams/volumes.js';
import { drawGridPlace } from './geo-diagrams/grid-place.js';

const BUILDERS = {
  'right-triangle': drawRightTriangle,
  'parallel-lines': drawParallelLines,
  'thales': drawThales,
  'symmetry': drawSymmetry,
  'coordinate-plane': drawCoordinatePlane,
  'volume': drawVolume,
  'grid-place': drawGridPlace,
};

/**
 * Render a geometry diagram into the given container.
 * @param {HTMLElement} container - target DOM element
 * @param {object} diagram - diagram spec from JSON data
 * @returns {object|null} - the geo context, or null if diagram type unknown
 */
export function renderDiagram(container, diagram) {
  if (!diagram || !diagram.type) return null;
  const builder = BUILDERS[diagram.type];
  if (!builder) {
    console.warn('Unknown diagram type:', diagram.type);
    return null;
  }
  return builder(container, diagram);
}
