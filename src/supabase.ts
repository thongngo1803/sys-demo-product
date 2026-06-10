import { isClean, runWarp } from '@sys/warp'
import { bannedColumnsCheck, hasBannedToken, referentialCheck, requiredKeysCheck } from '@sys/warp/checks'

const BANNED_CURRENCY_TOKENS = ['usd', 'vnd', 'aed']

type WarpDemoCase = 'broken' | 'fixed'

// Presentation switch:
// - Keep "broken" to show warp catching planted issues.
// - Change to "fixed" (or set WARP_DEMO_CASE=fixed in .env) to show all checks passing after the fix.
const DEFAULT_WARP_DEMO_CASE: WarpDemoCase = 'broken'

export function warpDemoCase(): WarpDemoCase {
  return process.env.WARP_DEMO_CASE === 'fixed' ? 'fixed' : DEFAULT_WARP_DEMO_CASE
}

// Broken demo SQL mirrors the planted Supabase issue: amount_usd bakes a currency into the schema.
const brokenMigrationSql = `
create table public.demo_orders (
  id uuid primary key,
  customer_id uuid not null,
  amount_usd integer not null,
  currency text not null,
  created_at timestamptz not null default now()
);
`

// Fixed demo SQL keeps the amount generic and stores the currency as data.
const fixedMigrationSql = `
create table public.demo_orders (
  id uuid primary key,
  customer_id uuid not null,
  amount integer not null,
  currency text not null,
  created_at timestamptz not null default now()
);
`

// Fetch column names for a table via PostgREST's built-in OpenAPI schema endpoint.
// Requires the service_role key; the anon key returns 401 for this endpoint.
// Returns [] if Supabase is unreachable or the table is not found.
export async function fetchSupabaseColumns(tableName: string): Promise<string[]> {
  const url = process.env.SUPABASE_URL
  // The OpenAPI schema endpoint requires the service_role key, not the anon key
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY
  if (!url || !key) return []
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/openapi+json',
      },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '(unreadable)')
      console.error(`[DEBUG] OpenAPI fetch failed: HTTP ${res.status}: ${text.slice(0, 200)}`)
      return []
    }
    const openapi = (await res.json()) as {
      components?: { schemas?: Record<string, { properties?: Record<string, unknown> }> }
      definitions?: Record<string, { properties?: Record<string, unknown> }>
    }
    // OpenAPI 3.0 (Supabase/PostgREST 11+) uses components.schemas; fall back to Swagger 2.0 definitions
    const schemas = openapi.components?.schemas ?? openapi.definitions ?? {}
    const allKeys = Object.keys(schemas)
    console.error(`[DEBUG] Exposed tables (${allKeys.length}): [${allKeys.join(', ')}]`)
    if (!schemas[tableName]) {
      console.error(`[DEBUG] Table "${tableName}" not found in schema`)
    }
    const props = (schemas[tableName] ?? {}) as { properties?: Record<string, unknown> }
    return Object.keys(props.properties ?? {})
  } catch (err) {
    console.error(`[DEBUG] fetchSupabaseColumns exception:`, err)
    return []
  }
}

// In the broken case, feature flags reference an unregistered vendor.
// In the fixed case, every feature-flag vendor exists in the registry.
const BROKEN_FEATURE_FLAG_VENDOR_IDS = ['session-cookie', 'product-analytics', 'support-widget', 'unknown-tracker']
const FIXED_FEATURE_FLAG_VENDOR_IDS = ['session-cookie', 'product-analytics', 'support-widget']
const REGISTERED_VENDOR_IDS = ['session-cookie', 'product-analytics', 'support-widget']

// Required env vars for full operation.
const REQUIRED_ENV_KEYS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'PRODUCT_PUBLIC_URL']

export function supabaseStatus(): { configured: boolean; url: string | null; missing: string[] } {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY']
  const missing = required.filter((key) => !process.env[key])
  return {
    configured: missing.length === 0,
    url: process.env.SUPABASE_URL ?? null,
    missing,
  }
}

export async function supabaseSchemaReport(): Promise<{
  clean: boolean
  errorCount: number
  results: Array<{ name: string; errors: string[] }>
  source: 'live' | 'demo' | 'fixed-demo'
  case: WarpDemoCase
}> {
  const demoCase = warpDemoCase()
  const configured = supabaseStatus().configured
  const bannedSet = new Set(BANNED_CURRENCY_TOKENS)
  const featureFlagVendorIds =
    demoCase === 'fixed' ? FIXED_FEATURE_FLAG_VENDOR_IDS : BROKEN_FEATURE_FLAG_VENDOR_IDS

  // In broken mode, use live Supabase when configured so the demo catches the planted real schema issue.
  // In fixed mode, use the fixed SQL fixture so the "after" case can pass even before the DB is migrated.
  const useLiveSchema = configured && demoCase === 'broken'
  const schemaGenericityCheck = useLiveSchema
    ? {
        name: 'supabase-schema-genericity',
        async run(): Promise<string[]> {
          const columns = await fetchSupabaseColumns('demo_orders')
          return columns
            .filter((col) => hasBannedToken(col, bannedSet))
            .map((col) => `Column "${col}" bakes a currency into the schema; found in live Supabase demo_orders. Prefer amount + currency fields.`)
        },
      }
    : bannedColumnsCheck('supabase-schema-genericity', {
        sql: () => (demoCase === 'fixed' ? fixedMigrationSql : brokenMigrationSql),
        banned: BANNED_CURRENCY_TOKENS,
        message: (col) =>
          `Column "${col}" bakes a currency into the schema (demo SQL). Prefer amount + currency fields.`,
      })

  const report = await runWarp({
    checks: [
      schemaGenericityCheck,
      referentialCheck('vendor-registry-integrity', {
        from: () => featureFlagVendorIds,
        to: () => REGISTERED_VENDOR_IDS,
        message: (id) =>
          `Feature flag references unregistered vendor "${id}"; add it to the vendor registry or remove the flag.`,
      }),
      requiredKeysCheck('required-env-config', {
        required: () => REQUIRED_ENV_KEYS,
        present: () => REQUIRED_ENV_KEYS.filter((k) => !!process.env[k]),
        message: (key) => `Required env var "${key}" is not configured; product cannot operate without it.`,
      }),
    ],
  })

  return {
    clean: isClean(report),
    errorCount: report.errorCount,
    results: report.results,
    source: useLiveSchema ? 'live' : demoCase === 'fixed' ? 'fixed-demo' : 'demo',
    case: demoCase,
  }
}
