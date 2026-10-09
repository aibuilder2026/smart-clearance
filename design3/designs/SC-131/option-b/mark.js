// SC-131 · option B, the route runs: the mark's S is the loader. The route stands faint, and a bright stretch of it
// runs from the godown dot to the pin, a lap every 1.15 s; as each lap arrives the amber pin throbs. A delivery in
// transit, lap after lap, until everything is in: then the last lap draws the whole route and stays, the pin lands
// and pings once, and the mark opens into the window (shared). Under reduced motion the route is drawn whole and still.
(function () {
  "use strict";
  const SQ = "M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z", S = "M43.5 19H27a7 7 0 0 0 0 14h10a7 7 0 0 1 0 14H20.5";
  const svg = () => '<svg class="scv-mk" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="b-g" x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2fbf7f"/><stop offset="0.55" stop-color="#178258"/><stop offset="1" stop-color="#0d5a3e"/></linearGradient>' +
    '<linearGradient id="b-h" x1="32" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
    '<g class="sq"><path d="' + SQ + '" fill="url(#b-g)"/><path d="M32 3C10.5 3 3 10.5 3 31.5 10 22 22 18 32 18s22 4 29 13.5C61 10.5 53.5 3 32 3Z" fill="url(#b-h)"/></g>' +
    '<path class="b-ghost" d="' + S + '" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path class="b-run" d="' + S + '" pathLength="1" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="43.5" cy="19" r="3.4" fill="#0d5a3e" stroke="#fff" stroke-width="2.6"/>' +
    '<circle class="ping" cx="20.5" cy="47" r="5" fill="none" stroke="#f7c04a" stroke-width="2"/>' +
    '<circle class="pin" cx="20.5" cy="47" r="5.2" fill="#f7c04a" stroke="#fff" stroke-width="2.2"/></svg>';

  function init(el, o) {
    const run = el.querySelector(".b-run");
    if (o.reduce) el.classList.add("drawn"); else el.classList.add("running");
    return {
      // the last lap: the whole route draws from the dot and stays (380 ms), then the pin lands
      ready() {
        if (o.reduce) return null;
        el.classList.remove("running");
        run.style.transition = "none"; run.style.strokeDasharray = "1 1"; run.style.strokeDashoffset = "1";
        void run.getBoundingClientRect();
        run.style.transition = "stroke-dashoffset 380ms cubic-bezier(0.22, 1, 0.36, 1)"; run.style.strokeDashoffset = "0";
        el.classList.add("drawn");
        return new Promise(res => setTimeout(res, 380));
      },
    };
  }
  window.SC131_MARK = { svg, init, name: "The route runs" };
})();
