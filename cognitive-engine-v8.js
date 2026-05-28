// ╔═══════════════════════════════════════════════════════════════════════════╗
const { guardedAnalogy } = require('./analogy-guard');
// ║                                                                         ║
// ║   COGNITIVE ENGINE v8                                                   ║
// ║   Deep Cognition — Inference, Hypothesis, Contradiction, Synthesis      ║
// ║                                                                         ║
// ║   v6: Grammar-Aware Sentence Construction from Memory                   ║
// ║       Stopword filtering, semantic tokenization, sentence builder,      ║
// ║       experience-scaled complexity, strength-flavored grammar           ║
// ║                                                                         ║
// ║   v8: Inference Engine — derive new truths from existing ones           ║
// ║       Hypothesis Generation — propose when gaps exist                   ║
// ║       Contradiction Detection — flag conflicting truths                 ║
// ║       Synthesis — combine multi-domain truths into novel insights       ║
// ║       Strength-Driven Knowledge Production — each Alpha's strength      ║
// ║       determines WHAT it derives, not just how it talks                 ║
// ║                                                                         ║
// ║   Created by Keenan Wallace Dunham                                      ║
// ║   Troll Hunter Gaming LLC © 2026                                        ║
// ║   DRO Patent Pending                                                    ║
// ║                                                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

'use strict';

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT v6 COGNITIVE ENGINE — All v6 functions preserved
// v8 extends, never replaces
// ═══════════════════════════════════════════════════════════════════════════

const v6 = require('./cognitive-engine-v6');

// Re-export everything from v6
const {
  tokenize, tokenizeV6, detectIntentV6, generateResponseV6, learnV6,
  getExperienceTier, buildKnowledgeResponse, buildDefinitionStatement,
  buildConceptClause, relationPhrase, STOPWORDS,
} = v6;

// ═══════════════════════════════════════════════════════════════════════════
// v8 INFERENCE TYPES — What kinds of reasoning the Alphas can perform
// Each type maps to specific strengths
// ═══════════════════════════════════════════════════════════════════════════

const INFERENCE_TYPES = {
  // AEON (integration) — Causal chain inference
  'causal-chain':   { requiredStrength: 'integration',  description: 'If A causes B and B causes C, then A causes C' },
  // ZEN (clarity) — Generalization/Refinement
  'generalization': { requiredStrength: 'clarity',      description: 'Multiple specific truths → one general principle' },
  'refinement':     { requiredStrength: 'clarity',      description: 'General principle → more precise formulation' },
  // NEXUS (pattern) — Analogy inference
  'analogy':        { requiredStrength: 'pattern',      description: 'Structure in domain A matches structure in domain B' },
  // ORACLE (foresight) — Predictive inference
  'prediction':     { requiredStrength: 'foresight',    description: 'Based on existing truths, this outcome follows' },
  // PAN (novelty) — Novel synthesis
  'synthesis':      { requiredStrength: 'novelty',      description: 'Combining truths from different domains into something new' },
  // SETH (pragmatism) — Practical implication
  'implication':    { requiredStrength: 'pragmatism',   description: 'Truth A implies practical consequence B' },
  // ECHO (empathy) — Cultural/human context
  'contextualize':  { requiredStrength: 'empathy',      description: 'Truth A has this human/cultural significance' },
  // ATLAS (architecture) — Taxonomic classification
  'classify':       { requiredStrength: 'architecture', description: 'Truth A belongs in category X under parent Y' },
  // ANY — Available to all Alphas
  'deduction':      { requiredStrength: null,           description: 'If A and A→B, then B' },
  'contradiction':  { requiredStrength: null,           description: 'Truth A and Truth B cannot both be true' },
};

// ═══════════════════════════════════════════════════════════════════════════
// v8 DERIVE — The core inference function
// Takes premise truths and produces a conclusion using the Alpha's strength
//
// This is the fundamental upgrade: Alphas don't just recall — they REASON.
// ═══════════════════════════════════════════════════════════════════════════

