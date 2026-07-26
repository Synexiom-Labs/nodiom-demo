/**
 * DEMO 4 — Five agents, one document
 *
 * Everything up to here was about a single agent. This is what happens when a
 * fleet shares state.
 *
 * Round A: each agent reads the whole document, edits the string, writes the
 *          whole thing back — the only option without structural addressing.
 * Round B: each agent appends by selector, and the read-modify-write happens
 *          atomically inside Nodiom Cloud.
 *
 * Same five edits, same document, fired concurrently both times. The only
 * difference is the edit primitive.
 */

import { callTool, deleteDoc, scratchDocId, API_URL, USING_SANDBOX } from './lib/cloud.mjs';
import { ORIGINAL } from './fixture.mjs';

const SELECTOR = '# Project Atlas > ## Tasks > ### Active';
const AGENTS = [
  'planner',
  'researcher',
  'reviewer',
  'summarizer',
  'scheduler',
];

console.log('\n── DEMO 4: five agents, one document ──────────────────────\n');
console.log(`  Endpoint: ${API_URL}`);
console.log(`  Key:      ${USING_SANDBOX ? 'shared public sandbox (Scale tier)' : 'your own key'}\n`);

/** Counts which agents' tasks actually made it into the document. */
async function survivors(docId) {
  const items = JSON.parse(await callTool('nodiom_read_list', { doc_id: docId, selector: SELECTOR }));
  const text = items.join('\n');
  return AGENTS.filter((a) => text.includes(`task from ${a}`));
}

// ───────────────────────────────────────────────────────────────────────────
// Round A — full-document read/modify/write, the way an agent does it without
// structural tools. Each agent's cycle spans two round trips.
// ───────────────────────────────────────────────────────────────────────────
const docA = scratchDocId('race-naive');
console.log('Round A — full-document rewrite (no structural addressing)\n');

try {
  await callTool('nodiom_create_doc', { doc_id: docA, content: ORIGINAL });

  await Promise.all(
    AGENTS.map(async (agent) => {
      // 1. read the entire document
      const full = await callTool('nodiom_get_doc', { doc_id: docA });
      // 2. splice locally
      const spliced = full.replace(
        /(### Active\n)([\s\S]*?)(\n### )/,
        `$1$2- [ ] task from ${agent}\n$3`,
      );
      // 3. write the entire document back
      const body = spliced.split('\n').slice(1).join('\n');
      await callTool('nodiom_write', { doc_id: docA, selector: '# Project Atlas', new_content: body });
    }),
  );

  const kept = await survivors(docA);
  const lost = AGENTS.filter((a) => !kept.includes(a));
  console.log(`  Edits attempted: ${AGENTS.length}`);
  console.log(`  Edits that survived: ${kept.length}  [${kept.join(', ') || 'none'}]`);
  console.log(`  Edits silently lost: ${lost.length}  [${lost.join(', ') || 'none'}]`);
  if (lost.length > 0) {
    console.log('\n  Every agent got a success response. Nothing errored.');
    console.log('  Each one read the document before the others had written, so the');
    console.log('  last writer overwrote the rest. This is a lost update, and it is');
    console.log('  invisible from the agent side.\n');
  } else {
    console.log('\n  All five happened to survive this run — the interleaving got lucky.');
    console.log('  Run it again; a two-round-trip cycle has no guarantee.\n');
  }
} finally {
  await deleteDoc(docA);
}

// ───────────────────────────────────────────────────────────────────────────
// Round B — structural append. The read-modify-write happens server-side,
// inside a row lock, so concurrent writers queue instead of clobbering.
// ───────────────────────────────────────────────────────────────────────────
const docB = scratchDocId('race-nodiom');
console.log('Round B — nodiom_append (structural, atomic server-side)\n');

try {
  await callTool('nodiom_create_doc', { doc_id: docB, content: ORIGINAL });

  await Promise.all(
    AGENTS.map((agent) =>
      callTool('nodiom_append', {
        doc_id: docB,
        selector: SELECTOR,
        new_content: `- [ ] task from ${agent}`,
      }),
    ),
  );

  const kept = await survivors(docB);
  const lost = AGENTS.filter((a) => !kept.includes(a));
  console.log(`  Edits attempted: ${AGENTS.length}`);
  console.log(`  Edits that survived: ${kept.length}  [${kept.join(', ')}]`);
  console.log(`  Edits silently lost: ${lost.length}  [${lost.join(', ') || 'none'}]`);
  console.log('\n  One round trip per edit. The document is read, modified, and');
  console.log('  written inside a single locked transaction, so five concurrent');
  console.log('  appends queue behind each other instead of racing.\n');
} finally {
  await deleteDoc(docB);
}

console.log('── Why this is the whole point ────────────────────────────\n');
console.log('  A single agent editing a Markdown file does not need any of this.');
console.log('  Five agents sharing one file do, and the failure is silent — no');
console.log('  exception, no conflict marker, just state that quietly disappeared.\n');
console.log('  Concurrent multi-agent writes are a Scale-tier capability. On the');
console.log('  Hobby and Pro tiers a colliding write returns an explicit error');
console.log('  instead of queueing — still safe, never a silent loss.\n');
console.log('  Next:  npm run tokens\n');
console.log('──────────────────────────────────────────────────────────\n');
