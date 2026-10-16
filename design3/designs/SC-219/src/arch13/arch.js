// SC-219 (cut 13): under the hood, cut 10's film made whole. The same lit platform, lens and camera, now filling the frame
// (no letterbox): the act's title over the scene on its own shade, the words that matter marked in green, and the stack's
// parts in a glass dock along the foot. Every part the voice names comes with the application beside it, crisp in screen
// space: the app's own screens, captured at 2x from the live guided demo and the live sign-in, in a browser window or a
// phone, with what happens on them (a pointer that clicks, a finger that taps, text typed, rows arriving, a push landing),
// and a lead from the screen to the part along which the data travels (vig.js). Firebase Authentication has its own beat:
// Priya signs in, her ID token travels to the API on Cloud Run, which checks it and her role. Gemini is a glass orb with its
// own colours turning inside, its four-point spark at the centre, and its two models riding orbits round it.
// Nothing runs on its own clock: renderAt(t) draws scene time t (capture-page.mjs takes it frame by frame), and
// setCues(cues) takes the narration's word times and returns the scene's sounds ({events}) for the mix.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { Panels } from './vig.js';

const W = 1920, H = 1080, FPS = 25, SHUTTER = 0.5 / FPS;      // a 180-degree shutter
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const eo = (x) => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a, b, k) => a + (b - a) * k;
const fade = (t, a, b, fi = 0.35, fo = 0.35) => Math.min(clamp((t - a) / fi), b == null ? 1 : clamp((b - t) / fo));
const spring = (x, zeta = 0.6, w = 14) => { if (x <= 0) return 0; const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * x) * (Math.cos(wd * x) + zeta * w / wd * Math.sin(wd * x)); };
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const IC = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[n] || ''}</svg>`;
const $ = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// the design system's inks, in linear light; glows are the same inks pushed past white for the bloom
const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
const GREEN = 0x34d380, G3 = 0x73c99d, AMBER = 0xf7c04a, ORANGE = 0xff9f45, BLUE = 0x8ab4f8, VIOLET = 0xc58af9, CODE = 0xcfd8d3;

// ------------------------------------------------------------------ renderer, scene, camera
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NoToneMapping;            // ACES is the last pass's, after the frame's sub-frames are summed
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030605);
scene.fog = new THREE.FogExp2(0x030605, 0.016);
const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 600);

scene.add(new THREE.HemisphereLight(0x2a5a44, 0x020403, 0.55));
const key = new THREE.DirectionalLight(0xdff5ea, 1.1); key.position.set(-8, 22, 14); scene.add(key);
const rim = new THREE.DirectionalLight(0x8ab4f8, 0.35); rim.position.set(12, 4, -16); scene.add(rim);

// ------------------------------------------------------------------ the lens: depth of field, streaks, the summed shutter, the last pass
const QV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

// depth of field: the scene's own depth (glows and dust left out of it), then a single-pass gather with a growing spiral
// of taps, so out-of-focus lights open into discs (after Dennis Gustafsson's "Bokeh depth of field in a single pass")
class DOFPass extends Pass {
	constructor() {
		super();
		this.depthRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, format: THREE.RedFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
		this.depthMat = new THREE.ShaderMaterial({ side: THREE.DoubleSide,
			vertexShader: 'varying float vZ; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vZ = -mv.z; gl_Position = projectionMatrix * mv; }',
			fragmentShader: 'varying float vZ; void main(){ gl_FragColor = vec4(vZ, 0.0, 0.0, 1.0); }' });
		this.mat = new THREE.ShaderMaterial({
			uniforms: { tColor: { value: null }, tDepth: { value: this.depthRT.texture }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, focus: { value: 20 }, scale: { value: 0 }, maxBlur: { value: 15 } },
			vertexShader: QV,
			fragmentShader: `uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 px; uniform float focus; uniform float scale; uniform float maxBlur; varying vec2 vUv;
				const float GA = 2.39996323;
				float dep(vec2 uv){ float d = texture2D(tDepth, uv).r; return d < 0.01 ? 300.0 : d; }
				float blur(float d){ return abs(clamp((1.0 / focus - 1.0 / d) * scale, -1.0, 1.0)) * maxBlur; }
				void main(){
					float cd = dep(vUv); float cs = blur(cd);
					vec3 c = texture2D(tColor, vUv).rgb; float tot = 1.0; float r = 0.6;
					for (int i = 0; i < 260; i++) {
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
		this.quad = new FullScreenQuad(this.mat);
		this.hide = [];
	}
	collect(root) { this.hide = []; root.traverse((o) => { if (o.isSprite || o.isPoints || o.userData.nd) this.hide.push(o); }); }
	render(renderer, writeBuffer, readBuffer) {
		if (this.mat.uniforms.scale.value < 0.05) { this.needsSwap = false; return; }      // nothing out of focus: the frame goes on as it is
		this.needsSwap = true;
		const vis = this.hide.map((o) => o.visible); this.hide.forEach((o) => { o.visible = false; });
		const bg = scene.background; scene.background = null; scene.overrideMaterial = this.depthMat;
		renderer.setRenderTarget(this.depthRT); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
		scene.overrideMaterial = null; scene.background = bg;
		this.hide.forEach((o, i) => { o.visible = vis[i]; });
		this.mat.uniforms.tColor.value = readBuffer.texture;
		renderer.setRenderTarget(writeBuffer); this.quad.render(renderer);
	}
}

// anamorphic streaks: the brightest lights, drawn out sideways at a quarter of the size, then added back, cool
class StreakPass extends Pass {
	constructor() {
		super();
		const o = { type: THREE.HalfFloatType };
		this.a = new THREE.WebGLRenderTarget(W / 4, H / 4, o); this.b = this.a.clone();
		this.bright = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { t: { value: null }, th: { value: 2.6 }, px: { value: new THREE.Vector2(1 / W, 1 / H) } }, vertexShader: QV,
			fragmentShader: `uniform sampler2D t; uniform float th; uniform vec2 px; varying vec2 vUv;
				void main(){ vec3 c = vec3(0.0); for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) c += texture2D(t, vUv + vec2(float(i), float(j)) * px * 1.5).rgb; c /= 9.0;
				float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(th, th * 2.4, l), 1.0); }` }));
		this.blur = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { t: { value: null }, st: { value: 1 }, px: { value: 4 / W } }, vertexShader: QV,
			fragmentShader: `uniform sampler2D t; uniform float st; uniform float px; varying vec2 vUv;
				void main(){ vec3 c = vec3(0.0); float tw = 0.0; for (int i = -7; i <= 7; i++) { float w = exp(-float(i * i) / 18.0); c += texture2D(t, vUv + vec2(float(i) * st * px, 0.0)).rgb * w; tw += w; } gl_FragColor = vec4(c / tw, 1.0); }` }));
		this.comp = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tIn: { value: null }, tS: { value: null }, k: { value: 0.5 }, tint: { value: new THREE.Color(0.55, 0.72, 1.0) } }, vertexShader: QV,
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
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.7, 0.4, 1.0); composer.addPass(bloom);

// the shutter: a frame's sub-frames summed here, then ACES, the grade, the flare, the vignette and the grain
const acc = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const accQuad = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { t: { value: null }, w: { value: 1 } }, vertexShader: QV,
	fragmentShader: 'uniform sampler2D t; uniform float w; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(t, vUv).rgb * w, 1.0); }',
	blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, depthTest: false, depthWrite: false, transparent: true }));
const cine = new FullScreenQuad(new THREE.ShaderMaterial({
	uniforms: { t: { value: acc.texture }, seed: { value: 0 }, grain: { value: 0.03 }, vig: { value: 0.42 }, ca: { value: 0.006 }, flarePos: { value: new THREE.Vector2(0.5, 0.5) }, flare: { value: 0 }, exposure: { value: 1 }, lift: { value: 1 } },
	vertexShader: QV,
	fragmentShader: `uniform sampler2D t; uniform float seed; uniform float grain; uniform float vig; uniform float ca; uniform vec2 flarePos; uniform float flare; uniform float exposure; uniform float lift; varying vec2 vUv;
		vec3 fit(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
		vec3 aces(vec3 c){ const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
			const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
			c *= exposure / 0.6; c = I * c; c = fit(c); c = O * c; return clamp(c, 0.0, 1.0); }
		vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
		float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21) + seed); p += dot(p, p + 45.32); return fract(p.x * p.y); }
		void main(){
			vec2 d = vUv - 0.5; vec2 o = d * ca * dot(d, d) * 4.0;
			vec3 c = vec3(texture2D(t, vUv + o).r, texture2D(t, vUv).g, texture2D(t, vUv - o).b);
			if (flare > 0.001) {
				vec2 asp = vec2(1.7778, 1.0); vec2 ax = vec2(0.5) - flarePos;
				for (int i = 0; i < 5; i++) { float f = float(i); vec2 g = flarePos + ax * (0.55 + 0.42 * f) * 1.55; float r = 0.022 + 0.016 * mod(f * 7.0, 3.0);
					float dd = length((vUv - g) * asp); float disc = smoothstep(r, r * 0.55, dd) * 0.10 + exp(-dd * dd / (r * r * 0.5)) * 0.05;
					c += mix(vec3(0.5, 0.62, 1.0), vec3(0.82, 0.58, 1.0), mod(f, 2.0)) * disc * flare; }
				float dl = length((vUv - flarePos) * asp); c += vec3(0.72, 0.8, 1.0) * exp(-dl * 7.0) * 0.22 * flare;
			}
			c = srgb(aces(c));
			float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
			c += (vec3(-0.006, 0.010, 0.016) * (1.0 - l) + vec3(0.014, 0.005, -0.012) * l) * lift;
			c = mix(vec3(l), c, 1.05);
			float v = smoothstep(0.95, 0.30, length(d * vec2(1.0, 0.86)));
			c *= mix(1.0 - vig, 1.0, v);
			float n = hash(vUv * vec2(1920.0, 1080.0)) - 0.5;
			c += n * grain * (0.55 + 0.45 * (1.0 - abs(l - 0.45) * 2.0));
			gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
		}`,
	depthTest: false, depthWrite: false,
}));

// ------------------------------------------------------------------ textures: soft glows, Gemini's spark, icons
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
		img.onload = () => res(canvasTex(256, (g) => g.drawImage(img, 0, 0, 256, 256)));
		img.onerror = () => res(canvasTex(256, () => {}));
		img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
	});
}
const loadTex = (src) => new Promise((res) => new THREE.TextureLoader().load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, () => res(null)));

// ------------------------------------------------------------------ materials
const glass = (tint = 0x0c1511, op = 0.9) => new THREE.MeshStandardMaterial({ color: tint, metalness: 0.35, roughness: 0.28, transparent: true, opacity: op, emissive: 0x020504, depthWrite: false });
const edgeMat = (c, k = 2.2) => new THREE.LineBasicMaterial({ color: col(c, k), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
const glowSprite = (c, k, size) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: col(c, k), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); s.scale.setScalar(size); return s; };
const nd = (o) => { o.userData.nd = true; return o; };       // left out of the depth the focus reads
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
world.add(new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), new THREE.ShaderMaterial({
	side: THREE.BackSide, depthWrite: false, fog: false,
	uniforms: { top: { value: new THREE.Color(0x0b2419) }, mid: { value: new THREE.Color(0x050d09) }, bot: { value: new THREE.Color(0x010201) } },
	vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
	fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.8, h)) : mix(mid, bot, smoothstep(0.0, 0.5, -h)); gl_FragColor = vec4(c, 1.0); }',
})));
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
const mirror = nd(new Reflector(new THREE.CircleGeometry(34, 96), { clipBias: 0.003, textureWidth: 1280, textureHeight: 720, color: 0x24302b }));
mirror.rotation.x = -Math.PI / 2; mirror.position.y = FLOOR_Y - 0.02; world.add(mirror);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR_Y; floor.renderOrder = -10; world.add(floor);
const SHAFTS = [[-7.0, -3.5, 0.075, 5.5], [1.5, -5.0, 0.06, 7.0], [8.5, -3.0, 0.05, 5.0]].map(([x, z, a, w]) => {
	const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
		uniforms: { a: { value: 0 }, color: { value: col(0xbfe9d2, 0.7) } },
		vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
		fragmentShader: 'uniform float a; uniform vec3 color; varying vec2 vUv; void main(){ float wdt = mix(0.18, 0.42, 1.0 - vUv.y); float h = exp(-((vUv.x - 0.5) * (vUv.x - 0.5)) / (2.0 * wdt * wdt * 0.25)); float v = smoothstep(0.0, 0.5, vUv.y) * (1.0 - smoothstep(0.8, 1.0, vUv.y)); gl_FragColor = vec4(color, a * v * h); }' });
	const c = nd(new THREE.Mesh(new THREE.PlaneGeometry(w, 32), m)); c.position.set(x, 8, z); c.renderOrder = -5; world.add(c); return { c, m, a, x, z };
});
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
	world.add(new THREE.Points(g, m)); return m;
})();
const scanMat = new THREE.ShaderMaterial({
	transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
	uniforms: { a: { value: 0 }, color: { value: col(GREEN, 1.3) } },
	vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
	fragmentShader: 'float sq(float x){ return x * x; } uniform float a; uniform vec3 color; varying vec2 vUv; void main(){ float r = length(vUv - 0.5) * 2.0; float ring = exp(-sq((r - 0.94) * 22.0)); float fill = (1.0 - smoothstep(0.0, 1.0, r)) * 0.025; gl_FragColor = vec4(color, (ring * 0.75 + fill) * a); }',
});
const scan = nd(new THREE.Mesh(new THREE.CircleGeometry(16, 96), scanMat)); scan.rotation.x = -Math.PI / 2; world.add(scan);

