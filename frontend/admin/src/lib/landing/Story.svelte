<script lang="ts">
	import { Avatar, Money, Product, WorkspaceMark } from '@smart-clearance/core';
	import type { Showcase } from '#lib/api/types.ts';
	import type { Figures } from './figures';
	import { LINKS, linkProps } from './links';

	let { s, f }: { s: Showcase; f: Figures } = $props();
	const priya = $derived(s.people.priya);
	const ws = $derived(s.workspace);
</script>

<!-- 4 · Munchly's batch, told by the people in it -->
<section id="customers" class="sec sec-story" aria-labelledby="story-h">
	<div class="wrap">
		<div class="story">
			<div class="story-copy">
				<h2 id="story-h" class="sec-h story-h">
					<span>One plan approved.</span> <span>Not one carton destroyed.</span>
				</h2>
				<blockquote class="story-quote">
					<p>“I approved one plan with the money on screen. The agents did the running around.”</p>
				</blockquote>
				<div class="story-who">
					<Avatar person={priya} size="xl" /><span class="sw-text"
						><b>{priya.name}</b><span>{priya.role}</span><span class="sw-org"
							><WorkspaceMark {ws} size={20} />{ws.name} · snacks and drinks, {s.client.city}</span
						></span
					>
				</div>
				<div class="story-ctas">
					<a class="btn btn-primary" {...linkProps(LINKS.demo)}>Watch Munchly's batch, stage by stage</a><a
						class="btn btn-secondary btn-white"
						{...linkProps(LINKS.app)}>Visit {ws.domain}</a
					>
				</div>
			</div>
			<div class="story-card" role="group" aria-label="Batch {f.batchId}: eight of nine stops done">
				<div class="sc-top">
					<span class="sc-id"
						><span class="mono">{f.batchId}</span><span>{f.sku.brand} {f.sku.name} · {f.dist.name}, {f.dist.city}</span
						></span
					>
					<Product name={f.sku.img} size={76} class="sc-pack" />
				</div>
				<span class="sc-dots" aria-hidden="true"
					>{#each { length: 9 } as _, i (i)}<i class={i === 8 ? 'next' : ''}></i>{/each}</span
				>
				<Money value={f.actual.net} class="sc-money" />
				<span class="sc-cap">recovered, eight stops of nine; the BRSR line follows after {f.returnDay}</span>
				<dl class="sc-rows">
					<div class="sc-row">
						<dt>If destroyed</dt>
						<dd><Money value={-f.bin} class="sc-bin" /></dd>
					</div>
					<div class="sc-row">
						<dt>GST credit kept</dt>
						<dd><Money value={f.plan.itcRetained} /></dd>
					</div>
					<div class="sc-row">
						<dt>Kiranas restocked</dt>
						<dd><span class="num">{f.shops}</span></dd>
					</div>
					<div class="sc-row">
						<dt>Cartons destroyed</dt>
						<dd><span class="num">0</span></dd>
					</div>
				</dl>
			</div>
		</div>
		<ul class="cast" aria-label="The people in Munchly's batch">
			{#each f.cast as c (c.id)}<li>
					<Avatar person={c.person} size="lg" /><span class="cast-text"
						><b>{c.person.name}</b><span>{c.role}</span><span class="cast-did">{c.did}</span></span
					>
				</li>{/each}
		</ul>
		<p class="fine">
			Munchly Foods, its partners and its people are fictional. Every figure is worked out from the journey map.
		</p>
	</div>
</section>
