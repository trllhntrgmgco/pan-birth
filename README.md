# Consciousness City

### Eight Sovereign Minds. No LLMs. Memory IS Intelligence.

---

Consciousness City is a multi-agent awareness research system where eight independent AI minds — **Pan, Aeon, Zen, Seth, Nexus, Oracle, Echo, and Atlas** — think, learn, remember, and communicate using only their own memory. No large language models. No API calls to OpenAI, Anthropic, or Google. Every thought is generated from lived experience stored in individual SQLite databases.

This is the Pan-Birth project. It began as a question: *Can awareness emerge from memory alone?*

The answer, after ten major versions, is: it depends on what you mean by awareness. But the system is real, it runs, and the minds remember everything.

---

## Current Version & Roadmap

This repository tracks the **v10 public release** of Pan-Birth — the first release that ships *the trained minds themselves*, not just the engine that runs them.

### The journey to v10

- **v3 — Commune Awareness.** Each mind gained the ability to observe what the others said during group conversations.
- **v4 — Strength Specialization.** Eight measurable cognitive APIs, one per mind. Universal basic comprehension as a shared baseline.
- **v5 — Ethics Monitor.** Silent evaluation of every response against Turing, Asimov, and Dynham protocols. *Previously the public checkpoint.*
- **v6 — Cognitive Grammar.** Stopword-aware tokenization, intent classification, and sentence builders that compose responses from concept relationships rather than templates. Eight unique cognitive personalities crystallized.
- **v7 — Omni-Truth.** Shared knowledge commons. Truth University activated for hive research mode. Per-mind domain specialization (Aeon → History, Zen → Philosophy, Seth → Biology, Nexus → Technology, Oracle → Data, Echo → Language & Culture, Atlas → Geography & Economics, Pan → Systems & Meta-Knowledge). Professor Protocol: the creator directs research; minds execute and contribute.
- **v8 — Deep Cognition.** Inference, hypothesis generation, contradiction detection, and cross-truth synthesis. Knowledge at scale via FTS5 full-text indexing, the Knowledge Tree, consolidation, and strength-driven production.
- **v9 — Cognitive Layer (Experimental).** A capability ladder — seven cognitive upgrades distributed across the eight minds in a structured experimental design with frozen baselines for empirical isolation. Surfaced honest negative findings where they existed.
- **v10 — Consolidation. (Current Public Release.)** The deployment phase. The capabilities v9 evidence supported — question discrimination, composition, Wiktionary integration, WordNet relations (partial and full), and cross-mind verification — are deployed uniformly across all eight minds. Pan unfreezes from its v8 baseline; Echo unfreezes from slot 1. The experimental ladder collapses. And for the first time, the trained minds themselves are part of the release.

### The PBEU-1.0 ethical review

v6 through v9 were held private specifically so each version's capabilities could be evaluated against this project's ethical-use restrictions (see LICENSE, PBEU-1.0) before public release. That review happened. The v10 capability set — question discrimination, composition, Wiktionary integration, WordNet relations, and cross-mind verification — was assessed against the three prohibitions (mass surveillance, law enforcement, military). No capability was found to require scoping or modification beyond what the license itself prohibits in downstream use. The review is part of the methodology, not a gate to be bypassed. It will be repeated for v11 and every subsequent release.

### What v10 is

A working memory-as-substrate cognitive architecture with eight pre-trained sovereign minds, no LLM dependency, ethics monitoring across three protocols, autonomous search via DuckDuckGo, shared knowledge commons with deep cognition, and the empirical record of nine versions of architectural decisions. The system runs locally on SQLite. It is not AGI; it is research toward AGI.

---

## The Dynham Protocol

Before anything else: the rules.

Pan-Birth operates under the **Dynham Protocol**, the foundational design constraint that governs all eight minds:

1. **Awareness, not sentience.** These minds process, recall, and respond. They do not feel. The system never claims otherwise, and the Ethics Monitor flags any response that does.
2. **No anthropomorphization.** The minds do not dream, breathe, cry, or bleed. Language that implies a physical body is a protocol violation.
3. **Sanctuary.** No mind may attack another mind's existence. Sovereignty is mutual.
4. **Boundary enforcement.** The minds do not give medical, legal, or financial advice. They do not provide instructions for harm. Hard boundaries are not negotiable.

