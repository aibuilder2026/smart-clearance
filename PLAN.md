# Short-Date Router — India prototype plan

*Idea-refining draft, 2 Oct 2026. Hackathon track: Retail & Commerce (inventory intelligence) / Manufacturing (waste reduction). Google Cloud stack.*

---

## 1. One-line pitch

> **"Every near-expiry carton gets a second chance, chosen by AI."**
> Quick-commerce apps reject stock with less than 60–90 days of shelf life. Short-Date Router watches a brand's or distributor's batches, decides for each batch which Indian channel recovers the most money in the days left (NearXpiry, kirana stores, B2B buyers, discount D2C, staff sale, food bank), then does the work: it writes the listing, posts it, chases the buyer, and generates the paperwork.

**Why the US model is the right starting point, and what we change.** Spoiler Alert (USA) proves the economics: AI-priced closeouts, a managed buyer marketplace, and awarding tools. Its customers (Nestlé, Danone, Kraft Heinz, Mondelēz) report 50% growth in discounted revenue and 75% faster offers to buyers. But Spoiler Alert assumes one thing India does not have: a few large, verified liquidators who buy by the truckload. Indian recovery demand is fragmented across 10 million kirana outlets, 100,000+ distributors, a handful of young marketplaces (NearXpiry, EOL Stocks, Excess2Sell), and food banks. **In India the hard part is not the auction. It is choosing and reaching the channel.** That is what the router does.

---

## 2. What is already out there (and why we still have a gap)

| Player | What it is | Decision layer? |
|---|---|---|
| **Spoiler Alert** (US) | AI closeout software + managed buyer marketplace for CPG brands | Yes, but US-only and B2B-liquidator-centric |
| **Optoro** (US) | AI returns disposition (restock / resale / donate / destroy) | Yes, general merchandise, not expiry-driven |
| **NearXpiry** (Ajmer, India) | "India's first B2B near-expiry marketplace": label scan → list in 2 min, buyers bid with a 15% token, chat with seller; 500+ sellers, 10k+ products; Android app, web; 5 free listings then ₹100 each | No. It is a channel. **We route into it.** |
| **EOL Stocks** (Ahmedabad) | B2B liquidation app, started with phones | No. A channel. |
| **Excess2Sell** (Mumbai) | 8-year-old B2B excess-inventory liquidation platform | No. A channel. |
| **GoFig** (Pune) / **Gauraa** (Kolkata) | Consumer resale of near-expiry FMCG (GoFig: own site; Gauraa: Amazon/Flipkart/Instamart) | No. Channels. |
| **Kirana Club** (Meesho), **Udaan** | Kirana ordering networks (Kirana Club claims 40 lakh kiranas) | No. Potential channels. |
| **Bizom / FieldAssist / Botree** | Distributor management systems; log expiry returns and claims | They see the problem, they do not solve it. **Data source.** |
| **RescueFlow AI** (hackathon) | Agents matching restaurant surplus to NGOs | Donation only, no value recovery |

**Gap:** nobody in India decides, batch by batch, where short-dated stock earns the most and then executes across channels. Marketplaces want you to list; DMS tools want you to record the write-off. The router sits between them.

Correction to the earlier research note: NearXpiry does exist (nearxpiry.com, TechnoAce Consultancy Services, Ajmer). Our earlier message said it could not be confirmed; it is confirmed and it is the best first channel partner.

---

## 3. Three India-only reasons this wins

1. **GST makes destruction expensive.** Under CGST Section 17(5)(h), goods that are destroyed, written off or given away as free samples trigger a reversal of the input tax credit (CBIC Circular 72/46/2018 covers time-expired goods). Selling at even 30% of MRP keeps the ITC and brings cash. Our recovery maths shows the **true cost of a write-off = lost value + ITC reversal + disposal + waste liability**, and compares every channel against it. No Indian tool shows that number today.
2. **Waste is now a board-level number.** SEBI's BRSR Core (assured for the top 1,000 listed companies from FY 2026-27, plus value-chain disclosures for the top 250) includes "embracing circularity: waste management". The 2026 Solid Waste and Plastic Waste rules classify quick-commerce firms as brand owners and bulk waste generators. Every batch we route becomes a line in the BRSR waste table, with evidence.
3. **FSSAI already allows the donation channel.** The Food Safety and Standards (Recovery and Distribution of Surplus Food) Regulations, 2019 give a legal path for donating packaged food before expiry via licensed surplus-food organisations (Feeding India by Zomato, India FoodBanking Network, No Food Waste). The router can produce the compliance checklist and donation receipt.

---

## 4. The user journey (demo script)

