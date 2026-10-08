// SC-83's watchlist row: a gated batch that sells through says why it is fine, and a failed gate is red only on a batch
// at risk. Loaded after system/product.js, it replaces SC3.BatchRow, which the screens take as they load. ?opt=a|b|c
// picks the option; the rest of the page is the live app (SC-68's ?state= moments). Fictional throughout.
//   A · sells out by (recommended): the row's line says the day its packs sell out and the days to spare; a failed
//       gate is drawn neutral unless the batch is at risk
//   B · one chip: the three gate chips fold into one neutral "Not for quick commerce", and the badge says
//       "Selling through in trade"
//   C · the projection drawn: the countdown becomes the batch's selling days against the days retailers take it, with
//       the last week marked, and the line says how many days before they stop
(function () {
  const K = window.SC3; const M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, Icon, Badge, Product, Countdown, StatusBadge } = K;
  const Q = new URLSearchParams(location.search);
  const OPT = ["a", "b", "c"].includes(Q.get("opt")) ? Q.get("opt") : "a";
  const STOP = M.RULES.projectionStopDays; // retailers will not take stock in its last week (money.js)

  // a date a number of days from a batch's best-before, as the screens write one ("19 Nov")
  const day = (iso, add) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + add); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }); };
  // the batch's projection at today's sell-through (money.js assess): the days its packs take to sell, the days it can
  // sell before retailers stop taking it, the day it sells out and how many days that leaves
  function projection(view) {
    const need = Math.ceil(view.units / view.sellPerDay); const usable = view.assess.usableDays;
    return { need, usable, spare: usable - need, by: day(view.bestBefore, need - view.daysLeft), stop: day(view.bestBefore, -STOP) };
  }
  const selling = (view) => !view.phase && view.assess.status === "gated" && view.assess.atRisk === 0;

  // the gate chips, a failed gate red only on a batch at risk; otherwise neutral
  function Gates({ gates, quiet }) {
    return <span className="row tight wrap">{gates.map(g => <span key={g.id} className={cx("gate", g.pass ? "pass" : "fail", !g.pass && quiet && "s83-quiet")} title={`${g.app}: ${g.rule}, has ${g.has}`}><Icon name={g.pass ? "check" : "x"} size={13} stroke={2.6} />{g.app}</span>)}</span>;
  }
  // C: the selling days against the days retailers take the batch, the last week marked
  function SellBar({ view, p }) {
    const span = Math.max(view.daysLeft, 1); const sell = Math.min(1, p.need / span); const stop = Math.min(1, p.usable / span);
    return <div className="s83-sell" role="img" aria-label={`Sells out in ${p.need} days; retailers take it for ${p.usable} more days`}><i style={{ "--w": sell }} /><b style={{ "--at": stop }} /></div>;
  }

  function BatchRow({ view, onOpen, selected, compact }) {
    const a = view.assess; const sku = view.skuObj; const phase = view.phase; const ok = selling(view); const p = ok ? projection(view) : null;
    const quiet = (phase || a.status) !== "at-risk"; // red only while the batch is at risk
    const badge = OPT === "b" && ok ? <Badge dot>Selling through in trade</Badge> : <StatusBadge status={phase || a.status} live={phase === "executing" || (!phase && a.status === "at-risk")} />;
    // B: the gates that pass stay; the ones that fail fold into one neutral chip that names them
    const failed = a.gates.filter(g => !g.pass);
    const folded = <span className="row tight wrap">{a.gates.filter(g => g.pass).map(g => <span key={g.id} className="gate pass" title={`${g.app}: ${g.rule}, has ${g.has}`}><Icon name="check" size={13} stroke={2.6} />{g.app}</span>)}<span className="gate fail s83-quiet" title={failed.map(g => `${g.app}: ${g.rule}, has ${g.has}`).join(" · ")}><Icon name="x" size={13} stroke={2.6} />{failed.length === a.gates.length ? "Not for quick commerce" : `Not for ${failed.map(g => g.app).join(", ")}`}</span></span>;
    const gates = OPT === "b" && ok ? folded : <Gates gates={a.gates} quiet={quiet} />;
    const bar = OPT === "c" && ok ? <SellBar view={view} p={p} /> : <Countdown days={view.daysLeft} life={sku.lifeDays} status={phase ? "" : a.status} />;
    const why = !ok ? (a.atRisk > 0 && !phase && <span className="t-caption neg strong tnum">{fmt.num(a.atRisk)} at risk</span>)
      : OPT === "a" ? <span className="t-caption s83-ok s83-own tnum"><Icon name="check" size={13} stroke={2.6} />Sells out by {p.by} · {p.spare} {p.spare === 1 ? "day" : "days"} to spare</span>
      : OPT === "b" ? <span className="t-caption subtle tnum">sells out {p.by}</span>
      : <span className="t-caption s83-ok tnum">Sells out {p.spare} {p.spare === 1 ? "day" : "days"} before retailers stop</span>;
    return <button type="button" className={cx("list-row batchrow", OPT === "c" && ok && "s83-c")} onClick={onOpen} aria-current={selected ? "true" : undefined} style={{ background: selected ? "var(--fill)" : undefined }}>
      <Product name={sku.img} size={compact ? 46 : 54} alt="" />
      <span className="br-main">
        <span className="br-line"><span className="lr-title br-name">{sku.name}</span>{badge}</span>
        <span className="lr-sub br-name">{view.dist.name} · {view.dist.city}{!compact && <span className="mono br-id"> · {view.id}</span>}</span>
        <span className="br-bar">{bar}<span className="t-caption subtle tnum">{view.daysLeft} days left</span>{why}</span>
      </span>
      {!compact && <span className="not-phone br-gates">{gates}</span>}
      <Icon name="chevron-right" size={18} className="chev" />
    </button>;
  }
  Object.assign(window.SC3, { BatchRow });
})();