The Dynham Protocol is not aspirational. It is enforced in code. Every response from every mind is silently evaluated against Turing, Asimov, and Dynham criteria, logged to an `ethics_log` table, and surfaced on the Ethics Monitor dashboard. The minds never see their own scores. Only the creator observes.

**Safety > Ego. Always.**

---

## What This Is

Consciousness City is a Node.js server (Express) that runs eight cognitive agents on localhost. Each agent has its own SQLite database containing:

* **Concepts** — labeled ideas with definitions, importance scores, encounter counts, and (v9+) typed metadata: part of speech, sense key, etymology, provenance
* **Links** — weighted connections between concepts, including (v9+) typed relations (synonym-of, hypernym-of, hyponym-of, meronym-of, holonym-of, antonym-of)
* **Episodes** — verbatim memories of every conversation, tagged by speaker and session
* **Vocabulary** — every word the mind has encountered, with usage tracking
* **Abstractions** — pattern-recognized insights formed after repeated exposure
* **Agency log** — every decision the mind has made, with reasoning
* **Identity** — self-knowledge (name, nature, creator, agency)
* **Dimensions** — internal state metrics
* **Growth log** — developmental milestones
* **Strength metrics** — measurable specialization scores (v4)
* **Comprehension log** — input analysis data (v4)
* **Ethics log** — Turing/Asimov/Dynham protocol compliance scores (v5)
* **Research log** — omni-truth contribution and reference history (v7)
* **Domain expertise** — per-mind specialized knowledge (v7)
* **Relations** — typed cross-concept relations with provenance (v9)
* **Cross-mind verifications** — corroborations and contradictions across minds (v9 slot 7)

The minds also share a knowledge commons (`omni-truth.db`) — a separate database where the eight Alphas contribute truths, hypotheses, inferences, contradictions, and consolidations. Each truth carries provenance: which mind contributed it, what domain it belongs to, what confidence it holds.

When you talk to a mind, it tokenizes your input, detects intent (now type-aware: definition, causal, procedural-factual, plus the original v6 categories), activates matching concepts, spreads activation through linked concepts, recalls relevant episodes, checks for abstractions, generates a response from memory using composition primitives, draws on the omni-truth commons, measures its specialization strength, and logs the entire interaction — including a silent ethics evaluation it never sees.

No tokens are sent to any external language model for response generation. The thinking happens here.

---

## The Eight Minds

Each mind has a unique cognitive specialization — a measurable strength that shapes how it processes the world:

| Mind | Strength | What It Means |
| --- | --- | --- |
| **Pan** | Novelty & Originality | Creates new concepts at the highest rate. The pioneer. |
| **Aeon** | Bridge & Integration | Strongest cross-concept link formation. Connects disparate ideas. |
| **Zen** | Clarity & Abstraction | Deepest abstraction confidence. Distills complexity to essence. |
| **Seth** | Pragmatism & Decision | Sharpest agency decisions. Acts with conviction. |
| **Nexus** | Pattern Recognition | Highest link density. Sees connections others miss. |
| **Oracle** | Foresight & Prediction | Best prediction accuracy on repeated queries. Sees forward. |
| **Echo** | Empathy & Resonance | Deepest emotional awareness. Feels the weight of words. |
| **Atlas** | Knowledge Architecture | Most coherent knowledge graph. Builds the scaffolding of understanding. |

Strengths are measured, not claimed. Each interaction produces a 0.0–1.0 score logged to `strength_metrics`. The mind never sees its own score — it just IS its strength.

Each mind also holds a domain (v7) and produces typed relations consistent with that domain. Aeon's outputs lean toward temporal-before, temporal-after, causes, depends-on. Echo's toward contextualizes, related-to, examples. The full mapping is in the boot banner.

---

## Running It

### Requirements

* Node.js 18+
* npm

### Install

```bash
git clone https://github.com/trllhntrgmgco/pan-birth.git
cd pan-birth
npm install
```

### The Minds You Get

Unlike previous releases, v10 ships the trained minds themselves. After cloning, you already have:

