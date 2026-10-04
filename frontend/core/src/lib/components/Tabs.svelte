<script lang="ts" generics="T extends string">
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import type { IconName } from '../icons/registry';
	import { SPRINGS } from '../motion';
	import { slideThumb } from '../motion/thumb';
	import Badge from './Badge.svelte';

	type Tab = { id: T; label: string; icon?: IconName; badge?: string | number };
	let {
		tabs,
		value = $bindable(),
		onchange,
		class: className
	}: { tabs: Tab[]; value: T; onchange?: (id: T) => void; class?: string } = $props();

	let root: HTMLElement | undefined = $state();
	let last: number | undefined;
	$effect(() => {
		const i = tabs.findIndex((t) => t.id === value);
		const prev = last;
		last = i;
		if (root && prev != null && prev !== i && i >= 0)
			slideThumb(root.querySelectorAll<HTMLElement>(':scope > .tab-btn'), prev, i, '.tab-thumb', SPRINGS.tabs);
	});
</script>

<div bind:this={root} class={cx('tabs', className)} role="tablist">
	{#each tabs as t (t.id)}<button
			type="button"
			role="tab"
			aria-selected={value === t.id}
			class="tab-btn"
			onclick={() => {
				value = t.id;
				onchange?.(t.id);
			}}
			>{#if value === t.id}<span class="tab-thumb"></span>{/if}{#if t.icon}<Icon name={t.icon} size={16} />{/if}<span
				>{t.label}</span
			>{#if t.badge}<Badge size="sm" tone="amber">{t.badge}</Badge>{/if}</button
		>{/each}
</div>
