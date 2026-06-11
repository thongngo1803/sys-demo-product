# Person C - Data & Trust Presentation Pack

This file contains the full presentation plan for **Person C - Data & Trust**.

It is structured as **three talks**, because Person C is responsible for:

1. **Foundation Talk:** Coding Standards
2. **Package Deep Dive:** `@sys/consent`
3. **Package Deep Dive:** `@sys/warp`

Core message:

> Data & Trust is about making the system accountable: consent protects permission, and warp protects validation.

---

## Executive Overview

| Talk | Topic | Main Goal | Demo |
|---|---|---|---|
| 1 | Coding Standards | Explain what "good code" means in Sys | Evidence-based package audit |
| 2 | `@sys/consent` | Explain ALLOW/DENY consent governance | Vercel web surface |
| 3 | `@sys/warp` | Explain config/schema cross-validation | Supabase schema + broken/fixed checks |

Person C package ownership:

| Person | Focus | Week 1 | Week 2 |
|---|---|---|---|
| C | Data & Trust | `@sys/consent` | `@sys/warp` |

Tool teaching responsibility:

| Package | Tool |
|---|---|
| `@sys/consent` | Vercel |
| `@sys/warp` | Supabase |

---

# Talk 1 - Coding Standards

## Purpose

This is the foundation talk. It explains how Sys defines good reusable code.

Opening script:

> Before going into my two packages, I want to explain the standard they are measured against. In Sys, good code is not only code that works. It must also be clean, consistent, reviewable, reusable, and auditable with file-and-line evidence.

---

## Why Standards Matter

Sys packages are designed to be reused across different applications.

Without standards, reusable packages can slowly become app-specific, hard to review, and risky to deploy.

The coding standard solves this by forcing each package to answer:

- What plane does it own?
- What does the host application inject?
- Is the contract validated?
- Does the package avoid app-specific imports?
- Does the package ship built artifacts?
- Is it classified and drift-gated?
- Can every claim be proven with file:line evidence?

---

## The Five Sys Rules

Use this as the main slide for standards.

| Rule | Meaning | Why It Matters |
|---|---|---|
| 1. Plane ownership | A package owns one main responsibility plane | Prevents mixed responsibility |
| 2. Composition root | Package config should enter through `defineX(config)` or a clear composition function | Keeps setup explicit |
| 3. Runtime validation | Config should be validated, normally with Zod | Catches malformed config early |
| 4. Boundary cleanliness | No app-specific imports | Keeps package reusable |
| 5. Distribution + classification | Ships from `dist`, appears in taxonomy, and passes drift checks | Makes release and review reliable |

Evidence from standards:

| Claim | Evidence |
|---|---|
| Standards include build structure, `tsup`, `dist`, and exports | `syngen-handbook/onboarding/05-SYS-STANDARDS.md:38` |
| Standards include `defineX(config)`, Zod validation, and secrets-free config | `syngen-handbook/onboarding/05-SYS-STANDARDS.md:40` |
| Standards include zero app-specific imports | `syngen-handbook/onboarding/05-SYS-STANDARDS.md:41` |
| Boundary checks are enforced by script | `syngen-handbook/onboarding/05-SYS-STANDARDS.md:14` |
| Taxonomy and path drift are enforced by script | `syngen-handbook/onboarding/05-SYS-STANDARDS.md:15` |

---

## Evidence-First Rule

Important mentor expectation:

> Every claim must have file:line evidence.

Bad version:

```text
This package is reusable.
```

Good version:

```text
The package exports only from its own core/service files:
sys/packages/consent/src/index.ts:5
sys/packages/consent/src/index.ts:6
```

In this presentation, every major technical claim is tied to a file and line number.

---

## Standards Audit Checklist

Use this checklist for any `@sys/*` package:

| Check | Question |
|---|---|
| Plane | Is the package classified in `taxonomy.yaml`? |
| Composition | Is there a `defineX(config)` or clear composition API? |
| Validation | Is config runtime-validated, preferably with Zod? |
| Boundaries | Does the package avoid app-specific imports? |
| Build | Does `package.json` export `dist` artifacts? |
| Tests | Are unit, integration, negative, and governance cases covered? |
| Gaps | What is not tested or not fully compliant? |

---

## Talk 1 Slide Roadmap

Recommended 15-slide structure:

1. Title: Coding Standards
2. Why standards exist
3. What "good code" means here
4. The five Sys rules
5. Rule 1: plane ownership
6. Rule 2: composition root
7. Rule 3: runtime validation
8. Rule 4: zero app-specific imports
9. Rule 5: dist + taxonomy + drift gate
10. Evidence-first review culture
11. Audit checklist
12. Consent audit preview
13. Warp audit preview
14. Tests and gaps
15. Transition to Person C packages

