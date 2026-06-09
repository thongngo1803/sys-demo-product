#!/usr/bin/env node
import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

// src/core.ts
async function runHealth(config) {
  const dependencies = [];
  for (const probe of config.probes) {
    dependencies.push(await probe.run());
  }
  const critical = new Set(config.critical ?? dependencies.map((d) => d.name));
  const healthy = dependencies.every((d) => !critical.has(d.name) || d.status === "up");
  return { healthy, dependencies };
}
function healthAlert(report) {
  const down = report.dependencies.filter((d) => d.status === "down");
  const alert = !report.healthy || down.length > 0;
  const summary = down.length ? down.map((d) => `${d.name}: ${d.detail ?? "down"}`).join("; ") : report.healthy ? "healthy" : "unhealthy (critical dependency down)";
  return { alert, summary };
}

// src/cli.ts
function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : void 0;
}
async function main() {
  const strict = process.argv.includes("--strict");
  const configPath = resolve(arg("--config") ?? "sentinel.config.mjs");
  if (!existsSync(configPath)) {
    console.error(`sentinel: no config at ${configPath}`);
    return strict ? 1 : 0;
  }
  const mod = await import(pathToFileURL(configPath).href);
  const config = mod.default ?? mod.config;
  if (!config || !Array.isArray(config.probes)) {
    console.error("sentinel: config must export a default { probes: [...] }");
    return strict ? 1 : 0;
  }
  const report = await runHealth(config);
  const { alert, summary } = healthAlert(report);
  for (const d of report.dependencies) {
    console.log(`  ${d.status === "up" ? "\u2713" : d.status === "not_configured" ? "\u2013" : "\u2717"} ${d.name}${d.detail ? ` (${d.detail})` : ""}`);
  }
  console.log(`sentinel: ${report.healthy ? "healthy" : "UNHEALTHY"} \u2014 ${summary}`);
  return strict && alert ? 1 : 0;
}
main().then((code) => process.exit(code));
//# sourceMappingURL=cli.js.map
//# sourceMappingURL=cli.js.map