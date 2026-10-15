// SC-210: the agentic ecosystem, in depth. Ten agents and the person's yes on a ring round the Gemini core, on Cloud
// Run, joined by Pub/Sub, over BigQuery's sales history, with the screens kept live. Everything is a pure function of the
// scene time t (window.renderAt(t)), so a capture is frame-exact; each call returns where the nodes and the layers
// land on screen, for the compositor to set its labels in the film's own type. The cues (seconds into the scene, one
// a word of the narration) come in as window.CUES before the first frame.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const W = 1920, H = 1080;
const G = new THREE.Color(0x3fb07b), G3 = new THREE.Color(0x73c99d), G6 = new THREE.Color(0x177c52);
const AMBER = new THREE.Color(0xf7c04a), WHITE = new THREE.Color(0xeaf3ef);
const BG = new THREE.Color(0x070b09);

// ------------------------------------------------------------------ helpers
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const ramp = (t, a, b) => smooth((t - a) / Math.max(1e-6, b - a));
const lerp = (a, b, k) => a + (b - a) * k;
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let r = Math.imul(seed ^ (seed >>> 15), 1 | seed); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }

function glowTexture(inner = 'rgba(255,255,255,1)', mid = 'rgba(255,255,255,0.35)') {
	const c = document.createElement('canvas'); c.width = c.height = 256;
	const g = c.getContext('2d'); const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
	gr.addColorStop(0, inner); gr.addColorStop(0.18, mid); gr.addColorStop(0.5, 'rgba(255,255,255,0.08)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function sparkTexture() {
	// a soft four-point star: the core's spark
	const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
	g.translate(256, 256);
	for (const [sx, sy] of [[1, 0.06], [0.06, 1]]) {
		const gr = g.createRadialGradient(0, 0, 0, 0, 0, 256);
		gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
		g.save(); g.scale(sx, sy); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 256, 0, Math.PI * 2); g.fill(); g.restore();
	}
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function gridTexture(cells = 24, line = 'rgba(115,201,157,0.55)', dot = 'rgba(115,201,157,0.9)') {
	const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
	g.clearRect(0, 0, 1024, 1024); const s = 1024 / cells;
	g.strokeStyle = line; g.lineWidth = 1.2;
	for (let i = 0; i <= cells; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 1024); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(1024, i * s); g.stroke(); }
	g.fillStyle = dot;
	for (let i = 0; i <= cells; i++) for (let j = 0; j <= cells; j++) { g.beginPath(); g.arc(i * s, j * s, 2.2, 0, Math.PI * 2); g.fill(); }
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// ------------------------------------------------------------------ renderer, scene, camera, post
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = BG.clone();
scene.fog = new THREE.FogExp2(0x070b09, 0.022);
const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 400);
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.42, 0.62);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ------------------------------------------------------------------ the ground: a sky that deepens, and dust in the air
{
	const sky = new THREE.Mesh(new THREE.SphereGeometry(180, 48, 24), new THREE.ShaderMaterial({
		side: THREE.BackSide, depthWrite: false, fog: false,
		uniforms: { top: { value: new THREE.Color(0x0c2a1d) }, mid: { value: new THREE.Color(0x07140f) }, bot: { value: new THREE.Color(0x030605) } },
		vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
		fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.9, h)) : mix(mid, bot, smoothstep(0.0, 0.6, -h)); gl_FragColor = vec4(c, 1.0); }',
	}));
	scene.add(sky);
}
const dust = (() => {
	const r = rng(7), n = 2600, pos = new Float32Array(n * 3), seed = new Float32Array(n);
	for (let i = 0; i < n; i++) { pos[i * 3] = (r() - 0.5) * 90; pos[i * 3 + 1] = (r() - 0.35) * 40; pos[i * 3 + 2] = (r() - 0.5) * 90; seed[i] = r(); }
	const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
	const mat = new THREE.ShaderMaterial({
		transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
		uniforms: { t: { value: 0 }, map: { value: glowTexture() }, a: { value: 0 } },
		vertexShader: 'attribute float seed; uniform float t; varying float vA; void main(){ vec3 p = position; p.y += sin(t*0.2 + seed*30.0)*0.4; vec4 mv = modelViewMatrix*vec4(p,1.0); gl_PointSize = mv.z > -0.8 ? 0.0 : clamp((1.6 + seed*3.0) * (60.0 / -mv.z), 0.0, 24.0); vA = 0.25 + 0.75*abs(sin(t*0.7 + seed*50.0)); gl_Position = projectionMatrix*mv; }',
		fragmentShader: 'uniform sampler2D map; uniform float a; varying float vA; void main(){ vec4 c = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vec3(0.55,0.85,0.7)*c.rgb, c.a*vA*a*0.55); }',
	});
	const pts = new THREE.Points(geo, mat); scene.add(pts); return mat;
})();

