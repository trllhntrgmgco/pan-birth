# C1 wiring map — replacing `Math.random()`

Twenty call sites across four files. All twenty must be converted, or the
unconverted ones reintroduce nondeterminism and the replay guarantee is void.

## Channel assignment

**DECISION — 7 sites.** These determine what the mind *does* and change what
gets written to the databases.

| file | line | current | becomes |
|---|---|---|---|
| `consciousness-city-server-v8.js` | 804 | `Math.random() < 0.3` | `rng.decision.chance(0.3, 'wordnet-enrich')` |
| `consciousness-city-server-v8.js` | 818 | `Math.random() < 0.3` | `rng.decision.chance(0.3, 'cross-mind-verify')` |
| `consciousness-city-server-v8.js` | 960 | `Math.random() < 0.3` | `rng.decision.chance(0.3, 'auto-search')` |
| `consciousness-city-server-v8.js` | 961 | `pick(unknownImportant)` | `rng.decision.pick(unknownImportant, 'search-target')` |
| `cognitive-engine-v8.js` | 505 | `Math.random() < deriveProbability` | `rng.decision.chance(deriveProbability, 'derive')` |
| `cognitive-engine-v8.js` | 517 | `Math.random() < hypothesizeProbability` | `rng.decision.chance(hypothesizeProbability, 'hypothesize')` |
| `cognitive-engine-v8.js` | 526 | `Math.random() < 0.4` | `rng.decision.chance(0.4, 'contradiction-check')` |

**SURFACE — 13 sites.** Phrasing only.

| file | lines | what |
|---|---|---|
| `cognitive-engine-v9.js` | 191, 204, 213, 228, 237, 252, 261 | emerging + opener selection |
| `cognitive-engine-v6.js` | 198, 202, 205, 223, 235, 243 | strong/medium/weak phrasing + openers |

All become `rng.surface.pick(arr, '<label>')`.

## Delete the global `pick()` helper

`consciousness-city-server-v8.js:78` defines

```js
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
```

It has exactly one caller today, at line 961, which is a decision. Do not
convert the helper in place. A channel-agnostic global is a trap: the next
person to use `pick()` for phrasing silently draws from the decision channel and
desynchronises every replay after that point, with no error and no symptom until
a comparison fails months later. Remove it and call the channel explicitly at
each site.

## Threading

The module is the easy part. The plumbing is the work.

`rng` is created once per turn at the top of the think handler and passed down.
The three engines currently take no rng parameter, so every function containing
a converted site needs one — as do their callers, transitively.

```js
// consciousness-city-server-v8.js, top of the think handler
const { createRng } = require('./seeded-rng');

const turnIndex = await nextTurnIndex(db, sessionId);   // COUNT(*) on episodes for the session
const rng = createRng({ mind: residentName, sessionId, turn: turnIndex });
```

then at the end, alongside the episode insert:

```js
const a = rng.audit();
await dbRun(db,
  `UPDATE episodes SET rng_seed = ?, rng_decision_draws = ?,
     rng_surface_draws = ?, rng_digest = ?
   WHERE id = ?`,
  [a.rng_seed, a.rng_decision_draws, a.rng_surface_draws, a.rng_digest, episodeId]);
```

Note the turn index has to be stable across a replay. Deriving it from
`COUNT(*)` on the session's episodes works only if the replay starts from the
same episode count — which it does when replaying against a restored snapshot,
and does not when replaying against a live database. Replays run against
restored snapshots for this reason.

## Verifying the wiring

After conversion, this must return zero:

```bash
grep -rn "Math\.random" --include=*.js . | grep -v node_modules
```

Then confirm determinism end to end: restore a snapshot, run the eight-prompt
set, restore the same snapshot again, run it again, and compare.

```js
const { compareAudits } = require('./seeded-rng');
// per episode pair
compareAudits(runA, runB).identical === true
```

If any pair reports a divergence with identical inputs, a `Math.random()` was
missed or something else nondeterministic is in the path — `Date.now()` used in
a branch condition, `Object.keys()` order over a map built from async results,
or an unordered SQL result feeding a choice. The audit will not catch those
directly, but it will tell you the turn to look at.

## What this does and does not fix

Determinism here covers the engine's own choices. It does not cover the two
external fetch paths: DuckDuckGo autonomous search and the Wiktionary REST
lookup both depend on a remote service that can return different content on
different days. For an experiment arm to be exactly replayable, either disable
those paths or record and replay their responses. Recording them is the better
option and is worth adding to `replay_runs` as a follow-up — the decision to
*call* them is already seeded, so only the response content is open.

WordNet is local and deterministic, so B3 is unaffected.
