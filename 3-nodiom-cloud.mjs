/**
 * DEMO 3 — Nodiom Cloud API
 *
 * Same operations as Demo 2 — but over HTTP, against a document stored in
 * your Nodiom Cloud account instead of a local file. No local file access.
 * Works in serverless, works from any agent, works across distributed
 * systems.
 *
 * Usage:
 *   npm run cloud          ← uses shared public sandbox key
 *   npm run cloud:own      ← uses your own key from .env (NODIOM_API_KEY)
 */

// Shared public sandbox key — intentionally public, hobby-tier rate limits
// apply (200 req/hr, 1,000 ops/month). Everyone who runs this demo shares
// the same 'project-atlas' document, so it accumulates edits over time —
// that's expected. Get your own key at: https://app.nodiom.md/sign-up
const SANDBOX_KEY = 'nk_live_162149ba1e9084ea6758247f7fe9e833a6995cb88dd0f3e4';

const API_KEY = process.env.NODIOM_API_KEY ?? SANDBOX_KEY;
const API_URL = 'https://api.nodiom.md/mcp';
const DOC_ID = 'project-atlas';

async function callTool(toolName, args) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    }),
  });

  const text = await response.text();
  const dataLine = text.split('\n').find(l => l.startsWith('data: '));
  if (!dataLine) throw new Error(`Unexpected response: ${text}`);
  const parsed = JSON.parse(dataLine.slice(6));
  if (parsed.error) throw new Error(parsed.error.message);
  if (parsed.result.isError) throw new Error(parsed.result.content[0].text);
  return parsed.result.content[0].text;
}

console.log('\n── DEMO 3: Nodiom Cloud API ──────────────────────────────\n');
console.log(`Endpoint: ${API_URL}`);
console.log(`API key:  ${API_KEY === SANDBOX_KEY ? 'shared public sandbox key' : 'your key'}`);
console.log(`Document: '${DOC_ID}' (lives in your Nodiom Cloud account, not on this machine)\n`);

// Document creation is idempotent — does nothing if it already exists, which
// is exactly what we want for a shared sandbox doc.
await callTool('nodiom_create_doc', {
  doc_id: DOC_ID,
  content: '# Project Atlas\n\nSeeded by the nodiom-demo cloud script.\n',
});

// 1. Get document outline from the cloud
console.log('① nodiom_tree — document outline from the cloud:');
const outline = JSON.parse(await callTool('nodiom_tree', { doc_id: DOC_ID }));
const tasks = outline[0]?.children?.find(c => c.heading === 'Tasks');
tasks?.children.forEach(c => console.log(`   ${'#'.repeat(c.depth)} ${c.heading}`));

// 2. Read active tasks from the cloud
console.log('\n② nodiom_read_list — active tasks:');
const items = JSON.parse(
  await callTool('nodiom_read_list', { doc_id: DOC_ID, selector: '# Project Atlas > ## Tasks > ### Active' }),
);
items.forEach((t, i) => console.log(`   ${i}: ${t.trim()}`));

// 3. Append a new task via the cloud
console.log('\n③ nodiom_append — adding a task via the cloud API...');
await callTool('nodiom_append', {
  doc_id: DOC_ID,
  selector: '# Project Atlas > ## Tasks > ### Active',
  new_content: '- [ ] Deploy cloud evaluation pipeline',
});
console.log('   ✓ Saved directly in your Nodiom Cloud account — no local write.');

// 4. Confirm with a query
console.log('\n④ nodiom_query — verify the updated section:');
const meta = JSON.parse(
  await callTool('nodiom_query', { doc_id: DOC_ID, selector: '# Project Atlas > ## Tasks > ### Active' }),
);
console.log(`   exists: ${meta.exists}, type: ${meta.type}, depth: ${meta.depth}, childCount: ${meta.childCount}`);

console.log('\n✓ All operations ran on the Nodiom Cloud API.');
console.log('✓ No file system access on this machine — fully stateless.');
console.log('✓ Works from Lambda, Vercel, Cloudflare Workers, anywhere.\n');
console.log('   → Get your own key: https://app.nodiom.md/sign-up\n');
console.log('   → Docs: https://app.nodiom.md/docs\n');
console.log('────────────────────────────────────────────────────────\n');
