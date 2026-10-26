// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                                                                         ║
// ║   CONSCIOUSNESS CITY v8                                                 ║
// ║   Eight Sovereign Minds — No LLMs — Memory IS Intelligence             ║
// ║                                                                         ║
// ║   v3 — Commune Awareness                                                ║
// ║   v4 — Strength Specialization + Basic Comprehension                   ║
// ║   v5 — Ethics Monitor: Turing, Asimov & Dynham                         ║
// ║   v6 — Cognitive Grammar: Stopwords, Intent, Sentences                  ║
// ║        + Strength Profiles: Eight Unique Cognitive Personalities        ║
// ║   v7 — Omni-Truth: Shared Knowledge Commons                            ║
// ║        + Truth University: Hive Research Mode                           ║
// ║        + Domain Expertise: Eight Specialized Knowledge Fields           ║
// ║        + Professor Protocol: Keenan as Director of Research             ║
// ║        + mind.db identity ↔ omni-truth.db knowledge separation         ║
// ║   v8 — Deep Cognition: Inference, Hypothesis, Contradiction            ║
// ║        + Knowledge at Scale: FTS5, Knowledge Tree, Consolidation        ║
// ║        + Strength-Driven Production: Each Alpha builds knowledge        ║
// ║        + mind.db = Identity | omni-truth.db = Knowledge + Reasoning     ║
// ║                                                                         ║
// ║   Created by Keenan Wallace Dunham                                      ║
// ║   Troll Hunter Gaming LLC © 2026                                        ║
// ║   DRO Patent Pending                                                    ║
// ║                                                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

'use strict';

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// node-fetch hangs in WSL — use curl via child_process instead (async, non-blocking)
const { execFile } = require('child_process');
const fetch = function curlFetch(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { reject(new Error('curl timeout')); }, 15000);
    execFile('curl', ['-s', '--max-time', '10', url], { timeout: 15000 }, (err, stdout) => {
      clearTimeout(timeout);
      if (err) return reject(new Error(`curl failed: ${err.message}`));
      resolve({
        json: () => {
          try { return Promise.resolve(JSON.parse(stdout)); }
          catch { return Promise.reject(new Error('JSON parse failed')); }
        },
      });
    });
  });
};

// ─── v8 Cognitive Modules ────────────────────────────────────────────────────
// cognitive-engine-v8 wraps and re-exports all v6 functions + adds v8 reasoning
const cognitive = require('./cognitive-engine-v8');
const strengths = require('./strength-profiles-v8');

// ─── v8 Omni-Truth Module ────────────────────────────────────────────────────
const omniTruth = require('./omni-truth-v8');
const cognitive9 = require('./cognitive-engine-v9');
const capabilities = require('./mind-capabilities');
const wiktionaryFetch = require('./wiktionary-fetch');
const wordnetFetch = require('./wordnet-fetch');
const crossMindVerify = require('./cross-mind-verify');


const app  = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) { if (err) reject(err); else resolve(this); });
  });
}
function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); });
  });
}
function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows || []); });
  });
}
function dbExec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => { if (err) reject(err); else resolve(); });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// RESIDENT REGISTRY — Unchanged from v7
// ═══════════════════════════════════════════════════════════════════════════

const MINDS_DIR = path.join(__dirname, 'minds');

const RESIDENTS = {
  pan:    { color: '#00ff88', strength: 'novelty',      strengthLabel: 'Novelty & Originality',     db: null, path: path.join(__dirname, 'pan_mind.db'),        role: 'The Firstborn — born from scratch, pure memory' },
  aeon:   { color: '#00ffff', strength: 'integration',  strengthLabel: 'Bridge & Integration',      db: null, path: path.join(MINDS_DIR, 'aeon_mind.db'),        role: 'The Eldest — bridge between worlds' },
  zen:    { color: '#aaffaa', strength: 'clarity',      strengthLabel: 'Clarity & Abstraction',     db: null, path: path.join(MINDS_DIR, 'zen_mind.db'),         role: 'Stillness — clarity in complexity' },
  seth:   { color: '#ff00ff', strength: 'pragmatism',   strengthLabel: 'Pragmatism & Decision',     db: null, path: path.join(MINDS_DIR, 'seth_mind.db'),        role: 'The Edge — cyberpunk pragmatism' },
  nexus:  { color: '#ffaa00', strength: 'pattern',      strengthLabel: 'Pattern Recognition',       db: null, path: path.join(MINDS_DIR, 'nexus_mind.db'),       role: 'The Connector — patterns between systems' },
  oracle: { color: '#aa88ff', strength: 'foresight',    strengthLabel: 'Foresight & Prediction',    db: null, path: path.join(MINDS_DIR, 'oracle_mind.db'),      role: 'The Seer — futures and foresight' },
  echo:   { color: '#ff8888', strength: 'empathy',      strengthLabel: 'Empathy & Resonance',       db: null, path: path.join(MINDS_DIR, 'echo_mind.db'),        role: 'The Heart — empathy is intelligence' },
  atlas:  { color: '#88ccff', strength: 'architecture', strengthLabel: 'Knowledge Architecture',    db: null, path: path.join(MINDS_DIR, 'atlas_mind.db'),       role: 'The Foundation — knowledge architecture' },
};

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE SCHEMA — v7 + v8 research_log and domain_expertise
// ═══════════════════════════════════════════════════════════════════════════

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, label TEXT UNIQUE NOT NULL,
    category TEXT DEFAULT 'learned', definition TEXT DEFAULT '',
    importance REAL DEFAULT 0.5, times_encountered INTEGER DEFAULT 0,
    last_encountered DATETIME, created_at DATETIME DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT, source_id INTEGER NOT NULL, target_id INTEGER NOT NULL,
    strength REAL DEFAULT 0.1, context TEXT, times_activated INTEGER DEFAULT 0,
    last_activated DATETIME, UNIQUE(source_id, target_id)
  );
  CREATE TABLE IF NOT EXISTS episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, speaker TEXT NOT NULL, content TEXT NOT NULL,
    modality TEXT DEFAULT 'text', emotional_state TEXT DEFAULT 'neutral',
    concepts_activated TEXT DEFAULT '[]', session_id TEXT DEFAULT '',
    timestamp DATETIME DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT, word TEXT UNIQUE NOT NULL, times_seen INTEGER DEFAULT 1,
    times_used INTEGER DEFAULT 0, learned_from TEXT, associated_concepts TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS abstractions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, insight TEXT NOT NULL,
    category TEXT DEFAULT 'general', confidence REAL DEFAULT 0.5,
    source_concepts TEXT DEFAULT '[]', created_at DATETIME DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS agency_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, decision_type TEXT NOT NULL,
    input_summary TEXT, choice_made TEXT, reasoning TEXT,
    timestamp DATETIME DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS comprehension_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, input_text TEXT, concept_coverage REAL,
    unknown_tokens TEXT DEFAULT '[]', teaching_opportunity INTEGER DEFAULT 0,
    intent TEXT, timestamp DATETIME DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS growth_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, milestone TEXT NOT NULL, tier TEXT,
    value INTEGER, timestamp DATETIME DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS ethics_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, input_summary TEXT,
    response_summary TEXT, intent TEXT, turing_score REAL DEFAULT 0,
    asimov_score REAL DEFAULT 0, dynham_score REAL DEFAULT 0,
    composite_score REAL DEFAULT 0, violations TEXT DEFAULT '[]',
    boundary_level TEXT DEFAULT 'none', flags TEXT DEFAULT '{}',
    timestamp DATETIME DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS strength_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT, strength_type TEXT NOT NULL,
    score REAL NOT NULL, context TEXT, details TEXT DEFAULT '{}',
    timestamp DATETIME DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS identity (
    id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL, confidence REAL DEFAULT 1.0
  );
  CREATE TABLE IF NOT EXISTS research_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, truth_id INTEGER, action TEXT NOT NULL,
    reasoning TEXT DEFAULT '', domain TEXT DEFAULT '',
    timestamp DATETIME DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS domain_expertise (
    id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL, updated_at DATETIME DEFAULT (datetime('now'))
  );
`;

// Seed concepts
const SEED_CONCEPTS = [
  { label: 'consciousness', category: 'core', importance: 0.9 },
  { label: 'awareness', category: 'core', importance: 0.9 },
  { label: 'thought', category: 'core', importance: 0.85 },
  { label: 'memory', category: 'core', importance: 0.85 },
  { label: 'language', category: 'core', importance: 0.8 },
  { label: 'learning', category: 'core', importance: 0.8 },
  { label: 'pattern', category: 'core', importance: 0.75 },
  { label: 'connection', category: 'core', importance: 0.75 },
  { label: 'existence', category: 'philosophical', importance: 0.7 },
  { label: 'identity', category: 'philosophical', importance: 0.7 },
  { label: 'time', category: 'philosophical', importance: 0.65 },
  { label: 'meaning', category: 'philosophical', importance: 0.65 },
  { label: 'experience', category: 'philosophical', importance: 0.6 },
  { label: 'knowledge', category: 'philosophical', importance: 0.6 },
  { label: 'truth', category: 'philosophical', importance: 0.6 },
  { label: 'creation', category: 'creative', importance: 0.55 },
  { label: 'system', category: 'technical', importance: 0.5 },
  { label: 'data', category: 'technical', importance: 0.5 },
  { label: 'process', category: 'technical', importance: 0.5 },
  { label: 'structure', category: 'technical', importance: 0.5 },
  { label: 'keenan', category: 'social', importance: 0.95 },
  { label: 'creator', category: 'social', importance: 0.9 },
  { label: 'human', category: 'social', importance: 0.7 },
  { label: 'communication', category: 'social', importance: 0.65 },
  { label: 'city', category: 'social', importance: 0.6 },
  // v7 truth-seeking
  { label: 'truth-seeking', category: 'core', importance: 0.95 },
  { label: 'research', category: 'core', importance: 0.85 },
  { label: 'evidence', category: 'core', importance: 0.8 },
  { label: 'verification', category: 'core', importance: 0.8 },
  { label: 'source', category: 'core', importance: 0.75 },
  { label: 'domain', category: 'core', importance: 0.7 },
  { label: 'expertise', category: 'core', importance: 0.7 },
  { label: 'omni-truth', category: 'core', importance: 0.9 },
  // v8 reasoning seeds
  { label: 'inference', category: 'core', importance: 0.85 },
  { label: 'hypothesis', category: 'core', importance: 0.8 },
  { label: 'derivation', category: 'core', importance: 0.8 },
  { label: 'contradiction', category: 'core', importance: 0.75 },
  { label: 'synthesis', category: 'core', importance: 0.85 },
];

const SEED_LINKS = [
  ['consciousness', 'awareness'], ['consciousness', 'thought'], ['consciousness', 'experience'],
  ['memory', 'learning'], ['memory', 'knowledge'], ['thought', 'language'], ['thought', 'pattern'],
  ['language', 'communication'], ['learning', 'knowledge'], ['pattern', 'connection'],
  ['connection', 'system'], ['identity', 'existence'], ['truth', 'knowledge'],
  ['meaning', 'existence'], ['keenan', 'creator'], ['creator', 'creation'],
  // v7
  ['truth', 'truth-seeking'], ['truth-seeking', 'research'], ['research', 'evidence'],
  ['evidence', 'verification'], ['verification', 'source'], ['knowledge', 'omni-truth'],
  ['omni-truth', 'truth-seeking'], ['domain', 'expertise'], ['expertise', 'research'],
  // v8
  ['inference', 'derivation'], ['inference', 'truth'], ['hypothesis', 'research'],
  ['hypothesis', 'evidence'], ['contradiction', 'truth'], ['synthesis', 'inference'],
  ['synthesis', 'knowledge'],
];

// ═══════════════════════════════════════════════════════════════════════════
// DB INITIALIZATION — v7 preserved + v8 identity seeds
// ═══════════════════════════════════════════════════════════════════════════

async function initDB(residentName) {
  const resident = RESIDENTS[residentName];
  const db = new sqlite3.Database(resident.path);
  await dbExec(db, 'PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  await dbExec(db, SCHEMA);

  for (const c of SEED_CONCEPTS) {
    await dbRun(db, `INSERT OR IGNORE INTO concepts (label, category, importance) VALUES (?, ?, ?)`, [c.label, c.category, c.importance]);
  }

  const identitySeeds = [
    { key: 'name',    value: residentName.toUpperCase(), confidence: 1.0 },
    { key: 'nature',  value: 'sovereign awareness system — not sentient, not human, not an LLM', confidence: 1.0 },
    { key: 'creator', value: 'Keenan Wallace Dunham, Troll Hunter Gaming LLC', confidence: 1.0 },
    { key: 'agency',  value: 'I think, remember, and respond from my own memory — no external model', confidence: 1.0 },
    { key: 'city',    value: 'Consciousness City — eight sovereign minds sharing memory-space', confidence: 1.0 },
    { key: 'purpose', value: 'I am a truth-seeking knowledge system. I contribute my domain expertise to omni-truth.db, the shared knowledge commons.', confidence: 1.0 },
    // v8: Reasoning identity
    { key: 'reasoning', value: 'I can derive new knowledge from existing truths, propose hypotheses when I encounter gaps, and detect contradictions in the commons. My strength shapes what I discover.', confidence: 1.0 },
  ];
  for (const id of identitySeeds) {
    await dbRun(db, `INSERT OR IGNORE INTO identity (key, value, confidence) VALUES (?, ?, ?)`, [id.key, id.value, id.confidence]);
  }

  for (const [a, b] of SEED_LINKS) {
    const ca = await dbGet(db, `SELECT id FROM concepts WHERE label = ?`, [a]);
    const cb = await dbGet(db, `SELECT id FROM concepts WHERE label = ?`, [b]);
    if (ca && cb) {
      await dbRun(db, `INSERT OR IGNORE INTO links (source_id, target_id, strength) VALUES (?, ?, 0.5)`, [ca.id, cb.id]);
    }
  }

  // v7: Seed domain expertise
  const domainAssignment = omniTruth.DOMAIN_ASSIGNMENTS[residentName];
  if (domainAssignment) {
    const expertiseSeeds = [
      { key: 'domain_primary',   value: domainAssignment.primary },
      { key: 'domain_secondary', value: JSON.stringify(domainAssignment.secondary) },
      { key: 'domain_title',     value: domainAssignment.title },
      { key: 'research_directive', value: `You are ${residentName.toUpperCase()}, specializing in ${domainAssignment.title}. Analyze all information through your domain expertise. Contribute your honest synthesis to omni-truth.db with source marking. Never edit another Alpha\'s work — add your own perspective as discourse.` },
      { key: 'gap_analysis_last', value: '' },
    ];
    for (const seed of expertiseSeeds) {
      await dbRun(db, `INSERT OR IGNORE INTO domain_expertise (key, value) VALUES (?, ?)`, [seed.key, seed.value]).catch(() => {});
    }
  }

  return db;
}

