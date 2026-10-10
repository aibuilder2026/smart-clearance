(function() {
  const { useState, useEffect } = React;
  const { Button, Segmented, Switch, useNotice } = window.SC3;
  const { useFreeze } = window.SC152;
  const REFETCH = 1100;
  function Action({ today, okToast, refetch, run, reason, onApply, label, answerFirst, busy: _b, done: _d, ...btn }) {
    const freeze = useFreeze();
    const [busy, setBusy] = useState(freeze === "pending" || freeze === "slow");
    const notice = useNotice();
    useEffect(() => {
      if (freeze === "done" && onApply) onApply(true);
    }, []);
    const go = () => {
      if (freeze || busy) return;
      setBusy(true);
      if (okToast && !refetch) notice.toast({ text: okToast, tone: "ok" });
      (run || (() => window.SC152.call(reason)))().then(() => new Promise((r) => setTimeout(r, refetch ? REFETCH : 0))).then(
        () => {
          setBusy(false);
          onApply && onApply(true);
          if (okToast && refetch) notice.toast({ text: okToast, tone: "ok" });
        },
        (e) => {
          setBusy(false);
          if (refetch || today === "loading") notice.toast({ text: e.message, tone: "err" });
        }
      );
    };
    return /* @__PURE__ */ React.createElement(Button, { ...btn, loading: today === "loading" && busy, onClick: go }, label);
  }
  function Toggle({ kind, label, initial, options, reason }) {
    const run = () => window.SC152.call(reason);
    const freeze = useFreeze();
    const [value, setValue] = useState(initial);
    const notice = useNotice();
    const change = (v) => {
      if (freeze) return;
      run().then(() => setTimeout(() => setValue(v), REFETCH), (e) => notice.toast({ text: e.message, tone: "err" }));
    };
    return /* @__PURE__ */ React.createElement("div", { className: "lab-toggle" }, /* @__PURE__ */ React.createElement("span", { className: "t-lbl" }, label), kind === "switch" ? /* @__PURE__ */ React.createElement(Switch, { checked: value, onChange: change, label }) : /* @__PURE__ */ React.createElement(Segmented, { label, value, onChange: change, options }), /* @__PURE__ */ React.createElement("span", { className: "t-note" }));
  }
  Object.assign(window.SC152, {
    name: "Today",
    lede: "How the buttons behave now. Press any of them. The approve, Tally, sale and Book a demo buttons go blank while they wait: the kit hides the label and its spinner inherits the hidden colour. The rest show nothing until the answer lands, two of them say it worked before it has, and the Watcher's controls jump back to their old value until the console has read everything again. Try Slow and Refused.",
    Action,
    Toggle
  });
})();
