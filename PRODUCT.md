# Product

<!-- impeccable:product-schema 1 -->

Written from the brief, the journey map (docs/dobara-journey-map.html, v4.1), the tech-stack document (docs/smart-clearance-tech-stack.html) and the illustrated story (docs/smart-clearance-story.html, v6) without a user interview; facts marked *(inferred)* were not confirmed by the user. The SaaS model and the workspace sign-in come from the maintainer's brief for SC-24 (4 Oct 2026).

## Platform

web

## Stack

Installable PWA: SvelteKit 3 + Svelte 5 (adapter-static) on Firebase Hosting, Firebase Auth (each client workspace signs its staff in through its own identity provider, Google Workspace for Munchly's munchly.in; phone OTP for distributors and retailers by invitation; email-or-phone-first sign-in at the client's own subdomain; demo "Explore as someone in the story" accounts for judges), FCM web push with an in-app inbox, Tailwind 4 and shadcn-svelte; agents on Google Cloud Run (Google ADK, Gemini on Vertex AI). The design prototype in Claude Design is React + framer-motion *(inferred: the user asked for framer animations in the prototype)*.

## Business Model

Smart-Clearance is sold to manufacturers as software as a service. Each client gets a workspace at its own address (`<client>.smartclearance.com`), set up for its supply chain: its route to market, who owns short-dated stock, its expiry policy, the exits it allows, its territory guard and how its people sign in. The prototype is Munchly Foods' workspace at munchly.smartclearance.com. A smartclearance.com landing page and a super-admin console for managing client workspaces and their users are planned (SC-25).

## Users

