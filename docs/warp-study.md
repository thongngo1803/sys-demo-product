# `@sys/warp` — Package Study (Person C · Week 2)

## 1. What it is

`@sys/warp` is a **config cross-validation harness**. Its job is to run a set of named checks against a project's configuration or schema, collect all errors, and report a clean/not-clean verdict.

The package is built on two layers:
- **Generic engine** (`core.ts`) — runs any `Check[]`, aggregates errors, returns a `WarpReport`.
- **Reusable check builders** (`checks.ts`) — three ready-made patterns: `referentialCheck`, `requiredKeysCheck`, and `bannedColumnsCheck`. Projects compose these with their own data sources.

**Where it lives:** `sys/packages/warp/`
**Package name:** `@sys/warp`
**CLI:** `sys-warp` (for running a project's `warp.config.mjs` from the shell)

---

## 2. Plane

From `taxonomy.yaml` (line 139–162):

```
id: sys-warp
primary_plane: governance
secondary_planes: [data]
```

- **Governance** (owns): validates that a project's configuration satisfies declared constraints.
- **Data** (secondary): check builders operate on data sources (SQL, config maps, key sets) injected by the host.

The project supplies the `Check[]` (what to validate and where to read from). Warp owns the runner and the aggregation logic — not the specifics.

---

## 3. The five-rule contract check

### Rule 1 — Owns one plane, injects the rest

**Evidence:**
- The `Check` interface at `core.ts:5-8` is the injection point: `{ name: string; run: () => string[] | Promise<string[]> }`. The project implements `run()` — warp never touches the data source directly.
- `WarpConfig` at `core.ts:16-18` — `{ checks: Check[] }`. The project provides the checks array.
- The check builders in `checks.ts` are **pure functions** — they take closures (`from`, `to`, `sql`, etc.) as arguments. The data fetching happens inside those closures, which the project writes.
- Example: `referentialCheck` at `checks.ts:8-26` — `opts.from()` and `opts.to()` are supplied by the caller; warp just calls them.

**Verdict: PASS**

---

### Rule 2 — Configurable via one composition root

**Expected:** a `defineX(config)` function with Zod validation.

**Evidence:**
- `core.ts:21-24` — `defineWarp(config: WarpConfig): WarpConfig` exists and follows the `defineX` naming convention. ✅

**Gap (finding):** `defineWarp` is an **identity function** — it returns `config` unchanged with no Zod validation. The CONVENTIONS rule requires the composition root to validate (zod) and normalize the config. This is missing.

```typescript
// core.ts:21-24
export function defineWarp(config: WarpConfig): WarpConfig {
  return config   // no-op — no validation
}
```

**Verdict: PARTIAL — `defineX` naming present, Zod validation absent.**

---

### Rule 3 — Zero app-specific imports

**Evidence:**
- `core.ts` — no imports at all.
- `checks.ts:5` — `import type { Check } from './core'` — only imports from within the package.
- `cli.ts` — imports only from `./core` and Node built-ins (`node:path`, `node:url`).
- `index.ts:4-5` — re-exports from `./core` and `./checks` only.

**Verdict: PASS**

---

### Rule 4 — Built artifact, not source-linked

**Evidence:**
- `package.json:8` — `"main": "./dist/index.cjs"`.
- `package.json:14-23` — `"exports"` with two entry points:
  - `"."` → `dist/index.js` (main API including `defineWarp`, `runWarp`, check builders).
  - `"./checks"` → `dist/checks.js` (check builders only, for consumers that want tree-shaking).
- `package.json:10` — `"bin": { "sys-warp": "./dist/cli.js" }` — CLI ships as a built artifact.
- `package.json:10-12` — `"files": ["dist", "CHANGELOG.md"]`.
- `package.json:29` — `"build": "tsup"`.

**Verdict: PASS** — and also note the subpath export for `@sys/warp/checks` follows CONVENTIONS' "Subset by import" pattern.

---

### Rule 5 — Classified + drift-gated

**Evidence:**
- `taxonomy.yaml:139` — `id: sys-warp` entry exists.
- `taxonomy.yaml:146-147` — `primary_plane: governance`, `secondary_planes: [data]`.
- `taxonomy.yaml:153-162` — modules annotated: `src/core.ts` (governance), `src/checks.ts` (governance + data), `src/cli.ts` (cross-language CLI entry).
- `scripts/check-taxonomy.mjs` runs as part of `pnpm check`.

**Verdict: PASS**

---

## 4. Tests & gaps

### What's tested

| Test file | Coverage |
|---|---|
| `core.test.ts` | `runWarp` aggregates errors, reports clean when all pass, runs every check even when earlier ones fail |
| `checks.test.ts` | `referentialCheck` (flags absent values), `requiredKeysCheck` (flags missing keys), `hasBannedToken` (case-insensitive, segment-level), `findBannedColumns` (add column, create table, rename clears, line comments ignored, generic schema passes), `bannedColumnsCheck` (wraps findBannedColumns as a named check) |

Run: `pnpm --filter @sys/warp test` → all pass.

### Gaps

- **`cli.ts` has no tests** — the CLI entry point (`src/cli.ts`) loads a project's `warp.config.mjs` and calls `runWarp`. There are no tests for CLI argument parsing, missing config file, or malformed config.
- **No test for a thrown exception in `check.run()`** — the engine awaits `check.run()` but does not catch exceptions. If a check throws (vs. returning errors), `runWarp` propagates the error and no other checks run. This is undocumented and untested.
- **No test for empty `checks: []`** — `runWarp({ checks: [] })` should return `{ results: [], errorCount: 0 }`. Not explicitly asserted.
- **`defineWarp` has no tests** — because it's a no-op identity function, it has no observable behavior to test. But this also means zero coverage of the "composition root" path.
- **No async check test** — all tests use synchronous `run()`. The `Promise<string[]>` variant is accepted by TypeScript but has no test coverage.

---

## 5. Artifact

**Demo in `sys-demo-product`** — `supabase.ts` runs three check types against a demo Supabase schema and config.

### The three planted issues

| Check | Type | Planted issue | Expected output |
|---|---|---|---|
| `supabase-schema-genericity` | `bannedColumnsCheck` | `amount_usd` column bakes `usd` currency token into schema | `FAIL` — column flagged |
| `vendor-registry-integrity` | `referentialCheck` | Feature-flag config references `unknown-tracker`, not in vendor registry | `FAIL` — unknown vendor flagged |
| `required-env-config` | `requiredKeysCheck` | `SUPABASE_ANON_KEY` and `PRODUCT_PUBLIC_URL` not set in demo environment | `FAIL` — missing keys flagged |

### How to run it

```bash
# CLI demo (prints check results to stdout)
pnpm demo

# Or run the server and check /api/supabase
pnpm start
# open http://localhost:4173/api/supabase
```

The dashboard at `/` shows the warp check results table with PASS/FAIL and error messages for each check.

### How it works (file:line)

- `runWarp` engine at `core.ts:27-34` — runs all checks independently; one failure never blocks others.
- `bannedColumnsCheck` at `checks.ts:95-106` — wraps `findBannedColumns`.
- `findBannedColumns` at `checks.ts:67-92` — regex over CREATE TABLE and ALTER TABLE ADD COLUMN; `rename column` clears a banned token.
- `referentialCheck` at `checks.ts:8-26` — set difference between `from()` and `to()`.
- `requiredKeysCheck` at `checks.ts:29-48` — checks every required key is in the `present()` set.
- Demo config at `supabase.ts:4-14` (planted SQL), `supabase.ts:17-23` (planted vendor + env issues).

### Walk the check builders (presentation guide)

Start with `core.ts:5-8` — the `Check` interface is the seam. Everything else is a `Check` factory.

Then show `checks.ts:8-26` (`referentialCheck`) as the simplest: `from()` minus `to()` = errors. Explain why the closures matter — they defer the data fetch to runtime, not import time.

Then `checks.ts:95-106` (`bannedColumnsCheck`) — show how it wraps `findBannedColumns`, and trace `findBannedColumns` at line 67 to show the regex scanning. The `rename column` clearing at line 86 is clever — it means "we introduced a bad name but fixed it later" doesn't fail.

Finally `runWarp` at `core.ts:27-34` — show the `for` loop runs all checks regardless of errors. This is the key design decision: checks are independent; the report is the union of all findings.

---

## 6. Lessons from my week

*(Casual reflection — no slides needed)*

To discuss live during the talk.
