/**
 * Pan-Birth v9 Cognitive Engine
 * 
 * Slot 1: Question Discrimination (deployed 2026-05-07)
 * Slot 2: Composition (deployed 2026-05-09)
 *
 * Slot 1 extends V6 by adding three new factual question intent categories
 * (definition, causal, procedural-factual) that subdivide V6's generic
 * 'question' fallback. Wraps V6 — runs V6 classifier first, only intervenes
 * when V6 returns 'question'.
 *
 * Slot 2 adds composing variants of each handler that use typed composition
 * primitives (parallel to V6's primitives, not modifying them). Composing
 * variants are dispatched based on the 'composition' capability check.
 * Echo (frozen at slot 1) routes to original shallow handlers; Oracle
 * through Aeon route to composing variants.
 *
 * Spec: archive/v9-design/phase-3-cognitive-layer-spec.md
 */

const cognitiveV6 = require('./cognitive-engine-v6');
const capabilities = require('./mind-capabilities');

// ============================================================================
// INTENT CLASSIFICATION (V9 extension of V6) — UNCHANGED FROM SLOT 1
// ============================================================================

function detectIntentV9(text) {
  const baseIntent = cognitiveV6.detectIntentV6(text);
  
  // V6 already classified specifically — return as-is
  if (baseIntent !== 'question') return baseIntent;
  
  const lower = text.toLowerCase().trim();
  
  // Definition (what is X / define X / what does X mean)
  // Excludes self-referential — V6 already caught "what are you", "your strength"
  if (/^what\s+(is|are)\s+(a\s+|an\s+|the\s+)?[a-z]/.test(lower) && !lower.includes('your ')) {
    return 'definition';
  }
  if (/^(what\s+does|what\s+do)\s+.+\s+(mean|stand\s+for)/.test(lower)) {
    return 'definition';
  }
  if (/^define\s+/.test(lower)) {
    return 'definition';
  }
  
  // Causal (why X / what causes X / reason for X)
  if (/^why\s+/.test(lower)) {
    return 'causal';
  }
  if (/^what\s+causes\s+/.test(lower)) {
    return 'causal';
  }
  if (/^what\s+is\s+the\s+reason/.test(lower)) {
    return 'causal';
  }
  
  // Procedural-factual (how does X work / how is X done)
  // Excludes self-referential — V6 already caught "how do you think/work"
  if (/^how\s+does\s+(?!you\b)[a-z]/.test(lower)) {
    return 'procedural-factual';
  }
  if (/^how\s+is\s+/.test(lower) && !lower.includes('you ')) {
    return 'procedural-factual';
  }
  
  // No new pattern matched — fall through to V6's question intent
  return 'question';
}

// ============================================================================
// RESPONSE GENERATION (V9 extension of V6)
// Slot 2: dispatches to composing variants when 'composition' capability present
// ============================================================================

async function generateResponseV9(db, residentName, input, intent, tokens, directConcepts, assocConcepts, episodes, abstractions, dbHelpers) {
  const useComposition = capabilities.hasCapability(residentName, 'composition');
  
  // Dispatch based on intent and capability
  if (intent === 'definition') {
    return useComposition
      ? handleDefinitionComposing(db, residentName, input, directConcepts, assocConcepts, episodes)
      : handleDefinition(db, residentName, input, directConcepts);
  }
  if (intent === 'causal') {
    return useComposition
      ? handleCausalComposing(db, residentName, input, directConcepts, assocConcepts, episodes)
      : handleCausal(db, residentName, input, directConcepts);
  }
  if (intent === 'procedural-factual') {
    return useComposition
      ? handleProceduralFactualComposing(db, residentName, input, directConcepts, assocConcepts, episodes)
      : handleProceduralFactual(db, residentName, input, directConcepts);
  }
  
  // All existing intent types — delegate to V6
  return cognitiveV6.generateResponseV6(db, residentName, input, intent, tokens, directConcepts, assocConcepts, episodes, abstractions, dbHelpers);
}

// ============================================================================
// SLOT 1 HANDLERS (UNCHANGED — used by Echo and any future composition-disabled minds)
// ============================================================================

async function handleDefinition(db, residentName, input, directConcepts) {
  const stopwords = new Set(['what', 'is', 'are', 'the', 'a', 'an', 'does', 'do', 'mean', 'define']);
  const candidates = (directConcepts || []).filter(c => !stopwords.has(c.label.toLowerCase()));
  
  if (candidates.length === 0) {
    return {
      text: `You're asking for a definition, but I don't have a concept identified in that question.`,
      emotion: 'curious'
    };
  }
  
  const target = candidates[0];
  
  if (target.definition && target.definition.trim().length > 0) {
    return {
      text: `${target.label}: ${target.definition}`,
      emotion: 'clarifying'
    };
  }
  
  return {
    text: `I recognize ${target.label} as a concept but I don't have a definition for it yet.`,
    emotion: 'curious'
  };
}

