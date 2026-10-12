(function() {
  const K = window.SC3, S = window.SC3_SCREENS;
  const { Mark, Wordmark } = K;
  const { motion, useReducedMotion } = Motion;
  const EASE = [0.22, 1, 0.36, 1];
  function Stage() {
    const reduce = useReducedMotion();
    const rise = (d) => reduce ? { initial: false } : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.42, delay: d, ease: EASE } };
    return /* @__PURE__ */ React.createElement("div", { className: "si-stage sa-stage" }, /* @__PURE__ */ React.createElement(motion.div, { className: "sa-brand", ...rise(0.25) }, /* @__PURE__ */ React.createElement("div", { className: "si-product" }, /* @__PURE__ */ React.createElement(Mark, { size: 34 }), /* @__PURE__ */ React.createElement(Wordmark, { size: 20 })), /* @__PURE__ */ React.createElement("p", { className: "si-tagline" }, "Every near-expiry carton gets a second chance, chosen by AI. ", /* @__PURE__ */ React.createElement("span", { className: "hi", lang: "hi" }, "हर कार्टन को दूसरा मौका"))), /* @__PURE__ */ React.createElement(motion.span, { className: "sa-caption", ...rise(0.55) }, /* @__PURE__ */ React.createElement("span", { className: "dot", "aria-hidden": "true" }), "Munchly Masala Chips and Mango Drink, on a kirana counter"));
  }
  S.HeroStage = Stage;
})();
