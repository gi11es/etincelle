/**
 * Central registry: maps generator names to functions.
 * Each generator takes an item and returns { question, answer, explanation, hint?, choices?, diagram? }.
 */

const generators = {};

/** Register a generator function under a name */
export function register(name, fn) {
  generators[name] = fn;
}

/** Generate dynamic fields for an item. Returns merged item. */
export function generate(item) {
  if (!item.generator) return item;
  const fn = generators[item.generator];
  if (!fn) {
    console.warn('Unknown generator:', item.generator);
    return item;
  }
  try {
    const generated = fn(item);
    return { ...item, ...generated };
  } catch (e) {
    console.error('Generator error:', item.generator, e);
    return item;
  }
}

// --- Import all generator modules (side-effect: they call register()) ---
import './prio-ops.js';
import './relatifs.js';
import './fractions.js';
import './divisibilite.js';
import './proportionnalite.js';
import './puissances.js';
import './calcul-litteral.js';
import './pythagore.js';
import './trigo.js';
import './arithmetique.js';
import './identites.js';
import './equations.js';
import './thales-gen.js';
import './probas.js';
import './fonctions.js';
import './geo-repere.js';
import './stats.js';
import './second-degre.js';
import './suites.js';
import './derivation.js';
import './scalaire.js';
