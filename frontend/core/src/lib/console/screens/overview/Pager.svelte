<script lang="ts">
	import { SIZES } from '@smart-clearance/api/console';
	import { Icon } from '@smart-clearance/core';
	// a page of rows: where it is in the whole, rows a page, and the pages (previous and next only on phones)
	let {
		page,
		size,
		total,
		phone = false,
		onpage,
		onsize
	}: {
		page: number;
		size: number;
		total: number;
		phone?: boolean;
		onpage: (p: number) => void;
		onsize: (n: number) => void;
	} = $props();
	const pages = $derived(Math.max(1, Math.ceil(total / size)));
	const nums = $derived.by(() => {
		const first = Math.max(1, Math.min(page - 2, pages - 4));
		const out: number[] = [];
		for (let p = first; p <= Math.min(pages, first + 4); p++) out.push(p);
		return out;
	});
</script>

<div class="cs-ov-pager">
	<span
		>{total ? `${(page - 1) * size + 1}–${Math.min(total, page * size)} of ${total}` : 'None'}{#if !phone}
			· <label class="cs-ov-rows"
				>Rows <select class="cs-ov-sel" value={size} onchange={(e) => onsize(Number(e.currentTarget.value))}
					>{#each SIZES as n (n)}<option value={n}>{n}</option>{/each}</select
				></label
			>{/if}</span
	>
	<nav class="pg" aria-label="Pages">
		<button type="button" aria-label="Previous page" disabled={page <= 1} onclick={() => onpage(page - 1)}
			><Icon name="chevron-left" size={16} /></button
		>{#if !phone}{#each nums as p (p)}<button
					type="button"
					aria-current={p === page ? 'page' : undefined}
					aria-label="Page {p}"
					onclick={() => onpage(p)}>{p}</button
				>{/each}{/if}<button
			type="button"
			aria-label="Next page"
			disabled={page >= pages}
			onclick={() => onpage(page + 1)}><Icon name="chevron-right" size={16} /></button
		>
	</nav>
</div>
