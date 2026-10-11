<script lang="ts">
	import Photo from '../common/Photo.svelte';
	import Aura from '../../../components/Aura.svelte';
	import Badge from '../../../components/Badge.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import Field from '../../../components/Field.svelte';
	import Input from '../../../components/Input.svelte';
	import Select from '../../../components/Select.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import type { IconName } from '../../../icons/registry';
	import { fmt } from '../../../format';
	import { useRoute } from '../../context';
	import { castOf } from '../../model';
	import { useWorkspace } from '../../source';
	import { draftCertificate } from '../../certificate';
	import type { DestructionStatus, Ink as InkT, SignatureRole, Signature, User } from '../../types';
	import { dzPhoto, type DzWhich } from '../brand/destruction';
	import Screen from '../common/Screen.svelte';
	import Certificate from '../finance/Certificate.svelte';
	import Ink from '../finance/Ink.svelte';
	import SignSheet, { type Signed, type Signer } from './SignSheet.svelte';
	import DistBatchLine from './DistBatchLine.svelte';
	import { distJourneysOf, distOfMe } from './pt';

	// destroying the packs left at his godown on expiry day (SC-139, option B; screens/trade.jsx DestroyScreen): through
	// an authorised agency, with two photos (before, at the godown with the batch label in view; after, at the landfill
	// with the slate), the agency and its certificate number, and for the certificate in full (SC-174) the window the
	// agency destroyed them in and two independent witnesses, the agency's own panel to start. Vision checks them, the
	// client's operator gives the second yes, and the credit note and the certificate follow. The certificate is signed
	// in place (SC-183, option B): laid out from what he enters, its officer, both witnesses and he each sign in their own
	// place before it is sent. A request on another batch acts on that batch (the address)
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const router = useRoute();
	const dist = $derived(distOfMe(ws, me));
	const nows = $derived(distJourneysOf(ws, dist.id).map((x) => x.n));
	const ref = $derived(router.route.params?.ref ?? null);
	const n = $derived(nows.find((x) => x.destruction && x.ref === ref) ?? nows.find((x) => x.destruction) ?? null);
	const d = $derived(n?.destruction ?? null);
	// the evidence as sent: his batch's facts on the live workspace, else the case's while it is the batch in focus
	const full = $derived(
		n
			? (ws.partners?.cases.find((x) => x.ref === n.ref)?.destruction ??
					(ws.case?.batch.id === n.ref ? (ws.case.destruction ?? ws.state.hero.destruction) : null))
			: null
	);
	const sku = $derived(n ? ws.data.skus[n.sku] : null);
	const C = $derived(ws.data.client.short);
	// the operator who gives the second yes
	const op = $derived(castOf(ws.state, null).operator);
	const agencies = $derived(ws.data.setup.destruction.agencies.filter((a) => a.city === dist.city));
	const live = $derived(ws.kind === 'live');
	const whose = (x: string) => x + (/s$/.test(x) ? "'" : "'s");

	const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
	const PHOTO_MAX_MB = 8;
	const RULE = `JPEG, PNG or WebP, under ${PHOTO_MAX_MB}\u00a0MB`;
	const SLOTS: { id: DzWhich; n: number; title: string; hint: string; alt: string }[] = [
		{
			id: 'before',
			n: 1,
			title: 'Before',
			hint: 'The packs at your godown, the batch label in view',
			alt: "The expired packs at the godown, the carton's batch label in view"
		},
		{
			id: 'after',
			n: 2,
			title: 'After',
			hint: 'Slit open at the landfill, the slate in view',
			alt: 'The packs slit open in a landfill pit, a slate with the batch, the count and the date'
		}
	];
	const SAY: Partial<Record<DestructionStatus, [IconName, string, string]>> = {
		reading: [
			'scan-line',
			'Vision is checking your photos',
			'The batch on the label, the count in view, and the slate'
		],
		checked: ['hourglass', 'Sent for approval', 'is reviewing your evidence. The credit note follows the yes.'],
		approved: [
			'badge-check',
			'Approved · you are credited',
			"The expiry credit note and the agency's certificate are in your papers."
		]
	};

	type Shot = { url?: string; file?: File; demo?: boolean };
	let shots = $state<Partial<Record<DzWhich, Shot>>>({});
	/** the photos he has just sent, shown while their links are on their way (SC-180): his facts are read again after
	 *  the send, and until then they hold the destruction as it was asked, with no photos */
	let sent = $state<Partial<Record<DzWhich, string>>>({});
	let agency = $state('');
	let cert = $state('');
	let err = $state<string | null>(null);
	let sending = $state(false);
	const cam: Partial<Record<DzWhich, HTMLInputElement>> = {};
	const pick: Partial<Record<DzWhich, HTMLInputElement>> = {};
	// the window and the two witnesses, re-filled from the agency's panel when the agency changes; an agency with no
	// panel on file leaves two to fill in
	const panel = (id: string) => {
		const p = (agencies.find((x) => x.id === id)?.witnesses ?? [])
			.slice(0, 2)
			.map((w) => ({ name: w.name, address: w.address }));
		while (p.length < 2) p.push({ name: '', address: '' });
		return p;
	};
	let win = $state({ from: '12:55', to: '13:20' });
	let wit = $state<{ name: string; address: string }[]>([]);
	$effect(() => {
		if (!agency && agencies[0]) {
			agency = agencies[0].id;
			wit = panel(agency);
		}
	});
	// the four signatures, each in its own place on the certificate; sent again after the operator asked, what was
	// signed before stands until it is cleared. A signature is its signer's: a witness renamed signs again
	let sigs = $state<Partial<Record<SignatureRole, Signature>>>({});
	let signing = $state<Signer | null>(null);
	let kept = false;
	$effect(() => {
		if (!kept && full?.signatures) {
			kept = true;
			sigs = { ...full.signatures };
		}
	});
	const unsign = (...roles: SignatureRole[]) => {
		const r = { ...sigs };
		roles.forEach((k) => delete r[k]);
		sigs = r;
	};
	const setAgency = (id: string) => {
		agency = id;
		wit = panel(id);
		unsign('officer', 'w1', 'w2');
	};
	const rename = (i: number, v: string) => {
		wit[i].name = v;
		unsign(i === 0 ? 'w1' : 'w2');
	};
	const a = $derived(agencies.find((x) => x.id === agency) ?? null);
	const due = $derived(!!d && (d.status === 'requested' || d.status === 'asked'));
	const his = $derived(d && sku ? Math.round(d.units * (sku.dp ?? 0) * sku.gst * 100) / 100 : 0);
	const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
	const timed = $derived(hhmm.test(win.from) && hhmm.test(win.to) && win.from < win.to);
	const witnessed = $derived(
		wit.length === 2 && wit.every((w) => w.name.trim().length >= 3 && w.address.trim().length >= 6)
	);
	// who signs where, and the sentence each signs to, from what he entered above
	const batch = $derived(
		n ? (ws.case?.batch.id === n.ref ? ws.case.batch : (ws.data.batches.find((b) => b.id === n.ref) ?? null)) : null
	);
	const no = $derived(cert.trim() || (a ? `${a.series.prefix}…` : ''));
	const people = $derived.by<Signer[]>(() => {
		if (!a || !d || !n) return [];
		const fac = (a.facility?.name ?? a.site ?? 'the facility').toLowerCase(),
			day = fmt.date(batch?.bestBefore ?? ''),
			how =
				a.method === 'incineration' ? 'fed whole to the incinerator' : 'slit open, emptied into the cell and covered',
			packs = `${fmt.num(d.units)} packs of batch ${n.ref}`,
			sig = dist.signatory;
		return [
			{
				role: 'officer',
				n: 1,
				label: 'Supervising officer',
				name: a.officer?.name ?? '',
				sub: `${a.officer?.title ?? ''}, ${a.name}`,
				decl: [
					'I supervised the destruction of these ',
					packs,
					` at the ${fac}, from ${win.from} to ${win.to} on ${day}: ${how}.`
				]
			},
			...wit.map((w, i) => ({
				role: (i === 0 ? 'w1' : 'w2') as SignatureRole,
				n: i + 2,
				label: `Independent witness ${i + 1}`,
				name: w.name.trim(),
				sub: w.address,
				decl: [
					'I watched these ',
					packs,
					` destroyed at the ${fac}, from ${win.from} to ${win.to} on ${day}. I do not work for ${dist.name} or ${a.name}.`
				] as [string, string, string]
			})),
			{
				role: 'handed',
				n: 4,
				label: 'Goods handed over by',
				name: sig?.name ?? dist.name,
				sub: `${sig?.title ?? ''}, ${dist.name}`,
				decl: [
					'I handed over ',
					packs,
					` from ${dist.godown} to ${a.name}, destroyed as set out on its certificate ${no}.`
				]
			}
		];
	});
	const signedOk = (p: Signer) => !!p.name && sigs[p.role]?.name === p.name;
	const nSigned = $derived(people.filter(signedOk).length);
	const next = $derived(people.find((p) => !signedOk(p)) ?? null);
	const plusMin = (t: string, m: number) => {
		const [h, mm] = t.split(':').map(Number),
			x = h * 60 + mm + m;
		return `${String(Math.floor(x / 60) % 24).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
	};
	// on the live workspace a signature carries the device's time, which backend-api reads on the journey's clock; on
	// the stub, a minute apart after the cover
	const sign = (ink: Signed) => {
		const p = signing!;
		const at = live ? new Date().toISOString() : plusMin(win.to, 2 + nSigned);
		sigs = {
			...sigs,
			[p.role]: { name: p.name, at, ...(ink.typed ? { typed: true } : { box: ink.box, strokes: ink.strokes }) }
		};
		signing = null;
	};
	const shownAt = (t: string) =>
		t.length <= 5
			? t
			: /[zZ]|[+-]\d\d:?\d\d$/.test(t)
				? new Date(t).toLocaleTimeString('en-IN', {
						hour: '2-digit',
						minute: '2-digit',
						hour12: false,
						timeZone: 'Asia/Kolkata'
					})
				: t.slice(11, 16);
	const draft = $derived(
		a && d && batch && sku
			? draftCertificate(
					{
						status: d.status,
						units: d.units,
						agency: { id: a.id, name: a.name, auth: a.auth, site: a.site },
						certificate: no,
						window: timed ? win : null,
						witnesses: wit,
						signatures: sigs
					},
					{
						batch,
						sku,
						dist,
						expiry: ws.state.hero.expiry ?? null,
						setup: ws.data.setup.destruction,
						evidence: ws.case?.story?.evidence
					}
				)
			: null
	);
	const ready = $derived(
		!!shots.before && !!shots.after && !!a && cert.trim().length >= 4 && timed && witnessed && nSigned === 4
	);
	const need = $derived(
		[
			!(shots.before && shots.after) && 'both photos',
			!(cert.trim().length >= 4) && 'the certificate number',
			!timed && 'the time',
			!witnessed && 'both witnesses',
			nSigned < 4 && `${4 - nSigned} more ${4 - nSigned === 1 ? 'signature' : 'signatures'}`
		].filter(Boolean)
	);

	const use = (id: DzWhich, f: File | undefined) => {
		if (!f) return;
		if (!PHOTO_TYPES.includes(f.type)) {
			err = 'That file is not a photo Vision can read. Send a JPEG, PNG or WebP.';
			return;
		}
		if (f.size >= PHOTO_MAX_MB * 1048576) {
			err = `That photo is ${(f.size / 1048576).toFixed(1)}\u00a0MB. Send one under ${PHOTO_MAX_MB}\u00a0MB.`;
			return;
		}
		err = null;
		shots = { ...shots, [id]: { url: URL.createObjectURL(f), file: f } };
	};
	const picked = (id: DzWhich) => (e: Event) => {
		const el = e.currentTarget as HTMLInputElement;
		const f = el.files?.[0];
		el.value = '';
		use(id, f);
	};
	// in the prototype a stand-in photo is the batch's own evidence; on the live workspace the phone's camera
	const take = (id: DzWhich) => {
		err = null;
		if (live && cam[id]) cam[id]!.click();
		else shots = { ...shots, [id]: { demo: true } };
	};
	const upload = (id: DzWhich) => {
		err = null;
		pick[id]?.click();
	};
	// the button waits on the photos and the evidence (SC-152); a refusal keeps both photos and says why under it
	const send = async () => {
		if (!ready || !n || !a) return;
		sending = true;
		try {
			await ws.act(
				'sendDestruction',
				{
					agency: a,
					certificate: cert.trim(),
					before: shots.before?.file,
					after: shots.after?.file,
					window: { ...win },
					witnesses: wit.map((w) => ({ name: w.name.trim(), address: w.address.trim() })),
					signatures: Object.fromEntries(people.map((p) => [p.role, sigs[p.role]!])) as Record<SignatureRole, Signature>
				},
				{ feel: live ? 0 : 700, ref: n.ref, inline: true }
			);
			sent = { before: shots.before?.url, after: shots.after?.url };
			shots = {};
			cert = '';
		} finally {
			sending = false;
		}
	};
	// the example in each slot: the journey's own evidence for its batch (the stub's slow chips', SC-168), else the batch's
	const example = (id: DzWhich) => (ws.case?.batch.id === n?.ref ? ws.case?.story?.evidence[id] : null);
	const shotSrc = (id: DzWhich) => {
		const s = shots[id];
		return s
			? (s.url ?? dzPhoto(null, n!.ref, id, false, example(id)))
			: live
				? undefined
				: dzPhoto(null, n!.ref, id, false, example(id));
	};
	const say = $derived(d ? SAY[d.status] : undefined);
</script>

{#snippet place(k: string, w: { name: string; sign?: string | null; ink?: InkT | null } | null | undefined)}{@const p =
		people.find((x) => x.role === k)}{#if p}{#if w?.ink}<span class="dz-signed"
				><Ink who={w} seal={k === 'officer' ? draft?.seal : null} h={k === 'handed' ? 34 : 40} /><span class="cert-when"
					>{w.ink.typed ? 'typed' : 'signed'} here {shownAt(w.ink.at)}</span
				><button
					type="button"
					class="dz-unsign"
					onclick={() => unsign(k as SignatureRole)}
					aria-label={`Clear ${whose(p.name)} signature`}>Clear</button
				></span
			>{:else}<button type="button" class="dz-here" onclick={() => (signing = p)} disabled={!p.name}
				><span class="dz-here-n" aria-hidden="true">{p.n}</span>Sign here<span class="sr-only"
					>: {p.name}, {p.label}</span
				></button
			>{/if}{/if}{/snippet}

{#snippet badge()}<Badge
		size="sm"
		tone={due ? 'amber' : d?.status === 'approved' ? 'green' : 'blue'}
		dot={d?.status !== 'approved'}>{due ? 'for you' : d?.status === 'approved' ? 'approved' : 'sent'}</Badge
	>{/snippet}

{#if !n || !d || !sku}<Screen {me} title="Destroy expired packs" sub="Requests from the client" back="Today"
		><Card style="max-width: 560px; margin: 0 auto; width: 100%"
			><Empty
				img="godown"
				title="No destruction asked for now"
				body={`When packs expire at your godown and no channel took them, ${C} asks here for the evidence of their destruction.`}
			/></Card
		></Screen
	>{:else}<Screen {me} title="Destroy expired packs" sub={`Batch ${n.ref} · ${dist.godown}`} back="Today">
		<div class="stack" style="gap: 16px; max-width: 760px; margin: 0 auto; width: 100%">
			<DistBatchLine {sku} id={n.ref} {badge} sub={`${fmt.num(d.units)} packs expired at ${dist.godown}`} />
			{#if d.status === 'asked'}<p class="cam-alert" role="alert">
					<Icon name="rotate-ccw" size={15} />{op?.short ?? C} asked again: {d.reason}
				</p>{/if}
			{#if due}<Card class="stack snug">
					<span class="t-subhead"
						>Destroy the {fmt.num(d.units)} packs through an authorised agency, then send the two photos and the agency's
						certificate, signed. {op?.short ?? C} at {C} approves, and {C} credits you the dealer price, the GST you reverse
						and the agency's charges.</span
					>
					<div class="dz-two">
						{#each SLOTS as sl (sl.id)}{@const shot = shots[sl.id]}{@const src = shotSrc(sl.id)}
							<div class="stack tight dz-slot">
								<div class="cam dz-cam">
									{#if src}<Photo
											class="cam-feed whole"
											{src}
											alt={shot ? sl.alt : ''}
											aria-hidden={shot ? undefined : 'true'}
											opacity={shot ? 1 : 0.55}
										/>{/if}
									{#if !shot}<div class="cam-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
										<span class="cam-tag">Example</span>{:else}<span class="cam-tag">{sl.n} · {sl.title}</span>{/if}
									<div class="cam-hint">{sl.hint}</div>
								</div>
								{#if !sending}<div class="cam-two">
										<Button
											size="sm"
											variant={shot ? 'ghost' : 'secondary'}
											icon={shot ? 'rotate-ccw' : 'camera'}
											aria-label={`${shot ? 'Retake' : 'Take'} the ${sl.id} photo`}
											onclick={() => take(sl.id)}>{shot ? 'Retake' : 'Take'}</Button
										><Button
											size="sm"
											variant="ghost"
											icon="upload"
											aria-label={`Upload the ${sl.id} photo`}
											onclick={() => upload(sl.id)}>Upload</Button
										>
									</div>{/if}
								<input
									bind:this={cam[sl.id]}
									type="file"
									accept={PHOTO_TYPES.join(',')}
									capture="environment"
									onchange={picked(sl.id)}
									class="sr-only"
									tabindex={-1}
									aria-hidden="true"
								/><input
									bind:this={pick[sl.id]}
									type="file"
									accept={PHOTO_TYPES.join(',')}
									onchange={picked(sl.id)}
									class="sr-only"
									tabindex={-1}
									aria-hidden="true"
								/>
							</div>{/each}
					</div>
					<div class="dz-fields">
						<Field
							label="Agency"
							htmlFor="dz-agency"
							help={a
								? `Authorisation ${a.auth}${a.facility ? ` · ${a.facility.name}` : ''}${a.officer ? ` · supervising officer ${a.officer.name}` : ''}`
								: undefined}
							><Select
								id="dz-agency"
								value={agency}
								onchange={(e: Event) => setAgency((e.currentTarget as HTMLSelectElement).value)}
								>{#each agencies as x (x.id)}<option value={x.id}>{x.name}</option>{/each}</Select
							></Field
						>
						<Field label="Agency's certificate number" htmlFor="dz-cert"
							><Input
								id="dz-cert"
								bind:value={cert}
								placeholder={a ? `${a.series.prefix}0000` : ''}
								spellcheck={false}
								autocapitalize="characters"
							/></Field
						>
					</div>
					<div class="dz-fields">
						<Field label="Destroyed from" htmlFor="dz-from" help="The time the agency began, as its certificate says"
							><Input id="dz-from" type="time" bind:value={win.from} /></Field
						>
						<Field label="To" htmlFor="dz-to" help="When the cover was done: the after photo's time"
							><Input id="dz-to" type="time" bind:value={win.to} /></Field
						>
					</div>
					<span class="t-headline" style="margin-top: 6px">Two independent witnesses</span>
					<span class="t-footnote muted"
						>People who watched the destruction and are not your staff: a neighbouring trader, a resident. They sign the
						agency's certificate with its officer.</span
					>
					{#each wit as w, i (i)}<div class="dz-fields">
							<Field label={`Witness ${i + 1} · name`} htmlFor={`dz-w${i}`}
								><Input
									id={`dz-w${i}`}
									value={w.name}
									oninput={(e: Event) => rename(i, (e.currentTarget as HTMLInputElement).value)}
									autocomplete="off"
								/></Field
							><Field label="Address" htmlFor={`dz-w${i}a`}
								><Input id={`dz-w${i}a`} bind:value={w.address} autocomplete="off" /></Field
							>
						</div>{/each}
					{#if draft && a}<span class="t-headline" style="margin-top: 6px">Sign the certificate</span>
						<span class="t-footnote muted"
							>{whose(a.name)} certificate {no}, laid out from what you entered above. Once the cover is done, hand the
							device to each of them in turn: each signs in their own place, as on paper. {op?.short ?? C} reviews this page
							as signed.</span
						>
						<div class="dz-progress" role="status">
							<span class="dz-bar" aria-hidden="true"><i style="transform: scaleX({nSigned / 4})"></i></span><b
								>{nSigned} of 4 signed</b
							>{#if next}<span class="muted">· next: {next.name || next.label}</span>{/if}
						</div>
						<div class="dz-paper">
							<Certificate
								d={draft}
								c={{ dist, sku, batch: batch! }}
								draft={{ stamp: 'TO SIGN', place, approver: op?.name ?? C }}
							/>
						</div>{/if}
					{#if err}<p class="cam-alert" role="alert"><Icon name="triangle-alert" size={15} />{err}</p>{/if}
					<Button
						variant="primary"
						size="lg"
						block
						icon="send"
						disabled={!ready}
						aria-describedby="dz-need"
						action={send}
						busy="Sending the evidence…"
						done="Sent for approval">Send to {C} for approval</Button
					>
					<span id="dz-need" class="t-caption subtle"
						>{ready
							? `Then reverse ${fmt.inr2(his)} of input GST on these packs in your GSTR-3B (Table 4(B)(1)). ${whose(C)} credit note makes it good.`
							: `Still needed: ${need.join(', ')}. ${RULE}.`}</span
					>
				</Card>{:else if say}<Card class="stack snug">
					<div class="row" style="gap: 12px">
						<Aura on={d.status === 'reading'} class="icontile" style="border-radius: 12px; width: 40px; height: 40px"
							><Icon name={say[0]} size={19} /></Aura
						>
						<div class="grow">
							<b>{say[1]}</b>
							<div class="t-footnote muted">
								{d.status === 'checked' ? `${op?.short ?? C} at ${C} ${say[2]}` : say[2]}
							</div>
						</div>
					</div>
					<div class="dz-two dz-pair">
						{#each SLOTS as sl (sl.id)}{@const src = dzPhoto(full, n.ref, sl.id, live) ?? sent[sl.id]}
							<div class="cam dz-cam">
								{#if src}<Photo class="cam-feed whole" {src} alt={sl.alt} />{/if}<span class="cam-tag"
									>{sl.n} · {sl.title}</span
								>
							</div>{/each}
					</div>
					{#if d.status === 'reading'}<span class="sr-only" role="status">Vision is checking your photos</span>{/if}
					<Button
						variant="secondary"
						block
						onclick={() => (d.status === 'approved' ? router.go('batches', { ref: n.ref }) : router.go('home'))}
						>{d.status === 'approved' ? "Open the batch's papers" : 'Back to today'}</Button
					>
				</Card>{/if}
		</div>
		<SignSheet who={signing} onclose={() => (signing = null)} onsign={sign} />
	</Screen>{/if}
