<script lang="ts">
	import AgentStage from '../../../components/AgentStage.svelte';
	import Mark from '../../../components/Mark.svelte';
	import Wordmark from '../../../components/Wordmark.svelte';

	// the stage beside the sign-in form (SC-195, round 2, option A, The agent mesh; screens/auth.jsx HeroStage):
	// Smart-Clearance's own, the platform's ten agents and the one person at work behind the whole sign-in (the kit's
	// AgentStage), under the product's mark and its line; on a phone or a tablet, a band over the card
</script>

<AgentStage>
	<div class="si-product"><Mark size={34} /><Wordmark size={20} /></div>
	<p class="ag-title">Ten agents. <span>One yes.</span></p>
	<p class="si-tagline">
		Every near-expiry carton gets a second chance, chosen by AI. <span class="hi" lang="hi"
			>हर कार्टन को दूसरा मौका</span
		>
	</p>
</AgentStage>
