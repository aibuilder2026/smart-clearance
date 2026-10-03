/* Smart-Clearance design system v2 · kit
   React 18 + framer-motion (UMD global `Motion`), compiled in the browser by Babel standalone.
   Exposes window.SC2: theme, icons, the mark and splash, and every component the prototypes build with. */
(function () {
  const { useState, useEffect, useRef, useMemo, useContext, createContext, useCallback, useLayoutEffect } = React;
  const M = window.Motion || {};
  const motion = M.motion, AnimatePresence = M.AnimatePresence, useReducedMotion = M.useReducedMotion || (() => false);
  const IMG = window.SC2_IMG || "img/";

  /* ---------- numbers ---------- */
  const num = n => new Intl.NumberFormat("en-IN").format(n);
  const inr = n => "₹" + num(Math.round(n));
  const inrDec = n => "₹" + new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const cx = (...a) => a.filter(Boolean).join(" ");

  /* ---------- theme: Day / Night editions, stored per viewer ---------- */
  const ThemeCtx = createContext({ theme: "auto", resolved: "day", setTheme: () => {} });
  function systemPrefers() { try { return window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day"; } catch (e) { return "day"; } }
  function readTheme() { try { return localStorage.getItem("sc2-theme") || "auto"; } catch (e) { return "auto"; } }
  function ThemeProvider({ children, initial }) {
    const [theme, setThemeState] = useState(initial || readTheme());
    const [sys, setSys] = useState(systemPrefers());
    useEffect(() => { try { const mq = window.matchMedia("(prefers-color-scheme: dark)"); const h = () => setSys(mq.matches ? "night" : "day"); mq.addEventListener("change", h); return () => mq.removeEventListener("change", h); } catch (e) {} }, []);
    const setTheme = useCallback(t => { setThemeState(t); try { localStorage.setItem("sc2-theme", t); } catch (e) {} }, []);
    const resolved = theme === "auto" ? sys : theme;
    const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme]);
    return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
  }
  const useTheme = () => useContext(ThemeCtx);
  function ModeSwitch({ onchrome, className }) {
    const { resolved, setTheme } = useTheme(); const night = resolved === "night";
    return <button type="button" role="switch" aria-checked={night} aria-label={night ? "Night edition on; switch to Day" : "Day edition on; switch to Night"} className={cx("modeswitch", onchrome && "onchrome", className)} onClick={() => setTheme(night ? "day" : "night")}>
      <span className="knob"><Icon name={night ? "moon" : "sun"} size={14} /></span>
    </button>;
  }

  /* ---------- container width (the .app is the container, not the window) ---------- */
  const VWCtx = createContext(1440);
  const AppElCtx = createContext(null);
  function VWProvider({ children, targetRef }) {
    const [w, setW] = useState(() => (targetRef.current ? targetRef.current.getBoundingClientRect().width : window.innerWidth));
    // the measured element is usually an ancestor of this provider, so its ref attaches after our layout effect: measure in a passive effect and retry briefly
    useEffect(() => { let ro, raf, tries = 0; const attach = () => { const el = targetRef.current; if (!el) { if (tries++ < 20) raf = requestAnimationFrame(attach); return; } ro = new ResizeObserver(e => setW(e[0].contentRect.width)); ro.observe(el); setW(el.getBoundingClientRect().width); }; attach(); return () => { if (ro) ro.disconnect(); if (raf) cancelAnimationFrame(raf); }; }, [targetRef]);
    return <VWCtx.Provider value={w}><AppElCtx.Provider value={targetRef}>{children}</AppElCtx.Provider></VWCtx.Provider>;
  }
  const useVW = () => useContext(VWCtx);
  const usePhone = () => useVW() < 760;

  /* ---------- icons: one authored set, 24 grid, stroke 1.75, round caps ---------- */
  const ICONS = {
    home: "M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    bell: "M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0",
    grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    sheet: "M5 3h14v18H5zM8 7h8M8 11h8M8 15h5",
    file: "M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6",
    chart: "M4 20h16M7 16V9M12 16V5M17 16v-6",
    camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
    truck: "M2 7h11v9H2zM13 11h5l3 3v2h-8zM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    store: "M4 10 5 4h14l1 6M4 10a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0M5 10v10h14V10M10 20v-6h4v6",
    tag: "M3 12V3h9l9 9-9 9zM8 8h.01",
    chat: "M4 5h16v11H9l-5 4z",
    leaf: "M5 19C5 9 11 5 20 5c0 9-4 15-14 15M5 19c3-5 6-8 10-10",
    play: "M7 5v14l11-7z",
    refresh: "M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5",
    check: "m5 12 5 5 9-10",
    x: "M6 6l12 12M18 6 6 18",
    left: "m14 6-6 6 6 6",
    right: "m10 6 6 6-6 6",
    down: "m6 10 6 6 6-6",
    up: "m6 14 6-6 6 6",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
    users: "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-5-6.7",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.3 3h-4l-.4 2.6a7 7 0 0 0-2 1.2L5.5 6l-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.5h4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z",
    shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6zM9 12l2 2 4-4",
    key: "M14 10a4 4 0 1 0-3.8 2.8L4 19v2h3v-2h2v-2h2l1.2-1.2A4 4 0 0 0 14 10z",
    logout: "M10 4H5v16h5M14 8l5 4-5 4M19 12H9",
    login: "M14 4h5v16h-5M4 12h11M11 8l4 4-4 4",
    sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
    moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
    filter: "M3 5h18l-7 8v6l-4-2v-4z",
    sort: "M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3",
    download: "M12 4v12M7 11l5 5 5-5M4 20h16",
    upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    edit: "M4 20h4l11-11-4-4L4 16zM13 7l4 4",
    trash: "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6",
    more: "M5 12h.01M12 12h.01M19 12h.01",
    arrow: "M4 12h16M14 6l6 6-6 6",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
    calendar: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
    box: "M3 8 12 3l9 5v9l-9 5-9-5zM3 8l9 5 9-5M12 13v9",
    rupee: "M7 4h10M7 9h10M7 4c5 0 7 2 7 5s-2 5-7 5l7 7",
    phone: "M6 3h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z",
    mail: "M3 6h18v12H3zM3 7l9 6 9-6",
    globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
    pin: "M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    alert: "M12 3 2 20h20zM12 10v4M12 17h.01",
    info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01",
    lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
    link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5",
    copy: "M9 9h11v11H9zM5 15V4h11",
    external: "M14 4h6v6M20 4l-9 9M18 13v7H4V6h7",
    spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
    send: "M3 11 21 3l-6 18-4-7z",
    image: "M4 5h16v14H4zM8 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4 17l5-5 4 4 3-3 4 4",
    checkcircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6",
    xcircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 9l6 6M15 9l-6 6",
    dashboard: "M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z",
    doc: "M6 3h12v18H6zM9 8h6M9 12h6M9 16h4",
    history: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2",
    plug: "M9 3v5M15 3v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v3",
    percent: "M5 19 19 5M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    scale: "M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0zM19 7l-3 7a4 4 0 0 0 6 0zM8 21h8",
    flag: "M5 21V4h12l-2 4 2 4H5",
    star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.2L12 17l-5.4 2.9 1-6.2L3.2 9.5l6.1-.9z",
    menu: "M4 7h16M4 12h16M4 17h16",
    bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
    whatsapp: "M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zM9 9c0 4 3 6 6 6l1-2-2-1-1 1a5 5 0 0 1-2-2l1-1-1-2z",
    google: "M12 11v2.5h4.2A4.5 4.5 0 1 1 15 8.6l1.9-1.9A7.2 7.2 0 1 0 19.2 12c0-.4 0-.7-.1-1z",
    language: "M4 5h9M8.5 3v2M11 5c-.5 4-3 7-7 9M6 8c1 3 3 5 6 6M13 20l4-9 4 9M14.5 16.5h5",
    print: "M7 8V3h10v5M5 8h14v8h-3v4H8v-4H5zM8 13h8",
  };
  function Icon({ name, size = 22, stroke = 1.75, className, title }) {
    const d = ICONS[name] || ICONS.info;
    return <svg className={cx("ic", className)} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>{title && <title>{title}</title>}<path d={d} /></svg>;
  }

  /* ---------- the mark: an ultramarine plate, "SC" in two inks, a sun at the corner ---------- */
  function Mark({ size = "md", print = false, className, sun = true }) {
    const reduce = useReducedMotion();
    const anim = print && !reduce;
    return <span className={cx("mark", size !== "md" && size, className)} aria-hidden="true">
      <svg viewBox="0 0 64 64">
        <rect x="3" y="3" width="58" height="58" rx="14" fill="var(--ultra)" stroke="var(--ink-black)" strokeWidth="3" style={anim ? { strokeDasharray: 240, strokeDashoffset: 240, animation: "draw 520ms var(--ease-out) forwards" } : undefined} />
        <g style={anim ? { animation: "fadeup 280ms var(--ease-out) 420ms both" } : undefined}>
          <text x="31" y="45" textAnchor="middle" fontFamily="Bungee Shade, Bungee, sans-serif" fontSize="30" fill="var(--vermilion)" style={anim ? { animation: "register-x 240ms var(--ease-out) 520ms both" } : undefined}>SC</text>
          <text x="31" y="45" textAnchor="middle" fontFamily="Bungee, sans-serif" fontSize="30" fill="var(--chrome)" style={anim ? { animation: "fadeup 260ms var(--ease-out) 640ms both" } : undefined}>SC</text>
        </g>
        {sun && <g transform="translate(52 12)"><g style={anim ? { animation: "stamp 320ms var(--ease-out) 820ms both", transformOrigin: "0px 0px", transformBox: "view-box" } : undefined}>
          <g stroke="var(--ink-black)" strokeWidth="2" strokeLinecap="round">
            {[0, 45, 90, 135, 180, 225, 270, 315].map(a => <line key={a} x1="0" y1="-9" x2="0" y2="-12.5" transform={`rotate(${a})`} />)}
          </g>
          <circle r="7" fill="var(--chrome)" stroke="var(--ink-black)" strokeWidth="2" />
        </g></g>}
      </svg>
    </span>;
  }
  /* the wordmark, two inks, with the face printing into register */
  function Wordmark({ size = 28, print = false, ink = false, className }) {
    const reduce = useReducedMotion(); const anim = print && !reduce;
    return <span className={cx("ink-layered", ink && "ink", anim && "print", className)} style={{ fontSize: size }} aria-label="Smart-Clearance">SMART-CLEARANCE</span>;
  }

  /* ---------- splash: the mark prints itself, once per session ---------- */
  function Splash({ onDone, tagline = "Every carton gets a second chance, chosen by AI.", hindi = "हर कार्टन को दूसरा मौका", hold = 2600 }) {
    const reduce = useReducedMotion();
    const [gone, setGone] = useState(false);
    useEffect(() => { const t = setTimeout(() => finish(), reduce ? 900 : hold); return () => clearTimeout(t); }, []);
    function finish() { if (gone) return; setGone(true); setTimeout(() => onDone && onDone(), 320); }
    return <div className={cx("splash", gone && "out")} onClick={finish} role="button" tabIndex={0} aria-label="Smart-Clearance. Tap to continue." onKeyDown={e => (e.key === "Enter" || e.key === " ") && finish()}>
      <div className="splashin">
        <Mark size="xl" print sun />
        <div style={{ animation: reduce ? "none" : "fadeup 360ms var(--ease-out) 1050ms both" }}><Wordmark size={30} print={!reduce} /></div>
        <p className="tag" style={{ animation: reduce ? "none" : "fadeup 360ms var(--ease-out) 1400ms both" }}>{tagline}</p>
        <p className="tag hi" style={{ animation: reduce ? "none" : "fadeup 360ms var(--ease-out) 1600ms both" }}>{hindi}</p>
      </div>
      <button type="button" className="btn ghost sm skip" onClick={finish}>Skip</button>
    </div>;
  }

  /* ---------- primitives ---------- */
  function Btn({ kind = "secondary", size, full, icon, children, loading, className, type = "button", ...rest }) {
    return <button type={type} className={cx("btn", kind, size, full && "full", className)} aria-busy={loading || undefined} disabled={rest.disabled || loading} {...rest}>
      {loading ? <span className="spinner" /> : icon ? <Icon name={icon} size={18} /> : null}{children}
    </button>;
  }
  function Chip({ tone, solid, mono, lg, icon, dot, children, className }) {
    return <span className={cx("chip", tone, solid && "solid", mono && "mono", lg && "lg", className)}>{dot && <i className="dot" />}{icon && <Icon name={icon} size={14} />}{children}</span>;
  }
  function Plate({ tone, tight, flush, framed, reg, lift, shaded, className, children, as: Tag = "div", ...rest }) {
    return <Tag className={cx("plate", tone, tight && "tight", flush && "flush", framed && "framed", reg && "reg", lift && "lift", shaded && "shaded", className)} {...rest}>{children}</Tag>;
  }
  function Avatar({ person, size = "md", className }) { return <img className={cx("avatar", size, className)} src={person.img} alt={person.name} width={40} height={40} />; }
  function Emblem({ src, name, tone, size = "md", className }) { return <span className={cx("emblem", tone, size, className)}><img src={src} alt={name ? name + " emblem" : ""} /></span>; }
  function Sun({ tone, size = 64, className }) { return <span className={cx("sun", tone, className)} style={{ width: size, height: size }} aria-hidden="true" />; }
  function Spinner({ reg }) { return <span className={reg ? "regspin" : "spinner"} role="status" aria-label="Loading" />; }
  function Skeleton({ h = 14, w, className, style }) { return <span className={cx("skeleton", className)} style={{ display: "block", height: h, width: w || "100%", ...style }} aria-hidden="true" />; }
  function Empty({ icon = "box", title, body, action, emblem }) {
    return <div className="empty">{emblem ? <Emblem src={emblem} size="lg" /> : <span className="emblem md"><Icon name={icon} size={28} /></span>}<b>{title}</b>{body && <p className="t-small">{body}</p>}{action}</div>;
  }
  function CountUp({ value, format = inr, duration = 0.9, className }) {
    const reduce = useReducedMotion(); const [v, setV] = useState(reduce ? value : 0); const from = useRef(0);
    useEffect(() => { if (reduce || !M.animate) { setV(value); return; } const c = M.animate(from.current, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: x => setV(x) }); from.current = value; return () => c.stop(); }, [value]);
    return <span className={cx("num", className)}>{format(v)}</span>;
  }

  /* ---------- forms ---------- */
  function Field({ label, help, error, children, className, id }) {
    return <div className={cx("field", error && "invalid", className)}>{label && <label htmlFor={id}>{label}</label>}{children}{error ? <span className="err" role="alert"><Icon name="alert" size={14} />{error}</span> : help ? <span className="help">{help}</span> : null}</div>;
  }
  function Input({ icon, mono, className, ...rest }) {
    const el = <input className={cx("input", mono && "mono", className)} {...rest} />;
    return icon ? <div className="inputwrap"><Icon name={icon} size={18} />{el}</div> : el;
  }
  function Select({ className, children, ...rest }) { return <select className={cx("select", className)} {...rest}>{children}</select>; }
  function Toggle({ on, onChange, label, className }) { return <button type="button" role="switch" aria-checked={!!on} aria-label={label} className={cx("toggle", className)} onClick={() => onChange(!on)} />; }
  function Stepper({ value, onChange, min = 0, max = 999, step = 1, label = "Quantity" }) {
    return <div className="stepper" role="group" aria-label={label}><button type="button" aria-label="Less" onClick={() => onChange(Math.max(min, value - step))}>−</button><output aria-live="polite">{value}</output><button type="button" aria-label="More" onClick={() => onChange(Math.min(max, value + step))}>+</button></div>;
  }
  function OTP({ value, onChange, length = 6 }) {
    const refs = useRef([]);
    const digits = Array.from({ length }, (_, i) => value[i] || "");
    function set(i, ch) { const d = digits.slice(); d[i] = ch; onChange(d.join("")); if (ch && refs.current[i + 1]) refs.current[i + 1].focus(); }
    return <div className="otp">{digits.map((d, i) => <input key={i} ref={el => refs.current[i] = el} autoFocus={i === 0} inputMode="numeric" pattern="[0-9]*" maxLength={1} value={d} aria-label={`Digit ${i + 1}`} onChange={e => set(i, e.target.value.replace(/\D/g, "").slice(-1))} onKeyDown={e => { if (e.key === "Backspace" && !d && refs.current[i - 1]) refs.current[i - 1].focus(); }} />)}</div>;
  }
  function Segmented({ options, value, onChange, label }) {
    return <div className="segmented" role="group" aria-label={label}>{options.map(o => <button type="button" key={o.id} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.icon && <Icon name={o.icon} size={16} />}{o.label}</button>)}</div>;
  }
  function Tabs({ tabs, value, onChange }) {
    return <div className="tabs" role="tablist">{tabs.map(t => <button type="button" role="tab" key={t.id} aria-selected={value === t.id} onClick={() => onChange(t.id)}>{t.label}{t.badge ? <span className="badge chrome">{t.badge}</span> : null}</button>)}</div>;
  }
  function Menu({ open, onClose, children, align = "right", style }) {
    const ref = useRef();
    useEffect(() => { if (!open) return; const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); }; const k = e => e.key === "Escape" && onClose(); document.addEventListener("mousedown", h); document.addEventListener("keydown", k); return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); }; }, [open]);
    if (!open) return null;
    return <div ref={ref} className="menu" role="menu" style={{ top: "calc(100% + 6px)", [align]: 0, ...style }}>{children}</div>;
  }

  /* ---------- sheet, pushes, toasts ---------- */
  function Sheet({ open, onClose, title, children, footer, side }) {
    const phone = usePhone(); const bottom = side === "bottom" || (side !== "side" && phone);
    const reduce = useReducedMotion();
    const spring = reduce ? { duration: 0.01 } : { type: "spring", stiffness: 420, damping: 40 };
    useEffect(() => { if (!open) return; const k = e => e.key === "Escape" && onClose(); document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [open]);
    const appRef = useContext(AppElCtx); const host = appRef && appRef.current;
    const body = <AnimatePresence>{open && <React.Fragment key="sheet">
      <motion.div key="scrim" className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0.01 : 0.2 }} onClick={onClose} />
      <motion.div key="panel" role="dialog" aria-modal="true" aria-label={title} className={cx("sheet", bottom ? "sheet-bottom" : "sheet-side")} initial={bottom ? { y: "100%" } : { x: "100%" }} animate={{ x: 0, y: 0 }} exit={bottom ? { y: "100%" } : { x: "100%" }} transition={spring}>
        <div className="sh"><h2>{title}</h2><button type="button" className="iconbtn" aria-label="Close" onClick={onClose}><Icon name="x" /></button></div>
        <div className="sb scroll">{children}</div>
        {footer && <div className="sf">{footer}</div>}
      </motion.div>
    </React.Fragment>}</AnimatePresence>;
    return host ? ReactDOM.createPortal(body, host) : body;
  }
  const ToastCtx = createContext({ push: () => {}, toast: () => {} });
  function ToastHost({ children, resetKey }) {
    const [items, setItems] = useState([]); const reduce = useReducedMotion();
    useEffect(() => { setItems([]); }, [resetKey]);
    const push = useCallback(item => { const id = Date.now() + Math.random(); setItems([{ id, kind: "push", ...item }]); setTimeout(() => setItems(s => s.filter(x => x.id !== id)), item.ttl || 7000); }, []);
    const toast = useCallback(item => { const id = Date.now() + Math.random(); setItems(s => [...s.filter(x => x.kind === "push"), { id, kind: "toast", ...item }]); setTimeout(() => setItems(s => s.filter(x => x.id !== id)), item.ttl || 3200); }, []);
    const value = useMemo(() => ({ push, toast }), [push, toast]);
    return <ToastCtx.Provider value={value}>{children}
      <div className="toasts" aria-live="polite">
        <AnimatePresence>{items.map(it => it.kind === "push"
          ? <motion.div key={it.id} className={cx("push", it.hindi && "hindi")} initial={reduce ? { opacity: 0 } : { y: -24, opacity: 0, filter: "drop-shadow(-6px 0 0 var(--chrome)) drop-shadow(6px 0 0 var(--vermilion))" }} animate={{ y: 0, opacity: 1, filter: "drop-shadow(0 0 0 var(--chrome)) drop-shadow(0 0 0 var(--vermilion))" }} exit={{ y: -12, opacity: 0 }} transition={reduce ? { duration: 0.01 } : { type: "spring", stiffness: 500, damping: 34 }}>
              <Mark size="sm" sun={false} />
              <div><div className="pt"><span>{it.title}</span><span className="pwhen">{it.at || "now"}</span></div><div className="pb">{it.body}</div></div>
              <div className="pa">{it.go ? <button type="button" className="btn onchrome sm" onClick={() => { setItems(s => s.filter(x => x.id !== it.id)); it.go(); }}>Open</button> : <button type="button" className="iconbtn onchrome" aria-label="Dismiss" onClick={() => setItems(s => s.filter(x => x.id !== it.id))}><Icon name="x" size={18} /></button>}</div>
            </motion.div>
          : <motion.div key={it.id} className={cx("toast", it.tone)} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0.01 : 0.22 }}>{it.icon && <Icon name={it.icon} size={18} />}<span>{it.title}{it.body && <span className="muted"> · {it.body}</span>}</span></motion.div>)}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>;
  }
  const useToasts = () => useContext(ToastCtx);

  /* ---------- chrome ---------- */
  function Shell({ nav, current, onNav, who, onWho, children, badge, footer }) {
    const [menu, setMenu] = useState(false);
    return <div className="shell">
      <nav className="rail" aria-label="Sections">
        <Mark />
        {nav.map(n => <button type="button" key={n.id} className="nav" aria-current={current === n.id ? "page" : undefined} onClick={() => onNav(n.id)}><Icon name={n.icon} /><span>{n.label}</span>{n.badge ? <span className="badge chrome">{n.badge}</span> : null}</button>)}
        <div className="railfoot">{who && <button type="button" className="iconbtn onchrome" style={{ width: "auto", height: "auto", padding: 4, display: "grid", gap: 4, justifyItems: "center" }} aria-label={"Account: " + who.name} onClick={onWho}><Avatar person={who} size="md" /><span style={{ fontSize: 12 }}>{who.short || who.name.split(" ")[0]}</span></button>}{footer}</div>
      </nav>
      <div className="main scroll">{children}</div>
      <nav className="bnav" aria-label="Sections">
        {nav.slice(0, 5).map(n => <button type="button" key={n.id} aria-current={current === n.id ? "page" : undefined} onClick={() => onNav(n.id)}><Icon name={n.icon} size={22} /><span>{n.label}</span>{n.badge ? <span className="badge chrome">{n.badge}</span> : null}</button>)}
      </nav>
    </div>;
  }
  function TopBar({ title, who, sub, back, onBack, runhead, actions, unread, onBell, children }) {
    return <header className="topbar">
      {back ? <button type="button" className="backbtn" onClick={onBack}><Icon name="left" size={20} />{back === true ? "Back" : back}</button> : who ? <div className="who"><Avatar person={who} size="md" /><div><b>{who.name}</b><span>{sub || who.role}</span></div></div> : title ? <h1>{title}</h1> : null}
      <div className="grow">{runhead && <div className="runhead" aria-label="Where you are">{runhead}</div>}</div>
      {children}
      {actions}
      {onBell && <button type="button" className="iconbtn" aria-label={unread ? `${unread} unread notifications` : "Notifications"} onClick={onBell}><Icon name="bell" />{unread ? <span className="badge">{unread}</span> : null}</button>}
      <ModeSwitch />
    </header>;
  }
  function RunHead({ parts }) { return parts.map((p, i) => <React.Fragment key={i}>{i > 0 && <i>·</i>}<span className={p.hot ? "hot" : undefined}>{p.b ? <b>{p.b}</b> : null}{p.b && p.t ? " " : ""}{p.t}</span></React.Fragment>); }

  /* ---------- data components ---------- */
  function Ticks({ total, remaining, tone, tall, label }) {
    const n = Math.max(1, total); const left = Math.max(0, Math.min(n, remaining));
    return <div className={cx("ticks", tone, tall && "tall")} style={{ "--n": n }} role="img" aria-label={label || `${remaining} of ${total} remaining`}>{Array.from({ length: n }, (_, i) => <i key={i} className={i < n - left ? "off" : undefined} />)}</div>;
  }
  function Tape({ total, segments, capLabel }) {
    const used = segments.reduce((a, s) => a + s.value, 0); const over = used > total;
    return <div className="stack-sm">
      <div className="tapehead"><span>0</span><span>{over ? "over by " + num(used - total) : num(total - used) + " free"}</span><span>{num(total)}{capLabel ? " " + capLabel : ""}</span></div>
      <div className={cx("tape", over && "over")} role="img" aria-label={segments.map(s => `${s.label} ${num(s.value)}`).join(", ") + ` of ${num(total)}`}>
        {segments.map(s => <i key={s.id} className={s.id} style={{ flex: `0 0 ${Math.min(100, (s.value / total) * 100)}%` }} title={`${s.label}: ${num(s.value)}`}>{(s.value / total) > 0.14 ? s.label : ""}</i>)}
      </div>
    </div>;
  }
  function LiveTile({ value, label, tone, format = x => x, className }) {
    const reduce = useReducedMotion();
    return <div className={cx("tile", tone, className)}>
      <div className="tv" aria-live="polite"><AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={String(value)} style={{ display: "inline-block" }} initial={reduce ? { opacity: 0 } : { rotateX: 90, opacity: 0, y: -10 }} animate={{ rotateX: 0, opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { rotateX: -90, opacity: 0, y: 10 }} transition={{ duration: reduce ? 0.01 : 0.32, ease: [0.16, 1, 0.3, 1] }}>{format(value)}</motion.span>
      </AnimatePresence></div>
      <div className="tl">{label}</div>
    </div>;
  }
  /* duration-true: items carry `minutes` since the previous one; the gap above is proportional, capped */
  function Timeline({ items, scale = 0.6, cap = 64 }) {
    return <div className="timeline">{items.map((it, i) => { const gap = i === 0 ? 0 : Math.min(cap, Math.round((it.minutes || 0) * scale)); return <div key={it.id || i} className={cx("tl", it.state, it.human && "human")} style={{ "--gap": gap }}>
      {gap >= 28 && it.minutes >= 60 && <span className="gapnote">{it.minutes >= 1440 ? Math.round(it.minutes / 1440) + " d" : Math.round(it.minutes / 60) + " h"} later</span>}
      <i><Icon name={it.state === "done" ? "check" : it.human ? "user" : it.icon || "spark"} size={16} /></i>
      <div className="tt"><b>{it.who}</b> {it.text}<small>{it.at}</small></div>
    </div>; })}</div>;
  }
  function Stages({ steps, now }) { return <div className="stages" aria-label="Progress">{steps.map((s, i) => <div key={s} className={cx("st", i < now && "done", i === now && "now")}><i />{s}</div>)}</div>; }
  function Door({ door, selected, onPick, pickLabel }) {
    return <div className={cx("door", door.cls, selected && "sel")}>
      <div className="dh"><span>{door.short || door.name}</span>{selected && <Icon name="check" size={14} />}</div>
      <div className="db"><span className="dv">{door.net < 0 ? "−" + inr(-door.net) : inr(door.net)}<small className="t-xs muted"> /ctn</small></span><span className="dn">{door.name}</span><span className="dr">{door.rule}</span>{onPick && <Btn size="sm" kind={selected ? "secondary" : "primary"} onClick={() => onPick(door)}>{selected ? "Picked" : pickLabel || "Pick"}</Btn>}</div>
    </div>;
  }
  function Label({ batch, product, hot, onOpen, img, action, children, state }) {
    const st = state || batch.zone;
    const ticksTotal = 12, rem = Math.max(0, Math.min(12, Math.round((batch.days / 180) * 12)));
    const open = e => { if (!onOpen) return; if (e.target.closest && e.target.closest("button, a") && e.target.closest("button, a") !== e.currentTarget) return; onOpen(e); };
    return <div role={onOpen ? "button" : undefined} tabIndex={onOpen ? 0 : undefined} className={cx("label", st === "zepto" || st === "blinkit" ? "gated" : st, hot && "hot", onOpen && "clickable")} onClick={open} onKeyDown={e => { if (onOpen && (e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); onOpen(e); } }} aria-label={`${product.name}, ${batch.days} days left, ${batch.cartons} cartons at ${batch.where}`}>
      {hot && <span className="ring" aria-hidden="true" />}
      <div className="lh"><span>{product.brand || "MUNCHLY"}</span><span className="id">{batch.id}</span></div>
      <div className="lb">
        <div className="ln">{product.name}</div>
        <div className="ld"><span className="big">{batch.days}</span><small>days left</small></div>
        <Ticks total={ticksTotal} remaining={rem} tone={st === "risk" ? "risk" : st === "safe" || st === "cleared" ? "safe" : "gated"} label={`${batch.days} of 180 days left`} />
        <div className="lm"><span>{num(batch.cartons)} ctn</span><span>{batch.where}</span></div>
        {batch.binCost && st === "risk" && <div className="loss">{inr(batch.binCost)} if binned</div>}
        {children}
        {img && <img className="plateimg" src={img} alt="" />}
      </div>
      <div className="lf"><span>Best before {batch.bestBefore}</span>{action || <span className="chip mono">{batch.sell} /day</span>}</div>
    </div>;
  }
  function Notice({ who = "Watcher", when, children, tone }) {
    return <Plate className="notice" reg>
      <div className="nh"><span className="sunwrap"><Sun size={52} tone={tone} /><Mark size="md" sun={false} /></span><div><b>{who}</b><small>{when}</small></div></div>
      {children}
    </Plate>;
  }
  function Gate({ app, rule, ok }) { return <div className="gate"><span><b>{app}</b> <span className="muted">{rule}</span></span><Chip tone={ok ? "emerald" : "vermilion"} icon={ok ? "check" : "x"}>{ok ? "takes it" : "closed"}</Chip></div>; }

  /* ---------- registration wrapper for arrivals ---------- */
  function Register({ children, delay = 0, className, as: Tag = "div" }) { return <Tag className={cx("register", className)} style={{ animationDelay: delay + "ms" }}>{children}</Tag>; }
  function Stagger({ children, className }) { return <div className={cx("stagger", className)}>{children}</div>; }

  window.SC2 = { num, inr, inrDec, cx, ThemeProvider, useTheme, ModeSwitch, VWProvider, useVW, usePhone, ICONS, Icon, Mark, Wordmark, Splash, Btn, Chip, Plate, Avatar, Emblem, Sun, Spinner, Skeleton, Empty, CountUp, Field, Input, Select, Toggle, Stepper, OTP, Segmented, Tabs, Menu, Sheet, ToastHost, useToasts, Shell, TopBar, RunHead, Ticks, Tape, LiveTile, Timeline, Stages, Door, Label, Notice, Gate, Register, Stagger, IMG };
})();
