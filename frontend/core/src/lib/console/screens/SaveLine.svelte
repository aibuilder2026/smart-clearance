<script lang="ts">
	import { SaveNote, type Wait } from '../../index';

	// a control's SaveNote (SC-152) where the console has no room kept for it: it takes no space at rest, so a page reads
	// as before until a change is out, and it stays in the page for a screen reader (console.jsx SaveLine)
	let { wait }: { wait: Wait } = $props();
</script>

<span class:sr-only={wait.phase === 'idle' || wait.phase === 'wait'}><SaveNote {wait} /></span>
