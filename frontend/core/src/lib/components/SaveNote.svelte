<script lang="ts">
	import Icon from '../icons/Icon.svelte';
	import type { Wait } from '../wait.svelte';

	// the line beside a control that saves (SC-152, the kit's SaveNote): Saving…, Saved, or the reason it was put back.
	// Its state is a Wait, run by saving() (wait.svelte.ts)
	let { wait }: { wait: Wait } = $props();
</script>

<span class="save-note" class:err={wait.phase === 'error'} role={wait.phase === 'error' ? 'alert' : 'status'}
	>{#if wait.phase === 'busy' || wait.phase === 'slow'}<svg
			class="btn-arc"
			width="14"
			height="14"
			viewBox="0 0 20 20"
			aria-hidden="true"
			><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-opacity="0.28" stroke-width="2.25" /><path
				d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5"
				fill="none"
				stroke="currentColor"
				stroke-width="2.25"
				stroke-linecap="round"
			/></svg
		>{wait.phase === 'slow'
			? 'Still saving. The platform can take a few seconds to wake.'
			: 'Saving…'}{:else if wait.phase === 'done'}<span class="save-ok"
			><Icon name="check" size={14} stroke={2.4} /></span
		>Saved{:else if wait.phase === 'error'}<Icon name="circle-alert" size={14} />{wait.error} Put back as it was.{/if}</span
>
