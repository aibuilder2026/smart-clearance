<script lang="ts">
	import { cx } from '../cx';
	import Roll from './Roll.svelte';

	type Props = {
		value: number;
		size?: 's' | 'm' | 'l' | 'xl';
		roll?: boolean;
		from?: number;
		decimals?: boolean;
		tone?: string;
		class?: string;
		style?: string;
		showSign?: boolean;
	};
	let { value, size, roll, from, decimals, tone, class: className, style, showSign = true }: Props = $props();

	// Monzo-style money: the rupee sign and paise set small beside heavy numerals; read out whole from hidden text
	const neg = $derived(value < 0);
	const abs = $derived(Math.abs(value));
	const int = $derived(decimals ? Math.floor(abs + 1e-9) : Math.round(abs));
	const paise = $derived(decimals ? Math.round((abs - Math.floor(abs + 1e-9)) * 100) : 0);
	const spoken = $derived(
		(neg ? 'minus ' : '') + '₹' + abs.toLocaleString('en-IN', { maximumFractionDigits: decimals ? 2 : 0 })
	);
</script>

<span class={cx('num money', size, tone, className)} {style}
	><span class="sr-only">{spoken}</span>{#if neg && showSign}<span class="sign" aria-hidden="true">−</span>{/if}<span
		class="cur"
		aria-hidden="true">₹</span
	>{#if roll}<Roll value={int} {from} hidden />{:else}<span aria-hidden="true">{int.toLocaleString('en-IN')}</span
		>{/if}{#if decimals}<span class="dec" aria-hidden="true">.{String(paise).padStart(2, '0')}</span>{/if}</span
>
