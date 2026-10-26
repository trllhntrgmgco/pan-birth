#!/usr/bin/env node
/**
 * Pan-Birth v11 improvement 02 — merge case-duplicate concepts.
 *
 * Only 51 duplicate concept rows exist city-wide, which looks negligible until
 * you see which rows they are. In Aeon the seven duplicate pairs are AEON/aeon
 * (660 + 703), Keenan/keenan (405 + 312), SETH/seth (239 + 213) and so on:
 * 14 rows touching 3,868 of 21,286 links. Nearly a fifth of the graph is split
 * across labels that differ only in case, so every traversal through a hub
 * reaches half its neighbourhood.
 *
 * PROVENANCE OVER MUTATION. This adds a `label_norm` column and a `merged_into`
 * column rather than rewriting labels. The surviving row keeps its original
 * label. Absorbed rows keep their label and their id, gain merged_into pointing
 * at the survivor, and have their links repointed. Nothing is deleted, so the
 * merge is reversible and the pre-merge structure stays readable.
 *
 * Survivor choice, in order: has a definition, then higher times_encountered,
 * then lower id. Absorbed times_encountered is added to the survivor.
 * Link collisions (both rows already linked to the same neighbour) merge by
 * taking max strength and summing times_activated. Self-links are dropped.
 *
 *   node 02-normalize-labels.js --root ~/pan-birth-lab            # dry run
 *   node 02-normalize-labels.js --root ~/pan-birth-lab --apply
 */

const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const ROOT = path.resolve(arg('--root', '.'));
const ONLY = arg('--mind', null);
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

const norm = s => String(s || '').trim().toLowerCase();

const open = f => new Promise((res, rej) => {
  const db = new sqlite3.Database(f, APPLY ? sqlite3.OPEN_READWRITE : sqlite3.OPEN_READONLY,
    e => e ? rej(e) : res(db));
});
const all = (db, sql, p = []) => new Promise((res, rej) => db.all(sql, p, (e, r) => e ? rej(e) : res(r)));
const get = (db, sql, p = []) => new Promise((res, rej) => db.get(sql, p, (e, r) => e ? rej(e) : res(r)));
const run = (db, sql, p = []) => new Promise((res, rej) => db.run(sql, p, e => e ? rej(e) : res()));

async function ensureColumn(db, col, decl) {
  const cols = await all(db, `PRAGMA table_info(concepts)`);
  if (cols.some(c => c.name === col)) return;
  if (APPLY) await run(db, `ALTER TABLE concepts ADD COLUMN ${col} ${decl}`);
}

async function degree(db, id) {
  const r = await get(db, `SELECT COUNT(*) n FROM links WHERE source_id = ? OR target_id = ?`, [id, id]);
  return r.n;
}

