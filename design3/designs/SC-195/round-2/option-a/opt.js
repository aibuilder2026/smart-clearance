(function() {
  const K = window.SC3, S = window.SC3_SCREENS, R = window.SC195R2;
  const { cx, Aura } = K;
  const { useRef, useEffect, useState } = React;
  const INK = { light: "13, 28, 21", dark: "214, 255, 232" };
  const LIT = { light: "#167a52", dark: "#3ccb8a" }, AMBER = { light: "#d39a12", dark: "#f7c04a" };
  function orbit(w, h, band) {
    const stageW = band ? w : w - Math.max(460, w / 2.25);
    const cxp = stageW * 0.5, cyp = band ? h * 0.5 : h * 0.53, rx = stageW * (band ? 0.38 : 0.33), ry = band ? h * 0.36 : h * 0.19;
    return R.CREW.map((c, i) => {
      const a = ((band ? 196 : 200) + i * 29.5) * Math.PI / 180;
      return { ...c, x: cxp + rx * Math.cos(a), y: cyp + ry * Math.sin(a), ox: Math.cos(a), oy: Math.sin(a) };
    });
  }
  function threads(stars) {
    const at = (id) => stars.find((s) => s.id === id), out = [];
    const order = ["data", "watcher", "vision", "valuer", "router", "you"];
    for (let i = 1; i < order.length; i++) out.push([at(order[i - 1]), at(order[i]), i]);
    ["outreach", "lister", "negotiator"].forEach((id) => {
      out.push([at("you"), at(id), 6, true]);
      out.push([at(id), at("paperwork"), 7]);
    });
    out.push([at("paperwork"), at("impact"), 8]);
    return out;
  }
  function Mesh({ band, w }) {
    const box = useRef(null), cv = useRef(null), size = R.useSize(box);
    const dark = R.useDark();
    const field = useRef(null), raf = useRef(0), stepAt = useRef(0), st = useRef({});
    const stars = size ? orbit(size.w, size.h, band) : [];
    st.current = { w, dark, size, stars };
    useEffect(() => {
      stepAt.current = performance.now();
    }, [w.k]);
    useEffect(() => {
      if (!size) return;
      const rnd = R.seeded(195), n = band ? 26 : Math.round(size.w * size.h / 15e3), nodes = [];
      while (nodes.length < n) nodes.push({ x: rnd() * size.w, y: rnd() * size.h, vx: (rnd() - 0.5) * 0.28, vy: (rnd() - 0.5) * 0.28, r: 1.1 + rnd() * 1.3 });
      field.current = nodes;
    }, [size && size.w, size && size.h]);
    const draw = () => {
      const s = st.current, c = cv.current;
      if (!c || !s.size || !field.current) return;
      const { w: W, h: H } = s.size, ctx = R.fitCanvas(c, W, H), mode = s.dark ? "dark" : "light", ink = INK[mode], k = s.w.done ? R.N : s.w.k;
      ctx.clearRect(0, 0, W, H);
      const nodes = field.current, all = nodes.concat(s.stars), link = band ? 70 : 120;
      ctx.lineWidth = 1;
      for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) {
        const d = Math.hypot(all[a].x - all[b].x, all[a].y - all[b].y);
        if (d >= link) continue;
        ctx.strokeStyle = `rgba(${ink}, ${((s.dark ? 0.05 : 0.05) + (1 - d / link) * (s.dark ? 0.16 : 0.14)).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(all[a].x, all[a].y);
        ctx.lineTo(all[b].x, all[b].y);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(${ink}, ${s.dark ? 0.34 : 0.26})`;
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });
      if (!s.stars.length) return;
      const p = s.w.playing ? Math.min(1, (performance.now() - stepAt.current) / (s.w.k === 6 ? 700 : 340)) : 1;
      ctx.lineCap = "round";
      threads(s.stars).forEach(([a, b, stop, fan]) => {
        if (stop > k) return;
        const t = stop === k && s.w.playing ? p : 1;
        ctx.lineWidth = band ? 1.6 : 2.2;
        ctx.strokeStyle = a.human || b.human ? AMBER[mode] : LIT[mode];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
        ctx.stroke();
        if (fan && stop === k && s.w.playing) for (let j = 0; j < 3; j++) {
          const u = ((performance.now() - stepAt.current) / 520 + j / 3) % 1;
          ctx.fillStyle = LIT[mode];
          ctx.beginPath();
          ctx.arc(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, band ? 2 : 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      s.stars.forEach((n) => {
        const state = s.w.state(n), col = n.human ? AMBER[mode] : LIT[mode];
        ctx.beginPath();
        ctx.arc(n.x, n.y, band ? 4 : 5.5, 0, Math.PI * 2);
        if (state === "later") {
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = `rgba(${ink}, ${s.dark ? 0.45 : 0.35})`;
          ctx.fillStyle = s.dark ? "#0b110e" : "#f2f6f3";
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = col;
          ctx.fill();
        }
      });
    };
    const step = () => {
      const s = st.current, live = s.w.playing && !s.w.reduce;
      if (live && s.size && field.current) field.current.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > s.size.w) n.vx *= -1;
        if (n.y < 0 || n.y > s.size.h) n.vy *= -1;
      });
      draw();
      raf.current = live ? requestAnimationFrame(step) : 0;
    };
    useEffect(() => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(step);
    }, [w.k, w.reduce, dark, size && size.w, size && size.h]);
    useEffect(() => () => cancelAnimationFrame(raf.current), []);
    const place = (n) => band ? { left: n.x, top: n.y, transform: n.x > size.w * 0.62 ? "translate(calc(-100% - 10px), -50%)" : n.x < size.w * 0.38 ? "translate(10px, -50%)" : n.oy < 0 ? "translate(-50%, 10px)" : "translate(-50%, calc(-100% - 10px))" } : { left: n.x, top: n.y, transform: Math.abs(n.ox) < 0.35 ? n.oy < 0 ? "translate(-50%, calc(-100% - 12px))" : "translate(-50%, 12px)" : n.ox < 0 ? "translate(calc(-100% - 12px), -50%)" : "translate(12px, -50%)" };
    const centre = size && !band ? { left: (size.w - Math.max(460, size.w / 2.25)) * 0.5, top: size.h * 0.53 } : null;
    return /* @__PURE__ */ React.createElement("div", { ref: box, className: cx("r2a-mesh", band && "band") }, /* @__PURE__ */ React.createElement("canvas", { ref: cv, className: "r2a-canvas" }), stars.map((n) => {
      const s = w.state(n);
      const show = !band || s === "now" || w.done && n.human;
      return show && /* @__PURE__ */ React.createElement("span", { key: n.id, className: "r2a-label", style: place(n) }, /* @__PURE__ */ React.createElement(Aura, { on: s === "now", className: "r2a-aura" }, /* @__PURE__ */ React.createElement(R.Chip, { c: n, st: s, small: band })));
    }), centre && /* @__PURE__ */ React.createElement("div", { className: "r2a-centre", style: centre }, /* @__PURE__ */ React.createElement(R.Caption, { w, className: "centre" })));
  }
  function Stage() {
    const w = R.useWalk();
    return /* @__PURE__ */ React.createElement("div", { className: "si-stage r2-stage" }, /* @__PURE__ */ React.createElement(R.Head, null, /* @__PURE__ */ React.createElement(R.Replay, { w })), /* @__PURE__ */ React.createElement(R.SrStops, null), /* @__PURE__ */ React.createElement(R.Ground, null, /* @__PURE__ */ React.createElement(Mesh, { w })));
  }
  const BandMesh = () => {
    const w = R.useWalk();
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(R.BandHead, null), /* @__PURE__ */ React.createElement(Mesh, { band: true, w }), /* @__PURE__ */ React.createElement(R.Caption, { w, className: "band" }));
  };
  S.HeroStage = Stage;
  const Orig = S.Live.SignInLive;
  S.Live.SignInLive = (props) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Orig, { ...props }), /* @__PURE__ */ React.createElement(R.Band, null, /* @__PURE__ */ React.createElement(BandMesh, null)));
})();
