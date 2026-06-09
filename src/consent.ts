import {
  ALL_CONSENT_CATEGORIES,
  buildCategories,
  canLoadVendor,
  createConsentService,
  requiresReprompt,
  type CategoryChoice,
  type ConsentCategory,
  type ConsentContext,
  type ConsentDecision,
  type ConsentEvent,
  type ConsentEventSink,
  type ConsentRecord,
  type ConsentStore,
  type ConsentVendor,
} from '@sys/consent'

export let POLICY_VERSION = '2026-06-demo'
export const REGISTRY_VERSION = 'vendors-1'
export const ANONYMOUS_ID = 'demo-browser'

/** Simulate a policy update — stored decisions become stale, triggering requiresReprompt. */
export function bumpPolicyVersion(): string {
  POLICY_VERSION = `2026-06-demo-v${Date.now().toString(36)}`
  return POLICY_VERSION
}

export function getPolicyVersion(): string {
  return POLICY_VERSION
}

export const vendors: ConsentVendor[] = [
  {
    id: 'session-cookie',
    name: 'Session Cookie',
    category: 'strictly_necessary',
    purpose: 'Keep the demo session stable.',
    required: true,
    owner: 'product-demo',
    reviewedAt: '2026-06-09',
  },
  {
    id: 'product-analytics',
    name: 'Product Analytics',
    category: 'analytics',
    purpose: 'Count page views for the demo dashboard.',
    required: false,
    cookies: ['pd_analytics'],
    domains: ['analytics.local'],
    owner: 'growth-demo',
    reviewedAt: '2026-06-09',
  },
  {
    id: 'support-widget',
    name: 'Support Widget',
    category: 'support',
    purpose: 'Let a user ask for help inside the demo product.',
    required: false,
    cookies: ['pd_support'],
    domains: ['support.local'],
    owner: 'support-demo',
    reviewedAt: '2026-06-09',
  },
]

class MemoryConsentStore implements ConsentStore {
  private records: ConsentRecord[] = []

  async save(record: ConsentRecord): Promise<void> {
    this.records.push(record)
  }

  async latest(query: { anonymousId?: string; subjectId?: string }): Promise<ConsentRecord | null> {
    for (let index = this.records.length - 1; index >= 0; index -= 1) {
      const record = this.records[index]
      if (
        (query.anonymousId !== undefined && record.anonymousId === query.anonymousId) ||
        (query.subjectId !== undefined && record.subjectId === query.subjectId)
      ) {
        return record
      }
    }
    return null
  }

  async link(anonymousId: string, subjectId: string): Promise<void> {
    this.records = this.records.map((record) =>
      record.anonymousId === anonymousId ? { ...record, subjectId } : record,
    )
  }

  count(): number {
    return this.records.length
  }
}

class MemoryEventSink implements ConsentEventSink {
  readonly events: ConsentEvent[] = []

  emit(event: ConsentEvent): void {
    this.events.push(event)
  }
}

const store = new MemoryConsentStore()
const sink = new MemoryEventSink()
export const consentService = createConsentService({ store, sink })

export function consentStoreStatus(): 'up' | 'down' {
  return store.count() >= 0 ? 'up' : 'down'
}

export function recentConsentEvents(): readonly ConsentEvent[] {
  return sink.events.slice(-10)
}

export function makeDecision(granted: readonly ConsentCategory[]): ConsentDecision {
  return {
    policyVersion: POLICY_VERSION,
    registryVersion: REGISTRY_VERSION,
    categories: buildCategories(ALL_CONSENT_CATEGORIES, granted),
    decidedAt: new Date().toISOString(),
  }
}

export async function recordConsent(granted: readonly ConsentCategory[]): Promise<ConsentRecord> {
  const decision = makeDecision(granted)
  const record: ConsentRecord = {
    subjectId: null,
    anonymousId: ANONYMOUS_ID,
    policyVersion: decision.policyVersion,
    registryVersion: decision.registryVersion,
    categories: decision.categories,
    source: 'banner',
    country: 'VN',
    userAgent: 'sys-demo-product',
    createdAt: decision.decidedAt,
  }
  await consentService.record(record)
  return record
}

export async function currentConsentContext(): Promise<ConsentContext> {
  const latest = await consentService.latest({ anonymousId: ANONYMOUS_ID })
  return {
    policyVersion: POLICY_VERSION,
    registryVersion: REGISTRY_VERSION,
    decision: latest
      ? {
          policyVersion: latest.policyVersion,
          registryVersion: latest.registryVersion,
          categories: latest.categories,
          decidedAt: latest.createdAt,
        }
      : null,
  }
}

export async function vendorDecisions(): Promise<
  Array<{ id: string; name: string; category: ConsentCategory; choice: CategoryChoice | 'required'; allowed: boolean }>
> {
  const ctx = await currentConsentContext()
  return vendors.map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
    category: vendor.category,
    choice: vendor.required ? 'required' : (ctx.decision?.categories[vendor.category] ?? 'denied'),
    allowed: canLoadVendor(vendor, ctx, 'VN'),
  }))
}

export async function consentNeedsPrompt(): Promise<boolean> {
  return requiresReprompt(await currentConsentContext())
}
