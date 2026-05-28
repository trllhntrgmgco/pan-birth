const sqlite3 = require('sqlite3');
const { collapseExistingDuplicates } = require('./truth-insert-dedup');

(async () => {
  const db = new sqlite3.Database('./omni-truth.db');
  console.log('Inspecting omni-truth.db...');
  await new Promise((res, rej) => db.get('SELECT COUNT(*) AS n FROM truths',
    (e, r) => { if (e) return rej(e); console.log(`  rows before: ${r.n}`); res(); }));
  console.log('Collapsing duplicates...');
  const result = await collapseExistingDuplicates(db);
  console.log(`Done. Removed ${result.collapsed} duplicate rows. ${result.kept} unique rows remain.`);
  db.close();
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
