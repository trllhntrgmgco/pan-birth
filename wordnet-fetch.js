/**
 * Pan-Birth v9 Slot 5 + Slot 6: WordNet Fetch Module
 *
 * Local WordNet lookups via the `wordnet` npm package.
 *
 * Slot 5 scope: synonyms (synset members), hypernyms (@), hyponyms (~).
 * Slot 6 scope: meronyms (#m/#s/#p), holonyms (%m/%s/%p), antonyms (!).
 *
 * The fetch returns ALL relation types in one call (Path B). Storage is
 * capability-gated in the server: slot-5-only minds store slot-5 types;
 * slot-6-capable minds also store slot-6 types. Fetch cost is identical
 * either way (one lookup), so no benefit to fetching less.
 *
 * Empirically-verified pointer symbol mapping (wordnet@2.0.0):
 *   @  = hypernym        ~  = hyponym
 *   #m = member meronym  #s = substance meronym  #p = part meronym
 *   %m = member holonym  %s = substance holonym  %p = part holonym
 *   !  = antonym (requires checking adjective synsets, not just noun)
 * Malformed undefined-symbol pointers are ignored (they match no filter).
 *
 * Used by slot-5/6-capable minds (Atlas[5], Seth[5,6], Aeon[5,6,7]).
 *
 * Spec: archive/v9-design/phase-7-slot6-wordnet-full-spec.md
 */

const wordnet = require('wordnet');

let wordnetInitialized = false;

async function init() {
  if (wordnetInitialized) return;
  await wordnet.init();
  wordnetInitialized = true;
}

function isSingleWord(wordStr) {
  return wordStr && !wordStr.includes('_') && !wordStr.includes(' ');
}

function extractWords(wordsArray, excludeTerm) {
  if (!Array.isArray(wordsArray)) return [];
  const exclude = excludeTerm ? excludeTerm.toLowerCase() : null;
  return wordsArray
    .map(w => w && w.word)
    .filter(w => isSingleWord(w))
    .filter(w => !exclude || w.toLowerCase() !== exclude)
    .map(w => w.toLowerCase());
}

function extractPointerWords(pointers, pointerSymbol) {
  if (!Array.isArray(pointers)) return [];
  const matching = pointers.filter(p => p && p.pointerSymbol === pointerSymbol);
  const words = [];
  for (const p of matching) {
    if (p.data?.meta?.words) {
      const firstWord = p.data.meta.words.find(w => isSingleWord(w.word));
      if (firstWord) {
        words.push(firstWord.word.toLowerCase());
      }
    }
  }
  return [...new Set(words)];
}

/**
 * Extract meronyms or holonyms with sub-type tracking.
 * symbolMap maps a pointer symbol to a subtype label, e.g.
 *   { '#m': 'member', '#s': 'substance', '#p': 'part' }
 * Returns [{ word, subtype }], deduplicated by word.
 */
function extractTypedRelations(pointers, symbolMap) {
  if (!Array.isArray(pointers)) return [];
  const seen = new Set();
  const out = [];
  for (const p of pointers) {
    if (!p || !(p.pointerSymbol in symbolMap)) continue;
    if (!p.data?.meta?.words) continue;
    const firstWord = p.data.meta.words.find(w => isSingleWord(w.word));
    if (firstWord) {
      const word = firstWord.word.toLowerCase();
      if (!seen.has(word)) {
        seen.add(word);
        out.push({ word, subtype: symbolMap[p.pointerSymbol] });
      }
    }
  }
  return out;
}

/**
 * Extract antonyms (pointer symbol '!') across the given synsets.
 * Antonyms live on adjective synsets as well as nouns, so we scan all
 * provided synsets, not just the primary noun.
 * Returns [{ word }], deduplicated.
 */
