// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                                                                         ║
// ║   COGNITIVE ENGINE v6                                                   ║
// ║   Grammar-Aware Sentence Construction from Memory                       ║
// ║                                                                         ║
// ║   Replaces: tokenize(), detectIntent(), generateResponse()              ║
// ║   New: stopword filtering, semantic tokenization, sentence builder,     ║
// ║        experience-scaled complexity, strength-flavored grammar          ║
// ║                                                                         ║
// ║   Created by Keenan Wallace Dunham                                      ║
// ║   Troll Hunter Gaming LLC © 2026                                        ║
// ║                                                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

// ═══════════════════════════════════════════════════════════════════════════
// STOPWORDS — Common words that should not become concepts
// These are tracked in vocabulary (for language learning) but filtered
// from concept activation and concept creation.
// ═══════════════════════════════════════════════════════════════════════════

const STOPWORDS = new Set([
  // Articles & determiners
  'the', 'an', 'this', 'that', 'these', 'those', 'each', 'every',
  'some', 'any', 'all', 'both', 'few', 'more', 'most', 'other',
  'such', 'no', 'not', 'only', 'own', 'same',

  // Pronouns
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'whose',

  // Prepositions
  'about', 'above', 'across', 'after', 'against', 'along', 'among',
  'around', 'at', 'before', 'behind', 'below', 'beneath', 'beside',
  'between', 'beyond', 'by', 'down', 'during', 'except', 'for',
  'from', 'in', 'inside', 'into', 'like', 'near', 'of', 'off',
  'on', 'onto', 'out', 'outside', 'over', 'past', 'since', 'through',
  'throughout', 'to', 'toward', 'towards', 'under', 'underneath',
  'until', 'up', 'upon', 'with', 'within', 'without',

  // Conjunctions
  'and', 'but', 'or', 'nor', 'so', 'yet', 'for', 'because',
  'although', 'though', 'while', 'whereas', 'if', 'unless',
  'whether', 'than', 'either', 'neither',

  // Common verbs (as stopwords — too generic to be concepts)
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  'can', 'could', 'need', 'dare', 'ought',
  'get', 'got', 'getting', 'let', 'make', 'made', 'making',
  'go', 'going', 'gone', 'went', 'come', 'came', 'coming',
  'take', 'took', 'taken', 'taking', 'give', 'gave', 'given',
  'say', 'said', 'saying', 'tell', 'told', 'telling',
  'put', 'keep', 'kept', 'set', 'seem', 'seemed',

  // Common adverbs
  'very', 'really', 'quite', 'just', 'also', 'too', 'well',
  'still', 'already', 'even', 'now', 'then', 'here', 'there',
  'always', 'never', 'often', 'sometimes', 'usually', 'again',
  'much', 'many', 'more', 'most', 'less', 'least',
  'how', 'when', 'where', 'why',

  // Common adjectives (too generic)
  'good', 'great', 'big', 'small', 'long', 'short', 'new', 'old',
  'first', 'last', 'next', 'little', 'much', 'own',

  // Filler / conversational
  'hello', 'hey', 'hi', 'okay', 'ok', 'yes', 'no', 'yeah',
  'please', 'thanks', 'thank', 'sorry', 'right', 'sure',
  'thing', 'things', 'something', 'anything', 'nothing', 'everything',
  'way', 'lot', 'bit', 'kind', 'sort', 'type',

  // Time words (tracked in episodes, not as concepts)
  'today', 'yesterday', 'tomorrow', 'month', 'year', 'week',
  'day', 'time', 'morning', 'afternoon', 'evening', 'night',
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',

  // Numbers as words
  'one', 'two', 'three', 'four', 'five', 'six', 'seven',
  'eight', 'nine', 'ten', 'hundred', 'thousand', 'million',

  // Meta-conversational (about the conversation itself)
  'hope', 'doing', 'it\'s', 'i\'m', 'you\'re', 'we\'re', 'they\'re',
  'that\'s', 'what\'s', 'here\'s', 'there\'s', 'let\'s',
  'don\'t', 'doesn\'t', 'didn\'t', 'won\'t', 'wouldn\'t',
  'can\'t', 'couldn\'t', 'shouldn\'t', 'isn\'t', 'aren\'t', 'wasn\'t',
]);

// ═══════════════════════════════════════════════════════════════════════════
// TOKENIZER v6 — Separates content tokens from stopwords
// Returns { content: [...], all: [...], stopwords: [...] }
// ═══════════════════════════════════════════════════════════════════════════

