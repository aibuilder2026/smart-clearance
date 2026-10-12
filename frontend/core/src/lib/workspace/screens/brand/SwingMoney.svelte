<script lang="ts">
	import Money from '../../../components/Money.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import { fmt } from '../../../format';
	import Icon from '../../../icons/Icon.svelte';
	import { swingOf } from '../../swing';
	import type { CaseData } from '../../types';
	import SwingWorking from './SwingWorking.svelte';

	// a card's money (SC-195, option A, How it adds up; screens/brand.jsx SwingMoney): the figure, what it is, and a note
	// that says the swing in words and opens how it adds up
	let { c, posted, label, phone }: { c: CaseData; posted: boolean; label: string; phone: boolean } = $props();
	const w = $derived(swingOf(c, posted));
	let open = $state(false);
</script>

<div class="stack tight" style="gap: 4px">
	<Money value={w.net} size={phone ? 's' : 'm'} roll style="color: var(--primary-text)" />
	<span class="t-footnote subtle">{label}</span>
	<button type="button" class="sw-note" aria-haspopup="dialog" onclick={() => (open = true)}
		><Icon name="scale" size={15} stroke={2.1} /><span><b>{fmt.inr(w.swing)} better</b> than destroying it</span><span
			class="sw-how">How it adds up</span
		></button
	>
	<Sheet bind:open title="How the swing adds up" side={phone ? 'bottom' : 'side'} detent="large"
		><SwingWorking {w} /></Sheet
	>
</div>
