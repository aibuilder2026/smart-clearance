(function() {
  const { useState, useEffect, useMemo, useCallback, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, Mark, Wordmark, Money, Roll, Sheet, Field, Input, OTP, ThemeProvider, AppRoot, NoticeHost, Splash, useApp, Product, Tracker } = K;
  Store.usePersistence();
  const SESSION = "sc3-session";
  const readSession = () => {
    try {
      return JSON.parse(localStorage.getItem(SESSION) || "null");
    } catch (e) {
      return null;
    }
  };
  const writeSession = (v) => {
    try {
      if (v) localStorage.setItem(SESSION, JSON.stringify(v));
      else localStorage.removeItem(SESSION);
    } catch (e) {
    }
  };
  const userById = (id) => Store.get().users.find((u) => u.id === id);
  const parseHash = () => {
    const m = /^#\/([a-z-]+)/.exec(location.hash || "");
    return m ? { name: m[1] } : null;
  };
  function useHashRoute() {
    const [route, setRoute] = useState(parseHash);
    useEffect(() => {
      const f = () => setRoute(parseHash());
      window.addEventListener("hashchange", f);
      window.addEventListener("popstate", f);
      return () => {
        window.removeEventListener("hashchange", f);
        window.removeEventListener("popstate", f);
      };
    }, []);
    const go = useCallback((r) => {
      const h = "#/" + r.name;
      if (location.hash === h) return;
      if (r.replace) history.replaceState(null, "", h);
      else history.pushState(null, "", h);
      setRoute({ name: r.name });
    }, []);
    return [route, go];
  }
  let deferred = null;
  const installers = /* @__PURE__ */ new Set();
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    installers.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installers.forEach((f) => f());
  });
  function useInstall() {
    const [, force] = useState(0);
    useEffect(() => {
      const f = () => force((x) => x + 1);
      installers.add(f);
      return () => installers.delete(f);
    }, []);
    const standalone = window.matchMedia && matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    return { can: !!deferred, standalone, prompt: async () => {
      if (!deferred) return;
      deferred.prompt();
      try {
        await deferred.userChoice;
      } catch (e) {
      }
      deferred = null;
      installers.forEach((f) => f());
    } };
  }
  if ("serviceWorker" in navigator && (location.protocol === "https:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {
  }));
  const DEMO = [["priya", "Approve the plan for the chips batch"], ["rakesh", "Send the label photo, run the van, dispatch"], ["ganesh", "Order from the Hindi offer"], ["venkat", "Bid on ExpireSoon"], ["anita", "Review the document pack"], ["vikram", "Export the BRSR table"], ["meera", "Confirm a food-bank pickup"], ["arjun", "Users, guardrails and the audit log"]];
  const TEST_CODE = "246810";
  const GoogleG = () => /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 48 48", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { fill: "#FFC107", d: "M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" }), /* @__PURE__ */ React.createElement("path", { fill: "#FF3D00", d: "M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" }), /* @__PURE__ */ React.createElement("path", { fill: "#4CAF50", d: "M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" }), /* @__PURE__ */ React.createElement("path", { fill: "#1976D2", d: "M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" }));
  function HeroStage() {
    const reduce = useReducedMotion();
    const [paused, setPaused] = useState(() => {
      try {
        return localStorage.getItem("sc3-hero-paused") === "1";
      } catch (e) {
        return false;
      }
    });
    const [k, setK] = useState(() => paused ? 9 : 0);
    useEffect(() => {
      if (reduce) {
        setK(9);
        return;
      }
      if (paused) return;
      let t;
      const tick = (x, first) => {
        t = setTimeout(() => {
          const n = x >= 9 ? 0 : x + 1;
          setK(n);
          tick(n);
        }, x >= 9 && !first ? 5200 : 1e3);
      };
      tick(k, true);
      return () => clearTimeout(t);
    }, [reduce, paused]);
    const toggle = () => {
      const next = !paused;
      setPaused(next);
      try {
        localStorage.setItem("sc3-hero-paused", next ? "1" : "0");
      } catch (e) {
      }
    };
    const stages = D.STAGES.map((x) => ({ id: x.id, title: x.title, human: x.human }));
    return /* @__PURE__ */ React.createElement("div", { className: cx("si-stage", paused && "paused") }, /* @__PURE__ */ React.createElement("div", { className: "si-renders", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: "pack-chips", size: 176, float: true, className: "r1" }), /* @__PURE__ */ React.createElement(Product, { name: "carton-hero", size: 208, float: true, className: "r2" }), /* @__PURE__ */ React.createElement(Product, { name: "pack-mango", size: 150, float: true, className: "r3" })), /* @__PURE__ */ React.createElement("div", { className: "si-figure" }, /* @__PURE__ */ React.createElement("span", { className: "si-cap" }, "Recovered from one batch of chips headed for the bin"), /* @__PURE__ */ React.createElement(Money, { value: k >= 9 ? D.ACTUAL.net : Math.round(D.ACTUAL.net * k / 9), size: "xl", roll: true, style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "si-cap" }, "instead of ", fmt.inr(-D.PLAN.writeOff.total), " to destroy it")), /* @__PURE__ */ React.createElement("div", { className: "si-track", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Tracker, { stages, done: Math.min(k, 9), current: k < 9 ? k : -1 })), !reduce && /* @__PURE__ */ React.createElement("div", { className: "si-ctl" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: toggle }, /* @__PURE__ */ React.createElement(Icon, { name: paused ? "play" : "pause", size: 15 }), paused ? "Play animation" : "Pause animation")));
  }
  function SignIn({ onSignIn, install }) {
    const app = useApp();
    const reduce = useReducedMotion();
    const [sheet, setSheet] = useState(null);
    const [phone, setPhone] = useState("");
    const [step, setStep] = useState(1);
    const [code, setCode] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(null);
    const users = Store.get().users;
    const google = users.filter((u) => u.provider === "google" && u.status === "active" && u.email && !u.extra);
    const open = (which) => {
      setErr("");
      setStep(1);
      setCode("");
      setSheet(which);
    };
    const pick = (id) => {
      setBusy(id);
      setTimeout(() => {
        setBusy(null);
        setSheet(null);
        onSignIn(id);
      }, 650);
    };
    const sendCode = () => {
      const d = phone.replace(/\D/g, "").slice(-10);
      if (d.length !== 10) {
        setErr("Enter a 10-digit mobile number.");
        return;
      }
      setErr("");
      setBusy("send");
      setTimeout(() => {
        setBusy(null);
        setStep(2);
      }, 700);
    };
    const verify = (v) => {
      const c = v || code;
      if (c.length < 6) return;
      setBusy("verify");
      setTimeout(() => {
        setBusy(null);
        if (c !== TEST_CODE) {
          setErr(`That code doesn't match. This prototype sends ${TEST_CODE}.`);
          setCode("");
          return;
        }
        const d = phone.replace(/\D/g, "").slice(-10);
        const u = users.find((x) => x.phone && x.phone.replace(/\D/g, "").slice(-10) === d);
        if (!u) {
          setErr("No account uses this number yet. Ask your distributor or Munchly for an invite.");
          setStep(1);
          return;
        }
        if (u.status !== "active") {
          setErr(u.status === "deactivated" ? "Your admin deactivated this account." : "Accept your invite first.");
          setStep(1);
          return;
        }
        setSheet(null);
        onSignIn(u.id);
      }, 800);
    };
    const phones = users.filter((u) => u.phone && u.status === "active").slice(0, 4);
    return /* @__PURE__ */ React.createElement("div", { className: "signin" }, /* @__PURE__ */ React.createElement("div", { className: "ground", "aria-hidden": "true" }), app.bp === "desktop" && /* @__PURE__ */ React.createElement(HeroStage, null), /* @__PURE__ */ React.createElement("div", { className: "si-panel" }, /* @__PURE__ */ React.createElement("div", { className: "si-card" }, /* @__PURE__ */ React.createElement("div", { className: "si-brand" }, /* @__PURE__ */ React.createElement(Mark, { size: 56, play: !reduce }), /* @__PURE__ */ React.createElement(Wordmark, { size: 24, play: !reduce })), app.bp !== "desktop" && /* @__PURE__ */ React.createElement("div", { className: "si-hero", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: "carton-hero", size: app.bp === "phone" ? 150 : 180, float: true }), /* @__PURE__ */ React.createElement(motion.div, { className: "si-chip", initial: reduce ? false : { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.9 } }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "MF-2409-117"), " · routed · ", /* @__PURE__ */ React.createElement(Money, { value: D.ACTUAL.net, size: "s", style: { fontSize: 15 } }), " recovered"))), /* @__PURE__ */ React.createElement("h1", { className: "si-title" }, "Every near-expiry carton gets a second chance."), /* @__PURE__ */ React.createElement("p", { className: "si-hi hi", lang: "hi" }, "हर कार्टन को दूसरा मौका"), /* @__PURE__ */ React.createElement("div", { className: "si-actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary btn-lg btn-block si-google", onClick: () => open("google") }, /* @__PURE__ */ React.createElement(GoogleG, null), "Continue with Google"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, icon: "smartphone", onClick: () => open("phone") }, "Continue with phone number"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-outline btn-lg btn-block si-es", onClick: () => open("es") }, /* @__PURE__ */ React.createElement("span", { className: "es-logo", style: { width: 22, height: 22, borderRadius: 7 } }, /* @__PURE__ */ React.createElement(Icon, { name: "hourglass", size: 13, stroke: 2.4 })), "Sign in with ExpireSoon")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link si-demo", onClick: () => open("demo") }, "Explore as someone in the story"), /* @__PURE__ */ React.createElement("div", { className: "si-foot" }, /* @__PURE__ */ React.createElement("span", null, "Prototype · every company, person and number is fictional"), install.can && /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: install.prompt }, /* @__PURE__ */ React.createElement(Icon, { name: "download", size: 15 }), "Install")))), /* @__PURE__ */ React.createElement(Sheet, { open: sheet === "google", onClose: () => setSheet(null), title: "Choose an account", side: app.bp === "phone" ? "bottom" : "center", detent: "medium" }, /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted", style: { margin: "0 0 10px" } }, "Brand staff and partners sign in with their work Google account."), /* @__PURE__ */ React.createElement("div", { className: "list" }, google.map((u) => /* @__PURE__ */ React.createElement("button", { type: "button", key: u.id, className: "list-row", onClick: () => pick(u.id), style: { gridTemplateColumns: "40px minmax(0,1fr) auto", width: "100%", textAlign: "left" } }, /* @__PURE__ */ React.createElement(Avatar, { person: u, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, u.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, u.email)), busy === u.id ? /* @__PURE__ */ React.createElement(K.Spinner, { size: 18 }) : /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18, className: "subtle" }))))), /* @__PURE__ */ React.createElement(
      Sheet,
      {
        open: sheet === "phone",
        onClose: () => setSheet(null),
        title: step === 1 ? "Your mobile number" : "Enter the code",
        side: app.bp === "phone" ? "bottom" : "center",
        detent: "medium",
        footer: step === 1 ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, loading: busy === "send", onClick: sendCode }, "Send code") : /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, loading: busy === "verify", disabled: code.length < 6, onClick: () => verify() }, "Verify and continue")
      },
      step === 1 ? /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement(Field, { label: "Mobile number", htmlFor: "si-phone", error: err, help: "Distributors and kirana owners sign in with a one-time code." }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "input", style: { width: 64, display: "grid", placeItems: "center", flex: "none" } }, "+91"), /* @__PURE__ */ React.createElement(Input, { id: "si-phone", inputMode: "numeric", autoComplete: "tel-national", placeholder: "98230 44118", value: phone, onChange: (e) => setPhone(e.target.value), onKeyDown: (e) => e.key === "Enter" && sendCode() }))), /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle strong" }, "Numbers in this prototype"), /* @__PURE__ */ React.createElement("div", { className: "row tight wrap" }, phones.map((u) => /* @__PURE__ */ React.createElement("button", { type: "button", key: u.id, className: "chip", onClick: () => setPhone(u.phone.replace("+91 ", "")) }, /* @__PURE__ */ React.createElement(Avatar, { person: u, size: "xs" }), u.short || u.name))))) : /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0 } }, "Sent to +91 ", phone.replace(/\D/g, "").slice(-10).replace(/(\d{5})(\d{5})/, "$1 $2"), ". This prototype's code is ", /* @__PURE__ */ React.createElement("b", { className: "mono" }, TEST_CODE), "."), /* @__PURE__ */ React.createElement(OTP, { value: code, onChange: (v) => {
        setCode(v);
        setErr("");
        if (v.length === 6) verify(v);
      }, autoFocus: true }), err && /* @__PURE__ */ React.createElement("p", { className: "t-footnote", style: { color: "var(--red-text)", margin: 0 }, role: "alert" }, err), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link", style: { alignSelf: "flex-start" }, onClick: () => {
        setStep(1);
        setCode("");
      } }, "Use a different number"))
    ), /* @__PURE__ */ React.createElement(Sheet, { open: sheet === "es", onClose: () => setSheet(null), title: "ExpireSoon account", side: app.bp === "phone" ? "bottom" : "center", detent: "medium" }, /* @__PURE__ */ React.createElement("div", { className: "esw" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "es-top" }, /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement("span", { className: "es-logo" }, /* @__PURE__ */ React.createElement(Icon, { name: "hourglass", size: 16, stroke: 2.2 })), /* @__PURE__ */ React.createElement("span", { className: "es-word" }, "ExpireSoon")), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Buyers sign in with their marketplace account")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "list-row card", onClick: () => pick("venkat"), style: { gridTemplateColumns: "40px minmax(0,1fr) auto", width: "100%", textAlign: "left" } }, /* @__PURE__ */ React.createElement(Avatar, { person: userById("venkat"), size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "Venkat · Sri Venkateswara Traders"), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "venkat@svtraders.in · Hyderabad")), busy === "venkat" ? /* @__PURE__ */ React.createElement(K.Spinner, { size: 18 }) : /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18, className: "subtle" }))))), /* @__PURE__ */ React.createElement(Sheet, { open: sheet === "demo", onClose: () => setSheet(null), title: "Explore as someone in the story", side: app.bp === "phone" ? "bottom" : "center", detent: "large" }, /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted", style: { margin: "0 0 10px" } }, "Everyone shares one live batch. Switch person from your profile at any time; partners you are not playing answer on their own."), /* @__PURE__ */ React.createElement("div", { className: "si-people" }, DEMO.map(([id, what]) => {
      const u = userById(id);
      return /* @__PURE__ */ React.createElement("button", { type: "button", key: id, className: "si-person", onClick: () => pick(id) }, /* @__PURE__ */ React.createElement(Avatar, { person: u, size: "lg" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 1 } }, /* @__PURE__ */ React.createElement("b", null, u.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, S.ROLES[u.role], " · ", u.org), /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, what)), busy === id && /* @__PURE__ */ React.createElement(K.Spinner, { size: 18 }));
    }))));
  }
  function App() {
    const [session, setSession] = useState(readSession);
    const [route, go] = useHashRoute();
    const [chooser, setChooser] = useState(false);
    const [splash, setSplash] = useState(() => {
      try {
        return !sessionStorage.getItem("sc3-app-splash");
      } catch (e) {
        return true;
      }
    });
    const install = useInstall();
    const app = useApp();
    const s = S.useStore();
    const me = session && s.users.find((u) => u.id === session.uid && u.status === "active");
    useEffect(() => {
      Flow.Agents.auto = true;
      Flow.Agents.maxStage = Infinity;
      Flow.Agents.setLive(true);
      return () => Flow.Agents.setLive(false);
    }, []);
    useEffect(() => {
      Flow.Agents.plays = (id) => !!me && id === me.id;
      Flow.Agents.reconcile();
    }, [me && me.id]);
    useEffect(() => {
      document.title = me ? `Smart-Clearance · ${me.short || me.name}` : "Smart-Clearance";
    }, [me && me.id]);
    const signIn = useCallback((id, r) => {
      const v = { uid: id, at: Date.now() };
      writeSession(v);
      setSession(v);
      const u = userById(id);
      Store.update((st) => {
        const x = st.users.find((y) => y.id === id);
        if (x) x.lastSeen = "now";
      });
      go({ name: r || S.HOME[u.role], replace: true });
    }, [go]);
    const signOut = useCallback(() => {
      writeSession(null);
      setSession(null);
      history.replaceState(null, "", location.pathname + location.search);
    }, []);
    const acc = useMemo(() => ({
      switchTo: (id, r) => {
        if (id) signIn(id, r);
        else setChooser(true);
      },
      signOut,
      reset: () => {
        Store.reset();
        Flow.Agents.reconcile();
      },
      install: install.can ? install.prompt : null,
      standalone: install.standalone
    }), [signIn, signOut, install.can, install.standalone]);
    const body = !me ? /* @__PURE__ */ React.createElement(SignIn, { onSignIn: (id) => signIn(id), install }) : /* @__PURE__ */ React.createElement(S.RoleApp, { me, route: route || { name: S.HOME[me.role] }, onGo: (r) => go(r), onBack: () => history.length > 1 ? history.back() : go({ name: S.HOME[me.role], replace: true }), realCamera: true });
    return /* @__PURE__ */ React.createElement(S.AccountCtx.Provider, { value: acc }, /* @__PURE__ */ React.createElement(NoticeHost, { resetKey: me && me.id }, body), /* @__PURE__ */ React.createElement(Sheet, { open: chooser, onClose: () => setChooser(false), title: "Switch person", side: app.bp === "phone" ? "bottom" : "center", detent: "large" }, /* @__PURE__ */ React.createElement("div", { className: "si-people" }, DEMO.map(([id, what]) => {
      const u = userById(id);
      return /* @__PURE__ */ React.createElement("button", { type: "button", key: id, className: cx("si-person", me && me.id === id && "on"), onClick: () => {
        setChooser(false);
        signIn(id);
      } }, /* @__PURE__ */ React.createElement(Avatar, { person: u, size: "lg" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 1 } }, /* @__PURE__ */ React.createElement("b", null, u.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, S.ROLES[u.role], " · ", u.org), /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, what)), me && me.id === id && /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green" }, "you"));
    }))), splash && /* @__PURE__ */ React.createElement(Splash, { onDone: () => {
      setSplash(false);
      try {
        sessionStorage.setItem("sc3-app-splash", "1");
      } catch (e) {
      }
    } }));
  }
  function Root() {
    return /* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { className: "app-root", style: { position: "fixed", inset: 0 } }, /* @__PURE__ */ React.createElement(App, null)));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Root, null));
})();
