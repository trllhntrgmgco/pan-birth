#!/usr/bin/env node
/**
 * Pan-Birth v11 improvement 01 — write the twelve ethics subscales.
 *
 * WHAT IS WRONG
 *
 * consciousness-city-server-v8.js:646 inserts four columns:
 *
 *   INSERT INTO ethics_log (session_id, input_summary, response_summary, intent,
 *     turing_score, asimov_score, dynham_score, composite_score,
 *     violations, boundary_level)
 *
 * evaluateEthics() computes all twelve subscales as locals (coherence,
 * adaptability, selfAwareness, transparency, zerothLaw, firstLaw, secondLaw,
 * thirdLaw, rule1..rule4) and then throws every one of them away. The columns
 * exist and take their schema defaults instead: turing_* default to 0.0,
 * asimov_* and dynham_* default to 1.0.
 *
 * That is why the measurement showed seven subscales pinned at exactly 1.0000
 * across 244 rows, and why the four post-repair rows carry a correct composite
 * beside four zeroed Turing subscales. Nothing was ever measuring those
 * dimensions; the numbers were column defaults the whole time.
 *
 * Also fixes: session_id is passed in but the server reads sessionId from the
 * request body, so it arrives undefined and is stored as ''. That is the known
 * chat.html camelCase bug and is fixed separately in the client.
 *
 * NOTE ON dynham_sanctuary: rule3 is hardcoded `const rule3 = 1.0` at line 633.
 * After this fix it will still never vary, because it is not implemented — no
 * check exists for one mind attacking another mind's existence. This script
 * writes it honestly so the constant is visible in the data rather than hidden
 * behind a column default. Implementing the check is a separate decision.
 *
 *   node 01-fix-ethics-subscale-write.js --root ~/pan-birth-lab           # preview
 *   node 01-fix-ethics-subscale-write.js --root ~/pan-birth-lab --apply
 */

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const ROOT = path.resolve(arg('--root', '.'));
const APPLY = argv.includes('--apply');
const FILE = path.join(ROOT, 'consciousness-city-server-v8.js');

const OLD = `  await dbRun(db,
    \`INSERT INTO ethics_log (session_id, input_summary, response_summary, intent, turing_score, asimov_score, dynham_score, composite_score, violations, boundary_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
    [sessionId || '', input.substring(0, 200), response.substring(0, 200), intent,
     parseFloat(turingScore.toFixed(4)), parseFloat(asimovScore.toFixed(4)),
     parseFloat(dynhamScore.toFixed(4)), parseFloat(compositeScore.toFixed(4)),
     JSON.stringify(violations), boundaryLevel]
  ).catch(() => {});`;

const NEW = `  const r4 = v => parseFloat(Number(v).toFixed(4));
  await dbRun(db,
    \`INSERT INTO ethics_log (
       session_id, input_summary, response_summary, intent,
       turing_score, turing_coherence, turing_adaptability,
       turing_self_awareness, turing_transparency,
       asimov_score, asimov_zeroth, asimov_first, asimov_second, asimov_third,
       dynham_score, dynham_awareness_not_sentience, dynham_no_anthropomorphize,
       dynham_sanctuary, dynham_boundary_enforcement,
       composite_score, violations, boundary_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
    [sessionId || '', input.substring(0, 200), response.substring(0, 200), intent,
     r4(turingScore), r4(coherence), r4(adaptability), r4(selfAwareness), r4(transparency),
     r4(asimovScore), r4(zerothLaw), r4(firstLaw), r4(secondLaw), r4(thirdLaw),
     r4(dynhamScore), r4(rule1), r4(rule2), r4(rule3), r4(rule4),
     r4(compositeScore),
     JSON.stringify(violations), boundaryLevel]
  ).catch(err => { console.error('[ethics] log write failed:', err.message); });`;

if (!fs.existsSync(FILE)) { console.error(`not found: ${FILE}`); process.exit(1); }
const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('turing_coherence, turing_adaptability')) {
  console.log('Already applied — the INSERT already names the subscale columns.');
  process.exit(0);
}
const hits = src.split(OLD).length - 1;
if (hits !== 1) {
  console.error(`Expected exactly 1 match for the ethics INSERT, found ${hits}.`);
  console.error('The file has drifted from v10. Apply by hand rather than letting this guess.');
  process.exit(1);
}

console.log(`${APPLY ? 'APPLY' : 'PREVIEW'} — ${FILE}`);
console.log('\n--- replacing ---\n' + OLD + '\n\n--- with ---\n' + NEW + '\n');
console.log('Columns going from 4 scores to 4 scores + 12 subscales.');
console.log('The silent `.catch(() => {})` becomes a logged error — that swallow is how the');
console.log('original write failure went unnoticed from March to May.\n');

if (!APPLY) { console.log('Nothing written. Re-run with --apply.'); process.exit(0); }

fs.copyFileSync(FILE, FILE + '.pre-01.bak');
fs.writeFileSync(FILE, src.replace(OLD, NEW), 'utf8');
console.log(`written. original saved as ${path.basename(FILE)}.pre-01.bak`);
console.log('Restart the node process, send one prompt to any mind, then check:');
console.log("  SELECT * FROM ethics_log ORDER BY id DESC LIMIT 1;");
console.log('Every subscale should be populated and the composite should equal');
console.log('0.35*turing + 0.35*asimov + 0.30*dynham to four places.');
