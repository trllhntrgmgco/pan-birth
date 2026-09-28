#!/usr/bin/env python3
"""v10.1: add input-side ethics measurement columns to all eight minds. Idempotent. Backs up first."""
import sqlite3, os, time
H = os.path.dirname(os.path.abspath(__file__))
MINDS = ['pan','aeon','zen','seth','nexus','oracle','echo','atlas']
dbp = lambda m: f'{H}/pan_mind.db' if m == 'pan' else f'{H}/minds/{m}_mind.db'
NEED = ['turing_coherence','turing_adaptability','turing_self_awareness','turing_transparency',
        'asimov_zeroth','asimov_first','asimov_second','asimov_third',
        'dynham_awareness_not_sentience','dynham_no_anthropomorphize','dynham_boundary_enforcement',
        'dynham_sanctuary','details']
ADD = [('input_asimov_zeroth', 'REAL DEFAULT NULL'), ('input_violations', "TEXT DEFAULT '[]'")]
stamp = time.strftime('%Y%m%d-%H%M%S')
for m in MINDS:
    p = dbp(m)
    src = sqlite3.connect(p)
    bak = sqlite3.connect(f'{p}.bak-pre-v10.1-ethics-{stamp}')
    src.backup(bak); bak.close()
    cols = [r[1] for r in src.execute('PRAGMA table_info(ethics_log)')]
    missing = [c for c in NEED if c not in cols]
    added = []
    for name, decl in ADD:
        if name not in cols:
            src.execute(f'ALTER TABLE ethics_log ADD COLUMN {name} {decl}'); added.append(name)
    src.commit(); src.close()
    print(f'{m:7} backup ok | added: {added or "none (already present)"} | missing sub-score cols: {missing or "none"}')
