<script lang="ts">
	import Photo from '../common/Photo.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import type { RecordPhoto } from '../../types';
	import { PHOTO, photoSrc, recWhen } from './record';

	// a photo, as it was sent, with its tag; it opens whole on a tap
	let { p, onopen }: { p: RecordPhoto; onopen: () => void } = $props();
	const src = $derived(photoSrc(p));
</script>

{#if !src}<div class="rec-shot none"><Icon name="image" size={20} /><span class="t-caption">no photo kept</span></div>
{:else}<button
		type="button"
		class="rec-shot"
		onclick={onopen}
		aria-label="{PHOTO[p.id][0]}, sent {recWhen(p.at)}: open it"
		><Photo {src} alt="{PHOTO[p.id][0]} for this batch" loading="lazy" /><span class="cam-tag">{PHOTO[p.id][1]}</span
		></button
	>{/if}
