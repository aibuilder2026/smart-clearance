<script lang="ts">
	import { AppRoot, Avatar, cx, NoticeHost, PhoneFrame, WindowFrame } from '@smart-clearance/core';
	import { HOME, LockScreen, RoleApp, SignIn, store, WS, type Route } from '@smart-clearance/core/workspace';
	import { untrack } from 'svelte';
	import { LABEL, PLACE, PREFILL, user } from './people.ts';
	import type { DeviceSpec } from './types.ts';

	// a person's device on the demo's stage (director.jsx Device): their app at a screen (with its batch and tab), their
	// sign-in, or their lock screen with a push, in a laptop's browser window or a phone, scaled to fit; bare, the app
	// fills a real phone's screen. Its label says whose it is, and "their move" when the beat is theirs. The visitor can
	// wander off in it; a new beat points it back at the beat's screen
	type Props = {
		kind: 'desk' | 'phone' | 'bare';
		spec: DeviceSpec;
		time: string;
		date: string;
		scale?: number;
		focus?: boolean;
		amber?: boolean;
		/** the push opened, or the sign-in made */
		ontap: () => void;
		/** the laptop's window, before scaling */
		width?: number;
		height?: number;
	};
	let { kind, spec, time, date, scale = 1, focus, amber, ontap, width = 1280, height = 800 }: Props = $props();

	const me = $derived(user(spec.who ?? ''));
	// the beat's screen, by its values (a new beat is a new object even when it says the same); a beat that points the
	// device at a new screen draws it afresh, since the ledger reads its reading and a batch page its tab as they open
	const key = $derived(`${spec.who}|${spec.route}|${JSON.stringify(spec.params ?? {})}`);
	const beatRoute = (): Route => ({ name: spec.route ?? '', params: { ...(spec.params ?? {}) } });
	let route = $state<Route>(untrack(beatRoute));
	$effect(() => {
		void key;
		route = untrack(beatRoute);
	});
	const go = (r: Route) => (route = { name: r.name, params: r.params });

	// scroll to the section the beat is about, once the screen has drawn (the device is scaled: measure in its pixels)
	let screen: HTMLDivElement | undefined = $state();
	const anchorKey = $derived(`${spec.anchor}|${key}|${!!spec.lock}|${store.state.hero.phase}`);
	$effect(() => {
		void anchorKey;
		const anchor = spec.anchor;
		if (!anchor || spec.lock) return;
		const t = setTimeout(() => {
			const root = screen;
			const el = root?.querySelector(`[data-anchor="${anchor}"]`);
			const sc = root?.querySelector('.scroll');
			if (!el || !sc) return;
			const k = sc.getBoundingClientRect().height / (sc.clientHeight || 1) || 1;
			sc.scrollTo({
				top: Math.max(0, (el.getBoundingClientRect().top - sc.getBoundingClientRect().top) / k + sc.scrollTop - 64),
				behavior: 'smooth'
			});
		}, 420);
		return () => clearTimeout(t);
	});

	const path = $derived(
		spec.signin
			? 'sign-in'
			: [route.name || HOME[me.role], route.params?.ref].filter(Boolean).join('/') +
					(route.params?.tab
						? '?tab=' + route.params.tab
						: route.params?.reading
							? '?reading=' + route.params.reading
							: '')
	);
	const url = $derived(me.role === 'buyer' ? 'https://expiresoon.example/l/ES-24117' : `https://${WS.domain}/${path}`);
</script>

{#snippet app()}
	{#if spec.lock}<LockScreen who={spec.lock.who} push={spec.lock.push} {time} {date} onopen={ontap} />
	{:else if spec.signin}<NoticeHost resetKey={'in-' + spec.who}
			>{#key spec.signin}<SignIn guided prefill={PREFILL[String(spec.signin)]} onsignin={ontap} />{/key}</NoticeHost
		>
	{:else}<NoticeHost resetKey={spec.who}
			>{#key key}<RoleApp {me} {route} ongo={go} onback={() => go({ name: HOME[me.role] })} />{/key}</NoticeHost
		>
	{/if}
{/snippet}

{#snippet label()}
	<div class={cx('dev-label', focus && 'focus', focus && amber && 'amber')}>
		<Avatar person={me} size="sm" /><span
			><b>{LABEL[spec.who ?? ''] || me.short} {kind === 'phone' ? 'phone' : 'laptop'}</b><span
				>{PLACE[spec.who ?? ''] || me.org}</span
			></span
		>
	</div>
{/snippet}

{#if kind === 'bare'}
	<AppRoot embedded class="real-app" style="--safe-top: calc(env(safe-area-inset-top, 0px) + 60px)"
		><div bind:this={screen} style="position: absolute; inset: 0">{@render app()}</div></AppRoot
	>
{:else if kind === 'phone'}
	<div class="dev" style="width: {414 * scale}px">
		{@render label()}
		<div
			class={cx('dev-ring', focus && 'on', amber && 'amber')}
			style="width: {414 * scale}px; height: {868 * scale}px; border-radius: {60 * scale}px"
		>
			<div
				bind:this={screen}
				style="width: 414px; height: 868px; transform: scale({scale}); transform-origin: top left"
			>
				<PhoneFrame {time} dark={!!spec.lock}>{@render app()}</PhoneFrame>
			</div>
		</div>
	</div>
{:else}
	<div class="dev" style="width: {width * scale}px">
		{@render label()}
		<div
			class={cx('dev-ring', focus && 'on', amber && 'amber')}
			style="width: {width * scale}px; height: {height * scale}px; border-radius: {14 * scale}px"
		>
			<div
				bind:this={screen}
				style="width: {width}px; height: {height}px; transform: scale({scale}); transform-origin: top left"
			>
				<WindowFrame {url} style="width: {width}px; height: {height}px"
					><AppRoot embedded style="position: absolute; inset: 0">{@render app()}</AppRoot></WindowFrame
				>
			</div>
		</div>
	</div>
{/if}
