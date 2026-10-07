<script lang="ts">
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import Mark from '../../../components/Mark.svelte';
	import { cx } from '../../../cx';
	import { useRoute } from '../../context';
	import { store } from '../../store.svelte';
	import type { Notification, User } from '../../types';
	import Screen from '../common/Screen.svelte';

	// every role's inbox: the agents' pushes, kept so nothing is lost if a phone was off; opening one marks it read and
	// goes to its screen, when the person may open it (screens/admin.jsx Inbox)
	let { me, routes }: { me: User; routes?: string[] } = $props();
	const router = useRoute();
	const mine = $derived(store.state.notifications.filter((n) => n.to === me.id));
	const unread = $derived(mine.filter((n) => !n.read).length);

	const open = (n: Notification) => {
		store.update((st) => {
			const x = st.notifications.find((y) => y.id === n.id);
			if (x) x.read = true;
		});
		if (n.link && (!routes || routes.includes(n.link))) router.go(n.link);
	};
	const readAll = () =>
		store.update((st) =>
			st.notifications.forEach((n) => {
				if (n.to === me.id) n.read = true;
			})
		);
</script>

{#snippet markAll()}{#if unread > 0}<Button variant="ghost" size="sm" onclick={readAll}>Mark all read</Button
		>{/if}{/snippet}

<Screen {me} title="Inbox" sub={unread ? `${unread} unread` : 'All caught up'} actions={markAll}>
	{#if mine.length}
		<div class="list" style="max-width: 720px">
			{#each mine as n (n.id)}<button
					type="button"
					class="list-row"
					onclick={() => open(n)}
					style="grid-template-columns: 36px minmax(0,1fr) auto; width: 100%; text-align: left; align-items: start"
					><Mark size={32} /><span class="stack tight" style="gap: 2px"
						><b class="t-subhead">{n.title}</b><span
							class={cx('t-footnote muted', n.hindi && 'hi')}
							lang={n.hindi ? 'hi' : undefined}>{n.body}</span
						></span
					><span class="stack tight" style="justify-items: end; gap: 6px"
						><span class="t-caption subtle tnum">{n.at}</span>{#if !n.read}<span
								role="img"
								aria-label="Unread"
								style="width: 9px; height: 9px; border-radius: 9px; background: var(--primary)"
							></span>{/if}</span
					></button
				>{/each}
		</div>
	{:else}
		<Card style="max-width: 720px"
			><Empty
				icon="bell"
				title="No notifications"
				body="Pushes from the agents land here too, so nothing is lost if a phone was off."
			/></Card
		>
	{/if}
</Screen>
