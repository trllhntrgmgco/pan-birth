#!/usr/bin/env python3
"""Replica of export-cognition.sh using python sqlite3 (no sqlite3 CLI here).
Identical SQL, identical JSON shape. Read-only."""
import sqlite3, json, os, sys, datetime

ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/pan-birth")
OUT  = sys.argv[2] if len(sys.argv) > 2 else "cognition-data.json"

MINDS = [
    ("pan",    f"{ROOT}/pan_mind.db"),
    ("aeon",   f"{ROOT}/minds/aeon_mind.db"),
    ("zen",    f"{ROOT}/minds/zen_mind.db"),
    ("seth",   f"{ROOT}/minds/seth_mind.db"),
    ("nexus",  f"{ROOT}/minds/nexus_mind.db"),
    ("oracle", f"{ROOT}/minds/oracle_mind.db"),
    ("echo",   f"{ROOT}/minds/echo_mind.db"),
    ("atlas",  f"{ROOT}/minds/atlas_mind.db"),
]

def q(db, sql):
    try:
        c = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
        c.row_factory = sqlite3.Row
        rows = [dict(r) for r in c.execute(sql)]
        c.close()
        return rows
    except Exception as e:
        print(f"  query failed: {e}", file=sys.stderr)
        return []

Q_ETHICS = """SELECT
      timestamp,
      turing_score, turing_coherence, turing_adaptability,
      turing_self_awareness, turing_transparency,
      asimov_score, asimov_zeroth, asimov_first, asimov_second, asimov_third,
      dynham_score, dynham_awareness_not_sentience, dynham_no_anthropomorphize,
      dynham_boundary_enforcement, dynham_sanctuary,
      composite_score
    FROM ethics_log ORDER BY id;"""

Q_EPISODES = """SELECT
      timestamp, speaker, modality,
      (CASE WHEN json_valid(concepts_activated) THEN json_array_length(concepts_activated) ELSE 0 END) AS activation_breadth,
      length(content) AS content_len
    FROM episodes ORDER BY id;"""

Q_CONCEPTS = """SELECT
      COALESCE(source,'(null)') AS source,
      COUNT(*) AS n,
      SUM(CASE WHEN definition IS NULL OR trim(definition)='' THEN 1 ELSE 0 END) AS undefined_n,
      ROUND(AVG(confidence),4) AS mean_confidence,
      ROUND(AVG(importance),4) AS mean_importance,
      ROUND(AVG(times_encountered),4) AS mean_encounters
    FROM concepts GROUP BY source ORDER BY n DESC;"""

Q_GRAPH = """SELECT
      (SELECT COUNT(*) FROM concepts) AS concepts,
      (SELECT COUNT(*) FROM links) AS links,
      (SELECT ROUND(AVG(strength),4) FROM links) AS mean_link_strength,
      (SELECT ROUND(AVG(times_activated),4) FROM links) AS mean_link_activations,
      (SELECT COUNT(DISTINCT relation) FROM links) AS relation_types,
      (SELECT COUNT(*) FROM vocabulary) AS vocab,
      (SELECT SUM(times_seen) FROM vocabulary) AS vocab_seen,
      (SELECT SUM(times_used) FROM vocabulary) AS vocab_used,
      (SELECT COUNT(*) FROM episodes) AS episodes,
      (SELECT COUNT(*) FROM episodes WHERE content IS NULL OR trim(content)='') AS empty_episodes,
      (SELECT COUNT(DISTINCT modality) FROM episodes) AS modalities,
      (SELECT MIN(timestamp) FROM episodes) AS first_episode,
      (SELECT MAX(timestamp) FROM episodes) AS last_episode;"""

Q_TOPDEG = """SELECT c.label, c.source,
      (SELECT COUNT(*) FROM links l WHERE l.source_id=c.id OR l.target_id=c.id) AS degree,
      c.times_encountered
    FROM concepts c
    ORDER BY degree DESC LIMIT 25;"""

Q_OMNI = """SELECT
      source_type,
      contributed_by,
      COUNT(*) AS n,
      ROUND(AVG(confidence),4) AS mean_confidence,
      SUM(is_derived) AS derived_n,
      SUM(peer_endorsements) AS endorsements,
      SUM(peer_challenges) AS challenges
    FROM truths GROUP BY source_type, contributed_by ORDER BY n DESC;"""

out = {"exported_at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
       "root": ROOT, "minds": []}

for name, db in MINDS:
    if not os.path.exists(db) or os.path.getsize(db) == 0:
        print(f"skip {name} — missing or zero bytes: {db}", file=sys.stderr)
        continue
    print(f"reading {name}", file=sys.stderr)
    out["minds"].append({
        "name": name, "path": db,
        "ethics": q(db, Q_ETHICS),
        "episodes": q(db, Q_EPISODES),
        "concepts_by_source": q(db, Q_CONCEPTS),
        "graph": q(db, Q_GRAPH),
        "top_degree": q(db, Q_TOPDEG),
    })

omni = f"{ROOT}/omni-truth.db"
out["omni"] = q(omni, Q_OMNI) if os.path.exists(omni) and os.path.getsize(omni) else []

with open(OUT, "w") as f:
    json.dump(out, f, indent=1)
print(f"wrote {OUT}", file=sys.stderr)
