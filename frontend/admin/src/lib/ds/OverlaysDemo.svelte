<script lang="ts">
	import { Button, List, ListRow, Menu, Money, Sheet, fmt } from '@smart-clearance/core';
	import ds from '#lib/seed/ds.json';
	import Later from './Later.svelte';
	import Spec from './Spec.svelte';

	let sheet: 'auto' | 'center' | null = $state(null);
	let open = $state(false);
	let menu = $state(false);
	const F = ds.figures;
	const show = (s: 'auto' | 'center') => {
		sheet = s;
		open = true;
	};
</script>

<Spec
	label="Sheets rise from the bottom on phones with medium and large detents, and float in from the side on larger screens"
>
	<div class="ds-row">
		<Button variant="approve" icon="check" onclick={() => show('auto')}>Open the approve sheet</Button><Button
			onclick={() => show('center')}>Centred sheet</Button
		><span style="position: relative"
			><Menu
				bind:open={menu}
				align="left"
				items={[
					{ label: 'MF-2409-117', heading: true },
					{ label: 'Open the batch', icon: 'external-link' },
					{ label: 'Ask for a label photo', icon: 'camera' },
					'-',
					{ label: 'Write off', icon: 'trash-2', danger: true }
				]}
			>
				{#snippet trigger(props)}<Button {...props} icon="ellipsis">Menu</Button>{/snippet}
			</Menu></span
		>
	</div>
	<Sheet bind:open side={sheet === 'center' ? 'center' : undefined} detent="medium" title="Approve the plan">
		{#snippet footer()}<Button variant="approve" size="lg" block icon="check" onclick={() => (open = false)}
				>Approve · release the agents</Button
			>{/snippet}
		<div class="stack">
			<div class="row base wrap" style="gap: 16px">
				<Money value={F.planNet} size="l" style="color: var(--primary-text)" /><span class="muted">net recovered</span>
			</div>
			<List
				><ListRow icon="trending-up" title="Swing against the write-off" value={fmt.inr(F.planSwing)} /><ListRow
					icon="badge-check"
					iconTone="blue"
					title="GST input credit retained"
					value={fmt.inr(F.itcRetained)}
				/></List
			>
			<p class="t-footnote muted">
				Nothing is listed, messaged or shipped before this tap. Drag the grabber to change the sheet's height on a
				phone.
			</p>
		</div>
	</Sheet>
</Spec>
<Later names={['Alert', 'NoticeHost']} what="alerts, pushes and toasts" />
