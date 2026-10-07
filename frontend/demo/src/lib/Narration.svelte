<script lang="ts">
	import { Button, cx, Icon, Kbd, Money } from '@smart-clearance/core';
	import { D, store } from '@smart-clearance/core/workspace';
	import { STAGES } from './stages.ts';

	// the narration beside the stage (director.jsx Narration): the stage's title and who acts, what they see and what the
	// agents do, its figures, the pain it relieves, and its beats, with Back and Next. Compact: the real phone's sheet
	type Props = {
		n: number;
		beatIdx: number;
		beatsDone: number;
		onnext: () => void;
		onback: () => void;
		last?: boolean;
		compact?: boolean;
	};
	let { n, beatIdx, beatsDone, onnext, onback, last, compact }: Props = $props();

	const st = $derived(D.stages[n]);
	const cfg = $derived(STAGES[n]);
	const beats = $derived(cfg.beats);
	const cur = $derived(beats[beatIdx]);
	const short = (id?: string) => (id && (store.state.users.find((u) => u.id === id) || D.people[id])?.short) || '';
	const tone = (t?: string) => (t === 'red' ? 'var(--red-text)' : t === 'green' ? 'var(--primary-text)' : 'var(--fg)');
</script>

<aside class={cx('narr', compact && 'compact')} aria-label="Narration">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (the notes scroll, so the keyboard must reach them) -->
	<div
		class="narr-scroll"
		tabindex={compact ? undefined : 0}
		role={compact ? undefined : 'region'}
		aria-label={compact ? undefined : 'Stage notes'}
	>
		<div class="narr-head">
			<span class="narr-n">{String(n + 1).padStart(2, '0')}</span>
			<div class="stack tight" style="gap: 2px">
				<h2 class="narr-title">{st.title}</h2>
				<span class="t-footnote subtle">{st.when} · {st.screen}</span>
			</div>
		</div>
		<p class="narr-who">{st.who}</p>
		{#if !compact}<div class="narr-block">
				<b>What they see</b>
				<p>{st.sees}</p>
			</div>
			<div class="narr-block">
				<b>What the agents do</b>
				<p>{st.agents}</p>
			</div>{/if}
		<div class="figs">
			{#each cfg.figures as f (f.label)}<div class="fig">
					<span class="fig-label">{f.label}</span><Money
						value={f.value}
						size="m"
						decimals={f.decimals}
						roll
						style="color: {tone(f.tone)}"
					/>
				</div>{/each}
		</div>
		<div class="narr-pain">
			<span class="pain">“{st.pain}”</span><Icon name="arrow-right" size={16} /><span class="relief">{st.relief}</span>
		</div>
		<ol class="beats">
			{#each beats as b, i (i)}
				{@const done = i < beatsDone}
				{@const now = i === beatIdx && !done}
				<li class={cx('beat', done && 'done', now && 'now', b.human && 'human')}>
					<span class="beat-dot"
						>{#if done}<Icon name="check" size={13} stroke={3} />{:else if now && b.agent}<span class="beat-aura"
							></span>{/if}</span
					>
					<span class="beat-body"
						><span class="beat-who"
							>{b.agent ? b.agent + ' agent' : short(b.who)}{b.time
								? ' · ' + (b.date ? b.date.split(' ')[0] + ' ' : '') + b.time
								: ''}</span
						><span>{b.text}</span>{#if now && b.hint}<span class="beat-hint"
								><Icon name="hand" size={13} />{b.hint}, or press <Kbd>→</Kbd></span
							>{/if}{#if now && b.agent}<span class="beat-hint"
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
			onclick={onback}
			disabled={n === 0 && beatIdx === 0}
			aria-label="Back">Back</Button
		><Button
			variant={cur && cur.human && beatsDone < beats.length ? 'approve' : 'primary'}
			iconRight="arrow-right"
			block
			onclick={onnext}
			>{beatsDone >= beats.length
				? last
					? 'Finish'
					: 'Next stage · ' + D.stages[n + 1].title
				: cur && cur.agent
					? 'Skip ahead'
					: 'Next'}</Button
		>
	</div>
</aside>
