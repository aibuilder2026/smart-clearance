// SC-219 cut 12 · under the hood: the floating data centre's world. Its layout in world units (x to the right and back,
// y to the left and front, z up), a true isometric camera that can turn a few degrees about the vertical (azimuth) for
// a slow orbit, and the camera's path through the scene, laid on the narration's own words (CUE).
import { Easing } from 'remotion';
import { CUE, EASE_IO, clamp, lerp } from '../lib/base';

export const W = 1920, H = 1080;
const SINPHI = Math.sin(Math.atan(1 / Math.SQRT2)), COSPHI = Math.cos(Math.atan(1 / Math.SQRT2));   // true isometric elevation
export const K = 54 * 1.2247;   // pixels a world unit at zoom 1 (54 px along the 2:1 iso axes at 45°)

export type Cam = { x: number; y: number; z: number; zoom: number; az: number };
export type P3 = [number, number, number];

/** the world point's place on the screen, through the camera */
export function proj(c: Cam, x: number, y: number, z = 0): [number, number] {
	const s = Math.sin(c.az), co = Math.cos(c.az);
	const X = (x * co - y * s) * K, Y = (x * s + y * co) * SINPHI * K - z * COSPHI * K;
	const tx = (c.x * co - c.y * s) * K, ty = (c.x * s + c.y * co) * SINPHI * K - c.z * COSPHI * K;
	return [(X - tx) * c.zoom + W / 2, (Y - ty) * c.zoom + H / 2];
}
/** how near the viewer a world point is, for drawing back to front */
export const depth = (c: Cam, x: number, y: number, z = 0) => x * Math.sin(c.az) + y * Math.cos(c.az) + z * 0.001;
export const DEG = Math.PI / 180;

// ------------------------------------------------------------------ the layout
export type Zone = 'hall' | 'firebase' | 'run' | 'sql' | 'pubsub' | 'sched' | 'agents' | 'bq' | 'gcs' | 'gemini';
export type Rack = { x: number; y: number; w: number; d: number; h: number; zone: Zone; i: number };
export const PLATFORM = { x0: 0, x1: 27.5, y0: 0, y1: 18, slab: 0.75 };
export const racks: Rack[] = [];
const row = (zone: Zone, x0: number, y: number, n: number, w: number, d: number, h: number) => { for (let i = 0; i < n; i++) racks.push({ x: x0 + i * (w + 0.06), y, w, d, h, zone, i }); };
row('hall', 1.2, 0.6, 6, 1.08, 1.0, 2.2);      // the hall's own rows, at the back and the front
row('gemini', 9.2, 0.35, 6, 1.14, 1.25, 2.75);  // the accelerators, liquid cooled, behind the agents
row('hall', 18.2, 0.6, 7, 1.08, 1.0, 2.2);
row('agents', 8.0, 3.6, 10, 1.14, 1.0, 2.2);   // the nine AI agents and the Watcher
row('bq', 21.6, 3.6, 4, 1.12, 1.0, 2.0);       // BigQuery
row('run', 8.6, 8.8, 4, 1.14, 1.0, 2.2);        // Cloud Run, the core
row('hall', 19.6, 12.9, 6, 1.08, 1.0, 2.2);
row('hall', 1.2, 3.6, 5, 1.08, 1.0, 2.2);
export const AGENTS: [string, 'flash' | 'pro' | 'code'][] = [['Data', 'flash'], ['Watcher', 'code'], ['Vision', 'flash'], ['Valuer', 'pro'], ['Router', 'pro'],
	['Outreach', 'flash'], ['Lister', 'flash'], ['Negotiator', 'pro'], ['Paperwork', 'flash'], ['Impact', 'flash']];
export const agentRack = (i: number) => racks.filter((r) => r.zone === 'agents')[i];
export const geminiRack = (i: number) => racks.filter((r) => r.zone === 'gemini')[i];
export const bqRack = (i: number) => racks.filter((r) => r.zone === 'bq')[i];
export const SQL = { x: 15.2, y: 9.3, r: 0.8 };
export const GCS = { x: 24.2, y: 7.7, r: 0.95, h: 1.25 };
export const SCHED = { x: 19.2, y: 8.2, r: 0.46, h: 2.9 };
export const SPINE = { x0: 3.4, x1: 26.4, y: 6.4 };
export const EDGE = { x0: 1.0, x1: 7.8, y0: 12.6, y1: 16.6 };
export const SCREENS = [['app-landing.webp', 'Landing page'], ['app-console.webp', 'Console'], ['app-workspace.webp', 'Workspace'], ['app-demo.webp', 'Guided demo']]
	.map(([src, b], i) => ({ src, b, x: 1.55 + i * 1.6, y: 14.6, w: 1.45, h: 0.9, z0: 0.55 }));
