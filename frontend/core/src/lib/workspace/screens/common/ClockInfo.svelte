<script lang="ts">
	import Icon from '../../../icons/Icon.svelte';
	import ClockGuide, { type GuideClock } from './ClockGuide.svelte';

	// under the bar's collapsed title the note is its icon, opening the same guide (screens/common.jsx ClockInfo)
	let { client, clock }: { client: string; clock?: GuideClock | null } = $props();
	let open = $state(false);
</script>

<button
	type="button"
	class="jc-info"
	onclick={() => (open = true)}
	aria-haspopup="dialog"
	aria-label="Prototype time: why this date, and how to reset or fast-forward the journey"
	><Icon name="info" size={14} stroke={2.2} /></button
><ClockGuide bind:open {client} {clock} />
