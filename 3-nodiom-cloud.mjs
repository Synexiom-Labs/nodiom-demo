/**
 * DEMO 3 — Nodiom Cloud
 *
 * The same structural operations as Demo 2, but the document lives in a Nodiom
 * Cloud account instead of on this machine. No file system, no local state —
 * works from Lambda, Vercel, Cloudflare Workers, or any distributed agent.
 *
 *   npm run cloud                        ← shared public sandbox key
 *   NODIOM_API_KEY=<your-key> npm run cloud
 */

import { callTool, deleteDoc, scratchDocId, runDemo, API_URL, USING_SANDBOX } from './lib/cloud.mjs';
import { ORIGINAL } from './fixture.mjs';

const DOC_ID = scratchDocId('atlas');

console.log('\n── DEMO 3: Nodiom Cloud ───────────────────────────────────\n');
console.log(`  Endpoint: ${API_URL}`);
console.log(`  Key:      ${USING_SANDBOX ? 'shared public sandbox' : 'your own key'}`);
console.log(`  Document: ${DOC_ID} (created for this run, deleted at the end)\n`);

await runDemo(async () => {
  try {
    // Each run gets its own document, so nothing you see here is polluted by
    // anyone else's run.
    await callTool('nodiom_create_doc', { doc_id: DOC_ID, content: ORIGINAL });
    console.log('① nodiom_create_doc — document created in the cloud.');

    console.log('\n② nodiom_tree — outline, fetched over HTTP:');
    const outline = JSON.parse(await callTool('nodiom_tree', { doc_id: DOC_ID }));
    const tasks = outline[0]?.children?.find((c) => c.heading === 'Tasks');
    tasks?.children.forEach((c) => console.log(`     ${'#'.repeat(c.depth)} ${c.heading}`));

    console.log('\n③ nodiom_read_list — just the ### Active section:');
    const items = JSON.parse(
      await callTool('nodiom_read_list', {
        doc_id: DOC_ID,
        selector: '# Project Atlas > ## Tasks > ### Active',
      }),
    );
    items.forEach((t, i) => console.log(`     ${i}: ${t.trim()}`));

    console.log('\n④ nodiom_append — add a task, server-side:');
    await callTool('nodiom_append', {
      doc_id: DOC_ID,
      selector: '# Project Atlas > ## Tasks > ### Active',
      new_content: '- [ ] Deploy cloud evaluation pipeline',
    });
    const after = JSON.parse(
      await callTool('nodiom_read_list', {
        doc_id: DOC_ID,
        selector: '# Project Atlas > ## Tasks > ### Active',
      }),
    );
    console.log(`     ✓ ${items.length} items → ${after.length} items, no local write.`);

    console.log('\n⑤ nodiom_query — confirm the section:');
    const meta = JSON.parse(
      await callTool('nodiom_query', {
        doc_id: DOC_ID,
        selector: '# Project Atlas > ## Tasks > ### Active',
      }),
    );
    console.log(
      `     exists=${meta.exists} type=${meta.type} depth=${meta.depth} children=${meta.childCount}`,
    );

    console.log('\n── Results ───────────────────────────────────────────────\n');
    console.log('  · Every operation ran against a document you never had a copy of');
    console.log('  · No file system access on this machine — fully stateless');
    console.log('  · Same selectors as the local library, over HTTP\n');
    console.log('  Next:  npm run agents   ← where the cloud earns its keep\n');
    console.log('──────────────────────────────────────────────────────────\n');
  } finally {
    await deleteDoc(DOC_ID);
  }
});
