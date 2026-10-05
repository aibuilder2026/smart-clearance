<script lang="ts">
	import { onDestroy, type Snippet } from 'svelte';
	import { flip } from 'svelte/animate';
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import { SPRINGS, motionMs, springCurve } from '../motion';
	import { Notices, provideNotice } from '../notice.svelte';
	import Avatar from './Avatar.svelte';
	import Mark from './Mark.svelte';

	// the kit's NoticeHost: banners (in-app pushes) at the top and toasts at the foot, each announced politely. useNotice()
	// gives its children push() and toast(); a new resetKey clears both (the demo's restart)
	let { children, resetKey }: { children?: Snippet; resetKey?: unknown } = $props();
	const notices = new Notices();
	provideNotice(notices);
	onDestroy(notices.dispose);

	let seen = false;
	$effect(() => {
		void resetKey;
		if (seen) notices.clear();
		seen = true;
	});

	const spring = springCurve(SPRINGS.notice);
	const at = (from: number, to: number, t: number) => from + (to - from) * t;
	// in: rise into place (a banner drops in); out: settle away. Svelte runs the outro as 1 - easing, so the spring
	// carries both ways
	const rise = (_: Element, { y = 16, scale = 0.97 } = {}) => ({
		duration: motionMs(spring.duration),
		easing: spring.easing,
		css: (t: number) => `opacity: ${t}; transform: translateY(${at(y, 0, t)}px) scale(${at(scale, 1, t)})`
	});
	const move = (node: Element, rects: { from: DOMRect; to: DOMRect }) => flip(node, rects, { duration: motionMs(240) });

	// a banner swiped up goes; tapped, it opens what it is about
	let drag: { id: string; y: number } | null = null;
	const down = (id: string) => (e: PointerEvent) => (drag = { id, y: e.clientY });
	const up = (e: PointerEvent) => {
		if (drag && e.clientY - drag.y < -24) {
			notices.close(drag.id);
			e.preventDefault();
		}
		drag = null;
	};
</script>

{@render children?.()}
<div class="banners" aria-live="polite">
	{#each notices.banners as b (b.id)}<button
			type="button"
			class="banner"
			animate:move
			in:rise={{ y: -40, scale: 0.96 }}
			out:rise={{ y: -24, scale: 0.97 }}
			onpointerdown={down(b.id)}
			onpointerup={up}
			onclick={() => {
				notices.close(b.id);
				b.onopen?.();
			}}
			><span style="width: 38px; height: 38px"
				>{#if b.person}<Avatar person={b.person} size="lg" />{:else}<Mark size={38} />{/if}</span
			><span style="min-width: 0"
				><span class="bn-top"
					><span class="bn-app">{b.app || 'Smart-Clearance'}</span><span class="bn-time">{b.at || 'now'}</span></span
				><b>{b.title}</b>
				<p
					class={cx(b.hindi && 'hi', 'clamp-3')}
					style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden"
				>
					{b.body}
				</p></span
			></button
		>{/each}
</div>
<div class="toasts" aria-live="polite">
	{#each notices.toasts as t (t.id)}<div class={cx('toast', t.tone)} animate:move in:rise out:rise={{ y: 8, scale: 1 }}>
			<Icon name={t.icon || (t.tone === 'err' ? 'circle-alert' : 'circle-check')} size={18} /><span>{t.text}</span>
		</div>{/each}
</div>
