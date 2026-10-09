<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import DocCard from '../../../components/DocCard.svelte';
	import Money from '../../../components/Money.svelte';
	import Product from '../../../components/Product.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import Skeleton from '../../../components/Skeleton.svelte';
	import Tile from '../../../components/Tile.svelte';
	import { cx } from '../../../cx';
	import { rise } from '../../../motion/transitions';
	import { useNotice } from '../../../notice.svelte';
	import Columns from '../../../patterns/Columns.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { csv, download, first } from '../../model';
	import { useWorkspace } from '../../source';
	import type { CaseData, Hero } from '../../types';
	import Locked from '../common/Locked.svelte';
	import KeepsWhat from './KeepsWhat.svelte';
	import Paper from './Paper.svelte';
	import { printPage } from './ledger';

	// a batch's pack of papers (screens/finance.jsx PaperPack): the papers the Paperwork agent drafted, each with its
	// reason, one open on paper beside them (in a sheet on phones and tablets), each with its PDF to download, and who
	// keeps what. The batch in focus's on Paperwork; a batch's own on its page in the ledger (SC-121), drafted, reviewed
	// and posted. On the live workspace a PDF is the Paperwork agent's own (SC-100); on the stub, the paper printed
	let { c, h }: { c: CaseData; h: Hero } = $props();
	const ws = useWorkspace();
	const app = useApp();
	const { toast } = useNotice();
	const DOC = (id: string) => c.docs.find((d) => d.id === id);

	// a batch with an ExpireSoon lot has its pack drafted at the award; one without, once the last of its lines is done
	// (SC-86), with no tax invoice or e-way bill check to draft (SC-108)
	const awarded = $derived(c.lines.expiresoon.units > 0);
	// the distributor's invoice is his: "Rakesh's", as finance says it
	const his = $derived(first(c.dist.short));
	const W = $derived(ws.data.workspace);
	const ready = $derived(!!h.docs);
	// the pack opens on its first paper (SC-85: a batch with no buyer has no invoice); once a batch has expired, on its
	// expiry paper (SC-94)
	let picked = $state<string | null>(null);
	const sel = $derived(picked && DOC(picked) ? picked : DOC('expiry') ? 'expiry' : (c.docs[0]?.id ?? 'invoice'));
	let sheet = $state(false);
	const doc = $derived(DOC(sel));
	const invoice = $derived(DOC('invoice'));
	const support = $derived(DOC('support'));
	let side: HTMLElement | undefined = $state();
	let inSheet: HTMLElement | undefined = $state();

	const open = (id: string) => {
		picked = id;
		if (app.bp !== 'desktop') sheet = true;
	};
	const exportPack = () => {
		download(
			`${c.batch.id}-document-pack.csv`,
			csv([
				['Document', 'Issued by', 'Number', 'Status', 'Amount (₹)', 'Note'],
				...c.docs.map((d) => [d.type, d.owner, d.no, d.status, d.amount ? d.amount.toFixed(2) : '', d.note || ''])
			])
		);
		toast({ text: 'Document pack exported', tone: 'ok' });
	};
	const review = () => {
		void ws.act('review');
		toast({ text: 'Pack reviewed · logged', tone: 'ok' });
	};
	// a paper's PDF: the live workspace's own, laid out by the Paperwork agent; the stub's, the paper printed
	const live = $derived(ws.kind === 'live');
	const canPdf = $derived(!!doc && (live ? !!doc.pdf && !!ws.documentUrl : doc.status !== 'not required'));
	const pdf = async (node: HTMLElement | undefined) => {
		if (!doc) return;
		if (live && ws.documentUrl) {
			window.open(await ws.documentUrl(doc.id, c.batch.id), '_blank', 'noopener');
			return;
		}
		if (node)
			printPage(
				`${doc.type} ${doc.no || ''} · ${c.batch.id}`,
				`<div class="${node.className}">${node.innerHTML}</div>`,
				{
					styles: true
				}
			);
	};
</script>

