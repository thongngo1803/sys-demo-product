# `@sys/consent` — Package Study (Person C · Week 1)

## 1. What it is

`@sys/consent` is a **pure cookie/script consent engine**. Its job is to answer one question: _"may this technology run in this context, for this user?"_

The package owns the **category vocabulary** (`strictly_necessary`, `preferences`, `analytics`, `marketing`, `support`), a **safe-default ALLOW/DENY decision engine**, and the **contract types** for consent records and events. It does not own a database, cookies, or a UI — the host application provides all of those as injected seams.

The two key invariants baked in:
- `strictly_necessary` always runs — unconditionally (`core.ts:130`).
- No decision, or a **stale** one (policy or registry version changed) → safe default: **necessary-only** (`core.ts:120-126`).

**Where it lives:** `sys/packages/consent/`
**Package name:** `@sys/consent`

---

## 2. Plane

From `taxonomy.yaml` (line 311–318):

```
id: sys-consent
primary_plane: governance
secondary_planes: [control, data]
```

- **Governance** (owns): enforces the policy of which technologies may run.
- **Control** (secondary): vendor load decisions affect what scripts execute.
- **Data** (secondary): consent records are a system-of-record the host persists.

The `ConsentStore` (data plane) and `ConsentEventSink` (observability) are **injected by the host** — the package never owns IO.

---

## 3. The five-rule contract check

### Rule 1 — Owns one plane, injects the rest

**Evidence:**
- Governance is the primary plane — the pure engine lives in `core.ts:117-144`.
- Data IO is injected via `ConsentStore` interface (`core.ts:181-187`). The package defines the contract; the host implements persistence (Supabase, in-memory, etc.).
- Observability is injected via `ConsentEventSink` interface (`core.ts:208-210`). Events are emitted but never stored internally.
- `createConsentService` receives both as deps at `service.ts:17-20`.

**Verdict: PASS**

---

### Rule 2 — Configurable via one composition root

**Expected:** a `defineX(config)` function with Zod validation.

**Evidence:**
- `service.ts:17` — `createConsentService({ store, sink? })` is the composition root. The host wires up the injected seams here.
- `index.ts:5-6` — only `createConsentService` + the engine functions are exported.

**Gap (finding):** the composition root is named `createConsentService`, not `defineConsent`. CONVENTIONS.md (rule 2) specifies `defineX(config)` as the convention. This is a minor naming divergence.

**Gap (finding):** there is **no Zod schema validation** on the config object. `createConsentService` accepts `{ store, sink? }` directly with no runtime validation (`service.ts:17-20`). The CONVENTIONS rule requires zod validation of the config.

**Verdict: PARTIAL — composition root exists but naming and zod validation are missing.**

---

### Rule 3 — Zero app-specific imports

**Evidence:**
- `core.ts` — imports nothing (no `import` statements at all beyond JSDoc comments).
- `service.ts:4` — `import type { ... } from './core'` — only imports from within the package.
- `index.ts:5-6` — only re-exports from `./core` and `./service`.

No file under `sys/packages/consent/` imports any app path. The `scripts/check-boundaries.mjs` CI script enforces this.

**Verdict: PASS**

---

### Rule 4 — Built artifact, not source-linked

**Evidence:**
- `package.json:8` — `"main": "./dist/index.cjs"` (CJS entry for older consumers).
- `package.json:14-18` — `"exports": { ".": { "import": "./dist/index.js", ... } }` (ESM entry).
- `package.json:10-12` — `"files": ["dist", "CHANGELOG.md"]` — only `dist` ships to consumers.
- `package.json:22` — `"build": "tsup"` — built with tsup (ESM + CJS + `.d.ts`).

Consumers import `@sys/consent`, not `../sys/packages/consent/src`.

**Verdict: PASS**

---

### Rule 5 — Classified + drift-gated

**Evidence:**
- `taxonomy.yaml:311` — `id: sys-consent` entry exists.
- `taxonomy.yaml:313-315` — `owner`, `last_reviewed`, `status: active`.
- `taxonomy.yaml:317-318` — `primary_plane: governance`, `secondary_planes: [control, data]`.
- `taxonomy.yaml:319-335` — `purpose` and `modules` with plane annotations.
- `scripts/check-taxonomy.mjs` (in `sys/`) runs as part of `pnpm check` and fails if the taxonomy entry drifts from the actual package paths.

**Verdict: PASS**

---

## 4. Tests & gaps

### What's tested

| Test file | Coverage |
|---|---|
| `engine.test.ts` | Full vocabulary invariants, `requiresReprompt` (5 version permutations), `canUse` (full category × state matrix), `canLoadVendor` (required/optional/country), `buildCategories` invariants |
| `service.test.ts` | `record` (persists + emits changed event, works without sink, propagates store failure), `latest` (returns newest by anon/subject), `link` (attaches anon rows, idempotent, doesn't steal other users'), `emit` passthrough |

Run: `pnpm --filter @sys/consent test` → all pass.

### Gaps

- **No Zod config schema** — `createConsentService` accepts any `{ store, sink? }` shape without runtime validation. A host passing a malformed store would fail at runtime, not at composition time.
- **No integration test** against a real `ConsentStore` implementation (e.g., Supabase). Tests use an in-memory double.
- **No test for concurrent `link` calls** — what happens if two requests race to link the same `anonymousId`?
- **No test for `buildCategories` with an unrecognised category string** — TypeScript prevents this, but runtime JS callers could pass garbage.
- **`ConsentVendor.countries` is optional** — no test verifying that `canLoadVendor` with `countries: []` (empty array, not undefined) behaves as "deny all countries" vs. "allow all".

---

## 5. Artifact

**Deployed demo:** `sys-demo-product` — a working HTTP server showing the `@sys/consent` engine live.

### What to demonstrate

1. **ALLOW vs DENY** — open the dashboard at `/`. The vendor table shows `Session Cookie` as `ALLOW` (required) and `Product Analytics` and `Support Widget` as `DENY` (no consent yet).

2. **Grant consent** — click "Grant analytics". The `product-analytics` row flips to `ALLOW`. `Support Widget` stays `DENY` because only `analytics` was granted.

3. **Reject** — click "Reject non-essential". Both non-required vendors flip back to `DENY`.

4. **Version-bump re-prompt** — grant analytics, then click **"Bump policy version"**. The stored decision has `policyVersion: "2026-06-demo"` but the current version is now `"2026-06-demo-vXXXXX"`. The dashboard shows `Consent prompt needed: YES` — `requiresReprompt()` returns `true` even though the user granted consent. This is the safe-default invariant in action.

### How it works (file:line)

- `requiresReprompt` at `core.ts:120-126` — compares stored vs. current versions.
- `canUse` at `core.ts:129-133` — delegates to `requiresReprompt`; stale decision = necessary-only.
- `getPolicyVersion` / `bumpPolicyVersion` at `consent.ts:23-31` (demo product).
- Dashboard + bump route at `server.ts:101-109` (demo product).

---

## 6. Lessons from my week

*(Casual reflection — no slides needed)*

To discuss live during the talk.
