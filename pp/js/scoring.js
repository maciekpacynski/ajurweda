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

    // Stable order: by share descending, ties keep V, P, K order.
    var order = DOSHAS.slice().sort(function (a, b) { return share[b] - share[a]; });
    result.order = order;
    result.pradhana = order[0];
    var s0 = share[order[0]], s1 = share[order[1]], s2 = share[order[2]];
    var eps = 1e-9;
    if (s0 - s2 < th - eps) { result.type = "sama"; result.doshas = order.slice(); }
    else if (s0 - s1 < th - eps) { result.type = "dual"; result.doshas = order.slice(0, 2); }
    else { result.type = "single"; result.doshas = [order[0]]; }
    return result;
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

  var api = { score: score, bySection: bySection, toggle: toggle, isAvailable: isAvailable, DOSHAS: DOSHAS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PPScoring = api;
})(typeof window !== "undefined" ? window : globalThis);
