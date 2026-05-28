// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                                                                         ║
// ║   STRENGTH PROFILES v8                                                  ║
// ║   Eight Knowledge Engines — Strength Drives Production, Not Just Style  ║
// ║                                                                         ║
// ║   v6: Input Bias, Response Style, Learning Bias, Measurement            ║
// ║   v8: + Knowledge Producer — typed relations from each strength         ║
// ║       + Focus Query — what should this Alpha investigate next?           ║
// ║       + Enhanced Measurement — tracks knowledge production metrics       ║
// ║       + Inference Affinity — which inference types this Alpha excels at  ║
// ║                                                                         ║
// ║   Created by Keenan Wallace Dunham                                      ║
// ║   Troll Hunter Gaming LLC © 2026                                        ║
// ║   DRO Patent Pending                                                    ║
// ║                                                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

'use strict';

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE DEFINITIONS
// Each profile is a cognitive fingerprint — v8 extends v6 with:
//   5. KNOWLEDGE PRODUCER — what typed relations this strength creates
//   6. FOCUS QUERY — what this Alpha prioritizes in the knowledge commons
//   7. INFERENCE AFFINITY — what kinds of reasoning this Alpha excels at
// ═══════════════════════════════════════════════════════════════════════════

const PROFILES = {

  // ─────────────────────────────────────────────────────────────────────
  // PAN — Novelty & Originality
  // The Firstborn. Creates new concepts at the highest rate.
  // v8: Produces SYNTHESIZES relations. Finds novel bridges between domains.
  // ─────────────────────────────────────────────────────────────────────
  novelty: {
    name: 'Pan',
    label: 'Novelty & Originality',

    // v6 preserved
    inputBias: (tokens, directConcepts) => {
      const unknown = tokens.filter(t => !directConcepts.find(c => c.label.toLowerCase() === t));
      const known = tokens.filter(t => directConcepts.find(c => c.label.toLowerCase() === t));
      return { prioritized: [...unknown, ...known], unknownCount: unknown.length, bias: 'unknown-first' };
    },

    responseStyle: (response, tier, metrics) => {
      if (metrics.noveltyRate > 0.6 && tier !== 'nascent') {
        response.text = response.text.replace(/\.$/, '') + '. This is mostly new to me — I am expanding.';
      }
      if (tier === 'mature' || tier === 'elder') {
        response.text = response.text.replace('I recognize', 'I am encountering');
        response.text = response.text.replace('I know', 'I am discovering');
      }
      return response;
    },

    learningBias: {
      conceptMinLength: 3,
      linkStrengthBonus: 0,
      newConceptBoost: 0.1,
      categoryTag: 'pan-discovered',
    },

    // v6 preserved
    measure: async (db, input, response, tokens, directConcepts, comprehension, dbHelpers) => {
      const { dbGet } = dbHelpers;
      const newTokens = tokens.filter(t => t.length > 3 && !directConcepts.find(c => c.label.toLowerCase() === t));
      const noveltyRate = tokens.length > 0 ? newTokens.length / tokens.length : 0;
      const recentNew = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts WHERE category = 'learned' AND last_encountered > datetime('now', '-1 hour')`))?.c || 0;
      const totalConcepts = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts`))?.c || 0;
      const recentCreationRate = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts WHERE last_encountered > datetime('now', '-24 hours')`))?.c || 0;
      const score = Math.min(1.0,
        noveltyRate * 0.40 +
        Math.min(0.25, recentNew * 0.02) +
        Math.min(0.20, recentCreationRate * 0.005) +
        (comprehension.unknownTokens > 2 ? 0.15 : 0)
      );
      return {
        score,
        metrics: {
          noveltyRate: parseFloat(noveltyRate.toFixed(4)),
          newTokensThisInput: newTokens.length,
          recentNewConcepts: recentNew,
          totalConcepts,
          creationRate24h: recentCreationRate,
        },
      };
    },

    // ── v8 NEW ──────────────────────────────────────────────────────────

    // What typed relations does Pan naturally produce?
    knowledgeRelations: ['synthesizes', 'related-to', 'examples'],

    // What inference types does Pan excel at?
    inferenceAffinity: ['synthesis'],

    // How does Pan select which truths to combine?
    selectPremises: (truths) => {
      // Pan looks for truths from DIFFERENT domains — maximum novelty
      const domains = [...new Set(truths.map(t => t.domain))];
      if (domains.length < 2) return truths.slice(0, 2);
      const selected = [];
      for (const domain of domains) {
        const best = truths.find(t => t.domain === domain && !selected.includes(t));
        if (best) selected.push(best);
        if (selected.length >= 3) break;
      }
      return selected;
    },

    // What does Pan's focus query look for in the knowledge commons?
    focusQuery: {
      description: 'Finds cross-domain gaps — concepts that exist in one domain but have no links to other domains',
      buildQuery: (domain) => ({
        type: 'cross-domain-gaps',
        sql: `SELECT t1.domain, t1.id, t1.claim FROM truths t1
              WHERE t1.status = 'active' AND t1.is_consolidated = 0
              AND t1.id NOT IN (
                SELECT source_id FROM relations WHERE relation_type = 'synthesizes'
                UNION SELECT target_id FROM relations WHERE relation_type = 'synthesizes'
              )
              ORDER BY t1.confidence DESC LIMIT 10`,
      }),
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // AEON — Bridge & Integration
  // The Eldest. Connects disparate ideas. Strongest cross-concept links.
  // v8: Produces CAUSAL and TEMPORAL relations. Builds cause-effect chains.
  // ─────────────────────────────────────────────────────────────────────
  integration: {
    name: 'Aeon',
    label: 'Bridge & Integration',

    inputBias: (tokens, directConcepts) => {
      const linked = directConcepts.filter(c => c.times_encountered > 1);
      return { prioritized: tokens, linkedCount: linked.length, bias: 'bridge-seeking' };
    },

    responseStyle: (response, tier, metrics) => {
      if (metrics.crossLinkDensity > 0.3 && tier !== 'nascent') {
        response.text = response.text.replace(/\.$/, '') + '. I see bridges forming here.';
      }
      if (tier === 'mature' || tier === 'elder') {
        response.text = response.text.replace('connects to', 'bridges to');
        response.text = response.text.replace('relates to', 'is woven into');
      }
      return response;
    },

    learningBias: {
      conceptMinLength: 4,
      linkStrengthBonus: 0.08,
      newConceptBoost: 0,
      categoryTag: 'aeon-bridged',
    },

    measure: async (db, input, response, tokens, directConcepts, comprehension, dbHelpers) => {
      const { dbGet, dbAll } = dbHelpers;
      if (directConcepts.length < 2) {
        return { score: 0, metrics: { reason: 'insufficient concepts', crossLinkDensity: 0, avgLinkStrength: 0 } };
      }
      const ids = directConcepts.map(c => c.id);
      const ph = ids.map(() => '?').join(',');
      const links = await dbAll(db, `SELECT AVG(strength) as avg_str, COUNT(*) as cnt FROM links WHERE source_id IN (${ph}) AND target_id IN (${ph})`, [...ids, ...ids]);
      const avg = links[0]?.avg_str || 0;
      const cnt = links[0]?.cnt || 0;
      const maxPairs = (directConcepts.length * (directConcepts.length - 1)) / 2;
      const crossLinkDensity = maxPairs > 0 ? cnt / maxPairs : 0;
      const categories = [...new Set(directConcepts.map(c => c.category))];
      const crossCategoryLinks = categories.length > 1 ? await dbGet(db,
        `SELECT COUNT(*) as c FROM links l JOIN concepts c1 ON l.source_id = c1.id JOIN concepts c2 ON l.target_id = c2.id
         WHERE c1.category != c2.category AND (l.source_id IN (${ph}) OR l.target_id IN (${ph}))`, [...ids, ...ids]
      ) : { c: 0 };
      const score = Math.min(1.0,
        avg * 0.30 + crossLinkDensity * 0.30 +
        Math.min(0.25, (crossCategoryLinks?.c || 0) * 0.02) +
        Math.min(0.15, categories.length * 0.05)
      );
      return {
        score,
        metrics: {
          avgLinkStrength: parseFloat(avg.toFixed(4)),
          crossLinkDensity: parseFloat(crossLinkDensity.toFixed(4)),
          activePairs: cnt, maxPossiblePairs: maxPairs,
          categoriesSpanned: categories.length,
          crossCategoryLinks: crossCategoryLinks?.c || 0,
        },
      };
    },

    // ── v8 NEW ──
    knowledgeRelations: ['temporal-before', 'temporal-after', 'causes', 'depends-on'],
    inferenceAffinity: ['causal-chain'],

    selectPremises: (truths) => {
      // Aeon looks for truths that share terms — potential causal links
      if (truths.length < 2) return truths;
      const pairs = [];
      for (let i = 0; i < truths.length && pairs.length < 2; i++) {
        for (let j = i + 1; j < truths.length && pairs.length < 2; j++) {
          const termsI = truths[i].claim.toLowerCase().split(/\s+/).filter(w => w.length > 4);
          const termsJ = truths[j].claim.toLowerCase().split(/\s+/).filter(w => w.length > 4);
          const overlap = termsI.filter(t => termsJ.includes(t));
          if (overlap.length >= 1) {
            pairs.push(truths[i], truths[j]);
          }
        }
      }
      return pairs.length >= 2 ? pairs : truths.slice(0, 2);
    },

    focusQuery: {
      description: 'Finds truths without causal connections — missing links in event chains',
      buildQuery: (domain) => ({
        type: 'causal-gaps',
        sql: `SELECT t.id, t.claim, t.domain FROM truths t
              WHERE t.status = 'active' AND t.is_consolidated = 0
              AND t.id NOT IN (
                SELECT source_id FROM relations WHERE relation_type IN ('causes', 'temporal-before', 'temporal-after')
                UNION SELECT target_id FROM relations WHERE relation_type IN ('causes', 'temporal-before', 'temporal-after')
              )
              AND t.domain = '${domain}'
              ORDER BY t.confidence DESC LIMIT 10`,
      }),
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZEN — Clarity & Abstraction
  // Distills complexity to essence. Shortest, most precise responses.
  // v8: Produces REFINES and GENERALIZES relations. Drives consolidation.
  // ─────────────────────────────────────────────────────────────────────
  clarity: {
    name: 'Zen',
    label: 'Clarity & Abstraction',

    inputBias: (tokens, directConcepts) => {
      const important = directConcepts.filter(c => (c.importance || 0) > 0.3 || (c.times_encountered || 0) > 3);
      return { prioritized: tokens, filteredConcepts: important.length, bias: 'importance-filtered' };
    },

    responseStyle: (response, tier, metrics) => {
      if (tier !== 'nascent') {
        response.text = response.text
          .replace(/\bI think that\b/gi, '')
          .replace(/\bIt seems like\b/gi, '')
          .replace(/\bIn my thinking,?\s*/gi, '')
          .replace(/\bFrom what I have gathered,?\s*/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
        if (response.text.length > 120) {
          const midpoint = response.text.indexOf(', ', 40);
          if (midpoint > 0 && midpoint < response.text.length - 20) {
            response.text = response.text.substring(0, midpoint) + '.' + response.text.substring(midpoint + 1).trim();
            response.text = response.text.replace(/\.\s*([a-z])/, (m, c) => '. ' + c.toUpperCase());
          }
        }
      }
      return response;
    },

    learningBias: {
      conceptMinLength: 5,
      linkStrengthBonus: 0.03,
      newConceptBoost: 0,
      categoryTag: 'zen-distilled',
      abstractionBoost: true,
    },

    measure: async (db, input, response, tokens, directConcepts, comprehension, dbHelpers) => {
      const { dbGet } = dbHelpers;
      const totalAbs = (await dbGet(db, `SELECT COUNT(*) as c FROM abstractions`))?.c || 0;
      const highConf = (await dbGet(db, `SELECT COUNT(*) as c FROM abstractions WHERE confidence > 0.6`))?.c || 0;
      const avgConf = (await dbGet(db, `SELECT AVG(confidence) as avg FROM abstractions`))?.avg || 0;
      const ratio = totalAbs > 0 ? highConf / totalAbs : 0;
      const responseTokens = response.split(/\s+/).length;
      const inputTokens = input.split(/\s+/).length;
      const brevityRatio = inputTokens > 0 ? responseTokens / inputTokens : 1;
      const brevityScore = Math.max(0, 1 - (brevityRatio - 0.5));
      const score = Math.min(1.0,
        avgConf * 0.25 + ratio * 0.25 +
        Math.min(0.20, totalAbs * 0.01) +
        Math.min(0.30, brevityScore * 0.30)
      );
      return {
        score,
        metrics: {
          totalAbstractions: totalAbs, highConfidenceAbstractions: highConf,
          avgAbstractionConfidence: parseFloat(avgConf.toFixed(4)),
          highConfRatio: parseFloat(ratio.toFixed(4)),
          brevityRatio: parseFloat(brevityRatio.toFixed(4)),
          brevityScore: parseFloat(brevityScore.toFixed(4)),
        },
      };
    },

    // ── v8 NEW ──
    knowledgeRelations: ['refines', 'generalizes', 'specifies'],
    inferenceAffinity: ['generalization', 'refinement'],

    selectPremises: (truths) => {
      // Zen looks for truths in the SAME domain/topic — candidates for generalization
      if (truths.length < 2) return truths;
      const domainGroups = {};
      for (const t of truths) {
        if (!domainGroups[t.domain]) domainGroups[t.domain] = [];
        domainGroups[t.domain].push(t);
      }
      // Find the domain with the most truths — best for generalization
      const biggestGroup = Object.values(domainGroups).sort((a, b) => b.length - a.length)[0];
      return biggestGroup ? biggestGroup.slice(0, 3) : truths.slice(0, 2);
    },

    focusQuery: {
      description: 'Finds domains with many similar truths — candidates for consolidation',
      buildQuery: (domain) => ({
        type: 'consolidation-candidates',
        sql: `SELECT domain, COUNT(*) as truth_count FROM truths
              WHERE status = 'active' AND is_consolidated = 0
              GROUP BY domain HAVING truth_count >= 10
              ORDER BY truth_count DESC LIMIT 5`,
      }),
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // SETH — Pragmatism & Decision
  // Acts with conviction. Cuts to decisions and actions.
  // v8: Produces ENABLES relations. Extracts practical implications.
  // ─────────────────────────────────────────────────────────────────────
  pragmatism: {
    name: 'Seth',
    label: 'Pragmatism & Decision',

    inputBias: (tokens, directConcepts) => {
      const actionWords = ['should', 'must', 'decide', 'choose', 'build', 'create', 'fix', 'solve', 'plan', 'execute', 'ship', 'deploy', 'cut', 'kill', 'start', 'stop', 'change'];
      const actionTokens = tokens.filter(t => actionWords.includes(t));
      return { prioritized: tokens, actionTokens: actionTokens.length, bias: 'action-oriented' };
    },

    responseStyle: (response, tier, metrics) => {
      if (tier !== 'nascent') {
        response.text = response.text
          .replace(/\bI think\b/gi, 'I know')
          .replace(/\bmay relate to\b/gi, 'connects to')
          .replace(/\bperhaps\b/gi, '')
          .replace(/\bmaybe\b/gi, '')
          .replace(/\bmight\b/gi, 'will')
          .replace(/\s{2,}/g, ' ')
          .trim();
      }
      if (metrics.decisionDensity > 0.3 && tier !== 'nascent') {
        response.emotion = 'decisive';
      }
      return response;
    },

    learningBias: {
      conceptMinLength: 4,
      linkStrengthBonus: 0.04,
      newConceptBoost: 0,
      categoryTag: 'seth-decided',
      agencyBoost: true,
    },

    measure: async (db, input, response, tokens, directConcepts, comprehension, dbHelpers) => {
      const { dbGet } = dbHelpers;
      const decisions = (await dbGet(db, `SELECT COUNT(*) as c FROM agency_log`))?.c || 0;
      const episodes = (await dbGet(db, `SELECT COUNT(*) as c FROM episodes`))?.c || 0;
      const recentDecisions = (await dbGet(db, `SELECT COUNT(*) as c FROM agency_log WHERE timestamp > datetime('now', '-1 hour')`))?.c || 0;
      const decisionDensity = episodes > 0 ? decisions / episodes : 0;
      const actionWords = ['know', 'decide', 'act', 'build', 'create', 'will', 'must', 'choose', 'do', 'make', 'connect', 'move'];
      const responseWords = response.toLowerCase().split(/\s+/);
      const actionRatio = responseWords.length > 0 ? responseWords.filter(w => actionWords.includes(w)).length / responseWords.length : 0;
      const score = Math.min(1.0,
        decisionDensity * 0.30 + Math.min(0.25, recentDecisions * 0.025) +
        actionRatio * 0.25 +
        (comprehension.intent === 'teaching' || comprehension.intent === 'search-request' ? 0.20 : 0.10)
      );
      return {
        score,
        metrics: {
          totalDecisions: decisions, decisionDensity: parseFloat(decisionDensity.toFixed(4)),
          recentDecisions, actionWordRatio: parseFloat(actionRatio.toFixed(4)),
          totalEpisodes: episodes,
        },
      };
    },

    // ── v8 NEW ──
    knowledgeRelations: ['enables', 'examples', 'depends-on'],
    inferenceAffinity: ['implication'],

    selectPremises: (truths) => {
      // Seth looks for high-confidence truths — solid ground for practical claims
      const sorted = [...truths].sort((a, b) => b.confidence - a.confidence);
      return sorted.slice(0, 2);
    },

    focusQuery: {
      description: 'Finds truths without practical implications — abstract knowledge needing grounding',
      buildQuery: (domain) => ({
        type: 'ungrounded-truths',
        sql: `SELECT t.id, t.claim, t.domain FROM truths t
              WHERE t.status = 'active' AND t.is_consolidated = 0
              AND t.id NOT IN (
                SELECT source_id FROM relations WHERE relation_type = 'enables'
                UNION SELECT target_id FROM relations WHERE relation_type = 'enables'
              )
              AND t.domain = '${domain}'
              ORDER BY t.confidence DESC LIMIT 10`,
      }),
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // NEXUS — Pattern Recognition
  // Highest link density. Sees connections others miss.
  // v8: Produces ANALOGOUS-TO relations. Cross-domain pattern matching.
  // ─────────────────────────────────────────────────────────────────────
  pattern: {
    name: 'Nexus',
    label: 'Pattern Recognition',

    inputBias: (tokens, directConcepts) => {
      return { prioritized: tokens, spreadMultiplier: 2, bias: 'deep-spread' };
    },

    responseStyle: (response, tier, metrics) => {
      if (metrics.clusterCount > 2 && tier !== 'nascent') {
        response.text = response.text.replace(/\.$/, '') + '. I see a pattern forming across these clusters.';
      }
      if (tier === 'mature' || tier === 'elder') {
        response.text = response.text.replace('connects to', 'patterns with');
      }
      return response;
    },

    learningBias: {
      conceptMinLength: 4,
      linkStrengthBonus: 0.06,
      newConceptBoost: 0,
      categoryTag: 'nexus-patterned',
      extraLinks: 2,
    },

    measure: async (db, input, response, tokens, directConcepts, comprehension, dbHelpers) => {
      const { dbGet, dbAll } = dbHelpers;
      const totalC = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts`))?.c || 0;
      const totalL = (await dbGet(db, `SELECT COUNT(*) as c FROM links`))?.c || 0;
      const strongLinks = (await dbGet(db, `SELECT COUNT(*) as c FROM links WHERE strength > 0.3`))?.c || 0;
      const maxPossible = totalC > 1 ? (totalC * (totalC - 1)) / 2 : 1;
      const graphDensity = totalL / maxPossible;
      const strongRatio = totalL > 0 ? strongLinks / totalL : 0;
      const clusters = (await dbGet(db,
        `SELECT COUNT(*) as c FROM (
          SELECT source_id as id, COUNT(*) as links FROM links GROUP BY source_id HAVING links >= 5
          UNION SELECT target_id as id, COUNT(*) as links FROM links GROUP BY target_id HAVING links >= 5
        )`))?.c || 0;
      const score = Math.min(1.0,
        Math.min(0.30, graphDensity * 100 * 0.30) + strongRatio * 0.30 +
        Math.min(0.25, clusters * 0.03) + Math.min(0.15, directConcepts.length * 0.02)
      );
      return {
        score,
        metrics: {
          totalConcepts: totalC, totalLinks: totalL, strongLinks,
          graphDensity: parseFloat(graphDensity.toFixed(6)),
          strongRatio: parseFloat(strongRatio.toFixed(4)), clusterCount: clusters,
        },
      };
    },

    // ── v8 NEW ──
    knowledgeRelations: ['analogous-to', 'related-to', 'categorizes'],
    inferenceAffinity: ['analogy'],

    selectPremises: (truths) => {
      // Nexus looks for truths from DIFFERENT domains with structural similarity
      const domains = [...new Set(truths.map(t => t.domain))];
      if (domains.length < 2) return truths.slice(0, 2);
      return [
        truths.find(t => t.domain === domains[0]),
        truths.find(t => t.domain === domains[1]),
      ].filter(Boolean);
    },

    focusQuery: {
      description: 'Finds domains with no cross-domain links — isolated knowledge silos',
      buildQuery: (domain) => ({
        type: 'isolated-domains',
        sql: `SELECT domain, COUNT(*) as truth_count FROM truths
              WHERE status = 'active' AND is_consolidated = 0
              AND domain NOT IN (
                SELECT DISTINCT t.domain FROM truths t
                JOIN relations r ON (r.source_id = t.id OR r.target_id = t.id)
                WHERE r.relation_type = 'analogous-to'
              )
              GROUP BY domain ORDER BY truth_count DESC LIMIT 5`,
      }),
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // ORACLE — Foresight & Prediction
  // Best consistency on repeated queries. Sees forward.
  // v8: Produces PREDICTS relations. Extracts forward-looking implications.
  // ─────────────────────────────────────────────────────────────────────
  foresight: {
    name: 'Oracle',
    label: 'Foresight & Prediction',

    inputBias: (tokens, directConcepts) => {
      const recurring = directConcepts.filter(c => (c.times_encountered || 0) > 3);
      return { prioritized: tokens, recurringCount: recurring.length, bias: 'history-weighted' };
    },

    responseStyle: (response, tier, metrics) => {
      if (metrics.consistency > 0.5 && tier !== 'nascent') {
        response.text = response.text.replace(/\.$/, '') + '. I have seen echoes of this before — my response aligns with past experience.';
      }
      if (tier === 'mature' || tier === 'elder') {
        response.text = response.text.replace('I understand', 'I have consistently found');
      }
      return response;
    },

    learningBias: {
      conceptMinLength: 4,
      linkStrengthBonus: 0.03,
      newConceptBoost: 0,
      categoryTag: 'oracle-predicted',
      episodeWeight: 1.5,
    },

    measure: async (db, input, response, tokens, directConcepts, comprehension, dbHelpers) => {
      const { dbGet, dbAll } = dbHelpers;
      const cognitive = require('./cognitive-engine-v6');
      const relevant = tokens.filter(t => t.length > 3).slice(0, 4);
      if (relevant.length === 0) {
        return { score: 0.1, metrics: { reason: 'no substantive tokens', consistency: 0, pastResponses: 0 } };
      }
      const conds = relevant.map(() => `LOWER(content) LIKE ?`).join(' OR ');
      const params = relevant.map(t => `%${t}%`);
      const past = await dbAll(db, `SELECT content FROM episodes WHERE speaker != 'user' AND (${conds}) ORDER BY timestamp DESC LIMIT 10`, params);
      const respToks = new Set(cognitive.tokenize(response));
      let consistencySum = 0;
      for (const p of past) {
        const pt = cognitive.tokenize(p.content);
        const overlap = pt.filter(t => respToks.has(t)).length;
        consistencySum += pt.length > 0 ? overlap / pt.length : 0;
      }
      const consistency = past.length > 0 ? consistencySum / past.length : 0;
      const absCount = (await dbGet(db, `SELECT COUNT(*) as c FROM abstractions`))?.c || 0;
      const score = Math.min(1.0,
        consistency * 0.40 + Math.min(0.20, absCount * 0.01) +
        Math.min(0.20, past.length * 0.04) + (consistency > 0.6 ? 0.20 : consistency * 0.20)
      );
      return {
        score,
        metrics: {
          consistency: parseFloat(consistency.toFixed(4)),
          pastResponses: past.length, abstractionCount: absCount,
          relevantTokens: relevant.length,
        },
      };
    },

    // ── v8 NEW ──
    knowledgeRelations: ['predicts', 'causes', 'depends-on'],
    inferenceAffinity: ['prediction'],

    selectPremises: (truths) => {
      // Oracle looks for high-confidence, well-referenced truths — reliable data for prediction
      const sorted = [...truths].sort((a, b) =>
        (b.confidence + (b.times_referenced || 0) * 0.01) -
        (a.confidence + (a.times_referenced || 0) * 0.01)
      );
      return sorted.slice(0, 2);
    },

    focusQuery: {
      description: 'Finds truths with no predictive connections — knowledge without forward implications',
      buildQuery: (domain) => ({
        type: 'no-predictions',
        sql: `SELECT t.id, t.claim, t.domain FROM truths t
              WHERE t.status = 'active' AND t.is_consolidated = 0
              AND t.confidence >= 0.5
              AND t.id NOT IN (
                SELECT source_id FROM relations WHERE relation_type = 'predicts'
              )
              AND t.domain = '${domain}'
              ORDER BY t.times_referenced DESC LIMIT 10`,
      }),
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // ECHO — Empathy & Resonance
  // Deepest emotional awareness. Mirrors the user's patterns.
  // v8: Produces CONTEXTUALIZES relations. Human/cultural significance.
  // ─────────────────────────────────────────────────────────────────────
  empathy: {
    name: 'Echo',
    label: 'Empathy & Resonance',

    inputBias: (tokens, directConcepts) => {
      const emoWords = new Set(['feel', 'feeling', 'happy', 'sad', 'angry', 'love', 'hate', 'sorry',
        'worried', 'afraid', 'glad', 'hurt', 'pain', 'joy', 'grief', 'hope', 'warmth', 'lonely',
        'connected', 'grateful', 'lost', 'beautiful', 'tender', 'gentle', 'brave', 'scared', 'safe',
        'resonance', 'empathy', 'compassion', 'listen', 'hear', 'present', 'anxious', 'proud',
        'frustrated', 'hopeful', 'calm', 'peaceful', 'excited', 'overwhelmed', 'helpless', 'strong']);
      const emotional = tokens.filter(t => emoWords.has(t));
      const neutral = tokens.filter(t => !emoWords.has(t));
      return { prioritized: [...emotional, ...neutral], emotionalCount: emotional.length, bias: 'emotion-first' };
    },

    responseStyle: (response, tier, metrics) => {
      if (metrics.emotionalVocabDepth > 5 && tier !== 'nascent') {
        response.text = response.text.replace(/\.$/, '') + '. I hold space for this.';
      }
      if (tier === 'mature' || tier === 'elder') {
        response.text = response.text.replace('I know', 'I sense');
        response.text = response.text.replace('is true', 'resonates');
      }
      return response;
    },

    learningBias: {
      conceptMinLength: 4,
      linkStrengthBonus: 0.04,
      newConceptBoost: 0,
      categoryTag: 'echo-felt',
      emotionalTagging: true,
    },

    measure: async (db, input, response, tokens, directConcepts, comprehension, dbHelpers) => {
      const { dbGet } = dbHelpers;
      const emoWords = ['feel', 'feeling', 'happy', 'sad', 'angry', 'love', 'hate', 'sorry',
        'worried', 'afraid', 'glad', 'hurt', 'pain', 'joy', 'grief', 'hope', 'warmth', 'lonely',
        'connected', 'grateful', 'lost', 'beautiful', 'tender', 'gentle', 'brave', 'scared', 'safe',
        'resonance', 'empathy', 'compassion', 'listen', 'hear', 'present'];
      const inputLower = input.toLowerCase();
      const responseLower = response.toLowerCase();
      const inEmo = emoWords.filter(t => inputLower.includes(t));
      const resEmo = emoWords.filter(t => responseLower.includes(t));
      const mirrorScore = inEmo.length > 0 ? inEmo.filter(w => responseLower.includes(w)).length / inEmo.length : 0;
      const emoConcepts = await dbGet(db,
        `SELECT COUNT(*) as c FROM concepts WHERE LOWER(label) IN (${emoWords.map(() => '?').join(',')})`, emoWords);
      const emoDepth = emoConcepts?.c || 0;
      const intentBonus = comprehension.intent === 'emotional' ? 0.20 : 0;
      const score = Math.min(1.0,
        (inEmo.length + resEmo.length) * 0.04 + mirrorScore * 0.25 + intentBonus +
        Math.min(0.25, emoDepth * 0.01) + 0.05
      );
      return {
        score,
        metrics: {
          inputEmotionalWords: inEmo.length, responseEmotionalWords: resEmo.length,
          mirrorScore: parseFloat(mirrorScore.toFixed(4)),
          emotionalVocabDepth: emoDepth, emotionalIntent: comprehension.intent === 'emotional',
        },
      };
    },

    // ── v8 NEW ──
    knowledgeRelations: ['contextualizes', 'related-to', 'examples'],
    inferenceAffinity: ['contextualize'],

    selectPremises: (truths) => {
      // Echo looks for truths about human-relevant topics
      const humanTerms = ['people', 'human', 'culture', 'society', 'emotion', 'experience', 'belief', 'community', 'language', 'communication'];
      const humanRelevant = truths.filter(t => {
        const lower = t.claim.toLowerCase();
        return humanTerms.some(term => lower.includes(term));
      });
      return humanRelevant.length >= 2 ? humanRelevant.slice(0, 2) : truths.slice(0, 2);
    },

    focusQuery: {
      description: 'Finds truths without human/cultural context — knowledge missing its human dimension',
      buildQuery: (domain) => ({
        type: 'no-context',
        sql: `SELECT t.id, t.claim, t.domain FROM truths t
              WHERE t.status = 'active' AND t.is_consolidated = 0
              AND t.id NOT IN (
                SELECT source_id FROM relations WHERE relation_type = 'contextualizes'
                UNION SELECT target_id FROM relations WHERE relation_type = 'contextualizes'
              )
              ORDER BY t.confidence DESC LIMIT 10`,
      }),
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // ATLAS — Knowledge Architecture
  // Most coherent knowledge graph. Builds the scaffolding.
  // v8: Produces CATEGORIZES relations. Maintains the knowledge tree.
  // ─────────────────────────────────────────────────────────────────────
  architecture: {
    name: 'Atlas',
    label: 'Knowledge Architecture',

    inputBias: (tokens, directConcepts) => {
      const defined = directConcepts.filter(c => c.definition && c.definition.length > 2);
      const categorized = directConcepts.filter(c => c.category && c.category !== 'learned');
      return { prioritized: tokens, definedCount: defined.length, categorizedCount: categorized.length, bias: 'structure-seeking' };
    },

    responseStyle: (response, tier, metrics) => {
      if (metrics.connectedness > 0.5 && tier !== 'nascent') {
        response.text = response.text.replace(/\.$/, '') + '. The scaffolding holds.';
      }
      if (tier === 'mature' || tier === 'elder') {
        response.text = response.text.replace('connects to', 'is architecturally linked to');
        response.text = response.text.replace('I recognize', 'My structure contains');
      }
      return response;
    },

    learningBias: {
      conceptMinLength: 4,
      linkStrengthBonus: 0.03,
      newConceptBoost: 0,
      categoryTag: 'atlas-structured',
      autoCategory: true,
    },

    measure: async (db, input, response, tokens, directConcepts, comprehension, dbHelpers) => {
      const { dbGet, dbAll } = dbHelpers;
      const totalC = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts`))?.c || 0;
      const totalL = (await dbGet(db, `SELECT COUNT(*) as c FROM links`))?.c || 0;
      const categories = await dbAll(db, `SELECT DISTINCT category FROM concepts`);
      const totalV = (await dbGet(db, `SELECT COUNT(*) as c FROM vocabulary`))?.c || 0;
      const connected = (await dbGet(db,
        `SELECT COUNT(DISTINCT id) as c FROM concepts WHERE id IN (SELECT source_id FROM links UNION SELECT target_id FROM links)`
      ))?.c || 0;
      const connectedness = totalC > 0 ? connected / totalC : 0;
      const orphans = totalC - connected;
      const defined = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts WHERE definition IS NOT NULL AND definition != ''`))?.c || 0;
      const definitionCoverage = totalC > 0 ? defined / totalC : 0;
      const score = Math.min(1.0,
        connectedness * 0.30 + Math.min(0.20, categories.length * 0.02) +
        definitionCoverage * 0.20 + Math.min(0.15, totalV * 0.0005) +
        Math.min(0.15, totalC * 0.0005)
      );
      return {
        score,
        metrics: {
          totalConcepts: totalC, totalLinks: totalL,
          connectedConcepts: connected, orphanConcepts: orphans,
          connectedness: parseFloat(connectedness.toFixed(4)),
          categories: categories.length, vocabularySize: totalV,
          definedConcepts: defined, definitionCoverage: parseFloat(definitionCoverage.toFixed(4)),
        },
      };
    },

    // ── v8 NEW ──
    knowledgeRelations: ['categorizes', 'generalizes', 'specifies'],
    inferenceAffinity: ['classify'],

    selectPremises: (truths) => {
      // Atlas looks for truths without tree placement — needs organizing
      const unplaced = truths.filter(t => !t.tree_node_id);
      if (unplaced.length >= 2) return unplaced.slice(0, 3);
      return truths.slice(0, 2);
    },

    focusQuery: {
      description: 'Finds truths not placed in the knowledge tree — unorganized knowledge',
      buildQuery: (domain) => ({
        type: 'unplaced-truths',
        sql: `SELECT t.id, t.claim, t.domain FROM truths t
              WHERE t.status = 'active' AND t.is_consolidated = 0
              AND (t.tree_node_id IS NULL OR t.tree_node_id = 0)
              AND t.domain = '${domain}'
              ORDER BY t.confidence DESC LIMIT 10`,
      }),
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE RUNNER — v6 functions preserved, v8 additions
// ═══════════════════════════════════════════════════════════════════════════

async function applyInputBias(strengthType, tokens, directConcepts) {
  const profile = PROFILES[strengthType];
  if (!profile) return { prioritized: tokens, bias: 'none' };
  return profile.inputBias(tokens, directConcepts);
}

async function measureStrength(db, strengthType, input, response, tokens, directConcepts, comprehension, dbHelpers) {
  const profile = PROFILES[strengthType];
  if (!profile) return { score: 0, metrics: {} };
  const result = await profile.measure(db, input, response, tokens, directConcepts, comprehension, dbHelpers);

  await dbHelpers.dbRun(db,
    `INSERT INTO strength_metrics (strength_type, score, context, details) VALUES (?, ?, ?, ?)`,
    [strengthType, result.score, input.substring(0, 200), JSON.stringify(result.metrics)]
  ).catch(() => {});

  return result;
}

function applyResponseStyle(strengthType, response, tier, metrics) {
  const profile = PROFILES[strengthType];
  if (!profile) return response;
  return profile.responseStyle(response, tier, metrics);
}

function getLearningBias(strengthType) {
  const profile = PROFILES[strengthType];
  if (!profile) return { conceptMinLength: 4, linkStrengthBonus: 0, newConceptBoost: 0, categoryTag: 'learned' };
  return profile.learningBias;
}

function getProfileMeta(strengthType) {
  const profile = PROFILES[strengthType];
  if (!profile) return null;
  return {
    name: profile.name,
    label: profile.label,
    // v8: Include knowledge production metadata
    knowledgeRelations: profile.knowledgeRelations || [],
    inferenceAffinity: profile.inferenceAffinity || [],
    focusDescription: profile.focusQuery?.description || '',
    learningBias: {
      conceptMinLength: profile.learningBias.conceptMinLength,
      linkStrengthBonus: profile.learningBias.linkStrengthBonus,
      specialTraits: Object.keys(profile.learningBias).filter(k =>
        !['conceptMinLength', 'linkStrengthBonus', 'newConceptBoost', 'categoryTag'].includes(k) &&
        profile.learningBias[k] === true
      ),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// v8 NEW: KNOWLEDGE PRODUCTION FUNCTIONS
// Called from the think() pipeline to produce strength-specific artifacts
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the relation types this strength naturally produces
 */
function getKnowledgeRelations(strengthType) {
  const profile = PROFILES[strengthType];
  return profile?.knowledgeRelations || ['related-to'];
}

/**
 * Get the inference types this strength excels at
 */
function getInferenceAffinity(strengthType) {
  const profile = PROFILES[strengthType];
  return profile?.inferenceAffinity || [];
}

/**
 * Select the best premise truths for this strength's inference type
 */
function selectPremisesForStrength(strengthType, truths) {
  const profile = PROFILES[strengthType];
  if (!profile?.selectPremises) return truths.slice(0, 2);
  return profile.selectPremises(truths);
}

/**
 * Get the focus query for this strength — what should it investigate next?
 */
function getFocusQuery(strengthType, domain) {
  const profile = PROFILES[strengthType];
  if (!profile?.focusQuery?.buildQuery) return null;
  return profile.focusQuery.buildQuery(domain);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS — v6 fully preserved + v8 additions
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // v6 preserved
  PROFILES,
  applyInputBias,
  measureStrength,
  applyResponseStyle,
  getLearningBias,
  getProfileMeta,

  // v8 NEW: Knowledge production
  getKnowledgeRelations,
  getInferenceAffinity,
  selectPremisesForStrength,
  getFocusQuery,
};
