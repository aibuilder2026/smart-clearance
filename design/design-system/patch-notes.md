# Review round 1 (2026-10-03)

Changes the finish review made to the system, applied in the prototype and reflected here:

- Batch cards lost their 4 px product stripe: zones carry colour, cards stay quiet. The at-risk card gets a breathing red ring (`.bcard .ring`, 1.6 s, off under reduced motion) as the board's one authored motion.
- Push cards no longer carry an app-name line above the title; the SC mark names the sender and the time sits beside the title (`.push .pt` + `.pwhen`).
- The rotated CSS stamp on document previews is retired; status is a chip.
- Toasts: one visible at a time, cleared when the signed-in person changes, anchored top-right on tablet and desktop, action under the text on phones.
- Impact and ledger pages lead with the batch ledger and its evidence; no KPI tile row. The quarter summary stays as bars in the aside.
- Tablet (760 to 1099): the at-risk zone spans the top row so the focal card is in the first viewport. Phone: the zone strip leads with At risk.
- Phone device frame: shell, sign-in and camera start below the 34 px notch.

`styles.css` here already carries the toast and card rules in their final form; `components.html` shows the push card and document preview in the new form.
