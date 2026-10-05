// The town in depth (design3/site/town.jsx DepthPlate). WebGL2. The plate and its depth map (white near, black far).
// Each pixel is shifted by its depth against the focus's depth: along a tilt that follows the pointer (a swipe sways it
// on touch screens), and about the focus as the camera nears, so near things move more than far and grow faster; the
// focus follows the camera and what is far from it goes soft, through the plate's own mipmaps. Behind the heading on
// desktops the top of the frame goes to haze as the camera nears, as a tilt-shift lens's does. It draws only while
// something moves.
import type { Camera } from './camera';
import { clamp, GEO, type Fit, type Pt } from './geo';

const VS = `#version 300 es
in vec2 p; out vec2 v; void main() { v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const FS = `#version 300 es
precision highp float;
uniform sampler2D uPlate, uDepth; uniform vec2 uRes; uniform vec4 uWorld; uniform vec3 uCam; uniform vec2 uTilt; uniform float uFocus, uBlur, uSky; uniform vec2 uBand; uniform vec3 uDolly; uniform vec3 uSkyCol;
in vec2 v; out vec4 o;
vec2 plate(vec2 px, vec3 c) { return (px - uWorld.xy - c.xy) / (uWorld.zw * c.z); }
void main() {
  vec2 px = vec2(v.x, 1.0 - v.y) * uRes;
  vec2 uv = plate(px, uCam);
  float d = texture(uDepth, uv).r; vec2 q = uv - (uTilt + (uv - uDolly.xy) * uDolly.z) * (d - uFocus);
  d = texture(uDepth, q).r; q = uv - (uTilt + (uv - uDolly.xy) * uDolly.z) * (d - uFocus);
  float soft = uBlur * smoothstep(0.06, 0.42, abs(d - uFocus));
  vec4 c = texture(uPlate, q, soft);
  if (uSky > 0.0) { float k = uSky * (1.0 - smoothstep(uBand.x, uBand.y, px.y / uRes.y)); vec4 h = texture(uPlate, q, 4.5); c = mix(c, mix(h, vec4(uSkyCol, 1.0), 0.62), k); }
  o = vec4(c.rgb, 1.0);
}`;
// how strongly the town dollies as the camera nears (at full zoom), and sways as it travels
const DOLLY = 0.42;
const SWAY = 0.9;

/** the renderer's shift, for what stands on the town */
export type DepthView = { tilt: Pt; focus: number; foc: Pt; dolly: number };
/** where a plate point shows once the renderer has shifted it (the shader's shift, run forward) */
export const shifted = (p: Pt, d: number, v: DepthView): Pt => [
	p[0] + (v.tilt[0] + (p[0] - v.foc[0]) * v.dolly) * (d - v.focus),
	p[1] + (v.tilt[1] + (p[1] - v.foc[1]) * v.dolly) * (d - v.focus)
];

/** the depth map's pixels, to place the pins and agents where the shader puts the town */
export type DepthMap = { canvas: HTMLCanvasElement; at: (p: Pt) => number };
export function loadDepthMap(url: string): Promise<DepthMap> {
	return new Promise((resolve, reject) => {
		const W = 256,
			H = Math.round((256 * GEO.nh) / GEO.nw),
			c = document.createElement('canvas');
		c.width = W;
		c.height = H;
		const x = c.getContext('2d', { willReadFrequently: true })!;
		const im = new Image();
		im.crossOrigin = 'anonymous';
		im.onload = () => {
			x.drawImage(im, 0, 0, W, H);
			const d = x.getImageData(0, 0, W, H).data;
			resolve({
				canvas: c,
				at: (p) =>
					d[(clamp(Math.round(p[1] * (H - 1)), 0, H - 1) * W + clamp(Math.round(p[0] * (W - 1)), 0, W - 1)) * 4] / 255
			});
		};
		im.onerror = reject;
		im.src = url;
	});
}

type Uniforms = Record<
	'plate' | 'depth' | 'res' | 'world' | 'cam' | 'tilt' | 'focus' | 'blur' | 'sky' | 'band' | 'dolly' | 'skyCol',
	WebGLUniformLocation | null
>;

export class DepthRenderer {
	view: DepthView | null = null;
	g: Fit | null = null;
	reduce = false;
	dark = false;
	map: DepthMap | null = null;
	private ctx: WebGL2RenderingContext;
	private U: Uniforms;
	private tilt: Pt = [0, 0];
	private want: Pt = [0, 0];
	private hover: Pt | null = null;
	private focus = 0.5;
	private blur = 0;
	private raf = 0;
	private plateIn = false;
	private depthIn = false;
	private last: { x: number; y: number } | null = null;
	private off: (() => void)[] = [];

	/** throws where WebGL2 is missing or the program will not link; the town is then drawn flat */
	constructor(
		private canvas: HTMLCanvasElement,
		private cam: Camera,
		private onReady: () => void
	) {
		const ctx = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, alpha: false });
		if (!ctx) throw new Error('no WebGL2');
		const sh = (t: number, s: string) => {
			const o = ctx.createShader(t)!;
			ctx.shaderSource(o, s);
			ctx.compileShader(o);
			return o;
		};
		const pr = ctx.createProgram()!;
		ctx.attachShader(pr, sh(ctx.VERTEX_SHADER, VS));
		ctx.attachShader(pr, sh(ctx.FRAGMENT_SHADER, FS));
		ctx.linkProgram(pr);
		if (!ctx.getProgramParameter(pr, ctx.LINK_STATUS)) throw new Error('the depth program did not link');
		ctx.useProgram(pr);
		const b = ctx.createBuffer();
		ctx.bindBuffer(ctx.ARRAY_BUFFER, b);
		ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
		const loc = ctx.getAttribLocation(pr, 'p');
		ctx.enableVertexAttribArray(loc);
		ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
		const u = (n: string) => ctx.getUniformLocation(pr, n);
		this.U = {
			plate: u('uPlate'),
			depth: u('uDepth'),
			res: u('uRes'),
			world: u('uWorld'),
			cam: u('uCam'),
			tilt: u('uTilt'),
			focus: u('uFocus'),
			blur: u('uBlur'),
			sky: u('uSky'),
			band: u('uBand'),
			dolly: u('uDolly'),
			skyCol: u('uSkyCol')
		};
		ctx.uniform1i(this.U.plate, 0);
		ctx.uniform1i(this.U.depth, 1);
		this.ctx = ctx;
		// the camera's travel sways the town: near things lead, far things lag
		this.off.push(
			cam.listen(() => {
				const c = cam.get();
				if (this.last && !this.reduce)
					this.want = [
						clamp(this.want[0] - (c.x - this.last.x) * SWAY, -0.035, 0.035),
						clamp(this.want[1] - (c.y - this.last.y) * SWAY * 0.6, -0.02, 0.02)
					];
				this.last = { ...c };
				this.draw();
				this.kick();
			})
		);
	}
	private upload(unit: number, src: TexImageSource, mip: boolean) {
		const ctx = this.ctx,
			t = ctx.createTexture();
		ctx.activeTexture(ctx.TEXTURE0 + unit);
		ctx.bindTexture(ctx.TEXTURE_2D, t);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, mip ? ctx.LINEAR_MIPMAP_LINEAR : ctx.LINEAR);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
		ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, src);
		if (mip) ctx.generateMipmap(ctx.TEXTURE_2D);
	}
	/** the plate for the theme; the town is ready once both the plate and its depth are in */
	setPlate(im: HTMLImageElement) {
		this.upload(0, im, true);
		this.plateIn = true;
		if (this.depthIn) this.onReady();
		this.draw();
		this.kick();
	}
	setDepth(map: DepthMap) {
		this.map = map;
		this.upload(1, map.canvas, false);
		this.depthIn = true;
		if (this.plateIn) this.onReady();
		this.draw();
		this.kick();
	}
	draw() {
		const g = this.g,
			c = this.canvas,
			ctx = this.ctx;
		if (!g || !this.plateIn || !this.depthIn) return;
		const dpr = Math.min(window.devicePixelRatio || 1, g.wide ? 2 : 1.5),
			W = Math.round(g.W * dpr),
			H = Math.round(g.H * dpr);
		if (c.width !== W || c.height !== H) {
			c.width = W;
			c.height = H;
		}
		ctx.viewport(0, 0, W, H);
		const t = this.cam.t(),
			fc = this.cam.get(),
			dz = this.reduce ? 0 : DOLLY * (1 - 1 / t.z),
			sk = this.dark ? [3, 19, 48] : [236, 231, 228];
		ctx.uniform2f(this.U.res, W, H);
		ctx.uniform4f(this.U.world, g.ox * dpr, g.oy * dpr, g.w * dpr, g.h * dpr);
		ctx.uniform3f(this.U.cam, t.tx * dpr, t.ty * dpr, t.z);
		ctx.uniform2f(this.U.tilt, this.tilt[0], this.tilt[1]);
		ctx.uniform1f(this.U.focus, this.focus);
		ctx.uniform1f(this.U.blur, this.blur);
		ctx.uniform1f(this.U.sky, g.wide ? clamp((t.z - 1) / 0.28, 0, 1) : 0);
		ctx.uniform2f(this.U.band, GEO.haze[0], GEO.haze[1]);
		ctx.uniform3f(this.U.dolly, fc.x, fc.y, dz);
		ctx.uniform3f(this.U.skyCol, sk[0] / 255, sk[1] / 255, sk[2] / 255);
		ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
		this.view = { tilt: this.tilt, focus: this.focus, foc: [fc.x, fc.y], dolly: dz };
	}
	// the loop: eases the tilt toward its aim and the focus toward the camera's, while either is moving
	private loop = () => {
		const t = this.cam.t(),
			c = this.cam.get();
		const f = this.map ? this.map.at([c.x, c.y]) : 0.6,
			fb = clamp((t.z - 1) / 0.45, 0, 1) * 2.4,
			k = this.reduce ? 1 : 0.14;
		this.tilt = [this.tilt[0] + (this.want[0] - this.tilt[0]) * k, this.tilt[1] + (this.want[1] - this.tilt[1]) * k];
		this.focus += (f - this.focus) * (this.reduce ? 1 : 0.12);
		this.blur += (fb - this.blur) * (this.reduce ? 1 : 0.12);
		this.want = [this.want[0] * 0.9, this.want[1] * 0.9];
		if (this.hover) this.want = [this.hover[0], this.hover[1]];
		this.draw();
		this.cam.viewChanged();
		const moving =
			Math.abs(this.want[0] - this.tilt[0]) + Math.abs(this.want[1] - this.tilt[1]) > 1e-5 ||
			Math.abs(f - this.focus) > 1e-3 ||
			Math.abs(fb - this.blur) > 1e-3 ||
			Math.abs(this.want[0]) + Math.abs(this.want[1]) > 1e-5;
		this.raf = moving ? requestAnimationFrame(this.loop) : 0;
	};
	kick() {
		if (!this.raf) this.raf = requestAnimationFrame(this.loop);
	}
	/** the pointer tilts the town (desktops); a swipe sways it (touch screens); never under reduced motion */
	follow(el: HTMLElement) {
		if (this.reduce) return () => {};
		let last: Pt | null = null;
		const mv = (e: PointerEvent) => {
			const r = el.getBoundingClientRect(),
				x = (e.clientX - r.left) / r.width - 0.5,
				y = (e.clientY - r.top) / r.height - 0.5;
			if (e.pointerType === 'mouse') this.hover = [x * 0.03, y * 0.018];
			else if (last)
				this.want = [
					clamp(this.want[0] + (e.clientX - last[0]) * 0.0006, -0.03, 0.03),
					clamp(this.want[1] + (e.clientY - last[1]) * 0.0004, -0.02, 0.02)
				];
			last = [e.clientX, e.clientY];
			this.kick();
		};
		const lv = () => {
			this.hover = null;
			this.want = [0, 0];
			last = null;
			this.kick();
		};
		const up = () => {
			last = null;
		};
		el.addEventListener('pointermove', mv);
		el.addEventListener('pointerleave', lv);
		el.addEventListener('pointerup', up);
		return () => {
			el.removeEventListener('pointermove', mv);
			el.removeEventListener('pointerleave', lv);
			el.removeEventListener('pointerup', up);
		};
	}
	destroy() {
		cancelAnimationFrame(this.raf);
		this.off.forEach((f) => f());
		this.ctx.getExtension('WEBGL_lose_context')?.loseContext();
	}
}
