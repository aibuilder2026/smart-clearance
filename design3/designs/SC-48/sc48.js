// SC-48's mockups: the console's Overview as a dashboard, in three options. The page draws the console's own shell
// (shell.js, captured from design3) and the option's content from the figures below. The figures are illustrative: the
// build reads every one of them from backend-api, and the mock reads them from platform.js. ?theme= light | dark,
// ?state= hover | stop | client shows a state on the board.
(function () {
  var Q = new URLSearchParams(location.search), OPT = window.SC48.option, STATE = Q.get("state") || "";
  var phone = innerWidth < 768;
  var STAGES = ["Connect", "Detect", "Verify", "Value", "Decide", "Approve", "Execute", "Settle", "Report"];
  var AGENTS = ["Data", "Watcher", "Vision", "Valuer", "Router", "a person", "Lister, Outreach, Negotiator", "Paperwork", "Impact"];
  var CLIENTS = {
    gs: { name: "Godavari Staples", mark: "#be123c", plan: "Growth", rec: 492400, spark: [9, 12, 8, 15, 14, 18, 22, 19, 25, 21, 27, 30, 26, 33] },
    an: { name: "Annapurna Naturals", mark: "#16a34a", plan: "Growth", rec: 361800, spark: [6, 8, 7, 11, 9, 12, 10, 14, 13, 17, 15, 16, 19, 21] },
    vs: { name: "Vindhya Snacks", mark: "#15803d", plan: "Pilot", rec: 268300, spark: [4, 6, 9, 7, 8, 11, 9, 12, 10, 13, 14, 12, 16, 15] },
    gh: { name: "Godavari Home Care", mark: "#2563eb", plan: "Enterprise", rec: 219700, spark: [3, 5, 4, 6, 8, 7, 9, 8, 11, 10, 12, 11, 13, 14] },
    mf: { name: "Munchly Foods", mark: "munchly", plan: "Pilot", rec: 140300, spark: [0, 0, 0, 0, 0, 0, 0, 2, 4, 3, 6, 5, 7, 9] },
    ar: { name: "Aravali Snacks", mark: "#c2410c", plan: "Pilot", setup: "Waiting for its admin to accept the invitation" },
    nm: { name: "Narmada Home Care", mark: "#1d4ed8", plan: "Enterprise", setup: "Supply chain set; first stock export due Thursday" }
  };
  // recovered a day, the last 30 days (7 Sep to 6 Oct), in rupees
  var DAYS = [18200, 0, 24600, 31800, 12400, 27900, 35100, 22800, 41600, 38200, 19700, 46300, 52800, 33400, 48900, 61200, 44100, 39800, 67400, 58300, 49200, 72800, 63100, 55600, 81400, 69900, 74200, 93300, 77600, 64800];
  var OPEN = [11, 12, 14, 13, 15, 16, 15, 17, 18, 16, 19, 18, 21, 23];
  var RUNS = [96, 104, 118, 122, 131, 128, 140, 152, 149, 166, 171, 188, 196, 212];
  var BY_STOP = [0, 3, 2, 4, 3, 4, 5, 1, 1];
  var BATCHES = [
    ["GS-2410-031", "gs", "Toor Dal 1 kg", "Sharma Traders, Patna", 5, 19, 2400, 61800, "09:38"],
    ["AN-2410-014", "an", "Ragi Flour 1 kg", "Kulkarni Distributors, Pune", 5, 24, 1100, 38500, "09:31"],
    ["VS-2410-022", "vs", "Aloo Bhujia 200 g", "Mishra Agencies, Gaya", 5, 31, 3600, 29900, "09:12"],
    ["GH-2410-009", "gh", "Dishwash Gel 500 ml", "Verma Enterprises, Indore", 5, 42, 860, 44700, "08:57"],
    ["MF-2410-118", "mf", "Mango Drink 200 ml", "Lakshmi Agencies, Hyderabad", 6, 22, 2000, 21900, "09:40"],
    ["GS-2410-027", "gs", "Sunflower Oil 1 L", "Yadav & Sons, Muzaffarpur", 6, 27, 720, 58300, "09:22"],
    ["AN-2409-061", "an", "Jaggery Powder 500 g", "Joshi & Sons, Nashik", 6, 16, 1500, 24600, "09:05"],
    ["VS-2410-019", "vs", "Makhana Masala 80 g", "Sinha Distributors, Bhagalpur", 6, 35, 2900, 31200, "08:49"],
    ["GH-2409-077", "gh", "Floor Cleaner 1 L", "Patel Brothers, Bhopal", 6, 58, 640, 36100, "08:31"],
    ["GS-2410-033", "gs", "Besan 500 g", "Kumar Agencies, Patna", 3, 29, 1800, 22700, "09:41"],
    ["AN-2410-016", "an", "Groundnut Oil 1 L", "Deshmukh Traders, Satara", 3, 37, 540, 47200, "09:36"],
    ["VS-2410-024", "vs", "Thekua 250 g", "Mishra Agencies, Gaya", 3, 12, 1200, 9800, "09:18"],
    ["GH-2410-011", "gh", "Neem Soap 4 × 100 g", "Verma Enterprises, Indore", 3, 64, 980, 52100, "09:02"],
    ["GS-2410-035", "gs", "Sona Masoori Rice 5 kg", "Sharma Traders, Patna", 4, 33, 420, 66800, "09:39"],
    ["AN-2410-017", "an", "Ragi Flour 1 kg", "Pawar Distributors, Kolhapur", 4, 21, 900, 31500, "09:27"],
    ["MF-2409-117", "mf", "Masala Chips 150 g", "Rakesh Traders, Nagpur", 8, 47, 1840, 21152, "08:10", true],
    ["GH-2410-012", "gh", "Dishwash Gel 500 ml", "Rao Agencies, Jabalpur", 4, 49, 700, 36400, "09:09"],
    ["GS-2410-036", "gs", "Toor Dal 1 kg", "Kumar Agencies, Patna", 1, 26, 2100, 0, "09:41"],
    ["VS-2410-025", "vs", "Aloo Bhujia 200 g", "Sinha Distributors, Bhagalpur", 1, 30, 3200, 0, "09:40"],
    ["AN-2410-018", "an", "Jaggery Powder 500 g", "Kulkarni Distributors, Pune", 1, 18, 1300, 0, "09:40"],
    ["GH-2410-013", "gh", "Floor Cleaner 1 L", "Patel Brothers, Bhopal", 2, 55, 520, 0, "09:34"],
    ["GS-2410-034", "gs", "Sunflower Oil 1 L", "Yadav & Sons, Muzaffarpur", 2, 23, 610, 0, "09:33"],
    ["AN-2410-015", "an", "Groundnut Oil 1 L", "Joshi & Sons, Nashik", 7, 34, 480, 39900, "07:55"]
  ].map(function (r) { return { ref: r[0], client: r[1], sku: r[2], dist: r[3], stage: r[4], days: r[5], units: r[6], value: r[7], at: r[8], recovered: !!r[9] }; });
  var ATTENTION = [
    ["amber", "GS-2410-031 waits for a yes", "Godavari Staples · Toor Dal 1 kg · 6 h", "Open"],
    ["amber", "Patil Distributors", "Munchly Foods · one-time permission not given yet", "Ask again"],
    ["blue", "Kumar Agencies", "Godavari Staples · stock export arrived 3 h late today", "Open"],
    ["amber", "Aravali Snacks", "waiting for Kavita Mehra to accept the invitation", "Open"]
  ];
  var RUNLOG = [["09:41", "Watcher", "Godavari Staples", "GS-2410-036 at risk, 26 days left"], ["09:40", "Data", "Vindhya Snacks", "3 stock exports loaded, 214 batches"], ["09:40", "Watcher", "Annapurna Naturals", "AN-2410-018 at risk, 18 days left"], ["09:39", "Router", "Godavari Staples", "GS-2410-035 split across 4 exits"], ["09:38", "Gate", "Godavari Staples", "GS-2410-031 waiting for Ritu Prasad"]];
  var REQUESTS = [["Kesari Foods", "Arjun Nair · Growth plan · Today, 08:12"], ["Sahyadri Dairy", "Meera Kulkarni · Pilot plan · Yesterday, 17:40"]];

  /* ---------- helpers ---------- */
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var inr = function (v) { return "₹" + Math.round(v).toLocaleString("en-IN"); };
  var money = function (v) { return '<span class="cur" aria-hidden="true">₹</span><span aria-hidden="true">' + Math.round(v).toLocaleString("en-IN") + '</span><span class="sr-only">' + inr(v) + "</span>"; };
  var lakh = function (v) { return "₹" + (v / 100000).toFixed(1) + " lakh"; };
  var k = function (v) { return v ? "₹" + Math.round(v / 1000) + "k" : "0"; };
  var icon = function (n, s) { return '<i data-icon="' + n + '" data-size="' + (s || 16) + '"></i>'; };
  var sum = function (a) { return a.reduce(function (t, x) { return t + x; }, 0); };
  var DATE = function (i) { var d = new Date(Date.UTC(2026, 8, 7 + i)); return d.getUTCDate() + " " + ["Sep", "Oct"][d.getUTCMonth() - 8]; };
  function mark(id, size) {
    var c = CLIENTS[id], s = size || 24;
    if (c.mark === "munchly") return '<svg class="wsmark" width="' + s + '" height="' + s + '" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="mm' + s + '" x1="6" y1="2" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f68d3e"/><stop offset="1" stop-color="#d6461e"/></linearGradient><mask id="mk' + s + '"><rect width="64" height="64" fill="#fff"/><circle cx="59" cy="5" r="9" fill="#000"/><circle cx="47" cy="2.5" r="5.5" fill="#000"/><circle cx="61.5" cy="17" r="5.5" fill="#000"/></mask></defs><path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill="url(#mm' + s + ')" mask="url(#mk' + s + ')"/><path d="M18 45V33.5a7 7 0 0 1 14 0V45M32 33.5a7 7 0 0 1 14 0V45" fill="none" stroke="#fff" stroke-width="6.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<svg class="wsmark" width="' + s + '" height="' + s + '" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill="' + c.mark + '"/><text x="32" y="43" text-anchor="middle" fill="#fff" style="font:700 30px var(--font-ui)">' + c.name[0] + "</text></svg>";
  }
  function seg(stage) { var h = ""; for (var i = 0; i < 9; i++) h += '<i class="' + (i < stage ? "done" : i === stage ? "now" + (i === 5 ? " human" : "") : "") + '"></i>'; return '<span class="ov-seg" aria-hidden="true">' + h + "</span>"; }
  function title(t, sub, right) { return '<div class="row between wrap" style="gap:8px;margin-top:6px"><div><div class="t-title3">' + t + "</div>" + (sub ? '<div class="t-footnote subtle" style="margin-top:2px">' + sub + "</div>" : "") + "</div>" + (right || "") + "</div>"; }

  // a sparkline: one series, a 10% wash, a 2 px line, the last point marked
  function spark(vals, tone) {
    var W = 160, H = 36, max = Math.max.apply(null, vals) || 1, n = vals.length;
    var X = function (i) { return (i / (n - 1)) * W; }, Y = function (v) { return H - 3 - (v / max) * (H - 8); };
    var line = vals.map(function (v, i) { return (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1); }).join(" ");
    var col = tone === "amber" ? "var(--amber)" : "var(--primary)";
    return '<svg class="spark" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + line + " L" + W + " " + H + " L0 " + H + ' Z" fill="' + col + '" opacity="0.1"/><path d="' + line + '" fill="none" stroke="' + col + '" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }
  function kpi(label, ic, value, foot, opts) {
    opts = opts || {};
    var tag = opts.button ? 'button type="button" aria-pressed="' + !!opts.pressed + '"' : "div";
    return "<" + tag + ' class="ov-kpi' + (opts.tone ? " " + opts.tone : "") + '"><span class="k-label">' + icon(ic, 15) + label + '</span><span class="k-value">' + value + '</span><span class="k-foot">' + foot + "</span>" + (opts.spark ? spark(opts.spark, opts.tone) : "") + "</" + (opts.button ? "button" : "div") + ">";
  }
  var total = sum(DAYS), before = Math.round(total * 0.84);
  function kpis(withSpark) {
    return '<div class="ov-kpis">' +
      kpi("Recovered, 30 days", "indian-rupee", money(total), '<span class="up">' + icon("trending-up", 14) + "18%</span> on the 30 days before", { spark: withSpark && DAYS }) +
      kpi("Batches in flight", "boxes", "23", "across 5 clients · 12 more than 2 weeks ago", { spark: withSpark && OPEN }) +
      kpi("Waiting for a yes", "hand", "4", '<span class="warn">oldest 6 h</span> · Godavari Staples', { tone: "amber", spark: withSpark && [1, 2, 1, 3, 2, 2, 4, 3, 2, 3, 5, 3, 4, 4] }) +
      kpi("Agent runs today", "bot", "212", "50 agents on · none failed", { spark: withSpark && RUNS }) + "</div>";
  }
  function live(read) {
    return '<div class="ov-live"><span class="badge badge-green badge-sm"><i class="dot"></i>Live</span><span>Read at <span class="tnum">' + (read || "09:41:20") + '</span> · every 30 s</span><button type="button" class="btn btn-ghost btn-sm" aria-pressed="false">' + icon("pause", 15) + "Pause updates</button></div>";
  }

  // recovered a day: an area chart, one series, with a crosshair and a tooltip on hover
  function area(id, h) {
    return '<div class="ov-chart" id="' + id + '" data-h="' + (h || 220) + '"></div>';
  }
  function drawArea(el) {
    var W = Math.max(280, el.clientWidth), H = +el.getAttribute("data-h"), pl = 44, pr = 8, pt = 10, pb = 24;
    var max = 100000, n = DAYS.length, X = function (i) { return pl + (i / (n - 1)) * (W - pl - pr); }, Y = function (v) { return pt + (1 - v / max) * (H - pt - pb); };
    var line = DAYS.map(function (v, i) { return (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1); }).join(" ");
    var g = "", ax = "";
    [0, 25000, 50000, 75000, 100000].forEach(function (t) { g += '<line class="' + (t ? "gl" : "base") + '" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/>'; ax += '<text class="ax" x="' + (pl - 8) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + k(t) + "</text>"; });
    for (var i = 0; i < n - 4; i += 7) ax += '<text class="ax" x="' + X(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + DATE(i) + "</text>";
    ax += '<text class="ax" x="' + X(n - 1) + '" y="' + (H - 6) + '" text-anchor="end">Today</text>';
    el.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" height="' + H + '" role="img" aria-label="Recovered a day across every client, the last 30 days: ' + inr(total) + ' in all, highest ' + inr(Math.max.apply(null, DAYS)) + ' on 4 Oct">' + g + ax + '<path d="' + line + " L" + X(n - 1) + " " + Y(0) + " L" + X(0) + " " + Y(0) + ' Z" fill="var(--primary)" opacity="0.1"/><path d="' + line + '" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><g class="hover"></g><rect x="' + pl + '" y="0" width="' + (W - pl - pr) + '" height="' + H + '" fill="transparent"/></svg><div class="tip" hidden></div>';
    var svg = el.querySelector("svg"), hv = el.querySelector(".hover"), tip = el.querySelector(".tip");
    function show(i) {
      hv.innerHTML = '<line x1="' + X(i) + '" x2="' + X(i) + '" y1="' + pt + '" y2="' + (H - pb) + '" stroke="var(--line-2)"/><circle cx="' + X(i) + '" cy="' + Y(DAYS[i]) + '" r="5" fill="var(--primary)" stroke="var(--surface)" stroke-width="2"/>';
      tip.hidden = false; tip.innerHTML = "<b>" + (i === n - 1 ? "Today" : DATE(i)) + '</b><div class="tr"><span>Recovered</span><span>' + inr(DAYS[i]) + '</span></div><div class="tr"><span>Batches closed</span><span>' + (1 + (DAYS[i] % 4)) + '</span></div><div class="tr"><span>Packs diverted</span><span>' + Math.round(DAYS[i] / 34).toLocaleString("en-IN") + "</span></div>";
      var left = X(i) / W * el.clientWidth; tip.style.left = (i > n / 2 ? left - 182 : left + 12) + "px"; tip.style.top = "8px";
    }
    svg.addEventListener("mousemove", function (e) { var r = svg.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W; show(Math.max(0, Math.min(n - 1, Math.round((px - pl) / (W - pl - pr) * (n - 1))))); });
    svg.addEventListener("mouseleave", function () { hv.innerHTML = ""; tip.hidden = true; });
    if (STATE === "hover") show(27);
  }
  function stopsBars(pressed) {
    var max = Math.max.apply(null, BY_STOP);
    return '<div class="ov-stops" role="group" aria-label="Batches in flight by stop">' + STAGES.map(function (s, i) {
      var n = BY_STOP[i];
      return '<button type="button" class="ov-stop' + (i === 5 ? " human" : "") + (n ? "" : " zero") + '" aria-pressed="' + (pressed === i) + '" aria-label="' + s + ": " + n + ' batches. Show them in the table"><span>' + s + '</span><span class="bar" style="width:' + (n / max * 100) + '%;' + (n ? "" : "background:var(--fill-3)") + '"></span><span class="n">' + n + "</span></button>";
    }).join("") + "</div>";
  }
  function byClient() {
    var ids = ["gs", "an", "vs", "gh", "mf"], max = CLIENTS.gs.rec;
    return '<div class="ov-stops" role="list" aria-label="Recovered by client, the last 30 days">' + ids.map(function (id) {
      var c = CLIENTS[id];
      return '<div role="listitem" class="ov-stop" style="grid-template-columns:136px minmax(0,1fr) 64px"><span style="display:flex;gap:6px;align-items:center;min-width:0;white-space:nowrap;overflow:hidden">' + mark(id, 18) + '<span style="overflow:hidden;text-overflow:ellipsis">' + c.name + '</span></span><span class="bar" style="width:' + (c.rec / max * 100) + '%"></span><span class="n">' + lakh(c.rec).replace(" lakh", "L") + "</span></div>";
    }).join("") + "</div>";
  }

  /* ---------- the batches table ---------- */
  function rows(filter) {
    var list = BATCHES.filter(filter || function () { return true; });
    list.sort(function (a, b) { return (b.stage === 5) - (a.stage === 5) || a.days - b.days; });
    return list;
  }
  function filters(opts) {
    opts = opts || {};
    var seg = '<div class="segmented" role="group" aria-label="Which batches"><span class="seg-thumb" style="width:calc((100% - 4px)/3);left:2px;top:2px;bottom:2px;inset:auto;position:absolute"></span>' + [["In flight", 23], ["Waiting for a yes", 4], ["Closed", 54]].map(function (x, i) { return '<button type="button" class="seg" aria-pressed="' + (i === 0) + '">' + x[0] + ' <span class="t-caption subtle tnum">' + x[1] + "</span></button>"; }).join("") + "</div>";
    return '<div class="ov-filters"><label class="ov-search">' + icon("search", 16) + '<span class="sr-only">Find a batch</span><input type="search" placeholder="Batch, product or distributor"></label>' +
      (opts.noClient ? "" : '<select class="ov-sel" aria-label="Client"><option>' + (opts.client || "All clients") + "</option></select>") +
      (opts.noStop ? "" : '<select class="ov-sel" aria-label="Stop"><option>' + (opts.stop || "All stops") + "</option></select>") + (phone ? "" : seg) + "</div>";
  }
  function table(list, opts) {
    opts = opts || {}; var page = list.slice(0, opts.size || 8), n = list.length;
    var pager = '<div class="ov-pager"><span>' + (n ? "1–" + page.length + " of " + n : "None") + (phone ? "" : ' · <label>Rows <select class="ov-sel" aria-label="Rows per page"><option>' + (opts.size || 8) + "</option></select></label>") + '</span><nav class="pg" aria-label="Pages"><button type="button" aria-label="Previous page" disabled>' + icon("chevron-left", 16) + "</button>" + (phone ? "" : [1, 2, 3].slice(0, Math.max(1, Math.ceil(n / (opts.size || 8)))).map(function (p) { return '<button type="button"' + (p === 1 ? ' aria-current="page"' : "") + ">" + p + "</button>"; }).join("")) + '<button type="button" aria-label="Next page"' + (n > page.length ? "" : " disabled") + ">" + icon("chevron-right", 16) + "</button></nav></div>";
    if (phone) return '<div class="ov-tablecard"><div class="list ov-rows" style="box-shadow:none;border-radius:0">' + page.map(function (b) {
      return '<div class="list-row">' + mark(b.client, 28) + '<span class="lr-main"><span class="r1"><b>' + b.sku + '</b><span class="t-footnote tnum ' + (b.days < 20 ? "ov-days low" : "") + '">' + b.days + ' d</span></span><span class="r2"><span class="mono">' + b.ref + "</span> · " + b.dist + "</span>" + seg(b.stage) + '<span class="r2"><b style="color:' + (b.stage === 5 ? "var(--amber-text)" : "var(--fg-2)") + '">' + (b.stage === 5 ? "Waiting for a yes" : STAGES[b.stage]) + "</b> · " + (b.value ? (b.recovered ? inr(b.value) + " recovered" : inr(b.value) + " planned") : b.units.toLocaleString("en-IN") + " units") + "</span></span></div>";
    }).join("") + "</div>" + pager + "</div>";
    return '<div class="ov-tablecard"><div class="table-wrap" tabindex="0" role="region" aria-label="Batches in flight"><table class="table ov-table"><thead><tr><th>Batch</th><th>Client</th><th aria-sort="ascending"><button type="button">Stop' + icon("chevron-up", 13) + '</button></th><th class="n"><button type="button">Days left</button></th><th class="n"><button type="button">Units</button></th><th class="n"><button type="button">Recovering</button></th><th class="n">Updated</th></tr></thead><tbody>' + page.map(function (b) {
      return '<tr class="clickable"><td><span class="bt"><b>' + b.sku + '</b><span class="t-caption subtle"><span class="mono">' + b.ref + "</span> · " + b.dist + '</span></span></td><td><span class="who">' + mark(b.client, 22) + CLIENTS[b.client].name + '</span></td><td><span class="ov-stage">' + seg(b.stage) + '<span class="' + (b.stage === 5 ? "human" : "") + '">' + (b.stage === 5 ? "Waiting for a yes" : STAGES[b.stage]) + '</span></span></td><td class="n"><span class="ov-days' + (b.days < 20 ? " low" : "") + '">' + b.days + '</span></td><td class="n">' + b.units.toLocaleString("en-IN") + '</td><td class="n">' + (b.value ? inr(b.value) + (b.recovered ? "" : '<div class="t-caption subtle">planned</div>') : '<span class="subtle">—</span>') + '</td><td class="n mono t-footnote subtle">' + b.at + "</td></tr>";
    }).join("") + "</tbody></table></div>" + pager + "</div>";
  }
  function attention() {
    return title("Needs attention", "Waiting on a person, or on a file") + '<div class="list">' + ATTENTION.map(function (a) { return '<div class="list-row"><span class="cs-att ' + a[0] + '" aria-hidden="true"></span><span class="lr-main"><span class="lr-title" style="display:block">' + a[1] + '</span><span class="lr-sub" style="display:block">' + a[2] + '</span></span><span class="lr-value"><button type="button" class="btn btn-secondary btn-sm">' + a[3] + "</button></span></div>"; }).join("") + "</div>";
  }
  function requests() {
    return title("Demo requests", "From Book a demo on smartclearance.com") + '<div class="list">' + REQUESTS.map(function (r) { return '<div class="list-row"><span class="icontile soft">' + icon("mail", 17) + '</span><span class="lr-main"><span class="lr-title" style="display:block">' + r[0] + '</span><span class="lr-sub" style="display:block">' + r[1] + '</span></span><span class="lr-value"><button type="button" class="btn btn-secondary btn-sm">Set up</button></span></div>'; }).join("") + "</div>";
  }
  function runs(n) {
    return title("Agent runs", "The latest, as they land", '<a class="btn btn-link btn-sm" href="#">All 212 today</a>') + '<div class="list">' + RUNLOG.slice(0, n || 5).map(function (r) { return '<div class="list-row"><span class="mono t-footnote cs-time">' + r[0] + '</span><span class="lr-main"><span class="lr-title" style="display:block">' + r[1] + " · " + r[2] + '</span><span class="lr-sub" style="display:block">' + r[3] + "</span></span></div>"; }).join("") + "</div>";
  }
  function card(t, s, body, right, foot) {
    return '<section class="ov-card"><div class="ov-card-head"><div><div class="t">' + t + "</div>" + (s ? '<div class="s">' + s + "</div>" : "") + "</div>" + (right || "") + "</div>" + body + (foot ? '<div class="ov-foot">' + foot + "</div>" : "") + "</section>";
  }
  var range = '<div class="segmented" role="group" aria-label="Range"><span class="seg-thumb" style="position:absolute;top:2px;bottom:2px;left:calc(2px + (100% - 4px)/3);width:calc((100% - 4px)/3)"></span><button type="button" class="seg" aria-pressed="false">7 days</button><button type="button" class="seg" aria-pressed="true">30 days</button><button type="button" class="seg" aria-pressed="false">90 days</button></div>';
  var tableLink = '<button type="button" class="btn btn-link btn-sm">' + icon("file-spreadsheet", 15) + "Show as a table</button>";

  /* ---------- the three options ---------- */
  function optionA() {
    var stop = STATE === "stop" ? 5 : null, list = rows(stop == null ? null : function (b) { return b.stage === stop; });
    var trend = card("Recovered, by day", "Every client · ₹ a day, closed batches", '<div class="ov-big">' + money(total) + ' <span class="t-footnote subtle" style="font:500 13px var(--font-ui);letter-spacing:0">in 30 days</span></div><div style="height:10px"></div>' + area("trend", phone ? 180 : 210), range, "<span>Highest " + inr(93300) + " on 4 Oct · " + lakh(before) + " the 30 days before</span>" + tableLink);
    var stops = card("In flight, by stop", "23 batches · choose a stop to list them", stopsBars(stop), null, '<span class="ov-legend"><span><i style="background:var(--primary)"></i>Agents at work</span><span><i style="background:var(--amber)"></i>Waiting for a person</span></span>');
    var tbl = title(stop == null ? "Live batches" : "At Approve", stop == null ? "Every client's batches in flight, the ones waiting for a yes first" : "4 batches waiting for a person's yes", stop == null ? "" : '<button type="button" class="btn btn-secondary btn-sm">' + icon("x", 15) + "Every stop</button>") + filters({ stop: stop == null ? null : "Approve" }) + table(list);
    if (phone) return '<div class="ov">' + live() + kpis(true) + trend + stops + '<div class="ov-col">' + tbl + "</div>" + '<div class="ov-col">' + attention() + "</div>" + '<div class="ov-col">' + requests() + "</div></div>";
    return '<div class="ov"><div class="row between wrap" style="gap:8px">' + live() + "</div>" + kpis(true) + '<div class="ov-two wide-side">' + trend + stops + "</div>" + '<div class="ov-col">' + tbl + '</div><div class="ov-three"><div class="ov-col">' + attention() + '</div><div class="ov-col">' + requests() + '</div><div class="ov-col">' + runs(4) + "</div></div></div>";
  }
  function optionB() {
    var stop = STATE === "stop" ? 5 : 6, list = rows(function (b) { return b.stage === stop; }), max = Math.max.apply(null, BY_STOP);
    var strip = '<div class="ov-kpis">' + kpi("Recovered, 30 days", "indian-rupee", money(total), '<span class="up">' + icon("trending-up", 14) + "18%</span> on the 30 days before") + kpi("Batches in flight", "boxes", "23", "across 5 clients") + kpi("Waiting for a yes", "hand", "4", '<span class="warn">oldest 6 h</span>', { tone: "amber" }) + kpi("Agent runs today", "bot", "212", "none failed") + "</div>";
    var pipe = '<div class="ov-pipe" role="group" aria-label="Batches in flight at each stop">' + STAGES.map(function (s, i) {
      var n = BY_STOP[i];
      return '<button type="button" class="p' + (i === 5 ? " human" : "") + (n ? "" : " zero") + '" aria-pressed="' + (i === stop) + '"><span class="no">' + (i + 1) + '</span><span class="nm">' + s + '</span><span class="ct">' + n + '</span><span class="ag">' + (i === 5 ? "waiting for a person" : AGENTS[i]) + '</span><span class="meter"><i style="width:' + (n / max * 100) + '%"></i></span></button>';
    }).join("") + "</div>";
    var side = card("Recovered, by day", "Every client, the last 30 days", '<div class="ov-big">' + money(total) + "</div><div style=\"height:8px\"></div>" + area("trend", 150), null, tableLink) + card("Recovered, by client", "The last 30 days", byClient()) + '<div class="ov-col">' + attention() + "</div>";
    var row3 = '<div class="ov-three">' + card("Recovered, by day", "Every client, the last 30 days", '<div class="ov-big">' + money(total) + "</div><div style=\"height:8px\"></div>" + area("trend", 150), null, tableLink) + card("Recovered, by client", "The last 30 days", byClient()) + '<div class="ov-col">' + attention() + "</div></div>";
    var tbl = title("At " + STAGES[stop], list.length + " batches · " + (stop === 5 ? "waiting for a person's yes" : "the Lister, Outreach and the Negotiator at work"), '<button type="button" class="btn btn-secondary btn-sm">' + icon("x", 15) + "Every stop</button>") + filters({ noStop: true }) + table(list, { size: 8 });
    if (phone) return '<div class="ov">' + live() + strip + title("The nine stops", "Choose one to list its batches") + pipe + tbl + side + '<div class="ov-col">' + requests() + "</div></div>";
    return '<div class="ov">' + '<div class="row between wrap" style="gap:8px">' + live() + "</div>" + strip + title("The nine stops", "Every client's batches in flight, where they stand · choose a stop") + pipe + '<div class="ov-col">' + tbl + "</div>" + row3 + "</div>";
  }
  function optionC() {
    var pick = STATE === "client" ? "gs" : null;
    var strip = '<div class="ov-kpis">' + kpi("Recovered, 30 days", "indian-rupee", money(total), '<span class="up">' + icon("trending-up", 14) + "18%</span> on the 30 days before", { spark: DAYS }) + kpi("Batches in flight", "boxes", "23", "across 5 clients") + kpi("Waiting for a yes", "hand", "4", '<span class="warn">oldest 6 h</span>', { tone: "amber" }) + kpi("Clients live", "building-2", "5", "2 setting up") + "</div>";
    var per = { gs: [0, 1, 0, 1, 1, 1, 1, 0, 0], an: [0, 1, 0, 1, 1, 1, 1, 1, 0], vs: [0, 1, 0, 1, 0, 1, 1, 0, 0], gh: [0, 0, 1, 1, 1, 1, 1, 0, 0], mf: [0, 0, 0, 0, 0, 0, 1, 0, 1] };
    var inflight = { gs: 7, an: 6, vs: 4, gh: 5, mf: 2 }, wait = { gs: 1, an: 1, vs: 1, gh: 1, mf: 0 };
    var cards = '<div class="ov-clients">' + ["gs", "an", "vs", "gh", "mf", "ar", "nm"].map(function (id) {
      var c = CLIENTS[id];
      if (c.setup) return '<button type="button" class="ov-client setup" aria-pressed="false"><span class="top">' + mark(id, 30) + "<b>" + c.name + '</b><span class="badge badge-sm" style="margin-left:auto">Setting up</span></span><span class="t-footnote subtle">' + c.setup + "</span></button>";
      var mx = Math.max.apply(null, per[id]) || 1;
      return '<button type="button" class="ov-client" aria-pressed="' + (pick === id) + '"><span class="top">' + mark(id, 30) + "<b>" + c.name + '</b><span class="badge badge-green badge-sm" style="margin-left:auto"><i class="dot"></i>Live</span></span><span class="mid"><span><span class="ov-big" style="font-size:22px">' + money(c.rec) + '</span><span class="t-caption subtle" style="display:block">recovered, 30 days</span></span>' + spark(c.spark).replace('class="spark"', "") + '</span><span class="ov-mini" aria-hidden="true">' + per[id].map(function (n, i) { return '<i class="' + (n ? (i === 5 ? "human" : "") : "zero") + '" style="height:' + (n ? Math.max(30, n / mx * 100) : 8) + '%"></i>'; }).join("") + '</span><span class="facts"><span><b>' + inflight[id] + "</b> in flight</span>" + (wait[id] ? '<span class="warn"><b>' + wait[id] + "</b> waiting for a yes</span>" : "") + "<span>" + c.plan + " plan</span></span></button>";
    }).join("") + "</div>";
    var list = rows(pick ? function (b) { return b.client === pick; } : null);
    var tbl = title(pick ? "Godavari Staples's batches" : "Live batches", pick ? "7 in flight · choose the card again to see every client" : "Every client's batches in flight, the ones waiting for a yes first") + filters({ client: pick ? "Godavari Staples" : null }) + table(list);
    if (phone) return '<div class="ov">' + live() + strip + title("Clients", "Choose one to list its batches") + cards + tbl + '<div class="ov-col">' + attention() + "</div></div>";
    return '<div class="ov"><div class="row between wrap" style="gap:8px">' + live() + "</div>" + strip + title("Clients", "Recovered and in flight, client by client · choose one to list its batches", '<span class="ov-legend"><span><i style="background:var(--primary)"></i>Agents at work</span><span><i style="background:var(--amber)"></i>Waiting for a person</span></span>') + cards + '<div class="ov-col">' + tbl + '</div><div class="ov-three two"><div class="ov-col">' + attention() + '</div><div class="ov-col">' + requests() + "</div></div></div>";
  }

  /* ---------- the page ---------- */
  var S = window.SC_SHELL, body = { a: optionA, b: optionB, c: optionC }[OPT]();
  var head = '<header class="navbar"><span class="nb-title">Overview</span><div class="nb-actions">' + (phone ? "" : S.appearance) + '</div></header><div class="largetitle"><h1>Overview</h1><div class="lt-sub">Tuesday, 6 October · 5 clients live, 2 setting up · 50 agents on</div></div>';
  var main = '<div class="layer">' + head + '<div class="pagebody" style="padding:0 var(--page-x,16px) 40px;max-width:1320px">' + body + "</div></div>";
  var root = document.getElementById("root"), dark = window.SC48.dark;
  root.innerHTML = '<div class="app app-root" data-theme="' + (dark ? "dark" : "light") + '" style="position:fixed;inset:0"><div class="ground" aria-hidden="true"></div>' + (phone
    ? '<div class="layer" style="position:absolute;inset:0"><div class="scroll" id="main" style="position:absolute;inset:0;padding-bottom:calc(var(--tabbar-h) + var(--safe-bottom))">' + main + "</div>" + S.tabbar + "</div>"
    : '<div class="layer" style="position:absolute;inset:0;display:grid;grid-template-columns:var(--sidebar-w) minmax(0,1fr)">' + S.sidebar + '<div class="scroll" id="main" style="position:relative;min-width:0">' + main + "</div></div>") + "</div>";
  root.querySelectorAll("i[data-icon]").forEach(function (i) {
    var s = i.getAttribute("data-size") || 18;
    i.outerHTML = '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (window.SC3_ICONS[i.getAttribute("data-icon")] || "") + "</svg>";
  });
  root.querySelectorAll(".ov-chart[id]").forEach(drawArea);
  // the segmented controls' thumbs sit under the pressed button, as the kit draws them
  root.querySelectorAll(".segmented").forEach(function (sg) {
    var t = sg.querySelector(".seg-thumb"), b = sg.querySelector('.seg[aria-pressed="true"]');
    if (t && b) { t.removeAttribute("style"); t.style.cssText = "position:absolute;top:2px;bottom:2px;left:" + b.offsetLeft + "px;width:" + b.offsetWidth + "px"; }
  });
  root.querySelectorAll('.ov-live .btn').forEach(function (b) {
    b.addEventListener("click", function () { var on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on); b.lastChild.textContent = on ? "Resume updates" : "Pause updates"; b.closest(".ov-live").querySelector(".badge").lastChild.textContent = on ? "Paused" : "Live"; });
  });
})();
