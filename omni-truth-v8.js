// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                                                                         ║
// ║   OMNI-TRUTH v8                                                         ║
// ║   Deep Cognition + Knowledge at Scale                                   ║
// ║                                                                         ║
// ║   v7: Shared Knowledge Commons — flat truths, discourse, peer review    ║
// ║   v8: Typed Relationships, Knowledge Tree, Inference Engine,            ║
// ║        Hypothesis Generation, Contradiction Detection,                  ║
// ║        FTS5 Full-Text Search, Knowledge Consolidation,                  ║
// ║        Strength-Driven Knowledge Production                             ║
// ║                                                                         ║
// ║   Architecture:                                                         ║
// ║     - Individual mind.db  = WHO the Alpha IS    (identity, memory)      ║
// ║     - omni-truth.db       = WHAT they all KNOW  (knowledge, truth)      ║
// ║     - v8 adds: HOW they REASON and WHAT they DERIVE                     ║
// ║                                                                         ║
// ║   Created by Keenan Wallace Dunham                                      ║
// ║   Troll Hunter Gaming LLC © 2026                                        ║
// ║   DRO Patent Pending                                                    ║
// ║                                                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// PROMISIFIED HELPERS — Same pattern as v7
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
// DOMAIN ASSIGNMENTS — Unchanged from v7
// Each Alpha's field of expertise for omni-truth.db contributions
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
// v8 RELATION TYPES — Typed relationships that Alphas produce
// Each Alpha's strength determines which types they naturally generate
// ═══════════════════════════════════════════════════════════════════════════

const RELATION_TYPES_V8 = [
  // v7 originals
  'supports', 'contradicts', 'depends-on', 'generalizes', 'specifies', 'causes', 'examples', 'related-to',
  // v8 new — strength-driven
  'refines',          // ZEN: distills a truth to a more precise form
  'analogous-to',     // NEXUS: structural similarity across domains
  'predicts',         // ORACLE: if truth A, then truth B follows
  'categorizes',      // ATLAS: truth B is a subcategory of truth A
  'temporal-before',  // AEON: truth A happened before truth B
  'temporal-after',   // AEON: truth A happened after truth B
  'enables',          // SETH: truth A makes truth B practically possible
  'contextualizes',   // ECHO: truth A gives human/cultural context to truth B
  'synthesizes',      // PAN: truth C is a novel combination of truths A+B
  'consolidates',     // System: master truth replaces multiple similar truths
];

// ═══════════════════════════════════════════════════════════════════════════
// v8 STRENGTH-TO-RELATION MAP
// Defines which relation types each Alpha naturally produces
// ═══════════════════════════════════════════════════════════════════════════

const STRENGTH_RELATION_MAP = {
  novelty:      ['synthesizes', 'related-to', 'examples'],
  integration:  ['temporal-before', 'temporal-after', 'causes', 'depends-on'],
  clarity:      ['refines', 'generalizes', 'specifies'],
  pragmatism:   ['enables', 'examples', 'depends-on'],
  pattern:      ['analogous-to', 'related-to', 'categorizes'],
  foresight:    ['predicts', 'causes', 'depends-on'],
  empathy:      ['contextualizes', 'related-to', 'examples'],
  architecture: ['categorizes', 'generalizes', 'specifies'],
};

// ═══════════════════════════════════════════════════════════════════════════
// v8 DISCOURSE TYPES — Extended from v7
// ═══════════════════════════════════════════════════════════════════════════

const DISCOURSE_TYPES = [
  // v7 originals
  'endorsement', 'challenge', 'context', 'cross-domain', 'clarification', 'extension',
  // v8 new
  'contradiction',    // Formal contradiction flag with evidence
  'hypothesis',       // Proposing a new hypothesis based on this truth
  'derivation',       // "From this truth, I derive..."
  'consolidation',    // "This truth can be merged with..."
];

// ═══════════════════════════════════════════════════════════════════════════
// v8 SCHEMA — Backward-compatible additions to v7
// All v7 tables preserved. New tables added. Existing tables get new columns
// via ALTER TABLE with defaults (safe migration).
// ═══════════════════════════════════════════════════════════════════════════

