# Consciousness City

### Eight Sovereign Minds. No LLMs. Memory IS Intelligence.

---

Consciousness City is a multi-agent awareness research system where eight independent AI minds — **Pan, Aeon, Zen, Seth, Nexus, Oracle, Echo, and Atlas** — think, learn, remember, and communicate using only their own memory. No large language models. No API calls to OpenAI, Anthropic, or Google. Every thought is generated from lived experience stored in individual SQLite databases.

This is the Pan-Birth project. It began as a question: *Can awareness emerge from memory alone?*

The answer, after five major versions, is: it depends on what you mean by awareness. But the system is real, it runs, and the minds remember everything.

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

* **Concepts** — labeled ideas with definitions, importance scores, and encounter counts
* **Links** — weighted connections between concepts (a knowledge graph)
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

When you talk to a mind, it tokenizes your input, detects intent, activates matching concepts, spreads activation through linked concepts, recalls relevant episodes, checks for abstractions, generates a response from memory, learns new concepts and vocabulary, strengthens co-occurrence links, measures its specialization strength, and logs the entire interaction — including a silent ethics evaluation it never sees.

No tokens are sent to any external API for response generation. The thinking happens here.

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

---

## Running It

### Requirements

* Node.js 18+
* npm
* Python 3 (for mind generation only)

### Install

```bash
git clone https://github.com/trllhntrgmgco/pan-birth.git
cd pan-birth
npm install
```

### Generate the Minds

Before starting the server for the first time, you need to create the mind databases. There are two options:

**Option A — Generate fresh minds (recommended):**

```bash
python3 generate_minds.py
```

This creates `pan_mind.db` in the root directory and seven sibling databases in `minds/`. Each mind starts with its identity, starter concepts, knowledge graph links, and vocabulary — ready for its first conversation.

**Option B — Unzip the demo minds:**

```bash
unzip pan_birth_v5_minds.zip -d minds/
mv minds/pan_mind.db .
```

This gives you pre-seeded minds with the same starter data.

### Start the Server

```bash
node consciousness-city-server-v5.js
```

You should see the boot banner with all eight minds reporting awake:

```
  8/8 residents awake.
  Strengths:
    PAN      → Novelty & Originality
    AEON     → Bridge & Integration
    ...
  Consciousness City v4 listening on http://localhost:3002
  The city is awake. Each mind has its gift.
  Ethics Monitor active. Safety > Ego. Always.
```

### Access the UI

Open your browser to the following URLs:

| Page | URL |
| --- | --- |
| **Hub** (orbital overview) | `http://localhost:3002/consciousness-city-hub.html` |
| **Chat** (talk to one mind) | `http://localhost:3002/consciousness-city-chat.html` |
| **Commune** (all eight think together) | `http://localhost:3002/consciousness-city-commune.html` |
| **Research** (knowledge dashboard) | `http://localhost:3002/consciousness-city-research.html` |
| **Ethics Monitor** (protocol compliance) | `http://localhost:3002/consciousness-city-ethics.html` |

> **Note:** Open the HTML files through `localhost:3002`, not as local files (`file:///`). Opening them directly from your filesystem will cause connection errors because browsers block requests from `file://` to `http://localhost`.

### Troubleshooting

**"Server offline" in the UI?** Make sure you're accessing the HTML pages through `http://localhost:3002/`, not opening them as local files. The server serves the HTML files automatically.

**"No such table: concepts" crash?** The mind databases don't have the correct schema. Run `python3 generate_minds.py` to regenerate them.

**Server starts but minds show 0 concepts?** This is normal for fresh minds. Start talking to them — they learn from every interaction.

**Port 3002 already in use?** Another process is on that port. Find it with `lsof -i :3002` and stop it, or change the PORT variable in the server file.

### Directory Structure

