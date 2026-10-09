<script lang="ts" module>
	type Quiet = { name: string; img: string; title: string; body: string };
	const MARKET: Quiet = {
		name: 'Marketplace',
		img: 'marketplace-bag',
		title: 'No lots open to you',
		body: 'Lots listed for buyers like you appear here, with their dates and terms.'
	};
	/** the screens that are about the batch in focus, and what each says on a day with none (SC-68's quiet day) */
	export const ABOUT_A_BATCH: Record<string, Quiet> = {
		journey: {
			name: 'Journey',
			img: 'sprout-box',
			title: 'No batch in a journey',
			body: 'When the Watcher flags a batch, its journey opens here: its tracker, its cluster and what its agents do.'
		},
		route: {
			name: 'Route Room',
			img: 'sprout-box',
			title: 'Nothing to route',
			body: 'When the Watcher flags a batch, its Route Room opens here with the plan for your yes.'
		},
		execution: {
			name: 'Execution',
			img: 'van',
			title: 'Nothing under way',
			body: 'Once a plan is approved, its listing, scheme orders and van round show here as they happen.'
		},
		paperwork: {
			name: 'Paperwork',
			img: 'documents',
			title: 'No papers yet',
			body: "A batch's document pack appears here once it has been routed."
		},
		offer: {
			name: 'Offer',
			img: 'kirana',
			title: 'No offers today',
			body: 'Offers arrive here as a notification, ready to order in one tap.'
		},
		market: MARKET,
		listing: MARKET,
		bids: {
			name: 'My bids',
			img: 'marketplace-bag',
			title: 'No bids yet',
			body: 'The bids you place, and the answers to them, appear here.'
		},
		pickups: {
			name: 'Pickups',
			img: 'donation-crate',
			title: 'No pickups yet',
			body: 'When a batch is donated to you, its pickup appears here to confirm.'
		}
	};
</script>

<script lang="ts">
	import Card from '../../../components/Card.svelte';
	import Empty from '../../../components/Empty.svelte';
	import { NAV } from '../../model';
	import type { User } from '../../types';
	import Screen from './Screen.svelte';

	// a screen about the batch in focus, on a day with no batch in a journey (the live workspace, SC-73): the screen's
	// own title, and what will appear here
	let { me, screen }: { me: User; screen: string } = $props();
	const nav = $derived(NAV[me.role].find((n) => n.id === screen));
	const say = $derived(ABOUT_A_BATCH[screen]);
</script>

<Screen {me} title={nav?.label ?? say.name}
	><Card style="max-width: 560px"><Empty img={say.img} title={say.title} body={say.body} /></Card></Screen
>
