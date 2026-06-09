type Check = {
    name: string;
    run: () => string[] | Promise<string[]>;
};
type CheckResult = {
    name: string;
    errors: string[];
};
type WarpReport = {
    results: CheckResult[];
    errorCount: number;
};
type WarpConfig = {
    checks: Check[];
};
/** Identity helper for authoring a typed warp config (`warp.config.mjs`). */
declare function defineWarp(config: WarpConfig): WarpConfig;
/** Run every check and aggregate. Checks are independent; one failing never blocks others. */
declare function runWarp(config: WarpConfig): Promise<WarpReport>;
declare function isClean(report: WarpReport): boolean;

/** Every value yielded by `from` must exist in the `to` set, else `message(value)`. */
declare function referentialCheck(name: string, opts: {
    from: () => Iterable<string>;
    to: () => Iterable<string>;
    message: (value: string) => string;
}): Check;
/** Every `required` key must be present in `present`, else `message(key)`. */
declare function requiredKeysCheck(name: string, opts: {
    required: () => Iterable<string>;
    present: () => Iterable<string>;
    message: (key: string) => string;
}): Check;
declare function hasBannedToken(ident: string, banned: ReadonlySet<string>): boolean;
/**
 * Given concatenated migration SQL, returns column names introduced with a banned
 * token AND not later renamed to a neutral name. Empty = schema is generic. Pure.
 */
declare function findBannedColumns(migrationSql: string, banned: ReadonlySet<string>): string[];
/** A ready-made check wrapping findBannedColumns over a SQL provider. */
declare function bannedColumnsCheck(name: string, opts: {
    sql: () => string;
    banned: Iterable<string>;
    message: (col: string) => string;
}): Check;

export { type Check as C, type WarpConfig as W, type CheckResult as a, type WarpReport as b, bannedColumnsCheck, defineWarp as d, findBannedColumns, hasBannedToken, isClean as i, runWarp as r, referentialCheck, requiredKeysCheck };
