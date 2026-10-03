(function() {
  const { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, createContext, useContext, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const ICONS = window.SC3_ICONS || {};
  const cx = (...a) => a.filter(Boolean).join(" ");
  const ThemeCtx = createContext({ mode: "system", resolved: "light", setMode: () => {
  } });
  const TKEY = "sc3-theme";
  function ThemeProvider({ children, initial }) {
    const [mode, setModeState] = useState(() => {
      try {
        return localStorage.getItem(TKEY) || initial || "system";
      } catch (e) {
        return initial || "system";
      }
    });
    const mq = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;
    const [sysDark, setSysDark] = useState(mq ? mq.matches : false);
    useEffect(() => {
      if (!mq) return;
      const f = (e) => setSysDark(e.matches);
      mq.addEventListener ? mq.addEventListener("change", f) : mq.addListener(f);
      return () => {
        mq.removeEventListener ? mq.removeEventListener("change", f) : mq.removeListener(f);
      };
    }, []);
    const resolved = mode === "system" ? sysDark ? "dark" : "light" : mode;
    const setMode = (m) => {
      setModeState(m);
      try {
        localStorage.setItem(TKEY, m);
      } catch (e) {
      }
    };
    useEffect(() => {
      document.documentElement.setAttribute("data-theme", resolved);
      const meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (meta) meta.setAttribute("content", resolved === "dark" ? "#070b09" : "#f2f6f3");
    }, [resolved]);
    return /* @__PURE__ */ React.createElement(ThemeCtx.Provider, { value: { mode, resolved, setMode } }, children);
  }
  const useTheme = () => useContext(ThemeCtx);
  const AppCtx = createContext({ w: 1440, h: 900, bp: "desktop", el: null });
  const bpOf = (w) => w < 768 ? "phone" : w < 1100 ? "tablet" : "desktop";
  function AppRoot({ children, className, style, theme, embedded }) {
    const ref = useRef(null);
    const { resolved } = useTheme();
    const [size, setSize] = useState(() => ({ w: typeof window !== "undefined" ? window.innerWidth : 1440, h: typeof window !== "undefined" ? window.innerHeight : 900 }));
    const [el, setEl] = useState(null);
    useEffect(() => {
      let raf = 0;
      const attach = () => {
        const node = ref.current;
        if (!node) {
          raf = requestAnimationFrame(attach);
          return;
        }
        setEl(node);
        const ro = new ResizeObserver(([e]) => {
          const r = e.contentRect;
          setSize((s) => Math.abs(s.w - r.width) < 1 && Math.abs(s.h - r.height) < 1 ? s : { w: r.width, h: r.height });
        });
        ro.observe(node);
        ref.current.__ro = ro;
      };
      attach();
      return () => {
        cancelAnimationFrame(raf);
        if (ref.current && ref.current.__ro) ref.current.__ro.disconnect();
      };
    }, []);
    const value = useMemo(() => ({ w: size.w, h: size.h, bp: bpOf(size.w), el, embedded: !!embedded }), [size.w, size.h, el, embedded]);
    return /* @__PURE__ */ React.createElement("div", { ref, className: cx("app", className), "data-theme": theme || resolved, style }, /* @__PURE__ */ React.createElement("div", { className: "ground", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement(AppCtx.Provider, { value }, children));
  }
  const useApp = () => useContext(AppCtx);
  const Portal = ({ children }) => {
    const { el } = useApp();
    return el ? ReactDOM.createPortal(children, el) : null;
  };
  function Icon({ name, size = 20, stroke = 1.75, className, style, title }) {
    const inner = ICONS[name] || ICONS["circle"];
    return /* @__PURE__ */ React.createElement("svg", { className: cx("ic", className), width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", style, "aria-hidden": title ? void 0 : "true", role: title ? "img" : void 0, dangerouslySetInnerHTML: { __html: (title ? `<title>${title}</title>` : "") + inner } });
  }
  function Spinner({ size = 20, className }) {
    return /* @__PURE__ */ React.createElement("svg", { className: cx("spinner", className), width: size, height: size, viewBox: "0 0 24 24", "aria-label": "Loading", role: "status" }, Array.from({ length: 8 }).map((_, i) => /* @__PURE__ */ React.createElement("rect", { key: i, x: "11", y: "2", width: "2", height: "6", rx: "1", fill: "currentColor", opacity: 0.25 + i / 8 * 0.75, transform: `rotate(${i * 45} 12 12)` })));
  }
  const Button = React.forwardRef(function Button2({ variant = "secondary", size, icon, iconRight, loading, block, pill, className, children, ...rest }, ref) {
    return /* @__PURE__ */ React.createElement("button", { ref, type: "button", className: cx("btn", `btn-${variant}`, size && `btn-${size}`, block && "btn-block", pill && "btn-pill", !children && "btn-icon", className), "data-loading": loading ? "true" : void 0, "aria-busy": loading || void 0, ...rest }, icon && /* @__PURE__ */ React.createElement(Icon, { name: icon, size: size === "sm" ? 16 : size === "xl" ? 20 : 18 }), children, iconRight && /* @__PURE__ */ React.createElement(Icon, { name: iconRight, size: size === "sm" ? 16 : 18 }), loading && /* @__PURE__ */ React.createElement(Spinner, { size: 18 }));
  });
  function IconButton({ icon, label, round, badge, className, size = 20, ...rest }) {
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("iconbtn", round && "round", className), "aria-label": label, title: label, ...rest }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: round ? 16 : size }), badge ? /* @__PURE__ */ React.createElement("span", { className: "badge-count" }, badge) : null);
  }
  function Badge({ tone, solid, outline, icon, dot, live, size, className, children, ...rest }) {
    return /* @__PURE__ */ React.createElement("span", { className: cx("badge", tone && `badge-${tone}`, solid && "badge-solid", outline && "badge-outline", size === "sm" && "badge-sm", className), ...rest }, dot && /* @__PURE__ */ React.createElement("i", { className: cx("dot", live && "live") }), icon && /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 14, stroke: 2 }), children);
  }
  function Chip({ pressed, count, icon, className, children, ...rest }) {
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("chip", className), "aria-pressed": !!pressed, ...rest }, icon && /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 15 }), children, count != null && /* @__PURE__ */ React.createElement("span", { className: "n" }, count));
  }
  function Kbd({ children }) {
    return /* @__PURE__ */ React.createElement("kbd", { className: "kbd" }, children);
  }
  function Card({ as: As = "div", pad = true, raised, interactive, className, children, ...rest }) {
    return /* @__PURE__ */ React.createElement(As, { className: cx("card", pad === "lg" ? "pad-lg" : pad && "pad", raised && "raised", interactive && "interactive", className), ...rest }, children);
  }
  function List({ head, foot, icons, className, children }) {
    return /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, head && /* @__PURE__ */ React.createElement("div", { className: "list-head" }, head), /* @__PURE__ */ React.createElement("div", { className: cx("list", icons && "icons", className) }, children), foot && /* @__PURE__ */ React.createElement("div", { className: "list-foot" }, foot));
  }
  function ListRow({ icon, iconTone, leading, title, sub, value, chevron, onClick, children, className, ...rest }) {
    const As = onClick ? "button" : "div";
    return /* @__PURE__ */ React.createElement(As, { type: onClick ? "button" : void 0, className: cx("list-row", className), onClick, ...rest }, icon && /* @__PURE__ */ React.createElement("span", { className: cx("icontile", iconTone) }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 17, stroke: 2 })), leading, /* @__PURE__ */ React.createElement("span", { className: "lr-main" }, title && /* @__PURE__ */ React.createElement("span", { className: "lr-title", style: { display: "block" } }, title), sub && /* @__PURE__ */ React.createElement("span", { className: "lr-sub", style: { display: "block" } }, sub), children), value != null && /* @__PURE__ */ React.createElement("span", { className: "lr-value" }, value), chevron && /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18, className: "chev" }));
  }
  function Segmented({ options, value, onChange, size, label, className, id }) {
    const gid = useMemo(() => id || "seg" + Math.random().toString(36).slice(2, 7), [id]);
    return /* @__PURE__ */ React.createElement("div", { className: cx("segmented", size, className), role: "group", "aria-label": label }, options.map((o) => /* @__PURE__ */ React.createElement("button", { key: o.id, type: "button", className: "seg", "aria-pressed": value === o.id, onClick: () => onChange(o.id) }, value === o.id && /* @__PURE__ */ React.createElement(motion.span, { layoutId: gid, className: "seg-thumb", transition: { type: "spring", stiffness: 520, damping: 40 } }), o.icon && /* @__PURE__ */ React.createElement(Icon, { name: o.icon, size: 15 }), o.label)));
  }
  function Switch({ checked, onChange, label, disabled }) {
    return /* @__PURE__ */ React.createElement("button", { type: "button", role: "switch", "aria-checked": !!checked, "aria-label": label, disabled, className: "switch", onClick: () => onChange(!checked) }, /* @__PURE__ */ React.createElement("span", { className: "knob" }));
  }
  function Field({ label, help, error, htmlFor, children, className }) {
    return /* @__PURE__ */ React.createElement("div", { className: cx("field", className) }, label && /* @__PURE__ */ React.createElement("label", { htmlFor }, label), children, error ? /* @__PURE__ */ React.createElement("div", { className: "error", role: "alert" }, error) : help ? /* @__PURE__ */ React.createElement("div", { className: "help" }, help) : null);
  }
  const Input = React.forwardRef(function Input2({ icon, className, ...rest }, ref) {
    const el = /* @__PURE__ */ React.createElement("input", { ref, className: cx("input", className), ...rest });
    return icon ? /* @__PURE__ */ React.createElement("span", { className: "input-wrap" }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 17 }), el) : el;
  });
  function SearchField({ value, onChange, placeholder = "Search", ...rest }) {
    return /* @__PURE__ */ React.createElement("span", { className: "input-wrap" }, /* @__PURE__ */ React.createElement(Icon, { name: "search", size: 17 }), /* @__PURE__ */ React.createElement("input", { className: "input search", type: "search", value, onChange: (e) => onChange(e.target.value), placeholder, "aria-label": placeholder, ...rest }));
  }
  function Select({ className, children, ...rest }) {
    return /* @__PURE__ */ React.createElement("select", { className: cx("select", className), ...rest }, children);
  }
  function Textarea({ className, ...rest }) {
    return /* @__PURE__ */ React.createElement("textarea", { className: cx("textarea", className), ...rest });
  }
  function Stepper({ value, onChange, min = 0, max = 9999, step = 1, label, format = (v) => v }) {
    return /* @__PURE__ */ React.createElement("span", { className: "stepper", role: "group", "aria-label": label }, /* @__PURE__ */ React.createElement("button", { type: "button", "aria-label": "Fewer " + (label || ""), disabled: value <= min, onClick: () => onChange(Math.max(min, value - step)) }, /* @__PURE__ */ React.createElement(Icon, { name: "minus", size: 18, stroke: 2.2 })), /* @__PURE__ */ React.createElement("span", { className: "val", "aria-live": "polite" }, format(value)), /* @__PURE__ */ React.createElement("button", { type: "button", "aria-label": "More " + (label || ""), disabled: value >= max, onClick: () => onChange(Math.min(max, value + step)) }, /* @__PURE__ */ React.createElement(Icon, { name: "plus", size: 18, stroke: 2.2 })));
  }
  function OTP({ length = 6, value, onChange, autoFocus }) {
    const refs = useRef([]);
    const digits = (value || "").padEnd(length, " ").slice(0, length).split("");
    useEffect(() => {
      if (autoFocus && refs.current[0]) refs.current[0].focus();
    }, []);
    const set = (i, ch) => {
      const arr = (value || "").padEnd(length, " ").split("");
      arr[i] = ch || " ";
      const v = arr.join("").replace(/\s+$/, "");
      onChange(v.replace(/ /g, ""));
    };
    return /* @__PURE__ */ React.createElement("div", { className: "otp", role: "group", "aria-label": "One-time code" }, digits.map((d, i) => /* @__PURE__ */ React.createElement(
      "input",
      {
        key: i,
        ref: (el) => refs.current[i] = el,
        inputMode: "numeric",
        autoComplete: i === 0 ? "one-time-code" : "off",
        maxLength: 1,
        "aria-label": `Digit ${i + 1}`,
        value: d.trim(),
        onChange: (e) => {
          const ch = e.target.value.replace(/\D/g, "").slice(-1);
          set(i, ch);
          if (ch && refs.current[i + 1]) refs.current[i + 1].focus();
        },
        onKeyDown: (e) => {
          if (e.key === "Backspace" && !d.trim() && refs.current[i - 1]) refs.current[i - 1].focus();
        },
        onPaste: (e) => {
          const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, length);
          if (t) {
            e.preventDefault();
            onChange(t);
            const n = refs.current[Math.min(t.length, length - 1)];
            n && n.focus();
          }
        }
      }
    )));
  }
  function Tabs({ tabs, value, onChange, className, id }) {
    const gid = useMemo(() => id || "tabs" + Math.random().toString(36).slice(2, 7), [id]);
    return /* @__PURE__ */ React.createElement("div", { className: cx("tabs", className), role: "tablist" }, tabs.map((t) => /* @__PURE__ */ React.createElement("button", { key: t.id, type: "button", role: "tab", "aria-selected": value === t.id, className: "tab-btn", onClick: () => onChange(t.id) }, value === t.id && /* @__PURE__ */ React.createElement(motion.span, { layoutId: gid, className: "tab-thumb", transition: { type: "spring", stiffness: 500, damping: 40 } }), t.icon && /* @__PURE__ */ React.createElement(Icon, { name: t.icon, size: 16 }), /* @__PURE__ */ React.createElement("span", null, t.label), t.badge ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber" }, t.badge) : null)));
  }
  function Check({ checked, onChange, children }) {
    return /* @__PURE__ */ React.createElement("label", { className: "check" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: !!checked, onChange: (e) => onChange(e.target.checked) }), /* @__PURE__ */ React.createElement("span", null, children));
  }
  function DataTable({ columns, rows, rowKey = "id", onRow, empty, initialSort, dense, label = "Table" }) {
    const [sort, setSort] = useState(initialSort || null);
    const sorted = useMemo(() => {
      if (!sort) return rows;
      const [k, dir] = sort;
      const col = columns.find((c) => c.key === k);
      const get = (r) => col && col.sortValue ? col.sortValue(r) : r[k];
      return rows.slice().sort((a, b) => {
        const x = get(a), y = get(b);
        return (x > y ? 1 : x < y ? -1 : 0) * (dir === "desc" ? -1 : 1);
      });
    }, [rows, sort, columns]);
    if (!rows.length) return /* @__PURE__ */ React.createElement(Card, null, empty || /* @__PURE__ */ React.createElement(Empty, { icon: "search", title: "Nothing here yet" }));
    return /* @__PURE__ */ React.createElement("div", { className: "table-wrap", tabIndex: 0, role: "region", "aria-label": label }, /* @__PURE__ */ React.createElement("table", { className: "table", style: dense ? { fontSize: 13.5 } : void 0 }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, columns.map((c) => /* @__PURE__ */ React.createElement("th", { key: c.key, className: cx(c.num && "n"), style: c.width ? { width: c.width } : void 0, "aria-sort": sort && sort[0] === c.key ? sort[1] === "asc" ? "ascending" : "descending" : void 0 }, c.sortable === false ? c.label : /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setSort((s) => [c.key, s && s[0] === c.key && s[1] === "asc" ? "desc" : "asc"]) }, c.label, sort && sort[0] === c.key && /* @__PURE__ */ React.createElement(Icon, { name: sort[1] === "asc" ? "chevron-up" : "chevron-down", size: 13 })))))), /* @__PURE__ */ React.createElement("tbody", null, sorted.map((r) => /* @__PURE__ */ React.createElement("tr", { key: r[rowKey], className: cx(onRow && "clickable", r._dim && "dim"), onClick: onRow ? (e) => {
      if (e.target.closest("button, a, input, select")) return;
      onRow(r);
    } : void 0 }, columns.map((c) => /* @__PURE__ */ React.createElement("td", { key: c.key, className: cx(c.num && "n") }, c.render ? c.render(r) : r[c.key])))))));
  }
  function Skeleton({ w = "100%", h = 14, r, style }) {
    return /* @__PURE__ */ React.createElement("span", { className: "skeleton", style: { width: w, height: h, borderRadius: r, ...style }, "aria-hidden": "true" });
  }
  function Progress({ value, tone, label }) {
    return /* @__PURE__ */ React.createElement("div", { className: cx("progress", tone), role: "progressbar", "aria-valuenow": Math.round(value * 100), "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": label }, /* @__PURE__ */ React.createElement("i", { style: { "--p": Math.max(0, Math.min(1, value)) } }));
  }
  function Empty({ icon = "package", img, title, body, action }) {
    return /* @__PURE__ */ React.createElement("div", { className: "empty" }, img ? /* @__PURE__ */ React.createElement(Product, { name: img, size: 120 }) : /* @__PURE__ */ React.createElement("span", { className: "icontile soft", style: { width: 56, height: 56, borderRadius: 16 } }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 26 })), /* @__PURE__ */ React.createElement("b", null, title), body && /* @__PURE__ */ React.createElement("p", null, body), action);
  }
  function Avatar({ person, size, ring, status, className }) {
    const [err, setErr] = useState(false);
    const name = person && (person.name || person.short) || "?";
    const ini = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    return /* @__PURE__ */ React.createElement("span", { className: cx("avatar", size, ring && "ring", className) }, person && person.img && !err ? /* @__PURE__ */ React.createElement("img", { src: person.img, alt: "", onError: () => setErr(true) }) : /* @__PURE__ */ React.createElement("span", { className: "ini" }, ini), status && /* @__PURE__ */ React.createElement("i", { className: "status" }));
  }
  function Product({ name, size = 96, float, className, style, alt = "" }) {
    const [err, setErr] = useState(false);
    const src = (window.SC3_IMG || "system/img/") + name + ".webp";
    if (err) return /* @__PURE__ */ React.createElement("span", { className: cx("icontile soft", className), style: { width: size, height: size, borderRadius: size * 0.28, ...style }, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "package", size: size * 0.38, stroke: 1.5 }));
    return /* @__PURE__ */ React.createElement("img", { className, src, alt, width: size, height: size, loading: "lazy", decoding: "async", onError: () => setErr(true), style: { width: size, height: size, objectFit: "contain", animation: float ? "float-y 5s var(--ease) infinite" : void 0, ...style } });
  }
  function useEscape(open, onClose) {
    useEffect(() => {
      if (!open) return;
      const f = (e) => e.key === "Escape" && onClose && onClose();
      window.addEventListener("keydown", f);
      return () => window.removeEventListener("keydown", f);
    }, [open, onClose]);
  }
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const modals = [];
  function useModal(open, ref, onClose) {
    const { embedded } = useApp();
    const close = useRef(onClose);
    close.current = onClose;
    useEffect(() => {
      if (!open) return;
      if (embedded) {
        const f = (e) => e.key === "Escape" && close.current && close.current();
        window.addEventListener("keydown", f);
        return () => window.removeEventListener("keydown", f);
      }
      const opener = document.activeElement;
      const me = {};
      modals.push(me);
      const top = () => modals[modals.length - 1] === me;
      const raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
      });
      const onKey = (e) => {
        const el = ref.current;
        if (!el || !top()) return;
        if (e.key === "Escape") {
          close.current && close.current();
          return;
        }
        if (e.key !== "Tab") return;
        const items = [...el.querySelectorAll(FOCUSABLE)].filter((n) => n.getClientRects().length);
        const at = document.activeElement;
        if (!items.length) {
          e.preventDefault();
          el.focus();
          return;
        }
        const first = items[0], last = items[items.length - 1];
        if (!el.contains(at)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && (at === first || at === el)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && at === last) {
          e.preventDefault();
          first.focus();
        }
      };
      document.addEventListener("keydown", onKey);
      return () => {
        cancelAnimationFrame(raf);
        document.removeEventListener("keydown", onKey);
        modals.splice(modals.indexOf(me), 1);
        if (opener && opener.isConnected && typeof opener.focus === "function") opener.focus({ preventScroll: true });
      };
    }, [open, embedded]);
  }
  function Sheet({ open, onClose, title, children, footer, side, detent = "large", headerRight, className, labelledBy }) {
    const app = useApp();
    const reduce = useReducedMotion();
    const panel = useRef(null);
    useModal(open, panel, onClose);
    const mode = side || (app.bp === "phone" ? "bottom" : "side");
    const [cur, setCur] = useState(detent);
    useEffect(() => {
      if (open) setCur(detent);
    }, [open, detent]);
    const H = app.h || 800;
    const largeH = H * 0.94;
    const mediumH = Math.min(largeH, H * 0.58);
    const offset = mode === "bottom" ? cur === "medium" ? largeH - mediumH : 0 : 0;
    const spring = reduce ? { duration: 0.01 } : { type: "spring", stiffness: 420, damping: 40, mass: 0.9 };
    const variants = mode === "bottom" ? { initial: { y: largeH }, animate: { y: offset }, exit: { y: largeH } } : mode === "center" ? { initial: { opacity: 0, scale: 0.96, x: "-50%", y: "-48%" }, animate: { opacity: 1, scale: 1, x: "-50%", y: "-50%" }, exit: { opacity: 0, scale: 0.97, x: "-50%", y: "-48%" } } : { initial: { x: "105%" }, animate: { x: 0 }, exit: { x: "105%" } };
    return /* @__PURE__ */ React.createElement(Portal, null, /* @__PURE__ */ React.createElement(AnimatePresence, null, open && /* @__PURE__ */ React.createElement(Fragment, { key: "sheet" }, /* @__PURE__ */ React.createElement(motion.div, { className: "scrim", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 }, onClick: onClose }), /* @__PURE__ */ React.createElement(
      motion.div,
      {
        ref: panel,
        tabIndex: -1,
        role: "dialog",
        "aria-modal": app.embedded ? void 0 : "true",
        "aria-label": typeof title === "string" ? title : void 0,
        className: cx("sheet", `sheet-${mode}`, className),
        style: mode === "bottom" ? { height: largeH } : void 0,
        initial: variants.initial,
        animate: variants.animate,
        exit: variants.exit,
        transition: spring,
        drag: mode === "bottom" ? "y" : false,
        dragConstraints: { top: 0, bottom: largeH },
        dragElastic: { top: 0.04, bottom: 0.6 },
        dragMomentum: false,
        onDragEnd: (e, info) => {
          if (mode !== "bottom") return;
          const y = offset + info.offset.y;
          const v = info.velocity.y;
          if (v > 700 || y > largeH - mediumH * 0.45) {
            onClose && onClose();
            return;
          }
          if (y > (largeH - mediumH) / 2 || v > 300) setCur("medium");
          else setCur("large");
        }
      },
      mode === "bottom" && /* @__PURE__ */ React.createElement("div", { className: "grabber", "aria-hidden": "true" }),
      /* @__PURE__ */ React.createElement("div", { className: "sheet-head" }, typeof title === "string" ? /* @__PURE__ */ React.createElement("h2", null, title) : title, headerRight, /* @__PURE__ */ React.createElement(IconButton, { icon: "x", label: "Close", round: true, onClick: onClose })),
      /* @__PURE__ */ React.createElement("div", { className: "sheet-body", onPointerDownCapture: (e) => {
        if (mode === "bottom" && e.currentTarget.scrollTop > 0) e.stopPropagation();
      } }, children),
      footer && /* @__PURE__ */ React.createElement("div", { className: "sheet-foot" }, footer)
    ))));
  }
  function Alert({ open, title, message, actions = [], onClose }) {
    const app = useApp();
    const panel = useRef(null);
    useModal(open, panel, onClose);
    return /* @__PURE__ */ React.createElement(Portal, null, /* @__PURE__ */ React.createElement(AnimatePresence, null, open && /* @__PURE__ */ React.createElement(Fragment, { key: "alert" }, /* @__PURE__ */ React.createElement(motion.div, { className: "scrim", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose }), /* @__PURE__ */ React.createElement(motion.div, { ref: panel, tabIndex: -1, role: "alertdialog", "aria-modal": app.embedded ? void 0 : "true", "aria-label": title, className: "alert", initial: { opacity: 0, scale: 1.08, x: "-50%", y: "-50%" }, animate: { opacity: 1, scale: 1, x: "-50%", y: "-50%" }, exit: { opacity: 0, scale: 0.96, x: "-50%", y: "-50%" }, transition: { type: "spring", stiffness: 500, damping: 36 } }, /* @__PURE__ */ React.createElement("div", { className: "al-body" }, /* @__PURE__ */ React.createElement("h3", null, title), message && /* @__PURE__ */ React.createElement("p", null, message)), /* @__PURE__ */ React.createElement("div", { className: "al-actions", style: actions.length > 2 ? { gridAutoFlow: "row" } : void 0 }, actions.map((a) => /* @__PURE__ */ React.createElement("button", { key: a.label, type: "button", className: cx(a.strong && "strong", a.danger && "danger"), onClick: () => {
      a.onClick && a.onClick();
      onClose && onClose();
    } }, a.label)))))));
  }
  function Menu({ open, onClose, items, align = "right", width = 240, style }) {
    const ref = useRef(null);
    useEscape(open, onClose);
    useEffect(() => {
      if (!open) return;
      const f = (e) => {
        if (ref.current && !ref.current.contains(e.target)) onClose();
      };
      setTimeout(() => document.addEventListener("pointerdown", f), 0);
      return () => document.removeEventListener("pointerdown", f);
    }, [open]);
    return /* @__PURE__ */ React.createElement(AnimatePresence, null, open && /* @__PURE__ */ React.createElement(motion.div, { ref, role: "menu", className: "menu", style: { top: "calc(100% + 6px)", [align]: 0, width, ...style }, initial: { opacity: 0, scale: 0.96, y: -4 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.97, y: -2 }, transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] } }, items.filter(Boolean).map((it, i) => it === "-" ? /* @__PURE__ */ React.createElement("div", { key: i, className: "msep" }) : it.label && it.heading ? /* @__PURE__ */ React.createElement("div", { key: i, className: "mlabel" }, it.label) : /* @__PURE__ */ React.createElement("button", { key: i, type: "button", role: "menuitem", className: cx("mi", it.danger && "danger"), onClick: () => {
      onClose();
      it.onClick && it.onClick();
    } }, it.icon && /* @__PURE__ */ React.createElement(Icon, { name: it.icon, size: 17 }), /* @__PURE__ */ React.createElement("span", { className: "grow" }, it.label), it.right))));
  }
  const NoticeCtx = createContext({ push: () => {
  }, toast: () => {
  } });
  function NoticeHost({ children, resetKey }) {
    const [banners, setBanners] = useState([]);
    const [toasts, setToasts] = useState([]);
    const timers = useRef([]);
    useEffect(() => {
      setBanners([]);
      setToasts([]);
    }, [resetKey]);
    useEffect(() => () => timers.current.forEach(clearTimeout), []);
    const push = useCallback((b) => {
      const id = Math.random().toString(36).slice(2);
      setBanners((x) => [{ id, ...b }, ...x].slice(0, 2));
      timers.current.push(setTimeout(() => setBanners((x) => x.filter((y) => y.id !== id)), b.ms || 6200));
    }, []);
    const toast = useCallback((t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((x) => [...x, { id, ...t }].slice(-3));
      timers.current.push(setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), t.ms || 3200));
    }, []);
    const close = (id) => setBanners((x) => x.filter((y) => y.id !== id));
    const api = useMemo(() => ({ push, toast }), [push, toast]);
    return /* @__PURE__ */ React.createElement(NoticeCtx.Provider, { value: api }, children, /* @__PURE__ */ React.createElement("div", { className: "banners", "aria-live": "polite" }, /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, banners.map((b) => /* @__PURE__ */ React.createElement(motion.button, { key: b.id, type: "button", layout: true, className: "banner", initial: { opacity: 0, y: -40, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -24, scale: 0.97 }, transition: { type: "spring", stiffness: 420, damping: 34 }, drag: "y", dragConstraints: { top: 0, bottom: 0 }, dragElastic: { top: 0.6, bottom: 0.1 }, onDragEnd: (e, i) => {
      if (i.offset.y < -24) close(b.id);
    }, onClick: () => {
      close(b.id);
      b.onOpen && b.onOpen();
    } }, /* @__PURE__ */ React.createElement("span", { style: { width: 38, height: 38 } }, b.person ? /* @__PURE__ */ React.createElement(Avatar, { person: b.person, size: "lg", className: "" }) : /* @__PURE__ */ React.createElement(Mark, { size: 38, still: true })), /* @__PURE__ */ React.createElement("span", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "bn-top" }, /* @__PURE__ */ React.createElement("span", { className: "bn-app" }, b.app || "Smart-Clearance"), /* @__PURE__ */ React.createElement("span", { className: "bn-time" }, b.at || "now")), /* @__PURE__ */ React.createElement("b", null, b.title), /* @__PURE__ */ React.createElement("p", { className: cx(b.hindi && "hi", "clamp-3"), style: { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } }, b.body)))))), /* @__PURE__ */ React.createElement("div", { className: "toasts", "aria-live": "polite" }, /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, toasts.map((t) => /* @__PURE__ */ React.createElement(motion.div, { key: t.id, layout: true, className: cx("toast", t.tone), initial: { opacity: 0, y: 16, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 8 }, transition: { type: "spring", stiffness: 420, damping: 34 } }, /* @__PURE__ */ React.createElement(Icon, { name: t.icon || (t.tone === "err" ? "circle-alert" : "circle-check"), size: 18 }), /* @__PURE__ */ React.createElement("span", null, t.text))))));
  }
  const useNotice = () => useContext(NoticeCtx);
  function Mark({ size = 40, play, still, className, onDone }) {
    const reduce = useReducedMotion();
    const animate = play && !reduce;
    const gid = useMemo(() => "mk" + Math.random().toString(36).slice(2, 7), []);
    useEffect(() => {
      if (!onDone) return;
      const t = setTimeout(onDone, animate ? 1500 : 10);
      return () => clearTimeout(t);
    }, [animate]);
    const S = "M43.5 19 H27 a7 7 0 0 0 0 14 h10 a7 7 0 0 1 0 14 H20.5";
    return /* @__PURE__ */ React.createElement("svg", { className: cx("mark", className), width: size, height: size, viewBox: "0 0 64 64", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: gid + "g", x1: "8", y1: "4", x2: "58", y2: "62", gradientUnits: "userSpaceOnUse" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#2fbf7f" }), /* @__PURE__ */ React.createElement("stop", { offset: "0.55", stopColor: "#178258" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#0d5a3e" })), /* @__PURE__ */ React.createElement("linearGradient", { id: gid + "h", x1: "32", y1: "2", x2: "32", y2: "34", gradientUnits: "userSpaceOnUse" }, /* @__PURE__ */ React.createElement("stop", { offset: "0", stopColor: "#fff", stopOpacity: "0.28" }), /* @__PURE__ */ React.createElement("stop", { offset: "1", stopColor: "#fff", stopOpacity: "0" }))), /* @__PURE__ */ React.createElement(motion.path, { d: "M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z", fill: `url(#${gid}g)`, initial: animate ? { scale: 0.55, opacity: 0 } : false, animate: { scale: 1, opacity: 1 }, transition: { type: "spring", stiffness: 260, damping: 18 }, style: { transformOrigin: "32px 32px" } }), /* @__PURE__ */ React.createElement("path", { d: "M32 3C10.5 3 3 10.5 3 31.5 10 22 22 18 32 18s22 4 29 13.5C61 10.5 53.5 3 32 3Z", fill: `url(#${gid}h)` }), /* @__PURE__ */ React.createElement(motion.path, { d: S, fill: "none", stroke: "#fff", strokeWidth: "6", strokeLinecap: "round", strokeLinejoin: "round", initial: animate ? { pathLength: 0 } : false, animate: { pathLength: 1 }, transition: { duration: 0.75, delay: 0.25, ease: [0.65, 0, 0.35, 1] } }), /* @__PURE__ */ React.createElement(motion.circle, { cx: "43.5", cy: "19", r: "3.4", fill: "#0d5a3e", stroke: "#fff", strokeWidth: "2.6", initial: animate ? { scale: 0 } : false, animate: { scale: 1 }, transition: { delay: 0.18, type: "spring", stiffness: 500, damping: 20 }, style: { transformOrigin: "43.5px 19px" } }), animate && /* @__PURE__ */ React.createElement(motion.circle, { cx: "20.5", cy: "47", r: "5", fill: "none", stroke: "#f7c04a", strokeWidth: "2", initial: { scale: 0.6, opacity: 0 }, animate: { scale: [0.6, 2.2], opacity: [0.9, 0] }, transition: { delay: 1.1, duration: 0.9, ease: "easeOut" }, style: { transformOrigin: "20.5px 47px" } }), /* @__PURE__ */ React.createElement(motion.circle, { cx: "20.5", cy: "47", r: "5.2", fill: "#f7c04a", stroke: "#fff", strokeWidth: "2.2", initial: animate ? { y: -16, opacity: 0, scale: 0.6 } : false, animate: { y: 0, opacity: 1, scale: 1 }, transition: { delay: 0.95, type: "spring", stiffness: 520, damping: 14 }, style: { transformOrigin: "20.5px 47px" } }));
  }
  function Wordmark({ size = 20, className, play }) {
    const reduce = useReducedMotion();
    const word = "Smart-Clearance";
    if (!play || reduce) return /* @__PURE__ */ React.createElement("span", { className: cx("wordmark", className), style: { fontSize: size } }, "Smart‑Clearance");
    return /* @__PURE__ */ React.createElement("span", { className: cx("wordmark", className), style: { fontSize: size, display: "inline-flex", overflow: "hidden" }, role: "img", "aria-label": word }, word.split("").map((ch, i) => /* @__PURE__ */ React.createElement(motion.span, { key: i, "aria-hidden": "true", initial: { y: "105%", opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.55 + i * 0.028, type: "spring", stiffness: 380, damping: 28 }, style: { display: "inline-block" } }, ch === "-" ? "‑" : ch)));
  }
  function Splash({ onDone, hold = 2300 }) {
    const reduce = useReducedMotion();
    const [leaving, setLeaving] = useState(false);
    useEffect(() => {
      const t = setTimeout(() => setLeaving(true), reduce ? 600 : hold);
      return () => clearTimeout(t);
    }, []);
    return /* @__PURE__ */ React.createElement(AnimatePresence, { onExitComplete: onDone }, !leaving && /* @__PURE__ */ React.createElement(motion.div, { className: "splash", role: "presentation", onClick: () => setLeaving(true), exit: { opacity: 0, scale: 1.04 }, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }, /* @__PURE__ */ React.createElement("div", { className: "ground", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "sp-inner" }, /* @__PURE__ */ React.createElement(Mark, { size: 112, play: true }), /* @__PURE__ */ React.createElement(Wordmark, { size: 34, play: true }), /* @__PURE__ */ React.createElement(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: reduce ? 0 : 1.15, duration: 0.5 }, className: "stack tight", style: { justifyItems: "center" } }, /* @__PURE__ */ React.createElement("span", { className: "sp-tag" }, "Every near-expiry carton gets a second chance, chosen by AI."), /* @__PURE__ */ React.createElement("span", { className: "sp-hi" }, "हर कार्टन को दूसरा मौका"))), /* @__PURE__ */ React.createElement("span", { className: "sp-skip" }, "Tap to skip")));
  }
  function Shell({ nav, current, onNav, user, onUser, footer, brandRight, brand, brandMark, children }) {
    const app = useApp();
    if (app.bp === "phone") return /* @__PURE__ */ React.createElement("div", { className: "layer", style: { position: "absolute", inset: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "scroll", style: { position: "absolute", inset: 0, paddingBottom: "calc(var(--tabbar-h) + var(--safe-bottom))" }, id: "main" }, children), /* @__PURE__ */ React.createElement("nav", { className: "tabbar", "aria-label": "Main" }, nav.filter((n) => !n.phoneHidden).slice(0, 4).map((n) => /* @__PURE__ */ React.createElement("button", { key: n.id, type: "button", className: "tab", "aria-current": current === n.id ? "page" : void 0, onClick: () => onNav(n.id) }, /* @__PURE__ */ React.createElement(Icon, { name: n.icon, size: 23, stroke: current === n.id ? 2.1 : 1.7 }), /* @__PURE__ */ React.createElement("span", null, n.short || n.label), n.badge ? /* @__PURE__ */ React.createElement("span", { className: "badge-count" }, n.badge) : null))));
    if (app.bp === "tablet") return /* @__PURE__ */ React.createElement("div", { className: "layer", style: { position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "76px minmax(0,1fr)" } }, /* @__PURE__ */ React.createElement("nav", { className: "sidebar rail-compact", "aria-label": "Main", style: { padding: "14px 10px" } }, /* @__PURE__ */ React.createElement("div", { className: "sb-brand", style: { justifyContent: "center", padding: "2px 0 12px" } }, brandMark || /* @__PURE__ */ React.createElement(Mark, { size: 36 })), nav.map((n) => /* @__PURE__ */ React.createElement("button", { key: n.id, type: "button", className: "sb-item", title: n.label, "aria-label": n.label, "aria-current": current === n.id ? "page" : void 0, onClick: () => onNav(n.id), style: { position: "relative" } }, /* @__PURE__ */ React.createElement(Icon, { name: n.icon, size: 21 }), n.badge ? /* @__PURE__ */ React.createElement("span", { className: "badge-count", style: { position: "absolute", top: 3, right: 6 } }, n.badge) : null)), /* @__PURE__ */ React.createElement("div", { className: "sb-foot" }, user && /* @__PURE__ */ React.createElement("button", { type: "button", className: "sb-user", style: { justifyContent: "center", padding: 6 }, onClick: onUser, "aria-label": user.name }, /* @__PURE__ */ React.createElement(Avatar, { person: user, size: "sm" })))), /* @__PURE__ */ React.createElement("div", { className: "scroll", style: { position: "relative", minWidth: 0 }, id: "main" }, children));
    return /* @__PURE__ */ React.createElement("div", { className: "layer", style: { position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "var(--sidebar-w) minmax(0,1fr)" } }, /* @__PURE__ */ React.createElement("nav", { className: "sidebar", "aria-label": "Main" }, /* @__PURE__ */ React.createElement("div", { className: "sb-brand" }, brand || /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Mark, { size: 32 }), /* @__PURE__ */ React.createElement(Wordmark, { size: 18 })), brandRight), nav.map((n, i) => /* @__PURE__ */ React.createElement(Fragment, { key: n.id }, n.section && /* @__PURE__ */ React.createElement("div", { className: "sb-label" }, n.section), /* @__PURE__ */ React.createElement("button", { type: "button", className: "sb-item", "aria-current": current === n.id ? "page" : void 0, onClick: () => onNav(n.id) }, /* @__PURE__ */ React.createElement(Icon, { name: n.icon, size: 19 }), /* @__PURE__ */ React.createElement("span", null, n.label), n.badge ? /* @__PURE__ */ React.createElement("span", { className: "badge-count" }, n.badge) : n.count != null ? /* @__PURE__ */ React.createElement("span", { className: "sb-n" }, n.count) : null))), /* @__PURE__ */ React.createElement("div", { className: "sb-foot" }, footer, user && /* @__PURE__ */ React.createElement("button", { type: "button", className: "sb-user", onClick: onUser, title: `${user.name} · ${user.role}${user.org ? " · " + user.org : ""}` }, /* @__PURE__ */ React.createElement(Avatar, { person: user, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "who" }, /* @__PURE__ */ React.createElement("b", null, user.name), /* @__PURE__ */ React.createElement("span", null, user.role, user.org ? " · " + user.org : "")), /* @__PURE__ */ React.createElement(Icon, { name: "ellipsis", size: 18, className: "subtle" })))), /* @__PURE__ */ React.createElement("div", { className: "scroll", style: { position: "relative", minWidth: 0 }, id: "main" }, children));
  }
  function Page({ title, sub, back, onBack, actions, children, wide, pad = true, hideLarge }) {
    const sentinel = useRef(null);
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
      const s = sentinel.current;
      if (!s) return;
      let root = s.parentElement;
      while (root && !(root.classList && root.classList.contains("scroll"))) root = root.parentElement;
      const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { root: root || null, threshold: 0 });
      io.observe(s);
      return () => io.disconnect();
    }, []);
    return /* @__PURE__ */ React.createElement("div", { className: "layer" }, /* @__PURE__ */ React.createElement("header", { className: cx("navbar", scrolled && "scrolled") }, back ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "nb-back", onClick: onBack, "aria-label": "Back to " + back }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-left", size: 22, stroke: 2.2 }), /* @__PURE__ */ React.createElement("span", { className: "nb-back-t" }, back)) : null, /* @__PURE__ */ React.createElement("span", { className: "nb-title" }, title), /* @__PURE__ */ React.createElement("div", { className: "nb-actions" }, actions)), !hideLarge && /* @__PURE__ */ React.createElement("div", { className: "largetitle" }, /* @__PURE__ */ React.createElement("h1", null, title), sub && /* @__PURE__ */ React.createElement("div", { className: "lt-sub" }, sub)), /* @__PURE__ */ React.createElement("div", { ref: sentinel, style: { height: 1, marginTop: -1 }, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "pagebody", style: pad ? { padding: "0 var(--page-x, 16px) 40px", maxWidth: wide ? "none" : 1320 } : void 0 }, children));
  }
  function ModeMenuButton() {
    const { mode, resolved, setMode } = useTheme();
    const [open, setOpen] = useState(false);
    return /* @__PURE__ */ React.createElement("span", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(IconButton, { icon: resolved === "dark" ? "moon" : "sun", label: "Appearance", onClick: () => setOpen((o) => !o) }), /* @__PURE__ */ React.createElement(Menu, { open, onClose: () => setOpen(false), width: 200, items: [{ label: "Appearance", heading: true }, { label: "Light", icon: "sun", right: mode === "light" && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16 }), onClick: () => setMode("light") }, { label: "Dark", icon: "moon", right: mode === "dark" && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16 }), onClick: () => setMode("dark") }, { label: "Match device", icon: "monitor", right: mode === "system" && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16 }), onClick: () => setMode("system") }] }));
  }
  window.SC3 = Object.assign(window.SC3 || {}, {
    cx,
    ThemeProvider,
    useTheme,
    AppRoot,
    useApp,
    Portal,
    Icon,
    Spinner,
    Button,
    IconButton,
    Badge,
    Chip,
    Kbd,
    Card,
    List,
    ListRow,
    Segmented,
    Switch,
    Field,
    Input,
    SearchField,
    Select,
    Textarea,
    Stepper,
    OTP,
    Tabs,
    Check,
    DataTable,
    Skeleton,
    Progress,
    Empty,
    Avatar,
    Product,
    Sheet,
    Alert,
    Menu,
    NoticeHost,
    useNotice,
    Mark,
    Wordmark,
    Splash,
    Shell,
    Page,
    ModeMenuButton
  });
})();
