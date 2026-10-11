(function() {
  const { useState, useEffect } = React;
  const K = window.SC3, S = window.SC3_SCREENS, L = S.Live, T = window.SCT;
  const { cx, Icon } = K;
  const TIP = "Prototype time · press for how to reset or fast-forward";
  const open = () => window.dispatchEvent(new Event("sct-open"));
  function Line() {
    const live = S.useLive();
    const c = live.clock;
    return /* @__PURE__ */ React.createElement("span", { className: cx("lv-line", live.conn !== "live" && "off") }, /* @__PURE__ */ React.createElement(L.ConnMark, { conn: live.conn }), /* @__PURE__ */ React.createElement("span", { className: "lv-st" }, L.stateWord(live.conn)), /* @__PURE__ */ React.createElement("span", { className: "lv-sep", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "lv-time pt-mark", "data-tip": TIP, onClick: open, "aria-haspopup": "dialog" }, /* @__PURE__ */ React.createElement("span", { className: "lv-date" }, c.date), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, c.time), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, ", prototype time: how to reset or fast-forward")), /* @__PURE__ */ React.createElement(L.Cue, { perDay: c.perDay }), /* @__PURE__ */ React.createElement("span", { className: "pt-tag", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 12, stroke: 2.4 }), "Prototype"));
  }
  const MON = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";
  const DOW = "(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)";
  const RX = new RegExp(`^(?:(?:best before|before|after|since|until|due|by|at|on) )?(?:${DOW},? )?(?:\\d{1,2} ${MON}(?: 20\\d\\d)?)?(?:,? ?(?:at )?\\d{1,2}:\\d{2})?$|^${DOW} \\d{1,2}:\\d{2}$`);
  function mark(root) {
    root.querySelectorAll("#root span, #root time, #root em, #root b, #root small, #root div, #root p").forEach((el) => {
      if (el.dataset.pt || el.children.length || el.closest(".lv-line, .lv-barsub, .sheet, button, a, nav, aside")) return;
      const t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!t || !/\d/.test(t) || !RX.test(t)) return;
      el.dataset.pt = "1";
      el.classList.add("pt-mark");
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.setAttribute("data-tip", TIP);
      el.setAttribute("aria-label", t + ", prototype time: how to reset or fast-forward");
    });
  }
  function Band() {
    const [o, setO] = useState(false);
    const live = S.useLive();
    useEffect(() => {
      const h = () => setO(true);
      window.addEventListener("sct-open", h);
      const click = (e) => {
        const m = e.target.closest && e.target.closest("[data-pt]");
        if (m) open();
      };
      const key = (e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target.dataset && e.target.dataset.pt) {
          e.preventDefault();
          open();
        }
      };
      document.addEventListener("click", click);
      document.addEventListener("keydown", key);
      const run = () => mark(document);
      run();
      const mo = new MutationObserver(run);
      mo.observe(document.body, { childList: true, subtree: true, characterData: true });
      return () => {
        window.removeEventListener("sct-open", h);
        document.removeEventListener("click", click);
        document.removeEventListener("keydown", key);
        mo.disconnect();
      };
    }, []);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(BaseBand, null), /* @__PURE__ */ React.createElement(T.Guide, { open: o, onClose: () => setO(false), clock: live && live.clock }));
  }
  const BaseBand = L.Band;
  function BarSub() {
    const live = S.useLive();
    return /* @__PURE__ */ React.createElement("span", { className: "lv-barsub" }, /* @__PURE__ */ React.createElement(L.ConnMark, { conn: live.conn, size: 6 }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "tnum pt-mark", "data-tip": TIP, onClick: open, "aria-haspopup": "dialog" }, live.clock.time, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, ", prototype time")), /* @__PURE__ */ React.createElement(L.Cue, { perDay: live.clock.perDay, short: true }));
  }
  Object.assign(L, { Line, BarSub, Band });
})();
