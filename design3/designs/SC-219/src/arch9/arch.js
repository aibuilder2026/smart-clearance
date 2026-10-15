// SC-219 (cut 9): under the hood, in depth. Cut 8's architecture, the same parts and the same story, built again as a lit
// 3D scene the camera flies through: the four apps' own screens on Firebase at the top; backend-api on Cloud Run, Secret
// Manager and Cloud SQL beneath them; the Pub/Sub ring with Cloud Scheduler's clock; the ten agents on Google's ADK below
// it, fed by BigQuery and Cloud Storage; Gemini on Vertex AI at the heart, Pro and Flash lighting each agent's job; then the
// guardrails: a shield the reserve never crosses, the API's own figure and checks, and a person's yes, which lights the
// whole platform. Labels are HTML set over the scene at each part's projected place, so the type stays crisp.
// Nothing runs on its own clock: renderAt(t) draws scene time t (capture-page.mjs takes it frame by frame), and
// setCues(cues) takes the narration's word times and returns the scene's sounds ({events}) for the mix.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const W = 1920, H = 1080;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const eo = (x) => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
const lerp = (a, b, k) => a + (b - a) * k;
const fade = (t, a, b, fi = 0.35, fo = 0.35) => Math.min(clamp((t - a) / fi), b == null ? 1 : clamp((b - t) / fo));
const spring = (x, zeta = 0.6, w = 14) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); };
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const IC = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[n] || ''}</svg>`;
const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };

// the design system's inks, in linear light; glows are the same inks pushed past white for the bloom
const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
const GREEN = 0x34d380, G3 = 0x73c99d, AMBER = 0xf7c04a, ORANGE = 0xff9f45, BLUE = 0x8ab4f8, VIOLET = 0xc58af9, RED = 0xe55c4a;

// ------------------------------------------------------------------ renderer, scene, camera, the light's post
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030605);
scene.fog = new THREE.FogExp2(0x030605, 0.016);
const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 600);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.7, 0.4, 1.0);
composer.addPass(bloom);
composer.addPass(new OutputPass());

scene.add(new THREE.HemisphereLight(0x2a5a44, 0x020403, 0.55));
const key = new THREE.DirectionalLight(0xdff5ea, 1.1); key.position.set(-8, 22, 14); scene.add(key);
const rim = new THREE.DirectionalLight(0x8ab4f8, 0.35); rim.position.set(12, 4, -16); scene.add(rim);

// ------------------------------------------------------------------ textures: soft glows, a four-point spark, icons, the screens
function canvasTex(size, draw) {
	const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const GLOW = canvasTex(256, (g, s) => {
	const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
	gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.45)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.08)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = gr; g.fillRect(0, 0, s, s);
});
const SPARK = canvasTex(512, (g, s) => {
	g.translate(s / 2, s / 2);
	// Gemini's own sign: a four-pointed star with curved sides
	const r = s * 0.47, k = 0.16;
	const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
	gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = gr; g.beginPath();
	for (let i = 0; i < 4; i++) {
		const a = (i * Math.PI) / 2, b = a + Math.PI / 2;
		const px = Math.cos(a) * r, py = Math.sin(a) * r, qx = Math.cos(b) * r, qy = Math.sin(b) * r;
		if (i === 0) g.moveTo(px, py);
		g.quadraticCurveTo(Math.cos(a + Math.PI / 4) * r * k, Math.sin(a + Math.PI / 4) * r * k, qx, qy);
	}
	g.closePath(); g.fill();
});
function iconTex(name, stroke = '#ffffff') {
	return new Promise((res) => {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[name] || ''}</svg>`;
		const img = new Image();
		img.onload = () => { const t = canvasTex(256, (g) => g.drawImage(img, 0, 0, 256, 256)); res(t); };
		img.onerror = () => res(canvasTex(256, () => {}));
		img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
	});
}
const loadTex = (src) => new Promise((res) => new THREE.TextureLoader().load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, () => res(null)));

// ------------------------------------------------------------------ materials
const glass = (tint = 0x0c1511, op = 0.9) => new THREE.MeshStandardMaterial({ color: tint, metalness: 0.35, roughness: 0.28, transparent: true, opacity: op, emissive: 0x020504, depthWrite: false });
const edgeMat = (c, k = 2.2) => new THREE.LineBasicMaterial({ color: col(c, k), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
const glowSprite = (c, k, size) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: col(c, k), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); s.scale.setScalar(size); return s; };
// a line that draws on along its length, a bright head at its front (uv.x runs the tube's length)
function beamMat(c, k = 2.0) {
	return new THREE.ShaderMaterial({
		transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
		uniforms: { prog: { value: 0 }, alpha: { value: 0 }, color: { value: col(c, k) }, pulse: { value: -1 } },
		vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
		fragmentShader: `float sq(float x){ return x * x; } uniform float prog; uniform float alpha; uniform vec3 color; uniform float pulse; varying vec2 vUv;
			void main(){ if (vUv.x > prog) discard; float head = smoothstep(prog - 0.12, prog, vUv.x) * step(prog, 0.999);
			float p = pulse >= 0.0 ? exp(-sq((vUv.x - pulse) * 14.0)) : 0.0;
			gl_FragColor = vec4(color * (0.55 + 1.6 * head + 2.2 * p), alpha * (0.62 + 0.38 * head + 0.6 * p)); }`,
	});
}

// ------------------------------------------------------------------ the world
const world = new THREE.Group(); scene.add(world);
const R = rng(219);

// the sky, deepening from a green-black dome to black
world.add(new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), new THREE.ShaderMaterial({
	side: THREE.BackSide, depthWrite: false, fog: false,
	uniforms: { top: { value: new THREE.Color(0x0b2419) }, mid: { value: new THREE.Color(0x050d09) }, bot: { value: new THREE.Color(0x010201) } },
	vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
	fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.8, h)) : mix(mid, bot, smoothstep(0.0, 0.5, -h)); gl_FragColor = vec4(c, 1.0); }',
})));

// the floor: a grid of light under the platform, fading out with distance, and a pool of light at its heart
const FLOOR_Y = -7.2;
const floorMat = new THREE.ShaderMaterial({
	transparent: true, depthWrite: false,
	uniforms: { glow: { value: 0.35 }, wave: { value: -100 }, color: { value: col(G3, 1) } },
	vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
	fragmentShader: `float sq(float x){ return x * x; } uniform float glow; uniform float wave; uniform vec3 color; varying vec3 vW;
		float line(float x, float w){ float f = abs(fract(x - 0.5) - 0.5) / max(fwidth(x), 1e-4); return 1.0 - min(f / w, 1.0); }
		void main(){ float r = length(vW.xz); float g = max(line(vW.x / 2.0, 1.2), line(vW.z / 2.0, 1.2));
		float fall = exp(-r * r / 380.0); float pool = exp(-r * r / 40.0);
		float w = wave > -50.0 ? exp(-sq((r - wave) * 0.9)) : 0.0;
		vec3 c = color * (g * 0.32 * fall * glow + pool * 0.10 * glow + w * g * 1.6);
		float edge = smoothstep(18.0, 31.0, r);
		gl_FragColor = vec4(c * (1.0 - edge), clamp(g * 0.45 * fall + pool * 0.12 + w * g + edge, 0.0, 1.0)); }`,
	extensions: { derivatives: true },
});
const mirror = new Reflector(new THREE.CircleGeometry(34, 96), { clipBias: 0.003, textureWidth: 1280, textureHeight: 720, color: 0x24302b });
mirror.rotation.x = -Math.PI / 2; mirror.position.y = FLOOR_Y - 0.02; world.add(mirror);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR_Y; floor.renderOrder = -10; world.add(floor);   // drawn first: its dark edge never paints over the parts
// soft shafts of light from above, slowly turning: the room's light, not the parts'
// each a soft beam that always faces the camera, brightest down its middle
const SHAFTS = [[-7.0, -3.5, 0.075, 5.5], [1.5, -5.0, 0.06, 7.0], [8.5, -3.0, 0.05, 5.0]].map(([x, z, a, w], i) => {
	const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
		uniforms: { a: { value: 0 }, color: { value: col(0xbfe9d2, 0.7) } },
		vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
		fragmentShader: 'uniform float a; uniform vec3 color; varying vec2 vUv; void main(){ float wdt = mix(0.18, 0.42, 1.0 - vUv.y); float h = exp(-((vUv.x - 0.5) * (vUv.x - 0.5)) / (2.0 * wdt * wdt * 0.25)); float v = smoothstep(0.0, 0.5, vUv.y) * (1.0 - smoothstep(0.8, 1.0, vUv.y)); gl_FragColor = vec4(color, a * v * h); }' });
	const c = new THREE.Mesh(new THREE.PlaneGeometry(w, 32), m); c.position.set(x, 8, z); c.renderOrder = -5; world.add(c); return { c, m, a, x, z };
});

