<script lang="ts">
	import { Mark, Product, cx, useApp } from '@smart-clearance/core';
	import type { Figures } from './figures';
	import Plate from './Plate.svelte';
	import { PLATES } from './plates';

	let { f }: { f: Figures } = $props();
	const app = useApp();

	// x and y: where each island's flat top sits on the plate, as a share of its width and height; ly: its address label
	const ISLANDS = [
		{
			id: 'munchly',
			x: 0.22,
			y: 0.6,
			ly: 0.86,
			packs: ['pack-chips', 'pack-mango'],
			url: 'munchly.smartclearance.com',
			live: true
		},
		{ id: 'you', x: 0.575, y: 0.59, ly: 0.84, packs: ['sprout-box'], url: 'your-company.smartclearance.com' },
		{ id: 'next', x: 0.8, y: 0.61, ly: 0.87, packs: ['sprout-box'], url: 'your-brand.smartclearance.com', flip: true }
	];
	const HUB = { x: 0.425, y: 0.69 };
	const ISL_AR = 3776 / 1120;
	// the strip scrolls sideways only below 600px wide (site.css), so only there is it a region to focus
	const swipe = $derived(app.mounted && app.w < 600);
</script>

{#snippet urls(cls: string)}<ul class={cx('isl-urls', cls)} aria-label="Workspace addresses">
		{#each ISLANDS as i (i.id)}<li class={cx('isl-url', i.live && 'live')} style="--x: {i.x}; --y: {i.ly}">
				<i aria-hidden="true"></i>{i.url}{#if i.live}<span class="isl-live"> · live</span>{/if}
			</li>{/each}
	</ul>{/snippet}

<!-- 5 · a workspace per manufacturer: the islands -->
<section id="workspace" class="sec sec-ws" aria-labelledby="ws-h">
	<div class="wrap">
		<header class="sec-head">
			<h2 id="ws-h" class="sec-h ws-h"><span>Your own workspace,</span> <span>set up for your supply chain.</span></h2>
			<p class="sec-sub">Each manufacturer gets its own address, configured for how its stock really moves.</p>
		</header>
	</div>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (a region to focus only while it scrolls sideways) -->
	<div
		class="isl-pan"
		tabindex={swipe ? 0 : undefined}
		role={swipe ? 'region' : undefined}
		aria-label={swipe ? 'Workspaces, one island each; scroll sideways' : undefined}
	>
		<figure class="islands" style="--ar: {ISL_AR}">
			<Plate class="isl-plate" plate={PLATES.islands} alt="" loading="lazy" />
			{#each ISLANDS as i (i.id)}<span
					class={cx('isl-packs', 'isl-' + i.id)}
					style="--x: {i.x}; --y: {i.y}"
					aria-hidden="true"
					>{#each i.packs as n (n)}<Product name={n} size={160} class={cx('isl-pack', i.flip && 'flip')} />{/each}</span
				>{/each}
			<span class="isl-hub" style="--x: {HUB.x}; --y: {HUB.y}" aria-hidden="true"><Mark size={52} /></span>
			{@render urls('on-plate')}
			<figcaption class="sr-only">
				Three islands over a miniature town, joined to Smart-Clearance by green paths: Munchly Foods' workspace, live
				with its packs, and two waiting for the next manufacturers.
			</figcaption>
		</figure>
	</div>
	<div class="wrap">
		{@render urls('below')}
		<!-- inside a workspace, each team gets its own part of the same batch -->
		<p class="isl-cap">
			<b>Inside Munchly's workspace,</b> supply chain approves a plan with one tap, the money on screen. Finance gets the
			invoice, the credit note and the GST memo, drafted. Sustainability gets a BRSR line an auditor can follow back to the
			batch. And nothing is listed in a distributor's name without their one-time permission.
		</p>
		<div class="conn">
			<span class="conn-h">Works with</span>
			<ul class="conn-list">
				{#each f.connectors as c (c.id)}<li class="chip">
						{c.name}{#if c.status === 'soon'}<span class="subtle"> · soon</span>{/if}
					</li>{/each}
			</ul>
		</div>
	</div>
</section>
