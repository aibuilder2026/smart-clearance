// Smart-Clearance design system v3 · kit: theme and width context, icons, controls, overlays, shell
(function () {
  const { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, createContext, useContext, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const ICONS = window.SC3_ICONS || {};
  const cx = (...a) => a.filter(Boolean).join(" ");

  /* ---------- theme: light, dark, or follow the device ---------- */
  const ThemeCtx = createContext({ mode: "system", resolved: "light", setMode: () => {} });
  const TKEY = "sc3-theme";
  // gate (optional): a page that has to cover a change of theme (the landing page's loader, SC-35) is handed each change
  // that would turn the page, as { to, apply }, and returns a promise; it calls apply() under its cover. A choice made
  // while a change is still playing waits for it, and only the last one counts.
  const resolvedOf = (m, dark) => (m === "system" ? (dark ? "dark" : "light") : m);
  function ThemeProvider({ children, initial, gate }) {
    const [mode, setModeState] = useState(() => { try { return localStorage.getItem(TKEY) || initial || "system"; } catch (e) { return initial || "system"; } });
    const mq = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;
    const [sysDark, setSysDark] = useState(mq ? mq.matches : false);
    const live = useRef(null), turning = useRef(false), next = useRef(null);
    const through = (to, apply) => {
      turning.current = true;
      Promise.resolve(live.current.gate({ to, apply })).then(() => {
        turning.current = false; const n = next.current; next.current = null;
        if (n != null) live.current.setMode(n);
      });
    };
    const setMode = m => {
      try { localStorage.setItem(TKEY, m); } catch (e) {}
      const L = live.current;
      if (turning.current) { next.current = m; return; }
      const to = resolvedOf(m, L.sysDark);
      if (!L.gate || to === resolvedOf(L.mode, L.sysDark)) setModeState(m); else through(to, () => setModeState(m));
    };
    live.current = { mode, sysDark, gate, setMode };
    // the device turning to night, or to day, while the page follows it goes through the gate too
    useEffect(() => {
      if (!mq) return;
      const f = e => { const L = live.current; if (L.gate && L.mode === "system" && !turning.current) through(e.matches ? "dark" : "light", () => setSysDark(e.matches)); else setSysDark(e.matches); };
      mq.addEventListener ? mq.addEventListener("change", f) : mq.addListener(f);
      return () => { mq.removeEventListener ? mq.removeEventListener("change", f) : mq.removeListener(f); };
    }, []);
    const resolved = resolvedOf(mode, sysDark);
    useEffect(() => {
      document.documentElement.setAttribute("data-theme", resolved);
      const meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (meta) meta.setAttribute("content", resolved === "dark" ? "#070b09" : "#f2f6f3");
    }, [resolved]);
    return <ThemeCtx.Provider value={{ mode, resolved, setMode }}>{children}</ThemeCtx.Provider>;
  }
  const useTheme = () => useContext(ThemeCtx);

  /* ---------- the app root: measures its own width so device frames render true ---------- */
  const AppCtx = createContext({ w: 1440, h: 900, bp: "desktop", el: null });
  const bpOf = w => (w < 768 ? "phone" : w < 1100 ? "tablet" : "desktop");
  // embedded: an app drawn inside a device preview (the demo, the design system page), not the page itself
  // scroll: "app" (the default), the root fills its parent and the app scrolls inside it; "window", a long page that
  // scrolls the window (the landing page), whose sheets and alerts go into a fixed layer over the window, since the
  // root's containment would otherwise centre them on the whole page (SC-65)
  function AppRoot({ children, className, style, theme, embedded, scroll = "app" }) {
    const ref = useRef(null); const host = useRef(null);
    const { resolved } = useTheme();
    const [size, setSize] = useState(() => ({ w: typeof window !== "undefined" ? window.innerWidth : 1440, h: typeof window !== "undefined" ? window.innerHeight : 900 }));
    const [el, setEl] = useState(null);
    useEffect(() => {
      let raf = 0;
      const attach = () => {
        const node = scroll === "window" ? host.current : ref.current; if (!node) { raf = requestAnimationFrame(attach); return; }
        setEl(node);
        const ro = new ResizeObserver(([e]) => { const r = e.contentRect; setSize(s => (Math.abs(s.w - r.width) < 1 && Math.abs(s.h - r.height) < 1 ? s : { w: r.width, h: r.height })); });
        ro.observe(node); node.__ro = ro;
      };
      attach();
      return () => { cancelAnimationFrame(raf); const node = scroll === "window" ? host.current : ref.current; if (node && node.__ro) node.__ro.disconnect(); };
    }, []);
    const value = useMemo(() => ({ w: size.w, h: size.h, bp: bpOf(size.w), el, embedded: !!embedded }), [size.w, size.h, el, embedded]);
    return <Fragment><div ref={ref} className={cx("app", scroll === "window" && "app-window", className)} data-theme={theme || resolved} style={style}>
      <div className="ground" aria-hidden="true" />
      <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
    </div>{scroll === "window" && <div ref={host} className="app app-overlays" />}</Fragment>;
  }
  const useApp = () => useContext(AppCtx);
  const Portal = ({ children }) => { const { el } = useApp(); return el ? ReactDOM.createPortal(children, el) : null; };

  /* ---------- icons (Lucide paths) ---------- */
  function Icon({ name, size = 20, stroke = 1.75, className, style, title }) {
    const inner = ICONS[name] || ICONS["circle"];
    return <svg className={cx("ic", className)} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined} dangerouslySetInnerHTML={{ __html: (title ? `<title>${title}</title>` : "") + inner }} />;
  }

  /* ---------- buttons, badges, chips ---------- */
  function Spinner({ size = 20, className }) {
    return <svg className={cx("spinner", className)} width={size} height={size} viewBox="0 0 24 24" aria-label="Loading" role="status">
      {Array.from({ length: 8 }).map((_, i) => <rect key={i} x="11" y="2" width="2" height="6" rx="1" fill="currentColor" opacity={0.25 + (i / 8) * 0.75} transform={`rotate(${i * 45} 12 12)`} />)}
    </svg>;
  }
  const Button = React.forwardRef(function Button({ variant = "secondary", size, icon, iconRight, loading, block, pill, className, children, ...rest }, ref) {
    return <button ref={ref} type="button" className={cx("btn", `btn-${variant}`, size && `btn-${size}`, block && "btn-block", pill && "btn-pill", !children && "btn-icon", className)} data-loading={loading ? "true" : undefined} aria-busy={loading || undefined} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 16 : size === "xl" ? 20 : 18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 16 : 18} />}
      {loading && <Spinner size={18} />}
    </button>;
  });
  function IconButton({ icon, label, round, badge, className, size = 20, ...rest }) {
    return <button type="button" className={cx("iconbtn", round && "round", className)} aria-label={label} title={label} {...rest}><Icon name={icon} size={round ? 16 : size} />{badge ? <span className="badge-count">{badge}</span> : null}</button>;
  }
  function Badge({ tone, solid, outline, icon, dot, live, size, className, children, ...rest }) {
    return <span className={cx("badge", tone && `badge-${tone}`, solid && "badge-solid", outline && "badge-outline", size === "sm" && "badge-sm", className)} {...rest}>{dot && <i className={cx("dot", live && "live")} />}{icon && <Icon name={icon} size={14} stroke={2} />}{children}</span>;
  }
  function Chip({ pressed, count, icon, className, children, ...rest }) {
    return <button type="button" className={cx("chip", className)} aria-pressed={!!pressed} {...rest}>{icon && <Icon name={icon} size={15} />}{children}{count != null && <span className="n">{count}</span>}</button>;
  }
  function Kbd({ children }) { return <kbd className="kbd">{children}</kbd>; }

  /* ---------- containers ---------- */
  function Card({ as: As = "div", pad = true, raised, interactive, className, children, ...rest }) {
    return <As className={cx("card", pad === "lg" ? "pad-lg" : pad && "pad", raised && "raised", interactive && "interactive", className)} {...rest}>{children}</As>;
  }
  function List({ head, foot, icons, className, children }) {
    return <div className="stack tight">{head && <div className="list-head">{head}</div>}<div className={cx("list", icons && "icons", className)}>{children}</div>{foot && <div className="list-foot">{foot}</div>}</div>;
  }
  function ListRow({ icon, iconTone, leading, title, sub, value, chevron, onClick, children, className, ...rest }) {
    const As = onClick ? "button" : "div";
    return <As type={onClick ? "button" : undefined} className={cx("list-row", className)} onClick={onClick} {...rest}>
      {icon && <span className={cx("icontile", iconTone)}><Icon name={icon} size={17} stroke={2} /></span>}
      {leading}
      <span className="lr-main">{title && <span className="lr-title" style={{ display: "block" }}>{title}</span>}{sub && <span className="lr-sub" style={{ display: "block" }}>{sub}</span>}{children}</span>
      {value != null && <span className="lr-value">{value}</span>}
      {chevron && <Icon name="chevron-right" size={18} className="chev" />}
    </As>;
  }

  /* ---------- controls ---------- */
  function Segmented({ options, value, onChange, size, label, className, id }) {
    const gid = useMemo(() => id || "seg" + Math.random().toString(36).slice(2, 7), [id]);
    return <div className={cx("segmented", size, className)} role="group" aria-label={label}>
      {options.map(o => <button key={o.id} type="button" className="seg" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
        {value === o.id && <motion.span layoutId={gid} className="seg-thumb" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
        {o.icon && <Icon name={o.icon} size={15} />}{o.label}
      </button>)}
    </div>;
  }
  function Switch({ checked, onChange, label, disabled }) {
    return <button type="button" role="switch" aria-checked={!!checked} aria-label={label} disabled={disabled} className="switch" onClick={() => onChange(!checked)}><span className="knob" /></button>;
  }
  function Field({ label, help, error, htmlFor, children, className }) {
    return <div className={cx("field", className)}>{label && <label htmlFor={htmlFor}>{label}</label>}{children}{error ? <div className="error" role="alert">{error}</div> : help ? <div className="help">{help}</div> : null}</div>;
  }
  const Input = React.forwardRef(function Input({ icon, className, ...rest }, ref) {
    const el = <input ref={ref} className={cx("input", className)} {...rest} />;
    return icon ? <span className="input-wrap"><Icon name={icon} size={17} />{el}</span> : el;
  });
  function SearchField({ value, onChange, placeholder = "Search", ...rest }) {
    return <span className="input-wrap"><Icon name="search" size={17} /><input className="input search" type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} {...rest} /></span>;
  }
  function Select({ className, children, ...rest }) { return <select className={cx("select", className)} {...rest}>{children}</select>; }
  function Textarea({ className, ...rest }) { return <textarea className={cx("textarea", className)} {...rest} />; }
  function Stepper({ value, onChange, min = 0, max = 9999, step = 1, label, format = v => v }) {
    return <span className="stepper" role="group" aria-label={label}>
      <button type="button" aria-label={"Fewer " + (label || "")} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}><Icon name="minus" size={18} stroke={2.2} /></button>
      <span className="val" aria-live="polite">{format(value)}</span>
      <button type="button" aria-label={"More " + (label || "")} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}><Icon name="plus" size={18} stroke={2.2} /></button>
    </span>;
  }
  function OTP({ length = 6, value, onChange, autoFocus }) {
    const refs = useRef([]);
    const digits = (value || "").padEnd(length, " ").slice(0, length).split("");
    useEffect(() => { if (autoFocus && refs.current[0]) refs.current[0].focus(); }, []);
    // a cleared code (a wrong one, wiped by its sign-in) starts again from the first box, if focus is in the boxes (SC-65)
    useEffect(() => { if (!value && refs.current[0] && refs.current.includes(document.activeElement)) refs.current[0].focus(); }, [value]);
    const set = (i, ch) => { const arr = (value || "").padEnd(length, " ").split(""); arr[i] = ch || " "; const v = arr.join("").replace(/\s+$/, ""); onChange(v.replace(/ /g, "")); };
    return <div className="otp" role="group" aria-label="One-time code">{digits.map((d, i) => <input key={i} ref={el => (refs.current[i] = el)} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={1} aria-label={`Digit ${i + 1}`} value={d.trim()}
      onChange={e => { const ch = e.target.value.replace(/\D/g, "").slice(-1); set(i, ch); if (ch && refs.current[i + 1]) refs.current[i + 1].focus(); }}
      onKeyDown={e => { if (e.key === "Backspace" && !d.trim() && refs.current[i - 1]) refs.current[i - 1].focus(); }}
      onPaste={e => { const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, length); if (t) { e.preventDefault(); onChange(t); const n = refs.current[Math.min(t.length, length - 1)]; n && n.focus(); } }} />)}</div>;
  }
  function Tabs({ tabs, value, onChange, className, id }) {
    const gid = useMemo(() => id || "tabs" + Math.random().toString(36).slice(2, 7), [id]);
    return <div className={cx("tabs", className)} role="tablist">{tabs.map(t => <button key={t.id} type="button" role="tab" aria-selected={value === t.id} className="tab-btn" onClick={() => onChange(t.id)}>
      {value === t.id && <motion.span layoutId={gid} className="tab-thumb" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
      {t.icon && <Icon name={t.icon} size={16} />}<span>{t.label}</span>{t.badge ? <Badge size="sm" tone="amber">{t.badge}</Badge> : null}
    </button>)}</div>;
  }
  function Check({ checked, onChange, children }) { return <label className="check"><input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} /><span>{children}</span></label>; }

  /* ---------- table ---------- */
  function DataTable({ columns, rows, rowKey = "id", onRow, empty, initialSort, dense, label = "Table" }) {
    const [sort, setSort] = useState(initialSort || null);
    const sorted = useMemo(() => { if (!sort) return rows; const [k, dir] = sort; const col = columns.find(c => c.key === k); const get = r => (col && col.sortValue ? col.sortValue(r) : r[k]); return rows.slice().sort((a, b) => { const x = get(a), y = get(b); return (x > y ? 1 : x < y ? -1 : 0) * (dir === "desc" ? -1 : 1); }); }, [rows, sort, columns]);
    if (!rows.length) return <Card>{empty || <Empty icon="search" title="Nothing here yet" />}</Card>;
    return <div className="table-wrap" tabIndex={0} role="region" aria-label={label}><table className="table" style={dense ? { fontSize: 13.5 } : undefined}>
      <thead><tr>{columns.map(c => <th key={c.key} className={cx(c.num && "n")} style={c.width ? { width: c.width } : undefined} aria-sort={sort && sort[0] === c.key ? (sort[1] === "asc" ? "ascending" : "descending") : undefined}>{c.sortable === false ? c.label : <button type="button" onClick={() => setSort(s => [c.key, s && s[0] === c.key && s[1] === "asc" ? "desc" : "asc"])}>{c.label}{sort && sort[0] === c.key && <Icon name={sort[1] === "asc" ? "chevron-up" : "chevron-down"} size={13} />}</button>}</th>)}</tr></thead>
      <tbody>{sorted.map(r => <tr key={r[rowKey]} className={cx(onRow && "clickable", r._dim && "dim")} onClick={onRow ? e => { if (e.target.closest("button, a, input, select")) return; onRow(r); } : undefined}>{columns.map(c => <td key={c.key} className={cx(c.num && "n")}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)}</tbody>
    </table></div>;
  }

  /* ---------- feedback ---------- */
  function Skeleton({ w = "100%", h = 14, r, style }) { return <span className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />; }
  function Progress({ value, tone, label }) { return <div className={cx("progress", tone)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}><i style={{ "--p": Math.max(0, Math.min(1, value)) }} /></div>; }
  function Empty({ icon = "package", img, title, body, action }) {
    return <div className="empty">{img ? <Product name={img} size={120} /> : <span className="icontile soft" style={{ width: 56, height: 56, borderRadius: 16 }}><Icon name={icon} size={26} /></span>}<b>{title}</b>{body && <p>{body}</p>}{action}</div>;
  }
  function Avatar({ person, size, ring, status, className }) {
    const [err, setErr] = useState(false);
    const name = (person && (person.name || person.short)) || "?";
    const ini = name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    return <span className={cx("avatar", size, ring && "ring", className)}>{person && person.img && !err ? <img src={person.img} alt="" onError={() => setErr(true)} /> : <span className="ini">{ini}</span>}{status && <i className="status" />}</span>;
  }
  // a soft 3D product or scene render; falls back to a quiet tile while assets are missing
  function Product({ name, size = 96, float, className, style, alt = "" }) {
    const [err, setErr] = useState(false);
    const src = (window.SC3_IMG || "system/img/") + name + ".webp";
    if (err) return <span className={cx("icontile soft", className)} style={{ width: size, height: size, borderRadius: size * 0.28, ...style }} aria-hidden="true"><Icon name="package" size={size * 0.38} stroke={1.5} /></span>;
    return <img className={className} src={src} alt={alt} width={size} height={size} loading="lazy" decoding="async" onError={() => setErr(true)} style={{ width: size, height: size, objectFit: "contain", animation: float ? "float-y 4.8s var(--ease)" : undefined, ...style }} />;
  }

  /* ---------- overlays ---------- */
  function useEscape(open, onClose) { useEffect(() => { if (!open) return; const f = e => e.key === "Escape" && onClose && onClose(); window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [open, onClose]); }
  // a modal takes focus when it opens, keeps Tab inside, closes on Escape and hands focus back to whatever
  // opened it; with one modal over another, only the top one listens. Inside a device preview a sheet is part
  // of the picture: Escape still closes it, but focus and Tab stay with the page around the device.
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const modals = [];
  function useModal(open, ref, onClose) {
    const { embedded } = useApp();
    const close = useRef(onClose); close.current = onClose;
    useEffect(() => {
      if (!open) return;
      if (embedded) { const f = e => e.key === "Escape" && close.current && close.current(); window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }
      const opener = document.activeElement; const me = {}; modals.push(me);
      const top = () => modals[modals.length - 1] === me;
      const raf = requestAnimationFrame(() => { const el = ref.current; if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true }); });
      const onKey = e => {
        const el = ref.current; if (!el || !top()) return;
        if (e.key === "Escape") { close.current && close.current(); return; }
        if (e.key !== "Tab") return;
        const items = [...el.querySelectorAll(FOCUSABLE)].filter(n => n.getClientRects().length);
        const at = document.activeElement;
        if (!items.length) { e.preventDefault(); el.focus(); return; }
        const first = items[0], last = items[items.length - 1];
        if (!el.contains(at)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
        else if (e.shiftKey && (at === first || at === el)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
      };
      document.addEventListener("keydown", onKey);
      return () => {
        cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); modals.splice(modals.indexOf(me), 1);
        if (opener && opener.isConnected && typeof opener.focus === "function") opener.focus({ preventScroll: true });
      };
    }, [open, embedded]);
  }
  // a sheet: bottom with detents on phones, a floating side panel or a centred form sheet elsewhere
  function Sheet({ open, onClose, title, children, footer, side, detent = "large", headerRight, className, labelledBy }) {
    const app = useApp(); const reduce = useReducedMotion(); const panel = useRef(null); const body = useRef(null);
    useModal(open, panel, onClose);
    // when the content runs longer than the sheet, the body scrolls, so a keyboard can reach it (WCAG 2.1.1)
    const [scrolls, setScrolls] = useState(false);
    useEffect(() => { if (!open) return; let ro; const raf = requestAnimationFrame(() => { const el = body.current; if (!el) return; const check = () => setScrolls(el.scrollHeight > el.clientHeight + 1); ro = new ResizeObserver(check); ro.observe(el); Array.from(el.children).forEach(c => ro.observe(c)); check(); }); return () => { cancelAnimationFrame(raf); if (ro) ro.disconnect(); }; }, [open, children]);
    const mode = side || (app.bp === "phone" ? "bottom" : "side");
    const [cur, setCur] = useState(detent);
    useEffect(() => { if (open) setCur(detent); }, [open, detent]);
    // a bottom sheet is always full height and slides down to show its medium detent; its padding lifts the footer
    // by the same distance, so the footer sits at the bottom of the screen at either detent
    const H = app.h || 800; const largeH = H * 0.94; const mediumH = Math.min(largeH, H * 0.58);
    const offset = mode === "bottom" ? (cur === "medium" ? largeH - mediumH : 0) : 0;
    const spring = reduce ? { duration: 0.01 } : { type: "spring", stiffness: 420, damping: 40, mass: 0.9 };
    const variants = mode === "bottom" ? { initial: { y: largeH }, animate: { y: offset }, exit: { y: largeH } } : mode === "center" ? { initial: { opacity: 0, scale: 0.96, x: "-50%", y: "-48%" }, animate: { opacity: 1, scale: 1, x: "-50%", y: "-50%" }, exit: { opacity: 0, scale: 0.97, x: "-50%", y: "-48%" } } : { initial: { x: "105%" }, animate: { x: 0 }, exit: { x: "105%" } };
    return <Portal><AnimatePresence>{open && <Fragment key="sheet">
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} />
      <motion.div ref={panel} tabIndex={-1} role="dialog" aria-modal={app.embedded ? undefined : "true"} aria-label={typeof title === "string" ? title : undefined} className={cx("sheet", `sheet-${mode}`, className)} style={mode === "bottom" ? { height: largeH, paddingBottom: `calc(var(--safe-bottom) + ${offset}px)` } : undefined}
        initial={variants.initial} animate={variants.animate} exit={variants.exit} transition={spring}
        drag={mode === "bottom" ? "y" : false} dragConstraints={{ top: 0, bottom: largeH }} dragElastic={{ top: 0.04, bottom: 0.6 }} dragMomentum={false}
        onDragEnd={(e, info) => { if (mode !== "bottom") return; const y = offset + info.offset.y; const v = info.velocity.y; if (v > 700 || y > largeH - mediumH * 0.45) { onClose && onClose(); return; } if (y > (largeH - mediumH) / 2 || v > 300) setCur("medium"); else setCur("large"); }}>
        {mode === "bottom" && <div className="grabber" aria-hidden="true" />}
        <div className="sheet-head">{typeof title === "string" ? <h2>{title}</h2> : title}{headerRight}<IconButton icon="x" label="Close" round onClick={onClose} /></div>
        <div ref={body} className="sheet-body" tabIndex={scrolls ? 0 : undefined} role={scrolls ? "region" : undefined} aria-label={scrolls && typeof title === "string" ? title : undefined} onPointerDownCapture={e => { if (mode === "bottom" && e.currentTarget.scrollTop > 0) e.stopPropagation(); }}>{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </motion.div>
    </Fragment>}</AnimatePresence></Portal>;
  }
  function Alert({ open, title, message, actions = [], onClose }) {
    const app = useApp(); const panel = useRef(null);
    useModal(open, panel, onClose);
    return <Portal><AnimatePresence>{open && <Fragment key="alert">
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div ref={panel} tabIndex={-1} role="alertdialog" aria-modal={app.embedded ? undefined : "true"} aria-label={title} className="alert" initial={{ opacity: 0, scale: 1.08, x: "-50%", y: "-50%" }} animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }} exit={{ opacity: 0, scale: 0.96, x: "-50%", y: "-50%" }} transition={{ type: "spring", stiffness: 500, damping: 36 }}>
        <div className="al-body"><h3>{title}</h3>{message && <p>{message}</p>}</div>
        <div className="al-actions" style={actions.length > 2 ? { gridAutoFlow: "row" } : undefined}>{actions.map(a => <button key={a.label} type="button" className={cx(a.strong && "strong", a.danger && "danger")} onClick={() => { a.onClick && a.onClick(); onClose && onClose(); }}>{a.label}</button>)}</div>
      </motion.div>
    </Fragment>}</AnimatePresence></Portal>;
  }
  // a menu button's menu (WAI-ARIA APG): opening moves focus to the checked or the first item; the arrows, Home and
  // End move between items; Escape closes it and gives focus back to its button; Tab closes it and moves on.
  // An item with `checked` is a radio choice. A leading heading names the menu; its trigger carries
  // aria-haspopup="menu" and aria-expanded.
  function Menu({ open, onClose, items, align = "right", width = 240, style, label }) {
    const ref = useRef(null); const close = useRef(onClose); close.current = onClose;
    const list = items.filter(Boolean); const name = label || (list[0] && list[0].heading ? list[0].label : undefined);
    useEscape(open, onClose);
    useEffect(() => {
      if (!open) return;
      const opener = document.activeElement; const trigger = opener && opener !== document.body ? opener : null;
      const focusIn = () => { const el = ref.current; if (!el) return false; const first = el.querySelector('[aria-checked="true"]') || el.querySelector('[role^="menuitem"]'); if (first) first.focus({ preventScroll: true }); return true; };
      const raf = focusIn() ? 0 : requestAnimationFrame(focusIn); // at once, so a quick next key lands in the menu
      const away = e => { if (ref.current && !ref.current.contains(e.target) && !(trigger && trigger.contains(e.target))) close.current(); };
      const t = setTimeout(() => document.addEventListener("pointerdown", away), 0);
      return () => {
        cancelAnimationFrame(raf); clearTimeout(t); document.removeEventListener("pointerdown", away);
        const at = document.activeElement;
        if (trigger && trigger.isConnected && (!at || at === document.body || (ref.current && ref.current.contains(at)))) trigger.focus({ preventScroll: true });
      };
    }, [open]);
    const onKey = e => {
      if (e.key === "Tab") { close.current(); return; }
      e.stopPropagation(); // page shortcuts (the demo's arrows and digits) wait while the menu has focus
      const items = [...ref.current.querySelectorAll('[role^="menuitem"]')]; const i = items.indexOf(document.activeElement);
      const go = n => { e.preventDefault(); if (items.length) items[(n + items.length) % items.length].focus(); };
      if (e.key === "ArrowDown") go(i + 1);
      else if (e.key === "ArrowUp") go(i < 0 ? -1 : i - 1);
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(-1);
      else if (e.key === "Escape") { e.preventDefault(); close.current(); }
    };
    return <AnimatePresence>{open && <motion.div ref={ref} role="menu" aria-label={name} className="menu" onKeyDown={onKey} style={{ top: "calc(100% + 6px)", [align]: 0, width, ...style }} initial={{ opacity: 0, scale: 0.96, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -2 }} transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}>
      {list.map((it, i) => it === "-" ? <div key={i} role="separator" className="msep" /> : it.heading ? <div key={i} className="mlabel" aria-hidden="true">{it.label}</div> : <button key={i} type="button" tabIndex={-1} role={it.checked === undefined ? "menuitem" : "menuitemradio"} aria-checked={it.checked === undefined ? undefined : !!it.checked} className={cx("mi", it.danger && "danger")} onClick={() => { close.current(); it.onClick && it.onClick(); }}>{it.icon && <Icon name={it.icon} size={17} />}<span className="grow">{it.label}</span>{it.right}</button>)}
    </motion.div>}</AnimatePresence>;
  }

  /* ---------- banners (push notifications) and toasts ---------- */
  const NoticeCtx = createContext({ push: () => {}, toast: () => {} });
  function NoticeHost({ children, resetKey }) {
    const [banners, setBanners] = useState([]); const [toasts, setToasts] = useState([]);
    const timers = useRef([]);
    useEffect(() => { setBanners([]); setToasts([]); }, [resetKey]);
    useEffect(() => () => timers.current.forEach(clearTimeout), []);
    const push = useCallback(b => { const id = Math.random().toString(36).slice(2); setBanners(x => [{ id, ...b }, ...x].slice(0, 2)); timers.current.push(setTimeout(() => setBanners(x => x.filter(y => y.id !== id)), b.ms || 6200)); }, []);
    const toast = useCallback(t => { const id = Math.random().toString(36).slice(2); setToasts(x => [...x, { id, ...t }].slice(-3)); timers.current.push(setTimeout(() => setToasts(x => x.filter(y => y.id !== id)), t.ms || 3200)); }, []);
    const close = id => setBanners(x => x.filter(y => y.id !== id));
    const api = useMemo(() => ({ push, toast }), [push, toast]);
    return <NoticeCtx.Provider value={api}>{children}
      <div className="banners" aria-live="polite"><AnimatePresence initial={false}>{banners.map(b => <motion.button key={b.id} type="button" layout className="banner" initial={{ opacity: 0, y: -40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -24, scale: 0.97 }} transition={{ type: "spring", stiffness: 420, damping: 34 }} drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.6, bottom: 0.1 }} onDragEnd={(e, i) => { if (i.offset.y < -24) close(b.id); }} onClick={() => { close(b.id); b.onOpen && b.onOpen(); }}>
        <span style={{ width: 38, height: 38 }}>{b.person ? <Avatar person={b.person} size="lg" className="" /> : <Mark size={38} still />}</span>
        <span style={{ minWidth: 0 }}><span className="bn-top"><span className="bn-app">{b.app || "Smart-Clearance"}</span><span className="bn-time">{b.at || "now"}</span></span><b>{b.title}</b><p className={cx(b.hindi && "hi", "clamp-3")} style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{b.body}</p></span>
      </motion.button>)}</AnimatePresence></div>
      <div className="toasts" aria-live="polite"><AnimatePresence initial={false}>{toasts.map(t => <motion.div key={t.id} layout className={cx("toast", t.tone)} initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={{ type: "spring", stiffness: 420, damping: 34 }}><Icon name={t.icon || (t.tone === "err" ? "circle-alert" : "circle-check")} size={18} /><span>{t.text}</span></motion.div>)}</AnimatePresence></div>
    </NoticeCtx.Provider>;
  }
  const useNotice = () => useContext(NoticeCtx);

  /* ---------- the mark: an S drawn as a route, from the godown dot to the amber pin ---------- */
  function Mark({ size = 40, play, still, className, onDone }) {
    const reduce = useReducedMotion(); const animate = play && !reduce;
    const gid = useMemo(() => "mk" + Math.random().toString(36).slice(2, 7), []);
    useEffect(() => { if (!onDone) return; const t = setTimeout(onDone, animate ? 1500 : 10); return () => clearTimeout(t); }, [animate]);
    const S = "M43.5 19 H27 a7 7 0 0 0 0 14 h10 a7 7 0 0 1 0 14 H20.5";
    return <svg className={cx("mark", className)} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={gid + "g"} x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2fbf7f" /><stop offset="0.55" stopColor="#178258" /><stop offset="1" stopColor="#0d5a3e" /></linearGradient>
        <linearGradient id={gid + "h"} x1="32" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#fff" stopOpacity="0.28" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
      </defs>
      <motion.path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill={`url(#${gid}g)`} initial={animate ? { scale: 0.55, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} style={{ transformOrigin: "32px 32px" }} />
      <path d="M32 3C10.5 3 3 10.5 3 31.5 10 22 22 18 32 18s22 4 29 13.5C61 10.5 53.5 3 32 3Z" fill={`url(#${gid}h)`} />
      <motion.path d={S} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" initial={animate ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 0.75, delay: 0.25, ease: [0.65, 0, 0.35, 1] }} />
      <motion.circle cx="43.5" cy="19" r="3.4" fill="#0d5a3e" stroke="#fff" strokeWidth="2.6" initial={animate ? { scale: 0 } : false} animate={{ scale: 1 }} transition={{ delay: 0.18, type: "spring", stiffness: 500, damping: 20 }} style={{ transformOrigin: "43.5px 19px" }} />
      {animate && <motion.circle cx="20.5" cy="47" r="5" fill="none" stroke="#f7c04a" strokeWidth="2" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: [0.6, 2.2], opacity: [0.9, 0] }} transition={{ delay: 1.1, duration: 0.9, ease: "easeOut" }} style={{ transformOrigin: "20.5px 47px" }} />}
      <motion.circle cx="20.5" cy="47" r="5.2" fill="#f7c04a" stroke="#fff" strokeWidth="2.2" initial={animate ? { y: -16, opacity: 0, scale: 0.6 } : false} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ delay: 0.95, type: "spring", stiffness: 520, damping: 14 }} style={{ transformOrigin: "20.5px 47px" }} />
    </svg>;
  }
  /* ---------- the client's workspace: its mark, and the product it runs on ---------- */
  // a workspace's mark keeps the client's own colours inside the tile and nowhere else in the interface. Munchly's
  // is its m with a bite taken out of the corner; a workspace without artwork gets its initial on its colour.
  function WorkspaceMark({ ws, size = 32, className, label }) {
    const w = ws || (window.SC3_DATA && window.SC3_DATA.WORKSPACE) || { name: "?" };
    const c = w.mark || { from: "#5f6e67", to: "#45554d", ink: "#ffffff" };
    const gid = useMemo(() => "wm" + Math.random().toString(36).slice(2, 7), []);
    const munchly = w.id === "munchly";
    return <svg className={cx("wsmark", className)} width={size} height={size} viewBox="0 0 64 64" role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : "true"}>
      <defs>
        <linearGradient id={gid + "g"} x1="6" y1="2" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor={c.from} /><stop offset="1" stopColor={c.to} /></linearGradient>
        {munchly && <mask id={gid + "m"}><rect width="64" height="64" fill="#fff" /><circle cx="59" cy="5" r="9" fill="#000" /><circle cx="47" cy="2.5" r="5.5" fill="#000" /><circle cx="61.5" cy="17" r="5.5" fill="#000" /></mask>}
      </defs>
      <path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill={`url(#${gid}g)`} mask={munchly ? `url(#${gid}m)` : undefined} />
      {munchly ? <path d="M18 45V33.5a7 7 0 0 1 14 0V45M32 33.5a7 7 0 0 1 14 0V45" fill="none" stroke={c.ink} strokeWidth="6.6" strokeLinecap="round" strokeLinejoin="round" />
        : <text x="32" y="43" textAnchor="middle" fill={c.ink} style={{ font: "700 30px var(--font-ui)" }}>{(w.name || "?").slice(0, 1)}</text>}
    </svg>;
  }
  // the platform's sign-off on a client's surfaces
  function PoweredBy({ size = "md", className }) {
    return <span className={cx("poweredby", size, className)}><span className="pb-t">Powered by</span><Mark size={size === "sm" ? 16 : 20} still /><Wordmark size={size === "sm" ? 13 : 15} /></span>;
  }

  function Wordmark({ size = 20, className, play }) {
    const reduce = useReducedMotion(); const word = "Smart-Clearance";
    if (!play || reduce) return <span className={cx("wordmark", className)} style={{ fontSize: size }}>Smart‑Clearance</span>;
    return <span className={cx("wordmark", className)} style={{ fontSize: size, display: "inline-flex", overflow: "hidden" }} role="img" aria-label={word}>{word.split("").map((ch, i) => <motion.span key={i} aria-hidden="true" initial={{ y: "105%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.55 + i * 0.028, type: "spring", stiffness: 380, damping: 28 }} style={{ display: "inline-block" }}>{ch === "-" ? "‑" : ch}</motion.span>)}</span>;
  }
  function Splash({ onDone, hold = 2300, workspace }) {
    const reduce = useReducedMotion();
    const [leaving, setLeaving] = useState(false);
    useEffect(() => { const t = setTimeout(() => setLeaving(true), reduce ? 600 : hold); return () => clearTimeout(t); }, []);
    return <AnimatePresence onExitComplete={onDone}>{!leaving && <motion.div className="splash" role="presentation" onClick={() => setLeaving(true)} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <div className="ground" aria-hidden="true" />
      <div className="sp-inner">
        <Mark size={112} play />
        <Wordmark size={34} play />
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 1.15, duration: 0.5 }} className="stack tight" style={{ justifyItems: "center" }}>
          <span className="sp-tag">Every near-expiry carton gets a second chance, chosen by AI.</span>
          <span className="sp-hi">हर कार्टन को दूसरा मौका</span>
        </motion.div>
        {workspace && <motion.div className="sp-ws" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 1.45, duration: 0.5 }}><WorkspaceMark ws={workspace} size={26} /><span><b>{workspace.name}</b> workspace</span></motion.div>}
      </div>
      <span className="sp-skip">Tap to skip</span>
    </motion.div>}</AnimatePresence>;
  }

  /* ---------- the shell: tab bar on phones, a compact rail on tablets, a sidebar on desktops ---------- */
  // ws: the client workspace the person is in. The product's mark leads the sidebar and the workspace sits under it;
  // on a phone the workspace is the button at the left of each page's navigation bar (see Page's lead).
  function Shell({ nav, current, onNav, user, onUser, footer, brandRight, brand, brandMark, ws, onWorkspace, children }) {
    const app = useApp();
    if (app.bp === "phone") return <div className="layer" style={{ position: "absolute", inset: 0 }}>
      <div className="scroll" style={{ position: "absolute", inset: 0, paddingBottom: "calc(var(--tabbar-h) + var(--safe-bottom))" }} id="main">{children}</div>
      <nav className="tabbar" aria-label="Main">{nav.filter(n => !n.phoneHidden).slice(0, 4).map(n => <button key={n.id} type="button" className="tab" aria-current={current === n.id ? "page" : undefined} onClick={() => onNav(n.id)}><Icon name={n.icon} size={23} stroke={current === n.id ? 2.1 : 1.7} /><span>{n.short || n.label}</span>{n.badge ? <span className="badge-count">{n.badge}</span> : null}</button>)}</nav>
    </div>;
    if (app.bp === "tablet") return <div className="layer" style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "76px minmax(0,1fr)" }}>
      <nav className="sidebar rail-compact" aria-label="Main" style={{ padding: "14px 10px" }}>
        <div className="sb-brand" style={{ justifyContent: "center", padding: "2px 0 8px" }}>{brandMark || <Mark size={36} />}</div>
        {ws && <button type="button" className="sb-ws-rail" onClick={onWorkspace} aria-label={`${ws.name} workspace`} title={`${ws.name} · ${ws.domain}`}><WorkspaceMark ws={ws} size={30} /></button>}
        {nav.map(n => <button key={n.id} type="button" className="sb-item" title={n.label} aria-label={n.label} aria-current={current === n.id ? "page" : undefined} onClick={() => onNav(n.id)} style={{ position: "relative" }}><Icon name={n.icon} size={21} />{n.badge ? <span className="badge-count" style={{ position: "absolute", top: 3, right: 6 }}>{n.badge}</span> : null}</button>)}
        <div className="sb-foot">{user && <button type="button" className="sb-user" style={{ justifyContent: "center", padding: 6 }} onClick={onUser} aria-label={user.name}><Avatar person={user} size="sm" /></button>}</div>
      </nav>
      <div className="scroll" style={{ position: "relative", minWidth: 0 }} id="main">{children}</div>
    </div>;
    return <div className="layer" style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "var(--sidebar-w) minmax(0,1fr)" }}>
      <nav className="sidebar" aria-label="Main">
        <div className="sb-brand">{brand || <><Mark size={32} /><Wordmark size={18} /></>}{brandRight}</div>
        {ws && <button type="button" className="sb-ws" onClick={onWorkspace} aria-label={`${ws.name} workspace, ${ws.domain}`}><WorkspaceMark ws={ws} size={30} /><span className="who"><span className="ws-name"><b>{ws.name}</b><Icon name="chevron-down" size={15} className="subtle" /></span><span className="ws-dom">{ws.domain}</span></span></button>}
        {nav.map((n, i) => <Fragment key={n.id}>{n.section && <div className="sb-label">{n.section}</div>}<button type="button" className="sb-item" aria-current={current === n.id ? "page" : undefined} onClick={() => onNav(n.id)}><Icon name={n.icon} size={19} /><span>{n.label}</span>{n.badge ? <span className="badge-count">{n.badge}</span> : n.count != null ? <span className="sb-n">{n.count}</span> : null}</button></Fragment>)}
        <div className="sb-foot">{footer}{user && <button type="button" className="sb-user" onClick={onUser} title={`${user.name} · ${user.role}${user.org ? " · " + user.org : ""}`}><Avatar person={user} size="sm" /><span className="who"><b>{user.name}</b><span>{user.role}{user.org ? " · " + user.org : ""}</span></span><Icon name="ellipsis" size={18} className="subtle" /></button>}</div>
      </nav>
      <div className="scroll" style={{ position: "relative", minWidth: 0 }} id="main">{children}</div>
    </div>;
  }

  /* ---------- page: a navigation bar whose large title collapses into the bar on scroll ---------- */
  // lead: what sits at the left of the bar when there is no back button (on a phone, the workspace)
  function Page({ title, sub, back, onBack, actions, lead, children, wide, pad = true, hideLarge }) {
    const sentinel = useRef(null); const [scrolled, setScrolled] = useState(false);
    useEffect(() => { const s = sentinel.current; if (!s) return; let root = s.parentElement; while (root && !(root.classList && root.classList.contains("scroll"))) root = root.parentElement; const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { root: root || null, threshold: 0 }); io.observe(s); return () => io.disconnect(); }, []);
    return <div className="layer">
      <header className={cx("navbar", scrolled && "scrolled")}>
        {back ? <button type="button" className="nb-back" onClick={onBack} aria-label={"Back to " + back}><Icon name="chevron-left" size={22} stroke={2.2} /><span className="nb-back-t">{back}</span></button> : lead || null}
        <span className="nb-title">{title}</span>
        <div className="nb-actions">{actions}</div>
      </header>
      {!hideLarge && <div className="largetitle"><h1>{title}</h1>{sub && <div className="lt-sub">{sub}</div>}</div>}
      <div ref={sentinel} style={{ height: 1, marginTop: -1 }} aria-hidden="true" />
      <div className="pagebody" style={pad ? { padding: "0 var(--page-x, 16px) 40px", maxWidth: wide ? "none" : 1320 } : undefined}>{children}</div>
    </div>;
  }

  function ModeMenuButton() {
    const { mode, resolved, setMode } = useTheme(); const [open, setOpen] = useState(false);
    return <span style={{ position: "relative" }}><IconButton icon={resolved === "dark" ? "moon" : "sun"} label="Appearance" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)} />
      <Menu open={open} onClose={() => setOpen(false)} width={200} items={[{ label: "Appearance", heading: true }, { label: "Light", icon: "sun", checked: mode === "light", right: mode === "light" && <Icon name="check" size={16} />, onClick: () => setMode("light") }, { label: "Dark", icon: "moon", checked: mode === "dark", right: mode === "dark" && <Icon name="check" size={16} />, onClick: () => setMode("dark") }, { label: "Match device", icon: "monitor", checked: mode === "system", right: mode === "system" && <Icon name="check" size={16} />, onClick: () => setMode("system") }]} />
    </span>;
  }

  window.SC3 = Object.assign(window.SC3 || {}, {
    cx, ThemeProvider, useTheme, AppRoot, useApp, Portal, Icon, Spinner, Button, IconButton, Badge, Chip, Kbd, Card, List, ListRow,
    Segmented, Switch, Field, Input, SearchField, Select, Textarea, Stepper, OTP, Tabs, Check, DataTable, Skeleton, Progress, Empty, Avatar, Product,
    Sheet, Alert, Menu, NoticeHost, useNotice, Mark, Wordmark, WorkspaceMark, PoweredBy, Splash, Shell, Page, ModeMenuButton,
  });
})();
