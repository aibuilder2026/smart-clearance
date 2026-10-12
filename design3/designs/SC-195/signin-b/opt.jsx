// Sign-in option B · The range, behind glass. The films' depot aisle (SC-187), its cartons Munchly's, sits far out of
// focus behind everything under a wash of the ground's own colour; on the stage, Munchly's range stands on a glass shelf,
// every food pack the workspace watches with its name and MRP, rising into place one after another (once). The products
// keep the design system's renders; the photograph is only light and depth. On a phone the shelf is a row over the card.
(function () {
  const K = window.SC3, S = window.SC3_SCREENS, D = window.SC3_DATA;
  const { Mark, Wordmark, Product, useApp } = K; const { motion, useReducedMotion } = Motion;
  const EASE = [0.22, 1, 0.36, 1];
  // Munchly's own food packs, from the workspace's SKUs (Glowra's personal care is another brand)
  const RANGE = Object.values(D.SKUS).filter(s => s.brand === "Munchly");
  const shortName = s => s.name.replace(/\s+\d+(\.\d+)?\s?(g|ml|kg|l)$/i, "");
  const size = s => (s.name.match(/(\d+(\.\d+)?\s?(g|ml|kg|l))$/i) || [""])[0];
  function Shelf({ n, small }) {
    const reduce = useReducedMotion();
    const packs = RANGE.slice(0, n);
    return <div className={small ? "sb-shelf small" : "sb-shelf"} style={{ "--n": packs.length }}>
      <div className="sb-on" aria-hidden="true">{packs.map((s, i) => <motion.span key={s.id} className="sb-pack" initial={reduce ? false : { opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26, mass: 1, delay: 0.25 + i * 0.07 }}><Product name={s.img} size={small ? 64 : 104} alt="" /></motion.span>)}</div>
      <span className="sb-ledge" aria-hidden="true" />
      <ul className="sb-names" aria-label="Munchly's range">{packs.map(s => <li key={s.id}><span className="sb-name">{shortName(s)}</span><span className="sb-meta">{size(s)} · MRP ₹{s.mrp}</span></li>)}</ul>
    </div>;
  }
  function Stage() {
    const reduce = useReducedMotion();
    return <div className="si-stage sb-stage">
      <div className="stack tight" style={{ gap: 10 }}><div className="si-product"><Mark size={34} /><Wordmark size={20} /></div><p className="si-tagline">Every near-expiry carton gets a second chance, chosen by AI. <span className="hi" lang="hi">हर कार्टन को दूसरा मौका</span></p></div>
      <div className="sb-range"><span className="t-caption subtle strong">Munchly's range on Smart-Clearance</span><Shelf n={RANGE.length} /></div>
      <motion.p className="sb-line" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.42, delay: reduce ? 0 : 0.9, ease: EASE }}>Every pack here is watched batch by batch, and each one the Watcher flags gets a second chance before its date.</motion.p>
    </div>;
  }
  S.HeroStage = Stage;
  // on a phone the shelf is a row of four over the card: drawn into the sign-in's own grid, above its panel
  function PhoneShelf() {
    const app = useApp(); const [el, setEl] = React.useState(null);
    React.useEffect(() => { const f = () => setEl(document.querySelector(".signin")); f(); const t = setInterval(f, 300); return () => clearInterval(t); }, []);
    if (app.bp !== "phone" || !el) return null;
    return ReactDOM.createPortal(<div className="sb-phone"><Shelf n={4} small /></div>, el);
  }
  const Orig = S.Live.SignInLive;
  S.Live.SignInLive = props => <><Orig {...props} /><PhoneShelf /></>;
})();
