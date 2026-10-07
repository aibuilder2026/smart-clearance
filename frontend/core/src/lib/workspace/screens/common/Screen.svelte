<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useApp } from '../../../app.svelte';
	import Avatar from '../../../components/Avatar.svelte';
	import IconButton from '../../../components/IconButton.svelte';
	import Mark from '../../../components/Mark.svelte';
	import ModeMenuButton from '../../../components/ModeMenuButton.svelte';
	import Page from '../../../components/Page.svelte';
	import WorkspaceMark from '../../../components/WorkspaceMark.svelte';
	import { useRoute, useWorkspaceLead } from '../../context';
	import { WS } from '../../data';
	import { unreadFor } from '../../model';
	import { store } from '../../store.svelte';
	import type { User } from '../../types';

	// a screen of the workspace (screens/common.jsx Screen): the page with its bar. The bar carries the screen's own
	// actions, the appearance menu (not on phones), the inbox bell with the unread count and the person, and on a phone
	// the workspace at its left when there is no back button
	type Props = {
		me: User;
		title: string;
		sub?: string | Snippet | null;
		/** the screen a back button returns to, by its title */
		back?: string;
		actions?: Snippet;
		wide?: boolean;
		hideLarge?: boolean;
		children?: Snippet;
	};
	let { me, title, sub, back, actions, wide, hideLarge, children }: Props = $props();

	const app = useApp();
	const router = useRoute();
	const ws = useWorkspaceLead();
	const n = $derived(unreadFor(store.state, me));
</script>

{#snippet lead()}{#if app.bp === 'phone' && ws}<button
			type="button"
			class="ws-lead"
			onclick={ws.open}
			aria-label="{ws.name} workspace, on Smart-Clearance"
			><Mark size={24} /><span class="ws-sep" aria-hidden="true"></span><WorkspaceMark ws={WS} size={26} /></button
		>{/if}{/snippet}
{#snippet bar()}{@render actions?.()}{#if app.bp !== 'phone'}<ModeMenuButton />{/if}<IconButton
		icon="bell"
		label={n ? `${n} unread notifications` : 'Notifications'}
		badge={n || undefined}
		onclick={() => router.go('inbox')}
	/><button
		type="button"
		class="iconbtn"
		style="width: 40px"
		aria-label="Profile and settings"
		onclick={() => router.go('profile')}><Avatar person={me} size="sm" /></button
	>{/snippet}

<Page {title} {sub} {back} onback={router.back} {lead} actions={bar} {wide} {hideLarge}>{@render children?.()}</Page>
