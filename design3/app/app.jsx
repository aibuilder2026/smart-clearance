// Smart-Clearance v3 · the app: sign-in, every role, the agents running live, persisted per browser, installable
(function () {
  const { useState, useEffect, useMemo, useCallback, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, Mark, Wordmark, Money, Roll, Sheet, Field, Input, OTP, ThemeProvider, AppRoot, NoticeHost, Splash, useApp, Product, Tracker } = K;

  Store.usePersistence();
  const SESSION = "sc3-session";
  const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION) || "null"); } catch (e) { return null; } };
  const writeSession = v => { try { if (v) localStorage.setItem(SESSION, JSON.stringify(v)); else localStorage.removeItem(SESSION); } catch (e) {} };
  const userById = id => Store.get().users.find(u => u.id === id);

  /* ---------- routes live in the hash: #/command, #/route … ---------- */
  const parseHash = () => { const m = /^#\/([a-z-]+)/.exec(location.hash || ""); return m ? { name: m[1] } : null; };
  function useHashRoute() {
    const [route, setRoute] = useState(parseHash);
    useEffect(() => { const f = () => setRoute(parseHash()); window.addEventListener("hashchange", f); window.addEventListener("popstate", f); return () => { window.removeEventListener("hashchange", f); window.removeEventListener("popstate", f); }; }, []);
    const go = useCallback(r => { const h = "#/" + r.name; if (location.hash === h) return; if (r.replace) history.replaceState(null, "", h); else history.pushState(null, "", h); setRoute({ name: r.name }); }, []);
    return [route, go];
  }

  /* ---------- install: keep the browser's prompt for when the person asks ---------- */
  let deferred = null; const installers = new Set();
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; installers.forEach(f => f()); });
  window.addEventListener("appinstalled", () => { deferred = null; installers.forEach(f => f()); });
  function useInstall() {
    const [, force] = useState(0);
    useEffect(() => { const f = () => force(x => x + 1); installers.add(f); return () => installers.delete(f); }, []);
    const standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
    return { can: !!deferred, standalone, prompt: async () => { if (!deferred) return; deferred.prompt(); try { await deferred.userChoice; } catch (e) {} deferred = null; installers.forEach(f => f()); } };
  }
  if ("serviceWorker" in navigator && (location.protocol === "https:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

  /* ---------- sign-in ---------- */
  const DEMO = [["priya", "Approve the plan for the chips batch"], ["rakesh", "Send the label photo, run the van, dispatch"], ["ganesh", "Order from the Hindi offer"], ["venkat", "Bid on ExpireSoon"], ["anita", "Review the document pack"], ["vikram", "Export the BRSR table"], ["meera", "Confirm a food-bank pickup"], ["arjun", "Users, guardrails and the audit log"]];
  const TEST_CODE = "246810";
  const GoogleG = () => <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>;

  function HeroStage() {
    const reduce = useReducedMotion();
    // WCAG 2.2.2: the loop runs beside the sign-in buttons for good, so it can be paused (and stays paused on return)
    const [paused, setPaused] = useState(() => { try { return localStorage.getItem("sc3-hero-paused") === "1"; } catch (e) { return false; } });
    const [k, setK] = useState(() => (paused ? 9 : 0));
    // the batch walks the nine stages, holds on the result, then starts again; Play moves on within a second
    useEffect(() => { if (reduce) { setK(9); return; } if (paused) return; let t; const tick = (x, first) => { t = setTimeout(() => { const n = x >= 9 ? 0 : x + 1; setK(n); tick(n); }, x >= 9 && !first ? 5200 : 1000); }; tick(k, true); return () => clearTimeout(t); }, [reduce, paused]);
    const toggle = () => { const next = !paused; setPaused(next); try { localStorage.setItem("sc3-hero-paused", next ? "1" : "0"); } catch (e) {} };
    const stages = D.STAGES.map(x => ({ id: x.id, title: x.title, human: x.human }));
    return <div className={cx("si-stage", paused && "paused")}>
      <div className="si-renders" aria-hidden="true"><Product name="pack-chips" size={176} float className="r1" /><Product name="carton-hero" size={208} float className="r2" /><Product name="pack-mango" size={150} float className="r3" /></div>
      <div className="si-figure"><span className="si-cap">Recovered from one batch of chips headed for the bin</span><Money value={k >= 9 ? D.ACTUAL.net : Math.round(D.ACTUAL.net * k / 9)} size="xl" roll style={{ color: "var(--primary-text)" }} /><span className="si-cap">instead of {fmt.inr(-D.PLAN.writeOff.total)} to destroy it</span></div>
      <div className="si-track" aria-hidden="true"><Tracker stages={stages} done={Math.min(k, 9)} current={k < 9 ? k : -1} /></div>
      {!reduce && <div className="si-ctl"><button type="button" className="btn btn-ghost btn-sm" onClick={toggle}><Icon name={paused ? "play" : "pause"} size={15} />{paused ? "Play animation" : "Pause animation"}</button></div>}
    </div>;
  }

  function SignIn({ onSignIn, install }) {
    const app = useApp(); const reduce = useReducedMotion();
    const [sheet, setSheet] = useState(null); const [phone, setPhone] = useState(""); const [step, setStep] = useState(1); const [code, setCode] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(null);
    const users = Store.get().users;
    const google = users.filter(u => u.provider === "google" && u.status === "active" && u.email && !u.extra);
    const open = which => { setErr(""); setStep(1); setCode(""); setSheet(which); };
    const pick = id => { setBusy(id); setTimeout(() => { setBusy(null); setSheet(null); onSignIn(id); }, 650); };
    const sendCode = () => { const d = phone.replace(/\D/g, "").slice(-10); if (d.length !== 10) { setErr("Enter a 10-digit mobile number."); return; } setErr(""); setBusy("send"); setTimeout(() => { setBusy(null); setStep(2); }, 700); };
    const verify = v => { const c = v || code; if (c.length < 6) return; setBusy("verify"); setTimeout(() => { setBusy(null); if (c !== TEST_CODE) { setErr(`That code doesn't match. This prototype sends ${TEST_CODE}.`); setCode(""); return; } const d = phone.replace(/\D/g, "").slice(-10); const u = users.find(x => x.phone && x.phone.replace(/\D/g, "").slice(-10) === d); if (!u) { setErr("No account uses this number yet. Ask your distributor or Munchly for an invite."); setStep(1); return; } if (u.status !== "active") { setErr(u.status === "deactivated" ? "Your admin deactivated this account." : "Accept your invite first."); setStep(1); return; } setSheet(null); onSignIn(u.id); }, 800); };
    const phones = users.filter(u => u.phone && u.status === "active").slice(0, 4);
    return <div className="signin">
      <div className="ground" aria-hidden="true" />
      {app.bp === "desktop" && <HeroStage />}
      <div className="si-panel">
        <div className="si-card">
          <div className="si-brand"><Mark size={56} play={!reduce} /><Wordmark size={24} play={!reduce} /></div>
          {app.bp !== "desktop" && <div className="si-hero" aria-hidden="true"><Product name="carton-hero" size={app.bp === "phone" ? 150 : 180} float /><motion.div className="si-chip" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}><span className="dot" /><span><b>MF-2409-117</b> · routed · <Money value={D.ACTUAL.net} size="s" style={{ fontSize: 15 }} /> recovered</span></motion.div></div>}
          <h1 className="si-title">Every near-expiry carton gets a second chance.</h1>
          <p className="si-hi hi" lang="hi">हर कार्टन को दूसरा मौका</p>
          <div className="si-actions">
            <button type="button" className="btn btn-secondary btn-lg btn-block si-google" onClick={() => open("google")}><GoogleG />Continue with Google</button>
            <Button variant="primary" size="lg" block icon="smartphone" onClick={() => open("phone")}>Continue with phone number</Button>
            <button type="button" className="btn btn-outline btn-lg btn-block si-es" onClick={() => open("es")}><span className="es-logo" style={{ width: 22, height: 22, borderRadius: 7 }}><Icon name="hourglass" size={13} stroke={2.4} /></span>Sign in with ExpireSoon</button>
          </div>
          <button type="button" className="btn btn-link si-demo" onClick={() => open("demo")}>Explore as someone in the story</button>
          <div className="si-foot"><span>Prototype · every company, person and number is fictional</span>{install.can && <button type="button" className="btn btn-ghost btn-sm" onClick={install.prompt}><Icon name="download" size={15} />Install</button>}</div>
        </div>
      </div>

      <Sheet open={sheet === "google"} onClose={() => setSheet(null)} title="Choose an account" side={app.bp === "phone" ? "bottom" : "center"} detent="medium">
        <p className="t-footnote muted" style={{ margin: "0 0 10px" }}>Brand staff and partners sign in with their work Google account.</p>
        <div className="list">{google.map(u => <button type="button" key={u.id} className="list-row" onClick={() => pick(u.id)} style={{ gridTemplateColumns: "40px minmax(0,1fr) auto", width: "100%", textAlign: "left" }}><Avatar person={u} size="sm" /><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">{u.name}</b><span className="t-caption subtle">{u.email}</span></span>{busy === u.id ? <K.Spinner size={18} /> : <Icon name="chevron-right" size={18} className="subtle" />}</button>)}</div>
      </Sheet>
      <Sheet open={sheet === "phone"} onClose={() => setSheet(null)} title={step === 1 ? "Your mobile number" : "Enter the code"} side={app.bp === "phone" ? "bottom" : "center"} detent="medium"
        footer={step === 1 ? <Button variant="primary" size="lg" block loading={busy === "send"} onClick={sendCode}>Send code</Button> : <Button variant="primary" size="lg" block loading={busy === "verify"} disabled={code.length < 6} onClick={() => verify()}>Verify and continue</Button>}>
        {step === 1 ? <div className="stack">
          <Field label="Mobile number" htmlFor="si-phone" error={err} help="Distributors and kirana owners sign in with a one-time code."><div className="row" style={{ gap: 8 }}><span className="input" style={{ width: 64, display: "grid", placeItems: "center", flex: "none" }}>+91</span><Input id="si-phone" inputMode="numeric" autoComplete="tel-national" placeholder="98230 44118" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === "Enter" && sendCode()} /></div></Field>
          <div className="stack tight"><span className="t-caption subtle strong">Numbers in this prototype</span><div className="row tight wrap">{phones.map(u => <button type="button" key={u.id} className="chip" onClick={() => setPhone(u.phone.replace("+91 ", ""))}><Avatar person={u} size="xs" />{u.short || u.name}</button>)}</div></div>
        </div> : <div className="stack">
          <p className="t-subhead muted" style={{ margin: 0 }}>Sent to +91 {phone.replace(/\D/g, "").slice(-10).replace(/(\d{5})(\d{5})/, "$1 $2")}. This prototype's code is <b className="mono">{TEST_CODE}</b>.</p>
          <OTP value={code} onChange={v => { setCode(v); setErr(""); if (v.length === 6) verify(v); }} autoFocus />
          {err && <p className="t-footnote" style={{ color: "var(--red-text)", margin: 0 }} role="alert">{err}</p>}
          <button type="button" className="btn btn-link" style={{ alignSelf: "flex-start" }} onClick={() => { setStep(1); setCode(""); }}>Use a different number</button>
        </div>}
      </Sheet>
      <Sheet open={sheet === "es"} onClose={() => setSheet(null)} title="ExpireSoon account" side={app.bp === "phone" ? "bottom" : "center"} detent="medium">
        <div className="esw"><div className="stack"><div className="es-top"><span className="row tight"><span className="es-logo"><Icon name="hourglass" size={16} stroke={2.2} /></span><span className="es-word">ExpireSoon</span></span><span className="t-caption subtle">Buyers sign in with their marketplace account</span></div>
          <button type="button" className="list-row card" onClick={() => pick("venkat")} style={{ gridTemplateColumns: "40px minmax(0,1fr) auto", width: "100%", textAlign: "left" }}><Avatar person={userById("venkat")} size="sm" /><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">Venkat · Sri Venkateswara Traders</b><span className="t-caption subtle">venkat@svtraders.in · Hyderabad</span></span>{busy === "venkat" ? <K.Spinner size={18} /> : <Icon name="chevron-right" size={18} className="subtle" />}</button></div></div>
      </Sheet>
      <Sheet open={sheet === "demo"} onClose={() => setSheet(null)} title="Explore as someone in the story" side={app.bp === "phone" ? "bottom" : "center"} detent="large">
        <p className="t-footnote muted" style={{ margin: "0 0 10px" }}>Everyone shares one live batch. Switch person from your profile at any time; partners you are not playing answer on their own.</p>
        <div className="si-people">{DEMO.map(([id, what]) => { const u = userById(id); return <button type="button" key={id} className="si-person" onClick={() => pick(id)}><Avatar person={u} size="lg" /><span className="stack tight" style={{ gap: 1 }}><b>{u.name}</b><span className="t-caption subtle">{S.ROLES[u.role]} · {u.org}</span><span className="t-footnote">{what}</span></span>{busy === id && <K.Spinner size={18} />}</button>; })}</div>
      </Sheet>
    </div>;
  }

  /* ---------- the app ---------- */
  function App() {
    const [session, setSession] = useState(readSession); const [route, go] = useHashRoute();
    const [chooser, setChooser] = useState(false); const [splash, setSplash] = useState(() => { try { return !sessionStorage.getItem("sc3-app-splash"); } catch (e) { return true; } });
    const install = useInstall(); const app = useApp();
    const s = S.useStore();
    const me = session && s.users.find(u => u.id === session.uid && u.status === "active");
    // the agents run while the app is open; partners the person is not playing answer by themselves
    useEffect(() => { Flow.Agents.auto = true; Flow.Agents.maxStage = Infinity; Flow.Agents.setLive(true); return () => Flow.Agents.setLive(false); }, []);
    useEffect(() => { Flow.Agents.plays = id => !!me && id === me.id; Flow.Agents.reconcile(); }, [me && me.id]);
    useEffect(() => { document.title = me ? `Smart-Clearance · ${me.short || me.name}` : "Smart-Clearance"; }, [me && me.id]);
    const signIn = useCallback((id, r) => { const v = { uid: id, at: Date.now() }; writeSession(v); setSession(v); const u = userById(id); Store.update(st => { const x = st.users.find(y => y.id === id); if (x) x.lastSeen = "now"; }); go({ name: r || S.HOME[u.role], replace: true }); }, [go]);
    const signOut = useCallback(() => { writeSession(null); setSession(null); history.replaceState(null, "", location.pathname + location.search); }, []);
    const acc = useMemo(() => ({
      switchTo: (id, r) => { if (id) signIn(id, r); else setChooser(true); },
      signOut, reset: () => { Store.reset(); Flow.Agents.reconcile(); },
      install: install.can ? install.prompt : null, standalone: install.standalone,
    }), [signIn, signOut, install.can, install.standalone]);
    const body = !me ? <SignIn onSignIn={id => signIn(id)} install={install} />
      : <S.RoleApp me={me} route={route || { name: S.HOME[me.role] }} onGo={r => go(r)} onBack={() => (history.length > 1 ? history.back() : go({ name: S.HOME[me.role], replace: true }))} realCamera />;
    return <S.AccountCtx.Provider value={acc}>
      <NoticeHost resetKey={me && me.id}>{body}</NoticeHost>
      <Sheet open={chooser} onClose={() => setChooser(false)} title="Switch person" side={app.bp === "phone" ? "bottom" : "center"} detent="large">
        <div className="si-people">{DEMO.map(([id, what]) => { const u = userById(id); return <button type="button" key={id} className={cx("si-person", me && me.id === id && "on")} onClick={() => { setChooser(false); signIn(id); }}><Avatar person={u} size="lg" /><span className="stack tight" style={{ gap: 1 }}><b>{u.name}</b><span className="t-caption subtle">{S.ROLES[u.role]} · {u.org}</span><span className="t-footnote">{what}</span></span>{me && me.id === id && <Badge size="sm" tone="green">you</Badge>}</button>; })}</div>
      </Sheet>
      {splash && <Splash onDone={() => { setSplash(false); try { sessionStorage.setItem("sc3-app-splash", "1"); } catch (e) {} }} />}
    </S.AccountCtx.Provider>;
  }

  function Root() { return <ThemeProvider><AppRoot className="app-root" style={{ position: "fixed", inset: 0 }}><App /></AppRoot></ThemeProvider>; }
  ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
})();
