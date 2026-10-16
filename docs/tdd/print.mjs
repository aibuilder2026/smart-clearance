// The Technical Design Document: the architecture page (docs/smart-clearance-architecture.html) printed with a cover,
// document control, numbered contents, an introduction, the back matter from ARCHITECTURE.md, the diagrams and a
// glossary. Run by build.sh: node docs/tdd/print.mjs <fragments.json> <out.pdf> [pages.json]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const require = createRequire(path.join(repo, 'frontend/testing/package.json'));
const { chromium } = require('@playwright/test');

const [fragFile, out, pagesFile] = process.argv.slice(2);
const frag = JSON.parse(readFileSync(fragFile, 'utf8'));
const pages = pagesFile ? JSON.parse(readFileSync(pagesFile, 'utf8')) : {};
const url = (p) => pathToFileURL(path.join(repo, p)).href;

const META = {
  ref: 'SC-TDD-001',
  version: '1.1',
  date: '16 October 2026',
  status: 'Issued',
};

// the contents, in order; `id` is the section the page or this script lays out
const SECTIONS = [
  { id: 'tdd-intro', no: '1', title: 'Introduction', sub: 'Purpose, scope, audience and the design principles' },
  { id: 'system', no: '2', title: 'The system', sub: 'Everything that runs, in one picture' },
  { id: 'brief', no: '3', title: 'Firebase, Cloud Run and Gemini', sub: 'The three platform choices, and why not Firestore' },
  { id: 'gcp', no: '4', title: 'Google Cloud, service by service', sub: 'What each service does here, and why' },
  { id: 'agents', no: '5', title: 'The agents', sub: 'Ten agents along nine stops, and one person’s yes' },
  { id: 'flow', no: '6', title: 'The application flow', sub: 'A batch’s journey, request by request' },
  { id: 'identity', no: '7', title: 'Identity and security', sub: 'Every caller signs as someone; nobody holds a key' },
  { id: 'cicd', no: '8', title: 'Delivery', sub: 'GitHub Actions gates; Cloud Build ships' },
  { id: 'testing', no: '9', title: 'Testing and quality', sub: 'From a pixel to a live Gemini reply' },
  { id: 'observe', no: '10', title: 'Observability', sub: 'One trace, from a tap to an agent’s report' },
  { id: 'tdd-evals', no: '11', title: 'The agents’ evals', sub: 'Each agent’s model call, scored on live Gemini' },
  { id: 'tdd-perf', no: '12', title: 'Performance, cost and scale', sub: 'Measured on production, priced in INR' },
  { id: 'tdd-decisions', no: '13', title: 'Design decisions', sub: 'What was chosen, and why' },
  { id: 'tdd-gaps', no: '14', title: 'Known gaps and risks', sub: 'What is not done, and where it shows' },
  { id: 'tdd-next', no: '15', title: 'What comes next', sub: 'The roadmap, area by area' },
  { id: 'tdd-diagrams', no: 'A', title: 'Appendix A · The diagrams', sub: 'Every Lucidchart diagram, a page each' },
  { id: 'tdd-glossary', no: 'B', title: 'Appendix B · Glossary', sub: 'The domain’s words, and the stack’s' },
];

// the diagrams, in ARCHITECTURE.md's order, read from its image links
const md = readFileSync(path.join(repo, 'ARCHITECTURE.md'), 'utf8');
const DIAGRAMS = [...md.matchAll(/\[!\[([\s\S]*?)\]\((docs\/architecture\/[\w-]+\.webp)\)\]\((https:\/\/lucid\.app\/[^)]+)\)\s*\n\s*\*Lucid: ([^*]+?)\.\*/g)]
  .map((m) => ({ alt: m[1].replace(/\s+/g, ' '), src: url(m[2]), link: m[3], source: m[4] }));
