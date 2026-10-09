<script lang="ts">
	import { useNotice } from '../../../notice.svelte';
	import Button from '../../../components/Button.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { cx } from '../../../cx';
	import { useRoute } from '../../context';
	import type { DistJourney, DistTodo } from '../../dist';
	import { useWorkspace } from '../../source';

	// a step of his on a batch: what, and the one button (SC-133, screens/trade.jsx Step). A step that needs its screen
	// opens it on the batch; the invoice is one tap, on whichever batch it is
	let { t, j, primary }: { t: DistTodo; j: Pick<DistJourney, 'ref'>; primary?: boolean } = $props();
	const ws = useWorkspace();
	const { go } = useRoute();
	const { toast } = useNotice();
	let busy = $state(false);
	const run = async () => {
		if (t.route) return go(t.route, { ref: j.ref });
		if (!t.act) return;
		busy = true;
		try {
			await ws.act(t.act, undefined, { feel: 400, ref: j.ref });
			toast({ text: 'Marked issued from Tally', tone: 'ok' });
		} finally {
			busy = false;
		}
	};
</script>

<div class={cx('dist-step', primary && 'primary')}>
	<span class="icontile" style="width: {primary ? 44 : 36}px; height: {primary ? 44 : 36}px; border-radius: 12px"
		><Icon name={t.icon} size={primary ? 20 : 17} stroke={2} /></span
	>
	<span class="grow stack tight" style="gap: 2px; min-width: 0"
		><b class={primary ? 't-headline' : 't-subhead'}>{t.title}</b><span class="t-footnote muted">{t.sub}</span></span
	>
	<Button
		variant={primary ? 'primary' : 'secondary'}
		size={primary ? undefined : 'sm'}
		icon={t.icon}
		loading={busy}
		onclick={run}>{t.cta}</Button
	>
</div>
