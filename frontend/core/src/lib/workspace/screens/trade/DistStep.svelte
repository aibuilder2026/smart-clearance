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
	// the step's button while it waits, and once it lands (SC-152, screens/trade.jsx WORDS)
	const WORDS: Record<string, [string, string]> = { issueInvoice: ['Issuing…', 'Issued'] };
	const words = $derived(t.act ? WORDS[t.act] : undefined);
	// a step that opens its screen goes there; one that acts waits on the answer, and says so only once it has gone
	// through
	const open = () => t.route && go(t.route, { ref: j.ref });
	const run = async () => {
		if (!t.act) return;
		await ws.act(t.act, undefined, { feel: 400, ref: j.ref, inline: true });
		toast({ text: 'Marked issued from Tally', tone: 'ok' });
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
		action={t.route ? undefined : run}
		busy={words?.[0]}
		done={words?.[1]}
		onclick={t.route ? open : undefined}>{t.cta}</Button
	>
</div>
