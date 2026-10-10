(function() {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, R = window.SCR;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, DataTable, BatchRow, GateChips, StatusBadge, Segmented, Empty, useApp } = K;
  const { useStore, useRoute, Screen } = S;
  const fmt = M.fmt;
  const L = () => window.SC3_LEDGER, P = () => window.SC3_LEDGER.partners;
  const Orig = { Report: S.Report, CameraScreen: S.CameraScreen };
  const nav = S.NAV.distributor.find((n) => n.id === "photo");
  if (nav) {
    nav.label = "Photos";
    nav.short = "Photos";
    nav.icon = "image";
  }
  function Batches({ me }) {
    const s = useStore();
    const app = useApp();
    const { go } = useRoute();
    const hm = S.heroModel(s);
    const live = S.useLive();
    const [view, setView] = useState("cleared");
    const views = D.BATCHES.map((b) => {
      const v = D.batchView(b);
      if (b.hero) v.phase = hm.view.phase;
      if (b.second) v.phase = "executing";
      return v;
    });
    const past = R.pastBatches();
    const openRow = (v) => go(S.partAt(S.journeyItems(s, live).find((i) => i.ref === v.id)), { ref: v.id });
    return /* @__PURE__ */ React.createElement(
      Screen,
      {
        me,
        title: "Batches",
        sub: "Every lot the Watcher sees, and the file of every batch that has cleared",
        actions: /* @__PURE__ */ React.createElement(Segmented, { label: "Which batches", value: view, onChange: setView, options: [{ id: "view", label: `In view · ${views.length}` }, { id: "cleared", label: `Cleared · ${past.length}` }] })
      },
      view === "view" ? app.bp === "phone" ? /* @__PURE__ */ React.createElement("div", { className: "list" }, views.map((v) => /* @__PURE__ */ React.createElement(BatchRow, { key: v.id, view: v, compact: true, onOpen: () => openRow(v) }))) : /* @__PURE__ */ React.createElement(DataTable, { label: "Batches in view", rows: views.map((v) => ({ ...v, name: v.skuObj.name })), onRow: openRow, initialSort: ["daysLeft", "asc"], columns: [
        { key: "name", label: "Product", render: (v) => /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Product, { name: v.skuObj.img, size: 36 }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, v.skuObj.name), /* @__PURE__ */ React.createElement("span", { className: "mono subtle t-caption" }, v.id))) },
        { key: "dist", label: "Distributor", sortValue: (v) => v.dist.name, render: (v) => /* @__PURE__ */ React.createElement("span", null, v.dist.name, /* @__PURE__ */ React.createElement("div", { className: "t-caption subtle" }, v.dist.city)) },
        { key: "daysLeft", label: "Days left", num: true },
        { key: "units", label: "Units", num: true, render: (v) => fmt.num(v.units) },
        { key: "gates", label: "Quick-commerce gates", sortable: false, render: (v) => /* @__PURE__ */ React.createElement(GateChips, { gates: v.assess.gates, size: "sm" }) },
        { key: "status", label: "Status", sortValue: (v) => v.phase || v.assess.status, render: (v) => /* @__PURE__ */ React.createElement(StatusBadge, { status: v.phase || v.assess.status }) }
      ] }) : /* @__PURE__ */ React.createElement("div", { className: "rk-grid" }, past.map((c) => {
        const ph = R.photosOf(c), cover = ph.find((p) => p.src), row = L().rowOf(c);
        return /* @__PURE__ */ React.createElement("button", { key: c.ref, type: "button", className: "rk-card", onClick: () => go("report", { ref: c.ref, tab: "audit" }), "aria-label": `${c.sku.name}, ${c.ref}: open its file` }, /* @__PURE__ */ React.createElement("span", { className: "rk-cover" }, cover ? /* @__PURE__ */ React.createElement("img", { className: "photo", src: cover.src, alt: "", loading: "lazy" }) : /* @__PURE__ */ React.createElement(Product, { name: c.sku.img, size: 96, alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "cam-tag" }, /* @__PURE__ */ React.createElement(Icon, { name: "camera", size: 13 }), ph.length, " ", ph.length === 1 ? "photo" : "photos")), /* @__PURE__ */ React.createElement("span", { className: "rk-body" }, /* @__PURE__ */ React.createElement("span", { className: "row between", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, c.sku.name), /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" })), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, c.ref, " · ", c.dist.name), /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, "Cleared ", R.day(c.cleared), " · ", /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr(row.figures.net)), " recovered")));
      }))
    );
  }
  function Evidence({ c }) {
    const [open, setOpen] = useState(null);
    const photos = R.photosOf(c), yes = R.approvalsOf(c);
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "rk-strip" }, photos.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, className: "rk-photo" }, /* @__PURE__ */ React.createElement(R.Shot, { p, onOpen: () => setOpen(p) }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, /* @__PURE__ */ React.createElement("b", null, p.title), " · ", R.when(p.at)))), yes.map((a) => /* @__PURE__ */ React.createElement("div", { key: a.k, className: "rk-photo" }, /* @__PURE__ */ React.createElement("div", { className: "rk-yes" }, /* @__PURE__ */ React.createElement(R.Actor, { who: a.who, size: 32 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, a.title), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, a.sub))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, /* @__PURE__ */ React.createElement("b", null, a.who.short, "'s yes"), " · ", R.when(a.at))))), /* @__PURE__ */ React.createElement(R.PhotoSheet, { p: open, onClose: () => setOpen(null) }));
  }
  function AuditLog({ c }) {
    const [who, setWho] = useState("all");
    const trail = R.recordOf(c);
    const rows = trail.filter((m) => who === "all" || (who === "people" ? m.who.kind !== "agent" : m.who.kind === "agent"));
    const role = (m) => m.who.kind === "agent" ? "agent" : m.who.kind === "people" ? "kiranas" : m.who.org === D.CLIENT.name ? `${D.CLIENT.short} · supply chain` : m.who.org;
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Audit log"), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "download" }, "Export CSV")), /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "rk-filters" }, [["all", `Everyone · ${trail.length}`], ["people", "People"], ["agents", "Agents"]].map(([k, t]) => /* @__PURE__ */ React.createElement("button", { key: k, type: "button", className: "chip", "aria-pressed": who === k, onClick: () => setWho(k) }, t))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Times in IST · the audit log keeps each person's line in their name")), /* @__PURE__ */ React.createElement("div", { style: { overflowX: "auto" } }, /* @__PURE__ */ React.createElement("table", { className: "rk-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "When"), /* @__PURE__ */ React.createElement("th", null, "Who"), /* @__PURE__ */ React.createElement("th", null, "As"), /* @__PURE__ */ React.createElement("th", null, "What"))), /* @__PURE__ */ React.createElement("tbody", null, rows.map((m) => /* @__PURE__ */ React.createElement("tr", { key: m.k }, /* @__PURE__ */ React.createElement("td", { className: "t" }, R.when(m.at)), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(R.Actor, { who: m.who, size: 24 }), /* @__PURE__ */ React.createElement("b", null, m.who.short || m.who.name))), /* @__PURE__ */ React.createElement("td", { className: "subtle" }, role(m)), /* @__PURE__ */ React.createElement("td", null, m.text, m.yes && /* @__PURE__ */ React.createElement(React.Fragment, null, " ", /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber" }, "yes")))))))));
  }
  const TABS = [{ id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }, { id: "impact", label: "Impact", icon: "leaf" }, { id: "audit", label: "Audit log", icon: "scroll-text" }];
  function BatchPage({ me, at, tab: tab0 }) {
    const app = useApp();
    const phone = app.bp === "phone";
    const c = L().caseOf(at);
    const row = L().rowOf(c);
    const [tab, setTab] = useState(tab0 || "audit");
    const head = /* @__PURE__ */ React.createElement("div", { className: "bhead" }, /* @__PURE__ */ React.createElement("div", { className: "bh-id" }, /* @__PURE__ */ React.createElement("span", { className: "bh-pic", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: c.sku.img, size: phone ? 46 : 72, alt: "" })), /* @__PURE__ */ React.createElement("div", { className: "bh-tt" }, /* @__PURE__ */ React.createElement("h1", null, c.sku.name), /* @__PURE__ */ React.createElement("div", { className: "bh-meta" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, c.batch.id), /* @__PURE__ */ React.createElement("span", { className: "sep", "aria-hidden": "true" }, "·"), /* @__PURE__ */ React.createElement("span", null, c.dist.name, ", ", c.dist.city)), /* @__PURE__ */ React.createElement("div", { className: "bh-meta" }, /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: row.outcome }), /* @__PURE__ */ React.createElement("span", null, "Flagged ", R.day(c.flagged), " · cleared ", R.day(row.cleared))))));
    return /* @__PURE__ */ React.createElement(Screen, { me, title: c.sku.name, back: "Batches", hideLarge: true, below: head }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Evidence, { c }), /* @__PURE__ */ React.createElement(S.PtTabs, { tabs: TABS, value: tab, onChange: setTab, label: `${c.sku.name}, ${c.batch.id}` }), tab === "audit" ? /* @__PURE__ */ React.createElement(AuditLog, { c }) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, TABS.find((t) => t.id === tab).label, ", as it is today."))));
  }
  function Report(props) {
    const { route } = useRoute();
    const p = route && route.params || {};
    return p.ref && L().caseOf(p.ref) && L().caseOf(p.ref).history ? /* @__PURE__ */ React.createElement(BatchPage, { key: p.ref, me: props.me, at: p.ref, tab: p.tab }) : /* @__PURE__ */ React.createElement(Orig.Report, { ...props });
  }
  function Photos({ me }) {
    const s = useStore();
    const dist = S.distOf(me);
    const { go } = useRoute();
    const [open, setOpen] = useState(null);
    if (s.hero.photo === "requested") return /* @__PURE__ */ React.createElement(Orig.CameraScreen, { me });
    const past = P().distBatches(dist.id, s).past.map((c) => L().caseOf(c.ref)).filter((c) => c && R.photosOf(c).length);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Photos", sub: `Every photo you sent ${D.CLIENT.short}, batch by batch, and what was made of it` }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18, maxWidth: 1080 } }, /* @__PURE__ */ React.createElement(Card, { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "icontile soft", style: { width: 40, height: 40, borderRadius: 12 } }, /* @__PURE__ */ React.createElement(Icon, { name: "camera", size: 19 })), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "No photo asked for now"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, "When Vision needs a carton label, or a destruction needs its evidence, the request opens here."))), past.map((c) => {
      const ph = R.photosOf(c);
      return /* @__PURE__ */ React.createElement(Card, { key: c.ref, className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "row tight pt-link", style: { gap: 10 }, onClick: () => go("batches", { ref: c.ref }) }, /* @__PURE__ */ React.createElement(Product, { name: c.sku.img, size: 36 }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0, textAlign: "left" } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, c.sku.name), /* @__PURE__ */ React.createElement("span", { className: "mono t-caption subtle" }, c.ref))), /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "cleared ", R.day(c.cleared)))), /* @__PURE__ */ React.createElement("div", { className: cx("rk-photos", ph.length === 2 && "two") }, ph.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, className: "rk-photo" }, /* @__PURE__ */ React.createElement(R.Shot, { p, onOpen: () => setOpen(p) }), /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, p.title), /* @__PURE__ */ React.createElement(R.PhotoFacts, { p })))));
    })), /* @__PURE__ */ React.createElement(R.PhotoSheet, { p: open, onClose: () => setOpen(null) }));
  }
  Object.assign(S, { Batches, Report, CameraScreen: Photos });
})();
