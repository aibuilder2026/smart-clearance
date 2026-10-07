(function() {
  const { useState, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, S = window.SC3_SCREENS;
  const { Icon, Shell, useApp } = K;
  const NAV = {
    operator: [{ id: "command", label: "Command Center", short: "Today", icon: "layout-dashboard" }, { id: "route", label: "Route Room", short: "Route", icon: "route" }, { id: "execution", label: "Execution", short: "Live", icon: "activity" }, { id: "batches", label: "Batches", icon: "boxes" }, { id: "setup", label: "Setup", icon: "sliders-horizontal", phoneHidden: true }, { id: "report", label: "Finance & ESG", short: "Reports", icon: "chart-line", section: "Reports", phoneHidden: true }],
    distributor: [{ id: "home", label: "Today", icon: "house" }, { id: "photo", label: "Label photo", short: "Photo", icon: "camera" }, { id: "van", label: "Van route", short: "Van", icon: "truck" }, { id: "orders", label: "Orders", icon: "clipboard-list" }],
    retailer: [{ id: "home", label: "Offers", icon: "tag" }, { id: "orders", label: "Orders", icon: "shopping-basket" }],
    buyer: [{ id: "market", label: "Marketplace", short: "Market", icon: "store" }, { id: "bids", label: "My bids", short: "Bids", icon: "gavel" }],
    finance: [{ id: "paperwork", label: "Paperwork", icon: "file-text" }, { id: "report", label: "Finance & ESG", short: "Reports", icon: "chart-line" }, { id: "batches", label: "Batches", icon: "boxes" }],
    sustainability: [{ id: "report", label: "Finance & ESG", short: "Reports", icon: "chart-line" }, { id: "paperwork", label: "Evidence", icon: "file-text" }, { id: "batches", label: "Batches", icon: "boxes" }],
    foodbank: [{ id: "pickups", label: "Pickups", icon: "heart-handshake" }],
    admin: [{ id: "workspace", label: "Workspace", icon: "building-2" }, { id: "users", label: "Users", icon: "users" }, { id: "rules", label: "Guardrails", icon: "shield" }, { id: "integrations", label: "Integrations", short: "Apps", icon: "plug", phoneHidden: true }, { id: "audit", label: "Audit log", short: "Audit", icon: "scroll-text" }]
  };
  const HOME = { operator: "command", distributor: "home", retailer: "home", buyer: "market", finance: "paperwork", sustainability: "report", foodbank: "pickups", admin: "workspace" };
  const PARENT = { listing: "market", offer: "home" };
  const ALWAYS = ["inbox", "profile"];
  const routesFor = (role) => NAV[role].map((n) => n.id).concat(ALWAYS, role === "buyer" ? ["listing"] : role === "retailer" ? ["offer"] : role === "operator" ? ["paperwork"] : []);
  function screenFor(me, name, opts) {
    const X = S, r = me.role;
    switch (name) {
      case "command":
        return /* @__PURE__ */ React.createElement(X.CommandCenter, { me });
      case "route":
        return /* @__PURE__ */ React.createElement(X.RouteRoom, { me });
      case "execution":
        return /* @__PURE__ */ React.createElement(X.Execution, { me });
      case "batches":
        return /* @__PURE__ */ React.createElement(X.Batches, { me });
      case "setup":
        return /* @__PURE__ */ React.createElement(X.Setup, { me });
      case "report":
        return /* @__PURE__ */ React.createElement(X.Report, { me });
      case "paperwork":
        return /* @__PURE__ */ React.createElement(X.Paperwork, { me });
      case "home":
        return r === "retailer" ? /* @__PURE__ */ React.createElement(X.RetailHome, { me }) : /* @__PURE__ */ React.createElement(X.DistHome, { me });
      case "photo":
        return /* @__PURE__ */ React.createElement(X.CameraScreen, { me, realCamera: opts && opts.realCamera });
      case "van":
        return /* @__PURE__ */ React.createElement(X.VanRoute, { me });
      case "orders":
        return r === "retailer" ? /* @__PURE__ */ React.createElement(X.RetailOrders, { me }) : /* @__PURE__ */ React.createElement(X.DistOrders, { me });
      case "offer":
        return /* @__PURE__ */ React.createElement(X.OfferDetail, { me });
      case "market":
        return /* @__PURE__ */ React.createElement(X.Market, { me });
      case "listing":
        return /* @__PURE__ */ React.createElement(X.Listing, { me });
      case "bids":
        return /* @__PURE__ */ React.createElement(X.MyBids, { me });
      case "pickups":
        return /* @__PURE__ */ React.createElement(X.Pickups, { me });
      case "workspace":
        return /* @__PURE__ */ React.createElement(X.WorkspaceSettings, { me });
      case "users":
        return /* @__PURE__ */ React.createElement(X.Users, { me });
      case "rules":
        return /* @__PURE__ */ React.createElement(X.Rules, { me });
      case "integrations":
        return /* @__PURE__ */ React.createElement(X.Integrations, { me });
      case "audit":
        return /* @__PURE__ */ React.createElement(X.Audit, { me });
      case "inbox":
        return /* @__PURE__ */ React.createElement(X.Inbox, { me, routes: routesFor(r) });
      case "profile":
        return /* @__PURE__ */ React.createElement(X.Profile, { me });
      default:
        return screenFor(me, HOME[r], opts);
    }
  }
  const EsBrand = () => /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "es-logo", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "hourglass", size: 16, stroke: 2.2 })), /* @__PURE__ */ React.createElement("span", { className: "es-word" }, "ExpireSoon"));
  function RoleApp({ me, route, onGo, onBack, realCamera, pushStep }) {
    const reduce = useReducedMotion();
    const top = useRef(null);
    const [wsOpen, setWsOpen] = useState(false);
    const name = route && route.name ? route.name : HOME[me.role];
    const allowed = routesFor(me.role);
    const safe = allowed.includes(name) ? name : HOME[me.role];
    const nav = NAV[me.role];
    const current = PARENT[safe] || safe;
    const ref = route && route.params && route.params.ref;
    React.useLayoutEffect(() => {
      const el = top.current;
      const sc = el && el.closest(".scroll");
      if (sc) sc.scrollTop = 0;
    }, [safe, me.id, ref]);
    useEffect(() => setWsOpen(false), [me.id]);
    const display = Object.assign({}, me, { role: S.ROLES[me.role] });
    const inside = me.role !== "buyer";
    const W = D.WORKSPACE;
    const ws = inside ? { name: W.name, domain: W.domain, open: () => setWsOpen(true) } : null;
    const body = /* @__PURE__ */ React.createElement(Shell, { nav, current, onNav: (id) => onGo({ name: id, params: {}, replace: true }), user: display, onUser: () => onGo({ name: "profile" }), ws: inside ? W : null, onWorkspace: () => setWsOpen(true), brand: me.role === "buyer" ? /* @__PURE__ */ React.createElement(EsBrand, null) : void 0, brandMark: me.role === "buyer" ? /* @__PURE__ */ React.createElement("span", { className: "es-logo", style: { width: 36, height: 36, borderRadius: 11 } }, /* @__PURE__ */ React.createElement(Icon, { name: "hourglass", size: 18, stroke: 2.2 })) : void 0 }, pushStep ? /* @__PURE__ */ React.createElement(S.Live.PushStep, { me, home: (nav.find((n) => n.id === HOME[me.role]) || nav[0]).label, ...pushStep }) : /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait", initial: false }, /* @__PURE__ */ React.createElement(motion.div, { key: safe + (ref || ""), ref: top, initial: reduce ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: reduce ? void 0 : { opacity: 0 }, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }, screenFor(me, safe, { realCamera }))));
    const openNote = (n) => {
      window.SC3_STORE.update((st) => {
        const x = st.notifications.find((y) => y.id === n.id);
        if (x) x.read = true;
      });
      if (n.link && allowed.includes(n.link)) onGo({ name: n.link });
    };
    return /* @__PURE__ */ React.createElement(S.Router, { route: { name: safe, params: route && route.params }, onGo: (r) => onGo(r), onBack }, /* @__PURE__ */ React.createElement(S.WorkspaceCtx.Provider, { value: ws }, /* @__PURE__ */ React.createElement(S.PushBanners, { key: me.id, me, onOpen: openNote }), me.role === "buyer" ? /* @__PURE__ */ React.createElement("div", { className: "esw" }, body) : body, inside && /* @__PURE__ */ React.createElement(S.WorkspaceSheet, { open: wsOpen, onClose: () => setWsOpen(false), me, onSettings: allowed.includes("workspace") ? () => {
      setWsOpen(false);
      onGo({ name: "workspace" });
    } : null })));
  }
  Object.assign(window.SC3_SCREENS, { NAV, HOME, routesFor, screenFor, RoleApp });
})();