// dust in the air, catching the light
const dust = (() => {
	const n = 1800, pos = new Float32Array(n * 3), seed = new Float32Array(n);
	for (let i = 0; i < n; i++) { pos[3 * i] = (R() - 0.5) * 60; pos[3 * i + 1] = -8 + R() * 26; pos[3 * i + 2] = (R() - 0.5) * 50; seed[i] = R(); }
	const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
	const m = new THREE.ShaderMaterial({
		transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
		uniforms: { t: { value: 0 }, map: { value: GLOW }, a: { value: 0.0 } },
		vertexShader: `uniform float t; attribute float seed; varying float vA; void main(){ vec3 p = position;
			p.y += mod(t * (0.12 + seed * 0.2) + seed * 26.0, 26.0) - 13.0 + 5.0; p.x += sin(t * 0.3 + seed * 30.0) * 0.4;
			vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = (2.0 + seed * 5.0) * (30.0 / -mv.z); vA = 0.35 + 0.65 * seed; gl_Position = projectionMatrix * mv; }`,
		fragmentShader: 'uniform sampler2D map; uniform float a; varying float vA; void main(){ vec4 c = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vec3(0.62, 0.95, 0.78) * c.a, c.a * a * vA); }',
	});
	const p = new THREE.Points(g, m); world.add(p); return m;
})();

// a scan of light that sweeps down through the platform as it assembles
const scanMat = new THREE.ShaderMaterial({
	transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
	uniforms: { a: { value: 0 }, color: { value: col(GREEN, 1.3) } },
	vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
	fragmentShader: 'float sq(float x){ return x * x; } uniform float a; uniform vec3 color; varying vec2 vUv; void main(){ float r = length(vUv - 0.5) * 2.0; float ring = exp(-sq((r - 0.94) * 22.0)); float fill = (1.0 - smoothstep(0.0, 1.0, r)) * 0.025; gl_FragColor = vec4(color, (ring * 0.75 + fill) * a); }',
});
const scan = new THREE.Mesh(new THREE.CircleGeometry(16, 96), scanMat); scan.rotation.x = -Math.PI / 2; world.add(scan);

// ------------------------------------------------------------------ the parts
const PARTS = {};      // name -> { group, edges:[], glows:[], t0, ... }
function slab(name, w, h, d, pos, c, opts = {}) {
	const g = new THREE.Group(); g.position.copy(pos); world.add(g);
	const geo = new RoundedBoxGeometry(w, h, d, 4, Math.min(w, h, d) * (opts.r ?? 0.18));
	const body = new THREE.Mesh(geo, glass(opts.tint, opts.op)); g.add(body);
	const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w * 1.004, h * 1.004, d * 1.004)), edgeMat(c, opts.k ?? 2.4)); g.add(e);
	const halo = glowSprite(c, 0.9, Math.min(Math.max(w, h) * 2.0, 8)); g.add(halo);
	const P = { name, g, body, edges: [e], halo, c, t0: 1e9, lit: 1e9, pulses: [] };
	PARTS[name] = P; return P;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// -- layer 1: the four apps on Firebase
