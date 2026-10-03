// Smart-Clearance prototype · component kit (icons, buttons, chips, sheet, toasts, count-ups, shell)
(function () {
  const { useState, useEffect, useRef, useContext, createContext } = React;
  const { motion, AnimatePresence, animate, useReducedMotion } = Motion;
  const D = window.SC_DATA;

  // ---------- formatters ----------
  function num(n) { const neg = n < 0; n = Math.abs(Math.round(n)); let s = String(n); if (s.length > 3) { const last = s.slice(-3); let rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ","); s = rest + "," + last; } return (neg ? "−" : "") + s; }
  function inr(n) { const neg = n < 0; return (neg ? "−" : "") + "₹" + num(Math.abs(n)); }
  function inrDec(n) { return "₹" + n.toFixed(2); }

  // ---------- icons (one stroke, one weight) ----------
  const P = {
    home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
    file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 13h6M9 17h6" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
    truck: <><path d="M2 7h11v9H2zM13 10h4l3 3v3h-7z" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
    store: <><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9h18v3a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" /><path d="M5 14v6h14v-6" /></>,
    tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.5" /></>,
    chat: <><path d="M4 5h16v11H9l-5 4z" /></>,
    leaf: <><path d="M20 4c-9 0-15 5-15 13a4 4 0 0 0 4 3c8 0 11-6 11-16z" /><path d="M5 20c4-5 8-8 12-10" /></>,
    check: <path d="M5 12l5 5L20 7" />,
    x: <path d="M6 6l12 12M18 6L6 18" />,
    right: <path d="M9 6l6 6-6 6" />, left: <path d="M15 6l-6 6 6 6" />,
    arrow: <path d="M4 12h16M14 6l6 6-6 6" />,
    plus: <path d="M12 5v14M5 12h14" />, minus: <path d="M5 12h14" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    pin: <><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" /><circle cx="12" cy="10" r="2.5" /></>,
    download: <path d="M12 4v11M7 10l5 5 5-5M4 20h16" />,
    send: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />,
    refresh: <><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" /></>,
    play: <path d="M7 4l12 8-12 8z" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M19 14v6H4V5h6" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
    phone: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>,
    scan: <><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" /><path d="M4 12h16" /></>,
    box: <><path d="M3 7l9-4 9 4v10l-9 4-9-4z" /><path d="M3 7l9 4 9-4M12 11v10" /></>,
    rupee: <path d="M6 4h12M6 9h12M6 4c6 0 8 2 8 5s-2 5-8 5l8 6" />,
    logout: <><path d="M10 4H5v16h5" /><path d="M14 8l4 4-4 4M18 12H9" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  };
  function Icon({ name, size = 22, stroke = 1.75, className }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={{ flex: "none" }}>{P[name] || P.info}</svg>;
  }

  // ---------- atoms ----------
  function Avatar({ who, size = 36, className = "" }) { const p = D.people[who] || D.people.priya; return <img className={"avatar " + className} src={p.img} alt={p.name} width={size} height={size} style={{ width: size, height: size }} loading="lazy" />; }
  function Mark({ size = "" }) { return <div className={"mark " + size} aria-label="Smart-Clearance agent">SC<i /></div>; }
  function Btn({ variant = "primary", size = "", icon, iconRight, children, full, loading, ...rest }) {
    return <button type="button" className={["btn", variant, size, full ? "full" : ""].join(" ")} {...rest} disabled={rest.disabled || loading}>{loading ? <span className="spin" aria-hidden="true" /> : icon ? <Icon name={icon} size={18} /> : null}{children}{iconRight ? <Icon name={iconRight} size={18} /> : null}</button>;
  }
  function Chip({ tone = "", mono, children, icon }) { return <span className={["chip", tone, mono ? "mono" : ""].join(" ")}>{icon ? <Icon name={icon} size={14} /> : null}{children}</span>; }

  // ---------- count-up ----------
  function CountUp({ to, format = inr, duration = 0.9, delay = 0 }) {
    const ref = useRef(null); const reduced = useReducedMotion(); const from = useRef(0);
    useEffect(() => { const el = ref.current; if (!el) return; if (reduced) { el.textContent = format(to); from.current = to; return; }
      const c = animate(from.current, to, { duration, delay, ease: [0.2, 0.8, 0.2, 1], onUpdate: v => { el.textContent = format(v); } }); from.current = to; return () => c.stop(); }, [to]);
    return <span ref={ref} className="num">{format(0)}</span>;
  }

  // ---------- viewport context (phone / tablet / desktop by the app's own width) ----------
  const VWContext = createContext("desktop");
  function useVW() { return useContext(VWContext); }
  function VWProvider({ el, children }) {
    const [vw, setVw] = useState("desktop");
    useEffect(() => { if (!el) return; const ro = new ResizeObserver(([e]) => { const w = e.contentRect.width; setVw(w < 760 ? "phone" : w < 1100 ? "tablet" : "desktop"); }); ro.observe(el); return () => ro.disconnect(); }, [el]);
    return <VWContext.Provider value={vw}>{children}</VWContext.Provider>;
  }

  // ---------- sheet: bottom sheet on phones, side panel elsewhere ----------
  function Sheet({ open, onClose, title, children, footer }) {
    const vw = useVW(); const phone = vw === "phone";
    useEffect(() => { if (!open) return; const k = e => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [open]);
    return <AnimatePresence>{open && <>
      <motion.div key="scrim" className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} />
      <motion.section key="sheet" role="dialog" aria-modal="true" aria-label={title} className={"sheet " + (phone ? "sheet-bottom" : "sheet-side")}
        initial={phone ? { y: "100%" } : { x: "100%" }} animate={{ x: 0, y: 0 }} exit={phone ? { y: "100%" } : { x: "100%" }} transition={{ type: "spring", stiffness: 420, damping: 40, mass: 0.9 }}>
        <div className="sh"><h2>{title}</h2><button type="button" className="xbtn" onClick={onClose} aria-label="Close"><Icon name="x" /></button></div>
        <div className="sb scroll">{children}</div>
        {footer ? <div className="sf">{footer}</div> : null}
      </motion.section></>}</AnimatePresence>;
  }

  // ---------- toasts: one push at a time, cleared when the signed-in person changes ----------
  const ToastContext = createContext({ push: () => {} });
  function useToasts() { return useContext(ToastContext); }
  function ToastHost({ children, resetKey }) {
    const [items, setItems] = useState([]);
    useEffect(() => { setItems([]); }, [resetKey]);
    const push = t => { const id = Date.now() + Math.random(); setItems([{ ...t, id }]); setTimeout(() => setItems(x => x.filter(i => i.id !== id)), t.ttl || 5200); };
    const dismiss = id => setItems(x => x.filter(i => i.id !== id));
    return <ToastContext.Provider value={{ push }}>{React.Children.toArray(children)}
      <div className="toasts" aria-live="polite"><AnimatePresence>{items.map(t => <motion.div key={t.id} className="push" initial={{ y: -70, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -40, opacity: 0, scale: 0.96 }} transition={{ type: "spring", stiffness: 500, damping: 34 }}>
        <Mark size="sm" /><div><div className="pt"><span>{t.title}</span><span className="pwhen">now</span></div><div className={"pb " + (t.hindi ? "hindi" : "")}>{t.body}</div></div>
        <div className="pa">{t.action ? <Btn size="sm" variant="secondary" onClick={() => { dismiss(t.id); t.action(); }}>{t.actionLabel || "Open"}</Btn> : <button type="button" className="xbtn" aria-label="Dismiss" onClick={() => dismiss(t.id)}><Icon name="x" size={18} /></button>}</div>
      </motion.div>)}</AnimatePresence></div>
    </ToastContext.Provider>;
  }

  // ---------- shell: rail on wide, bottom nav on phones ----------
  function Shell({ role, screen, onNav, badge = 0, onSignOut, children }) {
    const r = D.roles.find(x => x.id === role); const who = D.people[r.who];
    const items = r.nav.map(([id, label, icon]) => ({ id, label, icon }));
    return <div className="shell">
      <nav className="rail" aria-label="Sections">
        <Mark />
        {items.map(it => <button type="button" key={it.id} aria-current={screen === it.id ? "page" : undefined} onClick={() => onNav(it.id)}><Icon name={it.icon} />{it.label}{it.id === "inbox" && badge ? <span className="badge">{badge}</span> : null}</button>)}
        <div className="railwho"><Avatar who={r.who} size={40} /><span>{who.short}</span><button type="button" className="btn ghost sm" onClick={onSignOut} aria-label="Sign out"><Icon name="logout" size={16} />Sign out</button></div>
      </nav>
      <div className="main scroll">{children}</div>
      <nav className="bnav" aria-label="Sections">{items.map(it => <button type="button" key={it.id} aria-current={screen === it.id ? "page" : undefined} onClick={() => onNav(it.id)}><Icon name={it.icon} size={22} />{it.label}{it.id === "inbox" && badge ? <span className="sr">, {badge} unread</span> : null}</button>)}</nav>
    </div>;
  }
  function TopBar({ who, title, sub, back, onBack, badge = 0, onBell, children }) {
    return <header className="topbar">
      {back ? <button type="button" className="backbtn" onClick={onBack}><Icon name="left" size={20} />{back}</button> : <div className="who"><Avatar who={who} size={36} /><div><b>{title}</b><span>{sub}</span></div></div>}
      <div className="grow" />{children}
      {onBell ? <button type="button" className="bell" onClick={onBell} aria-label={badge ? badge + " unread notifications" : "Notifications"}><Icon name="bell" />{badge ? <span className="badge" aria-hidden="true">{badge}</span> : null}</button> : null}
    </header>;
  }

  // ---------- status steps + agent timeline ----------
  function Steps({ items, current }) { return <div className="stepper-h" aria-label="Progress">{items.map((s, i) => <div key={s} className={"st " + (i < current ? "done" : i === current ? "now" : "")}><i /><span>{s}</span></div>)}</div>; }
  function Timeline({ stage }) {
    return <div className="timeline">{D.timeline.map((t, i) => { const done = stage >= t.stage; const now = !done && (i === 0 || stage >= D.timeline[i - 1].stage); return <div key={t.id} className={"tl " + (done ? "done" : now ? "now" : "todo")}><i>{done ? <Icon name="check" size={14} /> : t.human ? <Icon name="user" size={14} /> : <Icon name="clock" size={14} />}</i><div className="tt"><b>{t.who}</b> · {t.text}<small>{t.at}</small></div></div>; })}</div>;
  }

  // ---------- motion presets ----------
  const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] } };
  const stagger = (i, base = 0.05) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: i * base, ease: [0.2, 0.8, 0.2, 1] } });

  Object.assign(window, { SC: { num, inr, inrDec, Icon, Avatar, Mark, Btn, Chip, CountUp, useVW, VWProvider, Sheet, useToasts, ToastHost, Shell, TopBar, Steps, Timeline, fadeUp, stagger } });
})();
