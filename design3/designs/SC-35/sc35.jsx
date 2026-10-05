// SC-35 · the loader's part in React: the theme, with a gate. Choosing Light, Dark or Match device (or the device
// turning to night while the page follows it) no longer swaps the plates in front of the visitor: the loader covers
// the page, the theme changes underneath, and the loader lifts once the new plates are drawn (sc35-loader.js). On the
// mockups this stands in for the kit's ThemeProvider, useTheme, AppRoot and ModeMenuButton, which site.js and
// sc35-town.js read from window.SC3 as they load; the build would put the gate in the kit's own ThemeProvider.
(function () {
  const { useState, useEffect, useRef, createContext, useContext } = React;
  const K = window.SC3, LOAD = window.SC35_LOAD;
  const { IconButton, Menu, Icon } = K;
  const KitAppRoot = K.AppRoot;
  const TKEY = "sc3-theme";
  const Ctx = createContext({ mode: "system", resolved: "light", setMode: () => {} });
  const mq = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;
  const resolvedOf = (m, sysDark) => (m === "system" ? (sysDark ? "dark" : "light") : m);

  // where a switch comes from: the last press, or the Appearance button when the keyboard chose
  let press = null;
  document.addEventListener("pointerdown", e => { press = { x: e.clientX, y: e.clientY, t: performance.now() }; }, true);
  const originOf = () => {
    if (press && performance.now() - press.t < 1500) return [press.x, press.y];
    const b = document.querySelector('[aria-label="Appearance"]'), r = b && b.getBoundingClientRect();
    return r && r.width ? [r.left + r.width / 2, r.top + r.height / 2] : [innerWidth / 2, innerHeight / 2];
  };

  function ThemeProvider({ children, initial }) {
    const [mode, setModeState] = useState(() => { try { return localStorage.getItem(TKEY) || initial || "system"; } catch (e) { return initial || "system"; } });
    const [sysDark, setSysDark] = useState(mq ? mq.matches : false);
    const live = useRef(null), pending = useRef(null);
    live.current = { mode, sysDark };
    const resolved = resolvedOf(mode, sysDark);
    // a choice made while a switch is still playing waits for it, and only the last one counts
    const settle = () => { const p = pending.current; pending.current = null; if (p != null) choose(p); };
    const choose = m => {
      try { localStorage.setItem(TKEY, m); } catch (e) {}
      const L = live.current, to = resolvedOf(m, L.sysDark);
      if (LOAD.busy && LOAD.kind === "switch") { pending.current = m; return; }
      // nothing on the page changes (Match device on a device already in that theme), so there is nothing to load
      if (to === resolvedOf(L.mode, L.sysDark)) { setModeState(m); return; }
      LOAD.switchTheme({ to, origin: originOf(), apply: () => setModeState(m) }).then(settle);
    };
    // the device turning to night, or to day, while the page follows it plays the loader too
    useEffect(() => {
      if (!mq) return;
      const f = e => {
        if (live.current.mode !== "system" || (LOAD.busy && LOAD.kind === "switch")) { setSysDark(e.matches); return; }
        LOAD.switchTheme({ to: e.matches ? "dark" : "light", origin: [innerWidth / 2, innerHeight / 2], apply: () => setSysDark(e.matches) });
      };
      mq.addEventListener ? mq.addEventListener("change", f) : mq.addListener(f);
      return () => { mq.removeEventListener ? mq.removeEventListener("change", f) : mq.removeListener(f); };
    }, []);
    useEffect(() => {
      document.documentElement.setAttribute("data-theme", resolved);
      const meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (meta) meta.setAttribute("content", resolved === "dark" ? "#070b09" : "#f2f6f3");
    }, [resolved]);
    // React's first render is one of the first load's milestones
    useEffect(() => { LOAD.mark("app"); }, []);
    return <Ctx.Provider value={{ mode, resolved, setMode: choose }}>{children}</Ctx.Provider>;
  }
  const useTheme = () => useContext(Ctx);
  // the kit's root, told the theme by this provider
  function AppRoot(props) { const { resolved } = useTheme(); return <KitAppRoot {...props} theme={props.theme || resolved} />; }
  // the kit's Appearance menu, unchanged but for whose theme it reads
  function ModeMenuButton() {
    const { mode, resolved, setMode } = useTheme(); const [open, setOpen] = useState(false);
    const item = (id, label, icon) => ({ label, icon, checked: mode === id, right: mode === id && <Icon name="check" size={16} />, onClick: () => setMode(id) });
    return <span style={{ position: "relative" }}><IconButton icon={resolved === "dark" ? "moon" : "sun"} label="Appearance" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)} />
      <Menu open={open} onClose={() => setOpen(false)} width={200} items={[{ label: "Appearance", heading: true }, item("light", "Light", "sun"), item("dark", "Dark", "moon"), item("system", "Match device", "monitor")]} />
    </span>;
  }
  Object.assign(window.SC3, { ThemeProvider, useTheme, AppRoot, ModeMenuButton });

  // the mockups' label: which option, its replays, and the way back to the board (?bare leaves it off, for recordings)
  if (!/[?&]bare\b/.test(location.search)) {
    const NAMES = { a: "Option A · The route", b: "Option B · Dusk and dawn", c: "Option C · The lens" };
    const bar = document.createElement("div"); bar.className = "mock-bar"; bar.setAttribute("role", "note");
    bar.innerHTML = `<span>SC-35 · ${NAMES[LOAD.option] || ""}</span><button type="button" data-r="fast">Replay the load</button><button type="button" data-r="slow">As on a slow connection</button><a href="${window.SC35_BOARD || "../board.html"}">The board</a>`;
    bar.addEventListener("click", e => { const t = e.target.closest("button"); if (t) LOAD.replay(t.dataset.r === "slow"); });
    const put = () => document.body.appendChild(bar);
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", put) : put();
  }
})();