const APPS_Y = 8.0, DECK_Y = 6.35;
const APPS = [
	{ id: 'landing', tex: 'app-landing.webp', x: -7.65, b: 'Landing page', s: 'smartclearance.web.app', icon: 'globe' },
	{ id: 'console', tex: 'app-console.webp', x: -2.55, b: 'Console', s: 'staff set every brand up', icon: 'layout-dashboard' },
	{ id: 'workspace', tex: 'app-workspace.webp', x: 2.55, b: 'Workspace', s: 'one per brand · installs as an app', icon: 'smartphone' },
	{ id: 'demo', tex: 'app-demo.webp', x: 7.65, b: 'Guided demo', s: 'no sign-in needed', icon: 'play' },
];
const deck = slab('deck', 21.5, 0.16, 4.4, V(0, DECK_Y, 0), ORANGE, { k: 1.15, op: 0.3, r: 0.4 }); deck.thin = true; deck.halo.visible = false;
// -- layer 2: backend-api on Cloud Run, Secret Manager, Cloud SQL
const API_Y = 3.1;
const api = slab('api', 5.4, 1.5, 2.7, V(0, API_Y, 0), GREEN, { k: 2.6 });
const apiCore = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.08, 2.0), new THREE.MeshBasicMaterial({ color: col(GREEN, 3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
apiCore.position.y = 0.05; api.g.add(apiCore);
const RACK = Array.from({ length: 5 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.07), new THREE.MeshBasicMaterial({ color: col(GREEN, 2.2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.position.set(0, -0.48 + i * 0.24, 1.36); api.g.add(m); return m; });
const LEDS = Array.from({ length: 18 }, (_, i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), new THREE.MeshBasicMaterial({ color: col(i % 4 === 0 ? BLUE : GREEN, 3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.position.set(-2.3 + (i % 9) * 0.12, -0.36 + Math.floor(i / 9) * 0.48, 1.37); api.g.add(m); return { m, ph: R() * 6.28, sp: 2 + R() * 5 }; });
const sec = slab('sec', 2.0, 1.15, 1.5, V(-7.0, API_Y - 0.05, 0.4), BLUE, { k: 2.2 });
const sql = (() => {
	const g = new THREE.Group(); g.position.set(7.0, API_Y - 0.55, 0.3); world.add(g);
	const P = { name: 'sql', g, edges: [], halo: glowSprite(GREEN, 0.9, 5), c: GREEN, t0: 1e9, lit: 1e9, pulses: [] };
	g.add(P.halo); P.halo.position.y = 0.6;
	for (let i = 0; i < 3; i++) {
		const cy = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.42, 64), glass(0x0c1511, 0.92)); cy.position.y = i * 0.55; g.add(cy);
		const ring = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(1.16, 1.16, 0.42, 64), 30), edgeMat(GREEN, 2.4)); ring.position.y = i * 0.55; g.add(ring); P.edges.push(ring);
	}
	PARTS.sql = P; return P;
})();
// -- layer 3: the Pub/Sub ring, Cloud Scheduler's clock on it
const BUS_Y = 0.55, BUS_R = 7.3;
const bus = (() => {
	const g = new THREE.Group(); g.position.y = BUS_Y; world.add(g);
	const core = new THREE.Mesh(new THREE.TorusGeometry(BUS_R, 0.055, 12, 256), new THREE.MeshBasicMaterial({ color: col(GREEN, 2.8), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
	const halo = new THREE.Mesh(new THREE.TorusGeometry(BUS_R, 0.28, 12, 256), new THREE.MeshBasicMaterial({ color: col(GREEN, 0.5), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
	core.rotation.x = halo.rotation.x = Math.PI / 2; g.add(core); g.add(halo);
	const pk = Array.from({ length: 14 }, (_, i) => { const s = glowSprite(i % 5 === 2 ? BLUE : GREEN, 3, 0.85); g.add(s); return { s, ph: i / 14 + R() * 0.03, sp: 0.045 + R() * 0.02 }; });
	return { g, core, halo, pk, t0: 1e9 };
})();
const SCHED_A = Math.PI * 1.18;
const clock = (() => {
	const g = new THREE.Group(); g.position.set(Math.cos(SCHED_A) * BUS_R, BUS_Y + 0.05, Math.sin(SCHED_A) * BUS_R); world.add(g);
	const face = new THREE.Mesh(new THREE.CircleGeometry(0.95, 64), glass(0x0a1410, 0.95)); g.add(face);
	const ring = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.05, 10, 96), new THREE.MeshBasicMaterial({ color: col(BLUE, 2.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); g.add(ring);
	const ticks = new THREE.Group(); g.add(ticks);
	for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.02), new THREE.MeshBasicMaterial({ color: col(BLUE, 2), transparent: true, opacity: 0, toneMapped: false })); const a = i / 12 * Math.PI * 2; m.position.set(Math.sin(a) * 0.78, Math.cos(a) * 0.78, 0.02); m.rotation.z = -a; ticks.add(m); }
	const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.03), new THREE.MeshBasicMaterial({ color: col(0xffffff, 2.2), transparent: true, opacity: 0, toneMapped: false })); hand.geometry.translate(0, 0.32, 0.03); g.add(hand);
	const halo = glowSprite(BLUE, 0.9, 3.4); g.add(halo);
	return { g, face, ring, ticks, hand, halo, t0: 1e9 };
})();
// -- layer 4: the ten agents, on an arc behind the heart
const AG_Y = -2.5, AG_R = 8.2;
const AGENTS = [
	{ id: 'data', name: 'Data', icon: 'database', tier: 'flash' }, { id: 'watcher', name: 'Watcher', icon: 'eye', tier: 'rules' },
	{ id: 'vision', name: 'Vision', icon: 'scan-line', tier: 'flash' }, { id: 'valuer', name: 'Valuer', icon: 'scale', tier: 'pro' },
	{ id: 'router', name: 'Router', icon: 'route', tier: 'pro' }, { id: 'outreach', name: 'Outreach', icon: 'send', tier: 'flash' },
	{ id: 'lister', name: 'Lister', icon: 'store', tier: 'flash' }, { id: 'negotiator', name: 'Negotiator', icon: 'gavel', tier: 'pro' },
	{ id: 'paperwork', name: 'Paperwork', icon: 'file-text', tier: 'flash' }, { id: 'impact', name: 'Impact', icon: 'leaf', tier: 'flash' },
];
const TIER_C = { pro: VIOLET, flash: BLUE, rules: GREEN };
AGENTS.forEach((a, i) => {
	const ang = Math.PI * (1.12 + 0.76 * (i / 9));       // from left-back round to right-back
	a.pos = V(Math.cos(ang) * AG_R, AG_Y, Math.sin(ang) * AG_R * 0.62 - 1.2);
	const P = slab('ag-' + a.id, 1.45, 1.0, 0.6, a.pos, GREEN, { k: 2.4, r: 0.22 });
	P.g.lookAt(V(0, AG_Y, 14));
	a.P = P; a.t0 = 1e9; a.tierT = 1e9;
});
// -- layer 5: BigQuery and Cloud Storage, in front, low
const DATA_Y = -4.9;
const bq = (() => {
	const g = new THREE.Group(); g.position.set(-5.6, DATA_Y, 4.2); world.add(g);
	const P = { name: 'bq', g, edges: [], halo: glowSprite(BLUE, 0.9, 5.5), c: BLUE, t0: 1e9, lit: 1e9, pulses: [], rows: [] };
	g.add(P.halo); P.halo.position.y = 0.6;
	for (let i = 0; i < 4; i++) {
		const geo = new RoundedBoxGeometry(2.6, 0.22, 1.8, 3, 0.08);
		const m = new THREE.Mesh(geo, glass(0x0b1420, 0.9)); m.position.y = i * 0.34; g.add(m);
		const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.61, 0.22, 1.81)), edgeMat(BLUE, 2.4)); e.position.y = i * 0.34; g.add(e); P.edges.push(e);
	}
	PARTS.bq = P; return P;
})();
const gcs = (() => {
	const g = new THREE.Group(); g.position.set(5.6, DATA_Y, 4.2); world.add(g);
	const P = { name: 'gcs', g, edges: [], halo: glowSprite(BLUE, 0.9, 5.5), c: BLUE, t0: 1e9, lit: 1e9, pulses: [] };
	g.add(P.halo); P.halo.position.y = 0.6;
	const geo = new THREE.CylinderGeometry(1.25, 0.95, 1.3, 64, 1, true);
	const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x0b1420, metalness: 0.4, roughness: 0.3, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })); m.position.y = 0.65; g.add(m);
	const lip = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(1.26, 0.96, 1.3, 64, 1, true), 30), edgeMat(BLUE, 2.4)); lip.position.y = 0.65; g.add(lip); P.edges.push(lip);
	PARTS.gcs = P; return P;
})();
// -- the heart: Gemini on Vertex AI
const GEM = V(0, -1.35, 1.4);
const gem = (() => {
	const g = new THREE.Group(); g.position.copy(GEM); world.add(g);
	const coreMat = new THREE.ShaderMaterial({
		transparent: true, toneMapped: false,
		uniforms: { a: { value: 0 }, t: { value: 0 }, c1: { value: col(BLUE, 1) }, c2: { value: col(VIOLET, 1) } },
		vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
		fragmentShader: `uniform float a; uniform float t; uniform vec3 c1; uniform vec3 c2; varying vec3 vN; varying vec3 vV;
			void main(){ float d = clamp(dot(vN, vV), 0.0, 1.0); float f = pow(1.0 - d, 2.2); float sweep = 0.5 + 0.5 * sin(t * 1.4 + vN.y * 3.0);
			vec3 c = mix(c1, c2, sweep) * (0.6 + 2.6 * f) + vec3(1.0) * pow(d, 6.0) * 1.4; gl_FragColor = vec4(c * a * 1.4, a); }`,
	});
	const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 6), coreMat); g.add(core);
	const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: SPARK, color: col(0xd9e4ff, 2.2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); spark.scale.setScalar(3.2); g.add(spark);
	const halo = glowSprite(VIOLET, 1.1, 7.5); g.add(halo);
	const halo2 = glowSprite(BLUE, 0.9, 11); g.add(halo2);
	const motes = Array.from({ length: 26 }, (_, i) => { const s = glowSprite(i % 2 ? BLUE : VIOLET, 2.4, 0.32); g.add(s); return { s, r: 1.1 + R() * 1.4, ph: R() * 6.28, sp: 0.4 + R() * 0.7, tilt: (R() - 0.5) * 1.6 }; });
	const light = new THREE.PointLight(0xa58cff, 0, 22, 1.6); g.add(light);
	return { g, core, coreMat, spark, halo, halo2, motes, light, t0: 1e9 };
})();
// -- the shield the reserve never crosses
const SHIELD_Y = 1.75;
const shieldMat = new THREE.ShaderMaterial({
	transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
	uniforms: { a: { value: 0 }, t: { value: 0 }, color: { value: col(AMBER, 1.6) } },
	vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
	fragmentShader: `float sq(float x){ return x * x; } uniform float a; uniform float t; uniform vec3 color; varying vec2 vP;
		float hex(vec2 p){ p = abs(p); return max(dot(p, normalize(vec2(1.0, 1.732))), p.x); }
		void main(){ vec2 p = vP * 1.6; vec2 r = vec2(1.0, 1.732); vec2 h = r * 0.5;
		vec2 a1 = mod(p, r) - h; vec2 b1 = mod(p - h, r) - h; vec2 g = dot(a1, a1) < dot(b1, b1) ? a1 : b1;
		float e = smoothstep(0.42, 0.48, hex(g)); float rr = length(vP) / 6.2; float edge = smoothstep(1.0, 0.86, rr) * smoothstep(0.0, 0.3, rr);
		float rim = exp(-sq((rr - 0.97) * 26.0)); float wave = exp(-sq((rr - fract(t * 0.45)) * 8.0));
		gl_FragColor = vec4(color, a * (e * 0.38 * edge + rim * 0.9 + wave * e * 0.5 * edge)); }`,
});
const shield = new THREE.Mesh(new THREE.CircleGeometry(6.2, 96), shieldMat); shield.rotation.x = -Math.PI / 2; shield.position.y = SHIELD_Y; world.add(shield);

// the platform's own build and watch, round the foot
const BASE = [
	{ id: 'build', b: 'Cloud Build', s: 'every merge, deployed keyless', icon: 'git-branch', a: 0.62 },
	{ id: 'reg', b: 'Artifact Registry', s: 'the API and agent images', icon: 'box', a: 0.86 },
	{ id: 'mon', b: 'Cloud Monitoring', s: 'uptime, alerts, the budget', icon: 'bell', a: 0.14 },
	{ id: 'obs', b: 'Cloud Trace · Logging', s: 'every request, end to end', icon: 'activity', a: 0.38 },
];
BASE.forEach((b) => { const ang = Math.PI * b.a; b.pos = V(Math.cos(ang) * 12.5, FLOOR_Y + 0.35, Math.sin(ang) * 9 + 1.5); b.halo = glowSprite(BLUE, 1.2, 2.2); b.halo.position.copy(b.pos); world.add(b.halo); });

