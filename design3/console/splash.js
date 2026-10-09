// Smart-Clearance v3 · the console's splash (SC-51; SC-131, option B, the route runs). Plain ES2019, loaded first in
// <body>, before React or SvelteKit. It brings its own styles (the inks, the faces, the mark), so it paints with the
// page's first bytes, before any stylesheet has arrived. One surface answers the console's three waits:
//   · the first load (boot): the console's code arriving, then the session, the platform's config and its catalog;
//   · signing in (enter): the console's first reads after "Welcome, <name>";
//   · signing out (leave): the session closing on the platform and in Firebase.
// The mark is the loader: its route stands faint and a bright stretch of it runs from the godown dot to the pin, a lap
// every 1.15 s, the pin throbbing as each lap arrives. One title and one line say what it waits for (the console, then
// the platform, then waking it); past 3 s a quiet line says the connection is slow. A download still arriving is never
// a failure: the splash says the console did not answer only when the app says a read failed, the device goes offline,
// a file fails to load, or nothing has answered for 20 s. Everything in, the last lap draws the whole route and stays,
// the pin pings once, the mark flies to where the page keeps its mark and its squircle opens into a window onto the page
// (the landing page's loader, SC-35). It shows for at least 1.25 s on a first load and 0.9 s otherwise. Only the splash
// moves, and only while something loads (WCAG 2.2.2); under reduced motion the route stands whole and still and the
// words carry the wait. The page talks to it through window.SC3_SPLASH: begin(kind, opts) · phase(name) · reads(list) ·
// mark(id) · say({ title, sub, brand }) · open({ anchor }) · fail({ title, text }) · animate (motion's, given by the
// app). A client's workspace uses the same splash in its own words (SC-73): it sets window.SC3_SPLASH_SETUP before this
// script ({ cls, brand, words, reads, slow }); the console sets nothing.
(function () {
  "use strict";
  var D = document, H = D.documentElement, W = window;
  if (W.SC3_SPLASH) return;
  var SET = W.SC3_SPLASH_SETUP || {};
  var reduce = !!(W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var now = function () { return W.performance.now(); };
  function el(tag, cls, html) { var e = D.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // the reader's appearance before the first paint (sc3-theme, as the kit keeps it), when the page has not set it yet
  if (!H.hasAttribute("data-theme")) {
    var mode = null; try { mode = W.localStorage.getItem("sc3-theme"); } catch (e) { /* storage blocked */ }
    H.setAttribute("data-theme", mode === "dark" || (mode !== "light" && !!(W.matchMedia && W.matchMedia("(prefers-color-scheme: dark)").matches)) ? "dark" : "light");
  }

  /* ---------- its own styles: design system v3's inks and faces, written out, so nothing waits for a stylesheet ---------- */
  var DISPLAY = '"Bricolage Grotesque Variable", "Bricolage Grotesque", "Geist Variable", "Geist", system-ui, sans-serif';
  var UI = '"Geist Variable", "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  // the design system's spring (tokens.css --ease-spring, one 10% overshoot): the mark springs in on it, as in SC-35 and SC-51
  var SPRING = "linear(0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.723 12.9%, 0.938 16.7%, 1.017 19.4%, 1.067, 1.099 24.3%, 1.108 26%, 1.1, 1.074 31.1%, 1.008 38.1%, 0.983 42.5%, 0.979 45.6%, 0.985 50%, 1.001 59.9%, 1.002 70.2%, 1)";
  var CSS = [
    ".cs-splash{--sp-bg:#f2f6f3;--sp-a1:#d9f0e3;--sp-a2:#e2eef7;--sp-fg:#0d1c15;--sp-fg2:#45554d;--sp-fg3:#5f6e67;--sp-fill:rgb(17 41 30/.075);--sp-green:#167a52;--sp-on-green:#fff;",
    "position:fixed;inset:0;z-index:80;display:grid;place-items:center;overflow:hidden;color:var(--sp-fg);font:400 15px/1.5 " + UI + ";-webkit-font-smoothing:antialiased;opacity:0;transition:opacity 320ms linear}",
    ":root[data-theme=dark] .cs-splash{--sp-bg:#070b09;--sp-a1:rgb(22 122 82/.34);--sp-a2:rgb(16 112 150/.22);--sp-fg:#ecf2ee;--sp-fg2:#a7b4ad;--sp-fg3:#82908a;--sp-fill:rgb(214 255 232/.08);--sp-green:#3ccb8a;--sp-on-green:#03170d}",
    ".cs-splash.in,.cs-splash.still{opacity:1}.cs-splash.boot,.cs-splash.still{transition:none}",
    ".cs-sp-cover{position:absolute;inset:0;background:radial-gradient(48% 46% at 18% 4%,var(--sp-a1),transparent 70%),radial-gradient(42% 40% at 84% 0%,var(--sp-a2),transparent 70%),var(--sp-bg)}",
    ".cs-sp-lock{position:relative;z-index:1;display:grid;justify-items:center;gap:26px;width:min(560px,calc(100% - 40px));text-align:center}",
    ".cs-sp-mkbox{display:grid;will-change:transform}",
    ".cs-sp-mk{display:block;width:112px;height:112px;overflow:visible}",
    ".cs-sp-mk .sq,.cs-sp-mk circle{transform-box:fill-box;transform-origin:center}",
    // the route: faint, and a stretch of it (three tenths) running the S from the godown dot to the pin, a lap every
    // 1.15 s, easing out of the dot and into the pin, which throbs as the stretch arrives
    ".cs-sp-mk .ghost{opacity:.3}.cs-sp-mk .run{stroke-dasharray:.3 1.4;stroke-dashoffset:.3}",
    ".cs-splash.running .cs-sp-mk .run{animation:cs-sp-run 1.15s cubic-bezier(.45,0,.55,1) 320ms infinite}",
    ".cs-splash.running .cs-sp-mk .pin{animation:cs-sp-throb 1.15s cubic-bezier(.45,0,.55,1) 320ms infinite}",
    "@keyframes cs-sp-run{from{stroke-dashoffset:.3}to{stroke-dashoffset:-1}}",
    "@keyframes cs-sp-throb{0%,70%{transform:scale(1)}82%{transform:scale(1.38)}100%{transform:scale(1)}}",
    ".cs-splash.drawn .cs-sp-mk .ghost{opacity:0;transition:opacity 380ms linear}",
    ".cs-sp-mk .ping{opacity:0}.cs-splash.landed .cs-sp-mk .ping{animation:cs-sp-ping 900ms ease-out both}",
    "@keyframes cs-sp-ping{from{opacity:.9;transform:scale(.6)}to{opacity:0;transform:scale(2.3)}}",
    ".cs-splash.boot .cs-sp-mkbox{animation:cs-sp-pop 560ms " + SPRING + " backwards}",
    "@keyframes cs-sp-pop{from{opacity:0;transform:scale(.55)}}",
    // the words: the brand, a title that holds, one line that says what it waits for, and the slow line
    ".cs-sp-words{display:grid;justify-items:center;gap:8px}",
    ".cs-splash.go .cs-sp-words{animation:cs-sp-rise 420ms cubic-bezier(.22,1,.36,1) 120ms backwards}",
    "@keyframes cs-sp-rise{from{opacity:0;transform:translateY(10px)}}",
    ".cs-sp-brand{display:inline-flex;align-items:baseline;gap:10px;color:var(--sp-fg2)}",
    ".cs-sp-wm{font:750 24px/1.1 " + DISPLAY + ";letter-spacing:-.03em;font-variation-settings:'opsz' 48;white-space:nowrap;color:var(--sp-fg)}",
    ".cs-sp-console{font:600 12.5px/1 " + UI + ";letter-spacing:.08em;text-transform:uppercase;color:var(--sp-fg2);padding:5px 8px 4px;border-radius:999px;background:var(--sp-fill)}",
    ".cs-sp-title{margin:4px 0 0;font:760 clamp(30px,4.2vw,44px)/1.04 " + DISPLAY + ";letter-spacing:-.03em;font-variation-settings:'opsz' 96;color:var(--sp-fg);text-wrap:balance}",
    ".cs-sp-sub{margin:0;min-height:1.5em;font-size:15.5px;color:var(--sp-fg2);text-wrap:balance}.cs-sp-sub:empty{display:none}",
    ".cs-sp-slow{margin:6px 0 0;display:inline-flex;align-items:center;gap:8px;min-height:30px;padding:0 12px;border-radius:999px;background:var(--sp-fill);font-size:13.5px;color:var(--sp-fg2);opacity:0;transform:translateY(6px);transition:opacity 240ms linear,transform 240ms cubic-bezier(.22,1,.36,1)}",
    ".cs-sp-slow i{width:7px;height:7px;border-radius:50%;background:var(--sp-fg3)}",
    ".cs-splash.slow .cs-sp-slow{opacity:1;transform:none}.cs-splash.opening .cs-sp-slow,.cs-splash.landed .cs-sp-slow,.cs-splash.failed .cs-sp-slow{opacity:0}",
    ".cs-sp-retry{margin-top:12px;min-height:44px;padding:0 18px;border:0;border-radius:12px;font:600 15px/1 " + UI + ";color:var(--sp-on-green);background:var(--sp-green);cursor:pointer}",
    ".cs-sp-retry:focus-visible{outline:3px solid var(--sp-green);outline-offset:2px}",
    ".cs-sp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
    // a client's workspace (SC-68 option B): its own mark and name over a smaller title
    ".cs-splash.ws .cs-sp-lock{gap:18px;width:min(420px,calc(100% - 40px))}.cs-splash.ws .cs-sp-mk{width:104px;height:104px}",
    ".cs-splash.ws .cs-sp-words{gap:10px;margin-top:4px}.cs-splash.ws .cs-sp-brand{align-items:center;gap:8px;min-height:22px;font-size:14px;font-weight:600}",
    ".cs-splash.ws .cs-sp-brand svg{flex:none}.cs-splash.ws .cs-sp-title{font-weight:700;font-size:30px;line-height:1.1;letter-spacing:-.025em;font-variation-settings:'opsz' 60}",
    ".cs-splash.ws .cs-sp-sub{font-size:15px}",
    // the page behind: a touch smaller and out of focus while covered, forward as the window opens
    ".app-root{transform-origin:50% 40%;transition:transform 740ms cubic-bezier(.7,0,.2,1),filter 740ms cubic-bezier(.7,0,.2,1)}",
    ".cs-covered .app-root{transform:scale(.985);filter:blur(6px);transition-duration:320ms,320ms}",
    "@media (max-width:599px){.cs-sp-mk{width:84px;height:84px}.cs-sp-wm{font-size:20px}.cs-sp-lock{gap:20px}}",
    "@media (prefers-reduced-motion:reduce){.cs-splash *,.cs-splash{animation:none!important;transition:none!important}.app-root{transition:none}.cs-covered .app-root{transform:none;filter:none}}",
    ".cs-splash.still .cs-sp-mk .run{stroke-dasharray:1 1;stroke-dashoffset:0}.cs-splash.still .cs-sp-mk .ghost{opacity:0}"
  ].join("");
  if (!D.getElementById("sc3-splash-css")) { var st = el("style"); st.id = "sc3-splash-css"; st.textContent = CSS; (D.head || H).appendChild(st); }

  // what each wait reads, and how long its cover stays at the least
  var READS = {
    boot: [{ id: "session", label: "Who is signed in" }, { id: "config", label: "The platform" }, { id: "catalog", label: "The agents" }],
    enter: [{ id: "clients", label: "Your clients" }, { id: "dashboard", label: "Today" }, { id: "batches", label: "The batches" }, { id: "runs", label: "The agents" }],
    leave: [{ id: "session-end", label: "Closing your session" }, { id: "firebase", label: "Signed out" }],
  };
  if (SET.reads) for (var rk in SET.reads) READS[rk] = SET.reads[rk];
  var MIN = { boot: 1250, enter: 900, leave: 900 }, SLOW = 3000, WAKE = 2600, SILENT = 20000;
  var greet = function (name) { var h = new Date().getHours(); var g = h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; return name ? g + ", " + name : g; };
  var today = function () { return new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); };
  // the words: a title that holds, and one line for what it waits for now (the code, the platform, waking it, opening)
  var WORDS = {
    boot: { title: "Opening the console", line: { code: "Loading the console", platform: "Connecting to the platform", wake: "Waking the platform up…", open: "Opening" }, say: "Opening the console." },
    enter: { title: function (who) { return greet(who); }, line: { platform: function () { return today() + " · opening your console"; } }, say: function (who) { return "Signed in. Opening the console" + (who ? " for " + who : "") + "."; } },
    leave: { title: "Signing you out", line: { platform: function (who) { return who ? "Until next time, " + who + "." : "Until next time."; } }, done: "Signed out", say: "Signing you out.", said: "Signed out." },
    fail: {
      title: "The console did not answer", text: "Nothing has come back from the platform for {silent} s. Check the connection, then try again.",
      offline: { title: "No connection", text: "This device has gone offline. Check the connection, then try again." },
      broken: { title: "The console did not load", text: "Part of it did not arrive. Check the connection, then try again." },
    },
    slow: "Slow connection · still loading",
  };
  // a workspace's words replace the console's; one that gives a single line (sub) has no phases of its own
  if (SET.words) for (var wk in SET.words) {
    var mine = SET.words[wk];
    WORDS[wk] = typeof WORDS[wk] === "object" && typeof mine === "object" ? Object.assign({}, WORDS[wk], mine) : mine;
    if (mine && typeof mine === "object" && mine.sub !== undefined && mine.line === undefined) WORDS[wk].line = null;
  }
  var pick = function (v, who) { return typeof v === "function" ? v(who) : v; };
  var esc = function (v) { return String(v == null ? "" : v).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  // the brand line: the console's wordmark, or a workspace's own mark and name ({ id, name, mark }), as the kit's
  // WorkspaceMark draws it: its colours in the tile, Munchly's m with a bite out of the corner, else its initial
  var CONSOLE = '<span class="cs-sp-wm">Smart‑Clearance</span><span class="cs-sp-console">Console</span>';
  function brandOf(b) {
    if (b == null) return CONSOLE;
    if (typeof b === "string") return b;
    var c = b.mark || { from: "#5f6e67", to: "#45554d", ink: "#ffffff" }, m = b.id === "munchly", g = "cs-sp-wm";
    return '<svg width="22" height="22" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs><linearGradient id="' + g + 'g" x1="6" y1="2" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="' + esc(c.from) + '"/><stop offset="1" stop-color="' + esc(c.to) + '"/></linearGradient>' +
      (m ? '<mask id="' + g + 'm"><rect width="64" height="64" fill="#fff"/><circle cx="59" cy="5" r="9" fill="#000"/><circle cx="47" cy="2.5" r="5.5" fill="#000"/><circle cx="61.5" cy="17" r="5.5" fill="#000"/></mask>' : "") + "</defs>" +
      '<path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill="url(#' + g + 'g)"' + (m ? ' mask="url(#' + g + 'm)"' : "") + "/>" +
      (m ? '<path d="M18 45V33.5a7 7 0 0 1 14 0V45M32 33.5a7 7 0 0 1 14 0V45" fill="none" stroke="' + esc(c.ink) + '" stroke-width="6.6" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<text x="32" y="43" text-anchor="middle" fill="' + esc(c.ink) + '" style="font: 700 30px ' + esc(UI).replace(/&quot;/g, "'") + '">' + esc((b.name || "?").slice(0, 1)) + "</text>") +
      "</svg><span>" + esc(b.name) + "</span>";
  }

  // the mark: the green squircle, its route faint with a stretch running it, the godown dot and the amber pin
  var S_PATH = "M43.5 19H27a7 7 0 0 0 0 14h10a7 7 0 0 1 0 14H20.5";
  var MARK = '<svg class="cs-sp-mk" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="cs-sp-g" x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2fbf7f"/><stop offset="0.55" stop-color="#178258"/><stop offset="1" stop-color="#0d5a3e"/></linearGradient>' +
    '<linearGradient id="cs-sp-h" x1="32" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
    '<g class="sq"><path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill="url(#cs-sp-g)"/><path d="M32 3C10.5 3 3 10.5 3 31.5 10 22 22 18 32 18s22 4 29 13.5C61 10.5 53.5 3 32 3Z" fill="url(#cs-sp-h)"/></g>' +
    '<path class="ghost" d="' + S_PATH + '" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path class="run" d="' + S_PATH + '" pathLength="1" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="43.5" cy="19" r="3.4" fill="#0d5a3e" stroke="#fff" stroke-width="2.6"/>' +
    '<circle class="ping" cx="20.5" cy="47" r="5" fill="none" stroke="#f7c04a" stroke-width="2"/>' +
    '<circle class="pin" cx="20.5" cy="47" r="5.2" fill="#f7c04a" stroke="#fff" stroke-width="2.2"/></svg>';
  // the squircle as a path centred on (cx, cy) at k px a unit, and the unit size at which it covers w × h from there
  var SQ = [[32, 2], [9.5, 2], [2, 9.5], [2, 32], [2, 54.5], [9.5, 62], [32, 62], [54.5, 62], [62, 54.5], [62, 32], [62, 9.5], [54.5, 2], [32, 2]];
  function squircle(cx, cy, k) {
    var p = SQ.map(function (q) { return (cx + (q[0] - 32) * k).toFixed(1) + " " + (cy + (q[1] - 32) * k).toFixed(1); });
    return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3] + "C" + p[4] + " " + p[5] + " " + p[6] + "C" + p[7] + " " + p[8] + " " + p[9] + "C" + p[10] + " " + p[11] + " " + p[12] + "Z";
  }
  function coverK(cx, cy, w, h) { return Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy)) / 30 * 1.04; }

  var S = W.SC3_SPLASH = { reduce: reduce, animate: null, active: null, lifted: false, behind: ".app-root", brand: null };
  var I = null, timer = 0;

  /* ---------- the files and stylesheets the page is waiting for ---------- */
  // the latest moment anything arrived (a script, a stylesheet, a font, a read), so a slow download is never taken for
  // a silent platform; a stylesheet's arrival also tells the cover the page behind it can be shown styled
  var arrived = now();
  try {
    new W.PerformanceObserver(function (list) { if (list.getEntries().length) arrived = now(); }).observe({ type: "resource", buffered: true });
  } catch (e) { /* no resource timing: the reads still count */ }
  function sheetsIn() {
    // a stylesheet still on its way may be a preload that becomes a stylesheet once it has loaded (SC-131)
    var links = D.querySelectorAll('link[rel~="stylesheet"], link[rel="preload"][as="style"]');
    for (var i = 0; i < links.length; i++) if (!(links[i].rel.indexOf("stylesheet") >= 0 && links[i].sheet) && !links[i].dataset.failed) return false;
    return true;
  }
  // a file that failed to arrive: a script or a stylesheet, or one of the app's modules imported later
  D.addEventListener("error", function (e) {
    var t = e.target; if (!t || (t.tagName !== "SCRIPT" && t.tagName !== "LINK")) return;
    if (t.tagName === "LINK") { t.dataset.failed = "1"; if (!/stylesheet|modulepreload/.test(t.rel || "") && t.getAttribute("as") !== "style") return; }
    if (I && !I.gone) S.fail(WORDS.fail.broken);
  }, true);
  W.addEventListener("unhandledrejection", function (e) {
    var m = String((e.reason && e.reason.message) || e.reason || "");
    if (I && !I.gone && /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(m)) S.fail(WORDS.fail.broken);
  });
  W.addEventListener("offline", function () { if (I && !I.gone && !I.opening) S.fail(WORDS.fail.offline); });

  /* ---------- the cover ---------- */
  function build(kind, o) {
    var who = o.who || "", w = WORDS[kind] || {};
    var root = el("div", "cs-splash " + kind + (SET.cls ? " " + SET.cls : "") + (reduce ? " still" : " running"));
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = '<div class="cs-sp-cover"></div><div class="cs-sp-lock"><div class="cs-sp-mkbox">' + MARK + '</div>' +
      '<div class="cs-sp-words"><span class="cs-sp-brand">' + brandOf(o.brand != null ? o.brand : S.brand != null ? S.brand : SET.brand) + '</span><p class="cs-sp-title"></p><p class="cs-sp-sub"></p>' +
      '<p class="cs-sp-slow"><i aria-hidden="true"></i><span></span></p></div></div>';
    var status = el("span", "cs-sp-sr"); status.setAttribute("role", "status"); status.setAttribute("aria-hidden", "false");
    root.appendChild(status);
    var title = o.title != null ? o.title : pick(w.title, who);
    root.querySelector(".cs-sp-title").textContent = title || "";
    root.querySelector(".cs-sp-slow span").textContent = SET.slow || WORDS.slow;
    var it = { el: root, kind: kind, who: who, words: w, status: status, t0: now(), reads: [], mk: root.querySelector(".cs-sp-mkbox"), run: root.querySelector(".run"),
      sub: root.querySelector(".cs-sp-sub"), subFixed: o.sub != null, phase: null, since: now(), answered: now(), minShow: o.minShow || MIN[kind], opening: false, gone: false };
    if (o.sub != null) it.sub.textContent = o.sub;
    // the reads, named; those already in keep their place (a page may name more once it knows who is in)
    it.setReads = function (list) {
      var landed = it.reads.filter(function (r) { return r.at != null; });
      var next = (list || []).filter(function (r) { return !landed.some(function (x) { return x.id === r.id; }); }).map(function (r) { return { id: r.id, label: r.label, at: null }; });
      it.reads = landed.concat(next);
    };
    it.done = function () { return it.reads.every(function (r) { return r.at != null; }); };
    // a phase changes the line under the title, unless the page has given its own
    it.setPhase = function (name) {
      if (it.phase === name) return;
      it.phase = name; it.since = now(); if (name === "platform") it.answered = Math.max(it.answered, now());
      var line = w.line ? w.line[name] : null;
      if (line == null && w.sub != null && name !== "open") line = w.sub;
      if (line != null && !it.subFixed) it.sub.textContent = pick(line, who) || "";
    };
    setTimeout(function () { status.textContent = pick(w.say, who) || ""; }, 80);
    return it;
  }
  function behind() { return D.querySelector(S.behind); }
  function cover(on) {
    var b = behind(); H.classList.toggle("cs-covered", on);
    if (!b) return;
    if (on) { b.setAttribute("inert", ""); b.setAttribute("aria-busy", "true"); } else { b.removeAttribute("inert"); b.removeAttribute("aria-busy"); }
  }
  // every tenth of a second while a cover is up: the slow line, waking the platform, silence, and whether it can open
  function check() {
    var it = I; if (!it || it.gone) { stop(); return; }
    if (it.opening) return;
    var t = now(), age = t - it.t0;
    // a cover that said something did not answer still opens if everything arrives after all
    if (it.failed) { if (it.wanted && it.done() && sheetsIn()) start(it); return; }
    if (!it.slow && age > SLOW && !(it.wanted && it.done())) { it.slow = true; it.el.classList.add("slow"); }
    if (it.kind === "boot" && it.phase === "platform" && !it.done() && t - it.since > WAKE) it.setPhase("wake");
    // silence: nothing arrived and nothing answered for 20 s while something is still out
    var out = !it.done() || !it.wanted;
    if (out && t - Math.max(it.answered, arrived, it.t0) > SILENT) { S.fail({}); return; }
    if (it.wanted && it.done() && age >= it.minShow && (sheetsIn() || age > 15000)) start(it);
  }
  function run() { if (!timer) timer = W.setInterval(check, 100); }
  function stop() { if (timer) { W.clearInterval(timer); timer = 0; } }
  // the app's code is running once it speaks to the splash: the first load moves on from loading the console
  function heard(it) { it.answered = now(); if (it.kind === "boot" && it.phase === "code") it.setPhase("platform"); }

  /* ---------- what the page asks ---------- */
  // begin a wait: the cover comes in (at once on a first load, over 320 ms otherwise) and the mark may arrive from the
  // sign-in card's mark (opts.from, a rect); resolves once the cover is in, so the page behind can change under it
  S.begin = function (kind, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      if (I && !I.gone) { I.el.parentNode && I.el.parentNode.removeChild(I.el); I.gone = true; }
      var it = I = build(kind, opts); S.active = kind;
      it.setReads(opts.reads || READS[kind]);
      it.setPhase(kind === "boot" ? "code" : "platform");
      (D.body || H).appendChild(it.el);
      cover(true);
      var a = S.animate;
      if (opts.from && a && !reduce) {
        var r = it.mk.getBoundingClientRect(), dx = opts.from.left + opts.from.width / 2 - (r.left + r.width / 2), dy = opts.from.top + opts.from.height / 2 - (r.top + r.height / 2), sc = opts.from.width / r.width;
        a(it.mk, { x: [dx, 0], y: [dy, 0], scale: [sc, 1] }, { type: "spring", stiffness: 260, damping: 28, mass: 1 });
      }
      W.requestAnimationFrame(function () { it.el.classList.add("go"); });
      run();
      if (kind === "boot" || reduce) { it.el.classList.add("in"); resolve(); return; }
      W.requestAnimationFrame(function () { it.el.classList.add("in"); });
      setTimeout(resolve, 330);
    });
  };
  // the page says what it is waiting for: "platform" once its code runs and its reads go out
  S.phase = function (name) { var it = I; if (!it || it.gone || it.opening) return; it.answered = now(); it.setPhase(name); };
  // the reads of the wait that is on (a page says what it is about to read); any already in keep their place
  S.reads = function (list) { var it = I; if (!it || it.gone) return; heard(it); it.setReads(list); };
  // new words for the wait that is on, or for every cover from now (brand): the page knows more once it has read it
  S.say = function (o) {
    o = o || {}; if (o.brand !== undefined) S.brand = o.brand;
    var it = I; if (!it || it.gone) return;
    heard(it);
    if (o.title != null) it.el.querySelector(".cs-sp-title").textContent = o.title;
    if (o.sub != null) { it.sub.textContent = o.sub; it.subFixed = true; }
    if (o.brand !== undefined) it.el.querySelector(".cs-sp-brand").innerHTML = brandOf(o.brand != null ? o.brand : SET.brand);
  };
  S.mark = function (id) {
    var it = I; if (!it || it.gone) return;
    heard(it);
    var r = it.reads.filter(function (x) { return x.id === id; })[0]; if (r && r.at == null) r.at = now();
  };
  // the page behind is drawn: once the reads are in, the cover has shown long enough and the page's stylesheets have
  // arrived, the last lap draws the route, the pin lands, and the mark opens the window onto the page; resolves when
  // the cover has gone
  S.open = function (opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var it = I; if (!it || it.gone) { resolve(); return; }
      heard(it);
      it.wanted = opts; it.resolve = resolve;
      check();
    });
  };
  function start(it) {
    it.opening = true; it.el.style.pointerEvents = "none"; it.el.classList.add("opening");
    var retry = it.el.querySelector(".cs-sp-retry"); if (retry) retry.remove();
    var o = it.wanted, a = S.animate;
    it.setPhase("open");
    var end = function () {
      it.gone = true; if (it.el.parentNode) it.el.parentNode.removeChild(it.el);
      if (I === it) { I = null; stop(); } S.active = null;
      if (it.kind === "boot") { S.lifted = true; W.dispatchEvent(new W.CustomEvent("sc3:splash-lifted")); }
      if (it.resolve) it.resolve();
    };
    var anchor = typeof o.anchor === "string" ? D.querySelector(o.anchor) : o.anchor;
    var to = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : anchor && anchor.width ? anchor : null;
    if (to && !to.width) to = null;
    var landed = function () {
      it.el.classList.add("landed");
      if (it.kind === "leave" && it.words.done) { it.el.querySelector(".cs-sp-title").textContent = it.words.done; it.status.textContent = it.words.said || it.words.done; }
    };
    if (reduce || !a) {
      landed(); cover(false); if (o.onOpening) o.onOpening();
      if (!a && !reduce) { it.el.style.transition = "opacity 240ms ease"; it.el.style.opacity = "0"; setTimeout(end, 260); } else end();
      return;
    }
    // the last lap: the whole route draws from the godown dot and stays (340 ms), then the pin pings as the mark flies
    var run = it.run;
    it.el.classList.remove("running");
    run.style.strokeDasharray = "1 1"; run.style.strokeDashoffset = "1";
    void run.getBoundingClientRect();
    run.style.transition = "stroke-dashoffset 340ms cubic-bezier(0.22, 1, 0.36, 1)"; run.style.strokeDashoffset = "0";
    it.el.classList.add("drawn");
    setTimeout(function () {
      landed();
      setTimeout(function () {
        var W0 = W.innerWidth, H0 = W.innerHeight, m = it.mk, r0 = m.getBoundingClientRect();
        var cx = to ? to.left + to.width / 2 : r0.left + r0.width / 2, cy = to ? to.top + to.height / 2 : r0.top + r0.height / 2, k0 = (to ? to.width : r0.width) / 64, K = coverK(cx, cy, W0, H0);
        if (to) a(m, { x: cx - (r0.left + r0.width / 2), y: cy - (r0.top + r0.height / 2), scale: to.width / r0.width }, { type: "spring", stiffness: 260, damping: 30, mass: 1 });
        a(it.el.querySelectorAll(".cs-sp-words"), { opacity: 0, y: 8 }, { duration: 0.24, ease: [0.55, 0, 1, 0.45] });
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
      }, it.kind === "leave" ? 520 : 120);
    }, 340);
  }
  // something did not answer: say so, with a way to try again (a reload, unless the page gives one)
  S.fail = function (o) {
    var it = I; if (!it || it.gone || it.failed || it.opening) return; it.failed = true; o = o || {};
    // a text may name how long the splash waited in silence ({silent}), so the words never carry the number themselves
    var f = WORDS.fail, ti = o.title || f.title, tx = String(o.text || f.text).replace("{silent}", String(SILENT / 1000));
    it.el.classList.add("failed"); it.el.classList.remove("running");
    it.el.querySelector(".cs-sp-title").textContent = ti;
    it.sub.textContent = tx; it.subFixed = true;
    var b = el("button", "cs-sp-retry"); b.type = "button"; b.textContent = o.label || "Try again";
    b.addEventListener("click", o.onRetry || function () { W.location.reload(); });
    it.el.querySelector(".cs-sp-words").appendChild(b); it.el.setAttribute("aria-hidden", "false"); it.el.style.pointerEvents = "auto";
    it.status.textContent = ti + " " + tx;
    var bh = behind(); if (bh) bh.removeAttribute("inert");
    b.focus();
  };

  // the first load, from the first paint, unless the page starts it itself
  if (!W.SC3_SPLASH_MANUAL) S.begin("boot", {});
})();
