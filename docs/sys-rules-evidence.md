# Sys Rules Evidence

This product is a consumer demo, not a new `@sys/*` package. It still demonstrates the same integration discipline.

## Rule 1: Own one product domain, inject sys seams

- The app owns its demo product vendor registry in `src/consent.ts:22`.
- Persistence and observability are host-owned in-memory implementations in `src/consent.ts:56` and `src/consent.ts:87`.
- Those seams are injected into `createConsentService` in `src/consent.ts:97`.
- Health checks are host-owned probes injected into `defineSentinel` in `src/health.ts:14`.

## Rule 2: Configure sys packages through composition roots

- `@sys/consent` is composed with `createConsentService({ store, sink })` in `src/consent.ts:97`.
- `@sys/sentinel` is composed with `defineSentinel({ probes, critical })` in `src/health.ts:14`.
- `@sys/warp` is composed with a host-supplied Supabase migration SQL check in `src/supabase.ts`.

## Rule 3: Zero app-specific imports inside sys

- The app imports `@sys/consent` in `src/consent.ts:16`.
- The app imports `@sys/sentinel` in `src/health.ts:1` and `src/health.ts:2`.
- The app imports `@sys/warp` in `src/supabase.ts`.
- No code under `../sys/packages/*` imports this demo product.

## Rule 4: Use built package exports

- `package.json` depends on `@sys/consent`, `@sys/sentinel`, and `@sys/warp` as packages.
- The app imports package entry points, including `@sys/sentinel/probes` in `src/health.ts:3`, not `../sys/packages/*/src`.

## Rule 5: Safe, evidence-based checks

- `package.json:13` defines `pnpm check` as typecheck, build, and the executable demo.
- `/health` reports the injected sentinel health result.
