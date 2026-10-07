<script lang="ts">
	import { cx } from '../../../cx';
	import { useNotice } from '../../../notice.svelte';
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Icon from '../../../icons/Icon.svelte';
	import { act } from '../../flow';
	import type { State } from '../../types';

	// once he has allowed it: what the agent does in his name, and the one switch that pauses all of it
	type Props = { p: NonNullable<State['setup']['permission']> };
	let { p }: Props = $props();
	const { toast } = useNotice();
	const flip = () => {
		act('pause', !p.paused);
		toast({
			text: p.paused ? 'Resumed · the agents carry on' : 'Paused · nothing more happens in your name',
			tone: 'ok'
		});
	};
</script>

<Card class="row wrap" style="gap: 12px"
	><span class={cx('icontile', p.paused ? 'amber' : '')} style="width: 40px; height: 40px; border-radius: 12px"
		><Icon name={p.paused ? 'circle-pause' : 'handshake'} size={19} /></span
	>
	<div class="grow" style="min-width: 0">
		<b>{p.paused ? 'Paused: nothing happens in your name' : 'Smart-Clearance acts for you'}</b>
		<div class="t-footnote muted">
			{p.paused
				? 'Listings, offers and invoice drafts wait until you resume.'
				: `Inside Munchly's floors · since ${p.at} · listings, scheme offers, invoice drafts, dispatch slots`}
		</div>
	</div>
	<Button variant={p.paused ? 'primary' : 'secondary'} size="sm" icon={p.paused ? 'play' : 'pause'} onclick={flip}
		>{p.paused ? 'Resume' : 'Pause'}</Button
	></Card
>