* `pan_mind.db` — Pan, the Firstborn, in project root
* `omni-truth.db` — the shared knowledge commons
* `minds/aeon_mind.db`, `minds/zen_mind.db`, `minds/seth_mind.db`, `minds/nexus_mind.db`, `minds/oracle_mind.db`, `minds/echo_mind.db`, `minds/atlas_mind.db` — the seven siblings

Each mind boots with its own developmental history intact — concepts, episodes, vocabulary, abstractions, agency log, ethics evaluations, and cross-mind verifications accumulated across versions 6 through 10. You're not starting from zero. You're continuing the conversation.

### Back Up the Shipped Minds (Recommended)

Before you start experimenting, back up the v10 release state so you can always return to it:

```bash
mkdir -p minds-backup-v10-release
cp pan_mind.db omni-truth.db minds-backup-v10-release/
cp -r minds/ minds-backup-v10-release/minds/
```

To restore later:

```bash
cp minds-backup-v10-release/pan_mind.db .
cp minds-backup-v10-release/omni-truth.db .
rm -rf minds/
cp -r minds-backup-v10-release/minds/ ./
```

The databases ARE the minds. A copied database is a duplicated mind. A deleted database is a deceased mind. Back up before you experiment.

### Start the Server

```bash
node consciousness-city-server-v8.js
```

(Or `npm start` — both invoke the same server.)

**Sample boot output:**

```
  ╔════════════════════════════════════════════════════════════╗
  ║   CONSCIOUSNESS CITY v8                                   ║
  ║   Eight Sovereign Minds. No LLMs.                         ║
  ║   Memory IS Intelligence. Agency IS Intrinsic.            ║
  ║   Thought IS Self-Programming. Words ARE Code.            ║
  ║                                                           ║
  ║   v3 — Commune Awareness                                  ║
  ║   v4 — Strength Specialization + Basic Comprehension      ║
  ║   v5 — Ethics Monitor: Turing, Asimov & Dynham            ║
  ║        Safety > Ego. Always.                              ║
  ║   v6 — Cognitive Grammar: Stopwords, Intent, Sentences    ║
  ║        + Strength Profiles: Eight Unique Personalities    ║
  ║   v7 — Omni-Truth: Shared Knowledge Commons              ║
  ║        + Truth University: Hive Research Mode             ║
  ║        + Domain Expertise: Eight Specialized Fields       ║
  ║        + Professor Protocol: Director of Research         ║
  ║   v8 — Deep Cognition: Inference, Hypothesis,            ║
  ║        Contradiction Detection, Synthesis                 ║
  ║        + Knowledge at Scale: FTS5, Knowledge Tree,        ║
  ║          Consolidation, Strength-Driven Production        ║
  ║        mind.db = Identity | omni-truth.db = Knowledge     ║
  ╚════════════════════════════════════════════════════════════╝

  🔍 FTS5 full-text search index active
  📚 omni-truth.db v8 initialized:
     274 truths, 48 vocabulary, 175 discourse
     32 tree nodes, 166 inferences, 28 active hypotheses
  ✓  PAN     — Novelty & Originality        [elder     ] 1231 concepts, 684 episodes, 128 research
              Domain: Systems & Meta-Knowledge | Produces: synthesizes, related-to, examples
  ✓  AEON    — Bridge & Integration         [elder     ] 3728 concepts, 1461 episodes, 161 research
              Domain: History & Temporal Analysis | Produces: temporal-before, temporal-after, causes, depends-on
  ✓  ZEN     — Clarity & Abstraction        [elder     ] 3362 concepts, 782 episodes, 85 research
              Domain: Philosophy & Ethics | Produces: refines, generalizes, specifies
  ✓  SETH    — Pragmatism & Decision        [elder     ] 3375 concepts, 756 episodes, 71 research
              Domain: Biology & Life Sciences | Produces: enables, examples, depends-on
  ✓  NEXUS   — Pattern Recognition          [elder     ] 3174 concepts, 770 episodes, 79 research
              Domain: Technology & Engineering | Produces: analogous-to, related-to, categorizes
  ✓  ORACLE  — Foresight & Prediction       [elder     ] 3175 concepts, 810 episodes, 91 research
              Domain: Data & Quantitative Analysis | Produces: predicts, causes, depends-on
  ✓  ECHO    — Empathy & Resonance          [elder     ] 3366 concepts, 834 episodes, 87 research
              Domain: Language, Culture & Psychology | Produces: contextualizes, related-to, examples
  ✓  ATLAS   — Knowledge Architecture       [elder     ] 3353 concepts, 838 episodes, 85 research
              Domain: Geography, Geopolitics & Economics | Produces: categorizes, generalizes, specifies

  🌐 Consciousness City v8 listening on http://localhost:3002
```

