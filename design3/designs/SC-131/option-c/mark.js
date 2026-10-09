// SC-131 · option C, the mark fills: real progress, inside the mark. The squircle starts as its outline and a faint
// route; the brand green rises in it as the first screen's files and reads arrive (by their bytes, from the build's own
// list of them), and the white route shows wherever the green has reached. When the downloads are in and the console
// waits on the platform, the mark breathes gently, so a cold start never looks frozen. Full: the pin lands and pings
// once, and the mark opens into the window (shared). Under reduced motion the level steps with the progress.
(function () {
  "use strict";
  const SQ = "M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z", S = "M43.5 19H27a7 7 0 0 0 0 14h10a7 7 0 0 1 0 14H20.5";
  const svg = () => '<svg class="scv-mk" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="c-g" x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2fbf7f"/><stop offset="0.55" stop-color="#178258"/><stop offset="1" stop-color="#0d5a3e"/></linearGradient>' +
    '<linearGradient id="c-h" x1="32" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<clipPath id="c-level"><rect class="c-level" x="-4" y="66" width="72" height="72"/></clipPath></defs>' +
    '<path class="sq-line" d="' + SQ + '" fill="none" stroke-width="1.6"/>' +
    '<path class="c-ghost" d="' + S + '" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<g clip-path="url(#c-level)"><g class="sq"><path d="' + SQ + '" fill="url(#c-g)"/><path d="M32 3C10.5 3 3 10.5 3 31.5 10 22 22 18 32 18s22 4 29 13.5C61 10.5 53.5 3 32 3Z" fill="url(#c-h)"/></g>' +
    '<path d="' + S + '" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="43.5" cy="19" r="3.4" fill="#0d5a3e" stroke="#fff" stroke-width="2.6"/></g>' +
    '<circle class="ping" cx="20.5" cy="47" r="5" fill="none" stroke="#f7c04a" stroke-width="2"/>' +
    '<circle class="pin" cx="20.5" cy="47" r="5.2" fill="#f7c04a" stroke="#fff" stroke-width="2.2"/></svg>';

  function init(el, o) {
    const lv = el.querySelector(".c-level");
    let target = 0, shown = 0, raf = 0, last = 0;
    // the level follows the bytes closely and never goes back; 66 is empty, 0 is full (a 2-unit lip over the top)
    const paint = () => lv.setAttribute("y", (66 - 66 * shown).toFixed(2));
    const step = t => {
      raf = 0; const dt = last ? Math.min(64, t - last) : 16; last = t;
      shown = o.reduce ? target : shown + (target - shown) * (1 - Math.exp(-dt / 160));
      if (target - shown < 0.002) shown = target;
      paint(); if (shown < target) raf = requestAnimationFrame(step); else last = 0;
    };
    return {
      progress(p) { if (p > target) { target = p; if (!raf) raf = requestAnimationFrame(step); } },
      phase(name) { el.classList.toggle("waiting", !o.reduce && (name === "platform" || name === "wake")); },
      ready() {
        el.classList.remove("waiting"); this.progress(1);
        return new Promise(res => { const wait = () => (shown >= 0.999 ? res() : setTimeout(wait, 40)); wait(); }).then(() => { el.classList.add("full"); return new Promise(r => setTimeout(r, o.reduce ? 0 : 260)); });
      },
      stop() { if (raf) cancelAnimationFrame(raf); },
    };
  }
  window.SC131_MARK = { svg, init, name: "The mark fills" };
})();
