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
    const merged = { ...item, ...generated };
    if (item.diagram && !generated.diagram) {
      delete merged.diagram;
    }
    return merged;
  } catch (e) {
    console.error('Generator error:', item.generator, e);
    return item;
  }
}

