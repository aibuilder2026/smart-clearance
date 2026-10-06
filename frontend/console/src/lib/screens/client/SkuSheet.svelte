<script lang="ts">
	import {
		GATE_BOUNDS,
		gateText,
		overrideError,
		possessive,
		skuGatesError,
		type BatchGates,
		type Client,
		type Sku,
		type SkuGates
	} from '@smart-clearance/api/console';
	import {
		Button,
		Card,
		Empty,
		Field,
		fmt,
		Icon,
		Input,
		SectionTitle,
		Segmented,
		Sheet,
		Textarea,
		useApp
	} from '@smart-clearance/core';
	import { api } from '#lib/api/client.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import GateChecks from './GateChecks.svelte';

	// an SKU's quick-commerce gates (the client's default, or its own), and each of its open batches with pass or fail
	// and its override (SC-47)
	let {
		open = $bindable(false),
		c,
		sku,
		batches
	}: { open?: boolean; c: Client; sku: Sku | undefined; batches: BatchGates[] } = $props();
	const app = useApp();
	const k = useConsole();

	const gateOf = (k: 'blinkitDays' | 'qcomPct') => sku?.gates[k] ?? c.gates[k];
	const hasOwn = (x: Sku) => x.gates.blinkitDays != null || x.gates.qcomPct != null;
	const num = (v: string) => (v.trim() === '' ? undefined : Number(v));

	type Form = { own: 'default' | 'own'; bl: string; qc: string };
	type Override = { ref: string; bl: string; qc: string; reason: string; err: string | null };
	let f: Form | null = $state(null);
	let err: string | null = $state(null);
	let ovr: Override | null = $state(null);
	let opened: string | null = null;
	$effect.pre(() => {
		if (open && sku && opened !== sku.id) {
			opened = sku.id;
			f = { own: hasOwn(sku) ? 'own' : 'default', bl: String(gateOf('blinkitDays')), qc: String(gateOf('qcomPct')) };
			err = null;
			ovr = null;
		}
		if (!open) opened = null;
	});
	// what the gates shown mean in days for this SKU's life
	const preview = $derived.by(() => {
		const x: Form | null = f;
		if (!x || !sku) return null;
		return {
			bl: x.own === 'own' ? num(x.bl) : c.gates.blinkitDays,
			qc: x.own === 'own' ? num(x.qc) : c.gates.qcomPct
		};
	});

	async function save() {
		if (!f || !sku) return;
		const g: SkuGates | null = f.own === 'own' ? { blinkitDays: num(f.bl), qcomPct: num(f.qc) } : null;
		const problem = skuGatesError(g);
		if (problem) return void (err = problem);
		const done = await k.act(() => api.saveSkuGates(c.id, sku.id, g), `${sku.name}'s gates saved`);
		if (done) open = false;
	}
	async function saveOverride(ref: string) {
		if (!ovr) return;
		const input = { blinkitDays: num(ovr.bl), qcomPct: num(ovr.qc), reason: ovr.reason };
		const problem = overrideError(input);
		if (problem) return void (ovr = { ...ovr, err: problem });
		const clean = {
			reason: input.reason,
			...(input.blinkitDays != null ? { blinkitDays: input.blinkitDays } : {}),
			...(input.qcomPct != null ? { qcomPct: input.qcomPct } : {})
		};
		if (await k.act(() => api.overrideBatch(c.id, ref, clean), `${ref}'s override saved`)) ovr = null;
	}
	const removeOverride = (ref: string) =>
		k.act(() => api.clearBatchOverride(c.id, ref), `${ref} is back on its SKU's gates`);
	const dist = (id: string) => c.distributors.find((x) => x.id === id);
	const change = (b: BatchGates) =>
		(ovr = {
			ref: b.ref,
			bl: b.override?.blinkitDays != null ? String(b.override.blinkitDays) : '',
			qc: b.override?.qcomPct != null ? String(b.override.qcomPct) : '',
			reason: b.override?.reason ?? '',
			err: null
		});
</script>

