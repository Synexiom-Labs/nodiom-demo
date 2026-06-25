# nodiom — Live Demo

**Halifax Agentics Meetup · June 2026**

Structured read/write for Markdown. Built for AI agents.

→ [nodiom.md](https://nodiom.md) · [GitHub](https://github.com/Synexiom-Labs/nodiom) · [npm](https://www.npmjs.com/package/@synexiom-labs/nodiom)

---

## Setup (2 minutes)

```bash
git clone https://github.com/Synexiom-Labs/nodiom-demo
cd nodiom-demo
npm install
```

That's it. Node.js 18+ required.

---

## The Story

AI agents that work with Markdown documents — memory logs, project wikis, task lists — all face the same problem: there's no structured way to address and edit a specific section. Every agent loads the whole file as a string and regex-splices it. It breaks constantly.

These three scripts tell the story.

---

## Demo 1 — The Problem

```bash
npm run problem
```

An agent adds a task using regex. Run it once — it works. Run it a second time and watch what happens to the document structure.

---

## Demo 2 — nodiom (local library)

```bash
npm run reset   # restore wiki.md first
npm run local
```

Same operation using structural selectors. Address any section by its heading path. Chain operations. Run it 10 times — it's correct every time. Untouched sections are byte-identical.

```js
doc.append('# Project Atlas > ## Tasks > ### Active', '- [ ] New task');
doc.delete('# Project Atlas > ## Tasks > ### Blocked > li[0]');
```

---

## Demo 3 — Nodiom Cloud API

```bash
npm run cloud          # uses a shared public sandbox key
# or, with your own key:
NODIOM_API_KEY=<your-key> node 3-nodiom-cloud.mjs
```

Same operations as Demo 2 — but the document lives in your Nodiom Cloud account,
addressed by `doc_id`, not passed in as a string. No local file system. Works
from Lambda, Vercel, Cloudflare Workers, or any distributed agent environment.

**Get your own key:** [app.nodiom.md/sign-up](https://app.nodiom.md/sign-up) ·
**Docs:** [app.nodiom.md/docs](https://app.nodiom.md/docs)

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

**MCP server** (Claude agents use it natively):
```bash
claude mcp add -s user nodiom -- npx -y @synexiom-labs/nodiom-mcp
```

---

## Built by

[Synexiom Labs Inc.](https://synexiomlabs.com) — Cape Breton Island, Nova Scotia.

*Part of the reasoning infrastructure for AI agents.*