(function() {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, F = window.SCF;
  const { Card, Money, Chip, Icon } = K;
  const { useRoute } = S;
  const fmt = M.fmt;
  function Part({ k, v, what, to, here }) {
    const { go } = useRoute();
    const inner = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: `fx-dot ${k}`, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr(v)), /* @__PURE__ */ React.createElement("span", null, what), here ? /* @__PURE__ */ React.createElement("em", null, "this page") : /* @__PURE__ */ React.createElement(Icon, { name: "arrow-right", size: 13 }));
    return here ? /* @__PURE__ */ React.createElement("span", { className: "fx-part" }, inner) : /* @__PURE__ */ React.createElement("button", { type: "button", className: "fx-part link", onClick: () => go(to) }, inner);
  }
  function Head({ b, page, live }) {
    const W = D.WORKSPACE.short;
    return /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "lg-fig" }, /* @__PURE__ */ React.createElement(Money, { value: b.cost, size: "l" }), /* @__PURE__ */ React.createElement("span", { className: "lg-what" }, "came back to you from ", b.n, " batches since July, all they cost you")), /* @__PURE__ */ React.createElement(F.SplitBar, { sold: b.sold, credit: b.credit, label: `${fmt.inr(b.sold)} sold and ${fmt.inr(b.credit)} credited` }), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(Part, { k: "sold", v: b.sold, what: "you sold, on Orders", to: "orders", here: page === "orders" }), /* @__PURE__ */ React.createElement(Part, { k: "credit", v: b.credit, what: `${W} credited, ${b.notes} credit notes on Batches`, to: "batches", here: page === "batches" })), page === "orders" && live ? /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, "And ", fmt.inr(live), " sold so far from the batch still in a journey.") : null);
  }
  const Back = ({ x }) => /* @__PURE__ */ React.createElement("span", { className: "lg-val fx-back" }, /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr(x.cost), " back"), /* @__PURE__ */ React.createElement(F.SplitBar, { sold: x.sold, credit: x.credit, label: `${fmt.inr(x.sold)} sold, ${fmt.inr(x.credit)} credited` }), /* @__PURE__ */ React.createElement("em", null, fmt.inr(x.sold), " sold · ", fmt.inr(x.credit), " credited"));
  const BatchValue = ({ x, sold, live }) => live || !x ? /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.inr(sold), " so far") : /* @__PURE__ */ React.createElement(Back, { x });
  Object.assign(S, {
    DistBatches: (props) => /* @__PURE__ */ React.createElement(F.DistBatchesPage, { ...props, Head, RowValue: Back }),
    DistOrders: (props) => /* @__PURE__ */ React.createElement(F.DistOrdersPage, { ...props, Head, BatchValue })
  });
})();
