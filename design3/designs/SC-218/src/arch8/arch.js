// SC-218 (cut 8): under the hood. The platform as it is built on Google Cloud, drawn as a plane in depth that a camera
// travels down while the narration names each part: the four apps on Firebase, backend-api on Cloud Run and Cloud SQL,
// Pub/Sub and Cloud Scheduler, the ten agents on Cloud Run with Google's ADK, BigQuery and Cloud Storage, and Gemini on
// Vertex AI with each agent's tier; then one model call, bounded, up to the person's yes. Requests and events run as
// packets along the lines. Nothing runs on its own clock: renderAt(t) draws scene time t, so capture-page.mjs takes it
// frame by frame, and setCues(cues) returns the scene's sounds ({events}) for the mix.
(function () {
  const W = 1920, H = 1080, D = 1500, SREF = 0.5;
  const IC = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[n] || ''}</svg>`;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const sm = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
  const eo = (x) => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
  // Remotion's out-expo curve, Easing.bezier(0.16, 1, 0.3, 1), solved for x
  function bez(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t, dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => { x = clamp(x); let t = x; for (let i = 0; i < 8; i++) { const d = X(t) - x; if (Math.abs(d) < 1e-6) break; t -= d / (dX(t) || 1e-6); t = clamp(t); } return Y(t); };
  }
  const ex = bez(0.16, 1, 0.3, 1);
  const spring = (x, zeta = 0.62, w = 15) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); };
  const lerp = (a, b, t) => a + (b - a) * t;
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstChild; };

  // ------------------------------------------------------------------ the plane: every part where it sits
  const FRAME = { x0: 40, y0: 40, x1: 3140, y1: 2090 };
  const NODES = {
    fb: { x: 300, y: 190, icon: 'flame', b: 'Firebase', s: 'Hosting · Authentication', cls: 'fire' },
    a1: { x: 940, y: 190, icon: 'globe', b: 'Landing page', s: 'smartclearance.web.app' },
    a2: { x: 1560, y: 190, icon: 'layout-dashboard', b: 'Console', s: 'staff set brands up' },
    a3: { x: 2180, y: 190, icon: 'smartphone', b: 'Workspace', s: 'a PWA, one per brand' },
    a4: { x: 2800, y: 190, icon: 'play', b: 'Guided demo', s: 'no sign-in needed' },
    sec: { x: 560, y: 560, icon: 'key', b: 'Secret Manager', s: 'every secret, only there', cls: 'gcp' },
    api: { x: 1560, y: 560, icon: 'server', b: 'backend-api', s: 'FastAPI on Cloud Run · every figure', cls: 'gcp big' },
    sql: { x: 2560, y: 560, icon: 'database', b: 'Cloud SQL', s: 'PostgreSQL 18 · the system of record', cls: 'gcp' },
    sched: { x: 360, y: 920, icon: 'clock', b: 'Cloud Scheduler', s: 'a tick every minute', cls: 'gcp' },
    pub: { x: 1060, y: 920, icon: 'radio', b: 'Pub/Sub', s: 'every step, an event', cls: 'gcp' },
    agents: { x: 250, y: 1270, icon: 'bot', b: 'Agents', s: 'Cloud Run · Google ADK', cls: 'gcp' },
    bq: { x: 620, y: 1660, icon: 'chart-column', b: 'BigQuery', s: 'sell-through · the impact ledger', cls: 'gcp' },
    gcs: { x: 1300, y: 1660, icon: 'hard-drive', b: 'Cloud Storage', s: 'photos · signed PDFs', cls: 'gcp' },
    gem: { x: 2300, y: 1660, icon: 'sparkles', b: 'Gemini on Vertex AI', s: 'the global endpoint', cls: 'gem big' },
    build: { x: 560, y: 1990, icon: 'git-branch', b: 'Cloud Build', s: 'every merge, deployed keyless', cls: 'gcp' },
    reg: { x: 1260, y: 1990, icon: 'box', b: 'Artifact Registry', s: 'the API and agent images', cls: 'gcp' },
    mon: { x: 1960, y: 1990, icon: 'bell', b: 'Cloud Monitoring', s: 'uptime, alerts, the budget', cls: 'gcp' },
    obs: { x: 2680, y: 1990, icon: 'activity', b: 'Cloud Trace · Logging', s: 'every request, end to end', cls: 'gcp' },
  };
  const AGENTS = [
    { id: 'data', name: 'Data', icon: 'database', tier: 'flash' },
    { id: 'watcher', name: 'Watcher', icon: 'eye', tier: 'rules' },
    { id: 'vision', name: 'Vision', icon: 'scan-line', tier: 'flash' },
    { id: 'valuer', name: 'Valuer', icon: 'scale', tier: 'pro' },
    { id: 'router', name: 'Router', icon: 'route', tier: 'pro' },
    { id: 'outreach', name: 'Outreach', icon: 'send', tier: 'flash' },
    { id: 'lister', name: 'Lister', icon: 'store', tier: 'flash' },
    { id: 'negotiator', name: 'Negotiator', icon: 'gavel', tier: 'pro' },
    { id: 'paperwork', name: 'Paperwork', icon: 'file-text', tier: 'flash' },
    { id: 'impact', name: 'Impact', icon: 'leaf', tier: 'flash' },
  ];
  AGENTS.forEach((a, i) => { a.x = 700 + i * 262; a.y = 1270; });
  const AG = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
  const BUS = { x0: 1330, x1: 3020, y: 920 };
  const PILLS = {
    pro: { x: 2060, y: 1800, html: `${IC('sparkles')} Gemini 3.1 Pro`, cls: 'pro' },
    flash: { x: 2560, y: 1800, html: `${IC('zap')} Gemini 3.8 Flash`, cls: 'flash' },
  };

  // ------------------------------------------------------------------ the page's layers
  const world = document.getElementById('world'), chipsEl = document.getElementById('chips'), ui = document.getElementById('ui');
  const bg = document.getElementById('bg').getContext('2d'), glow = document.getElementById('glow').getContext('2d');
  const dimEl = document.getElementById('dim');
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('width', 3200); svg.setAttribute('height', 2200);
  svg.innerHTML = `<defs>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
    <radialGradient id="pk"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#9ff5c8"/><stop offset="1" stop-color="#34d380" stop-opacity="0"/></radialGradient>
    <radialGradient id="pkB"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#bcd6ff"/><stop offset="1" stop-color="#8ab4f8" stop-opacity="0"/></radialGradient>
    <radialGradient id="pkV"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#e2c6ff"/><stop offset="1" stop-color="#c58af9" stop-opacity="0"/></radialGradient>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="rgba(115,201,157,0.07)" stroke-width="1.5"/></pattern>
  </defs>
  <rect x="-900" y="-700" width="5000" height="3400" fill="url(#grid)"/>
  <g id="frame"></g><g id="eglow" filter="url(#soft)"></g><g id="edges"></g><g id="bus"></g><g id="packets"></g>`;
  world.appendChild(svg);
  const gFrame = svg.querySelector('#frame'), gGlow = svg.querySelector('#eglow'), gEdges = svg.querySelector('#edges'), gBus = svg.querySelector('#bus'), gPk = svg.querySelector('#packets');
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };

  // the Google Cloud boundary, drawn on from its top-left corner
  const fr = FRAME, rr = 46;
  const frameD = `M${fr.x0 + rr} ${fr.y0} H${fr.x1 - rr} Q${fr.x1} ${fr.y0} ${fr.x1} ${fr.y0 + rr} V${fr.y1 - rr} Q${fr.x1} ${fr.y1} ${fr.x1 - rr} ${fr.y1} H${fr.x0 + rr} Q${fr.x0} ${fr.y1} ${fr.x0} ${fr.y1 - rr} V${fr.y0 + rr} Q${fr.x0} ${fr.y0} ${fr.x0 + rr} ${fr.y0}`;
  const frameGlow = mk('path', { d: frameD, fill: 'none', stroke: '#8ab4f8', 'stroke-width': 12, filter: 'url(#soft)', opacity: 0.5 }, gFrame);
  const frameLine = mk('path', { d: frameD, fill: 'rgba(138,180,248,0.025)', stroke: '#a9c8ff', 'stroke-width': 3 }, gFrame);
  const frameLen = 2 * (fr.x1 - fr.x0 + fr.y1 - fr.y0);
  [frameGlow, frameLine].forEach((p) => p.setAttribute('stroke-dasharray', frameLen));
  const frameLabel = $(`<div class="frame-label">${IC('cloud')}Google Cloud · asia-south1</div>`); chipsEl.appendChild(frameLabel);

  // the lines between the parts (quadratic, bent a little), each drawn on, with packets running along them
  const COL = { g: '#34d380', b: '#8ab4f8', v: '#c58af9', a: '#f7c04a' };
  const EDGES = {};
  function edge(id, A, B, col = 'g', bend = 0.12, dash = false) {
    const dx = B.x - A.x, dy = B.y - A.y;
    const c = { x: (A.x + B.x) / 2 - dy * bend, y: (A.y + B.y) / 2 + dx * bend };
    const d = `M${A.x} ${A.y} Q${c.x} ${c.y} ${B.x} ${B.y}`;
    const gh = mk('path', { d, fill: 'none', stroke: COL[col], 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-dasharray': '3 9', opacity: 0 }, gEdges);
    const g1 = mk('path', { d, fill: 'none', stroke: COL[col], 'stroke-width': 14, 'stroke-linecap': 'round', opacity: 0.55 }, gGlow);
    const p = mk('path', { d, fill: 'none', stroke: COL[col], 'stroke-width': 4, 'stroke-linecap': 'round' }, gEdges);
    const len = p.getTotalLength();
    if (dash) { p.setAttribute('stroke-dasharray', '14 12'); g1.setAttribute('stroke-dasharray', '14 12'); }
    else { p.setAttribute('stroke-dasharray', len); g1.setAttribute('stroke-dasharray', len); }
    EDGES[id] = { id, A, B, c, d, p, g1, gh, len, col, dash, t0: 1e9, t1: 1e9, pk: [] };
    return EDGES[id];
  }
  const at = (p, e) => { const q = 1 - p; return { x: q * q * e.A.x + 2 * q * p * e.c.x + p * p * e.B.x, y: q * q * e.A.y + 2 * q * p * e.c.y + p * p * e.B.y }; };
  const N = NODES;
  const top = (n, dy = 44) => ({ x: n.x, y: n.y + dy });
  edge('req', top(N.a3, 50), { x: N.api.x + 60, y: N.api.y - 50 }, 'g', -0.12);
  edge('live', { x: N.api.x + 150, y: N.api.y - 50 }, top(N.a3, 52), 'b', -0.10, true);
  edge('sql', { x: N.api.x + 200, y: N.api.y }, { x: N.sql.x - 190, y: N.sql.y }, 'g', 0.0);
  edge('sec', { x: N.sec.x + 175, y: N.sec.y }, { x: N.api.x - 230, y: N.api.y }, 'g', 0.0);
  edge('auth', { x: N.fb.x, y: N.fb.y + 50 }, { x: N.api.x - 220, y: N.api.y - 40 }, 'a', 0.10, true);
  edge('pub', { x: N.api.x - 120, y: N.api.y + 52 }, { x: N.pub.x + 40, y: N.pub.y - 50 }, 'g', 0.08);
  edge('tick', { x: N.sched.x + 60, y: N.sched.y - 50 }, { x: N.api.x - 210, y: N.api.y + 40 }, 'b', -0.12, true);
  const busD = `M${BUS.x0 - 150} ${BUS.y} H${BUS.x1}`;
  const busGlow = mk('path', { d: busD, fill: 'none', stroke: '#34d380', 'stroke-width': 30, 'stroke-linecap': 'round', filter: 'url(#soft)', opacity: 0.45 }, gBus);
  const busLine = mk('path', { d: busD, fill: 'none', stroke: '#34d380', 'stroke-width': 8, 'stroke-linecap': 'round' }, gBus);
  const busGhost = mk('path', { d: busD, fill: 'none', stroke: '#34d380', 'stroke-width': 3, 'stroke-dasharray': '4 10', opacity: 0 }, gBus);
  const busLen = BUS.x1 - BUS.x0 + 150;
  [busGlow, busLine].forEach((p) => p.setAttribute('stroke-dasharray', busLen));
  AGENTS.forEach((a) => edge('drop-' + a.id, { x: a.x, y: BUS.y + 10 }, { x: a.x, y: a.y - 70 }, 'g', 0.0));
  edge('report', { x: AG.router.x + 40, y: AG.router.y - 70 }, { x: N.api.x + 120, y: N.api.y + 52 }, 'b', -0.18, true);
  edge('bq-watcher', { x: N.bq.x + 40, y: N.bq.y - 46 }, { x: AG.watcher.x, y: AG.watcher.y + 62 }, 'b', 0.08);
  edge('bq-valuer', { x: N.bq.x + 120, y: N.bq.y - 46 }, { x: AG.valuer.x, y: AG.valuer.y + 62 }, 'b', 0.10);
  edge('gcs-vision', { x: N.gcs.x - 40, y: N.gcs.y - 46 }, { x: AG.vision.x, y: AG.vision.y + 62 }, 'b', 0.06);
  for (const a of AGENTS) {
    if (a.tier === 'rules') continue;
    // each agent's tier, from the top of Gemini's card (Pro on its left half, Flash on its right)
    const ox = a.tier === 'pro' ? -120 : 120;
    edge('gem-' + a.id, { x: N.gem.x + ox, y: N.gem.y - 58 }, { x: a.x, y: a.y + 66 }, a.tier === 'pro' ? 'v' : 'b', (a.x < N.gem.x ? -1 : 1) * 0.06);
  }

  // the parts themselves: upright cards over the plane
  for (const k in NODES) {
    const n = NODES[k];
    n.el = $(`<div class="node ${n.cls || ''}"><div class="halo"></div><div class="tile">${IC(n.icon)}</div><div><b>${n.b}</b><span>${n.s}</span></div></div>`);
    chipsEl.appendChild(n.el); n.halo = n.el.querySelector('.halo'); n.t0 = 1e9;
  }
  for (const a of AGENTS) {
    const tierHtml = a.tier === 'pro' ? `${IC('sparkles')}3.1 Pro` : a.tier === 'flash' ? `${IC('zap')}3.8 Flash` : `${IC('list-checks')}rules`;
    a.el = $(`<div class="agent ${a.tier}"><div class="glow"></div><div class="tier ${a.tier}">${tierHtml}</div><div class="tile">${IC(a.icon)}</div><b>${a.name}</b></div>`);
    chipsEl.appendChild(a.el); a.tierEl = a.el.querySelector('.tier'); a.glowEl = a.el.querySelector('.glow'); a.t0 = 1e9; a.tt = 1e9; a.pulses = [];
  }
  for (const k in PILLS) { const p = PILLS[k]; p.el = $(`<div class="agent ${p.cls}" style="width:auto"><div class="tier ${p.cls}" style="position:static;transform:none;font-size:22px;padding:11px 16px">${p.html}</div></div>`); chipsEl.appendChild(p.el); p.t0 = 1e9; }
  const TOPICS = ['batch.at_risk', 'journey.step', 'offer.received', 'deal.closed', 'notify'].map((name) => {
    const el = $(`<div class="topic">${name}</div>`); chipsEl.appendChild(el); return { name, el, t0: 1e9 };
  });
  const LABELS = {
    live: { el: $(`<div class="pill" style="border-color:rgba(138,180,248,0.5);color:#c9dcff">SSE · FCM pushes, to every screen</div>`), e: 'live', p: 0.5, t0: 1e9 },
    report: { el: $(`<div class="pill" style="border-color:rgba(138,180,248,0.5);color:#c9dcff">/internal · a Google ID token</div>`), e: 'report', p: 0.55, t0: 1e9 },
    auth: { el: $(`<div class="pill" style="border-color:rgba(247,192,74,0.5);color:#ffe2a3">ID tokens, every request</div>`), e: 'auth', p: 0.5, t0: 1e9 },
  };
  for (const k in LABELS) chipsEl.appendChild(LABELS[k].el);
  const SPECS = [
    { at: 'api', dx: 0, dy: 104, html: `${IC('activity')} OpenTelemetry, into Cloud Trace` },
    { at: 'sql', dx: 0, dy: 100, html: `${IC('lock')} IAM sign-in only · backups, point-in-time` },
    { at: 'pub', dx: 0, dy: 100, html: `${IC('rotate-cw')} ordered · retried, then a dead letter` },
    { at: 'agents', dx: 0, dy: 100, html: `${IC('zap')} stateless · one run per event` },
    { at: 'sched', dx: 0, dy: 100, html: `${IC('calendar')} timers: offers close, reports fall due` },
  ].map((o) => { const el = $(`<div class="pill spec">${o.html}</div>`); chipsEl.appendChild(el); return { ...o, el, t0: 1e9 }; });

  // the act's header
  const HDR = [
    { k: 'Under the hood', h: 'All on Google Cloud.', p: 'Four apps, one API, one record, every step an event.' },
    { k: 'The agents', h: 'Ten agents. Two Gemini models.', p: "Built with Google's ADK, each with one job." },
    { k: 'One model call, bounded', h: 'The models never touch the money.', p: "Figures from the API, words from Gemini, and a person's yes." },
  ].map((o) => { const el = $(`<div class="hdr"><div class="k"><i></i>${o.k}</div><h1>${o.h}</h1><p>${o.p}</p></div>`); ui.appendChild(el); return { ...o, el, t0: 1e9, t1: 1e9 }; });

  // act 3: one model call, bounded
  const call = $(`<div id="call">
    <div class="step" id="s1" style="left:96px"><div class="n">${IC('bot')}1 · The agent asks</div><h3>The Router, on ADK</h3>
      <div class="json" id="j1">{ <span class="k">"batch"</span>: <span class="s">"MF-2410-118"</span>,
  <span class="k">"exits"</span>: <span class="s">["kiranas", "staff",</span>
  <span class="s">            "food bank"]</span> }</div>
      <div class="li">${IC('check')}<span>The batch, its exits and the brand's rules, from the API</span></div>
      <div class="li no">${IC('x')}<span>No reserve, and no money it can change</span></div></div>
    <div class="step gem" id="s2" style="left:540px"><div class="n">${IC('sparkles')}2 · Gemini answers</div><h3>Gemini 3.1 Pro</h3>
      <div class="json">{ <span class="k">"exit"</span>: <span class="s">"kiranas"</span>,
  <span class="k">"note"</span>: <span class="s">"Moves fastest here"</span> }</div>
      <div class="li blue">${IC('braces')}<span>Structured output, to a JSON schema</span></div>
      <div class="li blue">${IC('rotate-cw')}<span>3 tries of 30 s, then a safe fallback</span></div></div>
    <div class="step" id="s3" style="left:984px"><div class="n">${IC('shield-check')}3 · The API checks</div><h3>Every figure, its own</h3>
      <div class="li">${IC('indian-rupee')}<span>Every figure worked out in the API, never by the model</span></div>
      <div class="li">${IC('check')}<span>Every word checked before anyone sees it</span></div>
      <div class="li">${IC('shield')}<span>The brand's dates, floor price and caps</span></div>
      <div class="fig" id="fig"><b>₹16,917</b> net<span>worked out by the API</span></div></div>
    <div class="step yes" id="s4" style="left:1428px"><div class="n">${IC('hand')}4 · A person says yes</div><h3>Nothing moves without it.</h3>
      <div class="li">${IC('user-check')}<span>The supply chain lead sees the plan and its money</span></div>
      <div class="btn" id="go">${IC('check')}<span>Approve · release the agents</span></div></div>
  </div>`);
  ui.appendChild(call);
  const steps = [1, 2, 3, 4].map((i) => call.querySelector('#s' + i));
  const stepLis = steps.map((s) => [...s.querySelectorAll('.li')]);
  const jsonEl = call.querySelector('#s2 .json'), json1 = call.querySelector('#j1'), figEl = call.querySelector('#fig');
  const goBtn = call.querySelector('#go');
  const arrows = [492, 936, 1380].map((x) => { const a = $(`<svg class="arrow" style="left:${x}px" viewBox="0 0 46 24"><path d="M2 12H40M30 3l10 9-10 9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`); call.appendChild(a); return a; });
  const tracePanel = $(`<div class="trace"><div class="tk">${IC('activity')}Cloud Trace · the call, end to end</div>
    ${[['POST /internal/…/plan', 0, 1, 'g'], ['agents · router.run', 0.04, 0.9, 'g'], ['vertexai · generate_content', 0.1, 0.62, 'v'], ['api · checks: figures, words, rules', 0.74, 0.12, 'b'], ['cloudsql · commit', 0.87, 0.06, 'b']]
      .map(([n, a, w, c]) => `<div class="tr"><span>${n}</span><i data-a="${a}" data-w="${w}" class="${c}"></i></div>`).join('')}</div>`);
  ui.appendChild(tracePanel);
  const traceBars = [...tracePanel.querySelectorAll('i')];
  const lockChip = $(`<div class="lockchip"><div class="bi">${IC('lock')}</div>The reserve price never reaches a model</div>`); ui.appendChild(lockChip);
  const evals = $(`<div class="evals"><span class="lead">Evals on live Gemini</span><span class="e">Vision · <b>72 of 73</b> labels</span><span class="e">Router · <b>20 of 20</b></span><span class="e">Negotiator · the reserve <b>never leaked</b></span></div>`); ui.appendChild(evals);
  const cursor = $(`<svg class="cursor" viewBox="0 0 34 34"><path d="M5 3 L5 27 L11.5 21 L16 31 L20 29.3 L15.6 19.5 L24 19.5 Z" fill="#fff" stroke="#0b0f0d" stroke-width="2" stroke-linejoin="round"/></svg>`);
  const ripple = $(`<div class="ripple"></div>`); ui.appendChild(ripple); ui.appendChild(cursor);
  const pkLayer = $(`<div style="position:absolute;inset:0;pointer-events:none"></div>`); call.appendChild(pkLayer);

  // ------------------------------------------------------------------ the camera
  function camMatrix(c) {
    const P = new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1 / D, 0, 0, 0, 1]);
    return new DOMMatrix().translate(W / 2 + (c.ox || 0), H / 2 + (c.oy || 0)).multiply(P)
      .rotateAxisAngle(1, 0, 0, c.rx).rotateAxisAngle(0, 0, 1, c.rz).scale(c.s, c.s, c.s).translate(-c.cx, -c.cy);
  }
  const project = (m, x, y) => { const p = m.transformPoint(new DOMPoint(x, y, 0, 1)); return { x: p.x / p.w, y: p.y / p.w, w: p.w }; };
  let KEYS = [];
  function camAt(t) {
    let i = 0; while (i < KEYS.length - 1 && KEYS[i + 1].t <= t) i++;
    const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
    const span = Math.max(0.001, b.t - a.t);
    const p = b.t > a.t ? sm((t - a.t) / span) : 1;
    const c = {};
    for (const k of ['cx', 'cy', 's', 'rx', 'rz', 'ox', 'oy']) c[k] = lerp(a[k] ?? 0, b[k] ?? 0, t >= b.t ? 1 : (t < a.t ? 0 : p));
    // a slow, steady drift: never a shake
    c.cx += Math.sin(t * 0.23) * 6; c.cy += Math.cos(t * 0.19) * 5; c.rz += Math.sin(t * 0.17) * 0.25;
    return c;
  }

  // ------------------------------------------------------------------ the timeline, from the narration's cues
  let C = null, EVENTS = [], PKS = [], TICKS = [];
  const key = (t, o) => KEYS.push({ t, ...o });
  const ev = (t, type, extra = {}) => EVENTS.push({ t: +t.toFixed(3), type, ...extra });
  const show = (o, t, sound = 'drop') => { o.t0 = t; if (sound) ev(t, sound); };
  function draw(id, t0, dur = 0.7, sound = null) { const e = EDGES[id]; e.t0 = t0; e.t1 = t0 + dur; if (sound) ev(t0, sound); return e; }
  function packet(id, t0, dur = 0.7, col = 'g', ping = true) { const e = EDGES[id]; PKS.push({ e, t0, t1: t0 + dur, col }); if (ping) ev(t0 + dur, 'ping'); }

  function build() {
    const c = C;
    KEYS = []; EVENTS = []; PKS = []; TICKS = [];
    // act 1: the frame, then the apps, the API and the record, then the events and the clock
    key(0, { cx: 1600, cy: 940, s: 0.29, rx: 40, rz: -7 });
    key(c.google + 0.4, { cx: 1600, cy: 360, s: 0.5, rx: 28, rz: -4 });
    key(c.api + 0.2, { cx: 1600, cy: 400, s: 0.5, rx: 27, rz: -3 });
    key(c.record + 0.3, { cx: 1620, cy: 440, s: 0.49, rx: 27, rz: -3 });
    key(c.t03 + 0.9, { cx: 1640, cy: 760, s: 0.49, rx: 27, rz: -3 });
    key(c.t04 - 0.1, { cx: 1650, cy: 800, s: 0.48, rx: 27, rz: -3 });
    key(c.t04 + 1.1, { cx: 1700, cy: 1180, s: 0.6, rx: 26, rz: -2, oy: 40 });
    key(c.storage + 0.3, { cx: 1720, cy: 1230, s: 0.6, rx: 26, rz: -2, oy: 40 });
    key(c.gemini + 0.8, { cx: 1760, cy: 1330, s: 0.6, rx: 25, rz: -2, oy: 40 });
    key(c.t06 - 0.15, { cx: 1770, cy: 1345, s: 0.6, rx: 25, rz: -2, oy: 40 });
    key(c.t06 + 0.75, { cx: 1600, cy: 1080, s: 0.25, rx: 38, rz: -6, oy: 40 });
    key(c.end + 0.5, { cx: 1590, cy: 1070, s: 0.245, rx: 38, rz: -6, oy: 40 });
    ev(0.05, 'whoosh_in'); ev(c.google + 0.1, 'whoosh'); ev(c.t03 + 0.3, 'whoosh'); ev(c.t04 + 0.3, 'whoosh'); ev(c.gemini, 'whoosh'); ev(c.t06 + 0.05, 'whoosh');

    HDR[0].t0 = Math.min(c.t01 - 0.1, 0.35); HDR[0].t1 = c.t04 - 0.15;   // cut 8: in as the push lands, so the frame is never empty
    HDR[1].t0 = c.t04; HDR[1].t1 = c.t06 - 0.1;
    HDR[2].t0 = c.t06 + 0.1; HDR[2].t1 = 1e9;
    ev(c.t01, 'title'); ev(c.t04 + 0.05, 'title'); ev(c.t06 + 0.15, 'title');
    FRAME.t0 = 0.1; FRAME.t1 = 1.0; ev(0.15, 'sweep'); C.ghost = 0.35;
    const specT = { api: c.run + 0.3, sql: c.record + 0.6, pub: c.scheduler - 0.4, agents: c.adk + 0.6, sched: c.clock + 1.2 };
    SPECS.forEach((sp) => { sp.t0 = specT[sp.at]; ev(sp.t0, 'tick'); });

    show(NODES.fb, c.firebase - 0.1);
    ['a1', 'a2', 'a3', 'a4'].forEach((k, i) => show(NODES[k], c.apps - 0.15 + i * 0.13, i === 0 ? 'drop' : 'tick'));
    draw('auth', c.firebase + 0.25, 0.6); LABELS.auth.t0 = c.firebase + 0.6;
    show(NODES.api, c.api - 0.12, 'thump');
    draw('req', c.api - 0.45, 0.4); packet('req', c.api - 0.4, 0.45);
    show(NODES.sql, c.sql - 0.15, 'thump');
    draw('sql', c.sql - 0.25, 0.4); packet('sql', c.sql - 0.15, 0.45);
    show(NODES.sec, c.record + 0.1, 'tick'); draw('sec', c.record + 0.3, 0.45);
    NODES.sql.pulse = c.record;
    // the events: the API publishes, Pub/Sub carries each to whoever listens; the scheduler's tick keeps the clock
    show(NODES.pub, c.pubsub - 0.15, 'thump');
    draw('pub', c.event - 0.2, 0.5); packet('pub', c.event - 0.05, 0.55);
    BUS.t0 = c.pubsub; BUS.t1 = c.pubsub + 0.8; ev(c.pubsub + 0.05, 'sweep');
    TOPICS.forEach((tp, i) => { tp.t0 = c.pubsub + 0.3 + i * 0.62; ev(tp.t0, 'topic'); });
    show(NODES.sched, c.scheduler - 0.12, 'thump');
    draw('tick', c.scheduler + 0.2, 0.55);
    for (let k = 0; k < 3; k++) { const tt = c.clock - 0.5 + k * 0.85; TICKS.push(tt); ev(tt, 'clock'); }
    draw('live', c.clock + 0.2, 0.6); packet('live', c.clock + 0.4, 0.55, 'b'); LABELS.live.t0 = c.clock + 0.55;

    // act 2: the agents wake one by one under the bus, events drop to them; the data they read
    show(NODES.agents, c.ten - 0.15, 'thump');
    AGENTS.forEach((a, i) => { a.t0 = c.ten + 0.05 + i * 0.09; ev(a.t0, 'ignite'); draw('drop-' + a.id, a.t0 - 0.05, 0.35); });
    ['watcher', 'vision', 'valuer', 'router'].forEach((id, i) => packet('drop-' + id, c.adk + 0.1 + i * 0.22, 0.4, 'g', i === 0));
    NODES.agents.pulse = c.adk;
    show(NODES.bq, c.bigquery - 0.12, 'thump');
    draw('bq-watcher', c.bigquery + 0.05, 0.45); draw('bq-valuer', c.bigquery + 0.2, 0.45);
    packet('bq-watcher', c.bigquery + 0.35, 0.5, 'b');
    show(NODES.gcs, c.storage - 0.15, 'thump');
    draw('gcs-vision', c.storage + 0.05, 0.45); packet('gcs-vision', c.storage + 0.3, 0.5, 'b');
    draw('report', c.storage + 0.5, 0.6); LABELS.report.t0 = c.storage + 0.8;
    // Gemini: the two tiers, each agent's own
    show(NODES.gem, c.gemini - 0.12, 'boom');
    NODES.gem.pulse = c.vertex;
    show(PILLS.pro, c.pro - 0.12, 'badge');
    const proT = { valuer: c.prices, router: c.splits, negotiator: c.negotiates };
    for (const id in proT) { const a = AG[id]; a.tt = proT[id] - 0.05; ev(a.tt, 'chime_pro'); draw('gem-' + id, a.tt - 0.25, 0.4); packet('gem-' + id, a.tt - 0.1, 0.4, 'v', false); a.pulses.push(a.tt); }
    show(PILLS.flash, c.flash - 0.12, 'badge');
    const flashT = { data: c.flash + 0.15, vision: c.labels, outreach: c.offers, lister: c.offers + 0.15, paperwork: c.papers, impact: c.papers + 0.15 };
    for (const id in flashT) { const a = AG[id]; a.tt = flashT[id] - 0.05; ev(a.tt, 'chime_flash'); draw('gem-' + id, a.tt - 0.25, 0.4); packet('gem-' + id, a.tt - 0.1, 0.4, 'b', false); a.pulses.push(a.tt); }
    AG.vision.pulses.push(c.receipts);
    AG.watcher.tt = c.flash + 0.55; ev(AG.watcher.tt, 'tick');
    // and what runs the platform, along the bottom: built, shipped and watched
    ['build', 'reg', 'mon', 'obs'].forEach((k, i) => show(NODES[k], c.papers + 0.55 + i * 0.14, 'tick'));

    // act 3: one model call, bounded
    call.t0 = c.t06; dimEl.t0 = c.t06;
    steps[0].t0 = c.t06 + 0.2; steps[1].t0 = c.t06 + 0.45;
    stepLis[0].forEach((l, i) => { l.t0 = c.t06 + 0.55 + i * 0.25; });
    jsonEl.t0 = c.t06 + 0.75; json1.t0 = c.t06 + 0.45; figEl.t0 = c.figure + 0.25; ev(figEl.t0, 'chime_pro'); stepLis[1].forEach((l, i) => { l.t0 = c.t06 + 0.95 + i * 0.25; });
    lockChip.t0 = c.money + 0.05; ev(lockChip.t0, 'lock');
    steps[2].t0 = c.api2 - 0.2; stepLis[2][0].t0 = c.figure - 0.1; stepLis[2][1].t0 = c.checks - 0.05; stepLis[2][2].t0 = c.rules - 0.1;
    ev(steps[0].t0, 'card'); ev(steps[1].t0, 'card'); ev(steps[2].t0, 'card'); ev(stepLis[2][0].t0, 'tick'); ev(stepLis[2][1].t0, 'tick'); ev(stepLis[2][2].t0, 'tick');
    arrows[0].t0 = steps[1].t0 - 0.1; arrows[1].t0 = steps[2].t0 - 0.1;
    steps[3].t0 = c.waits - 0.25; arrows[2].t0 = steps[3].t0 - 0.1; stepLis[3][0].t0 = c.waits; ev(steps[3].t0, 'card');
    evals.t0 = c.checks + 0.4; ev(evals.t0, 'badge');
    tracePanel.t0 = c.t06 + 1.3; traceBars.forEach((b, i) => { b.t0 = c.t06 + 1.5 + i * (c.waits - c.t06 - 1.6) / 5; ev(b.t0, 'tick'); });
    C.click = c.yes + 0.12; ev(C.click, 'click'); ev(C.click + 0.06, 'gate');
    KEYS.sort((a, b) => a.t - b.t);
    EVENTS.sort((a, b) => a.t - b.t);
  }

  // ------------------------------------------------------------------ the field behind it all
  const R = rng(218);
  const STARS = Array.from({ length: 300 }, () => ({ x: R() * 2600 - 300, y: R() * 1600 - 260, d: 0.25 + R() * 0.75, ph: R() * 6.28, r: 0.6 + R() * 1.5 }));
  const LINKS = [];
  for (let i = 0; i < STARS.length; i++) for (let j = i + 1; j < STARS.length; j++) {
    const a = STARS[i], b = STARS[j];
    if (Math.abs(a.d - b.d) < 0.12 && Math.hypot(a.x - b.x, a.y - b.y) < 140) LINKS.push([i, j]);
  }
  function drawField(t, cam) {
    const g = bg.createRadialGradient(W * 0.5, H * 0.42, 60, W * 0.5, H * 0.5, 1150);
    g.addColorStop(0, '#0d1913'); g.addColorStop(0.55, '#08110d'); g.addColorStop(1, '#040706');
    bg.fillStyle = g; bg.fillRect(0, 0, W, H);
    const px = (cam.cx - 1600) * 0.2, py = (cam.cy - 1050) * 0.2, sc = 0.85 + cam.s * 0.3;
    const pos = STARS.map((s) => ({ x: W / 2 + (s.x - 1000 - px * s.d) * sc * (0.6 + s.d * 0.4), y: H / 2 + (s.y - 540 - py * s.d) * sc * (0.6 + s.d * 0.4), s }));
    bg.lineWidth = 1;
    for (const [i, j] of LINKS) { const a = pos[i], b = pos[j]; bg.strokeStyle = `rgba(115,201,157,${0.04 + 0.04 * a.s.d})`; bg.beginPath(); bg.moveTo(a.x, a.y); bg.lineTo(b.x, b.y); bg.stroke(); }
    for (const p of pos) {
      const tw = 0.55 + 0.45 * Math.sin(t * (0.7 + p.s.d) + p.s.ph);
      bg.fillStyle = `rgba(190,240,215,${(0.1 + 0.35 * p.s.d) * tw})`;
      bg.beginPath(); bg.arc(p.x, p.y, p.s.r * (0.6 + p.s.d), 0, 6.283); bg.fill();
    }
  }

  // ------------------------------------------------------------------ one frame
  function place(el, m, x, y, k = 1, ax = 0.5, ay = 0.5) {
    const p = project(m, x, y);
    const sc = (k * (1 / p.w)) / 1;
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.transform = `translate(${(p.x - w * ax).toFixed(2)}px, ${(p.y - h * ay).toFixed(2)}px) scale(${sc.toFixed(4)})`;
    el.style.transformOrigin = `${ax * 100}% ${ay * 100}%`;
    return p;
  }
  function renderAt(t) {
    if (!C) return;
    const cam = camAt(t), m = camMatrix(cam);
    world.style.transform = m.toString();
    drawField(t, cam);
    glow.clearRect(0, 0, W, H);
    const nodeK = cam.s / SREF;
    // the frame
    const fp = clamp((t - FRAME.t0) / (FRAME.t1 - FRAME.t0));
    const fo = ex(fp);
    frameLine.setAttribute('stroke-dashoffset', frameLen * (1 - fo)); frameGlow.setAttribute('stroke-dashoffset', frameLen * (1 - fo));
    frameLine.style.opacity = fo > 0 ? 1 : 0; frameGlow.style.opacity = 0.5 * clamp(fo * 2);
    frameLabel.style.opacity = clamp((t - FRAME.t1 + 0.4) / 0.4);
    place(frameLabel, m, FRAME.x0 + 30, FRAME.y0 - 26, nodeK * 1.1, 0, 1);
    // the lines
    for (const id in EDGES) {
      const e = EDGES[id];
      const p = ex((t - e.t0) / (e.t1 - e.t0));
      e.gh.style.opacity = (0.32 * clamp((t - C.ghost) / 0.8) * (t < e.t0 ? 1 : clamp(1 - (t - e.t0) / 0.3))).toFixed(3);
      if (e.dash) {
        const o = clamp((t - e.t0) / (e.t1 - e.t0));
        e.p.style.opacity = o; e.g1.style.opacity = 0.35 * o;
        e.p.setAttribute('stroke-dashoffset', (-t * 40).toFixed(1)); e.g1.setAttribute('stroke-dashoffset', (-t * 40).toFixed(1));
      } else {
        e.p.setAttribute('stroke-dashoffset', e.len * (1 - p)); e.g1.setAttribute('stroke-dashoffset', e.len * (1 - p));
        e.p.style.opacity = p > 0 ? 1 : 0; e.g1.style.opacity = p > 0 ? 0.45 : 0;
      }
    }
    // the bus
    const bp = ex((t - (BUS.t0 ?? 1e9)) / 0.8);
    busLine.setAttribute('stroke-dashoffset', busLen * (1 - bp)); busGlow.setAttribute('stroke-dashoffset', busLen * (1 - bp));
    busLine.style.opacity = bp > 0 ? 1 : 0; busGlow.style.opacity = bp > 0 ? 0.45 : 0;
    busGhost.style.opacity = (0.35 * clamp((t - C.ghost) / 0.8) * (bp > 0 ? 0 : 1)).toFixed(3);
    // packets
    while (gPk.firstChild) gPk.removeChild(gPk.firstChild);
    for (const k of PKS) {
      if (t < k.t0 || t > k.t1 + 0.25) continue;
      const p = ex((t - k.t0) / (k.t1 - k.t0));
      const a = t > k.t1 ? 1 - (t - k.t1) / 0.25 : 1;
      const q = at(p, k.e);
      const grad = k.col === 'b' ? 'url(#pkB)' : k.col === 'v' ? 'url(#pkV)' : 'url(#pk)';
      mk('circle', { cx: q.x, cy: q.y, r: 34, fill: grad, opacity: a }, gPk);
      mk('circle', { cx: q.x, cy: q.y, r: 8, fill: '#ffffff', opacity: a }, gPk);
      for (let j = 1; j <= 4; j++) { const qq = at(Math.max(0, p - j * 0.05), k.e); mk('circle', { cx: qq.x, cy: qq.y, r: 7 - j, fill: k.col === 'b' ? '#bcd6ff' : k.col === 'v' ? '#e2c6ff' : '#bdf5d6', opacity: a * (0.6 - j * 0.12) }, gPk); }
    }
    // topics run along the bus, one after another, and on to the agents
    TOPICS.forEach((tp) => {
      const u = t - tp.t0;
      const runT = (BUS.x1 - BUS.x0 - 80) / 560;
      if (u < 0 || u > runT + 0.3) { tp.el.style.opacity = 0; return; }
      const x = BUS.x0 + 20 + ex(u / runT) * (BUS.x1 - BUS.x0 - 80);
      tp.el.style.opacity = clamp(u / 0.2) * clamp((runT + 0.3 - u) / 0.3);
      place(tp.el, m, x, BUS.y - 40, nodeK * (0.92 + 0.08 * spring(u)), 0.5, 1);
    });
    // the parts
    for (const k in NODES) {
      const n = NODES[k];
      const u = t - n.t0;
      if (u < 0) {
        // the blueprint: every part there, faint, before it is named
        const ga = 0.3 * clamp((t - C.ghost - 0.1) / 0.6);   // cut 8b: the blueprint reads from the first second
        n.el.style.opacity = ga.toFixed(3); n.el.classList.add('ghost'); n.halo.style.opacity = 0;
        if (ga > 0) place(n.el, m, n.x, n.y, nodeK * 0.86);
        continue;
      }
      n.el.classList.remove('ghost');
      const s = spring(u, 0.6, 13), a = Math.max(0.2, clamp(u / 0.18));
      n.el.style.opacity = a;
      const dy = (1 - eo(u / 0.35)) * 26;
      place(n.el, m, n.x, n.y - dy, nodeK * (0.86 + 0.14 * s));
      const pu = n.pulse != null ? t - n.pulse : -1;
      const halo = Math.max(clamp(1 - u / 0.9) * 0.9, pu >= 0 ? Math.max(0, 1 - pu / 1.1) * 0.85 : 0);
      n.halo.style.opacity = halo;
    }
    // the agents, their tiers and their pulses
    for (const a of AGENTS) {
      const u = t - a.t0;
      if (u < 0) {
        const ga = 0.3 * clamp((t - C.ghost - 0.2) / 0.6);
        a.el.style.opacity = ga.toFixed(3); a.el.classList.add('ghost'); a.tierEl.style.opacity = 0; a.glowEl.style.opacity = 0;
        if (ga > 0) place(a.el, m, a.x, a.y, nodeK * 0.8, 0.5, 0.42);
        continue;
      }
      a.el.classList.remove('ghost');
      const s = spring(u, 0.55, 14);
      a.el.style.opacity = clamp(u / 0.15);
      place(a.el, m, a.x, a.y, nodeK * (0.8 + 0.2 * s), 0.5, 0.42);
      const ut = t - a.tt;
      a.tierEl.style.opacity = ut >= 0 ? clamp(ut / 0.2) : 0;
      a.tierEl.style.transform = `translateX(-50%) translateY(${((1 - eo(ut / 0.3)) * 10).toFixed(1)}px) scale(${(0.85 + 0.15 * spring(Math.max(0, ut))).toFixed(3)})`;
      let g = clamp(1 - u / 0.8) * 0.8;
      for (const pt of a.pulses) if (t >= pt) g = Math.max(g, Math.max(0, 1 - (t - pt) / 1.2));
      a.glowEl.style.opacity = g;
    }
    for (const k in PILLS) {
      const p = PILLS[k], u = t - p.t0;
      if (u < 0) { p.el.style.opacity = 0; continue; }
      p.el.style.opacity = clamp(u / 0.18);
      place(p.el, m, p.x, p.y, nodeK * (0.85 + 0.15 * spring(u)));
    }
    for (const k in LABELS) {
      const L = LABELS[k], u = t - L.t0, e = EDGES[L.e];
      if (u < 0) { L.el.style.opacity = 0; continue; }
      L.el.style.opacity = clamp(u / 0.25) * (t > C.t06 ? clamp(1 - (t - C.t06) / 0.4) : 1);
      const q = at(L.p, e);
      place(L.el, m, q.x, q.y, nodeK * 0.95);
    }
    for (const sp of SPECS) {
      const u = t - sp.t0, n = NODES[sp.at];
      if (u < 0) { sp.el.style.opacity = 0; continue; }
      sp.el.style.opacity = (clamp(u / 0.25) * (t > C.t06 ? clamp(1 - (t - C.t06) / 0.4) : 1)).toFixed(3);
      place(sp.el, m, n.x + sp.dx, n.y + sp.dy - (1 - eo(u / 0.4)) * 10, nodeK * 0.92);
    }
    // the scheduler's ticks: a ring out of its card
    for (const tt of TICKS) {
      const u = t - tt; if (u < 0 || u > 0.9) continue;
      const p = project(m, NODES.sched.x - 150, NODES.sched.y);
      glow.strokeStyle = `rgba(138,180,248,${(1 - u / 0.9) * 0.8})`; glow.lineWidth = 3;
      glow.beginPath(); glow.arc(p.x, p.y, 20 + u * 90 * nodeK, 0, 6.283); glow.stroke();
    }
    // the act's header: a crisp slide, never a blur
    HDR.forEach((h, i) => {
      const a = clamp((t - h.t0) / 0.35) * (t > h.t1 ? clamp(1 - (t - h.t1) / 0.25) : 1);
      h.el.style.opacity = a;
      const yIn = (1 - ex((t - h.t0) / 0.6)) * 24, yOut = t > h.t1 ? -ex((t - h.t1) / 0.4) * 18 : 0;
      h.el.style.transform = `translateY(${(yIn + yOut).toFixed(2)}px)`;
    });
    // act 3
    const ua = t - call.t0;
    dimEl.style.opacity = ua >= 0 ? 0.74 * sm(ua / 0.6) : 0;
    call.style.opacity = ua >= 0 ? 1 : 0;
    steps.forEach((s, i) => {
      const u = t - s.t0;
      s.style.opacity = u >= 0 ? clamp(u / 0.2) : 0;
      s.style.transform = `translateY(${((1 - ex(u / 0.55)) * 46).toFixed(2)}px)`;
    });
    stepLis.flat().forEach((l) => { const u = t - (l.t0 ?? 1e9); l.style.opacity = u >= 0 ? clamp(u / 0.2) : 0; l.style.transform = `translateX(${((1 - ex(u / 0.4)) * 14).toFixed(2)}px)`; });
    for (const el of [jsonEl, json1]) { const u = t - el.t0; el.style.opacity = u >= 0 ? clamp(u / 0.25) : 0; }
    { const u = t - figEl.t0; figEl.style.opacity = u >= 0 ? clamp(u / 0.2) : 0; figEl.style.transform = `scale(${(0.9 + 0.1 * spring(Math.max(0, u))).toFixed(3)})`; }
    arrows.forEach((a) => { const u = t - a.t0; a.style.opacity = u >= 0 ? clamp(u / 0.25) : 0; a.style.transform = `translateX(${((1 - ex(u / 0.4)) * -12).toFixed(2)}px)`; });
    { const u = t - lockChip.t0; lockChip.style.opacity = u >= 0 ? clamp(u / 0.2) : 0;
      lockChip.style.transform = `translate(96px, 800px) scale(${(0.9 + 0.1 * spring(Math.max(0, u))).toFixed(3)})`; lockChip.style.transformOrigin = '0 50%'; }
    { const u = t - tracePanel.t0; tracePanel.style.opacity = u >= 0 ? clamp(u / 0.3) : 0;
      tracePanel.style.transform = `translateY(${((1 - ex(u / 0.5)) * 18).toFixed(2)}px)`;
      traceBars.forEach((b) => { const v = clamp((t - b.t0) / 0.6); const a = +b.dataset.a, w = +b.dataset.w;
        b.style.left = `${(a * 100).toFixed(2)}%`; b.style.width = `${(w * 100 * ex(v)).toFixed(2)}%`; b.style.opacity = v > 0 ? 1 : 0; }); }
    // packets running the arrows, step to step
    while (pkLayer.firstChild) pkLayer.removeChild(pkLayer.firstChild);
    arrows.forEach((ar, i) => { const u = t - ar.t0; if (u < 0.3) return;
      for (let j = 0; j < 2; j++) { const ph = ((u * 0.9 + j * 0.5) % 1); const x = [478, 922, 1366][i] + ph * 74;
        const d = document.createElement('div'); d.className = 'pkd'; d.style.transform = `translate(${x.toFixed(1)}px, 517px)`; d.style.opacity = (Math.sin(ph * Math.PI)).toFixed(2); pkLayer.appendChild(d); } });
    { const u = t - evals.t0; evals.style.opacity = u >= 0 ? clamp(u / 0.3) : 0; evals.style.transform = `translate(96px, ${(890 + (1 - ex(u / 0.5)) * 16).toFixed(2)}px)`; }
    // the pointer to Approve, the click, the yes
    const ck = C.click;
    const bx = 1428 + 191, by = 330 + 330;
    if (t >= ck - 1.3 && t < ck + 1.6) {
      const p = ex((t - (ck - 1.3)) / 1.1);
      const x = lerp(1240, bx + 10, p), y = lerp(900, by + 10, p);
      const press = t >= ck && t < ck + 0.12 ? 0.86 : 1;
      cursor.style.opacity = clamp((t - (ck - 1.3)) / 0.2) * (t > ck + 1.2 ? clamp(1 - (t - ck - 1.2) / 0.3) : 1);
      cursor.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${press})`;
    } else cursor.style.opacity = 0;
    const ru = t - ck;
    if (ru >= 0 && ru < 0.7) { const r = 20 + ru * 160; ripple.style.opacity = 1 - ru / 0.7; ripple.style.width = ripple.style.height = `${2 * r}px`; ripple.style.transform = `translate(${bx - r}px, ${by - r}px)`; }
    else ripple.style.opacity = 0;
    const done = t >= ck + 0.05;
    goBtn.classList.toggle('done', done);
    goBtn.querySelector('span').textContent = done ? 'Approved · agents set off' : 'Approve · release the agents';
  }

  window.setCues = (cues) => { C = cues; build(); renderAt(0); return { events: EVENTS }; };
  window.renderAt = renderAt;
  document.fonts.ready.then(() => { window.pageReady = true; });
})();
