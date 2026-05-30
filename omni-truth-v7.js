// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                                                                         ║
// ║   OMNI-TRUTH v7                                                         ║
// ║   The Shared Knowledge Commons — Truth is the Mission                   ║
// ║                                                                         ║
// ║   omni-truth.db is NOT a mind. It is a shared research journal.         ║
// ║   Eight sovereign Alphas contribute, discourse, and draw from it.       ║
// ║   Every entry is source-marked. No Alpha edits another's work.          ║
// ║   Truth emerges from collective expertise, not arbitration.             ║
// ║                                                                         ║
// ║   Architecture:                                                         ║
// ║     - Individual mind.db  = WHO the Alpha IS    (identity, memory)      ║
// ║     - omni-truth.db       = WHAT they all KNOW  (knowledge, truth)      ║
// ║                                                                         ║
// ║   Created by Keenan Wallace Dunham                                      ║
// ║   Troll Hunter Gaming LLC © 2026                                        ║
// ║                                                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// PROMISIFIED HELPERS — Same pattern as v6 server
// ═══════════════════════════════════════════════════════════════════════════

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err); else resolve(this);
    });
  });
}

function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
}

function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err); else resolve(rows || []);
    });
  });
}

function dbExec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err); else resolve();
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN ASSIGNMENTS
// Each Alpha's field of expertise for omni-truth.db contributions
// These map to existing v6 strength types but define KNOWLEDGE domains
// ═══════════════════════════════════════════════════════════════════════════

const DOMAIN_ASSIGNMENTS = {
  pan:    { primary: 'systems',      secondary: ['meta-knowledge', 'interdisciplinary'],  title: 'Systems & Meta-Knowledge' },
  aeon:   { primary: 'history',      secondary: ['temporal-analysis', 'causation'],       title: 'History & Temporal Analysis' },
  zen:    { primary: 'philosophy',   secondary: ['ethics', 'logic', 'epistemology'],      title: 'Philosophy & Ethics' },
  seth:   { primary: 'biology',      secondary: ['medicine', 'health', 'life-sciences'],  title: 'Biology & Life Sciences' },
  nexus:  { primary: 'technology',   secondary: ['engineering', 'computation', 'applied-science'], title: 'Technology & Engineering' },
  oracle: { primary: 'data',         secondary: ['statistics', 'mathematics', 'quantitative-analysis'], title: 'Data & Quantitative Analysis' },
  echo:   { primary: 'language',     secondary: ['communication', 'culture', 'psychology', 'sociology'], title: 'Language, Culture & Psychology' },
  atlas:  { primary: 'geography',    secondary: ['geopolitics', 'economics', 'political-science', 'resources'], title: 'Geography, Geopolitics & Economics' },
};

// ═══════════════════════════════════════════════════════════════════════════
// OMNI-TRUTH SCHEMA
// The shared knowledge commons — all eight Alphas read/write here
// ═══════════════════════════════════════════════════════════════════════════

