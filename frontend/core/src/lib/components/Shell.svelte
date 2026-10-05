<script lang="ts" module>
	import type { IconName } from '../icons/registry';

	/** a place in the app's navigation: a link when it has an `href`, otherwise a button that calls `onnav` */
	export type NavItem = {
		id: string;
		label: string;
		/** the tab bar's shorter label */
		short?: string;
		icon: IconName;
		href?: string;
		/** left out of the phone's tab bar */
		phoneHidden?: boolean;
		badge?: number | string;
		count?: number;
		/** a heading above this item in the sidebar */
		section?: string;
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useApp } from '../app.svelte';
	import Icon from '../icons/Icon.svelte';
	import Avatar, { type Person } from './Avatar.svelte';
	import Mark from './Mark.svelte';
	import Wordmark from './Wordmark.svelte';
	import WorkspaceMark, { type Workspace } from './WorkspaceMark.svelte';

	type Props = {
		nav: NavItem[];
		current: string;
		onnav?: (id: string) => void;
		user?: (Person & { name: string; role: string; org?: string }) | null;
		onuser?: () => void;
		footer?: Snippet;
		brandRight?: Snippet;
		/** the sidebar's lockup; the mark and wordmark unless set */
		brand?: Snippet;
		/** the rail's mark; the mark unless set */
		brandMark?: Snippet;
		ws?: (Workspace & { domain: string }) | null;
		onworkspace?: () => void;
		children?: Snippet;
	};
	let { nav, current, onnav, user, onuser, footer, brandRight, brand, brandMark, ws, onworkspace, children }: Props =
		$props();

	// the kit's Shell: a sidebar on desktops, an icon rail on tablets, a tab bar of four on phones. The page scrolls in
	// #main beside (or above) the navigation
	const app = useApp();
	const here = (id: string) => (current === id ? 'page' : undefined);
</script>

{#snippet item(n: NavItem, cls: string, body: Snippet, attrs: Record<string, unknown> = {})}
	{#if n.href}<a class={cls} href={n.href} aria-current={here(n.id)} {...attrs}>{@render body()}</a>{:else}<button
			type="button"
			class={cls}
			aria-current={here(n.id)}
			onclick={() => onnav?.(n.id)}
			{...attrs}>{@render body()}</button
		>{/if}
{/snippet}

{#if app.bp === 'phone'}
	<div class="layer" style="position: absolute; inset: 0">
		<div
			class="scroll"
			style="position: absolute; inset: 0; padding-bottom: calc(var(--tabbar-h) + var(--safe-bottom))"
			id="main"
		>
			{@render children?.()}
		</div>
		<nav class="tabbar" aria-label="Main">
			{#each nav.filter((n) => !n.phoneHidden).slice(0, 4) as n (n.id)}
				{#snippet body()}<Icon name={n.icon} size={23} stroke={current === n.id ? 2.1 : 1.7} /><span
						>{n.short || n.label}</span
					>{#if n.badge}<span class="badge-count">{n.badge}</span>{/if}{/snippet}
				{@render item(n, 'tab', body)}
			{/each}
		</nav>
	</div>
{:else if app.bp === 'tablet'}
	<div class="layer" style="position: absolute; inset: 0; display: grid; grid-template-columns: 76px minmax(0, 1fr)">
		<nav class="sidebar rail-compact" aria-label="Main" style="padding: 14px 10px">
			<div class="sb-brand" style="justify-content: center; padding: 2px 0 8px">
				{#if brandMark}{@render brandMark()}{:else}<Mark size={36} />{/if}
			</div>
			{#if ws}<button
					type="button"
					class="sb-ws-rail"
					onclick={onworkspace}
					aria-label="{ws.name} workspace"
					title="{ws.name} · {ws.domain}"><WorkspaceMark {ws} size={30} /></button
				>{/if}
			{#each nav as n (n.id)}
				{#snippet body()}<Icon name={n.icon} size={21} />{#if n.badge}<span
							class="badge-count"
							style="position: absolute; top: 3px; right: 6px">{n.badge}</span
						>{/if}{/snippet}
				{@render item(n, 'sb-item', body, { title: n.label, 'aria-label': n.label, style: 'position: relative' })}
			{/each}
			<div class="sb-foot">
				{#if user}<button
						type="button"
						class="sb-user"
						style="justify-content: center; padding: 6px"
						onclick={onuser}
						aria-label={user.name}><Avatar person={user} size="sm" /></button
					>{/if}
			</div>
		</nav>
		<div class="scroll" style="position: relative; min-width: 0" id="main">{@render children?.()}</div>
	</div>
{:else}
	<div
		class="layer"
		style="position: absolute; inset: 0; display: grid; grid-template-columns: var(--sidebar-w) minmax(0, 1fr)"
	>
		<nav class="sidebar" aria-label="Main">
			<div class="sb-brand">
				{#if brand}{@render brand()}{:else}<Mark size={32} /><Wordmark size={18} />{/if}{@render brandRight?.()}
			</div>
			{#if ws}<button type="button" class="sb-ws" onclick={onworkspace} aria-label="{ws.name} workspace, {ws.domain}"
					><WorkspaceMark {ws} size={30} /><span class="who"
						><span class="ws-name"><b>{ws.name}</b><Icon name="chevron-down" size={15} class="subtle" /></span><span
							class="ws-dom">{ws.domain}</span
						></span
					></button
				>{/if}
			{#each nav as n (n.id)}
				{#if n.section}<div class="sb-label">{n.section}</div>{/if}
				{#snippet body()}<Icon name={n.icon} size={19} /><span>{n.label}</span>{#if n.badge}<span class="badge-count"
							>{n.badge}</span
						>{:else if n.count != null}<span class="sb-n">{n.count}</span>{/if}{/snippet}
				{@render item(n, 'sb-item', body)}
			{/each}
			<div class="sb-foot">
				{@render footer?.()}{#if user}<button
						type="button"
						class="sb-user"
						onclick={onuser}
						title="{user.name} · {user.role}{user.org ? ' · ' + user.org : ''}"
						><Avatar person={user} size="sm" /><span class="who"
							><b>{user.name}</b><span>{user.role}{user.org ? ' · ' + user.org : ''}</span></span
						><Icon name="ellipsis" size={18} class="subtle" /></button
					>{/if}
			</div>
		</nav>
		<div class="scroll" style="position: relative; min-width: 0" id="main">{@render children?.()}</div>
	</div>
{/if}
