'use strict';

// src/core.ts
var CONSENT_CATEGORIES = [
  {
    id: "strictly_necessary",
    label: "Strictly necessary",
    description: "Required for sign-in, security, checkout, load balancing, fraud prevention, and remembering your cookie choice. Always on.",
    essential: true
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Remember choices like language and display so the site works the way you set it.",
    essential: false
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Help understand how the site is used so it can be improved. Aggregated \u2014 not used to identify you.",
    essential: false
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Measure campaigns and referrals.",
    essential: false
  },
  {
    id: "support",
    label: "Support tools",
    description: "In-page live chat and support widgets that may load third-party tools.",
    essential: false
  }
];
var ALL_CONSENT_CATEGORIES = CONSENT_CATEGORIES.map((c) => c.id);
var NON_ESSENTIAL_CATEGORIES = CONSENT_CATEGORIES.filter(
  (c) => !c.essential
).map((c) => c.id);
function requiresReprompt(ctx) {
  if (!ctx.decision) return true;
  return ctx.decision.policyVersion !== ctx.policyVersion || ctx.decision.registryVersion !== ctx.registryVersion;
}
function canUse(category, ctx) {
  if (category === "strictly_necessary") return true;
  if (requiresReprompt(ctx)) return false;
  return ctx.decision.categories[category] === "granted";
}
function canLoadVendor(vendor, ctx, country) {
  if (vendor.countries && country && !vendor.countries.includes(country)) return false;
  if (vendor.required) return true;
  return canUse(vendor.category, ctx);
}
function buildCategories(allCategories, grantedNonEssential) {
  const granted = new Set(grantedNonEssential);
  const out = {};
  for (const c of allCategories) {
    out[c] = c === "strictly_necessary" || granted.has(c) ? "granted" : "denied";
  }
  return out;
}

// src/service.ts
function createConsentService(deps) {
  const emit = (event) => deps.sink?.emit(event);
  return {
    async record(record) {
      await deps.store.save(record);
      emit({
        type: "changed",
        anonymousId: record.anonymousId,
        subjectId: record.subjectId,
        policyVersion: record.policyVersion,
        registryVersion: record.registryVersion,
        at: record.createdAt,
        detail: { source: record.source, categories: record.categories }
      });
    },
    latest: (query) => deps.store.latest(query),
    async link(anonymousId, subjectId) {
      await deps.store.link(anonymousId, subjectId);
    },
    emit
  };
}

exports.ALL_CONSENT_CATEGORIES = ALL_CONSENT_CATEGORIES;
exports.CONSENT_CATEGORIES = CONSENT_CATEGORIES;
exports.NON_ESSENTIAL_CATEGORIES = NON_ESSENTIAL_CATEGORIES;
exports.buildCategories = buildCategories;
exports.canLoadVendor = canLoadVendor;
exports.canUse = canUse;
exports.createConsentService = createConsentService;
exports.requiresReprompt = requiresReprompt;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map