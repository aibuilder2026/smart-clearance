// SC-211: the agents as the app's own graph (the sign-ins' stage, SC-195: the chips on a constellation, the handoffs
// drawn green, the person's yes in amber, the exits worked at once), made cinematic: a camera that flies through it in
// depth, each agent clicked open with what it does and the rule it keeps, the brand's rules laid on the graph as
// guardrails, both human gates clicked open, and the audit trail. Nothing runs on its own clock: renderAt(t) draws the
// frame for scene time t, so capture.mjs takes it frame by frame. Two segments share it: A (the team, each agent, the
// rules) and B (the yes, the second yes, the trace), with B starting from A's end.
(function () {
  const W = 1920, H = 1080;
  const IC = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[n] || ''}</svg>`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const sm = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
  const eo = (x) => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const spring = (x, zeta = 0.6, w = 14) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); };
  const fade = (u, a, b, fi = 0.3, fo = 0.3) => Math.min(clamp((u - a) / fi), b == null ? 1 : clamp((b - u) / fo));
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // ------------------------------------------------------------------ the graph, as the app lays it out (left to right)
  const NODES = [
    { id: 'data', name: 'Data', icon: 'database', x: 260, y: 820 },
    { id: 'watcher', name: 'Watcher', icon: 'eye', x: 540, y: 600 },
    { id: 'vision', name: 'Vision', icon: 'scan-line', x: 830, y: 470 },
    { id: 'valuer', name: 'Valuer', icon: 'scale', x: 1120, y: 520 },
    { id: 'router', name: 'Router', icon: 'route', x: 1380, y: 680 },
    { id: 'you', name: 'You', icon: 'hand', x: 1610, y: 840, human: true },
    { id: 'outreach', name: 'Outreach', icon: 'send', x: 1900, y: 600 },
    { id: 'lister', name: 'Lister', icon: 'store', x: 1980, y: 850 },
    { id: 'negotiator', name: 'Negotiator', icon: 'gavel', x: 1900, y: 1100 },
    { id: 'paperwork', name: 'Paperwork', icon: 'file-text', x: 2250, y: 880 },
    { id: 'impact', name: 'Impact', icon: 'leaf', x: 2520, y: 690 },
    { id: 'destroy', name: 'Destruction', icon: 'trash-2', x: 2190, y: 1230, branch: true },
    { id: 'yes2', name: 'Second yes', icon: 'hand', x: 2480, y: 1130, human: true, branch: true },
  ];
  const N = Object.fromEntries(NODES.map((n) => [n.id, n]));
  const EDGES = [
    ['data', 'watcher'], ['watcher', 'vision'], ['vision', 'valuer'], ['valuer', 'router'], ['router', 'you'],
    ['you', 'outreach', 'amber'], ['you', 'lister', 'amber'], ['you', 'negotiator', 'amber'],
    ['outreach', 'paperwork'], ['lister', 'paperwork'], ['negotiator', 'paperwork'], ['paperwork', 'impact'],
    ['negotiator', 'destroy', 'branch'], ['destroy', 'yes2', 'branch'], ['yes2', 'paperwork', 'amber'],
  ].map(([a, b, kind]) => {
    const A = N[a], B = N[b], dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
    const k = 0.16 * (((a.length + b.length) % 2) ? 1 : -1);
    const c = { x: (A.x + B.x) / 2 - dy * k, y: (A.y + B.y) / 2 + dx * k };
    return { a, b, kind: kind || 'green', A, B, c, len: len * 1.04 };
  });
  const bez = (e, p) => ({ x: (1 - p) * (1 - p) * e.A.x + 2 * (1 - p) * p * e.c.x + p * p * e.B.x, y: (1 - p) * (1 - p) * e.A.y + 2 * (1 - p) * p * e.c.y + p * p * e.B.y });
  const edge = (a, b) => EDGES.find((e) => e.a === a && e.b === b);

  // what each agent does, in plain words, and the rule it keeps (the app's own crew, product.jsx AG_CREW)
  const AG = {
    data: { p: "Loads the distributor's stock, every morning.", rows: [['database', 'Reads', "the stock export from the distributor's system"]], rule: "Only the brand's own data", model: 'Gemini' },
    watcher: { p: "Spots the batches that won't sell in time.", rows: [['activity', 'Reads', '28 days of sales, every morning']], rule: 'Quick commerce takes only 30+ days to the date', model: 'Rules' },
    vision: { p: "Reads the carton's label from one photo.", rows: [['scan-line', 'Checks', 'the batch, its dates and its MRP']], rule: 'Every label must match the stock', model: 'Gemini' },
    valuer: { p: 'Prices every exit, the bin included.', rows: [['indian-rupee', 'Prices', 'kiranas, staff sale, food bank, marketplace']], rule: "Never below the brand's floor price", model: 'Gemini' },
    router: { p: 'Splits the batch across the exits.', rows: [['route', 'Splits', '1,580 packs, the best value first']], rule: "Within each exit's caps and dates", model: 'Gemini' },
    outreach: { p: 'Offers the packs to kiranas, in their own language.', rows: [['send', 'Sends', 'a scheme in Hindi, 48 hours to order']], rule: "Only the distributor's own shops", model: 'Gemini', small: true },
    lister: { p: 'Lists the lot on a near-expiry marketplace.', rows: [['store', 'Lists', "outside the brand's own territory"]], rule: 'Hidden from its own markets', model: 'Gemini', small: true },
    negotiator: { p: 'Counters every bid.', rows: [['gavel', 'Closes', '772 packs at ₹14.20']], rule: 'Never below the floor, never reveals it', model: 'Gemini', small: true },
    paperwork: { p: 'Drafts every paper, signed and filed.', rows: [['file-text', 'Drafts', 'invoices, credit notes, the GST memo']], rule: "Credit within each distributor's cap", model: 'Gemini' },
    impact: { p: 'Measures the good each batch does.', rows: [['leaf', 'Posts', 'kilos saved, meals served, CO₂e avoided']], rule: 'Every figure from the ledger', model: 'Gemini' },
  };
  const ORDER = ['data', 'watcher', 'vision', 'valuer', 'router', 'outreach', 'lister', 'negotiator', 'paperwork', 'impact'];

  // ------------------------------------------------------------------ the page's parts
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild; };
  const world = document.getElementById('world'), chipsEl = document.getElementById('chips'), ui = document.getElementById('ui');
  const bg = document.getElementById('bg').getContext('2d'), glow = document.getElementById('glow').getContext('2d'), fx = document.getElementById('fx').getContext('2d');
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('width', 2800); svg.setAttribute('height', 1500);
  svg.innerHTML = `<defs>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="softer" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
    <radialGradient id="comet"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#7ef0b4"/><stop offset="1" stop-color="#34d380" stop-opacity="0"/></radialGradient>
    <radialGradient id="cometA"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#ffd27a"/><stop offset="1" stop-color="#f7c04a" stop-opacity="0"/></radialGradient>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="rgba(115,201,157,0.07)" stroke-width="1.5"/></pattern>
  </defs>
  <rect x="-600" y="-500" width="4000" height="2600" fill="url(#grid)"/>
  <g id="rails"></g><g id="eglow" filter="url(#soft)"></g><g id="edges"></g><g id="packets"></g><g id="comets"></g>`;
  world.appendChild(svg);
  const gRails = svg.querySelector('#rails'), gGlow = svg.querySelector('#eglow'), gEdges = svg.querySelector('#edges'), gPk = svg.querySelector('#packets'), gCom = svg.querySelector('#comets');
  const pathD = (e) => `M${e.A.x} ${e.A.y} Q${e.c.x} ${e.c.y} ${e.B.x} ${e.B.y}`;
  const COL = { green: '#34d380', amber: '#f7c04a', branch: '#e9895a' };
  for (const e of EDGES) {
    const g1 = document.createElementNS(SVGNS, 'path'); g1.setAttribute('d', pathD(e)); g1.setAttribute('fill', 'none');
    g1.setAttribute('stroke', COL[e.kind]); g1.setAttribute('stroke-width', 16); g1.setAttribute('stroke-linecap', 'round');
    g1.setAttribute('stroke-dasharray', e.len); gGlow.appendChild(g1);
    const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', pathD(e)); p.setAttribute('fill', 'none');
    p.setAttribute('stroke', COL[e.kind]); p.setAttribute('stroke-width', 5); p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-dasharray', e.len); gEdges.appendChild(p);
    const c = document.createElementNS(SVGNS, 'circle'); c.setAttribute('r', 34); c.setAttribute('fill', e.kind === 'green' ? 'url(#comet)' : 'url(#cometA)'); gCom.appendChild(c);
    e.glowEl = g1; e.el = p; e.comet = c; e.pk = [];
    for (let i = 0; i < 4; i++) { const d = document.createElementNS(SVGNS, 'circle'); d.setAttribute('r', 8); d.setAttribute('fill', e.kind === 'green' ? '#bdf5d6' : '#ffe2a3'); gPk.appendChild(d); e.pk.push(d); }
  }
  // the guardrails: two rails along the batch's path, either side of it
  const CHAIN = ['data', 'watcher', 'vision', 'valuer', 'router', 'you', 'lister', 'paperwork', 'impact'];
  const railPts = [];
  for (let i = 0; i < CHAIN.length - 1; i++) {
    const e = edge(CHAIN[i], CHAIN[i + 1]) || edge('you', 'lister');
    for (let k = 0; k < 24; k++) railPts.push(bez(e, k / 24));
  }
  railPts.push({ x: N.impact.x, y: N.impact.y });
  const rails = [-118, 118].map((off) => {
    const pts = railPts.map((p, i) => {
      const a = railPts[Math.max(0, i - 3)], b = railPts[Math.min(railPts.length - 1, i + 3)];
      const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
      return { x: p.x - dy / l * off, y: p.y + dx / l * off };
    });
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    const d = 'M' + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L');
    const gl = document.createElementNS(SVGNS, 'path'); gl.setAttribute('d', d); gl.setAttribute('fill', 'none'); gl.setAttribute('stroke', '#7fd7ff');
    gl.setAttribute('stroke-width', 14); gl.setAttribute('filter', 'url(#soft)'); gl.setAttribute('stroke-dasharray', len); gRails.appendChild(gl);
    const r = document.createElementNS(SVGNS, 'path'); r.setAttribute('d', d); r.setAttribute('fill', 'none'); r.setAttribute('stroke', '#bfeaff');
    r.setAttribute('stroke-width', 3.5); r.setAttribute('stroke-dasharray', len); gRails.appendChild(r);
    return { gl, r, len };
  });

  // the chips (upright, over the plane), each with its ring, halo, Gemini tag and lock
  for (const n of NODES) {
    const el = $(`<div class="chip${n.human ? ' human' : ''}"><div class="halo"></div><div class="ring"></div>
      <div class="tile">${IC(n.icon)}</div><div class="nm">${n.name}</div>
      ${AG[n.id] ? `<div class="gem">${IC(AG[n.id].model === 'Gemini' ? 'sparkles' : 'list-checks')}${AG[n.id].model}</div>` : ''}
      <div class="lock">${IC('lock')}</div></div>`);
    chipsEl.appendChild(el); n.el = el; n.ring = el.querySelector('.ring'); n.halo = el.querySelector('.halo');
    n.gem = el.querySelector('.gem'); n.lock = el.querySelector('.lock'); n.nm = el.querySelector('.nm'); n.tile = el.querySelector('.tile');
  }

  // ------------------------------------------------------------------ the camera
  const D = 1500;
  function camMatrix(c) {
    const P = new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1 / D, 0, 0, 0, 1]);
    return new DOMMatrix().translate(W / 2 + (c.ox || 0), H / 2 + (c.oy || 0)).multiply(P)
      .rotateAxisAngle(1, 0, 0, c.rx).rotateAxisAngle(0, 0, 1, c.rz).scale(c.s, c.s, c.s).translate(-c.cx, -c.cy);
  }
  function camRot(c) { return new DOMMatrix().rotateAxisAngle(1, 0, 0, c.rx).rotateAxisAngle(0, 0, 1, c.rz).scale(c.s, c.s, c.s).translate(-c.cx, -c.cy); }
  const project = (m, x, y) => { const p = m.transformPoint(new DOMPoint(x, y, 0, 1)); return { x: p.x / p.w, y: p.y / p.w, w: p.w }; };
  let KEYS = [];
  function camAt(t) {
    let i = 0; while (i < KEYS.length - 1 && KEYS[i + 1].t <= t) i++;
    const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
    const p = b.t > a.t ? sm((t - a.t) / (b.t - a.t)) : 1;
    const c = {};
    for (const k of ['cx', 'cy', 's', 'rx', 'rz', 'ox', 'oy']) c[k] = lerp(a[k] ?? 0, b[k] ?? 0, t >= b.t ? 1 : (t < a.t ? 0 : p));
    // a breath of handheld drift
    c.rz += Math.sin(t * 0.37) * 0.6; c.rx += Math.sin(t * 0.29 + 1.3) * 0.5; c.cx += Math.sin(t * 0.21) * 10; c.cy += Math.cos(t * 0.17) * 8;
    return c;
  }

  // ------------------------------------------------------------------ the timeline, from the narration's cues
  let C = null, SEG = 'A', EVENTS = [], CLICKS = [], IGN = {}, EDGE_T = {}, CARDS = [], SH = [], LOGS = [];
  const key = (t, o) => KEYS.push({ t, ...o });
  const ev = (t, type, extra = {}) => EVENTS.push({ t: +t.toFixed(3), type, ...extra });
  const WIDE = { cx: 1390, cy: 870, s: 0.74, rx: 36, rz: -4 };

  function build() {
    KEYS = []; EVENTS = []; CLICKS = []; IGN = {}; EDGE_T = {}; CARDS = []; SH = []; LOGS = [];
    if (SEG === 'A') buildA(); else buildB();
    KEYS.sort((a, b) => a.t - b.t);
    EVENTS.sort((a, b) => a.t - b.t);
  }

  function buildA() {
    const c = C;
    // the team wakes: out of the dark, far away, then the whole graph
    key(0, { cx: 1480, cy: 900, s: 0.56, rx: 50, rz: -11 });
    key((c.line ?? c.team - 2.2) + 0.2, { cx: 1440, cy: 890, s: 0.6, rx: 47, rz: -9 });
    key(c.ten + 0.2, { ...WIDE, cx: 1380, s: 0.76, rx: 40, rz: -6 });
    key(c.job - 0.1, { ...WIDE, s: 0.72, rx: 38, rz: -4 });
    NODES.filter((n) => !n.branch).forEach((n, i) => { IGN[n.id] = c.ten + 0.1 + i * 0.13; ev(IGN[n.id], 'ignite', { node: n.id }); });
    ev(0.15, 'whoosh_in'); ev(0.5, 'riser'); ev(c.ten, 'hit');
    ev(c.cloud, 'badge'); ev(c.gemini, 'badge'); ev(c.gemini + 0.25, 'sparkle');
    // each agent: the camera brings it to the centre, the pointer clicks it open, its handoff draws
    const close = { data: 1.12, watcher: 1.1, vision: 1.08, valuer: 1.06, router: 1.04 };
    let prev = null;
    ORDER.forEach((id, i) => {
      const t = c[id], n = N[id];
      const nextT = i + 1 < ORDER.length ? c[ORDER[i + 1]] : c.rails;
      const fan = ['outreach', 'lister', 'negotiator'].includes(id);
      if (!fan) key(t - 0.15, { cx: n.x + 160, cy: n.y + 60, s: close[id] || 0.98, rx: 28, rz: -3 });
      if (id === 'outreach') key(t - 0.2, { cx: 1880, cy: 900, s: 0.78, rx: 31, rz: -2 });
      if (id === 'negotiator') key(t + 0.3, { cx: 1900, cy: 900, s: 0.76, rx: 31, rz: -2 });
      CLICKS.push({ t: t - 0.12, node: id }); ev(t - 0.12, 'click');
      CARDS.push({ id, t0: t, t1: fan ? c.paperwork - 0.05 : nextT - 0.02, small: fan, slot: fan ? ['outreach', 'lister', 'negotiator'].indexOf(id) : 0 });
      ev(t + 0.02, 'card');
      if (prev) {
        const e = edge(prev, id) || edge('you', id);
        if (e && EDGE_T[e.a + e.b] == null) { EDGE_T[e.a + e.b] = t - 0.55; ev(t - 0.55, 'edge'); }
      }
      if (id === 'outreach') { for (const x of ['outreach', 'lister', 'negotiator']) { const e = edge('you', x); if (EDGE_T[e.a + e.b] == null) { EDGE_T[e.a + e.b] = t - 0.5 + (x === 'outreach' ? 0 : x === 'lister' ? 0.08 : 0.16); } } EDGE_T['routeryou'] = t - 1.0; ev(t - 1.0, 'edge'); }
      if (id === 'paperwork') { for (const x of ['outreach', 'lister', 'negotiator']) { const e = edge(x, 'paperwork'); EDGE_T[e.a + e.b] = t - 0.55; } ev(t - 0.55, 'edge'); }
      if (id === 'impact') { EDGE_T['paperworkimpact'] = t - 0.55; }
      prev = fan ? 'you' : id;
    });
    // the guardrails: the whole graph, the rails drawn along it, the brand's rules laid on it
    key(c.rails - 0.2, { ...WIDE, cx: 1420, cy: 860, s: 0.64, rx: 38, rz: -5 });
    key(c.rules + 0.4, { ...WIDE, cx: 1060, cy: 850, s: 0.62, rx: 36, rz: -4 });
    key(c.end, { ...WIDE, cx: 1090, cy: 840, s: 0.64, rx: 35, rz: -3 });
    ev(c.rails, 'rails'); ev(c.rules, 'panel');
    SH = [
      { t: c.dates + 0.15, rule: 0, to: 'watcher' }, { t: c.dates + 0.45, rule: 0, to: 'lister' },
      { t: c.floor + 0.2, rule: 1, to: 'valuer' }, { t: c.floor + 0.5, rule: 1, to: 'negotiator' },
      { t: c.credit + 0.2, rule: 2, to: 'paperwork' },
    ];
    ev(c.dates, 'rule'); ev(c.floor, 'rule'); ev(c.credit, 'rule');
    for (const s of SH) ev(s.t + 0.7, 'shield');
  }

  function buildB() {
    const c = C;
    for (const n of NODES) if (!n.branch) IGN[n.id] = -10;
    for (const e of EDGES) if (e.kind !== 'branch' && !(e.a === 'yes2')) EDGE_T[e.a + e.b] = -10;
    // the plan stops at a person
    key(0, { ...WIDE, cx: 1090, cy: 840, s: 0.64, rx: 35, rz: -3 });
    key(c.person + 0.3, { cx: N.you.x + 250, cy: N.you.y - 10, s: 1.12, rx: 26, rz: -2 });
    key(c.approves + 1.6, { cx: N.you.x + 300, cy: N.you.y + 20, s: 0.98, rx: 28, rz: -2 });
    // the second yes, at the destruction
    key(c.destruction - 0.1, { cx: 2330, cy: 1150, s: 1.0, rx: 27, rz: -1 });
    key(c.second + 1.4, { cx: 2350, cy: 1120, s: 0.94, rx: 28, rz: -1 });
    // the trace: the whole graph high in the frame, its audit trail under it
    key(c.trace + 0.1, { ...WIDE, cx: 1400, cy: 990, s: 0.62, rx: 44, rz: -3, oy: -210 });
    key(c.end, { ...WIDE, cx: 1430, cy: 975, s: 0.64, rx: 43, rz: -2, oy: -210 });
    ev(0.1, 'whoosh');
    IGN.destroy = c.destruction + 0.15; IGN.yes2 = c.destruction + 0.45;
    EDGE_T['negotiatordestroy'] = c.destruction - 0.3; EDGE_T['destroyyes2'] = c.destruction + 0.2;
    ev(c.destruction - 0.3, 'edge'); ev(IGN.destroy, 'ignite', { node: 'destroy' }); ev(IGN.yes2, 'ignite', { node: 'yes2' });
    const ap1 = c.approves + 0.55, ap2 = c.second + 0.45;
    C.ap1 = ap1; C.ap2 = ap2;
    CLICKS.push({ t: ap1, btn: 'approve1' }); CLICKS.push({ t: ap2, btn: 'approve2' });
    ev(c.person + 0.35, 'card'); ev(ap1, 'click'); ev(ap1 + 0.05, 'gate');
    ev(c.destruction + 0.35, 'card'); ev(ap2, 'click'); ev(ap2 + 0.05, 'gate');
    EDGE_T['yes2paperwork'] = ap2 + 0.1;
    // the audit trail: every run and every yes, as they happened
    const rows = [
      ['06:00:04', 'Data', 'database', 'Stock export loaded · 2,000 packs', '4f2a91c0', 0],
      ['06:00:31', 'Watcher', 'eye', 'Batch flagged · 22 days to its date', '7be310a2', 0],
      ['06:12:10', 'Vision', 'scan-line', 'Label read · matches the stock', '19c4e7d5', 0],
      ['06:12:16', 'Router', 'route', 'Plan drafted · within the brand’s rules', '5d0b8ae1', 0],
      ['09:14:02', 'Supply chain lead', 'user-check', 'Approved the plan · ₹16,917 net', 'a83f62bb', 1],
      ['09:14:03', 'Outreach', 'send', 'Offer sent to 52 kiranas · in Hindi', 'c2e9104f', 0],
      ['17:52:30', 'Supply chain lead', 'user-check', 'Second yes · destruction approved', 'e07d55c9', 1],
      ['18:00:02', 'Paperwork', 'file-text', 'Credit note issued · signed and filed', '3b6a28f4', 0],
    ];
    rows.forEach((r, i) => {
      const t = r[5] ? (i === 4 ? c.yes - 0.1 : c.yes + 0.25) : c.run + 0.05 + i * 0.32;
      LOGS.push({ t, row: r }); ev(t, r[5] ? 'logyes' : 'log');
    });
    ev(c.trace + 0.2, 'panel'); ev(c.end2end, 'badge'); ev(c.auditor + 0.1, 'stamp');
  }

  // ------------------------------------------------------------------ the UI's own parts (screen space)
  const cards = {};
  function agentCard(id, small) {
    const a = AG[id], n = N[id];
    const rows = a.rows.map(([ic, l, v]) => `<div class="row">${IC(ic)}<span class="lbl">${l}</span><span>${v}</span></div>`).join('');
    return $(`<div class="card${small ? ' small' : ''}" style="${small ? 'width:390px;padding:18px 20px' : ''}">
      <div class="kick"><span class="dot"></span>${n.name} · the agent</div>
      <h3 style="${small ? 'font-size:25px;margin:10px 0 4px' : ''}">${a.p}</h3>
      ${small ? '' : rows}
      <div class="row rule">${IC('shield-check')}<span class="lbl">Rule</span><span>${a.rule}</span></div>
      ${small ? '' : `<span class="chipm">${IC(a.model === 'Gemini' ? 'sparkles' : 'list-checks')}${a.model === 'Gemini' ? 'Gemini, on Google Cloud' : 'The brand’s rules, no model'}</span>`}
    </div>`);
  }
  for (const id of ORDER) { cards[id] = agentCard(id, ['outreach', 'lister', 'negotiator'].includes(id)); ui.appendChild(cards[id]); }
  const yesCard = $(`<div class="card amber" style="width:560px">
    <div class="kick"><span class="dot"></span>Waiting for a yes</div>
    <h3>The plan for one batch</h3>
    <div class="row">${IC('store')}<span>1,372 packs to 52 kiranas</span></div>
    <div class="row">${IC('users')}<span>150 to the staff sale · 58 to the food bank</span></div>
    <div class="row">${IC('indian-rupee')}<span><b>₹16,917 net</b>, against −₹22,657 in the bin</span></div>
    <div class="btns"><div class="btn go" id="ap1">${IC('check')}Approve · release the agents</div><div class="btn ghost">Not now</div></div></div>`);
  const yes2Card = $(`<div class="card amber" style="width:560px">
    <div class="kick"><span class="dot"></span>The second yes</div>
    <h3>Destroyed at the godown</h3>
    <div class="row">${IC('camera')}<span>Two photos · Vision's four checks passed</span></div>
    <div class="row">${IC('signature')}<span>Certificate signed by the officer, two witnesses and the distributor</span></div>
    <div class="row">${IC('receipt')}<span>Then, and only then, the credit note</span></div>
    <div class="btns"><div class="btn go" id="ap2">${IC('check')}Approve · issue the papers</div><div class="btn ghost">Ask again</div></div></div>`);
  ui.appendChild(yesCard); ui.appendChild(yes2Card);
  const rulesPanel = $(`<div class="panel" style="left:70px;top:150px;width:560px">
    <div class="kick">${IC('shield')}The brand's own rules</div>
    <h2>The guardrails.</h2>
    <div class="rule" id="r0"><div class="ic">${IC('calendar')}</div><div><b>The dates each channel takes</b><span>Quick commerce 30+ days · the marketplace 21+</span></div></div>
    <div class="rule" id="r1"><div class="ic">${IC('lock')}</div><div><b>A floor price</b><span>₹13.50 a pack · nothing sells below it, no buyer sees it</span></div></div>
    <div class="rule" id="r2"><div class="ic">${IC('indian-rupee')}</div><div><b>A credit cap</b><span>Each distributor's credit stays within its limit</span></div></div></div>`);
  ui.appendChild(rulesPanel);
  const ruleEls = [0, 1, 2].map((i) => rulesPanel.querySelector('#r' + i));
  const shields = [0, 1, 2, 3, 4].map(() => { const s = $(`<div class="shield">${IC('shield-check')}</div>`); ui.appendChild(s); return s; });
  const badge1 = $(`<div class="badge"><div class="bi">${IC('cloud')}</div><b>Hosted on Google Cloud</b></div>`);
  const badge2 = $(`<div class="badge"><div class="bi">${IC('sparkles')}</div><b>The latest Gemini models</b></div>`);
  ui.appendChild(badge1); ui.appendChild(badge2);
  const title1 = $(`<div class="title" style="top:140px">A team that never sleeps.<small>The agents · inside every workspace</small></div>`);
  ui.appendChild(title1);
  const audit = $(`<div class="panel audit"><div class="kick">${IC('history')}The audit trail · every step, traced end to end</div><div id="logs" style="margin-top:16px"></div></div>`);
  ui.appendChild(audit);
  const logBox = audit.querySelector('#logs');
  const logEls = [];
  const traceBadge = $(`<div class="badge" style="border-color:rgba(115,201,157,0.45)"><div class="bi" style="background:rgba(52,211,128,0.14);color:#73c99d">${IC('activity')}</div><b>Every request traced</b><span>end to end</span></div>`);
  ui.appendChild(traceBadge);
  const seal = $(`<div class="seal"><div>${IC('badge-check')}READY<br>FOR AN<br>AUDITOR</div></div>`);
  ui.appendChild(seal);
  const cursor = $(`<svg class="cursor" viewBox="0 0 34 34"><path d="M5 3 L5 27 L11.5 21 L16 31 L20 29.3 L15.6 19.5 L24 19.5 Z" fill="#fff" stroke="#0b0f0d" stroke-width="2" stroke-linejoin="round"/></svg>`);
  const ripples = [0, 1].map(() => { const r = $(`<div class="ripple"></div>`); ui.appendChild(r); return r; });
  ui.appendChild(cursor);

  // ------------------------------------------------------------------ the field behind it
  const R = rng(211);
  const STARS = Array.from({ length: 340 }, () => ({ x: R() * 2600 - 300, y: R() * 1600 - 260, d: 0.25 + R() * 0.75, ph: R() * 6.28, r: 0.6 + R() * 1.6 }));
  const LINKS = [];
  for (let i = 0; i < STARS.length; i++) for (let j = i + 1; j < STARS.length; j++) {
    const a = STARS[i], b = STARS[j];
    if (Math.abs(a.d - b.d) < 0.12 && Math.hypot(a.x - b.x, a.y - b.y) < 150) LINKS.push([i, j]);
  }
  const RB = rng(2111);
  const BOKEH = Array.from({ length: 16 }, () => ({ x: RB() * 2400, y: RB() * 1400, r: 40 + RB() * 110, d: 0.6 + RB() * 0.8,
    vx: (RB() - 0.5) * 18, vy: -6 - RB() * 10, a: 0.05 + RB() * 0.07, c: RB() < 0.75 ? '120,230,180' : '247,200,110' }));
  function drawField(t, cam) {
    const g = bg.createRadialGradient(W * 0.5, H * 0.42, 60, W * 0.5, H * 0.5, 1150);
    g.addColorStop(0, '#0c1a14'); g.addColorStop(0.55, '#08110d'); g.addColorStop(1, '#040706');
    bg.fillStyle = g; bg.fillRect(0, 0, W, H);
    const px = (cam.cx - 1400) * 0.22, py = (cam.cy - 850) * 0.22, sc = 0.85 + cam.s * 0.25;
    const pos = STARS.map((s) => ({ x: W / 2 + (s.x - 1000 - px * s.d) * sc * (0.6 + s.d * 0.4), y: H / 2 + (s.y - 540 - py * s.d) * sc * (0.6 + s.d * 0.4), s }));
    bg.lineWidth = 1;
    for (const [i, j] of LINKS) {
      const a = pos[i], b = pos[j], al = 0.05 + 0.05 * a.s.d;
      bg.strokeStyle = `rgba(115,201,157,${al})`; bg.beginPath(); bg.moveTo(a.x, a.y); bg.lineTo(b.x, b.y); bg.stroke();
    }
    for (const p of pos) {
      const tw = 0.55 + 0.45 * Math.sin(t * (0.7 + p.s.d) + p.s.ph);
      bg.fillStyle = `rgba(190,240,215,${(0.12 + 0.4 * p.s.d) * tw})`;
      bg.beginPath(); bg.arc(p.x, p.y, p.s.r * (0.6 + p.s.d), 0, 6.283); bg.fill();
    }
  }

  // ------------------------------------------------------------------ the frame
  function edgeProgress(e, t) { const t0 = EDGE_T[e.a + e.b]; if (t0 == null) return 0; return eo((t - t0) / 0.7); }
  const focusNode = (t) => {
    if (SEG === 'A') { let f = null; for (const id of ORDER) if (t >= C[id] - 0.2) f = id; return t < C.rails - 0.2 ? f : null; }
    if (t >= C.person - 0.2 && t < C.destruction - 0.2) return 'you';
    if (t >= C.destruction - 0.2 && t < C.trace) return 'yes2';
    return null;
  };

  // the opening spark (segment A): from the Data agent to Impact along the handoffs, in the dark, before the team wakes
  const spark = (() => {
    const chain = ['data', 'watcher', 'vision', 'valuer', 'router', 'you', 'outreach', 'paperwork', 'impact'];
    const legs = [];
    for (let i = 0; i < chain.length - 1; i++) { const e = edge(chain[i], chain[i + 1]); if (e) legs.push(e); }
    const total = legs.reduce((m, e) => m + e.len, 0);
    const at_ = {}; let acc = 0;
    at_[chain[0]] = 0; legs.forEach((e) => { acc += e.len; at_[e.b] = acc / total; });
    const span = () => { const a = 0.5, b = Math.max(a + 2.4, Math.min((C.ten ?? 6) - 1.6, a + 4.2)); return [a, b]; };
    return {
      pos(t) {
        const [a, b] = span(); const p = sm((t - a) / (b - a));
        if (t < a || t > b + 0.6) return null;
        let d = p * total;
        for (const e of legs) { if (d <= e.len) return { ...bez(e, d / e.len), p }; d -= e.len; }
        return { ...bez(legs[legs.length - 1], 1), p: 1 };
      },
      passed(id, t) {
        const [a, b] = span(); const p = (t - a) / (b - a);
        const q = at_[id]; if (q == null) return 0;
        const dt = (p - q) * (b - a);
        return dt < 0 ? 0 : Math.exp(-dt / 1.4);
      },
    };
  })();

  window.renderAt = function (t) {
    const cam = camAt(t), M = camMatrix(cam), Rm = camRot(cam);
    world.style.transform = M.toString();
    drawField(t, cam);
    glow.clearRect(0, 0, W, H); fx.clearRect(0, 0, W, H);
    const scr = {};
    for (const n of NODES) { const p = project(M, n.x, n.y); const z = Rm.transformPoint(new DOMPoint(n.x, n.y, 0, 1)).z; scr[n.id] = { ...p, z }; }
    const fnode = focusNode(t);

    // the handoffs, their comets and the packets running along them
    for (const e of EDGES) {
      let p = edgeProgress(e, t);
      if (SEG === 'B' && e.a === 'you' && t < C.ap1) p = 1;
      const off = e.len * (1 - p);
      e.el.setAttribute('stroke-dashoffset', off); e.glowEl.setAttribute('stroke-dashoffset', off);
      let dim = 1;
      if (SEG === 'B' && e.a === 'you' && t < C.ap1) dim = 0.28;
      if (e.kind === 'branch' && p <= 0) dim = 0;
      e.el.setAttribute('stroke-opacity', (0.85 * dim).toFixed(3)); e.glowEl.setAttribute('stroke-opacity', (0.55 * dim).toFixed(3));
      const cp = (t - (EDGE_T[e.a + e.b] ?? 1e9)) / 0.7;
      if (cp > 0 && cp < 1.15) { const q = bez(e, Math.min(1, eo(cp))); e.comet.setAttribute('cx', q.x); e.comet.setAttribute('cy', q.y); e.comet.setAttribute('opacity', (1 - clamp((cp - 0.95) / 0.2)).toFixed(3)); }
      else e.comet.setAttribute('opacity', 0);
      const flowing = p >= 1 && dim >= 1;
      e.pk.forEach((d, i) => {
        if (!flowing) { d.setAttribute('opacity', 0); return; }
        let q = ((t * 0.55 + i / 4 + e.len * 0.0007) % 1);
        // at the gate: the packets heading for a person's yes queue up and wait
        if (SEG === 'B' && e.b === 'you' && t < C.ap1 + 0.2) q = Math.min(q, 0.86 - i * 0.05);
        if (SEG === 'B' && e.b === 'yes2' && t < C.ap2 + 0.2) q = Math.min(q, 0.86 - i * 0.05);
        const pt = bez(e, q); d.setAttribute('cx', pt.x); d.setAttribute('cy', pt.y); d.setAttribute('opacity', 0.9);
      });
    }
    // the guardrails
    const rp = SEG === 'A' ? eo((t - C.rails) / 1.6) : 1;
    for (const r of rails) { r.r.setAttribute('stroke-dashoffset', r.len * (1 - rp)); r.gl.setAttribute('stroke-dashoffset', r.len * (1 - rp)); r.r.setAttribute('stroke-opacity', 0.9); r.gl.setAttribute('stroke-opacity', 0.45); }

    // the chips: upright, sized by their depth, out of focus away from the camera's point, lit as their turn comes
    for (const n of NODES) {
      const s = scr[n.id], el = n.el, ig = IGN[n.id];
      const lit = ig != null ? clamp((t - ig) / 0.35) : 0;
      const pre = SEG === 'A' ? fade(t, 0.3 + (n.x / 2800) * 1.2, null, 0.7) : 1;
      const passed = SEG === 'A' ? spark.passed(n.id, t) : 0;   // the spark running the team's path lights each in turn
      const vis = n.branch ? (ig != null ? clamp((t - ig + 0.4) / 0.4) : 0) : Math.max(0.4 * pre + 0.45 * passed, lit);
      const k = (cam.s / s.w) * 0.9;
      const blur = Math.min(6, Math.abs(s.z) * 0.006 * (cam.s > 0.9 ? 1.6 : 1));
      const active = fnode === n.id;
      const pulse = active ? 1 + 0.03 * Math.sin(t * 6) : 1;
      el.style.opacity = vis.toFixed(3);
      el.style.transform = `translate(${(s.x - el.offsetWidth / 2).toFixed(1)}px, ${(s.y - el.offsetHeight / 2).toFixed(1)}px) scale(${(k * pulse).toFixed(4)})`;
      el.style.filter = blur > 0.25 ? `blur(${blur.toFixed(2)}px)` : 'none';
      const hum = n.human;
      el.style.borderColor = hum ? `rgba(247,192,74,${0.25 + 0.6 * lit})` : `rgba(115,201,157,${0.18 + 0.55 * lit})`;
      n.nm.style.color = lit > 0.5 ? '#ecf3ef' : '#7a8c82';
      n.ring.style.opacity = active ? (0.75 + 0.25 * Math.sin(t * 5)).toFixed(3) : (lit * 0.0).toFixed(3);
      n.halo.style.opacity = active ? 1 : (0.35 * lit * (hum ? 1 : 0.6)).toFixed(3);
      if (n.gem) n.gem.style.opacity = SEG === 'A' ? clamp((t - C.gemini - ORDER.indexOf(n.id) * 0.06) / 0.25).toFixed(3) : 1;
      if (n.gem) n.gem.style.transform = `scale(${SEG === 'A' ? (0.6 + 0.4 * spring(t - C.gemini - ORDER.indexOf(n.id) * 0.06)).toFixed(3) : 1})`;
      // the human gates' locks: shut until the click
      let lk = 0;
      if (n.id === 'you') lk = SEG === 'A' ? clamp((t - C.outreach + 1.2) / 0.3) : 1 - clamp((t - C.ap1) / 0.25);
      if (n.id === 'yes2' && SEG === 'B') lk = clamp((t - IGN.yes2) / 0.3) * (1 - clamp((t - C.ap2) / 0.25));
      n.lock.style.opacity = lk.toFixed(3);
      // a flash and sparks as it lights
      if (ig != null && t >= ig && t < ig + 0.9) {
        const q = (t - ig) / 0.9, rad = 30 + 220 * eo(q) * k;
        fx.strokeStyle = hum ? `rgba(247,192,74,${0.55 * (1 - q)})` : `rgba(126,240,180,${0.55 * (1 - q)})`; fx.lineWidth = 3;
        fx.beginPath(); fx.arc(s.x, s.y, rad, 0, 6.283); fx.stroke();
        const r = rng(Math.round(ig * 1000));
        for (let i = 0; i < 16; i++) { const a = r() * 6.283, v = (90 + 160 * r()) * k, d = v * eo(q); fx.fillStyle = hum ? `rgba(255,214,130,${0.9 * (1 - q)})` : `rgba(190,255,220,${0.9 * (1 - q)})`; fx.beginPath(); fx.arc(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d - 10 * q, 2.2, 0, 6.283); fx.fill(); }
      }
      // light: a pool under the agent at work, amber at a gate
      if (active || (lit > 0 && hum && SEG === 'B')) {
        const gr = glow.createRadialGradient(s.x, s.y, 10, s.x, s.y, 420 * k + 120);
        const col = hum ? '247,192,74' : '52,211,128';
        gr.addColorStop(0, `rgba(${col},${active ? 0.26 : 0.12})`); gr.addColorStop(1, `rgba(${col},0)`);
        glow.fillStyle = gr; glow.fillRect(0, 0, W, H);
      }
    }
    // bokeh: large soft lights out of focus in front of the graph, drifting against the camera's move
    for (const b of BOKEH) {
      const x = ((b.x - (cam.cx - 1400) * 0.9 * b.d + t * b.vx) % 2400 + 2400) % 2400 - 240;
      const y = ((b.y - (cam.cy - 850) * 0.9 * b.d + t * b.vy) % 1400 + 1400) % 1400 - 160;
      const gr = glow.createRadialGradient(x, y, 0, x, y, b.r);
      gr.addColorStop(0, `rgba(${b.c},${b.a})`); gr.addColorStop(0.6, `rgba(${b.c},${b.a * 0.45})`); gr.addColorStop(1, `rgba(${b.c},0)`);
      glow.fillStyle = gr; glow.beginPath(); glow.arc(x, y, b.r, 0, 6.283); glow.fill();
    }
    // a slow light sweep across the plane
    const sw = ((t * 0.11) % 1.6) - 0.3;
    const lg = glow.createLinearGradient(W * (sw - 0.25), 0, W * (sw + 0.1), H);
    lg.addColorStop(0, 'rgba(120,255,200,0)'); lg.addColorStop(0.5, 'rgba(120,255,200,0.05)'); lg.addColorStop(1, 'rgba(120,255,200,0)');
    glow.fillStyle = lg; glow.fillRect(0, 0, W, H);

    if (SEG === 'A') {
      for (let k = 14; k >= 0; k--) {
        const q = spark.pos(t - k * 0.035);
        if (!q) continue;
        const p = project(M, q.x, q.y), a = (1 - k / 15) * (t - k * 0.035 > 0 ? 1 : 0);
        const r = (k === 0 ? 7 : 4.5 - k * 0.22) * (cam.s / 0.6);
        fx.fillStyle = `rgba(${k === 0 ? '230,255,240' : '126,240,180'},${(0.9 * a).toFixed(3)})`;
        fx.beginPath(); fx.arc(p.x, p.y, Math.max(1, r), 0, 6.283); fx.fill();
        if (k === 0) {
          const g = fx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 90);
          g.addColorStop(0, 'rgba(150,255,200,0.55)'); g.addColorStop(1, 'rgba(150,255,200,0)');
          fx.fillStyle = g; fx.fillRect(p.x - 90, p.y - 90, 180, 180);
        }
      }
    }
    if (SEG === 'A') renderUIA(t, scr, cam); else renderUIB(t, scr, cam);
    renderCursor(t, scr);
    return { t };
  };

  function placeCard(el, s, t0, t1, t, side = 1, dx = 150, dy = -60) {
    const a = fade(t, t0, t1, 0.18, 0.2);
    el.style.opacity = a.toFixed(3);
    if (a <= 0) return;
    const e = spring(t - t0, 0.62, 15);
    const w = el.offsetWidth, h = el.offsetHeight;
    let x = side > 0 ? s.x + dx : s.x - dx - w, y = s.y + dy - h / 2;
    x = clamp(x, 40, W - w - 40); y = clamp(y, 60, H - h - 50);
    el.style.transform = `translate(${x.toFixed(1)}px, ${(y + 18 * (1 - e)).toFixed(1)}px) scale(${(0.9 + 0.1 * e).toFixed(4)})`;
    // a thin line from the agent to its card
    fx.strokeStyle = `rgba(126,240,180,${0.5 * a})`; fx.lineWidth = 2; fx.setLineDash([5, 6]);
    fx.beginPath(); fx.moveTo(s.x + (side > 0 ? 70 : -70), s.y); fx.lineTo(side > 0 ? x : x + w, y + h / 2); fx.stroke(); fx.setLineDash([]);
  }

  function renderUIA(t, scr, cam) {
    // the opening words, and Google's platform
    const tl = (C.line ?? C.team - 2.2) + 0.15;
    title1.style.opacity = fade(t, tl, C.ten - 0.1, 0.6, 0.45).toFixed(3);
    title1.style.transform = `translateY(${(16 * (1 - eo((t - tl) / 0.9))).toFixed(1)}px) scale(${(1 + 0.025 * clamp((t - tl) / 5)).toFixed(4)})`;
    title1.style.filter = `blur(${(6 * (1 - clamp((t - tl) / 0.5))).toFixed(2)}px)`;
    const b1 = fade(t, C.cloud, C.job + 0.2, 0.3, 0.4), b2 = fade(t, C.gemini, C.job + 0.2, 0.3, 0.4);
    badge1.style.opacity = b1; badge2.style.opacity = b2;
    badge1.style.transform = `translate(${W / 2 - 470}px, ${110 + 16 * (1 - spring(t - C.cloud))}px)`;
    badge2.style.transform = `translate(${W / 2 + 20}px, ${110 + 16 * (1 - spring(t - C.gemini))}px)`;
    // each agent's card
    for (const c of CARDS) {
      const el = cards[c.id], s = scr[c.id];
      if (c.small) {
        const a = fade(t, c.t0, c.t1, 0.18, 0.25); el.style.opacity = a.toFixed(3);
        if (a > 0) {
          const e = spring(t - c.t0, 0.62, 15), w = el.offsetWidth, h = el.offsetHeight;
          const x = W - w - 70, y = 150 + c.slot * (h + 18);
          el.style.transform = `translate(${(x + 40 * (1 - e)).toFixed(1)}px, ${y.toFixed(1)}px)`;
          fx.strokeStyle = `rgba(126,240,180,${0.45 * a})`; fx.lineWidth = 2; fx.setLineDash([5, 6]);
          fx.beginPath(); fx.moveTo(s.x + 60, s.y); fx.lineTo(x, y + h / 2); fx.stroke(); fx.setLineDash([]);
        }
      } else placeCard(el, s, c.t0, c.t1, t);
    }
    // the rules, and their shields flying onto the graph
    rulesPanel.style.opacity = fade(t, C.rules, null, 0.35).toFixed(3);
    rulesPanel.style.transform = `translateX(${(-60 * (1 - spring(t - C.rules, 0.7, 12))).toFixed(1)}px)`;
    [C.dates, C.floor, C.credit].forEach((tt, i) => {
      const a = clamp((t - tt) / 0.3); ruleEls[i].style.opacity = a.toFixed(3);
      ruleEls[i].style.transform = `translateX(${(24 * (1 - spring(t - tt, 0.7, 13))).toFixed(1)}px)`;
    });
    SH.forEach((sh, i) => renderShield(shields[i], sh, t, scr));
  }

  function renderShield(el, sh, t, scr) {
    const q = (t - sh.t) / 0.7;
    if (q < 0) { el.style.opacity = 0; return; }
    const from = ruleEls[sh.rule].querySelector('.ic').getBoundingClientRect();
    const to = scr[sh.to];
    const fx0 = from.left + from.width / 2, fy0 = from.top + from.height / 2;
    const tx = to.x - 70, ty = to.y - 46;
    const e = eo(clamp(q));
    const x = lerp(fx0, tx, e), y = lerp(fy0, ty, e) - Math.sin(Math.PI * clamp(q)) * 140;
    el.style.opacity = '1';
    const land = q >= 1 ? spring(t - sh.t - 0.7, 0.45, 18) : 0;
    el.style.transform = `translate(${(x - 23).toFixed(1)}px, ${(y - 23).toFixed(1)}px) scale(${(q < 1 ? 0.8 + 0.2 * e : 1 + 0.25 * (1 - land)).toFixed(3)})`;
    if (q >= 1 && q < 2.2) { const r = (q - 1) / 1.2; fx.strokeStyle = `rgba(247,192,74,${0.6 * (1 - r)})`; fx.lineWidth = 3; fx.beginPath(); fx.arc(tx, ty, 26 + 70 * eo(r), 0, 6.283); fx.stroke(); }
  }

  function renderUIB(t, scr, cam) {
    // the shields stay where the rules put them
    const keep = [['watcher', 0], ['lister', 0], ['valuer', 1], ['negotiator', 1], ['paperwork', 2]];
    keep.forEach(([to], i) => {
      const s = scr[to], a = SEG === 'B' ? (1 - clamp((t - C.trace) / 0.4) * 0.5) : 1;
      shields[i].style.opacity = a.toFixed(3);
      shields[i].style.transform = `translate(${(s.x - 70 - 23).toFixed(1)}px, ${(s.y - 46 - 23).toFixed(1)}px) scale(${(cam.s / s.w * 0.95).toFixed(3)})`;
    });
    // the first yes
    placeCard(yesCard, scr.you, C.person + 0.35, C.destruction - 0.25, t, 1, 150, 20);
    const b1 = yesCard.querySelector('#ap1');
    const pressed1 = t >= C.ap1;
    b1.className = pressed1 ? 'btn done' : 'btn go';
    b1.innerHTML = pressed1 ? `${IC('check-check')}Approved · agents released` : `${IC('check')}Approve · release the agents`;
    b1.style.transform = `scale(${(t >= C.ap1 - 0.06 && t < C.ap1 + 0.12) ? 0.95 : 1})`;
    // the second yes
    placeCard(yes2Card, scr.yes2, C.destruction + 0.35, C.trace - 0.1, t, -1, 120, -20);
    const b2 = yes2Card.querySelector('#ap2');
    const pressed2 = t >= C.ap2;
    b2.className = pressed2 ? 'btn done' : 'btn go';
    b2.innerHTML = pressed2 ? `${IC('check-check')}Approved · the papers follow` : `${IC('check')}Approve · issue the papers`;
    b2.style.transform = `scale(${(t >= C.ap2 - 0.06 && t < C.ap2 + 0.12) ? 0.95 : 1})`;
    // the gates opening: an amber shockwave and a streak of light
    for (const [tt, id] of [[C.ap1, 'you'], [C.ap2, 'yes2']]) {
      const q = (t - tt) / 1.1;
      if (q > 0 && q < 1) {
        const s = scr[id];
        for (let i = 0; i < 2; i++) { const r = eo(q - i * 0.12); fx.strokeStyle = `rgba(247,192,74,${0.7 * (1 - q)})`; fx.lineWidth = 4 - i * 1.5; fx.beginPath(); fx.arc(s.x, s.y, 40 + 520 * r, 0, 6.283); fx.stroke(); }
        const g = fx.createLinearGradient(s.x - 700, s.y, s.x + 700, s.y);
        g.addColorStop(0, 'rgba(255,214,140,0)'); g.addColorStop(0.5, `rgba(255,224,170,${0.55 * (1 - q)})`); g.addColorStop(1, 'rgba(255,214,140,0)');
        fx.fillStyle = g; fx.fillRect(s.x - 700, s.y - 3, 1400, 6);
        const gr = glow.createRadialGradient(s.x, s.y, 0, s.x, s.y, 520);
        gr.addColorStop(0, `rgba(247,192,74,${0.4 * (1 - q)})`); gr.addColorStop(1, 'rgba(247,192,74,0)'); glow.fillStyle = gr; glow.fillRect(0, 0, W, H);
      }
    }
    // the audit trail: the panel rises, the trace runs down to it from every agent, each step lands as a row
    const ap = fade(t, C.trace + 0.2, null, 0.45);
    audit.style.opacity = ap.toFixed(3);
    audit.style.transform = `translateY(${(60 * (1 - spring(t - C.trace - 0.2, 0.7, 11))).toFixed(1)}px)`;
    LOGS.forEach((l, i) => {
      if (!logEls[i]) {
        const r = l.row;
        const el = $(`<div class="log${r[5] ? ' person' : ''}"><span class="tm">${r[0]}</span><span class="who">${IC(r[2])}${r[1]}</span><span>${r[3]}</span><span class="tr">trace ${r[4]}</span></div>`);
        logBox.appendChild(el); logEls[i] = el;
      }
      const a = clamp((t - l.t) / 0.25);
      logEls[i].style.opacity = a.toFixed(3);
      logEls[i].style.transform = `translateX(${(-20 * (1 - eo((t - l.t) / 0.4))).toFixed(1)}px)`;
      logEls[i].style.background = (l.row[5] && t >= l.t) ? `rgba(247,192,74,${0.10 * (1 - clamp((t - l.t - 1.2) / 1.0)) + 0.04})` : 'transparent';
    });
    // the trace: a thread from each agent down into the trail as its row lands
    if (ap > 0) {
      const pr = audit.getBoundingClientRect();
      for (const l of LOGS) {
        const who = { Data: 'data', Watcher: 'watcher', Vision: 'vision', Router: 'router', 'Supply chain lead': 'you', Outreach: 'outreach', Paperwork: 'paperwork' }[l.row[1]];
        const s = scr[who]; if (!s) continue;
        const q = (t - l.t + 0.45) / 0.45;
        if (q <= 0) continue;
        const a = 0.5 * (1 - clamp((t - l.t - 1.2) / 0.8));
        if (a <= 0) continue;
        const ex = clamp(s.x, pr.left + 40, pr.right - 40), ey = pr.top;
        fx.strokeStyle = l.row[5] ? `rgba(247,192,74,${a})` : `rgba(126,240,180,${a})`; fx.lineWidth = 2;
        fx.beginPath(); fx.moveTo(s.x, s.y + 20);
        const e = eo(clamp(q)); fx.lineTo(lerp(s.x, ex, e), lerp(s.y + 20, ey, e)); fx.stroke();
        fx.fillStyle = l.row[5] ? `rgba(255,214,140,${2 * a})` : `rgba(190,255,220,${2 * a})`;
        fx.beginPath(); fx.arc(lerp(s.x, ex, e), lerp(s.y + 20, ey, e), 4, 0, 6.283); fx.fill();
      }
    }
    traceBadge.style.opacity = fade(t, C.end2end, null, 0.3).toFixed(3);
    traceBadge.style.transform = `translate(${W / 2 - 230}px, ${(70 + 14 * (1 - spring(t - C.end2end))).toFixed(1)}px)`;
    const sq = t - C.auditor - 0.1;
    seal.style.opacity = sq > 0 ? clamp(sq / 0.12).toFixed(3) : 0;
    seal.style.transform = `rotate(-8deg) scale(${sq > 0 ? (1 + 0.6 * (1 - spring(sq, 0.42, 16))).toFixed(3) : 1.6})`;
  }

  // the pointer: it travels to each click, presses, and a ripple spreads
  function renderCursor(t, scr) {
    const targets = CLICKS.map((c) => {
      let x, y;
      if (c.node) { const s = scr[c.node]; x = s.x + 12; y = s.y + 8; }
      else { const b = (c.btn === 'approve1' ? yesCard.querySelector('#ap1') : yes2Card.querySelector('#ap2')).getBoundingClientRect(); x = b.left + b.width * 0.42; y = b.top + b.height * 0.55; }
      return { t: c.t, x, y };
    });
    if (!targets.length) { cursor.style.opacity = 0; return; }
    let i = targets.findIndex((p) => p.t > t);
    let x, y;
    if (i === -1) { const p = targets[targets.length - 1]; x = p.x; y = p.y; i = targets.length; }
    else if (i === 0) { const p = targets[0]; const q = sm((t - (p.t - 0.9)) / 0.75); x = lerp(W * 0.62, p.x, q); y = lerp(H * 0.9, p.y, q); }
    else { const a = targets[i - 1], b = targets[i]; const q = sm((t - Math.max(a.t + 0.15, b.t - 0.75)) / Math.min(0.6, b.t - a.t - 0.15)); x = lerp(a.x, b.x, q); y = lerp(a.y, b.y, q); }
    const first = targets[0].t - 0.9, last = targets[targets.length - 1].t + 1.0;
    cursor.style.opacity = fade(t, first, last, 0.3, 0.4).toFixed(3);
    const near = targets.find((p) => t >= p.t - 0.05 && t < p.t + 0.12);
    cursor.style.transform = `translate(${(x - 4).toFixed(1)}px, ${(y - 2).toFixed(1)}px) scale(${near ? 0.86 : 1})`;
    // the ripples of the last two clicks
    const recent = targets.filter((p) => t >= p.t && t < p.t + 0.7).slice(-2);
    ripples.forEach((r, k) => {
      const p = recent[k]; if (!p) { r.style.opacity = 0; return; }
      const q = (t - p.t) / 0.7, d = 20 + 90 * eo(q);
      r.style.opacity = (0.9 * (1 - q)).toFixed(3); r.style.width = r.style.height = d + 'px';
      r.style.transform = `translate(${(p.x - d / 2).toFixed(1)}px, ${(p.y - d / 2).toFixed(1)}px)`;
    });
  }

  window.setCues = (c) => { C = { ...c }; SEG = c.seg || 'A'; build(); return { events: EVENTS }; };
  window.getEvents = () => EVENTS;
  document.fonts.ready.then(() => { window.pageReady = true; });
})();
