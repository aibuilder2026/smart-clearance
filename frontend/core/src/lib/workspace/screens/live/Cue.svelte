<script lang="ts">
	import Icon from '../../../icons/Icon.svelte';
	import { cue, cueLong } from '../../live.svelte';

	// the pace, when the client's journey days are compressed: "1 day = 5 min" (screens/live.jsx Cue); short, under the
	// bar's title, it is read out only
	let { dayMinutes, short }: { dayMinutes: number; short?: boolean } = $props();
	const words = $derived(cue(dayMinutes));
</script>

{#if words}<span class="lv-cue" title={cueLong(dayMinutes)}
		><Icon name="fast-forward" size={13} stroke={2.2} />{#if short}<span class="sr-only">{words}</span>{:else}<span
				>{words}</span
			>{/if}</span
	>{/if}
