<script lang="ts">
	import { Badge, GateChips, Icon, Money, Product, Roll, cx, fmt } from '@smart-clearance/core';
	import type { Figures } from './figures';
	import { riseInView } from './rise';

	let { f }: { f: Figures } = $props();
	const h = $derived(f.how);

	let alert: HTMLElement | undefined = $state();
	let prices: HTMLElement | undefined = $state();
	let plan: HTMLElement | undefined = $state();
	// each card rises as the reader reaches it; its figure rolls in as its row arrives (the spoken figure is the final
	// one throughout), and the plan's agents light in turn once its yes is on screen (design3: 900 ms, then every 220).
	// As the page rests, and as the server sends it, every figure is in place and every agent lit
	let alertRolls = $state(false);
	let planRolls = $state(false);
	let lit = $state(Infinity);

	$effect(() => {
		if (!alert) return;
		let t = 0;
		const stop = riseInView(alert, { show: () => (t = window.setTimeout(() => (alertRolls = true), 490)) });
		return () => {
			stop?.();
			clearTimeout(t);
		};
	});
	$effect(() => {
		if (prices) return riseInView(prices);
	});
	$effect(() => {
		if (!plan) return;
		const n = h.plan.released.length;
		const timers: number[] = [];
		const stop = riseInView(plan, {
			arm: () => (lit = 0),
			show: () => {
				timers.push(window.setTimeout(() => (planRolls = true), 270));
				for (let i = 0; i < n; i++) timers.push(window.setTimeout(() => (lit = i + 1), 900 + i * 220));
			}
		});
		return () => {
			stop?.();
			timers.forEach(clearTimeout);
		};
	});
</script>

<!-- 2 · how it works: the moments each team actually sees, the agents named beside each (SC-28, option B) -->
<section id="how" class="sec sec-how" aria-labelledby="how-h">
	<div class="wrap">
		<header class="sec-head">
			<h2 id="how-h" class="sec-h plain">How Smart‑Clearance works</h2>
			<p class="sec-sub">
				It watches the stock in your distributors' godowns. When a batch won't sell before its date, its agents find the
				exit that recovers the most and do the work, once a person says yes.
			</p>
		</header>
		<ol class="moments">
			{#each h.moments as m, i (m.t)}<li class={cx('moment', i % 2 === 1 && 'flip')}>
					<div class="m-copy">
						<span class="row tight"
							><span class={cx('step-n', m.yes && 'yes')} aria-hidden="true">{i + 1}</span>
							<h3>{m.t}</h3></span
						>
						<p>{m.text}</p>
						<span class="agents"
							>{#each m.who as w, j (w)}<span class={cx('chip-agent on', m.yes && j === 0 && 'person')}
									><i aria-hidden="true"></i>{w}</span
								>{/each}</span
						>
					</div>
					<div class="m-stage">
						<Product name={m.art} size={124} class="m-art" />
						{#if i === 0}
							<div bind:this={alert} class="m-card" role="group" aria-label="The Watcher's alert">
								<div class="m-head" data-rise>
									<span class="chip-agent on"><i aria-hidden="true"></i>Watcher · 09:00</span><Badge tone="red" dot
										>At risk</Badge
									>
								</div>
								<div class="m-batch" data-rise>
									<Product name="pack-snack-plain" size={52} /><span
										><b>{h.alert.product}</b><span>{h.alert.where}</span></span
									>
								</div>
								<div class="m-gates" data-rise><GateChips gates={h.alert.gates} /></div>
								<div class="m-big" data-rise>
									<span class="num"
										>{#key alertRolls}<Roll value={h.alert.atRisk} from={alertRolls ? 0 : undefined} />{/key}</span
									><span>packs won't sell in the {h.alert.daysLeft} days they have left</span>
								</div>
							</div>
						{:else if i === 1}
							<div bind:this={prices} class="m-card" role="group" aria-label="The Valuer's prices, net a pack">
								<div class="m-head" data-rise>
									<span class="chip-agent on"><i aria-hidden="true"></i>Valuer</span><span class="t-footnote subtle"
										>net a pack, after costs</span
									>
								</div>
								{#each h.prices as p (p.id)}<div class={cx('m-row', p.bin ? 'bin' : p.off && 'off')} data-rise>
										<span class="k"><i class="ex-dot {p.dot}" aria-hidden="true"></i>{p.name}</span><span class="v"
											>{p.v}</span
										><span class="s">{p.s}</span>
									</div>{/each}
								<div data-rise>
									<div class="m-split-cap">
										<span>The Router's split</span><span>{fmt.num(h.split.total)} packs</span>
									</div>
									<div class="m-split" aria-hidden="true">
										<span class="k" style:flex-grow={h.split.kiranas}></span><span
											class="e"
											style:flex-grow={h.split.expiresoon}
										></span>
									</div>
									<div class="m-split-legend">
										<span
											><i class="ex-dot kirana" aria-hidden="true"></i>{fmt.num(h.split.kiranas)} to {h.split.shops} kiranas</span
										><span
											><i class="ex-dot expiresoon" aria-hidden="true"></i>{fmt.num(h.split.expiresoon)} on ExpireSoon</span
										>
									</div>
								</div>
							</div>
						{:else}
							<!-- the plan's own approve button, pictured: it does nothing on this page -->
							<div bind:this={plan} class="m-card yes" role="group" aria-label="The plan, waiting for one yes">
								<div class="m-head" data-rise>
									<b>Approve the plan</b><Badge tone="amber" dot>Waiting for you</Badge>
								</div>
								<div class="m-big flush" data-rise>
									{#key planRolls}<Money value={h.plan.net} roll from={planRolls ? 0 : undefined} />{/key}<span
										>recovered, against {fmt.inr(-h.plan.bin)} to destroy it</span
									>
								</div>
								{#each h.plan.lines as l (l.id)}<div class="m-row" data-rise>
										<span class="k"><i class="ex-dot {l.id}" aria-hidden="true"></i>{l.label}</span><span class="v"
											>{fmt.inr(l.net)}</span
										>
									</div>{/each}
								<div class="m-go" data-rise>
									<span class="btn btn-approve btn-lg"><Icon name="check" size={18} />Approve · release the agents</span
									>
								</div>
								<div class="m-after" data-rise>
									{#each h.plan.released as w, j (w)}<span class={cx('chip-agent', j < lit && 'on')}
											><i aria-hidden="true"></i>{w}</span
										>{/each}
								</div>
							</div>
						{/if}
					</div>
				</li>{/each}
		</ol>
	</div>
</section>
