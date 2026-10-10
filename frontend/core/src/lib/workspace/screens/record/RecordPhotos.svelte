<script lang="ts">
	import Photo from '../common/Photo.svelte';
	import Card from '../../../components/Card.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import { cx } from '../../../cx';
	import type { RecordPhoto } from '../../types';
	import PhotoFacts from './PhotoFacts.svelte';
	import PhotoShot from './PhotoShot.svelte';
	import { PHOTO, photoSrc } from './record';

	// the photos sent for a batch (SC-142): the label photo with what Vision read, and the destruction's before and after
	// with Vision's checks; each opens whole in a sheet
	let { photos, title, empty }: { photos: RecordPhoto[]; title: string; empty: string } = $props();
	let open = $state<RecordPhoto | null>(null);
	let shown = $state(false);
	const show = (p: RecordPhoto) => {
		open = p;
		shown = true;
	};
</script>

<Card class="stack snug">
	<div class="card-head">
		<span class="card-title">{title}</span>{#if photos.length}<span class="t-footnote subtle"
				>{photos.length} · tap to open</span
			>{/if}
	</div>
	{#if photos.length}<div class={cx('rec-photos', photos.length === 2 && 'two')}>
			{#each photos as p (p.id)}<div class="rec-photo">
					<PhotoShot {p} onopen={() => show(p)} /><b class="t-subhead">{PHOTO[p.id][0]}</b><PhotoFacts {p} />
				</div>{/each}
		</div>
	{:else}<span class="t-footnote muted">{empty}</span>{/if}
</Card>
<Sheet bind:open={shown} title={open ? PHOTO[open.id][0] : ''}
	>{#if open}<div class="stack">
			<div class="rec-big"><Photo src={photoSrc(open) ?? ''} alt="{PHOTO[open.id][0]} for this batch" /></div>
			<PhotoFacts p={open} />
		</div>{/if}</Sheet
>
