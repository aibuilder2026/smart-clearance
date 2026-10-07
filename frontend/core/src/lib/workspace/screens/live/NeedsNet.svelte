<script lang="ts">
	import Icon from '../../../icons/Icon.svelte';

	// offline, approving waits for a connection: the approve button says why (screens/live.jsx NeedsNet)
	let { id }: { id: string } = $props();
</script>

<span {id} class="t-footnote lv-needs"><Icon name="wifi-off" size={14} />Approving needs a connection</span>
