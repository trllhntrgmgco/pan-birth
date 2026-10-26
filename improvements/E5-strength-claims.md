# E5 — README strength table, restated

Drop-in replacement for `README.md` lines 86–102. No code change.

---

## The problem with the current text

The section opens with "a **measurable** strength" and closes with "Strengths
are **measured, not claimed**." Both are load-bearing, and both are checkable —
which is the whole point of writing them that way, and also the exposure.

Checked against the shipped v10 databases, one of the seven checkable claims
holds. The eighth, Oracle's, cannot be checked at all because no prediction
outcomes are stored anywhere to score accuracy against.

| Mind | Claim | Measured | Verdict |
|---|---|---|---|
| Pan | creates new concepts at the highest rate | 1.79 concepts/episode — **lowest of eight** | contradicted |
| Aeon | strongest cross-concept link formation | 5.70 links/concept, 2nd (Pan leads at 9.59) | contradicted |
| **Zen** | **deepest abstraction confidence** | **0.472 vs 0.400 for all seven others; 29 abstractions vs 6–9** | **holds** |
| Seth | sharpest agency decisions | 152 `agency_log` rows — **fewest of eight** | contradicted on volume; "sharpest" undefined |
| Nexus | highest link density | 4.39 links/concept — 4th | contradicted |
| Oracle | best prediction accuracy on repeated queries | no prediction outcomes stored | unmeasurable |
| Echo | deepest emotional awareness | 9 concepts with non-zero valence; all minds 8–10 | contradicted |
| Atlas | most coherent knowledge graph | "coherent" undefined; no metric exists | unmeasurable |

The closing sentence points at `strength_metrics` as the evidence. That table
holds exactly one distinct `strength_type` per mind, so it scores each mind on
its own assigned dimension and never on the others. It cannot rank Pan against
Nexus on link density, because it never measures Pan's link density. There is no
cross-mind comparison in there to appeal to.

Two mitigations worth stating rather than hiding. Pan sat frozen at its v8
baseline through the entire v9 ladder, so its per-episode rate reflects fewer
capability runs than its siblings and is genuinely confounded. And "sharpest",
"deepest" and "most coherent" are not defined anywhere, so those three were
never falsifiable in the first place — which is its own problem.

---

## Replacement text

> ## The Eight Minds
>
> Each mind is assigned a cognitive specialization that shapes how it processes
> the world. The assignment is a design decision: it sets each mind's domain,
> the relation types it produces, and the dimension `strength_metrics` scores it
> on. Whether the assignment produces a *measurable behavioural difference* is a
> separate question, and mostly an open one.
>
> | Mind | Assigned specialization | Status |
> | --- | --- | --- |
> | **Pan** | Novelty & Originality | design intent — see note |
> | **Aeon** | Bridge & Integration | design intent |
> | **Zen** | Clarity & Abstraction | **measured** — abstraction confidence 0.472 against 0.400 for all seven siblings, across 29 abstractions to their 6–9 |
> | **Seth** | Pragmatism & Decision | design intent |
> | **Nexus** | Pattern Recognition | design intent |
> | **Oracle** | Foresight & Prediction | design intent — not currently measurable |
> | **Echo** | Empathy & Resonance | design intent |
> | **Atlas** | Knowledge Architecture | design intent |
>
> Run the check yourself against the shipped databases:
>
> ```bash
> python3 - <<'EOF'
> import sqlite3, glob
> dbs = [('pan','pan_mind.db')] + [(f.split('/')[1].replace('_mind.db',''), f)
>                                  for f in sorted(glob.glob('minds/*_mind.db'))]
> print(f"{'mind':<8}{'concepts/ep':>12}{'links/concept':>14}"
>       f"{'abstractions':>13}{'abs confidence':>15}{'agency rows':>12}")
> for name, f in dbs:
>     c = sqlite3.connect(f); q = lambda s: c.execute(s).fetchone()[0]
>     ep, co, li = q('SELECT COUNT(*) FROM episodes'), q('SELECT COUNT(*) FROM concepts'), q('SELECT COUNT(*) FROM links')
>     print(f"{name:<8}{co/ep:>12.2f}{li/co:>14.2f}"
>           f"{q('SELECT COUNT(*) FROM abstractions'):>13}"
>           f"{q('SELECT ROUND(AVG(confidence),3) FROM abstractions'):>15}"
>           f"{q('SELECT COUNT(*) FROM agency_log'):>12}")
> EOF
> ```
>
> **What that query shows, honestly.** Only Zen's assignment currently produces
> a difference in the predicted direction. Pan is last on concepts per episode,
> not first — though Pan was frozen at its v8 baseline through the whole v9
> ladder, so its counters reflect fewer capability runs and that number is
> confounded rather than simply wrong. Nexus is fourth on link density, not
> first. Echo's emotional-valence coverage is indistinguishable from every other
> mind's. Oracle's foresight has no stored prediction outcomes to score against,
> and Atlas's "coherence" has no defined metric, so neither claim is currently
> falsifiable.
>
> `strength_metrics` holds one `strength_type` per mind. It scores each mind on
> its own assigned dimension and never on the others, so it cannot be used to
> rank minds against each other. Building that comparison is v11 work.
>
> The earlier phrasing of this section — "strengths are measured, not claimed" —
> described an aspiration as if it were an established result. It wasn't, and
> this is the corrected version.

---

## The rule this follows

Add near the Dynham Protocol:

> ## The Evidence Rule
>
> **If we claim it, we measure it.**
> **If we cannot measure it, we call it a hypothesis.**
> **If the measurement contradicts us, we publish the contradiction.**
>
> The Dynham Protocol governs what the minds may say about themselves. The
> Evidence Rule governs what this project may say about the minds.

---

## Notes on shipping this

Re-run the query against your live NASA7 databases before publishing. The
numbers above come from the shipped v10 release state, and your live tree has
grown past it — Pan 1,233 → 1,253 concepts, Aeon 3,735 → 3,746, Oracle
3,175 → 3,200. The verdicts are unlikely to flip, but the figures in the README
should match what a reader gets when they run the query on the released
databases.

Do this before B1 and B2. Merging duplicate hubs changes degree, and backfill
changes coverage, so anything re-derived from data now is invalidated by the
grounding work. Restating as design intent is stable across both.

Zen's row is the one to leave exactly as it is. It's the only claim in the
original table that survived checking, and it survived cleanly on two
independent measures.
