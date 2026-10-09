<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Product from '../../../components/Product.svelte';
	import Skeleton from '../../../components/Skeleton.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import type { IconName } from '../../../icons/registry';
	import { SPRINGS } from '../../../motion';
	import { slideThumb } from '../../../motion/thumb';
	import { rise } from '../../../motion/transitions';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import ImpactTab from './ImpactTab.svelte';
	import MoneyTab from './MoneyTab.svelte';
	import OutcomeBadge from './OutcomeBadge.svelte';
	import PaperPack from './PaperPack.svelte';

	// a batch's own page in the ledger (SC-121, screens/finance.jsx BatchPage): the operator's batch head (SC-112), with
	// the batch's Money, its Papers as the Paperwork agent drafted them, and its Impact as tabs, opening on its money
	let { me, at, tab: first }: { me: User; at: string; tab?: string } = $props();
	const ws = useWorkspace();
	const app = useApp();
	const phone = $derived(app.bp === 'phone');
	// the live workspace reads the batch's page when it opens, and again whenever the batch changes
	$effect(() => ws.openPage?.(at));
	const page = $derived(ws.ledgerPage(at));
	const TABS: { id: string; label: string; icon: IconName }[] = [
		{ id: 'money', label: 'Money', icon: 'coins' },
		{ id: 'papers', label: 'Papers', icon: 'file-text' },
		{ id: 'impact', label: 'Impact', icon: 'leaf' }
	];
	// svelte-ignore state_referenced_locally (the page opens on its first tab, then the reader moves between them)
	let tab = $state(first ?? 'money');
	let before = $state<string | null>(null);
	let track: HTMLElement | undefined = $state();
	$effect(() => {
		const a = TABS.findIndex((t) => t.id === before);
		const b = TABS.findIndex((t) => t.id === tab);
		if (track && a >= 0 && b >= 0 && a !== b)
			slideThumb(track.querySelectorAll<HTMLElement>(':scope > .bh-tab'), a, b, '.bh-tab-thumb', SPRINGS.tabs);
	});
	const go = (id: string) => {
		before = tab;
		tab = id;
	};
</script>

{#if !page}
	<Screen {me} title="Ledger" back="Ledger">
		<div class="stack" style="gap: 16px">
			<Skeleton h={96} r={20} /><Skeleton h={320} r={20} />
		</div>
	</Screen>
{:else}
	{@const c = page.c}
	{@const row = page.row}
	{#snippet head()}<div class="bhead">
			<div class="bh-id">
				<span class="bh-pic" aria-hidden="true"><Product name={c.sku.img} size={phone ? 46 : 72} /></span>
				<div class="bh-tt">
					<h1>{c.sku.name}</h1>
					<div class="bh-meta">
						<span class="mono">{c.batch.id}</span><span class="sep" aria-hidden="true">·</span><span
							>{c.dist.name}, {c.dist.city}</span
						>
					</div>
					<div class="bh-meta">
						{#if row}<OutcomeBadge o={row.outcome} />{:else}<Badge tone="blue" dot live>In flight</Badge>{/if}<span
							>Flagged {fmt.day(row?.flagged ?? ws.data.day0)}{row ? ` · cleared ${fmt.day(row.cleared)}` : ''}</span
						>
					</div>
				</div>
			</div>
			<nav bind:this={track} class="bh-tabs" aria-label="{c.sku.name}, {c.batch.id}">
				{#each TABS as t (t.id)}<button
						type="button"
						class="bh-tab"
						aria-current={tab === t.id ? 'page' : undefined}
						onclick={() => go(t.id)}
						>{#if tab === t.id}<span class="bh-tab-thumb"></span>{/if}{#if !phone}<Icon
								name={t.icon}
								size={16}
							/>{/if}<span>{t.label}</span></button
					>{/each}
			</nav>
		</div>{/snippet}
	<Screen {me} title={c.sku.name} back="Ledger" hideLarge below={head}>
		{#key tab}<div in:rise={{ y: 6, duration: 220 }}>
				{#if tab === 'money'}<MoneyTab {page} />{:else if tab === 'papers'}<PaperPack
						c={page.c}
						h={page.h}
					/>{:else}<ImpactTab {page} />{/if}
			</div>{/key}
	</Screen>
{/if}
