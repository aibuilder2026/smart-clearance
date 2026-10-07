// Smart-Clearance v3 · signing in to a client's workspace (munchly.smartclearance.com), shared by the app and the
// guided demo. Email or phone first: a munchly.in address goes to Munchly's Google Workspace, an invited number gets
// a one-time code, a first-time invitee joins the workspace, and anyone else is pointed to "Find your workspace".
(function () {
  const { useState, useEffect, useContext, Fragment } = React;
  const { motion, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, Avatar, Badge, Button, Sheet, Field, Input, OTP, Money, Mark, Wordmark, WorkspaceMark, PoweredBy, Product, Tracker, List, ListRow, useApp } = K;
  const WS = D.WORKSPACE, WS_OF = D.WORKSPACE.name + "' workspace";
  const TEST_CODE = D.EXPLORE.code;
  const userById = id => Store.get().users.find(u => u.id === id);
  const digits = v => { const d = (v || "").replace(/\D/g, ""); return d.length === 12 && d.startsWith("91") ? d.slice(2) : d; };
  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
  const phoneOf = d => "+91 " + d.replace(/(\d{5})(\d{5})/, "$1 $2");
  const role = r => (S.ROLES[r] || r).toLowerCase();
  const GoogleG = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>;
  const Url = () => <span className="si-url"><Icon name="lock" size={12} stroke={2.2} />{WS.domain}</span>;

  // the people a judge can step into, by where they stand: inside Munchly, invited in, or outside the workspace
  const DEMO_PEOPLE = D.EXPLORE.groups;
  const DEMO = DEMO_PEOPLE.reduce((t, g) => t.concat(g.ids), []);
  function PeopleList({ onPick, busy, current }) {
    return <div className="stack" style={{ gap: 18 }}>{DEMO_PEOPLE.map(g => <div key={g.group} className="stack tight" style={{ gap: 8 }}>
      <div className="row tight"><b className="t-subhead">{g.group}</b><span className="t-caption subtle">{g.note}</span></div>
      <div className="si-people">{g.ids.map(([id, what]) => { const u = userById(id); return <button type="button" key={id} className={cx("si-person", current === id && "on")} onClick={() => onPick(id)}><Avatar person={u} size="lg" /><span className="stack tight" style={{ gap: 1 }}><b>{u.name}</b><span className="t-caption subtle">{S.ROLES[u.role]} · {u.org}</span><span className="t-footnote">{what}</span></span>{busy === id ? <K.Spinner size={18} /> : current === id ? <Badge size="sm" tone="green">you</Badge> : null}</button>; })}</div>
    </div>)}</div>;
  }

  /* ---------- the stage beside the form on desktop: the product, and its one number ---------- */
  // guided (the demo, before the batch exists): the product and its promise, without the result
  function HeroStage({ guided }) {
    const reduce = useReducedMotion();
    // WCAG 2.2.2: the batch walks the nine stages once and holds on the result, so nothing loops beside the sign-in.
    // The walk can be paused on the way (a paused hero stays paused on return), and replayed from the start.
    const [paused, setPaused] = useState(() => { try { return localStorage.getItem("sc3-hero-paused") === "1"; } catch (e) { return false; } });
    const [k, setK] = useState(() => (paused ? 9 : 0));
    const done = k >= 9;
    useEffect(() => { if (reduce) { setK(9); return; } if (paused || k >= 9) return; const t = setTimeout(() => setK(k + 1), 1000); return () => clearTimeout(t); }, [reduce, paused, k]);
    const remember = v => { try { localStorage.setItem("sc3-hero-paused", v ? "1" : "0"); } catch (e) {} };
    const control = () => { if (done) { setK(0); setPaused(false); remember(false); } else { setPaused(!paused); remember(!paused); } };
    const stages = D.STAGES.map(x => ({ id: x.id, title: x.title, human: x.human }));
    return <div className={cx("si-stage", paused && "paused")}>
      <div className="stack tight" style={{ gap: 10 }}><div className="si-product"><Mark size={36} /><Wordmark size={21} /></div><p className="si-tagline">Every near-expiry carton gets a second chance, chosen by AI. <span className="hi" lang="hi">हर कार्टन को दूसरा मौका</span></p></div>
      <div className="si-renders" aria-hidden="true"><Product name="pack-chips" size={176} float className="r1" /><Product name="carton-hero" size={208} float className="r2" /><Product name="pack-mango" size={150} float className="r3" /></div>
      {!guided && <><div className="si-figure"><span className="si-cap">Recovered from one batch of Munchly chips headed for the bin</span><Money value={k >= 9 ? D.ACTUAL.net : Math.round(D.ACTUAL.net * k / 9)} size="xl" roll style={{ color: "var(--primary-text)" }} /><span className="si-cap">instead of {fmt.inr(-D.PLAN.writeOff.total)} to destroy it</span></div>
      <div className="si-track" aria-hidden="true"><Tracker stages={stages} done={Math.min(k, 9)} current={k < 9 ? k : -1} /></div>
      {!reduce && <div className="si-ctl"><button type="button" className="btn btn-ghost btn-sm" onClick={control}><Icon name={done ? "rotate-ccw" : paused ? "play" : "pause"} size={15} />{done ? "Replay animation" : paused ? "Play animation" : "Pause animation"}</button></div>}</>}
    </div>;
  }

  /* ---------- find your workspace: one Smart-Clearance step above every client ---------- */
  // note: the line under the results; the platform's own landing page says it without naming a client (SC-28)
  function FindWorkspace({ open, onClose, onUse, initial, note }) {
    const app = useApp(); const [v, setV] = useState(""); const [res, setRes] = useState(null); const [err, setErr] = useState("");
    useEffect(() => { if (open) { setV(initial || ""); setRes(null); setErr(""); } }, [open]);
    const find = () => {
      const t = v.trim(); setErr(""); setRes(null);
      if (!t) { setErr("Enter an email address or a mobile number."); return; }
      const users = Store.get().users; let u = null;
      if (isEmail(t)) u = users.find(x => x.email && x.email.toLowerCase() === t.toLowerCase());
      else if (digits(t).length === 10) u = users.find(x => x.phone && digits(x.phone) === digits(t));
      else { setErr("Enter an email address, or a 10-digit mobile number."); return; }
      if (u && u.kind !== "external") setRes([{ as: u.status === "invited" ? `invited as ${role(u.role)}` : u.status === "deactivated" ? "deactivated by the admin" : role(u.role), value: t }]);
      else if (isEmail(t) && t.toLowerCase().endsWith("@" + WS.emailDomain)) setRes([{ as: "your company's workspace · ask its admin for access", value: t }]);
      else setRes([]);
    };
    return <Sheet open={open} onClose={onClose} title="Find your workspace" side={app.bp === "phone" ? "bottom" : "center"} detent="large"
      footer={<Button variant="primary" size="lg" block onClick={find}>Find workspaces</Button>}>
      <div className="stack">
        <div className="row tight"><Mark size={28} still /><Wordmark size={17} /><span className="t-caption subtle mono">{D.PLATFORM.domain}</span></div>
        <p className="t-subhead muted" style={{ margin: 0 }}>Every manufacturer on Smart-Clearance has its own workspace, set up for its supply chain. Enter the email or mobile number you were invited with.</p>
        <Field label="Email or mobile number" htmlFor="fw-id" error={err}><Input id="fw-id" value={v} onChange={e => { setV(e.target.value); setErr(""); setRes(null); }} onKeyDown={e => e.key === "Enter" && find()} autoComplete="username" placeholder="name@company.in or 98230 44118" /></Field>
        {res && (res.length ? <div className="stack tight"><span className="t-caption subtle strong">{res.length === 1 ? "1 workspace" : res.length + " workspaces"}</span>
          {res.map(r => <div key={r.value} className="card row" style={{ gap: 12, padding: "12px 14px" }}><WorkspaceMark ws={WS} size={40} /><span className="stack tight grow" style={{ gap: 1, minWidth: 0 }}><b>{WS.name}</b><span className="t-caption subtle mono" style={{ overflowWrap: "anywhere" }}>{WS.domain}</span></span><Button variant="secondary" size="sm" onClick={() => onUse(r.value)}>Open</Button></div>)}</div>
          : <div className="card stack tight" style={{ padding: "14px 16px" }}><b>No workspace uses that yet</b><span className="t-footnote muted">Ask your company's admin to invite you. If your company is setting up Smart-Clearance, its workspace appears here once it is live.</span></div>)}
        <p className="t-caption subtle" style={{ margin: 0 }}>{note || `Only ${WS.name} is set up in this prototype.`}</p>
      </div>
    </Sheet>;
  }

  /* ---------- the workspace sign-in ---------- */
  // guided: the demo drives it (a prefilled identity, the SMS code filled in, no shortcuts)
  function SignIn({ onSignIn, install, guided, prefill }) {
    const app = useApp(); const reduce = useReducedMotion();
    const [id, setId] = useState(prefill || ""); const [err, setErr] = useState(null); const [busy, setBusy] = useState(null);
    const [sheet, setSheet] = useState(null); const [who, setWho] = useState(null);
    const [code, setCode] = useState(""); const [codeErr, setCodeErr] = useState("");
    const finish = uid => { setBusy(uid); setTimeout(() => { setBusy(null); setSheet(null); onSignIn(uid); }, 600); };
    const proceed = () => {
      const v = id.trim(); setErr(null);
      if (!v) { setErr({ text: "Enter your work email or mobile number." }); return; }
      const users = Store.get().users;
      if (isEmail(v)) {
        const email = v.toLowerCase(); const u = users.find(x => x.email && x.email.toLowerCase() === email);
        if (u && u.kind === "external") { setErr({ text: `${u.org} buys on ExpireSoon, another company's marketplace, so it has no account in ${WS_OF}.`, es: u.id }); return; }
        if (u && u.status === "deactivated") { setErr({ text: "Your admin deactivated this account. Ask Munchly's workspace admin to restore it." }); return; }
        if (!u) { setErr({ text: email.endsWith("@" + WS.emailDomain) ? `There's no account for ${email} in ${WS_OF} yet. Ask your workspace admin for access.` : `${email} isn't a member of ${WS_OF}.`, find: true }); return; }
        setBusy("go"); setTimeout(() => { setBusy(null); setWho(u); setSheet("google"); }, 500); return;
      }
      const d = digits(v);
      if (d.length === 10) {
        const u = users.find(x => x.phone && digits(x.phone) === d);
        if (!u) { setErr({ text: `No one has invited ${phoneOf(d)} to ${WS_OF}. Ask your distributor or Munchly for an invitation.`, find: true }); return; }
        if (u.status === "deactivated") { setErr({ text: "Your admin deactivated this number. Ask your distributor or Munchly to restore it." }); return; }
        setBusy("go"); setTimeout(() => { setBusy(null); setWho(u); setCode(guided ? TEST_CODE : ""); setCodeErr(""); setSheet("code"); }, 600); return;
      }
      setErr({ text: "Enter an email address, or a 10-digit mobile number." });
    };
    const verify = v => { const c = v || code; if (c.length < 6) return; setBusy("verify"); setTimeout(() => { setBusy(null); if (c !== TEST_CODE) { setCodeErr(`That code doesn't match. This prototype sends ${TEST_CODE}.`); setCode(""); return; } if (who.status === "invited") setSheet("join"); else finish(who.id); }, 700); };
    const join = () => { Flow.act("join", who.id); finish(who.id); };
    const TRY = D.EXPLORE.accounts;
    const isPhone = who && !!who.phone && sheet !== "google";
    return <div className={cx("signin", guided && "guided")}>
      <div className="ground" aria-hidden="true" />
      {app.bp === "desktop" && <HeroStage guided={guided} />}
      <div className="si-panel">
        <div className="si-card">
          <div className="si-ws"><WorkspaceMark ws={WS} size={app.bp === "phone" ? 52 : 60} /><div className="si-ws-name">{WS.name}</div><Url /></div>
          {app.bp !== "desktop" && <div className="si-hero" aria-hidden="true"><Product name="carton-hero" size={app.bp === "phone" ? 132 : 160} float />{!guided && <motion.div className="si-chip" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}><span className="dot" /><span><b>MF-2409-117</b> · routed · <Money value={D.ACTUAL.net} size="s" style={{ fontSize: 15 }} /> recovered</span></motion.div>}</div>}
          <div className="stack tight" style={{ gap: 6 }}><h1 className="si-title">Sign in</h1><p className="si-sub">Use your Munchly email, or the mobile number Munchly or your distributor invited.</p></div>
          <form className="si-form" onSubmit={e => { e.preventDefault(); proceed(); }} noValidate>
            <Field label="Work email or mobile number" htmlFor="si-id" error={err && err.text}><Input id="si-id" value={id} onChange={e => { setId(e.target.value); setErr(null); }} autoComplete="username" spellCheck={false} autoCapitalize="none" placeholder={WS.hint} /></Field>
            {err && (err.find || err.es) && <div className="row tight wrap" style={{ marginTop: -4 }}>{err.find && <button type="button" className="btn btn-link btn-sm" onClick={() => setSheet("find")}>Find your workspace</button>}{err.es && <button type="button" className="btn btn-link btn-sm" onClick={() => finish(err.es)}>Open ExpireSoon instead</button>}</div>}
            <Button type="submit" variant="primary" size="lg" block loading={busy === "go"}>Continue</Button>
          </form>
          {!guided && <div className="si-try"><span className="t-caption subtle strong">Accounts in this prototype</span><div className="row tight wrap" style={{ justifyContent: "center" }}>{TRY.map(([uid, val]) => { const u = userById(uid); return u ? <button type="button" key={uid} className="chip" onClick={() => { setId(val); setErr(null); }}><Avatar person={u} size="xs" />{u.short || u.name}{u.status === "invited" ? " · invited" : ""}</button> : null; })}</div></div>}
          {!guided && <><div className="si-or" aria-hidden="true"><span>or</span></div><button type="button" className="btn btn-secondary btn-lg btn-block" onClick={() => setSheet("demo")}><Icon name="users" size={18} />Explore as someone in the story</button></>}
          <div className="si-foot">
            <PoweredBy />
            <span className="si-foot-row"><button type="button" className="btn btn-link btn-sm" onClick={() => setSheet("find")}>Not your workspace? Find yours</button>{install && install.can && <button type="button" className="btn btn-ghost btn-sm" onClick={install.prompt}><Icon name="download" size={15} />Install</button>}</span>
            <span className="si-note">Prototype · every company, person and number is fictional</span>
          </div>
        </div>
      </div>

      <Sheet open={sheet === "google"} onClose={() => setSheet(null)} title="Sign in with Google" side={app.bp === "phone" ? "bottom" : "center"} detent="medium">
        {who && <div className="stack">
          <div className="row tight"><GoogleG size={20} /><span className="t-subhead"><b>Choose an account</b> to continue to <span className="mono">{WS.domain}</span></span></div>
          <button type="button" className="list-row si-acct" onClick={() => finish(who.id)}><Avatar person={who} size="sm" /><span className="stack tight" style={{ gap: 0, minWidth: 0 }}><b className="t-subhead">{who.name}</b><span className="t-caption subtle" style={{ overflowWrap: "anywhere" }}>{who.email}</span></span>{busy === who.id ? <K.Spinner size={18} /> : <Icon name="chevron-right" size={18} className="subtle" />}</button>
          <p className="t-footnote muted" style={{ margin: 0 }}>{who.kind === "staff" ? `${WS.name} lets in only ${WS.emailDomain} accounts, through its own Google Workspace.` : `${who.org} was invited to ${WS_OF} as a ${role(who.role)}.`}</p>
        </div>}
      </Sheet>
      <Sheet open={sheet === "code"} onClose={() => setSheet(null)} title="Enter the code" side={app.bp === "phone" ? "bottom" : "center"} detent="medium"
        footer={<Button variant="primary" size="lg" block loading={busy === "verify" || (who && busy === who.id)} disabled={code.length < 6} onClick={() => verify()}>Verify and continue</Button>}>
        {who && isPhone && <div className="stack">
          <p className="t-subhead muted" style={{ margin: 0 }}>Sent by SMS to {phoneOf(digits(who.phone))}{guided ? ", and filled in from the message." : "."} This prototype's code is <b className="mono">{TEST_CODE}</b>.</p>
          <OTP value={code} onChange={v => { setCode(v); setCodeErr(""); if (v.length === 6 && !guided) verify(v); }} autoFocus={!app.embedded} />
          {codeErr && <p className="t-footnote" style={{ color: "var(--red-text)", margin: 0 }} role="alert">{codeErr}</p>}
          <button type="button" className="btn btn-link" style={{ alignSelf: "flex-start" }} onClick={() => { setSheet(null); setCode(""); }}>Use a different number</button>
        </div>}
      </Sheet>
      <Sheet open={sheet === "join"} onClose={() => setSheet(null)} title={`Join ${WS.name}`} side={app.bp === "phone" ? "bottom" : "center"} detent="medium"
        footer={<Button variant="primary" size="lg" block loading={who && busy === who.id} onClick={join}>Join the workspace</Button>}>
        {who && <div className="stack" style={{ justifyItems: "center", textAlign: "center" }}>
          <WorkspaceMark ws={WS} size={64} />
          <div className="t-title3" style={{ textWrap: "balance" }}>{who.org} is invited to {WS_OF}</div>
          <p className="t-subhead muted" style={{ margin: 0, maxWidth: "40ch" }}>{who.invitedBy || WS.name} added this number as a {role(who.role)}. Offers, orders and payments for {WS.name}' stock come here, in your language.</p>
          <Url />
        </div>}
      </Sheet>
      <FindWorkspace open={sheet === "find"} onClose={() => setSheet(null)} initial={id} onUse={v => { setId(v); setErr(null); setSheet(null); }} />
      {!guided && <Sheet open={sheet === "demo"} onClose={() => setSheet(null)} title="Explore as someone in the story" side={app.bp === "phone" ? "bottom" : "center"} detent="large">
        <p className="t-footnote muted" style={{ margin: "0 0 14px" }}>Everyone shares one live batch. Switch person from your profile at any time; partners you are not playing answer on their own.</p>
        <PeopleList onPick={finish} busy={busy} />
      </Sheet>}
    </div>;
  }

  /* ---------- inside the app: the workspace the person is in ---------- */
  function WorkspaceSheet({ open, onClose, me, onSettings }) {
    const app = useApp();
    const how = me.provider === "google" ? (me.kind === "staff" ? `Google Workspace · ${me.email}` : `Google, by invitation · ${me.email}`) : me.provider === "phone" ? `One-time code · ${me.phone}` : me.provider;
    return <Sheet open={open} onClose={onClose} title="Workspace" side={app.bp === "phone" ? "bottom" : "center"} detent="large">
      <div className="stack">
        <div className="row" style={{ gap: 14 }}><WorkspaceMark ws={WS} size={56} /><div className="stack tight" style={{ gap: 4, minWidth: 0 }}><div className="t-title3">{WS.name}</div><Url /></div></div>
        <List head="You">
          <ListRow title={me.name} sub={`${S.ROLES[me.role]} · ${me.org}`} />
          <ListRow title="Signed in with" sub={how} />
        </List>
        <List head="Your workspaces" foot={me.kind === "partner" ? "If another brand you work with runs Smart-Clearance, its workspace appears here too, under the same sign-in." : `${WS.plan} since ${WS.since} · ${WS.region}`}>
          <ListRow leading={<WorkspaceMark ws={WS} size={32} />} title={WS.name} sub={WS.domain} value={<Badge size="sm" tone="green" icon="check">current</Badge>} />
        </List>
        {me.role === "admin" && onSettings && <Button variant="secondary" icon="building-2" onClick={onSettings}>Workspace settings</Button>}
        <div className="row" style={{ justifyContent: "center", paddingTop: 4 }}><PoweredBy /></div>
      </div>
    </Sheet>;
  }

  Object.assign(window.SC3_SCREENS, { SignIn, HeroStage, FindWorkspace, WorkspaceSheet, PeopleList, DEMO_PEOPLE, DEMO, TEST_CODE });
})();
