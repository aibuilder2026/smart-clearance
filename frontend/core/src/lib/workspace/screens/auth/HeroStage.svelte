<script lang="ts">
	import Mark from '../../../components/Mark.svelte';
	import Money from '../../../components/Money.svelte';
	import Product from '../../../components/Product.svelte';
	import Tracker from '../../../components/Tracker.svelte';
	import Wordmark from '../../../components/Wordmark.svelte';
	import { cx } from '../../../cx';
	import { fmt } from '../../../format';
	import Icon from '../../../icons/Icon.svelte';
	import { prefersReducedMotion } from '../../../motion';
	import { D, TRACK } from '../../data';

	// the stage beside the sign-in form on desktops: the product, and its one number (screens/auth.jsx HeroStage).
	// WCAG 2.2.2: the batch walks the nine stages once and holds on the result, so nothing loops beside the sign-in. The
	// walk can be paused on the way (a paused hero stays paused on return), and replayed from the start.
	// guided (the demo, before the batch exists): the product and its promise, without the result
	let { guided }: { guided?: boolean } = $props();

	const KEY = 'sc3-hero-paused';
	const reduce = $derived(prefersReducedMotion.current);
	const wasPaused = (() => {
		try {
			return localStorage.getItem(KEY) === '1';
		} catch {
			return false; // storage blocked: the walk plays
		}
	})();
	let paused = $state(wasPaused);
	let k = $state(wasPaused ? 9 : 0);
	const done = $derived(k >= 9);
	$effect(() => {
		if (reduce) {
			k = 9;
			return;
		}
		if (paused || k >= 9) return;
		const t = setTimeout(() => (k = k + 1), 1000);
		return () => clearTimeout(t);
	});
	const remember = (v: boolean) => {
		try {
			localStorage.setItem(KEY, v ? '1' : '0');
		} catch {
			/* storage blocked */
		}
	};
	function control() {
		if (done) {
			k = 0;
			paused = false;
			remember(false);
		} else {
			paused = !paused;
			remember(paused);
		}
	}
</script>

<div class={cx('si-stage', paused && 'paused')}>
	<div class="stack tight" style="gap: 10px">
		<div class="si-product"><Mark size={36} /><Wordmark size={21} /></div>
		<p class="si-tagline">
			Every near-expiry carton gets a second chance, chosen by AI. <span class="hi" lang="hi"
				>हर कार्टन को दूसरा मौका</span
			>
		</p>
	</div>
	<div class="si-renders" aria-hidden="true">
		<Product name="pack-chips" size={176} float class="r1" /><Product
			name="carton-hero"
			size={208}
			float
			class="r2"
		/><Product name="pack-mango" size={150} float class="r3" />
	</div>
	{#if !guided}
		<div class="si-figure">
			<span class="si-cap">Recovered from one batch of Munchly chips headed for the bin</span><Money
				value={k >= 9 ? D.actual.net : Math.round((D.actual.net * k) / 9)}
				size="xl"
				roll
				style="color: var(--primary-text)"
			/><span class="si-cap">instead of {fmt.inr(-D.plan.writeOff.total)} to destroy it</span>
		</div>
		<div class="si-track" aria-hidden="true">
			<Tracker stages={TRACK} done={Math.min(k, 9)} current={k < 9 ? k : -1} />
		</div>
		{#if !reduce}<div class="si-ctl">
				<button type="button" class="btn btn-ghost btn-sm" onclick={control}
					><Icon name={done ? 'rotate-ccw' : paused ? 'play' : 'pause'} size={15} />{done
						? 'Replay animation'
						: paused
							? 'Play animation'
							: 'Pause animation'}</button
				>
			</div>{/if}
	{/if}
</div>
