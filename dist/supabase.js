import { isClean, runWarp } from '@sys/warp';
import { bannedColumnsCheck, referentialCheck, requiredKeysCheck } from '@sys/warp/checks';
// Planted issue 1: amount_usd bakes a currency code into the schema.
const demoMigrationSql = `
create table public.demo_orders (
  id uuid primary key,
  customer_id uuid not null,
  amount_usd integer not null,
  currency text not null,
  created_at timestamptz not null default now()
);
`;
// Planted issue 2: feature-flag config references an unregistered vendor.
const FEATURE_FLAG_VENDOR_IDS = ['session-cookie', 'product-analytics', 'support-widget', 'unknown-tracker'];
const REGISTERED_VENDOR_IDS = ['session-cookie', 'product-analytics', 'support-widget'];
// Planted issue 3: required env vars are not all present in demo mode.
const REQUIRED_ENV_KEYS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'PRODUCT_PUBLIC_URL'];
export function supabaseStatus() {
    const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    const missing = required.filter((key) => !process.env[key]);
    return {
        configured: missing.length === 0,
        url: process.env.SUPABASE_URL ?? null,
        missing,
    };
}
export async function supabaseSchemaReport() {
    const report = await runWarp({
        checks: [
            // Check 1 — bannedColumnsCheck: detect currency tokens baked into column names.
            bannedColumnsCheck('supabase-schema-genericity', {
                sql: () => demoMigrationSql,
                banned: ['usd', 'vnd', 'aed'],
                message: (column) => `Column "${column}" bakes a currency into the schema. Prefer amount + currency fields.`,
            }),
            // Check 2 — referentialCheck: every vendor ID used in feature-flag config must be registered.
            referentialCheck('vendor-registry-integrity', {
                from: () => FEATURE_FLAG_VENDOR_IDS,
                to: () => REGISTERED_VENDOR_IDS,
                message: (id) => `Feature flag references unregistered vendor "${id}" — add it to the vendor registry or remove the flag.`,
            }),
            // Check 3 — requiredKeysCheck: all required env vars must be set before the product can operate.
            requiredKeysCheck('required-env-config', {
                required: () => REQUIRED_ENV_KEYS,
                present: () => REQUIRED_ENV_KEYS.filter((k) => !!process.env[k]),
                message: (key) => `Required env var "${key}" is not configured — product cannot operate without it.`,
            }),
        ],
    });
    return {
        clean: isClean(report),
        errorCount: report.errorCount,
        results: report.results,
    };
}
