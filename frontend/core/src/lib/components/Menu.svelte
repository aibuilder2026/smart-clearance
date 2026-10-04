<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { IconName } from '../icons/registry';

	/** an entry in a menu: an action, a link (with `href`; another site opens in a new tab), a radio choice (with
	 *  `checked`), a heading that names the menu, or "-" for a rule */
	export type MenuItem =
		| {
				label: string;
				heading?: boolean;
				icon?: IconName;
				right?: Snippet | string;
				checked?: boolean;
				danger?: boolean;
				href?: string;
				onclick?: () => void;
		  }
		| '-';
</script>

<script lang="ts">
	import { DropdownMenu, mergeProps } from 'bits-ui';
	import { cx } from '../cx';
	import Icon from '../icons/Icon.svelte';
	import { DURATION, ease, motionMs } from '../motion';

	type Props = {
		open?: boolean;
		items: (MenuItem | null | false | undefined)[];
		align?: 'left' | 'right';
		width?: number;
		style?: string;
		/** the menu's name; a leading heading names it otherwise */
		label?: string;
		/** the button that opens it, given the props that make it a menu button (aria-haspopup, aria-expanded …) */
		trigger: Snippet<[Record<string, unknown>]>;
	};
	let { open = $bindable(false), items, align = 'right', width = 240, style = '', label, trigger }: Props = $props();

	type Entry = Exclude<MenuItem, '-'>;
	type Block =
		| { kind: 'rule' }
		| { kind: 'heading'; label: string }
		| { kind: 'item'; it: Entry }
		| { kind: 'radio'; its: Entry[] };
	const list = $derived(items.filter((x): x is MenuItem => !!x));
	const name = $derived(label ?? (list[0] && list[0] !== '-' && list[0].heading ? list[0].label : undefined));
	// consecutive radio choices form one group, so each is a menuitemradio with aria-checked
	const blocks = $derived.by(() => {
		const out: Block[] = [];
		for (const it of list) {
			if (it === '-') out.push({ kind: 'rule' });
			else if (it.heading) out.push({ kind: 'heading', label: it.label });
			else if (it.checked !== undefined) {
				const prev = out[out.length - 1];
				if (prev?.kind === 'radio') prev.its.push(it);
				else out.push({ kind: 'radio', its: [it] });
			} else out.push({ kind: 'item', it });
		}
		return out;
	});

	// opening moves focus to the checked item, or the first (the APG menu button; the prototype's Menu)
	let content: HTMLElement | null = $state(null);
	function focusFirst(e: Event) {
		e.preventDefault();
		const first =
			content?.querySelector<HTMLElement>('[aria-checked="true"]') ??
			content?.querySelector<HTMLElement>('[role^="menuitem"]');
		first?.focus({ preventScroll: true });
	}

	// bits-ui hands its layer's own options to the child snippet with the element's props; keep them off the DOM
	const domProps = ({ shouldRender: _, ...rest }: Record<string, unknown>) => rest;

	const pop = (_: Element, { out = false } = {}) => ({
		duration: motionMs(DURATION.menu),
		easing: ease,
		css: (t: number) =>
			out
				? `opacity: ${t}; transform: translateY(${-2 * (1 - t)}px) scale(${0.97 + 0.03 * t})`
				: `opacity: ${t}; transform: translateY(${-4 * (1 - t)}px) scale(${0.96 + 0.04 * t})`
	});
</script>

{#snippet body(it: Entry)}{#if it.icon}<Icon name={it.icon} size={17} />{/if}<span class="grow">{it.label}</span
	>{#if typeof it.right === 'string'}{it.right}{:else}{@render it.right?.()}{/if}{/snippet}

<!-- a menu button's menu (WAI-ARIA APG): the arrows, Home and End move between items and wrap; Escape closes it and
     gives focus back to its button; Tab closes it and moves on from the button. Drawn in place under its button, as the
     prototype's Menu is, 6px below and aligned to the button's right edge (or left) -->
<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}{@render trigger(props)}{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.ContentStatic forceMount loop onOpenAutoFocus={focusFirst} aria-label={name}>
		{#snippet child({ props, open: shown })}
			{#if shown}
				<div
					{...mergeProps(domProps(props), {
						class: 'menu',
						style: `top: calc(100% + 6px); ${align}: 0; width: ${width}px; ${style}`
					})}
					bind:this={content}
					in:pop
					out:pop={{ out: true }}
				>
					{#each blocks as b, i (i)}
						{#if b.kind === 'rule'}<DropdownMenu.Separator class="msep" />{:else if b.kind === 'heading'}<div
								class="mlabel"
								aria-hidden="true"
							>
								{b.label}
							</div>{:else if b.kind === 'item'}<DropdownMenu.Item
								class={cx('mi', b.it.danger && 'danger')}
								onSelect={() => b.it.onclick?.()}
								>{#snippet child({ props })}{#if b.it.href}<a
											{...props}
											href={b.it.href}
											target={/^https?:/.test(b.it.href) ? '_blank' : undefined}
											rel={/^https?:/.test(b.it.href) ? 'noopener' : undefined}>{@render body(b.it)}</a
										>{:else}<div {...props}>{@render body(b.it)}</div>{/if}{/snippet}</DropdownMenu.Item
							>{:else}<DropdownMenu.RadioGroup
								value={b.its.find((x) => x.checked)?.label ?? ''}
								onValueChange={(v) => b.its.find((x) => x.label === v)?.onclick?.()}
								>{#each b.its as it (it.label)}<DropdownMenu.RadioItem
										value={it.label}
										class={cx('mi', it.danger && 'danger')}>{@render body(it)}</DropdownMenu.RadioItem
									>{/each}</DropdownMenu.RadioGroup
							>{/if}
					{/each}
				</div>
			{/if}
		{/snippet}
	</DropdownMenu.ContentStatic>
</DropdownMenu.Root>
