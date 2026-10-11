<script lang="ts">
	import Photo from '../common/Photo.svelte';
	import Button from '../../../components/Button.svelte';
	import Field from '../../../components/Field.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Product from '../../../components/Product.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import Textarea from '../../../components/Textarea.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { draftCertificate } from '../../certificate';
	import { castOf, fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { Destruction, Distributor, ExpirySettlement, Ink as InkT, SignatureRole, Sku } from '../../types';
	import Certificate from '../finance/Certificate.svelte';
	import Ink from '../finance/Ink.svelte';
	import { dzAt, dzPhoto } from './destruction';

	// the operator's second yes on packs destroyed at the distributor's godown (SC-139, option B; screens/brand.jsx
	// DestructionSheet): both photos, Vision's checks, the agency on the client's list, and what the yes issues. The batch
	// closes on Approve; Ask again sends the distributor back to the evidence with the reason
	let {
		open = $bindable(false),
		d,
		x,
		dist,
		sku,
		batch,
		client
	}: {
		open?: boolean;
		d: Destruction | null | undefined;
		x: ExpirySettlement | null | undefined;
		dist: Distributor;
		sku: Sku;
		batch: string;
		client: string;
	} = $props();
	const ws = useWorkspace();
	const whose = (n: string) => n + (/s$/.test(n) ? "'" : "'s");
	let asking = $state(false);
	let why = $state('');
	const close = () => {
		open = false;
		asking = false;
		why = '';
	};
	// her yes and asking again each wait on the answer in their button (SC-152): the sheet closes once it has gone
	// through, and stays open with the reason under the button when it has not
	const approve = async () => {
		await ws.act('approveDestruction', undefined, { ref: batch, inline: true });
		close();
	};
	const again = async () => {
		await ws.act('askDestructionAgain', why.trim(), { ref: batch, inline: true });
		close();
	};
	const live = $derived(ws.kind === 'live');
	// the certificate as signed at the facility (SC-183, option B): page 1 as he sent it, stamped SIGNED before her yes,
	// each signature drawing itself once as it was signed, a quarter of a second apart
	const ORDER: SignatureRole[] = ['officer', 'w1', 'w2', 'handed'];
	const signed = $derived(!!d?.signatures && ORDER.every((k) => d!.signatures![k]));
	const theBatch = $derived(
		ws.case?.batch.id === batch ? ws.case.batch : (ws.data.batches.find((b) => b.id === batch) ?? null)
	);
	const doc = $derived(
		signed && d?.agency && d.certificate && theBatch
			? draftCertificate(
					{ ...d, agency: d.agency, certificate: d.certificate },
					{
						batch: theBatch,
						sku,
						dist,
						expiry: x ?? null,
						setup: ws.data.setup.destruction,
						evidence: ws.case?.story?.evidence
					}
				)
			: null
	);
	const inkAt = (t: string) => (t.length > 5 ? t.slice(11, 16) : t);
	// the distributor's signatory by first name, past an initial (K. Lakshmi Narayana is Lakshmi)
	const signer = $derived(
		dist.signatory
			? (dist.signatory.name.split(' ').find((w) => w.replace('.', '').length > 1) ?? dist.signatory.name)
			: dist.short
	);
	const span = $derived.by(() => {
		const ats = ORDER.map((k) => d?.signatures?.[k]?.at)
			.filter((t): t is string => !!t)
			.map(inkAt);
		return ats.length ? `, ${ats[0]} to ${ats[ats.length - 1]}` : '';
	});
	const ALT = {
		before: 'The packs at the godown, the batch label in view',
		after: 'The packs slit open at the landfill, the slate in view'
	};
</script>

{#snippet footer()}{#if d && d.status === 'checked'}<div class="dz-foot">
			{#if asking}<Button variant="ghost" size="lg" onclick={() => (asking = false)}>Back</Button><Button
					variant="primary"
					size="lg"
					block
					icon="send"
					disabled={!why.trim()}
					action={again}
					busy="Asking again…">Ask {dist.short} again</Button
				>{:else}<Button variant="secondary" size="lg" icon="rotate-ccw" onclick={() => (asking = true)}
					>Ask again</Button
				><Button variant="approve" size="lg" block icon="check" action={approve} busy="Approving…" done="Approved"
					>Approve · issue the papers</Button
				>{/if}
		</div>{/if}{/snippet}

{#snippet place(
	k: string,
	w: { name: string; sign?: string | null; ink?: InkT | null } | null | undefined
)}{#if w?.ink}<span class="dz-signed"
			><Ink
				who={w}
				seal={k === 'officer' ? doc?.seal : null}
				h={k === 'handed' ? 34 : 40}
				play
				delay={0.3 + ORDER.indexOf(k as SignatureRole) * 0.25}
			/><span class="cert-when">{w.ink.typed ? 'typed' : 'signed'} {inkAt(w.ink.at)}</span></span
		>{:else}<span class="sig-none">not signed</span>{/if}{/snippet}

<Sheet bind:open title="Approve the destruction" onclose={close} {footer}>
	{#if d}<div class="stack" style="gap: 14px">
			<div class="row" style="gap: 12px">
				<Product name={sku.img} size={44} alt="" />
				<div class="grow">
					<b>{sku.name} · {fmt.num(d.units)} packs</b>
					<div class="t-footnote muted">
						Batch <span class="mono">{batch}</span> · expired at {dist.godown} · sent by {dist.name}
					</div>
				</div>
			</div>
			<div class="dz-two dz-pair">
				{#each ['before', 'after'] as const as w (w)}{@const src = dzPhoto(d, batch, w, live)}
					<div class="cam dz-cam">
						{#if src}<Photo class="cam-feed whole" {src} alt={ALT[w]} />{/if}<span class="cam-tag"
							>{w === 'before' ? 'Before' : 'After'}{dzAt(d, w)}</span
						>
					</div>{/each}
			</div>
			{#if doc && theBatch}<div class="stack tight">
					<b class="t-subhead">The certificate, as signed at the facility</b>
					<span class="t-footnote muted">Each signed in their own place{span} on {fmt.date(theBatch.bestBefore)}</span>
					<div class="dz-signedpaper">
						<div class="dz-zoom">
							<Certificate
								d={doc}
								c={{ dist, sku, batch: theBatch }}
								draft={{ stamp: 'SIGNED', place, approver: castOf(ws.state, null).operator?.name ?? client }}
							/>
						</div>
					</div>
				</div>{/if}
			{#if asking}<Field label={`What ${dist.short} should send again`} htmlFor="dz-why"
					><Textarea
						id="dz-why"
						rows={3}
						bind:value={why}
						placeholder="The batch label is not readable in the before photo"
					/></Field
				>{:else}<div class="stack" style="gap: 16px">
					<div class="stack tight">
						<b class="t-subhead">{whose('Vision')} checks</b>
						{#each d.checks ?? [] as ck (ck.id)}<div class="row tight t-subhead dz-check">
								<Icon
									name={ck.ok ? 'circle-check' : 'circle-alert'}
									size={16}
									class={ck.ok ? 'dz-ok' : 'dz-warn'}
								/>{ck.label}
							</div>{/each}
						{#if d.agency}<div class="row tight t-subhead dz-check">
								<Icon name="circle-check" size={16} class="dz-ok" />{d.agency.name} is on {whose(client)} list (authorisation
								{d.agency.auth}) · certificate {d.certificate}
							</div>{/if}
						{#if signed}<div class="row tight t-subhead dz-check">
								<Icon name="circle-check" size={16} class="dz-ok" />Four signatures on the certificate: the officer,
								both witnesses and {signer}
							</div>{/if}
					</div>
					{#if x}<div class="stack tight dz-yes">
							<b class="t-subhead">On your yes</b>
							<List>
								<ListRow
									title={`Expiry credit note to ${dist.name}`}
									sub={`${fmt.num(x.units)} × ${fmt.rate(sku.dp ?? 0)} + ${fmt.inr2(x.gst ?? 0)} GST he reverses + ${fmt.inr2(x.charges ?? 0)} destruction`}
								>
									{#snippet value()}<span class="tnum">{fmt.inr2(x.amount ?? 0)}</span>{/snippet}
								</ListRow>
								<ListRow
									title="Destruction certificate"
									sub={`${d.agency ? d.agency.name : 'the agency'}, ${d.certificate ?? ''}`}
								>
									{#snippet value()}<span class="tnum">{fmt.num(d.units)} packs</span>{/snippet}
								</ListRow>
								<ListRow
									title={`${whose(client)} input GST`}
									sub={`the packs were ${whose(dist.name)} stock`}
									value="kept"
								/>
							</List>
						</div>{/if}
				</div>{/if}
		</div>{/if}
</Sheet>