// ------------------------------------------------------------------ the agents, the person's yes, on a ring
const AGENTS = ['data', 'watcher', 'vision', 'valuer', 'router', 'you', 'outreach', 'lister', 'negotiator', 'paperwork', 'impact'];
const R = 6.4, Y0 = 0.0;
const A0 = THREE.MathUtils.degToRad(206);
const nodePos = {};
AGENTS.forEach((id, i) => {
	const a = A0 - i * (Math.PI * 2 / AGENTS.length);
	nodePos[id] = new THREE.Vector3(Math.cos(a) * R, Y0 + (id === 'you' ? 0.5 : 0), Math.sin(a) * R);
});
const glowTex = glowTexture(), sparkTex = sparkTexture();
const nodes = {};
for (const id of AGENTS) {
	const g = new THREE.Group(); g.position.copy(nodePos[id]);
	const you = id === 'you';
	const core = new THREE.Mesh(new THREE.SphereGeometry(you ? 0.36 : 0.30, 40, 24), new THREE.MeshBasicMaterial({ color: G.clone(), toneMapped: false }));
	const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: (you ? AMBER : G).clone(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
	const ring = new THREE.Mesh(new THREE.TorusGeometry(you ? 0.66 : 0.56, 0.014, 8, 96), new THREE.MeshBasicMaterial({ color: (you ? AMBER : G3).clone(), transparent: true, toneMapped: false }));
	const ring2 = new THREE.Mesh(new THREE.TorusGeometry(you ? 0.86 : 0.74, 0.008, 8, 96, Math.PI * 1.3), new THREE.MeshBasicMaterial({ color: (you ? AMBER : G3).clone(), transparent: true, toneMapped: false }));
	g.add(core, halo, ring, ring2); scene.add(g);
	// its Cloud Run instance on the platform below, and the beam that ties them
	const box = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.34, 0.62), new THREE.MeshBasicMaterial({ color: G6.clone(), transparent: true, toneMapped: false }));
	box.position.set(nodePos[id].x * 1.0, -2.36, nodePos[id].z * 1.0);
	const boxEdge = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: G3.clone(), transparent: true, toneMapped: false }));
	boxEdge.position.copy(box.position);
	const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.2, 6), new THREE.MeshBasicMaterial({ color: G3.clone(), transparent: true, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
	beam.position.set(nodePos[id].x, -1.2, nodePos[id].z);
	scene.add(box, boxEdge, beam);
	// the spoke to the Gemini core
	const sp = new THREE.BufferGeometry().setFromPoints([nodePos[id].clone(), new THREE.Vector3(0, 0.4, 0)]);
	const spoke = new THREE.Line(sp, new THREE.LineBasicMaterial({ color: G3.clone(), transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }));
	scene.add(spoke);
	nodes[id] = { g, core, halo, ring, ring2, box, boxEdge, beam, spoke, you };
}
// the ADK rail: the ring the agents ride
const rail = new THREE.Mesh(new THREE.TorusGeometry(R, 0.018, 8, 360), new THREE.MeshBasicMaterial({ color: G3.clone(), transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }));
rail.rotation.x = Math.PI / 2; scene.add(rail);
const rail2 = new THREE.Mesh(new THREE.TorusGeometry(R * 1.06, 0.006, 6, 360), rail.material.clone()); rail2.rotation.x = Math.PI / 2; rail2.position.y = 0.02; scene.add(rail2);
const ticks = new THREE.Group();
for (let i = 0; i < 120; i++) {
	const a = (i / 120) * Math.PI * 2; const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, i % 10 === 0 ? 0.32 : 0.14), rail.material.clone());
	m.position.set(Math.cos(a) * R * 1.03, 0, Math.sin(a) * R * 1.03); m.lookAt(0, 0, 0); ticks.add(m);
}
scene.add(ticks);

