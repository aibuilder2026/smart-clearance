<script lang="ts">
	import {
		AppRoot,
		cx,
		Icon,
		IconButton,
		Mark,
		ModeMenuButton,
		Sheet,
		Splash,
		Wordmark,
		WorkspaceMark
	} from '@smart-clearance/core';
	import {
		Agents,
		D,
		fastForward,
		HOME,
		LockScreen,
		provideAccount,
		RoleApp,
		run,
		SignIn,
		store,
		WS,
		type Route,
		type User
	} from '@smart-clearance/core/workspace';
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import Device from './Device.svelte';
	import Finale from './Finale.svelte';
	import Narration from './Narration.svelte';
	import StageBar from './StageBar.svelte';
	import { PREFILL, STAGES, type Beat } from './stages.ts';

	// the guided demo (design3/demo/director.jsx Director): Munchly's workspace on Smart-Clearance in nine stages, on a
	// laptop and a phone running the real screens, with the narration beside them. Each stage puts the store where that
	// stage begins and lets that stage's agents run; the visitor makes each person's move in a device, or with Next.
	// On a real phone the person in focus fills the screen under a slim bar. The data is the workspace app's stub: no
	// backend is called, and nothing is kept between visits
	provideAccount({}); // the demo has no account controls: no switching person, no sign-out, no install

	const user = (id: string) => (store.state.users.find((u) => u.id === id) || D.people[id]) as User;

	const fromHash = () => {
		const m = /stage=(\d)/.exec(location.hash);
		return m ? Math.min(8, Math.max(0, +m[1] - 1)) : 0;
	};
	let n = $state(fromHash());
	let ui = $state<Record<string, boolean>>({});
	let innerWidth = $state(window.innerWidth);
	let mode = $state<'phone' | 'stage'>(window.innerWidth < 768 ? 'phone' : 'stage');
	let notes = $state(window.innerWidth >= 768);
	let finale = $state(false);
	let playing = $state(false);
	let splash = $state(true);
	try {
		splash = !sessionStorage.getItem('sc3-demo-splash');
	} catch {
		/* storage blocked: show it */
	}
	let deskRoute = $state<Route | null>(null);
	let phoneRoute = $state<Route | null>(null);

	// the canvas's content box, which the devices are fitted into
	let canvas: HTMLElement | undefined = $state();
	let W = $state(0);
	let H = $state(0);
	$effect(() => {
		const el = canvas;
		if (!el) return;
		const ro = new ResizeObserver(([e]) => {
			W = e.contentRect.width;
			H = e.contentRect.height;
		});
		ro.observe(el);
		return () => ro.disconnect();
	});

	const real = $derived(innerWidth < 768);
	const cfg = $derived(STAGES[n]);
	const s = $derived(store.state);
	// a beat the visitor ticks by opening something (a push, the approval) is done too once a later beat of its stage is,
	// so a move made inside a device moves the notes on
	const beatDone = (b: Beat) =>
		b.ui ? !!ui[b.ui] || cfg.beats.slice(cfg.beats.indexOf(b) + 1).some((x) => !x.ui && !!x.done?.(s)) : !!b.done?.(s);
	const idx = $derived.by(() => {
		let i = 0;
		while (i < cfg.beats.length && beatDone(cfg.beats[i])) i++;
		return i;
	});
	const beat = $derived(cfg.beats[Math.min(idx, cfg.beats.length - 1)]);
	const deskSpec = $derived({ ...cfg.desk, ...beat.desk });
	const phoneSpec = $derived({ ...cfg.phone, ...beat.phone });
	const lockKey = $derived(phoneSpec.lock?.key);

	// a sign-in in a device completes this stage's sign-in beat for that person, even one tapped ahead of its turn
	function signedIn(uid: string) {
		const b = cfg.beats.find((x) => x.ui && /^in/.test(x.ui) && (x.desk?.signin === uid || x.phone?.signin === uid));
		if (b?.ui) ui = { ...ui, [b.ui]: true };
	}
	const opened = (key: string) => (ui = { ...ui, [key]: true });

	// enter a stage: put the world where that stage begins and let its agents run
	function enter(i: number) {
		Agents.auto = false;
		Agents.maxStage = i;
		Agents.setLive(true);
		fastForward(i);
		ui = {};
		n = i;
		finale = false;
		// the stage in the address (#stage=3), replacing the entry: a shallow change, nothing is loaded again
		goto('#stage=' + (i + 1), { replace: true, shallow: true, reset: false, state: {} }).catch(() => {
			/* before the router has started: the address catches up on the next stage */
		});
	}
	onMount(() => {
		untrack(() => enter(n));
		return () => Agents.setLive(false);
	});

	// follow the beat: point each device at its screen when the beat changes it (and only then, so a visitor who
	// wanders off in a device stays where they went)
	const deskKey = $derived(`${n}|${deskSpec.who}|${deskSpec.route}`);
	const phoneKey = $derived(`${n}|${phoneSpec.who}|${phoneSpec.route}|${!!(lockKey && ui[lockKey])}`);
	$effect(() => {
		void deskKey;
		deskRoute = { name: untrack(() => deskSpec.route) ?? '' };
	});
	$effect(() => {
		void phoneKey;
		phoneRoute = { name: untrack(() => phoneSpec.route) ?? '' };
	});

	function next() {
		if (finale) return;
		if (idx < cfg.beats.length) {
			const b = cfg.beats[idx];
			if (b.ui) ui = { ...ui, [b.ui]: true };
			if (b.run) b.run();
			else if (b.agent) {
				const st = Agents.nextStep(store.get());
				if (st && Agents.allowed(st.name)) {
					Agents.cancel();
					run(st.name, st.arg);
				}
			}
			return;
		}
		if (n < 8) enter(n + 1);
		else {
			finale = true;
			playing = false;
		}
	}
	function back() {
		if (finale) {
			finale = false;
			return;
		}
		enter(idx > 0 ? n : Math.max(0, n - 1));
	}
	function onkeydown(e: KeyboardEvent) {
		if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable]')) return;
		if (e.key === 'ArrowRight' || e.key === 'PageDown') {
			e.preventDefault();
			next();
		} else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
			e.preventDefault();
			back();
		} else if (/^[1-9]$/.test(e.key)) enter(+e.key - 1);
		else if (e.key === 'p' || e.key === 'P') mode = mode === 'phone' ? 'stage' : 'phone';
		else if (e.key === 'n' || e.key === 'N') notes = !notes;
	}
	// autoplay for a booth: human beats advance on a timer, agent beats run on their own
	$effect(() => {
		if (!playing) return;
		void s.seq;
		const b = cfg.beats[idx];
		if (b && b.agent && !b.run) return;
		const t = setTimeout(() => untrack(next), b ? 2600 : 2200);
		return () => clearTimeout(t);
	});

	const time = $derived(beat.time || '09:00');
	const date = $derived(beat.date || cfg.date);
	const focus = $derived(idx < cfg.beats.length ? beat.focus : null);
	const amber = $derived(!!cfg.amber && idx < cfg.beats.length);
	// fit the devices into the canvas
	const labelH = 50;
	const phoneOnly = $derived(mode === 'phone');
	const sp = $derived(Math.min(0.84, Math.max(0.3, (H - labelH - 8) / 868)));
	const winW = 1280;
	const avail = $derived(W - (phoneOnly ? 0 : 414 * sp + 40));
	const sw = $derived(Math.min(1, Math.max(0.3, avail / winW)));
	const winH = $derived(Math.max(640, (H - labelH - 8) / sw));
	const phoneFocusSpec = $derived(focus === 'desk' && phoneOnly ? deskSpec : phoneSpec);
	const phoneScale = $derived(phoneOnly ? Math.min(1.08, Math.max(0.3, (H - labelH - 8) / 868)) : sp);

	const leaveSplash = () => {
		splash = false;
		try {
			sessionStorage.setItem('sc3-demo-splash', '1');
		} catch {
			/* storage blocked */
		}
	};

	// while the finale is up, what it covers is inert, so Tab goes into the finale and never to a control hidden behind
	// it (WCAG 2.4.3, 2.4.11; SC-65's keyboard suite found the stage bar taking focus under it)
	let shell: HTMLElement | undefined = $state();
	$effect(() => {
		const el = shell;
		if (!el || !finale) return;
		const behind = [...el.children].filter((c) => !c.classList.contains('finale'));
		for (const c of behind) c.setAttribute('inert', '');
		return () => behind.forEach((c) => c.removeAttribute('inert'));
	});

	// on a real phone: the person in focus, full screen
	const realSpec = $derived(focus === 'desk' ? deskSpec : phoneSpec);
	const realMe = $derived(user(realSpec.who ?? ''));
	const realLock = $derived(realSpec.lock && !ui[realSpec.lock.key] ? realSpec.lock : null);
	const realDesk = $derived(realSpec === deskSpec);
	const setReal = (r: Route) => (realDesk ? (deskRoute = r) : (phoneRoute = r));
