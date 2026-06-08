/**
 * DEMO 2 — nodiom local library
 *
 * Same operation as Demo 1. Structural selectors. No regex.
 * Auto-resets wiki.md at the start — safe to run multiple times.
 */

import { Nodiom } from '@synexiom-labs/nodiom';
import { writeFileSync } from 'fs';

// Always start from a clean slate
const original = `# Project Atlas

An AI-powered research assistant for academic teams.

## Overview

Project Atlas automates literature reviews, synthesizes findings across papers,
and generates structured research summaries. Launched February 2026.

## Team

- Maya Patel — Tech Lead
- James Okonkwo — ML Engineer
- Sara Lindqvist — Research Lead
- Dev Sharma — Backend

## Tasks

### Active

- [ ] Train document embedding model on domain corpus
- [ ] Build citation graph extraction pipeline
- [ ] Design researcher feedback interface
- [x] Set up vector database infrastructure

### Completed

- [x] Project charter approved
- [x] Dataset acquisition finalized
- [x] Initial architecture review

### Blocked

- [ ] IRB ethics approval — waiting on university committee
- [ ] GPU cluster access — pending procurement sign-off

## Meeting Notes

### 2026-06-01

Reviewed embedding model benchmarks. Maya flagged that domain-specific fine-tuning
improved retrieval accuracy by 34% over base model. Decision: proceed with full
fine-tuning before the Q3 milestone.

## Risks

1. Ethics approval timeline may push launch past Q3
2. GPU availability is constrained — Ray cluster is at 90% utilization
3. Research lead Sara is splitting time with Project Beacon until July
`;

writeFileSync('./wiki.md', original);

console.log('\n── DEMO 2: nodiom local library ──────────────────────────\n');

const doc = await Nodiom.fromFile('./wiki.md');

// 1. See the full document structure before touching anything
console.log('① nodiom_tree — document outline:');
const outline = doc.tree();
const tasks = outline[0].children.find(c => c.heading === 'Tasks');
tasks.children.forEach(c => console.log(`   ${'#'.repeat(c.depth)} ${c.heading}`));

// 2. Read the active tasks
console.log('\n② nodiom_read_list — active tasks before edit:');
const before = doc.readList('# Project Atlas > ## Tasks > ### Active');
before.forEach((t, i) => console.log(`   ${i}: ${t.trim()}`));

// 3. Append a new task — address by selector, no regex
doc.append(
  '# Project Atlas > ## Tasks > ### Active',
  '- [ ] Integrate agent feedback loop'
);

// 4. Chain more operations in one go
doc
  .delete('# Project Atlas > ## Tasks > ### Blocked > li[0]')
  .append(
    '# Project Atlas > ## Meeting Notes',
    `### ${new Date().toISOString().split('T')[0]}\n\nAgent feedback loop task added. IRB blocker removed — approved this morning.`
  );

await doc.save();

console.log('\n③ Active tasks after edit:');
const after = doc.readList('# Project Atlas > ## Tasks > ### Active');
after.forEach((t, i) => console.log(`   ${i}: ${t.trim()}`));

console.log('\n④ Blocked tasks after delete:');
const blocked = doc.readList('# Project Atlas > ## Tasks > ### Blocked');
blocked.forEach((t, i) => console.log(`   ${i}: ${t.trim()}`));

console.log('\n✓ Selector syntax: "# Project Atlas > ## Tasks > ### Active"');
console.log('✓ Address any section like a DOM node — no regex, no line numbers.');
console.log('✓ Chain operations: append + delete + append in 3 lines.');
console.log('✓ Untouched sections are byte-identical — formatting preserved.\n');
console.log('────────────────────────────────────────────────────────\n');