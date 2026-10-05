<script lang="ts">
	import type { Agent, Client, SettingField, SettingValue } from '@smart-clearance/api/console';
	import { Field, Input, List, ListRow, Select, Stepper, Switch } from '@smart-clearance/core';

	type Props = { f: SettingField; c: Client; agent: Agent; value: SettingValue; onchange: (v: SettingValue) => void };
	let { f, c, agent, value, onchange }: Props = $props();
	const id = $derived(`set-${agent.id}-${f.key}`);
	// who can approve plans: the client's active people who sign in as staff
	const approvers = $derived(
		c.people.filter((p) => p.status === 'active' && ['Approver', 'Admin', 'Member'].includes(p.access))
	);
	// a number is kept inside its limits once it is entered (on change), so it can be typed freely first
	const clamp = (raw: string) =>
		Math.max(f.min ?? -Infinity, Math.min(f.max ?? Infinity, raw === '' ? (f.min ?? 0) : Number(raw)));
</script>

<!-- one of an agent's settings, drawn by its type (console.jsx SettingField) -->
{#if f.type === 'switch'}
	{#snippet toggle()}<Switch checked={!!value} disabled={!!f.locked} {onchange} label={f.label} />{/snippet}
	<List><ListRow title={f.label} sub={f.locked || undefined} value={toggle} /></List>
{:else if f.type === 'stepper'}
	<div class="row between" style="gap: 12px">
		<span class="t-subhead">{f.label}</span><Stepper
			value={Number(value)}
			min={f.min}
			max={f.max}
			{onchange}
			label={f.label.toLowerCase()}
		/>
	</div>
{:else if f.type === 'approver'}
	<Field label={f.label} htmlFor={id} help="Plans go to this person's phone; nothing moves until they tap Approve.">
		<Select {id} value={String(value || '')} onchange={(e) => onchange(e.currentTarget.value)}>
			{#if !approvers.length}<option value="">No one yet</option>{/if}
			{#each approvers as p (p.id)}<option value={p.id}>{p.name} · {p.role}</option>{/each}
		</Select>
	</Field>
{:else if f.type === 'select'}
	<Field label={f.label} htmlFor={id}>
		<Select {id} value={String(value)} onchange={(e) => onchange(e.currentTarget.value)}>
			{#each f.options ?? [] as o (o)}<option>{o}</option>{/each}
		</Select>
	</Field>
{:else if f.type === 'time'}
	<Field label={f.label} htmlFor={id}
		><Input {id} type="time" value={String(value)} oninput={(e) => onchange(e.currentTarget.value)} /></Field
	>
{:else}
	<Field label={f.label} htmlFor={id} help={f.unit && f.type !== 'money' ? f.unit : undefined}
		><Input
			{id}
			type="number"
			inputmode="decimal"
			min={f.min}
			max={f.max}
			step={f.step || 1}
			value={String(value)}
			oninput={(e) => e.currentTarget.value !== '' && onchange(Number(e.currentTarget.value))}
			onchange={(e) => {
				const v = clamp(e.currentTarget.value);
				e.currentTarget.value = String(v);
				onchange(v);
			}}
			icon={f.type === 'money' ? 'indian-rupee' : undefined}
		/></Field
	>
{/if}
