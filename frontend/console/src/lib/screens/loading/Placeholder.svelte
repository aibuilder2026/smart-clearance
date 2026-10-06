<script lang="ts">
	import { useApp } from '@smart-clearance/core';
	import { rows, type Kind, type Shape } from './shapes.ts';

	// the screen's own shape while it is read (SC-49): blocks with the bones of what is coming, one green wash crossing
	// them block by block (it runs only while they wait; under reduced motion they stand still)
	let { shape, label }: { shape: Shape; label: string } = $props();
	const app = useApp();
	const list = $derived(rows(shape, app.bp === 'phone'));
</script>

{#snippet bones(kind: Kind)}{#if kind === 'tile'}<i class="b w40"></i><i class="b big w60"></i><i class="b spark"
		></i>{:else if kind === 'card'}<i class="b w30"></i><i class="b w20 thin"></i><i class="b area"
		></i>{:else if kind === 'row'}<i class="b dot"></i><span class="col"
			><i class="b w50"></i><i class="b w30 thin"></i></span
		><i class="b w10"></i>{:else if kind === 'head'}<i class="b mark"></i><span class="col"
			><i class="b w30"></i><i class="b w50 thin"></i></span
		>{:else if kind === 'field'}<i class="b w30 thin"></i><i class="b input"></i>{:else}<i class="b fill"
		></i>{/if}{/snippet}

<div class="cs-load" role="status" aria-busy="true">
	<span class="sr-only">Loading {label}</span>
	<div class="cs-ph">
		{#each list as r, i (i)}<div
				class="cs-ph-row k-{r.kind}"
				style:grid-template-columns={r.columns}
				style:width={r.width}
			>
				{#each r.blocks as b (b)}<div class="cs-ph-blk k-{r.kind}" style:height="{r.height}px" style:--i={b}>
						{@render bones(r.kind)}
					</div>{/each}
			</div>{/each}
	</div>
</div>
