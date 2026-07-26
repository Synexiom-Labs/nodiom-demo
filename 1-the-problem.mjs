/**
 * DEMO 1 — The problem
 *
 * How an agent edits Markdown without structural tools: load the whole file as
 * a string, find the right spot with a regex, splice, write it all back.
 *
 * This runs three agent turns against a clean document and shows what the
 * approach costs. Self-contained — safe to run as many times as you like.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resetWiki, WIKI_PATH } from './fixture.mjs';

resetWiki();

console.log('\n── DEMO 1: editing Markdown with regex ────────────────────\n');
console.log('The document has ## Tasks (### Active/Completed/Blocked), ## Meeting Notes, ## Risks.\n');

/** The usual approach: anchor on the next heading and splice in front of it. */
function naiveAppend(sectionHeading, newLine) {
  const content = readFileSync(WIKI_PATH, 'utf-8');
  const pattern = new RegExp(`(${sectionHeading}\\n)([\\s\\S]*?)(\\n#{2,3} )`);
  const updated = content.replace(pattern, `$1$2${newLine}\n$3`);
  writeFileSync(WIKI_PATH, updated);
  // The agent has no signal here unless it thinks to compare before/after.
  return { changed: updated !== content };
}

function activeTasks() {
  const content = readFileSync(WIKI_PATH, 'utf-8');
  const section = content.match(/### Active\n([\s\S]*?)\n### /)?.[1] ?? '';
  return section.split('\n').filter((l) => l.trim());
}

// ── Turn 1 ────────────────────────────────────────────────────────────────
console.log('Turn 1 — agent appends a task to ### Active');
naiveAppend('### Active', '- [ ] Integrate agent feedback loop');
console.log(`  ✓ Active now has ${activeTasks().length} items. Looks fine.\n`);

// ── Turn 2 ────────────────────────────────────────────────────────────────
// A retry, a second agent, or the same agent later in the session — it has no
// way to know this edit already landed.
console.log('Turn 2 — the same edit runs again (retry, or a second agent)');
naiveAppend('### Active', '- [ ] Integrate agent feedback loop');
const dupes = activeTasks().filter((t) => t.includes('Integrate agent feedback loop')).length;
console.log(`  ⚠ "Integrate agent feedback loop" now appears ${dupes} times.`);
console.log('    A string splice has no notion of what is already there.\n');

// ── Turn 3 ────────────────────────────────────────────────────────────────
// ## Risks is the last section, so there is no following heading to anchor on.
console.log('Turn 3 — agent appends a risk to ## Risks (the last section)');
const before = readFileSync(WIKI_PATH, 'utf-8');
const result = naiveAppend('## Risks', '4. Vendor contract renewal is unconfirmed');
const after = readFileSync(WIKI_PATH, 'utf-8');
console.log(`  ✗ Document changed: ${result.changed}`);
console.log(`  ✗ Byte count before ${before.length}, after ${after.length} — nothing was written.`);
console.log('    The regex needed a following heading to anchor against, and');
console.log('    ## Risks is last. The write silently did nothing.\n');

console.log('── What just happened ────────────────────────────────────\n');
console.log('  · One duplicated task, because splicing has no structural awareness');
console.log('  · One edit lost with no error, because the anchor pattern did not match');
console.log('  · Every edit rewrote the entire file to change one line\n');
console.log('  These are not bugs in the regex. They are what happens when you');
console.log('  address a structured document by pattern-matching its text.\n');
console.log('  Next:  npm run local\n');
console.log('──────────────────────────────────────────────────────────\n');
