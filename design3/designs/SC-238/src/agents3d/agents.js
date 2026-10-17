// SC-238: the agents, in 3D. The landing film's centrepiece (the maintainer: "make it more great ... 3D animations +
// effects ... really stand out"). The road the batch travels is the route of Smart-Clearance's own mark, the S drawn
// from the godown dot to the amber pin, a lit glass road floating above a living town (top-down footage far below,
// graded into the brand's green: the storyboard critic's note against v2's empty void). Nine stops stand along it, each
// the agent at work on this batch with its chip on a stem (name, stop, the model it thinks with) and a card of what it
// did, its real screen where there is one; an amber gate is the person's yes. Gemini is a glass orb above, its beams
// reaching only the nine agents that think with it (the Watcher runs on plain rules). The batch rides the road as a
// carton with its real label, the camera chasing it from stop to stop; it splits into its exits at the Router, waits at
// the gate, and goes out to the kiranas, the staff sale and the food bank, while the Lister and the Negotiator stay dim
// (the mango is too close to its date for the marketplace). The brand's rules light as the road's rails, and a glass
// shield keeps the money from the models. Then the camera rises and the road becomes the mark.
//
// The working demo's lens (SC-219 arch13): depth of field, anamorphic streaks, bloom, a 180-degree shutter summed from
// sub-frames, ACES, a grade and grain. Nothing runs on its own clock: renderAt(t) draws scene time t (60 fps), and
// setCues(cues) takes the narration's line times (and, where given, its word times) and returns the scene's sounds.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const W = 1920, H = 1080, FPS = 60, SHUTTER = 0.5 / FPS;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const eo = (x) => { x = clamp(x); return 1 - (1 - x) * (1 - x) * (1 - x); };
const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - ((-2 * x + 2) ** 3) / 2; };
const lerp = (a, b, k) => a + (b - a) * k;
const fade = (t, a, b, fi = 0.35, fo = 0.35) => Math.min(clamp((t - a) / fi), b == null ? 1 : clamp((b - t) / fo));
const spring = (x, zeta = 0.62, w = 13) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); };
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const IC = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[n] || ''}</svg>`;
const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
const GREEN = 0x34d380, G3 = 0x73c99d, AMBER = 0xf7c04a, BLUE = 0x8ab4f8, VIOLET = 0xc58af9, RED = 0xff7a66, TEAL = 0x4fd6c4, WHITE = 0xffffff;
const TIER_C = { pro: VIOLET, flash: BLUE, rules: G3, you: AMBER };

// ------------------------------------------------------------------ renderer, scene, camera
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020604);
scene.fog = new THREE.FogExp2(0x030907, 0.010);
const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 1200);
const camPrev = camera.clone();
scene.add(new THREE.HemisphereLight(0x3a7a5c, 0x020403, 0.7));
const key = new THREE.DirectionalLight(0xe9fff3, 1.25); key.position.set(-10, 26, 18); scene.add(key);
const rim = new THREE.DirectionalLight(0x8ab4f8, 0.45); rim.position.set(14, 6, -18); scene.add(rim);

// ------------------------------------------------------------------ the lens (SC-219 arch13's, at 60 fps)
const QV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
// what a material shows of itself decides whether it writes depth: a part faded out or a beam not drawn yet must not
// leave a sharp silhouette in the blur
const faded = (m) => {
	if (!m) return true;
	if (m.isShaderMaterial) { const u = m.uniforms; for (const k of ['alpha', 'a']) if (u[k] && u[k].value < 0.02) return true; return false; }
	return m.transparent && m.opacity < 0.02;
};
class DOFPass extends Pass {
	constructor() {
		super();
		this.depthRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, format: THREE.RedFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
		this.depthMat = new THREE.ShaderMaterial({ side: THREE.DoubleSide,
			vertexShader: 'varying float vZ; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vZ = -mv.z; gl_Position = projectionMatrix * mv; }',
			fragmentShader: 'varying float vZ; void main(){ gl_FragColor = vec4(vZ, 0.0, 0.0, 1.0); }' });
		this.mat = new THREE.ShaderMaterial({
			uniforms: { tColor: { value: null }, tDepth: { value: this.depthRT.texture }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, focus: { value: 20 }, scale: { value: 0 }, maxBlur: { value: 14 } },
			vertexShader: QV,
			fragmentShader: `uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 px; uniform float focus; uniform float scale; uniform float maxBlur; varying vec2 vUv;
				const float GA = 2.39996323;
				float dep(vec2 uv){ float d = texture2D(tDepth, uv).r; return d < 0.01 ? 900.0 : d; }
				float blur(float d){ return abs(clamp((1.0 / focus - 1.0 / d) * scale * focus, -1.0, 1.0)) * maxBlur; }
				void main(){
					float cd = dep(vUv); float cs = blur(cd);
					vec3 c = texture2D(tColor, vUv).rgb; float tot = 1.0; float r = 0.6;
					for (int i = 0; i < 240; i++) {
						if (r >= maxBlur) break;
						float a = float(i) * GA; vec2 tc = vUv + vec2(cos(a), sin(a)) * px * r;
						vec3 s = texture2D(tColor, tc).rgb; float sd = dep(tc); float ss = blur(sd);
						if (sd > cd) ss = clamp(ss, 0.0, cs * 2.0);
						float m = smoothstep(r - 0.5, r + 0.5, ss);
						c += mix(c / tot, s, m); tot += 1.0; r += 0.6 / r;
					}
					gl_FragColor = vec4(c / tot, 1.0);
				}`,
		});
		this.quad = new FullScreenQuad(this.mat); this.items = [];
	}
	collect(root) {
		this.items = [];
		root.traverse((o) => {
			if (!(o.isMesh || o.isPoints || o.isSprite || o.isLine)) return;
			const mode = o.userData.depthMat ? 'own' : (o.isSprite || o.isLine || o.isPoints || o.userData.nd) ? 'hide' : 'generic';
			this.items.push({ o, mode });
		});
	}
	render(renderer, writeBuffer, readBuffer) {
		if (this.mat.uniforms.scale.value < 0.05) { this.needsSwap = false; return; }
		this.needsSwap = true;
		const saved = this.items.map(({ o }) => [o.visible, o.material]);
		this.items.forEach(({ o, mode }) => {
			if (mode === 'hide' || faded(o.material)) { o.visible = false; return; }
			o.material = mode === 'own' ? o.userData.depthMat : this.depthMat;
		});
		const bg = scene.background, fog = scene.fog; scene.background = null; scene.fog = null;
		renderer.setRenderTarget(this.depthRT); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
		scene.background = bg; scene.fog = fog;
		this.items.forEach(({ o }, i) => { o.visible = saved[i][0]; o.material = saved[i][1]; });
		this.mat.uniforms.tColor.value = readBuffer.texture;
		renderer.setRenderTarget(writeBuffer); this.quad.render(renderer);
	}
}
class StreakPass extends Pass {
	constructor() {
		super();
		const o = { type: THREE.HalfFloatType };
		this.a = new THREE.WebGLRenderTarget(W / 4, H / 4, o); this.b = this.a.clone();
		this.bright = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { t: { value: null }, th: { value: 2.4 }, px: { value: new THREE.Vector2(1 / W, 1 / H) } }, vertexShader: QV,
			fragmentShader: `uniform sampler2D t; uniform float th; uniform vec2 px; varying vec2 vUv;
				void main(){ vec3 c = vec3(0.0); for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) c += texture2D(t, vUv + vec2(float(i), float(j)) * px * 1.5).rgb; c /= 9.0;
				float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(th, th * 2.4, l), 1.0); }` }));
		this.blur = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { t: { value: null }, st: { value: 1 }, px: { value: 4 / W } }, vertexShader: QV,
			fragmentShader: `uniform sampler2D t; uniform float st; uniform float px; varying vec2 vUv;
				void main(){ vec3 c = vec3(0.0); float tw = 0.0; for (int i = -7; i <= 7; i++) { float w = exp(-float(i * i) / 18.0); c += texture2D(t, vUv + vec2(float(i) * st * px, 0.0)).rgb * w; tw += w; } gl_FragColor = vec4(c / tw, 1.0); }` }));
		this.comp = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tIn: { value: null }, tS: { value: null }, k: { value: 0.38 }, tint: { value: new THREE.Color(0.6, 0.86, 0.75) } }, vertexShader: QV,
			fragmentShader: 'uniform sampler2D tIn; uniform sampler2D tS; uniform float k; uniform vec3 tint; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tIn, vUv).rgb + texture2D(tS, vUv).rgb * tint * k, 1.0); }' }));
	}
	render(renderer, writeBuffer, readBuffer) {
		this.bright.material.uniforms.t.value = readBuffer.texture; renderer.setRenderTarget(this.a); this.bright.render(renderer);
		let s = this.a, d = this.b;
		for (const st of [1, 3, 9, 27]) { this.blur.material.uniforms.t.value = s.texture; this.blur.material.uniforms.st.value = st; renderer.setRenderTarget(d); this.blur.render(renderer); [s, d] = [d, s]; }
		this.comp.material.uniforms.tIn.value = readBuffer.texture; this.comp.material.uniforms.tS.value = s.texture;
		renderer.setRenderTarget(writeBuffer); this.comp.render(renderer);
	}
}
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.renderToScreen = false;
composer.addPass(new RenderPass(scene, camera));
const dof = new DOFPass(); composer.addPass(dof);
const streak = new StreakPass(); composer.addPass(streak);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.45, 1.0); composer.addPass(bloom);
const acc = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const accQuad = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { t: { value: null }, w: { value: 1 } }, vertexShader: QV,
	fragmentShader: 'uniform sampler2D t; uniform float w; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(t, vUv).rgb * w, 1.0); }',
	blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, depthTest: false, depthWrite: false, transparent: true }));
const cine = new FullScreenQuad(new THREE.ShaderMaterial({
	uniforms: { t: { value: acc.texture }, seed: { value: 0 }, grain: { value: 0.024 }, vig: { value: 0.40 }, ca: { value: 0.005 }, exposure: { value: 1 }, fadeIn: { value: 1 } },
	vertexShader: QV,
	fragmentShader: `uniform sampler2D t; uniform float seed; uniform float grain; uniform float vig; uniform float ca; uniform float exposure; uniform float fadeIn; varying vec2 vUv;
		vec3 fit(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
		vec3 aces(vec3 c){ const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
			const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
			c *= exposure / 0.6; c = I * c; c = fit(c); c = O * c; return clamp(c, 0.0, 1.0); }
		vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(max(c, vec3(1e-6)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
		float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21) + seed); p += dot(p, p + 45.32); return fract(p.x * p.y); }
		void main(){
			vec2 d = vUv - 0.5; vec2 o = d * ca * dot(d, d) * 4.0;
			vec3 c = vec3(texture2D(t, vUv + o).r, texture2D(t, vUv).g, texture2D(t, vUv - o).b);
			c = srgb(aces(c));
			float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
			c += vec3(-0.006, 0.010, 0.012) * (1.0 - l) + vec3(0.012, 0.006, -0.010) * l;
			float v = smoothstep(0.95, 0.30, length(d * vec2(1.0, 0.86)));
			c *= mix(1.0 - vig, 1.0, v);
			float n = hash(vUv * vec2(1920.0, 1080.0)) - 0.5;
			c += n * grain * (0.55 + 0.45 * (1.0 - abs(l - 0.45) * 2.0));
			gl_FragColor = vec4(clamp(c * fadeIn, 0.0, 1.0), 1.0);
		}`,
	depthTest: false, depthWrite: false,
}));

// ------------------------------------------------------------------ textures
function canvasTex(size, draw, h = size) {
	const c = document.createElement('canvas'); c.width = size; c.height = h; draw(c.getContext('2d'), size, h);
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const GLOW = canvasTex(256, (g, s) => {
	const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
	gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.45)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.08)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = gr; g.fillRect(0, 0, s, s);
});
const STAR = canvasTex(512, (g, s) => {
	g.translate(s / 2, s / 2); const r = s * 0.47;
	const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = gr; g.beginPath();
	for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2, b = a + Math.PI / 2; if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r); g.quadraticCurveTo(Math.cos(a + Math.PI / 4) * r * 0.16, Math.sin(a + Math.PI / 4) * r * 0.16, Math.cos(b) * r, Math.sin(b) * r); }
	g.closePath(); g.fill();
});
function iconTex(name, stroke = '#ffffff') {
	return new Promise((res) => {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[name] || ''}</svg>`;
		const img = new Image();
		img.onload = () => res(canvasTex(256, (g) => g.drawImage(img, 0, 0, 256, 256)));
		img.onerror = () => res(canvasTex(256, () => {}));
		img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
	});
}
const loadImg = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
const loadTex = async (src) => { const im = await loadImg(src); if (!im) return null; const t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; };
// a paper Paperwork draws: its title and its lines, no figures (the real papers are read later in the film, flat)
const PAPER_T = (title, kind) => canvasTex(512, (g, w, h) => {
	g.fillStyle = '#f6f8f7'; g.fillRect(0, 0, w, h);
	g.fillStyle = kind === 'amber' ? '#c98f10' : '#178258'; g.fillRect(0, 0, w, 54);
	g.fillStyle = '#ffffff'; g.font = '700 26px Geist, sans-serif'; g.fillText(title, 26, 36);
	g.fillStyle = '#c9d4ce'; for (let i = 0; i < 11; i++) g.fillRect(26, 92 + i * 44, (i % 3 === 2 ? 0.55 : 0.88) * (w - 52), 12);
	g.strokeStyle = '#1f3a8a'; g.lineWidth = 3; g.beginPath(); g.moveTo(300, h - 64); g.bezierCurveTo(330, h - 96, 360, h - 40, 392, h - 74); g.bezierCurveTo(410, h - 90, 430, h - 60, 470, h - 70); g.stroke();
}, 704);

