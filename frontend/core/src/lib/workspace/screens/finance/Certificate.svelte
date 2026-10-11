<script lang="ts">
	import { imgUrl } from '../../../assets';
	import { fmt } from '../../model';
	import { signUrl } from '../../marks';
	import { useWorkspace } from '../../source';
	import type { CaseData, Doc } from '../../types';
	import { evidenceFile } from '../brand/destruction';
	import Photo from '../common/Photo.svelte';
	import { recWhen } from '../record/record';
	import Ink from './Ink.svelte';

	// the certificate of destruction in full (SC-174, option B; screens/finance.jsx Certificate), for packs destroyed at
	// his godown (SC-139). Page 1, the certificate: the goods, the reason, the agency's method, the facility, the day and
	// the window, with its supervising officer's and two independent witnesses' signatures and the agency's seal, who
	// handed the packs over and whose yes approved the evidence; page 2, the destruction log from the godown to the cover,
	// with the two photos, initialled at every step by all three. Until the evidence is approved it waits
	let { d, c }: { d: Doc; c: CaseData } = $props();
	const ws = useWorkspace();
	const W = $derived(ws.data.workspace);
	const R = $derived(c.dist);
	const F = $derived(d.for ?? { name: R.name, gstin: R.gstin, address: R.address });
	const r2 = (n: number) => Math.round(n * 100) / 100;
	const hhmm = (t?: string | null) => (t || '').slice(11, 16);
	const kg2 = (n?: number | null) => `${(Math.round((n || 0) * 100) / 100).toFixed(2)} kg`;
	const dmy = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
	const cartonsOf = (u: number, per: number) => {
		const n = Math.floor(u / per),
			r = u % per;
		return !per ? '' : r ? `${n} cartons of ${per} and ${r} loose` : `${n} cartons of ${per}`;
	};
	// a photo of the log: its link on the live workspace, else on the stub its file as sent
	const photoOf = (w: 'before' | 'after') => {
		const p = d.photos?.[w];
		if (!p) return null;
		if (p.url) return p.url;
		return imgUrl(`evidence/${evidenceFile(c.batch.id, w, p)}`) ?? null;
	};
	const food = $derived(r2((d.kg || 0) - (d.packKg || 0)));
	const fac = $derived(d.facility || { name: d.site ?? '', address: '', gps: '' });
	const on = $derived(d.destroyedOn || (d.destroyedAt || '').slice(0, 10));
	const win = $derived(d.window || { from: '', to: hhmm(d.destroyedAt) });
	// who signs it: the agency's officer, with its seal, and the two witnesses
	type Signer = { name: string; sign?: string | null; title?: string; address?: string; proof?: string | null };
	const sigs = $derived<[string, string, Signer | null | undefined][]>([
		['officer', 'Supervising officer', d.officer],
		['w1', 'Independent witness 1', (d.witnesses || [])[0]],
		['w2', 'Independent witness 2', (d.witnesses || [])[1]]
	]);
	const kv = $derived<[string, string, boolean?][]>([
		[
			'Goods',
			`${d.goods || `${c.sku.brand} ${c.sku.name}`}, HSN ${d.hsn || c.sku.hsn}, MRP ₹${Number(d.mrp || c.sku.mrp).toFixed(2)}`
		],
		[
			'Batch No.',
			`${d.batch || c.batch.id} (made ${fmt.date(d.mfg || c.batch.mfg)}, best before ${fmt.date(d.bestBefore || c.batch.bestBefore)})`,
			true
		],
		['Quantity', `${fmt.num(d.units ?? 0)} packs${d.perCarton ? `, ${cartonsOf(d.units ?? 0, d.perCarton)}` : ''}`],
		['Total weight', `${kg2(d.kg)} (${kg2(food)} food, ${kg2(d.packKg || 0)} packaging), weighed at the facility`],
		['Owner', `${F.name}, GSTIN ${F.gstin}`],
		['Reason', 'Product expiry: unsold on the best-before'],
		['Method', `${d.methodName || d.method} (Solid Waste Management Rules, 2016)`],
		['Facility', [fac.name, fac.address].filter(Boolean).join(', ') + (fac.gps ? ` · ${fac.gps}` : '')],
		['Date and time', `${fmt.date(on)}, ${win.from} to ${win.to} IST`],
		['GST', `${fmt.inr2(d.reversed ?? 0)} reversed by ${F.name}, s.17(5)(h)`]
	]);
	const initials = $derived([d.officer, ...(d.witnesses || [])].filter((w) => !!w));
	const initialsOf = (name: string) =>
		name
			.split(' ')
			.map((x) => x[0])
			.join('');
</script>

