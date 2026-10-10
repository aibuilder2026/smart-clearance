// Today, as the apps behave (the survey of 10 Oct): a button with `loading` uses the kit's Button, whose label turns
// transparent and whose spinner inherits that transparent colour, so the button reads blank; every other button shows
// nothing until the answer lands. Some screens toast success whatever the answer; a console control snaps back to its
// old value until the console has read everything again.
(function () {
  const { useState, useEffect } = React;
  const { Button, Segmented, Switch, useNotice } = window.SC3;
  const { useFreeze } = window.SC152;
  const REFETCH = 1100; // the console's act awaits refresh(), which reads every console query again

  function Action({ today, okToast, refetch, run, reason, onApply, label, answerFirst, busy: _b, done: _d, ...btn }) {
    const freeze = useFreeze();
    const [busy, setBusy] = useState(freeze === "pending" || freeze === "slow");
    const notice = useNotice();
    useEffect(() => { if (freeze === "done" && onApply) onApply(true); }, []);
    const go = () => {
      if (freeze || busy) return;
      setBusy(true);
      // a screen that toasts at once, before the answer, says it worked whatever happens
      if (okToast && !refetch) notice.toast({ text: okToast, tone: "ok" });
      (run || (() => window.SC152.call(reason)))().then(() => new Promise(r => setTimeout(r, refetch ? REFETCH : 0))).then(() => { setBusy(false); onApply && onApply(true); if (okToast && refetch) notice.toast({ text: okToast, tone: "ok" }); },
        e => { setBusy(false); if (refetch || today === "loading") notice.toast({ text: e.message, tone: "err" }); });
    };
    return <Button {...btn} loading={today === "loading" && busy} onClick={go}>{label}</Button>;
  }

  // the console's Switch and Segmented show the server's value: a change shows only once the console has read it again
  function Toggle({ kind, label, initial, options, reason }) {
    const run = () => window.SC152.call(reason);
    const freeze = useFreeze();
    const [value, setValue] = useState(initial);
    const notice = useNotice();
    const change = v => { if (freeze) return; run().then(() => setTimeout(() => setValue(v), REFETCH), e => notice.toast({ text: e.message, tone: "err" })); };
    return <div className="lab-toggle"><span className="t-lbl">{label}</span>
      {kind === "switch" ? <Switch checked={value} onChange={change} label={label} /> : <Segmented label={label} value={value} onChange={change} options={options} />}
      <span className="t-note" /></div>;
  }

  Object.assign(window.SC152, {
    name: "Today",
    lede: "How the buttons behave now. Press any of them. The approve, Tally, sale and Book a demo buttons go blank while they wait: the kit hides the label and its spinner inherits the hidden colour. The rest show nothing until the answer lands, two of them say it worked before it has, and the Watcher's controls jump back to their old value until the console has read everything again. Try Slow and Refused.",
    Action, Toggle,
  });
})();
