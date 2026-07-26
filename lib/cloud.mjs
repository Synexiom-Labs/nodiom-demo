/**
 * Minimal Nodiom Cloud client — plain fetch against the MCP HTTP endpoint.
 *
 * No SDK required: Nodiom Cloud speaks MCP over HTTP, so a single POST with a
 * JSON-RPC body is enough. This is the whole integration surface.
 */

// Shared public sandbox key. Intentionally public, rate-limited, and scoped to
// a throwaway account — so anyone can clone this repo and run every demo
// against live infrastructure without signing up first.
const SANDBOX_KEY = 'nk_live_162149ba1e9084ea6758247f7fe9e833a6995cb88dd0f3e4';

export const API_KEY = process.env.NODIOM_API_KEY ?? SANDBOX_KEY;
export const API_URL = process.env.NODIOM_API_URL ?? 'https://api.nodiom.md/mcp';
export const USING_SANDBOX = API_KEY === SANDBOX_KEY;

/** Bytes sent + received on the wire, accumulated across every call. */
export const wire = { sent: 0, received: 0, calls: 0 };

export function resetWireStats() {
  wire.sent = 0;
  wire.received = 0;
  wire.calls = 0;
}

/**
 * Calls one Nodiom Cloud MCP tool. Returns the tool's text result.
 * Tracks payload sizes so demos can report real measured token cost.
 */
export async function callTool(toolName, args) {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: { name: toolName, arguments: args },
  });

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${API_KEY}`,
    },
    body,
  });

  const text = await response.text();

  wire.sent += Buffer.byteLength(body, 'utf8');
  wire.received += Buffer.byteLength(text, 'utf8');
  wire.calls += 1;

  const dataLine = text.split('\n').find((l) => l.startsWith('data: '));
  if (!dataLine) throw new Error(`Unexpected response (${response.status}): ${text.slice(0, 300)}`);
  const parsed = JSON.parse(dataLine.slice(6));
  if (parsed.error) throw new Error(parsed.error.message);
  if (parsed.result?.isError) throw new Error(parsed.result.content[0].text);
  return parsed.result.content[0].text;
}

/**
 * A document id unique to this run.
 *
 * Demos create their own document and delete it at the end, so concurrent
 * runners never collide and nobody inherits a document polluted by everyone
 * else's edits.
 */
export function scratchDocId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Best-effort cleanup — never let a teardown failure fail the demo. */
export async function deleteDoc(docId) {
  try {
    await callTool('nodiom_delete_doc', { doc_id: docId });
  } catch {
    /* ignore */
  }
}

/** ~4 characters per token is the standard rough approximation for English + Markdown. */
export const CHARS_PER_TOKEN = 4;

export function approxTokens(bytes) {
  return Math.round(bytes / CHARS_PER_TOKEN);
}

export function rule(title) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 56 - title.length))}\n`);
}
