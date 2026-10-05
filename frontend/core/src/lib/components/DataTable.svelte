<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/** a column: `cell` draws a row's value, the row's own `key` field otherwise; it sorts by `sortValue`, or that field */
	export type Column<R> = {
		key: string;
		label: string;
		/** a number: right-aligned, tabular */
		num?: boolean;
		width?: string;
		sortable?: boolean;
		sortValue?: (row: R) => unknown;
		cell?: Snippet<[R]>;
	};
	export type Sort = [key: string, dir: 'asc' | 'desc'];
</script>

<script lang="ts" generics="R extends object">
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import Card from './Card.svelte';
	import Empty from './Empty.svelte';

	type Props = {
		columns: Column<R>[];
		rows: R[];
		rowKey?: string;
		/** a row opens something: click it, or focus it and press Enter */
		onrow?: (row: R) => void;
		empty?: Snippet;
		initialSort?: Sort | null;
		dense?: boolean;
		label?: string;
	};
	let { columns, rows, rowKey = 'id', onrow, empty, initialSort = null, dense, label = 'Table' }: Props = $props();

	// svelte-ignore state_referenced_locally
	let sort = $state<Sort | null>(initialSort);
	const field = (r: R, k: string) => (r as Record<string, unknown>)[k];
	const sorted = $derived.by(() => {
		if (!sort) return rows;
		const [k, dir] = sort;
		const col = columns.find((c) => c.key === k);
		const get = (r: R) => (col?.sortValue ? col.sortValue(r) : field(r, k)) as string | number;
		return rows.slice().sort((a, b) => {
			const x = get(a);
			const y = get(b);
			return (x > y ? 1 : x < y ? -1 : 0) * (dir === 'desc' ? -1 : 1);
		});
	});
	const toggle = (k: string) => (sort = [k, sort && sort[0] === k && sort[1] === 'asc' ? 'desc' : 'asc']);
	const ariaSort = (k: string) =>
		sort && sort[0] === k ? (sort[1] === 'asc' ? 'ascending' : 'descending') : undefined;
	// a click on a control inside the row is the control's, not the row's
	const inControl = (e: Event) => !!(e.target as HTMLElement).closest('button, a, input, select');
</script>

<!-- the kit's DataTable: sortable columns, the header kept in view, a region the keyboard can scroll -->
{#if !rows.length}
	<Card
		>{#if empty}{@render empty()}{:else}<Empty icon="search" title="Nothing here yet" />{/if}</Card
	>
{:else}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (the region scrolls, so the keyboard must reach it) -->
	<div class="table-wrap" tabindex="0" role="region" aria-label={label}>
		<table class="table" style={dense ? 'font-size: 13.5px' : undefined}>
			<thead
				><tr
					>{#each columns as c (c.key)}<th
							class={cx(c.num && 'n')}
							style={c.width ? `width: ${c.width}` : undefined}
							aria-sort={ariaSort(c.key)}
							>{#if c.sortable === false}{c.label}{:else}<button type="button" onclick={() => toggle(c.key)}
									>{c.label}{#if sort && sort[0] === c.key}<Icon
											name={sort[1] === 'asc' ? 'chevron-up' : 'chevron-down'}
											size={13}
										/>{/if}</button
								>{/if}</th
						>{/each}</tr
				></thead
			>
			<tbody
				>{#each sorted as r (field(r, rowKey))}
					<tr
						class={cx(onrow && 'clickable', !!field(r, '_dim') && 'dim')}
						tabindex={onrow ? 0 : undefined}
						onclick={onrow ? (e) => !inControl(e) && onrow(r) : undefined}
						onkeydown={onrow
							? (e) => {
									if (e.key === 'Enter' && e.target === e.currentTarget) onrow(r);
								}
							: undefined}
						>{#each columns as c (c.key)}<td class={cx(c.num && 'n')}
								>{#if c.cell}{@render c.cell(r)}{:else}{field(r, c.key) ?? ''}{/if}</td
							>{/each}</tr
					>{/each}</tbody
			>
		</table>
	</div>
{/if}
