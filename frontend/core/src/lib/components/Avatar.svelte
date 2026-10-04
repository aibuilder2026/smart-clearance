<script lang="ts">
	import { imgUrl } from '../assets';
	import { cx } from '../cx';

	export type Person = { name?: string; short?: string; img?: string };
	type Props = { person?: Person | null; size?: 'sm' | 'lg' | 'xl'; ring?: boolean; status?: boolean; class?: string };
	let { person, size, ring, status, class: className }: Props = $props();

	let failed = $state(false);
	const name = $derived(person?.name || person?.short || '?');
	const ini = $derived(
		name
			.split(/\s+/)
			.map((w) => w[0])
			.slice(0, 2)
			.join('')
			.toUpperCase()
	);
	const src = $derived(person?.img ? imgUrl(person.img) : undefined);
</script>

<span class={cx('avatar', size, ring && 'ring', className)}
	>{#if src && !failed}<img {src} alt="" onerror={() => (failed = true)} />{:else}<span class="ini">{ini}</span
		>{/if}{#if status}<i class="status"></i>{/if}</span
>