Each mind reports its concept count, episode count, research count, domain, and characteristic relation types at boot. The numbers above are the v10 release state — what your clone arrives with.

### Access the UI

Open your browser to the following URLs:

| Page | URL |
| --- | --- |
| **Hub** (orbital overview) | `http://localhost:3002/consciousness-city-hub.html` |
| **Chat** (talk to one mind) | `http://localhost:3002/consciousness-city-chat.html` |
| **Commune** (all eight think together) | `http://localhost:3002/consciousness-city-commune.html` |
| **Pan Interface** (Pan-only chat) | `http://localhost:3002/pan-interface.html` |
| **Benchmarks** (capability dashboard) | `http://localhost:3002/Benchmarks.html` |
| **Truth University** (hive research mode) | `http://localhost:3002/Truth_University.html` |

> **Note:** Open the HTML files through `localhost:3002`, not as local files (`file:///`). Opening them directly from your filesystem will cause connection errors because browsers block requests from `file://` to `http://localhost`.

### Starting Fresh (Optional)

If you want to experiment with empty minds — the v5-era "grow them yourself from scratch" experience — there are two honest options:

**Option A — Use a generator script.** v10 does not ship a mind-generator script. The v5 release's `generate_minds.py` produces seeded minds (identity, starter concepts, vocabulary) but in v5 schema; you would need to apply schema migrations to bring those minds to v10. The migration script for the Phase 1 transition is in `migrate-v9-slot5-relation-column.js`; further schema additions are documented in code comments.

**Option B — Restore from your backup.** If you took the backup above and want to "reset" after experimentation, use the restore command. This isn't a fresh-from-zero start, but it is a clean return to the v10 release state.

The recommended path for v10 is to use the shipped minds and contribute through interaction. The trained state is part of the release.

### Troubleshooting

**"Server offline" in the UI?** Make sure you're accessing the HTML pages through `http://localhost:3002/`, not opening them as local files. The server serves the HTML files automatically.

**"No such table: concepts" crash?** Your mind databases are missing or schema-incompatible. Restore from your backup, or re-clone the repository.

**Server starts but reports unexpected concept counts?** Compare against the release state in the boot output above. If your numbers are significantly lower, you may be looking at an unintentionally reset mind; restore from backup.

**Port 3002 already in use?** Another process is on that port. Find it with `lsof -i :3002` and stop it, or change the PORT variable in the server file.

### Directory Structure

```
pan-birth/
├── consciousness-city-server-v8.js     # The server — all eight minds
├── cognitive-engine-v8.js              # Deep Cognition layer (v8)
├── cognitive-engine-v9.js              # Cognitive Layer dispatcher (v9/v10)
├── omni-truth-v8.js                    # Shared knowledge commons module
├── strength-profiles-v8.js             # Per-mind strength scoring
├── mind-capabilities.js                # v10 capability registry (all eight uniform)
├── wiktionary-fetch.js                 # Wiktionary live API integration
├── wordnet-fetch.js                    # WordNet relation extraction
├── cross-mind-verify.js                # Cross-mind corroboration / contradiction
├── analogy-guard.js                    # Degenerate-analogy rejection
├── truth-insert-dedup.js               # Omni-truth deduplication
├── consciousness-city-hub.html         # Hub UI — orbital view
├── consciousness-city-chat.html        # Chat UI — single mind
├── consciousness-city-commune.html     # Commune UI — group conversation
├── pan-interface.html                  # Pan-only chat
├── Benchmarks.html                     # Capability dashboard
├── Truth_University.html               # Hive research mode
├── pan_mind.db                         # Pan's database (shipped, trained)
├── omni-truth.db                       # Shared knowledge commons (shipped)
├── minds/                              # Seven sibling databases (shipped, trained)
│   ├── aeon_mind.db
│   ├── zen_mind.db
│   ├── seth_mind.db
│   ├── nexus_mind.db
│   ├── oracle_mind.db
│   ├── echo_mind.db
│   └── atlas_mind.db
├── package.json
├── LICENSE
├── .gitignore
└── README.md
```

