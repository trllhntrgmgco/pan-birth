/**
 * Pan-Birth v9 Slot 4: Wiktionary Fetch Module
 * 
 * On-demand fetch from Wiktionary REST API for unknown important concepts.
 * Used by slot-4-capable minds (Zen, Seth, Nexus, Atlas, Aeon) via the
 * autonomous search trigger in consciousness-city-server-v8.js.
 *
 * Wiktionary returns inline HTML in definition text (wiki links, usage labels).
 * This module strips that markup and returns clean plain-text definitions.
 *
 * Spec: archive/v9-design/phase-5-slot4-wiktionary-spec.md
 */

const USER_AGENT = 'PanBirth/9.0 (research; github.com/trllhntrgmgco/pan-birth)';
const WIKTIONARY_API = 'https://en.wiktionary.org/api/rest_v1/page/definition';
const FETCH_TIMEOUT_MS = 5000;

/**
 * Strip HTML tags and decode common HTML entities from Wiktionary definition text.
 * Handles the inline <a rel="mw:WikiLink"> tags and <span> usage labels that
 * Wiktionary embeds in definition content.
 */
function stripHtmlAndDecode(html) {
  if (!html) return '';
  let text = html.replace(/<[^>]+>/g, '');
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Fetch a definition from Wiktionary REST API for the given term.
 * Returns a structured result indicating success or failure with reason.
 *
 * Resolution strategy:
 *   1. Prefer the first Noun part of speech in the English entries
 *   2. If no Noun, fall back to first available part of speech
 *   3. Within that part of speech, find first non-empty definition (length > 5)
 *   4. Strip HTML and return clean text
 *
 * Returns:
 *   { success: true, term, partOfSpeech, definition, source }
 *   { success: false, reason }
 */
async function fetchWiktionaryDefinition(term) {
  if (!term || typeof term !== 'string') {
    return { success: false, reason: 'invalid term' };
  }
  
  const url = `${WIKTIONARY_API}/${encodeURIComponent(term)}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return { success: false, reason: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    const enDefinitions = data?.en;
    
    if (!enDefinitions || !Array.isArray(enDefinitions)) {
      return { success: false, reason: 'no English entries' };
    }
    
    // Prefer Noun, fall back to first available part of speech
    const nounEntry = enDefinitions.find(e => e.partOfSpeech === 'Noun');
    const targetEntry = nounEntry || enDefinitions[0];
    
    if (!targetEntry?.definitions?.length) {
      return { success: false, reason: 'no definitions in entry' };
    }
    
    // Find first non-empty definition after cleanup
    let primaryDefinition = '';
    for (const d of targetEntry.definitions) {
      const cleaned = stripHtmlAndDecode(d?.definition);
      if (cleaned && cleaned.length > 5) {
        primaryDefinition = cleaned;
        break;
      }
    }
    
    if (!primaryDefinition) {
      return { success: false, reason: 'all definitions empty after cleanup' };
    }
    
    return {
      success: true,
      term,
      partOfSpeech: targetEntry.partOfSpeech,
      definition: primaryDefinition,
      source: 'wiktionary'
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, reason: 'timeout' };
    }
    return { success: false, reason: err.message };
  }
}

async function fetchWiktionaryDefinitionWithFallback(term) {
  const direct = await fetchWiktionaryDefinition(term);
  if (direct.success) return direct;
  if (direct.reason === 'no English entries' || direct.reason === 'HTTP 404') {
    const capitalized = term.charAt(0).toUpperCase() + term.slice(1);
    if (capitalized !== term) {
      const capResult = await fetchWiktionaryDefinition(capitalized);
      if (capResult.success) return capResult;
    }
  }
  return direct;
}

module.exports = {
  fetchWiktionaryDefinition: fetchWiktionaryDefinitionWithFallback,
  fetchWiktionaryDefinitionDirect: fetchWiktionaryDefinition,
  stripHtmlAndDecode  // exported for testing
};
