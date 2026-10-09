<script lang="ts">
	import Badge from '../../../components/Badge.svelte';
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import Product from '../../../components/Product.svelte';
	import Skeleton from '../../../components/Skeleton.svelte';
	import SectionTitle from '../../../patterns/SectionTitle.svelte';
	import { fmt } from '../../../format';
	import { useRoute } from '../../context';
	import { photoOf, type DistPhoto } from '../../dist';
	import { distPast } from '../../partners';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import Screen from '../common/Screen.svelte';
	import CameraInner from './CameraInner.svelte';
	import { distJourneysOf, distOfMe, when } from './pt';

	// his Label photo (SC-133, screens/trade.jsx CameraScreen): the photo Vision asks for now (SC-80's camera, on the
	// batch in focus), then every photo he sent and what Vision read from it, the batches in a journey and those he
	// cleared. A request on another batch puts that batch in focus first (the address names it)
	let { me, realCamera }: { me: User; realCamera?: boolean } = $props();
	const ws = useWorkspace();
	const router = useRoute();
	const dist = $derived(distOfMe(ws, me));
	const nows = $derived(distJourneysOf(ws, dist.id).map((x) => x.n));
	const ref = $derived(router.route.params?.ref ?? null);
	// the photo asked for now (or just sent, until the plan has its yes)
	const asking = $derived(
		nows.filter((n) => n.photo === 'requested' || n.photo === 'reading' || (n.photo === 'verified' && !n.approved))
	);
	const cur = $derived(
		asking.find((n) => n.ref === ref) ?? asking.find((n) => n.from === 'focus') ?? asking[0] ?? null
	);
	const reading = $derived(!!cur && cur.from !== 'focus');
	$effect(() => {
		if (cur && reading && !ref) router.go('photo', { ref: cur.ref });
	});
	// every photo he sent: from the batch's facts, else (the stub's batch in focus) from the journey's state
	const earlier = $derived.by((): DistPhoto[] => {
		const cases = ws.partners?.cases ?? [];
		const out: DistPhoto[] = [];
		const c = ws.case;
		for (const n of nows) {
			if (n.ref === cur?.ref) continue;
			const facts = cases.find((x) => x.ref === n.ref);
			const p = facts ? photoOf(facts, ws.data) : null;
			if (p) out.push(p);
			else if (n.from === 'focus' && c && ws.state.hero.photo.at && /^\d\d:\d\d$/.test(ws.state.hero.photo.at))
				out.push({
					ref: n.ref,
					sku: c.sku,
					sent: `${ws.data.day0}T${ws.state.hero.photo.at}`,
					read: null,
					bestBefore: c.batch.bestBefore,
					mfg: c.batch.mfg,
					mrp: c.sku.mrp
				});
		}
		for (const pc of distPast(cases, dist.id))
			if (!nows.some((n) => n.ref === pc.ref)) {
				const p = photoOf(pc, ws.data);
				if (p) out.push(p);
			}
		return out;
	});
</script>

<Screen
	{me}
	title="Label photo"
	sub={cur ? `Batch ${cur.ref}${cur.shelf ? ` · shelf ${cur.shelf}` : ''}` : 'Requests from the Vision agent'}
	back="Today"
>
	<div class="stack" style="gap: 24px">
		{#if cur && !reading}<CameraInner {me} {realCamera} />{:else if cur}<Card
				class="stack snug"
				style="max-width: 560px; margin: 0 auto; width: 100%"
				><Skeleton h={320} /><span class="sr-only">Reading the batch</span></Card
			>{:else}<Card style="max-width: 560px; margin: 0 auto; width: 100%"
				><Empty
					img="phone-scan"
					title="No label photo asked for now"
					body="When a batch needs checking, Vision asks here for one picture of a carton label."
				/></Card
			>{/if}
		{#if earlier.length}<section
				class="stack snug"
				aria-label="Earlier label photos"
				style="max-width: 720px; margin: 0 auto; width: 100%"
			>
				<SectionTitle sub="Every label photo you sent, and what Vision read from it">Earlier label photos</SectionTitle>
				<div class="list">
					{#each earlier as r (r.ref)}<div class="list-row dist-photo">
							<Product name={r.sku.img} size={40} alt="" />
							<span class="stack tight" style="gap: 1px; min-width: 0"
								><b class="t-subhead">{r.sku.name} <span class="mono subtle">{r.ref}</span></b>
								<span class="t-footnote muted"
									>Vision read batch {r.ref}{r.mfg ? `, made ${fmt.date(r.mfg)}` : ''}, best before {fmt.date(
										r.bestBefore
									)}, MRP {fmt.rate(r.mrp)}</span
								>
								<span class="t-caption subtle">Sent {when(r.sent)}</span></span
							>
							<Badge size="sm" tone="green" icon="check">verified</Badge>
						</div>{/each}
				</div>
			</section>{/if}
	</div>
</Screen>
