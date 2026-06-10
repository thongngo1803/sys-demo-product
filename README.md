# Sys Demo Product

A tiny host application demonstrating how reusable `@sys/*` packages can be consumed by a real product while keeping business logic outside the packages.

---

# Purpose

This demo shows how Sys packages provide reusable governance and validation capabilities without owning application-specific behavior.

The host application owns:

* Persistence
* Vendor registry
* Event logging
* Health probes
* UI and API endpoints

The Sys packages provide reusable decision engines.

---

# Packages Demonstrated

## 1. @sys/consent

**Plane:** Governance

Purpose:

* Decide whether a browser technology may run.
* Return ALLOW or DENY.
* Enforce safe defaults.
* Support policy version re-prompting.

Example:

```text
User rejects analytics
-> DENY Google Analytics

User accepts analytics
-> ALLOW Google Analytics
```

---

## 2. @sys/warp

**Plane:** Governance

Purpose:

* Validate a Supabase/Postgres schema.
* Check referential integrity.
* Validate required mappings.
* Detect banned naming patterns.

Example findings:

```text
Foreign Key Violation
Missing Mapping
Naming Violation
```

---

## 3. @sys/sentinel

**Plane:** Observability

Purpose:

* Execute health probes.
* Aggregate probe results.
* Produce a system health report.

Example:

```text
Database: Healthy
API: Healthy
Supabase: Not Configured
```

---

# Host Responsibilities

The host application injects:

* Vendor registry
* Consent records
* Health probes
* Event log storage
* Supabase configuration

No Sys package owns product-specific behavior.

---

# Demo Flow

```text
User Action
    |
    v
@sys/consent
    |
    v
Vendor Decision
    |
    v
@sys/warp
    |
    v
Schema Validation
    |
    v
@sys/sentinel
    |
    v
Health Report
```

This demonstrates how governance and observability concerns remain reusable while the host application owns business logic.

---

# Running the Demo

```bash
pnpm install
pnpm check
pnpm start
```

Open:

```text
http://localhost:4173/
http://localhost:4173/health
http://localhost:4173/api/supabase
```

Optional Supabase configuration:

```bash
set SUPABASE_URL=https://your-project.supabase.co
set SUPABASE_ANON_KEY=your-anon-key
pnpm start
```

Warp presentation switch:

```bash
# Shows planted issues: amount_usd + unknown-tracker
set WARP_DEMO_CASE=broken

# Shows the corrected after-fix case: all warp checks pass
set WARP_DEMO_CASE=fixed
```

You can also change the default in `src/supabase.ts`:

```ts
const DEFAULT_WARP_DEMO_CASE: WarpDemoCase = 'broken'
```

Change `'broken'` to `'fixed'` when you want the dashboard and CLI demo to validate cleanly without editing environment variables.

Without these variables, Supabase validation will return:

```text
not_configured
```

---

# Sys Rule Evidence

See:

```text
docs/sys-rules-evidence.md
```

for contract verification, package boundaries, and evidence supporting compliance with Sys standards.