// ------------------------------------------------------------------ materials
const edgeMat = (c, k = 2.2) => new THREE.LineBasicMaterial({ color: col(c, k), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
const glowSprite = (c, k, size) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: col(c, k), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); s.scale.setScalar(size); return s; };
const nd = (o) => { o.userData.nd = true; return o; };
// a beam: drawn along its length to prog, a pulse riding it while its agent works, fading out near the lens (a beam
// across the camera must never flare the frame: the working demo's cut 10 note)
const BEAM_VS = 'varying vec2 vUv; varying float vZ; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vZ = -mv.z; gl_Position = projectionMatrix * mv; }';
function beamMat(c, k = 2.0) {
	return new THREE.ShaderMaterial({
		transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
		uniforms: { prog: { value: 0 }, alpha: { value: 0 }, color: { value: col(c, k) }, pulse: { value: -1 } },
		vertexShader: BEAM_VS,
		fragmentShader: `float sq(float x){ return x * x; } uniform float prog; uniform float alpha; uniform vec3 color; uniform float pulse; varying vec2 vUv; varying float vZ;
			void main(){ if (vUv.x > prog) discard; float head = smoothstep(prog - 0.12, prog, vUv.x) * step(prog, 0.999);
			float p = pulse >= 0.0 ? exp(-sq((vUv.x - pulse) * 14.0)) : 0.0; float near = smoothstep(1.6, 4.0, vZ);
			gl_FragColor = vec4(color * (0.55 + 1.6 * head + 2.2 * p), alpha * near * (0.62 + 0.38 * head + 0.6 * p)); }`,
	});
}
const depthOf = (m, vs = BEAM_VS) => new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { ...m.uniforms, prog: m.uniforms.prog, alpha: m.uniforms.alpha || m.uniforms.a },
	vertexShader: vs, fragmentShader: 'uniform float prog; uniform float alpha; varying vec2 vUv; varying float vZ; void main(){ if (vUv.x > prog || alpha < 0.02) discard; gl_FragColor = vec4(vZ, 0.0, 0.0, 1.0); }' });
const tube = (curve, m, r = 0.028, segs = 120) => { const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, r, 8, false), m); mesh.userData.depthMat = depthOf(m); return mesh; };