</script>

<svelte:window bind:innerWidth {onkeydown} />

{#if real}
	<div class="demo-real" bind:this={shell}>
		<div class="real-bar">
			<button type="button" class="iconbtn" aria-label="Back" onclick={back}
				><Icon name="chevron-left" size={22} /></button
			><button type="button" class="real-stage" onclick={() => (notes = !notes)}
				><span class="narr-n sm">{n + 1}</span><span class="stack tight" style="gap: 0"
					><b>{D.stages[n].title}</b><span
						>{user(realSpec.who ?? '').short || ''} · {beat.text.slice(0, 46)}{beat.text.length > 46 ? '…' : ''}</span
					></span
				></button
			><button type="button" class={cx('iconbtn real-next', beat.human && 'amber')} aria-label="Next" onclick={next}
				><Icon name="arrow-right" size={22} /></button
			>
		</div>
		<AppRoot embedded class="real-app" style="--safe-top: calc(env(safe-area-inset-top, 0px) + 60px)">
			{#if realLock}<LockScreen
					who={realLock.who}
					push={realLock.push}
					{time}
					{date}
					onopen={() => opened(realLock.key)}
				/>{:else if realSpec.signin}{#key realSpec.signin}<SignIn
						guided
						prefill={PREFILL[realSpec.signin]}
						onsignin={signedIn}
					/>{/key}{:else}{#key realMe.id}<RoleApp
						me={realMe}
						route={realDesk ? deskRoute : phoneRoute}
						ongo={(r) => setReal({ name: r.name, params: r.params })}
						onback={() => setReal({ name: HOME[realMe.role] })}
					/>{/key}{/if}
		</AppRoot>
		<Sheet open={notes && !splash} onclose={() => (notes = false)} title="Stage {n + 1} of 9" detent="medium"
			><Narration
				{n}
				beatIdx={Math.min(idx, cfg.beats.length - 1)}
				beatsDone={idx}
				onnext={next}
				onback={back}
				last={n === 8}
				compact
			/></Sheet
		>
		{#if finale}<Finale onrestart={() => enter(0)} onclose={() => (finale = false)} />{/if}
		{#if splash}<Splash workspace={WS} ondone={leaveSplash} />{/if}
	</div>
{:else}
	<div class={cx('demo', !notes && 'no-notes')} bind:this={shell}>
		<header class="demo-top">
			<span class="row tight demo-brand"
				><Mark size={30} /><Wordmark size={17} /><span class="demo-tag">Guided demo</span><span class="demo-ws"
					><WorkspaceMark ws={WS} size={20} /><span>{WS.name}</span></span
				></span
			>
			<StageBar {n} onjump={enter} />
			<span class="row tight demo-tools">
				<IconButton
					icon={playing ? 'pause' : 'play'}
					label={playing ? 'Pause autoplay' : 'Autoplay'}
					onclick={() => (playing = !playing)}
				/>
				<IconButton
					icon={phoneOnly ? 'monitor' : 'smartphone'}
					label={phoneOnly ? 'Laptop and phone' : 'Phone only'}
					onclick={() => (mode = mode === 'phone' ? 'stage' : 'phone')}
				/>
				<IconButton icon="presentation" label={notes ? 'Hide notes' : 'Show notes'} onclick={() => (notes = !notes)} />
				<ModeMenuButton />
				<IconButton icon="rotate-ccw" label="Restart" onclick={() => enter(0)} />
			</span>
		</header>
		<div class="demo-body">
			{#if notes}<Narration
					{n}
					beatIdx={Math.min(idx, cfg.beats.length - 1)}
					beatsDone={idx}
					onnext={next}
					onback={back}
					last={n === 8}
				/>{/if}
			<main class="demo-canvas" bind:this={canvas}>
				{#if W > 0}
					<div class="devices">
						{#if phoneOnly}{@render phone(phoneFocusSpec)}{:else}<Device
								kind="desk"
								spec={deskSpec}
								onsignedin={signedIn}
								{time}
								{date}
								scale={sw}
								width={winW}
								height={winH}
								focus={focus === 'desk'}
								{amber}
								route={deskRoute}
								onroute={(r) => (deskRoute = r)}
							/>{@render phone(phoneSpec)}{/if}
					</div>
				{/if}
			</main>
		</div>
		{#if finale}<Finale onrestart={() => enter(0)} onclose={() => (finale = false)} />{/if}
		{#if splash}<Splash workspace={WS} ondone={leaveSplash} />{/if}
	</div>
{/if}

{#snippet phone(spec: typeof phoneSpec)}
	{@const own = spec === phoneSpec}
	<Device
		kind="phone"
		{spec}
		lockOpen={!!(spec.lock && ui[spec.lock.key])}
		onlockopen={() => spec.lock && opened(spec.lock.key)}
		onsignedin={signedIn}
		{time}
		{date}
		scale={phoneScale}
		focus={focus === 'phone' || (phoneOnly && !!focus)}
		{amber}
		route={own ? phoneRoute : deskRoute}
		onroute={(r) => (own ? (phoneRoute = r) : (deskRoute = r))}
	/>
{/snippet}
