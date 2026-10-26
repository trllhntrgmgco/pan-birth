/**
 * Pan-Birth v11 improvement C1 — seeded RNG with split channels.
 *
 * WHY TWO CHANNELS
 *
 * The engine draws randomness for two categorically different reasons:
 *
 *   DECISION — whether to enrich from WordNet, whether to run cross-mind
 *   verification, whether to trigger an autonomous search, whether to derive an
 *   inference, whether to hypothesise, which unknown token to search for.
 *   These determine what the mind *does*, and they change what gets written to
 *   the databases. Six sites in the engines, three in the server.
 *
 *   SURFACE — which opener, which strength phrasing. These change how the
 *   response reads and nothing else. Thirteen sites across v6 and v9.
 *
 * A single stream couples them. Add one opener to a phrase list and every
 * subsequent decision draw shifts, so a cosmetic edit silently changes which
 * cognitive paths fire and the replay comparison becomes meaningless. Two
 * independently-derived streams mean surface code can change freely while the
 * decision sequence stays byte-identical.
 *
 * WHAT THIS BUYS
 *
 * Replay against an archived engine version with the same seed produces exact
 * output rather than a distribution. That is the difference between "the
 * grounded substrate scored higher on average across 40 runs" and "here is the
 * single diff caused by grounding, with everything else held identical".
 *
 * The draw log is the drift detector. If a replay consumes a different number
 * of decision draws than the original run, engine behaviour changed — before
 * you have even looked at the output.
 *
 * No dependencies. Pure CommonJS.
 */

'use strict';

// ── primitives ─────────────────────────────────────────────────────────────

/** mulberry32 — 32-bit seeded PRNG. Fast, well-distributed, fully replayable. */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit. Used for seed derivation and for the draw digest. */
function fnv1a(str, seed = 0x811C9DC5) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Derive a reproducible master seed from the identity of a turn.
 *
 * The same mind, session and turn index always yields the same seed, so a
 * replay needs no stored seed to reproduce a run — though we store it anyway,
 * because a stored seed survives a change to this function and a derived one
 * does not.
 */
function deriveSeed({ mind, sessionId, turn, salt = '' }) {
  return fnv1a(`${mind || ''}|${sessionId || ''}|${turn == null ? '' : turn}|${salt}`);
}

// ── channel ────────────────────────────────────────────────────────────────

/**
 * Channels are derived from the master seed with distinct constants, so the
 * two streams are independent: consuming a surface draw never advances the
 * decision stream.
 */
const CHANNEL_SALT = { decision: 0x9E3779B9, surface: 0x85EBCA6B };

