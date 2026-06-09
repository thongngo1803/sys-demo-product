'use strict';

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

exports.checkConfig = checkConfig;
exports.configProbe = configProbe;
exports.httpProbe = httpProbe;
//# sourceMappingURL=probes.cjs.map
//# sourceMappingURL=probes.cjs.map