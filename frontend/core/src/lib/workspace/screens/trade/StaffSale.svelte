<script lang="ts">
	import { useNotice } from '../../../notice.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Progress from '../../../components/Progress.svelte';
	import Stepper from '../../../components/Stepper.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { Distributor, StaffSale } from '../../types';

	// the staff sale at the godown (SC-87, option A; screens/trade.jsx StaffSale): the packs and the price, the
	// distributor's UPI address to show staff, and one count to record what sold, once, when the sale is over. The code
	// beside the address is an illustration drawn from it, not a payment code: nothing scans it
	let { staff, dist, product, clears }: { staff: StaffSale; dist: Distributor; product: string; clears?: string } =
		$props();
	const ws = useWorkspace();
	const { toast } = useNotice();
	// the count starts at every pack, then is the distributor's
	// svelte-ignore state_referenced_locally
	let n = $state(staff.units);
	const open = $derived(staff.status === 'open');
	const busy = $derived(ws.pending.has('recordStaffSale'));
	const record = async () => {
		await ws.act('recordStaffSale', n, { feel: 400 });
		if (ws.failed?.action === 'recordStaffSale') return;
		toast({ text: `Recorded · ${fmt.num(n)} of ${fmt.num(staff.units)} packs sold`, tone: 'ok' });
	};

	function payCells(upi: string, size = 21): [number, number][] {
		let seed = [...upi].reduce((t, ch) => (t * 31 + ch.charCodeAt(0)) >>> 0, 7);
		const r = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32;
		const corners = [
			[0, 0],
			[size - 7, 0],
			[0, size - 7]
		];
		const corner = (x: number, y: number) => corners.find(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7);
		const cells: [number, number][] = [];
		for (let y = 0; y < size; y++)
			for (let x = 0; x < size; x++) {
				const f = corner(x, y);
				if (f) {
					if (Math.max(Math.abs(x - f[0] - 3), Math.abs(y - f[1] - 3)) !== 2) cells.push([x, y]);
				} else if (r() < 0.47) cells.push([x, y]);
			}
		return cells;
	}
	const cells = $derived(dist.upi ? payCells(dist.upi) : []);
</script>

<Card class="stack snug">
	<div class="card-head">
		<span class="row tight"
			><span class="icontile"><Icon name="users" size={17} stroke={2} /></span><span class="card-title"
				>Staff sale · {product}</span
			></span
		>{#if open}<Badge tone="blue" dot>open</Badge>{:else}<Badge tone="green" icon="check">recorded</Badge>{/if}
	</div>
	{#if open}<span class="t-subhead"
			>{fmt.num(staff.units)} packs for your staff at <b>₹{staff.price}</b> a pack, at {staff.godown}. Staff pay you by
			UPI.</span
		>
		{#if dist.upi}<div class="row" style="gap: 14px">
				<svg class="paycode" width="92" height="92" viewBox="-1 -1 23 23" aria-hidden="true"
					>{#each cells as [x, y] (`${x}-${y}`)}<rect {x} {y} width="1" height="1" />{/each}</svg
				>
				<div class="stack tight" style="gap: 2px; min-width: 0">
					<b class="mono t-footnote" style="overflow-wrap: anywhere">{dist.upi}</b><span class="t-footnote muted"
						>Your own UPI: staff pay you at the godown{clears ? `, over ${clears}` : ''}.</span
					>
				</div>
			</div>{/if}
		<div class="row wrap" style="gap: 12px">
			<Stepper bind:value={n} min={0} max={staff.units} label="packs sold to staff" /><span class="t-subhead muted"
				>of {fmt.num(staff.units)} packs sold</span
			>
		</div>
		<Button variant="primary" size="lg" block icon="check" loading={busy} onclick={record}>Record the sale</Button>
		<span class="t-caption subtle">Record once, when the sale is over. What does not sell stays at the godown.</span
		>{:else}<span class="t-subhead"
			><b>{fmt.num(staff.sold ?? 0)} of {fmt.num(staff.units)}</b> sold to staff at ₹{staff.price} a pack</span
		>
		<Progress value={(staff.sold ?? 0) / staff.units} label="Staff packs sold" />
		<span class="t-footnote muted"
			>{staff.left
				? `${fmt.num(staff.left)} ${staff.left === 1 ? 'pack stays' : 'packs stay'} at ${staff.godown}.`
				: 'Every pack sold.'}</span
		>{/if}
</Card>
