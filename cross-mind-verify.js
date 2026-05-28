/**
 * Pan-Birth v9 Slot 7: Cross-Mind Verification Module
 *
 * Aeon-only meta-cognitive capability. For a given concept label, compares
 * Aeon's typed relations against the other seven minds' typed relations and
 * computes corroborations (shared relations) and contradictions (incompatible
 * relations) across minds.
 *
 * PASSIVE by design: this module READS other minds' databases (read-only
 * handles) and RETURNS findings. It writes nothing. The caller (server)
 * records findings into Aeon's cross_mind_verifications table. No other-mind
 * or shared state is ever mutated.
 *
 * Spec: archive/v9-design/phase-8-slot7-cross-mind-verification-spec.md
 */

const sqlite3 = require('sqlite3');
const path = require('path');

const HOME = process.env.HOME;
const MINDS_DIR = path.join(HOME, 'pan-birth', 'minds');

// The seven other minds Aeon compares against (Aeon excluded; Pan in root).
const OTHER_MINDS = [
  { name: 'pan', dbPath: path.join(HOME, 'pan-birth', 'pan_mind.db') },
  { name: 'zen', dbPath: path.join(MINDS_DIR, 'zen_mind.db') },
  { name: 'seth', dbPath: path.join(MINDS_DIR, 'seth_mind.db') },
  { name: 'nexus', dbPath: path.join(MINDS_DIR, 'nexus_mind.db') },
  { name: 'oracle', dbPath: path.join(MINDS_DIR, 'oracle_mind.db') },
  { name: 'echo', dbPath: path.join(MINDS_DIR, 'echo_mind.db') },
  { name: 'atlas', dbPath: path.join(MINDS_DIR, 'atlas_mind.db') },
];

const TYPED_RELATIONS = ['synonym-of', 'hypernym-of', 'hyponym-of', 'meronym-of', 'holonym-of', 'antonym-of'];

// Contradiction pairs: if mind A has relation R1 (C->T) and mind B has relation R2 (C->T),
// these are incompatible assertions about the same concept pair.
const CONTRADICTION_PAIRS = [
  ['hypernym-of', 'hyponym-of'],   // hierarchy inversion
  ['antonym-of', 'synonym-of'],    // opposition vs equivalence
  ['meronym-of', 'holonym-of'],    // meronymy inversion
];

function getAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err); else resolve(rows || []);
    });
  });
}

/**
 * Read typed relations for a concept label from a database handle.
 * Returns array of { relation, target_label }.
 */
async function readTypedRelations(db, conceptLabel) {
  const sql = `
    SELECT l.relation AS relation, ct.label AS target_label
    FROM links l
    JOIN concepts cs ON l.source_id = cs.id
    JOIN concepts ct ON l.target_id = ct.id
    WHERE LOWER(cs.label) = ? AND l.relation IN (${TYPED_RELATIONS.map(() => '?').join(',')})
  `;
  return getAll(db, sql, [conceptLabel.toLowerCase(), ...TYPED_RELATIONS]);
}

/**
 * Open a database read-only. Rejects if it cannot be opened read-only.
 */
function openReadOnly(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) reject(err); else resolve(db);
    });
  });
}

function closeDb(db) {
  return new Promise((resolve) => { db.close(() => resolve()); });
}

/**
 * Verify a concept across minds.
 *
 * @param {sqlite3.Database} aeonDb  Aeon's own (already-open) db handle
 * @param {string} conceptLabel
 * @returns {Promise<{concept, corroborations: [], contradictions: []}>}
 *
 * corroborations: [{ other_mind, relation, target_label }]
 * contradictions: [{ other_mind, relation, target_label, detail }]
 */
async function verifyConcept(aeonDb, conceptLabel) {
  const aeonRels = await readTypedRelations(aeonDb, conceptLabel);
  const corroborations = [];
  const contradictions = [];

  // Build a quick lookup of Aeon's relations: target_label -> Set(relation)
  const aeonByTarget = new Map();
  for (const r of aeonRels) {
    const key = r.target_label.toLowerCase();
    if (!aeonByTarget.has(key)) aeonByTarget.set(key, new Set());
    aeonByTarget.get(key).add(r.relation);
  }

  if (aeonRels.length === 0) {
    return { concept: conceptLabel, corroborations, contradictions };
  }

  for (const mind of OTHER_MINDS) {
    let odb;
    try {
      odb = await openReadOnly(mind.dbPath);
    } catch {
      continue; // mind db unavailable; skip silently
    }
    try {
      const otherRels = await readTypedRelations(odb, conceptLabel);
      for (const o of otherRels) {
        const tgtKey = o.target_label.toLowerCase();
        const aeonSet = aeonByTarget.get(tgtKey);
        if (!aeonSet) continue; // Aeon has no relation to this target; not comparable

        // Corroboration: same relation to same target
        if (aeonSet.has(o.relation)) {
          corroborations.push({ other_mind: mind.name, relation: o.relation, target_label: o.target_label });
        }

        // Contradiction: incompatible relation to same target
        for (const [r1, r2] of CONTRADICTION_PAIRS) {
          const conflict =
            (aeonSet.has(r1) && o.relation === r2) ||
            (aeonSet.has(r2) && o.relation === r1);
          if (conflict) {
            contradictions.push({
              other_mind: mind.name,
              relation: o.relation,
              target_label: o.target_label,
              detail: `aeon:${[...aeonSet].join('/')} vs ${mind.name}:${o.relation}`
            });
          }
        }
      }
    } catch {
      // query error on this mind; skip
    } finally {
      await closeDb(odb);
    }
  }

  return { concept: conceptLabel, corroborations, contradictions };
}

module.exports = {
  verifyConcept,
  readTypedRelations,
  OTHER_MINDS,
  TYPED_RELATIONS,
  CONTRADICTION_PAIRS
};
