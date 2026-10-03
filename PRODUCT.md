# Product

<!-- impeccable:product-schema 1 -->

Written from the brief, the journey map (docs/dobara-journey-map.html), the tech-stack document (docs/smart-clearance-tech-stack.html) and the illustrated story (docs/smart-clearance-story.html) without a user interview; facts marked *(inferred)* were not confirmed by the user.

## Platform

web

## Stack

Installable PWA: SvelteKit 3 + Svelte 5 (adapter-static) on Firebase Hosting, Firebase Auth (Google for brand staff, phone OTP for distributors and retailers, demo "Sign in as" accounts for judges: the six role people plus the admin), FCM web push with an in-app inbox, Tailwind 4 and shadcn-svelte; agents on Google Cloud Run (Google ADK, Gemini on Vertex AI). The design prototype in Claude Design is React + framer-motion *(inferred: the user asked for framer animations in the prototype)*.

## Users

- **Priya Deshmukh**, supply chain at Munchly Foods, Pune. On her phone at 09:00 with chai, or at her desk. Job: decide what happens to short-dated stock before it is too late, with the money in front of her. Approves plans with one tap.
- **Rakesh bhai**, owner of Rakesh Traders, Nagpur (distributor). Runs the godown and the van from his phone; signs in with his phone number. Job: get stock out of the godown with as few taps as possible: send one label photo, see the van route and retailer orders.
- **Ganesh ji** and 37 other kirana owners (retailers, Nagpur cluster). Job: accept a Hindi scheme from a notification with one tap and see the order.
- **Venkat**, Sri Venkateswara Traders, Hyderabad (ExpireSoon buyer). Job: see dates and the label photo, bid, get a fair counter, pay a token. *(ExpireSoon is a mocked marketplace.)*
- **Anita Rao**, finance and GST at Munchly. Job: the invoice, credit note, e-way bill check and ITC memo without chasing.
- **Vikram Sethi**, sustainability at Munchly. Job: a BRSR waste line with evidence an auditor can follow.
- **Arjun Nair**, platform admin at Munchly. Job: invite and deactivate people, set the rules the agents run by (app gates, floor price, caps, approval policy), watch the integrations and the audit log. The seventh demo account.
- **Hackathon judges**: sign in as any role in demo mode and follow one batch end to end in about six minutes.

## Product Purpose

Smart-Clearance routes near-expiry FMCG stock that quick-commerce apps have rejected to the channel that earns the most in the days it has left (online clearance marketplace, kirana cluster push, brand D2C, staff sale, food bank), asks a human for one approval, then executes: listing, outreach, negotiation, donation booking, paperwork and the impact ledger. Success: the batch leaves the godown inside its date, the brand recovers money instead of writing it off, the GST input credit is kept, and the waste avoided lands as an audited line in the BRSR report.

## Positioning

The only tool that combines the quick-commerce shelf-life gates (Blinkit 90+ days; Zepto and Instamart 60% of life), real sell-through by pincode and a label-photo verification into a priced choice of six exits per carton, including the true cost of the bin (stock, ITC reversal under CGST s.17(5)(h), disposal, EPR), and then does the running around itself. Agents decide; one human tap releases execution.

## Operating Context

- Demo batch: MF-2409-117, Munchly Masala Chips 150 g, 24 packets a carton, MRP ₹30, distributor cost ₹16, GST 12%, best before 18 Nov 2026, 77 cartons (1,840 packets) in Rakesh Traders' godown at Kalamna Market, Nagpur, selling 12 packets a day; 57 cartons (1,360 packets) at risk; binning costs ₹489 a carton, ₹27,717 for the batch.
- Recommended split: 588 packets (24½ cartons) to 14 kirana shops at ₹18 with a buy-10-get-2 scheme; 772 packets (32 cartons + 4) on ExpireSoon at ₹15, floor ₹14; net ₹21,770 (54% of MRP), ₹49,487 better than the bin; GST credit ₹2,611 kept. Negotiation: bid ₹13, counter ₹14.20, accepted; 15% token ₹1,644.
- Second batch: Mango Drink, 22 days left, Lakshmi Agencies Hyderabad; 51 cartons to shops, 150 packs staff sale, 58 packs to Feeding India.
- Workflow stages: connect data, detect risk (daily 09:00 Watcher), verify (label photo read by Gemini), value (six doors), route (greedy allocation under caps), approve (one tap), execute (list, push offer in Hindi, negotiate, book pickup), settle (invoice, e-way bill check, credit note, ITC memo, FSSAI checklist), report (ledger: ₹ recovered, ITC retained, kg diverted, CO₂e, meals; BRSR Principle 6 rows).
- Devices: phones for Priya, Rakesh bhai and the retailers; laptops for Anita and Vikram; any browser for judges. Push notifications are the trigger for every human moment; WhatsApp is future scope.
- Languages: English, Hindi, Marathi strings (Paraglide). Retailer offers go out in Hindi.

## Capabilities and Constraints

