/* Prakriti Parikshana – saving in the browser and file import/export */
(function (root) {
  "use strict";
  var C = root.PP_CONFIG;

  function emptyState() {
    return {
      app: "prakriti-parikshana", version: C.VERSION,
      patient: { code: "", date: new Date().toISOString().slice(0, 10), age: "", ageGroup: "", sex: "", ritu: "", examiner: "" },
      checked: [], notes: {}, generalNote: "", section: 1, screen: "start", lastScreen: "", started: false
    };
  }

  function load() {
    try {
      var raw = root.localStorage.getItem(C.STORAGE_KEY);
      if (!raw) return emptyState();
      return normalize(JSON.parse(raw));
    } catch (e) { return emptyState(); }
  }

  function save(state) {
    try { root.localStorage.setItem(C.STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage blocked: keep working in memory */ }
  }

  function clear() {
    try { root.localStorage.removeItem(C.STORAGE_KEY); } catch (e) {}
  }

  function getLang() {
    try { return root.localStorage.getItem(C.LANG_KEY) || ""; } catch (e) { return ""; }
  }
  function setLang(l) {
    try { root.localStorage.setItem(C.LANG_KEY, l); } catch (e) {}
  }

  /** Accept a parsed object; return a clean state or throw. */
  function normalize(obj) {
    if (!obj || obj.app !== "prakriti-parikshana" || !Array.isArray(obj.checked)) throw new Error("bad file");
    var s = emptyState();
    Object.keys(s.patient).forEach(function (k) {
      if (obj.patient && typeof obj.patient[k] === "string") s.patient[k] = obj.patient[k];
    });
    s.checked = obj.checked.filter(function (x) { return typeof x === "string"; });
    s.notes = obj.notes && typeof obj.notes === "object" ? obj.notes : {};
    s.generalNote = typeof obj.generalNote === "string" ? obj.generalNote : "";
    s.section = Number(obj.section) >= 1 && Number(obj.section) <= 27 ? Number(obj.section) : 1;
    s.screen = ["start", "patient", "guide", "survey", "result"].indexOf(obj.screen) >= 0 ? obj.screen : "start";
    s.lastScreen = ["patient", "guide", "survey", "result"].indexOf(obj.lastScreen) >= 0 ? obj.lastScreen : "";
    s.started = !!obj.started;
    return s;
  }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime + ";charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function csvCell(v) {
    v = v == null ? "" : String(v);
    return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function toCsv(state, r) {
    var p = state.patient;
    var head = ["code", "date", "age", "age_group", "sex", "ritu", "examiner",
      "V_ticked", "V_total", "V_coverage_pct", "P_ticked", "P_total", "P_coverage_pct",
      "K_ticked", "K_total", "K_coverage_pct", "V_share_pct", "P_share_pct", "K_share_pct",
      "type", "doshas", "pradhana", "ticked_ids"];
    var f = function (x) { return x.toFixed(1); };
    var row = [p.code, p.date, p.age, p.ageGroup, p.sex, p.ritu, p.examiner,
      r.hit.V, r.total.V, f(r.coverage.V), r.hit.P, r.total.P, f(r.coverage.P),
      r.hit.K, r.total.K, f(r.coverage.K), f(r.share.V), f(r.share.P), f(r.share.K),
      r.type || "", r.doshas.join("-"), r.pradhana || "", state.checked.join(" ")];
    return "﻿" + head.join(",") + "\n" + row.map(csvCell).join(",") + "\n";
  }

  root.PPStorage = { emptyState: emptyState, load: load, save: save, clear: clear, normalize: normalize,
                     download: download, toCsv: toCsv, getLang: getLang, setLang: setLang };
})(window);
