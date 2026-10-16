// Run: node pp/tests/run-node.js
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const ctx = { window: {}, console };
ctx.globalThis = ctx.window;
vm.createContext(ctx);
for (const f of ["../config.js", "../data/cechy.js", "../js/scoring.js", "../js/season.js", "scoring.tests.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, f), "utf8"), ctx, { filename: f });
}
const w = ctx.window;
const res = w.PPTestCases(w.PPScoring, w.PP_TRAITS, w.PPSeason, w.PP_CONFIG);
let fail = 0;
for (const r of res) {
  console.log((r.ok ? "OK   " : "FAIL ") + r.name + (r.ok ? "" : "  " + r.detail));
  if (!r.ok) fail++;
}
console.log(`\n${res.length - fail} / ${res.length} passed`);
process.exit(fail ? 1 : 0);