// ------------------------------------------------------------------ the Gemini core
const coreGroup = new THREE.Group(); coreGroup.position.set(0, 0.4, 0); scene.add(coreGroup);
const coreMat = new THREE.ShaderMaterial({
	transparent: true, toneMapped: false, depthWrite: false,
	uniforms: { k: { value: 0 }, t: { value: 0 }, c1: { value: new THREE.Color(0x73c99d) }, c2: { value: new THREE.Color(0xd9f7e8) } },
	vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
	fragmentShader: 'uniform float k; uniform float t; uniform vec3 c1; uniform vec3 c2; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(clamp(1.0 - dot(normalize(vN), normalize(vV)), 0.0, 1.0), 2.2); float pulse = 0.85 + 0.15*sin(t*2.2); vec3 c = mix(c1*0.55, c2, f) * (0.18 + 1.25*f) * pulse; gl_FragColor = vec4(c*k, (0.18 + 0.82*f)*k); }',
});
const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(0.78, 64, 40), coreMat); coreGroup.add(coreSphere);
const cage = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.55, 1)), new THREE.LineBasicMaterial({ color: G3.clone(), transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }));
coreGroup.add(cage);
const cage2 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.1, 0)), cage.material.clone()); coreGroup.add(cage2);
const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex, color: WHITE.clone(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
spark.scale.set(5.5, 5.5, 1); coreGroup.add(spark);
const coreHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: G3.clone(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
coreHalo.scale.set(7, 7, 1); coreGroup.add(coreHalo);

// ------------------------------------------------------------------ the handoffs: arcs between the agents
const EDGES = [['data', 'watcher'], ['watcher', 'vision'], ['vision', 'valuer'], ['valuer', 'router'], ['router', 'you'],
	['you', 'outreach'], ['you', 'lister'], ['lister', 'negotiator'], ['outreach', 'paperwork'], ['negotiator', 'paperwork'], ['paperwork', 'impact']];
function arc(a, b, lift = 1.5) {
	const p0 = nodePos[a], p3 = nodePos[b];
	const mid = p0.clone().add(p3).multiplyScalar(0.5);
	const inward = mid.clone().multiplyScalar(-0.22); inward.y = 0;
	const c1 = p0.clone().lerp(p3, 0.25).add(inward).add(new THREE.Vector3(0, lift, 0));
	const c2 = p0.clone().lerp(p3, 0.75).add(inward).add(new THREE.Vector3(0, lift, 0));
	return new THREE.CubicBezierCurve3(p0.clone(), c1, c2, p3.clone());
}
const edgeMat = (color) => new THREE.ShaderMaterial({
	transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
	uniforms: { prog: { value: 0 }, a: { value: 0 }, t: { value: 0 }, c: { value: color.clone() }, hot: { value: 0 } },
	vertexShader: 'varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
	fragmentShader: 'uniform float prog; uniform float a; uniform float t; uniform vec3 c; uniform float hot; varying float vU; void main(){ if (vU > prog) discard; float head = smoothstep(prog-0.12, prog, vU)*step(prog, 0.999); float dash = 0.55 + 0.45*sin((vU*26.0 - t*3.0)); gl_FragColor = vec4(c*(0.75 + 1.1*head + 1.2*hot), (0.3*dash + 0.6*head + 0.5*hot)*a); }',
});
const edges = EDGES.map(([a, b]) => {
	const curve = arc(a, b, a === 'router' || b === 'you' || a === 'you' ? 2.0 : 1.4);
	const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.022, 6, false), edgeMat(a === 'you' || b === 'you' ? AMBER : G3));
	scene.add(mesh);
	return { a, b, curve, mesh };
});

// ------------------------------------------------------------------ Cloud Run: the platform the agents run on
const platform = new THREE.Mesh(new THREE.CircleGeometry(10.5, 128), new THREE.ShaderMaterial({
	transparent: true, depthWrite: false, toneMapped: false,
	uniforms: { map: { value: gridTexture(30) }, a: { value: 0 }, t: { value: 0 } },
	vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
	fragmentShader: 'uniform sampler2D map; uniform float a; uniform float t; varying vec2 vUv; void main(){ vec2 d = vUv - 0.5; float r = length(d)*2.0; vec4 g = texture2D(map, vUv*2.0); float edge = smoothstep(0.86, 0.995, r)*(1.0 - smoothstep(0.995, 1.0, r)); float sweep = 1.0 - smoothstep(0.0, 0.08, abs(r - fract(t*0.18)*1.2)); float fadeR = 1.0 - smoothstep(0.55, 1.0, r); vec3 base = vec3(0.03,0.09,0.06); vec3 col = base*fadeR + g.rgb*g.a*0.28*fadeR + vec3(0.45,0.79,0.62)*(edge*0.55 + sweep*0.22*fadeR); gl_FragColor = vec4(col*a, (0.45*fadeR + edge*0.7)*a); }',
}));
platform.rotation.x = -Math.PI / 2; platform.position.y = -2.55; scene.add(platform);

// ------------------------------------------------------------------ Pub/Sub: the bus every event flows on
const BUS_R = 8.3, BUS_Y = -1.25;
const bus = new THREE.Mesh(new THREE.TorusGeometry(BUS_R, 0.03, 8, 360), new THREE.MeshBasicMaterial({ color: G3.clone(), transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }));
bus.rotation.x = Math.PI / 2; bus.position.y = BUS_Y; scene.add(bus);
const busPts = (() => {
	const n = 420, r = rng(11), seed = new Float32Array(n), pos = new Float32Array(n * 3);
	for (let i = 0; i < n; i++) seed[i] = r();
	const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
	const mat = new THREE.ShaderMaterial({
		transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
		uniforms: { map: { value: glowTex }, a: { value: 0 } },
		vertexShader: 'attribute float seed; varying float vS; void main(){ vS = seed; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = mv.z > -0.8 ? 0.0 : clamp((5.0 + seed*7.0)*(30.0/-mv.z), 0.0, 48.0); gl_Position = projectionMatrix*mv; }',
		fragmentShader: 'uniform sampler2D map; uniform float a; varying float vS; void main(){ vec4 c = texture2D(map, gl_PointCoord); vec3 col = mix(vec3(0.45,0.79,0.62), vec3(0.85,1.0,0.92), vS); gl_FragColor = vec4(col*c.rgb*1.15, c.a*a*0.8); }',
	});
	const p = new THREE.Points(geo, mat); scene.add(p); return { p, geo, mat, seed, n };
})();
// a drop from every agent to the bus
const drops = AGENTS.map((id) => {
	const g = new THREE.BufferGeometry().setFromPoints([nodePos[id].clone(), new THREE.Vector3(nodePos[id].x * BUS_R / R, BUS_Y, nodePos[id].z * BUS_R / R)]);
	const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: G3.clone(), transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }));
	scene.add(l); return l;
});