// ------------------------------------------------------------------ the world below: three plates of a living town, top-down, graded green
const world = new THREE.Group(); scene.add(world);
const R = rng(238);
world.add(new THREE.Mesh(new THREE.SphereGeometry(700, 48, 24), new THREE.ShaderMaterial({
	side: THREE.BackSide, depthWrite: false, fog: false,
	uniforms: { top: { value: new THREE.Color(0x0b261b) }, mid: { value: new THREE.Color(0x041009) }, bot: { value: new THREE.Color(0x010302) } },
	vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
	fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.8, h)) : mix(mid, bot, smoothstep(0.0, 0.5, -h)); gl_FragColor = vec4(c, 1.0); }',
})));
const GY = -9, GW = 150, GH = GW * 9 / 16;   // the town lies nine units under the road, 150 units across
const PLATES = ['a1-godown', 'a2-town', 'a3-lane'];
const BG = PLATES.map((id) => ({ id, frames: 0, fps: 60, tex: new THREE.Texture(), n: -1, ok: false }));
const floorMat = new THREE.ShaderMaterial({
	uniforms: { mapA: { value: BG[0].tex }, mapB: { value: BG[1].tex }, mixAB: { value: 0 }, hasA: { value: 0 }, hasB: { value: 0 }, k: { value: 0 }, gw: { value: GW }, gh: { value: GH } },
	vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
	fragmentShader: `uniform sampler2D mapA; uniform sampler2D mapB; uniform float mixAB; uniform float hasA; uniform float hasB; uniform float k; uniform float gw; uniform float gh; varying vec3 vW;
		void main(){
			vec2 uv = vec2(vW.x / gw + 0.5, 0.5 - vW.z / gh);
			vec2 cuv = clamp(uv, 0.002, 0.998);
			vec3 f = mix(texture2D(mapA, cuv).rgb * hasA, texture2D(mapB, cuv).rgb * hasB, mixAB);
			float l = dot(f, vec3(0.299, 0.587, 0.114));
			vec3 g = mix(vec3(0.010, 0.035, 0.024), vec3(0.28, 0.80, 0.54), l) * (0.25 + 0.75 * l);  // the town, in the brand's green
			g = mix(g, f * vec3(0.45, 0.78, 0.62), 0.22);                                             // a little of its own colour left
			float edge = smoothstep(0.0, 0.10, uv.x) * smoothstep(1.0, 0.90, uv.x) * smoothstep(0.0, 0.14, uv.y) * smoothstep(1.0, 0.86, uv.y);
			gl_FragColor = vec4(g * edge * k, 1.0);
		}`,
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(GW * 1.6, GH * 1.6), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.y = GY; floor.renderOrder = -10; world.add(floor);
// the glass deck the road floats on: a faint survey grid fading out from the S
const deckMat = new THREE.ShaderMaterial({
	transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, extensions: { derivatives: true },
	uniforms: { a: { value: 0 } },
	vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
	fragmentShader: `uniform float a; varying vec3 vW;
		float line(float x){ float f = abs(fract(x - 0.5) - 0.5) / max(fwidth(x), 1e-4); return 1.0 - min(f, 1.0); }
		void main(){ float r = length(vW.xz) / 30.0; float g = max(line(vW.x / 2.0), line(vW.z / 2.0)) * 0.5 + max(line(vW.x / 10.0), line(vW.z / 10.0)) * 0.5;
		gl_FragColor = vec4(vec3(0.22, 0.66, 0.45) * g * exp(-r * r * 1.6) * 0.20 * a, 1.0); }`,
});
const deck = nd(new THREE.Mesh(new THREE.PlaneGeometry(140, 140), deckMat)); deck.rotation.x = -Math.PI / 2; deck.position.y = 0.0; world.add(deck);
const dust = (() => {
	const n = 1600, pos = new Float32Array(n * 3), seed = new Float32Array(n);
	for (let i = 0; i < n; i++) { pos[3 * i] = (R() - 0.5) * 80; pos[3 * i + 1] = GY + R() * 26; pos[3 * i + 2] = (R() - 0.5) * 70; seed[i] = R(); }
	const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
	const m = new THREE.ShaderMaterial({
		transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
		uniforms: { t: { value: 0 }, map: { value: GLOW }, a: { value: 0.0 } },
		vertexShader: `uniform float t; attribute float seed; varying float vA; void main(){ vec3 p = position;
			p.y = ${GY.toFixed(1)} + mod(p.y - ${GY.toFixed(1)} + t * (0.1 + seed * 0.18), 26.0); p.x += sin(t * 0.3 + seed * 30.0) * 0.4;
			vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = (2.0 + seed * 4.0) * (30.0 / -mv.z); vA = (0.35 + 0.65 * seed) * smoothstep(1.0, 4.0, -mv.z); gl_Position = projectionMatrix * mv; }`,
		fragmentShader: 'uniform sampler2D map; uniform float a; varying float vA; void main(){ vec4 c = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vec3(0.62, 0.95, 0.78) * c.a, c.a * a * vA); }',
	});
	world.add(nd(new THREE.Points(g, m))); return m;
})();

// ------------------------------------------------------------------ the road: the mark's route, from the godown dot to the amber pin
// The mark's S in its 64-unit box: "M43.5 19 H27 a7 7 0 0 0 0 14 h10 a7 7 0 0 1 0 14 H20.5" (design3/system/kit.jsx Mark)
const S = 0.85, RY = 0.30;
const P2 = (x, y, h = RY) => V((x - 32) * S, h, (y - 33) * S);
const ROUTE = (() => {
	const pts = []; const push = (x, y) => pts.push(P2(x, y));
	for (let i = 0; i <= 40; i++) push(43.5 - 16.5 * i / 40, 19);
	for (let i = 1; i <= 72; i++) { const th = (270 - 180 * i / 72) * Math.PI / 180; push(27 + 7 * Math.cos(th), 26 + 7 * Math.sin(th)); }
	for (let i = 1; i <= 24; i++) push(27 + 10 * i / 24, 33);
	for (let i = 1; i <= 72; i++) { const th = (270 + 180 * i / 72) * Math.PI / 180; push(37 + 7 * Math.cos(th), 40 + 7 * Math.sin(th)); }
	for (let i = 1; i <= 40; i++) push(37 - 16.5 * i / 40, 47);
	return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
})();
const LEN = ROUTE.getLength();
const at = (u, h = RY) => { const p = ROUTE.getPointAt(clamp(u, 0, 1)); p.y = h; return p; };
const tanAt = (u) => ROUTE.getTangentAt(clamp(u, 0.0005, 0.9995));
const leftAt = (u) => { const t = tanAt(u); return V(t.z, 0, -t.x).normalize(); };
// the road's ribbon carries its centre line and its left, so its width can grow to the mark's stroke at the end
const ROAD_VS = `attribute vec3 lft; attribute float side; uniform float hw; varying vec2 vUv; varying float vZ;
	void main(){ vUv = uv; vec3 p = position + lft * side * hw; vec4 mv = modelViewMatrix * vec4(p, 1.0); vZ = -mv.z; gl_Position = projectionMatrix * mv; }`;
const roadGeo = (() => {
	const n = 1400, pos = [], lft = [], side = [], uvs = [], idx = [];
	for (let i = 0; i <= n; i++) {
		const u = i / n, p = at(u, RY + 0.01), l = leftAt(u);
		for (const s of [-1, 1]) { pos.push(p.x, p.y, p.z); lft.push(l.x, l.y, l.z); side.push(s); uvs.push(u, s < 0 ? 0 : 1); }
		if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('lft', new THREE.Float32BufferAttribute(lft, 3));
	g.setAttribute('side', new THREE.Float32BufferAttribute(side, 1)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx);
	return g;
})();
const roadMat = new THREE.ShaderMaterial({
	transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
	uniforms: { prog: { value: 0 }, t: { value: 0 }, len: { value: LEN }, a: { value: 1 }, glow: { value: 1 }, white: { value: 0 }, flow: { value: 1 }, pulseU: { value: -1 }, hw: { value: 0.62 } },
	vertexShader: ROAD_VS,
	fragmentShader: `float sq(float x){ return x * x; } uniform float prog; uniform float t; uniform float len; uniform float a; uniform float glow; uniform float white; uniform float flow; uniform float pulseU; varying vec2 vUv; varying float vZ;
		void main(){
			if (vUv.x > prog) discard;
			float s = vUv.y * 2.0 - 1.0;
			float edge = exp(-sq((abs(s) - 0.92) * 16.0));
			float core = exp(-sq(s * 7.0));
			float dist = vUv.x * len;
			float chev = smoothstep(0.55, 0.0, abs(fract(dist / 1.6 - t * 0.9 * flow) - abs(s) * 0.35 - 0.3) * 3.0) * (1.0 - smoothstep(0.55, 0.95, abs(s)));
			float head = exp(-sq((vUv.x - prog) * len * 0.6)) * step(prog, 0.999);
			float pul = pulseU >= 0.0 ? exp(-sq((vUv.x - pulseU) * len * 0.35)) : 0.0;
			vec3 green = vec3(0.20, 0.83, 0.50);
			vec3 c = green * (0.10 + edge * 1.25 + core * 0.55 + chev * 0.32 + head * 2.2 + pul * 1.4) * glow;
			c = mix(c, vec3(1.0) * (0.92 + 0.08 * edge), white);
			float al = (0.28 + edge * 0.72 + core * 0.4 + chev * 0.25 + head) * a;
			al = mix(al, a, white);
			gl_FragColor = vec4(c, clamp(al, 0.0, 1.0) * smoothstep(0.8, 2.4, vZ));
		}`,
});
const road = new THREE.Mesh(roadGeo, roadMat); road.renderOrder = 2; road.userData.depthMat = depthOf(roadMat, ROAD_VS); world.add(road);
// the godown dot at the start and the amber pin at the end, as on the mark
const ring = (r0, r1, c, k = 1.6) => { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 96), new THREE.MeshBasicMaterial({ color: col(c, k), transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; return m; };
const disc = (r, c, k = 1) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 96), new THREE.MeshBasicMaterial({ color: col(c, k), transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; return m; };
const dot = (() => {
	const g = new THREE.Group(); g.position.copy(at(0, RY + 0.03)); world.add(g);
	const d = nd(disc(0.62, 0x0d5a3e, 1.0)); g.add(d);
	const rg = nd(ring(0.62, 0.86, WHITE, 1.6)); rg.position.y = 0.01; g.add(rg);
	const glow = glowSprite(GREEN, 1.4, 3.2); glow.position.y = 0.3; g.add(glow);
	return { g, d, rg, glow };
})();
const pin = (() => {
	const g = new THREE.Group(); g.position.copy(at(1, RY + 0.03)); world.add(g);
	const d = nd(disc(0.95, AMBER, 1.0)); g.add(d);
	const rg = nd(ring(0.95, 1.18, WHITE, 1.6)); rg.position.y = 0.01; g.add(rg);
	const glow = glowSprite(AMBER, 1.0, 3.4); glow.position.y = 0.4; g.add(glow);
	const ping = nd(ring(1.0, 1.08, AMBER, 2.0)); ping.material.blending = THREE.AdditiveBlending; ping.position.y = 0.03; g.add(ping);
	return { g, d, rg, glow, ping };
})();

// ------------------------------------------------------------------ the rails: the brand's own rules, either side of the road
function offsetCurve(off, h) { const pts = []; for (let i = 0; i <= 400; i++) { const u = i / 400; pts.push(at(u, h).addScaledVector(leftAt(u), off)); } return new THREE.CatmullRomCurve3(pts, false, 'centripetal'); }
const RAILS = [-1.05, 1.05].map((off) => { const m = beamMat(AMBER, 2.2); const mesh = tube(offsetCurve(off, RY + 0.34), m, 0.035, 700); world.add(mesh); return { m, mesh }; });

// ------------------------------------------------------------------ the agents: nine stops, ten agents, one gate
const STOPS = [
	{ id: 'connect', n: 1, u: 0.07, side: -1, name: 'Connect', icon: 'database', agents: ['data'] },
	{ id: 'detect', n: 2, u: 0.175, side: -1, name: 'Detect', icon: 'radar', agents: ['watcher'] },
	{ id: 'verify', n: 3, u: 0.305, side: -1, name: 'Verify', icon: 'scan-line', agents: ['vision'] },
	{ id: 'value', n: 4, u: 0.425, side: -1, name: 'Value', icon: 'scale', agents: ['valuer'] },
	{ id: 'decide', n: 5, u: 0.515, side: -1, name: 'Decide', icon: 'split', agents: ['router'] },
	{ id: 'approve', n: 6, u: 0.585, side: 1, name: 'Approve', icon: 'hand', agents: ['you'] },
	{ id: 'execute', n: 7, u: 0.69, side: 1, name: 'Execute', icon: 'send', agents: ['lister', 'outreach', 'negot'] },
	{ id: 'settle', n: 8, u: 0.835, side: 1, name: 'Settle', icon: 'file-text', agents: ['paper'] },
	{ id: 'report', n: 9, u: 0.93, side: 1, name: 'Report', icon: 'leaf', agents: ['impact'] },
];
const STOP = Object.fromEntries(STOPS.map((s) => [s.id, s]));
const AGENTS = {
	data: { name: 'Data agent', icon: 'database', tier: 'flash', model: 'Gemini Flash' },
	watcher: { name: 'Watcher', icon: 'radar', tier: 'rules', model: 'plain rules' },
	vision: { name: 'Vision', icon: 'scan-line', tier: 'flash', model: 'Gemini Flash' },
	valuer: { name: 'Valuer', icon: 'scale', tier: 'pro', model: 'Gemini Pro' },
	router: { name: 'Router', icon: 'split', tier: 'pro', model: 'Gemini Pro' },
	you: { name: 'One yes', icon: 'hand', tier: 'you', model: 'a person' },
	lister: { name: 'Lister', icon: 'tag', tier: 'flash', model: 'Gemini Flash', dim: true },
	outreach: { name: 'Outreach', icon: 'send', tier: 'flash', model: 'Gemini Flash' },
	negot: { name: 'Negotiator', icon: 'handshake', tier: 'pro', model: 'Gemini Pro', dim: true },
	paper: { name: 'Paperwork', icon: 'file-text', tier: 'flash', model: 'Gemini Flash' },
	impact: { name: 'Impact', icon: 'leaf', tier: 'flash', model: 'Gemini Flash' },
};
const SLAB_W = 1.35, SLAB_H = 1.8;
const slabMat = () => new THREE.MeshStandardMaterial({ color: 0x0c1712, metalness: 0.35, roughness: 0.22, transparent: true, opacity: 0, emissive: 0x03100a, depthWrite: false });
STOPS.forEach((s) => {
	const p = at(s.u), l = leftAt(s.u), tg = tanAt(s.u);
	s.road = p; s.left = l; s.tan = tg;
	s.base = p.clone().addScaledVector(l, s.side * 2.15); s.base.y = 0;
	const g = new THREE.Group(); g.position.copy(s.base); world.add(g); s.g = g;
	// the station faces the road
	const toRoad = l.clone().multiplyScalar(-s.side); g.rotation.y = Math.atan2(toRoad.x, toRoad.z);
	const rg = nd(new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.018, 8, 160), new THREE.MeshBasicMaterial({ color: col(GREEN, 1.8), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
	rg.rotation.x = Math.PI / 2; rg.position.y = 0.04; g.add(rg); s.ring = rg;
	const pool = nd(new THREE.Mesh(new THREE.CircleGeometry(1.7, 64), new THREE.MeshBasicMaterial({ map: GLOW, color: col(GREEN, 0.9), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
	pool.rotation.x = -Math.PI / 2; pool.position.y = 0.03; g.add(pool); s.pool = pool;
	s.slabs = [];
	const n = s.agents.length;
	s.agents.forEach((id, i) => {
		if (id === 'you') return;
		const A = AGENTS[id];
		const xo = n === 3 ? (i - 1) * 1.7 : 0, zo = n === 3 && i !== 1 ? -0.5 : 0, sc = n === 3 && i !== 1 ? 0.84 : 1;
		const sg = new THREE.Group(); sg.position.set(xo, 0, zo); sg.rotation.y = n === 3 ? (1 - i) * 0.32 : 0; sg.scale.setScalar(sc); g.add(sg);
		const body = new THREE.Mesh(new RoundedBoxGeometry(SLAB_W, SLAB_H, 0.1, 3, 0.07), slabMat()); body.position.y = SLAB_H / 2 + 0.15; sg.add(body);
		const edge = nd(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(SLAB_W + 0.05, SLAB_H + 0.05)), edgeMat(TIER_C[A.tier], 1.6))); edge.position.set(0, SLAB_H / 2 + 0.15, 0.06); sg.add(edge);
		const icon = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ color: col(TIER_C[A.tier], 1.9), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
		icon.position.set(0, SLAB_H / 2 + 0.3, 0.07); sg.add(icon);
		const halo = glowSprite(TIER_C[A.tier], 0.9, 2.4); halo.position.set(0, SLAB_H / 2 + 0.3, 0.2); sg.add(halo);
		const top = new THREE.Object3D(); top.position.set(0, SLAB_H + 0.32, 0); sg.add(top);
		A.slab = { sg, body, edge, icon, halo, top, stop: s, scale: sc, A };
		s.slabs.push(A.slab);
	});
});
const ALL_SLABS = STOPS.flatMap((s) => s.slabs);
// the person's gate across the road at the Approve stop: two slim amber posts and a lintel of light, a curtain that parts
const gate = (() => {
	const s = STOP.approve, g = new THREE.Group(); g.position.copy(at(s.u, 0)); world.add(g);
	const tg = s.tan; g.rotation.y = Math.atan2(tg.x, tg.z);
	const amb = new THREE.MeshStandardMaterial({ color: 0x2a1d04, emissive: col(AMBER, 0.9), metalness: 0.3, roughness: 0.4, transparent: true, opacity: 0 });
	const postL = new THREE.Mesh(new RoundedBoxGeometry(0.11, 2.5, 0.11, 2, 0.04), amb); postL.position.set(-1.22, 1.25, 0); g.add(postL);
	const postR = postL.clone(); postR.position.x = 1.22; g.add(postR);
	const lintel = new THREE.Mesh(new RoundedBoxGeometry(2.55, 0.11, 0.11, 2, 0.04), amb); lintel.position.set(0, 2.5, 0); g.add(lintel);
	const curtMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
		uniforms: { a: { value: 0 }, open: { value: 0 }, t: { value: 0 }, color: { value: col(AMBER, 1.5) } },
		vertexShader: QV,
		fragmentShader: `float sq(float x){ return x * x; } uniform float a; uniform float open; uniform float t; uniform vec3 color; varying vec2 vUv;
			void main(){ float x = abs(vUv.x - 0.5) * 2.0; if (x < open) discard;
			float l1 = 0.5 + 0.5 * sin(vUv.y * 150.0 - t * 4.0); float l2 = l1 * l1; float l4 = l2 * l2; float edge = exp(-sq((x - open) * 30.0));
			float fall = smoothstep(0.0, 0.12, vUv.y) * (0.55 + 0.45 * vUv.y);
			gl_FragColor = vec4(color, a * fall * (0.05 + 0.11 * l4 + edge * 0.9 * step(0.001, open))); }` });
	const curtain = nd(new THREE.Mesh(new THREE.PlaneGeometry(2.33, 2.4), curtMat)); curtain.position.set(0, 1.25, 0); g.add(curtain);
	const burst = glowSprite(AMBER, 2.4, 7); burst.position.set(0, 1.3, 0); g.add(burst);
	const lamp = glowSprite(AMBER, 1.2, 3.4); lamp.position.set(0, 2.5, 0); g.add(lamp);
	const top = new THREE.Object3D(); top.position.set(0, 2.85, 0); g.add(top);
	AGENTS.you.slab = { top, stop: s, scale: 1, A: AGENTS.you };
	return { g, amb, curtMat, burst, lamp, posts: [postL, postR, lintel], top };
})();

// ------------------------------------------------------------------ the batch: a carton with its real label, then its streams of packs
const carton = (() => {
	const g = new THREE.Group(); world.add(g);
	const kraft = new THREE.MeshStandardMaterial({ color: 0x9c7446, roughness: 0.82, metalness: 0.0, transparent: true, opacity: 0 });
	const face = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, transparent: true, opacity: 0, emissive: 0x111111 });
	const box = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.66, 0.66), [kraft, kraft, kraft, kraft, face, kraft]); g.add(box);
	const edges = nd(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.97, 0.68, 0.68)), edgeMat(GREEN, 1.6))); g.add(edges);
	const glow = glowSprite(GREEN, 0.9, 2.6); glow.position.y = -0.1; g.add(glow);
	const scan = nd(new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.74), new THREE.MeshBasicMaterial({ color: col(BLUE, 3.0), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
	scan.position.z = 0.335; g.add(scan);
	const scanGlow = glowSprite(BLUE, 1.6, 0.9); scanGlow.position.z = 0.36; g.add(scanGlow);
	const risk = nd(ring(0.75, 0.82, RED, 2.0)); risk.material.blending = THREE.AdditiveBlending; world.add(risk);
	return { g, box, kraft, face, edges, glow, scan, scanGlow, risk };
})();
// where the exits go: the 58 shops of the distributor's kirana scheme in the town to the east, the staff sale back at the
// godown the batch came from, the food bank's van to the south-east; the bin gets nothing
const DEST = (() => {
	const town = [], r2 = rng(58);
	for (let i = 0; i < 58; i++) { const a = r2() * Math.PI * 2, r = 1.2 + Math.sqrt(r2()) * 4.2; town.push(V(18.6 + Math.cos(a) * r * 1.15, 0.08, 0.6 + Math.sin(a) * r)); }
	return { kirana: town, staff: [at(0, 0.1).add(V(1.6, 0, -1.6))], foodbank: [V(16.4, 0.1, 12.2)] };
})();
const EXITS = [
	{ id: 'kirana', n: 1372, c: GREEN, lane: -0.36, count: 230 },
	{ id: 'staff', n: 150, c: TEAL, lane: 0.0, count: 46 },
	{ id: 'foodbank', n: 58, c: AMBER, lane: 0.36, count: 28 },
];
const pointDepth = (vs, uniforms = {}) => new THREE.ShaderMaterial({ uniforms,
	vertexShader: vs.replace('void main(){', 'varying float vZ; void main(){').replace('gl_Position = projectionMatrix * mv;', 'vZ = -mv.z; gl_Position = projectionMatrix * mv;'),
	fragmentShader: 'varying float vZ; varying float vA; void main(){ if (vA < 0.05 || length(gl_PointCoord - 0.5) > 0.2) discard; gl_FragColor = vec4(vZ, 0.0, 0.0, 1.0); }' });
const townLights = (() => {
	const n = DEST.kirana.length, pos = new Float32Array(n * 3), lit = new Float32Array(n);
	DEST.kirana.forEach((p, i) => { pos[3 * i] = p.x; pos[3 * i + 1] = p.y + 0.12; pos[3 * i + 2] = p.z; });
	const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('lit', new THREE.BufferAttribute(lit, 1));
	const vs = 'attribute float lit; uniform float a; varying float vL; varying float vA; void main(){ vL = lit; vA = a; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = (12.0 + 20.0 * lit) * (28.0 / -mv.z); gl_Position = projectionMatrix * mv; }';
	const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
		uniforms: { map: { value: GLOW }, a: { value: 0 } }, vertexShader: vs,
		fragmentShader: 'uniform sampler2D map; varying float vL; varying float vA; void main(){ float m = texture2D(map, gl_PointCoord).a; vec3 c = mix(vec3(0.25, 0.32, 0.29), vec3(0.45, 1.6, 0.9), vL); gl_FragColor = vec4(c * m, m * vA * (0.35 + 0.65 * vL)); }' });
	const pts = new THREE.Points(g, m); pts.userData.depthMat = pointDepth(vs, { a: m.uniforms.a }); world.add(pts);
	return { g, m, lit, pts };
})();
const destGlow = { staff: glowSprite(TEAL, 1.1, 2.0), foodbank: glowSprite(AMBER, 0.9, 1.8) };
destGlow.staff.position.copy(DEST.staff[0]).add(V(0, 0.5, 0)); destGlow.foodbank.position.copy(DEST.foodbank[0]).add(V(0, 0.5, 0));
world.add(destGlow.staff); world.add(destGlow.foodbank);
const streams = (() => {
	const total = EXITS.reduce((a, e) => a + e.count, 0);
	const pos = new Float32Array(total * 3), colr = new Float32Array(total * 3), alpha = new Float32Array(total);
	const P = []; let k = 0;
	EXITS.forEach((e) => { const c = new THREE.Color(e.c); for (let i = 0; i < e.count; i++, k++) { P.push({ e, i, f: i / e.count, j: R(), dest: e.id === 'kirana' ? DEST.kirana[i % 52] : DEST[e.id][0] }); colr[3 * k] = c.r * 1.6; colr[3 * k + 1] = c.g * 1.6; colr[3 * k + 2] = c.b * 1.6; } });
	const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('c', new THREE.BufferAttribute(colr, 3)); g.setAttribute('al', new THREE.BufferAttribute(alpha, 1));
	const vs = 'attribute vec3 c; attribute float al; varying vec3 vC; varying float vA; void main(){ vC = c; vA = al; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = 14.0 * (26.0 / -mv.z); gl_Position = projectionMatrix * mv; }';
	const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
		uniforms: { map: { value: GLOW } }, vertexShader: vs,
		fragmentShader: 'uniform sampler2D map; varying vec3 vC; varying float vA; void main(){ float m = texture2D(map, gl_PointCoord).a; gl_FragColor = vec4(vC * m, m * vA); }' });
	const pts = new THREE.Points(g, m); pts.userData.depthMat = pointDepth(vs); world.add(pts);
	return { g, m, P, pos, alpha, total };
})();
// the papers Paperwork draws: sheets that leave its slab and land in a stack by the road, a signature's glint on the last
const papers = (() => {
	const T = [['Price-support credit note', 'g'], ['Tax-credit memo', 'g'], ['FSSAI checklist', 'g'], ['Food bank receipt', 'amber'], ['Staff sale receipt', 'g']];
	const list = T.map(([ttl, kind], i) => {
		const m = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.99), new THREE.MeshStandardMaterial({ map: PAPER_T(ttl, kind), roughness: 0.65, emissive: 0x1a2620, transparent: true, opacity: 0, side: THREE.DoubleSide }));
		world.add(m); return { m, i };
	});
	const glint = glowSprite(WHITE, 2.0, 0.9); world.add(glint);
	return { list, glint };
})();
// the money, kept from the models: a coin under a glass shield in the S's lower bowl
const MONEY = V(-2.6, 0.55, 6.0);
const coin = (() => {
	const g = new THREE.Group(); g.position.copy(MONEY); world.add(g);
	const rupee = canvasTex(256, (c, s) => { c.fillStyle = '#f7c04a'; c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 4, 0, Math.PI * 2); c.fill(); c.fillStyle = '#3a2a08'; c.font = '700 150px Geist, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('₹', s / 2, s / 2 + 8); });
	const mats = [new THREE.MeshStandardMaterial({ color: 0xb8892a, metalness: 0.8, roughness: 0.3, transparent: true, opacity: 0 }), new THREE.MeshStandardMaterial({ map: rupee, metalness: 0.6, roughness: 0.35, transparent: true, opacity: 0 }), new THREE.MeshStandardMaterial({ map: rupee, metalness: 0.6, roughness: 0.35, transparent: true, opacity: 0 })];
	const d = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 64), mats); d.rotation.x = Math.PI / 2; g.add(d);
	const shieldMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
		uniforms: { a: { value: 0 }, t: { value: 0 }, hit: { value: 0 }, color: { value: col(AMBER, 1.0) } },
		vertexShader: 'varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
		fragmentShader: `float sq(float x){ return x * x; } uniform float a; uniform float t; uniform float hit; uniform vec3 color; varying vec3 vP; varying vec3 vN; varying vec3 vV;
			float hex(vec2 p){ p = abs(p); return max(dot(p, normalize(vec2(1.0, 1.732))), p.x); }
			void main(){ vec2 p = vec2(atan(vP.z, vP.x) * 1.6, vP.y * 2.4); vec2 r = vec2(1.0, 1.732); vec2 h = r * 0.5;
			vec2 a1 = mod(p, r) - h; vec2 b1 = mod(p - h, r) - h; vec2 g = dot(a1, a1) < dot(b1, b1) ? a1 : b1;
			float e = smoothstep(0.42, 0.48, hex(g)); float f0 = 1.0 - clamp(abs(dot(vN, vV)), 0.0, 1.0); float fr = f0 * f0;
			float wave = exp(-sq((vP.y - fract(t * 0.35) * 1.6) * 6.0));
			gl_FragColor = vec4(color, a * (e * 0.22 + fr * 0.55 + wave * e * 0.25 + hit * (0.35 + 0.6 * e))); }` });
	const dome = nd(new THREE.Mesh(new THREE.SphereGeometry(1.45, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), shieldMat)); dome.position.y = -0.5; g.add(dome);
	const flash = glowSprite(AMBER, 1.8, 2.2); flash.position.set(0, 0.95, 0); g.add(flash);
	return { g, d, mats, shieldMat, dome, flash };
})();

