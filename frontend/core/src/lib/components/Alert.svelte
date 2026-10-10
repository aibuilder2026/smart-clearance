<script lang="ts" module>
	/** a button at the foot of an alert; any of them closes it, after its own action. An action that returns a promise
	 *  keeps the alert open while it waits (SC-152), its button saying `busy`; a refusal stays in the alert */
	export type AlertAction = { label: string; onclick?: () => unknown; busy?: string; danger?: boolean; strong?: boolean };
</script>

<script lang="ts">
	import { AlertDialog, mergeProps } from 'bits-ui';
	import { useApp } from '../app.svelte';
	import { cx } from '../cx';
	import { DURATION, SPRINGS, motionMs, springCurve } from '../motion';
	import { refusal } from '../wait.svelte';

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
	// the action waiting on its answer, and a refusal to show in the alert
	let waiting: string | null = $state(null);
	let refused: string | null = $state(null);
	$effect(() => {
		if (!open) waiting = refused = null;
	});
	const press = async (a: AlertAction) => {
		if (waiting) return;
		const out = a.onclick?.();
		if (!(out instanceof Promise)) return close();
		waiting = a.label;
		refused = null;
		try {
			await out;
			waiting = null;
			close();
		} catch (e) {
			waiting = null;
			refused = refusal(e);
		}
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

<AlertDialog.Root
	bind:open={() => open, (v) => (waiting && !v ? undefined : (open = v))}
	onOpenChange={(v) => !v && !waiting && onclose?.()}
>
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
								>{/if}{#if refused}<p class="al-err" role="alert">{refused}</p>{/if}
						</div>
						<div class="al-actions" style={actions.length > 2 ? 'grid-auto-flow: row' : undefined}>
							{#each actions as a (a.label)}<button
									type="button"
									class={cx(a.strong && 'strong', a.danger && 'danger')}
									aria-busy={waiting === a.label || undefined}
									disabled={!!waiting && waiting !== a.label}
									onclick={() => press(a)}
									>{#if waiting === a.label}<svg
											class="btn-arc"
											width="16"
											height="16"
											viewBox="0 0 20 20"
											aria-hidden="true"
											><circle
												cx="10"
												cy="10"
												r="7.5"
												fill="none"
												stroke="currentColor"
												stroke-opacity="0.28"
												stroke-width="2.25"
											/><path
												d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5"
												fill="none"
												stroke="currentColor"
												stroke-width="2.25"
												stroke-linecap="round"
											/></svg
										>{a.busy ?? a.label}{:else}{a.label}{/if}</button
								>{/each}
						</div>
					</div>
				{/if}
			{/snippet}
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
