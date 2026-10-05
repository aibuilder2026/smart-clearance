/* SC-28 round 2: "Five exits, one batch" three ways. Each keeps the street picture and shows, in motion, where the
   batch's packs go. framer-motion 11.18.2, as the other mockups; each plays once when it comes into view (until then it
   waits at its start), holds on the result and offers Replay; under reduced motion it is at its result from the start.
   Every figure is the illustrative batch's, worked out by design3/core/money.js. Mount points: [data-flow] (option 1),
   [data-split] (option 2), [data-doors] (option 3); the renders come in as "art" paths in each mount's data-exits JSON. */
document.addEventListener('DOMContentLoaded', function () {
  if (!window.React || !window.Motion) return;
  var h = React.createElement, M = window.Motion, EASE = [0.22, 1, 0.36, 1];
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, useLayoutEffect = React.useLayoutEffect;
  var ICONS = window.SC3_ICONS || {};
  var num = function (n) { return Math.round(n).toLocaleString('en-IN'); };
  function Icon(p) {
    return h('svg', { className: 'ic', width: p.size || 16, height: p.size || 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: p.stroke || 1.75,
      strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', dangerouslySetInnerHTML: { __html: ICONS[p.name] || '' } });
  }
  function Replay(p) {
    return h('button', { type: 'button', className: 'replay', onClick: p.onClick }, h(Icon, { name: 'rotate-ccw', size: 16, stroke: 2 }), p.label);
  }
  // `go` turns true once the element is in view (never under reduced motion); `run` counts the replays
  function usePlay(ref, amount) {
    var reduce = !!M.useReducedMotion();
    var inView = M.useInView(ref, { once: true, amount: amount || 0.35 });
    var _r = useState(0), run = _r[0], setRun = _r[1];
    return { reduce: reduce, go: !reduce && inView, run: run, replay: function () { setRun(function (n) { return n + 1; }); } };
  }
  // data-exits: [{ id, art }], each render's path by the exit it stands for (and "batch" for the packs)
  var arts = function (el) {
    var out = {}; try { JSON.parse(el.getAttribute('data-exits') || '[]').forEach(function (x) { out[x.id] = x.art; }); } catch (e) { /* no renders */ }
    return out;
  };

  // the batch and its five exits: the packs each took and what they were worth, as money.js works them out
  var BATCH = 1360;
  var EXITS = [
    { id: 'kirana', name: 'Kiranas', x: 0.35, packs: 588, taken: true, per: '₹17.50 a pack, after the van', total: '₹10,290',
      line: function (n) { return num(n) + ' packs · 31 shops'; } },
    { id: 'expiresoon', name: 'ExpireSoon', x: 0.515, packs: 772, taken: true, per: '₹14.20 a pack, countered from ₹15', total: '₹10,862',
      line: function (n) { return num(n) + ' packs · ₹14.20'; } },
    { id: 'staff', name: 'Staff sale', x: 0.65, packs: 0, per: '₹12 a pack, up to 50 packs', note: 'priced, not needed' },
    { id: 'foodbank', name: 'Food bank', x: 0.785, packs: 0, per: '−₹1.40 a pack: a donation reverses the GST credit', note: 'priced, not needed' },
    { id: 'bin', name: 'The bin', x: 0.93, packs: 0, bin: true, per: '−₹19.36 a pack', total: '−₹26,330', note: 'not taken' },
  ];
  var TAKEN = EXITS.filter(function (e) { return e.taken; });

  /* ---------- option 1: the packs take the street, on the picture itself ---------- */
  // the plate's own coordinates (4256 × 992): the godown's door, the road, the shopfronts and the heap
  var PW = 4256, PH = 992, DOOR = { x: 610, y: 690 }, ROAD = 812, FRONT = 646, HEAP = 742;
  var ex = function (e) { return Math.round(e.x * PW); };
  var endY = function (e) { return e.bin ? HEAP : FRONT; };
  var OUT = 'M' + DOOR.x + ' ' + DOOR.y + ' C' + (DOOR.x + 30) + ' ' + (ROAD - 40) + ' ' + (DOOR.x + 120) + ' ' + ROAD + ' ' + (DOOR.x + 260) + ' ' + ROAD;
  var TRUNK = OUT + ' L' + (ex(EXITS[4]) - 110) + ' ' + ROAD;
  var turn = function (e) { var x = ex(e); return ' Q' + x + ' ' + ROAD + ' ' + x + ' ' + (ROAD - 100) + ' L' + x + ' ' + endY(e); };
  var spur = function (e) { return 'M' + (ex(e) - 110) + ' ' + ROAD + turn(e); };
  var route = function (e) { return OUT + ' L' + (ex(e) - 110) + ' ' + ROAD + turn(e); };
  // one dot is about 50 packs; the two streams leave the godown interleaved, 12 to the kiranas and 15 to the buyer
  var DOT = 50, DOTS = [];
  (function () {
    var k = Math.round(TAKEN[0].packs / DOT), n = k + Math.round(TAKEN[1].packs / DOT), sent = 0;
    for (var i = 0; i < n; i++) { var toK = sent < Math.round((i + 1) * k / n); DOTS.push(toK ? TAKEN[0] : TAKEN[1]); if (toK) sent += 1; }
  })();
  var DOTS_TO = function (e) { return DOTS.filter(function (d) { return d === e; }).length; };

  function StreetFlow() {
    var layer = useRef(null), dots = useRef([]), routes = useRef({}), watch = useRef(null);
    // on a phone the street is a strip about three screens wide, so under a third of it is ever in view: the flow
    // watches the strip, its window onto the street, and plays once nearly all of it is in view, since the road the
    // packs take runs along its foot
    useLayoutEffect(function () { var l = layer.current; watch.current = (l && l.closest('.ex-pan')) || l; }, []);
    var p = usePlay(watch, 0.9);
    // packs still at the godown, and packs arrived at each taken exit: before it plays, the batch is all at the godown
    var _l = useState(p.reduce ? 0 : BATCH), left = _l[0], setLeft = _l[1];
    var _a = useState(p.reduce ? { kirana: 588, expiresoon: 772 } : { kirana: 0, expiresoon: 0 }), got = _a[0], setGot = _a[1];
    var _s = useState(p.reduce ? 'done' : 'wait'), stage = _s[0], setStage = _s[1];
    var figure = function () { return layer.current && layer.current.closest('figure'); };
    // the chips over the picture count the packs in as they arrive (they are the page's own markup)
    useEffect(function () {
      var f = figure(); if (!f) return;
      TAKEN.forEach(function (e) { var line = f.querySelector('[data-exit="' + e.id + '"] .ex-line'); if (line) line.textContent = e.line(got[e.id]); });
    }, [got]);
    useEffect(function () {
      if (!p.go) return;
      setStage('play'); setLeft(BATCH); setGot({ kirana: 0, expiresoon: 0 });
      var controls = [], timers = [], gone = 0, arrived = { kirana: 0, expiresoon: 0 }, f = figure(), pan = f && f.closest('.ex-pan'), lead = 0;
      DOTS.forEach(function (e, i) {
        var path = routes.current[e.id], c = dots.current[i]; if (!path || !c) return;
        var L = path.getTotalLength(), delay = 0.55 + i * 0.105, dur = 0.42 + L / 5200;
        timers.push(setTimeout(function () { gone += 1; setLeft(Math.round(BATCH * (1 - gone / DOTS.length))); }, delay * 1000));
        controls.push(M.animate(0, 1, { duration: dur, delay: delay, ease: [0.45, 0, 0.4, 1],
          onUpdate: function (v) {
            var pt = path.getPointAtLength(v * L);
            c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y);
            c.setAttribute('opacity', v < 0.05 ? v * 20 : v > 0.93 ? Math.max(0, (1 - v) * 14) : 1);
            // on a phone the street is a strip that scrolls: it follows the leading dot, this once
            if (pan && pan.scrollWidth > pan.clientWidth + 4 && pt.x > lead) { lead = pt.x; pan.scrollLeft = Math.max(0, (pt.x / PW) * f.clientWidth - pan.clientWidth * 0.6); }
          },
          onComplete: function () {
            arrived[e.id] += 1;
            var n = {}; TAKEN.forEach(function (t) { n[t.id] = Math.round(t.packs * arrived[t.id] / DOTS_TO(t)); });
            setGot(n);
            if (arrived.kirana + arrived.expiresoon === DOTS.length) setStage('done');
          } }));
      });
      return function () { controls.forEach(function (c) { c.stop(); }); timers.forEach(clearTimeout); };
    }, [p.go]);
    var drawn = stage !== 'wait';
    return h('div', { className: 'flow-layer ' + stage, ref: layer },
      h('svg', { viewBox: '0 0 ' + PW + ' ' + PH, preserveAspectRatio: 'none', 'aria-hidden': 'true' },
        h('defs', null, h('filter', { id: 'fl-glow', x: '-20%', y: '-60%', width: '140%', height: '220%' }, h('feGaussianBlur', { stdDeviation: 14 }))),
        // the road the packs take, then each exit's way in: solid where packs went, dashed where none did
        h(M.motion.path, { className: 'fl-glow', d: TRUNK, initial: false, animate: { opacity: drawn ? 1 : 0 }, transition: { duration: p.reduce ? 0 : 0.6 } }),
        h(M.motion.path, { className: 'fl-trunk', d: TRUNK, initial: false, animate: { pathLength: drawn ? 1 : 0 }, transition: { duration: p.reduce ? 0 : 0.7, ease: EASE } }),
        EXITS.map(function (e, i) {
          return e.taken ? h(M.motion.path, { key: e.id, className: 'fl-spur ' + e.id, d: spur(e), initial: false, animate: { pathLength: drawn ? 1 : 0 }, transition: { duration: p.reduce ? 0 : 0.35, delay: p.reduce ? 0 : 0.3 + i * 0.12 } })
            : h(M.motion.path, { key: e.id, className: 'fl-spur none ' + e.id, d: spur(e), initial: false, animate: { opacity: drawn ? 1 : 0 }, transition: { duration: p.reduce ? 0 : 0.4, delay: p.reduce ? 0 : 0.5 + i * 0.08 } });
        }),
        EXITS.map(function (e) { return h('circle', { key: 'd' + e.id, className: 'fl-drop ' + e.id + (e.taken ? ' taken' : ''), cx: ex(e), cy: endY(e), r: e.taken ? 30 : 24 }); }),
        // nothing reaches the bin: a cross where the stream would have ended
        h('path', { className: 'fl-x', d: 'M' + (ex(EXITS[4]) - 15) + ' ' + (HEAP - 15) + ' l30 30 m0 -30 l-30 30' }),
        // the ways the dots follow (not drawn)
        TAKEN.map(function (e) { return h('path', { key: 'r' + e.id, d: route(e), ref: function (el) { routes.current[e.id] = el; }, fill: 'none', stroke: 'none' }); }),
        DOTS.map(function (e, i) { return h('circle', { key: i, ref: function (el) { dots.current[i] = el; }, className: 'fl-dot ' + e.id, r: 22, cx: DOOR.x, cy: DOOR.y, opacity: 0 }); })),
      // the godown's count drains as the packs leave
      h('div', { className: 'fl-tag', style: { left: (DOOR.x / PW * 100) + '%' } },
        h('b', null, num(left)), h('span', null, left ? ' packs at the godown' : ' packs left at the godown')));
  }
  function StreetFlowSection(props) {
    // Replay remounts the flow, which waits for nothing: it is in view, so it plays again
    var _k = useState(0), key = _k[0], setKey = _k[1];
    var reduce = !!M.useReducedMotion();
    return h(React.Fragment, null,
      ReactDOM.createPortal(h(StreetFlow, { key: key }), props.layer),
      h('div', { className: 'flow-key' },
        h('span', { className: 'fk-dots', 'aria-hidden': 'true' }, h('i', { className: 'kirana' }), h('i', { className: 'expiresoon' })),
        h('p', null, 'Each dot is about 50 packs: green to 31 kiranas, violet to one buyer on ExpireSoon. The staff sale and the food bank were priced and not needed, and nothing went to the bin.'),
        reduce ? null : h(Replay, { onClick: function () { setKey(key + 1); }, label: 'Send the batch again' })));
  }

  /* ---------- option 2: the batch, split (a flow diagram under the picture) ---------- */
  function BatchSplit(props) {
    var box = useRef(null), svg = useRef(null), rows = useRef([]), src = useRef(null);
    var p = usePlay(box, 0.4);
    var _g = useState(null), geo = _g[0], setGeo = _g[1];
    // the ribbons meet the rows wherever they wrap to: measured, and measured again on resize
    useLayoutEffect(function () {
      function measure() {
        var s = svg.current, b = src.current;
        if (!s || !b || !s.getClientRects().length || getComputedStyle(s).display === 'none') { setGeo(null); return; }
        var r = s.getBoundingClientRect(), br = b.getBoundingClientRect();
        var band = Math.min(150, br.height * 0.8), y0 = br.top + br.height / 2 - band / 2 - r.top, out = [];
        EXITS.forEach(function (e, i) {
          var row = rows.current[i].getBoundingClientRect(), t = e.packs / BATCH * band;
          out.push({ e: e, a: y0, b: y0 + t, cy: row.top + row.height / 2 - r.top, t: t }); y0 += t;
        });
        setGeo({ w: r.width, h: r.height, rows: out });
      }
      measure();
      var ro = new ResizeObserver(measure); ro.observe(box.current);
      return function () { ro.disconnect(); };
    }, []);
    var on = p.reduce || p.go, t = function (d, delay) { return p.reduce ? { duration: 0 } : { duration: d, delay: delay, ease: EASE }; };
    var ribbon = function (g) {
      var w = geo.w, c = w * 0.55, half = g.t / 2, ya = (g.a + g.b) / 2;
      return 'M12 ' + (ya - half) + ' C' + c + ' ' + (ya - half) + ' ' + c + ' ' + (g.cy - half) + ' ' + w + ' ' + (g.cy - half) +
        ' L' + w + ' ' + (g.cy + half) + ' C' + c + ' ' + (g.cy + half) + ' ' + c + ' ' + (ya + half) + ' 12 ' + (ya + half) + ' Z';
    };
    var thread = function (g) { var w = geo.w, c = w * 0.55, y = g.a; return 'M12 ' + y + ' C' + c + ' ' + y + ' ' + c + ' ' + g.cy + ' ' + w + ' ' + g.cy; };
    var a = arts(props.el);
    return h('div', { className: 'split', ref: box, role: 'group', 'aria-label': 'Where the batch went' },
      h('div', { className: 'split-src', ref: src },
        h('img', { src: a.batch, alt: '', width: 88, height: 88 }),
        h('span', { className: 'split-n' }, num(BATCH)), h('span', { className: 'split-cap' }, 'packs of masala chips with 47 days left, at the distributor\'s godown')),
      h('svg', { className: 'split-svg', ref: svg, 'aria-hidden': 'true', viewBox: geo ? '0 0 ' + geo.w + ' ' + geo.h : '0 0 1 1', preserveAspectRatio: 'none' },
        geo && h('defs', null, h('clipPath', { id: 'sp-wipe' }, h(M.motion.rect, { key: 'w' + p.run, x: 0, y: 0, height: geo.h, initial: p.reduce ? false : { width: 0 }, animate: { width: on ? geo.w : 0 }, transition: t(1.1, 0.2) }))),
        geo && h('g', { clipPath: 'url(#sp-wipe)' }, geo.rows.map(function (g) {
          return g.e.packs ? h('path', { key: g.e.id, className: 'sp-band ' + g.e.id, d: ribbon(g) }) : h('path', { key: g.e.id, className: 'sp-none ' + g.e.id, d: thread(g) });
        })),
        // the batch itself, as one bar the ribbons leave from
        geo && geo.rows.filter(function (g) { return g.e.packs; }).map(function (g, i, all) {
          return h('rect', { key: 'src' + g.e.id, className: 'sp-src ' + g.e.id, x: 0, y: g.a, width: 12, height: g.t, rx: i === 0 || i === all.length - 1 ? 0 : 0 });
        })),
      h('ol', { className: 'split-rows' }, EXITS.map(function (e, i) {
        return h('li', { key: e.id, ref: function (el) { rows.current[i] = el; }, className: 'split-row ' + e.id + (e.taken ? ' taken' : ' none') + (e.bin ? ' bin' : '') },
          h('img', { className: 'sr-art', src: a[e.id], alt: '', width: 56, height: 56 }),
          h('span', { className: 'sr-main' }, h('b', null, e.name), h('span', null, e.taken ? num(e.packs) + ' packs · ' + e.per : e.per),
            // on a phone the ribbons give way to a bar of each exit's share of the batch
            h('span', { className: 'sr-share', 'aria-hidden': 'true' }, h(M.motion.i, { key: 's' + p.run, initial: p.reduce ? false : { scaleX: 0 }, animate: { scaleX: on ? e.packs / BATCH : 0 }, transition: t(0.7, 0.3 + i * 0.12) }))),
          h(M.motion.span, { key: 'v' + p.run, className: 'sr-v', initial: p.reduce || !e.taken ? false : { opacity: 0, y: 6 }, animate: { opacity: on || !e.taken ? 1 : 0, y: on || !e.taken ? 0 : 6 }, transition: t(0.4, 1 + i * 0.12) },
            e.taken ? e.total : e.bin ? h(React.Fragment, null, h('span', { className: 'sr-no' }, 'not taken'), h('span', { className: 'sr-cost' }, e.total + ' if destroyed')) : h('span', { className: 'sr-no' }, e.note)));
      })),
      p.reduce ? null : h('div', { className: 'split-foot' }, h(Replay, { onClick: p.replay, label: 'Split the batch again' })));
  }

  /* ---------- option 3: sorted at five doors: the batch visits each exit in turn ---------- */
  function Doors(props) {
    var box = useRef(null), inner = useRef(null), doors = useRef([]);
    var p = usePlay(box, 0.4);
    // the door the batch is at: -1 before it starts, 5 once every door has had its say
    var _k = useState(p.reduce ? 5 : -1), k = _k[0], setK = _k[1];
    var _g = useState(null), pos = _g[0], setPos = _g[1];
    // on a phone the strip scrolls sideways, and only there is it a region to focus
    var _s = useState(false), scrolls = _s[0], setScrolls = _s[1];
    useLayoutEffect(function () {
      function measure() {
        var r = inner.current.getBoundingClientRect(), b = box.current;
        setPos(doors.current.map(function (d) { var q = d.getBoundingClientRect(); return q.left + q.width / 2 - r.left; }));
        setScrolls(b.scrollWidth > b.clientWidth + 4);
      }
      measure(); var ro = new ResizeObserver(measure); ro.observe(box.current); return function () { ro.disconnect(); };
    }, []);
    useEffect(function () { if (!p.go) return; setK(-1); var t = setTimeout(function () { setK(0); }, 420); return function () { clearTimeout(t); }; }, [p.go, p.run]);
    // each door takes about three quarters of a second, a taken one a little longer: under five seconds in all
    useEffect(function () { if (p.reduce || k < 0 || k >= 5) return; var t = setTimeout(function () { setK(k + 1); }, EXITS[k].taken ? 920 : 640); return function () { clearTimeout(t); }; }, [k, p.reduce]);
    // on a phone the doors are a strip that scrolls: it follows the batch along it
    useEffect(function () {
      var b = box.current; if (!pos || !b || b.scrollWidth <= b.clientWidth + 4 || k < 0 || k >= 5) return;
      b.scrollTo({ left: Math.max(0, pos[k] - b.clientWidth / 2), behavior: p.reduce ? 'auto' : 'smooth' });
    }, [k, pos]);
    var upto = k < 0 ? 0 : Math.min(5, k + 1);
    var carried = BATCH - EXITS.slice(0, upto).reduce(function (s, e) { return s + e.packs; }, 0);
    var at = k < 0 ? -1 : Math.min(4, k);
    var a = arts(props.el);
    return h(React.Fragment, null, h('div', Object.assign({ className: 'doors', ref: box }, scrolls ? { tabIndex: 0, role: 'region', 'aria-label': 'The five exits, in the order the batch reached them; scroll sideways' } : {}),
      h('div', { className: 'doors-inner', ref: inner },
        h('span', { className: 'doors-track', 'aria-hidden': 'true' }),
        pos && h(M.motion.div, { className: 'batch-token' + (carried === 0 ? ' empty' : ''), 'aria-hidden': 'true', initial: false,
          animate: { x: at < 0 ? pos[0] - 40 : pos[at] }, transition: { duration: p.reduce ? 0 : 0.5, ease: EASE } },
          h('img', { src: a.batch, alt: '', width: 32, height: 32 }), h('b', null, num(carried)), h('span', null, carried ? ' packs' : ' left')),
        h('ol', { className: 'door-list', 'aria-label': 'The five exits, in the order the batch reached them' }, EXITS.map(function (e, i) {
          var decided = k >= 5 || i <= k;
          return h('li', { key: e.id, ref: function (el) { doors.current[i] = el; }, className: 'door ' + e.id + (decided ? (e.taken ? ' took' : ' no') : '') + (i === k ? ' at' : '') },
            h('img', { src: a[e.id], alt: '', width: 84, height: 84 }),
            h('b', null, e.name), h('span', { className: 'per' }, e.per),
            h('span', { className: 'door-stamp' }, h(M.AnimatePresence, { initial: false }, decided && h(M.motion.span, { key: 'st', className: 'stamp', initial: p.reduce ? false : { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.28, ease: EASE } },
              e.taken ? h(React.Fragment, null, h(Icon, { name: 'check', size: 14, stroke: 2.6 }), num(e.packs) + ' packs · ' + e.total)
                : e.bin ? h(React.Fragment, null, h(Icon, { name: 'x', size: 14, stroke: 2.6 }), 'not taken') : e.note))));
        })))),
      p.reduce ? null : h('div', { className: 'doors-foot' }, h(Replay, { onClick: p.replay, label: 'Sort the batch again' })));
  }

  document.querySelectorAll('[data-flow]').forEach(function (el) {
    ReactDOM.createRoot(el.closest('.ex-body').querySelector('[data-flow-key]')).render(h(StreetFlowSection, { layer: el }));
  });
  document.querySelectorAll('[data-split]').forEach(function (el) { ReactDOM.createRoot(el).render(h(BatchSplit, { el: el })); });
  document.querySelectorAll('[data-doors]').forEach(function (el) { ReactDOM.createRoot(el).render(h(Doors, { el: el })); });
});
