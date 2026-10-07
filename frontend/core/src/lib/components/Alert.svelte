<script lang="ts" module>
	/** a button at the foot of an alert; any of them closes it, after its own action */
	export type AlertAction = { label: string; onclick?: () => void; danger?: boolean; strong?: boolean };
</script>

<script lang="ts">
	import { AlertDialog, mergeProps } from 'bits-ui';
	import { useApp } from '../app.svelte';
	import { cx } from '../cx';
	import { DURATION, SPRINGS, motionMs, springCurve } from '../motion';

	type Props = {
		open?: boolean;
		/** called when the alert closes: an action, Escape or the scrim */
		onclose?: () => void;
		title: string;
		message?: string;
		actions?: AlertAction[];
	};
	let { open = $bindable(false), onclose, title, message, actions = [] }: Props = $props();

	// the kit's Alert (bits-ui AlertDialog): a short question in the middle of the app, with its answers along the foot.
	// It takes focus when it opens, keeps Tab inside, and Escape or the scrim closes it, as Cancel would
	const app = useApp();
	const close = () => {
		open = false;
		onclose?.();
	};
	const spring = springCurve(SPRINGS.alert);
	const at = (from: number, to: number, t: number) => from + (to - from) * t;
	function pop(_node: HTMLElement, { out = false } = {}) {
		return {
			duration: motionMs(spring.duration) || 10,
			easing: spring.easing,
			css: (t: number) => `opacity: ${t}; transform: translate(-50%, -50%) scale(${at(out ? 0.96 : 1.08, 1, t)})`
		};
	}
	const scrim = (_node: Element) => ({ duration: motionMs(DURATION.scrim), css: (t: number) => `opacity: ${t}` });
	// an h3 and a p, as the kit's alert has them: drop the role and level bits-ui gives its div title
	const plain = ({ role: _role, 'aria-level': _level, ...rest }: Record<string, unknown>) => rest;

	let panel: HTMLElement | null = $state(null);
	const focusPanel = (e: Event) => {
		e.preventDefault();
		panel?.focus({ preventScroll: true });
	};
</script>

<AlertDialog.Root bind:open onOpenChange={(v) => !v && onclose?.()}>
	<AlertDialog.Portal to={app.overlays ?? undefined}>
		<AlertDialog.Overlay forceMount>
			{#snippet child({ props, open: shown })}
				{#if shown}<div {...props} class="scrim" transition:scrim></div>{/if}
			{/snippet}
		</AlertDialog.Overlay>
		<AlertDialog.Content
			forceMount
			interactOutsideBehavior="close"
			onOpenAutoFocus={focusPanel}
			trapFocus={!app.embedded}
			preventScroll={!app.embedded && app.scroll !== 'window'}
		>
			{#snippet child({ props, open: shown })}
				{#if shown}
					<div
						{...mergeProps(props, { tabindex: -1, class: 'alert' })}
						bind:this={panel}
						style:transform="translate(-50%, -50%)"
						in:pop
						out:pop={{ out: true }}
					>
						<div class="al-body">
							<AlertDialog.Title
								>{#snippet child({ props: p })}<h3 {...plain(p)}>{title}</h3>{/snippet}</AlertDialog.Title
							>{#if message}<AlertDialog.Description
									>{#snippet child({ props: p })}<p {...p}>{message}</p>{/snippet}</AlertDialog.Description
								>{/if}
						</div>
						<div class="al-actions" style={actions.length > 2 ? 'grid-auto-flow: row' : undefined}>
							{#each actions as a (a.label)}<button
									type="button"
									class={cx(a.strong && 'strong', a.danger && 'danger')}
									onclick={() => {
										a.onclick?.();
										close();
									}}>{a.label}</button
								>{/each}
						</div>
					</div>
				{/if}
			{/snippet}
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