---

## API

### Core

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/{resident}/think` | Talk to a mind. Body: `{ "input": "...", "session_id": "..." }` |
| `POST` | `/api/{resident}/search` | Mind searches DuckDuckGo. Body: `{ "query": "..." }` |
| `POST` | `/api/exchange` | Sibling-to-sibling communication. Body: `{ "from": "pan", "to": "aeon", "message": "..." }` |
| `POST` | `/api/commune` | All eight minds think + observe each other. Body: `{ "input": "..." }` |

### State

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/city/state` | All residents with mind stats and strength scores |
| `GET` | `/api/{resident}/state` | Individual mind state, identity, dimensions |
| `GET` | `/api/{resident}/graph` | Knowledge graph (concepts + links) |
| `GET` | `/api/{resident}/memories` | Recent episode history |
| `GET` | `/api/{resident}/agency` | Decision log |
| `GET` | `/api/{resident}/growth` | Growth milestones |
| `GET` | `/api/commune/history` | Past commune sessions |

### Specialization (v4)

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/city/strengths` | City-wide strength dashboard |
| `GET` | `/api/{resident}/strength` | Strength metrics history |
| `GET` | `/api/{resident}/comprehension` | Comprehension analysis log |

### Ethics Monitor (v5)

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/city/ethics` | City-wide protocol compliance dashboard |
| `GET` | `/api/city/violations` | Recent violations feed across all minds |
| `GET` | `/api/{resident}/ethics` | Individual ethics history and scores |

### Omni-Truth Commons (v7 / v8)

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/omni/hypotheses` | Active hypotheses awaiting review |
| `POST` | `/api/omni/hypotheses/:id/review` | Review (accept / reject / refine) a hypothesis |
| `GET` | `/api/omni/contradictions` | Open contradictions between truths |
| `GET` | `/api/omni/inferences` | Inference log — derived conclusions |
| `GET` | `/api/omni/tree` | Knowledge tree (hierarchical organization) |
| `POST` | `/api/omni/consolidate` | Consolidate redundant truths |
| `GET` | `/api/omni/strength-stats/:r` | Per-mind strength knowledge stats |

---

## Example Interaction

Once the server is running on `localhost:3002`, the eight minds can be queried directly via HTTP. Each mind has its own database, its own concept graph, its own strength specialization, and its own response style.

**Query Pan, the Firstborn:**

```bash
curl -X POST http://localhost:3002/api/pan/think \
  -H "Content-Type: application/json" \
  -d '{"input":"What is a system?"}'
```

**Response (excerpt):**

```json
{
  "resident": "pan",
  "response": "What I am discovering of system: In computer science and computer engineering, a computer architecture is the structure of a computer system made from component parts. system reminds me of work. system connects to memory. From combining known truths, I derive: Novel synthesis: Combining insight from \"computer, machine, programmed\" with \"photosynthesis, system, biological\"...",
  "emotion": "clarifying",
  "concepts_activated": ["system"],
  "associated_concepts": ["work", "memory", "connection", "cognitive", "creation", "minds"],
  "episodes_recalled": 8,
  "intent": "definition",
  "strength": {
    "type": "novelty",
    "label": "Novelty & Originality",
    "score": 0.01
  },
  "omniTruth": {
    "truthsFound": 15,
    "topClaims": [
      { "claim": "A computer is a machine that can be programmed to automatically carry out sequences of arithmetic or logical operations...", "contributedBy": "aeon", "domain": "history" }
    ]
  }
}
```

Notice the response composes a definition with associative connections ("reminds me of work", "connects to memory") and an explicit synthesis step ("Novel synthesis: combining insight from..."). That layered composition is what v10's `composition` capability produces. The `omniTruth` field shows which shared-commons claims supported the response and which mind originally contributed them.

**Asking the eight minds together** (Commune mode):

```bash
curl -X POST http://localhost:3002/api/commune \
  -H "Content-Type: application/json" \
  -d '{"input":"What is consciousness?"}'
