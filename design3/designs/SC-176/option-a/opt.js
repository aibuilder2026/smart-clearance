(function() {
  const K = window.SC3, S = window.SC3_SCREENS, L = S.Live, T = window.SCT;
  const { cx, Icon } = K;
  function Info({ onOpen, short }) {
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("pt-info", short && "short"), onClick: onOpen, "aria-haspopup": "dialog", "aria-label": short ? "Prototype time: why this date, and how to reset or fast-forward the journey" : void 0 }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: short ? 14 : 13, stroke: 2.2 }), !short && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", null, "Prototype time"), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, ": why this date, and how to reset or fast-forward the journey")));
  }
  function Line() {
    const live = S.useLive();
    const c = live.clock;
    return /* @__PURE__ */ React.createElement(T.WithGuide, { render: (open) => /* @__PURE__ */ React.createElement("span", { className: cx("lv-line", live.conn !== "live" && "off") }, /* @__PURE__ */ React.createElement(L.ConnMark, { conn: live.conn }), /* @__PURE__ */ React.createElement("span", { className: "lv-st" }, L.stateWord(live.conn)), /* @__PURE__ */ React.createElement("span", { className: "lv-sep", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", { className: "lv-time" }, /* @__PURE__ */ React.createElement("span", { className: "lv-date" }, c.date), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, c.time)), /* @__PURE__ */ React.createElement(L.Cue, { perDay: c.perDay }), /* @__PURE__ */ React.createElement(Info, { onOpen: open })) });
  }
  function BarSub() {
    const live = S.useLive();
    return /* @__PURE__ */ React.createElement(T.WithGuide, { render: (open) => /* @__PURE__ */ React.createElement("span", { className: "lv-barsub" }, /* @__PURE__ */ React.createElement(L.ConnMark, { conn: live.conn, size: 6 }), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, live.clock.time), /* @__PURE__ */ React.createElement(L.Cue, { perDay: live.clock.perDay, short: true }), /* @__PURE__ */ React.createElement(Info, { onOpen: open, short: true })) });
  }
  Object.assign(L, { Line, BarSub });
})();
