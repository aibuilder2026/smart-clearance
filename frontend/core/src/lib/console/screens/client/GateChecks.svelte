<script lang="ts">
	import type { GateCheck } from '@smart-clearance/api/console';
	import { Icon } from '@smart-clearance/core';

	// a batch's gates as the agents read them: a tick or a cross with the app's name, and with `full`, what the batch
	// has against what the app needs
	let { checks, full = false }: { checks: GateCheck[]; full?: boolean } = $props();
	const APP = { blinkit: 'Blinkit', zepto: 'Zepto', instamart: 'Instamart' } as const;
</script>

<span class="cs-gchips"
	>{#each checks as g (g.app)}{@const unit = g.app === 'blinkit' ? ' days' : '%'}<span
			class="gate {g.pass ? 'pass' : 'fail'}"
			title="{APP[g.app]}: needs {g.need}{unit}, has {g.has}{unit}"
			><Icon name={g.pass ? 'check' : 'x'} size={13} stroke={2.6} />{APP[g.app]}{#if full}<span class="cs-gneed"
					>{g.has}{unit}/{g.need}{unit}</span
				>{/if}</span
		>{/each}</span
>