---

# Talk 2 - `@sys/consent`

## Purpose

`@sys/consent` is the Week 1 package for Person C.

Domain:

```text
Cookie/script consent engine
```

Main question:

```text
May this technology run here?
```

Output:

```text
ALLOW or DENY
```

Tool taught:

```text
Vercel
```

Required artifact:

```text
A deployed consent banner/surface demonstrating ALLOW vs DENY and version-bump re-prompt.
```

---

## Consent Presentation Script

Opening:

> The first package I am presenting is `@sys/consent`. This package protects user choice. It decides whether a browser technology, such as a cookie or script, may run in the current consent context.

Core explanation:

> The safe default is necessary-only. If the user has not made a decision, or if their decision is stale, only strictly necessary technology may run.

Demo explanation:

> I will show three states: before consent, after granting analytics, and after a policy version bump.

---

## Consent Plane Ownership

| Claim | Evidence |
|---|---|
| `@sys/consent` is classified as governance | `sys/taxonomy.yaml:388`, `sys/taxonomy.yaml:399` |
| It also touches control and data as secondary planes | `sys/taxonomy.yaml:400` |
| Its core module is listed in taxonomy | `sys/taxonomy.yaml:408` |

How to say it:

> Consent belongs primarily to the Governance Plane because it makes the decision of whether technology is allowed to run. It touches data because it defines consent records, and control because it affects runtime behavior.

---

## Consent Core Evidence

| Claim | Evidence |
|---|---|
| Consent category vocabulary exists | `sys/packages/consent/src/core.ts:9`, `sys/packages/consent/src/core.ts:27` |
| Vendor contract exists | `sys/packages/consent/src/core.ts:71` |
| Consent decision contract exists | `sys/packages/consent/src/core.ts:101` |
| Consent context exists | `sys/packages/consent/src/core.ts:109` |
| `requiresReprompt()` exists | `sys/packages/consent/src/core.ts:120` |
| `canUse()` exists | `sys/packages/consent/src/core.ts:129` |
| Stale decision falls back to necessary-only | `sys/packages/consent/src/core.ts:131` |
| `canLoadVendor()` exists | `sys/packages/consent/src/core.ts:136` |
| Vendor loading delegates to category decision | `sys/packages/consent/src/core.ts:143` |
| Category map builder exists | `sys/packages/consent/src/core.ts:150` |

---

## Consent Host Injection Evidence

| Claim | Evidence |
|---|---|
| Package defines `ConsentStore` interface | `sys/packages/consent/src/core.ts:181` |
| Package defines `ConsentEventSink` interface | `sys/packages/consent/src/core.ts:209` |
| Service composition accepts `store` and optional `sink` | `sys/packages/consent/src/service.ts:17`, `sys/packages/consent/src/service.ts:18`, `sys/packages/consent/src/service.ts:19` |
| Public entry exports core and service only | `sys/packages/consent/src/index.ts:5`, `sys/packages/consent/src/index.ts:6` |

How to say it:

> The consent package does not own a database. It defines the contract, and the host application injects persistence through `ConsentStore`.

---

## Consent Contract Audit

| Standard Check | Result | Evidence |
|---|---|---|
| Plane ownership | Pass | `sys/taxonomy.yaml:399` |
| Composition API | Partial | `createConsentService()` exists at `sys/packages/consent/src/service.ts:17`, but it is not named `defineConsent` |
| Zod/runtime config validation | Gap | No Zod validation found in consent package |
| Zero app-specific imports | Pass | Public entry exports only `./core` and `./service` at `sys/packages/consent/src/index.ts:5-6` |
| Dist output | Pass | `sys/packages/consent/package.json:8`, `sys/packages/consent/package.json:10`, `sys/packages/consent/package.json:14`, `sys/packages/consent/package.json:22` |
| Side effects disabled | Pass | `sys/packages/consent/package.json:7` |
| Tests | Pass | 10 test files, 43 tests passed |

Important honest framing:

> Consent is functionally solid for the demo, but the contract audit has a standards gap: composition exists through `createConsentService`, but it does not use the `defineX(config)` naming pattern and does not validate config with Zod.

---

## Consent Demo Flow

Open:

```text
http://localhost:4173
```

Starting state:

```text
Session Cookie       -> ALLOW
Product Analytics    -> DENY
Support Widget       -> DENY
```

Click:

```text
Grant analytics
```

Expected state:

```text
Session Cookie       -> ALLOW
Product Analytics    -> ALLOW
Support Widget       -> DENY
```

