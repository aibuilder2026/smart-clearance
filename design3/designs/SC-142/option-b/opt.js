(function() {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, R = window.SCR;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, DataTable, BatchRow, GateChips, StatusBadge, Switch, useApp } = K;
  const { useStore, useRoute, Screen } = S;
  const fmt = M.fmt;
  const L = () => window.SC3_LEDGER, P = () => window.SC3_LEDGER.partners;
  const Orig = { Report: S.Report, DistBatches: S.DistBatches };
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
    const openPast = (c) => go("report", { ref: c.ref, tab: "timeline" });
    const chips = /* @__PURE__ */ React.createElement("div", { className: "rk-filters", role: "group", "aria-label": "Which batches" }, [["view", `In view · ${views.length}`], ["cleared", `Cleared · ${past.length}`]].map(([k, t]) => /* @__PURE__ */ React.createElement("button", { key: k, type: "button", className: "chip", "aria-pressed": view === k, onClick: () => setView(k) }, t)));
    const phone = app.bp === "phone";
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Batches", sub: "Every lot the Watcher sees, and every batch that has cleared" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 14 } }, chips, view === "view" ? phone ? /* @__PURE__ */ React.createElement("div", { className: "list" }, views.map((v) => /* @__PURE__ */ React.createElement(BatchRow, { key: v.id, view: v, compact: true, onOpen: () => openRow(v) }))) : /* @__PURE__ */ React.createElement(DataTable, { label: "Batches in view", rows: views.map((v) => ({ ...v, name: v.skuObj.name })), onRow: openRow, initialSort: ["daysLeft", "asc"], columns: [
      { key: "name", label: "Product", render: (v) => /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Product, { name: v.skuObj.img, size: 36 }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, v.skuObj.name), /* @__PURE__ */ React.createElement("span", { className: "mono subtle t-caption" }, v.id))) },
      { key: "dist", label: "Distributor", sortValue: (v) => v.dist.name, render: (v) => /* @__PURE__ */ React.createElement("span", null, v.dist.name, /* @__PURE__ */ React.createElement("div", { className: "t-caption subtle" }, v.dist.city)) },
      { key: "daysLeft", label: "Days left", num: true },
      { key: "units", label: "Units", num: true, render: (v) => fmt.num(v.units) },
      { key: "gates", label: "Quick-commerce gates", sortable: false, render: (v) => /* @__PURE__ */ React.createElement(GateChips, { gates: v.assess.gates, size: "sm" }) },
      { key: "status", label: "Status", sortValue: (v) => v.phase || v.assess.status, render: (v) => /* @__PURE__ */ React.createElement(StatusBadge, { status: v.phase || v.assess.status }) }
    ] }) : phone ? /* @__PURE__ */ React.createElement(List, null, past.map((c) => /* @__PURE__ */ React.createElement(ListRow, { key: c.ref, chevron: true, onClick: () => openPast(c), leading: /* @__PURE__ */ React.createElement(Product, { name: c.sku.img, size: 40 }), title: /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, c.sku.name), /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" })), sub: `${c.ref} · cleared ${R.day(c.cleared)} · ${fmt.inr(L().rowOf(c).figures.net)}` }))) : /* @__PURE__ */ React.createElement(DataTable, { label: "Cleared batches", rows: past.map((c) => ({ c, ref: c.ref, name: c.sku.name, dist: c.dist.name, flagged: c.flagged, cleared: c.cleared, net: L().rowOf(c).figures.net, outcome: c.outcome })), onRow: (r) => openPast(r.c), initialSort: ["cleared", "desc"], columns: [
      { key: "name", label: "Product", render: (r) => /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Product, { name: r.c.sku.img, size: 36 }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, r.name), /* @__PURE__ */ React.createElement("span", { className: "mono subtle t-caption" }, r.ref))) },
      { key: "dist", label: "Distributor", render: (r) => /* @__PURE__ */ React.createElement("span", null, r.dist, /* @__PURE__ */ React.createElement("div", { className: "t-caption subtle" }, r.c.dist.city)) },
      { key: "flagged", label: "Flagged", render: (r) => R.day(r.flagged) },
      { key: "cleared", label: "Cleared", render: (r) => R.day(r.cleared) },
      { key: "photos", label: "Photos", sortable: false, render: (r) => {
        const ph = R.photosOf(r.c);
        return /* @__PURE__ */ React.createElement("span", { className: "rk-thumbs" }, ph.map((p) => /* @__PURE__ */ React.createElement(R.Shot, { key: p.id, p, size: "s" })));
      } },
      { key: "net", label: "Recovered", num: true, render: (r) => fmt.inr(r.net) },
      { key: "outcome", label: "Outcome", render: (r) => /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: r.outcome, size: "sm" }) }
    ] })));
  }
  function Timeline({ c, who: only }) {
    const [audit, setAudit] = useState(true);
    const [open, setOpen] = useState(null);
    const photos = R.photosOf(c), ph = (id) => photos.find((p) => p.id === id);
    const trail = R.recordOf(c).filter((m) => !only || m.who.kind !== "agent" || only === "all");
    const days = [];
    trail.forEach((m) => {
      const d = m.at.slice(0, 10);
      let g = days.find((x) => x.d === d);
      if (!g) days.push(g = { d, items: [] });
      g.items.push(m);
    });
    const email = (w) => w.person && w.person.email || w.person && w.person.phone || w.name;
    const evidence = (m) => {
      if (m.k === "photo" && ph("label")) return /* @__PURE__ */ React.createElement("div", { className: "rk-inline" }, /* @__PURE__ */ React.createElement(R.Shot, { p: ph("label"), onOpen: () => setOpen(ph("label")) }));
      if (m.k === "read" && ph("label")) return /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { marginTop: 8 } }, ph("label").read.lines.map((t) => /* @__PURE__ */ React.createElement(R.Check, { key: t, ok: true }, t)));
      if (m.k === "destroySent" && ph("before")) return /* @__PURE__ */ React.createElement("div", { className: "rk-inline" }, ["before", "after"].map((id) => /* @__PURE__ */ React.createElement(R.Shot, { key: id, p: ph(id), onOpen: () => setOpen(ph(id)) })));
      if (m.k === "destroyChecked" && c.destruction) return /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { marginTop: 8 } }, c.destruction.checks.map((x) => /* @__PURE__ */ React.createElement(R.Check, { key: x.id, ok: x.ok }, x.label)));
      return null;
    };
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Timeline"), /* @__PURE__ */ React.createElement("span", { className: "row tight t-footnote", style: { gap: 10 } }, "Audit lines", /* @__PURE__ */ React.createElement(Switch, { checked: audit, onChange: setAudit, label: "Show the audit lines" }))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Every step of ", c.ref, ", by the agent or the person who took it, with the photos where they were sent."), /* @__PURE__ */ React.createElement("div", { className: "rk-trail" }, days.map((g) => /* @__PURE__ */ React.createElement(React.Fragment, { key: g.d }, /* @__PURE__ */ React.createElement("div", { className: "rk-day" }, R.longDay(g.d)), g.items.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: m.k, className: cx("rk-row", i === g.items.length - 1 && "end") }, /* @__PURE__ */ React.createElement(R.Actor, { who: m.who }), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "who" }, m.who.short || m.who.name, m.who.kind === "agent" ? " · agent" : m.who.org ? ` · ${m.who.org}` : ""), /* @__PURE__ */ React.createElement("b", null, m.text, m.yes && /* @__PURE__ */ React.createElement(React.Fragment, null, " ", /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber" }, "yes"))), evidence(m), audit && m.audit && /* @__PURE__ */ React.createElement("div", { className: "rk-audit" }, m.at.replace("T", " "), " · ", email(m.who), " · ", m.audit, " · ", c.ref)), /* @__PURE__ */ React.createElement("time", null, R.time(m.at))))))), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", icon: "download", style: { justifySelf: "start" } }, "Download the audit lines (CSV)"), /* @__PURE__ */ React.createElement(R.PhotoSheet, { p: open, onClose: () => setOpen(null) }));
  }
  const TABS = [{ id: "timeline", label: "Timeline", icon: "history" }, { id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }, { id: "impact", label: "Impact", icon: "leaf" }];
  function BatchPage({ me, at, tab: tab0 }) {
    const app = useApp();
    const phone = app.bp === "phone";
    const c = L().caseOf(at);
    const row = L().rowOf(c);
    const [tab, setTab] = useState(tab0 || "timeline");
    const head = /* @__PURE__ */ React.createElement("div", { className: "bhead" }, /* @__PURE__ */ React.createElement("div", { className: "bh-id" }, /* @__PURE__ */ React.createElement("span", { className: "bh-pic", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: c.sku.img, size: phone ? 46 : 72, alt: "" })), /* @__PURE__ */ React.createElement("div", { className: "bh-tt" }, /* @__PURE__ */ React.createElement("h1", null, c.sku.name), /* @__PURE__ */ React.createElement("div", { className: "bh-meta" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, c.batch.id), /* @__PURE__ */ React.createElement("span", { className: "sep", "aria-hidden": "true" }, "·"), /* @__PURE__ */ React.createElement("span", null, c.dist.name, ", ", c.dist.city)), /* @__PURE__ */ React.createElement("div", { className: "bh-meta" }, /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: row.outcome }), /* @__PURE__ */ React.createElement("span", null, "Flagged ", R.day(c.flagged), " · cleared ", R.day(row.cleared))))), /* @__PURE__ */ React.createElement(S.PtTabs, { tabs: TABS, value: tab, onChange: setTab, label: `${c.sku.name}, ${c.batch.id}` }));
    return /* @__PURE__ */ React.createElement(Screen, { me, title: c.sku.name, back: "Batches", hideLarge: true, below: head }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 900 } }, tab === "timeline" ? /* @__PURE__ */ React.createElement(Timeline, { c }) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, TABS.find((t) => t.id === tab).label, ", as it is today."))));
  }
  function Report(props) {
    const { route } = useRoute();
    const p = route && route.params || {};
    return p.ref && L().caseOf(p.ref) && L().caseOf(p.ref).history ? /* @__PURE__ */ React.createElement(BatchPage, { key: p.ref, me: props.me, at: p.ref, tab: p.tab }) : /* @__PURE__ */ React.createElement(Orig.Report, { ...props });
  }
  const DTABS = [{ id: "what", label: "What happened", icon: "history" }, { id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }];
  function DistBatch({ me, id }) {
    const s = useStore();
    const dist = S.distOf(me);
    const [tab, setTab] = useState("what");
    const [open, setOpen] = useState(null);
    const c = P().distBatches(dist.id, s).past.find((x) => x.ref === id);
    if (!c) return /* @__PURE__ */ React.createElement(Orig.DistBatches, { me });
    const photos = R.photosOf(c), ph = (k) => photos.find((p) => p.id === k);
    const items = P().moments(c);
    const head = /* @__PURE__ */ React.createElement(S.PtHead, { sku: c.sku, id, where: `${dist.godown}, ${dist.city}`, badge: /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" }), line: `Flagged ${R.day(c.flagged)} · cleared ${R.day(c.cleared)}` }, /* @__PURE__ */ React.createElement(S.PtTabs, { tabs: DTABS, value: tab, onChange: setTab, label: `${c.sku.name}, ${id}` }));
    const inline = (m) => m.k === "photo" && ph("label") ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "rk-inline" }, /* @__PURE__ */ React.createElement(R.Shot, { p: ph("label"), onOpen: () => setOpen(ph("label")) })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { marginTop: 8 } }, /* @__PURE__ */ React.createElement(R.Check, { ok: true }, "Vision read ", ph("label").read.lines.join(", ")))) : m.k === "destroySent" && ph("before") ? /* @__PURE__ */ React.createElement("div", { className: "rk-inline" }, ["before", "after"].map((k) => /* @__PURE__ */ React.createElement(R.Shot, { key: k, p: ph(k), onOpen: () => setOpen(ph(k)) }))) : m.k === "destroyApproved" && c.destruction ? /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { marginTop: 8 } }, c.destruction.checks.map((x) => /* @__PURE__ */ React.createElement(R.Check, { key: x.id, ok: x.ok }, x.label))) : null;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: c.sku.name, back: "Batches", hideLarge: true, below: head }, /* @__PURE__ */ React.createElement("div", { className: "pt-body" }, tab === "what" ? /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement("div", { className: "rk-trail" }, items.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: m.k + i, className: cx("rk-row", i === items.length - 1 && "end") }, /* @__PURE__ */ React.createElement("span", { className: "icontile", style: { width: 36, height: 36, borderRadius: 11 } }, /* @__PURE__ */ React.createElement(Icon, { name: m.icon, size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, m.title), m.sub && /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted", style: { display: "block", marginTop: 2 } }, m.sub), inline(m)), /* @__PURE__ */ React.createElement("time", null, R.when(m.at)))))) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "As it is today."))), /* @__PURE__ */ React.createElement(R.PhotoSheet, { p: open, onClose: () => setOpen(null) }));
  }
  function DistBatches(props) {
    const { route } = useRoute();
    const ref = route && route.params && route.params.ref;
    return ref ? /* @__PURE__ */ React.createElement(DistBatch, { me: props.me, id: ref }) : /* @__PURE__ */ React.createElement(Orig.DistBatches, { ...props });
  }
  Object.assign(S, { Batches, Report, DistBatches });
})();
