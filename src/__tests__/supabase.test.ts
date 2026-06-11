import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { supabaseSchemaReport, supabaseStatus, warpDemoCase } from '../supabase.js'

// These tests drive the warp demo OFFLINE: with no SUPABASE_URL/ANON_KEY the report is built
// from the SQL fixtures (source 'demo'/'fixed-demo'), never a live schema fetch. Each test
// starts from a clean env baseline so results don't depend on the shell or a loaded .env.

const ENV_KEYS = [
  'WARP_DEMO_CASE',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'PRODUCT_PUBLIC_URL',
] as const

let saved: Record<string, string | undefined>

beforeEach(() => {
  saved = {}
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k]
    delete process.env[k]
  }
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

function byName(results: { name: string; errors: string[] }[]) {
  return Object.fromEntries(results.map((r) => [r.name, r]))
}

describe('warpDemoCase()', () => {
  it('defaults to broken', () => {
    expect(warpDemoCase()).toBe('broken')
  })

  it('returns fixed only when WARP_DEMO_CASE is exactly "fixed"', () => {
    process.env.WARP_DEMO_CASE = 'fixed'
    expect(warpDemoCase()).toBe('fixed')
    process.env.WARP_DEMO_CASE = 'something-else'
    expect(warpDemoCase()).toBe('broken')
  })
})

describe('supabaseStatus()', () => {
  it('reports not-configured and lists missing keys when env is absent', () => {
    const status = supabaseStatus()
    expect(status.configured).toBe(false)
    expect(status.missing).toContain('SUPABASE_URL')
    expect(status.missing).toContain('SUPABASE_ANON_KEY')
  })

  it('reports configured when both Supabase keys are present', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-anon'
    const status = supabaseStatus()
    expect(status.configured).toBe(true)
    expect(status.missing).toEqual([])
  })
})

describe('supabaseSchemaReport() — offline fixtures', () => {
  it('broken case catches the planted schema + vendor issues', async () => {
    process.env.WARP_DEMO_CASE = 'broken' // unconfigured -> SQL fixture, not a live fetch
    const report = await supabaseSchemaReport()
    expect(report.case).toBe('broken')
    expect(report.source).toBe('demo')

    const checks = byName(report.results)
    // amount_usd bakes a currency into the column name
    expect(checks['supabase-schema-genericity'].errors.length).toBeGreaterThan(0)
    // feature flag references the unregistered "unknown-tracker" vendor
    expect(checks['vendor-registry-integrity'].errors.length).toBeGreaterThan(0)
  })

  it('fixed case passes schema + vendor + env checks (clean)', async () => {
    process.env.WARP_DEMO_CASE = 'fixed'
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-anon'
    process.env.PRODUCT_PUBLIC_URL = 'https://example.test'

    const report = await supabaseSchemaReport()
    expect(report.case).toBe('fixed')
    expect(report.source).toBe('fixed-demo')

    const checks = byName(report.results)
    expect(checks['supabase-schema-genericity'].errors).toEqual([])
    expect(checks['vendor-registry-integrity'].errors).toEqual([])
    expect(checks['required-env-config'].errors).toEqual([])
    expect(report.clean).toBe(true)
  })
})
