// SC-49's review world: the console's seed (Munchly Foods) plus four fictional clients and 30 days of their batches,
// as backend-api's hydrate builds them, so the Overview's charts and the agents have something to show. Every company,
// person and figure here is fictional and illustrative. window.SC49_TICK moves the agents on: one batch a stop, an
// approval, or a batch closed with what it recovered, each with its run, as backend-api's readings would show them.
(function () {
  var P = window.SC3_PLATFORM, D = window.SC3_DATA;
  if (!P) return;
  var seed = 49;
  var rnd = function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  var pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
  var int = function (lo, hi) { return lo + Math.floor(rnd() * (hi - lo + 1)); };
  var addDays = D.addDays, TODAY = P.TODAY;
  var iso = function (day, hour, min) { return day + "T" + String(hour).padStart(2, "0") + ":" + String(min).padStart(2, "0") + ":00+05:30"; };
  var CLIENTS = [
    { name: "Godavari Staples", city: "Patna", industry: "Staples", colour: "#be123c", plan: "growth", prefix: "GS",
      skus: [["toor", "Toor Dal 1 kg", 160, 270], ["rice", "Sona Masoori Rice 5 kg", 420, 365], ["besan", "Besan 500 g", 70, 180], ["oil", "Sunflower Oil 1 L", 180, 270]],
      dists: [["sharma", "Sharma Traders", "Patna"], ["kumar", "Kumar Agencies", "Patna"], ["yadav", "Yadav & Sons", "Muzaffarpur"]] },
    { name: "Annapurna Naturals", city: "Pune", industry: "Staples", colour: "#16a34a", plan: "growth", prefix: "AN",
      skus: [["ragi", "Ragi Flour 1 kg", 90, 180], ["gnut", "Groundnut Oil 1 L", 240, 270], ["jaggery", "Jaggery Powder 500 g", 80, 270]],
      dists: [["kulkarni", "Kulkarni Distributors", "Pune"], ["joshi", "Joshi & Sons", "Nashik"]] },
    { name: "Vindhya Snacks", city: "Gaya", industry: "Snacks and drinks", colour: "#15803d", plan: "pilot", prefix: "VS",
      skus: [["bhujia", "Aloo Bhujia 200 g", 50, 180], ["thekua", "Thekua 250 g", 60, 120], ["makhana", "Makhana Masala 80 g", 90, 180]],
      dists: [["mishra", "Mishra Agencies", "Gaya"], ["sinha", "Sinha Distributors", "Bhagalpur"]] },
    { name: "Konkan Snacks", city: "Ratnagiri", industry: "Snacks and drinks", colour: "#c2410c", plan: "pilot", prefix: "KS",
      skus: [["kokum", "Kokum Sherbet 750 ml", 140, 365], ["chivda", "Poha Chivda 200 g", 55, 150], ["lemon", "Lemon Drink 250 ml", 25, 180]],
      dists: [["mital", "Mital Distributors", "Pune"], ["talwar", "Talwar & Sons", "Ratnagiri"]] },
  ];
  var AGENT_AT = ["data", "watcher", "vision", "valuer", "router", "gate", "lister", "paperwork", "impact"];
  var SAYS = {
    watcher: function (b) { return b.ref + " at risk, " + b.left + " days left"; },
    vision: function (b) { return b.ref + ": label read, confidence 0.9" + int(3, 8); },
    valuer: function (b) { return b.ref + ": exits priced"; },
    router: function (b) { return b.ref + ": plan sent for a yes"; },
    gate: function (b) { return "Approved " + b.ref; },
    lister: function (b) { return b.ref + ": listed and offered"; },
    paperwork: function (b) { return b.ref + ": invoice and credit note drafted"; },
    impact: function (b) { return b.ref + ": closed, " + b.recovered + " recovered"; },
  };

  // the world, once a fresh state is seeded (the mockups start from the seed on every load)
  P.update(function (d) {
    if (d.sc49) return;
    d.sc49 = true;
    CLIENTS.forEach(function (x) {
      var slug = P.slug(x.name);
      var c = P.buildClient({ name: x.name, city: x.city, industry: x.industry, emailDomain: slug + ".example", colour: x.colour, plan: x.plan, preset: "standard", route: "distributors", owner: "distributor", expiry: "full-credit", adminName: "Workspace admin", adminEmail: "admin@" + slug + ".example", signGoogle: true, signPhone: true });
      c.status = "live"; c.since = "8 Sep 2026";
      c.people[0].status = "active";
      c.skus = x.skus.map(function (k) { return { id: k[0], code: x.prefix + "-" + k[0].slice(0, 2).toUpperCase() + "-" + k[2], brand: x.name.split(" ")[0], name: k[1], mrp: k[2], gst: 0.05, lifeDays: k[3], gates: {} }; });
      c.distributors = x.dists.map(function (k) { return { id: k[0], name: k[1], city: k[2], state: null, kiranas: int(18, 60), staffCap: null, permission: "given" }; });
      d.clients.push(c);
      var n = 100;
      for (var ago = 30; ago >= 0; ago--) {
        var day = addDays(TODAY, -ago), count = ago ? pick([0, 1, 1, 2, 2]) : pick([1, 2]);
        for (var i = 0; i < count; i++) {
          var sku = pick(c.skus), dist = pick(c.distributors), units = int(300, 2400), takes = int(1, 6);
          var left = Math.max(4, Math.round(sku.lifeDays * (0.08 + rnd() * 0.22)));
          var b = { client: c.id, ref: x.prefix + "-2610-" + (++n), sku: sku.id, distributor: dist.id, units: units, bestBefore: addDays(day, left), openedAt: iso(day, int(8, 11), int(0, 59)), recovered: 0 };
          if (ago - takes >= 1) { b.done = b.current = 9; b.closedAt = iso(addDays(TODAY, -(ago - takes)), int(11, 18), int(0, 59)); b.recovered = Math.round(units * sku.mrp * (0.38 + rnd() * 0.24)); b.outcome = "cleared"; }
          else { var at = rnd() < 0.25 ? 5 : Math.max(1, Math.min(8, 1 + Math.round(7 * (ago + 0.5) / takes))); b.done = b.current = at; if (at === 8) b.recovered = Math.round(units * sku.mrp * 0.45); }
          d.batches.push(b);
        }
      }
    });
    // today's runs for the new clients, oldest last as the console lists them
    var more = [];
    d.batches.filter(function (b) { return !b.closedAt && b.client !== "munchly"; }).slice(0, 14).forEach(function (b, i) {
      var agent = AGENT_AT[Math.max(1, Math.min(8, b.current))];
      more.push({ at: String(8 + Math.floor(i / 4)).padStart(2, "0") + ":" + String((i * 13) % 60).padStart(2, "0"), agent: agent, client: b.client, text: SAYS[agent]({ ref: b.ref, left: 20, recovered: "₹0" }) });
    });
    d.runs = d.runs.concat(more).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  });

  // the agents move on: a batch to its next stop, a yes at Approve, or a batch closed with what it recovered
  var hhmm = function () { var t = new Date(); return String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0"); };
  window.SC49_TICK = function (who) {
    P.update(function (d) {
      var open = d.batches.filter(function (b) { return !b.closedAt; });
      var moves = Math.min(open.length, 1 + Math.floor(rnd() * 2));
      for (var k = 0; k < moves; k++) {
        var b = pick(open), c = d.clients.find(function (x) { return x.id === b.client; }), sku = c && c.skus.find(function (s) { return s.id === b.sku; });
        if (!sku) continue;
        var agent, text;
        if (b.current >= 8) {
          b.done = b.current = 9; b.closedAt = new Date().toISOString(); b.recovered = b.recovered || Math.round(b.units * sku.mrp * 0.45); b.outcome = "cleared";
          agent = "impact"; text = SAYS.impact({ ref: b.ref, recovered: "₹" + b.recovered.toLocaleString("en-IN") });
        } else {
          // the run is the work of the stop the batch leaves: the Router sends it for a yes, the yes releases it
          agent = AGENT_AT[Math.max(1, b.current)]; text = SAYS[agent]({ ref: b.ref, left: 18, recovered: "" });
          b.done = b.current = b.current + 1;
          if (b.current === 8) b.recovered = Math.round(b.units * sku.mrp * (0.4 + rnd() * 0.15));
        }
        d.runs.unshift({ at: hhmm(), agent: agent, client: b.client, text: text, fresh: Date.now() });
      }
    });
  };
})();
