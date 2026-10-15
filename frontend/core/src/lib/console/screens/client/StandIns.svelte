<script lang="ts">
	import { possessive, type JourneyStandIn } from '@smart-clearance/api/console';
	import { Button, cx, Icon } from '../../../index';
	import { standInSub } from './journey.ts';

	// standing in for a client's partners, in a demo (SC-215, option C): a card of its own above the agents, while
	// something waits on a partner. What the story's people would do when no one is there to do it, set apart from the
	// agents' runs and timers, since each step acts as a person. The first is a distributor's kiranas, whose scheme a
	// judge can't fill alone; its button asks first, as a timer's does. design3/console/console.jsx StandIns
	type Props = { standIns: JourneyStandIn[]; onask: (x: JourneyStandIn) => unknown };
	let { standIns, onask }: Props = $props();
</script>

{#if standIns.length}<section class="card cs-standins" aria-labelledby="cs-standins-h">
		<div class="cs-standins-head">
			<span class="icontile soft"><Icon name="hand" size={17} stroke={2} /></span><span
				class="stack tight"
				style="gap: 2px"
				><b id="cs-standins-h" class="t-headline">Stand in for the partners</b><span class="t-footnote muted"
					>For demos: what the story's people would do, when no one is there to do it. Each step acts as that person,
					and writes its audit line in your name.</span
				></span
			>
		</div>
		{#each standIns as x (x.id)}{@const who = `${possessive(x.distributor)} kiranas`}
			<div class={cx('cs-standin', x.filled && 'fired')}>
				<span class="icontile soft"><Icon name="store" size={16} stroke={2} /></span><span class="cs-trig-txt"
					><span class="cs-trig-t"><b>{who}</b><span class="mono cs-trig-ref">{x.ref}</span></span><span
						class="cs-trig-s">{standInSub(x)}</span
					>{#if x.blocked && !x.filled}<span class="cs-trig-s cs-trig-why"
							><Icon name="hourglass" size={12} stroke={2.2} />{x.blocked}</span
						>{/if}</span
				><Button
					variant="secondary"
					size="sm"
					icon={x.filled ? 'check' : 'store'}
					disabled={!!x.blocked}
					onclick={() => onask(x)}
					aria-label="{x.filled ? 'Filled' : 'Fill the scheme'}: {who}, {x.ref}"
					>{x.filled ? 'Filled' : 'Fill the scheme'}</Button
				>
			</div>{/each}
	</section>{/if}
