<script lang="ts">
	import Button from '../../../components/Button.svelte';
	import Icon from '../../../icons/Icon.svelte';

	// the label photo on its way: the Send button fills as the photo goes, its words readable over both halves
	// (screens/live.jsx SendFill, SC-68 option B)
	let { p, oncancel }: { p: number; oncancel?: () => void } = $props();
	const pct = $derived(Math.round(p * 100));
</script>

{#snippet label()}<Icon name="send" size={18} />Sending · {pct}%{/snippet}
<div class="stack tight" style="gap: 10px">
	<div
		class="lv-fill"
		role="progressbar"
		aria-label="Sending the photo"
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={pct}
	>
		<span class="lv-fill-off">{@render label()}</span>
		<span class="lv-fill-on" style="clip-path: inset(0 {100 - pct}% 0 0)" aria-hidden="true">{@render label()}</span>
	</div>
	{#if oncancel}<Button variant="ghost" block onclick={oncancel}>Cancel</Button>{/if}
</div>