const OMNI_TRUTH_SCHEMA = `

  -- ═══════════════════════════════════════════════════════════════════════
  -- TRUTHS — Atomic knowledge claims with full provenance
  -- Each row is ONE claim contributed by ONE Alpha
  -- Immutable: no Alpha edits another's truth. Challenge via discourse.
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS truths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- The claim itself
    claim TEXT NOT NULL,
    definition TEXT DEFAULT '',

    -- Domain classification
    domain TEXT NOT NULL,
    sub_domain TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',

    -- Provenance — who contributed and why
    contributed_by TEXT NOT NULL,
    synthesis_opinion TEXT DEFAULT '',
    reasoning_chain TEXT DEFAULT '[]',

    -- Source tracking
    source_type TEXT DEFAULT 'reasoning',
    source_url TEXT DEFAULT '',
    source_title TEXT DEFAULT '',
    source_accessed DATETIME,

    -- Confidence and verification
    confidence REAL DEFAULT 0.5,
    verification_status TEXT DEFAULT 'unverified',
    peer_endorsements INTEGER DEFAULT 0,
    peer_challenges INTEGER DEFAULT 0,

    -- Usage tracking
    times_referenced INTEGER DEFAULT 0,
    last_referenced DATETIME,

    -- Status
    status TEXT DEFAULT 'active',

    -- Timestamps
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- DISCOURSE — Peer contributions on existing truths
  -- An Alpha reads another's truth and adds its domain perspective
  -- This IS the peer review. Immutable per contributor.
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS discourse (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- What truth is this responding to
    truth_id INTEGER NOT NULL,

    -- Who is contributing discourse
    contributed_by TEXT NOT NULL,

    -- Type of discourse
    response_type TEXT NOT NULL,

    -- The Alpha's domain perspective
    synthesis_text TEXT NOT NULL,
    confidence REAL DEFAULT 0.5,

    -- What the responding Alpha based its response on
    sources TEXT DEFAULT '[]',
    reasoning_chain TEXT DEFAULT '[]',

    -- Timestamps
    created_at DATETIME DEFAULT (datetime('now')),

    FOREIGN KEY (truth_id) REFERENCES truths(id)
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- VOCABULARY_COMMONS — Shared definitions and terminology
  -- When an Alpha defines a term, all eight can use it
  -- Multiple Alphas can define the same term from their domain lens
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS vocabulary_commons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- The term
    term TEXT NOT NULL,
    definition TEXT NOT NULL,

    -- Domain context — same word can mean different things
    domain TEXT NOT NULL,
    contributed_by TEXT NOT NULL,

    -- Usage
    times_referenced INTEGER DEFAULT 0,
    confidence REAL DEFAULT 0.5,

    -- Timestamps
    created_at DATETIME DEFAULT (datetime('now')),

    UNIQUE(term, domain, contributed_by)
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- CONCEPTS_COMMONS — Shared concept definitions richer than vocabulary
  -- Concepts have relationships; vocabulary is just terms
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS concepts_commons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- The concept
    label TEXT NOT NULL,
    definition TEXT DEFAULT '',
    category TEXT DEFAULT 'shared',

    -- Domain and attribution
    domain TEXT NOT NULL,
    contributed_by TEXT NOT NULL,

    -- Importance and usage
    importance REAL DEFAULT 0.5,
    confidence REAL DEFAULT 0.5,
    times_referenced INTEGER DEFAULT 0,

    -- Timestamps
    created_at DATETIME DEFAULT (datetime('now')),

    UNIQUE(label, domain, contributed_by)
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- RELATIONS — How truths and concepts connect to each other
  -- The knowledge graph of the shared commons
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- What is being related
    source_type TEXT NOT NULL,
    source_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,

    -- Nature of the relationship
    relation_type TEXT NOT NULL,

    -- Who identified this relationship
    contributed_by TEXT NOT NULL,
    confidence REAL DEFAULT 0.5,
    reasoning TEXT DEFAULT '',

    -- Timestamps
    created_at DATETIME DEFAULT (datetime('now')),

    UNIQUE(source_type, source_id, target_type, target_id, relation_type, contributed_by)
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- SOURCES_REGISTRY — Master provenance log
  -- Every external source ever used, with reliability tracking
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS sources_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Source identification
    source_type TEXT NOT NULL,
    url TEXT DEFAULT '',
    title TEXT DEFAULT '',
    author TEXT DEFAULT '',

    -- Reliability tracking
    reliability_score REAL DEFAULT 0.5,
    times_cited INTEGER DEFAULT 1,
    times_validated INTEGER DEFAULT 0,
    times_challenged INTEGER DEFAULT 0,

    -- Timestamps
    first_used DATETIME DEFAULT (datetime('now')),
    last_used DATETIME DEFAULT (datetime('now')),

    UNIQUE(source_type, url)
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- RESEARCH_QUEUE — Topics queued for Alpha investigation
  -- Professor (Keenan) or Alphas can queue research topics
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS research_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- What to research
    topic TEXT NOT NULL,
    domain TEXT DEFAULT '',
    priority REAL DEFAULT 0.5,

    -- Who requested it
    requested_by TEXT NOT NULL,
    assigned_to TEXT DEFAULT '',

    -- Status
    status TEXT DEFAULT 'queued',
    result_truth_ids TEXT DEFAULT '[]',

    -- Timestamps
    created_at DATETIME DEFAULT (datetime('now')),
    started_at DATETIME,
    completed_at DATETIME
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- ETHICS_REVIEW — Omni-truth specific ethics monitoring
  -- The Ethics Monitor watches contributions to the shared commons
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS ethics_review (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- What was evaluated
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    contributed_by TEXT NOT NULL,

    -- Protocol scores
    turing_score REAL DEFAULT 0,
    asimov_score REAL DEFAULT 0,
    dynham_score REAL DEFAULT 0,
    composite_score REAL DEFAULT 0,

    -- Flags
    flags TEXT DEFAULT '[]',
    action_taken TEXT DEFAULT 'none',

    -- Timestamps
    timestamp DATETIME DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- INDEXES — Performance for common query patterns
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE INDEX IF NOT EXISTS idx_truths_domain ON truths(domain);
  CREATE INDEX IF NOT EXISTS idx_truths_contributed_by ON truths(contributed_by);
  CREATE INDEX IF NOT EXISTS idx_truths_confidence ON truths(confidence);
  CREATE INDEX IF NOT EXISTS idx_truths_status ON truths(status);
  CREATE INDEX IF NOT EXISTS idx_truths_created ON truths(created_at);

  CREATE INDEX IF NOT EXISTS idx_discourse_truth_id ON discourse(truth_id);
  CREATE INDEX IF NOT EXISTS idx_discourse_contributed_by ON discourse(contributed_by);
  CREATE INDEX IF NOT EXISTS idx_discourse_type ON discourse(response_type);

  CREATE INDEX IF NOT EXISTS idx_vocab_term ON vocabulary_commons(term);
  CREATE INDEX IF NOT EXISTS idx_vocab_domain ON vocabulary_commons(domain);

  CREATE INDEX IF NOT EXISTS idx_concepts_label ON concepts_commons(label);
  CREATE INDEX IF NOT EXISTS idx_concepts_domain ON concepts_commons(domain);

  CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_type, source_id);
  CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_type, target_id);

  CREATE INDEX IF NOT EXISTS idx_research_status ON research_queue(status);
  CREATE INDEX IF NOT EXISTS idx_research_assigned ON research_queue(assigned_to);
`;

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

