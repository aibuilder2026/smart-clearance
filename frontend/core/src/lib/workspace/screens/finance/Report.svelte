<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import Skeleton from '../../../components/Skeleton.svelte';
	import { useRoute } from '../../context';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import BatchPage from './BatchPage.svelte';
	import Ledger from './Ledger.svelte';

	// Finance & ESG (SC-121, screens/finance.jsx Report): the ledger, or a batch's page when the address names one (`at`:
	// the story's batch's papers, which a push or the guided demo opens)
	let { me, at }: { me: User; at?: { ref: string; tab?: string } } = $props();
	const ws = useWorkspace();
	const router = useRoute();
	const ref = $derived(at?.ref ?? router.route.params?.ref ?? null);
	const tab = $derived(at?.tab ?? router.route.params?.tab);
	// the stub knows its batches' pages at once; the live workspace reads one when it opens
	const paged = $derived(!!ref && (ws.kind === 'live' || !!ws.ledgerPage(ref)));
</script>

{#if paged && ref}
	{#key ref}<BatchPage {me} at={ref} {tab} />{/key}
{:else if ws.ledger}
	<Ledger {me} book={ws.ledger} />
{:else}
	<Screen {me} title="Ledger">
		{#if ws.status.phase === 'ready'}<Card
				><Empty
					icon="book-open"
					title="The ledger is on its way"
					body="Every batch cleared, as Impact posted it, by quarter and by year."
				/></Card
			>{:else}<div class="stack" style="gap: 16px"><Skeleton h={56} r={16} /><Skeleton h={260} r={20} /></div>{/if}
	</Screen>
{/if}
