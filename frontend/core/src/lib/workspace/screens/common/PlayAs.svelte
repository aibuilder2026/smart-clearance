<script lang="ts">
	import type { Snippet } from 'svelte';
	import Avatar from '../../../components/Avatar.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { useAccount } from '../../context';
	import { D } from '../../data';

	// in the app, a quiet way to step into the partner the journey is waiting on (screens/common.jsx PlayAs)
	type Props = { who: string; route?: string; children?: Snippet };
	let { who, route, children }: Props = $props();
	const acc = useAccount();
	const p = $derived(D.people[who]);
</script>

{#if acc.switchTo && p}<button type="button" class="playas" onclick={() => acc.switchTo?.(who, route)}
		><Avatar person={p} size="xs" /><span
			>{#if children}{@render children()}{:else}Continue as {p.short}{/if}</span
		><Icon name="arrow-right" size={14} /></button
	>{/if}
