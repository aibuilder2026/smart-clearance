<script lang="ts">
	import type { DeviceSpec } from './types.ts';

	// the staff console inside the demo (director.jsx ConsoleScreen): the console's own app, embedded (SC-169)
	let { spec, onsignin }: { spec: DeviceSpec; onsignin: () => void } = $props();
	void onsignin;
</script>

<div class="console-pending">{spec.console}</div>
