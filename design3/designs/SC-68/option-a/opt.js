(function() {
  const { useState, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, S = window.SC3_SCREENS, X = window.SC68, M = window.SC3_MONEY;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Badge, Button, Sheet, List, ListRow, Product, useApp } = K;
  function ClockSheet({ open, onClose }) {
    const live = X.useLive();
    const app = useApp();
    return /* @__PURE__ */ React.createElement(Sheet, { open, onClose, title: "Journey time", side: app.bp === "phone" ? "bottom" : "center", detent: "medium" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("span", { className: "x68-bigtime tnum" }, live.clock.time), /* @__PURE__ */ React.createElement("span", { className: "t-subhead muted" }, live.clock.long)), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { icon: "fast-forward", iconTone: "blue", title: "Pace", sub: X.cueLong(live.clock.perDay) + " " + X.journeySpan(live.clock.perDay) }), /* @__PURE__ */ React.createElement(ListRow, { icon: live.conn === "offline" ? "wifi-off" : "activity", iconTone: live.conn === "live" ? void 0 : "gray", title: "Updates", sub: live.conn === "live" ? "Live. Agents' work arrives as it happens." : X.connWords(live.conn, live.since) })), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, "Every time on these screens is journey time. Smart-Clearance sets the pace for Munchly's workspace in the console.")));
  }
  function ShellFoot() {
    const live = X.useLive();
    const [open, setOpen] = useState(false);
    const app = useApp();
    if (app.bp === "phone") return null;
    const off = live.conn !== "live";
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("x68-clock", off && "off"), onClick: () => setOpen(true), "aria-label": `Journey time, ${live.clock.long}, ${live.clock.time}. ${X.cueLong(live.clock.perDay)} ${X.connWords(live.conn, live.since)}.` }, /* @__PURE__ */ React.createElement("span", { className: "x68-clock-st" }, /* @__PURE__ */ React.createElement(X.ConnMark, { conn: live.conn }), /* @__PURE__ */ React.createElement("span", null, X.connWords(live.conn, live.since))), /* @__PURE__ */ React.createElement("span", { className: "x68-clock-time" }, /* @__PURE__ */ React.createElement("span", { className: "x68-clock-date" }, live.clock.date), /* @__PURE__ */ React.createElement("b", { className: "tnum" }, live.clock.time)), /* @__PURE__ */ React.createElement("span", { className: "x68-clock-foot" }, /* @__PURE__ */ React.createElement("span", null, "Journey time"), /* @__PURE__ */ React.createElement(X.Cue, { perDay: live.clock.perDay }))), /* @__PURE__ */ React.createElement(ClockSheet, { open, onClose: () => setOpen(false) }));
  }
  function NavExtra() {
    const live = X.useLive();
    const [open, setOpen] = useState(false);
    const app = useApp();
    if (app.bp !== "phone") return null;
    const off = live.conn !== "live";
    const word = live.conn === "reconnecting" ? "Reconnecting" : live.conn === "offline" ? "Offline" : live.conn === "connecting" ? "Catching up" : null;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("x68-navclock", off && "off"), onClick: () => setOpen(true), "aria-label": `Journey time ${live.clock.time}, ${live.clock.date}. ${X.connWords(live.conn, live.since)}. Details` }, /* @__PURE__ */ React.createElement(X.ConnMark, { conn: live.conn, size: 7 }), word ? /* @__PURE__ */ React.createElement("span", null, word) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "tnum" }, live.clock.time), /* @__PURE__ */ React.createElement(X.Cue, { perDay: live.clock.perDay, short: true }))), /* @__PURE__ */ React.createElement(ClockSheet, { open, onClose: () => setOpen(false) }));
  }
  function Flagged({ items, phone, go, dim, offline, trackerFor, FlagRow }) {
    const [first, ...rest] = items;
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 14 } }, trackerFor(first, { phone, go, dim, offline }), rest.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "row between", style: { padding: "0 4px" } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "Also flagged this morning"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, rest.length, " more")), /* @__PURE__ */ React.createElement("div", { className: "list" }, rest.map((i) => /* @__PURE__ */ React.createElement(FlagRow, { key: i.ref, item: i, dim, onOpen: () => go("route", { ref: i.ref }) })))));
  }
  function Switcher({ items, current, phone, open: initial }) {
    const { go } = S.useRoute();
    const [open, setOpen] = useState(!!initial);
    const btn = useRef(null);
    const list = useRef(null);
    const i = Math.max(0, items.findIndex((x) => x.ref === current));
    const item = items[i];
    const v = item.view;
    const sku = v.skuObj;
    const pick = (ref) => {
      setOpen(false);
      if (ref !== current) go("route", { ref });
    };
    useEffect(() => {
      if (!open || X.SHOT) return;
      const el = list.current && list.current.querySelector('[aria-checked="true"]');
      if (el) el.focus();
    }, [open]);
    const key = (e) => {
      const all = [...list.current.querySelectorAll("[role=menuitemradio]")];
      const k = all.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        all[(k + 1) % all.length].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        all[(k - 1 + all.length) % all.length].focus();
      } else if (e.key === "Escape") {
        setOpen(false);
        btn.current && btn.current.focus();
      } else if (e.key === "Tab") setOpen(false);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "x68-switch-row" }, /* @__PURE__ */ React.createElement("div", { className: "x68-switch-wrap" }, /* @__PURE__ */ React.createElement("button", { ref: btn, type: "button", className: "x68-switch", "aria-haspopup": "menu", "aria-expanded": open, onClick: () => setOpen(!open) }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: phone ? 36 : 40, alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "x68-switch-t" }, /* @__PURE__ */ React.createElement("b", null, phone ? sku.name : `${sku.brand} ${sku.name}`), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "mono" }, v.id), " \xB7 ", phone ? v.dist.city : `${v.dist.name}, ${v.dist.city}`)), /* @__PURE__ */ React.createElement("span", { className: "x68-switch-n" }, i + 1, " of ", items.length), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-down", size: 18 })), open && /* @__PURE__ */ React.createElement("div", { ref: list, className: "x68-menu", role: "menu", "aria-label": "Batches flagged this morning", onKeyDown: key }, /* @__PURE__ */ React.createElement("div", { className: "x68-menu-h" }, "Flagged this morning"), items.map((it) => /* @__PURE__ */ React.createElement("button", { key: it.ref, type: "button", role: "menuitemradio", "aria-checked": it.ref === current, className: "x68-menu-i", onClick: () => pick(it.ref) }, /* @__PURE__ */ React.createElement(Product, { name: it.view.skuObj.img, size: 36, alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "x68-menu-t" }, /* @__PURE__ */ React.createElement("b", null, it.view.skuObj.name), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "mono" }, it.ref), " \xB7 ", it.view.daysLeft, " days left"), /* @__PURE__ */ React.createElement(X.Segs, { done: it.done, current: it.current, human: it.human, small: true, label: `${it.stop}, stop ${it.current + 1} of 9` })), /* @__PURE__ */ React.createElement("span", { className: cx("x68-menu-stop", it.human && "human") }, it.stop), it.ref === current ? /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16 }) : /* @__PURE__ */ React.createElement("span", { style: { width: 16 } }))), /* @__PURE__ */ React.createElement("div", { className: "x68-menu-sep" }), /* @__PURE__ */ React.createElement("button", { type: "button", role: "menuitem", className: "x68-menu-i x68-menu-all", onClick: () => {
      setOpen(false);
      go("batches");
    } }, /* @__PURE__ */ React.createElement(Icon, { name: "boxes", size: 18 }), /* @__PURE__ */ React.createElement("span", null, "All batches")))), !phone && /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(IconButton, { icon: "chevron-left", label: "Previous flagged batch", disabled: i === 0, onClick: () => pick(items[i - 1].ref) }), /* @__PURE__ */ React.createElement(IconButton, { icon: "chevron-right", label: "Next flagged batch", disabled: i === items.length - 1, onClick: () => pick(items[i + 1].ref) })));
  }
  function UploadOnPhoto({ p }) {
    const r = 28, c = 2 * Math.PI * r;
    return /* @__PURE__ */ React.createElement("div", { className: "x68-ringwrap" }, /* @__PURE__ */ React.createElement("div", { className: "x68-ring", role: "progressbar", "aria-label": "Sending the photo", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Math.round(p * 100) }, /* @__PURE__ */ React.createElement("svg", { width: "72", height: "72", viewBox: "0 0 72 72", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("circle", { cx: "36", cy: "36", r, fill: "none", stroke: "rgb(255 255 255 / 0.28)", strokeWidth: "5" }), /* @__PURE__ */ React.createElement("circle", { cx: "36", cy: "36", r, fill: "none", stroke: "#fff", strokeWidth: "5", strokeLinecap: "round", strokeDasharray: c, strokeDashoffset: c * (1 - p), transform: "rotate(-90 36 36)", style: { transition: "stroke-dashoffset 240ms var(--ease)" } })), /* @__PURE__ */ React.createElement("button", { type: "button", className: "x68-ring-x", "aria-label": "Cancel sending" }, /* @__PURE__ */ React.createElement(Icon, { name: "x", size: 22, stroke: 2.4 }))));
  }
  function UploadUnderPhoto({ p, mb }) {
    return /* @__PURE__ */ React.createElement("div", { className: "card row", style: { gap: 12, padding: "14px 16px" } }, /* @__PURE__ */ React.createElement("span", { className: "icontile soft", style: { width: 40, height: 40, borderRadius: 12 } }, /* @__PURE__ */ React.createElement(Icon, { name: "cloud-upload", size: 19 })), /* @__PURE__ */ React.createElement("div", { className: "grow stack tight", style: { gap: 1 } }, /* @__PURE__ */ React.createElement("b", null, "Sending the photo"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted tnum" }, mb, " of 2.3 MB \xB7 ", Math.round(p * 100), "%")), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "sm" }, "Cancel"));
  }
  window.SC68_OPT = {
    id: "a",
    name: "In the shell",
    pushPlace: "home",
    firstLoad: "skeleton",
    ShellFoot,
    NavExtra,
    Flagged,
    Switcher,
    UploadOnPhoto,
    UploadUnderPhoto,
    init: () => {
      document.documentElement.dataset.opt = "a";
    }
  };
})();
