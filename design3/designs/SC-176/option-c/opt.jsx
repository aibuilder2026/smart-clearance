// Option C · Every date marked. Each date and time of the journey on the page (the clock, the Watcher's check, the
// agents' feed, the tracker's stops, a batch's best-before) is underlined with dots; pointing at one or focusing it says
// "Prototype time", and pressing it opens the guide. The clock itself gains a "Prototype" tag. One guide for the page,
// opened from any of them.
(function () {
  const { useState, useEffect } = React;
  const K = window.SC3, S = window.SC3_SCREENS, L = S.Live, T = window.SCT;
  const { cx, Icon } = K;
  const TIP = "Prototype time · press for how to reset or fast-forward";
  const open = () => window.dispatchEvent(new Event("sct-open"));
  function Line() {
    const live = S.useLive(); const c = live.clock;
    return <span className={cx("lv-line", live.conn !== "live" && "off")}><L.ConnMark conn={live.conn} /><span className="lv-st">{L.stateWord(live.conn)}</span><span className="lv-sep" aria-hidden="true" /><button type="button" className="lv-time pt-mark" data-tip={TIP} onClick={open} aria-haspopup="dialog"><span className="lv-date">{c.date}</span><span className="tnum">{c.time}</span><span className="sr-only">, prototype time: how to reset or fast-forward</span></button><L.Cue perDay={c.perDay} /><span className="pt-tag" aria-hidden="true"><Icon name="info" size={12} stroke={2.4} />Prototype</span></span>;
  }
  // every other date or time of the journey on the page: an element whose whole text is one
  const MON = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";
  const DOW = "(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)";
  const RX = new RegExp(`^(?:(?:best before|before|after|since|until|due|by|at|on) )?(?:${DOW},? )?(?:\\d{1,2} ${MON}(?: 20\\d\\d)?)?(?:,? ?(?:at )?\\d{1,2}:\\d{2})?$|^${DOW} \\d{1,2}:\\d{2}$`);
  function mark(root) {
    root.querySelectorAll("#root span, #root time, #root em, #root b, #root small, #root div, #root p").forEach(el => {
      if (el.dataset.pt || el.children.length || el.closest(".lv-line, .lv-barsub, .sheet, button, a, nav, aside")) return;
      const t = (el.textContent || "").replace(/\s+/g, " ").trim(); if (!t || !/\d/.test(t) || !RX.test(t)) return;
      el.dataset.pt = "1"; el.classList.add("pt-mark"); el.setAttribute("tabindex", "0"); el.setAttribute("role", "button"); el.setAttribute("data-tip", TIP); el.setAttribute("aria-label", t + ", prototype time: how to reset or fast-forward");
    });
  }
  // the page's one guide, opened from the clock or any marked date; it rides on the live band every screen draws
  function Band() {
    const [o, setO] = useState(false); const live = S.useLive();
    useEffect(() => {
      const h = () => setO(true); window.addEventListener("sct-open", h);
      const click = e => { const m = e.target.closest && e.target.closest("[data-pt]"); if (m) open(); };
      const key = e => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset && e.target.dataset.pt) { e.preventDefault(); open(); } };
      document.addEventListener("click", click); document.addEventListener("keydown", key);
      const run = () => mark(document); run(); const mo = new MutationObserver(run); mo.observe(document.body, { childList: true, subtree: true, characterData: true });
      return () => { window.removeEventListener("sct-open", h); document.removeEventListener("click", click); document.removeEventListener("keydown", key); mo.disconnect(); };
    }, []);
    return <><BaseBand /><T.Guide open={o} onClose={() => setO(false)} clock={live && live.clock} /></>;
  }
  const BaseBand = L.Band;
  function BarSub() { const live = S.useLive(); return <span className="lv-barsub"><L.ConnMark conn={live.conn} size={6} /><button type="button" className="tnum pt-mark" data-tip={TIP} onClick={open} aria-haspopup="dialog">{live.clock.time}<span className="sr-only">, prototype time</span></button><L.Cue perDay={live.clock.perDay} short /></span>; }
  Object.assign(L, { Line, BarSub, Band });
})();
