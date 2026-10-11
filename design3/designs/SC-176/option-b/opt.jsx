// Option B · A note under the clock. Every page's title says, in a line of its own under the clock, that its date is
// the prototype's: "Prototype time: the story's own calendar, so its batches' best-before dates hold", with "How to
// reset or fast-forward" opening the guide. Always in view, never behind an icon. Under the bar's collapsed title the
// time keeps an info button.
(function () {
  const K = window.SC3, S = window.SC3_SCREENS, L = S.Live, T = window.SCT;
  const { cx, Icon } = K;
  function Line() {
    const live = S.useLive(); const c = live.clock;
    return <T.WithGuide render={open => <span className="pt-wrap">
      <span className={cx("lv-line", live.conn !== "live" && "off")}><L.ConnMark conn={live.conn} /><span className="lv-st">{L.stateWord(live.conn)}</span><span className="lv-sep" aria-hidden="true" /><span className="lv-time"><span className="lv-date">{c.date}</span><span className="tnum">{c.time}</span></span><L.Cue perDay={c.perDay} /></span>
      <span className="pt-note"><Icon name="info" size={14} stroke={2.2} /><span><b>Prototype time:</b> the story's own calendar, so its batches' best-before dates hold. <button type="button" className="pt-link" onClick={open} aria-haspopup="dialog">How to reset or fast-forward</button></span></span>
    </span>} />;
  }
  function BarSub() {
    const live = S.useLive();
    return <T.WithGuide render={open => <span className="lv-barsub"><L.ConnMark conn={live.conn} size={6} /><span className="tnum">{live.clock.time}</span><L.Cue perDay={live.clock.perDay} short /><button type="button" className="pt-info short" onClick={open} aria-haspopup="dialog" aria-label="Prototype time: why this date, and how to reset or fast-forward the journey"><Icon name="info" size={14} stroke={2.2} /></button></span>} />;
  }
  Object.assign(L, { Line, BarSub });
})();
