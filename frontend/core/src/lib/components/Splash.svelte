<script lang="ts">
	import { onMount } from 'svelte';
	import { ease, motionMs, prefersReducedMotion } from '../motion';
	import Mark from './Mark.svelte';
	import Wordmark from './Wordmark.svelte';
	import WorkspaceMark, { type Workspace } from './WorkspaceMark.svelte';

	// the splash: shown once a session, tap to skip; reduced motion arrives already drawn (the kit's Splash)
	type Props = { ondone?: () => void; hold?: number; workspace?: Workspace & { name: string } };
	let { ondone, hold = 2300, workspace }: Props = $props();
	const reduce = prefersReducedMotion.current;
	let leaving = $state(false);
	onMount(() => {
		const t = setTimeout(() => (leaving = true), reduce ? 600 : hold);
		return () => clearTimeout(t);
	});

	const away = (_node: Element) => ({
		duration: motionMs(450),
		easing: ease,
		css: (t: number) => `opacity: ${t}; transform: scale(${1.04 - 0.04 * t})`
	});
	const rise = (_: Element, { delay = 0, y = 8 } = {}) => ({
		delay: reduce ? 0 : delay,
		duration: motionMs(500),
		css: (t: number) => `opacity: ${t}; transform: translateY(${y * (1 - t)}px)`
	});
</script>

{#if !leaving}
	<!-- tapping anywhere skips it; it ends by itself, so it needs no key of its own -->
	<div class="splash" role="presentation" onclick={() => (leaving = true)} out:away onoutroend={() => ondone?.()}>
		<div class="ground" aria-hidden="true"></div>
		<div class="sp-inner">
			<Mark size={112} play />
			<Wordmark size={34} play />
			<div class="stack tight" style="justify-items: center" in:rise|global={{ delay: 1150 }}>
				<span class="sp-tag">Every near-expiry carton gets a second chance, chosen by AI.</span>
				<span class="sp-hi">हर कार्टन को दूसरा मौका</span>
			</div>
			{#if workspace}<div class="sp-ws" in:rise|global={{ delay: 1450, y: 0 }}>
					<WorkspaceMark ws={workspace} size={26} /><span><b>{workspace.name}</b> workspace</span>
				</div>{/if}
		</div>
		<span class="sp-skip">Tap to skip</span>
	</div>
{/if}
