# Person C — Data & Trust

*Read the plain text aloud. Lines in *[bracketed italics]* are stage directions — show the
file, run the command, or click. File references like `core.ts:123` are there so anyone
watching can open the exact line. Every line number here was verified against the live repo
on 2026-06-11.*

My lane is Data & Trust. I own two `@sys` packages: `@sys/consent`, which protects
permission, and `@sys/warp`, which protects validation. Before those, I'll give the
foundation talk on our coding standards, because both packages are measured against it. The
thread through all three talks is accountability — consent decides whether a technology is
allowed to run, and warp decides whether configuration is fit to ship.

---

# Talk 1 — Coding Standards

*[Tool for this talk: Cursor — navigating and auditing the monorepo.]*

Before I get to my packages, I want to explain the standard they're measured against. Here,
good code isn't just code that works. It has to be clean, consistent, reviewable, reusable,
and auditable — with every claim backed by a file and a line.

Why does that matter? Our `@sys` packages are meant to be reused across different
applications. Without a standard, a reusable package slowly drifts: it picks up app-specific
assumptions, gets harder to review, and becomes risky to deploy. The standard stops that
drift by making every package answer the same questions — what does it own, what does the
host inject, is its config validated, does it avoid app-specific imports, does it ship built
artifacts, and is it classified and drift-gated.

That comes down to five rules.

*[Show: the five-rule slide.]*

One — plane ownership: a package owns a single responsibility plane, so responsibilities
never blur. Two — composition root: configuration enters through one clear function,
`defineX(config)`, so setup is explicit, not scattered. Three — runtime validation: that
config is validated, normally with Zod, so malformed input fails fast instead of leaking
downstream. Four — boundary cleanliness: no app-specific imports, so the package stays
portable. And five — distribution and classification: it ships built artifacts from `dist`,
appears in the taxonomy, and passes drift checks — which is what makes release and review
trustworthy.

*[Evidence on screen: `syngen-handbook/onboarding/05-SYS-STANDARDS.md` — build/dist/exports
at :38, defineX + Zod + secrets-free at :40, zero app-specific imports at :41, and the
enforcement scripts at :14 and :15.]*

The fastest way to see why each rule matters is to see it broken, then fixed.

*[Show: code examples.]*

**Rule 2 — composition root.** Without a single entry point, setup is scattered and
invisible to reviewers:

```typescript
// bad: setup spread across the caller — no single place to audit
const svc = new ConsentEngine()
svc.setStore(store)
svc.setPolicyVersion('v1')
svc.setSink(sink)
```

With a composition root, everything is explicit in one call:

```typescript
// good: one reviewable entry point
const svc = createConsentService({ store, sink })  // consent.ts:123
```

**Rule 3 — runtime validation.** Without Zod, bad config leaks silently:

```typescript
// bad: PORT could be "abc", SUPABASE_URL could be garbage — no early error
const port = Number(process.env.PORT ?? 4173)
const url = process.env.SUPABASE_URL
```

With Zod at the composition root — exactly what the demo does at `src/env.ts:3`:

```typescript
// good: invalid config throws immediately with a clear message
const { PORT: port } = parseEnv()
// PORT is a validated number; SUPABASE_URL is a validated URL or undefined
```

**Rule 4 — boundary cleanliness.** A package that imports app-specific code can never be
reused in another app:

```typescript
// bad: package reaches into the host's internals
import { supabaseClient } from '../../app/db'
import { analyticsTracker } from '../../app/mixpanel'
```

A clean package defines a contract and lets the host wire it in:

```typescript
// good: package exports the interface; host supplies the implementation
export interface ConsentStore { save(r: ConsentRecord): Promise<void> }
// host: createConsentService({ store: new SupabaseConsentStore(db) })
```

The pattern is the same across all five rules: bad code hides complexity in scattered state
or untrusted input; good code makes everything explicit and reviewable at one point.

