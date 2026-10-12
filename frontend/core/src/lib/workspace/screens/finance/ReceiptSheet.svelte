<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Button from '../../../components/Button.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import { cx } from '../../../cx';
	import { fmt } from '../../model';
	import type { StaffReceipt } from '../../types';
	import Photo from '../common/Photo.svelte';

	// the staff sale's receipt opened whole (SC-194; screens/finance.jsx ReceiptSheet): fitted to the sheet, then at full
	// size to read its rows, by a tap on it or the button; at full size it scrolls both ways
	let { open = $bindable(false), r, src }: { open?: boolean; r: StaffReceipt; src: string } = $props();
	const app = useApp();
	let zoom = $state(false);
</script>

<Sheet
	bind:open
	onclose={() => (zoom = false)}
	title="Receipt {r.no}"
	side={app.bp === 'phone' ? 'bottom' : 'center'}
	detent="large"
	><div class="stack">
		<div class={cx('rcpt-big', zoom && 'zoomed')}>
			<button
				type="button"
				aria-pressed={zoom}
				aria-label={zoom ? 'Fit the receipt to the sheet' : 'Zoom in on the receipt'}
				onclick={() => (zoom = !zoom)}><Photo {src} alt="The consolidated receipt {r.no}" /></button
			>
		</div>
		<div class="row tight wrap" style="justify-content: space-between">
			<span class="t-footnote subtle">{r.payments.length} UPI payments · {fmt.inr2(r.paid)}</span>
			<Button size="sm" variant="secondary" icon={zoom ? 'zoom-out' : 'zoom-in'} onclick={() => (zoom = !zoom)}
				>{zoom ? 'Fit to the sheet' : 'Zoom in'}</Button
			>
		</div>
	</div></Sheet
>