// ------------------------------------------------------------------ Gemini: a glass orb over the S, its beams to the nine that think with it
const GEM = V(0.8, 7.6, -1.6);
const gem = (() => {
	const g = new THREE.Group(); g.position.copy(GEM); world.add(g);
	const shellMat = new THREE.ShaderMaterial({
		transparent: true, depthWrite: false, toneMapped: false,
		uniforms: { a: { value: 0 }, t: { value: 0 }, burst: { value: 0 }, c1: { value: new THREE.Color(0x4285f4) }, c2: { value: new THREE.Color(0x9b72cb) }, c3: { value: new THREE.Color(0xd96570) } },
		vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
		fragmentShader: `uniform float a; uniform float t; uniform float burst; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3; varying vec3 vN; varying vec3 vV; varying vec3 vP;
			void main(){
				float f0 = 1.0 - clamp(dot(vN, vV), 0.0, 1.0); float f = f0 * f0 * sqrt(f0 + 1e-6);
				vec3 p = vP * 2.3; float an = t * 0.32; p.xz = mat2(cos(an), -sin(an), sin(an), cos(an)) * p.xz;
				float w1 = sin(p.x * 1.7 + sin(p.y * 2.3 + t * 0.6) * 1.4 + t * 0.4);
				float w2 = sin(p.y * 2.1 + sin(p.z * 1.9 - t * 0.5) * 1.6 - t * 0.3);
				float n = 0.5 + 0.5 * sin(p.z * 1.5 + w1 * 1.3 + w2 * 0.9);
				float band = 0.5 + 0.5 * sin((vP.y + w1 * 0.22) * 4.2 + t * 0.7);
				vec3 cc = mix(c1, c2, smoothstep(0.12, 0.88, n)); cc = mix(cc, c3, smoothstep(0.6, 1.0, band) * 0.55);
				float inner = 0.30 + 0.36 * n; vec3 rimc = mix(c1, c2, 0.5 + 0.5 * vN.y) * f * 1.3;
				vec3 L = normalize(vec3(-0.45, 0.65, 0.6)); float spec = clamp(dot(reflect(-vV, vN), L), 0.0, 1.0); spec *= spec; spec *= spec; spec *= spec; spec *= spec; spec *= spec;
				vec3 c = cc * inner * (1.0 + 0.55 * burst) + rimc + vec3(spec) * 0.85;
				gl_FragColor = vec4(c * a, a * clamp(0.8 + 0.2 * f + 0.3 * spec, 0.0, 1.0)); }`,
	});
	const shell = new THREE.Mesh(new THREE.SphereGeometry(1.0, 96, 64), shellMat); shell.renderOrder = 5; g.add(shell);
	const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: STAR, color: col(WHITE, 1.05), transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); star.scale.setScalar(1.3); star.renderOrder = 6; g.add(star);
	const halo = glowSprite(VIOLET, 0.6, 5.4); g.add(halo);
	const halo2 = glowSprite(BLUE, 0.45, 10); g.add(halo2);
	const light = new THREE.PointLight(0xa58cff, 0, 26, 1.6); g.add(light);
	return { g, shell, shellMat, star, halo, halo2, light };
})();
const BEAMS = {};
Object.entries(AGENTS).forEach(([id, A]) => {
	if (!A.slab || !A.slab.sg || A.tier === 'rules' || A.tier === 'you') return;
	A.slab.sg.updateMatrixWorld(true);
	const top = A.slab.top.getWorldPosition(V(0, 0, 0)).add(V(0, -0.1, 0));
	const mid = GEM.clone().lerp(top, 0.5).add(V(0, 2.2, 0));
	const curve = new THREE.CatmullRomCurve3([GEM.clone().add(V(0, -0.2, 0)), mid, top], false, 'centripetal');
	const m = beamMat(TIER_C[A.tier], 2.6);
	const mesh = tube(curve, m, 0.028, 96); world.add(mesh);
	BEAMS[id] = { m, mesh, curve };
});
// a model reaching for the money: a beam that stops at the shield
const reach = (() => {
	const top = MONEY.clone().add(V(0, 0.95, 0));
	const curve = new THREE.CatmullRomCurve3([GEM.clone().add(V(-0.2, -0.3, 0.2)), GEM.clone().lerp(top, 0.5).add(V(-1.0, 1.4, 0)), top], false, 'centripetal');
	const m = beamMat(VIOLET, 2.6); const mesh = tube(curve, m, 0.03, 96); world.add(mesh); return { m, mesh };
})();