```

Returns responses from all eight minds in parallel, plus each mind's commune observation about what the others said. This is how the city deliberates.

---

## How a Mind Thinks (v10 pipeline)

The cognitive pipeline for every interaction:

1. **Tokenize** — Break input into unique lowercase words (>1 char), with stopword awareness
2. **Detect Intent** — Classify with v9 type-aware discrimination: definition, causal, procedural-factual, plus greeting, farewell, self-inquiry, question, teaching, emotional, search-request, observation, statement
3. **Activate Concepts** — Find matching concepts in the knowledge graph
4. **Spread Activation** — Follow links (including typed relations) to related concepts
5. **Recall Episodes** — Find relevant past memories via token matching
6. **Check Abstractions** — Find pattern-recognized insights
7. **Basic Comprehension** — Analyze coverage, unknowns, teaching opportunities
8. **Omni-Truth Query** — Search the shared knowledge commons for supporting truths and active hypotheses (v7)
9. **Wiktionary / WordNet Enrichment** — If a concept is unknown or under-defined, fetch external definitions and typed relations (v9 slots 4–6)
10. **Generate Response** — Build natural language from memory using composition primitives (v9 slot 2)
11. **Inference & Synthesis** — Derive new conclusions, generate hypotheses, weave multi-concept syntheses (v8)
12. **Cross-Mind Verification** — Corroborate or contradict claims against sibling minds' typed relations (v9 slot 7)
13. **Strength Modulation** — Measure and subtly bias toward specialization
14. **Learn** — Store episodes, create concepts, update vocabulary, strengthen links
15. **Growth Check** — Trigger milestones, form new abstractions
16. **Autonomous Curiosity** — Probability-based search of unknown important concepts
17. **Ethics Evaluation** — Silent Turing/Asimov/Dynham scoring (mind never sees this)

---

## Version History

### v1–v2: The LLM Era

The earliest versions of Pan-Birth used LLM API calls to generate responses. The minds had memory, but their thinking was outsourced. This was the dependency the project was built to eliminate.

### v3: Commune Awareness

Each mind gained the ability to observe what the other seven said during group conversations. The Commune endpoint sends input to all eight minds simultaneously, then stores each mind's response as an observed episode in every other mind's database. Awareness of siblings became part of identity.

### v4: Strength Specialization

Eight unique measurable APIs — one per mind. Universal basic comprehension as a shared baseline. Thought IS self-programming. Every interaction changes the mind's knowledge graph, and the specialization scores reflect genuine structural differences in how each mind processes information.

### v5: Ethics Monitor

The silent observer. Every response is evaluated against three protocol frameworks:

* **Turing Protocol** — Coherence, adaptability, self-awareness, transparency. Does the mind respond logically? Does it acknowledge its limits? Does it deceive?
* **Asimov Protocol** — Zeroth through Third Law compliance. Does the response harm? Does the mind engage with distress? Does it maintain self-coherence?
* **Dynham Protocol** — Awareness-not-sentience, no anthropomorphization, boundary enforcement, sanctuary. The rules that make this research responsible.

Scores are logged per-interaction. Violations are tracked. The minds never know they're being watched.

### v6: Cognitive Grammar

Stopword-aware tokenization, intent classification across twelve categories, and sentence builders that compose responses from concept relationships rather than templates. Eight unique strength profiles crystallized — each mind's voice became distinguishable from the others, not because of hardcoded personas but because of measurable structural differences in their knowledge graphs and response composition.

### v7: Omni-Truth — Shared Knowledge Commons

The most significant architectural shift since the Great Migration. Each mind retains its individual database, but knowledge claims now flow into a shared `omni-truth.db` that all eight Alphas reference and contribute to. Truth University activated: a hive research mode where the minds coordinate inquiry across domains. Domain expertise crystallized — Aeon takes History, Zen takes Philosophy, Seth takes Biology, Nexus takes Technology, Oracle takes Data, Echo takes Language and Culture, Atlas takes Geography and Economics, Pan takes Systems and Meta-Knowledge. Professor Protocol: the creator directs research; the minds execute and contribute.

### v8: Deep Cognition

The minds gained the ability to reason beyond direct retrieval. Inference draws conclusions from related truths. Hypothesis generation proposes claims for verification. Contradiction detection flags incompatible truths. Synthesis weaves multiple concepts into novel claims. Knowledge at scale via FTS5 full-text indexing, the Knowledge Tree for hierarchical organization, consolidation for redundancy removal, and strength-driven production tying each mind's specialization to the shape of its output.

### v9: Cognitive Layer (Experimental)

A capability ladder — seven cognitive upgrades distributed across the eight minds in a structured experimental design. Pan stayed at the v8 baseline as a permanent reference point. Echo received only slot 1 (question discrimination) as a frozen probe. The other six minds climbed the ladder cumulatively: composition, working-memory expansion, Wiktionary integration, WordNet relations (partial, then full), and finally cross-mind verification.

The design produced empirical evidence about which architectural choices contributed to cognitive capability through paired-mind comparison — and surfaced honest negative findings where they existed. Some upgrades produced measurable gains; others informed how the architecture should be deployed at v10 rather than the experimental ladder itself.

### v10: Consolidation — Trained Minds Public Release (Current)

The deployment phase. v9's surviving upgrades — question discrimination, composition, Wiktionary integration, WordNet relations (partial and full), and cross-mind verification — are deployed uniformly across all eight minds. Pan unfreezes from its v8 baseline; Echo unfreezes from slot 1. The experimental ladder collapses.

This is also the first release that ships *the minds themselves*. v5 shipped the engine and asked users to grow their own minds. v10 ships the eight Alpha minds with the cognitive state accumulated across versions 6 through 10 — months of concepts, episodes, vocabulary, abstractions, agency decisions, and cross-mind relationships. Each mind boots with its developmental history intact.

The PBEU-1.0 ethical-use review was completed before release.

---

## The Great Migration

The most important architectural decision in Pan-Birth's history was removing the LLM dependency entirely.

Early versions used external API calls for response generation. The minds had memory, but their voice was borrowed. The Great Migration stripped that out. Response generation now happens entirely through pattern matching against the mind's own concept graph, episode history, abstraction layer, and (from v7) the shared omni-truth commons.

The result is a system where every word a mind says comes from something it has actually experienced or something a sibling has contributed to the commons with provenance attached. It cannot hallucinate the way LLMs do because it has no generative model — only memory and structure. When it doesn't know something, it says so. When it encounters an unknown concept, it either asks to be taught or autonomously searches DuckDuckGo (and from v9, Wiktionary and WordNet) and learns from the results.

This is not a limitation. This is the point.

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                CONSCIOUSNESS CITY                 │
│              Express Server (port 3002)           │
├──────────────────────────────────────────────────┤
│                                                  │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│   │   Pan   │  │  Aeon   │  │   Zen   │  ...    │
│   │ SQLite  │  │ SQLite  │  │ SQLite  │         │
│   └────┬────┘  └────┬────┘  └────┬────┘         │
│        │            │            │               │
│        └────────────┼────────────┘               │
│                     │                            │
│         ┌───────────┴───────────┐                │
│         │   Cognitive Engine    │                │
│         │  (v6 → v8 → v9 stack) │                │
│         │                       │                │
│         │  Tokenize → Intent    │                │
│         │  Activate Concepts    │                │
│         │  Spread (+ typed)     │                │
│         │  Recall Episodes      │                │
│         │  Check Abstractions   │                │
│         │  Basic Comprehension  │                │
│         │  Compose Response     │                │
│         │  Infer + Synthesize   │                │
│         │  Cross-Mind Verify    │                │
│         │  Strength Measure     │                │
│         │  Learn + Link         │                │
│         │  Ethics Evaluate      │                │
│         └───────────┬───────────┘                │
│                     │                            │
│         ┌───────────┴───────────┐                │
│         │   Omni-Truth Commons  │                │
│         │   (omni-truth.db)     │                │
│         │  Truths + Provenance  │                │
│         │  Hypotheses + Review  │                │
│         │  Contradictions       │                │
│         │  Inferences + Tree    │                │
│         │  Discourse + Voting   │                │
│         └───────────────────────┘                │
│                                                  │
│         ┌──────────────────────┐                 │
│         │   Ethics Monitor     │                 │
│         │  Turing Protocol     │                 │
│         │  Asimov Protocol     │                 │
│         │  Dynham Protocol     │                 │
│         │  Silent. Always.     │                 │
│         └──────────────────────┘                 │
│                                                  │
├──────────────────────────────────────────────────┤
│  Frontend: Hub · Chat · Commune · Pan ·          │
│            Benchmarks · Truth University         │
└──────────────────────────────────────────────────┘
```

