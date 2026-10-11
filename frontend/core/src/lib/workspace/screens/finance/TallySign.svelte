<script lang="ts">
	import type { Signatory } from '../../types';
	import Ink from './Ink.svelte';

	// the Tally papers' signatory block (SC-174; screens/finance.jsx TallySign): for the firm, the signature and stamp,
	// "Authorised Signatory", who signed. With no one signing (a draft), the block is left to sign
	let {
		firm,
		who,
		seal = null,
		stamp = 'round'
	}: { firm: string; who: Signatory | null | undefined; seal?: string | null; stamp?: 'round' | 'rect' } = $props();
</script>

<div class="tl-sign">for <b>{firm}</b></div>
{#if who}<div class="tl-signed"><Ink {who} {seal} {stamp} /></div>{/if}
<div class="tl-num">Authorised Signatory</div>
{#if who}<div class="tl-signer">{who.name}, {who.title}</div>{/if}
