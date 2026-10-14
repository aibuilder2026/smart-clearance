// SC-209: the two clusters' shops, by area, for the film's maps (design3's own scripts in the page's order, as frontend/scripts/seed.mjs runs them).
//   node dump-kiranas.mjs ../../.. > kiranas.json
import fs from 'node:fs';
import vm from 'node:vm';
const dir = process.argv[2];
const window = { SC3_IMG: 'sc3img:/' };
const store = new Map();
const localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const ctx = vm.createContext({ window, localStorage, console, Date, Intl, Math, JSON, structuredClone });
for (const f of ['core/money.js', 'core/papers.js', 'core/data.js', 'core/store.js', 'core/platform.js', 'core/world.js'])
  vm.runInContext(fs.readFileSync(`${dir}/${f}`, 'utf8'), ctx, { filename: f });
const W = window.SC3_WORLD;
const pick = (d) => W.KIRANAS.filter(k => k.distributor === d).map(k => ({ id: k.id, name: k.name, area: k.area, orders: k.orders }));
console.log(JSON.stringify({ nagpur: pick('rakesh'), hyderabad: pick('lakshmi') }));