function extractAntonyms(synsets, excludeTerm) {
  if (!Array.isArray(synsets)) return [];
  const exclude = excludeTerm ? excludeTerm.toLowerCase() : null;
  const seen = new Set();
  const out = [];
  for (const s of synsets) {
    const pointers = s?.meta?.pointers;
    if (!Array.isArray(pointers)) continue;
    for (const p of pointers) {
      if (!p || p.pointerSymbol !== '!') continue;
      if (!p.data?.meta?.words) continue;
      const firstWord = p.data.meta.words.find(w => isSingleWord(w.word));
      if (firstWord) {
        const word = firstWord.word.toLowerCase();
        if (word !== exclude && !seen.has(word)) {
          seen.add(word);
          out.push({ word });
        }
      }
    }
  }
  return out;
}

const MERONYM_SYMBOLS = { '#m': 'member', '#s': 'substance', '#p': 'part' };
const HOLONYM_SYMBOLS = { '%m': 'member', '%s': 'substance', '%p': 'part' };

/**
 * Fetch WordNet data for a term, returning slot-5 AND slot-6 relations.
 *
 * Returns on success:
 *   {
 *     success: true, term,
 *     synonyms: [], hypernyms: [], hyponyms: [],          // slot 5
 *     meronyms: [{word,subtype}], holonyms: [{word,subtype}], antonyms: [{word}],  // slot 6
 *     glossary, source
 *   }
 *   { success: false, reason }
 *
 * Slot-5 relations come from the first noun synset (unchanged behavior).
 * Slot-6 meronyms/holonyms also come from the first noun synset.
 * Antonyms are scanned across ALL synsets (noun + adjective).
 */
async function fetchWordNetData(term) {
  if (!term || typeof term !== 'string') {
    return { success: false, reason: 'invalid term' };
  }

  if (!wordnetInitialized) {
    try {
      await init();
    } catch (err) {
      return { success: false, reason: `init failed: ${err.message}` };
    }
  }

  let synsets;
  try {
    synsets = await wordnet.lookup(term);
  } catch (err) {
    return { success: false, reason: `lookup failed: ${err.message}` };
  }

  if (!Array.isArray(synsets) || synsets.length === 0) {
    return { success: false, reason: 'no synsets returned' };
  }

  const nounSynsets = synsets.filter(s => s?.meta?.synsetType === 'noun');
  if (nounSynsets.length === 0) {
    // Still may have antonyms from adjective synsets; but slot-5 scope needs a noun.
    // Try antonyms-only path for adjectives.
    const antonymsOnly = extractAntonyms(synsets, term);
    if (antonymsOnly.length > 0) {
      return {
        success: true,
        term: term.toLowerCase(),
        synonyms: [], hypernyms: [], hyponyms: [],
        meronyms: [], holonyms: [], antonyms: antonymsOnly,
        glossary: synsets[0]?.glossary || '',
        source: 'wordnet'
      };
    }
    return { success: false, reason: 'no noun synsets' };
  }

  const primarySynset = nounSynsets[0];

  const synonyms = extractWords(primarySynset.meta.words, term);
  const hypernyms = extractPointerWords(primarySynset.meta.pointers, '@');
  const hyponyms = extractPointerWords(primarySynset.meta.pointers, '~');
  const meronyms = extractTypedRelations(primarySynset.meta.pointers, MERONYM_SYMBOLS);
  const holonyms = extractTypedRelations(primarySynset.meta.pointers, HOLONYM_SYMBOLS);
  const antonyms = extractAntonyms(synsets, term);

  const hasAny = synonyms.length || hypernyms.length || hyponyms.length ||
                 meronyms.length || holonyms.length || antonyms.length;
  if (!hasAny) {
    return { success: false, reason: 'no usable relations after filtering' };
  }

  return {
    success: true,
    term: term.toLowerCase(),
    synonyms,
    hypernyms,
    hyponyms,
    meronyms,
    holonyms,
    antonyms,
    glossary: primarySynset.glossary || '',
    source: 'wordnet'
  };
}

module.exports = {
  init,
  fetchWordNetData,
  isSingleWord,
  extractWords,
  extractPointerWords,
  extractTypedRelations,
  extractAntonyms
};
