/**
 * DEMO 3 — Nodiom Cloud API
 *
 * Same operations — but over HTTP.
 * No local file access. Works in serverless, works from any agent,
 * works across distributed systems.
 *
 * Usage:
 *   NODIOM_API_KEY=<your-key> node 3-nodiom-cloud.mjs
 */

import { readFileSync, writeFileSync } from 'fs';

const API_KEY = process.env.NODIOM_API_KEY;
const API_URL = 'https://nodiom-cloud-production.up.railway.app/mcp';
// Will update to https://api.nodiom.md/mcp once DNS propagates

if (!API_KEY) {
  console.error('\n❌ Set your API key first:\n');
  console.error('   NODIOM_API_KEY=<your-key> node 3-nodiom-cloud.mjs\n');
  console.error('   Get early access at: https://nodiom.md#cloud\n');
  process.exit(1);
}

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
  // StreamableHTTP wraps response in SSE — extract the data line
  const dataLine = text.split('\n').find(l => l.startsWith('data: '));
  if (!dataLine) throw new Error(`Unexpected response: ${text}`);
  const parsed = JSON.parse(dataLine.slice(6));
  if (parsed.error) throw new Error(parsed.error.message);
  return JSON.parse(parsed.result.content[0].text);
}

console.log('\n── DEMO 3: Nodiom Cloud API ──────────────────────────────\n');
console.log(`Endpoint: ${API_URL}`);
console.log('No local file system. Pure HTTP. Works from anywhere.\n');

// Read the wiki — send content to the cloud, get structured result back
let content = readFileSync('./wiki.md', 'utf-8');

// 1. Get document outline from the cloud
console.log('① nodiom_tree — document outline from the cloud:');
const outline = await callTool('nodiom_tree', { content });
const tasks = outline[0].children.find(c => c.heading === 'Tasks');
tasks.children.forEach(c => console.log(`   ${'#'.repeat(c.depth)} ${c.heading}`));

// 2. Read active tasks from the cloud
console.log('\n② nodiom_read_list — active tasks:');
const items = await callTool('nodiom_read_list', {
  content,
  selector: '# Project Atlas > ## Tasks > ### Active'
});
items.forEach((t, i) => console.log(`   ${i}: ${t.trim()}`));

// 3. Append a new task via the cloud
console.log('\n③ nodiom_append — adding a task via the cloud API...');
const appended = await callTool('nodiom_append', {
  content,
  selector: '# Project Atlas > ## Tasks > ### Active',
  newContent: '- [ ] Deploy cloud evaluation pipeline',
});
content = appended.updatedContent;

// 4. Save the result back locally (in production: save to your own storage)
writeFileSync('./wiki.md', content);
console.log('   ✓ Updated content returned. Saved to local storage.');

// 5. Confirm
console.log('\n④ nodiom_query — verify the section exists and its child count:');
const meta = await callTool('nodiom_query', {
  content,
  selector: '# Project Atlas > ## Tasks > ### Active'
});
console.log(`   exists: ${meta.exists}, type: ${meta.type}, depth: ${meta.depth}`);

console.log('\n✓ All operations ran on the Nodiom Cloud API.');
console.log('✓ No file system access on the server — fully stateless.');
console.log('✓ Works from Lambda, Vercel, Cloudflare Workers, anywhere.\n');
console.log('   → Get early access: https://nodiom.md#cloud\n');
console.log('────────────────────────────────────────────────────────\n');