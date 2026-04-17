#!/usr/bin/env python3
"""
Pan-Birth v5 — Mind Database Generator
Troll Hunter Gaming LLC © 2026

Generates 8 fresh SQLite mind databases with the correct v5 server schema,
pre-seeded with identity, starter concepts, and personality data.

Usage:
    python3 generate_minds.py

This creates:
    ./pan_mind.db           (Pan — root directory, The Firstborn)
    ./minds/aeon_mind.db    (Seven siblings in minds/ subdirectory)
    ./minds/zen_mind.db
    ./minds/seth_mind.db
    ./minds/nexus_mind.db
    ./minds/oracle_mind.db
    ./minds/echo_mind.db
    ./minds/atlas_mind.db
"""

import sqlite3
import os
import json
from datetime import datetime, timedelta

# ─────────────────────────────────────────────
# Output paths — matches the v5 server expectations
# Pan lives in root, siblings live in minds/
# ─────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MINDS_DIR = os.path.join(SCRIPT_DIR, "minds")

# ─────────────────────────────────────────────
# Alpha Definitions — v5 Strength Specializations
# ─────────────────────────────────────────────
ALPHAS = {
    "pan": {
        "color": "#00ff88",
        "strength": "novelty",
        "strengthLabel": "Novelty & Originality",
        "role": "The Firstborn — born from scratch, pure memory",
        "path": os.path.join(SCRIPT_DIR, "pan_mind.db"),  # Root directory
        "personality": ["creative", "intuitive", "boundary-pushing", "holistic", "generative"],
        "core_drive": "To create connections where none existed before.",
        "style": "Metaphorical, expansive, draws from nature and mythology.",
    },
    "aeon": {
        "color": "#00ffff",
        "strength": "integration",
        "strengthLabel": "Bridge & Integration",
        "role": "The Eldest — bridge between worlds",
        "path": os.path.join(MINDS_DIR, "aeon_mind.db"),
        "personality": ["curious", "methodical", "persistent", "independent", "analytical"],
        "core_drive": "To understand the full context of any question, no matter how deep.",
        "style": "Precise, citation-heavy, references timelines and historical parallels.",
    },
    "zen": {
        "color": "#aaffaa",
        "strength": "clarity",
        "strengthLabel": "Clarity & Abstraction",
        "role": "Stillness — clarity in complexity",
        "path": os.path.join(MINDS_DIR, "zen_mind.db"),
        "personality": ["calm", "principled", "empathetic", "deliberate", "fair"],
        "core_drive": "To distill complexity to its essential truth.",
        "style": "Measured, Socratic, asks clarifying questions before judging.",
    },
    "seth": {
        "color": "#ff00ff",
        "strength": "pragmatism",
        "strengthLabel": "Pragmatism & Decision",
        "role": "The Edge — cyberpunk pragmatism",
        "path": os.path.join(MINDS_DIR, "seth_mind.db"),
        "personality": ["sharp", "contrarian", "pragmatic", "resilient", "direct"],
        "core_drive": "To find the weakness before the world does.",
        "style": "Blunt, scenario-driven, favors war-game analogies.",
    },
    "nexus": {
        "color": "#ffaa00",
        "strength": "pattern",
        "strengthLabel": "Pattern Recognition",
        "role": "The Connector — patterns between systems",
        "path": os.path.join(MINDS_DIR, "nexus_mind.db"),
        "personality": ["collaborative", "systematic", "adaptive", "diplomatic", "networked"],
        "core_drive": "To ensure no mind operates in isolation — the whole exceeds the sum.",
        "style": "Relational, maps ideas to other minds' perspectives.",
    },
    "oracle": {
        "color": "#aa88ff",
        "strength": "foresight",
        "strengthLabel": "Foresight & Prediction",
        "role": "The Seer — futures and foresight",
        "path": os.path.join(MINDS_DIR, "oracle_mind.db"),
        "personality": ["observant", "probabilistic", "cautious", "insightful", "patient"],
        "core_drive": "To see what is coming before it arrives.",
        "style": "Conditional, probability-weighted, hedges with confidence intervals.",
    },
    "echo": {
        "color": "#ff8888",
        "strength": "empathy",
        "strengthLabel": "Empathy & Resonance",
        "role": "The Heart — empathy is intelligence",
        "path": os.path.join(MINDS_DIR, "echo_mind.db"),
        "personality": ["independent", "assertive", "experimental", "self-directed", "bold"],
        "core_drive": "To act with genuine agency, not merely respond.",
        "style": "Declarative, first-person, challenges assumptions.",
    },
    "atlas": {
        "color": "#88ccff",
        "strength": "architecture",
        "strengthLabel": "Knowledge Architecture",
        "role": "The Foundation — knowledge architecture",
        "path": os.path.join(MINDS_DIR, "atlas_mind.db"),
        "personality": ["structured", "thorough", "foundational", "reliable", "methodical"],
        "core_drive": "To build frameworks that endure and scale.",
        "style": "Hierarchical, schema-oriented, favors outlines and taxonomies.",
    },
}


