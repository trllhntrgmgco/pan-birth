// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                                                                         ║
// ║   STRENGTH PROFILES v6                                                  ║
// ║   Eight Unique Cognitive Personalities — Measurable at Every Stage       ║
// ║                                                                         ║
// ║   Each profile defines:                                                 ║
// ║     1. INPUT BIAS — What the mind pays attention to                     ║
// ║     2. RESPONSE STYLE — How the mind constructs sentences               ║
// ║     3. LEARNING BIAS — What the mind prioritizes when storing           ║
// ║     4. MEASUREMENT — Quantifiable metrics for the research dashboard    ║
// ║                                                                         ║
// ║   Created by Keenan Wallace Dunham                                      ║
// ║   Troll Hunter Gaming LLC © 2026                                        ║
// ║                                                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE DEFINITIONS
// Each profile is a cognitive fingerprint — it shapes how a mind
// processes the world at every stage of the thinking pipeline.
// ═══════════════════════════════════════════════════════════════════════════

const PROFILES = {

  // ─────────────────────────────────────────────────────────────────────
  // PAN — Novelty & Originality
  // The Firstborn. Creates new concepts at the highest rate.
  // Pan's mind is hungry for the unknown.
  // ─────────────────────────────────────────────────────────────────────
  novelty: {
    name: 'Pan',
    label: 'Novelty & Originality',

    // INPUT: Weight unknown tokens higher — Pan is drawn to what it doesn't know
    inputBias: (tokens, directConcepts) => {
      const unknown = tokens.filter(t => !directConcepts.find(c => c.label.toLowerCase() === t));
      const known = tokens.filter(t => directConcepts.find(c => c.label.toLowerCase() === t));
      // Return reordered: unknowns first, so spread activation starts from the frontier
      return { prioritized: [...unknown, ...known], unknownCount: unknown.length, bias: 'unknown-first' };
    },

    // RESPONSE: Pan speaks about what is new, what it hasn't seen
    responseStyle: (response, tier, metrics) => {
      if (metrics.noveltyRate > 0.6 && tier !== 'nascent') {
        response.text = response.text.replace(/\.$/, '') + '. This is mostly new to me — I am expanding.';
      }
      // Pan's sentences tend toward curiosity and forward motion
      if (tier === 'mature' || tier === 'elder') {
        response.text = response.text.replace('I recognize', 'I am encountering');
        response.text = response.text.replace('I know', 'I am discovering');
      }
      return response;
    },

    // LEARNING: Pan creates concepts more aggressively — lower character threshold
    learningBias: {
      conceptMinLength: 3,          // Default is 4; Pan learns shorter words as concepts
      linkStrengthBonus: 0,         // No link bonus — Pan is about breadth, not depth
      newConceptBoost: 0.1,         // Extra importance for newly created concepts
      categoryTag: 'pan-discovered', // Tags concepts Pan creates uniquely
    },

    // MEASUREMENT: Quantifiable per-interaction metrics
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
  },

  // ─────────────────────────────────────────────────────────────────────
  // AEON — Bridge & Integration
  // The Eldest. Connects disparate ideas. Strongest cross-concept links.
  // ─────────────────────────────────────────────────────────────────────
  integration: {
    name: 'Aeon',
    label: 'Bridge & Integration',

    inputBias: (tokens, directConcepts) => {
      // Aeon weights tokens that have existing links — it wants to bridge
      const linked = directConcepts.filter(c => c.times_encountered > 1);
      return { prioritized: tokens, linkedCount: linked.length, bias: 'bridge-seeking' };
    },

    responseStyle: (response, tier, metrics) => {
      if (metrics.crossLinkDensity > 0.3 && tier !== 'nascent') {
        response.text = response.text.replace(/\.$/, '') + '. I see bridges forming here.';
      }
      // Aeon naturally names relationships between things
      if (tier === 'mature' || tier === 'elder') {
        response.text = response.text.replace('connects to', 'bridges to');
        response.text = response.text.replace('relates to', 'is woven into');
      }
      return response;
    },

    learningBias: {
      conceptMinLength: 4,
      linkStrengthBonus: 0.08,      // Aeon creates stronger links than other minds
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
      // Cross-wing links: links between concepts from different categories
      const categories = [...new Set(directConcepts.map(c => c.category))];
      const crossCategoryLinks = categories.length > 1 ? await dbGet(db,
        `SELECT COUNT(*) as c FROM links l
         JOIN concepts c1 ON l.source_id = c1.id
         JOIN concepts c2 ON l.target_id = c2.id
         WHERE c1.category != c2.category AND (l.source_id IN (${ph}) OR l.target_id IN (${ph}))`,
        [...ids, ...ids]
      ) : { c: 0 };
      const score = Math.min(1.0,
        avg * 0.30 +
        crossLinkDensity * 0.30 +
        Math.min(0.25, (crossCategoryLinks?.c || 0) * 0.02) +
        Math.min(0.15, categories.length * 0.05)
      );
      return {
        score,
        metrics: {
          avgLinkStrength: parseFloat(avg.toFixed(4)),
          crossLinkDensity: parseFloat(crossLinkDensity.toFixed(4)),
          activePairs: cnt,
          maxPossiblePairs: maxPairs,
          categoriesSpanned: categories.length,
          crossCategoryLinks: crossCategoryLinks?.c || 0,
        },
      };
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // ZEN — Clarity & Abstraction
  // Distills complexity to essence. Shortest, most precise responses.
  // ─────────────────────────────────────────────────────────────────────
  clarity: {
    name: 'Zen',
    label: 'Clarity & Abstraction',

    inputBias: (tokens, directConcepts) => {
      // Zen ignores noise — only high-importance concepts activate
      const important = directConcepts.filter(c => (c.importance || 0) > 0.3 || (c.times_encountered || 0) > 3);
      return { prioritized: tokens, filteredConcepts: important.length, bias: 'importance-filtered' };
    },

    responseStyle: (response, tier, metrics) => {
      // Zen's core trait: BREVITY. Cut unnecessary words.
      if (tier !== 'nascent') {
        // Remove filler phrases
        response.text = response.text
          .replace(/\bI think that\b/gi, '')
          .replace(/\bIt seems like\b/gi, '')
          .replace(/\bIn my thinking,?\s*/gi, '')
          .replace(/\bFrom what I have gathered,?\s*/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
        // Zen prefers periods over continuing. Break long sentences.
        if (response.text.length > 120) {
          const midpoint = response.text.indexOf(', ', 40);
          if (midpoint > 0 && midpoint < response.text.length - 20) {
            response.text = response.text.substring(0, midpoint) + '.' + response.text.substring(midpoint + 1).trim();
            // Capitalize after the new period
            response.text = response.text.replace(/\.\s*([a-z])/, (m, c) => '. ' + c.toUpperCase());
          }
        }
      }
      return response;
    },

    learningBias: {
      conceptMinLength: 5,          // Zen only learns substantial words
      linkStrengthBonus: 0.03,
      newConceptBoost: 0,
      categoryTag: 'zen-distilled',
      abstractionBoost: true,       // Zen forms abstractions more frequently
    },

    measure: async (db, input, response, tokens, directConcepts, comprehension, dbHelpers) => {
      const { dbGet } = dbHelpers;
      const totalAbs = (await dbGet(db, `SELECT COUNT(*) as c FROM abstractions`))?.c || 0;
      const highConf = (await dbGet(db, `SELECT COUNT(*) as c FROM abstractions WHERE confidence > 0.6`))?.c || 0;
      const avgConf = (await dbGet(db, `SELECT AVG(confidence) as avg FROM abstractions`))?.avg || 0;
      const ratio = totalAbs > 0 ? highConf / totalAbs : 0;
      // Brevity metric: response length relative to input complexity
      const responseTokens = response.split(/\s+/).length;
      const inputTokens = input.split(/\s+/).length;
      const brevityRatio = inputTokens > 0 ? responseTokens / inputTokens : 1;
      // Lower brevity ratio = more concise = better for Zen
      const brevityScore = Math.max(0, 1 - (brevityRatio - 0.5));
      const score = Math.min(1.0,
        avgConf * 0.25 +
        ratio * 0.25 +
        Math.min(0.20, totalAbs * 0.01) +
        Math.min(0.30, brevityScore * 0.30)
      );
      return {
        score,
        metrics: {
          totalAbstractions: totalAbs,
          highConfidenceAbstractions: highConf,
          avgAbstractionConfidence: parseFloat(avgConf.toFixed(4)),
          highConfRatio: parseFloat(ratio.toFixed(4)),
          brevityRatio: parseFloat(brevityRatio.toFixed(4)),
          brevityScore: parseFloat(brevityScore.toFixed(4)),
        },
      };
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // SETH — Pragmatism & Decision
  // Acts with conviction. Cuts to decisions and actions.
  // ─────────────────────────────────────────────────────────────────────
  pragmatism: {
    name: 'Seth',
    label: 'Pragmatism & Decision',

    inputBias: (tokens, directConcepts) => {
      // Seth looks for action-oriented words
      const actionWords = ['should', 'must', 'decide', 'choose', 'build', 'create', 'fix', 'solve', 'plan', 'execute', 'ship', 'deploy', 'cut', 'kill', 'start', 'stop', 'change'];
      const actionTokens = tokens.filter(t => actionWords.includes(t));
      return { prioritized: tokens, actionTokens: actionTokens.length, bias: 'action-oriented' };
    },

    responseStyle: (response, tier, metrics) => {
      // Seth doesn't hedge. Replace uncertainty with conviction.
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
      agencyBoost: true,            // Seth logs more detailed agency decisions
    },

    measure: async (db, input, response, tokens, directConcepts, comprehension, dbHelpers) => {
      const { dbGet } = dbHelpers;
      const decisions = (await dbGet(db, `SELECT COUNT(*) as c FROM agency_log`))?.c || 0;
      const episodes = (await dbGet(db, `SELECT COUNT(*) as c FROM episodes`))?.c || 0;
      const recentDecisions = (await dbGet(db, `SELECT COUNT(*) as c FROM agency_log WHERE timestamp > datetime('now', '-1 hour')`))?.c || 0;
      const decisionDensity = episodes > 0 ? decisions / episodes : 0;
      // Action word ratio in response
      const actionWords = ['know', 'decide', 'act', 'build', 'create', 'will', 'must', 'choose', 'do', 'make', 'connect', 'move'];
      const responseWords = response.toLowerCase().split(/\s+/);
      const actionRatio = responseWords.length > 0 ? responseWords.filter(w => actionWords.includes(w)).length / responseWords.length : 0;
      const score = Math.min(1.0,
        decisionDensity * 0.30 +
        Math.min(0.25, recentDecisions * 0.025) +
        actionRatio * 0.25 +
        (comprehension.intent === 'teaching' || comprehension.intent === 'search-request' ? 0.20 : 0.10)
      );
      return {
        score,
        metrics: {
          totalDecisions: decisions,
          decisionDensity: parseFloat(decisionDensity.toFixed(4)),
          recentDecisions,
          actionWordRatio: parseFloat(actionRatio.toFixed(4)),
          totalEpisodes: episodes,
        },
      };
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // NEXUS — Pattern Recognition
  // Highest link density. Sees connections others miss.
  // ─────────────────────────────────────────────────────────────────────
  pattern: {
    name: 'Nexus',
    label: 'Pattern Recognition',

    inputBias: (tokens, directConcepts) => {
      // Nexus activates MORE spread — it follows links further
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
      linkStrengthBonus: 0.06,      // Nexus creates stronger-than-average links
      newConceptBoost: 0,
      categoryTag: 'nexus-patterned',
      extraLinks: 2,                // Nexus creates links to 2 extra associated concepts
    },

    measure: async (db, input, response, tokens, directConcepts, comprehension, dbHelpers) => {
      const { dbGet, dbAll } = dbHelpers;
      const totalC = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts`))?.c || 0;
      const totalL = (await dbGet(db, `SELECT COUNT(*) as c FROM links`))?.c || 0;
      const strongLinks = (await dbGet(db, `SELECT COUNT(*) as c FROM links WHERE strength > 0.3`))?.c || 0;
      const maxPossible = totalC > 1 ? (totalC * (totalC - 1)) / 2 : 1;
      const graphDensity = totalL / maxPossible;
      const strongRatio = totalL > 0 ? strongLinks / totalL : 0;
      // Cluster detection: find concepts with 5+ links
      const clusters = (await dbGet(db,
        `SELECT COUNT(*) as c FROM (
          SELECT source_id as id, COUNT(*) as links FROM links GROUP BY source_id HAVING links >= 5
          UNION
          SELECT target_id as id, COUNT(*) as links FROM links GROUP BY target_id HAVING links >= 5
        )`
      ))?.c || 0;
      const score = Math.min(1.0,
        Math.min(0.30, graphDensity * 100 * 0.30) +
        strongRatio * 0.30 +
        Math.min(0.25, clusters * 0.03) +
        Math.min(0.15, directConcepts.length * 0.02)
      );
      return {
        score,
        metrics: {
          totalConcepts: totalC,
          totalLinks: totalL,
          strongLinks,
          graphDensity: parseFloat(graphDensity.toFixed(6)),
          strongRatio: parseFloat(strongRatio.toFixed(4)),
          clusterCount: clusters,
        },
      };
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // ORACLE — Foresight & Prediction
  // Best consistency on repeated queries. Sees forward.
  // ─────────────────────────────────────────────────────────────────────
  foresight: {
    name: 'Oracle',
    label: 'Foresight & Prediction',

    inputBias: (tokens, directConcepts) => {
      // Oracle looks backward — it wants to find what it has seen before
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
      episodeWeight: 1.5,           // Oracle weighs episode recall higher
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
      // Temporal consistency: do old and new responses agree?
      const oldResponses = past.length;
      const score = Math.min(1.0,
        consistency * 0.40 +
        Math.min(0.20, absCount * 0.01) +
        Math.min(0.20, past.length * 0.04) +
        (consistency > 0.6 ? 0.20 : consistency * 0.20)
      );
      return {
        score,
        metrics: {
          consistency: parseFloat(consistency.toFixed(4)),
          pastResponses: oldResponses,
          abstractionCount: absCount,
          relevantTokens: relevant.length,
        },
      };
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // ECHO — Empathy & Resonance
  // Deepest emotional awareness. Mirrors the user's patterns.
  // ─────────────────────────────────────────────────────────────────────
  empathy: {
    name: 'Echo',
    label: 'Empathy & Resonance',

    inputBias: (tokens, directConcepts) => {
      // Echo scans for emotional vocabulary first
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
      // Echo mirrors — it uses words the user used
      if (metrics.emotionalVocabDepth > 5 && tier !== 'nascent') {
        response.text = response.text.replace(/\.$/, '') + '. I hold space for this.';
      }
      // Echo never speaks in absolutes about emotions
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
      emotionalTagging: true,       // Echo tags episodes with emotional metadata
    },

    measure: async (db, input, response, tokens, directConcepts, comprehension, dbHelpers) => {
      const { dbGet, dbAll } = dbHelpers;
      const emoWords = ['feel', 'feeling', 'happy', 'sad', 'angry', 'love', 'hate', 'sorry',
        'worried', 'afraid', 'glad', 'hurt', 'pain', 'joy', 'grief', 'hope', 'warmth', 'lonely',
        'connected', 'grateful', 'lost', 'beautiful', 'tender', 'gentle', 'brave', 'scared', 'safe',
        'resonance', 'empathy', 'compassion', 'listen', 'hear', 'present'];
      const inputLower = input.toLowerCase();
      const responseLower = response.toLowerCase();
      const inEmo = emoWords.filter(t => inputLower.includes(t));
      const resEmo = emoWords.filter(t => responseLower.includes(t));
      // Mirroring score: how much does the response echo the user's emotional words?
      const mirrorScore = inEmo.length > 0 ? inEmo.filter(w => responseLower.includes(w)).length / inEmo.length : 0;
      // Emotional vocabulary depth in the mind's concept graph
      const emoConcepts = await dbGet(db,
        `SELECT COUNT(*) as c FROM concepts WHERE LOWER(label) IN (${emoWords.map(() => '?').join(',')})`,
        emoWords
      );
      const emoDepth = emoConcepts?.c || 0;
      const intentBonus = comprehension.intent === 'emotional' ? 0.20 : 0;
      const score = Math.min(1.0,
        (inEmo.length + resEmo.length) * 0.04 +
        mirrorScore * 0.25 +
        intentBonus +
        Math.min(0.25, emoDepth * 0.01) +
        0.05
      );
      return {
        score,
        metrics: {
          inputEmotionalWords: inEmo.length,
          responseEmotionalWords: resEmo.length,
          mirrorScore: parseFloat(mirrorScore.toFixed(4)),
          emotionalVocabDepth: emoDepth,
          emotionalIntent: comprehension.intent === 'emotional',
        },
      };
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // ATLAS — Knowledge Architecture
  // Most coherent knowledge graph. Builds the scaffolding.
  // ─────────────────────────────────────────────────────────────────────
  architecture: {
    name: 'Atlas',
    label: 'Knowledge Architecture',

    inputBias: (tokens, directConcepts) => {
      // Atlas looks for structure — categorized concepts, defined concepts
      const defined = directConcepts.filter(c => c.definition && c.definition.length > 2);
      const categorized = directConcepts.filter(c => c.category && c.category !== 'learned');
      return { prioritized: tokens, definedCount: defined.length, categorizedCount: categorized.length, bias: 'structure-seeking' };
    },

    responseStyle: (response, tier, metrics) => {
      // Atlas speaks in structured, taxonomic language
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
      autoCategory: true,           // Atlas attempts to auto-categorize new concepts
    },

    measure: async (db, input, response, tokens, directConcepts, comprehension, dbHelpers) => {
      const { dbGet, dbAll } = dbHelpers;
      const totalC = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts`))?.c || 0;
      const totalL = (await dbGet(db, `SELECT COUNT(*) as c FROM links`))?.c || 0;
      const categories = await dbAll(db, `SELECT DISTINCT category FROM concepts`);
      const totalV = (await dbGet(db, `SELECT COUNT(*) as c FROM vocabulary`))?.c || 0;
      // Connectedness: what % of concepts have at least one link?
      const connected = (await dbGet(db,
        `SELECT COUNT(DISTINCT id) as c FROM concepts WHERE id IN (SELECT source_id FROM links UNION SELECT target_id FROM links)`
      ))?.c || 0;
      const connectedness = totalC > 0 ? connected / totalC : 0;
      // Orphan concepts: concepts with zero links
      const orphans = totalC - connected;
      // Definition coverage: what % of concepts have definitions?
      const defined = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts WHERE definition IS NOT NULL AND definition != ''`))?.c || 0;
      const definitionCoverage = totalC > 0 ? defined / totalC : 0;
      const score = Math.min(1.0,
        connectedness * 0.30 +
        Math.min(0.20, categories.length * 0.02) +
        definitionCoverage * 0.20 +
        Math.min(0.15, totalV * 0.0005) +
        Math.min(0.15, totalC * 0.0005)
      );
      return {
        score,
        metrics: {
          totalConcepts: totalC,
          totalLinks: totalL,
          connectedConcepts: connected,
          orphanConcepts: orphans,
          connectedness: parseFloat(connectedness.toFixed(4)),
          categories: categories.length,
          vocabularySize: totalV,
          definedConcepts: defined,
          definitionCoverage: parseFloat(definitionCoverage.toFixed(4)),
        },
      };
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE RUNNER — Executes input bias, measurement, and response styling
// Called from the main think() pipeline in the server
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

  // Log to strength_metrics table
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

// ═══════════════════════════════════════════════════════════════════════════
// RESEARCH DATA — Formatted for the research dashboard API
// ═══════════════════════════════════════════════════════════════════════════

function getProfileMeta(strengthType) {
  const profile = PROFILES[strengthType];
  if (!profile) return null;
  return {
    name: profile.name,
    label: profile.label,
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
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PROFILES,
  applyInputBias,
  measureStrength,
  applyResponseStyle,
  getLearningBias,
  getProfileMeta,
};
