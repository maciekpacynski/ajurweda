/* Test cases for scoring.js. Run in the browser (scoring.test.html) or with Node:
 *   node pp/tests/run-node.js
 */
(function (root) {
  "use strict";
  function cases(S, TRAITS, SE, CFG) {
    var out = [];
    function check(name, ok, detail) { out.push({ name: name, ok: !!ok, detail: detail || "" }); }
    function near(a, b) { return Math.abs(a - b) < 1e-6; }

    // --- Real data counts
    var r = S.score(TRAITS, [], "M", 10);
    check("Liczności, mężczyzna: 116 / 87 / 114", r.total.V === 116 && r.total.P === 87 && r.total.K === 114, JSON.stringify(r.total));
    r = S.score(TRAITS, [], "F", 10);
    check("Liczności, kobieta: 113 / 83 / 114", r.total.V === 113 && r.total.P === 83 && r.total.K === 114, JSON.stringify(r.total));
    check("Brak zaznaczeń: brak typu", r.type === null && r.count === 0);
    var ids = new Set(TRAITS.map(function (t) { return t.id; }));
    check("Identyfikatory cech są unikalne", ids.size === TRAITS.length, ids.size + " / " + TRAITS.length);

    // --- Synthetic data: 10 traits per dosha, 2 male-only Vata traits
    var T = [];
    ["V", "P", "K"].forEach(function (d) {
      for (var i = 1; i <= 10; i++) T.push({ id: d + i, d: d, s: 1, male: d === "V" && i > 8 ? 1 : 0 });
    });
    function pick(v, p, k) {
      var a = [];
      for (var i = 1; i <= v; i++) a.push("V" + i);
      for (i = 1; i <= p; i++) a.push("P" + i);
      for (i = 1; i <= k; i++) a.push("K" + i);
      return a;
    }
    r = S.score(T, pick(6, 3, 1), "M", 10);
    check("Pokrycie 60 / 30 / 10 %", near(r.coverage.V, 60) && near(r.coverage.P, 30) && near(r.coverage.K, 10), JSON.stringify(r.coverage));
    check("Udział 60 / 30 / 10 %", near(r.share.V, 60) && near(r.share.P, 30) && near(r.share.K, 10));
    check("Typ jednodoszowy Vata", r.type === "single" && r.doshas.join() === "V");

    r = S.score(T, pick(5, 4, 1), "M", 10);
    check("Udziały 50 / 40 / 10: różnica dokładnie 10 → jednodoszowy", r.type === "single", JSON.stringify(r.share));
    r = S.score(T, pick(5, 5, 1), "M", 10);
    check("Udziały 45,5 / 45,5 / 9,1 → Vata-Pitta", r.type === "dual" && r.doshas.join() === "V,P");
    r = S.score(T, pick(4, 4, 4), "M", 10);
    check("Równe udziały → Sama", r.type === "sama");
    r = S.score(T, pick(4, 4, 3), "M", 10);
    check("Udziały 36,4 / 36,4 / 27,3 → Sama (różnica 9,1)", r.type === "sama", JSON.stringify(r.share));

    // Female: male-only Vata traits (V9, V10) leave the denominator and are not counted even if ticked.
    r = S.score(T, pick(10, 0, 0), "F", 10);
    check("Kobieta: Vata 8 z 8 = 100 %", r.total.V === 8 && r.hit.V === 8 && near(r.coverage.V, 100), JSON.stringify(r));
    r = S.score(T, pick(4, 0, 0), "F", 10);
    check("Kobieta: Vata 4 z 8 = 50 %", near(r.coverage.V, 50));

    // Single-choice group
    var G = [{ id: "a", d: "V", grp: "g" }, { id: "b", d: "P", grp: "g" }, { id: "c", d: "K", grp: "g" }, { id: "x", d: "K" }];
    var s = S.toggle(G, new Set(["a", "x"]), "b");
    check("Jednokrotny wybór: zaznaczenie b odznacza a", s.has("b") && !s.has("a") && s.has("x"));
    s = S.toggle(G, s, "b");
    check("Ponowne kliknięcie odznacza", !s.has("b"));

    // Real groups
    var grp = TRAITS.filter(function (t) { return t.grp === "strength"; });
    check("Sekcja 15 ma 3 cechy w grupie", grp.length === 3);
    var bs = S.bySection(T, pick(2, 1, 0), "M");
    check("Rozkład na sekcje", bs[1].V === 2 && bs[1].P === 1 && bs[1].K === 0);
    // Uncertainty margin: example from a printed report – V 13/113, P 9/83 → one more Pitta tick flips the order
    var M = [];
    for (var i = 1; i <= 113; i++) M.push({ id: "v" + i, d: "V" });
    for (i = 1; i <= 83; i++) M.push({ id: "p" + i, d: "P" });
    for (i = 1; i <= 114; i++) M.push({ id: "k" + i, d: "K" });
    var tick = [];
    for (i = 1; i <= 13; i++) tick.push("v" + i);
    for (i = 1; i <= 9; i++) tick.push("p" + i);
    tick.push("k1", "k2");
    r = S.score(M, tick, "", 10);
    check("Wydruk: Vata-Pitta 47,7 / 45,0", r.type === "dual" && r.order.join() === "V,P,K" && Math.abs(r.share.V - 47.7) < 0.05, JSON.stringify(r.share));
    check("Wydruk: margines = 1 cecha Pitty", S.margin(r) === 1, String(S.margin(r)));
    r = S.score(M, tick.concat(["p10"]), "", 10);
    check("Po dodaniu 1 cechy Pitty kolejność się odwraca", r.order[0] === "P");
    r = S.score(T, pick(9, 3, 1), "M", 10);
    check("Duża przewaga: margines > 2", S.margin(r) > 2, String(S.margin(r)));
    check("Brak wyniku: margines null", S.margin(S.score(T, [], "M", 10)) === null);
    // Stability: does 1–2 traits more or fewer change the result? (sama included)
    var M2 = [];
    for (i = 1; i <= 116; i++) M2.push({ id: "v" + i, d: "V" });
    for (i = 1; i <= 87; i++) M2.push({ id: "p" + i, d: "P" });
    for (i = 1; i <= 114; i++) M2.push({ id: "k" + i, d: "K" });
    r = S.score(M2, ["v1", "p1", "k1"], "", 10);
    var st = S.stability(r, 10, 2);
    check("1/1/1: Sama prakriti", r.type === "sama", r.type);
    check("1/1/1: jedna cecha więcej zmienia wynik", st && st.k === 1 && st.dir === "add" && st.to.type === "single", JSON.stringify(st));
    st = S.stability(S.score(M, tick, "", 10), 10, 2);
    check("Wydruk V-P: stabilność = 1 cecha", st && st.k === 1, JSON.stringify(st));
    var big = []; for (i = 1; i <= 60; i++) big.push("v" + i); for (i = 1; i <= 10; i++) big.push("p" + i, "k" + i);
    check("Duża przewaga: brak ostrzeżenia", S.stability(S.score(M2, big, "", 10), 10, 2) === null);
    check("Brak wyniku: stabilność null", S.stability(S.score(M2, [], "", 10), 10, 2) === null);
    // Season suggestion for Poland
    if (SE) {
      var tb = CFG && CFG.RITU_PL;
      var exp = [["2026-01-15","sisira"],["2026-02-28","sisira"],["2026-03-01","vasanta"],["2026-05-31","vasanta"],
                 ["2026-06-01","grishma"],["2026-07-15","grishma"],["2026-07-16","varsha"],["2026-08-31","varsha"],
                 ["2026-09-01","sharad"],["2026-10-16","sharad"],["2026-11-01","hemanta"],["2026-12-31","hemanta"]];
      var bad = exp.filter(function (e) { return SE.rituFor(e[0], tb) !== e[1]; });
      check("Pora roku z daty: 12 dat granicznych", bad.length === 0, JSON.stringify(bad));
      check("Pora roku: pusta data → brak podpowiedzi", SE.rituFor("", tb) === "");
    }
    return out;
  }
  root.PPTestCases = cases;
  if (typeof module !== "undefined" && module.exports) module.exports = cases;
})(typeof window !== "undefined" ? window : globalThis);
