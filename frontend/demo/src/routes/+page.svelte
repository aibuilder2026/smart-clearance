<script lang="ts">
	import { Mark, ModeMenuButton, Wordmark } from '@smart-clearance/core';
	import { goto } from '$app/navigation';
	import Director from '#lib/Director.svelte';
	import Start from '#lib/Start.svelte';
	import { ACTS, OUTS, startOf } from '#lib/story.ts';
	import type { Pos } from '#lib/types.ts';

	// the demo is one page (design3/demo/director.jsx App): the route map to start, or a place in the story from the
	// address's hash (#at=act.station.beat; the old #stage=N opens the chips' station N), as in the prototype
	let start = $state<Pos | null>(startOf(location.hash));
	let autoplay = $state(false);
	// an address typed or followed by hand (#at=…) moves the story there; the director's own updates replace the entry
	// shallowly, without a hashchange
	const onhashchange = () => {
		autoplay = false;
		start = startOf(location.hash);
	};
	const play = (s: Pos, auto: boolean) => {
		autoplay = auto;
		start = s;
	};
	const home = () => {
		start = null;
		goto(location.pathname + location.search, { replace: true, shallow: true, reset: false, state: {} }).catch(() => {
			/* before the router has started */
		});
	};
</script>

<svelte:window {onhashchange} />

{#if start}
	{#key JSON.stringify(start)}<Director {start} {autoplay} onhome={home} />{/key}
{:else}
	<div class="demo rb-shell">
		<header class="demo-top rb-top">
			<span class="row tight demo-brand"
				><Mark size={30} /><Wordmark size={17} /><span class="demo-tag">Guided demo</span></span
			><span></span><span class="row tight demo-tools"><ModeMenuButton /></span>
		</header>
		<main class="rb-startwrap">
			<Start
				acts={ACTS}
				outs={OUTS}
				onpick={(a, s) => play({ a, s, b: 0 }, false)}
				onall={() => play({ a: 0, s: 0, b: 0 }, true)}
			/>
		</main>
	</div>
{/if}
