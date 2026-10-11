// The receipt maker (SC-174): each staff sale's consolidated receipt, as its distributor prints it from his books and
// sends it with the sale, photographed on his desk. The receipt is the batch's own (design3/core: data.js lists the
// payments, papers.js staffPayments makes them): the letterhead, every staff payment by its UPI reference, the total in
// words, his signature over his firm's stamp (system/img/signatures, system/img/seals). It is printed onto a Qwen-Image
// base photo of a blank A5 sheet (bases/, with their prompts) by the label maker's compositor (labels/compose.mjs), which
// warps it onto the sheet's quad and multiplies it in, so the paper's curl and the light stay. Every person, payment and
// number is fictional.
//   node design3/system/receipts/make.mjs        writes system/img/receipts/<batch>.webp and its .prompt.json
// The bases' quads are found by labels/quad.py (uv run --with numpy --with pillow --with scipy).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const design3 = join(here, "../..");
const ctx = { console, Date, Math, JSON };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ["core/money.js", "core/papers.js", "core/data.js"]) vm.runInContext(readFileSync(join(design3, f), "utf8"), ctx, { filename: f });
const D = ctx.SC3_DATA, P = ctx.SC3_PAPERS;

// every staff sale with a receipt: the history's, then the stories' (the Mango Drink's)
const staffPrice = plan => plan.lines.find(l => l.id === "staff").price;
const list = D.HISTORY.batches.filter(b => b.staffReceipt).map(b => ({ ref: b.ref, dist: D.DISTRIBUTORS[b.distributor], sku: D.SKUS[b.sku], r: b.staffReceipt, price: staffPrice(b.plan) }))
  .concat(Object.values(D.STORIES).filter(S => S.staffReceipt).filter((S, i, all) => all.findIndex(x => x.batch.id === S.batch.id) === i)
    .map(S => ({ ref: S.batch.id, dist: S.dist, sku: S.sku, r: S.staffReceipt, price: staffPrice(S.plan) })));
const BASES = JSON.parse(readFileSync(join(here, "bases.json"), "utf8"));
const dmy = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const n2 = n => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const img = (dir, id) => "file://" + join(design3, "system/img", dir, `${id}.webp`);

function page({ dist, sku, r, price }) {
  const sg = dist.signatory, rows = r.payments.length, fs = rows > 20 ? 10 : 10.8;
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&family=Geist+Mono:wght@400&display=block">
<style>*{box-sizing:border-box}html,body{margin:0}body{width:560px;height:792px;padding:26px 28px;background:#fff;color:#1c1c1a;font:400 ${fs}px/1.36 Geist,sans-serif;display:flex;flex-direction:column;gap:7px}
.lh{text-align:center;border-bottom:1.6px solid #2b2b28;padding-bottom:6px}.lh b{display:block;font-size:17px;letter-spacing:.08em}.lh span{display:block;font-size:9.6px;color:#4a4a45}
.t{text-align:center;font-weight:700;letter-spacing:.06em;font-size:12px}.m{display:flex;justify-content:space-between}p{margin:0}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #8d8a80;padding:1.5px 4px;text-align:left;font-variant-numeric:tabular-nums}th{background:#efece2;font-weight:700}
.r{text-align:right}.mono{font-family:"Geist Mono",monospace;font-size:${fs - 0.6}px}tr.tot td{font-weight:700}
.sign{margin-top:auto;display:grid;justify-items:end;gap:2px}.ink{position:relative;height:84px;width:210px}.ink img{position:absolute}.seal{width:172px;left:6px;top:-2px;opacity:.84;mix-blend-mode:multiply}.hand{height:44px;right:6px;top:20px}</style></head>
<body><div class="lh"><b>${esc(dist.name.toUpperCase())}</b><span>${esc(dist.address)}</span><span>GSTIN ${dist.gstin} · ${esc(dist.email)}</span></div>
<div class="t">CONSOLIDATED RECEIPT · STAFF SALE</div>
<div class="m"><span>No. <b>${r.no}</b></span><span>Date <b>${dmy(r.date)}</b></span></div>
<p>Received from our staff at ${esc(dist.godown)}, by UPI to <b>${esc(dist.upi)}</b>, for ${esc(sku.brand)} ${esc(sku.name)}, batch <b>${r.ref || ""}</b>, at ₹${n2(price)} a pack, sold under ${esc(D.CLIENT.short)}${D.CLIENT.short.endsWith("s") ? "'" : "'s"} staff sale:</p>
<table><thead><tr><th>#</th><th>UPI Ref. No.</th><th>Date, time</th><th>Paid by</th><th class="r">Packs</th><th class="r">₹</th></tr></thead><tbody>
${r.payments.map(p => `<tr><td>${p.n}</td><td class="mono">${p.rrn}</td><td>${dmy(p.at).slice(0, 5)} ${p.at.slice(11, 16)}</td><td>${esc(p.who)}</td><td class="r">${p.units}</td><td class="r">${n2(p.amount)}</td></tr>`).join("")}
<tr class="tot"><td colspan="4">${rows} payments</td><td class="r">${r.units}</td><td class="r">${n2(r.paid)}</td></tr></tbody></table>
<p>Rupees ${esc(P.words(r.paid).replace(/^INR /, ""))}.</p>
<div class="sign"><div class="ink"><img class="seal" src="${img("seals", sg.seal)}"><img class="hand" src="${img("signatures", sg.sign)}"></div><span>${esc(sg.name)}, ${esc(sg.title)}</span></div>
<script>document.fonts.ready.then(()=>Promise.all([...document.images].map(i=>i.decode()))).then(()=>{document.body.dataset.fit="1"})</script></body></html>`;
}

const out = join(design3, "system/img/receipts"), src = join(here, "src");
mkdirSync(out, { recursive: true }); mkdirSync(src, { recursive: true });
const jobs = list.map((x, i) => {
  const base = BASES[x.ref] || Object.values(BASES)[i % Object.keys(BASES).length];
  const html = join(src, `${x.ref}.html`);
  writeFileSync(html, page(Object.assign({}, x, { r: Object.assign({ ref: x.ref }, x.r) })));
  return { x, base, job: { base: join(here, base.file), label: html, out: join(out, `${x.ref}.webp`), png: join(src, `${x.ref}.png`), quad: base.quad, size: { w: 560, h: 792 }, blur: 0.35, quality: 88, scan: false } };
});
writeFileSync(join(src, "jobs.json"), JSON.stringify(jobs.map(j => j.job), null, 1));
execFileSync("node", [join(here, "../labels/compose.mjs"), join(src, "jobs.json")], { stdio: "inherit" });
for (const { x, base } of jobs)
  writeFileSync(join(out, `${x.ref}.prompt.json`), JSON.stringify({
    model: "Qwen-Image 2.1 (bf16, local)", prompt: base.prompt, aspect: "3:4", size: 2048, seed: base.seed,
    post: `the batch's consolidated receipt (system/receipts/make.mjs: ${x.r.no}, ${x.r.payments.length} UPI payments, ₹${n2(x.r.paid)}) printed onto the sheet by labels/compose.mjs, warped onto its quad and multiplied, blur 0.35 px; WebP q88`,
    use: `SC-174: the photo of ${x.dist.name}'s consolidated receipt for the staff sale of batch ${x.ref} (fictional firm, staff and payments)`,
  }, null, 2) + "\n");
console.log(jobs.map(j => j.x.ref).join(" "));
