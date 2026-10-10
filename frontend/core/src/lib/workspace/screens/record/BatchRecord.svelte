<script lang="ts">
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import RecordTab from './RecordTab.svelte';

	// the Record of a batch in a journey, a screen of its page (SC-142): read when it opens, and again as it moves on
	let { me, at }: { me: User; at: string } = $props();
	const ws = useWorkspace();
	$effect(() => ws.openRecord?.(at));
	const rec = $derived(ws.record(at));
</script>

<Screen {me} title="Record"><RecordTab batch={at} {rec} /></Screen>