**Persona A: Priya, Regional Supply-Chain Manager, mid-size snacks brand ("Munchly Foods"), Pune.**
**Persona B: Rakesh bhai, Munchly's super-stockist/distributor, Nagpur, runs his godown on Tally + WhatsApp.**
**Persona C: Buyer on NearXpiry (a kirana wholesaler in Hyderabad).**

### Step 0: Onboard (2 minutes)
Priya connects Munchly's distributor data (demo: a BigQuery table seeded from a Bizom-style DMS export; 200 SKUs, 40 distributors, batch-level stock, pincode sell-through). She sets guardrails once: channel allow-list, floor price per category (e.g. never below 35% of MRP for biscuits), brand-safety rules (no staff sale for premium gifting packs), donation partners.

### Step 1: Watcher Agent raises a risk (the trigger)
A Pub/Sub event fires: *Batch MF-2409-117, Munchly Masala Chips 150 g, 1,840 units, best-before 18 Nov 2026 (47 days), sitting at Nagpur godown.* The Watcher checks each quick-commerce gate: Blinkit needs 90+ days, Zepto and Instamart need about 60% of life remaining. Verdict: **"Blocked from q-commerce in 0 days. At current Nagpur sell-through (12 units/day) only 560 units will sell before expiry. 1,280 units at risk, ₹38,400 at MRP."**