// ------------------------------------------------------------------ BigQuery: the sales history, deep below
const BQ_Y = -4.6;
const bq = (() => {
	const r = rng(23), n = 520, geo = new THREE.BoxGeometry(0.16, 1, 0.16); geo.translate(0, 0.5, 0);
	const mat = new THREE.MeshBasicMaterial({ color: G6.clone().multiplyScalar(1.6), transparent: true, toneMapped: false });
	const inst = new THREE.InstancedMesh(geo, mat, n);
	const hs = [], ps = [];
	for (let i = 0; i < n; i++) {
		const rr = Math.sqrt(r()) * 6.6, a = r() * Math.PI * 2;
		ps.push(new THREE.Vector3(Math.cos(a) * rr, BQ_Y, Math.sin(a) * rr));
		hs.push(0.25 + Math.pow(r(), 2.2) * 2.2 * (1.0 - rr / 7.5));
	}
	scene.add(inst);
	const disc = new THREE.Mesh(new THREE.CircleGeometry(7.2, 96), new THREE.ShaderMaterial({
		transparent: true, depthWrite: false, toneMapped: false, uniforms: { a: { value: 0 } },
		vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
		fragmentShader: 'uniform float a; varying vec2 vUv; void main(){ float r = length(vUv-0.5)*2.0; float edge = smoothstep(0.9, 0.99, r)*(1.0-smoothstep(0.99,1.0,r)); vec3 c = vec3(0.04,0.12,0.08)*(1.0-r) + vec3(0.45,0.79,0.62)*edge*0.5; gl_FragColor = vec4(c*a, (0.5*(1.0-r) + edge*0.7)*a); }',
	}));
	disc.rotation.x = -Math.PI / 2; disc.position.y = BQ_Y - 0.01; scene.add(disc);
	return { inst, hs, ps, n, mat, disc, m: new THREE.Matrix4(), s: new THREE.Vector3(), q: new THREE.Quaternion() };
})();
const bqPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.0, 8), new THREE.MeshBasicMaterial({ color: G3.clone(), transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }));
bqPillar.position.set(0, (BQ_Y + -2.55) / 2, 0); scene.add(bqPillar);

// ------------------------------------------------------------------ the screens kept live: a laptop, a tablet, a phone
const DEV = [{ id: 'laptop', w: 2.2, h: 1.4, a: -90 }, { id: 'tablet', w: 1.3, h: 1.75, a: -56 }, { id: 'phone', w: 0.75, h: 1.5, a: -124 }];
const devices = DEV.map((d) => {
	const a = THREE.MathUtils.degToRad(d.a); const g = new THREE.Group();
	g.position.set(Math.cos(a) * 11.4, 4.2, Math.sin(a) * 11.4); g.lookAt(Math.cos(a) * 30, 7.0, Math.sin(a) * 30);
	const frame = new THREE.Mesh(new THREE.PlaneGeometry(d.w + 0.12, d.h + 0.12), new THREE.MeshBasicMaterial({ color: 0x0d1612, transparent: true, toneMapped: false }));
	const scr = new THREE.Mesh(new THREE.PlaneGeometry(d.w, d.h), new THREE.MeshBasicMaterial({ color: G6.clone(), transparent: true, toneMapped: false }));
	scr.position.z = 0.01;
	const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(d.w + 0.12, d.h + 0.12)), new THREE.LineBasicMaterial({ color: G3.clone(), transparent: true, toneMapped: false }));
	edge.position.z = 0.012;
	// rows of a live screen: bars that fill as the pulse lands
	const rows = [];
	for (let i = 0; i < 5; i++) {
		const bar = new THREE.Mesh(new THREE.PlaneGeometry(d.w * 0.78, d.h * 0.07), new THREE.MeshBasicMaterial({ color: G3.clone(), transparent: true, toneMapped: false }));
		bar.position.set(0, d.h * 0.32 - i * d.h * 0.15, 0.02); g.add(bar); rows.push(bar);
	}
	g.add(frame, scr, edge); scene.add(g);
	const pulse = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: G3.clone(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
	pulse.scale.set(0.9, 0.9, 1); scene.add(pulse);
	const from = new THREE.Vector3(Math.cos(a) * BUS_R, BUS_Y, Math.sin(a) * BUS_R);
	const path = new THREE.QuadraticBezierCurve3(from, from.clone().lerp(g.position, 0.5).add(new THREE.Vector3(0, 2.2, 0)), g.position.clone());
	const line = new THREE.Mesh(new THREE.TubeGeometry(path, 48, 0.012, 5, false), edgeMat(G3)); scene.add(line);
	return { d, g, frame, scr, edge, rows, pulse, path, line };
});

