<script lang="ts">
	import { cx } from '../cx';
	import Roll from './Roll.svelte';

	// days left: urgency set in the numeral's own axes, wider and heavier as the date nears
	type Props = {
		days: number;
		life?: number;
		size?: 's' | 'm' | 'l' | 'xl';
		roll?: boolean;
		class?: string;
		style?: string;
	};
	let { days, life = 180, size = 'xl', roll, class: className, style = '' }: Props = $props();
	const u = $derived(Math.max(0, Math.min(1, 1 - days / life)));
</script>

<span
	class={cx('num', size, className)}
	style="--wdth: {Math.round(76 + 24 * u)}; --wght: {Math.round(620 + 180 * u)}; {style}"
	>{#if roll}<Roll value={days} from={0} />{:else}{days}{/if}</span
>
