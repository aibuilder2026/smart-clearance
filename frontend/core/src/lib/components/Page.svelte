<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';

	type Props = {
		title: string;
		sub?: Snippet | string | null;
		/** the page a back button returns to, by name */
		back?: string;
		onback?: () => void;
		actions?: Snippet;
		/** what sits at the left of the bar when there is no back button (on a phone, the workspace) */
		lead?: Snippet;
		children?: Snippet;
		wide?: boolean;
		pad?: boolean;
		hideLarge?: boolean;
	};
	let { title, sub, back, onback, actions, lead, children, wide, pad = true, hideLarge }: Props = $props();

	// a navigation bar whose large title collapses into the bar once the page scrolls (the kit's Page): a sentinel under
	// the large title says when it has gone, within the scroll container the page sits in
	let sentinel: HTMLDivElement | undefined = $state();
	let scrolled = $state(false);
	$effect(() => {
		const s = sentinel;
		if (!s) return;
		const root = s.closest<HTMLElement>('.scroll');
		const io = new IntersectionObserver(([e]) => (scrolled = !e.isIntersecting), { root, threshold: 0 });
		io.observe(s);
		return () => io.disconnect();
	});
</script>

<div class="layer">
	<header class={cx('navbar', scrolled && 'scrolled')}>
		{#if back}<button type="button" class="nb-back" onclick={onback} aria-label="Back to {back}"
				><Icon name="chevron-left" size={22} stroke={2.2} /><span class="nb-back-t">{back}</span></button
			>{:else}{@render lead?.()}{/if}
		<span class="nb-title">{title}</span>
		<div class="nb-actions">{@render actions?.()}</div>
	</header>
	{#if !hideLarge}<div class="largetitle">
			<h1>{title}</h1>
			{#if sub}<div class="lt-sub">
					{#if typeof sub === 'string'}{sub}{:else}{@render sub()}{/if}
				</div>{/if}
		</div>{/if}
	<div bind:this={sentinel} style="height: 1px; margin-top: -1px" aria-hidden="true"></div>
	<div
		class="pagebody"
		style={pad ? `padding: 0 var(--page-x, 16px) 40px; max-width: ${wide ? 'none' : '1320px'}` : undefined}
	>
		{@render children?.()}
	</div>
</div>
