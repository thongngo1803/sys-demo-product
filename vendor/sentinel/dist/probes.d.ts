import { DepStatus, Probe } from './core.js';

/**
 * Config-presence check for a dependency we don't actively ping every call (avoids
 * hammering rate-limited APIs). all missing → not_configured; some missing → down;
 * all present → up. Pure-ish (reads process.env). Ported from SYS-SENTINEL.
 */
declare function checkConfig(name: string, vars: string[]): DepStatus;
/** A probe that config-checks required env vars. */
declare function configProbe(name: string, vars: string[]): Probe;
/** A generic HTTP liveness probe (uses global fetch). */
declare function httpProbe(name: string, opts: {
    url: string;
    timeoutMs?: number;
}): Probe;

export { checkConfig, configProbe, httpProbe };