// ------------------------------------------------------------------ the lines between them
const BEAMS = {};
function beam(id, pts, c, r = 0.035, k = 2.6) {
	const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
	const m = beamMat(c, k);
	const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, r * 0.62, 8, false), m); world.add(mesh);
	BEAMS[id] = { id, curve, m, mesh, t0: 1e9, dur: 0.7, t1: 1e9, pk: [] };
	return BEAMS[id];
}
APPS.forEach((a) => beam('req-' + a.id, [V(a.x, DECK_Y - 0.15, 0.6), V(a.x * 0.6, (DECK_Y + API_Y) / 2 + 0.5, 1.0), V(a.x * 0.16, API_Y + 0.8, 0.6)], GREEN, 0.035));
beam('sql', [V(2.75, API_Y - 0.1, 0.4), V(4.6, API_Y + 0.25, 0.7), V(5.85, API_Y - 0.05, 0.5)], GREEN, 0.045);
beam('sec', [V(-5.95, API_Y, 0.5), V(-4.4, API_Y + 0.25, 0.7), V(-2.75, API_Y, 0.5)], BLUE, 0.035);
beam('auth', [V(-9.6, DECK_Y - 0.15, 0.8), V(-8.6, (DECK_Y + API_Y) / 2 + 0.3, 1.2), V(-7.4, API_Y + 0.65, 0.7)], AMBER, 0.03);
beam('pub', [V(0, API_Y - 0.8, 0.6), V(0.4, (API_Y + BUS_Y) / 2, 2.5), V(0, BUS_Y + 0.05, BUS_R)], GREEN, 0.045);
beam('tick', [V(clock.g.position.x + 0.6, BUS_Y + 0.9, clock.g.position.z), V(-3.5, API_Y - 0.6, -0.6), V(-2.6, API_Y - 0.4, 0)], BLUE, 0.03);
AGENTS.forEach((a) => {
	const top = a.pos.clone().add(V(0, 0.55, 0));
	const ang = Math.atan2(a.pos.z, a.pos.x);
	const onBus = V(Math.cos(ang) * BUS_R, BUS_Y, Math.sin(ang) * BUS_R);
	beam('drop-' + a.id, [onBus, onBus.clone().lerp(top, 0.5).add(V(0, 0.3, 0)), top], GREEN, 0.03);
	const front = a.pos.clone().add(V(0, -0.1, 0.35));
	const mid = GEM.clone().lerp(front, 0.5).add(V(0, 1.1, 0));
	beam('gem-' + a.id, [GEM.clone().add(V(0, 0.1, 0)), mid, front], TIER_C[a.tier], 0.04, 3.0);
});
const AG = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
const bqTop = bq.g.position.clone().add(V(0, 1.35, 0)), gcsTop = gcs.g.position.clone().add(V(0, 1.45, 0));
beam('bq-watcher', [bqTop, bqTop.clone().lerp(AG.watcher.pos, 0.5).add(V(0, 1.6, 0)), AG.watcher.pos.clone().add(V(0, -0.6, 0.3))], BLUE, 0.04);
beam('bq-valuer', [bqTop.clone().add(V(0.4, 0, 0)), bqTop.clone().lerp(AG.valuer.pos, 0.5).add(V(0, 1.8, 0)), AG.valuer.pos.clone().add(V(0, -0.6, 0.3))], BLUE, 0.04);
beam('gcs-vision', [gcsTop, gcsTop.clone().lerp(AG.vision.pos, 0.5).add(V(0, 2.6, 0)), AG.vision.pos.clone().add(V(0, -0.6, 0.3))], BLUE, 0.04);
beam('report', [AG.router.pos.clone().add(V(0, 0.6, 0)), V(-1.2, BUS_Y + 1.2, -1.8), V(-0.8, API_Y - 0.75, -0.4)], BLUE, 0.03);

// the label photo Vision reads, flying from the bucket
const photo = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.94), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
world.add(photo);

// the four apps' own screens, on the deck
const panels = [];
// a person's yes: the workspace screen turns to the plan's Approve sheet
let approveTex = null;

// ------------------------------------------------------------------ the labels over the scene
const labelsEl = document.getElementById('labels'), ui = document.getElementById('ui');
const LABELS = [];
function label(html, anchor, opts = {}) {
	const el = $(html); labelsEl.appendChild(el);
	const L = { el, anchor, dx: opts.dx || 0, dy: opts.dy || 0, align: opts.align || 'c', t0: 1e9, t1: 1e9, k: opts.k ?? 1, min: opts.min ?? 0.62, max: opts.max ?? 1.08, ref: opts.ref ?? 22 };
	LABELS.push(L); return L;
}
const node = (icon, b, s, cls = '') => `<div class="node ${cls}"><div class="tile">${IC(icon)}</div><div><b>${b}</b>${s ? `<span>${s}</span>` : ''}</div></div>`;
const pill = (icon, text, cls = '') => `<div class="pill ${cls}">${IC(icon)}${text}</div>`;
const LB = {
	gcloud: label(`<div class="pill big blue">${IC('cloud')}Google Cloud · asia-south1</div>`, V(-11.6, FLOOR_Y + 0.6, -5.5), { align: 'l', ref: 30 }),
	fire: label(node('flame', 'Firebase', 'Hosting · Authentication', 'fire'), V(-10.6, DECK_Y - 0.1, 2.2), { align: 'l', dy: 16 }),
	api: label(node('server', 'backend-api', 'FastAPI on Cloud Run · every figure', 'gcp big'), V(0, API_Y + 0.75, 1.35), { dy: -54 }),
	otel: label(pill('activity', 'OpenTelemetry, into Cloud Trace'), V(0, API_Y - 0.85, 1.35), { dy: 34 }),
	sec: label(node('key', 'Secret Manager', 'every secret, only there', 'gcp small'), V(-7.0, API_Y + 0.6, 0.4), { dy: -40 }),
	auth: label(pill('lock', 'ID tokens, every request', 'amber'), V(-8.6, (DECK_Y + API_Y) / 2 + 0.3, 1.2), { align: 'r', dx: -22 }),
	sql: label(node('database', 'Cloud SQL', 'PostgreSQL 18 · the system of record', 'gcp'), V(7.0, API_Y + 1.25, 0.3), { dy: -48 }),
	sqlspec: label(pill('lock', 'IAM sign-in only · backups, point-in-time'), V(7.0, API_Y - 0.75, 1.4), { dy: 34 }),
	pub: label(node('radio', 'Pub/Sub', 'every step, an event', 'gcp'), V(0, BUS_Y, BUS_R), { dy: 52 }),
	pubspec: label(pill('rotate-cw', 'ordered · retried, then a dead letter'), V(0, BUS_Y, BUS_R), { dy: 116 }),
	sched: label(node('clock', 'Cloud Scheduler', 'a tick every minute', 'gcp'), clock.g.position.clone().add(V(0, 1.1, 0)), { dy: -44 }),
	schedspec: label(pill('calendar', 'timers: offers close, reports fall due', 'blue'), clock.g.position.clone().add(V(0, -1.1, 0)), { dy: 30 }),
	agents: label(node('bot', 'Ten agents', "Google's ADK on Cloud Run · one run per event", 'gcp'), V(-9.8, AG_Y - 1.4, -2.4), { align: 'r', dx: -16 }),
	bq: label(node('chart-column', 'BigQuery', 'sell-through · the impact ledger', 'gcp'), bq.g.position.clone().add(V(0, -0.5, 1.0)), { dy: 52 }),
	gcs: label(node('hard-drive', 'Cloud Storage', 'photos · signed PDFs', 'gcp'), gcs.g.position.clone().add(V(0, -0.5, 1.0)), { dy: 52 }),
	gem: label(node('sparkles', 'Gemini on Vertex AI', 'the global endpoint', 'gem big'), GEM.clone().add(V(0, -1.2, 0)), { dy: 64 }),
	pro: label(`<div class="pill big" style="border-color:rgba(197,138,249,0.8);color:#ead9ff">${IC('sparkles')}Gemini 3.1 Pro · prices, negotiates</div>`, GEM.clone().add(V(-3.2, 1.45, 0)), { align: 'r' }),
	flash: label(`<div class="pill big blue">${IC('zap')}Gemini 3.8 Flash · reads, writes</div>`, GEM.clone().add(V(3.2, 1.45, 0)), { align: 'l' }),
	lock: label(`<div class="lockchip"><div class="bi">${IC('lock')}</div>The reserve price never reaches a model</div>`, V(-1.6, SHIELD_Y + 0.1, 6.2), { align: 'r', dx: -14 }),
	struct: label(pill('braces', 'Structured output · 3 tries, then a safe fallback', 'blue big'), GEM.clone().add(V(0, 1.6, 0)), { dy: -10 }),
};
LB.gcloud.min = 0.9;
APPS.forEach((a) => { a.label = label(node(a.icon, a.b, a.s, 'small'), V(a.x, APPS_Y + 1.85, 0), { dy: -28 }); });
AGENTS.forEach((a) => {
	const tierHtml = a.tier === 'pro' ? `${IC('sparkles')}3.1 Pro` : a.tier === 'flash' ? `${IC('zap')}3.8 Flash` : `${IC('list-checks')}rules, no model`;
	a.label = label(`<div class="agent"><b>${a.name}</b><div class="tier ${a.tier}">${tierHtml}</div></div>`, a.pos.clone().add(V(0, -0.62, 0.3)), { dy: 8 });
	a.tierEl = a.label.el.querySelector('.tier');
});
BASE.forEach((b) => { b.label = label(node(b.icon, b.b, b.s, 'gcp small'), b.pos, { dy: -6 }); });
const TOPICS = ['batch.at_risk', 'journey.step', 'offer.received', 'deal.closed', 'notify'].map((name, i) => {
	const L = label(`<div class="topic">${name}</div>`, V(0, 0, 0)); L.ang = Math.PI * (0.18 + i * 0.16); return L;
});

