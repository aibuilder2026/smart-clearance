// SC-149's review world: the console's seed (Munchly Foods) plus four fictional clients and 180 days of their batches,
// as backend-api's hydrate builds them, so the Overview's 7, 30 and 90 days (and the range before each) have something
// to show. A closed batch keeps what it recovered and, new here, the packs no channel took and that were destroyed
// (`destroyed`); each SKU carries its kilos a pack and its cost. Every company, person and figure here is fictional and
// illustrative. window.SC149_DASH(s, opts) is P.dashboard with the food added, as backend-api would answer it.
(function () {
  var P = window.SC3_PLATFORM, D = window.SC3_DATA;
  if (!P) return;
  var seed = 149;
  var rnd = function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  var pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
  var int = function (lo, hi) { return lo + Math.floor(rnd() * (hi - lo + 1)); };
  var addDays = D.addDays, TODAY = P.TODAY, DAYS = 180;
  var iso = function (day, hour, min) { return day + "T" + String(hour).padStart(2, "0") + ":" + String(min).padStart(2, "0") + ":00+05:30"; };
  // [id, name, MRP, shelf life in days, kg a pack]
  var CLIENTS = [
    { name: "Godavari Staples", city: "Patna", industry: "Staples", colour: "#be123c", plan: "growth", prefix: "GS",
      skus: [["toor", "Toor Dal 1 kg", 160, 270, 1], ["rice", "Sona Masoori Rice 5 kg", 420, 365, 5], ["besan", "Besan 500 g", 70, 180, 0.5], ["oil", "Sunflower Oil 1 L", 180, 270, 0.92]],
      dists: [["sharma", "Sharma Traders", "Patna"], ["kumar", "Kumar Agencies", "Patna"], ["yadav", "Yadav & Sons", "Muzaffarpur"]] },
    { name: "Annapurna Naturals", city: "Pune", industry: "Staples", colour: "#16a34a", plan: "growth", prefix: "AN",
      skus: [["ragi", "Ragi Flour 1 kg", 90, 180, 1], ["gnut", "Groundnut Oil 1 L", 240, 270, 0.91], ["jaggery", "Jaggery Powder 500 g", 80, 270, 0.5]],
      dists: [["kulkarni", "Kulkarni Distributors", "Pune"], ["joshi", "Joshi & Sons", "Nashik"]] },
    { name: "Vindhya Snacks", city: "Gaya", industry: "Snacks and drinks", colour: "#15803d", plan: "pilot", prefix: "VS",
      skus: [["bhujia", "Aloo Bhujia 200 g", 50, 180, 0.2], ["thekua", "Thekua 250 g", 60, 120, 0.25], ["makhana", "Makhana Masala 80 g", 90, 180, 0.08]],
      dists: [["mishra", "Mishra Agencies", "Gaya"], ["sinha", "Sinha Distributors", "Bhagalpur"]] },
    { name: "Konkan Snacks", city: "Ratnagiri", industry: "Snacks and drinks", colour: "#c2410c", plan: "pilot", prefix: "KS",
      skus: [["kokum", "Kokum Sherbet 750 ml", 140, 365, 0.8], ["chivda", "Poha Chivda 200 g", 55, 150, 0.2], ["lemon", "Lemon Drink 250 ml", 25, 180, 0.26]],
      dists: [["mital", "Mital Distributors", "Pune"], ["talwar", "Talwar & Sons", "Ratnagiri"]] },
  ];
  var AGENT_AT = ["data", "watcher", "vision", "valuer", "router", "gate", "lister", "paperwork", "impact"];

  P.update(function (d) {
    if (d.sc149) return;
    d.sc149 = true;
    CLIENTS.forEach(function (x) {
      var slug = P.slug(x.name);
      var c = P.buildClient({ name: x.name, city: x.city, industry: x.industry, emailDomain: slug + ".example", colour: x.colour, plan: x.plan, preset: "standard", route: "distributors", owner: "distributor", expiry: "godown", adminName: "Workspace admin", adminEmail: "admin@" + slug + ".example", signGoogle: true, signPhone: true });
      c.status = "live"; c.since = "1 Apr 2026";
      c.people[0].status = "active";
      c.skus = x.skus.map(function (k) { return { id: k[0], code: x.prefix + "-" + k[0].slice(0, 2).toUpperCase() + "-" + k[2], brand: x.name.split(" ")[0], name: k[1], mrp: k[2], cost: Math.round(k[2] * 0.55 * 100) / 100, gst: 0.05, lifeDays: k[3], kgPerUnit: k[4], gates: {} }; });
      c.distributors = x.dists.map(function (k) { return { id: k[0], name: k[1], city: k[2], state: null, kiranas: int(18, 60), staffCap: null, permission: "given" }; });
      d.clients.push(c);
      var n = 100;
      for (var ago = DAYS; ago >= 0; ago--) {
        var day = addDays(TODAY, -ago), count = ago ? pick([0, 1, 1, 2, 2]) : pick([1, 2]);
        for (var i = 0; i < count; i++) {
          var sku = pick(c.skus), dist = pick(c.distributors), units = int(300, 2400), takes = int(1, 6);
          var left = Math.max(4, Math.round(sku.lifeDays * (0.08 + rnd() * 0.22)));
          var b = { client: c.id, ref: x.prefix + "-" + day.slice(2, 4) + day.slice(5, 7) + "-" + (++n), sku: sku.id, distributor: dist.id, units: units, kg: sku.kgPerUnit, bestBefore: addDays(day, left), openedAt: iso(day, int(8, 11), int(0, 59)), recovered: 0 };
          if (ago - takes >= 1) {
            // most batches clear whole; some leave packs no channel took, destroyed at the godown
            var share = rnd() < 0.42 ? 0.02 + rnd() * 0.23 : 0;
            b.destroyed = Math.round(units * share);
            b.done = b.current = 9; b.closedAt = iso(addDays(TODAY, -(ago - takes)), int(11, 18), int(0, 59));
            b.recovered = Math.round((units - b.destroyed) * sku.mrp * (0.38 + rnd() * 0.24)); b.outcome = "cleared";
          } else { var at = rnd() < 0.25 ? 5 : Math.max(1, Math.min(8, 1 + Math.round(7 * (ago + 0.5) / takes))); b.done = b.current = at; if (at === 8) b.recovered = Math.round(units * sku.mrp * 0.45); }
          d.batches.push(b);
        }
      }
    });
    var more = [];
    d.batches.filter(function (b) { return !b.closedAt && b.client !== "munchly"; }).slice(0, 14).forEach(function (b, i) {
      var agent = AGENT_AT[Math.max(1, Math.min(8, b.current))];
      more.push({ at: String(8 + Math.floor(i / 4)).padStart(2, "0") + ":" + String((i * 13) % 60).padStart(2, "0"), agent: agent, client: b.client, text: b.ref + (agent === "gate" ? ": waiting for a yes" : ": moved on") });
    });
    d.runs = d.runs.concat(more).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  });

  // the dashboard with the food: a closed batch's packs count on the day it closed, the ones kept out of landfill
  // (sold or given) and the ones destroyed, in kilos by its SKU's kilos a pack, and what destroying them cost (packs x cost)
  var IST = 19800000;
  var istDay = function (at) { return new Date(Date.parse(at) + IST).toISOString().slice(0, 10); };
  var r2 = function (v) { return Math.round(v * 100) / 100; };
  window.SC149_DASH = function (s, opts) {
    var out = P.dashboard(s, opts), days = out.days, today = (opts && opts.today) || P.TODAY;
    var first = addDays(today, -(days - 1)), before = addDays(first, -days);
    var per = {}, prior = { savedKg: 0, destroyedKg: 0, writtenOff: 0 };
    s.batches.forEach(function (b) {
      if (!b.closedAt) return;
      var c = s.clients.find(function (x) { return x.id === b.client; }), k = c && c.skus.find(function (x) { return x.id === b.sku; });
      if (!k) return;
      var day = istDay(b.closedAt), kg = k.kgPerUnit || 0, gone = b.destroyed || 0;
      var f = { savedKg: (b.units - gone) * kg, destroyedKg: gone * kg, destroyed: gone, writtenOff: gone * (k.cost || 0) };
      if (day >= first && day <= today) { var t = per[day] = per[day] || { savedKg: 0, destroyedKg: 0, destroyed: 0, writtenOff: 0 }; Object.keys(f).forEach(function (key) { t[key] += f[key]; }); }
      else if (day >= before && day < first) { prior.savedKg += f.savedKg; prior.destroyedKg += f.destroyedKg; prior.writtenOff += f.writtenOff; }
    });
    var sum = { savedKg: 0, destroyedKg: 0, destroyed: 0, writtenOff: 0 };
    out.byDay = out.byDay.map(function (x) {
      var t = per[x.date] || { savedKg: 0, destroyedKg: 0, destroyed: 0, writtenOff: 0 };
      Object.keys(sum).forEach(function (key) { sum[key] += t[key]; });
      return Object.assign({}, x, { savedKg: r2(t.savedKg), destroyedKg: r2(t.destroyedKg), destroyed: t.destroyed, writtenOff: r2(t.writtenOff) });
    });
    out.food = { savedKg: r2(sum.savedKg), destroyedKg: r2(sum.destroyedKg), destroyed: sum.destroyed, writtenOff: r2(sum.writtenOff),
      savedKgBefore: r2(prior.savedKg), destroyedKgBefore: r2(prior.destroyedKg), writtenOffBefore: r2(prior.writtenOff) };
    return out;
  };
})();
