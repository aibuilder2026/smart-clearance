<script lang="ts" module>
	import type { MenuItem } from '../../index';

	/** a menu item that calls the network (SC-152): what the "…" button says while it waits, and once it went through */
	export type MoreItem =
		MenuItem | (Exclude<MenuItem, '-'> & { action: () => unknown; busy: string; done: string; onclick?: undefined });
</script>

<script lang="ts">
	import { Icon, Menu, refusal, Wait } from '../../index';
	import { onDestroy } from 'svelte';
	import { useConsole } from '../console.svelte';

	type Props = {
		/** "Actions for Munchly Foods": the button's name and the menu's */
		label: string;
		items: (MoreItem | null | false | undefined)[];
		width?: number;
		style?: string;
		open?: boolean;
	};
	let { label, items, width = 240, style = 'position: relative', open = $bindable(false) }: Props = $props();

	// an item that calls the network closes the menu at once, so its wait shows where focus returns: the "…" button
	// turns a spinner while it is out and a tick once it went through, saying both to a screen reader; the toast says
	// what changed, or why it did not
	const k = useConsole();
	const wait = new Wait({ done: () => true });
	let said = $state({ busy: '', done: '' });
	onDestroy(() => wait.stop());
	const run = (x: Extract<MoreItem, { action: () => unknown }>) => {
		if (wait.working || wait.phase === 'done') return;
		said = { busy: x.busy, done: x.done };
		void wait.run(async () => {
			try {
				await x.action();
			} catch (e) {
				k.notices.toast({ text: refusal(e), tone: 'err' });
				throw e;
			}
		});
	};
	const entries = $derived(
		items.map((x): MenuItem | null | false | undefined => {
			if (!x || x === '-' || !('action' in x) || !x.action) return x as MenuItem | null | false | undefined;
			const { action: _action, busy: _busy, done: _done, ...item } = x;
			return { ...item, onclick: () => run(x) };
		})
	);
	const face = $derived(wait.face);
</script>

<!-- the "…" button and its menu, as the prototype puts an IconButton beside a Menu in a positioned span -->
<span {style}
	><Menu bind:open items={entries} {width} {label}
		>{#snippet trigger(props)}<button
				{...props}
				type="button"
				class="iconbtn"
				aria-label={label}
				title={label}
				aria-busy={wait.working || undefined}
				>{#if face === 'busy'}<svg class="btn-arc" width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"
						><circle
							cx="10"
							cy="10"
							r="7.5"
							fill="none"
							stroke="currentColor"
							stroke-opacity="0.28"
							stroke-width="2.25"
						/><path
							d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5"
							fill="none"
							stroke="currentColor"
							stroke-width="2.25"
							stroke-linecap="round"
						/></svg
					>{:else if face === 'done'}<Icon name="check" size={20} stroke={2.4} />{:else}<Icon
						name="ellipsis"
						size={20}
					/>{/if}</button
			>{/snippet}</Menu
	><span class="sr-only" role="status"
		>{#if face === 'busy'}{said.busy}{:else if face === 'done'}{said.done}{/if}</span
	></span
>
