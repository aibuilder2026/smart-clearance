(function() {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, R = window.SCR;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, DataTable, BatchRow, GateChips, StatusBadge, Chip, useApp } = K;
  const { useStore, useRoute, Screen } = S;
  const fmt = M.fmt;
  const L = () => window.SC3_LEDGER, P = () => window.SC3_LEDGER.partners;
  const Orig = { Batches: S.Batches, Report: S.Report, DistBatches: S.DistBatches };
  function Batches({ me }) {
    const s = useStore();
    const app = useApp();
    const { go } = useRoute();
    const hm = S.heroModel(s);
    const live = S.useLive();
    const views = D.BATCHES.map((b) => {
      const v = D.batchView(b);
      if (b.hero) v.phase = hm.view.phase;
      if (b.second) v.phase = "executing";
      return v;
    });
    const openRow = (v) => go(S.partAt(S.journeyItems(s, live).find((i) => i.ref === v.id)), { ref: v.id });
    const months = R.monthsOf(R.pastBatches());
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Batches", sub: "Every lot the Watcher sees, and every batch that has cleared" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement("div", { className: "list-head" }, "In view · from the DMS export"), app.bp === "phone" ? /* @__PURE__ */ React.createElement("div", { className: "list" }, views.map((v) => /* @__PURE__ */ React.createElement(BatchRow, { key: v.id, view: v, compact: true, onOpen: () => openRow(v) }))) : /* @__PURE__ */ React.createElement(DataTable, { label: "Batches in view", rows: views.map((v) => ({ ...v, name: v.skuObj.name })), onRow: openRow, initialSort: ["daysLeft", "asc"], columns: [
      { key: "name", label: "Product", render: (v) => /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Product, { name: v.skuObj.img, size: 36 }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, v.skuObj.name), /* @__PURE__ */ React.createElement("span", { className: "mono subtle t-caption" }, v.id))) },
      { key: "dist", label: "Distributor", sortValue: (v) => v.dist.name, render: (v) => /* @__PURE__ */ React.createElement("span", null, v.dist.name, /* @__PURE__ */ React.createElement("div", { className: "t-caption subtle" }, v.dist.city)) },
      { key: "daysLeft", label: "Days left", num: true },
      { key: "units", label: "Units", num: true, render: (v) => fmt.num(v.units) },
      { key: "gates", label: "Quick-commerce gates", sortable: false, render: (v) => /* @__PURE__ */ React.createElement(GateChips, { gates: v.assess.gates, size: "sm" }) },
      { key: "status", label: "Status", sortValue: (v) => v.phase || v.assess.status, render: (v) => /* @__PURE__ */ React.createElement(StatusBadge, { status: v.phase || v.assess.status }) }
    ] })), months.map((g) => /* @__PURE__ */ React.createElement(List, { key: g.m, head: `Cleared · ${g.label}` }, g.items.map((c) => {
      const ph = R.photosOf(c);
      const row = L().rowOf(c);
      return /* @__PURE__ */ React.createElement(
        ListRow,
        {
          key: c.ref,
          chevron: true,
          onClick: () => go("report", { ref: c.ref, tab: "record" }),
          leading: /* @__PURE__ */ React.createElement(Product, { name: c.sku.img, size: 40 }),
          title: /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, c.sku.name), /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" })),
          sub: `${c.ref} · ${c.dist.name} · flagged ${R.day(c.flagged)} · cleared ${R.day(c.cleared)}`,
          value: app.bp === "phone" ? null : /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("span", { className: "rk-count" }, /* @__PURE__ */ React.createElement(Icon, { name: "camera", size: 15 }), ph.length, " ", ph.length === 1 ? "photo" : "photos"), /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr(row.figures.net)))
        }
      );
    })))));
  }
  const TABS = [{ id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }, { id: "impact", label: "Impact", icon: "leaf" }, { id: "record", label: "Record", icon: "history" }];
  function Record({ c }) {
    const app = useApp();
    const phone = app.bp === "phone";
    const [open, setOpen] = useState(null);
    const [who, setWho] = useState("all");
    const photos = R.photosOf(c), yeses = R.approvalsOf(c), trail = R.recordOf(c);
    const rows = trail.filter((m) => who === "all" || (who === "people" ? m.who.kind !== "agent" : m.who.kind === "agent"));
    const days = [];
    rows.forEach((m) => {
      const d = m.at.slice(0, 10);
      let g = days.find((x) => x.d === d);
      if (!g) days.push(g = { d, items: [] });
      g.items.push(m);
    });
    const people = trail.filter((m) => m.who.kind === "person").length;
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Photos sent for this batch"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, photos.length, " · tap to open")), /* @__PURE__ */ React.createElement("div", { className: cx("rk-photos", photos.length === 2 && "two") }, photos.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, className: "rk-photo" }, /* @__PURE__ */ React.createElement(R.Shot, { p, onOpen: () => setOpen(p) }), /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, p.title), /* @__PURE__ */ React.createElement(R.PhotoFacts, { p }))))), /* @__PURE__ */ React.createElement("div", { className: "rk-cols" }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Audit trail"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, trail.length, " steps · ", people, " by people")), /* @__PURE__ */ React.createElement("div", { className: "rk-filters" }, [["all", "Everyone"], ["people", "People"], ["agents", "Agents"]].map(([k, t]) => /* @__PURE__ */ React.createElement("button", { key: k, type: "button", className: "chip", "aria-pressed": who === k, onClick: () => setWho(k) }, t))), /* @__PURE__ */ React.createElement("div", { className: "rk-trail" }, days.map((g) => /* @__PURE__ */ React.createElement(React.Fragment, { key: g.d }, /* @__PURE__ */ React.createElement("div", { className: "rk-day" }, R.longDay(g.d)), g.items.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: m.k, className: cx("rk-row", m.yes && "yes", i === g.items.length - 1 && "end") }, /* @__PURE__ */ React.createElement(R.Actor, { who: m.who }), /* @__PURE__ */ React.createElement("div", { style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "who" }, m.who.short || m.who.name, m.who.kind === "agent" ? " · agent" : m.who.org ? ` · ${m.who.org}` : ""), /* @__PURE__ */ React.createElement("b", null, m.text, m.yes && /* @__PURE__ */ React.createElement(React.Fragment, null, " ", /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber" }, "yes")))), /* @__PURE__ */ React.createElement("time", null, R.time(m.at))))))), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", icon: "download", style: { justifySelf: "start" } }, "Download the audit trail (CSV)")), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "The yeses"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "What only a person at ", D.CLIENT.short, " could let happen, in their name."), yeses.map((a) => /* @__PURE__ */ React.createElement(R.Yes, { key: a.k, a }))), !phone && /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Papers"), c.docs.filter((d) => d.status !== "not required").map((d) => /* @__PURE__ */ React.createElement(ListRow, { key: d.id, title: d.type, sub: d.no && !/^s\./.test(d.no) ? d.no : null, value: /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 16 }) }))))), /* @__PURE__ */ React.createElement(R.PhotoSheet, { p: open, onClose: () => setOpen(null) }));
  }
  function BatchPage({ me, at, tab: tab0 }) {
    const app = useApp();
    const phone = app.bp === "phone";
    const c = L().caseOf(at);
    const row = L().rowOf(c);
    const [tab, setTab] = useState(tab0 || "record");
    const head = /* @__PURE__ */ React.createElement("div", { className: "bhead" }, /* @__PURE__ */ React.createElement("div", { className: "bh-id" }, /* @__PURE__ */ React.createElement("span", { className: "bh-pic", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: c.sku.img, size: phone ? 46 : 72, alt: "" })), /* @__PURE__ */ React.createElement("div", { className: "bh-tt" }, /* @__PURE__ */ React.createElement("h1", null, c.sku.name), /* @__PURE__ */ React.createElement("div", { className: "bh-meta" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, c.batch.id), /* @__PURE__ */ React.createElement("span", { className: "sep", "aria-hidden": "true" }, "·"), /* @__PURE__ */ React.createElement("span", null, c.dist.name, ", ", c.dist.city)), /* @__PURE__ */ React.createElement("div", { className: "bh-meta" }, /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: row.outcome }), /* @__PURE__ */ React.createElement("span", null, "Flagged ", R.day(c.flagged), " · cleared ", R.day(row.cleared))))), /* @__PURE__ */ React.createElement(S.PtTabs, { tabs: TABS, value: tab, onChange: setTab, label: `${c.sku.name}, ${c.batch.id}` }));
    return /* @__PURE__ */ React.createElement(Screen, { me, title: c.sku.name, back: "Batches", hideLarge: true, below: head }, tab === "record" ? /* @__PURE__ */ React.createElement(Record, { c }) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, TABS.find((t) => t.id === tab).label, ", as it is today.")));
  }
  function Report(props) {
    const { route } = useRoute();
    const p = route && route.params || {};
    return p.ref && L().caseOf(p.ref) && L().caseOf(p.ref).history ? /* @__PURE__ */ React.createElement(BatchPage, { key: p.ref, me: props.me, at: p.ref, tab: p.tab }) : /* @__PURE__ */ React.createElement(Orig.Report, { ...props });
  }
  const DTABS = [{ id: "what", label: "What happened", icon: "history" }, { id: "money", label: "Money", icon: "coins" }, { id: "papers", label: "Papers", icon: "file-text" }, { id: "photos", label: "Photos", icon: "camera" }];
  function DistBatch({ me, id }) {
    const s = useStore();
    const dist = S.distOf(me);
    const [tab, setTab] = useState("photos");
    const [open, setOpen] = useState(null);
    const c = P().distBatches(dist.id, s).past.find((x) => x.ref === id);
    if (!c) return /* @__PURE__ */ React.createElement(Orig.DistBatches, { me });
    const photos = R.photosOf(c), yes = R.approvalsOf(c).find((a) => a.k === "destroyApproved");
    const head = /* @__PURE__ */ React.createElement(S.PtHead, { sku: c.sku, id, where: `${dist.godown}, ${dist.city}`, badge: /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" }), line: `Flagged ${R.day(c.flagged)} · cleared ${R.day(c.cleared)}` }, /* @__PURE__ */ React.createElement(S.PtTabs, { tabs: DTABS, value: tab, onChange: setTab, label: `${c.sku.name}, ${id}` }));
    return /* @__PURE__ */ React.createElement(Screen, { me, title: c.sku.name, back: "Batches", hideLarge: true, below: head }, /* @__PURE__ */ React.createElement("div", { className: "pt-body stack", style: { gap: 16 } }, tab === "photos" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Your photos for this batch"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, photos.length)), /* @__PURE__ */ React.createElement("div", { className: cx("rk-photos", photos.length === 2 && "two") }, photos.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, className: "rk-photo" }, /* @__PURE__ */ React.createElement(R.Shot, { p, onOpen: () => setOpen(p) }), /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, p.title), /* @__PURE__ */ React.createElement(R.PhotoFacts, { p }))))), yes && /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Approved"), /* @__PURE__ */ React.createElement(R.Yes, { a: yes }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, D.CLIENT.short, " credited you on ", (c.docs.find((d) => d.id === "expiry") || {}).no, " once it approved."))) : tab === "what" ? /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(S.PtMoments, { items: P().moments(c) })) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "As it is today."))), /* @__PURE__ */ React.createElement(R.PhotoSheet, { p: open, onClose: () => setOpen(null) }));
  }
  function DistBatches(props) {
    const { route } = useRoute();
    const ref = route && route.params && route.params.ref;
    return ref ? /* @__PURE__ */ React.createElement(DistBatch, { me: props.me, id: ref }) : /* @__PURE__ */ React.createElement(Orig.DistBatches, { ...props });
  }
  Object.assign(S, { Batches, Report, DistBatches });
})();
