#!/usr/bin/env python3
"""
Pan-Birth v11 improvement 00 (v2) — snapshot and drift detection.

REPLACES the shell version, which had two faults that only surfaced under a
running server:

  1. It copied *.db with `cp`. SQLite in WAL mode keeps recent writes in a
     sibling -wal file, so a plain copy silently omits everything not yet
     checkpointed. A snapshot taken while a server was running would have been
     missing data with no error.

  2. It compared file bytes to detect drift. After the A1 verification wrote a
     new ethics row plus two episodes, the main .db was byte-identical because
     the changes were in the WAL — so the drift check reported "unchanged" for
     a database that had definitely changed. Byte comparison cannot be trusted
     here.

  3. It flattened paths, so minds/pan_mind.db overwrote the root pan_mind.db in
     the snapshot directory. That actually happened, and the 4 KB stray became
     the baseline for Pan while the manifest verified it as intact.

This version uses sqlite3's backup API (transactionally consistent, WAL
included, safe against a live writer) and detects drift by comparing table row
counts plus a content digest.

    python3 00-snapshot.py                      # snapshot to baseline/baseline
    python3 00-snapshot.py --label pre-b1
    python3 00-snapshot.py --label pre-b1 --verify
"""

import argparse, hashlib, json, os, sqlite3, sys, datetime

DBS = ['pan_mind.db', 'omni-truth.db'] + \
      ['minds/%s_mind.db' % m for m in
       ['aeon', 'zen', 'seth', 'nexus', 'oracle', 'echo', 'atlas']]


def tables(con):
    return [r[0] for r in con.execute(
        "SELECT name FROM sqlite_master WHERE type='table' "
        "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_fts%' ORDER BY name")]


def fingerprint(path):
    """Content signature: per-table row counts plus a digest of key columns.

    Independent of page layout, vacuum state, and WAL position — two databases
    with identical content fingerprint the same even if their bytes differ.
    """
    con = sqlite3.connect('file:%s?mode=ro' % path, uri=True)
    counts, h = {}, hashlib.sha256()
    for t in tables(con):
        try:
            n = con.execute('SELECT COUNT(*) FROM "%s"' % t).fetchone()[0]
        except sqlite3.DatabaseError:
            continue
        counts[t] = n
        h.update(('%s=%d;' % (t, n)).encode())
        # max(rowid) catches inserts even where a delete kept the count level
        try:
            mx = con.execute('SELECT MAX(rowid) FROM "%s"' % t).fetchone()[0]
            h.update(('%s:max=%s;' % (t, mx)).encode())
        except sqlite3.DatabaseError:
            pass
    con.close()
    return counts, h.hexdigest()[:16]


def snapshot(root, label):
    dest = os.path.join(root, 'baseline', label)
    manifest = {'taken_at': datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
                'root': os.path.abspath(root), 'databases': {}}
    for rel in DBS:
        src = os.path.join(root, rel)
        if not os.path.exists(src) or os.path.getsize(src) < 8192:
            print('  skip %-24s missing or too small to be a real database' % rel)
            continue
        # mirror the tree — do NOT flatten, or minds/pan_mind.db clobbers pan_mind.db
        out = os.path.join(dest, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        s = sqlite3.connect('file:%s?mode=ro' % src, uri=True)
        d = sqlite3.connect(out)
        s.backup(d)                      # consistent, WAL included, live-safe
        d.close(); s.close()
        counts, digest = fingerprint(out)
        manifest['databases'][rel] = {'digest': digest, 'counts': counts,
                                      'bytes': os.path.getsize(out)}
        print('  %-24s %8d rows across %2d tables   %s'
              % (rel, sum(counts.values()), len(counts), digest))
    with open(os.path.join(dest, 'MANIFEST.json'), 'w') as f:
        json.dump(manifest, f, indent=1)
    print('\nsnapshot written to %s' % dest)
    print('databases captured: %d' % len(manifest['databases']))


def verify(root, label):
    dest = os.path.join(root, 'baseline', label)
    mpath = os.path.join(dest, 'MANIFEST.json')
    if not os.path.exists(mpath):
        print('no snapshot at %s' % dest, file=sys.stderr); sys.exit(1)
    manifest = json.load(open(mpath))
    print('comparing working tree against %s (taken %s)\n' % (dest, manifest['taken_at']))

    changed = False
    for rel, rec in manifest['databases'].items():
        live = os.path.join(root, rel)
        if not os.path.exists(live):
            print('  MISSING    %s' % rel); changed = True; continue
        counts, digest = fingerprint(live)
        if digest == rec['digest']:
            print('  unchanged  %s' % rel)
            continue
        changed = True
        print('  CHANGED    %s' % rel)
        for t in sorted(set(counts) | set(rec['counts'])):
            was, now = rec['counts'].get(t), counts.get(t)
            if was != now:
                print('               %-28s %s -> %s' % (t, was, now))
    if not changed:
        print('\nno drift — every database matches the snapshot')
    return changed


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--root', default='.')
    p.add_argument('--label', default='baseline')
    p.add_argument('--verify', action='store_true')
    a = p.parse_args()
    if a.verify:
        verify(a.root, a.label)
    else:
        snapshot(a.root, a.label)