Click:

```text
Bump policy version
```

Expected explanation:

```text
The old consent decision is stale.
requiresReprompt() returns true.
Non-essential vendors are blocked again until the user confirms the new policy.
```

---

## Consent Demo Evidence In Host App

| Demo Claim | Evidence |
|---|---|
| Demo policy version exists | `sys-demo-product/src/consent.ts:18` |
| Policy bump exists | `sys-demo-product/src/consent.ts:23` |
| Vendor registry exists | `sys-demo-product/src/consent.ts:32` |
| In-memory store implements host persistence | `sys-demo-product/src/consent.ts:66` |
| `recordConsent()` records a decision | `sys-demo-product/src/consent.ts:126` |
| `vendorDecisions()` calls the consent engine | `sys-demo-product/src/consent.ts:159` |
| Dashboard consent routes exist | `sys-demo-product/src/server.ts:150`, `sys-demo-product/src/server.ts:156`, `sys-demo-product/src/server.ts:162` |

---

## Consent Tests And Gaps

Commands run:

```powershell
pnpm --filter @sys/consent test
pnpm --filter @sys/consent typecheck
```

Result:

```text
Test Files: 10 passed
Tests: 43 passed
Typecheck: passed
```

What is tested:

- Decision engine behavior
- Category builder
- Service behavior
- Lifecycle integration
- Governance policy behavior
- Negative inputs
- Unsupported cases
- Replay/adversarial protocol cases

Evidence files:

```text
sys/packages/consent/src/__tests__/engine.test.ts
sys/packages/consent/src/__tests__/unit-decision.test.ts
sys/packages/consent/src/__tests__/unit-build.test.ts
sys/packages/consent/src/__tests__/service.test.ts
sys/packages/consent/src/__tests__/integration-lifecycle.test.ts
sys/packages/consent/src/__tests__/governance-policy.test.ts
sys/packages/consent/src/__tests__/negative-input.test.ts
sys/packages/consent/src/__tests__/negative-unsupported.test.ts
sys/packages/consent/src/__tests__/adversarial-replay.test.ts
sys/packages/consent/src/__tests__/adversarial-protocol.test.ts
```

Gaps to mention:

- No Zod validation at composition time.
- Composition function is `createConsentService`, not `defineConsent(config)`.
- Production persistence is intentionally host-owned, so the demo uses an in-memory store.

---

## Consent Mentor Q&A

### Why not allow analytics by default?

Because the safe default is necessary-only. Analytics is not strictly necessary, so it must wait for user consent.

### Why re-prompt after policy changes?

Because the old consent no longer represents the user's choice under the new policy.

### Does consent store data in a database?

No. The package defines the `ConsentStore` contract. The host application owns persistence.

### Is consent a UI package?

No. The package is a governance decision engine. The dashboard is only the host app demo surface.

---

## Consent Slide Roadmap

Recommended 12-slide structure:

1. Title: `@sys/consent`
2. Domain: cookie/script consent
3. Main question: may this technology run?
4. ALLOW/DENY model
5. Safe default: necessary-only
6. Policy version and re-prompt
7. Plane ownership
8. Contract audit
9. Tests and gaps
10. Vercel demo surface
11. Live demo
12. Summary

---

# Talk 3 - `@sys/warp`

## Purpose

`@sys/warp` is the Week 2 package for Person C.

Domain:

```text
Config cross-validation
```

Tool taught:

```text
Supabase
```

Required artifact:

```text
Warp run against a Supabase schema, catching a planted integrity/naming issue.
```

---

## Warp Presentation Script

Opening:

> The second package is `@sys/warp`. If consent protects user permission, warp protects configuration correctness. It does not change the database and it does not run migrations. It validates schema and config and reports what is wrong.

Core explanation:

> Warp is a check runner. The host application injects the checks. Warp runs them and returns one report.

Demo explanation:

> I will show a broken case first, where warp catches `amount_usd` and `unknown-tracker`. Then I will switch to the fixed case, where the schema and config are corrected and every check passes.

---

## Warp Plane Ownership

| Claim | Evidence |
|---|---|
| `@sys/warp` is classified as governance | `sys/taxonomy.yaml:152`, `sys/taxonomy.yaml:163` |
| It has data as a secondary plane | `sys/taxonomy.yaml:164` |
| Taxonomy says checks are project-specific and injected | `sys/taxonomy.yaml:169` |
| Core module is listed | `sys/taxonomy.yaml:171` |
| Checks module is listed | `sys/taxonomy.yaml:174` |
| CLI module is listed | `sys/taxonomy.yaml:177` |

How to say it:

