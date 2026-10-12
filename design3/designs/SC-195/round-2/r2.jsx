// SC-195 round 2 · the sign-in's stage, Smart-Clearance's own: what the three options share. The platform's ten agents
// and the one person, in the order they work a batch through the nine stops; the walk (once, under five seconds, then
// still; at once under reduced motion; Replay); the stage's head and caption; and two portals, one into the sign-in's
// ground (behind the card) and one into its grid above the card on phones. No client's data: the agents' words are the
// product's own, so a live workspace shows the same stage before anyone signs in.
(function () {
  const { useState, useEffect, useRef } = React;
  const { useReducedMotion } = Motion;
  const K = window.SC3; const { cx, Icon, Mark, Wordmark, useApp } = K;
  const EASE = [0.22, 1, 0.36, 1];

  // the nine stops, and who works each: the execute stop's three agents work at once
  const STOPS = [
    { id: "connect", t: "Connect" }, { id: "detect", t: "Detect" }, { id: "verify", t: "Verify" }, { id: "value", t: "Value" },
    { id: "decide", t: "Decide" }, { id: "approve", t: "Approve", human: true }, { id: "execute", t: "Execute" }, { id: "settle", t: "Settle" },
    { id: "report", t: "Report" },
  ];
  const CREW = [
    { id: "data", name: "Data", icon: "database", stop: 0, did: "Loaded the stock export and mapped its columns", call: "dms.map → 8 fields" },
    { id: "watcher", name: "Watcher", icon: "eye", stop: 1, did: "Flagged a batch the quick-commerce gates will refuse", call: "gates.check → blinkit · zepto · instamart" },
    { id: "vision", name: "Vision", icon: "scan-line", stop: 2, did: "Read the carton's label from one photo", call: "gemini.vision.read_label → match" },
    { id: "valuer", name: "Valuer", icon: "scale", stop: 3, did: "Priced every exit, the bin included", call: "price.exits → 5 priced" },
    { id: "router", name: "Router", icon: "route", stop: 4, did: "Split the batch under each exit's caps", call: "split.fill → under the caps" },
    { id: "you", name: "You", icon: "hand", stop: 5, human: true, did: "One yes, with the money on screen", call: "plan.approve → one tap" },
    { id: "outreach", name: "Outreach", icon: "send", stop: 6, did: "Offered the kiranas a scheme in Hindi", call: "fcm.send → kiranas · Hindi" },
    { id: "lister", name: "Lister", icon: "store", stop: 6, did: "Listed the lot outside the client's territory", call: "expiresoon.list → hidden in territory" },
    { id: "negotiator", name: "Negotiator", icon: "gavel", stop: 6, did: "Countered a bid, never below the reserve", call: "bid.counter → above reserve" },
    { id: "paperwork", name: "Paperwork", icon: "file-text", stop: 7, did: "Drafted the invoice, credit note and GST memo", call: "invoice.draft · credit_note.issue" },
    { id: "impact", name: "Impact", icon: "leaf", stop: 8, did: "Posted the ledger and the BRSR row", call: "ledger.post · brsr.row" },
  ];
  const N = STOPS.length;
  const crewAt = k => CREW.filter(c => c.stop === k);
  const names = k => { const c = crewAt(k).map(x => x.name); return c.length > 1 ? c.slice(0, -1).join(", ") + " and " + c[c.length - 1] : c[0]; };

  // the walk: -1 before it sets off, 0 to 8 at a stop, 9 when it is done. 420 ms a stop, 800 on the yes and 900 while the
  // exits work: 4.64 s, under WCAG 2.2.2's five; at its end at once under reduced motion. It sets off 600 ms after the page
  const STEP = 420, YES = 800, EXEC = 900;
  const stays = k => (STOPS[k].human ? YES : STOPS[k].id === "execute" ? EXEC : STEP);
  function useWalk() {
    const reduce = !!useReducedMotion();
    const [k, setK] = useState(reduce ? N : -1); const [run, setRun] = useState(0);
    useEffect(() => { if (reduce) { setK(N); return; } setK(-1); const t = setTimeout(() => setK(0), 600); return () => clearTimeout(t); }, [run, reduce]);
    useEffect(() => { if (reduce || k < 0 || k >= N) return; const t = setTimeout(() => setK(k + 1), stays(k)); return () => clearTimeout(t); }, [k, reduce]);
    const state = c => (c.stop < k || k >= N ? "done" : c.stop === k ? "now" : "later");
    return { k, reduce, run, playing: k >= 0 && k < N, done: k >= N, state, replay: () => setRun(r => r + 1) };
  }
  // the page's theme, as the kit sets it on <html>
  function useDark() {
    const read = () => document.documentElement.dataset.theme === "dark";
    const [dark, setDark] = useState(read);
    useEffect(() => { const o = new MutationObserver(() => setDark(read())); o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] }); return () => o.disconnect(); }, []);
    return dark;
  }
  const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  function fitCanvas(cv, w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx;
  }
  // the size of an element, as it resizes
  function useSize(ref) {
    const [s, setS] = useState(null);
    useEffect(() => { const el = ref.current; if (!el) return; const f = () => setS({ w: el.clientWidth, h: el.clientHeight }); f(); const o = new ResizeObserver(f); o.observe(el); return () => o.disconnect(); }, [ref.current]);
    return s;
  }
  // the stage's head: the product's mark, its line and what the picture is
  function Head({ children }) {
    return <div className="r2-head">
      <div className="si-product"><Mark size={34} /><Wordmark size={20} /></div>
      <h2 className="r2-title">Ten agents. <span>One yes.</span></h2>
      <p className="si-tagline">Every near-expiry carton gets a second chance, chosen by AI. <span className="hi" lang="hi">हर कार्टन को दूसरा मौका</span></p>
      {children}
    </div>;
  }
  // the band's own head on phones and tablets: the product's mark and its line, small
  const BandHead = () => <div className="r2-bandhead"><Mark size={22} still /><b>Ten agents. <span>One yes.</span></b><span className="by">Smart-Clearance</span></div>;
  // what the batch is doing: before it sets off, at each stop, and when it is done
  function Caption({ w, className }) {
    const s = w.playing ? STOPS[w.k] : null;
    return <div className={cx("r2-caption", s && s.human && "human", className)} aria-hidden="true">
      {w.k < 0 ? <><span className="n">A batch the gates will refuse</span><b>Ten agents and one person take it from here.</b></>
        : s ? <><span className="n">{w.k + 1} of 9 · {s.t}</span><b>{names(w.k)}</b><span className="did">{crewAt(w.k).length > 1 ? "Work the exits at once: the kiranas, the marketplace, a bid" : crewAt(w.k)[0].did}</span></>
        : <><span className="n">9 of 9 · Report</span><b>Sold, not binned.</b><span className="did">Ten agents worked the batch. One person said yes.</span></>}
    </div>;
  }
  // the nine stops in words, for a screen reader, since the picture is hidden from it
  const SrStops = () => <ol className="sr-only" aria-label="How Smart-Clearance's agents work a batch">{STOPS.map((s, i) => <li key={s.id}>{s.t}: {names(i)}. {crewAt(i).map(c => c.did).join(". ")}.</li>)}</ol>;
  const Replay = ({ w }) => (w.reduce ? null : <button type="button" className="btn btn-ghost btn-sm r2-replay" onClick={w.replay} disabled={w.playing}><Icon name="rotate-ccw" size={15} />Replay</button>);
  // an agent's chip: its icon and name; lit once it has worked, wearing the aura while it works
  const Chip = ({ c, st, small }) => <span className={cx("r2-chip", c.human && "human", st, small && "small")}><i><Icon name={c.icon} size={small ? 12 : 14} stroke={2.2} /></i>{c.name}</span>;
  // into the sign-in's ground, behind the card (the ground is the sign-in's first child)
  function Ground({ children }) {
    const [el, setEl] = useState(null);
    useEffect(() => { const f = () => setEl(document.querySelector(".signin > .ground")); f(); const t = setInterval(f, 400); return () => clearInterval(t); }, []);
    return el ? ReactDOM.createPortal(children, el) : null;
  }
  // into the sign-in's own grid, above the card, on a phone or a tablet (no stage there)
  function Band({ children }) {
    const app = useApp(); const [el, setEl] = useState(null);
    useEffect(() => { const f = () => setEl(document.querySelector(".signin")); f(); const t = setInterval(f, 400); return () => clearInterval(t); }, []);
    if (app.bp === "desktop" || !el) return null;
    return ReactDOM.createPortal(<div className="r2-band" aria-hidden="true">{children}</div>, el);
  }
  window.SC195R2 = { EASE, STOPS, CREW, N, crewAt, names, useWalk, useDark, seeded, fitCanvas, useSize, Head, BandHead, Caption, SrStops, Replay, Chip, Ground, Band };
})();
