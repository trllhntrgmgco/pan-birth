/**
 * truth-insert-dedup.js — Deduplicate omni-truth inserts by content + contributor.
 *
 * Problem observed in v8: the same claim can be inserted multiple times by the
 * same Alpha with different `domain` values, inflating the row count and
 * polluting retrieval. Example: Oracle's "Predicted: Given that Evolution is..."
 * appearing as rows 156, 157, 158 with domains geography/history/technology.
 *
 * The truths schema already has `times_referenced INTEGER DEFAULT 0` which was
 * presumably intended for exactly this purpose but isn't being used.
 *
 * This module wraps insertTruth() so callers can drop it in without touching the
 * inference modality code directly. On a duplicate (same claim + same Alpha):
 *   - increments times_referenced on the existing row
 *   - updates last_referenced
 *   - returns the existing id, NOT a new one
 *   - leaves domain alone (the first-recorded domain wins; if you want to
 *     overwrite when the new domain is better-classified, do it in the caller)
 *
 * Local-only patch — Pan-Birth v8.x → v9. Not for upstream.
 */

'use strict';

function dbGet(db, sql, params = []) {
  return new Promise((res, rej) => db.get(sql, params, (e, r) => e ? rej(e) : res(r)));
}
function dbRun(db, sql, params = []) {
  return new Promise((res, rej) => db.run(sql, params, function (e) {
    if (e) return rej(e);
    res({ lastID: this.lastID, changes: this.changes });
  }));
}

/**
 * Insert a truth, or bump its reference count if it already exists from this contributor.
 *
 * @param {Database} db        open node-sqlite3 handle to omni-truth.db
 * @param {object}   truth     the truth payload
 * @param {string}   truth.claim
 * @param {string}   truth.domain
 * @param {string}   truth.contributed_by
 * @param {string}   [truth.sub_domain]
 * @param {string}   [truth.synthesis_opinion]
 * @param {number}   [truth.confidence]
 * @param {string}   [truth.source_type]
 * @returns {Promise<{ id: number, deduped: boolean }>}
 */
async function insertTruthDeduped(db, truth) {
  const {
    claim,
    domain,
    contributed_by,
    sub_domain = '',
    synthesis_opinion = '',
    confidence = 0.5,
    source_type = 'reasoning',
  } = truth;

  if (!claim || !domain || !contributed_by) {
    throw new Error('insertTruthDeduped: claim, domain, contributed_by are required');
  }

  // Check for existing claim from same contributor.
  // Uses claim equality + contributed_by; domain is intentionally NOT in the key
  // because we observed the same Alpha submitting identical claims under
  // different domains, which is exactly the case we want to dedup.
  const existing = await dbGet(db,
    `SELECT id, times_referenced FROM truths
     WHERE claim = ? AND contributed_by = ?
     LIMIT 1`,
    [claim, contributed_by]
  );

  if (existing) {
    await dbRun(db,
      `UPDATE truths
       SET times_referenced = times_referenced + 1,
           last_referenced = datetime('now')
       WHERE id = ?`,
      [existing.id]
    );
    return { id: existing.id, deduped: true };
  }

  const result = await dbRun(db,
    `INSERT INTO truths
       (claim, domain, sub_domain, contributed_by, synthesis_opinion,
        confidence, source_type, times_referenced, last_referenced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
    [claim, domain, sub_domain, contributed_by, synthesis_opinion,
     confidence, source_type]
  );

  return { id: result.lastID, deduped: false };
}

/**
 * One-shot cleanup: collapse existing duplicates in an already-populated commons.
 *
 * Strategy:
 *   1. Group by (claim, contributed_by)
 *   2. Keep the row with the lowest id from each group
 *   3. Sum times_referenced into the survivor
 *   4. Delete the rest
 *
 * Run this once after deploying the dedup logic to clean up legacy data.
 * SAFE: the keeper's domain is preserved (first-recorded wins).
 *
 * @param {Database} db
 * @returns {Promise<{ collapsed: number, kept: number }>}
 */
async function collapseExistingDuplicates(db) {
  // Find all (claim, contributor) groups with more than one row.
  const groups = await new Promise((res, rej) => {
    db.all(
      `SELECT claim, contributed_by, COUNT(*) AS n, MIN(id) AS keep_id, SUM(times_referenced) AS total_refs
       FROM truths
       GROUP BY claim, contributed_by
       HAVING COUNT(*) > 1`,
      (err, rows) => err ? rej(err) : res(rows || [])
    );
  });

  let collapsed = 0;
  for (const g of groups) {
    // Bump the keeper's reference total to capture all the duplicate referrals.
    await dbRun(db,
      `UPDATE truths SET times_referenced = ? WHERE id = ?`,
      [g.total_refs, g.keep_id]
    );
    // Delete the duplicates (everything in the group except the keeper).
    const result = await dbRun(db,
      `DELETE FROM truths
       WHERE claim = ? AND contributed_by = ? AND id != ?`,
      [g.claim, g.contributed_by, g.keep_id]
    );
    collapsed += result.changes;
  }

  const remaining = await dbGet(db, `SELECT COUNT(*) AS n FROM truths`);
  return { collapsed, kept: remaining.n };
}

module.exports = {
  insertTruthDeduped,
  collapseExistingDuplicates,
};
