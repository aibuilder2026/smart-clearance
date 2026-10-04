<script lang="ts" generics="T extends string">
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import type { IconName } from '../icons/registry';
	import { SPRINGS, motionMs, springCurve } from '../motion';

	type Option = { id: T; label: string; icon?: IconName };
	type Props = {
		options: Option[];
		value: T;
		onchange?: (id: T) => void;
		size?: 'sm';
		label: string;
		class?: string;
	};
	let { options, value = $bindable(), onchange, size, label, class: className }: Props = $props();

	let root: HTMLElement | undefined = $state();
	let last: number | undefined;
	const curve = springCurve(SPRINGS.segmented);

	// the thumb slides from the old choice to the new one (framer's shared layout in the prototype, as FLIP here)
	$effect(() => {
		const i = options.findIndex((o) => o.id === value);
		const prev = last;
		last = i;
		if (!root || prev == null || prev === i || i < 0) return;
		const buttons = root.querySelectorAll<HTMLElement>(':scope > .seg');
		const from = buttons[prev],
			to = buttons[i];
		const thumb = to?.querySelector<HTMLElement>('.seg-thumb');
		if (!from || !to || !thumb) return;
		const duration = motionMs(curve.duration);
		if (!duration) return;
		const dx = from.offsetLeft - to.offsetLeft;
		const sx = from.offsetWidth / to.offsetWidth;
		const steps = 24;
		thumb.animate(
			Array.from({ length: steps + 1 }, (_, k) => {
				const p = curve.easing(k / steps);
				return {
					transform: `translateX(${dx * (1 - p)}px) scaleX(${sx + (1 - sx) * p})`,
					transformOrigin: 'left center'
				};
			}),
			{ duration }
		);
	});

	const pick = (id: T) => {
		value = id;
		onchange?.(id);
	};
</script>

<div bind:this={root} class={cx('segmented', size, className)} role="group" aria-label={label}>
	{#each options as o (o.id)}<button type="button" class="seg" aria-pressed={value === o.id} onclick={() => pick(o.id)}
			>{#if value === o.id}<span class="seg-thumb"></span>{/if}{#if o.icon}<Icon
					name={o.icon}
					size={15}
				/>{/if}{o.label}</button
		>{/each}
</div>
