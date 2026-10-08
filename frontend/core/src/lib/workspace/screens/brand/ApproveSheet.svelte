<script lang="ts">
	import { untrack } from 'svelte';
	import Button from '../../../components/Button.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Money from '../../../components/Money.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import type { IconName } from '../../../icons/registry';
	import { prefersReducedMotion } from '../../../motion';
	import { curveFrames } from '../../../motion/frames';
	import { useRoute } from '../../context';
	import { useLive } from '../../live.svelte';
	import { castOf, fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import ApproveFailed from '../live/ApproveFailed.svelte';
	import NeedsNet from '../live/NeedsNet.svelte';

	// the one yes: what the plan recovers and what happens the moment it is tapped; then the tick, the swing rolling in
	// and the agents released (screens/brand.jsx ApproveSheet). On the live workspace (SC-73, SC-68 option B) an approval
	// that does not go through is said here, in the backend's words, with an amber Retry; offline, it waits for a connection
	type Props = { open?: boolean; onclose?: () => void; me?: User | null };
	let { open = $bindable(false), onclose, me }: Props = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const router = useRoute();
	let busy = $state(false);
	let placed = $state(false);
	const approvedNow = $derived(!!(ws.state.hero.plan && ws.state.hero.plan.status === 'approved'));
	const cast = $derived(castOf(ws.state, c));
	const es = $derived(c.lines.expiresoon);
	const kl = $derived(c.lines.kirana);

	// opening shows the plan as it stands; an approval made elsewhere while it is open places it (not this sheet's own
	// while it is on its way: the live workspace shows it at once, and puts it back if it is refused)
	$effect(() => {
		if (open) placed = untrack(() => approvedNow);
	});
	$effect(() => {
		if (approvedNow && untrack(() => open && !busy)) placed = true;
	});

	const close = () => {
		open = false;
		onclose?.();
	};
	const live = useLive();
	const offline = $derived(!!live?.on && live.offline);
	const failed = $derived(ws.failed?.action === 'approve' ? ws.failed : null);
	const approve = () => {
		busy = true;
		void ws.act('approve', me?.id, { feel: 650 }).then(() => {
			busy = false;
			// the live source says when it did not go through; then the plan still waits
			if (ws.failed?.action !== 'approve') placed = true;
		});
	};
	const retry = () => {
		const f = failed;
		if (!f) return approve();
		busy = true;
		void f.retry().then(() => {
			busy = false;
			if (ws.failed?.action !== 'approve') placed = true;
		});
	};

	// the tick draws itself: the ring, then the check
	const draw = (delay: number, duration: number, bezier: [number, number, number, number]) => (el: SVGElement) => {
		if (prefersReducedMotion.current) return;
		const a = el.animate(
			curveFrames(bezier, (v) => ({ strokeDashoffset: 1 - v })),
			{ duration, delay, fill: 'backwards' }
		);
		return () => a.cancel();
	};

	// what the tap sets going, one step for each line of the plan (SC-85)
	const line = (id: string) => c.plan.lines.find((l) => l.id === id && l.units > 0);
	const STEPS: [IconName, string][] = $derived(
		[
			line('expiresoon') && [
				'shopping-bag',
				`Lister posts ${es.units} units on ExpireSoon at ₹${es.price} in ${c.dist.name}' name, with the label photo and dates; reserve ${fmt.rate(ws.data.rules.negotiation.reservePerUnit)}, hidden from buyers inside ${ws.data.workspace.short}'s territories.`
			],
			line('kirana') && [
				'send',
				`Outreach pushes the Hindi scheme to ${c.dist.kiranas} kiranas: ${kl.units} units at ${fmt.rate(kl.packPrice ?? 0)} a pack, ${c.scheme.free} free with every ${c.scheme.buy}, for ${ws.state.rules.offerWindowHours} hours.`
			],
			line('staff') && [
				'users',
				`${c.dist.short} runs the staff sale at ${c.dist.godown}: ${line('staff')!.units} units at ₹${line('staff')!.price}, and records what sold.`
			],
			line('foodbank') && [
				'heart-handshake',
				`The Donation agent books a food bank for the last ${line('foodbank')!.units} units, with the FSSAI checklist.`
			],
			['smartphone', `${cast.distributor.short} gets the same plan in his app and can pause it.`],
			[
				'shield-check',
				'Nothing is listed, messaged or shipped before this tap. The approval is logged with who, when and device.'
			]
		].filter((x): x is [IconName, string] => !!x)
	);
</script>

{#snippet footer()}{#if placed}<Button
			variant="primary"
			size="lg"
			block
			iconRight="arrow-right"
			onclick={() => {
				close();
				router.go('execution');
			}}>Watch execution</Button
		>{:else}{#if failed && !busy}<ApproveFailed message={failed.message} />{/if}{#if offline}<Button
				variant="approve"
				size="lg"
				block
				icon="check"
				aria-disabled="true"
				aria-describedby="lv-sheet-net"
				class="lv-blocked">Approve · release the agents</Button
			><span style="justify-self: center"><NeedsNet id="lv-sheet-net" /></span>{:else if failed}<Button
				variant="approve"
				size="lg"
				block
				icon="refresh-cw"
				loading={busy}
				onclick={retry}>Retry · release the agents</Button
			>{:else}<Button variant="approve" size="lg" block icon="check" loading={busy} onclick={approve}
				>Approve · release the agents</Button
			>{/if}<Button variant="ghost" block onclick={close}>Not now</Button>{/if}{/snippet}

<Sheet bind:open {onclose} title={placed ? 'Plan placed' : 'Approve the plan'} {footer}>
	{#if placed}
		<div class="stack" style="justify-items: center; text-align: center; padding: 12px 0 8px">
			<svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true"
				><circle
					cx="48"
					cy="48"
					r="42"
					fill="none"
					stroke="var(--primary)"
					stroke-width="6"
					pathLength="1"
					stroke-dasharray="1 1"
					{@attach draw(0, 600, [0.65, 0, 0.35, 1])}
				/><path
					d="M30 49 L43 62 L67 36"
					fill="none"
					stroke="var(--primary)"
					stroke-width="7"
					stroke-linecap="round"
					stroke-linejoin="round"
					pathLength="1"
					stroke-dasharray="1 1"
					{@attach draw(450, 400, [0.42, 0, 0.58, 1])}
				/></svg
			>
			<div class="t-title2">Approved · {ws.state.hero.plan?.at}</div>
			<div class="stack tight" style="justify-items: center">
				<Money value={c.plan.swing} size="l" roll from={0} style="color: var(--primary-text)" /><span class="muted"
					>better than the bin, on one batch of chips</span
				>
			</div>
			<p class="t-subhead muted" style="max-width: 40ch">
				The Lister is posting on ExpireSoon in {c.dist.name}' name and Outreach is messaging {c.offered} kiranas now.
				{cast.distributor.short} has the plan in his app. The approval is logged with who, when and device.
			</p>
		</div>
	{:else}
		<div class="stack">
			<div class="stack tight">
				<Money value={c.plan.net} size="l" style="color: var(--primary-text)" /><span class="muted"
					>net recovered, {c.plan.pctMRP}% of MRP</span
				>
			</div>
			<List
				><ListRow icon="trending-up" title="Instead of destroying" value={fmt.inr(-c.plan.writeOff.total)} /><ListRow
					icon="scale"
					iconTone="blue"
					title="Swing on this batch"
					value={fmt.inr(c.plan.swing)}
				/><ListRow
					icon="badge-check"
					iconTone="gray"
					title="GST input credit retained"
					value={fmt.inr(c.plan.itcRetained)}
				/></List
			>
			<div class="stack tight">
				<b class="t-subhead">What happens the moment you tap</b>
				{#each STEPS as [ic, t] (ic)}<div class="row top t-subhead" style="gap: 10px">
						<Icon name={ic} size={18} style="margin-top: 2px; color: var(--fg-3)" /><span>{t}</span>
					</div>{/each}
			</div>
		</div>
	{/if}
</Sheet>