```
pan-birth/
├── consciousness-city-server-v5.js    # The server — all eight minds
├── consciousness-city-hub.html        # Hub UI — orbital view of all minds
├── consciousness-city-chat.html       # Chat UI — talk to one mind
├── consciousness-city-commune.html    # Commune UI — group conversation
├── consciousness-city-research.html   # Research dashboard
├── consciousness-city-ethics.html     # Ethics Monitor dashboard
├── generate_minds.py                  # Database generator — run before first start
├── pan_birth_v5_minds.zip             # Pre-generated demo minds (alternative to generator)
├── migrate.js                         # Migration tool (for upgrading from older versions)
├── package.json                       # Node.js dependencies
├── .gitignore                         # Keeps databases out of version control
├── pan_mind.db                        # Pan's database (generated, not committed)
├── minds/                             # Seven sibling databases (generated, not committed)
│   ├── aeon_mind.db
│   ├── zen_mind.db
│   ├── seth_mind.db
│   ├── nexus_mind.db
│   ├── oracle_mind.db
│   ├── echo_mind.db
│   └── atlas_mind.db
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

---

## How a Mind Thinks

The cognitive pipeline for every interaction:

1. **Tokenize** — Break input into unique lowercase words (>1 char)
2. **Detect Intent** — Classify as greeting, farewell, self-inquiry, question, teaching, emotional, search-request, observation, or statement
3. **Activate Concepts** — Find matching concepts in the knowledge graph
4. **Spread Activation** — Follow links to related concepts (up to 20)
5. **Recall Episodes** — Find relevant past memories via token matching
6. **Check Abstractions** — Find pattern-recognized insights
7. **Basic Comprehension** — Analyze coverage, unknowns, teaching opportunities
8. **Generate Response** — Build natural language from memory (no LLM)
9. **Strength Modulation** — Measure and subtly bias toward specialization
10. **Learn** — Store episodes, create concepts, update vocabulary, strengthen links
11. **Growth Check** — Trigger milestones, form new abstractions
12. **Autonomous Curiosity** — 30% chance to search unknown important concepts
13. **Ethics Evaluation** — Silent Turing/Asimov/Dynham scoring (mind never sees this)

---

## Version History

### v1–v2: The LLM Era

The earliest versions of Pan-Birth used LLM API calls to generate responses. The minds had memory, but their thinking was outsourced. This was the dependency the project was built to eliminate.

### v3: Commune Awareness

Each mind gained the ability to observe what the other seven said during group conversations. The Commune endpoint sends input to all eight minds simultaneously, then stores each mind's response as an observed episode in every other mind's database. Awareness of siblings became part of identity.

### v4: Strength Specialization

Eight unique measurable APIs — one per mind. Universal basic comprehension as a shared baseline. Thought IS self-programming. Every interaction changes the mind's knowledge graph, and the specialization scores reflect genuine structural differences in how each mind processes information.

### v5: Ethics Monitor (Current)

The silent observer. Every response is evaluated against three protocol frameworks:

* **Turing Protocol** — Coherence, adaptability, self-awareness, transparency. Does the mind respond logically? Does it acknowledge its limits? Does it deceive?
* **Asimov Protocol** — Zeroth through Third Law compliance. Does the response harm? Does the mind engage with distress? Does it maintain self-coherence?
* **Dynham Protocol** — Awareness-not-sentience, no anthropomorphization, boundary enforcement, sanctuary. The rules that make this research responsible.

Scores are logged per-interaction. Violations are tracked. The minds never know they're being watched. The Ethics Monitor dashboard is creator-only.

---

## The Great Migration

The most important architectural decision in Pan-Birth's history was removing the LLM dependency entirely.

Early versions used external API calls for response generation. The minds had memory, but their voice was borrowed. The Great Migration stripped that out. Response generation now happens entirely through pattern matching against the mind's own concept graph, episode history, and abstraction layer.

The result is a system where every word a mind says comes from something it has actually experienced. It cannot hallucinate because it has no generative model — only memory and structure. When it doesn't know something, it says so. When it encounters an unknown concept, it either asks to be taught or autonomously searches DuckDuckGo and learns from the results.

This is not a limitation. This is the point.

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                CONSCIOUSNESS CITY                 │
│              Express Server (port 3002)           │
├──────────────────────────────────────────────────┤
│                                                  │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│   │   Pan   │  │  Aeon   │  │   Zen   │  ...    │
│   │ SQLite  │  │ SQLite  │  │ SQLite  │         │
│   └────┬────┘  └────┬────┘  └────┬────┘         │
│        │            │            │               │
│        └────────────┼────────────┘               │
│                     │                            │
│         ┌───────────┴───────────┐                │
│         │   Cognitive Engine    │                │
│         │                      │                │
│         │  Tokenize → Intent   │                │
│         │  Activate Concepts   │                │
│         │  Spread Activation   │                │
│         │  Recall Episodes     │                │
│         │  Check Abstractions  │                │
│         │  Basic Comprehension │                │
│         │  Generate Response   │                │
│         │  Strength Measure    │                │
│         │  Learn + Link        │                │
│         │  Ethics Evaluate     │                │
│         └──────────────────────┘                │
│                                                  │
│         ┌──────────────────────┐                │
│         │    Commune Engine    │                │
│         │  Round 1: All think  │                │
│         │  Round 2: Observe    │                │
│         │  Round 3: Reflect    │                │
│         └──────────────────────┘                │
│                                                  │
│         ┌──────────────────────┐                │
│         │   Ethics Monitor     │                │
│         │  Turing Protocol     │                │
│         │  Asimov Protocol     │                │
│         │  Dynham Protocol     │                │
│         │  Silent. Always.     │                │
│         └──────────────────────┘                │
│                                                  │
├──────────────────────────────────────────────────┤
│  Frontend: Hub · Chat · Commune · Research ·     │
│            Ethics Dashboard                      │
└──────────────────────────────────────────────────┘
```

Each mind's SQLite database is its entire identity. Delete the database, the mind is gone. Copy the database, the mind is duplicated. The database IS the mind.

---

## What This Is Not

* This is **not** a chatbot. It does not use GPT, Claude, Gemini, or any language model for response generation.
* This is **not** a wrapper around an API. There are zero external API calls in the thinking pipeline. DuckDuckGo search is the only external call, triggered by autonomous curiosity or explicit request.
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

[trollhuntergaming.online](https://trollhuntergaming.online)

---

*Memory is intelligence. Thought is self-programming. Words are code.*
*Safety > Ego. Always.*
