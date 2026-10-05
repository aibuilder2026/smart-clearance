<script lang="ts">
	import type { Client, Exits, Rules } from '@smart-clearance/api/console';
	import {
		Badge,
		Button,
		Columns,
		List,
		ListRow,
		SectionTitle,
		Stepper,
		Switch,
		type IconName
	} from '@smart-clearance/core';
	import { api } from '#lib/api/client.ts';
	import { useConsole } from '#lib/console.svelte.ts';

	// a client's channels and rules: the exits the agents may use, and the limits they work inside. Edited together and
	// saved or discarded together
	let { c }: { c: Client } = $props();
	const k = useConsole();
	const savedRules = $derived(JSON.stringify(c.rules));
	const savedExits = $derived(JSON.stringify(c.exits));
	// svelte-ignore state_referenced_locally
	let r: Rules = $state(JSON.parse(savedRules));
	// svelte-ignore state_referenced_locally
	let ex: Exits = $state(JSON.parse(savedExits));
	const discard = () => {
		r = JSON.parse(savedRules);
		ex = JSON.parse(savedExits);
	};
	$effect.pre(discard);
	const dirty = $derived(JSON.stringify(r) !== savedRules || JSON.stringify(ex) !== savedExits);
	const set = <K extends keyof Rules>(key: K, v: Rules[K]) => (r = { ...r, [key]: v });
	const save = () =>
		k.act(
			() => api.saveRules(c.id, { rules: $state.snapshot(r), exits: $state.snapshot(ex) }),
			'Channels and rules saved'
		);
</script>

{#snippet staffCap()}<Stepper
		value={r.staffCap}
		min={0}
		max={500}
		step={10}
		onchange={(v) => set('staffCap', v)}
		label="staff sale cap"
	/>{/snippet}
{#snippet offerWindow()}<Stepper
		value={r.offerWindowHours}
		min={12}
		max={96}
		step={12}
		onchange={(v) => set('offerWindowHours', v)}
		label="offer window hours"
	/>{/snippet}
{#snippet hindi()}<Switch
		checked={r.hindiOffers}
		onchange={(v) => set('hindiOffers', v)}
		label="Kirana offers in Hindi first"
	/>{/snippet}
{#snippet photo()}<Switch
		checked={r.requirePhoto}
		onchange={(v) => set('requirePhoto', v)}
		label="Label photo before any plan"
	/>{/snippet}
{#snippet baseline()}<Badge size="sm">baseline</Badge>{/snippet}

<div class="stack" style="gap: 18px">
	{#snippet main()}
		<SectionTitle sub="The exits the agents may price and use; the bin is always the baseline">Exits</SectionTitle>
		<List>
			{#each k.config.exits as e (e.id)}
				{#snippet toggle()}<Switch
						checked={!!ex[e.id].on}
						disabled={!!ex[e.id].locked}
						onchange={(v) => (ex = { ...ex, [e.id]: { ...ex[e.id], on: v } })}
						label="{e.name} for {c.name}"
					/>{/snippet}
				<ListRow
					icon={e.icon as IconName}
					iconTone="soft"
					title={e.name}
					sub={ex[e.id].locked || (e.id === 'staff' ? `Up to ${r.staffCap} packs a godown` : undefined)}
					value={toggle}
				/>
			{/each}
			<ListRow
				icon="trash-2"
				iconTone="red"
				title="The bin"
				sub="Priced every time, so every plan shows what it saves"
				value={baseline}
			/>
		</List>
	{/snippet}
	{#snippet side()}
		<SectionTitle sub="The limits every agent works inside">Guardrails</SectionTitle>
		<List>
			<ListRow title="Staff sale cap" sub="packs per godown" value={staffCap} />
			<ListRow title="Offer window" sub="hours a kirana offer stays open" value={offerWindow} />
			<ListRow title="Kirana offers in Hindi first" sub="with an English toggle" value={hindi} />
			<ListRow
				title="Label photo before any plan"
				sub="Vision reads the date off the shelf, not the spreadsheet"
				value={photo}
			/>
		</List>
	{/snippet}
	<Columns sideWidth={460} {main} {side} />
	<div class="row" style="justify-content: flex-end; gap: 10px">
		<Button disabled={!dirty} onclick={discard}>Discard</Button><Button
			variant="primary"
			disabled={!dirty}
			onclick={save}>Save changes</Button
		>
	</div>
</div>
