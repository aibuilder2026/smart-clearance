<script lang="ts">
	import { onDestroy } from 'svelte';
	import { useApp } from '../../../app.svelte';
	import Aura from '../../../components/Aura.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { prefersReducedMotion } from '../../../motion';
	import { fade, rise } from '../../../motion/transitions';
	import { fmt } from '../../../format';
	import { useRoute } from '../../context';
	import { useLive } from '../../live.svelte';
	import { castOf } from '../../model';
	import { useWorkspace } from '../../source';
	import type { User } from '../../types';
	import LabelShot from '../brand/LabelShot.svelte';
	import SendFill from '../live/SendFill.svelte';

	// the label photo (SC-80, option A): the frame shows what Vision needs, and under it the two ways, Take a photo and
	// Upload a photo, the primary following the device. A phone takes the photo with its own camera app; on the live
	// workspace (SC-73) a laptop opens its camera in the frame. A photo in hand shows whole before it goes, and Send fills
	// as it uploads. What is sent is what backend-api takes, a JPEG, PNG or WebP under 8 MB; naming the types makes an
	// iPhone hand over its HEIC as a JPEG. On the stub and in the guided demo, Take a photo stands in with the shelf. It is
	// the batch in focus's, inside the Label photo screen (SC-133)
	let { me, realCamera }: { me: User; realCamera?: boolean } = $props();
	const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
	const PHOTO_MAX_MB = 8;
	const RULE = `JPEG, PNG or WebP, under ${PHOTO_MAX_MB}\u00a0MB`;
	const CAM_BLOCKED =
		"The camera is blocked for this page. Allow it in the browser's site settings, or upload a photo.";
	const CAM_NONE = 'No camera was found. Upload a photo instead.';
	const ws = useWorkspace();
	const app = useApp();
	const c = $derived(ws.case!);
	const { go } = useRoute();
	const h = $derived(ws.state.hero);
	const verified = $derived(h.photo.status === 'verified');
	const sent = $derived(h.photo.status === 'reading' || verified);
	const live = useLive();
	const on = $derived(!!live?.on);
	const key = $derived(`photo:${c.batch.id}`);
	const going = $derived(ws.uploads?.get(key));
	const busy = $derived(sent || going != null);
	const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
	const desk = $derived(!coarse && app.bp !== 'phone');

	type Shot = { url: string; how: 'camera' | 'upload'; name?: string; demo?: boolean };
	let shot: Shot | null = $state(null);
	/** the photo picked or taken, which the live workspace uploads */
	let photo: File | null = $state(null);
	let ratio: number | null = $state(null);
	let flash = $state(false);
	let sending = $state(false);
	let over = $state(false);
	let err: string | null = $state(null);
	let phoneCam: HTMLInputElement | null = $state(null);
	let files: HTMLInputElement | null = $state(null);
	// a laptop's camera in the frame: on while it is open, its stream once the browser has given it
	let camOn = $state(false);
	let camLive: MediaStream | null = $state(null);
	let video: HTMLVideoElement | null = $state(null);

	const stopTracks = () => camLive?.getTracks().forEach((t) => t.stop());
	const stopCam = () => {
		stopTracks();
		camLive = null;
		camOn = false;
	};
	onDestroy(stopTracks);
	$effect(() => {
		if (video && camLive && video.srcObject !== camLive) {
			video.srcObject = camLive;
			void video.play().catch(() => {});
		}
	});

	// a photo picked, dropped or taken: refused with its reason if backend-api would refuse it
	const use = (f: File | null | undefined, how: Shot['how']) => {
		over = false;
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
		ratio = null;
		photo = f;
		shot = { url: URL.createObjectURL(f), how, name: f.name };
	};
	const picked = (how: Shot['how']) => (e: Event) => {
		const input = e.currentTarget as HTMLInputElement;
		const f = input.files?.[0];
		input.value = '';
		use(f, how);
	};
	// the laptop's camera (the rear one where there is one); refused or missing, it says so
	const openCam = async () => {
		const md = navigator.mediaDevices;
		if (!md?.getUserMedia) {
			err = CAM_NONE;
			return;
		}
		camOn = true;
		try {
			camLive = await md.getUserMedia({
				video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
				audio: false
			});
		} catch (e) {
			stopCam();
			err = (e as Error)?.name === 'NotAllowedError' ? CAM_BLOCKED : CAM_NONE;
		}
	};
	const blink = () => {
		flash = true;
		setTimeout(() => (flash = false), prefersReducedMotion.current ? 0 : 180);
	};
	const take = () => {
		err = null;
		if (realCamera && coarse && phoneCam) {
			phoneCam.click();
			return;
		}
		if (realCamera && on) {
			void openCam();
			return;
		}
		// the prototype's stand-in: the shelf as the photo
		blink();
		setTimeout(
			() => {
				photo = null;
				shot = { url: '', how: 'camera', demo: true };
			},
			prefersReducedMotion.current ? 0 : 180
		);
	};
	const shutter = () => {
		const v = video;
		if (!v || !v.videoWidth) return;
		const cv = document.createElement('canvas');
		cv.width = v.videoWidth;
		cv.height = v.videoHeight;
		cv.getContext('2d')?.drawImage(v, 0, 0);
		blink();
		cv.toBlob(
			(b) => {
				stopCam();
				if (b) use(new File([b], 'label-photo.jpg', { type: 'image/jpeg' }), 'camera');
			},
			'image/jpeg',
			0.92
		);
	};
	const upload = () => {
		err = null;
		files?.click();
	};
	const again = () => {
		const how = shot?.how;
		shot = null;
		photo = null;
		ratio = null;
		if (how === 'camera') take();
		else upload();
	};
	const onDrop = (e: DragEvent) => {
		e.preventDefault();
		if (!busy) use(e.dataTransfer?.files?.[0], 'upload');
	};
	const send = () => {
		sending = true;
		void ws
			.act('sendPhoto', on ? (photo ?? undefined) : undefined, { feel: on ? 0 : 700 })
			.then(() => (sending = false));
	};
	// the scan line sweeps the label three times while Vision reads it, then rests
	const scan = (el: HTMLElement) => {
		const a = el.animate(
			[{ top: '20%', easing: 'ease-in-out' }, { top: '76%', easing: 'ease-in-out' }, { top: '20%' }],
			{ duration: 1600, iterations: 3, fill: 'forwards' }
		);
		return { destroy: () => a.cancel() };
	};
	const record: [string, string][] = $derived([
		['Batch', c.batch.id],
		['Best before', fmt.date(c.batch.bestBefore)],
		['MRP', fmt.rate(c.sku.mrp)]
	]);
	const caption = $derived(
		shot
			? 'Check that you can read the batch, both dates and the MRP.'
			: camOn
				? 'Hold the label flat to the camera, close enough to read.'
				: desk
					? `${RULE}. Or drop a photo on the frame.`
					: `Take a photo opens your camera. ${RULE}.`
	);
