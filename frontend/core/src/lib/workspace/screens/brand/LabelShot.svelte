<script lang="ts">
	import type { Snippet } from 'svelte';
	import { imgUrl } from '../../../assets';
	import { cx } from '../../../cx';
	import { fmt } from '../../../format';
	import { packSize } from '../../model';
	import { useWorkspace } from '../../source';
	import Photo from '../common/Photo.svelte';

	// the carton's label photo (SC-147): the batch's own photo, the full statutory sticker with its barcode, QR code and
	// FSSAI licence, where the story has one; the carton on shelf B4 with its label set in type otherwise, as on a live
	// build, which carries no story photos (screens/brand.jsx LabelShot)
	// `src`: the photo the distributor sent, whole as he took it (the live workspace's link to it, SC-181), never a stand-in
	type Props = { cover?: boolean; dim?: boolean; src?: string; children?: Snippet };
	let { cover, dim, src, children }: Props = $props();
	const ws = useWorkspace();
	const b = $derived(ws.case!.batch);
	const sku = $derived(ws.case!.sku);
	const photo = $derived(imgUrl(`labels/${b.id}.webp`));
</script>

<div class={cx('lshot', cover && 'cover')} style={dim ? 'filter: saturate(0.85) brightness(0.94)' : undefined}>
	{#if src}<Photo class="as-sent" {src} alt="" />{:else}<img src={photo ?? imgUrl('label-shot.webp')} alt="" />{/if}
	{#if !src && !photo}<div class="lshot-label" aria-hidden="true">
			<b>{sku.brand.toUpperCase()}</b><span class="ls-prod">{sku.name}</span><span>BATCH&nbsp; {b.id}</span><span
				>MFG&nbsp; {fmt.date(b.mfg).toUpperCase()}</span
			><span>BEST BEFORE&nbsp; {fmt.date(b.bestBefore).toUpperCase()}</span><span
				>MRP {fmt.rate(sku.mrp)} incl. of all taxes</span
			><span>{sku.perCarton} × {packSize(sku)}</span>
		</div>{/if}
	{@render children?.()}
</div>
