<script lang="ts">
	import { COVERAGE, Icon } from '@smart-clearance/core';

	// a section's pieces that core has not built yet: what they are, and the port that brings them
	let { names, what }: { names: string[]; what: string } = $props();
	const withs = $derived([
		...new Set(names.map((n) => COVERAGE[n]).flatMap((c) => (c && c.status === 'planned' ? [c.with] : [])))
	]);
</script>

<div class="ds-specimen" style="border: 1px dashed var(--line-2); box-shadow: none; background: transparent">
	<span class="lbl row tight"><Icon name="hourglass" size={15} />Later: {what}</span>
	<p class="t-footnote muted" style="margin: 0">
		{names.join(', ')}
		{names.length === 1 ? 'arrives' : 'arrive'} with {withs.join(' and ')}. The prototype's design system page shows {names.length ===
		1
			? 'it'
			: 'them'} today.
	</p>
</div>