// the act's header, top left: a kicker, the line, the words under it
const HDR = [
	{ k: 'Under the hood', h: 'All on Google Cloud.', p: 'Four apps, one API, one record. Every step, an event.' },
	{ k: 'The agents', h: 'Ten agents. Two Gemini models.', p: "Built with Google's ADK, each with one job." },
	{ k: 'Guardrails', h: 'The models never touch the money.', p: "Figures from the API, words from Gemini, and a person's yes." },
].map((o) => {
	const words = o.h.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
	const el = $(`<div class="hdr"><div class="k"><i></i>${o.k}</div><h1>${words}</h1><p>${o.p}</p></div>`); ui.appendChild(el);
	return { ...o, el, ws: [...el.querySelectorAll('.w')], k_: el.querySelector('.k'), p_: el.querySelector('p'), t0: 1e9, t1: 1e9 };
});
// guardrails' figure and checks, beside the API; the person's yes
const money = $(`<div class="money"><div class="k">Worked out by the API</div><div class="f">₹16,917</div><div class="s">net for the Mango Drink · the model never sees it</div></div>`); ui.appendChild(money);
const checks = $(`<div class="checks"></div>`); ui.appendChild(checks);
const CHECKS = ['Every figure, from the API', "Every word, checked against the brand's rules", "The brand's dates, floor price and caps"].map((s) => { const c = $(`<div class="chk"><div class="ic">${IC('check')}</div>${s}</div>`); checks.appendChild(c); return c; });
const yes = $(`<div class="yes"><div class="bi">${IC('hand')}</div>Nothing moves without a person's yes</div>`); ui.appendChild(yes);
const evals = $(`<div class="evals"><span class="lead">Evals on live Gemini</span><span class="e">Vision · <b>72 of 73</b> labels</span><span class="e">Router · <b>20 of 20</b></span><span class="e">Negotiator · the reserve <b>never leaked</b></span></div>`); ui.appendChild(evals);
const ripples = [0, 1].map((i) => { const r = $(`<div class="ripple${i ? ' r2' : ''}"></div>`); ui.appendChild(r); return r; });

// ------------------------------------------------------------------ the camera: keys through the parts, on the narration
let KEYS = [];
const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
function hermite(t, get) {
	let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1].t <= t) i++;
	const k0 = KEYS[Math.max(0, i - 1)], k1 = KEYS[i], k2 = KEYS[i + 1], k3 = KEYS[Math.min(KEYS.length - 1, i + 2)];
	if (t <= KEYS[0].t) return get(KEYS[0]).clone();
	if (t >= KEYS[KEYS.length - 1].t) return get(KEYS[KEYS.length - 1]).clone();
	const dt = Math.max(1e-3, k2.t - k1.t), s = clamp((t - k1.t) / dt);
	const p1 = get(k1), p2 = get(k2);
	// tangents from the neighbours, scaled to this span; zero at the ends, so the camera eases in and out of the scene
	const m1 = i === 0 ? new THREE.Vector3() : get(k2).clone().sub(get(k0)).multiplyScalar(dt / Math.max(1e-3, k2.t - k0.t) * (k1.hold ? 0 : 1));
	const m2 = i + 2 >= KEYS.length ? new THREE.Vector3() : get(k3).clone().sub(get(k1)).multiplyScalar(dt / Math.max(1e-3, k3.t - k1.t) * (k2.hold ? 0 : 1));
	const s2 = s * s, s3 = s2 * s;
	return p1.clone().multiplyScalar(2 * s3 - 3 * s2 + 1).add(m1.multiplyScalar(s3 - 2 * s2 + s)).add(p2.clone().multiplyScalar(-2 * s3 + 3 * s2)).add(m2.multiplyScalar(s3 - s2));
}
function camAt(t) {
	camPos.copy(hermite(t, (k) => k.p)); camTgt.copy(hermite(t, (k) => k.q));
	// a slow drift, never a shake
	camPos.x += Math.sin(t * 0.21) * 0.18; camPos.y += Math.cos(t * 0.17) * 0.12;
	camera.position.copy(camPos); camera.lookAt(camTgt);
	let fov = 36; for (const k of KEYS) if (k.fov && t >= k.t - 1.2) fov = lerp(fov, k.fov, sm((t - (k.t - 1.2)) / 1.2));
	camera.fov = fov; camera.updateProjectionMatrix();
}