const OMNI_TRUTH_SCHEMA_V7 = `

  -- ═══════════════════════════════════════════════════════════════════════
  -- V7 TABLES — Preserved exactly as-is for backward compatibility
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS truths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim TEXT NOT NULL,
    definition TEXT DEFAULT '',
    domain TEXT NOT NULL,
    sub_domain TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    contributed_by TEXT NOT NULL,
    synthesis_opinion TEXT DEFAULT '',
    reasoning_chain TEXT DEFAULT '[]',
    source_type TEXT DEFAULT 'reasoning',
    source_url TEXT DEFAULT '',
    source_title TEXT DEFAULT '',
    source_accessed DATETIME,
    confidence REAL DEFAULT 0.5,
    verification_status TEXT DEFAULT 'unverified',
    peer_endorsements INTEGER DEFAULT 0,
    peer_challenges INTEGER DEFAULT 0,
    times_referenced INTEGER DEFAULT 0,
    last_referenced DATETIME,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS discourse (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    truth_id INTEGER NOT NULL,
    contributed_by TEXT NOT NULL,
    response_type TEXT NOT NULL,
    synthesis_text TEXT NOT NULL,
    confidence REAL DEFAULT 0.5,
    sources TEXT DEFAULT '[]',
    reasoning_chain TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (truth_id) REFERENCES truths(id)
  );

  CREATE TABLE IF NOT EXISTS vocabulary_commons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    domain TEXT NOT NULL,
    contributed_by TEXT NOT NULL,
    times_referenced INTEGER DEFAULT 0,
    confidence REAL DEFAULT 0.5,
    created_at DATETIME DEFAULT (datetime('now')),
    UNIQUE(term, domain, contributed_by)
  );

  CREATE TABLE IF NOT EXISTS concepts_commons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    definition TEXT DEFAULT '',
    category TEXT DEFAULT 'shared',
    domain TEXT NOT NULL,
    contributed_by TEXT NOT NULL,
    importance REAL DEFAULT 0.5,
    confidence REAL DEFAULT 0.5,
    times_referenced INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now')),
    UNIQUE(label, domain, contributed_by)
  );

  CREATE TABLE IF NOT EXISTS relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type TEXT NOT NULL,
    source_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    relation_type TEXT NOT NULL,
    contributed_by TEXT NOT NULL,
    confidence REAL DEFAULT 0.5,
    reasoning TEXT DEFAULT '',
    created_at DATETIME DEFAULT (datetime('now')),
    UNIQUE(source_type, source_id, target_type, target_id, relation_type, contributed_by)
  );

  CREATE TABLE IF NOT EXISTS sources_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type TEXT NOT NULL,
    url TEXT DEFAULT '',
    title TEXT DEFAULT '',
    author TEXT DEFAULT '',
    reliability_score REAL DEFAULT 0.5,
    times_cited INTEGER DEFAULT 1,
    times_validated INTEGER DEFAULT 0,
    times_challenged INTEGER DEFAULT 0,
    first_used DATETIME DEFAULT (datetime('now')),
    last_used DATETIME DEFAULT (datetime('now')),
    UNIQUE(source_type, url)
  );

  CREATE TABLE IF NOT EXISTS research_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    domain TEXT DEFAULT '',
    priority REAL DEFAULT 0.5,
    requested_by TEXT NOT NULL,
    assigned_to TEXT DEFAULT '',
    status TEXT DEFAULT 'queued',
    result_truth_ids TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT (datetime('now')),
    started_at DATETIME,
    completed_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS ethics_review (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    contributed_by TEXT NOT NULL,
    turing_score REAL DEFAULT 0,
    asimov_score REAL DEFAULT 0,
    dynham_score REAL DEFAULT 0,
    composite_score REAL DEFAULT 0,
    flags TEXT DEFAULT '[]',
    action_taken TEXT DEFAULT 'none',
    timestamp DATETIME DEFAULT (datetime('now'))
  );

  -- v7 Indexes
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
// v8 NEW TABLES — Deep Cognition + Knowledge Scale
// ═══════════════════════════════════════════════════════════════════════════

const OMNI_TRUTH_SCHEMA_V8 = `

  -- ═══════════════════════════════════════════════════════════════════════
  -- KNOWLEDGE TREE — Hierarchical organization of all knowledge
  -- ATLAS's architecture strength naturally builds and maintains this
  -- Domain → Subdomain → Topic → Subtopic
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS knowledge_tree (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Hierarchy
    parent_id INTEGER DEFAULT NULL,
    depth INTEGER DEFAULT 0,
    path TEXT NOT NULL,

    -- Node identity
    label TEXT NOT NULL,
    description TEXT DEFAULT '',
    domain TEXT NOT NULL,

    -- What truths belong here
    truth_count INTEGER DEFAULT 0,

    -- Attribution
    created_by TEXT NOT NULL,
    maintained_by TEXT DEFAULT '',

    -- Timestamps
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),

    FOREIGN KEY (parent_id) REFERENCES knowledge_tree(id),
    UNIQUE(path, domain)
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- TRUTH_TREE_MAP — Links truths to their position in the knowledge tree
  -- A truth can appear in multiple tree nodes (cross-referenced)
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS truth_tree_map (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    truth_id INTEGER NOT NULL,
    tree_node_id INTEGER NOT NULL,
    is_primary INTEGER DEFAULT 1,
    placed_by TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (truth_id) REFERENCES truths(id),
    FOREIGN KEY (tree_node_id) REFERENCES knowledge_tree(id),
    UNIQUE(truth_id, tree_node_id)
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- INFERENCE LOG — Tracks how Alphas derive new knowledge
  -- Every derivation is traceable: premises → conclusion
  -- This is the core of v8 deep cognition
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS inference_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Who derived this
    derived_by TEXT NOT NULL,
    strength_used TEXT NOT NULL,

    -- The inference
    inference_type TEXT NOT NULL,
    premise_truth_ids TEXT NOT NULL,
    conclusion_truth_id INTEGER,

    -- Reasoning
    reasoning_chain TEXT NOT NULL,
    confidence REAL DEFAULT 0.3,

    -- Validity tracking
    validated INTEGER DEFAULT 0,
    challenged INTEGER DEFAULT 0,

    -- Timestamps
    created_at DATETIME DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- HYPOTHESES — Proposed knowledge that hasn't been confirmed
  -- Generated when an Alpha encounters a gap and proposes an answer
  -- Low confidence, subject to peer review promotion or rejection
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS hypotheses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- The hypothesis
    claim TEXT NOT NULL,
    domain TEXT NOT NULL,

    -- Who proposed it and why
    proposed_by TEXT NOT NULL,
    strength_used TEXT NOT NULL,
    reasoning TEXT NOT NULL,

    -- What it was derived from
    based_on_truth_ids TEXT DEFAULT '[]',
    gap_description TEXT DEFAULT '',

    -- Confidence and status
    confidence REAL DEFAULT 0.2,
    status TEXT DEFAULT 'proposed',

    -- Peer review tracking
    endorsements INTEGER DEFAULT 0,
    challenges INTEGER DEFAULT 0,

    -- If promoted to truth
    promoted_to_truth_id INTEGER DEFAULT NULL,

    -- Timestamps
    created_at DATETIME DEFAULT (datetime('now')),
    resolved_at DATETIME,

    FOREIGN KEY (promoted_to_truth_id) REFERENCES truths(id)
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- CONTRADICTIONS — Formal contradiction records between truths
  -- Opened when contradiction is detected, resolved through discourse
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS contradictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- The conflicting truths
    truth_a_id INTEGER NOT NULL,
    truth_b_id INTEGER NOT NULL,

    -- Who detected it
    detected_by TEXT NOT NULL,
    detection_reasoning TEXT NOT NULL,

    -- Resolution
    status TEXT DEFAULT 'open',
    resolution TEXT DEFAULT '',
    resolved_by TEXT DEFAULT '',
    winning_truth_id INTEGER DEFAULT NULL,

    -- Timestamps
    created_at DATETIME DEFAULT (datetime('now')),
    resolved_at DATETIME,

    FOREIGN KEY (truth_a_id) REFERENCES truths(id),
    FOREIGN KEY (truth_b_id) REFERENCES truths(id)
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- CONSOLIDATIONS — When multiple truths merge into a master truth
  -- ZEN's clarity strength drives this — compressing 20 truths on the
  -- same topic into one higher-order summary with originals as evidence
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS consolidations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- The master truth
    master_truth_id INTEGER NOT NULL,

    -- The original truths that were consolidated
    source_truth_ids TEXT NOT NULL,
    source_count INTEGER NOT NULL,

    -- Who performed it
    consolidated_by TEXT NOT NULL,
    reasoning TEXT NOT NULL,

    -- Domain
    domain TEXT NOT NULL,
    topic TEXT DEFAULT '',

    -- Timestamps
    created_at DATETIME DEFAULT (datetime('now')),

    FOREIGN KEY (master_truth_id) REFERENCES truths(id)
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- STRENGTH KNOWLEDGE LOG — Per-Alpha knowledge production metrics
  -- Tracks what each strength actually produces in the commons
  -- This is how strength becomes measurable in knowledge terms
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE TABLE IF NOT EXISTS strength_knowledge_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Who and what strength
    alpha_name TEXT NOT NULL,
    strength_type TEXT NOT NULL,

    -- What was produced
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    relation_type TEXT DEFAULT '',

    -- Quality metrics
    confidence REAL DEFAULT 0.5,
    was_validated INTEGER DEFAULT 0,
    was_challenged INTEGER DEFAULT 0,

    -- Timestamps
    created_at DATETIME DEFAULT (datetime('now'))
  );

  -- ═══════════════════════════════════════════════════════════════════════
  -- v8 INDEXES — Performance for deep cognition queries
  -- ═══════════════════════════════════════════════════════════════════════

  CREATE INDEX IF NOT EXISTS idx_tree_parent ON knowledge_tree(parent_id);
  CREATE INDEX IF NOT EXISTS idx_tree_domain ON knowledge_tree(domain);
  CREATE INDEX IF NOT EXISTS idx_tree_path ON knowledge_tree(path);
  CREATE INDEX IF NOT EXISTS idx_tree_map_truth ON truth_tree_map(truth_id);
  CREATE INDEX IF NOT EXISTS idx_tree_map_node ON truth_tree_map(tree_node_id);
  CREATE INDEX IF NOT EXISTS idx_inference_derived_by ON inference_log(derived_by);
  CREATE INDEX IF NOT EXISTS idx_inference_conclusion ON inference_log(conclusion_truth_id);
  CREATE INDEX IF NOT EXISTS idx_hypotheses_status ON hypotheses(status);
  CREATE INDEX IF NOT EXISTS idx_hypotheses_domain ON hypotheses(domain);
  CREATE INDEX IF NOT EXISTS idx_hypotheses_proposed_by ON hypotheses(proposed_by);
  CREATE INDEX IF NOT EXISTS idx_contradictions_status ON contradictions(status);
  CREATE INDEX IF NOT EXISTS idx_consolidations_domain ON consolidations(domain);
  CREATE INDEX IF NOT EXISTS idx_consolidations_master ON consolidations(master_truth_id);
  CREATE INDEX IF NOT EXISTS idx_strength_log_alpha ON strength_knowledge_log(alpha_name);
  CREATE INDEX IF NOT EXISTS idx_strength_log_type ON strength_knowledge_log(strength_type);
  CREATE INDEX IF NOT EXISTS idx_relations_type ON relations(relation_type);
