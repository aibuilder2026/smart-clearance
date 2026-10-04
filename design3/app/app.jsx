// Smart-Clearance v3 · the app: Munchly's workspace at munchly.smartclearance.com. Sign-in, every role, the agents
// running live, persisted per browser, installable.
(function () {
  const { useState, useEffect, useMemo, useCallback, useRef, Fragment } = React;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS;
  const { Sheet, ThemeProvider, AppRoot, NoticeHost, Splash, useApp } = K;
  const WS = D.WORKSPACE;

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

  function Root() { return <ThemeProvider><AppRoot className="app-root" style={{ position: "fixed", inset: 0 }}><App /></AppRoot></ThemeProvider>; }
  ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
})();
