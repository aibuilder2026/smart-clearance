(function() {
  const { useState, useEffect, useRef, useCallback, useMemo } = React;
  const K = window.SC3, D = window.SC3_DATA, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS;
  const { cx, Avatar, PhoneFrame, WindowFrame, AppRoot, NoticeHost, useTheme } = K;
  const WS = D.WORKSPACE;
  const LABEL = { priya: "Priya's", rakesh: "Rakesh bhai's", ganesh: "Ganesh ji's", agrawal: "Agrawal ji's", meera: "Meera's", "lakshmi-owner": "Lakshmi Agencies'", neha: "Neha's", shubham: "Shubham Provision's" };
  const PLACE = { priya: "Munchly Foods, Pune", rakesh: "Kalamna godown, Nagpur", ganesh: "Shree Ganesh Kirana, Itwari", agrawal: "Agrawal Wholesale, Raipur", meera: "Feeding India, Hyderabad", "lakshmi-owner": "Begum Bazaar godown, Hyderabad", neha: "Smart-Clearance, Bengaluru", shubham: "Dharampeth, Nagpur" };
  const NEHA = { id: "neha", name: "Neha Kulkarni", short: "Neha", org: "Smart-Clearance", role: "Super admin" };
  const EXTRA = { shubham: { id: "shubham", name: "Shubham Provision", short: "Shubham Provision", org: "Shubham Provision", role: "retailer", kind: "partner", status: "active", provider: "phone" } };
  const PREFILL = { priya: D.PEOPLE.priya.email, rakesh: D.PEOPLE.rakesh.phone.replace("+91 ", "") };
  const user = (id) => id === "neha" ? NEHA : Store.get().users.find((u) => u.id === id) || EXTRA[id] || D.PEOPLE[id] || { id, name: id, short: id };
  const runActs = (acts) => (acts || []).forEach((a) => typeof a === "function" ? Store.update(a) : Flow.run(a[0], a[1]));
  function sceneOf(station, j) {
    Flow.Agents.setLive(false);
    Flow.fastForward(station.ff || 0);
    runActs(station.prep);
    station.beats.slice(0, j).forEach((b) => runActs(b.acts));
    Store.update((s) => s.notifications.forEach((n) => n.read = true));
  }
  function usePlayer(ACTS, start, hold) {
    const [pos, setPos] = useState(() => Object.assign({ a: 0, s: 0, b: 0, applied: false }, start));
    const [playing, setPlaying] = useState(false);
    const act = ACTS[pos.a], station = act.stations[pos.s], beat = station.beats[pos.b];
    const go = useCallback((a, s, b) => {
      const st = ACTS[a].stations[s];
      if (!ACTS[a].console) sceneOf(st, b);
      setPos({ a, s, b, applied: false });
    }, [ACTS]);
    useEffect(() => {
      go(pos.a, pos.s, pos.b);
    }, []);
    const apply = useCallback(() => {
      if (pos.applied) return;
      if (!act.console) runActs(beat.acts);
      setPos((p) => Object.assign({}, p, { applied: true }));
    }, [pos, act, beat]);
    const next = useCallback(() => {
      if (!pos.applied && beat.acts && beat.acts.length) {
        apply();
        return;
      }
      if (pos.b + 1 < station.beats.length) {
        setPos((p) => Object.assign({}, p, { b: p.b + 1, applied: false }));
        return;
      }
      if (pos.s + 1 < act.stations.length) {
        go(pos.a, pos.s + 1, 0);
        return;
      }
      if (pos.a + 1 < ACTS.length) {
        go(pos.a + 1, 0, 0);
        return;
      }
      setPlaying(false);
      setPos((p) => Object.assign({}, p, { end: true }));
    }, [pos, beat, station, act, ACTS, apply, go]);
    const back = useCallback(() => {
      if (pos.b > 0) go(pos.a, pos.s, pos.b - 1);
      else if (pos.s > 0) go(pos.a, pos.s - 1, 0);
      else if (pos.a > 0) go(pos.a - 1, ACTS[pos.a - 1].stations.length - 1, 0);
    }, [pos, ACTS, go]);
    useEffect(() => {
      if (!playing || pos.end || hold) return;
      const t = setTimeout(next, !pos.applied && beat.acts && beat.acts.length ? beat.agent ? 1500 : 2400 : 2100);
      return () => clearTimeout(t);
    }, [playing, pos, beat, next, hold]);
    const flat = useMemo(() => {
      const out = [];
      ACTS.forEach((A, a) => A.stations.forEach((St, s) => St.beats.forEach((B, b) => out.push({ a, s, b }))));
      return out;
    }, [ACTS]);
    const at = flat.findIndex((x) => x.a === pos.a && x.s === pos.s && x.b === pos.b);
    return { pos, act, station, beat, go, next, back, playing, setPlaying, flat, at };
  }
  const findByText = (doc, sel, text) => [...doc.querySelectorAll(sel)].find((el) => el.textContent.trim().startsWith(text));
  function ConsoleDevice({ spec = {}, width = 1280, height = 800, scale = 1, focus, label = true }) {
    const ref = useRef(null);
    const theme = useTheme();
    const route = spec.console || "/overview", signin = !!spec.signin;
    const src = useMemo(() => `../console-frame.html?theme=${theme.resolved}${signin ? "&signin=1" : ""}#${route}`, [signin]);
    const beatKey = JSON.stringify([route, spec.scrollTo, spec.click, !!spec.prep]);
    useEffect(() => {
      const f = ref.current;
      let t1, t2;
      const drive = () => {
        try {
          const w = f.contentWindow, doc = f.contentDocument;
          if (!w || !doc) return;
          if (spec.prep) spec.prep(w);
          if (w.location.hash !== "#" + route) w.location.hash = route;
          t1 = setTimeout(() => {
            (spec.click || []).forEach((txt, i) => setTimeout(() => {
              const b = findByText(doc, "button, a", txt);
              b && b.click();
            }, i * 520));
            t2 = setTimeout(() => {
              const el = spec.scrollTo && findByText(doc, "h1, h2, h3, h4, .section-title, b, strong", spec.scrollTo);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              else {
                const m = doc.getElementById("main") || doc.querySelector(".scroll");
                m && m.scrollTo({ top: 0, behavior: "smooth" });
              }
            }, (spec.click || []).length * 520 + 120);
          }, 700);
        } catch (e) {
        }
      };
      if (f && f.contentDocument && f.contentDocument.readyState === "complete") drive();
      else f && f.addEventListener("load", drive, { once: true });
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }, [beatKey]);
    useEffect(() => {
      const f = ref.current;
      try {
        f && f.contentDocument && f.contentDocument.documentElement.setAttribute("data-theme", theme.resolved);
      } catch (e) {
      }
    }, [theme.resolved]);
    const onLoad = () => {
      const f = ref.current;
      try {
        f.contentDocument.documentElement.setAttribute("data-theme", theme.resolved);
      } catch (e) {
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "dev", style: { width: width * scale } }, label && /* @__PURE__ */ React.createElement(DevLabel, { who: "neha", kind: "laptop", focus }), /* @__PURE__ */ React.createElement("div", { className: cx("dev-ring", focus && "on"), style: { width: width * scale, height: height * scale, borderRadius: 14 * scale } }, /* @__PURE__ */ React.createElement("div", { style: { width, height, transform: `scale(${scale})`, transformOrigin: "top left" } }, /* @__PURE__ */ React.createElement(WindowFrame, { url: "https://smartclearance-console.web.app" + (signin ? "/sign-in" : route === "/overview" ? "/" : route), style: { width, height } }, /* @__PURE__ */ React.createElement("iframe", { ref, key: signin ? "in" : "app", title: "The Smart-Clearance console", src, onLoad, style: { position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, background: "var(--bg)" } })))));
  }
  function DevLabel({ who, kind, focus, amber }) {
    const me = user(who);
    return /* @__PURE__ */ React.createElement("div", { className: cx("dev-label", focus && "focus", focus && amber && "amber") }, /* @__PURE__ */ React.createElement(Avatar, { person: me, size: "sm" }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, (LABEL[who] || me.short || me.name) + " " + kind), /* @__PURE__ */ React.createElement("span", null, PLACE[who] || me.org)));
  }
  function Device({ kind, spec, time, date, scale = 1, width = 1280, height = 800, focus, amber, label = true, onRoute }) {
    S.useStore();
    const ref = useRef(null);
    const [route, setRoute] = useState({ name: spec.route, params: spec.params || {} });
    const key = `${spec.who}|${spec.route}|${JSON.stringify(spec.params || {})}`;
    useEffect(() => setRoute({ name: spec.route, params: spec.params || {} }), [key]);
    const me = user(spec.who);
    useEffect(() => {
      if (!spec.anchor || spec.lock) return;
      const t = setTimeout(() => {
        const root = ref.current;
        if (!root) return;
        const el = root.querySelector(`[data-anchor="${spec.anchor}"]`);
        const sc = root.querySelector(".scroll");
        if (!el || !sc) return;
        const k = sc.getBoundingClientRect().height / (sc.clientHeight || 1) || 1;
        sc.scrollTo({ top: Math.max(0, (el.getBoundingClientRect().top - sc.getBoundingClientRect().top) / k + sc.scrollTop - 64), behavior: "smooth" });
      }, 420);
      return () => clearTimeout(t);
    }, [spec.anchor, key, !!spec.lock]);
    const go = (r) => {
      setRoute({ name: r.name, params: r.params || {} });
      onRoute && onRoute(r);
    };
    const app = spec.lock ? /* @__PURE__ */ React.createElement(S.LockScreen, { who: spec.lock.who, push: spec.lock.push, time, date, onOpen: () => {
    } }) : spec.signin ? /* @__PURE__ */ React.createElement(NoticeHost, { resetKey: "in-" + spec.who }, /* @__PURE__ */ React.createElement(S.SignIn, { guided: true, key: spec.signin, prefill: PREFILL[spec.signin], onSignIn: () => {
    } })) : /* @__PURE__ */ React.createElement(NoticeHost, { resetKey: spec.who }, /* @__PURE__ */ React.createElement(S.RoleApp, { key: me.id, me, route, onGo: go, onBack: () => go({ name: S.HOME[me.role] }) }));
    if (kind === "bare") return /* @__PURE__ */ React.createElement(AppRoot, { embedded: true, className: "real-app", style: { position: "absolute", inset: 0, "--safe-top": "calc(env(safe-area-inset-top, 0px) + 60px)" } }, app);
    const lbl = label && /* @__PURE__ */ React.createElement(DevLabel, { who: spec.who, kind: kind === "phone" ? "phone" : "laptop", focus, amber });
    if (kind === "phone") return /* @__PURE__ */ React.createElement("div", { className: "dev", style: { width: 414 * scale } }, lbl, /* @__PURE__ */ React.createElement("div", { className: cx("dev-ring", focus && "on", amber && "amber"), style: { width: 414 * scale, height: 868 * scale, borderRadius: 60 * scale } }, /* @__PURE__ */ React.createElement("div", { ref, style: { width: 414, height: 868, transform: `scale(${scale})`, transformOrigin: "top left" } }, /* @__PURE__ */ React.createElement(PhoneFrame, { time, dark: !!spec.lock }, app))));
    const path = spec.signin ? "sign-in" : [route.name || S.HOME[me.role], route.params && route.params.ref].filter(Boolean).join("/") + (route.params && route.params.tab ? "?tab=" + route.params.tab : route.params && route.params.reading ? "?reading=" + route.params.reading : "");
    const url = me.role === "buyer" ? "https://expiresoon.example/l/ES-24117" : `https://${WS.domain}/${path}`;
    return /* @__PURE__ */ React.createElement("div", { className: "dev", style: { width: width * scale } }, lbl, /* @__PURE__ */ React.createElement("div", { className: cx("dev-ring", focus && "on", amber && "amber"), style: { width: width * scale, height: height * scale, borderRadius: 14 * scale } }, /* @__PURE__ */ React.createElement("div", { ref, style: { width, height, transform: `scale(${scale})`, transformOrigin: "top left" } }, /* @__PURE__ */ React.createElement(WindowFrame, { url, style: { width, height } }, /* @__PURE__ */ React.createElement(AppRoot, { embedded: true, style: { position: "absolute", inset: 0 } }, app)))));
  }
  const specsOf = (station, beat) => ({ desk: Object.assign({}, station.desk, beat.desk), phone: beat.phone === null ? null : station.phone === null && !beat.phone ? null : Object.assign({}, station.phone, beat.phone) });
  function useSize(ref) {
    const [sz, set] = useState({ w: 0, h: 0 });
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const ro = new ResizeObserver(([e]) => set({ w: e.contentRect.width, h: e.contentRect.height }));
      ro.observe(el);
      return () => ro.disconnect();
    }, []);
    return sz;
  }
  function Stage({ station, beat, act, size, phoneOnly, labels = true, gap = 40, real }) {
    const W = size.w, H = size.h;
    const sp = specsOf(station, beat);
    const labelH = labels ? 50 : 0;
    const time = beat.time || "09:00", date = beat.date || station.date;
    const focus = beat.focus;
    if (real) {
      if (act.console) return /* @__PURE__ */ React.createElement("iframe", { title: "The Smart-Clearance console", src: `../console-frame.html#${sp.desk.console || "/overview"}`, style: { position: "absolute", inset: "60px 0 0", width: "100%", height: "calc(100% - 60px)", border: 0 } });
      const spec = focus === "desk" ? sp.desk : sp.phone || sp.desk;
      return /* @__PURE__ */ React.createElement(Device, { kind: "bare", spec, time, date });
    }
    if (!W || !H) return null;
    if (act.console) {
      const winW2 = 1440;
      const sw2 = Math.min(1, Math.max(0.3, Math.min((W - 8) / winW2, (H - labelH - 8) / 860)));
      return /* @__PURE__ */ React.createElement("div", { className: "devices" }, /* @__PURE__ */ React.createElement(ConsoleDevice, { spec: sp.desk, width: winW2, height: Math.max(720, (H - labelH - 8) / sw2), scale: sw2, focus: true, label: labels }));
    }
    const hasPhone = !!sp.phone;
    const ps = Math.min(0.84, Math.max(0.3, (H - labelH - 8) / 868));
    if (phoneOnly) {
      const spec = focus === "desk" ? sp.desk : sp.phone || sp.desk;
      return /* @__PURE__ */ React.createElement("div", { className: "devices" }, /* @__PURE__ */ React.createElement(Device, { kind: "phone", spec, time, date, scale: Math.min(1.04, ps * 1.18), focus: true, amber: beat.human, label: labels }));
    }
    const winW = 1280;
    const avail = W - (hasPhone ? 414 * ps + gap : 0);
    const sw = Math.min(1, Math.max(0.3, avail / winW));
    const winH = Math.max(640, (H - labelH - 8) / sw);
    return /* @__PURE__ */ React.createElement("div", { className: "devices", style: { gap } }, /* @__PURE__ */ React.createElement(Device, { kind: "desk", spec: sp.desk, time, date, scale: sw, width: winW, height: winH, focus: focus === "desk", amber: focus === "desk" && beat.human, label: labels }), hasPhone && /* @__PURE__ */ React.createElement(Device, { kind: "phone", spec: sp.phone, time, date, scale: ps, focus: focus === "phone", amber: focus === "phone" && beat.human, label: labels }));
  }
  function useBeatFx(player) {
    const { pos, beat, act } = player;
    useEffect(() => {
      if (act.console) return;
      const t = setTimeout(() => {
        if (beat.event) window.dispatchEvent(new Event(beat.event));
        if (beat.click) {
          const b = [...document.querySelectorAll(".device-window button")].find((x) => x.textContent.trim() === beat.click);
          b && b.click();
        }
      }, 900);
      return () => clearTimeout(t);
    }, [pos.a, pos.s, pos.b]);
  }
  window.SC167_DEV = { user, NEHA, LABEL, PLACE, sceneOf, runActs, usePlayer, useBeatFx, ConsoleDevice, Device, DevLabel, Stage, specsOf, useSize };
})();
