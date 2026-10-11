// Smart-Clearance v3 · the guided demo's story (SC-167): the console first, then three journeys in Munchly's
// workspace, drawn by the director as lines on a route map. Each act is a line of stations; each station a stage of the
// journey with its beats. A beat is a person's move (who) or an agent's (agent); `focus` says which device it happens
// on; `desk` and `phone` say what each device shows (merged over the station's); `acts` are what the beat does to the
// stub's store (flow.js actions), and `done` says from the store that it has happened, so a move made in a device ticks
// it too. A beat with a lock screen or a sign-in is done when the visitor taps it. Every figure is money.js's, through
// data.js or computed here the same way; every company and person is fictional.
(function () {
  const D = window.SC3_DATA, M = window.SC3_MONEY, Flow = window.SC3_FLOW; const fmt = M.fmt;
  const P = D.PUSH, KL = D.PLAN.lines.find(l => l.id === "kirana"), ES = D.PLAN.lines.find(l => l.id === "expiresoon");
  const ML = id => D.storyOf("mango").plan.lines.find(l => l.id === id) || { units: 0 };
  const HERO = D.BATCHES.find(b => b.hero), CHIPS = D.SKUS[HERO.sku];
  const INVITE = { app: "Messages", icon: "message-circle", title: "Munchly Foods", body: `Munchly Foods has added Rakesh Traders to its Smart-Clearance workspace. Sign in at ${D.WORKSPACE.domain} with this number.` };

  // the journeys the stub runs (SC-168): the Mango Drink at Lakshmi Agencies, and the chips' slow week, where the last 8 of
  // the 31 shops that ordered do not and 144 packets are destroyed at the godown on expiry day
  const MS = D.storyOf("mango"), SS = D.storyOf("slow"), MJ = MS.journey, SJ = SS.journey, CJ = D.JOURNEY;
  const SHOP = (MS.kiranas.find(k => k.id === MS.shop) || { name: "A Hyderabad kirana" }).name;
  const SLOW = { left: SS.expiry.units, ordered: SS.kiranas.reduce((t, k) => t + k.units, 0) };
  // "Tue 6 Oct" as a beat's date, "Tuesday 6 October"
  const DAYS = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" }, MONTHS = { Oct: "October", Nov: "November" };
  const long = d => { const [w, n, m] = d.split(" "); return `${DAYS[w] || w} ${n} ${MONTHS[m] || m}`; };

  const ACTS = [
    /* ---------- the platform: Smart-Clearance's own console ---------- */
    { id: "console", console: true, title: "The platform", sub: "Smart-Clearance's console", place: "Bengaluru", who: ["neha"], minutes: 2,
      outcome: { value: null, line: "Five manufacturers live, each in its own workspace; Munchly's agents set up" },
      stations: [
        { id: "signin", title: "Sign in", date: "Sunday 11 October", desk: { console: "/overview" }, beats: [
          { text: "Neha Kulkarni signs in to the console with her work email", who: "neha", focus: "desk", time: "09:00", desk: { signin: true }, screen: "Console · sign-in" },
          { text: "The splash reads the platform, and the Overview opens", who: "neha", focus: "desk", time: "09:00", screen: "Console · Overview" },
        ] },
        { id: "overview", title: "Overview", date: "Sunday 11 October", desk: { console: "/overview" }, beats: [
          { text: "Every client at once: recovered this month, batches in flight, plans waiting for a yes, agent runs today", who: "neha", focus: "desk", time: "09:01", screen: "Overview · figures" },
          { text: "Agents at work: every client's batches on the nine stops, moving as the agents finish", agent: "Watcher", focus: "desk", time: "09:01", desk: { scrollTo: "Agents at work" }, screen: "Overview · Agents at work" },
          { text: "Food, by day: kilos kept out of landfill against the kilos destroyed", who: "neha", focus: "desk", time: "09:02", desk: { scrollTo: "Food, by day" }, screen: "Overview · Food, by day" },
        ] },
        { id: "clients", title: "Existing clients", date: "Sunday 11 October", desk: { console: "/clients" }, beats: [
          { text: "Five manufacturers, each in its own workspace at <client>-smartclearance.web.app", who: "neha", focus: "desk", time: "09:03", screen: "Clients" },
          { text: "Munchly Foods: live, its journey day, its agents on", who: "neha", focus: "desk", time: "09:03", desk: { console: "/clients/munchly/agents" }, screen: "A client · head" },
        ] },
        { id: "new", title: "A new client", date: "Sunday 11 October", desk: { console: "/overview" }, beats: [
          { text: "A demo request from the landing page: Kesari Foods, three distributors around Indore", who: "neha", focus: "desk", time: "09:04", desk: { scrollTo: "Demo requests" }, screen: "Overview · Demo requests" },
          { text: "Set up: the company, its workspace address, its supply chain, its exits, how much the agents may do, its admin and plan", who: "neha", focus: "desk", time: "09:05", desk: { console: "/new-client?request=rq-kesari" }, screen: "New client · seven steps" },
        ] },
        { id: "munchly", title: "Munchly's setup", date: "Sunday 11 October", desk: { console: "/clients/munchly/supply" }, beats: [
          { text: "Munchly's first stock export, uploaded by Neha and mapped by the Data agent: 312 rows, 9 batches", agent: "Data", focus: "desk", time: "09:06", screen: "Supply chain · First stock export" },
          { text: "Each SKU's quick-commerce gates, and the batches that carry their own", who: "neha", focus: "desk", time: "09:06", desk: { scrollTo: "SKUs" }, screen: "Supply chain · SKUs with gates" },
          { text: "The exits Munchly allows, and expired packs destroyed at the godown against evidence Priya approves", who: "neha", focus: "desk", time: "09:07", desk: { console: "/clients/munchly/rules" }, screen: "Channels & rules · Destroyed at the godown" },
        ] },
        { id: "agents", title: "Agent setup", date: "Sunday 11 October", desk: { console: "/clients/munchly/agents" }, beats: [
          { text: "Eleven agents in working order, each on Suggest, Ask or Act; the approval is always a person's", who: "neha", focus: "desk", time: "09:08", screen: "Agents · working order" },
          { text: "Each agent's runs and timers, in journey time, with Run now", agent: "Watcher", focus: "desk", time: "09:08", desk: { scrollTo: "Runs and timers" }, screen: "Agents · runs and timers" },
          { text: "Priya and Rakesh bhai are invited by email; Munchly's workspace is ready", who: "neha", focus: "desk", time: "09:09", desk: { console: "/clients/munchly/people" }, screen: "People" },
        ] },
      ] },

    /* ---------- journey 1: the chips, every pack sold ---------- */
    { id: "chips", title: "Masala Chips", sub: "Every pack sold", place: "Nagpur · Rakesh Traders", img: "pack-chips", batch: HERO.id, who: ["priya", "rakesh", "ganesh", "agrawal"], minutes: 6,
      outcome: { value: D.ACTUAL.net, line: `recovered, where the bin would have cost ${fmt.inr(D.PLAN.writeOff.total)} · nothing destroyed` },
      stations: [
        { id: "connect", stage: "connect", title: "Connect", date: "Thursday 1 October", scenario: "chips", ff: 0, desk: { who: "priya", route: "setup" }, phone: { who: "rakesh", lock: { who: "rakesh", push: null } }, figures: [{ label: "Destroying one packet costs", value: -D.PLAN.writeOff.perUnit, decimals: true, tone: "red" }], beats: [
          { text: `Priya opens ${D.WORKSPACE.domain} and signs in`, who: "priya", focus: "desk", time: "16:20", desk: { signin: "priya" }, screen: "Sign-in" },
          { text: "The export Neha mapped, the floors, the territory guard and the return window: she confirms", who: "priya", focus: "desk", time: "16:41", acts: [["connect"]], screen: "Setup" },
          { text: "Rakesh bhai's invitation lands on his phone", who: "rakesh", focus: "phone", time: "16:48", phone: { lock: { who: "rakesh", push: INVITE } }, screen: "Lock screen" },
          { text: "He signs in with his number and a one-time code", who: "rakesh", focus: "phone", time: "16:50", phone: { signin: "rakesh", lock: null }, screen: "Sign-in · one-time code" },
          { text: "He lets Smart-Clearance act in his name, inside Munchly's floors", who: "rakesh", focus: "phone", human: true, time: "16:52", acts: [["permit"]], phone: { route: "home", lock: null }, screen: "Today · permission" },
        ] },
        { id: "detect", stage: "detect", scenario: "chips", title: "Detect", date: "Friday 2 October", ff: 1, desk: { who: "priya", route: "command" }, phone: { who: "priya", lock: { who: "priya", push: null } }, figures: [{ label: "At risk, at MRP", value: D.RISK.atRiskMRP, tone: "red" }, { label: "If it is destroyed", value: -D.PLAN.writeOff.total, tone: "red" }], beats: [
          { text: "09:00 · the Watcher checks 312 batches; MF-2409-117 fails all three quick-commerce gates", agent: "Watcher", focus: "desk", time: "09:00", acts: [["detect"]], screen: "Command Center" },
          { text: "The push lands on Priya's phone", who: "priya", focus: "phone", time: "09:00", phone: { lock: { who: "priya", push: P.detect } }, screen: "Lock screen" },
          { text: "Batches: every lot the Watcher sees, and the months already cleared", who: "priya", focus: "desk", time: "09:02", desk: { route: "batches" }, phone: { route: "command", lock: null }, screen: "Batches" },
          { text: "The batch's page opens on its Journey: the tracker, the cluster, the agents", who: "priya", focus: "desk", time: "09:03", desk: { route: "journey", params: { ref: HERO.id } }, phone: { route: "command", lock: null }, screen: "Batch page · Journey" },
        ] },
        { id: "verify", stage: "verify", scenario: "chips", title: "Verify", date: "Friday 2 October", ff: 2, desk: { who: "priya", route: "route", anchor: "label" }, phone: { who: "rakesh", route: "photo" }, figures: [{ label: "MRP, confirmed from the pack", value: 30, decimals: true }], beats: [
          { text: "Vision asks Rakesh bhai for one label photo before any price is quoted", agent: "Vision", focus: "desk", time: "09:05", acts: [["requestPhoto"]], phone: { lock: { who: "rakesh", push: null } }, screen: "Route Room · label" },
          { text: "He opens the push at the godown", who: "rakesh", focus: "phone", time: "09:05", phone: { lock: { who: "rakesh", push: P.verify } }, screen: "Lock screen" },
          { text: "Take a photo, or upload one: a carton on shelf B4, its barcode and QR code in view", who: "rakesh", focus: "phone", time: "09:19", acts: [["sendPhoto"]], screen: "Label photo · take or upload" },
          { text: "Gemini reads the batch, the dates and the MRP; they match the DMS record", agent: "Vision", focus: "desk", time: "09:20", acts: [["verify"]], screen: "Route Room · label verified" },
        ] },
        { id: "value", stage: "value", scenario: "chips", title: "Value", date: "Friday 2 October", ff: 3, desk: { who: "priya", route: "route", anchor: "channels" }, phone: { who: "priya", route: "route", anchor: "channels" }, figures: [{ label: "Best channel, a packet after costs", value: KL.price - M.RULES.vanPerUnit, decimals: true, tone: "green" }, { label: "The bin, a packet", value: -D.PLAN.writeOff.perUnit, decimals: true, tone: "red" }], beats: [
          { text: `The Valuer prices five exits against ${HERO.daysLeft} days left, the caps and the floor`, agent: "Valuer", focus: "desk", time: "09:21", acts: [["value"]], screen: "Route Room · five exits" },
        ] },
        { id: "decide", stage: "decide", scenario: "chips", title: "Decide", date: "Friday 2 October", ff: 4, desk: { who: "priya", route: "route", anchor: "split" }, phone: { who: "priya", route: "route", anchor: "split" }, figures: [{ label: "Net recovered", value: D.PLAN.net, tone: "green" }, { label: "Swing against the bin", value: D.PLAN.swing }], beats: [
          { text: "The Router fills the best-paying exit to its cap, then the next, and writes why", agent: "Router", focus: "desk", time: "09:22", acts: [["decide"]], screen: "Route Room · the split" },
          { text: "The plan reaches Priya's phone", who: "priya", focus: "phone", time: "09:23", phone: { lock: { who: "priya", push: P.plan } }, screen: "Lock screen" },
        ] },
        { id: "approve", stage: "approve", scenario: "chips", title: "Approve", date: "Friday 2 October", ff: 5, amber: true, desk: { who: "priya", route: "command" }, phone: { who: "priya", route: "route", anchor: "split" }, figures: [{ label: "Net recovered", value: D.PLAN.net, tone: "green" }, { label: "Swing", value: D.PLAN.swing }, { label: "GST credit kept", value: D.PLAN.itcRetained }], beats: [
          { text: "Priya opens the approval: three numbers and what happens next", who: "priya", focus: "phone", time: "09:40", event: "sc3:approve-open", screen: "The approve sheet" },
          { text: "One tap. Nothing was listed, messaged or shipped before it", who: "priya", focus: "phone", human: true, time: "09:40", acts: [["approve", "priya"]], screen: "Plan placed" },
        ] },
        { id: "execute", stage: "execute", scenario: "chips", title: "Execute", date: "Friday 2 October", ff: 6, desk: { who: "priya", route: "execution" }, phone: { who: "ganesh", route: "offer" }, figures: [{ label: "ExpireSoon, a packet", value: ES.price, decimals: true }, { label: "after the counter", value: D.COUNTER.price, decimals: true, tone: "green" }], beats: [
          { text: `The Lister posts ${ES.units} packets on ExpireSoon in Rakesh Traders' name, hidden inside Munchly's territories`, agent: "Lister", focus: "desk", time: "09:41", acts: [["list"]], phone: { lock: { who: "ganesh", push: null } }, screen: "Execution · Lister" },
          { text: `Outreach pushes the Hindi scheme to ${D.OFFERED} kiranas`, agent: "Outreach", focus: "desk", time: "09:41", acts: [["outreach"]], phone: { lock: { who: "ganesh", push: P.offer } }, screen: "Execution · the scheme" },
          { text: `Ganesh ji takes a carton in one tap, and his tax invoice comes with it`, who: "ganesh", focus: "phone", time: "09:52", acts: [["order", "k0"]], screen: "Offer · one tap" },
          { text: `${D.KIRANAS.length - 1} more kiranas order ${KL.units - D.KIRANAS[0].units} packets in about two hours`, agent: "Outreach", focus: "desk", time: "11:41", acts: [["allOrders"]], phone: { route: "orders" }, screen: "Orders · each with its invoice" },
          { text: `On ExpireSoon, ${D.BUYER.name} in ${D.BUYER.city} bids ₹13 for all ${ES.units}`, who: "agrawal", focus: "phone", time: "11:02", acts: [["bid", 13]], phone: { who: "agrawal", route: "listing" }, screen: "ExpireSoon · the lot" },
          { text: `The Negotiator counters at ₹${D.COUNTER.price.toFixed(2)} with a 24-hour dispatch promise`, agent: "Negotiator", focus: "phone", time: "11:03", acts: [["counter"]], phone: { who: "agrawal", route: "listing" }, screen: "ExpireSoon · the counter" },
          { text: `Agrawal ji accepts and pays the ${fmt.inr(D.AWARD.token)} token`, who: "agrawal", focus: "phone", time: "11:09", acts: [["accept"]], phone: { who: "agrawal", route: "listing" }, screen: "ExpireSoon · won" },
        ] },
        { id: "settle", stage: "settle", scenario: "chips", title: "Settle", date: "Monday 5 October", ff: 7, desk: { who: "priya", route: "paperwork" }, phone: { who: "rakesh", route: "van" }, figures: [{ label: `Rakesh's invoice to ${D.BUYER.city}`, value: D.INVOICE.total }, { label: "Price support to Rakesh", value: D.SUPPORT.total }, { label: "GST credit kept", value: D.PLAN.itcRetained, tone: "green" }], beats: [
          { text: `The balance lands; Rakesh bhai's staff load ${D.BUYER.name}'s truck`, who: "rakesh", focus: "phone", time: "10:15", acts: [["dispatch"]], phone: { anchor: "lot" }, screen: "Deliveries · the truck" },
          { text: "Paperwork drafts the tax invoice, the credit note and the GST memo, in Tally's layout", agent: "Paperwork", focus: "desk", time: "10:16", acts: [["settle"]], screen: "Paperwork · the pack" },
          { text: "Rakesh bhai issues his invoice from Tally, with its e-invoice", who: "rakesh", focus: "phone", time: "10:24", acts: [["issueInvoice"]], phone: { route: "orders" }, screen: "Orders · issue from Tally" },
          { text: "Priya reviews Munchly's papers: nothing to chase", who: "priya", focus: "desk", time: "10:30", acts: [["review"]], screen: "Paperwork · reviewed" },
          { text: `${CJ.van.day}: the van takes the scheme to ${D.KIRANAS.length} shops`, who: "rakesh", focus: "phone", date: long(CJ.van.date), time: "07:30", acts: [["vanRound"]], screen: "Deliveries · the van round" },
        ] },
        { id: "report", stage: "report", scenario: "chips", title: "Report", date: "Friday 30 October", ff: 8, desk: { who: "priya", route: "report" }, phone: { who: "priya", route: "command" }, figures: [{ label: "Recovered", value: D.ACTUAL.net, tone: "green" }, { label: "Better than the bin", value: D.ACTUAL.swing }], beats: [
          { text: "The return window has closed: Impact posts the ledger and writes the BRSR row, with evidence", agent: "Impact", focus: "desk", time: "18:00", acts: [["report"]], phone: { lock: { who: "priya", push: null } }, screen: "Ledger · Money" },
          { text: "Priya's phone: batch closed, nothing destroyed", who: "priya", focus: "phone", time: "18:01", phone: { lock: { who: "priya", push: P.closed } }, screen: "Lock screen" },
          { text: "The GST reading: credit kept and reversed, every invoice and credit note", who: "priya", focus: "desk", time: "18:02", desk: { params: { reading: "gst" } }, screen: "Ledger · GST" },
          { text: "The Impact reading: kilos kept out of landfill, CO₂e, meals, by week", who: "priya", focus: "desk", time: "18:03", desk: { params: { reading: "impact" } }, screen: "Ledger · Impact" },
          { text: "The batch's Record: the photo sent, each yes, every step by person and agent", who: "priya", focus: "desk", time: "18:04", desk: { route: "record", params: { ref: HERO.id } }, screen: "Batch page · Record" },
          { text: "Rakesh bhai's portal: the batch ends him whole, with his papers and his photo", who: "rakesh", focus: "phone", time: "18:05", phone: { who: "rakesh", route: "batches", params: { ref: HERO.id } }, screen: "Distributor · a batch's page" },
        ] },
      ] },

    /* ---------- journey 2: the Mango Drink, every pack sold ---------- */
    { id: "mango", title: "Mango Drink", sub: "Kiranas, a staff sale, a food bank", place: "Hyderabad · Lakshmi Agencies", img: "pack-mango", batch: MS.batch.id, who: ["priya", "lakshmi-owner", MS.accounts.kirana, "meera"], minutes: 5,
      outcome: { value: MS.actual.net, line: `recovered, where the bin would have cost ${fmt.inr(MS.plan.writeOff.total)} · ${D.MANGO_FB} meals` },
      stations: [
        { id: "detect", title: "Detect", date: "Friday 2 October", scenario: "mango", ff: 1, desk: { who: "priya", route: "command" }, phone: { who: "priya", lock: { who: "priya", push: null } }, figures: [{ label: "At risk, at MRP", value: MS.risk.atRiskMRP, tone: "red" }, { label: "If it is destroyed", value: -MS.plan.writeOff.total, tone: "red" }], beats: [
          { text: `09:00 · the Watcher flags ${MS.batch.id} at Lakshmi Agencies: ${MS.batch.daysLeft} days left, every quick-commerce gate failed`, agent: "Watcher", focus: "desk", time: "09:00", acts: [["detect"]], screen: "Command Center" },
          { text: "The push lands on Priya's phone", who: "priya", focus: "phone", time: "09:00", phone: { lock: { who: "priya", push: MS.push.detect } }, screen: "Lock screen" },
        ] },
        { id: "verify", title: "Verify", date: "Friday 2 October", scenario: "mango", ff: 2, desk: { who: "priya", route: "route", anchor: "label" }, phone: { who: "lakshmi-owner", route: "photo" }, figures: [{ label: "MRP, confirmed from the pack", value: D.SKUS[MS.batch.sku].mrp, decimals: true }], beats: [
          { text: "Vision asks Lakshmi Agencies for one label photo", agent: "Vision", focus: "desk", time: MS.at.ask, acts: [["requestPhoto"]], phone: { lock: { who: "lakshmi-owner", push: null } }, screen: "Route Room · label" },
          { text: "The push lands at the Begum Bazaar godown", who: "lakshmi-owner", focus: "phone", time: MS.at.ask, phone: { lock: { who: "lakshmi-owner", push: MS.push.verify } }, screen: "Lock screen" },
          { text: "Lakshmi Agencies takes a photo of one carton's label, its barcode and QR code in view", who: "lakshmi-owner", focus: "phone", time: MS.at.photo, acts: [["sendPhoto"]], screen: "Label photo · take or upload" },
          { text: "Gemini reads the batch, the dates and the MRP; they match the DMS record", agent: "Vision", focus: "desk", time: MS.at.read, acts: [["verify"]], screen: "Route Room · label verified" },
        ] },
        { id: "decide", title: "Decide", date: "Friday 2 October", scenario: "mango", ff: 3, amber: true, desk: { who: "priya", route: "route", anchor: "split" }, phone: { who: "priya", route: "route", anchor: "split" }, figures: [{ label: "Net recovered", value: MS.plan.net, tone: "green" }, { label: "Swing against the bin", value: MS.plan.swing }], beats: [
          { text: `The Valuer prices the exits against ${MS.batch.daysLeft} days left: ExpireSoon is out under 30`, agent: "Valuer", focus: "desk", time: MS.at.read, acts: [["value"]], desk: { anchor: "channels" }, screen: "Route Room · the exits" },
          { text: `The Router: ${fmt.num(ML("kirana").units)} to ${MS.kiranas.length} Hyderabad kiranas, ${ML("staff").units} to her staff sale, ${ML("foodbank").units} to Feeding India`, agent: "Router", focus: "desk", time: MS.at.plan, acts: [["decide"]], screen: "Route Room · three lines" },
          { text: "The plan reaches Priya's phone", who: "priya", focus: "phone", time: MS.at.plan, phone: { lock: { who: "priya", push: MS.push.plan } }, screen: "Lock screen" },
          { text: "Priya opens the approval: three lines, the money, what happens next", who: "priya", focus: "phone", time: MS.at.approve, event: "sc3:approve-open", screen: "The approve sheet" },
          { text: "One tap, and the agents set off", who: "priya", focus: "phone", human: true, time: MS.at.approve, acts: [["approve", "priya"]], screen: "Plan placed" },
        ] },
        { id: "execute", title: "Execute", date: "Friday 2 October", scenario: "mango", ff: 6, desk: { who: "priya", route: "execution" }, phone: { who: MS.accounts.kirana, route: "offer" }, figures: [{ label: `To ${MS.kiranas.length} kiranas`, value: ML("kirana").units, count: true }, { label: "Staff sale", value: ML("staff").units, count: true }, { label: "Feeding India", value: ML("foodbank").units, count: true, tone: "green" }], beats: [
          { text: `Outreach pushes the Hindi scheme to ${MS.offered} kiranas around Begum Bazaar`, agent: "Outreach", focus: "desk", time: MS.at.offer, acts: [["outreach"]], phone: { lock: { who: MS.accounts.kirana, push: MS.push.offer } }, screen: "Execution · the scheme" },
          { text: `Donation books Feeding India for ${ML("foodbank").units} packs, with the FSSAI checklist`, agent: "Donation", focus: "desk", time: MS.at.offer, acts: [["donate"]], phone: { lock: { who: MS.accounts.kirana, push: MS.push.offer } }, screen: "Execution · the food bank" },
          { text: `${SHOP} takes its share in one tap, and its tax invoice comes with it`, who: MS.accounts.kirana, focus: "phone", time: "09:52", acts: [["order", MS.shop]], screen: "Offer · one tap" },
          { text: `${MS.kiranas.length - 1} more kiranas order the rest of the ${fmt.num(ML("kirana").units)} packets`, agent: "Outreach", focus: "desk", time: "11:36", acts: [["allOrders"]], screen: "Execution · the scheme filled" },
          { text: `Lakshmi Agencies sells ${ML("staff").units} packs to her staff at ₹8, against her UPI code, and records it once`, who: "lakshmi-owner", focus: "phone", human: true, date: "Saturday 3 October", time: "17:30", acts: [["recordStaffSale", ML("staff").units]], phone: { who: "lakshmi-owner", route: "van" }, screen: "Deliveries · the staff sale" },
          { text: `Meera at Feeding India confirms ${MJ.donation.day}'s pickup`, who: "meera", focus: "phone", date: "Saturday 3 October", time: "12:30", acts: [["confirmPickup"]], phone: { who: "meera", route: "pickups" }, screen: "Food bank · pickups" },
          { text: `She collects the ${ML("foodbank").units} packs and issues receipt ${D.MANGO_RECEIPT.no}`, who: "meera", focus: "phone", date: long(MJ.donation.date), time: "10:20", acts: [["collect"]], phone: { who: "meera", route: "pickups" }, screen: "Food bank · the receipt" },
        ] },
        { id: "settle", title: "Settle", date: long(MJ.donation.date), scenario: "mango", ff: 7, desk: { who: "priya", route: "paperwork" }, phone: { who: "lakshmi-owner", route: "van" }, figures: [{ label: "Price support to Lakshmi Agencies", value: MS.support.total }, { label: "GST credit kept", value: MS.plan.itcRetained, tone: "green" }], beats: [
          { text: `Paperwork: the price-support credit note, the GST memo, the FSSAI checklist and the receipt`, agent: "Paperwork", focus: "desk", time: "11:00", acts: [["settle"]], screen: "Paperwork · the pack" },
          { text: "Priya reviews Munchly's papers", who: "priya", focus: "desk", time: "11:20", acts: [["review"]], screen: "Paperwork · reviewed" },
          { text: `${MJ.van.day}: the van takes the scheme to ${MS.kiranas.length} shops`, who: "lakshmi-owner", focus: "phone", date: long(MJ.van.date), time: MJ.van.leaves, acts: [["vanRound"]], screen: "Deliveries · the van round" },
        ] },
        { id: "report", title: "Report", date: long(MJ.van.date), scenario: "mango", ff: 8, desk: { who: "priya", route: "report", params: { reading: "impact" } }, phone: { who: "priya", route: "command" }, figures: [{ label: "Recovered", value: MS.actual.net, tone: "green" }, { label: "Meals", value: D.MANGO_FB, count: true }], beats: [
          { text: "Every line done: Impact posts the ledger, and the BRSR line counts the food bank's meals", agent: "Impact", focus: "desk", time: "18:00", acts: [["report"]], phone: { lock: { who: "priya", push: null } }, screen: "Ledger · Impact" },
          { text: "Priya's phone: batch closed, nothing destroyed", who: "priya", focus: "phone", time: "18:01", phone: { lock: { who: "priya", push: MS.push.closed } }, screen: "Lock screen" },
          { text: "The batch's page: the money each line made, the papers, its impact", who: "priya", focus: "desk", time: "18:03", desk: { route: "report", params: { ref: MS.batch.id } }, phone: { route: "command", lock: null }, screen: "Ledger · a batch's page" },
          { text: "Lakshmi Agencies' portal: the batch ends her whole, with Feeding India's receipt as a copy", who: "lakshmi-owner", focus: "phone", time: "18:05", phone: { who: "lakshmi-owner", route: "batches", params: { ref: MS.batch.id }, lock: null }, screen: "Distributor · a batch's page" },
        ] },
      ] },

    /* ---------- journey 3: the chips again, a slow week; packs destroyed at the godown on a second yes ---------- */
    { id: "slow", title: "Masala Chips", sub: "A slow week · destroyed on a second yes", place: "Nagpur · Rakesh Traders", img: "pack-chips", batch: SS.batch.id, branch: { from: "chips", at: "execute" }, who: ["priya", "rakesh", SS.accounts.decliner, "agrawal"], minutes: 5,
      outcome: { value: SS.actual.net, line: `recovered · ${SS.expiry.units} packs destroyed at the godown against evidence, on Priya's yes`, red: true },
      stations: [
        { id: "execute", title: "Execute", date: "Friday 2 October", scenario: "slow", ff: 6, desk: { who: "priya", route: "execution" }, phone: { who: "ganesh", route: "offer" }, figures: [{ label: "Ordered", value: SLOW.ordered, count: true }, { label: "Left at the godown", value: SLOW.left, count: true, tone: "red" }], beats: [
          { text: "The same batch, the same plan: the Lister posts the lot on ExpireSoon", agent: "Lister", focus: "desk", time: SS.at.list, acts: [["list"]], phone: { lock: { who: "ganesh", push: null } }, screen: "Execution · Lister" },
          { text: `Outreach pushes the Hindi scheme to ${SS.offered} kiranas`, agent: "Outreach", focus: "desk", time: SS.at.offer, acts: [["outreach"]], phone: { lock: { who: "ganesh", push: SS.push.offer } }, screen: "Execution · the scheme" },
          { text: "Ganesh ji orders, as he did before", who: "ganesh", focus: "phone", time: "09:52", acts: [["order", "k0"]], screen: "Offer · one tap" },
          { text: `This week only ${SS.kiranas.length} of ${D.KIRANAS.length} shops order: ${fmt.num(SLOW.ordered)} of ${fmt.num(SS.KL.units)} packets`, agent: "Outreach", focus: "desk", time: "11:17", acts: [["allOrders"]], screen: "Execution · the scheme short" },
          { text: "Shubham Provision says Not this time; the scheme stays open to it for its 48 hours", who: SS.accounts.decliner, focus: "phone", time: SS.at.decline, acts: [["decline", SS.decliner]], phone: { who: SS.accounts.decliner, route: "home" }, screen: "Kirana · Not this time" },
          { text: `On ExpireSoon, ${D.BUYER.name} bids ₹13 for all ${fmt.num(SS.ES.units)}`, who: "agrawal", focus: "phone", time: SS.at.bid, acts: [["bid", 13]], phone: { who: "agrawal", route: "listing" }, screen: "ExpireSoon · the lot" },
          { text: `The Negotiator counters at ₹${SS.counter.price.toFixed(2)}`, agent: "Negotiator", focus: "phone", time: SS.at.bid, acts: [["counter"]], phone: { who: "agrawal", route: "listing" }, screen: "ExpireSoon · the counter" },
          { text: "Agrawal ji accepts and pays the token", who: "agrawal", focus: "phone", time: SS.at.award, acts: [["accept"]], phone: { who: "agrawal", route: "listing" }, screen: "ExpireSoon · won" },
          { text: `Sunday: the window closes with ${SLOW.left} packets unordered`, agent: "Outreach", focus: "desk", date: "Sunday 4 October", time: "09:41", acts: [["closeOffer"]], screen: "Execution · window over" },
        ] },
        { id: "settle", title: "Settle", date: "Monday 5 October", scenario: "slow", ff: 7, desk: { who: "priya", route: "paperwork" }, phone: { who: "rakesh", route: "van" }, figures: [{ label: "Price support to Rakesh", value: SS.support.total }], beats: [
          { text: `Rakesh bhai's staff load ${D.BUYER.name}'s truck`, who: "rakesh", focus: "phone", time: "10:15", acts: [["dispatch"]], phone: { anchor: "lot" }, screen: "Deliveries · the truck" },
          { text: "Paperwork drafts the invoice, the price-support credit note and the GST memo", agent: "Paperwork", focus: "desk", time: "10:16", acts: [["settle"]], screen: "Paperwork · the pack" },
          { text: "Priya reviews Munchly's papers", who: "priya", focus: "desk", time: "10:30", acts: [["review"]], screen: "Paperwork · reviewed" },
          { text: `${SJ.van.day}: a shorter van round, ${SS.kiranas.length} drops`, who: "rakesh", focus: "phone", date: long(SJ.van.date), time: SJ.van.leaves, acts: [["vanRound"]], screen: "Deliveries · the van round" },
        ] },
        { id: "expiry", title: "Expiry day", date: "Wednesday 18 November", scenario: "slow", ff: 8, desk: { who: "priya", route: "execution" }, phone: { who: "rakesh", route: "home" }, figures: [{ label: "Packs left", value: SLOW.left, count: true, tone: "red" }, { label: "Munchly credits Rakesh", value: SS.expiry.amount }], beats: [
          { text: `Best before: ${SLOW.left} packets are left at Kalamna godown. Munchly's policy: destroyed there, against evidence`, agent: "Impact", focus: "desk", time: "10:00", acts: [["expire"]], phone: { lock: { who: "rakesh", push: null } }, screen: "Execution · Left at the godown" },
          { text: "Rakesh bhai is asked to destroy them, on his phone", who: "rakesh", focus: "phone", time: "10:00", phone: { lock: { who: "rakesh", push: SS.push.destroy } }, screen: "Lock screen" },
          { text: "His Today: the request, with what Munchly credits him once Priya approves", who: "rakesh", focus: "phone", time: "10:02", phone: { route: "home", lock: null }, screen: "Distributor · Today" },
          { text: `Two photos (at the godown, then at the landfill with a slate), and the certificate from ${SS.agency.name}, signed in place by its officer, two witnesses and Rakesh bhai`, who: "rakesh", focus: "phone", human: true, time: "13:40", acts: [["sendDestruction"]], phone: { route: "destroy", lock: null }, screen: "Destroy · the evidence" },
          { text: "Vision checks both photos: the batch, the count, the slate, the day", agent: "Vision", focus: "phone", time: "14:00", phone: { route: "destroy", lock: null }, screen: "Destroy · Vision's checks" },
        ] },
        { id: "yes", title: "The second yes", date: "Thursday 19 November", scenario: "slow", ff: 8, prep: [["expire"], ["sendDestruction"]], amber: true, desk: { who: "priya", route: "command" }, phone: { who: "priya", lock: { who: "priya", push: null } }, figures: [{ label: "Expiry credit note", value: SS.expiry.amount }], beats: [
          { text: "The evidence reaches Priya's phone", who: "priya", focus: "phone", time: "10:50", phone: { lock: { who: "priya", push: SS.push.evidence } }, screen: "Lock screen" },
          { text: "Her Command Center: Review the destruction", who: "priya", focus: "desk", time: "10:55", click: "Review the destruction", phone: { route: "command", lock: null }, screen: "Command Center · review" },
          { text: "Both photos, Vision's checks, the certificate as signed, and what her yes issues: she approves", who: "priya", focus: "desk", human: true, time: "11:00", acts: [["approveDestruction"]], click: "Review the destruction", phone: { route: "command", lock: null }, screen: "The destruction sheet" },
        ] },
        { id: "report", title: "Report", date: "Thursday 19 November", scenario: "slow", ff: 8, prep: [["expire"], ["sendDestruction"], ["approveDestruction"]], desk: { who: "priya", route: "execution" }, phone: { who: "rakesh", route: "batches", params: { ref: SS.batch.id } }, figures: [{ label: "Recovered", value: SS.actual.net, tone: "green" }, { label: "Destroyed at the godown", value: SLOW.left, count: true, tone: "red" }], beats: [
          { text: `On the yes: the expiry credit note ${SS.expiryNo}, ${fmt.inr2(SS.expiry.amount)}, and the agency's certificate ${SS.certificate}; Impact posts`, agent: "Impact", focus: "desk", time: "11:01", acts: [["report"]], screen: "Execution · Expiry settlement" },
          { text: "Paperwork: the expiry credit note's three lines, and the certificate he reverses his GST against", who: "priya", focus: "desk", time: "11:03", desk: { route: "paperwork" }, screen: "Paperwork · the expiry papers" },
          { text: "The batch's Record: the label photo, the two destruction photos, both yeses", who: "priya", focus: "desk", time: "11:05", desk: { route: "record", params: { ref: SS.batch.id } }, screen: "Batch page · Record" },
          { text: "Rakesh bhai's batch page: his photos, and the credit that ends him whole", who: "rakesh", focus: "phone", time: "11:06", screen: "Distributor · a batch's page" },
        ] },
      ] },
  ];

  // when an action has happened, read from the store, so the visitor's own move in a device ticks its beat
  const ordered = (s, id) => s.hero.orders.some(o => o.id === id);
  const DONE = {
    connect: s => s.setup.confirmed, permit: s => !!s.setup.permission, detect: s => s.hero.phase !== "watching",
    requestPhoto: s => s.hero.photo.status !== "none", sendPhoto: s => ["reading", "verified"].includes(s.hero.photo.status), verify: s => s.hero.photo.status === "verified",
    value: s => !["watching", "at-risk", "verified"].includes(s.hero.phase), decide: s => !["watching", "at-risk", "verified", "valued"].includes(s.hero.phase),
    approve: s => !!(s.hero.plan && s.hero.plan.status === "approved"), list: s => !!s.hero.listing, outreach: s => !!s.hero.offer,
    order: (s, id) => ordered(s, id), allOrders: s => s.hero.orders.length >= D.KIRANAS.length, decline: (s, id) => !!(s.hero.declined && s.hero.declined[id]),
    bid: s => s.hero.bids.length > 0, counter: s => s.hero.bids.some(b => b.status !== "placed"), accept: s => !!s.hero.award,
    donate: s => !!s.mango.donation, confirmPickup: s => s.mango.donation === "confirmed" || s.mango.donation === "collected", collect: s => s.mango.donation === "collected",
    recordStaffSale: s => !!((s.hero.staff && s.hero.staff.status === "recorded") || (s.mango.staff && s.mango.staff.status === "recorded")),
    dispatch: s => s.hero.truck.status === "dispatched", settle: s => !!s.hero.docs, issueInvoice: s => !!s.hero.invoiceIssued, review: s => !!s.hero.reviewed,
    vanRound: s => s.hero.van.status === "done", report: s => !!s.hero.posted,
    sendDestruction: s => !!(s.hero.destruction && ["checked", "approved"].includes(s.hero.destruction.status)), approveDestruction: s => !!(s.hero.destruction && s.hero.destruction.status === "approved"),
  };
  // a beat is done when its own test says so, or when every action it runs has happened; a beat with no test of its
  // own (a change put in the store) is done once the director has run it
  const doneOf = (b, s) => (b.done ? b.done(s) : b.acts && b.acts.length && b.acts.every(a => Array.isArray(a) && DONE[a[0]]) ? b.acts.every(a => DONE[a[0]](s, a[1])) : null);

  // every beat knows its station, for the director
  ACTS.forEach(a => a.stations.forEach(st => st.beats.forEach(b => { b.station = st.id; })));
  window.SC3_STORY = { ACTS, SLOW, DONE, doneOf };
})();