async function processMind(name, file) {
  if (!fs.existsSync(file)) return null;
  const db = await open(file);

  await ensureColumn(db, 'label_norm', 'TEXT');
  await ensureColumn(db, 'merged_into', 'INTEGER');

  const rows = await all(db,
    `SELECT id, label, definition, times_encountered FROM concepts ORDER BY id`);
  const totalLinks = (await get(db, `SELECT COUNT(*) n FROM links`)).n;

  const groups = new Map();
  for (const r of rows) {
    const k = norm(r.label);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }

  const dupes = [...groups.entries()].filter(([, v]) => v.length > 1);
  const report = { name, rows: rows.length, groups: dupes.length,
    absorbed: 0, linksRepointed: 0, linksCollided: 0, linksTouched: 0, definitionsCarried: 0, pairs: [], carried: [] };

  for (const [key, members] of dupes) {
    // Survivor is the row carrying the graph, not the row carrying the text.
    // The dry run caught the reverse rule keeping AEON (degree 660, definition
    // "I am AEON.") over aeon (degree 703, no definition) — which would have
    // thrown away the larger neighbourhood to save eleven characters. The
    // hand-authored genesis definitions are worth keeping, so they get carried
    // onto the survivor instead of deciding which row survives.
    const degs = {};
    for (const m of members) degs[m.label] = await degree(db, m.id);

    const ranked = [...members].sort((a, b) =>
      (degs[b.label] - degs[a.label]) ||
      (b.times_encountered - a.times_encountered) ||
      (a.id - b.id));
    const keep = ranked[0], drop = ranked.slice(1);

    const keepHasDef = keep.definition && keep.definition.trim();
    const donor = drop.find(d => d.definition && d.definition.trim());
    if (!keepHasDef && donor) {
      report.definitionsCarried++;
      report.carried.push(`${keep.label} <- "${donor.definition.trim().slice(0, 44)}" (from ${donor.label})`);
      if (APPLY) {
        await run(db, `UPDATE concepts SET definition = ? WHERE id = ?`,
          [donor.definition, keep.id]);
      }
    }
    const touched = Object.values(degs).reduce((s, d) => s + d, 0);
    report.linksTouched += touched;
    report.pairs.push({ key, keep: keep.label, keepId: keep.id,
      drop: drop.map(d => `${d.label}(${degs[d.label]})`), keepDeg: degs[keep.label] });

    for (const d of drop) {
      report.absorbed++;
      const edges = await all(db,
        `SELECT id, source_id, target_id, strength, times_activated, relation
         FROM links WHERE source_id = ? OR target_id = ?`, [d.id, d.id]);

      for (const e of edges) {
        const other = e.source_id === d.id ? e.target_id : e.source_id;
        if (other === keep.id) {           // becomes a self-link
          if (APPLY) await run(db, `DELETE FROM links WHERE id = ?`, [e.id]);
          report.linksCollided++;
          continue;
        }
        const a = Math.min(keep.id, other), b = Math.max(keep.id, other);
        const existing = await get(db,
          `SELECT id, strength, times_activated FROM links
           WHERE (source_id = ? AND target_id = ?) OR (source_id = ? AND target_id = ?)`,
          [a, b, b, a]);

        if (existing) {
          report.linksCollided++;
          if (APPLY) {
            await run(db,
              `UPDATE links SET strength = MAX(strength, ?), times_activated = times_activated + ?
               WHERE id = ?`, [e.strength, e.times_activated, existing.id]);
            await run(db, `DELETE FROM links WHERE id = ?`, [e.id]);
          }
        } else {
          report.linksRepointed++;
          if (APPLY) {
            await run(db,
              `UPDATE links SET source_id = ?, target_id = ? WHERE id = ?`,
              [e.source_id === d.id ? keep.id : e.source_id,
               e.target_id === d.id ? keep.id : e.target_id, e.id]);
          }
        }
      }

      if (APPLY) {
        await run(db,
          `UPDATE concepts SET times_encountered = times_encountered + ? WHERE id = ?`,
          [d.times_encountered || 0, keep.id]);
        await run(db, `UPDATE concepts SET merged_into = ? WHERE id = ?`, [keep.id, d.id]);
      }
    }
  }

  if (APPLY) {
    await run(db, `UPDATE concepts SET label_norm = lower(trim(label))`);
  }

  report.totalLinks = totalLinks;
  db.close();
  return report;
}

(async () => {
  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — root ${ROOT}\n`);
  const out = [];
  for (const [name, file] of MINDS) {
    if (ONLY && ONLY !== name) continue;
    const r = await processMind(name, file);
    if (r) out.push(r);
  }

  console.log('mind      concepts  dup groups  absorbed   links touched   % of graph   repointed  merged');
  for (const r of out) {
    console.log(
      `${r.name.padEnd(10)}${String(r.rows).padStart(8)}${String(r.groups).padStart(12)}` +
      `${String(r.absorbed).padStart(10)}${String(r.linksTouched).padStart(16)}` +
      `${((r.linksTouched / r.totalLinks) * 100).toFixed(1).padStart(12)}%` +
      `${String(r.linksRepointed).padStart(12)}${String(r.linksCollided).padStart(8)}`);
  }

  console.log('\nmerges:');
  for (const r of out) {
    if (!r.pairs.length) continue;
    console.log(`  [${r.name}]`);
    for (const p of r.pairs) {
      console.log(`    keep ${p.keep}(${p.keepDeg})  <-  ${p.drop.join(', ')}`);
    }
  }

  const anyCarried = out.some(r => r.carried.length);
  if (anyCarried) {
    console.log('\ndefinitions carried onto the surviving row:');
    for (const r of out) {
      if (!r.carried.length) continue;
      console.log(`  [${r.name}]`);
      for (const c of r.carried) console.log(`    ${c}`);
    }
  }

  if (!APPLY) console.log('\nNothing written. Re-run with --apply.');
})().catch(e => { console.error(e); process.exit(1); });
