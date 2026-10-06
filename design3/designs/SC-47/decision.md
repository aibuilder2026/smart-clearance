# SC-47: quick-commerce gates per SKU, with a per-batch override

**The request** (the maintainer, 6 Oct 2026): Blinkit and Zepto/Instamart configurations should be at the SKU and batch
level, for the agents to use when they run for clients. Asked how: **per SKU, with a per-batch override**, and the
client's own values **kept as the default for new SKUs**.

**The options** (`board.html`), all on Munchly Foods' Supply chain tab:

- **A, on each SKU** (recommended): the SKU table gains each SKU's two gates (its own or the default) and its open
  batches; a row opens an SKU sheet with its gates, and its batches with pass or fail and any override.
- **B, a gates matrix**: the default and every SKU in one table edited in place and saved together, every batch override
  listed under it, and a sheet to add one.
- **C, batch first**: a Batches tab with every open batch against its gates, where each came from, and a batch sheet
  for the override.

All three: a batch's gates are its override, else its SKU's, else the client's default, each value on its own; the
database keeps nullable gate columns on `skus` and `batches` (with the override's reason, author and time) and a
`best_before` on batches; `sc.batch_gates` gives the agents each open batch's gates, their source and pass or fail; every
change writes its audit line.

**The pick:** **A, on each SKU**, picked by the maintainer on 6 Oct 2026, the recommended option. The board was
published to platform v3 as `SC-47 design review.html`, with `SC-47 option A.html`, `SC-47 option B.html` and
`SC-47 option C.html`.

The build: backend-api first (migration 0002, the SKU gates and batch override routes, `sc.batch_gates`, hydrate and
the Munchly import), then design3's console (`console/console.jsx`: the SKU table's gate columns, an SKU sheet, the
profile's labels; `core/platform.js`), then the SvelteKit console and `@smart-clearance/api`.
