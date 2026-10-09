// SC-131 · what the three options share: the cover itself. It stands on its own (its own inks and faces, nothing from
// the app's stylesheet), so it can paint with the page's first bytes; it says what it is waiting for in words, never in
// stops; it adds one quiet line when the connection is slow; and it leaves through the mark's window (SC-35, SC-51).
// Each option brings its mark: how the mark carries the wait (option-x/mark.js) and its motion (option-x/cover.css).
// window.SC131_COVER.mount(root, opts) → { phase(name), progress(p), slow(on), ready(): Promise, fail(), gone }
(function () {
  "use strict";
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const SQ = [[32, 2], [9.5, 2], [2, 9.5], [2, 32], [2, 54.5], [9.5, 62], [32, 62], [54.5, 62], [62, 54.5], [62, 32], [62, 9.5], [54.5, 2], [32, 2]];
  function squircle(cx, cy, k) {
    const p = SQ.map(q => (cx + (q[0] - 32) * k).toFixed(1) + " " + (cy + (q[1] - 32) * k).toFixed(1));
    return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3] + "C" + p[4] + " " + p[5] + " " + p[6] + "C" + p[7] + " " + p[8] + " " + p[9] + "C" + p[10] + " " + p[11] + " " + p[12] + "Z";
  }
  const coverK = (cx, cy, w, h) => Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy)) / 30 * 1.04;
  const greet = who => { const h = new Date().getHours(); const g = h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; return who ? g + ", " + who : g; };
  const today = () => new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  // the words for each wait: a title that holds, and one line that says what it is waiting for now
  const WORDS = {
    boot: { title: () => "Opening the console", line: { code: "Loading the console", platform: "Connecting to the platform", wake: "Waking the platform up…", open: "Opening" }, say: "Opening the console." },
    enter: { title: who => greet(who), line: { platform: () => today() + " · opening your console", open: "Opening your console" }, say: who => "Signed in. Opening the console for " + who + "." },
    leave: { title: () => "Signing you out", done: "Signed out", line: { platform: who => "Until next time, " + who + ".", open: who => "Until next time, " + who + "." }, say: "Signing you out.", said: "Signed out." },
    load: { say: "Loading Smart-Clearance." },
  };
  const SLOW = { console: "Slow connection · still loading", site: "Slow connection · the page is on its way" };
  const pick = (v, who) => (typeof v === "function" ? v(who) : v);

  function mount(root, o) {
    const MARK = window.SC131_MARK, kind = o.kind, site = o.surface === "site", who = o.who || "Neha", w = WORDS[kind] || {};
    const el = document.createElement("div");
    el.className = "scv " + (site ? "site" : "console") + " " + kind + (o.reduce ? " still" : "");
    el.setAttribute("data-theme", o.theme);
    el.innerHTML = '<div class="scv-ground"></div><div class="scv-lock"><div class="scv-mkbox"><div class="scv-mkmove">' + MARK.svg() + "</div></div>" +
      '<div class="scv-words">' +
      (site ? '<span class="scv-wm big">Smart‑Clearance</span><span class="scv-hi" lang="hi">हर कार्टन को दूसरा मौका</span>'
        : '<span class="scv-brand"><span class="scv-wm">Smart‑Clearance</span><span class="scv-tag">Console</span></span><p class="scv-title"></p><p class="scv-sub"></p>') +
      '<p class="scv-slow"><span class="scv-slow-dot" aria-hidden="true"></span><span>' + SLOW[site ? "site" : "console"] + "</span></p></div></div>" +
      '<span class="scv-sr" role="status"></span>';
    root.appendChild(el);
    const $ = s => el.querySelector(s), title = $(".scv-title"), sub = $(".scv-sub"), status = $(".scv-sr");
    const mk = $(".scv-mkbox"), move = $(".scv-mkmove");
    if (title) title.textContent = pick(w.title, who);
    const hooks = MARK.init(el, { reduce: o.reduce, animate: o.animate });
    const C = { gone: false, el };
    setTimeout(() => { status.textContent = pick(w.say, who); }, 80);

    // coming in: at once on a load (it is the first thing painted), over 320 ms on a sign-in or out, the mark arriving
    // from the card's mark when there is one (SC-51)
    if (kind === "boot" || kind === "load" || o.reduce) el.classList.add("in");
    else requestAnimationFrame(() => el.classList.add("in"));
    if (o.from && o.animate && !o.reduce) {
      const r = local(mk), f = o.from;
      o.animate(mk, { x: [f.x + f.w / 2 - (r.x + r.w / 2), 0], y: [f.y + f.h / 2 - (r.y + r.h / 2), 0], scale: [f.w / r.w, 1] }, { type: "spring", stiffness: 260, damping: 28, mass: 1 });
    }
    requestAnimationFrame(() => el.classList.add("go"));

    // a rect in the cover's own pixels (the stage is scaled for review; the build's is the window)
    function local(n) {
      const a = n.getBoundingClientRect(), b = el.getBoundingClientRect(), s = b.width / el.offsetWidth || 1;
      return { x: (a.left - b.left) / s, y: (a.top - b.top) / s, w: a.width / s, h: a.height / s };
    }

    C.phase = name => {
      if (C.gone) return;
      el.setAttribute("data-phase", name);
      if (sub && w.line && w.line[name] != null) sub.textContent = pick(w.line[name], who);
      if (hooks.phase) hooks.phase(name);
    };
    C.progress = p => { if (!C.gone && hooks.progress) hooks.progress(clamp(p, 0, 1)); };
    C.slow = on => { if (!C.gone) el.classList.toggle("is-slow", !!on); };
    C.fail = () => {
      el.classList.add("failed");
      if (title) title.textContent = "The console did not answer";
      if (sub) sub.textContent = "The platform has not answered for 20 s. Check the connection, then try again.";
    };
    // everything is in: the mark settles (each option its own way), the pin lands, the words go, the mark flies to
    // where the page keeps its mark, and its squircle opens into a window onto the page
    C.ready = (anchor) => new Promise(resolve => {
      const a = o.animate, W = el.offsetWidth, H = el.offsetHeight, ground = $(".scv-ground");
      const end = () => { C.gone = true; if (hooks.stop) hooks.stop(); el.remove(); resolve(); };
      Promise.resolve(hooks.ready ? hooks.ready() : null).then(() => {
        if (kind === "leave" && title) { title.textContent = w.done; status.textContent = w.said; }
        el.classList.add("landed");
        if (o.reduce || !a) { setTimeout(end, o.reduce ? 600 : 0); return; }
        const hold = kind === "leave" ? 520 : 260;
        setTimeout(() => {
          const r0 = local(mk), to = anchor || null;
          const cx = to ? to.x + to.w / 2 : r0.x + r0.w / 2, cy = to ? to.y + to.h / 2 : r0.y + r0.h / 2, k0 = (to ? to.w : r0.w) / 64, K = coverK(cx, cy, W, H);
          a(el.querySelectorAll(".scv-words"), { opacity: 0, y: 8 }, { duration: 0.24, ease: [0.55, 0, 1, 0.45] });
          if (to) a(mk, { x: cx - (r0.x + r0.w / 2), y: cy - (r0.y + r0.h / 2), scale: to.w / r0.w }, { type: "spring", stiffness: 260, damping: 30, mass: 1 });
          setTimeout(() => {
            el.classList.add("opening");
            a(el.querySelectorAll(".scv-mk .sq, .scv-mk .sq-line"), { opacity: 0 }, { duration: 0.24, ease: "linear" });
            a(0, 1, { duration: 0.74, ease: [0.7, 0, 0.2, 1], onUpdate: v => {
              const k = k0 * Math.pow(K / k0, v);
              ground.style.clipPath = 'path(evenodd, "M0 0H' + W + "V" + H + "H0Z" + squircle(cx, cy, k) + '")';
              move.style.opacity = String(1 - clamp((v - 0.18) / 0.44, 0, 1));
            }, onComplete: end });
          }, to ? 420 : 40);
        }, hold);
      });
    });
    C.remove = () => { C.gone = true; if (hooks.stop) hooks.stop(); el.remove(); };
    return C;
  }
  window.SC131_COVER = { mount, squircle };
})();
