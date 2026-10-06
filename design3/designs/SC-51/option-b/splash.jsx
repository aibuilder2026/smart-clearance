// SC-51 · option B · the handover. No curtain: the console is built in front of you as its reads land. When Sign in
// has said who is in, the card's mark travels to the sidebar's brand, the sidebar slides in with its items arriving one
// by one, and the Overview stands as its shape (SC-49's placeholders) under the route, each block taking its heading as
// its read lands, until everything is in and the content rises into place. Signing out folds the page back: the blocks
// return to their bones as the session closes, the sidebar slides away, and the mark travels back to the sign-in card.
// Signed out, the first load holds the sign-in's form as bones under the route until the platform has answered.
(function () {
  const { useState, useEffect, useLayoutEffect, useRef } = React;
  const { motion, AnimatePresence, useReducedMotion, animate } = Motion;
  const SH = window.SC51_SHARED, K = window.SC3;
  const { cx, useApp } = K;
  const MIN = { boot: 1000, enter: 900, leave: 800 }, MAX = 8000;
  // the Overview's shape, each block tagged with the read that fills it and the heading it takes when that read is in
  const SHAPE = [
    { kind: "bar", h: 28, cols: 1, w: 0.38, read: "clients" },
    { kind: "tile", h: 132, cols: 4, read: "dashboard", heads: ["Recovered, 30 days", "Batches in flight", "Waiting for a yes", "Agent runs today"] },
    { kind: "card", h: 300, cols: 1, read: "batches", heads: ["Agents at work"] },
    { kind: "card", h: 300, cols: 1, read: "runs", heads: ["Recovered, by day"] },
    { kind: "bar", h: 40, cols: 1, w: 0.3, read: "runs" },
    { kind: "row", h: 58, cols: 1, read: "runs" }, { kind: "row", h: 58, cols: 1, read: "runs" }, { kind: "row", h: 58, cols: 1, read: "runs" },
  ];
  const LEAVE_HEADS = { "session-end": "Closing your session", firebase: "Signed out" };
  function Bones({ kind }) {
    if (kind === "tile") return <><i className="b w40" /><i className="b big w60" /><i className="b spark" /></>;
    if (kind === "card") return <><i className="b w30" /><i className="b w20 thin" /><i className="b area" /></>;
    if (kind === "row") return <><i className="b dot" /><span className="col"><i className="b w50" /><i className="b w30 thin" /></span><i className="b w10" /></>;
    return <i className="b fill" />;
  }
  // the route along the top of a region: it eases most of the way, then completes and lands its pin
  function Route({ done }) {
    const reduce = useReducedMotion();
    return <div className="cs-route sc51b-route" aria-hidden="true">
      <motion.i className="line" initial={{ width: reduce ? "88%" : "0%" }} animate={{ width: done ? "100%" : "88%" }} transition={done ? { duration: reduce ? 0 : 0.16, ease: SH.EASE } : { duration: reduce ? 0 : 1.2, ease: [0.3, 0.7, 0.4, 1] }}>
        <motion.b className="pin" initial={false} animate={done ? { scale: [0, 1.35, 1] } : { scale: 0.6 }} transition={{ duration: reduce ? 0 : 0.42, ease: SH.EASE, delay: done && !reduce ? 0.12 : 0 }} />
      </motion.i>
    </div>;
  }
  // the Overview's shape over the page while its reads land: a block takes its heading when its read is in; when
  // everything is in the blocks lift away (bottom first), and the real page is under them
  function Veil({ reads, leaving, box, who, lifting }) {
    const app = useApp(); const phone = app.bp === "phone"; let n = 0;
    const landed = id => reads.steps.some(s => s.id === id && s.at != null);
    const headsFor = (row, i) => (row.heads && (leaving ? false : landed(row.read)) ? row.heads[i % row.heads.length] : null);
    if (!box) return null;
    return <div className={cx("sc51b-veil", lifting && "lift", leaving && "leaving")} style={{ left: box.left, top: box.top, width: box.width, height: box.height }} role="status" aria-busy="true">
      <span className="sr-only">{leaving ? "Signing you out." : `Signed in. Opening the console for ${who}.`}</span>
      <Route done={reads.done} />
      <div className="sc51b-page">
        <div className="sc51b-title">{leaving ? (landed("firebase") ? "Signed out" : "Signing you out") : "Overview"}</div>
        <div className="cs-ph">{SHAPE.map((row, r) => {
          const many = phone ? Math.min(row.cols, row.kind === "tile" ? 2 : 1) : row.cols, inn = leaving ? !landed(row.read === "clients" ? "session-end" : "session-end") : landed(row.read);
          return <div key={r} className={cx("cs-ph-row", "k-" + row.kind)} style={{ gridTemplateColumns: `repeat(${many}, minmax(0, 1fr))`, width: typeof row.w === "number" ? row.w * 100 + "%" : undefined, "--r": r }}>
            {Array.from({ length: many }, () => n++).map(i => { const head = headsFor(row, i); return <div key={i} className={cx("cs-ph-blk", "k-" + row.kind, inn && "in")} style={{ height: phone && row.kind === "card" ? Math.min(row.h, 220) : row.h, "--i": i }}>
              {head ? <span className="sc51b-head">{head}</span> : null}<Bones kind={row.kind} /></div>; })}
          </div>; })}</div>
      </div>
    </div>;
  }
  // a mark that travels from one place to another (the card's to the sidebar's, or back), as a copy over the page
  function Flyer({ from, to, size, onDone }) {
    const ref = useRef(null);
    useLayoutEffect(() => {
      const el = ref.current; if (!el || !from || !to) { onDone && onDone(); return; }
      el.style.left = from.left + "px"; el.style.top = from.top + "px"; el.style.width = from.width + "px"; el.style.height = from.height + "px";
      const c = animate(el, { x: to.left + to.width / 2 - (from.left + from.width / 2), y: to.top + to.height / 2 - (from.top + from.height / 2), scale: to.width / from.width }, { type: "spring", stiffness: 220, damping: 26, mass: 1 });
      const t = setTimeout(() => onDone && onDone(), 780);
      return () => { c.stop(); clearTimeout(t); };
    }, []);
    return <div ref={ref} className="sc51b-flyer" aria-hidden="true"><SH.LoadMark size={size} drawn={1} /></div>;
  }

  function Stage({ phase, me, reads, signin, console: cs, onDone }) {
    const reduce = useReducedMotion(); const app = useApp(); const phone = app.bp === "phone";
    const prev = useRef(phase); const fromRef = useRef(null); const born = useRef(performance.now());
    if (prev.current !== phase) {
      born.current = performance.now();
      const m = document.querySelector(phase === "enter" ? ".si-ws .mark" : ".sb-brand .mark, .sidebar .mark");
      fromRef.current = m ? m.getBoundingClientRect() : null; prev.current = phase;
    }
    const covering = phase === "boot" || phase === "enter" || phase === "leave";
    const [box, setBox] = useState(null); const [fly, setFly] = useState(null); const [flown, setFlown] = useState(false); const [lifting, setLifting] = useState(false); const [sidebarIn, setSidebarIn] = useState(true);
    const root = useRef(null);
    useEffect(() => { setFly(null); setFlown(false); setLifting(false); setSidebarIn(true); }, [phase]);
    // where the page is, so the veil can stand over it, and where the mark should land
    const measure = () => { const sc = root.current && root.current.querySelector(".scroll"); if (sc) { const r = sc.getBoundingClientRect(); setBox({ left: r.left, top: r.top, width: r.width, height: r.height }); } };
    useLayoutEffect(() => {
      if (phase === "enter" || (phase === "boot" && me) || phase === "leave") {
        measure();
        if (phase === "enter" && !reduce) {
          const sb = root.current.querySelector(".sidebar, .tabbar"), brand = root.current.querySelector(".sb-brand .mark, .sidebar .mark");
          if (sb && brand && fromRef.current) { const was = sb.style.animation; sb.style.animation = "none"; const to = brand.getBoundingClientRect(); sb.style.animation = was; setFly({ from: fromRef.current, to, size: fromRef.current.width }); } else setFlown(true);
        } else setFlown(true);
      } else setBox(null);
      const ro = () => measure(); window.addEventListener("resize", ro); return () => window.removeEventListener("resize", ro);
    }, [phase]);
    // everything in and shown long enough: the blocks lift (entering), or the sidebar leaves and the mark goes back (leaving)
    const ready = reads.done || performance.now() - born.current > MAX;
    useEffect(() => {
      if (!covering || !ready) return;
      const wait = Math.max(0, MIN[phase] - (performance.now() - born.current)) + (reduce ? 400 : 200);
      const t = setTimeout(() => {
        if (phase === "leave") {
          setSidebarIn(false);
          const brand = fromRef.current;
          setTimeout(() => {
            const m = document.querySelector(".si-ws .mark"); const to = m ? m.getBoundingClientRect() : null;
            if (!reduce && brand && to) setFly({ from: brand, to, size: brand.width, back: true }); else onDone();
          }, reduce ? 0 : 60);
        } else { setLifting(true); setTimeout(onDone, reduce ? 0 : 520); }
      }, wait);
      return () => clearTimeout(t);
    }, [ready, covering, phase]);
    const who = me ? me.name.split(" ")[0] : "";
    // signed out, the first load: the sign-in with its form as bones under the route until the platform answers
    const bootSignedOut = phase === "boot" && !me;
    const leaving = phase === "leave";
    // while leaving, the console stays until the session has closed; then the sign-in stands, and the mark goes back to it
    const showConsole = phase === "console" || phase === "enter" || (phase === "boot" && me) || (leaving && sidebarIn);
    return <div ref={root} className={cx("sc51b-stage", phase, phone && "phone", (phase === "enter" || (phase === "boot" && me)) && "assembling", leaving && !sidebarIn && "withdrawing", bootSignedOut && "bones")} aria-busy={covering || undefined}>
      {showConsole && <div className={cx("sc51b-console", fly && !flown && !fly.back && "mark-hidden")} inert={covering ? "" : undefined}>{cs}</div>}
      {(phase === "signin" || bootSignedOut || (leaving && !sidebarIn) || (phase === "enter" && !flown)) && <div className={cx("sc51b-signin", phase === "enter" && "folding", leaving && "arriving", fly && fly.back && !flown && "mark-hidden")} inert={covering ? "" : undefined}>{signin}
        {bootSignedOut && <div className="sc51b-formveil" role="status" aria-busy="true"><span className="sr-only">Opening the console.</span><Route done={reads.done} /></div>}
      </div>}
      {covering && !bootSignedOut && <Veil reads={reads} leaving={leaving} box={box} who={who} lifting={lifting} />}
      {fly && !flown && <Flyer from={fly.from} to={fly.to} size={fly.size} onDone={() => { setFlown(true); if (fly.back) onDone(); }} />}
    </div>;
  }
  window.SC51 = { Stage };
})();