{#snippet pdfButton(node: HTMLElement | undefined)}{#if canPdf && doc}<Button
			variant="secondary"
			size="sm"
			icon="download"
			aria-label="Download {doc.type} as a PDF"
			onclick={() => pdf(node)}>Download PDF</Button
		>{/if}{/snippet}
{#snippet packRight()}<span class="row tight"
		><Button variant="secondary" size="sm" icon="download" onclick={exportPack}>Export</Button>{#if h.reviewed}<Badge
				tone="green"
				icon="check">reviewed</Badge
			>{:else}<Button variant="primary" size="sm" icon="check" onclick={review}>Mark reviewed</Button>{/if}</span
	>{/snippet}
{#snippet main()}<SectionTitle sub="Generated, drafted or not required, each with its reason" right={packRight}
		>Document pack</SectionTitle
	>
	<div class="docgrid">
		{#each c.docs as d (d.id)}<div class={cx('docpick', sel === d.id && app.bp === 'desktop' && 'on')}>
				<DocCard doc={d} onopen={() => open(d.id)} />
			</div>{/each}
	</div>
	<KeepsWhat {c} />{/snippet}
{#snippet sideRight()}{@render pdfButton(side)}{/snippet}
{#snippet aside()}{#if app.bp === 'desktop' && doc}<SectionTitle
			sub={doc.owner === ws.data.client.short ? `Issued by ${W.short}` : `Drafted for ${c.dist.name}`}
			right={sideRight}>{doc.type}</SectionTitle
		>{#key sel}<div in:rise={{ y: 6, duration: 180 }} bind:this={side}><Paper id={sel} {c} /></div>{/key}{/if}{/snippet}
{#snippet sheetFoot()}{@render pdfButton(inSheet)}{/snippet}

{#if !ready}
	<div class="stack" style="gap: 16px">
		<Card class="row wrap" style="gap: 16px"
			><Product name="documents" size={88} />
			<div class="grow stack tight" style="gap: 2px">
				<b>{awarded ? 'The pack is drafted at the award' : 'The pack is drafted once every line is done'}</b><span
					class="t-footnote muted"
					>{awarded ? `${his}'s tax invoice, the e-way bill check, ` : ''}{W.short}'s price-support credit note, the ITC
					memo, the FSSAI checklist and the destruction certificate, each generated or marked not required with the
					reason.</span
				>
			</div></Card
		><Locked
			icon="file-text"
			agent="Paperwork agent"
			live={h.phase === 'dispatched'}
			text={h.phase === 'dispatched'
				? awarded
					? `Drafting ${his}'s invoice, the e-way bill check, the credit note and the ITC memo.`
					: 'Drafting the credit note, the ITC memo and the FSSAI checklist.'
				: awarded
					? "Drafts the whole pack once the lot is awarded and on the buyer's truck."
					: 'Drafts the whole pack once every line of the plan is done.'}
		/>
		<div class="docgrid">
			{#each c.docs as d (d.id)}<Skeleton h={132} r={20} />{/each}
		</div>
	</div>
{:else}
	<div class="stack" style="gap: 20px">
		<div class="row wrap" style="gap: 12px">
			{#if invoice}<Tile label="{his}'s invoice" icon="receipt"><Money value={invoice.total!} size="s" /></Tile>{/if}
			{#if support}<Tile label="Price support" icon="hand-coins"><Money value={support.amount} size="s" /></Tile>{/if}
			<Tile label="GST credit kept" icon="badge-check"
				><Money value={DOC('itc')?.amount ?? 0} size="s" style="color: var(--primary-text)" /></Tile
			>
			<Tile label="Things to chase" icon="list-checks"><span class="num s">0</span></Tile>
		</div>
		<Columns sideWidth={460} {main} side={aside} />
	</div>
{/if}
<Sheet bind:open={sheet} title={doc ? doc.type : ''} footer={canPdf ? sheetFoot : undefined}
	><div bind:this={inSheet}><Paper id={sel} {c} /></div></Sheet
>
