/* Prakriti Parikshana – screens, navigation, report */
(function () {
  "use strict";
  var TRAITS = window.PP_TRAITS, SECTIONS = window.PP_SECTIONS, I18N = window.PP_I18N;
  var CFG = window.PP_CONFIG, S = window.PPScoring, ST = window.PPStorage;
  var DOSHAS = ["V", "P", "K"];

  var state = ST.load();
  var checked = new Set(state.checked);
  var lang = ST.getLang() || ((navigator.language || "pl").slice(0, 2) === "pl" ? "pl" : "en");
  var app = document.getElementById("app");

  /* ---------- helpers ---------- */
  function t(key) { return I18N[lang][key]; }
  function fmt(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k] != null ? o[k] : ""; }); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function dn(d) { return t("doshaNames")[d]; }
  function secName(sec) { return lang === "pl" ? sec.pl : sec.en; }
  function traitText(tr) { return lang === "pl" ? tr.pl : tr.en; }
  function visibleTraits(n) {
    return TRAITS.filter(function (x) { return x.s === n && S.isAvailable(x, state.patient.sex); });
  }
  function persist() { state.checked = Array.from(checked); ST.save(state); }
  function go(screen) {
    state.screen = screen;
    if (screen !== "start") state.lastScreen = screen;
    persist(); render();
    window.scrollTo(0, 0);
    var h = app.querySelector("h1, h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }
  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }
  function result() { return S.score(TRAITS, checked, state.patient.sex, CFG.MIXED_THRESHOLD); }
  function pct(x) { return (Math.round(x * 10) / 10).toLocaleString(lang === "pl" ? "pl-PL" : "en-GB", { minimumFractionDigits: 1 }) + "%"; }

  /* ---------- header ---------- */
  function renderHeader() {
    document.documentElement.lang = lang;
    document.title = t("appTitle");
    document.getElementById("hdr-title").textContent = t("appTitle");
    document.getElementById("hdr-sub").textContent = t("appSubtitle");
    var b = document.getElementById("lang");
    b.textContent = t("langSwitch");
    b.setAttribute("lang", lang === "pl" ? "en" : "pl");
    document.getElementById("footer-text").textContent = t("footer");
  }

  /* ---------- screens ---------- */
  function renderStart() {
    var hasData = state.started;
    app.innerHTML =
      '<section class="screen start">' +
        '<h2 class="start-title">' + esc(t("appTitle")) + '</h2>' +
        '<p class="lead">' + esc(t("startLead")) + '</p>' +
        '<p>' + esc(t("startHow")) + '</p>' +
        '<div class="tri" aria-hidden="true"><span class="v">Vata</span><span class="p">Pitta</span><span class="k">Kapha</span></div>' +
        '<p class="disclaimer">' + esc(t("disclaimer")) + '</p>' +
        '<div class="actions">' +
          (hasData ? '<button class="btn primary" data-act="continue">' + esc(t("btnContinue")) + '</button>' : '') +
          '<button class="btn ' + (hasData ? '' : 'primary') + '" data-act="new">' + esc(t("btnNew")) + '</button>' +
          '<label class="btn ghost file">' + esc(t("btnLoad")) + '<input type="file" accept="application/json,.json" data-act="load" hidden></label>' +
        '</div>' +
      '</section>';
  }

  function field(id, label, control, help) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' + control +
      (help ? '<p class="help" id="' + id + '-help">' + esc(help) + '</p>' : '') + '</div>';
  }
  function select(id, obj, value, required) {
    var o = '<option value="">' + esc(t("choose")) + '</option>';
    Object.keys(obj).forEach(function (k) {
      o += '<option value="' + k + '"' + (value === k ? " selected" : "") + '>' + esc(obj[k]) + '</option>';
    });
    return '<select id="' + id + '" data-p="' + id.slice(2) + '"' + (required ? " required" : "") + '>' + o + '</select>';
  }

  function renderPatient() {
    var p = state.patient;
    app.innerHTML =
      '<section class="screen narrow">' +
        '<h2>' + esc(t("patientTitle")) + '</h2>' +
        '<form id="patient-form" novalidate>' +
          field("p-code", t("fCode"), '<input id="p-code" data-p="code" value="' + esc(p.code) + '" autocomplete="off" aria-describedby="p-code-help">', t("fCodeHelp")) +
          '<div class="row">' +
            field("p-date", t("fDate"), '<input id="p-date" type="date" data-p="date" value="' + esc(p.date) + '">') +
            field("p-age", t("fAge"), '<input id="p-age" type="number" min="0" max="120" inputmode="numeric" data-p="age" value="' + esc(p.age) + '">') +
          '</div>' +
          field("p-ageGroup", t("fAgeGroup"), select("p-ageGroup", t("ageGroups"), p.ageGroup)) +
          field("p-sex", t("fSex"), select("p-sex", t("sexes"), p.sex, true).replace("<select", '<select aria-describedby="p-sex-help"'), t("sexHelp")) +
          field("p-ritu", t("fRitu"), select("p-ritu", t("ritus"), p.ritu)) +
          field("p-examiner", t("fExaminer"), '<input id="p-examiner" data-p="examiner" value="' + esc(p.examiner) + '" autocomplete="name">') +
          '<div class="actions">' +
            '<button type="button" class="btn ghost" data-act="to-start">' + esc(t("btnBack")) + '</button>' +
            '<button type="submit" class="btn primary">' + esc(t("btnNext")) + '</button>' +
          '</div>' +
        '</form>' +
      '</section>';
  }

  function renderGuide() {
    app.innerHTML =
      '<section class="screen narrow">' +
        '<h2>' + esc(t("guideTitle")) + '</h2>' +
        '<ol class="guide">' + t("guide").map(function (g) { return '<li>' + esc(g) + '</li>'; }).join("") + '</ol>' +
        '<p class="disclaimer">' + esc(t("disclaimer")) + '</p>' +
        '<div class="actions">' +
          '<button class="btn ghost" data-act="to-patient">' + esc(t("btnBack")) + '</button>' +
          '<button class="btn primary" data-act="to-survey">' + esc(t("btnStart")) + '</button>' +
        '</div>' +
      '</section>';
  }

  function sectionCounts(n) {
    var c = { V: 0, P: 0, K: 0 };
    visibleTraits(n).forEach(function (x) { if (checked.has(x.id)) c[x.d]++; });
    return c;
  }

  function navList(cur) {
    return SECTIONS.map(function (sec) {
      var c = sectionCounts(sec.n);
      var any = c.V + c.P + c.K;
      return '<li><button class="nav-item' + (sec.n === cur ? ' current' : '') + (any ? ' done' : '') + '" data-sec="' + sec.n + '"' +
        (sec.n === cur ? ' aria-current="step"' : '') + '>' +
        '<span class="nav-n">' + sec.n + '</span><span class="nav-name">' + esc(secName(sec)) + '</span>' +
        '<span class="nav-dots" aria-label="' + esc(t("ticked")) + ': V ' + c.V + ', P ' + c.P + ', K ' + c.K + '">' +
          DOSHAS.map(function (d) { return '<i class="dot ' + d.toLowerCase() + (c[d] ? ' on' : '') + '">' + (c[d] || "") + '</i>'; }).join("") +
        '</span></button></li>';
    }).join("");
  }

  function traitHtml(x) {
    var on = checked.has(x.id);
    var meta = '<span class="sa" lang="sa">' + esc(x.sa) + '</span><span class="src">' + esc(x.src.join(" · ")) + '</span>';
    return '<li class="trait' + (on ? ' on' : '') + '">' +
      '<label><input type="checkbox" data-trait="' + x.id + '"' + (on ? ' checked' : '') + '>' +
      '<span class="tx"><span class="name">' + esc(traitText(x)) +
        (x.sens ? ' <abbr class="sens" title="' + esc(t("classicalTitle")) + '">' + esc(t("classical")) + '</abbr>' : '') +
      '</span><span class="meta">' + meta + '</span>' +
      (x.note ? '<span class="fnote">' + esc(t("formNote")) + ': ' + esc(x.note.replace(/^.*form:\s*/, "")) + '</span>' : '') +
      '</span></label></li>';
  }

  function renderSurvey() {
    var n = state.section, sec = SECTIONS[n - 1];
    var items = visibleTraits(n);
    var cols = DOSHAS.map(function (d) {
      var list = items.filter(function (x) { return x.d === d; });
      return '<div class="col ' + d.toLowerCase() + '">' +
        '<h3 class="col-h"><span>' + dn(d) + '</span><small>' + list.filter(function (x) { return checked.has(x.id); }).length + ' / ' + list.length + '</small></h3>' +
        (list.length ? '<ul>' + list.map(traitHtml).join("") + '</ul>' : '<p class="empty">—</p>') +
        '</div>';
    }).join("");
    var hint = lang === "pl" ? sec.hint_pl : sec.hint_en;
    app.innerHTML =
      '<div class="survey">' +
        '<nav class="side" aria-label="' + esc(t("sections")) + '">' +
          '<label class="mobile-nav"><span class="sr">' + esc(t("sections")) + '</span><select data-act="jump">' +
            SECTIONS.map(function (s) { return '<option value="' + s.n + '"' + (s.n === n ? ' selected' : '') + '>' + s.n + '. ' + esc(secName(s)) + '</option>'; }).join("") +
          '</select></label>' +
          '<ol class="nav">' + navList(n) + '</ol>' +
          '<button class="btn primary block" data-act="to-result">' + esc(t("btnResult")) + '</button>' +
        '</nav>' +
        '<section class="sec">' +
          '<header class="sec-h">' +
            '<p class="sec-progress">' + esc(fmt(t("progress"), { n: n, total: SECTIONS.length })) + '</p>' +
            '<h2><span class="sec-n">' + n + '</span> ' + esc(secName(sec)) + ' <span class="sa" lang="sa">' + esc(sec.sa) + '</span></h2>' +
            (sec.grp ? '<p class="pick-one">' + esc(t("pickOne")) + '</p>' : '') +
            (hint ? '<details class="hint"' + (n === 1 ? ' open' : '') + '><summary>' + esc(t("hintLabel")) + '</summary><p>' + esc(hint) + '</p></details>' : '') +
          '</header>' +
          '<div class="cols">' + cols + '</div>' +
          '<div class="field note"><label for="sec-note">' + esc(t("noteLabel")) + '</label>' +
            '<textarea id="sec-note" rows="2" data-act="note">' + esc(state.notes[n] || "") + '</textarea></div>' +
          '<div class="actions spread">' +
            (n > 1 ? '<button class="btn ghost" data-act="prev">' + esc(t("btnPrev")) + '</button>' : '<button class="btn ghost" data-act="to-guide">' + esc(t("btnBack")) + '</button>') +
            (n < SECTIONS.length ? '<button class="btn primary" data-act="next">' + esc(t("btnNextSec")) + '</button>' : '<button class="btn primary" data-act="to-result">' + esc(t("btnResult")) + '</button>') +
          '</div>' +
        '</section>' +
      '</div>';
  }

  function typeLabel(r) {
    var a = r.doshas[0] ? dn(r.doshas[0]) : "", b = r.doshas[1] ? dn(r.doshas[1]) : "";
    return { title: fmt(t("types")[r.type], { a: a, b: b }),
             desc: fmt(t("typeDesc")[r.type], { a: a, b: b, th: CFG.MIXED_THRESHOLD }) };
  }

  function metaLine() {
    var p = state.patient, rows = [];
    function add(k, v) { if (v) rows.push('<div><dt>' + esc(t(k)) + '</dt><dd>' + esc(v) + '</dd></div>'); }
    add("metaCode", p.code); add("metaDate", p.date);
    add("metaAge", [p.age, p.ageGroup ? t("ageGroups")[p.ageGroup] : ""].filter(Boolean).join(", "));
    add("metaSex", p.sex ? t("sexes")[p.sex] : ""); add("metaRitu", p.ritu ? t("ritus")[p.ritu] : "");
    add("metaExaminer", p.examiner);
    return rows.length ? '<dl class="meta-list">' + rows.join("") + '</dl>' : "";
  }

  /* ---------- recommendations ---------- */
  var FX_ICON = { ok: "✓", warn: "!", bad: "✗" };

  // List for dosha d; when `other` is given, each item shows how it affects that dosha.
  function recItems(d, other) {
    var R = window.PP_RECS.single[d];
    return '<div class="rec ' + d.toLowerCase() + '">' +
      '<h4>' + esc(fmt(t("recFor"), { d: t("doshaAcc")[d] })) + '</h4>' +
      '<p class="rec-intro">' + esc(lang === "pl" ? R.intro_pl : R.intro_en) + '</p>' +
      '<ul>' + R.items.map(function (it) {
        var fx = other && it.fx && it.fx[other];
        var label = fx ? fmt(t("fx_" + fx), { gen: t("doshaGen")[other], loc: t("doshaLoc")[other], acc: t("doshaAcc")[other] }) : "";
        var mark = fx ? '<span class="fx fx-' + fx + '"><span aria-hidden="true">' + FX_ICON[fx] + '</span> ' + esc(label) + '</span>' : "";
        return '<li><span class="rec-t">' + esc(lang === "pl" ? it.pl : it.en) + mark + '</span><span class="src">' + esc(it.src) + '</span></li>';
      }).join("") + '</ul></div>';
  }

  function recommendations(r) {
    var REC = window.PP_RECS; if (!REC) return "";
    var html = "", first = r.order[0], second = r.order[1];
    if (r.type === "sama") {
      html += '<div class="rec sama"><p>' + esc(lang === "pl" ? REC.sama[0] : REC.sama[1]) +
        ' <span class="src">' + esc(REC.sama[2]) + '</span></p></div>';
    } else if (r.type === "dual") {
      var pair = r.doshas.slice().sort(function (x, y) { return "VPK".indexOf(x) - "VPK".indexOf(y); }).join("");
      var D = REC.dual[pair];
      html += '<div class="rec dual"><h4>' + esc(fmt(t("recDual"), { a: dn(first), b: dn(second) })) + '</h4>' +
        '<dl><dt>' + esc(t("recCommon")) + '</dt><dd>' + esc(lang === "pl" ? D[0] : D[2]) + '</dd>' +
        '<dt>' + esc(t("recCaution")) + '</dt><dd>' + esc(lang === "pl" ? D[1] : D[3]) + '</dd></dl>' +
        '<p class="src">' + esc(t("recDerived")) + ' (' + esc(REC.dual_src) + ')</p></div>';
      html += recItems(first, second) + recItems(second, first);
    } else {
      html += recItems(first, second);
    }
    if (r.type !== "sama") {
      html += '<p class="fx-legend">' + esc(fmt(t("fxLegend"), { src: REC.fx_src })) + '</p>';
    }
    var ritu = state.patient.ritu, agg = REC.season.aggravates[ritu];
    if (r.type !== "sama" && ritu && agg && r.doshas.indexOf(agg) >= 0) {
      html += '<p class="rec-season">' + esc(fmt(t("recSeason"), { ritu: t("ritus")[ritu], d: t("doshaGen")[agg] })) +
        ' <span class="src">' + esc(REC.season._src) + '</span></p>';
    }
    return '<section aria-labelledby="h-rec" class="recs"><h3 id="h-rec">' + esc(t("recTitle")) + '</h3>' + html +
      '<p class="disclaimer">' + esc(t("recDisclaimer")) + '</p></section>';
  }

  // Warn when one or two extra ticks would swap the two leading doshas.
  function uncertainty(r) {
    var m = S.margin(r);
    if (m === null || m > CFG.UNCERTAIN_TRAITS || r.type === "sama") return "";
    return '<p class="uncertain" role="note">' + esc(fmt(t(m === 1 ? "uncertain1" : "uncertainN"),
      { n: m, d: t("doshaGen")[r.order[1]], a: dn(r.order[0]), ains: t("doshaIns")[r.order[0]], b: dn(r.order[1]) })) + '</p>';
  }

  function renderResult() {
    var r = result();
    var actions =
      '<div class="actions no-print">' +
        '<button class="btn ghost" data-act="to-survey">' + esc(t("btnEdit")) + '</button>' +
        '<button class="btn" data-act="print">' + esc(t("btnPrint")) + '</button>' +
        '<button class="btn" data-act="save">' + esc(t("btnSave")) + '</button>' +
        '<button class="btn" data-act="csv">' + esc(t("btnCsv")) + '</button>' +
        '<button class="btn danger" data-act="clear">' + esc(t("btnClear")) + '</button>' +
      '</div>';
    if (!r.count) {
      app.innerHTML = '<section class="screen narrow"><h2>' + esc(t("resultTitle")) + '</h2><p>' + esc(t("noTicks")) + '</p>' + actions + '</section>';
      return;
    }
    var tl = typeLabel(r);
    var bar = DOSHAS.map(function (d) {
      return '<div class="seg ' + d.toLowerCase() + '" style="flex-basis:' + r.share[d].toFixed(2) + '%">' +
        '<span class="seg-l">' + dn(d) + '</span><span class="seg-v">' + pct(r.share[d]) + '</span></div>';
    }).join("");
    var table = '<table class="sum"><thead><tr><th scope="col">' + esc(t("colDosha")) + '</th><th scope="col">' + esc(t("colTotal")) +
      '</th><th scope="col">' + esc(t("colHit")) + '</th><th scope="col">' + esc(t("colCov")) + '</th><th scope="col">' + esc(t("colShare")) + '</th></tr></thead><tbody>' +
      DOSHAS.map(function (d) {
        return '<tr class="' + d.toLowerCase() + '"><th scope="row"><i class="sw"></i>' + dn(d) + '</th><td>' + r.total[d] + '</td><td>' + r.hit[d] +
          '</td><td>' + pct(r.coverage[d]) + '</td><td>' + pct(r.share[d]) + '</td></tr>';
      }).join("") + '</tbody></table>';
    var bs = S.bySection(TRAITS, checked, state.patient.sex);
    var secRows = SECTIONS.filter(function (s) { return bs[s.n]; }).map(function (s) {
      var c = bs[s.n];
      return '<tr><th scope="row">' + s.n + '. ' + esc(secName(s)) + '</th>' + DOSHAS.map(function (d) { return '<td class="' + d.toLowerCase() + (c[d] ? '' : ' zero') + '">' + c[d] + '</td>'; }).join("") + '</tr>';
    }).join("");
    var checkedList = DOSHAS.map(function (d) {
      var list = TRAITS.filter(function (x) { return x.d === d && checked.has(x.id) && S.isAvailable(x, state.patient.sex); });
      if (!list.length) return "";
      return '<div class="cl ' + d.toLowerCase() + '"><h4>' + dn(d) + ' (' + list.length + ')</h4><ul>' +
        list.map(function (x) { return '<li>' + esc(traitText(x)) + ' <span class="sa" lang="sa">' + esc(x.sa) + '</span> <span class="src">' + esc(x.src.join(" · ")) + '</span></li>'; }).join("") +
        '</ul></div>';
    }).join("");
    var secNotes = Object.keys(state.notes).filter(function (k) { return state.notes[k] && state.notes[k].trim(); })
      .map(function (k) { return '<li><strong>' + k + '. ' + esc(secName(SECTIONS[k - 1])) + ':</strong> ' + esc(state.notes[k]) + '</li>'; }).join("");

    app.innerHTML =
      '<article class="report">' +
        '<header class="rep-h">' +
          '<p class="rep-kicker">' + esc(t("resultTitle")) + '</p>' +
          '<h2 class="rep-type">' + esc(tl.title) + '</h2>' +
          '<p class="rep-desc">' + esc(tl.desc) + ' ' + esc(t("pradhana")) + ': <strong>' + dn(r.pradhana) + '</strong>.</p>' +
          metaLine() +
          uncertainty(r) +
        '</header>' +
        '<section aria-labelledby="h-share"><h3 id="h-share">' + esc(t("shareTitle")) + '</h3><div class="bar">' + bar + '</div></section>' +
        '<section aria-labelledby="h-table"><h3 id="h-table">' + esc(t("tableTitle")) + '</h3>' + table + '<p class="small">' + esc(t("methodNote")) + '</p></section>' +
        recommendations(r) +
        '<section aria-labelledby="h-sec"><h3 id="h-sec">' + esc(t("bySectionTitle")) + '</h3><table class="bysec"><thead><tr><th></th>' +
          DOSHAS.map(function (d) { return '<th scope="col" class="' + d.toLowerCase() + '">' + dn(d) + '</th>'; }).join("") + '</tr></thead><tbody>' + secRows + '</tbody></table></section>' +
        '<section aria-labelledby="h-checked" class="page-break"><h3 id="h-checked">' + esc(t("checkedTitle")) + '</h3><div class="cls">' + checkedList + '</div></section>' +
        '<section aria-labelledby="h-notes"><h3 id="h-notes">' + esc(t("notesTitle")) + '</h3>' +
          (secNotes ? '<ul class="notes">' + secNotes + '</ul>' : '') +
          '<div class="field"><label for="gen-note">' + esc(t("generalNote")) + '</label>' +
          '<textarea id="gen-note" rows="3" data-act="gnote" aria-describedby="gen-note-help">' + esc(state.generalNote) + '</textarea>' +
          '<p class="help" id="gen-note-help">' + esc(t("generalNoteHelp")) + '</p>' +
          '<p class="print-only">' + esc(state.generalNote) + '</p></div>' +
        '</section>' +
        '<footer class="rep-f"><p class="disclaimer">' + esc(t("disclaimer")) + '</p><p class="small"><strong>' + esc(t("sourcesTitle")) + ':</strong> ' + esc(t("sourcesText")) + '</p></footer>' +
        actions +
      '</article>';
  }

  function render() {
    renderHeader();
    ({ start: renderStart, patient: renderPatient, guide: renderGuide, survey: renderSurvey, result: renderResult }[state.screen] || renderStart)();
  }

  /* ---------- events ---------- */
  // Confirm only when the file was really written. For an ordinary download the browser
  // shows its own save dialog / download bar, so the page stays silent.
  function saveToast(outcome) { if (outcome === "saved") toast(t("saved")); }

  function fileName(ext) {
    var code = (state.patient.code || "badanie").replace(/[^\w\-]+/g, "_");
    return "prakriti_" + code + "_" + (state.patient.date || "") + "." + ext;
  }

  app.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act], [data-sec]");
    if (!b) return;
    if (b.dataset.sec) { state.section = Number(b.dataset.sec); go("survey"); return; }
    switch (b.dataset.act) {
      case "new":
        if (state.started && !confirm(t("confirmNew"))) return;
        state = ST.emptyState(); checked = new Set(); state.started = true; go("patient"); break;
      case "continue": go(state.lastScreen || "survey"); break;
      case "to-start": go("start"); break;
      case "to-patient": go("patient"); break;
      case "to-guide": go("guide"); break;
      case "to-survey": go("survey"); break;
      case "to-result": go("result"); break;
      case "prev": state.section = Math.max(1, state.section - 1); go("survey"); break;
      case "next": state.section = Math.min(SECTIONS.length, state.section + 1); go("survey"); break;
      case "print": window.print(); break;
      case "save":
        ST.download(fileName("json"), JSON.stringify(Object.assign({}, state, { checked: Array.from(checked) }), null, 1), "application/json").then(saveToast); break;
      case "csv":
        ST.download(fileName("csv"), ST.toCsv(Object.assign({}, state, { checked: Array.from(checked) }), result()), "text/csv").then(saveToast); break;
      case "clear":
        if (!confirm(t("confirmClear"))) return;
        ST.clear(); state = ST.emptyState(); checked = new Set(); go("start"); break;
    }
  });

  app.addEventListener("change", function (e) {
    var el = e.target;
    if (el.dataset.trait) {
      checked = S.toggle(TRAITS, checked, el.dataset.trait);
      persist();
      var y = window.scrollY; render(); window.scrollTo(0, y);
      var again = app.querySelector('[data-trait="' + el.dataset.trait + '"]'); if (again) again.focus();
      return;
    }
    if (el.dataset.act === "jump") { state.section = Number(el.value); go("survey"); return; }
    if (el.dataset.act === "load") {
      var f = el.files && el.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try { state = ST.normalize(JSON.parse(rd.result)); state.started = true; checked = new Set(state.checked); go("result"); toast(t("loaded")); }
        catch (err) { toast(t("loadError")); }
      };
      rd.readAsText(f);
      return;
    }
    if (el.dataset.p) { state.patient[el.dataset.p] = el.value; persist(); }
  });

  app.addEventListener("input", function (e) {
    var el = e.target;
    if (el.dataset.p) { state.patient[el.dataset.p] = el.value; persist(); }
    if (el.dataset.act === "note") { state.notes[state.section] = el.value; persist(); }
    if (el.dataset.act === "gnote") { state.generalNote = el.value; persist(); }
  });

  app.addEventListener("submit", function (e) {
    e.preventDefault();
    var sex = document.getElementById("p-sex");
    if (!sex.value) { sex.focus(); sex.setAttribute("aria-invalid", "true"); return; }
    go("guide");
  });

  document.getElementById("lang").addEventListener("click", function () {
    lang = lang === "pl" ? "en" : "pl"; ST.setLang(lang); render();
  });

  render();
})();
