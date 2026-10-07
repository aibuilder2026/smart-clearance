<script lang="ts">
	import Mark from '../../../components/Mark.svelte';
	import { cx } from '../../../cx';
	import Icon from '../../../icons/Icon.svelte';
	import type { IconName } from '../../../icons/registry';
	import { rise } from '../../../motion/transitions';
	import { useWorkspace } from '../../source';

	// a phone's lock screen with one push: the trigger for every human moment in the journey (screens/common.jsx
	// LockScreen). The guided demo shows it in a phone; tapping the push (or anywhere, when there is one) opens it
	export type LockPush = { app?: string; icon?: IconName; title: string; body: string };
	type Props = { who: string; push?: LockPush | null; time: string; date: string; onopen?: () => void };
	let { who, push, time, date, onopen }: Props = $props();

	const ws = useWorkspace();
	const p = $derived(ws.state.users.find((u) => u.id === who) || ws.data.people[who] || { name: who, short: who });
	const hindi = $derived(!!push && /[ऀ-ॿ]/.test(push.body));
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (the push itself is the button; the screen around it is a larger target for a pointer) -->
<div class="lock" onclick={push ? onopen : undefined}>
	<div class="lock-top">
		<Icon name="lock" size={16} stroke={2.4} />
		<div class="lock-date">{date}</div>
		<div class="lock-time">{time}</div>
	</div>
	{#if push}{#key push.title}<button
				type="button"
				class="lock-note"
				onclick={(e) => {
					e.stopPropagation();
					onopen?.();
				}}
				in:rise|global={{ y: -26, scale: 0.94, duration: 420 }}
			>
				<span class="ln-head"
					>{#if push.app}<span class="ln-app" aria-hidden="true"
							><Icon name={push.icon || 'message-circle'} size={14} stroke={2.2} /></span
						><span>{push.app}</span>{:else}<Mark size={22} /><span>Smart-Clearance</span>{/if}<span class="ln-now"
						>now</span
					></span
				>
				<b>{push.title}</b><span class={cx('ln-body', hindi && 'hi')} lang={hindi ? 'hi' : undefined}>{push.body}</span>
			</button>{/key}{/if}
	<div class="lock-foot">{push ? 'Tap the notification to open' : `${p.short || p.name}'s phone`}</div>
</div>
