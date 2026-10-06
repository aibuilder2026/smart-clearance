(function() {
  const { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef, Fragment, useSyncExternalStore } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, P = window.SC3_PLATFORM, S = window.SC3_SCREENS;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Segmented, Switch, Stepper, Sheet, Alert, Field, Input, Select, Menu, Tabs, Check, DataTable, Empty, Mark, Wordmark, WorkspaceMark, Page, Shell, Tracker, TrackerCompact, Product, ThemeProvider, AppRoot, NoticeHost, useApp, useNotice, ModeMenuButton } = K;
  const { Columns, SectionTitle } = S;
  P.usePersistence();
  const usePlatform = () => useSyncExternalStore(P.subscribe, P.get);
  const LINKS = Object.assign({ site: "../site/Smart-Clearance%20site%20v3.html", app: "../app/Smart-Clearance%20app%20v3.html", demo: "../demo/Smart-Clearance%20demo%20v3.html" }, window.SC3_LINKS || {});
  const PLATE = (window.SC3_SITE_IMG || "../site/assets/plates/") + "scene.webp";
  const STAGES = D.STAGES.map((x) => ({ id: x.id, title: x.title, human: x.human }));
  const AGENT = (id) => P.AGENTS.find((a) => a.id === id);
  const LEVEL = (id) => P.AUTONOMY.find((x) => x.id === id);
  const hhmm = () => {
    const d = /* @__PURE__ */ new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  };
  const parse = () => {
    const m = /^#\/([a-z-]+)(?:\/([a-z0-9-]+))?(?:\/([a-z-]+))?/.exec(location.hash || "");
    return m ? { name: m[1], id: m[2] || null, tab: m[3] || null } : { name: "overview", id: null, tab: null };
  };
  function useHashRoute() {
    const [route, setRoute] = useState(parse);
    useEffect(() => {
      const f = () => setRoute(parse());
      window.addEventListener("hashchange", f);
      window.addEventListener("popstate", f);
      return () => {
        window.removeEventListener("hashchange", f);
        window.removeEventListener("popstate", f);
      };
    }, []);
    const go = useCallback((name, id, tab, replace) => {
      const h = "#/" + [name, id, tab].filter(Boolean).join("/");
      if (location.hash !== h) {
        if (replace) history.replaceState(null, "", h);
        else history.pushState(null, "", h);
      }
      setRoute(parse());
    }, []);
    return [route, go];
  }
  const SESSION = "sc3-console-session";
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
  const NAV = [
    { id: "overview", label: "Overview", short: "Today", icon: "layout-dashboard" },
    { id: "clients", label: "Clients", icon: "building-2" },
    { id: "agents", label: "Agents", icon: "bot" },
    { id: "connectors", label: "Connectors", icon: "plug", phoneHidden: true },
    { id: "plans", label: "Plans", icon: "layout-grid", phoneHidden: true },
    { id: "staff", label: "Staff", icon: "users", phoneHidden: true },
    { id: "audit", label: "Audit log", short: "Audit", icon: "scroll-text" }
  ];
  function Screen({ title, sub, back, onBack, actions, children }) {
    const app = useApp();
    return /* @__PURE__ */ React.createElement(Page, { title, sub, back, onBack, actions: /* @__PURE__ */ React.createElement(React.Fragment, null, actions, app.bp !== "phone" && /* @__PURE__ */ React.createElement(ModeMenuButton, null)) }, children);
  }
  const statusBadge = (c) => c.status === "live" ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", dot: true }, "Live") : /* @__PURE__ */ React.createElement(Badge, { size: "sm", dot: true }, "Setting up");
  const planName = (id) => (P.PLANS.find((p) => p.id === id) || { name: id }).name;
  const agentsOn = (c) => P.AGENTS.filter((a) => !a.gate && c.agents[a.id].on).length;
  const WRONG = "That email and password don't match. Check both, or ask a Super admin to put your account back on its first password.";
  function SignIn({ onIn }) {
    const app = useApp();
    const s = usePlatform();
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [show, setShow] = useState(false);
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const [find, setFind] = useState(false);
    const submit = (e) => {
      e.preventDefault();
      setErr("");
      const who = s.staff.find((x) => x.status === "active" && x.email.toLowerCase() === email.trim().toLowerCase());
      if (!who || !pw) {
        setErr(WRONG);
        return;
      }
      setBusy(true);
      setTimeout(() => {
        setBusy(false);
        onIn(who.id);
      }, 600);
    };
    const edit = (set) => (e) => {
      set(e.target.value);
      setErr("");
    };
    return /* @__PURE__ */ React.createElement("div", { className: "signin cs-signin" }, /* @__PURE__ */ React.createElement("div", { className: "ground", "aria-hidden": "true" }), app.bp === "desktop" && /* @__PURE__ */ React.createElement("div", { className: "cs-si-stage" }, /* @__PURE__ */ React.createElement("div", { className: "si-product" }, /* @__PURE__ */ React.createElement(Mark, { size: 36 }), /* @__PURE__ */ React.createElement(Wordmark, { size: 21 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("h2", { className: "cs-si-title" }, "Console"), /* @__PURE__ */ React.createElement("p", { className: "cs-si-lede" }, "Set up and run every client's workspace: its agents, its supply chain, its people.")), /* @__PURE__ */ React.createElement("img", { className: "cs-si-plate", src: PLATE, alt: "", width: "1376", height: "752" })), /* @__PURE__ */ React.createElement("div", { className: "si-panel" }, /* @__PURE__ */ React.createElement("div", { className: "si-card" }, /* @__PURE__ */ React.createElement("div", { className: "si-ws" }, /* @__PURE__ */ React.createElement(Mark, { size: app.bp === "phone" ? 52 : 60 }), /* @__PURE__ */ React.createElement("div", { className: "si-ws-name" }, "Smart-Clearance staff"), /* @__PURE__ */ React.createElement("span", { className: "si-url" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 12, stroke: 2.2 }), "console.smartclearance.com")), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("h1", { className: "si-title" }, "Sign in"), /* @__PURE__ */ React.createElement("p", { className: "si-sub" }, "Your smartclearance.com email address and your password.")), /* @__PURE__ */ React.createElement("form", { className: "si-form", noValidate: true, onSubmit: submit }, /* @__PURE__ */ React.createElement(Field, { label: "Work email", htmlFor: "si-email" }, /* @__PURE__ */ React.createElement(Input, { id: "si-email", icon: "mail", type: "email", value: email, onChange: edit(setEmail), autoComplete: "username", spellCheck: false, autoCapitalize: "none", placeholder: "name@smartclearance.com" })), /* @__PURE__ */ React.createElement(Field, { label: "Password", htmlFor: "si-pw" }, /* @__PURE__ */ React.createElement("span", { className: "input-wrap cs-si-pw" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 17 }), /* @__PURE__ */ React.createElement("input", { id: "si-pw", className: "input", type: show ? "text" : "password", value: pw, onChange: edit(setPw), autoComplete: "current-password" }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "cs-si-eye", "aria-label": show ? "Hide password" : "Show password", "aria-pressed": show, onClick: () => setShow(!show) }, /* @__PURE__ */ React.createElement(Icon, { name: show ? "eye-off" : "eye", size: 20 })))), err && /* @__PURE__ */ React.createElement("div", { className: "cs-si-error", role: "alert" }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-alert", size: 18 }), /* @__PURE__ */ React.createElement("span", null, err)), /* @__PURE__ */ React.createElement(Button, { type: "submit", variant: "primary", size: "lg", block: true, icon: "log-in", loading: busy }, "Sign in"), /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted cs-si-hint" }, "New to the console? The platform team gives you your first password. Nothing is sent by email.")), /* @__PURE__ */ React.createElement("div", { className: "si-foot" }, /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted", style: { maxWidth: "36ch" } }, "Client teams sign in at their own workspace address, such as munchly.smartclearance.com."), /* @__PURE__ */ React.createElement("span", { className: "si-foot-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link btn-sm", onClick: () => setFind(true) }, "Find a workspace"), /* @__PURE__ */ React.createElement("a", { className: "btn btn-link btn-sm", href: LINKS.site }, "smartclearance.com")), /* @__PURE__ */ React.createElement("span", { className: "si-note" }, "Prototype · every person and number is fictional")))), /* @__PURE__ */ React.createElement(S.FindWorkspace, { open: find, onClose: () => setFind(false), onUse: () => {
      setFind(false);
      if (!window.open(LINKS.app, "_blank", "noopener")) location.href = LINKS.app;
    } }));
  }
  function Overview({ go, me }) {
    const s = usePlatform();
    const app = useApp();
    const { toast } = useNotice();
    const live = s.clients.filter((c) => c.status === "live");
    const on = live.reduce((t, c) => t + agentsOn(c), 0);
    const date = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    const attention = [];
    s.clients.forEach((c) => {
      c.distributors.filter((d) => d.permission !== "given").forEach((d) => attention.push({ id: c.id + "-" + d.id, c, icon: "hand", tone: "amber", title: d.name, text: "one-time permission not given yet", act: "Ask again", run: () => {
        P.update(() => {
        }, { who: me.name, client: c.id, text: `Asked ${d.name} again for its one-time permission` });
        toast({ text: `Reminder sent to ${d.name}`, tone: "ok" });
      } }));
      if (c.status !== "live") {
        const admin = c.people.find((p) => p.access === "Admin");
        attention.push({ id: c.id + "-invite", c, icon: "user-plus", tone: "amber", title: c.name, text: `waiting for ${admin ? admin.name : "its admin"} to accept the invitation`, act: "Open", run: () => go("clients", c.id, "people") });
      }
    });
    if (s.clients.some((c) => c.id === "munchly")) attention.push({ id: "gupta-export", c: s.clients.find((c) => c.id === "munchly"), icon: "file-spreadsheet", tone: "blue", title: "Gupta & Sons", text: "stock export arrived 2 h late today", act: "Open", run: () => go("clients", "munchly", "supply") });
    const tracks = s.tracks.filter((t) => s.clients.some((c) => c.id === t.client));
    const startFrom = (r) => {
      const plan = (P.PLANS.find((p) => p.name === r.plan) || P.PLANS[0]).id;
      const domain = (r.email.split("@")[1] || "").toLowerCase();
      P.update((d) => {
        d.draft = { name: r.company, industry: INDUSTRIES.includes(r.makes) ? r.makes : INDUSTRIES[0], emailDomain: domain, adminName: r.name, adminEmail: r.email, plan, request: r.id };
      });
      go("new-client");
    };
    return /* @__PURE__ */ React.createElement(Screen, { title: "Overview", sub: `${date} · ${live.length} client${live.length === 1 ? "" : "s"} live · ${on} agents on` }, /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 380,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Every client's batches, by the stop they have reached" }, "Batches on the move"), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, tracks.map((t) => {
          const c = s.clients.find((x) => x.id === t.client);
          const sku = D.SKUS[t.sku];
          const dist = D.DISTRIBUTORS[t.distributor];
          return /* @__PURE__ */ React.createElement(Card, { key: t.batch, className: "cs-track" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 34 }), /* @__PURE__ */ React.createElement("div", { className: "stack tight grow", style: { gap: 2, minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote subtle" }, t.batch), /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, sku.name, " · ", dist.name, ", ", dist.city), t.note && /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, t.note)), /* @__PURE__ */ React.createElement("div", { className: "cs-track-out" }, t.money ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(K.Money, { value: t.money, size: "s", style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "recovered")) : /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, t.split))), app.bp === "phone" ? /* @__PURE__ */ React.createElement(TrackerCompact, { done: t.done, current: t.current, label: t.batch }) : /* @__PURE__ */ React.createElement(Tracker, { stages: STAGES, done: t.done, current: t.current, label: t.batch + " stages" }));
        })), /* @__PURE__ */ React.createElement(SectionTitle, { sub: "What each client's agents did today" }, "Agent runs today"), /* @__PURE__ */ React.createElement(List, null, s.runs.slice(0, 9).map((r, i) => {
          const a = AGENT(r.agent);
          const c = s.clients.find((x) => x.id === r.client);
          return /* @__PURE__ */ React.createElement(ListRow, { key: i, leading: /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote cs-time" }, r.at), icon: a.icon, iconTone: a.gate ? "amber" : "soft", title: `${a.name} · ${c ? c.name : r.client}`, sub: r.text });
        }))),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Waiting on a person, or on a file" }, "Needs attention"), attention.length ? /* @__PURE__ */ React.createElement(List, null, attention.map((x) => /* @__PURE__ */ React.createElement(ListRow, { key: x.id, leading: /* @__PURE__ */ React.createElement("span", { className: cx("cs-att", x.tone), "aria-hidden": "true" }), title: x.title, sub: `${x.c.name} · ${x.text}`, value: /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", onClick: x.run }, x.act) }))) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "circle-check", title: "Nothing is waiting", body: "Every client's partners have given their permissions." })), /* @__PURE__ */ React.createElement(SectionTitle, { sub: "From Book a demo on smartclearance.com" }, "Demo requests"), (s.requests || []).length ? /* @__PURE__ */ React.createElement(List, null, s.requests.map((r) => /* @__PURE__ */ React.createElement(
          ListRow,
          {
            key: r.id,
            icon: "mail",
            iconTone: "soft",
            title: r.company,
            sub: [r.name, r.email, r.makes, r.plan && `${r.plan} plan`, r.at].filter(Boolean).join(" · "),
            value: r.status === "set up" ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", icon: "check" }, "set up") : /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => startFrom(r) }, "Set up")
          }
        ))) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "mail", title: "No requests yet", body: "When someone books a demo on smartclearance.com, the request lands here, ready to become a client." })), app.bp === "phone" && /* @__PURE__ */ React.createElement(List, { head: "Platform" }, NAV.filter((n) => n.phoneHidden).map((n) => /* @__PURE__ */ React.createElement(ListRow, { key: n.id, icon: n.icon, iconTone: "soft", title: n.label, chevron: true, onClick: () => go(n.id) }))))
      }
    ));
  }
  function Clients({ go }) {
    const s = usePlatform();
    const app = useApp();
    const [q, setQ] = useState("");
    const rows = s.clients.filter((c) => !q || (c.name + " " + c.domain + " " + c.city).toLowerCase().includes(q.toLowerCase()));
    return /* @__PURE__ */ React.createElement(Screen, { title: "Clients", sub: "Every manufacturer's workspace on Smart-Clearance", actions: app.bp !== "phone" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "sm", icon: "plus", onClick: () => go("new-client") }, "New client") }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 220 } }, /* @__PURE__ */ React.createElement(K.SearchField, { value: q, onChange: setQ, placeholder: "Search clients, addresses, people" })), app.bp === "phone" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "plus", onClick: () => go("new-client") }, "New client")), app.bp === "phone" ? /* @__PURE__ */ React.createElement("div", { className: "list" }, rows.map((c) => /* @__PURE__ */ React.createElement("button", { type: "button", key: c.id, className: "list-row", style: { gridTemplateColumns: "40px minmax(0,1fr) auto", width: "100%", textAlign: "left" }, onClick: () => go("clients", c.id, "agents") }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 36 }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, c.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle mono", style: { overflowWrap: "anywhere" } }, c.domain)), statusBadge(c)))) : /* @__PURE__ */ React.createElement(DataTable, { label: "Clients", rows, onRow: (c) => go("clients", c.id, "agents"), initialSort: ["name", "asc"], columns: [
      { key: "name", label: "Client", render: (c) => /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 30 }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, c.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, c.city))) },
      { key: "domain", label: "Workspace", render: (c) => /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote" }, c.domain) },
      { key: "plan", label: "Plan", sortValue: (c) => planName(c.plan), render: (c) => planName(c.plan) },
      { key: "status", label: "Status", render: statusBadge },
      { key: "distributors", label: "Distributors", num: true, sortValue: (c) => c.distributors.length, render: (c) => c.distributors.length },
      { key: "skus", label: "SKUs", num: true, sortValue: (c) => c.skus.length, render: (c) => c.skus.length },
      { key: "agents", label: "Agents", sortValue: agentsOn, render: (c) => `${agentsOn(c)} of ${P.AGENTS.length - 1} on` },
      { key: "recovered", label: "Recovered", num: true, render: (c) => c.recovered ? fmt.inr(c.recovered) : "none yet" }
    ] }), s.clients.length < 3 && /* @__PURE__ */ React.createElement(Card, { className: "cs-next" }, /* @__PURE__ */ React.createElement(Product, { name: "sprout-box", size: app.bp === "phone" ? 96 : 132 }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("b", { className: "t-title3" }, s.clients.length === 1 ? "Only Munchly is set up so far." : "Set up the next manufacturer."), /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0, maxWidth: "52ch" } }, "Each client starts from its supply-chain profile: route to market, who owns the stock, its expiry policy and the exits it allows. The agents and their limits follow from it."), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "plus", onClick: () => go("new-client") }, "New client"))))));
  }
  const TABS = [{ id: "agents", label: "Agents" }, { id: "supply", label: "Supply chain" }, { id: "rules", label: "Channels & rules" }, { id: "people", label: "People" }, { id: "integrations", label: "Integrations" }, { id: "plan", label: "Plan" }, { id: "audit", label: "Audit" }];
  function ClientPage({ id, tab, go, me }) {
    const s = usePlatform();
    const app = useApp();
    const c = s.clients.find((x) => x.id === id);
    const [menu, setMenu] = useState(false);
    const [pause, setPause] = useState(false);
    const { toast } = useNotice();
    if (!c) return /* @__PURE__ */ React.createElement(Screen, { title: "No such client", back: "Clients", onBack: () => go("clients") }, /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "search", title: "This client isn't set up", body: "It may have been removed when the prototype's data was reset.", action: /* @__PURE__ */ React.createElement(Button, { onClick: () => go("clients") }, "All clients") })));
    const t = TABS.some((x) => x.id === tab) ? tab : "agents";
    const allOff = agentsOn(c) === 0;
    const setAll = (v) => {
      P.update((d) => {
        const x = d.clients.find((y) => y.id === c.id);
        P.AGENTS.filter((a) => !a.gate).forEach((a) => {
          x.agents[a.id].on = v;
        });
      }, { who: me.name, client: c.id, text: v ? `Resumed every agent for ${c.name}` : `Paused every agent for ${c.name}` });
      toast({ text: v ? `Agents resumed for ${c.name}` : `Every agent paused for ${c.name}`, tone: "ok" });
    };
    const goLive = () => {
      P.update((d) => {
        const x = d.clients.find((y) => y.id === c.id);
        x.status = "live";
        x.since = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      }, { who: me.name, client: c.id, text: `Moved ${c.name} to Live on the ${planName(c.plan)} plan` });
      toast({ text: `${c.name} is live`, tone: "ok" });
    };
    const items = [
      c.id === "munchly" ? { label: "Open the workspace", icon: "external-link", onClick: () => {
        window.open(LINKS.app, "_blank", "noopener");
      } } : null,
      c.status !== "live" ? { label: "Go live", icon: "circle-play", onClick: goLive } : null,
      allOff ? { label: "Resume every agent", icon: "play", onClick: () => setAll(true) } : { label: "Pause every agent", icon: "pause", danger: true, onClick: () => setPause(true) }
    ];
    return /* @__PURE__ */ React.createElement(
      Screen,
      {
        title: c.name,
        sub: `${c.domain} · ${planName(c.plan)}${c.since ? " since " + c.since : ""}`,
        back: "Clients",
        onBack: () => go("clients"),
        actions: /* @__PURE__ */ React.createElement("span", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(IconButton, { icon: "ellipsis", label: `Actions for ${c.name}`, "aria-haspopup": "menu", "aria-expanded": menu, onClick: () => setMenu((m) => !m) }), /* @__PURE__ */ React.createElement(Menu, { open: menu, onClose: () => setMenu(false), items, width: 230, label: `Actions for ${c.name}` }))
      },
      /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18 } }, /* @__PURE__ */ React.createElement("div", { className: "cs-head" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: app.bp === "phone" ? 48 : 60 }), /* @__PURE__ */ React.createElement("div", { className: "stack tight grow", style: { gap: 6, minWidth: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "si-url", style: { justifySelf: "start" } }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 12, stroke: 2.2 }), c.domain), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, statusBadge(c), /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, planName(c.plan)), /* @__PURE__ */ React.createElement(Badge, { size: "sm", icon: "map-pin" }, c.city, c.region && c.region !== "India" ? " · " + c.region : ""), /* @__PURE__ */ React.createElement(Badge, { size: "sm", icon: "bot" }, agentsOn(c), " of ", P.AGENTS.length - 1, " agents on")))), /* @__PURE__ */ React.createElement("div", { className: "cs-tabs" }, /* @__PURE__ */ React.createElement(Tabs, { id: "client-tabs", tabs: TABS, value: t, onChange: (v) => go("clients", c.id, v, true) })), t === "agents" && /* @__PURE__ */ React.createElement(AgentsTab, { c, me }), t === "supply" && /* @__PURE__ */ React.createElement(SupplyTab, { c, me }), t === "rules" && /* @__PURE__ */ React.createElement(RulesTab, { c, me }), t === "people" && /* @__PURE__ */ React.createElement(PeopleTab, { c, me }), t === "integrations" && /* @__PURE__ */ React.createElement(IntegrationsTab, { c, me }), t === "plan" && /* @__PURE__ */ React.createElement(PlanTab, { c, me, onLive: goLive }), t === "audit" && /* @__PURE__ */ React.createElement(AuditList, { filter: c.id })),
      /* @__PURE__ */ React.createElement(Alert, { open: pause, onClose: () => setPause(false), title: `Pause every agent for ${c.name}?`, message: "Nothing new is detected, priced, listed or sent until you resume. Plans already approved stay where they are.", actions: [{ label: "Cancel" }, { label: "Pause", danger: true, strong: true, onClick: () => setAll(false) }] })
    );
  }
  function AgentsTab({ c, me }) {
    const app = useApp();
    const { toast } = useNotice();
    const [sel, setSel] = useState(() => app.bp === "desktop" ? "negotiator" : null);
    const setAutonomy = (a, v) => {
      const from = c.agents[a.id].autonomy;
      if (from === v) return;
      P.update((d) => {
        d.clients.find((x) => x.id === c.id).agents[a.id].autonomy = v;
      }, { who: me.name, client: c.id, text: `Set the ${a.name} agent to ${LEVEL(v).label} for ${c.name} (was ${LEVEL(from).label})` });
      toast({ text: `${a.name}: ${LEVEL(v).label}, for ${c.name}`, tone: "ok" });
    };
    const legend = /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle cs-legend" }, P.AUTONOMY.map((l) => /* @__PURE__ */ React.createElement("span", { key: l.id }, /* @__PURE__ */ React.createElement("span", { className: cx("cs-key", "auto-" + l.id), "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("b", null, l.label), " ", l.text.charAt(0).toLowerCase() + l.text.slice(1))));
    const pipe = /* @__PURE__ */ React.createElement(AgentPipeline, { c, sel, onSelect: setSel, onAutonomy: setAutonomy, compact: app.bp === "phone" });
    const insp = sel ? /* @__PURE__ */ React.createElement(AgentInspector, { key: c.id + sel, c, id: sel, me, onAutonomy: setAutonomy }) : null;
    if (app.bp === "desktop") return /* @__PURE__ */ React.createElement("div", { className: "cs-agents" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12, minWidth: 0 } }, legend, pipe), /* @__PURE__ */ React.createElement("aside", { className: "cs-inspector card", "aria-label": "Selected agent" }, insp || /* @__PURE__ */ React.createElement(Empty, { icon: "mouse-pointer-click", title: "Choose an agent", body: "Its limits, schedule and last run open here." })));
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, legend, pipe, /* @__PURE__ */ React.createElement(Sheet, { open: !!sel, onClose: () => setSel(null), title: sel ? AGENT(sel).name : "", side: app.bp === "phone" ? "bottom" : "side", detent: "large" }, insp));
  }
  function AgentPipeline({ c, sel, onSelect, onAutonomy, compact }) {
    return /* @__PURE__ */ React.createElement("ol", { className: "cs-pipe", "aria-label": `${c.name}'s agents, in the order they work` }, P.AGENTS.map((a) => {
      const cfg = c.agents[a.id];
      const on = sel === a.id;
      return /* @__PURE__ */ React.createElement("li", { key: a.id, className: cx("cs-stop", a.gate && "is-gate", on && "on", !cfg.on && "off", "auto-" + cfg.autonomy) }, /* @__PURE__ */ React.createElement("span", { className: "cs-node", "aria-hidden": "true" }, a.gate && /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 11, stroke: 2.6 })), /* @__PURE__ */ React.createElement("div", { className: "cs-card" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "cs-open", "aria-pressed": on, onClick: () => onSelect(a.id) }, /* @__PURE__ */ React.createElement("span", { className: cx("icontile", a.gate ? "amber" : "soft") }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "cs-text" }, /* @__PURE__ */ React.createElement("span", { className: "cs-name" }, /* @__PURE__ */ React.createElement("b", null, a.name), /* @__PURE__ */ React.createElement("span", { className: "cs-stage" }, P.STAGE_NAME[a.stage]), !cfg.on && !a.gate && /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, "Off")), /* @__PURE__ */ React.createElement("span", { className: "cs-sum" }, a.gate ? P.summary("gate", cfg.settings, c) : a.job.charAt(0).toLowerCase() + a.job.slice(1) + " · " + P.summary(a.id, cfg.settings, c)))), /* @__PURE__ */ React.createElement("div", { className: "cs-ctl" }, a.gate ? /* @__PURE__ */ React.createElement(Badge, { tone: "amber", icon: "lock" }, "Always on") : compact ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: cfg.autonomy === "act" ? "green" : void 0 }, LEVEL(cfg.autonomy).label) : /* @__PURE__ */ React.createElement(Segmented, { className: "sm", label: `${a.name}: autonomy`, options: P.AUTONOMY.map((x) => ({ id: x.id, label: x.label })), value: cfg.autonomy, onChange: (v) => onAutonomy(a, v) }))));
    }));
  }
  function AgentInspector({ c, id, me, onAutonomy }) {
    const a = AGENT(id);
    const cfg = c.agents[id];
    const { toast } = useNotice();
    const [draft, setDraft] = useState(cfg.settings);
    const key = JSON.stringify(cfg.settings);
    useEffect(() => setDraft(cfg.settings), [c.id, id, key]);
    const fields = P.FIELDS[id] || [];
    const dirty = JSON.stringify(draft) !== key;
    const save = () => {
      const changes = fields.filter((f) => JSON.stringify(draft[f.key]) !== JSON.stringify(cfg.settings[f.key])).map((f) => f.type === "approver" ? `approver ${nameOf(c, cfg.settings[f.key])} to ${nameOf(c, draft[f.key])}` : `${f.short || f.label.toLowerCase()} ${P.showValue(f, cfg.settings[f.key])} to ${P.showValue(f, draft[f.key])}`);
      P.update((d) => {
        d.clients.find((x) => x.id === c.id).agents[id].settings = draft;
      }, { who: me.name, client: c.id, text: `Changed the ${a.name} agent for ${c.name}: ${changes.join("; ")}` });
      toast({ text: `${a.name} saved for ${c.name}`, tone: "ok" });
    };
    const toggle = (v) => P.update((d) => {
      d.clients.find((x) => x.id === c.id).agents[id].on = v;
    }, { who: me.name, client: c.id, text: `${v ? "Switched on" : "Switched off"} the ${a.name} agent for ${c.name}` });
    const runNow = () => {
      const at = hhmm();
      P.update((d) => {
        d.runs.unshift({ at, agent: id, client: c.id, text: "ran on request; nothing new" });
        d.clients.find((x) => x.id === c.id).agents[id].last = `${at} today · ran on request; nothing new`;
      }, { who: me.name, client: c.id, text: `Ran the ${a.name} agent now for ${c.name}` });
      toast({ text: `${a.name} ran for ${c.name}: nothing new`, tone: "ok" });
    };
    return /* @__PURE__ */ React.createElement("div", { className: "stack cs-insp", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: cx("icontile", a.gate ? "amber" : ""), style: { width: 42, height: 42, borderRadius: 12 } }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 21, stroke: 2 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("b", { className: "t-title3" }, a.name), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, P.STAGE_NAME[a.stage], " · ", a.gate ? "a person, always" : a.model + " on Vertex AI"))), /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0 } }, a.job, "."), a.gate ? /* @__PURE__ */ React.createElement("div", { className: "cs-gate-note" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 16, stroke: 2.2 }), /* @__PURE__ */ React.createElement("span", null, "Every plan waits for one person's approval, with the money on screen, for every client. It can't be switched off.")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: "On", sub: cfg.on ? "Runs for this client" : "Skipped; the stops around it carry on", value: /* @__PURE__ */ React.createElement(Switch, { checked: cfg.on, onChange: toggle, label: `${a.name} on for ${c.name}` }) })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "t-footnote strong" }, "Autonomy"), /* @__PURE__ */ React.createElement(Segmented, { label: `${a.name}: autonomy`, options: P.AUTONOMY.map((x) => ({ id: x.id, label: x.label })), value: cfg.autonomy, onChange: (v) => onAutonomy(a, v) }), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, LEVEL(cfg.autonomy).text, "."))), fields.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, fields.map((f) => /* @__PURE__ */ React.createElement(SettingField, { key: f.key, f, c, agent: a, value: draft[f.key], onChange: (v) => setDraft((x) => ({ ...x, [f.key]: v })) }))), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: "Last run", sub: cfg.last || "not run yet" }), /* @__PURE__ */ React.createElement(ListRow, { title: "Next run", sub: cfg.next || "not scheduled" })), /* @__PURE__ */ React.createElement("div", { className: "row tight wrap" }, !a.gate && /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", icon: "play", disabled: !cfg.on, onClick: runNow }, "Run now"), /* @__PURE__ */ React.createElement("span", { className: "grow" }), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "sm", disabled: !dirty, onClick: save }, "Save")));
  }
  const nameOf = (c, pid) => {
    const p = c.people.find((x) => x.id === pid);
    return p ? p.name : "nobody";
  };
  function SettingField({ f, c, agent, value, onChange }) {
    const id = `set-${agent.id}-${f.key}`;
    if (f.type === "switch") return /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: f.label, sub: f.locked || null, value: /* @__PURE__ */ React.createElement(Switch, { checked: !!value, disabled: !!f.locked, onChange, label: f.label }) }));
    if (f.type === "stepper") return /* @__PURE__ */ React.createElement("div", { className: "row between", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, f.label), /* @__PURE__ */ React.createElement(Stepper, { value, min: f.min, max: f.max, onChange, label: f.label.toLowerCase() }));
    if (f.type === "approver") {
      const people = c.people.filter((p) => p.status === "active" && (p.access === "Approver" || p.access === "Admin" || p.access === "Member"));
      return /* @__PURE__ */ React.createElement(Field, { label: f.label, htmlFor: id, help: "Plans go to this person's phone; nothing moves until they tap Approve." }, /* @__PURE__ */ React.createElement(Select, { id, value: value || "", onChange: (e) => onChange(e.target.value) }, !people.length && /* @__PURE__ */ React.createElement("option", { value: "" }, "No one yet"), people.map((p) => /* @__PURE__ */ React.createElement("option", { key: p.id, value: p.id }, p.name, " · ", p.role))));
    }
    if (f.type === "select") return /* @__PURE__ */ React.createElement(Field, { label: f.label, htmlFor: id }, /* @__PURE__ */ React.createElement(Select, { id, value, onChange: (e) => onChange(e.target.value) }, f.options.map((o) => /* @__PURE__ */ React.createElement("option", { key: o }, o))));
    if (f.type === "time") return /* @__PURE__ */ React.createElement(Field, { label: f.label, htmlFor: id }, /* @__PURE__ */ React.createElement(Input, { id, type: "time", value, onChange: (e) => onChange(e.target.value) }));
    const num = /* @__PURE__ */ React.createElement(Input, { id, type: "number", inputMode: "decimal", min: f.min, max: f.max, step: f.step || 1, value, onChange: (e) => {
      const v = e.target.value === "" ? f.min : Number(e.target.value);
      onChange(Math.max(f.min, Math.min(f.max, v)));
    }, icon: f.type === "money" ? "indian-rupee" : void 0 });
    return /* @__PURE__ */ React.createElement(Field, { label: f.label, htmlFor: id, help: f.unit && f.type !== "money" ? f.unit : void 0 }, num);
  }
  function SupplyTab({ c, me }) {
    const app = useApp();
    const { toast } = useNotice();
    const [edit, setEdit] = useState(false);
    const [menu, setMenu] = useState(null);
    const kiranas = c.distributors.reduce((t, d) => t + d.kiranas, 0);
    const Step = ({ icon, t, sub }) => /* @__PURE__ */ React.createElement("div", { className: "wschain-step" }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, t), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, sub));
    const lister = c.agents.lister.settings;
    const rows = [
      ["route", "factory", "Route to market", P.optLabel("route", c.profile.route) + (c.distributors.length ? `, ${c.distributors.length} distributors` : "")],
      ["owner", "warehouse", "Who owns short-dated stock", P.optLabel("owner", c.profile.owner)],
      ["expiry", "undo-2", "Expiry policy", P.optLabel("expiry", c.profile.expiry)],
      ["gates", "shield", "Quick-commerce gates", `Blinkit ${c.gates.blinkitDays}+ days; Zepto and Instamart ${c.gates.qcomPct}% of life`],
      ["guard", "map", "Territory guard", lister.territoryGuard ? "Lots hidden from buyers inside the client's territories" : "Off: lots visible everywhere"],
      ["window", "calendar-clock", "Return window", `${c.returnWindowDays} days`]
    ];
    const ask = (d) => {
      P.update(() => {
      }, { who: me.name, client: c.id, text: `Asked ${d.name} again for its one-time permission` });
      toast({ text: `Reminder sent to ${d.name}`, tone: "ok" });
    };
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18 } }, /* @__PURE__ */ React.createElement(Card, { className: "wschain-card" }, /* @__PURE__ */ React.createElement("div", { className: "wschain", role: "img", "aria-label": `${c.name} sells through ${c.distributors.length || "its"} distributors to ${kiranas || "the"} kiranas and the quick-commerce warehouses.` }, /* @__PURE__ */ React.createElement(Step, { icon: "factory", t: c.name, sub: `${c.city} · ${c.profile.route === "distributors" ? "sells only to distributors" : P.optLabel("route", c.profile.route).toLowerCase()}` }), /* @__PURE__ */ React.createElement(Icon, { name: "arrow-right", size: 16, className: "subtle wschain-arrow" }), /* @__PURE__ */ React.createElement(Step, { icon: "warehouse", t: c.distributors.length ? `${c.distributors.length} distributors` : "Distributors", sub: c.profile.owner === "distributor" ? "own the stock they buy" : "hold the manufacturer's stock" }), /* @__PURE__ */ React.createElement(Icon, { name: "arrow-right", size: 16, className: "subtle wschain-arrow" }), /* @__PURE__ */ React.createElement("div", { className: "wschain-split" }, /* @__PURE__ */ React.createElement(Step, { icon: "store", t: kiranas ? `${kiranas} kiranas` : "Kiranas", sub: "on the salesmen's beats" }), /* @__PURE__ */ React.createElement(Step, { icon: "shopping-bag", t: "Quick-commerce warehouses", sub: "Blinkit, Zepto, Instamart; turn short-dated stock away" })))), /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: app.bp === "desktop" ? 560 : 360,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { right: /* @__PURE__ */ React.createElement(Button, { size: "sm", icon: "sliders-horizontal", onClick: () => setEdit(true) }, "Edit"), sub: "Set at onboarding; the exits and agents follow from it" }, "Profile"), /* @__PURE__ */ React.createElement(List, null, rows.map(([k, icon, t, v]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, icon, iconTone: "soft", title: t, sub: /* @__PURE__ */ React.createElement("b", { className: "strong", style: { color: "var(--fg-2)" } }, v) })))),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Each gives the agents a one-time permission to act in his name" }, "Distributors"), c.distributors.length ? /* @__PURE__ */ React.createElement(List, null, c.distributors.map((d) => /* @__PURE__ */ React.createElement(
          ListRow,
          {
            key: d.id,
            icon: "warehouse",
            iconTone: "soft",
            title: d.name,
            sub: `${d.city} · ${d.kiranas} kiranas · staff sale up to ${d.staffCap || c.rules.staffCap}`,
            value: /* @__PURE__ */ React.createElement("span", { className: "row tight" }, d.permission === "given" ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green" }, "given") : /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber" }, "not yet"), d.permission !== "given" && /* @__PURE__ */ React.createElement("span", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(IconButton, { icon: "ellipsis", label: `Actions for ${d.name}`, "aria-haspopup": "menu", "aria-expanded": menu === d.id, onClick: () => setMenu(menu === d.id ? null : d.id) }), /* @__PURE__ */ React.createElement(Menu, { open: menu === d.id, onClose: () => setMenu(null), width: 240, label: `Actions for ${d.name}`, items: [{ label: "Ask for the permission again", icon: "send", onClick: () => ask(d) }] })))
          }
        ))) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "warehouse", title: "No distributors yet", body: "They arrive with the first stock export, and each is invited to give the agents its one-time permission." })))
      }
    ), /* @__PURE__ */ React.createElement(SectionTitle, { sub: c.skus.length ? "From the latest stock export" : null }, "SKUs"), c.skus.length ? /* @__PURE__ */ React.createElement(DataTable, { label: `${c.name} SKUs`, rows: c.skus, initialSort: ["name", "asc"], columns: [
      { key: "code", label: "Code", render: (x) => /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote" }, x.code) },
      { key: "name", label: "Product", render: (x) => /* @__PURE__ */ React.createElement("b", null, x.name) },
      { key: "brand", label: "Brand" },
      { key: "mrp", label: "MRP", num: true, render: (x) => fmt.inr(x.mrp) },
      { key: "gst", label: "GST", num: true, render: (x) => fmt.pct(x.gst) },
      { key: "lifeDays", label: "Shelf life", num: true, render: (x) => `${x.lifeDays} days` }
    ] }) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "package", title: "No SKUs yet", body: "SKUs arrive with the first stock export." })), /* @__PURE__ */ React.createElement(ProfileSheet, { open: edit, onClose: () => setEdit(false), c, me }));
  }
  function ProfileSheet({ open, onClose, c, me }) {
    const app = useApp();
    const { toast } = useNotice();
    const [f, setF] = useState(null);
    useEffect(() => {
      if (open) setF({ ...c.profile, blinkitDays: c.gates.blinkitDays, qcomPct: c.gates.qcomPct, returnWindowDays: c.returnWindowDays });
    }, [open]);
    if (!f) return null;
    const save = () => {
      P.update(
        (d) => {
          const x = d.clients.find((y) => y.id === c.id);
          const was = x.exits;
          x.profile = { route: f.route, owner: f.owner, expiry: f.expiry };
          const ex = P.exitsFor(x.profile);
          Object.keys(ex).forEach((k) => {
            if (!ex[k].locked && was[k]) ex[k].on = was[k].on && ex[k].on;
          });
          x.exits = ex;
          x.gates = { blinkitDays: f.blinkitDays, qcomPct: f.qcomPct };
          x.returnWindowDays = f.returnWindowDays;
          x.agents.watcher.settings.blinkitDays = f.blinkitDays;
          x.agents.watcher.settings.qcomPct = f.qcomPct;
          x.agents.impact.settings.returnWindowDays = f.returnWindowDays;
        },
        { who: me.name, client: c.id, text: `Changed ${c.name}'s supply-chain profile: ${P.optLabel("route", f.route).toLowerCase()}, ${P.optLabel("owner", f.owner).toLowerCase()} owns the stock, ${P.optLabel("expiry", f.expiry).toLowerCase()}` }
      );
      toast({ text: `${c.name}'s profile saved`, tone: "ok" });
      onClose();
    };
    return /* @__PURE__ */ React.createElement(Sheet, { open, onClose, title: "Supply-chain profile", side: app.bp === "phone" ? "bottom" : "side", detent: "large", footer: /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, onClick: save }, "Save profile") }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18 } }, Object.keys(P.PROFILE).map((q) => /* @__PURE__ */ React.createElement(Choice, { key: q, name: "pf-" + q, label: P.PROFILE[q].label, options: P.PROFILE[q].options, value: f[q], onChange: (v) => setF({ ...f, [q]: v }) })), /* @__PURE__ */ React.createElement(Field, { label: "Blinkit takes stock with at least", htmlFor: "pf-bl", help: "days of shelf life left" }, /* @__PURE__ */ React.createElement(Input, { id: "pf-bl", type: "number", min: 30, max: 180, value: f.blinkitDays, onChange: (e) => setF({ ...f, blinkitDays: Number(e.target.value) || 30 }) })), /* @__PURE__ */ React.createElement(Field, { label: "Zepto and Instamart take at least", htmlFor: "pf-qc", help: "% of shelf life left" }, /* @__PURE__ */ React.createElement(Input, { id: "pf-qc", type: "number", min: 30, max: 90, step: 5, value: f.qcomPct, onChange: (e) => setF({ ...f, qcomPct: Number(e.target.value) || 30 }) })), /* @__PURE__ */ React.createElement("div", { className: "row between", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, "Return window, days"), /* @__PURE__ */ React.createElement(Stepper, { value: f.returnWindowDays, min: 7, max: 45, onChange: (v) => setF({ ...f, returnWindowDays: v }), label: "return window days" })), /* @__PURE__ */ React.createElement(ProfileSummary, { profile: f })));
  }
  function ProfileSummary({ profile }) {
    return /* @__PURE__ */ React.createElement(Card, { className: "cs-summary" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "What this profile sets up"), /* @__PURE__ */ React.createElement("ul", null, P.profileLines(profile).map((l, i) => /* @__PURE__ */ React.createElement("li", { key: i }, /* @__PURE__ */ React.createElement(Icon, { name: l.icon, size: 16, stroke: 2 }), /* @__PURE__ */ React.createElement("span", null, l.text)))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Every plan still waits for one person's approval."));
  }
  function Choice({ name, label, options, value, onChange }) {
    return /* @__PURE__ */ React.createElement("fieldset", { className: "cs-choice" }, /* @__PURE__ */ React.createElement("legend", null, label), /* @__PURE__ */ React.createElement("div", { className: "cs-opts" }, options.map((o) => /* @__PURE__ */ React.createElement("label", { key: o.id, className: cx("cs-opt", value === o.id && "on") }, /* @__PURE__ */ React.createElement("input", { type: "radio", name, value: o.id, checked: value === o.id, onChange: () => onChange(o.id) }), /* @__PURE__ */ React.createElement("span", null, o.label), value === o.id && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, stroke: 2.4 })))));
  }
  function RulesTab({ c, me }) {
    const { toast } = useNotice();
    const [r, setR] = useState(c.rules);
    const [ex, setEx] = useState(c.exits);
    useEffect(() => {
      setR(c.rules);
      setEx(c.exits);
    }, [c.id, JSON.stringify(c.rules), JSON.stringify(c.exits)]);
    const dirty = JSON.stringify(r) !== JSON.stringify(c.rules) || JSON.stringify(ex) !== JSON.stringify(c.exits);
    const save = () => {
      const changed = [];
      P.EXITS.forEach((e) => {
        if (ex[e.id].on !== c.exits[e.id].on) changed.push(`${e.name} ${ex[e.id].on ? "on" : "off"}`);
      });
      Object.keys(r).forEach((k) => {
        if (r[k] !== c.rules[k]) changed.push(`${RULE_LABEL[k] || k} ${typeof r[k] === "boolean" ? r[k] ? "on" : "off" : r[k]}`);
      });
      P.update((d) => {
        const x = d.clients.find((y) => y.id === c.id);
        x.rules = r;
        x.exits = ex;
      }, { who: me.name, client: c.id, text: `Changed ${c.name}'s channels and rules: ${changed.join("; ")}` });
      toast({ text: "Channels and rules saved", tone: "ok" });
    };
    const set = (k, v) => setR({ ...r, [k]: v });
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18 } }, /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 460,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "The exits the agents may price and use; the bin is always the baseline" }, "Exits"), /* @__PURE__ */ React.createElement(List, null, P.EXITS.map((e) => /* @__PURE__ */ React.createElement(ListRow, { key: e.id, icon: e.icon, iconTone: "soft", title: e.name, sub: ex[e.id].locked || (e.id === "staff" ? `Up to ${r.staffCap} packs a godown` : null), value: /* @__PURE__ */ React.createElement(Switch, { checked: !!ex[e.id].on, disabled: !!ex[e.id].locked, onChange: (v) => setEx({ ...ex, [e.id]: { ...ex[e.id], on: v } }), label: `${e.name} for ${c.name}` }) })), /* @__PURE__ */ React.createElement(ListRow, { icon: "trash-2", iconTone: "red", title: "The bin", sub: "Priced every time, so every plan shows what it saves", value: /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, "baseline") }))),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "The limits every agent works inside" }, "Guardrails"), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: "Staff sale cap", sub: "packs per godown", value: /* @__PURE__ */ React.createElement(Stepper, { value: r.staffCap, min: 0, max: 500, step: 10, onChange: (v) => set("staffCap", v), label: "staff sale cap" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Offer window", sub: "hours a kirana offer stays open", value: /* @__PURE__ */ React.createElement(Stepper, { value: r.offerWindowHours, min: 12, max: 96, step: 12, onChange: (v) => set("offerWindowHours", v), label: "offer window hours" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Kirana offers in Hindi first", sub: "with an English toggle", value: /* @__PURE__ */ React.createElement(Switch, { checked: r.hindiOffers, onChange: (v) => set("hindiOffers", v), label: "Kirana offers in Hindi first" }) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Label photo before any plan", sub: "Vision reads the date off the shelf, not the spreadsheet", value: /* @__PURE__ */ React.createElement(Switch, { checked: r.requirePhoto, onChange: (v) => set("requirePhoto", v), label: "Label photo before any plan" }) })))
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10 } }, /* @__PURE__ */ React.createElement(Button, { disabled: !dirty, onClick: () => {
      setR(c.rules);
      setEx(c.exits);
    } }, "Discard"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", disabled: !dirty, onClick: save }, "Save changes")));
  }
  const RULE_LABEL = { staffCap: "staff sale cap", offerWindowHours: "offer window hours", hindiOffers: "Hindi offers", requirePhoto: "label photo first" };
  const ACCESS = ["Approver", "Admin", "Member", "Partner"];
  function PeopleTab({ c, me }) {
    const app = useApp();
    const { toast } = useNotice();
    const [q, setQ] = useState("");
    const [menu, setMenu] = useState(null);
    const [inv, setInv] = useState(false);
    const [accessFor, setAccessFor] = useState(null);
    const rows = c.people.filter((p) => !q || (p.name + " " + p.org + " " + p.role).toLowerCase().includes(q.toLowerCase()));
    const setStatus = (p, status) => {
      P.update((d) => {
        const x = d.clients.find((y) => y.id === c.id).people.find((y) => y.id === p.id);
        x.status = status;
      }, { who: me.name, client: c.id, text: `${status === "deactivated" ? "Deactivated" : "Reactivated"} ${p.name}` });
      toast({ text: `${p.name} ${status === "deactivated" ? "deactivated" : "reactivated"}`, tone: "ok" });
    };
    const setAccess = (p, a) => {
      P.update((d) => {
        const x = d.clients.find((y) => y.id === c.id).people.find((y) => y.id === p.id);
        x.access = a;
      }, { who: me.name, client: c.id, text: `Gave ${p.name} ${a} access` });
      toast({ text: `${p.name}: ${a}`, tone: "ok" });
      setAccessFor(null);
    };
    const tone = (st) => st === "active" ? "green" : void 0;
    const menuFor = (p) => [{ label: "Change access", icon: "user-cog", onClick: () => setAccessFor(p) }, p.status === "invited" ? { label: "Resend invitation", icon: "send", onClick: () => toast({ text: `Invitation resent to ${p.name}`, tone: "ok" }) } : null, p.status === "deactivated" ? { label: "Reactivate", icon: "user-check", onClick: () => setStatus(p, "active") } : { label: "Deactivate", icon: "user-x", danger: true, onClick: () => setStatus(p, "deactivated") }];
    const form = /* @__PURE__ */ React.createElement(InviteForm, { c, me, onDone: () => setInv(false) });
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "grow", style: { minWidth: 220 } }, /* @__PURE__ */ React.createElement(K.SearchField, { value: q, onChange: setQ, placeholder: "Search people" })), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement(Badge, { tone: "green", dot: true }, c.people.filter((p) => p.status === "active").length, " active"), /* @__PURE__ */ React.createElement(Badge, { dot: true }, c.people.filter((p) => p.status === "invited").length, " invited")), app.bp !== "desktop" && /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "user-plus", onClick: () => setInv(true) }, "Invite")), /* @__PURE__ */ React.createElement("div", { className: app.bp === "desktop" ? "cs-people" : "" }, app.bp === "phone" ? /* @__PURE__ */ React.createElement("div", { className: "list" }, rows.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, className: "list-row", style: { gridTemplateColumns: "36px minmax(0,1fr) auto" } }, /* @__PURE__ */ React.createElement(Avatar, { person: p, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, p.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, p.role, " · ", p.provider)), /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: tone(p.status), dot: true }, p.status), /* @__PURE__ */ React.createElement("span", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(IconButton, { icon: "ellipsis", label: `Actions for ${p.name}`, "aria-haspopup": "menu", "aria-expanded": menu === p.id, onClick: () => setMenu(menu === p.id ? null : p.id) }), /* @__PURE__ */ React.createElement(Menu, { open: menu === p.id, onClose: () => setMenu(null), width: 210, label: `Actions for ${p.name}`, items: menuFor(p) })))))) : /* @__PURE__ */ React.createElement(DataTable, { label: `People in ${c.name}'s workspace`, rows, initialSort: ["name", "asc"], columns: [
      { key: "name", label: "Person", render: (p) => /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Avatar, { person: p, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, p.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, p.org))) },
      { key: "role", label: "Role" },
      { key: "provider", label: "Signs in with" },
      { key: "access", label: "Access", render: (p) => p.access === "Approver" ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber" }, "Approver") : p.access },
      { key: "status", label: "Status", render: (p) => /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: tone(p.status), dot: true }, p.status) },
      { key: "act", label: "", sortable: false, render: (p) => /* @__PURE__ */ React.createElement("span", { style: { position: "relative", display: "inline-block" } }, /* @__PURE__ */ React.createElement(IconButton, { icon: "ellipsis", label: `Actions for ${p.name}`, "aria-haspopup": "menu", "aria-expanded": menu === p.id, onClick: () => setMenu(menu === p.id ? null : p.id) }), /* @__PURE__ */ React.createElement(Menu, { open: menu === p.id, onClose: () => setMenu(null), width: 210, label: `Actions for ${p.name}`, items: menuFor(p) })) }
    ] }), app.bp === "desktop" && /* @__PURE__ */ React.createElement(Card, { className: "cs-invite" }, /* @__PURE__ */ React.createElement("b", { className: "t-headline" }, "Invite a person"), form)), app.bp !== "desktop" && /* @__PURE__ */ React.createElement(Sheet, { open: inv, onClose: () => setInv(false), title: "Invite a person", side: app.bp === "phone" ? "bottom" : "center", detent: "large" }, form), /* @__PURE__ */ React.createElement(Sheet, { open: !!accessFor, onClose: () => setAccessFor(null), title: accessFor ? `Access for ${accessFor.name}` : "", side: app.bp === "phone" ? "bottom" : "center", detent: "medium" }, accessFor && /* @__PURE__ */ React.createElement("div", { className: "list" }, ACCESS.map((a) => /* @__PURE__ */ React.createElement("button", { type: "button", key: a, className: "list-row", style: { gridTemplateColumns: "minmax(0,1fr) auto", width: "100%", textAlign: "left" }, onClick: () => setAccess(accessFor, a) }, /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, a), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, { Approver: "Approves plans with one tap", Admin: "Runs the workspace's people and guardrails", Member: "Sees batches, money and reports", Partner: "A distributor, kirana or food bank" }[a])), accessFor.access === a && /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 18 }))))));
  }
  function InviteForm({ c, me, onDone }) {
    const { toast } = useNotice();
    const [f, setF] = useState({ name: "", contact: "", access: "Member" });
    const [err, setErr] = useState("");
    const send = () => {
      const contact = f.contact.trim();
      const phone = /^[+\d\s]{10,}$/.test(contact);
      const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
      if (!f.name.trim()) {
        setErr("Enter a name.");
        return;
      }
      if (!phone && !email) {
        setErr("Enter a work email address or a mobile number.");
        return;
      }
      if (email && f.access !== "Partner" && !contact.toLowerCase().endsWith("@" + c.emailDomain)) {
        setErr(`${c.name} staff need a ${c.emailDomain} address. Partners can use any address or a phone number.`);
        return;
      }
      const id = "p-" + Date.now().toString(36);
      P.update((d) => {
        d.clients.find((y) => y.id === c.id).people.push({ id, name: f.name.trim(), org: f.access === "Partner" ? f.name.trim() : c.name, role: f.access === "Partner" ? "Partner" : "Staff", kind: f.access, access: f.access, provider: phone ? "Phone and code" : f.access === "Partner" ? "Google, invited" : "Google", status: "invited", img: null, email: email ? contact : "", phone: phone ? contact : "" });
      }, { who: me.name, client: c.id, text: `Invited ${f.name.trim()} as ${f.access}` });
      toast({ text: `Invitation sent to ${f.name.trim()}`, tone: "ok" });
      setF({ name: "", contact: "", access: "Member" });
      setErr("");
      onDone && onDone();
    };
    return /* @__PURE__ */ React.createElement("form", { className: "stack", style: { gap: 12 }, onSubmit: (e) => {
      e.preventDefault();
      send();
    }, noValidate: true }, /* @__PURE__ */ React.createElement(Field, { label: "Name", htmlFor: "inv-name" }, /* @__PURE__ */ React.createElement(Input, { id: "inv-name", value: f.name, onChange: (e) => {
      setF({ ...f, name: e.target.value });
      setErr("");
    }, placeholder: "Name or organisation" })), /* @__PURE__ */ React.createElement(Field, { label: "Work email or mobile number", htmlFor: "inv-contact", error: err || null }, /* @__PURE__ */ React.createElement(Input, { id: "inv-contact", value: f.contact, onChange: (e) => {
      setF({ ...f, contact: e.target.value });
      setErr("");
    }, autoComplete: "off", spellCheck: false, placeholder: `name@${c.emailDomain}` })), /* @__PURE__ */ React.createElement(Field, { label: "Access", htmlFor: "inv-access" }, /* @__PURE__ */ React.createElement(Select, { id: "inv-access", value: f.access, onChange: (e) => setF({ ...f, access: e.target.value }) }, ACCESS.map((a) => /* @__PURE__ */ React.createElement("option", { key: a }, a)))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, c.name, " staff need a ", c.emailDomain, " address; partners sign in with a code or by invitation."), /* @__PURE__ */ React.createElement(Button, { type: "submit", variant: "primary", icon: "send" }, "Send invitation"));
  }
  const STATUS = { ok: ["green", "Connected"], mock: [void 0, "Mocked"], soon: [void 0, "Soon"], waiting: ["amber", "Waiting for the first file"] };
  function IntegrationsTab({ c, me }) {
    const { toast } = useNotice();
    const connect = () => {
      P.update((d) => {
        d.clients.find((y) => y.id === c.id).integrations.push({ id: "dms", name: "Distributor stock exports", kind: "Inventory", status: "waiting", note: "Upload link sent to the distributors" });
      }, { who: me.name, client: c.id, text: `Asked ${c.name}'s distributors for their first stock export` });
      toast({ text: "Upload link sent", tone: "ok" });
    };
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 14 } }, c.integrations.length ? /* @__PURE__ */ React.createElement(List, null, c.integrations.map((i) => {
      const [tone, label] = STATUS[i.status] || [void 0, i.status];
      const con = P.CONNECTORS.find((x) => x.id === i.id);
      return /* @__PURE__ */ React.createElement(ListRow, { key: i.id, icon: con ? con.icon : "plug", iconTone: "soft", title: i.name, sub: `${i.kind} · ${i.note}`, value: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone, dot: !!tone }, label) });
    })) : /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "plug", title: "Nothing connected yet", body: "Start with the distributors' stock exports; everything else follows the first file.", action: /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "file-spreadsheet", onClick: connect }, "Ask for the first export") })), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, "Mocked connectors stand in for partner APIs in this prototype."));
  }
  function PlanTab({ c, me, onLive }) {
    const app = useApp();
    const { toast } = useNotice();
    const setPlan = (id) => {
      if (id === c.plan) return;
      P.update((d) => {
        d.clients.find((y) => y.id === c.id).plan = id;
      }, { who: me.name, client: c.id, text: `Moved ${c.name} from ${planName(c.plan)} to ${planName(id)}` });
      toast({ text: `${c.name} on ${planName(id)}`, tone: "ok" });
    };
    return /* @__PURE__ */ React.createElement(
      Columns,
      {
        sideWidth: 420,
        main: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Prices on request in this prototype" }, "Plan"), /* @__PURE__ */ React.createElement(Segmented, { label: "Plan", options: P.PLANS.map((p) => ({ id: p.id, label: p.name })), value: c.plan, onChange: setPlan, className: "lg" }), /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement("ul", { className: "cs-scope" }, (P.PLANS.find((p) => p.id === c.plan) || P.PLANS[0]).scope.map((x) => /* @__PURE__ */ React.createElement("li", { key: x }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, stroke: 2.4 }), x)))), c.status !== "live" && /* @__PURE__ */ React.createElement(Card, { className: "row wrap", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "stack tight grow", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "Not live yet"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Go live once the admin has accepted and the first stock export has arrived.")), /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "circle-play", onClick: onLive }, "Go live"))),
        side: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SectionTitle, null, "Usage"), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: "Distributors", value: c.distributors.length }), /* @__PURE__ */ React.createElement(ListRow, { title: "SKUs", value: c.skus.length }), /* @__PURE__ */ React.createElement(ListRow, { title: "Batches tracked", value: c.batches }), /* @__PURE__ */ React.createElement(ListRow, { title: "Recovered so far", value: c.recovered ? fmt.inr(c.recovered) : "none yet" }), /* @__PURE__ */ React.createElement(ListRow, { title: "People", value: c.people.filter((p) => p.status === "active").length + " active" })))
      }
    );
  }
  function AuditList({ filter }) {
    const s = usePlatform();
    const app = useApp();
    const rows = s.audit.filter((a) => !filter || a.client === filter);
    if (!rows.length) return /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(Empty, { icon: "scroll-text", title: "Nothing logged yet" }));
    return /* @__PURE__ */ React.createElement(List, null, rows.map((a) => {
      const c = s.clients.find((x) => x.id === a.client);
      return /* @__PURE__ */ React.createElement(ListRow, { key: a.id, leading: !filter && c ? /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 28 }) : null, title: a.text, sub: `${a.who} · ${a.at}${!filter && c ? " · " + c.name : ""}` });
    }));
  }
  const COLOURS = [["#2563eb", "Blue"], ["#7c3aed", "Violet"], ["#db2777", "Pink"], ["#0891b2", "Teal"], ["#b45309", "Brown"]];
  const STEPS = ["Company", "Workspace", "Supply chain", "Exits", "Agents", "People", "Review"];
  const INDUSTRIES = ["Snacks and drinks", "Personal care", "Dairy", "Staples", "Home care"];
  function NewClient({ go, me }) {
    const s = usePlatform();
    const app = useApp();
    const { toast } = useNotice();
    const top = useRef(null);
    const [step, setStep] = useState(0);
    const [f, setF] = useState(() => Object.assign({ name: "", city: "", industry: INDUSTRIES[0], colour: COLOURS[0][0], slug: "", slugTouched: false, emailDomain: "", signGoogle: true, signPhone: true, route: "distributors", owner: "distributor", expiry: "full-credit", exitOff: {}, preset: "standard", adminName: "", adminEmail: "", plan: "pilot", request: null }, s.draft || {}));
    useEffect(() => {
      if (s.draft) P.update((d) => {
        delete d.draft;
      });
    }, []);
    const set = (patch) => setF((x) => ({ ...x, ...patch }));
    const slug = f.slugTouched ? f.slug : P.slug(f.name);
    const profile = { route: f.route, owner: f.owner, expiry: f.expiry };
    const exits = useMemo(() => {
      const ex = P.exitsFor(profile);
      Object.keys(f.exitOff).forEach((k) => {
        if (ex[k] && !ex[k].locked && f.exitOff[k]) ex[k].on = false;
      });
      return ex;
    }, [f.route, f.owner, f.expiry, JSON.stringify(f.exitOff)]);
    const taken = s.clients.some((c) => c.id === slug);
    const domainOk = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(f.emailDomain.trim().toLowerCase());
    const adminOk = f.adminName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.adminEmail.trim()) && f.adminEmail.trim().toLowerCase().endsWith("@" + f.emailDomain.trim().toLowerCase());
    const errs = [
      !f.name.trim() ? "Enter the company's name." : !f.city.trim() ? "Enter its home city." : null,
      !/^[a-z0-9-]{2,24}$/.test(slug) ? "Use 2 to 24 lowercase letters, digits or hyphens." : taken ? `${slug}.smartclearance.com is taken.` : !domainOk ? "Enter the domain its staff email from, such as kesari.in." : !(f.signGoogle || f.signPhone) ? "Keep at least one way to sign in." : null,
      null,
      Object.values(exits).some((x) => x.on) ? null : "Keep at least one exit on.",
      null,
      !adminOk ? `Enter the admin's name and a ${f.emailDomain ? "@" + f.emailDomain : "company"} address.` : null,
      null
    ];
    const [tried, setTried] = useState(false);
    const next = () => {
      if (errs[step]) {
        setTried(true);
        return;
      }
      setTried(false);
      setStep((x) => Math.min(STEPS.length - 1, x + 1));
    };
    const back = () => {
      setTried(false);
      setStep((x) => Math.max(0, x - 1));
    };
    useLayoutEffect(() => {
      const el = top.current;
      const sc = el && el.closest(".scroll");
      if (sc) sc.scrollTop = 0;
    }, [step]);
    const create = () => {
      const client = P.buildClient({ name: f.name.trim(), city: f.city.trim(), industry: f.industry, colour: f.colour, emailDomain: f.emailDomain.trim().toLowerCase(), signGoogle: f.signGoogle, signPhone: f.signPhone, route: f.route, owner: f.owner, expiry: f.expiry, preset: f.preset, adminName: f.adminName.trim(), adminEmail: f.adminEmail.trim().toLowerCase(), plan: f.plan });
      client.id = slug;
      client.domain = slug + ".smartclearance.com";
      client.exits = exits;
      P.update((d) => {
        d.clients.push(client);
        if (f.request) d.requests = (d.requests || []).map((r) => r.id === f.request ? Object.assign({}, r, { status: "set up", client: slug }) : r);
      }, { who: me.name, client: slug, text: `Set up ${client.name} from its supply-chain profile: ${P.optLabel("route", f.route).toLowerCase()}, ${P.optLabel("owner", f.owner).toLowerCase()} owns the stock, ${P.optLabel("expiry", f.expiry).toLowerCase()}; invited ${client.people[0].name} as admin` });
      toast({ text: `${client.name}'s workspace is set up`, tone: "ok" });
      go("clients", slug, "agents", true);
    };
    const preview = { id: slug || "new", name: f.name || "?", mark: { from: f.colour, to: f.colour, ink: "#ffffff" } };
    const body = [
      /* @__PURE__ */ React.createElement("div", { className: "stack cs-form", style: { gap: 14 }, key: "company" }, /* @__PURE__ */ React.createElement(Field, { label: "Company name", htmlFor: "nc-name" }, /* @__PURE__ */ React.createElement(Input, { id: "nc-name", value: f.name, onChange: (e) => set({ name: e.target.value }), placeholder: "Kesari Foods" })), /* @__PURE__ */ React.createElement(Field, { label: "Home city", htmlFor: "nc-city" }, /* @__PURE__ */ React.createElement(Input, { id: "nc-city", value: f.city, onChange: (e) => set({ city: e.target.value }), placeholder: "Indore" })), /* @__PURE__ */ React.createElement(Field, { label: "What it makes", htmlFor: "nc-ind" }, /* @__PURE__ */ React.createElement(Select, { id: "nc-ind", value: f.industry, onChange: (e) => set({ industry: e.target.value }) }, INDUSTRIES.map((x) => /* @__PURE__ */ React.createElement("option", { key: x }, x)))), /* @__PURE__ */ React.createElement("fieldset", { className: "cs-choice" }, /* @__PURE__ */ React.createElement("legend", null, "Workspace mark"), /* @__PURE__ */ React.createElement("div", { className: "row wrap", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: preview, size: 52 }), /* @__PURE__ */ React.createElement("div", { className: "cs-swatches" }, COLOURS.map(([hex, name]) => /* @__PURE__ */ React.createElement("label", { key: hex, className: cx("cs-swatch", f.colour === hex && "on"), style: { "--sw": hex } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "nc-colour", checked: f.colour === hex, onChange: () => set({ colour: hex }) }), /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, name))))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "The client's colour stays inside its mark; the workspace keeps Smart-Clearance's theming."))),
      /* @__PURE__ */ React.createElement("div", { className: "stack cs-form", style: { gap: 14 }, key: "workspace" }, /* @__PURE__ */ React.createElement(Field, { label: "Workspace address", htmlFor: "nc-slug", help: "Where its people sign in" }, /* @__PURE__ */ React.createElement("span", { className: "cs-slug" }, /* @__PURE__ */ React.createElement(Input, { id: "nc-slug", value: slug, onChange: (e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""), slugTouched: true }), spellCheck: false }), /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote subtle" }, ".smartclearance.com"))), /* @__PURE__ */ React.createElement(Field, { label: "Staff email domain", htmlFor: "nc-domain", help: "Only addresses at this domain can sign in as staff" }, /* @__PURE__ */ React.createElement(Input, { id: "nc-domain", value: f.emailDomain, onChange: (e) => set({ emailDomain: e.target.value }), spellCheck: false, autoCapitalize: "none", placeholder: "kesari.in" })), /* @__PURE__ */ React.createElement("fieldset", { className: "cs-choice" }, /* @__PURE__ */ React.createElement("legend", null, "How people sign in"), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 8 } }, /* @__PURE__ */ React.createElement(Check, { checked: f.signGoogle, onChange: (v) => set({ signGoogle: v }) }, "Google Workspace, for staff"), /* @__PURE__ */ React.createElement(Check, { checked: f.signPhone, onChange: (v) => set({ signPhone: v }) }, "Mobile number and a one-time code, for invited distributors and kiranas")))),
      /* @__PURE__ */ React.createElement("div", { className: "cs-two", key: "supply" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18 } }, Object.keys(P.PROFILE).map((q) => /* @__PURE__ */ React.createElement(Choice, { key: q, name: "nc-" + q, label: P.PROFILE[q].label, options: P.PROFILE[q].options, value: f[q], onChange: (v) => set({ [q]: v, exitOff: {} }) }))), /* @__PURE__ */ React.createElement(ProfileSummary, { profile })),
      /* @__PURE__ */ React.createElement("div", { className: "stack cs-form", style: { gap: 14 }, key: "exits" }, /* @__PURE__ */ React.createElement(List, { foot: "The bin is always priced as the baseline, so every plan shows what it saves." }, P.EXITS.map((e) => /* @__PURE__ */ React.createElement(ListRow, { key: e.id, icon: e.icon, iconTone: "soft", title: e.name, sub: exits[e.id].locked || null, value: /* @__PURE__ */ React.createElement(Switch, { checked: !!exits[e.id].on, disabled: !!exits[e.id].locked, onChange: (v) => set({ exitOff: { ...f.exitOff, [e.id]: !v } }), label: e.name }) })))),
      /* @__PURE__ */ React.createElement("div", { className: "cs-two", key: "agents" }, /* @__PURE__ */ React.createElement(Choice, { name: "nc-preset", label: "How far the agents go at first", options: P.PRESETS.map((p) => ({ id: p.id, label: p.label })), value: f.preset, onChange: (v) => set({ preset: v }) }), /* @__PURE__ */ React.createElement(Card, { className: "cs-summary" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, P.PRESETS.find((p) => p.id === f.preset).text), /* @__PURE__ */ React.createElement("ul", null, P.AGENTS.map((a) => {
        const auto = P.agentDefaults(f.preset, {})[a.id].autonomy;
        return /* @__PURE__ */ React.createElement("li", { key: a.id }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 16, stroke: 2 }), /* @__PURE__ */ React.createElement("span", null, a.name), /* @__PURE__ */ React.createElement("span", { className: "grow" }), a.gate ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber", icon: "lock" }, "Always on") : /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: auto === "act" ? "green" : void 0 }, LEVEL(auto).label));
      })), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Each agent can be changed later, one at a time."))),
      /* @__PURE__ */ React.createElement("div", { className: "stack cs-form", style: { gap: 14 }, key: "people" }, /* @__PURE__ */ React.createElement(Field, { label: "Workspace admin's name", htmlFor: "nc-admin" }, /* @__PURE__ */ React.createElement(Input, { id: "nc-admin", value: f.adminName, onChange: (e) => set({ adminName: e.target.value }), placeholder: "Full name" })), /* @__PURE__ */ React.createElement(Field, { label: "Admin's work email", htmlFor: "nc-admin-email", help: `Must be an @${f.emailDomain || "company"} address; the invitation goes there` }, /* @__PURE__ */ React.createElement(Input, { id: "nc-admin-email", type: "email", value: f.adminEmail, onChange: (e) => set({ adminEmail: e.target.value }), spellCheck: false, autoCapitalize: "none", placeholder: `name@${f.emailDomain || "company.in"}` })), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, "The admin invites the rest of the team and the distributors, and approves plans until they name an approver.")),
      /* @__PURE__ */ React.createElement("div", { className: "cs-two", key: "review" }, /* @__PURE__ */ React.createElement(List, { head: "Summary" }, /* @__PURE__ */ React.createElement(ListRow, { leading: /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: preview, size: 32 }), title: f.name, sub: `${f.city} · ${f.industry}` }), /* @__PURE__ */ React.createElement(ListRow, { title: "Address", value: /* @__PURE__ */ React.createElement("span", { className: "mono t-footnote" }, slug, ".smartclearance.com") }), /* @__PURE__ */ React.createElement(ListRow, { title: "Staff sign in with", sub: [f.signGoogle && `Google (${f.emailDomain})`, f.signPhone && "a one-time code, by invitation"].filter(Boolean).join("; ") }), /* @__PURE__ */ React.createElement(ListRow, { title: "Supply chain", sub: `${P.optLabel("route", f.route)} · ${P.optLabel("owner", f.owner)} owns the stock · ${P.optLabel("expiry", f.expiry)}` }), /* @__PURE__ */ React.createElement(ListRow, { title: "Exits", sub: P.EXITS.filter((e) => exits[e.id].on).map((e) => e.name).join(", ") }), /* @__PURE__ */ React.createElement(ListRow, { title: "Agents", sub: P.PRESETS.find((p) => p.id === f.preset).label + "; the approval is always on" }), /* @__PURE__ */ React.createElement(ListRow, { title: "Admin", sub: `${f.adminName} · ${f.adminEmail}` })), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(SectionTitle, { sub: "Prices on request" }, "Plan"), /* @__PURE__ */ React.createElement(Segmented, { label: "Plan", options: P.PLANS.map((p) => ({ id: p.id, label: p.name })), value: f.plan, onChange: (v) => set({ plan: v }) }), /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement("ul", { className: "cs-scope" }, P.PLANS.find((p) => p.id === f.plan).scope.map((x) => /* @__PURE__ */ React.createElement("li", { key: x }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, stroke: 2.4 }), x))))))
    ];
    return /* @__PURE__ */ React.createElement(Screen, { title: "New client", sub: `Step ${step + 1} of ${STEPS.length} · ${STEPS[step]}`, back: "Clients", onBack: () => go("clients") }, /* @__PURE__ */ React.createElement("div", { ref: top, className: "cs-wizard" }, app.bp !== "phone" ? /* @__PURE__ */ React.createElement("ol", { className: "cs-steps", "aria-label": "Steps" }, STEPS.map((t, i) => /* @__PURE__ */ React.createElement("li", { key: t, className: cx(i < step && "done", i === step && "now"), "aria-current": i === step ? "step" : void 0 }, /* @__PURE__ */ React.createElement("span", { className: "cs-sn", "aria-hidden": "true" }, i < step ? /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 13, stroke: 2.8 }) : i + 1), i < step ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-link", onClick: () => setStep(i) }, t) : /* @__PURE__ */ React.createElement("span", null, t)))) : /* @__PURE__ */ React.createElement(K.Progress, { value: (step + 1) / STEPS.length, label: `Step ${step + 1} of ${STEPS.length}` }), /* @__PURE__ */ React.createElement("section", { className: "cs-step", "aria-labelledby": "cs-step-h" }, /* @__PURE__ */ React.createElement("h2", { id: "cs-step-h", className: "t-title3" }, STEPS[step]), body[step], tried && errs[step] && /* @__PURE__ */ React.createElement("p", { className: "cs-err", role: "alert" }, errs[step]), /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 10, justifyContent: "flex-end", paddingTop: 6 } }, step > 0 && /* @__PURE__ */ React.createElement(Button, { onClick: back }, "Back"), step < STEPS.length - 1 ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: next }, "Continue") : /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "check", onClick: create }, "Create workspace")))));
  }
  function AgentsPage({ go }) {
    const s = usePlatform();
    return /* @__PURE__ */ React.createElement(Screen, { title: "Agents", sub: "The agents every workspace runs, in the order they work. Each client sets how far they go." }, /* @__PURE__ */ React.createElement("div", { className: "cs-catalog" }, P.AGENTS.map((a) => /* @__PURE__ */ React.createElement(Card, { key: a.id, className: cx("cs-agentcard", a.gate && "is-gate") }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: cx("icontile", a.gate ? "amber" : "") }, /* @__PURE__ */ React.createElement(Icon, { name: a.icon, size: 17, stroke: 2 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, a.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, P.STAGE_NAME[a.stage], " · ", a.gate ? "a person, always" : a.model))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted", style: { margin: 0 } }, a.job, "."), /* @__PURE__ */ React.createElement("div", { className: "row tight wrap" }, s.clients.map((c) => {
      const cfg = c.agents[a.id];
      return /* @__PURE__ */ React.createElement("button", { type: "button", key: c.id, className: "chip", onClick: () => go("clients", c.id, "agents") }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 18 }), c.name, ": ", a.gate ? "on" : !cfg.on ? "off" : LEVEL(cfg.autonomy).label);
    }))))));
  }
  function ConnectorsPage({ go }) {
    const s = usePlatform();
    const app = useApp();
    const kinds = [...new Set(P.CONNECTORS.map((x2) => x2.kind))];
    const [open, setOpen] = useState(null);
    const users = (id) => s.clients.filter((c) => c.integrations.some((i) => i.id === id));
    const x = open && P.CONNECTORS.find((y) => y.id === open);
    const xu = x ? users(x.id) : [];
    return /* @__PURE__ */ React.createElement(Screen, { title: "Connectors", sub: "What a workspace can connect to; mocked ones stand in for partner APIs" }, /* @__PURE__ */ React.createElement("div", { className: "cs-connectors" }, kinds.map((k) => /* @__PURE__ */ React.createElement(List, { key: k, head: k }, P.CONNECTORS.filter((y) => y.kind === k).map((y) => {
      const [tone, label] = STATUS[y.status];
      const u = users(y.id);
      return /* @__PURE__ */ React.createElement(ListRow, { key: y.id, icon: y.icon, iconTone: "soft", title: y.name, sub: `${y.note}${u.length ? " · used by " + u.map((c) => c.name).join(", ") : ""}`, value: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone, dot: !!tone }, label), chevron: true, onClick: () => setOpen(y.id) });
    })))), /* @__PURE__ */ React.createElement(Sheet, { open: !!x, onClose: () => setOpen(null), title: x ? x.name : "", side: app.bp === "phone" ? "bottom" : "center", detent: "medium" }, x && /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("span", { className: "icontile soft", style: { width: 40, height: 40, borderRadius: 12 } }, /* @__PURE__ */ React.createElement(Icon, { name: x.icon, size: 20 })), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("b", { className: "t-headline" }, x.name), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, x.kind, " · ", STATUS[x.status][1]))), /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0 } }, x.note, ".", x.status === "mock" ? " In this prototype it is mocked: the agents call it, and it answers as the partner would." : x.status === "soon" ? " Not available yet." : ""), /* @__PURE__ */ React.createElement(List, { head: "Used by" }, xu.length ? xu.map((c) => /* @__PURE__ */ React.createElement(ListRow, { key: c.id, leading: /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 28 }), title: c.name, sub: c.domain, chevron: true, onClick: () => {
      setOpen(null);
      go("clients", c.id, "integrations");
    } })) : /* @__PURE__ */ React.createElement(ListRow, { title: "No client yet" })))));
  }
  function PlansPage({ go }) {
    const s = usePlatform();
    return /* @__PURE__ */ React.createElement(Screen, { title: "Plans", sub: "Plans are scoped by reach, not seats; prices on request in this prototype" }, /* @__PURE__ */ React.createElement("div", { className: "cs-plans" }, P.PLANS.map((p) => {
      const on = s.clients.filter((c) => c.plan === p.id);
      return /* @__PURE__ */ React.createElement(Card, { key: p.id, className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement("b", { className: "t-title3" }, p.name), /* @__PURE__ */ React.createElement("ul", { className: "cs-scope" }, p.scope.map((x) => /* @__PURE__ */ React.createElement("li", { key: x }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 16, stroke: 2.4 }), x))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "Prices on request"), /* @__PURE__ */ React.createElement("div", { className: "row tight wrap" }, on.length ? on.map((c) => /* @__PURE__ */ React.createElement("button", { type: "button", key: c.id, className: "chip", onClick: () => go("clients", c.id, "plan") }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 18 }), c.name)) : /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, "No clients on this plan yet")));
    })));
  }
  function StaffPage({ me }) {
    const s = usePlatform();
    const app = useApp();
    const { toast } = useNotice();
    const [inv, setInv] = useState(false);
    const [f, setF] = useState({ name: "", email: "", role: "Support" });
    const [err, setErr] = useState("");
    const send = () => {
      if (!f.name.trim()) {
        setErr("Enter a name.");
        return;
      }
      if (!/^[^\s@]+@smartclearance\.com$/i.test(f.email.trim())) {
        setErr("Staff use a smartclearance.com address.");
        return;
      }
      P.update((d) => {
        d.staff.push({ id: "st-" + Date.now().toString(36), name: f.name.trim(), short: f.name.trim().split(" ")[0], role: f.role, team: f.role === "Support" ? "Customer success" : "Platform", email: f.email.trim().toLowerCase(), passkey: "not set up yet", status: "invited" });
      }, { who: me.name, client: null, text: `Invited ${f.name.trim()} to the console as ${f.role}` });
      toast({ text: `Invitation sent to ${f.name.trim()}`, tone: "ok" });
      setInv(false);
      setF({ name: "", email: "", role: "Support" });
      setErr("");
    };
    return /* @__PURE__ */ React.createElement(Screen, { title: "Staff", sub: "Smart-Clearance people who can sign in to the console", actions: /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "sm", icon: "user-plus", onClick: () => setInv(true) }, "Invite") }, /* @__PURE__ */ React.createElement(DataTable, { label: "Console staff", rows: s.staff, columns: [
      { key: "name", label: "Person", render: (x) => /* @__PURE__ */ React.createElement("span", { className: "row tight" }, /* @__PURE__ */ React.createElement(Avatar, { person: x, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0 } }, /* @__PURE__ */ React.createElement("b", null, x.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, x.email))) },
      { key: "role", label: "Role" },
      { key: "team", label: "Team" },
      { key: "passkey", label: "Passkey" },
      { key: "status", label: "Status", render: (x) => /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: x.status === "active" ? "green" : void 0, dot: true }, x.status) }
    ] }), /* @__PURE__ */ React.createElement(Sheet, { open: inv, onClose: () => setInv(false), title: "Invite a colleague", side: app.bp === "phone" ? "bottom" : "center", detent: "large", footer: /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, icon: "send", onClick: send }, "Send invitation") }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Field, { label: "Name", htmlFor: "st-name" }, /* @__PURE__ */ React.createElement(Input, { id: "st-name", value: f.name, onChange: (e) => {
      setF({ ...f, name: e.target.value });
      setErr("");
    } })), /* @__PURE__ */ React.createElement(Field, { label: "smartclearance.com email", htmlFor: "st-email", error: err || null }, /* @__PURE__ */ React.createElement(Input, { id: "st-email", type: "email", value: f.email, onChange: (e) => {
      setF({ ...f, email: e.target.value });
      setErr("");
    }, spellCheck: false, autoCapitalize: "none", placeholder: "name@smartclearance.com" })), /* @__PURE__ */ React.createElement(Field, { label: "Role", htmlFor: "st-role" }, /* @__PURE__ */ React.createElement(Select, { id: "st-role", value: f.role, onChange: (e) => setF({ ...f, role: e.target.value }) }, ["Super admin", "Platform engineer", "Support"].map((x) => /* @__PURE__ */ React.createElement("option", { key: x }, x)))), /* @__PURE__ */ React.createElement("p", { className: "t-footnote subtle", style: { margin: 0 } }, "They sign in with Google and set up a passkey on first sign-in."))));
  }
  function AuditPage() {
    const s = usePlatform();
    const [f, setF] = useState(null);
    return /* @__PURE__ */ React.createElement(Screen, { title: "Audit log", sub: "Every change staff and client admins make, newest first" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "chip", "aria-pressed": !f, onClick: () => setF(null) }, "Everything"), s.clients.map((c) => /* @__PURE__ */ React.createElement("button", { type: "button", key: c.id, className: "chip", "aria-pressed": f === c.id, onClick: () => setF(c.id) }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: c, size: 18 }), c.name))), /* @__PURE__ */ React.createElement(AuditList, { filter: f })));
  }
  function AccountSheet({ open, onClose, me, onOut }) {
    const app = useApp();
    const { toast } = useNotice();
    const [reset, setReset] = useState(false);
    return /* @__PURE__ */ React.createElement(Sheet, { open, onClose, title: "Account", side: app.bp === "phone" ? "bottom" : "center", detent: "medium" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(Avatar, { person: me, size: "lg" }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("b", { className: "t-headline" }, me.name), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, me.role, " · ", me.team))), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: "Email", value: /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, me.email) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Passkey", value: /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, me.passkey) })), /* @__PURE__ */ React.createElement("div", { className: "row tight wrap" }, /* @__PURE__ */ React.createElement(Button, { icon: "log-out", onClick: onOut }, "Sign out"), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", icon: "rotate-ccw", onClick: () => setReset(true) }, "Reset prototype data")), /* @__PURE__ */ React.createElement(Alert, { open: reset, onClose: () => setReset(false), title: "Reset the prototype's data?", message: "Clients you set up and every change go back to the seed: Munchly Foods as the only client.", actions: [{ label: "Cancel" }, { label: "Reset", danger: true, strong: true, onClick: () => {
      P.reset();
      toast({ text: "Back to the seed data", tone: "ok" });
      onClose();
    } }] })));
  }
  const TITLES = { overview: "Overview", clients: "Clients", "new-client": "New client", agents: "Agents", connectors: "Connectors", plans: "Plans", staff: "Staff", audit: "Audit log" };
  function App() {
    const [session, setSession] = useState(readSession);
    const [route, go] = useHashRoute();
    const s = usePlatform();
    const [acct, setAcct] = useState(false);
    const reduce = useReducedMotion();
    const top = useRef(null);
    const me = session && s.staff.find((x) => x.id === session.uid && x.status === "active");
    const client = route.name === "clients" && route.id ? s.clients.find((c) => c.id === route.id) : null;
    useEffect(() => {
      document.title = me ? `${client ? client.name : TITLES[route.name] || "Overview"} · Smart-Clearance Console` : "Sign in · Smart-Clearance Console";
    }, [me && me.id, route.name, client && client.name]);
    useLayoutEffect(() => {
      const el = top.current;
      const sc = el && el.closest(".scroll");
      if (sc) sc.scrollTop = 0;
    }, [route.name, route.id]);
    if (!me) return /* @__PURE__ */ React.createElement(SignIn, { onIn: (uid) => {
      const v = { uid, at: Date.now() };
      writeSession(v);
      setSession(v);
      go(route.name && route.name !== "overview" ? route.name : "overview", route.id, route.tab, true);
    } });
    const name = TITLES[route.name] ? route.name : "overview";
    const screen = name === "clients" && route.id ? /* @__PURE__ */ React.createElement(ClientPage, { id: route.id, tab: route.tab, go, me }) : name === "clients" ? /* @__PURE__ */ React.createElement(Clients, { go }) : name === "new-client" ? /* @__PURE__ */ React.createElement(NewClient, { go, me }) : name === "agents" ? /* @__PURE__ */ React.createElement(AgentsPage, { go }) : name === "connectors" ? /* @__PURE__ */ React.createElement(ConnectorsPage, { go }) : name === "plans" ? /* @__PURE__ */ React.createElement(PlansPage, { go }) : name === "staff" ? /* @__PURE__ */ React.createElement(StaffPage, { me }) : name === "audit" ? /* @__PURE__ */ React.createElement(AuditPage, null) : /* @__PURE__ */ React.createElement(Overview, { go, me });
    const nav = NAV.map((n) => n.id === "clients" ? { ...n, count: s.clients.length } : n);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      Shell,
      {
        nav,
        current: name === "new-client" ? "clients" : name,
        onNav: (id) => go(id),
        user: { name: me.name, role: me.role, org: "Smart-Clearance" },
        onUser: () => setAcct(true),
        brand: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Mark, { size: 32 }), /* @__PURE__ */ React.createElement("span", { className: "cs-brand" }, /* @__PURE__ */ React.createElement(Wordmark, { size: 17 }), /* @__PURE__ */ React.createElement("span", { className: "cs-brand-sub" }, "Console")))
      },
      /* @__PURE__ */ React.createElement(motion.div, { key: name + (route.id || ""), ref: top, initial: reduce ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }, screen)
    ), /* @__PURE__ */ React.createElement(AccountSheet, { open: acct, onClose: () => setAcct(false), me, onOut: () => {
      setAcct(false);
      writeSession(null);
      setSession(null);
      history.replaceState(null, "", location.pathname + location.search);
    } }));
  }
  function Root() {
    return /* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { className: "app-root", style: { position: "fixed", inset: 0 } }, /* @__PURE__ */ React.createElement(NoticeHost, null, /* @__PURE__ */ React.createElement(App, null))));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Root, null));
})();
