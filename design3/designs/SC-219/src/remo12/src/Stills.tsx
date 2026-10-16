// SC-219 cut 12's concept round: the later beats of concepts A and C as stills, so the board shows each concept's whole
// story: Gemini (the agents' two models) and the guardrails with a person's yes.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { ActTitle, Finish, INK, IndexBar, Note, Icon } from './lib/base';

const Plate: React.FC<{ name: string }> = ({ name }) => <Img src={staticFile(`plates/${name}.jpg`)} style={{ position: 'absolute', width: 1920, height: 1080 }} />;
const Tag: React.FC<{ x: number; y: number; text: string; sub?: string; ink: string }> = ({ x, y, text, sub, ink }) => (
	<div style={{ position: 'absolute', left: x, top: y, translate: '-50% -50%', display: 'flex', gap: 8, alignItems: 'center', padding: '8px 13px', borderRadius: 999, font: "650 16px/1 'Geist'", color: '#eef2ff', background: 'rgba(6,6,14,0.82)', border: `1.3px solid ${ink}`, whiteSpace: 'nowrap', boxShadow: '0 10px 26px rgba(0,0,0,0.5)' }}>
		<i style={{ width: 8, height: 8, borderRadius: '50%', background: ink, display: 'inline-block' }} />{text}{sub && <small style={{ font: "500 13.5px/1 'Geist'", color: '#a8b0c8' }}>{sub}</small>}
	</div>
);
const Bracket: React.FC<{ x0: number; y0: number; x1: number; y1: number; ink: string; glow?: boolean }> = ({ x0, y0, x1, y1, ink, glow }) => {
	const L = 34; const c = [[x0, y0, 1, 1], [x1, y0, -1, 1], [x1, y1, -1, -1], [x0, y1, 1, -1]];
	return (
		<svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
			{glow && <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={ink} opacity={0.12} style={{ mixBlendMode: 'screen' }} />}
			{c.map(([x, y, sx, sy], i) => <path key={i} d={`M ${x + sx * L} ${y} L ${x} ${y} L ${x} ${y + sy * L}`} fill="none" stroke={ink} strokeWidth={3.5} strokeLinecap="round" />)}
		</svg>
	);
};
// a still has no time; each part is shown as it stands once its word has passed
const AT = 40;

export const AStillGemini: React.FC = () => (
	<AbsoluteFill style={{ background: '#000' }}>
		<Plate name="dc-a3-tpu" />
		<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 40%)' }} />
		<Bracket x0={1075} y0={150} x1={1470} y1={1000} ink={INK.violet} glow />
		<Bracket x0={735} y0={230} x1={1040} y1={950} ink={INK.blue} glow />
		<Tag x={1272} y={128} text="Gemini 3.1 Pro" sub="prices and negotiates" ink={INK.violet} />
		<Tag x={888} y={206} text="Gemini 3.8 Flash" sub="reads and writes" ink={INK.blue} />
		<div style={{ position: 'absolute', left: 84, top: 612 }}><Note id="gemini" t0={-10} t1={99} x={0} y={0} width={560} /></div>
		<ActTitle k="The agents" n="2 / 3" h="Nine AI agents. Two Gemini models." t0={-10} t1={99} />
		<IndexBar t0={-10} at={AT * 0 + 22.1} />
		<Finish vignette={0.45} />
	</AbsoluteFill>
);

export const AStillYes: React.FC = () => (
	<AbsoluteFill style={{ background: '#000' }}>
		<Plate name="dc-a4-cage" />
		<Bracket x0={530} y0={110} x1={880} y1={990} ink={INK.amber} glow />
		<svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
			<circle cx={705} cy={540} r={74} fill="rgba(20,14,2,0.7)" stroke={INK.amber} strokeWidth={3} />
		</svg>
		<div style={{ position: 'absolute', left: 705, top: 540, translate: '-50% -50%', color: INK.amber }}><Icon name="shield-check" size={64} color={INK.amber} /></div>
		<Tag x={705} y={656} text="The reserve stays in the API" ink={INK.amber} />
		<div style={{ position: 'absolute', left: 1290, top: 130 }}><Note id="shield" t0={-10} t1={99} x={0} y={0} width={560} /></div>
		<div style={{ position: 'absolute', left: 1330, top: 520, width: 470, borderRadius: 18, overflow: 'hidden', border: '1.5px solid rgba(247,192,74,0.8)', boxShadow: '0 0 40px rgba(247,192,74,0.35), 0 26px 60px rgba(0,0,0,0.6)' }}>
			<Img src={staticFile('img/app-approve.webp')} style={{ width: '100%', display: 'block' }} />
		</div>
		<Tag x={1565} y={880} text="A person's yes" sub="Priya approves the plan" ink={INK.amber} />
		<ActTitle k="Guardrails" n="3 / 3" h="The models never touch the money." t0={-10} t1={99} />
		<IndexBar t0={-10} at={32.1} />
		<Finish vignette={0.45} />
	</AbsoluteFill>
);

