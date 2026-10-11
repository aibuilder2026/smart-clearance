<script lang="ts">
	import Icon from '../../../icons/Icon.svelte';
	import ClockGuide, { type GuideClock } from './ClockGuide.svelte';

	// the note under the journey clock (SC-176, option B; screens/common.jsx ClockNote): it is the prototype's clock, the
	// story's own calendar, with how to reset or fast-forward the journey. Under every title and a batch's head on the
	// live workspace, and under a live client's head in the console (here)
	let { client, clock, here }: { client: string; clock?: GuideClock | null; here?: boolean } = $props();
	let open = $state(false);
</script>

<span class="jc-note"
	><Icon name="info" size={14} stroke={2.2} /><span
		><b>Prototype time:</b> the story's own calendar, so its batches' best-before dates hold.
		<button type="button" class="jc-link" onclick={() => (open = true)} aria-haspopup="dialog"
			>How to reset or fast-forward</button
		></span
	></span
><ClockGuide bind:open {client} {clock} {here} />