The non-negotiable habit behind all of this is evidence-first. "This package is reusable" is
not a claim — it's a hope. "The package's public entry exports only its own core and service
files, at `index.ts:5-6`" is a claim, because you can open it and check. Everything I show
today is tied to a file and a line, and I verified every one against the live repo before
this talk.

So here's where my two packages land against the standard: both pass on plane ownership,
clean boundaries, distribution, and tests. Both packages have the same honest gap — neither
validates config with Zod at the composition root. That code is in the monorepo, outside my
lane this term. But the demo host fills that gap itself: the vendor registry is Zod-validated
at module init, all env config is parsed through a Zod schema before the server starts, and
I'll point to both in each talk. Surfacing the package gap is the job; the demo shows what
the fix looks like.

That's the lens. Now the two packages.

---

# Talk 2 — @sys/consent

*[Tool for this talk: Vercel — deploying the consent surface and reading runtime logs.]*

The first package is `@sys/consent`. It protects user choice. It answers one question: may
this technology — a cookie, a script, a vendor — run in the current consent context? The
answer is ALLOW or DENY, nothing more.

The rule that makes it safe is the default. If the user hasn't decided yet, or if their
decision is stale, only strictly necessary technology runs; everything else waits for
explicit consent.

*[Evidence on screen: the pure decision engine in `sys/packages/consent/src/core.ts` —
category vocabulary at :9 and :27, the vendor contract at :74, the decision contract at :104,
the context at :112, `requiresReprompt` at :123, `canUse` at :132, the stale-decision
fallback to necessary-only at :134, `canLoadVendor` at :139, its delegation to the category
decision at :146, and the category-map builder at :153.]*

Where does it sit? It's a governance package — that's its primary plane — and it touches
control and data as secondary planes. It's governance because it decides whether technology
may run; it touches data because it defines consent records, and control because it shapes
runtime behavior.

*[Show: `sys/taxonomy.yaml:538` for the primary plane, `:539` for the secondary planes, and
the entry at `:519`; the core module is listed at `:547`.]*

A key design point: consent does not own a database. It defines the contract — the
`ConsentStore` interface at `core.ts:184` and `ConsentEventSink` at `:212` — and the host
application injects the real persistence. The service composition takes the store and an
optional sink, at `service.ts:17-19`, and the public entry exports only its own core and
service, at `index.ts:5-6`. That's rule four, clean boundaries, in action.

Now the honest contract audit.

*[Show: the audit. Plane ownership: pass — `taxonomy.yaml:538`. Clean boundaries: pass —
`index.ts:5-6`. Ships from dist with side-effects off: pass — `package.json:7`, with dist
exports at :8, :10, :14, :22. Tests: pass — 10 files, 43 tests.]*

Two caveats in the package I won't paper over. The composition function is
`createConsentService`, not the `defineConsent` name the standard prefers — so I mark
composition Partial. And the package itself has no Zod validation of config at the root —
that's the Gap. That code is in the monorepo, outside my lane.

What the demo host does fill in: `VendorSchema` at `consent.ts:20` defines the vendor shape,
and `z.array(VendorSchema).min(1).parse(vendors)` at `:119` fires at module init — if any
vendor entry is malformed, the app throws immediately with a clear Zod error. All startup env
is parsed through `EnvSchema` at `src/env.ts:3` via `parseEnv()` at `:15`. That is Rule 3
applied where I own the code.

*[Show: consent code examples.]*

**The decision is one function call.** `canUse` encodes the safe default — if no decision
exists or the stored decision is stale, it returns `false` automatically:

```typescript
// core.ts:132 — the entire consent gate in one line
if (canUse('analytics', ctx)) {
  loadAnalytics()
}
// ctx.decision === null   → false (no consent yet)
// policyVersion mismatch  → false (requiresReprompt at :123)
// category 'analytics' granted → true
```

**The host wires two seams.** The package defines contracts; the host supplies the
implementations at composition time:

