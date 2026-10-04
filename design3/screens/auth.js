(function() {
  const { useState, useEffect, useContext, Fragment } = React;
  const { motion, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS;
  const fmt = M.fmt;
  const { cx, Icon, Avatar, Badge, Button, Sheet, Field, Input, OTP, Money, Mark, Wordmark, WorkspaceMark, PoweredBy, Product, Tracker, List, ListRow, useApp } = K;
  const WS = D.WORKSPACE, WS_OF = D.WORKSPACE.name + "' workspace";
  const TEST_CODE = "246810";
  const userById = (id) => Store.get().users.find((u) => u.id === id);
  const digits = (v) => {
    const d = (v || "").replace(/\D/g, "");
    return d.length === 12 && d.startsWith("91") ? d.slice(2) : d;
  };
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
  const phoneOf = (d) => "+91 " + d.replace(/(\d{5})(\d{5})/, "$1 $2");
  const role = (r) => (S.ROLES[r] || r).toLowerCase();
  const GoogleG = ({ size = 18 }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 48 48", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { fill: "#FFC107", d: "M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" }), /* @__PURE__ */ React.createElement("path", { fill: "#FF3D00", d: "M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" }), /* @__PURE__ */ React.createElement("path", { fill: "#4CAF50", d: "M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" }), /* @__PURE__ */ React.createElement("path", { fill: "#1976D2", d: "M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" }));
  const Url = () => /* @__PURE__ */ React.createElement("span", { className: "si-url" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 12, stroke: 2.2 }), WS.domain);
  const DEMO_PEOPLE = [
    { group: "Munchly Foods", note: "staff · Google Workspace", ids: [["priya", "Approve the plan for the chips batch"], ["anita", "Review Munchly's credit note and GST memo"], ["vikram", "Export the BRSR table"], ["arjun", "The workspace, its people and the guardrails"]] },
    { group: "Invited partners", note: "a one-time code or Google", ids: [["rakesh", "Give the permission, send the photo, run the van"], ["ganesh", "Order from the Hindi offer"], ["meera", "Confirm a food-bank pickup"]] },
    { group: "Outside the workspace", note: "ExpireSoon, another company's marketplace", ids: [["agrawal", "Bid on the lot from Raipur"]] }
  ];
  const DEMO = DEMO_PEOPLE.reduce((t, g) => t.concat(g.ids), []);
  function PeopleList({ onPick, busy, current }) {
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 18 } }, DEMO_PEOPLE.map((g) => /* @__PURE__ */ React.createElement("div", { key: g.group, className: "stack tight", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "row tight" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, g.group), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, g.note)), /* @__PURE__ */ React.createElement("div", { className: "si-people" }, g.ids.map(([id, what]) => {
      const u = userById(id);
      return /* @__PURE__ */ React.createElement("button", { type: "button", key: id, className: cx("si-person", current === id && "on"), onClick: () => onPick(id) }, /* @__PURE__ */ React.createElement(Avatar, { person: u, size: "lg" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 1 } }, /* @__PURE__ */ React.createElement("b", null, u.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, S.ROLES[u.role], " · ", u.org), /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, what)), busy === id ? /* @__PURE__ */ React.createElement(K.Spinner, { size: 18 }) : current === id ? /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green" }, "you") : null);
    })))));
  }
  function HeroStage({ guided }) {
    const reduce = useReducedMotion();
    const [paused, setPaused] = useState(() => {
      try {
        return localStorage.getItem("sc3-hero-paused") === "1";
      } catch (e) {
        return false;
      }
    });
    const [k, setK] = useState(() => paused ? 9 : 0);
    const done = k >= 9;
    useEffect(() => {
      if (reduce) {
        setK(9);
        return;
      }
      if (paused || k >= 9) return;
      const t = setTimeout(() => setK(k + 1), 1e3);
      return () => clearTimeout(t);
    }, [reduce, paused, k]);
    const remember = (v) => {
      try {
        localStorage.setItem("sc3-hero-paused", v ? "1" : "0");
      } catch (e) {
      }
    };
    const control = () => {
      if (done) {
        setK(0);
        setPaused(false);
        remember(false);
      } else {
        setPaused(!paused);
        remember(!paused);
      }
    };
    const stages = D.STAGES.map((x) => ({ id: x.id, title: x.title, human: x.human }));
    return /* @__PURE__ */ React.createElement("div", { className: cx("si-stage", paused && "paused") }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "si-product" }, /* @__PURE__ */ React.createElement(Mark, { size: 36 }), /* @__PURE__ */ React.createElement(Wordmark, { size: 21 })), /* @__PURE__ */ React.createElement("p", { className: "si-tagline" }, "Every near-expiry carton gets a second chance, chosen by AI. ", /* @__PURE__ */ React.createElement("span", { className: "hi", lang: "hi" }, "हर कार्टन को दूसरा मौका"))), /* @__PURE__ */ React.createElement("div", { className: "si-renders", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: "pack-chips", size: 176, float: true, className: "r1" }), /* @__PURE__ */ React.createElement(Product, { name: "carton-hero", size: 208, float: true, className: "r2" }), /* @__PURE__ */ React.createElement(Product, { name: "pack-mango", size: 150, float: true, className: "r3" })), !guided && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "si-figure" }, /* @__PURE__ */ React.createElement("span", { className: "si-cap" }, "Recovered from one batch of Munchly chips headed for the bin"), /* @__PURE__ */ React.createElement(Money, { value: k >= 9 ? D.ACTUAL.net : Math.round(D.ACTUAL.net * k / 9), size: "xl", roll: true, style: { color: "var(--primary-text)" } }), /* @__PURE__ */ React.createElement("span", { className: "si-cap" }, "instead of ", fmt.inr(-D.PLAN.writeOff.total), " to destroy it")), /* @__PURE__ */ React.createElement("div", { className: "si-track", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Tracker, { stages, done: Math.min(k, 9), current: k < 9 ? k : -1 })), !reduce && /* @__PURE__ */ React.createElement("div", { className: "si-ctl" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: control }, /* @__PURE__ */ React.createElement(Icon, { name: done ? "rotate-ccw" : paused ? "play" : "pause", size: 15 }), done ? "Replay animation" : paused ? "Play animation" : "Pause animation"))));
  }
  function FindWorkspace({ open, onClose, onUse, initial }) {
    const app = useApp();
    const [v, setV] = useState("");
    const [res, setRes] = useState(null);
    const [err, setErr] = useState("");
    useEffect(() => {
      if (open) {
        setV(initial || "");
        setRes(null);
        setErr("");
      }
    }, [open]);
    const find = () => {
      const t = v.trim();
      setErr("");
      setRes(null);
      if (!t) {
        setErr("Enter an email address or a mobile number.");
        return;
      }
      const users = Store.get().users;
      let u = null;
      if (isEmail(t)) u = users.find((x) => x.email && x.email.toLowerCase() === t.toLowerCase());
      else if (digits(t).length === 10) u = users.find((x) => x.phone && digits(x.phone) === digits(t));
      else {
        setErr("Enter an email address, or a 10-digit mobile number.");
        return;
      }
      if (u && u.kind !== "external") setRes([{ as: u.status === "invited" ? `invited as ${role(u.role)}` : u.status === "deactivated" ? "deactivated by the admin" : role(u.role), value: t }]);
      else if (isEmail(t) && t.toLowerCase().endsWith("@" + WS.emailDomain)) setRes([{ as: "your company's workspace · ask its admin for access", value: t }]);
      else setRes([]);
    };
    return /* @__PURE__ */ React.createElement(
      Sheet,
      {
        open,
        onClose,
        title: "Find your workspace",
        side: app.bp === "phone" ? "bottom" : "center",
        detent: "large",
        footer: /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, onClick: find }, "Find workspaces")
      },
      /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "row tight" }, /* @__PURE__ */ React.createElement(Mark, { size: 28, still: true }), /* @__PURE__ */ React.createElement(Wordmark, { size: 17 }), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle mono" }, D.PLATFORM.domain)), /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0 } }, "Every manufacturer on Smart-Clearance has its own workspace, set up for its supply chain. Enter the email or mobile number you were invited with."), /* @__PURE__ */ React.createElement(Field, { label: "Email or mobile number", htmlFor: "fw-id", error: err }, /* @__PURE__ */ React.createElement(Input, { id: "fw-id", value: v, onChange: (e) => {
        setV(e.target.value);
        setErr("");
        setRes(null);
      }, onKeyDown: (e) => e.key === "Enter" && find(), autoComplete: "username", placeholder: "name@company.in or 98230 44118" })), res && (res.length ? /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle strong" }, res.length === 1 ? "1 workspace" : res.length + " workspaces"), res.map((r) => /* @__PURE__ */ React.createElement("div", { key: r.value, className: "card row", style: { gap: 12, padding: "12px 14px" } }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: 40 }), /* @__PURE__ */ React.createElement("span", { className: "stack tight grow", style: { gap: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", null, WS.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle mono", style: { overflowWrap: "anywhere" } }, WS.domain), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, r.as)), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "sm", onClick: () => onUse(r.value) }, "Open")))) : /* @__PURE__ */ React.createElement("div", { className: "card stack tight", style: { padding: "14px 16px" } }, /* @__PURE__ */ React.createElement("b", null, "No workspace uses that yet"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Ask your company's admin to invite you. If your company is setting up Smart-Clearance, its workspace appears here once it is live."))), /* @__PURE__ */ React.createElement("p", { className: "t-caption subtle", style: { margin: 0 } }, "Only ", WS.name, " is set up in this prototype."))
    );
  }
  function SignIn({ onSignIn, install, guided, prefill }) {
    const app = useApp();
    const reduce = useReducedMotion();
    const [id, setId] = useState(prefill || "");
    const [err, setErr] = useState(null);
    const [busy, setBusy] = useState(null);
    const [sheet, setSheet] = useState(null);
    const [who, setWho] = useState(null);
    const [code, setCode] = useState("");
    const [codeErr, setCodeErr] = useState("");
    const finish = (uid) => {
      setBusy(uid);
      setTimeout(() => {
        setBusy(null);
        setSheet(null);
        onSignIn(uid);
      }, 600);
    };
    const proceed = () => {
      const v = id.trim();
      setErr(null);
      if (!v) {
        setErr({ text: "Enter your work email or mobile number." });
        return;
      }
      const users = Store.get().users;
      if (isEmail(v)) {
        const email = v.toLowerCase();
        const u = users.find((x) => x.email && x.email.toLowerCase() === email);
        if (u && u.kind === "external") {
          setErr({ text: `${u.org} buys on ExpireSoon, another company's marketplace, so it has no account in ${WS_OF}.`, es: u.id });
          return;
        }
        if (u && u.status === "deactivated") {
          setErr({ text: "Your admin deactivated this account. Ask Munchly's workspace admin to restore it." });
          return;
        }
        if (!u) {
          setErr({ text: email.endsWith("@" + WS.emailDomain) ? `There's no account for ${email} in ${WS_OF} yet. Ask your workspace admin for access.` : `${email} isn't a member of ${WS_OF}.`, find: true });
          return;
        }
        setBusy("go");
        setTimeout(() => {
          setBusy(null);
          setWho(u);
          setSheet("google");
        }, 500);
        return;
      }
      const d = digits(v);
      if (d.length === 10) {
        const u = users.find((x) => x.phone && digits(x.phone) === d);
        if (!u) {
          setErr({ text: `No one has invited ${phoneOf(d)} to ${WS_OF}. Ask your distributor or Munchly for an invitation.`, find: true });
          return;
        }
        if (u.status === "deactivated") {
          setErr({ text: "Your admin deactivated this number. Ask your distributor or Munchly to restore it." });
          return;
        }
        setBusy("go");
        setTimeout(() => {
          setBusy(null);
          setWho(u);
          setCode(guided ? TEST_CODE : "");
          setCodeErr("");
          setSheet("code");
        }, 600);
        return;
      }
      setErr({ text: "Enter an email address, or a 10-digit mobile number." });
    };
    const verify = (v) => {
      const c = v || code;
      if (c.length < 6) return;
      setBusy("verify");
      setTimeout(() => {
        setBusy(null);
        if (c !== TEST_CODE) {
          setCodeErr(`That code doesn't match. This prototype sends ${TEST_CODE}.`);
          setCode("");
          return;
        }
        if (who.status === "invited") setSheet("join");
        else finish(who.id);
      }, 700);
    };
    const join = () => {
      Flow.act("join", who.id);
      finish(who.id);
    };
    const TRY = [["priya", D.PEOPLE.priya.email], ["rakesh", D.PEOPLE.rakesh.phone], ["ganesh", D.PEOPLE.ganesh.phone], ["shreesai", "+91 98230 60013"]];
    const isPhone = who && !!who.phone && sheet !== "google";
    return /* @__PURE__ */ React.createElement("div", { className: cx("signin", guided && "guided") }, /* @__PURE__ */ React.createElement("div", { className: "ground", "aria-hidden": "true" }), app.bp === "desktop" && /* @__PURE__ */ React.createElement(HeroStage, { guided }), /* @__PURE__ */ React.createElement("div", { className: "si-panel" }, /* @__PURE__ */ React.createElement("div", { className: "si-card" }, /* @__PURE__ */ React.createElement("div", { className: "si-ws" }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: app.bp === "phone" ? 52 : 60 }), /* @__PURE__ */ React.createElement("div", { className: "si-ws-name" }, WS.name), /* @__PURE__ */ React.createElement(Url, null)), app.bp !== "desktop" && /* @__PURE__ */ React.createElement("div", { className: "si-hero", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Product, { name: "carton-hero", size: app.bp === "phone" ? 132 : 160, float: true }), !guided && /* @__PURE__ */ React.createElement(motion.div, { className: "si-chip", initial: reduce ? false : { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.9 } }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "MF-2409-117"), " · routed · ", /* @__PURE__ */ React.createElement(Money, { value: D.ACTUAL.net, size: "s", style: { fontSize: 15 } }), " recovered"))), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 6 } }, /* @__PURE__ */ React.createElement("h1", { className: "si-title" }, "Sign in"), /* @__PURE__ */ React.createElement("p", { className: "si-sub" }, "Use your Munchly email, or the mobile number Munchly or your distributor invited.")), /* @__PURE__ */ React.createElement("form", { className: "si-form", onSubmit: (e) => {
      e.preventDefault();
      proceed();
    }, noValidate: true }, /* @__PURE__ */ React.createElement(Field, { label: "Work email or mobile number", htmlFor: "si-id", error: err && err.text }, /* @__PURE__ */ React.createElement(Input, { id: "si-id", value: id, onChange: (e) => {
      setId(e.target.value);
      setErr(null);
    }, autoComplete: "username", spellCheck: false, autoCapitalize: "none", placeholder: "name@munchly.in or 98230 44118" })), err && (err.find || err.es) && /* @__PURE__ */ React.createElement("div", { className: "row tight wrap", style: { marginTop: -4 } }, err.find && /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link btn-sm", onClick: () => setSheet("find") }, "Find your workspace"), err.es && /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link btn-sm", onClick: () => finish(err.es) }, "Open ExpireSoon instead")), /* @__PURE__ */ React.createElement(Button, { type: "submit", variant: "primary", size: "lg", block: true, loading: busy === "go" }, "Continue")), !guided && /* @__PURE__ */ React.createElement("div", { className: "si-try" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle strong" }, "Accounts in this prototype"), /* @__PURE__ */ React.createElement("div", { className: "row tight wrap", style: { justifyContent: "center" } }, TRY.map(([uid, val]) => {
      const u = userById(uid);
      return u ? /* @__PURE__ */ React.createElement("button", { type: "button", key: uid, className: "chip", onClick: () => {
        setId(val);
        setErr(null);
      } }, /* @__PURE__ */ React.createElement(Avatar, { person: u, size: "xs" }), u.short || u.name, u.status === "invited" ? " · invited" : "") : null;
    }))), !guided && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "si-or", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", null, "or")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-secondary btn-lg btn-block", onClick: () => setSheet("demo") }, /* @__PURE__ */ React.createElement(Icon, { name: "users", size: 18 }), "Explore as someone in the story")), /* @__PURE__ */ React.createElement("div", { className: "si-foot" }, /* @__PURE__ */ React.createElement(PoweredBy, null), /* @__PURE__ */ React.createElement("span", { className: "si-foot-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link btn-sm", onClick: () => setSheet("find") }, "Not your workspace? Find yours"), install && install.can && /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-ghost btn-sm", onClick: install.prompt }, /* @__PURE__ */ React.createElement(Icon, { name: "download", size: 15 }), "Install")), /* @__PURE__ */ React.createElement("span", { className: "si-note" }, "Prototype · every company, person and number is fictional")))), /* @__PURE__ */ React.createElement(Sheet, { open: sheet === "google", onClose: () => setSheet(null), title: "Sign in with Google", side: app.bp === "phone" ? "bottom" : "center", detent: "medium" }, who && /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "row tight" }, /* @__PURE__ */ React.createElement(GoogleG, { size: 20 }), /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, /* @__PURE__ */ React.createElement("b", null, "Choose an account"), " to continue to ", /* @__PURE__ */ React.createElement("span", { className: "mono" }, WS.domain))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "list-row si-acct", onClick: () => finish(who.id) }, /* @__PURE__ */ React.createElement(Avatar, { person: who, size: "sm" }), /* @__PURE__ */ React.createElement("span", { className: "stack tight", style: { gap: 0, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, who.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle", style: { overflowWrap: "anywhere" } }, who.email)), busy === who.id ? /* @__PURE__ */ React.createElement(K.Spinner, { size: 18 }) : /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18, className: "subtle" })), /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted", style: { margin: 0 } }, who.kind === "staff" ? `${WS.name} lets in only ${WS.emailDomain} accounts, through its own Google Workspace.` : `${who.org} was invited to ${WS_OF} as a ${role(who.role)}.`))), /* @__PURE__ */ React.createElement(
      Sheet,
      {
        open: sheet === "code",
        onClose: () => setSheet(null),
        title: "Enter the code",
        side: app.bp === "phone" ? "bottom" : "center",
        detent: "medium",
        footer: /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, loading: busy === "verify" || who && busy === who.id, disabled: code.length < 6, onClick: () => verify() }, "Verify and continue")
      },
      who && isPhone && /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0 } }, "Sent by SMS to ", phoneOf(digits(who.phone)), guided ? ", and filled in from the message." : ".", " This prototype's code is ", /* @__PURE__ */ React.createElement("b", { className: "mono" }, TEST_CODE), "."), /* @__PURE__ */ React.createElement(OTP, { value: code, onChange: (v) => {
        setCode(v);
        setCodeErr("");
        if (v.length === 6 && !guided) verify(v);
      }, autoFocus: !app.embedded }), codeErr && /* @__PURE__ */ React.createElement("p", { className: "t-footnote", style: { color: "var(--red-text)", margin: 0 }, role: "alert" }, codeErr), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn-link", style: { alignSelf: "flex-start" }, onClick: () => {
        setSheet(null);
        setCode("");
      } }, "Use a different number"))
    ), /* @__PURE__ */ React.createElement(
      Sheet,
      {
        open: sheet === "join",
        onClose: () => setSheet(null),
        title: `Join ${WS.name}`,
        side: app.bp === "phone" ? "bottom" : "center",
        detent: "medium",
        footer: /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, loading: who && busy === who.id, onClick: join }, "Join the workspace")
      },
      who && /* @__PURE__ */ React.createElement("div", { className: "stack", style: { justifyItems: "center", textAlign: "center" } }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: 64 }), /* @__PURE__ */ React.createElement("div", { className: "t-title3", style: { textWrap: "balance" } }, who.org, " is invited to ", WS_OF), /* @__PURE__ */ React.createElement("p", { className: "t-subhead muted", style: { margin: 0, maxWidth: "40ch" } }, who.invitedBy || WS.name, " added this number as a ", role(who.role), ". Offers, orders and payments for ", WS.name, "' stock come here, in your language."), /* @__PURE__ */ React.createElement(Url, null))
    ), /* @__PURE__ */ React.createElement(FindWorkspace, { open: sheet === "find", onClose: () => setSheet(null), initial: id, onUse: (v) => {
      setId(v);
      setErr(null);
      setSheet(null);
    } }), !guided && /* @__PURE__ */ React.createElement(Sheet, { open: sheet === "demo", onClose: () => setSheet(null), title: "Explore as someone in the story", side: app.bp === "phone" ? "bottom" : "center", detent: "large" }, /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted", style: { margin: "0 0 14px" } }, "Everyone shares one live batch. Switch person from your profile at any time; partners you are not playing answer on their own."), /* @__PURE__ */ React.createElement(PeopleList, { onPick: finish, busy })));
  }
  function WorkspaceSheet({ open, onClose, me, onSettings }) {
    const app = useApp();
    const how = me.provider === "google" ? me.kind === "staff" ? `Google Workspace · ${me.email}` : `Google, by invitation · ${me.email}` : me.provider === "phone" ? `One-time code · ${me.phone}` : me.provider;
    return /* @__PURE__ */ React.createElement(Sheet, { open, onClose, title: "Workspace", side: app.bp === "phone" ? "bottom" : "center", detent: "large" }, /* @__PURE__ */ React.createElement("div", { className: "stack" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 14 } }, /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: 56 }), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 4, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "t-title3" }, WS.name), /* @__PURE__ */ React.createElement(Url, null))), /* @__PURE__ */ React.createElement(List, { head: "You" }, /* @__PURE__ */ React.createElement(ListRow, { title: me.name, sub: `${S.ROLES[me.role]} · ${me.org}` }), /* @__PURE__ */ React.createElement(ListRow, { title: "Signed in with", sub: how })), /* @__PURE__ */ React.createElement(List, { head: "Your workspaces", foot: me.kind === "partner" ? "If another brand you work with runs Smart-Clearance, its workspace appears here too, under the same sign-in." : `${WS.plan} since ${WS.since} · ${WS.region}` }, /* @__PURE__ */ React.createElement(ListRow, { leading: /* @__PURE__ */ React.createElement(WorkspaceMark, { ws: WS, size: 32 }), title: WS.name, sub: WS.domain, value: /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "green", icon: "check" }, "current") })), me.role === "admin" && onSettings && /* @__PURE__ */ React.createElement(Button, { variant: "secondary", icon: "building-2", onClick: onSettings }, "Workspace settings"), /* @__PURE__ */ React.createElement("div", { className: "row", style: { justifyContent: "center", paddingTop: 4 } }, /* @__PURE__ */ React.createElement(PoweredBy, null))));
  }
  Object.assign(window.SC3_SCREENS, { SignIn, HeroStage, FindWorkspace, WorkspaceSheet, PeopleList, DEMO_PEOPLE, DEMO, TEST_CODE });
})();