> Warp belongs to the Governance Plane because it validates whether configuration is acceptable. It touches the Data Plane because many checks inspect schema or data-shaped configuration.

---

## Warp Core Evidence

| Claim | Evidence |
|---|---|
| Check contract exists | `sys/packages/warp/src/core.ts:5` |
| Report type exists | `sys/packages/warp/src/core.ts:12` |
| Config type exists | `sys/packages/warp/src/core.ts:17` |
| `defineWarp()` exists | `sys/packages/warp/src/core.ts:22` |
| `runWarp()` exists | `sys/packages/warp/src/core.ts:27` |
| `isClean()` exists | `sys/packages/warp/src/core.ts:36` |
| `referentialCheck()` exists | `sys/packages/warp/src/checks.ts:8` |
| `requiredKeysCheck()` exists | `sys/packages/warp/src/checks.ts:30` |
| `hasBannedToken()` exists | `sys/packages/warp/src/checks.ts:56` |
| `findBannedColumns()` exists | `sys/packages/warp/src/checks.ts:67` |
| `bannedColumnsCheck()` exists | `sys/packages/warp/src/checks.ts:95` |

---

## Warp Contract Audit

| Standard Check | Result | Evidence |
|---|---|---|
| Plane ownership | Pass | `sys/taxonomy.yaml:163` |
| Composition API | Partial | `defineWarp()` exists at `sys/packages/warp/src/core.ts:22` |
| Zod/runtime config validation | Gap | `defineWarp()` is an identity-style helper; no Zod validation found |
| Zero app-specific imports | Pass | `checks.ts` only imports type from `./core` at `sys/packages/warp/src/checks.ts:5`; `index.ts` exports only package files at `sys/packages/warp/src/index.ts:4-5` |
| Dist output | Pass | `sys/packages/warp/package.json:8`, `sys/packages/warp/package.json:13`, `sys/packages/warp/package.json:17`, `sys/packages/warp/package.json:30` |
| CLI built artifact | Pass | `sys/packages/warp/package.json:10` |
| Side effects disabled | Pass | `sys/packages/warp/package.json:7` |
| Tests | Pass | 10 test files, 29 tests passed |

Honest framing:

> Warp follows the package shape well and has `defineWarp`, but a strict standards audit still finds a gap: config is not Zod-validated at the composition root.

---

## Warp Demo Checks

The demo product runs three checks:

```text
1. Schema genericity check
2. Vendor registry integrity check
3. Required environment config check
```

### Check 1 - Schema Genericity

Broken schema:

```sql
amount_usd integer not null
```

Problem:

```text
Currency is baked into the column name.
```

Fixed schema:

```sql
amount integer not null,
currency text not null
```

### Check 2 - Vendor Registry Integrity

Broken config:

```text
unknown-tracker
```

Problem:

```text
The feature flag references a vendor that is not in the approved registry.
```

### Check 3 - Required Environment Config

Required keys:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
PRODUCT_PUBLIC_URL
```

---

## Warp Demo Evidence In Host App

| Demo Claim | Evidence |
|---|---|
| Broken/fixed switch exists | `sys-demo-product/src/supabase.ts:6`, `sys-demo-product/src/supabase.ts:20` |
| Broken SQL has `amount_usd` | `sys-demo-product/src/supabase.ts:31` |
| Fixed SQL uses `amount` + `currency` | `sys-demo-product/src/supabase.ts:42` |
| Broken vendor config has `unknown-tracker` | `sys-demo-product/src/supabase.ts:90` |
| Fixed vendor config removes `unknown-tracker` | `sys-demo-product/src/supabase.ts:91` |
| Live Supabase columns are fetched | `sys-demo-product/src/supabase.ts:51` |
| `runWarp()` is called with three checks | `sys-demo-product/src/supabase.ts:140` |
| Dashboard shows current case | `sys-demo-product/src/server.ts:124` |
| CLI prints current case | `sys-demo-product/src/demo.ts:38` |

---

## Warp Broken Demo

Run:

```powershell
$env:WARP_DEMO_CASE='broken'
pnpm demo
```

Expected explanation:

```text
Warp runs against the broken case.
It finds amount_usd in the schema.
It finds unknown-tracker in the vendor config.
The report is not clean.
```

Expected output:

```text
[FAIL] supabase-schema-genericity
[FAIL] vendor-registry-integrity
[PASS] required-env-config

Total errors: 2
clean: false
```

---

## Warp Fixed Demo

Run:

```powershell
$env:WARP_DEMO_CASE='fixed'
pnpm demo
```

Expected explanation:

```text
Now the schema uses amount + currency.
The unknown vendor is removed.
All warp checks pass.
```

Expected output:

```text
[PASS] supabase-schema-genericity
[PASS] vendor-registry-integrity
[PASS] required-env-config

