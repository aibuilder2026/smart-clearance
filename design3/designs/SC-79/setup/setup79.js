(function() {
  const { useState, useEffect, useMemo, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Segmented, Switch, Stepper, Tabs, Sheet, DataTable, Product, Empty, Progress, Money, Roll, DaysNum, GateChips, Tile, Aura, Tracker, VTracker, AgentFeed, ClusterMap, HaulLine, ChannelBars, MixBar, CodeBlock, TrackerCard, TrackerCompact, BatchRow, ChannelTable, SplitBar, MoneyPanel, StatusBadge, useApp, useNotice } = K;
  const { useStore, useRoute, heroModel, Screen, Columns, SectionTitle, Locked } = S;
  const CH_NAMES = D.SETUP.channelNames;
  const ES = D.PLAN.lines.find((l) => l.id === "expiresoon"), KL = D.PLAN.lines.find((l) => l.id === "kirana");
  const SHOPS = D.KIRANAS.length;
  const Pass = ({ children }) => children;
  const Q79 = new URLSearchParams(location.search);
  const OPT = Q79.get("opt") === "b" ? "b" : "a";
  const MOMENT = ["waiting", "uploading", "mapping", "mapped"].includes(Q79.get("moment")) ? Q79.get("moment") : "waiting";
  const SHOT = Q79.get("shot") === "1";
  const NEXT_RUN = "08:30 tomorrow, Fri 2 Oct";
  function ExportCard({ phase, mapped, done, exp, onChoose, fileRef, pick }) {
    const waiting = phase === "waiting", reading = phase === "mapping";
    const title = mapped ? D.SETUP.dms.file : reading ? exp.name : "No stock export mapped yet";
    const sub = mapped ? "Bizom-style DMS export · 312 batches · 4 distributors" : reading ? "The Data agent is reading its columns" : "The Data agent maps your distributors' first export, then loads 90 days of sell-through";
    const status = done ? /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "Loaded into BigQuery") : mapped ? /* @__PURE__ */ React.createElement(Badge, { dot: true }, "Mapped · confirm below") : reading ? /* @__PURE__ */ React.createElement(Badge, { tone: "blue", dot: true }, "Mapping") : /* @__PURE__ */ React.createElement(Badge, { dot: true }, "Waiting for an export");
    return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight", style: { minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: cx("icontile", !mapped && "soft") }, /* @__PURE__ */ React.createElement(Icon, { name: "file-spreadsheet", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { style: { overflowWrap: "anywhere" } }, title), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, sub))), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, !reading && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: waiting ? "primary" : void 0, icon: "upload", onClick: onChoose }, "Upload an export"), /* @__PURE__ */ React.createElement("input", { ref: fileRef, type: "file", accept: ".csv,text/csv", className: "sr-only", tabIndex: -1, "aria-hidden": "true", onChange: pick })), status)), /* @__PURE__ */ React.createElement("div", { className: "table-wrap", style: { boxShadow: "none" }, tabIndex: 0, role: "region", "aria-label": "Field mapping" }, /* @__PURE__ */ React.createElement("table", { className: "table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Smart-Clearance field"), /* @__PURE__ */ React.createElement("th", null, "Column in your file"), /* @__PURE__ */ React.createElement("th", null, "Status"))), /* @__PURE__ */ React.createElement("tbody", null, D.SETUP.dms.columns.map(([f, c]) => /* @__PURE__ */ React.createElement("tr", { key: f }, /* @__PURE__ */ React.createElement("td", { className: "strong" }, f.replace("_", " ")), /* @__PURE__ */ React.createElement("td", { className: mapped ? "mono" : "subtle" }, mapped ? c : reading ? "reading…" : "not mapped yet"), /* @__PURE__ */ React.createElement("td", null, mapped ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", icon: "check" }, "mapped") : reading ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "blue", dot: true }, "mapping") : /* @__PURE__ */ React.createElement(Badge, { size: "sm", dot: true }, "waiting"))))))), /* @__PURE__ */ React.createElement("div", { className: "row tight t-footnote muted" }, /* @__PURE__ */ React.createElement(Aura, { on: !done && (mapped || reading), className: "icontile soft", style: { width: 26, height: 26, borderRadius: 8 } }, /* @__PURE__ */ React.createElement(Icon, { name: "database", size: 14 })), mapped ? "Data Agent mapped 8 of 8 columns and back-filled 90 days of sell-through by pincode and by shop." : reading ? "Data Agent is matching the file's columns to these fields." : /* @__PURE__ */ React.createElement("span", null, "Upload an export now, or the Data Agent maps the day's export at its run at ", /* @__PURE__ */ React.createElement("b", { className: "tnum" }, NEXT_RUN), ".")));
  }
  function DropZone({ onChoose, fileRef, pick }) {
    const [over, setOver] = useState(false);
    return /* @__PURE__ */ React.createElement(Card, { className: cx("s79-drop", over && "over"), onDragOver: (e) => {
      e.preventDefault();
      setOver(true);
    }, onDragLeave: () => setOver(false), onDrop: (e) => {
      e.preventDefault();
      setOver(false);
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) pick({ target: { files: [f], value: "" } });
    } }, /* @__PURE__ */ React.createElement("span", { className: "icontile soft", style: { width: 44, height: 44, borderRadius: 13 } }, /* @__PURE__ */ React.createElement(Icon, { name: "upload", size: 20, stroke: 2 })), /* @__PURE__ */ React.createElement("b", { className: "t-title3" }, "Your distributors' stock export"), /* @__PURE__ */ React.createElement("span", { className: "t-subhead muted" }, "A CSV from the DMS: batches, best-before dates and stock on hand. The Data agent maps its columns and loads 90 days of sell-through."), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap", style: { justifyContent: "center" } }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "upload", onClick: onChoose }, "Choose a CSV"), /* @__PURE__ */ React.createElement("input", { ref: fileRef, type: "file", accept: ".csv,text/csv", className: "sr-only", tabIndex: -1, "aria-hidden": "true", onChange: pick }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "or drop it here")), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle s79-wait" }, /* @__PURE__ */ React.createElement(Icon, { name: "clock", size: 13, stroke: 2.2 }), /* @__PURE__ */ React.createElement("span", null, "Or wait: the Data agent picks up the day's export at its run at ", /* @__PURE__ */ React.createElement("b", { className: "tnum" }, NEXT_RUN), ".")));
  }
  function Steps({ phase }) {
    const at = phase === "done" ? 3 : phase === "mapped" ? 2 : phase === "waiting" ? 0 : 1;
    const steps = [["Your stock export", "upload one, or wait for the 08:30 run"], ["The column mapping", "the Data agent maps it"], ["Rules, then confirm", "the Watcher starts at 09:00"]];
    return /* @__PURE__ */ React.createElement("ol", { className: "s79-steps", "aria-label": "Setting up, in three steps" }, steps.map(([t, sub], i) => /* @__PURE__ */ React.createElement("li", { key: t, className: cx(i < at && "done", i === at && "now"), "aria-current": i === at ? "step" : void 0 }, /* @__PURE__ */ React.createElement("span", { className: "s79-dot", "aria-hidden": "true" }, i < at ? /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 13, stroke: 3 }) : i + 1), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, t), /* @__PURE__ */ React.createElement("span", null, sub)))));
  }
  const FLOOR_ROWS = [["snacks", "Snacks", "chips"], ["biscuits", "Biscuits", "biscuits"], ["staples", "Staples", "poha"], ["beverages", "Beverages", "mango"], ["personal-care", "Personal care", "facewash"]];
  function permissionOf(s, id) {
    if (id === "rakesh") {
      const p = s.setup.permission;
      return p ? p.paused ? { tone: "amber", label: "paused" } : { tone: "green", label: "granted · " + p.at } : { tone: void 0, label: "requested" };
    }
    return D.SETUP.permissions[id] ? { tone: "green", label: "granted · " + D.SETUP.permissions[id] } : { tone: void 0, label: "requested" };
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
    const [phase, setPhase] = useState(MOMENT);
    const [p, setP] = useState(MOMENT === "uploading" ? 0.62 : 0);
    const mapped = done || phase === "mapped";
    const startUpload = (name, size) => {
      setExp({ name, size });
      setPhase("uploading");
      setP(0);
      if (SHOT) return;
      const t0 = performance.now();
      const tick = (now) => {
        const v = Math.min(1, (now - t0) / 2400);
        setP(v);
        if (v < 1) requestAnimationFrame(tick);
        else {
          setPhase("mapping");
          toast({ text: "Export uploaded · the Data agent is mapping its columns", tone: "ok" });
          setTimeout(() => {
            setPhase("mapped");
            toast({ text: "The Data agent mapped 8 of 8 columns", tone: "ok", icon: "database" });
          }, 1800);
        }
      };
      requestAnimationFrame(tick);
    };
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
    const pick = (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      startUpload(f.name, f.size);
    };
    const uploading = phase === "uploading";
    const choose = () => SHOT ? startUpload(D.SETUP.dms.file, 48e5) : fileRef.current && fileRef.current.click();
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Setup", sub: "Connect the stock data once and set the rules the agents must obey" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, OPT === "b" && /* @__PURE__ */ React.createElement(Steps, { phase: done ? "done" : phase }), uploading && /* @__PURE__ */ React.createElement(S.Live.ExportUpload, { name: exp.name, size: exp.size, p, onCancel: () => setPhase("waiting") }), !uploading && (OPT === "b" && phase === "waiting" ? /* @__PURE__ */ React.createElement(DropZone, { onChoose: choose, fileRef, pick }) : /* @__PURE__ */ React.createElement(ExportCard, { phase, mapped, done, exp, onChoose: choose, fileRef, pick })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gap: 20, gridTemplateColumns: app.bp === "desktop" ? "repeat(2, minmax(0,1fr))" : "minmax(0,1fr)", alignItems: "start" } }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement(List, { head: "Floor price by category", foot: "No channel may sell below its category's floor." }, FLOOR_ROWS.map(([k, l, sku]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, title: l, sub: `${fmt.inr2(D.SKUS[sku].mrp * floors[k] / 100)} on a ₹${D.SKUS[sku].mrp} pack`, value: /* @__PURE__ */ React.createElement(Stepper, { value: floors[k], onChange: (v) => setFloors({ ...floors, [k]: v }), min: 20, max: 70, step: 5, label: "Floor for " + l, format: (v) => v + "%" }) }))), /* @__PURE__ */ React.createElement(List, { head: "Territory guard", foot: "ExpireSoon listings are hidden from buyers inside these territories, matched by pincode, so clearance stock never undercuts a Munchly distributor." }, Object.values(D.DISTRIBUTORS).map((d) => /* @__PURE__ */ React.createElement(ListRow, { key: d.id, icon: "map-pin", iconTone: "gray", title: d.territory, sub: `${d.name} · pincodes ${d.pins}…` })), /* @__PURE__ */ React.createElement(ListRow, { title: "Hide listings inside the territories", value: /* @__PURE__ */ React.createElement(Switch, { checked: s.rules.territoryGuard, onChange: () => {
    }, label: "Territory guard" }) })), /* @__PURE__ */ React.createElement(List, { head: "Approval policy", foot: "After that the agents run inside the guardrails and report." }, /* @__PURE__ */ React.createElement(ListRow, { icon: "shield-check", iconTone: "blue", title: "Routes per channel that need a tap", value: /* @__PURE__ */ React.createElement(Stepper, { value: taps, onChange: setTaps, min: 1, max: 50, label: "routes" }) }), /* @__PURE__ */ React.createElement(ListRow, { icon: "ban", iconTone: "red", title: "Personal care never goes to food banks", value: /* @__PURE__ */ React.createElement(Switch, { checked: true, onChange: () => {
    }, label: "Personal care never to food banks" }) }), /* @__PURE__ */ React.createElement(ListRow, { icon: "gift", iconTone: "amber", title: "Premium gift packs never go to a staff sale", value: /* @__PURE__ */ React.createElement(Switch, { checked: true, onChange: () => {
    }, label: "Gift packs never to staff sale" }) }))), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 20 } }, /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "Channel allow-list"), /* @__PURE__ */ React.createElement("div", { className: "table-wrap", style: { boxShadow: "none" }, tabIndex: 0, role: "region", "aria-label": "Channel rules by category" }, /* @__PURE__ */ React.createElement("table", { className: "table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Category"), chans.map((c) => /* @__PURE__ */ React.createElement("th", { key: c, style: { textAlign: "center" } }, CH_NAMES[c])))), /* @__PURE__ */ React.createElement("tbody", null, D.SETUP.allowList.map(([cat, ok]) => /* @__PURE__ */ React.createElement("tr", { key: cat }, /* @__PURE__ */ React.createElement("td", { className: "strong", style: { textTransform: "capitalize" } }, cat.replace("-", " ")), chans.map((c) => /* @__PURE__ */ React.createElement("td", { key: c, style: { textAlign: "center" } }, ok.includes(c) ? /* @__PURE__ */ React.createElement(Icon, { name: "circle-check", size: 18, title: "Allowed", style: { color: "var(--primary-text)", margin: "0 auto" } }) : /* @__PURE__ */ React.createElement(Icon, { name: "circle-x", size: 18, title: "Never", style: { color: "var(--fg-3)", margin: "0 auto" } })))))))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Discount D2C applies only to Munchly's own warehouse stock. A distributor's stock is his, so it never goes to Munchly's own site.")), /* @__PURE__ */ React.createElement(List, { head: "Distributors' one-time permission", foot: "Each distributor lets the agent list his Munchly stock, offer schemes to his kiranas, draft his invoices and book dispatch slots, inside Munchly's floors. He can pause it at any time." }, Object.values(D.DISTRIBUTORS).map((d) => {
      const p2 = permissionOf(s, d.id);
      return /* @__PURE__ */ React.createElement(ListRow, { key: d.id, icon: "handshake", iconTone: p2.tone === "green" ? void 0 : "gray", title: d.name, sub: d.city, value: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: p2.tone, dot: !p2.tone }, p2.label) });
    })), !s.setup.permission && /* @__PURE__ */ React.createElement(S.PlayAs, { who: "rakesh", route: "home" }, "Give the permission as Rakesh bhai"), /* @__PURE__ */ React.createElement(List, { head: "Scheme returns and planning", foot: "The uplift and the van rate are planning assumptions. The return window lets returned packs reach the godown in time for a staff sale or a food bank." }, /* @__PURE__ */ React.createElement(ListRow, { title: "Kiranas may return scheme packs until", sub: `${fmt.day(D.addDays(D.BATCHES[0].bestBefore, -ret))} for this batch`, value: /* @__PURE__ */ React.createElement(Stepper, { value: ret, onChange: setRet, min: 15, max: 30, label: "days before best-before", format: (v) => v + " days before" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Scheme uplift on normal sales", value: /* @__PURE__ */ React.createElement(Stepper, { value: uplift, onChange: (v) => setUplift(Math.round(v * 10) / 10), min: 2, max: 5, step: 0.5, label: "Scheme uplift", format: (v) => v.toFixed(1) + "×" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Van rate, a unit", value: /* @__PURE__ */ React.createElement(Stepper, { value: van, onChange: (v) => setVan(Math.round(v * 100) / 100), min: 0.25, max: 2, step: 0.25, label: "Van rate", format: (v) => "₹" + v.toFixed(2) }) })), /* @__PURE__ */ React.createElement("div", { className: "stack snug" }, D.SETUP.partners.map((p2) => /* @__PURE__ */ React.createElement(Card, { key: p2.name, className: "stack tight" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "icontile red" }, /* @__PURE__ */ React.createElement(Icon, { name: "heart-handshake", size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("b", null, p2.name)), /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "partner")), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, p2.minDays, "+ days left · at least ", p2.minUnits, " units · ", p2.logistics), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, p2.paper)))))), /* @__PURE__ */ React.createElement(Card, { className: "stack snug", style: { background: "var(--surface)" } }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("span", { className: "card-title" }, "The true cost of a write-off"), /* @__PURE__ */ React.createElement(Badge, { tone: "red", icon: "trash-2" }, "shown before any batch is routed")), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10, alignItems: "stretch" } }, [["Stock at cost", chips.cost], ["GST credit reversed", wo.itcPerUnit], ["Disposal", M.RULES.disposalPerUnit], ["EPR, indicative", chips.kgPerUnit * M.RULES.eprPerKg]].map(([k, v], i) => /* @__PURE__ */ React.createElement(Fragment, { key: k }, i > 0 && /* @__PURE__ */ React.createElement("span", { className: "center subtle", style: { fontSize: 20 }, "aria-hidden": "true" }, "+"), /* @__PURE__ */ React.createElement("div", { className: "tile", style: { minWidth: 130, flex: "1 1 130px" } }, /* @__PURE__ */ React.createElement("span", { className: "tl-label" }, k), /* @__PURE__ */ React.createElement("span", { className: "num s neg" }, fmt.inr2(v))))), /* @__PURE__ */ React.createElement("span", { className: "center subtle", style: { fontSize: 20 }, "aria-hidden": "true" }, "="), /* @__PURE__ */ React.createElement("div", { className: "tile", style: { minWidth: 150, flex: "1 1 150px", boxShadow: "0 0 0 1.5px color-mix(in oklab, var(--red) 45%, transparent)" } }, /* @__PURE__ */ React.createElement("span", { className: "tl-label" }, "Destroying, a unit"), /* @__PURE__ */ React.createElement(Money, { value: -wo.perUnit, size: "s", decimals: true, style: { color: "var(--red-text)" } }))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "For Masala Chips 150 g: cost ₹", chips.cost, "; ", fmt.inr2(wo.itcPerUnit), " of input GST a packet from the cost sheet (chips are at ", Math.round(chips.gst * 100), "% GST since GST 2.0); disposal ", fmt.inr2(M.RULES.disposalPerUnit), " a unit; EPR ₹", M.RULES.eprPerKg, " a kilo of product and pack. Factors marked indicative are editable here.")), done ? /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Badge, { tone: "green", icon: "check" }, "Watching since setup"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: () => go("command") }, "Open Command Center")) : OPT === "a" ? /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10 } }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", icon: "check", loading: busy, disabled: !mapped, "aria-describedby": mapped ? void 0 : "s79-why", onClick: confirm }, "Confirm and start watching"), !mapped && /* @__PURE__ */ React.createElement("span", { id: "s79-why", className: "s79-why" }, /* @__PURE__ */ React.createElement(Icon, { name: "info", size: 15, stroke: 2.2 }), "Confirm once the Data agent has mapped an export.")) : /* @__PURE__ */ React.createElement("div", { className: "s79-bar", role: "region", "aria-label": "Start watching" }, /* @__PURE__ */ React.createElement("span", { className: "stack tight grow", style: { gap: 0, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, mapped ? "Step 3 of 3 · check the rules" : phase === "waiting" ? app.bp === "phone" ? "Step 1 of 3 · an export" : "Step 1 of 3 · waiting for an export" : "Step 2 of 3 · the Data agent is mapping it"), /* @__PURE__ */ React.createElement("span", { id: "s79-why", className: "t-footnote subtle" }, mapped ? "The Watcher starts at 09:00 once you confirm." : "Confirm once the Data agent has mapped an export.")), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: app.bp === "phone" ? void 0 : "lg", icon: "check", loading: busy, disabled: !mapped, "aria-describedby": "s79-why", onClick: confirm }, app.bp === "phone" ? "Confirm" : "Confirm and start watching"))));
  }
  window.SC3_SCREENS.Setup = Setup;
})();
