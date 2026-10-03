# Patch notes

## 2.0.0 · 3 Oct 2026

A replacement visual world (SC-7, design v2). The v1 system (paper-light ground, Bricolage Grotesque, IBM Plex, deep green and amber) is retired; its files stay under `design/design-system` for the record.

- The label world: Sivakasi chromolithograph inks, black keylines on every plate, display type with a second ink, plate-registration motion.
- Two editions, Day and Night, each composed on its own; `data-theme` on the app root, the switch in every top bar, the choice remembered per viewer.
- Seven inks with fixed jobs: ultramarine chrome, emerald agent, chrome-yellow human yes, vermilion risk, violet ExpireSoon, kraft carton, ink keylines.
- Type: Bungee and Bungee Shade; Anek Latin and Anek Devanagari with the width axis; Azeret Mono for data.
- New components: the label and the sheet, ticks, tape, live tiles, the duration-true timeline, the notice, snap cards, OTP, segmented, tabs, menu, the mark and the splash.
- Imagery: eleven generated plates with prompt sidecars; the v1 portraits stay.
- Kit: `kit.jsx` exposes `window.SC2`; the prototypes build from it and copy nothing.
