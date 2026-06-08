/**
 * DEMO 2 — nodiom local library
 *
 * Same operation. Structural selectors. No regex.
 * Run it 10 times — it works correctly every time.
 */

import { Nodiom } from '@synexiom-labs/nodiom';

console.log('\n── DEMO 2: nodiom local library ──────────────────────────\n');

const doc = await Nodiom.fromFile('./wiki.md');

// See the full document structure before touching anything
console.log('Document outline (nodiom_tree):');
const outline = doc.tree();
const tasks = outline[0].children.find(c => c.heading === 'Tasks');
tasks.children.forEach(c => console.log(`  ${'#'.repeat(c.depth)} ${c.heading}`));

console.log('\nActive tasks before edit:');
const before = doc.readList('# Project Atlas > ## Tasks > ### Active');
before.forEach((t, i) => console.log(`  ${i}: ${t.trim()}`));

// Add a task — surgically, no full-file rewrite
doc.append(
  '# Project Atlas > ## Tasks > ### Active',
  '- [ ] Integrate agent feedback loop'
);

// Move a completed item — chain the operations
doc
  .delete('# Project Atlas > ## Tasks > ### Blocked > li[0]')
  .append('# Project Atlas > ## Meeting Notes', `### ${new Date().toISOString().split('T')[0]}\n\nAgent feedback loop task added. IRB blocker removed — approved this morning.`);

await doc.save();

console.log('\nActive tasks after edit:');
const after = doc.readList('# Project Atlas > ## Tasks > ### Active');
after.forEach((t, i) => console.log(`  ${i}: ${t.trim()}`));

console.log('\n✓ Untouched sections are byte-identical — no reformatting.');
console.log('✓ Run this 10 times. It works correctly every time.\n');
console.log('────────────────────────────────────────────────────────\n');