/**
 * Interactive exercise dispatcher: routes interactive item names to their renderers.
 * Each interactive exports: render(container, item) → Promise<{ correct, explanation }>
 */
import { render as angleMachine } from './interactives/angle-machine.js';
import { render as symmetryPainter } from './interactives/symmetry-painter.js';
import { render as pythagorasExplorer } from './interactives/pythagoras-explorer.js';
import { render as thalesSlider } from './interactives/thales-slider.js';

const INTERACTIVES = {
  'angle-machine': angleMachine,
  'symmetry-painter': symmetryPainter,
  'pythagoras-explorer': pythagorasExplorer,
  'thales-slider': thalesSlider,
};

/**
 * Render an interactive exercise.
 * @param {HTMLElement} container
 * @param {object} item - must have item.interactive naming the exercise
 * @returns {Promise<{correct: boolean, explanation: string}>}
 */
export function renderInteractive(container, item) {
  const renderer = INTERACTIVES[item.interactive];
  if (!renderer) {
    console.warn('Unknown interactive:', item.interactive);
    return Promise.resolve({ correct: false, explanation: 'Exercice interactif inconnu.' });
  }
  return renderer(container, item);
}
