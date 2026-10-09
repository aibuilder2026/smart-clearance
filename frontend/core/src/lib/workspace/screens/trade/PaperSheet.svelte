<script lang="ts">
	import Button from '../../../components/Button.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import { useNotice } from '../../../notice.svelte';
	import { useWorkspace } from '../../source';
	import type { Batch, CaseData, Distributor, Doc, Sku } from '../../types';
	import Paper from '../finance/Paper.svelte';
	import Receipt from '../finance/Receipt.svelte';
	import { printPage } from '../finance/ledger';

	// a paper on its page, in a sheet, with its PDF (SC-130): the Paperwork agent's own on the live workspace, once it
	// has laid it out; on the stub, the paper printed. A batch's paper is read from its case (`c`); a food bank's receipt
	// comes with its batch
	type Props = {
		open: boolean;
		ref: string;
		c?: CaseData | null;
		id?: string | null;
		receipt?: { doc: Doc; batch: Batch; sku: Sku; dist: Distributor } | null;
	};
	let { open = $bindable(), ref, c, id, receipt }: Props = $props();
	const ws = useWorkspace();
	const { toast } = useNotice();
	const d = $derived(receipt?.doc ?? (c && id ? c.docs.find((x) => x.id === id) : undefined));
	const live = $derived(ws.kind === 'live');
	const canPdf = $derived(!!d && (live ? !!d.pdf && !!ws.documentUrl : true));
	let node: HTMLElement | undefined = $state();
	const pdf = async () => {
		if (!d) return;
		if (live && ws.documentUrl) {
			try {
				window.open(await ws.documentUrl(d.id, ref), '_blank', 'noopener');
			} catch {
				toast({ text: 'The PDF could not be opened. Try again in a moment.', tone: 'err' });
			}
			return;
		}
		if (node)
			printPage(
				`${d.type || 'Donation receipt'} ${d.no || ''}`,
				`<div class="${node.className}">${node.innerHTML}</div>`,
				{
					styles: true
				}
			);
	};
</script>

{#snippet footer()}{#if canPdf}<Button variant="secondary" block icon="download" onclick={pdf}>Download PDF</Button
		>{/if}{/snippet}
<Sheet bind:open title={d ? d.type || 'Donation receipt' : ''} footer={d ? footer : undefined}>
	{#if d}<div bind:this={node} class="stack snug">
			{#if receipt}<Receipt
					doc={receipt.doc}
					batch={receipt.batch}
					sku={receipt.sku}
					dist={receipt.dist}
				/>{:else if c && id}<Paper {id} {c} />{/if}
		</div>{/if}
</Sheet>
