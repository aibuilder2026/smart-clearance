/* What the GST papers print beyond their figures (SC-148): the e-invoice's IRN, acknowledgement and signed QR code, the
   amount in words, the financial year, and the invoice Munchly billed a batch to its distributor on, which a credit note
   is against. Every figure stays money.js's; these are worked out from a paper and its two parties wherever the paper is
   drawn (the prototype, core's port in frontend/core/src/lib/workspace/papers.ts, the agents' PDFs), so nothing is kept.
   Every GSTIN, IRN and number is fictional: an IRN is the portal's own recipe (SHA-256 of the supplier's GSTIN, the year,
   the type and the number), and the signed QR's signature says it is illustrative.
   window.SC3_PAPERS: { sha256, qr, words, fy, einvoice, dispatchOf, staffPayments, staffReceipt, destructionLog }.
   SC-174 adds the staff sale's consolidated receipt (its payments, each by its UPI reference) and the certificate of
   destruction's log */
(function () {
  "use strict";

  /* ---------- SHA-256, of a string's UTF-8 bytes ---------- */
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
    0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
    0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70,
    0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function utf8(s) { return Array.from(unescape(encodeURIComponent(s)), c => c.charCodeAt(0)); }
  function sha256(s) {
    const b = utf8(s), n = b.length;
    let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    b.push(0x80); while (b.length % 64 !== 56) b.push(0);
    const bits = n * 8; for (let i = 7; i >= 0; i--) b.push(i >= 4 ? 0 : (bits >>> (i * 8)) & 0xff);
    const r = (x, k) => (x >>> k) | (x << (32 - k)), w = new Array(64);
    for (let o = 0; o < b.length; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = (b[o + 4 * i] << 24) | (b[o + 4 * i + 1] << 16) | (b[o + 4 * i + 2] << 8) | b[o + 4 * i + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, bb, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const t1 = (hh + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      h = [a, bb, c, d, e, f, g, hh].map((x, i) => (x + h[i]) | 0);
    }
    return h.map(x => (x >>> 0).toString(16).padStart(8, "0")).join("");
  }

  /* ---------- a QR code (ISO/IEC 18004): byte mode, versions 1 to 40, the mask chosen by its penalty ---------- */
  // error-correction codewords per block, and blocks, by level (L, M, Q, H) and version
  const ECC = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  ];
  const BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
  ];
  const LEVEL = { L: 0, M: 1, Q: 2, H: 3 }, FORMAT = [1, 0, 3, 2];
  const rawModules = v => { let n = (16 * v + 128) * v + 64; if (v >= 2) { const a = Math.floor(v / 7) + 2; n -= (25 * a - 10) * a - 55; if (v >= 7) n -= 36; } return n; };
  const dataCodewords = (v, e) => Math.floor(rawModules(v) / 8) - ECC[e][v] * BLOCKS[e][v];
  const gfMul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 0xff; };
  function rsDivisor(deg) {
    const out = new Array(deg).fill(0); out[deg - 1] = 1; let root = 1;
    for (let i = 0; i < deg; i++) { for (let j = 0; j < deg; j++) { out[j] = gfMul(out[j], root); if (j + 1 < deg) out[j] ^= out[j + 1]; } root = gfMul(root, 0x02); }
    return out;
  }
  function rsRemainder(data, div) {
    const out = div.map(() => 0);
    for (const b of data) { const f = b ^ out.shift(); out.push(0); div.forEach((c, i) => { out[i] ^= gfMul(c, f); }); }
    return out;
  }
  function alignment(v) {
    if (v === 1) return [];
    const n = Math.floor(v / 7) + 2, step = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2, out = [6];
    for (let p = v * 4 + 10; out.length < n; p -= step) out.splice(1, 0, p);
    return out;
  }
  function qr(text, level = "M", force) {
    const e = LEVEL[level], bytes = utf8(text);
    let v = 1;
    for (; v <= 40; v++) if (4 + (v <= 9 ? 8 : 16) + bytes.length * 8 <= dataCodewords(v, e) * 8) break;
    if (v > 40) throw new Error("qr: too long");
    if (force && force.version) v = force.version;
    // the data: mode, count, bytes, terminator, padding
    const bits = [], put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, v <= 9 ? 8 : 16); bytes.forEach(b => put(b, 8));
    const cap = dataCodewords(v, e) * 8;
    put(0, Math.min(4, cap - bits.length)); put(0, (8 - (bits.length % 8)) % 8);
    for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
    const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));
    // error correction, by block, interleaved
    const nb = BLOCKS[e][v], el = ECC[e][v], raw = Math.floor(rawModules(v) / 8), short = nb - (raw % nb), shortLen = Math.floor(raw / nb);
    const div = rsDivisor(el), blocks = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const d = data.slice(k, k + shortLen - el + (i < short ? 0 : 1)); k += d.length;
      const blk = d.concat(rsRemainder(d, div)); if (i < short) blk.splice(shortLen - el, 0, 0); blocks.push(blk);
    }
    const all = [];
    for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - el || j >= short) all.push(b[i]); });
    // the matrix: function patterns, then the codewords zigzagged, then the mask with the lowest penalty
    const size = v * 4 + 17, base = [], fn = [];
    for (let y = 0; y < size; y++) { base.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    const set = (x, y, dark) => { base[y][x] = dark; fn[y][x] = true; };
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy)); if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4); } };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    const al = alignment(v), na = al.length;
    for (let i = 0; i < na; i++) for (let j = 0; j < na; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    const format = (m, grid) => {
      const d = (FORMAT[e] << 3) | m; let rem = d; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const b = ((d << 10) | rem) ^ 0x5412, bit = i => ((b >>> i) & 1) === 1, put2 = (x, y, dark) => { grid[y][x] = dark; fn[y][x] = true; };
      for (let i = 0; i <= 5; i++) put2(8, i, bit(i));
      put2(8, 7, bit(6)); put2(8, 8, bit(7)); put2(7, 8, bit(8));
      for (let i = 9; i < 15; i++) put2(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) put2(size - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) put2(8, size - 15 + i, bit(i));
      put2(8, size - 8, true);
    };
    format(0, base);
    if (v >= 7) {
      let rem = v; for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
      const b = (v << 12) | rem;
      for (let i = 0; i < 18; i++) { const dark = ((b >>> i) & 1) === 1, a = size - 11 + (i % 3), c = Math.floor(i / 3); set(a, c, dark); set(c, a, dark); }
    }
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && i < all.length * 8) { base[y][x] = ((all[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; }
      }
    }
    const masks = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
      (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0];
    const apply = m => { const g = base.map(row => row.slice()); for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && masks[m](x, y)) g[y][x] = !g[y][x]; format(m, g); return g; };
    let best = null;
    const order = force && force.mask != null ? [force.mask] : [0, 1, 2, 3, 4, 5, 6, 7];
    for (const m of order) { const g = apply(m), p = penalty(g); if (!best || p < best.p) best = { g, p, m }; }
    return { version: v, mask: best.m, size, modules: best.g };
  }
  function penalty(g) {
    const n = g.length; let p = 0, dark = 0;
    const lines = []; for (let y = 0; y < n; y++) lines.push(g[y]); for (let x = 0; x < n; x++) lines.push(g.map(r => r[x]));
    const finderish = [true, false, true, true, true, false, true];
    for (const ln of lines) {
      let run = 1;
      for (let k = 1; k <= n; k++) { if (k < n && ln[k] === ln[k - 1]) run++; else { if (run >= 5) p += 3 + (run - 5); run = 1; } }
      for (let k = 0; k + 7 <= n; k++) {
        if (!finderish.every((b, t) => ln[k + t] === b)) continue;
        const before = k >= 4 && [1, 2, 3, 4].every(t => !ln[k - t]), after = k + 11 <= n && [7, 8, 9, 10].every(t => !ln[k + t]);
        if (before || after) p += 40;
      }
    }
    for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) { const c = g[y][x]; if (c === g[y][x + 1] && c === g[y + 1][x] && c === g[y + 1][x + 1]) p += 3; }
    g.forEach(r => r.forEach(c => { if (c) dark++; }));
    return p + Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10;
  }
  /** a QR code as an SVG path: one unit a module, a 4-module quiet zone */
  function qrPath(q) {
    let d = "";
    q.modules.forEach((row, y) => row.forEach((dark, x) => { if (dark) d += `M${x + 4} ${y + 4}h1v1h-1z`; }));
    return { d, viewBox: `0 0 ${q.size + 8} ${q.size + 8}` };
  }

  /* ---------- the amount in words, as Indian invoices write it (lakh, crore) ---------- */
  const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = n => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : ""));
  const three = n => [n >= 100 ? ONES[Math.floor(n / 100)] + " Hundred" : "", n % 100 ? two(n % 100) : ""].filter(Boolean).join(" ");
  function inWords(n) {
    if (n === 0) return "Zero";
    const parts = [], crore = Math.floor(n / 1e7), lakh = Math.floor((n % 1e7) / 1e5), thousand = Math.floor((n % 1e5) / 1e3), rest = n % 1e3;
    if (crore) parts.push(inWords(crore) + " Crore");
    if (lakh) parts.push(two(lakh) + " Lakh");
    if (thousand) parts.push(two(thousand) + " Thousand");
    if (rest) parts.push(three(rest));
    return parts.join(" ");
  }
  /** "INR Eleven Thousand Five Hundred Ten Only", with the paise where there are any */
  function words(amount) {
    const rupees = Math.floor(Math.round(amount * 100) / 100), paise = Math.round(amount * 100) % 100;
    return `INR ${inWords(rupees)}${paise ? ` and ${two(paise)} Paise` : ""} Only`;
  }

  /* ---------- the financial year (April to March), long ("2026-27") or short ("26-27") ---------- */
  function fy(iso, short) {
    const y = +iso.slice(0, 4), m = +iso.slice(5, 7), start = m >= 4 ? y : y - 1, end = String((start + 1) % 100).padStart(2, "0");
    return short ? `${String(start % 100).padStart(2, "0")}-${end}` : `${start}-${end}`;
  }
  const b64 = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const ddmmyyyy = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

  /** an issued tax invoice's e-invoice (B2B, the supplier over ₹5 crore of turnover): its IRN, acknowledgement and the
   *  signed QR's text, a JWT of the invoice's key facts whose signature is illustrative. `inv`: { no, date (ISO),
   *  issuedAt? ("YYYY-MM-DDTHH:MM"), total, hsn }; the seller's and the buyer's GSTINs */
  function einvoice(inv, seller, buyer) {
    const at = inv.issuedAt || `${inv.date}T10:12`, irn = sha256(`${seller.gstin}${fy(inv.date)}INV${inv.no}`);
    const digits = Array.from(irn.slice(0, 11), c => parseInt(c, 16) % 10).join("");
    const ackNo = `11${fy(inv.date, true).slice(0, 2)}${digits}`;
    const ackDate = `${at.slice(0, 10)} ${at.slice(11, 16)}:00`;
    const data = { SellerGstin: seller.gstin, BuyerGstin: buyer.gstin, DocNo: inv.no, DocTyp: "INV", DocDt: ddmmyyyy(inv.date),
      TotInvVal: inv.total, ItemCnt: 1, MainHsnCode: inv.hsn, Irn: irn, IrnDt: ackDate };
    const signed = `${b64(JSON.stringify({ alg: "RS256", kid: "illustrative", typ: "JWT" }))}.${b64(JSON.stringify({ data: JSON.stringify(data) }))}.illustrative-signature`;
    return { irn, ackNo, ackDate, signed };
  }

  /** the invoice Munchly billed the batch to its distributor on, three days after it was made: MFL/<year>/<number> */
  function dispatchOf(batch) {
    const d = new Date(`${batch.mfg}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 3);
    const date = d.toISOString().slice(0, 10);
    return { no: `MFL/${fy(date, true)}/${String(2300 + +batch.id.slice(-3)).padStart(5, "0")}`, date };
  }

  /* ---------- the staff sale's consolidated receipt (SC-174) ---------- */
  // a seeded stream from a batch's id, so a batch always gets the same payments
  function seeded(s) {
    let h = 2166136261;
    for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return () => (h = (Math.imul(h, 1103515245) + 12345) >>> 0) / 4294967296;
  }
  const pad2 = n => String(n).padStart(2, "0");
  const istMs = iso => Date.parse(`${iso}:00+05:30`);
  const istIso = ms => { const t = new Date(ms + 330 * 60000); return `${t.getUTCFullYear()}-${pad2(t.getUTCMonth() + 1)}-${pad2(t.getUTCDate())}T${pad2(t.getUTCHours())}:${pad2(t.getUTCMinutes())}`; };
  /** every staff member's UPI payment into the distributor's own address for a staff sale: packs of 2 to 12 each, from
   *  the staff list in a seeded order, spread over the sale's working hours (09:00 to 19:30) between `opens` and
   *  `closes` (IST, "YYYY-MM-DDTHH:MM"). Each carries its UPI reference, the 12-digit RRN a payer's app shows: the
   *  year's last digit, the day of the year and the hour, then six digits. Fictional: no real payment or person */
  function staffPayments({ ref, units, price, staff, opens, closes }) {
    const rnd = seeded(ref), sizes = [];
    for (let left = units; left > 0;) { const n = Math.min(left, 2 + Math.floor(rnd() * 11)); sizes.push(n); left -= n; }
    const names = staff.slice();
    for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
    while (sizes.length > names.length) sizes[sizes.length - 2] += sizes.pop();
    // the sale's working minutes, day by day
    const spans = [];
    for (let day = istMs(opens.slice(0, 10) + "T00:00"); day <= istMs(closes); day += 864e5) {
      const a = Math.max(day + 9 * 36e5, istMs(opens)), z = Math.min(day + 19.5 * 36e5, istMs(closes));
      if (z > a) spans.push([a, z]);
    }
    const total = spans.reduce((t, [a, z]) => t + (z - a), 0);
    const at = f => { let m = f * total; for (const [a, z] of spans) { if (m <= z - a) return a + m; m -= z - a; } return spans[spans.length - 1][1]; };
    let last = 0;
    return sizes.map((n, i) => {
      const ms = Math.max(last + 60000, Math.floor(at((i + 0.15 + rnd() * 0.7) / sizes.length) / 60000) * 60000); last = ms;
      const when = istIso(ms), doy = Math.round((Date.parse(when.slice(0, 10)) - Date.parse(when.slice(0, 4) + "-01-01")) / 864e5) + 1;
      const who = names[i], vpa = who.toLowerCase().replace(/[^a-z]/g, "").slice(0, 5) + "••••@exampleupi";
      const rrn = `${when.slice(3, 4)}${String(doy).padStart(3, "0")}${when.slice(11, 13)}${String(Math.floor(rnd() * 1e6)).padStart(6, "0")}`;
      return { n: i + 1, who, vpa, at: when, rrn, units: n, amount: Math.round(n * price * 100) / 100 };
    });
  }
  /** the consolidated receipt a distributor issues for a staff sale, from its payments: its number in his own receipt
   *  series, dated the last payment's day */
  function staffReceipt({ no, payments }) {
    const paid = Math.round(payments.reduce((t, p) => t + p.amount, 0) * 100) / 100, units = payments.reduce((t, p) => t + p.units, 0);
    return { no, date: payments[payments.length - 1].at.slice(0, 10), payments, units, paid, from: payments[0].at, to: payments[payments.length - 1].at };
  }

  /* ---------- the certificate of destruction's log (SC-174, option B) ---------- */
  const plus = (iso, min) => istIso(istMs(iso) + min * 60000);
  /** the destruction step by step, from the godown to the cover: worked out from the two photos' times, the window the
   *  agency destroyed them in, the agency's facility, vehicle and method, and the packs. `d`: the certificate's fields
   *  ({ units, kg, packKg, batch, no, from (the godown), destroyedOn (ISO day), window: { from, to } ("HH:MM"),
   *  photos: { before: { at } }, agency, vehicle, facility: { name }, method: "landfill" | "incineration" }) */
  function destructionLog(d) {
    const on = d.destroyedOn, start = `${on}T${d.window.from}`, end = `${on}T${d.window.to}`;
    // the before photo's time, where it leaves room to load and drive before the window opens
    const shot = d.photos && d.photos.before && d.photos.before.at;
    const before = shot && istMs(shot) <= istMs(start) - 35 * 60000 ? shot : plus(start, -75);
    const seq = String(d.no).split("/").pop(), kg = n => `${(Math.round(n * 100) / 100).toFixed(2)} kg`;
    const burnt = d.method === "incineration", mid = plus(start, Math.max(5, Math.min(15, Math.round((istMs(end) - istMs(start)) / 60000) - 5)));
    return [
      { at: before, step: "Photographed at the godown", detail: `${d.units} packs at ${d.from}, the carton's batch label in view`, photo: "before" },
      { at: plus(before, 20), step: "Loaded", detail: `On ${/s$/.test(d.agency) ? d.agency + "'" : d.agency + "'s"} covered vehicle ${d.vehicle}, sealed with seal SL-${seq}` },
      { at: plus(start, -15), step: "Received and weighed", detail: `${kg(d.kg)} on weighbridge slip WB/${fy(on, true)}/${seq}, at the facility's gate` },
      { at: start, step: burnt ? "Fed to the incinerator" : "Slit open and emptied", detail: burnt ? "Whole, at 850 °C or more; the plastic packaging set aside first" : "Into the active cell, the plastic packaging set aside" },
      { at: mid, step: burnt ? "Burnt" : "Buried and covered", detail: burnt ? "The ash to the facility's secured landfill" : "Covered with 30 cm of soil" },
      { at: end, step: "Photographed with the slate", detail: `Slate: ${d.batch} · ${d.units} packs · ${ddmmyyyy(on)}`, photo: "after" },
      { at: plus(end, 10), step: "Packaging sent on", detail: `${kg(d.packKg)} of plastic film to an EPR-registered recycler` },
    ];
  }

  const api = { sha256, qr, qrPath, words, fy, einvoice, dispatchOf, staffPayments, staffReceipt, destructionLog };
  if (typeof window !== "undefined") window.SC3_PAPERS = api;
  if (typeof module !== "undefined") module.exports = api;
})();