```typescript
// service.ts:17-19 — host injects store + optional event sink
const service = createConsentService({
  store: new SupabaseConsentStore(db),  // implements ConsentStore at core.ts:184
  sink:  new SentinelEventSink(),       // implements ConsentEventSink at core.ts:212
})
```

**Zod validates the vendor registry at module init** — demo's own application of Rule 3.
Any malformed entry throws before the first request is served:

```typescript
// consent.ts:119
z.array(VendorSchema).min(1).parse(vendors)
// if reviewedAt is missing or category is a typo → ZodError thrown at startup
```

Let me show it running.

*[Run: `pnpm start`, open `http://localhost:4173`.]*

Here's the starting state: Session Cookie is ALLOW, because it's strictly necessary and
required. Product Analytics and Support Widget are both DENY, because no consent has been
given yet — that's the safe default.

*[Click "Grant analytics".]*

Now Product Analytics flips to ALLOW — the user granted that category — while Support Widget
stays DENY, because support wasn't granted.

*[Click "Bump policy version".]*

I just simulated a policy change. The stored decision now predates the current policy
version, so `requiresReprompt` returns true, and every non-essential vendor is blocked again
until the user re-consents. That's the whole point: when the rules change, old permission
doesn't silently carry over.

*[Evidence in the demo: policy version at `sys-demo-product/src/consent.ts:32`, the bump at
`:37`, the vendor registry at `:46`, Zod vendor validation at `:119`, the in-memory store at
`:80`, `recordConsent` at `:142`, `vendorDecisions` at `:175`, and the dashboard routes at
`server.ts:151`, `:157`, `:163`.]*

On tests, the package ships 43 tests across 10 files — decision engine, category builder,
service, lifecycle, governance policy, negative inputs, and adversarial replay and protocol
cases. And because the demo product had no tests at all, I added 4 of my own in
`sys-demo-product/src/__tests__/consent.test.ts` that lock in exactly the flow I just showed
— necessary-only, grant, bump, re-prompt — running offline.

The gaps in the package: no Zod and not `defineConsent` — in the monorepo, not my lane.
In the demo host: persistence is in-memory — deliberately host-owned by design, but that has
a real consequence I hit, which I'll come back to in my lessons.

If anyone asks: analytics isn't on by default because it isn't strictly necessary —
necessary-only is the safe default. We re-prompt after a policy change because the old
consent no longer represents a choice under the new policy. Consent doesn't store anything
itself — it owns the contract, the host owns the database. And it's not a UI package — it's a
decision engine; the dashboard is only the demo's surface.

---

# Talk 3 — @sys/warp

*[Tool for this talk: Supabase — Postgres, schema, and validating it.]*

The second package is `@sys/warp`. If consent protects permission, warp protects correctness.
It does not touch the database and it does not run migrations. It validates schema and
configuration, and it reports what's wrong. That's the whole contract: validate and report,
never fix.

The model is a check runner. The host registers named checks; each check returns a list of
error strings; warp runs them all and aggregates one report.

*[Evidence on screen: `sys/packages/warp/src/core.ts` — the `Check` contract at :5, the
report type at :12, the config type at :17, `defineWarp` at :22, `runWarp` at :27, `isClean`
at :36. The reusable check builders are in `checks.ts` — `referentialCheck` at :8,
`requiredKeysCheck` at :30, `hasBannedToken` at :56, `findBannedColumns` at :67, and
`bannedColumnsCheck` at :105.]*

Plane: like consent, warp is governance — primary plane at `sys/taxonomy.yaml:179`, with data
as a secondary plane at :180, and the entry at :160. The taxonomy itself says the checks are
project-specific and injected, at :185, and lists the core, checks, and CLI modules at :187,
:190, and :193.

The contract audit looks like consent's.

*[Show: the audit. Plane, clean boundaries (`checks.ts:5` imports only a type from `./core`;
`index.ts:4-6` exports only package files), dist (`package.json:8`, :13, :17, :30), CLI
artifact (:10), side-effects off (:7): all pass. Tests: pass — 11 files, 45 tests.]*

