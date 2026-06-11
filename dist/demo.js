import { bumpPolicyVersion, consentNeedsPrompt, getPolicyVersion, recordConsent, vendorDecisions, } from './consent.js';
import { parseEnv } from './env.js';
import { productHealth } from './health.js';
import { fetchSupabaseColumns, supabaseSchemaReport, supabaseStatus } from './supabase.js';
parseEnv();
// @sys/consent demo
console.log('\n=== @sys/consent: ALLOW / DENY decision engine ===\n');
console.log(`[1] Before any consent - policy version: "${getPolicyVersion()}"`);
console.log('    consentNeedsPrompt():', await consentNeedsPrompt());
console.table(await vendorDecisions());
await recordConsent(['analytics']);
console.log('[2] After granting analytics:');
console.log('    consentNeedsPrompt():', await consentNeedsPrompt());
console.table(await vendorDecisions());
console.log('[3] Bumping policy version - stored decision now predates the new version...');
const newVersion = bumpPolicyVersion();
console.log(`    POLICY_VERSION is now: "${newVersion}"`);
console.log('    consentNeedsPrompt():', await consentNeedsPrompt());
console.log('    -> requiresReprompt() returns true because stored version != current version.');
console.table(await vendorDecisions());
// @sys/warp demo
console.log('\n=== @sys/warp: config cross-validation (3 check types) ===\n');
// Step 1: show Supabase connection status and fetched columns before running checks
const status = supabaseStatus();
const schema = await supabaseSchemaReport();
console.log(`[Warp demo case] ${schema.case}`);
if (status.configured && schema.case === 'broken') {
    console.log(`[Supabase] Connected - ${status.url}`);
    const columns = await fetchSupabaseColumns('demo_orders');
    if (columns.length > 0) {
        console.log(`[Supabase] demo_orders columns fetched: ${columns.join(', ')}`);
        console.log('           warp will scan these live column names for banned tokens\n');
    }
    else {
        console.log('[Supabase] demo_orders not found or no columns returned - check table exists and RLS allows anon read\n');
    }
}
else {
    const reason = status.configured
        ? 'fixed case uses the corrected SQL fixture so the after-fix demo passes before a DB migration'
        : `missing: ${status.missing.join(', ')}`;
    console.log(`[Supabase] Using ${schema.source} (${reason})\n`);
}
// Step 2: run warp checks
for (const result of schema.results) {
    const verdict = result.errors.length === 0 ? 'PASS' : 'FAIL';
    console.log(`[${verdict}] ${result.name}`);
    for (const err of result.errors)
        console.log(`       x ${err}`);
}
console.log(`\n  Total errors: ${schema.errorCount} - clean: ${schema.clean} - source: ${schema.source}`);
// @sys/sentinel demo
console.log('\n=== @sys/sentinel: health probes ===\n');
const health = await productHealth();
console.log('healthy:', health.healthy, '| summary:', health.summary, '| alert:', health.alert);
