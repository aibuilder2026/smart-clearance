// SC-131 · option A, the heartbeat: the mark is the loader. Drawn whole from the first paint, it beats while anything
// is still on its way, two pulses a beat (strong, then soft) every 1.3 s, and a ring of its own outline ripples out on
// the strong pulse. The beat is CSS (transform and opacity only), so it runs on the compositor and keeps time while the
// browser is busy with the app's code. Everything in: the beat settles on a spring, the pin pings once, and the mark
// opens into the window (shared). Under reduced motion the mark is still and the words carry the wait.
(function () {
  "use strict";
  const SQ = "M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z";
  const svg = () => '<svg class="scv-mk" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="a-g" x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2fbf7f"/><stop offset="0.55" stop-color="#178258"/><stop offset="1" stop-color="#0d5a3e"/></linearGradient>' +
    '<linearGradient id="a-h" x1="32" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
    '<path class="ring a-ripple" d="' + SQ + '" fill="none" stroke-width="1.6"/>' +
    '<g class="sq"><path d="' + SQ + '" fill="url(#a-g)"/><path d="M32 3C10.5 3 3 10.5 3 31.5 10 22 22 18 32 18s22 4 29 13.5C61 10.5 53.5 3 32 3Z" fill="url(#a-h)"/></g>' +
    '<path d="M43.5 19H27a7 7 0 0 0 0 14h10a7 7 0 0 1 0 14H20.5" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="43.5" cy="19" r="3.4" fill="#0d5a3e" stroke="#fff" stroke-width="2.6"/>' +
    '<circle class="ping" cx="20.5" cy="47" r="5" fill="none" stroke="#f7c04a" stroke-width="2"/>' +
    '<circle class="pin" cx="20.5" cy="47" r="5.2" fill="#f7c04a" stroke="#fff" stroke-width="2.2"/></svg>';

  function init(el, o) {
    const move = el.querySelector(".scv-mkmove");
    if (!o.reduce) el.classList.add("beating");
    return {
      // the beat settles from wherever it is, on a spring (stiffness 420, damping 30, mass 1), in about 220 ms
      ready() {
        if (o.reduce || !o.animate) { el.classList.remove("beating"); return null; }
        const m = getComputedStyle(move).transform, s = m && m !== "none" ? new DOMMatrix(m).a : 1;
        el.classList.remove("beating");
        return new Promise(res => { o.animate(move, { scale: [s, 1] }, { type: "spring", stiffness: 420, damping: 30, mass: 1 }); setTimeout(res, 220); });
      },
    };
  }
  window.SC131_MARK = { svg, init, name: "The heartbeat" };
})();
