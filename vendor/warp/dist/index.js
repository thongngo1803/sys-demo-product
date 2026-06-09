// src/core.ts
function defineWarp(config) {
  return config;
}
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

// src/checks.ts
function referentialCheck(name, opts) {
  return {
    name,
    run() {
      const toSet = new Set(opts.to());
      const errors = [];
      for (const value of opts.from()) {
        if (!toSet.has(value)) errors.push(opts.message(value));
      }
      return errors;
    }
  };
}
function requiredKeysCheck(name, opts) {
  return {
    name,
    run() {
      const have = new Set(opts.present());
      const errors = [];
      for (const key of opts.required()) {
        if (!have.has(key)) errors.push(opts.message(key));
      }
      return errors;
    }
  };
}
function hasBannedToken(ident, banned) {
  return ident.toLowerCase().split("_").some((seg) => banned.has(seg));
}
function findBannedColumns(migrationSql, banned) {
  const sql = migrationSql.replace(/--[^\n]*/g, "");
  const introduced = /* @__PURE__ */ new Set();
  for (const m of sql.matchAll(/\badd\s+column\s+(?:if\s+not\s+exists\s+)?"?([a-z_][a-z0-9_]*)"?/gi)) {
    const col = m[1];
    if (hasBannedToken(col, banned)) introduced.add(col.toLowerCase());
  }
  for (const t of sql.matchAll(/create\s+table[^(]*\(([\s\S]*?)\n\s*\)\s*;/gi)) {
    for (const rawLine of t[1].split("\n")) {
      const col = rawLine.trim().replace(/,$/, "").match(/^"?([a-z_][a-z0-9_]*)"?\s+[a-z]/i);
      if (col && hasBannedToken(col[1], banned)) introduced.add(col[1].toLowerCase());
    }
  }
  const renamedAway = /* @__PURE__ */ new Set();
  for (const m of sql.matchAll(/rename\s+column\s+"?([a-z_][a-z0-9_]*)"?\s+to\s+"?([a-z_][a-z0-9_]*)"?/gi)) {
    if (!hasBannedToken(m[2], banned)) renamedAway.add(m[1].toLowerCase());
  }
  return [...introduced].filter((c) => !renamedAway.has(c)).sort();
}
function bannedColumnsCheck(name, opts) {
  const bannedSet = new Set([...opts.banned].map((b) => b.toLowerCase()));
  return {
    name,
    run() {
      return findBannedColumns(opts.sql(), bannedSet).map(opts.message);
    }
  };
}

export { bannedColumnsCheck, defineWarp, findBannedColumns, hasBannedToken, isClean, referentialCheck, requiredKeysCheck, runWarp };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map