# The architecture scene's logos (SC-219, cut 14)

- `*.png`: Google Cloud's product icons (the Google Cloud 2021 icon set), laid out at 512 px in a scratch Lucid document
  ("Smart-Clearance film icons (SC-219 scratch, safe to delete)") through the Lucid connector and exported as one PNG,
  then cut into masks by their ink (white, with the icon's two tones as alpha), so the scene tints them to its own
  inks: `gcloud` (Google Cloud), `auth` (Identity Platform, which Firebase Authentication runs on), `run`, `sql`,
  `pubsub`, `sched`, `bq`, `gcs`, `vertex` (Agent Platform), `secret`, `trace`, `logging`, `monitoring`, `build`,
  `registry`. Google publishes these icons for architecture diagrams of its products.
- `firebase.svg`, `googlegemini.svg`: Firebase's flame and Gemini's spark from simple-icons (CC0 1.0; the marks
  themselves are Google's), downloaded from `cdn.jsdelivr.net/npm/simple-icons@13/icons/` on the maintainer's yes. Each
  is a single path; `arch.js` carries the two paths too (`FIREBASE_D`, `GEMINI_D`), and draws Gemini's orb spark from
  its own.
