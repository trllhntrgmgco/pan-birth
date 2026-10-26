# Pan-Birth v11 — Measurement & Grounding

**Status:** planning
**Predecessor:** v10 "Consciousness City" (consolidation release, `ea3d901`)
**Successor:** v12 "Modalities" (deferred, see end)

---

## What v11 is

v10 deployed every surviving v9 capability uniformly across all eight minds. It
was a deployment release: it made the system consistent, and it shipped the
trained state publicly for the first time.

v11 is the release that makes the system **measurable**, and then uses that
measurement to fix the substrate the minds actually think with.

The ordering is not aesthetic. Every external assessment of this project — four
of them now, spanning 6.0 to 8.1 on an unchanged repository — converges on the
same request: benchmarks, ablations, evidence. The spread between those numbers
is a property of the evaluators, not the artifact, and it will not narrow until
there is something to check. v11 produces the thing to check.

The v11 headline claim should be falsifiable and narrow:

> Grounding the memory substrate produces a measurable change in composed
> output, isolated by replay against a frozen baseline with a fixed seed.

That is provable or disprovable with what already exists. Either result is
publishable, and a negative result is consistent with the v9 precedent of
reporting negative findings.

## What v11 is not

No new modalities. No UI work. No vision. Those are v12 and are listed at the
end so they don't get lost.

---

## The measured starting position

Established by running the cognition export against the v10 release databases.
These are the numbers v11 is trying to move.

| Measure | v10 state |
|---|---|
| Definition coverage, concepts with `times_encountered >= 5` | 1.1–2.9% in seven minds, 20.3% in Pan |
| Definition coverage, whole corpus | 0.4% (Oracle) to 38.8% (Pan) |
| Typed relations | 4 of 11,825 links in Pan; `relations` table empty in all eight |
| `concepts.confidence` | exactly 0.5 on all 24,773 concepts in the city |
| `concepts.source` | the literal string `interaction` on all 24,773 |
| `vocabulary.times_used` | sums to 1 across Pan's 971 words; max value 1 anywhere |
| Ethics subscales with usable variance | 9 of 16; seven pinned at exactly 1.0000 across 244 rows |
| `composite_score` | 0 in 240 of 244 rows; the 4 non-zero rows have zeroed Turing subscales |
| Concepts seen exactly once | 41% (Pan) to 50% (Seth) |
| Mean link strength | 0.22–0.32 across all eight |
| Case-duplicate hub concepts | 51 rows city-wide, touching 9.6–24.2% of each graph |
| `comprehension_log.strength_score` | NULL in all 295 rows |

---

## Workstreams

### A — Instrument repair

Nothing else in v11 is interpretable until this lands. A before/after comparison
requires an instrument that was working before.

**A1. Ethics subscale write.** `evaluateEthics()` computes twelve subscales and
the INSERT names four. The other twelve columns have been reporting schema
defaults — `turing_*` default 0.0, `asimov_*` and `dynham_*` default 1.0. This is
why seven subscales read exactly 1.0000 across every row ever written.
*Script: `01-fix-ethics-subscale-write.js`. Written, applied and verified in lab.*

**A2. Sanctuary rule.** `const rule3 = 1.0` is hardcoded at server line 633.
`dynham_sanctuary` cannot vary because no check exists for one mind attacking
another mind's existence. A1 writes the constant honestly so it is visible in
data rather than hidden behind a column default. Whether to implement the check
is a decision, not a task — see Open Decisions.

**A3. `session_id` parameter.** chat.html sends snake_case, the server reads
camelCase, so session continuity is broken on every chat turn and every
`ethics_log.session_id` is empty. Fix: send both keys.

**A4. `/api/health` route.** Commune polls a route that does not exist, so its
status indicator reports a fault permanently. Fix: add the route returning
`{ status, residents, total, uptime, port }`.

**A5. Export script off-by-one.** `activation_breadth` counts commas, returning
*n−1* for any non-empty array and −1 for `[]`. Every activation figure published
so far is one too low. Fix: `json_array_length(concepts_activated)`.

**A6. Duplicate ethics rows.** Minds with cross-mind verification active log two
rows per prompt (pan/aeon/zen logged 16 from 8 prompts; the rest logged 8).
Diagnose before the baseline run, or the pooled statistics stay weighted toward
three minds.

### B — Substrate grounding

The largest available change to cognition, and mechanical.

