# SC-87 · The staff sale, and what is left at the godown

## The request

The maintainer, on 8 Oct, looking at the Mango Drink's journey in Munchly's workspace:

> "I also see staff sale and Kirana split for Mango drink, something does not add on for this journey."

> "I need Mango Drink batch and Masala chip batch to showcase demo … the logic has to be dynamic not stubbed or hardcoded."

Their answers to three questions:
- **Who runs the staff sale:** "Distributor records it (Recommended)", after a short design round.
- **Kirana orders:** "By hand only". Units no shop ordered are reported, not counted as sold.
- **Reset scope:** "The journey's data (Recommended)" (SC-88).

## Where it stands

SC-86 runs every line of a plan in backend-api:
- The staff sale opens when the plan is approved: `journey.staff`, `{status: open, units, price, godown}`.
- It is recorded once, by the batch's own distributor: `POST /v1/workspaces/{ws}/cases/{ref}/staff-sale {sold}`, which needs `staff.record`.
- The figures count only what each channel took (money.js `realised`). The units no channel took are left at the godown.

SC-85 made the screens follow each case's own plan. Nothing in the UI records the sale, or shows what was left.

## The options

All three were mocked on the real kit (`staff/mockup.html`, `staff/staff87.jsx`). Each shows Lakshmi Agencies' phone beside Priya's Execution.

The Mango Drink (MF-2410-118):
- **The plan:** 1,372 to the kiranas, 150 to the staff sale at ₹8, 58 to a food bank, for a net of ₹16,917.
- **The example:** 1,180 ordered and 120 sold to staff. That leaves 222 packs at the godown and a net of ₹14,469.

The options:
- **A, a card on Today (recommended).**
  - A Staff sale card on the distributor's Today: the packs, the price, her UPI code, and one stepper to record what sold.
  - A matching card on Execution.
  - A Left at the godown card, line by line, once the lines are done.
- **B, a running tally.**
  - A sale sheet with the UPI code, +1 and +10 as staff pay, then Close the sale.
  - Execution shows the tally live, and each card notes what its line left.
  - The backend keeps the count while the sale is open.
- **C, one question at the end.**
  - Nothing to do while the sale runs.
  - When it closes, a push asks "How many of the 150 sold to staff?". This needs a `staff.close` timer.
  - Execution opens with one line for the godown.

Shared by all three: the closing push to Priya, giving what was recovered of the plan, by channel, and what the godown still holds.

An open question: in the build, should the UPI code be a real payment code for the distributor's fictional address, or an illustration?

## The pick

Waiting for the maintainer's pick.
