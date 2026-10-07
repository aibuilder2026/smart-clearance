<script lang="ts">
	import Menu, { type MenuItem } from '../../../components/Menu.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { useNotice } from '../../../notice.svelte';
	import type { User, UserStatus } from '../../types';

	// a user's "…" button and its menu: change the role, resend an invite, deactivate or reactivate (never yourself)
	// (screens/admin.jsx RowMenu)
	type Props = {
		u: User;
		me: User;
		onrole: () => void;
		onstatus: (u: User, status: UserStatus) => void;
	};
	let { u, me, onrole, onstatus }: Props = $props();
	const { toast } = useNotice();
	let open = $state(false);

	const items = $derived.by(() => {
		const items: MenuItem[] = [{ label: 'Change role', icon: 'user-cog', onclick: onrole }];
		if (u.status === 'invited')
			items.push({ label: 'Resend invite', icon: 'send', onclick: () => toast({ text: 'Invite resent', tone: 'ok' }) });
		if (u.id !== me.id)
			items.push(
				u.status === 'deactivated'
					? { label: 'Reactivate', icon: 'user-check', onclick: () => onstatus(u, 'active') }
					: { label: 'Deactivate', icon: 'user-x', danger: true, onclick: () => onstatus(u, 'deactivated') }
			);
		return items;
	});
	const label = $derived('Actions for ' + u.name);
</script>

<Menu bind:open {items} width={200} {label}
	>{#snippet trigger(props)}<button {...props} type="button" class="iconbtn" aria-label={label} title={label}
			><Icon name="ellipsis" size={20} /></button
		>{/snippet}</Menu
>
