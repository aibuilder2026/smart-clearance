<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Aura from '../../../components/Aura.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Money from '../../../components/Money.svelte';
	import Stepper from '../../../components/Stepper.svelte';
	import Switch from '../../../components/Switch.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { useNotice } from '../../../notice.svelte';
	import { useRoute } from '../../context';
	import { addDays, castOf, fmt, permissionOf } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import PlayAs from '../common/PlayAs.svelte';
	import Screen from '../common/Screen.svelte';

	// S0 Setup: connect the stock data once, and set the rules the agents must obey (screens/brand.jsx Setup)
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const router = useRoute();
	const app = useApp();
	const notices = useNotice();
	const s = $derived(ws.state);

	const CH_NAMES = $derived(ws.data.setup.channelNames);
	// each category's floor, shown on its first product's MRP
	const FLOOR_ROWS = $derived(
		Object.keys(ws.state.rules.floors).map((k): [string, string, string] => [
			k,
			k.charAt(0).toUpperCase() + k.slice(1).replace('-', ' '),
			Object.values(ws.data.skus).find((x) => x.category === k)!.id
		])
	);
	const cast = $derived(castOf(s, c));
	const dms = $derived(ws.data.setup.dms);
	const W = $derived(ws.data.workspace);

	// the guardrails as the store holds them; changes stay on this screen, as in the prototype
	let floors = $state({ ...ws.state.rules.floors });
	let taps = $state(ws.state.rules.approvalTaps);
	let busy = $state(false);
	let ret = $state(ws.state.rules.returnWindowDays);
	let uplift = $state(ws.state.rules.kiranaUplift);
	let van = $state(ws.state.rules.vanPerUnit);
	const done = $derived(s.setup.confirmed);

	const confirm = () => {
		busy = true;
		void ws.act('connect', undefined, { feel: 900 }).then(() => {
			busy = false;
			notices.toast({ text: `Setup confirmed · the Watcher starts at ${ws.state.rules.watchTime}`, tone: 'ok' });
		});
	};
	const chans = $derived(ws.data.setup.channels);
	const wo = $derived(c.plan.writeOff);
	const chips = $derived(c.sku);
	const COSTS: [string, number][] = $derived([
		['Stock at cost', chips.cost],
		['GST credit reversed', wo.itcPerUnit],
		['Disposal', ws.data.rules.disposalPerUnit],
		['EPR, indicative', chips.kgPerUnit * ws.data.rules.eprPerKg]
	]);
	// the prototype's switches show the rule and never change it
	const noop = () => {};
</script>

