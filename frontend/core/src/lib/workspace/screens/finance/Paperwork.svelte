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
	import Icon from '../../../icons/Icon.svelte';
	import { rise } from '../../../motion/transitions';
	import { useNotice } from '../../../notice.svelte';
	import Columns from '../../../patterns/Columns.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { castOf, csv, download, first } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Locked from '../common/Locked.svelte';
	import Screen from '../common/Screen.svelte';
	import KeepsWhat from './KeepsWhat.svelte';
	import Paper from './Paper.svelte';

	// S5 Paperwork (Anita, finance): the document pack the Paperwork agent drafts at the award, each document with its
	// reason, one open on paper beside them (in a sheet on phones and tablets) (screens/finance.jsx Paperwork)
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const app = useApp();
	const { toast } = useNotice();
	const DOC = (id: string) => c.docs.find((d) => d.id === id)!;

	const h = $derived(ws.state.hero);
	const cast = $derived(castOf(ws.state, c));
	// the distributor's invoice is his: "Rakesh's", as finance says it
	const his = $derived(first(cast.distributor.short));
	const W = $derived(ws.data.workspace);
	const ready = $derived(!!h.docs);
	let sel = $state('invoice');
	let sheet = $state(false);
	const doc = $derived(DOC(sel));

	const open = (id: string) => {
		sel = id;
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
</script>

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
	<KeepsWhat />
	<Card class="row top" style="gap: 14px; background: var(--surface-2)"
		><span class="icontile"><Icon name="quote" size={17} /></span>
		<div>
			<p class="t-body" style="margin: 0">
				Credit note, GST memo, and {his}'s invoice attached as evidence. First batch this year with nothing for me to
				chase.
			</p>
			<span class="t-footnote subtle">{cast.finance.short} · finance</span>
		</div></Card
	>{/snippet}
{#snippet side()}{#if app.bp === 'desktop'}<SectionTitle
			sub={doc.owner === ws.data.client.short ? `Issued by ${W.short}` : `Drafted for ${c.dist.name}`}
			>{doc.type}</SectionTitle
		>{#key sel}<div in:rise={{ y: 6, duration: 180 }}><Paper id={sel} /></div>{/key}{/if}{/snippet}

<Screen {me} title="Paperwork" sub={`${c.batch.id} · prepared by the Paperwork agent at the award`}>
	{#if !ready}
		<div class="stack" style="gap: 16px">
			<Card class="row wrap" style="gap: 16px"
				><Product name="documents" size={88} />
				<div class="grow stack tight" style="gap: 2px">
					<b>The pack is drafted at the award</b><span class="t-footnote muted"
						>{his}'s tax invoice, the e-way bill check, {W.short}'s price-support credit note, the ITC memo, the FSSAI
						checklist and the destruction certificate, each generated or marked not required with the reason.</span
					>
				</div></Card
			><Locked
				icon="file-text"
				agent="Paperwork agent"
				live={h.phase === 'dispatched'}
				text={h.phase === 'dispatched'
					? `Drafting ${his}'s invoice, the e-way bill check, the credit note and the ITC memo.`
					: "Drafts the whole pack once the lot is awarded and on the buyer's truck."}
			/>
			<div class="docgrid">
				{#each c.docs as d (d.id)}<Skeleton h={132} r={20} />{/each}
			</div>
		</div>
	{:else}
		<div class="stack" style="gap: 20px">
			<div class="row wrap" style="gap: 12px">
				<Tile label="{his}'s invoice" icon="receipt"><Money value={DOC('invoice').total!} size="s" /></Tile>
				<Tile label="Price support" icon="hand-coins"><Money value={DOC('support').amount} size="s" /></Tile>
				<Tile label="GST credit kept" icon="badge-check"
					><Money value={DOC('itc').amount} size="s" style="color: var(--primary-text)" /></Tile
				>
				<Tile label="Things to chase" icon="list-checks"><span class="num s">0</span></Tile>
			</div>
			<Columns sideWidth={460} {main} {side} />
		</div>
	{/if}
	<Sheet bind:open={sheet} title={doc ? doc.type : ''}><Paper id={sel} /></Sheet>
</Screen>
