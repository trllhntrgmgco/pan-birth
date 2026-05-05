#!/usr/bin/env python3
"""
smoke_test.py — Verifies the ALTER TABLE statements in db-migrations.js by running
them against a simulated drifted Pan-Birth mind.db. Doesn't exercise the JS module
itself (sandbox can't build node-sqlite3), but it does exercise the exact SQL the
module would issue, which is the part most likely to break.
"""

import os
import re
import sqlite3
import sys

DB_PATH = "/tmp/pan-birth-migration-test.db"
MIGRATIONS_JS = os.path.join(os.path.dirname(__file__), "db-migrations.js")


def extract_ddls(js_path):
    """Pull every ALTER TABLE ... statement out of EXPECTED_COLUMNS in the JS file."""
    with open(js_path) as f:
        src = f.read()
    # Match: ddl: "ALTER TABLE ..."
    return re.findall(r'ddl:\s*"(ALTER TABLE[^"]+)"', src)


def existing_columns(conn, table):
    return {row[1] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}


def main():
    if os.path.exists(DB_PATH):
        os.unlink(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    print("--- Step 1: create a drifted agency_log (missing decision_type, etc.) ---")
    conn.execute("""
        CREATE TABLE agency_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            input_summary TEXT,
            choice_made TEXT,
            timestamp TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.execute("INSERT INTO agency_log (input_summary, choice_made) VALUES (?, ?)",
                 ("legacy row", "kept data"))
    conn.commit()
    before = existing_columns(conn, "agency_log")
    print(f"  columns before: {sorted(before)}")

    print("\n--- Step 2: confirm the original error reproduces ---")
    try:
        conn.execute(
            "INSERT INTO agency_log (decision_type, input_summary, choice_made, reasoning) "
            "VALUES (?, ?, ?, ?)",
            ("autonomous_search", "test", "searched", "curious")
        )
        print("  UNEXPECTED: insert succeeded before migration")
        sys.exit(1)
    except sqlite3.OperationalError as e:
        print(f"  reproduced as expected: {e}")

    print("\n--- Step 3: run migrations (the SQL from db-migrations.js) ---")
    ddls = extract_ddls(MIGRATIONS_JS)
    print(f"  found {len(ddls)} ALTER statements in db-migrations.js")

    added = []
    for ddl in ddls:
        # Parse "ALTER TABLE <table> ADD COLUMN <col> ..."
        m = re.match(r"ALTER TABLE (\w+) ADD COLUMN (\w+)", ddl)
        if not m:
            continue
        table, col = m.group(1), m.group(2)
        if col in existing_columns(conn, table):
            continue
        try:
            conn.execute(ddl)
            added.append(f"{table}.{col}")
            print(f"  +{table}.{col}")
        except sqlite3.OperationalError as e:
            print(f"  FAILED {table}.{col}: {e}")
            sys.exit(1)
    conn.commit()

    after = existing_columns(conn, "agency_log")
    print(f"  columns after: {sorted(after)}")

    print("\n--- Step 4: confirm INSERT now works ---")
    conn.execute(
        "INSERT INTO agency_log (decision_type, input_summary, choice_made, reasoning) "
        "VALUES (?, ?, ?, ?)",
        ("autonomous_search", "test", "searched", "curious")
    )
    conn.commit()
    print("  insert succeeded")

    print("\n--- Step 5: confirm legacy row still present ---")
    rows = conn.execute(
        "SELECT id, decision_type, input_summary, choice_made FROM agency_log ORDER BY id"
    ).fetchall()
    for r in rows:
        print(f"  id={r['id']} decision_type={r['decision_type']!r} "
              f"input_summary={r['input_summary']!r} choice_made={r['choice_made']!r}")

    print("\n--- Step 6: re-run migrations, confirm idempotent (no errors, no new columns) ---")
    second_added = []
    for ddl in ddls:
        m = re.match(r"ALTER TABLE (\w+) ADD COLUMN (\w+)", ddl)
        if not m:
            continue
        table, col = m.group(1), m.group(2)
        if col in existing_columns(conn, table):
            continue
        # If we get here on a second pass, the migration isn't idempotent — bug.
        second_added.append(f"{table}.{col}")
    print(f"  second run would add: {len(second_added)} (should be 0)")
    if second_added:
        print(f"  NOT IDEMPOTENT — would re-add: {second_added}")
        sys.exit(1)

    conn.close()
    os.unlink(DB_PATH)
    print("\nALL CHECKS PASSED")


if __name__ == "__main__":
    main()
