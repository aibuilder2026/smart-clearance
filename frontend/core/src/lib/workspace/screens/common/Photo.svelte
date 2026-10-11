<script lang="ts">
	import { untrack } from 'svelte';
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
	// the link on screen: once a photo has loaded, a new link to it (a fresh signed link, as every read of the live
	// workspace brings, SC-180) loads behind it and takes its place when ready, so it never drops back to its skeleton
	// svelte-ignore state_referenced_locally
	let at = $state(src);
	$effect(() => {
		const want = src;
		if (want === untrack(() => at)) return;
		if (untrack(() => st) !== 'ready') {
			at = want;
			st = 'loading';
			return;
		}
		let on = true;
		const pre = new Image();
		pre.onload = () => {
			if (on) [at, st] = [want, 'ready'];
		};
		pre.onerror = () => {
			if (on) [at, st] = [want, 'failed'];
		};
		pre.src = want;
		return () => {
			on = false;
		};
	});
	$effect(() => {
		void at;
		if (img?.complete && img.naturalWidth) st = 'ready';
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
	src={at}
	{alt}
	{...rest}
	onload={() => (st = 'ready')}
	onerror={() => (st = 'failed')}
	style="opacity: {st === 'ready' ? opacity : 0}; transition: opacity 240ms var(--ease)"
/>
