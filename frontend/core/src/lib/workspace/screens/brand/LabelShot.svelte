<script lang="ts">
	import type { Snippet } from 'svelte';
	import { imgUrl } from '../../../assets';
	import { cx } from '../../../cx';

	// the carton on shelf B4, with its label printed in type so it stays legible at any size (screens/brand.jsx
	// LabelShot)
	type Props = { cover?: boolean; dim?: boolean; children?: Snippet };
	let { cover, dim, children }: Props = $props();
</script>

<div class={cx('lshot', cover && 'cover')} style={dim ? 'filter: saturate(0.85) brightness(0.94)' : undefined}>
	<img src={imgUrl('label-shot.webp')} alt="" />
	<div class="lshot-label" aria-hidden="true">
		<b>MUNCHLY</b><span class="ls-prod">Masala Chips 150 g</span><span>BATCH&nbsp; MF-2409-117</span><span
			>MFG&nbsp; 18 MAY 2026</span
		><span>BEST BEFORE&nbsp; 18 NOV 2026</span><span>MRP ₹30.00 incl. of all taxes</span><span>24 × 150 g</span>
	</div>
	{@render children?.()}
</div>
