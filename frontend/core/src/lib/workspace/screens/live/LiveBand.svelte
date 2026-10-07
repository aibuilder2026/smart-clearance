<script lang="ts">
	import Button from '../../../components/Button.svelte';
	import IconButton from '../../../components/IconButton.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import type { LiveView } from '../../live.svelte';
	import { useWorkspace } from '../../source';
	import ConnMark from './ConnMark.svelte';

	// a band across the page, under the bar, that stays while it lasts (screens/live.jsx Band): the stream is down
	// (reconnecting, or offline with Try again), or a step did not go through, in the backend's words, with Retry. A
	// failed approval is said in the approve sheet instead
	let { live }: { live: LiveView } = $props();
	const ws = useWorkspace();
	const failed = $derived(ws.failed && ws.failed.action !== 'approve' ? ws.failed : null);
	let retrying = $state(false);
	const retry = async () => {
		if (!failed) return;
		retrying = true;
		try {
			await failed.retry();
		} finally {
			retrying = false;
		}
	};
</script>

{#if failed}<div class="lv-band lv-band-err" role="alert">
		<Icon name="circle-alert" size={18} /><span class="lv-band-t"><b>That didn't go through.</b> {failed.message}</span
		><Button size="sm" variant="secondary" icon="refresh-cw" loading={retrying} onclick={retry}>Retry</Button
		>{#if ws.dismissFailure}<IconButton icon="x" label="Dismiss" onclick={() => ws.dismissFailure?.()} />{/if}
	</div>{:else if live.down}<div class="lv-band" role="status">
		<ConnMark conn={live.conn} /><span class="lv-band-t"
			>{#if live.offline}<b>You're offline.</b> Showing what was here at {live.since}. Approving and sending wait for a
				connection.{:else}<b>Reconnecting…</b> Updates paused at {live.since}, so what you see may be behind. Anything
				you do still goes through.{/if}</span
		>{#if live.offline && ws.reconnect}<Button
				size="sm"
				variant="secondary"
				icon="refresh-cw"
				onclick={() => ws.reconnect?.()}>Try again</Button
			>{/if}
	</div>{/if}
