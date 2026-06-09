#!/usr/bin/env node
import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

// src/core.ts
async function runWarp(config) {
  const results = [];
  for (const check of config.checks) {
    const errors = await check.run();
    results.push({ name: check.name, errors });
  }
  return { results, errorCount: results.reduce((n, r) => n + r.errors.length, 0) };
}
function isClean(report) {
  return report.errorCount === 0;
}

// src/cli.ts
function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : void 0;
}
async function main() {
  const strict = process.argv.includes("--strict");
  const configPath = resolve(arg("--config") ?? "warp.config.mjs");
  if (!existsSync(configPath)) {
    console.error(`warp: no config at ${configPath}`);
    return strict ? 1 : 0;
  }
  const mod = await import(pathToFileURL(configPath).href);
  const config = mod.default ?? mod.config;
  if (!config || !Array.isArray(config.checks)) {
    console.error(`warp: config must export a default { checks: [...] }`);
    return strict ? 1 : 0;
  }
  const report = await runWarp(config);
  if (isClean(report)) {
    console.log(`warp: ok (${report.results.length} checks passed)`);
    return 0;
  }
  for (const r of report.results) {
    if (r.errors.length) {
      console.error(`
warp: ${r.name}:
  ${r.errors.join("\n  ")}`);
    }
  }
  console.error(`
warp: ${report.errorCount} problem(s) across ${report.results.length} checks`);
  return strict ? 1 : 0;
}
main().then((code) => process.exit(code));
//# sourceMappingURL=cli.js.map
//# sourceMappingURL=cli.js.map