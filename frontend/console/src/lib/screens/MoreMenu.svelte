<script lang="ts">
	import { Icon, Menu, type MenuItem } from '@smart-clearance/core';

	type Props = {
		/** "Actions for Munchly Foods": the button's name and the menu's */
		label: string;
		items: (MenuItem | null | false | undefined)[];
		width?: number;
		style?: string;
		open?: boolean;
	};
	let { label, items, width = 240, style = 'position: relative', open = $bindable(false) }: Props = $props();
</script>

<!-- the "…" button and its menu, as the prototype puts an IconButton beside a Menu in a positioned span -->
<span {style}
	><Menu bind:open {items} {width} {label}
		>{#snippet trigger(props)}<button {...props} type="button" class="iconbtn" aria-label={label} title={label}
				><Icon name="ellipsis" size={20} /></button
			>{/snippet}</Menu
	></span
>
