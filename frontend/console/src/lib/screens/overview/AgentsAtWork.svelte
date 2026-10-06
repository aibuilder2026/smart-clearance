<script lang="ts">
	import type { BatchMark, Client, Dashboard, Run } from '@smart-clearance/api/console';
	import {
		cx,
		ease,
		fmt,
		Icon,
		motionMs,
		prefersReducedMotion,
		Roll,
		SPRINGS,
		springCurve,
		WorkspaceMark,
		type IconName
	} from '@smart-clearance/core';
	import { crossfade, fly } from 'svelte/transition';
	import { useConsole } from '#lib/console.svelte.ts';

	// Agents at work (SC-49, option A): the nine stops as a route, each with its agent and count, and the latest batches
	// to arrive there as their clients' marks (three, then a count); Closed today at the end, and the latest run under
	// it. When a reading moves a batch, its mark travels to its new stop (spring 170/24/1), and the marks that arrived
	// since the last reading are ringed while their stops light for 1.6 s. Choosing a stop lists its batches in the table
	type Props = {
		d: Dashboard;
		run?: Run;
		paused: boolean;
		client: (id: string) => Client | undefined;
		value: number | null;
		onpick: (i: number | null) => void;
	};
	let { d, run, paused, client, value, onpick }: Props = $props();
	const k = useConsole();
	const reduce = prefersReducedMotion.current;
	const titles = k.config.stages.map((s) => s.title);
	const stopAgents = k.config.stages.map((s) => k.catalog.agents.filter((a) => a.stage === s.id));
	const travel = springCurve(SPRINGS.token);
	const [send, receive] = crossfade({
		duration: reduce ? 0 : travel.duration,
		easing: travel.easing,
		fallback: () => ({ duration: motionMs(240), css: (t: number) => `opacity: ${t}` })
	});
	const key = (b: BatchMark) => `${b.client}/${b.ref}`;
	const ws = (id: string) => client(id) ?? { id, name: id };
	const agentName = (id: string) => k.catalog.agents.find((a) => a.id === id)?.name ?? id;

	// what arrived since the last reading: every mark says when it reached its stop
	const stops = $derived(d.atStop.concat([d.closedToday.batches]));
	const latest = $derived(Math.max(0, ...stops.flat().map((b) => Date.parse(b.at))));
	let moved = $state<{ keys: Record<string, boolean>; stops: Record<number, boolean> }>({ keys: {}, stops: {} });
	let was: number | null = null;
	$effect(() => {
		const now = latest,
			before = was;
		was = now;
		if (before == null || now <= before) return;
		const keys: Record<string, boolean> = {},
			lit: Record<number, boolean> = {};
		stops.forEach((list, i) =>
			list.forEach((b) => {
				if (Date.parse(b.at) > before) {
					keys[key(b)] = true;
					lit[i] = true;
				}
			})
		);
		moved = { keys, stops: lit };
		const t = setTimeout(() => (moved = { keys: {}, stops: {} }), 1600);
		return () => clearTimeout(t);
	});
	const icon = (i: number) =>
		(i === 9 ? 'indian-rupee' : i === 5 ? 'hand' : (stopAgents[i][0]?.icon ?? 'bot')) as IconName;
</script>

{#snippet stop(i: number, list: BatchMark[], n: number)}<span class="toks" aria-hidden="true"
		>{#each list as b (key(b))}<span
				class={cx('cs-aw-tok', moved.keys[key(b)] && 'moved')}
				in:receive={{ key: key(b) }}
				out:send={{ key: key(b) }}><WorkspaceMark ws={ws(b.client)} size={22} /></span
			>{/each}{#if n > list.length}<span class="more">+{n - list.length}</span>{/if}</span
	><span class="node" aria-hidden="true"
		>{#if moved.stops[i] && !reduce}<i class="ping"></i>{/if}<Icon name={icon(i)} size={16} /></span
	>{/snippet}

<section class="cs-ov-card cs-aw" aria-labelledby="cs-aw-t">
	<div class="cs-ov-head">
		<div>
			<div class="t" id="cs-aw-t">Agents at work</div>
			<div class="s">
				{d.inFlight} batch{d.inFlight === 1 ? '' : 'es'} on the route · each mark is a client's batch, moving as the agents
				finish · choose a stop to list them
			</div>
		</div>
		<span class={cx('cs-aw-state', paused && 'paused')}>{paused ? 'Paused' : 'Moving as readings arrive'}</span>
	</div>
	<div class="cs-aw-track" role="group" aria-label="Batches in flight by stop">
		<i class="cs-aw-rail" aria-hidden="true"></i>
		{#each titles as t, i (t)}
			{@const n = d.byStop[i]}
			{@const ag = stopAgents[i]}
			{@const human = i === 5}
			{@const who = human ? 'You' : ag.length > 1 ? `${ag[0].name} +${ag.length - 1}` : (ag[0]?.name ?? '')}
			<button
				type="button"
				class={cx('cs-aw-stop', human && 'human', !n && 'zero', moved.stops[i] && 'lit')}
				aria-pressed={value === i}
				aria-label="{t}: {n} batch{n === 1 ? '' : 'es'}, {human
					? 'waiting for a person'
					: 'with the ' + (ag.length > 1 ? ag.map((a) => a.name).join(', ') : who)}. {value === i
					? 'Shown in the table'
					: 'Show them in the table'}"
				onclick={() => onpick(value === i ? null : i)}
				>{@render stop(i, d.atStop[i], n)}<span class="lbl" aria-hidden="true"><b>{t}</b><span>{who}</span></span><span
					class="n"
					aria-hidden="true"><Roll value={n} /></span
				></button
			>
		{/each}
		<div
			class={cx('cs-aw-stop end', moved.stops[9] && 'lit')}
			role="img"
			aria-label="Closed today: {d.closedToday.count} batch{d.closedToday.count === 1 ? '' : 'es'}, {fmt.inr(
				d.closedToday.recovered
			)} recovered"
		>
			{@render stop(9, d.closedToday.batches, d.closedToday.count)}<span class="lbl" aria-hidden="true"
				><b>Closed today</b><span
					><Roll
						value={Math.round(d.closedToday.recovered)}
						format={(v) => '₹' + Math.round(v).toLocaleString('en-IN')}
					/></span
				></span
			><span class="n" aria-hidden="true"><Roll value={d.closedToday.count} /></span>
		</div>
	</div>
	<div class="cs-aw-ticker" aria-live="polite">
		{#if run}{#key run.at + run.agent + run.text}<p
					in:fly={{ y: 10, duration: motionMs(240), easing: ease }}
					out:fly={{ y: -10, duration: motionMs(240), easing: ease }}
				>
					<span class="mono t-footnote">{run.at}</span><b>{agentName(run.agent)}</b><span class="who"
						>{client(run.client)?.name ?? run.client}</span
					><span class="txt">{run.text}</span>
				</p>{/key}{:else}<p>No runs yet today</p>{/if}
	</div>
</section>

<style>
	.ping {
		animation: ping 1.2s ease-out forwards;
	}
	@keyframes ping {
		from {
			transform: scale(1);
			opacity: 0.55;
		}
		to {
			transform: scale(2.1);
			opacity: 0;
		}
	}
</style>
