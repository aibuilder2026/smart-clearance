<script lang="ts">
	// a quiet placeholder in the shape of what is coming (the kit's Skeleton)
	type Props = { w?: string | number; h?: number; r?: number; style?: string };
	let { w = '100%', h = 14, r, style = '' }: Props = $props();
	const px = (v: string | number) => (typeof v === 'number' ? `${v}px` : v);
</script>

<span
	class="skeleton"
	style="width: {px(w)}; height: {h}px;{r != null ? ` border-radius: ${r}px;` : ''} {style}"
	aria-hidden="true"
></span>