export const VAULT = { x0: 8.15, x1: 16.45, y0: 8.25, y1: 10.55, h: 3.15 };
export const DESK = { x: 13.3, y: 14.2, w: 3.1, d: 0.8, h: 0.75 };
export const CORE_FRONT: P3 = [10.9, 9.8, 0.04];

// ------------------------------------------------------------------ the camera's path (a slow orbit and glides, on the words)
type Key = [number, Omit<Cam, 'az'> & { az: number }];
const A = 45 * DEG;
export const KEYS: Key[] = [
	[0.0, { x: 14.1, y: 4.6, z: 1.55, zoom: 4.8, az: A + 9 * DEG }],          // one agent's light, close
	[0.45, { x: 14.1, y: 4.6, z: 1.55, zoom: 4.55, az: A + 8.4 * DEG }],
	[3.15, { x: 13.8, y: 9.0, z: 0.4, zoom: 0.8, az: A }],                    // the whole floating hall
	[3.4, { x: 13.8, y: 9.0, z: 0.4, zoom: 0.81, az: A - 0.3 * DEG }],
	[4.45, { x: 4.8, y: 14.5, z: 0.9, zoom: 1.6, az: A - 3 * DEG }],          // the edge: the four apps
	[5.4, { x: 4.9, y: 14.4, z: 0.9, zoom: 1.64, az: A - 3.4 * DEG }],
	[6.4, { x: 11.6, y: 9.4, z: 1.0, zoom: 1.5, az: A - 1 * DEG }],           // the core: Cloud Run and Cloud SQL
	[9.15, { x: 12.4, y: 9.2, z: 1.0, zoom: 1.56, az: A }],
	[11.3, { x: 17.6, y: 6.6, z: 0.8, zoom: 1.4, az: A + 2.5 * DEG }],        // along Pub/Sub's spine with the events
	[12.05, { x: 18.6, y: 7.2, z: 1.2, zoom: 1.45, az: A + 3 * DEG }],        // the Scheduler's tower
	[13.55, { x: 18.8, y: 7.3, z: 1.3, zoom: 1.5, az: A + 3.2 * DEG }],
	[14.55, { x: 14.0, y: 4.4, z: 1.3, zoom: 1.32, az: A + 1.5 * DEG }],      // the agents' row
	[16.2, { x: 14.3, y: 4.4, z: 1.3, zoom: 1.36, az: A + 1.2 * DEG }],
	[17.15, { x: 17.6, y: 4.9, z: 1.2, zoom: 1.12, az: A + 4 * DEG }],        // BigQuery and Cloud Storage, with the agents they feed
	[19.8, { x: 18.0, y: 5.4, z: 1.2, zoom: 1.1, az: A + 4.5 * DEG }],
	[21.4, { x: 13.2, y: 2.6, z: 1.6, zoom: 1.28, az: A + 1 * DEG }],         // Gemini, behind the agents
	[26.0, { x: 13.4, y: 2.9, z: 1.5, zoom: 1.32, az: A + 0.5 * DEG }],
	[27.4, { x: 12.3, y: 9.4, z: 1.2, zoom: 1.42, az: A - 2 * DEG }],         // the money, in the core
	[30.9, { x: 12.6, y: 9.6, z: 1.2, zoom: 1.48, az: A - 2.4 * DEG }],
	[31.7, { x: 15.0, y: 13.7, z: 1.4, zoom: 2.05, az: A - 1 * DEG }],        // a person's yes, at the desk, close
	[32.25, { x: 15.0, y: 13.7, z: 1.4, zoom: 2.12, az: A - 0.8 * DEG }],
	[33.64, { x: 13.8, y: 9.0, z: 0.4, zoom: 0.84, az: A + 1 * DEG }],        // the whole hall, lit
];
/** the camera at scene time t: eased glides between the keys, the hold's own slow drift between them */
export function camAt(t: number): Cam {
	let k = 0; while (k < KEYS.length - 2 && t > KEYS[k + 1][0]) k++;
	const [t0, a] = KEYS[k], [t1, b] = KEYS[k + 1];
	const u = clamp((t - t0) / (t1 - t0));
	const e = k === 1 ? easeOutIn(u) : EASE_IO(u);
	return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e), zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), e)), az: lerp(a.az, b.az, e) };
}
// the opening pull-back: it leaves the light gently, travels, and settles slowly on the whole hall
const easeOutIn = Easing.bezier(0.5, 0, 0.12, 1);

export const T = CUE;