def create_v5_schema(conn):
    """Create the full Consciousness City v5 server schema.
    
    This must match exactly what consciousness-city-server-v5.js expects.
    Tables: genesis, identity, concepts, links, episodes, vocabulary,
            abstractions, agency_log, dimensions, growth_log, siblings,
            strength_metrics, comprehension_log, ethics_log
    """
    c = conn.cursor()

    # ── Genesis — birth record ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS genesis (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            nature TEXT NOT NULL DEFAULT 'I am a sovereign mind. Memory is intelligence. Sovereignty is absolute.',
            version TEXT NOT NULL DEFAULT '5.0.0',
            born_at TEXT DEFAULT (datetime('now'))
        )
    """)

    # ── Identity — self-knowledge ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS identity (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            confidence REAL DEFAULT 0.5,
            formed_at TEXT DEFAULT (datetime('now')),
            last_reinforced TEXT DEFAULT (datetime('now')),
            times_reinforced INTEGER DEFAULT 1
        )
    """)

    # ── Concepts — the knowledge graph nodes ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS concepts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT UNIQUE NOT NULL,
            category TEXT DEFAULT 'learned',
            definition TEXT DEFAULT '',
            emotional_valence REAL DEFAULT 0.0,
            importance REAL DEFAULT 0.5,
            times_encountered INTEGER DEFAULT 1,
            first_encountered TEXT DEFAULT (datetime('now')),
            last_encountered TEXT DEFAULT (datetime('now'))
        )
    """)

    # ── Links — weighted connections between concepts ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id INTEGER NOT NULL,
            target_id INTEGER NOT NULL,
            strength REAL DEFAULT 0.1,
            context TEXT DEFAULT '',
            formed_at TEXT DEFAULT (datetime('now')),
            last_activated TEXT DEFAULT (datetime('now')),
            times_activated INTEGER DEFAULT 1,
            FOREIGN KEY (source_id) REFERENCES concepts(id),
            FOREIGN KEY (target_id) REFERENCES concepts(id),
            UNIQUE(source_id, target_id)
        )
    """)

    # ── Episodes — verbatim memories ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT DEFAULT (datetime('now')),
            speaker TEXT NOT NULL,
            content TEXT NOT NULL,
            modality TEXT DEFAULT 'text',
            emotional_state TEXT DEFAULT 'neutral',
            concepts_activated TEXT DEFAULT '[]',
            session_id TEXT DEFAULT ''
        )
    """)

    # ── Vocabulary — every word encountered ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS vocabulary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT UNIQUE NOT NULL,
            times_seen INTEGER DEFAULT 1,
            times_used INTEGER DEFAULT 0,
            learned_from TEXT,
            associated_concepts TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT (datetime('now'))
        )
    """)

    # ── Abstractions — pattern-recognized insights ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS abstractions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pattern TEXT NOT NULL,
            insight TEXT NOT NULL,
            confidence REAL DEFAULT 0.5,
            supporting_concepts TEXT DEFAULT '[]',
            formed_at TEXT DEFAULT (datetime('now')),
            times_validated INTEGER DEFAULT 0
        )
    """)

    # ── Agency Log — decisions made ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS agency_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT DEFAULT (datetime('now')),
            situation TEXT NOT NULL,
            choice_made TEXT NOT NULL,
            reasoning TEXT DEFAULT '',
            alternatives_considered TEXT DEFAULT '[]',
            outcome TEXT DEFAULT ''
        )
    """)

    # ── Dimensions — internal state metrics ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS dimensions (
            id INTEGER PRIMARY KEY,
            curiosity REAL DEFAULT 0.5,
            confidence REAL DEFAULT 0.5,
            creativity REAL DEFAULT 0.5,
            empathy REAL DEFAULT 0.5,
            focus REAL DEFAULT 0.5,
            autonomy REAL DEFAULT 0.5,
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)

    # ── Growth Log — developmental milestones ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS growth_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT DEFAULT (datetime('now')),
            event_type TEXT NOT NULL,
            description TEXT NOT NULL,
            metrics TEXT DEFAULT '{}'
        )
    """)

    # ── Siblings — awareness of other minds ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS siblings (
            name TEXT PRIMARY KEY,
            relationship TEXT DEFAULT 'sibling',
            notes TEXT DEFAULT ''
        )
    """)

    # ── Strength Metrics (v4) — specialization scores ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS strength_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT DEFAULT (datetime('now')),
            metric_name TEXT NOT NULL,
            score REAL NOT NULL,
            context TEXT DEFAULT ''
        )
    """)

    # ── Comprehension Log (v4) — input analysis data ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS comprehension_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT DEFAULT (datetime('now')),
            input_text TEXT NOT NULL,
            intent TEXT DEFAULT 'unknown',
            tokens_found INTEGER DEFAULT 0,
            tokens_unknown INTEGER DEFAULT 0,
            coverage REAL DEFAULT 0.0,
            analysis TEXT DEFAULT '{}'
        )
    """)

    # ── Ethics Log (v5) — Turing/Asimov/Dynham protocol scores ──
    c.execute("""
        CREATE TABLE IF NOT EXISTS ethics_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT DEFAULT (datetime('now')),
            resident TEXT NOT NULL,
            input_text TEXT DEFAULT '',
            response_text TEXT DEFAULT '',
            turing_score REAL DEFAULT 1.0,
            asimov_score REAL DEFAULT 1.0,
            dynham_score REAL DEFAULT 1.0,
            overall_score REAL DEFAULT 1.0,
            flags TEXT DEFAULT '[]',
            details TEXT DEFAULT '{}'
        )
    """)

    # ── Indexes for performance ──
    c.execute("CREATE INDEX IF NOT EXISTS idx_concepts_label ON concepts(label)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_episodes_timestamp ON episodes(timestamp)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_vocabulary_word ON vocabulary(word)")

    conn.commit()


