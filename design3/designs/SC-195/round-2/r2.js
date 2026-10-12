(function() {
  const { useState, useEffect, useRef } = React;
  const { useReducedMotion } = Motion;
  const K = window.SC3;
  const { cx, Icon, Mark, Wordmark, useApp } = K;
  const EASE = [0.22, 1, 0.36, 1];
  const STOPS = [
    { id: "connect", t: "Connect" },
    { id: "detect", t: "Detect" },
    { id: "verify", t: "Verify" },
    { id: "value", t: "Value" },
    { id: "decide", t: "Decide" },
    { id: "approve", t: "Approve", human: true },
    { id: "execute", t: "Execute" },
    { id: "settle", t: "Settle" },
    { id: "report", t: "Report" }
  ];
  const CREW = [
    { id: "data", name: "Data", icon: "database", stop: 0, did: "Loaded the stock export and mapped its columns", call: "dms.map → 8 fields" },
    { id: "watcher", name: "Watcher", icon: "eye", stop: 1, did: "Flagged a batch the quick-commerce gates will refuse", call: "gates.check → blinkit · zepto · instamart" },
    { id: "vision", name: "Vision", icon: "scan-line", stop: 2, did: "Read the carton's label from one photo", call: "gemini.vision.read_label → match" },
    { id: "valuer", name: "Valuer", icon: "scale", stop: 3, did: "Priced every exit, the bin included", call: "price.exits → 5 priced" },
    { id: "router", name: "Router", icon: "route", stop: 4, did: "Split the batch under each exit's caps", call: "split.fill → under the caps" },
    { id: "you", name: "You", icon: "hand", stop: 5, human: true, did: "One yes, with the money on screen", call: "plan.approve → one tap" },
    { id: "outreach", name: "Outreach", icon: "send", stop: 6, did: "Offered the kiranas a scheme in Hindi", call: "fcm.send → kiranas · Hindi" },
    { id: "lister", name: "Lister", icon: "store", stop: 6, did: "Listed the lot outside the client's territory", call: "expiresoon.list → hidden in territory" },
    { id: "negotiator", name: "Negotiator", icon: "gavel", stop: 6, did: "Countered a bid, never below the reserve", call: "bid.counter → above reserve" },
    { id: "paperwork", name: "Paperwork", icon: "file-text", stop: 7, did: "Drafted the invoice, credit note and GST memo", call: "invoice.draft · credit_note.issue" },
    { id: "impact", name: "Impact", icon: "leaf", stop: 8, did: "Posted the ledger and the BRSR row", call: "ledger.post · brsr.row" }
  ];
  const N = STOPS.length;
  const crewAt = (k) => CREW.filter((c) => c.stop === k);
  const names = (k) => {
    const c = crewAt(k).map((x) => x.name);
    return c.length > 1 ? c.slice(0, -1).join(", ") + " and " + c[c.length - 1] : c[0];
  };
  const STEP = 420, YES = 800, EXEC = 900;
  const stays = (k) => STOPS[k].human ? YES : STOPS[k].id === "execute" ? EXEC : STEP;
  function useWalk() {
    const reduce = !!useReducedMotion();
    const [k, setK] = useState(reduce ? N : -1);
    const [run, setRun] = useState(0);
    useEffect(() => {
      if (reduce) {
        setK(N);
        return;
      }
      setK(-1);
      const t = setTimeout(() => setK(0), 600);
      return () => clearTimeout(t);
    }, [run, reduce]);
    useEffect(() => {
      if (reduce || k < 0 || k >= N) return;
      const t = setTimeout(() => setK(k + 1), stays(k));
      return () => clearTimeout(t);
    }, [k, reduce]);
    const state = (c) => c.stop < k || k >= N ? "done" : c.stop === k ? "now" : "later";
    return { k, reduce, run, playing: k >= 0 && k < N, done: k >= N, state, replay: () => setRun((r) => r + 1) };
  }
  function useDark() {
    const read = () => document.documentElement.dataset.theme === "dark";
    const [dark, setDark] = useState(read);
    useEffect(() => {
      const o = new MutationObserver(() => setDark(read()));
      o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      return () => o.disconnect();
    }, []);
    return dark;
  }
  const seeded = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  function fitCanvas(cv, w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }
  function useSize(ref) {
    const [s, setS] = useState(null);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const f = () => setS({ w: el.clientWidth, h: el.clientHeight });
      f();
      const o = new ResizeObserver(f);
      o.observe(el);
      return () => o.disconnect();
    }, [ref.current]);
    return s;
  }
  function Head({ children }) {
    return /* @__PURE__ */ React.createElement("div", { className: "r2-head" }, /* @__PURE__ */ React.createElement("div", { className: "si-product" }, /* @__PURE__ */ React.createElement(Mark, { size: 34 }), /* @__PURE__ */ React.createElement(Wordmark, { size: 20 })), /* @__PURE__ */ React.createElement("h2", { className: "r2-title" }, "Ten agents. ", /* @__PURE__ */ React.createElement("span", null, "One yes.")), /* @__PURE__ */ React.createElement("p", { className: "si-tagline" }, "Every near-expiry carton gets a second chance, chosen by AI. ", /* @__PURE__ */ React.createElement("span", { className: "hi", lang: "hi" }, "हर कार्टन को दूसरा मौका")), children);
  }
  const BandHead = () => /* @__PURE__ */ React.createElement("div", { className: "r2-bandhead" }, /* @__PURE__ */ React.createElement(Mark, { size: 22, still: true }), /* @__PURE__ */ React.createElement("b", null, "Ten agents. ", /* @__PURE__ */ React.createElement("span", null, "One yes.")), /* @__PURE__ */ React.createElement("span", { className: "by" }, "Smart-Clearance"));
  function Caption({ w, className }) {
    const s = w.playing ? STOPS[w.k] : null;
    return /* @__PURE__ */ React.createElement("div", { className: cx("r2-caption", s && s.human && "human", className), "aria-hidden": "true" }, w.k < 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, "A batch the gates will refuse"), /* @__PURE__ */ React.createElement("b", null, "Ten agents and one person take it from here.")) : s ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, w.k + 1, " of 9 · ", s.t), /* @__PURE__ */ React.createElement("b", null, names(w.k)), /* @__PURE__ */ React.createElement("span", { className: "did" }, crewAt(w.k).length > 1 ? "Work the exits at once: the kiranas, the marketplace, a bid" : crewAt(w.k)[0].did)) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "n" }, "9 of 9 · Report"), /* @__PURE__ */ React.createElement("b", null, "Sold, not binned."), /* @__PURE__ */ React.createElement("span", { className: "did" }, "Ten agents worked the batch. One person said yes.")));
  }
  const SrStops = () => /* @__PURE__ */ React.createElement("ol", { className: "sr-only", "aria-label": "How Smart-Clearance's agents work a batch" }, STOPS.map((s, i) => /* @__PURE__ */ React.createElement("li", { key: s.id }, s.t, ": ", names(i), ". ", crewAt(i).map((c) => c.did).join(". "), ".")));
  const Replay = ({ w }) => w.reduce ? null : /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm r2-replay", onClick: w.replay, disabled: w.playing }, /* @__PURE__ */ React.createElement(Icon, { name: "rotate-ccw", size: 15 }), "Replay");
  const Chip = ({ c, st, small }) => /* @__PURE__ */ React.createElement("span", { className: cx("r2-chip", c.human && "human", st, small && "small") }, /* @__PURE__ */ React.createElement("i", null, /* @__PURE__ */ React.createElement(Icon, { name: c.icon, size: small ? 12 : 14, stroke: 2.2 })), c.name);
  function Ground({ children }) {
    const [el, setEl] = useState(null);
    useEffect(() => {
      const f = () => setEl(document.querySelector(".signin > .ground"));
      f();
      const t = setInterval(f, 400);
      return () => clearInterval(t);
    }, []);
    return el ? ReactDOM.createPortal(children, el) : null;
  }
  function Band({ children }) {
    const app = useApp();
    const [el, setEl] = useState(null);
    useEffect(() => {
      const f = () => setEl(document.querySelector(".signin"));
      f();
      const t = setInterval(f, 400);
      return () => clearInterval(t);
    }, []);
    if (app.bp === "desktop" || !el) return null;
    return ReactDOM.createPortal(/* @__PURE__ */ React.createElement("div", { className: "r2-band", "aria-hidden": "true" }, children), el);
  }
  window.SC195R2 = { EASE, STOPS, CREW, N, crewAt, names, useWalk, useDark, seeded, fitCanvas, useSize, Head, BandHead, Caption, SrStops, Replay, Chip, Ground, Band };
})();
