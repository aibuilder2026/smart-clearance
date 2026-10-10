<script lang="ts">
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
	import type { DestructionStatus, User } from '../../types';
	import { dzPhoto, type DzWhich } from '../brand/destruction';
	import Screen from '../common/Screen.svelte';
	import DistBatchLine from './DistBatchLine.svelte';
	import { distJourneysOf, distOfMe } from './pt';

	// destroying the packs left at his godown on expiry day (SC-139, option B; screens/trade.jsx DestroyScreen): through
	// an authorised agency, with two photos (before, at the godown with the batch label in view; after, at the landfill
	// with the slate), the agency and its certificate number. Vision checks them, the client's operator gives the second
	// yes, and the credit note and the certificate follow. A request on another batch acts on that batch (the address)
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
	let agency = $state('');
	let cert = $state('');
	let err = $state<string | null>(null);
	let sending = $state(false);
	const cam: Partial<Record<DzWhich, HTMLInputElement>> = {};
	const pick: Partial<Record<DzWhich, HTMLInputElement>> = {};
	$effect(() => {
		if (!agency && agencies[0]) agency = agencies[0].id;
	});
	const a = $derived(agencies.find((x) => x.id === agency) ?? null);
	const due = $derived(!!d && (d.status === 'requested' || d.status === 'asked'));
	const his = $derived(d && sku ? Math.round(d.units * (sku.dp ?? 0) * sku.gst * 100) / 100 : 0);
	const ready = $derived(!!shots.before && !!shots.after && !!a && cert.trim().length >= 4);

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
	const send = async () => {
		if (!ready || !n || !a) return;
		sending = true;
		try {
			await ws.act(
				'sendDestruction',
				{ agency: a, certificate: cert.trim(), before: shots.before?.file, after: shots.after?.file },
				{ feel: live ? 0 : 700, ref: n.ref }
			);
			shots = {};
			cert = '';
		} finally {
			sending = false;
		}
	};
	const shotSrc = (id: DzWhich) => {
		const s = shots[id];
		return s ? (s.url ?? dzPhoto(null, n!.ref, id, false)) : live ? undefined : dzPhoto(null, n!.ref, id, false);
	};
	const say = $derived(d ? SAY[d.status] : undefined);
</script>

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
		<div class="stack" style="gap: 16px; max-width: 640px; margin: 0 auto; width: 100%">
			<DistBatchLine {sku} id={n.ref} {badge} sub={`${fmt.num(d.units)} packs expired at ${dist.godown}`} />
			{#if d.status === 'asked'}<p class="cam-alert" role="alert">
					<Icon name="rotate-ccw" size={15} />{op?.short ?? C} asked again: {d.reason}
				</p>{/if}
			{#if due}<Card class="stack snug">
					<span class="t-subhead"
						>Destroy the {fmt.num(d.units)} packs through an authorised agency, then send the two photos and the agency's
						certificate number. {op?.short ?? C} at {C} approves, and {C} credits you the dealer price, the GST you reverse
						and the agency's charges.</span
					>
					<div class="dz-two">
						{#each SLOTS as sl (sl.id)}{@const shot = shots[sl.id]}{@const src = shotSrc(sl.id)}
							<div class="stack tight dz-slot">
								<div class="cam dz-cam">
									{#if src}<img
											class="cam-feed whole"
											{src}
											alt={shot ? sl.alt : ''}
											aria-hidden={shot ? undefined : 'true'}
											style={shot ? undefined : 'opacity: 0.55'}
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
						<Field label="Agency" htmlFor="dz-agency" help={a ? `Authorisation ${a.auth}` : undefined}
							><Select id="dz-agency" bind:value={agency}
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
					{#if err}<p class="cam-alert" role="alert"><Icon name="triangle-alert" size={15} />{err}</p>{/if}
					<Button
						variant="primary"
						size="lg"
						block
						icon="send"
						loading={sending}
						disabled={!ready}
						aria-describedby="dz-need"
						onclick={send}>Send to {C} for approval</Button
					>
					<span id="dz-need" class="t-caption subtle"
						>{ready
							? `Then reverse ${fmt.inr2(his)} of input GST on these packs in your GSTR-3B (Table 4(B)(1)). ${whose(C)} credit note makes it good.`
							: `Both photos and the certificate number are needed. ${RULE}.`}</span
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
						{#each SLOTS as sl (sl.id)}{@const src = dzPhoto(full, n.ref, sl.id, live)}
							<div class="cam dz-cam">
								{#if src}<img class="cam-feed whole" {src} alt={sl.alt} />{/if}<span class="cam-tag"
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
	</Screen>{/if}
