<script lang="ts">
	import { DURATION, EASE, Product, cx, prefersReducedMotion } from '@smart-clearance/core';
	import type { Figures } from './figures';

	let { f }: { f: Figures } = $props();

	// each step's first chip, counting along all three
	const first = $derived(f.steps.map((_, i) => f.steps.slice(0, i).reduce((t, s) => t + s.who.length, 0)));
	const total = $derived(f.steps.reduce((t, s) => t + s.who.length, 0));
	// how many agents have started work: all of them, as the page rests and as the server sends it
	let lit = $state(Infinity);
	let list: HTMLOListElement | undefined = $state();

	// the steps rise in turn as they come into view, then their agents start work one by one, about three seconds,
	// once (design3: 0.42 s a card, 0.18 s apart; a chip after 620 ms, then every 230 ms). A list already on screen
	// when the page starts, or a reader who asks for less motion, sees it at rest.
	$effect(() => {
		const el = list;
		if (!el || prefersReducedMotion.current || el.getBoundingClientRect().top < innerHeight) return;
		const cards = [...el.children] as HTMLElement[];
		const from = { opacity: '0', transform: 'translateY(14px)' };
		for (const c of cards) Object.assign(c.style, from);
		lit = 0;
		let timer = 0;
		const io = new IntersectionObserver(
			(entries) => {
				if (!entries.some((e) => e.isIntersecting)) return;
				io.disconnect();
				cards.forEach((c, i) => {
					c.animate([from, { opacity: '1', transform: 'none' }], {
						duration: DURATION.slow,
						delay: i * 180,
						easing: `cubic-bezier(${EASE.join(', ')})`,
						fill: 'backwards'
					});
					Object.assign(c.style, { opacity: '', transform: '' });
				});
				const next = () => {
					lit += 1;
					if (lit < total) timer = window.setTimeout(next, 230);
				};
				timer = window.setTimeout(next, 620);
			},
			{ threshold: 0.35 }
		);
		io.observe(el);
		return () => {
			io.disconnect();
			clearTimeout(timer);
		};
	});
</script>

<!-- 2 · how it works: three steps, the agents named under each, the human yes in amber (SC-28) -->
<section id="how" class="sec sec-how" aria-labelledby="how-h">
	<div class="wrap">
		<header class="sec-head">
			<h2 id="how-h" class="sec-h plain">From at risk to sold, in three steps.</h2>
			<p class="sec-sub">
				Smart‑Clearance watches the stock in your distributors' godowns. When a batch won't sell before its date, its
				agents find the exit that recovers the most, and do the work once a person says yes.
			</p>
		</header>
		<ol class="steps3" bind:this={list}>
			{#each f.steps as s, i (s.t)}<li class={cx('step3', s.yes && 'yes')}>
					<Product name={s.art} size={128} class="art" />
					<span class="row tight"
						><span class="st-n" aria-hidden="true">{i + 1}</span>
						<h3>{s.t}</h3></span
					>
					<p>{s.text}</p>
					<span class="agents"
						>{#each s.who as w, j (w)}<span
								class={cx('chip-agent', s.yes && j === 0 && 'person', first[i] + j < lit && 'on')}
								><i aria-hidden="true"></i>{w}</span
							>{/each}</span
					>
				</li>{/each}
		</ol>
	</div>
</section>