Total errors: 0
clean: true
```

---

## Warp Tests And Gaps

Commands run:

```powershell
pnpm --filter @sys/warp test
pnpm --filter @sys/warp typecheck
```

Result:

```text
Test Files: 10 passed
Tests: 29 passed
Typecheck: passed
```

What is tested:

- Core runner aggregation
- Clean report handling
- Referential checks
- Required key checks
- Banned column checks
- Negative cases
- Malformed cases
- Integration cases
- Governance cases
- Adversarial/evasion cases

Evidence files:

```text
sys/packages/warp/src/__tests__/core.test.ts
sys/packages/warp/src/__tests__/checks.test.ts
sys/packages/warp/src/__tests__/integration.test.ts
sys/packages/warp/src/__tests__/integration-clean.test.ts
sys/packages/warp/src/__tests__/governance.test.ts
sys/packages/warp/src/__tests__/governance-clean.test.ts
sys/packages/warp/src/__tests__/negative.test.ts
sys/packages/warp/src/__tests__/negative-malformed.test.ts
sys/packages/warp/src/__tests__/adversarial.test.ts
sys/packages/warp/src/__tests__/adversarial-evasion.test.ts
```

Gaps to mention:

- `defineWarp()` exists, but strict Zod validation is not present.
- Warp reports issues; it does not apply fixes or migrations.
- The fixed demo uses a corrected SQL fixture so the presentation can show the after-fix pass even before a real Supabase migration is applied.

---

## Warp Mentor Q&A

### Does warp fix the schema?

No. Warp only validates and reports. Humans or migration tools apply the fix.

### Does warp run migrations?

No. It is not a migration engine.

### How is warp different from a unit test?

Unit tests check code behavior.

Warp checks configuration, schema, and runtime structure.

### Why is `amount_usd` bad?

Because it hard-codes a currency into the schema. A more generic schema is `amount` plus `currency`.

### Why is `unknown-tracker` bad?

Because config references a vendor that is not registered. That weakens governance over tracking technology.

---

## Warp Slide Roadmap

Recommended 12-slide structure:

1. Title: `@sys/warp`
2. Domain: config cross-validation
3. What warp is not: not migration, not auto-fix
4. Check runner model
5. Supabase schema source
6. Check 1: schema genericity
7. Check 2: vendor registry integrity
8. Check 3: required env config
9. Contract audit
10. Tests and gaps
11. Broken/fixed live demo
12. Summary

---

# Live Demo Commands

## Start Local Dashboard

From `sys-demo-product`:

```powershell
pnpm check
pnpm start
```

Open:

```text
http://localhost:4173
```

## Consent Demo

Use the dashboard:

```text
1. Open /
2. Show ALLOW/DENY table
3. Click "Grant analytics"
4. Show Product Analytics becomes ALLOW
5. Click "Bump policy version"
6. Show re-prompt state
```

## Warp Broken CLI Demo

```powershell
$env:WARP_DEMO_CASE='broken'
pnpm demo
```

## Warp Fixed CLI Demo

```powershell
$env:WARP_DEMO_CASE='fixed'
pnpm demo
```

## Vercel Env

Broken demo:

```env
WARP_DEMO_CASE=broken
SUPABASE_DEBUG=false
```

Fixed demo:

```env
WARP_DEMO_CASE=fixed
SUPABASE_DEBUG=false
```

Only enable debug logs when actively debugging Supabase schema discovery:

```env
SUPABASE_DEBUG=true
```

---

# Accountable AI Closing Slide

Use this as the final conceptual slide.

```text
Consent    = permission
Warp       = validation
Gatekeeper = approval
Sentinel   = observability
```

Together:

```text
Permission + validation + approval + observability
= building blocks for accountable AI systems
```

Closing script:

> Consent makes sure technology only runs with the right permission. Warp makes sure configuration and schema are validated before they become production risk. In the larger Alethic picture, these are two building blocks of accountable AI: user permission and system validation.

---

# Final 60-Second Summary

> Person C owns Data & Trust. I prepared three talks: first, the coding standards that define good Sys packages; second, `@sys/consent`, which makes ALLOW/DENY decisions for cookies and scripts; and third, `@sys/warp`, which validates schema and configuration. The demo shows consent safe defaults, policy re-prompt, warp catching planted issues, and warp passing after the fix. Every claim is backed by file-and-line evidence, and both packages have passing tests and typechecks, with honest gaps around strict Zod validation at the composition root.
