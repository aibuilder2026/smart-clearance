<script lang="ts">
	import { possessive, type Client } from '@smart-clearance/api/console';
	import { Aura, Badge, Button, Card, cx, fmt, Icon, Progress } from '@smart-clearance/core';
	import { api } from '#lib/api/client.ts';
	import { queryClient } from '#lib/api/queries.ts';
	import { useConsole } from '#lib/console.svelte.ts';

	// A client's first stock export, set up by staff (SC-84, option B; console.jsx FirstExport). At the top of the
	// client's Supply chain tab, above the distributors, SKUs and batches it brings: drop or choose the CSV, it uploads,
	// the Data agent maps its fields, then the mapping with what the file brought and who uploaded it. The workspace's
	// Setup then opens mapped, and the client's operator confirms the guardrails; the Data agent loads each day's export
	// at its time, and a journey reset keeps the mapping.
	let { c }: { c: Client } = $props();
	const k = useConsole();
	let input: HTMLInputElement | undefined = $state();
	let over = $state(false);
	let up = $state<{ name: string; p: number } | null>(null);
	const fx = $derived(c.firstExport);
	const data = $derived(c.agents.data.settings);
	const phase = $derived(up ? 'uploading' : (fx?.status ?? 'waiting'));
	const mapped = $derived(phase === 'mapped');
	const reading = $derived(phase === 'mapping');
	const cols = $derived(fx?.columns ?? []);
	const at = (iso: string | null | undefined) => {
		if (!iso) return null;
		const d = new Date(iso);
		const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
		return `${day}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
	};
	const when = $derived(at(fx?.at));
	const title = $derived(up ? up.name : fx ? fx.file : 'First stock export');
	const sub = $derived(
		mapped && fx
			? `${fmt.num(fx.rows)} rows · ${fx.distributors} distributors${fx.by ? ` · uploaded by ${fx.by}${when ? ', ' + when : ''}` : ''}`
			: reading
				? 'The Data agent is reading its columns'
				: up
					? 'Uploading'
					: `A CSV from ${possessive(c.name)} distributor management system: batches, best-before dates, stock on hand`
	);

	const start = async (f: File | null | undefined) => {
		if (!f || up) return;
		up = { name: f.name, p: 0 };
		await k.act(() => api.uploadExport(c.id, f, { onProgress: (p) => (up = up && { ...up, p }) }));
		up = null;
	};
	const pick = (e: Event & { currentTarget: HTMLInputElement }) => {
		const f = e.currentTarget.files?.[0];
		e.currentTarget.value = '';
		start(f);
	};
	const choose = () => input?.click();
	// the Data agent reports when it has read the file: the card reads the client again until it has
	$effect(() => {
		if (!reading) return;
		const id = c.id;
		const t = setInterval(() => queryClient.invalidateQueries({ queryKey: ['console', 'client', id] }), 1500);
		return () => clearInterval(t);
	});
</script>

{#snippet status()}{#if mapped}<Badge tone="green" icon="check">Mapped</Badge>{:else if reading}<Badge tone="blue" dot
			>Mapping</Badge
		>{:else if up}<Badge dot>Uploading</Badge>{:else}<Badge dot>Not uploaded yet</Badge>{/if}{/snippet}

<Card class="stack snug">
	<div class="card-head">
		<span class="row tight" style="min-width: 0"
			><span class={cx('icontile', !mapped && 'soft')}><Icon name="file-spreadsheet" size={17} stroke={2} /></span><span
				class="stack tight"
				style="gap: 0; min-width: 0"
				><b style="overflow-wrap: anywhere">{title}</b><span class="t-footnote subtle">{sub}</span></span
			></span
		><span class="row tight wrap"
			>{#if mapped}<Button size="sm" icon="upload" onclick={choose}>Replace</Button>{/if}{@render status()}</span
		>
	</div>
	{#if phase === 'waiting'}
		<!-- svelte-ignore a11y_no_static_element_interactions (dropping a file is the pointer's shortcut; Choose a CSV is the keyboard's way) -->
		<div
			class={cx('cs-drop', over && 'over')}
			ondragover={(e) => {
				e.preventDefault();
				over = true;
			}}
			ondragleave={() => (over = false)}
			ondrop={(e) => {
				e.preventDefault();
				over = false;
				start(e.dataTransfer?.files?.[0]);
			}}
		>
			<span class="icontile soft" style="width: 44px; height: 44px; border-radius: 13px"
				><Icon name="upload" size={20} stroke={2} /></span
			>
			<span class="t-subhead muted"
				>Drop the export here. The Data agent maps its columns, then loads {data.backfillDays} days of sell-through.</span
			>
			<span class="row tight wrap" style="justify-content: center"
				><Button variant="primary" icon="upload" onclick={choose}>Choose a CSV</Button><span class="t-footnote subtle"
					>or drop it here</span
				></span
			>
		</div>
	{:else if up}
		<Progress value={up.p} label="Uploading the stock export" />
	{:else}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (the region scrolls, so the keyboard must reach it) -->
		<div class="table-wrap" style="box-shadow: none" tabindex="0" role="region" aria-label="Field mapping">
			<table class="table">
				<thead><tr><th>Smart-Clearance field</th><th>Column in the file</th><th>Status</th></tr></thead>
				<tbody>
					{#each cols as x (x.field)}<tr
							><td class="strong">{x.field.replace('_', ' ')}</td><td class={x.column ? 'mono' : 'subtle'}
								>{x.column || (mapped ? 'not in the file' : 'reading…')}</td
							><td
								>{#if x.column}<Badge size="sm" tone="green" icon="check">mapped</Badge>{:else if mapped}<Badge
										size="sm">not mapped</Badge
									>{:else}<Badge size="sm" tone="blue" dot>mapping</Badge>{/if}</td
							></tr
						>{/each}
				</tbody>
			</table>
		</div>
	{/if}
	<input
		bind:this={input}
		type="file"
		accept=".csv,text/csv"
		class="sr-only"
		tabindex={-1}
		aria-hidden="true"
		onchange={pick}
	/>
	<div class="row tight t-footnote muted">
		<Aura on={reading} class="icontile soft" style="width: 26px; height: 26px; border-radius: 8px"
			><Icon name="database" size={14} /></Aura
		>{#if mapped}<span
				>The Data agent mapped {cols.filter((x) => x.column).length} of {cols.length} fields. The workspace's Setup opens
				mapped; its operator reviews the guardrails and confirms. Each day's export loads at {data.time}.</span
			>{:else if reading}<span>The Data agent is matching the file's columns to these fields.</span>{:else}<span
				>After this, the Data agent loads each day's export at {data.time}, and the client can upload one from Setup.</span
			>{/if}
	</div>
</Card>