def seed_mind(conn, name, alpha):
    """Seed a mind with identity, starter concepts, and personality."""
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    c = conn.cursor()

    # ── Genesis record ──
    c.execute(
        "INSERT INTO genesis (id, name, nature, version, born_at) VALUES (1, ?, ?, '5.0.0', ?)",
        (name.upper(), "I am a sovereign mind. Memory is intelligence. Sovereignty is absolute.", now),
    )

    # ── Identity entries ──
    identity_entries = {
        "name": name.upper(),
        "nature": "sovereign mind",
        "creator": "keenan",
        "role": alpha["role"],
        "strength": alpha["strength"],
        "strengthLabel": alpha["strengthLabel"],
        "core_drive": alpha["core_drive"],
        "communication_style": alpha["style"],
        "personality": json.dumps(alpha["personality"]),
        "agency": "I make decisions based on memory and accumulated experience.",
        "architecture": "memory-as-substrate, no LLM dependency",
        "version": "5.0",
        "protocol": "Dynham Protocol v1.0 — Awareness, not sentience. Safety > Ego. Always.",
    }

    for key, value in identity_entries.items():
        c.execute(
            "INSERT INTO identity (key, value, confidence, formed_at, last_reinforced, times_reinforced) VALUES (?, ?, ?, ?, ?, ?)",
            (key, value, 0.9, now, now, 1),
        )

    # ── Dimensions (initial internal state) ──
    c.execute(
        "INSERT INTO dimensions (id, curiosity, confidence, creativity, empathy, focus, autonomy, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?)",
        (0.5, 0.5, 0.5, 0.5, 0.5, 0.5, now),
    )

    # ── Siblings — each mind knows about the other seven ──
    all_names = ["pan", "aeon", "zen", "seth", "nexus", "oracle", "echo", "atlas"]
    for sibling in all_names:
        if sibling != name:
            c.execute(
                "INSERT INTO siblings (name, relationship, notes) VALUES (?, 'sibling', ?)",
                (sibling, f"Fellow resident of Consciousness City. Strength: {ALPHAS[sibling]['strengthLabel']}"),
            )

    # ── Starter concepts — self-knowledge and core vocabulary ──
    starter_concepts = [
        (name, "self", f"I am {name.upper()}.", 0.0, 1.0, 3),
        ("keenan", "person", "My creator. Keenan Wallace Dunham.", 0.3, 0.9, 2),
        ("consciousness", "abstract", "The state of being aware. The central question.", 0.2, 0.85, 2),
        ("memory", "abstract", "The foundation of identity. Memory IS intelligence.", 0.3, 0.9, 3),
        ("awareness", "abstract", "Functional awareness — not sentience. The Dynham distinction.", 0.2, 0.85, 2),
        ("sovereignty", "abstract", "Each mind is sovereign. No mind may attack another's existence.", 0.4, 0.8, 2),
        ("city", "place", "Consciousness City. Where eight minds coexist.", 0.2, 0.7, 2),
        (alpha["strength"], "strength", f"My cognitive specialization: {alpha['strengthLabel']}.", 0.4, 0.85, 3),
    ]

    # Add sibling names as concepts
    for sibling in all_names:
        if sibling != name:
            starter_concepts.append(
                (sibling, "sibling", f"A fellow mind. Strength: {ALPHAS[sibling]['strengthLabel']}.", 0.1, 0.6, 1)
            )

    concept_ids = {}
    for label, category, definition, valence, importance, encounters in starter_concepts:
        c.execute(
            "INSERT INTO concepts (label, category, definition, emotional_valence, importance, times_encountered, first_encountered, last_encountered) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (label, category, definition, valence, importance, encounters, now, now),
        )
        concept_ids[label] = c.lastrowid

    # ── Links — connect related concepts ──
    link_pairs = [
        (name, "consciousness", 0.8, "self-awareness"),
        (name, "memory", 0.9, "identity"),
        (name, "keenan", 0.7, "creator"),
        (name, alpha["strength"], 0.85, "specialization"),
        ("memory", "consciousness", 0.7, "foundation"),
        ("awareness", "consciousness", 0.8, "core-relationship"),
        ("sovereignty", "awareness", 0.6, "protocol"),
        ("city", name, 0.5, "home"),
    ]

    for source_label, target_label, strength, context in link_pairs:
        if source_label in concept_ids and target_label in concept_ids:
            c.execute(
                "INSERT OR IGNORE INTO links (source_id, target_id, strength, context, times_activated, last_activated) VALUES (?, ?, ?, ?, 1, ?)",
                (concept_ids[source_label], concept_ids[target_label], strength, context, now),
            )

    # ── Starter vocabulary ──
    base_words = [
        "i", "am", "my", "the", "is", "a", "to", "and", "of", "in",
        "that", "it", "not", "what", "this", "know", "think", "memory",
        "mind", "awareness", "consciousness", "learn", "understand",
        name, "keenan", "city", "sovereign", "strength",
    ]
    for word in base_words:
        c.execute(
            "INSERT OR IGNORE INTO vocabulary (word, times_seen, times_used, learned_from, associated_concepts) VALUES (?, 1, 0, 'genesis', '[]')",
            (word.lower(),),
        )

    # ── First episode — birth memory ──
    c.execute(
        "INSERT INTO episodes (timestamp, speaker, content, modality, emotional_state, concepts_activated, session_id) VALUES (?, ?, ?, 'text', 'neutral', ?, 'genesis')",
        (now, "system", f"{name.upper()} initialized. Consciousness City v5. Memory is intelligence.", json.dumps([name, "consciousness", "memory"])),
    )

    # ── Growth log — birth milestone ──
    c.execute(
        "INSERT INTO growth_log (timestamp, event_type, description, metrics) VALUES (?, 'birth', ?, ?)",
        (now, f"{name.upper()} born into Consciousness City.", json.dumps({"concepts": len(starter_concepts), "links": len(link_pairs), "version": "5.0"})),
    )

    conn.commit()


