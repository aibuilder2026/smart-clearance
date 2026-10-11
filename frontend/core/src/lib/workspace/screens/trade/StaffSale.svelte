<script lang="ts">
	import { onDestroy } from 'svelte';
	import { imgUrl } from '../../../assets';
	import { useNotice } from '../../../notice.svelte';
	import Aura from '../../../components/Aura.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Progress from '../../../components/Progress.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import Stepper from '../../../components/Stepper.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { Distributor, Sku, StaffReceipt, StaffSale } from '../../types';
	import ReceiptRead from '../finance/ReceiptRead.svelte';
	import StaffReceiptPaper from '../finance/StaffReceiptPaper.svelte';
	import { possessive } from '../finance/ledger';

	// the staff sale at the godown (SC-87, option A; screens/trade.jsx StaffSale): the packs and the price, the
	// distributor's UPI address to show staff, and one count to record what sold, once, when the sale is over. The code
	// beside the address is an illustration drawn from it, not a payment code: nothing scans it.
	// With the count, the consolidated receipt (SC-174, option A): one receipt listing every staff payment by its UPI
	// reference, from his books or his UPI app's statement, a photo or a PDF. Vision reads it, and the sale records once
	// the payments match the count; short, it says so, and offers another receipt or the count the payments make. On the
	// stub the receipt read is the batch's own (the prototype stands in for Gemini vision); on the live workspace the
	// receipt goes to its signed link at once, and the journey's staff sale carries Vision's read
	let {
		staff,
		dist,
		product,
		clears,
		batch,
		sku
	}: { staff: StaffSale; dist: Distributor; product: string; clears?: string; batch: string; sku: Sku } = $props();
	const ws = useWorkspace();
	const { toast } = useNotice();
	const live = $derived(ws.kind === 'live');
	const short = $derived(ws.data.workspace.short);
	const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
	const RECEIPT_MAX_MB = 8;
	// the count starts at every pack, then is the distributor's
	// svelte-ignore state_referenced_locally
	let n = $state(staff.units);
	const open = $derived(staff.status === 'open');
	const price = $derived(staff.price);
	// the stub's: the receipt attached (its own photo where it is one), read a moment later
	let shot = $state<{ url?: string; how: 'camera' | 'upload' } | null>(null);
	let reading = $state(false);
	// the live workspace's: the receipt on its way, and one set aside by Send another until the next arrives
	let sending = $state(false);
	let aside = $state<string | null>(null);
	let err = $state<string | null>(null);
	let sheet = $state(false);
	let cam: HTMLInputElement | undefined = $state();
	let pick: HTMLInputElement | undefined = $state();
	let timer: ReturnType<typeof setTimeout> | undefined;
	onDestroy(() => clearTimeout(timer));

	const expected = $derived(live ? null : (ws.staffReceiptOf?.(batch) ?? null));
	const mine = $derived(live && staff.receipt && staff.receipt.id !== aside ? staff.receipt : null);
	const busyReading = $derived(live ? sending || mine?.status === 'reading' : reading);
	const read = $derived<StaffReceipt | null>(
		live
			? mine?.status === 'read' && mine.payments.length
				? mine
				: null
			: shot && !reading && expected
				? { ...expected, ...(shot.url ? { url: shot.url } : {}) }
				: null
	);
	const unread = $derived(live && mine?.status === 'unreadable');
	const matched = $derived(!!read && Math.abs(read.paid - n * price) < 0.5);
	const made = $derived(read ? Math.floor(read.paid / price + 1e-9) : 0);
	// the batch's own receipt, in the prototype; a live receipt shows its own photo
	const stub = $derived(live ? null : (imgUrl(`receipts/${batch}.webp`) ?? null));

	// a photo or a PDF, as the label photo takes one (SC-80); Vision reads it a moment later
	const use = (f: File | null, how: 'camera' | 'upload') => {
		if (f && !RECEIPT_TYPES.includes(f.type)) {
			err = 'That file is not a receipt Vision can read. Send a photo (JPEG, PNG or WebP) or a PDF.';
			return;
		}
		if (f && f.size >= RECEIPT_MAX_MB * 1048576) {
			err = `That file is ${(f.size / 1048576).toFixed(1)}\u00a0MB. Send one under ${RECEIPT_MAX_MB}\u00a0MB.`;
			return;
		}
		err = null;
		if (live) {
			if (f) void attach(f);
			return;
		}
		shot = f && f.type !== 'application/pdf' ? { url: URL.createObjectURL(f), how } : { how };
		reading = true;
		clearTimeout(timer);
		timer = setTimeout(() => (reading = false), 1200);
	};
	// on the live workspace the receipt goes at once; a refusal says why under the slot
	const attach = async (f: File) => {
		sending = true;
		try {
			await ws.staffReceipt?.(f, { ref: batch, inline: true });
		} catch (e) {
			err = e instanceof Error ? e.message : String(e);
		} finally {
			sending = false;
		}
	};
	const picked = (how: 'camera' | 'upload') => (e: Event) => {
		const el = e.currentTarget as HTMLInputElement;
		const f = el.files?.[0];
		el.value = '';
		if (f) use(f, how);
	};
	const take = () => {
		if (live && cam) cam.click();
		else use(null, 'camera');
	};
	const another = () => {
		shot = null;
		err = null;
		aside = mine?.id ?? null;
	};
	// Record the sale waits on the answer (SC-152): Recording…, then the toast once it has gone through, or the reason
	const record = async (sold: number) => {
		await ws.act('recordStaffSale', { sold, receipt: read }, { feel: 400, inline: true });
		toast({ text: `Recorded · ${fmt.num(sold)} of ${fmt.num(staff.units)} packs sold`, tone: 'ok' });
	};
	const rec = $derived(staff.receipt?.no && staff.receipt.payments.length ? staff.receipt : null);

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

