#!/usr/bin/env node
/**
 * Pan-Birth v11 improvement 04 (workstream C1) — per-episode RNG audit columns.
 *
 * Adds to `episodes`:
 *   rng_seed             TEXT     master seed for the turn
 *   rng_decision_draws   INTEGER  decision-channel draw count
 *   rng_surface_draws    INTEGER  surface-channel draw count
 *   rng_digest           TEXT     "<decision>:<surface>" control-flow fingerprint
 *
 * And creates `replay_runs`, which records an archived run as a unit so two
 * runs can be compared without hunting through episodes:
 *
 *   label, engine_version, git_commit, prompt_set, started_at, notes
 *
 * The seed is stored rather than only derived. deriveSeed() reproduces it from
 * mind/session/turn today, but a stored seed survives a change to that function
 * and a derived one does not. Baselines have to outlive the code that made them.
 *
 *   node 04-migrate-rng-columns.js --root .            # dry run
 *   node 04-migrate-rng-columns.js --root . --apply
 */

const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const ROOT = path.resolve(arg('--root', '.'));
const APPLY = argv.includes('--apply');

const MINDS = ['pan_mind.db', 'minds/aeon_mind.db', 'minds/zen_mind.db',
  'minds/seth_mind.db', 'minds/nexus_mind.db', 'minds/oracle_mind.db',
  'minds/echo_mind.db', 'minds/atlas_mind.db'].map(f => path.join(ROOT, f));

const COLUMNS = [
  ['rng_seed', 'TEXT'],
  ['rng_decision_draws', 'INTEGER'],
  ['rng_surface_draws', 'INTEGER'],
  ['rng_digest', 'TEXT'],
];

const REPLAY_RUNS = `CREATE TABLE IF NOT EXISTS replay_runs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  label          TEXT NOT NULL,
  engine_version TEXT,
  git_commit     TEXT,
  prompt_set     TEXT,
  arm            TEXT,
  started_at     TEXT DEFAULT (datetime('now')),
  notes          TEXT
)`;

const open = f => new Promise((res, rej) => {
  const db = new sqlite3.Database(f, APPLY ? sqlite3.OPEN_READWRITE : sqlite3.OPEN_READONLY,
    e => e ? rej(e) : res(db));
});
const all = (db, sql, p = []) => new Promise((res, rej) => db.all(sql, p, (e, r) => e ? rej(e) : res(r)));
const run = (db, sql, p = []) => new Promise((res, rej) => db.run(sql, p, e => e ? rej(e) : res()));

(async () => {
  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — root ${ROOT}\n`);
  for (const file of MINDS) {
    const name = path.basename(file);
    if (!fs.existsSync(file)) { console.log(`  skip ${name} — missing`); continue; }
    const db = await open(file);

    const have = (await all(db, `PRAGMA table_info(episodes)`)).map(c => c.name);
    const missing = COLUMNS.filter(([c]) => !have.includes(c));
    const tables = (await all(db,
      `SELECT name FROM sqlite_master WHERE type='table' AND name='replay_runs'`)).length;

    if (APPLY) {
      for (const [col, decl] of missing) {
        await run(db, `ALTER TABLE episodes ADD COLUMN ${col} ${decl}`);
      }
      if (!tables) await run(db, REPLAY_RUNS);
    }

    console.log(`  ${name.padEnd(18)} columns ${missing.length ? `+${missing.map(m => m[0]).join(', +')}` : 'already present'}` +
      `${tables ? '' : ', +replay_runs'}`);
    db.close();
  }
  if (!APPLY) console.log('\nNothing written. Re-run with --apply.');
  else console.log('\nDone. Columns stay NULL until the engine is wired — see C1-WIRING.md.');
})().catch(e => { console.error(e); process.exit(1); });
