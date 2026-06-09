type ConsentCategory = 'strictly_necessary' | 'preferences' | 'analytics' | 'marketing' | 'support';
type CategoryChoice = 'granted' | 'denied';
interface ConsentCategoryInfo {
    id: ConsentCategory;
    label: string;
    description: string;
    /** Strictly necessary categories are always on and cannot be toggled off. */
    essential: boolean;
}
/** Universal category vocabulary. Hosts may relabel via their own copy; the ids are the contract. */
declare const CONSENT_CATEGORIES: readonly ConsentCategoryInfo[];
declare const ALL_CONSENT_CATEGORIES: readonly ConsentCategory[];
declare const NON_ESSENTIAL_CATEGORIES: readonly ConsentCategory[];
/**
 * A declared piece of non-essential browser technology — a governance artifact, not a memory game.
 * Required fields identify it; the optional governance fields make vendor review auditable. The host
 * owns the concrete registry (vendors are host-specific).
 */
interface ConsentVendor {
    id: string;
    name: string;
    category: ConsentCategory;
    purpose: string;
    /** Required vendors load regardless of choice (strictly necessary / operational). */
    required: boolean;
    /** Personal data the vendor may receive. */
    dataCollected?: string[];
    /** Cookie names it sets. */
    cookies?: string[];
    /** Domains it calls. */
    domains?: string[];
    /** Countries it is enabled in. Empty/undefined = all enabled countries. */
    countries?: string[];
    /** Does it run BEFORE a choice? Must be false unless `required`. */
    runsPreConsent?: boolean;
    /** Human-readable retention statement. */
    retention?: string;
    /** Link to the vendor's DPA / terms. */
    dpaUrl?: string;
    /** Internal owner (team or person) responsible for it. */
    owner?: string;
    /** Whether it can be disabled at runtime (kill switch). */
    killSwitch?: boolean;
    /** ISO date it was last reviewed. */
    reviewedAt?: string;
}
interface ConsentDecision {
    policyVersion: string;
    registryVersion: string;
    categories: Record<ConsentCategory, CategoryChoice>;
    /** ISO timestamp of when the subject chose. */
    decidedAt: string;
}
interface ConsentContext {
    /** The subject's stored decision, or null if they haven't chosen yet. */
    decision: ConsentDecision | null;
    /** The CURRENT policy + registry versions to compare the stored decision against. */
    policyVersion: string;
    registryVersion: string;
}
/** True when there is no decision, or the stored decision predates the current policy/registry. */
declare function requiresReprompt(ctx: ConsentContext): boolean;
/** May technology in `category` run in this context? Safe default: necessary-only. */
declare function canUse(category: ConsentCategory, ctx: ConsentContext): boolean;
/** May this vendor load? Required vendors always may; others follow their category (+ country). */
declare function canLoadVendor(vendor: Pick<ConsentVendor, 'category' | 'required' | 'countries'>, ctx: ConsentContext, country?: string): boolean;
/**
 * Build a full categories map. Essential categories are always granted; every other category is
 * granted iff present in `grantedNonEssential`. Pure — the caller passes the category universe.
 */
declare function buildCategories(allCategories: readonly ConsentCategory[], grantedNonEssential: readonly ConsentCategory[]): Record<ConsentCategory, CategoryChoice>;
type ConsentSource = 'banner' | 'preferences' | 'account_settings' | 'import';
/** A persisted consent decision — the auditable record. Anonymous first, linked to a subject on login. */
interface ConsentRecord {
    subjectId: string | null;
    anonymousId: string;
    policyVersion: string;
    registryVersion: string;
    categories: Record<ConsentCategory, CategoryChoice>;
    source: ConsentSource;
    country?: string;
    userAgent?: string;
    ip?: string;
    createdAt: string;
}
/** Host-implemented persistence (e.g. Supabase). The package owns the contract, not the IO. */
interface ConsentStore {
    save(record: ConsentRecord): Promise<void>;
    /** Most recent record for an anonymous id and/or subject. */
    latest(query: {
        anonymousId?: string;
        subjectId?: string;
    }): Promise<ConsentRecord | null>;
    /** Attach an anonymous id's records to a subject (on login). */
    link(anonymousId: string, subjectId: string): Promise<void>;
}
type ConsentEventType = 'banner_shown' | 'accepted_all' | 'rejected_non_essential' | 'custom_saved' | 'changed' | 'vendor_blocked' | 'reprompt';
interface ConsentEvent {
    type: ConsentEventType;
    anonymousId: string;
    subjectId?: string | null;
    policyVersion: string;
    registryVersion: string;
    at: string;
    detail?: Record<string, unknown>;
}
/** Host-implemented sink (structured logs now, @sys/sentinel later). Never decides; only records. */
interface ConsentEventSink {
    emit(event: ConsentEvent): void;
}

interface ConsentService {
    /** Persist a consent record + emit a 'changed' event. */
    record(record: ConsentRecord): Promise<void>;
    /** Most recent stored record for an anonymous id and/or subject. */
    latest(query: {
        anonymousId?: string;
        subjectId?: string;
    }): Promise<ConsentRecord | null>;
    /** Attach an anonymous id's records to a subject (on login). */
    link(anonymousId: string, subjectId: string): Promise<void>;
    /** Emit a consent event (banner shown, vendor blocked, reprompt, …). */
    emit(event: ConsentEvent): void;
}
declare function createConsentService(deps: {
    store: ConsentStore;
    sink?: ConsentEventSink;
}): ConsentService;

export { ALL_CONSENT_CATEGORIES, CONSENT_CATEGORIES, type CategoryChoice, type ConsentCategory, type ConsentCategoryInfo, type ConsentContext, type ConsentDecision, type ConsentEvent, type ConsentEventSink, type ConsentEventType, type ConsentRecord, type ConsentService, type ConsentSource, type ConsentStore, type ConsentVendor, NON_ESSENTIAL_CATEGORIES, buildCategories, canLoadVendor, canUse, createConsentService, requiresReprompt };