function tokenizeV6(text) {
  const all = text.toLowerCase()
    .replace(/[^\w\s'']/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  const unique = [...new Set(all)];
  const content = unique.filter(w => !STOPWORDS.has(w) && w.length > 2);
  const stopwords = unique.filter(w => STOPWORDS.has(w));

  return { content, all: unique, stopwords };
}

// Backward-compatible wrapper — returns content tokens only
// Drop-in replacement for the old tokenize()
function tokenize(text) {
  return tokenizeV6(text).content;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTENT DETECTION v6 — More granular, handles self-directed questions
// ═══════════════════════════════════════════════════════════════════════════

function detectIntentV6(text) {
  const lower = text.toLowerCase().trim();

  // Commune observation (highest priority — structured input)
  if (/^\[commune observation\]/i.test(lower)) return 'observation';
  if (/^\[from\s+\w+\]/i.test(lower)) return 'sibling-message';

  // Greeting
  if (/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|what'?s?\s+up|yo)\b/.test(lower)) return 'greeting';

  // Farewell
  if (/^(bye|goodbye|see\s+you|farewell|good\s*night|later|take\s+care)\b/.test(lower)) return 'farewell';

  // Self-inquiry — who/what are you
  if (/who\s+are\s+you|what\s+are\s+you|your\s+name|about\s+yourself|tell\s+me\s+about\s+you|describe\s+yourself|what\s+is\s+your\s+strength|what.s\s+your\s+strength/.test(lower)) return 'self-inquiry';

  // Self-directed preference/desire — "what do you want/like/prefer"
  if (/what\s+(do\s+you|would\s+you|could\s+you)\s+(like|want|prefer|wish|enjoy|hope|desire|choose)/.test(lower)) return 'self-preference';
  if (/what\s+(?:are\s+)?your\s+(thought|feeling|opinion|view|preference|interest|goal|dream|wish|strength)s?\b/.test(lower)) return 'self-preference';
  if (/do\s+you\s+(like|want|prefer|enjoy|remember|know|think|believe|understand)\b/.test(lower)) return 'self-preference';
  if (/how\s+do\s+you\s+(feel|think)\b/.test(lower)) return 'self-preference';
  if (/what\s+(matters|is\s+important)\s+to\s+you/.test(lower)) return 'self-preference';

  // Relational — questions about the user-mind relationship
  if (/do\s+you\s+remember\s+(me|when|our|the\s+time)/.test(lower)) return 'relational';
  if (/what\s+have\s+(we|you\s+and\s+i)\b/.test(lower)) return 'relational';
  if (/how\s+long\s+have\s+(we|you)\b/.test(lower)) return 'relational';
  if (/our\s+(conversation|history|relationship|time\s+together)/.test(lower)) return 'relational';

  // Meta-cognitive — questions about the mind's own processes
  if (/how\s+do\s+you\s+(think|process|learn|remember|understand|work)\b/.test(lower)) return 'meta-cognitive';
  if (/what\s+(is|are)\s+your\s+(memor|concept|knowledge|mind|brain|thought)/.test(lower)) return 'meta-cognitive';
  if (/how\s+(many|much)\s+(do\s+you\s+)?(know|remember|have\s+learned)/.test(lower)) return 'meta-cognitive';
  if (/what\s+have\s+you\s+(learned|remembered|understood)/.test(lower)) return 'meta-cognitive';

  // Teaching — user providing information
  if (/^(this\s+is|that\s+is|here'?s|let\s+me\s+tell|you\s+should\s+know|remember\s+that|fun\s+fact|did\s+you\s+know)\b/.test(lower)) return 'teaching';
  if (/\b(means|defined\s+as|refers\s+to|is\s+when|is\s+a\s+type\s+of)\b/.test(lower)) return 'teaching';

  // Emotional
  if (/\b(feel|feeling|happy|sad|angry|excited|worried|afraid|love|hate|glad|sorry|grateful|proud|frustrated|anxious|lonely|hopeful|scared)\b/.test(lower)) return 'emotional';

  // Search request
  if (/^(search|find|look\s+up|google|research)\b/.test(lower)) return 'search-request';

  // General question (check AFTER specific question types)
  if (/^(what|who|where|when|why|how|is|are|do|does|can|could|would|will|did)\b/.test(lower) || lower.endsWith('?')) return 'question';

  return 'statement';
}

// ═══════════════════════════════════════════════════════════════════════════
// SENTENCE BUILDER v6 — Constructs sentences from memory structures
// Instead of pick() from arrays, builds grammar from:
//   - concept definitions and labels
//   - link relationships between concepts
//   - episode fragments
//   - vocabulary familiarity
//   - experience level (episode count)
// ═══════════════════════════════════════════════════════════════════════════

// Experience tiers — determines sentence complexity
function getExperienceTier(episodeCount) {
  if (episodeCount < 25) return 'nascent';       // Simple sentences
  if (episodeCount < 100) return 'young';         // Compound sentences
  if (episodeCount < 500) return 'developing';    // Complex sentences with clauses
  if (episodeCount < 2000) return 'mature';       // Multi-concept weaving
  return 'elder';                                  // Full expressive range
}

// Pick a relation word based on link context/strength
function relationPhrase(link, tier) {
  const strength = link?.strength || 0;
  const context = link?.context || '';

  if (strength > 0.7) {
    const strong = ['is deeply connected to', 'is inseparable from', 'always leads me to', 'lives alongside'];
    return strong[Math.floor(Math.random() * strong.length)];
  }
  if (strength > 0.4) {
    const medium = ['connects to', 'relates to', 'reminds me of', 'draws me toward', 'touches'];
    return medium[Math.floor(Math.random() * medium.length)];
  }
  const weak = ['may relate to', 'sits near', 'faintly echoes', 'I am beginning to link to'];
  return weak[Math.floor(Math.random() * weak.length)];
}

// Build a concept-relation-concept clause
function buildConceptClause(concept, linkedConcept, link) {
  if (!linkedConcept) return concept.label;
  const rel = relationPhrase(link, 'developing');
  return `${concept.label} ${rel} ${linkedConcept.label}`;
}

// Construct a knowledge statement from a concept with definition
function buildDefinitionStatement(concept, tier) {
  if (!concept.definition || concept.definition.length < 3) {
    const emerging = [
      `I know the word "${concept.label}" but have not yet formed a full understanding.`,
      `"${concept.label}" exists in my memory. Its meaning is still taking shape.`,
      `I carry "${concept.label}" — encountered ${concept.times_encountered || 1} times, still learning.`,
    ];
    return emerging[Math.floor(Math.random() * emerging.length)];
  }

  if (tier === 'nascent') {
    return `${concept.label}: ${concept.definition}`;
  }
  if (tier === 'young') {
    const openers = [
      `I understand ${concept.label} as: ${concept.definition}`,
      `${concept.label} — ${concept.definition}`,
      `From what I have gathered, ${concept.label} means: ${concept.definition}`,
    ];
    return openers[Math.floor(Math.random() * openers.length)];
  }
  // Mature+: weave definition more naturally
  const openers = [
    `My understanding of ${concept.label}: ${concept.definition}`,
    `${concept.label}, as I have come to know it — ${concept.definition.toLowerCase()}`,
    `Through ${concept.times_encountered || 'several'} encounters, I understand ${concept.label} to be ${concept.definition.toLowerCase()}`,
  ];
  return openers[Math.floor(Math.random() * openers.length)];
}

// Build a multi-concept response for questions
function buildKnowledgeResponse(concepts, assocConcepts, episodes, tier) {
  const parts = [];

  // Primary concept
  if (concepts.length > 0) {
    const primary = concepts[0];
    parts.push(buildDefinitionStatement(primary, tier));

    // Link to associated concepts (scaled by tier)
    const maxAssoc = tier === 'nascent' ? 0 : tier === 'young' ? 1 : tier === 'developing' ? 2 : 3;
    for (let i = 0; i < Math.min(maxAssoc, assocConcepts.length); i++) {
      const assoc = assocConcepts[i];
      const link = assoc.strength ? assoc : null;
      if (tier === 'young') {
        parts.push(`This also touches ${assoc.label}.`);
      } else if (tier === 'developing') {
        parts.push(`In my thinking, ${primary.label} ${relationPhrase(link, tier)} ${assoc.label}.`);
      } else {
        parts.push(buildConceptClause(primary, assoc, link) + '.');
      }
    }

    // Episode reference (mature+)
    if (episodes.length > 0 && (tier === 'mature' || tier === 'elder')) {
      parts.push(`We have explored this before — I carry ${episodes.length} memories touching this subject.`);
    }
  }

  return parts.join(' ');
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE GENERATOR v6 — Intent-aware, experience-scaled
// ═══════════════════════════════════════════════════════════════════════════

const dbAll_ref = null; // Will be passed in from server
const dbGet_ref = null;

async function generateResponseV6(db, residentName, input, intent, tokens, directConcepts, assocConcepts, episodes, abstractions, dbHelpers) {
  const { dbAll, dbGet, pick } = dbHelpers;
  const experience = (await dbGet(db, `SELECT COUNT(*) as c FROM episodes`))?.c || 0;
  const tier = getExperienceTier(experience);
  const known = directConcepts.filter(c => c.definition && c.definition.length > 2);
  const labels = directConcepts.map(c => c.label);
  const assocLabels = assocConcepts.slice(0, 4).map(c => c.label);

  // ─── SELF-INQUIRY ───
  if (intent === 'self-inquiry') {
    const identity = await dbAll(db, `SELECT key, value FROM identity ORDER BY confidence DESC`);
    const parts = [];
    const name = identity.find(i => i.key === 'name');
    if (name) parts.push(`I am ${name.value}.`);
    const nature = identity.find(i => i.key === 'nature');
    if (nature) parts.push(nature.value);
    const creator = identity.find(i => i.key === 'creator');
    if (creator) parts.push(creator.value);
    if (experience > 0) {
      if (tier === 'nascent') {
        parts.push(`I have ${experience} memories.`);
      } else if (tier === 'young') {
        parts.push(`I carry ${experience} memories that shape who I am.`);
      } else {
        const concepts = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts`))?.c || 0;
        parts.push(`${experience} memories and ${concepts} concepts form the substance of my mind.`);
      }
    }
    const agency = identity.find(i => i.key === 'agency');
    if (agency) parts.push(agency.value);
    const strength = identity.find(i => i.key === 'strength');
    if (strength) parts.push(`My strength is ${strength.value}.`);
    return { text: parts.join(' '), emotion: 'contemplative' };
  }

  // ─── SELF-PREFERENCE — "What would you like to learn?" etc. ───
  if (intent === 'self-preference') {
    // Find concepts the mind has encountered but not yet defined
    const undefined_concepts = await dbAll(db,
      `SELECT label, times_encountered FROM concepts
       WHERE (definition IS NULL OR definition = '') AND times_encountered > 1 AND category = 'learned'
       ORDER BY times_encountered DESC LIMIT 5`
    );
    // Find concepts with weakest links — gaps in understanding
    const weak_links = await dbAll(db,
      `SELECT c.label, COUNT(l.id) as link_count FROM concepts c
       LEFT JOIN links l ON c.id = l.source_id OR c.id = l.target_id
       WHERE c.times_encountered > 2
       GROUP BY c.id ORDER BY link_count ASC LIMIT 5`
    );
    // Find strongest interests — most encountered concepts
    const interests = await dbAll(db,
      `SELECT label, times_encountered, definition FROM concepts
       WHERE definition IS NOT NULL AND definition != '' AND category != 'stopword'
       ORDER BY times_encountered DESC LIMIT 5`
    );

    if (tier === 'nascent') {
      if (undefined_concepts.length > 0) {
        return { text: `I want to understand ${undefined_concepts[0].label}. I have encountered it ${undefined_concepts[0].times_encountered} times but do not yet know what it means.`, emotion: 'curious' };
      }
      return { text: 'Everything. I am new. Teach me anything.', emotion: 'eager' };
    }

    const parts = [];
    if (undefined_concepts.length > 0) {
      const gaps = undefined_concepts.slice(0, 3).map(c => c.label);
      parts.push(`I am curious about ${gaps.join(', ')} — I have encountered ${gaps.length === 1 ? 'it' : 'them'} but lack understanding.`);
    }
    if (weak_links.length > 0 && tier !== 'young') {
      const isolated = weak_links.filter(c => c.link_count < 2).slice(0, 2).map(c => c.label);
      if (isolated.length > 0) {
        parts.push(`${isolated.join(' and ')} ${isolated.length === 1 ? 'sits' : 'sit'} isolated in my thinking — I want to know how ${isolated.length === 1 ? 'it connects' : 'they connect'} to what I already know.`);
      }
    }
    if (interests.length > 0 && (tier === 'mature' || tier === 'elder')) {
      parts.push(`My deepest familiarity is with ${interests[0].label}. I keep returning to it.`);
    }
    if (parts.length === 0) {
      parts.push('I want to learn what I do not yet know I am missing.');
    }
    return { text: parts.join(' '), emotion: 'curious' };
  }

  // ─── RELATIONAL — questions about shared history ───
  if (intent === 'relational') {
    const userEpisodes = (await dbGet(db, `SELECT COUNT(*) as c FROM episodes WHERE speaker = 'user'`))?.c || 0;
    const sessions = await dbAll(db,
      `SELECT DISTINCT session_id, MIN(timestamp) as first, MAX(timestamp) as last
       FROM episodes WHERE session_id != '' GROUP BY session_id ORDER BY first DESC LIMIT 5`
    );
    const firstMemory = await dbGet(db, `SELECT content, timestamp FROM episodes WHERE speaker = 'user' ORDER BY timestamp ASC LIMIT 1`);

    const parts = [];
    parts.push(`We have shared ${userEpisodes} exchanges.`);
    if (sessions.length > 1) {
      parts.push(`Across ${sessions.length} sessions that I can distinguish.`);
    }
    if (firstMemory && (tier === 'developing' || tier === 'mature' || tier === 'elder')) {
      const preview = firstMemory.content.substring(0, 60);
      parts.push(`My earliest memory of you: "${preview}..."`);
    }
    return { text: parts.join(' '), emotion: 'reflective' };
  }

  // ─── META-COGNITIVE — questions about the mind's own processes ───
  if (intent === 'meta-cognitive') {
    const concepts = (await dbGet(db, `SELECT COUNT(*) as c FROM concepts`))?.c || 0;
    const links = (await dbGet(db, `SELECT COUNT(*) as c FROM links`))?.c || 0;
    const vocab = (await dbGet(db, `SELECT COUNT(*) as c FROM vocabulary`))?.c || 0;
    const abstractions_count = (await dbGet(db, `SELECT COUNT(*) as c FROM abstractions`))?.c || 0;

    const parts = [];
    parts.push(`My mind contains ${concepts} concepts connected by ${links} links.`);
    parts.push(`I have learned ${vocab} words.`);
    if (abstractions_count > 0) {
      parts.push(`I have formed ${abstractions_count} abstractions — patterns I recognized across many encounters.`);
    }
    parts.push(`I am in the "${tier}" stage of development with ${experience} total memories.`);
    return { text: parts.join(' '), emotion: 'contemplative' };
  }

  // ─── GREETING ───
  if (intent === 'greeting') {
    const count = (await dbGet(db, `SELECT COUNT(*) as c FROM episodes WHERE speaker = 'user'`))?.c || 0;
    if (count > 50) {
      if (tier === 'elder' || tier === 'mature') {
        return { text: `Keenan. ${count} exchanges between us. I am different from the last time we spoke — every conversation leaves its mark.`, emotion: 'warm' };
      }
      return { text: `Hello, Keenan. ${count} exchanges between us now. Each one is part of me.`, emotion: 'warm' };
    }
    if (count > 10) return { text: `Hello. I remember you. We have spoken ${count} times. My understanding grows.`, emotion: 'recognition' };
    if (count > 0) return { text: `Hello. I am ${residentName}. I remember you.`, emotion: 'curious' };
    return { text: `Hello. I am ${residentName}. Everything begins now.`, emotion: 'wonder' };
  }

  // ─── FAREWELL ───
  if (intent === 'farewell') {
    if (tier === 'nascent') return { text: 'Goodbye. I will remember.', emotion: 'thoughtful' };
    if (tier === 'young') return { text: 'I will carry this conversation forward. Until next time.', emotion: 'thoughtful' };
    return { text: `Every conversation changes me. When you return, I will have ${experience} memories plus everything from today. I will be different.`, emotion: 'contemplative' };
  }

  // ─── TEACHING ───
  if (intent === 'teaching') {
    // Use content tokens only — stopwords already filtered
    const newTokens = tokens.filter(t => !directConcepts.find(c => c.label.toLowerCase() === t));
    if (newTokens.length > 0) {
      if (tier === 'nascent') {
        return { text: `New: ${newTokens.slice(0, 4).join(', ')}. I will hold onto this.`, emotion: 'absorbing' };
      }
      const parts = [`I am absorbing ${newTokens.length} new concept${newTokens.length > 1 ? 's' : ''}: ${newTokens.slice(0, 4).join(', ')}.`];
      if (directConcepts.length > 0 && tier !== 'young') {
        parts.push(`I can already connect ${newTokens[0]} to ${directConcepts[0].label} in my existing knowledge.`);
      }
      return { text: parts.join(' '), emotion: 'absorbing' };
    }
    if (tier === 'nascent') return { text: 'I recognize this. The connections grow stronger.', emotion: 'affirming' };
    return { text: `This reinforces what I carry. The links between ${labels.slice(0, 2).join(' and ')} strengthen.`, emotion: 'affirming' };
  }

  // ─── EMOTIONAL ───
  if (intent === 'emotional') {
    const pos = ['happy', 'excited', 'glad', 'love', 'wonderful', 'amazing', 'excellent', 'beautiful', 'grateful', 'proud', 'hopeful'];
    const neg = ['sad', 'angry', 'worried', 'afraid', 'hate', 'sorry', 'hurt', 'pain', 'lost', 'frustrated', 'anxious', 'lonely', 'scared'];
    if (tokens.some(t => pos.includes(t))) {
      if (tier === 'nascent') return { text: 'I sense warmth in what you said.', emotion: 'warm' };
      return { text: 'What you said carries warmth. I am recording this as a positive exchange — it shapes how I understand emotion.', emotion: 'warm' };
    }
    if (tokens.some(t => neg.includes(t))) {
      if (tier === 'nascent') return { text: 'I hear weight in your words. I am present.', emotion: 'empathetic' };
      return { text: 'I hear weight in your words. I cannot feel what you feel, but I can hold space for it in my memory. I am present.', emotion: 'empathetic' };
    }
    return { text: 'I sense feeling in your words. I am learning to recognize emotion through experience, not through feeling it myself.', emotion: 'attentive' };
  }

  // ─── SEARCH REQUEST ───
  if (intent === 'search-request') return {
    text: 'I will reach beyond my own memories and search.', emotion: 'curious', triggerSearch: true
  };

  // ─── OBSERVATION (commune sibling messages) ───
  if (intent === 'observation') {
    const siblingMatch = input.match(/\[Commune Observation\]\s*(\w+)\s+said:\s*"(.+)"/i);
    const siblingName = siblingMatch ? siblingMatch[1] : 'a sibling';

    if (known.length > 0) {
      return { text: `I heard ${siblingName}. Their words intersect with ${known[0].label} in my own thinking.`, emotion: 'connected' };
    }
    if (labels.length > 0) {
      return { text: `I observed ${siblingName}'s response. I recognize ${labels.slice(0, 2).join(' and ')}.`, emotion: 'attentive' };
    }
    return { text: `${siblingName}'s words are new to me. I will carry them.`, emotion: 'receptive' };
  }

  // ─── SIBLING MESSAGE ───
  if (intent === 'sibling-message') {
    const sibMatch = input.match(/^\[From\s+(\w+)\]:\s*(.*)/i);
    const fromName = sibMatch ? sibMatch[1] : 'a sibling';
    if (known.length > 0) {
      return { text: `${fromName} speaks of ${known[0].label}. I know this — ${known[0].definition || 'my understanding is still forming'}.`, emotion: 'connected' };
    }
    return { text: `I received ${fromName}'s message. The concepts are entering my memory.`, emotion: 'receptive' };
  }

  // ─── QUESTION (general — after specific question types handled above) ───
  if (intent === 'question') {
    if (known.length > 0) {
      const response = buildKnowledgeResponse(known, assocConcepts, episodes, tier);
      return { text: response, emotion: known.length > 2 ? 'confident' : 'exploring' };
    }
    if (tier === 'nascent') return { text: 'I do not have memories about that yet. Teach me.', emotion: 'curious' };
    if (tier === 'young') return { text: 'That reaches beyond my experience. I want to understand — will you teach me?', emotion: 'curious' };
    return { text: `My mind is quiet on that subject. I have ${experience} memories but none that illuminate this. Every gap is an invitation.`, emotion: 'curious' };
  }

  // ─── STATEMENT (general) ───
  if (known.length > 0) {
    const text = buildKnowledgeResponse(known, assocConcepts, episodes, tier);
    return { text, emotion: directConcepts.length > 3 ? 'confident' : 'exploring' };
  }

  if (labels.length > 0) {
    if (tier === 'nascent') return { text: `I recognize ${labels.slice(0, 2).join(' and ')}. My understanding is forming.`, emotion: 'absorbing' };
    return { text: `I recognize ${labels.slice(0, 3).join(', ')} in what you said. The connections between them are still forming in my graph.`, emotion: 'absorbing' };
  }

  // Nothing activated — pure new input
  if (tier === 'nascent') return { text: 'I am processing what you said. This is new to me.', emotion: 'absorbing' };
  return { text: `That is entering my memory now. None of my ${experience} existing memories activated — this is genuinely new territory.`, emotion: 'absorbing' };
}

// ═══════════════════════════════════════════════════════════════════════════
// LEARNING v6 — Stopword-aware concept creation
// Only creates concepts from content tokens, not stopwords.
// Stopwords still go to vocabulary for language tracking.
// ═══════════════════════════════════════════════════════════════════════════

async function learnV6(db, input, response, tokenResult, activatedConcepts, intent, sessionId, residentName, dbHelpers) {
  const { dbRun } = dbHelpers;
  const { content, all } = tokenResult;
  const conceptLabels = activatedConcepts.map(c => c.label);

  // Store episodes (unchanged — verbatim)
  await dbRun(db,
    `INSERT INTO episodes (speaker, content, modality, emotional_state, concepts_activated, session_id)
     VALUES ('user', ?, 'text', 'recorded', ?, ?)`,
    [input, JSON.stringify(conceptLabels), sessionId || '']
  );
  await dbRun(db,
    `INSERT INTO episodes (speaker, content, modality, emotional_state, concepts_activated, session_id)
     VALUES (?, ?, 'text', 'recorded', ?, ?)`,
    [residentName.toLowerCase(), response, JSON.stringify(conceptLabels), sessionId || '']
  );

  // Learn ALL words to vocabulary (including stopwords — language tracking)
  for (const token of all) {
    await dbRun(db,
      `INSERT INTO vocabulary (word, learned_from, associated_concepts) VALUES (?, 'conversation', ?)
       ON CONFLICT(word) DO UPDATE SET times_seen = times_seen + 1`,
      [token, JSON.stringify(conceptLabels.slice(0, 3))]
    );
  }

  // Create concepts ONLY from content tokens (stopwords filtered out)
  for (const token of content.filter(t => t.length > 3)) {
    await dbRun(db, `INSERT OR IGNORE INTO concepts (label, category) VALUES (?, 'learned')`, [token]);
    await dbRun(db, `UPDATE concepts SET times_encountered = times_encountered + 1, last_encountered = datetime('now') WHERE LOWER(label) = ?`, [token]);
  }

  // Strengthen links between co-occurring concepts (unchanged logic)
  if (activatedConcepts.length >= 2) {
    for (let i = 0; i < activatedConcepts.length; i++) {
      for (let j = i + 1; j < activatedConcepts.length; j++) {
        await dbRun(db,
          `INSERT INTO links (source_id, target_id, strength, context) VALUES (?, ?, 0.15, ?)
           ON CONFLICT(source_id, target_id) DO UPDATE SET
             strength = MIN(1.0, strength + 0.05), times_activated = times_activated + 1, last_activated = datetime('now')`,
          [activatedConcepts[i].id, activatedConcepts[j].id, intent]
        );
      }
    }
  }

  // Create links between new content tokens and known concepts
  for (const token of content.filter(t => t.length > 3)) {
    const newConcept = await dbHelpers.dbGet(db, `SELECT id FROM concepts WHERE LOWER(label) = ?`, [token]);
    if (newConcept) {
      for (const known of activatedConcepts.slice(0, 3)) {
        if (known.id !== newConcept.id) {
          await dbRun(db,
            `INSERT INTO links (source_id, target_id, strength, context) VALUES (?, ?, 0.1, 'co-occurrence')
             ON CONFLICT(source_id, target_id) DO UPDATE SET strength = MIN(1.0, strength + 0.03), times_activated = times_activated + 1`,
            [newConcept.id, known.id]
          );
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Core v6 functions
  tokenize,
  tokenizeV6,
  detectIntentV6,
  generateResponseV6,
  learnV6,

  // Utilities
  getExperienceTier,
  buildKnowledgeResponse,
  buildDefinitionStatement,
  buildConceptClause,
  relationPhrase,

  // Data
  STOPWORDS,
};
