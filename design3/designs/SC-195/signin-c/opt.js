(function() {
  const K = window.SC3, S = window.SC3_SCREENS, D = window.SC3_DATA;
  const { Mark, Wordmark, Product, useApp } = K;
  const { motion, useReducedMotion } = Motion;
  const EASE = [0.22, 1, 0.36, 1];
  const SKU = D.SKUS;
  const PACKS = [
    { img: "carton-hero", size: [300, 150], cls: "c-carton", tag: `Shipper carton · ${SKU.chips.perCarton} packs`, at: "c-tag-carton" },
    { img: SKU.chips.img, size: [230, 116], cls: "c-chips", tag: `Masala Chips 150 g · MRP ₹${SKU.chips.mrp}`, at: "c-tag-chips" },
    { img: SKU.mango.img, size: [190, 96], cls: "c-mango", tag: `Mango Drink 200 ml · MRP ₹${SKU.mango.mrp}`, at: "c-tag-mango" }
  ];
  const SPRING = { type: "spring", stiffness: 240, damping: 22, mass: 1 };
  function Group({ small }) {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement("div", { className: small ? "c-group small" : "c-group", "aria-hidden": small ? "true" : void 0 }, /* @__PURE__ */ React.createElement("span", { className: "c-floor" }), PACKS.map((p, i) => /* @__PURE__ */ React.createElement(motion.div, { key: p.img, className: "c-pack " + p.cls, initial: reduce ? false : { opacity: 0, y: 34, scale: 0.94 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: reduce ? { duration: 0 } : { ...SPRING, delay: 0.2 + i * 0.12 } }, /* @__PURE__ */ React.createElement(Product, { name: p.img, size: p.size[small ? 1 : 0], alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "c-reflect", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: p.img, size: p.size[small ? 1 : 0], alt: "" })))), !small && PACKS.map((p, i) => /* @__PURE__ */ React.createElement(motion.span, { key: p.at, className: "c-tag " + p.at, initial: reduce ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: reduce ? 0 : 0.32, delay: reduce ? 0 : 0.9 + i * 0.1, ease: EASE } }, p.tag)));
  }
  function Stage() {
    return /* @__PURE__ */ React.createElement("div", { className: "si-stage sc-stage" }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "si-product" }, /* @__PURE__ */ React.createElement(Mark, { size: 34 }), /* @__PURE__ */ React.createElement(Wordmark, { size: 20 })), /* @__PURE__ */ React.createElement("p", { className: "si-tagline" }, "Every near-expiry carton gets a second chance, chosen by AI. ", /* @__PURE__ */ React.createElement("span", { className: "hi", lang: "hi" }, "हर कार्टन को दूसरा मौका"))), /* @__PURE__ */ React.createElement(Group, null), /* @__PURE__ */ React.createElement("p", { className: "sr-only" }, "Munchly Masala Chips 150 g, a Mango Drink 200 ml and a shipper carton."));
  }
  S.HeroStage = Stage;
  function PhoneGroup() {
    const app = useApp();
    const [el, setEl] = React.useState(null);
    React.useEffect(() => {
      const f = () => setEl(document.querySelector(".signin"));
      f();
      const t = setInterval(f, 300);
      return () => clearInterval(t);
    }, []);
    if (app.bp !== "phone" || !el) return null;
    return ReactDOM.createPortal(/* @__PURE__ */ React.createElement("div", { className: "sc-phone" }, /* @__PURE__ */ React.createElement(Group, { small: true })), el);
  }
  const Orig = S.Live.SignInLive;
  S.Live.SignInLive = (props) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Orig, { ...props }), /* @__PURE__ */ React.createElement(PhoneGroup, null));
})();
