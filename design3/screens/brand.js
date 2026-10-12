(function() {
  const { useState, useEffect, useMemo, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Segmented, Switch, Stepper, Tabs, Sheet, DataTable, Product, Empty, Progress, Money, Roll, DaysNum, GateChips, Tile, Aura, Tracker, VTracker, AgentFeed, ClusterMap, HaulLine, ChannelBars, MixBar, CodeBlock, TrackerCard, TrackerCompact, BatchRow, ChannelTable, SplitBar, MoneyPanel, StatusBadge, useApp, useNotice } = K;
  const { useStore, useRoute, heroModel, Screen, Columns, SectionTitle, Locked } = S;
  const CH_NAMES = D.SETUP.channelNames;
  const Pass = ({ children }) => children;
  const possessive = (n) => /s$/.test(n) ? `${n}'` : `${n}'s`;
  const storyOf = (s) => D.story(s || Store.get());
  const personOf = (C, id) => C.people[id] || Store.get().users.find((u) => u.id === id) || { id, name: id, short: id };
  const evAt = (C, key) => (C.events.find((e) => e.key === key) || {}).at || "";
  const noun = (sku) => sku.id === "chips" ? "chips" : sku.name.replace(/\s+\d+(\.\d+)?\s?(g|ml|kg|l)$/i, "");
  const AGENTS = ["no agents", "one agent", "two agents", "three agents", "four agents"];
  const godownOf = (C) => C.dist.godown.split(" ")[0];
  const FLOOR_ROWS = [["snacks", "Snacks", "chips"], ["biscuits", "Biscuits", "biscuits"], ["staples", "Staples", "poha"], ["beverages", "Beverages", "mango"], ["personal-care", "Personal care", "facewash"]];
  function permissionOf(s, id) {
    if (id === storyOf(s).dist.id) {
      const p = s.setup.permission;
      return p ? p.paused ? { tone: "amber", label: "paused" } : { tone: "green", label: "granted · " + p.at } : { tone: void 0, label: "requested" };
    }
    return D.SETUP.permissions[id] ? { tone: "green", label: "granted · " + D.SETUP.permissions[id] } : { tone: void 0, label: "requested" };
  }
  function ExportCard({ phase, done, live, exp, onChoose, fileRef, pick, nextRun }) {
    const mapped = phase === "mapped", reading = phase === "mapping", waiting = phase === "waiting";
    const n = D.SETUP.dms.columns.length;
    const title = mapped ? D.SETUP.dms.file : reading ? exp.name : "No stock export mapped yet";
    const sub = mapped ? `Bizom-style DMS export · ${D.SETUP.dms.rows} batches · ${Object.keys(D.DISTRIBUTORS).length} distributors` : reading ? "The Data agent is reading its columns" : `The Data agent maps your distributors' first export, then loads ${D.SETUP.dms.salesDays} days of sell-through`;
    const status = done ? /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "Loaded into BigQuery") : mapped ? /* @__PURE__ */ React.createElement(Badge, { dot: true }, "Mapped · confirm below") : reading ? /* @__PURE__ */ React.createElement(Badge, { tone: "blue", dot: true }, "Mapping") : /* @__PURE__ */ React.createElement(Badge, { dot: true }, "Waiting for an export");
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: cx("icontile", !mapped && "soft") }, /* @__PURE__ */ React.createElement(Icon, { name: "file-spreadsheet", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { style: { overflowWrap: "anywhere" } }, title), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, sub))), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, live && !reading && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: waiting ? "primary" : void 0, icon: "upload", onClick: onChoose }, "Upload an export"), /* @__PURE__ */ React.createElement("input", { ref: fileRef, type: "file", accept: ".csv,text/csv", className: "sr-only", tabIndex: -1, "aria-hidden": "true", onChange: pick })), status)), /* @__PURE__ */ React.createElement("div", { className: "table-wrap", style: { boxShadow: "none" }, tabIndex: 0, role: "region", "aria-label": "Field mapping" }, /* @__PURE__ */ React.createElement("table", { className: "table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Smart-Clearance field"), /* @__PURE__ */ React.createElement("th", null, "Column in your file"), /* @__PURE__ */ React.createElement("th", null, "Status"))), /* @__PURE__ */ React.createElement("tbody", null, D.SETUP.dms.columns.map(([f, c]) => /* @__PURE__ */ React.createElement("tr", { key: f }, /* @__PURE__ */ React.createElement("td", { className: "strong" }, f.replace("_", " ")), /* @__PURE__ */ React.createElement("td", { className: mapped ? "mono" : "subtle" }, mapped ? c : reading ? "reading…" : "not mapped yet"), /* @__PURE__ */ React.createElement("td", null, mapped ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", icon: "check" }, "mapped") : reading ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "blue", dot: true }, "mapping") : /* @__PURE__ */ React.createElement(Badge, { size: "sm", dot: true }, "waiting"))))))), /* @__PURE__ */ React.createElement("div", { className: "row tight t-footnote muted" }, /* @__PURE__ */ React.createElement(Aura, { on: !done && !waiting, className: "icontile soft", style: { width: 26, height: 26, borderRadius: 8 } }, /* @__PURE__ */ React.createElement(Icon, { name: "database", size: 14 })), mapped ? `Data Agent mapped ${n} of ${n} columns and back-filled ${D.SETUP.dms.salesDays} days of sell-through by pincode and by shop.` : reading ? "Data Agent is matching the file's columns to these fields." : /* @__PURE__ */ React.createElement("span", null, "Upload an export now, or the Data Agent maps the day's export at its run at ", /* @__PURE__ */ React.createElement("b", { className: "tnum" }, nextRun), ".")));
  }
  function Setup({ me, onConfirm }) {
    const s = useStore();
    const { go } = useRoute();
    const app = useApp();
    const { toast } = useNotice();
    const [floors, setFloors] = useState(s.rules.floors);
    const [taps, setTaps] = useState(s.rules.approvalTaps);
    const [busy, setBusy] = useState(false);
    const [ret, setRet] = useState(s.rules.returnWindowDays);
    const [uplift, setUplift] = useState(s.rules.kiranaUplift);
    const [van, setVan] = useState(s.rules.vanPerUnit);
    const done = s.setup.confirmed;
    const confirm = () => {
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        Flow.act("connect");
        toast({ text: "Setup confirmed · the Watcher starts at 09:00", tone: "ok" });
        onConfirm && onConfirm();
      }, 900);
    };
    const chans = D.SETUP.channels;
    const wo = D.PLAN.writeOff;
    const chips = D.SKUS.chips;
    const live = S.useLive();
    const [exp, setExp] = useState({ name: D.SETUP.dms.file, size: 48e5 });
    const fileRef = React.useRef(null);
    const [reading, setReading] = useState(false);
    const pick = (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      setExp({ name: f.name, size: f.size });
      live.uploadExport(() => {
        setReading(true);
        toast({ text: "Export uploaded · the Data agent is mapping its columns", tone: "ok" });
        setTimeout(() => {
          Store.update((st) => {
            st.setup.mapped = D.SETUP.dms.columns.length;
          });
          setReading(false);
          toast({ text: `The Data agent mapped ${D.SETUP.dms.columns.length} of ${D.SETUP.dms.columns.length} columns`, tone: "ok", icon: "database" });
        }, 1800);
      });
    };
    const uploading = live && live.uploads.dms != null;
    const mapped = done || !live || s.setup.mapped > 0;
    const phase = mapped ? "mapped" : uploading ? "uploading" : reading ? "mapping" : "waiting";
    const choose = () => fileRef.current && fileRef.current.click();
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Setup", sub: "Connect the stock data once and set the rules the agents must obey" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, uploading && /* @__PURE__ */ React.createElement(S.Live.ExportUpload, { name: exp.name, size: exp.size, p: live.uploads.dms, onCancel: () => live.cancelUpload("dms") }), phase !== "uploading" && /* @__PURE__ */ React.createElement(ExportCard, { phase, done, live: !!live, exp, onChoose: choose, fileRef, pick, nextRun: `${s.rules.dataTime} ${live && live.clock.time < s.rules.dataTime ? "today" : "tomorrow"}` }), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 20, gridTemplateColumns: app.bp === "desktop" ? "repeat(2, minmax(0,1fr))" : "minmax(0,1fr)", alignItems: "start" } }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement(List, { head: "Floor price by category", foot: "No channel may sell below its category's floor." }, FLOOR_ROWS.map(([k, l, sku]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, title: l, sub: `${fmt.inr2(D.SKUS[sku].mrp * floors[k] / 100)} on a ₹${D.SKUS[sku].mrp} pack`, value: /* @__PURE__ */ React.createElement(Stepper, { value: floors[k], onChange: (v) => setFloors({ ...floors, [k]: v }), min: 20, max: 70, step: 5, label: "Floor for " + l, format: (v) => v + "%" }) }))), /* @__PURE__ */ React.createElement(List, { head: "Territory guard", foot: "ExpireSoon listings are hidden from buyers inside these territories, matched by pincode, so clearance stock never undercuts a Munchly distributor." }, Object.values(D.DISTRIBUTORS).map((d) => /* @__PURE__ */ React.createElement(ListRow, { key: d.id, icon: "map-pin", iconTone: "gray", title: d.territory, sub: `${d.name} · pincodes ${d.pins}…` })), /* @__PURE__ */ React.createElement(ListRow, { title: "Hide listings inside the territories", value: /* @__PURE__ */ React.createElement(Switch, { checked: s.rules.territoryGuard, onChange: () => {
    }, label: "Territory guard" }) })), /* @__PURE__ */ React.createElement(List, { head: "Approval policy", foot: "After that the agents run inside the guardrails and report." }, /* @__PURE__ */ React.createElement(ListRow, { icon: "shield-check", iconTone: "blue", title: "Routes per channel that need a tap", value: /* @__PURE__ */ React.createElement(Stepper, { value: taps, onChange: setTaps, min: 1, max: 50, label: "routes" }) }), /* @__PURE__ */ React.createElement(ListRow, { icon: "ban", iconTone: "red", title: "Personal care never goes to food banks", value: /* @__PURE__ */ React.createElement(Switch, { checked: true, onChange: () => {
    }, label: "Personal care never to food banks" }) }), /* @__PURE__ */ React.createElement(ListRow, { icon: "gift", iconTone: "amber", title: "Premium gift packs never go to a staff sale", value: /* @__PURE__ */ React.createElement(Switch, { checked: true, onChange: () => {
    }, label: "Gift packs never to staff sale" }) }))), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Channel allow-list"), /* @__PURE__ */ React.createElement("div", { className: "table-wrap", style: { boxShadow: "none" }, tabIndex: 0, role: "region", "aria-label": "Channel rules by category" }, /* @__PURE__ */ React.createElement("table", { className: "table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Category"), chans.map((c) => /* @__PURE__ */ React.createElement("th", { key: c, style: { textAlign: "center" } }, CH_NAMES[c])))), /* @__PURE__ */ React.createElement("tbody", null, D.SETUP.allowList.map(([cat, ok]) => /* @__PURE__ */ React.createElement("tr", { key: cat }, /* @__PURE__ */ React.createElement("td", { className: "strong", style: { textTransform: "capitalize" } }, cat.replace("-", " ")), chans.map((c) => /* @__PURE__ */ React.createElement("td", { key: c, style: { textAlign: "center" } }, ok.includes(c) ? /* @__PURE__ */ React.createElement(Icon, { name: "circle-check", size: 18, title: "Allowed", style: { color: "var(--primary-text)", margin: "0 auto" } }) : /* @__PURE__ */ React.createElement(Icon, { name: "circle-x", size: 18, title: "Never", style: { color: "var(--fg-3)", margin: "0 auto" } })))))))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Discount D2C applies only to Munchly's own warehouse stock. A distributor's stock is his, so it never goes to Munchly's own site.")), /* @__PURE__ */ React.createElement(List, { head: "Distributors' one-time permission", foot: "Each distributor lets the agent list his Munchly stock, offer schemes to his kiranas, draft his invoices and book dispatch slots, inside Munchly's floors. He can pause it at any time." }, Object.values(D.DISTRIBUTORS).map((d) => {
      const p = permissionOf(s, d.id);
      return /* @__PURE__ */ React.createElement(ListRow, { key: d.id, icon: "handshake", iconTone: p.tone === "green" ? void 0 : "gray", title: d.name, sub: d.city, value: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: p.tone, dot: !p.tone }, p.label) });
    })), !s.setup.permission && /* @__PURE__ */ React.createElement(S.PlayAs, { who: "rakesh", route: "home" }, "Give the permission as Rakesh bhai"), /* @__PURE__ */ React.createElement(List, { head: "Scheme returns and planning", foot: "The uplift and the van rate are planning assumptions. The return window lets returned packs reach the godown in time for a staff sale or a food bank." }, /* @__PURE__ */ React.createElement(ListRow, { title: "Kiranas may return scheme packs until", sub: `${fmt.day(D.addDays(storyOf(s).batch.bestBefore, -ret))} for this batch`, value: /* @__PURE__ */ React.createElement(Stepper, { value: ret, onChange: setRet, min: 15, max: 30, label: "days before best-before", format: (v) => v + " days before" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Scheme uplift on normal sales", value: /* @__PURE__ */ React.createElement(Stepper, { value: uplift, onChange: (v) => setUplift(Math.round(v * 10) / 10), min: 2, max: 5, step: 0.5, label: "Scheme uplift", format: (v) => v.toFixed(1) + "×" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Van rate, a unit", value: /* @__PURE__ */ React.createElement(Stepper, { value: van, onChange: (v) => setVan(Math.round(v * 100) / 100), min: 0.25, max: 2, step: 0.25, label: "Van rate", format: (v) => "₹" + v.toFixed(2) }) })), /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, D.SETUP.partners.map((p) => /* @__PURE__ */ React.createElement(Card, { key: p.name, className: "stack tight" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "icontile red" }, /* @__PURE__ */ React.createElement(Icon, { name: "heart-handshake", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("b", null, p.name)), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "partner")), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, p.minDays, "+ days left · at least ", p.minUnits, " units · ", p.logistics), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, p.paper)))))), /* @__PURE__ */ React.createElement(Card, { className: "stack snug", style: { background: "var(--surface)" } }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "The true cost of a write-off"), /* @__PURE__ */ React.createElement(Badge, { tone: "red", icon: "trash-2" }, "shown before any batch is routed")), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10, alignItems: "stretch" } }, [["Stock at cost", chips.cost], ["GST credit reversed", wo.itcPerUnit], ["Disposal", M.RULES.disposalPerUnit], ["EPR, indicative", chips.kgPerUnit * M.RULES.eprPerKg]].map(([k, v], i) => /* @__PURE__ */ React.createElement(Fragment, { key: k }, i > 0 && /* @__PURE__ */ React.createElement("span", { className: "center subtle", style: { fontSize: 20 }, "aria-hidden": "true" }, "+"), /* @__PURE__ */ React.createElement("div", { className: "tile", style: { minWidth: 130, flex: "1 1 130px" } }, /* @__PURE__ */ React.createElement("span", { className: "tl-label" }, k), /* @__PURE__ */ React.createElement("span", { className: "num s neg" }, fmt.inr2(v))))), /* @__PURE__ */ React.createElement("span", { className: "center subtle", style: { fontSize: 20 }, "aria-hidden": "true" }, "="), /* @__PURE__ */ React.createElement("div", { className: "tile", style: { minWidth: 150, flex: "1 1 150px", boxShadow: "0 0 0 1.5px color-mix(in oklab, var(--red) 45%, transparent)" } }, /* @__PURE__ */ React.createElement("span", { className: "tl-label" }, "Destroying, a unit"), /* @__PURE__ */ React.createElement(Money, { value: -wo.perUnit, size: "s", decimals: true, style: { color: "var(--red-text)" } }))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "For Masala Chips 150 g: cost ₹", chips.cost, "; ", fmt.inr2(wo.itcPerUnit), " of input GST a packet from the cost sheet (chips are at ", Math.round(chips.gst * 100), "% GST since GST 2.0); disposal ", fmt.inr2(M.RULES.disposalPerUnit), " a unit; EPR ₹", M.RULES.eprPerKg, " a kilo of product and pack. Factors marked indicative are editable here.")), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10 } }, done ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "Watching since setup"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: () => go("command") }, "Open Command Center")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "check", loading: busy, busy: "Confirming…", done: "Confirmed", disabled: !mapped, "aria-describedby": mapped ? void 0 : "setup-why", onClick: confirm }, "Confirm and start watching"), !mapped && /* @__PURE__ */ React.createElement("span", { id: "setup-why", className: "setup-why" }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 15, stroke: 2.2 }), "Confirm once the Data agent has mapped an export.")))));
  }
  const SW_NAMES = { kirana: "Kirana scheme", staff: "Staff sale", foodbank: "Food bank", expiresoon: "ExpireSoon" };
  const r2 = (n) => Math.round(n * 100) / 100;
  const inr2 = fmt.inr2;
  function swingOf(C, posted) {
    const P = C.plan, wo = P.writeOff, a = C.actual || {}, delta = posted ? a.delta || 0 : 0;
    const took = posted && C.realised ? Object.fromEntries(C.realised.lines.map((l) => [l.id, l.units])) : null;
    const exits = P.lines.filter((l) => l.units > 0 && l.id !== "writeoff").map((l) => {
      const units = took ? took[l.id] || 0 : l.units;
      if (!units) return null;
      const es = l.id === "expiresoon", price = es && delta && C.counter ? C.counter.price : l.price;
      const cost = es ? l.cost : r2(l.cost / l.units * units), itcLoss = r2(l.itcLoss / l.units * units), net2 = r2(units * price - cost - itcLoss);
      return { id: l.id, name: SW_NAMES[l.id] || l.short, units, price, packPrice: l.packPrice, charged: Math.round(units * l.charged / l.units), cost, itcLoss, net: net2, perPack: r2(net2 / units) };
    }).filter(Boolean);
    const net = posted ? a.net : P.net, pnl = posted ? a.pnl : P.pnl, swing = posted ? a.swing : P.swing;
    const sold = exits.filter((e) => e.id !== "foodbank").reduce((t, e) => t + e.units, 0), given = exits.filter((e) => e.id === "foodbank").reduce((t, e) => t + e.units, 0);
    return {
      wo,
      exits,
      net,
      pnl,
      swing,
      book: P.bookCost,
      units: P.units,
      sku: C.sku,
      batch: C.batch,
      sold,
      given,
      left: took && C.realised.godown || P.leftover || 0,
      itcLost: r2(exits.reduce((t, e) => t + e.itcLoss, 0)),
      // what destroying would have cost beyond the stock and nobody paid; and what the packs left still cost
      notPaid: r2(swing - net),
      leftCost: r2(pnl - (net - P.bookCost)),
      out: (P.rows || []).filter((r) => !r.baseline && !r.eligible && r.reason)
    };
  }
  function exitHow(e) {
    if (e.id === "kirana") return `${fmt.num(e.units)} packets, ${fmt.num(e.charged)} charged at ₹${e.packPrice.toFixed(2)} (2 free with every 10), less ₹${fmt.num(e.cost)} van`;
    if (e.id === "staff") return `${fmt.num(e.units)} packs at ₹${e.price.toFixed(2)}, by UPI`;
    if (e.id === "foodbank") return `${fmt.num(e.units)} packs given: ₹${e.cost.toFixed(2)} handling, and their GST credit reversed (₹${e.itcLoss.toFixed(2)})`;
    if (e.id === "expiresoon") return `${fmt.num(e.units)} packs at ₹${e.price.toFixed(2)}, less ₹${fmt.num(e.cost)} listing fee`;
    return `${fmt.num(e.units)} packs`;
  }
  function SwingBridge({ w }) {
    const reduce = useReducedMotion();
    const steps = [{ k: "If destroyed", v: -w.wo.total, end: true, tone: "gone" }].concat(w.exits.map((e) => ({ k: e.name, v: e.net, tone: e.net < 0 ? "gone" : "kept" }))).concat([{ k: "Not paid", v: w.notPaid, tone: "kept", soft: true }, { k: "With the plan", v: w.pnl, end: true, tone: "plan" }]);
    let run = 0;
    const bars = steps.map((st) => {
      if (st.end) {
        run = st.v;
        return { ...st, from: 0, to: st.v };
      }
      const b = { ...st, from: run, to: run + st.v };
      run += st.v;
      return b;
    });
    const lo = Math.min(0, ...bars.map((b) => Math.min(b.from, b.to))) * 1.06, hi = Math.max(0, ...bars.map((b) => Math.max(b.from, b.to))) + Math.abs(lo) * 0.14;
    const W = 436, H = 250, top = 20, bot = 62, n = bars.length, bw = Math.min(40, (W - 12 * (n + 1)) / n), gap = (W - n * bw) / (n + 1);
    const y = (v) => top + (hi - v) / (hi - lo) * (H - top - bot);
    return /* @__PURE__ */ React.createElement("figure", { className: "sw-bridge", role: "img", "aria-label": `A bridge from ${inr2(-w.wo.total)} if destroyed to ${inr2(w.pnl)} with the plan: ${inr2(w.swing)} better` }, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("line", { x1: "0", x2: W, y1: y(0), y2: y(0), className: "zero" }), bars.map((b, i) => {
      const x = gap + i * (bw + gap), y0 = y(Math.max(b.from, b.to)), h = Math.max(2, Math.abs(y(b.from) - y(b.to)));
      const under = b.v < 0 && !b.end || b.end && b.v < 0 && h > 40;
      const words = b.k.includes(" ") ? [b.k.slice(0, b.k.indexOf(" ")), b.k.slice(b.k.indexOf(" ") + 1)] : [b.k];
      return /* @__PURE__ */ React.createElement("g", { key: b.k }, i > 0 && /* @__PURE__ */ React.createElement("line", { x1: x - gap, x2: x, y1: y(b.end ? b.to : b.from), y2: y(b.end ? b.to : b.from), className: "link" }), /* @__PURE__ */ React.createElement(motion.rect, { x, width: bw, rx: "5", className: cx("bar", b.tone, b.soft && "soft"), initial: reduce ? false : { y: y(0), height: 0 }, animate: { y: y0, height: h }, transition: { duration: reduce ? 0 : 0.42, delay: reduce ? 0 : i * 0.07, ease: [0.22, 1, 0.36, 1] } }), /* @__PURE__ */ React.createElement("text", { x: x + bw / 2, y: under ? y(b.to) + 15 : y0 - 7, className: cx("val", b.tone), textAnchor: "middle" }, (b.v > 0 && !b.end ? "+" : "") + fmt.inr(Math.round(b.v))), words.map((t, j) => /* @__PURE__ */ React.createElement("text", { key: j, x: x + bw / 2, y: H - 26 + j * 13, className: "lab", textAnchor: "middle" }, t)));
    })), /* @__PURE__ */ React.createElement("figcaption", null, "Not paid: what destroying would have cost beyond the stock (the GST credit, disposal and EPR)."));
  }
  const Amt = ({ v }) => /* @__PURE__ */ React.createElement("span", { className: "nw" }, inr2(v));
  const SwRow = ({ k, sub, v, strong, tone }) => /* @__PURE__ */ React.createElement("div", { className: cx("sw-row", strong && "strong") }, /* @__PURE__ */ React.createElement("span", { className: "k" }, /* @__PURE__ */ React.createElement("span", null, k), sub && /* @__PURE__ */ React.createElement("span", { className: "sub" }, sub)), /* @__PURE__ */ React.createElement("span", { className: cx("v tnum", tone) }, v));
  function SwingWorking({ w }) {
    const first = w.exits.slice().sort((a, b) => b.perPack - a.perPack)[0], wo = w.wo;
    const per = (v, u) => `₹${(v / u).toFixed(2)}`;
    return /* @__PURE__ */ React.createElement("div", { className: "sw-work" }, /* @__PURE__ */ React.createElement("div", { className: "sw-hero" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "The swing on ", w.batch.id), /* @__PURE__ */ React.createElement("span", { className: "sw-big tnum" }, inr2(w.swing)), /* @__PURE__ */ React.createElement("p", null, "Sending the batch to its exits left ", D.WORKSPACE.short, " ", /* @__PURE__ */ React.createElement(Amt, { v: w.swing }), " better off than destroying it: a P&L of ", /* @__PURE__ */ React.createElement(Amt, { v: w.pnl }), " instead of ", /* @__PURE__ */ React.createElement(Amt, { v: -wo.total }), ".")), /* @__PURE__ */ React.createElement(SwingBridge, { w }), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "If it were destroyed"), /* @__PURE__ */ React.createElement(SwRow, { k: "Stock written off at cost", sub: `${fmt.num(wo.units)} × ₹${w.sku.cost.toFixed(2)}`, v: inr2(-wo.stock) }), /* @__PURE__ */ React.createElement(SwRow, { k: "GST input credit reversed", sub: `${fmt.num(wo.units)} × ₹${wo.itcPerUnit.toFixed(2)}`, v: inr2(-wo.itc) }), /* @__PURE__ */ React.createElement(SwRow, { k: "Disposal", sub: `${fmt.num(wo.units)} × ${per(wo.disposal, wo.units)}`, v: inr2(-wo.disposal) }), /* @__PURE__ */ React.createElement(SwRow, { k: "EPR", sub: `${wo.kg.toLocaleString("en-IN")} kg × ${per(wo.epr, wo.kg)}`, v: inr2(-wo.epr) }), /* @__PURE__ */ React.createElement(SwRow, { k: "The bin would cost", sub: `₹${wo.perUnit.toFixed(2)} a pack`, v: inr2(-wo.total), strong: true, tone: "gone" })), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "What the plan did"), w.exits.map((e) => /* @__PURE__ */ React.createElement(SwRow, { key: e.id, k: e.name, sub: exitHow(e), v: (e.net < 0 ? "" : "+") + inr2(e.net), tone: e.net < 0 ? "gone" : void 0 })), /* @__PURE__ */ React.createElement(SwRow, { k: "Recovered", v: inr2(w.net), strong: true, tone: "kept" }), /* @__PURE__ */ React.createElement(SwRow, { k: "The stock leaves the books at cost", sub: `either way: ${fmt.num(w.units)} × ₹${w.sku.cost.toFixed(2)}`, v: inr2(-w.book) }), Math.abs(w.leftCost) >= 0.01 && /* @__PURE__ */ React.createElement(SwRow, { k: "The packs left at the godown", sub: `${fmt.num(w.left)} packs no exit took: what destroying them cost`, v: inr2(w.leftCost), tone: "gone" }), /* @__PURE__ */ React.createElement(SwRow, { k: "The P&L with the plan", v: inr2(w.pnl), strong: true })), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "The swing"), /* @__PURE__ */ React.createElement("p", { className: "sw-sum tnum" }, inr2(w.pnl), " − (", inr2(-wo.total), ") = ", /* @__PURE__ */ React.createElement("b", null, inr2(w.swing))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted" }, "Put another way: ", inr2(w.net), " recovered, plus the ", inr2(w.notPaid), " destroying it would have cost beyond the stock (the GST credit, disposal and EPR), which nobody paid.")), /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h3", null, "How the loss was kept small"), /* @__PURE__ */ React.createElement("ul", { className: "sw-why" }, first && /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Icon, { name: "route", size: 16 }), /* @__PURE__ */ React.createElement("span", null, "The Router filled the best-paying exit first: the ", first.name.toLowerCase(), " at ", /* @__PURE__ */ React.createElement(Amt, { v: first.perPack }), " a pack, net, against ", /* @__PURE__ */ React.createElement(Amt, { v: -wo.perUnit }), " a pack in the bin.")), w.out.slice(0, 2).map((r) => /* @__PURE__ */ React.createElement("li", { key: r.id }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-x", size: 16 }), /* @__PURE__ */ React.createElement("span", null, r.short || r.name, " was left out: ", r.reason, "."))), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Icon, { name: "receipt", size: 16 }), /* @__PURE__ */ React.createElement("span", null, "The GST input credit stays on the ", fmt.num(w.sold), " packs sold", w.given ? `; only the ${fmt.num(w.given)} donated packs reverse theirs (${inr2(w.itcLost)})` : "", ".")), w.left ? /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Icon, { name: "warehouse", size: 16 }), /* @__PURE__ */ React.createElement("span", null, fmt.num(w.left), " packs no exit took were left at the godown and destroyed there; every other pack went somewhere.")) : /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement(Icon, { name: "recycle", size: 16 }), /* @__PURE__ */ React.createElement("span", null, "No disposal or EPR to pay: every pack went somewhere.")))), /* @__PURE__ */ React.createElement("p", { className: "t-caption subtle" }, "Worked out from ", D.WORKSPACE.short, "'s cost sheet and the platform's rules, as the Valuer prices every exit."));
  }
  function SwingMoney({ C, posted, label, phone }) {
    const [open, setOpen] = useState(false);
    const w = swingOf(C, posted);
    return /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 4 } }, /* @__PURE__ */ React.createElement(Money, { value: w.net, size: phone ? "s" : "m", roll: true, style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, label), /* @__PURE__ */ React.createElement("button", { type: "button", className: "sw-note", "aria-haspopup": "dialog", onClick: () => setOpen(true) }, /* @__PURE__ */ React.createElement(Icon, { name: "scale", size: 15, stroke: 2.1 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, fmt.inr(w.swing), " better"), " than destroying it"), /* @__PURE__ */ React.createElement("span", { className: "sw-how" }, "How it adds up")), /* @__PURE__ */ React.createElement(Sheet, { open, onClose: () => setOpen(false), title: "How the swing adds up", side: phone ? "bottom" : "side", detent: "large" }, /* @__PURE__ */ React.createElement(SwingWorking, { w })));
  }
  function ImpactCard() {
    const s = useStore();
    const { go } = useRoute();
    const L = window.SC3_LEDGER;
    const book = useMemo(() => L ? L.ledger(s) : null, [s.hero.posted, s.hero.phase, s.mango.phase, s.scenario]);
    const p = book && L.impactPeriod(book);
    const d = useMemo(() => book ? L.dashboard(book, p.id) : null, [book, p && p.id]);
    if (!book) return null;
    const t = p.totals;
    const kgOf = (v) => fmt.kg(Math.round(v * 100) / 100);
    const max = Math.max(1, ...d.weeks.map((w) => w.kept)), n = d.weeks.length;
    const line = d.weeks.map((w, i) => (i ? "L" : "M") + (n > 1 ? i / (n - 1) * 120 : 60).toFixed(1) + " " + (26 - w.kept / max * 22).toFixed(1)).join(" ");
    return /* @__PURE__ */ React.createElement(Card, { className: "imc stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "icontile", style: { borderRadius: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: "leaf", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Impact · ", p.label)), d.share != null && /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green" }, d.share, "% saved")), t.batches ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "imc-figs" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, kgOf(t.kg)), /* @__PURE__ */ React.createElement("span", null, "kept out of landfill")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, kgOf(t.co2)), /* @__PURE__ */ React.createElement("span", null, "CO₂e avoided")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, fmt.num(t.meals)), /* @__PURE__ */ React.createElement("span", null, "meals"))), /* @__PURE__ */ React.createElement("svg", { className: "imc-spark", viewBox: "0 0 120 28", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { className: "a", d: `${line} L120 28 L0 28 Z` }), /* @__PURE__ */ React.createElement("path", { className: "l", d: line })), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, t.batches, " ", t.batches === 1 ? "batch" : "batches", " cleared", p.current ? " so far" : "", " · ", kgOf(t.destroyedKg), " destroyed · CO₂e indicative")) : /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Nothing has cleared in ", p.label, " yet. Each batch joins the ledger when Impact posts it."), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "book-open", onClick: () => go("report", { reading: "impact" }) }, "Open the ledger"));
  }
  function CommandCenter({ me, onOpenRoute }) {
    const s = useStore();
    const { go } = useRoute();
    const app = useApp();
    const hm = heroModel(s);
    const phone = app.bp === "phone";
    const C = storyOf(s);
    const [sel, setSel] = useState(null);
    const [dz, setDz] = useState(false);
    const views = useMemo(() => C.batches.map((b) => {
      const v = D.batchView(b);
      if (b.hero) v.phase = hm.view.phase;
      if (b.second) v.phase = "executing";
      return v;
    }), [s.seq, s.scenario]);
    const watchlist = views.filter((v) => !(v.hero && s.hero.phase === "watching")).sort((a, b) => (a.phase === "at-risk" || !a.phase && a.assess.status === "at-risk" ? -1 : 0) - (b.phase === "at-risk" || !b.phase && b.assess.status === "at-risk" ? -1 : 0) || a.daysLeft - b.daysLeft);
    const openRoute = () => onOpenRoute ? onOpenRoute() : go("route");
    const journeys = journeyItems(s, null);
    const openBatch = (ref) => {
      const it = journeys.find((i) => i.ref === ref);
      go(partAt(it), { ref });
    };
    const dzWaits = s.hero.destruction && s.hero.destruction.status === "checked";
    const primary = dzWaits ? /* @__PURE__ */ React.createElement(Button, { variant: "approve", icon: "check", onClick: () => setDz(true) }, "Review the destruction") : s.hero.phase === "planned" ? /* @__PURE__ */ React.createElement(Button, { variant: "approve", icon: "check", onClick: openRoute }, "Review and approve") : ["approved", "executing"].includes(s.hero.phase) ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: () => go("execution", { ref: s.hero.id }) }, "Watch execution") : /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: openRoute }, "Open Route Room");
    const flagged = s.hero.phase !== "watching" && s.setup.confirmed;
    const routed = ["approved", "executing", "dispatched", "settled", "cleared"].includes(s.hero.phase);
    const perm = s.setup.permission;
    const money = s.hero.plan ? /* @__PURE__ */ React.createElement(SwingMoney, { C, posted: !!s.hero.posted, phone, label: s.hero.posted ? C.ES ? "recovered, after the negotiation" : "recovered, every line done" : routed ? "on plan · settles day 3–7" : "net recovered on the plan" }) : void 0;
    const holder = personOf(C, C.accounts.distributor);
    const placed = C.plan.lines.filter((l) => l.units > 0 && l.id !== "writeoff").map((l) => l.id === "kirana" ? `${fmt.num(l.units)} with ${C.kiranas.length} kiranas` : l.id === "expiresoon" ? `${fmt.num(l.units)} with a ${D.BUYER.city} wholesaler` : l.id === "staff" ? `${fmt.num(l.units)} at the staff sale` : `${fmt.num(l.units)} to ${C.donation ? C.donation.partner.name : "a food bank"}`).join(", ");
    const ready = !S.useLive() || s.setup.mapped > 0;
    const tracker = flagged ? /* @__PURE__ */ React.createElement(
      TrackerCard,
      {
        view: hm.view,
        done: hm.done,
        current: hm.current,
        eta: perm && perm.paused ? `Paused by ${holder.short}` : hm.eta,
        etaTone: perm && perm.paused ? "amber" : hm.etaTone,
        agentLive: perm && perm.paused ? "" : hm.agentLive,
        primary,
        money,
        line: s.hero.phase === "cleared" ? s.hero.destruction ? `${fmt.num(C.plan.units - s.hero.destruction.units)} of ${fmt.num(C.plan.units)} units placed; ${fmt.num(s.hero.destruction.units)} expired and were destroyed at ${C.dist.godown}, on your yes.` : `All ${fmt.num(C.plan.units)} units placed: ${placed}. Nothing went to the bin.` : void 0
      }
    ) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { img: "sprout-box", title: !s.setup.confirmed ? ready ? "Confirm Setup to start watching" : "Connect your stock data to start" : !perm ? `Waiting for ${possessive(C.dist.name)} permission` : "Nothing at risk yet", body: !s.setup.confirmed ? ready ? `Your distributors' stock export is mapped: ${fmt.num(D.SETUP.dms.rows)} batches from ${Object.keys(D.DISTRIBUTORS).length} distributors. Review the guardrails and confirm; the Watcher checks at ${s.rules.watchTime} the next morning.` : `Upload the distributor export once and set the guardrails. It takes about ${D.SETUP.minutes} minutes; the Watcher starts the next morning.` : !perm ? "Rakesh bhai's stock is listed and offered in his name, so he gives a one-time permission in his app first. He can pause it at any time." : "The Watcher checks every batch against the quick-commerce gates and sell-through at 09:00. You get a push the moment one cannot make it.", action: !s.setup.confirmed ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: () => go("setup") }, ready ? "Review and confirm" : "Open Setup") : !perm ? /* @__PURE__ */ React.createElement(S.PlayAs, { who: "rakesh", route: "home" }, "Give the permission as Rakesh bhai") : null }));
    const cluster = flagged && /* @__PURE__ */ React.createElement(Card, { pad: false, className: "stack", style: { overflow: "hidden", gap: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-head", style: { padding: "14px 16px 10px" } }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, C.dist.city, " cluster"), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: hm.ordered ? "green" : void 0, dot: !!hm.ordered, live: hm.ordered > 0 && hm.ordered < C.kiranas.length }, hm.ordered ? `${hm.ordered} of ${C.offered} kiranas ordered` : s.hero.offer ? `${C.offered} kiranas messaged` : `${C.offered} kiranas`)), /* @__PURE__ */ React.createElement(ClusterMap, { kiranas: C.kiranas, total: C.offered, godown: godownOf(C), orderedCount: hm.ordered, route: routed, vanProgress: s.hero.van.status === "done" ? 1 : hm.ordered / C.kiranas.length * 0.6, height: phone ? 220 : 280 }));
    const feed = /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Every hand-off, as it happens" }, "Agent activity"), /* @__PURE__ */ React.createElement(Card, null, s.feed.length ? /* @__PURE__ */ React.createElement(AgentFeed, { events: s.feed, people: C.people, live: hm.agentLive ? s.feed.length - 1 : -1, max: phone ? 3 : 6 }) : /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "The agents report here once the Watcher runs.")), /* @__PURE__ */ React.createElement(ImpactCard, null));
    const list = /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Sorted by days to best-before; at-risk batches first" }, "Watchlist"), /* @__PURE__ */ React.createElement("div", { className: "list" }, watchlist.map((v) => /* @__PURE__ */ React.createElement(BatchRow, { key: v.id, view: v, selected: sel === v.id, compact: phone, onOpen: () => {
      setSel(v.id);
      openBatch(v.id);
    } }))));
    const live = S.useLive();
    if (live) return /* @__PURE__ */ React.createElement(LiveCommandCenter, { me, live, hm, money, watchlist, sel, setSel, feed, cluster });
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Command Center", sub: flagged ? `${C.journey.today} · Watcher checked 312 batches at 09:00` : "Watcher runs daily at 09:00 across 312 batches" }, app.bp === "desktop" ? /* @__PURE__ */ React.createElement(Columns, { sideWidth: 340, main: /* @__PURE__ */ React.createElement(React.Fragment, null, tracker, cluster, list), side: feed }) : /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, tracker, feed, list, cluster), /* @__PURE__ */ React.createElement(DestructionSheet, { open: dz && !!s.hero.destruction, onClose: () => setDz(false), d: s.hero.destruction, x: s.hero.expiry, dist: C.dist, sku: C.sku, batch: C.batch }));
  }
  function LiveCommandCenter({ me, live, hm, money, watchlist, sel, setSel, feed, cluster }) {
    const s = useStore();
    const { go } = useRoute();
    const app = useApp();
    const phone = app.bp === "phone";
    const L = S.Live;
    const dim = L.down(live.conn);
    const offline = live.conn === "offline";
    const items = L.flaggedItems(s, live);
    const watch = s.rules.watchTime;
    const rows = D.SETUP.dms.rows;
    const openRoute = (ref) => go("route", { ref });
    const primary = s.hero.phase === "planned" ? /* @__PURE__ */ React.createElement(Button, { variant: "approve", icon: "check", disabled: offline, onClick: () => openRoute(items[0].ref) }, "Review and approve") : ["approved", "executing"].includes(s.hero.phase) ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: () => go("execution", { ref: s.hero.id }) }, "Watch execution") : /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: () => openRoute(items[0].ref) }, "Open Route Room");
    const hero = /* @__PURE__ */ React.createElement(L.Dim, { on: dim }, /* @__PURE__ */ React.createElement(TrackerCard, { view: hm.view, done: hm.done, current: hm.current, eta: dim ? L.pausedWords(live) : hm.eta, etaTone: dim ? "gray" : hm.etaTone, agentLive: dim ? "" : hm.agentLive, primary, money }));
    const top = live.quiet ? /* @__PURE__ */ React.createElement(L.Quiet, null) : items.length > 1 ? /* @__PURE__ */ React.createElement(L.Flagged, { items }, (it) => it.hero ? hero : /* @__PURE__ */ React.createElement(L.MangoCard, { item: it, dim })) : hero;
    const list = /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: live.quiet ? "Every batch clears inside its date at today's sell-through" : "Flagged batches first, then by days to best-before" }, "Watchlist"), /* @__PURE__ */ React.createElement("div", { className: "list" }, watchlist.map((v) => /* @__PURE__ */ React.createElement(BatchRow, { key: v.id, view: v, selected: sel === v.id, compact: phone, onOpen: () => {
      setSel(v.id);
      const it = journeyItems(s, live).find((i) => i.ref === v.id);
      go(partAt(it), { ref: v.id });
    } }))));
    const side = /* @__PURE__ */ React.createElement(L.Dim, { on: dim }, feed);
    const map = !live.quiet && cluster;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Command Center", sub: `Watcher checked ${rows} batches at ${watch} · ${live.quiet ? "nothing flagged" : items.length + " flagged"}` }, app.bp === "desktop" ? /* @__PURE__ */ React.createElement(Columns, { sideWidth: 340, main: /* @__PURE__ */ React.createElement(React.Fragment, null, top, map, list), side }) : /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, top, side, list, map));
  }
  const LABEL_PHOTOS = ["MF-2406-105", "MF-2406-106", "MF-2406-107", "MF-2406-108", "MF-2406-109", "MF-2407-110", "MF-2407-111", "MF-2407-112", "MF-2407-113", "MF-2407-114", "MF-2407-115", "MF-2407-116", "MF-2409-117", "MF-2410-118"];
  function LabelShot({ cover, dim, batch = "MF-2409-117", src, children }) {
    const img = window.SC3_IMG || "system/img/";
    const photo = LABEL_PHOTOS.includes(batch);
    if (src) return /* @__PURE__ */ React.createElement("div", { className: cx("lshot", cover && "cover"), style: dim ? { filter: "saturate(0.85) brightness(0.94)" } : void 0 }, /* @__PURE__ */ React.createElement(S.Photo, { className: "as-sent", src, alt: "" }), children);
    return /* @__PURE__ */ React.createElement("div", { className: cx("lshot", cover && "cover"), style: dim ? { filter: "saturate(0.85) brightness(0.94)" } : void 0 }, /* @__PURE__ */ React.createElement("img", { src: photo ? img + "labels/" + batch + ".webp" : img + "label-shot.webp", alt: "" }), !photo && /* @__PURE__ */ React.createElement("div", { className: "lshot-label", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("b", null, "MUNCHLY"), /* @__PURE__ */ React.createElement("span", { className: "ls-prod" }, "Masala Chips 150 g"), /* @__PURE__ */ React.createElement("span", null, "BATCH  MF-2409-117"), /* @__PURE__ */ React.createElement("span", null, "MFG  18 MAY 2026"), /* @__PURE__ */ React.createElement("span", null, "BEST BEFORE  18 NOV 2026"), /* @__PURE__ */ React.createElement("span", null, "MRP ₹30.00 incl. of all taxes"), /* @__PURE__ */ React.createElement("span", null, "24 × 150 g")), children);
  }
  function LabelPhoto({ status }) {
    const s = useStore();
    const reduce = useReducedMotion();
    const C = storyOf(s), b = C.batch, holder = personOf(C, C.accounts.distributor);
    const shelf = b.shelf ? ` on shelf ${b.shelf}` : "";
    return /* @__PURE__ */ React.createElement("div", { role: "img", "aria-label": status === "verified" ? `Carton label${shelf}: batch ${b.id}, MFG ${fmt.date(b.mfg)}, best before ${fmt.date(b.bestBefore)}, MRP ${fmt.rate(C.sku.mrp)}` : "Carton label, not yet photographed", style: { position: "relative", width: "100%", borderRadius: 16, overflow: "hidden", background: "var(--surface-sunken)" } }, /* @__PURE__ */ React.createElement(LabelShot, { dim: status !== "verified", batch: b.id, src: s.hero.photo && s.hero.photo.url }), status === "reading" && !reduce && /* @__PURE__ */ React.createElement(motion.div, { "aria-hidden": "true", initial: { top: "18%" }, animate: { top: ["18%", "78%", "18%"] }, transition: { duration: 1.6, repeat: 2, ease: "easeInOut" }, style: { position: "absolute", left: "10%", right: "10%", height: 3, borderRadius: 3, background: "var(--glow)", boxShadow: "0 0 18px var(--glow)" } }), status === "verified" && /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", left: 10, bottom: 10 } }, /* @__PURE__ */ React.createElement(Badge, { solid: true, tone: "green", icon: "check" }, "Verified · Gemini vision · 0.97")), (status === "requested" || status === "none") && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "color-mix(in oklab, var(--bg) 55%, transparent)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" } }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { justifyItems: "center", textAlign: "center", padding: 16 } }, /* @__PURE__ */ React.createElement(Avatar, { person: holder, size: "lg" }), /* @__PURE__ */ React.createElement("b", null, status === "requested" ? `Waiting for ${possessive(holder.short)} photo` : "No label photo yet"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, status === "requested" ? `Asked at ${C.at.ask} · one carton${shelf}` : "Vision asks the godown before quoting any price"), status === "requested" && /* @__PURE__ */ React.createElement(S.PlayAs, { who: C.accounts.distributor, route: "photo" }, `Take the photo as ${holder.short}`))));
  }
  function ApproveSheet({ open, onClose, me }) {
    const { go } = useRoute();
    const hero = useStore().hero;
    const [busy, setBusy] = useState(false);
    const [placed, setPlaced] = useState(false);
    const reduce = useReducedMotion();
    const s = S.useStore();
    const approvedNow = !!(s.hero.plan && s.hero.plan.status === "approved");
    const C = storyOf(s), P = C.plan, KL = C.KL, ES = C.ES, holder = personOf(C, C.accounts.distributor), whose = possessive(C.dist.name);
    const st = P.lines.find((l) => l.id === "staff" && l.units > 0), fb = P.lines.find((l) => l.id === "foodbank" && l.units > 0);
    const after = [
      ES && ["shopping-bag", `Lister posts ${ES.units} units on ExpireSoon at ₹${ES.price} in ${whose} name, with the label photo and dates; reserve ₹13.50, hidden from buyers inside Munchly's territories.`],
      KL && ["send", `Outreach pushes the Hindi scheme to ${C.offered} kiranas: ${KL.units} units at ₹${KL.packPrice.toFixed(2)} a pack, 2 free with every 10, for 48 hours.`],
      st && ["users", `${C.dist.short} opens a staff sale of ${st.units} packs at ₹${st.price} at ${C.dist.godown}, and records what sold.`],
      fb && ["heart-handshake", `Donation books a food bank for the last ${fb.units} packs, with the FSSAI checklist.`],
      ["smartphone", `${holder.short} gets the same plan in ${C.pron} app and can pause it.`],
      ["shield-check", "Nothing is listed, messaged or shipped before this tap. The approval is logged with who, when and device."]
    ].filter(Boolean);
    const doing = [ES && `the Lister is posting on ExpireSoon in ${whose} name`, KL && `Outreach is messaging ${C.offered} kiranas`, fb && "Donation is booking a food bank"].filter(Boolean);
    const now = doing.length > 1 ? doing.slice(0, -1).join(", ") + " and " + doing[doing.length - 1] : doing[0] || "the agents start";
    const [soon, setSoon] = useState(false);
    useEffect(() => {
      if (open) {
        setPlaced(approvedNow);
        setSoon(false);
      }
    }, [open]);
    useEffect(() => {
      if (open && approvedNow) setPlaced(true);
    }, [approvedNow]);
    const live = S.useLive();
    const failed = live && live.failed && live.failed.action === "approve" ? live.failed : null;
    const offline = !!live && live.conn === "offline";
    const approve = () => {
      setBusy(true);
      if (live) {
        live.act("approve", () => Flow.act("approve", me ? me.id : "priya")).then((ok) => {
          setBusy(false);
          if (ok) setPlaced(true);
        });
        return;
      }
      setTimeout(() => {
        setBusy(false);
        Flow.act("approve", me ? me.id : "priya");
        setPlaced(true);
      }, 650);
    };
    const yes = offline ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Button, { variant: "approve", size: "lg", block: true, icon: "check", "aria-disabled": "true", "aria-describedby": "lv-sheet-net", className: "lv-blocked" }, "Approve · release the agents"), /* @__PURE__ */ React.createElement("span", { style: { justifySelf: "center" } }, /* @__PURE__ */ React.createElement(S.Live.NeedsNet, { id: "lv-sheet-net" }))) : /* @__PURE__ */ React.createElement(Button, { variant: "approve", size: "lg", block: true, icon: failed ? "refresh-cw" : "check", loading: busy, busy: "Approving the plan…", onClick: approve }, failed ? "Retry · release the agents" : "Approve · release the agents");
    return /* @__PURE__ */ React.createElement(Sheet, { open, onClose, title: placed ? "Plan placed" : "Approve the plan", footer: placed ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, iconRight: "arrow-right", onClick: () => {
      onClose();
      go("execution", { ref: hero.id });
    } }, "Watch execution") : /* @__PURE__ */ React.createElement(React.Fragment, null, failed && !busy && /* @__PURE__ */ React.createElement(S.Live.ApproveFailed, { message: failed.message }), yes, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: soon ? 6 : 0 } }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", block: true, icon: "x", "aria-disabled": "true", "aria-describedby": "as-reject-soon", className: "lv-blocked", onClick: () => setSoon(true) }, "Reject the plan"), /* @__PURE__ */ React.createElement("span", { id: "as-reject-soon", role: "status", className: "t-footnote lv-needs", style: { justifySelf: "center" } }, soon && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { name: "clock", size: 14 }), "Coming Soon"))), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", block: true, onClick: onClose }, "Not now")) }, placed ? /* @__PURE__ */ React.createElement("div", { className: "stack", style: { justifyItems: "center", textAlign: "center", padding: "12px 0 8px" } }, /* @__PURE__ */ React.createElement("svg", { width: "96", height: "96", viewBox: "0 0 96 96", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(motion.circle, { cx: "48", cy: "48", r: "42", fill: "none", stroke: "var(--primary)", strokeWidth: "6", initial: reduce ? false : { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.6, ease: [0.65, 0, 0.35, 1] } }), /* @__PURE__ */ React.createElement(motion.path, { d: "M30 49 L43 62 L67 36", fill: "none", stroke: "var(--primary)", strokeWidth: "7", strokeLinecap: "round", strokeLinejoin: "round", initial: reduce ? false : { pathLength: 0 }, animate: { pathLength: 1 }, transition: { delay: 0.45, duration: 0.4 } })), /* @__PURE__ */ React.createElement("div", { className: "t-title2" }, "Approved · ", C.at.approve), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { justifyItems: "center" } }, /* @__PURE__ */ React.createElement(Money, { value: P.swing, size: "l", roll: true, from: 0, style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "muted" }, "better than the bin, on one batch of ", noun(C.sku))), /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { maxWidth: "40ch" } }, now[0].toUpperCase() + now.slice(1), " now. ", holder.short, " has the plan in ", C.pron, " app. The approval is logged with who, when and device.")) : /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement(Money, { value: P.net, size: "l", style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "muted" }, "net recovered, ", P.pctMRP, "% of MRP")), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { icon: "trending-up", title: "Instead of destroying", value: fmt.inr(-P.writeOff.total) }), /* @__PURE__ */ React.createElement(ListRow, { icon: "scale", iconTone: "blue", title: "Swing on this batch", value: fmt.inr(P.swing) }), /* @__PURE__ */ React.createElement(ListRow, { icon: "badge-check", iconTone: "gray", title: "GST input credit retained", value: fmt.inr(P.itcRetained) })), /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "What happens the moment you tap"), after.map(([ic, t]) => /* @__PURE__ */ React.createElement("div", { key: ic, className: "row top t-subhead", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Icon, { name: ic, size: 18, style: { marginTop: 2, color: "var(--fg-3)" } }), /* @__PURE__ */ React.createElement("span", null, t))))));
  }
  function RouteRoom({ me }) {
    const s = useStore();
    const app = useApp();
    const hm = heroModel(s);
    const h = s.hero;
    const [view, setView] = useState("chart");
    const [sheet, setSheet] = useState(false);
    const { go } = useRoute();
    const stages = D.STAGES.map((x) => ({ id: x.id, title: x.title, human: x.human }));
    const valued = ["valued", "planned", "approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    const planned = ["planned", "approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    const approved = ["approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    const v = hm.view;
    const sku = v.skuObj;
    const C = storyOf(s), P = C.plan, KL = C.KL, ES = C.ES, holder = personOf(C, C.accounts.distributor);
    const heroDist = C.dist;
    const leftOut = P.rows.filter((r) => r.id !== "writeoff" && r.id !== "foodbank" && !P.lines.some((l) => l.id === r.id) && (!r.eligible || r.net > 0));
    const lowest = (P.lines.filter((l) => l.id !== "writeoff").sort((a, b) => a.net / a.units - b.net / b.units)[0] || {}).short || "";
    const pack = (sku.name.match(/(\d+(\.\d+)?\s?(g|ml|kg|l))$/i) || [])[1] || sku.name;
    const label = [["Batch", v.id], ["Manufactured", fmt.date(v.mfg)], ["Best before", fmt.date(v.bestBefore)], ["Shelf life", `${v.assess.life} days · ${v.assess.lifeUsedPct}% used`], ["MRP", `${fmt.rate(sku.mrp)} · ${sku.perCarton} × ${pack}`], ["Records", "match"]];
    useEffect(() => {
      const f = () => setSheet(true);
      window.addEventListener("sc3:approve-open", f);
      return () => window.removeEventListener("sc3:approve-open", f);
    }, []);
    const live = S.useLive();
    const { route } = useRoute();
    const L = S.Live;
    const items = live ? L.flaggedItems(s, live) : null;
    const item = items && (items.find((i) => i.ref === (route.params && route.params.ref)) || items[0]);
    const below = items && items.length > 1 ? /* @__PURE__ */ React.createElement(L.Switcher, { items, current: item.ref }) : null;
    if (item && !item.hero) return /* @__PURE__ */ React.createElement(L.MangoRoom, { me, item, below });
    const dim = !!live && L.down(live.conn);
    const offline = !!live && live.conn === "offline";
    const Dim = live ? L.Dim : Pass;
    const framed = React.useContext(S.BatchCtx);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Route Room", sub: below || framed ? null : `${v.id} · ${sku.brand} ${sku.name} · ${v.dist.name}, ${v.dist.city}`, back: "Command Center", below }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20, paddingBottom: h.phase === "planned" ? 96 : 0 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: app.bp === "phone" ? 64 : 84 }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("div", { className: "row base", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(DaysNum, { days: v.daysLeft, life: sku.lifeDays, size: "l", style: { color: approved ? "var(--fg)" : "var(--red-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, "days left"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "best before ", fmt.date(v.bestBefore))))), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { justifyItems: app.bp === "phone" ? "start" : "end" } }, /* @__PURE__ */ React.createElement(GateChips, { gates: v.assess.gates }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, fmt.num(v.assess.atRisk), " of ", fmt.num(v.units), " units at risk · sells ", v.sellPerDay, " a day"))), /* @__PURE__ */ React.createElement(Dim, { on: dim }, app.bp === "phone" ? /* @__PURE__ */ React.createElement(TrackerCompact, { done: hm.done, current: hm.current }) : /* @__PURE__ */ React.createElement(Tracker, { stages, done: hm.done, current: hm.current, times: C.times || K.STAGE_TIMES }))), /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 340,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { "data-anchor": "label" }), /* @__PURE__ */ React.createElement(SectionTitle, { sub: `Vision · ${C.at.read}`, right: h.photo.status === "verified" && /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "matches the DMS record") }, "Label, read from the shelf"), /* @__PURE__ */ React.createElement(Card, { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { containerType: "inline-size" } }, /* @__PURE__ */ React.createElement("div", { className: "labelgrid" }, /* @__PURE__ */ React.createElement(LabelPhoto, { status: h.photo.status }), /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, h.photo.status === "verified" ? /* @__PURE__ */ React.createElement(List, null, label.map(([k, val]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, title: k, value: val }))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Locked, { icon: "scan-line", agent: "Vision Agent", live: h.photo.status !== "none", text: h.photo.status === "reading" ? "Reading batch, MFG, best-before and MRP from the photo." : "Prices nothing until a person photographs one carton label on the shelf." }), [0, 1, 2, 3].map((i) => /* @__PURE__ */ React.createElement(K.Skeleton, { key: i, h: 44, r: 12 }))))))), /* @__PURE__ */ React.createElement("div", { "data-anchor": "channels" }), /* @__PURE__ */ React.createElement(SectionTitle, { sub: `Valuer · ${evAt(C, "value")} · per unit, after costs`, right: valued && /* @__PURE__ */ React.createElement(Segmented, { options: [{ id: "chart", label: "Chart" }, { id: "table", label: "Table" }], value: view, onChange: setView, label: "View" }) }, "Five channels, priced"), valued ? view === "chart" ? /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(ChannelBars, { rows: P.rows, chosen: planned ? P.lines.map((l) => l.id) : [] }), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { marginTop: 6 } }, "Hover a bar for price, capacity, time to clear and what happens to the GST credit. Destroying costs ", fmt.inr2(-P.writeOff.perUnit), " a unit; a donation costs ", fmt.inr2(-P.rows.find((r) => r.id === "foodbank").net), ", because the credit on a gift is reversed.")) : /* @__PURE__ */ React.createElement(ChannelTable, { rows: P.rows, chosen: planned ? P.lines.map((l) => l.id) : [] }) : /* @__PURE__ */ React.createElement(Locked, { icon: "scale", agent: "Valuer Agent", live: h.photo.status === "verified", text: h.photo.status === "verified" ? `Pricing five channels against ${v.daysLeft} days left, capacities and the floor.` : "Prices five channels once the label is verified." }), /* @__PURE__ */ React.createElement("div", { "data-anchor": "split" }), /* @__PURE__ */ React.createElement(SectionTitle, { sub: `Router · ${evAt(C, "route")}` }, "Recommended split"), planned ? /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement(SplitBar, { plan: P, sku }), /* @__PURE__ */ React.createElement("div", { className: "stack tight t-subhead", style: { marginTop: 4 } }, P.lines.map((ln) => /* @__PURE__ */ React.createElement("div", { key: ln.id, className: "row top", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "dotmark", style: { background: `var(--ch-${ln.id})` } }), ln.id === "kirana" ? /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, KL.units, " units to the kirana cluster at ₹", KL.price, " effective"), " (₹", KL.packPrice.toFixed(2), " a pack, 2 free with every 10). The best price, and it keeps stock inside Munchly's own trade. Capped by what ", heroDist.kiranas, " kiranas can move in 14 days with the scheme, on top of the ", v.sellPerDay, " a day they already sell.") : ln.id === "expiresoon" ? /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, ES.units, " units to ExpireSoon at ₹", ES.price), " (reserve ₹13.50), listed in ", possessive(heroDist.name), " name and hidden from buyers inside Munchly's territories: unlimited depth, 5 to 9 days, the buyer pays freight.") : ln.id === "staff" ? /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, ln.units, " units to the ", ln.name, " at ₹", ln.price), ", at ", heroDist.godown, ": ", heroDist.short, " sells them to staff and records what sold.") : ln.id === "foodbank" ? /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, ln.units, " units to a food bank"), ", the last of the batch, booked with a partner whose rules it meets; the credit on a gift is reversed.") : /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, ln.units, " units written off"), ": no exit takes them in time."))), leftOut.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.id, className: "row top muted", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "dotmark", style: { background: "var(--fill-3)" } }), /* @__PURE__ */ React.createElement("span", null, r.eligible ? `The ${r.name} is eligible but pays less a unit than ${lowest}, so it gets nothing this time.` : `${r.short} is left out (${r.reason}).`))))), P.alt && /* @__PURE__ */ React.createElement(Card, { className: "row wrap", style: { gap: 14, background: "var(--surface-2)" } }, /* @__PURE__ */ React.createElement("span", { className: "icontile soft" }, /* @__PURE__ */ React.createElement(Icon, { name: "git-branch", size: 17 })), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, "Alternative considered: ", P.alt.label), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, "Net ", fmt.inr(P.alt.net), ": ", fmt.inr(P.net - P.alt.net), " less, and nothing stays in Munchly's own trade.")), /* @__PURE__ */ React.createElement(Badge, null, "not chosen")), /* @__PURE__ */ React.createElement(MoneyPanel, { plan: P, compact: app.bp !== "desktop" })) : /* @__PURE__ */ React.createElement(Locked, { icon: "split", agent: "Router Agent", live: h.phase === "valued", text: h.phase === "valued" ? "Filling the best-paying channel to its cap, then the next." : "Proposes a split once the channels are priced." }), approved && /* @__PURE__ */ React.createElement(Card, { className: "row wrap", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Avatar, { person: D.PEOPLE[h.plan && h.plan.by || "priya"], size: "lg" }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, "Approved by ", D.PEOPLE[h.plan && h.plan.by || "priya"].short, " · ", C.at.approve, " · phone"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, "Logged with who, when and device. The agents are executing; ", holder.short, " has the same plan in ", C.pron, " app.")), /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: () => go("execution", { ref: h.id }) }, "Watch execution"))),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Gaps drawn to the clock" }, "Agent timeline"), /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Dim, { on: dim }, /* @__PURE__ */ React.createElement(AgentFeed, { events: s.feed.filter((e) => e.stage !== "connect"), people: C.people, live: hm.agentLive && !dim ? s.feed.filter((e) => e.stage !== "connect").length - 1 : -1 }))))
      }
    )), h.phase === "planned" && /* @__PURE__ */ React.createElement("div", { style: { position: "sticky", bottom: 0, zIndex: 5, padding: "12px 0 16px", background: "linear-gradient(180deg, transparent, var(--bg) 35%)" } }, /* @__PURE__ */ React.createElement("div", { className: "card raised row wrap", style: { padding: "14px 16px", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap grow", style: { gap: 18 } }, [["You get", P.net, "var(--primary-text)"], ["Instead of", -P.writeOff.total, "var(--red-text)"], ["GST credit safe", P.itcRetained, "var(--fg)"]].map(([k, val, c]) => /* @__PURE__ */ React.createElement("div", { key: k, className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle strong" }, k), /* @__PURE__ */ React.createElement(Money, { value: val, size: "s", style: { color: c, fontSize: 26 } })))), offline ? /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { justifyItems: "end", gap: 6 } }, /* @__PURE__ */ React.createElement(Button, { variant: "approve", size: "lg", icon: "check", "aria-disabled": "true", "aria-describedby": "lv-needs-net", className: "lv-blocked" }, "Review and approve"), /* @__PURE__ */ React.createElement(L.NeedsNet, { id: "lv-needs-net" })) : /* @__PURE__ */ React.createElement(Button, { variant: "approve", size: "lg", icon: "check", onClick: () => setSheet(true) }, "Review and approve"))), /* @__PURE__ */ React.createElement(ApproveSheet, { open: sheet, onClose: () => setSheet(false), me }));
  }
  function Chat({ chat, typing, me }) {
    return /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, chat.map((m, i) => {
      const mine = m.from === "buyer";
      return /* @__PURE__ */ React.createElement(motion.div, { key: i, initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, className: "row end", style: { justifyContent: mine ? "flex-end" : "flex-start", gap: 8 } }, !mine && /* @__PURE__ */ React.createElement(K.Mark, { size: 28 }), /* @__PURE__ */ React.createElement("div", { style: { maxWidth: "82%", padding: "10px 13px", borderRadius: 18, borderBottomLeftRadius: mine ? 18 : 6, borderBottomRightRadius: mine ? 6 : 18, background: mine ? "var(--violet)" : "var(--fill-2)", color: mine ? "var(--violet-fg)" : "var(--fg)", fontSize: 14.5, lineHeight: 1.4 } }, m.text, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11.5, opacity: 0.9, marginTop: 3 } }, mine ? `${D.BUYER.name}, ${D.BUYER.city}` : "Rakesh Traders · Negotiator agent", " · ", m.at)), mine && /* @__PURE__ */ React.createElement(Avatar, { person: D.PEOPLE.agrawal, size: "sm" }));
    }), typing && /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(K.Mark, { size: 28 }), /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 14px", borderRadius: 18, background: "var(--fill-2)" } }, /* @__PURE__ */ React.createElement("span", { className: "typing" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)))));
  }
  function StaffOps({ staff, line, dist, batch }) {
    const units = staff ? staff.units : line.units, price = staff ? staff.price : line.price, sold = staff && staff.status === "recorded" ? staff.sold : null;
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "icontile", style: { borderRadius: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: "users", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Staff sale · ", dist.short)), !staff ? /* @__PURE__ */ React.createElement(Badge, null, "opens on approval") : sold == null ? /* @__PURE__ */ React.createElement(Badge, { tone: "blue", dot: true }, "open") : /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "recorded")), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 18 } }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "num m" }, sold == null ? "—" : fmt.num(sold), /* @__PURE__ */ React.createElement("span", { className: "subtle", style: { fontSize: "0.45em" } }, ` / ${fmt.num(units)}`)), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "sold to staff")), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "num m" }, "₹", price), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "a pack, by UPI"))), /* @__PURE__ */ React.createElement(K.Progress, { value: (sold || 0) / units, label: "Staff packs sold" }), staff && staff.receipt && staff.receipt.payments ? /* @__PURE__ */ React.createElement(S.ReceiptRead, { r: staff.receipt, count: sold, price, src: staff.receipt.url || `${window.SC3_IMG}${staff.receipt.file || `receipts/${batch}.webp`}` }) : /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, dist.short, " runs it at ", staff && staff.godown || dist.godown, " and records what sold, with the consolidated receipt of the staff's UPI payments; no agent acts here."));
  }
  function GodownLeft({ realised, plan, actual, dist }) {
    const took = (id) => (realised.lines.find((l) => l.id === id) || { units: 0 }).units;
    const rows = plan.lines.filter((l) => l.id !== "writeoff" && l.units > took(l.id)).map((l) => [l.id, l.short, l.units - took(l.id)]);
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "icontile gray", style: { borderRadius: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: "warehouse", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Left at the godown")), /* @__PURE__ */ React.createElement(Badge, null, fmt.num(realised.godown), " ", realised.godown === 1 ? "pack" : "packs")), /* @__PURE__ */ React.createElement(List, null, rows.map(([id, name, n]) => /* @__PURE__ */ React.createElement(ListRow, { key: id, title: name, sub: "planned, not taken", value: /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, fmt.num(n)) }))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Not recovered: ", fmt.num(realised.godown), " ", realised.godown === 1 ? "pack" : "packs", " at ", dist.godown, ", still facing the write-off at best-before. The figures count only what each channel took: net ", fmt.inr(actual), " of the ", fmt.inr(plan.net), " planned."));
  }
  const POLICY_NAME = { godown: "Destroyed at the godown", "full-credit": "Full credit at expiry", "price-support": "Price support only", none: "No returns" };
  function expirySentence(x, client, dist) {
    const n = fmt.num(x.units), amount = x.credit != null ? ` (${fmt.inr(x.credit)})` : "";
    const whose = dist.name + (/s$/.test(dist.name) ? "'" : "'s");
    if (x.policy === "godown") return `The ${n} packs are destroyed at ${dist.godown} through an authorised agency; ${client} credits ${dist.name} the dealer price, the GST it reverses and the agency's charges${x.amount != null ? ` (${fmt.inr(x.amount)})` : ""}.`;
    if (x.policy === "full-credit") return `The ${n} packs come back to ${client} for full credit${amount || " at the dealer price"}, and ${client} destroys them.`;
    if (x.policy === "price-support") return `The ${n} packs stay with ${dist.name}, which destroys them; ${client} pays it the gap to its price${amount}.`;
    return `With no returns, the ${n} packs are ${whose} loss, and it destroys them.`;
  }
  function ExpirySettlement({ settle: x, dist }) {
    const { go } = useRoute();
    const client = D.CLIENT.short;
    const figures = x.policy === "godown" ? [[`Credit to ${dist.short}`, x.amount != null ? fmt.inr(x.amount) : "at the dealer price"], ["Destroyed by", dist.short], ["Of it: GST and charges", fmt.inr((x.gst || 0) + (x.charges || 0))]] : [[`Credit to ${dist.short}`, x.policy === "none" ? "—" : x.credit != null ? fmt.inr(x.credit) : "at the dealer price"], ["Destroyed by", x.destroyedBy === "client" ? client : dist.short], [x.policy === "full-credit" ? "Disposal, EPR, GST" : "Client's other costs", x.policy === "full-credit" ? fmt.inr(x.disposal + x.epr + x.itc) : "—"]];
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "icontile", style: { borderRadius: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: "hand-coins", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Expiry settlement")), /* @__PURE__ */ React.createElement(Badge, { tone: x.policy === "none" ? void 0 : "green", icon: "check" }, POLICY_NAME[x.policy])), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))" } }, figures.map(([k, v]) => /* @__PURE__ */ React.createElement("div", { key: k, className: "stack tight", style: { gap: 2, padding: "10px 12px", borderRadius: 12, background: "var(--fill)" } }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, k), /* @__PURE__ */ React.createElement("b", { className: "tnum" }, v)))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, expirySentence(x, client, dist)), x.policy !== "none" && /* @__PURE__ */ React.createElement(Button, { variant: "outline", icon: "file-text", onClick: () => go("paperwork", { ref: storyOf().batch.id }) }, "Open the paper"));
  }
  const evidenceSrc = (ref, which, d) => {
    const p = d && d.photos && d.photos[which];
    return p && p.url || `${window.SC3_IMG}evidence/${window.SC3_LEDGER ? window.SC3_LEDGER.record.evidenceFile(ref, which, p) : `${ref}-${which}.webp`}`;
  };
  const DSTATE = { requested: ["amber", "waiting for the evidence"], asked: ["amber", "asked again"], reading: ["violet", "Vision is checking"], checked: ["amber", "waiting for your yes"], approved: ["green", "approved"] };
  function DestructionCard({ d, dist, onReview }) {
    const [tone, label] = DSTATE[d.status] || [void 0, d.status];
    const body = {
      requested: `${dist.name} is asked to destroy the ${fmt.num(d.units)} packs at ${dist.godown} through an authorised agency, and to send two photos and its certificate.`,
      asked: `You asked ${dist.short} again${d.reason ? `: ${d.reason}` : ""}.`,
      reading: "Vision is reading the batch, the count and the slate off the photos.",
      checked: `${dist.short} sent the evidence: ${d.agency ? d.agency.name : "the agency"}, certificate ${d.certificate}. Vision checked it.`,
      approved: `Approved${d.approvedBy && D.PEOPLE[d.approvedBy] ? ` by ${D.PEOPLE[d.approvedBy].short}` : ""}: the credit note and the agency's certificate are issued.`
    }[d.status];
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: cx("icontile", tone === "amber" && "amber"), style: { borderRadius: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: "recycle", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Destruction at the godown")), /* @__PURE__ */ React.createElement(Badge, { tone, dot: d.status !== "approved", live: d.status === "reading", icon: d.status === "approved" ? "check" : void 0 }, label)), d.photos && /* @__PURE__ */ React.createElement("div", { className: "dz-two dz-pair" }, ["before", "after"].map((w) => /* @__PURE__ */ React.createElement("div", { key: w, className: "cam dz-cam" }, /* @__PURE__ */ React.createElement(S.Photo, { className: "cam-feed whole", src: evidenceSrc(storyOf().batch.id, w, d), alt: w === "before" ? "The packs at the godown, the batch label in view" : "The packs slit open at the landfill, the slate in view" }), /* @__PURE__ */ React.createElement("span", { className: "cam-tag" }, w === "before" ? "Before" : "After")))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, body), d.status === "checked" && /* @__PURE__ */ React.createElement(Button, { variant: "approve", icon: "check", onClick: onReview }, "Review and approve"));
  }
  const SIGN_ORDER = ["officer", "w1", "w2", "handed"];
  function SignedCertificate({ d, dist, sku, batch }) {
    const doc = window.SC3_LEDGER.draftCertificate(d), first = d.signatures && SIGN_ORDER.map((k) => d.signatures[k] && d.signatures[k].at).filter(Boolean);
    const place = (k, w) => w && w.ink ? /* @__PURE__ */ React.createElement("span", { className: "dz-signed" }, /* @__PURE__ */ React.createElement(S.Ink, { who: w, seal: k === "officer" ? doc.seal : null, h: k === "handed" ? 34 : 40, play: true, delay: 0.3 + SIGN_ORDER.indexOf(k) * 0.25 }), /* @__PURE__ */ React.createElement("span", { className: "cert-when" }, w.ink.typed ? "typed" : "signed", " ", w.ink.at.length > 5 ? w.ink.at.slice(11, 16) : w.ink.at)) : /* @__PURE__ */ React.createElement("span", { className: "sig-none" }, "not signed");
    return /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "The certificate, as signed at the facility"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Each signed in their own place", first && first.length ? `, ${first[0].slice(-5)} to ${first[first.length - 1].slice(-5)}` : "", " on ", fmt.date(D.story().expiryDay)), /* @__PURE__ */ React.createElement("div", { className: "dz-signedpaper" }, /* @__PURE__ */ React.createElement("div", { className: "dz-zoom" }, /* @__PURE__ */ React.createElement(S.Certificate, { d: doc, c: { dist, sku, batch }, draft: { stamp: "SIGNED", place } }))));
  }
  function DestructionSheet({ open, onClose, d, x, dist, sku, batch }) {
    const [asking, setAsking] = useState(false);
    const [why, setWhy] = useState("");
    const signed = !!(d && d.signatures && SIGN_ORDER.every((k) => d.signatures[k]));
    const C = D.CLIENT.short, live = S.useLive();
    const close = () => {
      onClose();
      setAsking(false);
      setWhy("");
    };
    const act = (name, arg) => {
      if (live && live.destruction) live.destruction(name, arg);
      else Flow.act(name, arg);
      close();
    };
    const footer = asking ? /* @__PURE__ */ React.createElement("div", { className: "dz-foot" }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "lg", onClick: () => setAsking(false) }, "Back"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, icon: "send", disabled: !why.trim(), action: () => act("askDestructionAgain", why.trim()), busy: "Asking again…" }, "Ask ", dist.short, " again")) : /* @__PURE__ */ React.createElement("div", { className: "dz-foot" }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", icon: "rotate-ccw", onClick: () => setAsking(true) }, "Ask again"), /* @__PURE__ */ React.createElement(Button, { variant: "approve", size: "lg", block: true, icon: "check", action: () => act("approveDestruction"), busy: "Approving…", done: "Approved" }, "Approve · issue the papers"));
    const at = (w) => d.photos && d.photos[w] && d.photos[w].at ? ` · ${String(d.photos[w].at).slice(-5)}` : "";
    return /* @__PURE__ */ React.createElement(Sheet, { open, onClose: close, title: "Approve the destruction", footer: d && d.status === "checked" ? footer : null }, d && /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: 44, alt: "" }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, sku.name, " · ", fmt.num(d.units), " packs"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, "Batch ", /* @__PURE__ */ React.createElement("span", { className: "mono" }, batch.id), " · expired at ", dist.godown, " · sent by ", dist.name))), /* @__PURE__ */ React.createElement("div", { className: "dz-two dz-pair" }, ["before", "after"].map((w) => /* @__PURE__ */ React.createElement("div", { key: w, className: "cam dz-cam" }, /* @__PURE__ */ React.createElement(S.Photo, { className: "cam-feed whole", src: evidenceSrc(batch.id, w, d), alt: w === "before" ? "The packs at the godown, the batch label in view" : "The packs slit open at the landfill, the slate in view" }), /* @__PURE__ */ React.createElement("span", { className: "cam-tag" }, w === "before" ? "Before" : "After", at(w))))), signed && /* @__PURE__ */ React.createElement(SignedCertificate, { d, dist, sku, batch }), asking ? /* @__PURE__ */ React.createElement(K.Field, { label: `What ${dist.short} should send again`, htmlFor: "dz-why" }, /* @__PURE__ */ React.createElement(K.Textarea, { id: "dz-why", rows: 3, value: why, onChange: (e) => setWhy(e.target.value), placeholder: "The batch label is not readable in the before photo" })) : /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, possessive("Vision"), " checks"), (d.checks || []).map((ck) => /* @__PURE__ */ React.createElement("div", { key: ck.id, className: "row tight t-subhead dz-check" }, /* @__PURE__ */ React.createElement(Icon, { name: ck.ok ? "circle-check" : "circle-alert", size: 16, className: ck.ok ? "dz-ok" : "dz-warn" }), ck.label)), d.agency && /* @__PURE__ */ React.createElement("div", { className: "row tight t-subhead dz-check" }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-check", size: 16, className: "dz-ok" }), d.agency.name, " is on ", possessive(C), " list (authorisation ", d.agency.auth, ") · certificate ", d.certificate), signed && /* @__PURE__ */ React.createElement("div", { className: "row tight t-subhead dz-check" }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-check", size: 16, className: "dz-ok" }), "Four signatures on the certificate: the officer, both witnesses and ", dist.signatory ? dist.signatory.name.split(" ").find((w) => w.replace(".", "").length > 1) || dist.signatory.name : dist.short)), x && /* @__PURE__ */ React.createElement("div", { className: "stack tight dz-yes" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "On your yes"), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: `Expiry credit note to ${dist.name}`, sub: `${fmt.num(x.units)} × ₹${sku.dp} + ${fmt.inr2(x.gst || 0)} GST he reverses + ${fmt.inr2(x.charges || 0)} destruction`, value: /* @__PURE__ */ React.createElement("span", { className: "tnum" }, fmt.inr2(x.amount)) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Destruction certificate", sub: `${d.agency ? d.agency.name : "the agency"}, ${d.certificate || ""}`, value: /* @__PURE__ */ React.createElement("span", { className: "tnum" }, fmt.num(d.units), " packs") }), /* @__PURE__ */ React.createElement(ListRow, { title: `${possessive(C)} input GST`, sub: `the packs were ${possessive(dist.name)} stock`, value: "kept" }))))));
  }
  const lotPrice = (p) => "₹" + (Number.isInteger(p) ? p : p.toFixed(2));
  const andList = (a) => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  function ApiCall({ lead, label = "The API call", children }) {
    const [open, setOpen] = useState(false);
    return /* @__PURE__ */ React.createElement("div", { className: "xcall" }, /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 8 } }, lead, /* @__PURE__ */ React.createElement("button", { type: "button", className: "xcall-btn", "aria-expanded": open, onClick: () => setOpen((o) => !o) }, /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 15, stroke: 2.2 }), label)), open && /* @__PURE__ */ React.createElement("div", { className: "xcall-body stack tight" }, children));
  }
  const OFFER_HOURS = 48;
  const hhmm = (t) => {
    const m = /(\d{1,2}):(\d{2})$/.exec(t || "");
    return m ? +m[1] + m[2] / 60 : null;
  };
  const windowShare = (from, to) => {
    const a = hhmm(from), b = hhmm(to);
    return a != null && b != null && b >= a ? Math.min(1, (b - a) / OFFER_HOURS) : null;
  };
  function SchemeCard({ h, line, lot = 0, sku, batch, dist, shops, kiranas, push, vanDate, children }) {
    const sent = !!h.offer, ordered = h.orders.length, units = h.orders.reduce((t, o) => t + o.units, 0);
    const filled = sent && units >= line.units, closed = sent && (h.offer.status === "closed" || filled);
    const last = h.orders[h.orders.length - 1];
    const closedAt = closed ? h.offer.closedAt || (filled && last ? last.at : h.offer.closesAt) : null;
    const left = line.units - units, delivered = h.van.status === "done";
    const moved = !!h.listing && h.listing.units > lot;
    const elapsed = !sent ? 0 : h.offer.elapsed != null ? h.offer.elapsed : closed ? filled ? windowShare(h.offer.at, closedAt) || 0 : 1 : 0;
    const badge = !sent ? /* @__PURE__ */ React.createElement(Badge, null, "queued") : delivered ? /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "delivered") : filled ? /* @__PURE__ */ React.createElement(Badge, { tone: "green", dot: true }, "filled") : closed ? /* @__PURE__ */ React.createElement(Badge, { icon: "hourglass" }, "window over") : /* @__PURE__ */ React.createElement(Badge, { tone: "blue", dot: true, live: true }, "open");
    const result = !closed ? null : delivered ? `Delivered on ${possessive(dist.name.split(" ")[0])} van round, ${vanDate}: ${fmt.num(units)} packets to ${ordered} shops.` : filled ? `Filled at ${closedAt}: ${ordered} of ${shops} shops took every packet, before the window closed.` : `The window ended ${closedAt} with ${ordered} of ${shops} shops ordering ${fmt.num(units)}; the ${fmt.num(left)} left ${moved ? "moved to ExpireSoon" : `stayed at ${possessive(dist.name)} godown`}.`;
    const steps = [["Sent", sent && h.offer.at], ["First order", h.orders[0] && h.orders[0].at], ["Closed", closedAt], ["Van round", delivered && vanDate]];
    const done = !sent ? 0 : delivered ? 4 : closed ? 3 : ordered ? 2 : 1;
    const nowAt = !sent || delivered ? -1 : done;
    const bb = fmt.date(batch.bestBefore);
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Aura, { on: sent && !closed, className: "icontile", style: { borderRadius: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: "send", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Outreach · ", shops, " kiranas")), badge), !sent && /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Sending the scheme to ", shops, " kiranas now, in ", possessive(dist.name), " name."), /* @__PURE__ */ React.createElement("div", { className: "ks", role: "group", "aria-label": "The scheme as the shops see it" }, /* @__PURE__ */ React.createElement("div", { className: "ks-top" }, /* @__PURE__ */ React.createElement("span", { className: "ks-logo", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "store", size: 13, stroke: 2.2 })), /* @__PURE__ */ React.createElement("span", { className: "ks-word" }, "The scheme"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "as the shops see it"), /* @__PURE__ */ React.createElement("span", { className: "ks-win" }, OFFER_HOURS, "-hour window")), /* @__PURE__ */ React.createElement("div", { className: "ks-lot" }, /* @__PURE__ */ React.createElement("span", { className: "ks-thumb" }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: 50 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 3, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, sku.brand, " ", sku.name, " · ", fmt.num(line.units), " packets"), /* @__PURE__ */ React.createElement("span", { className: "ks-price" }, /* @__PURE__ */ React.createElement("span", { className: "ks-big" }, "₹", line.packPrice.toFixed(2)), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "a pack · ", M.RULES.scheme.free, " free with every ", M.RULES.scheme.buy, " · ₹", line.price.toFixed(2), " effective")), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "ks-date" }, "Best before ", bb, " · ", batch.daysLeft, " days")), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "From ", dist.name, ", ", dist.city, " · each shop up to ", M.RULES.shopCapTimes, "× its ", M.RULES.kiranaWindowDays, "-day sales"))), result && /* @__PURE__ */ React.createElement("div", { className: "ks-result" }, /* @__PURE__ */ React.createElement(Icon, { name: filled || delivered ? "badge-check" : "hourglass", size: 17 }), /* @__PURE__ */ React.createElement("span", null, result))), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 18 } }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "num m" }, /* @__PURE__ */ React.createElement(Roll, { value: ordered }), /* @__PURE__ */ React.createElement("span", { className: "subtle", style: { fontSize: "0.45em" } }, " / ", shops)), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "kiranas ordered")), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "num m" }, /* @__PURE__ */ React.createElement(Roll, { value: units }), /* @__PURE__ */ React.createElement("span", { className: "subtle", style: { fontSize: "0.45em" } }, " / ", line.units)), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "packets"))), /* @__PURE__ */ React.createElement("div", { className: "kwin", "aria-label": "The offer window" }, /* @__PURE__ */ React.createElement("div", { className: "kwin-head" }, /* @__PURE__ */ React.createElement("span", null, "Offer window · ", /* @__PURE__ */ React.createElement("b", null, OFFER_HOURS, " h")), /* @__PURE__ */ React.createElement("span", null, !sent ? "opens when the push goes out" : !closed ? /* @__PURE__ */ React.createElement(React.Fragment, null, "closes ", /* @__PURE__ */ React.createElement("b", null, h.offer.closesAt)) : filled ? /* @__PURE__ */ React.createElement(React.Fragment, null, "filled at ", /* @__PURE__ */ React.createElement("b", null, closedAt), " · closed early") : /* @__PURE__ */ React.createElement(React.Fragment, null, "ended ", /* @__PURE__ */ React.createElement("b", null, closedAt)))), /* @__PURE__ */ React.createElement("div", { className: "kwin-bar" }, /* @__PURE__ */ React.createElement("i", { className: cx(filled && "filled", closed && !filled && "over"), style: { width: elapsed * 100 + "%" } }), closed && /* @__PURE__ */ React.createElement("s", { style: { left: elapsed * 100 + "%" } })), /* @__PURE__ */ React.createElement("div", { className: "kwin-ticks", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", null, sent ? h.offer.at : "—"), /* @__PURE__ */ React.createElement("span", null, OFFER_HOURS / 2, " h"), /* @__PURE__ */ React.createElement("span", null, OFFER_HOURS, " h"))), /* @__PURE__ */ React.createElement("ol", { className: "esl-steps green", "aria-label": "Where the scheme stands" }, steps.map(([k, t], i) => {
      const d = done > i && !!t;
      const now = i === nowAt;
      return /* @__PURE__ */ React.createElement("li", { key: k, className: cx(d && "done", now && "now"), "aria-current": now ? "step" : void 0 }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("b", null, k), /* @__PURE__ */ React.createElement("span", null, d ? t : now ? "waiting" : " "));
    })), children, /* @__PURE__ */ React.createElement(ClusterMap, { kiranas, total: shops, godown: dist.godown.split(" ")[0], orderedCount: ordered, route: true, height: 200 }), /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, h.orders.slice(-3).reverse().map((o) => {
      const k = kiranas.find((x) => x.id === o.id) || window.SC3_WORLD.KIRANAS.find((x) => x.id === o.id);
      return /* @__PURE__ */ React.createElement("div", { key: o.id, className: "row between t-subhead" }, /* @__PURE__ */ React.createElement("span", null, k.name, " ", /* @__PURE__ */ React.createElement("span", { className: "subtle t-footnote" }, k.area)), /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, o.units, " ", /* @__PURE__ */ React.createElement("span", { className: "subtle t-caption" }, o.at)));
    }), !ordered && /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Orders arrive as shops tap the offer. No shop can order more than ", M.RULES.shopCapTimes, "× its own ", M.RULES.kiranaWindowDays, "-day sales.")), /* @__PURE__ */ React.createElement(ApiCall, { label: "The push, as sent" }, /* @__PURE__ */ React.createElement("div", { className: "kpush" }, /* @__PURE__ */ React.createElement(K.Mark, { size: 28 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "hi t-subhead", lang: "hi" }, push.body.replace(kiranas[0].name, "{shop}")), /* @__PURE__ */ React.createElement("small", null, push.en, " · one message to all ", shops, " shops, each with its own name, in Hindi.")))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "A shop that says Not this time keeps its ", OFFER_HOURS, " hours to change its mind. What no shop takes moves to ExpireSoon when the window ends."));
  }
  function ListerCard({ h, lot, sku, batch, dist, buyer, reserve, client, territories, req, res, onOpen }) {
    const ended = !!h.listing && h.listing.status === "ended";
    const last = h.bids[h.bids.length - 1];
    const st = !h.listing ? 0 : h.truck.status === "dispatched" ? 4 : h.award ? 3 : h.bids.length ? 2 : 1;
    const label = st === 4 ? "collected" : ended ? "ended unsold" : h.award ? "awarded" : last ? last.status === "placed" ? "bid in" : "countered" : "live";
    const badge = !h.listing ? /* @__PURE__ */ React.createElement(Badge, null, "queued") : st === 4 ? /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "collected") : ended ? /* @__PURE__ */ React.createElement(Badge, null, label) : /* @__PURE__ */ React.createElement(Badge, { tone: h.award ? "green" : "violet", dot: true, live: label === "live" }, label);
    const steps = [["Listed", h.listing && h.listing.at], ["Bid", h.bids[0] && h.bids[0].at], ["Won", h.award && h.award.at], ["Collected", h.truck.status === "dispatched" && h.truck.at]];
    const nowAt = st >= 1 && st <= 3 && !ended ? st : -1;
    const cities = territories.map((d) => d.city), pins = territories.flatMap((d) => d.pins.split(/,\s*/));
    const per = sku.perCarton || 24, rest = lot.units % per, off = Math.round((1 - lot.price / sku.mrp) * 100);
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Aura, { on: !h.listing, className: "icontile violet", style: { borderRadius: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: "shopping-bag", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Lister · ExpireSoon")), badge), !h.listing && /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Posting the lot now, in ", possessive(dist.name), " name, with the label photo and dates."), /* @__PURE__ */ React.createElement("div", { className: "esl", role: "group", "aria-label": "The lot as buyers see it on ExpireSoon" }, /* @__PURE__ */ React.createElement("div", { className: "esl-top" }, /* @__PURE__ */ React.createElement("span", { className: "es-logo", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Icon, { name: "hourglass", size: 13, stroke: 2.2 })), /* @__PURE__ */ React.createElement("span", { className: "es-word" }, "ExpireSoon"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "as buyers see it"), /* @__PURE__ */ React.createElement("span", { className: "esl-id" }, h.listing ? h.listing.id : "not posted yet")), /* @__PURE__ */ React.createElement("div", { className: "esl-lot" }, /* @__PURE__ */ React.createElement("span", { className: "esl-thumb" }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: 58 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 3 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, sku.brand, " ", sku.name, " · ", fmt.num(lot.units), " units"), /* @__PURE__ */ React.createElement("span", { className: "esl-price" }, /* @__PURE__ */ React.createElement("span", { className: "es-price" }, lotPrice(lot.price)), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "a packet · ", /* @__PURE__ */ React.createElement("s", null, "MRP ", lotPrice(sku.mrp)), " · ", off, "% off")), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "es-date" }, "Best before ", fmt.date(batch.bestBefore), " · ", batch.daysLeft, " days")), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Sold by ", dist.name, ", ", dist.city, " · ", Math.floor(lot.units / per), " cartons", rest ? ` + ${rest}` : ""))), h.award && /* @__PURE__ */ React.createElement("div", { className: "esl-won" }, /* @__PURE__ */ React.createElement(Icon, { name: "badge-check", size: 17 }), /* @__PURE__ */ React.createElement("span", null, "Won by ", /* @__PURE__ */ React.createElement("b", null, h.award.buyer, buyer && buyer.name === h.award.buyer ? `, ${buyer.city}` : ""), " at ", /* @__PURE__ */ React.createElement("b", { className: "tnum" }, "₹", h.award.price.toFixed(2)), " · ", fmt.inr(h.award.token), " token paid")), ended && /* @__PURE__ */ React.createElement("div", { className: "esl-won" }, /* @__PURE__ */ React.createElement(Icon, { name: "hourglass", size: 17 }), /* @__PURE__ */ React.createElement("span", null, "Ended unsold on its deadline."))), /* @__PURE__ */ React.createElement("div", { className: "priv" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Only ", client, " sees"), /* @__PURE__ */ React.createElement("div", { className: "priv-row" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 16 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "Reserve ₹", reserve.toFixed(2)), " a packet. The Negotiator counters any bid under it; buyers never see it.")), /* @__PURE__ */ React.createElement("div", { className: "priv-row" }, /* @__PURE__ */ React.createElement(Icon, { name: "eye-off", size: 16 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "Hidden in ", territories.length, " territories:"), " ", andList(cities), " (", pins.length, " pincode areas), so the lot never undercuts a ", client, " distributor."))), /* @__PURE__ */ React.createElement("ol", { className: "esl-steps", "aria-label": "Where the lot stands" }, steps.map(([k, t], i) => {
      const done = st > i && !!t;
      const now = i === nowAt;
      return /* @__PURE__ */ React.createElement("li", { key: k, className: cx(done && "done", now && "now"), "aria-current": now ? "step" : void 0 }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("b", null, k), /* @__PURE__ */ React.createElement("span", null, done ? t : now ? "waiting" : " "));
    })), /* @__PURE__ */ React.createElement(ApiCall, { lead: h.listing && /* @__PURE__ */ React.createElement(Button, { variant: "outline", icon: "external-link", onClick: onOpen }, "Open on ExpireSoon") }, /* @__PURE__ */ React.createElement(CodeBlock, { code: req, label: "ExpireSoon request" }), h.listing && /* @__PURE__ */ React.createElement(CodeBlock, { code: res, label: "ExpireSoon response" })), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "The marketplace is mocked: ExpireSoon's partner API is in talks, and the calls are what it would answer."));
  }
  function Execution({ me, onOpenListing }) {
    const s = useStore();
    const h = s.hero;
    const app = useApp();
    const hm = heroModel(s);
    const [sheet, setSheet] = useState(false);
    const [dz, setDz] = useState(false);
    const started = ["approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    const units = h.orders.reduce((t, o) => t + o.units, 0);
    const lastBid = h.bids[h.bids.length - 1];
    const C = storyOf(s), P = C.plan, KL = C.KL, ES = C.ES, DN = C.donation;
    const ML = (id) => (DN ? DN.plan : P).lines.find((l) => l.id === id) || { units: 0 };
    const hasLine = (id) => P.lines.some((l) => l.id === id && l.units > 0);
    const esRow = P.rows.find((r) => r.id === "expiresoon");
    const pins = Object.values(D.DISTRIBUTORS).flatMap((d) => d.pins.split(/,\s*/)).map((p) => `"${p}"`).join(", ");
    const req = ES ? `POST /v1/listings
{
  "seller": "${C.dist.name}, ${C.dist.city}",
  "on_behalf": "one-time permission · inside Munchly floors",
  "sku": "${C.sku.code}",
  "batch": "${C.batch.id}",
  "units": ${ES.units},
  "price": ${ES.price.toFixed(2)},
  "reserve": 13.50,
  "mrp": ${C.sku.mrp.toFixed(2)},
  "best_before": "${C.batch.bestBefore}",
  "hide_from_pincodes": [${pins}],
  "label_photo": "gs://smart-clearance/labels/${C.batch.id}.jpg"
}` : "";
    const res = h.listing ? `HTTP/1.1 201 Created
{
  "id": "${C.listing.id}",
  "status": "${h.listing.status}",
  "url": "${C.listing.url}"
}` : "";
    const agents = [hasLine("expiresoon"), hasLine("kirana"), hasLine("expiresoon"), !!DN].filter(Boolean).length;
    const kirana = personOf(C, C.accounts.kirana), holder = personOf(C, C.accounts.distributor);
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Execution", sub: `${C.batch.id} · day 0 to 14 · ${AGENTS[agents]}`, back: "Route Room" }, !started ? /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "sparkles", title: "Nothing is executing yet", body: "Listing, outreach, negotiation and the food-bank booking start the moment the plan is approved." })) : /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 340,
        main: /* @__PURE__ */ React.createElement("div", { className: "exec-cards" }, hasLine("expiresoon") ? /* @__PURE__ */ React.createElement(ListerCard, { h, lot: ES, sku: C.sku, batch: C.batch, dist: C.dist, buyer: D.BUYER, reserve: h.listing ? h.listing.reserve : 13.5, client: D.WORKSPACE.short, territories: Object.values(D.DISTRIBUTORS), req, res, onOpen: () => onOpenListing ? onOpenListing() : setSheet(true) }) : /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "icontile gray", style: { borderRadius: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: "shopping-bag", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Lister · ExpireSoon")), /* @__PURE__ */ React.createElement(Badge, null, "not in this plan")), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, esRow && !esRow.eligible ? `ExpireSoon is left out of this plan (${esRow.reason}).` : "The Router gave ExpireSoon nothing: the other exits pay more a unit.", " The Lister has nothing to list.")), hasLine("kirana") && /* @__PURE__ */ React.createElement(SchemeCard, { h, line: KL, lot: ML("expiresoon").units, sku: C.sku, batch: C.batch, dist: C.dist, shops: C.offered, kiranas: C.kiranas, push: C.push.offer, vanDate: C.journey.van.date }, h.offer && !h.orders.some((o) => o.id === C.shop) && /* @__PURE__ */ React.createElement(S.PlayAs, { who: C.accounts.kirana, route: "offer" }, `Order as ${kirana.short}`)), hasLine("expiresoon") && /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Aura, { on: !!lastBid && lastBid.status === "placed", className: "icontile gray", style: { borderRadius: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: "messages-square", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Negotiator")), h.award ? /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "awarded · ₹", C.counter.price.toFixed(2)) : /* @__PURE__ */ React.createElement(Badge, null, "reserve ₹13.50 · hidden")), h.chat.length ? /* @__PURE__ */ React.createElement(Chat, { chat: h.chat, typing: lastBid && lastBid.status === "placed" }) : /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Waiting for a bid from outside Munchly's territories. The agent counters anything under the reserve and promises only what ", holder.short.split(" ")[0], "'s calendar can keep."), h.listing && !h.award && (!lastBid || lastBid.status === "countered") && /* @__PURE__ */ React.createElement(S.PlayAs, { who: "agrawal", route: "listing" }, lastBid ? "Answer the counter as Agrawal ji" : "Bid as Agrawal ji on ExpireSoon"), h.award && /* @__PURE__ */ React.createElement(List, null, [["ExpireSoon, planned", `${ES.units} × ₹${ES.price.toFixed(2)}`, fmt.inr(C.actual.esPlanned)], ["ExpireSoon, actual", `${ES.units} × ₹${C.counter.price.toFixed(2)}`, fmt.inr(C.actual.esActual)], ["Net, planned", "", fmt.inr(P.net)], ["Net, actual", `−${fmt.inr(C.actual.delta)} on the counter`, fmt.inr(C.actual.net)]].map(([k, sub, val]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, title: k, sub: sub || void 0, value: /* @__PURE__ */ React.createElement("span", { className: "tnum strong" }, val) }))), h.award && /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "badge-check" }, "Token ", fmt.inr(C.award.token), " received · balance ", fmt.inr(C.award.balance), " plus IGST in ", D.MARKET.balanceHours, " h"), h.award && all(h, C) && h.truck.status !== "dispatched" && /* @__PURE__ */ React.createElement(S.PlayAs, { who: C.accounts.distributor, route: "van" }, `Load the buyer's truck as ${holder.short}`)), DN && /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Aura, { on: !s.mango.donation, className: "icontile red", style: { borderRadius: 9 } }, /* @__PURE__ */ React.createElement(Icon, { name: "heart-handshake", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Donation · ", noun(DN.sku))), s.mango.donation ? /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, s.mango.donation === "collected" ? "collected" : s.mango.donation === "confirmed" ? "pickup confirmed" : "pickup booked") : /* @__PURE__ */ React.createElement(Badge, null, "matching partners")), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Product, { name: DN.sku.img, size: 72 }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("b", null, DN.batch.id, " · ", DN.batch.daysLeft, " days left"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, DN.dist.name, ", ", DN.dist.city, ": ", fmt.num(ML("kirana").units), " packs to her kiranas, ", ML("staff").units, " to her staff sale, ", DN.units, " left for a food bank. Too few days for ExpireSoon."))), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { icon: "circle-check", title: "Feeding India", sub: `15+ days, 50+ units · ${D.SETUP.partners[0].pickup}`, value: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green" }, "matches") }), /* @__PURE__ */ React.createElement(ListRow, { icon: "circle-x", iconTone: "gray", title: "India FoodBanking Network", sub: "needs 21+ days and 100+ units", value: /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, DN.units, " units") })), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "The GST credit on donated packs is reversed: section 17(5)(h) blocks it on gifts, and since 1 October 2023 section 17(5)(fa) blocks it on CSR donations too."), s.mango.donation === "booked" && /* @__PURE__ */ React.createElement(S.PlayAs, { who: C.accounts.foodbank, route: "pickups" }, "Confirm as Meera"), s.mango.donation === "confirmed" && s.mango.id === h.id && /* @__PURE__ */ React.createElement(S.PlayAs, { who: C.accounts.foodbank, route: "pickups" }, "Collect as Meera")), hasLine("staff") && /* @__PURE__ */ React.createElement(StaffOps, { staff: h.staff, line: P.lines.find((l) => l.id === "staff"), dist: C.dist, batch: C.batch.id }), h.staff && h.staff.status === "open" && /* @__PURE__ */ React.createElement(S.PlayAs, { who: C.accounts.distributor, route: "van" }, `Record the staff sale as ${holder.short}`), h.realised && h.realised.godown > 0 && ["dispatched", "settled", "cleared"].includes(h.phase) && /* @__PURE__ */ React.createElement(GodownLeft, { realised: h.realised, plan: P, actual: C.actual.net, dist: C.dist }), h.expiry && h.expiry.units > 0 && /* @__PURE__ */ React.createElement(ExpirySettlement, { settle: h.expiry, dist: C.dist }), h.destruction && /* @__PURE__ */ React.createElement(DestructionCard, { d: h.destruction, dist: C.dist, onReview: () => setDz(true) })),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, null, "Agent timeline"), /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(AgentFeed, { events: s.feed.filter((e) => ["approve", "execute", "settle", "report"].includes(e.stage)), people: C.people, live: hm.agentLive ? s.feed.filter((e) => ["approve", "execute", "settle", "report"].includes(e.stage)).length - 1 : -1 })))
      }
    ), /* @__PURE__ */ React.createElement(Sheet, { open: sheet, onClose: () => setSheet(false), title: "ExpireSoon · as buyers see it" }, window.SC3_SCREENS.ListingView ? React.createElement(window.SC3_SCREENS.ListingView, { readOnly: true }) : null), /* @__PURE__ */ React.createElement(DestructionSheet, { open: dz && !!h.destruction, onClose: () => setDz(false), d: h.destruction, x: h.expiry, dist: C.dist, sku: C.sku, batch: C.batch }));
  }
  const all = (h, C) => h.orders.length === C.kiranas.length;
  const BATCH_PARTS = [
    { id: "journey", label: "Journey", short: "Journey", icon: "radar", from: 1, to: 1, ahead: "" },
    { id: "route", label: "Route Room", short: "Route", icon: "route", from: 2, to: 5, ahead: "from Verify" },
    { id: "execution", label: "Execution", short: "Execution", icon: "activity", from: 6, to: 6, ahead: "starts on approval" },
    { id: "paperwork", label: "Paperwork", short: "Papers", icon: "file-text", from: 7, to: 7, ahead: "after the lines close" },
    // the batch's record (SC-142): open at every stop, like its Journey
    { id: "record", label: "Record", short: "Record", icon: "history", from: 99, to: 99, ahead: "" }
  ];
  const BATCH_PART_IDS = BATCH_PARTS.map((p) => p.id);
  const stopOf = (it) => it.current >= 0 ? it.current : 9;
  const partAt = (it) => it ? (BATCH_PARTS.find((p) => p.id !== "journey" && stopOf(it) >= p.from && stopOf(it) <= p.to) || BATCH_PARTS[0]).id : "journey";
  function partState(it, p) {
    if (p.id === "journey" || p.id === "record") return {};
    if (p.id === partAt(it)) return { here: true, human: it.human, words: it.human ? "needs your yes" : "where the batch is" };
    return stopOf(it) < p.from ? { ahead: true, words: p.ahead } : { done: true, words: "done" };
  }
  const shortName = (sku) => sku.name.replace(/\s+\d+(\.\d+)?\s?(g|ml|kg|l)$/i, "");
  function journeyItems(s, live) {
    const hm = heroModel(s);
    const stage = D.STAGES[hm.current];
    const items = live && S.Live ? S.Live.flaggedItems(s, live) : [{ ref: storyOf(s).batch.id, hero: true, view: hm.view, done: hm.done, current: hm.current, stop: stage ? stage.title : "Cleared", human: !!(stage && stage.human) }];
    return items.filter((it) => !it.hero || s.hero.phase !== "watching");
  }
  function viewOf(s, ref, live) {
    const b = storyOf(s).batches.find((x) => x.id === ref);
    if (!b) return null;
    if (b.hero) return heroModel(s).view;
    const v = D.batchView(b);
    if (b.second && !live) v.phase = "executing";
    return v;
  }
  function stateOf(it, s) {
    if (it.hero) {
      const hm = heroModel(s);
      return { text: hm.eta, tone: hm.etaTone, live: !!hm.agentLive };
    }
    return { text: `Vision is waiting for ${it.view.dist.name}' label photo`, tone: "green", live: true };
  }
  function BatchHead({ it, v, part, onPart }) {
    const s = useStore();
    const app = useApp();
    const phone = app.bp === "phone";
    const live = S.useLive();
    const sku = v.skuObj;
    const st = it && stateOf(it, s);
    return /* @__PURE__ */ React.createElement("div", { className: "bhead" }, /* @__PURE__ */ React.createElement("div", { className: "bh-id" }, /* @__PURE__ */ React.createElement("span", { className: "bh-pic", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: sku.img, size: phone ? 46 : 72, alt: "" })), /* @__PURE__ */ React.createElement("div", { className: "bh-tt" }, /* @__PURE__ */ React.createElement("h1", null, sku.name), /* @__PURE__ */ React.createElement("div", { className: "bh-meta" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, v.id), /* @__PURE__ */ React.createElement("span", { className: "sep", "aria-hidden": "true" }, "·"), /* @__PURE__ */ React.createElement("span", null, v.dist.name, ", ", v.dist.city)), /* @__PURE__ */ React.createElement("div", { className: "bh-meta" }, st ? /* @__PURE__ */ React.createElement(Badge, { tone: st.tone, dot: true, live: st.live }, st.text) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(StatusBadge, { status: v.phase || v.assess.status }), /* @__PURE__ */ React.createElement("span", null, "The Watcher checks it every morning at ", s.rules.watchTime)), live && /* @__PURE__ */ React.createElement(S.Live.Line, null)))), it && /* @__PURE__ */ React.createElement(BatchTabs, { it, part, onPart }));
  }
  function BatchTabs({ it, part, onPart }) {
    const phone = useApp().bp === "phone";
    return /* @__PURE__ */ React.createElement("nav", { className: "bh-tabs", "aria-label": `${it.view.skuObj.name}, ${it.ref}` }, BATCH_PARTS.map((p) => {
      const st = partState(it, p);
      const on = part === p.id;
      return /* @__PURE__ */ React.createElement("button", { key: p.id, type: "button", className: cx("bh-tab", st.ahead && "ahead"), "aria-current": on ? "page" : void 0, onClick: () => onPart(p.id), title: st.words || void 0 }, on && /* @__PURE__ */ React.createElement(motion.span, { layoutId: "bh-tab-thumb", className: "bh-tab-thumb", transition: { type: "spring", stiffness: 500, damping: 40 } }), !phone && /* @__PURE__ */ React.createElement(Icon, { name: p.icon, size: 16 }), /* @__PURE__ */ React.createElement("span", null, phone ? p.short : p.label), st.here && /* @__PURE__ */ React.createElement("i", { className: cx("bh-here", st.human && "human"), "aria-hidden": "true" }), st.words && /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, ", ", st.words));
    }));
  }
  function NotYet({ me, title, icon, head, body }) {
    return /* @__PURE__ */ React.createElement(Screen, { me, title }, /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon, title: head, body })));
  }
  function mangoFeed(v) {
    return [
      { id: "m1", stage: "detect", agent: "Watcher", icon: "radar", at: D.PUSH.detect.at, min: 0, text: `${v.id} fails all three quick-commerce gates; ${fmt.num(v.assess.atRisk)} of ${fmt.num(v.units)} units will not sell by ${fmt.date(v.bestBefore).replace(/ \d{4}$/, "")}.`, calls: [["gates.check", v.assess.gates.map((g) => `${g.app} ${g.has}/${g.need}`).join(" · "), "bad"], ["pubsub.publish", "batch.at_risk", "ok"]] },
      { id: "m2", stage: "verify", agent: "Vision", icon: "scan-line", at: D.PUSH.verify.at, min: 5, text: `Asked ${v.dist.name} for one label photo before quoting any price.`, calls: [["fcm.send", v.dist.name, "ok"]] }
    ];
  }
  function BatchJourney({ me, it, v }) {
    const s = useStore();
    const app = useApp();
    const { go } = useRoute();
    const hm = heroModel(s);
    const h = s.hero;
    const phone = app.bp === "phone";
    const live = S.useLive();
    if (!it) return /* @__PURE__ */ React.createElement(Screen, { me, title: "Journey" }, /* @__PURE__ */ React.createElement(Columns, { sideWidth: 340, main: /* @__PURE__ */ React.createElement(Card, { className: "stack" }, /* @__PURE__ */ React.createElement(BatchFacts, { view: v })), side: /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Every hand-off on this batch, as it happens" }, "Agent activity"), /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "The agents report here once the Watcher flags this batch."))) }));
    const routed = ["approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    const C = storyOf(s), SHOPS = C.kiranas.length;
    let card;
    if (it.hero) {
      const primary = h.phase === "planned" ? /* @__PURE__ */ React.createElement(Button, { variant: "approve", icon: "check", onClick: () => go("route", { ref: it.ref }) }, "Review and approve") : ["approved", "executing"].includes(h.phase) ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: () => go("execution", { ref: it.ref }) }, "Watch execution") : /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: () => go("route", { ref: it.ref }) }, "Open Route Room");
      const money = h.plan ? /* @__PURE__ */ React.createElement(SwingMoney, { C, posted: !!h.posted, phone, label: h.posted ? C.ES ? "recovered, after the negotiation" : "recovered, every line done" : routed ? "on plan · settles day 3–7" : "net recovered on the plan" }) : void 0;
      card = /* @__PURE__ */ React.createElement(TrackerCard, { view: hm.view, done: hm.done, current: hm.current, eta: hm.eta, etaTone: hm.etaTone, agentLive: hm.agentLive, primary, money });
    } else card = /* @__PURE__ */ React.createElement(S.Live.MangoCard, { item: it, dim: !!live && S.Live.down(live.conn) });
    const cluster = it.hero && /* @__PURE__ */ React.createElement(Card, { pad: false, className: "stack", style: { overflow: "hidden", gap: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "card-head", style: { padding: "14px 16px 10px" } }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, v.dist.city, " cluster"), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: hm.ordered ? "green" : void 0, dot: !!hm.ordered }, hm.ordered ? `${hm.ordered} of ${C.offered} kiranas ordered` : h.offer ? `${C.offered} kiranas messaged` : `${C.offered} kiranas`)), /* @__PURE__ */ React.createElement(ClusterMap, { kiranas: C.kiranas, total: C.offered, godown: godownOf(C), orderedCount: hm.ordered, route: routed, vanProgress: h.van.status === "done" ? 1 : hm.ordered / SHOPS * 0.6, height: phone ? 220 : 280 }));
    const events = it.hero ? s.feed : mangoFeed(v);
    const feed = /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Every hand-off on this batch, as it happens" }, "Agent activity"), /* @__PURE__ */ React.createElement(Card, null, events.length ? /* @__PURE__ */ React.createElement(AgentFeed, { events, people: C.people, live: it.hero && hm.agentLive ? s.feed.length - 1 : -1, max: phone ? 4 : 8 }) : /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "The agents report here as they work this batch.")));
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Journey" }, /* @__PURE__ */ React.createElement(Columns, { sideWidth: 340, main: /* @__PURE__ */ React.createElement(React.Fragment, null, card, cluster), side: feed }));
  }
  function BatchRecord({ me, it, v }) {
    const s = useStore();
    const L = window.SC3_LEDGER.record;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Record" }, /* @__PURE__ */ React.createElement(S.RecordTab, { batch: v.id, steps: it.hero ? L.storyRecord(s).steps : [], photos: it.hero ? L.storyPhotos(s) : [] }));
  }
  function BatchPart({ me, it, v, part }) {
    if (it && part === "record") return /* @__PURE__ */ React.createElement(BatchRecord, { me, it, v });
    if (!it || part === "journey") return /* @__PURE__ */ React.createElement(BatchJourney, { me, it, v });
    if (part === "route") return /* @__PURE__ */ React.createElement(RouteRoom, { me });
    if (part === "execution") return it.hero ? /* @__PURE__ */ React.createElement(Execution, { me }) : /* @__PURE__ */ React.createElement(NotYet, { me, title: "Execution", icon: "sparkles", head: "Nothing is executing yet", body: "Listing, outreach, negotiation and the food-bank booking start the moment the plan is approved." });
    return it.hero ? /* @__PURE__ */ React.createElement(S.Paperwork, { me }) : /* @__PURE__ */ React.createElement(NotYet, { me, title: "Paperwork", icon: "file-text", head: "The pack follows the last of its lines", body: `Munchly's price-support credit note, the ITC memo and the FSSAI checklist, drafted by the Paperwork agent once every line of ${it.ref}'s plan is done.` });
  }
  function Batches({ me }) {
    const s = useStore();
    const app = useApp();
    const { go } = useRoute();
    const hm = heroModel(s);
    const views = storyOf(s).batches.map((b) => {
      const v = D.batchView(b);
      if (b.hero) v.phase = hm.view.phase;
      if (b.second) v.phase = "executing";
      return v;
    });
    const live = S.useLive();
    const openRow = (v) => go(partAt(journeyItems(s, live).find((i) => i.ref === v.id)), { ref: v.id });
    const LG = window.SC3_LEDGER, past = LG.HISTORY.map((h) => LG.caseOf(h.ref)).sort((a, z) => a.cleared < z.cleared ? 1 : -1);
    const months = [];
    past.forEach((c) => {
      const m = c.cleared.slice(0, 7);
      let g = months.find((x) => x.m === m);
      if (!g) months.push(g = { m, label: (/* @__PURE__ */ new Date(c.cleared.slice(0, 10) + "T00:00:00+05:30")).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }), items: [] });
      g.items.push(c);
    });
    const phone = app.bp === "phone";
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Batches", sub: "Every lot the Watcher sees, and every batch that has cleared" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement("div", { className: "list-head" }, "In view · from the DMS export"), app.bp === "phone" ? /* @__PURE__ */ React.createElement("div", { className: "list" }, views.map((v) => /* @__PURE__ */ React.createElement(BatchRow, { key: v.id, view: v, compact: true, onOpen: () => openRow(v) }))) : /* @__PURE__ */ React.createElement(DataTable, { label: "Batches", rows: views.map((v) => ({ ...v, name: v.skuObj.name })), onRow: openRow, initialSort: ["daysLeft", "asc"], columns: [
      { key: "name", label: "Product", render: (v) => /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Product, { name: v.skuObj.img, size: 36 }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, v.skuObj.name), /* @__PURE__ */ React.createElement("span", { className: "mono subtle t-caption" }, v.id))) },
      { key: "dist", label: "Distributor", sortValue: (v) => v.dist.name, render: (v) => /* @__PURE__ */ React.createElement("span", null, v.dist.name, /* @__PURE__ */ React.createElement("div", { className: "t-caption subtle" }, v.dist.city)) },
      { key: "daysLeft", label: "Days left", num: true },
      { key: "units", label: "Units", num: true, render: (v) => fmt.num(v.units) },
      { key: "risk", label: "At risk", num: true, sortValue: (v) => v.assess.atRisk, render: (v) => v.assess.atRisk ? /* @__PURE__ */ React.createElement("span", { className: "neg strong" }, fmt.num(v.assess.atRisk)) : "—" },
      { key: "gates", label: "Quick-commerce gates", sortable: false, render: (v) => /* @__PURE__ */ React.createElement(GateChips, { gates: v.assess.gates, size: "sm" }) },
      { key: "status", label: "Status", sortValue: (v) => v.phase || v.assess.status, render: (v) => /* @__PURE__ */ React.createElement(StatusBadge, { status: v.phase || v.assess.status }) }
    ] })), months.map((g) => /* @__PURE__ */ React.createElement(List, { key: g.m, head: `Cleared · ${g.label}` }, g.items.map((c) => {
      const ph = LG.record.photosOf(c), net = LG.rowOf(c).figures.net;
      return /* @__PURE__ */ React.createElement(
        ListRow,
        {
          key: c.ref,
          chevron: true,
          onClick: () => go("report", { ref: c.ref, tab: "record" }),
          leading: /* @__PURE__ */ React.createElement(Product, { name: c.sku.img, size: 40 }),
          title: /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, c.sku.name), /* @__PURE__ */ React.createElement(S.OutcomeBadge, { o: c.outcome, size: "sm" })),
          sub: `${c.ref} · ${c.dist.name} · flagged ${fmt.day(c.flagged)} · cleared ${fmt.day(c.cleared)}${phone ? ` · ${fmt.inr(net)}` : ""}`,
          value: phone ? null : /* @__PURE__ */ React.createElement("span", { className: "row", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("span", { className: "rec-count" }, /* @__PURE__ */ React.createElement(Icon, { name: "camera", size: 15 }), ph.length, " ", ph.length === 1 ? "photo" : "photos"), /* @__PURE__ */ React.createElement("b", { className: "tnum" }, fmt.inr(net)))
        }
      );
    })))));
  }
  function BatchFacts({ view: sel }) {
    const s = useStore();
    const ML = (id) => D.MANGO_PLAN.lines.find((l) => l.id === id) || { units: 0 };
    const next = !sel ? "" : sel.phase === "executing" ? `Routed yesterday: ${fmt.num(ML("kirana").units)} packs to Hyderabad kiranas, ${ML("staff").units} to the staff sale at Lakshmi's godown, ${D.MANGO_FB} to Feeding India.` : sel.phase && sel.phase !== "watching" ? "In a journey: the agents are working it, and its Route Room shows where it stands." : sel.assess.status === "at-risk" ? `At risk: ${fmt.num(sel.assess.atRisk)} packs will not sell before the last week. The Watcher checks every morning at ${s.rules.watchTime}, and flags it once Setup is confirmed and ${sel.dist.name} has given ${D.PLATFORM.name} permission to act.` : sel.assess.status === "gated" ? `Outside at least one quick-commerce gate, but real sell-through clears it in time. The Watcher checks again tomorrow at ${s.rules.watchTime}.` : "Inside every gate and selling through. Nothing to do.";
    return /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Product, { name: sel.skuObj.img, size: 88 }), /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement(DaysNum, { days: sel.daysLeft, life: sel.skuObj.lifeDays, size: "l" }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "days left · best before ", fmt.date(sel.bestBefore)))), /* @__PURE__ */ React.createElement(GateChips, { gates: sel.assess.gates }), /* @__PURE__ */ React.createElement(List, null, [["Batch", sel.id], ["Distributor", `${sel.dist.name}, ${sel.dist.city}`], ["Units", fmt.num(sel.units)], ["Sells", `${sel.sellPerDay} a day`], ["Will sell before the last week", fmt.num(sel.assess.willSell)], ["At risk", sel.assess.atRisk ? fmt.num(sel.assess.atRisk) : "none"]].map(([k, val]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, title: k, value: val }))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted" }, next));
  }
  Object.assign(window.SC3_SCREENS, { Setup, CommandCenter, RouteRoom, Execution, Batches, ApproveSheet, LabelPhoto, LabelShot, Chat, permissionOf, BATCH_PARTS, BATCH_PART_IDS, partAt, journeyItems, viewOf, shortName, BatchHead, BatchPart, BatchFacts });
})();