// ------------------------------------------------------------------ the batch, passed from hand to hand
const token = new THREE.Group();
const tokCube = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), new THREE.MeshBasicMaterial({ color: WHITE.clone(), toneMapped: false }));
const tokHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: G3.clone(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
tokHalo.scale.set(2.4, 2.4, 1); token.add(tokCube, tokHalo); scene.add(token);
const trail = (() => {
	const n = 60, pos = new Float32Array(n * 3), k = new Float32Array(n);
	for (let i = 0; i < n; i++) k[i] = i / n;
	const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('k', new THREE.BufferAttribute(k, 1));
	const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
		uniforms: { map: { value: glowTex }, a: { value: 0 }, c: { value: G3.clone() } },
		vertexShader: 'attribute float k; varying float vK; void main(){ vK = k; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = mv.z > -0.8 ? 0.0 : clamp((14.0*(1.0-k))*(30.0/-mv.z), 0.0, 48.0); gl_Position = projectionMatrix*mv; }',
		fragmentShader: 'uniform sampler2D map; uniform float a; uniform vec3 c; varying float vK; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(c*t.rgb*1.5, t.a*a*(1.0-vK)); }' });
	const p = new THREE.Points(geo, mat); scene.add(p); return { geo, mat, n };
})();
const ROUTE = ['data', 'watcher', 'vision', 'valuer', 'router', 'you', 'outreach', 'lister', 'negotiator', 'paperwork', 'impact'];
function routeCurve(i) { const a = ROUTE[i], b = ROUTE[i + 1]; return arc(a, b, 1.1); }
const routeCurves = ROUTE.slice(0, -1).map((_, i) => routeCurve(i));

// ------------------------------------------------------------------ the camera: shots between the cues
let CUES = null;
function cue(name, fallback) { const v = CUES?.[name]; return typeof v === 'number' ? v : fallback; }
const NAMED = ['data', 'watcher', 'vision', 'valuer', 'router', 'outreach', 'lister', 'negotiator', 'paperwork', 'impact'];
function azOf(id) { const p = nodePos[id]; return Math.atan2(p.z, p.x); }
function unwrap(prev, a) { while (a - prev > Math.PI) a -= Math.PI * 2; while (a - prev < -Math.PI) a += Math.PI * 2; return a; }
// a shot: camera at (azimuth, radius, height), looking at (target azimuth, target radius, target height)
function shotAt(t) {
	const ten = cue('ten', 1.0), adk = cue('adk', 2.5), run = cue('run', 4.0), gem = cue('gemini', 5.5);
	const first = cue('data', 8), last = cue('impact', 24), pub = cue('pubsub', 26), bqT = cue('bigquery', 28), scr = cue('screens', 30);
	const pass = cue('pass', 33), yes = cue('yes', 36), end = cue('end', 40);
	// key shots, in order; each holds until the next begins its move (moves take `mv` seconds and end on their cue)
	const K = [];
	const front = -Math.PI / 2;   // the camera's home: in front (negative z)
	K.push({ t: 0, az: front + 0.32, r: 22, h: 11.5, taz: 0, tr: 0, th: -0.8 });
	K.push({ t: ten + 0.2, az: front + 0.05, r: 18.5, h: 8.0, taz: 0, tr: 0, th: -0.2, mv: Math.max(1.0, ten + 0.2) });
	K.push({ t: gem + 0.4, az: front - 0.06, r: 14.2, h: 5.2, taz: 0, tr: 0, th: 0.0, mv: Math.max(1.2, gem - ten) });
	// each agent as it is named: the camera swings round to face it from outside the ring, close
	let prevAz = front - 0.06;
	for (const id of NAMED) {
		const c = cue(id, null); if (c == null) continue;
		let az = unwrap(prevAz, azOf(id) - 0.42); prevAz = az;
		K.push({ t: c + 0.15, az, r: 11.6, h: 3.0, taz: azOf(id) + 0.0, tr: R * 0.55, th: 0.2, mv: 0.9, unwrapT: true });
	}
	K.push({ t: pub + 0.2, az: unwrap(prevAz, front + 0.3), r: 19.5, h: 6.2, taz: 0, tr: 0, th: -1.8, mv: 1.6 });
	K.push({ t: bqT + 0.3, az: unwrap(prevAz, front + 0.45), r: 17.0, h: 2.6, taz: 0, tr: 0, th: -3.4, mv: 1.4 });
	K.push({ t: scr + 0.3, az: unwrap(prevAz, front + 0.05), r: 24.0, h: 6.8, taz: 0, tr: 0, th: -0.6, mv: 1.5 });
	K.push({ t: pass + 0.3, az: unwrap(prevAz, front - 0.55), r: 19.0, h: 9.0, taz: 0, tr: 0, th: -0.4, mv: 1.4 });
	const youAz = unwrap(prevAz, azOf('you') - 0.25);
	K.push({ t: yes + 0.1, az: youAz, r: 12.6, h: 4.4, taz: azOf('you'), tr: R * 0.75, th: 0.6, mv: 1.6 });
	K.push({ t: end, az: youAz + 0.35, r: 20.0, h: 9.5, taz: 0, tr: 0, th: -0.3, mv: Math.max(1.4, end - yes - 1.2) });
	// interpolate: before key i's move starts, hold key i-1
	let A = K[0], B = null;
	for (let i = 1; i < K.length; i++) { if (t >= K[i].t - (K[i].mv || 1)) { A = K[i - 1]; B = K[i]; } }
	let k = 0;
	if (B) { k = smooth((t - (B.t - (B.mv || 1))) / (B.mv || 1)); }
	const S = B || A;
	const P = (key) => (B ? lerp(A[key], S[key], k) : A[key]);
	let az = P('az'), r = P('r'), h = P('h'), taz = B ? lerp(A.taz, unwrap(A.taz, S.taz), k) : A.taz, tr = P('tr'), th = P('th');
	// a slow drift so nothing ever stands still
	az += Math.sin(t * 0.13) * 0.025; h += Math.sin(t * 0.21) * 0.15;
	return { pos: new THREE.Vector3(Math.cos(az) * r, h, Math.sin(az) * r), tgt: new THREE.Vector3(Math.cos(taz) * tr, th, Math.sin(taz) * tr) };
}

