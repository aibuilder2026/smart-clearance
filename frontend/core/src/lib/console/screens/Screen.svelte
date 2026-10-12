<script lang="ts">
	import { Avatar, ModeMenuButton, Page, useApp } from '../../index';
	import type { Snippet } from 'svelte';
	import { useConsole } from '../console.svelte';

	type Props = {
		title: string;
		sub?: string | null;
		back?: string;
		onback?: () => void;
		actions?: Snippet;
		children?: Snippet;
	};
	let { title, sub, back, onback, actions, children }: Props = $props();
	// a console screen: the kit's Page, with the appearance menu at the end of its bar on tablets and desktops. On a phone
	// the Shell has no sidebar, so the bar carries the account, with Sign out, as the workspace's does (SC-194)
	const app = useApp();
	const k = useConsole();
</script>

{#snippet bar()}{@render actions?.()}{#if app.bp !== 'phone'}<ModeMenuButton />{:else if k.me}<button
			type="button"
			class="iconbtn"
			style="width: 40px"
			aria-label="Account: {k.me.name}, sign out"
			onclick={k.account}><Avatar person={k.me} size="sm" /></button
		>{/if}{/snippet}

<Page {title} {sub} {back} {onback} actions={bar}>{@render children?.()}</Page>
