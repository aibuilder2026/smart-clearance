<script lang="ts">
	import { cx } from '../../../cx';
	import Icon from '../../../icons/Icon.svelte';
	import type { IconName } from '../../../icons/registry';
	import type { PtMoment } from '../../types';
	import { when } from './pt';

	// what happened to a batch, its moments down a spine; those still to come dimmed (SC-130)
	let { items }: { items: PtMoment[] } = $props();
</script>

<div class="pt-moments" role="list">
	{#each items as m, i (m.k + i)}<div role="listitem" class={cx('pt-moment', m.ahead && 'ahead')}>
			<span class="icontile"><Icon name={m.icon as IconName} size={17} stroke={2} /></span>
			<div>
				<b>{m.title}</b>{#if m.sub}<span class="sub">{m.sub}</span>{/if}
			</div>
			<time>{m.at ? (m.at.length > 10 ? when(m.at) : m.at) : 'next'}</time>
		</div>{/each}
</div>
