<script lang="ts">
	import { Avatar, WindowFrame } from '@smart-clearance/core';
	import ConsoleScreen from './ConsoleScreen.svelte';
	import { LABEL, PLACE, user } from './people.ts';
	import type { DeviceSpec } from './types.ts';

	// the staff console on Neha's laptop (director.jsx ConsoleDevice): the console's own app in a browser window at its
	// address, scaled to fit, always the device in play
	type Props = { spec: DeviceSpec; width: number; height: number; scale: number };
	let { spec, width, height, scale }: Props = $props();
	const url = $derived(
		'https://smartclearance-console.web.app' +
			(spec.signin ? '/sign-in' : spec.console === '/overview' ? '/' : spec.console)
	);
	const me = user('neha');
</script>

<div class="dev" style="width: {width * scale}px">
	<div class="dev-label focus">
		<Avatar person={me} size="sm" /><span><b>{LABEL.neha} laptop</b><span>{PLACE.neha}</span></span>
	</div>
	<div class="dev-ring on" style="width: {width * scale}px; height: {height * scale}px; border-radius: {14 * scale}px">
		<div style="width: {width}px; height: {height}px; transform: scale({scale}); transform-origin: top left">
			<WindowFrame {url} style="width: {width}px; height: {height}px"
				><div class="console-in-demo" style="position: absolute; inset: 0">
					<ConsoleScreen {spec} />
				</div></WindowFrame
			>
		</div>
	</div>
</div>