// ------------------------------------------------------------------ the parts
const PARTS = {};
function slab(name, w, h, d, pos, c, opts = {}) {
	const g = new THREE.Group(); g.position.copy(pos); world.add(g);
	const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(w, h, d) * (opts.r ?? 0.18)), glass(opts.tint, opts.op)); g.add(body);
	const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w * 1.004, h * 1.004, d * 1.004)), edgeMat(c, opts.k ?? 2.4)); g.add(e);
	const halo = glowSprite(c, 0.9, Math.min(Math.max(w, h) * 2.0, 8)); g.add(halo);
	const P = { name, g, body, edges: [e], halo, c, t0: 1e9, lit: 1e9, pulses: [], dimK: 1 };
	PARTS[name] = P; return P;
}
const APPS_Y = 8.0, DECK_Y = 6.35;
const APPS = [
	{ id: 'landing', x: -7.65, b: 'Landing page', s: 'smartclearance.web.app', icon: 'globe' },
	{ id: 'console', x: -2.55, b: 'Console', s: 'staff set every brand up', icon: 'layout-dashboard' },
	{ id: 'workspace', x: 2.55, b: 'Workspace', s: 'one per brand · an installable app', icon: 'smartphone' },
	{ id: 'demo', x: 7.65, b: 'Guided demo', s: 'no sign-in needed', icon: 'play' },
];
const deck = slab('deck', 21.5, 0.16, 4.4, V(0, DECK_Y, 0), ORANGE, { k: 1.15, op: 0.3, r: 0.4 }); deck.thin = true; deck.halo.visible = false;
const API_Y = 3.1;
const api = slab('api', 5.4, 1.5, 2.7, V(0, API_Y, 0), GREEN, { k: 2.6 });
const apiCore = nd(new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.08, 2.0), new THREE.MeshBasicMaterial({ color: col(GREEN, 3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
apiCore.position.y = 0.05; api.g.add(apiCore);
const RACK = Array.from({ length: 5 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.07), new THREE.MeshBasicMaterial({ color: col(GREEN, 2.2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.position.set(0, -0.48 + i * 0.24, 1.36); api.g.add(m); return m; });
const LEDS = Array.from({ length: 18 }, (_, i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), new THREE.MeshBasicMaterial({ color: col(i % 4 === 0 ? BLUE : GREEN, 3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.position.set(-2.3 + (i % 9) * 0.12, -0.36 + Math.floor(i / 9) * 0.48, 1.37); api.g.add(m); return { m, ph: R() * 6.28, sp: 2 + R() * 5 }; });
const sec = slab('sec', 2.0, 1.15, 1.5, V(-7.0, API_Y - 0.05, 0.4), BLUE, { k: 2.2 });
// Firebase Authentication: where every sign-in starts, at the deck's end beside the apps
const AUTH = V(-12.4, DECK_Y + 0.25, 0.9);
const authP = slab('auth', 1.8, 1.15, 1.2, AUTH, ORANGE, { k: 2.4 });
const sql = (() => {
	const g = new THREE.Group(); g.position.set(7.0, API_Y - 0.55, 0.3); world.add(g);
	const P = { name: 'sql', g, edges: [], halo: glowSprite(GREEN, 0.9, 5), c: GREEN, t0: 1e9, lit: 1e9, pulses: [], dimK: 1 };
	g.add(P.halo); P.halo.position.y = 0.6;
	for (let i = 0; i < 3; i++) {
		const cy = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.42, 64), glass(0x0c1511, 0.92)); cy.position.y = i * 0.55; g.add(cy);
		const ring = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(1.16, 1.16, 0.42, 64), 30), edgeMat(GREEN, 2.4)); ring.position.y = i * 0.55; g.add(ring); P.edges.push(ring);
	}
	PARTS.sql = P; return P;
})();
const BUS_Y = 0.55, BUS_R = 7.3;
const bus = (() => {
	const g = new THREE.Group(); g.position.y = BUS_Y; world.add(g);
	const core = new THREE.Mesh(new THREE.TorusGeometry(BUS_R, 0.055, 12, 256), new THREE.MeshBasicMaterial({ color: col(GREEN, 2.8), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
	const halo = nd(new THREE.Mesh(new THREE.TorusGeometry(BUS_R, 0.28, 12, 256), new THREE.MeshBasicMaterial({ color: col(GREEN, 0.5), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
	core.rotation.x = halo.rotation.x = Math.PI / 2; g.add(core); g.add(halo);
	const pk = Array.from({ length: 14 }, (_, i) => { const s = glowSprite(i % 5 === 2 ? BLUE : GREEN, 3, 0.85); g.add(s); return { s, ph: i / 14 + R() * 0.03, sp: 0.045 + R() * 0.02 }; });
	// a light that races once round the ring as it ignites
	const racer = glowSprite(0xe8fff2, 4, 1.6); g.add(racer);
	return { g, core, halo, pk, racer, t0: 1e9, dimK: 1 };
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
	return { g, face, ring, ticks, hand, halo, t0: 1e9, dimK: 1 };
})();
// the agents, on an arc behind the heart: nine on Gemini, and the Watcher, plain code
const AG_Y = -2.5, AG_R = 8.2;
const AGENTS = [
	{ id: 'data', name: 'Data', icon: 'database', tier: 'flash' }, { id: 'watcher', name: 'Watcher', icon: 'braces', tier: 'code' },
	{ id: 'vision', name: 'Vision', icon: 'scan-line', tier: 'flash' }, { id: 'valuer', name: 'Valuer', icon: 'scale', tier: 'pro' },
	{ id: 'router', name: 'Router', icon: 'route', tier: 'pro' }, { id: 'outreach', name: 'Outreach', icon: 'send', tier: 'flash' },
	{ id: 'lister', name: 'Lister', icon: 'store', tier: 'flash' }, { id: 'negotiator', name: 'Negotiator', icon: 'gavel', tier: 'pro' },
	{ id: 'paperwork', name: 'Paperwork', icon: 'file-text', tier: 'flash' }, { id: 'impact', name: 'Impact', icon: 'leaf', tier: 'flash' },
];
const TIER_C = { pro: VIOLET, flash: BLUE, code: CODE };
AGENTS.forEach((a, i) => {
	const ang = Math.PI * (1.12 + 0.76 * (i / 9));
	a.pos = V(Math.cos(ang) * AG_R, AG_Y, Math.sin(ang) * AG_R * 0.62 - 1.2);
	const code = a.tier === 'code';
	const P = slab('ag-' + a.id, 1.45, 1.0, 0.6, a.pos, code ? CODE : GREEN, { k: code ? 1.5 : 2.4, r: 0.22, tint: code ? 0x111614 : undefined });
	P.g.lookAt(V(0, AG_Y, 14));
	a.P = P; a.t0 = 1e9; a.tierT = 1e9; a.ai = !code;
});
const AG = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
const DATA_Y = -4.9;
const bq = (() => {
	const g = new THREE.Group(); g.position.set(-5.6, DATA_Y, 4.2); world.add(g);
	const P = { name: 'bq', g, edges: [], halo: glowSprite(BLUE, 0.9, 5.5), c: BLUE, t0: 1e9, lit: 1e9, pulses: [], dimK: 1 };
	g.add(P.halo); P.halo.position.y = 0.6;
	for (let i = 0; i < 4; i++) {
		const m = new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.22, 1.8, 3, 0.08), glass(0x0b1420, 0.9)); m.position.y = i * 0.34; g.add(m);
		const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.61, 0.22, 1.81)), edgeMat(BLUE, 2.4)); e.position.y = i * 0.34; g.add(e); P.edges.push(e);
	}
	PARTS.bq = P; return P;
})();
const gcs = (() => {
	const g = new THREE.Group(); g.position.set(5.6, DATA_Y, 4.2); world.add(g);
	const P = { name: 'gcs', g, edges: [], halo: glowSprite(BLUE, 0.9, 5.5), c: BLUE, t0: 1e9, lit: 1e9, pulses: [], dimK: 1 };
	g.add(P.halo); P.halo.position.y = 0.6;
	const m = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 0.95, 1.3, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0x0b1420, metalness: 0.4, roughness: 0.3, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })); m.position.y = 0.65; g.add(m);
	const lip = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(1.26, 0.96, 1.3, 64, 1, true), 30), edgeMat(BLUE, 2.4)); lip.position.y = 0.65; g.add(lip); P.edges.push(lip);
	PARTS.gcs = P; return P;
})();
// the heart: Gemini, on Google's Agent Platform. A glass orb with Gemini's blue, violet and rose turning slowly inside it
// (kept under the bloom's threshold, so it glows and never burns out), a bright rim, a glass highlight, its four-point
// spark crisp at the centre, a disc of fine motes, and its two models on their own orbits: Pro in violet, Flash in blue.
const GEM = V(0, -1.35, 1.4);
const STAR = canvasTex(1024, (g, s) => {
	g.translate(s / 2, s / 2);
	const r = s * 0.47, k = 0.13;
	const star = () => { g.beginPath(); g.moveTo(0, -r);
		for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 2, b = a + Math.PI / 2, m = a + Math.PI / 4;
			g.quadraticCurveTo(Math.cos(m) * r * k, Math.sin(m) * r * k, Math.cos(b) * r, Math.sin(b) * r); }
		g.closePath(); };
	const gr = g.createLinearGradient(-r * 0.8, r * 0.8, r * 0.8, -r * 0.8);
	gr.addColorStop(0, '#4f8ff7'); gr.addColorStop(0.48, '#9b72cb'); gr.addColorStop(1, '#e07583');
	g.fillStyle = gr; star(); g.fill();
	const hi = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.55);
	hi.addColorStop(0, 'rgba(255,255,255,0.9)'); hi.addColorStop(0.3, 'rgba(255,255,255,0.35)'); hi.addColorStop(1, 'rgba(255,255,255,0)');
	g.globalCompositeOperation = 'source-atop'; g.fillStyle = hi; g.fillRect(-r, -r, 2 * r, 2 * r);
});
const gem = (() => {
	const g = new THREE.Group(); g.position.copy(GEM); world.add(g);
	const shellMat = new THREE.ShaderMaterial({
		transparent: true, depthWrite: false, toneMapped: false,
		uniforms: { a: { value: 0 }, t: { value: 0 }, burst: { value: 0 }, c1: { value: new THREE.Color(0x4285f4) }, c2: { value: new THREE.Color(0x9b72cb) }, c3: { value: new THREE.Color(0xd96570) } },
		vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
		fragmentShader: `uniform float a; uniform float t; uniform float burst; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3; varying vec3 vN; varying vec3 vV; varying vec3 vP;
			void main(){
				float f0 = 1.0 - clamp(dot(vN, vV), 0.0, 1.0); float f = f0 * f0 * sqrt(f0 + 1e-6);     // no pow() here: on Metal it turned a pixel NaN, and the bloom spread it
				vec3 p = vP * 2.3; float an = t * 0.32; p.xz = mat2(cos(an), -sin(an), sin(an), cos(an)) * p.xz;
				float w1 = sin(p.x * 1.7 + sin(p.y * 2.3 + t * 0.6) * 1.4 + t * 0.4);
				float w2 = sin(p.y * 2.1 + sin(p.z * 1.9 - t * 0.5) * 1.6 - t * 0.3);
				float n = 0.5 + 0.5 * sin(p.z * 1.5 + w1 * 1.3 + w2 * 0.9);
				float band = 0.5 + 0.5 * sin((vP.y + w1 * 0.22) * 4.2 + t * 0.7);
				vec3 col = mix(c1, c2, smoothstep(0.12, 0.88, n));
				col = mix(col, c3, smoothstep(0.6, 1.0, band) * 0.55);
				float inner = 0.30 + 0.36 * n;
				vec3 rim = mix(c1, c2, 0.5 + 0.5 * vN.y) * f * 1.3;
				vec3 L = normalize(vec3(-0.45, 0.65, 0.6)); float spec = clamp(dot(reflect(-vV, vN), L), 0.0, 1.0); spec *= spec; spec *= spec; spec *= spec; spec *= spec; spec *= spec;
				vec3 c = col * inner * (1.0 + 0.55 * burst) + rim + vec3(spec) * 0.85;
				gl_FragColor = vec4(c * a, a * clamp(0.8 + 0.2 * f + 0.3 * spec, 0.0, 1.0)); }`,
	});
	const shell = new THREE.Mesh(new THREE.SphereGeometry(0.95, 96, 64), shellMat); shell.renderOrder = 5; g.add(shell);
	const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: STAR, color: col(0xffffff, 1.05), transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); star.scale.setScalar(1.25); star.renderOrder = 6; g.add(star);
	const halo = glowSprite(VIOLET, 0.6, 5.0); g.add(halo);
	const halo2 = glowSprite(BLUE, 0.45, 9); g.add(halo2);
	// the disc of motes, turning faster near the orb
	const n = 640, pos = new Float32Array(n * 3), seed = new Float32Array(n);
	for (let i = 0; i < n; i++) { const r = 1.25 + Math.pow(R(), 0.7) * 1.6, an = R() * Math.PI * 2; pos[3 * i] = Math.cos(an) * r; pos[3 * i + 1] = (R() - 0.5) * 0.18 * r; pos[3 * i + 2] = Math.sin(an) * r; seed[i] = R(); }
	const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
	const moteMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
		uniforms: { t: { value: 0 }, a: { value: 0 }, map: { value: GLOW }, c1: { value: col(0x8ab4f8, 1.6) }, c2: { value: col(0xc58af9, 1.6) } },
		vertexShader: `uniform float t; attribute float seed; varying float vS; void main(){ vec3 p = position; float r = length(p.xz); float an = t * (0.9 / r) + seed * 0.2;
			p.xz = mat2(cos(an), -sin(an), sin(an), cos(an)) * p.xz; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = (1.6 + seed * 3.2) * (9.0 / -mv.z); vS = seed; gl_Position = projectionMatrix * mv; }`,
		fragmentShader: 'uniform sampler2D map; uniform float a; uniform vec3 c1; uniform vec3 c2; varying float vS; void main(){ float m = texture2D(map, gl_PointCoord).a; gl_FragColor = vec4(mix(c1, c2, vS) * m, m * a * (0.35 + 0.65 * vS)); }' });
	const disc = nd(new THREE.Points(pg, moteMat)); disc.rotation.set(0.32, 0, -0.18); g.add(disc);
	// the two models' orbits, each with its satellite
	const orbit = (R_, rx, rz, c, ph) => {
		const o = new THREE.Group(); o.rotation.set(rx, 0, rz); g.add(o);
		const ring = nd(new THREE.Mesh(new THREE.TorusGeometry(R_, 0.008, 8, 256), new THREE.MeshBasicMaterial({ color: col(c, 1.5), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
		o.add(ring);
		const sat = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 16), new THREE.MeshBasicMaterial({ color: col(c, 1.4), transparent: true, opacity: 0, toneMapped: false })); o.add(sat);
		const glow = glowSprite(c, 1.2, 1.0); sat.add(glow);
		return { o, ring, sat, glow, R: R_, ph, c };
	};
	const pro = orbit(1.62, 1.22, 0.38, VIOLET, 0.6), flash = orbit(2.02, 1.42, -0.46, BLUE, 3.4);
	const light = new THREE.PointLight(0xa58cff, 0, 22, 1.6); g.add(light);
	return { g, shell, shellMat, star, halo, halo2, disc, moteMat, pro, flash, light, t0: 1e9, proT: 1e9, flashT: 1e9, dimK: 1 };
})();
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
const shield = nd(new THREE.Mesh(new THREE.CircleGeometry(6.2, 96), shieldMat)); shield.rotation.x = -Math.PI / 2; shield.position.y = SHIELD_Y; world.add(shield);
// where a model reaching for the money meets the shield: a flash and a ring on the glass
const denyFx = (() => { const s_ = glowSprite(AMBER, 2.2, 1.2); s_.position.set(0, SHIELD_Y + 0.05, 1.4); world.add(s_);
	const r_ = nd(new THREE.Mesh(new THREE.TorusGeometry(1, 0.025, 8, 128), new THREE.MeshBasicMaterial({ color: col(AMBER, 2.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
	r_.rotation.x = Math.PI / 2; r_.position.set(0, SHIELD_Y + 0.02, 1.4); world.add(r_); return { s: s_, r: r_ }; })();
const BASE = [
	{ id: 'build', b: 'Cloud Build', s: 'every merge, deployed keyless', icon: 'git-branch', a: 0.62 },
	{ id: 'reg', b: 'Artifact Registry', s: 'the API and agent images', icon: 'box', a: 0.86 },
	{ id: 'mon', b: 'Cloud Monitoring', s: 'uptime, alerts, the budget', icon: 'bell', a: 0.14 },
	{ id: 'obs', b: 'Cloud Trace · Logging', s: 'every request, end to end', icon: 'activity', a: 0.38 },
];
BASE.forEach((b) => { const ang = Math.PI * b.a; b.pos = V(Math.cos(ang) * 12.5, FLOOR_Y + 0.35, Math.sin(ang) * 9 + 1.5); b.halo = glowSprite(BLUE, 1.2, 2.2); b.halo.position.copy(b.pos); world.add(b.halo); });

// ------------------------------------------------------------------ the light on the part the voice names: a shaft from above, a pool, a pulse
const coneMat = (c) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
	uniforms: { a: { value: 0 }, color: { value: col(c, 1.0) } },
	vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
	fragmentShader: 'uniform float a; uniform vec3 color; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float e = pow(clamp(abs(dot(vN, vV)), 0.0, 1.0), 1.6); float along = pow(clamp(vUv.y, 0.0, 1.0), 1.3); gl_FragColor = vec4(color, a * e * (0.1 + 0.9 * along) * 0.32); }' });
function spot(pos, r, h, c = 0xd8ffe9) {
	const g = new THREE.Group(); g.position.copy(pos); world.add(g);
	const geo = new THREE.CylinderGeometry(0.18, r, h, 64, 1, true); geo.translate(0, -h / 2, 0);
	const cone = nd(new THREE.Mesh(geo, coneMat(c))); cone.position.y = h; g.add(cone);
	const pool = nd(new THREE.Mesh(new THREE.CircleGeometry(r * 1.15, 64), new THREE.MeshBasicMaterial({ map: GLOW, color: col(c, 0.9), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
	pool.rotation.x = -Math.PI / 2; pool.position.y = 0.02; g.add(pool);
	const ring = nd(new THREE.Mesh(new THREE.TorusGeometry(1, 0.011, 8, 200), new THREE.MeshBasicMaterial({ color: col(c, 1.5), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
	ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; g.add(ring);
	return { g, cone, pool, ring, r };
}

// ------------------------------------------------------------------ the lines between them
const BEAMS = {};
function beam(id, pts, c, r = 0.035, k = 2.6) {
	const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
	const m = beamMat(c, k);
	const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, r * 0.62, 8, false), m); world.add(mesh);
	BEAMS[id] = { id, curve, m, mesh, t0: 1e9, dur: 0.7, pk: [] };
	return BEAMS[id];
}
APPS.forEach((a) => beam('req-' + a.id, [V(a.x, DECK_Y - 0.15, 0.6), V(a.x * 0.6, (DECK_Y + API_Y) / 2 + 0.5, 1.0), V(a.x * 0.16, API_Y + 0.8, 0.6)], GREEN, 0.035));
beam('sql', [V(2.75, API_Y - 0.1, 0.4), V(4.6, API_Y + 0.25, 0.7), V(5.85, API_Y - 0.05, 0.5)], GREEN, 0.045);
beam('sec', [V(-5.95, API_Y, 0.5), V(-4.4, API_Y + 0.25, 0.7), V(-2.75, API_Y, 0.5)], BLUE, 0.035);
beam('auth', [AUTH.clone().add(V(0.4, -0.55, 0.3)), V(-7.6, (DECK_Y + API_Y) / 2 + 0.4, 1.6), V(-2.8, API_Y + 0.5, 0.9)], AMBER, 0.04, 3.0);
beam('pub', [V(0, API_Y - 0.8, 0.6), V(0.4, (API_Y + BUS_Y) / 2, 2.5), V(0, BUS_Y + 0.05, BUS_R)], GREEN, 0.045);
beam('tick', [V(clock.g.position.x + 0.6, BUS_Y + 0.9, clock.g.position.z), V(-3.5, API_Y - 0.6, -0.6), V(-2.6, API_Y - 0.4, 0)], BLUE, 0.03);
AGENTS.forEach((a) => {
	const top = a.pos.clone().add(V(0, 0.55, 0));
	const ang = Math.atan2(a.pos.z, a.pos.x);
	const onBus = V(Math.cos(ang) * BUS_R, BUS_Y, Math.sin(ang) * BUS_R);
	beam('drop-' + a.id, [onBus, onBus.clone().lerp(top, 0.5).add(V(0, 0.3, 0)), top], a.ai ? GREEN : CODE, 0.03, a.ai ? 2.6 : 1.6);
	if (a.ai) {
		const front = a.pos.clone().add(V(0, -0.1, 0.35));
		beam('gem-' + a.id, [GEM.clone().add(V(0, 0.1, 0)), GEM.clone().lerp(front, 0.5).add(V(0, 1.1, 0)), front], TIER_C[a.tier], 0.04, 3.0);
	}
});
const bqTop = bq.g.position.clone().add(V(0, 1.35, 0)), gcsTop = gcs.g.position.clone().add(V(0, 1.45, 0));
beam('bq-watcher', [bqTop, bqTop.clone().lerp(AG.watcher.pos, 0.5).add(V(0, 1.6, 0)), AG.watcher.pos.clone().add(V(0, -0.6, 0.3))], BLUE, 0.04);
beam('bq-valuer', [bqTop.clone().add(V(0.4, 0, 0)), bqTop.clone().lerp(AG.valuer.pos, 0.5).add(V(0, 1.8, 0)), AG.valuer.pos.clone().add(V(0, -0.6, 0.3))], BLUE, 0.04);
beam('gcs-vision', [gcsTop, gcsTop.clone().lerp(AG.vision.pos, 0.5).add(V(0, 2.6, 0)), AG.vision.pos.clone().add(V(0, -0.6, 0.3))], BLUE, 0.04);
const photo = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.94), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
world.add(photo);
const panels = [];

// the light on each part as it is named
const SPOT = {
	run: spot(V(0, API_Y - 0.85, 0.2), 3.4, 9), sql: spot(V(7.0, API_Y - 0.6, 0.3), 2.2, 8), sched: spot(V(clock.g.position.x, BUS_Y - 1.0, clock.g.position.z), 1.6, 7, 0xd6e5ff),
	bq: spot(V(-5.6, DATA_Y - 0.05, 4.2), 2.3, 9, 0xd6e5ff), gcs: spot(V(5.6, DATA_Y - 0.05, 4.2), 2.0, 9, 0xd6e5ff), gemini: spot(V(0, GEM.y - 1.1, GEM.z), 2.0, 8, 0xe6dcff),
	figure: spot(V(0, API_Y - 0.85, 0.2), 3.4, 9, 0xfff0cc), auth: spot(V(AUTH.x, AUTH.y - 0.6, AUTH.z), 1.7, 7, 0xffe2c4),
};

// ------------------------------------------------------------------ what is laid over the scene
const labelsEl = document.getElementById('labels'), ui = document.getElementById('ui'), leadEl = document.getElementById('lead');
const LABELS = [];
function label(html, anchor, opts = {}) {
	const el = $(html); labelsEl.appendChild(el);
	const L = { el, anchor, dx: opts.dx || 0, dy: opts.dy || 0, align: opts.align || 'c', t0: 1e9, t1: 1e9, k: opts.k ?? 1, min: opts.min ?? 0.66, max: opts.max ?? 1.08, ref: opts.ref ?? 22, part: opts.part || null };
	LABELS.push(L); return L;
}
const node = (icon, b, s, cls = '') => `<div class="node ${cls}"><div class="tile">${IC(icon)}</div><div><b>${b}</b>${s ? `<span>${s}</span>` : ''}</div></div>`;
const LB = {
	gcloud: label(`<div class="pill big blue">${IC('cloud')}Google Cloud · asia-south1, Mumbai</div>`, V(-11.6, FLOOR_Y + 0.6, -5.5), { align: 'l', ref: 30, min: 0.9 }),
	sec: label(node('key', 'Secret Manager', 'every secret, only there', 'gcp'), V(-7.0, API_Y + 0.6, 0.4), { dy: -40, part: sec }),
	auth: label(node('fingerprint', 'Firebase Authentication', 'email and password · one user pool', 'fire'), AUTH.clone().add(V(0, 0.95, 0)), { dy: -26, part: authP, min: 0.8 }),
	idok: label(`<div class="node ok"><div class="tile">${IC('shield-check')}</div><div><b>verify_id_token ✓</b><span>Priya Deshmukh · role ws-operator</span></div></div>`, V(0, API_Y + 0.95, 0.6), { dy: -34, part: api, min: 0.85 }),
};
APPS.forEach((a) => { a.label = label(node(a.icon, a.b, a.s, ''), V(a.x, APPS_Y + 1.45, 0), { dy: -28, part: deck }); });
AGENTS.forEach((a) => {
	const tierHtml = a.tier === 'pro' ? `${IC('sparkles')}Gemini 3.1 Pro` : a.tier === 'flash' ? `${IC('zap')}Gemini 3.8 Flash` : `${IC('braces')}plain code · no model`;
	a.label = label(`<div class="agent"><b>${a.name}</b><div class="tier ${a.tier === 'code' ? 'rules' : a.tier}">${tierHtml}</div></div>`, a.pos.clone().add(V(0, -0.62, 0.3)), { dy: 8, part: a.P });
	a.tierEl = a.label.el.querySelector('.tier');
});
BASE.forEach((b) => { b.label = label(node(b.icon, b.b, b.s, 'gcp'), b.pos, { dy: -6 }); });
const TOPICS = ['batch.at_risk', 'journey.step', 'offer.received', 'deal.closed', 'notify'].map((name, i) => {
	const L = label(`<div class="topic">${name}</div>`, V(0, 0, 0), { part: bus }); L.ang = Math.PI * (0.18 + i * 0.16); return L;
});
// Gemini's two models, riding their orbits
const SATS = {
	pro: label(`<div class="sat pro">${IC('sparkles')}Gemini 3.1 Pro</div>`, V(0, 0, 0), { dy: -34, ref: 6, min: 0.85, max: 1.1 }),
	flash: label(`<div class="sat flash">${IC('zap')}Gemini 3.8 Flash</div>`, V(0, 0, 0), { dy: -34, ref: 6, min: 0.85, max: 1.1 }),
};

// the parts the voice names, in turn: the light on each, the rest dimmed, its place in the dock
const HEROES = Object.fromEntries(['firebase', 'auth', 'run', 'sql', 'pubsub', 'sched', 'agents', 'bq', 'gcs', 'gemini', 'pro', 'flash', 'shield', 'figure', 'yes'].map((id) => [id, { id, t0: 1e9, t1: 1e9 }]));
// the act's title over the scene: the words rise, then the words that matter are marked in green
const ACTS = [
	{ k: 'Under the hood', n: '1 / 3', h: 'All on [Google Cloud].' },
	{ k: 'The agents', n: '2 / 3', h: '[Nine AI agents]. Two Gemini models.' },
	{ k: 'Guardrails', n: '3 / 3', h: 'The models never touch [the money].' },
].map((o) => {
	const parts = o.h.split(/(\[[^\]]+\])/).filter(Boolean).flatMap((seg) => seg.startsWith('[') ? [{ w: seg.slice(1, -1), hl: true }] : seg.trim().split(' ').filter(Boolean).map((w) => ({ w, hl: false })));
	// a mark's trailing stop stays outside it
	const html = parts.map((q) => q.hl ? `<span class="w hl"><i class="mk"></i>${q.w}</span>` : `<span class="w">${q.w}</span>`).join(' ').replace(/<\/span> \./g, '</span>.');
	const el = $(`<div class="ttl"><div class="k"><i></i>${o.k}<em>${o.n}</em></div><h1>${html}</h1></div>`);
	document.body.appendChild(el);
	return { ...o, el, ws: [...el.querySelectorAll('.w')], mk: el.querySelector('.mk'), t0: 1e9, t1: 1e9 };
});
const INDEX = [['firebase', 'flame', 'Firebase'], ['auth', 'fingerprint', 'Firebase Auth'], ['run', 'server', 'Cloud Run'], ['sql', 'database', 'Cloud SQL'], ['pubsub', 'radio', 'Pub/Sub'], ['sched', 'clock', 'Scheduler'],
	['agents', 'bot', 'ADK agents'], ['bq', 'chart-column', 'BigQuery'], ['gcs', 'hard-drive', 'Cloud Storage'], ['gemini', 'sparkles', 'Gemini'], ['shield', 'shield', 'Guardrails']]
	.map(([id, icon, n]) => { const el = $(`<div class="ix">${IC(icon)}${n}</div>`); document.getElementById('index').appendChild(el); return { id, el, icon }; });
const IX_OF = { firebase: 0, auth: 1, run: 2, sql: 3, pubsub: 4, sched: 5, agents: 6, bq: 7, gcs: 8, gemini: 9, pro: 9, flash: 9, shield: 10, figure: 10, yes: 10 };
const PN = Panels(document.getElementById('panels'), leadEl);

// ------------------------------------------------------------------ the camera: shots framed on the part the voice names
let KEYS = [];
const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
const UP = V(0, 1, 0);
// a shot: the camera at `dist` from `anchor` along `dir`, turned so the anchor sits at (sx, sy) of the frame
function frame_(anchor, dir, dist, sx = 0.5, sy = 0.5, fov = 36) {
	const p = anchor.clone().add(dir.clone().normalize().multiplyScalar(dist));
	const f = anchor.clone().sub(p).normalize();
	const tv = Math.tan((fov * Math.PI) / 360), th = tv * (W / H);
	f.applyAxisAngle(UP, Math.atan((sx - 0.5) * 2 * th));
	const right = f.clone().cross(UP).normalize();
	f.applyAxisAngle(right, Math.atan((sy - 0.5) * 2 * tv));
	return { p, q: p.clone().add(f.multiplyScalar(dist)) };
}
function hermite(t, get) {
	let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1].t <= t) i++;
	if (t <= KEYS[0].t) return get(KEYS[0]).clone();
	if (t >= KEYS[KEYS.length - 1].t) return get(KEYS[KEYS.length - 1]).clone();
	const k0 = KEYS[Math.max(0, i - 1)], k1 = KEYS[i], k2 = KEYS[i + 1], k3 = KEYS[Math.min(KEYS.length - 1, i + 2)];
	const dt = Math.max(1e-3, k2.t - k1.t), s = clamp((t - k1.t) / dt);
	const p1 = get(k1), p2 = get(k2);
	const m1 = i === 0 ? new THREE.Vector3() : get(k2).clone().sub(get(k0)).multiplyScalar(dt / Math.max(1e-3, k2.t - k0.t) * (k1.hold ? 0 : 1));
	const m2 = i + 2 >= KEYS.length ? new THREE.Vector3() : get(k3).clone().sub(get(k1)).multiplyScalar(dt / Math.max(1e-3, k3.t - k1.t) * (k2.hold ? 0 : 1));
	const s2 = s * s, s3 = s2 * s;
	return p1.clone().multiplyScalar(2 * s3 - 3 * s2 + 1).add(m1.multiplyScalar(s3 - 2 * s2 + s)).add(p2.clone().multiplyScalar(-2 * s3 + 3 * s2)).add(m2.multiplyScalar(s3 - s2));
}
function scalar(t, name, def) {
	let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1].t <= t) i++;
	const a = KEYS[i], b = KEYS[Math.min(KEYS.length - 1, i + 1)];
	const va = a[name] ?? def, vb = b[name] ?? def;
	return lerp(va, vb, eio((t - a.t) / Math.max(1e-3, b.t - a.t)));
}
function camAt(t) {
	camPos.copy(hermite(t, (k) => k.p)); camTgt.copy(hermite(t, (k) => k.q));
	camPos.x += Math.sin(t * 0.37) * 0.05; camPos.y += Math.cos(t * 0.29) * 0.04;      // a breath of a hand on the camera, never a shake
	camera.position.copy(camPos); camera.up.set(0, 1, 0); camera.lookAt(camTgt);
	camera.rotateZ((scalar(t, 'roll', 0) * Math.PI) / 180);
	camera.fov = scalar(t, 'fov', 36); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
}

// ------------------------------------------------------------------ the timeline, from the narration's cues
let C = null, EV = [];
const ev = (t, kind, pan = 0.5) => EV.push({ t: +t.toFixed(3), kind, pan });
const show = (o, t, sound = null, pan = 0.5) => { o.t0 = t; if (sound) ev(t, sound, pan); };
const draw = (id, t0, dur = 0.7, sound = null) => { const b = BEAMS[id]; b.t0 = t0; b.dur = dur; if (sound) ev(t0, sound); return b; };
const run = (id, t0, dur = 0.8, ping = true, pan = 0.5) => { BEAMS[id].pk.push({ t0, dur }); if (ping) ev(t0 + dur, 'ping', pan); };
const DEFAULTS = {     // cut 12's cues (the scene's own time), for a page opened on its own
	t01: 0.9, hood: 1.42, google: 2.5, u02: 3.373, apps: 3.713, firebase: 4.233, api: 5.513, run: 6.653, sql: 7.633, record: 8.593,
	u03: 9.184, pubsub: 9.264, step: 10.704, scheduler: 12.124, clock: 13.224, u04: 13.67, nine: 13.75, adk: 15.59, watcher: 16.32,
	sales: 16.47, bigquery: 17.11, photos: 18.01, storage: 18.95, u05: 19.896, platform: 20.916, gemini: 22.016, pro: 22.396,
	prices: 22.656, negotiates: 23.436, flash: 24.636, reads: 24.996, writes: 25.636, u06: 26.233, models: 26.493, money: 27.713,
	api2: 28.693, figure: 30.213, person: 31.253, yes: 32.013, end: 33.637,
};
const SCR = (n) => `scr/${n}.webp`;
const SPIN = `<svg class="spin" viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9"/></svg>`;
const approve = { t0: 1e9, click: 1e9 }, wave = { t0: 1e9 }, photoT = { t0: 1e9 }, deny = { t0: 1e9 };
let EXPO = { t0: 0 };
const apiTop = V(0, API_Y + 0.8, 0.9), sqlTop = V(7.0, API_Y + 0.7, 0.3), busPt = V(4.4, BUS_Y, 5.8);
window.setCues = async (cues) => {
	const c = Object.assign({}, DEFAULTS, cues); C = c; EV = [];
	for (const P of Object.values(PARTS)) { P.t0 = 1e9; P.lit = 1e9; P.pulses = []; }
	for (const b of Object.values(BEAMS)) { b.t0 = 1e9; b.pk = []; }
	LABELS.forEach((L) => { L.t0 = 1e9; L.t1 = 1e9; });
	AGENTS.forEach((a) => { a.t0 = 1e9; a.tierT = 1e9; });
	ACTS.forEach((h) => { h.t0 = 1e9; h.t1 = 1e9; });
	Object.values(HEROES).forEach((h) => { h.t0 = 1e9; h.t1 = 1e9; });
	const end = c.end;

	// the part in the light, in turn (its window beside it is the panel below)
	const T = {
		firebase: [c.apps - 0.35, 4.5], auth: [4.55, 6.0], run: [6.0, 7.42], sql: [7.45, 9.05], pubsub: [9.1, 11.95], sched: [11.95, 13.55],
		agents: [13.6, 16.1], bq: [16.1, 17.8], gcs: [17.8, 19.75], gemini: [c.u05 - 0.05, c.prices - 0.3], pro: [c.prices - 0.3, c.flash - 0.18],
		flash: [c.flash - 0.18, c.u06 - 0.08], shield: [c.u06 - 0.08, c.api2 - 0.2], figure: [c.api2 - 0.2, c.person - 0.2], yes: [c.person - 0.2, end - 0.45],
	};
	for (const [id, [t0, t1]] of Object.entries(T)) { HEROES[id].t0 = t0; HEROES[id].t1 = t1; }

	// act 1: the platform rises under a scan of light; the apps; Firebase Authentication; the API; the record; the bus and the clock
	ev(0.02, 'whoosh_in'); ev(0.35, 'sweep');
	ACTS[0].t0 = 0.45; ACTS[0].t1 = c.u04 - 0.12; ACTS[1].t0 = c.u04 + 0.05; ACTS[1].t1 = c.u06 - 0.12; ACTS[2].t0 = c.u06 + 0.05; ACTS[2].t1 = end + 1;
	ACTS.forEach((h) => { ev(h.t0, 'title'); ev(h.t0 + 0.62, 'mark'); });
	show(LB.gcloud, c.google - 0.1, 'glint'); LB.gcloud.t1 = c.apps - 0.2;
	APPS.forEach((a, i) => { a.t0 = 0.3 + 0.12 * i; });
	show(deck, c.firebase - 0.15, 'thump', 0.3);
	APPS.forEach((a, i) => { a.label.t0 = c.apps + 0.15 * i; a.label.t1 = 4.5; a.lit = c.apps - 0.05 + 0.15 * i; });
	show(authP, 4.6, 'thump', 0.25); show(LB.auth, 4.7); LB.auth.t1 = 6.3;
	authP.pulses.push(5.98); draw('auth', 5.9, 0.4); run('auth', 6.0, 0.45, false);
	show(api, 5.4, 'thump'); api.pulses.push(6.45);
	show(LB.idok, 6.45, 'badge'); LB.idok.t1 = 7.4;
	APPS.forEach((a, i) => { draw('req-' + a.id, 5.6 + 0.08 * i, 0.55); run('req-' + a.id, 6.6 + 0.11 * i, 0.6, false); });
	show(sec, c.run, 'drop', 0.25); show(LB.sec, c.run + 0.1); LB.sec.t1 = c.sql - 0.25;
	draw('sec', c.run + 0.1, 0.5);
	show(sql, c.sql - 0.2, 'thump', 0.72); sql.pulses.push(c.sql);
	draw('sql', c.sql - 0.1, 0.5); run('sql', c.record - 0.35, 0.6, false); run('sql', c.record + 0.35, 0.6, false);
	bus.t0 = c.pubsub - 0.25; ev(bus.t0, 'whoosh'); ev(c.pubsub + 0.1, 'ignite');
	draw('pub', c.pubsub - 0.35, 0.5); run('pub', c.step - 0.3, 0.7, false);
	TOPICS.forEach((L, i) => { L.t0 = c.step - 0.25 + 0.2 * i; L.t1 = c.scheduler - 0.1 + 0.05 * i; ev(L.t0, 'topic', 0.6 + 0.06 * i); });
	clock.t0 = c.scheduler - 0.25; ev(clock.t0, 'drop', 0.2);
	clock.ticks0 = c.clock - 0.1; for (let k = 0; k < 4; k++) ev(clock.ticks0 + k * 0.62, 'clock', 0.2);
	draw('tick', c.clock, 0.6); run('tick', c.clock + 0.65, 0.6, false);

	// act 2: the nine AI agents rise in a cascade, then the Watcher, plain code; BigQuery and Cloud Storage feed them; Gemini
	const ais = AGENTS.filter((a) => a.ai);
	ais.forEach((a, i) => { a.t0 = c.nine + 0.05 + 0.1 * i; a.P.t0 = a.t0; a.label.t0 = a.t0 + 0.2; a.label.t1 = c.u06 + 0.3; ev(a.t0 + 0.08, 'drop', 0.15 + 0.08 * i); draw('drop-' + a.id, a.t0 - 0.1, 0.45); a.tierT = 1e9; });
	const wa = AG.watcher; wa.t0 = c.watcher; wa.P.t0 = wa.t0; wa.label.t0 = wa.t0 + 0.15; wa.label.t1 = c.u06 + 0.3; wa.tierT = wa.t0 + 0.35; ev(wa.t0 + 0.05, 'clock', 0.3); draw('drop-watcher', wa.t0 - 0.1, 0.45);
	show(bq, c.bigquery - 0.6, 'thump', 0.3); bq.pulses.push(c.bigquery);
	draw('bq-watcher', c.bigquery - 0.4, 0.6); draw('bq-valuer', c.bigquery - 0.3, 0.6);
	for (let k = 0; k < 3; k++) { run('bq-watcher', c.bigquery + 0.1 + 0.3 * k, 0.7, false); run('bq-valuer', c.bigquery + 0.25 + 0.3 * k, 0.7, false); }
	show(gcs, c.photos - 0.15, 'thump', 0.7); gcs.pulses.push(18.92);
	draw('gcs-vision', c.storage - 0.1, 0.6); photoT.t0 = c.storage + 0.15; ev(photoT.t0, 'whoosh', 0.7);
	gem.t0 = c.gemini - 0.12; ev(gem.t0 - 0.9, 'swell'); ev(gem.t0, 'boom'); ev(gem.t0 + 0.05, 'shimmer');
	const pros = AGENTS.filter((a) => a.tier === 'pro'), flashes = AGENTS.filter((a) => a.tier === 'flash');
	gem.proT = c.pro - 0.05; gem.flashT = c.flash - 0.05;
	show(SATS.pro, c.gemini + 0.2); SATS.pro.t1 = c.u06 - 0.1; show(SATS.flash, c.gemini + 0.35); SATS.flash.t1 = c.u06 - 0.1;
	pros.forEach((a, i) => { const t_ = c.prices - 0.2 + 0.3 * i; draw('gem-' + a.id, t_, 0.5); a.tierT = t_ + 0.4; a.P.lit = t_ + 0.45; });
	ev(c.prices - 0.1, 'chime_pro', 0.4);
	flashes.forEach((a, i) => { const t_ = c.reads - 0.25 + 0.16 * i; draw('gem-' + a.id, t_, 0.5); a.tierT = t_ + 0.4; a.P.lit = t_ + 0.45; });
	ev(c.reads - 0.15, 'chime_flash', 0.6);
	[...pros, ...flashes].forEach((a, i) => run('gem-' + a.id, c.writes + 0.4 + 0.05 * i, 0.6, false));

	// act 3: the shield turns a model away from the money; the API's own figure; a person's yes lights the whole platform
	shield.t0 = c.money - 0.35; ev(shield.t0, 'whoosh'); deny.t0 = c.money + 0.05; ev(deny.t0, 'deny');
	approve.click = c.yes - 0.12;
	wave.t0 = c.yes + 0.45; ev(wave.t0, 'sparkle'); ev(c.yes + 0.75, 'rise'); ev(c.yes + 1.3, 'impact');
	BASE.forEach((b, i) => { b.label.t0 = c.yes + 1.3 + 0.12 * i; b.label.t1 = end + 1; });

	// the application, beside each part
	PN.reset();
	const at = (v) => () => v;
	PN.add({ id: 'apps', side: 'r', layout: 'grid', t0: T.firebase[0], t1: T.firebase[1], anchor: at(V(4.5, DECK_Y + 0.15, 1.6)),
		header: { tone: 'fire', icon: 'flame', k: 'Firebase · Hosting', h: 'Four apps', s: 'The landing page, the console, a workspace for each brand, and the guided demo, each on its own <b>Hosting</b> site.' },
		devices: [['smartclearance.web.app', 'landing-0', [0, 0, 2880, 1800]], ['smartclearance-console.web.app', 'console-0', [0, 0, 2848, 1780]],
			['munchly-smartclearance.web.app', 'cmd-0', [0, 0, 2258, 1411]], ['smartclearance-demo.web.app', 'demo-0', [0, 0, 2880, 1800]]].map(([url, n, cr], i) => ({
			kind: 'browser', w: 400, h: 250, url, urlType: [T.firebase[0] + 0.08 + 0.13 * i, T.firebase[0] + 0.36 + 0.13 * i],
			layers: [{ src: SCR(n), t: -1e9, crop: cr }], veils: [{ x: cr[0], y: cr[1], w: cr[2], h: cr[3], t: T.firebase[0] + 0.42 + 0.13 * i, d: 0.3, color: '#eef2f0' }] })),
		badges: [{ t0: c.firebase + 0.05, icon: 'flame', tone: 'fire', html: 'Firebase Hosting · <em>four sites</em>, released from main by CI', sound: 'glint' }],
		packets: [{ t: c.firebase + 0.1, dur: 0.38, dir: 'out' }] });

	PN.add({ id: 'auth', side: 'r', t0: T.auth[0], t1: T.run[1], anchor: at(apiTop),
		header: { tone: 'fire', icon: 'fingerprint', k: 'Firebase Authentication', h: 'One identity for everyone', s: 'Staff in the console and each brand\'s people in its workspace sign in with <b>email and password</b>, in one user pool.', chips: ['Identity Platform', 'ID token on every call'],
			swaps: [{ t: 6.3, tone: 'blue', icon: 'server', k: 'Cloud Run · backend-api', h: 'One API', s: 'FastAPI: it checks the <b>ID token and the role</b> on every call, and works out every step and every figure.', chips: ['scales to zero', 'Secret Manager', 'OpenTelemetry'] }] },
		devices: [{ kind: 'browser', w: 840, h: 525, url: 'munchly-smartclearance.web.app',
			layers: [{ src: SCR('wsignin-0'), t: -1e9, keys: [{ t: -1e9, c: [0, 0, 2256, 1410] }, { t: 4.98, d: 0.45, c: [1040, 330, 1216, 760] }] },
				{ src: SCR('cmd-0'), t: 6.36, fade: 0.22, crop: [470, 0, 1788, 1117] }],
			typed: [{ t0: 5.02, t1: 5.4, x: 1452, y: 713, w: 650, h: 54, size: 32, text: 'priya.deshmukh@munchly.example', bg: '#f9fffe', caretUntil: 5.44, layer: 0 },
				{ t0: 5.5, t1: 5.66, x: 1452, y: 876, w: 560, h: 54, size: 30, text: '••••••••••••', dots: true, bg: '#ffffff', color: '#1d2a24', caretUntil: 5.7, layer: 0 }],
			overlays: [{ t0: 5.86, t1: 6.42, x: 1383, y: 945, w: 742, h: 94, r: 22, bg: '#167a51', size: 32, html: `${SPIN}<span>Signing in…</span>`, layer: 0 }],
			cursor: [{ t: 4.82, x: 1840, y: 560 }, { t: 4.98, x: 1640, y: 714, click: true }, { t: 5.47, x: 1660, y: 876, click: true }, { t: 5.84, x: 1760, y: 992, click: true }, { t: 6.3, x: 1760, y: 992, hide: 6.18 }],
			strips: [{ t0: 6.62, t1: 7.5, html: '<span class="m">GET</span><span data-type="/v1/workspaces/munchly/snapshot"></span><span class="ok">200 OK</span><span class="dim">backend-api · Cloud Run, asia-south1</span>' }] }],
		badges: [{ t0: 5.98, t1: 6.95, icon: 'fingerprint', tone: 'fire', html: 'Firebase Authentication · <em>signed in</em> as priya.deshmukh@munchly.example', sound: 'done' }],
		packets: [{ t: 6.02, dur: 0.42, dir: 'out', label: 'ID token', icon: 'key-round', tone: 'fire' }, { t: 6.66, dur: 0.36, dir: 'in', label: 'snapshot', icon: 'server', tone: 'blue' }] });

	PN.add({ id: 'sql', side: 'l', t0: T.sql[0], t1: T.sql[1], anchor: at(sqlTop),
		header: { tone: 'blue', icon: 'database', k: 'Cloud SQL · PostgreSQL 18', h: 'The record', s: 'Every batch, case, paper and <b>audit line</b>, written in the same transaction as the change it records.', chips: ['IAM sign-in only', 'point-in-time recovery'] },
		devices: [{ kind: 'browser', w: 800, h: 500, url: 'munchly-smartclearance.web.app',
			layers: [{ src: SCR('record2-0'), t: -1e9, keys: [{ t: -1e9, c: [470, 560, 1104, 690] }, { t: 8.0, d: 0.01, c: [470, 560, 1104, 690] }, { t: 9.0, d: 1.0, c: [470, 900, 1104, 690] }] }],
			veils: [[757, 905], [905, 1050], [1050, 1160], [1160, 1345], [1345, 1490], [1490, 1715]].map(([y0, y1], i) => ({ x: 498, y: y0, w: 1022, h: y1 - y0, t: 7.85 + 0.17 * i, d: 0.26 })) }],
		badges: [{ t0: 8.6, icon: 'lock', tone: 'blue', html: 'The audit log is <em>append-only</em>: each line in its person\'s own name' }],
		packets: [7.9, 8.24, 8.58].map((t) => ({ t, dur: 0.3, dir: 'out' })) });

	PN.add({ id: 'pubsub', side: 'l', t0: T.pubsub[0], t1: T.pubsub[1],
		header: { tone: 'blue', icon: 'radio', k: 'Pub/Sub', h: 'Every step, an event', s: 'Ordered and retried: the agents wake on them, <b>pushes</b> go out, and every screen updates live.', chips: ['batch.at_risk', 'journey.step', 'offer.received'] },
		devices: [['lockpc', 266.2, 10.72], ['locklc', 232.6, 11.22]].map(([n, hh, tp]) => ({ kind: 'phone', w: 250, h: 541, layers: [{ src: SCR(n + '-0'), t: -1e9, crop: [0, 0, 656, 1420] }],
			pushes: [{ src: SCR(n + '-note'), t: tp, x: 23.6, y: 421.6, w: 608.2, h: hh }] })),
		leads: [{ dev: 0, anchor: at(busPt) }, { dev: 1, anchor: at(busPt) }],
		badges: [{ t0: 10.9, icon: 'bell-ring', tone: 'blue', html: 'Firebase Cloud Messaging · <em>pushed</em> to each person\'s phone' }],
		packets: [{ t: 10.36, dur: 0.36, dir: 'in', lead: 0, label: 'batch.at_risk', icon: 'radio' }, { t: 10.86, dur: 0.36, dir: 'in', lead: 1, label: 'journey.step', icon: 'radio' }] });

	const SK = [{ t: -1e9, c: [520, 600, 1600, 1000] }, { t: 13.2, d: 0.42, c: [520, 760, 1600, 1000] }];
	PN.add({ id: 'sched', side: 'r', t0: T.sched[0], t1: T.sched[1], anchor: at(clock.g.position.clone()),
		header: { tone: 'blue', icon: 'clock', k: 'Cloud Scheduler', h: 'The clock', s: 'A tick every minute: <b>the morning checks</b>, offer windows closing, expiry days falling due. Staff can run one now.', chips: ['sc-tick · every minute'] },
		devices: [{ kind: 'browser', w: 840, h: 525, url: 'smartclearance-console.web.app',
			layers: [{ src: SCR('sched2-0'), t: -1e9, keys: SK }, { src: SCR('sched2-1'), t: 12.88, fade: 0.06, keys: SK }, { src: SCR('sched2-3'), t: 13.02, fade: 0.16, keys: SK, sound: 'toast' }],
			cursor: [{ t: 12.32, x: 1500, y: 1360 }, { t: 12.86, x: 1958, y: 937, click: true }, { t: 13.5, x: 1958, y: 937, hide: 13.32 }],
			rings: [{ t0: 13.1, t1: 13.6, x: 600, y: 866, w: 1480, h: 128, r: 22, layer: 2 }] }],
		packets: [{ t: 12.22, dur: 0.38, dir: 'in', label: 'sc-tick', icon: 'clock' }] });

	PN.add({ id: 'agents', side: 'r', t0: T.agents[0], t1: T.agents[1], anchor: at(V(0, AG_Y + 0.6, -6.1)),
		header: { tone: 'green', icon: 'bot', k: 'Google\'s ADK · on Cloud Run', h: 'Nine AI agents', s: 'One job each, set to Suggest, Ask or Act. The <b>Watcher is plain code</b>: rules on BigQuery, no model.' },
		devices: [{ kind: 'browser', w: 700, h: 560, url: 'smartclearance-console.web.app',
			layers: [{ src: SCR('agents'), t: -1e9, keys: [{ t: -1e9, c: [560, 330, 1530, 1224] }, { t: 14.05, d: 0.01, c: [560, 330, 1530, 1224] }, { t: 15.95, d: 1.9, c: [560, 1496, 1530, 1224] }] }] }],
		badges: [{ t0: 14.3, icon: 'bot', tone: 'green', html: 'ADK <em>SequentialAgent</em> pipelines · one run per Pub/Sub event' }] });
	ev(14.06, 'scroll', 0.66);

	PN.add({ id: 'bq', side: 'r', t0: T.bq[0], t1: T.bq[1], anchor: at(bq.g.position.clone().add(V(0, 1.35, 0))),
		header: { tone: 'blue', icon: 'chart-column', k: 'BigQuery', h: 'Sales history', s: 'The Watcher projects <b>sell-through</b>, the Valuer reads price history, and Impact writes the ledger for BRSR.', chips: ['secondary_sales', 'impact_ledger'] },
		devices: [{ kind: 'browser', w: 720, h: 450, url: 'munchly-smartclearance.web.app',
			layers: [{ src: SCR('cmd-0'), t: -1e9, crop: [1600, 345, 656, 410] }, { src: SCR('vision-1'), t: 17.12, fade: 0.2, crop: [1600, 1270, 656, 410] }],
			rings: [{ t0: 16.5, t1: 17.15, x: 1742, y: 660, w: 480, h: 48, r: 10, layer: 0 }, { t0: 17.32, t1: 17.9, x: 1742, y: 1468, w: 480, h: 48, r: 10, layer: 1 }] }],
		packets: [{ t: 16.42, dur: 0.36, dir: 'in', label: 'secondary_sales', icon: 'chart-column' }, { t: 17.16, dur: 0.36, dir: 'in', label: 'price_history', icon: 'chart-column' }] });

	PN.add({ id: 'gcs', side: 'l', layout: 'side', t0: T.gcs[0], t1: T.gcs[1], anchor: at(gcs.g.position.clone().add(V(0, 1.45, 0))),
		header: { tone: 'blue', icon: 'hard-drive', k: 'Cloud Storage', h: 'Photos and papers', s: 'Label photos for Vision, staff-sale receipts, and every signed PDF, <b>kept for good</b>.', chips: ['sc-photos', 'sc-docs'] },
		devices: [{ kind: 'phone', w: 300, h: 649,
			layers: [{ src: SCR('photo2-0'), t: -1e9, crop: [0, 0, 656, 1420] }, { src: SCR('photo2-1'), t: 18.3, fade: 0.08, crop: [0, 0, 656, 1420] },
				{ src: SCR('photo2-2'), t: 18.74, fade: 0.14, crop: [0, 0, 656, 1420] }, { src: SCR('photo2-4'), t: 19.45, fade: 0.16, crop: [0, 0, 656, 1420], sound: 'done' }],
			taps: [{ t: 17.98, x: 480, y: 1310 }, { t: 18.28, x: 436, y: 1177, tap: true }, { t: 18.8, x: 436, y: 1177, hide: 18.6 }] }],
		badges: [{ t0: 18.96, icon: 'hard-drive', tone: 'blue', html: 'Kept in <em>sc-photos</em>; Vision reads it from there' }],
		packets: [{ t: 18.5, dur: 0.42, dir: 'out', label: 'label photo', icon: 'image' }] });

	PN.add({ id: 'gemini', side: 'l', layout: 'solo', t0: T.gemini[0], t1: T.gemini[1], anchor: at(GEM.clone()),
		devices: [{ kind: 'browser', w: 600, h: 375, url: 'munchly-smartclearance.web.app', layers: [{ src: SCR('vision-0'), t: -1e9, keys: [{ t: -1e9, c: [1600, 960, 656, 410] }, { t: c.gemini + 0.05, d: 0.6, c: [1640, 1010, 600, 375] }] }],
			rings: [{ t0: c.gemini, t1: T.gemini[1] + 0.2, x: 1742, y: 1243, w: 470, h: 50, r: 10 }] }],
		packets: [{ t: c.gemini + 0.05, dur: 0.4, dir: 'in', label: 'read_label · 0.97', icon: 'sparkles', tone: 'violet' }],
		header: { tone: 'violet', icon: 'sparkles', k: 'Google\'s Agent Platform', h: 'Gemini', s: 'The models the nine AI agents think with: <b>structured output</b>, bounded calls, three tries, then a safe fallback.', chips: ['formerly Vertex AI', 'global endpoint'] } });

	PN.add({ id: 'pro', side: 'r', t0: T.pro[0], t1: T.pro[1],
		header: { tone: 'violet', icon: 'sparkles', k: 'Gemini 3.1 Pro', h: 'Prices and negotiates', s: 'The <b>Valuer</b> prices every exit, the <b>Router</b> splits the batch, the <b>Negotiator</b> answers a buyer\'s bid.', chips: ['Valuer', 'Router', 'Negotiator'] },
		devices: [{ kind: 'browser', w: 560, h: 320, url: 'munchly-smartclearance.web.app', layers: [{ src: SCR('vision-1'), t: -1e9, crop: [478, 700, 1114, 636] }],
			veils: [900, 971, 1040, 1111, 1182].map((y, i) => ({ x: 720, y, w: 880, h: 56, t: c.prices + 0.0 + 0.08 * i, d: 0.38, dir: 'right' })) },
			{ kind: 'phone', w: 255, h: 552, layers: [{ src: SCR('neg-0'), t: -1e9, crop: [0, 0, 656, 1420] }, { src: SCR('neg-1'), t: 23.5, fade: 0.1, crop: [0, 0, 656, 1420] }, { src: SCR('neg-3'), t: 24.04, fade: 0.16, crop: [0, 0, 656, 1420], sound: 'pop' }],
				taps: [{ t: 23.08, x: 340, y: 920 }, { t: 23.46, x: 326, y: 778, tap: true }, { t: 23.9, x: 326, y: 778, hide: 23.75 }],
				rings: [{ t0: 24.12, t1: 24.6, x: 118, y: 1060, w: 410, h: 122, r: 22, layer: 2 }] }],
		leads: [{ dev: 0, anchor: () => AG.valuer.pos.clone().add(V(0, 0.55, 0)) }, { dev: 1, anchor: () => AG.negotiator.pos.clone().add(V(0, 0.55, 0)) }],
		packets: [{ t: c.prices - 0.15, dur: 0.32, dir: 'in', lead: 0 }, { t: 23.64, dur: 0.38, dir: 'in', lead: 1, label: 'counter ₹14.20', icon: 'gavel', tone: 'violet' }] });

	PN.add({ id: 'flash', side: 'r', t0: T.flash[0], t1: T.flash[1],
		header: { tone: 'blue', icon: 'zap', k: 'Gemini 3.8 Flash', h: 'Reads and writes', s: 'Vision and Data <b>read</b> labels, receipts and exports; Outreach, the Lister, Paperwork and Impact <b>write</b>, Hindi first.', chips: ['Data', 'Vision', 'Outreach', 'Lister', 'Paperwork', 'Impact'] },
		devices: [{ kind: 'browser', w: 560, h: 400, url: 'munchly-smartclearance.web.app', layers: [{ src: SCR('vision-0'), t: -1e9, crop: [478, 950, 1114, 796] }],
			veils: [[1135, 1215], [1215, 1305], [1305, 1398], [1398, 1490], [1490, 1580], [1580, 1670]].map(([y0, y1], i) => ({ x: 500, y: y0, w: 1070, h: y1 - y0, t: c.reads + 0.02 + 0.08 * i, d: 0.24 })),
			rings: [{ t0: c.reads - 0.1, t1: c.writes, x: 529, y: 1036, w: 367, h: 45, r: 22 }] },
			{ kind: 'phone', w: 255, h: 552, layers: [{ src: SCR('kir0-0'), t: -1e9, crop: [0, 0, 656, 1420] }],
				veils: [{ x: 36, y: 412, w: 590, h: 420, t: c.writes - 0.02, d: 0.5, color: '#ffffff', sound: false }],
				rings: [{ t0: c.writes + 0.45, t1: 26.2, x: 40, y: 650, w: 580, h: 170, r: 16 }] }],
		leads: [{ dev: 0, anchor: () => AG.vision.pos.clone().add(V(0, 0.55, 0)) }, { dev: 1, anchor: () => AG.outreach.pos.clone().add(V(0, 0.55, 0)) }],
		packets: [{ t: c.reads - 0.12, dur: 0.3, dir: 'in', lead: 0, label: 'label read', icon: 'scan-line' }, { t: c.writes - 0.36, dur: 0.34, dir: 'in', lead: 1, label: 'Hindi offer', icon: 'send' }] });
	ev(c.writes, 'write', 0.7);

	PN.add({ id: 'shield', side: 'l', t0: T.shield[0], t1: T.shield[1], anchor: at(V(-2.6, SHIELD_Y, 4.6)),
		header: { tone: 'amber', icon: 'shield', k: 'Guardrails', h: 'Never the money', s: 'The <b>reserve price</b> never reaches a model, and every word an agent writes is checked against the brand\'s rules.', chips: ['the reserve stays in the API', 'copy checked'] },
		devices: [{ kind: 'browser', w: 760, h: 480, url: 'munchly-smartclearance.web.app', layers: [{ src: SCR('lister-0'), t: -1e9, crop: [478, 520, 1114, 704] }],
			rings: [{ t0: c.money - 0.05, t1: T.shield[1] + 0.2, x: 500, y: 930, w: 1090, h: 172, r: 18, sound: false }] }],
		badges: [{ t0: c.money + 0.1, icon: 'lock', tone: 'amber', html: 'The reserve stays in the API · <em>never in a prompt</em>', sound: 'lock' }] });

	PN.add({ id: 'figure', side: 'r', t0: T.figure[0], t1: T.figure[1], anchor: at(apiTop),
		header: { tone: 'green', icon: 'server', k: 'Worked out by the API', h: '₹<span data-roll="16917">16,917</span>', s: 'Net for the Mango Drink: every figure is <b>the API\'s</b>, never a model\'s.' },
		devices: [{ kind: 'browser', w: 620, h: 500, url: 'munchly-smartclearance.web.app', layers: [{ src: SCR('sheet-0'), t: -1e9, crop: [1423, 24, 809, 652] }],
			rings: [{ t0: c.figure - 0.05, t1: T.figure[1] + 0.2, x: 1450, y: 110, w: 312, h: 132, r: 14 }] }],
		badges: [{ t0: 29.25, icon: 'braces', tone: 'green', html: '<code>money.py</code> · each exit\'s takings, less its costs' }],
		packets: [{ t: 28.95, dur: 0.38, dir: 'in', label: '₹16,917.10', icon: 'server' }] });

	PN.add({ id: 'yes', side: 'r', layout: 'side', t0: T.yes[0], t1: T.yes[1], anchor: at(apiTop),
		header: { tone: 'amber', icon: 'hand', k: 'A person\'s yes', h: 'Nothing moves without it', s: 'Priya approves the plan in <b>one tap</b>; only then do the agents set off.' },
		devices: [{ kind: 'phone', w: 300, h: 649,
			layers: [{ src: SCR('yes-0'), t: -1e9, crop: [0, 0, 656, 1420] }, { src: SCR('yes-1'), t: approve.click + 0.02, fade: 0.08, crop: [0, 0, 656, 1420] },
				{ src: SCR('yes-2'), t: c.yes + 0.16, fade: 0.1, crop: [0, 0, 656, 1420] }, { src: SCR('yes-3'), t: c.yes + 0.36, fade: 0.1, crop: [0, 0, 656, 1420] },
				{ src: SCR('yes-4'), t: c.yes + 0.56, fade: 0.12, crop: [0, 0, 656, 1420], sound: 'done' }],
			taps: [{ t: 31.45, x: 360, y: 1260 }, { t: approve.click, x: 326, y: 1131, tap: true }, { t: approve.click + 0.5, x: 326, y: 1131, hide: approve.click + 0.32 }] }],
		badges: [{ t0: c.yes + 0.22, icon: 'hand', tone: 'amber', html: 'Approved by Priya · logged with <em>who, when and which device</em>', sound: 'gate' }],
		packets: [{ t: approve.click + 0.12, dur: 0.38, dir: 'out', label: 'approve', icon: 'hand', tone: 'amber' }] });
	PN.events(ev);

	// the camera: an establishing shot, then each part framed opposite its screens, and back out on the yes
	const K = [];
	const k = (t, sh, o = {}) => K.push({ t, p: sh.p, q: sh.q, ...o });
	const F = frame_;
	const CK = clock.g.position, BQ = bq.g.position, GC = gcs.g.position;
	k(0, F(V(0, 1.5, 0), V(-0.45, -0.05, 0.89), 40, 0.5, 0.5, 30), { fov: 30, roll: -2.5 });
	k(c.google + 0.4, F(V(0, 1.8, 0), V(-0.34, 0.24, 0.91), 30, 0.5, 0.5, 34), { fov: 34, roll: -0.8 });
	k(c.apps - 0.1, F(V(-2.5, APPS_Y - 0.2, 0), V(-0.22, 0.14, 0.96), 16.5, 0.3, 0.5, 36), { fov: 36, roll: 1.0, hold: true });
	k(4.45, F(V(-2.2, APPS_Y - 0.25, 0), V(-0.2, 0.13, 0.97), 16.0, 0.3, 0.5, 36), { fov: 36, roll: 0.8 });
	k(4.95, F(V(-6.6, (DECK_Y + API_Y) / 2 + 0.6, 0.6), V(-0.26, 0.22, 0.94), 15.5, 0.3, 0.5, 36), { fov: 36, roll: -0.6, hold: true });
	k(5.85, F(V(-6.2, (DECK_Y + API_Y) / 2 + 0.4, 0.6), V(-0.24, 0.2, 0.95), 15.0, 0.3, 0.5, 36), { fov: 36, roll: -0.4 });
	k(6.45, F(V(-0.6, API_Y + 0.2, 0.3), V(-0.22, 0.3, 0.93), 10.5, 0.3, 0.5, 34), { fov: 34, roll: 0.6, hold: true });
	k(7.3, F(V(-0.4, API_Y + 0.2, 0.3), V(-0.18, 0.28, 0.94), 10.0, 0.3, 0.5, 34), { fov: 34, roll: 0.4 });
	k(7.8, F(V(7.0, API_Y + 0.1, 0.3), V(0.22, 0.28, 0.93), 9.4, 0.7, 0.52, 34), { fov: 34, roll: -0.8, hold: true });
	k(8.9, F(V(7.0, API_Y + 0.1, 0.3), V(0.2, 0.26, 0.94), 8.8, 0.7, 0.52, 34), { fov: 34, roll: -0.5 });
	k(9.5, F(busPt, V(0.78, 0.2, 0.6), 7.8, 0.7, 0.52, 38), { fov: 38, roll: 2.5, hold: true });
	k(11.7, F(busPt.clone().add(V(-0.6, 0, 0.3)), V(0.74, 0.22, 0.63), 7.4, 0.7, 0.52, 38), { fov: 38, roll: 1.8 });
	k(12.3, F(CK, V(-0.55, 0.16, 0.82), 6.0, 0.3, 0.5, 36), { fov: 36, roll: -1.5, hold: true });
	k(13.5, F(CK, V(-0.5, 0.18, 0.84), 5.6, 0.3, 0.5, 36), { fov: 36, roll: -1.2 });
	k(14.05, F(V(0, AG_Y + 0.2, -5.0), V(-0.12, 0.28, 0.95), 19.0, 0.34, 0.6, 40), { fov: 40, roll: 0, hold: true });
	k(15.9, F(V(0.4, AG_Y + 0.2, -5.0), V(-0.06, 0.28, 0.96), 18.4, 0.34, 0.6, 40), { fov: 40, roll: 0.4 });
	k(16.45, F(BQ.clone().add(V(0, 0.6, 0)), V(-0.42, 0.3, 0.86), 7.6, 0.32, 0.5, 34), { fov: 34, roll: 1.2, hold: true });
	k(17.6, F(BQ.clone().add(V(0, 0.6, 0)), V(-0.38, 0.28, 0.88), 7.1, 0.32, 0.5, 34), { fov: 34, roll: 1.0 });
	k(18.15, F(GC.clone().add(V(0, 0.7, 0)), V(0.5, 0.2, 0.84), 6.8, 0.68, 0.52, 36), { fov: 36, roll: -1.2, hold: true });
	k(19.45, F(GC.clone().add(V(0, 0.7, 0)), V(0.46, 0.2, 0.86), 6.4, 0.68, 0.52, 36), { fov: 36, roll: -1.0 });
	k(c.u05 + 0.4, F(GEM, V(0, 0.12, 1), 11.5, 0.64, 0.5, 32), { fov: 32, roll: 0 });
	k(c.gemini + 0.15, F(GEM, V(0.06, 0.1, 1), 6.2, 0.66, 0.5, 40), { fov: 40, roll: 0, hold: true });
	k(c.prices - 0.25, F(GEM, V(0.08, 0.12, 1), 5.8, 0.66, 0.5, 40), { fov: 40, roll: 0 });
	k(c.prices + 0.3, F(V(0.6, AG_Y + 0.4, -2.8), V(-0.3, 0.42, 0.86), 20.5, 0.3, 0.56, 40), { fov: 40, roll: -1.0, hold: true });
	k(c.flash - 0.3, F(V(0.8, AG_Y + 0.4, -2.8), V(-0.24, 0.42, 0.87), 20.0, 0.3, 0.56, 40), { fov: 40, roll: -0.6 });
	k(c.flash + 0.3, F(V(0.0, AG_Y + 0.4, -2.6), V(0.3, 0.44, 0.85), 20.5, 0.3, 0.56, 40), { fov: 40, roll: 1.0, hold: true });
	k(c.u06 - 0.25, F(V(0.2, AG_Y + 0.4, -2.6), V(0.26, 0.44, 0.86), 20.0, 0.3, 0.56, 40), { fov: 40, roll: 0.8 });
	k(c.models + 0.15, F(V(0, SHIELD_Y, 1.4), V(0.38, 0.62, 0.69), 15.8, 0.66, 0.55, 36), { fov: 36, roll: 1.5, hold: true });
	k(c.api2 - 0.4, F(V(0, SHIELD_Y, 1.4), V(0.34, 0.6, 0.72), 15.0, 0.66, 0.55, 36), { fov: 36, roll: 1.2 });
	k(c.api2 + 0.1, F(V(-0.4, API_Y + 0.2, 0.3), V(-0.24, 0.28, 0.93), 9.0, 0.3, 0.5, 34), { fov: 34, roll: -0.8, hold: true });
	k(c.person - 0.4, F(V(-0.4, API_Y + 0.2, 0.3), V(-0.2, 0.26, 0.94), 8.5, 0.3, 0.5, 34), { fov: 34, roll: -0.6 });
	k(c.person + 0.1, F(V(-1.0, 1.4, 0), V(-0.1, 0.32, 0.94), 24.0, 0.32, 0.5, 36), { fov: 36, roll: 0, hold: true });
	k(c.yes + 0.6, F(V(-1.0, 1.4, 0), V(-0.1, 0.32, 0.94), 23.0, 0.32, 0.5, 36), { fov: 36, roll: 0, hold: true });
	k(end - 0.2, F(V(0, 2.0, 0), V(-0.2, 0.42, 0.89), 34, 0.5, 0.5, 36), { fov: 36, roll: -1.0 });
	KEYS = K;
	// a soft whoosh under each of the camera's moves
	[c.apps - 0.4, 4.55, 6.0, 7.4, 9.05, 11.95, 13.6, 16.05, 17.75, c.u05, c.prices - 0.2, c.flash - 0.15, c.u06 - 0.05, c.api2 - 0.25, c.person - 0.25]
		.forEach((t, i) => ev(t, 'move', i % 2 ? 0.35 : 0.65));
	await Promise.all(PN.images().map((im) => (im.complete && im.naturalWidth ? null : im.decode().catch(() => null))));
	window.renderAt(0);
	return { events: EV.sort((x, y) => x.t - y.t), cues: c };
};

// ------------------------------------------------------------------ the scene at time t (a sub-frame's time)
const proj = new THREE.Vector3();
const shot = (v) => { proj.copy(v).project(camera); return { x: (proj.x * 0.5 + 0.5) * W, y: (-proj.y * 0.5 + 0.5) * H, z: proj.z }; };
function heroW(h, t) { return h.t0 > 1e8 ? 0 : sm(Math.min((t - h.t0) / 0.4, (h.t1 - t) / 0.4)); }
const PART_HERO = { deck: ['firebase', 'yes'], auth: ['auth'], api: ['auth', 'run', 'figure', 'shield', 'yes'], sec: ['run'], sql: ['sql'], bus: ['pubsub'], clock: ['sched'], bq: ['bq'], gcs: ['gcs'], gem: ['gemini', 'pro', 'flash'] };
function partW(names, t) { return names.reduce((m, id) => Math.max(m, heroW(HEROES[id], t)), 0); }

function update(t) {
	camAt(t);
	const F = Object.values(HEROES).reduce((m, h) => Math.max(m, heroW(h, t)), 0);       // how strongly one part is the hero now
	const dimOf = (w) => 1 - 0.62 * F * (1 - w);
	// the scan of light, the floor, the dust, the room's light
	const sp = clamp((t + 0.25) / 2.3);
	scan.position.y = lerp(APPS_Y + 1.5, FLOOR_Y + 0.05, sm(sp));
	scanMat.uniforms.a.value = Math.sin(Math.PI * sp) * 0.65; scan.visible = scanMat.uniforms.a.value > 0.003;
	const scanY = lerp(APPS_Y + 1.5, FLOOR_Y, sm(sp));
	const rev = (y) => (t > 2.6 ? 1 : clamp((y + 0.8 - scanY) / 1.4));
	SHAFTS.forEach((s, i) => { s.m.uniforms.a.value = s.a * clamp((t - 0.4 - 0.3 * i) / 1.5) * (1 + 0.08 * Math.sin(t * 0.7 + i)) * (1 - 0.5 * F); s.c.rotation.y = Math.atan2(camera.position.x - s.x, camera.position.z - s.z); });
	const wv = wave.t0 < 1e8 ? t - wave.t0 : -1;
	floorMat.uniforms.glow.value = (0.25 + 0.75 * clamp(t / 2.5)) * (1 - 0.45 * F) + (wv > 0 ? 0.5 * Math.exp(-wv / 1.5) : 0);
	floorMat.uniforms.wave.value = wv > 0 ? wv * 9 : -100;
	dust.uniforms.t.value = t; dust.uniforms.a.value = 0.55 * clamp(t / 1.2);

	const assemble = (P, t0, base, k) => {
		const e = spring(t - t0, 0.62, 11);
		const on = t >= t0 ? clamp((t - t0) / 0.25) : 0;
		const pre = rev(P.g.position.y) * base;
		const lit = Math.max(pre, on);
		const pk = P.pulses.reduce((m, tp) => Math.max(m, t > tp ? Math.exp(-(t - tp) / 0.5) : 0), 0);
		P.edges.forEach((e_) => { e_.material.opacity = lit * (0.55 + 0.45 * on) * k * (1 + 0.9 * pk); });
		P.g.scale.setScalar(t >= t0 ? lerp(0.86, 1, e) : 0.98);
		P.halo.material.opacity = (on * (0.16 + 0.5 * pk) + (wv > 0 ? 0.35 * Math.exp(-Math.max(0, wv - 0.3) / 1.0) : 0)) * k;
		if (P.body) P.body.material.opacity = (P.thin ? 0.18 + 0.12 * lit : 0.55 + 0.35 * lit) * (0.55 + 0.45 * k);
	};
	for (const [name, P] of [['deck', deck], ['auth', authP], ['api', api], ['sec', sec], ['sql', sql], ['bq', bq], ['gcs', gcs]]) {
		P.dimK = dimOf(partW(PART_HERO[name], t));
		assemble(P, P.t0, name === 'deck' ? 0.3 : 0.26, P.dimK);
	}
	const apiOn = api.t0 < 1e8 ? clamp((t - api.t0) / 0.4) : 0;
	const apiBusy = Object.values(BEAMS).filter((b) => b.id.startsWith('req-') || b.id === 'sql').reduce((m, b) => Math.max(m, ...b.pk.map((q) => (t > q.t0 + q.dur - 0.1 && t < q.t0 + q.dur + 0.6 ? Math.exp(-(t - q.t0 - q.dur + 0.1) / 0.3) : 0)), 0), 0);
	apiCore.material.opacity = apiOn * (0.06 + 0.25 * apiBusy) * api.dimK;
	RACK.forEach((m, i) => { m.material.opacity = Math.max(rev(API_Y) * 0.12, apiOn * (0.45 + 0.35 * apiBusy * (i % 2 ? 1 : 0.6))) * api.dimK; });
	LEDS.forEach((l) => { l.m.material.opacity = apiOn * (0.35 + 0.65 * (Math.sin(t * l.sp + l.ph) > 0.2 ? 1 : 0)) * api.dimK; });

	// the apps' screens: each lights in turn as the voice names the four apps
	panels.forEach((p, i) => {
		const a = APPS[i];
		const e = spring(t - a.t0, 0.7, 9);
		p.g.position.y = APPS_Y + lerp(-1.2, 0, e) + Math.sin(t * 0.6 + i) * 0.04;
		const op = clamp((t - a.t0) / 0.4);
		p.screen.material.opacity = op; p.frame.material.opacity = op * 0.9; p.g.visible = op > 0.003;
		const lit = a.lit < 1e8 ? clamp((t - a.lit) / 0.3) : 0;
		const flash = a.lit < 1e8 && t > a.lit ? Math.exp(-(t - a.lit) / 0.35) : 0;
		p.edge.material.opacity = op * (0.35 + 0.65 * (t > deck.t0 ? 1 : 0.3)) * (0.6 + 0.4 * lit + 0.8 * flash);
		const busy = BEAMS['req-' + a.id].pk.reduce((m, q) => Math.max(m, t > q.t0 && t < q.t0 + 0.5 ? Math.sin(Math.PI * (t - q.t0) / 0.5) : 0), 0);
		p.screen.material.opacity = op * 0.92;
		p.mark.material.opacity = op * (0.5 + 0.35 * Math.max(lit, t > deck.t0 + 2 ? 1 : 0) + 0.15 * busy + 0.5 * flash) * deck.dimK;
	});

	// the lines: drawn on, then packets running along them; dimmed when another part is the hero
	const beamK = 1 - 0.45 * F;
	for (const b of Object.values(BEAMS)) {
		const pr = clamp((t - b.t0) / b.dur);
		b.m.uniforms.prog.value = b.t0 < 1e8 ? eo(pr) : 0;
		let pulse = -1, fresh = 0;
		for (const q of b.pk) { const pp = (t - q.t0) / q.dur; if (pp > 0 && pp < 1) { pulse = eo(pp); fresh = 1; } }
		if (b.t0 < 1e8 && t > b.t0 && t < b.t0 + b.dur + 0.6) fresh = 1;
		b.m.uniforms.alpha.value = (b.t0 < 1e8 && t > b.t0 ? 0.85 : 0) * (fresh ? 1 : beamK);
		b.m.uniforms.pulse.value = pulse;
	}
	if (wv > 0) for (const b of Object.values(BEAMS)) if (b.t0 < 1e8) { b.m.uniforms.pulse.value = clamp((wv - 0.2) / 1.4); b.m.uniforms.alpha.value = 0.85; }

	// the bus: its ring ignites with a light racing round it; events run round it
	bus.dimK = dimOf(partW(['pubsub'], t));
	const bo = bus.t0 < 1e8 ? clamp((t - bus.t0) / 0.5) : 0;
	bus.core.material.opacity = Math.max(rev(BUS_Y) * 0.16, bo * 0.85) * bus.dimK; bus.halo.material.opacity = bo * 0.12 * bus.dimK;
	bus.g.scale.setScalar(bus.t0 < 1e8 ? lerp(0.97, 1, spring(t - bus.t0, 0.7, 8)) : 0.97);
	bus.pk.forEach((q) => { const a = (q.ph + t * q.sp) * Math.PI * 2; q.s.position.set(Math.cos(a) * BUS_R, 0, Math.sin(a) * BUS_R); q.s.material.opacity = bo * 0.8 * bus.dimK; q.s.scale.setScalar(0.6); });
	const rp = bus.t0 < 1e8 ? (t - bus.t0 - 0.1) / 1.3 : -1;
	if (rp > 0 && rp < 1) { const a = Math.PI * 0.5 + eio(rp) * Math.PI * 2; bus.racer.position.set(Math.cos(a) * BUS_R, 0, Math.sin(a) * BUS_R); bus.racer.material.opacity = Math.sin(Math.PI * rp) * 0.95; } else bus.racer.material.opacity = 0;
	TOPICS.forEach((L) => { const a = L.ang + (t - (C ? C.step : 0)) * 0.05; L.anchor.set(Math.cos(a) * BUS_R, BUS_Y + 0.35, Math.sin(a) * BUS_R); });
	// the clock: its hand jumps on each tick
	clock.dimK = dimOf(partW(['sched'], t));
	const co = clock.t0 < 1e8 ? clamp((t - clock.t0) / 0.4) : 0, cg = rev(BUS_Y) * 0.2;
	clock.ring.material.opacity = Math.max(cg, co) * clock.dimK; clock.ticks.children.forEach((m) => { m.material.opacity = Math.max(cg, co * 0.9) * clock.dimK; }); clock.hand.material.opacity = Math.max(cg, co) * clock.dimK;
	clock.face.material.opacity = (0.45 * cg + 0.9 * co);
	clock.g.scale.setScalar(clock.t0 < 1e8 ? lerp(0.9, 1, spring(t - clock.t0, 0.6, 12)) : 0.9);
	clock.g.lookAt(camera.position); clock.g.visible = Math.max(cg, co) > 0.003;
	let steps = 0, frac = 0;
	if (clock.ticks0 < 1e8 && t > clock.ticks0) { const n = (t - clock.ticks0) / 0.62; steps = Math.min(4, Math.floor(n)); frac = n >= 4 ? 1 : spring((n - Math.floor(n)) * 0.62, 0.45, 26); }
	clock.hand.rotation.z = -(steps + (steps < 4 ? frac : 0)) * (Math.PI / 6) - 0.4;
	// the clock keeps its close-up's softer light while the camera is near it, so pulling away never flares it
	const cn = Math.max(partW(['sched'], t), clamp((11 - camPos.distanceTo(clock.g.position)) / 5));
	clock.halo.material.opacity = co * (0.12 + (clock.ticks0 < 1e8 && t > clock.ticks0 ? 0.25 * Math.exp(-((t - clock.ticks0) % 0.62) / 0.25) : 0)) * clock.dimK * (1 - 0.45 * cn);
	clock.ring.material.color.copy(col(BLUE, lerp(2.6, 1.7, cn)));

	// the agents: each pod rises; the nine AI agents take their tier's ink as Gemini lights their job; the Watcher stays code-grey
	AGENTS.forEach((a, i) => {
		const P = a.P, e = spring(t - a.t0, 0.62, 10);
		const own = ['agents', ...(a.tier === 'pro' ? ['pro'] : a.tier === 'flash' ? ['flash'] : []), ...(a.id === 'watcher' || a.id === 'valuer' ? ['bq'] : []), ...(a.id === 'vision' ? ['gcs'] : [])];
		P.dimK = dimOf(partW(own, t));
		const on = t >= a.t0 ? clamp((t - a.t0) / 0.3) : 0, gh = rev(AG_Y) * 0.22;
		P.g.position.y = AG_Y + Math.sin(t * 0.8 + i) * 0.05;
		P.g.scale.setScalar(t >= a.t0 ? lerp(0.9, 1, e) : 0.92);
		const lit = a.P.lit < 1e8 ? clamp((t - a.P.lit) / 0.3) : 0;
		const flash = t >= a.t0 ? Math.exp(-(t - a.t0) / 0.35) : 0;
		const c_ = new THREE.Color(a.ai ? GREEN : CODE).lerp(new THREE.Color(a.ai ? TIER_C[a.tier] : CODE), lit).multiplyScalar(a.ai ? 2.4 : 1.6);
		P.edges.forEach((e_) => { e_.material.color.copy(c_); e_.material.opacity = Math.max(gh, on) * P.dimK * (1 + 0.8 * flash); });
		P.halo.material.color.copy(c_).multiplyScalar(0.4);
		P.halo.material.opacity = (on * (0.12 + 0.35 * lit * Math.exp(-Math.max(0, t - a.P.lit - 0.2) / 1.2) + 0.4 * flash) + (wv > 0 ? 0.3 * Math.exp(-Math.max(0, wv - 0.9) / 1.0) * on : 0)) * P.dimK;
		P.body.material.opacity = (0.4 * gh / 0.22 + 0.5 * on) * (0.6 + 0.4 * P.dimK); P.g.visible = Math.max(gh, on) > 0.003;
		if (a.icon) { a.icon.material.opacity = Math.max(gh, on) * (0.5 + 0.5 * P.dimK); a.icon.material.color.copy(new THREE.Color(a.ai ? 0xd9f7e7 : 0xe4ebe7).lerp(new THREE.Color(a.ai ? TIER_C[a.tier] : CODE), lit * 0.6)); }
	});

	// the label photo, out of the bucket and into Vision
	const pp = photoT.t0 < 1e8 ? (t - photoT.t0) / 1.0 : -1;
	if (pp > 0 && pp < 1.6) {
		const q = BEAMS['gcs-vision'].curve.getPoint(eo(Math.min(1, pp)));
		photo.position.copy(q); photo.lookAt(camera.position);
		photo.scale.setScalar(lerp(1.0, 0.45, eo(Math.min(1, pp))));
		photo.material.opacity = Math.min(clamp(pp / 0.15), clamp((1.45 - pp) / 0.3));
	} else photo.material.opacity = 0;
	photo.visible = photo.material.opacity > 0.003;

	// the heart: Gemini wakes, turns, its motes circle it, and each model's satellite flares as the voice names it
	gem.dimK = dimOf(partW(PART_HERO.gem, t));
	const dorm = C && C.u05 < 1e8 ? 0.22 * clamp((t - C.u05 + 0.4) / 0.8) + 0.33 * clamp((t - C.platform + 0.1) / 0.6) : 0;
	const go = Math.max(gem.t0 < 1e8 ? clamp((t - gem.t0) / 0.6) : 0, dorm);
	const burst = gem.t0 < 1e8 && t > gem.t0 ? Math.exp(-(t - gem.t0) / 0.7) : 0;
	const gk = (0.55 + 0.45 * gem.dimK);
	gem.shellMat.uniforms.a.value = Math.max(rev(GEM.y) * 0.12, go) * gk; gem.shellMat.uniforms.t.value = t; gem.shellMat.uniforms.burst.value = burst;
	gem.shell.scale.setScalar(go > 0 ? lerp(0.7, 1, spring(t - gem.t0, 0.55, 9)) : 0.7);
	gem.star.material.opacity = go * gk; gem.star.material.rotation = t * 0.12 + 0.785 * (1 - spring(t - gem.t0, 0.6, 7));
	gem.star.scale.setScalar(1.15 * (1 + 0.12 * burst + 0.025 * Math.sin(t * 2.4)));
	gem.halo.material.opacity = go * (0.22 + 0.35 * burst) * gem.dimK; gem.halo2.material.opacity = go * 0.12 * gem.dimK;
	gem.light.intensity = go * (7 + 22 * burst) * gem.dimK;
	gem.moteMat.uniforms.t.value = t; gem.moteMat.uniforms.a.value = go * 0.85 * gk;
	for (const [o, tt, sp] of [[gem.pro, gem.proT, 0.55], [gem.flash, gem.flashT, 0.42]]) {
		const fl = tt < 1e8 && t > tt ? Math.exp(-(t - tt) / 0.9) : 0;
		const an = o.ph + t * sp;
		o.sat.position.set(Math.cos(an) * o.R, Math.sin(an) * o.R, 0);
		o.ring.material.opacity = go * (0.32 + 0.6 * fl) * gk; o.sat.material.opacity = go * gk;
		o.glow.material.opacity = go * (0.35 + 0.9 * fl) * gk; o.glow.scale.setScalar(0.9 + 1.4 * fl);
	}
	gem.g.updateMatrixWorld(true);
	SATS.pro.anchor.copy(gem.pro.sat.getWorldPosition(new THREE.Vector3())); SATS.flash.anchor.copy(gem.flash.sat.getWorldPosition(new THREE.Vector3()));

	// the shield
	const so = shield.t0 < 1e8 ? clamp((t - shield.t0) / 0.5) : 0;
	shieldMat.uniforms.a.value = so * (0.7 + 0.3 * Math.exp(-Math.max(0, t - (C ? C.money : 0)) / 0.8)) * (1 - clamp((t - (approve.click + 0.4)) / 0.8));
	shieldMat.uniforms.t.value = t;
	const dn = deny.t0 < 1e8 ? (t - deny.t0) / 0.7 : -1;
	denyFx.s.material.opacity = dn > 0 && dn < 1 ? (1 - dn) * 0.9 : 0; denyFx.s.scale.setScalar(1.2 + 3.2 * eo(clamp(dn)));
	denyFx.r.material.opacity = dn > 0 && dn < 1 ? (1 - dn) * 0.8 : 0; denyFx.r.scale.setScalar(0.4 + 2.6 * eo(clamp(dn)));
	BASE.forEach((b) => { b.halo.material.opacity = b.label.t0 < 1e8 ? clamp((t - b.label.t0) / 0.4) * 0.5 : 0; });

	// the light on the hero: a shaft from above, a pool under it, and a pulse as it powers on
	for (const [id, s] of Object.entries(SPOT)) {
		const h = HEROES[id], w = heroW(h, t);
		const sk = id === 'gemini' ? 0.3 : 1;      // the orb carries its own light
		s.cone.material.uniforms.a.value = w * sk; s.pool.material.opacity = w * 0.32 * sk; s.g.visible = w > 0.003 || (t > h.t0 && t < h.t0 + 1.0);
		const rq = h.t0 < 1e8 ? (t - h.t0 - 0.05) / 0.9 : -1;
		s.ring.scale.setScalar(s.r * lerp(0.4, 1.25, eo(clamp(rq)))); s.ring.material.opacity = rq > 0 && rq < 1 ? (1 - rq) * 0.6 : 0;
	}

	// the lens: focus on the hero (a rack between heroes), and a flare off Gemini
	dof.mat.uniforms.focus.value = camPos.distanceTo(camTgt);
	dof.mat.uniforms.scale.value = 7.5 * F;
	const gp = shot(GEM);
	cine.material.uniforms.flarePos.value.set(gp.x / W, 1 - gp.y / H);
	const onScreen = gp.z < 1 && gp.x > -200 && gp.x < W + 200 && gp.y > 0 && gp.y < H ? 1 : 0;
	cine.material.uniforms.flare.value = go * (0.05 + 0.35 * burst) * onScreen * gem.dimK;
	cine.material.uniforms.exposure.value = lerp(0.62, 1.0, eo(t / 1.2)) + (wv > 0 ? 0.25 * Math.exp(-wv / 0.6) : 0);
}

// ------------------------------------------------------------------ what lies over the picture at time t
function place(L, t) {
	const kd = L.part ? clamp((L.part.dimK - 0.38) / 0.62) : 1;
	const a = fade(t, L.t0, L.t1, 0.3, 0.3) * (L.part ? 0.04 + 0.96 * kd * kd : 1);
	if (a <= 0.001) { L.el.style.opacity = 0; return; }
	proj.copy(L.anchor).project(camera);
	if (proj.z > 1) { L.el.style.opacity = 0; return; }
	const x = (proj.x * 0.5 + 0.5) * W + L.dx, y = (-proj.y * 0.5 + 0.5) * H + L.dy;
	const d = camera.position.distanceTo(L.anchor);
	const s = clamp(L.ref / d, L.min, L.max) * L.k;
	const w = L.el.offsetWidth, h = L.el.offsetHeight;
	const ox = L.align === 'l' ? 0 : L.align === 'r' ? -w * s : -w * s / 2;
	const e = spring(t - L.t0, 0.7, 13);
	L.el.style.transform = `translate(${(x + ox).toFixed(1)}px, ${(y - h * s / 2 + 10 * (1 - e)).toFixed(1)}px) scale(${s.toFixed(3)})`;
	L.el.style.transformOrigin = '0 0';
	L.el.style.opacity = a.toFixed(3);
}
function overlay(t) {
	LABELS.forEach((L) => place(L, t));
	AGENTS.forEach((a) => { if (a.tierEl) a.tierEl.style.opacity = clamp((t - a.tierT) / 0.3).toFixed(3); });
	// the act's title, on its shade: the words rise, then the words that matter are marked
	let shade = 0;
	ACTS.forEach((h) => {
		const a = fade(t, h.t0, h.t1, 0.3, 0.25);
		h.el.style.opacity = a.toFixed(3); shade = Math.max(shade, a);
		if (a <= 0) return;
		h.ws.forEach((w, i) => { const e = spring(t - h.t0 - 0.06 * i, 0.74, 14); w.style.transform = `translateY(${(56 * (1 - e)).toFixed(1)}px)`; w.style.opacity = clamp((t - h.t0 - 0.06 * i) / 0.18).toFixed(3); });
		if (h.mk) { const m = eo((t - h.t0 - 0.6) / 0.42); h.mk.style.transform = `scaleX(${m.toFixed(3)})`; h.mk.parentElement.style.color = m > 0.45 ? '#062014' : '#ffffff'; h.mk.parentElement.style.textShadow = m > 0.45 ? 'none' : ''; }
	});
	document.getElementById('shade').style.opacity = shade.toFixed(3);
	// the dock: the part in the light filled green, the ones met already bright
	const ixEl = document.getElementById('index'); ixEl.style.opacity = clamp((t - 0.7) / 0.4).toFixed(3);
	let cur = -1, best = 0;
	for (const h of Object.values(HEROES)) { const w = heroW(h, t); if (w > best) { best = w; cur = IX_OF[h.id]; } }
	INDEX.forEach((it, i) => {
		const seen = Object.values(HEROES).some((h) => IX_OF[h.id] === i && h.t0 < t);
		it.el.className = 'ix' + (i === cur && best > 0.3 ? ' on' : seen ? ' done' : '');
	});
	// the application beside each part
	PN.update(t, shot);
}

// ------------------------------------------------------------------ one frame: the shutter's sub-frames summed, then the lens
const PROBE = [V(0, 2, 0), V(-8, 0, 0), V(8, 0, 0), V(0, 8, 0), V(0, -4, 4), V(0, -2.5, -6)];
function blurTaps(t) {
	camAt(t - SHUTTER / 2); const a = PROBE.map(shot);
	camAt(t + SHUTTER / 2); const b = PROBE.map(shot);
	let px = 0;
	for (let i = 0; i < PROBE.length; i++) if (a[i].z < 1 && b[i].z < 1) px = Math.max(px, Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y));
	return clamp(Math.ceil(px / 4), 1, 14);
}
// a light close to the lens fades out, as a real lens loses it: a camera flying through the bus ring, or past a beam, never
// floods the frame with bloom (cut 10's first render washed out three moves). Every additive material in the scene gets
// it, the built-in ones through their fog chunks and the scene's own shaders at their main(). The nearest framed part
// sits 5 units off, so only a crossing is touched.
const NEAR0 = 0.7, NEAR1 = 2.4;
const NEAR_V = 'varying float vNearZ;\n', NEAR_F = `gl_FragColor.a *= smoothstep(${NEAR0.toFixed(2)}, ${NEAR1.toFixed(2)}, vNearZ);`;
function nearFade(m) {
	if (!m || m.userData.near || m.blending !== THREE.AdditiveBlending || m.isRawShaderMaterial) return;
	m.userData.near = true;
	if (m.isShaderMaterial) {
		m.vertexShader = NEAR_V + m.vertexShader.replace(/void\s+main\s*\(\s*\)\s*\{/, (x) => x + ' vNearZ = -(modelViewMatrix * vec4(position, 1.0)).z;');
		const i = m.fragmentShader.lastIndexOf('}');
		m.fragmentShader = NEAR_V + m.fragmentShader.slice(0, i) + NEAR_F + '\n}' + m.fragmentShader.slice(i + 1);
	} else {
		const prev = m.onBeforeCompile;
		m.onBeforeCompile = (sh, r) => {
			if (prev) prev(sh, r);
			sh.vertexShader = NEAR_V + sh.vertexShader.replace('#include <fog_vertex>', '#include <fog_vertex>\n\tvNearZ = -mvPosition.z;');
			sh.fragmentShader = NEAR_V + sh.fragmentShader.replace('#include <fog_fragment>', NEAR_F + '\n\t#include <fog_fragment>');
		};
		m.customProgramCacheKey = () => 'near-fade';
	}
	m.needsUpdate = true;
}
const nearAll = () => scene.traverse((o) => (Array.isArray(o.material) ? o.material : [o.material]).forEach(nearFade));
window.renderAt = (t) => {
	nearAll();
	const n = blurTaps(t);
	const ac = renderer.autoClear;
	renderer.setRenderTarget(acc); renderer.setClearColor(0x000000, 1); renderer.clear();
	for (let i = 0; i < n; i++) {
		update(n === 1 ? t : t + SHUTTER * ((i + 0.5) / n - 0.5));
		composer.render();
		accQuad.material.uniforms.t.value = composer.readBuffer.texture; accQuad.material.uniforms.w.value = 1 / n;
		renderer.autoClear = false; renderer.setRenderTarget(acc); accQuad.render(renderer); renderer.autoClear = ac;
	}
	update(t);     // the camera and the lens at the frame's own time, for what lies over the picture
	cine.material.uniforms.seed.value = (Math.floor(t * FPS) * 0.6180339) % 1;
	renderer.setRenderTarget(null); cine.render(renderer);
	overlay(t);
	return { taps: n };
};

// ------------------------------------------------------------------ build what needs its textures, then ready
(async () => {
	const texs = await Promise.all(APPS.map((a) => iconTex(a.icon, '#ffc58e')));
	texs.forEach((tx, i) => {
		const a = APPS[i];
		const w = 3.3, h = 2.06;
		const g = new THREE.Group(); g.position.set(a.x, APPS_Y, Math.abs(a.x) > 5 ? -0.6 : 0); g.rotation.y = -a.x * 0.03; world.add(g);
		a.pos = g.position.clone();
		const frame = new THREE.Mesh(new RoundedBoxGeometry(w + 0.18, h + 0.18, 0.12, 3, 0.08), new THREE.MeshStandardMaterial({ color: 0x0b120f, metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0, depthWrite: false }));
		frame.position.z = -0.08; g.add(frame);
		const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0x14231c, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
		g.add(screen);
		const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, toneMapped: false, depthWrite: false })); mark.position.z = 0.02; g.add(mark);
		const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w + 0.2, h + 0.2)), edgeMat(ORANGE, 1.7)); edge.position.z = 0.01; g.add(edge);
		const sheen = nd(new THREE.Mesh(new THREE.PlaneGeometry(0.7, h), new THREE.MeshBasicMaterial({ color: col(0xffffff, 1.2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }))); sheen.position.z = 0.02; g.add(sheen);
		panels.push({ g, screen, frame, edge, sheen, mark, w, h });
		a.t0 = 1e9; a.lit = 1e9;
	});
	{ const tx = await iconTex('fingerprint', '#ffc58e'); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false })); m.position.z = 0.61; authP.g.add(m); authP.icon = m; }
	await Promise.all(AGENTS.map(async (a) => {
		const tx = await iconTex(a.icon);
		const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
		m.position.z = 0.31; a.P.g.add(m); a.icon = m;
	}));
	const labelTex = await loadTex('label-photo.webp');
	if (labelTex) { photo.material.map = labelTex; photo.material.needsUpdate = true; }
	dof.collect(scene);
	await document.fonts.ready;
	await window.setCues({});
	window.__dbg = { bloom, dof, streak, scene, world, THREE, camera, HEROES, PN, gem, PARTS, BEAMS, renderer, composer };
	window.pageReady = true;
})();
