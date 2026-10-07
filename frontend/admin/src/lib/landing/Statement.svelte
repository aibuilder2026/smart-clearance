<script lang="ts">
	import { prefersReducedMotion } from '@smart-clearance/core';

	let { id, text }: { id: string; text: string } = $props();

	// The statement (SC-60): its words fill in from the tertiary ink to the full ink as it is read. The reading's
	// progress is 0 as the statement's top reaches 85% of the window and 1 as its foot reaches 45% (design3's
	// useScroll offset); word i lights over the tenth of it that starts at i/n × 0.92. The progress is one custom
	// property on the paragraph, and each word's inline opacity is a clamp over it, so a scroll costs one write; with
	// no script, or for a reader who asks for less motion, the property is unset and every word is lit.
	const words = $derived(text.split(' '));
	const n = $derived(words.length);
	const from = (i: number) => ((i / n) * 0.92).toFixed(4);

	let p: HTMLParagraphElement | undefined = $state();
	$effect(() => {
		const el = p;
		if (!el || prefersReducedMotion.current) return;
		let raf = 0;
		const measure = () => {
			raf = 0;
			const r = el.getBoundingClientRect();
			const start = innerHeight * 0.85;
			const end = innerHeight * 0.45;
			const progress = (start - r.top) / (r.height + start - end);
			el.style.setProperty('--p', String(Math.min(1, Math.max(0, progress))));
		};
		const onscroll = () => {
			if (!raf) raf = requestAnimationFrame(measure);
		};
		measure();
		addEventListener('scroll', onscroll, { passive: true });
		addEventListener('resize', onscroll);
		return () => {
			cancelAnimationFrame(raf);
			removeEventListener('scroll', onscroll);
			removeEventListener('resize', onscroll);
			el.style.removeProperty('--p');
		};
	});
</script>

<section class="say" {id} aria-label="In short">
	<p bind:this={p}>
		{#each words as word, i (i)}<span class="sw"
				>{word}<span class="lit" aria-hidden="true" style="opacity: clamp(0, calc((var(--p, 1) - {from(i)}) / 0.1), 1)"
					>{word}</span
				></span
			>{i < n - 1 ? ' ' : ''}{/each}
	</p>
</section>
