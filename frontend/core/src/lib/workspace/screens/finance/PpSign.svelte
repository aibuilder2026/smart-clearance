<script lang="ts">
	import type { Signatory } from '../../types';
	import Ink from './Ink.svelte';

	// the app's own papers (the GST memo, the FSSAI checklist) signed at their foot for the client (SC-174;
	// screens/finance.jsx PpSign)
	let { firm, who, seal = null }: { firm: string; who: Signatory | null | undefined; seal?: string | null } = $props();
</script>

{#if who}<div class="pp-sign">
		<span class="pp-sign-for">for <b>{firm}</b></span><Ink {who} {seal} /><span class="pp-sign-who"
			>{who.name}, {who.title}</span
		>
	</div>{/if}
