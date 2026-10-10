<script lang="ts">
	import type { HTMLImgAttributes } from 'svelte/elements';
	import Skeleton from '../../../components/Skeleton.svelte';
	import Icon from '../../../icons/Icon.svelte';

	// a photo that loads from the network (SC-144, screens/common.jsx Photo): the kit's Skeleton holds its frame until it
	// has loaded, then it fades in; one that does not load says so. Its frame is positioned (.cam, .rec-shot, .rec-big),
	// and the photo fills it. `opacity` is the photo's own once loaded (an example shown faded). The frames are near-black
	// and the shimmer is a translucent tint, so the skeleton sits on the page's own surface, under the photo's tag (SC-146)
	type Props = Omit<HTMLImgAttributes, 'src' | 'style'> & { src: string; alt?: string; opacity?: number };
	let { src, alt = '', opacity = 1, ...rest }: Props = $props();
	let st = $state<'loading' | 'ready' | 'failed'>('loading');
	let img: HTMLImageElement | undefined = $state();
	$effect(() => {
		void src;
		st = img?.complete && img.naturalWidth ? 'ready' : 'loading';
	});
</script>

{#if st === 'loading'}<Skeleton
		r={0}
		style="position: absolute; inset: 0; height: auto; z-index: 1; border-radius: inherit; background-color: var(--surface-2)"
	/>{/if}
{#if st === 'failed'}<span class="photo-failed"
		><Icon name="image" size={20} /><span class="t-caption">The photo did not load</span></span
	>{/if}
<img
	bind:this={img}
	{src}
	{alt}
	{...rest}
	onload={() => (st = 'ready')}
	onerror={() => (st = 'failed')}
	style="opacity: {st === 'ready' ? opacity : 0}; transition: opacity 240ms var(--ease)"
/>
