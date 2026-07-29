# nodiom — runnable demos

Structured read/write for Markdown. Built for AI agents.

Five scripts, each self-contained. They run against a real document and print
real numbers — nothing here is mocked or pre-recorded.

→ [nodiom.md](https://nodiom.md) · [GitHub](https://github.com/Synexiom-Labs/nodiom) · [npm](https://www.npmjs.com/package/@synexiom-labs/nodiom)

---

## Setup

```bash
git clone https://github.com/Synexiom-Labs/nodiom-demo
cd nodiom-demo
npm install
```

Node.js 18+. No API key needed, no account needed — the cloud demos use a
shared public sandbox key that ships in the repo.

```bash
npm run all      # all five, in order (~1 minute)
```

---

## The five demos

### 1. The problem

```bash
npm run problem
```

How an agent edits Markdown without structural tools: load the file as a
string, find the spot with a regex, splice, write it all back.

Three agent turns against a clean document. One edit duplicates itself. One
edit vanishes with no error, because the regex needed a following heading to
anchor against and the target section was last in the file. Every edit rewrote
the whole file to change one line.

### 2. nodiom, local library

```bash
npm run local
```

The same three edits, addressed structurally. The edit that duplicated does
not. The edit that vanished lands. Sections nobody touched are verified
byte-identical against the original.

```js
doc.append('# Project Atlas > ## Tasks > ### Active', '- [ ] New task');
doc.delete('# Project Atlas > ## Tasks > ### Blocked > li[0]');
```

### 3. Nodiom Cloud

```bash
npm run cloud
```

Same selectors, but the document lives in a Nodiom Cloud account instead of on
your disk. No file system access — works from Lambda, Vercel, Cloudflare
Workers, or any agent that can make an HTTP request.

Each run creates its own document and deletes it afterwards, so you always see
a clean result.

### 4. Five agents, one document

```bash
npm run agents
```

**This is the one that matters.** Five agents make five different edits to the
same document, concurrently, twice:

- **Round A** — each agent reads the whole document, edits the string, writes
  it back. Two round trips per edit.
- **Round B** — each agent appends by selector. One round trip, and the
  read-modify-write happens inside a row lock server-side.

Round A typically loses 2–4 of the 5 edits. Every agent gets a success
response; nothing errors. The state just quietly disappears. Round B keeps all
five, every time.

This is the failure mode that a shared `CLAUDE.md` or `AGENTS.md` has and
cannot fix, because the problem is not the file format — it is that
read-modify-write across two round trips has no atomicity.

### 5. What one edit costs

```bash
npm run tokens
```

Builds a ~37KB engineering wiki (the size a real agent-maintained document
actually reaches), makes the same one-line edit both ways, and measures the
bytes that cross the wire.

Measured, not estimated:

| | input | output | total |
|---|---|---|---|
| full rewrite | ~9,700 tokens | ~9,700 tokens | **~19,500** |
| `nodiom_append` | 48 tokens | 63 tokens | **111** |

Roughly **175× cheaper** for that edit. The full-rewrite cost grows with the
document; the structural cost stays flat, because it is proportional to the
edit rather than the file.

Independently, peer-reviewed work on structure-aware code editing
([arXiv 2604.27296](https://arxiv.org/abs/2604.27296)) measured 30%+ cost
reduction on long files, and found that LLMs fail badly at line-numbered diffs
because they cannot reliably generate positional offsets. nodiom sidesteps that
entirely: the agent emits a readable selector and the library resolves it
against the document structure.

---

## Use it in your own project

```bash
npm install @synexiom-labs/nodiom
```

```js
import { Nodiom } from '@synexiom-labs/nodiom';

const doc = await Nodiom.fromFile('./wiki.md');
doc.append('## Tasks', '- [ ] New task');
await doc.save();
```

**MCP server** — works with any MCP client (Claude Code, Cursor, Cline,
Windsurf):

```bash
claude mcp add -s user nodiom -- npx -y @synexiom-labs/nodiom-mcp
```

**Nodiom Cloud** — hosted, stateless, with locking and version history for
multi-agent fleets:

```bash
claude mcp add --transport http nodiom-cloud https://api.nodiom.md/mcp \
  --header "Authorization: Bearer $NODIOM_API_KEY"
```

Get a key at [app.nodiom.md/sign-up](https://app.nodiom.md/sign-up) ·
Docs at [app.nodiom.md/docs](https://app.nodiom.md/docs)

---

## About the sandbox key

`lib/cloud.mjs` contains a working API key on purpose, so this repo runs with
zero setup. Worth knowing what it is:

- **Shared.** Every document created with it lives in one throwaway account, so
  anyone running these demos can see, read, or delete anyone else's. The demos
  use randomly-named documents and clean up after themselves, but you should
  **never put anything real behind this key.**
- **Hard-capped and rate-limited per IP.** It cannot be billed, and one heavy
  user cannot exhaust it for everyone else.
- **Rotated periodically.** If the key in your clone has gone stale, the demos
  will tell you to `git pull`.

For anything beyond kicking the tyres, get your own key — about a minute, no
card required:

```bash
# 1. https://app.nodiom.md/sign-up
# 2. Dashboard → API Keys → Create key
NODIOM_API_KEY=nk_live_yourkey npm run all
```

---

## Built by

[Synexiom Labs Inc.](https://synexiomlabs.com) — Cape Breton Island, Nova Scotia.

*Part of the reasoning infrastructure for AI agents.*
