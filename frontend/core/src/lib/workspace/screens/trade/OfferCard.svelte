<script lang="ts">
	import { cx } from '../../../cx';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Mark from '../../../components/Mark.svelte';
	import Product from '../../../components/Product.svelte';
	import { useWorkspace } from '../../source';

	// the scheme as the kirana gets it from Rakesh Traders: Hindi first, English a tap away
	type Props = { onopen?: () => void; compact?: boolean; shop?: string };
	let { onopen, compact, shop }: Props = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	let en = $state(false);
	const p0 = $derived(c.push.offer);
	// the push names the first shop it went to; each shop reads its own name
	const p = $derived({ ...p0, body: p0.body.replace(c.kiranas[0].name, shop || c.kiranas[0].name) });
	const hours = $derived(ws.state.rules.offerWindowHours);
</script>

<div class="bezel">
	<div class="card raised" style="padding: {compact ? 16 : 22}px; display: grid; gap: 14px">
		<div class="row between">
			<span class="row tight"
				><Mark size={28} /><span class="t-footnote subtle strong">{c.dist.name} · {p.at}</span></span
			><button type="button" class="btn btn-ghost btn-sm" onclick={() => (en = !en)} aria-pressed={en}
				>{#if en}<span lang="hi">हिन्दी में पढ़ें</span>{:else}Read in English{/if}</button
			>
		</div>
		<div class="row" style="gap: 14px; align-items: center">
			<Product name={c.sku.img} size={compact ? 76 : 96} float />
			<div class="stack tight" style="gap: 4px">
				<div class={cx('t-title2', !en && 'hi')} lang={en ? 'en' : 'hi'}>{en ? "Today's special offer" : p.title}</div>
				<div class="row base" style="gap: 8px">
					<span class="num m">₹{c.lines.kirana.packPrice!.toFixed(2)}</span><span class="subtle t-subhead"
						>a packet · MRP ₹{c.sku.mrp}</span
					>
				</div>
				<span class="row tight wrap"
					><Badge tone="green" icon="gift"
						>{#if en}Buy {c.scheme.buy}, get {c.scheme.free} free{:else}<span lang="hi"
								>{c.scheme.buy} लो, {c.scheme.free} मुफ़्त</span
							>{/if}</Badge
					><Badge icon="clock"
						>{#if en}{hours} hours{:else}<span lang="hi">सिर्फ़ {hours} घंटे</span>{/if}</Badge
					></span
				>
			</div>
		</div>
		<p class={cx('t-body', !en && 'hi')} lang={en ? 'en' : 'hi'} style="margin: 0; line-height: 1.55">
			{en ? p.en : p.body}
		</p>
		{#if onopen}<Button variant="primary" size="lg" block iconRight="arrow-right" onclick={onopen}
				>{#if en}See the offer{:else}<span lang="hi">ऑफर देखें</span>{/if}</Button
			>{/if}
	</div>
</div>
