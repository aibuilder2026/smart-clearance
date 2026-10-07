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
	import { fmt } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';

	// the one yes: what the plan recovers and what happens the moment it is tapped; then the tick, the swing rolling in
	// and the agents released (screens/brand.jsx ApproveSheet)
	type Props = { open?: boolean; onclose?: () => void; me?: User | null };
	let { open = $bindable(false), onclose, me }: Props = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const router = useRoute();
	let busy = $state(false);
	let placed = $state(false);
	const approvedNow = $derived(!!(ws.state.hero.plan && ws.state.hero.plan.status === 'approved'));

	// opening shows the plan as it stands; an approval made elsewhere while it is open places it
	$effect(() => {
		if (open) placed = untrack(() => approvedNow);
	});
	$effect(() => {
		if (approvedNow && untrack(() => open)) placed = true;
	});

	const close = () => {
		open = false;
		onclose?.();
	};
	const approve = () => {
		busy = true;
		void ws.act('approve', me?.id, { feel: 650 }).then(() => {
			busy = false;
			placed = true;
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

	const STEPS: [IconName, string][] = $derived([
		[
			'shopping-bag',
			`Lister posts ${c.lines.expiresoon.units} units on ExpireSoon at ₹15 in Rakesh Traders' name, with the label photo and dates; reserve ₹13.50, hidden from buyers inside Munchly's territories.`
		],
		[
			'send',
			`Outreach pushes the Hindi scheme to ${c.offered} kiranas: ${c.lines.kirana.units} units at ₹${c.lines.kirana.packPrice!.toFixed(2)} a pack, 2 free with every 10, for 48 hours.`
		],
		['smartphone', 'Rakesh bhai gets the same plan in his app and can pause it.'],
		[
			'shield-check',
			'Nothing is listed, messaged or shipped before this tap. The approval is logged with who, when and device.'
		]
	]);
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
		>{:else}<Button variant="approve" size="lg" block icon="check" loading={busy} onclick={approve}
			>Approve · release the agents</Button
		><Button variant="ghost" block onclick={close}>Not now</Button>{/if}{/snippet}

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
			<div class="t-title2">Approved · 09:40</div>
			<div class="stack tight" style="justify-items: center">
				<Money value={c.plan.swing} size="l" roll from={0} style="color: var(--primary-text)" /><span class="muted"
					>better than the bin, on one batch of chips</span
				>
			</div>
			<p class="t-subhead muted" style="max-width: 40ch">
				The Lister is posting on ExpireSoon in Rakesh Traders' name and Outreach is messaging {c.offered} kiranas now. Rakesh
				bhai has the plan in his app. The approval is logged with who, when and device.
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
