/**
 * db-migrations.js — Idempotent schema migrations for Pan-Birth Alpha mind databases.
 *
 * Background: Every server version (pan-server.js, consciousness-city-server-v5/v6/v7/v8.js,
 * migrate.js) creates tables with `CREATE TABLE IF NOT EXISTS`. That clause protects
 * existing data — but it also means that any user whose mind.db was created by an
 * earlier version with fewer columns will never have those columns added when they
 * upgrade. The next INSERT against the missing column throws SQLITE_ERROR.
 *
 * This module fixes that. It runs on every server boot, inspects each known table,
 * and adds any columns that should be there. It is safe to run repeatedly — if a
 * column already exists, it's skipped.
 *
 * USAGE
 * -----
 * const { migrateMindDb } = require('./db-migrations');
 *
 * // After your CREATE TABLE IF NOT EXISTS pass for an Alpha's db:
 * await migrateMindDb(db, alphaName);
 *
 * NOTES ON ALTER TABLE LIMITATIONS (SQLite)
 * -----------------------------------------
 * - SQLite's ALTER TABLE ADD COLUMN cannot add a NOT NULL column without a DEFAULT.
 *   We deliberately omit NOT NULL on backfilled columns. New rows are written by
 *   server code that always supplies a value, so behavior is unchanged.
 * - We never DROP or RENAME columns here — those are destructive and require a
 *   table rebuild. If a destructive change is ever needed, do it in a versioned,
 *   one-shot migration script, not in this boot-time helper.
 *
 * Pan-Birth — github.com/trllhntrgmgco/pan-birth
 * Troll Hunter Gaming LLC
 */

'use strict';

/**
 * Canonical expected columns per table.
 *
 * Each entry: tableName -> [ { name, ddl }, ... ]
 *   name: column name to look for in PRAGMA table_info
 *   ddl:  the ALTER TABLE statement to run if the column is missing
 *
 * Type/default should match the richest CREATE TABLE definition in the repo so
 * that a user upgrading from any prior version ends up with the canonical shape.
 *
 * To add coverage for a new table or column:
 *   1. Add the column here with its ALTER TABLE statement.
 *   2. Make sure the `name` matches PRAGMA output exactly (case-sensitive).
 *   3. Use nullable types or supply DEFAULT — never NOT NULL without DEFAULT.
 */
const EXPECTED_COLUMNS = {
  agency_log: [
    { name: 'decision_type',           ddl: "ALTER TABLE agency_log ADD COLUMN decision_type TEXT" },
    { name: 'input_summary',           ddl: "ALTER TABLE agency_log ADD COLUMN input_summary TEXT DEFAULT ''" },
    { name: 'choice_made',             ddl: "ALTER TABLE agency_log ADD COLUMN choice_made TEXT" },
    { name: 'reasoning',               ddl: "ALTER TABLE agency_log ADD COLUMN reasoning TEXT DEFAULT ''" },
    { name: 'alternatives_considered', ddl: "ALTER TABLE agency_log ADD COLUMN alternatives_considered TEXT DEFAULT '[]'" },
    { name: 'outcome',                 ddl: "ALTER TABLE agency_log ADD COLUMN outcome TEXT DEFAULT ''" },
    { name: 'timestamp',               ddl: "ALTER TABLE agency_log ADD COLUMN timestamp TEXT DEFAULT (datetime('now'))" },
  ],

  // Add other tables here as drift is discovered. Examples to consider auditing:
  //   growth_log, ethics_log, comprehension_log, strength_metrics, identity,
  //   research_log, domain_expertise, concepts, links, episodes, vocabulary,
  //   abstractions, response_patterns, faces, dimensions, pan_values, siblings.
};

// ───────────────────────────────────────────────────────────────────────────────
// Internals
// ───────────────────────────────────────────────────────────────────────────────

function getColumns(db, tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) return reject(err);
      resolve(new Set((rows || []).map(r => r.name)));
    });
  });
}

function tableExists(db, tableName) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName],
      (err, row) => err ? reject(err) : resolve(!!row)
    );
  });
}

function runDDL(db, sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => err ? reject(err) : resolve());
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Run all pending migrations against a single mind.db.
 *
 * @param {Database} db        Open node-sqlite3 Database handle.
 * @param {string}   alphaName Name of the Alpha (for log clarity), e.g. 'pan'.
 * @returns {Promise<{ added: string[], skipped: string[] }>}
 */
async function migrateMindDb(db, alphaName = 'unknown') {
  const added = [];
  const skipped = [];

  for (const [tableName, columns] of Object.entries(EXPECTED_COLUMNS)) {
    const exists = await tableExists(db, tableName);
    if (!exists) {
      // Server bootstrap's CREATE TABLE IF NOT EXISTS will handle truly fresh installs.
      // If we reached here without the table, that's the right place to fix it — not here.
      skipped.push(`${tableName} (table not present)`);
      continue;
    }

    const existing = await getColumns(db, tableName);

    for (const col of columns) {
      if (existing.has(col.name)) continue;

      try {
        await runDDL(db, col.ddl);
        added.push(`${tableName}.${col.name}`);
        console.log(`[migration:${alphaName}] +${tableName}.${col.name}`);
      } catch (e) {
        console.error(`[migration:${alphaName}] FAILED ${tableName}.${col.name}: ${e.message}`);
        throw e;
      }
    }
  }

  if (added.length === 0) {
    console.log(`[migration:${alphaName}] schema up to date`);
  } else {
    console.log(`[migration:${alphaName}] migrated ${added.length} column(s): ${added.join(', ')}`);
  }

  return { added, skipped };
}

/**
 * Convenience helper: migrate every Alpha in a RESIDENTS-style map.
 *
 * @param {Object} residents Map of name -> { db, ... } objects.
 */
async function migrateAllResidents(residents) {
  for (const [name, resident] of Object.entries(residents)) {
    if (resident && resident.db) {
      await migrateMindDb(resident.db, name);
    }
  }
}

module.exports = {
  migrateMindDb,
  migrateAllResidents,
  EXPECTED_COLUMNS,
};
