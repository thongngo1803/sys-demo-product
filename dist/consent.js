import { ALL_CONSENT_CATEGORIES, buildCategories, canLoadVendor, createConsentService, requiresReprompt, } from '@sys/consent';
export let POLICY_VERSION = '2026-06-demo';
export const REGISTRY_VERSION = 'vendors-1';
export const ANONYMOUS_ID = 'demo-browser';
/** Simulate a policy update — stored decisions become stale, triggering requiresReprompt. */
export function bumpPolicyVersion() {
    POLICY_VERSION = `2026-06-demo-v${Date.now().toString(36)}`;
    return POLICY_VERSION;
}
export function getPolicyVersion() {
    return POLICY_VERSION;
}
export const vendors = [
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
];
class MemoryConsentStore {
    records = [];
    async save(record) {
        this.records.push(record);
    }
    async latest(query) {
        for (let index = this.records.length - 1; index >= 0; index -= 1) {
            const record = this.records[index];
            if ((query.anonymousId !== undefined && record.anonymousId === query.anonymousId) ||
                (query.subjectId !== undefined && record.subjectId === query.subjectId)) {
                return record;
            }
        }
        return null;
    }
    async link(anonymousId, subjectId) {
        this.records = this.records.map((record) => record.anonymousId === anonymousId ? { ...record, subjectId } : record);
    }
    count() {
        return this.records.length;
    }
}
class MemoryEventSink {
    events = [];
    emit(event) {
        this.events.push(event);
    }
}
const store = new MemoryConsentStore();
const sink = new MemoryEventSink();
export const consentService = createConsentService({ store, sink });
export function consentStoreStatus() {
    return store.count() >= 0 ? 'up' : 'down';
}
export function recentConsentEvents() {
    return sink.events.slice(-10);
}
export function makeDecision(granted) {
    return {
        policyVersion: POLICY_VERSION,
        registryVersion: REGISTRY_VERSION,
        categories: buildCategories(ALL_CONSENT_CATEGORIES, granted),
        decidedAt: new Date().toISOString(),
    };
}
export async function recordConsent(granted) {
    const decision = makeDecision(granted);
    const record = {
        subjectId: null,
        anonymousId: ANONYMOUS_ID,
        policyVersion: decision.policyVersion,
        registryVersion: decision.registryVersion,
        categories: decision.categories,
        source: 'banner',
        country: 'VN',
        userAgent: 'sys-demo-product',
        createdAt: decision.decidedAt,
    };
    await consentService.record(record);
    return record;
}
export async function currentConsentContext() {
    const latest = await consentService.latest({ anonymousId: ANONYMOUS_ID });
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
    };
}
export async function vendorDecisions() {
    const ctx = await currentConsentContext();
    return vendors.map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        category: vendor.category,
        choice: vendor.required ? 'required' : (ctx.decision?.categories[vendor.category] ?? 'denied'),
        allowed: canLoadVendor(vendor, ctx, 'VN'),
    }));
}
export async function consentNeedsPrompt() {
    return requiresReprompt(await currentConsentContext());
}
