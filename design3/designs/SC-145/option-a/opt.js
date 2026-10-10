(function() {
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, F = window.SCF;
  const { cx, Card, Money, Icon } = K;
  const { useRoute } = S;
  const fmt = M.fmt;
  function Term({ v, what, sub, here, to }) {
    const { go } = useRoute();
    const body = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Money, { value: v, size: "m" }), /* @__PURE__ */ React.createElement("span", { className: "fx-what" }, what), /* @__PURE__ */ React.createElement("span", { className: "fx-sub" }, here ? "this page" : sub));
    return to && !here ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "fx-term link", onClick: () => go(to) }, body, /* @__PURE__ */ React.createElement(Icon, { name: "arrow-right", size: 14, className: "fx-go" })) : /* @__PURE__ */ React.createElement("span", { className: cx("fx-term", here && "here") }, body);
  }
  function Head({ b, page, live }) {
    const W = D.WORKSPACE.short;
    return /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "How your ", b.n, " cleared batches add up"), /* @__PURE__ */ React.createElement("div", { className: "fx-sum" }, /* @__PURE__ */ React.createElement(Term, { v: b.cost, what: "what they cost you", sub: `${fmt.num(b.n)} batches at the dealer price` }), /* @__PURE__ */ React.createElement("span", { className: "fx-op", "aria-hidden": "true" }, "="), /* @__PURE__ */ React.createElement(Term, { v: b.sold, what: "you sold", sub: "to your kiranas, buyers and staff · on Orders", here: page === "orders", to: "orders" }), /* @__PURE__ */ React.createElement("span", { className: "fx-op", "aria-hidden": "true" }, "+"), /* @__PURE__ */ React.createElement(Term, { v: b.credit, what: `${W} credited you`, sub: `${b.notes} credit notes · on Batches`, here: page === "batches", to: "batches" })), /* @__PURE__ */ React.createElement(F.SplitBar, { sold: b.sold, credit: b.credit, label: `${fmt.inr(b.sold)} sold and ${fmt.inr(b.credit)} credited, of ${fmt.inr(b.cost)}` }), /* @__PURE__ */ React.createElement("p", { className: "lg-working" }, "So you ended whole on every batch: ₹0 gained or lost. Each batch below shows its own sum, and its Money tab every line of it.", page === "orders" && live ? ` The ${fmt.inr(live)} sold from the batch still in a journey joins the sum once it clears.` : ""));
  }
  const RowValue = ({ x }) => /* @__PURE__ */ React.createElement("span", { className: "lg-val" }, /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr(x.credit), " credited"), /* @__PURE__ */ React.createElement("em", null, "+ ", fmt.inr(x.sold), " sold = ", fmt.inr(x.cost)));
  const BatchValue = ({ x, sold, live }) => live || !x ? /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.inr(sold)) : /* @__PURE__ */ React.createElement("span", { className: "lg-val" }, /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr(x.sold), " sold"), /* @__PURE__ */ React.createElement("em", null, "+ ", fmt.inr(x.credit), " credited = ", fmt.inr(x.cost)));
  Object.assign(S, {
    DistBatches: (props) => /* @__PURE__ */ React.createElement(F.DistBatchesPage, { ...props, Head, RowValue }),
    DistOrders: (props) => /* @__PURE__ */ React.createElement(F.DistOrdersPage, { ...props, Head, BatchValue })
  });
})();
