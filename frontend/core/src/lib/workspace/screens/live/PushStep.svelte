<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Button from '../../../components/Button.svelte';
	import Mark from '../../../components/Mark.svelte';
	import { cx } from '../../../cx';
	import Icon from '../../../icons/Icon.svelte';
	import { useNotice } from '../../../notice.svelte';
	import { useLive, type PushControl } from '../../live.svelte';
	import { HOME, NAV } from '../../model';
	import { useWorkspace } from '../../source';
	import type { Push, User } from '../../types';
	import Screen from '../common/Screen.svelte';

	// the first sign-in on a device ends on one step, before the home (screens/live.jsx PushStep, SC-68 option B): it asks
	// for notifications with a preview of the push itself; on an iPhone that has not added the app it asks to install it
	// first (Safari pushes only to web apps on the Home Screen); blocked, it says how to undo that. Never over a task
	type Props = { me: User; push: PushControl; ondone: () => void };
	let { me, push, ondone }: Props = $props();
	const ws = useWorkspace();
	const app = useApp();
	const live = useLive();
	const { toast } = useNotice();
	const W = $derived(ws.data.workspace);
	const watch = $derived(ws.state.rules.watchTime);
	const variant = $derived(push.state === 'install-first' ? 'install' : push.state === 'denied' ? 'denied' : 'ask');
	const home = $derived(NAV[me.role].find((n) => n.id === HOME[me.role])?.label ?? NAV[me.role][0].label);

	// what the push brings, by role
	const ask = $derived.by((): [string, string] => {
		if (me.role === 'operator')
			return [
				'Get the morning push',
				`When the Watcher flags a batch at ${watch} journey time, the plan reaches your lock screen with the money on it, and one tap opens it here.`
			];
		if (me.role === 'distributor')
			return [
				'Get photo requests and orders as a push',
				'When Vision needs a label photo or your kiranas order on a scheme, it reaches your lock screen, in your language.'
			];
		if (me.role === 'retailer')
			return [
				ws.case ? `Get ${ws.case.dist.name}' offers as a push` : 'Get your offers as a push',
				'Schemes arrive in your language, ready to order in one tap.'
			];
		return [
			'Get a push when something needs you',
			'When the journey needs you, it reaches your lock screen, and one tap opens it here.'
		];
	});
	const words = $derived(
		variant === 'install'
			? [
					'Add the app to your Home Screen',
					'On iPhone, Safari sends notifications only to web apps opened from the Home Screen. Three taps, then open Clearance from there.'
				]
			: variant === 'denied'
				? [
						'Notifications are blocked',
						`Your browser blocks notifications from ${W.domain}. Everything still reaches your inbox while they are off.`
					]
				: ask
	);
	const steps = $derived(
		variant === 'install'
			? [
					['Tap', 'Share', "in Safari's toolbar"],
					['Choose', 'Add to Home Screen', ''],
					['Open', 'Clearance', 'from your Home Screen']
				]
			: variant === 'denied'
				? app.bp === 'phone'
					? [
							['In Chrome, open the menu (the three dots), then', 'Settings', ''],
							['Open', 'Site settings', 'and then Notifications'],
							['Find', W.domain, 'and choose Allow']
						]
					: [
							['Click', 'the site settings icon', 'at the left of the address bar'],
							['Set', 'Notifications', 'to Allow'],
							['Reload', 'the page', '']
						]
				: null
	);

	// the push this person gets, as their lock screen shows it: the one the journey sends their role first, else any of
	// theirs that has gone out
	const LEAD: Partial<Record<User['role'], string>> = {
		operator: 'plan',
		distributor: 'verify',
		retailer: 'offer'
	};
	const shown = $derived.by((): Push | null => {
		const pushes = ws.case?.push;
		if (!pushes) return null;
		const lead = LEAD[me.role] ? pushes[LEAD[me.role]!] : null;
		if (lead?.title) return lead;
		return Object.values(pushes).find((p) => p.to === me.id && p.title) ?? null;
	});
	const lockTime = $derived(shown && /^\d\d:\d\d$/.test(shown.at) ? shown.at : (live?.time ?? ''));

	const allow = async () => {
		await push.enable();
		if (push.state === 'granted') {
			toast({ text: `Notifications are on. The ${watch} push reaches this device.`, tone: 'ok', icon: 'bell' });
			ondone();
		}
	};
</script>

<Screen {me} title={words[0]} hideLarge>
	<div class="lv-step">
		<div class="lv-step-art">
			{#if variant === 'install'}<div class="lv-ia" aria-hidden="true">
					<div class="lv-ia-bar">
						<Icon name="chevron-left" size={18} /><Icon name="chevron-right" size={18} /><span class="lv-ia-share"
							><Icon name="share-ios" size={18} /></span
						><Icon name="book-open" size={18} /><Icon name="copy" size={18} />
					</div>
					<div class="lv-ia-sheet">
						<span class="lv-ia-row"><span>Copy</span><Icon name="copy" size={18} /></span><span class="lv-ia-row on"
							><span>Add to Home Screen</span><Icon name="square-plus" size={18} /></span
						><span class="lv-ia-row"><span>Add Bookmark</span><Icon name="book-open" size={18} /></span>
					</div>
				</div>{:else}<div class={cx('lv-pp', variant === 'denied' && 'blocked')} aria-hidden="true">
					<span class="lv-pp-time tnum">{lockTime}</span><span class="lv-pp-date">{live?.long}</span>
					<div class="lv-pp-note">
						<span class="lv-pp-head"
							><Mark size={20} /><span>{ws.data.platform.name}</span><span class="lv-pp-now">now</span></span
						><b>{shown?.title || W.name}</b><span lang={shown?.hindi ? 'hi' : undefined}
							>{shown?.body || 'When something needs you, it arrives here.'}</span
						>
					</div>
					{#if variant === 'denied'}<span class="lv-pp-block"
							><Icon name="bell-off" size={16} />Blocked in this browser</span
						>{/if}
				</div>{/if}
		</div>
		<div class="lv-step-copy">
			<h1 class="lv-step-t">{words[0]}</h1>
			<p class="lv-step-p">{words[1]}</p>
			{#if steps}<ol class="lv-steps">
					{#each steps as [a, b, c], i (i)}<li>
							<span class="lv-stepn">{i + 1}</span><span>{a} <b>{b}</b> {c}</span>
						</li>{/each}
				</ol>{/if}
			<div class="lv-step-acts">
				{#if variant === 'ask'}<Button variant="primary" size="lg" icon="bell" loading={push.busy} onclick={allow}
						>Turn on notifications</Button
					>{/if}
				{#if variant === 'denied'}<Button
						variant="secondary"
						size="lg"
						icon="refresh-cw"
						onclick={() => void push.check()}>Check again</Button
					>{/if}
				<Button variant={variant === 'ask' ? 'ghost' : 'primary'} size="lg" iconRight="arrow-right" onclick={ondone}
					>{variant === 'ask' ? 'Not now' : `Continue to ${home}`}</Button
				>
			</div>
			<p class="t-footnote subtle" style="margin: 0">You can change this in Profile at any time.</p>
		</div>
	</div>
</Screen>
