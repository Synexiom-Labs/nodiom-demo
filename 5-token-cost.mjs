/**
 * DEMO 5 — What one edit costs
 *
 * A realistic agent memory file is not 1KB. This builds a project wiki at
 * roughly the size a real one reaches, makes the same one-line edit two ways,
 * and measures the actual bytes that cross the wire.
 *
 * Why bytes matter: the payload an agent receives becomes input tokens in its
 * context, and the payload it sends becomes output tokens it had to generate.
 * Output tokens are the expensive ones.
 */

import {
  callTool,
  deleteDoc,
  scratchDocId,
  runDemo,
  wire,
  resetWireStats,
  approxTokens,
  API_URL,
  USING_SANDBOX,
} from './lib/cloud.mjs';

const SELECTOR = '# Engineering Wiki > ## Services > ### auth-service';

const SERVICES = [
  'auth-service', 'billing-service', 'search-indexer', 'notification-worker',
  'media-transcoder', 'analytics-pipeline', 'recommendation-engine', 'audit-logger',
  'session-store', 'rate-limiter', 'webhook-dispatcher', 'report-generator',
  'identity-broker', 'feature-flags', 'export-worker', 'schema-registry',
  'image-resizer', 'email-relay', 'fraud-scorer', 'ledger-reconciler',
];
const INCIDENT_COUNT = 60;

/** A plausible agent-maintained wiki, sized like a real one. */
function buildWiki() {
  let doc = `# Engineering Wiki\n\nMaintained by the platform agents. Updated continuously.\n\n## Services\n\n`;
  for (const s of SERVICES) {
    doc += `### ${s}\n\n`;
    doc += `- Owner: platform team\n- Runtime: Node.js 20\n- Deploy: GitHub Actions → Kubernetes\n`;
    doc += `- Dashboards: Grafana \`${s}-overview\`\n- On-call runbook: \`/runbooks/${s}.md\`\n`;
    doc += `- SLO: 99.9% availability, p99 under 300ms\n\n`;
    doc += `Operational notes for ${s}. Handles production traffic behind the ingress gateway.\n`;
    doc += `Scales horizontally on CPU. Known constraint: cold starts add latency after deploys,\n`;
    doc += `so the readiness probe has a grace period configured. Retries are capped to avoid\n`;
    doc += `amplifying upstream failures during incidents.\n\n`;
    doc += `Dependencies: the shared Postgres cluster, the internal message bus, and the object\n`;
    doc += `store for durable artifacts. Degrades to read-only rather than failing closed when the\n`;
    doc += `primary is unreachable. Config lives in the platform repo and is applied by the deploy\n`;
    doc += `pipeline; nothing is edited in the console by hand.\n\n`;
  }
  doc += `## Incidents\n\n`;
  for (let i = 1; i <= INCIDENT_COUNT; i++) {
    doc += `### INC-${String(i).padStart(4, '0')}\n\n`;
    doc += `Elevated error rate detected by synthetic monitoring. Mitigated by shifting traffic\n`;
    doc += `to the standby region while the failing pods were recycled. Contributing factor was a\n`;
    doc += `slow dependency saturating the connection pool. Follow-up: add a circuit breaker and\n`;
    doc += `an alert on pool utilization crossing 80% for more than two minutes.\n\n`;
  }
  doc += `## Conventions\n\n- Trunk-based development\n- Squash merges only\n- Every service owns its schema\n`;
  return doc;
}

const WIKI = buildWiki();
const docId = scratchDocId('wiki');

console.log('\n── DEMO 5: the cost of one edit ───────────────────────────\n');
console.log(`  Endpoint: ${API_URL}`);
console.log(`  Key:      ${USING_SANDBOX ? 'shared public sandbox' : 'your own key'}`);
console.log(`  Document: ${(WIKI.length / 1024).toFixed(1)}KB — ${SERVICES.length} services, ${INCIDENT_COUNT} incident reports\n`);
console.log(`  The edit: add one line under ### auth-service\n`);

await runDemo(async () => {
  try {
    await callTool('nodiom_create_doc', { doc_id: docId, content: WIKI });

    // ── Approach A: read it all, change one line, write it all back ────────
    resetWireStats();
    const full = await callTool('nodiom_get_doc', { doc_id: docId });
    const spliced = full.replace(
      /(### auth-service\n\n)/,
      `$1- Note: rotate signing keys quarterly\n`,
    );
    await callTool('nodiom_write', {
      doc_id: docId,
      selector: '# Engineering Wiki',
      new_content: spliced.split('\n').slice(1).join('\n'),
    });
    const naive = { ...wire };

    // ── Approach B: address the section, send only the new line ────────────
    resetWireStats();
    await callTool('nodiom_append', {
      doc_id: docId,
      selector: SELECTOR,
      new_content: '- Note: rotate signing keys quarterly',
    });
    const structural = { ...wire };

    const fmt = (n) => `${(n / 1024).toFixed(1)}KB`;
    const pad = (s, n) => String(s).padEnd(n);
    const naiveTotal = approxTokens(naive.received + naive.sent);
    const structTotal = approxTokens(structural.received + structural.sent);

    console.log('  Measured wire payload for that single edit:\n');
    console.log(`    ${pad('', 22)}${pad('read (input)', 16)}${pad('write (output)', 16)}round trips`);
    console.log(`    ${pad('full rewrite', 22)}${pad(fmt(naive.received), 16)}${pad(fmt(naive.sent), 16)}${naive.calls}`);
    console.log(`    ${pad('nodiom_append', 22)}${pad(fmt(structural.received), 16)}${pad(fmt(structural.sent), 16)}${structural.calls}`);

    console.log('\n  As approximate tokens (~4 chars/token):\n');
    console.log(`    ${pad('', 22)}${pad('input', 16)}${pad('output', 16)}total`);
    console.log(`    ${pad('full rewrite', 22)}${pad(approxTokens(naive.received), 16)}${pad(approxTokens(naive.sent), 16)}${naiveTotal}`);
    console.log(`    ${pad('nodiom_append', 22)}${pad(approxTokens(structural.received), 16)}${pad(approxTokens(structural.sent), 16)}${structTotal}`);

    const saved = 100 * (1 - structTotal / naiveTotal);
    console.log(`\n  Reduction on this edit: ${saved.toFixed(1)}%  (${naiveTotal} → ${structTotal} tokens)`);
    console.log(`  Ratio: ${(naiveTotal / structTotal).toFixed(0)}× cheaper\n`);

    console.log('── What this scales like ─────────────────────────────────\n');
    console.log('  Full-rewrite cost is proportional to document size — a bigger wiki');
    console.log('  costs more for the same one-line change. Structural cost is');
    console.log('  proportional to the edit, so it stays flat as the document grows.\n');
    console.log('  An agent making 30 edits a session against this document:');
    console.log(`    full rewrite:  ~${(naiveTotal * 30).toLocaleString()} tokens`);
    console.log(`    nodiom:        ~${(structTotal * 30).toLocaleString()} tokens\n`);
    console.log('  Same finding as the peer-reviewed work on structure-aware code');
    console.log('  editing (arXiv 2604.27296), which measured 30%+ cost reduction on');
    console.log('  long files — the gap widens further at agent-memory scale.\n');
    console.log('──────────────────────────────────────────────────────────\n');
  } finally {
    await deleteDoc(docId);
  }
});