The package gap is the same as consent's: `defineWarp` exists, at `core.ts:22`, but it's an
identity-style helper — it doesn't Zod-validate the config at the root. Same monorepo, same
lane restriction. The demo host covers the env side: `parseEnv()` at `src/env.ts:15` validates
`WARP_DEMO_CASE`, `SUPABASE_URL`, and all required keys through Zod before the server starts.

In the demo, warp runs three checks against our orders schema. First, schema genericity — a
banned-token scan that flags a currency baked into a column name. Second, vendor registry
integrity — a referential check that every feature-flag vendor exists in the approved
registry. Third, required environment config — that the keys the product needs are present.

*[Show: warp code examples.]*

**The check runner model.** Host registers named checks; warp runs them all and aggregates
one report — supabase.ts:140:

```typescript
const report = await runWarp({
  checks: [
    bannedColumnsCheck('schema-genericity',  { sql, banned: ['usd','vnd','aed'] }),
    referentialCheck('vendor-integrity',      { from: featureFlags, to: registry }),
    requiredKeysCheck('env-config',           { required: KEYS, present: presentKeys }),
  ]
})
isClean(report)  // true = zero errors across all three checks
```

**`hasBannedToken` is pure** — checks.ts:56. It splits a column name by `_` and tests
each segment against the banned set:

```typescript
hasBannedToken('amount_usd', new Set(['usd','vnd']))  // true  — segment 'usd' is banned
hasBannedToken('amount',     new Set(['usd','vnd']))  // false — no banned segment
hasBannedToken('currency',   new Set(['usd','vnd']))  // false — 'currency' is not in set
```

**`referentialCheck` wires any two collections** — checks.ts:8. Every item in `from()`
must exist in `to()`; missing ones produce a structured error:

```typescript
referentialCheck('vendor-registry-integrity', {
  from:    () => featureFlagVendorIds,   // ['session-cookie', ..., 'unknown-tracker']
  to:      () => REGISTERED_VENDOR_IDS,  // ['session-cookie', 'product-analytics', ...]
  message: id => `Unregistered vendor "${id}" referenced in feature flags`,
})
// broken case → errors: ['Unregistered vendor "unknown-tracker" ...']
// fixed case  → errors: []
```

Let me run the broken case.

*[Run: `$env:WARP_DEMO_CASE='broken'; pnpm demo`.]*

Warp catches two planted issues. The schema check fails on `amount_usd`, because that column
bakes a currency into the schema — *[show `sys-demo-product/src/supabase.ts:31`]*. And the
vendor check fails on `unknown-tracker`, a feature flag pointing at a vendor that was never
registered — *[show `supabase.ts:90`]*. The report is not clean: two errors, and the required
keys still pass.

```text
[FAIL] supabase-schema-genericity
[FAIL] vendor-registry-integrity
[PASS] required-env-config
Total errors: 2 — clean: false
```

Now the fix.

*[Run: `$env:WARP_DEMO_CASE='fixed'; pnpm demo`.]*

The schema now uses `amount` plus a separate `currency` column — *[show `supabase.ts:42`]* —
the unknown vendor is removed — *[show `supabase.ts:91`]* — and all three checks pass: zero
errors, clean. Same warp, same checks; only the config changed. `runWarp` is called with the
three checks at `supabase.ts:140`.

```text
[PASS] supabase-schema-genericity
[PASS] vendor-registry-integrity
[PASS] required-env-config
Total errors: 0 — clean: true
```

On tests, warp ships 45 tests across 11 files — the runner, all three check types,
environment-integrity, and negative, malformed, governance, and adversarial-evasion cases. I
added 6 more in `sys-demo-product/src/__tests__/supabase.test.ts`, covering the broken-catches
and fixed-clean behavior offline against the SQL fixtures — so the demo's own claim is tested.

