(function() {
  const K = window.SC3;
  const M = window.SC3_MONEY;
  const fmt = M.fmt;
  const { cx, Icon, Badge, Product, Countdown, StatusBadge } = K;
  const Q = new URLSearchParams(location.search);
  const OPT = ["a", "b", "c"].includes(Q.get("opt")) ? Q.get("opt") : "a";
  const STOP = M.RULES.projectionStopDays;
  const day = (iso, add) => {
    const d = /* @__PURE__ */ new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + add);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  function projection(view) {
    const need = Math.ceil(view.units / view.sellPerDay);
    const usable = view.assess.usableDays;
    return { need, usable, spare: usable - need, by: day(view.bestBefore, need - view.daysLeft), stop: day(view.bestBefore, -STOP) };
  }
  const selling = (view) => !view.phase && view.assess.status === "gated" && view.assess.atRisk === 0;
  function Gates({ gates, quiet }) {
    return /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, gates.map((g) => /* @__PURE__ */ React.createElement("span", { key: g.id, className: cx("gate", g.pass ? "pass" : "fail", !g.pass && quiet && "s83-quiet"), title: `${g.app}: ${g.rule}, has ${g.has}` }, /* @__PURE__ */ React.createElement(Icon, { name: g.pass ? "check" : "x", size: 13, stroke: 2.6 }), g.app)));
  }
  function SellBar({ view, p }) {
    const span = Math.max(view.daysLeft, 1);
    const sell = Math.min(1, p.need / span);
    const stop = Math.min(1, p.usable / span);
    return /* @__PURE__ */ React.createElement("div", { className: "s83-sell", role: "img", "aria-label": `Sells out in ${p.need} days; retailers take it for ${p.usable} more days` }, /* @__PURE__ */ React.createElement("i", { style: { "--w": sell } }), /* @__PURE__ */ React.createElement("b", { style: { "--at": stop } }));
  }
  function BatchRow({ view, onOpen, selected, compact }) {
    const a = view.assess;
    const sku = view.skuObj;
    const phase = view.phase;
    const ok = selling(view);
    const p = ok ? projection(view) : null;
    const quiet = (phase || a.status) !== "at-risk";
    const badge = OPT === "b" && ok ? /* @__PURE__ */ React.createElement(Badge, { dot: true }, "Selling through in trade") : /* @__PURE__ */ React.createElement(StatusBadge, { status: phase || a.status, live: phase === "executing" || !phase && a.status === "at-risk" });
    const failed = a.gates.filter((g) => !g.pass);
    const folded = /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, a.gates.filter((g) => g.pass).map((g) => /* @__PURE__ */ React.createElement("span", { key: g.id, className: "gate pass", title: `${g.app}: ${g.rule}, has ${g.has}` }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 13, stroke: 2.6 }), g.app)), /* @__PURE__ */ React.createElement("span", { className: "gate fail s83-quiet", title: failed.map((g) => `${g.app}: ${g.rule}, has ${g.has}`).join(" · ") }, /* @__PURE__ */ React.createElement(Icon, { name: "x", size: 13, stroke: 2.6 }), failed.length === a.gates.length ? "Not for quick commerce" : `Not for ${failed.map((g) => g.app).join(", ")}`));
    const gates = OPT === "b" && ok ? folded : /* @__PURE__ */ React.createElement(Gates, { gates: a.gates, quiet });
    const bar = OPT === "c" && ok ? /* @__PURE__ */ React.createElement(SellBar, { view, p }) : /* @__PURE__ */ React.createElement(Countdown, { days: view.daysLeft, life: sku.lifeDays, status: phase ? "" : a.status });
    const why = !ok ? a.atRisk > 0 && !phase && /* @__PURE__ */ React.createElement("span", { className: "t-caption neg strong tnum" }, fmt.num(a.atRisk), " at risk") : OPT === "a" ? /* @__PURE__ */ React.createElement("span", { className: "t-caption s83-ok s83-own tnum" }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 13, stroke: 2.6 }), "Sells out by ", p.by, " · ", p.spare, " ", p.spare === 1 ? "day" : "days", " to spare") : OPT === "b" ? /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle tnum" }, "sells out ", p.by) : /* @__PURE__ */ React.createElement("span", { className: "t-caption s83-ok tnum" }, "Sells out ", p.spare, " ", p.spare === 1 ? "day" : "days", " before retailers stop");
    return /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("list-row batchrow", OPT === "c" && ok && "s83-c"), onClick: onOpen, "aria-current": selected ? "true" : void 0, style: { background: selected ? "var(--fill)" : void 0 } }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: compact ? 46 : 54, alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "br-main" }, /* @__PURE__ */ React.createElement("span", { className: "br-line" }, /* @__PURE__ */ React.createElement("span", { className: "lr-title br-name" }, sku.name), badge), /* @__PURE__ */ React.createElement("span", { className: "lr-sub br-name" }, view.dist.name, " · ", view.dist.city, !compact && /* @__PURE__ */ React.createElement("span", { className: "mono br-id" }, " · ", view.id)), /* @__PURE__ */ React.createElement("span", { className: "br-bar" }, bar, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle tnum" }, view.daysLeft, " days left"), why)), !compact && /* @__PURE__ */ React.createElement("span", { className: "not-phone br-gates" }, gates), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18, className: "chev" }));
  }
  Object.assign(window.SC3, { BatchRow });
})();