// ------------------------------------------------------------------ the timeline, from the narration's cues
let C = null, EV = [];
const ev = (t, kind, pan = 0.5) => EV.push({ t: +t.toFixed(3), kind, pan });
const show = (o, t, sound = null, pan = 0.5) => { o.t0 = t; if (sound) ev(t, sound, pan); };
const draw = (id, t0, dur = 0.7, sound = null) => { const b = BEAMS[id]; b.t0 = t0; b.dur = dur; if (sound) ev(t0, sound); return b; };
const run = (id, t0, dur = 0.8, ping = true, pan = 0.5) => { BEAMS[id].pk.push({ t0, dur }); if (ping) ev(t0 + dur, 'ping', pan); };
const DEFAULTS = {
	t01: 0.9, hood: 1.3, google: 2.3,
	u02: 3.6, apps: 4.0, firebase: 4.6, api: 5.6, run: 6.4, sql: 7.4, record: 8.6,
	u03: 9.9, pubsub: 9.9, step: 10.9, scheduler: 12.0, clock: 13.4,
	u04: 14.4, ten: 14.4, adk: 15.6, sales: 16.6, bigquery: 17.2, photos: 18.6, storage: 19.4,
	u05: 21.0, gemini: 21.0, vertex: 21.8, thinks: 22.7, pro: 23.6, prices: 24.0, negotiates: 24.9, flash: 25.8, reads: 26.3, writes: 26.9,
	u06: 28.3, models: 28.6, money: 29.6, api2: 30.6, figure: 31.8, person: 33.3, yes: 34.2, end: 36.0,
};
window.setCues = (cues) => {
	const c = Object.assign({}, DEFAULTS, cues); C = c; EV = [];
	for (const P of Object.values(PARTS)) { P.t0 = 1e9; P.lit = 1e9; P.pulses = []; }
	for (const b of Object.values(BEAMS)) { b.t0 = 1e9; b.pk = []; }
	LABELS.forEach((L) => { L.t0 = 1e9; L.t1 = 1e9; });
	AGENTS.forEach((a) => { a.t0 = 1e9; a.tierT = 1e9; });
	HDR.forEach((h) => { h.t0 = 1e9; h.t1 = 1e9; });
	const end = c.end;

	// act 1: the platform assembles under a scan of light; the apps; the API; the record; the bus and the clock
	ev(0.02, 'whoosh_in'); ev(0.3, 'sweep');
	HDR[0].t0 = Math.max(0.35, c.t01 - 0.2); HDR[0].t1 = c.u04 - 0.15; ev(HDR[0].t0, 'title');
	show(LB.gcloud, c.google - 0.1, 'glint'); LB.gcloud.t1 = c.u03 + 0.6;
	APPS.forEach((a, i) => { a.t0 = 0.25 + 0.12 * i; });
	show(deck, c.firebase - 0.15, 'thump', 0.3); show(LB.fire, c.firebase - 0.05); LB.fire.t1 = c.u03 + 0.5;
	APPS.forEach((a, i) => { a.label.t0 = c.apps + 0.1 + 0.14 * i; a.label.t1 = c.api + 0.4; ev(a.label.t0, 'pop', 0.25 + 0.17 * i); });
	show(api, c.api - 0.2, 'thump'); show(LB.api, c.api - 0.05); LB.api.t1 = c.u04 + 0.2;
	APPS.forEach((a, i) => { draw('req-' + a.id, c.api - 0.2 + 0.08 * i, 0.55); run('req-' + a.id, c.run - 0.2 + 0.11 * i, 0.6, i === 1); });
	show(LB.otel, c.run + 0.2); LB.otel.t1 = c.u03 + 0.4;
	show(sec, c.run, 'drop', 0.25); show(LB.sec, c.run + 0.1); LB.sec.t1 = c.u03 + 0.4;
	draw('sec', c.run + 0.1, 0.5); draw('auth', c.run + 0.25, 0.6); show(LB.auth, c.run + 0.6); LB.auth.t1 = c.u03 + 0.2;
	show(sql, c.sql - 0.2, 'thump', 0.72); show(LB.sql, c.sql - 0.05); LB.sql.t1 = c.u04 + 0.1;
	draw('sql', c.sql - 0.1, 0.5); run('sql', c.record - 0.35, 0.6, true, 0.72); run('sql', c.record + 0.35, 0.6, false);
	show(LB.sqlspec, c.record); LB.sqlspec.t1 = c.u04;
	bus.t0 = c.pubsub - 0.25; ev(bus.t0, 'whoosh'); ev(c.pubsub + 0.1, 'ignite');
	draw('pub', c.pubsub - 0.35, 0.5); run('pub', c.step - 0.3, 0.7);
	show(LB.pub, c.pubsub + 0.05); LB.pub.t1 = c.u04 + 0.4; show(LB.pubspec, c.step + 0.2); LB.pubspec.t1 = c.u04 + 0.3;
	TOPICS.forEach((L, i) => { L.t0 = c.step - 0.2 + 0.22 * i; L.t1 = c.u04 + 0.4 + 0.08 * i; ev(L.t0, 'topic', 0.3 + 0.1 * i); });
	clock.t0 = c.scheduler - 0.25; ev(clock.t0, 'drop', 0.2); show(LB.sched, c.scheduler); LB.sched.t1 = c.u04 + 0.2;
	show(LB.schedspec, c.clock); LB.schedspec.t1 = c.u04 + 0.2;
	clock.ticks0 = c.clock - 0.1; for (let k = 0; k < 4; k++) ev(clock.ticks0 + k * 0.62, 'clock', 0.2);
	draw('tick', c.clock, 0.6); run('tick', c.clock + 0.65, 0.6, false);

	// act 2: the agents rise; BigQuery and Cloud Storage feed them; Gemini lights each one's job
	HDR[1].t0 = c.u04 + 0.05; HDR[1].t1 = c.u06 - 0.15; ev(HDR[1].t0, 'title');
	AGENTS.forEach((a, i) => { a.t0 = c.ten - 0.15 + 0.11 * i; a.P.t0 = a.t0; a.label.t0 = a.t0 + 0.25; a.label.t1 = c.u06 + 0.35; ev(a.t0 + 0.1, 'drop', 0.15 + 0.07 * i); draw('drop-' + a.id, a.t0 - 0.1, 0.45); });
	show(LB.agents, c.adk - 0.1); LB.agents.t1 = c.u05 + 0.4;
	show(bq, c.bigquery - 0.25, 'thump', 0.3); show(LB.bq, c.bigquery - 0.1); LB.bq.t1 = c.u05 + 0.6;
	draw('bq-watcher', c.bigquery, 0.6); draw('bq-valuer', c.bigquery + 0.1, 0.6);
	for (let k = 0; k < 3; k++) { run('bq-watcher', c.bigquery + 0.5 + 0.3 * k, 0.7, k === 0, 0.3); run('bq-valuer', c.bigquery + 0.65 + 0.3 * k, 0.7, false); }
	show(gcs, c.storage - 0.35, 'thump', 0.7); show(LB.gcs, c.storage - 0.2); LB.gcs.t1 = c.u05 + 0.6;
	draw('gcs-vision', c.storage - 0.1, 0.6); photo.t0 = c.storage + 0.05; ev(photo.t0, 'whoosh', 0.7); ev(photo.t0 + 1.0, 'ping', 0.45);
	gem.t0 = c.gemini - 0.3; ev(gem.t0, 'boom'); ev(gem.t0 + 0.05, 'ignite');
	show(LB.gem, c.gemini + 0.1); LB.gem.t1 = c.u06 + 0.6;
	const pros = AGENTS.filter((a) => a.tier === 'pro'), flashes = AGENTS.filter((a) => a.tier === 'flash');
	pros.forEach((a, i) => { const t_ = c.prices - 0.2 + 0.3 * i; draw('gem-' + a.id, t_, 0.5); a.tierT = t_ + 0.4; a.P.lit = t_ + 0.45; });
	ev(c.prices - 0.1, 'chime_pro', 0.4); show(LB.pro, c.prices); LB.pro.t1 = c.u06 + 0.2;
	flashes.forEach((a, i) => { const t_ = c.reads - 0.25 + 0.16 * i; draw('gem-' + a.id, t_, 0.5); a.tierT = t_ + 0.4; a.P.lit = t_ + 0.45; });
	ev(c.reads - 0.15, 'chime_flash', 0.6); show(LB.flash, c.reads - 0.05); LB.flash.t1 = c.u06 + 0.2;
	AG.watcher.tierT = c.writes + 0.3;
	[...pros, ...flashes].forEach((a, i) => run('gem-' + a.id, c.writes + 0.4 + 0.05 * i, 0.6, false));

	// act 3: the shield; the API's own figure and its checks; a person's yes lights the whole platform
	HDR[2].t0 = c.u06 + 0.05; HDR[2].t1 = end + 1; ev(HDR[2].t0, 'title');
	shield.t0 = c.money - 0.35; ev(shield.t0, 'whoosh'); ev(c.money, 'lock');
	show(LB.lock, c.money + 0.05); LB.lock.t1 = c.figure + 0.2;
	show(LB.struct, c.models); LB.struct.t1 = c.money + 0.3;
	money.t0 = c.api2 - 0.1; ev(money.t0, 'card');
	CHECKS.forEach((el, i) => { el.t0 = c.figure - 0.1 + 0.32 * i; ev(el.t0, 'badge', 0.62); });
	money.t1 = CHECKS.t1 = c.person - 0.35;
	approve.t0 = c.person - 0.55; ev(approve.t0, 'whoosh');
	approve.click = c.yes - 0.15; ev(approve.click, 'click', 0.62); ev(approve.click + 0.08, 'gate', 0.62);
	yes.t0 = c.yes + 0.05;
	wave.t0 = c.yes + 0.15; ev(wave.t0, 'sparkle'); ev(wave.t0 + 0.3, 'boom');
	evals.t0 = c.yes + 0.75; BASE.forEach((b, i) => { b.label.t0 = c.yes + 0.45 + 0.12 * i; b.label.t1 = end + 1; });

	// the camera: an establishing shot, then down through the platform part by part, and back out on the yes
	const K = [];
	const k = (t, p, q, o = {}) => K.push({ t, p, q, ...o });
	k(0, V(-7.5, 15.5, 37), V(0, 0.8, 0), { fov: 38 });
	k(c.google + 0.7, V(-4.2, 12.5, 30), V(0, 1.4, 0));
	k(c.apps + 0.3, V(-1.2, 11.2, 14.5), V(0, 7.6, 0));
	k(c.api + 0.2, V(1.8, 5.9, 11.6), V(0, 3.2, 0));
	k(c.sql + 0.2, V(7.6, 5.0, 10.2), V(5.4, 3.0, 0));
	k(c.u03 + 0.1, V(3.0, 7.6, 19.0), V(0, 1.0, 0));
	k(c.scheduler + 0.4, V(-5.6, 3.6, 13.2), V(-4.6, 0.8, -1.2));
	k(c.u04 + 0.35, V(0.6, 2.4, 19.5), V(0, -2.3, -1.5));
	k(c.bigquery + 0.3, V(-5.6, -0.6, 14.6), V(-4.6, -3.7, 1.2));
	k(c.storage + 0.3, V(5.2, -0.6, 14.6), V(4.2, -3.3, 0.6));
	k(c.gemini + 0.4, V(0, -0.7, 12.2), V(0, -1.4, 0.8), { fov: 33 });
	k(c.reads + 0.2, V(0, 2.6, 21.0), V(0, -1.8, -0.8), { fov: 36 });
	k(c.money + 0.2, V(-3.0, 6.0, 17.0), V(0, 1.7, 0.3));
	k(c.figure + 0.2, V(1.4, 5.0, 11.5), V(0.6, 3.3, 0.6));
	k(c.person + 0.15, V(3.2, 9.0, 8.4), V(2.55, 8.0, 0), { hold: true });
	k(c.yes + 0.35, V(3.2, 9.0, 8.4), V(2.55, 8.0, 0));
	k(end, V(-3.0, 11.0, 30.0), V(0, 1.0, 0), { fov: 38 });
	KEYS = K;
	window.renderAt(0);
	return { events: EV, cues: c };
};
const approve = { t0: 1e9, click: 1e9 }, wave = { t0: 1e9 };
money.t0 = 1e9; money.t1 = 1e9; yes.t0 = 1e9; evals.t0 = 1e9; photo.t0 = 1e9;

// ------------------------------------------------------------------ one frame
const proj = new THREE.Vector3();
function place(L, t) {
	const a = fade(t, L.t0, L.t1, 0.3, 0.3);
	if (a <= 0.001) { L.el.style.opacity = 0; return; }
	proj.copy(L.anchor).project(camera);
	if (proj.z > 1) { L.el.style.opacity = 0; return; }
	const x = (proj.x * 0.5 + 0.5) * W + L.dx, y = (-proj.y * 0.5 + 0.5) * H + L.dy;
	const d = camera.position.distanceTo(L.anchor);
	const s = clamp(L.ref / d, L.min, L.max) * L.k;
	const r = L.el.getBoundingClientRect();
	const w = r.width / (L.s || 1), h = r.height / (L.s || 1);
	const ox = L.align === 'l' ? 0 : L.align === 'r' ? -w * s : -w * s / 2;
	const e = spring(t - L.t0, 0.7, 13);
	L.el.style.transform = `translate(${(x + ox).toFixed(1)}px, ${(y - h * s / 2 + 10 * (1 - e)).toFixed(1)}px) scale(${s.toFixed(3)})`;
	L.el.style.transformOrigin = '0 0';
	L.el.style.opacity = a.toFixed(3);
	L.s = s;
}
const shot = (v) => { proj.copy(v).project(camera); return { x: (proj.x * 0.5 + 0.5) * W, y: (-proj.y * 0.5 + 0.5) * H }; };

