<script lang="ts">
	import { onMount } from 'svelte';

	type Props = { length?: number; value?: string; onchange?: (v: string) => void; autofocus?: boolean };
	let { length = 6, value = $bindable(''), onchange, autofocus }: Props = $props();

	// one box a digit: typing moves on, Backspace on an empty box moves back, a pasted code fills them all
	const refs: HTMLInputElement[] = $state([]);
	const digits = $derived((value || '').padEnd(length, ' ').slice(0, length).split(''));
	onMount(() => {
		if (autofocus) refs[0]?.focus();
	});
	// a cleared code (a wrong one, wiped by its sign-in) starts again from the first box, if focus is in the boxes
	$effect(() => {
		if (!value && refs.includes(document.activeElement as HTMLInputElement)) refs[0]?.focus();
	});
	const commit = (v: string) => {
		value = v;
		onchange?.(v);
	};
	const set = (i: number, ch: string) => {
		const arr = (value || '').padEnd(length, ' ').split('');
		arr[i] = ch || ' ';
		commit(arr.join('').replace(/\s+$/, '').replace(/ /g, ''));
	};
</script>

<div class="otp" role="group" aria-label="One-time code">
	{#each digits as d, i (i)}<input
			bind:this={refs[i]}
			inputmode="numeric"
			autocomplete={i === 0 ? 'one-time-code' : 'off'}
			maxlength={1}
			aria-label="Digit {i + 1}"
			value={d.trim()}
			oninput={(e) => {
				const ch = e.currentTarget.value.replace(/\D/g, '').slice(-1);
				set(i, ch);
				e.currentTarget.value = ch;
				if (ch) refs[i + 1]?.focus();
			}}
			onkeydown={(e) => {
				if (e.key === 'Backspace' && !d.trim()) refs[i - 1]?.focus();
			}}
			onpaste={(e) => {
				const t = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, length);
				if (!t) return;
				e.preventDefault();
				commit(t);
				refs[Math.min(t.length, length - 1)]?.focus();
			}}
		/>{/each}
</div>