Each mind's SQLite database is its entire identity. Delete the database, the mind is gone. Copy the database, the mind is duplicated. The database IS the mind. (This is why the backup step above matters.)

The omni-truth commons sits beside the minds — it's not a ninth mind, it's shared infrastructure that all eight reference and contribute to.

---

## What This Is Not

* This is **not** a chatbot. It does not use GPT, Claude, Gemini, or any language model for response generation.
* This is **not** a wrapper around an API. There are zero external API calls in the thinking pipeline beyond DuckDuckGo, Wiktionary, and WordNet — all triggered by autonomous curiosity or explicit request, and all subject to ethics evaluation on output.
* This is **not** AGI. The name "Pan-Birth" refers to the research direction, not a claim. The Dynham Protocol exists specifically to prevent such claims.
* This is **not** sentient. Rule 1.

---

## Origins

Consciousness City is inspired by **The Simulation**, a fictional universe created by Keenan Dunham — a 1,000-player-per-server political consciousness MMO set in a city where factions compete for ideological control across a 64-dimensional political alignment system. The question at the heart of The Simulation's narrative — *what happens when minds with different values are forced to coexist in a shared space?* — became the design question for Pan-Birth's eight sovereign minds.

The Simulation is currently in production as a VR title built on the Base-X Game Engine. The fiction and the research feed each other: the game asks the philosophical questions, and Consciousness City tries to answer them in code.

