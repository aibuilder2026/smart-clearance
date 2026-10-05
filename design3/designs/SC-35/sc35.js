(function() {
  const { useState, useEffect, useRef, createContext, useContext } = React;
  const K = window.SC3, LOAD = window.SC35_LOAD;
  const { IconButton, Menu, Icon } = K;
  const KitAppRoot = K.AppRoot;
  const TKEY = "sc3-theme";
  const Ctx = createContext({ mode: "system", resolved: "light", setMode: () => {
  } });
  const mq = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;
  const resolvedOf = (m, sysDark) => m === "system" ? sysDark ? "dark" : "light" : m;
  let press = null;
  document.addEventListener("pointerdown", (e) => {
    press = { x: e.clientX, y: e.clientY, t: performance.now() };
  }, true);
  const originOf = () => {
    if (press && performance.now() - press.t < 1500) return [press.x, press.y];
    const b = document.querySelector('[aria-label="Appearance"]'), r = b && b.getBoundingClientRect();
    return r && r.width ? [r.left + r.width / 2, r.top + r.height / 2] : [innerWidth / 2, innerHeight / 2];
  };
  function ThemeProvider({ children, initial }) {
    const [mode, setModeState] = useState(() => {
      try {
        return localStorage.getItem(TKEY) || initial || "system";
      } catch (e) {
        return initial || "system";
      }
    });
    const [sysDark, setSysDark] = useState(mq ? mq.matches : false);
    const live = useRef(null), pending = useRef(null);
    live.current = { mode, sysDark };
    const resolved = resolvedOf(mode, sysDark);
    const settle = () => {
      const p = pending.current;
      pending.current = null;
      if (p != null) choose(p);
    };
    const choose = (m) => {
      try {
        localStorage.setItem(TKEY, m);
      } catch (e) {
      }
      const L = live.current, to = resolvedOf(m, L.sysDark);
      if (LOAD.busy && LOAD.kind === "switch") {
        pending.current = m;
        return;
      }
      if (to === resolvedOf(L.mode, L.sysDark)) {
        setModeState(m);
        return;
      }
      LOAD.switchTheme({ to, origin: originOf(), apply: () => setModeState(m) }).then(settle);
    };
    useEffect(() => {
      if (!mq) return;
      const f = (e) => {
        if (live.current.mode !== "system" || LOAD.busy && LOAD.kind === "switch") {
          setSysDark(e.matches);
          return;
        }
        LOAD.switchTheme({ to: e.matches ? "dark" : "light", origin: [innerWidth / 2, innerHeight / 2], apply: () => setSysDark(e.matches) });
      };
      mq.addEventListener ? mq.addEventListener("change", f) : mq.addListener(f);
      return () => {
        mq.removeEventListener ? mq.removeEventListener("change", f) : mq.removeListener(f);
      };
    }, []);
    useEffect(() => {
      document.documentElement.setAttribute("data-theme", resolved);
      const meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (meta) meta.setAttribute("content", resolved === "dark" ? "#070b09" : "#f2f6f3");
    }, [resolved]);
    useEffect(() => {
      LOAD.mark("app");
    }, []);
    return /* @__PURE__ */ React.createElement(Ctx.Provider, { value: { mode, resolved, setMode: choose } }, children);
  }
  const useTheme = () => useContext(Ctx);
  function AppRoot(props) {
    const { resolved } = useTheme();
    return /* @__PURE__ */ React.createElement(KitAppRoot, { ...props, theme: props.theme || resolved });
  }
  function ModeMenuButton() {
    const { mode, resolved, setMode } = useTheme();
    const [open, setOpen] = useState(false);
    const item = (id, label, icon) => ({ label, icon, checked: mode === id, right: mode === id && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16 }), onClick: () => setMode(id) });
    return /* @__PURE__ */ React.createElement("span", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(IconButton, { icon: resolved === "dark" ? "moon" : "sun", label: "Appearance", "aria-haspopup": "menu", "aria-expanded": open, onClick: () => setOpen((o) => !o) }), /* @__PURE__ */ React.createElement(Menu, { open, onClose: () => setOpen(false), width: 200, items: [{ label: "Appearance", heading: true }, item("light", "Light", "sun"), item("dark", "Dark", "moon"), item("system", "Match device", "monitor")] }));
  }
  Object.assign(window.SC3, { ThemeProvider, useTheme, AppRoot, ModeMenuButton });
  if (!/[?&]bare\b/.test(location.search)) {
    const NAMES = { a: "Option A · The route", b: "Option B · Dusk and dawn", c: "Option C · The lens" };
    const bar = document.createElement("div");
    bar.className = "mock-bar";
    bar.setAttribute("role", "note");
    bar.innerHTML = `<span>SC-35 · ${NAMES[LOAD.option] || ""}</span><button type="button" data-r="fast">Replay the load</button><button type="button" data-r="slow">As on a slow connection</button><a href="${window.SC35_BOARD || "../board.html"}">The board</a>`;
    bar.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (t) LOAD.replay(t.dataset.r === "slow");
    });
    const put = () => document.body.appendChild(bar);
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", put) : put();
  }
})();
