<script lang="ts">
	import Button from '../../../components/Button.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import { useNotice } from '../../../notice.svelte';
	import { useWorkspace } from '../../source';
	import type { Batch, CaseData, Distributor, Doc, KiranaInvoice as Invoice, Sku } from '../../types';
	import KiranaInvoice from '../finance/KiranaInvoice.svelte';
	import KiranaRegister from '../finance/KiranaRegister.svelte';
	import Paper from '../finance/Paper.svelte';
	import Receipt from '../finance/Receipt.svelte';
	import { printPage } from '../finance/ledger';

	// a paper on its page, in a sheet, with its PDF (SC-130): the Paperwork agent's own on the live workspace, once it
	// has laid it out; on the stub, the paper printed. A batch's paper is read from its case (`c`); a food bank's receipt
	// comes with its batch. A kirana's tax invoice comes with its batch, and so does a batch's register of them, each
	// number opening its invoice in the same sheet (SC-153); the register prints as it shows
	type About = { batch: { id: string; bestBefore?: string | null }; sku: Sku; dist: Distributor };
	type Props = {
		open: boolean;
		ref: string;
		c?: CaseData | null;
		id?: string | null;
		receipt?: { doc: Doc; batch: Batch; sku: Sku; dist: Distributor } | null;
		invoice?: ({ inv: Invoice } & About) | null;
		register?: ({ list: Invoice[]; price: number } & About) | null;
	};
	let { open = $bindable(), ref, c, id, receipt, invoice, register }: Props = $props();
	const ws = useWorkspace();
	const { toast } = useNotice();
	let one = $state<Invoice | null>(null);
	$effect(() => {
		if (!open) one = null;
	});
	const inv = $derived(invoice?.inv ?? one);
	const about = $derived<About | null>(invoice ?? register ?? null);
	const d = $derived(receipt?.doc ?? (c && id ? c.docs.find((x) => x.id === id) : undefined));
	const head = $derived(
		inv
			? { type: 'Tax invoice', no: inv.no }
			: register
				? { type: 'Tax invoices to kiranas', no: register.batch.id }
				: d
					? { type: d.type || 'Donation receipt', no: d.no || '' }
					: null
	);
	const live = $derived(ws.kind === 'live');
	const canPdf = $derived(
		inv
			? live
				? !!inv.pdf && !!ws.documentUrl
				: true
			: register
				? true
				: !!d && (live ? !!d.pdf && !!ws.documentUrl : true)
	);
	let node: HTMLElement | undefined = $state();
	const pdf = async () => {
		if (!head) return;
		const doc = inv ? `kirana.${inv.kirana}` : register ? null : d?.id;
		if (live && ws.documentUrl && doc) {
			try {
				window.open(await ws.documentUrl(doc, ref), '_blank', 'noopener');
			} catch {
				toast({ text: 'The PDF could not be opened. Try again in a moment.', tone: 'err' });
			}
			return;
		}
		if (node)
			printPage(`${head.type} ${head.no}`, `<div class="${node.className}">${node.innerHTML}</div>`, {
				styles: true
			});
	};
</script>

{#snippet footer()}{#if canPdf}<Button variant="secondary" block icon="download" onclick={pdf}>Download PDF</Button
		>{/if}{/snippet}
<Sheet bind:open title={head ? head.type : ''} footer={head ? footer : undefined}>
	{#if register && one}<button
			type="button"
			class="pt-link t-footnote"
			style="justify-self: start; margin-bottom: 8px"
			onclick={() => (one = null)}>All {register.list.length} invoices</button
		>{/if}
	{#if head}<div bind:this={node} class="stack snug">
			{#if inv && about}<KiranaInvoice
					{inv}
					batch={about.batch}
					sku={about.sku}
					dist={about.dist}
				/>{:else if register}<KiranaRegister
					list={register.list}
					batch={register.batch}
					sku={register.sku}
					dist={register.dist}
					price={register.price}
					onOpen={(x) => (one = x)}
				/>{:else if receipt}<Receipt
					doc={receipt.doc}
					batch={receipt.batch}
					sku={receipt.sku}
					dist={receipt.dist}
				/>{:else if c && id}<Paper {id} {c} />{/if}
		</div>{/if}
</Sheet>
