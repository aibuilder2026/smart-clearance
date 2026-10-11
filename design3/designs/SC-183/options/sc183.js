(function() {
  const { useState, useEffect, useLayoutEffect, useRef, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = window.Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, S = window.SC3_SCREENS, PA = window.SC3_PAPERS;
  const fmt = M.fmt;
  const { cx, Icon, Badge, Button, Card, Sheet, Field, Input, Select, List, ListRow, Product, ThemeProvider, AppRoot } = K;
  const q = new URLSearchParams(location.search);
  const OPT = q.get("opt") || "a", VIEW = q.get("view") || "dist", STATE = q.get("sig") || "part";
  const STROKES = window.SC183_STROKES, CERT = window.SC183_CERT;
  const IMG = window.SC3_IMG || "../../../system/img/";
  window.SC3_ICONS.signature = window.SC3_ICONS.signature || '<path d="m21 17-2.156-1.868A.5.5 0 0 0 18 15.5v.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1c0-2.545-3.991-3.97-8.5-4a1 1 0 0 0 0 5c4.153 0 4.745-11.295 5.708-13.5a2.5 2.5 0 1 1 3.31 3.284" /> <path d="M3 21h18" />';
  const R = D.DISTRIBUTORS.rakesh, AG = D.SETUP.destruction.agencies.find((a) => a.id === "oce"), FAC = AG.facility;
  const SKU = CERT.sku, REF = CERT.d.batch || "MF-2409-117", UNITS = CERT.d.units, NO = CERT.d.no, WIN = CERT.d.window, ON = fmt.date(CERT.d.destroyedOn);
  const BOOTH = "Rakesh Traders' tablet";
  const HIS = (() => {
    const k = D.SKUS[SKU.id];
    return Math.round(UNITS * k.dp * k.gst * 100) / 100;
  })();
  const SIGNERS = [
    {
      id: "officer",
      n: 1,
      stroke: "oce",
      seal: "oce",
      role: "Supervising officer",
      name: AG.officer.name,
      sub: `${AG.officer.title}, ${AG.name}`,
      at: "13:22",
      phone: "his own phone",
      decl: /* @__PURE__ */ React.createElement(React.Fragment, null, "I supervised the destruction of these ", /* @__PURE__ */ React.createElement("b", null, fmt.num(UNITS), " packs of batch ", REF), " at the ", FAC.name.toLowerCase(), ", Bhandewadi, from ", WIN.from, " to ", WIN.to, " on ", ON, ": slit open, emptied into the cell and covered.")
    },
    {
      id: "w1",
      n: 2,
      stroke: "oce-w1",
      role: "Independent witness 1",
      name: AG.witnesses[0].name,
      sub: AG.witnesses[0].address,
      proof: AG.witnesses[0].proof,
      at: "13:23",
      phone: "his own phone",
      decl: /* @__PURE__ */ React.createElement(React.Fragment, null, "I watched these ", /* @__PURE__ */ React.createElement("b", null, fmt.num(UNITS), " packs of batch ", REF), " slit open and buried, from ", WIN.from, " to ", WIN.to, " on ", ON, ". I do not work for ", R.name, " or ", AG.name, ".")
    },
    {
      id: "w2",
      n: 3,
      stroke: "oce-w2",
      role: "Independent witness 2",
      name: AG.witnesses[1].name,
      sub: AG.witnesses[1].address,
      proof: AG.witnesses[1].proof,
      at: "13:24",
      phone: "her own phone",
      decl: /* @__PURE__ */ React.createElement(React.Fragment, null, "I watched these ", /* @__PURE__ */ React.createElement("b", null, fmt.num(UNITS), " packs of batch ", REF), " slit open and buried, from ", WIN.from, " to ", WIN.to, " on ", ON, ". I do not work for ", R.name, " or ", AG.name, ".")
    },
    {
      id: "rakesh",
      n: 4,
      stroke: "rakesh",
      role: "Goods handed over by",
      name: R.signatory.name,
      sub: `${R.signatory.title}, ${R.name}`,
      at: "13:25",
      phone: "this tablet",
      decl: /* @__PURE__ */ React.createElement(React.Fragment, null, "I handed over ", /* @__PURE__ */ React.createElement("b", null, fmt.num(UNITS), " packs of batch ", REF), " from ", R.godown, " to ", AG.name, ", and they were destroyed as set out on its certificate ", NO, ".")
    }
  ];
  const BY = Object.fromEntries(SIGNERS.map((s) => [s.id, s]));
  const SIGNED_AT = { open: [], part: ["officer", "w1"], done: SIGNERS.map((s) => s.id) };
  const first = (n) => n.split(" ")[0];
  const possessive = (n) => /s$/.test(n) ? `${n}'` : `${n}'s`;
  const andList = (a) => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  const INK = "#1f2a86";
  const lenOf = (s) => s.reduce((t, p, i) => i ? t + Math.hypot(p[0] - s[i - 1][0], p[1] - s[i - 1][1]) : 0, 0);
  const dOf = (s) => s.map((p, i) => (i ? "L" : "M") + (+p[0]).toFixed(1) + " " + (+p[1]).toFixed(1)).join("");
  function InkG({ who, sw, upto = 1, play, delay = 0, dur = 1.6 }) {
    const reduce = useReducedMotion();
    const sg = STROKES[who];
    const lens = sg.strokes.map(lenOf), total = lens.reduce((a, b) => a + b, 0);
    let acc = 0;
    return /* @__PURE__ */ React.createElement("g", { fill: "none", stroke: INK, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" }, sg.strokes.map((s, i) => {
      const start = acc / total, frac = lens[i] / total;
      acc += lens[i];
      if (upto < 1) {
        const vis = Math.max(0, Math.min(1, (upto - start) / frac));
        return vis ? /* @__PURE__ */ React.createElement("path", { key: i, d: dOf(s), pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - vis }) : null;
      }
      if (play && !reduce) return /* @__PURE__ */ React.createElement(motion.path, { key: i, d: dOf(s), initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { pathLength: { duration: Math.max(0.03, dur * frac), delay: delay + dur * start, ease: "linear" }, opacity: { duration: 0.01, delay: delay + dur * start } } });
      return /* @__PURE__ */ React.createElement("path", { key: i, d: dOf(s) });
    }));
  }
  function Drawn({ who, h = 44, play, delay, upto, className }) {
    const sg = STROKES[who], p = SIGNERS.find((x) => x.stroke === who) || { name: who };
    const px = h >= 90 ? 2.4 : h >= 50 ? 1.9 : h >= 24 ? 1.45 : 1.1;
    return /* @__PURE__ */ React.createElement("svg", { className: cx("s183-ink", className), viewBox: `0 0 ${sg.w} ${sg.h}`, style: { height: h, width: h * sg.w / sg.h }, role: "img", "aria-label": `Signed by ${p.name}` }, /* @__PURE__ */ React.createElement(InkG, { who, sw: px * sg.h / h, upto, play, delay }));
  }
  function Pad({ who, demo, onInk }) {
    const ref = useRef(null), cur = useRef(null);
    const [lines, setLines] = useState([]);
    const pt = (e) => {
      const r = ref.current.getBoundingClientRect();
      return [(e.clientX - r.left) * 640 / r.width, (e.clientY - r.top) * 220 / r.height];
    };
    const down = (e) => {
      ref.current.setPointerCapture(e.pointerId);
      cur.current = [pt(e)];
      setLines((l) => [...l, cur.current.slice()]);
      onInk && onInk(true);
    };
    const move = (e) => {
      if (!cur.current) return;
      cur.current.push(pt(e));
      setLines((l) => [...l.slice(0, -1), cur.current.slice()]);
    };
    const up = () => cur.current = null;
    const stroke = BY[who].stroke, sg = STROKES[stroke], k = Math.min(540 / sg.w, 150 / sg.h);
    useEffect(() => {
      onInk && onInk(!!demo);
    }, []);
    return /* @__PURE__ */ React.createElement("div", { className: "s183-pad-big" }, /* @__PURE__ */ React.createElement("svg", { ref, viewBox: "0 0 640 220", onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("line", { x1: "28", x2: "612", y1: "176", y2: "176", className: "s183-base" }), /* @__PURE__ */ React.createElement("text", { x: "30", y: "166", className: "s183-x" }, "×"), demo && !lines.length && /* @__PURE__ */ React.createElement("g", { transform: `translate(58 ${176 - sg.h * k + 8}) scale(${k})` }, /* @__PURE__ */ React.createElement(InkG, { who: stroke, sw: 2.6 / k, upto: 0.64 })), lines.length > 0 && /* @__PURE__ */ React.createElement("g", { fill: "none", stroke: INK, strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }, lines.map((l, i) => /* @__PURE__ */ React.createElement("path", { key: i, d: dOf(l) })))), /* @__PURE__ */ React.createElement("span", { className: "s183-under" }, BY[who].name), lines.length > 0 && /* @__PURE__ */ React.createElement("button", { type: "button", className: "s183-clear", onClick: () => {
      setLines([]);
      onInk && onInk(false);
    } }, "Clear"));
  }
  function SignSheet({ who, onClose, onDone }) {
    const p = who && BY[who];
    const [inked, setInked] = useState(false);
    return /* @__PURE__ */ React.createElement(Sheet, { open: !!p, onClose, title: p ? `${p.name} signs` : "", footer: p ? /* @__PURE__ */ React.createElement("div", { className: "dz-foot" }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", onClick: onClose }, "Cancel"), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, icon: "signature", disabled: !inked, onClick: () => onDone(who) }, "Sign as ", first(p.name))) : null }, p && /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 10 } }, /* @__PURE__ */ React.createElement("span", { className: "s183-avatar", "aria-hidden": "true" }, p.name.split(" ").map((x) => x[0]).join("").slice(0, 2)), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, p.role), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, p.sub, p.proof ? ` · ${p.proof}` : ""))), who !== "rakesh" && /* @__PURE__ */ React.createElement("span", { className: "row tight t-footnote muted", style: { gap: 6 } }, /* @__PURE__ */ React.createElement(Icon, { name: "hand", size: 14 }), "Hand the tablet to ", p.name), /* @__PURE__ */ React.createElement("div", { className: "s183-decl" }, p.decl), /* @__PURE__ */ React.createElement(Pad, { who, demo: VIEW === "sign", onInk: setInked }), /* @__PURE__ */ React.createElement("div", { className: "row between wrap", style: { gap: 8 } }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Sign with a finger or a stylus. The signature goes on ", possessive(AG.name), " certificate ", NO, " as drawn, with the time."), /* @__PURE__ */ React.createElement("button", { type: "button", className: "pt-link t-footnote" }, "Type the name instead"))));
  }
  const SLOTS = [["before", "1 · Before", "The packs at the godown, the batch label in view"], ["after", "2 · After", "The packs slit open at the landfill, the slate in view"]];
  const ev = (w) => `${IMG}evidence/${w === "before" ? "MF-2409-117-before" : "MF-2409-117-after-expiry"}.webp`;
  const Photos = () => /* @__PURE__ */ React.createElement("div", { className: "dz-two" }, SLOTS.map(([w, tag, alt]) => /* @__PURE__ */ React.createElement("div", { key: w, className: "stack tight dz-slot" }, /* @__PURE__ */ React.createElement("div", { className: "cam dz-cam" }, /* @__PURE__ */ React.createElement(S.Photo, { className: "cam-feed whole", src: ev(w), alt }), /* @__PURE__ */ React.createElement("span", { className: "cam-tag" }, tag)), /* @__PURE__ */ React.createElement("div", { className: "row tight t-caption subtle" }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 13 }), " ", w === "before" ? "Taken 11:40" : "Taken 13:20"))));
  function Fields() {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "dz-fields" }, /* @__PURE__ */ React.createElement(Field, { label: "Agency", htmlFor: "dz-agency", help: `Authorisation ${AG.auth} · ${FAC.name} · supervising officer ${AG.officer.name}` }, /* @__PURE__ */ React.createElement(Select, { id: "dz-agency", value: AG.id, onChange: () => {
    } }, /* @__PURE__ */ React.createElement("option", { value: AG.id }, AG.name))), /* @__PURE__ */ React.createElement(Field, { label: "Agency's certificate number", htmlFor: "dz-cert" }, /* @__PURE__ */ React.createElement(Input, { id: "dz-cert", value: NO, onChange: () => {
    } }))), /* @__PURE__ */ React.createElement("div", { className: "dz-fields" }, /* @__PURE__ */ React.createElement(Field, { label: "Destroyed from", htmlFor: "dz-from", help: "The time the agency began, as its certificate says" }, /* @__PURE__ */ React.createElement(Input, { id: "dz-from", value: WIN.from, onChange: () => {
    } })), /* @__PURE__ */ React.createElement(Field, { label: "To", htmlFor: "dz-to", help: "When the cover was done: the after photo's time" }, /* @__PURE__ */ React.createElement(Input, { id: "dz-to", value: WIN.to, onChange: () => {
    } }))), /* @__PURE__ */ React.createElement("span", { className: "t-headline", style: { marginTop: 6 } }, "Two independent witnesses"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "People who watched the destruction and are not your staff: a neighbouring trader, a resident. They sign the agency's certificate with its officer."), AG.witnesses.map((w, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "dz-fields" }, /* @__PURE__ */ React.createElement(Field, { label: `Witness ${i + 1} · name`, htmlFor: `dz-w${i}` }, /* @__PURE__ */ React.createElement(Input, { id: `dz-w${i}`, value: w.name, onChange: () => {
    } })), /* @__PURE__ */ React.createElement(Field, { label: "Address", htmlFor: `dz-w${i}a` }, /* @__PURE__ */ React.createElement(Input, { id: `dz-w${i}a`, value: w.address, onChange: () => {
    } })))));
  }
  const Head = () => /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: SKU.img, size: 44, alt: "" }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, SKU.name), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, REF), " · ", fmt.num(UNITS), " packs expired at ", R.godown)), /* @__PURE__ */ React.createElement(Badge, { size: "sm", tone: "amber", dot: true }, "for you"));
  function SlotA({ p, at, onSign, onClear }) {
    return /* @__PURE__ */ React.createElement("div", { className: cx("s183-slot", at && "on") }, /* @__PURE__ */ React.createElement("div", { className: "s183-slot-h" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, p.role), /* @__PURE__ */ React.createElement("b", null, p.name), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, p.sub)), at ? /* @__PURE__ */ React.createElement("div", { className: "s183-pad on" }, /* @__PURE__ */ React.createElement(Drawn, { who: p.stroke, h: 52 }), /* @__PURE__ */ React.createElement("span", { className: "s183-pad-at" }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 13, stroke: 2.4 }), " Signed ", at), /* @__PURE__ */ React.createElement("button", { type: "button", className: "s183-clear", onClick: onClear, "aria-label": `Clear ${p.name}'s signature` }, "Clear")) : /* @__PURE__ */ React.createElement("button", { type: "button", className: "s183-pad", onClick: onSign }, /* @__PURE__ */ React.createElement(Icon, { name: "signature", size: 18 }), /* @__PURE__ */ React.createElement("span", null, "Sign as ", first(p.name))));
  }
  function SignA({ signed, setSheet, clear }) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "t-headline", style: { marginTop: 6 } }, "Four signatures, on this screen"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Once the cover is done, hand the tablet to each of them in turn. Each signs for what they did or saw; the signatures go on ", possessive(AG.name), " certificate as drawn, and ", D.PEOPLE.priya.short, " sees them with the photos."), /* @__PURE__ */ React.createElement("div", { className: "s183-slots" }, SIGNERS.map((p) => /* @__PURE__ */ React.createElement(SlotA, { key: p.id, p, at: signed.includes(p.id) ? p.at : null, onSign: () => setSheet(p.id), onClear: () => clear(p.id) }))));
  }
  const CASE = { dist: R, sku: Object.assign({}, D.SKUS[SKU.id], SKU), batch: { id: REF, bestBefore: CERT.d.bestBefore, mfg: CERT.d.mfg } };
  const draftD = Object.assign({}, CERT.d, { officer: Object.assign({}, CERT.d.officer, { sign: null }), handedBy: Object.assign({}, CERT.d.handedBy, { sign: null }), witnesses: CERT.d.witnesses.map((w) => Object.assign({}, w, { sign: null })) });
  function SignB({ signed, setSheet }) {
    const n = signed.length;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "t-headline", style: { marginTop: 6 } }, "Sign the certificate"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, possessive(AG.name), " certificate ", NO, ", laid out from what you entered above. Hand the tablet to each of them in turn: each signs in their own place, as on paper. ", D.PEOPLE.priya.short, " reviews this page as signed."), /* @__PURE__ */ React.createElement("div", { className: "s183-progress", role: "status" }, /* @__PURE__ */ React.createElement("span", { className: "s183-bar" }, /* @__PURE__ */ React.createElement("i", { style: { transform: `scaleX(${n / 4})` } })), /* @__PURE__ */ React.createElement("b", null, n, " of 4 signed"), n < 4 && /* @__PURE__ */ React.createElement("span", { className: "muted" }, "· next: ", SIGNERS.find((p) => !signed.includes(p.id)).name)), /* @__PURE__ */ React.createElement("div", { className: "s183-paperframe" }, /* @__PURE__ */ React.createElement("div", { className: "s183-cert draft" }, /* @__PURE__ */ React.createElement(S.Certificate, { d: draftD, c: CASE })), /* @__PURE__ */ React.createElement(CertSpots, { page1Only: true, render: (who, kind) => signed.includes(who) ? /* @__PURE__ */ React.createElement(Signature, { who, kind }) : kind === "ini" ? null : /* @__PURE__ */ React.createElement("button", { type: "button", className: "s183-here", onClick: () => setSheet(who) }, /* @__PURE__ */ React.createElement("span", { className: "s183-here-n" }, BY[who].n), "Sign here", /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, ": ", BY[who].name, ", ", BY[who].role)) })));
  }
  const LINK = (who) => `munchly-smartclearance.web.app/sign/0219-${who}`;
  function Qr({ text, size = 92 }) {
    const m = PA.qr("https://" + text).modules, n = m.length;
    let d = "";
    m.forEach((row, y) => row.forEach((on, x) => {
      if (on) d += `M${x + 4} ${y + 4}h1v1h-1z`;
    }));
    return /* @__PURE__ */ React.createElement("svg", { className: "s183-qr", viewBox: `0 0 ${n + 8} ${n + 8}`, width: size, height: size, role: "img", "aria-label": `A code to scan: ${text}` }, /* @__PURE__ */ React.createElement("rect", { width: n + 8, height: n + 8, fill: "#fff" }), /* @__PURE__ */ React.createElement("path", { d, fill: "#111" }));
  }
  function SignC({ signed, setSheet, clear }) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "t-headline", style: { marginTop: 6 } }, "Four signatures, each on their own phone"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "The officer and the two witnesses scan their code and sign on their own phone: no app, no account. Each phone records its time and where it was. You sign here. ", D.PEOPLE.priya.short, " sees each signature as it lands."), /* @__PURE__ */ React.createElement("div", { className: "s183-rows" }, SIGNERS.map((p) => {
      const at = signed.includes(p.id) ? p.at : null, me = p.id === "rakesh";
      return /* @__PURE__ */ React.createElement("div", { key: p.id, className: cx("s183-row", at && "on") }, /* @__PURE__ */ React.createElement("span", { className: "s183-avatar", "aria-hidden": "true" }, p.name.split(" ").map((x) => x[0]).join("").slice(0, 2)), /* @__PURE__ */ React.createElement("div", { className: "s183-row-who" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, p.role), /* @__PURE__ */ React.createElement("b", null, p.name), at ? /* @__PURE__ */ React.createElement("span", { className: "s183-row-at" }, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 13, stroke: 2.4 }), " Signed ", at, " on ", me ? "this tablet" : p.phone, me ? "" : " · at the facility, within 40 m") : me ? /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Sign once the three have signed") : /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Waiting · scan to sign, or open ", /* @__PURE__ */ React.createElement("span", { className: "mono" }, LINK(p.id)))), /* @__PURE__ */ React.createElement("div", { className: "s183-row-end" }, at ? /* @__PURE__ */ React.createElement("span", { className: "s183-pad on mini" }, /* @__PURE__ */ React.createElement(Drawn, { who: p.stroke, h: 40 })) : me ? /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "signature", disabled: signed.length < 3, onClick: () => setSheet(p.id) }, "Sign") : /* @__PURE__ */ React.createElement(Qr, { text: LINK(p.id) })));
    })));
  }
  function PhoneC() {
    const p = BY.w2, done = STATE === "done";
    const [inked, setInked] = useState(false);
    return /* @__PURE__ */ React.createElement("div", { className: "s183-phone" }, /* @__PURE__ */ React.createElement("div", { className: "s183-phone-bar" }, /* @__PURE__ */ React.createElement("span", { className: "s183-mark", "aria-hidden": "true" }, "S"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote" }, /* @__PURE__ */ React.createElement("b", null, "Smart-Clearance"), " for ", AG.name)), /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 14, padding: "8px 18px 28px" } }, /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 2 } }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, "Certificate of destruction ", NO), /* @__PURE__ */ React.createElement("h1", { className: "t-title2" }, "Sign as an independent witness")), /* @__PURE__ */ React.createElement("div", { className: "s183-facts" }, [["Goods", `${SKU.brand} ${SKU.name}, batch ${REF}`], ["Quantity", `${fmt.num(UNITS)} packs, from ${R.name}`], ["Where", `${FAC.name}, Bhandewadi, Nagpur`], ["When", `${ON}, ${WIN.from} to ${WIN.to}`]].map(([k, v]) => /* @__PURE__ */ React.createElement(Fragment, { key: k }, /* @__PURE__ */ React.createElement("span", null, k), /* @__PURE__ */ React.createElement("b", null, v)))), done ? /* @__PURE__ */ React.createElement("div", { className: "s183-done" }, /* @__PURE__ */ React.createElement(Drawn, { who: p.stroke, h: 56 }), /* @__PURE__ */ React.createElement("b", null, /* @__PURE__ */ React.createElement(Icon, { name: "check", size: 15, stroke: 2.4 }), " Signed at ", p.at), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, possessive(R.name), " screen shows your signature now. You can close this page.")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "s183-decl" }, p.decl), /* @__PURE__ */ React.createElement(Field, { label: "Your name", htmlFor: "ph-name" }, /* @__PURE__ */ React.createElement(Input, { id: "ph-name", value: p.name, onChange: () => {
    } })), /* @__PURE__ */ React.createElement(Field, { label: "Last four digits of your voter ID", htmlFor: "ph-id", help: "As the agency recorded it" }, /* @__PURE__ */ React.createElement(Input, { id: "ph-id", value: "0932", inputMode: "numeric", onChange: () => {
    } })), /* @__PURE__ */ React.createElement(Pad, { who: p.id, demo: true, onInk: setInked }), /* @__PURE__ */ React.createElement("span", { className: "row tight t-caption subtle", style: { gap: 6, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement(Icon, { name: "map-pin", size: 13, style: { flex: "none", marginTop: 1 } }), "Your phone's place is recorded with your signature: 21.1469° N, 79.1561° E, 30 m from cell 4."), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, icon: "signature", disabled: !inked }, "Sign"))));
  }
  const signedWhere = (p) => OPT === "a" ? `signed ${p.at} · his tablet` : OPT === "b" ? `signed here ${p.at}` : p.id === "rakesh" ? `signed ${p.at} · his tablet` : `signed ${p.at} · own phone`;
  function Signature({ who, kind, play, delay }) {
    const p = BY[who];
    if (kind === "ini") return /* @__PURE__ */ React.createElement(Drawn, { who: p.stroke, h: 14 });
    return /* @__PURE__ */ React.createElement("span", { className: "s183-spot-in" }, /* @__PURE__ */ React.createElement("span", { className: cx("sig-ink", who === "officer" && "sealed round"), style: { "--h": `${who === "rakesh" ? 34 : 40}px` } }, who === "officer" && /* @__PURE__ */ React.createElement("img", { className: "sig-seal", src: `${IMG}seals/oce.webp`, alt: "", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement(Drawn, { className: "sig-hand", who: p.stroke, h: who === "rakesh" ? 34 : 40, play, delay })), /* @__PURE__ */ React.createElement("span", { className: "s183-when" }, signedWhere(p)));
  }
  function CertSpots({ render, page1Only }) {
    const [spots, setSpots] = useState([]);
    const box = useRef(null);
    useLayoutEffect(() => {
      const find = () => {
        const root = box.current && box.current.parentElement || document;
        const out = [];
        root.querySelectorAll(".cert-pages").forEach((pages) => {
          const sigs = pages.querySelectorAll(".cert-sigs > .cert-sig .cert-ink");
          ["officer", "w1", "w2"].forEach((w, i) => sigs[i] && out.push([sigs[i], w, "sig"]));
          const hand = pages.querySelector(".cert-hand > div:first-child .cert-ink");
          hand && out.push([hand, "rakesh", "sig"]);
          if (!page1Only) pages.querySelectorAll(".cert-ini").forEach((td) => ["officer", "w1", "w2"].forEach((w) => out.push([td, w, "ini"])));
          const word = VIEW === "dist" ? "TO SIGN" : "SIGNED", stamp = pages.querySelector(".cert-lh .pp-stamp");
          if (VIEW !== "paper" && stamp && stamp.textContent !== word) {
            stamp.textContent = word;
            stamp.classList.remove("ok");
          }
          const ok = pages.querySelector(".cert-hand > div:nth-child(2)");
          if (VIEW !== "paper" && ok && !ok.dataset.s183) {
            ok.dataset.s183 = 1;
            ok.innerHTML = `<span class="cert-k">Evidence approved by</span><b>${D.PEOPLE.priya.name}</b><span>for ${D.CLIENT.name}, once she has reviewed it</span>`;
          }
        });
        const next = out.map(([el, who, kind]) => {
          let c = el.querySelector(`:scope > .s183-spot[data-who="${who}"]`);
          if (!c) {
            c = document.createElement("span");
            c.className = "s183-spot";
            c.dataset.who = who;
            el.appendChild(c);
          }
          el.classList.add("s183-patched");
          return [c, who, kind];
        });
        setSpots((s) => s.length === next.length && s.every((x, i) => x[0] === next[i][0]) ? s : next);
      };
      find();
      const mo = new MutationObserver(() => find());
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }, []);
    return /* @__PURE__ */ React.createElement("span", { ref: box, hidden: true }, spots.map(([el, who, kind], i) => ReactDOM.createPortal(render(who, kind, i), el, `${who}-${kind}-${i}`)));
  }
  function Destroy({ me }) {
    const [signed, setSigned] = useState(SIGNED_AT[STATE] || SIGNED_AT.part);
    const [sheet, setSheet] = useState(VIEW === "sign" ? OPT === "c" ? "rakesh" : OPT === "b" ? "w1" : "w1" : null);
    const all = signed.length === 4, left = SIGNERS.filter((p) => !signed.includes(p.id)).map((p) => p.name);
    const sign = (who) => {
      setSigned((s) => s.includes(who) ? s : [...s, who]);
      setSheet(null);
    };
    const clear = (who) => setSigned((s) => s.filter((x) => x !== who));
    return /* @__PURE__ */ React.createElement(S.Screen, { me, title: "Destroy expired packs", sub: `Batch ${REF} · ${R.godown}`, back: "Today" }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: OPT === "b" ? 760 : 640, margin: "0 auto", width: "100%" } }, /* @__PURE__ */ React.createElement(Head, null), /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("span", { className: "t-subhead" }, "Destroy the ", fmt.num(UNITS), " packs through an authorised agency, then send the two photos, the agency's certificate number and the four signatures. ", D.PEOPLE.priya.short, " at ", D.CLIENT.short, " approves, and ", D.CLIENT.short, " credits you the dealer price, the GST you reverse and the agency's charges."), /* @__PURE__ */ React.createElement(Photos, null), /* @__PURE__ */ React.createElement(Fields, null), OPT === "a" && /* @__PURE__ */ React.createElement(SignA, { signed, setSheet, clear }), OPT === "b" && /* @__PURE__ */ React.createElement(SignB, { signed, setSheet }), OPT === "c" && /* @__PURE__ */ React.createElement(SignC, { signed, setSheet, clear }), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, icon: "send", disabled: !all, "aria-describedby": "s183-need" }, "Send to ", D.CLIENT.short, " for approval"), /* @__PURE__ */ React.createElement("span", { id: "s183-need", className: "t-caption subtle" }, all ? `Then reverse ${fmt.inr2(HIS)} of input GST on these packs in your GSTR-3B (Table 4(B)(1)). ${possessive(D.CLIENT.short)} credit note makes it good.` : `${signed.length} of 4 signed: ${andList(left)} still to sign.`))), /* @__PURE__ */ React.createElement(SignSheet, { who: sheet, onClose: () => setSheet(null), onDone: sign }));
  }
  S.DestroyScreen = Destroy;
  function Review() {
    const st = window.SC3_STORE.get(), d = st.hero.destruction || {}, x = st.hero.expiry || {};
    const C = D.CLIENT.short;
    const sigs = OPT === "b" ? /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "The certificate, as signed at the landfill"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, "Each signed in their own place on ", BOOTH, ", ", SIGNERS[0].at, " to ", SIGNERS[3].at, " on ", ON), /* @__PURE__ */ React.createElement("div", { className: "s183-sheetpaper" }, /* @__PURE__ */ React.createElement("div", { className: "s183-cert" }, /* @__PURE__ */ React.createElement(S.Certificate, { d: draftD, c: CASE })), /* @__PURE__ */ React.createElement(CertSpots, { page1Only: true, render: (who, kind, i) => /* @__PURE__ */ React.createElement(Signature, { who, kind, play: true, delay: 0.3 + i * 0.3 }) }))) : /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, OPT === "a" ? "Signed at the landfill" : "Signed at the landfill, on four devices"), /* @__PURE__ */ React.createElement("span", { className: "t-footnote muted" }, OPT === "a" ? `On ${BOOTH}, ${SIGNERS[0].at} to ${SIGNERS[3].at} on ${ON}, after the cover at ${WIN.to}` : `Each on their own phone, ${SIGNERS[0].at} to ${SIGNERS[3].at} on ${ON}; every phone within 40 m of cell 4`), /* @__PURE__ */ React.createElement("div", { className: "s183-tiles" }, SIGNERS.map((p, i) => /* @__PURE__ */ React.createElement("div", { key: p.id, className: "s183-tile" }, /* @__PURE__ */ React.createElement("span", { className: "s183-tile-ink" }, /* @__PURE__ */ React.createElement(Drawn, { who: p.stroke, h: 46, play: true, delay: 0.25 + i * 0.25 })), /* @__PURE__ */ React.createElement("b", null, p.name), /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, p.role, p.proof ? ` · ${p.proof}` : ""), /* @__PURE__ */ React.createElement("span", { className: "s183-tile-at" }, OPT === "a" ? `Signed ${p.at}` : `Signed ${p.at} on ${p.phone === "this tablet" ? "his tablet" : p.phone}`)))));
    const footer = /* @__PURE__ */ React.createElement("div", { className: "dz-foot" }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", icon: "rotate-ccw" }, "Ask again"), /* @__PURE__ */ React.createElement(Button, { variant: "approve", size: "lg", block: true, icon: "check" }, "Approve · issue the papers"));
    return /* @__PURE__ */ React.createElement(Sheet, { open: true, onClose: () => {
    }, title: "Approve the destruction", footer }, /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Product, { name: SKU.img, size: 44, alt: "" }), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, SKU.name, " · ", fmt.num(UNITS), " packs"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, "Batch ", /* @__PURE__ */ React.createElement("span", { className: "mono" }, REF), " · expired at ", R.godown, " · sent by ", R.name))), /* @__PURE__ */ React.createElement("div", { className: "dz-two dz-pair" }, SLOTS.map(([w, , alt]) => /* @__PURE__ */ React.createElement("div", { key: w, className: "cam dz-cam" }, /* @__PURE__ */ React.createElement(S.Photo, { className: "cam-feed whole", src: ev(w), alt }), /* @__PURE__ */ React.createElement("span", { className: "cam-tag" }, w === "before" ? "Before · 11:40" : "After · 13:20")))), sigs, /* @__PURE__ */ React.createElement("div", { className: "stack tight" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "Vision's checks"), (d.checks || []).map((ck) => /* @__PURE__ */ React.createElement("div", { key: ck.id, className: "row tight t-subhead dz-check" }, /* @__PURE__ */ React.createElement(Icon, { name: ck.ok ? "circle-check" : "circle-alert", size: 16, className: ck.ok ? "dz-ok" : "dz-warn" }), ck.label)), /* @__PURE__ */ React.createElement("div", { className: "row tight t-subhead dz-check" }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-check", size: 16, className: "dz-ok" }), AG.name, " is on ", possessive(C), " list (authorisation ", AG.auth, ") · certificate ", NO), /* @__PURE__ */ React.createElement("div", { className: "row tight t-subhead dz-check" }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-check", size: 16, className: "dz-ok" }), "Four signatures: the officer, both witnesses and ", first(R.signatory.name), OPT === "c" ? ", each phone at the facility" : "")), /* @__PURE__ */ React.createElement("div", { className: "stack tight dz-yes" }, /* @__PURE__ */ React.createElement("b", { className: "t-subhead" }, "On your yes"), /* @__PURE__ */ React.createElement(List, null, /* @__PURE__ */ React.createElement(ListRow, { title: `Expiry credit note to ${R.name}`, sub: `${fmt.num(x.units)} × ₹${D.SKUS[SKU.id].dp} + ${fmt.inr2(x.gst || 0)} GST he reverses + ${fmt.inr2(x.charges || 0)} destruction`, value: /* @__PURE__ */ React.createElement("span", { className: "tnum" }, fmt.inr2(x.amount)) }), /* @__PURE__ */ React.createElement(ListRow, { title: "Certificate of destruction", sub: `${AG.name}, ${NO} · the four signatures as drawn`, value: /* @__PURE__ */ React.createElement("span", { className: "tnum" }, fmt.num(UNITS), " packs") })))));
  }
  function Over() {
    if (VIEW === "priya") return /* @__PURE__ */ React.createElement(Review, null);
    if (VIEW === "phone") return /* @__PURE__ */ React.createElement(PhoneC, null);
    if (VIEW === "paper") return /* @__PURE__ */ React.createElement("div", { className: "s183-paperpage" }, /* @__PURE__ */ React.createElement("span", { className: "t-caption subtle" }, AG.name, " · ", NO, " · as issued on ", D.PEOPLE.priya.short, "'s yes"), /* @__PURE__ */ React.createElement("div", { className: "s183-cert" }, /* @__PURE__ */ React.createElement(S.Certificate, { d: CERT.d, c: CASE })), OPT !== "now" && /* @__PURE__ */ React.createElement(CertSpots, { render: (who, kind) => /* @__PURE__ */ React.createElement(Signature, { who, kind }) }));
    return null;
  }
  const mount = () => {
    if (VIEW === "dist" || VIEW === "sign") return;
    const el = document.createElement("div");
    el.id = "s183";
    document.body.appendChild(el);
    if (VIEW === "phone" || VIEW === "paper") document.body.classList.add("s183-solo");
    ReactDOM.createRoot(el).render(/* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(AppRoot, { scroll: "window" }, /* @__PURE__ */ React.createElement(Over, null))));
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else setTimeout(mount, 0);
})();
