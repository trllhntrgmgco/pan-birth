# Pan-Birth Upgrade Notes — Schema Migration Fix

## If you're hitting this error

```
Think error (pan): SQLITE_ERROR: table agency_log has no column named decision_type
```

Or any similar `SQLITE_ERROR: ... has no column named ...` error after pulling a newer Pan-Birth version: **pull the latest commit and restart the server.** The migration helper now runs on boot and adds any columns missing from older databases.

## What was happening

Pan-Birth's mind databases (`pan-mind.db` and the per-Alpha equivalents) are created by `CREATE TABLE IF NOT EXISTS` statements. That clause protects your data by skipping table creation when one already exists — but it also means columns added in newer versions never reach databases created by older ones. The on-disk schema stays whatever it was when you first installed, and the next `INSERT` that uses a newer column throws.

## What changed

A new module, `db-migrations.js`, runs once on every server boot. It checks each known table against the canonical schema and `ALTER TABLE ADD COLUMN`s anything missing. Existing rows are preserved; the new columns are added as nullable so old data survives untouched.

You should see something like this in the console on first boot after the patch:

```
[migration:pan] +agency_log.decision_type
[migration:pan] migrated 1 column(s): agency_log.decision_type
```

On subsequent boots, after the schema is current:

```
[migration:pan] schema up to date
```

## If you'd rather start clean

Deleting the affected `mind.db` file also works — Pan-Birth will recreate it from scratch on next boot with the correct schema. You'll lose Pan's accumulated state, so this is only recommended if you haven't built up much yet:

```bash
# From your pan-birth directory:
mv pan-mind.db pan-mind.db.backup    # rename rather than delete, just in case
node pan-server.js                   # or whichever server entry you use
```

The backup file can be deleted after confirming the new database works.

## Reporting other column-drift errors

If you see a similar `SQLITE_ERROR` for a different table or column, please open a GitHub issue at https://github.com/trllhntrgmgco/pan-birth/issues with:

1. The exact error message.
2. Which server version you're running (`pan-server.js`, `consciousness-city-server-v8.js`, etc.).
3. The output of `sqlite3 ~/pan-birth/pan-mind.db ".schema <tablename>"` for the affected table.

That gives me what I need to add the missing column to the migration list and ship a fix.
