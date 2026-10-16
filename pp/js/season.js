/* Prakriti Parikshana – suggested season (ṛtu) from the date, for the climate of Poland.
 *
 * The classical texts describe the six seasons of India. This mapping is our own approximation:
 * each ṛtu is matched to the Polish period whose weather best fits its description in
 * Aṣṭāṅga Hṛdaya Sūtrasthāna 3 (cold and dry, thaw, heat, rains, sunny autumn, first cold).
 * The boundaries live in PP_CONFIG.RITU_PL so they can be moved without touching the code.
 */
(function (root) {
  "use strict";

  // Fallback if config.js is older than this file.
  var DEFAULT = [
    { ritu: "sisira",  from: "01-01" },  // coldest, frosty, dry – winter proper
    { ritu: "vasanta", from: "03-01" },  // thaw and spring – Kapha "melts"
    { ritu: "grishma", from: "06-01" },  // longest days, heat
    { ritu: "varsha",  from: "07-16" },  // peak of rain and thunderstorms
    { ritu: "sharad",  from: "09-01" },  // warm, sunny early autumn
    { ritu: "hemanta", from: "11-01" }   // first cold, pre-winter
  ];

  /** @param iso "YYYY-MM-DD" → ritu key or "" */
  function rituFor(iso, table) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return "";
    var md = m[2] + "-" + m[3];
    var t = (table && table.length ? table : DEFAULT).slice().sort(function (a, b) { return a.from < b.from ? -1 : 1; });
    var hit = t[t.length - 1].ritu;            // before the first boundary = last season of the previous year
    t.forEach(function (row) { if (md >= row.from) hit = row.ritu; });
    return hit;
  }

  var api = { rituFor: rituFor, DEFAULT: DEFAULT };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PPSeason = api;
})(typeof window !== "undefined" ? window : globalThis);
