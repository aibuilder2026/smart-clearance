/* SC-32 round 2: the whole-business plate's geography, as fractions of the plate (img/business.webp, business-night.webp
   and business-depth.webp, composed alike). Pins sit on their places' roofs; each agent's post is where it works, its
   name to the side the label says; the routes follow the plate's green path from the maker's loading bay, along the
   front road to the kiranas, and up to the highway to the buyer's warehouse. */
window.SC32R2_GEO = {
  day: '../img/business.webp', night: '../img/business-night.webp', depth: '../img/business-depth.webp', nw: 2752, nh: 1536,
  phoneRest: [0.5, 0.5],
  places: {
    maker: { pin: [0.175, 0.415] }, godown: { pin: [0.47, 0.44] }, kiranas: { pin: [0.79, 0.45] },
    buyer: { pin: [0.8, 0.32] }, foodbank: { pin: [0.55, 0.385] }, landfill: { pin: [0.16, 0.265] },
  },
  posts: {
    data: [0.355, 0.6], watcher: [0.395, 0.475], vision: [0.585, 0.455], valuer: [0.645, 0.545], router: [0.6, 0.705],
    you: [0.15, 0.585], paperwork: [0.085, 0.64], outreach: [0.875, 0.5], lister: [0.885, 0.415], negotiator: [0.955, 0.47], impact: [0.27, 0.315],
  },
  labels: { data: 'left', watcher: 'left', paperwork: 'right', negotiator: 'left', lister: 'left', impact: 'right', outreach: 'left' },
  routes: {
    out: [[0.312, 0.66], [0.335, 0.72], [0.38, 0.748], [0.436, 0.756], [0.5, 0.762]],
    kiranas: [[0.5, 0.762], [0.58, 0.78], [0.65, 0.795], [0.727, 0.814], [0.8, 0.83]],
    buyer: [[0.5, 0.762], [0.58, 0.78], [0.727, 0.814], [0.836, 0.833], [0.86, 0.8], [0.85, 0.68], [0.815, 0.51], [0.735, 0.38], [0.69, 0.31], [0.75, 0.31], [0.84, 0.335]],
  },
  batch: { maker: [0.31, 0.655], godown: [0.5, 0.665], kiranas: [0.8, 0.8], buyer: [0.84, 0.335] },
  shots: {
    wide: { rest: [0.5, 0.5, 1], make: [0.22, 0.58, 1.65], stock: [0.5, 0.56, 1.55], risk: [0.5, 0.55, 1.7], route: [0.56, 0.52, 1.3],
      yes: [0.17, 0.58, 1.7], sell: [0.8, 0.53, 1.3], report: [0.2, 0.47, 1.4],
      maker: [0.18, 0.58, 1.8], godown: [0.5, 0.6, 1.8], kiranas: [0.8, 0.62, 1.8], buyer: [0.8, 0.3, 2], foodbank: [0.52, 0.4, 2], landfill: [0.17, 0.32, 2] },
    phone: { rest: [0.5, 0.55, 1], make: [0.22, 0.6, 1.3], stock: [0.5, 0.62, 1.3], risk: [0.5, 0.6, 1.45], route: [0.55, 0.55, 1.1],
      yes: [0.15, 0.6, 1.4], sell: [0.8, 0.6, 1.15], report: [0.17, 0.5, 1.2],
      maker: [0.18, 0.58, 1.4], godown: [0.5, 0.6, 1.4], kiranas: [0.8, 0.62, 1.4], buyer: [0.8, 0.32, 1.6], foodbank: [0.52, 0.4, 1.6], landfill: [0.17, 0.32, 1.6] },
  },
  // the band behind the heading on desktops, as fractions of the stage's height: solid sky, then fading out
  sky: [0.3, 0.42],
};
// a published copy sets window.SC32R2_BASE (the commit's raw folder for round 2) before this runs, and the plates load
// from there
(function (b) { if (!b) return; const G = window.SC32R2_GEO; ['day', 'night', 'depth'].forEach(k => { if (G[k]) G[k] = G[k].replace('../', b); }); })(window.SC32R2_BASE);