Package gaps: `defineWarp` with no Zod — same as consent, same lane restriction. In the demo:
warp reports but never fixes or migrates; the fixed case uses a corrected SQL fixture, so the
after-fix demo passes before a real database migration is applied.

If anyone asks: warp doesn't fix the schema and doesn't run migrations — humans or migration
tools do that. It differs from a unit test because a unit test checks code behavior, while
warp checks configuration, schema, and runtime structure. `amount_usd` is bad because it
hard-codes a currency into the schema — `amount` plus `currency` is generic. And
`unknown-tracker` is bad because config that references an unregistered vendor weakens our
governance over tracking technology.

---

# Closing — why this is Data & Trust

*[Show: the four-primitive slide.]*

```text
Consent    = permission
Warp       = validation
Gatekeeper = approval
Sentinel   = observability
```

Step back, and these two packages are pieces of something bigger. Consent is permission. Warp
is validation. Add gatekeeper for approval and sentinel for observability, and you have the
building blocks of accountable AI: permission, validation, approval, and observability.
Consent makes sure technology only runs with the right permission. Warp makes sure
configuration and schema are validated before they become production risk. In the Alethic
picture, those are exactly the primitives that let agents act in a real business and still be
accountable.

By the numbers: 43 tests for consent, 45 for warp, plus 10 I added to the previously-untested
demo — 98 in all, green — and every line number in this deck verified against the live repo.

---

# Lessons from my week

*(Casual, no slides.)*

The biggest lesson: the repo is the source of truth, not the AI. AI drafts confident,
specific evidence — exact file and line numbers — and a lot of it was wrong. When I verified
this deck against the live repo, the consent line numbers were off by three from a certain
point on, the taxonomy references were off by over a hundred lines, and I'd written that warp
had 29 tests when the suite actually shows 45. Nothing looked wrong until I opened the files.
So the rule is literally true: use AI to draft, then verify against the repo before you say it
out loud.

Second: "connected" doesn't always mean "working." I wired up the Supabase and Vercel
connectors. The CLI said connected, but the tools weren't usable until I reloaded — and one
connector sat in a "Requested" state, waiting on an admin, which is a different thing
entirely. There are layers — transport, authentication, tool-loading — and green at one layer
doesn't mean the layer you actually need is ready.

Third: serverless broke an assumption I didn't know I had. The consent demo keeps its store
in memory. Locally that's invisible, because it's one process. The moment I looked at
deploying to Vercel, I realized each serverless invocation can be a fresh instance — so a
granted consent might not survive the next request. The package was right to make persistence
a host-injected seam; my demo just hadn't filled it with anything real yet. That's the honest
gap I'm carrying into next week: moving the store to Supabase.

And the one thing I'd tell my Monday self: don't trust a number or a line reference you
haven't opened yourself. Drafting is fast; verifying is the actual job.

---

# My frontier lightning talk (separate 15-minute slot)

Separately, I'm giving one 15-minute frontier lightning talk, and I'm taking Accountable AI —
the Alethic problem — because it's the natural extension of consent and warp: permission and
validation are two of the primitives that make an AI agent accountable enough to run real
work. Light and curious, researched with Perplexity and Claude.

---

# The 60-second version

Person C owns Data & Trust. Three talks: the coding standards that define a good Sys package;
`@sys/consent`, which makes ALLOW/DENY decisions for cookies and scripts; and `@sys/warp`,
which validates schema and configuration. The demo shows consent's safe default and policy
re-prompt, warp catching planted issues, and warp clean after the fix. Every claim is backed
by a file and a line — 43 tests for consent, 45 for warp, and 10 I added to the demo, 98 green
in all. Both packages share the same honest gap: no Zod at the composition root — in the
monorepo, outside my lane. The demo host applies Rule 3 itself: vendor registry Zod-validated
at `consent.ts:119`, env config through `EnvSchema` at `env.ts:3`.
