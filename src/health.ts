import { defineSentinel, healthAlert, runHealth } from '@sys/sentinel'
import type { DepStatus, HealthReport, Probe } from '@sys/sentinel'
import { checkConfig, configProbe } from '@sys/sentinel/probes'

import { consentStoreStatus } from './consent.js'
import { supabaseStatus } from './supabase.js'

const consentStoreProbe: Probe = {
  name: 'consent-store',
  run(): DepStatus {
    return { name: 'consent-store', status: consentStoreStatus() }
  },
}

const supabaseProbe: Probe = {
  name: 'supabase',
  run(): DepStatus {
    const status = supabaseStatus()
    if (status.configured) return { name: 'supabase', status: 'up', detail: status.url ?? undefined }
    return checkConfig('supabase', status.missing)
  },
}

export const sentinelConfig = defineSentinel({
  probes: [consentStoreProbe, supabaseProbe, configProbe('public-url', ['PRODUCT_PUBLIC_URL'])],
  critical: ['consent-store'],
})

export async function productHealth(): Promise<HealthReport & { alert: boolean; summary: string }> {
  const report = await runHealth(sentinelConfig)
  const alert = healthAlert(report)
  return { ...report, ...alert }
}