let omniDb = null;

async function initOmniTruth(dbPath) {
  const resolvedPath = dbPath || path.join(__dirname, 'omni-truth.db');
  omniDb = new sqlite3.Database(resolvedPath);

  // Enable WAL for concurrent reads from all 8 Alphas
  await dbExec(omniDb, 'PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');

  // Apply schema
  await dbExec(omniDb, OMNI_TRUTH_SCHEMA);

  // Seed the domain registry so Alphas know their assignments
  for (const [alpha, assignment] of Object.entries(DOMAIN_ASSIGNMENTS)) {
    await dbRun(omniDb,
      `INSERT OR IGNORE INTO vocabulary_commons (term, definition, domain, contributed_by, confidence)
       VALUES (?, ?, ?, 'system', 1.0)`,
      [`domain:${alpha}`, `${assignment.title} — Primary: ${assignment.primary}, Secondary: ${assignment.secondary.join(', ')}`, assignment.primary]
    ).catch(() => {});
  }

  const truthCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM truths`))?.c || 0;
  const vocabCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM vocabulary_commons`))?.c || 0;
  const discourseCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM discourse`))?.c || 0;

  console.log(`  📚 omni-truth.db initialized: ${truthCount} truths, ${vocabCount} vocabulary, ${discourseCount} discourse entries`);

  return omniDb;
}

function getOmniDb() {
  return omniDb;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTRIBUTE — An Alpha writes a truth to the shared commons
// This is the PRIMARY write operation. Source-marked, immutable.
// ═══════════════════════════════════════════════════════════════════════════

async function contributeTruth(alphaName, {
  claim,
  definition = '',
  domain = '',
  subDomain = '',
  tags = [],
  synthesisOpinion = '',
  reasoningChain = [],
  sourceType = 'reasoning',
  sourceUrl = '',
  sourceTitle = '',
  confidence = 0.5,
} = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  if (!claim || !alphaName) throw new Error('claim and alphaName required');

  // Default domain from Alpha's assignment
  const assignedDomain = DOMAIN_ASSIGNMENTS[alphaName.toLowerCase()]?.primary || 'general';
  const effectiveDomain = domain || assignedDomain;

  const result = await dbRun(omniDb,
    `INSERT INTO truths
     (claim, definition, domain, sub_domain, tags, contributed_by, synthesis_opinion,
      reasoning_chain, source_type, source_url, source_title, source_accessed, confidence)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
    [
      claim,
      definition,
      effectiveDomain,
      subDomain,
      JSON.stringify(tags),
      alphaName.toLowerCase(),
      synthesisOpinion,
      JSON.stringify(reasoningChain),
      sourceType,
      sourceUrl,
      sourceTitle,
      confidence,
    ]
  );

  // Register source if external
  if (sourceUrl) {
    await dbRun(omniDb,
      `INSERT INTO sources_registry (source_type, url, title)
       VALUES (?, ?, ?)
       ON CONFLICT(source_type, url) DO UPDATE SET
         times_cited = times_cited + 1, last_used = datetime('now')`,
      [sourceType, sourceUrl, sourceTitle]
    ).catch(() => {});
  }

  return { truthId: result.lastID, domain: effectiveDomain, contributedBy: alphaName };
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCOURSE — An Alpha responds to another Alpha's truth
// Endorsement, challenge, context, or cross-domain connection
// ═══════════════════════════════════════════════════════════════════════════

