/**
 * Pan-Birth v10.1: Lexicon Fetch Module
 * Read-only access to lexicon.db (English Wiktionary via Kaikki/wiktextract).
 * Shared by all eight minds; no mind ever writes here.
 * mind.db = Identity | omni-truth.db = Knowledge | lexicon.db = Reference.
 * Inflected forms follow form_of one hop ("cities" -> "city").
 * Source data: Wiktionary, CC BY-SA 4.0.
 */
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');

const LEXICON_PATH = process.env.PB_LEXICON || path.join(__dirname, 'lexicon.db');
let db = null;

function init() {
  return new Promise((resolve) => {
    if (db) return resolve(true);
    if (!fs.existsSync(LEXICON_PATH)) return resolve(false);
    db = new sqlite3.Database(LEXICON_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) { db = null; return resolve(false); }
      resolve(true);
    });
  });
}

const all = (sql, params = []) => new Promise((res, rej) =>
  db.all(sql, params, (err, rows) => err ? rej(err) : res(rows || [])));

async function lookupRaw(wordLc) {
  const entries = await all(
    `SELECT id, word, pos, etymology FROM entries WHERE word_lc = ? ORDER BY id`, [wordLc]);
  if (!entries.length) return null;
  const ids = entries.map(e => e.id);
  const ph = ids.map(() => '?').join(',');
  const senses = await all(
    `SELECT s.id, s.entry_id, s.sense_idx, s.gloss, s.tags, s.form_of, e.pos
       FROM senses s JOIN entries e ON e.id = s.entry_id
      WHERE s.entry_id IN (${ph}) ORDER BY s.entry_id, s.sense_idx`, ids);
  return { entries, ids, senses };
}

async function lookup(term) {
  if (!term || typeof term !== 'string') return { success: false, reason: 'invalid term' };
  if (!(await init())) return { success: false, reason: 'lexicon unavailable' };

  const wordLc = term.toLowerCase().trim();
  let raw = await lookupRaw(wordLc);
  if (!raw) return { success: false, reason: 'not in lexicon' };

  let resolved = wordLc, viaFormOf = false;
  if (!raw.senses.filter(s => !s.form_of).length) {
    const target = raw.senses.find(s => s.form_of)?.form_of;
    if (target && target.toLowerCase() !== wordLc) {
      const base = await lookupRaw(target.toLowerCase());
      if (base) { raw = base; resolved = target.toLowerCase(); viaFormOf = true; }
    }
  }

  const usable = raw.senses.filter(s => !s.form_of && s.gloss);
  if (!usable.length) return { success: false, reason: 'no usable senses' };
  const primary = usable[0];

  const links = (await all(`SELECT DISTINCT target FROM sense_links WHERE sense_id = ?`, [primary.id]))
    .map(r => r.target.toLowerCase()).filter(t => t && t !== resolved);

  const ph = raw.ids.map(() => '?').join(',');
  const relRows = await all(`SELECT relation, target FROM relations WHERE entry_id IN (${ph})`, raw.ids);
  const relations = {};
  for (const r of relRows) {
    const t = r.target.toLowerCase();
    if (t === resolved) continue;
    const list = (relations[r.relation] ||= []);
    if (!list.includes(t) && list.length < 20) list.push(t);
  }

  return {
    success: true, term: wordLc, resolved, via_form_of: viaFormOf,
    pos: primary.pos, definition: primary.gloss, links,
    senses: usable.slice(0, 5).map(s => ({ pos: s.pos, gloss: s.gloss })),
    relations, etymology: raw.entries.find(e => e.etymology)?.etymology || '',
    source: 'lexicon'
  };
}

function close() { if (db) { db.close(); db = null; } }

module.exports = { init, lookup, close, LEXICON_PATH };

if (require.main === module) {
  lookup(process.argv[2] || 'volcano')
    .then(r => { console.log(JSON.stringify(r, null, 1)); close(); })
    .catch(e => { console.error('ERR', e.message); close(); });
}