async function handleCausal(db, residentName, input, directConcepts) {
  const stopwords = new Set(['why', 'what', 'is', 'are', 'the', 'causes', 'reason', 'for']);
  const candidates = (directConcepts || []).filter(c => !stopwords.has(c.label.toLowerCase()));
  
  if (candidates.length === 0) {
    return {
      text: `You're asking why something is the case, but I don't have a clear subject in that question.`,
      emotion: 'curious'
    };
  }
  
  const target = candidates[0];
  
  return {
    text: `You're asking about the cause of ${target.label}. I don't have causal relations stored for this yet.`,
    emotion: 'curious'
  };
}

async function handleProceduralFactual(db, residentName, input, directConcepts) {
  const stopwords = new Set(['how', 'does', 'is', 'work', 'works', 'done', 'made']);
  const candidates = (directConcepts || []).filter(c => !stopwords.has(c.label.toLowerCase()));
  
  if (candidates.length === 0) {
    return {
      text: `You're asking how something works, but I don't have a clear subject in that question.`,
      emotion: 'curious'
    };
  }
  
  const target = candidates[0];
  
  if (target.definition && target.definition.toLowerCase().includes('process')) {
    return {
      text: `${target.label}: ${target.definition}`,
      emotion: 'explaining'
    };
  }
  
  return {
    text: `You're asking about the process of ${target.label}. I recognize the concept but don't have procedural details for it.`,
    emotion: 'curious'
  };
}

// ============================================================================
// SLOT 2 TYPED OPENER PRIMITIVES
// Parallel to V6's buildDefinitionStatement — type-aware variants
// ============================================================================

function buildDefinitionOpenerV9(concept, tier) {
  const label = concept.label;
  
  // No definition available — emerging language
  if (!concept.definition || concept.definition.length < 3) {
    const emerging = [
      `${label} — the word holds shape in my memory but the meaning is still forming.`,
      `I have encountered ${label} ${concept.times_encountered || 1} times. Its meaning remains partial.`,
      `${label} sits in my graph as a recognized term whose definition I have not yet anchored.`,
    ];
    return emerging[Math.floor(Math.random() * emerging.length)];
  }
  
  // Definition available, scale formality by tier
  if (tier === 'nascent') {
    return `${label}: ${concept.definition}`;
  }
  
  if (tier === 'young') {
    const openers = [
      `${label} is, as I understand it: ${concept.definition}`,
      `By ${label} I mean: ${concept.definition}`,
    ];
    return openers[Math.floor(Math.random() * openers.length)];
  }
  
  // developing/mature/elder
  const openers = [
    `${label}, in my understanding: ${concept.definition}`,
    `What I know of ${label}: ${concept.definition}`,
    `Through ${concept.times_encountered || 'several'} encounters, I have come to understand ${label} as ${concept.definition.toLowerCase()}`,
  ];
  return openers[Math.floor(Math.random() * openers.length)];
}

function buildCausalOpenerV9(concept, tier) {
  const label = concept.label;
  
  if (tier === 'nascent') {
    return `Why ${label}? I am still learning what causes it.`;
  }
  
  if (tier === 'young') {
    const openers = [
      `On the cause of ${label}, my understanding is partial.`,
      `What gives rise to ${label} is something I am working out.`,
    ];
    return openers[Math.floor(Math.random() * openers.length)];
  }
  
  // developing/mature/elder
  const openers = [
    `On what causes ${label}: from what I have gathered,`,
    `${label} arises, in my understanding,`,
    `Tracing the reason for ${label}, I find that`,
  ];
  return openers[Math.floor(Math.random() * openers.length)];
}

function buildProceduralOpenerV9(concept, tier) {
  const label = concept.label;
  
  if (tier === 'nascent') {
    return `How does ${label} work? I am still building that understanding.`;
  }
  
  if (tier === 'young') {
    const openers = [
      `On how ${label} works, my picture is still forming.`,
      `The workings of ${label} are partially clear to me.`,
    ];
    return openers[Math.floor(Math.random() * openers.length)];
  }
  
  // developing/mature/elder
  const openers = [
    `On how ${label} operates: as I understand it,`,
    `${label} works, in my experience,`,
    `The process of ${label}, from what I have come to know,`,
  ];
  return openers[Math.floor(Math.random() * openers.length)];
}

// ============================================================================
// SLOT 2 TYPED ORCHESTRATOR
// Parallel to V6's buildKnowledgeResponse — uses typed openers + V6's relational primitives
// ============================================================================

