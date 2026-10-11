<script lang="ts">
	import { Button, cx, fmt, Icon, Kbd, Money } from '@smart-clearance/core';
	import { lineName, toneOf } from './map.ts';
	import { tapOf, user } from './people.ts';
	import type { Player } from './player.svelte.ts';

	// the station's notes beside the stage (director.jsx Notes): its stop number and title, the line and the day, the
	// screen on show, its figures, its beats with who does each, Back and Next. Compact: the real phone's sheet
	let { p, compact }: { p: Player; compact?: boolean } = $props();
	const act = $derived(p.act);
	const station = $derived(p.station);
	const last = $derived(p.pos.s === act.stations.length - 1);
	const nextLabel = $derived(
		p.complete
			? last
				? p.pos.a + 1 < p.acts.length
					? 'Next line · ' + lineName(p.acts[p.pos.a + 1])
					: 'The end'
				: 'Next · ' + act.stations[p.pos.s + 1].title
			: p.beat.agent && !act.console
				? 'Skip ahead'
				: 'Next'
	);
	const tone = (t?: string) => (t === 'red' ? 'var(--red-text)' : t === 'green' ? 'var(--primary-text)' : 'var(--fg)');
</script>

<aside class={cx('narr rb-card', compact && 'compact')} aria-label="Narration">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (the notes scroll, so the keyboard must reach them) -->
	<div
		class="narr-scroll"
		tabindex={compact ? undefined : 0}
		role={compact ? undefined : 'region'}
		aria-label={compact ? undefined : 'Station notes'}
	>
		<div class="rb-card-head">
			<span class={cx('rb-card-n', toneOf(station))}>{p.pos.s + 1}</span>
			<div class="stack tight" style="gap: 2px">
				<h2 class="narr-title">{station.title}</h2>
				<span class="t-footnote subtle">{lineName(act)} · {station.date}</span>
			</div>
		</div>
		<div class="rb-onscreen"><span>On screen</span><b>{p.beat.screen}</b></div>
		{#if station.figures}
			<div class="figs">
				{#each station.figures as f (f.label)}
					<div class="fig">
						<span class="fig-label">{f.label}</span>{#if f.count}<span class="num m" style="color: {tone(f.tone)}"
								>{fmt.num(f.value)}</span
							>{:else}<Money value={f.value} size="m" decimals={f.decimals} roll style="color: {tone(f.tone)}" />{/if}
					</div>
				{/each}
			</div>
		{/if}
		<ol class="beats">
			{#each station.beats as b, i (i)}
				{@const done = i < p.pos.b}
				{@const now = i === p.pos.b}
				{@const working = !!b.agent && !act.console}
				<li class={cx('beat', done && 'done', now && 'now', b.human && 'human')}>
					<span class="beat-dot"
						>{#if done}<Icon name="check" size={13} stroke={3} />{:else if now && working}<span class="beat-aura"
							></span>{/if}</span
					>
					<span class="beat-body"
						><span class="beat-who"
							>{b.agent ? b.agent + ' agent' : user(b.who ?? '').short}{b.time
								? ' · ' + (b.date ? b.date.split(' ')[0] + ' ' : '') + b.time
								: ''}</span
						><span>{b.text}</span>{#if now && !working}<span class="beat-hint"
								><Icon name="hand" size={13} />{act.console
									? 'Look in the console'
									: tapOf(station, b)
										? 'Tap it in the device'
										: 'Their move: in the device'}, or press <Kbd>→</Kbd></span
							>{/if}{#if now && working}<span class="beat-hint"
								><span class="typing"><i></i><i></i><i></i></span>working</span
							>{/if}</span
					>
				</li>
			{/each}
		</ol>
	</div>
	<div class="narr-ctrl">
		<Button
			variant="secondary"
			icon="chevron-left"
			onclick={p.back}
			disabled={p.pos.a === 0 && p.pos.s === 0 && p.pos.b === 0}
			aria-label="Back">Back</Button
		><Button
			variant={!p.complete && p.beat.human ? 'approve' : 'primary'}
			iconRight="arrow-right"
			block
			onclick={p.next}>{nextLabel}</Button
		>
	</div>
</aside>
