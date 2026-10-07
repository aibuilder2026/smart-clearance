<script lang="ts">
	import { Icon, Money, Roll, cx, fmt } from '@smart-clearance/core';
	import type { Figures } from './figures';
	import { riseInView } from './rise';

	let { f }: { f: Figures } = $props();

	// 5 · the ledger (SC-60): Impact's own document for one batch. It rises as the reader reaches it, its lines following
	// in turn, and its figures roll in as it rises; as the page rests, and as the server sends it, every figure is in place
	let ledger: HTMLElement | undefined = $state();
	let rolled = $state(false);
	$effect(() => {
		if (!ledger) return;
		let t = 0;
		const stop = riseInView(ledger, { show: () => (t = window.setTimeout(() => (rolled = true), 300)) });
		return () => {
			stop?.();
			clearTimeout(t);
		};
	});
</script>

<section class="sec-ledger" id="ledger" aria-labelledby="ledger-h">
	<div class="ledger" role="group" aria-labelledby="ledger-h" bind:this={ledger}>
		<div class="ledger-head" data-rise>
			<b
				><i aria-hidden="true"><Icon name="leaf" size={14} stroke={2.2} /></i><span id="ledger-h"
					>Impact · the ledger for one batch</span
				></b
			><span>posted after the return window</span>
		</div>
		{#each f.ledger as l (l.k)}<div class={cx('ledger-row', l.kind === 'zero' && 'zero')} data-rise>
				<span class="k">{l.k}</span><span class="v"
					>{#if l.kind === 'money'}{#key rolled}<Money
								value={l.v}
								roll={rolled}
								from={rolled ? 0 : undefined}
							/>{/key}{:else if l.kind === 'kg'}<span class="num"
							>{#key rolled}<Roll value={l.v} from={rolled ? 0 : undefined} />{/key} kg</span
						>{:else}<span class="num">{fmt.num(l.v)}</span>{/if}</span
				><span class="s">{l.s}</span>
			</div>{/each}
		<div class="ledger-foot" data-rise>
			<span>BRSR Principle 6 · two rows an auditor can follow back to the batch</span><span>one illustrative batch</span
			>
		</div>
	</div>
	<p class="ledger-note">An illustrative batch. Every figure is worked out from the journey map.</p>
</section>
