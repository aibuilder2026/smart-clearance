// Sign-in option A · In focus. One photograph fills the page: Munchly's packs crisp on a kirana counter in the left
// third, the shop and the lane soft behind them (a true depth of field, rendered by Qwen-Image from the packs' own
// renders), and the frosted card over the blur on the right. The client's products are the picture, not three floating
// renders; the stage keeps only the product's mark and its line, in glass, and names what is in focus. On a phone the
// photograph is a band at the top and the card rises over its foot. Recommended: the calmest of the three, one image,
// legible, and of a piece with the people's photographs (SC-194) and the films.
(function () {
  const K = window.SC3, S = window.SC3_SCREENS;
  const { Mark, Wordmark } = K; const { motion, useReducedMotion } = Motion;
  const EASE = [0.22, 1, 0.36, 1];
  function Stage() {
    const reduce = useReducedMotion();
    const rise = d => (reduce ? { initial: false } : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.42, delay: d, ease: EASE } });
    return <div className="si-stage sa-stage">
      <motion.div className="sa-brand" {...rise(0.25)}>
        <div className="si-product"><Mark size={34} /><Wordmark size={20} /></div>
        <p className="si-tagline">Every near-expiry carton gets a second chance, chosen by AI. <span className="hi" lang="hi">हर कार्टन को दूसरा मौका</span></p>
      </motion.div>
      <motion.span className="sa-caption" {...rise(0.55)}><span className="dot" aria-hidden="true" />Munchly Masala Chips and Mango Drink, on a kirana counter</motion.span>
    </div>;
  }
  S.HeroStage = Stage;
})();