- Screens in design v3 (design3/, current): one set of role screens shared by the guided demo and the app. Brand: Setup (S0), Command Center (S1), Route Room with label, channels, split, money and the approve sheet (S2), Execution with the listing API card, kirana orders on the cluster map, negotiation and the Mango Drink donation (S3), Batches. Distributor: Today, label photo camera, van route with the Hyderabad lot and dispatch, orders. Kirana: offers in Hindi with an English toggle, offer and order with margin, orders. ExpireSoon buyer, in ExpireSoon's own violet look: marketplace, lot ES-24117 with bid panel and seller chat, my bids (S4). Food bank: pickups with the FSSAI checklist. Finance: Paperwork with each document on paper (S5). Sustainability: Finance & ESG with BRSR export (S6). Admin: users, guardrails, integrations, audit. Every role: inbox and profile. The guided demo plays the nine journey stages as beats on a laptop and a phone running these screens, with lock-screen pushes and narration; the app adds sign-in, a person switcher and agents that run live.
- Screens in design v2 (design2/, superseded): the sheet (Today), batch detail tabs, Approvals, Orders, Partners, Reports and the role surfaces of the label world.
- Screens named in the original plan (v1 names): Sign in, Command Center (at-risk batches, gates, countdowns), Route Room (label card, channel table and chart, split and money panel, approve sheet), Execution (API call card, retailer orders, negotiation chat), ExpireSoon listing (buyer view), Paperwork (document pack with status and preview), Finance & ESG dashboard (ledger, BRSR export), notification inbox with unread badge; distributor photo capture; retailer offer and order.
- Money shown before any yes; nothing is listed, messaged or shipped before the approval tap. ITC treatment is labelled indicative.
- Medicines are out of scope. ExpireSoon and the food-bank partner are mocked in the prototype.
- Mobile hit targets never below 44 px; works at 390, 820 and 1440 px; installable PWA.
- Undecided *(inferred)*: whether the retailer and distributor surfaces ship as the same PWA with role-based layouts (the tech-stack doc says yes) or as a separate lightweight app.

## Brand Commitments

Name: Smart-Clearance. Tagline: "Every carton gets a second chance, chosen by AI." Hindi line: हर कार्टन को दूसरा मौका. Internal name of the routing engine: Short-Date Router.

Identity v3 (design3, SC-12, 3 Oct 2026), carried by the design system, the guided demo and the application: every at-risk batch is a live order, tracked to its best exit the way India tracks a delivery. Apple HIG behaviour and shadcn anatomy: frosted bars and sidebar, large titles that collapse, inset grouped lists, sheets with detents, a nine-stop tracker, a schematic cluster map with the godown pin and the van route. Sage-tinted neutrals: light ground #f2f6f3 with white cards, dark ground #070b09 with #101613 surfaces and a faint green aurora. The v1 green modernised as the brand (#167a52 light, #3ccb8a dark); amber only for the human yes (the approval); red only for risk and the bin; violet only for ExpireSoon; colour only where something is live. Type: Bricolage Grotesque for display and numerals at Monzo weight, with the rupee sign and paise set small and urgency carried in the numeral's own width and weight; Geist for the interface; Geist Mono for ids, times and API cards; Noto Sans Devanagari for Hindi. The mark is a green squircle with the route drawn as an S from the godown dot to an amber pin; the splash draws it. Numbers roll in place when an agent changes them; Approve fills the tracker, draws the van route and rolls the swing. Soft 3D renders (local Qwen, provenance in design3/system/img/manifest.json) and an LTX carton loop are the imagery. Tokens, components and screens live in design3/; DESIGN.md records the system.

Identity v2 (design2, SC-7), superseded by v3: Sivakasi matchbox label chromolithography (Day #f2eee4, Night #101433, seven inks, Bungee and Anek). It remains in design2/ for reference.

The v1 identity (deep green #176b4e with amber #e3b74d, red for risk, purple for ExpireSoon, blue for push; Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono, Noto Sans Devanagari; the green rounded-square mark) remains in the earlier documents (journey map, tech-stack document, story, video) and the v1 prototype under design/.

Portraits of the seven people and the admin exist in docs/story-img/p-*.jpg and, cropped for v3, in design3/system/img/people/; v3 product and scene renders in design3/system/img/ and the carton loop in design3/system/media/ (each with a .prompt.json provenance sidecar).

## Evidence on Hand

- Money model, product table and demo data: docs/smart-clearance-story.html and video/narration.json.
- Journey map with nine stages and the prototype screen list: docs/dobara-journey-map.html.
- Tech stack with roles, sign-in modes, Playwright flows at 390/820/1440: docs/smart-clearance-tech-stack.html.
- Illustrations and portraits: docs/story-img/ (public at raw.githubusercontent.com/aibuilder2026/smart-clearance/main/docs/story-img/).
- No real customers, benchmarks or prices beyond the demo data set; Munchly Foods, Glowra and ExpireSoon are fictional.

## Product Principles

1. Show the money before asking for the yes; every number carries its working.
2. One human tap releases execution; the agents do the running around and show their work as a timeline.
3. Verify from the shelf, not the spreadsheet: the label photo is the source of truth.
4. Every rupee, credit and kilo lands in one ledger that finance and sustainability both read.
5. Phone-first for the trade: the distributor and the retailer act from a notification in one tap, in their language.

## Accessibility & Inclusion

Hindi and Marathi strings for retailers and distributors; 44 px targets; readable on cheap Android phones in sunlight (strong contrast, no colour-only meaning); reduced-motion respected.
