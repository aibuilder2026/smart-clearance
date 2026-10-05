// The street the packs take (design3/site Exits, SC-28): the plate's own coordinates, the road and each exit's way in,
// and the dots the batch leaves the godown as. Everything is in the street plate's pixels (4256 × 992); the drawing is
// an SVG over the plate with the same viewBox, so it scales with it.

export const PW = 4256;
export const PH = 992;
export const EX_AR = PW / PH;

/** where each exit stands along the plate, as a share of its width: kiranas, ExpireSoon, staff sale, food bank, bin */
export const EXIT_X = [0.35, 0.515, 0.65, 0.785, 0.93] as const;

/** the godown's door, the road, the shopfronts' foot and the heap */
export const DOOR = { x: 610, y: 690 };
export const ROAD = 812;
export const FRONT = 646;
export const HEAP = 742;

type Way = { x: number; bin?: boolean };
export const exX = (e: Way) => Math.round(e.x * PW);
export const endY = (e: Way) => (e.bin ? HEAP : FRONT);

/** out of the door and onto the road */
export const OUT = `M${DOOR.x} ${DOOR.y} C${DOOR.x + 30} ${ROAD - 40} ${DOOR.x + 120} ${ROAD} ${DOOR.x + 260} ${ROAD}`;
/** the road, from the door to just short of the bin */
export const TRUNK = `${OUT} L${Math.round(EXIT_X[4] * PW) - 110} ${ROAD}`;
const turn = (e: Way) => {
	const x = exX(e);
	return ` Q${x} ${ROAD} ${x} ${ROAD - 100} L${x} ${endY(e)}`;
};
/** an exit's way in, off the road */
export const spur = (e: Way) => `M${exX(e) - 110} ${ROAD}${turn(e)}`;
/** the whole way a pack takes to an exit: out of the door, along the road, and in */
export const route = (e: Way) => `${OUT} L${exX(e) - 110} ${ROAD}${turn(e)}`;
/** the cross where the bin's way would have ended */
export const CROSS = `M${Math.round(EXIT_X[4] * PW) - 15} ${HEAP - 15} l30 30 m0 -30 l-30 30`;

/** a dot is about 50 packs */
export const DOT = 50;
/** the dots, in the order they leave: the two streams interleaved, each dot naming its exit (12 to the kiranas and 15
 *  to the buyer, for 588 and 772 packs) */
export function dots(a: { id: string; packs: number }, b: { id: string; packs: number }): string[] {
	const k = Math.round(a.packs / DOT);
	const n = k + Math.round(b.packs / DOT);
	const out: string[] = [];
	let sent = 0;
	for (let i = 0; i < n; i++) {
		const toA = sent < Math.round(((i + 1) * k) / n);
		out.push(toA ? a.id : b.id);
		if (toA) sent += 1;
	}
	return out;
}

/** when each dot leaves (s) and how long it takes to arrive, by the length of its way (design3: 0.55 s, then one every
 *  0.105 s; 0.42 s plus 1 s for every 5,200 px of road), so the whole batch is out and in under five seconds */
export const leaves = (i: number) => 0.55 + i * 0.105;
export const travel = (length: number) => 0.42 + length / 5200;