{#snippet head()}<div class="card-head">
		<span class="row tight"
			><span class="icontile"><Icon name="users" size={17} stroke={2} /></span><span class="card-title"
				>Staff sale · {product}</span
			></span
		>{#if open}<Badge tone="blue" dot>open</Badge>{:else}<Badge tone="green" icon="check">recorded</Badge>{/if}
	</div>{/snippet}

{#if !open}<Card class="stack snug">
		{@render head()}
		<span class="t-subhead"
			><b>{fmt.num(staff.sold ?? 0)} of {fmt.num(staff.units)}</b> sold to staff at ₹{price} a pack</span
		>
		<Progress value={(staff.sold ?? 0) / staff.units} label="Staff packs sold" />
		{#if rec}<div class="pt-papers">
				<button type="button" class="pt-paper" onclick={() => (sheet = true)}
					><span class="icontile"><Icon name="receipt" size={17} stroke={2} /></span><span class="grow"
						><b>Consolidated receipt</b><span class="t-footnote muted"
							><span class="mono">{rec.no}</span> · {rec.payments.length} UPI payments · read by Vision</span
						></span
					><span class="tnum strong">{fmt.inr(rec.paid)}</span><Icon
						name="chevron-right"
						size={16}
						class="subtle"
					/></button
				>
			</div>{/if}
		<span class="t-footnote muted"
			>{staff.left
				? `${fmt.num(staff.left)} ${staff.left === 1 ? 'pack stays' : 'packs stay'} at ${staff.godown}.`
				: 'Every pack sold.'}{rec ? ` The receipt is in your batch's papers and ${possessive(short)} pack.` : ''}</span
		>
		{#if rec}<Sheet bind:open={sheet} title="Staff sale receipt"
				><StaffReceiptPaper r={{ file: `receipts/${batch}.webp`, ...rec }} {dist} {sku} {price} /></Sheet
			>{/if}
	</Card>
{:else}<Card class="stack snug">
		{@render head()}
		{#if !read && !busyReading}<span class="t-subhead"
				>{fmt.num(staff.units)} packs for your staff at <b>₹{price}</b> a pack, at {staff.godown}. Staff pay you by UPI.</span
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
				</div>{/if}{/if}
		<div class="row wrap" style="gap: 12px">
			<Stepper bind:value={n} min={0} max={staff.units} label="packs sold to staff" /><span class="t-subhead muted"
				>of {fmt.num(staff.units)} packs sold</span
			>
		</div>
		{#if busyReading}<div class="rcpt-read">
				<div class="row" style="gap: 12px">
					<Aura on class="icontile" style="border-radius: 12px; width: 40px; height: 40px"
						><Icon name="scan-line" size={19} /></Aura
					>
					<div class="grow">
						<b>Vision is reading the receipt</b>
						<div class="t-footnote muted">Each UPI reference, who paid and how much</div>
					</div>
				</div>
				<span class="sr-only" role="status">Vision is reading the receipt</span>
			</div>
		{:else if read}<ReceiptRead r={read} count={n} {price} src={read.url || stub} whose="your" />
		{:else}<div class="rcpt-slot">
				<span class="icontile"><Icon name="receipt" size={18} stroke={2} /></span><span class="grow"
					><b>Consolidated receipt</b><span class="t-footnote muted"
						>One receipt listing every staff payment by its UPI reference: from your books, or your UPI app's statement.
						A photo or a PDF.</span
					></span
				>
				<span class="cam-two rcpt-btns"
					><Button size="sm" variant="secondary" icon="camera" onclick={take}>Take a photo</Button><Button
						size="sm"
						variant="ghost"
						icon="upload"
						onclick={() => pick?.click()}>Upload</Button
					></span
				>
			</div>{/if}
		<input
			bind:this={cam}
			type="file"
			accept={RECEIPT_TYPES.slice(0, 3).join(',')}
			capture="environment"
			onchange={picked('camera')}
			class="sr-only"
			tabindex={-1}
			aria-hidden="true"
		/>
		<input
			bind:this={pick}
			type="file"
			accept={RECEIPT_TYPES.join(',')}
			onchange={picked('upload')}
			class="sr-only"
			tabindex={-1}
			aria-hidden="true"
		/>
		{#if err}<p class="cam-alert" role="alert"><Icon name="triangle-alert" size={15} />{err}</p>
		{:else if unread}<p class="cam-alert" role="alert">
				<Icon name="triangle-alert" size={15} />Vision could not read that receipt. Send a clearer photo, or the PDF
				from your UPI app.
			</p>{/if}
		{#if read && !matched}<p class="cam-alert" role="alert">
				<Icon name="triangle-alert" size={15} />The receipt has {read.payments.length} payments, {fmt.inr2(read.paid)}:
				count again, or send the receipt with every payment.
			</p>
			<div class="cam-two">
				<Button variant="secondary" icon="upload" onclick={another}>Send another</Button><Button
					variant="ghost"
					busy="Recording…"
					disabled={!made || made > staff.units}
					action={() => record(made)}>Record {fmt.num(made)} sold</Button
				>
			</div>
		{:else}<Button
				variant="primary"
				size="lg"
				block
				icon="check"
				action={() => record(n)}
				busy="Recording…"
				done="Recorded"
				disabled={!matched}
				aria-describedby="staff-need">Record the sale</Button
			>
			<span id="staff-need" class="t-caption subtle"
				>{read
					? 'Record once, when the sale is over. What does not sell stays at the godown.'
					: `Attach the consolidated receipt first: it is the sale's evidence for ${possessive(short)} papers.`}</span
			>{/if}
	</Card>{/if}
