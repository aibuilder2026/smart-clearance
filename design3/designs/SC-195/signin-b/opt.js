(function() {
  const K = window.SC3, S = window.SC3_SCREENS, D = window.SC3_DATA;
  const { Mark, Wordmark, Product, useApp } = K;
  const { motion, useReducedMotion } = Motion;
  const EASE = [0.22, 1, 0.36, 1];
  const RANGE = Object.values(D.SKUS).filter((s) => s.brand === "Munchly");
  const shortName = (s) => s.name.replace(/\s+\d+(\.\d+)?\s?(g|ml|kg|l)$/i, "");
  const size = (s) => (s.name.match(/(\d+(\.\d+)?\s?(g|ml|kg|l))$/i) || [""])[0];
  function Shelf({ n, small }) {
    const reduce = useReducedMotion();
    const packs = RANGE.slice(0, n);
    return /* @__PURE__ */ React.createElement("div", { className: small ? "sb-shelf small" : "sb-shelf", style: { "--n": packs.length } }, /* @__PURE__ */ React.createElement("div", { className: "sb-on", "aria-hidden": "true" }, packs.map((s, i) => /* @__PURE__ */ React.createElement(motion.span, { key: s.id, className: "sb-pack", initial: reduce ? false : { opacity: 0, y: 26 }, animate: { opacity: 1, y: 0 }, transition: reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26, mass: 1, delay: 0.25 + i * 0.07 } }, /* @__PURE__ */ React.createElement(Product, { name: s.img, size: small ? 64 : 104, alt: "" })))), /* @__PURE__ */ React.createElement("span", { className: "sb-ledge", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("ul", { className: "sb-names", "aria-label": "Munchly's range" }, packs.map((s) => /* @__PURE__ */ React.createElement("li", { key: s.id }, /* @__PURE__ */ React.createElement("span", { className: "sb-name" }, shortName(s)), /* @__PURE__ */ React.createElement("span", { className: "sb-meta" }, size(s), " · MRP ₹", s.mrp)))));
  }
  function Stage() {
    const reduce = useReducedMotion();
    return /* @__PURE__ */ React.createElement("div", { className: "si-stage sb-stage" }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "si-product" }, /* @__PURE__ */ React.createElement(Mark, { size: 34 }), /* @__PURE__ */ React.createElement(Wordmark, { size: 20 })), /* @__PURE__ */ React.createElement("p", { className: "si-tagline" }, "Every near-expiry carton gets a second chance, chosen by AI. ", /* @__PURE__ */ React.createElement("span", { className: "hi", lang: "hi" }, "हर कार्टन को दूसरा मौका"))), /* @__PURE__ */ React.createElement("div", { className: "sb-range" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle strong" }, "Munchly's range on Smart-Clearance"), /* @__PURE__ */ React.createElement(Shelf, { n: RANGE.length })), /* @__PURE__ */ React.createElement(motion.p, { className: "sb-line", initial: reduce ? false : { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.42, delay: reduce ? 0 : 0.9, ease: EASE } }, "Every pack here is watched batch by batch, and each one the Watcher flags gets a second chance before its date."));
  }
  S.HeroStage = Stage;
  function PhoneShelf() {
    const app = useApp();
    const [el, setEl] = React.useState(null);
    React.useEffect(() => {
      const f = () => setEl(document.querySelector(".signin"));
      f();
      const t = setInterval(f, 300);
      return () => clearInterval(t);
    }, []);
    if (app.bp !== "phone" || !el) return null;
    return ReactDOM.createPortal(/* @__PURE__ */ React.createElement("div", { className: "sb-phone" }, /* @__PURE__ */ React.createElement(Shelf, { n: 4, small: true })), el);
  }
  const Orig = S.Live.SignInLive;
  S.Live.SignInLive = (props) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Orig, { ...props }), /* @__PURE__ */ React.createElement(PhoneShelf, null));
})();
