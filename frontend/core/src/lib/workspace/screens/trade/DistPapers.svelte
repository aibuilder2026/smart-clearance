<script lang="ts">
	import { distPapers } from '../../partners';
	import { useWorkspace } from '../../source';
	import type { PartnerCase } from '../../types';
	import Locked from '../common/Locked.svelte';
	import PaperRow from './PaperRow.svelte';

	// his papers, then copies of what concerns his packs (SC-130); each opens on paper with its PDF
	type Props = { c: Pick<PartnerCase, 'partner' | 'docs'>; ready: boolean; onopen: (id: string) => void };
	let { c, ready, onopen }: Props = $props();
	const ws = useWorkspace();
	const short = $derived(ws.data.workspace.short);
	const p = $derived(distPapers(c));
</script>

{#if !ready}<Locked
		icon="file-text"
		agent="Paperwork agent"
		text={`Drafts your tax invoice to the buyer and ${short}'s price-support credit note to you once every line of the plan is done.`}
	/>{:else}<div class="stack" style="gap: 16px">
		<div>
			<div class="pt-head">Your papers</div>
			<div class="pt-papers">
				{#each p.mine as d (d.id)}<PaperRow {c} {d} {short} {onopen} />{/each}
			</div>
		</div>
		{#if p.copies.length}<div>
				<div class="pt-head">Copies for your records</div>
				<div class="pt-papers">
					{#each p.copies as d (d.id)}<PaperRow {c} {d} {short} {onopen} />{/each}
				</div>
			</div>{/if}
		<p class="t-footnote subtle" style="margin: 0">
			Each opens on paper with its PDF. {short}'s own GST memo and FSSAI checklist stay with {short}.
		</p>
	</div>{/if}
