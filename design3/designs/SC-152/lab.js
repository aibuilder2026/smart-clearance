(function() {
  const { useState, useEffect, useRef, createContext, useContext } = React;
  const { Icon, Badge, Card, Segmented, ThemeProvider, AppRoot, NoticeHost } = window.SC3;
  const q = new URLSearchParams(location.search);
  const FREEZE = q.get("freeze") || null;
  const LAT = { fast: 150, usual: 900, slow: 4500, refused: 1200 };
  const REFUSAL = "The plan changed since you opened it. Read it again, then approve.";
  let lat = q.get("lat") || "usual";
  const call = (reason) => new Promise((ok, no) => setTimeout(() => lat === "refused" ? no(new Error(reason || REFUSAL)) : ok(true), LAT[lat]));
  const T = { showAfter: 100, minShown: 400, slowAfter: 3e3, doneHold: 1200 };
  const Freeze = createContext(FREEZE);
  const useFreeze = () => useContext(Freeze);
  function Scene({ app, where, title, children, state }) {
    return /* @__PURE__ */ React.createElement(Card, { className: "lab-scene" }, /* @__PURE__ */ React.createElement("div", { className: "lab-where" }, /* @__PURE__ */ React.createElement("span", { className: "lab-app" }, app), /* @__PURE__ */ React.createElement("span", null, where)), /* @__PURE__ */ React.createElement("div", { className: "lab-head" }, /* @__PURE__ */ React.createElement("h3", null, title), state), children);
  }
  function State({ on, rest, done, tone = "amber" }) {
    return /* @__PURE__ */ React.createElement(Badge, { tone: on ? "green" : tone, dot: true }, on ? done : rest);
  }
  function Lab() {
    const O = window.SC152;
    const [latency, setLatency] = useState(lat);
    const [seed, setSeed] = useState(0);
    useEffect(() => {
      lat = latency;
    }, [latency]);
    return /* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { scroll: "window" }, /* @__PURE__ */ React.createElement(NoticeHost, null, /* @__PURE__ */ React.createElement(Freeze.Provider, { value: FREEZE }, /* @__PURE__ */ React.createElement("div", { className: "lab" }, /* @__PURE__ */ React.createElement("header", { className: "lab-bar" }, /* @__PURE__ */ React.createElement("div", { className: "lab-title" }, /* @__PURE__ */ React.createElement("b", null, "SC-152 · ", O.name), /* @__PURE__ */ React.createElement("span", null, "Buttons that call the network, in every app")), /* @__PURE__ */ React.createElement("div", { className: "lab-ctl" }, /* @__PURE__ */ React.createElement("span", { className: "lab-lbl", id: "lat-l" }, "Answer"), /* @__PURE__ */ React.createElement(Segmented, { label: "How fast the answer comes", value: latency, onChange: setLatency, options: [{ id: "fast", label: "Fast" }, { id: "usual", label: "Usual" }, { id: "slow", label: "Slow" }, { id: "refused", label: "Refused" }] }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: () => setSeed((n) => n + 1) }, /* @__PURE__ */ React.createElement(Icon, { name: "rotate-ccw", size: 16 }), "Reset"))), /* @__PURE__ */ React.createElement("p", { className: "lab-lede" }, O.lede), /* @__PURE__ */ React.createElement(Scenes, { key: seed }), /* @__PURE__ */ React.createElement("footer", { className: "lab-foot" }, "Prototype · every company, person and figure is fictional · the figures are the story's (core/money.js) · the network is simulated"), O.Host && /* @__PURE__ */ React.createElement(O.Host, null))))));
  }
  function Scenes() {
    const O = window.SC152;
    const s = useScenes();
    return /* @__PURE__ */ React.createElement("div", { className: "lab-grid" }, /* @__PURE__ */ React.createElement(Scene, { app: "Workspace", where: "Priya · Route Room · approve sheet", title: "Masala Chips · MF-2409-117", state: /* @__PURE__ */ React.createElement(State, { on: s.approve.on, rest: "Waiting for your yes", done: "Approved" }) }, /* @__PURE__ */ React.createElement("dl", { className: "lab-lines" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", null, "Kiranas · 588 packets"), /* @__PURE__ */ React.createElement("dd", null, "₹8,624")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", null, "ExpireSoon · 772 packs"), /* @__PURE__ */ React.createElement("dd", null, "₹11,580")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("dt", null, "Staff sale · 300 packs"), /* @__PURE__ */ React.createElement("dd", null, "₹1,566")), /* @__PURE__ */ React.createElement("div", { className: "tot" }, /* @__PURE__ */ React.createElement("dt", null, "Recovered"), /* @__PURE__ */ React.createElement("dd", null, "₹21,770"))), /* @__PURE__ */ React.createElement(O.Action, { variant: "approve", size: "xl", block: true, icon: "check", today: "loading", label: "Approve · ₹21,770", busy: "Approving the plan…", done: "Plan approved", onApply: s.approve.set, reason: REFUSAL })), /* @__PURE__ */ React.createElement(Scene, { app: "Workspace", where: "Rakesh Traders · Today", title: "Your next steps", state: /* @__PURE__ */ React.createElement(State, { on: s.tally.on && s.sale.on, rest: "2 for you", done: "All done" }) }, /* @__PURE__ */ React.createElement("div", { className: "lab-step" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "Issue the invoice from Tally"), /* @__PURE__ */ React.createElement("span", null, "INV/26-27/0931 · ₹11,510")), /* @__PURE__ */ React.createElement(O.Action, { variant: "secondary", size: "sm", today: "loading", okToast: "Marked issued from Tally", label: "Issue from Tally", busy: "Issuing…", done: "Issued", onApply: s.tally.set, reason: "Tally did not answer. Try again in a minute." })), /* @__PURE__ */ React.createElement("div", { className: "lab-step" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "Record the staff sale"), /* @__PURE__ */ React.createElement("span", null, "300 packs at ₹5.22 · Kalamna Market")), /* @__PURE__ */ React.createElement(O.Action, { variant: "primary", size: "sm", today: "loading", label: "Record the sale", busy: "Recording…", done: "Recorded", onApply: s.sale.set, reason: "The sale was already recorded on another phone." }))), /* @__PURE__ */ React.createElement(Scene, { app: "Workspace", where: "Meera · Feeding India · Pickups", title: "Mango Drink · 58 packs", state: /* @__PURE__ */ React.createElement(State, { on: s.pickup.on, rest: "Van at the gate", done: "Collected" }) }, /* @__PURE__ */ React.createElement("p", { className: "lab-copy" }, "Count the packs as they come off the van. Your receipt is issued once you confirm."), /* @__PURE__ */ React.createElement(O.Action, { variant: "primary", block: true, icon: "package-check", today: "none", okToast: "Pickup confirmed · receipt issued", label: "Confirm collected", busy: "Confirming…", done: "Collected · receipt issued", onApply: s.pickup.set, reason: "The pickup was cancelled by Lakshmi Agencies." })), /* @__PURE__ */ React.createElement(Scene, { app: "Console", where: "Neha · Munchly Foods · Rules", title: "Quick-commerce gates", state: /* @__PURE__ */ React.createElement(State, { on: s.rules.on, rest: "Unsaved changes", done: "Saved" }) }, /* @__PURE__ */ React.createElement("div", { className: "lab-fields" }, /* @__PURE__ */ React.createElement("label", null, "Blinkit · days left", /* @__PURE__ */ React.createElement("input", { className: "input", defaultValue: "45", inputMode: "numeric" })), /* @__PURE__ */ React.createElement("label", null, "Zepto and Instamart · share of life", /* @__PURE__ */ React.createElement("input", { className: "input", defaultValue: "60%" }))), /* @__PURE__ */ React.createElement("div", { className: "lab-right" }, /* @__PURE__ */ React.createElement(O.Action, { variant: "primary", today: "none", refetch: true, okToast: "Rules saved", label: "Save rules", busy: "Saving…", done: "Saved", onApply: s.rules.set, reason: "Days left must be 7 or more." }))), /* @__PURE__ */ React.createElement(Scene, { app: "Console", where: "Neha · Munchly Foods · Agents", title: "The Watcher" }, /* @__PURE__ */ React.createElement(O.Toggle, { kind: "switch", label: "The Watcher runs", initial: true, reason: "Pausing needs an admin." }), /* @__PURE__ */ React.createElement(O.Toggle, { kind: "seg", label: "When it finds a batch", initial: "ask", options: [{ id: "ask", label: "Ask" }, { id: "tell", label: "Act and tell" }, { id: "act", label: "Act" }], reason: "Act needs the client's yes first." }), /* @__PURE__ */ React.createElement("div", { className: "lab-step" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "Daily check · due 09:00"), /* @__PURE__ */ React.createElement("span", null, "In 3 h 20 min of journey time · 2 min real")), /* @__PURE__ */ React.createElement(O.Action, { variant: "outline", size: "sm", icon: "zap", today: "none", refetch: true, okToast: "The Watcher's daily check fired", label: "Fire now", busy: "Firing…", done: "Fired", answerFirst: true, onApply: s.fire.set, reason: "The Watcher is already running." }))), /* @__PURE__ */ React.createElement(Scene, { app: "Landing page", where: "Book a demo", title: "See it on your own batches" }, /* @__PURE__ */ React.createElement("div", { className: "lab-fields" }, /* @__PURE__ */ React.createElement("label", null, "Work email", /* @__PURE__ */ React.createElement("input", { className: "input", defaultValue: "anjali@brand.example" }))), /* @__PURE__ */ React.createElement(O.Action, { variant: "primary", size: "lg", block: true, today: "loading", label: "Send request", busy: "Sending…", done: "Request sent", answerFirst: true, onApply: s.demo.set, reason: "Check the email address and send it again." })));
  }
  function useScenes() {
    const make = () => {
      const [on, set] = useState(false);
      return { on, set };
    };
    return { approve: make(), tally: make(), sale: make(), pickup: make(), rules: make(), fire: make(), demo: make() };
  }
  function usePhase({ run, reason, onApply, optimistic }) {
    if (!run) run = () => call(reason);
    const freeze = useFreeze();
    const [phase, setPhase] = useState(freeze === "pending" ? "busy" : freeze || "idle");
    const [err, setErr] = useState(freeze === "error" ? reason || REFUSAL : null);
    const timers = useRef([]);
    const clear = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    useEffect(() => clear, []);
    useEffect(() => {
      if (freeze && onApply) onApply(freeze === "done" || optimistic && freeze !== "error");
    }, []);
    const later = (f, ms) => timers.current.push(setTimeout(f, ms));
    const go = () => {
      if (freeze || phase !== "idle" && phase !== "error") return;
      clear();
      setErr(null);
      setPhase("wait");
      if (optimistic && onApply) onApply(true);
      let shown = 0;
      later(() => {
        shown = Date.now();
        setPhase((p) => p === "wait" ? "busy" : p);
      }, T.showAfter);
      later(() => setPhase((p) => p === "busy" ? "slow" : p), T.slowAfter);
      run().then(() => {
        const hold = shown ? Math.max(0, T.minShown - (Date.now() - shown)) : 0;
        setTimeout(() => {
          clear();
          setPhase("done");
          onApply && onApply(true);
          later(() => setPhase("idle"), T.doneHold);
        }, hold);
      }, (e) => {
        const hold = shown ? Math.max(0, T.minShown - (Date.now() - shown)) : 0;
        setTimeout(() => {
          clear();
          setErr(e.message);
          setPhase("error");
          onApply && onApply(false);
        }, hold);
      });
    };
    return { phase, err, go, freeze, dismiss: () => {
      setErr(null);
      setPhase("idle");
    } };
  }
  window.SC152 = Object.assign(window.SC152 || {}, { FROZEN: !!FREEZE, T, usePhase, useFreeze, REFUSAL, call });
  window.SC152_LAB = Lab;
})();
