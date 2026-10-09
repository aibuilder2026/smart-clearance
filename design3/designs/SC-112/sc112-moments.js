(function() {
  const { useState } = React;
  const Q = new URLSearchParams(location.search);
  const stage = Number(Q.get("stage"));
  if (stage) setTimeout(() => window.SC3_FLOW.fastForward(stage), 0);
  if (Q.get("shot") === "1") return;
  const K = window.SC3;
  const MOMENTS = [[5, "Approve"], [6, "Execute"], [7, "Settle"], [9, "Cleared"]];
  function Moments() {
    const [open, setOpen] = useState(false);
    const now = stage || 5;
    const link = (n) => {
      const p = new URLSearchParams(location.search);
      p.set("stage", n);
      return location.pathname + "?" + p.toString() + location.hash;
    };
    return /* @__PURE__ */ React.createElement("div", { className: "sc112-moments" }, /* @__PURE__ */ React.createElement("button", { type: "button", "aria-expanded": open, "aria-controls": "sc112-moments", onClick: () => setOpen(!open) }, /* @__PURE__ */ React.createElement(K.Icon, { name: open ? "x" : "milestone", size: 16 }), /* @__PURE__ */ React.createElement("span", null, "Masala Chips at ", (MOMENTS.find((m) => m[0] === now) || MOMENTS[0])[1])), open && /* @__PURE__ */ React.createElement("nav", { id: "sc112-moments", "aria-label": "The Masala Chips' moment" }, MOMENTS.map(([n, l]) => /* @__PURE__ */ React.createElement("a", { key: n, href: link(n), "aria-current": n === now ? "page" : void 0 }, l))));
  }
  const el = document.createElement("div");
  document.body.appendChild(el);
  ReactDOM.createRoot(el).render(/* @__PURE__ */ React.createElement(Moments, null));
})();