{#snippet line(key: string, v: string, strong = false, sub?: string)}<div class="pp-line">
		<span
			>{key}{#if sub}<em>{` ${sub}`}</em>{/if}</span
		><span class={strong ? 'pp-strong' : ''}>{v}</span>
	</div>{/snippet}

{#if d.status !== 'generated'}<div class="paper pp">
		<div class="pp-head">
			<div>
				<div class="pp-title">Destruction certificate</div>
				<div class="pp-no">{c.batch.id} · {R.name}</div>
			</div>
			<span class="pp-stamp">AWAITING</span>
		</div>
		<div class="pp-sub">For {R.name}, {R.address} · GSTIN {R.gstin}</div>
		{@render line(
			`${c.sku.brand} ${c.sku.name}`,
			`${fmt.num(d.units ?? 0)} packs`,
			true,
			`HSN ${c.sku.hsn} · batch ${c.batch.id} · best before ${fmt.date(c.batch.bestBefore)}`
		)}
		{@render line('Input GST he will reverse', fmt.inr2(d.reversed ?? 0), false, 'section 17(5)(h)')}
		<p class="pp-note">
			Issued by the authorised agency once {W.short} approves the destruction's evidence: two photos, the agency's certificate
			number, the time and its two witnesses.
		</p>
	</div>
{:else}<div class="cert-pages">
		<div class="paper cert">
			<div class="cert-lh">
				<div>
					<b>{(d.agency || '').toUpperCase()}</b><span>Authorised waste-management agency · authorisation {d.auth}</span
					>
				</div>
				<span class="pp-stamp ok">DESTROYED</span>
			</div>
			<div class="cert-t">Certificate of Destruction</div>
			<div class="cert-m">
				<span>No. <b>{d.no}</b></span><span>Dated <b>{dmy(on)}</b></span><span>Page 1 of 2</span>
			</div>
			<dl class="cert-kv">
				{#each kv as [k, v, mono] (k)}<dt>{k}</dt>
					<dd class={mono ? 'mono' : ''}>{v}</dd>{/each}
			</dl>
			<div class="cert-sec">Signed at the facility, as set out in the log overleaf</div>
			<div class="cert-sigs">
				{#each sigs as [k, label, w] (k)}<div class="cert-sig">
						<span class="cert-k">{label}</span>
						<div class="cert-ink">
							{#if w}<Ink who={w} seal={k === 'officer' ? d.seal : null} h={40} />{/if}
						</div>
						<b>{w ? w.name : '—'}</b><span
							>{k === 'officer' ? (w ? `${w.title}, ${d.agency}` : '') : w ? w.address : ''}</span
						>{#if w?.proof}<span class="mono">{w.proof}</span>{/if}
					</div>{/each}
			</div>
			<div class="cert-hand">
				<div>
					<span class="cert-k">Goods handed over by</span>{#if d.handedBy}<div class="cert-ink">
							<Ink who={d.handedBy} h={34} />
						</div>{/if}<b>{d.handedBy ? d.handedBy.name : F.name}</b><span
						>{d.handedBy ? `${d.handedBy.title}, ${F.name}` : ''}</span
					>
				</div>
				<div>
					<span class="cert-k">Evidence approved by</span><b>{d.approvedBy}</b><span
						>for {ws.data.client.name}, {recWhen(d.approvedAt)}</span
					><span class="muted"
						>two photos · Vision's checks {d.evidence ? `${d.evidence.checks} of ${d.evidence.of}` : ''}</span
					>
				</div>
			</div>
		</div>
		{#if d.log}<div class="paper cert">
				<div class="cert-m"><span><b>Destruction log</b> · {d.no}</span><span>Page 2 of 2</span></div>
				<table class="cert-log">
					<thead><tr><th>Time</th><th>Step</th><th>Detail</th><th>Initials</th></tr></thead>
					<tbody>
						{#each d.log as x (x.step)}{@const src = x.photo ? photoOf(x.photo) : null}<tr
								><td class="mono">{hhmm(x.at)}</td><td><b>{x.step}</b></td><td
									>{x.detail}{#if src}<span class="cert-ph"
											><Photo
												{src}
												alt={x.photo === 'before'
													? "The packs at the godown, the carton's batch label in view"
													: 'The packs at the landfill, the slate in view'}
												loading="lazy"
											/></span
										>{/if}</td
								><td class="cert-ini"
									>{#each initials as w (w.name)}{#if w.sign}<img
												src={signUrl(w.sign)}
												alt="Initialled by {w.name}"
											/>{:else}<span class="cert-ini-none">{initialsOf(w.name)}</span>{/if}{/each}</td
								></tr
							>{/each}
					</tbody>
				</table>
				<p class="cert-note">
					Initialled at each step by the supervising officer and the two independent witnesses, who watched it from
					receipt to cover.
				</p>
			</div>{/if}
	</div>{/if}
