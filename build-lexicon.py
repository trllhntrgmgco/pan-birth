#!/usr/bin/env python3
"""Pan-Birth lexicon.db builder — English Wiktionary via Kaikki/wiktextract.
Shared, read-only reference for all eight minds. Source: CC BY-SA (Wiktionary)."""
import gzip, json, sqlite3, os, sys, time

SRC = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else '~/data/raw-wiktextract-data.jsonl.gz')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lexicon.db')
TMP = OUT + '.building'
SKIP_POS = {'name'}                      # proper names excluded (v1)
RELS = ['synonyms','antonyms','hypernyms','hyponyms','meronyms','holonyms',
        'related','coordinate_terms','troponyms']

if os.path.exists(TMP): os.remove(TMP)
db = sqlite3.connect(TMP)
db.executescript('''
PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF;
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE entries (id INTEGER PRIMARY KEY, word TEXT NOT NULL, word_lc TEXT NOT NULL,
  pos TEXT, etymology TEXT);
CREATE TABLE senses (id INTEGER PRIMARY KEY, entry_id INTEGER NOT NULL, sense_idx INTEGER,
  gloss TEXT, tags TEXT, form_of TEXT);
CREATE TABLE sense_links (sense_id INTEGER NOT NULL, target TEXT NOT NULL);
CREATE TABLE relations (entry_id INTEGER NOT NULL, sense_id INTEGER, relation TEXT NOT NULL,
  target TEXT NOT NULL);
''')

def rel_rows(obj, entry_id, sense_id):
    for r in RELS:
        for item in obj.get(r, []) or []:
            w = item.get('word') if isinstance(item, dict) else None
            if w: yield (entry_id, sense_id, r, w)

t0 = time.time(); lines = kept = nsenses = 0
eid = sid = 0
E, S, L, R = [], [], [], []
def flush():
    db.executemany('INSERT INTO entries VALUES (?,?,?,?,?)', E)
    db.executemany('INSERT INTO senses VALUES (?,?,?,?,?,?)', S)
    db.executemany('INSERT INTO sense_links VALUES (?,?)', L)
    db.executemany('INSERT INTO relations VALUES (?,?,?,?)', R)
    db.commit(); E.clear(); S.clear(); L.clear(); R.clear()

with gzip.open(SRC, 'rt', encoding='utf-8') as f:
    for line in f:
        lines += 1
        if '"lang_code": "en"' not in line: continue      # cheap prefilter
        d = json.loads(line)
        if d.get('lang_code') != 'en' or d.get('pos') in SKIP_POS: continue
        word = d.get('word');
        if not word: continue
        eid += 1; kept += 1
        E.append((eid, word, word.lower(), d.get('pos'), (d.get('etymology_text') or '')[:1000]))
        R.extend(rel_rows(d, eid, None))
        for i, s in enumerate(d.get('senses', []) or []):
            g = s.get('glosses') or []
            if not g: continue
            sid += 1; nsenses += 1
            fo = s.get('form_of') or []
            S.append((sid, eid, i, g[-1][:2000], ','.join(s.get('tags', []) or []),
                      fo[0].get('word') if fo and isinstance(fo[0], dict) else None))
            for lk in s.get('links', []) or []:
                if isinstance(lk, list) and len(lk) == 2 and lk[1]:
                    L.append((sid, lk[1].split('#')[0]))
            R.extend(rel_rows(s, eid, sid))
        if kept % 20000 == 0:
            flush()
            print(f'{lines:>10,} lines  {kept:>9,} entries  {nsenses:>9,} senses  {time.time()-t0:6.0f}s', flush=True)
flush()

print('Building indexes...', flush=True)
db.executescript('''
CREATE INDEX idx_entries_word_lc ON entries(word_lc);
CREATE INDEX idx_senses_entry ON senses(entry_id);
CREATE INDEX idx_senses_form_of ON senses(form_of);
CREATE INDEX idx_links_sense ON sense_links(sense_id);
CREATE INDEX idx_rel_entry ON relations(entry_id);
CREATE INDEX idx_rel_sense ON relations(sense_id);
''')
db.executemany('INSERT INTO meta VALUES (?,?)', [
  ('source', 'kaikki.org raw wiktextract (enwiktionary)'), ('license', 'CC BY-SA 4.0 (Wiktionary)'),
  ('built', time.strftime('%Y-%m-%d %H:%M:%S')), ('entries', str(kept)), ('senses', str(nsenses)),
  ('skip_pos', ','.join(sorted(SKIP_POS)))])
db.commit(); db.close()
os.replace(TMP, OUT)
print(f'DONE: {kept:,} entries, {nsenses:,} senses in {time.time()-t0:.0f}s -> {OUT}')