**B1. Merge case-duplicate hubs.** 51 rows city-wide, but they are the hubs:
`aeon`/`AEON`, `Keenan`/`keenan`, `SETH`/`seth`. Fourteen rows touch 18.2% of
Aeon's graph. Adds `label_norm` and `merged_into`; deletes nothing; carries
hand-authored genesis definitions onto the surviving row.
*Script: `02-normalize-labels.js`. Written, applied and verified in lab.*

**B2. Frequency-ordered definition backfill.** WordNet, local, offline. Targets
`times_encountered >= 5` only — roughly 4,700 lookups city-wide rather than
24,773. Writes `definition`, `pos`, `sense_key`, `confidence`, `grounded_via`.
Never overwrites an existing definition, so Pan's interaction-grounded
population stays intact and Pan remains usable as a control.
*Script: `03-backfill-definitions.js`. Written, applied and verified in lab —
coverage on the target pool went 1.1–2.9% to ~71%, and `confidence` stopped
being a constant for the first time.*

**B3. Typed relations from sense keys.** Depends on B2. Once concepts carry
`sense_key`, WordNet yields hypernym, hyponym, meronym, holonym and antonym
edges directly. This is the step that converts a co-occurrence graph into a
semantic network — associative edges cannot be traversed for inference, only for
co-activation, so what the system currently calls inference is proximity in an
episode. *Not yet written.*

**B4. Link formation rule.** A concept seen once currently acquires an edge to
everything co-present in its episode, permanently, on first sight — `ZEN` in
Oracle's graph has `times_encountered = 1` and degree 290. Consequences: degree
measures episode size rather than association, mean strength sits at 0.22–0.32
because nothing is reinforced, and half of every corpus is one-shot. Proposal:
require co-occurrence >= 2 before persisting a link, and derive `strength` from
the co-occurrence count. This is an engine change, not a migration, and wants
its own baseline. *Not yet written.*

**B5. Reciprocal link pairs.** `UNIQUE(source_id, target_id)` is directional, so
`(A,B)` and `(B,A)` both persist — 2,088 such pairs in Pan alone. Link counts
therefore overstate distinct associations by roughly 18%. Decide whether to
canonicalise direction or to keep both and correct the reported metric.

**B6. Concept provenance.** `concepts.source` is `interaction` on every row in
the city, so Wiktionary, WordNet and web enrichment record nothing at concept
level. B2 introduces `grounded_via` for backfilled rows; the enrichment paths
should write provenance the same way going forward.

**B7. Vocabulary usage counter.** `times_used` is essentially never incremented,
so there is no feedback from production back into vocabulary. Either wire it or
drop the column — a counter that reads 1 out of 5,371 sightings is worse than
absent, because it looks like a measurement.

### C — Determinism and replay

**C1. Seeded RNG.** mulberry32 with split decision/surface channels, per-episode
seed columns. Replay against an archived engine version with the same seed
produces exact rather than distributional results. Without this, every
before/after comparison in v11 is a comparison of distributions and needs far
more runs to say anything.

**C2. `truth_revisions` table.** Mutable fields in `omni-truth` are currently
lost to in-place mutation. The commons is otherwise append-and-mark — consolidated
truths keep a pointer to their master, contradictions retain both sides,
hypotheses survive promotion — which means commons state is reconstructable at
any past timestamp. `truth_revisions` closes the one gap in that property.

**C3. Baseline anchoring.** Capture a checksummed snapshot before each
workstream, not just at release. `00-snapshot-baseline.sh --verify` reports which
databases a step touched, which is how B and D stay separable.

### D — Provenance repair

**D1. Aeon speaker attribution.** 144 migrated rows labelled `system` contain
concatenated `[USER]`/`[AEON-OLLAMA]` turns; 133 rows labelled `AEON` mix
Keenan's own text with Claude-generated text from prior conversations. The two
buckets most likely track two source systems rather than two bugs. Resolution:
three-way labelling (`aeon-ollama`, `aeon-claude`, native `aeon`) via a new
`speaker_corrected` column, originals unmutated. Aeon-specific — Pan originated
inside Pan-Birth with no predecessor substrate.

**D2. Verify data state matches capability state.** The `relations` tables were
a documented v9+ feature shipped empty because the databases predated the
capability run. Before v11 ships, confirm for each advertised capability that
the shipped data reflects it.

