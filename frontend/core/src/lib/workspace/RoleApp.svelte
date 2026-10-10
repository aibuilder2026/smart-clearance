<script lang="ts">
	import { untrack } from 'svelte';
	import Card from '../components/Card.svelte';
	import Shell from '../components/Shell.svelte';
	import Skeleton from '../components/Skeleton.svelte';
	import { useApp } from '../app.svelte';
	import Icon from '../icons/Icon.svelte';
	import { rise } from '../motion/transitions';
	import { useNotice } from '../notice.svelte';
	import type { NavItem } from '../components/Shell.svelte';
	import { provideBatchFrame, provideRoute, provideWorkspaceLead, type Route } from './context';
	import { LiveView, provideLive, type PushControl } from './live.svelte';
	import {
		BATCH_PARTS,
		BATCH_PART_IDS,
		HOME,
		NAV,
		PARENT,
		batchViews,
		journeysOf,
		partAt,
		routesFor,
		shortName
	} from './model';
	import { useWorkspace } from './source';
	import type { Notification, User } from './types';
	import WorkspaceSheet from './screens/auth/WorkspaceSheet.svelte';
	import NoBatch, { ABOUT_A_BATCH } from './screens/common/NoBatch.svelte';
	import PushBanners from './screens/common/PushBanners.svelte';
	import Screen from './screens/common/Screen.svelte';
	import PushStep from './screens/live/PushStep.svelte';
	import BatchHead from './screens/brand/BatchHead.svelte';
	import BatchJourney from './screens/brand/BatchJourney.svelte';
	import BatchRecord from './screens/record/BatchRecord.svelte';
	import Batches from './screens/brand/Batches.svelte';
	import CommandCenter from './screens/brand/CommandCenter.svelte';
	import Execution from './screens/brand/Execution.svelte';
	import RouteRoom from './screens/brand/RouteRoom.svelte';
	import Setup from './screens/brand/Setup.svelte';
	import CameraScreen from './screens/trade/CameraScreen.svelte';
	import DestroyScreen from './screens/trade/DestroyScreen.svelte';
	import DistBatches from './screens/trade/DistBatches.svelte';
	import DistHome from './screens/trade/DistHome.svelte';
	import DistOrders from './screens/trade/DistOrders.svelte';
	import Listing from './screens/trade/Listing.svelte';
	import Market from './screens/trade/Market.svelte';
	import MyBids from './screens/trade/MyBids.svelte';
	import OfferDetail from './screens/trade/OfferDetail.svelte';
	import Pickups from './screens/trade/Pickups.svelte';
	import RetailHome from './screens/trade/RetailHome.svelte';
	import RetailOrders from './screens/trade/RetailOrders.svelte';
	import VanRoute from './screens/trade/VanRoute.svelte';
	import Paperwork from './screens/finance/Paperwork.svelte';
	import Report from './screens/finance/Report.svelte';
	import Audit from './screens/admin/Audit.svelte';
	import Inbox from './screens/admin/Inbox.svelte';
	import Integrations from './screens/admin/Integrations.svelte';
	import Profile from './screens/admin/Profile.svelte';
	import Rules from './screens/admin/Rules.svelte';
	import Users from './screens/admin/Users.svelte';
	import WorkspaceSettings from './screens/admin/WorkspaceSettings.svelte';

	// one person's app (screens/roles.jsx RoleApp): their shell, their navigation, the screen the route names. Everyone
	// but the ExpireSoon buyer is inside Munchly's workspace, so the product's mark leads the shell and the workspace sits
	// under it. The app keys it by person, so each person starts fresh. On the live workspace (SC-73) it keeps the journey
	// clock and the connection for every screen, says when the stream is back, shows a screen about a batch as empty on a
	// day with none in a journey, and puts the first-run push step before the first screen after a sign-in
	type Props = {
		me: User;
		route: Route | null;
		/** go to a screen; replace swaps the current history entry */
		ongo: (r: Route & { replace?: boolean }) => void;
		onback: () => void;
		/** the label photo opens the phone's camera */
		realCamera?: boolean;
		/** the first sign-in on this device ends on one step that asks for notifications (the live workspace) */
		pushStep?: { push: PushControl; done: () => void } | null;
	};
	let { me, route, ongo, onback, realCamera, pushStep }: Props = $props();

	const allowed = $derived(routesFor(me.role));
	const name = $derived(route?.name || HOME[me.role]);
	const safe = $derived(allowed.includes(name) ? name : HOME[me.role]);
	const inside = $derived(me.role !== 'buyer');
	const ws = useWorkspace();
	const app = useApp();

	// the operator reads the workspace top down (SC-112, screens/roles.jsx): the workspace's own places, then a batch, then
	// the batch's screens as tabs under its head. A batch screen names its batch (a screen opened without one keeps the
	// batch it was on, else the first in a journey); a batch in no journey has its Journey alone; its back link goes to
	// where the batch was opened from. The sidebar lists the batches still in a journey, by name and stop
	const operator = $derived(me.role === 'operator');
	const items = $derived(operator ? journeysOf(ws.state, ws.data, ws.cases, ws.case) : []);
	const batchRoute = $derived(operator && BATCH_PART_IDS.includes(safe));
	let lastRef = $state<string | null>(null);
	const wantRef = $derived(route?.params?.ref ?? (batchRoute ? lastRef : null));
	const it = $derived(batchRoute ? ((wantRef ? items.find((i) => i.ref === wantRef) : items[0]) ?? null) : null);
	const bv = $derived(
		batchRoute
			? it
				? it.view
				: (batchViews(ws.state, ws.data).find((v) => v.id === (wantRef ?? ws.case?.batch.id)) ?? null)
			: null
	);
	const inBatch = $derived(!!bv);
	const part = $derived(it ? safe : 'journey');
	$effect(() => {
		if (bv) untrack(() => (lastRef = bv.id));
	});
	const WHERE: Record<string, string> = {
		command: 'Command Center',
		batches: 'Batches',
		inbox: 'Inbox',
		report: 'Ledger',
		setup: 'Setup',
		profile: 'Profile'
	};
	let from = $state('command');
	let partBefore = $state<string | null>(null);
	let prev = untrack(() => safe);
	$effect.pre(() => {
		const n = safe;
		untrack(() => {
			if (n === prev) return;
			if (BATCH_PART_IDS.includes(n) && !BATCH_PART_IDS.includes(prev) && WHERE[prev]) from = prev;
			partBefore = BATCH_PART_IDS.includes(prev) ? prev : null;
			prev = n;
		});
	});
	const SIDEBAR_BATCHES = 5;
	const open = $derived(items.filter((i) => i.stage < 9));
	const nav = $derived.by((): NavItem[] => {
		if (!operator) return NAV[me.role];
		const shown = open.slice(0, open.length > SIDEBAR_BATCHES + 1 ? SIDEBAR_BATCHES : open.length);
		const batches: NavItem[] = shown.map((b, i) => ({
			id: 'batch:' + b.ref,
			label: shortName(b.view.skuObj),
			icon: 'boxes',
			product: b.view.skuObj.img,
			stop: b.stop,
			human: b.human,
			phoneHidden: true,
			section: i === 0 ? `In a journey · ${open.length}` : undefined,
			aria: `${b.view.skuObj.name}, ${b.ref}, at ${b.stop}${b.human ? ', needs your yes' : ''}`
		}));
		if (open.length > shown.length)
			batches.push({
				id: 'more',
				label: `${open.length - shown.length} more in Batches`,
				icon: 'ellipsis',
				phoneHidden: true
			});
		const ops = NAV.operator;
		return [ops[0], ops[1], ops[2], ...batches, ...ops.slice(3)];
	});
	const current = $derived(
		inBatch
			? app.bp !== 'phone' && it && open.some((o) => o.ref === it.ref)
				? 'batch:' + it.ref
				: from
			: PARENT[safe] || safe
	);
	function onnav(id: string) {
		if (id === 'more') return ongo({ name: 'batches' });
		if (id.startsWith('batch:')) {
			const ref = id.slice(6);
			return ongo({ name: partAt(items.find((i) => i.ref === ref)), params: { ref } });
		}
		ongo({ name: id, replace: true });
	}
	provideBatchFrame({
		get on() {
			return inBatch;
		},
		get title() {
			return bv ? `${shortName(bv.skuObj)} · ${BATCH_PARTS.find((p) => p.id === part)?.label}` : '';
		},
		get back() {
			return WHERE[from] ?? WHERE.command;
		},
		get head() {
			return batchHead;
		}
	});
	const display = $derived({ ...me, role: ws.data.roles[me.role] });
	let wsOpen = $state(false);
	const { toast } = useNotice();

	// the live workspace's clock and connection, for every screen; on the stub there is no clock and nothing draws
	const live = new LiveView(ws);
	provideLive(live);
	$effect(() => (live.on ? live.start() : undefined));
	// a dropped stream is remembered at the journey time it dropped; back live, a toast says it caught up
	let wasDown = false;
	$effect(() => {
		const down = live.down;
		if (!live.on) return;
		untrack(() => {
			if (!down && wasDown) toast({ text: `Back live. Caught up from ${live.since}.`, tone: 'ok', icon: 'activity' });
			live.observe(down);
			wasDown = down;
		});
	});
	// a screen about the batch in focus, on a day with none: empty, or a moment while the batch asked for is read
	// a partner's own history reads without a batch in a journey (SC-130): a kirana's orders and an earlier offer, a food
	// bank's pickups, and every screen of a distributor's, batch by batch (SC-133)
	const ownHistory = $derived(
		(me.role === 'retailer' && (safe === 'orders' || (safe === 'offer' && !!route?.params?.ref))) ||
			(me.role === 'foodbank' && safe === 'pickups') ||
			me.role === 'distributor'
	);
	const noBatch = $derived(!ws.case && !!ABOUT_A_BATCH[safe] && !ownHistory);
	const reading = $derived(noBatch && (ws.cases?.length ?? 0) > 0);

	provideRoute({
		get route() {
			return inBatch && bv ? { name: part, params: { ref: bv.id } } : { name: safe, params: route?.params };
		},
		go: (n, params) => ongo({ name: n, params }),
		back: () => onback()
	});
	// svelte-ignore state_referenced_locally (the app keys this component by person, so who it is never changes here)
	provideWorkspaceLead(
		inside ? { name: ws.data.workspace.name, domain: ws.data.workspace.domain, open: () => (wsOpen = true) } : null
	);
	// the batch the address names, when it names one; the source decides what is in focus
	// (only when the address changes: a tab on the Command Center puts another batch in focus without changing it). A
	// screen opened without a batch keeps the one in focus, so the sidebar moves between its screens (SC-91)
	$effect(() => {
		const ref = route?.params?.ref ?? null;
		if (ref) untrack(() => ws.setFocus(ref));
	});

	// a new screen starts at its top: the page scrolls inside #main
	$effect.pre(() => {
		void safe;
		void route?.params?.ref;
		document.getElementById('main')?.scrollTo(0, 0);
	});

	function openNote(n: Notification) {
		void ws.markRead([n.id]);
		// a push about the batch opens its Route Room on it
		if (n.link && allowed.includes(n.link))
			ongo({ name: n.link, params: n.link === 'route' && ws.case ? { ref: ws.case.batch.id } : undefined });
	}
