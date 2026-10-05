<script lang="ts">
	import Icon from '../icons/Icon.svelte';
	import { useTheme } from '../theme.svelte';
	import Menu from './Menu.svelte';

	const theme = useTheme();
	let open = $state(false);
	const check = (on: boolean) => (on ? checkmark : undefined);
</script>

{#snippet checkmark()}<Icon name="check" size={16} />{/snippet}

<!-- light, dark or the device's setting. The button shows the current appearance; both icons are drawn and the page's
     data-theme picks one, so a prerendered page shows the right one before it hydrates -->
<span style="position: relative">
	<Menu
		bind:open
		width={200}
		items={[
			{ label: 'Appearance', heading: true },
			{
				label: 'Light',
				icon: 'sun',
				checked: theme.mode === 'light',
				right: check(theme.mode === 'light'),
				onclick: () => theme.setMode('light')
			},
			{
				label: 'Dark',
				icon: 'moon',
				checked: theme.mode === 'dark',
				right: check(theme.mode === 'dark'),
				onclick: () => theme.setMode('dark')
			},
			{
				label: 'Match device',
				icon: 'monitor',
				checked: theme.mode === 'system',
				right: check(theme.mode === 'system'),
				onclick: () => theme.setMode('system')
			}
		]}
	>
		{#snippet trigger(props)}<button {...props} type="button" class="iconbtn" aria-label="Appearance" title="Appearance"
				><Icon name="sun" size={20} class="when-light" /><Icon name="moon" size={20} class="when-dark" /></button
			>{/snippet}
	</Menu>
</span>
