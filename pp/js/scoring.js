/* Prakriti Parikshana – scoring (pure functions, no DOM).
 *
 * Method of the classical form:  coverage(d) = ticked traits of dosha d / available traits of d.
 * Share:                          share(d)    = coverage(d) / (coverage V + P + K).
 * Type (checked in order):
 *   1. Sama        – highest and lowest share differ by less than the threshold
 *   2. Two-dosha   – first and second share differ by less than the threshold
 *   3. One-dosha   – otherwise
 */
(function (root) {
  "use strict";
  var DOSHAS = ["V", "P", "K"];

  /** Is the trait shown/scored for this sex? ("F" hides male-only traits.) */
  function isAvailable(trait, sex) {
    return !(sex === "F" && trait.male);
  }

  /**
   * @param traits  array of {id, d, male?}
   * @param checked Set or array of ticked trait ids
   * @param sex     "M" | "F" | "" (unknown counts as all traits)
   * @param threshold percentage points
   */
  function score(traits, checked, sex, threshold) {
    var ticked = checked instanceof Set ? checked : new Set(checked || []);
    var th = typeof threshold === "number" ? threshold : 10;
    var total = { V: 0, P: 0, K: 0 }, hit = { V: 0, P: 0, K: 0 };
    traits.forEach(function (t) {
      if (!isAvailable(t, sex)) return;
      total[t.d] += 1;
      if (ticked.has(t.id)) hit[t.d] += 1;
    });
    var coverage = {}, sum = 0;
    DOSHAS.forEach(function (d) {
      coverage[d] = total[d] ? (hit[d] / total[d]) * 100 : 0;
      sum += coverage[d];
    });
    var share = {};
    DOSHAS.forEach(function (d) { share[d] = sum ? (coverage[d] / sum) * 100 : 0; });

    var count = hit.V + hit.P + hit.K;
    var result = { total: total, hit: hit, coverage: coverage, share: share, count: count,
                   order: [], type: null, doshas: [], pradhana: null };
    if (!count) return result;

    var c = classify(share, th);
    result.order = c.order; result.pradhana = c.order[0]; result.type = c.type; result.doshas = c.doshas;
    return result;
  }

  /** Type from shares. Stable order: by share descending, ties keep V, P, K order. */
  function classify(share, th) {
    var order = DOSHAS.slice().sort(function (a, b) { return share[b] - share[a]; });
    var s0 = share[order[0]], s1 = share[order[1]], s2 = share[order[2]], eps = 1e-9;
    if (s0 - s2 < th - eps) return { order: order, type: "sama", doshas: order.slice() };
    if (s0 - s1 < th - eps) return { order: order, type: "dual", doshas: order.slice(0, 2) };
    return { order: order, type: "single", doshas: [order[0]] };
  }

  function typeFromCounts(hit, total, th) {
    var cov = {}, sum = 0;
    DOSHAS.forEach(function (d) { cov[d] = total[d] ? hit[d] / total[d] : 0; sum += cov[d]; });
    if (!sum) return null;
    var share = {};
    DOSHAS.forEach(function (d) { share[d] = cov[d] / sum * 100; });
    return classify(share, th);
  }

  // What the result is called: type + doshas in the name (sama: no order in the name).
  function signature(c) { return c.type + ":" + (c.type === "sama" ? "" : c.doshas.join("")); }

  /**
   * Smallest change that would give a different result (another type or another order in the name).
   * Tries adding, then unticking, 1..maxK traits of one dosha.
   * Returns {k, d, dir: "add"|"remove", to: {type, doshas}} or null if nothing changes within maxK.
   */
  function stability(r, th, maxK) {
    if (!r || !r.count) return null;
    var thr = typeof th === "number" ? th : 10, max = maxK || 2;
    var now = signature(r);
    for (var k = 1; k <= max; k++) {
      var dirs = ["add", "remove"];
      for (var i = 0; i < dirs.length; i++) {
        for (var j = 0; j < DOSHAS.length; j++) {
          var d = DOSHAS[j], h = { V: r.hit.V, P: r.hit.P, K: r.hit.K };
          h[d] += dirs[i] === "add" ? k : -k;
          if (h[d] < 0 || h[d] > r.total[d]) continue;
          var c = typeFromCounts(h, r.total, thr);
          if (c && signature(c) !== now) return { k: k, d: d, dir: dirs[i], to: { type: c.type, doshas: c.doshas } };
        }
      }
    }
    return null;
  }

  /**
   * How many extra ticks of the second dosha would make it overtake the first
   * (coverage strictly higher). Returns null when there is no result.
   * Small numbers (1–2) mean the order of the two doshas is uncertain.
   */
  function margin(r) {
    if (!r || !r.count || r.order.length < 2) return null;
    var a = r.order[0], b = r.order[1];
    if (!r.total[a] || !r.total[b]) return null;
    var need = Math.floor((r.hit[a] / r.total[a]) * r.total[b] - r.hit[b] + 1e-9) + 1;
    return Math.max(1, Math.min(need, r.total[b] - r.hit[b] + 1));
  }

  /** Per-section counts of ticked traits: {sectionNo: {V,P,K}} */
  function bySection(traits, checked, sex) {
    var ticked = checked instanceof Set ? checked : new Set(checked || []);
    var out = {};
    traits.forEach(function (t) {
      if (!isAvailable(t, sex) || !ticked.has(t.id)) return;
      out[t.s] = out[t.s] || { V: 0, P: 0, K: 0 };
      out[t.s][t.d] += 1;
    });
    return out;
  }

  /** Ticking a trait in a single-choice group unticks the rest of that group. Returns new Set. */
  function toggle(traits, checked, id) {
    var next = new Set(checked);
    if (next.has(id)) { next.delete(id); return next; }
    var trait = traits.find(function (t) { return t.id === id; });
    if (trait && trait.grp) {
      traits.forEach(function (t) { if (t.grp === trait.grp) next.delete(t.id); });
    }
    next.add(id);
    return next;
  }

  var api = { score: score, margin: margin, stability: stability, classify: classify, bySection: bySection, toggle: toggle, isAvailable: isAvailable, DOSHAS: DOSHAS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PPScoring = api;
})(typeof window !== "undefined" ? window : globalThis);