</script>

{#snippet esBrand()}<span class="row tight"
		><span class="es-logo" aria-hidden="true"><Icon name="hourglass" size={16} stroke={2.2} /></span><span
			class="es-word">ExpireSoon</span
		></span
	>{/snippet}
{#snippet esMark()}<span class="es-logo" style="width: 36px; height: 36px; border-radius: 11px"
		><Icon name="hourglass" size={18} stroke={2.2} /></span
	>{/snippet}

{#snippet batchHead()}{#if bv}<BatchHead
			{it}
			v={bv}
			{part}
			from={partBefore}
			onpart={(p) => ongo({ name: p, params: { ref: bv.id }, replace: true })}
		/>{/if}{/snippet}

{#snippet shell()}
	<Shell
		{nav}
		{current}
		{onnav}
		user={display}
		onuser={() => ongo({ name: 'profile' })}
		ws={inside ? ws.data.workspace : null}
		onworkspace={() => (wsOpen = true)}
		brand={me.role === 'buyer' ? esBrand : undefined}
		brandMark={me.role === 'buyer' ? esMark : undefined}
	>
		{#key inBatch && bv ? 'batch:' + bv.id : safe}
			<div in:rise={{ y: 6, duration: 180 }} class={inBatch ? 'bpage' : undefined}>
				{#if pushStep}<PushStep {me} push={pushStep.push} ondone={pushStep.done} />
				{:else if inBatch && bv}{#if it && part === 'record'}<BatchRecord
							{me}
							at={it.ref}
						/>{:else if !it || part === 'journey'}<BatchJourney {me} {it} v={bv} />{:else if part === 'route'}<RouteRoom
							{me}
						/>{:else if ws.case?.batch.id !== it.ref}<Screen {me} title={bv.skuObj.name}
							><Card class="stack" style="gap: 14px" aria-busy="true"
								>{#each [0, 1, 2] as i (i)}<Skeleton h={i ? 18 : 44} r={i ? 6 : 12} />{/each}</Card
							></Screen
						>{:else if part === 'execution'}<Execution {me} />{:else}<Paperwork {me} />{/if}
				{:else if reading}<Screen {me} title={ABOUT_A_BATCH[safe].name}
						><Card class="stack" style="gap: 14px" aria-busy="true"
							>{#each [0, 1, 2] as i (i)}<Skeleton h={i ? 18 : 44} r={i ? 6 : 12} />{/each}</Card
						></Screen
					>
				{:else if noBatch}<NoBatch {me} screen={safe} />
				{:else if safe === 'command'}<CommandCenter {me} />
				{:else if safe === 'route'}<RouteRoom {me} />
				{:else if safe === 'execution'}<Execution {me} />
				{:else if safe === 'batches'}{#if me.role === 'distributor'}<DistBatches {me} />{:else}<Batches {me} />{/if}
				{:else if safe === 'setup'}<Setup {me} />
				{:else if safe === 'report'}<Report {me} />
				{:else if safe === 'paperwork'}<Paperwork {me} />
				{:else if safe === 'home'}{#if me.role === 'retailer'}<RetailHome {me} />{:else}<DistHome {me} />{/if}
				{:else if safe === 'photo'}<CameraScreen {me} {realCamera} />
				{:else if safe === 'van'}<VanRoute {me} />
				{:else if safe === 'destroy'}<DestroyScreen {me} />
				{:else if safe === 'orders'}{#if me.role === 'retailer'}<RetailOrders {me} />{:else}<DistOrders {me} />{/if}
				{:else if safe === 'offer'}<OfferDetail {me} />
				{:else if safe === 'market'}<Market {me} />
				{:else if safe === 'listing'}<Listing {me} />
				{:else if safe === 'bids'}<MyBids {me} />
				{:else if safe === 'pickups'}<Pickups {me} />
				{:else if safe === 'workspace'}<WorkspaceSettings {me} />
				{:else if safe === 'users'}<Users {me} />
				{:else if safe === 'rules'}<Rules {me} />
				{:else if safe === 'integrations'}<Integrations {me} />
				{:else if safe === 'audit'}<Audit {me} />
				{:else if safe === 'inbox'}<Inbox {me} routes={allowed} />
				{:else if safe === 'profile'}<Profile {me} />
				{/if}
			</div>
		{/key}
	</Shell>
{/snippet}

<PushBanners {me} onopen={openNote} />
{#if me.role === 'buyer'}<div class="esw">{@render shell()}</div>{:else}{@render shell()}{/if}
{#if inside}<WorkspaceSheet
		bind:open={wsOpen}
		{me}
		onsettings={allowed.includes('workspace')
			? () => {
					wsOpen = false;
					ongo({ name: 'workspace' });
				}
			: null}
	/>{/if}
