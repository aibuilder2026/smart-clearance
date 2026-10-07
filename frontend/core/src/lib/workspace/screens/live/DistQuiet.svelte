<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import BatchRow from '../../../components/BatchRow.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { batchViews } from '../../model';
	import { useWorkspace } from '../../source';
	import type { Distributor, User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import ActingFor from '../trade/ActingFor.svelte';
	import PermissionCard from '../trade/PermissionCard.svelte';
	import QuietCard from './QuietCard.svelte';

	// a distributor's day with nothing asked of him (screens/live.jsx DistQuiet, SC-68 option B): his one-time permission,
	// nothing for him today, and his stock from the nightly DMS export
	let { me, dist }: { me: User; dist: Distributor } = $props();
	const ws = useWorkspace();
	const app = useApp();
	const s = $derived(ws.state);
	const perm = $derived(s.setup.permission);
	const mine = $derived(batchViews(s, ws.data).filter((v) => v.distributor === dist.id));
</script>

<Screen {me} title="Today" sub={`${dist.name} · ${dist.godown}, ${dist.city}`}>
	<div class="stack" style="gap: 16px">
		{#if perm}<ActingFor p={perm} />{:else}<PermissionCard {dist} />{/if}
		<QuietCard
			img="godown"
			title="Nothing for you today"
			body={`No photo requests, scheme orders or marketplace lots. The Watcher checks your stock every morning at ${s.rules.watchTime}; when it needs you, it sends a push.`}
		/>
		{#if mine.length}<SectionTitle sub="From your nightly DMS export">Your stock</SectionTitle>
			<div class="list">
				{#each mine as v (v.id)}<BatchRow view={v} compact={app.bp === 'phone'} onopen={() => {}} />{/each}
			</div>{/if}
	</div>
</Screen>