{#snippet guard()}<Switch bind:checked={() => s.rules.territoryGuard, noop} label="Territory guard" />{/snippet}
{#snippet tapsValue()}<Stepper bind:value={taps} min={1} max={50} label="routes" />{/snippet}
{#snippet careValue()}<Switch bind:checked={() => true, noop} label="Personal care never to food banks" />{/snippet}
{#snippet giftValue()}<Switch bind:checked={() => true, noop} label="Gift packs never to staff sale" />{/snippet}
{#snippet retValue()}<Stepper
		bind:value={ret}
		min={15}
		max={30}
		label="days before best-before"
		format={(v) => v + ' days before'}
	/>{/snippet}
{#snippet upliftValue()}<Stepper
		value={uplift}
		onchange={(v) => (uplift = Math.round(v * 10) / 10)}
		min={2}
		max={5}
		step={0.5}
		label="Scheme uplift"
		format={(v) => v.toFixed(1) + '×'}
	/>{/snippet}
{#snippet vanValue()}<Stepper
		value={van}
		onchange={(v) => (van = Math.round(v * 100) / 100)}
		min={0.25}
		max={2}
		step={0.25}
		label="Van rate"
		format={(v) => '₹' + v.toFixed(2)}
	/>{/snippet}

<Screen {me} title="Setup" sub="Connect the stock data once and set the rules the agents must obey">
	<div class="stack" style="gap: 20px">
		<Card class="stack snug">
			<div class="card-head">
				<span class="row tight"
					><span class="icontile"><Icon name="file-spreadsheet" size={17} stroke={2} /></span><span
						class="stack tight"
						style="gap: 0"
						><b>{dms.file}</b><span class="t-footnote subtle"
							>Bizom-style DMS export · {dms.rows} batches · {ws.data.client.distributors} distributors</span
						></span
					></span
				>{#if done}<Badge tone="green" icon="check">Loaded into BigQuery</Badge>{:else}<Badge dot
						>Mapped · confirm below</Badge
					>{/if}
			</div>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex (the region scrolls, so the keyboard must reach it) -->
			<div class="table-wrap" style="box-shadow: none" tabindex="0" role="region" aria-label="Field mapping">
				<table class="table">
					<thead><tr><th>Smart-Clearance field</th><th>Column in your file</th><th>Status</th></tr></thead>
					<tbody>
						{#each ws.data.setup.dms.columns as [f, c] (f)}<tr
								><td class="strong">{f.replace('_', ' ')}</td><td class="mono">{c}</td><td
									><Badge size="sm" tone="green" icon="check">mapped</Badge></td
								></tr
							>{/each}
					</tbody>
				</table>
			</div>
			<div class="row tight t-footnote muted">
				<Aura on={!done} class="icontile soft" style="width: 26px; height: 26px; border-radius: 8px"
					><Icon name="database" size={14} /></Aura
				>Data Agent mapped {dms.columns.length} of {dms.columns.length} columns and back-filled {dms.salesDays} days of sell-through
				by pincode and by shop.
			</div>
		</Card>
		<div
			style="display: grid; gap: 20px; grid-template-columns: {app.bp === 'desktop'
				? 'repeat(2, minmax(0,1fr))'
				: 'minmax(0,1fr)'}; align-items: start"
		>
			<div class="stack" style="gap: 20px">
				<List head="Floor price by category" foot="No channel may sell below its category's floor.">
					{#each FLOOR_ROWS as [k, l, sku] (k)}
						{#snippet value()}<Stepper
								bind:value={floors[k]}
								min={20}
								max={70}
								step={5}
								label={'Floor for ' + l}
								format={(v) => v + '%'}
							/>{/snippet}
						<ListRow
							title={l}
							sub={`${fmt.inr2((ws.data.skus[sku].mrp * floors[k]) / 100)} on a ₹${ws.data.skus[sku].mrp} pack`}
							{value}
						/>
					{/each}
				</List>
				<List
					head="Territory guard"
					foot={`ExpireSoon listings are hidden from buyers inside these territories, matched by pincode, so clearance stock never undercuts a ${W.short} distributor.`}
				>
					{#each Object.values(ws.data.distributors) as d (d.id)}<ListRow
							icon="map-pin"
							iconTone="gray"
							title={d.territory}
							sub={`${d.name} · pincodes ${d.pins}…`}
						/>{/each}
					<ListRow title="Hide listings inside the territories" value={guard} />
				</List>
				<List head="Approval policy" foot="After that the agents run inside the guardrails and report.">
					<ListRow icon="shield-check" iconTone="blue" title="Routes per channel that need a tap" value={tapsValue} />
					<ListRow icon="ban" iconTone="red" title="Personal care never goes to food banks" value={careValue} />
					<ListRow icon="gift" iconTone="amber" title="Premium gift packs never go to a staff sale" value={giftValue} />
				</List>
			</div>
			<div class="stack" style="gap: 20px">
				<Card class="stack snug">
					<span class="card-title">Channel allow-list</span>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex (the region scrolls, so the keyboard must reach it) -->
					<div
						class="table-wrap"
						style="box-shadow: none"
						tabindex="0"
						role="region"
						aria-label="Channel rules by category"
					>
						<table class="table">
							<thead
								><tr
									><th>Category</th>{#each chans as c (c)}<th style="text-align: center">{CH_NAMES[c]}</th>{/each}</tr
								></thead
							>
							<tbody>
								{#each ws.data.setup.allowList as [cat, ok] (cat)}<tr
										><td class="strong" style="text-transform: capitalize">{cat.replace('-', ' ')}</td
										>{#each chans as c (c)}<td style="text-align: center"
												>{#if ok.includes(c)}<Icon
														name="circle-check"
														size={18}
														title="Allowed"
														style="color: var(--primary-text); margin: 0 auto"
													/>{:else}<Icon
														name="circle-x"
														size={18}
														title="Never"
														style="color: var(--fg-3); margin: 0 auto"
													/>{/if}</td
											>{/each}</tr
									>{/each}
							</tbody>
						</table>
					</div>
					<span class="t-footnote subtle"
						>Discount D2C applies only to {W.short}'s own warehouse stock. A distributor's stock is his, so it never
						goes to {W.short}'s own site.</span
					>
				</Card>
				<List
					head="Distributors' one-time permission"
					foot={`Each distributor lets the agent list his ${W.short} stock, offer schemes to his kiranas, draft his invoices and book dispatch slots, inside ${W.short}'s floors. He can pause it at any time.`}
				>
					{#each Object.values(ws.data.distributors) as d (d.id)}
						{@const p = permissionOf(s, d.id, ws.data, c)}
						{#snippet badge()}<Badge size="sm" tone={p.tone} dot={!p.tone}>{p.label}</Badge>{/snippet}
						<ListRow
							icon="handshake"
							iconTone={p.tone === 'green' ? undefined : 'gray'}
							title={d.name}
							sub={d.city}
							value={badge}
						/>
					{/each}
				</List>
				{#if !s.setup.permission}<PlayAs who={cast.distributor.id} route="home"
						>Give the permission as {cast.distributor.short}</PlayAs
					>{/if}
				<List
					head="Scheme returns and planning"
					foot="The uplift and the van rate are planning assumptions. The return window lets returned packs reach the godown in time for a staff sale or a food bank."
				>
					<ListRow
						title="Kiranas may return scheme packs until"
						sub={`${fmt.day(addDays(c.batch.bestBefore, -ret))} for this batch`}
						value={retValue}
					/>
					<ListRow title="Scheme uplift on normal sales" value={upliftValue} />
					<ListRow title="Van rate, a unit" value={vanValue} />
				</List>
				<div class="stack snug">
					{#each ws.data.setup.partners as p (p.name)}<Card class="stack tight"
							><div class="card-head">
								<span class="row tight"
									><span class="icontile red"><Icon name="heart-handshake" size={17} stroke={2} /></span><b>{p.name}</b
									></span
								><Badge tone="green" icon="check">partner</Badge>
							</div>
							<span class="t-footnote muted">{p.minDays}+ days left · at least {p.minUnits} units · {p.logistics}</span
							><span class="t-caption subtle">{p.paper}</span></Card
						>{/each}
				</div>
			</div>
		</div>
		<Card class="stack snug" style="background: var(--surface)">
			<div class="card-head">
				<span class="card-title">The true cost of a write-off</span><Badge tone="red" icon="trash-2"
					>shown before any batch is routed</Badge
				>
			</div>
			<div class="row wrap" style="gap: 10px; align-items: stretch">
				{#each COSTS as [k, v], i (k)}{#if i > 0}<span class="center subtle" style="font-size: 20px" aria-hidden="true"
							>+</span
						>{/if}
					<div class="tile" style="min-width: 130px; flex: 1 1 130px">
						<span class="tl-label">{k}</span><span class="num s neg">{fmt.inr2(v)}</span>
					</div>{/each}
				<span class="center subtle" style="font-size: 20px" aria-hidden="true">=</span>
				<div
					class="tile"
					style="min-width: 150px; flex: 1 1 150px; box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--red) 45%, transparent)"
				>
					<span class="tl-label">Destroying, a unit</span><Money
						value={-wo.perUnit}
						size="s"
						decimals
						style="color: var(--red-text)"
					/>
				</div>
			</div>
			<span class="t-footnote subtle"
				>For {chips.name}: cost ₹{chips.cost}; {fmt.inr2(wo.itcPerUnit)} of input GST a packet from the cost sheet (chips
				are at {Math.round(chips.gst * 100)}% GST since GST 2.0); disposal {fmt.inr2(ws.data.rules.disposalPerUnit)} a unit;
				EPR ₹{ws.data.rules.eprPerKg} a kilo of product and pack. Factors marked indicative are editable here.</span
			>
		</Card>
		<div class="row wrap" style="gap: 10px">
			{#if done}<Badge tone="green" icon="check">Watching since setup</Badge><Button
					variant="primary"
					iconRight="arrow-right"
					onclick={() => router.go('command')}>Open Command Center</Button
				>{:else}<Button variant="primary" size="lg" icon="check" loading={busy} onclick={confirm}
					>Confirm and start watching</Button
				>{/if}
		</div>
	</div>
</Screen>
