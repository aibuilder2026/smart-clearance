(function() {
  const { useState, useEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, S = window.SC3_SCREENS, X = window.SC68, M = window.SC3_MONEY;
  const fmt = M.fmt;
  const { cx, Icon, IconButton, Badge, Button, Card, Product, Progress, Mark, useApp } = K;
  function TrackClock({ compact }) {
    const live = X.useLive();
    return /* @__PURE__ */ React.createElement("span", { className: cx("x68-tkclock", live.conn !== "live" && "off") }, /* @__PURE__ */ React.createElement(X.ConnMark, { conn: live.conn }), /* @__PURE__ */ React.createElement(X.ClockTime, { clock: live.clock, withDate: !compact }), /* @__PURE__ */ React.createElement(X.Cue, { perDay: live.clock.perDay, short: compact }));
  }
  const FOCUS = { i: 0, subs: /* @__PURE__ */ new Set() };
  const setFocus = (i) => {
    FOCUS.i = i;
    FOCUS.subs.forEach((f) => f(i));
  };
  function useFocus() {
    const [i, setI] = useState(FOCUS.i);
    useEffect(() => {
      FOCUS.subs.add(setI);
      return () => FOCUS.subs.delete(setI);
    }, []);
    return [i, setFocus];
  }
  function Flagged({ items, phone, go, dim, offline, trackerFor }) {
    const [i, setI] = useFocus();
    const item = items[Math.min(i, items.length - 1)];
    const n = items.length;
    const card = trackerFor(item, { phone, go, dim, offline, head: /* @__PURE__ */ React.createElement(TrackClock, { compact: phone }) });
    if (n < 2) return card;
    const next = items[(i + 1) % n];
    return /* @__PURE__ */ React.createElement("div", { className: "x68-deck" }, /* @__PURE__ */ React.createElement("div", { className: "x68-deck-stack" }, /* @__PURE__ */ React.createElement("span", { className: "x68-deck-peek", "aria-hidden": "true" }), card), /* @__PURE__ */ React.createElement("div", { className: "x68-pager" }, /* @__PURE__ */ React.createElement(IconButton, { icon: "chevron-left", label: "Previous flagged batch", disabled: i === 0, onClick: () => setI(i - 1) }), /* @__PURE__ */ React.createElement("span", { className: "x68-pager-mid" }, /* @__PURE__ */ React.createElement("span", { className: "x68-dots" }, items.map((it, k) => /* @__PURE__ */ React.createElement("button", { key: it.ref, type: "button", className: k === i ? "on" : "", "aria-label": `${it.view.skuObj.name}, ${it.ref}`, "aria-current": k === i ? "true" : void 0, onClick: () => setI(k) }, /* @__PURE__ */ React.createElement("i", null)))), /* @__PURE__ */ React.createElement("span", { className: "t-footnote subtle" }, i + 1, " of ", n, " flagged this morning \xB7 next, ", next.view.skuObj.name, " at ", next.stop)), /* @__PURE__ */ React.createElement(IconButton, { icon: "chevron-right", label: "Next flagged batch", disabled: i === n - 1, onClick: () => setI(i + 1) })));
  }
  function Switcher({ items, current }) {
    const i = Math.max(0, items.findIndex((x) => x.ref === current));
    const v = items[i].view;
    return /* @__PURE__ */ React.createElement("div", { className: "x68-idline" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "mono" }, v.id), " \xB7 ", v.skuObj.brand, " ", v.skuObj.name, " \xB7 ", v.dist.name, ", ", v.dist.city), /* @__PURE__ */ React.createElement(Badge, { size: "sm" }, i + 1, " of ", items.length, " flagged"));
  }
  function Dock({ me, route }) {
    const live = X.useLive();
    const scn = X.useScn();
    const s = S.useStore();
    const app = useApp();
    const phone = app.bp === "phone";
    const { route: r, go } = S.useRoute();
    const reduce = useReducedMotion();
    const [asked, setAsked] = useState(false);
    const [failed, setFailed] = useState(!!scn.fail && X.SHOT);
    const { toast } = K.useNotice();
    useEffect(() => {
      const f = () => setFailed(true);
      window.addEventListener("sc68:failed", f);
      return () => window.removeEventListener("sc68:failed", f);
    }, []);
    const op = me.role === "operator";
    const items = op && !scn.quiet && route !== "setup" ? X.flaggedItems(s, scn) : [];
    const [fi] = useFocus();
    const onRoom = route === "route";
    const ref = onRoom && r.params && r.params.ref || items[Math.min(fi, items.length - 1)] && items[Math.min(fi, items.length - 1)].ref;
    const idx = Math.max(0, items.findIndex((x) => x.ref === ref));
    const item = items[idx];
    const pageTo = (k) => onRoom ? go("route", { ref: items[k].ref }) : setFocus(k);
    const off = live.conn === "reconnecting" || live.conn === "offline";
    let key, body;
    if (scn.push && !asked) {
      key = "push";
      body = /* @__PURE__ */ React.createElement("div", { className: "x68-dock-push" }, /* @__PURE__ */ React.createElement(X.PushContent, { variant: scn.push, me, compact: true, onAllow: () => {
        setAsked(true);
        toast({ text: "Notifications are on. The 09:00 push reaches this device.", tone: "ok", icon: "bell" });
      }, onLater: () => setAsked(true) }));
    } else if (live.conn === "connecting") {
      key = "load";
      body = /* @__PURE__ */ React.createElement("div", { className: "x68-dock-row" }, /* @__PURE__ */ React.createElement("span", { className: "x68-dock-lead" }, /* @__PURE__ */ React.createElement(X.ConnMark, { conn: "connecting" })), /* @__PURE__ */ React.createElement("span", { className: "x68-dock-main" }, /* @__PURE__ */ React.createElement("b", null, "Catching up with the agents"), /* @__PURE__ */ React.createElement("span", null, "This morning's batches are in \xB7 live updates next")), /* @__PURE__ */ React.createElement(TrackClock, { compact: phone }));
    } else if (scn.upload) {
      const photo = scn.upload === "photo";
      key = "up";
      body = /* @__PURE__ */ React.createElement("div", { className: "x68-dock-row" }, /* @__PURE__ */ React.createElement("span", { className: "x68-dock-lead" }, /* @__PURE__ */ React.createElement("span", { className: "icontile soft" }, /* @__PURE__ */ React.createElement(Icon, { name: "cloud-upload", size: 17 }))), /* @__PURE__ */ React.createElement("span", { className: "x68-dock-main" }, /* @__PURE__ */ React.createElement("b", null, photo ? "Label photo \xB7 sending" : "dms_export_2026-10-01.csv \xB7 uploading"), /* @__PURE__ */ React.createElement(Progress, { value: photo ? 0.62 : 0.64, label: photo ? "Sending the label photo" : "Uploading the DMS export" }), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, photo ? "1.4 of 2.3 MB \xB7 you can leave this screen" : "3.1 of 4.8 MB \xB7 keep setting the rules meanwhile")), !phone && /* @__PURE__ */ React.createElement(TrackClock, null));
    } else if (failed) {
      key = "fail";
      body = /* @__PURE__ */ React.createElement("div", { className: "x68-dock-row x68-dock-fail", role: "alert" }, /* @__PURE__ */ React.createElement("span", { className: "x68-dock-lead" }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-alert", size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "x68-dock-main" }, /* @__PURE__ */ React.createElement("b", null, "Approval not sent \xB7 MF-2409-117"), /* @__PURE__ */ React.createElement("span", null, "Nothing was listed, offered or sent. The plan still waits for you.")), /* @__PURE__ */ React.createElement(Button, { variant: "approve", size: "sm", icon: "refresh-cw", onClick: () => window.dispatchEvent(new Event("sc68:approve")) }, "Retry"));
    } else if (scn.quiet || !item) {
      key = "quiet";
      body = /* @__PURE__ */ React.createElement("div", { className: "x68-dock-row" }, /* @__PURE__ */ React.createElement("span", { className: "x68-dock-lead" }, /* @__PURE__ */ React.createElement("span", { className: "icontile soft" }, /* @__PURE__ */ React.createElement(Icon, { name: "radar", size: 17 }))), /* @__PURE__ */ React.createElement("span", { className: "x68-dock-main" }, /* @__PURE__ */ React.createElement("b", null, "Nothing in motion"), /* @__PURE__ */ React.createElement("span", null, "Next Watcher check: 09:00 tomorrow, ", X.untilNine(live.clock), " from now")), /* @__PURE__ */ React.createElement(TrackClock, { compact: phone }));
    } else {
      key = "item";
      const approveHere = route === "route" && item.hero && item.human;
      body = /* @__PURE__ */ React.createElement("div", { className: cx("x68-dock-row", off && "off") }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "x68-dock-open", onClick: () => go("route", { ref: item.ref }), "aria-label": `${item.view.skuObj.name}, ${item.ref}: ${item.stop}, ${item.waiting}. Open its Route Room` }, /* @__PURE__ */ React.createElement(Product, { name: item.view.skuObj.img, size: phone ? 34 : 40, alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "x68-dock-main" }, /* @__PURE__ */ React.createElement("span", { className: "x68-dock-top" }, /* @__PURE__ */ React.createElement("b", null, item.stop), /* @__PURE__ */ React.createElement("span", null, off ? live.conn === "offline" ? `offline \xB7 as of ${live.since}` : `reconnecting \xB7 paused at ${live.since}` : item.waiting.replace(/^Waiting for /, "waiting for "))), /* @__PURE__ */ React.createElement(X.Segs, { done: item.done, current: item.current, human: item.human, dim: off, small: true, label: `${item.stop}, stop ${item.current + 1} of 9` }), /* @__PURE__ */ React.createElement("span", { className: "x68-dock-id" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, item.ref), phone ? null : ` \xB7 ${item.view.skuObj.name}`))), !phone && /* @__PURE__ */ React.createElement(TrackClock, null), items.length > 1 && /* @__PURE__ */ React.createElement("span", { className: "x68-dock-pager" }, /* @__PURE__ */ React.createElement(IconButton, { icon: "chevron-left", label: "Previous flagged batch", disabled: idx === 0, onClick: () => pageTo(idx - 1) }), /* @__PURE__ */ React.createElement("span", { className: "tnum" }, idx + 1, "/", items.length), /* @__PURE__ */ React.createElement(IconButton, { icon: "chevron-right", label: "Next flagged batch", disabled: idx === items.length - 1, onClick: () => pageTo(idx + 1) })), approveHere && !phone && /* @__PURE__ */ React.createElement(Button, { variant: "approve", icon: "check", "aria-disabled": live.conn === "offline" || void 0, className: live.conn === "offline" ? "x68-blocked" : void 0, onClick: () => live.conn !== "offline" && window.dispatchEvent(new Event("sc68:approve")) }, "Review and approve"));
      if (phone) body = /* @__PURE__ */ React.createElement(React.Fragment, null, body, /* @__PURE__ */ React.createElement("div", { className: "x68-dock-sub" }, approveHere ? /* @__PURE__ */ React.createElement(Button, { variant: "approve", size: "sm", icon: "check", block: true, "aria-disabled": live.conn === "offline" || void 0, className: live.conn === "offline" ? "x68-blocked" : void 0, onClick: () => live.conn !== "offline" && window.dispatchEvent(new Event("sc68:approve")) }, live.conn === "offline" ? "Approving needs a connection" : "Review and approve") : /* @__PURE__ */ React.createElement(TrackClock, null)));
    }
    return /* @__PURE__ */ React.createElement("div", { className: cx("x68-dock", key === "push" && "tall"), role: "region", "aria-label": "In motion" }, /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "popLayout", initial: false }, /* @__PURE__ */ React.createElement(motion.div, { key, className: "x68-dock-in", initial: reduce || X.SHOT ? false : { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 10 }, transition: { type: "spring", stiffness: 420, damping: 34, mass: 1 } }, body)));
  }
  function UploadUnderPhoto({ p, mb }) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(X.UploadLine, { p, mb, total: "2.3 MB", label: "Sending the photo" }), /* @__PURE__ */ React.createElement("p", { className: "t-footnote muted", style: { margin: 0, textAlign: "center" } }, "You can leave this screen. The bar at the foot keeps sending and says when the photo has landed."));
  }
  window.SC68_OPT = {
    id: "c",
    name: "On the tracker",
    pushPlace: "dock",
    firstLoad: "skeleton",
    dockApproves: true,
    failSheetClosed: true,
    Flagged,
    Switcher,
    Dock,
    UploadUnderPhoto,
    onFail: () => window.dispatchEvent(new Event("sc68:failed")),
    init: () => {
      document.documentElement.dataset.opt = "c";
    }
  };
})();
