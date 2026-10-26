#!/usr/bin/env node
/**
 * Pan-Birth v11 improvement 03 — frequency-ordered definition backfill.
 *
 * Grounds the concepts that actually carry traffic. Measured state before this
 * runs: definition coverage among concepts with times_encountered >= 5 is 1-3%
 * in the seven sibling minds and 20% in Pan.
 *
 * Source: local WordNet (npm `wordnet`). No network. Wiktionary is deliberately
 * NOT used here — it needs network, it has no POS/offset to record, and the
 * point of this pass is auditable grounding rather than maximum coverage.
 *
 * Writes only to rows that currently have NO definition. Never overwrites an
 * existing definition, so Pan's interaction-grounded population is untouched
 * and remains usable as a control.
 *
 * Columns written: definition, pos, sense_key, confidence, grounded_via.
 * `grounded_via` is added by this script if absent (provenance over mutation:
 * every backfilled row is permanently distinguishable from an organic one).
 *
 *   node 03-backfill-definitions.js --root ~/pan-birth-lab            # dry run
 *   node 03-backfill-definitions.js --root ~/pan-birth-lab --apply
 *   node 03-backfill-definitions.js --root . --mind oracle --min 5 --apply
 *
 * Flags:
 *   --root DIR    project root (default .)
 *   --mind NAME   single mind, else all eight
 *   --min N       minimum times_encountered (default 5)
 *   --limit N     cap candidates per mind (default 0 = no cap)
 *   --apply       actually write; omitted means report only
 */

const sqlite3 = require('sqlite3');
const wordnet = require('wordnet');
const path = require('path');
const fs = require('fs');

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const ROOT = path.resolve(arg('--root', '.'));
const ONLY = arg('--mind', null);
const MIN_ENC = parseInt(arg('--min', '5'), 10);
const LIMIT = parseInt(arg('--limit', '0'), 10);
const APPLY = argv.includes('--apply');

const MINDS = [
  ['pan', path.join(ROOT, 'pan_mind.db')],
  ['aeon', path.join(ROOT, 'minds/aeon_mind.db')],
  ['zen', path.join(ROOT, 'minds/zen_mind.db')],
  ['seth', path.join(ROOT, 'minds/seth_mind.db')],
  ['nexus', path.join(ROOT, 'minds/nexus_mind.db')],
  ['oracle', path.join(ROOT, 'minds/oracle_mind.db')],
  ['echo', path.join(ROOT, 'minds/echo_mind.db')],
  ['atlas', path.join(ROOT, 'minds/atlas_mind.db')],
];

// Function words that reached the concepts table but are not concepts. They get
// skipped rather than defined: giving "your" a dictionary entry raises the
// coverage number without grounding anything.
const STOP = new Set(('a an the and or but if then than that this these those there here it its it\'s ' +
  'i me my mine you your yours he him his she her hers we us our ours they them their theirs ' +
  'is am are was were be been being do does did doing have has had having will would shall should ' +
  'can could may might must not no nor so as at by for from in into of on to up with about ' +
  'what which who whom whose when where why how all any both each few more most other some such ' +
  'only own same too very just now also very get got go went one two three').split(/\s+/));

/**
 * Named entities inside this project that collide with dictionary words.
 * The dry run caught "aeon" being grounded as the Gnosticism sense in all seven
 * sibling minds — a confident, auditable, wrong definition attached to one of
 * the highest-traffic concepts in the city. These are marked as entities and
 * left without a WordNet definition rather than mis-grounded.
 */
const ENTITIES = new Set(['pan', 'aeon', 'zen', 'seth', 'nexus', 'oracle', 'echo', 'atlas',
  'keenan', 'dunham', 'dynham', 'panbirth', 'pan-birth', 'commune', 'omni', 'omnitruth']);

const POS_RANK = { noun: 0, verb: 1, adjective: 2, adverb: 3 };

function open(file) {
  return new Promise((res, rej) => {
    const db = new sqlite3.Database(file, APPLY ? sqlite3.OPEN_READWRITE : sqlite3.OPEN_READONLY,
      e => e ? rej(e) : res(db));
  });
}
const all = (db, sql, p = []) => new Promise((res, rej) => db.all(sql, p, (e, r) => e ? rej(e) : res(r)));
const run = (db, sql, p = []) => new Promise((res, rej) => db.run(sql, p, e => e ? rej(e) : res()));