// ------------------------------------------------------------------ the mark: its squircle drawn round the S at the end
const SQ_PATH = [[[32, 2], [9.5, 2], [2, 9.5], [2, 32]], [[2, 32], [2, 54.5], [9.5, 62], [32, 62]], [[32, 62], [54.5, 62], [62, 54.5], [62, 32]], [[62, 32], [62, 9.5], [54.5, 2], [32, 2]]];
const SQUIRCLE = (() => {
	const P = (x, y) => new THREE.Vector2((x - 32) * S, (y - 33) * S);
	const pts = [];
	SQ_PATH.forEach((c) => { const cu = new THREE.CubicBezierCurve(P(...c[0]), P(...c[1]), P(...c[2]), P(...c[3])); cu.getPoints(64).forEach((p, i) => { if (i || !pts.length) pts.push(p); }); });
	return pts;
})();
const mark = (() => {
	const shape = new THREE.Shape(SQUIRCLE.map((p) => new THREE.Vector2(p.x, -p.y)));
	const fillMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false,
		uniforms: { a: { value: 0 } },
		vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
		// the mark's own gradient (#2fbf7f, #178258, #0d5a3e along its diagonal), in linear light for the lens to turn back
		fragmentShader: 'uniform float a; varying vec2 vP; void main(){ float k = clamp((vP.x - vP.y + 51.0) / 102.0, 0.0, 1.0); vec3 c0 = vec3(0.028, 0.521, 0.212), c1 = vec3(0.008, 0.223, 0.098), c2 = vec3(0.004, 0.102, 0.048); vec3 c = k < 0.55 ? mix(c0, c1, k / 0.55) : mix(c1, c2, (k - 0.55) / 0.45); gl_FragColor = vec4(c * 0.62, a); }' });
	const fill = nd(new THREE.Mesh(new THREE.ShapeGeometry(shape, 64), fillMat)); fill.rotation.x = -Math.PI / 2; fill.position.y = 0.01; fill.renderOrder = -5; world.add(fill);
	const line = new THREE.CatmullRomCurve3(SQUIRCLE.map((p) => V(p.x, 0.05, p.y)), true, 'centripetal');
	const lm = beamMat(G3, 2.0); const tb = nd(new THREE.Mesh(new THREE.TubeGeometry(line, 400, 0.09, 8, true), lm)); world.add(tb);
	return { fill, fillMat, lm, tb };
})();

// ------------------------------------------------------------------ what lies over the picture
const ov = document.getElementById('ov'), stemsEl = document.getElementById('stems');
const CHIPS = {};
Object.entries(AGENTS).forEach(([id, A]) => {
	const tierIcon = A.tier === 'pro' || A.tier === 'flash' ? IC('sparkles') : A.tier === 'you' ? IC('user-check') : IC('list-checks');
	const el = $(`<div class="chip ${A.tier === 'you' ? 'amber' : ''} ${A.dim ? 'dim' : ''}"><div class="ic">${IC(A.icon)}</div><div><div class="k">${A.tier === 'you' ? 'A person · stop 6 of 9' : 'Stop ' + A.slab.stop.n + ' of 9 · ' + A.slab.stop.name}</div><b>${A.name}</b></div><div class="tier ${A.tier}">${tierIcon}${A.model}</div>${A.dim ? '<div class="tag">Waits: too close to its date</div>' : ''}</div>`);
	ov.appendChild(el);
	const hex = '#' + new THREE.Color(TIER_C[A.tier]).getHexString();
	const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line'); stem.setAttribute('stroke', hex); stem.setAttribute('stroke-width', '2'); stem.setAttribute('stroke-linecap', 'round'); stem.setAttribute('opacity', '0'); stemsEl.appendChild(stem);
	const dotEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); dotEl.setAttribute('r', '4.5'); dotEl.setAttribute('fill', hex); dotEl.setAttribute('opacity', '0'); stemsEl.appendChild(dotEl);
	CHIPS[id] = { id, A, el, stem, dot: dotEl, box: null };
});
const tick = IC('check'), cross = IC('x');
const ROW = (ok, text, em, tint) => `<div class="row ${ok ? '' : 'x'}"><i ${tint ? `style="${tint}"` : ''}>${ok ? tick : cross}</i>${text}<em>${em}</em></div>`;
const TEAL_I = 'background:rgba(79,214,196,.3);color:#bff6ee', AMB_I = 'background:rgba(247,192,74,.3);color:#ffe2a3';
const CARD_HTML = {
	connect: `<h4>The stock export · mapped</h4><p>Every distributor's file, read as it lands</p>${ROW(1, 'Batch, made and best before', '✓')}${ROW(1, 'Units at every godown', '✓')}${ROW(1, 'Eight of eight fields', '8/8')}`,
	detect: `<h4>Every morning, 09:00</h4><p>A mango drink, 22 days left</p>${ROW(1, 'Sells 28 packs a day', 'sell-through')}${ROW(0, "1,580 packs won't sell in time", 'at risk')}${ROW(0, 'Every quick-commerce gate', '0 of 3')}`,
	verify: `<h4>One photo of the label</h4><p>Read, then checked against the stock</p>${ROW(1, 'Batch number', 'matches')}${ROW(1, 'Made · best before', 'matches')}${ROW(1, 'MRP ₹20', 'matches')}${ROW(1, 'Units at the godown', 'matches')}`,
	value: `<h4>Every exit, priced</h4><p>Against what the bin would cost</p>${ROW(1, 'Kiranas', '+₹15,778')}${ROW(1, 'Staff sale', '+₹1,200')}${ROW(1, 'Food bank', '−₹61')}${ROW(0, 'The bin', '−₹22,657')}`,
	decide: `<h4>The split</h4><p>Where every pack earns the most</p>${ROW(1, '1,372 to the kiranas', '58 shops')}${ROW(1, '150 at a staff sale', 'godown', TEAL_I)}${ROW(1, '58 to a food bank', 'sealed', AMB_I)}${ROW(0, 'Nothing to the bin', '0')}`,
	approve: `<h4 style="color:#f7c04a">Waiting for one yes</h4><p><span class="fig">₹16,917</span> recovered, instead of <span class="fig">−₹22,657</span></p><div class="row" style="opacity:1;margin-top:14px"><span id="yesbtn" style="flex:1;text-align:center;font:700 19px/1 Geist;padding:14px;border-radius:12px;background:linear-gradient(180deg,#ffd77a,#f2b437);color:#2a1d02">Approve · release the agents</span></div>`,
	execute: `<h4>All at once, in the distributor's name</h4><p>The offer, in Hindi, to 58 shops</p>${ROW(1, 'Two free on every ten · 48 hours', 'Outreach')}${ROW(1, 'A staff sale at the godown', '150', TEAL_I)}${ROW(1, "A food bank's pickup, booked", '58', AMB_I)}`,
	settle: `<h4>Every paper, drawn</h4><p>Signed where it must be</p>${ROW(1, 'Price-support credit note', '✓')}${ROW(1, 'Tax-credit memo', '✓')}${ROW(1, 'FSSAI checklist', '✓')}${ROW(1, 'Receipts and 52 GST invoices', '✓')}`,
	report: `<h4>The impact ledger</h4><p><span id="kg">0</span> kg kept out of landfill</p>${ROW(1, '58 meals, from the food bank', '✓')}${ROW(1, "Ready for the brand's BRSR", '✓')}`,
};
const CARDS = {};
Object.entries(CARD_HTML).forEach(([id, html]) => {
	const el = $(`<div class="card ${id === 'approve' ? 'amber' : ''}">${html}</div>`); ov.appendChild(el);
	CARDS[id] = { el, rows: [...el.querySelectorAll('.row')], pick: null };
});
const RULES = [
	{ u: 0.22, text: 'The dates each channel accepts', icon: 'calendar-clock', side: -1, word: 'dates' },
	{ u: 0.49, text: 'The floor price, never shown', icon: 'shield', side: 1, word: 'prices' },
	{ u: 0.76, text: 'The credit a distributor may get', icon: 'indian-rupee', side: -1, word: 'credit' },
].map((r) => { const el = $(`<div class="rule">${IC(r.icon)}${r.text}</div>`); ov.appendChild(el); return { ...r, el, anchor: at(r.u, RY + 0.4).addScaledVector(leftAt(r.u), r.side * 1.05) }; });
const TITLES = [];
function title(k, words, t0, t1) {
	const el = $(`<div class="ttl"><div class="k"><i></i>${k}</div><h1>${words.map((w) => `<span class="w"><span class="${w[1] || ''}">${w[0]}</span></span>`).join(' ')}</h1></div>`);
	document.getElementById('ttl').appendChild(el); const T = { el, ws: [...el.querySelectorAll('.w > span')], t0, t1 }; TITLES.push(T); return T;
}
const IDX = STOPS.map((s) => { const el = $(`<div class="ix">${IC(s.icon)}${s.name}</div>`); document.getElementById('idx').appendChild(el); return { s, el }; });
// the mark, drawn crisp over the 3D one as the camera arrives above it (design3/system/kit.jsx Mark, still)
const MARK_SVG = (() => {
	const NS = 'http://www.w3.org/2000/svg', box = document.createElementNS(NS, 'svg');
	box.setAttribute('viewBox', '0 0 64 64'); box.setAttribute('class', 'mark2d');
	box.setAttribute('style', 'position:absolute;left:0;top:0;opacity:0;overflow:visible;width:100px;height:100px');
	box.innerHTML = `<defs><linearGradient id="mkg" x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2fbf7f"/><stop offset="0.55" stop-color="#178258"/><stop offset="1" stop-color="#0d5a3e"/></linearGradient>
		<linearGradient id="mkh" x1="32" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
		<path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill="url(#mkg)"/>
		<path d="M32 3C10.5 3 3 10.5 3 31.5 10 22 22 18 32 18s22 4 29 13.5C61 10.5 53.5 3 32 3Z" fill="url(#mkh)"/>
		<path d="M43.5 19 H27 a7 7 0 0 0 0 14 h10 a7 7 0 0 1 0 14 H20.5" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
		<circle cx="43.5" cy="19" r="3.4" fill="#0d5a3e" stroke="#fff" stroke-width="2.6"/>
		<circle cx="20.5" cy="47" r="5.2" fill="#f7c04a" stroke="#fff" stroke-width="2.2"/>`;
	ov.appendChild(box); return box;
})();

// ------------------------------------------------------------------ the timeline, from the narration's line (and word) times
let C = null, EV = [], TL = {};
const ev = (t, kind, pan = 0.5, gain = 1) => EV.push({ t: +t.toFixed(3), kind, pan: +clamp(pan).toFixed(2), gain });
// default line times (scene seconds), replaced by setCues from the narration's own (build/cues-agents.json)
const DEFAULT = { n12: [0.9, 4.6], n13: [5.6, 12.4], n14: [14.6, 17.6], n15: [20.4, 25.0], n16: [27.4, 29.6], n17: [32.0, 35.0], n18: [37.4, 40.6],
	n19: [43.2, 47.6], n20: [50.4, 58.0], n21: [60.6, 62.4], n21b: [64.6, 66.8], n22: [69.2, 77.0], end: 82.5 };
const LINE_OF = { connect: 'n14', detect: 'n15', verify: 'n16', value: 'n17', decide: 'n18', approve: 'n19', execute: 'n20', settle: 'n21', report: 'n21b' };
const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9]/g, '');
// a word's time in its line: the narration's own word times when given, else a share of the line by its place in the text
const TEXT = { n13: 'Ten agents. Nine think with Gemini, on Google\'s Agent Platform. The Watcher runs on plain rules.', n19: 'Then it stops, at a person. Nothing moves without one yes.',
	n20: 'Outreach takes the offer to the kiranas. The Lister and the Negotiator work a marketplace, when a batch has the days.', n22: 'And all of it runs on the brand\'s own rules, for dates, prices and credit. The models never touch the money.',
	n17: 'The Valuer prices every exit, the bin included.', n18: 'The Router splits the batch where it earns the most.', n16: 'Vision reads the label from one photo.' };
