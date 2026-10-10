<script lang="ts">
	import { onDestroy, type Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { fly } from 'svelte/transition';
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import type { IconName } from '../icons/registry';
	import { ease, motionMs, prefersReducedMotion, SPRINGS, springCurve } from '../motion';
	import { rise } from '../motion/transitions';
	import { Wait } from '../wait.svelte';

	export type ButtonVariant =
		| 'primary'
		| 'approve'
		| 'secondary'
		| 'tinted'
		| 'outline'
		| 'ghost'
		| 'destructive'
		| 'destructive-soft'
		| 'violet'
		| 'link';

	type Words = string | Snippet;
	type Common = {
		variant?: ButtonVariant;
		size?: 'sm' | 'lg' | 'xl';
		icon?: IconName;
		iconRight?: IconName;
		/** the screen's own wait: on while its call is out (with `error` for a refusal once it is off) */
		loading?: boolean;
		/** run on the press; the button waits on it, and a rejection is the refusal, in its own words */
		action?: () => unknown;
		/** what the button says while it waits ("Approving the plan…"); else its own words */
		busy?: Words;
		/** what it says once the answer lands ("Plan approved"); without it the button rests at once */
		done?: Words;
		/** a refusal the screen holds, shown under the button */
		error?: string | null;
		/** Try again, for a button the screen drives (with action, the button tries the action again itself) */
		onretry?: () => void;
		/** the line past 3 s, or false when the wait is not the network */
		slow?: string | false;
		block?: boolean;
		pill?: boolean;
		class?: string;
		children?: Snippet;
		ref?: HTMLElement | null;
	};
	type Props = Common &
		(
			| (Omit<HTMLButtonAttributes, 'class' | 'children'> & { href?: undefined })
			| (Omit<HTMLAnchorAttributes, 'class' | 'children'> & { href: string })
		);

	let {
		variant = 'secondary',
		size,
		icon,
		iconRight,
		loading,
		action,
		busy,
		done,
		error,
		onretry,
		slow,
		block,
		pill,
		class: className,
		children,
		ref = $bindable(null),
		href,
		...rest
	}: Props = $props();

	const classes = $derived(
		cx(
			'btn',
			`btn-${variant}`,
			size && `btn-${size}`,
			block && 'btn-block',
			pill && 'btn-pill',
			!children && 'btn-icon',
			className
		)
	);
	const iconSize = $derived(size === 'sm' ? 16 : size === 'xl' ? 20 : 18);

	// A button that waits on the network (SC-152, option A; the kit's Button): it keeps its width and says what it is
	// doing, a spinner in the icon's place and a line creeping along its foot; the answer lands as a tick and the done
	// word, or a shake and the reason under it with Try again; past 3 s a line under it says it is still working. A
	// button given none of action, busy, done, loading or error is the plain button
	const waits = $derived(
		action !== undefined || busy !== undefined || done !== undefined || loading !== undefined || error !== undefined
	);
	const wait = new Wait({ done: () => done !== undefined });
	const reduce = prefersReducedMotion.current;
	const tick = springCurve(SPRINGS.tick);
	const noteId = 'bn' + Math.random().toString(36).slice(2, 8);
	let restWidth = $state(0);
	const face = $derived(wait.face);
	const note = $derived((wait.phase === 'slow' && slow !== false) || wait.phase === 'error');
	const begin = () => {
		if (ref) restWidth = ref.offsetWidth;
	};

	// a screen drives it: loading on is the wait, off is the answer (a refusal when error is set)
	let was = false;
	$effect.pre(() => {
		if (action !== undefined) return;
		const on = !!loading;
		if (on === was) return;
		was = on;
		if (on) {
			begin();
			wait.begin();
		} else wait.end(error ?? null);
	});
	$effect(() => {
		if (action !== undefined || loading) return;
		wait.refuse(error ?? null);
	});
	onDestroy(() => wait.stop());

	const { onclick, ...attrs } = $derived(rest as HTMLButtonAttributes);
	const press = (e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
		if (wait.working || wait.phase === 'done') return e.preventDefault();
		if (action) {
			begin();
			void wait.run(action);
		} else onclick?.(e);
	};
	const retry = $derived(action ? () => (begin(), void wait.run(action)) : onretry);
</script>

{#snippet words(w: Words | undefined)}{#if typeof w === 'function'}{@render w()}{:else if w}{w}{:else}{@render children?.()}{/if}{/snippet}

<!-- the kit's Button; with href it is a link that looks like a button (the prototype's <a class="btn">) -->
{#if href}
	<a bind:this={ref} {href} class={classes} {...rest as HTMLAnchorAttributes}
		>{#if icon}<Icon name={icon} size={iconSize} />{/if}{@render children?.()}{#if iconRight}<Icon
				name={iconRight}
				size={size === 'sm' ? 16 : 18}
			/>{/if}</a
	>
{:else if !waits}
	<button bind:this={ref} type="button" class={classes} {...rest as HTMLButtonAttributes}
		>{#if icon}<Icon name={icon} size={iconSize} />{/if}{@render children?.()}{#if iconRight}<Icon
				name={iconRight}
				size={size === 'sm' ? 16 : 18}
			/>{/if}</button
	>
{:else}
	<span class={cx('btn-wait', block && 'btn-wait-block')}>
		<button
			bind:this={ref}
			type="button"
			{...attrs}
			class={classes}
			class:btn-shake={wait.phase === 'error' && !reduce}
			class:btn-still={reduce}
			data-phase={wait.phase}
			aria-busy={wait.working || undefined}
			aria-disabled={wait.working || wait.phase === 'done' || attrs['aria-disabled'] || undefined}
			aria-describedby={note ? noteId : attrs['aria-describedby']}
			style:min-width={face !== 'rest' && restWidth ? `${restWidth}px` : undefined}
			style:--tick-ease={tick.linear}
			style:--tick-ms="{tick.duration}ms"
			onclick={press}
			><span class="btn-faces"
				>{#key face}<span
						class="btn-face"
						in:fly={{ y: 12, duration: motionMs(240), easing: ease }}
						out:fly={{ y: -12, duration: motionMs(240), easing: ease }}
						>{#if face === 'busy'}<svg class="btn-arc" width={iconSize} height={iconSize} viewBox="0 0 20 20" aria-hidden="true"
								><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-opacity="0.28" stroke-width="2.25" /><path
									d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5"
									fill="none"
									stroke="currentColor"
									stroke-width="2.25"
									stroke-linecap="round"
								/></svg
							>{@render words(busy)}{:else if face === 'done'}<svg
								class="btn-tick"
								width={iconSize}
								height={iconSize}
								viewBox="0 0 24 24"
								aria-hidden="true"
								><path
									d="M5 12.5l4.5 4.5L19 7.5"
									pathLength="1"
									fill="none"
									stroke="currentColor"
									stroke-width="2.6"
									stroke-linecap="round"
									stroke-linejoin="round"
								/></svg
							>{@render words(done)}{:else}{#if icon}<Icon name={icon} size={iconSize} />{/if}{@render children?.()}{#if iconRight}<Icon
									name={iconRight}
									size={size === 'sm' ? 16 : 18}
								/>{/if}{/if}</span
					>{/key}</span
			>{#if face !== 'rest'}<i class="btn-line" class:full={face === 'done'} aria-hidden="true"></i>{/if}</button
		><span class="sr-only" role="status"
			>{#if face === 'busy'}{#if typeof busy === 'string'}{busy}{:else}Working{/if}{:else if face === 'done'}{#if typeof done === 'string'}{done}{:else}Done{/if}{/if}</span
		>{#if note}<span
				id={noteId}
				class="btn-note"
				class:err={wait.phase === 'error'}
				role={wait.phase === 'error' ? 'alert' : undefined}
				in:rise={{ y: -4, duration: 240 }}
				>{#if wait.phase === 'slow'}<Icon name="cloud" size={14} /><span
						>{slow || 'Still working. The platform can take a few seconds to wake.'}</span
					>{:else}<Icon name="circle-alert" size={14} /><span>{wait.error}</span>{#if retry}<button
							type="button"
							class="btn btn-link btn-sm"
							onclick={retry}>Try again</button
						>{/if}{/if}</span
			>{/if}</span
	>
{/if}