const BigStill: React.FC<{ k: string; h: string; spec: string; tone: string; x?: number; y?: number }> = ({ k, h, spec, tone, x = 96, y = 640 }) => (
	<div style={{ position: 'absolute', left: x, top: y }}>
		<div style={{ display: 'flex', alignItems: 'center', gap: 14, font: "700 16px/1 'Geist'", letterSpacing: 3.6, textTransform: 'uppercase', color: tone }}>
			<span style={{ width: 46, height: 2, background: tone, display: 'inline-block' }} />{k}
		</div>
		<h1 style={{ margin: '14px 0 0', font: "700 120px/0.98 'Bricolage Grotesque'", letterSpacing: -4.2, whiteSpace: 'nowrap', color: INK.ink }}>{h}</h1>
		<div style={{ marginTop: 18, maxWidth: 640, font: "500 21px/1.4 ui-monospace, 'SF Mono', Menlo, monospace", color: INK.ink2 }}>{spec}</div>
	</div>
);

export const CStillGemini: React.FC = () => (
	<AbsoluteFill style={{ background: '#000' }}>
		<Plate name="dc-c3-tpu" />
		<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 32%, rgba(0,0,0,0) 55%)' }} />
		<BigStill k="Google's Agent Platform" h="Gemini." spec="the models the nine AI agents think with · structured output · three tries, then a safe fallback" tone={INK.violet} y={300} />
		<div style={{ position: 'absolute', left: 96, top: 640, display: 'flex', flexDirection: 'column', gap: 14 }}>
			{[['Gemini 3.1 Pro', 'prices and negotiates', 'Valuer · Router · Negotiator', INK.violet], ['Gemini 3.8 Flash', 'reads and writes', 'Data · Vision · Outreach · Lister · Paperwork · Impact', INK.blue], ['Plain code', 'no model', 'the Watcher: rules on BigQuery', '#9aa69f']].map(([a, b, c, ink]) => (
				<div key={a} style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
					<span style={{ font: "700 15px/1 'Geist'", padding: '7px 11px', borderRadius: 999, border: `1.4px solid ${ink}`, color: '#f2ecff', whiteSpace: 'nowrap' }}>{a}</span>
					<span style={{ font: "600 19px/1 'Geist'", color: INK.ink }}>{b}</span>
					<span style={{ font: "500 15px/1 ui-monospace, 'SF Mono', Menlo, monospace", color: INK.ink3 }}>{c}</span>
				</div>
			))}
		</div>
		<div style={{ position: 'absolute', left: 76, top: 40, opacity: 0.95 }}><ActTitle k="The agents" n="2 / 3" h="Nine AI agents. Two Gemini models." t0={-10} t1={99} inline size={44} /></div>
		<IndexBar t0={-10} at={22.1} />
		<Finish vignette={0.5} />
	</AbsoluteFill>
);

export const CStillYes: React.FC = () => (
	<AbsoluteFill style={{ background: '#000' }}>
		<Plate name="dc-c4-vault" />
		<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 42%, rgba(0,0,0,0) 62%)' }} />
		<svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
			{[0, 1, 2].map((i) => <circle key={i} cx={921} cy={482} r={34 + i * 40} fill="none" stroke={INK.ring} strokeWidth={2.5 - i * 0.6} opacity={0.8 - i * 0.25} />)}
		</svg>
		<Tag x={921} y={360} text="Approved · the agents set off" ink={INK.ring} />
		<BigStill k="Guardrails" h="Never the money." spec="the reserve never reaches a model · the API works out every figure · ₹16,917.10 · a person says yes" tone={INK.amber} y={640} />
		<div style={{ position: 'absolute', left: 76, top: 40 }}><ActTitle k="Guardrails" n="3 / 3" h="The models never touch the money." t0={-10} t1={99} inline size={44} /></div>
		<IndexBar t0={-10} at={32.1} />
		<Finish vignette={0.5} />
	</AbsoluteFill>
);