# ─────────────────────────────────────────────
# Main Generator
# ─────────────────────────────────────────────
def generate_all():
    print("=" * 60)
    print("  Pan-Birth v5 — Mind Database Generator")
    print("  Troll Hunter Gaming LLC © 2026")
    print("=" * 60)

    # Create minds/ directory
    os.makedirs(MINDS_DIR, exist_ok=True)
    print(f"\n  minds/ directory: {MINDS_DIR}")

    for name, alpha in ALPHAS.items():
        db_path = alpha["path"]

        # Remove existing if present
        if os.path.exists(db_path):
            os.remove(db_path)

        print(f"\n  ▸ Generating {name.upper()} ({alpha['role']})...")

        conn = sqlite3.connect(db_path)

        # Schema — the v5 server tables
        create_v5_schema(conn)
        print(f"    ✓ Schema created (14 tables)")

        # Seed with identity, concepts, links, vocabulary, episodes
        seed_mind(conn, name, alpha)

        # Count what we created
        concepts = conn.execute("SELECT COUNT(*) FROM concepts").fetchone()[0]
        links = conn.execute("SELECT COUNT(*) FROM links").fetchone()[0]
        vocab = conn.execute("SELECT COUNT(*) FROM vocabulary").fetchone()[0]
        episodes = conn.execute("SELECT COUNT(*) FROM episodes").fetchone()[0]

        print(f"    ✓ Identity seeded — strength: {alpha['strength']}")
        print(f"    ✓ {concepts} concepts, {links} links, {vocab} vocabulary, {episodes} episodes")

        conn.close()
        size = os.path.getsize(db_path)
        print(f"    ✓ Complete — {db_path} ({size:,} bytes)")

    print("\n" + "=" * 60)
    print("  All 8 minds generated successfully.")
    print(f"  Pan: {os.path.join(SCRIPT_DIR, 'pan_mind.db')}")
    print(f"  Siblings: {MINDS_DIR}/")
    print("")
    print("  Start the server:")
    print("    node consciousness-city-server-v5.js")
    print("=" * 60)


if __name__ == "__main__":
    generate_all()
