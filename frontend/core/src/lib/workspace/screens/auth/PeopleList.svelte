<script lang="ts">
	import Avatar from '../../../components/Avatar.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Spinner from '../../../components/Spinner.svelte';
	import { cx } from '../../../cx';
	import { useWorkspace } from '../../source';

	// everyone in the story, grouped by where they stand, with what each of them does (screens/auth.jsx PeopleList): the
	// stub's directory of people to step into
	type Props = { onpick: (id: string) => void; busy?: string | null; current?: string | null };
	let { onpick, busy, current }: Props = $props();
	const ws = useWorkspace();
	const userById = (id: string) => ws.state.users.find((u) => u.id === id);
</script>

<div class="stack" style="gap: 18px">
	{#each ws.explore ?? [] as g (g.group)}
		<div class="stack tight" style="gap: 8px">
			<div class="row tight"><b class="t-subhead">{g.group}</b><span class="t-caption subtle">{g.note}</span></div>
			<div class="si-people">
				{#each g.ids as [id, what] (id)}
					{@const u = userById(id)}
					{#if u}<button type="button" class={cx('si-person', current === id && 'on')} onclick={() => onpick(id)}
							><Avatar person={u} size="lg" /><span class="stack tight" style="gap: 1px"
								><b>{u.name}</b><span class="t-caption subtle">{ws.data.roles[u.role]} · {u.org}</span><span
									class="t-footnote">{what}</span
								></span
							>{#if busy === id}<Spinner size={18} />{:else if current === id}<Badge size="sm" tone="green">you</Badge
								>{/if}</button
						>{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>