const NAMES = {
  system: 'Smart-Clearance on Google Cloud', 'agents-nine-stops': 'Ten agents along nine stops', delivery: 'GitHub Actions and Cloud Build',
  'cloud-layers': 'Google Cloud, layer by layer', 'cloud-run': 'Cloud Run: two services, two jobs', 'events-and-time': 'Pub/Sub and Cloud Scheduler',
  data: 'Where the data lives', identity: 'Who signs as whom', 'agents-and-models': 'The agents and their models', 'model-call': 'A model call, bounded',
  'flow-core-loop': 'The core loop', 'flow-batch-journey': 'A batch’s journey',
  'evals-run': 'The agents’ evals on Google Cloud', 'evals-case': 'One eval case, scored', 'evals-sets': 'The seven eval sets',
  'evals-vision': 'How a Vision photo and its truth are made', 'evals-runs': 'The live eval runs, and what they changed',
};
for (const d of DIAGRAMS) {
  const file = d.src.split('/').pop().replace('.webp', '');
  d.title = NAMES[file] || d.source.replace(/^Smart-Clearance · /, '');
}
const seen = new Set();
const diagrams = DIAGRAMS.filter((d) => !seen.has(d.src) && seen.add(d.src));

const GLOSSARY = [
  ['Agent Platform', 'Gemini Enterprise Agent Platform, Google’s name since April 2026 for Vertex AI; Gemini is reached at aiplatform.googleapis.com.'],
  ['ADK', 'Google’s Agent Development Kit. Each agent pipeline is an ADK workflow of steps and bounded LlmAgent writers.'],
  ['Batch', 'One lot of a SKU at a distributor’s godown, with its best-before date; the unit the platform watches.'],
  ['Case', 'A batch at risk worked through the journey: its phase, plan, approval, lines, papers and ledger.'],
  ['Journey', 'The nine stops a case moves through: Connect, Detect, Verify, Value, Decide, Approve, Execute, Settle, Report.'],
  ['Exit', 'One way out for packs at risk: the kiranas’ scheme, the marketplace, a staff sale, a food bank, or destruction.'],
  ['Distributor', 'The brand’s stockist in a city, who holds the batch in a godown and serves the kiranas.'],
  ['Godown', 'A warehouse, in Indian usage; where a distributor keeps stock.'],
  ['Kirana', 'A neighbourhood grocery shop. The scheme offers it packs at a margin, in its own language.'],
  ['ExpireSoon', 'The fictional near-expiry marketplace the Lister lists a lot on, and the Negotiator bargains with buyers on.'],
  ['Staff sale', 'Packs sold to the distributor’s staff, recorded on one consolidated receipt of UPI payments.'],
  ['Destruction at the godown', 'Packs that sold nowhere, destroyed by an authorised agency on photo evidence, a signed certificate and a second yes.'],
  ['Expiry day', 'Best-before, when open lines close as they stand and the report falls due; Report now brings it forward.'],
  ['Price support', 'Credit from the brand to the distributor for the gap between the dealer price and what the exits fetched.'],
  ['GST ITC', 'Input tax credit under India’s GST; reversed under s.17(5)(h) for goods destroyed or given away.'],
  ['IRN', 'Invoice reference number of an e-invoice; worked out here as the portal does, with an illustrative signed QR.'],
  ['GSTIN, PAN, FSSAI', 'India’s tax, income-tax and food-safety identifiers. Every one in Smart-Clearance is fictional.'],
  ['BRSR', 'SEBI’s Business Responsibility and Sustainability Report; Principle 6 carries food waste and packaging.'],
  ['Prototype time', 'The journey’s own clock: the story’s calendar from day 0, at a client’s chosen day length.'],
  ['Outbox', 'Rows written in a step’s transaction and published to Pub/Sub after it commits, so no event is lost.'],
  ['SSE, FCM', 'Server-sent events keep open screens live; Firebase Cloud Messaging pushes to closed ones.'],
  ['Workspace', 'A client’s own app at <client>-smartclearance.web.app; the console is Smart-Clearance’s staff app.'],
  ['PWA', 'Progressive web app: the workspace installs on a laptop, a tablet or a phone, and takes pushes.'],
  ['Stand-in', 'A console control that acts for a demo world’s partners, such as filling a kirana scheme.'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url('docs/smart-clearance-architecture.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
await page.addStyleTag({ content: readFileSync(path.join(here, 'tdd.css'), 'utf8') });

await page.evaluate(
  ({ META, SECTIONS, diagrams, GLOSSARY, frag, pages, plates }) => {
    const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const mark = document.querySelector('.hero-mark svg').outerHTML.replace('class="mk play"', 'class="mk"');
    const main = document.querySelector('main');
    const sec = (id, no, eyebrow, title, lede, body, app) => h(`<section id="${id}" class="tdd-only"><div class="wrap">
      <div class="sec-head"><p class="eyebrow"><span class="tdd-n${app ? ' app' : ''}">${no}</span>${eyebrow}</p><h2>${title}</h2>${lede ? `<p class="lede">${lede}</p>` : ''}</div>
      ${body}</div></section>`);

    // ---------- front matter ----------
    const cover = h(`<section class="tdd-full tdd-only" id="tdd-cover">
      <img class="tdd-plate" src="${plates.night}" alt="">
      <div class="tdd-shade"></div>
      <div class="tdd-cover-body">
        <div class="tdd-brand">${mark}<span class="wordmark">Smart&#8209;Clearance</span></div>
        <p class="tdd-kind">Technical Design Document</p>
        <h1 class="tdd-title">An agentic near-expiry router, <em>built on Google Cloud.</em></h1>
        <p class="tdd-sub">How Smart-Clearance is designed and built: Firebase, Cloud Run and Gemini on Agent Platform, the agents on Google's Agent Development Kit, the data, identity, delivery, testing and observability, with the measurements, decisions and known gaps.</p>
        <div class="tdd-meta">
          <div><span>Reference</span><b>${META.ref}</b></div>
          <div><span>Version</span><b>${META.version}</b></div>
          <div><span>Date</span><b>${META.date}</b></div>
          <div><span>Status</span><b>${META.status}</b></div>
          <div><span>Prepared for</span><b>Google AI Hackathon 2026 · Retail &amp; Commerce</b></div>
        </div>
      </div>
      <div class="tdd-band"><i></i><i></i><i></i><i></i></div>
    </section>`);

    const control = h(`<section class="tdd-page tdd-only" id="tdd-control"><div class="wrap">
      <h2 class="tdd-h">Document control</h2>
      <div class="tdd-cols three">
        <div style="display:grid;gap:5mm;align-content:start">
          <div class="tdd-box"><h3>Document information</h3><table>
            <tr><th>Document</th><td>Smart-Clearance · Technical Design Document</td></tr>
            <tr><th>Reference</th><td>${META.ref}</td></tr>
            <tr><th>Version and date</th><td>${META.version}, ${META.date}</td></tr>
            <tr><th>Status</th><td>${META.status}, for the Google AI Hackathon 2026, Retail &amp; Commerce track</td></tr>
            <tr><th>Classification</th><td>Public. The repository is public, and every company, person and figure in Smart-Clearance is fictional.</td></tr>
            <tr><th>Owner</th><td>The Smart-Clearance team</td></tr>
            <tr><th>Source</th><td>The architecture page (docs/smart-clearance-architecture.html) and ARCHITECTURE.md, as of ${META.date}</td></tr>
          </table></div>
        </div>
        <div style="display:grid;gap:5mm;align-content:start">
          <div class="tdd-box"><h3>Revision history</h3><table>
            <thead><tr><th>Version</th><th>Date</th><th>Change</th></tr></thead>
            <tr><td>1.0</td><td>15 October 2026</td><td>First issue, with every Lucidchart diagram and a glossary.</td></tr>
            <tr><td>${META.version}</td><td>${META.date}</td><td>Chapter 11, the agents’ evals, with five new diagrams.</td></tr>
          </table></div>
<div class="tdd-box blue"><h3>The system it describes</h3><table>
            <tr><th>Repository</th><td>github.com/aibuilder2026/smart-clearance</td></tr>
            <tr><th>Google Cloud</th><td>Project aibuilder-510213, region asia-south1; Gemini on Agent Platform's global endpoint</td></tr>
            <tr><th>Live apps</th><td>smartclearance.web.app · smartclearance-console.web.app · munchly-smartclearance.web.app · smartclearance-demo.web.app</td></tr>
          </table></div>
        </div>
        <div style="display:grid;gap:5mm;align-content:start">
          <div class="tdd-box teal"><h3>Related documents</h3><ul>
            <li><b>ARCHITECTURE.md</b>: the technical architecture in full, with every diagram</li>
            <li><b>README.md</b>: setting up, running and operating it</li>
            <li><b>TESTING.md</b>, <b>DEMO.md</b>, <b>PRODUCT.md</b>: the tests, the demo, the product</li>
            <li><b>Lucidchart</b>: the diagrams' sources, linked from Appendix A</li>
          </ul></div>
          <div class="tdd-box amber"><h3>Conventions</h3><div class="tdd-key">
            <span><i style="background:var(--primary)"></i>Green: Smart-Clearance's own code</span>
            <span><i style="background:var(--g)"></i>Blue: a managed Google Cloud service</span>
            <span><i style="background:var(--ai)"></i>Teal: AI, Gemini and the agents</span>
            <span><i style="background:var(--amber)"></i>Amber: a person's yes</span>
            <span style="display:block;color:var(--fg-3)">Figures are production measurements of 8 to 10 October 2026, priced at Google's INR list prices. Diagrams are Lucidchart exports, drawn with Google Cloud's own icons.</span>
          </div></div>
        </div>
      </div>
    </div></section>`);

    const half = Math.ceil(SECTIONS.length / 2);
    const item = (s) => `<li class="${/^[A-Z]$/.test(s.no) ? 'app' : ''}"><span class="no">${s.no}</span><span class="t"><b>${esc(s.title)}</b><span>${esc(s.sub)}</span></span><span class="pg">${pages[s.id] || '–'}</span></li>`;
    const contents = h(`<section class="tdd-page tdd-only" id="tdd-contents"><div class="wrap">
      <h2 class="tdd-h">Contents</h2>
      <div class="tdd-toc"><ol>${SECTIONS.slice(0, half).map(item).join('')}</ol><ol>${SECTIONS.slice(half).map(item).join('')}</ol></div>
    </div></section>`);

    const intro = sec('tdd-intro', '1', 'Introduction', 'What this document is, and the ideas the design rests on',
      'Smart-Clearance finds an FMCG brand’s stock that will not sell before its date, prices every way out, and waits for one person’s yes; then agents run the plan, draft the papers and post the impact. This document describes how it is built.',
      `<div class="tdd-cols" style="margin-bottom:6mm">
        <div class="tdd-box"><h3>1.1 Purpose and scope</h3><p>It sets out the design of the platform as built: the four web apps, backend-api, the agents, the data, the Google Cloud infrastructure, delivery, testing and observability, with the production measurements, the decisions behind them and the gaps that remain. The product and its market are in PRODUCT.md; running and operating it, in README.md.</p></div>
        <div class="tdd-box blue"><h3>1.2 Audience</h3><p>The hackathon's judges, engineers joining the work, and reviewers of a change. It assumes familiarity with web applications and Google Cloud, and explains the domain's words in Appendix B.</p></div>
      </div>
      <div class="tdd-principles">
        <div><b>One system of record</b><p>backend-api on Cloud SQL owns every write, each in one transaction with its audit line.</p></div>
        <div><b>Code orchestrates, models write</b><p>The journey's state machine decides what runs; Gemini supplies words, never a figure.</p></div>
        <div><b>A person's yes</b><p>The plan's approval and a destruction's second yes gate every step that cannot be undone.</p></div>
        <div><b>Stateless agents on events</b><p>One run a Pub/Sub event, ordered by batch; each report is checked before it is kept.</p></div>
        <div><b>Declared and keyless</b><p>Every resource in Terraform; no service-account key anywhere; CI signs in through Workload Identity Federation.</p></div>
        <div><b>One trace, end to end</b><p>A traceparent from the browser to Gemini; spans, log lines, audit rows and agent runs share it.</p></div>
      </div>`);

    main.prepend(intro);
    main.prepend(contents);
    main.prepend(control);
    main.prepend(cover);

    // ---------- the page's own sections, numbered ----------
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      const eb = el && !el.classList.contains('tdd-only') && el.querySelector('.sec-head .eyebrow');
      if (eb) eb.insertAdjacentHTML('afterbegin', `<span class="tdd-n">${s.no}</span>`);
    }

    // ---------- back matter ----------
    const back = [
      sec('tdd-evals', '11', 'The agents’ evals', 'Each agent’s own model call, on live Gemini, scored by code and by a judge', '', `<div class="tdd-md tdd-evals">${frag.evals}</div>`),
      sec('tdd-perf', '12', 'Performance, cost and scale', 'Measured on production; it runs for about ₹1,350 to ₹3,600 a month', '', `<div class="tdd-md">${frag.perf}</div>`),
      sec('tdd-decisions', '13', 'Design decisions', 'What was chosen, and why', '', `<div class="tdd-md">${frag.decisions}</div>`),
      sec('tdd-gaps', '14', 'Known gaps and risks', 'What is not done yet, and where it shows', '', `<div class="tdd-md">${frag.gaps}</div>`),
      sec('tdd-next', '15', 'What comes next', 'The roadmap, area by area', '', `<div class="tdd-md">${frag.next}</div>`),
      sec('tdd-diagrams', 'A', 'Appendix A', 'The diagrams', 'Every diagram in ARCHITECTURE.md, each a Lucidchart document drawn with Google Cloud’s own icons, a page each. The link under each opens its source.',
        (() => { const rows = diagrams.map((d, i) => `<tr><td>A.${i + 1}</td><td>${esc(d.title)}</td><td>${esc(d.source)}</td></tr>`); const half = Math.ceil(rows.length / 2); return `<div class="tdd-index-wrap"><table class="tdd-index">${rows.slice(0, half).join('')}</table><table class="tdd-index">${rows.slice(half).join('')}</table></div>`; })() + diagrams.map((d, i) => `<div class="tdd-fig"><div class="fh"><b>A.${i + 1}</b><h3>${esc(d.title)}</h3></div>
          <p class="cap">${esc(d.alt)}</p><div class="img"><img src="${d.src}" alt=""></div>
          <p class="src">Lucid: ${esc(d.source)} · <span>${esc(d.link)}</span></p></div>`).join(''), true),
      sec('tdd-glossary', 'B', 'Appendix B', 'Glossary', '', `<dl class="tdd-gloss">${GLOSSARY.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`, true),
      h(`<section class="tdd-full tdd-back tdd-only" id="tdd-back">
        <img class="tdd-plate" src="${plates.day}" alt="">
        <div class="tdd-shade"></div>
        <div class="tdd-cover-body">
          <div class="tdd-brand">${mark}<span class="wordmark">Smart&#8209;Clearance</span></div>
          <h2 class="tdd-title">Every near-expiry carton gets a second chance.</h2>
          <div class="tdd-links">
            <span><b>Source</b> · github.com/aibuilder2026/smart-clearance</span>
            <span><b>Landing page</b> · smartclearance.web.app</span>
            <span><b>Guided demo</b> · smartclearance-demo.web.app</span>
            <span><b>Workspace</b> · munchly-smartclearance.web.app</span>
            <span><b>Console</b> · smartclearance-console.web.app</span>
            <span style="margin-top:4mm;color:#8aa597">${META.ref} · version ${META.version} · ${META.date}. Every company, person and figure in Smart-Clearance is fictional.</span>
          </div>
        </div>
        <div class="tdd-band"><i></i><i></i><i></i><i></i></div>
      </section>`),
    ];
    for (const b of back) main.appendChild(b);
  },
  {
    META, SECTIONS, diagrams, GLOSSARY, frag, pages,
    plates: { night: url('design3/site/assets/plates/scene-night.webp'), day: url('design3/site/assets/plates/table.webp') },
  },
);

// every image in, then print
await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))));
await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log(`printed ${out}: ${diagrams.length} diagrams`);
