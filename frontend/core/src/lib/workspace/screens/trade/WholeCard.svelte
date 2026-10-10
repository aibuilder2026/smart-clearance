<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import { fmt } from '../../model';
	import { storyWhole, whole } from '../../partners';
	import { useWorkspace } from '../../source';
	import type { CaseData, PartnerCase } from '../../types';
	import PtLine from './PtLine.svelte';
	import { worldOf } from './pt';

	// how he ended whole (SC-130): what he received against what he paid, each credit note opening on paper; the batch
	// in a journey on the plan until it clears
	type Props = { c: PartnerCase | null; story: CaseData | null; onpaper: (id: string) => void };
	let { c, story, onpaper }: Props = $props();
	const ws = useWorkspace();
	const w = $derived(c ? whole(c, worldOf(ws)) : storyWhole(story!, ws.state.hero, ws.data.workspace.short));
	const open = $derived(!c && ws.state.hero.phase !== 'cleared');
</script>

<Card class="stack snug">
	<div class="card-head">
		<span class="card-title">You end whole</span><Badge
			tone={open ? undefined : 'green'}
			icon={open ? 'clock' : 'check'}>{open ? 'on the plan' : 'settled'}</Badge
		>
	</div>
	<div class="stack tight">
		{#each w.rows as r (r.k)}<PtLine
				k={r.k}
				sub={r.sub}
				v={fmt.inr(r.v)}
				onclick={r.paper && c ? () => onpaper(r.paper!) : null}
			/>{/each}
		<div class="hairline" style="margin: 4px 0"></div>
		<PtLine k="What you receive" v={fmt.inr(w.recv)} strong />
		<PtLine
			k="What you paid"
			sub={w.extra
				? `${fmt.num(w.units)} × ₹${w.dp}, the van, the listing fee, the GST you reverse and the agency's charges`
				: `${fmt.num(w.units)} × ₹${w.dp}, the van and the listing fee`}
			v={fmt.inr(-w.paid)}
		/>
		<PtLine k="Your gain or loss" v={fmt.inr(w.gain)} strong />
	</div>
	<span class="t-caption subtle">Instead of waiting weeks for an expiry claim, with no claim paperwork.</span>
</Card>
