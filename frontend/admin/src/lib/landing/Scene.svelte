<script lang="ts">
	import {
		GateChips,
		Icon,
		Money,
		Product,
		cx,
		ease,
		fmt,
		motionMs,
		prefersReducedMotion,
		rate,
		useApp,
		useTheme
	} from '@smart-clearance/core';
	import { animate } from 'motion';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { Figures } from './figures';
	import PhoneScreen from './PhoneScreen.svelte';
	import { PLATES } from './plates';
	import {
		AFTER,
		FLIGHT,
		H,
		LIST,
		NS,
		ORDER,
		OUT,
		PHONE,
		POST,
		REST,
		ROUTER,
		ROUTES,
		TAB_AR,
		TAGS,
		W,
		YES,
		YES_SHOT,
		ZOOM,
		camera,
		cover,
		dotsOf,
		holds,
		on,
		type AgentId,
		type Fit
	} from './scene';

	let { f }: { f: Figures } = $props();
	const sc = $derived(f.scene);
	const app = useApp();
	const theme = useTheme();
	const night = $derived(app.mounted && theme.resolved === 'dark');
	const desk = $derived(app.bp === 'desktop');
	const reduce = $derived(app.mounted && prefersReducedMotion.current);

	// The agents at work on the table, one in focus at a time (SC-60, round 2, option 2). The stage covers the plate;
	// what stands on the plate (its layer) follows it, and the camera moves them as one.
	let stage: HTMLElement | undefined = $state();
	let fit: Fit | null = $state(null);
	$effect(() => {
		const el = stage;
		const pan = desk ? 0.5 : 0.42;
		if (!el) return;
		const measure = () => (fit = cover(el.clientWidth, el.clientHeight, TAB_AR, pan, 0.5));
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	});

	// s: -1 before the tour, 0 to NS - 1 the agent at work, NS done. The server sends the scene done, as the page rests;
	// with motion on, and the table below the fold when the page starts, it waits for the reader, sets off once the
	// table is mostly in view, and holds while Pause is down or the table is out of view
	let s = $state(NS);
	let hold = $state(false);
	let run = $state(0);
	let seen = $state(false);
	// svelte-ignore state_referenced_locally (the counts start full, as the page rests)
	let got: Record<string, number> = $state({ kirana: f.scene.kiranas, expiresoon: f.scene.buyer });
	onMount(() => {
		const el = stage;
		if (!el || prefersReducedMotion.current || el.getBoundingClientRect().top < innerHeight) return;
		s = -1;
		got = { kirana: 0, expiresoon: 0 };
		const io = new IntersectionObserver((es) => (seen = es.some((e) => e.isIntersecting)), { threshold: 0.6 });
		io.observe(el);
		return () => io.disconnect();
	});
	$effect(() => {
		if (s === -1 && seen) s = 0;
	});
	$effect(() => {
		if (hold || !seen || s < 0 || s >= NS) return;
		const t = setTimeout(() => (s += 1), holds(ORDER[s]));
		return () => clearTimeout(t);
	});
	const go = (i: number) => {
		hold = true;
		s = i;
	};
	const replay = () => {
		hold = false;
		got = { kirana: 0, expiresoon: 0 };
		run += 1;
		s = 0;
	};
	const agent = $derived(s >= 0 && s < NS ? ORDER[s] : null);
	const done = $derived(s >= NS);
	const working = $derived(agent != null);
	const a = $derived(agent ? f.agents[agent] : null);
	const human = $derived(agent === 'you');

	// the camera: the whole table at rest; toward the agent at work, its post in the clear part of the stage above the
	// card. On phones and tablets the person's stop frames the phone's screen and the post together
	const cam = $derived(
		fit && agent
			? camera(fit, !desk && agent === 'you' ? YES_SHOT : POST[agent], desk ? ZOOM.desktop : ZOOM.other)
			: REST
	);
	const iz = $derived(1 / cam.sc);

	// the packs leave the phone for the shops as Outreach works, and for the buyer's truck as the Lister works; a dot is
	// about 50 packs. They run on until they arrive, whoever is working by then; Replay stops them
	const DOTS = $derived(dotsOf(sc.kiranas, sc.buyer));
	const dotEls: SVGCircleElement[] = [];
	const paths: Partial<Record<'kirana' | 'expiresoon', SVGPathElement>> = {};
	let sent: Record<string, boolean> = { kirana: false, expiresoon: false };
	let ctrls: { stop: () => void }[] = [];
	$effect(() => {
		if (s <= 0) sent = { kirana: false, expiresoon: false };
	});
	$effect(() => {
		void run;
		return () => {
			ctrls.forEach((c) => c.stop());
			ctrls = [];
		};
	});
	$effect(() => {
		const id = s === OUT ? 'kirana' : s === LIST ? 'expiresoon' : null;
		if (!id || sent[id] || prefersReducedMotion.current) return;
		sent[id] = true;
		const path = paths[id];
		if (!path) return;
		const total = path.getTotalLength();
		const mine = DOTS.map((d, i) => [d, i] as const).filter(([d]) => d === id);
		const packs = id === 'kirana' ? sc.kiranas : sc.buyer;
		let arrived = 0;
		mine.forEach(([, i], j) => {
			const c = dotEls[i];
			if (!c) return;
			ctrls.push(
				animate(0, 1, {
					duration: FLIGHT.duration,
					delay: FLIGHT.first + j * FLIGHT.every,
					ease: FLIGHT.ease,
					onUpdate: (v) => {
						const q = path.getPointAtLength(v * total);
						c.setAttribute('cx', String(q.x));
						c.setAttribute('cy', String(q.y));
						c.setAttribute('opacity', String(v < 0.06 ? v * 16 : v > 0.94 ? Math.max(0, (1 - v) * 16) : 1));
					},
					onComplete: () => {
						c.setAttribute('opacity', '0');
						arrived += 1;
						got = { ...got, [id]: Math.round((packs * arrived) / mine.length) };
					}
				})
			);
		});
	});
	$effect(() => {
		if (done) got = { kirana: sc.kiranas, expiresoon: sc.buyer };
	});

	// the phone's screen: the sheet at its real size, scaled into the plate's screen
	const mini = $derived.by(() => {
		const f = fit;
		if (!f) return null;
		return { ...on(f, PHONE), width: PHONE.w * f.pw, height: PHONE.h * f.ph, s: (PHONE.w * f.pw) / 360 };
	});
	const phase = $derived(done || s > YES ? 'placed' : s >= ROUTER ? 'plan' : 'building');
	const lit = $derived(done ? AFTER.length : s > YES ? s - YES : s + 1);

	// the places' tags: what each took
	const TAG_NAME: Record<string, string> = { kirana: 'Kiranas', expiresoon: 'A buyer elsewhere', dump: 'Landfill' };
	const tagLine = (id: string) =>
		id === 'kirana'
			? `${fmt.num(got.kirana)} of ${fmt.num(sc.kiranas)} packs · ${sc.shops} shops`
			: id === 'expiresoon'
				? `${fmt.num(got.expiresoon)} of ${fmt.num(sc.buyer)} packs · ${rate(sc.price)} a pack`
				: done
					? `${fmt.num(sc.kg)} kg kept out`
					: `the bin would cost ${fmt.inr(-sc.bin)}`;
	const tagIn = (id: string) => id !== 'dump' && got[id] > 0;
	const alt = $derived(
		`A ${night ? 'lamp-lit evening' : 'morning'} table by a window: a hand holds a phone over a handmade miniature of a snack trade, a tiny godown full of cartons, a lane of kirana shops, a wholesale warehouse with a blue truck, a community kitchen, a closed dump yard in the far corner, a steel tumbler of chai, and a thin glowing green path along the table.`
	);
