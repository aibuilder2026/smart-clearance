<script lang="ts">
	import Icon from '../../../icons/Icon.svelte';
	import { rise } from '../../../motion/transitions';

	// in the approve sheet, an approval that did not go through (screens/live.jsx ApproveFailed, SC-68 option B): what
	// happened, in the backend's words, and that nothing was done
	let { message }: { message: string } = $props();
</script>

<div class="lv-err" role="alert" in:rise={{ y: 6, duration: 240 }}>
	<Icon name="circle-alert" size={18} /><span
		><b>The approval didn't go through.</b>
		{message} Nothing was listed, offered or sent; the plan is still waiting for you.</span
	>
</div>
