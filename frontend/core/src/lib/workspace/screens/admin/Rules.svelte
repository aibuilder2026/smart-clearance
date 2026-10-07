<script lang="ts">
	import { useApp } from '../../../app.svelte';
	import Button from '../../../components/Button.svelte';
	import List from '../../../components/List.svelte';
	import ListRow from '../../../components/ListRow.svelte';
	import Stepper from '../../../components/Stepper.svelte';
	import Switch from '../../../components/Switch.svelte';
	import { useNotice } from '../../../notice.svelte';
	import { useWorkspace } from '../../source';
	import type { Rules, User } from '../../types';
	import Screen from '../common/Screen.svelte';

	// guardrails: what the agents may and may not do in Munchly's name — floors, approvals, the territory guard, offers,
	// the planning assumptions and the write-off factors — saved as one change (screens/admin.jsx Rules)
	let { me }: { me: User } = $props();
	const ws = useWorkspace();
	const app = useApp();
	const { toast } = useNotice();

	let r = $state.raw<Rules>(ws.state.rules);
	const dirty = $derived(JSON.stringify(r) !== JSON.stringify(ws.state.rules));
	const set = <K extends keyof Rules>(k: K, v: Rules[K]) => (r = { ...r, [k]: v });
	const setFloor = (k: string, v: number) => (r = { ...r, floors: { ...r.floors, [k]: v } });
	const save = () => {
		// the rules, then their line in the audit log
		void ws.saveRules(r);
		toast({ text: 'Guardrails saved · agents use them from the next run', tone: 'ok' });
	};
	const floorTitle = (k: string) => k.replace('-', ' ').replace(/^./, (c) => c.toUpperCase());
</script>

{#snippet saveAction()}{#if app.bp !== 'phone'}<Button
			variant="primary"
			size="sm"
			icon="check"
			disabled={!dirty}
			onclick={save}>Save</Button
		>{/if}{/snippet}

{#snippet approvalTaps()}<Stepper
		value={r.approvalTaps}
		onchange={(v) => set('approvalTaps', v)}
		min={1}
		max={50}
		label="Routes needing approval"
	/>{/snippet}
{#snippet requirePhoto()}<Switch
		checked={r.requirePhoto}
		onchange={(v) => set('requirePhoto', v)}
		label="Require a label photo"
	/>{/snippet}
{#snippet territoryGuard()}<Switch
		checked={r.territoryGuard}
		onchange={(v) => set('territoryGuard', v)}
		label="Territory guard"
	/>{/snippet}
{#snippet hindiOffers()}<Switch
		checked={r.hindiOffers}
		onchange={(v) => set('hindiOffers', v)}
		label="Hindi offers"
	/>{/snippet}
{#snippet offerWindow()}<Stepper
		value={r.offerWindowHours}
		onchange={(v) => set('offerWindowHours', v)}
		min={12}
		max={96}
		step={12}
		label="Offer window hours"
		format={(v) => v + ' h'}
	/>{/snippet}
{#snippet tokenPct()}<Stepper
		value={r.tokenPct}
		onchange={(v) => set('tokenPct', v)}
		min={5}
		max={30}
		step={5}
		label="Token percent"
		format={(v) => v + '%'}
	/>{/snippet}
{#snippet returnWindow()}<Stepper
		value={r.returnWindowDays}
		onchange={(v) => set('returnWindowDays', v)}
		min={15}
		max={30}
		label="Return window"
		format={(v) => v + ' days'}
	/>{/snippet}
{#snippet watchTime()}<span class="tnum strong">{r.watchTime}</span>{/snippet}
{#snippet uplift()}<Stepper
		value={r.kiranaUplift}
		onchange={(v) => set('kiranaUplift', Math.round(v * 10) / 10)}
		min={2}
		max={5}
		step={0.5}
		label="Scheme uplift"
		format={(v) => v.toFixed(1) + '×'}
	/>{/snippet}
{#snippet van()}<Stepper
		value={r.vanPerUnit}
		onchange={(v) => set('vanPerUnit', Math.round(v * 100) / 100)}
		min={0.25}
		max={2}
		step={0.25}
		label="Van rate"
		format={(v) => '₹' + v.toFixed(2)}
	/>{/snippet}
{#snippet disposal()}<Stepper
		value={r.disposalPerUnit}
		onchange={(v) => set('disposalPerUnit', Math.round(v * 100) / 100)}
		min={0.5}
		max={5}
		step={0.25}
		label="Disposal per unit"
		format={(v) => '₹' + v.toFixed(2)}
	/>{/snippet}
{#snippet epr()}<Stepper
		value={r.eprPerKg}
		onchange={(v) => set('eprPerKg', v)}
		min={1}
		max={20}
		label="EPR per kg"
		format={(v) => '₹' + v}
	/>{/snippet}

<Screen {me} title="Guardrails" sub="What the agents may and may not do in Munchly's name" actions={saveAction}>
	<div
		style="display: grid; gap: 20px; grid-template-columns: {app.bp === 'desktop'
			? 'repeat(2, minmax(0,1fr))'
			: 'minmax(0,1fr)'}; align-items: start"
	>
		<div class="stack" style="gap: 20px">
			<List head="Floor price, % of MRP" foot="No channel sells below its category's floor."
				>{#each Object.keys(r.floors) as k (k)}{#snippet floor()}<Stepper
							value={r.floors[k]}
							onchange={(v) => setFloor(k, v)}
							min={20}
							max={70}
							step={5}
							label={'Floor for ' + k}
							format={(v) => v + '%'}
						/>{/snippet}<ListRow title={floorTitle(k)} value={floor} />{/each}</List
			>
			<List head="Approvals"
				><ListRow title="Routes per channel that need a tap" value={approvalTaps} /><ListRow
					title="Require a label photo before pricing"
					value={requirePhoto}
				/></List
			>
			<List head="Territory guard" foot="Matched by pincode against the four distributor territories."
				><ListRow
					title="Hide ExpireSoon listings from buyers inside Munchly's territories"
					value={territoryGuard}
				/></List
			>
		</div>
		<div class="stack" style="gap: 20px">
			<List head="Offers and marketplace"
				><ListRow title="Kirana offers in Hindi" value={hindiOffers} /><ListRow
					title="Offer window"
					value={offerWindow}
				/><ListRow title="Buyer token" value={tokenPct} /><ListRow
					title="Scheme returns, days before best-before"
					value={returnWindow}
				/><ListRow title="Watcher runs daily at" value={watchTime} /></List
			>
			<List head="Planning assumptions" foot="Used to size the kirana scheme and its cost."
				><ListRow title="Scheme uplift on normal sales" value={uplift} /><ListRow
					title="Van rate, a unit"
					value={van}
				/></List
			>
			<List head="Write-off factors" foot="Used for the true cost of destroying a batch. Both are indicative."
				><ListRow title="Disposal, a unit" value={disposal} /><ListRow
					title="EPR, a kg of product and pack"
					value={epr}
				/></List
			>
			{#if app.bp === 'phone'}<Button variant="primary" size="lg" icon="check" disabled={!dirty} onclick={save}
					>Save guardrails</Button
				>{/if}
		</div>
	</div>
</Screen>
