<script lang="ts">
	import { untrack } from 'svelte';
	import { useNotice } from '../../../notice.svelte';
	import { useWorkspace } from '../../source';
	import type { Notification, User } from '../../types';

	// in-app banners for the notifications that arrive while the person has the app open (screens/common.jsx
	// PushBanners): the ones already there when it opens stay in the inbox
	type Props = { me: User; onopen?: (n: Notification) => void };
	let { me, onopen }: Props = $props();
	const notices = useNotice();
	const ws = useWorkspace();
	let seen: Set<string> | null = null;

	$effect(() => {
		const mine = ws.state.notifications.filter((n) => n.to === me.id);
		untrack(() => {
			if (seen === null) {
				// bookkeeping only: nothing draws from it, so it is not state
				// eslint-disable-next-line svelte/prefer-svelte-reactivity
				seen = new Set(mine.map((n) => n.id));
				return;
			}
			const s = seen;
			mine.forEach((n) => n.read && s.add(n.id));
			mine
				.filter((n) => !s.has(n.id) && !n.read)
				.reverse()
				.forEach((n) => {
					s.add(n.id);
					notices.push({ title: n.title, body: n.body, at: n.at, hindi: n.hindi, onopen: () => onopen?.(n) });
				});
		});
	});
</script>
