<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import type { IconName } from '../../../icons/registry';
	import { SPRINGS } from '../../../motion';
	import { slideThumb } from '../../../motion/thumb';

	// a partner's page's own tabs, as the operator's batch page draws them (SC-112): the thumb slides from the tab shown
	// before to the one chosen
	type Props = {
		tabs: { id: string; label: string; icon: IconName }[];
		value: string;
		onchange: (id: string) => void;
		label: string;
	};
	let { tabs, value, onchange, label }: Props = $props();
	const app = useApp();
	let before = $state<string | null>(null);
	let track: HTMLElement | undefined = $state();
	$effect(() => {
		const a = tabs.findIndex((t) => t.id === before);
		const b = tabs.findIndex((t) => t.id === value);
		if (track && a >= 0 && b >= 0 && a !== b)
			slideThumb(track.querySelectorAll<HTMLElement>(':scope > .bh-tab'), a, b, '.bh-tab-thumb', SPRINGS.tabs);
	});
	const go = (id: string) => {
		before = value;
		onchange(id);
	};
</script>

<nav bind:this={track} class="bh-tabs" aria-label={label}>
	{#each tabs as t (t.id)}<button
			type="button"
			class="bh-tab"
			aria-current={t.id === value ? 'page' : undefined}
			onclick={() => go(t.id)}
			>{#if t.id === value}<span class="bh-tab-thumb"></span>{/if}{#if app.bp !== 'phone'}<Icon
					name={t.icon}
					size={16}
				/>{/if}<span>{t.label}</span></button
		>{/each}
</nav>