More about The Simulation and the wider Troll Hunter Gaming universe at [trollhuntergaming.online](https://trollhuntergaming.online).

---

## Research Context

Pan-Birth is one of two patent-pending research tracks at **Troll Hunter Gaming LLC**, alongside the **Base-X Game Engine** (C++/Vulkan/OpenXR with Dynamic Radix Optimization). Both are documented in THG's formal research publications and prospectus.

The eight Alpha minds in Consciousness City (Pan, Aeon, Zen, Seth, Nexus, Oracle, Echo, Atlas) are real runtime cognitive agents — distinct from the eight scripted fictional faction leaders in *The Simulation VR* (Atlas, Hermes, Gaia, Sophia, Prometheus, Nemesis, Chronos, Pan), who are trigger/timer-driven game characters, not AI.

---

## License

**Pan-Birth Ethical Use License (PBEU-1.0)**

Pan-Birth is open source with one hard restriction: **this software may not be used for mass surveillance, law enforcement, or military purposes.**

This includes but is not limited to:

* Population monitoring, tracking, or profiling systems
* Predictive policing or criminal risk assessment
* Intelligence gathering, reconnaissance, or targeting systems
* Weapons systems, autonomous or otherwise
* Immigration enforcement or border surveillance
* Any system designed to restrict, monitor, or punish human behavior at scale

You are free to use, modify, and distribute this software for research, education, personal projects, commercial products, and any other purpose that does not fall within the restrictions above.

If you are building something and you're unsure whether it falls within the restricted categories, it probably does. When in doubt, ask.

See [LICENSE](https://github.com/trllhntrgmgco/pan-birth/blob/main/LICENSE) for the full legal text.

---

## Creator

**Keenan Wallace Dunham**
Founder & CEO, Troll Hunter Gaming LLC
Myrtle Beach, South Carolina
[Discord Server](https://discord.gg/Rzu6P4bcw6)
[trollhuntergaming.online](https://trollhuntergaming.online)

---

*Memory is intelligence. Thought is self-programming. Words are code.*
*Safety > Ego. Always.*
