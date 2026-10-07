// Smart-Clearance v3 · the app: Munchly's workspace at munchly.smartclearance.com. Sign-in, every role, the agents
// running live, persisted per browser, installable. ?live shows it as it runs on backend-api (SC-73, SC-68 option B),
// simulated here: below the stub's app, LiveApp.
(function () {
  const { useState, useEffect, useMemo, useCallback, useRef, Fragment } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS;
  const { Sheet, ThemeProvider, AppRoot, NoticeHost, Splash, useApp, useNotice } = K;
  const WS = D.WORKSPACE;

  // live mode: ?live, or ?state= one of SC-68's moments; ?shot=1 holds the moment still (the review's stills)
  const Q = new URLSearchParams(location.search);
  const LIVE = !!window.SC3_LIVE || Q.has("live") || Q.has("state");
  const SHOT = Q.get("shot") === "1";

  if (!LIVE) Store.usePersistence();
  const SESSION = LIVE ? "sc3-live-session" : "sc3-session";
  const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION) || "null"); } catch (e) { return null; } };
  const writeSession = v => { try { if (v) localStorage.setItem(SESSION, JSON.stringify(v)); else localStorage.removeItem(SESSION); } catch (e) {} };
  const userById = id => Store.get().users.find(u => u.id === id);

  /* ---------- routes live in the hash: #/command, #/route … (a batch's Route Room: #/route/MF-2410-118) ---------- */
  const parseHash = () => { const m = /^#\/([a-z-]+)(?:\/([A-Z0-9-]+))?/.exec(location.hash || ""); return m ? { name: m[1], params: m[2] ? { ref: m[2] } : undefined } : null; };
  function useHashRoute() {
    const [route, setRoute] = useState(parseHash);
    useEffect(() => { const f = () => setRoute(parseHash()); window.addEventListener("hashchange", f); window.addEventListener("popstate", f); return () => { window.removeEventListener("hashchange", f); window.removeEventListener("popstate", f); }; }, []);
    const go = useCallback(r => { const h = "#/" + r.name + (r.params && r.params.ref ? "/" + r.params.ref : ""); if (location.hash === h) return; if (r.replace) history.replaceState(null, "", location.pathname + location.search + h); else history.pushState(null, "", location.pathname + location.search + h); setRoute({ name: r.name, params: r.params }); }, []);
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
  if (!LIVE && "serviceWorker" in navigator && (location.protocol === "https:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

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
    useEffect(() => { document.title = me ? `${me.short || me.name} · ${me.role === "buyer" ? "ExpireSoon" : WS.name + " · Smart-Clearance"}` : `Sign in · ${WS.name} · Smart-Clearance`; }, [me && me.id]);
    const signIn = useCallback((id, r) => { const v = { uid: id, at: Date.now() }; writeSession(v); setSession(v); const u = userById(id); Store.update(st => { const x = st.users.find(y => y.id === id); if (x) x.lastSeen = "now"; }); go({ name: r || S.HOME[u.role], replace: true }); }, [go]);
    const signOut = useCallback(() => { writeSession(null); setSession(null); history.replaceState(null, "", location.pathname + location.search); }, []);
    const acc = useMemo(() => ({
      switchTo: (id, r) => { if (id) signIn(id, r); else setChooser(true); },
      signOut, reset: () => { Store.reset(); Flow.Agents.reconcile(); },
      install: install.can ? install.prompt : null, standalone: install.standalone,
    }), [signIn, signOut, install.can, install.standalone]);
    const body = !me ? <S.SignIn onSignIn={id => signIn(id)} install={install} />
      : <S.RoleApp me={me} route={route || { name: S.HOME[me.role] }} onGo={r => go(r)} onBack={() => (history.length > 1 ? history.back() : go({ name: S.HOME[me.role], replace: true }))} realCamera />;
    return <S.AccountCtx.Provider value={acc}>
      <NoticeHost resetKey={me && me.id}>{body}</NoticeHost>
      <Sheet open={chooser} onClose={() => setChooser(false)} title="Switch person" side={app.bp === "phone" ? "bottom" : "center"} detent="large">
        <S.PeopleList current={me && me.id} onPick={id => { setChooser(false); signIn(id); }} />
      </Sheet>
      {splash && <Splash workspace={WS} onDone={() => { setSplash(false); try { sessionStorage.setItem("sc3-app-splash", "1"); } catch (e) {} }} />}
    </S.AccountCtx.Provider>;
  }

  /* ======================= live mode (SC-73): the workspace on backend-api, simulated ======================= */
  // What backend-api and its stream would say, played in this browser on the prototype's journey: the connection, the
  // journey clock (the client's setting: one journey day lasts five minutes here), the batches the Watcher flagged,
  // uploads, a step that does not go through, and the first-run push step. Each of SC-68's moments starts from ?state=.
  const DAY = { date: D.JOURNEY.today, long: "Friday 2 October", time: "09:31", perDay: 5 };
  const STATES = {
    "signin":         { label: "Sign-in", group: "Sign-in" },
    "signin-wrong":   { label: "A wrong sign-in", group: "Sign-in", si: "wrong" },
    "signin-busy":    { label: "Signing in", group: "Sign-in", si: "busy" },
    "not-member":     { label: "Signed in, not a member", group: "Sign-in", si: "outsider" },
    "firstload":      { label: "The first load", group: "Live states", who: "priya", route: "command", stage: 5, two: true, load: true, conn: "connecting" },
    "push-ask":       { label: "Push: the ask", group: "Push permission", who: "priya", route: "command", stage: 5, two: true, push: "ask" },
    "push-install":   { label: "Push: install first (iPhone)", group: "Push permission", who: "priya", route: "command", stage: 5, two: true, push: "install" },
    "push-denied":    { label: "Push: blocked", group: "Push permission", who: "priya", route: "command", stage: 5, two: true, push: "denied" },
    "live":           { label: "Live, two batches flagged", group: "Clock and focus", who: "priya", route: "command", stage: 5, two: true },
    "route-switch":   { label: "Switching batch in the Route Room", group: "Clock and focus", who: "priya", route: "route", ref: "MF-2410-118", stage: 5, two: true },
    "reconnecting":   { label: "Reconnecting", group: "Live states", who: "priya", route: "command", stage: 5, two: true, conn: "reconnecting" },
    "offline":        { label: "Offline", group: "Live states", who: "priya", route: "route", ref: "MF-2409-117", stage: 5, two: true, conn: "offline" },
    "quiet":          { label: "A quiet day", group: "Live states", who: "priya", route: "command", stage: 9, quiet: true, clock: { date: "Sat 31 Oct", long: "Saturday 31 October", time: "09:14" } },
    "quiet-partner":  { label: "A quiet day, Rakesh bhai", group: "Live states", who: "rakesh", route: "home", stage: 9, quiet: true, clock: { date: "Sat 31 Oct", long: "Saturday 31 October", time: "09:14" } },
    "quiet-kirana":   { label: "A quiet day, Ganesh ji", group: "Live states", who: "ganesh", route: "home", stage: 1, quiet: true, clock: { date: "Thu 1 Oct", long: "Thursday 1 October", time: "17:05" } },
    "approve-failed": { label: "Approve failed", group: "Live states", who: "priya", route: "route", ref: "MF-2409-117", stage: 5, two: true, fail: true },
    "upload-photo":   { label: "Uploading the label photo", group: "Live states", who: "rakesh", route: "photo", stage: 2, photo: true, upload: "photo", clock: { time: "09:18" } },
    "upload-dms":     { label: "Uploading the DMS export", group: "Live states", who: "priya", route: "setup", stage: 0, upload: "dms", clock: { date: "Thu 1 Oct", long: "Thursday 1 October", time: "16:33" } },
  };
  const STATE = STATES[Q.get("state")] ? Q.get("state") : null;
  const SCN = Object.assign({ conn: "live" }, STATE ? STATES[STATE] : {});
  const FAILED = "Smart-Clearance didn't answer in time.";
  const WRONG = "That email and password do not match an account in this workspace.";
  const OUTSIDER = "This account is not a member of this workspace.";
  // the live sign-in's addresses: Munchly's people on munchly.example, everyone else on google.example (core/world.js)
  const W = window.SC3_WORLD;
  const loginOf = id => { const m = W && W.MEMBERS.find(x => x.id === id); return m ? m.login : (userById(id) || {}).email; };
  const idOfLogin = email => { const v = email.trim().toLowerCase(); const m = W ? W.MEMBERS.find(x => x.login === v) : Store.get().users.find(u => (u.email || "").toLowerCase() === v); return m && m.id; };
  S.liveDomain = () => (W ? W.DOMAINS.staff : WS.emailDomain);
  // the story's people a judge may sign in as (backend-api's public page: accounts), by where they stand
  const ACCOUNTS = D.EXPLORE.groups.map(g => ({ group: g.group, people: g.ids.map(([id]) => { const u = userById(id); return u && { id, name: u.name, short: u.short, img: u.img, email: loginOf(id) }; }).filter(Boolean) }));

  // the journey clock steps by a quarter hour; at 1 day = 5 min that is every 3.1 s of real time. Still in a still
  function useClock(base) {
    const [k, setK] = useState(0); const step = base.perDay * 60000 / 96;
    useEffect(() => { if (SHOT || base.perDay >= 1440) return; const t = setInterval(() => setK(x => x + 1), step); return () => clearInterval(t); }, [step]);
    if (!k) return base;
    const [h, m] = base.time.split(":").map(Number); const t = h * 60 + m + k * 15;
    return Object.assign({}, base, { time: String(Math.floor(t / 60) % 24).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0") });
  }
  // a file on its way: its progress, 0 to 1, then done (a still holds it part-way)
  function useUploads() {
    const [up, setUp] = useState(() => (SCN.upload ? { [SCN.upload]: 0.62 } : {})); const raf = useRef({});
    const stop = kind => { cancelAnimationFrame(raf.current[kind]); setUp(u => { const x = Object.assign({}, u); delete x[kind]; return x; }); };
    const start = (kind, ms, done) => {
      if (SHOT) return; const t0 = performance.now(); const from = up[kind] || 0;
      const tick = now => { const p = Math.min(1, from + (now - t0) / ms); setUp(u => Object.assign({}, u, { [kind]: p })); if (p < 1) raf.current[kind] = requestAnimationFrame(tick); else { stop(kind); done && done(); } };
      raf.current[kind] = requestAnimationFrame(tick);
    };
    useEffect(() => () => Object.values(raf.current).forEach(cancelAnimationFrame), []);
    return [up, start, stop];
  }
  // the splash (the console's, console/splash.js) in the workspace's words: what is read on the first load and after
  // signing in, each landing as its read would
  const SP = () => window.SC3_SPLASH;
  const greet = time => { const h = Number(time.slice(0, 2)); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
  const READS = { workspace: `${WS.name}' workspace`, session: "Signed in", batches: "Today's batches", live: "Live updates" };
  const reads = ids => ids.map(id => ({ id, label: READS[id] }));
  const later = (ms, f) => (SHOT ? null : setTimeout(f, ms));
  const MARK = { app: ".sb-brand .mark, .sidebar .mark, .ws-lead .mark", signin: ".si-ws .wsmark" };

  function LiveApp() {
    const app = useApp(); const s = S.useStore(); const { toast } = useNotice();
    const [session, setSession] = useState(() => (SCN.who ? { uid: SCN.who } : STATE ? null : readSession()));
    const [route, go] = useHashRoute();
    const [conn, setConn] = useState(SCN.conn); const [since, setSince] = useState((SCN.clock || DAY).time);
    const [two, setTwo] = useState(!!SCN.two); const quiet = !!SCN.quiet;
    const [failed, setFailed] = useState(SCN.fail ? { action: "approve", message: FAILED } : null); const failNext = useRef(!!SCN.fail);
    const [push, setPush] = useState(SCN.push || null);
    const [up, startUpload, stopUpload] = useUploads();
    const clock = useClock(Object.assign({}, DAY, SCN.clock || {}));
    const me = session && s.users.find(u => u.id === session.uid && u.status === "active");
    useMemo(() => { if (SCN.stage != null) Flow.fastForward(SCN.stage); if (SCN.photo) Store.update(st => { Flow.A.requestPhoto(st); }); }, []);
    useEffect(() => { Flow.Agents.auto = true; Flow.Agents.maxStage = Infinity; Flow.Agents.setLive(!SHOT); return () => Flow.Agents.setLive(false); }, []);
    useEffect(() => { Flow.Agents.plays = id => !!me && id === me.id; Flow.Agents.reconcile(); }, [me && me.id]);
    useEffect(() => { document.title = me ? `${me.short || me.name} · ${me.role === "buyer" ? "ExpireSoon" : WS.name + " · Smart-Clearance"}` : `Sign in · ${WS.name} · Smart-Clearance`; }, [me && me.id]);
    useEffect(() => { if (STATE && SCN.route) go({ name: SCN.route, params: SCN.ref ? { ref: SCN.ref } : undefined, replace: true }); if (SCN.fail) setTimeout(() => window.dispatchEvent(new Event("sc3:approve-open")), 400); }, []);

    // the stream: a drop is remembered at the journey time it happened; outside a still it comes back after a while
    const prev = useRef(conn);
    useEffect(() => {
      const was = prev.current; prev.current = conn;
      if (conn === "live" && (was === "reconnecting" || was === "offline")) toast({ text: `Back live. Caught up from ${since}.`, tone: "ok", icon: "activity" });
      if (conn !== "reconnecting" && conn !== "offline") return;
      const t = later(5200, () => setConn("live")); return () => clearTimeout(t);
    }, [conn]);
    const reconnect = () => { setConn("connecting"); later(1200, () => setConn("live")); };

    // the first load: the splash covers the reads, then opens onto the page (a still of it holds, three reads in)
    useEffect(() => {
      const sp = SP(); if (!sp) return; sp.animate = window.Motion && window.Motion.animate;
      if (sp.active !== "boot") return;
      if (!session) { sp.reads(reads(["workspace", "session"])); later(300, () => sp.mark("workspace")); later(500, () => { sp.mark("session"); sp.open({ anchor: MARK.signin }); }); return; }
      const u = userById(session.uid); sp.say({ title: `${greet(clock.time)}, ${u.short || u.name}` }); sp.reads(reads(["workspace", "session", "batches", "live"]));
      if (SHOT) { ["workspace", "session", "batches"].forEach(id => sp.mark(id)); return; }
      later(300, () => sp.mark("workspace")); later(700, () => sp.mark("session")); later(1600, () => sp.mark("batches"));
      later(2100, () => { sp.mark("live"); setConn("live"); sp.open({ anchor: MARK.app }); });
    }, []);

    // signing in: the check, a welcome, then the splash while the workspace's reads land; the first sign-in on this
    // device ends on the push step
    const check = (email, pw) => new Promise((ok, no) => setTimeout(() => {
      const id = idOfLogin(email); const u = id && userById(id);
      if (/@smartclearance\./i.test(email.trim())) return no({ outsider: true, message: OUTSIDER });
      if (!u || !pw || u.status !== "active") return no(new Error(WRONG));
      ok(u);
    }, 1000));
    const signedIn = async u => {
      const sp = SP(); const v = { uid: u.id, at: Date.now() };
      if (sp) { const from = document.querySelector(MARK.signin); await sp.begin("enter", { who: u.short || u.name, title: `${greet(clock.time)}, ${u.short || u.name}`, from: from && from.getBoundingClientRect(), reads: reads(["session", "workspace", "batches", "live"]) }); sp.mark("session"); }
      Flow.fastForward(5); setTwo(true); writeSession(v); setSession(v); setConn("connecting");
      const asked = (() => { try { return localStorage.getItem("sc3-live-push:" + u.id); } catch (e) { return null; } })();
      if (!asked && u.role !== "buyer") setPush(pushVariant());
      go({ name: S.HOME[u.role], replace: true });
      if (sp) { setTimeout(() => sp.mark("workspace"), 250); setTimeout(() => sp.mark("batches"), 700); setTimeout(() => { sp.mark("live"); setConn("live"); sp.open({ anchor: MARK.app }); }, 1100); } else setConn("live");
    };
    const signOut = async () => {
      const sp = SP(); if (sp) sp.begin("leave", { who: me && (me.short || me.name) });
      await new Promise(r => setTimeout(r, 600)); if (sp) { sp.mark("session-end"); sp.mark("firebase"); }
      writeSession(null); setSession(null); setPush(null); history.replaceState(null, "", location.pathname + location.search);
      if (sp) setTimeout(() => sp.open({ anchor: MARK.signin }), 50);
    };

    // the steps a person takes go through the simulated backend: an approval may not go through, and says why
    const act = (name, run) => new Promise(done => setTimeout(() => {
      if (name === "approve" && failNext.current) { failNext.current = false; setFailed({ action: name, message: FAILED, retry: () => act(name, run) }); done(false); return; }
      setFailed(null); run(); done(true);
    }, 900));
    const live = useMemo(() => ({
      conn, since, clock, reconnect, two, quiet,
      failed, act, retry: () => { const f = failed; setFailed(null); if (f && f.retry) f.retry(); }, dismiss: () => setFailed(null),
      uploads: up,
      sendPhoto: done => { if (conn === "offline") { setFailed({ action: "sendPhoto", message: "The workspace is offline. Check the connection." }); return; } startUpload("photo", 4200, done); },
      uploadExport: done => startUpload("dms", 6000, done), cancelUpload: stopUpload,
      prefill: STATE && SCN.si !== "outsider" ? loginOf("priya") : "", busy: SCN.si === "busy", wrong: SCN.si === "wrong" ? WRONG : "", wrongWords: WRONG,
      outsider: SCN.si === "outsider" ? { email: "neha.kulkarni@smartclearance.example", message: OUTSIDER } : null,
    }), [conn, since, clock.time, two, failed, up]);
    useEffect(() => { if (conn === "live" || conn === "connecting") setSince(clock.time); }, [clock.time, conn]);

    const acc = useMemo(() => ({ signOut }), [me && me.id]);
    const finishPush = () => { try { localStorage.setItem("sc3-live-push:" + me.id, "1"); } catch (e) {} setPush(null); };
    const pushStep = me && push ? { variant: push, onAllow: () => { toast({ text: `Notifications are on. The ${s.rules.watchTime} push reaches this device.`, tone: "ok", icon: "bell" }); finishPush(); }, onCheck: () => setPush(pushVariant()), onDone: finishPush } : null;
    return <S.LiveCtx.Provider value={live}><S.AccountCtx.Provider value={acc}>
      {!me ? <S.Live.SignInLive groups={ACCOUNTS} check={check} onSignedIn={signedIn} />
        : <S.RoleApp me={me} route={route || { name: S.HOME[me.role] }} onGo={r => go(r)} onBack={() => (history.length > 1 ? history.back() : go({ name: S.HOME[me.role], replace: true }))} realCamera pushStep={pushStep} />}
      {!SHOT && <Review />}
    </S.AccountCtx.Provider></S.LiveCtx.Provider>;
  }
  // the first-run step's variant: install first on an iPhone that has not added the app, blocked, or the ask
  function pushVariant() {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent); const standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
    if (ios && !standalone) return "install";
    return typeof Notification !== "undefined" && Notification.permission === "denied" ? "denied" : "ask";
  }
  // the review switcher: every moment of the live mode, outside the stills
  function Review() {
    const [open, setOpen] = useState(false);
    const groups = Object.entries(STATES).reduce((t, [id, st]) => { (t[st.group] = t[st.group] || []).push([id, st]); return t; }, {});
    const link = id => { const p = new URLSearchParams(location.search); p.set("state", id); p.delete("live"); return location.pathname + "?" + p.toString(); };
    return <div className="lv-review">
      <button type="button" className="lv-review-btn" aria-expanded={open} aria-controls="lv-review-list" onClick={() => setOpen(!open)}><K.Icon name={open ? "x" : "list"} size={18} /><span>{STATE ? STATES[STATE].label : "Live mode"}</span></button>
      {open && <nav id="lv-review-list" className="lv-review-list" aria-label="Live mode's moments">{Object.entries(groups).map(([g, list]) => <div key={g}><b>{g}</b>{list.map(([id, st]) => <a key={id} href={link(id)} aria-current={id === STATE ? "page" : undefined}>{st.label}</a>)}</div>)}</nav>}
    </div>;
  }

  function Root() { return <ThemeProvider><AppRoot className="app-root" style={{ position: "fixed", inset: 0 }}>{LIVE ? <NoticeHost><LiveApp /></NoticeHost> : <App />}</AppRoot></ThemeProvider>; }
  ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
})();