</script>

{#snippet frag(id: AgentId)}
	{#if id === 'data'}<Product name="pack-snack-plain" size={56} /><span class="k"
			>{fmt.num(sc.units)} packs · selling <b>{sc.sellPerDay}</b> a day · <b>{sc.daysLeft}</b> days to the date</span
		>{:else if id === 'watcher'}<span class="num red">{fmt.num(sc.atRisk)}</span><span class="k"
			>packs won't sell in time</span
		><GateChips gates={sc.gates} size="sm" />{:else if id === 'vision'}<Product name="phone-scan" size={56} /><span
			class="k">One label photo from the godown · <b>the date matches</b> the export</span
		>{:else if id === 'valuer'}{#each sc.prices as p (p.id)}<span class="k"
				><i class="ex-dot {p.dot}" aria-hidden="true"></i>{p.name}
				<b style={p.bin ? 'color: var(--red-text)' : undefined}>{fmt.inr2(p.net)}</b></span
			>{/each}{:else if id === 'router'}<div class="m-split" aria-hidden="true">
			<span class="k" style:flex-grow={sc.kiranas}></span><span class="e" style:flex-grow={sc.buyer}></span>
		</div>
		<span class="k"
			><i class="ex-dot kirana" aria-hidden="true"></i><b>{fmt.num(sc.kiranas)}</b> to {sc.shops} kiranas</span
		><span class="k"><i class="ex-dot expiresoon" aria-hidden="true"></i><b>{fmt.num(sc.buyer)}</b> to one buyer</span
		>{:else if id === 'you'}<Money value={sc.planNet} /><span class="k"
			>on screen, against {fmt.inr(-sc.bin)} to destroy it</span
		><span class="btn btn-approve"><Icon name="check" size={16} />Approve · release the agents</span
		>{:else if id === 'outreach'}<span class="hi" lang="hi">{sc.offerTitle}</span><span class="k"
			>to <b>{sc.shops}</b> kiranas in Hindi · buy {sc.buy}, get {sc.free} free · 48 hours</span
		>{:else if id === 'lister'}<Product name="marketplace-bag" size={56} /><span class="k"
			><b>{fmt.num(sc.buyer)}</b> packs listed in the distributor's name · reserve {rate(sc.reserve)}</span
		>{:else if id === 'negotiator'}<span class="k">A bid of <b>{fmt.inr(sc.bid)}</b></span><Icon
			name="arrow-right"
			size={16}
		/><span class="k">countered to <b>{rate(sc.price)}</b>, accepted</span><span class="k"
			>· token <b>{fmt.inr(sc.token)}</b></span
		>{:else if id === 'paperwork'}<Product name="documents" size={56} /><span class="k"
			>The distributor's invoice · the brand's credit note <b>{fmt.inr(sc.support)}</b> · the GST memo</span
		>{:else}<span class="num">{fmt.num(sc.kg)} kg</span><span class="k"
			>kept out of landfill · <b>{fmt.inr(sc.net)}</b> recovered · 0 cartons destroyed</span
		>{/if}
{/snippet}

<!-- 3 · the agents at work on the table, one in focus at a time; the page's #agents -->
<section id="agents" class="sec-table" aria-labelledby="tb-h">
	<header class="tb-head">
		<h2 id="tb-h" class="sec-h plain">Five exits, one batch. Ten agents at work.</h2>
		<p class="sec-sub">{sc.lede}</p>
	</header>
	<div class={cx('tb-stage', working && 'working')} bind:this={stage}>
		<div class="tb-world" style="transform: translate({cam.tx}px, {cam.ty}px) scale({cam.sc})">
			<!-- the plate: cover-fit until the stage is measured, then sized to its own extent so the camera can travel to
			     its edges -->
			<img
				class="tb-plate"
				style={fit
					? `left: ${fit.x}px; top: ${fit.y}px; width: ${fit.pw}px; height: ${fit.ph}px`
					: `object-position: ${(desk ? 0.5 : 0.42) * 100}% 50%`}
				src={night ? PLATES.table.night : PLATES.table.day}
				{alt}
			/>
			{#if fit}
				<div class="tb-layer" style="left: {fit.x}px; top: {fit.y}px; width: {fit.pw}px; height: {fit.ph}px">
					<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
						<path bind:this={paths.kirana} class="tb-path" d={ROUTES.kirana} /><path
							bind:this={paths.expiresoon}
							class="tb-path"
							d={ROUTES.expiresoon}
						/>
						{#each DOTS as id, i (`${run}:${i}`)}<circle
								bind:this={dotEls[i]}
								class="tb-dot {id}"
								r="9"
								opacity="0"
							/>{/each}
					</svg>
					{#if mini}
						<div
							class="tb-mini"
							style="left: {mini.left}px; top: {mini.top}px; width: {mini.width}px; height: {mini.height}px; --s: {mini.s}"
							aria-hidden="true"
						>
							<div class="tb-mini-in"><PhoneScreen {f} {phase} {lit} /></div>
						</div>
					{/if}
					{#each TAGS as t (t.id)}{@const p = on(fit, t.at)}<span
							class={cx('tb-tag', t.id, tagIn(t.id) && 'in')}
							style="left: {p.left}px; top: {p.top}px; --iz: {iz}"
							aria-hidden="true"
							><span class="tb-tag-body"
								><b><i class="ex-dot {t.id === 'dump' ? 'bin' : t.id}"></i>{TAG_NAME[t.id]}</b><span
									>{tagLine(t.id)}</span
								></span
							><span class="stem"></span></span
						>{/each}
					{#each ORDER as id, i (id)}{@const ag = f.agents[id]}{@const p = on(fit, POST[id])}<span
							class={cx(
								'tb-node',
								i < s || done ? 'on' : i === s ? 'now on' : 'later',
								ag.human && 'human',
								POST[id].side === 'left' && 'left'
							)}
							style="left: {p.left}px; top: {p.top}px; --iz: {iz}"
							aria-hidden="true"
							><i class="dot"><Icon name={ag.icon} size={13} stroke={2.4} /></i><span class="name">{ag.name}</span
							></span
						>{/each}
				</div>
			{/if}
		</div>
		<div class="tb-shade" aria-hidden="true"></div>
		<ul class="sr-only" aria-label="The agents at their posts">
			{#each ORDER as id (id)}<li>{f.agents[id].name}, {f.agents[id].where}: {f.agents[id].did}</li>{/each}
		</ul>
		{#key agent}
			{#if a && agent}
				<div
					class={cx('tb-focus', human && 'human')}
					role="group"
					aria-live="polite"
					in:fly={{ y: 12, duration: motionMs(300), easing: ease }}
					out:fly={{ y: -8, duration: motionMs(300), easing: ease }}
				>
					<span class="icn" aria-hidden="true"><Icon name={a.icon} size={26} stroke={2} /></span>
					<header>
						<span class="n">{s + 1} of {NS}</span>
						<h3>{a.name}</h3>
						<span>{a.where}</span>
					</header>
					<p>{a.did}</p>
					<div class="frag">{@render frag(agent)}</div>
					{#if desk}
						<div class="rail" role="group" aria-label="The agents, in order">
							{#each ORDER as id, i (id)}<button
									type="button"
									class={cx(i < s && 'on', f.agents[id].human && 'human')}
									aria-current={i === s ? 'step' : undefined}
									onclick={() => go(i)}
									><i aria-hidden="true"><Icon name={f.agents[id].icon} size={10} stroke={2.4} /></i>{f.agents[id]
										.name}</button
								>{/each}
						</div>
					{/if}
				</div>
			{/if}
		{/key}
		{#if done}
			<div class="tb-result" role="status">
				<b>Sold, not binned.</b><span class="did">{sc.result}</span>{#if !reduce}<button
						type="button"
						class="replay"
						onclick={replay}><Icon name="rotate-ccw" size={16} />Replay</button
					>{/if}
			</div>
		{/if}
		{#if !reduce && working}
			<div class="tb-ctl">
				<button type="button" class="replay" aria-pressed={hold} onclick={() => (hold = !hold)}
					><Icon name={hold ? 'play' : 'pause'} size={16} />{hold ? 'Play' : 'Pause'}</button
				>
			</div>
		{/if}
	</div>
</section>
