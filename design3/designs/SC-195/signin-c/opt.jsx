// Sign-in option C · The brand's own light. No photograph: the ground becomes a soft-focus field of light in the design
// system's inks (mint, sky, the approval's amber and a little of Munchly's orange), drifting into place once and then
// still; on the stage the three packs are composed large on a glass floor with their reflections and contact shadows,
// each named on a tag (the pack, its size and MRP). It stays in DESIGN.md's register of soft 3D renders. On a phone the
// composition sits over the card, small.
(function () {
  const K = window.SC3, S = window.SC3_SCREENS, D = window.SC3_DATA;
  const { Mark, Wordmark, Product, useApp } = K; const { motion, useReducedMotion } = Motion;
  const EASE = [0.22, 1, 0.36, 1];
  const SKU = D.SKUS;
  const PACKS = [
    { img: "carton-hero", size: [300, 150], cls: "c-carton", tag: `Shipper carton · ${SKU.chips.perCarton} packs`, at: "c-tag-carton" },
    { img: SKU.chips.img, size: [230, 116], cls: "c-chips", tag: `Masala Chips 150 g · MRP ₹${SKU.chips.mrp}`, at: "c-tag-chips" },
    { img: SKU.mango.img, size: [190, 96], cls: "c-mango", tag: `Mango Drink 200 ml · MRP ₹${SKU.mango.mrp}`, at: "c-tag-mango" },
  ];
  // the spring the packs settle on: stiffness 240, damping 22, mass 1 (named for the Svelte build's SPRINGS)
  const SPRING = { type: "spring", stiffness: 240, damping: 22, mass: 1 };
  function Group({ small }) {
    const reduce = useReducedMotion();
    return <div className={small ? "c-group small" : "c-group"} aria-hidden={small ? "true" : undefined}>
      <span className="c-floor" />
      {PACKS.map((p, i) => <motion.div key={p.img} className={"c-pack " + p.cls} initial={reduce ? false : { opacity: 0, y: 34, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={reduce ? { duration: 0 } : { ...SPRING, delay: 0.2 + i * 0.12 }}>
        <Product name={p.img} size={p.size[small ? 1 : 0]} alt="" />
        <span className="c-reflect" aria-hidden="true"><Product name={p.img} size={p.size[small ? 1 : 0]} alt="" /></span>
      </motion.div>)}
      {!small && PACKS.map((p, i) => <motion.span key={p.at} className={"c-tag " + p.at} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.32, delay: reduce ? 0 : 0.9 + i * 0.1, ease: EASE }}>{p.tag}</motion.span>)}
    </div>;
  }
  function Stage() {
    return <div className="si-stage sc-stage">
      <div className="stack tight" style={{ gap: 10 }}><div className="si-product"><Mark size={34} /><Wordmark size={20} /></div><p className="si-tagline">Every near-expiry carton gets a second chance, chosen by AI. <span className="hi" lang="hi">हर कार्टन को दूसरा मौका</span></p></div>
      <Group />
      <p className="sr-only">Munchly Masala Chips 150 g, a Mango Drink 200 ml and a shipper carton.</p>
    </div>;
  }
  S.HeroStage = Stage;
  function PhoneGroup() {
    const app = useApp(); const [el, setEl] = React.useState(null);
    React.useEffect(() => { const f = () => setEl(document.querySelector(".signin")); f(); const t = setInterval(f, 300); return () => clearInterval(t); }, []);
    if (app.bp !== "phone" || !el) return null;
    return ReactDOM.createPortal(<div className="sc-phone"><Group small /></div>, el);
  }
  const Orig = S.Live.SignInLive;
  S.Live.SignInLive = props => <><Orig {...props} /><PhoneGroup /></>;
})();