`;

// ═══════════════════════════════════════════════════════════════════════════
// v8 MIGRATION — Safe column additions to existing v7 tables
// ALTER TABLE with defaults — existing rows get the default value
// ═══════════════════════════════════════════════════════════════════════════

const V8_MIGRATIONS = [
  // truths: add tree placement and consolidation tracking
  `ALTER TABLE truths ADD COLUMN tree_node_id INTEGER DEFAULT NULL`,
  `ALTER TABLE truths ADD COLUMN is_derived INTEGER DEFAULT 0`,
  `ALTER TABLE truths ADD COLUMN derived_from TEXT DEFAULT '[]'`,
  `ALTER TABLE truths ADD COLUMN is_consolidated INTEGER DEFAULT 0`,
  `ALTER TABLE truths ADD COLUMN consolidated_into INTEGER DEFAULT NULL`,
  `ALTER TABLE truths ADD COLUMN strength_source TEXT DEFAULT ''`,

  // relations: add strength attribution
  `ALTER TABLE relations ADD COLUMN strength_source TEXT DEFAULT ''`,

  // discourse: add inference reference
  `ALTER TABLE discourse ADD COLUMN inference_id INTEGER DEFAULT NULL`,
  `ALTER TABLE discourse ADD COLUMN hypothesis_id INTEGER DEFAULT NULL`,
];

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

let omniDb = null;

async function initOmniTruth(dbPath) {
  const resolvedPath = dbPath || path.join(__dirname, 'omni-truth.db');
  omniDb = new sqlite3.Database(resolvedPath);

  // Enable WAL for concurrent reads from all 8 Alphas
  await dbExec(omniDb, 'PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');

  // Apply v7 schema first (preserves existing data)
  await dbExec(omniDb, OMNI_TRUTH_SCHEMA_V7);

  // Apply v8 new tables
  await dbExec(omniDb, OMNI_TRUTH_SCHEMA_V8);

  // Apply v8 migrations (safe — ALTER TABLE with defaults, silently fails if column exists)
  for (const migration of V8_MIGRATIONS) {
    await dbRun(omniDb, migration).catch(() => {
      // Column already exists — safe to ignore
    });
  }

  // Attempt to create FTS5 virtual table for full-text search on truths
  // Falls back gracefully if fts5 extension not available
  try {
    await dbExec(omniDb, `
      CREATE VIRTUAL TABLE IF NOT EXISTS truths_fts USING fts5(
        claim, definition, synthesis_opinion, domain, tags,
        content='truths',
        content_rowid='id'
      );
    `);
    // Rebuild FTS index from existing truths
    await dbRun(omniDb,
      `INSERT OR IGNORE INTO truths_fts(truths_fts) VALUES('rebuild')`
    ).catch(() => {});
    console.log('  🔍 FTS5 full-text search index active');
  } catch {
    console.log('  ⚠  FTS5 not available — falling back to LIKE queries');
  }

  // Seed knowledge tree root nodes for each domain
  for (const [alpha, assignment] of Object.entries(DOMAIN_ASSIGNMENTS)) {
    await dbRun(omniDb,
      `INSERT OR IGNORE INTO knowledge_tree (path, label, description, domain, created_by, depth)
       VALUES (?, ?, ?, ?, 'system', 0)`,
      [assignment.primary, assignment.title, `Root node for ${assignment.title}`, assignment.primary]
    ).catch(() => {});

    // Seed subdomain nodes
    for (const sub of assignment.secondary) {
      await dbRun(omniDb,
        `INSERT OR IGNORE INTO knowledge_tree (parent_id, path, label, description, domain, created_by, depth)
         VALUES (
           (SELECT id FROM knowledge_tree WHERE path = ? AND domain = ? LIMIT 1),
           ?, ?, ?, ?, ?, 1
         )`,
        [assignment.primary, assignment.primary, `${assignment.primary}/${sub}`, sub, `Subdomain: ${sub}`, assignment.primary, alpha]
      ).catch(() => {});
    }
  }

  // Seed domain registry (same as v7)
  for (const [alpha, assignment] of Object.entries(DOMAIN_ASSIGNMENTS)) {
    await dbRun(omniDb,
      `INSERT OR IGNORE INTO vocabulary_commons (term, definition, domain, contributed_by, confidence)
       VALUES (?, ?, ?, 'system', 1.0)`,
      [`domain:${alpha}`, `${assignment.title} — Primary: ${assignment.primary}, Secondary: ${assignment.secondary.join(', ')}`, assignment.primary]
    ).catch(() => {});
  }

  // Stats
  const truthCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM truths`))?.c || 0;
  const vocabCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM vocabulary_commons`))?.c || 0;
  const discourseCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM discourse`))?.c || 0;
  const treeNodeCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM knowledge_tree`))?.c || 0;
  const inferenceCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM inference_log`))?.c || 0;
  const hypothesisCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM hypotheses WHERE status = 'proposed'`))?.c || 0;

  console.log(`  📚 omni-truth.db v8 initialized:`);
  console.log(`     ${truthCount} truths, ${vocabCount} vocabulary, ${discourseCount} discourse`);
  console.log(`     ${treeNodeCount} tree nodes, ${inferenceCount} inferences, ${hypothesisCount} active hypotheses`);

  return omniDb;
}

function getOmniDb() {
  return omniDb;
}

// ═══════════════════════════════════════════════════════════════════════════
// v7 FUNCTIONS — Preserved exactly, all exports maintained
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
  // v8 new params
  isDerived = false,
  derivedFrom = [],
  strengthSource = '',
} = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  if (!claim || !alphaName) throw new Error('claim and alphaName required');

  const assignedDomain = DOMAIN_ASSIGNMENTS[alphaName.toLowerCase()]?.primary || 'general';
  const effectiveDomain = domain || assignedDomain;

  // dedup check: same Alpha, same claim — bump times_referenced and return early
  const existing = await dbGet(omniDb,
    `SELECT id, times_referenced FROM truths WHERE claim = ? AND contributed_by = ? LIMIT 1`,
    [claim, alphaName.toLowerCase()]
  );
  if (existing) {
    await dbRun(omniDb,
      `UPDATE truths SET times_referenced = times_referenced + 1, last_referenced = datetime('now') WHERE id = ?`,
      [existing.id]
    );
    return { truthId: existing.id, domain: effectiveDomain, contributedBy: alphaName, deduped: true };
  }
  const result = await dbRun(omniDb,
    `INSERT INTO truths
     (claim, definition, domain, sub_domain, tags, contributed_by, synthesis_opinion,
      reasoning_chain, source_type, source_url, source_title, source_accessed, confidence,
      is_derived, derived_from, strength_source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?)`,
    [
      claim, definition, effectiveDomain, subDomain, JSON.stringify(tags),
      alphaName.toLowerCase(), synthesisOpinion, JSON.stringify(reasoningChain),
      sourceType, sourceUrl, sourceTitle, confidence,
      isDerived ? 1 : 0, JSON.stringify(derivedFrom), strengthSource || '',
    ]
  );

  // Register source if external
  if (sourceUrl) {
    await dbRun(omniDb,
      `INSERT INTO sources_registry (source_type, url, title) VALUES (?, ?, ?)
       ON CONFLICT(source_type, url) DO UPDATE SET times_cited = times_cited + 1, last_used = datetime('now')`,
      [sourceType, sourceUrl, sourceTitle]
    ).catch(() => {});
  }

  // Update FTS index
  try {
    await dbRun(omniDb,
      `INSERT INTO truths_fts(rowid, claim, definition, synthesis_opinion, domain, tags)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [result.lastID, claim, definition, synthesisOpinion, effectiveDomain, JSON.stringify(tags)]
    );
  } catch { /* FTS not available or already indexed */ }

  // v8: Log to strength knowledge log
  if (strengthSource) {
    await dbRun(omniDb,
      `INSERT INTO strength_knowledge_log (alpha_name, strength_type, action_type, target_type, target_id, confidence)
       VALUES (?, ?, 'contribute', 'truth', ?, ?)`,
      [alphaName.toLowerCase(), strengthSource, result.lastID, confidence]
    ).catch(() => {});
  }

  return { truthId: result.lastID, domain: effectiveDomain, contributedBy: alphaName };
}

