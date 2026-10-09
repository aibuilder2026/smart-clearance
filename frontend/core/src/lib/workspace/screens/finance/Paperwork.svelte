<script lang="ts">
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import PaperPack from './PaperPack.svelte';

	// S5 Paperwork: the batch in focus's pack, one of the operator's batch screens (SC-112); a cleared batch's
	// pack is on its page in the ledger too (SC-121) (screens/finance.jsx Paperwork)
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const awarded = $derived(c.lines.expiresoon.units > 0);
</script>

<Screen
	{me}
	title="Paperwork"
	sub={`${c.batch.id} · prepared by the Paperwork agent ${awarded ? 'at the award' : 'once every line was done'}`}
>
	<PaperPack {c} h={ws.state.hero} />
</Screen>
