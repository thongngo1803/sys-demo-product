import { createServer } from 'node:http';
import { bumpPolicyVersion, consentNeedsPrompt, getPolicyVersion, recentConsentEvents, recordConsent, vendorDecisions, } from './consent.js';
import { productHealth } from './health.js';
import { supabaseSchemaReport, supabaseStatus } from './supabase.js';
const port = Number(process.env.PORT ?? 4173);
function json(body) {
    return JSON.stringify(body, null, 2);
}
function page(body) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sys Demo Product</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 960px; margin: 40px auto; padding: 0 20px; color: #1f2937; }
    header { border-bottom: 1px solid #d1d5db; margin-bottom: 24px; }
    h2 { margin-top: 28px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #d1d5db; padding: 9px 12px; text-align: left; }
    th { background: #f3f4f6; }
    .allow { color: #16a34a; font-weight: 600; }
    .deny  { color: #dc2626; font-weight: 600; }
    .fail  { color: #dc2626; font-size: 0.9em; }
    .pass  { color: #16a34a; font-size: 0.9em; }
    button { margin-right: 8px; padding: 9px 14px; border: 1px solid #9ca3af; background: white; cursor: pointer; border-radius: 4px; }
    button:hover { background: #f3f4f6; }
    code, pre { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 0.92em; }
    .info { background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px 14px; border-radius: 4px; margin: 12px 0; }
    .warn { background: #fffbeb; border: 1px solid #fde68a; padding: 10px 14px; border-radius: 4px; margin: 12px 0; }
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
}
async function dashboard() {
    const needsPrompt = await consentNeedsPrompt();
    const vendors = await vendorDecisions();
    const health = await productHealth();
    const supabase = supabaseStatus();
    const schema = await supabaseSchemaReport();
    const policyVersion = getPolicyVersion();
    const vendorRows = vendors
        .map((v) => `<tr>
          <td>${v.name}</td>
          <td>${v.category}</td>
          <td>${v.choice}</td>
          <td class="${v.allowed ? 'allow' : 'deny'}">${v.allowed ? 'ALLOW' : 'DENY'}</td>
        </tr>`)
        .join('');
    const warpRows = schema.results
        .map((r) => {
        const status = r.errors.length === 0 ? '<span class="pass">PASS</span>' : `<span class="fail">FAIL</span>`;
        const detail = r.errors.length === 0
            ? '-'
            : `<ul style="margin:0;padding-left:18px">${r.errors.map((e) => `<li>${e}</li>`).join('')}</ul>`;
        return `<tr><td>${r.name}</td><td>${status}</td><td>${detail}</td></tr>`;
    })
        .join('');
    const promptBadge = needsPrompt
        ? `<span style="color:#b45309;font-weight:600">YES - user must re-consent</span>`
        : `<span style="color:#16a34a;font-weight:600">no</span>`;
    return page(`
    <header>
      <h1>Sys Demo Product</h1>
      <p>A tiny product demoing <code>@sys/consent</code>, <code>@sys/warp</code>, and <code>@sys/sentinel</code>.</p>
    </header>
    <main>

      <h2>@sys/consent - cookie/script consent engine</h2>
      <div class="${needsPrompt ? 'warn' : 'info'}">
        <strong>Consent prompt needed:</strong> ${promptBadge}<br>
        <strong>Current policy version:</strong> <code>${policyVersion}</code>
      </div>
      <p style="margin-top:8px">
        <form method="post" action="/consent/analytics" style="display:inline">
          <button>Grant analytics</button>
        </form>
        <form method="post" action="/consent/reject" style="display:inline">
          <button>Reject non-essential</button>
        </form>
        <form method="post" action="/consent/bump-policy" style="display:inline">
          <button title="Changes POLICY_VERSION; stored decisions become stale and requiresReprompt returns true">
            Bump policy version
          </button>
        </form>
      </p>
      <p style="color:#6b7280;font-size:0.9em">
        After granting consent, click <em>Bump policy version</em>; the stored decision becomes stale
        (old version != new version) and <code>requiresReprompt()</code> returns <strong>true</strong>.
      </p>
      <table>
        <thead><tr><th>Vendor</th><th>Category</th><th>Choice</th><th>Decision</th></tr></thead>
        <tbody>${vendorRows}</tbody>
      </table>

      <h2>@sys/warp - config cross-validation</h2>
      <div class="${schema.clean ? 'info' : 'warn'}">
        <strong>Schema check:</strong>
        ${schema.clean ? '<span class="pass">clean</span>' : `<span class="fail">${schema.errorCount} issue(s) found</span>`}
        &nbsp;|&nbsp;case: <code>${schema.case}</code>
        &nbsp;|&nbsp;source: <code>${schema.source === 'live' ? 'Supabase live schema' : schema.source === 'fixed-demo' ? 'fixed demo SQL' : 'demo SQL fallback'}</code>
      </div>
      <table>
        <thead><tr><th>Check</th><th>Result</th><th>Errors</th></tr></thead>
        <tbody>${warpRows}</tbody>
      </table>

      <h2>@sys/sentinel - health</h2>
      <div class="${health.healthy ? 'info' : 'warn'}">
        <strong>Status:</strong> ${health.healthy ? 'healthy' : 'unhealthy'} - ${health.summary}<br>
        <strong>Supabase:</strong> ${supabase.configured ? 'configured' : `missing ${supabase.missing.join(', ')}`}
      </div>

      <p style="margin-top:24px;color:#6b7280;font-size:0.85em">
        JSON endpoints:
        <a href="/api/vendors">/api/vendors</a>,
        <a href="/api/supabase">/api/supabase</a>,
        <a href="/health">/health</a>
      </p>
    </main>
  `);
}
async function handleRequest(req, res) {
    try {
        if (req.method === 'POST' && req.url === '/consent/analytics') {
            await recordConsent(['analytics']);
            res.writeHead(303, { Location: '/' }).end();
            return;
        }
        if (req.method === 'POST' && req.url === '/consent/reject') {
            await recordConsent([]);
            res.writeHead(303, { Location: '/' }).end();
            return;
        }
        if (req.method === 'POST' && req.url === '/consent/bump-policy') {
            bumpPolicyVersion();
            res.writeHead(303, { Location: '/' }).end();
            return;
        }
        if (req.method === 'GET' && req.url === '/health') {
            res.writeHead(200, { 'content-type': 'application/json' }).end(json(await productHealth()));
            return;
        }
        if (req.method === 'GET' && req.url === '/api/vendors') {
            res
                .writeHead(200, { 'content-type': 'application/json' })
                .end(json({ vendors: await vendorDecisions(), events: recentConsentEvents() }));
            return;
        }
        if (req.method === 'GET' && req.url === '/api/supabase') {
            res
                .writeHead(200, { 'content-type': 'application/json' })
                .end(json({ status: supabaseStatus(), schema: await supabaseSchemaReport() }));
            return;
        }
        if (req.method === 'GET' && req.url === '/') {
            res.writeHead(200, { 'content-type': 'text/html' }).end(await dashboard());
            return;
        }
        res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    }
    catch (error) {
        res
            .writeHead(500, { 'content-type': 'application/json' })
            .end(json({ error: error instanceof Error ? error.message : String(error) }));
    }
}
// Vercel serverless: export default handler
export default handleRequest;
// Local dev: start HTTP server when not running inside Vercel
if (!process.env.VERCEL) {
    const server = createServer(handleRequest);
    server.listen(port, () => {
        console.log(`Sys demo product running at http://localhost:${port}`);
    });
}
