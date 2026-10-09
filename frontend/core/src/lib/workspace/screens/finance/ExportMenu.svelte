<script lang="ts">
	import Button from '../../../components/Button.svelte';
	import Menu, { type MenuItem } from '../../../components/Menu.svelte';
	import { useNotice } from '../../../notice.svelte';
	import { useWorkspace } from '../../source';
	import type { LedgerBatch, LedgerPeriod } from '../../types';
	import { exportBRSR, exportGST, exportLedger, printReport } from './ledger';

	// the period's exports (screens/finance.jsx ExportMenu): BRSR's table, the GST summary and the ledger as CSV, and the
	// report printed to a PDF
	let { p, list, since }: { p: LedgerPeriod; list: LedgerBatch[]; since: string } = $props();
	const ws = useWorkspace();
	const { toast } = useNotice();
	let open = $state(false);
	const done = (text: string) => toast({ text, tone: 'ok' });
</script>

{#snippet csvTag()}<span class="t-caption subtle">CSV</span>{/snippet}
{#snippet pdfTag()}<span class="t-caption subtle">PDF</span>{/snippet}
<Menu
	bind:open
	width={260}
	label="Export {p.label}"
	items={[
		{ label: `Export ${p.label}`, heading: true },
		{
			label: 'BRSR table',
			icon: 'leaf',
			right: csvTag,
			onclick: () => (exportBRSR(p, list), done('BRSR table exported as CSV'))
		},
		{
			label: 'GST summary',
			icon: 'badge-check',
			right: csvTag,
			onclick: () => (exportGST(p, list), done('GST summary exported as CSV'))
		},
		{
			label: 'The ledger',
			icon: 'file-spreadsheet',
			right: csvTag,
			onclick: () => (exportLedger(p, list), done('Ledger exported as CSV'))
		},
		'-',
		{
			label: 'The report',
			icon: 'file-text',
			right: pdfTag,
			onclick: () => printReport(p, list, since, ws.data.workspace)
		}
	] satisfies MenuItem[]}
	>{#snippet trigger(props)}<Button {...props} variant="secondary" size="sm" icon="download">Export</Button
		>{/snippet}</Menu
>
