<script lang="ts">
	import { cx, Icon } from '@smart-clearance/core';
	import { D } from '@smart-clearance/core/workspace';

	// the nine stages along the top bar (director.jsx StageBar): done, the one on now, and the human one in amber;
	// each jumps to its stage
	let { n, onjump }: { n: number; onjump: (i: number) => void } = $props();
</script>

<nav class="stagebar" aria-label="Stages">
	{#each D.stages as st, i (st.id)}<button
			type="button"
			class={cx('sbtn', i < n && 'done', i === n && 'now', st.human && 'human')}
			aria-current={i === n ? 'step' : undefined}
			aria-label="{st.title}, stage {i + 1}{i < n ? ', done' : ''}"
			onclick={() => onjump(i)}
			><span class="sb-dot"
				>{#if i < n}<Icon name="check" size={12} stroke={3} />{:else}{i + 1}{/if}</span
			><span class="sb-t">{st.title}</span></button
		>{/each}
</nav>
