<script lang="ts">
	import { cx } from '../../../cx';

	// a line of a partner's money: what it is, its working (a link when it opens a paper), the figure
	type Props = { k: string; sub?: string | null; v: string | number; strong?: boolean; onclick?: (() => void) | null };
	let { k, sub, v, strong, onclick }: Props = $props();
</script>

<div class={cx('pt-line', strong && 'strong')}>
	<span
		>{k}{#if sub}<em>
				{#if onclick}<button type="button" class="pt-link" {onclick}>{sub}</button>{:else}{sub}{/if}</em
			>{/if}</span
	><span class="tnum">{v}</span>
</div>
