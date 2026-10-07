<script lang="ts">
	import Avatar from '../../../components/Avatar.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import { personById } from '../../legacy';
	import { store } from '../../store.svelte';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';

	// the audit log: every human decision, with who and when, filtered by person (screens/admin.jsx Audit)
	let { me }: { me: User } = $props();
	let who = $state('all');
	const people = $derived(Array.from(new Set(store.state.audit.map((a) => a.who))));
	const rows = $derived(store.state.audit.filter((a) => who === 'all' || a.who === who));
</script>

<Screen {me} title="Audit log" sub="Every human decision, with who and when">
	<div class="stack" style="gap: 16px">
		<div class="row tight wrap">
			<button type="button" class="chip" aria-pressed={who === 'all'} onclick={() => (who = 'all')}>Everyone</button
			>{#each people as p (p)}<button type="button" class="chip" aria-pressed={who === p} onclick={() => (who = p)}
					>{personById(p).short || personById(p).name}</button
				>{/each}
		</div>
		{#if rows.length}
			<div class="list">
				{#each rows as a (a.id)}{@const p = personById(a.who)}
					<div class="list-row" style="grid-template-columns: 40px minmax(0,1fr) auto">
						<Avatar person={p} size="sm" /><span class="stack tight" style="gap: 0"
							><span class="t-subhead"><b>{p.short || p.name}</b> {a.what}</span><span class="t-caption subtle mono"
								>{a.target}</span
							></span
						><span class="t-caption subtle tnum">{a.at}</span>
					</div>{/each}
			</div>
		{:else}
			<Card
				><Empty
					icon="scroll-text"
					title="Nothing logged yet"
					body="Approvals, permissions, photos, bids, dispatches and settings changes appear here."
				/></Card
			>
		{/if}
	</div>
</Screen>