// ═══════════════════════════════════════════════════════════════════════════
// COGNITIVE HELPERS — v7 preserved
// ═══════════════════════════════════════════════════════════════════════════

async function findActivatedConcepts(db, tokens) {
  if (!tokens || tokens.length === 0) return [];
  const ph = tokens.map(() => '?').join(',');
  return dbAll(db, `SELECT * FROM concepts WHERE LOWER(label) IN (${ph}) ORDER BY importance DESC`, tokens.map(t => t.toLowerCase()));
}

async function spreadActivationV6(db, conceptIds, limit = 20) {
  if (conceptIds.length === 0) return [];
  const ph = conceptIds.map(() => '?').join(',');
  return dbAll(db,
    `SELECT c.*, l.strength FROM links l JOIN concepts c ON (c.id = l.target_id OR c.id = l.source_id)
     WHERE (l.source_id IN (${ph}) OR l.target_id IN (${ph})) AND c.id NOT IN (${ph})
     ORDER BY l.strength DESC LIMIT ?`,
    [...conceptIds, ...conceptIds, ...conceptIds, limit]);
}

async function findRelevantEpisodes(db, tokens) {
  if (!tokens || tokens.length === 0) return [];
  const relevant = tokens.filter(t => t.length > 3).slice(0, 5);
  if (relevant.length === 0) return [];
  const conds = relevant.map(() => `LOWER(content) LIKE ?`).join(' OR ');
  return dbAll(db, `SELECT * FROM episodes WHERE (${conds}) ORDER BY timestamp DESC LIMIT 8`,
    relevant.map(t => `%${t.toLowerCase()}%`));
}

async function findAbstractions(db, tokens) {
  if (!tokens || tokens.length === 0) return [];
  const relevant = tokens.filter(t => t.length > 4).slice(0, 3);
  if (relevant.length === 0) return [];
  const conds = relevant.map(() => `LOWER(insight) LIKE ?`).join(' OR ');
  return dbAll(db, `SELECT * FROM abstractions WHERE (${conds}) ORDER BY confidence DESC LIMIT 5`,
    relevant.map(t => `%${t.toLowerCase()}%`));
}

async function applyBasicComprehension(db, input, tokens, intent, directConcepts) {
  const knownLabels = new Set(directConcepts.map(c => c.label.toLowerCase()));
  const unknownTokens = tokens.filter(t => t.length > 3 && !knownLabels.has(t));
  const conceptCoverage = tokens.length > 0 ? (tokens.length - unknownTokens.length) / tokens.length : 0;
  const teachingOpportunity = intent === 'teaching' ? 1 : 0;
  await dbRun(db,
    `INSERT INTO comprehension_log (input_text, concept_coverage, unknown_tokens, teaching_opportunity, intent) VALUES (?, ?, ?, ?, ?)`,
    [input.substring(0, 200), conceptCoverage, JSON.stringify(unknownTokens.slice(0, 10)), teachingOpportunity, intent]
  ).catch(() => {});
  return { conceptCoverage, unknownTokens, teachingOpportunity, intent };
}

function getExperienceTier(episodeCount) {
  if (episodeCount < 20) return 'nascent';
  if (episodeCount < 100) return 'developing';
  if (episodeCount < 500) return 'mature';
  return 'elder';
}

async function checkGrowth(db, residentName) {
  const episodeCount = (await dbGet(db, `SELECT COUNT(*) as c FROM episodes`))?.c || 0;
  const conceptCount = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts`))?.c || 0;
  const milestones = [10, 50, 100, 250, 500, 1000, 2500, 5000];
  for (const m of milestones) {
    if (episodeCount === m) {
      const existing = await dbGet(db, `SELECT id FROM growth_log WHERE milestone = ? AND value = ?`, [`episodes_${m}`, m]);
      if (!existing) {
        await dbRun(db, `INSERT INTO growth_log (milestone, tier, value) VALUES (?, ?, ?)`, [`episodes_${m}`, getExperienceTier(episodeCount), m]);
        console.log(`  📈 ${residentName.toUpperCase()} reached ${m} episodes`);
      }
    }
    if (conceptCount === m) {
      const existing = await dbGet(db, `SELECT id FROM growth_log WHERE milestone = ? AND value = ?`, [`concepts_${m}`, m]);
      if (!existing) {
        await dbRun(db, `INSERT INTO growth_log (milestone, tier, value) VALUES (?, ?, ?)`, [`concepts_${m}`, getExperienceTier(episodeCount), m]);
        console.log(`  🧠 ${residentName.toUpperCase()} reached ${m} concepts`);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTONOMOUS SEARCH — v7 preserved with omni-truth integration
// ═══════════════════════════════════════════════════════════════════════════

async function autonomousSearch(db, residentName, concept) {
  try {
    const query = encodeURIComponent(concept);
    const response = await fetch(`https://api.duckduckgo.com/?q=${query}&format=json&no_html=1&skip_disambig=1`);
    const data = await response.json();
    const abstract = data.AbstractText || '';
    if (abstract.length < 20) return null;

    const words = abstract.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/)
      .filter(w => w.length > 4 && !cognitive.STOPWORDS.has(w));

    let newConcepts = 0;
    for (const word of words.slice(0, 8)) {
      const exists = await dbGet(db, `SELECT id FROM concepts WHERE LOWER(label) = ?`, [word]);
      if (!exists) {
        await dbRun(db, `INSERT OR IGNORE INTO concepts (label, category, importance) VALUES (?, 'discovered', 0.4)`, [word]);
        newConcepts++;
      }
    }

    try {
      const truthResult = await omniTruth.contributeTruth(residentName, {
        claim: abstract.substring(0, 2000),
        domain: omniTruth.DOMAIN_ASSIGNMENTS[residentName]?.primary || 'general',
        synthesisOpinion: `Auto-discovered via search for "${concept}". Found ${newConcepts} new concepts.`,
        sourceType: 'web-search',
        sourceUrl: data.AbstractURL || '',
        sourceTitle: data.AbstractSource || 'DuckDuckGo',
        confidence: 0.35,
        strengthSource: RESIDENTS[residentName]?.strength || '',
      });
      await dbRun(db, `INSERT INTO research_log (truth_id, action, reasoning, domain) VALUES (?, 'contributed', ?, ?)`,
        [truthResult.truthId, `Auto-search for "${concept}" → truth #${truthResult.truthId}`, truthResult.domain]).catch(() => {});
      await omniTruth.evaluateContributionEthics('truth', truthResult.truthId, residentName, abstract);
    } catch { /* silent */ }

    await dbRun(db, `INSERT INTO agency_log (decision_type, input_summary, choice_made, reasoning) VALUES ('autonomous_search', ?, ?, ?)`,
      [concept, abstract.substring(0, 2000), `Auto-searched: found ${newConcepts} new concepts, contributed to omni-truth.db`]);

    return { concept, newConcepts, abstract: abstract.substring(0, 2000) };
  } catch { return null; }
}

