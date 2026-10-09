// SC-112's mockups: the moment the Masala Chips are at (?stage=: 5 Approve, 6 Execute, 7 Settle, 9 cleared), and a
// small switcher at the bottom left to move between them while reviewing (not in the stills, ?shot=1). The Mango Drink
// stays at Verify, waiting for Lakshmi Agencies' photo, as in the live workspace's two-batch moment.
(function () {
  const { useState } = React;
  const Q = new URLSearchParams(location.search); const stage = Number(Q.get("stage"));
  if (stage) setTimeout(() => window.SC3_FLOW.fastForward(stage), 0);
  if (Q.get("shot") === "1") return;
  const K = window.SC3;
  const MOMENTS = [[5, "Approve"], [6, "Execute"], [7, "Settle"], [9, "Cleared"]];
  function Moments() {
    const [open, setOpen] = useState(false); const now = stage || 5;
    const link = n => { const p = new URLSearchParams(location.search); p.set("stage", n); return location.pathname + "?" + p.toString() + location.hash; };
    return <div className="sc112-moments">
      <button type="button" aria-expanded={open} aria-controls="sc112-moments" onClick={() => setOpen(!open)}><K.Icon name={open ? "x" : "milestone"} size={16} /><span>Masala Chips at {(MOMENTS.find(m => m[0] === now) || MOMENTS[0])[1]}</span></button>
      {open && <nav id="sc112-moments" aria-label="The Masala Chips' moment">{MOMENTS.map(([n, l]) => <a key={n} href={link(n)} aria-current={n === now ? "page" : undefined}>{l}</a>)}</nav>}
    </div>;
  }
  const el = document.createElement("div"); document.body.appendChild(el);
  ReactDOM.createRoot(el).render(<Moments />);
})();
