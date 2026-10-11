(function() {
  const K = window.SC3, S = window.SC3_SCREENS, L = S.Live, T = window.SCT;
  const { cx, Icon } = K;
  function Line() {
    const live = S.useLive();
    const c = live.clock;
    return /* @__PURE__ */ React.createElement(T.WithGuide, { render: (open) => /* @__PURE__ */ React.createElement("span", { className: "pt-wrap" }, /* @__PURE__ */ React.createElement("span", { className: cx("lv-line", live.conn !== "live" && "off") }, /* @__PURE__ */ React.createElement(L.ConnMark, { conn: live.conn }), /* @__PURE__ */ React.createElement("span", { className: "lv-st" }, L.stateWord(live.conn)), /* @__PURE__ */ React.createElement("span", { className: "lv-sep", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("span", { className: "lv-time" }, /* @__PURE__ */ React.createElement("span", { className: "lv-date" }, c.date), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, c.time)), /* @__PURE__ */ React.createElement(L.Cue, { perDay: c.perDay })), /* @__PURE__ */ React.createElement("span", { className: "pt-note" }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 14, stroke: 2.2 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "Prototype time:"), " the story's own calendar, so its batches' best-before dates hold. ", /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-link", onClick: open, "aria-haspopup": "dialog" }, "How to reset or fast-forward")))) });
  }
  function BarSub() {
    const live = S.useLive();
    return /* @__PURE__ */ React.createElement(T.WithGuide, { render: (open) => /* @__PURE__ */ React.createElement("span", { className: "lv-barsub" }, /* @__PURE__ */ React.createElement(L.ConnMark, { conn: live.conn, size: 6 }), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, live.clock.time), /* @__PURE__ */ React.createElement(L.Cue, { perDay: live.clock.perDay, short: true }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-info short", onClick: open, "aria-haspopup": "dialog", "aria-label": "Prototype time: why this date, and how to reset or fast-forward the journey" }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 14, stroke: 2.2 }))) });
  }
  Object.assign(L, { Line, BarSub });
})();
