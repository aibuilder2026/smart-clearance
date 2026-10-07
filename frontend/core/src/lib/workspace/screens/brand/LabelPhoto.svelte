<script lang="ts">
	import Avatar from '../../../components/Avatar.svelte';
	import Badge from '../../../components/Badge.svelte';
	import { fmt } from '../../../format';
	import { prefersReducedMotion } from '../../../motion';
	import { castOf } from '../../model';
	import PlayAs from '../common/PlayAs.svelte';
	import LabelShot from './LabelShot.svelte';
	import { useWorkspace } from '../../source';

	// the label photo as Vision sees it: dimmed and waiting for Rakesh bhai's photo, a scan line while it reads (three
	// passes, then it stops), and the verified badge once the label matches (screens/brand.jsx LabelPhoto)
	type Props = { status: 'none' | 'requested' | 'reading' | 'verified' };
	let { status }: Props = $props();
	const ws = useWorkspace();
	const c = $derived(ws.case!);
	const who = $derived(castOf(ws.state, c).distributor);
	const asked = $derived(ws.state.hero.photo.at);

	const scan = (el: HTMLElement) => {
		const a = el.animate(
			[{ top: '18%', easing: 'ease-in-out' }, { top: '78%', easing: 'ease-in-out' }, { top: '18%' }],
			{ duration: 1600, iterations: 3 }
		);
		return () => a.cancel();
	};
</script>

<div
	role="img"
	aria-label={status === 'verified'
		? `Carton label on shelf ${c.batch.shelf}: batch ${c.batch.id}, MFG ${fmt.date(c.batch.mfg)}, best before ${fmt.date(c.batch.bestBefore)}, MRP ${fmt.rate(c.sku.mrp)}`
		: 'Carton label, not yet photographed'}
	style="position: relative; width: 100%; border-radius: 16px; overflow: hidden; background: var(--surface-sunken)"
>
	<LabelShot dim={status !== 'verified'} />
	{#if status === 'reading' && !prefersReducedMotion.current}<div
			aria-hidden="true"
			{@attach scan}
			style="position: absolute; top: 18%; left: 10%; right: 10%; height: 3px; border-radius: 3px; background: var(--glow); box-shadow: 0 0 18px var(--glow)"
		></div>{/if}
	{#if status === 'verified'}<span style="position: absolute; left: 10px; bottom: 10px"
			><Badge solid tone="green" icon="check">Verified · Gemini vision · {ws.state.hero.photo.confidence}</Badge></span
		>{/if}
	{#if status === 'requested' || status === 'none'}<div
			style="position: absolute; inset: 0; display: grid; place-items: center; background: color-mix(in oklab, var(--bg) 55%, transparent); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px)"
		>
			<div class="stack tight" style="justify-items: center; text-align: center; padding: 16px">
				<Avatar person={who} size="lg" /><b
					>{status === 'requested' ? `Waiting for ${who.short}'s photo` : 'No label photo yet'}</b
				><span class="t-footnote muted"
					>{status === 'requested'
						? `Asked at ${asked} · one carton on shelf ${c.batch.shelf}`
						: 'Vision asks the godown before quoting any price'}</span
				>{#if status === 'requested'}<PlayAs who={who.id} route="photo">Take the photo as {who.short}</PlayAs>{/if}
			</div>
		</div>{/if}
</div>
