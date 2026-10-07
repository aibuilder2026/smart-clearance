<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Card from '../../../components/Card.svelte';
	import Product from '../../../components/Product.svelte';
	import { useLive } from '../../live.svelte';

	// a day with nothing at risk (screens/live.jsx Quiet, SC-68 option B): a render, what was checked and when, and when
	// the next check is, in real time at the client's pace
	// watch: the Watcher's time, to say when the next check is (the Command Center's)
	let { img, title, body, watch }: { img: string; title: string; body: string; watch?: string } = $props();
	const app = useApp();
	const live = useLive();
	// the next check: the watch time later today, else tomorrow, and how long that is in real time at this pace
	const next = $derived.by(() => {
		if (!live?.on || !watch || !/^\d\d:\d\d$/.test(watch)) return null;
		const at = Number(watch.slice(0, 2)) * 60 + Number(watch.slice(3));
		const left = (at - live.minutes + 1440) % 1440 || 1440;
		const real = (left / 1440) * live.dayMinutes;
		const until =
			real < 1.5
				? 'about a minute'
				: real < 90
					? `about ${Math.round(real)} minutes`
					: `about ${Math.round(real / 60)} hours`;
		return `The next check is ${live.minutes < at ? 'today' : 'tomorrow'} at ${watch}, ${until} from now at this pace.`;
	});
</script>

<Card class="lv-quiet"
	><div class="lv-quiet-in">
		<Product name={img} size={app.bp === 'phone' ? 96 : 120} alt="" />
		<div class="stack tight" style="gap: 6px">
			<div class="t-title3">{title}</div>
			<p class="t-subhead muted" style="margin: 0">{next ? `${body} ${next}` : body}</p>
		</div>
	</div></Card
>
