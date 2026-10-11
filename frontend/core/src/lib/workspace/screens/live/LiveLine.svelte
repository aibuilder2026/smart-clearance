<script lang="ts">
	import { cx } from '../../../cx';
	import { connWord, type LiveView } from '../../live.svelte';
	import { useWorkspace } from '../../source';
	import ClockInfo from '../common/ClockInfo.svelte';
	import ClockNote from '../common/ClockNote.svelte';
	import ConnMark from './ConnMark.svelte';
	import Cue from './Cue.svelte';

	// under every large title: live or not, the journey's date and time, and the pace (screens/live.jsx Line). The time
	// steps a quarter hour at a time and is never announced: no live region (WCAG 2.2.2, the clock is essential). Under it,
	// the note that it is the prototype's clock, with how to reset or fast-forward the journey (SC-176); short, the same
	// line under the bar's title once the large title has collapsed, the note its icon
	let { live, short }: { live: LiveView; short?: boolean } = $props();
	const ws = useWorkspace();
	const client = $derived(ws.data.workspace.name);
	const clock = $derived({ date: live.date, long: live.long, time: live.time, dayMinutes: live.dayMinutes });
</script>

{#if short}<span class="lv-barsub"
		><ConnMark conn={live.conn} size={6} /><span class="tnum">{live.time}</span><Cue
			dayMinutes={live.dayMinutes}
			short
		/><ClockInfo {client} {clock} /></span
	>{:else}<span class="lv-clock"
		><span class={cx('lv-line', live.conn !== 'live' && 'off')}
			><ConnMark conn={live.conn} /><span class="lv-st">{connWord(live.conn)}</span><span
				class="lv-sep"
				aria-hidden="true"
			></span><span class="lv-time"><span class="lv-date">{live.date}</span><span class="tnum">{live.time}</span></span
			><Cue dayMinutes={live.dayMinutes} /></span
		><ClockNote {client} {clock} /></span
	>{/if}
