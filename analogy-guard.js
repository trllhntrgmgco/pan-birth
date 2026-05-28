/**
 * analogy-guard.js — Reject degenerate analogies before they enter omni-truth.
 *
 * Problem observed in v8: Zen's "general principle" inference modality occasionally
 * emits truths of the form:
 *   "Both 'cross, domain, analogy' and 'cross, domain, analogy' should..."
 * where the two analogized concept-tuples are identical or trivially equivalent.
 * Self-analogies have no informational content — they're noise in the commons.
 *
 * This module provides isValidAnalogy() to gate analogy generation, and
 * normalizeConceptTuple() so callers can use it for their own dedup needs.
 *
 * Local-only patch — Pan-Birth v8.x → v9. Not for upstream.
 */

'use strict';

/**
 * Normalize a concept-tuple to a canonical form for equality comparison.
 *
 * Accepts either:
 *   - a string like "evolution, change, heritable"
 *   - an array of strings like ["evolution", "change", "heritable"]
 *
 * Returns: a sorted, lowercased, trimmed comma-joined string.
 *
 * Sort matters because Zen treats {A, B, C} as a set, not a sequence —
 * "evolution, change, heritable" and "heritable, change, evolution"
 * represent the same concept tuple and shouldn't be analogized to each other.
 */
function normalizeConceptTuple(tuple) {
  let parts;
  if (Array.isArray(tuple)) {
    parts = tuple;
  } else if (typeof tuple === 'string') {
    parts = tuple.split(',');
  } else {
    return ''; // unknown shape, treat as empty so equality fires safely
  }

  return parts
    .map(p => String(p).trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(',');
}

/**
 * Should this analogy be allowed into the commons?
 *
 * Rejects:
 *   - identical tuples (self-analogy)
 *   - tuples that overlap by more than `maxOverlapRatio` (default 0.7) — analogizing
 *     "evolution, change, heritable" to "evolution, change, mutation" is mostly
 *     redundant; Zen should be reaching for further-apart concepts.
 *   - empty or single-token tuples (not enough structure to compare)
 *
 * @param {string|string[]} tupleA
 * @param {string|string[]} tupleB
 * @param {object} [opts]
 * @param {number} [opts.maxOverlapRatio=0.7]
 * @returns {{ valid: boolean, reason?: string }}
 */
function isValidAnalogy(tupleA, tupleB, opts = {}) {
  const maxOverlapRatio = opts.maxOverlapRatio ?? 0.7;

  const a = normalizeConceptTuple(tupleA);
  const b = normalizeConceptTuple(tupleB);

  if (!a || !b) {
    return { valid: false, reason: 'empty_tuple' };
  }

  if (a === b) {
    return { valid: false, reason: 'self_analogy' };
  }

  const setA = new Set(a.split(','));
  const setB = new Set(b.split(','));

  if (setA.size < 2 || setB.size < 2) {
    return { valid: false, reason: 'tuple_too_small' };
  }

  // Jaccard-style overlap on the smaller set
  const intersection = [...setA].filter(t => setB.has(t)).length;
  const smaller = Math.min(setA.size, setB.size);
  const overlap = intersection / smaller;

  if (overlap > maxOverlapRatio) {
    return { valid: false, reason: `overlap_${overlap.toFixed(2)}_exceeds_${maxOverlapRatio}` };
  }

  return { valid: true };
}

/**
 * Convenience wrapper for use inside Zen's think() pipeline.
 * Logs the rejection reason and returns null for the caller to short-circuit.
 *
 * Usage:
 *   const analogy = guardedAnalogy(conceptA, conceptB, 'zen');
 *   if (!analogy) return; // skip insert
 */
function guardedAnalogy(tupleA, tupleB, alphaName = 'unknown') {
  const result = isValidAnalogy(tupleA, tupleB);
  if (!result.valid) {
    console.log(`[analogy-guard:${alphaName}] rejected (${result.reason}): ` +
                `${normalizeConceptTuple(tupleA)} <-> ${normalizeConceptTuple(tupleB)}`);
    return null;
  }
  return { tupleA, tupleB };
}

module.exports = {
  isValidAnalogy,
  normalizeConceptTuple,
  guardedAnalogy,
};
