<script lang="ts">
	import type { Client, Profile, ProfileQuestion } from '@smart-clearance/api/console';
	import { Button, Field, Input, Sheet, Stepper, useApp } from '@smart-clearance/core';
	import { api } from '#lib/api/client.ts';
	import { useConsole } from '#lib/console.svelte.ts';
	import Choice from '../Choice.svelte';
	import ProfileSummary from '../ProfileSummary.svelte';

	// the supply-chain profile, edited: the three questions, the quick-commerce gates and the return window, with what
	// the answers set up beside them
	let { open = $bindable(false), c }: { open?: boolean; c: Client } = $props();
	const app = useApp();
	const k = useConsole();
	const questions = Object.keys(k.config.profile) as ProfileQuestion[];

	type Form = Profile & { blinkitDays: number; qcomPct: number; returnWindowDays: number };
	let f: Form | null = $state(null);
	$effect.pre(() => {
		if (open)
			f = {
				...c.profile,
				blinkitDays: c.gates.blinkitDays,
				qcomPct: c.gates.qcomPct,
				returnWindowDays: c.returnWindowDays
			};
	});

	async function save() {
		if (!f) return;
		const done = await k.act(
			() =>
				api.saveProfile(c.id, {
					profile: { route: f!.route, owner: f!.owner, expiry: f!.expiry },
					gates: { blinkitDays: f!.blinkitDays, qcomPct: f!.qcomPct },
					returnWindowDays: f!.returnWindowDays
				}),
			`${c.name}'s profile saved`
		);
		if (done) open = false;
	}
</script>

<Sheet bind:open title="Supply-chain profile" side={app.bp === 'phone' ? 'bottom' : 'side'} detent="large">
	{#snippet footer()}<Button variant="primary" size="lg" block onclick={save}>Save profile</Button>{/snippet}
	{#if f}
		<div class="stack" style="gap: 18px">
			{#each questions as q (q)}<Choice
					name="pf-{q}"
					label={k.config.profile[q].label}
					options={k.config.profile[q].options}
					value={f[q]}
					onchange={(v) => (f = { ...f!, [q]: v })}
				/>{/each}
			<Field
				label="New SKUs: Blinkit takes stock with at least"
				htmlFor="pf-bl"
				help="days of shelf life left · SKUs with gates of their own keep them"
				><Input
					id="pf-bl"
					type="number"
					min={30}
					max={180}
					value={String(f.blinkitDays)}
					oninput={(e) => (f = { ...f!, blinkitDays: Number(e.currentTarget.value) || 30 })}
				/></Field
			>
			<Field label="New SKUs: Zepto and Instamart take at least" htmlFor="pf-qc" help="% of shelf life left"
				><Input
					id="pf-qc"
					type="number"
					min={30}
					max={90}
					step={5}
					value={String(f.qcomPct)}
					oninput={(e) => (f = { ...f!, qcomPct: Number(e.currentTarget.value) || 30 })}
				/></Field
			>
			<div class="row between" style="gap: 12px">
				<span class="t-subhead">Return window, days</span><Stepper
					value={f.returnWindowDays}
					min={7}
					max={45}
					onchange={(v) => (f = { ...f!, returnWindowDays: v })}
					label="return window days"
				/>
			</div>
			<ProfileSummary profile={{ route: f.route, owner: f.owner, expiry: f.expiry }} />
		</div>
	{/if}
</Sheet>
