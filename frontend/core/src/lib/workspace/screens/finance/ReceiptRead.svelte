<script lang="ts">
	import { cx } from '../../../cx';
	import Icon from '../../../icons/Icon.svelte';
	import { fmt } from '../../model';
	import type { StaffReceipt } from '../../types';
	import Photo from '../common/Photo.svelte';
	import ReceiptSheet from './ReceiptSheet.svelte';
	import { recWhen } from '../record/record';

	// what Vision read of a staff sale's consolidated receipt (SC-174, option A; screens/finance.jsx ReceiptRead): the
	// payments, their total and span, and whether it is what was counted; the UPI references on request. `whose`: "your"
	// for the distributor, else the count is the distributor's
	let {
		r,
		count,
		price,
		src = null,
		whose
	}: { r: StaffReceipt; count: number; price: number; src?: string | null; whose?: 'your' } = $props();
	let open = $state(false);
	let big = $state(false);
	const ok = $derived(Math.abs(r.paid - count * price) < 0.5);
</script>

<div class={cx('rcpt-read', ok ? 'ok' : 'bad')}>
	{#if src}<ReceiptSheet bind:open={big} {r} {src} />{/if}
	<div class="row" style="gap: 12px; align-items: flex-start">
		{#if src}<button type="button" class="rcpt-thumb" aria-label="Open the receipt {r.no}" onclick={() => (big = true)}
				><Photo {src} alt="" /><span class="rcpt-zoom" aria-hidden="true"
					><Icon name="zoom-in" size={14} stroke={2.2} /></span
				></button
			>{/if}
		<div class="stack tight grow" style="gap: 4px; min-width: 0">
			<span class="t-caption subtle">Vision read {r.no}</span>
			<b>{r.payments.length} UPI payments · {fmt.inr2(r.paid)}</b>
			<span class="t-footnote muted">{recWhen(r.from)} to {recWhen(r.to)}</span>
			{#if ok}<span class="rcpt-tick"
					><Icon name="check" size={14} stroke={2.4} />{fmt.num(count)} packs × ₹{price} · matches {whose === 'your'
						? 'your'
						: 'the'} count</span
				>{:else}<span class="rcpt-tick bad"
					><Icon name="triangle-alert" size={14} stroke={2.2} />{fmt.inr2(r.paid)} is {fmt.num(
						Math.floor(r.paid / price + 1e-9)
					)} packs at ₹{price}, not {fmt.num(count)}</span
				>{/if}
		</div>
	</div>
	<button type="button" class="pt-link t-footnote" aria-expanded={open} onclick={() => (open = !open)}
		>{open ? 'Hide' : 'Show'} the {r.payments.length} UPI references</button
	>
	{#if open}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (the list scrolls, so the keyboard must reach it) -->
		<ol class="rcpt-refs" tabindex="0" aria-label="The {r.payments.length} UPI references">
			{#each r.payments as x (x.rrn ?? x.n)}<li>
					<span class="mono">{x.rrn}</span><span>{x.who}</span><span class="tnum">{x.units} × ₹{price}</span>
				</li>{/each}
		</ol>{/if}
</div>
