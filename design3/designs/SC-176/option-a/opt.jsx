// Option A · At the clock (recommended). The clock under every title gains one more piece: an info button, "Prototype
// time", after the date, the time and the pace. It opens the guide: at the side on a desktop, from the bottom on a phone.
// Under the bar's collapsed title it is the icon alone. The note sits wherever the journey's clock does: every page's
// title, a batch's head, and the console's journey badge.
(function () {
  const K = window.SC3, S = window.SC3_SCREENS, L = S.Live, T = window.SCT;
  const { cx, Icon } = K;
  function Info({ onOpen, short }) {
    return <button type="button" className={cx("pt-info", short && "short")} onClick={onOpen} aria-haspopup="dialog" aria-label={short ? "Prototype time: why this date, and how to reset or fast-forward the journey" : undefined}><Icon name="info" size={short ? 14 : 13} stroke={2.2} />{!short && <><span>Prototype time</span><span className="sr-only">: why this date, and how to reset or fast-forward the journey</span></>}</button>;
  }
  function Line() {
    const live = S.useLive(); const c = live.clock;
    return <T.WithGuide render={open => <span className={cx("lv-line", live.conn !== "live" && "off")}><L.ConnMark conn={live.conn} /><span className="lv-st">{L.stateWord(live.conn)}</span><span className="lv-sep" aria-hidden="true" /><span className="lv-time"><span className="lv-date">{c.date}</span><span className="tnum">{c.time}</span></span><L.Cue perDay={c.perDay} /><Info onOpen={open} /></span>} />;
  }
  function BarSub() {
    const live = S.useLive();
    return <T.WithGuide render={open => <span className="lv-barsub"><L.ConnMark conn={live.conn} size={6} /><span className="tnum">{live.clock.time}</span><L.Cue perDay={live.clock.perDay} short /><Info onOpen={open} short /></span>} />;
  }
  Object.assign(L, { Line, BarSub });
})();