- **Priya Deshmukh**, supply chain at Munchly Foods, Pune. On her phone at 09:00 with chai, or at her desk. Job: decide what happens to short-dated stock before it is too late, with the money in front of her. Approves plans with one tap.
- **Rakesh bhai**, owner of Rakesh Traders, Nagpur (distributor). He owns the stock he bought at ₹22 and supplies his kiranas and the Blinkit, Zepto and Instamart warehouses in Nagpur. Runs the godown and the van from his phone and signs in with his phone number. Job: give a one-time permission for the agent to act in his name (and pause it when he wants), send one label photo, run the van and load the buyer's truck, issue the drafted invoice, and end whole through Munchly's price support.
- **Ganesh ji** and 37 other kirana owners (retailers, Nagpur cluster). Job: accept a Hindi scheme from a notification with one tap and see the order.
- **Agrawal ji**, Agrawal Wholesale, Raipur (ExpireSoon buyer, outside every Munchly territory). Job: see dates and the label photo, bid, get a fair counter, pay a token. *(ExpireSoon is a mocked marketplace; buyers never sign in to the client's workspace.)*
- **Anita Rao**, finance and GST at Munchly. Job: Munchly's price-support credit note and GST memo without chasing, with Rakesh's invoice as evidence.
- **Vikram Sethi**, sustainability at Munchly. Job: a BRSR waste line with evidence an auditor can follow.
- **Arjun Nair**, workspace admin at Munchly. Job: see how Munchly's workspace is set up (sign-in, supply-chain profile, branding), invite and deactivate people, set the guardrails the agents run by, watch the integrations and the audit log. The eighth demo account.
- **Hackathon judges**: sign in as any role in demo mode and follow one batch end to end in about six minutes.

## Product Purpose

Smart-Clearance routes near-expiry FMCG stock that quick-commerce apps have rejected to the channel that earns the most in the days it has left (online clearance marketplace, kirana cluster push, a staff sale at the distributor's godown, food bank; discount D2C only for the manufacturer's own warehouse stock), asks a human for one approval, then executes: listing, outreach, negotiation, donation booking, paperwork and the impact ledger. Success: the batch leaves the godown inside its date, the brand recovers money instead of paying an expiry claim and writing the stock off, the distributor ends whole, the GST input credit is kept, and the waste avoided lands as an audited line in the BRSR report.

## Positioning

The only tool that combines the quick-commerce shelf-life gates (Blinkit 90+ days; Zepto and Instamart 60% of life), real sell-through by pincode and by shop and a label-photo verification into a priced choice of exits per carton, including the true cost of the bin (stock, ITC reversal under CGST s.17(5)(h), disposal, EPR), and then does the running around itself, in the distributor's name. Agents decide; one human tap releases execution. Each manufacturer gets it as its own workspace, set up for its own supply chain.

## Operating Context

- Demo batch: MF-2409-117, Munchly Masala Chips 150 g, 24 packets a carton, MRP ₹30, Munchly's cost ₹16, distributor price ₹22, GST 5% after GST 2.0 with ₹0.90 of input GST a packet, best before 18 Nov 2026 (a 184-day life), 77 cartons (1,840 packets) in Rakesh Traders' godown at Kalamna Market, Nagpur, selling 12 packets a day; 57 cartons (1,360 packets) at risk; destroying them costs Munchly ₹26,330 (₹19.36 a packet).
- Recommended split: 588 packets (24½ cartons) to the kirana cluster at ₹18 effective (₹21.60 a pack, 2 free with every 10), ordered by 31 of 38 shops; 772 packets (32 cartons + 4) on ExpireSoon at ₹15 in Rakesh Traders' name, reserve ₹13.50, hidden from buyers inside Munchly's territories; net ₹21,770 (53% of MRP), P&L +₹10, ₹26,340 better than the bin; GST credit ₹1,224 kept. Negotiation: Agrawal Wholesale bids ₹13, counter ₹14.20, accepted; 15% token ₹1,644; actual ₹21,152 net, a ₹25,722 swing. Rakesh's invoice to Raipur: IGST 5% ₹548, ₹11,510 in all. Munchly's price support to Rakesh: ₹8,768 instead of a ₹34,490 expiry claim. Day-7 shelf check; scheme returns until 29 Oct.
- Second batch: Mango Drink, 22 days left, Lakshmi Agencies Hyderabad; 1,372 packs to her kiranas, 150 to her staff sale, 58 to Feeding India.
- Workflow stages: connect (data, guardrails, the distributor's one-time permission), detect risk (daily 09:00 Watcher), verify (label photo read by Gemini), value (five exits including the bin), route (greedy allocation under caps), approve (one tap), execute (list in the distributor's name, push offer in Hindi, negotiate, book pickup, day-7 shelf check), settle (the distributor's invoice draft, e-way bill check, price-support credit note, ITC memo, FSSAI checklist), report (ledger after the return window: ₹ recovered, ITC retained, kg diverted, CO₂e, meals; BRSR Principle 6 rows).
- Devices: phones for Priya, Rakesh bhai and the retailers; laptops for Anita and Vikram; any browser for judges. Push notifications are the trigger for every human moment; WhatsApp is future scope.
- Languages: English, Hindi, Marathi strings (Paraglide). Retailer offers go out in Hindi.

## Capabilities and Constraints

- Screens in design v3 (design3/, current): one set of role screens shared by the guided demo and the app, inside Munchly's workspace.
  - Sign-in at munchly.smartclearance.com: email or phone first, Google Workspace for munchly.in, a one-time code for invited numbers, joining on a first invitation, "Find your workspace", a workspace sheet inside the app.
  - Brand: Setup (S0, with the territory guard, the distributors' permissions and the return window), Command Center (S1), Route Room with label, five channels, split, money and the approve sheet (S2), Execution with the listing API card, kirana orders on the cluster map, negotiation, the Mango Drink donation and the day-7 shelf check (S3), Batches.
  - Distributor: Today (one-time permission with pause, the plan, the van, the Raipur lot, the invoice draft, ending whole), label photo camera, van route with the shelf check, orders.
  - Kirana: offers in Hindi with an English toggle, offer and order with margin, orders.
  - ExpireSoon buyer, in ExpireSoon's own violet look and outside the workspace: marketplace, lot ES-24117 with bid panel and seller chat, my bids (S4).
  - Food bank: pickups with the FSSAI checklist. Finance: Paperwork with each document on paper and "who keeps what" (S5). Sustainability: Finance & ESG with BRSR export (S6).
  - Admin: Workspace (sign-in, supply-chain profile, distributors, branding), users, guardrails, integrations, audit. Every role: inbox and profile.
  - The guided demo plays the nine journey stages as beats on a laptop (its address bar at munchly.smartclearance.com) and a phone running these screens, with both sign-ins in stage 1, lock-screen pushes and narration; the app adds sign-in, a person switcher and agents that run live.
- Screens in design v2 (design2/, superseded): the sheet (Today), batch detail tabs, Approvals, Orders, Partners, Reports and the role surfaces of the label world.
- Money shown before any yes; nothing is listed, messaged or shipped before the approval tap, and nothing in the distributor's name before his one-time permission. ITC on donations is reversed as a rule; disposal, EPR and CO₂e factors are labelled indicative.
- Medicines are out of scope. ExpireSoon and the food-bank partner are mocked in the prototype.
- Mobile hit targets never below 44 px; works at 390, 820 and 1440 px; installable PWA.
- Undecided *(inferred)*: whether the retailer and distributor surfaces ship as the same PWA with role-based layouts (the tech-stack doc says yes) or as a separate lightweight app.

## Brand Commitments

Name: Smart-Clearance. Tagline: "Every near-expiry carton gets a second chance, chosen by AI." Hindi line: हर कार्टन को दूसरा मौका. Internal name of the routing engine: Short-Date Router.

Client workspaces (SC-24, 4 Oct 2026): the Smart-Clearance mark and theming lead every screen of a client's workspace, and the client's workspace mark sits under it (a pill under the sidebar lockup, the mark on the tablet rail, a button at the left of the phone bar). The client's own colours stay inside its mark. On its sign-in page the client leads, with "Powered by Smart-Clearance" at the foot. Munchly's mark is an orange tile with a bite out of one corner and a white m.

Identity v3 (design3, SC-12, 3 Oct 2026), carried by the design system, the guided demo and the application: every at-risk batch is a live order, tracked to its best exit the way India tracks a delivery. Apple HIG behaviour and shadcn anatomy: frosted bars and sidebar, large titles that collapse, inset grouped lists, sheets with detents, a nine-stop tracker, a schematic cluster map with the godown pin and the van route. Sage-tinted neutrals: light ground #f2f6f3 with white cards, dark ground #070b09 with #101613 surfaces and a faint green aurora. The v1 green modernised as the brand (#167a52 light, #3ccb8a dark); amber only for the human yes (the approval, the distributor's permission); red only for risk and the bin; violet only for ExpireSoon; colour only where something is live. Type: Bricolage Grotesque for display and numerals at Monzo weight, with the rupee sign and paise set small and urgency carried in the numeral's own width and weight; Geist for the interface; Geist Mono for ids, times and API cards; Noto Sans Devanagari for Hindi. The mark is a green squircle with the route drawn as an S from the godown dot to an amber pin; the splash draws it. Numbers roll in place when an agent changes them; Approve fills the tracker, draws the van route and rolls the swing. Soft 3D renders (local Qwen, provenance in design3/system/img/manifest.json) and an LTX carton loop are the imagery. Tokens, components and screens live in design3/; DESIGN.md records the system.

Identity v2 (design2, SC-7), superseded by v3: Sivakasi matchbox label chromolithography (Day #f2eee4, Night #101433, seven inks, Bungee and Anek). It remains in design2/ for reference.

The v1 identity (deep green #176b4e with amber #e3b74d, red for risk, purple for ExpireSoon, blue for push; Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono, Noto Sans Devanagari; the green rounded-square mark) remains in the earlier documents (journey map, tech-stack document, story, video) and the v1 prototype under design/.

Portraits of the people and the admin exist in docs/story-img/p-*.jpg and, cropped for v3, in design3/system/img/people/; v3 product and scene renders in design3/system/img/ and the carton loop in design3/system/media/ (each with a provenance sidecar).

## Evidence on Hand

- Money model, product table and demo data: docs/dobara-journey-map.html (v4.1) and docs/smart-clearance-story.html (v6); computed in design3/core/money.js.
- Journey map with nine stages and the prototype screen list: docs/dobara-journey-map.html.
- Tech stack with roles, sign-in modes, Playwright flows at 390/820/1440: docs/smart-clearance-tech-stack.html.
- Illustrations and portraits: docs/story-img/ (public at raw.githubusercontent.com/aibuilder2026/smart-clearance/main/docs/story-img/).
- No real customers, benchmarks or prices beyond the demo data set; Munchly Foods, Glowra, ExpireSoon and Agrawal Wholesale are fictional.

## Product Principles

1. Show the money before asking for the yes; every number carries its working.
2. One human tap releases execution; the agents do the running around and show their work as a timeline.
3. Verify from the shelf, not the spreadsheet: the label photo is the source of truth.
4. Every rupee, credit and kilo lands in one ledger that finance and sustainability both read.
5. Phone-first for the trade: the distributor and the retailer act from a notification in one tap, in their language, and nothing happens in the distributor's name without his permission.
6. One product, many manufacturers: each client's workspace is set up for its own supply chain, and the client's brand never overrides the product's.

## Accessibility & Inclusion

Hindi and Marathi strings for retailers and distributors; 44 px targets; readable on cheap Android phones in sunlight (strong contrast, no colour-only meaning); reduced-motion respected.