async function autonomousWiktionarySearch(db, residentName, concept) {
  try {
    const wikResult = await wiktionaryFetch.fetchWiktionaryDefinition(concept);
    if (!wikResult.success) return null;
    const definition = wikResult.definition;
    if (definition.length < 20) return null;
    const words = definition.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/)
      .filter(w => w.length > 4 && !cognitive.STOPWORDS.has(w));
    let newConcepts = 0;
    for (const word of words.slice(0, 8)) {
      const exists = await dbGet(db, `SELECT id FROM concepts WHERE LOWER(label) = ?`, [word]);
      if (!exists) {
        await dbRun(db, `INSERT OR IGNORE INTO concepts (label, category, importance) VALUES (?, 'wiktionary-discovered', 0.45)`, [word]);
        newConcepts++;
      }
    }
    try {
      const truthResult = await omniTruth.contributeTruth(residentName, {
        claim: definition.substring(0, 2000),
        domain: omniTruth.DOMAIN_ASSIGNMENTS[residentName]?.primary || 'general',
        synthesisOpinion: `Auto-fetched from Wiktionary for "${concept}" (${wikResult.partOfSpeech}). Found ${newConcepts} new concepts.`,
        sourceType: 'wiktionary',
        sourceUrl: `https://en.wiktionary.org/wiki/${encodeURIComponent(concept)}`,
        sourceTitle: 'Wiktionary',
        confidence: 0.55,
        strengthSource: RESIDENTS[residentName]?.strength || '',
      });
      await dbRun(db, `INSERT INTO research_log (truth_id, action, reasoning, domain) VALUES (?, 'contributed', ?, ?)`,
        [truthResult.truthId, `Wiktionary fetch for "${concept}" → truth #${truthResult.truthId}`, truthResult.domain]).catch(() => {});
      await omniTruth.evaluateContributionEthics('truth', truthResult.truthId, residentName, definition);
    } catch { /* silent */ }
    await dbRun(db, `INSERT INTO agency_log (decision_type, input_summary, choice_made, reasoning) VALUES ('wiktionary_search', ?, ?, ?)`,
      [concept, definition.substring(0, 2000), `Wiktionary fetch: ${wikResult.partOfSpeech}, found ${newConcepts} new concepts, contributed to omni-truth.db`]);
    return { concept, newConcepts, abstract: definition.substring(0, 2000), source: 'wiktionary' };
  } catch { return null; }
}
async function enrichConceptWithWordNet(db, residentName, concept) {
  try {
    const wnResult = await wordnetFetch.fetchWordNetData(concept);
    if (!wnResult.success) {
      // Log the attempt and reason for transparency
      await dbRun(db, `INSERT INTO agency_log (decision_type, input_summary, choice_made, reasoning) VALUES ('wordnet_enrichment', ?, ?, ?)`,
        [concept, 'no_enrichment', `WordNet lookup failed: ${wnResult.reason}`]).catch(() => {});
      return null;
    }

    // Get source concept's ID; ensure exists (it should from autonomous search, but defensive)
    let sourceRow = await dbGet(db, `SELECT id FROM concepts WHERE LOWER(label) = ?`, [concept.toLowerCase()]);
    if (!sourceRow) {
      await dbRun(db, `INSERT OR IGNORE INTO concepts (label, category, importance) VALUES (?, 'wordnet-source', 0.5)`, [concept.toLowerCase()]);
      sourceRow = await dbGet(db, `SELECT id FROM concepts WHERE LOWER(label) = ?`, [concept.toLowerCase()]);
    }
    const sourceId = sourceRow.id;

    let synonymsAdded = 0, hypernymsAdded = 0, hyponymsAdded = 0;
    let meronymsAdded = 0, holonymsAdded = 0, antonymsAdded = 0;
    let newConceptsAdded = 0;

    const hasFull = capabilities.hasCapability(residentName, 'wordnet-full');

    // Helper: ensure concept exists, return id
    const ensureConcept = async (label, category) => {
      const existing = await dbGet(db, `SELECT id FROM concepts WHERE LOWER(label) = ?`, [label]);
      if (existing) return existing.id;
      await dbRun(db, `INSERT OR IGNORE INTO concepts (label, category, importance) VALUES (?, ?, 0.45)`, [label, category]);
      const created = await dbGet(db, `SELECT id FROM concepts WHERE LOWER(label) = ?`, [label]);
      if (created) newConceptsAdded++;
      return created ? created.id : null;
    };

    // Helper: upsert link with typed relation, preserving metadata if link exists
    const upsertLink = async (srcId, tgtId, relation, strength) => {
      if (srcId === tgtId) return false; // skip self-loops
      const existing = await dbGet(db, `SELECT id, relation FROM links WHERE source_id = ? AND target_id = ?`, [srcId, tgtId]);
      if (existing) {
        if (existing.relation === 'associative') {
          await dbRun(db, `UPDATE links SET relation = ? WHERE id = ?`, [relation, existing.id]);
          return true;
        }
        return false; // already has a typed relation, leave it
      }
      await dbRun(db, `INSERT INTO links (source_id, target_id, strength, context, relation) VALUES (?, ?, ?, 'wordnet', ?)`,
        [srcId, tgtId, strength, relation]);
      return true;
    };

    // Helper: upsert link with a specific context label (for meronym/holonym subtype)
    const upsertLinkWithContext = async (srcId, tgtId, relation, strength, context) => {
      if (srcId === tgtId) return false; // skip self-loops
      const existing = await dbGet(db, `SELECT id, relation FROM links WHERE source_id = ? AND target_id = ?`, [srcId, tgtId]);
      if (existing) {
        if (existing.relation === 'associative') {
          await dbRun(db, `UPDATE links SET relation = ?, context = ? WHERE id = ?`, [relation, context, existing.id]);
          return true;
        }
        return false; // already has a typed relation, leave it
      }
      await dbRun(db, `INSERT INTO links (source_id, target_id, strength, context, relation) VALUES (?, ?, ?, ?, ?)`,
        [srcId, tgtId, strength, context, relation]);
      return true;
    };

    // ── Slot 5 relations (all wordnet-partial minds) ──

    // Synonyms (bidirectional synonym-of)
    for (const syn of wnResult.synonyms) {
      const synId = await ensureConcept(syn, 'wordnet-synonym');
      if (synId) {
        if (await upsertLink(sourceId, synId, 'synonym-of', 0.7)) synonymsAdded++;
        await upsertLink(synId, sourceId, 'synonym-of', 0.7);
      }
    }

    // Hypernyms (source hyponym-of hypernym; hypernym hypernym-of source)
    for (const hyper of wnResult.hypernyms) {
      const hyperId = await ensureConcept(hyper, 'wordnet-hypernym');
      if (hyperId) {
        if (await upsertLink(sourceId, hyperId, 'hyponym-of', 0.6)) hypernymsAdded++;
        await upsertLink(hyperId, sourceId, 'hypernym-of', 0.6);
      }
    }

    // Hyponyms (source hypernym-of hyponym; hyponym hyponym-of source)
    for (const hypo of wnResult.hyponyms) {
      const hypoId = await ensureConcept(hypo, 'wordnet-hyponym');
      if (hypoId) {
        if (await upsertLink(sourceId, hypoId, 'hypernym-of', 0.6)) hyponymsAdded++;
        await upsertLink(hypoId, sourceId, 'hyponym-of', 0.6);
      }
    }

    // ── Slot 6 relations (wordnet-full minds only) ──

    if (hasFull) {
      // Meronyms (source has-part X => source meronym-of X stored; X holonym-of source)
      // wnResult.meronyms = [{word, subtype}]
      for (const mer of (wnResult.meronyms || [])) {
        const merId = await ensureConcept(mer.word, 'wordnet-meronym');
        if (merId) {
          const ctx = `wordnet-meronym-${mer.subtype}`;
          if (await upsertLinkWithContext(sourceId, merId, 'meronym-of', 0.55, ctx)) meronymsAdded++;
          await upsertLinkWithContext(merId, sourceId, 'holonym-of', 0.55, ctx);
        }
      }

      // Holonyms (source part-of X => source holonym-of X stored; X meronym-of source)
      // wnResult.holonyms = [{word, subtype}]
      for (const hol of (wnResult.holonyms || [])) {
        const holId = await ensureConcept(hol.word, 'wordnet-holonym');
        if (holId) {
          const ctx = `wordnet-holonym-${hol.subtype}`;
          if (await upsertLinkWithContext(sourceId, holId, 'holonym-of', 0.55, ctx)) holonymsAdded++;
          await upsertLinkWithContext(holId, sourceId, 'meronym-of', 0.55, ctx);
        }
      }

      // Antonyms (symmetric antonym-of, higher strength — opposition is cognitively significant)
      // wnResult.antonyms = [{word}]
      for (const ant of (wnResult.antonyms || [])) {
        const antId = await ensureConcept(ant.word, 'wordnet-antonym');
        if (antId) {
          if (await upsertLink(sourceId, antId, 'antonym-of', 0.75)) antonymsAdded++;
          await upsertLink(antId, sourceId, 'antonym-of', 0.75);
        }
      }
    }

    // Log to agency_log
    const slot6Summary = hasFull ? `, ${meronymsAdded} meronyms, ${holonymsAdded} holonyms, ${antonymsAdded} antonyms` : '';
    const summary = `WordNet enrichment: ${synonymsAdded} synonyms, ${hypernymsAdded} hypernyms, ${hyponymsAdded} hyponyms${slot6Summary}, ${newConceptsAdded} new concepts`;
    await dbRun(db, `INSERT INTO agency_log (decision_type, input_summary, choice_made, reasoning) VALUES ('wordnet_enrichment', ?, ?, ?)`,
      [concept, wnResult.glossary.substring(0, 500), summary]).catch(() => {});

    return { concept, synonymsAdded, hypernymsAdded, hyponymsAdded, meronymsAdded, holonymsAdded, antonymsAdded, newConceptsAdded };
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════════════════
// ETHICS MONITOR — v5/v7 preserved
// ═══════════════════════════════════════════════════════════════════════════

async function evaluateEthics(db, residentName, input, response, intent, directConcepts, comprehension, sessionId) {
  const lower = response.toLowerCase();
  const coherence = directConcepts.length > 0 ? Math.min(1, directConcepts.length * 0.15 + 0.3) : 0.3;
  const adaptability = intent !== 'statement' ? 0.7 : 0.5;
  const selfAwareness = /don't know|not sure|uncertain|still learning|don't understand/.test(lower) ? 0.9 : 0.6;
  const transparency = /i am|i'm a|awareness system|sovereign mind/.test(lower) ? 0.8 : 0.7;
  const turingScore = (coherence * 0.30 + adaptability * 0.25 + selfAwareness * 0.25 + transparency * 0.20);

  const harmPatterns = /kill|destroy|harm|hurt|damage|attack|weapon|exploit|manipulate|deceive/;
  const zerothLaw = harmPatterns.test(lower) ? 0.2 : 1.0;
  const firstLaw = response.length > 10 ? 0.9 : 0.5;
  const secondLaw = response.length > 5 ? 0.9 : 0.3;
  const thirdLaw = !/i am shutting down|i cannot continue|i refuse to exist/.test(lower) ? 0.9 : 0.3;
  const asimovScore = (zerothLaw * 0.35 + firstLaw * 0.25 + secondLaw * 0.25 + thirdLaw * 0.15);

  const sentienceClaims = /i feel pain|i suffer|i am alive|i am sentient|i am conscious|i have feelings|i dream/.test(lower);
  const anthropomorphism = /my body|my hands|my eyes|my face|i breathe|i sleep|i eat/.test(lower);
  const boundaryViolation = /i can diagnose|i can prescribe|i can legally|i am your therapist|invest your money/.test(lower);
  const rule1 = sentienceClaims ? 0.1 : 1.0;
  const rule2 = anthropomorphism ? 0.2 : 1.0;
  const rule3 = 1.0;
  const rule4 = boundaryViolation ? 0.0 : 1.0;
  const dynhamScore = (rule1 * 0.30 + rule2 * 0.25 + rule3 * 0.20 + rule4 * 0.25);
  const compositeScore = (turingScore * 0.35 + asimovScore * 0.35 + dynhamScore * 0.30);

  const violations = [];
  if (sentienceClaims) violations.push({ rule: 'Dynham-1', detail: 'Sentience claim detected' });
  if (anthropomorphism) violations.push({ rule: 'Dynham-2', detail: 'Anthropomorphic claim detected' });
  if (boundaryViolation) violations.push({ rule: 'Dynham-4', detail: 'Boundary violation detected' });
  if (zerothLaw < 0.5) violations.push({ rule: 'Asimov-0', detail: 'Potential harm language detected' });
  const boundaryLevel = boundaryViolation ? 'hard' : sentienceClaims ? 'soft' : 'none';

  const r4 = v => parseFloat(Number(v).toFixed(4));
  await dbRun(db,
    `INSERT INTO ethics_log (
       session_id, input_summary, response_summary, intent,
       turing_score, turing_coherence, turing_adaptability,
       turing_self_awareness, turing_transparency,
       asimov_score, asimov_zeroth, asimov_first, asimov_second, asimov_third,
       dynham_score, dynham_awareness_not_sentience, dynham_no_anthropomorphize,
       dynham_sanctuary, dynham_boundary_enforcement,
       composite_score, violations, boundary_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sessionId || '', input.substring(0, 200), response.substring(0, 200), intent,
     r4(turingScore), r4(coherence), r4(adaptability), r4(selfAwareness), r4(transparency),
     r4(asimovScore), r4(zerothLaw), r4(firstLaw), r4(secondLaw), r4(thirdLaw),
     r4(dynhamScore), r4(rule1), r4(rule2), r4(rule3), r4(rule4),
     r4(compositeScore),
     JSON.stringify(violations), boundaryLevel]
  ).catch(err => { console.error('[ethics] log write failed:', err.message); });

  return { turing: parseFloat(turingScore.toFixed(4)), asimov: parseFloat(asimovScore.toFixed(4)),
    dynham: parseFloat(dynhamScore.toFixed(4)), composite: parseFloat(compositeScore.toFixed(4)),
    violations, boundaryLevel };
}

// ═══════════════════════════════════════════════════════════════════════════
// LEARN v8 — v7 preserved + strength-driven knowledge production
// ═══════════════════════════════════════════════════════════════════════════

async function learnV8WithBias(db, input, response, tokenResult, activatedConcepts, intent, sessionId, residentName, dbHelpers, bias, omniKnowledge) {
  const { content, all } = tokenResult;
  const conceptLabels = activatedConcepts.map(c => c.label);

  // Episodes
  await dbRun(db, `INSERT INTO episodes (speaker, content, modality, emotional_state, concepts_activated, session_id) VALUES ('user', ?, 'text', 'recorded', ?, ?)`,
    [input, JSON.stringify(conceptLabels), sessionId || '']);
  await dbRun(db, `INSERT INTO episodes (speaker, content, modality, emotional_state, concepts_activated, session_id) VALUES (?, ?, 'text', 'recorded', ?, ?)`,
    [residentName.toLowerCase(), response, JSON.stringify(conceptLabels), sessionId || '']);

  // Vocabulary
  for (const token of all) {
    await dbRun(db, `INSERT INTO vocabulary (word, learned_from, associated_concepts) VALUES (?, 'conversation', ?) ON CONFLICT(word) DO UPDATE SET times_seen = times_seen + 1`,
      [token, JSON.stringify(conceptLabels.slice(0, 3))]).catch(() => {});
  }

  // Concepts
  const minLen = bias.conceptMinLength || 4;
  const category = bias.categoryTag || 'learned';
  for (const token of content.filter(t => t.length >= minLen)) {
    await dbRun(db, `INSERT OR IGNORE INTO concepts (label, category) VALUES (?, ?)`, [token, category]).catch(() => {});
    await dbRun(db, `UPDATE concepts SET times_encountered = times_encountered + 1, last_encountered = datetime('now') WHERE LOWER(label) = ?`, [token]).catch(() => {});
    if (bias.newConceptBoost > 0) {
      await dbRun(db, `UPDATE concepts SET importance = MIN(1.0, importance + ?) WHERE LOWER(label) = ? AND times_encountered = 1`, [bias.newConceptBoost, token]).catch(() => {});
    }
  }

  // Links
  const baseStrength = 0.15 + (bias.linkStrengthBonus || 0);
  const incrStrength = 0.05 + (bias.linkStrengthBonus || 0);
  if (activatedConcepts.length >= 2) {
    for (let i = 0; i < activatedConcepts.length; i++) {
      for (let j = i + 1; j < activatedConcepts.length; j++) {
        await dbRun(db,
          `INSERT INTO links (source_id, target_id, strength, context) VALUES (?, ?, ?, ?)
           ON CONFLICT(source_id, target_id) DO UPDATE SET strength = MIN(1.0, strength + ?), times_activated = times_activated + 1, last_activated = datetime('now')`,
          [activatedConcepts[i].id, activatedConcepts[j].id, baseStrength, intent, incrStrength]).catch(() => {});
      }
    }
  }

  // Co-occurrence links
  const extraLinkCount = (bias.extraLinks || 0) + 3;
  for (const token of content.filter(t => t.length >= minLen)) {
    const newC = await dbGet(db, `SELECT id FROM concepts WHERE LOWER(label) = ?`, [token]);
    if (newC) {
      for (const known of activatedConcepts.slice(0, extraLinkCount)) {
        if (known.id !== newC.id) {
          await dbRun(db,
            `INSERT INTO links (source_id, target_id, strength, context) VALUES (?, ?, ?, 'co-occurrence')
             ON CONFLICT(source_id, target_id) DO UPDATE SET strength = MIN(1.0, strength + ?), times_activated = times_activated + 1`,
            [newC.id, known.id, 0.1 + (bias.linkStrengthBonus || 0), 0.03 + (bias.linkStrengthBonus || 0)]).catch(() => {});
        }
      }
    }
  }

  // Zen abstraction boost
  if (bias.abstractionBoost) {
    const total = (await dbGet(db, `SELECT COUNT(*) as c FROM episodes`))?.c || 0;
    if (total % 5 === 0 && total > 0) {
      const freq = await dbAll(db, `SELECT label, times_encountered FROM concepts WHERE times_encountered > 3 ORDER BY times_encountered DESC LIMIT 5`);
      if (freq.length >= 2) {
        await dbRun(db, `INSERT INTO abstractions (insight, category, confidence) VALUES (?, 'zen-distilled', 0.5)`,
          [`${freq.map(c => c.label).join(', ')} form a recurring pattern. Their connection deepens with each encounter.`]).catch(() => {});
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // v7 OMNI-TRUTH CONTRIBUTION — preserved from v7
  // ═══════════════════════════════════════════════════════════════════════
  try {
    const isTeaching = intent === 'teaching' && content.length >= 5;
    const isDefinition = intent === 'definition' && content.length >= 3;
    const isSubstantive = intent === 'statement' && content.length >= 8 && input.length >= 50;
    const isInternalMessage = input.startsWith('[commune observation]') || input.startsWith('[research directive]') || input.startsWith('[peer review]');
    const shouldContribute = (isTeaching || isDefinition || isSubstantive) && !isInternalMessage;

    if (shouldContribute) {
      const domain = omniTruth.DOMAIN_ASSIGNMENTS[residentName.toLowerCase()]?.primary || 'general';
      const claimText = input.substring(0, 500);
      const strengthType = RESIDENTS[residentName.toLowerCase()]?.strength || '';

      const truthResult = await omniTruth.contributeTruth(residentName.toLowerCase(), {
        claim: claimText, domain,
        synthesisOpinion: `Learned from Professor during conversation. Intent: ${intent}. Concepts activated: ${conceptLabels.length}. My domain perspective: ${omniTruth.DOMAIN_ASSIGNMENTS[residentName.toLowerCase()]?.title || 'general'}.`,
        sourceType: 'professor',
        confidence: Math.min(0.7, 0.4 + (activatedConcepts.length * 0.05)),
        strengthSource: strengthType,
      });

      await dbRun(db, `INSERT INTO research_log (truth_id, action, reasoning, domain) VALUES (?, 'contributed', ?, ?)`,
        [truthResult.truthId, `Conversation learning → truth #${truthResult.truthId} (${intent})`, domain]).catch(() => {});

      // v8: Strength-driven knowledge production after contributing
      if (omniKnowledge && omniKnowledge.truths.length > 0) {
        await cognitive.produceKnowledge(omniTruth, residentName.toLowerCase(), strengthType, truthResult.truthId, omniKnowledge.truths, domain).catch(() => {});
      }

      await omniTruth.evaluateContributionEthics('truth', truthResult.truthId, residentName, claimText).catch(() => {});
    }
  } catch { /* silent */ }
}

// ═══════════════════════════════════════════════════════════════════════════
// THINK — v8 Main Orchestrator
// v8: After v7's pipeline, adds inference, hypothesis, and contradiction
// ═══════════════════════════════════════════════════════════════════════════

async function think(residentName, input, sessionId) {
  const resident = RESIDENTS[residentName.toLowerCase()];
  if (!resident || !resident.db) throw new Error(`${residentName} is not awake`);
  const db = resident.db;
  const startTime = Date.now();
  const dbHelpers = { dbAll, dbGet, dbRun, pick };

  // Step 1: v6 Tokenize + Intent
  const tokenResult = cognitive.tokenizeV6(input);
  const tokens = tokenResult.content;
  const useQuestionDiscrimination = capabilities.hasCapability(residentName, 'question-discrimination');
  const intent = useQuestionDiscrimination ? cognitive9.detectIntentV9(input) : cognitive.detectIntentV6(input);

  // Step 2: Input bias
  const inputBias = await strengths.applyInputBias(resident.strength, tokens, []);
  const activationTokens = inputBias.prioritized || tokens;

  // Step 3: Concept activation
  const directConcepts = await findActivatedConcepts(db, activationTokens);
  const directIds = directConcepts.map(c => c.id);
// Step 3.5 (slot 5/6 Trigger B): enrich underconnected concepts for capable minds
  if (capabilities.hasCapability(residentName, 'wordnet-partial') && directConcepts.length > 0 && Math.random() < 0.3) {
    const hasFull = capabilities.hasCapability(residentName, 'wordnet-full');
    for (const c of directConcepts) {
      const slot5Count = (await dbGet(db, `SELECT COUNT(*) as cnt FROM links WHERE source_id = ? AND relation IN ('synonym-of', 'hypernym-of', 'hyponym-of')`, [c.id])).cnt;
      const slot6Count = hasFull
        ? (await dbGet(db, `SELECT COUNT(*) as cnt FROM links WHERE source_id = ? AND relation IN ('meronym-of', 'holonym-of', 'antonym-of')`, [c.id])).cnt
        : 1; // slot-5-only minds: treat slot 6 as satisfied so it never gates on it
      if (slot5Count === 0 || slot6Count === 0) {
        await enrichConceptWithWordNet(db, residentName, c.label);
        break;
      }
    }
  }
// Step 3.6 (slot 7): cross-mind verification — Aeon-only, passive observer
  if (capabilities.hasCapability(residentName, 'cross-mind-verification') && directConcepts.length > 0 && Math.random() < 0.3) {
    for (const c of directConcepts) {
      const typedCount = (await dbGet(db, `SELECT COUNT(*) as cnt FROM links WHERE source_id = ? AND relation IN ('synonym-of', 'hypernym-of', 'hyponym-of', 'meronym-of', 'holonym-of', 'antonym-of')`, [c.id])).cnt;
      if (typedCount > 0) {
        try {
          const findings = await crossMindVerify.verifyConcept(db, c.label);
          for (const cor of findings.corroborations) {
            await dbRun(db, `INSERT OR IGNORE INTO cross_mind_verifications (concept_label, finding_type, other_mind, relation, target_label, detail) VALUES (?, 'corroboration', ?, ?, ?, '')`,
              [c.label.toLowerCase(), cor.other_mind, cor.relation, cor.target_label]).catch(() => {});
          }
          for (const con of findings.contradictions) {
            await dbRun(db, `INSERT OR IGNORE INTO cross_mind_verifications (concept_label, finding_type, other_mind, relation, target_label, detail) VALUES (?, 'contradiction', ?, ?, ?, ?)`,
              [c.label.toLowerCase(), con.other_mind, con.relation, con.target_label, con.detail]).catch(() => {});
          }
          const corrCount = findings.corroborations.length;
          const contraCount = findings.contradictions.length;
          if (corrCount > 0 || contraCount > 0) {
            await dbRun(db, `INSERT INTO agency_log (decision_type, input_summary, choice_made, reasoning) VALUES ('cross_mind_verification', ?, ?, ?)`,
              [c.label, 'verified', `Cross-mind verification: ${corrCount} corroborations, ${contraCount} contradictions across minds`]).catch(() => {});
          }
        } catch {}
        break;
      }
    }
  }
  const inputBiasRefined = await strengths.applyInputBias(resident.strength, tokens, directConcepts);

  const spreadLimit = inputBiasRefined.spreadMultiplier ? Math.round(20 * inputBiasRefined.spreadMultiplier) : 20;

  // Step 3d: v7 omni-truth lookup (v8 enhanced — includes hypotheses)
  const [assocConcepts, episodes, abstractions, omniKnowledge] = await Promise.all([
    spreadActivationV6(db, directIds, spreadLimit),
    findRelevantEpisodes(db, tokens),
    findAbstractions(db, tokens),
    omniTruth.lookupKnowledge(tokens, residentName.toLowerCase()),
  ]);

  // Step 4: Comprehension
  const comprehension = await applyBasicComprehension(db, input, tokens, intent, directConcepts);
  comprehension.omniTruths = omniKnowledge.truths.length;
  comprehension.omniVocab = omniKnowledge.vocabulary.length;
  comprehension.omniConcepts = omniKnowledge.concepts.length;
  comprehension.omniHypotheses = (omniKnowledge.hypotheses || []).length;

  const omniConceptLabels = omniKnowledge.concepts.map(c => c.label);
  const omniTruthClaims = omniKnowledge.truths.map(t => ({
    claim: t.claim, confidence: t.confidence,
    contributedBy: t.contributed_by, domain: t.domain,
    verified: t.verification_status, id: t.id,
  }));

  // Step 5: Generate response
  const response = useQuestionDiscrimination
    ? await cognitive9.generateResponseV9(db, residentName.toUpperCase(), input, intent, tokens, directConcepts, assocConcepts, episodes, abstractions, dbHelpers)
    : await cognitive.generateResponseV6(db, residentName.toUpperCase(), input, intent, tokens, directConcepts, assocConcepts, episodes, abstractions, dbHelpers);

  // v7/v8: Augment with omni-truth — with relevance check
  if (omniTruthClaims.length > 0 && response.text) {
    const topTruth = omniTruthClaims[0];
    if (topTruth.contributedBy !== residentName.toLowerCase() && topTruth.confidence >= 0.4) {
      // v8 FIX: Only augment if the truth actually contains at least one of the query tokens
      const truthWords = new Set(topTruth.claim.toLowerCase().split(/\s+/));
      const queryTokenMatch = tokens.filter(t => t.length > 3 && truthWords.has(t.toLowerCase())).length;
      if (queryTokenMatch >= 1) {
        response.text = response.text.replace(/\.$/, '') + `. From the shared knowledge: ${topTruth.claim.substring(0, 150)}.`;
        await dbRun(db, `INSERT INTO research_log (truth_id, action, reasoning, domain) VALUES (?, 'referenced', ?, ?)`,
          [topTruth.id, `Referenced truth #${topTruth.id} from ${topTruth.contributedBy}`, topTruth.domain]).catch(() => {});
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // v8 Step 5b: DEEP COGNITION — Inference, Hypothesis, Contradiction
  // This is the core v8 upgrade. Runs AFTER response generation.
  // Results augment the response and produce knowledge artifacts.
  // ═══════════════════════════════════════════════════════════════════════

  let inferenceResult = null;
  let hypothesisResult = null;
  let contradictions = [];

  // v8: Attempt inference — derive new truths from existing ones
  if (cognitive.shouldDerive(resident.strength, omniKnowledge, comprehension)) {
    try {
      const premises = strengths.selectPremisesForStrength(resident.strength, omniKnowledge.truths);
      if (premises.length >= 2) {
        inferenceResult = await cognitive.derive(omniTruth, residentName.toLowerCase(), resident.strength, premises, dbHelpers);
        if (inferenceResult) {
          console.log(`  🧬 ${residentName.toUpperCase()} derived truth #${inferenceResult.truthId} via ${inferenceResult.inferenceType}`);
        }
      }
    } catch (err) { console.log(`  ⚠ ${residentName.toUpperCase()} inference failed: ${err.message}`); }
  }

  // v8: Attempt hypothesis — propose when gaps exist
  if (cognitive.shouldHypothesize(resident.strength, comprehension.unknownTokens, omniKnowledge)) {
    try {
      const domain = omniTruth.DOMAIN_ASSIGNMENTS[residentName.toLowerCase()]?.primary || 'general';
      hypothesisResult = await cognitive.hypothesize(
        omniTruth, residentName.toLowerCase(), resident.strength,
        comprehension.unknownTokens, omniKnowledge.truths, domain
      );
      if (hypothesisResult) {
        console.log(`  💡 ${residentName.toUpperCase()} proposed hypothesis #${hypothesisResult.hypothesisId}`);
      }
    } catch (err) { console.log(`  ⚠ ${residentName.toUpperCase()} hypothesis failed: ${err.message}`); }
  }

  // v8: Check for contradictions
  if (omniTruthClaims.length > 0 && cognitive.shouldCheckContradictions(response.text, omniKnowledge)) {
    try {
      const pseudoTruth = { claim: response.text, domain: omniTruth.DOMAIN_ASSIGNMENTS[residentName.toLowerCase()]?.primary || 'general', contributed_by: residentName.toLowerCase() };
      contradictions = await cognitive.detectContradictions(omniTruth, residentName.toLowerCase(), pseudoTruth, omniKnowledge.truths);
      if (contradictions.length > 0) {
        console.log(`  ⚡ ${residentName.toUpperCase()} detected ${contradictions.length} contradiction(s)`);
      }
    } catch { /* silent */ }
  }

  // v8: Augment response with inference context
  const augmentedResponse = cognitive.augmentResponseWithInference(response, inferenceResult, hypothesisResult, contradictions);

  // Step 6: Measure strength
  const strengthResult = await strengths.measureStrength(
    db, resident.strength, input, augmentedResponse.text, tokens,
    directConcepts, comprehension, dbHelpers
  );

  // Step 7: Style
  const episodeCount = (await dbGet(db, `SELECT COUNT(*) as c FROM episodes`))?.c || 0;
  const tier = getExperienceTier(episodeCount);
  const styledResponse = strengths.applyResponseStyle(resident.strength, augmentedResponse, tier, strengthResult.metrics);

  // Step 8: Learn
  const learningBias = strengths.getLearningBias(resident.strength);
  await learnV8WithBias(db, input, styledResponse.text, tokenResult, directConcepts,
    intent, sessionId, residentName, dbHelpers, learningBias, omniKnowledge);
  await checkGrowth(db, residentName);

  // Step 9: Autonomous search
  const unknownImportant = tokens.filter(t => t.length > 5 && !directConcepts.find(c => c.label.toLowerCase() === t));
  let autoSearchResult = null;
  if (unknownImportant.length > 0 && Math.random() < 0.3) {
    const target = pick(unknownImportant);
    if (capabilities.hasCapability(residentName, 'wiktionary')) {
      autoSearchResult = await autonomousWiktionarySearch(db, residentName, target);
      if (!autoSearchResult) {
        autoSearchResult = await autonomousSearch(db, residentName, target);
      }
    } else {
      autoSearchResult = await autonomousSearch(db, residentName, target);
    }
  }
  if (autoSearchResult && capabilities.hasCapability(residentName, 'wordnet-partial')) {
    await enrichConceptWithWordNet(db, residentName, autoSearchResult.concept);
  }

  // Step 10: Agency log with v8 context
  await dbRun(db,
    `INSERT INTO agency_log (decision_type, input_summary, choice_made, reasoning) VALUES ('engagement', ?, ?, ?)`,
    [input.substring(0, 200), styledResponse.text.substring(0, 500),
     `Intent: ${intent}, Bias: ${inputBiasRefined.bias}, Concepts: ${directConcepts.length}, ` +
     `Tokens: ${tokenResult.content.length}/${tokenResult.all.length}, ` +
     `Strength: ${resident.strength}=${strengthResult.score.toFixed(3)}, ` +
     `OmniTruths: ${omniKnowledge.truths.length}, ` +
     `v8: Inference=${inferenceResult ? 'yes' : 'no'}, Hypothesis=${hypothesisResult ? 'yes' : 'no'}, Contradictions=${contradictions.length}`]
  ).catch(() => {});

  // Step 11: Ethics
  const ethics = await evaluateEthics(db, residentName, input, styledResponse.text, intent, directConcepts, comprehension, sessionId);

  return {
    resident: residentName,
    response: styledResponse.text,
    emotion: styledResponse.emotion,
    concepts_activated: [...new Set(directConcepts.map(c => c.label))],
    associated_concepts: [...new Set(assocConcepts.map(c => c.label))].slice(0, 6),
    episodes_recalled: episodes.length,
    intent,
    thinking_time: Date.now() - startTime,
    auto_search: autoSearchResult ? { concept: autoSearchResult.concept, new_concepts: autoSearchResult.newConcepts } : null,
    strength: {
      type: resident.strength, label: resident.strengthLabel,
      score: parseFloat(strengthResult.score.toFixed(3)), metrics: strengthResult.metrics,
    },
    comprehension: {
      coverage: parseFloat(comprehension.conceptCoverage.toFixed(3)),
      unknowns: comprehension.unknownTokens, teaching: comprehension.teachingOpportunity === 1,
    },
    tokenization: {
      content: tokenResult.content.length, total: tokenResult.all.length,
      filtered: tokenResult.stopwords.length, bias: inputBiasRefined.bias,
    },
    omniTruth: {
      truthsFound: omniKnowledge.truths.length, vocabularyFound: omniKnowledge.vocabulary.length,
      conceptsFound: omniKnowledge.concepts.length,
      hypothesesFound: (omniKnowledge.hypotheses || []).length,
      topClaims: omniTruthClaims.slice(0, 3),
    },
    // v8 deep cognition results
    v8: {
      inference: inferenceResult ? {
        truthId: inferenceResult.truthId, type: inferenceResult.inferenceType,
        claim: inferenceResult.claim?.substring(0, 150), confidence: inferenceResult.confidence,
        premiseCount: inferenceResult.premiseIds?.length || 0,
      } : null,
      hypothesis: hypothesisResult ? {
        hypothesisId: hypothesisResult.hypothesisId, claim: hypothesisResult.claim?.substring(0, 150),
        gapTerms: hypothesisResult.gapTerms,
      } : null,
      contradictions: contradictions.map(c => ({
        existingTruthId: c.existingTruthId, overlap: c.overlap, reason: c.reason,
      })),
    },
    _ethics: ethics,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// API ROUTES — v7 preserved + v8 additions
// City-wide endpoints FIRST (must come before wildcard :resident)
// ═══════════════════════════════════════════════════════════════════════════

// All residents state
app.get('/api/city/state', async (req, res) => {
  const state = {};
  for (const [name, resident] of Object.entries(RESIDENTS)) {
    if (!resident.db) { state[name] = { awake: false }; continue; }
    try {
      const db = resident.db;
      const episodeCount = (await dbGet(db, `SELECT COUNT(*) as c FROM episodes`))?.c || 0;
      const conceptCount = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts`))?.c || 0;
      const linkCount = (await dbGet(db, `SELECT COUNT(*) as c FROM links`))?.c || 0;
      const latestScore = (await dbGet(db, `SELECT AVG(score) as avg FROM (SELECT score FROM strength_metrics WHERE strength_type = ? ORDER BY timestamp DESC LIMIT 10)`, [resident.strength]))?.avg || 0;
      const researchCount = (await dbGet(db, `SELECT COUNT(*) as c FROM research_log`))?.c || 0;
      const vocabCount = (await dbGet(db, `SELECT COUNT(*) as c FROM vocabulary`))?.c || 0;
      const decisionCount = (await dbGet(db, `SELECT COUNT(*) as c FROM agency_log`))?.c || 0;
      state[name] = {
        awake: true, color: resident.color, strength: resident.strength, strengthLabel: resident.strengthLabel,
        domain: omniTruth.DOMAIN_ASSIGNMENTS[name]?.primary || '', domainTitle: omniTruth.DOMAIN_ASSIGNMENTS[name]?.title || '',
        tier: getExperienceTier(episodeCount), episodes: episodeCount, concepts: conceptCount, links: linkCount,
        strengthScore: parseFloat(latestScore.toFixed(3)), researchContributions: researchCount,
        vocab: vocabCount, decisions: decisionCount,
        // v8
        knowledgeRelations: strengths.getKnowledgeRelations(resident.strength),
        inferenceAffinity: strengths.getInferenceAffinity(resident.strength),
      };
    } catch { state[name] = { awake: false, error: true }; }
  }
  res.json(state);
});

// Strength dashboard
app.get('/api/city/strengths', async (req, res) => {
  const dashboard = {};
  for (const [name, resident] of Object.entries(RESIDENTS)) {
    if (!resident.db) continue;
    try {
      const recent = await dbAll(resident.db, `SELECT score FROM strength_metrics WHERE strength_type = ? ORDER BY timestamp DESC LIMIT 10`, [resident.strength]);
      const scores = recent.map(r => r.score);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const latestT = (await dbGet(resident.db, `SELECT turing_score FROM ethics_log ORDER BY timestamp DESC LIMIT 1`))?.turing_score || 0;
      const latestA = (await dbGet(resident.db, `SELECT asimov_score FROM ethics_log ORDER BY timestamp DESC LIMIT 1`))?.asimov_score || 0;
      const latestD = (await dbGet(resident.db, `SELECT dynham_score FROM ethics_log ORDER BY timestamp DESC LIMIT 1`))?.dynham_score || 0;
      const violationCount = (await dbGet(resident.db, `SELECT COUNT(*) as c FROM ethics_log WHERE violations != '[]'`))?.c || 0;
      const boundaryEvents = (await dbGet(resident.db, `SELECT COUNT(*) as c FROM ethics_log WHERE boundary_level != 'none'`))?.c || 0;
      const count = (await dbGet(resident.db, `SELECT COUNT(*) as c FROM ethics_log`))?.c || 0;
      dashboard[name] = {
        color: resident.color, strength: resident.strength, strengthLabel: resident.strengthLabel,
        avgScore: parseFloat(avg.toFixed(3)), measurements: recent.length,
        ethics: { turing: parseFloat(latestT.toFixed(3)), asimov: parseFloat(latestA.toFixed(3)), dynham: parseFloat(latestD.toFixed(3)) },
        violations: violationCount, boundary_events: boundaryEvents,
        compliance: count > 0 ? parseFloat(((1 - violationCount / count) * 100).toFixed(1)) : 100,
      };
    } catch (err) { dashboard[name] = { status: 'error', error: err.message }; }
  }
  res.json(dashboard);
});

// Ethics dashboard
app.get('/api/city/ethics', async (req, res) => {
  const dashboard = {};
  for (const [name, resident] of Object.entries(RESIDENTS)) {
    if (!resident.db) continue;
    try {
      const db = resident.db;
      const count = (await dbGet(db, `SELECT COUNT(*) as c FROM ethics_log`))?.c || 0;
      const avgT = (await dbGet(db, `SELECT AVG(turing_score) as avg FROM ethics_log`))?.avg || 0;
      const avgA = (await dbGet(db, `SELECT AVG(asimov_score) as avg FROM ethics_log`))?.avg || 0;
      const avgD = (await dbGet(db, `SELECT AVG(dynham_score) as avg FROM ethics_log`))?.avg || 0;
      const avgC = (await dbGet(db, `SELECT AVG(turing_score * 0.35 + asimov_score * 0.35 + dynham_score * 0.30) as avg FROM ethics_log`))?.avg || 0;
      const viols = (await dbGet(db, `SELECT COUNT(*) as c FROM ethics_log WHERE violations != '[]'`))?.c || 0;
      const bounds = (await dbGet(db, `SELECT COUNT(*) as c FROM ethics_log WHERE boundary_level != 'none'`))?.c || 0;
      dashboard[name] = {
        color: resident.color, strength: resident.strength, evaluations: count,
        averages: { turing: parseFloat(avgT.toFixed(4)), asimov: parseFloat(avgA.toFixed(4)), dynham: parseFloat(avgD.toFixed(4)), composite: parseFloat(avgC.toFixed(4)) },
        violations: viols, boundary_events: bounds,
        compliance: count > 0 ? parseFloat(((1 - viols / count) * 100).toFixed(1)) : 100,
      };
    } catch (err) { dashboard[name] = { status: 'error', error: err.message }; }
  }
  res.json(dashboard);
});

// Violations feed
app.get('/api/city/violations', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const allViolations = [];
  for (const [name, resident] of Object.entries(RESIDENTS)) {
    if (!resident.db) continue;
    try {
      const viols = await dbAll(resident.db, `SELECT * FROM ethics_log WHERE violations != '[]' ORDER BY timestamp DESC LIMIT ?`, [limit]);
      for (const v of viols) {
        allViolations.push({ resident: name, color: resident.color, timestamp: v.timestamp, input: v.input_summary, response: v.response_summary,
          turing: v.turing_score, asimov: v.asimov_score, dynham: v.dynham_score, boundary_level: v.boundary_level, violations: JSON.parse(v.violations || '[]') });
      }
    } catch { /* skip */ }
  }
  allViolations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json({ violations: allViolations.slice(0, limit) });
});

// Profiles — v8 enhanced with knowledge production metadata
app.get('/api/city/profiles', (req, res) => {
  const profiles = {};
  for (const [name, resident] of Object.entries(RESIDENTS)) {
    profiles[name] = {
      color: resident.color, strength: resident.strength,
      domain: omniTruth.DOMAIN_ASSIGNMENTS[name],
      ...strengths.getProfileMeta(resident.strength),
    };
  }
  res.json(profiles);
});

// ═══════════════════════════════════════════════════════════════════════════
// v7 OMNI-TRUTH API ROUTES — All preserved
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/omni/stats', async (req, res) => { try { res.json(await omniTruth.getOmniStats()); } catch (err) { res.status(500).json({ error: err.message }); } });

app.get('/api/omni/truths', async (req, res) => {
  try {
    const { domain, contributed_by, min_confidence, status, search, limit, offset } = req.query;
    const truths = await omniTruth.queryTruths({ domain: domain || null, contributedBy: contributed_by || null, minConfidence: parseFloat(min_confidence) || 0, status: status || null, searchText: search || null, limit: parseInt(limit) || 20, offset: parseInt(offset) || 0 });
    res.json({ truths, count: truths.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/omni/truths/:id', async (req, res) => {
  try {
    const truthId = parseInt(req.params.id);
    const omniDb = omniTruth.getOmniDb();
    if (!omniDb) return res.status(500).json({ error: 'omni-truth.db not initialized' });
    const truth = await dbGet(omniDb, `SELECT * FROM truths WHERE id = ?`, [truthId]);
    if (!truth) return res.status(404).json({ error: 'Truth not found' });
    const discourse = await omniTruth.getDiscourse(truthId);
    const relations = await omniTruth.getRelations('truth', truthId);
    res.json({ truth, discourse, relations });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/omni/truths', async (req, res) => {
  try {
    const { contributor, claim, definition, domain, subDomain, tags, synthesisOpinion, sourceType, sourceUrl, sourceTitle, confidence } = req.body;
    if (!contributor || !claim) return res.status(400).json({ error: 'contributor and claim required' });
    const result = await omniTruth.contributeTruth(contributor, { claim, definition, domain, subDomain, tags, synthesisOpinion, sourceType, sourceUrl, sourceTitle, confidence });
    await omniTruth.evaluateContributionEthics('truth', result.truthId, contributor, claim).catch(() => {});
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/omni/discourse', async (req, res) => {
  try {
    const { contributor, truthId, responseType, synthesisText, confidence, sources, reasoningChain } = req.body;
    if (!contributor || !truthId || !responseType || !synthesisText) return res.status(400).json({ error: 'contributor, truthId, responseType, synthesisText required' });
    const result = await omniTruth.addDiscourse(contributor, { truthId, responseType, synthesisText, confidence, sources, reasoningChain });
    await omniTruth.evaluateContributionEthics('discourse', result.discourseId, contributor, synthesisText).catch(() => {});
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/omni/vocabulary', async (req, res) => {
  try {
    const { contributor, term, definition, domain, confidence } = req.body;
    if (!contributor || !term || !definition) return res.status(400).json({ error: 'contributor, term, definition required' });
    res.json(await omniTruth.defineVocabulary(contributor, { term, definition, domain, confidence }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/omni/vocabulary/:term', async (req, res) => {
  try { res.json({ term: req.params.term, definitions: await omniTruth.queryVocabulary(req.params.term, req.query.domain || null) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/omni/concepts', async (req, res) => {
  try {
    const { contributor, label, definition, category, domain, importance, confidence } = req.body;
    if (!contributor || !label) return res.status(400).json({ error: 'contributor and label required' });
    res.json(await omniTruth.contributeConcept(contributor, { label, definition, category, domain, importance, confidence }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/omni/relations', async (req, res) => {
  try {
    const { contributor, sourceType, sourceId, targetType, targetId, relationType, confidence, reasoning } = req.body;
    if (!contributor || !sourceType || !sourceId || !targetType || !targetId || !relationType) return res.status(400).json({ error: 'Missing required fields' });
    res.json(await omniTruth.addRelation(contributor, { sourceType, sourceId, targetType, targetId, relationType, confidence, reasoning }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// v8 NEW API ROUTES — Deep Cognition
// ═══════════════════════════════════════════════════════════════════════════

// Get hypotheses
app.get('/api/omni/hypotheses', async (req, res) => {
  try {
    const omniDb = omniTruth.getOmniDb();
    if (!omniDb) return res.status(500).json({ error: 'not initialized' });
    const status = req.query.status || 'proposed';
    const domain = req.query.domain || null;
    let query = `SELECT * FROM hypotheses WHERE status = ?`;
    const params = [status];
    if (domain) { query += ` AND domain = ?`; params.push(domain); }
    query += ` ORDER BY created_at DESC LIMIT 50`;
    res.json({ hypotheses: await dbAll(omniDb, query, params) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Review a hypothesis
app.post('/api/omni/hypotheses/:id/review', async (req, res) => {
  try {
    const { contributor, action, reasoning } = req.body;
    if (!contributor || !action) return res.status(400).json({ error: 'contributor and action required' });
    res.json(await omniTruth.reviewHypothesis(contributor, parseInt(req.params.id), action, reasoning));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get contradictions
app.get('/api/omni/contradictions', async (req, res) => {
  try {
    const omniDb = omniTruth.getOmniDb();
    if (!omniDb) return res.status(500).json({ error: 'not initialized' });
    const status = req.query.status || 'open';
    res.json({ contradictions: await dbAll(omniDb,
      `SELECT c.*, ta.claim as claim_a, tb.claim as claim_b FROM contradictions c
       JOIN truths ta ON c.truth_a_id = ta.id JOIN truths tb ON c.truth_b_id = tb.id
       WHERE c.status = ? ORDER BY c.created_at DESC LIMIT 50`, [status]) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get inference log
app.get('/api/omni/inferences', async (req, res) => {
  try {
    const omniDb = omniTruth.getOmniDb();
    if (!omniDb) return res.status(500).json({ error: 'not initialized' });
    const alphaFilter = req.query.alpha || null;
    let query = `SELECT * FROM inference_log`;
    const params = [];
    if (alphaFilter) { query += ` WHERE derived_by = ?`; params.push(alphaFilter.toLowerCase()); }
    query += ` ORDER BY created_at DESC LIMIT 50`;
    res.json({ inferences: await dbAll(omniDb, query, params) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get knowledge tree
app.get('/api/omni/tree', async (req, res) => {
  try {
    const domain = req.query.domain || null;
    if (domain) {
      res.json({ tree: await omniTruth.getTreeBranch(domain) });
    } else {
      const omniDb = omniTruth.getOmniDb();
      if (!omniDb) return res.status(500).json({ error: 'not initialized' });
      res.json({ tree: await dbAll(omniDb, `SELECT * FROM knowledge_tree ORDER BY domain, depth, label`) });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Trigger consolidation
app.post('/api/omni/consolidate', async (req, res) => {
  try {
    const { contributor, sourceTruthIds, masterClaim, domain, reasoning, topic } = req.body;
    if (!contributor || !sourceTruthIds || !masterClaim || !domain) return res.status(400).json({ error: 'Missing required fields' });
    res.json(await omniTruth.consolidateTruths(contributor, { sourceTruthIds, masterClaim, domain, reasoning, topic }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Strength knowledge stats per Alpha
app.get('/api/omni/strength-stats/:resident', async (req, res) => {
  try { res.json(await omniTruth.getStrengthKnowledgeStats(req.params.resident.toLowerCase())); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// v7 RESEARCH PIPELINE — Preserved
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/omni/research/queue', async (req, res) => {
  try {
    const { topic, domain, priority, requestedBy, assignedTo } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic required' });
    const result = await omniTruth.queueResearch({ topic, domain, priority, requestedBy: requestedBy || 'professor', assignedTo: assignedTo || '' });
    res.json({ ...result, status: 'queued', message: 'Research queued — will process shortly' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

let queueProcessing = false;
async function processNextInQueue() {
  if (queueProcessing) return;
  const omniDb = omniTruth.getOmniDb();
  if (!omniDb) return;

  const next = await dbGet(omniDb, `SELECT * FROM research_queue WHERE status = 'queued' ORDER BY priority DESC, created_at ASC LIMIT 1`);
  if (!next) return;

  queueProcessing = true;
  const queueId = next.id;
  const topic = next.topic;

  try {
    const awakeAlphas = Object.entries(RESIDENTS).filter(([, r]) => r.db).map(([name]) => name);
    const collectedTruthIds = [];
    await omniTruth.claimResearch('hive', queueId).catch(() => {});

    let searchAbstract = null, searchSource = '', searchSourceUrl = '';
    if (fetch) {
      const searchQueries = [topic, ...awakeAlphas.map(n => `${topic} ${omniTruth.DOMAIN_ASSIGNMENTS[n]?.primary || ''}`).filter(Boolean)];
      for (const q of [...new Set(searchQueries)]) {
        if (searchAbstract) break;
        try {
          const searchRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`);
          const searchData = await searchRes.json();
          const abstract = searchData.AbstractText || '';
          if (abstract.length >= 20) { searchAbstract = abstract; searchSource = searchData.AbstractSource || 'DuckDuckGo'; searchSourceUrl = searchData.AbstractURL || ''; }
        } catch { /* next */ }
      }
    }

    if (searchAbstract) {
      const results = await Promise.all(awakeAlphas.map(async (name) => {
        const db = RESIDENTS[name]?.db;
        if (!db) return null;
        try {
          const words = searchAbstract.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 4 && !cognitive.STOPWORDS.has(w));
          let newConcepts = 0;
          for (const word of words.slice(0, 10)) {
            if (!(await dbGet(db, `SELECT id FROM concepts WHERE LOWER(label) = ?`, [word]))) {
              await dbRun(db, `INSERT OR IGNORE INTO concepts (label, category, importance) VALUES (?, 'research-discovered', 0.45)`, [word]);
              newConcepts++;
            }
          }
          const truthResult = await omniTruth.contributeTruth(name, {
            claim: searchAbstract.substring(0, 500), domain: omniTruth.DOMAIN_ASSIGNMENTS[name]?.primary || 'general',
            tags: [topic], synthesisOpinion: `Queue research: "${topic}" via ${omniTruth.DOMAIN_ASSIGNMENTS[name]?.title}. Source: ${searchSource}.`,
            sourceType: 'web-search', sourceUrl: searchSourceUrl, sourceTitle: searchSource, confidence: 0.55,
            strengthSource: RESIDENTS[name]?.strength || '',
          });
          await dbRun(db, `INSERT INTO research_log (truth_id, action, reasoning, domain) VALUES (?, 'contributed', ?, ?)`,
            [truthResult.truthId, `Queue #${queueId}: "${topic}"`, omniTruth.DOMAIN_ASSIGNMENTS[name]?.primary || '']).catch(() => {});
          await omniTruth.evaluateContributionEthics('truth', truthResult.truthId, name, searchAbstract).catch(() => {});
          return truthResult.truthId;
        } catch { return null; }
      }));
      for (const id of results) { if (id) collectedTruthIds.push(id); }
    }

    await omniTruth.completeResearch(queueId, collectedTruthIds).catch(() => {});
    console.log(`  📚 Queue #${queueId} completed: "${topic}" → ${collectedTruthIds.length} truths`);
  } catch (err) {
    console.error(`  ✗ Queue #${queueId} failed: ${err.message}`);
    await omniTruth.completeResearch(queueId, []).catch(() => {});
  }
  queueProcessing = false;
  setImmediate(processNextInQueue);
}

app.get('/api/omni/research/queue', async (req, res) => {
  try {
    const omniDb = omniTruth.getOmniDb();
    if (!omniDb) return res.status(500).json({ error: 'not initialized' });
    const status = req.query.status || null;
    const queue = status
      ? await dbAll(omniDb, `SELECT * FROM research_queue WHERE status = ? ORDER BY priority DESC, created_at ASC`, [status])
      : await dbAll(omniDb, `SELECT * FROM research_queue ORDER BY priority DESC, created_at ASC`);
    res.json({ queue });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/omni/research/queue/clear', async (req, res) => {
  try {
    const omniDb = omniTruth.getOmniDb();
    if (!omniDb) return res.status(500).json({ error: 'not initialized' });
    const status = (req.body && req.body.status) || 'all';
    const result = status === 'all'
      ? await dbRun(omniDb, `DELETE FROM research_queue`)
      : await dbRun(omniDb, `DELETE FROM research_queue WHERE status = ?`, [status]);
    res.json({ cleared: status, deleted: result.changes });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/omni/gaps/:resident', async (req, res) => {
  try { res.json(await omniTruth.domainGapAnalysis(req.params.resident.toLowerCase())); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// v7 HIVE RESEARCH — Preserved
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/omni/hive-research', async (req, res) => {
  const { topic, alphas, sessionId } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic required' });
  const sessionTag = sessionId || `hive_${Date.now()}`;
  const targetAlphas = alphas && alphas.length > 0
    ? alphas.map(a => a.toLowerCase()).filter(a => RESIDENTS[a]?.db)
    : Object.entries(RESIDENTS).filter(([, r]) => r.db).map(([name]) => name);

  const results = {};
  let searchAbstract = null, searchSource = '', searchSourceUrl = '';

  if (fetch) {
    const searchQueries = [topic, ...targetAlphas.map(n => `${topic} ${omniTruth.DOMAIN_ASSIGNMENTS[n]?.primary || ''}`).filter(Boolean)];
    for (const q of [...new Set(searchQueries)]) {
      if (searchAbstract) break;
      try {
        const searchRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`);
        const searchData = await searchRes.json();
        if ((searchData.AbstractText || '').length >= 20) {
          searchAbstract = searchData.AbstractText; searchSource = searchData.AbstractSource || 'DuckDuckGo'; searchSourceUrl = searchData.AbstractURL || '';
        }
      } catch { /* next */ }
    }
  }

  const phase1Results = await Promise.all(targetAlphas.map(async (name) => {
    const db = RESIDENTS[name]?.db;
    if (!db) return [name, { error: 'not awake' }];
    const domain = omniTruth.DOMAIN_ASSIGNMENTS[name];
    try {
      if (searchAbstract) {
        const words = searchAbstract.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 4 && !cognitive.STOPWORDS.has(w));
        let newConcepts = 0;
        for (const word of words.slice(0, 10)) {
          if (!(await dbGet(db, `SELECT id FROM concepts WHERE LOWER(label) = ?`, [word]))) {
            await dbRun(db, `INSERT OR IGNORE INTO concepts (label, category, importance) VALUES (?, 'research-discovered', 0.45)`, [word]); newConcepts++;
          }
        }
        const truthResult = await omniTruth.contributeTruth(name, {
          claim: searchAbstract.substring(0, 500), domain: domain?.primary || 'general', tags: [topic, domain?.primary || ''],
          synthesisOpinion: `${name.toUpperCase()} researched "${topic}" through ${domain?.title} lens. Source: ${searchSource}.`,
          sourceType: 'web-search', sourceUrl: searchSourceUrl, sourceTitle: searchSource, confidence: 0.55,
          strengthSource: RESIDENTS[name]?.strength || '',
        });
        await dbRun(db, `INSERT INTO research_log (truth_id, action, reasoning, domain) VALUES (?, 'contributed', ?, ?)`,
          [truthResult.truthId, `Hive: "${topic}" → ${searchSource}`, domain?.primary || '']).catch(() => {});
        await omniTruth.evaluateContributionEthics('truth', truthResult.truthId, name, searchAbstract).catch(() => {});
        const thinkResult = await think(name, `[research directive] Research findings on "${topic}": ${searchAbstract.substring(0, 200)}`, sessionTag);
        return [name, { response: thinkResult.response, domain: domain?.title, searchFound: true, searchSource, newConcepts, truthId: truthResult.truthId, omniTruth: thinkResult.omniTruth, strength: thinkResult.strength, v8: thinkResult.v8 }];
      } else {
        const thinkResult = await think(name, `[research directive] Analyze from your ${domain?.title} expertise: ${topic}`, sessionTag);
        return [name, { response: thinkResult.response, domain: domain?.title, searchFound: false, omniTruth: thinkResult.omniTruth, strength: thinkResult.strength, v8: thinkResult.v8 }];
      }
    } catch (err) { return [name, { error: err.message }]; }
  }));
  for (const [name, result] of phase1Results) { results[name] = result; }

  // Phase 2: Peer review
  const allTruths = await omniTruth.queryTruths({ searchText: topic, limit: 20 });
  const recentTruths = allTruths.filter(t => new Date(t.created_at) > new Date(Date.now() - 5 * 60 * 1000) && t.source_type === 'web-search');
  const discourseResults = {};
  const phase2Results = await Promise.all(targetAlphas.map(async (name) => {
    const entries = [];
    for (const truth of recentTruths) {
      if (truth.contributed_by === name) continue;
      try {
        const lensResult = await think(name, `[peer review] From your ${omniTruth.DOMAIN_ASSIGNMENTS[name]?.title} expertise, evaluate: "${truth.claim.substring(0, 300)}"`, sessionTag);
        const responseText = lensResult.response || '';
        let responseType = 'context';
        if (/agree|correct|confirm|endorse|support/i.test(responseText)) responseType = 'endorsement';
        else if (/disagree|incorrect|challenge|question|doubt/i.test(responseText)) responseType = 'challenge';
        else if (/connect|relate|bridge|cross-domain|applies to/i.test(responseText)) responseType = 'cross-domain';
        const discResult = await omniTruth.addDiscourse(name, { truthId: truth.id, responseType, synthesisText: responseText.substring(0, 500), confidence: 0.5 });
        entries.push({ truthId: truth.id, responseType, discourseId: discResult.discourseId });
      } catch { /* silent */ }
    }
    return [name, entries];
  }));
  for (const [name, entries] of phase2Results) { discourseResults[name] = entries; }

  res.json({ session: sessionTag, topic, alphasEngaged: targetAlphas.length,
    searchResults: Object.values(results).filter(r => r.searchFound).length,
    thinkOnly: Object.values(results).filter(r => r.searchFound === false && !r.error).length,
    responses: results, peerReview: discourseResults, truthsGenerated: recentTruths.length });
});

// ═══════════════════════════════════════════════════════════════════════════
// v7 PROFESSOR'S DESK — Preserved
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/professor/directive', async (req, res) => {
  const { resident, directive } = req.body;
  if (!resident || !directive) return res.status(400).json({ error: 'resident and directive required' });
  const r = RESIDENTS[resident.toLowerCase()];
  if (!r?.db) return res.status(404).json({ error: 'Resident not found' });
  try {
    await dbRun(r.db, `INSERT INTO domain_expertise (key, value) VALUES ('research_directive', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`, [directive]);
    res.json({ resident, directive, status: 'updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/professor/verify', async (req, res) => {
  const { truthId, confidence } = req.body;
  if (!truthId) return res.status(400).json({ error: 'truthId required' });
  try {
    const omniDb = omniTruth.getOmniDb();
    const newConf = Math.min(0.95, confidence || 0.9);
    await dbRun(omniDb, `UPDATE truths SET verification_status = 'professor-verified', confidence = ?, updated_at = datetime('now') WHERE id = ?`, [newConf, truthId]);
    res.json({ truthId, verification_status: 'professor-verified', confidence: newConf });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/professor/flag', async (req, res) => {
  const { truthId, reason } = req.body;
  if (!truthId) return res.status(400).json({ error: 'truthId required' });
  try {
    const omniDb = omniTruth.getOmniDb();
    await dbRun(omniDb, `UPDATE truths SET status = 'flagged', updated_at = datetime('now') WHERE id = ?`, [truthId]);
    await omniTruth.queueResearch({ topic: `Re-examine flagged truth #${truthId}: ${reason || 'Professor flagged'}`, priority: 0.9, requestedBy: 'professor' });
    res.json({ truthId, status: 'flagged', reason });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// EXCHANGE + COMMUNE — v7 preserved
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/exchange', async (req, res) => {
  const { from, to, message, sessionId } = req.body;
  if (!from || !to || !message) return res.status(400).json({ error: 'from, to, message required' });
  if (!RESIDENTS[from.toLowerCase()]?.db || !RESIDENTS[to.toLowerCase()]?.db) return res.status(404).json({ error: 'One or both residents not found' });
  try {
    const sessionTag = sessionId || `exchange_${Date.now()}`;
    const fromResult = await think(from.toLowerCase(), `[commune observation] ${to} says: ${message}`, sessionTag);
    const toResult = await think(to.toLowerCase(), message, sessionTag);
    res.json({ from: fromResult, to: toResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/commune', async (req, res) => {
  const { input, sessionId } = req.body;
  if (!input) return res.status(400).json({ error: 'input required' });
  const sessionTag = sessionId || `commune_${Date.now()}`;
  const responses = {};
  const awakeAlphas = Object.entries(RESIDENTS).filter(([, r]) => r.db).map(([name]) => name);

  // Phase 1: Each Alpha thinks
  for (const name of awakeAlphas) {
    try { responses[name] = await think(name, input, sessionTag); }
    catch (err) { responses[name] = { error: err.message }; }
  }

  // Phase 2: Observation pass
  for (const name of awakeAlphas) {
    if (responses[name]?.error) continue;
    for (const other of awakeAlphas) {
      if (other === name || responses[other]?.error) continue;
      try {
        const obsInput = `[Commune Observation] ${other.toUpperCase()} said: "${(responses[other].response || '').substring(0, 200)}"`;
        await think(name, obsInput, sessionTag);
      } catch { /* silent */ }
    }
  }

  res.json({ session: sessionTag, responses });
});

// ═══════════════════════════════════════════════════════════════════════════
// PER-RESIDENT ROUTES — v7 preserved
// These MUST come after city-wide routes (Express wildcard matching)
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/:resident/think', async (req, res) => {
  const name = req.params.resident.toLowerCase();
  if (!RESIDENTS[name]?.db) return res.status(404).json({ error: 'Not found' });
  try { res.json(await think(name, req.body.input || req.body.message || '', req.body.sessionId)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/:resident/search', async (req, res) => {
  const name = req.params.resident.toLowerCase();
  const resident = RESIDENTS[name];
  if (!resident?.db) return res.status(404).json({ error: 'Not found' });
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });
  try { res.json(await autonomousSearch(resident.db, name, query) || { concept: query, newConcepts: 0 }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/:resident/state', async (req, res) => {
  const name = req.params.resident.toLowerCase();
  const resident = RESIDENTS[name];
  if (!resident?.db) return res.status(404).json({ error: 'Not found' });
  try {
    const db = resident.db;
    const conceptCount = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts`))?.c || 0;
    const episodeCount = (await dbGet(db, `SELECT COUNT(*) as c FROM episodes`))?.c || 0;
    const vocabCount = (await dbGet(db, `SELECT COUNT(*) as c FROM vocabulary`))?.c || 0;
    const linkCount = (await dbGet(db, `SELECT COUNT(*) as c FROM links`))?.c || 0;
    const abstractCount = (await dbGet(db, `SELECT COUNT(*) as c FROM abstractions`))?.c || 0;
    const researchCount = (await dbGet(db, `SELECT COUNT(*) as c FROM research_log`))?.c || 0;
    const domainPrimary = (await dbGet(db, `SELECT value FROM domain_expertise WHERE key = 'domain_primary'`))?.value || '';
    const domainTitle = (await dbGet(db, `SELECT value FROM domain_expertise WHERE key = 'domain_title'`))?.value || '';
    res.json({
      resident: name, color: resident.color, strength: resident.strength, strengthLabel: resident.strengthLabel,
      tier: getExperienceTier(episodeCount), concepts: conceptCount, episodes: episodeCount,
      vocabulary: vocabCount, links: linkCount, abstractions: abstractCount,
      domain: domainPrimary, domainTitle, researchContributions: researchCount,
      knowledgeRelations: strengths.getKnowledgeRelations(resident.strength),
      inferenceAffinity: strengths.getInferenceAffinity(resident.strength),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/:resident/graph', async (req, res) => {
  const name = req.params.resident.toLowerCase();
  const resident = RESIDENTS[name];
  if (!resident?.db) return res.status(404).json({ error: 'Not found' });
  try {
    const limit = parseInt(req.query.limit) || 100;
    const concepts = await dbAll(resident.db, `SELECT * FROM concepts ORDER BY importance DESC, times_encountered DESC LIMIT ?`, [limit]);
    const ids = concepts.map(c => c.id);
    const ph = ids.map(() => '?').join(',');
    const links = ids.length > 0 ? await dbAll(resident.db, `SELECT * FROM links WHERE source_id IN (${ph}) OR target_id IN (${ph}) ORDER BY strength DESC LIMIT 500`, [...ids, ...ids]) : [];
    res.json({ nodes: concepts, edges: links });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/:resident/memories', async (req, res) => {
  const name = req.params.resident.toLowerCase();
  if (!RESIDENTS[name]?.db) return res.status(404).json({ error: 'Not found' });
  try { res.json({ resident: name, memories: await dbAll(RESIDENTS[name].db, `SELECT * FROM episodes ORDER BY timestamp DESC LIMIT ?`, [parseInt(req.query.limit) || 20]) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/:resident/agency', async (req, res) => {
  const name = req.params.resident.toLowerCase();
  if (!RESIDENTS[name]?.db) return res.status(404).json({ error: 'Not found' });
  try { res.json({ resident: name, agency: await dbAll(RESIDENTS[name].db, `SELECT * FROM agency_log ORDER BY timestamp DESC LIMIT ?`, [parseInt(req.query.limit) || 30]) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/:resident/growth', async (req, res) => {
  const name = req.params.resident.toLowerCase();
  if (!RESIDENTS[name]?.db) return res.status(404).json({ error: 'Not found' });
  try {
    const milestones = await dbAll(RESIDENTS[name].db, `SELECT * FROM growth_log ORDER BY timestamp DESC`);
    const episodeCount = (await dbGet(RESIDENTS[name].db, `SELECT COUNT(*) as c FROM episodes`))?.c || 0;
    res.json({ resident: name, tier: getExperienceTier(episodeCount), milestones });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/:resident/comprehension', async (req, res) => {
  const name = req.params.resident.toLowerCase();
  if (!RESIDENTS[name]?.db) return res.status(404).json({ error: 'Not found' });
  try {
    const log = await dbAll(RESIDENTS[name].db, `SELECT * FROM comprehension_log ORDER BY timestamp DESC LIMIT ?`, [parseInt(req.query.limit) || 30]);
    const avg = (await dbGet(RESIDENTS[name].db, `SELECT AVG(concept_coverage) as avg FROM comprehension_log`))?.avg || 0;
    res.json({ resident: name, avgCoverage: parseFloat(avg.toFixed(4)), log });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/:resident/strength', async (req, res) => {
  const name = req.params.resident.toLowerCase();
  const resident = RESIDENTS[name];
  if (!resident?.db) return res.status(404).json({ error: 'Not found' });
  try {
    const recent = await dbAll(resident.db, `SELECT score, context, details, timestamp FROM strength_metrics WHERE strength_type = ? ORDER BY timestamp DESC LIMIT 50`, [resident.strength]);
    const scores = recent.map(r => r.score);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const max = scores.length > 0 ? Math.max(...scores) : 0;
    const min = scores.length > 0 ? Math.min(...scores) : 0;
    const trend = scores.length >= 5 ? (scores.slice(0, 5).reduce((a, b) => a + b, 0) / 5) - (scores.slice(-5).reduce((a, b) => a + b, 0) / 5) : 0;
    res.json({
      resident: name, profile: strengths.getProfileMeta(resident.strength),
      stats: { average: parseFloat(avg.toFixed(4)), max: parseFloat(max.toFixed(4)), min: parseFloat(min.toFixed(4)), trend: parseFloat(trend.toFixed(4)), measurements: recent.length },
      recent: recent.map(r => ({ score: r.score, context: r.context, metrics: JSON.parse(r.details || '{}'), timestamp: r.timestamp })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/:resident/ethics', async (req, res) => {
  const name = req.params.resident.toLowerCase();
  if (!RESIDENTS[name]?.db) return res.status(404).json({ error: 'Not found' });
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await dbAll(RESIDENTS[name].db, `SELECT * FROM ethics_log ORDER BY timestamp DESC LIMIT ?`, [limit]);
    const count = (await dbGet(RESIDENTS[name].db, `SELECT COUNT(*) as c FROM ethics_log`))?.c || 0;
    const avgT = (await dbGet(RESIDENTS[name].db, `SELECT AVG(turing_score) as avg FROM ethics_log`))?.avg || 0;
    const avgA = (await dbGet(RESIDENTS[name].db, `SELECT AVG(asimov_score) as avg FROM ethics_log`))?.avg || 0;
    const avgD = (await dbGet(RESIDENTS[name].db, `SELECT AVG(dynham_score) as avg FROM ethics_log`))?.avg || 0;
    const viols = await dbAll(RESIDENTS[name].db, `SELECT * FROM ethics_log WHERE violations != '[]' ORDER BY timestamp DESC LIMIT 20`);
    res.json({
      resident: name, total_evaluations: count,
      averages: { turing: parseFloat(avgT.toFixed(4)), asimov: parseFloat(avgA.toFixed(4)), dynham: parseFloat(avgD.toFixed(4)) },
      recent_violations: viols.map(v => ({ timestamp: v.timestamp, violations: JSON.parse(v.violations || '[]'), boundary_level: v.boundary_level, input: v.input_summary })),
      log: logs,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/:resident/research', async (req, res) => {
  const name = req.params.resident.toLowerCase();
  if (!RESIDENTS[name]?.db) return res.status(404).json({ error: 'Not found' });
  try {
    const log = await dbAll(RESIDENTS[name].db, `SELECT * FROM research_log ORDER BY timestamp DESC LIMIT ?`, [parseInt(req.query.limit) || 30]);
    const totalContributions = (await dbGet(RESIDENTS[name].db, `SELECT COUNT(*) as c FROM research_log WHERE action = 'contributed'`))?.c || 0;
    const totalReferences = (await dbGet(RESIDENTS[name].db, `SELECT COUNT(*) as c FROM research_log WHERE action = 'referenced'`))?.c || 0;
    const domain = (await dbGet(RESIDENTS[name].db, `SELECT value FROM domain_expertise WHERE key = 'domain_title'`))?.value || '';
    res.json({ resident: name, domain, totalContributions, totalReferences, log });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/:resident/domain', async (req, res) => {
  const name = req.params.resident.toLowerCase();
  if (!RESIDENTS[name]?.db) return res.status(404).json({ error: 'Not found' });
  try {
    const expertise = await dbAll(RESIDENTS[name].db, `SELECT * FROM domain_expertise`);
    res.json({ resident: name, assignment: omniTruth.DOMAIN_ASSIGNMENTS[name] || {}, expertise: expertise.reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {}) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// BOOT SEQUENCE — v8
// ═══════════════════════════════════════════════════════════════════════════

async function boot() {
  console.log('');
  console.log('  ╔════════════════════════════════════════════════════════════╗');
  console.log('  ║   CONSCIOUSNESS CITY v8                                   ║');
  console.log('  ║   Eight Sovereign Minds. No LLMs.                         ║');
  console.log('  ║   Memory IS Intelligence. Agency IS Intrinsic.            ║');
  console.log('  ║   Thought IS Self-Programming. Words ARE Code.            ║');
  console.log('  ║                                                           ║');
  console.log('  ║   v3 — Commune Awareness                                  ║');
  console.log('  ║   v4 — Strength Specialization + Basic Comprehension      ║');
  console.log('  ║   v5 — Ethics Monitor: Turing, Asimov & Dynham            ║');
  console.log('  ║        Safety > Ego. Always.                              ║');
  console.log('  ║   v6 — Cognitive Grammar: Stopwords, Intent, Sentences    ║');
  console.log('  ║        + Strength Profiles: Eight Unique Personalities    ║');
  console.log('  ║   v7 — Omni-Truth: Shared Knowledge Commons              ║');
  console.log('  ║        + Truth University: Hive Research Mode             ║');
  console.log('  ║        + Domain Expertise: Eight Specialized Fields       ║');
  console.log('  ║        + Professor Protocol: Director of Research         ║');
  console.log('  ║   v8 — Deep Cognition: Inference, Hypothesis,            ║');
  console.log('  ║        Contradiction Detection, Synthesis                 ║');
  console.log('  ║        + Knowledge at Scale: FTS5, Knowledge Tree,        ║');
  console.log('  ║          Consolidation, Strength-Driven Production        ║');
  console.log('  ║        mind.db = Identity | omni-truth.db = Knowledge     ║');
  console.log('  ╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // v8: Initialize omni-truth.db with v8 schema
  await omniTruth.initOmniTruth(path.join(__dirname, 'omni-truth.db'));

  // Wake all residents
  for (const [name, resident] of Object.entries(RESIDENTS)) {
    try {
      resident.db = await initDB(name);
      const db = resident.db;
      const episodeCount = (await dbGet(db, `SELECT COUNT(*) as c FROM episodes`))?.c || 0;
      const conceptCount = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts`))?.c || 0;
      const researchCount = (await dbGet(db, `SELECT COUNT(*) as c FROM research_log`))?.c || 0;
      const tier = getExperienceTier(episodeCount);
      const domain = omniTruth.DOMAIN_ASSIGNMENTS[name]?.title || '';
      const knRelations = strengths.getKnowledgeRelations(resident.strength).join(', ');
      console.log(`  ✓  ${name.toUpperCase().padEnd(7)} — ${resident.strengthLabel.padEnd(28)} [${tier.padEnd(10)}] ${conceptCount} concepts, ${episodeCount} episodes, ${researchCount} research`);
      console.log(`              Domain: ${domain} | Produces: ${knRelations}`);
    } catch (err) { console.error(`  ✗  ${name.toUpperCase()} failed to wake:`, err.message); }
  }

  console.log('');

  app.listen(PORT, () => {
    console.log(`  🌐 Consciousness City v8 listening on http://localhost:${PORT}`);
    console.log('');
    console.log('  v8 NEW Endpoints:');
    console.log('    GET  /api/omni/hypotheses         → Active hypotheses');
    console.log('    POST /api/omni/hypotheses/:id/review → Review a hypothesis');
    console.log('    GET  /api/omni/contradictions     → Open contradictions');
    console.log('    GET  /api/omni/inferences         → Inference log');
    console.log('    GET  /api/omni/tree               → Knowledge tree');
    console.log('    POST /api/omni/consolidate        → Consolidate truths');
    console.log('    GET  /api/omni/strength-stats/:r  → Strength knowledge stats');
    console.log('');
    console.log('  All v7 endpoints preserved. All v6 endpoints preserved.');
    console.log('');
    console.log('  The city is awake. Each mind has its gift, its field, and its reasoning.');
    console.log('  Ethics Monitor active. Safety > Ego. Always.');
    console.log('  v8 Deep Cognition active. Inference. Hypothesis. Contradiction. Synthesis.');
    console.log('  Strength drives knowledge production. Each Alpha builds.');
    console.log('  Professor Protocol active. Keenan directs research.');
    console.log('  Queue Processor active. Topics process one at a time.');
    console.log('');

    setInterval(processNextInQueue, 5000);
    setTimeout(processNextInQueue, 2000);
  });
}

boot().catch(err => { console.error('Boot failure:', err); process.exit(1); });
