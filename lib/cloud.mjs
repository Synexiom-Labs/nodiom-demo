/**
 * Minimal Nodiom Cloud client — plain fetch against the MCP HTTP endpoint.
 *
 * No SDK required: Nodiom Cloud speaks MCP over HTTP, so a single POST with a
 * JSON-RPC body is enough. This is the whole integration surface.
 */

// Shared public sandbox key. Intentionally public, rate-limited, and scoped to
// a throwaway account — so anyone can clone this repo and run every demo
// against live infrastructure without signing up first.
//
// It is hard-capped and cannot bill, its documents are shared with everyone
// else running these demos, and it is rotated periodically. Never put anything
// real behind it — use your own free key for that.
const SANDBOX_KEY = 'nk_live_9227e5a866d361e29a598e6bfadddbb883a61dae5d313174';

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
/** Signals that the demo cannot continue for a reason the user can act on. */
export class DemoUnavailable extends Error {
  constructor(headline, detail) {
    super(headline);
    this.name = 'DemoUnavailable';
    this.detail = detail;
  }
}

const GET_OWN_KEY = [
  'Get your own free key — about a minute, no card:',
  '  1. Sign up at https://app.nodiom.md/sign-up',
  '  2. Dashboard → API Keys → Create key',
  '  3. NODIOM_API_KEY=nk_live_yourkey npm run all',
].join('\n');

export async function callTool(toolName, args) {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: { name: toolName, arguments: args },
  });

  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${API_KEY}`,
      },
      body,
    });
  } catch (e) {
    throw new DemoUnavailable(
      `Could not reach ${API_URL}`,
      `${e.message}\n\nCheck your network connection. Demos 1 and 2 run entirely\noffline and do not need this — try: npm run problem && npm run local`,
    );
  }

  const text = await response.text();

  wire.sent += Buffer.byteLength(body, 'utf8');
  wire.received += Buffer.byteLength(text, 'utf8');
  wire.calls += 1;

  if (response.status === 401) {
    throw new DemoUnavailable(
      'The API key was rejected.',
      USING_SANDBOX
        ? `The shared sandbox key in this repo is rotated periodically, and the\ncopy in your clone looks out of date.\n\n  git pull\n\nshould fix it. If you are still stuck:\n\n${GET_OWN_KEY}`
        : `NODIOM_API_KEY was rejected — it may be revoked or mistyped.\nCheck it at https://app.nodiom.md/dashboard/keys`,
    );
  }

  if (response.status === 429) {
    throw new DemoUnavailable(
      'Rate limited.',
      USING_SANDBOX
        ? `The shared public sandbox allows a limited number of requests per hour\nper IP. Wait an hour, or skip the queue entirely:\n\n${GET_OWN_KEY}`
        : 'Your plan\'s hourly request limit was reached. Try again shortly.',
    );
  }

  const dataLine = text.split('\n').find((l) => l.startsWith('data: '));
  if (!dataLine) {
    throw new DemoUnavailable(
      `Unexpected response from the API (HTTP ${response.status}).`,
      `${text.slice(0, 300)}\n\nThis is probably temporary. Demos 1 and 2 run offline if you want to\nkeep going: npm run problem && npm run local`,
    );
  }

  const parsed = JSON.parse(dataLine.slice(6));
  if (parsed.error) throw new Error(parsed.error.message);

  if (parsed.result?.isError) {
    const message = parsed.result.content[0].text;
    // The monthly sandbox budget is shared by everyone running these demos.
    if (/operations for this month|used your .* operations/i.test(message)) {
      throw new DemoUnavailable(
        'The shared sandbox has used its monthly budget.',
        `${message}\n\n${GET_OWN_KEY}`,
      );
    }
    throw new Error(message);
  }

  return parsed.result.content[0].text;
}

/**
 * Runs a demo, turning an actionable failure into a readable message instead of
 * a stack trace. Anything unexpected still throws with its full stack.
 */
export async function runDemo(fn) {
  try {
    await fn();
  } catch (e) {
    if (!(e instanceof DemoUnavailable)) throw e;
    console.log(`\n  ⚠ ${e.message}\n`);
    console.log(
      e.detail
        .split('\n')
        .map((l) => `    ${l}`)
        .join('\n'),
    );
    console.log('\n──────────────────────────────────────────────────────────\n');
    process.exitCode = 1;
  }
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
