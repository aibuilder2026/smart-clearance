<script lang="ts">
	import { ModeMenuButton, Page, useApp } from '@smart-clearance/core';
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		sub?: string | null;
		back?: string;
		onback?: () => void;
		actions?: Snippet;
		children?: Snippet;
	};
	let { title, sub, back, onback, actions, children }: Props = $props();
	// a console screen: the kit's Page, with the appearance menu at the end of its bar on tablets and desktops
	const app = useApp();
</script>

{#snippet bar()}{@render actions?.()}{#if app.bp !== 'phone'}<ModeMenuButton />{/if}{/snippet}

<Page {title} {sub} {back} {onback} actions={bar}>{@render children?.()}</Page>
