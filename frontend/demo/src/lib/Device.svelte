<script lang="ts">
	import { AppRoot, Avatar, cx, NoticeHost, PhoneFrame, WindowFrame } from '@smart-clearance/core';
	import {
		D,
		HOME,
		LockScreen,
		RoleApp,
		SignIn,
		store,
		WS,
		type Route,
		type User
	} from '@smart-clearance/core/workspace';
	import { DEVICE, PLACE, PREFILL, type DeviceSpec } from './stages.ts';

	// a device on the demo's stage (director.jsx Device): the person's app at a screen, their sign-in, or their lock
	// screen, in a laptop's browser window or a phone, scaled to fit. Its label says whose it is, and "their move" when
	// the beat is theirs
	type Props = {
		kind: 'desk' | 'phone';
		spec: DeviceSpec;
		lockOpen?: boolean;
		onlockopen?: () => void;
		onsignedin: (uid: string) => void;
		time: string;
		date: string;
		scale: number;
		focus?: boolean;
		amber?: boolean;
		route: Route | null;
		onroute: (r: Route) => void;
		/** the laptop's window, before scaling */
		width?: number;
		height?: number;
	};
	let {
		kind,
		spec,
		lockOpen,
		onlockopen,
		onsignedin,
		time,
		date,
		scale,
		focus,
		amber,
		route,
		onroute,
		width = 1280,
		height = 800
	}: Props = $props();

	// someone in the store (with their role and sign-in), or in the story
	const me = $derived((store.state.users.find((u) => u.id === spec.who) || D.people[spec.who ?? '']) as User);
	const lock = $derived(spec.lock && !lockOpen ? spec.lock : null);
	let screen: HTMLDivElement | undefined = $state();

	// scroll to an anchor when the director asks for one, once the screen has drawn
	const anchorKey = $derived(`${spec.anchor}|${spec.who}|${route?.name}|${!!lock}|${store.state.hero.phase}`);
	$effect(() => {
		void anchorKey;
		const anchor = spec.anchor;
		if (!anchor || lock) return;
		const t = setTimeout(() => {
			const root = screen;
			const el = root?.querySelector(`[data-anchor="${anchor}"]`);
			const sc = root?.querySelector('.scroll');
			if (el && sc)
				sc.scrollTo({
					top: Math.max(0, el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 64),
					behavior: 'smooth'
				});
		}, 420);
		return () => clearTimeout(t);
	});

	const url = $derived(
		me.role === 'buyer'
			? 'https://expiresoon.example/l/ES-24117'
			: `https://${WS.domain}/${spec.signin ? 'sign-in' : route?.name || HOME[me.role]}`
	);
</script>

{#snippet app()}
	{#if lock}<LockScreen who={lock.who} push={lock.push} {time} {date} onopen={onlockopen} />
	{:else if spec.signin}<NoticeHost resetKey={'in-' + spec.who}
			>{#key spec.signin}<SignIn guided prefill={PREFILL[spec.signin]} onsignin={onsignedin} />{/key}</NoticeHost
		>
	{:else}<NoticeHost resetKey={spec.who}
			>{#key me.id}<RoleApp
					{me}
					{route}
					ongo={(r) => onroute({ name: r.name, params: r.params })}
					onback={() => onroute({ name: HOME[me.role] })}
				/>{/key}</NoticeHost
		>
	{/if}
{/snippet}

{#snippet label()}
	<div class={cx('dev-label', focus && 'focus', focus && amber && 'amber')}>
		<Avatar person={me} size="sm" /><span
			><b>{DEVICE[spec.who ?? ''] || me.short} {kind === 'phone' ? 'phone' : 'laptop'}</b><span
				>{PLACE[spec.who ?? ''] || me.org}</span
			></span
		>
	</div>
{/snippet}

{#if kind === 'phone'}
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
				<PhoneFrame {time} dark={!!lock}>{@render app()}</PhoneFrame>
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