</script>

<div class="stack" style="gap: 16px; max-width: 560px; margin: 0 auto; width: 100%">
	<!-- svelte-ignore a11y_no_static_element_interactions (dropping a photo is a shortcut; Upload a photo does the same) -->
	<div
		class={['cam', camOn && 'landscape']}
		style={shot && !shot.demo && ratio ? `aspect-ratio: ${ratio}` : undefined}
		ondragover={(e) => {
			e.preventDefault();
			if (!busy) over = true;
		}}
		ondragleave={() => (over = false)}
		ondrop={onDrop}
	>
		{#if shot && !shot.demo}
			<!-- svelte-ignore a11y_img_redundant_alt (it is the person's own photo, and says so) -->
			{#key shot.url}<img
					class="cam-feed whole"
					src={shot.url}
					alt="Your photo of the carton label"
					onload={(e) => {
						const i = e.currentTarget as HTMLImageElement;
						ratio = Math.max(0.75, Math.min(1.5, i.naturalWidth / i.naturalHeight));
					}}
					in:rise={{ y: 0, scale: 1.02, duration: 240 }}
				/>{/key}
		{:else if camOn}
			<video bind:this={video} class="cam-feed" playsinline muted aria-label="The laptop's camera"></video>
		{:else}<LabelShot cover dim={!shot && !busy} />{/if}
		{#if !shot && !busy}<div class="cam-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
			<div class="cam-hint">
				{camOn
					? camLive
						? 'Fit one carton label in the frame'
						: 'Starting the camera…'
					: 'Like this: one carton label, close up'}
			</div>{/if}
		{#if !shot && !camOn && !busy}<span class="cam-tag">Example</span>{/if}
		{#if camOn}<span class="cam-tag on"><i aria-hidden="true"></i>Laptop camera</span>{/if}
		{#if shot && !busy}<span class="cam-tag"
				>{!shot.demo && shot.how === 'upload' && shot.name ? shot.name : 'Your photo'}</span
			>{/if}
		{#if over && !busy}<div class="cam-drop" transition:fade={{ duration: 160 }}>
				<span class="cam-drop-in"><Icon name="image" size={22} /><b>Drop the photo to use it</b></span>
			</div>{/if}
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
				<Aura on={h.photo.status === 'reading'} class="icontile" style="border-radius: 12px; width: 40px; height: 40px"
					><Icon name={verified ? 'badge-check' : 'scan-line'} size={19} /></Aura
				>
				<div class="grow">
					<b>{verified ? `Done. Dhanyavaad, ${me.short}.` : 'Reading batch, dates and MRP'}</b>
					<div class="t-footnote muted">
						{verified
							? `The plan for this batch will reach ${castOf(ws.state, c).operator.short} in a few minutes.`
							: 'This takes a few seconds.'}
					</div>
				</div>
			</div>
			{#if verified}<List
					>{#each record as [k, v] (k)}<ListRow title={k} value={v} />{/each}</List
				>{/if}
			<Button variant="secondary" block onclick={() => go('home')}>Back to today</Button>
		</Card>{:else if going != null}<SendFill
			p={going}
			oncancel={ws.cancelUpload ? () => ws.cancelUpload?.(key) : undefined}
		/>{:else if shot}<div class="row" style="gap: 10px" in:rise={{ y: 6, duration: 160 }}>
			<Button
				variant="secondary"
				size="lg"
				icon={shot.how === 'camera' ? 'rotate-ccw' : 'image'}
				onclick={again}
				style="flex: none">{shot.how === 'camera' ? 'Retake' : 'Choose another'}</Button
			><Button variant="primary" size="lg" block icon="send" loading={sending} onclick={send}>Send photo</Button>
		</div>{:else if camOn}<div class="cam-bar" in:fade={{ duration: 160 }}>
			<Button variant="ghost" onclick={stopCam}>Cancel</Button><button
				type="button"
				class="shutter"
				aria-label="Take the photo"
				disabled={!camLive}
				onclick={shutter}><span></span></button
			><Button
				variant="ghost"
				icon="image"
				onclick={() => {
					stopCam();
					upload();
				}}>Upload</Button
			>
		</div>{:else}<div class="cam-two" in:fade={{ duration: 160 }}>
			<Button variant={desk ? 'secondary' : 'primary'} size="lg" icon="camera" onclick={take}>Take a photo</Button
			><Button variant={desk ? 'primary' : 'secondary'} size="lg" icon="upload" onclick={upload}>Upload a photo</Button>
		</div>{/if}
	<input
		bind:this={phoneCam}
		type="file"
		accept={PHOTO_TYPES.join(',')}
		capture="environment"
		onchange={picked('camera')}
		class="sr-only"
		tabindex={-1}
		aria-hidden="true"
	/>
	<input
		bind:this={files}
		type="file"
		accept={PHOTO_TYPES.join(',')}
		onchange={picked('upload')}
		class="sr-only"
		tabindex={-1}
		aria-hidden="true"
	/>
	{#if err && !busy}<p class="cam-alert" role="alert"><Icon name="triangle-alert" size={15} />{err}</p>
	{:else if going != null}<p class="t-caption subtle" style="text-align: center; margin: 0">
			A slow connection only slows the send.
		</p>
	{:else if !sent && realCamera}<p class="t-caption subtle" style="text-align: center; margin: 0">
			{on ? caption : `${caption} In this prototype a stub stands in for Gemini vision and returns the batch record.`}
		</p>{/if}
</div>
