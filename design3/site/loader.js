// Smart-Clearance v3 · smartclearance.com's loader (SC-35; SC-131, option B, the route runs). Plain ES2019, loaded
// first in <body>, before React, and self-contained: it brings its own styles, so it paints with the page's first
// bytes, before any stylesheet has arrived.
//   · Every load of the page, reloads included, plays the route: the mark's route stands faint and a bright stretch of
//     it runs from the godown dot to the pin, a lap every 1.15 s, the pin throbbing as each lap arrives. It lifts once
//     the first screen can be read (the page's stylesheets in, its faces in or 2.5 s gone, and the hero's soft preview
//     under the film's poster), never waiting for the plate itself, which sharpens in place: the last lap draws the
//     whole route, the pin pings once, and the mark opens into a window onto the page. Past 3 s a quiet line says the
//     connection is slow.
//   · Every change of theme plays dusk or dawn: the town's skyline in paper layers rises under a sky that turns from day
//     to night (or back) while the new plates load; the theme changes underneath, and the layers part into the page.
// Its exits run on Framer Motion's animate() (motion's in the SvelteKit build); if the scripts never arrive it steps
// aside on its own after twelve seconds. Only the loader moves, and only while the page loads (WCAG 2.2.2); under
// reduced motion it is a still frame that leaves as soon as the page is ready. The town and the theme talk to it
// through window.SC3_LOADER.
(function () {
  "use strict";
  var D = document, H = D.documentElement, W = window;
  if (W.SC3_LOADER) return;
  var reduce = !!(W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var now = function () { return W.performance.now(); };
  var vw = function () { return W.innerWidth; }, vh = function () { return W.innerHeight; };
  var themeNow = function () { return H.getAttribute("data-theme") === "dark" ? "dark" : "light"; };
  function el(tag, cls, html) { var e = D.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // the reader's appearance before the first paint (sc3-theme, as the kit keeps it), so the loader opens in it
  (function () {
    var mode = null; try { mode = W.localStorage.getItem("sc3-theme"); } catch (e) { /* storage blocked */ }
    var dark = mode === "dark" || (mode !== "light" && !!(W.matchMedia && W.matchMedia("(prefers-color-scheme: dark)").matches));
    H.setAttribute("data-theme", dark ? "dark" : "light");
  })();

  /* ---------- its own styles: design system v3's inks and faces, written out, so nothing waits for a stylesheet ---------- */
  var DISPLAY = '"Bricolage Grotesque Variable", "Bricolage Grotesque", "Geist Variable", "Geist", system-ui, sans-serif';
  var UI = '"Geist Variable", "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  var HI = '"Noto Sans Devanagari Variable", "Noto Sans Devanagari", "Kohinoor Devanagari", system-ui, sans-serif';
  var EASE = "cubic-bezier(.22,1,.36,1)";
  // the design system's spring (tokens.css --ease-spring, one 10% overshoot): the mark springs in on it, as in SC-35 and SC-51
  var SPRING = "linear(0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.723 12.9%, 0.938 16.7%, 1.017 19.4%, 1.067, 1.099 24.3%, 1.108 26%, 1.1, 1.074 31.1%, 1.008 38.1%, 0.983 42.5%, 0.979 45.6%, 0.985 50%, 1.001 59.9%, 1.002 70.2%, 1)";
  var CSS = [
    // the loader sits over the whole window, outside the app, so it is sized by the window, not the app's container
    ".loader{position:fixed;inset:0;z-index:90;overflow:hidden;contain:strict;-webkit-tap-highlight-color:transparent;font:400 15px/1.5 " + UI + ";-webkit-font-smoothing:antialiased}",
    ".loader .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
    ".loader .mk{flex:none;display:block;overflow:visible}.loader .mk .mk-sq,.loader .mk circle{transform-box:fill-box;transform-origin:center}",
    // the route: the page's own ground and aurora, the mark, the wordmark and the Hindi line
    ".loader-route{--lr-bg:#f2f6f3;--lr-a1:#d9f0e3;--lr-a2:#e2eef7;--lr-fg:#0d1c15;--lr-fg2:#45554d;--lr-fg3:#5f6e67;--lr-fill:rgb(17 41 30/.075);color:var(--lr-fg)}",
    ".loader-route[data-theme=dark]{--lr-bg:#070b09;--lr-a1:rgb(22 122 82/.34);--lr-a2:rgb(16 112 150/.22);--lr-fg:#ecf2ee;--lr-fg2:#a7b4ad;--lr-fg3:#82908a;--lr-fill:rgb(214 255 232/.08)}",
    ".loader-route .lr-cover{position:absolute;inset:0;background:radial-gradient(48% 46% at 18% 4%,var(--lr-a1),transparent 70%),radial-gradient(42% 40% at 84% 0%,var(--lr-a2),transparent 70%),var(--lr-bg)}",
    ".loader-route .lr-lock{position:absolute;left:50%;top:50%;translate:-50% -50%;display:grid;justify-items:center;gap:18px;text-align:center}",
    ".loader-route .mk{width:112px;height:112px;will-change:transform}",
    ".loader-route .mk .mk-sq{animation:loader-pop 560ms " + SPRING + " backwards}.loader-route .mk .mk-dot{animation:loader-pop 420ms " + SPRING + " 180ms backwards}",
    // the route runs: three tenths of it, from the godown dot to the pin, a lap every 1.15 s; the pin throbs as it arrives
    ".loader-route .mk .mk-ghost{opacity:.3}.loader-route .mk .mk-route{stroke-dasharray:.3 1.4;stroke-dashoffset:.3}",
    ".loader-route.running .mk .mk-route{animation:loader-run 1.15s cubic-bezier(.45,0,.55,1) 320ms infinite}",
    ".loader-route.running .mk .mk-pin{animation:loader-throb 1.15s cubic-bezier(.45,0,.55,1) 320ms infinite}",
    "@keyframes loader-run{from{stroke-dashoffset:.3}to{stroke-dashoffset:-1}}",
    "@keyframes loader-throb{0%,70%{transform:scale(1)}82%{transform:scale(1.38)}100%{transform:scale(1)}}",
    ".loader-route.drawn .mk .mk-ghost{opacity:0;transition:opacity 380ms linear}",
    ".loader-route.landed .mk .mk-ping{animation:loader-ping 900ms ease-out both}@keyframes loader-ping{from{opacity:.9;transform:scale(.6)}to{opacity:0;transform:scale(2.2)}}",
    ".loader-route.landed .lr-word,.loader-route.landed .lr-hi,.loader-route.landed .lr-slow{opacity:0;transform:translateY(8px);transition:opacity 240ms cubic-bezier(.55,0,1,.45),transform 240ms cubic-bezier(.55,0,1,.45)}",
    ".loader-route.opening .mk .mk-sq{opacity:0;transition:opacity 240ms linear}",
    ".loader-route .lr-word{display:inline-flex;overflow:hidden;padding-block:2px;font:750 34px/1.1 " + DISPLAY + ";letter-spacing:-.03em;font-variation-settings:'opsz' 48;white-space:nowrap;color:var(--lr-fg)}",
    ".loader-route .lr-word>span{display:inline-block}",
    ".loader-route .lr-hi{margin-top:-6px;font:600 17px/1.5 " + HI + ";color:var(--lr-fg)}",
    ".loader-route .lr-slow{margin-top:6px;display:inline-flex;align-items:center;gap:8px;min-height:30px;padding:0 12px;border-radius:999px;background:var(--lr-fill);font-size:13.5px;color:var(--lr-fg2);opacity:0;transform:translateY(6px);transition:opacity 240ms linear,transform 240ms " + EASE + "}",
    ".loader-route .lr-slow i{width:7px;height:7px;border-radius:50%;background:var(--lr-fg3)}",
    ".loader-route.slow .lr-slow{opacity:1;transform:none}.loader-route.leaving .lr-slow{opacity:0}",
    // the words rise once their faces are in, or after a third of a second, so a slow face never holds them back
    ".loader-route .lr-lock:not(.go) .lr-word>span,.loader-route .lr-lock:not(.go) .lr-hi{opacity:0}",
    ".loader-route .lr-lock.go .lr-word>span{animation:loader-rise 620ms " + EASE + " backwards;animation-delay:calc(120ms + var(--i) * 28ms)}",
    ".loader-route .lr-lock.go .lr-hi{animation:loader-fade 520ms " + EASE + " 620ms backwards}",
    "@media (max-width:599px){.loader-route .mk{width:84px;height:84px}.loader-route .lr-word{font-size:30px}.loader-route .lr-hi{font-size:15px}}",
    "@keyframes loader-pop{from{opacity:0;transform:scale(.55)}}@keyframes loader-rise{from{opacity:0;transform:translateY(105%)}}@keyframes loader-fade{from{opacity:0;transform:translateY(6px)}}",
    // dusk and dawn: the town's skyline in three paper layers under a sky that turns with the load; the sun or the moon
    // climbs, and the windows light at night. A switch starts from the page it covers: the sky clear, the town below the
    // window, until the cover plays (or, under reduced motion, at once)
    ".loader-sky{--lit:#f4e8c8}",
    ".loader-sky .ls-sky{position:absolute;inset:0;background:linear-gradient(to bottom,var(--sky-0) 0%,var(--sky-1) 52%,var(--sky-2) 100%)}",
    ".loader-sky .ls-stars{position:absolute;left:0;top:0;width:100%;height:65%}.loader-sky .ls-stars g{opacity:var(--stars,0)}.loader-sky .ls-stars circle{fill:#ecf2ee}",
    ".loader-sky .ls-orbs{position:absolute;inset:0}",
    ".loader-sky .ls-sun,.loader-sky .ls-moon{position:absolute;left:0;top:0;border-radius:50%;will-change:transform;pointer-events:none}",
    ".loader-sky .ls-sun{width:68px;height:68px;margin:-34px 0 0 -34px;background:radial-gradient(circle at 42% 38%,#fffdf6,#f8ecd0 72%)}",
    ".loader-sky .ls-moon{width:46px;height:46px;margin:-23px 0 0 -23px;box-shadow:inset -13px 5px 0 0 #e7eee9}",
    ".loader-sky .ls-land{position:absolute;left:50%;bottom:0;height:max(34vh,calc(100vw * 300 / 1600));aspect-ratio:1600/300;translate:-50% 0}",
    ".loader-sky .ls-layer{position:absolute;inset:0;width:100%;height:100%;overflow:visible;transform-origin:50% 100%;will-change:transform}",
    ".loader-sky .ls-back{fill:var(--l-0)}.loader-sky .ls-mid{fill:var(--l-1);filter:drop-shadow(0 -3px 6px rgb(0 0 0/.1))}.loader-sky .ls-front{fill:var(--l-2);filter:drop-shadow(0 -3px 7px rgb(0 0 0/.14))}",
    ".loader-sky .ls-back .w{fill:var(--w-0)}.loader-sky .ls-mid .w{fill:var(--w-1)}.loader-sky .ls-front .w{fill:var(--w-2)}",
    ".loader-sky .w{transition:fill 360ms " + EASE + "}.loader-sky .w.on{fill:var(--lit)}",
    ".loader-sky .ls-sky,.loader-sky .ls-stars,.loader-sky .ls-orbs{opacity:0}.loader-sky .ls-layer{transform:translateY(100%)}",
    ".loader-sky.is-still .ls-sky,.loader-sky.is-still .ls-stars,.loader-sky.is-still .ls-orbs{opacity:1}.loader-sky.is-still .ls-layer{transform:none}",
    "@media (max-width:599px){.loader-sky .ls-sun{width:52px;height:52px;margin:-26px 0 0 -26px}.loader-sky .ls-moon{width:38px;height:38px;margin:-19px 0 0 -19px;box-shadow:inset -11px 4px 0 0 #e7eee9}}",
    "@media (prefers-reduced-motion:reduce){.loader *,.loader *::before,.loader *::after{animation:none!important;transition:none!important}.loader-route .mk .mk-route{stroke-dasharray:1 1;stroke-dashoffset:0}.loader-route .mk .mk-ghost{opacity:0}}"
  ].join("");
  if (!D.getElementById("sc3-loader-css")) { var st = el("style"); st.id = "sc3-loader-css"; st.textContent = CSS; (D.head || H).appendChild(st); }

  /* ---------- what it waits for: on a load, the first screen; on a switch, the new plates, weighted, never backwards ---------- */
  var LOAD = W.SC3_LOADER = { lifted: false, busy: false, reduce: reduce, weights: null, marks: {} };
  // a load waits for what the first screen needs to be read: the page's stylesheets, its faces (or 2.5 s), and the
  // document; the app, the depth map and the plate are noted as they come but never waited for. A switch: the cover,
  // the new plates decoded, the town's plate redrawn.
  var FIRST = { doc: 0.4, fonts: 0.3, sheets: 0.3, app: 0, depth: 0, plate: 0 };
  var SWITCH = { cover: 0.3, plate: 0.5, drawn: 0.2 };
  var FACES = 2500;
  function begin(kind, weights, opts) {
    LOAD.kind = kind; LOAD.weights = weights; LOAD.marks = {}; LOAD.target = 0; LOAD.shown = 0;
    LOAD.t0 = LOAD.last = now(); LOAD.done = false; LOAD.opts = opts || {};
  }
  LOAD.mark = function (name, frac) {
    var w = LOAD.weights; if (!w || !(name in w) || LOAD.done) return;
    if (LOAD.kind === "load" && name === "plate") LOAD.plateIn = true;
    var prev = LOAD.marks[name] || 0, next = frac == null ? 1 : clamp(frac, 0, 1);
    if (next <= prev) return;
    LOAD.marks[name] = next; LOAD.last = now();
    var t = 0; for (var k in w) t += w[k] * (LOAD.marks[k] || 0);
    LOAD.target = Math.min(1, t);
  };
  LOAD.complete = function () { var w = LOAD.weights; if (!w) return false; for (var k in w) if (w[k] > 0 && (LOAD.marks[k] || 0) < 1) return false; return true; };
  // the page's stylesheets: in once each has its sheet, or has failed to arrive
  function sheetsIn() {
    // a stylesheet still on its way may be a preload that becomes a stylesheet once it has loaded (SC-131)
    var links = D.querySelectorAll('link[rel~="stylesheet"], link[rel="preload"][as="style"]');
    for (var i = 0; i < links.length; i++) if (!(links[i].rel.indexOf("stylesheet") >= 0 && links[i].sheet) && !links[i].dataset.failed) return false;
    return true;
  }
  D.addEventListener("error", function (e) { var t = e.target; if (t && t.tagName === "LINK") t.dataset.failed = "1"; }, true);
  // the town's handshake: its depth map is in; it has drawn the plate for a theme
  LOAD.depthIn = function () { if (LOAD.kind === "load") LOAD.mark("depth"); };
  LOAD.plateDrawn = function (dark) {
    if (LOAD.kind === "load") { LOAD.mark("depth"); LOAD.mark("plate"); }
    else if (LOAD.kind === "switch" && LOAD.opts.to === (dark ? "dark" : "light") && LOAD.marks.cover) LOAD.mark("drawn");
  };

  /* ---------- the mark: a green squircle, the route drawn as an S from the godown dot to the amber pin ---------- */
  var MARK = '<svg class="mk" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="ld-mg" x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2fbf7f"/><stop offset="0.55" stop-color="#178258"/><stop offset="1" stop-color="#0d5a3e"/></linearGradient>' +
    '<linearGradient id="ld-mh" x1="32" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
    '<g class="mk-sq"><path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill="url(#ld-mg)"/><path d="M32 3C10.5 3 3 10.5 3 31.5 10 22 22 18 32 18s22 4 29 13.5C61 10.5 53.5 3 32 3Z" fill="url(#ld-mh)"/></g>' +
    '<path class="mk-ghost" d="M43.5 19H27a7 7 0 0 0 0 14h10a7 7 0 0 1 0 14H20.5" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path class="mk-route" d="M43.5 19H27a7 7 0 0 0 0 14h10a7 7 0 0 1 0 14H20.5" pathLength="1" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle class="mk-dot" cx="43.5" cy="19" r="3.4" fill="#0d5a3e" stroke="#fff" stroke-width="2.6"/>' +
    '<circle class="mk-ping" cx="20.5" cy="47" r="5" fill="none" stroke="#f7c04a" stroke-width="2" opacity="0"/>' +
    '<circle class="mk-pin" cx="20.5" cy="47" r="5.2" fill="#f7c04a" stroke="#fff" stroke-width="2.2"/></svg>';
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
  // a tween of its own on a cubic bezier, so the route's exit needs nothing from the page's scripts (on a slow line
  // the loader can lift before they arrive)
  function bezier(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    var X = function (t) { return ((ax * t + bx) * t + cx) * t; }, Y = function (t) { return ((ay * t + by) * t + cy) * t; }, dX = function (t) { return (3 * ax * t + 2 * bx) * t + cx; };
    return function (x) {
      var t = x; for (var i = 0; i < 6; i++) { var e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-4 || !d) break; t -= e / d; }
      return Y(clamp(t, 0, 1));
    };
  }
  function tween(ms, ease, onUpdate, onDone) {
    var t0 = now();
    var step = function () { var p = clamp((now() - t0) / ms, 0, 1); onUpdate(ease(p)); if (p < 1) W.requestAnimationFrame(step); else if (onDone) onDone(); };
    W.requestAnimationFrame(step);
  }
  // wait for a face before setting words in it, so the loader never swaps fonts mid-motion (at most ms)
  function face(spec, ms) {
    return new Promise(function (res) { var t = setTimeout(res, ms); if (D.fonts && D.fonts.load) D.fonts.load(spec).then(function () { clearTimeout(t); res(); }, res); else res(); });
  }

  /* ---------- a load: the route ---------- */
  // On the page's own ground and aurora the squircle springs in and its route runs, lap after lap, while the first
  // screen loads. Then the last lap draws the whole route and stays, the pin pings once in amber, and the squircle grows
  // from the mark until it is the whole window: the mark opens onto the page.
  function Route(theme) {
    var root = el("div", "loader-route" + (reduce ? "" : " running"));
    root.setAttribute("data-theme", theme);
    root.innerHTML = '<div class="lr-cover"></div><div class="lr-lock" aria-hidden="true">' + MARK +
      '<span class="lr-word">' + "Smart‑Clearance".split("").map(function (ch, i) { return '<span style="--i:' + i + '">' + ch + "</span>"; }).join("") + "</span>" +
      '<span class="lr-hi" lang="hi">हर कार्टन को दूसरा मौका</span><span class="lr-slow"><i></i>Slow connection · the page is on its way</span></div>';
    var cover = root.querySelector(".lr-cover"), lock = root.querySelector(".lr-lock"), mk = root.querySelector(".mk"), route = root.querySelector(".mk-route");
    var I = { el: root, minShow: 1250, maxWait: 12000 };
    // the wordmark and the Hindi line rise once their faces are in, or after a third of a second
    Promise.all([face('750 34px "Bricolage Grotesque Variable", "Bricolage Grotesque"', 320), face('600 17px "Noto Sans Devanagari Variable", "Noto Sans Devanagari"', 320)]).then(function () { lock.classList.add("go"); });
    I.render = function () {};
    I.slow = function () { root.classList.add("slow"); };
    I.exit = function (M, done) {
      root.style.pointerEvents = "none"; root.classList.add("leaving");
      // the last lap: the whole route draws from the godown dot and stays, then the pin pings once and the words go
      root.classList.remove("running");
      route.style.strokeDasharray = "1 1"; route.style.strokeDashoffset = "1";
      void route.getBoundingClientRect();
      route.style.transition = "stroke-dashoffset 380ms cubic-bezier(0.22, 1, 0.36, 1)"; route.style.strokeDashoffset = "0";
      root.classList.add("drawn");
      setTimeout(function () { root.classList.add("landed"); }, 380);
      setTimeout(function () {
        var r = mk.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, k0 = r.width / 64, K = coverK(cx, cy), w = vw(), h = vh();
        root.classList.add("opening");
        // the window: the ground keeps everything outside the mark's squircle as it grows from the mark
        tween(740, bezier(0.7, 0, 0.2, 1), function (v) {
          var k = k0 * Math.pow(K / k0, v);
          cover.style.clipPath = 'path(evenodd, "M0 0H' + w + "V" + h + "H0Z" + squircle(cx, cy, k) + '")';
          mk.style.transform = "scale(" + (k / k0).toFixed(3) + ")";
          mk.style.opacity = String(1 - clamp((v - 0.18) / 0.44, 0, 1));
        }, done);
      }, 640);
    };
    return I;
  }

  /* ---------- a switch: dusk and dawn ---------- */
  // The town's skyline in three paper layers: the maker's office, its chimneys and sawtooth hall, the godown, the food
  // bank, the kirana lane with packets hung in the shops, an auto-rickshaw, the water tank and the buyer's shed on the
  // far hill. Choosing Dark plays dusk: the sun sets, the moon rises and the windows light one by one. Choosing Light
  // plays dawn. The hour follows the load, and once the new town is drawn the layers part into the page.
  var KIRANA = [352, 344, 358, 348, 354].map(function (top, k) {
    var x = 1096 + k * 100, packs = "";
    for (var j = 0; j < 5; j++) packs += '<rect x="' + (x + 16 + j * 14) + '" y="' + (top + 34) + '" width="7" height="11" rx="1"/>';
    return { shop: "M" + x + " 440V" + top + "H" + (x + 96) + "V440ZM" + (x - 4) + " " + (top + 20) + "H" + (x + 100) + "L" + (x + 93) + " " + (top + 32) + "H" + (x + 3) + "Z",
      win: '<rect class="w" x="' + (x + 10) + '" y="' + (top + 36) + '" width="76" height="' + (390 - top) + '" rx="2"/>', packs: packs };
  });
  var LAND_BACK = '<path d="M0 318C120 300 210 296 330 304S520 292 640 290 840 304 960 300 1160 284 1290 288 1500 304 1600 298V440H0Z"/>' +
    '<path d="M1150 298V266L1310 238L1470 266V298ZM1470 298V276H1532V298Z"/>' +
    '<path d="M1556 298L1561 172H1567L1572 298ZM1556 214H1572V218H1556ZM1557 250H1571V254H1557ZM1561 172V158H1567V172Z"/>' +
    '<path d="M766 208Q800 190 834 208V232H766ZM772 232H777V296H772ZM789 232H794V296H789ZM806 232H811V296H806ZM823 232H828V296H823ZM772 252L828 270V274L772 256ZM828 252L772 270V274L828 256Z"/>' +
    '<circle cx="92" cy="300" r="18"/><circle cx="126" cy="298" r="13"/><circle cx="420" cy="302" r="16"/><circle cx="598" cy="290" r="20"/><circle cx="630" cy="296" r="13"/><circle cx="984" cy="296" r="18"/><circle cx="1012" cy="292" r="12"/><circle cx="1100" cy="290" r="15"/>' +
    '<path d="M226 300V284H268V300ZM300 302V290H330V302ZM876 300V288H922V300ZM932 302V292H960V302Z"/>' +
    '<rect class="w" x="236" y="289" width="5" height="5"/><rect class="w" x="252" y="289" width="5" height="5"/><rect class="w" x="311" y="294" width="4" height="4"/><rect class="w" x="886" y="292" width="5" height="5"/><rect class="w" x="904" y="292" width="5" height="5"/><rect class="w" x="1200" y="280" width="9" height="5"/><rect class="w" x="1250" y="280" width="9" height="5"/><rect class="w" x="1380" y="280" width="9" height="5"/>';
  var LAND_MID = '<path d="M8 440V296H122V440ZM4 296V288H126V296ZM86 288V272H118V288Z"/>' +
    '<path d="M148 440L152 158H170L174 440ZM150 158V150H172V158Z"/><path d="M186 440L189 178H207L210 440ZM188 178V171H208V178Z"/>' +
    '<path d="M218 440V284L268 320V284L318 320V284L368 320V284L418 320V440Z"/>' +
    '<path d="M552 440V332H540L720 262L900 332H888V440Z"/>' +
    '<path d="M932 440V348H1042V440ZM926 348V340H1048V348ZM922 362H1050L1042 374H930Z"/>' +
    '<circle cx="470" cy="362" r="26"/><rect x="467" y="380" width="6" height="60"/><circle cx="504" cy="378" r="18"/><circle cx="1072" cy="356" r="24"/><rect x="1069" y="372" width="6" height="68"/>' +
    [22, 52, 82].map(function (x) { return '<rect class="w" x="' + x + '" y="310" width="18" height="22" rx="1.5"/><rect class="w" x="' + x + '" y="346" width="18" height="22" rx="1.5"/>'; }).join("") +
    [234, 266, 298, 330, 362, 394].map(function (x) { return '<rect class="w" x="' + x + '" y="350" width="16" height="26" rx="1.5"/>'; }).join("") +
    '<rect class="w" x="590" y="360" width="86" height="80" rx="2"/><rect class="w" x="764" y="360" width="86" height="80" rx="2"/><rect class="w" x="700" y="310" width="12" height="7"/><rect class="w" x="728" y="310" width="12" height="7"/>' +
    '<rect class="w" x="946" y="382" width="30" height="26" rx="1.5"/><rect class="w" x="992" y="382" width="30" height="26" rx="1.5"/>';
  var LAND_FRONT = '<path d="M0 440V428H1600V440Z"/>' +
    '<path d="M226 432V392H316V432ZM316 432V404L324 394H348L356 406V432Z"/><circle cx="246" cy="434" r="8"/><circle cx="296" cy="434" r="8"/><circle cx="340" cy="434" r="8"/>' +
    '<path d="M380 440V420H560V440ZM378 440V412H390V440ZM470 440V412H482V440ZM550 440V412H562V440Z"/>' +
    '<path d="M520 440V366H524V440ZM512 366V360H532V366ZM1060 440V368H1064V440ZM1052 368V362H1072V368Z"/>' +
    '<path d="M834 434V420Q836 412 846 412H852V434ZM850 434V414H938V434ZM856 414V392Q858 382 874 382H924Q936 382 936 394V414Z"/><circle cx="844" cy="436" r="7"/><circle cx="926" cy="436" r="8"/>' +
    KIRANA.map(function (s) { return '<path d="' + s.shop + '"/>' + s.win; }).join("") + KIRANA.map(function (s) { return s.packs; }).join("");
  var STARS = (function () { var s = "", seed = 7; var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (var i = 0; i < 46; i++) s += '<circle cx="' + (rnd() * 100).toFixed(2) + '%" cy="' + (rnd() * 100).toFixed(2) + '%" r="' + (0.6 + rnd() * 1.1).toFixed(2) + '" opacity="' + (0.35 + rnd() * 0.6).toFixed(2) + '"/>';
    return s; })();
  // colour: the hours mixed in OKLab, so a sky turns the way light does
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
  var mix = function (a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };
  // the hours, each a keyframe: the sky's top, middle and horizon; the far, middle and near layers; the share of windows
  // lit; the sun and the moon as [x, y, opacity] in fractions of the window; the stars. A switch starts from the page
  // it covers (morning matches the light page, night the dark one).
  var NIGHT = { sky: ["#060a08", "#0c1511", "#2a3b33"], land: ["#18251f", "#111b16", "#0b120e"] };
  var MORNING = { sky: ["#d9eae3", "#eaf2ee", "#f4f3ec"], land: ["#ccdad2", "#afc4b7", "#92aa9b"] };
  var HOURS = {
    // to light: night, the hour before dawn, sunrise, morning
    dawn: [
      { at: 0, sky: NIGHT.sky, land: NIGHT.land, lit: 0.86, sun: [0.16, 1.12, 0], moon: [0.66, 0.24, 1], stars: 1 },
      { at: 0.38, sky: ["#121c20", "#26343a", "#5e6b6a"], land: ["#2a3833", "#1e2a26", "#141e1a"], lit: 0.55, sun: [0.18, 1.04, 0.9], moon: [0.78, 0.42, 0.75], stars: 0.35 },
      { at: 0.68, sky: ["#6f8a8c", "#b4bfb3", "#efd6b3"], land: ["#7f938a", "#5f7168", "#44534b"], lit: 0.12, sun: [0.24, 0.6, 1], moon: [0.88, 0.66, 0], stars: 0 },
      { at: 1, sky: MORNING.sky, land: MORNING.land, lit: 0, sun: [0.3, 0.3, 1], moon: [0.94, 0.8, 0], stars: 0 },
    ],
    // to dark: day, the golden hour, dusk, night
    dusk: [
      { at: 0, sky: MORNING.sky, land: MORNING.land, lit: 0, sun: [0.66, 0.28, 1], moon: [0.16, 1.12, 0], stars: 0 },
      { at: 0.3, sky: ["#aebfbf", "#d7d0bf", "#eed3ad"], land: ["#a2a493", "#7b7f71", "#5a5f54"], lit: 0.08, sun: [0.74, 0.58, 1], moon: [0.16, 1.06, 0], stars: 0 },
      { at: 0.66, sky: ["#253039", "#46505a", "#a68b75"], land: ["#3a4440", "#29322e", "#1c2421"], lit: 0.6, sun: [0.8, 0.98, 0.9], moon: [0.2, 0.62, 0.8], stars: 0.25 },
      { at: 1, sky: NIGHT.sky, land: NIGHT.land, lit: 0.86, sun: [0.84, 1.12, 0], moon: [0.3, 0.26, 1], stars: 1 },
    ],
  };
  Object.keys(HOURS).forEach(function (k) { HOURS[k].forEach(function (f) { f.skyL = f.sky.map(lab); f.landL = f.land.map(lab); }); });
  function Sky(to) {
    var hours = HOURS[to === "dark" ? "dusk" : "dawn"];
    var root = el("div", "loader-sky");
    root.setAttribute("data-theme", to);
    var land = function (cls, inner) { return '<svg class="ls-layer ' + cls + '" viewBox="0 140 1600 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">' + inner + "</svg>"; };
    root.innerHTML = '<div class="ls-sky"></div><svg class="ls-stars" aria-hidden="true" focusable="false"><g>' + STARS + '</g></svg><div class="ls-orbs"><div class="ls-sun"></div><div class="ls-moon"></div></div>' +
      '<div class="ls-land">' + land("ls-back", LAND_BACK) + land("ls-mid", LAND_MID) + land("ls-front", LAND_FRONT) + "</div>";
    var sun = root.querySelector(".ls-sun"), moon = root.querySelector(".ls-moon"), layers = [].slice.call(root.querySelectorAll(".ls-layer"));
    // the windows light in a fixed, scattered order
    var order = [].slice.call(root.querySelectorAll(".w")).map(function (w, i) { return [((i * 7919) % 31) / 31 + (i % 3) * 0.013, w]; }).sort(function (a, b) { return a[0] - b[0]; }).map(function (x) { return x[1]; });
    var lastLit = -1;
    var I = { el: root, minRun: 900, minShow: 1000, maxWait: 4000 };
    I.render = function (p) {
      var i = 0; while (i < hours.length - 2 && p > hours[i + 1].at) i++;
      var a = hours[i], b = hours[i + 1], t = clamp((p - a.at) / (b.at - a.at), 0, 1), w = vw(), h = vh();
      t = t * t * (3 - 2 * t);
      for (var j = 0; j < 3; j++) {
        root.style.setProperty("--sky-" + j, css(mix(a.skyL[j], b.skyL[j], t)));
        var ground = mix(a.landL[j], b.landL[j], t);
        root.style.setProperty("--l-" + j, css(ground));
        root.style.setProperty("--w-" + j, css([ground[0] - 0.07, ground[1], ground[2]]));
      }
      root.style.setProperty("--stars", String(lerp(a.stars, b.stars, t)));
      var place = function (n, A, B, tilt) { n.style.transform = "translate(" + (lerp(A[0], B[0], t) * w).toFixed(1) + "px," + (lerp(A[1], B[1], t) * h).toFixed(1) + "px)" + tilt; n.style.opacity = String(lerp(A[2], B[2], t)); };
      place(sun, a.sun, b.sun, ""); place(moon, a.moon, b.moon, " rotate(-18deg)");
      var n = Math.round(lerp(a.lit, b.lit, t) * order.length);
      if (n !== lastLit) { order.forEach(function (wn, k) { wn.classList.toggle("on", k < n); }); lastLit = n; }
    };
    // under reduced motion the town stands at once, at the hour it is going to
    I.still = function () { root.classList.add("is-still"); };
    I.cover = function (M, done) {
      M.animate(root.querySelectorAll(".ls-sky, .ls-stars, .ls-orbs"), { opacity: [0, 1] }, { duration: 0.32, ease: "linear" });
      // the layers rise like a pop-up page, far to near (a spring of stiffness 220, damping 26, mass 1)
      layers.forEach(function (n, k) { M.animate(n, { y: ["100%", "0%"] }, { delay: 0.04 + k * 0.07, type: "spring", stiffness: 220, damping: 26, mass: 1 }); });
      setTimeout(done, 420);
    };
    I.exit = function (M, done) {
      root.style.pointerEvents = "none";
      // into the town: the near layer passes first, the far one last, as the sky clears to the page
      var dive = function (d, delay, fade) { return { duration: d, delay: delay, ease: [0.55, 0, 0.3, 1], opacity: { duration: fade, delay: delay + 0.08, ease: [0.4, 0, 1, 1] } }; };
      M.animate(layers[2], { scale: 1.7, y: "8%", opacity: 0 }, dive(0.62, 0, 0.34));
      M.animate(layers[1], { scale: 1.32, opacity: 0 }, dive(0.66, 0.04, 0.4));
      M.animate(layers[0], { scale: 1.14, opacity: 0 }, dive(0.7, 0.08, 0.46));
      M.animate(root.querySelectorAll(".ls-sky, .ls-stars, .ls-orbs"), { opacity: 0 }, { duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.6, 1] });
      setTimeout(done, 780);
    };
    return I;
  }

  /* ---------- running it ---------- */
  var L = null, raf = 0;
  function mount(I, kind) {
    if (L && L.el.parentNode) L.el.parentNode.removeChild(L.el);
    L = I; L.kind = kind; L.lastT = 0;
    L.el.classList.add("loader");
    if (kind === "load") {
      // said once: the region is filled after it is in the page, so screen readers hear it
      var st = el("span", "sr-only"); st.setAttribute("role", "status"); L.el.appendChild(st);
      setTimeout(function () { st.textContent = "Loading Smart-Clearance"; }, 80);
    } else L.el.setAttribute("aria-hidden", "true");
    (D.body || H).appendChild(L.el);
    L.render(reduce ? 1 : 0);
  }
  function loop(t) {
    raf = 0; if (!L || L.leaving) return;
    var dt = L.lastT ? Math.min(64, t - L.lastT) : 16; L.lastT = t;
    var age = t - LOAD.t0;
    if (L.kind === "load") {
      // the first screen can be read: the document and its stylesheets in, and its faces (or 2.5 s)
      if (!LOAD.marks.sheets && sheetsIn()) LOAD.mark("sheets");
      if (!LOAD.marks.fonts && age > FACES) LOAD.mark("fonts");
      if (!L.slowed && age > 3000 && !LOAD.complete()) { L.slowed = true; L.slow(); }
      if (!LOAD.done && ((LOAD.complete() && (reduce || age >= L.minShow)) || age > L.maxWait)) finish();
      if (L && !L.leaving) raf = W.requestAnimationFrame(loop);
      return;
    }
    var done = LOAD.complete(), aim;
    if (done) aim = 1;
    else {
      // between milestones it creeps into what is still to come, so it never looks stuck, and never reaches it
      var pend = 0, w = LOAD.weights; for (var k in w) pend += w[k] * (1 - (LOAD.marks[k] || 0));
      aim = Math.min(0.96, LOAD.target + pend * 0.4 * (1 - Math.exp(-(t - LOAD.last) / 1600)));
    }
    if (L.minRun && !reduce) aim = Math.min(aim, (t - (L.runFrom || LOAD.t0)) / L.minRun);
    // it follows the load closely, and once everything is in it closes the last gap quickly
    var s = reduce ? aim : LOAD.shown + (aim - LOAD.shown) * (1 - Math.exp(-dt / (done ? 80 : 190)));
    if (aim >= 1 && aim - s < 0.01) s = 1;
    if (s > LOAD.shown) LOAD.shown = s;
    L.render(reduce ? 1 : LOAD.shown);
    if (!LOAD.done && ((LOAD.shown >= 1 && (reduce || age >= L.minShow)) || age > L.maxWait)) finish();
    if (L && !L.leaving) raf = W.requestAnimationFrame(loop);
  }
  function run() { if (!raf) raf = W.requestAnimationFrame(loop); }
  // the animate() the exits run on: one the page gives it (motion's, in the SvelteKit build), or Framer Motion's
  function motion() { var a = LOAD.animate || (W.Motion && W.Motion.animate); return a ? { animate: a } : null; }
  function finish() {
    LOAD.done = true; var I = L; I.leaving = true;
    var end = function () {
      if (I.el.parentNode) I.el.parentNode.removeChild(I.el);
      if (L === I) L = null;
      if (I.kind === "load") lift();
      LOAD.busy = false;
      if (I.resolve) I.resolve();
    };
    var M = motion();
    // under reduced motion the page is simply there; without an animate() (the scripts never came) the loader fades out
    if (reduce) { end(); return; }
    if (I.kind === "load") { I.exit(M, end); return; }
    if (!M) { I.el.style.transition = "opacity 240ms ease"; I.el.style.opacity = "0"; setTimeout(end, 260); return; }
    I.exit(M, end);
  }
  function lift() {
    LOAD.lifted = true;
    var busy = D.querySelector("[aria-busy][data-loader-busy]"); if (busy) { busy.removeAttribute("aria-busy"); busy.removeAttribute("data-loader-busy"); }
    try { W.sessionStorage.setItem("sc3-loaded", "1"); } catch (e) { /* storage blocked */ }
    W.dispatchEvent(new W.CustomEvent("sc3:loader-lifted"));
  }

  // a switch: cover the page as it is, change the theme underneath, wait for the new plates, part into the page
  function preload(to) {
    var base = W.SC3_SITE_IMG || "assets/plates/", list = [["town-" + (to === "dark" ? "night" : "morning") + ".webp", true]];
    // the table too, when it is on screen or close to it
    [[".tb-plate", "table"]].forEach(function (q) {
      var n = D.querySelector(q[0]); if (!n) return; var r = n.getBoundingClientRect();
      if (r.bottom > -vh() * 0.5 && r.top < vh() * 1.5) list.push([q[1] + (to === "dark" ? "-night" : "") + ".webp", false]);
    });
    if (W.SC3_PLATE_URL) list = list.map(function (f) { return [W.SC3_PLATE_URL(f[0]) || base + f[0], f[1], true]; });
    var left = list.length;
    list.forEach(function (f) {
      var im = new Image(); if (f[1]) im.crossOrigin = "anonymous"; im.decoding = "async"; im.src = f[2] ? f[0] : base + f[0];
      var ok = function () { left -= 1; LOAD.mark("plate", 1 - left / list.length); };
      (im.decode ? im.decode() : new Promise(function (r) { im.onload = r; im.onerror = r; })).then(ok, ok);
    });
  }
  // the theme's gate: o.to is the theme to go to, o.apply changes it. Resolves once the loader has gone.
  LOAD.switchTheme = function (o) {
    return new Promise(function (resolve) {
      var from = themeNow();
      if (o.to === from || LOAD.busy) { o.apply(); resolve(); return; }
      begin("switch", SWITCH, { to: o.to, from: from });
      LOAD.busy = true; preload(o.to);
      mount(Sky(o.to), "switch"); L.resolve = resolve;
      var covered = function () {
        o.apply();
        LOAD.mark("cover"); L.runFrom = now();
        // the town says when it has drawn the new plate; if the town is not there to say, a second will do
        setTimeout(function () { if (LOAD.kind === "switch") LOAD.mark("drawn"); }, 1200);
      };
      var M = motion();
      if (reduce || !M) { L.still(); covered(); run(); return; }
      L.cover(M, covered); run();
    });
  };

  // a load, from the first paint: a later load in the same session plays the route's shorter version
  var again = (function () { try { return W.sessionStorage.getItem("sc3-loaded") === "1"; } catch (e) { return false; } })();
  begin("load", FIRST);
  LOAD.busy = true;
  mount(Route(themeNow()), "load");
  if (again) L.minShow *= 0.5;
  run();

  // what the page tells the loader as it loads: the document, then the faces the first screen sets its words in
  var ready = function () {
    LOAD.mark("doc");
    // the page is busy until the loader lifts: the app's root, as the site or the SvelteKit build names it
    var root = D.getElementById("root") || D.querySelector(".site-root");
    if (root && !LOAD.lifted) { root.setAttribute("aria-busy", "true"); root.setAttribute("data-loader-busy", ""); }
  };
  if (D.readyState === "loading") D.addEventListener("readystatechange", function once() { if (D.readyState !== "loading") { D.removeEventListener("readystatechange", once); ready(); } });
  else ready();
  var fonts = D.fonts && D.fonts.load ? Promise.all(['780 62px "Bricolage Grotesque Variable", "Bricolage Grotesque"', '400 15px "Geist Variable", Geist', '600 15px "Geist Variable", Geist'].map(function (f) { return D.fonts.load(f); })) : Promise.resolve();
  fonts.then(function () { LOAD.mark("fonts"); }, function () { LOAD.mark("fonts"); });
})();