<Sheet bind:open title={sku?.name ?? ''} side={app.bp === 'phone' ? 'bottom' : 'side'} detent="large">
	{#snippet footer()}<Button variant="primary" size="lg" block onclick={save}>Save gates</Button>{/snippet}
	{#if sku && f}
		<div class="stack" style="gap: 18px">
			<div class="cs-gfacts">
				<span class="mono">{sku.code}</span><span>{sku.brand}</span><span><b>{fmt.inr(sku.mrp)}</b> MRP</span><span
					><b>{sku.lifeDays}</b>-day shelf life</span
				>
			</div>
			<fieldset class="cs-gset">
				<legend>Quick-commerce gates for this SKU</legend>
				<Segmented
					label="Whose gates"
					value={f.own}
					onchange={(v) => {
						err = null;
						f = { ...f!, own: v };
					}}
					options={[
						{ id: 'default', label: `${possessive(c.name)} default` },
						{ id: 'own', label: 'Its own' }
					]}
				/>
				<div class="cs-gtwo">
					<Field
						label="Blinkit takes at least"
						htmlFor="sk-bl"
						help={f.own === 'own' ? `Default: ${c.gates.blinkitDays} days` : `${possessive(c.name)} default`}
						><span class="cs-gin"
							><Input
								id="sk-bl"
								type="number"
								inputmode="numeric"
								min={GATE_BOUNDS.sku.blinkitDays[0]}
								max={GATE_BOUNDS.sku.blinkitDays[1]}
								disabled={f.own !== 'own'}
								value={f.own === 'own' ? f.bl : String(c.gates.blinkitDays)}
								oninput={(e) => {
									err = null;
									f = { ...f!, bl: e.currentTarget.value };
								}}
							/><span class="u">days</span></span
						></Field
					>
					<Field
						label="Zepto, Instamart take at least"
						htmlFor="sk-qc"
						help={f.own === 'own' ? `Default: ${c.gates.qcomPct}%` : `${possessive(c.name)} default`}
						><span class="cs-gin"
							><Input
								id="sk-qc"
								type="number"
								inputmode="numeric"
								min={GATE_BOUNDS.sku.qcomPct[0]}
								max={GATE_BOUNDS.sku.qcomPct[1]}
								disabled={f.own !== 'own'}
								value={f.own === 'own' ? f.qc : String(c.gates.qcomPct)}
								oninput={(e) => {
									err = null;
									f = { ...f!, qc: e.currentTarget.value };
								}}
							/><span class="u">% of life</span></span
						></Field
					>
				</div>
				{#if err}<div class="cs-si-error" role="alert"><Icon name="circle-alert" size={18} /><span>{err}</span></div>
				{:else if preview && preview.bl != null && preview.qc != null}<p class="cs-gmean">
						<Icon name="info" size={16} /><span
							>On its {sku.lifeDays}-day life, a batch needs <b>{preview.bl} days</b> left for Blinkit and
							<b>{Math.ceil((preview.qc * sku.lifeDays) / 100)} days</b> left for Zepto and Instamart.</span
						>
					</p>{/if}
			</fieldset>
			<SectionTitle
				sub={batches.length ? `${batches.length} open · an override holds for that batch until it closes` : null}
				>Its batches</SectionTitle
			>
			{#each batches as b (b.ref)}
				{@const d = dist(b.distributor)}
				<div class="cs-gbatch">
					<div class="cs-gtop">
						<span
							><b class="mono">{b.ref}</b>
							<span class="t-footnote subtle">{d ? `${d.name}, ${d.city}` : b.distributor}</span></span
						><span class="t-footnote"><b class="tnum">{b.daysLeft}</b> days left of {b.lifeDays}</span>
					</div>
					<GateChecks checks={b.checks} full />
					{#if ovr && ovr.ref === b.ref}
						<div class="cs-govr">
							<div class="cs-gtwo">
								<Field
									label="Blinkit, for this batch"
									htmlFor="ob-bl-{b.ref}"
									help="Days left; empty keeps the SKU's {gateOf('blinkitDays')}"
									><span class="cs-gin"
										><Input
											id="ob-bl-{b.ref}"
											type="number"
											inputmode="numeric"
											placeholder={String(gateOf('blinkitDays'))}
											value={ovr.bl}
											oninput={(e) => (ovr = { ...ovr!, bl: e.currentTarget.value, err: null })}
										/><span class="u">days</span></span
									></Field
								>
								<Field
									label="Zepto, Instamart, for this batch"
									htmlFor="ob-qc-{b.ref}"
									help="% of life; empty keeps the SKU's {gateOf('qcomPct')}%"
									><span class="cs-gin"
										><Input
											id="ob-qc-{b.ref}"
											type="number"
											inputmode="numeric"
											placeholder={String(gateOf('qcomPct'))}
											value={ovr.qc}
											oninput={(e) => (ovr = { ...ovr!, qc: e.currentTarget.value, err: null })}
										/><span class="u">% of life</span></span
									></Field
								>
							</div>
							<Field label="Why" htmlFor="ob-why-{b.ref}" help="The agents and the audit log show it with the override"
								><Textarea
									id="ob-why-{b.ref}"
									class="input"
									rows={2}
									maxlength={200}
									value={ovr.reason}
									oninput={(e) => (ovr = { ...ovr!, reason: e.currentTarget.value, err: null })}
								/></Field
							>
							{#if ovr.err}<div class="cs-si-error" role="alert">
									<Icon name="circle-alert" size={18} /><span>{ovr.err}</span>
								</div>{/if}
							<div class="row tight">
								<Button size="sm" variant="primary" onclick={() => saveOverride(b.ref)}>Save the override</Button
								><Button size="sm" variant="ghost" onclick={() => (ovr = null)}>Cancel</Button>
							</div>
						</div>
					{:else if b.override}
						<div class="cs-govr">
							<div class="cs-govr-h">
								<span>Overridden for this batch: {gateText(b.override)}</span><span class="row tight"
									><Button size="sm" variant="secondary" onclick={() => change(b)}>Change</Button><Button
										size="sm"
										variant="ghost"
										onclick={() => removeOverride(b.ref)}>Remove</Button
									></span
								>
							</div>
							<p>{b.override.reason}</p>
							<span class="cs-gwho">{b.override.by}, {b.override.at}</span>
						</div>
					{:else}
						<Button size="sm" icon="sliders-horizontal" onclick={() => change(b)} style="justify-self: start"
							>Override for this batch</Button
						>
					{/if}
				</div>
			{:else}
				<Card
					><Empty
						icon="package"
						title="No open batches"
						body="Its batches show here once the Watcher flags them, with their gates."
					/></Card
				>
			{/each}
			<p class="t-footnote subtle" style="margin: 0">
				Closed batches keep the gates they were judged by. Every change writes its line in the audit log.
			</p>
		</div>
	{/if}
</Sheet>