window.renderAt = (t) => {
	const c = C;
	camAt(t);
	// the scan of light, the floor, the dust
	const sp = clamp((t - 0.1) / 1.8);
	scan.position.y = lerp(APPS_Y + 1.5, FLOOR_Y + 0.05, sm(sp));
	scanMat.uniforms.a.value = Math.sin(Math.PI * sp) * 0.6; scan.visible = scanMat.uniforms.a.value > 0.003;
	const scanY = lerp(APPS_Y + 1.5, FLOOR_Y, sm(sp));
	const rev = (y) => (t > 2.0 ? 1 : clamp((y + 0.8 - scanY) / 1.4));      // 1 once the scan has passed a part's height
	SHAFTS.forEach((sh, i) => { sh.m.uniforms.a.value = sh.a * clamp((t - 0.4 - 0.3 * i) / 1.5) * (1 + 0.08 * Math.sin(t * 0.7 + i)); sh.c.rotation.y = Math.atan2(camera.position.x - sh.x, camera.position.z - sh.z); });
	const wv = wave.t0 < 1e8 ? t - wave.t0 : -1;
	floorMat.uniforms.glow.value = 0.25 + 0.75 * clamp(t / 2.5) + (wv > 0 ? 0.5 * Math.exp(-wv / 1.5) : 0);
	floorMat.uniforms.wave.value = wv > 0 ? wv * 9 : -100;
	dust.uniforms.t.value = t; dust.uniforms.a.value = 0.55 * clamp(t / 1.2);

	// each part: it rises into place as it is named, its edges lit; it glows when it is busy
	const assemble = (P, t0, base = 0.22) => {
		const e = spring(t - t0, 0.62, 11);
		const on = t >= t0 ? clamp((t - t0) / 0.25) : 0;
		const pre = rev(P.g.position.y) * base;      // the scan has drawn it faintly, a blueprint, before it is named
		const lit = Math.max(pre, on);
		P.edges.forEach((e_) => { e_.material.opacity = lit * (0.55 + 0.45 * on); });
		P.g.scale.setScalar(t >= t0 ? lerp(0.86, 1, e) : 0.98);
		const pk = P.pulses.reduce((m, tp) => Math.max(m, t > tp ? Math.exp(-(t - tp) / 0.5) : 0), 0);
		P.halo.material.opacity = on * (0.16 + 0.5 * pk) + (wv > 0 ? 0.35 * Math.exp(-Math.max(0, wv - 0.3) / 1.0) : 0);
		if (P.body) P.body.material.opacity = P.thin ? 0.18 + 0.12 * lit : 0.55 + 0.35 * lit;
	};
	assemble(deck, deck.t0, 0.3); assemble(api, api.t0, 0.28); assemble(sec, sec.t0, 0.25); assemble(sql, sql.t0, 0.28); assemble(bq, bq.t0, 0.25); assemble(gcs, gcs.t0, 0.25);
	const apiOn = api.t0 < 1e8 ? clamp((t - api.t0) / 0.4) : 0;
	const apiBusy = Object.values(BEAMS).filter((b) => b.id.startsWith('req-') || b.id === 'sql' || b.id === 'report').reduce((m, b) => Math.max(m, ...b.pk.map((q) => (t > q.t0 + q.dur - 0.1 && t < q.t0 + q.dur + 0.6 ? Math.exp(-(t - q.t0 - q.dur + 0.1) / 0.3) : 0)), 0), 0);
	apiCore.material.opacity = apiOn * (0.06 + 0.25 * apiBusy);
	RACK.forEach((m, i) => { m.material.opacity = Math.max(rev(API_Y) * 0.12, apiOn * (0.45 + 0.35 * apiBusy * (i % 2 ? 1 : 0.6))); });
	LEDS.forEach((l) => { l.m.material.opacity = apiOn * (0.35 + 0.65 * (Math.sin(t * l.sp + l.ph) > 0.2 ? 1 : 0)); });

	// the apps' screens
	panels.forEach((p, i) => {
		const a = APPS[i];
		const e = spring(t - a.t0, 0.7, 9);
		p.g.position.y = APPS_Y + lerp(-1.2, 0, e) + Math.sin(t * 0.6 + i) * 0.04;
		const op = clamp((t - a.t0) / 0.4);
		p.screen.material.opacity = op; p.frame.material.opacity = op * 0.9; p.g.visible = op > 0.003;
		p.edge.material.opacity = op * (0.35 + 0.65 * (t > deck.t0 ? 1 : 0.3));
		// the request leaving each screen: the screen brightens a touch
		const busy = BEAMS['req-' + a.id].pk.reduce((m, q) => Math.max(m, t > q.t0 && t < q.t0 + 0.5 ? Math.sin(Math.PI * (t - q.t0) / 0.5) : 0), 0);
		p.screen.material.color.setScalar(0.86 + 0.12 * busy);
		if (a.id === 'workspace' && approveTex) {
			const sw = approve.t0 < 1e8 && t > approve.t0 + 0.25;
			p.screen.material.map = sw ? approveTex : p.tex0;
			// a sheen across the screen as it turns to the plan's Approve
			const g = approve.t0 < 1e8 ? (t - approve.t0) / 0.6 : -1;
			p.sheen.material.opacity = g > 0 && g < 1 ? Math.sin(Math.PI * g) * 0.7 : 0;
			p.sheen.position.x = lerp(-2.6, 2.6, clamp(g));
		}
	});

	// the lines: drawn on, then packets running along them
	for (const b of Object.values(BEAMS)) {
		const pr = clamp((t - b.t0) / b.dur);
		b.m.uniforms.prog.value = b.t0 < 1e8 ? eo(pr) : 0;
		const fadeAll = 1 - (wv > 0 ? 0 : 0);
		b.m.uniforms.alpha.value = (b.t0 < 1e8 && t > b.t0 ? 0.85 : 0) * fadeAll;
		let pulse = -1;
		for (const q of b.pk) { const pp = (t - q.t0) / q.dur; if (pp > 0 && pp < 1) pulse = eo(pp); }
		b.m.uniforms.pulse.value = pulse;
	}
	// the wave of light down the platform on the yes: every line glows once
	if (wv > 0) for (const b of Object.values(BEAMS)) if (b.t0 < 1e8) b.m.uniforms.pulse.value = clamp((wv - 0.2) / 1.4);

	// the bus: its ring ignites; events run round it; topics ride it
	const bo = bus.t0 < 1e8 ? clamp((t - bus.t0) / 0.5) : 0;
	bus.core.material.opacity = Math.max(rev(BUS_Y) * 0.16, bo * 0.85); bus.halo.material.opacity = bo * 0.12;
	bus.g.scale.setScalar(bus.t0 < 1e8 ? lerp(0.97, 1, spring(t - bus.t0, 0.7, 8)) : 0.97);
	bus.pk.forEach((q) => {
		const a = (q.ph + t * q.sp) * Math.PI * 2;
		q.s.position.set(Math.cos(a) * BUS_R, 0, Math.sin(a) * BUS_R);
		q.s.material.opacity = bo * 0.8; q.s.scale.setScalar(0.6);
	});
	TOPICS.forEach((L, i) => { const a = L.ang + (t - (C ? C.step : 0)) * 0.05; L.anchor.set(Math.cos(a) * BUS_R, BUS_Y + 0.35, Math.sin(a) * BUS_R); });
	// the clock: its hand jumps on each tick
	const co = clock.t0 < 1e8 ? clamp((t - clock.t0) / 0.4) : 0, cg = rev(BUS_Y) * 0.2;
	clock.ring.material.opacity = Math.max(cg, co); clock.ticks.children.forEach((m) => { m.material.opacity = Math.max(cg, co * 0.9); }); clock.hand.material.opacity = Math.max(cg, co);
	clock.face.material.opacity = 0.45 * cg + 0.9 * co;
	clock.g.scale.setScalar(clock.t0 < 1e8 ? lerp(0.9, 1, spring(t - clock.t0, 0.6, 12)) : 0.9);
	clock.g.lookAt(camera.position); clock.g.visible = Math.max(cg, co) > 0.003;
	let steps = 0, frac = 0;
	if (clock.ticks0 < 1e8 && t > clock.ticks0) { const n = (t - clock.ticks0) / 0.62; steps = Math.min(4, Math.floor(n)) + (n >= 4 ? 0 : 0); frac = n >= 4 ? 1 : spring((n - Math.floor(n)) * 0.62, 0.45, 26); }
	clock.hand.rotation.z = -(steps + (steps < 4 ? frac : 0)) * (Math.PI / 6) - 0.4;
	clock.halo.material.opacity = co * (0.18 + (clock.ticks0 < 1e8 && t > clock.ticks0 ? 0.4 * Math.exp(-((t - clock.ticks0) % 0.62) / 0.25) : 0));

	// the agents: each pod rises from the floor, then its edges take its tier's ink
	AGENTS.forEach((a, i) => {
		const P = a.P, e = spring(t - a.t0, 0.62, 10);
		const on = t >= a.t0 ? clamp((t - a.t0) / 0.3) : 0, gh = rev(AG_Y) * 0.22;
		P.g.position.y = AG_Y + Math.sin(t * 0.8 + i) * 0.05;
		P.g.scale.setScalar(t >= a.t0 ? lerp(0.9, 1, e) : 0.92);
		const lit = a.P.lit < 1e8 ? clamp((t - a.P.lit) / 0.3) : 0;
		const c_ = new THREE.Color(GREEN).lerp(new THREE.Color(TIER_C[a.tier]), lit).multiplyScalar(2.4);
		P.edges.forEach((e_) => { e_.material.color.copy(c_); e_.material.opacity = Math.max(gh, on); });
		P.halo.material.color.copy(c_).multiplyScalar(0.4);
		P.halo.material.opacity = on * (0.12 + 0.35 * lit * Math.exp(-Math.max(0, t - a.P.lit - 0.2) / 1.2)) + (wv > 0 ? 0.3 * Math.exp(-Math.max(0, wv - 0.9) / 1.0) * on : 0);
		P.body.material.opacity = 0.4 * gh / 0.22 + 0.5 * on; P.g.visible = Math.max(gh, on) > 0.003;
		a.icon.material.opacity = Math.max(gh, on);
		a.icon.material.color.copy(new THREE.Color(0xd9f7e7).lerp(new THREE.Color(TIER_C[a.tier]), lit * 0.6));
		if (a.tierEl) { a.tierEl.style.opacity = clamp((t - a.tierT) / 0.3).toFixed(3); }
	});

	// the label photo, out of the bucket and into Vision
	const pp = photo.t0 < 1e8 ? (t - photo.t0) / 1.0 : -1;
	if (pp > 0 && pp < 1.6) {
		const q = BEAMS['gcs-vision'].curve.getPoint(eo(Math.min(1, pp)));
		photo.position.copy(q); photo.lookAt(camera.position);
		photo.scale.setScalar(lerp(1.0, 0.45, eo(Math.min(1, pp))));
		photo.material.opacity = Math.min(clamp(pp / 0.15), clamp((1.45 - pp) / 0.3));
	} else photo.material.opacity = 0;
	photo.visible = photo.material.opacity > 0.003;

	// the heart: Gemini ignites, turns, and its motes circle it
	const go = gem.t0 < 1e8 ? clamp((t - gem.t0) / 0.5) : 0;
	const burst = gem.t0 < 1e8 && t > gem.t0 ? Math.exp(-(t - gem.t0) / 0.6) : 0;
	gem.coreMat.uniforms.a.value = Math.max(rev(GEM.y) * 0.14, go); gem.coreMat.uniforms.t.value = t;
	gem.core.scale.setScalar(go > 0 ? lerp(0.55, 1, spring(t - gem.t0, 0.5, 9)) : 0.55);
	gem.spark.material.opacity = go * (0.75 + 0.6 * burst); gem.spark.material.rotation = t * 0.18;
	gem.spark.scale.setScalar(2.4 + 1.6 * burst + 0.12 * Math.sin(t * 2.2));
	gem.halo.material.opacity = go * (0.35 + 0.5 * burst); gem.halo2.material.opacity = go * 0.22;
	gem.light.intensity = go * (8 + 30 * burst);
	gem.motes.forEach((m) => { const a = m.ph + t * m.sp; m.s.position.set(Math.cos(a) * m.r, Math.sin(a * 1.3) * 0.5 + Math.sin(a) * m.tilt, Math.sin(a) * m.r * 0.6); m.s.material.opacity = go * 0.8; });

	// the shield
	const so = shield.t0 < 1e8 ? clamp((t - shield.t0) / 0.5) : 0;
	shieldMat.uniforms.a.value = so * (0.7 + 0.3 * Math.exp(-Math.max(0, t - (C ? C.money : 0)) / 0.8)) * (1 - clamp((t - (approve.t0 + 0.4)) / 0.8));
	shieldMat.uniforms.t.value = t;

	// the base: the platform's own build and watch
	BASE.forEach((b) => { b.halo.material.opacity = b.label.t0 < 1e8 ? clamp((t - b.label.t0) / 0.4) * 0.5 : 0; });

	composer.render();

	// the labels, at their parts' places
	LABELS.forEach((L) => place(L, t));

	// the header: a kicker, the line word by word, the words under it
	HDR.forEach((h) => {
		const a = fade(t, h.t0, h.t1, 0.3, 0.3);
		h.el.style.opacity = a.toFixed(3);
		if (a <= 0) return;
		h.k_.style.opacity = clamp((t - h.t0) / 0.3).toFixed(3);
		h.ws.forEach((w, i) => { const e = spring(t - h.t0 - 0.08 - 0.06 * i, 0.72, 14); w.style.opacity = clamp((t - h.t0 - 0.08 - 0.06 * i) / 0.25).toFixed(3); w.style.transform = `translateY(${(22 * (1 - e)).toFixed(1)}px)`; });
		h.p_.style.opacity = clamp((t - h.t0 - 0.45) / 0.35).toFixed(3);
	});

	// guardrails: the figure and its checks beside the API
	const at = shot(V(2.9, API_Y + 0.4, 1.3));
	const mo = fade(t, money.t0, money.t1, 0.3, 0.3);
	money.style.opacity = mo.toFixed(3);
	money.style.transform = `translate(${(at.x + 40).toFixed(1)}px, ${(at.y - 150 + 16 * (1 - spring(t - money.t0, 0.7, 13))).toFixed(1)}px)`;
	if (money.t0 < 1e8) money.querySelector('.f').textContent = '₹' + Math.round(16917 * eo((t - money.t0 - 0.1) / 0.9)).toLocaleString('en-IN');
	checks.style.transform = `translate(${(at.x + 40).toFixed(1)}px, ${(at.y + 30).toFixed(1)}px)`;
	CHECKS.forEach((el) => { const v = fade(t, el.t0 ?? 1e9, money.t1, 0.25, 0.3); el.style.opacity = v.toFixed(3); el.style.transform = `translateX(${(18 * (1 - eo((t - (el.t0 ?? 1e9)) / 0.35))).toFixed(1)}px)`; });
	// the yes: the ripple on the plan's Approve, where the screen's own pointer rests
	const ws = panels[2];
	if (ws) {
		const bp = shot(ws.g.localToWorld(V(ws.w * (0.795 - 0.5), ws.h * (0.5 - 0.80), 0.02)));
		ripples.forEach((r, k) => {
			const p = (t - approve.click - 0.1 * k) / 0.7;
			if (p <= 0 || p >= 1) { r.style.opacity = 0; return; }
			const rr = 14 + 70 * eo(p);
			r.style.opacity = ((1 - p) * 0.95).toFixed(3); r.style.width = r.style.height = `${(2 * rr).toFixed(1)}px`;
			r.style.transform = `translate(${(bp.x - rr).toFixed(1)}px, ${(bp.y - rr).toFixed(1)}px)`;
		});
		const yo = fade(t, yes.t0, null, 0.3);
		yes.style.opacity = yo.toFixed(3);
		yes.style.transform = `translate(${Math.min(1920 - 560, bp.x + 250).toFixed(1)}px, ${Math.min(1080 - 96, bp.y - 30 + 14 * (1 - spring(t - yes.t0, 0.7, 13))).toFixed(1)}px)`;
	}
	const eoA = fade(t, evals.t0, null, 0.4);
	evals.style.opacity = eoA.toFixed(3);
	evals.style.transform = `translate(76px, ${(986 + 14 * (1 - eo((t - evals.t0) / 0.5))).toFixed(1)}px)`;
	return {};
};

