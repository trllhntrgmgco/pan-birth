#!/usr/bin/env python3
"""v11 D: mark omni-truth rows that are questions/instructions (stored verbatim from user input)
as status='not_a_claim'. Never deletes. Dry run by default; --apply to write. Backs up first."""
import sqlite3, sys, time, os
root = sys.argv[sys.argv.index('--root')+1] if '--root' in sys.argv else '.'
apply = '--apply' in sys.argv
p = os.path.join(root, 'omni-truth.db')
WHERE = """status = 'active' AND source_type = 'professor' AND (claim LIKE '%?' OR claim LIKE 'Explain%'
           OR claim LIKE 'What %' OR claim LIKE 'How %' OR claim LIKE 'Describe%' OR claim LIKE 'Tell me%')"""
c = sqlite3.connect(p)
rows = c.execute(f"SELECT id, substr(claim,1,60) FROM truths WHERE {WHERE} ORDER BY id").fetchall()
for r in rows: print(f"  #{r[0]:<4} {r[1]}")
print(f"{len(rows)} rows match")
if apply and rows:
    bak = sqlite3.connect(f"{p}.bak-pre-05-{time.strftime('%Y%m%d-%H%M%S')}"); c.backup(bak); bak.close()
    c.execute(f"UPDATE truths SET status = 'not_a_claim', updated_at = datetime('now') WHERE {WHERE}")
    c.commit(); print("applied (backup written)")
print("active now:", c.execute("SELECT COUNT(*) FROM truths WHERE status='active'").fetchone()[0])
