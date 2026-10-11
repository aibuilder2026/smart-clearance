<script lang="ts">
	import { cx, fmt, Icon, imgUrl } from '@smart-clearance/core';
	import { BADGE, lineName, toneOf } from './map.ts';
	import type { Line, StoryAct } from './types.ts';

	// on a phone (director.jsx PhoneLines): the lines as a list, each with its stops and where it ends; the slow week
	// hangs off the chips, its branch drawn as a track
	type Props = { acts: StoryAct[]; outs: Record<Line, string>; onpick: (a: number, s: number) => void };
	let { acts, outs, onpick }: Props = $props();
	const ORDER: Line[] = ['console', 'chips', 'slow', 'mango'];
	const img = (n: string) => imgUrl(n + '.webp');
</script>

<ol class="rb-plines" aria-label="The lines">
	{#each ORDER as id (id)}
		{@const i = acts.findIndex((a) => a.id === id)}
		{@const a = acts[i]}
		<li class={cx('rb-pline', id === 'slow' && 'branch')}>
			{#if id === 'slow'}<svg class="rb-pline-branch" viewBox="0 0 16 40" preserveAspectRatio="none" aria-hidden="true"
					><path d="M4 0 V28 Q4 38 14 38" vector-effect="non-scaling-stroke" /></svg
				>{/if}
			<button type="button" class="rb-pline-btn" onclick={() => onpick(i, 0)}>
				<span class="rb-pline-head"
					>{#if a.console}<span class="rb-badge-ic"><Icon name="layout-dashboard" size={18} /></span>{:else}<img
							src={img(a.img ?? '')}
							alt=""
						/>{/if}<span class="rb-badge-t"
						><b>{lineName(a)}</b><span
							>{id === 'slow' ? 'branches off the chips after the yes' : BADGE[id]} · {a.minutes} min</span
						></span
					></span
				>
				<span class="rb-pline-rail" aria-hidden="true"
					>{#each a.stations as st (st.id)}<i class={toneOf(st)}></i>{/each}<em class={a.outcome.red ? 'red' : ''}
					></em></span
				>
				<span class="rb-pline-out"
					>{#if a.outcome.value != null}<b>{fmt.inr(a.outcome.value)}</b> · {outs[id]}{:else}Ends at Munchly's workspace{/if}</span
				>
			</button>
		</li>
	{/each}
</ol>
