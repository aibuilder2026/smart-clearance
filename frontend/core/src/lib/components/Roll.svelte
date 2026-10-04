<script lang="ts">
	import { onMount } from 'svelte';
	import { cx } from '../cx';
	import { prefersReducedMotion } from '../motion';

	type Props = {
		value: number;
		format?: (v: number) => string;
		from?: number;
		class?: string;
		stagger?: number;
		/** the caller says the figure itself (Money does), so the digits stay silent */
		hidden?: boolean;
	};
	let { value, format, from, class: className, stagger = 40, hidden = false }: Props = $props();

	// odometer digits: each digit is a strip of 0-9 that rolls to its place when the value changes (--t-roll)
	const reduce = prefersReducedMotion.current;
	// svelte-ignore state_referenced_locally (a roll from a starting figure arms once, after mount)
	let armed = $state(from == null || reduce);
	onMount(() => {
		if (armed) return;
		const t = setTimeout(() => (armed = true), 90);
		return () => clearTimeout(t);
	});
	const text = $derived((format ?? ((v: number) => Math.round(v).toLocaleString('en-IN')))(value));
	const chars = $derived(text.split(''));
	const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
</script>

<span class={cx('roll', className)} aria-hidden={hidden ? 'true' : undefined}
	>{#if !hidden}<span class="sr-only">{text}</span
		>{/if}{#each chars as ch, i ((/\d/.test(ch) ? 'd' : 's') + (chars.length - i))}{#if /\d/.test(ch)}<span
				class="rd"
				aria-hidden="true"
				><span class="ghost">{ch}</span><span
					class="rs"
					style:transform="translateY({-(armed ? +ch : 0) * 0.98}em)"
					style:transition-delay={reduce ? '0ms' : `${(chars.length - i) * stagger}ms`}
					>{#each DIGITS as k (k)}<span>{k}</span>{/each}</span
				></span
			>{:else}<span aria-hidden="true">{ch}</span>{/if}{/each}</span
>
