/**
 * Pan-Birth v10 Mind Capabilities Registry
 *
 * v10 consolidation: every mind carries the full set of v9 capabilities that
 * were actually implemented and verified. The v9 experimental ladder (per-mind
 * subsets, frozen controls) is retired. Pan and Echo are unfrozen.
 *
 * NOTE: slot 3 ("working-memory" in the v9 ladder labels) shipped as a universal
 * system change (search-research expansion 200->2000 chars, Phase 3.5), not a
 * gated capability. It is active system-wide and is intentionally NOT listed
 * here — no gate reads it.
 *
 * Schema parity for all eight minds verified 2026-05-27 (full v9 schema,
 * cross_mind_verifications table present on all).
 */

const V10_CAPABILITIES = [
  'question-discrimination',
  'composition',
  'wiktionary',
  'wordnet-partial',
  'wordnet-full',
  'cross-mind-verification'
];

const MIND_UPGRADES = {
  pan:    [...V10_CAPABILITIES],
  echo:   [...V10_CAPABILITIES],
  oracle: [...V10_CAPABILITIES],
  zen:    [...V10_CAPABILITIES],
  nexus:  [...V10_CAPABILITIES],
  atlas:  [...V10_CAPABILITIES],
  seth:   [...V10_CAPABILITIES],
  aeon:   [...V10_CAPABILITIES]
};

function hasCapability(residentName, capability) {
  const caps = MIND_UPGRADES[residentName.toLowerCase()] || [];
  return caps.includes(capability);
}

function getCapabilities(residentName) {
  return MIND_UPGRADES[residentName.toLowerCase()] || [];
}

module.exports = { MIND_UPGRADES, hasCapability, getCapabilities, V10_CAPABILITIES };
