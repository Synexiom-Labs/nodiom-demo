/**
 * DEMO 3 — Nodiom Cloud API
 *
 * Same operations — but over HTTP.
 * No local file access. Works in serverless, works from any agent,
 * works across distributed systems.
 *
 * Usage:
 *   npm run cloud          ← uses shared demo key
 *   npm run cloud:own      ← uses your own key from .env
 */

import { readFileSync, writeFileSync } from 'fs';

// Shared demo key — intentionally public, rate-limited to 100 req/hour.
// Get your own key at: https://nodiom.md#cloud
const DEMO_KEY = 'ndc_f467b1459152c65f5c2d5295ec4052af527641cb8b8ef3cc';

const API_KEY = process.env.NODIOM_API_KEY ?? DEMO_KEY;
const API_URL = 'https://nodiom-cloud-production.up.railway.app/mcp';

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
  return JSON.parse(parsed.result.content[0].text);
}

console.log('\n── DEMO 3: Nodiom Cloud API ──────────────────────────────\n');
console.log(`Endpoint: ${API_URL}`);
console.log(`API key:  ${API_KEY === DEMO_KEY ? 'shared demo key' : 'your key'}`);
console.log('No local file system. Pure HTTP. Works from anywhere.\n');

// Read the wiki locally — send content to the cloud, get result back
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
  selector: '# Project Atlas > ## Tasks > ### Active',
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
writeFileSync('./wiki.md', content);
console.log('   ✓ Updated content returned. Saved to local storage.');

// 4. Confirm with a query
console.log('\n④ nodiom_query — verify the updated section:');
const meta = await callTool('nodiom_query', {
  content,
  selector: '# Project Atlas > ## Tasks > ### Active',
});
console.log(`   exists: ${meta.exists}, type: ${meta.type}, depth: ${meta.depth}`);

console.log('\n✓ All operations ran on the Nodiom Cloud API.');
console.log('✓ No file system access on the server — fully stateless.');
console.log('✓ Works from Lambda, Vercel, Cloudflare Workers, anywhere.\n');
console.log('   → Get your own key: https://nodiom.md#cloud\n');
console.log('────────────────────────────────────────────────────────\n');