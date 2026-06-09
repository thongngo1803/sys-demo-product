// src/core.ts
function defineSentinel(config) {
  return config;
}
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

export { defineSentinel, healthAlert, runHealth };
//# sourceMappingURL=core.js.map
//# sourceMappingURL=core.js.map