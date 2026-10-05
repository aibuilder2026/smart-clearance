<script lang="ts" generics="T extends string">
	import { cx, Icon } from '@smart-clearance/core';

	type Props = {
		name: string;
		label: string;
		options: { id: T; label: string }[];
		value: T;
		onchange: (id: T) => void;
	};
	let { name, label, options, value, onchange }: Props = $props();
</script>

<!-- a question answered by picking one card: native radios, so the arrows move between them -->
<fieldset class="cs-choice">
	<legend>{label}</legend>
	<div class="cs-opts">
		{#each options as o (o.id)}<label class={cx('cs-opt', value === o.id && 'on')}
				><input type="radio" {name} value={o.id} checked={value === o.id} onchange={() => onchange(o.id)} /><span
					>{o.label}</span
				>{#if value === o.id}<Icon name="check" size={16} stroke={2.4} />{/if}</label
			>{/each}
	</div>
</fieldset>
