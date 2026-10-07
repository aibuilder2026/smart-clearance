<script lang="ts">
	import { Button, fmt, Mark, Money, prefersReducedMotion, rise, WorkspaceMark } from '@smart-clearance/core';
	import { D, WS } from '@smart-clearance/core/workspace';

	// the end of the story (director.jsx Finale): what one batch recovered instead of the bin, what else it kept, and
	// the Mango Drink batch the same morning
	let { onrestart, onclose }: { onrestart: () => void; onclose: () => void } = $props();
	const ML = (id: string) => D.mangoPlan.lines.find((l) => l.id === id) || { units: 0 };
	const facts: [string, string][] = [
		[fmt.inr(D.plan.itcRetained), 'GST credit kept'],
		[fmt.kg(D.plan.kg), 'out of landfill'],
		[fmt.inr(D.support.total), `to Rakesh instead of a ${fmt.inr(D.claim.total)} claim`],
		['0', 'cartons destroyed'],
		['1', 'human decision, at 09:40']
	];
	const reduce = prefersReducedMotion.current;
</script>

<!-- a dialog over the stage, which is inert behind it while it shows (Director.svelte) -->
<div
	class="finale"
	role="dialog"
	aria-modal="true"
	aria-labelledby="finale-title"
	transition:rise|global={{ y: 0, duration: 240 }}
>
	<div class="finale-in">
		<Mark size={64} play={!reduce} />
		<span class="finale-ws"><WorkspaceMark ws={WS} size={22} /><span>{WS.name} · {WS.domain}</span></span>
		<h2 class="finale-title" id="finale-title">Every carton gets a second chance</h2>
		<p class="finale-hi hi" lang="hi">हर कार्टन को दूसरा मौका</p>
		<div class="finale-hero">
			<Money value={D.actual.net} roll from={0} class="finale-num" style="color: var(--primary-text)" /><span
				class="finale-cap"
				>recovered from one batch of chips, instead of {fmt.inr(-D.plan.writeOff.total)} to destroy it</span
			>
		</div>
		<div class="finale-facts">
			{#each facts as [v, k], i (k)}<span in:rise|global={{ y: 8, delay: 500 + i * 100 }}><b>{v}</b> {k}</span>{/each}
		</div>
		<p class="finale-line">
			Mango Drink, the same morning: {fmt.num(ML('kirana').units)} packs to Hyderabad kiranas, {ML('staff').units} to the
			staff sale, {D.mangoFb} to Feeding India. Nothing destroyed.
		</p>
		<div class="row wrap" style="gap: 10px; justify-content: center">
			<Button variant="primary" size="lg" icon="rotate-ccw" onclick={onrestart}>Play it again</Button><Button
				variant="secondary"
				size="lg"
				onclick={onclose}>Stay on the last stage</Button
			>
		</div>
	</div>
</div>