function wt(id, word, nth = 0) {
	const ln = C[id]; if (!ln) return 0;
	const ws = C.words && C.words[id];
	if (ws) { const hits = ws.filter((x) => norm(x.w) === norm(word)); if (hits[nth]) return hits[nth].t; }
	const text = TEXT[id] || ''; const toks = text.split(/\s+/); let seen = 0;
	for (let i = 0; i < toks.length; i++) if (norm(toks[i]) === norm(word)) { if (seen++ === nth) return lerp(ln[0], ln[1], i / toks.length); }
	return ln[0];
}
const SHOTS = [];
const TOWN = V(18.6, 0, 0.6);
// a camera for a stop: target, then a direction in the road's own frame (az from the road's heading: 0 ahead, 90 its
// left, 180 behind), an elevation and a distance
function rel(tgt, s, az, el, d, fov = 32) {
	const a = az * Math.PI / 180, e = el * Math.PI / 180;
	const dir = s.tan.clone().multiplyScalar(Math.cos(a)).addScaledVector(s.left, Math.sin(a)).normalize();
	return { pos: tgt.clone().addScaledVector(dir, d * Math.cos(e)).add(V(0, d * Math.sin(e), 0)), tgt, fov, focus: d };
}
function stopShot(s) {
	const R_ = s.road, B = s.base;
	const mid = (k, h) => R_.clone().lerp(B, k).setY(h);
	switch (s.id) {
		case 'connect': return rel(mid(0.45, 0.95), s, 58, 15, 8.4);
		case 'detect': return rel(mid(0.42, 0.85), s, 118, 30, 8.8);
		case 'verify': return rel(R_.clone().setY(RY + 0.72), s, 92, 9, 3.6, 30);
		case 'value': return rel(mid(0.5, 1.0), s, 26, 22, 9.0);
		case 'decide': return rel(R_.clone().addScaledVector(s.tan, 1.4).setY(0.6), s, 160, 50, 10.5);
		case 'approve': { const tgt = at(s.u + 0.004, 1.2), pos = at(s.u - 0.088, 2.1).addScaledVector(leftAt(s.u - 0.088), -0.35); return { pos, tgt, fov: 34, focus: pos.distanceTo(tgt) }; }
		case 'execute': return rel(mid(0.5, 1.0), s, -40, 24, 9.5);
		case 'settle': return rel(mid(0.55, 0.9), s, -62, 24, 7.6);
		default: return rel(mid(0.5, 1.0), s, -118, 18, 8.2);
	}
}
window.setCues = (cues) => {
	C = Object.assign({}, DEFAULT, cues || {}); EV = []; SHOTS.length = 0; TL = {};
	const L = (id) => C[id];
	const end = C.end || 0;
	// the world wakes: the town below, then the road draws itself from the godown dot, the stations rise
	TL.road0 = 0.6; TL.road1 = 4.2; TL.rise = 2.6;
	ev(0.15, 'swell', 0.5); ev(TL.road0, 'draw', 0.5); ev(TL.rise, 'rise', 0.5);
	// "Ten agents": the stations light in turn; "Gemini": the orb; the beams to the nine; "Watcher": its own chip, plain rules
	TL.roll = wt('n13', 'Ten'); TL.orb = wt('n13', 'Gemini') - 0.2; TL.beams = TL.orb + 0.7; TL.watch = wt('n13', 'Watcher') - 0.1; TL.watch1 = L('n13')[1] + 0.6;
	ALL_SLABS.forEach((sl, i) => ev(TL.roll + i * 0.11, 'tick', 0.3 + 0.4 * (i / ALL_SLABS.length), 0.6));
	ev(TL.orb, 'orb', 0.5); ev(TL.beams, 'beams', 0.5); ev(TL.watch, 'chip', 0.4);
	// each stop: the rider arrives as its line begins, holds while it is said and the card fills, and leaves for the next
	STOPS.forEach((s, i) => {
		const ln = L(LINE_OF[s.id]); s.say = ln;
		s.t0 = ln[0] - 0.15;
		s.t1 = i + 1 < STOPS.length ? L(LINE_OF[STOPS[i + 1].id])[0] - 1.75 : L('n22')[0] - 1.6;
		ev(s.t0 + 0.05, 'stop', 0.5);
	});
	// the camera: wide over the S for the opening, the orb, a held shot at each stop with a chase between, the rails,
	// then the rise to the mark
	SHOTS.push({ t0: 0, t1: L('n13')[0] - 0.2, pos: V(-8, 33, 41), tgt: V(0.5, -1, 0.5), fov: 38, focus: 50, drift: 0.07 });
	SHOTS.push({ t0: L('n13')[0] + 1.0, t1: L('n14')[0] - 2.0, pos: V(5, 17, 21), tgt: V(0.6, 3.4, -1.2), fov: 40, focus: 24 });
	STOPS.forEach((s) => SHOTS.push({ t0: s.t0, t1: s.t1, stop: s, ...stopShot(s) }));
	// at Execute, as the packs leave for their exits, the camera rises and follows them out to the town
	const exShot = SHOTS.find((x) => x.stop === STOP.execute), townTgt = TOWN.clone().add(V(-3.2, 0.3, 1.6));
	exShot.then = { t: wt('n20', 'kiranas') - 0.2, dur: 2.6, pos: townTgt.clone().add(V(-6.5, 11.5, 11.5)), tgt: townTgt, fov: 38, focus: 17 };
	TL.exTown = exShot.then.t;
	const n22 = L('n22');
	SHOTS.push({ t0: n22[0] - 0.3, t1: wt('n22', 'models') - 0.9, pos: V(-16, 9.5, 18), tgt: V(-2.0, 0.8, 4.0), fov: 36, focus: 21 });
	SHOTS.push({ t0: wt('n22', 'models') - 0.1, t1: n22[1] + 0.3, pos: V(-8.5, 4.2, 12.5), tgt: MONEY.clone().add(V(0, 0.6, 0)), fov: 32, focus: 12 });
	TL.rise2 = n22[1] + 0.4; TL.markOn = n22[1] + 2.5; C.end = Math.max(end, n22[1] + 5.2);
	SHOTS.push({ t0: n22[1] + 3.1, t1: C.end + 1, pos: V(0, 142, 0.6), tgt: V(0, 0, -0.85), fov: 34, focus: 140, rise: true });
	for (let i = 1; i < SHOTS.length; i++) ev(SHOTS[i - 1].t1 + 0.05, SHOTS[i].stop && SHOTS[i - 1].stop ? 'whoosh-chase' : 'whoosh', 0.5, 0.8);
	// the work at each stop, on its words
	TL.data = STOP.connect.say[0] + 0.5; ev(TL.data, 'rows', 0.45);
	TL.risk = STOP.detect.say[0] + 1.2; ev(TL.risk, 'risk', 0.5);
	TL.scan = wt('n16', 'label') - 0.1; ev(TL.scan, 'scan', 0.5);
	TL.bars = wt('n17', 'exit'); ev(TL.bars, 'bars', 0.5);
	TL.split = wt('n18', 'splits'); ev(TL.split, 'split', 0.5);
	TL.gateUp = STOP.approve.t0 - 0.9; TL.tap = wt('n19', 'yes') - 0.05; TL.open = TL.tap + 0.25;
	ev(TL.gateUp, 'gate-up', 0.5); ev(TL.tap, 'tap', 0.5); ev(TL.open, 'gate', 0.5);
	TL.fan = wt('n20', 'kiranas') - 0.4; ev(TL.fan, 'fan', 0.62); TL.dimTag = wt('n20', 'Lister');
	TL.papers = STOP.settle.say[0] + 0.05; papers.list.forEach((_, i) => ev(TL.papers + i * 0.3, 'paper', 0.5, 0.7));
	TL.sign = TL.papers + 1.7; ev(TL.sign, 'sign', 0.5);
	TL.ledger = STOP.report.say[0] + 0.2; ev(TL.ledger, 'ledger', 0.5);
	TL.rails = n22[0] + 0.2; ev(TL.rails, 'rails', 0.5);
	RULES.forEach((r, i) => { r.t0 = wt('n22', r.word) - 0.1; ev(r.t0, 'rule', 0.3 + 0.2 * i, 0.8); });
	TL.reach = wt('n22', 'models') + 0.1; TL.deny = wt('n22', 'touch') + 0.1; ev(TL.deny, 'shield', 0.4);
	ev(TL.rise2, 'rise', 0.5); ev(TL.markOn, 'resolve', 0.5);
	TITLES.length = 0; document.getElementById('ttl').innerHTML = '';
	title('The agents · inside every workspace', [['A'], ['team'], ['that'], ['never', 'hl'], ['sleeps.', 'hl']], L('n12')[0] - 0.2, L('n13')[0] + 1.4);
	return { events: EV, end: C.end };
};

// ------------------------------------------------------------------ where the batch is: the rider on the road
function riderU(t) {
	if (!STOPS[0].t0) return 0.012;
	if (t < STOPS[0].t0 - 2.2) return 0.012;
	let u = 0.012, prevT1 = STOPS[0].t0 - 2.2;
	for (const s of STOPS) {
		if (t < s.t0) return lerp(u, s.u, eio((t - prevT1) / Math.max(0.2, s.t0 - prevT1)));
		u = s.u; prevT1 = s.t1;
		if (t <= s.t1) return u;
	}
	return u;
}

// ------------------------------------------------------------------ the camera: held shots, a chase between stops, eased moves elsewhere
function chaseAt(t) {
	const u = riderU(t), l = leftAt(u);
	const pos = at(u - 0.046, 1.95).addScaledVector(l, 0.8), tgt = at(u + 0.035, 0.55);
	return { pos, tgt, fov: 42, focus: pos.distanceTo(at(u, RY + 0.62)) };
}
function blendShot(a, b, k) {
	return { pos: a.pos.clone().lerp(b.pos, k), tgt: a.tgt.clone().lerp(b.tgt, k), fov: lerp(a.fov, b.fov, k), focus: lerp(a.focus, b.focus, k) };
}
function held(b, t) {
	const d = clamp((t - b.t0) / Math.max(0.01, b.t1 - b.t0));
	if (b.then && t > b.then.t) { const k = sm((t - b.then.t) / b.then.dur); return { ...b, ...blendShot(b, b.then, k) }; }
	if (b.stop && b.stop.id === 'verify') return { ...b, pos: b.pos.clone().lerp(b.tgt, 0.18 * sm(d)) };   // a slow push onto the label
	const drift = b.pos.clone().sub(b.tgt).multiplyScalar(-(b.drift || 0.035) * d);
	return { ...b, pos: b.pos.clone().add(drift) };
}
function shotAt(t) {
	if (!SHOTS.length) return { pos: V(0, 30, 30), tgt: V(0, 0, 0), fov: 36, focus: 40 };
	if (t <= SHOTS[0].t1) return held(SHOTS[0], Math.max(t, 0));
	for (let i = 1; i < SHOTS.length; i++) {
		const a = SHOTS[i - 1], b = SHOTS[i];
		if (t < b.t0) {
			const k = (t - a.t1) / Math.max(0.01, b.t0 - a.t1);
			const A_ = held(a, a.t1);
			if (a.stop && b.stop && a.stop.id !== 'execute') {
				// a chase: from the stop's shot down behind the batch, along the road, and up into the next stop's shot
				const c = chaseAt(t);
				const s1 = blendShot(A_, c, sm(k / 0.42));
				return { ...blendShot(s1, b, sm((k - 0.58) / 0.42)), moving: true };
			}
			const e = b.rise ? eio(k) : sm(k);
			const s = blendShot(A_, b, e);
			const lift = b.rise ? 0 : Math.sin(Math.PI * e) * Math.min(3.5, A_.pos.distanceTo(b.pos) * 0.12);
			s.pos.y += lift; return { ...s, moving: true };
		}
		if (t <= b.t1) return held(b, t);
	}
	return held(SHOTS[SHOTS.length - 1], t);
}
function camAt(t, cam = camera) {
	const s = shotAt(t);
	cam.position.copy(s.pos); cam.up.set(0, 1, 0); cam.lookAt(s.tgt); cam.fov = s.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
	return s;
}
const proj = V(0, 0, 0), projP = V(0, 0, 0);
const shot = (v) => { proj.copy(v).project(camera); return { x: (proj.x * 0.5 + 0.5) * W, y: (-proj.y * 0.5 + 0.5) * H, z: proj.z }; };
const speedOf = (v) => { proj.copy(v).project(camera); projP.copy(v).project(camPrev); return Math.hypot((proj.x - projP.x) * W / 2, (proj.y - projP.y) * H / 2); };
const calm = (v) => clamp(1 - (speedOf(v) - 5) / 12);