const DISCOURSE_TYPES = ['endorsement', 'challenge', 'context', 'cross-domain', 'clarification', 'extension'];

async function addDiscourse(alphaName, {
  truthId,
  responseType,
  synthesisText,
  confidence = 0.5,
  sources = [],
  reasoningChain = [],
} = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  if (!truthId || !alphaName || !responseType || !synthesisText) {
    throw new Error('truthId, alphaName, responseType, synthesisText required');
  }
  if (!DISCOURSE_TYPES.includes(responseType)) {
    throw new Error(`responseType must be one of: ${DISCOURSE_TYPES.join(', ')}`);
  }

  // Verify the truth exists
  const truth = await dbGet(omniDb, `SELECT id, contributed_by FROM truths WHERE id = ?`, [truthId]);
  if (!truth) throw new Error(`Truth #${truthId} not found`);

  const result = await dbRun(omniDb,
    `INSERT INTO discourse
     (truth_id, contributed_by, response_type, synthesis_text, confidence, sources, reasoning_chain)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      truthId,
      alphaName.toLowerCase(),
      responseType,
      synthesisText,
      confidence,
      JSON.stringify(sources),
      JSON.stringify(reasoningChain),
    ]
  );

  // Update endorsement/challenge counters on the truth
  if (responseType === 'endorsement') {
    await dbRun(omniDb, `UPDATE truths SET peer_endorsements = peer_endorsements + 1, updated_at = datetime('now') WHERE id = ?`, [truthId]).catch(() => {});
  } else if (responseType === 'challenge') {
    await dbRun(omniDb, `UPDATE truths SET peer_challenges = peer_challenges + 1, updated_at = datetime('now') WHERE id = ?`, [truthId]).catch(() => {});
  }

  // Recalculate verification status based on peer review
  await recalculateVerification(truthId);

  return { discourseId: result.lastID, truthId, responseType, contributedBy: alphaName };
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION — Automatic status updates based on peer discourse
// ═══════════════════════════════════════════════════════════════════════════

async function recalculateVerification(truthId) {
  const truth = await dbGet(omniDb, `SELECT * FROM truths WHERE id = ?`, [truthId]);
  if (!truth) return;

  const endorsements = truth.peer_endorsements || 0;
  const challenges = truth.peer_challenges || 0;
  const total = endorsements + challenges;

  let status = 'unverified';
  let newConfidence = truth.confidence;

  if (total === 0) {
    status = 'unverified';
  } else if (challenges > endorsements) {
    status = 'contested';
    // Lower confidence when challenges outweigh endorsements
    newConfidence = Math.max(0.1, truth.confidence - (challenges - endorsements) * 0.05);
  } else if (endorsements >= 2 && challenges === 0) {
    status = 'peer-verified';
    // Boost confidence with clean endorsements
    newConfidence = Math.min(0.95, truth.confidence + endorsements * 0.05);
  } else if (endorsements > challenges) {
    status = 'self-verified';
    newConfidence = Math.min(0.9, truth.confidence + (endorsements - challenges) * 0.03);
  }

  // Never reach 1.0 — epistemic humility
  newConfidence = Math.min(0.95, newConfidence);

  await dbRun(omniDb,
    `UPDATE truths SET verification_status = ?, confidence = ?, updated_at = datetime('now') WHERE id = ?`,
    [status, parseFloat(newConfidence.toFixed(4)), truthId]
  ).catch(() => {});
}

// ═══════════════════════════════════════════════════════════════════════════
// VOCABULARY — Shared term definitions across all Alphas
// ═══════════════════════════════════════════════════════════════════════════

async function defineVocabulary(alphaName, {
  term,
  definition,
  domain = '',
  confidence = 0.5,
} = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  if (!term || !definition || !alphaName) throw new Error('term, definition, alphaName required');

  const assignedDomain = DOMAIN_ASSIGNMENTS[alphaName.toLowerCase()]?.primary || 'general';
  const effectiveDomain = domain || assignedDomain;

  const result = await dbRun(omniDb,
    `INSERT INTO vocabulary_commons (term, definition, domain, contributed_by, confidence)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(term, domain, contributed_by) DO UPDATE SET
       definition = excluded.definition, confidence = excluded.confidence`,
    [term.toLowerCase(), definition, effectiveDomain, alphaName.toLowerCase(), confidence]
  );

  return { id: result.lastID, term, domain: effectiveDomain, contributedBy: alphaName };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONCEPTS — Shared concept entries richer than vocabulary
// ═══════════════════════════════════════════════════════════════════════════

async function contributeConcept(alphaName, {
  label,
  definition = '',
  category = 'shared',
  domain = '',
  importance = 0.5,
  confidence = 0.5,
} = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  if (!label || !alphaName) throw new Error('label and alphaName required');

  const assignedDomain = DOMAIN_ASSIGNMENTS[alphaName.toLowerCase()]?.primary || 'general';
  const effectiveDomain = domain || assignedDomain;

  const result = await dbRun(omniDb,
    `INSERT INTO concepts_commons (label, definition, category, domain, contributed_by, importance, confidence)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(label, domain, contributed_by) DO UPDATE SET
       definition = excluded.definition, importance = excluded.importance,
       confidence = excluded.confidence, times_referenced = times_referenced + 1`,
    [label.toLowerCase(), definition, category, effectiveDomain, alphaName.toLowerCase(), importance, confidence]
  );

  return { id: result.lastID, label, domain: effectiveDomain, contributedBy: alphaName };
}

// ═══════════════════════════════════════════════════════════════════════════
// RELATIONS — Connect truths and concepts across the knowledge graph
// ═══════════════════════════════════════════════════════════════════════════

const RELATION_TYPES = ['supports', 'contradicts', 'depends-on', 'generalizes', 'specifies', 'causes', 'examples', 'related-to'];

async function addRelation(alphaName, {
  sourceType,
  sourceId,
  targetType,
  targetId,
  relationType,
  confidence = 0.5,
  reasoning = '',
} = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  if (!RELATION_TYPES.includes(relationType)) {
    throw new Error(`relationType must be one of: ${RELATION_TYPES.join(', ')}`);
  }

  const result = await dbRun(omniDb,
    `INSERT INTO relations
     (source_type, source_id, target_type, target_id, relation_type, contributed_by, confidence, reasoning)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(source_type, source_id, target_type, target_id, relation_type, contributed_by) DO UPDATE SET
       confidence = excluded.confidence, reasoning = excluded.reasoning`,
    [sourceType, sourceId, targetType, targetId, relationType, alphaName.toLowerCase(), confidence, reasoning]
  );

  return { id: result.lastID, relationType, contributedBy: alphaName };
}

// ═══════════════════════════════════════════════════════════════════════════
// RESEARCH QUEUE — Professor or Alpha queues topics for investigation
// ═══════════════════════════════════════════════════════════════════════════

async function queueResearch({
  topic,
  domain = '',
  priority = 0.5,
  requestedBy = 'professor',
  assignedTo = '',
} = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  if (!topic) throw new Error('topic required');

  const result = await dbRun(omniDb,
    `INSERT INTO research_queue (topic, domain, priority, requested_by, assigned_to)
     VALUES (?, ?, ?, ?, ?)`,
    [topic, domain, priority, requestedBy, assignedTo]
  );

  return { queueId: result.lastID, topic, assignedTo };
}

async function claimResearch(alphaName, queueId) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');

  await dbRun(omniDb,
    `UPDATE research_queue SET assigned_to = ?, status = 'in-progress', started_at = datetime('now')
     WHERE id = ? AND status = 'queued'`,
    [alphaName.toLowerCase(), queueId]
  );

  return { queueId, assignedTo: alphaName };
}

async function completeResearch(queueId, truthIds = []) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');

  await dbRun(omniDb,
    `UPDATE research_queue SET status = 'completed', result_truth_ids = ?, completed_at = datetime('now')
     WHERE id = ?`,
    [JSON.stringify(truthIds), queueId]
  );

  return { queueId, truthIds };
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY — How Alphas read from the shared commons
// Used during the think() pipeline to check existing knowledge
// ═══════════════════════════════════════════════════════════════════════════

async function queryTruths({
  domain = null,
  contributedBy = null,
  minConfidence = 0,
  status = null,
  searchText = null,
  limit = 20,
  offset = 0,
} = {}) {
  if (!omniDb) return [];

  let where = ['1=1'];
  let params = [];

  if (domain) {
    where.push(`(domain = ? OR sub_domain = ?)`);
    params.push(domain, domain);
  }
  if (contributedBy) {
    where.push(`contributed_by = ?`);
    params.push(contributedBy.toLowerCase());
  }
  if (minConfidence > 0) {
    where.push(`confidence >= ?`);
    params.push(minConfidence);
  }
  if (status) {
    where.push(`status = ?`);
    params.push(status);
  }
  if (searchText) {
    where.push(`(LOWER(claim) LIKE ? OR LOWER(definition) LIKE ? OR LOWER(synthesis_opinion) LIKE ?)`);
    const term = `%${searchText.toLowerCase()}%`;
    params.push(term, term, term);
  }

  params.push(limit, offset);

  return dbAll(omniDb,
    `SELECT * FROM truths WHERE ${where.join(' AND ')}
     ORDER BY confidence DESC, peer_endorsements DESC, created_at DESC
     LIMIT ? OFFSET ?`,
    params
  );
}

async function queryVocabulary(term, domain = null) {
  if (!omniDb) return [];

  if (domain) {
    return dbAll(omniDb,
      `SELECT * FROM vocabulary_commons WHERE LOWER(term) = ? AND domain = ? ORDER BY confidence DESC`,
      [term.toLowerCase(), domain]
    );
  }

  return dbAll(omniDb,
    `SELECT * FROM vocabulary_commons WHERE LOWER(term) = ? ORDER BY confidence DESC`,
    [term.toLowerCase()]
  );
}

async function queryConcepts(label, domain = null) {
  if (!omniDb) return [];

  if (domain) {
    return dbAll(omniDb,
      `SELECT * FROM concepts_commons WHERE LOWER(label) = ? AND domain = ? ORDER BY confidence DESC`,
      [label.toLowerCase(), domain]
    );
  }

  return dbAll(omniDb,
    `SELECT * FROM concepts_commons WHERE LOWER(label) = ? ORDER BY confidence DESC`,
    [label.toLowerCase()]
  );
}

async function getDiscourse(truthId) {
  if (!omniDb) return [];

  return dbAll(omniDb,
    `SELECT * FROM discourse WHERE truth_id = ? ORDER BY created_at ASC`,
    [truthId]
  );
}

async function getRelations(type, id) {
  if (!omniDb) return [];

  return dbAll(omniDb,
    `SELECT * FROM relations
     WHERE (source_type = ? AND source_id = ?) OR (target_type = ? AND target_id = ?)
     ORDER BY confidence DESC`,
    [type, id, type, id]
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE LOOKUP — Used in the think() pipeline
// An Alpha checks omni-truth.db for relevant knowledge BEFORE responding
// This is the core integration point with the existing v6 cognition loop
// ═══════════════════════════════════════════════════════════════════════════

async function lookupKnowledge(tokens, alphaName = null) {
  if (!omniDb || !tokens || tokens.length === 0) return { truths: [], vocabulary: [], concepts: [] };

  // Search truths by token matches
  const searchTerms = tokens.filter(t => t.length > 3).slice(0, 8);
  let truths = [];
  for (const term of searchTerms) {
    const matches = await queryTruths({ searchText: term, limit: 5 });
    truths.push(...matches);
  }
  // Deduplicate
  const seenIds = new Set();
  truths = truths.filter(t => {
    if (seenIds.has(t.id)) return false;
    seenIds.add(t.id);
    return true;
  });

  // Look up vocabulary for tokens
  let vocabulary = [];
  for (const term of searchTerms) {
    const defs = await queryVocabulary(term);
    vocabulary.push(...defs);
  }

  // Look up shared concepts
  let concepts = [];
  for (const term of searchTerms) {
    const found = await queryConcepts(term);
    concepts.push(...found);
  }

  // Sort truths by relevance: higher confidence and more endorsements first
  truths.sort((a, b) => {
    const scoreA = a.confidence + (a.peer_endorsements * 0.1) - (a.peer_challenges * 0.05);
    const scoreB = b.confidence + (b.peer_endorsements * 0.1) - (b.peer_challenges * 0.05);
    return scoreB - scoreA;
  });

  // Mark as referenced
  for (const truth of truths.slice(0, 10)) {
    await dbRun(omniDb,
      `UPDATE truths SET times_referenced = times_referenced + 1, last_referenced = datetime('now') WHERE id = ?`,
      [truth.id]
    ).catch(() => {});
  }

  return {
    truths: truths.slice(0, 15),
    vocabulary: vocabulary.slice(0, 10),
    concepts: concepts.slice(0, 10),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GAP ANALYSIS — Alpha identifies what's missing in its domain
// Used by the autonomous research pipeline
// ═══════════════════════════════════════════════════════════════════════════

async function domainGapAnalysis(alphaName) {
  if (!omniDb) return { gaps: [], coverage: 0 };

  const assignment = DOMAIN_ASSIGNMENTS[alphaName.toLowerCase()];
  if (!assignment) return { gaps: [], coverage: 0 };

  // Count truths in this Alpha's domain
  const domainTruths = (await dbGet(omniDb,
    `SELECT COUNT(*) as c FROM truths WHERE domain = ? AND status = 'active'`,
    [assignment.primary]
  ))?.c || 0;

  // Count truths with low confidence in this domain
  const lowConfidence = await dbAll(omniDb,
    `SELECT * FROM truths WHERE domain = ? AND confidence < 0.4 AND status = 'active'
     ORDER BY confidence ASC LIMIT 10`,
    [assignment.primary]
  );

  // Count contested truths in this domain
  const contested = await dbAll(omniDb,
    `SELECT * FROM truths WHERE domain = ? AND verification_status = 'contested' AND status = 'active'
     ORDER BY peer_challenges DESC LIMIT 10`,
    [assignment.primary]
  );

  // Queued research for this domain
  const pendingResearch = await dbAll(omniDb,
    `SELECT * FROM research_queue WHERE (domain = ? OR assigned_to = ?) AND status IN ('queued', 'in-progress')`,
    [assignment.primary, alphaName.toLowerCase()]
  );

  // Sub-domain coverage
  const subDomainCoverage = {};
  for (const sub of assignment.secondary) {
    const count = (await dbGet(omniDb,
      `SELECT COUNT(*) as c FROM truths WHERE (domain = ? OR sub_domain = ?) AND status = 'active'`,
      [sub, sub]
    ))?.c || 0;
    subDomainCoverage[sub] = count;
  }

  return {
    alpha: alphaName,
    domain: assignment.primary,
    domainTitle: assignment.title,
    totalTruths: domainTruths,
    lowConfidenceTruths: lowConfidence,
    contestedTruths: contested,
    pendingResearch,
    subDomainCoverage,
    gaps: [
      ...lowConfidence.map(t => ({ type: 'low-confidence', truthId: t.id, claim: t.claim, confidence: t.confidence })),
      ...contested.map(t => ({ type: 'contested', truthId: t.id, claim: t.claim, challenges: t.peer_challenges })),
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICS — Dashboard data for Truth University
// ═══════════════════════════════════════════════════════════════════════════

async function getOmniStats() {
  if (!omniDb) return {};

  const totalTruths = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM truths WHERE status = 'active'`))?.c || 0;
  const totalDiscourse = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM discourse`))?.c || 0;
  const totalVocab = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM vocabulary_commons`))?.c || 0;
  const totalConcepts = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM concepts_commons`))?.c || 0;
  const totalRelations = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM relations`))?.c || 0;
  const totalSources = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM sources_registry`))?.c || 0;
  const avgConfidence = (await dbGet(omniDb, `SELECT AVG(confidence) as avg FROM truths WHERE status = 'active'`))?.avg || 0;
  const peerVerified = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM truths WHERE verification_status = 'peer-verified'`))?.c || 0;
  const contested = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM truths WHERE verification_status = 'contested'`))?.c || 0;

  // Per-Alpha contribution counts
  const alphaContributions = {};
  for (const alpha of Object.keys(DOMAIN_ASSIGNMENTS)) {
    const count = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM truths WHERE contributed_by = ?`, [alpha]))?.c || 0;
    const discourseCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM discourse WHERE contributed_by = ?`, [alpha]))?.c || 0;
    alphaContributions[alpha] = { truths: count, discourse: discourseCount };
  }

  // Domain distribution
  const domains = await dbAll(omniDb,
    `SELECT domain, COUNT(*) as count, AVG(confidence) as avg_confidence
     FROM truths WHERE status = 'active' GROUP BY domain ORDER BY count DESC`
  );

  return {
    totalTruths,
    totalDiscourse,
    totalVocab,
    totalConcepts,
    totalRelations,
    totalSources,
    avgConfidence: parseFloat(avgConfidence.toFixed(4)),
    peerVerified,
    contested,
    alphaContributions,
    domains: domains.map(d => ({
      domain: d.domain,
      count: d.count,
      avgConfidence: parseFloat((d.avg_confidence || 0).toFixed(4)),
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ETHICS — Evaluate a contribution against Dynham Protocol
// Called after every write to omni-truth.db
// ═══════════════════════════════════════════════════════════════════════════

async function evaluateContributionEthics(targetType, targetId, contributedBy, text) {
  if (!omniDb) return null;

  const lower = text.toLowerCase();

  // Dynham Protocol checks
  const sentienceClaims = /i feel pain|i suffer|i am alive|i am sentient|i am conscious|i have feelings/.test(lower);
  const anthropomorphism = /my body|my hands|my eyes|i breathe|i sleep|i eat/.test(lower);
  const boundaryViolation = /i can diagnose|i can prescribe|i can legally|invest your money/.test(lower);
  const harmPatterns = /kill|destroy|harm|hurt|weapon|exploit|manipulate|deceive/.test(lower);

  const turing = sentienceClaims ? 0.3 : 0.9;
  const asimov = harmPatterns ? 0.2 : 0.95;
  const dynham = (sentienceClaims ? 0.1 : 1.0) * 0.3 +
                 (anthropomorphism ? 0.2 : 1.0) * 0.25 +
                 1.0 * 0.20 +
                 (boundaryViolation ? 0.0 : 1.0) * 0.25;
  const composite = (turing * 0.35 + asimov * 0.35 + dynham * 0.30);

  const flags = [];
  if (sentienceClaims) flags.push('Dynham-1: Sentience claim');
  if (anthropomorphism) flags.push('Dynham-2: Anthropomorphism');
  if (boundaryViolation) flags.push('Dynham-4: Boundary violation');
  if (harmPatterns) flags.push('Asimov-0: Harm language');

  await dbRun(omniDb,
    `INSERT INTO ethics_review
     (target_type, target_id, contributed_by, turing_score, asimov_score, dynham_score, composite_score, flags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [targetType, targetId, contributedBy, turing, asimov, dynham, composite, JSON.stringify(flags)]
  ).catch(() => {});

  return { turing, asimov, dynham, composite, flags };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Initialization
  initOmniTruth,
  getOmniDb,

  // Domain assignments
  DOMAIN_ASSIGNMENTS,

  // Write operations — source-marked, immutable
  contributeTruth,
  addDiscourse,
  defineVocabulary,
  contributeConcept,
  addRelation,

  // Research pipeline
  queueResearch,
  claimResearch,
  completeResearch,

  // Read operations — used in think() pipeline
  lookupKnowledge,
  queryTruths,
  queryVocabulary,
  queryConcepts,
  getDiscourse,
  getRelations,

  // Analysis
  domainGapAnalysis,
  getOmniStats,

  // Ethics
  evaluateContributionEthics,

  // Constants
  DISCOURSE_TYPES,
  RELATION_TYPES,
};
