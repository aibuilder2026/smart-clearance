// SC-219 (cut 10): under the hood, as a film. Cut 9's lit platform, the same parts and the same story, shot like a
// movie: a 2.39:1 letterbox, the act's title in the top bar and the stack's parts in the bottom bar, each lit in turn;
// the camera framing each part as the voice names it (on a third, a slight roll, a rack focus), the rest of the platform
// dimmed and out of focus, a shaft of light and a pulse as it powers on, and a large callout beside it with a leader to
// it. Nine AI agents on Google's ADK; the Watcher is plain code (rules on BigQuery's sell-through, no model) and is drawn
// apart from them. The picture: motion blur from sub-frames on a 180-degree shutter; depth of field with true bokeh (a
// single-pass gather on the scene's own depth); anamorphic streaks off the brightest lights; a lens flare off Gemini;
// ACES, a light grade, a vignette and grain.
// Nothing runs on its own clock: renderAt(t) draws scene time t (capture-page.mjs takes it frame by frame), and
// setCues(cues) takes the narration's word times and returns the scene's sounds ({events}) for the mix.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const W = 1920, H = 1080, FPS = 25, SHUTTER = 0.5 / FPS;      // a 180-degree shutter
const BAR = 138;                                               // the letterbox's bars: the picture is 2.39:1
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
	{ id: 'landing', tex: 'app-landing.webp', x: -7.65, b: 'Landing page', s: 'smartclearance.web.app', icon: 'globe' },
	{ id: 'console', tex: 'app-console.webp', x: -2.55, b: 'Console', s: 'staff set every brand up', icon: 'layout-dashboard' },
	{ id: 'workspace', tex: 'app-workspace.webp', x: 2.55, b: 'Workspace', s: 'one per brand · an installable app', icon: 'smartphone' },
	{ id: 'demo', tex: 'app-demo.webp', x: 7.65, b: 'Guided demo', s: 'no sign-in needed', icon: 'play' },
];
const deck = slab('deck', 21.5, 0.16, 4.4, V(0, DECK_Y, 0), ORANGE, { k: 1.15, op: 0.3, r: 0.4 }); deck.thin = true; deck.halo.visible = false;
const API_Y = 3.1;
const api = slab('api', 5.4, 1.5, 2.7, V(0, API_Y, 0), GREEN, { k: 2.6 });
const apiCore = nd(new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.08, 2.0), new THREE.MeshBasicMaterial({ color: col(GREEN, 3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
apiCore.position.y = 0.05; api.g.add(apiCore);
const RACK = Array.from({ length: 5 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.07), new THREE.MeshBasicMaterial({ color: col(GREEN, 2.2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.position.set(0, -0.48 + i * 0.24, 1.36); api.g.add(m); return m; });
const LEDS = Array.from({ length: 18 }, (_, i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), new THREE.MeshBasicMaterial({ color: col(i % 4 === 0 ? BLUE : GREEN, 3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.position.set(-2.3 + (i % 9) * 0.12, -0.36 + Math.floor(i / 9) * 0.48, 1.37); api.g.add(m); return { m, ph: R() * 6.28, sp: 2 + R() * 5 }; });
const sec = slab('sec', 2.0, 1.15, 1.5, V(-7.0, API_Y - 0.05, 0.4), BLUE, { k: 2.2 });
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
// the heart: Gemini, on Google's Agent Platform
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
	return { g, core, coreMat, spark, halo, halo2, motes, light, t0: 1e9, dimK: 1 };
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
beam('auth', [V(-9.6, DECK_Y - 0.15, 0.8), V(-8.6, (DECK_Y + API_Y) / 2 + 0.3, 1.2), V(-7.4, API_Y + 0.65, 0.7)], AMBER, 0.03);
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
let approveTex = null;

// the light on each part as it is named
const SPOT = {
	run: spot(V(0, API_Y - 0.85, 0.2), 3.4, 9), sql: spot(V(7.0, API_Y - 0.6, 0.3), 2.2, 8), sched: spot(V(clock.g.position.x, BUS_Y - 1.0, clock.g.position.z), 1.6, 7, 0xd6e5ff),
	bq: spot(V(-5.6, DATA_Y - 0.05, 4.2), 2.3, 9, 0xd6e5ff), gcs: spot(V(5.6, DATA_Y - 0.05, 4.2), 2.0, 9, 0xd6e5ff), gemini: spot(V(0, GEM.y - 1.1, GEM.z), 2.0, 8, 0xe6dcff),
	figure: spot(V(0, API_Y - 0.85, 0.2), 3.4, 9, 0xfff0cc),
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
};
APPS.forEach((a) => { a.label = label(node(a.icon, a.b, a.s, ''), V(a.x, APPS_Y + 1.85, 0), { dy: -28, part: deck }); });
AGENTS.forEach((a) => {
	const tierHtml = a.tier === 'pro' ? `${IC('sparkles')}Gemini 3.1 Pro` : a.tier === 'flash' ? `${IC('zap')}Gemini 3.8 Flash` : `${IC('braces')}plain code · no model`;
	a.label = label(`<div class="agent"><b>${a.name}</b><div class="tier ${a.tier === 'code' ? 'rules' : a.tier}">${tierHtml}</div></div>`, a.pos.clone().add(V(0, -0.62, 0.3)), { dy: 8, part: a.P });
	a.tierEl = a.label.el.querySelector('.tier');
});
BASE.forEach((b) => { b.label = label(node(b.icon, b.b, b.s, 'gcp'), b.pos, { dy: -6 }); });
const TOPICS = ['batch.at_risk', 'journey.step', 'offer.received', 'deal.closed', 'notify'].map((name, i) => {
	const L = label(`<div class="topic">${name}</div>`, V(0, 0, 0), { part: bus }); L.ang = Math.PI * (0.18 + i * 0.16); return L;
});

// the hero callouts: one part at a time, large, beside it, with a leader to it
const HERO_DEF = {
	firebase: { cls: 'fire', icon: 'flame', k: 'Firebase · Hosting and Authentication', h: 'Four apps', s: 'The landing page, the console, a workspace for each brand and the guided demo, behind one sign-in.', chips: ['Hosting', 'Authentication', 'Cloud Messaging'], side: 'l', bottom: true, at: V(-2.55, 6.6, 0.9) },
	run: { cls: 'blue', icon: 'server', k: 'Cloud Run', h: 'One API', s: 'backend-api, in FastAPI: every rule, every step and every figure is worked out here.', chips: ['scales to zero', 'Secret Manager', 'OpenTelemetry'], side: 'l', at: V(0, API_Y + 0.8, 1.35) },
	sql: { cls: 'blue', icon: 'database', k: 'Cloud SQL', h: 'The record', s: 'PostgreSQL 18 holds every batch, case, paper and audit line.', chips: ['IAM sign-in only', 'point-in-time recovery'], side: 'l', at: V(7.0, API_Y + 0.5, 1.4) },
	pubsub: { cls: 'blue', icon: 'radio', k: 'Pub/Sub', h: 'Every step, an event', s: 'Ordered and retried: the agents wake on them, and the screens update live.', chips: ['batch.at_risk', 'journey.step', 'offer.received'], side: 'l', at: V(4.4, BUS_Y, 5.8) },
	sched: { cls: 'blue', icon: 'clock', k: 'Cloud Scheduler', h: 'The clock', s: 'A tick every minute: the morning checks, offer windows closing, expiry days falling due.', chips: ['sc-tick · every minute'], side: 'r', at: V(clock.g.position.x, BUS_Y + 0.05, clock.g.position.z) },
	agents: { cls: '', icon: 'bot', k: "Google's ADK · on Cloud Run", h: 'Nine AI agents', s: 'Each with one job, one run per event. The Watcher is plain code: rules on BigQuery, no model.', chips: [], side: 'l', top: true, at: V(-1.1, AG_Y + 0.6, -6.1) },
	bq: { cls: 'blue', icon: 'chart-column', k: 'BigQuery', h: 'Sales history', s: 'Sell-through for the Watcher and the Valuer; the impact ledger for BRSR.', chips: ['secondary_sales', 'impact_ledger'], side: 'l', at: V(-5.6, DATA_Y + 0.9, 4.2) },
	gcs: { cls: 'blue', icon: 'hard-drive', k: 'Cloud Storage', h: 'Photos and papers', s: 'Label photos for Vision; every signed PDF, kept for good.', chips: ['sc-photos', 'sc-docs'], side: 'r', at: V(5.6, DATA_Y + 1.0, 4.2) },
	gemini: { cls: 'violet', icon: 'sparkles', k: "Google's Agent Platform", h: 'Gemini', s: 'The models the nine AI agents think with: structured output, on the global endpoint.', chips: ['formerly Vertex AI', 'three tries, then a safe fallback'], side: 'l', at: GEM.clone() },
	pro: { cls: 'violet', icon: 'sparkles', k: 'Gemini 3.1 Pro', h: 'Prices and negotiates', s: 'The Valuer, the Router and the Negotiator: where a person acts on the words.', chips: ['Valuer', 'Router', 'Negotiator'], side: 'l', top: true, at: AG.router.pos.clone().add(V(0, 0.6, 0)) },
	flash: { cls: 'blue', icon: 'zap', k: 'Gemini 3.8 Flash', h: 'Reads and writes', s: 'Data and Vision read exports, labels and receipts; Outreach, the Lister, Paperwork and Impact write.', chips: ['Data', 'Vision', 'Outreach', 'Lister', 'Paperwork', 'Impact'], side: 'r', top: true, at: AG.outreach.pos.clone().add(V(0, 0.6, 0)) },
	shield: { cls: 'amber', icon: 'shield', k: 'Guardrails', h: 'Never the money', s: "The reserve price never reaches a model, and every word is checked against the brand's rules.", chips: ['the reserve stays in the API'], side: 'l', at: V(-2.6, SHIELD_Y, 4.6) },
	figure: { cls: '', icon: 'server', k: 'Worked out by the API', h: '', fig: 16917, s: "Net for the Mango Drink. The figure is the API's, never a model's.", chips: [], side: 'l', at: V(0, API_Y + 0.8, 1.35) },
	yes: { cls: 'amber', icon: 'hand', k: "A person's yes", h: 'Nothing moves without it', s: 'Priya approves the plan in one tap; only then do the agents set off.', chips: [], side: 'l', at: null },
};
const HEROES = {};
for (const [id, d] of Object.entries(HERO_DEF)) {
	const title = d.fig ? `<div class="fig">₹0</div>` : `<h2>${[...d.h].map((ch) => `<span class="c">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')}</h2>`;
	const el = $(`<div class="hero ${d.cls}"><div class="row"><div class="tile">${IC(d.icon)}</div><div><div class="k">${d.k}</div>${d.fig ? '' : title}</div></div>
		${d.fig ? title : ''}<div class="s">${d.s}</div>${d.chips.length ? `<div class="chips">${d.chips.map((c) => `<span>${c}</span>`).join('')}</div>` : ''}</div>`);
	ui.appendChild(el);
	const NS = 'http://www.w3.org/2000/svg';
	const path = document.createElementNS(NS, 'path'); path.setAttribute('fill', 'none'); path.setAttribute('stroke-width', '2.2'); path.setAttribute('stroke-linecap', 'round');
	const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('r', '6');
	const ring = document.createElementNS(NS, 'circle'); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke-width', '2');
	const ink = d.cls === 'blue' ? '#8ab4f8' : d.cls === 'violet' ? '#c58af9' : d.cls === 'amber' ? '#f7c04a' : d.cls === 'fire' ? '#ff9f45' : '#5fd59a';
	[path, ring].forEach((p) => p.setAttribute('stroke', ink)); dot.setAttribute('fill', ink);
	leadEl.appendChild(path); leadEl.appendChild(ring); leadEl.appendChild(dot);
	HEROES[id] = { id, ...d, el, path, dot, ring, cs: [...el.querySelectorAll('.c')], figEl: el.querySelector('.fig'), t0: 1e9, t1: 1e9 };
}
// the act's title in the top bar; the stack's parts in the bottom bar
const ACTS = [
	{ k: 'Under the hood', n: '1 / 3', h: 'All on Google Cloud.' },
	{ k: 'The agents', n: '2 / 3', h: 'Nine AI agents. Two Gemini models.' },
	{ k: 'Guardrails', n: '3 / 3', h: 'The models never touch the money.' },
].map((o) => {
	const el = $(`<div class="ttl"><div class="k"><i></i>${o.k}<em>${o.n}</em></div><h1>${o.h.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ')}</h1></div>`);
	document.body.appendChild(el);
	return { ...o, el, ws: [...el.querySelectorAll('.w')], t0: 1e9, t1: 1e9 };
});
const INDEX = [['firebase', 'flame', 'Firebase'], ['run', 'server', 'Cloud Run'], ['sql', 'database', 'Cloud SQL'], ['pubsub', 'radio', 'Pub/Sub'], ['sched', 'clock', 'Scheduler'],
	['agents', 'bot', 'ADK agents'], ['bq', 'chart-column', 'BigQuery'], ['gcs', 'hard-drive', 'Cloud Storage'], ['gemini', 'sparkles', 'Gemini'], ['shield', 'shield', 'Guardrails']]
	.map(([id, icon, n]) => { const el = $(`<div class="ix">${IC(icon)}${n}</div>`); document.getElementById('index').appendChild(el); return { id, el }; });
const IX_OF = { firebase: 0, run: 1, sql: 2, pubsub: 3, sched: 4, agents: 5, bq: 6, gcs: 7, gemini: 8, pro: 8, flash: 8, shield: 9, figure: 9, yes: 9 };
const ripples = [0, 1].map((i) => { const r = $(`<div class="ripple${i ? ' r2' : ''}"></div>`); ui.appendChild(r); return r; });

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
const DEFAULTS = {
	t01: 0.9, hood: 1.3, google: 2.3,
	u02: 3.6, apps: 4.0, firebase: 4.6, api: 5.6, run: 6.4, sql: 7.4, record: 8.6,
	u03: 9.9, pubsub: 9.9, step: 10.9, scheduler: 12.0, clock: 13.4,
	u04: 14.4, nine: 14.4, adk: 15.6, sales: 16.4, watcher: 16.3, bigquery: 17.0, photos: 18.2, storage: 18.9,
	u05: 20.0, platform: 20.9, gemini: 21.6, pro: 22.0, prices: 22.3, negotiates: 23.0, flash: 24.0, reads: 24.4, writes: 25.0,
	u06: 26.4, models: 26.7, money: 27.7, api2: 28.7, figure: 29.8, person: 31.3, yes: 32.2, end: 34.5,
};
const approve = { t0: 1e9, click: 1e9 }, wave = { t0: 1e9 }, photoT = { t0: 1e9 };
let BARS = { in0: 0.02 }, EXPO = { t0: 0 };
window.setCues = (cues) => {
	const c = Object.assign({}, DEFAULTS, cues); C = c; EV = [];
	for (const P of Object.values(PARTS)) { P.t0 = 1e9; P.lit = 1e9; P.pulses = []; }
	for (const b of Object.values(BEAMS)) { b.t0 = 1e9; b.pk = []; }
	LABELS.forEach((L) => { L.t0 = 1e9; L.t1 = 1e9; });
	AGENTS.forEach((a) => { a.t0 = 1e9; a.tierT = 1e9; });
	ACTS.forEach((h) => { h.t0 = 1e9; h.t1 = 1e9; });
	Object.values(HEROES).forEach((h) => { h.t0 = 1e9; h.t1 = 1e9; });
	const end = c.end;

	// the heroes: each part the voice names, from its word to the next part's
	const hero = (id, t0, t1) => { HEROES[id].t0 = t0; HEROES[id].t1 = t1; };
	hero('firebase', c.apps - 0.1, c.api - 0.35);
	hero('run', c.api - 0.1, c.sql - 0.3);
	hero('sql', c.sql - 0.1, c.pubsub - 0.15);
	hero('pubsub', c.pubsub + 0.05, c.scheduler - 0.2);
	hero('sched', c.scheduler - 0.05, c.nine - 0.05);
	hero('agents', c.nine + 0.1, c.bigquery - 0.3);
	hero('bq', c.bigquery - 0.1, c.storage - 0.3);
	hero('gcs', c.storage - 0.1, c.u05 - 0.2);
	hero('gemini', c.u05 - 0.05, c.prices - 0.15);
	hero('pro', c.prices - 0.2, c.flash - 0.3);
	hero('flash', c.flash - 0.1, c.models - 0.3);
	hero('shield', c.models - 0.1, c.api2 - 0.3);
	hero('figure', c.api2 - 0.1, c.person - 0.3);
	hero('yes', c.person - 0.1, c.yes + 1.5);
	Object.values(HEROES).forEach((h) => { if (h.t0 < 1e8) ev(h.t0 + 0.02, 'card', h.side === 'l' ? 0.3 : 0.7); });

	// act 1: the platform rises under a scan of light; the apps; the API; the record; the bus and the clock
	ev(0.02, 'whoosh_in'); ev(0.35, 'sweep');
	ACTS[0].t0 = 0.45; ACTS[0].t1 = c.u04 - 0.12; ACTS[1].t0 = c.u04 + 0.05; ACTS[1].t1 = c.u06 - 0.12; ACTS[2].t0 = c.u06 + 0.05; ACTS[2].t1 = end + 1;
	ACTS.forEach((h) => ev(h.t0, 'title'));
	show(LB.gcloud, c.google - 0.1, 'glint'); LB.gcloud.t1 = c.apps - 0.2;
	APPS.forEach((a, i) => { a.t0 = 0.3 + 0.12 * i; });
	show(deck, c.firebase - 0.15, 'thump', 0.3);
	APPS.forEach((a, i) => { a.label.t0 = c.apps + 0.15 * i; a.label.t1 = c.api - 0.2; ev(a.label.t0, 'pop', 0.25 + 0.17 * i); a.lit = c.apps - 0.05 + 0.15 * i; });
	show(api, c.api - 0.2, 'thump'); api.pulses.push(c.api);
	APPS.forEach((a, i) => { draw('req-' + a.id, c.api - 0.2 + 0.08 * i, 0.55); run('req-' + a.id, c.run - 0.2 + 0.11 * i, 0.6, i === 1); });
	show(sec, c.run, 'drop', 0.25); show(LB.sec, c.run + 0.1); LB.sec.t1 = c.sql - 0.25;
	draw('sec', c.run + 0.1, 0.5); draw('auth', c.run + 0.25, 0.6);
	show(sql, c.sql - 0.2, 'thump', 0.72); sql.pulses.push(c.sql);
	draw('sql', c.sql - 0.1, 0.5); run('sql', c.record - 0.35, 0.6, true, 0.72); run('sql', c.record + 0.35, 0.6, false);
	bus.t0 = c.pubsub - 0.25; ev(bus.t0, 'whoosh'); ev(c.pubsub + 0.1, 'ignite');
	draw('pub', c.pubsub - 0.35, 0.5); run('pub', c.step - 0.3, 0.7);
	TOPICS.forEach((L, i) => { L.t0 = c.step - 0.25 + 0.2 * i; L.t1 = c.scheduler - 0.1 + 0.05 * i; ev(L.t0, 'topic', 0.3 + 0.1 * i); });
	clock.t0 = c.scheduler - 0.25; ev(clock.t0, 'drop', 0.2);
	clock.ticks0 = c.clock - 0.1; for (let k = 0; k < 4; k++) ev(clock.ticks0 + k * 0.62, 'clock', 0.2);
	draw('tick', c.clock, 0.6); run('tick', c.clock + 0.65, 0.6, false);

	// act 2: the nine AI agents rise in a cascade, then the Watcher, plain code; BigQuery and Cloud Storage feed them; Gemini lights each one's job
	const ais = AGENTS.filter((a) => a.ai);
	ais.forEach((a, i) => { a.t0 = c.nine + 0.05 + 0.1 * i; a.P.t0 = a.t0; a.label.t0 = a.t0 + 0.2; a.label.t1 = c.u06 + 0.3; ev(a.t0 + 0.08, 'drop', 0.15 + 0.08 * i); draw('drop-' + a.id, a.t0 - 0.1, 0.45); a.tierT = 1e9; });
	const wa = AG.watcher; wa.t0 = c.watcher; wa.P.t0 = wa.t0; wa.label.t0 = wa.t0 + 0.15; wa.label.t1 = c.u06 + 0.3; wa.tierT = wa.t0 + 0.35; ev(wa.t0 + 0.05, 'clock', 0.3); draw('drop-watcher', wa.t0 - 0.1, 0.45);
	show(bq, c.bigquery - 0.25, 'thump', 0.3); bq.pulses.push(c.bigquery);
	draw('bq-watcher', c.bigquery, 0.6); draw('bq-valuer', c.bigquery + 0.1, 0.6);
	for (let k = 0; k < 3; k++) { run('bq-watcher', c.bigquery + 0.5 + 0.3 * k, 0.7, k === 0, 0.3); run('bq-valuer', c.bigquery + 0.65 + 0.3 * k, 0.7, false); }
	show(gcs, c.storage - 0.35, 'thump', 0.7); gcs.pulses.push(c.storage);
	draw('gcs-vision', c.storage - 0.1, 0.6); photoT.t0 = c.storage + 0.05; ev(photoT.t0, 'whoosh', 0.7); ev(photoT.t0 + 1.0, 'ping', 0.45);
	gem.t0 = c.gemini - 0.12; ev(gem.t0, 'boom'); ev(gem.t0 + 0.05, 'ignite');
	const pros = AGENTS.filter((a) => a.tier === 'pro'), flashes = AGENTS.filter((a) => a.tier === 'flash');
	pros.forEach((a, i) => { const t_ = c.prices - 0.2 + 0.3 * i; draw('gem-' + a.id, t_, 0.5); a.tierT = t_ + 0.4; a.P.lit = t_ + 0.45; });
	ev(c.prices - 0.1, 'chime_pro', 0.4);
	flashes.forEach((a, i) => { const t_ = c.reads - 0.25 + 0.16 * i; draw('gem-' + a.id, t_, 0.5); a.tierT = t_ + 0.4; a.P.lit = t_ + 0.45; });
	ev(c.reads - 0.15, 'chime_flash', 0.6);
	[...pros, ...flashes].forEach((a, i) => run('gem-' + a.id, c.writes + 0.4 + 0.05 * i, 0.6, false));

	// act 3: the shield; the API's own figure; a person's yes lights the whole platform
	shield.t0 = c.money - 0.35; ev(shield.t0, 'whoosh'); ev(c.money, 'lock');
	approve.t0 = c.person - 0.55; ev(approve.t0, 'whoosh');
	approve.click = c.yes - 0.15; ev(approve.click, 'click', 0.62); ev(approve.click + 0.08, 'gate', 0.62);
	wave.t0 = c.yes + 0.15; ev(wave.t0, 'sparkle'); ev(c.yes + 0.75, 'rise'); ev(c.yes + 1.55, 'impact');
	BASE.forEach((b, i) => { b.label.t0 = c.yes + 1.55 + 0.12 * i; b.label.t1 = end + 1; });

	// the camera: an establishing shot, then each part framed as it is named, and back out on the yes
	const K = [];
	const k = (t, sh, o = {}) => K.push({ t, p: sh.p, q: sh.q, ...o });
	const F = frame_;
	k(0, F(V(0, 1.5, 0), V(-0.45, -0.05, 0.89), 40, 0.5, 0.5, 30), { fov: 30, roll: -2.5 });
	k(c.google + 0.4, F(V(0, 1.8, 0), V(-0.34, 0.24, 0.91), 30, 0.5, 0.5, 34), { fov: 34, roll: -0.8 });
	k(c.apps - 0.15, F(V(-4.6, APPS_Y, -0.3), V(-0.28, 0.07, 0.96), 11.5, 0.56, 0.47, 34), { fov: 34, roll: 1.0, hold: true });
	k(c.api - 0.45, F(V(0.4, APPS_Y, -0.3), V(0.06, 0.06, 1.0), 17.5, 0.5, 0.42, 34), { fov: 34, roll: -0.6 });
	k(c.api + 0.05, F(V(0, API_Y + 0.1, 0.2), V(0.22, 0.32, 0.92), 9.2, 0.64, 0.5, 34), { fov: 34, roll: 0.8, hold: true });
	k(c.sql - 0.4, F(V(0, API_Y + 0.1, 0.2), V(0.18, 0.3, 0.93), 8.8, 0.64, 0.5, 34), { fov: 34, roll: 0.6 });
	k(c.sql + 0.05, F(V(7.0, API_Y - 0.1, 0.3), V(-0.12, 0.26, 0.96), 8.6, 0.64, 0.5, 34), { fov: 34, roll: -0.8, hold: true });
	k(c.record + 0.3, F(V(7.0, API_Y - 0.1, 0.3), V(-0.1, 0.22, 0.97), 8.0, 0.64, 0.5, 34), { fov: 34, roll: -0.5 });
	k(c.pubsub + 0.1, F(V(4.4, BUS_Y, 5.8), V(0.78, 0.2, 0.6), 7.6, 0.62, 0.52, 38), { fov: 38, roll: 2.5 });
	k(c.scheduler - 0.45, F(V(-2.8, BUS_Y, 6.7), V(0.05, 0.22, 1.0), 8.2, 0.55, 0.52, 38), { fov: 38, roll: 0.6 });
	k(c.scheduler + 0.1, F(V(clock.g.position.x, BUS_Y, clock.g.position.z), V(-0.55, 0.16, 0.82), 5.4, 0.36, 0.5, 36), { fov: 36, roll: -1.5, hold: true });
	k(c.nine - 0.15, F(V(clock.g.position.x, BUS_Y, clock.g.position.z), V(-0.5, 0.18, 0.84), 5.0, 0.36, 0.5, 36), { fov: 36, roll: -1.2 });
	k(c.nine + 0.35, F(V(0, AG_Y + 0.2, -5.0), V(-0.1, 0.26, 0.96), 15.0, 0.52, 0.68, 40), { fov: 40, roll: 0, hold: true });
	k(c.bigquery - 0.4, F(V(0.6, AG_Y + 0.2, -5.0), V(0.08, 0.26, 0.96), 14.2, 0.52, 0.68, 40), { fov: 40, roll: 0.4 });
	k(c.bigquery + 0.05, F(V(-5.6, DATA_Y + 0.6, 4.2), V(-0.42, 0.3, 0.86), 7.2, 0.62, 0.5, 34), { fov: 34, roll: 1.2, hold: true });
	k(c.storage - 0.35, F(V(-5.6, DATA_Y + 0.6, 4.2), V(-0.38, 0.28, 0.88), 6.8, 0.62, 0.5, 34), { fov: 34, roll: 1.0 });
	k(c.storage + 0.05, F(V(5.6, DATA_Y + 0.7, 4.2), V(0.5, 0.2, 0.84), 6.4, 0.38, 0.55, 36), { fov: 36, roll: -1.2, hold: true });
	k(c.u05 - 0.3, F(GEM, V(0, 0.1, 1), 11.5, 0.5, 0.5, 32), { fov: 32, roll: 0 });
	k(c.gemini + 0.15, F(GEM, V(0, 0.04, 1), 5.0, 0.62, 0.5, 42), { fov: 42, roll: 0, hold: true });
	k(c.prices + 0.3, F(V(-0.6, AG_Y + 0.3, -3.4), V(-0.22, 0.34, 0.91), 14.6, 0.58, 0.62, 40), { fov: 40, roll: -1.0, hold: true });
	k(c.flash - 0.1, F(V(-0.2, AG_Y + 0.3, -3.4), V(-0.05, 0.34, 0.94), 14.8, 0.5, 0.62, 40), { fov: 40, roll: 0 });
	k(c.flash + 0.3, F(V(0.6, AG_Y + 0.3, -3.4), V(0.22, 0.34, 0.91), 14.6, 0.42, 0.62, 40), { fov: 40, roll: 1.0, hold: true });
	k(c.models - 0.05, F(V(0, SHIELD_Y, 1.4), V(-0.38, 0.62, 0.69), 15.5, 0.62, 0.55, 36), { fov: 36, roll: -1.5, hold: true });
	k(c.api2 - 0.4, F(V(0, SHIELD_Y, 1.4), V(-0.34, 0.6, 0.72), 14.8, 0.62, 0.55, 36), { fov: 36, roll: -1.2 });
	k(c.api2 + 0.05, F(V(0, API_Y + 0.2, 0.3), V(0.24, 0.28, 0.93), 8.2, 0.66, 0.5, 34), { fov: 34, roll: 0.8, hold: true });
	k(c.person - 0.4, F(V(0, API_Y + 0.2, 0.3), V(0.2, 0.26, 0.94), 7.8, 0.66, 0.5, 34), { fov: 34, roll: 0.6 });
	k(c.person + 0.05, F(V(2.55, APPS_Y - 0.1, 0), V(0.04, 0.1, 1.0), 6.6, 0.64, 0.5, 34), { fov: 34, roll: 0, hold: true });
	k(c.yes + 0.6, F(V(2.55, APPS_Y - 0.1, 0), V(0.04, 0.1, 1.0), 6.3, 0.64, 0.5, 34), { fov: 34, roll: 0, hold: true });
	k(end - 0.4, F(V(0, 2.0, 0), V(-0.2, 0.42, 0.89), 34, 0.5, 0.5, 36), { fov: 36, roll: -1.0 });
	KEYS = K;
	// the whooshes of the camera's quick moves
	[c.apps - 0.5, c.api - 0.35, c.sql - 0.3, c.pubsub - 0.25, c.scheduler - 0.3, c.nine - 0.05, c.bigquery - 0.3, c.storage - 0.3, c.u05 - 0.45, c.prices - 0.1, c.models - 0.4, c.api2 - 0.35, c.person - 0.35]
		.forEach((t, i) => ev(t, 'move', i % 2 ? 0.35 : 0.65));
	window.renderAt(0);
	return { events: EV, cues: c };
};

// ------------------------------------------------------------------ the scene at time t (a sub-frame's time)
const proj = new THREE.Vector3();
const shot = (v) => { proj.copy(v).project(camera); return { x: (proj.x * 0.5 + 0.5) * W, y: (-proj.y * 0.5 + 0.5) * H, z: proj.z }; };
function heroW(h, t) { return h.t0 > 1e8 ? 0 : sm(Math.min((t - h.t0) / 0.4, (h.t1 - t) / 0.4)); }
const PART_HERO = { deck: ['firebase', 'yes'], api: ['run', 'figure', 'shield'], sec: ['run'], sql: ['sql'], bus: ['pubsub'], clock: ['sched'], bq: ['bq'], gcs: ['gcs'], gem: ['gemini', 'pro', 'flash', 'shield'] };
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
	for (const [name, P] of [['deck', deck], ['api', api], ['sec', sec], ['sql', sql], ['bq', bq], ['gcs', gcs]]) {
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
		p.screen.material.color.setScalar((0.55 + 0.33 * Math.max(lit, t > deck.t0 + 2 ? 1 : 0) + 0.12 * busy + 0.25 * flash) * deck.dimK);
		if (a.id === 'workspace' && approveTex) {
			const sw = approve.t0 < 1e8 && t > approve.t0 + 0.25;
			p.screen.material.map = sw ? approveTex : p.tex0;
			const g = approve.t0 < 1e8 ? (t - approve.t0) / 0.6 : -1;
			p.sheen.material.opacity = g > 0 && g < 1 ? Math.sin(Math.PI * g) * 0.7 : 0;
			p.sheen.position.x = lerp(-2.6, 2.6, clamp(g));
		}
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

	// the heart: Gemini ignites, turns, and its motes circle it
	gem.dimK = dimOf(partW(PART_HERO.gem, t));
	const dorm = C && C.u05 < 1e8 ? 0.22 * clamp((t - C.u05 + 0.4) / 0.8) * (0.85 + 0.15 * Math.sin(t * 5.0)) : 0;
	const go = Math.max(gem.t0 < 1e8 ? clamp((t - gem.t0) / 0.5) : 0, dorm);
	const burst = gem.t0 < 1e8 && t > gem.t0 ? Math.exp(-(t - gem.t0) / 0.6) : 0;
	const near = clamp((camera.position.distanceTo(GEM) - 4.0) / 6.0);       // the spark and the core stand back as the camera comes close
	gem.coreMat.uniforms.a.value = Math.max(rev(GEM.y) * 0.14, go) * (0.5 + 0.5 * gem.dimK) * (0.7 + 0.3 * near); gem.coreMat.uniforms.t.value = t;
	gem.core.scale.setScalar(go > 0 ? lerp(0.55, 1, spring(t - gem.t0, 0.5, 9)) : 0.55);
	gem.spark.material.opacity = go * (0.75 + 0.6 * burst) * gem.dimK * (0.25 + 0.75 * near); gem.spark.material.rotation = t * 0.18;
	gem.spark.scale.setScalar(2.4 + 1.6 * burst + 0.12 * Math.sin(t * 2.2));
	gem.halo.material.opacity = go * (0.35 + 0.5 * burst) * gem.dimK; gem.halo2.material.opacity = go * 0.22 * gem.dimK;
	gem.light.intensity = go * (8 + 30 * burst) * gem.dimK;
	gem.motes.forEach((m) => { const a = m.ph + t * m.sp; m.s.position.set(Math.cos(a) * m.r, Math.sin(a * 1.3) * 0.5 + Math.sin(a) * m.tilt, Math.sin(a) * m.r * 0.6); m.s.material.opacity = go * 0.8 * gem.dimK; });

	// the shield
	const so = shield.t0 < 1e8 ? clamp((t - shield.t0) / 0.5) : 0;
	shieldMat.uniforms.a.value = so * (0.7 + 0.3 * Math.exp(-Math.max(0, t - (C ? C.money : 0)) / 0.8)) * (1 - clamp((t - (approve.t0 + 0.4)) / 0.8));
	shieldMat.uniforms.t.value = t;
	BASE.forEach((b) => { b.halo.material.opacity = b.label.t0 < 1e8 ? clamp((t - b.label.t0) / 0.4) * 0.5 : 0; });

	// the light on the hero: a shaft from above, a pool under it, and a pulse as it powers on
	for (const [id, s] of Object.entries(SPOT)) {
		const h = HEROES[id], w = heroW(h, t);
		s.cone.material.uniforms.a.value = w; s.pool.material.opacity = w * 0.32; s.g.visible = w > 0.003 || (t > h.t0 && t < h.t0 + 1.0);
		const rq = h.t0 < 1e8 ? (t - h.t0 - 0.05) / 0.9 : -1;
		s.ring.scale.setScalar(s.r * lerp(0.4, 1.25, eo(clamp(rq)))); s.ring.material.opacity = rq > 0 && rq < 1 ? (1 - rq) * 0.6 : 0;
	}

	// the lens: focus on the hero (a rack between heroes), and a flare off Gemini
	dof.mat.uniforms.focus.value = camPos.distanceTo(camTgt);
	dof.mat.uniforms.scale.value = 7.5 * F;
	const gp = shot(GEM);
	cine.material.uniforms.flarePos.value.set(gp.x / W, 1 - gp.y / H);
	const onScreen = gp.z < 1 && gp.x > -200 && gp.x < W + 200 && gp.y > 0 && gp.y < H ? 1 : 0;
	cine.material.uniforms.flare.value = go * (0.12 + 0.9 * burst) * onScreen * gem.dimK;
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
	const c = C;
	LABELS.forEach((L) => place(L, t));
	AGENTS.forEach((a) => { if (a.tierEl) a.tierEl.style.opacity = clamp((t - a.tierT) / 0.3).toFixed(3); });
	// the hero callouts and their leaders
	const ws = panels[2];
	if (ws) HEROES.yes.at = ws.g.localToWorld(V(ws.w * (0.795 - 0.5), ws.h * (0.5 - 0.80), 0.02));
	for (const h of Object.values(HEROES)) {
		if (h.t0 > 1e8 || t < h.t0 - 0.05 || t > h.t1 + 0.35) { h.el.style.opacity = 0; h.path.style.opacity = 0; h.dot.style.opacity = 0; h.ring.style.opacity = 0; continue; }
		const inn = eo((t - h.t0) / 0.45), out = clamp((h.t1 + 0.3 - t) / 0.3);
		const w = h.el.offsetWidth, hh = h.el.offsetHeight;
		const A = h.at ? shot(h.at) : { x: W / 2, y: H / 2 };
		const x = h.side === 'l' ? 96 : W - 96 - w;
		const y = h.top ? BAR + 30 : h.bottom ? H - BAR - 30 - hh : clamp(A.y - hh / 2, BAR + 34, H - BAR - 34 - hh);
		const dx = (h.side === 'l' ? -18 : 18) * (1 - inn) + (h.side === 'l' ? -12 : 12) * (1 - out);
		h.el.style.opacity = (Math.min(1, inn * 1.4) * out).toFixed(3);
		h.el.style.transform = `translate(${(x + dx).toFixed(1)}px, ${y.toFixed(1)}px)`;
		h.el.style.clipPath = `inset(0 ${((1 - inn) * 100).toFixed(1)}% 0 0 round 20px)`;
		h.cs.forEach((ch, i) => { const e = spring(t - h.t0 - 0.12 - 0.022 * i, 0.72, 15); ch.style.transform = `translateY(${(26 * (1 - e)).toFixed(1)}px)`; ch.style.opacity = clamp((t - h.t0 - 0.12 - 0.022 * i) / 0.2).toFixed(3); });
		if (h.figEl) h.figEl.textContent = '₹' + Math.round(h.fig * eo((t - h.t0 - 0.15) / 0.9)).toLocaleString('en-IN');
		// the leader: from the card's edge, out along a short step, to the part
		const ex = h.side === 'l' ? x + w + dx : x + dx, ey = y + 46;
		const kx = ex + (h.side === 'l' ? 40 : -40);
		const ok = h.at && A.z < 1 && A.x > -50 && A.x < W + 50;
		const lp = clamp((t - h.t0 - 0.3) / 0.4);
		const lo = ok ? Math.min(lp > 0 ? 1 : 0, out) : 0;
		const d = `M ${ex.toFixed(1)} ${ey.toFixed(1)} L ${kx.toFixed(1)} ${ey.toFixed(1)} L ${A.x.toFixed(1)} ${A.y.toFixed(1)}`;
		h.path.setAttribute('d', d);
		const len = Math.abs(kx - ex) + Math.hypot(A.x - kx, A.y - ey);
		h.path.setAttribute('stroke-dasharray', `${len.toFixed(1)} ${len.toFixed(1)}`); h.path.setAttribute('stroke-dashoffset', (len * (1 - eo(lp))).toFixed(1));
		h.path.style.opacity = (lo * 0.9).toFixed(3);
		h.dot.setAttribute('cx', A.x.toFixed(1)); h.dot.setAttribute('cy', A.y.toFixed(1)); h.dot.style.opacity = (lo * clamp((lp - 0.85) / 0.15)).toFixed(3);
		const rq = ((t - h.t0 - 0.7) % 1.2) / 1.2;
		h.ring.setAttribute('cx', A.x.toFixed(1)); h.ring.setAttribute('cy', A.y.toFixed(1)); h.ring.setAttribute('r', (7 + 18 * eo(rq)).toFixed(1));
		h.ring.style.opacity = t > h.t0 + 0.7 ? (lo * (1 - rq) * 0.8).toFixed(3) : 0;
	}
	// the letterbox, the act's title, the stack's parts
	const bi = eo((t - BARS.in0) / 0.6);
	document.getElementById('barT').style.height = `${(BAR * bi).toFixed(1)}px`; document.getElementById('barB').style.height = `${(BAR * bi).toFixed(1)}px`;
	ACTS.forEach((h) => {
		const a = fade(t, h.t0, h.t1, 0.3, 0.25);
		h.el.style.opacity = a.toFixed(3);
		if (a <= 0) return;
		h.ws.forEach((w, i) => { const e = spring(t - h.t0 - 0.06 * i, 0.74, 14); w.style.transform = `translateY(${(56 * (1 - e)).toFixed(1)}px)`; });
	});
	const ixEl = document.getElementById('index'); ixEl.style.opacity = clamp((t - 0.7) / 0.4).toFixed(3);
	let cur = -1, best = 0;
	for (const h of Object.values(HEROES)) { const w = heroW(h, t); if (w > best) { best = w; cur = IX_OF[h.id]; } }
	INDEX.forEach((it, i) => {
		const seen = Object.values(HEROES).some((h) => IX_OF[h.id] === i && h.t0 < t);
		it.el.className = 'ix' + (i === cur && best > 0.3 ? ' on' : seen ? ' done' : '');
	});
	// the yes: the ripple on the plan's Approve
	if (HEROES.yes.at) {
		const bp = shot(HEROES.yes.at);
		ripples.forEach((r, k) => {
			const p = (t - approve.click - 0.1 * k) / 0.7;
			if (p <= 0 || p >= 1) { r.style.opacity = 0; return; }
			const rr = 14 + 70 * eo(p);
			r.style.opacity = ((1 - p) * 0.95).toFixed(3); r.style.width = r.style.height = `${(2 * rr).toFixed(1)}px`;
			r.style.transform = `translate(${(bp.x - rr).toFixed(1)}px, ${(bp.y - rr).toFixed(1)}px)`;
		});
	}
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
	const texs = await Promise.all(APPS.map((a) => loadTex(a.tex)));
	approveTex = await loadTex('app-approve.webp');
	texs.forEach((tx, i) => {
		const a = APPS[i];
		const w = 4.6, h = tx ? w * tx.image.height / tx.image.width : 2.6;
		const g = new THREE.Group(); g.position.set(a.x, APPS_Y, Math.abs(a.x) > 5 ? -0.6 : 0); g.rotation.y = -a.x * 0.03; world.add(g);
		a.pos = g.position.clone();
		const frame = new THREE.Mesh(new RoundedBoxGeometry(w + 0.22, h + 0.22, 0.12, 3, 0.08), new THREE.MeshStandardMaterial({ color: 0x0b120f, metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0, depthWrite: false }));
		frame.position.z = -0.08; g.add(frame);
		const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
		g.add(screen);
		const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w + 0.24, h + 0.24)), edgeMat(G3, 1.6)); edge.position.z = 0.01; g.add(edge);
		const sheen = nd(new THREE.Mesh(new THREE.PlaneGeometry(0.9, h), new THREE.MeshBasicMaterial({ color: col(0xffffff, 1.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }))); sheen.position.z = 0.02; g.add(sheen);
		panels.push({ g, screen, frame, edge, sheen, tex0: tx, w, h });
		a.t0 = 1e9; a.lit = 1e9;
	});
	await Promise.all(AGENTS.map(async (a) => {
		const tx = await iconTex(a.icon);
		const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
		m.position.z = 0.31; a.P.g.add(m); a.icon = m;
	}));
	const labelTex = await loadTex('label-photo.webp');
	if (labelTex) { photo.material.map = labelTex; photo.material.needsUpdate = true; }
	dof.collect(scene);
	await document.fonts.ready;
	window.setCues({});
	window.__dbg = { bloom, dof, streak, scene, world, THREE, camera, HEROES };
	window.pageReady = true;
})();