// ------------------------------------------------------------------ the scene at time t (a sub-frame's time)
const vis = (m, mat, o) => { mat.opacity = o; m.visible = o > 0.004; };
function update(t) {
	const s0 = camAt(t);
	// the lens: focus on what the shot frames; a wide shot keeps it all sharp
	dof.mat.uniforms.focus.value = s0.focus; dof.mat.uniforms.scale.value = s0.focus > 60 ? 0 : clamp(1.25 - s0.focus / 40, 0.3, 1.0);
	const out = sm((t - TL.rise2) / 1.4);              // the end: the parts fade as the camera rises
	floorMat.uniforms.k.value = lerp(0.0, 0.62, sm(t / 1.4)) * (1 - 0.55 * out);
	deckMat.uniforms.a.value = sm((t - 0.5) / 1.5) * (1 - out);
	dust.uniforms.t.value = t; dust.uniforms.a.value = 0.5 * sm(t / 1.5) * (1 - out);
	scene.fog.density = lerp(0.010, 0.0012, sm((t - TL.rise2) / 2.0));
	cine.material.uniforms.fadeIn.value = sm(t / 0.5);
	// the road draws itself from the godown dot, then flows
	roadMat.uniforms.prog.value = lerp(0, 1.0005, eio((t - TL.road0) / (TL.road1 - TL.road0)));
	roadMat.uniforms.t.value = t;
	const wk = sm((t - TL.markOn + 0.4) / 1.5);
	roadMat.uniforms.white.value = wk; roadMat.uniforms.flow.value = 1 - wk; roadMat.uniforms.hw.value = lerp(0.62, 2.55, eio((t - TL.rise2 - 0.4) / 2.4));
	const ru = riderU(t); roadMat.uniforms.pulseU.value = t > STOPS[0].t0 - 2.2 && t < STOPS[STOPS.length - 1].t1 ? ru : -1;
	const dk = sm((t - TL.road0) / 0.6);
	vis(dot.d, dot.d.material, dk); vis(dot.rg, dot.rg.material, dk); dot.glow.material.opacity = 0.6 * dk * (1 - out);
	const pk = sm((t - TL.road1 + 0.2) / 0.6);
	vis(pin.d, pin.d.material, pk); vis(pin.rg, pin.rg.material, pk); pin.glow.material.opacity = 0.7 * pk * (1 - out);
	const grow = eio((t - TL.rise2 - 0.4) / 2.4); dot.g.scale.setScalar(lerp(1, 4.6, grow)); pin.g.scale.setScalar(lerp(1, 4.5, grow));
	const pp = (((t - TL.road1) % 2.4) + 2.4) % 2.4 / 2.4; pin.ping.scale.setScalar(1 + pp * 1.8); vis(pin.ping, pin.ping.material, t > TL.road1 ? 0.7 * (1 - pp) * (1 - out) : 0);
	// the stations rise with the road, light in turn on "Ten agents", and the one at work glows
	ALL_SLABS.forEach((sl, i) => { sl.roll = t > TL.roll + i * 0.11 ? Math.exp(-(t - TL.roll - i * 0.11) * 2.2) : 0; });
	STOPS.forEach((s, i) => {
		const rise = sm((t - TL.rise - i * 0.12) / 0.9) * (1 - out);
		const on = fade(t, s.t0 - 0.1, s.t1 + 0.6, 0.45, 0.6) * (1 - out);
		const done = t > s.t1 ? 1 : 0;
		vis(s.ring, s.ring.material, (0.9 * on + 0.25 * done * rise) * rise);
		s.ring.scale.setScalar(1 + 0.12 * Math.sin(t * 2.4) * on);
		vis(s.pool, s.pool.material, 0.55 * on);
		s.slabs.forEach((sl) => {
			const dim = sl.A.dim ? 0.38 : 1, r = sl.roll || 0;
			sl.sg.position.y = (1 - sm((t - TL.rise - i * 0.12) / 0.9)) * -2.4;
			vis(sl.body, sl.body.material, 0.78 * rise);
			sl.body.material.emissive.setHex(on > 0.05 || r > 0.3 ? 0x0a2a1a : 0x03100a);
			sl.edge.material.opacity = (0.35 + 0.65 * Math.max(on, r)) * rise * dim; sl.edge.visible = sl.edge.material.opacity > 0.004;
			vis(sl.icon, sl.icon.material, (0.55 + 0.45 * Math.max(on, r)) * rise * dim);
			sl.halo.material.opacity = (0.15 + 0.6 * Math.max(on, r)) * rise * dim;
		});
	});
	// the gate: up before its stop, the curtain parting on the tap
	const gk = sm((t - TL.gateUp) / 0.8) * (1 - out);
	gate.posts.forEach((m) => { m.visible = gk > 0.01; }); gate.amb.opacity = gk;
	gate.curtMat.uniforms.a.value = gk; gate.curtMat.uniforms.t.value = t;
	gate.curtMat.uniforms.open.value = eo((t - TL.open) / 0.7);
	gate.burst.material.opacity = 0.9 * Math.exp(-Math.max(0, t - TL.open) * 3.5) * (t > TL.open ? 1 : 0);
	gate.lamp.material.opacity = 0.45 * gk * (1 + 0.25 * Math.sin(t * 3));
	// Gemini, its beams to the nine that think with it, each pulsing while its agent works
	const ok = sm((t - TL.orb) / 1.0) * (1 - out);
	gem.shellMat.uniforms.a.value = ok; gem.shellMat.uniforms.t.value = t; gem.star.material.opacity = 0.9 * ok; gem.halo.material.opacity = 0.45 * ok; gem.halo2.material.opacity = 0.22 * ok;
	gem.light.intensity = 18 * ok; gem.g.rotation.y = t * 0.12; gem.g.position.y = GEM.y + Math.sin(t * 0.9) * 0.12;
	let burst = 0;
	Object.entries(BEAMS).forEach(([id, b], i) => {
		const A = AGENTS[id]; const s = A.slab.stop;
		const draw = eo((t - TL.beams - i * 0.16) / 0.7);
		const work = fade(t, s.t0, s.t1 + 0.3, 0.3, 0.4);
		b.m.uniforms.prog.value = draw; b.m.uniforms.alpha.value = (0.22 + 0.78 * work) * ok * (A.dim ? 0.35 : 1);
		b.m.uniforms.pulse.value = work > 0.1 ? ((t * 0.9) % 1) : -1;
		burst = Math.max(burst, work);
	});
	gem.shellMat.uniforms.burst.value = burst;
	// the carton: on the road, bobbing; read at Verify; ringed red at Detect; gone into its streams at Decide
	const cpos = at(ru, RY + 0.62 + Math.sin(t * 1.7) * 0.03), ctan = tanAt(ru);
	carton.g.position.copy(cpos); carton.g.rotation.y = Math.atan2(ctan.x, ctan.z) + Math.PI / 2;
	const cin = sm((t - (STOPS[0].t0 - 2.4)) / 0.6), cout = 1 - sm((t - TL.split - 0.35) / 0.45);
	const ca = cin * cout;
	vis(carton.box, carton.kraft, ca); carton.face.opacity = ca; carton.edges.material.opacity = 0.5 * ca; carton.glow.material.opacity = 0.32 * ca;
	carton.g.scale.setScalar(Math.max(0.001, lerp(0.6, 1, cin) * lerp(0.3, 1, cout)));
	const sc = (t - TL.scan) / 1.5, sk = sc > 0 && sc < 1 ? Math.sin(Math.PI * sc) : 0;
	vis(carton.scan, carton.scan.material, 0.95 * sk); carton.scanGlow.material.opacity = 0.6 * sk; carton.scan.position.x = carton.scanGlow.position.x = lerp(-0.45, 0.45, clamp(sc));
	carton.risk.position.copy(at(ru, RY + 0.05)); const rk = fade(t, TL.risk, STOP.detect.t1 + 0.4, 0.3, 0.4);
	vis(carton.risk, carton.risk.material, rk * (0.6 + 0.4 * Math.sin(t * 6))); carton.risk.scale.setScalar(1 + 0.15 * Math.sin(t * 3));
	// the streams: out of the carton at Decide, along their lanes, a wait at the gate, then out to their exits
	const sp = streams.P, pos = streams.pos, al = streams.alpha;
	const gateU = STOP.approve.u - 0.012, exU = STOP.execute.u;
	for (let k = 0; k < sp.length; k++) {
		const q = sp[k];
		const born = TL.split + q.f * 0.6 + q.j * 0.08;
		if (t < born) { al[k] = 0; continue; }
		let u = Math.max(ru, STOP.decide.u) - q.f * 0.045 - q.j * 0.004;
		if (t < TL.open) u = Math.min(u, gateU - q.f * 0.03 - q.j * 0.004);
		u = Math.min(Math.max(u, STOP.decide.u - 0.01), exU + 0.015);
		const p = at(u, RY + 0.42 + q.j * 0.12).addScaledVector(leftAt(u), q.e.lane + (q.j - 0.5) * 0.12);
		const fan = clamp((t - TL.fan - q.f * 1.8 - q.j * 0.3 - (q.e.id === 'kirana' ? 0 : 0.6)) / 1.6);
		if (fan > 0) { const k2 = eio(fan); p.lerp(q.dest.clone().add(V(0, 0.15, 0)), k2); p.y += Math.sin(Math.PI * k2) * (q.e.id === 'staff' ? 4.0 : 2.4); }
		pos[3 * k] = p.x; pos[3 * k + 1] = p.y; pos[3 * k + 2] = p.z;
		al[k] = clamp((t - born) / 0.3) * (1 - out) * (fan >= 1 ? 0.0 : 1);
	}
	streams.g.attributes.position.needsUpdate = true; streams.g.attributes.al.needsUpdate = true;
	// the town's kiranas light as their packs arrive: 52 of the 58 order
	const tk = sm((t - TL.fan + 0.6) / 0.8) * (1 - out);
	townLights.m.uniforms.a.value = tk;
	for (let i = 0; i < 58; i++) townLights.lit[i] = i < 52 ? clamp((t - TL.fan - 1.0 - (i / 52) * 2.8) / 0.4) : 0;
	townLights.g.attributes.lit.needsUpdate = true;
	destGlow.staff.material.opacity = 0.8 * clamp((t - TL.fan - 2.0) / 0.5) * (1 - out);
	destGlow.foodbank.material.opacity = 0.8 * clamp((t - TL.fan - 2.2) / 0.5) * (1 - out);
	// Paperwork's papers: out of its slab, over the road, into a stack; a signature's glint on the last
	const ps = STOP.settle;
	const stackAt = ps.road.clone().addScaledVector(ps.left, ps.side * 0.95).setY(0.36);
	const slabFace = ps.base.clone().addScaledVector(ps.left, -ps.side * 0.25).setY(1.3);
	papers.list.forEach((pp_, i) => {
		const k = eio((t - TL.papers - i * 0.3) / 0.8);
		const p = slabFace.clone().lerp(stackAt.clone().add(V(0, i * 0.022, 0)), k); p.y += Math.sin(Math.PI * k) * 0.9;
		pp_.m.position.copy(p); pp_.m.rotation.set(-Math.PI / 2 * k, Math.atan2(ps.tan.x, ps.tan.z), (1 - k) * (i - 2) * 0.35);
		vis(pp_.m, pp_.m.material, (k > 0.001 ? 1 : 0) * (1 - out));
	});
	papers.glint.position.copy(stackAt).add(V(0.15, 0.25, 0));
	papers.glint.material.opacity = 0.9 * fade(t, TL.sign, TL.sign + 0.5, 0.12, 0.4);
	// the rails light from the godown dot to the pin; the money under its shield; a model's reach stopped at the glass
	const rk2 = eio((t - TL.rails) / 2.6) * (1 - sm((t - TL.markOn) / 1.0));
	RAILS.forEach((r) => { r.m.uniforms.prog.value = rk2; r.m.uniforms.alpha.value = rk2 > 0 ? 0.85 : 0; r.m.uniforms.pulse.value = rk2 >= 1 ? ((t * 0.5) % 1) : -1; });
	const mk = fade(t, TL.rails + 1.2, TL.rise2 + 0.6, 0.6, 0.8);
	coin.mats.forEach((m) => { m.opacity = mk; }); coin.d.visible = mk > 0.004; coin.d.rotation.z = t * 0.6;
	coin.shieldMat.uniforms.a.value = mk; coin.shieldMat.uniforms.t.value = t;
	const hit = t > TL.deny ? Math.exp(-(t - TL.deny) * 3.2) : 0;
	coin.shieldMat.uniforms.hit.value = hit; coin.flash.material.opacity = 0.9 * hit;
	reach.m.uniforms.prog.value = eo((t - TL.reach) / 0.9) * 0.84; reach.m.uniforms.alpha.value = fade(t, TL.reach, TL.deny + 0.5, 0.2, 0.5);
	// the end: the squircle drawn round the S, filled, the road widened and turned white: the mark
	mark.lm.uniforms.prog.value = eio((t - TL.rise2 - 0.2) / 1.8); mark.lm.uniforms.alpha.value = 0.9 * (1 - sm((t - TL.markOn) / 0.8));
	mark.fillMat.uniforms.a.value = sm((t - TL.markOn + 0.2) / 1.0); mark.fill.visible = mark.fillMat.uniforms.a.value > 0.004;
}

