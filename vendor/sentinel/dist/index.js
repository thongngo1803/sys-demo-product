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

// src/probes.ts
function checkConfig(name, vars) {
  const missing = vars.filter((v) => !process.env[v]);
  if (missing.length === vars.length) {
    return { name, status: "not_configured", detail: `missing: ${missing.join(", ")}` };
  }
  if (missing.length > 0) {
    return { name, status: "down", detail: `missing: ${missing.join(", ")}` };
  }
  return { name, status: "up" };
}
function configProbe(name, vars) {
  return { name, run: () => checkConfig(name, vars) };
}
function httpProbe(name, opts) {
  return {
    name,
    async run() {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 5e3);
      try {
        const res = await fetch(opts.url, { signal: controller.signal });
        return res.ok ? { name, status: "up" } : { name, status: "down", detail: `HTTP ${res.status}` };
      } catch (e) {
        return { name, status: "down", detail: e.message };
      } finally {
        clearTimeout(timer);
      }
    }
  };
}

export { checkConfig, configProbe, defineSentinel, healthAlert, httpProbe, runHealth };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map