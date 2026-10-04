<script lang="ts">
	import { Badge, Button, Icon } from '@smart-clearance/core';

	let { theme, list }: { theme: 'light' | 'dark'; list: [string, string, string][] } = $props();
	const RAMP = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
	const ink = (v: string) =>
		v === '--amber'
			? '#241700'
			: ['--bg', '--surface'].includes(v)
				? 'var(--fg)'
				: v.startsWith('--fg')
					? 'var(--bg)'
					: '#fff';
</script>

<div class="edition" data-theme={theme}>
	<div class="ground" aria-hidden="true"></div>
	<div class="layer stack snug">
		<div class="row between">
			<b class="row tight"
				><Icon name={theme === 'dark' ? 'moon' : 'sun'} size={18} />{theme === 'dark' ? 'Dark' : 'Light'}</b
			><Badge tone="green" dot>composed separately</Badge>
		</div>
		<div class="swatches">
			{#each list as [v, hex, name] (v)}<div class="sw">
					<div class="chipc" style="background: var({v}); color: {ink(v)}">{hex}</div>
					<div class="meta"><b>{name}</b><span>{v}</span></div>
				</div>{/each}
		</div>
		<div class="ramp">
			{#each RAMP as r (r)}<div style="background: var(--green-{r}, #000); color: {+r >= 500 ? '#fff' : '#0d1c15'}">
					{r}
				</div>{/each}
		</div>
		<div class="row wrap" style="gap: 8px">
			<Button variant="primary" size="sm" icon="route">Route</Button><Button variant="approve" size="sm" icon="check"
				>Approve</Button
			><Button variant="tinted" size="sm">Tinted</Button><Badge tone="red" dot>At risk</Badge><Badge tone="violet"
				>ExpireSoon</Badge
			>
		</div>
	</div>
</div>
