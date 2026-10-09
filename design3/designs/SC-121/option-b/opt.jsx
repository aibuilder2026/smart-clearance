// SC-121 option B · Close the quarter. Each role gets the home its job asks for. Anita's is the quarter's close: its
// batches through four stops (papers drafted, the distributors' invoices issued, reviewed, in the GST return), what is
// left to chase, the return's own figures, and the batches as cards by month. Vikram's is the BRSR builder: Principle
// 6's rows, worked from the batches, each opening on the batches that make it. A batch opens its own page.
(function () {
  const { useState, useMemo } = React;
  const { motion, useReducedMotion } = Motion;
  const K = window.SC3, M = window.SC3_MONEY, S = window.SC3_SCREENS, X = window.SC121, Z = window.SC121K;
  const { cx, Icon, Badge, Button, Card, List, ListRow, Product, Money, useApp } = K;
  const { useRoute, Screen, SectionTitle } = S;
  const fmt = M.fmt;
  const periodOf = id => X.PERIODS.find(p => p.id === id);

  // the close's four stops: how many of the period's batches have passed each. A cleared batch's papers are drafted,
  // its distributor's invoice issued and its pack reviewed; it is in the return once its month's GSTR-3B is filed (the
  // pilot quarter's, by 20 Oct)
  function CloseTrack({ list, open }) {
    const n = list.length, flying = open.length, all = n + flying;
    const stops = [
      { id: "drafted", label: "Papers drafted", done: n, of: all },
      { id: "issued", label: "Invoices issued", done: n, of: all },
      { id: "reviewed", label: "Reviewed", done: n, of: all },
      { id: "filed", label: "In the GST return", done: list.filter(b => b.cleared <= "2026-09-30").length, of: all },
    ];
    return <div className="sc121-close" role="list" aria-label="The close">
      {stops.map((s, i) => { const done = s.done === s.of && s.of > 0; const here = !done && (i === 0 || stops[i - 1].done === stops[i - 1].of);
        return <div key={s.id} role="listitem" className={cx("sc121-stop", done && "done", here && "here")}><span className="sc121-dot">{done ? <Icon name="check" size={16} stroke={2.6} /> : <b>{i + 1}</b>}</span><b>{s.label}</b><span>{s.done} of {s.of}</span></div>; })}
    </div>;
  }

  function BatchCard({ b, onOpen }) {
    const L = b.ledger;
    return <button type="button" className="card interactive sc121-bcard" onClick={() => onOpen(b)}>
      <div className="row" style={{ gap: 12 }}><Product name={b.sku.img} size={44} /><div className="grow" style={{ minWidth: 0 }}><div className="strong">{b.sku.name}</div><div className="t-caption subtle mono">{b.ref} · {b.dist.short}</div></div><Icon name="chevron-right" size={18} /></div>
      <div className="sc121-bfig"><div><em>Recovered</em><b className="tnum">{fmt.inr(L.net)}</b></div><div><em>Credit kept</em><b className="tnum">{fmt.inr(L.itcKept)}</b></div><div><em>Reversed</em><b className={cx("tnum", L.itcReversed && "neg")}>{fmt.inr(L.itcReversed)}</b></div></div>
      <div className="sc121-chips"><Z.OutcomeBadge o={b.outcome} size="sm" /><Badge size="sm" tone="green" icon="check">reviewed</Badge>{b.numbers.invoice ? <Badge size="sm">{b.numbers.invoice}</Badge> : null}<Badge size="sm">{b.numbers.support}</Badge>{b.numbers.expiry ? <Badge size="sm">{b.numbers.expiry}</Badge> : null}</div>
    </button>;
  }

  function Close({ me }) {
    const { go } = useRoute(); const [period, setPeriod] = useState("q2");
    const list = useMemo(() => X.inPeriod(period).slice().sort((a, b) => (a.cleared < b.cleared ? 1 : -1)), [period]);
    const t = X.totals(list), p = periodOf(period), flying = period !== "q2" ? X.inFlight : [];
    const open = b => go({ name: "report", params: { ref: b.ref } });
    const months = []; list.forEach(b => { const m = b.cleared.slice(0, 7); (months.find(x => x.m === m) || (months.push({ m, label: Z.month(b.cleared), items: [] }), months[months.length - 1])).items.push(b); });
    const invoices = list.flatMap(b => b.docs.filter(d => d.id === "invoice"));
    return <Screen me={me} title={`${p.label} close`} sub={`${p.long} · ${t.batches} ${t.batches === 1 ? "batch" : "batches"} cleared`}>
      <div className="stack" style={{ gap: 20 }}>
        <div className="row"><Z.PeriodSwitch value={period} onChange={setPeriod} /></div>
        <Card className="stack" style={{ gap: 18 }}>
          <div className="card-head"><span className="card-title">Where the close stands</span>{flying.length ? <Badge tone="blue" dot live>{flying.length} still out</Badge> : <Badge tone="green" icon="check">closed</Badge>}</div>
          <CloseTrack list={list} open={flying} />
        </Card>
        <div className="sc121-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))" }}>
          <Card className="stack snug">
            <div className="card-head"><span className="card-title">Things to chase</span><Badge tone={flying.length ? "amber" : "green"}>{flying.length}</Badge></div>
            {flying.length ? flying.map(b => <div key={b.ref} className="row" style={{ gap: 12 }}><Product name={b.sku.img} size={36} /><div className="grow"><b>{b.sku.name}</b><div className="t-footnote subtle">{b.ref} · {b.note}. Its papers follow the last of its lines.</div></div></div>) : <p className="t-footnote muted" style={{ margin: 0 }}>Nothing to chase. Every paper of the quarter is issued, reviewed and in the return.</p>}
          </Card>
          <Card className="stack snug">
            <div className="card-head"><span className="card-title">For the GST return</span><span className="t-footnote subtle">GSTR-3B · {p.label}</span></div>
            <div className="sc121-return">
              <div className="sc121-line"><span>Input credit kept <em>Table 4(A)(5)</em></span><span className="tnum">{fmt.inr2(t.itcKept)}</span></div>
              <div className="sc121-line"><span>Reversed, s.17(5)(h) <em>Table 4(B)(1)</em></span><span className="tnum neg">{fmt.inr2(t.itcReversed)}</span></div>
              <div className="sc121-line"><span>Credit notes issued <em>financial, no GST</em></span><span className="tnum">{t.creditNotes} · {fmt.inr(t.support + t.credit)}</span></div>
              <div className="sc121-line"><span>Distributors' invoices <em>IGST, for their GSTR-1</em></span><span className="tnum">{invoices.length} · {fmt.inr(invoices.reduce((s, d) => s + d.igst, 0))} tax</span></div>
            </div>
          </Card>
        </div>
        {months.map(g => <div key={g.m} className="stack" style={{ gap: 12 }}>
          <SectionTitle sub={`${g.items.length} ${g.items.length === 1 ? "batch" : "batches"} · ${fmt.inr(g.items.reduce((s, b) => s + b.ledger.net, 0))} recovered`}>{g.label}</SectionTitle>
          <div className="sc121-cards">{g.items.map(b => <BatchCard key={b.ref} b={b} onOpen={open} />)}</div>
        </div>)}
      </div>
    </Screen>;
  }

  // Principle 6's rows for the period, each worked from the batches that make it
  function Brsr({ me }) {
    const { go } = useRoute(); const [period, setPeriod] = useState("q2"); const [openRow, setOpenRow] = useState("resold");
    const list = useMemo(() => X.inPeriod(period).slice().sort((a, b) => (a.cleared < b.cleared ? 1 : -1)), [period]);
    const t = X.totals(list), p = periodOf(period);
    const ROWS = [
      { id: "resold", label: "Waste diverted: resold", sub: "kiranas, ExpireSoon and staff sales", v: t.resoldKg, of: b => b.ledger.resoldKg },
      { id: "donated", label: "Waste diverted: donated", sub: `food banks · ${fmt.num(t.meals)} meals`, v: t.donatedKg, of: b => b.ledger.donatedKg },
      { id: "destroyed", label: "Waste disposed: destroyed", sub: "expired at the godown, full credit", v: t.destroyedKg, of: b => b.ledger.destroyedKg, bin: true },
      { id: "co2", label: "CO₂e avoided", sub: `${M.RULES.co2PerKg} kg a kg diverted, indicative`, v: t.co2, of: b => b.ledger.co2 },
    ];
    return <Screen me={me} title="BRSR · Principle 6" sub={`${p.long} · built from ${t.batches} cleared ${t.batches === 1 ? "batch" : "batches"}, each with its evidence`}>
      <div className="stack" style={{ gap: 20 }}>
        <div className="row wrap between" style={{ gap: 12 }}><Z.PeriodSwitch value={period} onChange={setPeriod} /><Button variant="secondary" icon="download">Export BRSR rows</Button></div>
        <Card className="stack" style={{ gap: 6 }}>
          <div className="sc121-fig"><Z.Kilos value={t.kg} /><span className="sc121-what">kept out of landfill</span></div>
          <p className="sc121-working">{t.batches} batches: {t.sold} sold through, {t.leftover} with packs left at the godown, {t.donation} donated. Every row below is the sum of the batches' posted ledgers.</p>
        </Card>
        {ROWS.map(r => { const on = openRow === r.id; const items = list.filter(b => r.of(b) > 0);
          return <Card key={r.id} pad={false} className="stack" style={{ gap: 0 }}>
            <button type="button" className="row between" style={{ gap: 12, padding: "16px 20px", textAlign: "left" }} aria-expanded={on} onClick={() => setOpenRow(on ? null : r.id)}>
              <span className="stack tight" style={{ gap: 2 }}><b>{r.label}</b><span className="t-footnote subtle">{r.sub} · {items.length} {items.length === 1 ? "batch" : "batches"}</span></span>
              <span className="row tight" style={{ gap: 10 }}><span className={cx("num s", r.bin && r.v ? "neg" : "")}>{Z.kg(r.v)}</span><Icon name={on ? "chevron-up" : "chevron-down"} size={18} /></span>
            </button>
            {on && <List>{items.map(b => <ListRow key={b.ref} chevron onClick={() => go({ name: "report", params: { ref: b.ref } })} leading={<Product name={b.sku.img} size={32} />} title={b.sku.name} sub={`${b.ref} · ${[b.numbers.invoice, b.numbers.receipt, b.numbers.expiry].filter(Boolean).join(" · ") || b.numbers.support}`} value={Z.kg(r.of(b))} />)}</List>}
          </Card>; })}
      </div>
    </Screen>;
  }

  function Report({ me }) { const b = Z.useBatchOf(); if (b) return <Z.BatchPage me={me} b={b} back={me.role === "sustainability" ? "BRSR" : "Close"} />; return me.role === "sustainability" ? <Brsr me={me} /> : <Close me={me} />; }

  Object.assign(S, { Report });
  S.NAV.finance = [{ id: "report", label: "Close", icon: "list-checks" }, { id: "batches", label: "Batches", icon: "boxes" }];
  S.NAV.sustainability = [{ id: "report", label: "BRSR", icon: "leaf" }, { id: "batches", label: "Batches", icon: "boxes" }];
  S.HOME.finance = S.HOME.sustainability = "report";
})();
