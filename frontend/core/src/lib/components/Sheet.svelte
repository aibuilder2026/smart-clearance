<script lang="ts">
	import { Dialog, mergeProps } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { useApp } from '../app.svelte';
	import { cx } from '../cx';
	import { DURATION, SPRINGS, motionMs, springCurve } from '../motion';
	import IconButton from './IconButton.svelte';

	type Props = {
		open?: boolean;
		/** called when the reader dismisses the sheet: Close, Escape, the scrim, or a swipe down */
		onclose?: () => void;
		title: string | Snippet;
		children?: Snippet;
		footer?: Snippet;
		/** bottom on phones and a floating side panel elsewhere, unless set; center for a form sheet */
		side?: 'bottom' | 'side' | 'center';
		detent?: 'medium' | 'large';
		headerRight?: Snippet;
		class?: string;
	};
	let {
		open = $bindable(false),
		onclose,
		title,
		children,
		footer,
		side,
		detent = 'large',
		headerRight,
		class: className
	}: Props = $props();

	const app = useApp();
	const mode = $derived(side ?? (app.bp === 'phone' ? 'bottom' : 'side'));

	// a bottom sheet is always full height and slides down to show its medium detent; its padding lifts the footer by the
	// same distance, so the footer sits at the bottom of the screen at either detent
	let cur = $state<'medium' | 'large'>('large');
	const H = $derived(app.h || 800);
	const largeH = $derived(H * 0.94);
	const mediumH = $derived(Math.min(largeH, H * 0.58));
	const offset = $derived(mode === 'bottom' && cur === 'medium' ? largeH - mediumH : 0);
	let drag = $state(0);
	let settling = $state(false);
	const y = $derived(offset + drag);

	$effect.pre(() => {
		if (open) {
			cur = detent;
			drag = 0;
		}
	});

	const close = () => {
		open = false;
		onclose?.();
	};

	const spring = springCurve(SPRINGS.sheet);
	const at = (from: number, to: number, t: number) => from + (to - from) * t;
	// in: from off-screen to rest; out: from wherever the sheet is (a drag included) back off-screen. Svelte runs an
	// outro as 1 - easing, so the same spring carries both ways, as framer-motion's does
	function panel(_node: HTMLElement) {
		const duration = motionMs(spring.duration) || 10;
		const easing = spring.easing;
		if (mode === 'bottom') {
			const rest = y;
			return { duration, easing, css: (t: number) => `transform: translateY(${at(largeH, rest, t)}px)` };
		}
		if (mode === 'center') {
			return {
				duration,
				easing,
				css: (t: number) => `opacity: ${t}; transform: translate(-50%, ${at(-48, -50, t)}%) scale(${at(0.96, 1, t)})`
			};
		}
		return { duration, easing, css: (t: number) => `transform: translateX(${at(105, 0, t)}%)` };
	}
	const scrim = (_node: Element) => ({ duration: motionMs(DURATION.scrim), css: (t: number) => `opacity: ${t}` });

	// the panel takes focus when it opens (not its first field), so a screen reader names the dialog first
	let panelEl: HTMLElement | null = $state(null);
	const focusPanel = (e: Event) => {
		e.preventDefault();
		panelEl?.focus({ preventScroll: true });
	};

	// when the content runs longer than the sheet, the body scrolls, so a keyboard can reach it (WCAG 2.1.1)
	let body: HTMLElement | null = $state(null);
	let scrolls = $state(false);
	$effect(() => {
		const el = body;
		if (!el || !open) return;
		const check = () => (scrolls = el.scrollHeight > el.clientHeight + 1);
		const ro = new ResizeObserver(check);
		ro.observe(el);
		Array.from(el.children).forEach((c) => ro.observe(c));
		check();
		return () => ro.disconnect();
	});

	// a bottom sheet follows the finger: past a little elastic at the top, down freely; let go and it settles on a
	// detent, or closes when flung or pulled most of the way down (the prototype's onDragEnd rule)
	let start: { y: number; t: number; drag: number } | null = null;
	let last: { y: number; t: number } | null = null;
	let velocity = 0;
	function onpointerdown(e: PointerEvent) {
		if (mode !== 'bottom' || e.button !== 0) return;
		if (body && body.contains(e.target as Node) && body.scrollTop > 0) return;
		if ((e.target as HTMLElement).closest('button, a, input, select, textarea, [contenteditable]')) return;
		start = { y: e.clientY, t: e.timeStamp, drag };
		last = { y: e.clientY, t: e.timeStamp };
		velocity = 0;
		settling = false;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function onpointermove(e: PointerEvent) {
		if (!start || !last) return;
		const dy = e.clientY - start.y + start.drag;
		const top = -offset;
		const bottom = largeH - offset;
		drag = dy < top ? top + (dy - top) * 0.04 : dy > bottom ? bottom + (dy - bottom) * 0.6 : dy;
		const dt = e.timeStamp - last.t;
		if (dt > 0) velocity = ((e.clientY - last.y) / dt) * 1000;
		last = { y: e.clientY, t: e.timeStamp };
	}
	function onpointerup() {
		if (!start) return;
		start = null;
		const pos = offset + drag;
		const v = velocity;
		if (v > 700 || pos > largeH - mediumH * 0.45) return close();
		settling = true;
		cur = pos > (largeH - mediumH) / 2 || v > 300 ? 'medium' : 'large';
		drag = 0;
	}
</script>

<Dialog.Root bind:open onOpenChange={(v) => !v && onclose?.()}>
	<Dialog.Portal to={app.overlays ?? undefined}>
		<Dialog.Overlay forceMount>
			{#snippet child({ props, open: shown })}
				{#if shown}<div {...props} class="scrim" transition:scrim></div>{/if}
			{/snippet}
		</Dialog.Overlay>
		<Dialog.Content forceMount onOpenAutoFocus={focusPanel} trapFocus={!app.embedded} preventScroll={!app.embedded}>
			{#snippet child({ props, open: shown })}
				{#if shown}
					<div
						{...mergeProps(props, {
							tabindex: -1,
							class: cx('sheet', `sheet-${mode}`, className),
							onpointerdown,
							onpointermove,
							onpointerup,
							onpointercancel: onpointerup,
							ontransitionend: () => (settling = false)
						})}
						bind:this={panelEl}
						style:height={mode === 'bottom' ? `${largeH}px` : undefined}
						style:padding-bottom={mode === 'bottom' ? `calc(var(--safe-bottom) + ${offset}px)` : undefined}
						style:transform={mode === 'bottom'
							? `translateY(${y}px)`
							: mode === 'center'
								? 'translate(-50%, -50%)'
								: undefined}
						style:transition={settling ? `transform ${motionMs(spring.duration)}ms ${spring.linear}` : undefined}
						style:touch-action={mode === 'bottom' ? 'none' : undefined}
						in:panel
						out:panel
					>
						{#if mode === 'bottom'}<div class="grabber" aria-hidden="true"></div>{/if}
						<div class="sheet-head">
							{#if typeof title === 'string'}<Dialog.Title level={2}>{title}</Dialog.Title
								>{:else}{@render title()}{/if}{@render headerRight?.()}<IconButton
								icon="x"
								label="Close"
								round
								onclick={close}
							/>
						</div>
						<!-- svelte-ignore a11y_no_noninteractive_tabindex (a focusable region only while it scrolls) -->
						<div
							bind:this={body}
							class="sheet-body"
							tabindex={scrolls ? 0 : undefined}
							role={scrolls ? 'region' : undefined}
							aria-label={scrolls && typeof title === 'string' ? title : undefined}
							style:touch-action={mode === 'bottom' ? 'pan-y' : undefined}
						>
							{@render children?.()}
						</div>
						{#if footer}<div class="sheet-foot">{@render footer()}</div>{/if}
					</div>
				{/if}
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