// ------------------------------------------------------------------ one frame
const tmp = new THREE.Vector3();
function project(v) {
	tmp.copy(v).project(camera);
	const vis = tmp.z < 1 && tmp.z > -1;
	return [Math.round(((tmp.x + 1) / 2) * W * 10) / 10, Math.round(((1 - tmp.y) / 2) * H * 10) / 10, vis ? 1 : 0, Math.round(camera.position.distanceTo(v) * 100) / 100];
}
function renderAt(t) {
	const ten = cue('ten', 1.0), adk = cue('adk', 2.5), run = cue('run', 4.0), gem = cue('gemini', 5.5);
	const pub = cue('pubsub', 26), bqT = cue('bigquery', 28), scr = cue('screens', 30), pass = cue('pass', 33), yes = cue('yes', 36), end = cue('end', 40);
	const intro = ramp(t, 0, 1.6);
	dust.uniforms.t.value = t; dust.uniforms.a.value = intro;
	// the core wakes first, brightest on 'Gemini'
	const coreK = 0.2 * intro + 0.4 * ramp(t, ten - 0.2, ten + 0.8) + 0.35 * ramp(t, gem - 0.2, gem + 0.6);
	coreMat.uniforms.k.value = Math.min(1.3, coreK); coreMat.uniforms.t.value = t;
	const gFlash = Math.exp(-Math.max(0, t - gem) * 1.6) * ramp(t, gem - 0.1, gem + 0.1);
	spark.material.opacity = 0.12 * intro + 0.32 * ramp(t, gem - 0.15, gem + 0.4) + 0.6 * gFlash;
	spark.material.rotation = t * 0.08; const ss = 3.6 + 1.2 * gFlash + 0.2 * Math.sin(t * 1.7); spark.scale.set(ss, ss, 1);
	coreHalo.material.opacity = 0.10 + 0.22 * ramp(t, gem - 0.2, gem + 0.6);
	cage.rotation.y = t * 0.12; cage.rotation.x = t * 0.05; cage2.rotation.y = -t * 0.07; cage2.rotation.z = t * 0.04;
	cage.material.opacity = 0.14 + 0.36 * ramp(t, gem - 0.3, gem + 0.6); cage2.material.opacity = 0.06 + 0.16 * ramp(t, gem - 0.3, gem + 0.6);
	// the rail: on 'Agent Development Kit'
	const railK = ramp(t, adk - 0.3, adk + 0.7);
	rail.material.opacity = 0.08 * ramp(t, ten - 0.3, ten + 0.6) + 0.42 * railK; rail2.material.opacity = 0.18 * railK;
	ticks.children.forEach((m, i) => { m.material.opacity = railK * (0.15 + 0.3 * ramp(t, adk + (i / 120) * 0.9, adk + (i / 120) * 0.9 + 0.2)); });
	ticks.rotation.y = t * 0.01;
	// the platform: on 'Cloud Run'
	const runK = ramp(t, run - 0.3, run + 0.8);
	platform.material.uniforms.a.value = 0.25 * ramp(t, ten, ten + 1.2) + 0.75 * runK; platform.material.uniforms.t.value = t;
	// the agents
	const named = {}; NAMED.forEach((id) => (named[id] = cue(id, null)));
	const out = { nodes: {}, layers: {}, devices: {}, token: null };
	AGENTS.forEach((id, i) => {
		const n = nodes[id];
		const ign = ramp(t, ten + i * 0.07, ten + i * 0.07 + 0.5);    // all ten ignite on 'Ten', one after another
		let lit = 0, focus = 0;
		if (id === 'you') {
			lit = ramp(t, yes - 0.25, yes + 0.25);
			focus = Math.exp(-Math.max(0, t - yes) * 0.9) * lit;
		} else if (named[id] != null) {
			lit = ramp(t, named[id] - 0.1, named[id] + 0.35);
			const nxt = NAMED.slice(NAMED.indexOf(id) + 1).map((x) => named[x]).find((x) => x != null);
			focus = lit * (nxt != null ? 1 - ramp(t, nxt, nxt + 0.6) : 1 - ramp(t, named[id] + 1.6, named[id] + 2.4));
		}
		// when the batch passes through, it lights again
		let pass_k = 0;
		const ri = ROUTE.indexOf(id); const tok = tokenT(t, pass, yes, end);
		if (tok != null) pass_k = Math.max(0, 1 - Math.abs(tok.pos - ri) * 1.4);
		const baseC = n.you ? new THREE.Color(0x6f7a74).lerp(AMBER, lit) : G;
		const bright = 0.18 * ign + 0.55 * lit + 1.1 * focus + 0.9 * pass_k;
		n.core.material.color.copy(baseC).multiplyScalar(0.45 + bright * 0.85);
		n.halo.material.opacity = 0.06 * ign + 0.22 * lit + 0.38 * focus + 0.4 * pass_k;
		const hs = 1.3 + 1.1 * focus + 0.7 * pass_k + (n.you ? 0.5 * lit : 0); n.halo.scale.set(hs, hs, 1);
		n.ring.material.opacity = 0.15 * ign + 0.6 * lit + 0.25 * focus; n.ring2.material.opacity = 0.35 * lit + 0.4 * focus;
		n.ring.rotation.x = Math.PI / 2 + Math.sin(t * 0.8 + i) * 0.4; n.ring.rotation.y = t * (0.6 + i * 0.05);
		n.ring2.rotation.x = Math.PI / 2.4; n.ring2.rotation.z = -t * (0.9 + i * 0.03);
		const bob = Math.sin(t * 0.9 + i * 0.7) * 0.06; n.g.position.y = nodePos[id].y + bob;
		n.box.material.opacity = runK * (0.55 + 0.45 * (lit + pass_k)); n.boxEdge.material.opacity = runK * (0.6 + 0.4 * lit);
		n.beam.material.opacity = runK * (0.06 + 0.3 * focus + 0.25 * pass_k);
		n.spoke.material.opacity = ramp(t, gem - 0.2, gem + 0.5) * 0.07 + 0.35 * focus + (n.you ? 0 : 0.08 * lit);
		out.nodes[id] = { p: null, lit: Math.round(lit * 100) / 100, focus: Math.round(focus * 100) / 100, pass: Math.round(pass_k * 100) / 100 };
	});
	// the handoffs draw as their second agent is named (the yes's own edges on 'yes')
	edges.forEach((e) => {
		const tb = e.b === 'you' ? yes : named[e.b] ?? null;
		const ta = e.a === 'you' ? yes : null;
		const at = ta != null && tb != null ? Math.max(ta, tb) : tb;
		const prog = at == null ? 0 : ramp(t, at - 0.45, at + 0.35);
		e.mesh.material.uniforms.prog.value = prog; e.mesh.material.uniforms.a.value = prog > 0 ? 1 : 0;
		e.mesh.material.uniforms.t.value = t;
		const tok = tokenT(t, pass, yes, end);
		let hot = 0; if (tok) { const ia = ROUTE.indexOf(e.a), ib = ROUTE.indexOf(e.b); if (tok.pos > ia && tok.pos < ib + 0.3 && ib - ia <= 2) hot = 0.8; }
		e.mesh.material.uniforms.hot.value = hot;
	});
	// Pub/Sub: on its cue the bus lights and the events start to flow round it
	const busK = ramp(t, pub - 0.3, pub + 0.6);
	bus.material.opacity = 0.05 * ramp(t, ten, ten + 2) + 0.38 * busK;
	drops.forEach((l, i) => (l.material.opacity = busK * (0.18 + 0.25 * Math.max(0, Math.sin(t * 2.0 + i * 1.3)))));
	busPts.mat.uniforms.a.value = busK;
	{
		const pos = busPts.geo.attributes.position.array;
		for (let i = 0; i < busPts.n; i++) {
			const s = busPts.seed[i]; const a = s * Math.PI * 2 + t * (0.35 + s * 0.25) * (i % 7 === 0 ? -1 : 1);
			const rr = BUS_R + Math.sin(s * 91 + t) * 0.05;
			pos[i * 3] = Math.cos(a) * rr; pos[i * 3 + 1] = BUS_Y + Math.sin(s * 40 + t * 2) * 0.03; pos[i * 3 + 2] = Math.sin(a) * rr;
		}
		busPts.geo.attributes.position.needsUpdate = true;
	}
	// BigQuery: the history rises on its cue
	const bqK = ramp(t, bqT - 0.3, bqT + 1.2);
	bq.mat.opacity = 0.85 * bqK; bq.inst.visible = bqK > 0.01; bq.disc.material.uniforms.a.value = 0.15 * busK + 0.85 * bqK;
	bqPillar.material.opacity = 0.6 * bqK * (0.6 + 0.4 * Math.sin(t * 3.0));
	for (let i = 0; i < bq.n; i++) {
		const grow = ramp(t, bqT - 0.2 + (i % 40) * 0.02, bqT + 0.6 + (i % 40) * 0.02);
		const h = Math.max(0.001, bq.hs[i] * (0.05 + 0.95 * grow) * (0.9 + 0.1 * Math.sin(t * 1.1 + i)));
		bq.s.set(1, h, 1); bq.m.compose(bq.ps[i], bq.q, bq.s); bq.inst.setMatrixAt(i, bq.m);
	}
	bq.inst.instanceMatrix.needsUpdate = true;
	// the screens: each lights as a pulse reaches it, then stays live
	const scrK = ramp(t, scr - 0.3, scr + 0.5);
	devices.forEach((dv, i) => {
		const t0 = scr + i * 0.35;
		const vis = ramp(t, t0 - 0.4, t0 + 0.3) * scrK * (1 - ramp(t, pass - 0.3, pass + 0.6));
		dv.frame.material.opacity = vis * 0.95; dv.edge.material.opacity = vis; dv.scr.material.opacity = vis * 0.9;
		const travel = (t - t0 + 0.2) / 0.9;
		const live = ramp(t, t0 + 0.6, t0 + 0.9);
		dv.scr.material.color.copy(G6).multiplyScalar(0.9 + 1.1 * live + 0.35 * Math.max(0, Math.sin(t * 3 + i)));
		dv.rows.forEach((b, j) => { b.material.opacity = vis * live * (0.4 + 0.6 * ramp(t, t0 + 0.7 + j * 0.12, t0 + 0.9 + j * 0.12)); b.scale.x = 0.3 + 0.7 * ramp(t, t0 + 0.7 + j * 0.12, t0 + 1.1 + j * 0.12); });
		dv.line.material.uniforms.prog.value = clamp(travel); dv.line.material.uniforms.a.value = vis * 0.9; dv.line.material.uniforms.t.value = t;
		const loop = ((t - t0) % 1.6) / 1.6;
		dv.pulse.position.copy(dv.path.getPoint(clamp(travel < 1 ? travel : loop)));
		dv.pulse.material.opacity = vis * (travel < 1 ? 1 : 0.65);
		out.devices[dv.d.id] = { p: project(dv.g.position), a: Math.round(vis * 100) / 100 };
	});
	// the batch, hand to hand
	const tok = tokenT(t, pass, yes, end);
	if (tok) {
		const seg = Math.min(routeCurves.length - 1, Math.floor(tok.pos)); const u = clamp(tok.pos - seg);
		const p = routeCurves[seg].getPoint(u); token.position.copy(p).add(new THREE.Vector3(0, 0.55, 0));
		token.visible = true; const ta = ramp(t, pass - 0.2, pass + 0.3) * (1 - ramp(t, end - 0.6, end));
		tokCube.material.color.copy(tok.atYes ? AMBER : WHITE).multiplyScalar(1.3 + 0.6 * ta);
		tokCube.rotation.set(t * 1.3, t * 1.7, 0); tokCube.scale.setScalar(ta);
		tokHalo.material.color.copy(tok.atYes ? AMBER : G3); tokHalo.material.opacity = ta; tokHalo.scale.setScalar(2.2 + (tok.atYes ? 1.6 : 0));
		trail.mat.uniforms.a.value = ta; trail.mat.uniforms.c.value.copy(tok.atYes ? AMBER : G3);
		const arr = trail.geo.attributes.position.array;
		for (let i = 0; i < trail.n; i++) {
			const tp = Math.max(0, tok.pos - i * 0.012); const sg = Math.min(routeCurves.length - 1, Math.floor(tp));
			const q = routeCurves[sg].getPoint(clamp(tp - sg)); arr[i * 3] = q.x; arr[i * 3 + 1] = q.y + 0.55; arr[i * 3 + 2] = q.z;
		}
		trail.geo.attributes.position.needsUpdate = true;
		out.token = { p: project(token.position), atYes: tok.atYes ? 1 : 0 };
	} else { token.visible = false; trail.mat.uniforms.a.value = 0; }
	// the camera
	const sh = shotAt(t); camera.position.copy(sh.pos); camera.lookAt(sh.tgt); camera.updateMatrixWorld();
	bloom.strength = 0.55 + 0.3 * gFlash + 0.2 * (tok?.atYes ? 1 : 0);
	composer.render();
	AGENTS.forEach((id) => (out.nodes[id].p = project(nodes[id].g.position)));
	out.layers = { core: project(new THREE.Vector3(0, 2.3, 0)), rail: project(new THREE.Vector3(0, 0, -R * 1.06)), run: project(new THREE.Vector3(0, -2.55, -10.5)),
		bus: project(new THREE.Vector3(0, BUS_Y, -BUS_R)), bq: project(new THREE.Vector3(0, BQ_Y, -7.2)) };
	out.cam = [Math.round(camera.position.x * 100) / 100, Math.round(camera.position.y * 100) / 100, Math.round(camera.position.z * 100) / 100];
	return out;
}
// where the batch is on its route: a position in route steps (0 = data … 10 = impact), from 'pass' to the end, with a
// stop at the person's yes (it arrives just before 'yes' is said and leaves 0.7 s after)
function tokenT(t, pass, yes, end) {
	if (t < pass - 0.2) return null;
	const iy = ROUTE.indexOf('you');
	const arrive = yes - 0.2, leave = yes + 0.7;
	if (t <= arrive) return { pos: iy * smooth01((t - pass + 0.2) / (arrive - pass + 0.2)), atYes: false };
	if (t <= leave) return { pos: iy, atYes: true };
	return { pos: iy + (ROUTE.length - 1 - iy) * smooth01((t - leave) / Math.max(0.5, end - 0.4 - leave)), atYes: t < leave + 0.4 };
}
function smooth01(x) { x = clamp(x); return x * x * (3 - 2 * x); }

window.renderAt = (t) => renderAt(t);
window.setCues = (c) => { CUES = c; };
window.ecoReady = true;