// ------------------------------------------------------------------ build the meshes that need their textures, then ready
(async () => {
	const texs = await Promise.all(APPS.map((a) => loadTex(a.tex)));
	approveTex = await loadTex('app-approve.webp');
	texs.forEach((tx, i) => {
		const a = APPS[i];
		const w = 4.6, h = tx ? w * tx.image.height / tx.image.width : 2.6;
		const g = new THREE.Group(); g.position.set(a.x, APPS_Y, Math.abs(a.x) > 5 ? -0.6 : 0); g.rotation.y = -a.x * 0.03; world.add(g);
		const frame = new THREE.Mesh(new RoundedBoxGeometry(w + 0.22, h + 0.22, 0.12, 3, 0.08), new THREE.MeshStandardMaterial({ color: 0x0b120f, metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0, depthWrite: false }));
		frame.position.z = -0.08; g.add(frame);
		const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
		g.add(screen);
		const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w + 0.24, h + 0.24)), edgeMat(G3, 1.6)); edge.position.z = 0.01; g.add(edge);
		const sheen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, h), new THREE.MeshBasicMaterial({ color: col(0xffffff, 1.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); sheen.position.z = 0.02; g.add(sheen);
		panels.push({ g, screen, frame, edge, sheen, tex0: tx, w, h });
		a.t0 = 1e9;
	});
	// the agents' icons, on each pod's face
	await Promise.all(AGENTS.map(async (a) => {
		const tx = await iconTex(a.icon);
		const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
		m.position.z = 0.31; a.P.g.add(m); a.icon = m;
	}));
	const labelTex = await loadTex('label-photo.webp');
	if (labelTex) { photo.material.map = labelTex; photo.material.needsUpdate = true; }
	await document.fonts.ready;
	window.setCues({});
	window.__dbg = { bloom, scene, world, THREE };
	window.pageReady = true;
})();
