// SC-131 · the review stage: an option's cover over the real page, on a simulated line. Each wait is a timeline of what
// arrives when, estimated from the live apps measured on 9 Oct (cold cache, 1280 × 800) with the fixes every option
// shares: the cover paints with the page's first bytes, the API's connection opens early, the console's code is
// fetched while the person types, and the landing page fetches its first screen first. "Today" marks what the live
// apps did on the same line. Params: surface (boot, enter, leave, site), line (fast, slow4g, 3g), theme, w (1440, 390),
// speed, reduce (1), at (seconds: freeze there, for stills).
(function () {
  "use strict";
  const Q = new URLSearchParams(location.search);
  const S = {
    surface: Q.get("surface") || "boot", line: Q.get("line") || "3g", theme: Q.get("theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    w: Number(Q.get("w")) === 390 ? 390 : 1440, speed: Number(Q.get("speed")) || 1, reduce: Q.get("reduce") === "1" || matchMedia("(prefers-reduced-motion: reduce)").matches, at: Q.get("at") != null ? Number(Q.get("at")) : null,
  };
  const H = { 1440: 900, 390: 844 };
  const LINES = { fast: "Fast (50 Mbps)", slow4g: "Slow 4G (1.6 Mbps, 560 ms)", "3g": "3G (400 kbps, 2 s)" };
  const SURFACES = { boot: "Console · first load", enter: "Console · signing in", leave: "Console · signing out", site: "Landing page · first load" };
  // seconds from the navigation (or from the press, for signing in and out)
  const PLAN = {
    boot: { fast: { html: 0.25, code: 0.7, reads: [0.85, 0.9, 0.95] }, slow4g: { html: 2.2, code: 4.4, reads: [4.9, 5.2, 5.4] }, "3g": { html: 2.4, code: 9.0, reads: [10.4, 11.1, 11.6] } },
    enter: { fast: { reads: [0.3, 0.45, 0.55, 0.6] }, slow4g: { reads: [1.1, 1.5, 1.8, 2.0] }, "3g": { reads: [3.0, 3.9, 4.6, 5.2] } },
    leave: { fast: { reads: [0.25, 0.4] }, slow4g: { reads: [1.0, 1.3] }, "3g": { reads: [3.4, 4.2] } },
    site: { fast: { html: 0.2, css: 0.45, plate: 0.9 }, slow4g: { html: 1.6, css: 2.5, plate: 4.4 }, "3g": { html: 2.4, css: 5.0, plate: 12.5 } },
  };
  const TODAY = {
    boot: { slow4g: [[2.7, "today: the splash"], [7.4, "today: opens"]], "3g": [[7.9, "today: blank until"], [15.4, "today: “did not answer”"], [17.7, "today: opens"]] },
    site: { slow4g: [[2.7, "today: the loader"], [11.7, "today: lifts"]], "3g": [[6.9, "today: blank until"], [15.2, "today: lifts, no plate"]] },
  };
  const READS = { boot: ["Who is signed in", "The platform", "The agents"], enter: ["Your clients", "Today", "The batches", "The agents"], leave: ["The session closes", "Signed out"] };
  // where each page keeps its mark (measured on design3 at 1440 × 900 and 390 × 844); the cover flies there to open
  const ANCHOR = { signin: { 1440: { x: 1090, y: 137, w: 60, h: 60 }, 390: { x: 169, y: 108, w: 52, h: 52 } }, overview: { 1440: { x: 20, y: 18, w: 32, h: 32 }, 390: null } };
  const MIN = { boot: 1.25, load: 1.25, enter: 0.9, leave: 0.9 }, SLOW = 3, WAKE = 2.6;
  // the published copies set SC131_BASE to the pinned folder; locally it is the folder above the option
  const BASE = window.SC131_BASE || "../";
  const page = (name) => `${BASE}sim/pages/${name}-${S.theme}-${S.w}.webp`;

  /* ---------- the harness ---------- */
  const app = document.getElementById("sim");
  const seg = (key, opts, label) => `<fieldset class="sg"><legend>${label}</legend>${Object.entries(opts).map(([v, t]) => `<label><input type="radio" name="${key}" value="${v}" ${String(S[key]) === v ? "checked" : ""}><span>${t}</span></label>`).join("")}</fieldset>`;
  app.innerHTML = `<div class="controls">${seg("surface", SURFACES, "Wait")}${seg("line", { fast: "Fast", slow4g: "Slow 4G", "3g": "3G" }, "Line")}${seg("theme", { light: "Light", dark: "Dark" }, "Theme")}${seg("w", { 1440: "Desktop", 390: "Phone" }, "Width")}
    <div class="acts"><button type="button" class="btn" id="replay"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Replay</button>
    <label class="chk"><input type="checkbox" id="slowmo" ${S.speed < 1 ? "checked" : ""}><span>Half speed</span></label></div></div>
    <div class="stagewrap"><div class="stage" id="stage"><div class="vp" id="vp"><img class="pg pg-a" alt="" src="${page("console-signin")}"><img class="pg pg-b" alt="" src="${page("console-overview")}"><div class="blank"><span>Nothing yet: the page has not arrived</span></div></div></div></div>
    <div class="clock"><div class="readout"><b id="tnow">0.0 s</b><span id="tsay">${LINES[S.line]}</span></div><div class="track" id="track"><i class="head" id="head"></i></div></div>
    <ol class="log" id="log" aria-live="polite"></ol>`;
  app.querySelectorAll("input[type=radio]").forEach(r => r.addEventListener("change", () => { S[r.name] = r.name === "w" ? Number(r.value) : r.value; sync(); start(); }));
  document.getElementById("replay").addEventListener("click", start);
  document.getElementById("slowmo").addEventListener("change", e => { S.speed = e.target.checked ? 0.5 : 1; sync(); start(); });
  const vp = document.getElementById("vp"), stage = document.getElementById("stage"), A = vp.querySelector(".pg-a"), B = vp.querySelector(".pg-b"), blank = vp.querySelector(".blank");
  const logEl = document.getElementById("log"), track = document.getElementById("track"), head = document.getElementById("head"), tnow = document.getElementById("tnow");
  function sync() {
    const p = new URLSearchParams(location.search);
    ["surface", "line", "theme", "w"].forEach(k => p.set(k, S[k])); if (S.speed !== 1) p.set("speed", S.speed); else p.delete("speed");
    history.replaceState(null, "", "?" + p.toString());
    document.documentElement.setAttribute("data-theme", S.theme);
  }
  function fit() {
    const W = S.w, Hh = H[S.w], box = stage.parentElement.getBoundingClientRect();
    const maxH = Math.max(320, window.innerHeight * 0.72), sc = Math.min(box.width / W, maxH / Hh, 1);
    vp.style.width = W + "px"; vp.style.height = Hh + "px"; vp.style.transform = `scale(${sc})`;
    stage.style.width = W * sc + "px"; stage.style.height = Hh * sc + "px";
  }
  addEventListener("resize", fit);

  /* ---------- a run ---------- */
  let R = null;
  function show(img, src, on) { if (src && img.getAttribute("src") !== src) img.src = src; img.classList.toggle("on", !!on); }
  function log(t, text) { const li = document.createElement("li"); li.innerHTML = `<b>${t.toFixed(1)} s</b><span>${text}</span>`; logEl.appendChild(li); }
  function start() {
    if (R) { R.dead = true; if (R.cover) R.cover.remove(); cancelAnimationFrame(R.raf); }
    document.documentElement.removeAttribute("data-frozen");
    fit(); logEl.innerHTML = ""; vp.querySelectorAll(".scv").forEach(n => n.remove());
    const kind = S.surface === "site" ? "load" : S.surface, plan = PLAN[S.surface][S.line];
    R = { kind, plan, t0: performance.now(), fired: {}, cover: null, done: false, dead: false, raf: 0, landed: 0 };
    // the track: what arrives when, the cover's own moments, and today's marks on the same line
    const ev = [];
    if (plan.html != null) ev.push([plan.html, "the page"]);
    if (plan.code != null) ev.push([plan.code, "the console's code"]);
    if (plan.css != null) ev.push([plan.css, "the first screen's styles"]);
    if (plan.plate != null) ev.push([plan.plate, "the hero's plate"]);
    (plan.reads || []).forEach((t, i) => ev.push([t, READS[kind][i]]));
    const end = kind === "load" ? Math.max(plan.css, plan.html + MIN.load) : Math.max(plan.reads[plan.reads.length - 1], (plan.html || 0) + MIN[kind]);
    R.end = end;
    const today = (TODAY[S.surface] || {})[S.line] || [];
    const span = Math.max(end + 1.6, plan.plate || 0, ...today.map(x => x[0] + 0.6), 3);
    R.span = span;
    track.querySelectorAll(".tick").forEach(n => n.remove());
    const tick = (t, label, cls) => { const n = document.createElement("span"); n.className = "tick " + cls; n.style.left = (t / span * 100) + "%"; n.innerHTML = `<i></i><em>${label}</em>`; track.appendChild(n); };
    ev.forEach(([t, l]) => tick(t, l, "arr"));
    tick(end, "opens", "open");
    today.forEach(([t, l]) => tick(t, l, "today"));
    document.getElementById("tsay").textContent = LINES[S.line] + (S.speed !== 1 ? " · half speed" : "");
    // the page as it stands before the wait
    blank.classList.toggle("on", kind === "boot" || kind === "load");
    blank.classList.toggle("dark", S.theme === "dark");
    if (kind === "load") { show(A, page("site-preview"), true); show(B, page("site-hero"), false); }
    else if (kind === "enter") { show(A, page("console-signin"), true); show(B, page("console-overview"), false); }
    else if (kind === "leave") { show(A, page("console-overview"), true); show(B, page("console-signin"), false); }
    else { show(A, page("console-signin"), true); show(B, null, false); }
    if (kind === "enter" || kind === "leave") mount(0);
    R.raf = requestAnimationFrame(loop);
  }
  function mount(t) {
    const kind = R.kind, from = kind === "enter" ? ANCHOR.signin[S.w] : null;
    R.cover = window.SC131_COVER.mount(vp, { surface: kind === "load" ? "site" : "console", kind, theme: S.theme, reduce: S.reduce, who: "Neha", from, animate: window.Motion && window.Motion.animate });
    R.coverAt = t;
    R.cover.phase(kind === "boot" ? "code" : "platform");
    log(t, kind === "load" ? "The page arrives; the cover paints with it, before the page's own styles" : kind === "boot" ? "The page arrives; the cover paints with it, before the console's code" : kind === "enter" ? "Signed in: the card's mark grows into the cover" : "Sign out: the cover comes over the console");
  }
  function loop(now) {
    if (R.dead) return;
    const t = (now - R.t0) / 1000 * S.speed, p = R.plan, k = R.kind, once = (key, f) => { if (!R.fired[key]) { R.fired[key] = 1; f(); } };
    tnow.textContent = t.toFixed(1) + " s"; head.style.left = Math.min(100, t / R.span * 100) + "%";
    if (p.html != null && t >= p.html) once("html", () => { blank.classList.remove("on"); mount(p.html); });
    const C = R.cover;
    if (C && !C.gone && !R.done) {
      // what the cover is waiting for, said in words: the code, then the platform, then waking it
      if (k === "boot") {
        if (t >= p.code) once("code", () => { C.phase("platform"); log(p.code, "The console's code is in; the platform's reads go out (the connection is already open)"); });
        if (t >= p.code + WAKE && R.landed < p.reads.length) once("wake", () => { C.phase("wake"); log(p.code + WAKE, "Still waiting on the platform, so it says so"); });
      }
      if (k === "load" && t >= p.css) once("css", () => log(p.css, "The first screen's styles are in: the words can be read on the plate's soft preview"));
      (p.reads || []).forEach((rt, i) => { if (t >= rt) once("r" + i, () => { R.landed += 1; log(rt, READS[k][i] + " answered"); }); });
      if (t >= (R.coverAt || 0) + SLOW && t < R.end) once("slow", () => { C.slow(true); log((R.coverAt || 0) + SLOW, "Past 3 s: one quiet line says the connection is slow"); });
      // the progress, for an option that shows it: the code by its bytes, then each read; the landing page by its first screen
      let prog = 0;
      if (k === "boot") prog = t < p.html ? 0 : t < p.code ? 0.7 * (t - p.html) / (p.code - p.html) : 0.7 + 0.3 * R.landed / p.reads.length;
      else if (k === "load") prog = Math.min(1, (t - p.html) / (R.end - p.html));
      else prog = R.landed / p.reads.length;
      C.progress(prog);
      if (k === "enter" && t >= 0.33) once("under", () => { show(B, null, true); show(A, null, false); log(0.33, "The console draws under the cover while its reads come in"); });
      if (t >= R.end) {
        R.done = true; C.phase("open");
        let anchor = null;
        if (k === "boot") anchor = ANCHOR.signin[S.w];
        if (k === "enter") anchor = ANCHOR.overview[S.w];
        if (k === "leave") { anchor = ANCHOR.signin[S.w]; show(B, null, true); show(A, null, false); }
        log(R.end, k === "load" ? "The first screen can be read: the cover opens onto it" : "Everything is in: the cover opens onto the page");
        C.ready(anchor).then(() => { if (!R.dead) log((performance.now() - R.t0) / 1000 * S.speed, "The cover has gone"); });
      }
    }
    if (k === "load" && p.plate != null && t >= p.plate) once("plate", () => { show(B, null, true); log(p.plate, "The plate arrives and sharpens in place; the film starts after it"); });
    if (S.at != null && t >= S.at) { freeze(); return; }
    if (t < R.span + 1) R.raf = requestAnimationFrame(loop);
  }
  function freeze() { document.getAnimations().forEach(a => a.pause()); document.documentElement.setAttribute("data-frozen", "1"); }

  sync(); start();
})();
