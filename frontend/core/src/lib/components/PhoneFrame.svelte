<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '../cx';
	import AppRoot from './AppRoot.svelte';
	import StatusBar from './StatusBar.svelte';

	// a phone for the demo's stage: the app runs inside it at a phone's width, under a status bar and the island, with
	// the home bar at its foot (the kit's PhoneFrame). The app is embedded: its sheets stay inside the phone
	type Props = { time?: string; scale?: number; style?: string; dark?: boolean; children?: Snippet };
	let { time, scale = 1, style = '', dark, children }: Props = $props();
</script>

<div
	class="device-phone"
	style="{scale !== 1 ? `transform: scale(${scale}); ` : ''}transform-origin: top left; {style}"
>
	<div class="screen">
		<AppRoot embedded style="--safe-top: 50px; --safe-bottom: 22px">
			<StatusBar {time} {dark} />
			{@render children?.()}
			<div class={cx('homebar', dark && 'on-dark')} aria-hidden="true"></div>
		</AppRoot>
		<div class="island" aria-hidden="true"></div>
	</div>
</div>
