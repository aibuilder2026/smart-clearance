<script lang="ts">
	import { profileLines, type Profile } from '@smart-clearance/api/console';
	import { Card, Icon, type IconName } from '@smart-clearance/core';
	import { useConsole } from '#lib/console.svelte.ts';

	let { profile }: { profile: Profile } = $props();
	const k = useConsole();
	const lines = $derived(profileLines(profile, k.config.exits, k.config.defaults.staffCap));
</script>

<!-- what a supply-chain profile sets up, line by line -->
<Card class="cs-summary"
	><b class="t-subhead">What this profile sets up</b>
	<ul>
		{#each lines as l, i (i)}<li>
				<Icon name={l.icon as IconName} size={16} stroke={2} /><span>{l.text}</span>
			</li>{/each}
	</ul>
	<span class="t-footnote subtle">Every plan still waits for one person's approval.</span></Card
>
