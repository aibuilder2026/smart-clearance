<script lang="ts">
	import Avatar from '../../../components/Avatar.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Spinner from '../../../components/Spinner.svelte';
	import { cx } from '../../../cx';
	import { ROLES } from '../../model';
	import { store } from '../../store.svelte';
	import { DEMO_PEOPLE } from './people';

	// everyone in the story, grouped by where they stand, with what each of them does (screens/auth.jsx PeopleList)
	type Props = { onpick: (id: string) => void; busy?: string | null; current?: string | null };
	let { onpick, busy, current }: Props = $props();
	const userById = (id: string) => store.state.users.find((u) => u.id === id);
</script>

<div class="stack" style="gap: 18px">
	{#each DEMO_PEOPLE as g (g.group)}
		<div class="stack tight" style="gap: 8px">
			<div class="row tight"><b class="t-subhead">{g.group}</b><span class="t-caption subtle">{g.note}</span></div>
			<div class="si-people">
				{#each g.ids as [id, what] (id)}
					{@const u = userById(id)}
					{#if u}<button type="button" class={cx('si-person', current === id && 'on')} onclick={() => onpick(id)}
							><Avatar person={u} size="lg" /><span class="stack tight" style="gap: 1px"
								><b>{u.name}</b><span class="t-caption subtle">{ROLES[u.role]} · {u.org}</span><span class="t-footnote"
									>{what}</span
								></span
							>{#if busy === id}<Spinner size={18} />{:else if current === id}<Badge size="sm" tone="green">you</Badge
								>{/if}</button
						>{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>
