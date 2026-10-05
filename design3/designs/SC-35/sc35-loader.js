// SC-35 · the landing page's loader, three options: A the route, B dusk and dawn, C the lens.
// Loaded first in <body>, before React, so it is on screen from the first paint. It follows the page's real loading:
// the scripts as each arrives, the fonts, and the town's plate and depth map once the town has drawn them. When
// Light, Dark or Match device changes the theme, sc35.js asks it to cover the page, swap the theme underneath, wait for
// the new plates and lift again. Its exits and covers run on Framer Motion's animate() once Motion is in; if the
// scripts never arrive, it steps aside on its own after eight seconds. Plain ES2019, no build step.
(function () {
  "use strict";
  var D = document, H = D.documentElement, W = window;
  var OPT = String(W.SC35_OPTION || "a").toLowerCase();
  // the board's stills: ?freeze=0.6 holds the first load at that much progress, and it never lifts
  var FREEZE = parseFloat(new W.URLSearchParams(W.location.search).get("freeze"));
  var reduce = !!(W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeOut = function (t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
  var now = function () { return W.performance.now(); };
  var themeNow = function () { return H.getAttribute("data-theme") === "dark" ? "dark" : "light"; };
  var vw = function () { return W.innerWidth; }, vh = function () { return W.innerHeight; };
  function el(tag, cls, html) { var e = D.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* ---------- the progress: real milestones, weighted, shown smoothly and never backwards ---------- */
  var LOAD = W.SC35_LOAD = { option: OPT, reduce: reduce, lifted: false, busy: false, weights: null, marks: {} };
  // the first load: the page's scripts (counted as each arrives), the fonts, React's first render, and the town's depth
  // map and plate as the town draws them. A theme switch: the cover, the new plates decoded, the town's plate redrawn.
  var FIRST = { doc: 0.28, fonts: 0.1, app: 0.06, depth: 0.06, plate: 0.5 };
  var SWITCH = { cover: 0.3, plate: 0.5, drawn: 0.2 };
  function begin(kind, weights, opts) {
    LOAD.kind = kind; LOAD.weights = weights; LOAD.marks = {}; LOAD.target = 0; LOAD.shown = 0;
    LOAD.t0 = LOAD.last = now(); LOAD.done = false; LOAD.opts = opts || {};
  }
  LOAD.mark = function (name, frac) {
    var w = LOAD.weights; if (!w || !(name in w) || LOAD.done) return;
    var prev = LOAD.marks[name] || 0, next = frac == null ? 1 : clamp(frac, 0, 1);
    if (next <= prev) return;
    LOAD.marks[name] = next; LOAD.last = now();
    var t = 0; for (var k in w) t += w[k] * (LOAD.marks[k] || 0);
    LOAD.target = Math.min(1, t);
  };
  LOAD.complete = function () { var w = LOAD.weights; if (!w) return false; for (var k in w) if ((LOAD.marks[k] || 0) < 1) return false; return true; };
  // the town's handshake (sc35-town.js): its depth map is in; it has drawn the plate for a theme
  LOAD.depthIn = function () { if (LOAD.kind === "load") LOAD.mark("depth"); };
  LOAD.plateDrawn = function (dark) {
    if (LOAD.kind === "load") { LOAD.mark("depth"); LOAD.mark("plate"); }
    else if (LOAD.kind === "switch" && LOAD.opts.to === (dark ? "dark" : "light") && LOAD.marks.cover) LOAD.mark("drawn");
  };

  /* ---------- colour: keyframes mixed in OKLab, so a sky turns the way light does ---------- */
  function lin(u) { return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4); }
  function gam(u) { return u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055; }
  function lab(hex) {
    var c = hex.replace("#", ""), r = lin(parseInt(c.slice(0, 2), 16) / 255), g = lin(parseInt(c.slice(2, 4), 16) / 255), b = lin(parseInt(c.slice(4, 6), 16) / 255);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  }
  function css(L) {
    var l = Math.pow(L[0] + 0.3963377774 * L[1] + 0.2158037573 * L[2], 3), m = Math.pow(L[0] - 0.1055613458 * L[1] - 0.0638541728 * L[2], 3), s = Math.pow(L[0] - 0.0894841775 * L[1] - 1.291485548 * L[2], 3);
    var rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
    return "rgb(" + rgb.map(function (u) { return Math.round(clamp(gam(clamp(u, 0, 1)), 0, 1) * 255); }).join(" ") + ")";
  }
  var mixLab = function (a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };

  /* ---------- the mark: a green squircle, the route drawn as an S from the godown dot to the amber pin ---------- */
  var MARK = '<svg class="mk" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="sc35mg" x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2fbf7f"/><stop offset="0.55" stop-color="#178258"/><stop offset="1" stop-color="#0d5a3e"/></linearGradient>' +
    '<linearGradient id="sc35mh" x1="32" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
    '<g class="mk-sq"><path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill="url(#sc35mg)"/><path d="M32 3C10.5 3 3 10.5 3 31.5 10 22 22 18 32 18s22 4 29 13.5C61 10.5 53.5 3 32 3Z" fill="url(#sc35mh)"/></g>' +
    '<path class="mk-route" d="M43.5 19H27a7 7 0 0 0 0 14h10a7 7 0 0 1 0 14H20.5" pathLength="1" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle class="mk-dot" cx="43.5" cy="19" r="3.4" fill="#0d5a3e" stroke="#fff" stroke-width="2.6"/>' +
    '<circle class="mk-ping" cx="20.5" cy="47" r="5" fill="none" stroke="#f7c04a" stroke-width="2" opacity="0"/>' +
    '<circle class="mk-pin" cx="20.5" cy="47" r="5.2" fill="#f7c04a" stroke="#fff" stroke-width="2.2" opacity="0"/></svg>';
  var WORD = "Smart‑Clearance";
  var letters = function (s) { return s.split("").map(function (ch, i) { return '<span style="--i:' + i + '">' + ch + "</span>"; }).join(""); };
  // the mark's squircle as four absolute cubics, centred on (cx, cy) at k px a unit (the mark is 60 units across)
  var SQ = [[32, 2], [9.5, 2], [2, 9.5], [2, 32], [2, 54.5], [9.5, 62], [32, 62], [54.5, 62], [62, 54.5], [62, 32], [62, 9.5], [54.5, 2], [32, 2]];
  function squircle(cx, cy, k) {
    var p = SQ.map(function (q) { return (cx + (q[0] - 32) * k).toFixed(1) + " " + (cy + (q[1] - 32) * k).toFixed(1); });
    return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3] + "C" + p[4] + " " + p[5] + " " + p[6] + "C" + p[7] + " " + p[8] + " " + p[9] + "C" + p[10] + " " + p[11] + " " + p[12] + "Z";
  }
  // the unit size at which that squircle covers the whole window from (cx, cy): its narrowest radius is 30 units
  function coverK(cx, cy) {
    var w = vw(), h = vh();
    return Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy)) / 30 * 1.04;
  }
  // wait for a face before setting a word in it, so the loader never swaps fonts mid-motion (at most ms)
  function face(spec, ms) {
    return new Promise(function (res) { var t = setTimeout(res, ms); if (D.fonts && D.fonts.load) D.fonts.load(spec).then(function () { clearTimeout(t); res(); }, res); else res(); });
  }

  /* ---------- A · the route ---------- */
  // The mark draws its S from the godown dot as the page loads; once the town is drawn the amber pin lands and pings,
  // and the mark opens into a window onto the page: the squircle grows from the mark until it is the whole window.
  // On a theme switch the new theme's ground pours out of the control as the same squircle, the mark draws while the
  // new plates arrive, and the window opens again.
  function A(kind, from, to) {
    var root = el("div", "sc35-a" + (kind === "switch" ? " is-switch" : ""));
    root.setAttribute("data-theme", to);
    root.innerHTML = '<div class="a-cover"><div class="ground"></div></div><div class="a-lock" aria-hidden="true">' + MARK +
      (kind === "load" ? '<span class="wordmark a-word">' + letters(WORD) + '</span><span class="a-hi" lang="hi">हर कार्टन को दूसरा मौका</span>' : "") + "</div>";
    var cover = root.querySelector(".a-cover"), lock = root.querySelector(".a-lock"), mk = root.querySelector(".mk"), route = root.querySelector(".mk-route");
    var I = { el: root, minRun: kind === "load" ? 900 : 320, minShow: kind === "load" ? 1250 : 560, maxWait: kind === "load" ? 8000 : 4000 };
    // the wordmark and the Hindi line rise once their faces are in, so they never swap fonts mid-motion
    if (kind === "load") Promise.all([face('750 32px "Bricolage Grotesque"', 450), face('600 16px "Noto Sans Devanagari"', 450)]).then(function () { lock.classList.add("go"); });
    // the S draws to 88% as the page loads; its last stretch, into the pin, waits for the town
    var drawn = 0;
    var drawTo = function (q) { drawn = q; route.style.strokeDashoffset = String(1 - q); route.style.opacity = q > 0.004 ? "1" : "0"; };
    I.render = function (p) { drawTo(LOAD.complete() ? p : Math.min(p, 0.88)); };
    I.still = function () { lock.style.opacity = "1"; drawTo(1); root.querySelector(".mk-pin").setAttribute("opacity", "1"); };
    I.cover = function (M, o, done) {
      var c = o.origin || [vw() - 60, 30], K = coverK(c[0], c[1]);
      cover.style.clipPath = 'path("' + squircle(c[0], c[1], 0.01) + '")';
      M.animate(0, 1, { duration: 0.42, ease: [0.65, 0, 0.35, 1],
        onUpdate: function (v) { cover.style.clipPath = 'path("' + squircle(c[0], c[1], Math.max(0.01, v * K)) + '")'; },
        onComplete: function () { cover.style.clipPath = ""; done(); } });
      // the mark arrives as the ground lands (the mark's own spring: stiffness 260, damping 18)
      M.animate(lock, { opacity: [0, 1], scale: [0.6, 1] }, { delay: 0.26, type: "spring", stiffness: 260, damping: 18 });
    };
    I.exit = function (M, done) {
      root.style.pointerEvents = "none";
      var pin = root.querySelector(".mk-pin"), ping = root.querySelector(".mk-ping");
      // the route runs into the pin's place, the pin lands and pings once in amber (the mark's own springs: 520 and 14)
      M.animate(drawn, 1, { duration: 0.2, ease: "easeOut", onUpdate: drawTo });
      M.animate(pin, { opacity: [0, 1], y: [-16, 0], scale: [0.6, 1] }, { delay: 0.12, type: "spring", stiffness: 520, damping: 14 });
      M.animate(ping, { opacity: [0.9, 0], scale: [0.6, 2.2] }, { delay: 0.24, duration: 0.9, ease: "easeOut" });
      M.animate(root.querySelectorAll(".a-word, .a-hi"), { opacity: 0, y: 8 }, { delay: 0.2, duration: 0.24, ease: [0.55, 0, 1, 0.45] });
      setTimeout(function () {
        var r = mk.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, k0 = r.width / 64, K = coverK(cx, cy), w = vw(), h = vh();
        M.animate(root.querySelector(".mk-sq"), { opacity: 0 }, { duration: 0.24, ease: "linear" });
        M.animate(0, 1, { duration: kind === "switch" ? 0.58 : 0.74, ease: [0.7, 0, 0.2, 1],
          onUpdate: function (v) {
            var k = k0 * Math.pow(K / k0, v);
            cover.style.clipPath = 'path(evenodd, "M0 0H' + w + "V" + h + "H0Z" + squircle(cx, cy, k) + '")';
            mk.style.transform = "scale(" + (k / k0).toFixed(3) + ")";
            mk.style.opacity = String(1 - clamp((v - 0.18) / 0.44, 0, 1));
          },
          onComplete: done });
      }, kind === "switch" ? 180 : 460);
    };
    return I;
  }

  /* ---------- B · dusk and dawn ---------- */
  // The town's skyline in three paper layers: the maker's office, its chimneys and sawtooth hall, the godown, the food
  // bank, the kirana lane, an auto-rickshaw, the water tank and the buyer's shed on the far hill. The sky turns with
  // the load: a light page loads as dawn, a dark one as night falling; choosing Dark plays dusk and Light plays dawn.
  var KIRANA = [352, 344, 358, 348, 354].map(function (top, k) {
    var x = 1096 + k * 100, packs = "";
    for (var j = 0; j < 5; j++) packs += '<rect x="' + (x + 16 + j * 14) + '" y="' + (top + 34) + '" width="7" height="11" rx="1"/>';
    return { shop: "M" + x + " 440V" + top + "H" + (x + 96) + "V440ZM" + (x - 4) + " " + (top + 20) + "H" + (x + 100) + "L" + (x + 93) + " " + (top + 32) + "H" + (x + 3) + "Z",
      win: '<rect class="w" x="' + (x + 10) + '" y="' + (top + 36) + '" width="76" height="' + (390 - top) + '" rx="2"/>', packs: packs };
  });
  var SKY_BACK = '<path d="M0 318C120 300 210 296 330 304S520 292 640 290 840 304 960 300 1160 284 1290 288 1500 304 1600 298V440H0Z"/>' +
    '<path d="M1150 298V266L1310 238L1470 266V298ZM1470 298V276H1532V298Z"/>' +
    '<path d="M1556 298L1561 172H1567L1572 298ZM1556 214H1572V218H1556ZM1557 250H1571V254H1557ZM1561 172V158H1567V172Z"/>' +
    '<path d="M766 208Q800 190 834 208V232H766ZM772 232H777V296H772ZM789 232H794V296H789ZM806 232H811V296H806ZM823 232H828V296H823ZM772 252L828 270V274L772 256ZM828 252L772 270V274L828 256Z"/>' +
    '<circle cx="92" cy="300" r="18"/><circle cx="126" cy="298" r="13"/><circle cx="420" cy="302" r="16"/><circle cx="598" cy="290" r="20"/><circle cx="630" cy="296" r="13"/><circle cx="984" cy="296" r="18"/><circle cx="1012" cy="292" r="12"/><circle cx="1100" cy="290" r="15"/>' +
    '<path d="M226 300V284H268V300ZM300 302V290H330V302ZM876 300V288H922V300ZM932 302V292H960V302Z"/>' +
    '<rect class="w" x="236" y="289" width="5" height="5"/><rect class="w" x="252" y="289" width="5" height="5"/><rect class="w" x="311" y="294" width="4" height="4"/><rect class="w" x="886" y="292" width="5" height="5"/><rect class="w" x="904" y="292" width="5" height="5"/><rect class="w" x="1200" y="280" width="9" height="5"/><rect class="w" x="1250" y="280" width="9" height="5"/><rect class="w" x="1380" y="280" width="9" height="5"/>';
  var SKY_MID = '<path d="M8 440V296H122V440ZM4 296V288H126V296ZM86 288V272H118V288Z"/>' +
    '<path d="M148 440L152 158H170L174 440ZM150 158V150H172V158Z"/><path d="M186 440L189 178H207L210 440ZM188 178V171H208V178Z"/>' +
    '<path d="M218 440V284L268 320V284L318 320V284L368 320V284L418 320V440Z"/>' +
    '<path d="M552 440V332H540L720 262L900 332H888V440Z"/>' +
    '<path d="M932 440V348H1042V440ZM926 348V340H1048V348ZM922 362H1050L1042 374H930Z"/>' +
    '<circle cx="470" cy="362" r="26"/><rect x="467" y="380" width="6" height="60"/><circle cx="504" cy="378" r="18"/><circle cx="1072" cy="356" r="24"/><rect x="1069" y="372" width="6" height="68"/>' +
    [22, 52, 82].map(function (x) { return '<rect class="w" x="' + x + '" y="310" width="18" height="22" rx="1.5"/><rect class="w" x="' + x + '" y="346" width="18" height="22" rx="1.5"/>'; }).join("") +
    [234, 266, 298, 330, 362, 394].map(function (x) { return '<rect class="w" x="' + x + '" y="350" width="16" height="26" rx="1.5"/>'; }).join("") +
    '<rect class="w" x="590" y="360" width="86" height="80" rx="2"/><rect class="w" x="764" y="360" width="86" height="80" rx="2"/><rect class="w" x="700" y="310" width="12" height="7"/><rect class="w" x="728" y="310" width="12" height="7"/>' +
    '<rect class="w" x="946" y="382" width="30" height="26" rx="1.5"/><rect class="w" x="992" y="382" width="30" height="26" rx="1.5"/>';
  var SKY_FRONT = '<path d="M0 440V428H1600V440Z"/>' +
    '<path d="M226 432V392H316V432ZM316 432V404L324 394H348L356 406V432Z"/><circle cx="246" cy="434" r="8"/><circle cx="296" cy="434" r="8"/><circle cx="340" cy="434" r="8"/>' +
    '<path d="M380 440V420H560V440ZM378 440V412H390V440ZM470 440V412H482V440ZM550 440V412H562V440Z"/>' +
    '<path d="M520 440V366H524V440ZM512 366V360H532V366ZM1060 440V368H1064V440ZM1052 368V362H1072V368Z"/>' +
    '<path d="M834 434V420Q836 412 846 412H852V434ZM850 434V414H938V434ZM856 414V392Q858 382 874 382H924Q936 382 936 394V414Z"/><circle cx="844" cy="436" r="7"/><circle cx="926" cy="436" r="8"/>' +
    KIRANA.map(function (s) { return '<path d="' + s.shop + '"/>' + s.win; }).join("") + KIRANA.map(function (s) { return s.packs; }).join("");
  var STARS = (function () { var s = "", seed = 7; var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (var i = 0; i < 46; i++) s += '<circle cx="' + (rnd() * 100).toFixed(2) + '%" cy="' + (rnd() * 100).toFixed(2) + '%" r="' + (0.6 + rnd() * 1.1).toFixed(2) + '" opacity="' + (0.35 + rnd() * 0.6).toFixed(2) + '"/>';
    return s; })();
  // the times of day, each a keyframe: the sky's top, middle and horizon; the far, middle and near layers; the share of
  // windows lit; the sun and the moon as [x, y, opacity] in fractions of the window; the stars
  var NIGHT = { sky: ["#060a08", "#0c1511", "#2a3b33"], land: ["#18251f", "#111b16", "#0b120e"], lit: 0.86, stars: 1 };
  var MORNING = { sky: ["#d9eae3", "#eaf2ee", "#f4f3ec"], land: ["#ccdad2", "#afc4b7", "#92aa9b"], lit: 0, stars: 0 };
  var PATHS = {
    // to light: night, the hour before dawn, sunrise, morning
    dawn: [
      { at: 0, sky: NIGHT.sky, land: NIGHT.land, lit: NIGHT.lit, sun: [0.16, 1.12, 0], moon: [0.66, 0.24, 1], stars: 1 },
      { at: 0.38, sky: ["#121c20", "#26343a", "#5e6b6a"], land: ["#2a3833", "#1e2a26", "#141e1a"], lit: 0.55, sun: [0.18, 1.04, 0.9], moon: [0.78, 0.42, 0.75], stars: 0.35 },
      { at: 0.68, sky: ["#6f8a8c", "#b4bfb3", "#efd6b3"], land: ["#7f938a", "#5f7168", "#44534b"], lit: 0.12, sun: [0.24, 0.6, 1], moon: [0.88, 0.66, 0], stars: 0 },
      { at: 1, sky: MORNING.sky, land: MORNING.land, lit: 0, sun: [0.3, 0.3, 1], moon: [0.94, 0.8, 0], stars: 0 },
    ],
    // to dark: day, the golden hour, dusk, night
    dusk: [
      { at: 0, sky: MORNING.sky, land: MORNING.land, lit: 0, sun: [0.66, 0.28, 1], moon: [0.16, 1.12, 0], stars: 0 },
      { at: 0.3, sky: ["#aebfbf", "#d7d0bf", "#eed3ad"], land: ["#a2a493", "#7b7f71", "#5a5f54"], lit: 0.08, sun: [0.74, 0.58, 1], moon: [0.16, 1.06, 0], stars: 0 },
      { at: 0.66, sky: ["#253039", "#46505a", "#a68b75"], land: ["#3a4440", "#29322e", "#1c2421"], lit: 0.6, sun: [0.8, 0.98, 0.9], moon: [0.2, 0.62, 0.8], stars: 0.25 },
      { at: 1, sky: NIGHT.sky, land: NIGHT.land, lit: NIGHT.lit, sun: [0.84, 1.12, 0], moon: [0.3, 0.26, 1], stars: 1 },
    ],
  };
  Object.keys(PATHS).forEach(function (k) { PATHS[k].forEach(function (f) { f.skyL = f.sky.map(lab); f.landL = f.land.map(lab); }); });
  function B(kind, from, to) {
    var target = kind === "load" ? from : to, path = PATHS[target === "dark" ? "dusk" : "dawn"];
    // a first load starts nearer its end (a light page at the hour before dawn, a dark one at dusk); a switch starts
    // from the page it covers
    var t0 = kind === "load" ? (target === "dark" ? 0.55 : 0.3) : 0;
    var root = el("div", "sc35-b is-" + kind);
    root.setAttribute("data-theme", target);
    var svg = function (cls, inner) { return '<svg class="b-layer ' + cls + '" viewBox="0 140 1600 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">' + inner + "</svg>"; };
    root.innerHTML = '<div class="b-sky"></div><svg class="b-stars" aria-hidden="true" focusable="false">' + STARS + '</svg><div class="b-orbs"><div class="b-sun"></div><div class="b-moon"></div></div>' +
      '<div class="b-land">' + svg("b-back", SKY_BACK) + svg("b-mid", SKY_MID) + svg("b-front", SKY_FRONT) + "</div>" +
      (kind === "load" ? '<div class="b-lock" aria-hidden="true">' + MARK + '<span class="wordmark">' + WORD + "</span></div>" : "");
    var sun = root.querySelector(".b-sun"), moon = root.querySelector(".b-moon");
    var layers = [].slice.call(root.querySelectorAll(".b-layer")), lock = root.querySelector(".b-lock");
    if (lock) { lock.querySelector(".mk-pin").setAttribute("opacity", "1"); face('750 18px "Bricolage Grotesque"', 450).then(function () { lock.classList.add("go"); }); }
    // the windows light in a fixed, scattered order
    var wins = [].slice.call(root.querySelectorAll(".w")), order = wins.map(function (w, i) { return [((i * 7919) % 31) / 31 + (i % 3) * 0.013, w]; }).sort(function (a, b) { return a[0] - b[0]; }).map(function (x) { return x[1]; });
    var lastLit = -1;
    var I = { el: root, minRun: kind === "load" ? 1300 : 900, minShow: kind === "load" ? 1550 : 1000, maxWait: kind === "load" ? 8000 : 4000 };
    function at(tau) {
      var i = 0; while (i < path.length - 2 && tau > path[i + 1].at) i++;
      var a = path[i], b = path[i + 1], t = clamp((tau - a.at) / (b.at - a.at), 0, 1), s = t * t * (3 - 2 * t);
      return { a: a, b: b, t: s };
    }
    I.render = function (p) {
      var tau = lerp(t0, 1, p), f = at(tau), a = f.a, b = f.b, t = f.t, w = vw(), h = vh();
      for (var i = 0; i < 3; i++) {
        root.style.setProperty("--sky-" + i, css(mixLab(a.skyL[i], b.skyL[i], t)));
        var land = mixLab(a.landL[i], b.landL[i], t);
        root.style.setProperty("--l-" + i, css(land));
        root.style.setProperty("--w-" + i, css([land[0] - 0.07, land[1], land[2]]));
      }
      root.style.setProperty("--stars", String(lerp(a.stars, b.stars, t)));
      var place = function (n, A, Bp, tilt) { n.style.transform = "translate(" + (lerp(A[0], Bp[0], t) * w).toFixed(1) + "px," + (lerp(A[1], Bp[1], t) * h).toFixed(1) + "px)" + tilt; n.style.opacity = String(lerp(A[2], Bp[2], t)); };
      place(sun, a.sun, b.sun, ""); place(moon, a.moon, b.moon, " rotate(-18deg)");
      var n = Math.round(lerp(a.lit, b.lit, t) * order.length);
      if (n !== lastLit) { order.forEach(function (wn, k) { wn.classList.toggle("on", k < n); }); lastLit = n; }
    };
    I.still = function () { root.classList.add("is-still"); };
    I.cover = function (M, o, done) {
      M.animate(root.querySelectorAll(".b-sky, .b-stars, .b-orbs"), { opacity: [0, 1] }, { duration: 0.32, ease: "linear" });
      // the layers rise like a pop-up page, far to near (a new spring: stiffness 220, damping 26, mass 1)
      layers.forEach(function (n, i) { M.animate(n, { y: ["100%", "0%"] }, { delay: 0.04 + i * 0.07, type: "spring", stiffness: 220, damping: 26, mass: 1 }); });
      setTimeout(done, 420);
    };
    I.exit = function (M, done) {
      root.style.pointerEvents = "none";
      if (lock) M.animate(lock, { opacity: 0, y: -8 }, { duration: 0.24, ease: [0.55, 0, 1, 0.45] });
      // into the town: the near layer passes first, the far one last, as the sky clears to the page
      var dive = function (d, delay, fade) { return { duration: d, delay: delay, ease: [0.55, 0, 0.3, 1], opacity: { duration: fade, delay: delay + 0.08, ease: [0.4, 0, 1, 1] } }; };
      M.animate(layers[2], { scale: 1.7, y: "8%", opacity: 0 }, dive(0.62, 0, 0.34));
      M.animate(layers[1], { scale: 1.32, opacity: 0 }, dive(0.66, 0.04, 0.4));
      M.animate(layers[0], { scale: 1.14, opacity: 0 }, dive(0.7, 0.08, 0.46));
      M.animate(root.querySelectorAll(".b-sky, .b-stars, .b-orbs"), { opacity: 0 }, { duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.6, 1] });
      setTimeout(done, 780);
    };
    return I;
  }

  /* ---------- C · the lens ---------- */
  // A camera's iris over the page. Seven blades, closed at first; they open as the page loads, while the page shows
  // through out of focus. Once the town is drawn the focus point locks green, the blades sweep away and the page comes
  // into focus. On a theme switch the iris closes in the old theme, turns to the new one while shut (the focus point
  // hunting while the new plates load), and opens on it once the town is drawn.
  var NB = 7;
  function irisPaths(cx, cy, r, phi, R) {
    var v = [], E = [], out = [], i;
    for (i = 0; i < NB; i++) { var a = phi + i * 2 * Math.PI / NB; v.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    for (i = 0; i < NB; i++) {
      var p = v[(i + 1) % NB], q = v[i], dx = p[0] - q[0], dy = p[1] - q[1], L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
      var ox = p[0] - cx, oy = p[1] - cy, b = ox * dx + oy * dy, c = ox * ox + oy * oy - R * R, t = -b + Math.sqrt(Math.max(0, b * b - c));
      E.push([p[0] + t * dx, p[1] + t * dy]);
    }
    var f = function (pt) { return pt[0].toFixed(1) + " " + pt[1].toFixed(1); };
    // blade i: from v_i along its side through v_(i+1) out to the rim, back round the rim, and in along the previous side
    for (i = 0; i < NB; i++) out.push("M" + f(v[i]) + "L" + f(E[i]) + "A" + R.toFixed(1) + " " + R.toFixed(1) + " 0 0 0 " + f(E[(i - 1 + NB) % NB]) + "Z");
    return out;
  }
  function C(kind, from, to) {
    var root = el("div", "sc35-c is-" + kind);
    root.setAttribute("data-theme", from);
    // the blades' shade falls into the aperture as three soft rings under the blades, offset with the light (no blur
    // filter, so a full-window iris stays smooth)
    root.innerHTML = '<svg class="c-iris" aria-hidden="true" focusable="false"><defs>' +
      '<radialGradient id="sc35-blade" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:var(--blade-0)"/><stop offset="1" style="stop-color:var(--blade-1)"/></radialGradient>' +
      '<radialGradient id="sc35-blade-b" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:var(--blade-1)"/><stop offset="0.3" style="stop-color:var(--blade-0)"/><stop offset="1" style="stop-color:var(--blade-1)"/></radialGradient></defs>' +
      '<g class="c-shade"><path class="sh" stroke-width="22" stroke-opacity="0.05"/><path class="sh" stroke-width="11" stroke-opacity="0.09"/><path class="sh" stroke-width="4" stroke-opacity="0.16"/></g>' +
      '<g class="c-blades">' + new Array(NB + 1).join('<path class="bl"/>') + "</g></svg>" +
      '<div class="c-af is-hunting" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';
    var svg = root.querySelector("svg"), paths = [].slice.call(root.querySelectorAll(".bl")), shades = [].slice.call(root.querySelectorAll(".sh")), af = root.querySelector(".c-af");
    var g1 = root.querySelector("#sc35-blade"), g2 = root.querySelector("#sc35-blade-b"), grp = root.querySelector(".c-blades"), shade = root.querySelector(".c-shade");
    if (kind === "switch") af.style.opacity = "0";
    // the aperture: shut (a small heptagon), open (about a third of the window's short side), and gone (past the rim)
    var geo = function () { var w = vw(), h = vh(), R = Math.hypot(w, h) / 2 + 60, m = Math.min(w, h); return { w: w, h: h, cx: w / 2, cy: h / 2, R: R, shut: m < 600 ? 15 : 20, open: m * 0.34 }; };
    var state = { r: 0, phi: 0 };
    function draw(r, phi) {
      var G = geo(); state.r = r; state.phi = phi;
      svg.setAttribute("viewBox", "0 0 " + G.w + " " + G.h);
      [g1, g2].forEach(function (g) { g.setAttribute("cx", G.cx); g.setAttribute("cy", G.cy); g.setAttribute("r", G.R); });
      var gone = r >= G.R - 1; grp.style.display = shade.style.display = gone ? "none" : "";
      if (gone) return;
      irisPaths(G.cx, G.cy, r, phi, G.R).forEach(function (d, i) { paths[i].setAttribute("d", d); });
      var hept = ""; for (var i = 0; i < NB; i++) { var a = phi + i * 2 * Math.PI / NB; hept += (i ? "L" : "M") + (G.cx + 2 + r * Math.cos(a)).toFixed(1) + " " + (G.cy + 4 + r * Math.sin(a)).toFixed(1); }
      shades.forEach(function (s) { s.setAttribute("d", hept + "Z"); });
    }
    var I = { el: root, minRun: kind === "load" ? 700 : 0, minShow: kind === "load" ? 950 : 460, maxWait: kind === "load" ? 8000 : 4000 };
    I.render = function (p) {
      var G = geo();
      if (kind === "load") draw(lerp(G.shut, G.open, easeOut(reduce ? 0.5 : p)), lerp(0.95, 0.2, reduce ? 0.5 : p));
      else if (state.r) draw(state.r, state.phi);   // a switch stays shut until the new town is drawn
    };
    if (kind === "switch") draw(geo().R + 10, -0.3);
    I.setTheme = function (t) { root.setAttribute("data-theme", t); };
    I.still = function () { var G = geo(); I.covered = true; af.style.opacity = "1"; draw(G.shut, 0.95); };
    var blur = function (b, z) { H.style.setProperty("--sc35-blur", b.toFixed(2) + "px"); H.style.setProperty("--sc35-zoom", z.toFixed(4)); };
    I.cover = function (M, o, done) {
      var G = geo(), r0 = G.R + 10;
      M.animate(0, 1, { duration: 0.38, ease: [0.65, 0, 0.35, 1],
        onUpdate: function (v) { draw(lerp(r0, G.shut, v), lerp(-0.3, 0.95, v)); },
        onComplete: function () { blur(14, 1.03); H.classList.add("sc35-focus"); I.covered = true; done(); } });
      M.animate(af, { opacity: [0, 1], scale: [1.3, 1] }, { delay: 0.26, duration: 0.24, ease: [0.22, 1, 0.36, 1] });
    };
    I.exit = function (M, done) {
      root.style.pointerEvents = "none";
      // the focus locks on the town, then the blades sweep past the rim as the page comes into focus
      af.classList.remove("is-hunting"); af.classList.add("is-locked");
      M.animate(af, { scale: [1, 0.84, 0.9] }, { duration: 0.22, ease: "easeOut" });
      setTimeout(function () {
        var G = geo(), r0 = state.r || G.open, p0 = state.phi;
        M.animate(af, { opacity: 0, scale: 1.6 }, { duration: 0.3, ease: [0.55, 0, 1, 0.45] });
        M.animate(0, 1, { duration: kind === "switch" ? 0.58 : 0.68, ease: [0.65, 0, 0.35, 1],
          onUpdate: function (v) { draw(lerp(r0, G.R + 10, v), lerp(p0, -0.35, v)); blur(14 * (1 - easeOut(v * 1.15)), lerp(1.03, 1, v)); },
          onComplete: function () { H.classList.remove("sc35-focus"); H.style.removeProperty("--sc35-blur"); H.style.removeProperty("--sc35-zoom"); done(); } });
      }, kind === "switch" ? 150 : 240);
    };
    if (kind === "load") { blur(14, 1.03); H.classList.add("sc35-focus"); }
    return I;
  }

  /* ---------- running it ---------- */
  var L = null, raf = 0;
  function mount(kind, from, to) {
    if (L && L.el.parentNode) L.el.parentNode.removeChild(L.el);
    var make = OPT === "b" ? B : OPT === "c" ? C : A;
    L = make(kind, from, to || from); L.kind = kind; L.lastT = 0;
    L.el.classList.add("sc35");
    if (kind === "load") {
      // said once: the region is filled after it is in the page, so screen readers hear it
      var st = el("span", "sr-only"); st.setAttribute("role", "status"); L.el.appendChild(st);
      setTimeout(function () { st.textContent = "Loading Smart-Clearance"; }, 80);
    } else L.el.setAttribute("aria-hidden", "true");
    (D.body || H).appendChild(L.el);
    L.render(reduce ? 1 : 0, now());
  }
  function loop(t) {
    raf = 0; if (!L || L.leaving) return;
    var dt = L.lastT ? Math.min(64, t - L.lastT) : 16; L.lastT = t;
    var aim;
    if (LOAD.complete()) aim = 1;
    else {
      // between milestones it creeps into what is still to come, so it never looks stuck, and never reaches it
      var pend = 0, w = LOAD.weights; for (var k in w) pend += w[k] * (1 - (LOAD.marks[k] || 0));
      aim = Math.min(0.96, LOAD.target + pend * 0.4 * (1 - Math.exp(-(t - LOAD.last) / 1600)));
    }
    if (L.minRun && !reduce) aim = Math.min(aim, (t - (L.runFrom || LOAD.t0)) / L.minRun);
    if (FREEZE >= 0 && L.kind === "load") { L.render(FREEZE, t); raf = W.requestAnimationFrame(loop); return; }
    // it follows the load closely, and once everything is in it closes the last gap quickly
    var done = LOAD.complete(), s = reduce ? aim : LOAD.shown + (aim - LOAD.shown) * (1 - Math.exp(-dt / (done ? 80 : 190)));
    if (aim >= 1 && aim - s < 0.01) s = 1;
    if (s > LOAD.shown) LOAD.shown = s;
    L.render(reduce ? 1 : LOAD.shown, t);
    var age = t - LOAD.t0;
    if (!LOAD.done && ((LOAD.shown >= 1 && (reduce || age >= L.minShow)) || age > L.maxWait)) finish();
    if (L && !L.leaving) raf = W.requestAnimationFrame(loop);
  }
  function run() { if (!raf) raf = W.requestAnimationFrame(loop); }
  function finish() {
    LOAD.done = true; var I = L; I.leaving = true;
    var end = function () {
      if (I.el.parentNode) I.el.parentNode.removeChild(I.el);
      if (L === I) L = null;
      H.classList.remove("sc35-focus"); H.style.removeProperty("--sc35-blur"); H.style.removeProperty("--sc35-zoom");
      if (I.kind === "load") lift();
      LOAD.busy = false;
      var r = I.resolve; if (r) r();
    };
    var M = W.Motion;
    // under reduced motion the page is simply there; without Motion (the scripts never came) the loader fades out
    if (reduce) { end(); return; }
    if (!M || !M.animate) { I.el.style.transition = "opacity 240ms ease"; I.el.style.opacity = "0"; setTimeout(end, 260); return; }
    I.exit(M, end);
  }
  function lift() {
    LOAD.lifted = true; H.classList.remove("sc35-busy");
    try { W.sessionStorage.setItem("sc35-seen", "1"); } catch (e) {}
    var root = D.getElementById("root"); if (root) root.removeAttribute("aria-busy");
    W.dispatchEvent(new CustomEvent("sc35:lifted"));
  }

  // a theme switch: cover the page in the old theme, swap the theme underneath, wait for the new plates, lift
  function preload(to) {
    var base = W.SC3_SITE_IMG || "assets/plates/", list = [["business" + (to === "dark" ? "-night" : "") + ".webp", true]];
    // the street and the islands too, when they are on screen or close to it
    [[".ex-pano img", "exits"], [".islands .isl-plate", "islands"]].forEach(function (q) {
      var n = D.querySelector(q[0]); if (!n) return; var r = n.getBoundingClientRect();
      if (r.bottom > -vh() * 0.5 && r.top < vh() * 1.5) list.push([q[1] + (to === "dark" ? "-night" : "") + ".webp", false]);
    });
    var left = list.length;
    list.forEach(function (f) {
      var im = new Image(); if (f[1]) im.crossOrigin = "anonymous"; im.decoding = "async"; im.src = base + f[0];
      var ok = function () { left -= 1; LOAD.mark("plate", 1 - left / list.length); };
      (im.decode ? im.decode() : new Promise(function (r) { im.onload = r; im.onerror = r; })).then(ok, ok);
    });
  }
  LOAD.switchTheme = function (o) {
    return new Promise(function (resolve) {
      var from = themeNow();
      if (o.to === from || LOAD.busy) { o.apply(); resolve(); return; }
      begin("switch", SWITCH, { to: o.to, from: from });
      LOAD.busy = true; preload(o.to);
      mount("switch", from, o.to); L.resolve = resolve;
      var covered = function () {
        o.apply(); if (L.setTheme) L.setTheme(o.to);
        LOAD.mark("cover"); L.runFrom = now();
        // the town says when it has drawn the new plate; if the town is not there to say, a second will do
        setTimeout(function () { if (LOAD.kind === "switch") LOAD.mark("drawn"); }, 1200);
      };
      var M = W.Motion;
      if (reduce || !M || !M.animate) { if (L.still) L.still(); covered(); run(); return; }
      L.cover(M, o, covered); run();
    });
  };

  // the first load, from the first paint
  var again = (function () { try { return W.sessionStorage.getItem("sc35-seen") === "1"; } catch (e) { return false; } })();
  function first() {
    begin("load", FIRST);
    LOAD.busy = true; H.classList.add("sc35-busy");
    mount("load", themeNow());
    if (again && L) { L.minRun *= 0.5; L.minShow *= 0.5; }
    run();
  }
  // the mockups' replays: the first load again over the page as it is, its milestones simulated (fast, or as on a slow
  // connection); the town is already drawn, so only the loader plays
  LOAD.replay = function (slow) {
    if (LOAD.busy) return;
    var S = slow ? { doc: [200, 1700], fonts: 2000, app: 2100, depth: 2400, plate: 3500 } : { doc: [0, 260], fonts: 300, app: 320, depth: 360, plate: 420 };
    first(); H.classList.remove("sc35-busy");
    var steps = 8; for (var i = 1; i <= steps; i++) (function (i) { setTimeout(function () { LOAD.mark("doc", i / steps); }, lerp(S.doc[0], S.doc[1], i / steps)); })(i);
    ["fonts", "app", "depth", "plate"].forEach(function (k) { setTimeout(function () { LOAD.mark(k); }, S[k]); });
  };

  // what the page tells the loader as it loads: each script as it arrives, then the fonts it uses
  var seen = 0;
  D.addEventListener("load", function (e) {
    var t = e.target; if (!t || t.tagName !== "SCRIPT" || LOAD.kind !== "load") return;
    seen += 1; LOAD.mark("doc", Math.min(0.96, seen / (W.SC35_SCRIPTS || 20)));
  }, true);
  D.addEventListener("DOMContentLoaded", function () {
    LOAD.mark("doc");
    var root = D.getElementById("root"); if (root && !LOAD.lifted) root.setAttribute("aria-busy", "true");
  });
  var fonts = D.fonts && D.fonts.load ? Promise.all(['780 62px "Bricolage Grotesque"', '400 15px Geist', '600 15px Geist'].map(function (f) { return D.fonts.load(f); })) : Promise.resolve();
  fonts.then(function () { LOAD.mark("fonts"); }, function () { LOAD.mark("fonts"); });
  first();
})();
