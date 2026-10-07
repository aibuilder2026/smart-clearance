<script lang="ts">
	import Avatar from '../../../components/Avatar.svelte';
	import Mark from '../../../components/Mark.svelte';
	import { rise } from '../../../motion/transitions';
	import { useWorkspace } from '../../source';
	import type { ChatMessage } from '../../types';

	// the Negotiator's thread with the buyer: the buyer's bubbles on the right in violet, the agent's on the left under
	// the mark, and the typing dots while it answers (screens/brand.jsx Chat)
	type Props = { chat: ChatMessage[]; typing?: boolean };
	let { chat, typing }: Props = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
</script>

<div class="stack snug">
	{#each chat as m, i (i)}
		{@const mine = m.from === 'buyer'}
		<div in:rise={{ y: 6 }} class="row end" style="justify-content: {mine ? 'flex-end' : 'flex-start'}; gap: 8px">
			{#if !mine}<Mark size={28} />{/if}
			<div
				style="max-width: 82%; padding: 10px 13px; border-radius: 18px; border-bottom-left-radius: {mine
					? 18
					: 6}px; border-bottom-right-radius: {mine ? 6 : 18}px; background: {mine
					? 'var(--violet)'
					: 'var(--fill-2)'}; color: {mine ? 'var(--violet-fg)' : 'var(--fg)'}; font-size: 14.5px; line-height: 1.4"
			>
				{m.text}
				<div style="font-size: 11.5px; opacity: 0.9; margin-top: 3px">
					{mine ? `${c.buyer.name}, ${c.buyer.city}` : 'Rakesh Traders · Negotiator agent'} · {m.at}
				</div>
			</div>
			{#if mine}<Avatar person={ws.data.people.agrawal} size="sm" />{/if}
		</div>
	{/each}
	{#if typing}<div class="row" style="gap: 8px">
			<Mark size={28} />
			<div style="padding: 12px 14px; border-radius: 18px; background: var(--fill-2)">
				<span class="typing"><i></i><i></i><i></i></span>
			</div>
		</div>{/if}
</div>
