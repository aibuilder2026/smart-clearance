<script lang="ts">
	import Photo from '../common/Photo.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { fmt } from '../../model';
	import type { Destruction, Distributor } from '../../types';
	import { DZ_TONE, dzPhoto } from './destruction';

	// packs destroyed at the distributor's godown on expiry day (SC-139, option B; screens/brand.jsx DestructionCard):
	// where the evidence stands, both photos once sent, and on the operator's desk the way to the second yes
	let {
		d,
		dist,
		batch,
		approver,
		live,
		onreview
	}: {
		d: Destruction;
		dist: Distributor;
		batch: string;
		/** who approved it, by name */
		approver: string | null;
		live: boolean;
		onreview: () => void;
	} = $props();
	const tone = $derived(DZ_TONE[d.status]);
	const body = $derived(
		{
			requested: `${dist.name} is asked to destroy the ${fmt.num(d.units)} packs at ${dist.godown} through an authorised agency, and to send two photos and its certificate.`,
			asked: `You asked ${dist.short} again${d.reason ? `: ${d.reason}` : ''}.`,
			reading: 'Vision is reading the batch, the count and the slate off the photos.',
			checked: `${dist.short} sent the evidence: ${d.agency ? d.agency.name : 'the agency'}, certificate ${d.certificate ?? ''}. Vision checked it.`,
			approved: `Approved${approver ? ` by ${approver}` : ''}: the credit note and the agency's certificate are issued.`
		}[d.status]
	);
</script>

<Card class="stack snug">
	<div class="card-head">
		<span class="row tight"
			><span class={['icontile', tone[0] === 'amber' && 'amber']} style="border-radius: 9px"
				><Icon name="recycle" size={17} stroke={2} /></span
			><span class="card-title">Destruction at the godown</span></span
		><Badge
			tone={tone[0]}
			dot={d.status !== 'approved'}
			live={d.status === 'reading'}
			icon={d.status === 'approved' ? 'check' : undefined}>{tone[1]}</Badge
		>
	</div>
	{#if d.photos}<div class="dz-two dz-pair">
			{#each ['before', 'after'] as const as w (w)}{@const src = dzPhoto(d, batch, w, live)}
				<div class="cam dz-cam">
					{#if src}<Photo
							class="cam-feed whole"
							{src}
							alt={w === 'before'
								? 'The packs at the godown, the batch label in view'
								: 'The packs slit open at the landfill, the slate in view'}
						/>{/if}<span class="cam-tag">{w === 'before' ? 'Before' : 'After'}</span>
				</div>{/each}
		</div>{/if}
	<span class="t-footnote muted">{body}</span>
	{#if d.status === 'checked'}<Button variant="approve" icon="check" onclick={onreview}>Review and approve</Button>{/if}
</Card>
