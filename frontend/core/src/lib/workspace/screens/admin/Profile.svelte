<script lang="ts">
	import Avatar from '../../../components/Avatar.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Segmented from '../../../components/Segmented.svelte';
	import Switch from '../../../components/Switch.svelte';
	import WorkspaceMark from '../../../components/WorkspaceMark.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import type { IconName } from '../../../icons/registry';
	import { useNotice } from '../../../notice.svelte';
	import { useTheme } from '../../../theme.svelte';
	import { useAccount, useRoute } from '../../context';
	import { kinds, PROVIDER_ICONS, providerOf } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';

	// every role's profile: who they are and how they sign in, their workspace, Rakesh's permission to act in his name,
	// the theme, the notifications and their language, this device and the account (screens/admin.jsx Profile)
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const theme = useTheme();
	const acc = useAccount();
	const { toast } = useNotice();
	const router = useRoute();

	const lkey = $derived('sc3-lang-' + me.id);
	const loadLang = () => {
		try {
			return localStorage.getItem(lkey) || (me.lang === 'hi' ? 'hi' : 'en');
		} catch {
			return 'en';
		}
	};
	let lang = $state(loadLang());
	const setL = (v: string) => {
		lang = v;
		try {
			localStorage.setItem(lkey, v);
		} catch {
			/* storage blocked: the choice lasts until the page closes */
		}
	};
	let push = $state(true);
	// svelte-ignore state_referenced_locally (the app keys the screens by person, so the default is read once)
	let digest = $state(me.role === 'finance' || me.role === 'sustainability');
	const perm = $derived(ws.state.setup.permission);
	const inside = $derived(me.role !== 'buyer');
	const signInIcon = $derived<IconName>(PROVIDER_ICONS[me.provider]);
</script>

{#snippet wsMark()}<WorkspaceMark ws={ws.data.workspace} size={32} />{/snippet}
{#snippet member()}<Badge size="sm" tone="green">{kinds(ws.data.workspace)[me.kind] || 'member'}</Badge>{/snippet}
{#snippet acting()}<Switch
		checked={!perm?.paused}
		onchange={(v) => {
			void ws.act('pause', !v);
			toast({ text: v ? 'Resumed' : 'Paused · nothing more happens in your name', tone: 'ok' });
		}}
		label="Let Smart-Clearance act for you"
	/>{/snippet}
{#snippet themeSwitch()}<Segmented
		options={[
			{ id: 'light', label: 'Light' },
			{ id: 'dark', label: 'Dark' },
			{ id: 'system', label: 'Auto' }
		]}
		value={theme.mode}
		onchange={theme.setMode}
		label="Theme"
		size="sm"
	/>{/snippet}
{#snippet language()}<Segmented
		options={[
			{ id: 'en', label: 'English' },
			{ id: 'hi', label: 'हिन्दी' }
		]}
		value={lang}
		onchange={setL}
		label="Notification language"
		size="sm"
	/>{/snippet}
{#snippet pushSwitch()}<Switch bind:checked={push} label="Push notifications" />{/snippet}
{#snippet digestSwitch()}<Switch bind:checked={digest} label="Weekly digest" />{/snippet}
{#snippet install()}{#if acc.install}<Button variant="secondary" size="sm" onclick={acc.install}>Install</Button
		>{/if}{/snippet}

<Screen {me} title="Profile" sub={ws.data.roles[me.role]}>
	<div class="stack" style="gap: 20px; max-width: 680px">
		<Card class="row" style="gap: 16px"
			><Avatar person={me} size="xl" ring />
			<div class="stack tight" style="gap: 2px; min-width: 0">
				<div class="t-title2">{me.name}</div>
				<span class="muted">{ws.data.roles[me.role]} · {me.org}</span><span class="t-footnote subtle row tight"
					><Icon name={signInIcon} size={14} />{providerOf(me)}{me.email
						? ' · ' + me.email
						: me.phone
							? ' · ' + me.phone
							: ''}</span
				>
			</div></Card
		>
		{#if inside}<List head="Workspace"
				><ListRow
					leading={wsMark}
					title={ws.data.workspace.name}
					sub={ws.data.workspace.domain}
					value={member}
				/>{#if me.role === 'admin'}<ListRow
						icon="building-2"
						title="Workspace settings"
						sub="Sign-in, supply-chain profile, branding"
						chevron
						onclick={() => router.go('workspace')}
					/>{/if}</List
			>{/if}
		{#if perm && perm.by === me.id}<List
				head="Acting for {me.org}"
				foot="Inside {ws.data.workspace
					.short}'s floors: listings, scheme offers, invoice drafts and dispatch slots in your name."
				><ListRow
					icon={perm.paused ? 'circle-pause' : 'handshake'}
					title={perm.paused ? 'Paused' : 'On since ' + perm.at}
					value={acting}
				/></List
			>{/if}
		{#if me.role === 'operator'}<List head="Your work"
				><ListRow
					icon="sliders-horizontal"
					title="Setup and guardrails"
					sub="DMS mapping, floors, territory guard, permissions"
					chevron
					onclick={() => router.go('setup')}
				/><ListRow
					icon="chart-line"
					title="Finance & ESG"
					sub="Ledger, BRSR export"
					chevron
					onclick={() => router.go('report')}
				/></List
			>{/if}
		<List head="Appearance"><ListRow title="Theme" value={themeSwitch} /></List>
		<List head="Notifications" foot="Offers to the trade go out in the language each person picks."
			><ListRow title="Language" value={language} /><ListRow title="Push notifications" value={pushSwitch} /><ListRow
				title="Weekly digest by email"
				value={digestSwitch}
			/></List
		>
		{#if acc.install !== undefined}<List head="This device"
				><ListRow
					icon="download"
					title="Install Smart-Clearance"
					sub={acc.install
						? 'Opens full screen, works offline, gets pushes'
						: acc.standalone
							? 'Installed on this device'
							: 'In Safari, tap Share, then Add to Home Screen'}
					value={acc.install ? install : undefined}
				/></List
			>{/if}
		{#if acc.switchTo || acc.signOut || acc.reset}<List head="Account">
				{#if acc.switchTo}<ListRow
						icon="users"
						title="Switch person"
						sub="Try the journey as someone else in the story"
						chevron
						onclick={() => acc.switchTo?.()}
					/>{/if}
				{#if acc.reset}<ListRow
						icon="rotate-ccw"
						title="Reset demo data"
						sub="Puts the batch back to the start"
						onclick={() => {
							acc.reset?.();
							toast({ text: 'Demo data reset' });
						}}
					/>{/if}
				{#if acc.signOut}<ListRow
						icon="log-out"
						iconTone="red"
						title="Sign out"
						sub={inside ? `Back to ${ws.data.workspace.domain}` : undefined}
						onclick={acc.signOut}
					/>{/if}
			</List>{/if}
	</div>
</Screen>
