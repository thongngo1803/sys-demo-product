type DepStatus = {
    name: string;
    status: 'up' | 'down' | 'not_configured';
    detail?: string;
};
type HealthReport = {
    healthy: boolean;
    dependencies: DepStatus[];
};
type Probe = {
    name: string;
    run: () => DepStatus | Promise<DepStatus>;
};
type SentinelConfig = {
    probes: Probe[];
    /** Names whose `down` makes the system unhealthy. Default: every probe is critical. */
    critical?: string[];
};
declare function defineSentinel(config: SentinelConfig): SentinelConfig;
/** Run all probes; `healthy` is false if any CRITICAL dependency is not 'up'. */
declare function runHealth(config: SentinelConfig): Promise<HealthReport>;
/**
 * Decide whether a report is alert-worthy. Alerts when unhealthy or any dependency is
 * down; `summary` names the offenders. Pure. (Ported from SYS-SENTINEL.)
 */
declare function healthAlert(report: HealthReport): {
    alert: boolean;
    summary: string;
};

export { type DepStatus, type HealthReport, type Probe, type SentinelConfig, defineSentinel, healthAlert, runHealth };