// ------------------------------------------------------------------ what lies over the picture at time t
const overlaps = (a, b) => a && b && a.x < b.x + b.w + 12 && b.x < a.x + a.w + 12 && a.y < b.y + b.h + 12 && b.y < a.y + a.h + 12;
function placeChip(c, t, out) {
	const A = c.A, s = A.slab.stop;
	const t0 = A.dim ? TL.dimTag - 0.15 : s.t0 + 0.25;
	const t1 = c.id === 'outreach' ? TL.exTown + 0.3 : s.t1 + 0.35;
	const work = fade(t, t0, t1, 0.3, 0.35);
	const watch = c.id === 'watcher' ? fade(t, TL.watch, TL.watch1, 0.25, 0.35) : 0;
	const a = Math.max(work, watch) * (1 - out);
	c.box = null; c.want = null;
	if (a <= 0.001 || !A.slab.top) return;
	const anchor = A.slab.top.getWorldPosition(V(0, 0, 0));
	const kc = calm(anchor); const p = shot(anchor);
	if (p.z > 1 || a * kc < 0.01) return;
	const w = c.el.offsetWidth, h = c.el.offsetHeight;
	const e = spring(t - (watch > work ? TL.watch : t0), 0.7, 13);
	c.want = { x: p.x - w / 2, y: p.y - 64 - h - 14 * (1 - e), w, h, p, op: a * kc };
}
// the chips that show at once are laid side by side, never on top of each other, each on a stem to its own agent
function layChips() {
	const live = Object.values(CHIPS).filter((c) => c.want);
	live.forEach((c) => { c.want.x = clamp(c.want.x, 48, W - 48 - c.want.w); c.want.y = clamp(c.want.y, 140, H - 150 - c.want.h); });
	live.sort((a, b) => a.want.x - b.want.x);
	for (let pass = 0; pass < 4; pass++) for (let i = 1; i < live.length; i++) {
		const a = live[i - 1].want, b = live[i].want;
		if (Math.abs(a.y - b.y) < Math.max(a.h, b.h) + 10 && b.x < a.x + a.w + 16) { const push = a.x + a.w + 16 - b.x; a.x -= push / 2; b.x += push / 2; }
	}
	live.forEach((c) => {
		const q = c.want; q.x = clamp(q.x, 48, W - 48 - q.w);
		c.el.style.transform = `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px)`; c.el.style.opacity = q.op.toFixed(3);
		c.stem.setAttribute('x1', (q.x + q.w / 2).toFixed(1)); c.stem.setAttribute('y1', (q.y + q.h).toFixed(1)); c.stem.setAttribute('x2', q.p.x.toFixed(1)); c.stem.setAttribute('y2', (q.p.y - 6).toFixed(1));
		c.stem.setAttribute('opacity', (0.9 * q.op).toFixed(3)); c.dot.setAttribute('cx', q.p.x.toFixed(1)); c.dot.setAttribute('cy', q.p.y.toFixed(1)); c.dot.setAttribute('opacity', q.op.toFixed(3));
		if (q.op > 0.2) c.box = { x: q.x, y: q.y, w: q.w, h: q.h };
	});
	Object.values(CHIPS).filter((c) => !c.want).forEach((c) => { c.el.style.opacity = 0; c.stem.setAttribute('opacity', 0); c.dot.setAttribute('opacity', 0); });
}
function placeCard(id, t, out) {
	const c = CARDS[id], s = STOP[id];
	const a = fade(t, s.say[0] + 0.15, id === 'execute' ? TL.exTown + 0.3 : s.t1 + 0.3, 0.3, 0.35) * (1 - out);
	if (a <= 0.001) { c.el.style.opacity = 0; c.pick = null; return; }
	const main = id === 'approve' ? CHIPS.you : id === 'execute' ? CHIPS.outreach : CHIPS[s.agents[0]];
	if (!main || !main.box) { c.el.style.opacity = 0; return; }
	const kc = calm(s.road);
	const b = main.box, w = c.el.offsetWidth, h = c.el.offsetHeight;
	// beside its chip, on the side with room and clear of the other chips; chosen once as it appears, then kept
	if (!c.pick) {
		const others = Object.values(CHIPS).filter((o) => o !== main && o.box).map((o) => o.box);
		const cands = [{ x: b.x + b.w + 26, y: b.y, side: 1 }, { x: b.x - w - 26, y: b.y, side: -1 }, { x: b.x + b.w / 2 - w / 2, y: b.y + b.h + 90, side: 0 }, { x: W - 70 - w, y: 170, side: 1 }];
		c.pick = cands.find((q) => q.x >= 40 && q.x + w <= W - 40 && !others.some((o) => overlaps({ x: q.x, y: q.y, w, h }, o))) || cands[0];
	}
	const q = c.pick;
	const x = clamp(q.side === 1 ? Math.max(q.x, b.x + b.w + 26) : q.side === -1 ? Math.min(q.x, b.x - w - 26) : b.x + b.w / 2 - w / 2, 40, W - 40 - w);
	const y = clamp(q.side === 0 ? b.y + b.h + 90 : b.y, 140, H - 150 - h);
	const e = spring(t - s.say[0] - 0.15, 0.72, 13);
	c.el.style.transform = `translate(${(x + q.side * -18 * (1 - e)).toFixed(1)}px, ${y.toFixed(1)}px)`; c.el.style.opacity = (a * kc).toFixed(3);
	c.rows.forEach((r, i) => { if (!r.querySelector('#yesbtn')) r.style.opacity = clamp((t - s.say[0] - 0.45 - i * 0.34) / 0.25).toFixed(3); });
	if (id === 'report') { document.getElementById('kg').textContent = (339.7 * eo((t - TL.ledger) / 1.6)).toFixed(1); }
	if (id === 'approve') {
		const btn = document.getElementById('yesbtn'); const tp = t - TL.tap;
		btn.style.transform = tp > 0 && tp < 0.25 ? `scale(${(1 - 0.06 * Math.sin(Math.PI * tp / 0.25)).toFixed(3)})` : '';
		btn.style.boxShadow = tp > 0 ? `0 0 ${(30 * Math.exp(-tp * 3)).toFixed(1)}px rgba(247,192,74,0.9)` : 'none';
		btn.textContent = tp > 0.2 ? 'Approved · the agents go to work' : 'Approve · release the agents';
	}
}
function overlay(t) {
	camAt(t - 1 / FPS, camPrev); camAt(t);
	const out = sm((t - TL.rise2) / 0.8);
	// chips first, so the cards can keep clear of them
	Object.values(CHIPS).forEach((c) => placeChip(c, t, out));
	layChips();
	Object.keys(CARDS).forEach((id) => placeCard(id, t, out));
	RULES.forEach((r) => {
		const a = fade(t, r.t0, TL.rise2, 0.3, 0.4); const p = shot(r.anchor); const kc = calm(r.anchor);
		if (a <= 0.001 || p.z > 1) { r.el.style.opacity = 0; return; }
		const w = r.el.offsetWidth, e = spring(t - r.t0, 0.7, 13);
		r.el.style.transform = `translate(${clamp(p.x - w / 2, 40, W - 40 - w).toFixed(1)}px, ${(p.y - 54 - 12 * (1 - e)).toFixed(1)}px)`; r.el.style.opacity = (a * kc).toFixed(3);
	});
	let shade = 0;
	TITLES.forEach((T) => { const a = fade(t, T.t0, T.t1, 0.3, 0.35); T.el.style.opacity = a.toFixed(3); shade = Math.max(shade, a); T.ws.forEach((w, i) => { const e = spring(t - T.t0 - 0.07 * i, 0.74, 14); w.style.transform = `translateY(${(110 * (1 - e)).toFixed(1)}%)`; }); });
	document.getElementById('shade').style.opacity = shade.toFixed(3);
	const ia = fade(t, STOPS[0].t0 - 0.6, TL.rails + 0.4, 0.4, 0.5); document.getElementById('idx').style.opacity = ia.toFixed(3);
	let cur = -1; STOPS.forEach((s, i) => { if (t >= s.t0 - 0.2 && t <= s.t1 + 0.6) cur = i; });
	IDX.forEach((it, i) => { it.el.className = 'ix' + (i === cur ? ' on' + (it.s.id === 'approve' ? ' amb' : '') : t > it.s.t1 ? ' done' : ''); });
	// the mark, crisp, over the 3D one as the camera arrives above it
	const ma = sm((t - TL.markOn - 0.5) / 0.7);
	if (ma > 0.001) {
		const cs = [V(-25.5, 0, -26.35), V(25.5, 0, -26.35), V(25.5, 0, 24.65), V(-25.5, 0, 24.65)].map(shot);
		const x0 = Math.min(...cs.map((p) => p.x)), x1 = Math.max(...cs.map((p) => p.x)), y0 = Math.min(...cs.map((p) => p.y)), y1 = Math.max(...cs.map((p) => p.y));
		const sz = ((x1 - x0) + (y1 - y0)) / 2 * (64 / 60);   // the squircle is 60 of the mark's 64 units
		const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
		MARK_SVG.style.width = MARK_SVG.style.height = `${sz.toFixed(1)}px`;
		MARK_SVG.style.transform = `translate(${(cx - sz / 2).toFixed(1)}px, ${(cy - sz / 2).toFixed(1)}px)`;
	}
	MARK_SVG.style.opacity = ma.toFixed(3);
}

// ------------------------------------------------------------------ the town's footage: each plate's frame for scene time t
const PLATE_AT = (t) => {
	// the godown yard for the first stops, the town for valuing and deciding, the kirana lanes from the yes on
	const k1 = sm((t - (STOP.verify.t1 + 0.2)) / 1.4), k2 = sm((t - (STOP.approve.t1 + 0.2)) / 1.4);
	if (k2 > 0) return [1, 2, k2];
	return [0, 1, k1];
};
async function plateFrame(P, tau) {
	if (!P.frames) return P.ok;
	const n2 = P.frames * 2 - 2;                               // ping-pong: a glide out and back reads as one drone's flight
	let i = Math.floor(Math.max(0, tau) * P.fps) % n2; if (i >= P.frames) i = n2 - i;
	if (i === P.n) return true;
	const im = await loadImg(`bg/${P.id}/${String(i + 1).padStart(5, '0')}.jpg`);
	if (im) { P.tex.image = im; P.tex.colorSpace = THREE.SRGBColorSpace; P.tex.needsUpdate = true; P.n = i; P.ok = true; }
	return P.ok;
}
async function loadBg(t) {
	const [a, b, k] = PLATE_AT(t);
	floorMat.uniforms.mapA.value = BG[a].tex; floorMat.uniforms.mapB.value = BG[b].tex; floorMat.uniforms.mixAB.value = k;
	floorMat.uniforms.hasA.value = (await plateFrame(BG[a], t)) ? 1 : 0;
	floorMat.uniforms.hasB.value = k > 0 ? ((await plateFrame(BG[b], t)) ? 1 : 0) : 0;
}

// ------------------------------------------------------------------ one frame: the shutter's sub-frames summed, then the lens
const PROBE = [V(0, 1, 0), V(-10, 0, -8), V(10, 0, 8), V(0, 6, 0), V(-8, 0, 10), V(8, 0, -10), V(0, GY, 0)];
function blurTaps(t) {
	camAt(t - SHUTTER / 2); const a = PROBE.map(shot);
	camAt(t + SHUTTER / 2); const b = PROBE.map(shot);
	let px = 0;
	for (let i = 0; i < PROBE.length; i++) if (a[i].z < 1 && b[i].z < 1) px = Math.max(px, Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y));
	return clamp(Math.ceil(px / 3), 1, 12);
}
window.renderAt = async (t) => {
	await loadBg(t);
	const n = blurTaps(t);
	const ac = renderer.autoClear;
	renderer.setRenderTarget(acc); renderer.setClearColor(0x000000, 1); renderer.clear();
	for (let i = 0; i < n; i++) {
		update(n === 1 ? t : t + SHUTTER * ((i + 0.5) / n - 0.5));
		composer.render();
		accQuad.material.uniforms.t.value = composer.readBuffer.texture; accQuad.material.uniforms.w.value = 1 / n;
		renderer.autoClear = false; renderer.setRenderTarget(acc); accQuad.render(renderer); renderer.autoClear = ac;
	}
	update(t);
	cine.material.uniforms.seed.value = (Math.floor(t * FPS) * 0.6180339) % 1;
	renderer.setRenderTarget(null); cine.render(renderer);
	overlay(t);
	return { taps: n };
};

// ------------------------------------------------------------------ build what needs its textures, then ready
(async () => {
	await Promise.all(Object.values(AGENTS).map(async (A) => { if (!A.slab || !A.slab.icon) return; const tx = await iconTex(A.icon); A.slab.icon.material.map = tx; A.slab.icon.material.needsUpdate = true; }));
	const label = await loadTex('label.webp');
	if (label) { carton.face.map = label; carton.face.needsUpdate = true; }
	for (const P of BG) {
		const meta = await fetch(`bg/${P.id}/meta.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
		if (meta) { P.frames = meta.frames; P.fps = meta.fps || 60; continue; }
		const still = await loadImg(`bg/${P.id}.jpg`);              // a plate's still, until its footage exists
		if (still) { P.tex.image = still; P.tex.colorSpace = THREE.SRGBColorSpace; P.tex.needsUpdate = true; P.ok = true; }
	}
	dof.collect(scene);
	await document.fonts.ready;
	window.setCues({});
	window.__dbg = { scene, camera, STOPS, AGENTS, SHOTS, TL, C: () => C, shotAt };
	window.pageReady = true;
})();
