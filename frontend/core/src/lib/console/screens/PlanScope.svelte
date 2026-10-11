<script lang="ts">
	import { Card, Icon } from '@smart-clearance/core';

	let { scope }: { scope: string[] } = $props();
</script>

<!-- what a plan covers, ticked off -->
<Card
	><ul class="cs-scope">
		{#each scope as x (x)}<li><Icon name="check" size={16} stroke={2.4} />{x}</li>{/each}
	</ul></Card
>
