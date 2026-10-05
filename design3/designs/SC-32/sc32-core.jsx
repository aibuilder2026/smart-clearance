/* SC-32: the hero rethought as the supply chain's journey, from the manufacturer to the distributor to the retailers, with
   the agents at work along it. React 18.3.1 and framer-motion 11.18.2, as the other mockups; the page's theme, icons and
   mark come from SC-28's sc28.js. Three options share this core and the plate; each mounts on [data-hero32]:
   "constellation" (option 1), "ring" (option 2), "follow" (option 3).

   The journey plays once, as soon as the plate has loaded, in seven beats: 4.7 s in all, so every motion is over within
   five seconds (WCAG 2.2.2). It holds on the result and offers Replay; under reduced motion it is at its result from the
   start. Every figure is the illustrative batch's, worked out by design3/core/money.js.

   Compiled to sc32.js (sc32-core.jsx, then sc32-options.jsx) with design3's esbuild flags. */
/* the plate's geography (journey.webp and journey-night.webp, composed alike), as fractions of the plate; option 2's
   chapter views and option 3's camera shots */
window.SC32_GEO = {
 "day": "../img/journey.webp",
 "night": "../img/journey-night.webp",
 "approveDay": "../../../site/assets/plates/approve.webp",
 "approveNight": "../../../site/assets/plates/approve-night.webp",
 "stages": {
  "factory": [
   0.135,
   0.505
  ],
  "godown": [
   0.535,
   0.47
  ],
  "shops": [
   0.795,
   0.445
  ]
 },
 "stagesNarrow": {
  "factory": [
   0.135,
   0.505
  ],
  "godown": [
   0.52,
   0.47
  ],
  "shops": [
   0.875,
   0.445
  ]
 },
 "route": [
  [
   0.205,
   0.69
  ],
  [
   0.26,
   0.712
  ],
  [
   0.36,
   0.716
  ],
  [
   0.455,
   0.722
  ],
  [
   0.56,
   0.728
  ],
  [
   0.645,
   0.722
  ],
  [
   0.7,
   0.705
  ],
  [
   0.78,
   0.7
  ],
  [
   0.86,
   0.71
  ]
 ],
 "routeGodown": 3,
 "flag": [
  0.53,
  0.555
 ],
 "buyer": [
  0.97,
  0.37
 ],
 "buyerChip": [
  0.985,
  0.37
 ],
 "sky": [
  0.03,
  0.36
 ],
 "stars": {
  "wide": {
   "data": [
    0.035,
    0.215
   ],
   "watcher": [
    0.128,
    0.2582
   ],
   "vision": [
    0.221,
    0.2918
   ],
   "valuer": [
    0.314,
    0.3158
   ],
   "router": [
    0.407,
    0.3302
   ],
   "you": [
    0.5,
    0.335
   ],
   "lister": [
    0.593,
    0.3302
   ],
   "outreach": [
    0.686,
    0.3158
   ],
   "negotiator": [
    0.779,
    0.2918
   ],
   "paperwork": [
    0.872,
    0.2582
   ],
   "impact": [
    0.965,
    0.215
   ]
  },
  "narrow": {
   "data": [
    0.13,
    0.13
   ],
   "watcher": [
    0.204,
    0.1804
   ],
   "vision": [
    0.278,
    0.2196
   ],
   "valuer": [
    0.352,
    0.2476
   ],
   "router": [
    0.426,
    0.2644
   ],
   "you": [
    0.5,
    0.27
   ],
   "lister": [
    0.574,
    0.2644
   ],
   "outreach": [
    0.648,
    0.2476
   ],
   "negotiator": [
    0.722,
    0.2196
   ],
   "paperwork": [
    0.796,
    0.1804
   ],
   "impact": [
    0.87,
    0.13
   ]
  }
 },
 "labels": {
  "wide": {
   "data": "above",
   "watcher": "above",
   "paperwork": "above",
   "impact": "above"
  },
  "narrow": {
   "data": "above",
   "watcher": "above",
   "vision": "above",
   "valuer": "above",
   "router": "above",
   "you": "above",
   "lister": "above",
   "outreach": "above",
   "negotiator": "above",
   "paperwork": "above",
   "impact": "above"
  }
 },
 "ring": {
  "make": {
   "x": 0.0,
   "y": 0.27,
   "w": 0.33,
   "ar": 0.5581
  },
  "stock": {
   "x": 0.3,
   "y": 0.3,
   "w": 0.33,
   "ar": 0.5581
  },
  "risk": {
   "x": 0.36,
   "y": 0.4,
   "w": 0.24,
   "ar": 0.5581
  },
  "yes": {
   "plate": "approve",
   "x": 0.08,
   "y": 0.08,
   "w": 0.84,
   "ar": 0.7105
  },
  "sold": {
   "x": 0.62,
   "y": 0.3,
   "w": 0.38,
   "ar": 0.5581
  }
 },
 "camera": {
  "make": {
   "x": 0.15,
   "y": 0.6399999999999999,
   "z": 1.6
  },
  "stock": {
   "x": 0.47,
   "y": 0.6399999999999999,
   "z": 1.6
  },
  "risk": {
   "x": 0.47,
   "y": 0.6399999999999999,
   "z": 1.75
  },
  "route": {
   "x": 0.47,
   "y": 0.6200000000000001,
   "z": 1.5
  },
  "yes": {
   "x": 0.3,
   "y": 0.6100000000000001,
   "z": 1.25
  },
  "sell": {
   "x": 0.78,
   "y": 0.6399999999999999,
   "z": 1.6
  },
  "report": {
   "x": 0.5,
   "y": 0.5,
   "z": 1.0
  },
  "rest": {
   "x": 0.5,
   "y": 0.5,
   "z": 1.0
  }
 },
 "batch": {
  "factory": [
   0.17,
   0.62
  ],
  "godown": [
   0.47,
   0.62
  ],
  "shops": [
   0.8,
   0.64
  ]
 }
};
(function () {
  function boot() {
    if (!window.React || !window.ReactDOM || !window.Motion) return;
    const { useState, useEffect, useRef, useLayoutEffect, useMemo } = React;
    const { motion, AnimatePresence, useReducedMotion, animate } = window.Motion;
    const ICONS = window.SC3_ICONS || {};
    const cx = (...a) => a.filter(Boolean).join(' ');
    const Icon = ({ name, size = 16, stroke = 1.75, className }) => <svg className={cx('ic', className)} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />;
    const num = n => Math.round(n).toLocaleString('en-IN');
    const inr = n => (n < 0 ? '−₹' : '₹') + num(Math.abs(n));
    const EASE = [0.22, 1, 0.36, 1];

    /* ---------- the batch, the chain and the journey ---------- */
    // the illustrative batch's figures, as money.js works them out
    const F = { packs: 1840, perDay: 12, atRisk: 1360, daysLeft: 47, kiranas: 588, shops: 31, buyer: 772, counter: '₹14.20', planNet: 21770, recovered: 21152, bin: 26330, kg: 218 };
    // the chain's three places, left to right on the plate
    const STAGES = [
      { id: 'factory', t: 'Manufacturer', icon: 'factory' },
      { id: 'godown', t: 'Distributor · stockist', short: 'Distributor', icon: 'warehouse' },
      { id: 'shops', t: 'Retailers', icon: 'store' },
    ];
    // the ten agents and the person who says yes: the manufacturer's own supply-chain team ("You say yes once")
    const AGENTS = {
      data: { name: 'Data', icon: 'database' }, watcher: { name: 'Watcher', icon: 'eye' }, vision: { name: 'Vision', icon: 'scan-line' },
      valuer: { name: 'Valuer', icon: 'scale' }, router: { name: 'Router', icon: 'route' }, you: { name: 'You', icon: 'hand', human: true },
      lister: { name: 'Lister', icon: 'store' }, outreach: { name: 'Outreach', icon: 'send' }, negotiator: { name: 'Negotiator', icon: 'gavel' },
      paperwork: { name: 'Paperwork', icon: 'file-text' }, impact: { name: 'Impact', icon: 'leaf' },
    };
    // the journey, beat by beat: where it is on the chain, who works, what it did, and how long it holds (ms)
    const BEATS = [
      { id: 'make', at: 'factory', t: 'Made', did: `The manufacturer ships ${num(F.packs)} packs to its distributor`, who: [], ms: 600 },
      { id: 'stock', at: 'godown', t: 'Stocked', did: `${num(F.packs)} packs in the distributor's godown, selling ${F.perDay} a day`, who: [], ms: 500 },
      { id: 'risk', at: 'godown', t: 'At risk', did: `${num(F.atRisk)} packs won't sell in the ${F.daysLeft} days left`, who: ['data', 'watcher', 'vision'], ms: 700 },
      { id: 'route', at: 'godown', t: 'Priced and split', did: `Five exits priced · ${F.kiranas} to ${F.shops} kiranas, ${F.buyer} to one buyer`, who: ['valuer', 'router'], ms: 600 },
      { id: 'yes', at: 'factory', t: 'One yes', did: `You approve in one tap · ${inr(F.planNet)} on screen`, who: ['you'], human: true, ms: 900 },
      { id: 'sell', at: 'shops', t: 'Sold', did: `${F.kiranas} packs to ${F.shops} kiranas · ${F.buyer} to a buyer, countered to ${F.counter}`, who: ['lister', 'outreach', 'negotiator'], ms: 700 },
      { id: 'report', at: 'factory', t: 'Settled', did: `${inr(F.recovered)} recovered · ${F.kg} kg kept out of landfill`, who: ['paperwork', 'impact'], ms: 700 },
    ];
    const NB = BEATS.length;
    const beatOf = id => BEATS.findIndex(b => b.id === id);
    const names = b => b.who.map(w => AGENTS[w].name).join(' · ');
    // the crew in the order they work, each with the beat it works in
    const CREW = BEATS.flatMap((b, i) => b.who.map(id => ({ id, ...AGENTS[id], beat: i, at: b.at })));
    const RESULT = `${inr(F.recovered)} recovered, instead of ${inr(-F.bin)} to destroy it`;

    /* ---------- the plate as it is drawn, and a layer laid over it ---------- */
    // The plate is cover-fitted in its box at its own object-position, so a point of the plate lands where at(p) says, in the
    // layer's pixels. The layer is laid exactly over the plate's box and measured again as the page resizes or the theme
    // swaps the plate.
    function usePlate(layer) {
      const [g, setG] = useState(null); const [ready, setReady] = useState(false);
      useLayoutEffect(() => {
        const el = layer.current; if (!el) return;
        const hero = el.closest('.hero'); const imgs = [...hero.querySelectorAll('.hero-scene img')];
        const shown = () => imgs.find(i => i.getClientRects().length) || imgs[0];
        const measure = () => {
          const img = shown(), host = el.offsetParent; if (!img || !host) return;
          const r = img.getBoundingClientRect(), p = host.getBoundingClientRect();
          // the plate's own box, untransformed (option 3 moves a camera over it)
          const w = img.offsetWidth || r.width, h = img.offsetHeight || r.height;
          const nw = img.naturalWidth || +img.getAttribute('width'), nh = img.naturalHeight || +img.getAttribute('height');
          const [px, py] = (getComputedStyle(img).objectPosition || '50% 50%').split(' ').map(v => parseFloat(v) / 100);
          const s = Math.max(w / nw, h / nh);
          const pic = img.closest('.hero-scene'); const o = pic.getBoundingClientRect();
          setG({ left: pic.offsetLeft, top: pic.offsetTop, w, h, s, ox: (w - nw * s) * px, oy: (h - nh * s) * py, nw, nh, hero: hero.getBoundingClientRect().width, ow: o.width });
        };
        measure();
        const ro = new ResizeObserver(measure); imgs.forEach(i => ro.observe(i)); ro.observe(hero);
        const mo = new MutationObserver(() => requestAnimationFrame(measure)); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        imgs.forEach(i => { if (i.complete && i.naturalWidth) setReady(true); else i.addEventListener('load', () => { measure(); setReady(true); }, { once: true }); });
        return () => { ro.disconnect(); mo.disconnect(); };
      }, []);
      const at = p => g ? [g.ox + p[0] * g.nw * g.s, g.oy + p[1] * g.nh * g.s] : [0, 0];
      const style = g ? { left: g.left, top: g.top, width: g.w, height: g.h } : { visibility: 'hidden' };
      return { g, at, ready, style, wide: !!g && g.w >= 900 };
    }
    // is the page dark? (the theme's own attribute, set by sc28.js)
    function useDark() {
      const read = () => document.documentElement.getAttribute('data-theme') === 'dark';
      const [d, setD] = useState(read);
      useEffect(() => { const mo = new MutationObserver(() => setD(read())); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); return () => mo.disconnect(); }, []);
      return d;
    }
    // a seeded random, so every visit (and every comp) draws the same field
    const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    // a canvas the size of the layer, at the device's pixel ratio (at most 2)
    function fitCanvas(cv, g) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(g.w), h = Math.round(g.h);
      if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx;
    }
    // a point along a polyline, t from 0 to 1 by length
    function along(pts, t) {
      const seg = []; let L = 0;
      for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
      let s = Math.max(0, Math.min(1, t)) * L;
      for (let i = 0; i < seg.length; i++) { if (s <= seg[i] || i === seg.length - 1) { const u = seg[i] ? Math.min(1, s / seg[i]) : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]; } s -= seg[i]; }
      return pts[pts.length - 1];
    }

    /* ---------- the walk: where the batch is ---------- */
    // -1 before it sets off, 0 to 6 at a beat, 7 when it is done: how it rests, and how it is from the start under reduced
    // motion. It sets off half a second after the plate has loaded, so it never plays over an empty frame.
    function useWalk(ready) {
      const reduce = !!useReducedMotion();
      const [k, setK] = useState(reduce ? NB : -1); const [run, setRun] = useState(0);
      useEffect(() => { if (reduce) { setK(NB); return; } if (!ready) return; setK(-1); const t = setTimeout(() => setK(0), 500); return () => clearTimeout(t); }, [ready, run, reduce]);
      useEffect(() => { if (reduce || k < 0 || k >= NB) return; const t = setTimeout(() => setK(k + 1), BEATS[k].ms); return () => clearTimeout(t); }, [k, reduce]);
      return { k, reduce, run, playing: k >= 0 && k < NB, done: k >= NB, beat: k >= 0 && k < NB ? BEATS[k] : null, go: i => setK(i), replay: () => setRun(r => r + 1) };
    }
    // a figure that counts up once while `on` (700 ms, the system's roll), at its value under reduced motion
    function useCount(on, to, reduce) {
      const [v, setV] = useState(on || reduce ? to : 0);
      useEffect(() => {
        if (reduce) { setV(to); return; } if (!on) { setV(0); return; }
        const c = animate(0, to, { duration: 0.7, ease: EASE, onUpdate: x => setV(x) }); return () => c.stop();
      }, [on, reduce]);
      return v;
    }
    // where a crew member stands: done once its beat is past, working during it
    const crewState = (c, w) => ({ done: c.beat < w.k || w.done, now: c.beat === w.k && w.playing });

    const Replay = ({ w }) => w.reduce ? null : <button type="button" className="replay" onClick={w.replay}><Icon name="rotate-ccw" size={16} stroke={2} />Replay the journey</button>;
    // the journey, for a screen reader: the picture is hidden from it
    const SrJourney = () => <>
      <ol className="sr-only" aria-label="One batch's journey">{BEATS.map(b => <li key={b.id}>{b.t}{b.who.length ? `, ${names(b)}` : ''}: {b.did}.</li>)}</ol>
      <p className="sr-only">Sold, not binned: {RESULT}.</p>
    </>;
    // what the batch is doing: before it sets off, at each beat, and when it is done
    function Caption({ w, money, className }) {
      const b = w.beat;
      return <div className={cx('h32-caption', b && b.human && 'human', className)} aria-hidden="true">
        {w.k < 0 ? <><b>{num(F.packs)} packs leave the factory.</b><span>Follow them to the shelf.</span></>
          : b ? <><span className="n">{w.k + 1} of {NB}</span><b>{b.t}</b>{b.who.length > 0 && <span className="who">{names(b)}</span>}<span className="did">{b.id === 'report' ? `${inr(money)} recovered · ${F.kg} kg kept out of landfill` : b.did}</span></>
          : <><span className="n">{NB} of {NB}</span><b>Sold, not binned.</b><span className="did">{RESULT}</span></>}
      </div>;
    }
    // an agent's chip: its icon and name (the icon alone when compact and idle, or always when iconOnly); lit once it has
    // worked, wearing the aura while it works; a person is amber
    const AgentChip = ({ c, w, compact, iconOnly }) => { const { done, now } = crewState(c, w);
      return <span className={cx('h32-agent', c.human && 'human', done && 'on', now && 'now', w.playing && !done && !now && 'later', (iconOnly || compact && !now) && 'icon')}>
        <span className={cx(now && 'aura')}><i><Icon name={c.icon} size={13} stroke={2.2} /></i>{c.name}</span></span>; };
    // a stage's pin: its icon and name over its place on the plate (a shorter name on phones), lit while the batch is there
    const StagePin = ({ s, x, y, w, compact, short, edge }) => { const here = w.beat && w.beat.at === s.id;
      return <span className={cx('h32-pin', here && 'here', compact && 'compact', edge && 'edge-' + edge)} style={{ left: x, top: y }}>
        <span className="h32-pin-body"><i><Icon name={s.icon} size={14} stroke={2} /></i><b>{short && s.short || s.t}</b></span><span className="h32-pin-stem" /></span>; };

    window.SC32 = { React, useState, useEffect, useRef, useLayoutEffect, useMemo, motion, AnimatePresence, animate, cx, Icon, num, inr, EASE, F, STAGES, AGENTS, BEATS, NB, beatOf, names, CREW, RESULT,
      usePlate, useDark, seeded, fitCanvas, along, useWalk, useCount, crewState, Replay, SrJourney, Caption, AgentChip, StagePin };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
