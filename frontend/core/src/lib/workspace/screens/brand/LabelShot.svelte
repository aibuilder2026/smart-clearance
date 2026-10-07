<script lang="ts">
	import type { Snippet } from 'svelte';
	import { imgUrl } from '../../../assets';
	import { cx } from '../../../cx';
	import { fmt } from '../../../format';
	import { packSize } from '../../model';
	import { useWorkspace } from '../../source';

	// the carton on shelf B4, with its label printed in type so it stays legible at any size (screens/brand.jsx
	// LabelShot)
	type Props = { cover?: boolean; dim?: boolean; children?: Snippet };
	let { cover, dim, children }: Props = $props();
	const ws = useWorkspace();
	const b = $derived(ws.case!.batch);
	const sku = $derived(ws.case!.sku);
</script>

<div class={cx('lshot', cover && 'cover')} style={dim ? 'filter: saturate(0.85) brightness(0.94)' : undefined}>
	<img src={imgUrl('label-shot.webp')} alt="" />
	<div class="lshot-label" aria-hidden="true">
		<b>{sku.brand.toUpperCase()}</b><span class="ls-prod">{sku.name}</span><span>BATCH&nbsp; {b.id}</span><span
			>MFG&nbsp; {fmt.date(b.mfg).toUpperCase()}</span
		><span>BEST BEFORE&nbsp; {fmt.date(b.bestBefore).toUpperCase()}</span><span
			>MRP {fmt.rate(sku.mrp)} incl. of all taxes</span
		><span>{sku.perCarton} × {packSize(sku)}</span>
	</div>
	{@render children?.()}
</div>
