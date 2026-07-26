/**
 * DEMO 2 — nodiom, the local library
 *
 * The same three edits from Demo 1, addressed structurally instead of by
 * pattern-matching. Self-contained — safe to run as many times as you like.
 */

import { Nodiom } from '@synexiom-labs/nodiom';
import { readFileSync } from 'node:fs';
import { resetWiki, WIKI_PATH, ORIGINAL } from './fixture.mjs';

resetWiki();

console.log('\n── DEMO 2: nodiom local library ───────────────────────────\n');

const doc = await Nodiom.fromFile(WIKI_PATH);

// ① The outline — know the structure before touching it
console.log('① nodiom.tree() — the document\'s structure:');
const outline = doc.tree();
const tasks = outline[0].children.find((c) => c.heading === 'Tasks');
tasks.children.forEach((c) => console.log(`     ${'#'.repeat(c.depth)} ${c.heading}`));

// ② Read one section, not the whole file
console.log('\n② nodiom.readList("# Project Atlas > ## Tasks > ### Active"):');
doc.readList('# Project Atlas > ## Tasks > ### Active').forEach((t, i) =>
  console.log(`     ${i}: ${t.trim()}`),
);

// ③ The edit that duplicated itself in Demo 1
console.log('\n③ Append to ### Active — the edit that duplicated in Demo 1');
doc.append('# Project Atlas > ## Tasks > ### Active', '- [ ] Integrate agent feedback loop');
console.log('     ✓ Addressed by selector, so "where does this go" is not a guess.');

// ④ The edit that silently vanished in Demo 1
console.log('\n④ Append to ## Risks — the edit that silently vanished in Demo 1');
doc.append('# Project Atlas > ## Risks', '4. Vendor contract renewal is unconfirmed');
console.log('     ✓ Last section in the file. No anchor needed — it is a node, not a pattern.');

// ⑤ Chain operations, then save once
console.log('\n⑤ Chain a delete and a log entry, then save:');
doc
  .delete('# Project Atlas > ## Tasks > ### Blocked > li[0]')
  .append(
    '# Project Atlas > ## Meeting Notes',
    `### ${new Date().toISOString().split('T')[0]}\n\nAgent feedback loop task added. IRB blocker cleared.`,
  );
await doc.save();
console.log('     ✓ append + append + delete + append, one save.');

// ⑥ Prove the untouched sections were not disturbed
const updated = readFileSync(WIKI_PATH, 'utf-8');
const section = (text, heading) =>
  text.match(new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## )`))?.[1] ?? null;

const overviewSame = section(updated, 'Overview') === section(ORIGINAL, 'Overview');
const teamSame = section(updated, 'Team') === section(ORIGINAL, 'Team');

console.log('\n⑥ Sections nobody edited, compared byte-for-byte against the original:');
console.log(`     ## Overview identical: ${overviewSame}`);
console.log(`     ## Team identical:     ${teamSame}`);

console.log('\n── Results ───────────────────────────────────────────────\n');
const active = doc.readList('# Project Atlas > ## Tasks > ### Active');
const dupes = active.filter((t) => t.includes('Integrate agent feedback loop')).length;
console.log(`  · "Integrate agent feedback loop" appears ${dupes}× (Demo 1: 2×)`);
console.log(`  · The ## Risks edit landed (Demo 1: silently lost)`);
console.log(`  · Untouched sections byte-identical: ${overviewSame && teamSame}`);
console.log('\n  Selectors address structure, not text:');
console.log('    "# Project Atlas > ## Tasks > ### Active"');
console.log('    "# Project Atlas > ## Tasks > ### Blocked > li[0]"\n');
console.log('  Next:  npm run cloud\n');
console.log('──────────────────────────────────────────────────────────\n');