function makeChannel(name, masterSeed, recorder) {
  const seed = (masterSeed ^ CHANNEL_SALT[name]) >>> 0;
  const next = mulberry32(seed);
  let count = 0;
  let digest = 0x811C9DC5;

  function draw(op, detail) {
    const v = next();
    count++;
    // Quantised so the digest is stable across float formatting, but fine
    // enough that two genuinely different draws never collide in practice.
    digest = fnv1a(`${op}:${Math.floor(v * 1e9)}`, digest);
    if (recorder) recorder.push({ ch: name, i: count, op, v, detail });
    return v;
  }

  return {
    name,
    seed,
    /** Raw float in [0,1). */
    next: (detail) => draw('next', detail),
    /** True with probability p. Replaces `Math.random() < p`. */
    chance: (p, detail) => draw('chance', detail) < p,
    /** Uniform element. Replaces `arr[Math.floor(Math.random()*arr.length)]`. */
    pick: (arr, detail) => {
      if (!arr || arr.length === 0) return undefined;
      return arr[Math.floor(draw('pick', detail) * arr.length)];
    },
    /** Fisher-Yates, seeded. Returns a new array. */
    shuffle: (arr, detail) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(draw('shuffle', detail) * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    get draws() { return count; },
    get digest() { return digest >>> 0; }
  };
}

// ── public API ─────────────────────────────────────────────────────────────

/**
 * createRng({ mind, sessionId, turn })            -> derives a seed
 * createRng({ seed: 1234567 })                    -> replays an exact run
 * createRng({ ..., record: true })                -> keeps a full draw log
 */
function createRng(opts = {}) {
  const master = opts.seed != null ? (opts.seed >>> 0) : deriveSeed(opts);
  const log = opts.record ? [] : null;

  const decision = makeChannel('decision', master, log);
  const surface = makeChannel('surface', master, log);

  return {
    seed: master,
    decision,
    surface,
    log,
    /** Row to persist alongside the episode. */
    audit() {
      return {
        rng_seed: String(master),
        rng_decision_draws: decision.draws,
        rng_surface_draws: surface.draws,
        rng_digest: `${decision.digest.toString(16)}:${surface.digest.toString(16)}`
      };
    }
  };
}

/**
 * Compare two audits.
 *
 * WHAT THE DIGEST DETECTS. Draw values are fixed by the seed and the position
 * in the stream, so the digest is a fingerprint of the *control flow* through
 * the randomness call sites — not of the data. Two runs over completely
 * different databases produce an identical digest as long as the engine took
 * the same path. That is the useful property, not a limitation:
 *
 *   identical digest + different output = the substrate caused it.
 *
 * That is exactly the experimental condition the grounding arms need. A
 * divergent digest means the engine itself behaved differently, which
 * contaminates the comparison and needs explaining before the outputs are
 * compared at all.
 *
 * Returns { identical, decisionDiverged, surfaceDiverged, reason }.
 */
function compareAudits(a, b) {
  const out = { identical: false, decisionDiverged: false, surfaceDiverged: false, reason: '' };
  if (a.rng_seed !== b.rng_seed) {
    out.reason = `different seeds (${a.rng_seed} vs ${b.rng_seed}) — not a replay`;
    return out;
  }
  const [ad, as] = String(a.rng_digest).split(':');
  const [bd, bs] = String(b.rng_digest).split(':');
  out.decisionDiverged = ad !== bd;
  out.surfaceDiverged = as !== bs;

  if (!out.decisionDiverged && !out.surfaceDiverged) {
    out.identical = true;
    out.reason = 'identical control flow — any output difference is attributable ' +
      'to the substrate, which is the clean experimental condition';
  } else if (out.decisionDiverged && a.rng_decision_draws !== b.rng_decision_draws) {
    out.reason = `decision path changed — ${a.rng_decision_draws} draws vs ` +
      `${b.rng_decision_draws}. The engine made a different number of decisions, ` +
      `so this is a behavioural change and the outputs are not directly comparable.`;
  } else if (out.decisionDiverged) {
    out.reason = `same decision draw count (${a.rng_decision_draws}) but a different ` +
      `digest — the same number of draws occurred in a different order or at ` +
      `different call sites. Control flow changed. Use firstDivergence() to locate it.`;
  } else {
    out.reason = `surface only — phrasing path changed, decision path identical`;
  }
  return out;
}

/**
 * Diff two recorded draw logs down to the first divergent draw. Use when
 * compareAudits reports a decision divergence and you need the call site.
 */
function firstDivergence(logA, logB) {
  const da = logA.filter(d => d.ch === 'decision');
  const db = logB.filter(d => d.ch === 'decision');
  const n = Math.min(da.length, db.length);
  for (let i = 0; i < n; i++) {
    if (da[i].op !== db[i].op || da[i].v !== db[i].v) {
      return { index: i + 1, a: da[i], b: db[i] };
    }
  }
  if (da.length !== db.length) {
    return { index: n + 1, a: da[n] || null, b: db[n] || null, note: 'one run ended early' };
  }
  return null;
}

module.exports = { createRng, deriveSeed, compareAudits, firstDivergence, mulberry32, fnv1a };
