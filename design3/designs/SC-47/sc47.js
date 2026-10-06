// SC-47's mockups: quick-commerce gates per SKU, with a per-batch override, on Munchly Foods' Supply chain tab, in three
// options. The page draws the console's own shell and client header (shell.js, captured from design3) and the option's
// content. Munchly's SKUs and batches are design3's; the per-SKU values and the override are illustrative.
// ?theme= light | dark, ?state= sheet | edit shows a state on the board.
(function () {
  var Q = new URLSearchParams(location.search), OPT = window.SC47.option, STATE = Q.get("state") || "";
  var phone = innerWidth < 768;
  var DEF = { bl: 90, qc: 60 };
  var DIST = { rakesh: "Rakesh Traders, Nagpur", patil: "Patil Distributors, Pune", gupta: "Gupta & Sons, Indore", lakshmi: "Lakshmi Agencies, Hyderabad" };
  var SKUS = [
    { id: "biscuits", code: "MF-CC-200", name: "Choco Cream Biscuits 200 g", brand: "Munchly", mrp: 40, gst: 5, life: 270 },
    { id: "facewash", code: "GL-AF-100", name: "Aloe Face Wash 100 ml", brand: "Glowra", mrp: 120, gst: 18, life: 730, bl: 180 },
    { id: "hairoil", code: "GL-CO-200", name: "Coconut Hair Oil 200 ml", brand: "Glowra", mrp: 150, gst: 5, life: 730, bl: 180 },
    { id: "poha", code: "MF-IP-250", name: "Instant Poha 250 g", brand: "Munchly", mrp: 55, gst: 5, life: 270 },
    { id: "mango", code: "MF-MD-200", name: "Mango Drink 200 ml", brand: "Munchly", mrp: 20, gst: 5, life: 180, bl: 45, qc: 50 },
    { id: "chips", code: "MF-MC-150", name: "Masala Chips 150 g", brand: "Munchly", mrp: 30, gst: 5, life: 180 },
    { id: "oats", code: "MF-MO-200", name: "Masala Oats 200 g", brand: "Munchly", mrp: 65, gst: 5, life: 270 },
    { id: "chikki", code: "MF-PC-100", name: "Peanut Chikki 100 g", brand: "Munchly", mrp: 25, gst: 5, life: 180 }
  ];
  var SKU = {}; SKUS.forEach(function (s) { SKU[s.id] = s; });
  var BATCHES = [
    ["MF-2409-117", "chips", "rakesh", 1840, 47], ["MF-2410-118", "mango", "lakshmi", 2000, 22], ["MF-2408-209", "chips", "gupta", 1032, 74],
    ["MF-2408-311", "chikki", "gupta", 960, 61], ["MF-2409-415", "oats", "patil", 900, 75], ["MF-2409-204", "biscuits", "patil", 2880, 96, { qc: 35, why: "Zepto's Pune warehouse agreed to take this lot at 35% of its life", who: "Neha Kulkarni, 4 Oct" }],
    ["MF-2410-402", "poha", "lakshmi", 1200, 200], ["GL-2410-044", "facewash", "rakesh", 360, 460], ["GL-2410-012", "hairoil", "gupta", 216, 500]
  ].map(function (r) { return { ref: r[0], sku: r[1], dist: r[2], units: r[3], days: r[4], ovr: r[5] || null }; });

  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
  var icon = function (n, s) { return '<i data-icon="' + n + '" data-size="' + (s || 16) + '"></i>'; };
  var bl = function (s) { return s.bl != null ? s.bl : DEF.bl; }, qc = function (s) { return s.qc != null ? s.qc : DEF.qc; };
  var custom = function (s) { return s.bl != null || s.qc != null; };
  // a batch's gates as the agents will read them: the batch's override, else its SKU's value, else the client's default
  function gates(b) {
    var s = SKU[b.sku], o = b.ovr || {}, nb = o.bl != null ? o.bl : bl(s), nq = o.qc != null ? o.qc : qc(s), pct = Math.round(b.days / s.life * 100);
    return [
      { app: "Blinkit", pass: b.days >= nb, need: nb + " days", has: b.days + " days", src: o.bl != null ? "override" : s.bl != null ? "SKU" : "default" },
      { app: "Zepto", pass: pct >= nq, need: nq + "%", has: pct + "%", src: o.qc != null ? "override" : s.qc != null ? "SKU" : "default" },
      { app: "Instamart", pass: pct >= nq, need: nq + "%", has: pct + "%", src: o.qc != null ? "override" : s.qc != null ? "SKU" : "default" }
    ];
  }
  function chips(b, full) {
    return '<span class="g-chips">' + gates(b).map(function (g) { return '<span class="gate ' + (g.pass ? "pass" : "fail") + '" title="' + g.app + ": needs " + g.need + ", has " + g.has + '">' + icon(g.pass ? "check" : "x", 13) + g.app + (full ? ' <span class="need">' + g.has + "/" + g.need + "</span>" : "") + "</span>"; }).join("") + "</span>";
  }
  function val(v, own, unit) { return '<span class="g-val ' + (own ? "own" : "def") + '"><b>' + v + unit + '</b><span class="d">' + (own ? "this SKU" : "default") + "</span></span>"; }
  function title(t, sub, right) { return '<div class="row between wrap" style="gap:8px;margin-top:6px"><div><div class="t-title3">' + t + "</div>" + (sub ? '<div class="t-footnote subtle" style="margin-top:2px">' + sub + "</div>" : "") + "</div>" + (right || "") + "</div>"; }
  function input(id, label, v, unit, help, opts) {
    opts = opts || {};
    return '<div class="field"><label for="' + id + '">' + label + '</label><span class="g-in' + (opts.changed ? " changed" : "") + '"><input class="input" id="' + id + '" type="number" inputmode="numeric" value="' + (v == null ? "" : v) + '"' + (opts.placeholder ? ' placeholder="' + opts.placeholder + '"' : "") + (opts.disabled ? " disabled" : "") + '><span class="u">' + unit + "</span></span>" + (help ? '<div class="help">' + help + "</div>" : "") + "</div>";
  }
  function seg(items, on, label) {
    return '<div class="segmented" role="group" aria-label="' + label + '"><span class="seg-thumb"></span>' + items.map(function (x, i) { return '<button type="button" class="seg" aria-pressed="' + (i === on) + '">' + x + "</button>"; }).join("") + "</div>";
  }
  function sheet(t, body, foot) {
    return '<div class="scrim" style="opacity:1"></div><div role="dialog" aria-modal="true" aria-label="' + esc(t) + '" class="sheet ' + (phone ? "sheet-bottom" : "sheet-side") + '"' + (phone ? ' style="top:7%"' : ' style="width:min(520px,calc(100% - 24px))"') + ">" + (phone ? '<div class="grabber"></div>' : "") + '<div class="sheet-head"><h2>' + esc(t) + '</h2><button type="button" class="iconbtn round" aria-label="Close">' + icon("x", 18) + '</button></div><div class="sheet-body" tabindex="0" role="region" aria-label="' + esc(t) + '"><div class="stack" style="gap:18px">' + body + '</div></div><div class="sheet-foot">' + foot + "</div></div>";
  }

  /* ---------- the tab around every option ---------- */
  var S = window.SC_SHELL, V = phone ? S.phone : S.desktop;
  // the profile's gates row now says these are the defaults, and how many SKUs differ
  var profile = V.profile.replace(/Quick-commerce gates<\/span>/, "Quick-commerce gates, by default</span>").replace(/Blinkit 90\+ days; Zepto and Instamart 60% of life/, "New SKUs start at Blinkit 90+ days, Zepto and Instamart 60% of life · 3 of 8 SKUs differ");
  var top = '<div class="row between wrap" style="gap:8px;margin-top:6px"><div><div class="t-title3">Profile</div><div class="t-footnote subtle" style="margin-top:2px">Set at onboarding; the exits and agents follow from it</div></div><button type="button" class="btn btn-secondary btn-sm">' + icon("sliders-horizontal", 16) + "Edit</button></div>";
  var dists = title("Distributors", "Each gives the agents a one-time permission to act in his name") + V.distributors;
  var columns = phone ? '<div class="stack" style="gap:20px">' + top + profile + dists + "</div>" : '<div style="display:grid;grid-template-columns:minmax(0,1fr) 560px;gap:20px;align-items:start"><div class="stack" style="gap:20px">' + top + profile + '</div><div class="stack" style="gap:20px">' + dists + "</div></div>";

  function skuTable(withGates) {
    var open = function (s) { return BATCHES.filter(function (b) { return b.sku === s.id; }); };
    if (phone) return '<div class="list">' + SKUS.map(function (s) {
      var ob = open(s), ov = ob.filter(function (b) { return b.ovr; }).length;
      return '<button type="button" class="list-row"><span class="lr-main"><span class="lr-title" style="display:block">' + s.name + '</span><span class="lr-sub" style="display:block"><span class="mono">' + s.code + "</span> · ₹" + s.mrp + " · " + s.life + " days</span>" + (withGates ? '<span class="lr-sub" style="display:block;margin-top:4px;color:' + (custom(s) ? "var(--fg)" : "var(--fg-3)") + '">' + (custom(s) ? "<b>" : "") + "Blinkit " + bl(s) + "+ days · Zepto and Instamart " + qc(s) + "%" + (custom(s) ? "</b>" : " · the default") + (ov ? ' · <span class="g-src ovr">' + ov + " batch override</span>" : "") + "</span>" : "") + "</span>" + icon("chevron-right", 18) + "</button>";
    }).join("") + "</div>";
    return '<div class="table-wrap" tabindex="0" role="region" aria-label="Munchly Foods SKUs"><table class="table"><thead><tr><th>Code</th><th aria-sort="ascending"><button type="button">Product' + icon("chevron-up", 13) + '</button></th><th>Brand</th><th class="n">MRP</th><th class="n">GST</th><th class="n">Shelf life</th>' + (withGates ? '<th class="n">Blinkit takes</th><th class="n">Zepto, Instamart take</th><th class="n">Open batches</th><th></th>' : "") + "</tr></thead><tbody>" + SKUS.map(function (s) {
      var ob = open(s), ov = ob.filter(function (b) { return b.ovr; }).length;
      return '<tr class="' + (withGates ? "clickable" : "") + '"><td><span class="mono t-footnote">' + s.code + "</span></td><td><b>" + s.name + "</b></td><td>" + s.brand + '</td><td class="n">₹' + s.mrp + '</td><td class="n">' + s.gst + '%</td><td class="n">' + s.life + " days</td>" + (withGates ? '<td class="n">' + val(bl(s), s.bl != null, "+ days") + '</td><td class="n">' + val(qc(s), s.qc != null, "% of life") + '</td><td class="n">' + ob.length + (ov ? '<div><span class="g-src ovr">' + ov + " override</span></div>" : "") + '</td><td class="n subtle">' + icon("chevron-right", 16) + "</td>" : "") + "</tr>";
    }).join("") + "</tbody></table></div>";
  }

  /* ---------- A: on each SKU ---------- */
  function skuSheet(s) {
    var mine = custom(s), ob = BATCHES.filter(function (b) { return b.sku === s.id; });
    var body = '<div class="g-facts"><span class="mono">' + s.code + "</span><span>" + s.brand + "</span><span><b>₹" + s.mrp + "</b> MRP</span><span><b>" + s.life + "</b>-day shelf life</span></div>" +
      '<fieldset class="g-set"><legend>Quick-commerce gates for this SKU</legend>' + seg(["The client's default", "Its own"], mine ? 1 : 0, "Whose gates") +
      '<div class="g-two">' + input("g-bl", "Blinkit takes stock with at least", bl(s), "days", mine ? "Default: " + DEF.bl + " days" : "Munchly's default for every SKU", { disabled: !mine }) + input("g-qc", "Zepto and Instamart take at least", qc(s), "% of life", mine ? "Default: " + DEF.qc + "%" : "Munchly's default for every SKU", { disabled: !mine }) + "</div>" +
      '<div class="g-mean"><ul><li>' + icon("info", 16) + "<span>On its " + s.life + "-day life, a batch needs <b>" + bl(s) + " days</b> left for Blinkit and <b>" + Math.ceil(s.life * qc(s) / 100) + " days</b> left for Zepto and Instamart.</span></li></ul></div></fieldset>" +
      title("Its batches", ob.length + " open · an override holds for that batch until it closes") +
      ob.map(function (b) {
        return '<div class="g-batch"><div class="top"><span><b class="mono" style="font-weight:600">' + b.ref + '</b> <span class="t-footnote subtle">' + DIST[b.dist] + '</span></span><span class="t-footnote"><b class="tnum">' + b.days + "</b> days left of " + s.life + "</span></div>" + chips(b, true) +
          (b.ovr ? '<div class="g-ovr"><div class="h"><span>Overridden for this batch: Zepto and Instamart ' + b.ovr.qc + "%</span><span class=\"row tight\"><button type=\"button\" class=\"btn btn-secondary btn-sm\">Change</button><button type=\"button\" class=\"btn btn-ghost btn-sm\">Remove</button></span></div><p>" + b.ovr.why + '</p><span class="who">' + b.ovr.who + "</span></div>" : '<button type="button" class="btn btn-secondary btn-sm" style="justify-self:start">' + icon("sliders-horizontal", 15) + "Override for this batch</button>") + "</div>";
      }).join("") + '<p class="t-footnote subtle" style="margin:0">Closed batches keep the gates they were judged by. Every change writes its line in the audit log.</p>';
    return sheet(s.name, body, '<button type="button" class="btn btn-primary btn-lg btn-block">Save gates</button>');
  }
  function optionA() {
    var main = columns + title("SKUs", "From the latest stock export · each SKU's quick-commerce gates, and its batches' overrides") + skuTable(true);
    var over = STATE === "sheet" ? skuSheet(phone ? SKU.mango : SKU.biscuits) : "";
    return { main: main, over: over };
  }

  /* ---------- B: a gates matrix ---------- */
  function optionB() {
    var edit = STATE === "edit", changed = edit ? { chips: { bl: 75 }, oats: { qc: 50 } } : {};
    var rows = SKUS.map(function (s) {
      var c = changed[s.id] || {}, b = c.bl != null ? c.bl : bl(s), q = c.qc != null ? c.qc : qc(s), own = custom(s) || c.bl != null || c.qc != null;
      return '<tr class="' + (c.bl != null || c.qc != null ? "changed" : "") + '"><td><b>' + s.name + '</b><div class="t-caption subtle"><span class="mono">' + s.code + "</span> · " + s.life + '-day life</div></td><td class="n">' + inField(s.id + "-bl", s.name + ": Blinkit, days", b, "days", c.bl != null, !(s.bl != null || c.bl != null)) + '</td><td class="n">' + inField(s.id + "-qc", s.name + ": Zepto and Instamart, % of life", q, "%", c.qc != null, !(s.qc != null || c.qc != null)) + '</td><td class="n">' + (own ? '<button type="button" class="btn btn-ghost btn-sm">' + icon("rotate-ccw", 15) + "Default</button>" : '<span class="t-caption subtle">default</span>') + "</td></tr>";
    }).join("");
    function inField(id, label, v, u, ch, def) { return '<span class="g-in' + (ch ? " changed" : "") + '"><label class="sr-only" for="' + id + '">' + label + '</label><input class="input" id="' + id + '" type="number" value="' + v + '" style="' + (def ? "color:var(--fg-3)" : "font-weight:600") + '"><span class="u">' + u + "</span></span>"; }
    var matrix = '<div class="g-matrix"><div class="table-wrap" tabindex="0" role="region" aria-label="Quick-commerce gates by SKU"><table class="table"><thead><tr><th>SKU</th><th class="n">Blinkit takes at least</th><th class="n">Zepto and Instamart take at least</th><th class="n"></th></tr></thead><tbody><tr class="def"><td><b>New SKUs</b><div class="t-caption subtle">Munchly\'s default · every SKU without its own</div></td><td class="n">' + inField("def-bl", "New SKUs: Blinkit, days", DEF.bl, "days") + '</td><td class="n">' + inField("def-qc", "New SKUs: Zepto and Instamart, % of life", DEF.qc, "%") + "</td><td></td></tr>" + rows + "</tbody></table></div></div>";
    if (phone) matrix = '<div class="list">' + '<div class="list-row" style="background:var(--surface-2)"><span class="lr-main"><span class="lr-title" style="display:block;font-weight:650">New SKUs, by default</span><span class="lr-sub" style="display:block">Blinkit ' + DEF.bl + "+ days · Zepto and Instamart " + DEF.qc + "%</span></span>" + icon("chevron-right", 18) + "</div>" + SKUS.map(function (s) {
      var c = changed[s.id] || {}, b = c.bl != null ? c.bl : bl(s), q = c.qc != null ? c.qc : qc(s), own = custom(s) || c.bl != null || c.qc != null;
      return '<div class="list-row"><span class="lr-main"><span class="lr-title" style="display:block">' + s.name + '</span><span class="lr-sub" style="display:block;color:' + (own ? "var(--fg)" : "var(--fg-3)") + '">' + (own ? "<b>" : "") + "Blinkit " + b + "+ days · Zepto and Instamart " + q + "%" + (own ? "</b>" : " · default") + "</span></span>" + (c.bl != null || c.qc != null ? '<span class="badge badge-green badge-sm">changed</span>' : "") + icon("chevron-right", 18) + "</div>";
    }).join("") + "</div>";
    var bar = edit ? '<div class="g-bar" role="region" aria-label="Unsaved changes"><b>2 changes not saved</b><span class="row tight"><button type="button" class="btn btn-ghost btn-sm">Discard</button><button type="button" class="btn btn-primary btn-sm">Save gates</button></span></div>' : "";
    var b = BATCHES.filter(function (x) { return x.ovr; })[0];
    var overrides = title("Batch overrides", "One batch at a time, until it closes", '<button type="button" class="btn btn-secondary btn-sm">' + icon("plus", 15) + "Override a batch</button>") +
      '<div class="list"><div class="list-row" style="align-items:flex-start"><span class="icontile soft" style="background:var(--violet-soft);color:var(--violet-text)">' + icon("sliders-horizontal", 17) + '</span><span class="lr-main"><span class="lr-title" style="display:block"><span class="mono">' + b.ref + "</span> · " + SKU[b.sku].name + '</span><span class="lr-sub" style="display:block">' + DIST[b.dist] + " · <b style=\"color:var(--fg-2)\">Zepto and Instamart " + b.ovr.qc + "% instead of " + qc(SKU[b.sku]) + "%</b></span><span class=\"lr-sub\" style=\"display:block\">" + b.ovr.why + " · " + b.ovr.who + '</span><span style="display:block;margin-top:6px">' + chips(b) + '</span></span><span class="lr-value"><button type="button" class="btn btn-ghost btn-sm">Remove</button></span></div></div>';
    var main = columns + title("Quick-commerce gates", "What Blinkit, Zepto and Instamart take, SKU by SKU · the Watcher reads them every morning") + matrix + bar + overrides + title("SKUs", "From the latest stock export") + skuTable(false);
    var over = "";
    if (STATE === "sheet") {
      var m = BATCHES[1], s = SKU[m.sku];
      over = sheet("Override a batch", '<div class="field"><label for="ob-b">Batch</label><select class="input select" id="ob-b"><option>' + m.ref + " · " + s.name + " · " + DIST[m.dist] + "</option></select></div>" +
        '<div class="g-batch"><div class="top"><b>As its SKU sets it</b><span class="t-footnote"><b class="tnum">' + m.days + "</b> days left of " + s.life + "</span></div>" + chips(m, true) + "</div>" +
        '<div class="g-two">' + input("ob-bl", "Blinkit takes at least", "", "days", "Empty keeps the SKU's " + bl(s), { placeholder: String(bl(s)) }) + input("ob-qc", "Zepto and Instamart take at least", 10, "% of life", "The SKU's is " + qc(s) + "%") + "</div>" +
        '<div class="field"><label for="ob-why">Why</label><textarea class="input textarea" id="ob-why">Instamart Hyderabad will take this lot at 10%, for its weekend mango promotion</textarea><div class="help">The agents and the audit log show it with the override</div></div>', '<button type="button" class="btn btn-primary btn-lg btn-block">Save the override</button>');
    }
    return { main: main, over: over };
  }

  /* ---------- C: batch first ---------- */
  function optionC() {
    var gated = BATCHES.filter(function (b) { return gates(b).some(function (g) { return !g.pass; }); }).length;
    var sum = '<div class="g-sum">' + [["All", 9, true], ["Pass every gate", BATCHES.length - gated], ["Gated", gated], ["Overridden", 1]].map(function (x) { return '<button type="button" class="chip" aria-pressed="' + !!x[2] + '">' + x[0] + ' <span class="n">' + x[1] + "</span></button>"; }).join("") + "</div>";
    var src = function (g) { return g.src === "override" ? '<span class="g-src ovr">override</span>' : g.src === "SKU" ? '<span class="g-src">SKU</span>' : '<span class="g-src" style="background:transparent;color:var(--fg-3)">default</span>'; };
    var list = BATCHES.slice().sort(function (a, b) { return a.days - b.days; });
    var table = phone ? '<div class="list">' + list.map(function (b) { var s = SKU[b.sku]; return '<button type="button" class="list-row" style="align-items:flex-start"><span class="lr-main"><span class="lr-title" style="display:block">' + s.name + '</span><span class="lr-sub" style="display:block"><span class="mono">' + b.ref + "</span> · " + DIST[b.dist] + " · " + b.days + ' days left</span><span style="display:block;margin-top:6px">' + chips(b) + "</span>" + (b.ovr ? '<span class="g-src ovr" style="margin-top:6px">override</span>' : "") + "</span>" + icon("chevron-right", 18) + "</button>"; }).join("") + "</div>"
      : '<div class="table-wrap" tabindex="0" role="region" aria-label="Munchly Foods batches"><table class="table"><thead><tr><th>Batch</th><th aria-sort="ascending"><button type="button">Days left' + icon("chevron-up", 13) + '</button></th><th>Blinkit</th><th>Zepto and Instamart</th><th class="n">Units</th><th></th></tr></thead><tbody>' + list.map(function (b) {
        var s = SKU[b.sku], g = gates(b), p = Math.max(0.03, b.days / s.life), risk = !g[0].pass && !g[1].pass;
        var cell = function (x) { return '<span class="g-n"><span class="gate ' + (x.pass ? "pass" : "fail") + '">' + icon(x.pass ? "check" : "x", 13) + x.has + " / " + x.need + "</span>" + src(x) + "</span>"; };
        return '<tr class="clickable' + (b.ovr ? " g-row-ovr" : "") + '"><td><b>' + s.name + '</b><div class="t-caption subtle"><span class="mono">' + b.ref + "</span> · " + DIST[b.dist] + '</div></td><td><span class="g-days"><span class="tnum">' + b.days + ' of ' + s.life + '</span><span class="countdown ' + (risk ? "risk" : g.some(function (x) { return !x.pass; }) ? "gated" : "") + '"><i style="--p:' + p + '"></i></span></span></td><td>' + cell(g[0]) + "</td><td>" + cell(g[1]) + '</td><td class="n">' + b.units.toLocaleString("en-IN") + '</td><td class="n subtle">' + icon("chevron-right", 16) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
    var main = title("Batches", "Every open batch, against the gates the Watcher reads · " + gated + " outside at least one") + sum + table + '<p class="t-footnote subtle" style="margin:0">Each SKU\'s gates are set on Supply chain, in the SKU table; a batch\'s override is set here.</p>';
    var over = "";
    if (STATE === "sheet") {
      var b = BATCHES[5], s = SKU[b.sku], g = gates(b);
      over = sheet(b.ref, '<div class="g-facts"><span><b>' + s.name + "</b></span><span>" + DIST[b.dist] + "</span><span><b>" + b.units.toLocaleString("en-IN") + "</b> units</span><span><b>" + b.days + "</b> days left of " + s.life + "</span></div>" +
        '<div class="card pad" style="padding-top:4px;padding-bottom:4px">' + [["Blinkit needs", g[0], "Munchly's default; its SKU has none of its own"], ["Zepto and Instamart need", g[1], "overridden for this batch; its SKU's is " + qc(s) + "%"]].map(function (r) { return '<div class="g-gate-row"><span><span class="t" style="display:block">' + r[0] + " " + r[1].need + '</span><span class="s">' + r[2] + '</span></span><span class="gate ' + (r[1].pass ? "pass" : "fail") + '">' + icon(r[1].pass ? "check" : "x", 13) + "has " + r[1].has + "</span></div>"; }).join("") + "</div>" +
        '<fieldset class="g-set"><legend>Override for this batch</legend>' + seg(["Its SKU's gates", "Its own"], 1, "Whose gates") + '<div class="g-two">' + input("cb-bl", "Blinkit takes at least", "", "days", "Empty keeps the SKU's " + bl(s), { placeholder: String(bl(s)) }) + input("cb-qc", "Zepto and Instamart take at least", b.ovr.qc, "% of life", "The SKU's is " + qc(s) + "%") + '</div><div class="field"><label for="cb-why">Why</label><textarea class="input textarea" id="cb-why" style="min-height:72px">' + b.ovr.why + '</textarea><div class="help">' + b.ovr.who + "</div></div></fieldset>", '<button type="button" class="btn btn-primary btn-lg btn-block">Save the override</button>');
    }
    return { main: main, over: over, tab: true };
  }

  var R = { a: optionA, b: optionB, c: optionC }[OPT]();
  var tabs = V.tabs;
  if (R.tab) tabs = tabs.replace('aria-selected="true" class="tab-btn"><span class="tab-thumb" style="opacity: 1;"></span><span>Supply chain</span></button>', 'aria-selected="false" class="tab-btn"><span>Supply chain</span></button><button type="button" role="tab" aria-selected="true" class="tab-btn"><span class="tab-thumb" style="opacity: 1;"></span><span>Batches</span></button>');
  var body = R.tab ? '<div class="stack" style="gap:18px">' + R.main + "</div>" : '<div class="stack" style="gap:18px">' + V.chain + R.main + "</div>";
  var main = '<div class="layer">' + V.navbar + V.largetitle + '<div class="pagebody" style="padding:0 var(--page-x,16px) 40px;max-width:1320px"><div class="stack" style="gap:18px">' + V.head + tabs + body + "</div></div></div>";
  var root = document.getElementById("root"), dark = window.SC47.dark;
  root.innerHTML = '<div class="app app-root" data-theme="' + (dark ? "dark" : "light") + '" style="position:fixed;inset:0"><div class="ground" aria-hidden="true"></div>' + (phone
    ? '<div class="layer" style="position:absolute;inset:0"><div class="scroll" id="main" style="position:absolute;inset:0;padding-bottom:calc(var(--tabbar-h) + var(--safe-bottom))">' + main + "</div>" + S.tabbar + "</div>"
    : '<div class="layer" style="position:absolute;inset:0;display:grid;grid-template-columns:var(--sidebar-w) minmax(0,1fr)">' + S.sidebar + '<div class="scroll" id="main" style="position:relative;min-width:0">' + main + "</div></div>") + R.over + "</div>";
  root.querySelectorAll("i[data-icon]").forEach(function (i) {
    var s = i.getAttribute("data-size") || 18;
    i.outerHTML = '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (window.SC3_ICONS[i.getAttribute("data-icon")] || "") + "</svg>";
  });
  root.querySelectorAll(".segmented").forEach(function (sg) {
    var t = sg.querySelector(".seg-thumb"), b = sg.querySelector('.seg[aria-pressed="true"]');
    if (t && b) t.style.cssText = "position:absolute;top:2px;bottom:2px;left:" + b.offsetLeft + "px;width:" + b.offsetWidth + "px";
  });
})();
