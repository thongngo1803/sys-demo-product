import { isClean, runWarp } from '@sys/warp';
import { bannedColumnsCheck, hasBannedToken, referentialCheck, requiredKeysCheck } from '@sys/warp/checks';
const BANNED_CURRENCY_TOKENS = ['usd', 'vnd', 'aed'];
// Fallback demo SQL used when Supabase is not configured.
// Mirrors the real demo_orders table — amount_usd is the planted issue.
const demoMigrationSql = `
create table public.demo_orders (
  id uuid primary key,
  customer_id uuid not null,
  amount_usd integer not null,
  currency text not null,
  created_at timestamptz not null default now()
);
`;
// Fetch column names for a table via PostgREST's built-in OpenAPI schema endpoint.
// Returns [] if Supabase is unreachable or the table is not found.
async function fetchSupabaseColumns(tableName) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key)
        return [];
    try {
        const res = await fetch(`${url}/rest/v1/`, {
            headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                Accept: 'application/openapi+json',
            },
        });
        if (!res.ok)
            return [];
        const openapi = (await res.json());
        return Object.keys(openapi.definitions?.[tableName]?.properties ?? {});
    }
    catch {
        return [];
    }
}
// Planted issue 2: feature-flag config references an unregistered vendor.
const FEATURE_FLAG_VENDOR_IDS = ['session-cookie', 'product-analytics', 'support-widget', 'unknown-tracker'];
const REGISTERED_VENDOR_IDS = ['session-cookie', 'product-analytics', 'support-widget'];
// Required env vars for full operation.
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
    const configured = supabaseStatus().configured;
    const bannedSet = new Set(BANNED_CURRENCY_TOKENS);
    // When Supabase is configured: query the real demo_orders columns via PostgREST OpenAPI.
    // When not configured: fall back to scanning the hardcoded demo migration SQL.
    const schemaGenericityCheck = configured
        ? {
            name: 'supabase-schema-genericity',
            async run() {
                const columns = await fetchSupabaseColumns('demo_orders');
                return columns
                    .filter((col) => hasBannedToken(col, bannedSet))
                    .map((col) => `Column "${col}" bakes a currency into the schema — found in live Supabase demo_orders. Prefer amount + currency fields.`);
            },
        }
        : bannedColumnsCheck('supabase-schema-genericity', {
            sql: () => demoMigrationSql,
            banned: BANNED_CURRENCY_TOKENS,
            message: (col) => `Column "${col}" bakes a currency into the schema (demo SQL). Prefer amount + currency fields.`,
        });
    const report = await runWarp({
        checks: [
            schemaGenericityCheck,
            referentialCheck('vendor-registry-integrity', {
                from: () => FEATURE_FLAG_VENDOR_IDS,
                to: () => REGISTERED_VENDOR_IDS,
                message: (id) => `Feature flag references unregistered vendor "${id}" — add it to the vendor registry or remove the flag.`,
            }),
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
        source: configured ? 'live' : 'demo',
    };
}
