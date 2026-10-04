<script lang="ts">
	let {
		checked = $bindable(false),
		onchange,
		label,
		disabled
	}: { checked?: boolean; onchange?: (v: boolean) => void; label: string; disabled?: boolean } = $props();
</script>

<button
	type="button"
	role="switch"
	aria-checked={!!checked}
	aria-label={label}
	{disabled}
	class="switch"
	onclick={() => {
		checked = !checked;
		onchange?.(checked);
	}}><span class="knob"></span></button
>
