// SC-176 · the journey clock explained. Shared by the three options: the guide, one sheet that says why the workspace
// keeps its own date and time, and how Smart-Clearance staff start the journey again or move it forward in the console.
// Each option only changes where the note sits and how it opens (option-*/opt.jsx). window.SCT
(function () {
  const { useState } = React;
  const K = window.SC3, D = window.SC3_DATA, P = window.SC3_PLATFORM, S = window.SC3_SCREENS;
  const { cx, Icon, Sheet, Button, useApp } = K;
  const WS = D.WORKSPACE;
  const CONSOLE = "https://smartclearance-console.web.app";
  const hero = D.BATCHES.find(b => b.hero);
  const day = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const DAY0 = D.JOURNEY.today; // "Fri 2 Oct"
  const pace = perDay => (perDay >= 1440 ? "real time" : perDay >= 60 ? `1 day = ${Math.round(perDay / 6) / 10} h` : `1 day = ${perDay} min`);

  const Step = ({ n, children }) => <li className="pt-step"><span className="pt-n" aria-hidden="true">{n}</span><span>{children}</span></li>;
  const Ui = ({ children }) => <b className="pt-ui">{children}</b>;

  // the guide's body: why, then the two things staff can do, then what to do afterwards
  function Body({ clock }) {
    return <div className="pt-body">
      <p className="pt-lede">This is a prototype. {WS.name}' workspace runs on a <b>fixed dataset</b>: nine batches of eight SKUs, each batch with its own best-before date (<span className="pt-id">{hero.id}</span>, the Masala Chips, is best before {day(hero.bestBefore)}). So that the gates, the sell-through and every figure come out as the story has them, the workspace keeps <b>its own journey clock</b>. It starts on {DAY0} 2026, day 0, not on today's date, and a journey day can be shorter than a real one.</p>
      {clock && <div className="pt-now"><Icon name="calendar-clock" size={18} /><span><span className="pt-now-k">Journey time now</span><span className="pt-now-v tnum">{clock.long || clock.date}, {clock.time}</span></span><span className="pt-now-p"><Icon name={clock.perDay >= 1440 ? "clock" : "fast-forward"} size={13} stroke={2.2} />{pace(clock.perDay)}</span></div>}
      <section className="pt-sec" aria-labelledby="pt-reset">
        <h3 id="pt-reset" className="pt-h"><Icon name="rotate-ccw" size={16} />Start the journey again</h3>
        <p className="pt-where">In the staff console, signed in as Smart-Clearance staff:</p>
        <ol className="pt-steps">
          <Step n="1"><Ui>Clients</Ui>, then <Ui>{WS.name}</Ui>.</Step>
          <Step n="2">The client's actions menu <span className="pt-key" aria-label="More">⋯</span>, then <Ui>Reset journey…</Ui></Step>
          <Step n="3">Pick how long a journey day lasts (<Ui>Demo</Ui>: five minutes a day), then <Ui>Reset journey</Ui>.</Step>
        </ol>
        <p className="pt-foot">Back to day 0, {DAY0}, with the story's batches. The client's setup stays: gates, overrides, guardrails, agents and people.</p>
      </section>
      <section className="pt-sec" aria-labelledby="pt-ff">
        <h3 id="pt-ff" className="pt-h"><Icon name="fast-forward" size={16} />Move it forward</h3>
        <ol className="pt-steps">
          <Step n="1"><b>Shorter days.</b> The badge in the client's head (<Ui>Real time</Ui>), then <Ui>Rehearsal</Ui> (an hour a day), <Ui>Demo</Ui> (five minutes) or <Ui>Fast</Ui> (a minute).</Step>
          <Step n="2"><b>What falls due, now.</b> The <Ui>Agents</Ui> tab lists each agent's scheduled runs and timers with their journey time: <Ui>Run now</Ui> for the daily load and the Watcher's check, <Ui>Close now</Ui> for a kirana offer or an unsold lot, <Ui>Report now</Ui> for expiry day.</Step>
        </ol>
        <p className="pt-foot">Afterwards, set the badge back to <Ui>Real time</Ui>, so the journey waits for the next demo.</p>
      </section>
    </div>;
  }
  const Footer = ({ onClose }) => <><Button variant="primary" size="lg" block icon="external-link" onClick={() => window.open(CONSOLE, "_blank", "noopener")}>Open the console</Button><Button variant="ghost" block onClick={onClose}>Close</Button></>;

  // the guide as a sheet: at the side on a desktop, from the bottom on a phone
  function Guide({ open, onClose, clock }) {
    return <Sheet open={open} onClose={onClose} title="Prototype time" detent="large" className="pt-sheet" footer={<Footer onClose={onClose} />}><Body clock={clock} /></Sheet>;
  }
  // one opener and its sheet: the opener is the option's own element, given onOpen
  function WithGuide({ render }) {
    const [open, setOpen] = useState(false); const live = S.useLive(); const clock = live && live.clock;
    return <>{render(() => setOpen(true))}<Guide open={open} onClose={() => setOpen(false)} clock={clock} /></>;
  }

  window.SCT = { Body, Guide, Footer, WithGuide, pace, DAY0, CONSOLE };
})();
