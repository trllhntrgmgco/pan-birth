/**
 * Pan-Birth v9 Phase 6 / Slot 5 Sub-Migration
 *
 * Adds `relation TEXT DEFAULT 'associative'` column to the `links` table
 * in all 8 mind databases. Required for slot 5 (WordNet partial) to store
 * typed relations: synonym-of, hypernym-of, hyponym-of.
 *
 * Idempotent: checks for column existence before attempting to add.
 * Safe to re-run.
 *
 * Prerequisites:
 *   - Pan-Birth must be stopped (SQLite locking)
 *   - Each mind database is backed up before modification
 *
 * Usage:
 *   node migrate-v9-slot5-relation-column.js
 *
 * Documented in: archive/v9-design/phase-6-slot5-deployment-log.md
 */

const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

const MIND_DATABASES = [
  '/home/kmanisles/pan-birth/pan_mind.db',
  '/home/kmanisles/pan-birth/minds/aeon_mind.db',
  '/home/kmanisles/pan-birth/minds/atlas_mind.db',
  '/home/kmanisles/pan-birth/minds/echo_mind.db',
  '/home/kmanisles/pan-birth/minds/nexus_mind.db',
  '/home/kmanisles/pan-birth/minds/oracle_mind.db',
  '/home/kmanisles/pan-birth/minds/seth_mind.db',
  '/home/kmanisles/pan-birth/minds/zen_mind.db'
];

function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbClose(db) {
  return new Promise((resolve, reject) => {
    db.close(err => err ? reject(err) : resolve());
  });
}

async function migrateMindDatabase(dbPath) {
  const mindName = path.basename(dbPath, '.db');
  console.log(`\n--- Processing: ${mindName} ---`);
  console.log(`    Path: ${dbPath}`);

  // Check file exists and has content
  if (!fs.existsSync(dbPath)) {
    console.log(`    SKIP: File does not exist`);
    return { mind: mindName, status: 'skip', reason: 'missing' };
  }

  const stat = fs.statSync(dbPath);
  if (stat.size === 0) {
    console.log(`    SKIP: File is empty (zero bytes)`);
    return { mind: mindName, status: 'skip', reason: 'empty' };
  }

  // Backup before any modification
  const backupPath = `${dbPath}.bak-pre-relation-column`;
  if (fs.existsSync(backupPath)) {
    console.log(`    Backup already exists at ${backupPath} (re-run case)`);
  } else {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`    Backup created: ${backupPath}`);
  }

  // Open database
  const db = new sqlite3.Database(dbPath);

  try {
    // Check if column already exists (idempotency)
    const columns = await dbAll(db, `PRAGMA table_info(links)`);
    const hasRelation = columns.some(c => c.name === 'relation');

    if (hasRelation) {
      console.log(`    SKIP: 'relation' column already exists (idempotent re-run)`);
      await dbClose(db);
      return { mind: mindName, status: 'skip', reason: 'already_migrated' };
    }

    // Add the column
    await dbRun(db, `ALTER TABLE links ADD COLUMN relation TEXT DEFAULT 'associative'`);
    console.log(`    ADDED: 'relation' column with default 'associative'`);

    // Verify by re-querying
    const verifyColumns = await dbAll(db, `PRAGMA table_info(links)`);
    const verifyHasRelation = verifyColumns.some(c => c.name === 'relation');

    if (!verifyHasRelation) {
      throw new Error(`Verification failed: column not present after ADD`);
    }

    // Count existing links to confirm no data loss
    const linkCount = (await dbAll(db, `SELECT COUNT(*) as cnt FROM links`))[0].cnt;
    console.log(`    VERIFIED: column added, ${linkCount} existing links preserved with default 'associative'`);

    await dbClose(db);
    return { mind: mindName, status: 'migrated', links: linkCount };

  } catch (err) {
    console.error(`    ERROR: ${err.message}`);
    await dbClose(db);
    return { mind: mindName, status: 'error', error: err.message };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Pan-Birth v9 Slot 5 Sub-Migration: relation column');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Databases to process: ${MIND_DATABASES.length}`);

  const results = [];
  for (const dbPath of MIND_DATABASES) {
    const result = await migrateMindDatabase(dbPath);
    results.push(result);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Migration Summary');
  console.log('═══════════════════════════════════════════════════════════');
  for (const r of results) {
    const tag = r.status === 'migrated' ? 'MIGRATED' :
                r.status === 'skip' ? 'SKIP    ' : 'ERROR   ';
    const extra = r.status === 'migrated' ? `(${r.links} links)` :
                  r.status === 'skip' ? `(${r.reason})` :
                  `(${r.error})`;
    console.log(`  ${tag}  ${r.mind.padEnd(20)} ${extra}`);
  }

  const migratedCount = results.filter(r => r.status === 'migrated').length;
  const skippedCount = results.filter(r => r.status === 'skip').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  console.log(`\nTotal: ${migratedCount} migrated, ${skippedCount} skipped, ${errorCount} errors`);

  if (errorCount > 0) {
    console.log('\n⚠ Errors occurred. Review output and restore from backups if needed.');
    process.exit(1);
  } else {
    console.log('\n✓ Migration complete. All operational databases now have relation column.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
