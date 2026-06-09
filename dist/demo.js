import { bumpPolicyVersion, consentNeedsPrompt, getPolicyVersion, recordConsent, vendorDecisions, } from './consent.js';
import { productHealth } from './health.js';
import { supabaseSchemaReport, supabaseStatus } from './supabase.js';
// ── @sys/consent demo ────────────────────────────────────────────────────────
console.log('\n=== @sys/consent: ALLOW / DENY decision engine ===\n');
console.log(`[1] Before any consent — policy version: "${getPolicyVersion()}"`);
console.log('    consentNeedsPrompt():', await consentNeedsPrompt());
console.table(await vendorDecisions());
await recordConsent(['analytics']);
console.log('[2] After granting analytics:');
console.log('    consentNeedsPrompt():', await consentNeedsPrompt());
console.table(await vendorDecisions());
console.log('[3] Bumping policy version — stored decision now predates the new version...');
const newVersion = bumpPolicyVersion();
console.log(`    POLICY_VERSION is now: "${newVersion}"`);
console.log('    consentNeedsPrompt():', await consentNeedsPrompt());
console.log('    → requiresReprompt() returns true because stored version ≠ current version.');
console.table(await vendorDecisions());
// ── @sys/warp demo ───────────────────────────────────────────────────────────
console.log('\n=== @sys/warp: config cross-validation (3 check types) ===\n');
const schema = await supabaseSchemaReport();
for (const result of schema.results) {
    const status = result.errors.length === 0 ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${result.name}`);
    for (const err of result.errors)
        console.log(`       ✗ ${err}`);
}
console.log(`\n  Total errors: ${schema.errorCount} — clean: ${schema.clean} — source: ${schema.source}`);
// ── @sys/sentinel demo ───────────────────────────────────────────────────────
console.log('\n=== @sys/sentinel: health probes ===\n');
const health = await productHealth();
console.log('healthy:', health.healthy, '| summary:', health.summary, '| alert:', health.alert);
console.log('Supabase status:', supabaseStatus());