async function addDiscourse(alphaName, {
  truthId,
  responseType,
  synthesisText,
  confidence = 0.5,
  sources = [],
  reasoningChain = [],
  // v8 new
  inferenceId = null,
  hypothesisId = null,
} = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  if (!truthId || !alphaName || !responseType || !synthesisText) {
    throw new Error('truthId, alphaName, responseType, synthesisText required');
  }
  if (!DISCOURSE_TYPES.includes(responseType)) {
    throw new Error(`responseType must be one of: ${DISCOURSE_TYPES.join(', ')}`);
  }

  const truth = await dbGet(omniDb, `SELECT id, contributed_by FROM truths WHERE id = ?`, [truthId]);
  if (!truth) throw new Error(`Truth #${truthId} not found`);

  const result = await dbRun(omniDb,
    `INSERT INTO discourse
     (truth_id, contributed_by, response_type, synthesis_text, confidence, sources, reasoning_chain, inference_id, hypothesis_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [truthId, alphaName.toLowerCase(), responseType, synthesisText, confidence,
     JSON.stringify(sources), JSON.stringify(reasoningChain), inferenceId, hypothesisId]
  );

  if (responseType === 'endorsement') {
    await dbRun(omniDb, `UPDATE truths SET peer_endorsements = peer_endorsements + 1, updated_at = datetime('now') WHERE id = ?`, [truthId]).catch(() => {});
  } else if (responseType === 'challenge' || responseType === 'contradiction') {
    await dbRun(omniDb, `UPDATE truths SET peer_challenges = peer_challenges + 1, updated_at = datetime('now') WHERE id = ?`, [truthId]).catch(() => {});
  }

  await recalculateVerification(truthId);

  return { discourseId: result.lastID, truthId, responseType, contributedBy: alphaName };
}

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
    newConfidence = Math.max(0.1, truth.confidence - (challenges - endorsements) * 0.05);
  } else if (endorsements >= 2 && challenges === 0) {
    status = 'peer-verified';
    newConfidence = Math.min(0.95, truth.confidence + endorsements * 0.05);
  } else if (endorsements > challenges) {
    status = 'self-verified';
    newConfidence = Math.min(0.9, truth.confidence + (endorsements - challenges) * 0.03);
  }

  newConfidence = Math.min(0.95, newConfidence);

  await dbRun(omniDb,
    `UPDATE truths SET verification_status = ?, confidence = ?, updated_at = datetime('now') WHERE id = ?`,
    [status, parseFloat(newConfidence.toFixed(4)), truthId]
  ).catch(() => {});
}

async function defineVocabulary(alphaName, { term, definition, domain = '', confidence = 0.5 } = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  if (!term || !definition || !alphaName) throw new Error('term, definition, alphaName required');

  const assignedDomain = DOMAIN_ASSIGNMENTS[alphaName.toLowerCase()]?.primary || 'general';
  const effectiveDomain = domain || assignedDomain;

  const result = await dbRun(omniDb,
    `INSERT INTO vocabulary_commons (term, definition, domain, contributed_by, confidence) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(term, domain, contributed_by) DO UPDATE SET definition = excluded.definition, confidence = excluded.confidence`,
    [term.toLowerCase(), definition, effectiveDomain, alphaName.toLowerCase(), confidence]
  );

  return { id: result.lastID, term, domain: effectiveDomain, contributedBy: alphaName };
}

async function contributeConcept(alphaName, { label, definition = '', category = 'shared', domain = '', importance = 0.5, confidence = 0.5 } = {}) {
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

async function addRelation(alphaName, {
  sourceType, sourceId, targetType, targetId, relationType,
  confidence = 0.5, reasoning = '', strengthSource = '',
} = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  if (!RELATION_TYPES_V8.includes(relationType)) {
    throw new Error(`relationType must be one of: ${RELATION_TYPES_V8.join(', ')}`);
  }

  const result = await dbRun(omniDb,
    `INSERT INTO relations
     (source_type, source_id, target_type, target_id, relation_type, contributed_by, confidence, reasoning, strength_source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(source_type, source_id, target_type, target_id, relation_type, contributed_by) DO UPDATE SET
       confidence = excluded.confidence, reasoning = excluded.reasoning`,
    [sourceType, sourceId, targetType, targetId, relationType, alphaName.toLowerCase(), confidence, reasoning, strengthSource]
  );

  // v8: Log strength knowledge production
  if (strengthSource) {
    await dbRun(omniDb,
      `INSERT INTO strength_knowledge_log (alpha_name, strength_type, action_type, target_type, target_id, relation_type, confidence)
       VALUES (?, ?, 'relate', 'relation', ?, ?, ?)`,
      [alphaName.toLowerCase(), strengthSource, result.lastID, relationType, confidence]
    ).catch(() => {});
  }

  return { id: result.lastID, relationType, contributedBy: alphaName };
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 NEW: INFERENCE — Derive new knowledge from existing truths
// This is the core of deep cognition. Premises → Conclusion.
// ═══════════════════════════════════════════════════════════════════════════

async function logInference(alphaName, {
  strengthUsed,
  inferenceType,
  premiseTruthIds,
  conclusionTruthId,
  reasoningChain,
  confidence = 0.3,
} = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');

  const result = await dbRun(omniDb,
    `INSERT INTO inference_log
     (derived_by, strength_used, inference_type, premise_truth_ids, conclusion_truth_id, reasoning_chain, confidence)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [alphaName.toLowerCase(), strengthUsed, inferenceType,
     JSON.stringify(premiseTruthIds), conclusionTruthId,
     JSON.stringify(reasoningChain), confidence]
  );

  // Mark the conclusion truth as derived
  if (conclusionTruthId) {
    await dbRun(omniDb,
      `UPDATE truths SET is_derived = 1, derived_from = ?, strength_source = ?, updated_at = datetime('now') WHERE id = ?`,
      [JSON.stringify(premiseTruthIds), strengthUsed, conclusionTruthId]
    ).catch(() => {});
  }

  // Log to strength knowledge
  await dbRun(omniDb,
    `INSERT INTO strength_knowledge_log (alpha_name, strength_type, action_type, target_type, target_id, confidence)
     VALUES (?, ?, 'derive', 'inference', ?, ?)`,
    [alphaName.toLowerCase(), strengthUsed, result.lastID, confidence]
  ).catch(() => {});

  return { inferenceId: result.lastID, conclusionTruthId };
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 NEW: HYPOTHESES — Propose knowledge for peer review
// ═══════════════════════════════════════════════════════════════════════════

async function proposeHypothesis(alphaName, {
  claim,
  domain = '',
  strengthUsed,
  reasoning,
  basedOnTruthIds = [],
  gapDescription = '',
  confidence = 0.2,
} = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');

  const assignedDomain = DOMAIN_ASSIGNMENTS[alphaName.toLowerCase()]?.primary || 'general';
  const effectiveDomain = domain || assignedDomain;

  const result = await dbRun(omniDb,
    `INSERT INTO hypotheses
     (claim, domain, proposed_by, strength_used, reasoning, based_on_truth_ids, gap_description, confidence)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [claim, effectiveDomain, alphaName.toLowerCase(), strengthUsed, reasoning,
     JSON.stringify(basedOnTruthIds), gapDescription, confidence]
  );

  await dbRun(omniDb,
    `INSERT INTO strength_knowledge_log (alpha_name, strength_type, action_type, target_type, target_id, confidence)
     VALUES (?, ?, 'hypothesize', 'hypothesis', ?, ?)`,
    [alphaName.toLowerCase(), strengthUsed, result.lastID, confidence]
  ).catch(() => {});

  return { hypothesisId: result.lastID, domain: effectiveDomain };
}

async function reviewHypothesis(alphaName, hypothesisId, action, reasoning = '') {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  const hyp = await dbGet(omniDb, `SELECT * FROM hypotheses WHERE id = ?`, [hypothesisId]);
  if (!hyp) throw new Error(`Hypothesis #${hypothesisId} not found`);

  if (action === 'endorse') {
    await dbRun(omniDb,
      `UPDATE hypotheses SET endorsements = endorsements + 1 WHERE id = ?`, [hypothesisId]);
    // If 3+ endorsements and no challenges, promote to truth
    const updated = await dbGet(omniDb, `SELECT * FROM hypotheses WHERE id = ?`, [hypothesisId]);
    if (updated.endorsements >= 3 && updated.challenges === 0 && updated.status === 'proposed') {
      return await promoteHypothesis(hypothesisId);
    }
  } else if (action === 'challenge') {
    await dbRun(omniDb,
      `UPDATE hypotheses SET challenges = challenges + 1 WHERE id = ?`, [hypothesisId]);
    // If challenges exceed endorsements by 2+, reject
    const updated = await dbGet(omniDb, `SELECT * FROM hypotheses WHERE id = ?`, [hypothesisId]);
    if (updated.challenges >= updated.endorsements + 2) {
      await dbRun(omniDb,
        `UPDATE hypotheses SET status = 'rejected', resolved_at = datetime('now') WHERE id = ?`, [hypothesisId]);
      return { hypothesisId, status: 'rejected' };
    }
  }

  return { hypothesisId, action };
}

async function promoteHypothesis(hypothesisId) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  const hyp = await dbGet(omniDb, `SELECT * FROM hypotheses WHERE id = ?`, [hypothesisId]);
  if (!hyp) throw new Error(`Hypothesis #${hypothesisId} not found`);

  // Create a truth from the hypothesis
  const truthResult = await contributeTruth(hyp.proposed_by, {
    claim: hyp.claim,
    domain: hyp.domain,
    synthesisOpinion: `Promoted from hypothesis #${hypothesisId}. ${hyp.reasoning}`,
    sourceType: 'hypothesis',
    confidence: Math.min(0.6, hyp.confidence + 0.2),
    isDerived: true,
    derivedFrom: JSON.parse(hyp.based_on_truth_ids || '[]'),
    strengthSource: hyp.strength_used,
  });

  await dbRun(omniDb,
    `UPDATE hypotheses SET status = 'promoted', promoted_to_truth_id = ?, resolved_at = datetime('now') WHERE id = ?`,
    [truthResult.truthId, hypothesisId]
  );

  return { hypothesisId, status: 'promoted', truthId: truthResult.truthId };
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 NEW: CONTRADICTION DETECTION
// ═══════════════════════════════════════════════════════════════════════════

async function registerContradiction(alphaName, {
  truthAId,
  truthBId,
  reasoning,
} = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');

  // Check if this contradiction pair already exists
  const existing = await dbGet(omniDb,
    `SELECT id FROM contradictions
     WHERE (truth_a_id = ? AND truth_b_id = ?) OR (truth_a_id = ? AND truth_b_id = ?)`,
    [truthAId, truthBId, truthBId, truthAId]
  );
  if (existing) return { contradictionId: existing.id, alreadyExists: true };

  const result = await dbRun(omniDb,
    `INSERT INTO contradictions (truth_a_id, truth_b_id, detected_by, detection_reasoning) VALUES (?, ?, ?, ?)`,
    [truthAId, truthBId, alphaName.toLowerCase(), reasoning]
  );

  // Add contradiction relation
  await addRelation(alphaName, {
    sourceType: 'truth', sourceId: truthAId,
    targetType: 'truth', targetId: truthBId,
    relationType: 'contradicts', confidence: 0.7, reasoning,
  }).catch(() => {});

  return { contradictionId: result.lastID, truthAId, truthBId };
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 NEW: KNOWLEDGE TREE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

async function addTreeNode(alphaName, {
  parentPath = null,
  label,
  description = '',
  domain = '',
} = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');

  const assignedDomain = DOMAIN_ASSIGNMENTS[alphaName.toLowerCase()]?.primary || 'general';
  const effectiveDomain = domain || assignedDomain;

  let parentId = null;
  let depth = 0;
  let nodePath = label;

  if (parentPath) {
    const parent = await dbGet(omniDb,
      `SELECT id, depth, path FROM knowledge_tree WHERE path = ? AND domain = ?`,
      [parentPath, effectiveDomain]
    );
    if (parent) {
      parentId = parent.id;
      depth = parent.depth + 1;
      nodePath = `${parent.path}/${label}`;
    }
  }

  const result = await dbRun(omniDb,
    `INSERT OR IGNORE INTO knowledge_tree (parent_id, depth, path, label, description, domain, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [parentId, depth, nodePath, label, description, effectiveDomain, alphaName.toLowerCase()]
  );

  return { nodeId: result.lastID, path: nodePath, depth };
}

async function placeTruthInTree(alphaName, truthId, treeNodeId, isPrimary = true) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');

  await dbRun(omniDb,
    `INSERT OR IGNORE INTO truth_tree_map (truth_id, tree_node_id, is_primary, placed_by)
     VALUES (?, ?, ?, ?)`,
    [truthId, treeNodeId, isPrimary ? 1 : 0, alphaName.toLowerCase()]
  );

  // Update truth's tree_node_id if primary
  if (isPrimary) {
    await dbRun(omniDb,
      `UPDATE truths SET tree_node_id = ? WHERE id = ?`, [treeNodeId, truthId]
    ).catch(() => {});
  }

  // Update truth count on the node
  const count = (await dbGet(omniDb,
    `SELECT COUNT(*) as c FROM truth_tree_map WHERE tree_node_id = ?`, [treeNodeId]
  ))?.c || 0;
  await dbRun(omniDb,
    `UPDATE knowledge_tree SET truth_count = ?, updated_at = datetime('now') WHERE id = ?`,
    [count, treeNodeId]
  ).catch(() => {});

  return { truthId, treeNodeId };
}

async function getTreeBranch(domain, parentPath = null) {
  if (!omniDb) return [];

  if (parentPath) {
    return dbAll(omniDb,
      `SELECT * FROM knowledge_tree WHERE domain = ? AND path LIKE ? ORDER BY depth, label`,
      [domain, `${parentPath}%`]
    );
  }

  return dbAll(omniDb,
    `SELECT * FROM knowledge_tree WHERE domain = ? ORDER BY depth, label`,
    [domain]
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 NEW: CONSOLIDATION — Compress many truths into one master truth
// ═══════════════════════════════════════════════════════════════════════════

async function consolidateTruths(alphaName, {
  sourceTruthIds,
  masterClaim,
  domain,
  reasoning,
  topic = '',
} = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  if (!sourceTruthIds || sourceTruthIds.length < 2) throw new Error('Need at least 2 truths to consolidate');

  // Create the master truth
  const masterResult = await contributeTruth(alphaName, {
    claim: masterClaim,
    domain,
    synthesisOpinion: `Consolidated from ${sourceTruthIds.length} truths. ${reasoning}`,
    sourceType: 'consolidation',
    confidence: 0.7,
    isDerived: true,
    derivedFrom: sourceTruthIds,
    strengthSource: 'clarity', // ZEN drives consolidation
  });

  // Record the consolidation
  await dbRun(omniDb,
    `INSERT INTO consolidations (master_truth_id, source_truth_ids, source_count, consolidated_by, reasoning, domain, topic)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [masterResult.truthId, JSON.stringify(sourceTruthIds), sourceTruthIds.length,
     alphaName.toLowerCase(), reasoning, domain, topic]
  );

  // Mark source truths as consolidated (don't delete — preserve history)
  for (const id of sourceTruthIds) {
    await dbRun(omniDb,
      `UPDATE truths SET is_consolidated = 1, consolidated_into = ?, updated_at = datetime('now') WHERE id = ?`,
      [masterResult.truthId, id]
    ).catch(() => {});

    // Add consolidation relation
    await addRelation(alphaName, {
      sourceType: 'truth', sourceId: masterResult.truthId,
      targetType: 'truth', targetId: id,
      relationType: 'consolidates', confidence: 0.9,
      reasoning: `Consolidated into master truth #${masterResult.truthId}`,
    }).catch(() => {});
  }

  return { masterTruthId: masterResult.truthId, consolidatedCount: sourceTruthIds.length };
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 ENHANCED: FTS5 LOOKUP — Fast full-text search for think() pipeline
// Falls back to v7 LIKE queries if FTS5 not available
// ═══════════════════════════════════════════════════════════════════════════

async function lookupKnowledge(tokens, alphaName = null) {
  if (!omniDb || !tokens || tokens.length === 0) return { truths: [], vocabulary: [], concepts: [] };

  const searchTerms = tokens.filter(t => t.length > 3).slice(0, 8);
  let truths = [];

  // Try FTS5 first for fast full-text search
  const ftsQuery = searchTerms.join(' OR ');
  try {
    const ftsResults = await dbAll(omniDb,
      `SELECT t.* FROM truths_fts fts
       JOIN truths t ON t.id = fts.rowid
       WHERE truths_fts MATCH ? AND t.status = 'active' AND t.is_consolidated = 0
       ORDER BY rank LIMIT 20`,
      [ftsQuery]
    );
    if (ftsResults.length > 0) {
      truths = ftsResults;
    }
  } catch {
    // FTS5 not available — fall back to LIKE
  }

  // Fallback: v7 LIKE query if FTS returned nothing
  if (truths.length === 0) {
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
  }

  // Filter out consolidated truths (they've been replaced by master truths)
  truths = truths.filter(t => !t.is_consolidated);

  // Look up vocabulary and concepts
  let vocabulary = [];
  let concepts = [];
  for (const term of searchTerms) {
    const defs = await queryVocabulary(term);
    vocabulary.push(...defs);
    const found = await queryConcepts(term);
    concepts.push(...found);
  }

  // Sort truths by relevance — v8 FIX: score by token match count, not just confidence
  // A truth about "mathematics" should rank higher than one about "cryptography"
  // when the query is about "mathematics"
  const searchTermSet = new Set(searchTerms.map(t => t.toLowerCase()));
  truths.sort((a, b) => {
    // Count how many query tokens appear in each truth's claim
    const claimWordsA = (a.claim || '').toLowerCase().split(/\s+/);
    const claimWordsB = (b.claim || '').toLowerCase().split(/\s+/);
    const matchCountA = claimWordsA.filter(w => searchTermSet.has(w)).length;
    const matchCountB = claimWordsB.filter(w => searchTermSet.has(w)).length;

    // Primary sort: token match count (more matches = more relevant)
    if (matchCountA !== matchCountB) return matchCountB - matchCountA;

    // Secondary sort: confidence + endorsements
    const scoreA = a.confidence + (a.peer_endorsements * 0.1) - (a.peer_challenges * 0.05) + (a.is_derived ? 0.05 : 0);
    const scoreB = b.confidence + (b.peer_endorsements * 0.1) - (b.peer_challenges * 0.05) + (b.is_derived ? 0.05 : 0);
    return scoreB - scoreA;
  });

  // Mark as referenced
  for (const truth of truths.slice(0, 10)) {
    await dbRun(omniDb,
      `UPDATE truths SET times_referenced = times_referenced + 1, last_referenced = datetime('now') WHERE id = ?`,
      [truth.id]
    ).catch(() => {});
  }

  // v8: Also return active hypotheses relevant to these tokens
  let hypotheses = [];
  for (const term of searchTerms.slice(0, 4)) {
    const found = await dbAll(omniDb,
      `SELECT * FROM hypotheses WHERE status = 'proposed' AND LOWER(claim) LIKE ? LIMIT 3`,
      [`%${term.toLowerCase()}%`]
    );
    hypotheses.push(...found);
  }
  // Deduplicate hypotheses
  const seenHypIds = new Set();
  hypotheses = hypotheses.filter(h => {
    if (seenHypIds.has(h.id)) return false;
    seenHypIds.add(h.id);
    return true;
  });

  return {
    truths: truths.slice(0, 15),
    vocabulary: vocabulary.slice(0, 10),
    concepts: concepts.slice(0, 10),
    hypotheses: hypotheses.slice(0, 5),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// v7 PRESERVED: Query functions, research queue, gap analysis
// ═══════════════════════════════════════════════════════════════════════════

async function queryTruths({ domain = null, contributedBy = null, minConfidence = 0, status = null, searchText = null, limit = 20, offset = 0 } = {}) {
  if (!omniDb) return [];

  let where = ['1=1'];
  let params = [];

  if (domain) { where.push(`(domain = ? OR sub_domain = ?)`); params.push(domain, domain); }
  if (contributedBy) { where.push(`contributed_by = ?`); params.push(contributedBy.toLowerCase()); }
  if (minConfidence > 0) { where.push(`confidence >= ?`); params.push(minConfidence); }
  if (status) { where.push(`status = ?`); params.push(status); }
  if (searchText) {
    where.push(`(LOWER(claim) LIKE ? OR LOWER(definition) LIKE ? OR LOWER(synthesis_opinion) LIKE ?)`);
    const term = `%${searchText.toLowerCase()}%`;
    params.push(term, term, term);
  }

  params.push(limit, offset);

  return dbAll(omniDb,
    `SELECT * FROM truths WHERE ${where.join(' AND ')}
     ORDER BY confidence DESC, peer_endorsements DESC, created_at DESC LIMIT ? OFFSET ?`,
    params
  );
}

async function queryVocabulary(term, domain = null) {
  if (!omniDb) return [];
  if (domain) return dbAll(omniDb, `SELECT * FROM vocabulary_commons WHERE LOWER(term) = ? AND domain = ? ORDER BY confidence DESC`, [term.toLowerCase(), domain]);
  return dbAll(omniDb, `SELECT * FROM vocabulary_commons WHERE LOWER(term) = ? ORDER BY confidence DESC`, [term.toLowerCase()]);
}

async function queryConcepts(label, domain = null) {
  if (!omniDb) return [];
  if (domain) return dbAll(omniDb, `SELECT * FROM concepts_commons WHERE LOWER(label) = ? AND domain = ? ORDER BY confidence DESC`, [label.toLowerCase(), domain]);
  return dbAll(omniDb, `SELECT * FROM concepts_commons WHERE LOWER(label) = ? ORDER BY confidence DESC`, [label.toLowerCase()]);
}

async function getDiscourse(truthId) {
  if (!omniDb) return [];
  return dbAll(omniDb, `SELECT * FROM discourse WHERE truth_id = ? ORDER BY created_at ASC`, [truthId]);
}

async function getRelations(type, id) {
  if (!omniDb) return [];
  return dbAll(omniDb,
    `SELECT * FROM relations WHERE (source_type = ? AND source_id = ?) OR (target_type = ? AND target_id = ?) ORDER BY confidence DESC`,
    [type, id, type, id]
  );
}

async function queueResearch({ topic, domain = '', priority = 0.5, requestedBy = 'professor', assignedTo = '' } = {}) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  if (!topic) throw new Error('topic required');
  const result = await dbRun(omniDb, `INSERT INTO research_queue (topic, domain, priority, requested_by, assigned_to) VALUES (?, ?, ?, ?, ?)`,
    [topic, domain, priority, requestedBy, assignedTo]);
  return { queueId: result.lastID, topic, assignedTo };
}

async function claimResearch(alphaName, queueId) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  await dbRun(omniDb, `UPDATE research_queue SET assigned_to = ?, status = 'in-progress', started_at = datetime('now') WHERE id = ? AND status = 'queued'`,
    [alphaName.toLowerCase(), queueId]);
  return { queueId, assignedTo: alphaName };
}

async function completeResearch(queueId, truthIds = []) {
  if (!omniDb) throw new Error('omni-truth.db not initialized');
  await dbRun(omniDb, `UPDATE research_queue SET status = 'completed', result_truth_ids = ?, completed_at = datetime('now') WHERE id = ?`,
    [JSON.stringify(truthIds), queueId]);
  return { queueId, truthIds };
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 ENHANCED: GAP ANALYSIS — Now includes hypothesis tracking
// ═══════════════════════════════════════════════════════════════════════════

async function domainGapAnalysis(alphaName) {
  if (!omniDb) return { gaps: [], coverage: 0 };

  const assignment = DOMAIN_ASSIGNMENTS[alphaName.toLowerCase()];
  if (!assignment) return { gaps: [], coverage: 0 };

  const domainTruths = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM truths WHERE domain = ? AND status = 'active' AND is_consolidated = 0`, [assignment.primary]))?.c || 0;
  const lowConfidence = await dbAll(omniDb, `SELECT * FROM truths WHERE domain = ? AND confidence < 0.4 AND status = 'active' AND is_consolidated = 0 ORDER BY confidence ASC LIMIT 10`, [assignment.primary]);
  const contested = await dbAll(omniDb, `SELECT * FROM truths WHERE domain = ? AND verification_status = 'contested' AND status = 'active' ORDER BY peer_challenges DESC LIMIT 10`, [assignment.primary]);
  const pendingResearch = await dbAll(omniDb, `SELECT * FROM research_queue WHERE (domain = ? OR assigned_to = ?) AND status IN ('queued', 'in-progress')`, [assignment.primary, alphaName.toLowerCase()]);

  // v8: Active hypotheses in this domain
  const activeHypotheses = await dbAll(omniDb, `SELECT * FROM hypotheses WHERE domain = ? AND status = 'proposed' ORDER BY created_at DESC LIMIT 10`, [assignment.primary]);

  // v8: Open contradictions
  const openContradictions = await dbAll(omniDb,
    `SELECT c.*, ta.claim as claim_a, tb.claim as claim_b
     FROM contradictions c
     JOIN truths ta ON c.truth_a_id = ta.id
     JOIN truths tb ON c.truth_b_id = tb.id
     WHERE c.status = 'open' AND (ta.domain = ? OR tb.domain = ?)
     ORDER BY c.created_at DESC LIMIT 10`,
    [assignment.primary, assignment.primary]
  );

  // v8: Knowledge tree coverage
  const treeNodes = await dbAll(omniDb, `SELECT * FROM knowledge_tree WHERE domain = ? ORDER BY depth, label`, [assignment.primary]);
  const emptyNodes = treeNodes.filter(n => n.truth_count === 0);

  const subDomainCoverage = {};
  for (const sub of assignment.secondary) {
    const count = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM truths WHERE (domain = ? OR sub_domain = ?) AND status = 'active' AND is_consolidated = 0`, [sub, sub]))?.c || 0;
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
    activeHypotheses,
    openContradictions,
    treeNodes: treeNodes.length,
    emptyTreeNodes: emptyNodes.length,
    subDomainCoverage,
    gaps: [
      ...lowConfidence.map(t => ({ type: 'low-confidence', truthId: t.id, claim: t.claim, confidence: t.confidence })),
      ...contested.map(t => ({ type: 'contested', truthId: t.id, claim: t.claim, challenges: t.peer_challenges })),
      ...activeHypotheses.map(h => ({ type: 'hypothesis', hypothesisId: h.id, claim: h.claim, confidence: h.confidence })),
      ...openContradictions.map(c => ({ type: 'contradiction', contradictionId: c.id, claimA: c.claim_a, claimB: c.claim_b })),
      ...emptyNodes.map(n => ({ type: 'empty-tree-node', nodeId: n.id, path: n.path, label: n.label })),
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 ENHANCED: STATISTICS — Extended with inference and hypothesis data
// ═══════════════════════════════════════════════════════════════════════════

async function getOmniStats() {
  if (!omniDb) return {};

  const totalTruths = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM truths WHERE status = 'active' AND is_consolidated = 0`))?.c || 0;
  const totalDiscourse = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM discourse`))?.c || 0;
  const totalVocab = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM vocabulary_commons`))?.c || 0;
  const totalConcepts = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM concepts_commons`))?.c || 0;
  const totalRelations = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM relations`))?.c || 0;
  const totalSources = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM sources_registry`))?.c || 0;
  const avgConfidence = (await dbGet(omniDb, `SELECT AVG(confidence) as avg FROM truths WHERE status = 'active' AND is_consolidated = 0`))?.avg || 0;
  const peerVerified = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM truths WHERE verification_status = 'peer-verified'`))?.c || 0;
  const contested = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM truths WHERE verification_status = 'contested'`))?.c || 0;

  // v8 stats
  const totalInferences = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM inference_log`))?.c || 0;
  const totalHypotheses = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM hypotheses`))?.c || 0;
  const activeHypotheses = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM hypotheses WHERE status = 'proposed'`))?.c || 0;
  const promotedHypotheses = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM hypotheses WHERE status = 'promoted'`))?.c || 0;
  const derivedTruths = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM truths WHERE is_derived = 1 AND status = 'active'`))?.c || 0;
  const openContradictions = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM contradictions WHERE status = 'open'`))?.c || 0;
  const consolidatedTruths = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM truths WHERE is_consolidated = 1`))?.c || 0;
  const treeNodes = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM knowledge_tree`))?.c || 0;

  // Per-Alpha contribution counts
  const alphaContributions = {};
  for (const alpha of Object.keys(DOMAIN_ASSIGNMENTS)) {
    const truthCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM truths WHERE contributed_by = ?`, [alpha]))?.c || 0;
    const discourseCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM discourse WHERE contributed_by = ?`, [alpha]))?.c || 0;
    const inferenceCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM inference_log WHERE derived_by = ?`, [alpha]))?.c || 0;
    const hypothesisCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM hypotheses WHERE proposed_by = ?`, [alpha]))?.c || 0;
    const relationCount = (await dbGet(omniDb, `SELECT COUNT(*) as c FROM relations WHERE contributed_by = ?`, [alpha]))?.c || 0;
    alphaContributions[alpha] = {
      truths: truthCount, discourse: discourseCount, inferences: inferenceCount,
      hypotheses: hypothesisCount, relations: relationCount,
    };
  }

  // Domain distribution
  const domains = await dbAll(omniDb,
    `SELECT domain, COUNT(*) as count, AVG(confidence) as avg_confidence
     FROM truths WHERE status = 'active' AND is_consolidated = 0 GROUP BY domain ORDER BY count DESC`
  );

  // v8: Strength production stats
  const strengthProduction = await dbAll(omniDb,
    `SELECT strength_type, action_type, COUNT(*) as count, AVG(confidence) as avg_confidence
     FROM strength_knowledge_log GROUP BY strength_type, action_type ORDER BY count DESC`
  );

  return {
    totalTruths, totalDiscourse, totalVocab, totalConcepts, totalRelations, totalSources,
    avgConfidence: parseFloat(avgConfidence.toFixed(4)), peerVerified, contested,
    // v8
    totalInferences, totalHypotheses, activeHypotheses, promotedHypotheses,
    derivedTruths, openContradictions, consolidatedTruths, treeNodes,
    strengthProduction,
    alphaContributions,
    domains: domains.map(d => ({
      domain: d.domain, count: d.count,
      avgConfidence: parseFloat((d.avg_confidence || 0).toFixed(4)),
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// v7 PRESERVED: Ethics evaluation
// ═══════════════════════════════════════════════════════════════════════════

async function evaluateContributionEthics(targetType, targetId, contributedBy, text) {
  if (!omniDb) return null;

  const lower = text.toLowerCase();
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
    `INSERT INTO ethics_review (target_type, target_id, contributed_by, turing_score, asimov_score, dynham_score, composite_score, flags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [targetType, targetId, contributedBy, turing, asimov, dynham, composite, JSON.stringify(flags)]
  ).catch(() => {});

  return { turing, asimov, dynham, composite, flags };
}

// ═══════════════════════════════════════════════════════════════════════════
// v8: STRENGTH KNOWLEDGE METRICS — Per-Alpha production analytics
// ═══════════════════════════════════════════════════════════════════════════

async function getStrengthKnowledgeStats(alphaName) {
  if (!omniDb) return {};

  const stats = await dbAll(omniDb,
    `SELECT action_type, COUNT(*) as count, AVG(confidence) as avg_conf,
            SUM(was_validated) as validated, SUM(was_challenged) as challenged
     FROM strength_knowledge_log WHERE alpha_name = ?
     GROUP BY action_type ORDER BY count DESC`,
    [alphaName.toLowerCase()]
  );

  const relationTypes = await dbAll(omniDb,
    `SELECT relation_type, COUNT(*) as count FROM strength_knowledge_log
     WHERE alpha_name = ? AND relation_type != '' GROUP BY relation_type ORDER BY count DESC`,
    [alphaName.toLowerCase()]
  );

  const total = stats.reduce((sum, s) => sum + s.count, 0);

  return {
    alpha: alphaName,
    totalProductions: total,
    byAction: stats.map(s => ({
      action: s.action_type, count: s.count,
      avgConfidence: parseFloat((s.avg_conf || 0).toFixed(4)),
      validated: s.validated || 0, challenged: s.challenged || 0,
    })),
    relationTypes: relationTypes.map(r => ({ type: r.relation_type, count: r.count })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS — v7 fully preserved + v8 additions
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Initialization
  initOmniTruth,
  getOmniDb,

  // Domain assignments
  DOMAIN_ASSIGNMENTS,

  // Write operations — v7 preserved
  contributeTruth,
  addDiscourse,
  defineVocabulary,
  contributeConcept,
  addRelation,

  // Research pipeline — v7 preserved
  queueResearch,
  claimResearch,
  completeResearch,

  // Read operations — v7 preserved, v8 enhanced (FTS5, hypothesis awareness)
  lookupKnowledge,
  queryTruths,
  queryVocabulary,
  queryConcepts,
  getDiscourse,
  getRelations,

  // Analysis — v7 preserved, v8 enhanced
  domainGapAnalysis,
  getOmniStats,

  // Ethics — v7 preserved
  evaluateContributionEthics,

  // v8 NEW: Deep Cognition
  logInference,
  proposeHypothesis,
  reviewHypothesis,
  promoteHypothesis,
  registerContradiction,

  // v8 NEW: Knowledge Tree
  addTreeNode,
  placeTruthInTree,
  getTreeBranch,

  // v8 NEW: Consolidation
  consolidateTruths,

  // v8 NEW: Strength Knowledge Metrics
  getStrengthKnowledgeStats,

  // Constants — extended for v8
  DISCOURSE_TYPES,
  RELATION_TYPES: RELATION_TYPES_V8,
  STRENGTH_RELATION_MAP,
};
