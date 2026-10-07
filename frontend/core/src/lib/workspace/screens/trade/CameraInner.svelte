<script lang="ts">
	import Aura from '../../../components/Aura.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { prefersReducedMotion } from '../../../motion';
	import { fade } from '../../../motion/transitions';
	import { useRoute } from '../../context';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import LabelShot from '../brand/LabelShot.svelte';
	import Screen from '../common/Screen.svelte';

	// the camera: frame one carton label, shoot (or pick from the gallery), send; then Vision reads batch, dates and MRP.
	// With a real camera, the shutter opens the phone's own camera
	let { me, realCamera }: { me: User; realCamera?: boolean } = $props();
	const ws = useWorkspace();
	const { go } = useRoute();
	const h = $derived(ws.state.hero);
	const verified = $derived(h.photo.status === 'verified');
	const sent = $derived(h.photo.status === 'reading' || verified);
	let file: HTMLInputElement | null = $state(null);
	let shot: string | null = $state(null);
	let flash = $state(false);
	let sending = $state(false);

	const take = () => {
		if (realCamera && file && window.matchMedia('(pointer: coarse)').matches) {
			file.click();
			return;
		}
		flash = true;
		setTimeout(
			() => {
				flash = false;
				shot = 'demo';
			},
			prefersReducedMotion.current ? 0 : 180
		);
	};
	const picked = (e: Event) => {
		const f = (e.currentTarget as HTMLInputElement).files?.[0];
		if (f) shot = URL.createObjectURL(f);
	};
	const send = () => {
		sending = true;
		void ws.act('sendPhoto', undefined, { feel: 700 }).then(() => (sending = false));
	};
	// the scan line sweeps the label three times while Vision reads it, then rests
	const scan = (el: HTMLElement) => {
		const a = el.animate(
			[{ top: '20%', easing: 'ease-in-out' }, { top: '76%', easing: 'ease-in-out' }, { top: '20%' }],
			{ duration: 1600, iterations: 3, fill: 'forwards' }
		);
		return { destroy: () => a.cancel() };
	};
	const record: [string, string][] = [
		['Batch', 'MF-2409-117'],
		['Best before', '18 Nov 2026'],
		['MRP', '₹30.00']
	];
</script>

<Screen {me} title="Label photo" sub="Batch MF-2409-117 · shelf B4" back="Today">
	<div class="stack" style="gap: 16px; max-width: 560px; margin: 0 auto; width: 100%">
		<div class="cam">
			{#if shot && shot !== 'demo'}
				<!-- svelte-ignore a11y_img_redundant_alt (it is the person's own photo, and says so) -->
				<img class="cam-feed" src={shot} alt="Your photo of the carton label" />
			{:else}<LabelShot cover dim={!shot && !sent} />{/if}
			{#if !shot && !sent}<div class="cam-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
				<div class="cam-hint">Fit one carton label in the frame</div>{/if}
			{#if sent}<div class="cam-hint" style="background: var(--green-700)">
					<Icon name={verified ? 'check' : 'loader'} size={14} class={verified ? '' : 'spin'} />
					{verified ? 'Verified · matches your records' : 'Sent · Vision is reading the label'}
				</div>{/if}
			{#if flash}<div class="cam-flash" transition:fade></div>{/if}
			{#if h.photo.status === 'reading' && !prefersReducedMotion.current}<div
					aria-hidden="true"
					class="cam-scan"
					use:scan
				></div>{/if}
		</div>
		{#if sent}<Card class="stack snug">
				<div class="row" style="gap: 12px">
					<Aura
						on={h.photo.status === 'reading'}
						class="icontile"
						style="border-radius: 12px; width: 40px; height: 40px"
						><Icon name={verified ? 'badge-check' : 'scan-line'} size={19} /></Aura
					>
					<div class="grow">
						<b>{verified ? 'Done. Dhanyavaad, Rakesh bhai.' : 'Reading batch, dates and MRP'}</b>
						<div class="t-footnote muted">
							{verified ? 'The plan for this batch will reach Priya in a few minutes.' : 'This takes a few seconds.'}
						</div>
					</div>
				</div>
				{#if verified}<List
						>{#each record as [k, v] (k)}<ListRow title={k} value={v} />{/each}</List
					>{/if}
				<Button variant="secondary" block onclick={() => go('home')}>Back to today</Button>
			</Card>{:else if shot}<div class="row" style="gap: 10px">
				<Button variant="secondary" size="lg" icon="rotate-ccw" onclick={() => (shot = null)}>Retake</Button><Button
					variant="primary"
					size="lg"
					block
					icon="send"
					loading={sending}
					onclick={send}>Send photo</Button
				>
			</div>{:else}<div class="cam-bar">
				<label class="iconbtn round" aria-label="Choose a photo from the gallery" style="cursor: pointer"
					><Icon name="image" size={22} /><input
						type="file"
						accept="image/*"
						onchange={picked}
						class="sr-only"
					/></label
				><button type="button" class="shutter" aria-label="Take the photo" onclick={take}><span></span></button><span
					style="width: 44px"
				></span><input
					bind:this={file}
					type="file"
					accept="image/*"
					capture="environment"
					onchange={picked}
					class="sr-only"
					tabindex={-1}
					aria-hidden="true"
				/>
			</div>{/if}
		{#if realCamera}<p class="t-caption subtle" style="text-align: center; margin: 0">
				On a phone the shutter opens your camera. In this prototype a stub stands in for Gemini vision and returns the
				batch record.
			</p>{/if}
	</div>
</Screen>
