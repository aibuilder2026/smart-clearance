// Smart-Clearance v3 · the console's splash (SC-51, option A: the shift). Plain ES2019, loaded first in <body>, before
// React, so the first load is covered from the first paint. One surface answers the console's three waits:
//   · the first load (boot), as the session, the platform's config and its catalog are read;
//   · signing in (enter), as the console's first reads come in after "Welcome, <name>";
//   · signing out (leave), as the session closes on the platform and in Firebase.
// The mark draws its route as the reads land; under it the reads are the stops of a short tracker, each landing with
// the time it took; the words say what is happening. When everything is in, the mark flies to where the page keeps its
// mark and its squircle opens into a window onto the page (the landing page's loader, SC-35). The progress follows the
// reads and never goes backwards; the cover shows for at least 1.25 s on a first load and 0.9 s otherwise, and after
// 8 s it says what did not answer. Only the splash moves, and only while something loads (WCAG 2.2.2); under reduced
// motion it is a still frame that leaves when the reads are in. The page talks to it through window.SC3_SPLASH:
// begin(kind, opts) · reads(list) · mark(id) · say({ title, sub, brand }) · open({ anchor }) · fail({ title, text }) ·
// animate (motion's, given by the app). A client's workspace uses the same splash in its own words (SC-73): it sets
// window.SC3_SPLASH_SETUP before this script ({ cls, brand, words, reads }); the console sets nothing.
(function () {
  "use strict";
  var D = document, W = window;
  if (W.SC3_SPLASH) return;
  var SET = W.SC3_SPLASH_SETUP || {};
  var reduce = !!(W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var now = function () { return W.performance.now(); };
  function el(tag, cls, html) { var e = D.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // what each wait reads, in the console's words, and how long its cover stays at the least
  var READS = {
    boot: [{ id: "session", label: "Connecting" }, { id: "config", label: "The platform" }, { id: "catalog", label: "The agents" }],
    enter: [{ id: "clients", label: "Your clients" }, { id: "dashboard", label: "Today" }, { id: "batches", label: "The batches" }, { id: "runs", label: "The agents" }],
    leave: [{ id: "session-end", label: "Closing your session" }, { id: "firebase", label: "Signed out" }],
  };
  if (SET.reads) for (var rk in SET.reads) READS[rk] = SET.reads[rk];
  var MIN = { boot: 1250, enter: 900, leave: 900 }, MAX = 8000, LATE = 2600;
  var greet = function (name) { var h = new Date().getHours(); var g = h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; return name ? g + ", " + name : g; };
  var today = function () { return new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); };
  var WORDS = {
    boot: { title: "Opening the console", sub: "Smart-Clearance staff", late: "Waking the platform up…", say: "Opening the console." },
    enter: { title: function (who) { return greet(who); }, sub: function () { return today() + " · opening your console"; }, say: function (who) { return "Signed in. Opening the console" + (who ? " for " + who : "") + "."; } },
    leave: { title: "Signing you out", sub: function (who) { return who ? "Until next time, " + who + "." : "Until next time."; }, done: "Signed out", say: "Signing you out.", said: "Signed out." },
    fail: { title: "The console did not answer", text: "The platform is taking too long. Check the connection, then try again." },
  };
  if (SET.words) for (var wk in SET.words) WORDS[wk] = Object.assign({}, WORDS[wk], SET.words[wk]);
  var esc = function (v) { return String(v == null ? "" : v).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  // the brand line: the console's wordmark, or a workspace's own mark and name ({ id, name, mark }), as the kit's
  // WorkspaceMark draws it: its colours in the tile, Munchly's m with a bite out of the corner, else its initial
  var CONSOLE = '<span class="wordmark">Smart‑Clearance</span><span class="cs-sp-console">Console</span>';
  function brandOf(b) {
    if (b == null) return CONSOLE;
    if (typeof b === "string") return b;
    var c = b.mark || { from: "#5f6e67", to: "#45554d", ink: "#ffffff" }, m = b.id === "munchly", g = "cs-sp-wm";
    return '<svg width="22" height="22" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs><linearGradient id="' + g + 'g" x1="6" y1="2" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="' + esc(c.from) + '"/><stop offset="1" stop-color="' + esc(c.to) + '"/></linearGradient>' +
      (m ? '<mask id="' + g + 'm"><rect width="64" height="64" fill="#fff"/><circle cx="59" cy="5" r="9" fill="#000"/><circle cx="47" cy="2.5" r="5.5" fill="#000"/><circle cx="61.5" cy="17" r="5.5" fill="#000"/></mask>' : "") + "</defs>" +
      '<path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill="url(#' + g + 'g)"' + (m ? ' mask="url(#' + g + 'm)"' : "") + "/>" +
      (m ? '<path d="M18 45V33.5a7 7 0 0 1 14 0V45M32 33.5a7 7 0 0 1 14 0V45" fill="none" stroke="' + esc(c.ink) + '" stroke-width="6.6" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<text x="32" y="43" text-anchor="middle" fill="' + esc(c.ink) + '" style="font: 700 30px var(--font-ui)">' + esc((b.name || "?").slice(0, 1)) + "</text>") +
      "</svg><span>" + esc(b.name) + "</span>";
  }
  var secs = function (ms) { return (ms / 1000).toFixed(1) + " s"; };

  // the mark: the green squircle, the route drawn as an S from the godown dot to the amber pin
  var S_PATH = "M43.5 19H27a7 7 0 0 0 0 14h10a7 7 0 0 1 0 14H20.5";
  var MARK = '<svg class="cs-sp-mk" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="cs-sp-g" x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2fbf7f"/><stop offset="0.55" stop-color="#178258"/><stop offset="1" stop-color="#0d5a3e"/></linearGradient>' +
    '<linearGradient id="cs-sp-h" x1="32" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
    '<g class="sq"><path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill="url(#cs-sp-g)"/><path d="M32 3C10.5 3 3 10.5 3 31.5 10 22 22 18 32 18s22 4 29 13.5C61 10.5 53.5 3 32 3Z" fill="url(#cs-sp-h)"/></g>' +
    '<path class="route" d="' + S_PATH + '" pathLength="1" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="43.5" cy="19" r="3.4" fill="#0d5a3e" stroke="#fff" stroke-width="2.6"/>' +
    '<circle class="ping" cx="20.5" cy="47" r="5" fill="none" stroke="#f7c04a" stroke-width="2"/>' +
    '<circle class="pin" cx="20.5" cy="47" r="5.2" fill="#f7c04a" stroke="#fff" stroke-width="2.2"/></svg>';
  var TICK = '<svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  // the squircle as a path centred on (cx, cy) at k px a unit, and the unit size at which it covers w × h from there
  var SQ = [[32, 2], [9.5, 2], [2, 9.5], [2, 32], [2, 54.5], [9.5, 62], [32, 62], [54.5, 62], [62, 54.5], [62, 32], [62, 9.5], [54.5, 2], [32, 2]];
  function squircle(cx, cy, k) {
    var p = SQ.map(function (q) { return (cx + (q[0] - 32) * k).toFixed(1) + " " + (cy + (q[1] - 32) * k).toFixed(1); });
    return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3] + "C" + p[4] + " " + p[5] + " " + p[6] + "C" + p[7] + " " + p[8] + " " + p[9] + "C" + p[10] + " " + p[11] + " " + p[12] + "Z";
  }
  function coverK(cx, cy, w, h) { return Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy)) / 30 * 1.04; }
  function face(spec, ms) { return new Promise(function (res) { var t = setTimeout(res, ms); if (D.fonts && D.fonts.load) D.fonts.load(spec).then(function () { clearTimeout(t); res(); }, res); else res(); }); }

  var S = W.SC3_SPLASH = { reduce: reduce, animate: null, active: null, lifted: false, behind: ".app-root", brand: null };
  var I = null, raf = 0;

  /* ---------- the cover ---------- */
  function build(kind, o) {
    var who = o.who || "", w = WORDS[kind];
    var title = o.title != null ? o.title : typeof w.title === "function" ? w.title(who) : w.title, sub = o.sub != null ? o.sub : typeof w.sub === "function" ? w.sub(who) : w.sub;
    var root = el("div", "cs-splash " + kind + (SET.cls ? " " + SET.cls : "") + (reduce ? " still" : ""));
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = '<div class="cs-sp-cover"><div class="ground"></div></div><div class="cs-sp-lock"><div class="cs-sp-mkbox">' + MARK + '</div>' +
      '<div class="cs-sp-words"><span class="cs-sp-brand">' + brandOf(o.brand != null ? o.brand : S.brand != null ? S.brand : SET.brand) + '</span><p class="cs-sp-title"></p><p class="cs-sp-sub"></p></div>' +
      '<div class="tracker cs-sp-tracker"><div class="rail"><i></i></div></div></div>';
    var status = el("span", "sr-only"); status.setAttribute("role", "status"); status.setAttribute("aria-hidden", "false");
    root.appendChild(status);
    root.querySelector(".cs-sp-title").textContent = title || ""; root.querySelector(".cs-sp-sub").textContent = sub || "";
    var tr = root.querySelector(".cs-sp-tracker");
    var it = { el: root, kind: kind, who: who, words: w, status: status, t0: now(), last: now(), shown: 0, reads: [], stops: [], mk: root.querySelector(".cs-sp-mkbox"), route: root.querySelector(".route"), rail: root.querySelector(".rail > i"), tracker: tr, opening: false, gone: false, minShow: o.minShow || MIN[kind], late: false };
    // the reads, named; those already in keep their place and their time (a page may name more once it knows who is in)
    it.setReads = function (list) {
      var landed = it.reads.filter(function (r) { return r.at != null; });
      var next = (list || []).filter(function (r) { return !landed.some(function (x) { return x.id === r.id; }); }).map(function (r) { return { id: r.id, label: r.label, at: null }; });
      it.reads = landed.map(function (r) { var n = (list || []).filter(function (x) { return x.id === r.id; })[0]; return { id: r.id, label: n ? n.label : r.label, at: r.at }; }).concat(next);
      tr.innerHTML = '<div class="rail"><i></i></div>'; it.rail = tr.querySelector(".rail > i"); it.stops = [];
      tr.style.setProperty("--stops", String(it.reads.length));
      it.reads.forEach(function (r) {
        var s = el("div", "stop", '<span class="dot"></span><span class="st-label"></span><span class="st-time"></span>');
        s.querySelector(".st-label").textContent = r.label; tr.appendChild(s); it.stops.push(s);
      });
      it.paint();
    };
    it.paint = function () {
      var cur = -1;
      it.reads.forEach(function (r, i) {
        var s = it.stops[i]; if (!s) return;
        var done = r.at != null; if (!done && cur < 0) cur = i;
        if (done && !s.classList.contains("done")) { s.classList.add("done"); s.querySelector(".dot").innerHTML = TICK; s.querySelector(".st-time").textContent = secs(r.at - it.t0); }
        s.classList.toggle("now", i === cur);
        if (!done) s.querySelector(".st-time").textContent = i === cur ? "…" : "";
      });
    };
    it.render = function (p) {
      it.route.style.strokeDashoffset = String(1 - p); it.route.style.opacity = p > 0.004 ? "1" : "0";
      it.rail.style.transform = "scaleX(" + p.toFixed(4) + ")";
    };
    it.land = function () { root.classList.add("landed"); if (kind === "leave") { root.querySelector(".cs-sp-title").textContent = w.done; status.textContent = w.said; } };
    // the words rise once their face is in, so the title never swaps fonts mid-motion
    face('760 40px "Bricolage Grotesque"', 450).then(function () { root.classList.add("go"); });
    setTimeout(function () { status.textContent = typeof w.say === "function" ? w.say(who) : w.say; }, 80);
    return it;
  }
  function behind() { return D.querySelector(S.behind); }
  function cover(on) {
    var b = behind(); D.documentElement.classList.toggle("cs-covered", on);
    if (!b) return;
    if (on) { b.setAttribute("inert", ""); b.setAttribute("aria-busy", "true"); } else { b.removeAttribute("inert"); b.removeAttribute("aria-busy"); }
  }
  // the progress: it follows the reads, creeps a little towards what is still out so it never looks stuck, never goes
  // backwards, and closes the last gap quickly once everything is in; minRun paces a quick answer into one motion
  function loop(t) {
    raf = 0; var it = I; if (!it || it.opening || it.gone) return;
    var n = it.reads.length, landed = it.reads.filter(function (r) { return r.at != null; }).length, target = n ? landed / n : 0, done = n > 0 && landed === n;
    var dt = it.lastT ? Math.min(64, t - it.lastT) : 16; it.lastT = t;
    var aim = done ? 1 : Math.min(0.96, target + (1 - target) * 0.4 * (1 - Math.exp(-(t - it.last) / 1600)));
    if (!reduce) aim = Math.min(aim, (t - it.t0) / 900);
    var s = reduce ? (done ? 1 : target) : it.shown + (aim - it.shown) * (1 - Math.exp(-dt / (done ? 80 : 190)));
    if (aim >= 1 && aim - s < 0.01) s = 1;
    if (s > it.shown) { it.shown = s; it.render(s); }
    if (it.shown >= 1 && !it.landedAt) { it.landedAt = t; it.land(); }
    if (it.kind === "boot" && !it.late && !done && t - it.t0 > LATE) { it.late = true; it.el.querySelector(".cs-sp-sub").textContent = it.words.late; }
    if (!done && !it.failed && t - it.t0 > MAX && !it.wanted) S.fail({});
    if (it.wanted && it.landedAt && t - it.t0 >= it.minShow && t - it.landedAt >= (reduce ? 0 : 260)) { start(it); return; }
    raf = W.requestAnimationFrame(loop);
  }
  function run() { if (!raf) raf = W.requestAnimationFrame(loop); }

  /* ---------- what the page asks ---------- */
  // begin a wait: the cover comes in (at once on a first load, over 320 ms otherwise) and the mark may arrive from the
  // sign-in card's mark (opts.from, a rect); resolves once the cover is in, so the page behind can change under it
  S.begin = function (kind, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      if (I && !I.gone) { I.el.parentNode && I.el.parentNode.removeChild(I.el); I.gone = true; }
      var it = I = build(kind, opts); S.active = kind;
      it.setReads(opts.reads || READS[kind]);
      (D.body || D.documentElement).appendChild(it.el);
      cover(true);
      it.render(reduce ? 0 : 0);
      var a = S.animate;
      if (opts.from && a && !reduce) {
        var r = it.mk.getBoundingClientRect(), dx = opts.from.left + opts.from.width / 2 - (r.left + r.width / 2), dy = opts.from.top + opts.from.height / 2 - (r.top + r.height / 2), sc = opts.from.width / r.width;
        a(it.mk, { x: [dx, 0], y: [dy, 0], scale: [sc, 1] }, { type: "spring", stiffness: 260, damping: 28, mass: 1 });
      }
      if (kind === "boot" || reduce) { it.el.classList.add("in"); run(); resolve(); return; }
      W.requestAnimationFrame(function () { it.el.classList.add("in"); });
      setTimeout(function () { run(); resolve(); }, 330);
      run();
    });
  };
  // the reads of the wait that is on (a page says what it is about to read); any already in keep their place
  S.reads = function (list) { if (I && !I.gone) I.setReads(list); };
  // new words for the wait that is on, or for every cover from now (brand): the page knows more once it has read it
  S.say = function (o) {
    o = o || {}; if (o.brand !== undefined) S.brand = o.brand;
    var it = I; if (!it || it.gone) return;
    if (o.title != null) it.el.querySelector(".cs-sp-title").textContent = o.title;
    if (o.sub != null) it.el.querySelector(".cs-sp-sub").textContent = o.sub;
    if (o.brand !== undefined) it.el.querySelector(".cs-sp-brand").innerHTML = brandOf(o.brand != null ? o.brand : SET.brand);
  };
  S.mark = function (id) {
    var it = I; if (!it || it.gone) return;
    var r = it.reads.filter(function (x) { return x.id === id; })[0]; if (!r || r.at != null) return;
    r.at = now(); it.last = r.at; it.paint(); run();
  };
  // the page behind is drawn: once the reads are in and the cover has shown long enough, fly to the page's mark and
  // open the window onto it; resolves when the cover has gone
  S.open = function (opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var it = I; if (!it || it.gone) { resolve(); return; }
      it.wanted = opts; it.resolve = resolve;
      // the reads never named: nothing to wait for
      if (!it.reads.length) it.reads = [{ id: "_", label: "", at: now() }];
      run();
    });
  };
  function start(it) {
    it.opening = true; it.el.style.pointerEvents = "none";
    var o = it.wanted, a = S.animate;
    var end = function () {
      it.gone = true; if (it.el.parentNode) it.el.parentNode.removeChild(it.el);
      if (I === it) I = null; S.active = null;
      if (it.kind === "boot") { S.lifted = true; W.dispatchEvent(new W.CustomEvent("sc3:splash-lifted")); }
      if (it.resolve) it.resolve();
    };
    var anchor = typeof o.anchor === "string" ? D.querySelector(o.anchor) : o.anchor;
    var to = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : anchor && anchor.width ? anchor : null;
    if (to && !to.width) to = null;
    if (reduce || !a) { cover(false); if (o.onOpening) o.onOpening(); if (!a && !reduce) { it.el.style.transition = "opacity 240ms ease"; it.el.style.opacity = "0"; setTimeout(end, 260); } else end(); return; }
    var W0 = W.innerWidth, H0 = W.innerHeight, m = it.mk, r0 = m.getBoundingClientRect();
    var cx = to ? to.left + to.width / 2 : r0.left + r0.width / 2, cy = to ? to.top + to.height / 2 : r0.top + r0.height / 2, k0 = (to ? to.width : r0.width) / 64, K = coverK(cx, cy, W0, H0);
    if (to) a(m, { x: cx - (r0.left + r0.width / 2), y: cy - (r0.top + r0.height / 2), scale: to.width / r0.width }, { type: "spring", stiffness: 260, damping: 30, mass: 1 });
    a(it.el.querySelectorAll(".cs-sp-words, .cs-sp-tracker"), { opacity: 0, y: 8 }, { duration: 0.24, ease: [0.55, 0, 1, 0.45] });
    var c = it.el.querySelector(".cs-sp-cover");
    setTimeout(function () {
      cover(false); if (o.onOpening) o.onOpening();
      a(m.querySelector(".sq"), { opacity: 0 }, { duration: 0.24, ease: "linear" });
      a(0, 1, { duration: 0.74, ease: [0.7, 0, 0.2, 1],
        onUpdate: function (v) {
          var k = k0 * Math.pow(K / k0, v);
          c.style.clipPath = 'path(evenodd, "M0 0H' + W0 + "V" + H0 + "H0Z" + squircle(cx, cy, k) + '")';
          m.style.opacity = String(1 - clamp((v - 0.18) / 0.44, 0, 1));
        },
        onComplete: end });
    }, to ? 420 : 60);
  }
  // something did not answer: say so, with a way to try again (a reload, unless the page gives one)
  S.fail = function (o) {
    var it = I; if (!it || it.gone || it.failed) return; it.failed = true; o = o || {};
    it.el.classList.add("failed");
    it.el.querySelector(".cs-sp-title").textContent = o.title || WORDS.fail.title;
    it.el.querySelector(".cs-sp-sub").textContent = o.text || WORDS.fail.text;
    var b = el("button", "btn btn-primary cs-sp-retry"); b.type = "button"; b.textContent = o.label || "Try again";
    b.addEventListener("click", o.onRetry || function () { W.location.reload(); });
    it.el.querySelector(".cs-sp-words").appendChild(b); it.el.setAttribute("aria-hidden", "false"); it.el.style.pointerEvents = "auto";
    it.status.textContent = (o.title || WORDS.fail.title) + " " + (o.text || WORDS.fail.text);
    var bh = behind(); if (bh) bh.removeAttribute("inert");
    b.focus();
  };

  // the first load, from the first paint, unless the page starts it itself
  if (!W.SC3_SPLASH_MANUAL) S.begin("boot", {});
})();
