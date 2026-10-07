<script lang="ts">
	import Aura from '../../../components/Aura.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import type { IconName } from '../../../icons/registry';

	// a step an agent has not reached yet, or is working on (screens/common.jsx Locked): its name, what it will do, and
	// the typing dots while it works
	type Props = { icon?: IconName; agent: string; text: string; live?: boolean };
	let { icon = 'sparkles', agent, text, live }: Props = $props();
</script>

<div class="card pad row" style="gap: 14px; border-style: dashed">
	<Aura on={live} class="icontile soft" style="width: 40px; height: 40px; border-radius: 12px"
		><Icon name={icon} size={19} /></Aura
	>
	<div class="stack tight" style="gap: 2px">
		<b class="t-subhead">{agent}</b><span class="t-footnote muted">{text}</span>
	</div>
	{#if live}<span class="typing" style="margin-left: auto"><i></i><i></i><i></i></span>{/if}
</div>
