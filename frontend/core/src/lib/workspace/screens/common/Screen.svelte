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
	import { useLive } from '../../live.svelte';
	import { unreadFor } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import LiveBand from '../live/LiveBand.svelte';
	import LiveLine from '../live/LiveLine.svelte';

	// a screen of the workspace (screens/common.jsx Screen): the page with its bar. The bar carries the screen's own
	// actions, the appearance menu (not on phones), the inbox bell with the unread count and the person, and on a phone
	// the workspace at its left when there is no back button. On the live workspace (SC-73, SC-68 option B) every page says
	// under its title whether it is live and what journey time it is, and a dropped stream, or a step that did not go
	// through, is a band across the page; on the stub none of that draws
	type Props = {
		me: User;
		title: string;
		sub?: string | Snippet | null;
		/** the screen a back button returns to, by its title */
		back?: string;
		actions?: Snippet;
		wide?: boolean;
		hideLarge?: boolean;
		/** a row under the large title (the Route Room's batch tabs) */
		below?: Snippet;
		children?: Snippet;
	};
	let { me, title, sub, back, actions, wide, hideLarge, below, children }: Props = $props();

	const app = useApp();
	const router = useRoute();
	const lead = useWorkspaceLead();
	const ws = useWorkspace();
	const n = $derived(unreadFor(ws.state, me));
	const live = useLive();
	const on = $derived(!!live?.on);
</script>

{#snippet leading()}{#if app.bp === 'phone' && lead}<button
			type="button"
			class="ws-lead"
			onclick={lead.open}
			aria-label="{lead.name} workspace, on Smart-Clearance"
			><Mark size={24} /><span class="ws-sep" aria-hidden="true"></span><WorkspaceMark
				ws={ws.data.workspace}
				size={26}
			/></button
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

{#snippet liveSub()}<span class="lv-subtext"
		>{#if typeof sub === 'string'}{sub}{:else if sub}{@render sub()}{/if}</span
	>{#if live}<LiveLine {live} />{/if}{/snippet}
{#snippet band()}{#if live}<LiveBand {live} />{/if}{/snippet}
{#snippet barSub()}{#if live}<LiveLine {live} short />{/if}{/snippet}

<Page
	{title}
	sub={on ? liveSub : sub}
	{back}
	onback={router.back}
	lead={leading}
	actions={bar}
	{wide}
	{hideLarge}
	top={on ? band : undefined}
	{below}
	barSub={on ? barSub : undefined}>{@render children?.()}</Page
>
