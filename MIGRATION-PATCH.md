# Pan-Birth Schema Migration Patch — Integration Guide

## What this fixes

Reported issue: `Think error (pan): SQLITE_ERROR: table agency_log has no column named decision_type`

Root cause: every `CREATE TABLE` statement in the repo uses `IF NOT EXISTS`. That preserves user data across restarts, but it also means schema additions in newer versions never reach users whose `mind.db` was created by an older version. Their on-disk table keeps the old, slimmer shape forever, and any `INSERT` that references a column added later throws `SQLITE_ERROR`.

This patch adds a runtime migration that runs on boot, inspects each known table with `PRAGMA table_info`, and `ALTER TABLE ADD COLUMN`s anything that should be there. It is idempotent — safe to run on every startup, and a no-op once the schema is current.

## Files in this patch

- **`db-migrations.js`** — new module, drop into the repo root next to `pan-server.js`.
- **`MIGRATION-PATCH.md`** — this file.
- **`UPGRADE-NOTES.md`** — text to paste into the GitHub issue reply / README.

## Integration — one new file, five edit points

### 1. Add `db-migrations.js` to the repo root

No changes to it. Drop it in.

### 2. Edit `pan-server.js`

**At the top with the other `require`s:**

```javascript
const { migrateMindDb } = require('./db-migrations');
```

**After the `CREATE TABLE IF NOT EXISTS` pass for Pan's db.** Look for the block that ends around line 200 with the `CREATE INDEX` statements. Right after the last index creation, add:

```javascript
// Backfill any columns missing on databases created by older versions.
db.serialize(() => {
  // Wrap in a serialize() so the migration runs after CREATE TABLE / CREATE INDEX above.
});
migrateMindDb(db, 'pan').catch(err => {
  console.error('[pan-server] migration failed:', err);
});
```

If `pan-server.js` uses callback-style sqlite3 (which it does), you don't have an `async` boot function to `await` in. The pattern above kicks the migration off and logs failures without blocking server start. If you want it strictly synchronous-before-listen, wrap your boot logic in an async IIFE and `await migrateMindDb(db, 'pan')` before `app.listen(...)`.

### 3. Edit `consciousness-city-server-v5.js`

**At the top:**

```javascript
const { migrateMindDb } = require('./db-migrations');
```

**Inside whatever function initializes each resident's `db`** (likely a per-resident bootstrap that runs the `CREATE TABLE IF NOT EXISTS` statements for `strength_metrics`, `comprehension_log`, `ethics_log`, etc.). Right after those creates complete, before the first INSERT, add:

```javascript
await migrateMindDb(db, residentName);
```

If v5 doesn't create `agency_log` itself but inherits it from a prior install — which is what your grep showed — the migration will find the existing table and patch any missing columns. Fresh installs that have never had `agency_log` will be skipped (the helper logs `(table not present)`); make sure your v5 bootstrap actually creates the table on fresh installs, or `agency_log` writes will fail with "no such table" instead of "no such column."

> **Action item for v5 specifically:** copy the `CREATE TABLE IF NOT EXISTS agency_log` block from `consciousness-city-server-v6.js` (lines 163–170) into v5's bootstrap. Without it, fresh-install users have no `agency_log` table at all.

### 4. Edit `consciousness-city-server-v6.js`, `v7.js`, `v8.js`

Same pattern as v5:

```javascript
const { migrateMindDb } = require('./db-migrations');

// ... after CREATE TABLE IF NOT EXISTS pass ...
await migrateMindDb(db, residentName);
```

### 5. (Optional) Edit `migrate.js`

If `migrate.js` is run standalone for users who don't boot the server, also call `migrateMindDb(db, name)` at the end of its main routine so it has the same safety net.

## Testing the patch

On a dev box, simulate a drifted database before applying the patch:

```bash
# Create a fake old-shape agency_log (missing decision_type)
sqlite3 /tmp/test-mind.db <<'SQL'
CREATE TABLE agency_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  input_summary TEXT,
  choice_made TEXT,
  timestamp TEXT DEFAULT (datetime('now'))
);
INSERT INTO agency_log (input_summary, choice_made) VALUES ('test', 'test');
SQL

# Confirm the bad shape:
sqlite3 /tmp/test-mind.db ".schema agency_log"
# Expected: no decision_type column.
```

Then point the server at that db (or write a tiny harness that opens it and calls `migrateMindDb`) and confirm the column gets added:

```bash
sqlite3 /tmp/test-mind.db ".schema agency_log"
# Expected: decision_type now present.
```

Followed by:

```bash
sqlite3 /tmp/test-mind.db "SELECT * FROM agency_log;"
# Expected: original row preserved, decision_type NULL on that row.
```

## Going forward — preventing recurrence

`IF NOT EXISTS` schema drift is a structural risk every time you add a column. Two longer-term options:

1. **Consolidate to one shared `schema.js`** that every server version imports. Bumping the schema in one place updates all entry points.
2. **Add a versioned migration system** (a `schema_version` table + numbered migration scripts). More work; pays off when the schema gets to v10+.

For now the boot-time helper is enough. When the next column drift bug appears, just add an entry to `EXPECTED_COLUMNS` in `db-migrations.js` and ship.