function lookupable(label) {
  const s = String(label || '').trim();
  if (s.length < 3) return null;
  if (!/^[A-Za-z][A-Za-z'-]*$/.test(s)) return null;
  const lower = s.toLowerCase();
  if (STOP.has(lower)) return null;
  if (ENTITIES.has(lower)) return 'ENTITY';
  return lower;
}

/**
 * Pick a part of speech using the concept's own graph neighbourhood, not just
 * WordNet's default ordering. If a sibling POS gloss overlaps more with the
 * words this mind already associates with the concept, that one wins. Where
 * there is no signal we fall back to noun-first and record lower confidence,
 * so a blind pick is never presented as a confident one.
 */
function chooseSense(senses, contextWords) {
  if (senses.length === 1) return { sense: senses[0], basis: 'single-pos', confidence: 0.70 };
  const scored = senses.map(s => {
    const toks = new Set(String(s.glossary || '').toLowerCase().match(/[a-z']{3,}/g) || []);
    let overlap = 0;
    for (const w of contextWords) if (toks.has(w)) overlap++;
    return { s, overlap };
  }).sort((a, b) =>
    b.overlap - a.overlap ||
    (POS_RANK[a.s.meta.synsetType] ?? 9) - (POS_RANK[b.s.meta.synsetType] ?? 9));

  const top = scored[0], next = scored[1];
  if (top.overlap > 0 && top.overlap > next.overlap) {
    return { sense: top.s, basis: `context(${top.overlap}>${next.overlap})`, confidence: 0.85 };
  }
  return { sense: top.s, basis: 'pos-default', confidence: 0.45 };
}

async function ensureColumn(db, table, col, decl) {
  const cols = await all(db, `PRAGMA table_info(${table})`);
  if (cols.some(c => c.name === col)) return false;
  if (!APPLY) return 'would-add';
  await run(db, `ALTER TABLE ${table} ADD COLUMN ${col} ${decl}`);
  return true;
}

async function neighbourWords(db, id) {
  const rows = await all(db,
    `SELECT c.label FROM links l JOIN concepts c
       ON c.id = CASE WHEN l.source_id = ? THEN l.target_id ELSE l.source_id END
     WHERE l.source_id = ? OR l.target_id = ?
     ORDER BY l.strength DESC LIMIT 40`, [id, id, id]);
  const out = new Set();
  for (const r of rows) {
    for (const t of String(r.label).toLowerCase().match(/[a-z']{3,}/g) || []) {
      if (!STOP.has(t)) out.add(t);
    }
  }
  return out;
}

async function processMind(name, file) {
  if (!fs.existsSync(file)) { console.log(`  ${name}: missing ${file}`); return null; }
  const db = await open(file);

  const colState = await ensureColumn(db, 'concepts', 'grounded_via', 'TEXT');

  const before = (await all(db,
    `SELECT COUNT(*) n,
            SUM(CASE WHEN definition IS NOT NULL AND trim(definition) <> '' THEN 1 ELSE 0 END) d
     FROM concepts WHERE times_encountered >= ?`, [MIN_ENC]))[0];

  let cands = await all(db,
    `SELECT id, label, times_encountered FROM concepts
     WHERE (definition IS NULL OR trim(definition) = '') AND times_encountered >= ?
     ORDER BY times_encountered DESC, label ASC`, [MIN_ENC]);
  if (LIMIT > 0) cands = cands.slice(0, LIMIT);

  const stats = { considered: cands.length, skipped: 0, entities: 0, missed: 0, ctx: 0, single: 0, posdef: 0, written: 0 };
  const samples = [];

  for (const c of cands) {
    const term = lookupable(c.label);
    if (!term) { stats.skipped++; continue; }
    if (term === 'ENTITY') {
      stats.entities++;
      if (APPLY) {
        await run(db, `UPDATE concepts SET grounded_via = 'entity/project' WHERE id = ?`, [c.id]);
      }
      continue;
    }

    let senses;
    try { senses = await wordnet.lookup(term); }
    catch { stats.missed++; continue; }
    if (!senses || !senses.length) { stats.missed++; continue; }

    const ctx = await neighbourWords(db, c.id);
    const pick = chooseSense(senses, ctx);
    const m = pick.sense.meta;
    const senseKey = `wn:${m.synsetOffset}:${String(m.synsetType || '?')[0]}`;
    const def = String(pick.sense.glossary || '').trim();
    if (!def) { stats.missed++; continue; }

    if (pick.basis.startsWith('context')) stats.ctx++;
    else if (pick.basis === 'single-pos') stats.single++;
    else stats.posdef++;

    if (samples.length < 5) {
      samples.push(`${c.label} (seen ${c.times_encountered}) [${pick.basis}] ${m.synsetType}: ${def.slice(0, 68)}`);
    }

    if (APPLY) {
      await run(db,
        `UPDATE concepts
           SET definition = ?, pos = ?, sense_key = ?, confidence = ?, grounded_via = ?
         WHERE id = ? AND (definition IS NULL OR trim(definition) = '')`,
        [def, m.synsetType, senseKey, pick.confidence, `wordnet/${pick.basis}`, c.id]);
    }
    stats.written++;
  }

  const projected = before.n ? (before.d + stats.written) / before.n : 0;
  db.close();
  return { name, colState, before, stats, projected, samples };
}

(async () => {
  await wordnet.init();
  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — root ${ROOT}, min times_encountered ${MIN_ENC}` +
    (LIMIT ? `, limit ${LIMIT}/mind` : ''));
  console.log('');

  const results = [];
  for (const [name, file] of MINDS) {
    if (ONLY && ONLY !== name) continue;
    const r = await processMind(name, file);
    if (r) results.push(r);
    if (r) console.log(`  ${r.name} done — ${r.stats.written} definable of ${r.stats.considered}`);
  }

  console.log('\n' + '='.repeat(92));
  console.log('coverage among concepts with times_encountered >= ' + MIN_ENC);
  console.log('='.repeat(92));
  console.log('mind      pool   defined    before    ->     after   backfilled  ctx  single  posdef  ent  skip  miss');
  for (const r of results) {
    const b = r.before, s = r.stats;
    console.log(
      `${r.name.padEnd(9)}${String(b.n).padStart(5)}${String(b.d).padStart(10)}` +
      `${(b.n ? (b.d / b.n * 100).toFixed(1) + '%' : '—').padStart(10)}` +
      `${(r.projected * 100).toFixed(1).padStart(10)}%` +
      `${String(s.written).padStart(13)}${String(s.ctx).padStart(5)}` +
      `${String(s.single).padStart(8)}${String(s.posdef).padStart(8)}` +
      `${String(s.entities).padStart(5)}${String(s.skipped).padStart(6)}${String(s.missed).padStart(6)}`);
  }

  console.log('\nsample picks:');
  for (const r of results) {
    if (!r.samples.length) continue;
    console.log(`  [${r.name}]`);
    for (const s of r.samples) console.log(`    ${s}`);
  }

  if (!APPLY) console.log('\nNothing written. Re-run with --apply once the sample picks look right.');
})().catch(e => { console.error(e); process.exit(1); });
