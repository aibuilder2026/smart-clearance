<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import IconButton from '../../../components/IconButton.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Product from '../../../components/Product.svelte';
	import Stepper from '../../../components/Stepper.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { cartons, fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Chat from '../brand/Chat.svelte';
	import LabelPhoto from '../brand/LabelPhoto.svelte';
	import EsDate from './EsDate.svelte';

	// the lot as the buyer sees it: the pack and its verified label, the terms; a bid, the seller's counter and the award;
	// the chat the Negotiator answers. Read-only, it is what the operator sees of the listing
	type Props = { me?: User; readOnly?: boolean };
	// the buyer is the only one who bids, so the person is not read here; the screens pass it all the same
	let { me: _me, readOnly }: Props = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const app = useApp();
	const h = $derived(ws.state.hero);
	let price = $state(13);
	let msg = $state('');
	const last = $derived(h.bids[h.bids.length - 1]);
	const open = $derived(!last || last.status === 'declined');
	const token = $derived(Math.round(price * c.lines.expiresoon.units * ws.data.rules.tokenPct * 100) / 100);
	const place = () => ws.act('bid', price);
	const accept = () => ws.act('accept');
	const terms = $derived<[string, string][]>([
		['Seller', 'Rakesh Traders, Nagpur · verified'],
		['Visible to', "buyers outside Munchly's distributor territories"],
		['Dispatch', '24 h after the balance · buyer pays freight'],
		['Lot', `${cartons(c.lines.expiresoon.units, c.sku.perCarton)} · 24 × 150 g a carton`],
		['Minimum order', '100 units'],
		['Listing', h.listing?.id ?? '']
	]);
	const bill: [string, string][] = $derived([
		[`${c.lines.expiresoon.units} × ₹${c.counter.price.toFixed(2)}`, fmt.inr2(c.invoice.taxable!)],
		[`IGST ${c.invoice.gstPct}%, Maharashtra to Chhattisgarh`, fmt.inr2(c.invoice.igst!)],
		['Round off', fmt.inr2(c.invoice.roundOff!)],
		['Invoice total', fmt.inr2(c.invoice.total!)]
	]);
</script>

{#if !h.listing}<Card
		><Empty
			icon="hourglass"
			title="Not listed yet"
			body="The Lister posts this lot the moment the plan is approved."
		/></Card
	>{:else}<div
		style="display: grid; gap: 16px; grid-template-columns: {app.bp === 'desktop' && !readOnly
			? 'minmax(0, 1.2fr) minmax(0, 1fr)'
			: 'minmax(0,1fr)'}; align-items: start"
	>
		<div class="stack" style="gap: 16px">
			<div class="es-gallery">
				<div class="es-thumb big"><Product name="pack-chips" size={app.bp === 'phone' ? 150 : 190} float /></div>
				<div class="es-thumb big" style="padding: 0; overflow: hidden; container-type: inline-size">
					<LabelPhoto status="verified" />
				</div>
			</div>
			<div class="stack tight">
				<div class="t-title2">Munchly Masala Chips 150 g · {c.lines.expiresoon.units} units</div>
				<span class="row base wrap" style="gap: 8px"
					><span class="es-price lg">₹15</span><span class="muted">a packet · MRP ₹30 · 50% off</span></span
				><span class="row tight wrap"
					><EsDate days={47} date="Best before 18 Nov 2026" /><Badge size="sm" tone="violet" icon="badge-check"
						>label photo verified</Badge
					></span
				>
			</div>
			<List
				>{#each terms as [k, v] (k)}<ListRow title={k} value={v} />{/each}</List
			>
		</div>
		<div class="stack" style="gap: 16px">
			{#if !readOnly}{#if h.award}<Card class="stack snug"
						><div class="row" style="gap: 12px">
							<span class="icontile violet" style="width: 44px; height: 44px; border-radius: 14px"
								><Icon name="badge-check" size={22} /></span
							>
							<div class="grow">
								<b>Lot won at ₹{c.counter.price.toFixed(2)}</b>
								<div class="t-footnote muted">
									Token {fmt.inr(c.award.token)} paid · {fmt.inr(c.award.balance)} of the bid and {fmt.inr(
										c.invoice.igst!
									)} IGST due in 48 h
								</div>
							</div>
						</div>
						<List
							>{#each bill as [k, v] (k)}<ListRow title={k}
									>{#snippet value()}<span class="tnum strong">{v}</span>{/snippet}</ListRow
								>{/each}</List
						><span class="t-caption subtle">Rakesh Traders issues the invoice from its own Tally.</span></Card
					>{:else if open}<Card class="stack snug">
						<div class="card-head">
							<span class="card-title">Place a bid</span><span class="t-caption subtle">ask ₹15.00</span>
						</div>
						<div class="row between">
							<span class="stack tight" style="gap: 0"
								><b>Your price a packet</b><span class="t-footnote subtle"
									>for all {c.lines.expiresoon.units} units</span
								></span
							><Stepper
								bind:value={price}
								min={10}
								max={14}
								step={0.5}
								label="Bid price"
								format={(v) => '₹' + v.toFixed(2)}
							/>
						</div>
						<div class="row between t-subhead">
							<span>15% token on your bid</span><span class="tnum strong">{fmt.inr2(token)}</span>
						</div>
						<Button variant="violet" size="lg" block icon="gavel" onclick={place}
							>Bid ₹{price.toFixed(2)} for {c.lines.expiresoon.units}</Button
						>
						<span class="t-caption subtle">Balance in 48 h. The seller's agent replies in about a minute.</span>
					</Card>{:else if last}<Card class="stack snug"
						><div class="card-head">
							<span class="card-title">Your bid</span><Badge
								tone={last.status === 'countered' ? 'violet' : undefined}
								dot
								live={last.status === 'placed'}
								>{last.status === 'placed' ? 'waiting for the seller' : last.status}</Badge
							>
						</div>
						<div class="row base" style="gap: 8px">
							<span class="es-price lg">₹{last.price.toFixed(2)}</span><span class="muted"
								>→ counter ₹{(last.counter || c.counter.price).toFixed(2)}</span
							>
						</div>
						{#if last.status === 'countered'}<Button variant="violet" size="lg" block icon="check" onclick={accept}
								>Accept ₹{c.counter.price.toFixed(2)} · pay {fmt.inr(c.award.token)} token</Button
							>{/if}
					</Card>{/if}{/if}
			<Card class="stack snug"
				><div class="card-head">
					<span class="card-title">Chat with the seller</span><span class="t-caption subtle">answered by an agent</span>
				</div>
				{#if h.chat.length}<Chat chat={h.chat} typing={last?.status === 'placed'} />{:else}<span
						class="t-footnote muted">Ask about dates, dispatch or a lower price.</span
					>{/if}
				{#if !readOnly && !h.award}<form
						class="row"
						style="gap: 8px"
						onsubmit={(e) => {
							e.preventDefault();
							msg = '';
						}}
					>
						<input
							class="input grow"
							placeholder="Message Rakesh Traders"
							bind:value={msg}
							aria-label="Message the seller"
						/><IconButton icon="send" label="Send" type="submit" />
					</form>{/if}
			</Card>
		</div>
	</div>{/if}
