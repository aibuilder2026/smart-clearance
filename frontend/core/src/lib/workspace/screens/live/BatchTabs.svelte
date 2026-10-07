<script lang="ts" module>
	import type { CaseTab, WorkspaceData } from '../../types';

	export type Tab = { ref: string; name: string; img: string; stop: string; human: boolean };
	/** the batches in a journey, as their tabs show them: the pack, the batch and the stop it is at */
	export const tabsOf = (cases: readonly CaseTab[], data: WorkspaceData, cleared: string): Tab[] =>
		cases.map((c) => {
			const sku = data.skus[c.sku];
			const stage = data.stages[c.stage];
			return {
				ref: c.ref,
				name: sku?.name ?? c.sku,
				img: sku?.img ?? '',
				stop: stage ? stage.title : cleared,
				human: !!stage?.human
			};
		});
</script>

<script lang="ts">
	import Product from '../../../components/Product.svelte';
	import { cx } from '../../../cx';

	// the batches flagged this morning, as tabs (screens/live.jsx BatchTabs): each with its pack, its id and the stop it is
	// at, the stop's dot amber when it waits on a person. asTabs: a tab list over one panel (the Command Center); else
	// links, each batch's own Route Room
	type Props = {
		tabs: Tab[];
		current: string;
		onpick: (ref: string) => void;
		asTabs?: boolean;
		label: string;
		panel?: string;
	};
	let { tabs, current, onpick, asTabs, label, panel }: Props = $props();

	const key = (e: KeyboardEvent, i: number) => {
		if (!asTabs) return;
		const n =
			e.key === 'ArrowRight'
				? i + 1
				: e.key === 'ArrowLeft'
					? i - 1
					: e.key === 'Home'
						? 0
						: e.key === 'End'
							? tabs.length - 1
							: null;
		if (n === null) return;
		e.preventDefault();
		const next = tabs[(n + tabs.length) % tabs.length];
		onpick(next.ref);
		document.getElementById('lv-tab-' + next.ref)?.focus();
	};
</script>

<div class="lv-tabs" role={asTabs ? 'tablist' : undefined} aria-label={label}>
	{#each tabs as t, i (t.ref)}{@const on = t.ref === current}<button
			type="button"
			id="lv-tab-{t.ref}"
			role={asTabs ? 'tab' : undefined}
			aria-selected={asTabs ? on : undefined}
			aria-controls={asTabs ? panel : undefined}
			aria-current={!asTabs && on ? 'page' : undefined}
			tabindex={asTabs && !on ? -1 : undefined}
			class={cx('lv-tab', on && 'on')}
			onclick={() => onpick(t.ref)}
			onkeydown={(e) => key(e, i)}
			><Product name={t.img} size={30} alt="" /><span class="lv-tab-t"
				><b>{t.name}</b><span class="mono">{t.ref}</span></span
			><span class={cx('lv-tab-stop', t.human && 'human')}><i aria-hidden="true"></i>{t.stop}</span></button
		>{/each}
</div>