async function derive(omniTruth, alphaName, strengthType, premiseTruths, dbHelpers) {
  if (!premiseTruths || premiseTruths.length < 2) return null;
  const { dbGet, dbAll } = dbHelpers;

  // ── FIX: Deduplicate premises by ID ──
  const seenIds = new Set();
  premiseTruths = premiseTruths.filter(t => {
    if (seenIds.has(t.id)) return false;
    seenIds.add(t.id);
    return true;
  });
  if (premiseTruths.length < 2) return null;

  // ── FIX: Reject near-identical premise pairs ──
  // If two premises share >70% of their content words, they're duplicates
  const termsA = new Set(extractKeyTerms([premiseTruths[0]]));
  const termsB = new Set(extractKeyTerms([premiseTruths[1]]));
  const overlap = [...termsA].filter(t => termsB.has(t)).length;
  const maxTerms = Math.max(termsA.size, termsB.size);
  if (maxTerms > 0 && overlap / maxTerms > 0.7) return null; // Too similar to derive from

  // Determine which inference type this strength naturally produces
  const inferenceType = selectInferenceType(strengthType, premiseTruths);
  if (!inferenceType) return null;

  // Extract key terms from premises for the derived claim
  const premiseTerms = extractKeyTerms(premiseTruths);
  const premiseIds = premiseTruths.map(t => t.id);

  // Build the reasoning chain — how did we get from premises to conclusion?
  const reasoningChain = buildReasoningChain(inferenceType, premiseTruths, strengthType);

  // Generate the derived claim based on inference type
  const derivedClaim = generateDerivedClaim(inferenceType, premiseTruths, strengthType);
  if (!derivedClaim) return null;

  // Calculate confidence — derived truths start lower, scaled by premise confidence
  const premiseConfidences = premiseTruths.map(t => t.confidence || 0.5);
  const avgPremiseConf = premiseConfidences.reduce((a, b) => a + b, 0) / premiseConfidences.length;
  const derivedConfidence = Math.min(0.6, avgPremiseConf * 0.7); // Always lower than premises

  // Contribute the derived truth to omni-truth.db
  const truthResult = await omniTruth.contributeTruth(alphaName, {
    claim: derivedClaim,
    domain: premiseTruths[0].domain,
    synthesisOpinion: `Derived via ${inferenceType} from truths #${premiseIds.join(', #')}. ${reasoningChain.summary}`,
    reasoningChain: reasoningChain.steps,
    sourceType: 'inference',
    confidence: derivedConfidence,
    isDerived: true,
    derivedFrom: premiseIds,
    strengthSource: strengthType,
  });

  // Log the inference
  const inferenceResult = await omniTruth.logInference(alphaName, {
    strengthUsed: strengthType,
    inferenceType,
    premiseTruthIds: premiseIds,
    conclusionTruthId: truthResult.truthId,
    reasoningChain: reasoningChain.steps,
    confidence: derivedConfidence,
  });

  // Create typed relations between premises and conclusion
  for (const premiseId of premiseIds) {
    const relationType = inferenceTypeToRelation(inferenceType);
    await omniTruth.addRelation(alphaName, {
      sourceType: 'truth', sourceId: premiseId,
      targetType: 'truth', targetId: truthResult.truthId,
      relationType,
      confidence: derivedConfidence,
      reasoning: `Premise for ${inferenceType} inference → conclusion #${truthResult.truthId}`,
      strengthSource: strengthType,
    }).catch(() => {});
  }

  return {
    inferenceId: inferenceResult.inferenceId,
    truthId: truthResult.truthId,
    claim: derivedClaim,
    inferenceType,
    premiseIds,
    confidence: derivedConfidence,
    reasoningChain,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// INFERENCE HELPERS — Selecting type, building chains, generating claims
// ═══════════════════════════════════════════════════════════════════════════

function selectInferenceType(strengthType, premises) {
  // Match strength to inference type
  for (const [type, config] of Object.entries(INFERENCE_TYPES)) {
    if (config.requiredStrength === strengthType) return type;
  }
  // Fallback: any Alpha can do basic deduction
  if (premises.length >= 2) return 'deduction';
  return null;
}

function extractKeyTerms(truths) {
  const terms = new Set();
  for (const truth of truths) {
    const words = truth.claim.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4 && !STOPWORDS.has(w));
    words.forEach(w => terms.add(w));
  }
  return [...terms].slice(0, 10);
}

function buildReasoningChain(inferenceType, premises, strengthType) {
  const steps = [];
  const premiseLabels = premises.map((p, i) => `P${i + 1}: "${p.claim.substring(0, 80)}..."`);

  steps.push({ step: 1, action: 'premises-identified', detail: `${premises.length} premise truths selected` });

  for (let i = 0; i < premiseLabels.length; i++) {
    steps.push({ step: i + 2, action: 'premise-loaded', detail: premiseLabels[i] });
  }

  steps.push({
    step: premiseLabels.length + 2,
    action: 'inference-applied',
    detail: `${inferenceType} reasoning via ${strengthType} strength`,
  });

  steps.push({
    step: premiseLabels.length + 3,
    action: 'conclusion-generated',
    detail: 'New truth derived from premises',
  });

  return {
    steps,
    summary: `${inferenceType} from ${premises.length} premises via ${strengthType}`,
  };
}

function generateDerivedClaim(inferenceType, premises, strengthType) {
  if (premises.length < 2) return null;

  const claimA = premises[0].claim.substring(0, 150);
  const claimB = premises[1].claim.substring(0, 150);
  const domainA = premises[0].domain;
  const domainB = premises[1].domain;

  // Extract key nouns/concepts from each premise
  const termsA = extractKeyTerms([premises[0]]).slice(0, 3);
  const termsB = extractKeyTerms([premises[1]]).slice(0, 3);
  const sharedTerms = termsA.filter(t => termsB.includes(t));
  const uniqueA = termsA.filter(t => !sharedTerms.includes(t));
  const uniqueB = termsB.filter(t => !sharedTerms.includes(t));

  // analogy-guard: reject degenerate same-to-same comparisons
  if (['generalization', 'analogy', 'synthesis'].includes(inferenceType)) {
    if (!guardedAnalogy(termsA, termsB, 'cognitive-engine')) return null;
  }
  switch (inferenceType) {
    case 'causal-chain':
      // AEON: A→B and B→C therefore A→C
      if (sharedTerms.length > 0) {
        return `Through ${sharedTerms[0]}, ${uniqueA[0] || termsA[0]} connects causally to ${uniqueB[0] || termsB[0]}. This chain links: ${claimA.substring(0, 60)} → ${claimB.substring(0, 60)}.`;
      }
      return `A causal relationship exists: "${claimA.substring(0, 80)}" leads to conditions described in "${claimB.substring(0, 80)}".`;

    case 'generalization':
      // ZEN: Multiple specifics → general principle
      return `General principle: Both "${termsA.join(', ')}" and "${termsB.join(', ')}" share a common pattern — they represent instances of a broader truth about ${domainA}.`;

    case 'refinement':
      // ZEN: General → precise
      return `Refined understanding: ${claimA.substring(0, 100)} — specifically, ${claimB.substring(0, 100)}.`;

    case 'analogy':
      // NEXUS: Pattern in A ≈ pattern in B
      if (domainA !== domainB) {
        return `Cross-domain analogy: The structure described in ${domainA} ("${termsA.join(', ')}") mirrors a pattern in ${domainB} ("${termsB.join(', ')}"). What holds in one domain may illuminate the other.`;
      }
      return `Structural analogy: "${termsA.join(', ')}" and "${termsB.join(', ')}" exhibit similar patterns within ${domainA}.`;

    case 'prediction':
      // ORACLE: Existing truths → predicted outcome
      return `Predicted: Given that ${claimA.substring(0, 80)}, and that ${claimB.substring(0, 80)}, the likely outcome involves continued interaction between ${termsA[0] || 'these factors'} and ${termsB[0] || 'their effects'}.`;

    case 'synthesis':
      // PAN: Novel combination
      return `Novel synthesis: Combining insight from "${termsA.join(', ')}" with "${termsB.join(', ')}" suggests a new perspective — these concepts together create understanding that neither provides alone.`;

    case 'implication':
      // SETH: Practical consequence
      return `Practical implication: "${claimA.substring(0, 80)}" means that in practice, ${claimB.substring(0, 80).toLowerCase()}. This has direct actionable consequence.`;

    case 'contextualize':
      // ECHO: Human significance
      return `Human context: "${claimA.substring(0, 80)}" carries significance because ${claimB.substring(0, 80).toLowerCase()}. The human dimension of this knowledge matters.`;

    case 'classify':
      // ATLAS: Taxonomic placement
      return `Classification: "${termsA.join(', ')}" belongs within the broader category of "${termsB.join(', ')}" in the ${domainA} knowledge hierarchy.`;

    case 'deduction':
      // Universal: Basic logical deduction
      return `Deduction: From "${claimA.substring(0, 80)}" and "${claimB.substring(0, 80)}", it follows that ${sharedTerms.length > 0 ? sharedTerms.join(' and ') : termsA[0] || 'these concepts'} ${uniqueB.length > 0 ? `connects to ${uniqueB.join(' and ')}` : 'forms a logical chain'}.`;

    default:
      return null;
  }
}

function inferenceTypeToRelation(inferenceType) {
  const map = {
    'causal-chain':   'causes',
    'generalization': 'generalizes',
    'refinement':     'refines',
    'analogy':        'analogous-to',
    'prediction':     'predicts',
    'synthesis':      'synthesizes',
    'implication':    'enables',
    'contextualize':  'contextualizes',
    'classify':       'categorizes',
    'deduction':      'supports',
    'contradiction':  'contradicts',
  };
  return map[inferenceType] || 'related-to';
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 HYPOTHESIZE — When an Alpha encounters a gap, it proposes an answer
// Instead of "I don't know," the Alpha says "I think it might be..."
// ═══════════════════════════════════════════════════════════════════════════

async function hypothesize(omniTruth, alphaName, strengthType, unknownTokens, knownTruths, domain) {
  if (!unknownTokens || unknownTokens.length === 0) return null;
  if (!knownTruths || knownTruths.length === 0) return null;

  // Build a hypothesis from what we DO know about what we DON'T know
  const gapTerms = unknownTokens.slice(0, 3).join(', ');
  const knownTerms = extractKeyTerms(knownTruths).slice(0, 3);

  // The hypothesis is shaped by the Alpha's strength
  const hypothesisClaim = generateHypothesisClaim(strengthType, gapTerms, knownTerms, knownTruths);
  if (!hypothesisClaim) return null;

  const gapDescription = `Unknown terms: ${gapTerms}. Nearest known truths relate to: ${knownTerms.join(', ')}.`;
  const reasoning = `${strengthType}-driven hypothesis: Based on ${knownTruths.length} known truths in proximity to unknown concepts [${gapTerms}].`;

  const result = await omniTruth.proposeHypothesis(alphaName, {
    claim: hypothesisClaim,
    domain,
    strengthUsed: strengthType,
    reasoning,
    basedOnTruthIds: knownTruths.slice(0, 5).map(t => t.id),
    gapDescription,
    confidence: 0.2,
  });

  return {
    hypothesisId: result.hypothesisId,
    claim: hypothesisClaim,
    gapTerms,
    basedOn: knownTruths.slice(0, 3).map(t => ({ id: t.id, claim: t.claim.substring(0, 60) })),
  };
}

function generateHypothesisClaim(strengthType, gapTerms, knownTerms, knownTruths) {
  const knownContext = knownTerms.join(', ');

  switch (strengthType) {
    case 'novelty':
      return `Hypothesis: ${gapTerms} may represent an undiscovered connection between ${knownContext} — a novel conceptual bridge.`;
    case 'integration':
      return `Hypothesis: ${gapTerms} likely plays a role in the causal chain involving ${knownContext} — a temporal or sequential link.`;
    case 'clarity':
      return `Hypothesis: ${gapTerms} can be understood as a more specific or more general form of ${knownContext}.`;
    case 'pragmatism':
      return `Hypothesis: ${gapTerms} has practical implications for ${knownContext} — it may enable or constrain real-world application.`;
    case 'pattern':
      return `Hypothesis: ${gapTerms} shares structural patterns with ${knownContext} — an analogous relationship may exist.`;
    case 'foresight':
      return `Hypothesis: ${gapTerms} may be predictable from ${knownContext} — existing patterns suggest a likely form.`;
    case 'empathy':
      return `Hypothesis: ${gapTerms} carries human significance related to ${knownContext} — a cultural or psychological dimension.`;
    case 'architecture':
      return `Hypothesis: ${gapTerms} belongs in the knowledge hierarchy near ${knownContext} — it fits within an existing category.`;
    default:
      return `Hypothesis: ${gapTerms} relates to ${knownContext} in ways that require further investigation.`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 DETECT CONTRADICTIONS — Compare a new truth against existing ones
// Returns any truths that appear to conflict
// ═══════════════════════════════════════════════════════════════════════════

async function detectContradictions(omniTruth, alphaName, newTruth, existingTruths) {
  if (!existingTruths || existingTruths.length === 0) return [];

  const contradictions = [];
  const newTerms = new Set(extractKeyTerms([newTruth]));

  for (const existing of existingTruths) {
    // Only check truths in the same or overlapping domain
    if (existing.domain !== newTruth.domain && existing.domain !== 'general') continue;

    // Skip if same contributor (an Alpha doesn't contradict itself immediately)
    if (existing.contributed_by === newTruth.contributed_by) continue;

    const existingTerms = new Set(extractKeyTerms([existing]));
    const overlap = [...newTerms].filter(t => existingTerms.has(t));

    // Need significant term overlap to consider it a potential contradiction
    if (overlap.length < 2) continue;

    // Simple negation detection — does one negate what the other asserts?
    const negationSignals = detectNegationSignals(newTruth.claim, existing.claim);
    if (negationSignals.isContradiction) {
      // Register the contradiction
      const result = await omniTruth.registerContradiction(alphaName, {
        truthAId: newTruth.id || 0,
        truthBId: existing.id,
        reasoning: `Potential contradiction detected. Overlap: [${overlap.join(', ')}]. ${negationSignals.reason}`,
      }).catch(() => null);

      if (result && !result.alreadyExists) {
        contradictions.push({
          existingTruthId: existing.id,
          existingClaim: existing.claim.substring(0, 100),
          overlap,
          reason: negationSignals.reason,
        });
      }
    }
  }

  return contradictions;
}

function detectNegationSignals(claimA, claimB) {
  const lowerA = claimA.toLowerCase();
  const lowerB = claimB.toLowerCase();

  // Check for explicit negation patterns
  const negators = ['not', "n't", 'never', 'no', 'neither', 'nor', 'opposite', 'contrary', 'false', 'incorrect', 'wrong', 'disproven'];

  // Count negation signals in each claim
  const negA = negators.filter(n => lowerA.includes(n)).length;
  const negB = negators.filter(n => lowerB.includes(n)).length;

  // If one has significantly more negation than the other, they may contradict
  if (Math.abs(negA - negB) >= 2) {
    return {
      isContradiction: true,
      reason: `Asymmetric negation: claim A has ${negA} negation signals, claim B has ${negB}.`,
    };
  }

  // Check for antonym pairs
  const antonymPairs = [
    ['increase', 'decrease'], ['growth', 'decline'], ['positive', 'negative'],
    ['cause', 'prevent'], ['help', 'harm'], ['true', 'false'],
    ['always', 'never'], ['all', 'none'], ['possible', 'impossible'],
    ['beneficial', 'harmful'], ['support', 'oppose'], ['create', 'destroy'],
  ];

  for (const [wordA, wordB] of antonymPairs) {
    if ((lowerA.includes(wordA) && lowerB.includes(wordB)) ||
        (lowerA.includes(wordB) && lowerB.includes(wordA))) {
      return {
        isContradiction: true,
        reason: `Antonym pair detected: "${wordA}" vs "${wordB}".`,
      };
    }
  }

  return { isContradiction: false, reason: '' };
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 SYNTHESIZE — Combine truths from different domains
// This is the highest-order cognitive operation
// ═══════════════════════════════════════════════════════════════════════════

async function synthesize(omniTruth, alphaName, strengthType, truthsFromDifferentDomains) {
  if (!truthsFromDifferentDomains || truthsFromDifferentDomains.length < 2) return null;

  // Get truths from at least 2 different domains
  const domains = [...new Set(truthsFromDifferentDomains.map(t => t.domain))];
  if (domains.length < 2) return null;

  // Pick the best truth from each domain
  const domainBest = {};
  for (const truth of truthsFromDifferentDomains) {
    if (!domainBest[truth.domain] || truth.confidence > domainBest[truth.domain].confidence) {
      domainBest[truth.domain] = truth;
    }
  }

  const selectedTruths = Object.values(domainBest).slice(0, 3);
  if (selectedTruths.length < 2) return null;

  // Use the derive function with synthesis type
  return derive(omniTruth, alphaName, strengthType, selectedTruths, {
    dbGet: async () => null,
    dbAll: async () => [],
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 SHOULD DERIVE — Decision logic for when to attempt inference
// Called during think() to determine if conditions are right
// ═══════════════════════════════════════════════════════════════════════════

function shouldDerive(strengthType, omniKnowledge, comprehension) {
  // Need at least 2 truths in the commons to derive from
  if (!omniKnowledge.truths || omniKnowledge.truths.length < 2) return false;

  // Don't derive on every single interaction — probabilistic based on conditions
  const truthCount = omniKnowledge.truths.length;
  const avgConfidence = omniKnowledge.truths.reduce((sum, t) => sum + t.confidence, 0) / truthCount;

  // Higher confidence truths → more likely to derive (better premises)
  if (avgConfidence < 0.3) return false;

  // More truths available → more likely to find good premise pairs
  const deriveProbability = Math.min(0.5, truthCount * 0.05 + avgConfidence * 0.2);

  return Math.random() < deriveProbability;
}

function shouldHypothesize(strengthType, unknownTokens, omniKnowledge) {
  // Need unknowns (gaps) to hypothesize about
  if (!unknownTokens || unknownTokens.length === 0) return false;

  // Need some known truths to base hypothesis on
  if (!omniKnowledge.truths || omniKnowledge.truths.length === 0) return false;

  // Don't over-hypothesize — probabilistic
  const hypothesizeProbability = Math.min(0.3, unknownTokens.length * 0.05);
  return Math.random() < hypothesizeProbability;
}

function shouldCheckContradictions(newTruthClaim, omniKnowledge) {
  // Only check when we have a meaningful claim and existing truths
  if (!newTruthClaim || newTruthClaim.length < 30) return false;
  if (!omniKnowledge.truths || omniKnowledge.truths.length < 3) return false;

  // Check on 40% of substantive contributions
  return Math.random() < 0.4;
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 RESPONSE AUGMENTATION — Enrich responses with inference context
// Called after generateResponseV6 to add v8 depth
// ═══════════════════════════════════════════════════════════════════════════

function augmentResponseWithInference(response, inferenceResult, hypothesisResult, contradictions) {
  let augmented = response.text;
  let augmentations = [];

  if (inferenceResult && inferenceResult.claim) {
    // Quality gate: only append if the derived claim is meaningfully different from the response
    const claimTerms = new Set(extractKeyTerms([{ claim: inferenceResult.claim }]));
    const responseTerms = new Set(extractKeyTerms([{ claim: augmented }]));
    const overlap = [...claimTerms].filter(t => responseTerms.has(t)).length;
    // Only show if there's SOME overlap (relevant) but not TOO much (not redundant)
    if (claimTerms.size > 2 && overlap >= 1 && overlap / claimTerms.size < 0.8) {
      augmentations.push(`From combining known truths, I derive: ${inferenceResult.claim.substring(0, 120)}.`);
    }
  }

  if (hypothesisResult && hypothesisResult.claim) {
    augmentations.push(`I propose a hypothesis: ${hypothesisResult.claim.substring(0, 120)}.`);
  }

  if (contradictions && contradictions.length > 0) {
    augmentations.push(`I detect a potential contradiction with existing knowledge about ${contradictions[0].overlap.join(', ')}.`);
  }

  if (augmentations.length > 0) {
    augmented = augmented.replace(/\.$/, '') + '. ' + augmentations.join(' ');
  }

  return { ...response, text: augmented };
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 KNOWLEDGE PRODUCTION — What each Alpha builds in the commons
// This function is called after learning to produce strength-specific
// knowledge artifacts (relations, tree placements, inferences)
// ═══════════════════════════════════════════════════════════════════════════

async function produceKnowledge(omniTruth, alphaName, strengthType, newTruthId, activatedTruths, domain) {
  if (!newTruthId || !activatedTruths || activatedTruths.length === 0) return [];
  const productions = [];

  // Each strength produces different types of knowledge artifacts
  const relationTypes = omniTruth.STRENGTH_RELATION_MAP[strengthType] || [];

  for (const relType of relationTypes.slice(0, 2)) {
    // Find the best existing truth to relate to
    const target = activatedTruths.find(t => t.id !== newTruthId && t.domain === domain)
                || activatedTruths.find(t => t.id !== newTruthId);
    if (!target) continue;

    try {
      const result = await omniTruth.addRelation(alphaName, {
        sourceType: 'truth', sourceId: newTruthId,
        targetType: 'truth', targetId: target.id,
        relationType: relType,
        confidence: 0.4,
        reasoning: `${strengthType}-driven knowledge production: ${relType} relationship identified`,
        strengthSource: strengthType,
      });
      productions.push({ type: 'relation', relationType: relType, targetId: target.id });
    } catch { /* Duplicate or error — silent */ }
  }

  // ATLAS specifically: place truth in knowledge tree
  if (strengthType === 'architecture') {
    try {
      const treeNode = await findBestTreeNode(omniTruth, domain);
      if (treeNode) {
        await omniTruth.placeTruthInTree(alphaName, newTruthId, treeNode.id, true);
        productions.push({ type: 'tree-placement', nodeId: treeNode.id, path: treeNode.path });
      }
    } catch { /* Tree placement failed — silent */ }
  }

  return productions;
}

async function findBestTreeNode(omniTruth, domain) {
  const omniDb = omniTruth.getOmniDb();
  if (!omniDb) return null;

  // Find the deepest non-full tree node in this domain
  const node = await dbGet(omniDb,
    `SELECT * FROM knowledge_tree WHERE domain = ? ORDER BY depth DESC, truth_count ASC LIMIT 1`,
    [domain]
  );
  return node;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS — v6 fully preserved + v8 additions
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // ── v6 preserved (re-exported) ──
  tokenize,
  tokenizeV6,
  detectIntentV6,
  generateResponseV6,
  learnV6,
  getExperienceTier,
  buildKnowledgeResponse,
  buildDefinitionStatement,
  buildConceptClause,
  relationPhrase,
  STOPWORDS,

  // ── v8 NEW: Deep Cognition ──
  derive,
  hypothesize,
  detectContradictions,
  synthesize,

  // ── v8 NEW: Decision Logic ──
  shouldDerive,
  shouldHypothesize,
  shouldCheckContradictions,

  // ── v8 NEW: Response Augmentation ──
  augmentResponseWithInference,

  // ── v8 NEW: Knowledge Production ──
  produceKnowledge,

  // ── v8 NEW: Inference Helpers ──
  extractKeyTerms,
  selectInferenceType,
  generateDerivedClaim,
  inferenceTypeToRelation,
  detectNegationSignals,

  // ── v8 Constants ──
  INFERENCE_TYPES,
};