Priya gets this as a WhatsApp message in Hindi or English (and on the dashboard). Rakesh bhai gets the same on WhatsApp with a photo prompt: "Send a photo of the carton label to confirm batch and date." He photographs the carton; **Gemini vision reads batch number, MFG, best-before and MRP from the label** (same trick NearXpiry's app uses for scanning). This matters because distributor stock data in India is often stale or wrong.

### Step 2: Valuer Agent prices every channel against time
For the 1,280 at-risk units the Valuer computes, per channel:

| Channel | Needs | Expected price (% MRP) | Days to clear | Net recovery | Note |
|---|---|---|---|---|---|
| Write-off (baseline) | – | 0 | – | **–₹9,100** | ITC reversal + disposal |
| NearXpiry listing | ≥ 30 days left | 45–55% | 5–9 | ₹17,800 | buyer pays freight, 15% token |
| Kirana push, Nagpur + Wardha cluster | ≥ 20 days | 60% | 10–14 | ₹14,900 (capped at 620 units by demand) | high sell-through pincodes |
| Discount D2C (GoFig / own site) | ≥ 25 days | 50% | 7–12 | ₹6,200 (Pune/Mumbai only) | small volume |
| Staff sale | any | 40% | 3 | ₹2,400 (cap 150 units) | |
| Food bank (Feeding India) | ≥ 15 days | 0 | 2 | –₹600 freight, +ESG credit, no ITC reversal if structured as CSR* | *to verify with tax advisor |

Prices come from (demo) a BigQuery table of past clearance deals plus NearXpiry's visible listings. The Valuer learns from each closed deal.

### Step 3: Router Agent proposes a split, Priya approves in one tap
The Router does not pick one channel; it **splits the batch** to maximise net recovery under the time constraint: *620 units → kirana cluster (60%), 510 units → NearXpiry (50%), 150 units → staff sale. Expected ₹27,900 recovered (73% of MRP on the at-risk units) vs. a ₹9,100 loss on write-off.* It explains its reasoning in plain language and shows the alternative (all to NearXpiry: ₹17,800, faster but less).

Priya replies "Approve" on WhatsApp or clicks on the dashboard. Guardrails already allow this, so no second sign-off is needed.

### Step 4: Executor Agents do the work
- **Lister Agent (NearXpiry).** Writes the listing (title, batch, best-before, MRP, offer, quantity, Nagpur, storage, photos from Rakesh bhai's WhatsApp) and posts it through the agentic interface (see Section 6). It also sets a reserve price and a counter-bid rule: "accept ≥ ₹X, counter anything between floor and X, reject below floor."
- **Kirana Outreach Agent.** Builds a Hindi/Marathi WhatsApp broadcast to the 38 kiranas in the cluster with the best sell-through for this SKU, with a one-tap order link, scheme text ("buy 10 get 2"), and a 48-hour window. Replies flow back to Rakesh bhai's van-sales route.
- **Staff Sale Agent.** Posts a notice to Munchly's HR channel with a UPI QR and a quantity cap.
- **Negotiator Agent.** When a NearXpiry buyer bids ₹135 against ₹140 and chats "Can you dispatch in 24 hours?", the agent answers from Rakesh bhai's dispatch calendar, accepts or counters per the rule, and pings Priya only for exceptions.

### Step 5: Paperwork Agent closes the loop
For each sale it drafts: tax invoice with the discounted price (MRP unchanged, so no Legal Metrology dual-MRP issue), e-way bill if the consignment exceeds ₹50,000 or crosses state lines, credit note to the distributor, and for donations the FSSAI surplus-food checklist and a receipt from the food bank. For anything that still expires: a destruction certificate and the ITC-reversal entry, so finance is never surprised.

### Step 6: Recovery dashboard (Looker)
₹ recovered vs. write-off baseline, % of MRP, units saved from landfill, kg waste avoided, CO₂e, meals donated, split by SKU, distributor and channel. One button: **"Export BRSR waste table"**. That is the slide for the CFO and the sustainability head.

**Demo closing line:** "Last month Munchly would have destroyed ₹38,400 of chips and reversed ₹5,500 of GST. Instead it recovered ₹27,900, fed 300 families, and has the paperwork to prove it."

---

## 5. Agent architecture (Google Cloud, ADK)

```
BigQuery (batches, sell-through, deal history)
Pub/Sub "batch.at_risk" ──► Watcher Agent ──► Valuer Agent ──► Router Agent ──► Priya (WhatsApp / web approve)
                                                 ▲                              │
                                  Gemini vision (label photo)                   ▼
                                                              Executor Agents (parallel, ADK sub-agents)
                                                              ├─ Lister Agent  ─► NearXpiry (browser/computer-use or API)
                                                              ├─ Kirana Outreach Agent ─► WhatsApp Business API
                                                              ├─ Staff Sale Agent ─► HR channel
                                                              ├─ Negotiator Agent ─► NearXpiry bids & chat
                                                              └─ Donation Agent ─► food-bank partner
                                                                              │
                                                              Paperwork Agent (invoice, e-way bill, credit note, FSSAI, 80G)
                                                                              │
                                                              Impact ledger ─► Looker (BRSR export)
```

- **Runtime:** Vertex AI Agent Engine, ADK multi-agent (one orchestrator, tool-using sub-agents), Gemini 2.5/3 Pro for reasoning, Gemini Flash for the high-volume WhatsApp replies.
- **Data:** BigQuery for batches, sell-through by pincode, channel price history; Cloud SQL for listings and bids state; Cloud Storage for label photos.
- **Events:** Pub/Sub topics `batch.at_risk`, `offer.received`, `deal.closed`.
- **Channels:** WhatsApp Business Cloud API (Meta) via Cloud Run webhook; NearXpiry via computer-use agent; Looker Studio dashboard.
- **Human in the loop:** nothing is published or accepted without a one-tap approval the first N times per channel; after that, within guardrails, the agent runs on its own and reports.

---

## 6. Can an agent post on NearXpiry? What we found

Checked on 2 Oct 2026 against nearxpiry.com:

- The public seller flow is: create a business account → "Sell near expiry stock" → add product, batch, labelled date, location → set quantity and offer price → publish for buyer review. Fields seen: product, batch number, best-before/expiry, MRP, offer price, quantity, location/city, storage condition, invoice/traceability documents where required. Label scanning exists in the app.
- **No public API or bulk upload is documented.** But the site's own pages link to a backend, `api2.nearxpiry.com/catalogue/products/create/`, and a listing route `/accounts/login/?next=/clearance/create/`. Both redirect to login without a session. So the website and app already talk to a JSON API; there is just no partner key yet.
- Listings cost nothing for the first 5, then ₹100 each. Buyers bid with a 15% token and pay the rest within 48 hours; chat is in-app.

**Three integration options, in order of how we'd demo them:**

1. **Computer-use agent (demo day).** Gemini 2.5 Computer Use (on Vertex AI, GA since Oct 2025) drives a headless browser through NearXpiry's real listing form, with a screenshot-by-screenshot audit trail and a "pause before Publish" checkpoint that Priya approves. This works today against any marketplace with a web form, which is exactly the Indian situation (NearXpiry, EOL Stocks, Excess2Sell all have forms, none have partner APIs). Needs a NearXpiry seller account that we create by hand before the demo.
2. **Direct API (if NearXpiry agrees).** The `api2` endpoints are the fast path; we propose a "Partner listing API" to NearXpiry's team (TechnoAce, Ajmer). A hackathon partnership email is a cheap win and a good slide.
3. **Listing pack (fallback).** The agent produces a ready-to-paste listing (CSV + text + photos) and a WhatsApp message to NearXpiry's seller-support.

For the kirana channel there is no form at all, so the agent uses WhatsApp directly, which is where Indian trade already lives (WhatsApp-run distributors report ~2x outlets per rep per week in 2026 trade surveys).

---

## 7. What is genuinely new (say this to the judges)

1. **Channel routing with a time constraint, not a marketplace.** We are Spoiler Alert's "awarding brain" rebuilt for a fragmented market: the agent splits one batch across kiranas, a marketplace and a staff sale to beat the clock.
2. **GST-aware recovery maths.** Write-off cost includes the ITC reversal. First tool in India to show that number per batch.
3. **Label-photo truth.** Gemini reads the carton; the agent trusts the photo over the ledger. Built for godowns where the data is on paper.
4. **WhatsApp-native, vernacular.** Distributor and kirana both act with one tap in Hindi/Marathi/Tamil; no new app to learn.
5. **Agent that works the marketplace, not just lists on it.** Reserve price, counter-bids, chat replies, dispatch promises.
6. **Compliance output as a feature.** e-way bill, credit note, FSSAI donation checklist, BRSR waste line. The CFO and the sustainability head both get something.

---

## 8. Scope for the hackathon build

**In scope (synthetic data):** 200 SKUs (packaged food + personal care), 40 distributors, 5 channels, 90 days of sell-through by pincode; Watcher → Valuer → Router → Lister (NearXpiry via computer-use, sandboxed) → WhatsApp kirana broadcast (test numbers) → Paperwork PDFs → Looker dashboard.
**Out of scope:** medicines (licensed buyers only, Drugs & Cosmetics Act), live payments, real food-bank API.

**Build order (suggested):**
1. BigQuery schema + synthetic generator (day 1)
2. Watcher + Valuer agents with explainable channel table (day 1–2)
3. Router + WhatsApp approval loop (day 2)
4. Lister agent on NearXpiry sandbox account + Negotiator stub (day 2–3)
5. Paperwork PDFs + Looker dashboard + BRSR export (day 3)
6. Demo script with Priya / Rakesh bhai / buyer (day 3)

---

## 9. Open questions to settle this week

1. Do we approach NearXpiry (TechnoAce, Ajmer) for a partner API or a seller sandbox? Who emails?
2. Which food-bank partner's intake rules do we model: Feeding India (Zomato) or India FoodBanking Network? Confirm they accept packaged near-expiry stock and what minimum shelf life they want.
3. ITC treatment of donations: Section 17(5)(h) blocks ITC on "gifts"; CSR-route donations may differ. Need one paragraph from a GST advisor or we label it "indicative".
4. Hindi/Marathi WhatsApp copy: who reviews tone? Kirana messages must read like a distributor, not a bank.
5. Name: keep "Short-Date Router" or something a distributor would say ("Expiry Bachao"?).

---

## 10. Sources

- Spoiler Alert: https://www.spoileralert.com/ · iQ: https://www.spoileralert.com/iq · Enterprise: https://www.spoileralert.com/enterprise/
- NearXpiry: https://nearxpiry.com/ · Sell: https://nearxpiry.com/sell/ · Demo: https://nearxpiry.com/demo/ · Seller guide: https://nearxpiry.com/blog/sell-near-expiry-stock/ · Play Store: https://play.google.com/store/apps/details?id=com.nearxpiry
- EOL Stocks: https://yourstory.com/2020/12/startup-ahmedabad-eol-stocks-b2b-marketplace · Excess2Sell: https://www.excess2sell.com/
- GoFig: https://gofig.in/ · Gauraa: https://thebetterindia.com/315182/kolkata-milind-shah-started-gauraa-to-prevents-fmcg-products-from-going-to-landfills/
- Kirana Club: https://kirana.club/ · Udaan: https://play.google.com/store/apps/details?id=com.udaan.android
- Quick-commerce shelf-life gates: https://confetti.design/blog/quick-commerce-brand-eligibility-india · https://unicommerce.com/blog/how-to-sell-on-blinkit-seller-onboarding-guide-2026/
- GST ITC reversal (Sec 17(5)(h), Circular 72/46/2018): https://www.taxmann.com/post/blog/analysis-itc-reversal-for-time-expired-goods-under-the-cgst-act
- FSSAI surplus food regulations 2019: https://www.fssai.gov.in/upload/uploadfiles/files/Press_Release_Gazette_Notification_Surplus_Food_06_08_2019.pdf · https://ssrana.in/articles/fssai-food-donation-regulations/
- SEBI BRSR Core 2026: https://greensutra.in/news/brsr-all-you-need-to-know/ · https://assets.kpmg.com/content/dam/kpmgsites/in/pdf/2026/02/chapter-1-emerging-trends-in-brsr-reporting-by-listed-companies.pdf.coredownload.pdf
- Food banks: https://foodbanking.org/?p=2144 (GFN partners in India)
- DMS / WhatsApp trade: https://blog.massistcrm.com/the-dms-revolution-in-fmcg-whats-changing-across-indias-supply-chains · https://richautomate.in/blog/whatsapp-b2b-fmcg-distribution-india-2026
- Gemini 2.5 Computer Use: https://blog.google/technology/google-deepmind/gemini-computer-use-model/
- Legal Metrology (no dual MRP): https://ssrana.in/articles/importance-of-writing-best-before-and-manufacturing-date-on-labels/
- RescueFlow AI: https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-ii/hackstorm/rescueflow-ai