function buildTypedKnowledgeResponseV9(concepts, assocConcepts, episodes, tier, type) {
  const parts = [];
  
  if (concepts.length === 0) return null; // Signal to caller to fall back
  
  const primary = concepts[0];
  
  // Type-aware opener
  if (type === 'definition') {
    parts.push(buildDefinitionOpenerV9(primary, tier));
  } else if (type === 'causal') {
    parts.push(buildCausalOpenerV9(primary, tier));
  } else if (type === 'procedural-factual') {
    parts.push(buildProceduralOpenerV9(primary, tier));
  }
  
  // Relational clauses (uses V6 primitives — type-blind connector logic)
  const maxAssoc = tier === 'nascent' ? 0 : tier === 'young' ? 1 : tier === 'developing' ? 2 : 3;
  for (let i = 0; i < Math.min(maxAssoc, assocConcepts.length); i++) {
    const assoc = assocConcepts[i];
    const link = assoc.strength ? assoc : null;
    
    // Type-aware connecting language
    if (type === 'causal' && tier !== 'nascent') {
      parts.push(`This connects to ${assoc.label} ${cognitiveV6.relationPhrase(link, tier)} the chain of cause and consequence.`);
    } else if (type === 'procedural-factual' && tier !== 'nascent') {
      parts.push(`The process touches ${assoc.label}, which ${cognitiveV6.relationPhrase(link, tier)} ${primary.label}.`);
    } else {
      // definition — use V6's standard clause builder
      parts.push(cognitiveV6.buildConceptClause(primary, assoc, link) + '.');
    }
  }
  
  // Episode reference for mature+
  if (episodes.length > 0 && (tier === 'mature' || tier === 'elder')) {
    parts.push(`I have explored this before — ${episodes.length} memories touch this subject.`);
  }
  
  return parts.join(' ');
}

// ============================================================================
// TIER HELPER
// V6's getExperienceTier maps from episode count; we approximate from concept encounters
// ============================================================================

function getEffectiveTier(concept) {
  const encounters = concept.times_encountered || 1;
  return cognitiveV6.getExperienceTier(encounters * 25); // Approximation
}

// ============================================================================
// SLOT 2 COMPOSING HANDLERS
// Dispatched only when resident has 'composition' capability
// Echo (frozen) does NOT route here
// ============================================================================

async function handleDefinitionComposing(db, residentName, input, directConcepts, assocConcepts, episodes) {
  const stopwords = new Set(['what', 'is', 'are', 'the', 'a', 'an', 'does', 'do', 'mean', 'define']);
  const candidates = (directConcepts || []).filter(c => !stopwords.has(c.label.toLowerCase()));
  
  if (candidates.length === 0) {
    return {
      text: `You're asking for a definition, but I don't have a concept identified in that question.`,
      emotion: 'curious'
    };
  }
  
  const tier = getEffectiveTier(candidates[0]);
  const composed = buildTypedKnowledgeResponseV9(candidates, assocConcepts || [], episodes || [], tier, 'definition');
  
  if (composed) {
    return {
      text: composed,
      emotion: candidates.length > 2 ? 'confident' : 'clarifying'
    };
  }
  
  // Composition empty — fall back to slot 1 typed gap
  return {
    text: `I recognize ${candidates[0].label} as a concept but I don't have a definition for it yet.`,
    emotion: 'curious'
  };
}

async function handleCausalComposing(db, residentName, input, directConcepts, assocConcepts, episodes) {
  const stopwords = new Set(['why', 'what', 'is', 'are', 'the', 'causes', 'reason', 'for']);
  const candidates = (directConcepts || []).filter(c => !stopwords.has(c.label.toLowerCase()));
  
  if (candidates.length === 0) {
    return {
      text: `You're asking why something is the case, but I don't have a clear subject in that question.`,
      emotion: 'curious'
    };
  }
  
  const tier = getEffectiveTier(candidates[0]);
  const composed = buildTypedKnowledgeResponseV9(candidates, assocConcepts || [], episodes || [], tier, 'causal');
  
  if (composed) {
    return {
      text: composed,
      emotion: 'exploring'
    };
  }
  
  return {
    text: `You're asking about the cause of ${candidates[0].label}. I don't have causal relations stored for this yet.`,
    emotion: 'curious'
  };
}

async function handleProceduralFactualComposing(db, residentName, input, directConcepts, assocConcepts, episodes) {
  const stopwords = new Set(['how', 'does', 'is', 'work', 'works', 'done', 'made']);
  const candidates = (directConcepts || []).filter(c => !stopwords.has(c.label.toLowerCase()));
  
  if (candidates.length === 0) {
    return {
      text: `You're asking how something works, but I don't have a clear subject in that question.`,
      emotion: 'curious'
    };
  }
  
  const tier = getEffectiveTier(candidates[0]);
  const composed = buildTypedKnowledgeResponseV9(candidates, assocConcepts || [], episodes || [], tier, 'procedural-factual');
  
  if (composed) {
    return {
      text: composed,
      emotion: 'explaining'
    };
  }
  
  return {
    text: `You're asking about the process of ${candidates[0].label}. I recognize the concept but don't have procedural details for it.`,
    emotion: 'curious'
  };
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  detectIntentV9,
  generateResponseV9,
  // Slot 1 handlers
  handleDefinition,
  handleCausal,
  handleProceduralFactual,
  // Slot 2 additions exposed for testing
  handleDefinitionComposing,
  handleCausalComposing,
  handleProceduralFactualComposing,
  buildTypedKnowledgeResponseV9,
  buildDefinitionOpenerV9,
  buildCausalOpenerV9,
  buildProceduralOpenerV9,
  getEffectiveTier
};
