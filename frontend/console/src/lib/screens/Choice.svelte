<script lang="ts" generics="T extends string">
	import { Badge, cx, Icon } from '@smart-clearance/core';

	type Props = {
		name: string;
		label: string;
		/** an option may carry a note under its label; one not built yet (`soon`, SC-139's route A) shows with it, and
		 *  is not chosen unless it already is */
		options: { id: T; label: string; note?: string; soon?: boolean }[];
		value: T;
		onchange: (id: T) => void;
	};
	let { name, label, options, value, onchange }: Props = $props();
</script>

<!-- a question answered by picking one card: native radios, so the arrows move between them -->
<fieldset class="cs-choice">
	<legend>{label}</legend>
	<div class="cs-opts">
		{#each options as o (o.id)}{@const off = !!o.soon && value !== o.id}<label
				class={cx('cs-opt', value === o.id && 'on', off && 'off')}
				><input
					type="radio"
					{name}
					value={o.id}
					checked={value === o.id}
					disabled={off}
					onchange={() => onchange(o.id)}
				/><span class="stack tight" style="gap: 1px"
					><span
						>{o.label}{#if o.soon}<Badge size="sm" style="margin-left: 6px">coming</Badge>{/if}</span
					>{#if o.note}<span class="t-caption subtle cs-note">{o.note}</span>{/if}</span
				>{#if value === o.id}<Icon name="check" size={16} stroke={2.4} />{/if}</label
			>{/each}
	</div>
</fieldset>
