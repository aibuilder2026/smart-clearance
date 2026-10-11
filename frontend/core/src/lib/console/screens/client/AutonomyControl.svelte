<script lang="ts">
	import type { Agent, Autonomy, Client } from '@smart-clearance/api/console';
	import { Segmented } from '../../../index';
	import { useConsole } from '../../console.svelte';
	import { Saving } from '../../saving.svelte';
	import SaveLine from '../SaveLine.svelte';

	// how far an agent may go, changed in place (the pipeline's stop, the inspector): the level pressed stays pressed
	// while it saves, and its line says Saving…, Saved, or why it went back (SC-152)
	type Props = { c: Client; a: Agent; onautonomy: (a: Agent, v: Autonomy) => unknown; class?: string };
	let { c, a, onautonomy, class: className }: Props = $props();
	const k = useConsole();
	const levels = k.config.autonomy.map((x) => ({ id: x.id, label: x.label }));
	const level = new Saving(
		() => c.agents[a.id].autonomy as Autonomy,
		(v: Autonomy) => onautonomy(a, v)
	);
</script>

<Segmented
	class={className}
	label="{a.name}: autonomy"
	options={levels}
	value={level.value}
	onchange={level.change}
/><SaveLine wait={level.wait} />
