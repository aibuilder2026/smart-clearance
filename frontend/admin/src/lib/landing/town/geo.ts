// The town's geography (design3/site/town.jsx GEO): fractions of the plate (business.webp, its night and its depth map,
// composed alike). Pins sit on their places' roofs; each agent's post is where it works, its name to the side the label
// says; the routes follow the plate's green path from the maker's loading bay, along the front road to the kiranas, and
// up to the highway to the buyer's warehouse.
export type Pt = [number, number];
export type Shot = [number, number, number];

export const GEO = {
	nw: 2752,
	nh: 1536,
	places: {
		maker: [0.175, 0.415],
		godown: [0.47, 0.44],
		kiranas: [0.79, 0.45],
		buyer: [0.8, 0.32],
		foodbank: [0.55, 0.385],
		landfill: [0.16, 0.265]
	} as Record<string, Pt>,
	// on phones the food bank's pin moves to the kitchen's right, clear of the distributor's
	phonePlaces: { foodbank: [0.6, 0.36] } as Record<string, Pt>,
	posts: {
		data: [0.355, 0.6],
		watcher: [0.395, 0.475],
		vision: [0.585, 0.455],
		valuer: [0.645, 0.545],
		router: [0.6, 0.705],
		you: [0.15, 0.585],
		paperwork: [0.085, 0.64],
		outreach: [0.875, 0.5],
		lister: [0.885, 0.415],
		negotiator: [0.955, 0.47],
		impact: [0.27, 0.315]
	} as Record<string, Pt>,
	labels: { data: 'left', watcher: 'left', negotiator: 'left', lister: 'left', outreach: 'left' } as Record<
		string,
		'left' | 'right'
	>,
	routes: {
		out: [
			[0.312, 0.66],
			[0.335, 0.72],
			[0.38, 0.748],
			[0.436, 0.756],
			[0.5, 0.762]
		],
		kiranas: [
			[0.5, 0.762],
			[0.58, 0.78],
			[0.65, 0.795],
			[0.727, 0.814],
			[0.8, 0.83]
		],
		buyer: [
			[0.5, 0.762],
			[0.58, 0.78],
			[0.727, 0.814],
			[0.836, 0.833],
			[0.86, 0.8],
			[0.85, 0.68],
			[0.815, 0.51],
			[0.735, 0.38],
			[0.69, 0.31],
			[0.75, 0.31],
			[0.84, 0.335]
		]
	} as Record<string, Pt[]>,
	batch: { maker: [0.31, 0.655], godown: [0.5, 0.665] } as Record<string, Pt>,
	// the camera, per beat and per place: the plate point it centres and how near; desktops and phones apart
	shots: {
		wide: {
			rest: [0.5, 0.5, 1],
			make: [0.22, 0.58, 1.65],
			stock: [0.5, 0.56, 1.55],
			risk: [0.5, 0.55, 1.7],
			route: [0.56, 0.52, 1.3],
			yes: [0.17, 0.58, 1.7],
			sell: [0.8, 0.53, 1.3],
			report: [0.2, 0.47, 1.4],
			maker: [0.18, 0.58, 1.8],
			godown: [0.5, 0.6, 1.8],
			kiranas: [0.8, 0.62, 1.8],
			buyer: [0.8, 0.3, 2],
			foodbank: [0.52, 0.4, 2],
			landfill: [0.17, 0.32, 2]
		},
		phone: {
			rest: [0.5, 0.55, 1],
			make: [0.22, 0.6, 1.3],
			stock: [0.5, 0.62, 1.3],
			risk: [0.5, 0.6, 1.45],
			route: [0.55, 0.55, 1.1],
			yes: [0.15, 0.6, 1.4],
			sell: [0.8, 0.6, 1.15],
			report: [0.17, 0.5, 1.2],
			maker: [0.18, 0.58, 1.4],
			godown: [0.5, 0.6, 1.4],
			kiranas: [0.8, 0.62, 1.4],
			buyer: [0.8, 0.32, 1.6],
			foodbank: [0.52, 0.4, 1.6],
			landfill: [0.17, 0.32, 1.6]
		}
	} as Record<'wide' | 'phone', Record<string, Shot>>,
	// the band behind the heading on desktops, as fractions of the stage: solid haze, then clear
	haze: [0.3, 0.42] as Pt
};

/** the stage's box, and the plate cover-fitted in it: the world at rest */
export type Fit = { W: number; H: number; w: number; h: number; ox: number; oy: number; wide: boolean };
export const fitOf = (W: number, H: number): Fit => {
	const s = Math.max(W / GEO.nw, H / GEO.nh),
		w = GEO.nw * s,
		h = GEO.nh * s;
	return { W, H, w, h, ox: (W - w) / 2, oy: (H - h) / 2, wide: W >= 900 };
};
export const shotOf = (g: Fit | null, id: string): Shot => {
	const S = GEO.shots[g && g.wide ? 'wide' : 'phone'];
	return S[id] ?? S.rest;
};
/** a place's pin, at this width */
export const placeAt = (g: Fit, id: string): Pt => (!g.wide && GEO.phonePlaces[id]) || GEO.places[id];
/** a plate point, in the world's px at rest */
export const wpx = (g: Fit, p: Pt): Pt => [p[0] * g.w, p[1] * g.h];
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** a point along a polyline, t from 0 to 1 by length */
export function along(pts: Pt[], t: number): Pt {
	const seg: number[] = [];
	let L = 0;
	for (let i = 1; i < pts.length; i++) {
		const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
		seg.push(d);
		L += d;
	}
	let s = clamp(t, 0, 1) * L;
	for (let i = 0; i < seg.length; i++) {
		if (s <= seg[i] || i === seg.length - 1) {
			const u = seg[i] ? Math.min(1, s / seg[i]) : 0;
			return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
		}
		s -= seg[i];
	}
	return pts[pts.length - 1];
}
