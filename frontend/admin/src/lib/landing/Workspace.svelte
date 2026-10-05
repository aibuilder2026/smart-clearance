<script lang="ts">
	import { Icon, Mark, Product, cx, useApp, type IconName } from '@smart-clearance/core';
	import type { Figures } from './figures';
	import Plate from './Plate.svelte';
	import { PLATES } from './plates';

	let { f }: { f: Figures } = $props();
	const app = useApp();

	// x and y: where each island's flat top sits on the plate, as a share of its width and height; ly: its address
	// label. One product a manufacturer, none of them a client's (SC-28)
	const ISLANDS = [
		{
			id: 'brand',
			x: 0.22,
			y: 0.6,
			ly: 0.86,
			product: 'pack-snack-plain',
			url: 'your-brand.smartclearance.com',
			live: true
		},
		{
			id: 'company',
			x: 0.575,
			y: 0.59,
			ly: 0.84,
			product: 'pack-carton-plain',
			url: 'your-company.smartclearance.com'
		},
		{ id: 'group', x: 0.8, y: 0.61, ly: 0.87, product: 'bottle-oil-plain', url: 'your-group.smartclearance.com' }
	];
	const HUB = { x: 0.425, y: 0.69 };
	const ISL_AR = 3776 / 1120;
	// inside a workspace, each team gets its own part of the same batch
	const TEAMS: { icon: IconName; t: string; d: string }[] = [
		{ icon: 'route', t: 'Supply chain', d: 'One tap to approve a plan, with the money on screen.' },
		{ icon: 'receipt', t: 'Finance', d: 'The invoice, credit note and GST memo, drafted.' },
		{ icon: 'leaf', t: 'Sustainability', d: 'A BRSR line an auditor can follow back to the batch.' },
		{ icon: 'handshake', t: 'Distributors', d: 'Nothing listed in their name without their permission.' }
	];
	// Svelte 5 trims the space at the start of an element's text, so these carry theirs in a string
	const LIVE = ' · live';
	const SOON = ' · soon';
	// the strip scrolls sideways only below 600px wide (site.css), so only there is it a region to focus
	const swipe = $derived(app.mounted && app.w < 600);
</script>

{#snippet urls(cls: string)}<ul class={cx('isl-urls', cls)} aria-label="Workspace addresses">
		{#each ISLANDS as i (i.id)}<li class={cx('isl-url', i.live && 'live')} style="--x: {i.x}; --y: {i.ly}">
				<i aria-hidden="true"></i>{i.url}{#if i.live}<span class="isl-live">{LIVE}</span>{/if}
			</li>{/each}
	</ul>{/snippet}

<!-- 5 · a workspace per manufacturer: the board's comp L5 -->
<section id="teams" class="sec sec-ws" aria-labelledby="ws-h">
	<div class="wrap">
		<header class="sec-head">
			<h2 id="ws-h" class="sec-h plain">Your own workspace, set up for your supply chain.</h2>
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
			{#each ISLANDS as i (i.id)}<span class="isl-packs" style="--x: {i.x}; --y: {i.y}" aria-hidden="true"
					><Product name={i.product} size={160} class="isl-pack" /></span
				>{/each}
			<span class="isl-hub" style="--x: {HUB.x}; --y: {HUB.y}" aria-hidden="true"><Mark size={52} /></span>
			{@render urls('on-plate')}
			<figcaption class="sr-only">
				Three islands over a miniature town, each a manufacturer's workspace with its own products, joined to
				Smart-Clearance by green paths.
			</figcaption>
		</figure>
	</div>
	<div class="wrap">
		{@render urls('below')}
		<ul class="teams" aria-label="What each team gets">
			{#each TEAMS as t (t.t)}<li class="team">
					<Icon name={t.icon} size={26} /><b>{t.t}</b>
					<p>{t.d}</p>
				</li>{/each}
		</ul>
		<div class="conn">
			<ul class="conn-list" aria-label="Works with">
				{#each f.connectors as c (c.id)}<li>
						{c.name}{#if c.status === 'soon'}<span class="soon">{SOON}</span>{/if}
					</li>{/each}
			</ul>
		</div>
	</div>
</section>
