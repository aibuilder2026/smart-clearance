<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Product from '../../../components/Product.svelte';
	import StatusBadge from '../../../components/StatusBadge.svelte';
	import { cx } from '../../../cx';
	import Icon from '../../../icons/Icon.svelte';
	import { SPRINGS } from '../../../motion';
	import { slideThumb } from '../../../motion/thumb';
	import { useLive } from '../../live.svelte';
	import { BATCH_PARTS, heroModel, partState, type JourneyItem } from '../../model';
	import { useWorkspace } from '../../source';
	import type { BatchView } from '../../types';
	import LiveLine from '../live/LiveLine.svelte';

	// the head every screen of a batch shares (screens/brand.jsx BatchHead, SC-112): its pack, its name, its id and
	// distributor, where it stands, and its screens as tabs; a batch in no journey has no tabs. The tabs are the kit's
	// pill track at page size: the thumb slides from the screen shown before (from), the tab for where the batch stands
	// carries a dot, amber while it waits for a yes, and a screen it has not reached dims its icon and says when
	type Props = {
		it: JourneyItem | null;
		v: BatchView;
		part: string;
		/** the screen shown before this one, for the thumb to slide from */
		from?: string | null;
		onpart: (part: string) => void;
	};
	let { it, v, part, from, onpart }: Props = $props();
	const ws = useWorkspace();
	const app = useApp();
	const live = useLive();
	const phone = $derived(app.bp === 'phone');
	// the batch's state: the agents' ETA once its case is the one read, else the stop it is at
	const where = $derived.by(() => {
		if (!it) return null;
		const c = ws.case;
		if (c && c.batch.id === it.ref) {
			const hm = heroModel(ws.state, ws.data, c);
			return { text: hm.eta, tone: hm.etaTone, live: !!hm.agentLive };
		}
		return { text: `At ${it.stop}`, tone: it.human ? ('amber' as const) : ('green' as const), live: false };
	});

	let track: HTMLElement | undefined = $state();
	$effect(() => {
		const a = BATCH_PARTS.findIndex((p) => p.id === from);
		const b = BATCH_PARTS.findIndex((p) => p.id === part);
		if (track && a >= 0 && b >= 0 && a !== b)
			slideThumb(track.querySelectorAll<HTMLElement>(':scope > .bh-tab'), a, b, '.bh-tab-thumb', SPRINGS.tabs);
	});
</script>

<div class="bhead">
	<div class="bh-id">
		<span class="bh-pic" aria-hidden="true"><Product name={v.skuObj.img} size={phone ? 46 : 72} /></span>
		<div class="bh-tt">
			<h1>{v.skuObj.name}</h1>
			<div class="bh-meta">
				<span class="mono">{v.id}</span><span class="sep" aria-hidden="true">·</span><span
					>{v.dist.name}, {v.dist.city}</span
				>
			</div>
			<div class="bh-meta">
				{#if where}<Badge tone={where.tone} dot live={where.live}>{where.text}</Badge>{:else}<StatusBadge
						status={v.phase || v.assess.status}
					/><span>The Watcher checks it every morning at {ws.state.rules.watchTime}</span>{/if}{#if live?.on}<LiveLine
						{live}
					/>{/if}
			</div>
		</div>
	</div>
	{#if it}<nav bind:this={track} class="bh-tabs" aria-label="{v.skuObj.name}, {v.id}">
			{#each BATCH_PARTS as p (p.id)}{@const st = partState(it, p)}<button
					type="button"
					class={cx('bh-tab', st.ahead && 'ahead')}
					aria-current={part === p.id ? 'page' : undefined}
					title={st.words || undefined}
					onclick={() => onpart(p.id)}
					>{#if part === p.id}<span class="bh-tab-thumb"></span>{/if}{#if !phone}<Icon
							name={p.icon}
							size={16}
						/>{/if}<span>{phone ? p.short : p.label}</span>{#if st.here}<i
							class={cx('bh-here', st.human && 'human')}
							aria-hidden="true"
						></i>{/if}{#if st.words}<span class="sr-only">, {st.words}</span>{/if}</button
				>{/each}
		</nav>{/if}
</div>