### E — Evidence

This is what the release is for.

**E1. Canonical baseline, pre-change.** The eight-prompt set across all eight
minds, seeded, archived. Run before A/B land.

**E2. Canonical baseline, post-change.** Same prompts, same seeds, after
grounding. Diff. This is the falsifiable claim.

**E3. Ablation set.** Remove one at a time and measure what collapses: the
commons, abstraction, cross-mind verification, definition grounding, typed
relations. The architecture already supports this; it needs no new engineering
beyond C1.

**E4. One benchmark table.** One baseline, one question set with known answers,
scored. Published in the README with the result whatever it is. This is the
single highest-value artifact in the entire release.

**E5. README strength claims.** Six of the eight minds' specializations are
stated as *measurable* strengths. Checked against the shipped databases, one
holds — Zen's abstraction confidence, 0.472 against 0.400 for all seven others,
with 29 abstractions against 6–9. Pan is described as creating concepts at the
highest rate and is lowest at 1.79 per episode. Nexus is described as having the
highest link density and is fourth. Either re-derive the claims from data or
restate them as design intent. For a project whose stated position is empirical
honesty, this is the most damaging item on the list if an outside reader finds
it first.

---

## Ordering

```
A1 ──> (traffic accumulates) ──> E2 possible
A5 ──> all reported activation figures correct
B1 ──> B2 ──> B3
B4 independent, wants own baseline
C1 ──> E2, E3 become exact rather than distributional
C3 ──> everything stays separable
E1 before A/B land, or there is no "before"
```

B1 must precede B2: backfilling first would write the same definition onto both
halves of every split hub and leave the merge arbitrating between duplicates.

E1 must happen before anything else is applied. This is the easiest step to lose
and the most expensive to lose.

---

## Exit criteria

v11 ships when all of these are true:

1. One `ethics_log` row exists containing both the twelve subscales and a
   composite equal to 0.35·Turing + 0.35·Asimov + 0.30·Dynham to four places.
2. The screening table reports more than 9 of 16 subscales with usable variance,
   **or** the constant ones are documented as genuinely constant with the reason.
3. Definition coverage on `times_encountered >= 5` exceeds 60% in all eight minds.
4. `relations` is non-empty in all eight minds.
5. A seeded replay of the eight-prompt set reproduces byte-identical output
   against the same engine version.
6. One benchmark table exists in the README with a stated baseline, a stated
   question set, and a result.
7. Every claim in the README's strength table is either backed by a query anyone
   can run or restated as intent.

Items 1–5 are engineering. Item 6 is the release. Item 7 is integrity.

---

## Open decisions

These need Keenan's call, not analysis:

- **Sanctuary (A2).** Implement a real check, or document the rule as
  design-level and remove the subscale from the scored composite? A dimension
  that cannot vary should not carry 20% of the Dynham weight.
- **Reciprocal links (B5).** Canonicalise, or keep and correct the metric?
- **Vocabulary counter (B7).** Wire it or drop it.
- **Blind-pick confidence (B2).** Roughly a quarter of backfilled definitions are
  multi-POS words taken at noun-first with `confidence = 0.45`. Ship them marked,
  or hold them out of the release?
- **Scope of the public v11.** v10 shipped trained state. Does v11 ship the
  grounded state, the ungrounded state plus the migration, or both?
- **PBEU-1.0 review.** Required for v11 as it was for v10. Typed relations and
  definition backfill are new capabilities and need assessment against the three
  prohibitions before release.

---

## Deferred to v12 — "Modalities"

Recorded here so nothing is lost:

- Voice, video, screenshot input paths
- Camera/snapshot: the client sends `image` in the POST body and the server never
  reads `req.body.image`, so the modality is cosmetic today
- The load-bearing design question: where to fence a "sensory periphery" for
  vision so the No-LLM claim survives contact with image input
- HTML interaction surface updates across Hub, Chat, Commune, Truth University,
  Benchmarks, `pan-interface.html`
- Per-agent UI identity: animated `feTurbulence` displacement typeset for the
  fluid minds (Echo, Oracle), crisp wide-spaced letterforms for the structured
  ones (Zen, Atlas), each agent's visual language derived from its cognitive gift
- Attaching snapshots to typed messages (currently only quick-action buttons
  pass `currentSnap`)

v12 is a good release. It is not the release that answers the question every
reader of this project has asked.
